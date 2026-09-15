import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Session state, shared across routes.
 *
 * The flow is browse-first: searching, seeing who is available and reading estimates
 * need no account. Auth is demanded at the commit point — opening a chat with an
 * artisan, or booking — which is where a marketplace actually needs to know who you are.
 *
 * NOTE: there is no auth backend. `signedIn` is in-memory only, so the customer views
 * are a walkthrough of the planned product. Wire this to a real session before launch.
 */
type AuthValue = {
  signedIn: boolean;
  authOpen: boolean;
  /** Open the auth sheet. Pass an action to run once the user is through. */
  requireAuth: (after?: () => void) => void;
  /** Run `action` if signed in, otherwise gate it behind the sheet. */
  gate: (action: () => void) => void;
  closeAuth: () => void;
  completeAuth: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [pending, setPending] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((after?: () => void) => {
    setPending(() => after ?? null);
    setAuthOpen(true);
  }, []);

  const gate = useCallback(
    (action: () => void) => {
      if (signedIn) action();
      else requireAuth(action);
    },
    [signedIn, requireAuth],
  );

  const completeAuth = useCallback(() => {
    setSignedIn(true);
    setAuthOpen(false);
    pending?.();
    setPending(null);
  }, [pending]);

  const closeAuth = useCallback(() => {
    setAuthOpen(false);
    setPending(null);
  }, []);

  const signOut = useCallback(() => {
    setSignedIn(false);
    window.scrollTo(0, 0);
  }, []);

  const value = useMemo(
    () => ({ signedIn, authOpen, requireAuth, gate, closeAuth, completeAuth, signOut }),
    [signedIn, authOpen, requireAuth, gate, closeAuth, completeAuth, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
