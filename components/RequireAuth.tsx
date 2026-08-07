'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { loadAll, resetStore } from '@/lib/store';

/* Auth guard for the app shell, backed by Supabase.
 *
 * The session is read in a useEffect — never during render — and nothing is
 * rendered until the check resolves, so there is no hydration mismatch and no
 * flash of guarded UI. It also loads the workspace data once the session is
 * confirmed, and reloads it if the account changes.
 *
 * The workspace is flat: signed in or not. There are no roles to check. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'allowed'>('pending');

  useEffect(() => {
    let active = true;
    /* Which account the workspace is currently loaded for. Supabase re-emits
     * SIGNED_IN on things like tab focus and token refresh, so reloading on
     * every event would refetch constantly — and, worse, could interrupt what
     * you were doing. Only an actual change of account matters. */
    let loadedFor: string | null = null;

    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        if (!data.session) {
          router.replace('/app');
          return;
        }
        setStatus('allowed');
        loadedFor = data.session.user.id;
        void loadAll();
      });

    const { data: sub } = supabase().auth.onAuthStateChange((event, session) => {
      if (!active) return;

      /* Only an explicit sign-out sends you back to the login screen. A
       * missing session on any other event is treated as noise, because
       * blanking the page mid-task is far worse than a moment of stale data. */
      if (event === 'SIGNED_OUT') {
        loadedFor = null;
        resetStore();
        setStatus('pending');
        router.replace('/app');
        return;
      }

      if (session && session.user.id !== loadedFor) {
        loadedFor = session.user.id;
        setStatus('allowed');
        void loadAll();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (status === 'pending') return null;
  return <>{children}</>;
}
