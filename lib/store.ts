/* Global store, now backed by Supabase.
 *
 * The shape and the function names are unchanged from the in-memory version,
 * so the ported view components did not need rewriting — what changed is that
 * every mutation writes to Postgres and then refreshes.
 *
 * Refresh strategy: after any write, reload everything. The dataset is a few
 * dozen rows, and a full reload removes a whole class of local/remote drift
 * bugs. If this ever grows past a few hundred candidates, narrow it then.
 *
 * Attribution: every insert stamps created_by with the signed-in account,
 * because the RLS insert policies require created_by = auth.uid(). The
 * database rejects anything else.
 */

import { supabase, CV_BUCKET } from './supabase/client';
import { formatDate, relativeTime, todayIso } from './format';
import type { TablesUpdate } from './database.types';
import {
  AVA,
  Candidate,
  CvFile,
  Job,
  Note,
  SEGC,
  STAGES,
  Settings,
  Source,
  Stage,
} from './types';

export interface JobForm {
  title?: string;
  location?: string;
  description?: string;
  source?: string;
  status?: string;
  name?: string;
  email?: string;
  linkedinUrl?: string;
  stage?: string;
  rating?: number;
  cvFile?: File | null;
}

export interface AppState {
  jobs: Job[];
  settings: Settings | null;
  /* Signed-in account, needed for created_by on every insert. */
  userId: string | null;
  userName: string;
  loading: boolean;
  error: string | null;
  busy: boolean;

  jobId: string | null;
  modal: 'job' | 'cand' | null;
  stageF: string;
  ratingF: string;
  statusF: string;
  search: string;
  form: JobForm;
  note: string;
}

let state: AppState = {
  jobs: [],
  settings: null,
  userId: null,
  userName: '',
  loading: true,
  error: null,
  busy: false,
  jobId: null,
  modal: null,
  stageF: 'All',
  ratingF: 'All',
  statusF: 'All',
  search: '',
  form: {},
  note: '',
};

const listeners = new Set<() => void>();

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getState(): AppState {
  return state;
}

export function getServerState(): AppState {
  return state;
}

function emit() {
  listeners.forEach((fn) => fn());
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
}

/* ---------------------------------------------------------------- loading */

interface ProfileRow {
  id: string;
  full_name: string;
}

