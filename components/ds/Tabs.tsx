'use client';

/* Ported verbatim from FootNovaDesignSystem_0fe511 — components/navigation/Tabs.jsx
 * Exported by the source design system but never used by the page. Kept.
 * The <div onClick> tabs are <button>s here so they are keyboard-operable. */

export default function Tabs({
  tabs = [],
  active,
  onChange,
}: {
  tabs?: string[];
  active?: string;
  onChange?: (t: string) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-subtle-on-light)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          role="tab"
          aria-selected={t === active}
          className="fn-reset-button"
          onClick={() => onChange && onChange(t)}
          style={{
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            color: t === active ? 'var(--sapphire)' : 'var(--midnight-70)',
            borderBottom: t === active ? '2px solid var(--sapphire)' : '2px solid transparent',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
