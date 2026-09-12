import type { StringKey } from '../../i18n/strings';

/**
 * The chat walkthrough's thread store — module-level, per artisan, so a thread
 * survives closing and reopening the panel and follows the customer from
 * /explore (where the estimate is approved) onto /job/:id. Artisan lines are
 * i18n keys (they follow the language switch); the customer's are raw text.
 * Replaced by the chat backend (WebSocket) in Phase 6.
 */
export type Msg =
  /** "Chat about Plumbing · <address>" — rendered from the panel's props. */
  | { from: 'context' }
  /** Opening line on a job that was agreed elsewhere. */
  | { from: 'agreed'; total: number }
  | { from: 'me'; text: string }
  | { from: 'me'; img: string }
  | { from: 'them'; key: StringKey; vars?: Record<string, string | number> }
  /** The itemised estimate card (built from the artisan, lib/estimate). */
  | { from: 'estimate' }
  /** The confirmation card once the estimate is approved. */
  | { from: 'booked'; jobId: string };

/**
 * new → the artisan has asked what's wrong; quoting → an estimate is on its way;
 * quoted → approve or ask about it; approved → booked, chat carries on.
 */
export type Stage = 'new' | 'quoting' | 'quoted' | 'approved';

export type Thread = { msgs: Msg[]; stage: Stage; greeted: boolean; jobId?: string };

const threads = new Map<string, Thread>();

/**
 * The thread with one artisan. `agreedTotal` opens a fresh thread on an
 * already-agreed job (the job screen) instead of at the start of a quote.
 */
export function getThread(artisanId: string, agreedTotal: number | null = null): Thread {
  const existing = threads.get(artisanId);
  if (existing) return existing;
  const fresh: Thread =
    agreedTotal !== null
      ? { msgs: [{ from: 'agreed', total: agreedTotal }], stage: 'approved', greeted: true }
      : { msgs: [{ from: 'context' }], stage: 'new', greeted: false };
  threads.set(artisanId, fresh);
  return fresh;
}

export function saveThread(artisanId: string, thread: Thread) {
  threads.set(artisanId, thread);
}

/** Test hook. */
export function resetChatStore() {
  threads.clear();
}
