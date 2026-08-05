'use client';

/* Candidate detail drawer — ported verbatim from the source's
 * `<sc-if value="{{ panel }}">` block. It sits in the shell layout rather
 * than in a view page because the source rendered it as a sibling of <main>
 * and it opens from two different views (job detail rows and shortlist rows).
 *
 * The only layout departure is `width: min(440px, 100%)` in place of a flat
 * 440px, so it does not overflow a narrow viewport. */

import { useEffect, useRef, useState } from 'react';
import { CV_ACCEPT, CV_MAX_BYTES, STAGES, Stage } from '@/lib/types';
import { formatFileSize } from '@/lib/format';
import {
  addNote,
  archiveCandidate,
  deleteNote,
  setLinkedinUrl,
  setRating,
  setStage,
  signedCvUrl,
  uploadCv,
  allCands,
  avatar,
  closePanel,
  initials,
  panelNext,
  panelReject,
  panelShortlist,
  setNoteDraft,
} from '@/lib/store';
import { useAppState } from '@/lib/use-store';
import { Button, Select } from '@/components/ds';

const CV_LINES = ['96%', '88%', '72%', '92%', '64%', '84%', '56%', '78%'];

const mono = "'IBM Plex Mono',monospace";
const sectionLabel: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '10.5px',
  letterSpacing: '0.12em',
  color: '#2C3A5E',
};

