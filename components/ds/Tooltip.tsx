'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/feedback/Tooltip.jsx
 * Exported by the source design system but never used by the page. Kept.
 * Focus/blur mirror the source's mouse handlers so it is not hover-only. */

import { ReactNode, useState } from 'react';

export default function Tooltip({
  label,
  children,
}: {
  label?: ReactNode;
  children?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--midnight)',
            color: 'var(--ivory)',
            fontSize: 12,
            fontFamily: 'var(--font-body)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            whiteSpace: 'nowrap',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
}
