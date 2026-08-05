'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/feedback/Toast.jsx
 * Exported by the source design system but never used by the page. Kept. */

import { ReactNode } from 'react';

export default function Toast({
  tone = 'sapphire',
  children,
}: {
  tone?: 'sapphire' | 'success' | 'warning' | 'danger';
  children?: ReactNode;
}) {
  const tones: Record<string, string> = {
    sapphire: 'var(--sapphire)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
  };
  return (
    <div
      style={{
        background: 'var(--midnight)',
        color: 'var(--ivory)',
        borderLeft: `4px solid ${tones[tone]}`,
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        boxShadow: 'var(--shadow-md)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {children}
    </div>
  );
}
