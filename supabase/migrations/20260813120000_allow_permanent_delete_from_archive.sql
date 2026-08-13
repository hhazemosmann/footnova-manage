-- Permanent deletion, but only out of the Archive.
--
-- The original design had no DELETE policy on jobs or candidates at all:
-- archiving was the only way to remove something, and nothing could ever be
-- destroyed. That is still the rule for anything live. What is missing is the
-- second half of a recently-deleted folder — a way to finally empty it.
--
-- These policies grant DELETE, but the USING clause only ever matches rows
-- that are already archived. A live job or a live candidate cannot be deleted
-- by any request, however it is formed: the row simply is not visible to the
-- delete. Restoring something puts it back out of reach immediately.
--
-- Cascades do the rest. candidate_notes, candidate_documents and
-- candidate_stage_events are ON DELETE CASCADE from candidates, so a deleted
-- candidate takes their whole history with them. candidates -> jobs is
-- RESTRICT, so a job's people must be deleted first; the client does that in
-- order, which also lets it remove their files from storage on the way past.

-- The table grant was withheld along with the policy, so both halves have to
-- be restored. RLS narrows what a role may touch; it cannot widen it.
grant delete on public.jobs to authenticated;
grant delete on public.candidates to authenticated;

-- A job can be deleted once it is in the archive.
create policy "team members delete archived jobs"
  on public.jobs
  for delete
  to authenticated
  using (public.is_team_member() and archived_at is not null);

-- A candidate can be deleted once they are in the archive — either archived
-- on their own, or carried there by their job.
create policy "team members delete archived candidates"
  on public.candidates
  for delete
  to authenticated
  using (
    public.is_team_member()
    and (
      archived_at is not null
      or exists (
        select 1
        from public.jobs j
        where j.id = candidates.job_id
          and j.archived_at is not null
      )
    )
  );
