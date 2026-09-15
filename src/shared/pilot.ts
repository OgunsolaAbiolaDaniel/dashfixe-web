/**
 * Facts about the pilot shared by the site, the console and the server
 * (rev 2.13). Pure module; src/server imports it as '../shared/pilot.js'.
 */

/** The neighbourhoods artisans can say they cover on /pro/apply. */
export const PILOT_AREAS = ['Amora', 'Seixal', 'Corroios', 'Arrentela', 'Paio Pires', 'Fernão Ferro', 'Cruz de Pau'] as const;

/**
 * The team's response targets — they drive the console's timers, and turn an
 * item amber (half-way) and red (missed).
 */
export const TARGETS = {
  /** Call a new applicant within 48 hours. */
  applicantCallMs: 48 * 60 * 60 * 1000,
  /** Call back a safety report within 1 hour. */
  safetyCallbackMs: 60 * 60 * 1000,
  /** Call back any other problem report within 24 hours. */
  reportCallbackMs: 24 * 60 * 60 * 1000,
} as const;

export function reportTargetMs(category: string): number {
  return category === 'safety' ? TARGETS.safetyCallbackMs : TARGETS.reportCallbackMs;
}
