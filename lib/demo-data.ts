/* =====================================================================
 * DESIGN FIXTURE DATA — DELETE AT DATABASE TIME.
 *
 * This is the sample dataset that shipped inside "FootNova Recruiting.html".
 * It exists so every ported screen renders exactly as it does in the design
 * export and can be compared side by side. It is NOT a mock backend and
 * nothing else in the app depends on its shape beyond the types below.
 *
 * When the real database lands: delete this file, drop `createInitialJobs()`
 * from lib/store.ts, and keep the `Job` / `Candidate` / `Note` types (or
 * regenerate them from the schema).
 * ===================================================================== */

export const STAGES = [
  'Applied',
  'Screening',
  'Interview',
  'Offer',
  'Hired',
  'Rejected',
] as const;

export type Stage = (typeof STAGES)[number];

export const TONE: Record<Stage, string> = {
  Applied: 'neutral',
  Screening: 'sapphire',
  Interview: 'warning',
  Offer: 'success',
  Hired: 'success',
  Rejected: 'danger',
};

export const SEGC: Record<Stage, string> = {
  Applied: '#A6C5D7',
  Screening: '#0F52BA',
  Interview: '#D6A13A',
  Offer: '#2E8B67',
  Hired: '#101B3A',
  Rejected: '#C1443D',
};

export const AVA = ['#0F52BA', '#101B3A', '#2C3A5E', '#2E8B67', '#C1443D', '#0D46A0'];

export interface Note {
  who: string;
  when: string;
  text: string;
}

export interface Candidate {
  id: number;
  name: string;
  email: string;
  date: string;
  stage: Stage;
  rating: number;
  short: boolean;
  phone: string;
  notes: Note[];
}

export interface Job {
  id: number;
  title: string;
  location: string;
  posted: string;
  source: string;
  status: string;
  cands: Candidate[];
}

/* Source `let uid = 100` — module-scope counter shared by the fixture rows
 * and by every candidate/job created at runtime. */
let uid = 100;

export function nextUid(): number {
  return ++uid;
}

/* Source helper `c(...)`. */
export function makeCandidate(
  name: string,
  email: string,
  date: string,
  stage: Stage,
  rating: number,
  short: boolean
): Candidate {
  const id = ++uid;
  return {
    id,
    name,
    email,
    date,
    stage,
    rating,
    short,
    phone: '+20 100 ' + (1000 + id),
    notes: [],
  };
}

const c = makeCandidate;

/* Source `const JOBS = [...]`, built fresh so the uid sequence matches the
 * original (fixtures consume 100 → 127, runtime ids continue from there). */
export function createInitialJobs(): Job[] {
  const jobs: Job[] = [
    {
      id: 1,
      title: 'First Team Analyst',
      location: 'Cairo, EG',
      posted: '12 Jul 2026',
      source: 'Manual entry',
      status: 'Open',
      cands: [
        c('Youssef Mansour', 'y.mansour@mail.com', '14 Jul 2026', 'Interview', 5, true),
        c('Layla Hassan', 'layla.h@mail.com', '14 Jul 2026', 'Screening', 4, true),
        c('Omar Deraz', 'o.deraz@mail.com', '15 Jul 2026', 'Applied', 3, false),
        c('Salma Fathy', 'salma.fathy@mail.com', '16 Jul 2026', 'Offer', 5, true),
        c('Karim Sabry', 'k.sabry@mail.com', '17 Jul 2026', 'Applied', 2, false),
        c('Hana Adel', 'hana.adel@mail.com', '18 Jul 2026', 'Rejected', 2, false),
        c('Tarek Nabil', 't.nabil@mail.com', '19 Jul 2026', 'Screening', 4, false),
        c('Nadia Riad', 'n.riad@mail.com', '21 Jul 2026', 'Interview', 4, true),
      ],
    },
    {
      id: 2,
      title: 'Padel Operations Manager',
      location: 'New Cairo, EG',
      posted: '02 Jul 2026',
      source: 'Manual entry',
      status: 'Open',
      cands: [
        c('Mostafa Lotfy', 'm.lotfy@mail.com', '04 Jul 2026', 'Hired', 5, true),
        c('Rana Kamal', 'rana.k@mail.com', '05 Jul 2026', 'Interview', 4, true),
        c('Ziad Sherif', 'z.sherif@mail.com', '06 Jul 2026', 'Applied', 3, false),
        c('Aya Mounir', 'aya.m@mail.com', '09 Jul 2026', 'Screening', 3, false),
      ],
    },
    {
      id: 3,
      title: 'Academy Goalkeeping Coach',
      location: 'Alexandria, EG',
      posted: '24 Jun 2026',
      source: 'Manual entry',
      status: 'Open',
      cands: [
        c('Peter Gerges', 'p.gerges@mail.com', '26 Jun 2026', 'Interview', 5, true),
        c('Hossam Elwy', 'h.elwy@mail.com', '27 Jun 2026', 'Screening', 4, false),
        c('Marwan Fouad', 'm.fouad@mail.com', '28 Jun 2026', 'Applied', 3, false),
        c('Basma Zaki', 'b.zaki@mail.com', '30 Jun 2026', 'Rejected', 1, false),
        c('Ali Shawky', 'ali.s@mail.com', '01 Jul 2026', 'Applied', 4, false),
      ],
    },
    {
      id: 4,
      title: 'Broadcast Motion Designer',
      location: 'Remote',
      posted: '18 Jun 2026',
      source: 'Manual entry',
      status: 'Open',
      cands: [
        c('Farida Selim', 'f.selim@mail.com', '20 Jun 2026', 'Offer', 5, true),
        c('Amr Tahoun', 'a.tahoun@mail.com', '21 Jun 2026', 'Screening', 3, false),
        c('Dina Wagdy', 'd.wagdy@mail.com', '23 Jun 2026', 'Applied', 2, false),
      ],
    },
    {
      id: 5,
      title: 'Community Growth Lead',
      location: 'Cairo, EG',
      posted: '02 Jun 2026',
      source: 'Manual entry',
      status: 'Closed',
      cands: [
        c('Mahmoud Ezzat', 'm.ezzat@mail.com', '05 Jun 2026', 'Hired', 5, true),
        c('Nourhan Adly', 'n.adly@mail.com', '06 Jun 2026', 'Rejected', 2, false),
      ],
    },
    {
      id: 6,
      title: 'Match Data Engineer',
      location: 'Cairo, EG (Hybrid)',
      posted: '28 May 2026',
      source: 'Manual entry',
      status: 'Closed',
      cands: [
        c('Sherif Gaber', 's.gaber@mail.com', '30 May 2026', 'Hired', 4, true),
        c('Menna Osman', 'menna.o@mail.com', '31 May 2026', 'Rejected', 3, false),
      ],
    },
  ];

  /* Source: JOBS[0].cands[0].notes = [...] */
  jobs[0].cands[0].notes = [
    {
      who: 'Hazem K.',
      when: '2d ago',
      text: 'Strong Wyscout portfolio. Walked through our xG model without prompting.',
    },
    {
      who: 'Sara M.',
      when: '1d ago',
      text: 'Panel interview booked for Thursday 14:00 with the analysis team.',
    },
  ];

  return jobs;
}
