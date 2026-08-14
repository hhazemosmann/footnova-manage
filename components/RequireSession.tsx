'use client';

/* The signed-in gate, shared by every area of the product.
 *
 * The session is read in a useEffect — never during render — and nothing is
 * rendered until the check resolves, so there is no hydration mismatch and no
 * flash of guarded UI.
 *
 * `onAccount` is called with the user's id once the session is confirmed, and
 * again only if a different account signs in. That is where each area loads
 * its own data: the recruiting shell loads the recruiting store, the finance
 * shell loads the ledger, and neither waits on the other.
 *
 * The workspace is flat: signed in or not. There are no roles to check. */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function RequireSession({
  onAccount,
  onSignOut,
  children,
}: {
  onAccount?: (userId: string) => void;
  onSignOut?: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'allowed'>('pending');

  useEffect(() => {
    let active = true;
    /* Which account the data is currently loaded for. Supabase re-emits
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
        onAccount?.(data.session.user.id);
      });

    const { data: sub } = supabase().auth.onAuthStateChange((event, session) => {
      if (!active) return;

      /* Only an explicit sign-out sends you back to the login screen. A
       * missing session on any other event is treated as noise, because
       * blanking the page mid-task is far worse than a moment of stale data. */
      if (event === 'SIGNED_OUT') {
        loadedFor = null;
        onSignOut?.();
        setStatus('pending');
        router.replace('/app');
        return;
      }

      if (session && session.user.id !== loadedFor) {
        loadedFor = session.user.id;
        setStatus('allowed');
        onAccount?.(session.user.id);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
    /* The callbacks are module-scope functions at every call site, so they are
     * stable; re-running this effect on identity changes would tear the
     * subscription down needlessly. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (status === 'pending') return null;
  return <>{children}</>;
}
