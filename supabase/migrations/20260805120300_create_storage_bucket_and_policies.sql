-- FootNova Recruiting — CV storage
-- Implements docs/data-model.md §12 (bucket) and §13 (storage policies).
--
-- One private bucket. PDF and DOCX only, 10 MB cap, both enforced by the
-- bucket itself rather than only by the browser. Reads happen through
-- short-lived signed URLs; there is no permanent public address for any CV.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'candidate-cvs',
  'candidate-cvs',
  false,
  10485760,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Object policies.
--
-- Paths look like: candidates/{candidate id}/{random id}.pdf
--
-- The candidate's identifier is used rather than their name, so no personal
-- data leaks through the path and renaming a candidate never breaks a link.
-- The random filename means a CV cannot be found by guessing. Access is
-- decided by these policies, never by the filename itself.
-- ---------------------------------------------------------------------------

create policy "team members read candidate CVs"
  on storage.objects for select to authenticated
  using (bucket_id = 'candidate-cvs' and public.is_team_member());

create policy "team members upload candidate CVs"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'candidate-cvs' and public.is_team_member());

-- Replacing a CV is an update; there is no version history by design.
create policy "team members replace candidate CVs"
  on storage.objects for update to authenticated
  using (bucket_id = 'candidate-cvs' and public.is_team_member())
  with check (bucket_id = 'candidate-cvs' and public.is_team_member());

-- Delete exists only so a replaced file can be cleaned up. Archiving a
-- candidate never deletes their CV.
create policy "team members delete candidate CVs"
  on storage.objects for delete to authenticated
  using (bucket_id = 'candidate-cvs' and public.is_team_member());
