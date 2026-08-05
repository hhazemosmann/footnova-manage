'use client';

/* "Add Candidate" dialog — ported verbatim from the source's
 * `<sc-if value="{{ candModal }}">` block.
 *
 * Cross-view note: the dialog reads the *currently selected job* for its
 * "Adding to <job>" line, but it is chrome. The store keeps `jobId`, and
 * /app/jobs/[jobId] syncs it on mount, so the value is correct on a direct
 * load or refresh. Its only trigger lives on the job-detail view. */

import { useState } from 'react';
import { closeModals, currentJob, setFormField, submitCand } from '@/lib/store';
import { CV_ACCEPT, CV_MAX_BYTES, SOURCES, STAGES } from '@/lib/types';
import { formatFileSize } from '@/lib/format';
import { useAppState } from '@/lib/use-store';
import { Button, Dialog, Input, Select } from '@/components/ds';

export default function CandidateModal() {
  const s = useAppState();
  const [fileError, setFileError] = useState('');

  if (s.modal !== 'cand') return null;

  const job = currentJob(s);
  if (!job) return null;

  const cvFile = s.form.cvFile ?? null;

  /* The bucket enforces type and size too — this is the friendly first pass
     so a bad file never leaves the browser. */
  function pickFile(file: File | null) {
    setFileError('');
    if (!file) {
      setFormField('cvFile', null);
      return;
    }
    const name = file.name.toLowerCase();
    const okType = name.endsWith('.pdf') || name.endsWith('.docx');
    if (!okType) {
      setFileError('Only PDF and DOCX files are accepted.');
      return;
    }
    if (file.size > CV_MAX_BYTES) {
      setFileError('That file is ' + formatFileSize(file.size) + ' — the limit is 10 MB.');
      return;
    }
    setFormField('cvFile', file);
  }

  return (
    <Dialog title="Add Candidate" onClose={closeModals}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          width: 'min(420px, 100%)',
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
        <Input
          label="Full name"
          placeholder="e.g. Nour Abdelrahman"
          value={s.form.name ?? ''}
          onChange={(e) => setFormField('name', e.target.value)}
        />
        <Input
          label="Email"
          placeholder="name@email.com"
          value={s.form.email ?? ''}
          onChange={(e) => setFormField('email', e.target.value)}
        />
        {/* LinkedIn URL — the design showed a LinkedIn link in the candidate
            drawer but had nowhere to enter one. Pasted by hand; nothing is
            scraped or fetched from it. */}
        <Input
          label="LinkedIn profile URL"
          placeholder="https://www.linkedin.com/in/…"
          type="url"
          value={s.form.linkedinUrl ?? ''}
          onChange={(e) => setFormField('linkedinUrl', e.target.value)}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
            gap: 12,
          }}
        >
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2C3A5E' }}>CV upload</span>
          <label
            style={{
              border: '1px dashed #A6C5D7',
              borderRadius: 8,
              background: '#EFEDDA',
              padding: 22,
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
          {fileError && (
            <span role="alert" style={{ fontSize: 12, color: '#C1443D', fontWeight: 600 }}>
              {fileError}
            </span>
          )}
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
          <Button size="sm" disabled={s.busy} onClick={() => void submitCand()}>
            {s.busy ? 'Saving…' : 'Add Candidate'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
