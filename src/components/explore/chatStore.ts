import type { StringKey } from '../../i18n/strings';

/**
 * The chat walkthrough's message store — module-level so a thread survives
 * closing and reopening the panel within a session. Seeded messages are i18n
 * keys (they follow the language switch); typed messages are raw text.
 * Replaced by the real chat backend in Phase 5.
 */
export type Msg =
  | { from: 'photo' }
  | { from: 'me' | 'them'; key: StringKey }
  | { from: 'me' | 'them'; text: string };

const threads = new Map<string, Msg[]>();
const replied = new Set<string>();

const SEED: Msg[] = [{ from: 'photo' }, { from: 'me', key: 'chat.msg1' }, { from: 'them', key: 'chat.msg2' }];

export function getThread(artisanId: string): Msg[] {
  const existing = threads.get(artisanId);
  if (existing) return existing;
  const seeded = [...SEED];
  threads.set(artisanId, seeded);
  return seeded;
}

export function saveThread(artisanId: string, msgs: Msg[]) {
  threads.set(artisanId, msgs);
}

/** The one canned reply per thread — a walkthrough beat, not a live artisan. */
export function shouldAutoReply(artisanId: string): boolean {
  if (replied.has(artisanId)) return false;
  replied.add(artisanId);
  return true;
}

/** Test hook. */
export function resetChatStore() {
  threads.clear();
  replied.clear();
}
