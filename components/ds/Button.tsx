'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/core/Button.jsx
 * `type="button"` and `aria-label` are additions: the source rendered a bare
 * <button> which defaults to type="submit" inside a form, and several call
 * sites use a glyph-only label. Neither changes appearance. */

import { CSSProperties, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  icon,
  onClick,
  type = 'button',
  ariaLabel,
  style,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  ariaLabel?: string;
  style?: CSSProperties;
}) {
  const base: CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    opacity: disabled ? 0.5 : 1,
    transition: 'background-color .12s ease',
  };
  const sizes: Record<ButtonSize, CSSProperties> = {
    sm: { padding: '8px 14px', fontSize: 13 },
    md: { padding: '12px 20px', fontSize: 14 },
    lg: { padding: '14px 28px', fontSize: 16 },
  };
  const variants: Record<ButtonVariant, CSSProperties> = {
    primary: { background: 'var(--sapphire)', color: 'var(--ivory)' },
    secondary: {
      background: 'transparent',
      color: 'var(--midnight)',
      border: '2px solid var(--midnight)',
    },
    ghost: { background: 'transparent', color: 'var(--sapphire)' },
    danger: { background: 'var(--danger)', color: 'var(--ivory)' },
  };
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
