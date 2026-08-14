'use client';

/* The front door. Signing in lands here rather than in either half of the
 * product, because the two halves are genuinely separate jobs: hiring people,
 * and keeping the books. Picking one up front means neither has to carry the
 * other's navigation around.
 *
 * Built from the same tokens as everything else — midnight, ivory, sapphire,
 * Archivo for headings, IBM Plex Mono for the small caps labels. */

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import RequireSession from '@/components/RequireSession';
import { supabase } from '@/lib/supabase/client';

const mono = "'IBM Plex Mono',monospace";

const AREAS = [
  {
    key: 'recruiting',
    icon: '⚽',
    title: 'Recruiting',
    tagline: 'Jobs, applicants, CVs and shortlisting',
    lines: [
      'Post a job and add the people who apply',
      'Store CVs and documents against each person',
      'Move candidates through the hiring stages',
    ],
    href: '/app/overview',
  },
  {
    key: 'finance',
    icon: '₤',
    title: 'Finance',
    tagline: 'Money in, money out, and what each tournament made',
    lines: [
      'Record what you earn and what you spend',
      'See profit for the business as a whole',
      'Work out whether a tournament actually paid',
    ],
    href: '/app/finance/dashboard',
  },
];

export default function HubPage() {
  return (
    <RequireSession>
      <Hub />
    </RequireSession>
  );
}

function Hub() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#101B3A',
        color: '#EFEDDA',
        fontFamily: "'Titillium Web',system-ui,sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        gap: 34,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <Image
          src="/footnova-logo.png"
          alt="FootNova"
          width={54}
          height={54}
          style={{ width: 54, height: 54, objectFit: 'contain' }}
        />
        <h1
          style={{
            fontFamily: 'Archivo,system-ui,sans-serif',
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '-0.02em',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Where are you working today?
        </h1>
        <span
          style={{ fontFamily: mono, fontSize: '10.5px', letterSpacing: '0.16em', color: '#A6C5D7' }}
        >
          FOOTNOVA WORKSPACE
        </span>
      </div>

      <div className="fn-hub-grid">
        {AREAS.map((a) => (
          <button
            key={a.key}
            type="button"
            className="fn-hub-card"
            onClick={() => router.push(a.href)}
          >
            <span aria-hidden="true" style={{ fontSize: 30, lineHeight: 1 }}>
              {a.icon}
            </span>
            <span
              style={{
                fontFamily: 'Archivo,system-ui,sans-serif',
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: '-0.01em',
              }}
            >
              {a.title}
            </span>
            <span style={{ fontSize: 13.5, color: '#2C3A5E', lineHeight: 1.5 }}>{a.tagline}</span>

            <ul
              style={{
                margin: '4px 0 0',
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {a.lines.map((l) => (
                <li
                  key={l}
                  style={{
                    fontSize: 12.5,
                    color: '#2C3A5E',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    lineHeight: 1.45,
                  }}
                >
                  <span aria-hidden="true" style={{ color: '#0F52BA', fontWeight: 700 }}>
                    ·
                  </span>
                  {l}
                </li>
              ))}
            </ul>

            <span
              style={{
                marginTop: 'auto',
                paddingTop: 12,
                fontSize: 13,
                fontWeight: 700,
                color: '#0F52BA',
              }}
            >
              Open {a.title} →
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className="fn-reset-button"
        onClick={async () => {
          await supabase().auth.signOut();
          router.replace('/app');
        }}
        style={{ fontSize: 12.5, fontWeight: 600, color: '#A6C5D7', cursor: 'pointer' }}
      >
        Sign out
      </button>
    </div>
  );
}
