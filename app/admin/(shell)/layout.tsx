'use client';

/* Admin chrome — scaffolding added by the conversion. Two tabs, a sign-out
 * control, and an admin-only guard. Styled entirely from the source's tokens;
 * no sidebar here, so the drawer rule in step 3a does not apply. */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import { signOut } from '@/lib/auth-stub';

const TABS = [
  { href: '/admin/home', label: 'Home' },
  { href: '/admin/users', label: 'User Management' },
];

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth realm="admin">
      <AdminShell>{children}</AdminShell>
    </RequireAuth>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="sf-admin">
      <header className="sf-admin-bar fn-on-dark">
        <span className="sf-admin-brand">
          <Image src="/footnova-logo.png" alt="" width={28} height={28} />
          FootNova
          <span className="sf-admin-tag">ADMIN</span>
        </span>

        <nav className="sf-admin-tabs" aria-label="Admin">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="sf-admin-tab"
              aria-current={pathname === t.href ? 'page' : undefined}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="sf-btn sf-btn-secondary sf-admin-signout"
          style={{ borderColor: 'var(--ivory)', color: 'var(--ivory)' }}
          onClick={() => {
            signOut();
            router.replace('/admin');
          }}
        >
          Sign out
        </button>
      </header>

      <main className="sf-admin-main">{children}</main>
    </div>
  );
}
