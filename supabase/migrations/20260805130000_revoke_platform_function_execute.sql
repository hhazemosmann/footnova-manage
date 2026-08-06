-- Pre-deployment security audit follow-up.
--
-- public.rls_auto_enable() is a Supabase platform event-trigger function that
-- auto-enables RLS on newly created public tables. The security linter flags
-- it because anon and authenticated held EXECUTE on a SECURITY DEFINER
-- function exposed through PostgREST.
--
-- It is not usefully callable — it returns `event_trigger`, and a direct RPC
-- attempt fails with "cannot display a value of type event_trigger" (verified
-- against the live API as anon). Event triggers also fire as the function
-- owner regardless of grants, so revoking EXECUTE does not change the
-- platform behaviour it provides.
--
-- Revoked anyway: nothing outside the database has any reason to hold EXECUTE
-- on a SECURITY DEFINER function.
--
-- public.is_team_member() deliberately KEEPS its grant — every RLS policy
-- calls it, and policy expressions are evaluated as the calling role.

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
