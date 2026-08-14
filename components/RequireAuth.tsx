'use client';

/* The recruiting area's guard: the shared session gate, wired to load the
 * recruiting store once the account is known. The gate logic itself lives in
 * RequireSession, so the finance area and this one cannot drift apart. */

import RequireSession from './RequireSession';
import { loadAll, resetStore } from '@/lib/store';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  return (
    <RequireSession onAccount={() => void loadAll()} onSignOut={resetStore}>
      {children}
    </RequireSession>
  );
}
