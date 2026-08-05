-- FootNova Recruiting — required reference data
-- Implements docs/data-model.md §15 (required reference data).
--
-- The single app_settings row. Defaults match the application's Settings
-- screen exactly. The toggles are stored but inert: nothing in this product
-- sends email, and the 09:00 digest does nothing.

insert into public.app_settings (
  id,
  careers_inbox_email,
  default_pipeline,
  require_email_on_new_candidates,
  email_on_shortlist_add,
  require_cv_before_interview
)
values (
  1,
  'careers@footnova.com',
  'Applied → Screening → Interview → Offer → Hired',
  true,
  true,
  false
)
on conflict (id) do nothing;
