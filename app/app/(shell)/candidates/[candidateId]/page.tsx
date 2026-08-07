'use client';

/* CANDIDATE PROFILE
 *
 * Replaces the 440px right-hand drawer the design export used. That drawer
 * came from the original mockup, but it squeezed the CV preview, the notes and
 * every action into one narrow column. This is a real page at its own URL, so
 * it survives a refresh, can be linked to, and has room to breathe.
 *
 * Built entirely from the source's own tokens — same navy header treatment,
 * same card, badge and mono-label vocabulary as the ported views.
 *
 * Both outward links (LinkedIn and the CV) open in a new tab. The CV link is a
 * real anchor carrying a signed URL, so middle-click and ctrl-click work too. */

import { use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/lib/use-store';
import {
  addNote,
  archiveCandidate,
  avatar,
  candidateById,
  deleteNote,
  initials,
  jobOfCandidate,
  panelNext,
  panelReject,
  panelShortlist,
  restoreCandidate,
  setLinkedinUrl,
  setLocation,
  setNoteDraft,
  setRating,
  setStage,
  signedCvUrl,
  uploadCv,
} from '@/lib/store';
import { Badge, Button, Select } from '@/components/ds';
import CandidateDocuments from '@/components/CandidateDocuments';
import SectionBoundary from '@/components/SectionBoundary';
import { CV_ACCEPT, CV_MAX_BYTES, STAGES, Stage, TONE } from '@/lib/types';
import { formatFileSize } from '@/lib/format';

const mono = "'IBM Plex Mono',monospace";

const label: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '10.5px',
  letterSpacing: '0.12em',
  color: '#2C3A5E',
};

const card: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #A6C5D7',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

