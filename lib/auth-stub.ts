// STUB — no backend, no real security. Replace before production.
//
// Credentials live in memory in plain text, the "session" is a value in
// sessionStorage that anyone can forge, and every function below resolves
// locally without a network call. This exists so the login screens and the
// admin area have something to talk to while the database is being built.

export type Realm = 'app' | 'admin';
export type Role = 'user' | 'admin';

export interface StubUser {
  id: number;
  username: string;
  password: string;
  role: Role;
}

let uid = 1;

/* Seeded accounts — both realms are reachable out of the box. */
const users: StubUser[] = [
  { id: uid++, username: 'hazem', password: 'footnova', role: 'user' },
  { id: uid++, username: 'admin', password: 'footnova-admin', role: 'admin' },
];

const SESSION_KEY = 'footnova.session';

let session: StubUser | null = null;

const listeners = new Set<() => void>();

export function subscribeAuth(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function emit() {
  listeners.forEach((fn) => fn());
}

function persist() {
  if (typeof window === 'undefined') return;
  if (session) {
    window.sessionStorage.setItem(SESSION_KEY, String(session.id));
  } else {
    window.sessionStorage.removeItem(SESSION_KEY);
  }
}

/* Rehydrates module state from sessionStorage. Only ever called from a
 * useEffect (see components/RequireAuth.tsx) — reading storage during
 * render would desync SSR and the first client render. */
export function restoreSession(): StubUser | null {
  if (typeof window === 'undefined') return null;
  if (session) return session;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const found = users.find((u) => u.id === Number(raw));
  session = found ?? null;
  return session;
}

export function currentUser(): StubUser | null {
  return session;
}

export function signIn(
  username: string,
  password: string,
  realm: Realm
): { ok: true; user: StubUser } | { ok: false; error: string } {
  const user = users.find((u) => u.username === username.trim() && u.password === password);
  if (!user) {
    return { ok: false, error: 'Incorrect username or password.' };
  }
  if (realm === 'admin' && user.role !== 'admin') {
    return { ok: false, error: 'That account does not have admin access.' };
  }
  session = user;
  persist();
  emit();
  return { ok: true, user };
}

export function signOut() {
  session = null;
  persist();
  emit();
}

export function requestPasswordReset(_username: string): Promise<string> {
  // Sends nothing. Deliberately does not reveal whether the account exists.
  return Promise.resolve('If that account exists, a reset link has been sent.');
}

/* ---- user management (admin area) ---- */

export function listUsers(): StubUser[] {
  return users.map((u) => ({ ...u }));
}

export function createUser(input: {
  username: string;
  password: string;
  role: Role;
}): { ok: true; user: StubUser } | { ok: false; error: string } {
  const username = input.username.trim();
  if (!username) return { ok: false, error: 'Username is required.' };
  if (!input.password) return { ok: false, error: 'Password is required.' };
  if (users.some((u) => u.username === username)) {
    return { ok: false, error: 'That username is already taken.' };
  }
  const user: StubUser = { id: uid++, username, password: input.password, role: input.role };
  users.push(user);
  emit();
  return { ok: true, user };
}

export function deleteUser(id: number): { ok: true } | { ok: false; error: string } {
  const target = users.find((u) => u.id === id);
  if (!target) return { ok: false, error: 'That user no longer exists.' };
  if (target.role === 'admin' && users.filter((u) => u.role === 'admin').length === 1) {
    return { ok: false, error: 'Cannot delete the last admin — you would lock yourself out.' };
  }
  users.splice(users.indexOf(target), 1);
  if (session?.id === id) {
    session = null;
    persist();
  }
  emit();
  return { ok: true };
}
