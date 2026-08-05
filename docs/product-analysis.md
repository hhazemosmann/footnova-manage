# Product Analysis

## 1. Product Summary

FootNova Recruiting is a private recruitment tool for one person. The owner posts job openings, adds applicants to those openings by hand, attaches each applicant's CV, records a LinkedIn profile link, rates them, writes notes, and moves them through a hiring pipeline until they are hired or rejected.

It is a **record-keeping and screening tool**, not a job board. Applicants never see it and never log in. Nothing is published publicly. There is no application form for the outside world — every candidate is entered manually by the owner, which the interface states out loud in the top bar: *"24 CANDIDATES · ADDED MANUALLY"*.

The product answers one question repeatedly: *who have I got for this role, how good are they, and where did I leave off with them?*

---

## 2. Information Sources

**Interface reviewed** — every route in the application:

| Screen | What it contributes |
|---|---|
| `/app` | Sign-in screen (username + password) |
| `/app/forgot-password` | Password reset request |
| `/app/overview` | Hiring dashboard: 4 metric tiles, hiring funnel, active jobs list, "Needs Action" list |
| `/app/jobs` | All job posts as cards, filterable by status |
| `/app/jobs/[jobId]` | One job with its full candidate table, stage and rating filters |
| `/app/shortlist` | Every shortlisted candidate across all jobs |
| `/app/settings` | Careers inbox, default pipeline, three rule toggles |
| Candidate panel (drawer) | CV preview, rating, stage, notes, contact details, LinkedIn link |
| "Post New Job" dialog | Job title, description, location, source, status |
| "Add Candidate" dialog | Name, email, source, initial stage, CV upload area, initial rating |
| `/admin`, `/admin/home`, `/admin/users` | Separate admin sign-in, account list, create/delete users |

**Code reviewed** — `lib/demo-data.ts` (the shape of a Job, Candidate and Note), `lib/store.ts` (every action the app can perform), `lib/auth-stub.ts` (accounts and roles), `lib/rows.ts`, and all page and component files.

**Product context reviewed** — the owner's written description of users, jobs, candidates, pipeline, notes, CV handling and LinkedIn handling. This was substantial and is treated as authoritative where it conflicts with placeholder interface text.

**Existing documentation reviewed** — none exists. This is the first document in `docs/`.

**Important limitations:**

- The application currently has **no backend at all**. Sign-in is a stub with credentials written in plain text in the code, and all recruitment data lives in memory and disappears on page reload. Nothing described below is currently saved anywhere.
- The CV upload areas are **visual only**. There is no file picker wired up, no upload handler, and no stored filename. The "CV.pdf" text next to every candidate is decorative — it is the same for all of them.
- The LinkedIn link in the candidate panel is a **dead placeholder** (`href="#"`). There is nowhere in the app to enter a LinkedIn URL today.
- The design the app was built from was a visual mockup. Some fields exist because they looked right in the mockup, not because a decision was made about them. Those are called out in Section 20.

---

## 3. Users

One person: the owner, a recruiter running hiring for FootNova.

> **Confirmed from the product context:** "just me, a single recruiter."

Nobody else uses the system. Applicants do not have accounts and are never notified by the app. There are no hiring managers, no interviewers, and no team members reviewing candidates alongside the owner.

This is unusual and it simplifies a great deal: there is no sharing model, no per-record permissions, and no "who can see whose candidates" problem. Every piece of information in the system belongs to the same single person.

---

## 4. User Types

**One type: the recruiter (the owner).**

> **Confirmed from the product context:** "No applicant logins, no other roles."

The application as built also contains a second, separate **admin area** with its own login and its own account roles (`user` and `admin`). This was added as standard scaffolding when the app was created, not because the product asked for it.

> **Needs clarification:** The product context says there is only one user and no roles. The app has an admin area that manages multiple accounts with two role levels. See Section 21, Question 1.

---

## 5. What Each User Can Do

**The recruiter can:**

