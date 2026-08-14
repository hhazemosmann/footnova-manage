'use client';

/* Shared furniture for the finance screens, so all four look like one system
 * rather than four pages that happen to sit together.
 *
 * The house rule for wording lives here too: every accounting term is
 * printed with a short plain-English gloss in brackets right after it. The
 * person using this has the numbers but not the vocabulary, and a term you
 * have to go and look up is a term that does not get used. */

import { ReactNode } from 'react';

const mono = "'IBM Plex Mono',monospace";

export const labelStyle: React.CSSProperties = {
  fontFamily: mono,
  fontSize: '10.5px',
  letterSpacing: '0.12em',
  color: '#2C3A5E',
};

export const cardStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid #A6C5D7',
  borderRadius: 8,
  boxShadow: 'var(--shadow-sm)',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
};

export const inputStyle: React.CSSProperties = {
  border: '1px solid #A6C5D7',
  borderRadius: 6,
  padding: '9px 11px',
  fontFamily: "'Titillium Web',sans-serif",
  fontSize: 13.5,
  outline: 'none',
  width: '100%',
  background: '#FFFFFF',
  color: '#101B3A',
};

/* "Gross profit (what the events made before running costs)" */
export function Term({ term, help }: { term: string; help: string }) {
  return (
    <>
      {term} <span style={{ fontWeight: 400, color: '#2C3A5E' }}>({help})</span>
    </>
  );
}

export function PageHead({ title, blurb, action }: { title: string; blurb: string; action?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'Archivo,sans-serif',
            fontWeight: 800,
            fontSize: 30,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {title}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: '#2C3A5E' }}>{blurb}</p>
      </div>
      {action}
    </div>
  );
}

/* One headline figure: the term, the number, and the gloss underneath. */
export function StatCard({
  term,
  help,
  value,
  tone = 'plain',
  footnote,
}: {
  term: string;
  help: string;
  value: string;
  tone?: 'plain' | 'good' | 'bad' | 'warn';
  footnote?: string;
}) {
  const color =
    tone === 'good' ? '#2E8B67' : tone === 'bad' ? '#C1443D' : tone === 'warn' ? '#D6A13A' : '#101B3A';
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #A6C5D7',
        borderRadius: 8,
        boxShadow: 'var(--shadow-sm)',
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <span style={{ ...labelStyle, textTransform: 'uppercase' }}>{term}</span>
      <span
        style={{
          fontFamily: 'Archivo,sans-serif',
          fontWeight: 800,
          fontSize: 25,
          letterSpacing: '-0.02em',
          color,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
      <span style={{ fontSize: 12, color: '#2C3A5E', lineHeight: 1.4 }}>{help}</span>
      {footnote && (
        <span style={{ fontSize: 11.5, color: '#2C3A5E', opacity: 0.85 }}>{footnote}</span>
      )}
    </div>
  );
}

export function Field({
  label,
  help,
  htmlFor,
  children,
  wide,
}: {
  label: string;
  help?: string;
  htmlFor?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
        gridColumn: wide ? '1 / -1' : undefined,
      }}
    >
      <label htmlFor={htmlFor} style={labelStyle}>
        {label.toUpperCase()}
        {help && <span style={{ letterSpacing: 0, textTransform: 'none' }}> ({help})</span>}
      </label>
      {children}
    </div>
  );
}

/* A right-aligned money figure that colours itself when it is a loss. */
export function Money({ text, negative }: { text: string; negative?: boolean }) {
  return (
    <span
      style={{
        fontFamily: mono,
        fontSize: 13,
        textAlign: 'right',
        color: negative ? '#C1443D' : '#101B3A',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div style={{ padding: 44, textAlign: 'center', fontSize: 14, color: '#2C3A5E' }}>
      {children}
    </div>
  );
}
