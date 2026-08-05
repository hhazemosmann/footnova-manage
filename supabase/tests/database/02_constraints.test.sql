-- Business rules enforced by PostgreSQL, not just the browser.
begin;
select plan(12);

insert into public.jobs (id, title) values ('c0000000-0000-4000-8000-000000000001', 'Constraint Fixture');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, rating)
    values ('c0000000-0000-4000-8000-000000000001','Bad',6)$$,
  '23514', null, 'rating above 5 is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, rating)
    values ('c0000000-0000-4000-8000-000000000001','Bad',0)$$,
  '23514', null, 'rating below 1 is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name)
    values ('c0000000-0000-4000-8000-000000000001','   ')$$,
  '23514', null, 'blank candidate name is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, email)
    values ('c0000000-0000-4000-8000-000000000001','Bad','not-an-email')$$,
  '23514', null, 'malformed email is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, linkedin_url)
    values ('c0000000-0000-4000-8000-000000000001','Bad','javascript:alert(1)')$$,
  '23514', null, 'non-http LinkedIn URL is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, cv_object_path)
    values ('c0000000-0000-4000-8000-000000000001','Bad','candidates/x/y.pdf')$$,
  '23514', null, 'half-filled CV metadata is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, cv_object_path, cv_file_name,
                                   cv_mime_type, cv_size_bytes, cv_uploaded_at)
    values ('c0000000-0000-4000-8000-000000000001','Bad','candidates/x/b.pdf','b.pdf',
            'application/pdf', 20000000, now())$$,
  '23514', null, 'CV larger than 10 MB is rejected');

select throws_ok(
  $$insert into public.candidates (job_id, full_name, cv_object_path, cv_file_name,
                                   cv_mime_type, cv_size_bytes, cv_uploaded_at)
    values ('c0000000-0000-4000-8000-000000000001','Bad','candidates/x/e.exe','e.exe',
            'application/x-msdownload', 1000, now())$$,
  '23514', null, 'CV with a disallowed file type is rejected');

select throws_ok(
  $$insert into public.jobs (title) values ('   ')$$,
  '23514', null, 'blank job title is rejected');

select throws_ok(
  $$update public.jobs set archived_by = '00000000-0000-4000-8000-000000000000'
     where id = 'c0000000-0000-4000-8000-000000000001'$$,
  '23514', null, 'an archiver cannot be recorded without an archive time');

select throws_ok(
  $$insert into public.app_settings (id) values (2)$$,
  '23514', null, 'a second settings row is rejected');

insert into public.candidates (id, job_id, full_name)
values ('c0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000001','Fixture');

select throws_ok(
  $$insert into public.candidate_notes (candidate_id, body)
    values ('c0000000-0000-4000-8000-000000000002','   ')$$,
  '23514', null, 'blank note body is rejected');

select * from finish();
rollback;
