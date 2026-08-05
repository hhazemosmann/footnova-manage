'use client';

/* Deliberately minimal — SCAFFOLDING. A user count and a link into User
 * Management. Fill this in with whatever admin overview you actually want;
 * nothing here is ported from the design. */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listUsers, subscribeAuth } from '@/lib/auth-stub';

export default function AdminHomePage() {
  const [count, setCount] = useState<number | null>(null);

  /* Read the stub store after mount — it is module state, not render state. */
  useEffect(() => {
    const read = () => setCount(listUsers().length);
    read();
    return subscribeAuth(read);
  }, []);

  return (
    <>
      <h1 className="sf-title">Admin</h1>

      <div className="sf-panel">
        <span className="sf-label">Accounts</span>
        <span
          style={{
            fontFamily: 'var(--font-score)',
            fontSize: 44,
            lineHeight: 1,
            color: 'var(--midnight)',
          }}
        >
          {count ?? '—'}
        </span>
        <Link href="/admin/users" className="sf-btn-link">
          Manage users →
        </Link>
      </div>
    </>
  );
}
