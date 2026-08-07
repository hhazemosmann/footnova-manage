'use client';

/* Extra labelled documents for a candidate — portfolio, cover letter, and so
 * on. Rebuilt from scratch after the first attempt blanked the page when a
 * file was chosen.
 *
 * Deliberate choices this time:
 *
 * - The whole thing is wrapped in a SectionBoundary by its parent, so a fault
 *   in here cannot take the profile down again.
 * - No signed URLs are minted on render. The previous version fetched one per
 *   document every time the list changed, on mount, in an effect chain that
 *   was hard to reason about. A link is now fetched only when you click it.
 * - Every async path is wrapped and reports its own error inline, so a failure
 *   is visible next to the thing that failed instead of vanishing.
 * - Picking a file only sets local state. Nothing else happens until you press
 *   Upload, so a focus change or a re-render mid-pick cannot start work. */

import { useRef, useState } from 'react';
import { addDocument, deleteDocument, signedCvUrl } from '@/lib/store';
import { useAppState } from '@/lib/use-store';
import { CandidateDocument, CV_ACCEPT, CV_MAX_BYTES } from '@/lib/types';
import { formatFileSize } from '@/lib/format';
import { Button } from '@/components/ds';

const mono = "'IBM Plex Mono',monospace";

const labelStyle: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '10.5px',
  letterSpacing: '0.12em',
  color: '#2C3A5E',
};

const textInput: React.CSSProperties = {
  border: '1px solid #A6C5D7',
  borderRadius: 6,
  padding: '9px 11px',
  fontFamily: "'Titillium Web',sans-serif",
  fontSize: 13.5,
  outline: 'none',
  width: '100%',
};

export default function CandidateDocuments({
  candidateId,
  documents,
}: {
  candidateId: string;
  documents: CandidateDocument[];
}) {
  const s = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');
  const [opening, setOpening] = useState<string | null>(null);

  /* Validation only — no uploads, no network, no navigation. */
  function chooseFile(picked: File | null) {
    setError('');
    if (!picked) {
      setFile(null);
      return;
    }
    const name = (picked.name || '').toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setFile(null);
      setError('Only PDF and DOCX files can be attached.');
      return;
    }
    if (picked.size > CV_MAX_BYTES) {
      setFile(null);
      setError('That file is ' + formatFileSize(picked.size) + '. The limit is 10 MB.');
      return;
    }
    setFile(picked);
    setLabel((current) =>
      current.trim() ? current : picked.name.replace(/\.[^.]+$/, '').slice(0, 60)
    );
  }

  async function upload() {
    if (!file) {
      setError('Choose a file first.');
      return;
    }
    const trimmed = label.trim().slice(0, 60);
    if (!trimmed) {
      setError('Give the document a name, for example "Portfolio".');
      return;
    }
    setError('');
    try {
      const result = await addDocument(candidateId, trimmed, file);
      if (result === null) {
        setError('Upload failed. Please try again.');
        return;
      }
      setFile(null);
      setLabel('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  /* Signed URLs are short-lived, so one is fetched at the moment you ask for
   * it. The tab is opened first and pointed afterwards, because a popup
   * blocker would otherwise stop a tab opened inside an await. */
  async function open(doc: CandidateDocument) {
    setError('');
    setOpening(doc.id);
    const tab = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const url = await signedCvUrl(doc.path, 300);
      if (!url) {
        tab?.close();
        setError('Could not produce a link for "' + doc.label + '".');
        return;
      }
      if (tab) tab.location.href = url;
      else window.location.href = url; /* popup blocked — fall back in place */
    } catch (e) {
      tab?.close();
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOpening(null);
    }
  }

  async function remove(doc: CandidateDocument) {
    if (!window.confirm('Remove "' + doc.label + '"? The file is deleted for good.')) return;
    setError('');
    try {
      const result = await deleteDocument({ id: doc.id, path: doc.path });
      if (result === null) setError('Could not remove that document. Please try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid #A6C5D7',
        borderRadius: 8,
        boxShadow: 'var(--shadow-sm)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span style={labelStyle}>DOCUMENTS</span>
        <span style={{ fontSize: 12, color: '#2C3A5E' }}>
          Anything beyond the CV — portfolio, cover letter, certificates
        </span>
      </div>

      {documents.length === 0 ? (
        <p style={{ fontSize: 13.5, color: '#2C3A5E', margin: 0 }}>
          No extra documents attached.
        </p>
      ) : (
        documents.map((d) => (
          <div
            key={d.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              background: '#F7F9FC',
              border: '1px solid #DDE6F3',
              borderRadius: 6,
              padding: '10px 12px',
            }}
          >
            <div style={{ flex: 1, minWidth: 150, display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'Archivo,sans-serif', fontWeight: 700, fontSize: 14 }}>
                {d.label}
              </span>
              <span style={{ fontSize: 11.5, color: '#2C3A5E', wordBreak: 'break-word' }}>
                {d.fileName} · {formatFileSize(d.sizeBytes)} · added by {d.addedBy}
              </span>
            </div>
            <button
              type="button"
              className="fn-reset-button"
              disabled={opening === d.id}
              onClick={() => void open(d)}
              style={{ fontSize: 12.5, fontWeight: 600, color: '#0F52BA' }}
            >
              {opening === d.id ? 'Opening…' : 'Open in new tab ↗'}
            </button>
            <button
              type="button"
              className="fn-reset-button"
              aria-label={'Remove ' + d.label}
              disabled={s.busy}
              onClick={() => void remove(d)}
              style={{ fontSize: 12.5, fontWeight: 600, color: '#C1443D' }}
            >
              Remove
            </button>
          </div>
        ))
      )}

      {/* ---------------- add a document ---------------- */}
      <div
        style={{
          borderTop: '1px solid #DDE6F3',
          paddingTop: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div
            style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <label htmlFor="document-label" style={labelStyle}>
              NAME
            </label>
            <input
              id="document-label"
              placeholder="Portfolio"
              maxLength={60}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              style={textInput}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={labelStyle}>FILE</span>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 13,
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                color: 'var(--midnight)',
                border: '2px solid var(--midnight)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {file ? 'Change file' : 'Choose file'}
            </button>
          </div>

          <Button size="sm" disabled={s.busy || !file} onClick={() => void upload()}>
            {s.busy ? 'Uploading…' : 'Upload'}
          </Button>
        </div>

        {/* Kept out of the layout entirely; the button above drives it. */}
        <input
          ref={fileRef}
          type="file"
          accept={CV_ACCEPT}
          className="fn-visually-hidden"
          onChange={(e) => chooseFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
        />

        <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>
          {file
            ? 'Ready to upload: ' + file.name + ' · ' + formatFileSize(file.size)
            : 'PDF or DOCX, up to 10 MB'}
        </span>

        {error && (
          <span role="alert" style={{ fontSize: 12, color: '#C1443D', fontWeight: 600 }}>
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
