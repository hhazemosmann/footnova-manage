'use client';

/* Ported from FootNovaDesignSystem_0fe511 — components/forms/Switch.jsx
 * Visuals verbatim (40×22 track, 18px knob, left 2→20, .15s transitions).
 * The source track was a <span onClick> inside a <label> with no control, so
 * it was mouse-only and announced nothing; it is a role="switch" <button>
 * here. Appearance is unchanged. */

import { ReactNode } from 'react';

export default function Switch({
  checked,
  onChange,
  label,
  ariaLabel,
}: {
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label?: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        color: 'var(--text-on-light)',
        cursor: 'pointer',
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        aria-label={ariaLabel}
        onClick={() => onChange && onChange(!checked)}
        style={{
          width: 40,
          height: 22,
          padding: 0,
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          background: checked ? 'var(--sapphire)' : 'var(--powder-blue)',
          position: 'relative',
          transition: 'background-color .15s ease',
          display: 'inline-block',
          cursor: 'pointer',
          flex: 'none',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--white)',
            transition: 'left .15s ease',
          }}
        />
      </button>
      {label}
    </span>
  );
}
