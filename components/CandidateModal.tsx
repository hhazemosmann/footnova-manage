'use client';

/* "Add Candidate" dialog — ported verbatim from the source's
 * `<sc-if value="{{ candModal }}">` block.
 *
 * Cross-view note: the dialog reads the *currently selected job* for its
 * "Adding to <job>" line, but it is chrome. The store keeps `jobId`, and
 * /app/jobs/[jobId] syncs it on mount, so the value is correct on a direct
 * load or refresh. Its only trigger lives on the job-detail view. */

import { closeModals, currentJob, setFormField, submitCand } from '@/lib/store';
import { STAGES } from '@/lib/demo-data';
import { useAppState } from '@/lib/use-store';
import { Button, Dialog, Input, Select } from '@/components/ds';

const SOURCE_OPTIONS = [
  'Manual entry',
  'Referral',
  'Direct application',
  'Agency',
  'Scouting network',
];

export default function CandidateModal() {
  const s = useAppState();

  if (s.modal !== 'cand') return null;

  const job = currentJob(s);

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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
            gap: 12,
          }}
        >
          <Select
            label="Source"
            options={SOURCE_OPTIONS}
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
          <div
            style={{
              border: '1px dashed #A6C5D7',
              borderRadius: 8,
              background: '#EFEDDA',
              padding: 22,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>Drop CV here or browse</span>
            <span style={{ fontSize: '11.5px', color: '#2C3A5E' }}>PDF or DOCX · max 10 MB</span>
          </div>
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
          <Button size="sm" onClick={submitCand}>
            Add Candidate
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