- Sign in and sign out
- Create a job opening and set its title, location, description, source and status
- Close a job or reopen it
- Add a candidate to a specific job by hand
- Upload and replace a candidate's CV
- Record a candidate's LinkedIn profile URL *(intended — not yet possible in the app)*
- Give a candidate a 1-to-5 star rating and change it at any time
- Move a candidate forward through the pipeline, one stage at a time
- Mark a candidate as shortlisted, or remove that mark
- Reject a candidate
- Write notes on a candidate, as many as needed
- Search across job titles and candidate names
- Filter candidates by stage and by minimum rating; filter jobs by open/closed
- View a dashboard summarising the whole pipeline
- Change application settings

**The recruiter cannot** (and should not be able to): see anyone else's data, share a candidate, or invite a collaborator. There is no such concept in this product.

---

## 6. Main User Activities

These are the workflows the app is built around, in rough order of how often they happen.

**1. Screening a job's applicants** — the core loop. Open a job, look at its candidate table, sort through who is worth pursuing. This is where the owner spends most of their time, and the job detail screen is the most developed screen in the app.

**2. Moving a candidate through the pipeline.**

> **Confirmed from the product context:** "Moving a candidate through stages is the core action."

Done two ways: the "Move to next stage" button in the candidate panel, which advances one step, or picking a stage directly from a dropdown. The app also moves candidates automatically in one case — shortlisting a candidate who is still at the first stage also advances them to the second.

**3. Adding a candidate.** Open a job, click "Add Candidate", type in their name and email, pick a starting stage, attach their CV, give an initial rating.

**4. Reviewing a CV.** Open the candidate panel and read their CV. Today this shows a placeholder document; it needs to show the real uploaded PDF.

**5. Recording an opinion.** Rate the candidate, write a note about the conversation or the interview.

**6. Reviewing the shortlist.** Look across all jobs at everyone worth taking forward, in one place.

**7. Posting a new job.**

**8. Checking overall progress** on the dashboard — how many open jobs, how many applicants, how many at each stage, what needs attention.

---

## 7. Information the App Should Save

### Jobs

| Information | Notes |
|---|---|
| Job title | e.g. "Academy Goalkeeping Coach" |
| Location | Free text — includes remote and hybrid, e.g. "Remote", "Cairo, EG (Hybrid)" |
| Description | Long text. A field exists in the "Post New Job" form but is currently discarded |
| Status | Open or Closed |
| Source | Where the role came from — Manual entry, Referral, Direct application, Agency, Scouting network |
| Date posted | Currently a display-only text string |

### Candidates

| Information | Notes |
|---|---|
| Full name | |
| Email address | |
| Phone number | Present in the app; auto-generated placeholder today |
| Which job they applied to | Every candidate belongs to exactly one job |
| Date applied | Currently a display-only text string |
| Pipeline stage | See Section 11 |
| Shortlisted | A yes/no mark, currently separate from stage — see Section 20 |
| Star rating | A whole number, 1 to 5 |
| CV file | The PDF itself |
| LinkedIn profile URL | Intended; no field exists yet |

### Notes

| Information | Notes |
|---|---|
| Which candidate the note is about | |
| Who wrote it | Always the owner, but the app records an author |
| When it was written | Must become a real date and time — see Section 20 |
| The note text | |

### Settings

| Information | Notes |
|---|---|
| Careers inbox email address | |
| Default pipeline choice | Two options offered |
| Require email on new candidates | On/off |
| Email me on new shortlist adds | On/off |
| Require CV before interview stage | On/off |

> **Needs clarification:** Are the settings toggles meant to actually enforce those rules and send those emails, or were they part of the mockup? See Section 21, Question 5.

---

## 8. Information Ownership

Everything belongs to the single owner. There are no companies, teams or projects in this product.

The meaningful ownership chain is between the records themselves:

- A **job** stands on its own.
- A **candidate** belongs to exactly one job. There is no way in the app to have a candidate without a job, or to attach one candidate to two jobs.
- A **note** belongs to exactly one candidate.
- A **CV** belongs to exactly one candidate.
- **Settings** are a single set of preferences for the whole application, not per job.

