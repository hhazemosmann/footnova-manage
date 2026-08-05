'use client';

/* "Post New Job" dialog — ported verbatim from the source's
 * `<sc-if value="{{ jobModal }}">` block. Lives in the shell layout because
 * its trigger is the topbar (chrome), same as the source.
 *
 * `width:440px` becomes `min(440px, 100%)` so it fits a narrow viewport. */

import { useRouter } from 'next/navigation';
import { closeModals, setFormField, submitJob } from '@/lib/store';
import { useAppState } from '@/lib/use-store';
import { Button, Dialog, Input, Select } from '@/components/ds';

const SOURCE_OPTIONS = [
  'Manual entry',
  'Referral',
  'Direct application',
  'Agency',
  'Scouting network',
];
const STATUS_OPTIONS = ['Open', 'Closed'];

export default function JobModal() {
  const s = useAppState();
  const router = useRouter();

  if (s.modal !== 'job') return null;

  /* Source set `screen:'job'` + the new jobId; that becomes a route push. */
  function onSubmit() {
    const newId = submitJob();
    if (newId !== null) router.push('/app/jobs/' + newId);
  }

  return (
    <Dialog title="Post New Job" onClose={closeModals}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          width: 'min(440px, 100%)',
        }}
      >
        <Input
          label="Job title"
          placeholder="e.g. Academy Goalkeeping Coach"
          value={s.form.title ?? ''}
          onChange={(e) => setFormField('title', e.target.value)}
        />

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: '#2C3A5E',
          }}
        >
          Description
          <textarea
            placeholder="Role summary, requirements, contract length…"
            style={{
              fontFamily: "'Titillium Web',sans-serif",
              fontSize: 15,
              padding: '10px 12px',
              border: '1px solid #A6C5D7',
              borderRadius: 6,
              minHeight: 88,
              outline: 'none',
              resize: 'vertical',
              width: '100%',
            }}
          />
        </label>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))',
            gap: 12,
          }}
        >
          <Input
            label="Location"
            placeholder="Cairo, EG"
            value={s.form.location ?? ''}
            onChange={(e) => setFormField('location', e.target.value)}
          />
          <Select
            label="Source"
            options={SOURCE_OPTIONS}
            value={s.form.source}
            onChange={(e) => setFormField('source', e.target.value)}
          />
        </div>

        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={s.form.status}
          onChange={(e) => setFormField('status', e.target.value)}
        />

        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 6 }}
        >
          <Button variant="secondary" size="sm" onClick={closeModals}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSubmit}>
            Post Job
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
