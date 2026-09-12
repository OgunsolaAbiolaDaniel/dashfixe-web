/**
 * The site's route table — docs/ARCHITECTURE.md §4 is the authority on what exists.
 *
 * Every cross-page link in the app resolves through here, so a destination can be
 * re-pointed in exactly one place. Revision 1 (the Uber-style consolidation) cut the
 * duplicate pages: there is ONE product surface (/explore) with a now/later mode,
 * one artisan page with anchored depth, and coverage lives on /about.
 */
import { launched } from './config';

/** Routes that exist. Marketing surface + product surface (ARCHITECTURE.md §2). */
export const ROUTES = {
  /** Marketing home for visitors; the app home once signed in. */
  home: '/',
  /** Pre-launch front door. At launch this redirects to home. */
  waitlist: '/waitlist',
  /** Phone-first log in / sign up (one flow). Takes ?next= back to the commit point. */
  login: '/login',
  /** THE product surface: search + map, `?when=later` for booking ahead. */
  explore: '/explore',
  /** Signed-in only: past requests and saved places (Uber's Activity). */
  activity: '/activity',
  /** Public trust page for one artisan (Phase 4). */
  artisan: '/artisan/:id',
  /** Signed-in: the live job or its receipt (Phase 4). */
  job: '/job/:id',
  /** One indexable landing page per trade (SEO, Phase 5). */
  trade: '/trade/:slug',
  /** Supply landing + pilot application. */
  forArtisans: '/for-artisans',
  about: '/about',
  help: '/help',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
} as const;

/**
 * Named destinations. Some are routes, some are anchors into a route, and the cut
 * pages (ARCHITECTURE.md §4) point at wherever their job moved to. Components use
 * `link(name)` and never hard-code a path, so a future re-cut is a one-file change.
 */
const DESTINATIONS = {
  home: ROUTES.home,
  waitlist: ROUTES.waitlist,
  explore: ROUTES.explore,
  activity: ROUTES.activity,
  login: ROUTES.login,

  // The artisan world: one page, anchored depth.
  forArtisans: ROUTES.forArtisans,
  artisanApply: `${ROUTES.forArtisans}#apply`,
  artisanPay: `${ROUTES.forArtisans}#pay`,
  artisanVetting: `${ROUTES.forArtisans}#vetting`,
  artisanApp: `${ROUTES.forArtisans}#app`,
  /** Cut page: the long version folded into the one artisan page. */
  artisanDetails: ROUTES.forArtisans,

  // Cut pages: one product surface, two modes.
  fix: ROUTES.explore,
  book: `${ROUTES.explore}?when=later`,

  // Info + legal.
  about: ROUTES.about,
  /** Cut page: one pilot area is a section, not a page. */
  coverage: `${ROUTES.about}#coverage`,
  help: ROUTES.help,
  safety: `${ROUTES.help}#safety`,
  cancellations: `${ROUTES.help}#cancellations`,
  contact: `${ROUTES.help}#contact`,
  privacy: ROUTES.privacy,
  terms: ROUTES.terms,
  cookies: ROUTES.cookies,
} as const;

export type Destination = keyof typeof DESTINATIONS;

/** Resolve a named destination to its current path. */
export function link(name: Destination): string {
  // The launch switch (config.ts): after launch the waitlist's job is done and
  // every link that pointed at it lands on the home instead.
  if (name === 'waitlist' && launched()) return ROUTES.home;
  return DESTINATIONS[name];
}

/** The trades with their own landing page. "Something else" routes through search. */
export const TRADE_SLUGS = ['plumbing', 'electrical', 'painting', 'carpentry', 'cleaning'] as const;
export type TradeSlug = (typeof TRADE_SLUGS)[number];

export function isTradeSlug(slug: string | undefined): slug is TradeSlug {
  return TRADE_SLUGS.includes(slug as TradeSlug);
}

export function tradeUrl(slug: TradeSlug): string {
  return `/trade/${slug}`;
}

/** The parameterised app routes, filled in. */
export function artisanUrl(id: string): string {
  return `/artisan/${id}`;
}

export function jobUrl(id: string): string {
  return `/job/${id}`;
}
