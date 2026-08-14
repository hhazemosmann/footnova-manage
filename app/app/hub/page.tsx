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

/* Two words and nothing else. The earlier version explained each area in a
 * bulleted list, which is documentation, not a door — and there are only two
 * of them, so there is nothing to disambiguate. Brand colours carry the
 * difference: sapphire on ivory, ivory on sapphire. */
const AREAS = [
  { key: 'recruitment', title: 'RECRUITMENT', href: '/app/overview', tone: 'light' },
  { key: 'finance', title: 'FINANCE', href: '/app/finance/dashboard', tone: 'dark' },
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
            data-tone={a.tone}
            onClick={() => router.push(a.href)}
          >
            {a.title}
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
