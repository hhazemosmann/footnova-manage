'use client';

/* Break-even planner — the report that would have caught Padel Cup I before
 * the venue was booked.
 *
 * The maths is the standard cost-volume-profit model, which is the right one
 * for events: costs split into those you pay whatever the turnout (prize
 * pool, court hire, the agency) and those that scale with each team. Every
 * team after break-even contributes its fee minus its own variable cost, so
 * the two questions worth asking are "how many teams do I need" and "what is
 * the most I can put up as prize money".
 *
 * Nothing here is saved unless you press the button at the bottom, which
 * turns the plan into a real tournament with its budget filled in. */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addTournament, formatAmount, formatMoney, parseAmount, useFinance } from '@/lib/finance';
import { Field, PageHead, StatCard, cardStyle, inputStyle, labelStyle } from '@/components/finance/ui';
import { Button } from '@/components/ds';

const mono = "'IBM Plex Mono',monospace";

interface OtherCost {
  id: number;
  name: string;
  amount: string;
}

let nextOtherId = 1;

export default function PlannerPage() {
  const s = useFinance();
  const router = useRouter();

  const [name, setName] = useState('');
  /* Everything starts at zero. Example figures sitting in the boxes get
   * mistaken for the app's own suggestion, and worse, a number you did not
   * type is a number you do not check. */
  const [teams, setTeams] = useState('0');
  const [fee, setFee] = useState('0');
  const [prize, setPrize] = useState('0');
  const [venue, setVenue] = useState('0');
  /* The other costs are a named list rather than one lump, because "3,000" in
   * a box tells you nothing three weeks later while "referees 1,200,
   * photographer 1,800" tells you where to cut. The model still treats them
   * as a single fixed total — the names are for the person reading it. */
  const [others, setOthers] = useState<OtherCost[]>([]);
  const [perTeam, setPerTeam] = useState('0');
  const [share, setShare] = useState('100');
  const [target, setTarget] = useState('0');
  const [saveError, setSaveError] = useState('');

  const money = (cents: number) => formatMoney(cents, s.currency);

  /* Everything in minor units, as everywhere else. */
  const n = Math.max(0, Math.floor(Number(teams) || 0));
  const f = parseAmount(fee) ?? 0;
  const p = parseAmount(prize) ?? 0;
  const v = parseAmount(venue) ?? 0;
  /* Every named line, added up. One number from here on. */
  const o = others.reduce((sum, row) => sum + (parseAmount(row.amount) ?? 0), 0);
  const perT = parseAmount(perTeam) ?? 0;
  const sharePct = Math.min(100, Math.max(0, Number(share) || 0));
  const targetProfit = parseAmount(target) ?? 0;

  const fixed = p + v + o;
  /* What one more team is worth once its own costs are paid. This is the
   * number the whole model turns on: if it is zero or less, no amount of
   * teams will ever get you out. */
  const contribution = f - perT;

  const revenue = n * f;
  const variable = n * perT;
  const totalCosts = fixed + variable;
  const profitBeforeShare = revenue - totalCosts;
  const profit = Math.round((profitBeforeShare * sharePct) / 100);

  const canBreakEven = contribution > 0;
  /* With nothing to cover you are already level, which keeps the empty form
   * from opening on a red "never". */
  const breakEvenTeams = fixed <= 0 ? 0 : canBreakEven ? Math.ceil(fixed / contribution) : null;
  /* A partner takes a share of the profit, and a share of zero is still zero,
   * so the break-even point is the same whether you run it alone or not. */
  const teamsForTarget =
    canBreakEven && sharePct > 0
      ? Math.ceil((fixed + (targetProfit * 100) / sharePct) / contribution)
      : null;
  const feeToBreakEven = n > 0 ? Math.ceil(fixed / n) + perT : null;
  /* With the fee and turnout fixed, this is the biggest prize you can put up
   * and still come out level. */
  const maxPrize = revenue - v - o - variable;
  const safety = breakEvenTeams === null ? null : n - breakEvenTeams;

  const ladder = [4, 8, 12, 16, 20, 24, 32];

  /* Ids only need to be unique within this form, never stored. */
  function addOther() {
    setOthers((rows) => [...rows, { id: nextOtherId++, name: '', amount: '' }]);
  }

  function updateOther(id: number, patch: Partial<OtherCost>) {
    setOthers((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function saveAsTournament() {
    setSaveError('');
    if (!name.trim()) {
      setSaveError('Give the tournament a name first.');
      return;
    }
    const id = await addTournament({
      name,
      location: '',
      startsOn: null,
      endsOn: null,
      status: 'Planned',
      budgetIncome: revenue,
      budgetExpense: totalCosts,
      notes:
        n +
        ' teams at ' +
        formatAmount(f) +
        ' each · prize ' +
        formatAmount(p) +
        ' · venue ' +
        formatAmount(v) +
        /* The named lines are worth keeping — they are the reason the plan
         * came out where it did. */
        others
          .filter((r) => r.name.trim() || parseAmount(r.amount))
          .map((r) => ' · ' + (r.name.trim() || 'unnamed') + ' ' + formatAmount(parseAmount(r.amount) ?? 0))
          .join('') +
        (perT ? ' · ' + formatAmount(perT) + ' per team' : '') +
        (sharePct < 100 ? ' · your share ' + sharePct + '%' : '') +
        ' · planned',
    });
    if (!id) {
      setSaveError(s.error || 'Could not create that tournament.');
      return;
    }
    router.push('/app/finance/tournaments/' + id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Break-even planner"
        blurb="Work out whether a tournament pays before you book anything"
      />

      <section style={{ ...cardStyle, borderTop: '4px solid #0F52BA' }}>
        <span style={labelStyle}>THE PLAN</span>
        <p style={{ margin: 0, fontSize: 12.5, color: '#2C3A5E', lineHeight: 1.5 }}>
          Put in the <strong>whole event&rsquo;s</strong> costs, even on a joint tournament — your
          share is taken off at the end, once. Splitting them yourself as well would count the
          partner twice and make it look better than it is.
        </p>

        <div className="fn-fin-form">
          <Field label="Teams" help="how many you expect" htmlFor="p-teams">
            <input
              id="p-teams"
              inputMode="numeric"
              value={teams}
              onChange={(e) => setTeams(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Entry fee" help="what each team pays" htmlFor="p-fee">
            <input
              id="p-fee"
              inputMode="decimal"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Prize pool" help="the whole pot, not your half" htmlFor="p-prize">
            <input
              id="p-prize"
              inputMode="decimal"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Venue hire" help="courts or pitches" htmlFor="p-venue">
            <input
              id="p-venue"
              inputMode="decimal"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              style={inputStyle}
            />
          </Field>
          {/* Each cost you add is a cell in the same grid as the built-in
              fields, so a plan with six costs reads as one form rather than a
              form with a list bolted underneath it. The label is editable —
              that is the cost's name. */}
          {others.map((row, i) => (
            <div
              key={row.id}
              style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  aria-label={'Cost ' + (i + 1) + ' name'}
                  placeholder="NAME THIS COST"
                  value={row.name}
                  autoFocus={row.name === '' && row.amount === ''}
                  onChange={(e) => updateOther(row.id, { name: e.target.value })}
                  style={{
                    ...labelStyle,
                    textTransform: 'uppercase',
                    border: 'none',
                    borderBottom: '1px dashed #A6C5D7',
                    background: 'transparent',
                    outline: 'none',
                    padding: '0 0 3px',
                    flex: 1,
                    minWidth: 0,
                  }}
                />
                <button
                  type="button"
                  className="fn-reset-button"
                  aria-label={'Remove ' + (row.name || 'cost ' + (i + 1))}
                  onClick={() => setOthers((rows) => rows.filter((r) => r.id !== row.id))}
                  style={{ fontSize: 15, color: '#C1443D', cursor: 'pointer', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
              <input
                aria-label={'Cost ' + (i + 1) + ' amount'}
                inputMode="decimal"
                placeholder="0"
                value={row.amount}
                onChange={(e) => updateOther(row.id, { amount: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addOther();
                }}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={labelStyle}>OTHER COSTS</span>
            <button
              type="button"
              onClick={addOther}
              style={{
                ...inputStyle,
                borderStyle: 'dashed',
                borderColor: '#0F52BA',
                color: '#0F52BA',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              ＋ Add a cost
            </button>
          </div>
          <Field label="Cost per team" help="anything that scales with turnout" htmlFor="p-perteam">
            <input
              id="p-perteam"
              inputMode="decimal"
              value={perTeam}
              onChange={(e) => setPerTeam(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Your share %" help="100 if you run it alone, 50 if split" htmlFor="p-share">
            <input
              id="p-share"
              inputMode="numeric"
              value={share}
              onChange={(e) => setShare(e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Profit you want" help="leave 0 for just breaking even" htmlFor="p-target">
            <input
              id="p-target"
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={inputStyle}
            />
          </Field>
        </div>

        {others.length > 0 && (
          <span style={{ fontFamily: mono, fontSize: 12.5, color: '#2C3A5E' }}>
            Other costs: {others.length} {others.length === 1 ? 'line' : 'lines'} · {money(o)} in
            total
          </span>
        )}
      </section>

      {/* ---------------- the verdict ---------------- */}
      <div className="fn-fin-stats">
        <StatCard
          term="Break-even"
          help="teams you need before you stop losing money"
          value={breakEvenTeams === null ? 'never' : String(breakEvenTeams) + ' teams'}
          tone={
            breakEvenTeams === null ? 'bad' : safety !== null && safety < 0 ? 'bad' : 'good'
          }
          footnote={
            breakEvenTeams === null
              ? 'Each team costs at least as much as it pays — no turnout fixes that'
              : fixed <= 0
                ? 'Nothing to cover yet — add your costs'
                : 'Fixed costs ' + money(fixed) + ' ÷ ' + money(contribution) + ' per team'
          }
        />
        <StatCard
          term="Your profit"
          help={'at ' + n + ' teams' + (sharePct < 100 ? ', after your ' + sharePct + '% share' : '')}
          value={money(profit)}
          tone={profit < 0 ? 'bad' : 'good'}
          footnote={revenue ? 'Margin: ' + Math.round((profit / revenue) * 100) + '% of takings' : undefined}
        />
        <StatCard
          term="Margin of safety"
          help="teams you can lose before it turns into a loss"
          value={safety === null ? '—' : safety >= 0 ? String(safety) + ' teams' : String(-safety) + ' short'}
          tone={safety === null ? 'plain' : safety < 0 ? 'bad' : safety <= 2 ? 'warn' : 'good'}
        />
        <StatCard
          term="Biggest prize you can afford"
          help="at this fee and turnout, to come out level"
          value={money(Math.max(0, maxPrize))}
          tone={maxPrize < p ? 'bad' : 'plain'}
          footnote={
            maxPrize < p
              ? 'Your prize pool is ' + money(p - maxPrize) + ' more than the event can carry'
              : undefined
          }
        />
        <StatCard
          term="Fee to break even"
          help={'what each of the ' + n + ' teams would have to pay'}
          value={feeToBreakEven === null ? '—' : money(feeToBreakEven)}
          tone={feeToBreakEven !== null && feeToBreakEven > f ? 'warn' : 'good'}
        />
      </div>

      {targetProfit > 0 && (
        <section style={{ ...cardStyle, borderLeft: '4px solid #0F52BA' }}>
          <span style={labelStyle}>TO MAKE {formatMoney(targetProfit, s.currency)}</span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
            {teamsForTarget === null ? (
              'At these numbers there is no turnout that reaches it — each team has to bring in more than it costs first.'
            ) : (
              <>
                You need <strong>{teamsForTarget} teams</strong> at {money(f)} each
                {sharePct < 100 && <> (your share is {sharePct}%, so the event has to make more)</>}. That
                is {teamsForTarget - n >= 0 ? teamsForTarget - n + ' more than' : n - teamsForTarget + ' fewer than'}{' '}
                the {n} you have planned.
              </>
            )}
          </p>
        </section>
      )}

      {/* ---------------- how it moves with turnout ---------------- */}
      <section style={{ ...cardStyle, padding: 0, gap: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #DDE6F3' }}>
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            What each turnout is worth
          </h2>
          <span style={{ fontSize: 12, color: '#2C3A5E' }}>
            Same costs, different numbers of teams. Fixed costs do not move, so every team past
            break-even is nearly all profit.
          </span>
        </div>

        <div className="fn-table-scroll">
          <div className="fn-table-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: LADDER_GRID,
                gap: 14,
                padding: '10px 18px',
                background: '#EFEDDA',
                borderBottom: '1px solid #A6C5D7',
                ...labelStyle,
                fontSize: 10,
                letterSpacing: '0.1em',
              }}
            >
              <span>TEAMS</span>
              <span style={{ textAlign: 'right' }}>TAKINGS</span>
              <span style={{ textAlign: 'right' }}>COSTS</span>
              <span style={{ textAlign: 'right' }}>YOUR PROFIT</span>
            </div>

            {ladder.map((count) => {
              const rev = count * f;
              const cost = fixed + count * perT;
              const prof = Math.round(((rev - cost) * sharePct) / 100);
              const isPlanned = count === n;
              return (
                <div
                  key={count}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: LADDER_GRID,
                    gap: 14,
                    alignItems: 'center',
                    padding: '10px 18px',
                    borderBottom: '1px solid #DDE6F3',
                    background: isPlanned ? '#F2F6FC' : '#FFFFFF',
                    fontWeight: isPlanned ? 700 : 400,
                  }}
                >
                  <span style={{ fontFamily: mono, fontSize: 13 }}>
                    {count}
                    {isPlanned && <span style={{ color: '#0F52BA' }}> ← your plan</span>}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 12.5, textAlign: 'right' }}>
                    {money(rev)}
                  </span>
                  <span style={{ fontFamily: mono, fontSize: 12.5, textAlign: 'right' }}>
                    {money(cost)}
                  </span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 13,
                      textAlign: 'right',
                      color: prof < 0 ? '#C1443D' : '#2E8B67',
                    }}
                  >
                    {money(prof)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------- turn it into a real tournament ---------------- */}
      <section style={cardStyle}>
        <span style={labelStyle}>SAVE THIS PLAN</span>
        <p style={{ margin: 0, fontSize: 13, color: '#2C3A5E', lineHeight: 1.55 }}>
          Creates a tournament with {money(revenue)} expected income and {money(totalCosts)} expected
          costs, so once it runs you can see how the real numbers compared with this plan.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Tournament name" htmlFor="p-name">
              <input
                id="p-name"
                placeholder="FootNova Padel Cup II"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>
          <Button size="sm" disabled={s.busy} onClick={() => void saveAsTournament()}>
            {s.busy ? 'Creating…' : 'Create tournament'}
          </Button>
        </div>
        {saveError && (
          <span role="alert" style={{ fontSize: 12.5, color: '#C1443D', fontWeight: 600 }}>
            {saveError}
          </span>
        )}
      </section>
    </div>
  );
}

const LADDER_GRID = 'minmax(120px,1.2fr) minmax(96px,1fr) minmax(96px,1fr) minmax(110px,1fr)';
