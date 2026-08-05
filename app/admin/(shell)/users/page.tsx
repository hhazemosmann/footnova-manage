'use client';

/* User Management — scaffolding added by the conversion. Talks only to the
 * auth stub; every account here lives in memory and disappears on reload. */

import { FormEvent, useEffect, useState } from 'react';
import {
  Role,
  StubUser,
  createUser,
  currentUser,
  deleteUser,
  listUsers,
  subscribeAuth,
} from '@/lib/auth-stub';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<StubUser[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [me, setMe] = useState<StubUser | null>(null);

  useEffect(() => {
    const read = () => {
      setUsers(listUsers());
      setMe(currentUser());
    };
    read();
    return subscribeAuth(read);
  }, []);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    setNote('');
    const result = createUser({ username, password, role });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    setNote('Created ' + result.user.username + '.');
    setUsername('');
    setPassword('');
    setRole('user');
    setUsers(listUsers());
  }

  function onDelete(id: number) {
    setNote('');
    const result = deleteUser(id);
    if (!result.ok) {
      setError(result.error);
      setConfirmId(null);
      return;
    }
    setError('');
    setNote('User deleted.');
    setConfirmId(null);
    setUsers(listUsers());
  }

  return (
    <>
      <h1 className="sf-title">User Management</h1>

      {error && (
        <p className="sf-error" role="alert">
          {error}
        </p>
      )}
      {note && (
        <p className="sf-note" role="status">
          {note}
        </p>
      )}

      <section className="sf-panel">
        <h2 className="sf-label" style={{ margin: 0 }}>
          Accounts
        </h2>
        <div className="sf-table-wrap">
          <table className="sf-table">
            <thead>
              <tr>
                <th scope="col">USERNAME</th>
                <th scope="col">ROLE</th>
                <th scope="col" style={{ textAlign: 'right' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    {u.username}
                    {me?.id === u.id && (
                      <span style={{ color: 'var(--text-on-light-muted)', fontWeight: 400 }}>
                        {' '}
                        (you)
                      </span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.role}</td>
                  <td>
                    <div className="sf-row-actions">
                      {confirmId === u.id ? (
                        <>
                          <span style={{ fontSize: 13, alignSelf: 'center' }}>
                            Delete {u.username}?
                          </span>
                          <button
                            type="button"
                            className="sf-btn sf-btn-danger"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                            onClick={() => onDelete(u.id)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="sf-btn sf-btn-secondary"
                            style={{ padding: '6px 12px', fontSize: 13 }}
                            onClick={() => setConfirmId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="sf-btn sf-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 13 }}
                          onClick={() => {
                            setConfirmId(u.id);
                            setError('');
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="sf-panel">
        <h2 className="sf-label" style={{ margin: 0 }}>
          Create user
        </h2>
        <form onSubmit={onCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="sf-form-grid">
            <div className="sf-field">
              <label className="sf-label" htmlFor="new-username">
                Username
              </label>
              <input
                id="new-username"
                className="sf-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="sf-field">
              <label className="sf-label" htmlFor="new-password">
                Password
              </label>
              <input
                id="new-password"
                className="sf-input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="sf-field">
              <label className="sf-label" htmlFor="new-role">
                Role
              </label>
              <select
                id="new-role"
                className="sf-input"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
          <button className="sf-btn" type="submit" style={{ alignSelf: 'flex-start' }}>
            Create user
          </button>
        </form>
      </section>
    </>
  );
}
