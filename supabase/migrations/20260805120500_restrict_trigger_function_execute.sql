-- FootNova Recruiting — lock down trigger functions
--
-- Corrective migration. The Supabase security linter flagged that every
-- function in the `public` schema is published by PostgREST as an RPC
-- endpoint, so handle_new_user() and log_candidate_stage_change() — both
-- SECURITY DEFINER — were reachable at /rest/v1/rpc/... by anon and
-- authenticated callers.
--
-- Calling a trigger function directly would fail anyway ("trigger functions
-- can only be called as triggers"), so this was not exploitable. But a
-- SECURITY DEFINER function should never be publicly callable, and the
-- endpoints have no reason to exist.
--
-- Triggers do not require the calling role to hold EXECUTE — they run in the
-- context of the statement that fired them — so revoking costs nothing.
--
-- public.is_team_member() deliberately KEEPS its EXECUTE grant: every RLS
-- policy calls it, and policy evaluation runs as the calling role.

revoke execute on function public.handle_new_user()             from anon, authenticated, public;
revoke execute on function public.log_candidate_stage_change()  from anon, authenticated, public;
revoke execute on function public.set_updated_at()              from anon, authenticated, public;
revoke execute on function public.lock_attribution()            from anon, authenticated, public;
revoke execute on function public.handle_job_archive()          from anon, authenticated, public;
revoke execute on function public.handle_candidate_archive()    from anon, authenticated, public;

-- Note: public.rls_auto_enable() is also flagged by the linter but is
-- created and owned by the Supabase platform, not by this application. It is
-- deliberately left untouched.
