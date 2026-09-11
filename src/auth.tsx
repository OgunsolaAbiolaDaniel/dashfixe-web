import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import { ROUTES } from './routes';

/**
 * Session state, server-backed — ARCHITECTURE.md §6.
 *
 * The flow stays browse-first: searching, availability and estimates need no
 * account. Auth is demanded at the commit point, and it is a PAGE now, not a
 * modal: `requireAuth(next)` sends the visitor to /login and the login page
 * brings them back to `next` once the server has verified their code.
 *
 * The session itself lives in an httpOnly cookie the JS never reads; on load we
 * ask GET /api/auth/me who we are.
 */
type AuthValue = {
  signedIn: boolean;
  /** True only while the first session check is in flight on a cold load. */
  checking: boolean;
  phone: string | null;
  /** Go to /login; return to `next` (default: the current URL) on success. */
  requireAuth: (next?: string) => void;
  /** Called by the login page once the server verified the code. */
  completeAuth: (phone: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({
  children,
  initialSignedIn = false,
}: {
  children: ReactNode;
  /** Start signed in, skipping the server check — deterministic tests. */
  initialSignedIn?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [phone, setPhone] = useState<string | null>(initialSignedIn ? '+351900000000' : null);
  const [checking, setChecking] = useState(!initialSignedIn);

  useEffect(() => {
    if (initialSignedIn) return;
    let cancelled = false;
    void api<{ signedIn: boolean; phone?: string }>('/api/auth/me').then((r) => {
      if (cancelled) return;
      if (r.ok && r.data.signedIn) {
        setSignedIn(true);
        setPhone(r.data.phone ?? null);
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

  const completeAuth = useCallback((verifiedPhone: string) => {
    setSignedIn(true);
    setPhone(verifiedPhone);
    setChecking(false);
  }, []);

  const signOut = useCallback(() => {
    void api('/api/auth/logout', {});
    setSignedIn(false);
    setPhone(null);
    navigate(ROUTES.home);
  }, [navigate]);

  const value = useMemo(
    () => ({ signedIn, checking, phone, requireAuth, completeAuth, signOut }),
    [signedIn, checking, phone, requireAuth, completeAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
