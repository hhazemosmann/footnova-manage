'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Realm, restoreSession, subscribeAuth } from '@/lib/auth-stub';

/* Client guard for both (shell) layouts. Reads the stub session in a
 * useEffect — never during render — and renders nothing until the check has
 * resolved, so there is no hydration mismatch and no flash of guarded UI. */
export default function RequireAuth({
  realm,
  children,
}: {
  realm: Realm;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'allowed'>('pending');

  useEffect(() => {
    const check = () => {
      const user = restoreSession();
      if (!user) {
        router.replace(realm === 'admin' ? '/admin' : '/app');
        return;
      }
      if (realm === 'admin' && user.role !== 'admin') {
        // An app-realm session must not reach /admin/*.
        router.replace('/admin');
        return;
      }
      setStatus('allowed');
    };
    check();
    return subscribeAuth(check);
  }, [realm, router]);

  if (status === 'pending') return null;
  return <>{children}</>;
}
