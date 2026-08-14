-- The finance side of the workspace: a small double-entry-free ledger, a
-- chart of accounts, and per-tournament costing.
--
-- Shape follows how a small events business is normally kept in books:
--
--   * A chart of accounts (here: categories) is the master list every
--     transaction is filed under, and it is what makes reporting possible at
--     all. Each category is one of three kinds, which is exactly what an
--     income statement is built from:
--       Income            - money earned
--       Direct cost       - cost of putting on an event; subtract from income
--                           to get gross profit
--       Operating expense - the cost of the business existing at all;
--                           subtract to get net profit
--
--   * A transaction journal, where each row is one real event: an amount, a
--     date, the category it belongs to, and optionally the tournament it
--     belongs to. Tagging by tournament is what turns the same journal into a
--     per-event profit and loss without keeping a second set of books.
--
--   * Tournaments carry a budget so planned and actual can be compared, which
--     is the one report an event business actually acts on.
--
-- Money is stored as integer minor units (piastres/cents). Floating point
-- cannot represent 0.10 exactly and errors accumulate over a ledger; integers
-- are exact by construction. Every amount is positive — direction comes from
-- the category's kind, so a cost can never be accidentally entered as income.

-- ---------------------------------------------------------------- types

create type public.finance_kind as enum ('Income', 'Direct cost', 'Operating expense');

create type public.payment_method as enum ('Cash', 'Bank transfer', 'Card', 'Cheque', 'Other');

create type public.tournament_status as enum ('Planned', 'Running', 'Completed');

-- ------------------------------------------------------------- categories

create table public.finance_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.finance_kind not null,
  -- The plain-English gloss shown in brackets after the name in the UI.
  description text not null default '',
  sort_order integer not null default 100,
  -- Categories are retired rather than deleted: transactions filed under one
  -- must keep their meaning forever.
  is_archived boolean not null default false,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint finance_categories_name_not_blank check (btrim(name) <> ''),
  constraint finance_categories_name_unique unique (name)
);

-- ------------------------------------------------------------ tournaments

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text not null default '',
  starts_on date,
  ends_on date,
  status public.tournament_status not null default 'Planned',
  -- What you expect to take and to spend, so actuals can be compared to plan.
  budget_income_cents bigint not null default 0 check (budget_income_cents >= 0),
  budget_expense_cents bigint not null default 0 check (budget_expense_cents >= 0),
  notes text not null default '',
  created_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz,
  archived_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tournaments_name_not_blank check (btrim(name) <> ''),
  constraint tournaments_dates_ordered check (
    starts_on is null or ends_on is null or ends_on >= starts_on
  )
);

-- ------------------------------------------------------------ the journal