export default function CandidatePanel() {
  const s = useAppState();
  const cand = s.candId ? allCands(s).find((c) => c.id === s.candId) : null;
  const drawerRef = useRef<HTMLDivElement>(null);

  /* Escape closes the drawer — the source offered only the scrim and the ×. */
  useEffect(() => {
    if (!cand) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [cand]);

  useEffect(() => {
    if (cand) drawerRef.current?.focus();
  }, [cand]);

  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [cvError, setCvError] = useState('');
  const [linkedinDraft, setLinkedinDraft] = useState('');

  const isPdf = cand?.cv?.mimeType === 'application/pdf';

  /* Keep the LinkedIn draft in step with whichever candidate is open. */
  useEffect(() => {
    setLinkedinDraft(cand?.linkedinUrl ?? '');
    setCvError('');
  }, [cand?.id, cand?.linkedinUrl]);

  /* Private bucket: mint a short-lived signed URL whenever the open
   * candidate has a CV. It expires quickly and is never persisted. */
  useEffect(() => {
    let active = true;
    setCvUrl(null);
    const path = cand?.cv?.path;
    if (!path) return;
    void signedCvUrl(path, 120).then((url) => {
      if (active) setCvUrl(url);
    });
    return () => {
      active = false;
    };
  }, [cand?.cv?.path]);

  /* The bucket enforces type and size as well; this is the friendly first
   * pass so a bad file never leaves the browser. */
  async function handleFile(file: File | null) {
    setCvError('');
    if (!file || !cand) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setCvError('Only PDF and DOCX files are accepted.');
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setCvError('That file is ' + formatFileSize(file.size) + ' - the limit is 10 MB.');
      return;
    }
    await uploadCv(cand.id, file);
  }

  if (!cand) return null;

  /* Source: notes fall back to a single synthetic entry when empty. */
  const notes = cand.notes.length
    ? cand.notes
    : [
        {
          id: 'synthetic',
          who: 'System',
          when: 'on apply',
          text: 'Added manually by the recruiting team.',
          createdBy: null,
        },
      ];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(16,27,58,0.35)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 45,
      }}
    >
      <button
        type="button"
        aria-label="Close candidate panel"
        className="fn-reset-button"
        onClick={closePanel}
        style={{ flex: 1, cursor: 'default' }}
      />
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={cand.name}
        tabIndex={-1}
        style={{
          width: 'min(440px, 100%)',
          flex: 'none',
          background: '#FFFFFF',
          height: '100%',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="fn-on-dark"
          style={{
            background: '#101B3A',
            color: '#EFEDDA',
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <span
              aria-hidden="true"
              style={{
                flex: 'none',
                width: 46,
                height: 46,
                borderRadius: '50%',
                background: avatar(cand.id),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {initials(cand.name)}
            </span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span
                style={{
                  fontFamily: 'Archivo,sans-serif',
                  fontWeight: 800,
                  fontSize: 20,
                  letterSpacing: '-0.01em',
                }}
              >
                {cand.name}
              </span>
              <span style={{ fontSize: '12.5px', color: '#DDE6F3' }}>
                Applied to {cand.jobTitle}
              </span>
            </div>
            <button
              type="button"
              className="fn-reset-button"
              aria-label="Close candidate panel"
              onClick={closePanel}
              style={{ cursor: 'pointer', fontSize: 20, color: '#A6C5D7' }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              fontSize: '12.5px',
              color: '#DDE6F3',
            }}
          >
            <span>{cand.email}</span>
            <span>{cand.phone}</span>
            {/* The design had href="#" with nowhere to enter a URL. Real
                link now, editable below; nothing is fetched from it. */}
            {cand.linkedinUrl ? (
              <a
                href={cand.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#A6C5D7' }}
              >
                LinkedIn profile ↗
              </a>
            ) : (
              <span style={{ color: '#A6C5D7', opacity: 0.7 }}>No LinkedIn URL</span>
            )}
          </div>
        </div>

        <div
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={sectionLabel}>CV / RESUME</span>
            <div
              style={{
                border: '1px dashed #A6C5D7',
                borderRadius: 8,
                background: '#EFEDDA',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void handleFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              {/* The design drew a fake document from eight grey bars. There is
                  a real file now: PDFs preview inline through a short-lived
                  signed URL, DOCX gets an open link since browsers cannot
                  render it. The skeleton bars remain as the empty state. */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #A6C5D7',
                  borderRadius: 4,
                  height: 170,
                  padding: cand.cv && isPdf ? 0 : 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  overflow: 'hidden',
                }}
              >
                {cand.cv ? (
                  isPdf && cvUrl ? (
                    <object
                      data={cvUrl}
                      type="application/pdf"
                      aria-label={cand.name + ' CV preview'}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <p style={{ padding: 14, fontSize: 12.5 }}>Preview unavailable.</p>
                    </object>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        justifyContent: 'center',
                        height: '100%',
                      }}
                    >
                      <span
                        style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 13 }}
                      >
                        {cand.cv.fileName}
                      </span>
                      <span style={{ fontSize: 12, color: '#2C3A5E' }}>
                        {formatFileSize(cand.cv.sizeBytes)} · {isPdf ? 'PDF' : 'Word document'}
                      </span>
                      <div>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!cvUrl}
                          onClick={() => {
                            if (cvUrl) window.open(cvUrl, '_blank', 'noopener,noreferrer');
                          }}
                        >
                          {cvUrl ? 'Open CV' : 'Preparing...'}
                        </Button>
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <span
                      style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 13 }}
                    >
                      No CV uploaded
                    </span>
                    {CV_LINES.map((w, k) => (
                      <span
                        key={k}
                        style={{
                          height: 7,
                          borderRadius: 2,
                          background: '#DDE6F3',
                          width: w,
                          flex: 'none',
                        }}
                      />
                    ))}
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: '#2C3A5E', flex: 1, minWidth: 140 }}>
                  {cand.cv ? 'Drop a new file here to replace' : 'Drop a CV here or browse'}
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
                    {s.busy ? 'Uploading...' : 'Upload CV'}
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
            </div>
          </div>

          {/* LinkedIn URL - editable here, since the design showed a link but
              gave no way to set one. Pasted by hand; nothing is fetched. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="panel-linkedin" style={sectionLabel}>
              LINKEDIN URL
            </label>
            <input
              id="panel-linkedin"
              type="url"
              placeholder="https://www.linkedin.com/in/..."
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
                padding: '10px 12px',
                fontFamily: "'Titillium Web',sans-serif",
                fontSize: 14,
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span id="panel-rating-label" style={sectionLabel}>
                RATING
              </span>
              {/* Source: five <span onClick> stars. Rendered as a radio group
                  so the rating is keyboard-settable; glyphs and colors are
                  unchanged. */}
              <div
                role="radiogroup"
                aria-labelledby="panel-rating-label"
                style={{ display: 'flex', gap: 4 }}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={cand.rating === n}
                    aria-label={n + ' star' + (n === 1 ? '' : 's')}
                    className="fn-reset-button"
                    onClick={() => void setRating(cand.id, n)}
                    style={{
                      cursor: 'pointer',
                      fontSize: 22,
                      lineHeight: 1,
                      color: (cand.rating ?? 0) >= n ? '#D6A13A' : '#DDE6F3',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={sectionLabel}>STAGE</span>
              <Select
                label={<span className="fn-visually-hidden">Stage</span>}
                options={STAGES}
                value={cand.stage}
                onChange={(e) => void setStage(cand.id, e.target.value as Stage)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={sectionLabel}>NOTES</span>
            {notes.map((n) => (
              <div
                key={n.id}
                style={{
                  background: '#DDE6F3',
                  borderRadius: 6,
                  padding: '11px 13px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11.5px',
                    color: '#2C3A5E',
                  }}
                >
                  <span style={{ fontWeight: 700, color: '#101B3A' }}>{n.who}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {n.when}
                    {n.id !== 'synthetic' && (
                      <button
                        type="button"
                        className="fn-reset-button"
                        aria-label={'Delete note by ' + n.who}
                        disabled={s.busy}
                        onClick={() => {
                          if (window.confirm('Delete this note? Notes are the one thing that is removed for good.')) {
                            void deleteNote(n.id);
                          }
                        }}
                        style={{ color: '#2C3A5E', opacity: 0.7, fontSize: 14, lineHeight: 1 }}
                      >
                        \u00d7
                      </button>
                    )}
                  </span>
                </div>
                <span style={{ fontSize: 13, lineHeight: 1.45 }}>{n.text}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <label className="fn-visually-hidden" htmlFor="panel-note">
                Add a note
              </label>
              <input
                id="panel-note"
                value={s.note}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note…"
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: '1px solid #A6C5D7',
                  borderRadius: 6,
                  padding: '10px 12px',
                  fontFamily: "'Titillium Web',sans-serif",
                  fontSize: 14,
                  outline: 'none',
                }}
              />
              <Button size="sm" disabled={s.busy} onClick={() => void addNote(cand)}>
                Post
              </Button>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 'auto',
            position: 'sticky',
            bottom: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #A6C5D7',
            padding: '14px 24px',
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <Button size="sm" disabled={s.busy} onClick={() => void panelNext(cand)}>
            Move to next stage
          </Button>
          <Button variant="secondary" size="sm" disabled={s.busy} onClick={() => void panelShortlist(cand.id)}>
            Shortlist
          </Button>
          <Button variant="danger" size="sm" disabled={s.busy} onClick={() => void panelReject(cand.id)}>
            Reject
          </Button>
          {/* Archive replaces deletion. The record, CV, notes and stage
              history are all kept and can be restored from the Archive tab. */}
          <Button
            variant="ghost"
            size="sm"
            disabled={s.busy}
            onClick={() => {
              if (
                window.confirm(
                  'Move ' + cand.name + ' to the Archive? Nothing is deleted \u2014 you can restore them later.'
                )
              ) {
                void archiveCandidate(cand.id);
              }
            }}
          >
            Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
