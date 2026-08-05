# Data Model

Derived from the approved `docs/product-analysis.md` plus the product owner's answers of 5 Aug 2026.

**Nothing in this document has been applied to Supabase yet.** It is a design awaiting approval.

**Revision 2** — replaces permanent deletion with an Archive. See §7.

---

## 1. Backend Summary

FootNova Recruiting becomes a **shared team workspace**. Two or three people each sign in with their own account, and they all see and work on the same jobs, candidates and notes. There is no per-person walled-off data, and no manager/member hierarchy — everyone is a full member with equal rights.

The backend stores six kinds of information: **team members**, **jobs**, **candidates**, **notes**, **stage history**, and one row of **settings**. Candidate CVs live in a private file store that is unreachable without being signed in.

**Nothing is ever destroyed.** Jobs and candidates you are finished with are archived, not deleted — they leave the active screens and move to an Archive tab, keeping every CV, note and stage record intact, and they can be brought back at any time.

Two things are recorded automatically and cannot be faked by the browser:

- **Who did what.** Every job, candidate, note and stage change records the account that created it.
- **When each candidate reached each stage.** Every stage move is logged by the database itself, which is what makes "how long has this person been sitting at Interview?" answerable.

---

## 2. Database Entities

| Business name | Table | Purpose | Owned by | Who may access | Source |
|---|---|---|---|---|---|
| Team member | `profiles` | Display name and job title for each signed-in account | The account itself | All team members can read; you edit only your own | Interface (sidebar shows "Hazem K. / Talent Lead") + product context |
| Job opening | `jobs` | A role being recruited for | The whole team | All team members, full rights | Both |
| Candidate | `candidates` | A person who applied to one job | The whole team | All team members, full rights | Both |
| Note | `candidate_notes` | A timestamped comment about a candidate | The whole team | All team members, full rights | Both |
| Stage history | `candidate_stage_events` | A log of every pipeline move | The whole team | All team members, read-only | Product context |
| Settings | `app_settings` | One shared row of preferences | The whole team | All team members, read and update | Interface |

No other tables are proposed. There is deliberately **no** organisations table, **no** teams table, **no** roles table, **no** notifications table, **no** payments table and **no** audit log.

---

## 3. Fields and PostgreSQL Types

### Custom types

| Type | Values |
|---|---|
| `job_status` | `Open`, `Closed` |
| `candidate_stage` | `Applied`, `Screening`, `Interview`, `Offer`, `Hired`, `Rejected` |
| `entity_source` | `Manual entry`, `Referral`, `Direct application`, `Agency`, `Scouting network` |

These match the app's dropdowns exactly. Adding a value later is a one-line migration.

### `profiles`

| Field | Meaning | Type | Required | Default | Notes |
|---|---|---|---|---|---|
| `id` | The signed-in account | `uuid` PK | Yes | — | Points at Supabase's own user record |
| `full_name` | Display name, e.g. "Hazem K." | `text` | Yes | `''` | Shown in the sidebar and against each record |
| `job_title` | e.g. "Talent Lead" | `text` | No | — | The second sidebar line |
| `created_at` / `updated_at` | Record timestamps | `timestamptz` | Yes | `now()` | |

Created automatically the moment an account is added — no manual step.

### `jobs`

| Field | Meaning | Type | Required | Default | Notes |
|---|---|---|---|---|---|
| `id` | Internal identifier | `uuid` PK | Yes | generated | |
| `title` | Job title | `text` | Yes | — | 1–200 characters |
| `location` | e.g. "Cairo, EG (Hybrid)" | `text` | No | — | Free text, covers remote and hybrid |
| `description` | Role summary | `text` | No | — | **Gap fix** — currently discarded by the form |
| `source` | Where the role came from | `entity_source` | Yes | `Manual entry` | |
| `status` | Open or closed | `job_status` | Yes | `Open` | Whether it is taking applicants |
| `posted_on` | Date posted | `date` | Yes | today | **Gap fix** — a real date, not "12 Jul 2026" text |
| **`archived_at`** | **When it was archived** | **`timestamptz`** | **No** | — | **Empty = live. Set = in the Archive** |
| **`archived_by`** | **Who archived it** | **`uuid`** | **No** | — | |
| `created_by` | Who posted it | `uuid` | See §5 | — | Attribution |
| `created_at` / `updated_at` | Record timestamps | `timestamptz` | Yes | `now()` | |

