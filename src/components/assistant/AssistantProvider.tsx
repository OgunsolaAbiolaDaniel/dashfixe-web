import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import AssistantSheet from './AssistantSheet';

type AssistantValue = {
  /** Open the assistant, optionally with what the customer already typed. */
  openAssistant: (initial?: string) => void;
};

// A no-op default: a component rendered outside the provider (a unit test of one
// page) simply has nowhere to open the assistant, instead of crashing.
const AssistantContext = createContext<AssistantValue>({ openAssistant: () => {} });

/**
 * One Dashfixe assistant for the whole site, mounted once above the routes
 * (AppRoutes.tsx). Any component can open it — the "Something else" tile, the
 * trade picker's "Not sure?", the signed-in quick tiles — without prop drilling.
 * Each opening is a fresh conversation (keyed), seeded with any text typed so far.
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ id: number; initial: string } | null>(null);
  const openAssistant = useCallback((initial = '') => setSession((s) => ({ id: (s?.id ?? 0) + 1, initial })), []);
  const value = useMemo(() => ({ openAssistant }), [openAssistant]);

  return (
    <AssistantContext.Provider value={value}>
      {children}
      {session && <AssistantSheet key={session.id} initial={session.initial} onClose={() => setSession(null)} />}
    </AssistantContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export function useAssistant(): AssistantValue {
  return useContext(AssistantContext);
}
