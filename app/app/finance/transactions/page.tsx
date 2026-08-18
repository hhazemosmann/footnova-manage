'use client';

/* The journal: every entry, and the form that adds one.
 *
 * One form for money in and money out, because splitting them into two
 * screens doubles the navigation and halves the chance of the total being
 * right. Which direction an entry goes is decided by the category you pick,
 * so an expense can never be entered as income by mistake — the direction is
 * a property of the account, not of the typist. */

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  KINDS,
  METHODS,
  PaymentMethod,
  addTxn,
  categoryById,
  deleteTxn,
  formatMoney,
  isMoneyIn,
  liveCategories,
  liveTournaments,
  parseAmount,
  toggleSettled,
  totalsFor,
  tournamentById,
  useFinance,
} from '@/lib/finance';
import { EmptyState, Field, PageHead, cardStyle, inputStyle, labelStyle } from '@/components/finance/ui';
import { Button } from '@/components/ds';
import { formatDate, todayIso } from '@/lib/format';

const mono = "'IBM Plex Mono',monospace";

const GRID =
  'minmax(150px,1.7fr) minmax(96px,0.9fr) minmax(120px,1.2fr) minmax(110px,1fr) minmax(96px,0.9fr) 150px';

/* useSearchParams has to sit behind a Suspense boundary or the route cannot
 * be prerendered at all. */
export default function TransactionsPage() {
  return (
    <Suspense fallback={<p style={{ fontSize: 14, color: '#2C3A5E' }}>Loading…</p>}>
      <Transactions />
    </Suspense>
  );
}

