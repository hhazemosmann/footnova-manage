-- Pipeline history is written by the database on every move, so
-- "how long has this person been sitting at Interview?" is answerable.
begin;
select plan(4);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000',
        'aaaaaaaa-0000-4000-8000-00000000000a','authenticated','authenticated',
        'test-a@example.test','x', now(), now(), now(), '{}', '{"full_name":"Tester A"}');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}';

insert into public.jobs (id, title, created_by)
values ('c0000000-0000-4000-8000-000000000040','History Fixture','aaaaaaaa-0000-4000-8000-00000000000a');
insert into public.candidates (id, job_id, full_name, stage, created_by)
values ('c0000000-0000-4000-8000-000000000041','c0000000-0000-4000-8000-000000000040',
        'History Candidate','Applied','aaaaaaaa-0000-4000-8000-00000000000a');

select is(
  (select count(*)::int from public.candidate_stage_events
    where candidate_id = 'c0000000-0000-4000-8000-000000000041'
      and from_stage is null and to_stage = 'Applied'),
  1, 'an opening entry is written when the candidate is created');

update public.candidates set stage = 'Interview' where id = 'c0000000-0000-4000-8000-000000000041';

select is(
  (select count(*)::int from public.candidate_stage_events
    where candidate_id = 'c0000000-0000-4000-8000-000000000041'
      and from_stage = 'Applied' and to_stage = 'Interview'
      and created_by = 'aaaaaaaa-0000-4000-8000-00000000000a'),
  1, 'a stage move records where from, where to, and who moved them');

-- An update that does not touch the stage must not invent history.
update public.candidates set rating = 4 where id = 'c0000000-0000-4000-8000-000000000041';
select is(
  (select count(*)::int from public.candidate_stage_events
    where candidate_id = 'c0000000-0000-4000-8000-000000000041'),
  2, 'editing something other than the stage writes no history');

select ok(
  (select created_at from public.candidate_stage_events
    where candidate_id = 'c0000000-0000-4000-8000-000000000041'
      and to_stage = 'Interview') is not null,
  'every entry carries a real timestamp');

reset role;
select * from finish();
rollback;
