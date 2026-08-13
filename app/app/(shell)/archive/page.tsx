'use client';

/* ARCHIVE — added at the product owner's request; there is no counterpart in
 * the design export. Built entirely from the source's own tokens, reusing the
 * Shortlist screen's table pattern so it sits alongside the ported views
 * rather than looking bolted on.
 *
 * Archived jobs bring their candidates with them; a candidate archived on
 * their own appears separately and stays archived even when their job is
 * restored.
 *
 * This is the only screen in the product where anything can be destroyed, and
 * the only place the database permits it. Everywhere else, archiving is as far
 * as removal goes. */

import { useState } from 'react';
import { useAppState } from '@/lib/use-store';
import {
  archivedCands,
  archivedJobs,
  avatar,
  deleteCandidateForever,
  deleteJobForever,
  initials,
  restoreCandidate,
  restoreJob,
  stars,
} from '@/lib/store';
import { Badge, Button } from '@/components/ds';
import { TONE } from '@/lib/types';
import { formatDate } from '@/lib/format';

const mono = "'IBM Plex Mono',monospace";

const JOB_GRID = 'minmax(180px,2fr) minmax(90px,1fr) minmax(90px,1fr) 210px';
const CAND_GRID = 'minmax(160px,1.6fr) minmax(120px,1.4fr) minmax(92px,1fr) minmax(70px,1fr) 210px';

/* What the confirmation dialog is currently asking about. */
interface Pending {
  kind: 'job' | 'candidate';
  id: string;
  name: string;
  /* Plain-English list of everything that goes with it. */
  detail: string;
}

const headerCell: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  letterSpacing: '0.1em',
  color: '#2C3A5E',
};