function Transactions() {
  const s = useFinance();
  const router = useRouter();
  const params = useSearchParams();
  /* Arriving from a tournament page pre-tags the entry, so recording a cost
     against the event you were just looking at takes no extra thought. */
  const presetTournament = params.get('tournament') ?? '';

  const categories = liveCategories(s);
  const tournaments = liveTournaments(s);

  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tournamentId, setTournamentId] = useState(presetTournament);
  const [description, setDescription] = useState('');
  const [counterparty, setCounterparty] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('Bank transfer');
  const [settled, setSettled] = useState(true);
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState('');

  /* Filters */
  const [kindFilter, setKindFilter] = useState('All');
  const [tournamentFilter, setTournamentFilter] = useState('All');
  const [text, setText] = useState('');
  /* A date window, either end optional. ISO dates compare correctly as
   * strings, so no parsing is needed and no timezone can shift a boundary. */
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const chosen = categoryId ? categoryById(s, categoryId) : undefined;

  const rows = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return s.txns.filter((t) => {
      const cat = categoryById(s, t.categoryId);
      if (kindFilter !== 'All' && cat?.kind !== kindFilter) return false;
      if (tournamentFilter === 'None' && t.tournamentId) return false;
      if (tournamentFilter !== 'All' && tournamentFilter !== 'None' && t.tournamentId !== tournamentFilter)
        return false;
      if (from && t.occurredOn < from) return false;
      if (to && t.occurredOn > to) return false;
      if (!needle) return true;
      const hay = [t.description, t.counterparty, cat?.name ?? '', t.method].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [s, kindFilter, tournamentFilter, text, from, to]);

  const money = (cents: number) => formatMoney(cents, s.currency);

  /* Any filter at all is on. Used to decide whether the period summary is
   * worth showing — with nothing filtered it would just repeat the dashboard. */
  const filtered =
    kindFilter !== 'All' || tournamentFilter !== 'All' || text.trim() !== '' || !!from || !!to;
  const shown = totalsFor(s, rows);

  async function submit() {
    setFormError('');
    setDone('');
    const cents = parseAmount(amount);
    if (cents === null || cents <= 0) {
      setFormError('Enter the amount as a number, for example 1250 or 1250.50.');
      return;
    }
    if (!categoryId) {
      setFormError('Pick what this money was for.');
      return;
    }
    if (!date) {
      setFormError('Give it a date.');
      return;
    }
    const result = await addTxn({
      occurredOn: date,
      amount: cents,
      categoryId,
      tournamentId: tournamentId || null,
      description,
      counterparty,
      method,
      settled,
    });
    if (result === null) {
      setFormError(s.error || 'Could not save that entry.');
      return;
    }
    setDone('Entry recorded.');
    setAmount('');
    setDescription('');
    setCounterparty('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Transactions"
        blurb="Every pound in and out. This is the only place numbers get typed — everything else is worked out from here."
        action={
          <Button onClick={() => setOpen((v) => !v)}>{open ? 'Close form' : '＋ Record money'}</Button>
        }
      />

      {/* ---------------- add form ---------------- */}
      {open && (
        <section style={{ ...cardStyle, borderTop: '4px solid #0F52BA' }}>
          <span style={labelStyle}>NEW ENTRY</span>

          <div className="fn-fin-form">
            <Field label="Amount" help="just the number" htmlFor="txn-amount">
              <input
                id="txn-amount"
                inputMode="decimal"
                placeholder="1250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Date" help="when it happened" htmlFor="txn-date">
              <input
                id="txn-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="What was it for" help="this decides in or out" htmlFor="txn-category">
              <select
                id="txn-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Choose…</option>
                {KINDS.map((kind) => (
                  <optgroup key={kind} label={kind}>
                    {categories
                      .filter((c) => c.kind === kind)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.description})
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </Field>

            <Field label="Tournament" help="leave blank if not for one event" htmlFor="txn-tournament">
              <select
                id="txn-tournament"
                value={tournamentId}
                onChange={(e) => setTournamentId(e.target.value)}
                style={inputStyle}
              >
                <option value="">Not tied to a tournament</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Who" help="who paid you, or who you paid" htmlFor="txn-who">
              <input
                id="txn-who"
                placeholder="Cairo Sports Club"
                value={counterparty}
                onChange={(e) => setCounterparty(e.target.value)}
                style={inputStyle}
              />
            </Field>

            <Field label="Method" help="how the money moved" htmlFor="txn-method">
              <select
                id="txn-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                style={inputStyle}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Note" help="anything you want to remember" htmlFor="txn-note" wide>
              <input
                id="txn-note"
                placeholder="Deposit for the October cup"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void submit();
                }}
                style={inputStyle}
              />
            </Field>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13 }}>
            <input
              type="checkbox"
              checked={!settled}
              onChange={(e) => setSettled(!e.target.checked)}
              style={{ width: 16, height: 16 }}
            />
            <span>
              The money has not actually moved yet{' '}
              <span style={{ color: '#2C3A5E' }}>
                (agreed or invoiced only — it will show under {chosen?.kind === 'Income' ? '“owed to you”' : '“you owe”'})
              </span>
            </span>
          </label>

          {chosen && (
            <span style={{ fontSize: 12.5, color: '#2C3A5E' }}>
              This will be recorded as{' '}
              <strong style={{ color: isMoneyIn(chosen.kind) ? '#2E8B67' : '#C1443D' }}>
                {isMoneyIn(chosen.kind) ? 'money in' : 'money out'}
              </strong>{' '}
              under {chosen.name}.
              {chosen.kind === 'Owner capital' &&
                ' It is money you put in, so it is kept out of the profit figures.'}
              {chosen.kind === 'Owner drawing' &&
                ' It is money you took out for yourself, not a business cost, so it is kept out of the profit figures.'}
            </span>
          )}

          {formError && (
            <span role="alert" style={{ fontSize: 12.5, color: '#C1443D', fontWeight: 600 }}>
              {formError}
            </span>
          )}
          {done && (
            <span role="status" style={{ fontSize: 12.5, color: '#2E8B67', fontWeight: 600 }}>
              {done}
            </span>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={s.busy}>
              Close
            </Button>
            <Button size="sm" onClick={() => void submit()} disabled={s.busy}>
              {s.busy ? 'Saving…' : 'Record entry'}
            </Button>
          </div>
        </section>
      )}

      {/* ---------------- filters ---------------- */}
      <section style={{ ...cardStyle, padding: 0, gap: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid #DDE6F3',
            flexWrap: 'wrap',
          }}
        >
          <span style={labelStyle}>FILTER</span>
          <select
            aria-label="Kind"
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: 160 }}
          >
            <option value="All">Everything</option>
            <option value="Income">Money in</option>
            <option value="Direct cost">Event costs</option>
            <option value="Operating expense">Running costs</option>
            <option value="Owner capital">Money you put in</option>
            <option value="Owner drawing">Money you took out</option>
          </select>
          <select
            aria-label="Tournament"
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
            style={{ ...inputStyle, width: 'auto', minWidth: 170 }}
          >
            <option value="All">All tournaments</option>
            <option value="None">Not tied to a tournament</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="filter-from" style={{ ...labelStyle, whiteSpace: 'nowrap' }}>
              FROM
            </label>
            <input
              id="filter-from"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }}
            />
            <label htmlFor="filter-to" style={{ ...labelStyle, whiteSpace: 'nowrap' }}>
              TO
            </label>
            <input
              id="filter-to"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              style={{ ...inputStyle, width: 'auto' }}
            />
          </div>

          <input
            aria-label="Search entries"
            placeholder="Search notes, people, categories"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ ...inputStyle, width: 'auto', flex: 1, minWidth: 180 }}
          />

          {filtered && (
            <button
              type="button"
              className="fn-reset-button"
              onClick={() => {
                setKindFilter('All');
                setTournamentFilter('All');
                setText('');
                setFrom('');
                setTo('');
              }}
              style={{ fontSize: 12.5, fontWeight: 600, color: '#0F52BA', cursor: 'pointer' }}
            >
              Clear filters
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: 12.5, color: '#2C3A5E' }}>
            {rows.length} of {s.txns.length} entries
          </span>
        </div>

        {/* What the rows you are looking at add up to. Without this a date
            window only hides rows; with it, it answers "how did April go". */}
        {filtered && rows.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              padding: '10px 18px',
              borderBottom: '1px solid #DDE6F3',
              background: '#F7F9FC',
            }}
          >
            <Summary label="Money in" value={money(shown.income)} color="#2E8B67" />
            <Summary
              label="Money out"
              value={money(shown.directCosts + shown.operatingExpenses)}
              color="#C1443D"
            />
            <Summary
              label="Net"
              value={money(shown.netProfit)}
              color={shown.netProfit < 0 ? '#C1443D' : '#2E8B67'}
              strong
            />
            {shown.capitalIn > 0 && (
              <Summary label="You put in" value={money(shown.capitalIn)} color="#0F52BA" />
            )}
            {shown.drawings > 0 && (
              <Summary label="You took out" value={money(shown.drawings)} color="#0F52BA" />
            )}
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState>
            {s.txns.length === 0
              ? 'Nothing recorded yet. Press “Record money” and put in your first entry.'
              : 'No entries match those filters.'}
          </EmptyState>
        ) : (
          <div className="fn-table-scroll">
            <div className="fn-table-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID,
                  gap: 14,
                  padding: '10px 18px',
                  background: '#EFEDDA',
                  borderBottom: '1px solid #A6C5D7',
                  ...labelStyle,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                }}
              >
                <span>WHAT FOR</span>
                <span>DATE</span>
                <span>DETAILS</span>
                <span>TOURNAMENT</span>
                <span style={{ textAlign: 'right' }}>AMOUNT</span>
                <span style={{ textAlign: 'right' }}>ACTIONS</span>
              </div>

              {rows.map((t, i) => {
                const cat = categoryById(s, t.categoryId);
                const income = cat ? isMoneyIn(cat.kind) : false;
                const capital = cat?.kind === 'Owner capital';
                const drawing = cat?.kind === 'Owner drawing';
                const tour = t.tournamentId ? tournamentById(s, t.tournamentId) : undefined;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: GRID,
                      gap: 14,
                      alignItems: 'center',
                      padding: '12px 18px',
                      borderBottom: '1px solid #DDE6F3',
                      background: i % 2 ? '#F7F9FC' : '#FFFFFF',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{cat?.name ?? 'Unknown'}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color:
                            capital || drawing ? '#0F52BA' : income ? '#2E8B67' : '#C1443D',
                          fontWeight: 600,
                        }}
                      >
                        {capital
                          ? 'Money you put in'
                          : drawing
                            ? 'Money you took out'
                            : income
                              ? 'Money in'
                              : 'Money out'}
                        {!t.settled && ' · not paid yet'}
                      </span>
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 12.5, color: '#2C3A5E' }}>
                      {formatDate(t.occurredOn)}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13 }}>{t.description || '—'}</span>
                      <span style={{ fontSize: 11, color: '#2C3A5E' }}>
                        {t.counterparty || 'No name'} · {t.method}
                      </span>
                    </div>
                    <span style={{ fontSize: 12.5, color: '#2C3A5E', minWidth: 0 }}>
                      {tour ? tour.name : '—'}
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 13.5,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: capital || drawing ? '#0F52BA' : income ? '#2E8B67' : '#C1443D',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {income ? '+' : '−'}
                      {money(t.amount)}
                    </span>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="fn-reset-button"
                        disabled={s.busy}
                        onClick={() => void toggleSettled(t)}
                        style={{ fontSize: 12, fontWeight: 600, color: '#0F52BA', cursor: 'pointer' }}
                      >
                        {t.settled ? 'Mark unpaid' : 'Mark paid'}
                      </button>
                      <button
                        type="button"
                        className="fn-reset-button"
                        disabled={s.busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              'Delete this entry for good? Every total will be recalculated without it.'
                            )
                          ) {
                            void deleteTxn(t.id);
                          }
                        }}
                        style={{ fontSize: 12, fontWeight: 600, color: '#C1443D', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <p style={{ fontSize: 12, color: '#2C3A5E', margin: 0 }}>
        Missing a category?{' '}
        <button
          type="button"
          className="fn-reset-button"
          onClick={() => router.push('/app/finance/setup')}
          style={{ fontSize: 12, fontWeight: 600, color: '#0F52BA', cursor: 'pointer' }}
        >
          Add your own under Setup
        </button>
        .
      </p>
    </div>
  );
}

/* One figure in the period summary strip. */
function Summary({
  label,
  value,
  color,
  strong,
}: {
  label: string;
  value: string;
  color: string;
  strong?: boolean;
}) {
  return (
    <span style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
      <span style={{ ...labelStyle, whiteSpace: 'nowrap' }}>{label.toUpperCase()}</span>
      <span
        style={{
          fontFamily: mono,
          fontSize: strong ? 14 : 13,
          fontWeight: strong ? 700 : 600,
          color,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </span>
  );
}
