'use client';

/* Shortlist — source view `screen:'shortlist'` / `<sc-if value="{{ isShortlist }}">`. */

import { useRouter } from 'next/navigation';
import { liveCands, stars } from '@/lib/store';
import { buildRow } from '@/lib/rows';
import { useAppState } from '@/lib/use-store';
import { Badge, Button } from '@/components/ds';

const mono = "'IBM Plex Mono',monospace";
const ROW_GRID = 'minmax(160px,1.6fr) minmax(120px,1.4fr) minmax(92px,1fr) minmax(70px,1fr) 120px';

export default function ShortlistPage() {
  const s = useAppState();
  const router = useRouter();

  const shortAll = liveCands(s).filter((c) => c.short);
  const rows = shortAll.map(buildRow);

  /* BUGFIX (intentional divergence from the source).
   *
   * The original `rowOf().view` read `c.jobId`, but `allCands()` attaches
   * `jobTitle` and never `jobId` — so the ternary always took the false
   * branch and a shortlist row opened the candidate against whatever job
   * happened to be selected, not their own. Corrected here to resolve the
   * job from `jobTitle`, per the explicit request to fix it rather than
   * reproduce it: this view is used to open real candidates. */
  /* Straight to the candidate's own profile page. The design's drawer needed
   * the right job selected first; a real route does not. */
  function openRow(_jobTitle: string | undefined, candId: string) {
    router.push('/app/candidates/' + candId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h1
          style={{
            fontFamily: 'Archivo,sans-serif',
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Shortlist
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#2C3A5E' }}>
          Every shortlisted candidate across all open jobs
        </p>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #A6C5D7',
          borderRadius: 8,
          boxShadow: 'var(--shadow-sm)',
          /* Contained horizontal scroll — the documented mobile strategy for
             this view, and the source's own overflow behaviour. */
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: ROW_GRID,
            minWidth: 0,
            gap: 14,
            padding: '10px 18px',
            background: '#EFEDDA',
            borderBottom: '1px solid #A6C5D7',
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            color: '#2C3A5E',
          }}
        >
          <span>CANDIDATE</span>
          <span>JOB</span>
          <span>STAGE</span>
          <span>RATING</span>
          <span style={{ textAlign: 'right' }}>ACTION</span>
        </div>

        {rows.map((r) => (
          <div
            key={r.cand.id}
            style={{
              display: 'grid',
              gridTemplateColumns: ROW_GRID,
              minWidth: 0,
              gap: 14,
              alignItems: 'center',
              padding: '12px 18px',
              borderBottom: '1px solid #DDE6F3',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span
                aria-hidden="true"
                style={{
                  flex: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: r.avatarBg,
                  color: '#EFEDDA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {r.initials}
              </span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{r.cand.name}</span>
            </div>
            <span style={{ fontSize: 13, color: '#2C3A5E' }}>{r.jobTitle}</span>
            <span>
              <Badge tone={r.tone}>{r.cand.stage}</Badge>
            </span>
            <span
              style={{ fontFamily: mono, fontSize: 14, color: '#D6A13A', letterSpacing: '1px' }}
              aria-label={r.cand.rating + ' out of 5'}
            >
              {stars(r.cand.rating)}
            </span>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="ghost"
                size="sm"
                ariaLabel={'Open ' + r.cand.name}
                onClick={() => openRow(r.jobTitle, r.cand.id)}
              >
                Open
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