export async function loadAll(): Promise<void> {
  const db = supabase();

  /* A stale cookie can still satisfy PostgREST (it only checks the signature)
   * while the session behind it is gone — revoked elsewhere, password
   * changed, account removed. That left the UI looking signed in while every
   * write failed with "Not signed in.". Treat it as signed out instead. */
  const { data: auth, error: authError } = await db.auth.getUser();
  if (authError || !auth.user) {
    try {
      await db.auth.signOut();
    } catch {
      /* the session is already gone; the local cookie is cleared regardless */
    }
    setState({
      loading: false,
      userId: null,
      error: 'Your session has expired. Please sign in again.',
    });
    return;
  }
  const userId = auth.user.id;
  const userEmail = auth.user.email ?? '';

  const [jobsRes, candsRes, notesRes, profilesRes, settingsRes] = await Promise.all([
    db.from('jobs').select('*').order('posted_on', { ascending: false }),
    db.from('candidates').select('*').order('applied_on', { ascending: true }),
    db.from('candidate_notes').select('*').order('created_at', { ascending: true }),
    db.from('profiles').select('id, full_name'),
    db.from('app_settings').select('*').eq('id', 1).maybeSingle(),
  ]);

  const firstError =
    jobsRes.error || candsRes.error || notesRes.error || profilesRes.error || settingsRes.error;
  if (firstError) {
    setState({ loading: false, error: firstError.message });
    return;
  }

  const profiles = new Map<string, string>();
  for (const p of (profilesRes.data ?? []) as ProfileRow[]) {
    profiles.set(p.id, p.full_name ?? '');
  }

  /* An account created from the Supabase dashboard has no full_name until
   * someone sets one. Fall back to the email local part for the signed-in
   * user — the only person whose email this client is allowed to see. */
  const displayName = (id: string | null): string => {
    if (!id) return 'Unattributed';
    const name = profiles.get(id);
    if (name) return name;
    if (id === userId) return userEmail.split('@')[0] || 'You';
    return 'A teammate';
  };

  const notesByCand = new Map<string, Note[]>();
  for (const n of notesRes.data ?? []) {
    const list = notesByCand.get(n.candidate_id) ?? [];
    list.push({
      id: n.id,
      who: displayName(n.created_by),
      when: relativeTime(n.created_at),
      text: n.body,
      createdBy: n.created_by,
    });
    notesByCand.set(n.candidate_id, list);
  }

  const candsByJob = new Map<string, Candidate[]>();
  for (const c of candsRes.data ?? []) {
    const cv: CvFile | null =
      c.cv_object_path && c.cv_file_name && c.cv_mime_type && c.cv_size_bytes !== null
        ? {
            path: c.cv_object_path,
            fileName: c.cv_file_name,
            mimeType: c.cv_mime_type,
            sizeBytes: c.cv_size_bytes,
          }
        : null;

    const list = candsByJob.get(c.job_id) ?? [];
    list.push({
      id: c.id,
      jobId: c.job_id,
      name: c.full_name,
      email: c.email ?? '',
      phone: c.phone ?? '',
      linkedinUrl: c.linkedin_url ?? '',
      source: c.source as Source,
      stage: c.stage as Stage,
      rating: c.rating,
      short: c.is_shortlisted,
      date: formatDate(c.applied_on),
      appliedOn: c.applied_on,
      archivedAt: c.archived_at,
      cv,
      notes: notesByCand.get(c.id) ?? [],
      addedBy: displayName(c.created_by),
    });
    candsByJob.set(c.job_id, list);
  }

  const jobs: Job[] = (jobsRes.data ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    location: j.location ?? '',
    description: j.description ?? '',
    source: j.source as Source,
    status: j.status as 'Open' | 'Closed',
    posted: formatDate(j.posted_on),
    postedOn: j.posted_on,
    archivedAt: j.archived_at,
    cands: candsByJob.get(j.id) ?? [],
  }));

  const st = settingsRes.data;
  const settings: Settings | null = st
    ? {
        careersInboxEmail: st.careers_inbox_email ?? '',
        defaultPipeline: st.default_pipeline,
        requireEmailOnNewCandidates: st.require_email_on_new_candidates,
        emailOnShortlistAdd: st.email_on_shortlist_add,
        requireCvBeforeInterview: st.require_cv_before_interview,
      }
    : null;

  setState({
    jobs,
    settings,
    userId,
    /* A dashboard-created account has no full_name until someone sets one,
     * so fall back to the local part of the email rather than showing blank. */
    userName: displayName(userId),
    loading: false,
    /* Deliberately does NOT clear `error`: a mutation may have set a partial
     * -success notice (candidate saved, CV failed) just before this reload,
     * and it must survive. withBusy clears the error before every write. */
    jobId: state.jobId ?? jobs.find((j) => !j.archivedAt)?.id ?? jobs[0]?.id ?? null,
  });
}

export function resetStore() {
  state = { ...state, jobs: [], settings: null, userId: null, userName: '', loading: true };
  emit();
}

/* Supabase returns plain objects (PostgrestError, StorageError), not Error
 * instances, so `String(e)` renders them as "[object Object]". Pull out
 * whatever human-readable text is actually there. */
/* The database enforces both of these, but a raw constraint violation is a
 * poor thing to show someone mid-typing. Catch them here with plain wording,
 * and fix the one that is safe to fix automatically. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function cleanEmail(raw: string | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  if (!EMAIL_RE.test(v)) {
    throw new Error(
      'That email address does not look right: "' + v + '". Use the form name@example.com, or leave it blank.'
    );
  }
  return v;
}

/* A pasted LinkedIn URL usually arrives as "linkedin.com/in/name" with no
 * scheme, which the linkedin_url check constraint rejects. Add it rather
 * than making someone retype the line. */
function cleanUrl(raw: string | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : 'https://' + v.replace(/^\/+/, '');
}

export function errorMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object') {
    const o = e as Record<string, unknown>;
    const parts = [o.message, o.error_description, o.error, o.details, o.hint]
      .filter((v): v is string => typeof v === 'string' && v.trim() !== '');
    if (parts.length) {
      const seen = new Set<string>();
      const unique = parts.filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
      const code = typeof o.code === 'string' && o.code ? ' (' + o.code + ')' : '';
      return unique.join(' — ') + code;
    }
    try {
      return JSON.stringify(e);
    } catch {
      /* fall through */
    }
  }
  return 'Something went wrong. Check the browser console for details.';
}

async function withBusy<T>(fn: () => Promise<T>): Promise<T | null> {
  setState({ busy: true, error: null });
  try {
    const result = await fn();
    await loadAll();
    return result;
  } catch (e) {
    setState({ error: errorMessage(e) });
    return null;
  } finally {
    setState({ busy: false });
  }
}

