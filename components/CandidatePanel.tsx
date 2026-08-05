'use client';

/* Candidate detail drawer — ported verbatim from the source's
 * `<sc-if value="{{ panel }}">` block. It sits in the shell layout rather
 * than in a view page because the source rendered it as a sibling of <main>
 * and it opens from two different views (job detail rows and shortlist rows).
 *
 * The only layout departure is `width: min(440px, 100%)` in place of a flat
 * 440px, so it does not overflow a narrow viewport. */

import { useEffect, useRef } from 'react';
import { STAGES } from '@/lib/demo-data';
import {
  addNote,
  allCands,
  avatar,
  closePanel,
  initials,
  mutate,
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

  if (!cand) return null;

  /* Source: notes fall back to a single synthetic entry when empty. */
  const notes = cand.notes.length
    ? cand.notes
    : [{ who: 'System', when: 'on apply', text: 'Added manually by the recruiting team.' }];

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
            {/* Source: href="#" — a stub link in the design. */}
            <a href="#" style={{ color: '#A6C5D7' }}>
              LinkedIn profile ↗
            </a>
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
            >
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #A6C5D7',
                  borderRadius: 4,
                  height: 170,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 13 }}
                >
                  {cand.name} — CV.pdf
                </span>
                {CV_LINES.map((w, i) => (
                  <span
                    key={i}
                    style={{
                      height: 7,
                      borderRadius: 2,
                      background: '#DDE6F3',
                      width: w,
                      flex: 'none',
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: '#2C3A5E', flex: 1 }}>
                  Drop a new file here to replace
                </span>
                <Button variant="secondary" size="sm">
                  Upload CV
                </Button>
              </div>
            </div>
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
                    onClick={() => mutate(cand.id, { rating: n })}
                    style={{
                      cursor: 'pointer',
                      fontSize: 22,
                      lineHeight: 1,
                      color: cand.rating >= n ? '#D6A13A' : '#DDE6F3',
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
                onChange={(e) => mutate(cand.id, { stage: e.target.value as typeof cand.stage })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={sectionLabel}>NOTES</span>
            {notes.map((n, i) => (
              <div
                key={i}
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
                  <span>{n.when}</span>
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
              <Button size="sm" onClick={() => addNote(cand)}>
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
          <Button size="sm" onClick={() => panelNext(cand)}>
            Move to next stage
          </Button>
          <Button variant="secondary" size="sm" onClick={() => panelShortlist(cand.id)}>
            Shortlist
          </Button>
          <Button variant="danger" size="sm" onClick={() => panelReject(cand.id)}>
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
