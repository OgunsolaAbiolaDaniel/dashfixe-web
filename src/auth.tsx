import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import { ROUTES } from './routes';

/**
 * Session state, server-backed — ARCHITECTURE.md §6.
 *
 * The flow stays browse-first: searching, availability and estimates need no
 * account. Auth is demanded at the commit point, and it is a PAGE, not a modal:
 * `requireAuth(next)` sends the visitor to /login and the login page brings them
 * back to `next` once the server has verified them.
 *
 * The session itself lives in an httpOnly cookie the JS never reads; on load we
 * ask GET /api/auth/me who we are (phone + the first name, if one was given).
 */
type AuthValue = {
  signedIn: boolean;
  /** True only while the first session check is in flight on a cold load. */
  checking: boolean;
  phone: string | null;
  /** First name, once the customer has told us. */
  name: string | null;
  /** Go to /login; return to `next` (default: the current URL) on success. */
  requireAuth: (next?: string) => void;
  /** Called by the login page once the server verified the visitor. */
  completeAuth: (phone: string, name?: string | null) => void;
  /** Save the first name (re-issues the session cookie). Resolves false on error. */
  saveName: (name: string) => Promise<boolean>;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
  initialSignedIn = false,
}: {
  children: ReactNode;
  /** Start signed in as "Alex", skipping the server check — deterministic tests. */
  initialSignedIn?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [phone, setPhone] = useState<string | null>(initialSignedIn ? '+351900000000' : null);
  const [name, setName] = useState<string | null>(initialSignedIn ? 'Alex' : null);
  const [checking, setChecking] = useState(!initialSignedIn);

  useEffect(() => {
    if (initialSignedIn) return;
    let cancelled = false;
    void api<{ signedIn: boolean; phone?: string; name?: string | null }>('/api/auth/me').then((r) => {
      if (cancelled) return;
      if (r.ok && r.data.signedIn) {
        setSignedIn(true);
        setPhone(r.data.phone ?? null);
        setName(r.data.name ?? null);
      }
      setChecking(false);
    });
    return () => {
      cancelled = true;
    };
  }, [initialSignedIn]);

  const requireAuth = useCallback(
    (next?: string) => {
      const target = next ?? location.pathname + location.search;
      navigate(`${ROUTES.login}?next=${encodeURIComponent(target)}`);
    },
    [navigate, location.pathname, location.search],
  );

  const completeAuth = useCallback((verifiedPhone: string, verifiedName?: string | null) => {
    setSignedIn(true);
    setPhone(verifiedPhone);
    setName(verifiedName ?? null);
    setChecking(false);
  }, []);

  const saveName = useCallback(async (next: string) => {
    const r = await api<{ name: string }>('/api/auth/profile', { name: next.trim() });
    if (!r.ok) return false;
    setName(r.data.name);
    return true;
  }, []);

  const signOut = useCallback(() => {
    void api('/api/auth/logout', {});
    setSignedIn(false);
    setPhone(null);
    setName(null);
    navigate(ROUTES.home);
  }, [navigate]);

  const value = useMemo(
    () => ({ signedIn, checking, phone, name, requireAuth, completeAuth, saveName, signOut }),
    [signedIn, checking, phone, name, requireAuth, completeAuth, saveName, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** "AS" for Ana Sofia; the last two digits of the phone until there is a name. */
// eslint-disable-next-line react-refresh/only-export-components -- tiny helper shared by the header and panels
export function initialsOf(name: string | null, phone: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return phone ? phone.slice(-2) : '··';
}
