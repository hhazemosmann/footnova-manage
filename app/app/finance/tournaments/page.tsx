'use client';

/* Tournaments as cost centres. Tagging an entry to one is what turns the same
 * journal into a per-event profit and loss — there is no second set of books,
 * and the two can never disagree. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TOURNAMENT_STATUSES,
  TournamentStatus,
  addTournament,
  formatMoney,
  parseAmount,
  totalsFor,
  txnsOfTournament,
  useFinance,
} from '@/lib/finance';
import { EmptyState, Field, PageHead, cardStyle, inputStyle, labelStyle } from '@/components/finance/ui';
import { Button } from '@/components/ds';
import { formatDate } from '@/lib/format';

const mono = "'IBM Plex Mono',monospace";

export default function TournamentsPage() {
  const s = useFinance();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [status, setStatus] = useState<TournamentStatus>('Planned');
  const [budgetIn, setBudgetIn] = useState('');
  const [budgetOut, setBudgetOut] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const live = s.tournaments.filter((t) => !t.archivedAt);
  const archived = s.tournaments.filter((t) => t.archivedAt);
  const money = (cents: number) => formatMoney(cents, s.currency);

  async function create() {
    setFormError('');
    if (!name.trim()) {
      setFormError('Give the tournament a name.');
      return;
    }
    if (startsOn && endsOn && endsOn < startsOn) {
      setFormError('The end date cannot be before the start date.');
      return;
    }
    const id = await addTournament({
      name,
      location,
      startsOn: startsOn || null,
      endsOn: endsOn || null,
      status,
      budgetIncome: parseAmount(budgetIn) ?? 0,
      budgetExpense: parseAmount(budgetOut) ?? 0,
      notes,
    });
    if (!id) {
      setFormError(s.error || 'Could not create that tournament.');
      return;
    }
    router.push('/app/finance/tournaments/' + id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Tournaments"
        blurb="Create an event, tag its money to it, and see whether it actually paid for itself"
        action={
          <Button onClick={() => setOpen((v) => !v)}>{open ? 'Close form' : '＋ New tournament'}</Button>
        }
      />

      {open && (
        <section style={{ ...cardStyle, borderTop: '4px solid #0F52BA' }}>
          <span style={labelStyle}>NEW TOURNAMENT</span>

          <div className="fn-fin-form">
            <Field label="Name" htmlFor="t-name">
              <input
                id="t-name"
                placeholder="October Cup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Where" htmlFor="t-location">
              <input
                id="t-location"
                placeholder="Sheikh Zayed"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Starts" htmlFor="t-start">
              <input
                id="t-start"
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Ends" htmlFor="t-end">
              <input
                id="t-end"
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Stage" htmlFor="t-status">
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TournamentStatus)}
                style={inputStyle}
              >
                {TOURNAMENT_STATUSES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Expected income" help="what you think you will take" htmlFor="t-bin">
              <input
                id="t-bin"
                inputMode="decimal"
                placeholder="0.00"
                value={budgetIn}
                onChange={(e) => setBudgetIn(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Expected costs" help="what you think you will spend" htmlFor="t-bout">
              <input
                id="t-bout"
                inputMode="decimal"
                placeholder="0.00"
                value={budgetOut}
                onChange={(e) => setBudgetOut(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Notes" htmlFor="t-notes" wide>
              <input
                id="t-notes"
                placeholder="16 teams, two pitches"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          {formError && (
            <span role="alert" style={{ fontSize: 12.5, color: '#C1443D', fontWeight: 600 }}>
              {formError}
            </span>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={s.busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void create()} disabled={s.busy}>
              {s.busy ? 'Creating…' : 'Create tournament'}
            </Button>
          </div>
        </section>
      )}

      {live.length === 0 ? (
        <section style={cardStyle}>
          <EmptyState>
            No tournaments yet. Create one, then tag its entry fees, venue hire and everything else
            to it — you will get a profit figure for that event on its own.
          </EmptyState>
        </section>
      ) : (
        <div className="fn-fin-split">
          {live.map((t) => {
            const tt = totalsFor(s, txnsOfTournament(s, t.id));
            const spend = tt.directCosts + tt.operatingExpenses;
            const profit = tt.income - spend;
            const budgetProfit = t.budgetIncome - t.budgetExpense;
            return (
              <button
                key={t.id}
                type="button"
                className="fn-reset-button"
                onClick={() => router.push('/app/finance/tournaments/' + t.id)}
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderTop: '4px solid ' + (profit < 0 ? '#C1443D' : '#2E8B67'),
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span
                    style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 800, fontSize: 19 }}
                  >
                    {t.name}
                  </span>
                  <span style={{ fontSize: 12, color: '#2C3A5E' }}>
                    {t.status}
                    {t.startsOn ? ' · ' + formatDate(t.startsOn) : ''}
                    {t.location ? ' · ' + t.location : ''}
                  </span>
                </div>

                <Line label="Money in" value={money(tt.income)} />
                <Line label="Money out" value={money(spend)} />
                <Line
                  label="Profit"
                  value={money(profit)}
                  strong
                  color={profit < 0 ? '#C1443D' : '#2E8B67'}
                />

                {(t.budgetIncome > 0 || t.budgetExpense > 0) && (
                  <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>
                    Budget (what you expected): {money(budgetProfit)} profit
                  </span>
                )}
                <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>
                  {tt.count} {tt.count === 1 ? 'entry' : 'entries'} tagged to this tournament
                </span>
              </button>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <section style={cardStyle}>
          <span style={labelStyle}>ARCHIVED TOURNAMENTS</span>
          {archived.map((t) => (
            <button
              key={t.id}
              type="button"
              className="fn-reset-button"
              onClick={() => router.push('/app/finance/tournaments/' + t.id)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '9px 0',
                borderBottom: '1px solid #DDE6F3',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</span>
              <span style={{ fontFamily: mono, fontSize: 12, color: '#2C3A5E' }}>
                archived {formatDate(t.archivedAt)}
              </span>
            </button>
          ))}
        </section>
      )}
    </div>
  );
}

function Line({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
      <span style={{ fontSize: 12.5, color: '#2C3A5E' }}>{label}</span>
      <span
        style={{
          fontFamily: mono,
          fontSize: strong ? 15 : 13,
          fontWeight: strong ? 700 : 400,
          color: color ?? '#101B3A',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}
