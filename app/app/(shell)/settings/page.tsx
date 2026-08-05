'use client';

/* Settings — source view `screen:'settings'` / `<sc-if value="{{ isSettings }}">`. */

import { toggleSetting } from '@/lib/store';
import { useAppState } from '@/lib/use-store';
import { Input, Select, Switch } from '@/components/ds';

const PIPELINE_OPTIONS = [
  'Applied → Screening → Interview → Offer → Hired',
  'Applied → Interview → Offer',
];

export default function SettingsPage() {
  const s = useAppState();

  /* Source: the `toggles` array. */
  const toggles = [
    {
      key: 'a' as const,
      label: 'Require email on new candidates',
      hint: 'Blocks saving a candidate without a contact email',
      on: s.toggles.a,
    },
    {
      key: 'b' as const,
      label: 'Email me on new shortlist adds',
      hint: 'Digest at 09:00 daily',
      on: s.toggles.b,
    },
    {
      key: 'c' as const,
      label: 'Require CV before interview stage',
      hint: 'Blocks stage change without an attached CV',
      on: s.toggles.c,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}>
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
          Settings
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#2C3A5E' }}>
          Sourcing, pipeline stages and notifications
        </p>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #A6C5D7',
          borderRadius: 8,
          boxShadow: 'var(--shadow-sm)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Source binds a literal value with no onChange — read-only in the
            design, and read-only here until the database lands. */}
        <Input label="Careers inbox" value="careers@footnova.com" readOnly onChange={() => {}} />
        <Select label="Default pipeline" options={PIPELINE_OPTIONS} />

        {toggles.map((t) => (
          <div
            key={t.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              paddingTop: 14,
              borderTop: '1px solid #DDE6F3',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</span>
              <span style={{ fontSize: 12, color: '#2C3A5E' }}>{t.hint}</span>
            </div>
            <Switch checked={t.on} ariaLabel={t.label} onChange={() => toggleSetting(t.key)} />
          </div>
        ))}
      </div>
    </div>
  );
}
