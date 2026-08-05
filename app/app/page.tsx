'use client';

/* APP LOGIN — real Supabase Auth (email + password).
 *
 * Scaffolding added by the conversion; no counterpart in the source HTML, so
 * it is built only from the source's own tokens. Registration is invitation
 * only: teammates are added from the Supabase dashboard, so there is no
 * sign-up link here by design. */

import { FormEvent, useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AppLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /* A signed-in visitor landing here goes straight into the app. */
  useEffect(() => {
    supabase()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) router.replace('/app/overview');
      });
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: signInError } = await supabase().auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
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
            <label className="sf-label" htmlFor="app-email">
              Email
            </label>
            <input
              id="app-email"
              className="sf-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              required
            />
          </div>

          {error && (
            <p className="sf-error" role="alert">
              {error}
            </p>
          )}

          <button className="sf-btn" type="submit" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
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
          Accounts are added from the Supabase dashboard — there is no public sign-up.
        </p>
      </div>
    </main>
  );
}
