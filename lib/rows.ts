/* Source: `rowOf(c, i)` inside renderVals — the display shape shared by the
 * job-detail candidate table and the shortlist table. The three row actions
 * (view / shortlist / reject) are wired at the call site because `view` now
 * navigates, which needs the router. */

import { ZEBRA_ROWS } from './design-props';
import { Candidate, TONE } from './types';
import { CandidateWithJob, avatar, initials, stars } from './store';

export interface Row {
  cand: Candidate;
  jobTitle?: string;
  initials: string;
  avatarBg: string;
  stars: string;
  tone: string;
  cv: string;
  rowBg: string;
  shortLabel: string;
}

export function buildRow(c: Candidate | CandidateWithJob, i: number): Row {
  return {
    cand: c,
    jobTitle: (c as CandidateWithJob).jobTitle,
    initials: initials(c.name),
    avatarBg: avatar(c.id),
    stars: stars(c.rating),
    tone: TONE[c.stage],
    /* The source showed a fixed 'CV.pdf' against every row. Now that files
     * are real, show the actual filename, or say so when there is none. */
    cv: c.cv ? c.cv.fileName + ' ↗' : 'No CV',
    rowBg: ZEBRA_ROWS !== false && i % 2 ? '#F7F9FC' : '#FFFFFF',
    shortLabel: c.short ? 'Shortlisted' : 'Shortlist',
  };
}
