'use client';

/* Job detail — source view `screen:'job'` / `<sc-if value="{{ isJobDetail }}">`.
 * The source kept the job in `state.jobId`; under routing the id lives in the
 * URL so the view survives a refresh, and the store is synced from it. */

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PIPELINE, STAGES, STAGE_COLOR, Stage } from '@/lib/types';
import StageBadge from '@/components/StageBadge';
import {
  archiveJob,
  chip,
  openJobEditModal,
  jobLiveCands,
  openCandModal,
  panelNext,
  setRatingFilter,
  setStageFilter,
  stars,
  syncJobId,
  toggleShortlist,
} from '@/lib/store';
import { buildRow } from '@/lib/rows';
import { useAppState } from '@/lib/use-store';
import { Badge, Button } from '@/components/ds';

const mono = "'IBM Plex Mono',monospace";

/* Source grid definition, shared by the header row and the data rows. */
const ROW_GRID =
  'minmax(180px,2fr) minmax(78px,1fr) minmax(110px,1fr) minmax(80px,1.1fr) minmax(60px,0.9fr) 320px';

/* Rejected sits outside the forward path and Hired is the end of it, so
   neither has a next stage to move to. */
function onPipeline(stage: Stage): boolean {
  const i = (PIPELINE as readonly string[]).indexOf(stage);
  return i >= 0 && i < PIPELINE.length - 1;
}

/* Coloured by the stage it sends them to, so the button and the pill it will
   turn into are the same colour. At the two dead ends it shows the stage they
   are already in. Fixed width and no wrapping, so a column of these lines up
   however long the stage name is. */
function nextButtonStyle(stage: Stage): React.CSSProperties {
  const steps = PIPELINE as readonly string[];
  const i = steps.indexOf(stage);
  const target = (i >= 0 && i < steps.length - 1 ? steps[i + 1] : stage) as Stage;
  const c = STAGE_COLOR[target];
  return {
    background: c.bg,
    color: c.fg,
    minWidth: 142,
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    border: '2px solid transparent',
    /* Disabled already dims to 0.5; keep it fully legible instead, since the
       colour is carrying the meaning. */
    opacity: 1,
  };
}

/* The button says where the candidate is going, not merely that it moves
   them — one glance tells you what pressing it will do. */
function nextLabel(stage: Stage): string {
  const steps = PIPELINE as readonly string[];
  const i = steps.indexOf(stage);
  if (i < 0) return 'Rejected';
  if (i >= steps.length - 1) return 'Hired';
  return '→ ' + steps[i + 1];
}

