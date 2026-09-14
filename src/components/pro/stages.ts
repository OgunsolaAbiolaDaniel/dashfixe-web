/**
 * The artisan walkthrough's stages — designs/Dashfixe Artisan App.dc.html, in
 * order: take the work (offer, brief), price it before you drive (chat, estimate),
 * do the job (approved → close), get paid.
 */
export type Stage =
  | 'home'
  | 'offer'
  | 'brief'
  | 'chat'
  | 'estimate'
  | 'approved'
  | 'driving'
  | 'onsite'
  | 'extra'
  | 'close'
  | 'paid';

/** Scripted pacing (ms): long enough to read, short enough not to wait. */
export const PACE = { offer: 1600, again: 8000, reply: 800, approve: 1400 } as const;

/** How long an offer stays open before it goes to the next artisan. */
export const OFFER_SECONDS = 30;

/** Which of the four design chapters a stage belongs to (-1: not started). */
export function stepOf(stage: Stage, finished: boolean): number {
  if (finished) return 3;
  if (stage === 'offer' || stage === 'brief') return 0;
  if (stage === 'chat' || stage === 'estimate') return 1;
  if (stage === 'paid') return 3;
  if (stage === 'home') return -1;
  return 2;
}
