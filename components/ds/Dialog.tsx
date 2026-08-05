'use client';

/* Ported from FootNovaDesignSystem_0fe511 — components/feedback/Dialog.jsx
 * Visuals are verbatim. Added, per the port's accessibility baseline (the
 * source dialog was a plain div with a <span onClick> closer): role/aria-modal,
 * a labelled heading, Escape-to-dismiss, backdrop click, initial focus and a
 * focus trap. `maxWidth`/`maxHeight` are added so the fixed-width content
 * inside stays on screen at 320px. */

import { ReactNode, useEffect, useId, useRef } from 'react';

export default function Dialog({
  open = true,
  title,
  children,
  onClose,
}: {
  open?: boolean;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
}) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const focusable = node?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const items = node.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(16,27,58,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 50,
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          background: 'var(--white)',
          color: 'var(--text-on-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 24,
          minWidth: 320,
          maxWidth: '100%',
          maxHeight: '100%',
          overflowY: 'auto',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3
            id={titleId}
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 20,
              margin: 0,
              color: 'var(--midnight)',
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            className="fn-reset-button"
            aria-label={'Close ' + (title ?? 'dialog')}
            onClick={onClose}
            style={{ cursor: 'pointer', color: 'var(--midnight-70)' }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
