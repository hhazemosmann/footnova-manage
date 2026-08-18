'use client';

/* The whole-business picture: an income statement in plain words, what is
 * still owed in either direction, the last six months, and where the money
 * actually goes.
 *
 * The order is the order an income statement is read in — income, then the
 * costs of putting events on, then the cost of the business existing — so the
 * page teaches the shape of the report while showing the numbers. */

import { useRouter } from 'next/navigation';
import {
  byCategory,
  formatMoney,
  liveTournaments,
  monthlySeries,
  ownerStake,
  totalsFor,
  totalsForTournamentHelp,
  txnsOfTournament,
  useFinance,
} from '@/lib/finance';
import { EmptyState, PageHead, StatCard, cardStyle, labelStyle } from '@/components/finance/ui';
import { Button } from '@/components/ds';
import { formatDate } from '@/lib/format';

const mono = "'IBM Plex Mono',monospace";

export default function FinanceDashboard() {
  const s = useFinance();
  const router = useRouter();

  const t = totalsFor(s, s.txns);
  const months = monthlySeries(s, 6);
  const stake = ownerStake(s);
  const topDirect = byCategory(s, s.txns, 'Direct cost').slice(0, 5);
  const topOperating = byCategory(s, s.txns, 'Operating expense').slice(0, 5);
  const topIncome = byCategory(s, s.txns, 'Income').slice(0, 5);
  const tournaments = liveTournaments(s);

  const money = (cents: number) => formatMoney(cents, s.currency);
  const peak = Math.max(1, ...months.map((m) => Math.max(m.income, m.spend)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHead
        title="Finance overview"
        blurb="Everything you have recorded, summarised the way an accountant would read it"
        action={
          <Button onClick={() => router.push('/app/finance/transactions')}>＋ Record money</Button>
        }
      />

      {s.txns.length === 0 && (
        <div style={{ ...cardStyle, borderLeft: '4px solid #0F52BA' }}>
          <span style={labelStyle}>NOTHING RECORDED YET</span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: '#2C3A5E' }}>
            Every figure on this page is worked out from the entries you add. Start on{' '}
            <strong>Transactions</strong>: put in one amount, the date, and pick what it was for.
            You do not need to know any accounting — the categories are already set up and each one
            explains itself. If you run tournaments, create one under{' '}
            <strong>Tournaments</strong> first and then tag its entries to it, and you will get a
            separate profit figure for that event on top of these.
          </p>
        </div>
      )}

      {/* ---------------- the income statement ---------------- */}
      <div className="fn-fin-stats">
        <StatCard
          term="Income"
          help="all the money that came in"
          value={money(t.income)}
          tone="good"
        />
        <StatCard
          term="Direct costs"
          help="what it cost to put the events on"
          value={money(t.directCosts)}
        />
        <StatCard
          term="Gross profit"
          help="income minus those event costs"
          value={money(t.grossProfit)}
          tone={t.grossProfit < 0 ? 'bad' : 'plain'}
        />
        <StatCard
          term="Operating expenses"
          help="the cost of running the business itself"
          value={money(t.operatingExpenses)}
        />
        <StatCard
          term="Net profit"
          help="what is actually left when everything is paid"
          value={money(t.netProfit)}
          tone={t.netProfit < 0 ? 'bad' : 'good'}
          footnote={t.income ? 'Profit margin (share of income you keep): ' + t.margin + '%' : undefined}
        />
      </div>

      {/* ---------------- still to be paid ---------------- */}
      <div className="fn-fin-stats">
        <StatCard
          term="Owed to you"
          help="invoiced or agreed, but the money has not arrived"
          value={money(t.owedToYou)}
          tone={t.owedToYou ? 'warn' : 'plain'}
          footnote="Accountants call this accounts receivable"
        />
        <StatCard
          term="You owe"
          help="agreed, but you have not paid it yet"
          value={money(t.youOwe)}
          tone={t.youOwe ? 'warn' : 'plain'}
          footnote="Accountants call this accounts payable"
        />
        <StatCard
          term="Entries recorded"
          help="how many lines are in the books"
          value={String(t.count)}
        />
      </div>

      {/* ---------------- the owner's own position ---------------- */}
      <section style={{ ...cardStyle, borderLeft: '4px solid #0F52BA' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Your stake
          </h2>
          <span style={{ fontSize: 12, color: '#2C3A5E' }}>
            How you stand with the business, separate from how the business is trading
          </span>
        </div>

        <StakeLine
          label="Money you have put in"
          help="capital — out of your own pocket"
          value={money(stake.capitalIn)}
        />
        <StakeLine
          label="Money you have taken out"
          help="drawings — for yourself, not a business cost"
          value={'− ' + money(stake.drawings)}
        />
        <StakeLine
          label="Profit kept in the business"
          help="retained profit — every profit ever made, added up. Never typed in; it is worked out"
          value={money(stake.retained)}
          negative={stake.retained < 0}
        />

        <div
          style={{
            borderTop: '1px solid #A6C5D7',
            paddingTop: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 700 }}>
            What the business owes you{' '}
            <span style={{ fontWeight: 400, color: '#2C3A5E' }}>(your stake in it)</span>
          </span>
          <span
            style={{
              fontFamily: mono,
              fontSize: 19,
              fontWeight: 700,
              color: stake.total < 0 ? '#C1443D' : '#2E8B67',
            }}
          >
            {money(stake.total)}
          </span>
        </div>

        {stake.total < 0 && (
          <span style={{ fontSize: 12, color: '#C1443D', lineHeight: 1.5 }}>
            Negative means the business has spent more than you put in, so there is nothing to
            take out — anything you withdraw now is borrowed against future profit.
          </span>
        )}
      </section>

      {/* ---------------- six month trend ---------------- */}
      <section style={cardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Last six months
          </h2>
          <span style={{ fontSize: 12, color: '#2C3A5E' }}>
            Green is money in, red is money out. Bar heights are relative to your biggest month.
          </span>
        </div>

        <div className="fn-fin-months">
          {months.map((m) => (
            <div
              key={m.key}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', minWidth: 0 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 5,
                  height: 110,
                  width: '100%',
                  justifyContent: 'center',
                }}
              >
                <div
                  title={'In ' + money(m.income)}
                  style={{
                    width: 16,
                    height: Math.max(2, Math.round((m.income / peak) * 110)),
                    background: '#2E8B67',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
                <div
                  title={'Out ' + money(m.spend)}
                  style={{
                    width: 16,
                    height: Math.max(2, Math.round((m.spend / peak) * 110)),
                    background: '#C1443D',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              </div>
              <span style={{ fontFamily: mono, fontSize: 11, color: '#2C3A5E' }}>{m.label}</span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: '10.5px',
                  color: m.net < 0 ? '#C1443D' : '#2E8B67',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.net >= 0 ? '+' : ''}
                {formatMoney(m.net, '').trim()}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- where the money goes ---------------- */}
      <div className="fn-fin-split">
        <BreakdownCard
          title="Where income comes from"
          note="Your biggest earners first"
          rows={topIncome}
          currency={s.currency}
          bar="#2E8B67"
        />
        <BreakdownCard
          title="Biggest event costs"
          note="Direct costs — spent on putting events on"
          rows={topDirect}
          currency={s.currency}
          bar="#C1443D"
        />
        <BreakdownCard
          title="Biggest running costs"
          note="Operating expenses — the business itself"
          rows={topOperating}
          currency={s.currency}
          bar="#D6A13A"
        />
      </div>

      {/* ---------------- tournaments at a glance ---------------- */}
      <section style={{ ...cardStyle, padding: 0, gap: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #DDE6F3',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Tournaments
          </h2>
          <button
            type="button"
            className="fn-reset-button"
            onClick={() => router.push('/app/finance/tournaments')}
            style={{ fontSize: 13, fontWeight: 600, color: '#0F52BA', cursor: 'pointer' }}
          >
            View all tournaments →
          </button>
        </div>

        {tournaments.length === 0 ? (
          <EmptyState>
            No tournaments yet. Create one to get a separate profit figure for that event.
          </EmptyState>
        ) : (
          <div className="fn-table-scroll">
            <div className="fn-table-body">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: TOURNAMENT_GRID,
                  gap: 14,
                  padding: '10px 18px',
                  background: '#EFEDDA',
                  borderBottom: '1px solid #A6C5D7',
                  ...labelStyle,
                  fontSize: 10,
                  letterSpacing: '0.1em',
                }}
              >
                <span>TOURNAMENT</span>
                <span style={{ textAlign: 'right' }}>INCOME</span>
                <span style={{ textAlign: 'right' }}>COSTS</span>
                <span style={{ textAlign: 'right' }}>PROFIT</span>
                <span style={{ textAlign: 'right' }}>MARGIN</span>
              </div>

              {tournaments.map((tour) => {
                const tt = totalsFor(s, txnsOfTournament(s, tour.id));
                const spend = tt.directCosts + tt.operatingExpenses;
                const profit = tt.income - spend;
                return (
                  <button
                    key={tour.id}
                    type="button"
                    className="fn-reset-button"
                    onClick={() => router.push('/app/finance/tournaments/' + tour.id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: TOURNAMENT_GRID,
                      gap: 14,
                      alignItems: 'center',
                      padding: '12px 18px',
                      borderBottom: '1px solid #DDE6F3',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{tour.name}</span>
                      <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>
                        {tour.status}
                        {tour.startsOn ? ' · ' + formatDate(tour.startsOn) : ''}
                        {tour.location ? ' · ' + tour.location : ''}
                      </span>
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 13, textAlign: 'right' }}>
                      {money(tt.income)}
                    </span>
                    <span style={{ fontFamily: mono, fontSize: 13, textAlign: 'right' }}>
                      {money(spend)}
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: profit < 0 ? '#C1443D' : '#2E8B67',
                      }}
                    >
                      {money(profit)}
                    </span>
                    <span
                      style={{ fontFamily: mono, fontSize: 13, textAlign: 'right', color: '#2C3A5E' }}
                    >
                      {tt.income ? Math.round((profit / tt.income) * 100) + '%' : '—'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <p style={{ fontSize: 12, color: '#2C3A5E', margin: 0, lineHeight: 1.6 }}>
        {totalsForTournamentHelp}
      </p>
    </div>
  );
}

const TOURNAMENT_GRID =
  'minmax(180px,2fr) minmax(96px,1fr) minmax(96px,1fr) minmax(96px,1fr) minmax(64px,0.6fr)';

function BreakdownCard({
  title,
  note,
  rows,
  currency,
  bar,
}: {
  title: string;
  note: string;
  rows: { category: { id: string; name: string; description: string }; total: number; share: number }[];
  currency: string;
  bar: string;
}) {
  return (
    <section style={cardStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 15, margin: 0 }}>
          {title}
        </h2>
        <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>{note}</span>
      </div>

      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: '#2C3A5E' }}>Nothing recorded here yet.</p>
      ) : (
        rows.map((r) => (
          <div key={r.category.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, minWidth: 0 }}>{r.category.name}</span>
              <span style={{ fontFamily: mono, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                {formatMoney(r.total, currency)}
              </span>
            </div>
            <div style={{ height: 6, background: '#DDE6F3', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: r.share + '%', height: '100%', background: bar }} />
            </div>
            <span style={{ fontSize: 11, color: '#2C3A5E' }}>
              {r.share}% · {r.category.description}
            </span>
          </div>
        ))
      )}
    </section>
  );
}

/* One line of the owner's stake, with its term explained in place. */
function StakeLine({
  label,
  help,
  value,
  negative,
}: {
  label: string;
  help: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 13.5, minWidth: 0 }}>
        {label} <span style={{ color: '#2C3A5E' }}>({help})</span>
      </span>
      <span
        style={{
          fontFamily: mono,
          fontSize: 13.5,
          color: negative ? '#C1443D' : '#101B3A',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </div>
  );
}
