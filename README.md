# FootNova Recruiting

Private recruitment tool. Post jobs, add applicants by hand, attach their CV and
LinkedIn, rate and shortlist them, and move them through a hiring pipeline.

**This repository must stay private.** The database it connects to holds real
applicants' names, email addresses, phone numbers, CVs and private assessment
notes.

## Stack

- Next.js (App Router) — ported from a Claude Design export, styles preserved verbatim
- Supabase — Postgres, Auth, and private file Storage
- Self-hosted fonts, no external CDN at runtime

## Running locally

```bash
npm install
cp .env.local.example .env.local   # then paste the anon key
npm run dev
```

Open http://localhost:3000 and sign in with an account created in the Supabase
dashboard. There is **no public sign-up** — that is deliberate.

## Environment

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public. Safe in the browser. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public by design, protected by Row Level Security. |

Never put the `service_role` key or the database password in a `NEXT_PUBLIC_*`
variable, in client code, or in any committed file. `.env.local` is gitignored
and has never been committed.

## How the data is protected

- Every table has Row Level Security. Signed-out requests return nothing.
- All signed-in accounts share one flat workspace — there are no roles yet.
- Creating a record must stamp your own account; attribution cannot be forged
  or reassigned afterwards.
- **Jobs, candidates and stage history can never be deleted** — `DELETE` is
  revoked, not merely policy-blocked. Archiving replaces deletion. Notes are
  the one intentional exception.
- CVs live in a private bucket, reachable only through short-lived signed URLs.

> Roles, if ever added, must be stored in a database column and read inside
> `public.is_team_member()` — **never** from `user_metadata`, which users can
> write to themselves.

## Database

Migrations live in `supabase/migrations/` and are applied in filename order.
Applied migrations are never edited; corrections go in a new migration.

```bash
npm run supabase:types   # regenerate lib/database.types.ts
npm run supabase:test    # pgTAP suites (needs `supabase link` first)
```

## Documentation

| File | Contents |
|---|---|
| `docs/product-analysis.md` | What the product does, in plain language |
| `docs/data-model.md` | Entities, relationships, RLS plan, archive model |
| `docs/supabase-implementation.md` | What was deployed, and the required dashboard settings |

## Demo data

The database is seeded with 6 sample jobs and 24 sample candidates for
development. Remove them before this holds real applicants — see the
instructions at the end of `docs/supabase-implementation.md`.