### `candidates`

| Field | Meaning | Type | Required | Default | Sensitive | Notes |
|---|---|---|---|---|---|---|
| `id` | Internal identifier | `uuid` PK | Yes | generated | | |
| `job_id` | Which job they applied to | `uuid` | Yes | — | | Exactly one |
| `full_name` | Candidate's name | `text` | Yes | — | **Yes** | |
| `email` | Contact email | `text` | No | — | **Yes** | Must look like an email if given |
| `phone` | Contact phone | `text` | No | — | **Yes** | |
| `linkedin_url` | Pasted profile URL | `text` | No | — | **Yes** | **Gap fix** — must start with `http://` or `https://` |
| `source` | How they came in | `entity_source` | Yes | `Manual entry` | | **Gap fix** — currently discarded by the form |
| `stage` | Pipeline position | `candidate_stage` | Yes | `Applied` | **Yes** | |
| `is_shortlisted` | Shortlist mark | `boolean` | Yes | `false` | **Yes** | **Independent of stage** |
| `rating` | Star rating | `smallint` | No | — | **Yes** | 1–5 only; empty means not yet rated |
| `applied_on` | Date they applied | `date` | Yes | today | | **Gap fix** — a real date |
| **`archived_at`** | **When archived individually** | **`timestamptz`** | **No** | — | | **Empty = live** |
| **`archived_by`** | **Who archived them** | **`uuid`** | **No** | — | | |
| `cv_object_path` | Where the CV file sits | `text` | No | — | **Yes** | Unique; empty until a CV is uploaded |
| `cv_file_name` | Original filename | `text` | No | — | **Yes** | Shown in the panel instead of the "CV.pdf" placeholder |
| `cv_mime_type` | PDF or DOCX | `text` | No | — | | Decides inline preview vs download link |
| `cv_size_bytes` | File size | `bigint` | No | — | | Capped at 10 MB |
| `cv_uploaded_at` | When it was uploaded | `timestamptz` | No | — | | |
| `cv_uploaded_by` | Who uploaded it | `uuid` | No | — | | |
| `created_by` | Who added the candidate | `uuid` | See §5 | — | | Attribution |
| `created_at` / `updated_at` | Record timestamps | `timestamptz` | Yes | `now()` | | |

The six `cv_*` fields are all-or-nothing: either a CV is attached and they are all filled, or none of them are.

**No CV version history**, per your decision — a new upload replaces the old file and overwrites these fields.

### `candidate_notes`

| Field | Meaning | Type | Required | Default | Notes |
|---|---|---|---|---|---|
| `id` | Internal identifier | `uuid` PK | Yes | generated | |
| `candidate_id` | Which candidate | `uuid` | Yes | — | |
| `body` | The note text | `text` | Yes | — | Cannot be blank or whitespace |
| `created_by` | Who wrote it | `uuid` | See §5 | — | Replaces the hardcoded "Hazem K." |
| `created_at` | When it was written | `timestamptz` | Yes | `now()` | **Gap fix** — replaces "2d ago" text |
| `updated_at` | Last edited | `timestamptz` | Yes | `now()` | |

The app's "2d ago" display is calculated in the browser from `created_at`, so it stays accurate forever instead of being frozen text.

### `candidate_stage_events`

| Field | Meaning | Type | Required | Default | Notes |
|---|---|---|---|---|---|
| `id` | Internal identifier | `uuid` PK | Yes | generated | |
| `candidate_id` | Which candidate | `uuid` | Yes | — | |
| `from_stage` | Stage moved out of | `candidate_stage` | No | — | Empty for the first entry |
| `to_stage` | Stage moved into | `candidate_stage` | Yes | — | |
| `created_by` | Who moved them | `uuid` | No | — | Captured by the database |
| `created_at` | When | `timestamptz` | Yes | `now()` | |

**Written only by the database.** The browser cannot insert, edit or delete rows here — it can only read them. That keeps the history trustworthy.

