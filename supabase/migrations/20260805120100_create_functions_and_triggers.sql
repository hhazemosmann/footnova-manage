-- FootNova Recruiting — functions and triggers
-- Implements docs/data-model.md §5 (attribution), §6 (archive closes a job),
-- and the automatic stage history described in §1 and §3.

-- ---------------------------------------------------------------------------
-- is_team_member() — the single seam for future roles.
--
-- Today: "is signed in". Every RLS policy in the next migration calls this
-- rather than testing auth.uid() directly, so adding an admin tier later means
-- changing this function plus one column, not rewriting fifteen policies.
-- ---------------------------------------------------------------------------

create or replace function public.is_team_member()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select auth.uid() is not null;
$$;

comment on function public.is_team_member() is
  'Membership test used by every RLS policy. Flat today; layer a role check here later.';

-- ---------------------------------------------------------------------------
-- Keep updated_at honest.
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger candidates_set_updated_at
  before update on public.candidates
  for each row execute function public.set_updated_at();

create trigger candidate_notes_set_updated_at
  before update on public.candidate_notes
  for each row execute function public.set_updated_at();

create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- A profile appears automatically the moment an account is created.
-- Teammates are invited from the Supabase dashboard; no self-registration.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Attribution lock.
--
-- created_by must never be reassigned and created_at must never move. The
-- one permitted change is created_by becoming null, which is what the
-- "on delete set null" foreign key does when a teammate's account is
-- removed — their records survive with the attribution cleared.
-- ---------------------------------------------------------------------------

create or replace function public.lock_attribution()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.created_by is not null and new.created_by is distinct from old.created_by then
    raise exception 'created_by cannot be changed once set (record %)', old.id
      using errcode = 'check_violation';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'created_at cannot be changed (record %)', old.id
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger jobs_lock_attribution
  before update on public.jobs
  for each row execute function public.lock_attribution();

create trigger candidates_lock_attribution
  before update on public.candidates
  for each row execute function public.lock_attribution();

create trigger candidate_notes_lock_attribution
  before update on public.candidate_notes
  for each row execute function public.lock_attribution();

-- ---------------------------------------------------------------------------
-- Pipeline history.
--
-- Runs as the database, not as the caller, so the browser can neither skip a
-- move nor forge one. Every candidate gets an opening entry when created and
-- one entry per stage change afterwards.
-- ---------------------------------------------------------------------------

create or replace function public.log_candidate_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.candidate_stage_events (candidate_id, from_stage, to_stage, created_by)
    values (new.id, null, new.stage, auth.uid());
  elsif new.stage is distinct from old.stage then
    insert into public.candidate_stage_events (candidate_id, from_stage, to_stage, created_by)
    values (new.id, old.stage, new.stage, auth.uid());
  end if;

  return null;
end;
$$;

create trigger candidates_log_stage_change
  after insert or update of stage on public.candidates
  for each row execute function public.log_candidate_stage_change();

-- ---------------------------------------------------------------------------
-- Archiving a job also closes it — you are disabling the role, so it stops
-- taking applicants. Restoring leaves it Closed; reopening is deliberate.
-- Also stamps who archived it, so the app cannot forget to.
-- ---------------------------------------------------------------------------

create or replace function public.handle_job_archive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is not null and old.archived_at is null then
    new.status := 'Closed';
    if new.archived_by is null then
      new.archived_by := auth.uid();
    end if;
  elsif new.archived_at is null and old.archived_at is not null then
    new.archived_by := null;
  end if;

  return new;
end;
$$;

create trigger jobs_handle_archive
  before update on public.jobs
  for each row execute function public.handle_job_archive();

-- Same stamping for an individually archived candidate.
create or replace function public.handle_candidate_archive()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.archived_at is not null and old.archived_at is null then
    if new.archived_by is null then
      new.archived_by := auth.uid();
    end if;
  elsif new.archived_at is null and old.archived_at is not null then
    new.archived_by := null;
  end if;

  return new;
end;
$$;

create trigger candidates_handle_archive
  before update on public.candidates
  for each row execute function public.handle_candidate_archive();