function requireUser(): string {
  if (!state.userId) throw new Error('Not signed in.');
  return state.userId;
}

/* ------------------------------------------------------------- selectors */

export interface CandidateWithJob extends Candidate {
  jobTitle: string;
  jobArchivedAt: string | null;
}

export function candidateById(s: AppState, id: string): CandidateWithJob | undefined {
  return allCands(s).find((c) => c.id === id);
}

export function jobOfCandidate(s: AppState, c: Candidate): Job | undefined {
  return s.jobs.find((j) => j.id === c.jobId);
}

export function currentJob(s: AppState = state): Job | undefined {
  return s.jobs.find((j) => j.id === s.jobId);
}

/* Every candidate, tagged with their job. `liveCands` is what the active
 * screens use — the Archive tab is the only place archived rows appear. */
export function allCands(s: AppState = state): CandidateWithJob[] {
  return s.jobs.flatMap((j) =>
    j.cands.map((c) => ({ ...c, jobTitle: j.title, jobArchivedAt: j.archivedAt }))
  );
}

export function liveCands(s: AppState = state): CandidateWithJob[] {
  return allCands(s).filter((c) => c.archivedAt === null && c.jobArchivedAt === null);
}

export function liveJobs(s: AppState = state): Job[] {
  return s.jobs.filter((j) => j.archivedAt === null);
}

export function archivedJobs(s: AppState = state): Job[] {
  return s.jobs.filter((j) => j.archivedAt !== null);
}

/* Candidates archived on their own, whose job is still live. Archived jobs
 * already show their people in the job's own Archive row. */
export function archivedCands(s: AppState = state): CandidateWithJob[] {
  return allCands(s).filter((c) => c.archivedAt !== null && c.jobArchivedAt === null);
}

/* Only live candidates count toward a job's live figures. */
export function jobLiveCands(j: Job): Candidate[] {
  return j.archivedAt ? [] : j.cands.filter((c) => c.archivedAt === null);
}

/* Source: avatar(id) = AVA[id % AVA.length]. Ids are uuids now, so the index
 * comes from a small stable hash instead of a modulo. */
export function avatar(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVA[h % AVA.length];
}

export interface Segment {
  w: string;
  bg: string;
  legend: string;
}

export function segments(j: Job): Segment[] {
  const cands = jobLiveCands(j);
  const t = cands.length || 1;
  return STAGES.map((st) => ({ st, n: cands.filter((c) => c.stage === st).length }))
    .filter((x) => x.n > 0)
    .map((x) => ({
      w: ((x.n / t) * 100).toFixed(1) + '%',
      bg: SEGC[x.st],
      legend: x.st + ' ' + x.n,
    }));
}

export interface ChipStyle {
  bg: string;
  color: string;
  border: string;
}

export function chip(active: boolean): ChipStyle {
  return active
    ? { bg: '#0F52BA', color: '#EFEDDA', border: '#0F52BA' }
    : { bg: '#FFFFFF', color: '#2C3A5E', border: '#A6C5D7' };
}