> **Assumption:** One candidate belongs to one job only. If the same person applies to two different roles, they would be entered twice as two separate records. The interface offers no way to link them. This matches how the app works today but may become annoying in practice — see Section 21, Question 6.

---

## 9. Privacy and Access

**Everything is private. Nothing in this application should ever be publicly readable.**

This deserves emphasis because the data is unusually sensitive: it holds named individuals' email addresses, phone numbers, CVs, and the owner's private written opinions about them. A candidate finding out they were rated 2 stars with a note saying they were weak in interview would be a serious problem.

| Information | Who can view | Who can change | Public? |
|---|---|---|---|
| Jobs | Owner only | Owner only | No |
| Candidates | Owner only | Owner only | No |
| CV files | Owner only | Owner only | **No — strictly private** |
| Notes | Owner only | Owner only | **No — strictly private** |
| Ratings | Owner only | Owner only | **No — strictly private** |
| LinkedIn URLs | Owner only | Owner only | No |
| Settings | Owner only | Owner only | No |

> **Confirmed from the product context:** Applicants have no logins, so no applicant can ever reach any of this.

> **Assumption:** CV files must not be reachable by guessing a web address. Anyone holding a link to a CV should still be refused unless they are signed in as the owner. Given that CVs contain personal contact details and employment history, this should be treated as a firm requirement rather than a preference.

---

## 10. Approvals

**There are no approval steps in this product.**

> **Confirmed from the product context:** There is one user with no other roles, so there is nobody to approve anything.

Nothing waits for a second person. The owner's decision is final and immediate at every point. No job needs sign-off before posting, no candidate needs sign-off before rejection, no offer needs authorising.

The only thing resembling a confirmation step is deleting a user account in the admin area, which asks "Delete *username*?" before proceeding.

---

## 11. Statuses and Stages

### Job status

Two values: **Open** and **Closed**. Set when the job is created and changeable afterwards. Closed jobs stay visible and keep their candidates; they are simply filtered out of the "active" views and the dashboard's open-jobs count.

### Candidate pipeline stage

The application currently uses six stages:

**Applied → Screening → Interview → Offer → Hired**, plus **Rejected**.

The first five are a forward path. "Rejected" sits outside that path — a candidate can be rejected from any stage, and the "Move to next stage" button deliberately stops at Hired and will never move someone into Rejected by accident.

### Shortlisted

Separate from the stage. A candidate can be marked shortlisted at any stage, and that mark is what drives the Shortlist screen and the shortlist counts.

Two automatic behaviours already exist:

- Shortlisting a candidate who is still at "Applied" also moves them to "Screening".
- Rejecting a candidate removes their shortlisted mark.

> **Needs clarification — this is the most important open question in the document.** The product context describes the pipeline as *"New → ... → Shortlisted / Rejected"*, which does not match the app. It differs in two ways: the first stage is called "Applied", not "New"; and "Shortlisted" is not a stage at all — it is a separate on/off mark that sits alongside the stage. See Section 21, Question 2.

---

## 12. Deletion Behavior

The application currently has **no delete function for jobs, candidates or notes**. Nothing can be removed. Rejecting a candidate is the closest thing, and it keeps the record.

This is very likely an oversight rather than a decision, since a recruiter will eventually add someone by mistake or need to remove a candidate on request.

> **Assumption:** Deleting a candidate should also remove their notes and their CV file, since neither means anything without the candidate.

> **Assumption:** Deleting a job should not silently destroy its candidates. Closing a job is the intended way to retire it. If a job is deleted outright, the owner should be warned about how many candidates go with it.

> **Assumption:** Rejected candidates should be kept, not deleted. The dashboard counts them and shows a rejection percentage, which only works if they are retained.

