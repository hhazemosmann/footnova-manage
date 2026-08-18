-- The allowed values for the default-pipeline setting spelled out the old
-- stage names, so the setting could not be moved to the new ones.
alter table public.app_settings drop constraint app_settings_pipeline_allowed;

alter table public.app_settings
  alter column default_pipeline set default 'Applied → Screening → Email → Interview/Offer → Hired';

update public.app_settings
set default_pipeline = case default_pipeline
  when 'Applied → Screening → Interview → Offer → Hired'
    then 'Applied → Screening → Email → Interview/Offer → Hired'
  when 'Applied → Interview → Offer'
    then 'Applied → Screening → Interview/Offer → Hired'
  else default_pipeline
end;

alter table public.app_settings
  add constraint app_settings_pipeline_allowed check (
    default_pipeline = any (array[
      'Applied → Screening → Email → Interview/Offer → Hired'::text,
      'Applied → Screening → Interview/Offer → Hired'::text
    ])
  );
