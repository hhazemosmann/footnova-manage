'use client';

/* Overview — source view `screen:'overview'` / `<sc-if value="{{ isOverview }}">`.
 * Landing route after sign-in (the source's initial screen). */

import { useRouter } from 'next/navigation';
import { ACCENT_COLOR, FUNNEL_MODE, SHOW_CONVERSION } from '@/lib/design-props';
import { jobLiveCands, liveCands, liveJobs, segments, selectJob } from '@/lib/store';
import { useAppState } from '@/lib/use-store';

const mono = "'IBM Plex Mono',monospace";
/* The forward pipeline, used for the cumulative "reached" counts. Offer is
   still a real stage in the app — it is just no longer its own funnel column,
   so anyone at Offer counts as having reached Screening and Interview. */
const PIPELINE = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];

/* The columns actually shown, in the order requested: the total first, then
   rejected, then the pipeline stages that matter. */
const FUNNEL_COLUMNS = [
  { key: 'Applied', label: 'Total applied' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'Screening', label: 'Screening' },
  { key: 'Interview', label: 'Interview' },
  { key: 'Hired', label: 'Hired' },
] as const;


export default function OverviewPage() {
  const s = useAppState();
  const router = useRouter();

  /* Archived jobs and candidates are excluded from every live figure. */
  const all = liveCands(s);
  const openJobs = liveJobs(s).filter((j) => j.status === 'Open');
  const shortAll = all.filter((c) => c.short);

  const metrics = [
    { label: 'OPEN JOBS', value: openJobs.length, delta: '+2 this month', deltaColor: '#2E8B67' },
    {
      label: 'TOTAL APPLICANTS',
      value: all.length,
      delta: '+9 this week',
      deltaColor: '#2E8B67',
    },
    {
      label: 'SHORTLISTED',
      value: shortAll.length,
      delta: '34% of applicants',
      deltaColor: '#2C3A5E',
    },
    {
      label: 'INTERVIEWS SCHEDULED',
      value: all.filter((c) => c.stage === 'Interview').length,
      delta: '3 in next 5 days',
      deltaColor: '#D6A13A',
    },
  ];

  /* The funnel block. Columns are Total applied · Rejected · Screening ·
     Interview · Hired.

     Total applied is everyone. Rejected is an absolute count — it sits
     outside the forward path, so it is not cumulative. The three pipeline
     columns are cumulative "reached" counts: someone at Interview counts
     toward Screening too, which is what makes the drop-off percentages
     meaningful. */
  const rejected = all.filter((c) => c.stage === 'Rejected').length;
  const pipelineIndex = (c: { stage: string }) => PIPELINE.indexOf(c.stage);

  const countFor = (key: string) => {
    if (key === 'Applied') return all.length;
    if (key === 'Rejected') return rejected;
    if (FUNNEL_MODE === 'current') return all.filter((c) => c.stage === key).length;
    const i = PIPELINE.indexOf(key);
    return all.filter((c) => pipelineIndex(c) >= i).length;
  };

  const counts = FUNNEL_COLUMNS.map((col) => countFor(col.key));
  const fmax = Math.max(...counts, 1);

  const funnel = FUNNEL_COLUMNS.map((col, i) => {
    const n = counts[i];
    const pct = Math.round((n / fmax) * 100);
    /* Drop-off only makes sense along the forward path, so it is shown for
       Interview and Hired and suppressed on Rejected and the column after
       it, where the previous number is not a parent of this one. */
    const isPipelineStep = i >= 3;
    const prev = isPipelineStep ? counts[i - 1] : 0;
    return {
      label: col.label,
      n,
      bg:
        col.key === 'Hired'
          ? '#2E8B67'
          : col.key === 'Rejected'
            ? '#C1443D'
            : col.key === 'Applied'
              ? '#A6C5D7'
              : ACCENT_COLOR,
      numColor: '#EFEDDA', // computed in the source but never bound in the template
      w: Math.max(pct, 14) + '%',
      share: all.length ? Math.round((n / all.length) * 100) + '% of all' : '—',
      conv: SHOW_CONVERSION && isPipelineStep && prev ? Math.round((n / prev) * 100) + '%↓' : '',
      convColor:
        SHOW_CONVERSION && isPipelineStep && prev && n / prev < 0.4 ? '#D6A13A' : '#A6C5D7',
    };
  });

  /* Source: openJob(id) — select + reset filters, then navigate. */
  function openJob(id: string) {
    selectJob(id);
    router.push('/app/jobs/' + id);
  }

  const activeJobs = openJobs.map((j) => ({
    id: j.id,
    title: j.title,
    meta: 'Posted ' + j.posted + ' · ' + j.location,
    count: jobLiveCands(j).length,
    segments: segments(j),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1
            style={{
              fontFamily: 'Archivo,system-ui,sans-serif',
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Hiring Overview
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#2C3A5E' }}>
            Season 26/27 recruitment · candidates entered manually per job
          </p>
        </div>
      </div>

      <div
        className="fn-grid-metrics"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}
      >
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              background: '#FFFFFF',
              border: '1px solid #A6C5D7',
              borderRadius: 8,
              boxShadow: 'var(--shadow-sm)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: mono,
                fontSize: '10.5px',
                letterSpacing: '0.12em',
                color: '#2C3A5E',
              }}
            >
              {m.label}
            </span>
            <span
              style={{
                fontFamily: 'Anton,Archivo,sans-serif',
                fontSize: 44,
                lineHeight: 1,
                color: '#101B3A',
              }}
            >
              {m.value}
            </span>
            <span style={{ fontSize: 12, color: m.deltaColor, fontWeight: 600 }}>{m.delta}</span>
          </div>
        ))}
      </div>

      <div
        className="fn-on-dark"
        style={{
          background: '#101B3A',
          color: '#EFEDDA',
          borderRadius: 8,
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16 }}>
            Hiring Funnel
          </span>
          <span
            style={{
              fontFamily: mono,
              fontSize: '10.5px',
              letterSpacing: '0.12em',
              color: '#A6C5D7',
            }}
          >
            {all.length} CANDIDATES
          </span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: '11.5px',
              color: '#A6C5D7',
            }}
          >
            <span
              aria-hidden="true"
              style={{ width: 7, height: 7, borderRadius: 2, background: '#C1443D' }}
            />
            Rejected {rejected} · {all.length ? Math.round((rejected / all.length) * 100) : 0}%
          </span>
        </div>
        <div
          className="fn-grid-funnel"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,minmax(0,1fr))',
            gap: 14,
          }}
        >
          {funnel.map((p) => (
            <div
              key={p.label}
              style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span style={{ fontFamily: 'Anton,sans-serif', fontSize: 34, lineHeight: 1 }}>
                  {p.n}
                </span>
                <span style={{ fontFamily: mono, fontSize: 11, color: p.convColor }}>{p.conv}</span>
              </div>
              <div
                style={{ height: 8, borderRadius: 4, background: '#2C3A5E', overflow: 'hidden' }}
              >
                <div
                  style={{ height: '100%', width: p.w, background: p.bg, borderRadius: 4 }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</span>
                <span style={{ fontFamily: mono, fontSize: '10.5px', color: '#A6C5D7' }}>
                  {p.share}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* The design had a second column here holding a hardcoded "Needs
          Action" list. Removed at the owner's request, so Active Jobs now
          spans the full width. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #A6C5D7',
            borderRadius: 8,
            boxShadow: 'var(--shadow-sm)',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #DDE6F3',
            }}
          >
            <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
              Active Jobs
            </h2>
            <button
              type="button"
              className="fn-reset-button"
              onClick={() => router.push('/app/jobs')}
              style={{ fontSize: 13, fontWeight: 600, color: '#0F52BA', cursor: 'pointer' }}
            >
              View all jobs →
            </button>
          </div>
          {activeJobs.map((j) => (
            <button
              key={j.id}
              type="button"
              className="fn-reset-button"
              onClick={() => openJob(j.id)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(150px,1fr) 90px minmax(150px,220px)',
                minWidth: 0,
                gap: 18,
                alignItems: 'center',
                padding: '16px 20px',
                borderBottom: '1px solid #DDE6F3',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{j.title}</span>
                <span style={{ fontSize: 12, color: '#2C3A5E' }}>{j.meta}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 600 }}>{j.count}</span>
                <span style={{ fontSize: '10.5px', color: '#2C3A5E', letterSpacing: '0.08em' }}>
                  APPLICANTS
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div
                  style={{
                    display: 'flex',
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: '#DDE6F3',
                  }}
                >
                  {j.segments.map((sg, i) => (
                    <div key={i} style={{ width: sg.w, background: sg.bg }} />
                  ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {j.segments.map((sg, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: '10.5px',
                        color: '#2C3A5E',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{ width: 7, height: 7, borderRadius: 2, background: sg.bg }}
                      />
                      {sg.legend}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
