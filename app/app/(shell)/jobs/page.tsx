'use client';

/* Jobs — source view `screen:'jobs'` / `<sc-if value="{{ isJobs }}">`. */

import { useRouter } from 'next/navigation';
import {
  chip,
  jobLiveCands,
  liveCands,
  liveJobs,
  segments,
  selectJob,
  setStatusFilter,
} from '@/lib/store';
import { useAppState } from '@/lib/use-store';
import { Badge } from '@/components/ds';

const mono = "'IBM Plex Mono',monospace";

export default function JobsPage() {
  const s = useAppState();
  const router = useRouter();

  const all = liveCands(s);

  /* Source: the topbar search filters job titles on this view. */
  const q = s.search.trim().toLowerCase();
  /* Archived jobs live only in the Archive tab. */
  const visibleJobs = liveJobs(s).filter(
    (j) =>
      (s.statusF === 'All' || j.status === s.statusF) && (!q || j.title.toLowerCase().includes(q))
  );

  function openJob(id: string) {
    selectJob(id);
    router.push('/app/jobs/' + id);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
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
            Jobs
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#2C3A5E' }}>
            {visibleJobs.length} job posts · {all.length} applicants total
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Open', 'Closed'].map((l) => {
            const c = chip(s.statusF === l);
            return (
              <button
                key={l}
                type="button"
                className="fn-reset-button"
                aria-pressed={s.statusF === l}
                onClick={() => setStatusFilter(l)}
                style={{
                  cursor: 'pointer',
                  padding: '7px 14px',
                  borderRadius: 999,
                  fontSize: '12.5px',
                  fontWeight: 600,
                  border: '1px solid ' + c.border,
                  background: c.bg,
                  color: c.color,
                }}
              >
                {l}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          /* Source: minmax(330px,1fr) — wrapped in min() so a 330px track
             cannot overflow a 320px viewport. Identical above 330px. */
          gridTemplateColumns: 'repeat(auto-fill,minmax(min(330px, 100%),1fr))',
          gap: 16,
        }}
      >
        {visibleJobs.map((j) => {
          const segs = segments(j);
          return (
            <button
              key={j.id}
              type="button"
              className="fn-reset-button"
              onClick={() => openJob(j.id)}
              /* Source carried an inert `style-hover` attribute the x-dc
                 runtime never implemented — it had no effect and is not
                 reproduced as a real hover style. */
              style={{
                background: '#FFFFFF',
                border: '1px solid #A6C5D7',
                borderRadius: 8,
                boxShadow: 'var(--shadow-sm)',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span
                    style={{
                      fontFamily: 'Archivo,sans-serif',
                      fontWeight: 700,
                      fontSize: '16.5px',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {j.title}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#2C3A5E' }}>
                    Posted {j.posted} · {j.source} · {j.location}
                  </span>
                </div>
                <Badge tone={j.status === 'Open' ? 'success' : 'neutral'}>{j.status}</Badge>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#101B3A',
                    background: '#DDE6F3',
                    borderRadius: 4,
                    padding: '4px 8px',
                  }}
                >
                  {j.source}
                </span>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#101B3A',
                    background: '#EFEDDA',
                    borderRadius: 4,
                    padding: '4px 8px',
                  }}
                >
                  {j.location}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  height: 6,
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: '#DDE6F3',
                }}
              >
                {segs.map((sg, i) => (
                  <div key={i} style={{ width: sg.w, background: sg.bg }} />
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 8,
                  paddingTop: 12,
                  borderTop: '1px solid #DDE6F3',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: mono, fontSize: 19, fontWeight: 600 }}>
                    {jobLiveCands(j).length}
                  </span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', color: '#2C3A5E' }}>
                    APPLICANTS
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span
                    style={{ fontFamily: mono, fontSize: 19, fontWeight: 600, color: '#0F52BA' }}
                  >
                    {jobLiveCands(j).filter((c) => c.short).length}
                  </span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', color: '#2C3A5E' }}>
                    SHORTLISTED
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: mono, fontSize: 19, fontWeight: 600 }}>
                    {jobLiveCands(j).filter((c) => c.stage === 'Interview').length}
                  </span>
                  <span style={{ fontSize: 10, letterSpacing: '0.08em', color: '#2C3A5E' }}>
                    INTERVIEWS
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
