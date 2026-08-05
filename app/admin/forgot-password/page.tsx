'use client';

/* Scaffolding added by the conversion. Sends nothing. */

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { requestPasswordReset } from '@/lib/auth-stub';

export default function AdminForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(await requestPasswordReset(username));
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
          <h1 className="sf-title">Reset password</h1>
          <p className="sf-lede">Enter your admin username and we&rsquo;ll send a reset link.</p>
        </div>

        <form className="sf-form" onSubmit={onSubmit}>
          <div className="sf-field">
            <label className="sf-label" htmlFor="admin-reset-username">
              Username
            </label>
            <input
              id="admin-reset-username"
              className="sf-input"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {message && (
            <p className="sf-note" role="status">
              {message}
            </p>
          )}

          <button className="sf-btn" type="submit">
            Send reset link
          </button>
        </form>

        <Link href="/admin" className="sf-btn-link">
          ← Back to sign in
        </Link>
      </div>
    </main>
  );
}
