-- Schema shape. Run with: supabase test db --linked
begin;
select plan(11);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'jobs', 'jobs table exists');
select has_table('public', 'candidates', 'candidates table exists');
select has_table('public', 'candidate_notes', 'candidate_notes table exists');
select has_table('public', 'candidate_stage_events', 'candidate_stage_events table exists');
select has_table('public', 'app_settings', 'app_settings table exists');

select is(
  (select array_agg(e.enumlabel::text order by e.enumsortorder)
     from pg_enum e join pg_type t on t.oid = e.enumtypid
    where t.typname = 'candidate_stage'),
  array['Applied','Screening','Interview','Offer','Hired','Rejected'],
  'the six pipeline stages, in order'
);

select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relrowsecurity
      and c.relname in ('profiles','jobs','candidates','candidate_notes',
                        'candidate_stage_events','app_settings')),
  6, 'RLS is enabled on all six tables'
);

select is(
  (select count(*)::int from pg_policies where schemaname = 'public'),
  15, 'fifteen policies on the public tables'
);

select is(
  (select count(*)::int from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and coalesce(qual,'') || coalesce(with_check,'') like '%candidate-cvs%'),
  4, 'four storage policies scoped to the candidate-cvs bucket'
);

select ok(
  (select not public and file_size_limit = 10485760
      and allowed_mime_types @> array['application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
     from storage.buckets where id = 'candidate-cvs'),
  'candidate-cvs bucket is private, PDF+DOCX only, capped at 10 MB'
);

select * from finish();
rollback;
