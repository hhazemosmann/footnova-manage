'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/core/IconButton.jsx
 * Exported by the source design system but never used by the page. Kept. */

import { CSSProperties, ReactNode } from 'react';

export default function IconButton({
  icon,
  size = 'md',
  variant = 'ghost',
  ariaLabel,
  onClick,
}: {
  icon?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled' | 'outline';
  ariaLabel?: string;
  onClick?: () => void;
}) {
  const dims = { sm: 32, md: 40, lg: 48 }[size];
  const variants: Record<string, CSSProperties> = {
    ghost: { background: 'transparent', color: 'var(--midnight)' },
    filled: { background: 'var(--sapphire)', color: 'var(--ivory)' },
    outline: {
      background: 'transparent',
      color: 'var(--midnight)',
      border: '1px solid var(--powder-blue)',
    },
  };
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: dims,
        height: dims,
        borderRadius: 'var(--radius-md)',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        ...variants[variant],
      }}
    >
      {icon}
    </button>
  );
}
