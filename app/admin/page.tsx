'use client';

/* ADMIN LOGIN — scaffolding added by the conversion. */

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { restoreSession, signIn } from '@/lib/auth-stub';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const user = restoreSession();
    if (user?.role === 'admin') router.replace('/admin/home');
  }, [router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = signIn(username, password, 'admin');
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    router.replace('/admin/home');
  }

  return (
    <main className="sf-shell">
      <div className="sf-card">
        <div className="sf-brand">
          <Image src="/footnova-logo.png" alt="" width={40} height={40} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span className="sf-brand-name">FootNova</span>
            <span className="sf-brand-sub">ADMIN</span>
          </span>
        </div>

        <div>
          <h1 className="sf-title">Admin sign in</h1>
          <p className="sf-lede">Account administration for FootNova Recruiting.</p>
        </div>

        <form className="sf-form" onSubmit={onSubmit}>
          <div className="sf-field">
            <label className="sf-label" htmlFor="admin-username">
              Username
            </label>
            <input
              id="admin-username"
              className="sf-input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label" htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              className="sf-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="sf-error" role="alert">
              {error}
            </p>
          )}

          <button className="sf-btn" type="submit">
            Sign in
          </button>

          <button
            className="sf-btn-link"
            type="button"
            onClick={() => router.push('/admin/forgot-password')}
          >
            Forgot password?
          </button>
        </form>

        <p className="sf-hint">
          Stub sign-in — no backend yet.
          <br />
          admin / footnova-admin
        </p>
      </div>
    </main>
  );
}