create table public.finance_transactions (
  id uuid primary key default gen_random_uuid(),
  occurred_on date not null,
  -- Always positive. Income or expense is decided by the category's kind.
  amount_cents bigint not null check (amount_cents > 0),
  category_id uuid not null references public.finance_categories (id) on delete restrict,
  -- Untagged transactions are business-wide; tagged ones also roll up into
  -- that tournament's own profit and loss. Deleting a tournament leaves its
  -- transactions in the books, untagged, rather than destroying history.
  tournament_id uuid references public.tournaments (id) on delete set null,
  description text not null default '',
  -- Who paid you, or who you paid.
  counterparty text not null default '',
  method public.payment_method not null default 'Bank transfer',
  -- false = agreed but the money has not moved yet. Unsettled income is money
  -- owed to you; unsettled expense is money you owe.
  is_settled boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index finance_transactions_occurred_on_idx
  on public.finance_transactions (occurred_on desc);
create index finance_transactions_tournament_idx
  on public.finance_transactions (tournament_id);
create index finance_transactions_category_idx
  on public.finance_transactions (category_id);

-- ---------------------------------------------------------------- currency

-- One workspace, one currency. Reporting across mixed currencies needs
-- exchange rates on every row and is a different product.
alter table public.app_settings
  add column currency text not null default 'EGP';

-- ---------------------------------------------------------------- triggers

create trigger finance_categories_set_updated_at
  before update on public.finance_categories
  for each row execute function public.set_updated_at();

create trigger tournaments_set_updated_at
  before update on public.tournaments
  for each row execute function public.set_updated_at();

create trigger finance_transactions_set_updated_at
  before update on public.finance_transactions
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------------------- RLS

alter table public.finance_categories enable row level security;
alter table public.tournaments enable row level security;
alter table public.finance_transactions enable row level security;

-- Same seam as the recruiting side: one predicate, so a role check can be
-- layered in later in exactly one place.

create policy "finance categories are readable by team members"
  on public.finance_categories for select to authenticated
  using (public.is_team_member());

create policy "team members create finance categories as themselves"
  on public.finance_categories for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any finance category"
  on public.finance_categories for update to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

create policy "tournaments are readable by team members"
  on public.tournaments for select to authenticated
  using (public.is_team_member());

create policy "team members create tournaments as themselves"
  on public.tournaments for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any tournament"
  on public.tournaments for update to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- As on the recruiting side, a tournament can only be destroyed once it has
-- been archived first.
create policy "team members delete archived tournaments"
  on public.tournaments for delete to authenticated
  using (public.is_team_member() and archived_at is not null);

create policy "transactions are readable by team members"
  on public.finance_transactions for select to authenticated
  using (public.is_team_member());

create policy "team members record transactions as themselves"
  on public.finance_transactions for insert to authenticated
  with check (public.is_team_member() and created_by = auth.uid());

create policy "team members update any transaction"
  on public.finance_transactions for update to authenticated
  using (public.is_team_member()) with check (public.is_team_member());

-- A mistyped ledger line is not history worth keeping, and leaving it in
-- would corrupt every total that follows. Deletion is allowed here, unlike
-- candidates and jobs.
create policy "team members delete transactions"
  on public.finance_transactions for delete to authenticated
  using (public.is_team_member());

-- ----------------------------------------------------------------- grants

grant select, insert, update on public.finance_categories to authenticated;
grant select, insert, update, delete on public.tournaments to authenticated;
grant select, insert, update, delete on public.finance_transactions to authenticated;

-- ------------------------------------------------------- starting accounts

-- A usable chart of accounts out of the box, worded for a football events and
-- recruitment business. Every one carries the plain-English gloss the UI shows
-- in brackets, so nothing depends on knowing accounting vocabulary. They are
-- ordinary rows: rename, retire or add to them freely.

insert into public.finance_categories (name, kind, description, sort_order) values
  ('Entry fees',            'Income', 'what teams pay to enter a tournament', 10),
  ('Player registration',   'Income', 'what individual players pay to sign up', 20),
  ('Sponsorship',           'Income', 'money from a brand or company backing you', 30),
  ('Ticket sales',          'Income', 'what spectators pay to watch', 40),
  ('Merchandise',           'Income', 'kit, shirts and anything else you sell', 50),
  ('Placement fees',        'Income', 'paid to you when a player is signed or placed', 60),
  ('Other income',          'Income', 'anything that does not fit the rows above', 90),

  ('Venue hire',            'Direct cost', 'renting the pitch, hall or stadium', 10),
  ('Referees and officials','Direct cost', 'match officials and their fees', 20),
  ('Medical and first aid',  'Direct cost', 'physio, ambulance and medical cover', 30),
  ('Security and stewards', 'Direct cost', 'keeping the event safe and orderly', 40),
  ('Equipment hire',        'Direct cost', 'goals, nets, balls, bibs and kit', 50),
  ('Trophies and medals',   'Direct cost', 'awards handed out on the day', 60),
  ('Prize money',           'Direct cost', 'cash paid to winning teams or players', 70),
  ('Catering',              'Direct cost', 'food and drink for players and staff', 80),
  ('Travel and transport',  'Direct cost', 'getting people and gear to the venue', 90),
  ('Accommodation',         'Direct cost', 'hotels for travelling teams or staff', 100),
  ('Event marketing',       'Direct cost', 'advertising for one specific tournament', 110),
  ('Photography and video', 'Direct cost', 'covering the event', 120),
  ('Match day staff',       'Direct cost', 'people hired for the event itself', 130),

  ('Salaries and wages',    'Operating expense', 'your permanent people', 10),
  ('Contractors',           'Operating expense', 'freelancers paid per job', 20),
  ('Rent and utilities',    'Operating expense', 'office space, electricity, water', 30),
  ('Software and subscriptions', 'Operating expense', 'the tools you pay for monthly', 40),
  ('Phone and internet',    'Operating expense', 'line rental and data', 50),
  ('Scouting and travel',   'Operating expense', 'trips not tied to one tournament', 60),
  ('General marketing',     'Operating expense', 'promoting the business, not one event', 70),
  ('Insurance',             'Operating expense', 'public liability and cover', 80),
  ('Legal and accounting',  'Operating expense', 'professional advice and filings', 90),
  ('Bank charges',          'Operating expense', 'fees and transfer costs', 100),
  ('Office supplies',       'Operating expense', 'the small day-to-day things', 110),
  ('Taxes and levies',      'Operating expense', 'what you owe the authorities', 120),
  ('Other expense',         'Operating expense', 'anything that does not fit the rows above', 190);
