'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/forms/Input.jsx
 * The wrapping <label> already links the control programmatically. `width:100%`
 * is added on the input so it fills the source's 100%-wide `hint-size` slots
 * at narrow viewports instead of overflowing. */

import { ChangeEvent, ReactNode } from 'react';

export default function Input({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  readOnly,
}: {
  label?: ReactNode;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  error?: string;
  readOnly?: boolean;
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
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        readOnly={readOnly}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 16,
          fontWeight: 400,
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-subtle-on-light)'}`,
          color: 'var(--text-on-light)',
          outline: 'none',
          width: '100%',
        }}
      />
      {error && <span style={{ color: 'var(--danger)', fontSize: 12 }}>{error}</span>}
    </label>
  );
}