### `app_settings`

Exactly one row, enforced by the database.

| Field | Meaning | Type | Required | Default |
|---|---|---|---|---|
| `id` | Always `1` | `smallint` PK | Yes | `1` |
| `careers_inbox_email` | Careers inbox | `text` | No | `careers@footnova.com` |
| `default_pipeline` | Chosen pipeline | `text` | Yes | the five-stage option |
| `require_email_on_new_candidates` | Toggle A | `boolean` | Yes | `true` |
| `email_on_shortlist_add` | Toggle B | `boolean` | Yes | `true` |
| `require_cv_before_interview` | Toggle C | `boolean` | Yes | `false` |
| `updated_at` / `updated_by` | Who changed it last | | | |

Defaults match the app exactly. **The toggles are stored but inert** — per your decision, no email is sent by anything, and the 09:00 digest does nothing.

---

## 4. Table Relationships

- A **team member** can create many jobs, candidates and notes.
- A **job** can have many **candidates**. Every candidate belongs to exactly one job. *(One-to-many, required)*
- A **candidate** can have many **notes**. Every note belongs to exactly one candidate. *(One-to-many, required)*
- A **candidate** can have many **stage events**. *(One-to-many, required)*
- A **candidate** has at most one **CV file**. *(One-to-one, optional — stored as fields, not a table)*
- **Settings** stand alone.

