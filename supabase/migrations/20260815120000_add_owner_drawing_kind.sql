-- Money the owner takes out for themselves is not an expense.
--
-- It is the mirror of Owner capital: capital crosses the boundary into the
-- business, a drawing crosses out of it. Paying a referee makes the business
-- poorer; taking money for yourself does not — it moves what you already own
-- from one pocket to another.
--
-- Filed as an expense it would depress profit and make the business look
-- worse at trading than it is, which is the number a partner, a sponsor or a
-- bank would read. So it sits outside the profit figures, alongside capital,
-- and both feed the owner's stake instead.
--
-- Its own migration because Postgres will not let a new enum value be used in
-- the same transaction that adds it.

alter type public.finance_kind add value 'Owner drawing';