export function initials(n: string): string {
  return n
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function stars(r: number | null): string {
  const v = r ?? 0;
  return '★★★★★'.slice(0, v) + '☆☆☆☆☆'.slice(0, 5 - v);
}

/* --------------------------------------------------------- local UI state */

export function setSearch(v: string) {
  setState({ search: v });
}
export function setStatusFilter(v: string) {
  setState({ statusF: v });
}
export function setStageFilter(v: string) {
  setState({ stageF: v });
}
export function setRatingFilter(v: string) {
  setState({ ratingF: v });
}
export function selectJob(id: string) {
  setState({ jobId: id, stageF: 'All', ratingF: 'All' });
}
export function syncJobId(id: string) {
  if (state.jobId !== id) setState({ jobId: id });
}
export function setNoteDraft(v: string) {
  setState({ note: v });
}
export function openJobModal() {
  setState({ modal: 'job', form: { source: 'Manual entry', status: 'Open' } });
}
export function openCandModal() {
  setState({ modal: 'cand', form: { source: 'Manual entry', stage: 'Applied', rating: 3 } });
}
export function closeModals() {
  setState({ modal: null, form: {} });
}
export function setFormField(k: keyof JobForm, v: string | number | File | null) {
  setState((s) => ({ form: { ...s.form, [k]: v } }));
}

/* ------------------------------------------------------------- mutations */

export function updateCandidate(id: string, patch: TablesUpdate<'candidates'>) {
  return withBusy(async () => {
    const { error } = await supabase().from('candidates').update(patch).eq('id', id);
    if (error) throw error;
  });
}

/* Source: shortlisting someone still at Applied also moves them to Screening. */
export function toggleShortlist(c: Candidate) {
  return updateCandidate(c.id, {
    is_shortlisted: !c.short,
    stage: c.stage === 'Applied' ? 'Screening' : c.stage,
  });
}

export function rejectCandidate(id: string) {
  return updateCandidate(id, { stage: 'Rejected', is_shortlisted: false });
}

/* Source: panelNext clamps at index 4 ('Hired') and never lands on Rejected. */
export function panelNext(cand: Candidate) {
  const i = STAGES.indexOf(cand.stage);
  return updateCandidate(cand.id, { stage: STAGES[Math.min(i + 1, 4)] });
}

export function panelShortlist(id: string) {
  return updateCandidate(id, { is_shortlisted: true });
}

export function panelReject(id: string) {
  return updateCandidate(id, { stage: 'Rejected', is_shortlisted: false });
}

export function setRating(id: string, rating: number) {
  return updateCandidate(id, { rating });
}

export function setStage(id: string, stage: string) {
  return updateCandidate(id, { stage: stage as Stage });
}

export function setLinkedinUrl(id: string, url: string) {
  return updateCandidate(id, { linkedin_url: cleanUrl(url) });
}

export function addNote(cand: Candidate) {
  const body = state.note;
  if (!body.trim()) return Promise.resolve(null);
  return withBusy(async () => {
    const { error } = await supabase()
      .from('candidate_notes')
      .insert({ candidate_id: cand.id, body: body.trim(), created_by: requireUser() });
    if (error) throw error;
    setState({ note: '' });
  });
}

export function deleteNote(id: string) {
  return withBusy(async () => {
    const { error } = await supabase().from('candidate_notes').delete().eq('id', id);
    if (error) throw error;
  });
}

/* ---------------------------------------------------------------- archive */

export function archiveJob(id: string) {
  return withBusy(async () => {
    /* The database also sets status to Closed and stamps archived_by. */
    const { error } = await supabase()
      .from('jobs')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  });
}

export function restoreJob(id: string) {
  return withBusy(async () => {
    const { error } = await supabase().from('jobs').update({ archived_at: null }).eq('id', id);
    if (error) throw error;
  });
}

export function archiveCandidate(id: string) {
  return withBusy(async () => {
    const { error } = await supabase()
      .from('candidates')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  });
}

export function restoreCandidate(id: string) {
  return withBusy(async () => {
    const { error } = await supabase()
      .from('candidates')
      .update({ archived_at: null })
      .eq('id', id);
    if (error) throw error;
  });
}

/* ------------------------------------------------------------ CV storage */

/* Path shape from the data model: candidates/{candidate id}/{random}.{ext}.
 * The candidate's id rather than their name, so nothing personal leaks
 * through the path and a rename never breaks the link. */
function cvPath(candidateId: string, file: File): string {
  const ext = file.name.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(Date.now());
  return `candidates/${candidateId}/${rand}.${ext}`;
}

/* Derive the MIME type from the extension rather than trusting file.type.
 * Browsers report '' for a .docx on machines without Office registered, and
 * both the bucket's allowed_mime_types and the candidates_cv_mime check
 * constraint accept only these two exact strings — so an empty type made the
 * upload fail with an unreadable error. */
const PDF_MIME = 'application/pdf';
const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function cvMimeType(file: File): string {
  if (file.name.toLowerCase().endsWith('.docx')) return DOCX_MIME;
  if (file.name.toLowerCase().endsWith('.pdf')) return PDF_MIME;
  return file.type === DOCX_MIME || file.type === PDF_MIME ? file.type : PDF_MIME;
}

async function uploadCvFile(candidateId: string, file: File, userId: string) {
  const db = supabase();
  const path = cvPath(candidateId, file);
  const mime = cvMimeType(file);

  /* supabase-js sends the Blob inside FormData, so the server reads the
   * file's OWN type and ignores contentType. Re-wrap it, otherwise a browser
   * that reports '' arrives as application/octet-stream and the bucket
   * rejects it with a 415. */
  const typed = file.type === mime ? file : new File([file], file.name, { type: mime });

  const { error: upErr } = await db.storage
    .from(CV_BUCKET)
    .upload(path, typed, { contentType: mime, upsert: false });
  if (upErr) throw upErr;

  /* Find the previous file before overwriting the pointer, so it can be
   * removed — there is no version history by design. */
  const { data: prev } = await db
    .from('candidates')
    .select('cv_object_path')
    .eq('id', candidateId)
    .maybeSingle();

  const { error: updErr } = await db
    .from('candidates')
    .update({
      cv_object_path: path,
      cv_file_name: file.name,
      cv_mime_type: mime,
      cv_size_bytes: file.size,
      cv_uploaded_at: new Date().toISOString(),
      cv_uploaded_by: userId,
    })
    .eq('id', candidateId);
  if (updErr) {
    await db.storage.from(CV_BUCKET).remove([path]);
    throw updErr;
  }

  if (prev?.cv_object_path && prev.cv_object_path !== path) {
    await db.storage.from(CV_BUCKET).remove([prev.cv_object_path]);
  }
}

export function uploadCv(candidateId: string, file: File) {
  return withBusy(async () => {
    await uploadCvFile(candidateId, file, requireUser());
  });
}

/* Private bucket: reading happens through a short-lived signed URL generated
 * on demand. There is no permanent public address for any CV. */
export async function signedCvUrl(path: string, seconds = 3600): Promise<string | null> {
  const { data, error } = await supabase().storage.from(CV_BUCKET).createSignedUrl(path, seconds);
  if (error) return null;
  return data.signedUrl;
}

/* ------------------------------------------------------- create job/cand */

/* Returns the new job's id so the caller can route to it. */
export function submitJob(): Promise<string | null> {
  const f = state.form;
  if (!f.title || !f.title.trim()) {
    closeModals();
    return Promise.resolve(null);
  }
  return withBusy(async () => {
    const { data, error } = await supabase()
      .from('jobs')
      .insert({
        title: f.title!.trim(),
        location: f.location?.trim() || null,
        description: f.description?.trim() || null,
        source: (f.source as Source) || 'Manual entry',
        status: (f.status as 'Open' | 'Closed') || 'Open',
        posted_on: todayIso(),
        created_by: requireUser(),
      })
      .select('id')
      .single();
    if (error) throw error;
    setState({ modal: null, form: {}, jobId: data.id });
    return data.id;
  });
}

export function submitCand(): Promise<string | null> {
  const f = state.form;
  const jobId = state.jobId;
  if (!f.name || !f.name.trim() || !jobId) {
    closeModals();
    return Promise.resolve(null);
  }
  return withBusy(async () => {
    const userId = requireUser();
    const { data, error } = await supabase()
      .from('candidates')
      .insert({
        job_id: jobId,
        full_name: f.name!.trim(),
        email: cleanEmail(f.email),
        linkedin_url: cleanUrl(f.linkedinUrl),
        source: (f.source as Source) || 'Manual entry',
        stage: (f.stage as Stage) || 'Applied',
        rating: f.rating ?? 3,
        applied_on: todayIso(),
        created_by: userId,
      })
      .select('id')
      .single();
    if (error) throw error;

    /* The candidate row already exists at this point. If the CV upload
     * fails, keep the person and report only the file problem — aborting
     * here left an invisible row behind and a retry made duplicates. */
    let cvProblem: string | null = null;
    if (f.cvFile) {
      try {
        await uploadCvFile(data.id, f.cvFile, userId);
      } catch (e) {
        cvProblem = errorMessage(e);
      }
    }

    setState({
      modal: null,
      form: {},
      error: cvProblem
        ? f.name!.trim() + ' was saved, but the CV did not upload: ' + cvProblem
        : null,
    });
    return data.id;
  });
}

/* --------------------------------------------------------------- settings */

export function updateSettings(patch: Partial<Settings>) {
  return withBusy(async () => {
    const row: TablesUpdate<'app_settings'> = {};
    if (patch.careersInboxEmail !== undefined)
      row.careers_inbox_email = patch.careersInboxEmail.trim() || null;
    if (patch.defaultPipeline !== undefined) row.default_pipeline = patch.defaultPipeline;
    if (patch.requireEmailOnNewCandidates !== undefined)
      row.require_email_on_new_candidates = patch.requireEmailOnNewCandidates;
    if (patch.emailOnShortlistAdd !== undefined)
      row.email_on_shortlist_add = patch.emailOnShortlistAdd;
    if (patch.requireCvBeforeInterview !== undefined)
      row.require_cv_before_interview = patch.requireCvBeforeInterview;
    row.updated_by = requireUser();

    const { error } = await supabase().from('app_settings').update(row).eq('id', 1);
    if (error) throw error;
  });
}
