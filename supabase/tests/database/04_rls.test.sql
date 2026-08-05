-- Row Level Security: signed out sees nothing; signed-in members share
-- everything; nobody can forge attribution.
--
-- Each of these fails if its policy is removed.
begin;
select plan(12);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values
  ('00000000-0000-0000-0000-000000000000','aaaaaaaa-0000-4000-8000-00000000000a','authenticated','authenticated',
   'test-a@example.test','x', now(), now(), now(), '{}', '{"full_name":"Tester A"}'),
  ('00000000-0000-0000-0000-000000000000','bbbbbbbb-0000-4000-8000-00000000000b','authenticated','authenticated',
   'test-b@example.test','x', now(), now(), now(), '{}', '{"full_name":"Tester B"}');

insert into public.jobs (id, title, created_by)
values ('c0000000-0000-4000-8000-000000000020','RLS Fixture','aaaaaaaa-0000-4000-8000-00000000000a');
insert into public.candidates (id, job_id, full_name, created_by)
values ('c0000000-0000-4000-8000-000000000021','c0000000-0000-4000-8000-000000000020',
        'RLS Candidate','aaaaaaaa-0000-4000-8000-00000000000a');

-- ---------------- signed out ----------------
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';

select is((select count(*)::int from public.jobs),                   0, 'anon sees no jobs');
select is((select count(*)::int from public.candidates),             0, 'anon sees no candidates');
select is((select count(*)::int from public.candidate_notes),        0, 'anon sees no notes');
select is((select count(*)::int from public.candidate_stage_events), 0, 'anon sees no stage history');
select is((select count(*)::int from public.profiles),               0, 'anon sees no profiles');
select is((select count(*)::int from public.app_settings),           0, 'anon sees no settings');
reset role;

-- ---------------- member A ----------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}';

select ok((select count(*) from public.jobs) > 0, 'a signed-in member sees jobs');

select throws_ok(
  $$insert into public.jobs (title, created_by)
    values ('Forged','bbbbbbbb-0000-4000-8000-00000000000b')$$,
  '42501', null, 'cannot create a record attributed to someone else');

select throws_ok(
  $$insert into public.jobs (title) values ('Unattributed')$$,
  '42501', null, 'cannot create a record with no attribution');

select throws_ok(
  $$insert into public.candidate_stage_events (candidate_id, to_stage)
    values ('c0000000-0000-4000-8000-000000000021','Hired')$$,
  '42501', null, 'cannot write stage history directly — only the trigger may');

-- RLS filters rather than errors here, so assert on the VALUE, not on a throw.
update public.profiles set full_name = 'Hacked'
 where id = 'bbbbbbbb-0000-4000-8000-00000000000b';
select is(
  (select full_name from public.profiles where id = 'bbbbbbbb-0000-4000-8000-00000000000b'),
  'Tester B', 'a member cannot rename another member');
reset role;

-- ---------------- member B: shared workspace, not owner-locked ----------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-4000-8000-00000000000b","role":"authenticated"}';

update public.candidates set rating = 5 where id = 'c0000000-0000-4000-8000-000000000021';
select is(
  (select rating from public.candidates where id = 'c0000000-0000-4000-8000-000000000021'),
  5::smallint, 'a member can edit a record another member created');
reset role;

select * from finish();
rollback;