export default function JobDetailPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const s = useAppState();
  const router = useRouter();

  const job = s.jobs.find((j) => j.id === jobId);

  /* Keep the store's "current job" aligned with the URL so chrome that reads
   * it (the Add Candidate dialog) is correct after a direct load. */
  useEffect(() => {
    if (job) syncJobId(job.id);
  }, [job]);

  /* Wait for the first load before deciding a job is missing, otherwise a
   * direct visit bounces to /app/jobs while the data is still in flight. */
  useEffect(() => {
    if (!s.loading && !job) router.replace('/app/jobs');
  }, [s.loading, job, router]);

  if (!job) return null;

  const q = s.search.trim().toLowerCase();
  const live = jobLiveCands(job);
  const filtered = live
    .filter((c) => s.stageF === 'All' || c.stage === s.stageF)
    .filter((c) => s.ratingF === 'All' || (c.rating ?? 0) >= Number(s.ratingF))
    .filter((c) => !q || c.name.toLowerCase().includes(q));
  const rows = filtered.map(buildRow);

  const stats = [
    { k: 'APPLICANTS', v: live.length },
    { k: 'SHORTLISTED', v: live.filter((c) => c.short).length },
    { k: 'INTERVIEW/OFFER', v: live.filter((c) => c.stage === 'Interview/Offer').length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <button
        type="button"
        className="fn-reset-button"
        onClick={() => router.push('/app/jobs')}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: '#0F52BA',
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        ← All jobs
      </button>

      <div
        className="fn-job-header fn-on-dark"
        style={{
          background: '#101B3A',
          color: '#EFEDDA',
          borderRadius: 8,
          padding: '24px 26px',
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'Archivo,sans-serif',
                fontWeight: 800,
                fontSize: 28,
                letterSpacing: '-0.02em',
                margin: 0,
                textTransform: 'uppercase',
              }}
            >
              {job.title}
            </h1>
            <Badge tone={job.status === 'Open' ? 'success' : 'neutral'}>{job.status}</Badge>
          </div>
          <span style={{ fontSize: 13, color: '#DDE6F3' }}>
            Posted {job.posted} · {job.source} · {job.location}
          </span>
        </div>
        {stats.map((st) => (
          <div
            key={st.k}
            className="fn-job-header-stats"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              paddingLeft: 24,
              borderLeft: '1px solid #2C3A5E',
            }}
          >
            <span style={{ fontFamily: 'Anton,sans-serif', fontSize: 32, lineHeight: 1 }}>
              {st.v}
            </span>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: '0.1em',
                color: '#A6C5D7',
              }}
            >
              {st.k}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="md" onClick={openCandModal}>
            ＋ Add Candidate
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={s.busy}
            onClick={() => openJobEditModal(job)}
            style={{ color: '#EFEDDA', borderColor: '#EFEDDA' }}
          >
            Edit job
          </Button>
          {/* Archive replaces deletion entirely — the job and everyone
              attached to it move to the Archive tab and can be restored. */}
          <Button
            variant="secondary"
            size="md"
            disabled={s.busy}
            onClick={() => {
              if (
                window.confirm(
                  `Archive "${job.title}" and its ${live.length} candidate${
                    live.length === 1 ? '' : 's'
                  }? Nothing is deleted — you can restore it from the Archive tab.`
                )
              ) {
                void archiveJob(job.id).then(() => router.push('/app/archive'));
              }
            }}
            style={{ color: '#EFEDDA', borderColor: '#EFEDDA' }}
          >
            Archive job
          </Button>
        </div>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #A6C5D7',
          borderRadius: 8,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 18px',
            borderBottom: '1px solid #DDE6F3',
            flexWrap: 'wrap',
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
            FILTER
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', ...STAGES].map((l) => {
              const c = chip(s.stageF === l);
              return (
                <button
                  key={l}
                  type="button"
                  className="fn-reset-button"
                  aria-pressed={s.stageF === l}
                  onClick={() => setStageFilter(l)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
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
          <div aria-hidden="true" style={{ width: 1, height: 22, background: '#DDE6F3' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['All', '5', '4', '3'].map((l) => {
              const c = chip(s.ratingF === l);
              return (
                <button
                  key={l}
                  type="button"
                  className="fn-reset-button"
                  aria-pressed={s.ratingF === l}
                  onClick={() => setRatingFilter(l)}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                    border: '1px solid ' + c.border,
                    background: c.bg,
                    color: c.color,
                  }}
                >
                  {l === 'All' ? 'Any rating' : l + '★ +'}
                </button>
              );
            })}
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#2C3A5E' }}>
            {rows.length} of {live.length} candidates
          </span>
        </div>

        {/* Source: the table's own contained horizontal scroll — the
            documented mobile strategy for this view. Only the rows scroll;
            the filter bar above stays put and wraps instead. */}
        <div className="fn-table-scroll">
        <div className="fn-table-body">
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
          <span>APPLIED</span>
          <span>STAGE</span>
          <span>RATING</span>
          <span>CV</span>
          <span style={{ textAlign: 'right' }}>ACTIONS</span>
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
              background: r.rowBg,
            }}
          >
            <button
              type="button"
              className="fn-reset-button"
              onClick={() => router.push('/app/candidates/' + r.cand.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                cursor: 'pointer',
                minWidth: 0,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  flex: 'none',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: r.avatarBg,
                  color: '#EFEDDA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12.5px',
                  fontWeight: 700,
                }}
              >
                {r.initials}
              </span>
              <span
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  textAlign: 'left',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 14 }}>{r.cand.name}</span>
                <span
                  style={{
                    fontSize: '11.5px',
                    color: '#2C3A5E',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {r.cand.email}
                </span>
              </span>
            </button>
            <span style={{ fontFamily: mono, fontSize: '12.5px', color: '#2C3A5E' }}>
              {r.cand.date}
            </span>
            <span>
              <StageBadge stage={r.cand.stage} />
            </span>
            <span
              style={{ fontFamily: mono, fontSize: 14, color: '#D6A13A', letterSpacing: '1px' }}
              aria-label={r.cand.rating + ' out of 5'}
            >
              {stars(r.cand.rating)}
            </span>
            <button
              type="button"
              className="fn-reset-button"
              onClick={() => router.push('/app/candidates/' + r.cand.id)}
              style={{ fontSize: '12.5px', fontWeight: 600, color: '#0F52BA', cursor: 'pointer' }}
            >
              {r.cv}
            </button>
            {/* alignItems, or the buttons stretch to whatever height the
                tallest cell in the row happens to be. */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                justifyContent: 'flex-end',
                alignItems: 'center',
              }}
            >
              {/* A transparent border of the same width the secondary button
                  draws, so all three end up the same height. Without it the
                  bordered one stands 4px taller than its neighbours. */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/app/candidates/' + r.cand.id)}
                style={{ border: '2px solid transparent' }}
              >
                View
              </Button>
              {/* Fixed width so the column does not jog left and right as
                  the label flips between Shortlist and Shortlisted. */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toggleShortlist(r.cand)}
                style={{ minWidth: 104, justifyContent: 'center' }}
              >
                {r.shortLabel}
              </Button>
              {/* Moving someone forward is the action taken dozens of times a
                  day; rejecting is done once per candidate and is still on
                  their profile. So the row carries the frequent one. */}
              <Button
                variant="primary"
                size="sm"
                disabled={s.busy || !onPipeline(r.cand.stage)}
                onClick={() => panelNext(r.cand)}
                style={nextButtonStyle(r.cand.stage)}
              >
                {nextLabel(r.cand.stage)}
              </Button>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div style={{ padding: 44, textAlign: 'center', fontSize: 14, color: '#2C3A5E' }}>
            No candidates match these filters.
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}
