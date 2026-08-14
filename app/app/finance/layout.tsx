'use client';

/* Finance chrome. Deliberately the same frame as the recruiting shell —
 * same sidebar width, same topbar height, same tokens — so moving between the
 * two halves of the product feels like changing rooms, not changing apps.
 *
 * The one visible difference is the "Switch workspace" link back to the hub,
 * which is how you get between them. */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import RequireSession from '@/components/RequireSession';
import { supabase } from '@/lib/supabase/client';
import {
  formatMoney,
  liveTournaments,
  loadFinance,
  resetFinance,
  totalsFor,
  useFinance,
} from '@/lib/finance';

const mono = "'IBM Plex Mono',monospace";

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: '◱', href: '/app/finance/dashboard' },
  { key: 'transactions', label: 'Transactions', icon: '≡', href: '/app/finance/transactions' },
  { key: 'tournaments', label: 'Tournaments', icon: '⚑', href: '/app/finance/tournaments' },
  { key: 'setup', label: 'Setup', icon: '◧', href: '/app/finance/setup' },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSession onAccount={() => void loadFinance()} onSignOut={resetFinance}>
      <FinanceShell>{children}</FinanceShell>
    </RequireSession>
  );
}

function FinanceShell({ children }: { children: React.ReactNode }) {
  const s = useFinance();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const totals = totalsFor(s, s.txns);
  const counts: Record<string, string> = {
    dashboard: '',
    transactions: s.txns.length ? String(s.txns.length) : '',
    tournaments: liveTournaments(s).length ? String(liveTournaments(s).length) : '',
    setup: '',
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div
      className="fn-shell"
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        color: '#101B3A',
        fontFamily: "'Titillium Web',system-ui,sans-serif",
      }}
    >
      {drawerOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fn-sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        id="fn-sidebar"
        className="fn-sidebar fn-on-dark"
        data-open={drawerOpen ? 'true' : 'false'}
        style={{
          width: 236,
          flex: 'none',
          background: '#101B3A',
          color: '#EFEDDA',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 20px 22px',
            borderBottom: '1px solid #2C3A5E',
          }}
        >
          <Image
            src="/footnova-logo.png"
            alt="FootNova"
            width={34}
            height={34}
            style={{ width: 34, height: 34, objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span
              style={{
                fontFamily: 'Archivo,system-ui,sans-serif',
                fontWeight: 800,
                fontSize: 16,
                letterSpacing: '-0.02em',
              }}
            >
              FootNova
            </span>
            <span
              style={{ fontFamily: mono, fontSize: '9.5px', letterSpacing: '0.16em', color: '#A6C5D7' }}
            >
              FINANCE
            </span>
          </div>
        </div>

        <nav
          aria-label="Finance"
          style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 12px' }}
        >
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.href + '/');
            return (
              <button
                key={n.key}
                type="button"
                className="fn-reset-button"
                aria-current={active ? 'page' : undefined}
                onClick={() => router.push(n.href)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  background: active ? '#0F52BA' : 'transparent',
                  color: active ? '#EFEDDA' : '#DDE6F3',
                }}
              >
                <span aria-hidden="true" style={{ width: 16, textAlign: 'center', fontSize: 14 }}>
                  {n.icon}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
                <span style={{ fontFamily: mono, fontSize: 11, opacity: 0.7 }}>{counts[n.key]}</span>
              </button>
            );
          })}
        </nav>

        <div
          style={{
            marginTop: 'auto',
            padding: '16px 20px',
            borderTop: '1px solid #2C3A5E',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <button
            type="button"
            className="fn-reset-button"
            onClick={() => router.push('/app/hub')}
            style={{ fontSize: 13, fontWeight: 600, color: '#DDE6F3', cursor: 'pointer', textAlign: 'left' }}
          >
            ← Switch workspace
          </button>
          <button
            type="button"
            className="fn-reset-button"
            onClick={async () => {
              await supabase().auth.signOut();
              router.replace('/app');
            }}
            style={{ fontSize: 11, fontWeight: 600, color: '#A6C5D7', cursor: 'pointer', textAlign: 'left' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main
        className="fn-main"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--ice-blue)',
        }}
      >
        <header
          className="fn-topbar"
          style={{
            height: 64,
            flex: 'none',
            background: '#FFFFFF',
            borderBottom: '1px solid #A6C5D7',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '0 24px',
          }}
        >
          <button
            type="button"
            className="fn-sidebar-toggle"
            aria-label="Toggle navigation"
            aria-expanded={drawerOpen}
            aria-controls="fn-sidebar"
            onClick={() => setDrawerOpen((v) => !v)}
          >
            ☰
          </button>

          <span
            style={{ fontFamily: mono, fontSize: 11, color: '#2C3A5E', letterSpacing: '0.06em' }}
          >
            {s.txns.length} ENTRIES · {s.currency}
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#2C3A5E', letterSpacing: '0.06em' }}>
              NET PROFIT
            </span>
            <span
              style={{
                fontFamily: 'Archivo,sans-serif',
                fontWeight: 800,
                fontSize: 17,
                color: totals.netProfit < 0 ? '#C1443D' : '#2E8B67',
              }}
            >
              {formatMoney(totals.netProfit, s.currency)}
            </span>
          </div>
        </header>

        <div
          className="fn-page"
          style={{ flex: 1, overflow: 'auto', padding: '24px 28px 40px', minWidth: 0 }}
        >
          {s.error && (
            <div
              role="alert"
              style={{
                marginBottom: 16,
                background: '#FFFFFF',
                border: '1px solid #C1443D',
                borderLeft: '4px solid #C1443D',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 13.5,
              }}
            >
              {s.error}
            </div>
          )}
          {s.loading ? <p style={{ fontSize: 14, color: '#2C3A5E' }}>Loading…</p> : children}
        </div>
      </main>
    </div>
  );
}
