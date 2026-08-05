// STUB — no backend, no real security. Replace before production.
//
// Credentials live in memory in plain text, the "session" is a value in
// sessionStorage that anyone can forge, and every function below resolves
// locally without a network call. This exists so the login screens have
// something to talk to until Supabase Auth is wired in.
//
// The whole file is slated for deletion in that step. The workspace is flat —
// no roles, no realms — so nothing here models permissions.

export interface StubUser {
  id: number;
  username: string;
  password: string;
}

let uid = 1;

/* Seeded account. */
const users: StubUser[] = [{ id: uid++, username: 'hazem', password: 'footnova' }];

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
 * useEffect (see components/RequireAuth.tsx) — reading storage during render
 * would desync SSR and the first client render. */
export function restoreSession(): StubUser | null {
  if (typeof window === 'undefined') return null;
  if (session) return session;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  session = users.find((u) => u.id === Number(raw)) ?? null;
  return session;
}

export function currentUser(): StubUser | null {
  return session;
}

export function signIn(
  username: string,
  password: string
): { ok: true; user: StubUser } | { ok: false; error: string } {
  const user = users.find((u) => u.username === username.trim() && u.password === password);
  if (!user) return { ok: false, error: 'Incorrect username or password.' };
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
