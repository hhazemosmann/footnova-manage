'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/forms/Select.jsx
 * `width:100%` added on the control for the same reason as Input. */

import { ChangeEvent, ReactNode } from 'react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
}: {
  label?: ReactNode;
  options?: readonly string[];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--text-on-light-muted)',
      }}
    >
      {label}
      <select
        value={value}
        onChange={onChange}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle-on-light)',
          color: 'var(--text-on-light)',
          background: 'var(--white)',
          width: '100%',
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