export default function ArchivePage() {
  const s = useAppState();
  const jobs = archivedJobs(s);
  const cands = archivedCands(s);
  const [pending, setPending] = useState<Pending | null>(null);

  async function confirmDelete() {
    if (!pending) return;
    const run = pending.kind === 'job' ? deleteJobForever : deleteCandidateForever;
    const result = await run(pending.id);
    /* Leave the dialog open on failure so the error banner is read next to
     * the thing it refers to, rather than the dialog vanishing silently. */
    if (result !== null) setPending(null);
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
          Archive
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#2C3A5E' }}>
          Restore anything to bring it back exactly as it was — or delete it for good
        </p>
      </div>

      {/* ---------------- archived jobs ---------------- */}
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
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #DDE6F3',
            gap: 12,
          }}
        >
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Archived jobs
          </h2>
          <span style={{ ...headerCell }}>{jobs.length} JOBS</span>
        </div>

        {jobs.length === 0 ? (
          <div style={{ padding: 44, textAlign: 'center', fontSize: 14, color: '#2C3A5E' }}>
            No archived jobs.
          </div>
        ) : (
          <div className="fn-table-scroll">
          <div className="fn-table-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: JOB_GRID,
                minWidth: 0,
                gap: 14,
                padding: '10px 18px',
                background: '#EFEDDA',
                borderBottom: '1px solid #A6C5D7',
                ...headerCell,
              }}
            >
              <span>JOB</span>
              <span>ARCHIVED</span>
              <span>CANDIDATES</span>
              <span style={{ textAlign: 'right' }}>ACTION</span>
            </div>

            {jobs.map((j) => (
              <div
                key={j.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: JOB_GRID,
                  minWidth: 0,
                  gap: 14,
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: '1px solid #DDE6F3',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{j.title}</span>
                  <span style={{ fontSize: 12, color: '#2C3A5E' }}>
                    Posted {j.posted} · {j.location}
                  </span>
                </div>
                <span style={{ fontFamily: mono, fontSize: 12.5, color: '#2C3A5E' }}>
                  {formatDate(j.archivedAt)}
                </span>
                <span style={{ fontFamily: mono, fontSize: 13, color: '#2C3A5E' }}>
                  {j.cands.length}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={s.busy}
                    onClick={() => void restoreJob(j.id)}
                  >
                    Restore
                  </Button>
                  <button
                    type="button"
                    className="fn-delete-forever"
                    disabled={s.busy}
                    onClick={() =>
                      setPending({
                        kind: 'job',
                        id: j.id,
                        name: j.title,
                        detail:
                          j.cands.length === 0
                            ? 'This job has no candidates attached.'
                            : j.cands.length +
                              ' candidate' +
                              (j.cands.length === 1 ? '' : 's') +
                              ' will be deleted with it, along with their CVs, documents and notes.',
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* ---------------- individually archived candidates ---------------- */}
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
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #DDE6F3',
            gap: 12,
          }}
        >
          <h2 style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Archived candidates
          </h2>
          <span style={{ ...headerCell }}>{cands.length} PEOPLE</span>
        </div>

        {cands.length === 0 ? (
          <div style={{ padding: 44, textAlign: 'center', fontSize: 14, color: '#2C3A5E' }}>
            No individually archived candidates.
          </div>
        ) : (
          <div className="fn-table-scroll">
          <div className="fn-table-body">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: CAND_GRID,
                minWidth: 0,
                gap: 14,
                padding: '10px 18px',
                background: '#EFEDDA',
                borderBottom: '1px solid #A6C5D7',
                ...headerCell,
              }}
            >
              <span>CANDIDATE</span>
              <span>JOB</span>
              <span>STAGE</span>
              <span>RATING</span>
              <span style={{ textAlign: 'right' }}>ACTION</span>
            </div>

            {cands.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: CAND_GRID,
                  minWidth: 0,
                  gap: 14,
                  alignItems: 'center',
                  padding: '12px 18px',
                  borderBottom: '1px solid #DDE6F3',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <span
                    style={{
                      flex: 'none',
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: avatar(c.id),
                      color: '#EFEDDA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {initials(c.name)}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                </div>
                <span style={{ fontSize: 13, color: '#2C3A5E' }}>{c.jobTitle}</span>
                <span>
                  <Badge tone={TONE[c.stage]}>{c.stage}</Badge>
                </span>
                <span
                  style={{ fontFamily: mono, fontSize: 14, color: '#D6A13A', letterSpacing: '1px' }}
                >
                  {stars(c.rating)}
                </span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={s.busy}
                    onClick={() => void restoreCandidate(c.id)}
                  >
                    Restore
                  </Button>
                  <button
                    type="button"
                    className="fn-delete-forever"
                    disabled={s.busy}
                    onClick={() =>
                      setPending({
                        kind: 'candidate',
                        id: c.id,
                        name: c.name,
                        detail:
                          'Their CV, documents, notes and stage history will be deleted with them.',
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        )}
      </div>

      {/* ---------------- confirm permanent deletion ---------------- */}
      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={'Delete ' + pending.name}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(16,27,58,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !s.busy) setPending(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 460,
              background: '#FFFFFF',
              border: '1px solid #A6C5D7',
              borderTop: '4px solid #C1443D',
              borderRadius: 8,
              boxShadow: 'var(--shadow-md)',
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span style={{ ...headerCell, color: '#C1443D' }}>DELETE PERMANENTLY</span>
            <h2
              style={{
                fontFamily: 'Archivo,sans-serif',
                fontWeight: 800,
                fontSize: 20,
                margin: 0,
                wordBreak: 'break-word',
              }}
            >
              {pending.name}
            </h2>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: '#2C3A5E' }}>
              {pending.detail} Files are removed from storage too. This cannot be undone — if you
              might want it back, use Restore instead.
            </p>

            {s.error && (
              <span role="alert" style={{ fontSize: 12.5, color: '#C1443D', fontWeight: 600 }}>
                {s.error}
              </span>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <Button
                variant="secondary"
                size="sm"
                disabled={s.busy}
                onClick={() => setPending(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                className="fn-delete-forever fn-delete-forever--solid"
                disabled={s.busy}
                onClick={() => void confirmDelete()}
              >
                {s.busy ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
