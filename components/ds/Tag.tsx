'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/core/Tag.jsx
 * Exported by the source design system but never used by the page. Kept.
 * The remove affordance was a <span onClick>; it is a <button> here so it is
 * keyboard-reachable. Styling is unchanged. */

import { ReactNode } from 'react';

export default function Tag({
  children,
  onRemove,
}: {
  children?: ReactNode;
  onRemove?: () => void;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--ice-blue)',
        color: 'var(--midnight)',
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 13,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          className="fn-reset-button"
          aria-label="Remove"
          onClick={onRemove}
          style={{ cursor: 'pointer', opacity: 0.6 }}
        >
          ×
        </button>
      )}
    </span>
  );
}
