'use client';

/* A blast wall around one section of a page.
 *
 * Added after a fault in the documents panel took the entire candidate
 * profile down to a blank screen with no explanation. Whatever goes wrong
 * inside a boundary now stays inside it: the rest of the page keeps working,
 * and the failure is shown rather than swallowed.
 *
 * A class component because error boundaries have no hook equivalent. */

import { Component, ReactNode } from 'react';

interface Props {
  title: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class SectionBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    /* Keep it in the console so the details survive for a bug report. */
    console.error('[' + this.props.title + '] section failed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section
        role="alert"
        style={{
          background: '#FFFFFF',
          border: '1px solid #C1443D',
          borderLeft: '4px solid #C1443D',
          borderRadius: 8,
          boxShadow: 'var(--shadow-sm)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '10.5px',
            letterSpacing: '0.12em',
            color: '#C1443D',
          }}
        >
          {this.props.title.toUpperCase()} — SOMETHING WENT WRONG
        </span>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
          This section failed to load. The rest of the page is unaffected, and nothing has been
          lost. Reloading usually clears it.
        </p>
        <code
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11.5,
            background: '#EFEDDA',
            borderRadius: 4,
            padding: '8px 10px',
            wordBreak: 'break-word',
          }}
        >
          {this.state.error.message || String(this.state.error)}
        </code>
        <div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: 13,
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              color: 'var(--midnight)',
              border: '2px solid var(--midnight)',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </section>
    );
  }
}
