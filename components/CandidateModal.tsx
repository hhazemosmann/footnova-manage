'use client';

/* "Add Candidate" dialog.
 *
 * Started as a verbatim port of the source's `<sc-if value="{{ candModal }}">`
 * block; since extended with a phone field, a location field, and "Fill from
 * CV", which reads a dropped PDF in the browser and prefills what it can find.
 *
 * Cross-view note: the dialog reads the *currently selected job* for its
 * "Adding to <job>" line, but it is chrome. The store keeps `jobId`, and
 * /app/jobs/[jobId] syncs it on mount, so the value is correct on a direct
 * load or refresh. Its only trigger lives on the job-detail view. */

import { useState } from 'react';
import { closeModals, currentJob, setFormField, submitCand } from '@/lib/store';
import { CV_ACCEPT, CV_MAX_BYTES, SOURCES, STAGES } from '@/lib/types';
import { formatFileSize } from '@/lib/format';
import { extractFromCv, ExtractedFields } from '@/lib/cv-extract';
import { useAppState } from '@/lib/use-store';
import { Button, Dialog, Input, Select } from '@/components/ds';

const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  linkedinUrl: 'LinkedIn',
  location: 'location',
};

export default function CandidateModal() {
  const s = useAppState();
  const [fileError, setFileError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState('');
  const [scanWarn, setScanWarn] = useState('');

  if (s.modal !== 'cand') return null;

  const job = currentJob(s);
  if (!job) return null;

  const cvFile = s.form.cvFile ?? null;

  /* The bucket enforces type and size too — this is the friendly first pass
     so a bad file never leaves the browser. */
  function pickFile(file: File | null): File | null {
    setFileError('');
    setScanNote('');
    setScanWarn('');
    if (!file) {
      setFormField('cvFile', null);
      return null;
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith('.pdf') && !name.endsWith('.docx')) {
      setFileError('Only PDF and DOCX files are accepted.');
      return null;
    }
    if (file.size > CV_MAX_BYTES) {
      setFileError('That file is ' + formatFileSize(file.size) + ' — the limit is 10 MB.');
      return null;
    }
    setFormField('cvFile', file);
    return file;
  }

  /* Read the PDF locally and prefill whatever it yields. Nothing is uploaded
     to do this, and nothing is overwritten that you have already typed. */
  async function scan(file: File) {
    setScanning(true);
    setScanNote('');
    setScanWarn('');
    try {
      const r = await extractFromCv(file);
      const map: [keyof ExtractedFields, keyof typeof s.form][] = [
        ['name', 'name'],
        ['email', 'email'],
        ['phone', 'phone'],
        ['linkedinUrl', 'linkedinUrl'],
        ['location', 'location'],
      ];
      for (const [from, to] of map) {
        const value = r[from];
        if (value && !s.form[to]) setFormField(to, value);
      }
      if (r.found.length === 0) {
        setScanWarn('Nothing recognisable found in that PDF — fill the fields in yourself.');
      } else {
        setScanNote('Filled in ' + r.found.map((k) => FIELD_LABELS[k]).join(', ') + '.');
        if (r.missing.length) {
          setScanWarn(
            'Could not find ' + r.missing.map((k) => FIELD_LABELS[k]).join(', ') + ' — add by hand.'
          );
        }
      }
    } catch (e) {
      setScanWarn(e instanceof Error ? e.message : 'That PDF could not be read.');
    } finally {
      setScanning(false);
    }
  }

  async function pickAndScan(file: File | null) {
    const ok = pickFile(file);
    if (ok) await scan(ok);
  }

  const twoCol: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
    gap: 12,
  };

  return (
    <Dialog title="Add Candidate" onClose={closeModals}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          width: 'min(620px, 100%)',
        }}
      >
        <div
          style={{
            background: '#DDE6F3',
            borderRadius: 6,
            padding: '10px 12px',
            fontSize: '12.5px',
            color: '#101B3A',
          }}
        >
          Adding to <strong>{job.title}</strong> · {job.location}
        </div>

        {s.error && (
          <p
            role="alert"
            style={{
              margin: 0,
              background: '#FFF0EF',
              border: '1px solid #C1443D',
              borderLeft: '4px solid #C1443D',
              borderRadius: 6,
              padding: '10px 12px',
              fontSize: 12.5,
              lineHeight: 1.45,
              color: '#101B3A',
            }}
          >
            {s.error}
          </p>
        )}

        {/* ---------- fill from CV ---------- */}
        <div
          style={{
            border: '1px dashed #0F52BA',
            borderRadius: 8,
            background: '#F2F6FC',
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void pickAndScan(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 190 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: '#101B3A' }}>
                Fill from CV
              </span>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#2C3A5E', lineHeight: 1.45 }}>
                Drop a PDF to read the name, email, phone, LinkedIn and location from it. The
                file is attached as the CV at the same time.
              </p>
            </div>
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
                  background: scanning ? 'transparent' : 'var(--sapphire)',
                  color: scanning ? 'var(--midnight)' : 'var(--ivory)',
                  border: scanning ? '2px solid var(--midnight)' : 'none',
                  cursor: scanning ? 'wait' : 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {scanning ? 'Reading…' : 'Choose PDF'}
              </span>
              <input
                type="file"
                accept="application/pdf"
                disabled={scanning}
                className="fn-visually-hidden"
                onChange={(e) => void pickAndScan(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {cvFile && (
            <span style={{ fontSize: 12, color: '#2C3A5E' }}>
              Attached: <strong>{cvFile.name}</strong> · {formatFileSize(cvFile.size)}
            </span>
          )}
          {scanNote && (
            <span role="status" style={{ fontSize: 12, color: '#2E8B67', fontWeight: 600 }}>
              {scanNote}
            </span>
          )}
          {scanWarn && (
            <span role="status" style={{ fontSize: 12, color: '#2C3A5E' }}>
              {scanWarn}
            </span>
          )}
          {fileError && (
            <span role="alert" style={{ fontSize: 12, color: '#C1443D', fontWeight: 600 }}>
              {fileError}
            </span>
          )}
        </div>

        {/* ---------- the fields ---------- */}
        <Input
          label="Full name"
          placeholder="e.g. Nour Abdelrahman"
          value={s.form.name ?? ''}
          onChange={(e) => setFormField('name', e.target.value)}
        />

        <div style={twoCol}>
          <Input
            label="Email"
            placeholder="name@email.com"
            value={s.form.email ?? ''}
            onChange={(e) => setFormField('email', e.target.value)}
          />
          <Input
            label="Phone"
            placeholder="+20 100 000 0000"
            value={s.form.phone ?? ''}
            onChange={(e) => setFormField('phone', e.target.value)}
          />
        </div>

        <div style={twoCol}>
          {/* LinkedIn URL — the design showed a LinkedIn link in the candidate
              drawer but had nowhere to enter one. Pasted by hand; nothing is
              scraped or fetched from it. */}
          <Input
            label="LinkedIn profile URL"
            placeholder="linkedin.com/in/…"
            type="url"
            value={s.form.linkedinUrl ?? ''}
            onChange={(e) => setFormField('linkedinUrl', e.target.value)}
          />
          <Input
            label="Location"
            placeholder="Cairo, EG"
            value={s.form.location ?? ''}
            onChange={(e) => setFormField('location', e.target.value)}
          />
        </div>

        <div style={twoCol}>
          <Select
            label="Source"
            options={SOURCES}
            value={s.form.source}
            onChange={(e) => setFormField('source', e.target.value)}
          />
          <Select
            label="Initial stage"
            options={STAGES}
            value={s.form.stage}
            onChange={(e) => setFormField('stage', e.target.value)}
          />
        </div>

        {/* ---------- CV attachment (also settable without scanning) ---------- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2C3A5E' }}>CV file</span>
          <label
            style={{
              border: '1px dashed #A6C5D7',
              borderRadius: 8,
              background: '#EFEDDA',
              padding: 18,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              cursor: 'pointer',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>
              {cvFile ? cvFile.name : 'Drop CV here or browse'}
            </span>
            <span style={{ fontSize: '11.5px', color: '#2C3A5E' }}>
              {cvFile ? formatFileSize(cvFile.size) : 'PDF or DOCX · max 10 MB'}
            </span>
            <input
              type="file"
              accept={CV_ACCEPT}
              className="fn-visually-hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <span style={{ fontSize: 11.5, color: '#2C3A5E' }}>
            Extra documents like a portfolio can be added from the candidate&rsquo;s profile once
            they are saved.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span id="form-rating-label" style={{ fontSize: 13, fontWeight: 600, color: '#2C3A5E' }}>
            Initial rating
          </span>
          {/* Source: five <span onClick> stars — a radio group here so it is
              keyboard-settable. Glyphs and colors unchanged. */}
          <div
            role="radiogroup"
            aria-labelledby="form-rating-label"
            style={{ display: 'flex', gap: 4 }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={(s.form.rating || 0) === n}
                aria-label={n + ' star' + (n === 1 ? '' : 's')}
                className="fn-reset-button"
                onClick={() => setFormField('rating', n)}
                style={{
                  cursor: 'pointer',
                  fontSize: 22,
                  lineHeight: 1,
                  color: (s.form.rating || 0) >= n ? '#D6A13A' : '#DDE6F3',
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}>
          <Button variant="secondary" size="sm" onClick={closeModals}>
            Cancel
          </Button>
          <Button size="sm" disabled={s.busy || scanning} onClick={() => void submitCand()}>
            {s.busy ? 'Saving…' : 'Add Candidate'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
