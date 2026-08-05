'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/forms/Radio.jsx
 * Exported by the source design system but never used by the page. Kept. */

import { ChangeEvent, ReactNode } from 'react';

export default function Radio({
  label,
  name,
  checked,
  onChange,
}: {
  label?: ReactNode;
  name?: string;
  checked?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--text-on-light)',
        cursor: 'pointer',
      }}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        style={{ width: 18, height: 18, accentColor: 'var(--sapphire)' }}
      />
      {label}
    </label>
  );
}
