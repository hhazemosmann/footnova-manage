'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/core/Badge.jsx */

import { CSSProperties, ReactNode } from 'react';

export type BadgeTone = 'sapphire' | 'success' | 'warning' | 'danger' | 'neutral';

export default function Badge({
  tone = 'sapphire',
  children,
}: {
  tone?: BadgeTone | string;
  children?: ReactNode;
}) {
  const tones: Record<string, CSSProperties> = {
    sapphire: { background: 'var(--sapphire)', color: 'var(--ivory)' },
    success: { background: 'var(--success)', color: 'var(--ivory)' },
    warning: { background: 'var(--warning)', color: 'var(--midnight)' },
    danger: { background: 'var(--danger)', color: 'var(--ivory)' },
    neutral: { background: 'var(--powder-blue)', color: 'var(--midnight)' },
  };
  return (
    <span
      style={{
        ...tones[tone],
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}
