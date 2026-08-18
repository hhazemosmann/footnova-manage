/* Application-shaped types and the design constants the ported views use.
 *
 * These deliberately keep the shape the source HTML's logic used (`name`,
 * `short`, `date`, `cands`) rather than the database's column names, so the
 * ported view components stay untouched. lib/store.ts does the mapping.
 *
 * Replaces the demo-data module, which is gone now that the real database
 * is the source of truth. */

/* The pipeline in order, with Rejected last: it is an outcome rather than a
   step, so it never appears in the forward progression but is still a stage a
   candidate can be in. Interview and Offer are one step — in practice the
   conversation and the offer happen together. */
export const STAGES = [
  'Applied',
  'Screening',
  'Email',
  'Interview/Offer',
  'Hired',
  'Rejected',
] as const;

/* The forward path only, which is what "move to the next stage" walks. */
export const PIPELINE = ['Applied', 'Screening', 'Email', 'Interview/Offer', 'Hired'] as const;

export type Stage = (typeof STAGES)[number];

export const SOURCES = [
  'Manual entry',
  'Referral',
  'Direct application',
  'Agency',
  'Scouting network',
] as const;

export type Source = (typeof SOURCES)[number];

export const TONE: Record<Stage, string> = {
  Applied: 'neutral',
  Screening: 'sapphire',
  Email: 'sapphire',
  'Interview/Offer': 'warning',
  Hired: 'success',
  Rejected: 'danger',
};

export const SEGC: Record<Stage, string> = {
  Applied: '#A6C5D7',
  Screening: '#0F52BA',
  Email: '#2C3A5E',
  'Interview/Offer': '#D6A13A',
  Hired: '#101B3A',
  Rejected: '#C1443D',
};

export const AVA = ['#0F52BA', '#101B3A', '#2C3A5E', '#2E8B67', '#C1443D', '#0D46A0'];

export const CV_ACCEPT =
  'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const CV_MAX_BYTES = 10 * 1024 * 1024;

export interface Note {
  id: string;
  who: string;
  when: string;
  text: string;
  createdBy: string | null;
}

export interface CvFile {
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/* An extra labelled file attached to a candidate, beyond their CV. */
export interface CandidateDocument {
  id: string;
  label: string;
  path: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  addedBy: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  jobId: string;
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  location: string;
  source: Source;
  stage: Stage;
  rating: number | null;
  /* The shortlist mark — independent of stage, as confirmed in the analysis. */
  short: boolean;
  /* Display string, e.g. "14 Jul 2026". `appliedOn` keeps the raw date. */
  date: string;
  appliedOn: string;
  archivedAt: string | null;
  cv: CvFile | null;
  documents: CandidateDocument[];
  notes: Note[];
  /* Resolved display name of whoever added them, for the profile page. */
  addedBy: string;
}

export interface Job {
  id: string;
  title: string;
  location: string;
  description: string;
  source: Source;
  status: 'Open' | 'Closed';
  /* Display string, e.g. "12 Jul 2026". `postedOn` keeps the raw date. */
  posted: string;
  postedOn: string;
  archivedAt: string | null;
  cands: Candidate[];
}

export interface Settings {
  careersInboxEmail: string;
  defaultPipeline: string;
  requireEmailOnNewCandidates: boolean;
  emailOnShortlistAdd: boolean;
  requireCvBeforeInterview: boolean;
}

/* A candidate is in the Archive when their own flag is set OR their job is
 * archived. This one rule is what makes restore work without bookkeeping. */
export function isCandidateArchived(c: Candidate, job: Job): boolean {
  return c.archivedAt !== null || job.archivedAt !== null;
}
