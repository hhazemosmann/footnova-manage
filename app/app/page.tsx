'use client';

/* APP LOGIN — scaffolding added by the conversion. No counterpart in the
 * source HTML; built only from the source's own tokens. */

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { restoreSession, signIn } from '@/lib/auth-stub';

export default function AppLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  /* A signed-in visitor landing here goes straight into the app. */
  useEffect(() => {
    if (restoreSession()) router.replace('/app/overview');
  }, [router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = signIn(username, password, 'app');
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    router.replace('/app/overview');
  }

  return (
    <main className="sf-shell">
      <div className="sf-card">
        <div className="sf-brand">
          <Image src="/footnova-logo.png" alt="" width={40} height={40} />
          <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span className="sf-brand-name">FootNova</span>
            <span className="sf-brand-sub">RECRUITING</span>
          </span>
        </div>

        <div>
          <h1 className="sf-title">Sign in</h1>
          <p className="sf-lede">Jobs, applicants, CVs and shortlisting.</p>
        </div>

        <form className="sf-form" onSubmit={onSubmit}>
          <div className="sf-field">
            <label className="sf-label" htmlFor="app-username">
              Username
            </label>
            <input
              id="app-username"
              className="sf-input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="sf-field">
            <label className="sf-label" htmlFor="app-password">
              Password
            </label>
            <input
              id="app-password"
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
            onClick={() => router.push('/app/forgot-password')}
          >
            Forgot password?
          </button>
        </form>

        <p className="sf-hint">
          Stub sign-in — no backend yet.
          <br />
          hazem / footnova
        </p>
      </div>
    </main>
  );
}
