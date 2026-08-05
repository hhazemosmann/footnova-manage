/* Global mutable store — the routed replacement for the source's single
 * `DCLogic` component state. The source held everything in one component
 * because every view was mounted at once; under routing only one view is
 * mounted, so the state lives at module scope and the shell layout
 * subscribes to it once (see app/app/(shell)/layout.tsx).
 *
 * The source's `screen` field is gone — the URL is the source of truth for
 * which view is showing. Everything else is carried across unchanged.
 */

import {
  AVA,
  Candidate,
  Job,
  Note,
  SEGC,
  STAGES,
  Stage,
  createInitialJobs,
  makeCandidate,
  nextUid,
} from './demo-data';

export interface JobForm {
  title?: string;
  location?: string;
  source?: string;
  status?: string;
  name?: string;
  email?: string;
  stage?: string;
  rating?: number;
}

export interface AppState {
  jobs: Job[];
  jobId: number;
  candId: number | null;
  modal: 'job' | 'cand' | null;
  stageF: string;
  ratingF: string;
  statusF: string;
  search: string;
  form: JobForm;
  note: string;
  toggles: { a: boolean; b: boolean; c: boolean };
}

/* Source: state = {screen:'overview', jobs:JOBS, jobId:1, candId:null,
 *   modal:null, stageF:'All', ratingF:'All', statusF:'All', search:'',
 *   form:{}, note:'', toggles:{a:true,b:true,c:false}} */
let state: AppState = {
  jobs: createInitialJobs(),
  jobId: 1,
  candId: null,
  modal: null,
  stageF: 'All',
  ratingF: 'All',
  statusF: 'All',
  search: '',
  form: {},
  note: '',
  toggles: { a: true, b: true, c: false },
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

/* Server snapshot: the store is module scope and deterministic at import
 * time, so SSR and the first client render agree. */
export function getServerState(): AppState {
  return state;
}

function emit() {
  listeners.forEach((fn) => fn());
}

/* Source: set(p) / setState(p | updater) */
export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...next };
  emit();
}

/* ---- derived reads (source: job(), allCands(), avatar(), segments(), chip()) ---- */

export interface CandidateWithJob extends Candidate {
  jobTitle: string;
}

export function currentJob(s: AppState = state): Job {
  return s.jobs.find((j) => j.id === s.jobId) || s.jobs[0];
}

export function allCands(s: AppState = state): CandidateWithJob[] {
  return s.jobs.flatMap((j) => j.cands.map((c) => ({ ...c, jobTitle: j.title })));
}

export function avatar(id: number): string {
  return AVA[id % AVA.length];
}

export interface Segment {
  w: string;
  bg: string;
  legend: string;
}

export function segments(j: Job): Segment[] {
  const t = j.cands.length || 1;
  return STAGES.map((st) => ({ st, n: j.cands.filter((c) => c.stage === st).length }))
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
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function stars(r: number): string {
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

/* ---- mutations ---- */

/* Source: mutate(id, patch) */
export function mutate(id: number, patch: Partial<Candidate>) {
  setState((s) => ({
    jobs: s.jobs.map((j) => ({
      ...j,
      cands: j.cands.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  }));
}

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

/* Source: openJob(id) — reset both row filters when entering a job. The
 * navigation half now lives in the calling component (router.push). */
export function selectJob(id: number) {
  setState({ jobId: id, stageF: 'All', ratingF: 'All' });
}

/* Keeps the store's jobId in sync with the /app/jobs/[jobId] URL segment so
 * chrome that reads the "current job" (the Add Candidate dialog) is correct
 * after a direct load or a refresh. */
export function syncJobId(id: number) {
  if (state.jobId !== id) {
    state = { ...state, jobId: id };
    emit();
  }
}

export function openCandidate(id: number) {
  setState({ candId: id });
}

export function closePanel() {
  setState({ candId: null });
}

/* Source: shortlist / reject row actions */
export function toggleShortlist(c: Candidate) {
  mutate(c.id, {
    short: !c.short,
    stage: c.stage === 'Applied' ? 'Screening' : c.stage,
  });
}

export function rejectCandidate(id: number) {
  mutate(id, { stage: 'Rejected', short: false });
}

/* Source: panelNext — clamps at index 4 ('Hired'), never lands on 'Rejected'. */
export function panelNext(cand: Candidate) {
  const i = STAGES.indexOf(cand.stage);
  mutate(cand.id, { stage: STAGES[Math.min(i + 1, 4)] as Stage });
}

export function panelShortlist(id: number) {
  mutate(id, { short: true });
}

export function panelReject(id: number) {
  mutate(id, { stage: 'Rejected', short: false });
  setState({ candId: null });
}

export function setNoteDraft(v: string) {
  setState({ note: v });
}

/* Source: addNote */
export function addNote(cand: Candidate) {
  const s = state;
  if (!s.note.trim()) return;
  const list: Note[] = (cand.notes || []).concat([
    { who: 'Hazem K.', when: 'just now', text: s.note },
  ]);
  mutate(s.candId as number, { notes: list });
  setState({ note: '' });
}

/* ---- modals ---- */

export function openJobModal() {
  setState({ modal: 'job', form: { source: 'Manual entry', status: 'Open' } });
}

export function openCandModal() {
  setState({ modal: 'cand', form: { source: 'Manual entry', stage: 'Applied', rating: 3 } });
}

export function closeModals() {
  setState({ modal: null });
}

export function setFormField(k: keyof JobForm, v: string | number) {
  setState((s) => ({ form: { ...s.form, [k]: v } }));
}

/* Source: submitJob — returns the new job id so the caller can route to it
 * (the source set `screen:'job'` here instead). */
export function submitJob(): number | null {
  const f = state.form;
  if (!f.title) {
    setState({ modal: null });
    return null;
  }
  const j: Job = {
    id: nextUid(),
    title: f.title,
    location: f.location || 'Cairo, EG',
    posted: '05 Aug 2026',
    source: f.source || 'Manual entry',
    status: f.status || 'Open',
    cands: [],
  };
  setState((s) => ({ jobs: [j, ...s.jobs], modal: null, jobId: j.id, form: {} }));
  return j.id;
}

/* Source: submitCand */
export function submitCand() {
  const f = state.form;
  if (!f.name) {
    setState({ modal: null });
    return;
  }
  const nc = makeCandidate(
    f.name,
    f.email || 'candidate@mail.com',
    '05 Aug 2026',
    (f.stage || 'Applied') as Stage,
    f.rating || 3,
    false
  );
  setState((s) => ({
    jobs: s.jobs.map((j) => (j.id === s.jobId ? { ...j, cands: [nc, ...j.cands] } : j)),
    modal: null,
    form: {},
  }));
}

export function toggleSetting(k: 'a' | 'b' | 'c') {
  setState((s) => ({ toggles: { ...s.toggles, [k]: !s.toggles[k] } }));
}
