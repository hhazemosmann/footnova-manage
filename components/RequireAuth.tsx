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

    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!active) return;
        if (!data.session) {
          router.replace('/app');
          return;
        }
        setStatus('allowed');
        void loadAll();
      });

    const { data: sub } = supabase().auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (!session) {
        resetStore();
        setStatus('pending');
        router.replace('/app');
        return;
      }
      if (event === 'SIGNED_IN') void loadAll();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  if (status === 'pending') return null;
  return <>{children}</>;
}
