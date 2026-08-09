'use client';

/* Extra labelled documents for a candidate — portfolio, cover letter, and so
 * on. Wrapped in a SectionBoundary by its parent, so a fault in here cannot
 * take the profile page down.
 *
 * Design notes:
 *
 * - Choosing a file only sets local state. Nothing uploads until Upload is
 *   pressed, so a focus change or a re-render mid-pick cannot start work.
 * - "Open in new tab" is a real <a target="_blank">, the same thing the CV
 *   link on this page uses. Two earlier attempts went through window.open and
 *   both failed: passing `noopener` makes it return null by specification, and
 *   even without it a popup blocker stops any call that is not driven by a
 *   genuine mouse gesture. An anchor has none of those problems, and it also
 *   gives middle-click, ctrl-click and "open link in new tab" for free.
 *
 *   The cost is minting a signed URL per document up front rather than on
 *   click. There are only ever a handful, and the CV link already does exactly
 *   this, so the behaviour is consistent across the page.
 */

import { useEffect, useRef, useState } from 'react';
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

export default function CandidateDocuments({
  candidateId,
  documents,
}: {
  candidateId: string;
  documents: CandidateDocument[];
}) {
  const s = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [dragging, setDragging] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});

  /* One signed link per document, refreshed when the list changes. An hour
   * of validity, matching the CV link. */
  const documentKey = documents.map((d) => d.id).join('|');
  useEffect(() => {
    let active = true;
    if (!documents.length) {
      setUrls({});
      return;
    }
    void Promise.all(
      documents.map(async (d) => [d.id, await signedCvUrl(d.path, 3600)] as const)
    ).then((pairs) => {
      if (!active) return;
      const next: Record<string, string> = {};
      for (const [id, url] of pairs) if (url) next[id] = url;
      setUrls(next);
    });
    return () => {
      active = false;
    };
    /* documentKey stands in for the list; the objects are rebuilt each load. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentKey]);

  /* Clear the success line after a moment so it does not linger. */
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(''), 4000);
    return () => clearTimeout(t);
  }, [done]);

  function chooseFile(picked: File | null) {
    setError('');
    setDone('');
    if (!picked) {
      setFile(null);
      return;
    }
    const lower = (picked.name || '').toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.docx')) {
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
    /* Suggest a name, then put the cursor there so it can be corrected
     * immediately without hunting for the field. */
    setName((current) =>
      current.trim() ? current : picked.name.replace(/\.[^.]+$/, '').slice(0, 60)
    );
    setTimeout(() => nameRef.current?.focus(), 0);
  }

  function clearChoice() {
    setFile(null);
    setName('');
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function upload() {
    if (!file || s.busy) return;
    const trimmed = name.trim().slice(0, 60);
    if (!trimmed) {
      setError('Give the document a name, for example "Portfolio".');
      nameRef.current?.focus();
      return;
    }
    setError('');
    setDone('');
    try {
      const result = await addDocument(candidateId, trimmed, file);
      if (result === null) {
        setError(s.error || 'Upload failed. Please try again.');
        return;
      }
      setDone('"' + trimmed + '" attached.');
      clearChoice();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function remove(doc: CandidateDocument) {
    if (!window.confirm('Remove "' + doc.label + '"? The file is deleted for good.')) return;
    setError('');
    setBusyId(doc.id);
    try {
      const result = await deleteDocument({ id: doc.id, path: doc.path });
      if (result === null) setError('Could not remove that document. Please try again.');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
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
          No extra documents attached yet.
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
              opacity: busyId === d.id ? 0.6 : 1,
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
            {urls[d.id] ? (
              <a
                href={urls[d.id]}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12.5, fontWeight: 600, color: '#0F52BA' }}
              >
                Open in new tab ↗
              </a>
            ) : (
              <span style={{ fontSize: 12.5, color: '#2C3A5E' }}>Preparing link…</span>
            )}
            <button
              type="button"
              className="fn-reset-button"
              aria-label={'Remove ' + d.label}
              disabled={s.busy || busyId === d.id}
              onClick={() => void remove(d)}
              style={{ fontSize: 12.5, fontWeight: 600, color: '#C1443D' }}
            >
              Remove
            </button>
          </div>
        ))
      )}

      {/* ---------------- add a document ---------------- */}
      <div style={{ borderTop: '1px solid #DDE6F3', paddingTop: 14 }}>
        {!file ? (
          /* Step one: pick a file. Click anywhere, or drop one on it. */
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              chooseFile(e.dataTransfer.files?.[0] ?? null);
            }}
            style={{
              width: '100%',
              border: '1px dashed ' + (dragging ? '#0F52BA' : '#A6C5D7'),
              borderRadius: 8,
              background: dragging ? '#F2F6FC' : '#EFEDDA',
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              cursor: 'pointer',
              fontFamily: "'Titillium Web',sans-serif",
              color: '#101B3A',
              transition: 'background-color .12s ease, border-color .12s ease',
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>
              {dragging ? 'Drop it here' : 'Add a document'}
            </span>
            <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>
              Click to browse, or drag a file in · PDF or DOCX, up to 10 MB
            </span>
          </button>
        ) : (
          /* Step two: name it and upload. */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: '#F2F6FC',
                border: '1px solid #A6C5D7',
                borderRadius: 6,
                padding: '9px 12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ flex: 1, minWidth: 140, fontSize: 12.5, wordBreak: 'break-word' }}>
                <strong>{file.name}</strong> · {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                className="fn-reset-button"
                disabled={s.busy}
                onClick={clearChoice}
                style={{ fontSize: 12.5, fontWeight: 600, color: '#2C3A5E' }}
              >
                Choose a different file
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div
                style={{ flex: 1, minWidth: 170, display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <label htmlFor="document-label" style={labelStyle}>
                  NAME THIS DOCUMENT
                </label>
                <input
                  id="document-label"
                  ref={nameRef}
                  placeholder="Portfolio"
                  maxLength={60}
                  value={name}
                  disabled={s.busy}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void upload();
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
              <Button size="sm" disabled={s.busy || !name.trim()} onClick={() => void upload()}>
                {s.busy ? 'Uploading…' : 'Upload'}
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept={CV_ACCEPT}
          className="fn-visually-hidden"
          onChange={(e) =>
            chooseFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)
          }
        />

        {done && (
          <span
            role="status"
            style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#2E8B67', fontWeight: 600 }}
          >
            {done}
          </span>
        )}
        {error && (
          <span
            role="alert"
            style={{ display: 'block', marginTop: 10, fontSize: 12, color: '#C1443D', fontWeight: 600 }}
          >
            {error}
          </span>
        )}
      </div>
    </section>
  );
}
