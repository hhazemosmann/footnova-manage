'use client';

/* Scaffolding added by the conversion. Wired to Supabase's own password
 * reset flow. The confirmation is deliberately the same whether or not the
 * account exists, so this page cannot be used to discover addresses. */

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';

export default function AppForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    await supabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== 'undefined' ? window.location.origin + '/app' : undefined,
    });
    setBusy(false);
    setMessage('If that account exists, a reset link has been sent.');
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
          <h1 className="sf-title">Reset password</h1>
          <p className="sf-lede">Enter your email address and we&rsquo;ll send a reset link.</p>
        </div>

        <form className="sf-form" onSubmit={onSubmit}>
          <div className="sf-field">
            <label className="sf-label" htmlFor="app-reset-email">
              Email
            </label>
            <input
              id="app-reset-email"
              className="sf-input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {message && (
            <p className="sf-note" role="status">
              {message}
            </p>
          )}

          <button className="sf-btn" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>

        <Link href="/app" className="sf-btn-link">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
