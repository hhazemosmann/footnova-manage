'use client';

/* The stage pill, everywhere a candidate's stage is shown.

 * Was a generic Badge with a hand-picked tone per call site, which meant the
 * same stage could be a different colour on two screens. It now takes its
 * colour from STAGE_COLOR, the one map that also drives the next-stage button
 * and the funnel, so a stage looks the same wherever you meet it. */

import { STAGE_COLOR, Stage } from '@/lib/types';

export default function StageBadge({ stage }: { stage: Stage }) {
  const c = STAGE_COLOR[stage];
  return (
    <span
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: 'var(--font-body)',
        fontWeight: 600,
        fontSize: 12,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-block',
        whiteSpace: 'nowrap',
      }}
    >
      {stage}
    </span>
  );
}
