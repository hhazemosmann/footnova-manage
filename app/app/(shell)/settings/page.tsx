'use client';

/* Settings — source view `screen:'settings'` / `<sc-if value="{{ isSettings }}">`.
 *
 * Now persisted to the single app_settings row. The three toggles are stored
 * but inert by explicit decision: nothing in this product sends email, and
 * the 09:00 digest does nothing. */

import { useEffect, useState } from 'react';
import { updateSettings } from '@/lib/store';
import { useAppState } from '@/lib/use-store';
import { Input, Select, Switch } from '@/components/ds';

const PIPELINE_OPTIONS = [
  'Applied → Screening → Interview → Offer → Hired',
  'Applied → Interview → Offer',
];

export default function SettingsPage() {
  const s = useAppState();
  const settings = s.settings;

  /* Local draft for the text field so typing does not fire a write per key. */
  const [inbox, setInbox] = useState('');
  useEffect(() => {
    if (settings) setInbox(settings.careersInboxEmail);
  }, [settings]);

  if (!settings) {
    return <p style={{ fontSize: 14, color: '#2C3A5E' }}>Settings unavailable.</p>;
  }

  /* Source: the `toggles` array. */
  const toggles = [
    {
      key: 'requireEmailOnNewCandidates' as const,
      label: 'Require email on new candidates',
      hint: 'Blocks saving a candidate without a contact email',
      on: settings.requireEmailOnNewCandidates,
    },
    {
      key: 'emailOnShortlistAdd' as const,
      label: 'Email me on new shortlist adds',
      hint: 'Digest at 09:00 daily',
      on: settings.emailOnShortlistAdd,
    },
    {
      key: 'requireCvBeforeInterview' as const,
      label: 'Require CV before interview stage',
      hint: 'Blocks stage change without an attached CV',
      on: settings.requireCvBeforeInterview,
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
        <Input
          label="Careers inbox"
          type="email"
          value={inbox}
          onChange={(e) => setInbox(e.target.value)}
          onBlur={() => {
            if (inbox !== settings.careersInboxEmail) {
              void updateSettings({ careersInboxEmail: inbox });
            }
          }}
        />
        <Select
          label="Default pipeline"
          options={PIPELINE_OPTIONS}
          value={settings.defaultPipeline}
          onChange={(e) => void updateSettings({ defaultPipeline: e.target.value })}
        />

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
            <Switch
              checked={t.on}
              ariaLabel={t.label}
              onChange={(next) => void updateSettings({ [t.key]: next })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
