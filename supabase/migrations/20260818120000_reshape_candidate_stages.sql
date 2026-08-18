-- Stages become: Applied, Screening, Email, Interview/Offer, Hired, Rejected.
--
-- Interview and Offer merge into one step, so anyone sitting at either lands
-- on Interview/Offer and no history is lost.
--
-- Done as a round trip through text rather than by adding values to the enum,
-- because Postgres cannot remove an enum value: adding would leave Interview
-- and Offer in the type forever, selectable in a dropdown and meaningless.
--
-- Two things have to stand aside while the columns change type:
--   * the stage-history trigger, declared UPDATE OF stage, which depends on
--     the column;
--   * the from_stage <> to_stage check, which compares the two columns and so
--     breaks the moment one has been converted and the other has not.
-- Both are restored identically at the end.

drop trigger candidates_log_stage_change on public.candidates;
alter table public.candidate_stage_events drop constraint candidate_stage_events_distinct;

alter table public.candidates alter column stage drop default;

alter table public.candidates
  alter column stage type text using stage::text;
alter table public.candidate_stage_events
  alter column from_stage type text using from_stage::text;
alter table public.candidate_stage_events
  alter column to_stage type text using to_stage::text;

update public.candidates
  set stage = 'Interview/Offer' where stage in ('Interview', 'Offer');
update public.candidate_stage_events
  set from_stage = 'Interview/Offer' where from_stage in ('Interview', 'Offer');
update public.candidate_stage_events
  set to_stage = 'Interview/Offer' where to_stage in ('Interview', 'Offer');

-- Merging two stages can leave a history row saying Interview -> Offer, which
-- is now a move from a stage to itself and no longer a change at all.
delete from public.candidate_stage_events where from_stage = to_stage;

drop type public.candidate_stage;

create type public.candidate_stage as enum (
  'Applied', 'Screening', 'Email', 'Interview/Offer', 'Hired', 'Rejected'
);

alter table public.candidates
  alter column stage type public.candidate_stage using stage::public.candidate_stage;
alter table public.candidate_stage_events
  alter column from_stage type public.candidate_stage using from_stage::public.candidate_stage;
alter table public.candidate_stage_events
  alter column to_stage type public.candidate_stage using to_stage::public.candidate_stage;

alter table public.candidates
  alter column stage set default 'Applied'::public.candidate_stage;

alter table public.candidate_stage_events
  add constraint candidate_stage_events_distinct check (from_stage is distinct from to_stage);

create trigger candidates_log_stage_change
  after insert or update of stage on public.candidates
  for each row execute function public.log_candidate_stage_change();
