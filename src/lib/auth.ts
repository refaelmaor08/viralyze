export interface AuthUser {
  email: string;
  provider?: 'email' | 'google' | 'apple';
}

const KEY = 'viralyze_user';

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(user)); } catch {}
}

export function clearUser(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch {}
}
