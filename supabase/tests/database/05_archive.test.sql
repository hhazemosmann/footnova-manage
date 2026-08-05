-- Nothing is ever destroyed, and the archive restores correctly.
--
-- The delete refusals below are the core guarantee of this product: a job or a
-- candidate cannot be removed through the API at all, only archived.
begin;
select plan(11);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000',
        'aaaaaaaa-0000-4000-8000-00000000000a','authenticated','authenticated',
        'test-a@example.test','x', now(), now(), now(), '{}', '{"full_name":"Tester A"}');

set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}';

insert into public.jobs (id, title, created_by)
values ('c0000000-0000-4000-8000-000000000030','Archive Fixture','aaaaaaaa-0000-4000-8000-00000000000a');
insert into public.candidates (id, job_id, full_name, created_by)
values
  ('c0000000-0000-4000-8000-000000000031','c0000000-0000-4000-8000-000000000030','Rides Along','aaaaaaaa-0000-4000-8000-00000000000a'),
  ('c0000000-0000-4000-8000-000000000032','c0000000-0000-4000-8000-000000000030','Archived Alone','aaaaaaaa-0000-4000-8000-00000000000a');

-- ---------------- deletion is refused outright ----------------
select throws_ok(
  $$delete from public.jobs where id = 'c0000000-0000-4000-8000-000000000030'$$,
  '42501', null, 'A JOB CANNOT BE DELETED');

select throws_ok(
  $$delete from public.candidates where id = 'c0000000-0000-4000-8000-000000000031'$$,
  '42501', null, 'A CANDIDATE CANNOT BE DELETED');

select throws_ok(
  $$delete from public.candidate_stage_events$$,
  '42501', null, 'STAGE HISTORY CANNOT BE DELETED');

-- ...but a note can. The one intentional exception.
insert into public.candidate_notes (id, candidate_id, body, created_by)
values ('c0000000-0000-4000-8000-000000000033','c0000000-0000-4000-8000-000000000031',
        'a note','aaaaaaaa-0000-4000-8000-00000000000a');
delete from public.candidate_notes where id = 'c0000000-0000-4000-8000-000000000033';
select is(
  (select count(*)::int from public.candidate_notes where id = 'c0000000-0000-4000-8000-000000000033'),
  0, 'a note CAN be deleted — the intentional exception');

-- ---------------- archive ----------------
update public.candidates set archived_at = now() where id = 'c0000000-0000-4000-8000-000000000032';
update public.jobs set archived_at = now() where id = 'c0000000-0000-4000-8000-000000000030';

select is(
  (select status::text from public.jobs where id = 'c0000000-0000-4000-8000-000000000030'),
  'Closed', 'archiving a job also closes it');

select is(
  (select archived_by from public.jobs where id = 'c0000000-0000-4000-8000-000000000030'),
  'aaaaaaaa-0000-4000-8000-00000000000a'::uuid, 'archiving stamps who did it');

select is(
  (select count(*)::int from public.candidates c join public.jobs j on j.id = c.job_id
    where c.id = 'c0000000-0000-4000-8000-000000000031'
      and (c.archived_at is not null or j.archived_at is not null)),
  1, 'a candidate rides into the archive with their job');

select is(
  (select archived_at from public.candidates where id = 'c0000000-0000-4000-8000-000000000031'),
  null, 'that candidate carries no archive flag of their own');

-- ---------------- restore ----------------
update public.jobs set archived_at = null where id = 'c0000000-0000-4000-8000-000000000030';

select is(
  (select archived_by from public.jobs where id = 'c0000000-0000-4000-8000-000000000030'),
  null, 'restoring clears the archiver');

select is(
  (select count(*)::int from public.candidates c join public.jobs j on j.id = c.job_id
    where c.id = 'c0000000-0000-4000-8000-000000000031'
      and c.archived_at is null and j.archived_at is null),
  1, 'the candidate who rode along comes back on restore');

select ok(
  (select archived_at is not null from public.candidates where id = 'c0000000-0000-4000-8000-000000000032'),
  'a separately-archived candidate STAYS archived after the job is restored');

reset role;
select * from finish();
rollback;
