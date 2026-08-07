-- Candidate location, and extra named documents beyond the CV.
--
-- Two additions requested on 7 Aug 2026:
--
-- 1. `candidates.location` — the "Fill from CV" feature extracts a location
--    from the PDF, and there was nowhere to put it. The Add Candidate form
--    gains a matching field.
--
-- 2. `candidate_documents` — a candidate can now carry any number of extra
--    files besides their CV, each with a label the recruiter chooses
--    ("Portfolio", "Cover letter", "Certificates"). The CV keeps its
--    dedicated columns on `candidates`; this table is only for the extras.
--
-- Files live in the existing `candidate-cvs` bucket under a `documents/`
-- prefix. One bucket keeps the storage policies in one place, and the bucket
-- already enforces PDF/DOCX and the 10 MB cap for everything inside it.

-- ---------------------------------------------------------------------------
-- 1. candidate location
-- ---------------------------------------------------------------------------

alter table public.candidates
  add column if not exists location text;

comment on column public.candidates.location is
  'Free text, e.g. "Cairo, EG". May be filled by CV extraction or by hand.';

-- ---------------------------------------------------------------------------
-- 2. extra documents
-- ---------------------------------------------------------------------------

create table if not exists public.candidate_documents (
  id            uuid primary key default gen_random_uuid(),
  candidate_id  uuid not null references public.candidates (id) on delete cascade,
  label         text not null,
  object_path   text not null unique,
  file_name     text not null,
  mime_type     text not null,
  size_bytes    bigint not null,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  constraint candidate_documents_label_length
    check (char_length(btrim(label)) between 1 and 60),

  constraint candidate_documents_size
    check (size_bytes > 0 and size_bytes <= 10485760),

  constraint candidate_documents_mime check (mime_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ))
);

comment on table public.candidate_documents is
  'Extra labelled files per candidate, beyond the single CV. Deletable, like notes.';

create index if not exists candidate_documents_candidate_idx
  on public.candidate_documents (candidate_id, created_at desc);

create trigger candidate_documents_set_updated_at
  before update on public.candidate_documents
  for each row execute function public.set_updated_at();

create trigger candidate_documents_lock_attribution
  before update on public.candidate_documents
  for each row execute function public.lock_attribution();

-- ---------------------------------------------------------------------------
-- RLS — same flat shared-workspace shape as every other table.
--
-- Unlike jobs and candidates, documents ARE deletable: an attachment added by
-- mistake should be removable, exactly like a note. The person's record is
-- still permanent; only the file they had attached to it goes.
-- ---------------------------------------------------------------------------

alter table public.candidate_documents enable row level security;

create policy "documents are readable by team members"
  on public.candidate_documents for select to authenticated
  using (public.is_team_member());

create policy "team members add documents as themselves"
  on public.candidate_documents for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any document"
  on public.candidate_documents for update to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

create policy "team members delete any document"
  on public.candidate_documents for delete to authenticated
  using (public.is_team_member());