export default function CandidateProfilePage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = use(params);
  const s = useAppState();
  const router = useRouter();

  const cand = candidateById(s, candidateId);
  const job = cand ? jobOfCandidate(s, cand) : undefined;

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvUrlFailed, setCvUrlFailed] = useState(false);
  const [cvError, setCvError] = useState('');
  const [linkedinDraft, setLinkedinDraft] = useState('');
  const [locationDraft, setLocationDraft] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const isPdf = cand?.cv?.mimeType === 'application/pdf';

  useEffect(() => {
    setLinkedinDraft(cand?.linkedinUrl ?? '');
    setLocationDraft(cand?.location ?? '');
    setCvError('');
  }, [cand?.id, cand?.linkedinUrl, cand?.location]);

  /* Private bucket: mint a signed URL for the open candidate's CV. One hour,
   * so a plain anchor keeps working while the page is open. */
  useEffect(() => {
    let active = true;
    setCvUrl(null);
    setCvUrlFailed(false);
    const path = cand?.cv?.path;
    if (!path) return;
    void signedCvUrl(path, 3600).then((url) => {
      if (!active) return;
      if (url) setCvUrl(url);
      else setCvUrlFailed(true);
    });
    return () => {
      active = false;
    };
  }, [cand?.cv?.path]);

  useEffect(() => {
    if (!s.loading && !cand) router.replace('/app/jobs');
  }, [s.loading, cand, router]);

  if (!cand || !job) return null;

  const archived = cand.archivedAt !== null || job.archivedAt !== null;
  const archivedByJob = cand.archivedAt === null && job.archivedAt !== null;

  async function handleFile(file: File | null) {
    setCvError('');
    if (!file || !cand) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setCvError('Only PDF and DOCX files are accepted.');
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setCvError('That file is ' + formatFileSize(file.size) + ' — the limit is 10 MB.');
      return;
    }
    await uploadCv(cand.id, file);
  }

  const detail = (k: string, v: React.ReactNode) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={label}>{k}</span>
      <span style={{ fontSize: 14, wordBreak: 'break-word' }}>{v}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <Link
        href={'/app/jobs/' + job.id}
        style={{ fontSize: 13, fontWeight: 600, color: '#0F52BA', alignSelf: 'flex-start' }}
      >
        ← Back to {job.title}
      </Link>

      {/* ---------------- header ---------------- */}
      <div
        className="fn-profile-header fn-on-dark"
        style={{
          background: '#101B3A',
          color: '#EFEDDA',
          borderRadius: 8,
          padding: '24px 26px',
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            flex: 'none',
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: avatar(cand.id),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          {initials(cand.name)}
        </span>

        <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1
              style={{
                fontFamily: 'Archivo,sans-serif',
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: '-0.02em',
                margin: 0,
              }}
            >
              {cand.name}
            </h1>
            <Badge tone={TONE[cand.stage]}>{cand.stage}</Badge>
            {cand.short && <Badge tone="sapphire">Shortlisted</Badge>}
            {archived && <Badge tone="neutral">Archived</Badge>}
          </div>

          <span style={{ fontSize: 13, color: '#DDE6F3' }}>
            Applied to{' '}
            <Link href={'/app/jobs/' + job.id} style={{ color: '#A6C5D7', fontWeight: 600 }}>
              {job.title}
            </Link>{' '}
            · {cand.date} · {cand.source}
          </span>
        </div>
      </div>

      {archived && (
        <div
          role="status"
          style={{
            background: '#FFFFFF',
            border: '1px solid #A6C5D7',
            borderLeft: '4px solid #2C3A5E',
            borderRadius: 8,
            padding: '12px 16px',
            fontSize: 13.5,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ flex: 1, minWidth: 200 }}>
            {archivedByJob
              ? 'In the Archive because “' + job.title + '” is archived. Restore the job to bring them back.'
              : 'This candidate is in the Archive. Nothing has been deleted.'}
          </span>
          {!archivedByJob && (
            <Button
              variant="secondary"
              size="sm"
              disabled={s.busy}
              onClick={() => void restoreCandidate(cand.id)}
            >
              Restore
            </Button>
          )}
        </div>
      )}

      {/* ---------------- two columns ---------------- */}
      <div className="fn-profile-grid">
        {/* ----- left: CV + notes ----- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section style={card}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span style={label}>CV / RESUME</span>
              {cand.cv && (
                <span style={{ fontSize: 12, color: '#2C3A5E' }}>
                  {formatFileSize(cand.cv.sizeBytes)} · {isPdf ? 'PDF' : 'Word document'}
                </span>
              )}
            </div>

            {cand.cv ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    flexWrap: 'wrap',
                    paddingBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Archivo,sans-serif',
                      fontWeight: 700,
                      fontSize: 15,
                      flex: 1,
                      minWidth: 160,
                      wordBreak: 'break-word',
                    }}
                  >
                    {cand.cv.fileName}
                  </span>
                  {/* A real anchor, so middle-click and ctrl-click work. */}
                  {cvUrl ? (
                    <a
                      href={cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: 13,
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--sapphire)',
                        color: 'var(--ivory)',
                        textDecoration: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Open in new tab ↗
                    </a>
                  ) : (
                    <span style={{ fontSize: 12.5, color: cvUrlFailed ? '#C1443D' : '#2C3A5E' }}>
                      {cvUrlFailed ? 'Could not prepare the link' : 'Preparing link…'}
                    </span>
                  )}
                </div>

                {isPdf && cvUrl && (
                  <object
                    data={cvUrl}
                    type="application/pdf"
                    aria-label={cand.name + ' CV preview'}
                    style={{
                      width: '100%',
                      height: 520,
                      border: '1px solid #A6C5D7',
                      borderRadius: 4,
                    }}
                  >
                    <p style={{ padding: 14, fontSize: 13 }}>
                      Your browser cannot preview PDFs inline — use “Open in new tab”.
                    </p>
                  </object>
                )}
                {!isPdf && (
                  <p style={{ fontSize: 13, color: '#2C3A5E', margin: 0, lineHeight: 1.5 }}>
                    Word documents cannot be previewed in the browser. Open it in a new tab to
                    download and read it.
                  </p>
                )}
              </>
            ) : (
              <p style={{ fontSize: 13.5, color: '#2C3A5E', margin: 0 }}>
                No CV uploaded yet.
              </p>
            )}

            <div
              style={{
                borderTop: '1px solid #DDE6F3',
                paddingTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              <span style={{ fontSize: 12, color: '#2C3A5E', flex: 1, minWidth: 150 }}>
                {cand.cv
                  ? 'Drop a new file here to replace · PDF or DOCX, max 10 MB'
                  : 'Drop a CV here or browse · PDF or DOCX, max 10 MB'}
              </span>
              <label>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: 13,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    color: 'var(--midnight)',
                    border: '2px solid var(--midnight)',
                    cursor: s.busy ? 'not-allowed' : 'pointer',
                    opacity: s.busy ? 0.5 : 1,
                  }}
                >
                  {s.busy ? 'Uploading…' : cand.cv ? 'Replace CV' : 'Upload CV'}
                </span>
                <input
                  type="file"
                  accept={CV_ACCEPT}
                  disabled={s.busy}
                  className="fn-visually-hidden"
                  onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            {cvError && (
              <span role="alert" style={{ fontSize: 12, color: '#C1443D', fontWeight: 600 }}>
                {cvError}
              </span>
            )}
          </section>

          {/* Boundaried: a fault in here must never blank the profile. */}
          <SectionBoundary title="Documents">
            <CandidateDocuments candidateId={cand.id} documents={cand.documents} />
          </SectionBoundary>

          {/* ----- notes ----- */}
          <section style={card}>
            <span style={label}>NOTES</span>

            {cand.notes.length === 0 && (
              <p style={{ fontSize: 13.5, color: '#2C3A5E', margin: 0 }}>
                No notes yet. Anything you write here is visible to the whole team.
              </p>
            )}

            {cand.notes.map((n) => (
              <div
                key={n.id}
                style={{
                  background: '#DDE6F3',
                  borderRadius: 6,
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: '11.5px',
                    color: '#2C3A5E',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#101B3A' }}>{n.who}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {n.when}
                    <button
                      type="button"
                      className="fn-reset-button"
                      aria-label={'Delete note by ' + n.who}
                      disabled={s.busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            'Delete this note? Notes are the one thing that is removed for good.'
                          )
                        ) {
                          void deleteNote(n.id);
                        }
                      }}
                      style={{ color: '#2C3A5E', opacity: 0.7, fontSize: 15, lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                </div>
                <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>{n.text}</span>
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="fn-visually-hidden" htmlFor="profile-note">
                Add a note
              </label>
              <textarea
                id="profile-note"
                ref={noteRef}
                value={s.note}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                style={{
                  border: '1px solid #A6C5D7',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontFamily: "'Titillium Web',sans-serif",
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  width: '100%',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="sm"
                  disabled={s.busy || !s.note.trim()}
                  onClick={() => void addNote(cand)}
                >
                  Post note
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* ----- right: details, rating, stage, actions ----- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section style={card}>
            <span style={label}>CONTACT</span>
            {detail(
              'EMAIL',
              cand.email ? (
                <a href={'mailto:' + cand.email} style={{ color: '#0F52BA' }}>
                  {cand.email}
                </a>
              ) : (
                <span style={{ color: '#2C3A5E' }}>—</span>
              )
            )}
            {detail(
              'PHONE',
              cand.phone ? (
                <a href={'tel:' + cand.phone.replace(/\s/g, '')} style={{ color: '#0F52BA' }}>
                  {cand.phone}
                </a>
              ) : (
                <span style={{ color: '#2C3A5E' }}>—</span>
              )
            )}
            {detail(
              'LOCATION',
              cand.location ? cand.location : <span style={{ color: '#2C3A5E' }}>Not set</span>
            )}
            {detail(
              'LINKEDIN',
              cand.linkedinUrl ? (
                <a
                  href={cand.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#0F52BA' }}
                >
                  Open profile ↗
                </a>
              ) : (
                <span style={{ color: '#2C3A5E' }}>Not set</span>
              )
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="profile-location" style={label}>
                EDIT LOCATION
              </label>
              <input
                id="profile-location"
                placeholder="Cairo, EG"
                value={locationDraft}
                onChange={(e) => setLocationDraft(e.target.value)}
                onBlur={() => {
                  if (locationDraft.trim() !== cand.location) {
                    void setLocation(cand.id, locationDraft);
                  }
                }}
                style={{
                  border: '1px solid #A6C5D7',
                  borderRadius: 6,
                  padding: '9px 11px',
                  fontFamily: "'Titillium Web',sans-serif",
                  fontSize: 13.5,
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="profile-linkedin" style={label}>
                EDIT LINKEDIN URL
              </label>
              <input
                id="profile-linkedin"
                type="url"
                placeholder="linkedin.com/in/…"
                value={linkedinDraft}
                onChange={(e) => setLinkedinDraft(e.target.value)}
                onBlur={() => {
                  if (linkedinDraft.trim() !== cand.linkedinUrl) {
                    void setLinkedinUrl(cand.id, linkedinDraft);
                  }
                }}
                style={{
                  border: '1px solid #A6C5D7',
                  borderRadius: 6,
                  padding: '9px 11px',
                  fontFamily: "'Titillium Web',sans-serif",
                  fontSize: 13.5,
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
          </section>

          <section style={card}>
            <span id="profile-rating-label" style={label}>
              RATING
            </span>
            <div
              role="radiogroup"
              aria-labelledby="profile-rating-label"
              style={{ display: 'flex', gap: 6 }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={cand.rating === n}
                  aria-label={n + ' star' + (n === 1 ? '' : 's')}
                  className="fn-reset-button"
                  disabled={s.busy}
                  onClick={() => void setRating(cand.id, n)}
                  style={{
                    cursor: 'pointer',
                    fontSize: 26,
                    lineHeight: 1,
                    color: (cand.rating ?? 0) >= n ? '#D6A13A' : '#DDE6F3',
                  }}
                >
                  ★
                </button>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #DDE6F3', paddingTop: 14 }}>
              <Select
                label="Stage"
                options={STAGES}
                value={cand.stage}
                onChange={(e) => void setStage(cand.id, e.target.value as Stage)}
              />
            </div>
          </section>

          <section style={card}>
            <span style={label}>RECORD</span>
            {detail('SOURCE', cand.source)}
            {detail('APPLIED', cand.date)}
            {detail('ADDED BY', cand.addedBy)}
          </section>

          <section style={{ ...card, gap: 10 }}>
            <span style={label}>ACTIONS</span>
            <Button size="sm" disabled={s.busy} onClick={() => void panelNext(cand)}>
              Move to next stage
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={s.busy}
              onClick={() => void panelShortlist(cand.id)}
            >
              {cand.short ? 'Keep shortlisted' : 'Add to shortlist'}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={s.busy}
              onClick={() => void panelReject(cand.id)}
            >
              Reject
            </Button>
            {!archived && (
              <Button
                variant="ghost"
                size="sm"
                disabled={s.busy}
                onClick={() => {
                  if (
                    window.confirm(
                      'Move ' + cand.name + ' to the Archive? Nothing is deleted — you can restore them later.'
                    )
                  ) {
                    void archiveCandidate(cand.id).then(() => router.push('/app/archive'));
                  }
                }}
              >
                Archive candidate
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
