'use client';

/* One tournament's profit and loss, plus budget against actual — the one
 * report an events business actually acts on, because it answers "should we
 * run this again, and at what price". */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TOURNAMENT_STATUSES,
  TournamentStatus,
  amountToInput,
  archiveTournament,
  byCategory,
  categoryById,
  deleteTournamentForever,
  formatMoney,
  parseAmount,
  restoreTournament,
  totalsFor,
  tournamentById,
  txnsOfTournament,
  updateTournament,
  useFinance,
} from '@/lib/finance';
import {
  EmptyState,
  Field,
  StatCard,
  cardStyle,
  inputStyle,
  labelStyle,
} from '@/components/finance/ui';
import { Button } from '@/components/ds';
import { formatDate } from '@/lib/format';

const mono = "'IBM Plex Mono',monospace";
const GRID = 'minmax(150px,1.6fr) minmax(96px,0.9fr) minmax(150px,1.4fr) minmax(96px,0.9fr)';

export default function TournamentPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const s = useFinance();
  const router = useRouter();

  const t = tournamentById(s, tournamentId);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [status, setStatus] = useState<TournamentStatus>('Planned');
  const [budgetIn, setBudgetIn] = useState('');
  const [budgetOut, setBudgetOut] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!t) return;
    setName(t.name);
    setLocation(t.location);
    setStartsOn(t.startsOn ?? '');
    setEndsOn(t.endsOn ?? '');
    setStatus(t.status);
    setBudgetIn(amountToInput(t.budgetIncome));
    setBudgetOut(amountToInput(t.budgetExpense));
    setNotes(t.notes);
  }, [t]);

  useEffect(() => {
    if (!s.loading && !t) router.replace('/app/finance/tournaments');
  }, [s.loading, t, router]);

  if (!t) return null;

  const txns = txnsOfTournament(s, t.id);
  const tt = totalsFor(s, txns);
  const spend = tt.directCosts + tt.operatingExpenses;
  const profit = tt.income - spend;
  const money = (cents: number) => formatMoney(cents, s.currency);
  const costRows = [...byCategory(s, txns, 'Direct cost'), ...byCategory(s, txns, 'Operating expense')];

  async function save() {
    setFormError('');
    if (!name.trim()) {
      setFormError('Give the tournament a name.');
      return;
    }
    if (startsOn && endsOn && endsOn < startsOn) {
      setFormError('The end date cannot be before the start date.');
      return;
    }
    const result = await updateTournament(t!.id, {
      name: name.trim(),
      location: location.trim(),
      starts_on: startsOn || null,
      ends_on: endsOn || null,
      status,
      budget_income_cents: parseAmount(budgetIn) ?? 0,
      budget_expense_cents: parseAmount(budgetOut) ?? 0,
      notes: notes.trim(),
    });
    if (result === null) {
      setFormError(s.error || 'Could not save those changes.');
      return;
    }
    setEdit(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button
        type="button"
        className="fn-reset-button"
        onClick={() => router.push('/app/finance/tournaments')}
        style={{ fontSize: 13, fontWeight: 600, color: '#0F52BA', cursor: 'pointer', alignSelf: 'flex-start' }}
      >
        ← Back to tournaments
      </button>

      {/* ---------------- header ---------------- */}
      <div
        style={{
          background: '#101B3A',
          color: '#EFEDDA',
          borderRadius: 10,
          padding: 24,
          display: 'flex',
          gap: 18,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
        className="fn-on-dark"
      >
        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1
            style={{
              fontFamily: 'Archivo,sans-serif',
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            {t.name}
          </h1>
          <span style={{ fontSize: 13, color: '#DDE6F3' }}>
            {t.status}
            {t.startsOn ? ' · ' + formatDate(t.startsOn) : ''}
            {t.endsOn ? ' to ' + formatDate(t.endsOn) : ''}
            {t.location ? ' · ' + t.location : ''}
            {t.archivedAt ? ' · archived' : ''}
          </span>
          {t.notes && <span style={{ fontSize: 12.5, color: '#A6C5D7' }}>{t.notes}</span>}
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button
            onClick={() => router.push('/app/finance/transactions?tournament=' + t.id)}
          >
            ＋ Record money
          </Button>
          <Button
            variant="secondary"
            onClick={() => setEdit((v) => !v)}
            style={{ color: '#EFEDDA', borderColor: '#EFEDDA' }}
          >
            {edit ? 'Close' : 'Edit'}
          </Button>
        </div>
      </div>

      {/* ---------------- edit ---------------- */}
      {edit && (
        <section style={{ ...cardStyle, borderTop: '4px solid #0F52BA' }}>
          <span style={labelStyle}>EDIT TOURNAMENT</span>
          <div className="fn-fin-form">
            <Field label="Name" htmlFor="e-name">
              <input id="e-name" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Where" htmlFor="e-location">
              <input
                id="e-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Starts" htmlFor="e-start">
              <input
                id="e-start"
                type="date"
                value={startsOn}
                onChange={(e) => setStartsOn(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Ends" htmlFor="e-end">
              <input
                id="e-end"
                type="date"
                value={endsOn}
                onChange={(e) => setEndsOn(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Stage" htmlFor="e-status">
              <select
                id="e-status"
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
            <Field label="Expected income" help="what you think you will take" htmlFor="e-bin">
              <input
                id="e-bin"
                inputMode="decimal"
                value={budgetIn}
                onChange={(e) => setBudgetIn(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Expected costs" help="what you think you will spend" htmlFor="e-bout">
              <input
                id="e-bout"
                inputMode="decimal"
                value={budgetOut}
                onChange={(e) => setBudgetOut(e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Notes" htmlFor="e-notes" wide>
              <input
                id="e-notes"
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

          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {t.archivedAt ? (
                <>
                  <Button variant="secondary" size="sm" disabled={s.busy} onClick={() => void restoreTournament(t.id)}>
                    Restore
                  </Button>
                  <button
                    type="button"
                    className="fn-delete-forever"
                    disabled={s.busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          'Delete "' + t.name + '" for good? Its entries stay in the books but lose their tag, so they will no longer be grouped under this tournament.'
                        )
                      ) {
                        void deleteTournamentForever(t.id).then(() =>
                          router.push('/app/finance/tournaments')
                        );
                      }
                    }}
                  >
                    Delete permanently
                  </button>
                </>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={s.busy}
                  onClick={() => {
                    if (window.confirm('Archive "' + t.name + '"? Nothing is deleted and you can restore it.')) {
                      void archiveTournament(t.id);
                    }
                  }}
                >
                  Archive tournament
                </Button>
              )}
            </div>
            <Button size="sm" disabled={s.busy} onClick={() => void save()}>
              {s.busy ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </section>
      )}

      {/* ---------------- the numbers ---------------- */}
      <div className="fn-fin-stats">
        <StatCard term="Income" help="money this tournament brought in" value={money(tt.income)} tone="good" />
        <StatCard term="Costs" help="everything spent on it" value={money(spend)} />
        <StatCard
          term="Profit"
          help="income minus costs, for this event alone"
          value={money(profit)}
          tone={profit < 0 ? 'bad' : 'good'}
          footnote={tt.income ? 'Margin (share of income kept): ' + Math.round((profit / tt.income) * 100) + '%' : undefined}
        />
        <StatCard
          term="Still owed to you"
          help="entries marked as not yet paid"
          value={money(tt.owedToYou)}
          tone={tt.owedToYou ? 'warn' : 'plain'}
        />
        <StatCard
          term="You still owe"
          help="costs agreed but not yet paid out"
          value={money(tt.youOwe)}
          tone={tt.youOwe ? 'warn' : 'plain'}
        />
      </div>

      {/* ---------------- budget vs actual ---------------- */}
      {(t.budgetIncome > 0 || t.budgetExpense > 0) && (
        <section style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
              Budget against actual
            </h2>
            <span style={{ fontSize: 12, color: '#2C3A5E' }}>
              What you expected, next to what really happened. Variance (the gap between the two) is
              the number to watch.
            </span>
          </div>

          <BudgetRow
            label="Income"
            budget={t.budgetIncome}
            actual={tt.income}
            currency={s.currency}
            goodWhenOver
          />
          <BudgetRow label="Costs" budget={t.budgetExpense} actual={spend} currency={s.currency} />
          <BudgetRow
            label="Profit"
            budget={t.budgetIncome - t.budgetExpense}
            actual={profit}
            currency={s.currency}
            goodWhenOver
          />
        </section>
      )}

      {/* ---------------- cost breakdown ---------------- */}
      {costRows.length > 0 && (
        <section style={cardStyle}>
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Where the money went
          </h2>
          {costRows.map((r) => (
            <div key={r.category.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{r.category.name}</span>
                <span style={{ fontFamily: mono, fontSize: 12.5 }}>{money(r.total)}</span>
              </div>
              <div style={{ height: 6, background: '#DDE6F3', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    width: (spend ? Math.round((r.total / spend) * 100) : 0) + '%',
                    height: '100%',
                    background: r.category.kind === 'Direct cost' ? '#C1443D' : '#D6A13A',
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: '#2C3A5E' }}>{r.category.description}</span>
            </div>
          ))}
        </section>
      )}

      {/* ---------------- its entries ---------------- */}
      <section style={{ ...cardStyle, padding: 0, gap: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #DDE6F3',
            gap: 12,
          }}
        >
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Entries tagged to this tournament
          </h2>
          <span style={{ ...labelStyle }}>{txns.length} ENTRIES</span>
        </div>

        {txns.length === 0 ? (
          <EmptyState>
            Nothing tagged to this tournament yet. Use “Record money” above — the tournament will
            already be selected for you.
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
                <span style={{ textAlign: 'right' }}>AMOUNT</span>
              </div>
              {txns.map((x, i) => {
                const cat = categoryById(s, x.categoryId);
                const income = cat?.kind === 'Income';
                return (
                  <div
                    key={x.id}
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
                        style={{ fontSize: 11, color: income ? '#2E8B67' : '#C1443D', fontWeight: 600 }}
                      >
                        {income ? 'Money in' : 'Money out'}
                        {!x.settled && ' · not paid yet'}
                      </span>
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 12.5, color: '#2C3A5E' }}>
                      {formatDate(x.occurredOn)}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <span style={{ fontSize: 13 }}>{x.description || '—'}</span>
                      <span style={{ fontSize: 11, color: '#2C3A5E' }}>
                        {x.counterparty || 'No name'} · {x.method}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 13.5,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: income ? '#2E8B67' : '#C1443D',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {income ? '+' : '−'}
                      {money(x.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function BudgetRow({
  label,
  budget,
  actual,
  currency,
  goodWhenOver,
}: {
  label: string;
  budget: number;
  actual: number;
  currency: string;
  goodWhenOver?: boolean;
}) {
  const variance = actual - budget;
  /* Beating a revenue target is good; beating a cost target is not. */
  const good = goodWhenOver ? variance >= 0 : variance <= 0;
  const width = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : actual > 0 ? 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 12.5, color: '#2C3A5E' }}>
          {formatMoney(actual, currency)} of {formatMoney(budget, currency)} expected
        </span>
      </div>
      <div style={{ height: 8, background: '#DDE6F3', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: width + '%', height: '100%', background: good ? '#2E8B67' : '#C1443D' }} />
      </div>
      <span style={{ fontSize: 11.5, color: good ? '#2E8B67' : '#C1443D', fontWeight: 600 }}>
        {variance === 0
          ? 'Exactly on budget'
          : (variance > 0 ? 'Over by ' : 'Under by ') + formatMoney(Math.abs(variance), currency)}
      </span>
    </div>
  );
}
