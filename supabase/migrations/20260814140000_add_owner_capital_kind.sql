-- Money the owner puts in from their own pocket is not income.
--
-- It is equity: the business owes it back to the person who put it in. Filing
-- it as income would inflate revenue, wreck every margin, and make a business
-- that is losing money look like one that is earning it — which is the exact
-- mistake this system exists to prevent.
--
-- So it gets its own kind, deliberately excluded from the profit figures and
-- reported on its own line: how much has been put in, separate from how the
-- business is doing.
--
-- Its own migration because Postgres will not let a new enum value be used in
-- the same transaction that adds it.

alter type public.finance_kind add value 'Owner capital';
