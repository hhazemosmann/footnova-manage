# Supabase Implementation

Deployed **5 August 2026**. Built from the approved `docs/product-analysis.md` and `docs/data-model.md` (revision 2, archive model).

---

## Cloud project

| | |
|---|---|
| Name | `recruitment-app` |
| Project reference | `veaazwasmtxanwpmubsu` |
| API URL | `https://veaazwasmtxanwpmubsu.supabase.co` |
| Region | eu-west-2 |
| Environment | **Development** |
| State before deployment | Empty — no `public` tables, no storage buckets, no migration history |

No local Supabase database was used at any point. No `supabase start`, no Docker, no `db reset`.

The unrelated `ARCHETYPE SYSTEM` project was never touched.

---

## How the repository links to the project

Migrations were applied through the authenticated Supabase connector, which does **not** use the database password. Nothing in this repository holds a credential.

To drive the project from the CLI instead:

```bash
npx supabase link --project-ref veaazwasmtxanwpmubsu
```

That command asks for the database password. It is needed only for `supabase db push` and `supabase test db` — never commit it, never put it in a file.

---

## Migration workflow

Migrations are version-controlled in `supabase/migrations/` and applied in filename order. Applied migrations are **never edited**; a mistake is corrected with a new forward migration (as `20260805120500` below already demonstrates).

| Version | Name | What it did |
|---|---|---|
| `20260805120000` | `create_types_and_tables` | 3 enums, 6 tables, 13 indexes, 15 check constraints, `pg_trgm` |
| `20260805120100` | `create_functions_and_triggers` | 7 functions, 12 triggers |
| `20260805120200` | `enable_rls_and_policies` | RLS on all 6 tables, 7 REVOKEs, 15 policies |
| `20260805120300` | `create_storage_bucket_and_policies` | `candidate-cvs` bucket + 4 storage policies |
| `20260805120400` | `insert_reference_data` | The single `app_settings` row |
| `20260805120500` | `restrict_trigger_function_execute` | Corrective: revoked EXECUTE on trigger functions |

---

## Main tables

- **`profiles`** — display name and job title per account, created automatically
- **`jobs`** — title, location, description, source, status, posted date, archive fields
- **`candidates`** — one per person per job; contact details, LinkedIn URL, stage, shortlist mark, rating, CV metadata, archive fields
- **`candidate_notes`** — timestamped notes, the only deletable record type
- **`candidate_stage_events`** — permanent pipeline history, written only by trigger
- **`app_settings`** — one shared row

---

## Authentication design

- Email + password through Supabase Auth. No social or enterprise providers.
- **Invitation only** — teammates are added from the Supabase dashboard.
- A `profiles` row appears automatically on account creation (`handle_new_user` trigger), taking `full_name` from the account's metadata.
- No passwords, tokens or secrets are stored in any application table.
- Deleting an account removes its profile but **keeps its jobs, candidates and notes**, with attribution cleared.

### Required dashboard settings (cannot be done in a migration)

- [ ] **Turn off public sign-ups.** Authentication → Sign In / Providers → disable "Allow new users to sign up". Until this is done, anyone who finds the project URL can self-register into the workspace.
- [ ] Confirm email confirmations are enabled.

---

## Roles

**One role: team member.** Any signed-in account has full rights to all recruitment data. There is no admin/member hierarchy.

Every RLS policy calls `public.is_team_member()`, which today returns `auth.uid() is not null`. Adding a role tier later means changing that one function plus one column — not rewriting the policies.

---

## RLS overview

| Table | Signed out | Signed in |
|---|---|---|
| `profiles` | nothing | read all; update only your own |
| `jobs` | nothing | read, create (as yourself), update. **Delete revoked** |
| `candidates` | nothing | read, create (as yourself), update. **Delete revoked** |
| `candidate_notes` | nothing | read, create (as yourself), update, delete |
| `candidate_stage_events` | nothing | read only. Insert/update/delete revoked |
| `app_settings` | nothing | read, update. Insert/delete revoked |

Two guarantees enforced below the application:

1. **Jobs, candidates and stage history cannot be deleted.** `DELETE` is revoked from `anon` and `authenticated`, so the attempt fails loudly rather than being silently filtered. Archiving is the only route.
2. **Attribution cannot be forged.** Insert policies require `created_by = auth.uid()`, and a trigger blocks any later reassignment of `created_by` or `created_at`. The one permitted change is `created_by` becoming null when an account is removed.

---

## Storage

**Bucket `candidate-cvs`** — private, PDF and DOCX only, 10 MB cap, all enforced by the bucket itself.

Object path: `candidates/{candidate id}/{random id}.{pdf|docx}` — the candidate's identifier rather than their name, so no personal data leaks through the path and a rename never breaks a link. The random filename means a CV cannot be found by guessing.

Access model: signed-in team members only, for read, upload, replace and delete. Reads go through **short-lived signed URLs**; there is no permanent public address for any CV. Access is decided by policy, never by filename.

Archiving a candidate does **not** delete their CV. The only file deletion is replacing a CV with a newer one, since there is no version history.

---

## Reference and demo data

**Reference data (in every environment):** the single `app_settings` row, matching the app's Settings screen defaults. The three toggles are stored but inert — nothing in this product sends email.

**Demo data (development only, applied):** 6 jobs, 24 candidates, 2 notes, from `supabase/seed.sql`. One job (*Match Data Engineer*) is seeded already archived so the Archive tab is verifiable. 24 stage-history rows were written automatically by the trigger. `created_by` is null throughout — no real account created them.

To remove it later:

```sql
delete from public.candidate_notes;
delete from public.candidate_stage_events;
delete from public.candidates;   -- requires the postgres role
delete from public.jobs;
```

---

## Tests

pgTAP suites live in `supabase/tests/database/`:

| File | Covers |
|---|---|
| `01_schema.test.sql` | tables, enums, RLS enabled, policy counts, bucket configuration |
| `02_constraints.test.sql` | rating range, blank names, emails, LinkedIn URLs, CV metadata, settings singleton |
| `03_auth.test.sql` | profile auto-creation, attribution lock, attribution clearing |
| `04_rls.test.sql` | signed-out denial, shared-workspace access, forged attribution, direct history writes |
| `05_archive.test.sql` | delete refusals, archive cascade, restore, individually-archived records |
| `06_stage_history.test.sql` | history on create and on move, no spurious history |

```bash
npm run supabase:test        # needs `supabase link` first
```

Every security test fails if its policy is removed.

---

## TypeScript types

Generated from the live project into `lib/database.types.ts`. Never hand-edit.

```bash
npm run supabase:types
```

---

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL       = https://veaazwasmtxanwpmubsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = (Dashboard → Project Settings → API Keys)
```

Both are public by design and protected by RLS, not by secrecy. See `.env.local.example`.

**Never** put the `service_role` key or the database password in a `NEXT_PUBLIC_*` variable, in client code, or in any committed file.

---

## Assumptions

1. Everyone with an account is a trusted colleague with full rights to all recruitment data.
2. The team stays small (2–3 people).
3. One candidate belongs to one job; the same person applying twice creates two records.
4. Ratings are whole stars 1–5; unrated is stored as empty.
5. CV uploads happen through the app, so file and record stay in step.

---

## Known limitations

- **The application is not yet wired to this database.** It still runs on `lib/auth-stub.ts` and the in-memory `lib/demo-data.ts`. Everything above exists and is tested, but the screens do not read from it yet. That is the next piece of work.
- **The Archive tab does not exist in the app yet.** The database supports it fully; the screen is still to be built.
- **`public.rls_auto_enable()`** is flagged by the Supabase security linter as a publicly executable SECURITY DEFINER function. It is created and owned by the Supabase platform, not by this application, and was deliberately left alone.
- **Public sign-ups are still enabled** until the dashboard checkbox above is unticked.
- The seeded demo rows carry no author, so notes display as unattributed.

---

## Correction approach

Roll forward only. Applied migrations are never edited and the database is never reset. A problem is fixed by adding a new timestamped migration, as `20260805120500` did for the trigger-function grants.
