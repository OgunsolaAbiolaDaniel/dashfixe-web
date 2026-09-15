import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { AdminRole } from '../shared/adminRoles';

/**
 * Who is signed in to the admin console (rev 2.12) — its own session, separate
 * from the customer one (auth.tsx). The cookie is httpOnly; we ask the server.
 */
export type ConsoleAdmin = {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  mustChange: boolean;
  disabled: boolean;
  locked: boolean;
  tempExpired: boolean;
  lastActiveAt: string | null;
  createdAt: string;
};

export type AdminSessionState =
  | { status: 'loading' }
  | { status: 'signedOut'; setupNeeded: boolean; setupAvailable: boolean }
  | { status: 'signedIn'; admin: ConsoleAdmin; sessionEndsAt: string };

type Value = {
  state: AdminSessionState;
  /** Ask the server again — after signing in, a password change, or a 401. */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminSessionContext = createContext<Value | null>(null);

async function load(): Promise<AdminSessionState> {
  const me = await api<{ admin: ConsoleAdmin; sessionEndsAt: string }>('/api/admin/me');
  if (me.ok) return { status: 'signedIn', admin: me.data.admin, sessionEndsAt: me.data.sessionEndsAt };
  const setup = await api<{ needed: boolean; available: boolean }>('/api/admin/setup');
  return { status: 'signedOut', setupNeeded: setup.ok && setup.data.needed, setupAvailable: setup.ok && setup.data.available };
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminSessionState>({ status: 'loading' });

  useEffect(() => {
    let live = true;
    void load().then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, []);

  const refresh = useCallback(async () => setState(await load()), []);
  const signOut = useCallback(async () => {
    await api('/api/admin/logout', {});
    setState(await load());
  }, []);

  const value = useMemo(() => ({ state, refresh, signOut }), [state, refresh, signOut]);
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAdminSession(): Value {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error('useAdminSession must be used inside AdminSessionProvider');
  return ctx;
}
