-- FootNova Recruiting — Row Level Security
-- Implements docs/data-model.md §10 (permission matrix) and §11 (RLS plan).
--
-- Shape of the workspace: flat and shared. Every signed-in account is a full
-- team member and sees the same jobs, candidates and notes. Signed-out
-- visitors get nothing at all.
--
-- Every policy routes through public.is_team_member() so a role tier can be
-- added later without touching these policies.

alter table public.profiles               enable row level security;
alter table public.jobs                   enable row level security;
alter table public.candidates             enable row level security;
alter table public.candidate_notes        enable row level security;
alter table public.candidate_stage_events enable row level security;
alter table public.app_settings           enable row level security;

-- ---------------------------------------------------------------------------
-- Hard guarantee: jobs, candidates and stage history can never be destroyed.
--
-- RLS alone would silently refuse a delete (zero rows affected). Revoking the
-- privilege makes the attempt fail loudly instead, and covers any future
-- policy mistake. Archiving is the only route.
-- ---------------------------------------------------------------------------

revoke delete on public.jobs                   from anon, authenticated;
revoke delete on public.candidates             from anon, authenticated;
revoke delete on public.candidate_stage_events from anon, authenticated;
revoke delete on public.app_settings           from anon, authenticated;
revoke delete on public.profiles               from anon, authenticated;

-- Stage history is written by trigger only, never by a client.
revoke insert, update on public.candidate_stage_events from anon, authenticated;

-- The settings row is created by migration; clients update it, never insert.
revoke insert on public.app_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- Readable by the team so records can show "added by Hazem K.".
-- Editable only by their owner. Created automatically by trigger.
-- ---------------------------------------------------------------------------

create policy "profiles are readable by team members"
  on public.profiles for select to authenticated
  using (public.is_team_member());

create policy "members update only their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- jobs — shared read and write. No delete policy, and delete is revoked above.
-- ---------------------------------------------------------------------------

create policy "jobs are readable by team members"
  on public.jobs for select to authenticated
  using (public.is_team_member());

create policy "team members create jobs as themselves"
  on public.jobs for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any job"
  on public.jobs for update to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ---------------------------------------------------------------------------
-- candidates — same shape as jobs.
--
-- Archived rows stay readable and restorable at the database level; it is the
-- application that filters them off the active screens.
-- ---------------------------------------------------------------------------

create policy "candidates are readable by team members"
  on public.candidates for select to authenticated
  using (public.is_team_member());

create policy "team members create candidates as themselves"
  on public.candidates for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any candidate"
  on public.candidates for update to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

-- ---------------------------------------------------------------------------
-- candidate_notes — the one deletable record type, by explicit decision.
-- Any team member may edit or delete any note, including someone else's:
-- there is no hierarchy yet.
-- ---------------------------------------------------------------------------

create policy "notes are readable by team members"
  on public.candidate_notes for select to authenticated
  using (public.is_team_member());

create policy "team members write notes as themselves"
  on public.candidate_notes for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any note"
  on public.candidate_notes for update to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());

create policy "team members delete any note"
  on public.candidate_notes for delete to authenticated
  using (public.is_team_member());

-- ---------------------------------------------------------------------------
-- candidate_stage_events — read only. Written by trigger, never by a client.
-- ---------------------------------------------------------------------------

create policy "stage history is readable by team members"
  on public.candidate_stage_events for select to authenticated
  using (public.is_team_member());

-- ---------------------------------------------------------------------------
-- app_settings — one shared row: readable and updatable, never created or
-- removed by a client.
-- ---------------------------------------------------------------------------

create policy "settings are readable by team members"
  on public.app_settings for select to authenticated
  using (public.is_team_member());

create policy "team members update settings"
  on public.app_settings for update to authenticated
  using (public.is_team_member())
  with check (public.is_team_member());
