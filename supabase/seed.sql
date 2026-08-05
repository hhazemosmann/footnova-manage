-- FootNova Recruiting — DEMO DATA (development project only)
--
-- The 6 jobs, 24 candidates and 2 notes that shipped in the design export,
-- carried over from lib/demo-data.ts so the screens have content while the
-- application is rewired. Approved for the development project on 5 Aug 2026:
-- "load it for now and we will delete it later".
--
-- Not real people. Not real contact details. Never apply this to production.
--
-- One job (Match Data Engineer) is seeded ALREADY ARCHIVED so the Archive tab
-- has something to show and restore can be tested end to end.
--
-- created_by is null throughout: no real account created these rows, and the
-- attribution lock permits null. Notes therefore show as unattributed.
--
-- TO REMOVE LATER — run these three statements, in this order:
--   delete from public.candidate_notes;
--   delete from public.candidate_stage_events;
--   delete from public.candidates;  -- requires the postgres role; clients cannot delete
--   delete from public.jobs;
-- Stage events are removed automatically with their candidates.

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------

insert into public.jobs (id, title, location, description, source, status, posted_on, archived_at)
values
  ('11111111-1111-4111-8111-000000000001', 'First Team Analyst',        'Cairo, EG',          null, 'Manual entry', 'Open',   date '2026-07-12', null),
  ('11111111-1111-4111-8111-000000000002', 'Padel Operations Manager',  'New Cairo, EG',      null, 'Manual entry', 'Open',   date '2026-07-02', null),
  ('11111111-1111-4111-8111-000000000003', 'Academy Goalkeeping Coach', 'Alexandria, EG',     null, 'Manual entry', 'Open',   date '2026-06-24', null),
  ('11111111-1111-4111-8111-000000000004', 'Broadcast Motion Designer', 'Remote',             null, 'Manual entry', 'Open',   date '2026-06-18', null),
  ('11111111-1111-4111-8111-000000000005', 'Community Growth Lead',     'Cairo, EG',          null, 'Manual entry', 'Closed', date '2026-06-02', null),
  ('11111111-1111-4111-8111-000000000006', 'Match Data Engineer',       'Cairo, EG (Hybrid)', null, 'Manual entry', 'Closed', date '2026-05-28', now() - interval '3 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Candidates
--
-- Phone numbers follow the design export's own generated pattern.
-- Inserting each row fires the stage-history trigger, so every candidate
-- gets an opening entry automatically.
-- ---------------------------------------------------------------------------

insert into public.candidates
  (id, job_id, full_name, email, phone, source, stage, is_shortlisted, rating, applied_on)
values
  -- First Team Analyst
  ('22222222-2222-4222-8222-000000000101', '11111111-1111-4111-8111-000000000001', 'Youssef Mansour', 'y.mansour@mail.com',    '+20 100 1101', 'Manual entry', 'Interview', true,  5, date '2026-07-14'),
  ('22222222-2222-4222-8222-000000000102', '11111111-1111-4111-8111-000000000001', 'Layla Hassan',    'layla.h@mail.com',      '+20 100 1102', 'Manual entry', 'Screening', true,  4, date '2026-07-14'),
  ('22222222-2222-4222-8222-000000000103', '11111111-1111-4111-8111-000000000001', 'Omar Deraz',      'o.deraz@mail.com',      '+20 100 1103', 'Manual entry', 'Applied',   false, 3, date '2026-07-15'),
  ('22222222-2222-4222-8222-000000000104', '11111111-1111-4111-8111-000000000001', 'Salma Fathy',     'salma.fathy@mail.com',  '+20 100 1104', 'Manual entry', 'Offer',     true,  5, date '2026-07-16'),
  ('22222222-2222-4222-8222-000000000105', '11111111-1111-4111-8111-000000000001', 'Karim Sabry',     'k.sabry@mail.com',      '+20 100 1105', 'Manual entry', 'Applied',   false, 2, date '2026-07-17'),
  ('22222222-2222-4222-8222-000000000106', '11111111-1111-4111-8111-000000000001', 'Hana Adel',       'hana.adel@mail.com',    '+20 100 1106', 'Manual entry', 'Rejected',  false, 2, date '2026-07-18'),
  ('22222222-2222-4222-8222-000000000107', '11111111-1111-4111-8111-000000000001', 'Tarek Nabil',     't.nabil@mail.com',      '+20 100 1107', 'Manual entry', 'Screening', false, 4, date '2026-07-19'),
  ('22222222-2222-4222-8222-000000000108', '11111111-1111-4111-8111-000000000001', 'Nadia Riad',      'n.riad@mail.com',       '+20 100 1108', 'Manual entry', 'Interview', true,  4, date '2026-07-21'),

  -- Padel Operations Manager
  ('22222222-2222-4222-8222-000000000109', '11111111-1111-4111-8111-000000000002', 'Mostafa Lotfy',   'm.lotfy@mail.com',      '+20 100 1109', 'Manual entry', 'Hired',     true,  5, date '2026-07-04'),
  ('22222222-2222-4222-8222-000000000110', '11111111-1111-4111-8111-000000000002', 'Rana Kamal',      'rana.k@mail.com',       '+20 100 1110', 'Manual entry', 'Interview', true,  4, date '2026-07-05'),
  ('22222222-2222-4222-8222-000000000111', '11111111-1111-4111-8111-000000000002', 'Ziad Sherif',     'z.sherif@mail.com',     '+20 100 1111', 'Manual entry', 'Applied',   false, 3, date '2026-07-06'),
  ('22222222-2222-4222-8222-000000000112', '11111111-1111-4111-8111-000000000002', 'Aya Mounir',      'aya.m@mail.com',        '+20 100 1112', 'Manual entry', 'Screening', false, 3, date '2026-07-09'),

  -- Academy Goalkeeping Coach
  ('22222222-2222-4222-8222-000000000113', '11111111-1111-4111-8111-000000000003', 'Peter Gerges',    'p.gerges@mail.com',     '+20 100 1113', 'Manual entry', 'Interview', true,  5, date '2026-06-26'),
  ('22222222-2222-4222-8222-000000000114', '11111111-1111-4111-8111-000000000003', 'Hossam Elwy',     'h.elwy@mail.com',       '+20 100 1114', 'Manual entry', 'Screening', false, 4, date '2026-06-27'),
  ('22222222-2222-4222-8222-000000000115', '11111111-1111-4111-8111-000000000003', 'Marwan Fouad',    'm.fouad@mail.com',      '+20 100 1115', 'Manual entry', 'Applied',   false, 3, date '2026-06-28'),
  ('22222222-2222-4222-8222-000000000116', '11111111-1111-4111-8111-000000000003', 'Basma Zaki',      'b.zaki@mail.com',       '+20 100 1116', 'Manual entry', 'Rejected',  false, 1, date '2026-06-30'),
  ('22222222-2222-4222-8222-000000000117', '11111111-1111-4111-8111-000000000003', 'Ali Shawky',      'ali.s@mail.com',        '+20 100 1117', 'Manual entry', 'Applied',   false, 4, date '2026-07-01'),

  -- Broadcast Motion Designer
  ('22222222-2222-4222-8222-000000000118', '11111111-1111-4111-8111-000000000004', 'Farida Selim',    'f.selim@mail.com',      '+20 100 1118', 'Manual entry', 'Offer',     true,  5, date '2026-06-20'),
  ('22222222-2222-4222-8222-000000000119', '11111111-1111-4111-8111-000000000004', 'Amr Tahoun',      'a.tahoun@mail.com',     '+20 100 1119', 'Manual entry', 'Screening', false, 3, date '2026-06-21'),
  ('22222222-2222-4222-8222-000000000120', '11111111-1111-4111-8111-000000000004', 'Dina Wagdy',      'd.wagdy@mail.com',      '+20 100 1120', 'Manual entry', 'Applied',   false, 2, date '2026-06-23'),

  -- Community Growth Lead (closed, still live on the Jobs screen)
  ('22222222-2222-4222-8222-000000000121', '11111111-1111-4111-8111-000000000005', 'Mahmoud Ezzat',   'm.ezzat@mail.com',      '+20 100 1121', 'Manual entry', 'Hired',     true,  5, date '2026-06-05'),
  ('22222222-2222-4222-8222-000000000122', '11111111-1111-4111-8111-000000000005', 'Nourhan Adly',    'n.adly@mail.com',       '+20 100 1122', 'Manual entry', 'Rejected',  false, 2, date '2026-06-06'),

  -- Match Data Engineer (archived — these two ride along into the Archive)
  ('22222222-2222-4222-8222-000000000123', '11111111-1111-4111-8111-000000000006', 'Sherif Gaber',    's.gaber@mail.com',      '+20 100 1123', 'Manual entry', 'Hired',     true,  4, date '2026-05-30'),
  ('22222222-2222-4222-8222-000000000124', '11111111-1111-4111-8111-000000000006', 'Menna Osman',     'menna.o@mail.com',      '+20 100 1124', 'Manual entry', 'Rejected',  false, 3, date '2026-05-31')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Notes — the two the design export attached to Youssef Mansour.
-- Real timestamps now, so the "2d ago" label the app renders stays accurate
-- instead of being frozen text.
-- ---------------------------------------------------------------------------

insert into public.candidate_notes (id, candidate_id, body, created_at)
values
  ('33333333-3333-4333-8333-000000000001',
   '22222222-2222-4222-8222-000000000101',
   'Strong Wyscout portfolio. Walked through our xG model without prompting.',
   now() - interval '2 days'),
  ('33333333-3333-4333-8333-000000000002',
   '22222222-2222-4222-8222-000000000101',
   'Panel interview booked for Thursday 14:00 with the analysis team.',
   now() - interval '1 day')
on conflict (id) do nothing;
