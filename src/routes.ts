/**
 * Cross-page destinations.
 *
 * The design links to `Dashfixe for Artisans.dc.html` and
 * `Dashfixe Customer Pages.dc.html`, which are not built yet. Until they are,
 * artisan links land on the waitlist page's artisan section — the only real
 * artisan sign-up that exists — and support links stay as on-page anchors.
 */
export const ROUTES = {
  home: '/',
  waitlist: '/waitlist',
  /** TODO: replace with /for-artisans once that page is built. */
  artisans: '/waitlist#artisans',
  /** TODO: replace with /help once the customer pages are built. */
  help: '#help',
} as const;
