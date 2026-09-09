/**
 * The site's route table.
 *
 * Ordering comes from `Dashfixe Flow.dc.html` in the Claude Design project — the designer's
 * own map of how the pages connect. See SITEMAP.md for the full lane-by-lane breakdown.
 *
 * Every cross-page link in the app resolves through here, so an unbuilt destination can be
 * pointed somewhere sensible in exactly one place and repointed when its page lands.
 */

/** Routes that exist today. */
export const ROUTES = {
  /** Lane 1 · Home, signed out and signed in. */
  home: '/',
  /** Lane 1 · Pre-launch front door. */
  waitlist: '/waitlist',
} as const;

/**
 * Lane 2 and 3 destinations that are designed but not implemented.
 *
 * `target` is where the link goes once the page is built; `fallback` is where it goes today.
 * Use `link()` rather than reading these directly.
 */
const PLANNED = {
  // Lane 3 · Becoming an artisan — Dashfixe for Artisans.dc.html
  forArtisans: { target: '/for-artisans', fallback: '/waitlist#artisans' },
  artisanApply: { target: '/for-artisans/apply', fallback: '/waitlist#artisans' },
  artisanApp: { target: '/artisan-app', fallback: '/waitlist#artisans' },
  artisanDetails: { target: '/for-artisans/details', fallback: '/waitlist#artisans' },

  // Lane 2 · Getting something fixed — Dashfixe Customer Pages.dc.html
  fix: { target: '/fix', fallback: '/' },
  book: { target: '/book', fallback: '/#later' },
  explore: { target: '/explore', fallback: '/' },
  help: { target: '/help', fallback: '/' },
  coverage: { target: '/coverage', fallback: '/' },
  about: { target: '/about', fallback: '/' },

  // Legal. No design file yet; the docs defer full terms until there are
  // transactions, but the waitlist form still needs a GDPR privacy notice.
  privacy: { target: '/privacy', fallback: '/' },
  terms: { target: '/terms', fallback: '/' },
  cookies: { target: '/cookies', fallback: '/' },
} as const;

export type PlannedRoute = keyof typeof PLANNED;

/** Flip to true per route as its page lands. */
const BUILT: Record<PlannedRoute, boolean> = {
  forArtisans: false,
  artisanApply: false,
  artisanApp: false,
  artisanDetails: false,
  fix: false,
  book: false,
  explore: false,
  help: false,
  coverage: false,
  about: false,
  privacy: false,
  terms: false,
  cookies: false,
};

/** Resolve a planned destination to wherever it should point right now. */
export function link(name: PlannedRoute): string {
  const route = PLANNED[name];
  return BUILT[name] ? route.target : route.fallback;
}