There are no many-to-many relationships and no join tables.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "has"
    PROFILES ||--o{ JOBS : "created"
    PROFILES ||--o{ CANDIDATES : "added"
    PROFILES ||--o{ CANDIDATE_NOTES : "wrote"
    PROFILES ||--o{ CANDIDATE_STAGE_EVENTS : "made"
    JOBS ||--o{ CANDIDATES : "receives"
    CANDIDATES ||--o{ CANDIDATE_NOTES : "has"
    CANDIDATES ||--o{ CANDIDATE_STAGE_EVENTS : "moves through"

    AUTH_USERS {
        uuid id PK
        text email
    }
    PROFILES {
        uuid id PK_FK
        text full_name
        text job_title
    }
    JOBS {
        uuid id PK
        text title
        text location
        text description
        enum source
        enum status
        date posted_on
        timestamptz archived_at
        uuid archived_by FK
        uuid created_by FK
    }
    CANDIDATES {
        uuid id PK
        uuid job_id FK
        text full_name
        text email
        text phone
        text linkedin_url
        enum source
        enum stage
        bool is_shortlisted
        smallint rating
        date applied_on
        timestamptz archived_at
        uuid archived_by FK
        text cv_object_path
        text cv_file_name
        uuid created_by FK
    }
    CANDIDATE_NOTES {
        uuid id PK
        uuid candidate_id FK
        text body
        uuid created_by FK
        timestamptz created_at
    }
    CANDIDATE_STAGE_EVENTS {
        uuid id PK
        uuid candidate_id FK
        enum from_stage
        enum to_stage
        uuid created_by FK
        timestamptz created_at
    }
    APP_SETTINGS {
        smallint id PK
        text careers_inbox_email
        bool require_email_on_new_candidates
        bool email_on_shortlist_add
        bool require_cv_before_interview
    }
```

---

## 5. Constraints and Business Rules

Enforced in PostgreSQL, not just in the browser:

- Job title must be 1–200 characters and cannot be blank.
- Candidate name cannot be blank.
- Rating, when given, must be a whole number from 1 to 5. Nothing else can be stored.
- Stage and status can only ever hold their listed values.
- A candidate must belong to a job that exists.
- A note must belong to a candidate that exists, and cannot be empty or whitespace.
- Email, when given, must look like an email address.
- LinkedIn URL, when given, must start with `http://` or `https://`.
- CV fields are all-or-nothing — no half-recorded file.
- CV file path is unique; two candidates can never point at the same file.
- CV size cannot exceed 10 MB.
- A stage event cannot record a move from a stage to itself.
- Settings can only ever have one row.
- `archived_at` and `archived_by` are all-or-nothing — an archived record always records who archived it.

**Attribution rules:**

- On creation, `created_by` **must** equal the account doing the writing. The browser cannot claim someone else made a record.
- `created_by` and `created_at` **cannot be changed afterwards** — a trigger blocks it.
- If a teammate's account is later deleted, their `created_by` becomes empty and **their jobs, candidates and notes stay**. Business records are never destroyed because a person left.

---

## 6. Statuses and Transitions

### Jobs — two independent dimensions

**Status** (is it taking applicants?): starts **Open**, freely switchable between Open and Closed.

**Archived** (is it still on my screens?): starts live, archivable and restorable at any time.

These are deliberately separate, in the same way the shortlist mark is separate from pipeline stage. A job can be Closed but still live on your Jobs screen while you finish reviewing its applicants — closing it is not the same as putting it away.

**Archiving a job also sets its status to Closed automatically** — you are disabling it, so it stops taking applicants. Restoring leaves it Closed; you reopen it deliberately if you want it live again.

### Candidates — pipeline stage

Start at **Applied** (or whatever is chosen in the Add Candidate form).

**Applied → Screening → Interview → Offer → Hired**, with **Rejected** reachable from any stage.

Per your instruction, the app's existing behaviour is preserved:

- "Move to next stage" advances one step and **stops at Hired** — it never lands on Rejected.
- Any stage can be set directly from the dropdown, including moving backwards.
- Rejecting a candidate also clears their shortlist mark.

Any team member can perform any transition. There is no approval step and no locked final state — a Hired or Rejected candidate can still be moved if you change your mind.

**Status history is kept**, automatically, for every move.

### Candidates — shortlist mark

**Independent of stage**, exactly as you confirmed. A candidate can be at Interview *and* shortlisted at the same time, and the Shortlist screen lists everyone marked, whatever stage they are in.

The one existing automatic behaviour is preserved: shortlisting a candidate who is still at **Applied** also moves them to **Screening**. That move is logged in the history like any other.

---

## 7. Archive and Retention

**Nothing in this product is ever permanently deleted.** This replaces the deletion model in revision 1.

### What archiving means

A job or candidate is either **live** or **archived**. Archived records keep everything — CVs, notes, ratings, stage history, attribution — and can be restored to exactly the state they left in.

| Record | Behaviour | Effect |
|---|---|---|
| Job | **Archive / restore.** Never deleted | Moves the job **and all its candidates** out of the active screens into the Archive. Also sets the job to Closed |
| Candidate | **Archive / restore.** Never deleted | Moves that one person into the Archive; their job stays live |
| Note | Edit and delete allowed | A typo'd note is just a typo — see the flag below |
| Stage event | Never deleted, never edited | Permanent history |
| CV file | Never deleted by archiving | Only removed when replaced by a new upload |
| Settings | Never deleted | — |
| Team member account | Deleted in the Supabase dashboard | Their profile goes. **Their jobs, candidates and notes stay**, attribution cleared |

### How "archived" is decided

- A **job** is archived when its `archived_at` is set.
- A **candidate** is archived when **either** their own `archived_at` is set **or** their job is archived.

That second rule is what makes restore work correctly without bookkeeping. Archive a job and its 8 candidates go with it; restore the job and those 8 come back — **except** anyone you had already archived individually beforehand, who correctly stays put.

### What this changes elsewhere

- **Every active screen filters archived records out**: the Jobs list, the Overview dashboard and its counts, the funnel, the Shortlist, and the search.
- **A new Archive tab** appears in the sidebar, listing archived jobs and archived candidates with a Restore action on each. This screen has no counterpart in your original design, so I will build it from the existing tokens and table patterns — same look as the Shortlist screen.
- **The Jobs screen's All / Open / Closed chips are unchanged**, and now operate over your live jobs only.

### Two consequences worth noting

**This removes the risk I flagged in revision 1.** There is no longer any action that wipes out 8 people at once. Archiving is reversible, so a mis-click costs nothing.

**It also removes the CV-orphan limitation.** Since candidates are never deleted, CVs are never cascade-deleted, so the storage-cleanup gap I described simply does not arise. The only file deletion left is replacing a CV with a newer one, which the app does directly and can confirm.

> **One flag:** you said nothing related to jobs and candidates is deleted. I have kept **notes** editable and deletable, since a note is your own sentence and fixing a typo by archiving it would be strange. Stage history stays permanent regardless. Say the word if you want notes to be undeletable too.

---

## 8. Indexes

| Table | Index | Why |
|---|---|---|
| `jobs` | `status` | The Open/Closed filter and the dashboard |
| `jobs` | live jobs (partial, where not archived) | Every active screen filters on this |
| `jobs` | `archived_at` | The Archive tab |
| `jobs` | `created_by` | "What did I post?" |
| `jobs` | text search on title | The top-bar search |
| `candidates` | `job_id` | Loading a job's candidate table — the most common query in the app |
| `candidates` | `stage` | The stage filter chips and the funnel |
| `candidates` | live candidates (partial, where not archived) | Every active screen filters on this |
| `candidates` | shortlisted (partial) | The Shortlist screen |
| `candidates` | `created_by` | Attribution lookups |
| `candidates` | text search on name | The top-bar search |
| `candidates` | `cv_object_path` (unique) | Prevents two candidates sharing a file |
| `candidate_notes` | `candidate_id` + newest first | Loading a candidate's notes |
| `candidate_stage_events` | `candidate_id` + newest first | "How long at this stage?" |

Text search uses PostgreSQL's `pg_trgm` extension, which matches text anywhere inside a field — the same "contains" behaviour the app's search box has today.

---

## 9. Supabase Authentication

- **Sign-in method:** email address and password.
- **Registration:** **invitation only.** There is no public sign-up form. You add teammates from the Supabase dashboard, as you asked.
- **Email confirmation:** on.
- **Password reset:** Supabase's built-in flow, wired to the existing "Forgot password?" screen.
- **Social/enterprise logins:** none.
- **Anonymous access:** none — every screen requires a signed-in account.
- **Profiles:** a profile row is created automatically whenever an account is added.
- **Roles:** **none.** The workspace is flat, as you specified.

Passwords are handled entirely by Supabase and are never stored in any application table.

> **Required dashboard setting (cannot be done in a migration):** turn off public sign-ups, so nobody can self-register into your workspace. I will document this and confirm it is set.

**The existing stub login is replaced entirely.** `lib/auth-stub.ts`, with its plain-text credentials, is deleted.

---

## 10. Role and Permission Matrix

One role: **team member** (any signed-in account).

| | Read | Create | Update | Archive / Restore | Delete |
|---|---|---|---|---|---|
| Jobs | ✅ | ✅ | ✅ | ✅ | ❌ never |
| Candidates | ✅ | ✅ | ✅ | ✅ | ❌ never |
| Notes | ✅ | ✅ | ✅ | — | ✅ |
| Stage history | ✅ | ❌ database only | ❌ | — | ❌ never |
| Settings | ✅ | ❌ | ✅ | — | ❌ |
| Own profile | ✅ | ❌ automatic | ✅ | — | ❌ |
| Other profiles | ✅ | ❌ | ❌ | — | ❌ |
| CV files | ✅ | ✅ | ✅ replace | — | ❌ except on replace |

**Signed-out visitors get nothing at all** — no table, no file, no row.

**Notes are editable and deletable by any team member**, including notes written by someone else — confirmed by you, since there is no hierarchy yet.

---

## 11. Row Level Security Plan

In plain language, for every table:

- **Signed out → no access whatsoever.** Not read, not write, on any table.
- **Signed in → full read and write** across jobs, candidates, notes and settings, because it is one shared workspace. Archived records are readable and restorable, not hidden at the database level — the *app* filters them off the active screens.
- **Creating anything** requires stamping your own account as the creator. You cannot write a record that claims someone else made it.
- **Deleting jobs and candidates is refused by the database itself**, not merely hidden in the interface. Even a direct API call cannot destroy a job or a candidate. Archiving is the only route.
- **Stage history is read-only** to everyone. Only the database writes it.
- **Profiles** are readable by all team members (needed to show "added by Hazem K."), but you can only edit your own.

**Designed for a role check to be added later.** Every policy calls a single small function, `is_team_member()`, which today means "is signed in". When you want an admin tier, that function and one new column change — not fifteen policies. This is the seam you asked for.

Policy SQL is not written until this document is approved.

---

## 12. Storage Buckets

One bucket.

| Setting | Value |
|---|---|
| **Name** | `candidate-cvs` |
| **Purpose** | Candidate CV files |
| **Public?** | **Private.** Never publicly readable |
| **Allowed formats** | PDF and DOCX only — enforced by the bucket, not just the browser |
| **Maximum size** | 10 MB — enforced by the bucket |
| **File path** | `candidates/{candidate id}/{random id}.{pdf\|docx}` |
| **Belongs to** | One candidate |
| **Who can upload / read / replace** | Any signed-in team member |
| **When its candidate is archived** | **Nothing — the file is kept** |
| **When a CV is replaced** | The previous file is removed, since there is no version history |

Path uses the candidate's identifier rather than their name, so no personal data leaks through the file path and renaming a candidate never breaks a link. A random filename means a CV cannot be found by guessing.

---

## 13. Storage Policies

- **Upload / read / replace / delete:** signed-in team members only, and only within the `candidate-cvs` bucket.
- **Signed-out access:** denied outright.
- **Sharing:** reading happens through **short-lived signed URLs** generated on demand — a link expires shortly after it is issued and cannot be reshared usefully. There is no permanent public address for any CV.
- **Inline preview:** PDFs are displayed in the candidate panel through a signed URL. DOCX files, which browsers cannot render, get a download link instead — as you specified.
- Access is decided by the policies, never by the filename.

---

## 14. File Metadata

**No separate file table is proposed.**

Each candidate has at most one CV and there is no version history, so the six `cv_*` fields on the candidate record carry everything needed: path, original filename, type, size, when, and by whom. A separate table would add a join to every candidate query and buy nothing.

This decision would need revisiting only if you later want CV history (you said no) or files attached to notes (not in the product).

---

## 15. Cloud Seed-Data Plan

### Required reference data — applied via migration, in every environment

- The single `app_settings` row, with the app's existing defaults.

That is all. There are no status tables, category tables or permission tables to populate.

### Demo and test data — **approved for this development project**

The 6 jobs, 24 candidates and 2 notes from `lib/demo-data.ts` will be loaded so the screens have content while the app is rewired. You confirmed: *"load it for now and we will delete it later."*

- Demo rows are created with no attributed author, since no real account created them.
- One demo job will be seeded **already archived**, so the new Archive tab has something to show and can be verified end to end.
- No demo CV files are uploaded — the file store starts empty.
- Removing it later is a single delete statement, which I will include in the implementation notes.

---

## 16. Remote Database-Test Plan

pgTAP tests run against the cloud project:

| File | Covers |
|---|---|
| `01_schema.test.sql` | All six tables exist, correct columns, correct types, keys, the three custom types, required indexes |
| `02_constraints.test.sql` | Rating outside 1–5 rejected; blank names rejected; empty notes rejected; bad email rejected; bad LinkedIn URL rejected; duplicate CV path rejected; a second settings row rejected; half-filled CV fields rejected; half-filled archive fields rejected |
| `03_auth.test.sql` | A new account gets a profile automatically; you cannot edit another person's profile; `created_by` cannot be changed after creation |
| `04_rls.test.sql` | Signed out sees nothing on every table; two different signed-in accounts each see the *other's* records (proving the shared workspace); nobody can insert a record attributed to someone else; nobody can write to stage history directly |
| `05_storage.test.sql` | The bucket exists and is private; signed out cannot read; signed-in can upload, read and replace; a non-PDF/DOCX upload is rejected; an oversized upload is rejected |
| `06_archive.test.sql` | **Deleting a job is refused; deleting a candidate is refused; deleting a stage event is refused.** Archiving a job archives its candidates; restoring brings them back; a separately-archived candidate stays archived after their job is restored; archiving sets the job to Closed; CVs and notes survive archiving |
| `07_behaviour.test.sql` | Stage history is written on creation and on every move; the settings row exists; deleting an account keeps their records |

Each security test is written so it **fails if its policy is removed** — otherwise the test proves nothing.

---

## 17. TypeScript-Type Plan

The project has no `src/` directory; its convention is root-level `lib/`. Types will be generated from the live cloud project to:

`lib/database.types.ts`

Generated, never hand-edited, with an `npm run supabase:types` script to refresh them.

---

## 18. Assumptions

1. Anyone with a Supabase account in this project is a trusted colleague with full rights to all recruitment data.
2. The team stays small (2–3 people). Nothing here is designed for dozens of users.
3. A candidate belongs to exactly one job; the same person applying twice creates two independent records with two CVs — confirmed by you.
4. Ratings stay whole stars, 1–5. An unrated candidate is stored as empty rather than defaulting to 3.
5. Job and candidate `source` values stay within the five listed options.
6. Location stays free text — no country or city list.
7. The description field is plain text, not formatted rich text.
8. "2d ago" style labels are calculated in the browser from real timestamps.
9. CV uploads happen through the app, so the database record and the stored file stay in step.
10. Email confirmation is on, so a new teammate must click a link before signing in.
11. **The Archive is a working store, not a compliance archive.** It is designed so you can get a job or a candidate back, not to satisfy a legal retention policy.
12. **Archived candidates are excluded from dashboard figures.** The funnel, the metric tiles and the counts describe live hiring only.

---

## 19. Business Decisions — all answered

| Decision | Your answer |
|---|---|
| Seed demo data into the dev project? | **Yes** — load it now, delete it later |
| Notes editable by anyone, or author-only? | **Anyone** — no hierarchy yet |
| Delete or archive? | **Archive only.** Nothing related to jobs or candidates is ever destroyed |

Two smaller calls I have made rather than block on, both easy to reverse — correct me if either is wrong:

- **Archive is separate from Closed.** A job can be Closed and still live on your Jobs screen while you work through its applicants. Archiving is the act of putting it away, and it closes the job automatically. The alternative reading — that Closed *is* archived — would make the two seeded Closed jobs vanish from the Jobs screen, which would change your ported design.
- **Notes remain deletable**, since a note is your own sentence rather than a person's record.

---

## 20. Cloud Implementation Plan

**Target:** the `recruitment-app` project (`veaazwasmtxanwpmubsu`), eu-west-2.
**Environment:** development. **Verified empty** — no tables in `public`, no storage buckets, no migration history, created minutes ago.
**Safe to modify:** yes. No existing data can be lost.

**Files to be created:**

```
supabase/config.toml
supabase/migrations/
  <ts>_create_types_and_tables.sql
  <ts>_create_functions_and_triggers.sql
  <ts>_enable_rls_and_policies.sql
  <ts>_create_storage_bucket_and_policies.sql
  <ts>_insert_reference_data.sql
supabase/seed.sql                      (demo data — approved)
supabase/tests/database/01..07.test.sql
lib/database.types.ts                  (generated)
docs/supabase-implementation.md
.env.local.example
```

**Process:** create the migrations → dry run and show you exactly what will run → apply on your approval → run the lint → run the tests → generate types → build the app.

**Rollback:** the project is empty, so any mistake is corrected with a new forward migration. Nothing is ever reset and no data can be destroyed.

**Application changes that follow the schema** (a separate step, listed so nothing is a surprise):

- Delete `lib/auth-stub.ts` and wire the login screens to Supabase Auth.
- **Delete the `/admin` area entirely** — the login, the home tab and the User Management screen — as you instructed.
- **Add the Archive tab** at `/app/archive`, with restore actions, plus Archive buttons on jobs and candidates.
- Filter archived records out of the Jobs list, Overview, funnel, Shortlist and search.
- Add a LinkedIn URL field to the Add Candidate form and the candidate panel, replacing the dead `href="#"` link.
- Wire CV upload for real, with inline PDF preview and DOCX download.
- Stop discarding job description and candidate source.
- Replace `"2d ago"` and `"14 Jul 2026"` text with real timestamps.

**Not doing:** no CV parsing, no LinkedIn scraping, no email sending, and **no delete actions anywhere for jobs or candidates**. All explicitly out of scope.

---

**Status: awaiting approval. No migrations have been written and nothing has been applied to Supabase.**
