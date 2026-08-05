'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { restoreSession, subscribeAuth } from '@/lib/auth-stub';

/* Client guard for the app shell. Reads the stub session in a useEffect —
 * never during render — and renders nothing until the check has resolved, so
 * there is no hydration mismatch and no flash of guarded UI.
 *
 * The realm/role branching this component used to carry went out with the
 * /admin area. The workspace is flat: signed in or not. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'allowed'>('pending');

  useEffect(() => {
    const check = () => {
      if (!restoreSession()) {
        router.replace('/app');
        return;
      }
      setStatus('allowed');
    };
    check();
    return subscribeAuth(check);
  }, [router]);

  if (status === 'pending') return null;
  return <>{children}</>;
}
