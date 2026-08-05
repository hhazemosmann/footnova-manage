'use client';

/* Shared app chrome — the sidebar, topbar, candidate drawer and both dialogs
 * from the source, everything that rendered regardless of which view was
 * active. This is also the single subscription point for the store, so
 * navigating between views never tears it down.
 *
 * Source view-switching (`go(name)` flipping `state.screen`) is replaced by
 * real navigation; the active nav item is derived from usePathname(). */

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import CandidatePanel from '@/components/CandidatePanel';
import JobModal from '@/components/JobModal';
import CandidateModal from '@/components/CandidateModal';
import { Button } from '@/components/ds';
import { supabase } from '@/lib/supabase/client';
import { initials, liveCands, liveJobs, openJobModal, setSearch } from '@/lib/store';
import { useAppState } from '@/lib/use-store';

const mono = "'IBM Plex Mono',monospace";

/* Source: the `nav` array in renderVals. `href` replaces the `go` handler. */
const NAV = [
  { key: 'overview', label: 'Overview', icon: '⌂', href: '/app/overview' },
  { key: 'jobs', label: 'Jobs', icon: '▤', href: '/app/jobs' },
  { key: 'shortlist', label: 'Shortlist', icon: '●', href: '/app/shortlist' },
  { key: 'archive', label: 'Archive', icon: '⌸', href: '/app/archive' },
  { key: 'settings', label: 'Settings', icon: '◧', href: '/app/settings' },
];

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Shell>{children}</Shell>
    </RequireAuth>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const s = useAppState();
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const all = liveCands(s);
  const shortAll = all.filter((c) => c.short);
  const archivedCount =
    s.jobs.filter((j) => j.archivedAt).length +
    s.jobs.filter((j) => !j.archivedAt).flatMap((j) => j.cands).filter((c) => c.archivedAt).length;

  /* Source: active = screen===key || (key==='jobs' && screen==='job') —
   * i.e. Jobs stays lit while a job-detail view is open. */
  const isActive = (key: string, href: string) =>
    pathname === href || (key === 'jobs' && pathname.startsWith('/app/jobs'));

  const counts: Record<string, string> = {
    overview: '',
    jobs: String(liveJobs(s).length),
    shortlist: String(shortAll.length),
    archive: archivedCount ? String(archivedCount) : '',
    settings: '',
  };

  /* Drawer dismissal: Escape, and any route change. */
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div
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
              style={{
                fontFamily: mono,
                fontSize: '9.5px',
                letterSpacing: '0.16em',
                color: '#A6C5D7',
              }}
            >
              RECRUITING
            </span>
          </div>
        </div>

        <nav
          aria-label="Main"
          style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '16px 12px' }}
        >
          {NAV.map((n) => {
            const active = isActive(n.key, n.href);
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
                <span style={{ fontFamily: mono, fontSize: 11, opacity: 0.7 }}>
                  {counts[n.key]}
                </span>
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
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#0F52BA',
              color: '#EFEDDA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
            }}
          >
            {s.userName ? initials(s.userName) : '—'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{s.userName || 'Signed in'}</span>
            <span style={{ fontSize: 11, color: '#A6C5D7' }}>Talent Lead</span>
          </div>
          {/* Scaffold addition — the source had no sign-out control. */}
          <button
            type="button"
            className="fn-reset-button"
            onClick={async () => {
              await supabase().auth.signOut();
              router.replace('/app');
            }}
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              fontWeight: 600,
              color: '#A6C5D7',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main
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

          <div
            className="fn-topbar-search"
            style={{
              flex: 1,
              maxWidth: 420,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#EFEDDA',
              border: '1px solid #A6C5D7',
              borderRadius: 6,
              padding: '8px 12px',
            }}
          >
            <span aria-hidden="true" style={{ color: '#2C3A5E', fontSize: 13 }}>
              ⌕
            </span>
            <label className="fn-visually-hidden" htmlFor="fn-search">
              Search jobs or candidates
            </label>
            <input
              id="fn-search"
              value={s.search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs or candidates"
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontFamily: "'Titillium Web',system-ui,sans-serif",
                fontSize: 14,
                color: '#101B3A',
              }}
            />
          </div>

          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: '#2C3A5E',
                letterSpacing: '0.06em',
              }}
            >
              {all.length} CANDIDATES · ADDED MANUALLY
            </span>
            <Button size="sm" onClick={openJobModal}>
              ＋ Post New Job
            </Button>
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
                color: '#101B3A',
              }}
            >
              {s.error}
            </div>
          )}
          {s.loading ? (
            <p style={{ fontSize: 14, color: '#2C3A5E' }}>Loading…</p>
          ) : (
            children
          )}
        </div>
      </main>

      <CandidatePanel />
      <JobModal />
      <CandidateModal />
    </div>
  );
}