**A point worth raising:** because this system stores personal data about real people, a candidate may one day ask to have their data removed. That would need a genuine, permanent delete of their record, notes and CV — not a hidden or archived record. See Section 21, Question 7.

---

## 13. Files and Storage

There is exactly **one** type of file in this product.

### Candidate CV

| Question | Answer |
|---|---|
| **What it is** | The candidate's CV or résumé as a PDF |
| **Where it is uploaded** | Two places: the "Add Candidate" dialog when first adding someone, and the "Upload CV" button in the candidate panel to replace an existing one |
| **What it is used for** | Screening. The owner opens it to read the candidate's history |
| **Who uploads it** | The owner, always |
| **Who it belongs to** | Exactly one candidate, who belongs to exactly one job |
| **Who can view it** | The owner only |
| **Who can replace or delete it** | The owner only |
| **Public or private** | **Private.** Never publicly readable, never guessable by URL |

> **Confirmed from the product context:** Store the PDF file only. Do not parse it, do not extract fields from it, do not read its contents. Text extraction, keyword matching and CV parsing are explicitly **out of scope**.

> **Needs clarification:** The "Add Candidate" dialog says *"PDF or DOCX · max 10 MB"*, but the product context says PDF. See Section 21, Question 3.

> **Assumption:** One CV per candidate. Uploading a new one replaces the old one rather than keeping a version history — the button says "Upload CV" and the surrounding text says *"Drop a new file here to replace"*.

**No other files exist in this product.** There are no profile photos (the circular initials next to each name are generated coloured circles, not images), no company logos beyond the app's own built-in logo, no attachments on notes, no generated reports, no exports, no contracts.

---

## 14. Suggested Storage Groups

Only one is needed:

**Private candidate documents** — holds every candidate CV. Fully private, readable only by the signed-in owner, never public.

No public storage group is needed anywhere in this product.

---

## 15. Suggested Information Groups

Groups of information that may later become database tables:

1. **Jobs** — the openings being recruited for
2. **Candidates** — the people who applied, each attached to one job
3. **Notes** — timestamped comments, each attached to one candidate
4. **Settings** — a single set of application preferences
5. **Accounts** — sign-in details for the owner *(shape depends on Question 1)*

A separate group for CV files is probably unnecessary — since each candidate has exactly one CV, a reference on the candidate record is enough. This changes if Question 4 turns out to need CV history.

---

## 16. Suggested Relationships

In plain language:

- A **job** can have many **candidates**. Every candidate belongs to exactly one job.
- A **candidate** can have many **notes**. Every note belongs to exactly one candidate.
- A **candidate** has at most one **CV file**.
- A **candidate** has at most one **LinkedIn URL**.
- All **jobs**, and therefore everything beneath them, belong to the single owner.
- **Settings** stand alone and apply across the whole application.

---

## 17. Notifications, Payments, and History

**Notifications — possibly, one only.** The settings screen offers *"Email me on new shortlist adds — Digest at 09:00 daily"*. That is a scheduled daily email to the owner. Nothing else in the app sends anything to anyone, and no email is ever sent to a candidate.

> **Needs clarification:** Is that daily digest a real requirement? See Section 21, Question 5.

**Payments — no.** There is no pricing, no billing, no subscription, no invoice, no payment screen anywhere in the application. Nothing suggests payments will ever be needed.

**Activity history — worth considering, not currently present.** The app shows relative times like "2d ago" on notes but keeps no history of what changed. For a recruiter, one specific piece of history is genuinely useful: **when a candidate moved to each stage**. That is what makes "how long has this person been sitting at Interview?" answerable, and it is exactly the sort of thing that is impossible to reconstruct later if it was not recorded from the start.

> **Assumption:** Recording the date of each stage change is worth building in from the beginning. It is cheap to add now and cannot be backfilled later.

**Audit logs — no.** With a single user, there is no "who did this" question to answer.

**Generated reports — no.** The dashboard calculates its figures live. Nothing is exported or generated as a file.

---

## 18. Confirmed Requirements

**From the product context:**

