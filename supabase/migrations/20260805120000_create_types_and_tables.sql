-- FootNova Recruiting — core schema
-- Implements docs/data-model.md §3, §4, §5, §8 (revision 2, archive model).
--
-- Nothing in this product is ever permanently deleted. Jobs and candidates are
-- archived instead; the delete refusal itself is applied in the RLS migration.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Custom types — these mirror the application's dropdowns exactly.
-- ---------------------------------------------------------------------------

create type public.job_status as enum ('Open', 'Closed');

create type public.candidate_stage as enum (
  'Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'
);

create type public.entity_source as enum (
  'Manual entry', 'Referral', 'Direct application', 'Agency', 'Scouting network'
);

-- ---------------------------------------------------------------------------
-- profiles — display information for each signed-in account.
-- Authentication itself lives entirely in auth.users; no passwords here.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  job_title   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Display name and job title per signed-in account. One row per auth.users row, created automatically.';

-- ---------------------------------------------------------------------------
-- jobs
--
-- Two independent dimensions:
--   status      — is it taking applicants (Open/Closed)
--   archived_at — is it still on the active screens (null = live)
-- ---------------------------------------------------------------------------

create table public.jobs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  location     text,
  description  text,
  source       public.entity_source not null default 'Manual entry',
  status       public.job_status not null default 'Open',
  posted_on    date not null default current_date,
  archived_at  timestamptz,
  archived_by  uuid references public.profiles (id) on delete set null,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint jobs_title_length
    check (char_length(btrim(title)) between 1 and 200),

  -- archived_by may be cleared later if that account is removed, so this is
  -- one-directional: you cannot record an archiver without an archive time.
  constraint jobs_archived_by_requires_at
    check (archived_by is null or archived_at is not null)
);

comment on column public.jobs.archived_at is
  'Null means live. Set means the job sits in the Archive tab along with its candidates.';

-- ---------------------------------------------------------------------------
-- candidates
--
-- A candidate is in the Archive when their own archived_at is set OR their
-- job is archived. That second rule is what makes restore work without any
-- bookkeeping: restoring a job brings back everyone it took with it, while
-- anyone archived individually beforehand correctly stays put.
-- ---------------------------------------------------------------------------

create table public.candidates (
  id              uuid primary key default gen_random_uuid(),
  job_id          uuid not null references public.jobs (id) on delete restrict,
  full_name       text not null,
  email           text,
  phone           text,
  linkedin_url    text,
  source          public.entity_source not null default 'Manual entry',
  stage           public.candidate_stage not null default 'Applied',
  is_shortlisted  boolean not null default false,
  rating          smallint,
  applied_on      date not null default current_date,
  archived_at     timestamptz,
  archived_by     uuid references public.profiles (id) on delete set null,

  -- One CV per candidate, replaced on re-upload. No version history.
  cv_object_path  text unique,
  cv_file_name    text,
  cv_mime_type    text,
  cv_size_bytes   bigint,
  cv_uploaded_at  timestamptz,
  cv_uploaded_by  uuid references public.profiles (id) on delete set null,

  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint candidates_name_not_blank
    check (char_length(btrim(full_name)) > 0),

  constraint candidates_email_format
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),

  constraint candidates_linkedin_url_format
    check (linkedin_url is null or linkedin_url ~* '^https?://'),

  constraint candidates_rating_range
    check (rating is null or rating between 1 and 5),

  -- All-or-nothing. cv_uploaded_by is excluded because it may be cleared
  -- later if that account is removed, which must not break the constraint.
  constraint candidates_cv_complete
    check (num_nulls(cv_object_path, cv_file_name, cv_mime_type, cv_size_bytes, cv_uploaded_at) in (0, 5)),

  constraint candidates_cv_size
    check (cv_size_bytes is null or (cv_size_bytes > 0 and cv_size_bytes <= 10485760)),

  constraint candidates_cv_mime
    check (cv_mime_type is null or cv_mime_type in (
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )),

  constraint candidates_archived_by_requires_at
    check (archived_by is null or archived_at is not null)
);

comment on column public.candidates.is_shortlisted is
  'Independent of stage. A candidate can be at Interview and shortlisted at the same time.';

-- ---------------------------------------------------------------------------
-- candidate_notes — the one record type that stays deletable, by explicit
-- decision: a note is the writer''s own sentence, not a person''s record.
-- ---------------------------------------------------------------------------

create table public.candidate_notes (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.candidates (id) on delete cascade,
  body          text not null,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint candidate_notes_body_not_blank
    check (char_length(btrim(body)) > 0)
);

-- ---------------------------------------------------------------------------
-- candidate_stage_events — permanent pipeline history.
-- Written only by a database trigger; the browser can read but never write.
-- This is what answers "how long has this person been sitting at Interview?"
-- ---------------------------------------------------------------------------

create table public.candidate_stage_events (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.candidates (id) on delete cascade,
  from_stage    public.candidate_stage,
  to_stage      public.candidate_stage not null,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),

  constraint candidate_stage_events_distinct
    check (from_stage is distinct from to_stage)
);

-- ---------------------------------------------------------------------------
-- app_settings — exactly one shared row.
-- The toggles are stored but inert: nothing in this product sends email.
-- ---------------------------------------------------------------------------

create table public.app_settings (
  id                               smallint primary key default 1,
  careers_inbox_email              text default 'careers@footnova.com',
  default_pipeline                 text not null
    default 'Applied → Screening → Interview → Offer → Hired',
  require_email_on_new_candidates  boolean not null default true,
  email_on_shortlist_add           boolean not null default true,
  require_cv_before_interview      boolean not null default false,
  updated_at                       timestamptz not null default now(),
  updated_by                       uuid references public.profiles (id) on delete set null,

  constraint app_settings_singleton check (id = 1),

  constraint app_settings_pipeline_allowed check (default_pipeline in (
    'Applied → Screening → Interview → Offer → Hired',
    'Applied → Interview → Offer'
  )),

  constraint app_settings_email_format
    check (careers_inbox_email is null
           or careers_inbox_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index jobs_status_idx           on public.jobs (status);
create index jobs_created_by_idx       on public.jobs (created_by);
create index jobs_archived_at_idx      on public.jobs (archived_at) where archived_at is not null;
create index jobs_live_idx             on public.jobs (posted_on desc) where archived_at is null;
create index jobs_title_trgm_idx       on public.jobs using gin (lower(title) extensions.gin_trgm_ops);

create index candidates_job_id_idx      on public.candidates (job_id);
create index candidates_stage_idx       on public.candidates (stage);
create index candidates_created_by_idx  on public.candidates (created_by);
create index candidates_live_idx        on public.candidates (job_id) where archived_at is null;
create index candidates_shortlisted_idx on public.candidates (job_id) where is_shortlisted and archived_at is null;
create index candidates_name_trgm_idx   on public.candidates using gin (lower(full_name) extensions.gin_trgm_ops);

create index candidate_notes_candidate_idx
  on public.candidate_notes (candidate_id, created_at desc);

create index candidate_stage_events_candidate_idx
  on public.candidate_stage_events (candidate_id, created_at desc);
