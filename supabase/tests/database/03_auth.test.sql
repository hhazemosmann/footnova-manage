-- Accounts, profiles and the attribution lock.
begin;
select plan(4);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                        email_confirmed_at, created_at, updated_at,
                        raw_app_meta_data, raw_user_meta_data)
values ('00000000-0000-0000-0000-000000000000',
        'aaaaaaaa-0000-4000-8000-00000000000a','authenticated','authenticated',
        'test-a@example.test','x', now(), now(), now(), '{}', '{"full_name":"Tester A"}');

select is(
  (select count(*)::int from public.profiles where id = 'aaaaaaaa-0000-4000-8000-00000000000a'),
  1, 'a profile is created automatically for a new account');

select is(
  (select full_name from public.profiles where id = 'aaaaaaaa-0000-4000-8000-00000000000a'),
  'Tester A', 'full_name is carried across from the account metadata');

insert into public.jobs (id, title, created_by)
values ('c0000000-0000-4000-8000-000000000010','Attribution Fixture','aaaaaaaa-0000-4000-8000-00000000000a');

select throws_ok(
  $$update public.jobs set created_at = now() - interval '1 year'
     where id = 'c0000000-0000-4000-8000-000000000010'$$,
  '23514', null, 'created_at cannot be moved');

-- Clearing attribution IS allowed: it is what happens when an account is
-- removed, and the records must survive that.
update public.jobs set created_by = null where id = 'c0000000-0000-4000-8000-000000000010';
select is(
  (select created_by from public.jobs where id = 'c0000000-0000-4000-8000-000000000010'),
  null, 'attribution may be cleared, so records outlive the account that made them');

select * from finish();
rollback;