- One user only — a single recruiter. No applicant logins, no other roles.
- Jobs have a title, a location, a status of open or closed, and candidates attached to them.
- Candidates have a name, a job, a CV as a PDF, a LinkedIn link, a pipeline stage, a star rating, and notes.
- Moving a candidate through the pipeline stages is the core action of the product.
- Notes are multiple per candidate and timestamped.
- CVs are **stored only**. No parsing, no field extraction. Explicitly out of scope for now.
- LinkedIn is a **pasted URL only**. No scraping, no automated pulling of profile data.

**From the interface:**

- Six pipeline stages exist: Applied, Screening, Interview, Offer, Hired, Rejected.
- Shortlisting is a separate mark from the pipeline stage.
- Ratings are whole stars from 1 to 5.
- Candidates also carry an email address and a phone number.
- Jobs also carry a source, a posted date and a description field.
- Candidates are always added manually, one at a time, to a specific job.
- Search covers job titles and candidate names.
- Candidates can be filtered by stage and by minimum rating; jobs by open/closed.
- The dashboard reports open jobs, total applicants, shortlisted count, interviews scheduled, a stage-by-stage funnel with conversion rates, and a rejection percentage.
- Shortlisting a candidate at "Applied" also advances them to "Screening".
- Rejecting a candidate clears their shortlisted mark.
- "Move to next stage" stops at "Hired" and never reaches "Rejected".

---

## 19. Assumptions

1. All data belongs to the single owner; no sharing model is needed.
2. CV files must be strictly private and not reachable by guessing a URL.
3. One CV per candidate — a new upload replaces the previous one.
4. One candidate belongs to one job; the same person applying twice creates two records.
5. Deleting a candidate also removes their notes and their CV.
6. Deleting a job should warn about, not silently destroy, its candidates.
7. Rejected candidates are kept, since the dashboard counts them.
8. The stage a candidate reached, and when they reached it, is worth recording from day one.
9. Dates currently stored as display text ("14 Jul 2026", "2d ago") should become real dates and times, so they can be sorted, filtered and aged.
10. The job description field in the "Post New Job" form is intended to be saved, even though the app currently discards it.
11. Ratings stay whole numbers from 1 to 5 — no half stars.
12. Candidate email is optional in practice, since a settings toggle exists to make it required.

---

## 20. Conflicts or Missing Features

These are differences between the product context, the interface, and the underlying code. Each is a real decision that needs making.

### Conflicts

**C1 — Pipeline stage names and the meaning of "Shortlisted".**
The product context describes *"New → ... → Shortlisted / Rejected"*. The app uses **Applied → Screening → Interview → Offer → Hired**, with **Rejected** outside the path and **Shortlisted as a separate on/off mark**, not a stage. Two different disagreements in one: the name of the first stage, and whether shortlisting is a stage or a flag. This changes the shape of the data and must be settled first.

**C2 — Accepted CV file types.**
Product context says PDF. The "Add Candidate" dialog says *"PDF or DOCX · max 10 MB"*.

**C3 — Number of users and roles.**
Product context says one recruiter and no roles. The app ships an admin area with `user` and `admin` roles and screens to create and delete accounts.

### Missing features

**M1 — There is nowhere to enter a LinkedIn URL.**
The product context lists it as a candidate field. The candidate panel shows a "LinkedIn profile ↗" link, but it is hardcoded to go nowhere, and neither the "Add Candidate" dialog nor the candidate panel has a field to type a URL into. This field has to be added to the interface, not just the database.

**M2 — CV upload is not wired up.**
Both upload areas are visual only — no file picker, no upload, no stored filename. The "CV.pdf" text shown against every candidate is decorative and identical for all of them.

**M3 — Notes have no real timestamp.**
The product context asks for timestamped notes. Notes currently store free text like "2d ago" and "just now", which cannot be sorted or aged. This needs to become a real date and time.

