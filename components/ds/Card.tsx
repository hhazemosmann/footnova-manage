'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/core/Card.jsx
 * Exported by the source design system but never used by the page. Kept. */

import { CSSProperties, ReactNode } from 'react';

export default function Card({
  surface = 'light',
  padded = true,
  children,
}: {
  surface?: 'light' | 'dark' | 'tint';
  padded?: boolean;
  children?: ReactNode;
}) {
  const surfaces: Record<string, CSSProperties> = {
    light: { background: 'var(--white)', color: 'var(--text-on-light)' },
    dark: { background: 'var(--surface-card-on-dark)', color: 'var(--text-on-dark)' },
    tint: { background: 'var(--ice-blue)', color: 'var(--text-on-light)' },
  };
  return (
    <div
      style={{
        ...surfaces[surface],
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle-on-light)',
        padding: padded ? '20px' : 0,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {children}
    </div>
  );
}