**M4 — Candidate "source" is collected but thrown away.**
The "Add Candidate" dialog asks for a source (Manual entry, Referral, Direct application, Agency, Scouting network) and the value is discarded the moment the form is submitted. Either candidates should keep a source, or the field should come out of the form. Jobs, by contrast, do keep their source.

**M5 — Job description is collected but thrown away.**
Same problem: the "Post New Job" dialog has a description box whose contents are never saved.

**M6 — Nothing can be deleted.**
No job, candidate or note can be removed.

**M7 — Dates are display text, not dates.**
Applied dates are stored as strings like "14 Jul 2026". They cannot be sorted or filtered, and new records are hardcoded to "05 Aug 2026".

**M8 — Settings do not do anything.**
The careers inbox, default pipeline and three toggles are all interface-only. Nothing reads them.

---

## 21. Important Business Questions

Seven questions. The first three change the shape of the data and should be answered before anything is built.

**Q1 — Is the admin area actually wanted?**
You said one recruiter, no roles. The app has an admin area with two role levels and account management. Three options: (a) drop the admin area entirely and have one account with no roles at all — simplest, and it matches what you described; (b) keep it as a way to manage your own login and password; (c) keep full roles because you expect to add a colleague later. This decides whether roles and permissions exist at all.

**Q2 — What exactly are the pipeline stages, and is "Shortlisted" one of them?**
The app has Applied → Screening → Interview → Offer → Hired, plus Rejected, with Shortlisted as a separate mark. You described "New → ... → Shortlisted / Rejected". Please confirm:
- the exact list of stages, in order, with the names you want;
- whether "Shortlisted" is a **stage** a candidate sits in, or a **mark** that can be applied to a candidate at any stage.

They behave very differently. As a mark, a candidate can be both "at Interview" *and* "shortlisted" at once — which is what the app does today and what the Shortlist screen relies on. As a stage, being shortlisted would replace whatever stage they were in, and a shortlisted candidate could no longer also be recorded as being at Interview.

**Q3 — PDF only, or PDF and Word documents?**
The dialog offers both. You said PDF. Is 10 MB the right size limit?

**Q4 — One CV per candidate, or a history?**
Currently a new upload replaces the old one. Do you ever want to keep an older version — for instance, if someone sends an updated CV mid-process and you want to compare?

**Q5 — Should the settings actually work?**
Three toggles exist: require an email address on new candidates; email you a daily 09:00 digest of new shortlist additions; require a CV before a candidate can reach the interview stage. Are these real rules you want enforced, or mockup decoration? The digest is the significant one, because it is the only thing in the product that would need to send email.

**Q6 — What happens when the same person applies to two jobs?**
Today they would be entered twice, as two unrelated candidates with two separate CVs and two separate sets of notes. Is that acceptable, or do you want to recognise that it is the same person?

**Q7 — Should candidates be permanently deletable?**
Nothing can be deleted right now. Separately from tidying up mistakes, a real candidate may ask you to erase their data. Do you want a genuine permanent delete that removes the record, the notes and the CV file?

---

## 22. Recommendation

**The product requirements are close to ready, but three questions must be answered before database design begins.**

The product is unusually well defined for this stage. The single-user model removes almost all of the complexity that normally makes this step slow — there are no sharing rules, no permission tiers, no approval chains, and no payments. The workflows are clear and the entities are few.

Three things genuinely block the design work:

- **Q2 (pipeline stages and shortlisting)** — this is the core action of the product, and the product context and the app disagree about what the stages even are. Getting this wrong means rebuilding the central piece of the system.
- **Q1 (admin area and roles)** — decides whether roles exist at all, which affects every access rule.
- **Q3 (accepted file types)** — decides what the file storage accepts and validates.

Q4 through Q7 can be answered during design without causing rework.

Also worth noting for whoever builds the next stage: several fields the interface collects are currently discarded (job description, candidate source), all dates are display strings rather than real dates, and the LinkedIn field does not exist in the interface at all. These are known gaps to close, not new features to invent.

**No database work has been performed. Awaiting review.**
