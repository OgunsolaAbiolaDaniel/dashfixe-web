# Dashfixe — product architecture

> The source of truth for what this product is, which pages exist, how they connect, and why.
> `SITEMAP.md` (derived from the design files) is now the historical record; where the two
> disagree, **this document wins** and SITEMAP gets a note. Business context and locked copy
> stay in `../Dashfixe.md`. Code state lives in `docs/HANDOVER.md`.

**Owner of this document:** whoever is acting as architect in the current session.
**Last revised:** 2026-09-11 · Revision 1.1 — the signed-in home went map-first.

---

## 1. What the product is

Dashfixe connects people who need a repair with vetted local tradespeople, matched on
**availability**, starting with a pilot in Amora & Seixal. The one-line pitch: *when your
usual person can't*. The product moment is Uber's: describe the problem, see who is free
**right now** on a real map, agree the price in chat before anyone travels, pay in the app.

### Principles every screen obeys

1. **The map is the product.** Availability is our differentiator, and a live map is what
   availability looks like. Marketing pages show the map; product pages are built on it.
2. **Browse first, commit late.** Searching, seeing who is free and reading estimates need
   no account. Auth is demanded exactly once, at the commit point: opening a chat or holding
   a slot. Never earlier.
3. **One address drives everything.** The customer's location is resolved once, carried in
   the URL, and every distance, arrival time and map view derives from it. No number on any
   screen is hand-typed.
4. **Honesty is structural.** No live app exists and no artisans are recruited yet. Sample
   supply is always badged as sample. Nothing implies live availability, real prices, or a
   shipped app. This is a hard product rule, not a style choice (see `../Dashfixe.md` §2).
5. **Portugal first.** Every customer-facing string exists in EN and PT-PT, enforced by a
   test. Controls size to the longer string. Phone-first layouts; the pilot user is on a
   mid-range Android.
6. **URL as state.** A search, a selected artisan, a booking mode — all shareable, all
   reload-safe, all back-button-safe. If a screen's state matters, it is in the URL.

## 2. The two surfaces

Uber runs two worlds: uber.com persuades, m.uber.com performs. We do the same with routes
instead of subdomains. Every page belongs to exactly one surface, and each surface has one
chrome.

| | **Marketing surface** | **Product surface (the app)** |
|---|---|---|
| Job | Persuade and route | Get a repair done |
| Pages | `/`, `/for-artisans`, `/about`, `/help`, legal, `/waitlist` | signed-in home, `/explore`, `/activity`, `/artisan/:id`*, `/job/:id`* |
| Chrome | `SiteNav` + `SiteFooter` | `AppBar`, no footer (map fills the viewport) |
| Ground | White/well sections, ink footer | `page` ground, panel cards, the map |
| Scroll | Long pages, anchor sections | Viewport-pinned on desktop, panel scrolls |

\* designed, next to build (Phase 4).

The signed-in home is the app's home screen (Uber's m.uber.com home): same route,
different world — the **map fills the screen** with the supply around the saved address,
and the panel carries the composer, the active job and the rebook shortcuts. It is not a
dashboard; the lists (recent requests, saved places) live on `/activity`, Uber's Activity.

## 3. The journeys

Four journeys cover everyone. Every nav decision below exists to serve these.

1. **Urgent Ana** — tap leaking now. `/` composer (need + address) → `/explore` sorted by
   arrival → picks an artisan → **Chat** (auth gate) → price agreed in chat → `/job/:id`
   (on the way → done → receipt) → next time, rebooks from the signed-in home in two taps.
2. **Planner Pedro** — wants the painting done some Saturday. `/` toggles *Book for later* →
   `/explore?when=later` → picks a date and a two-hour window → holds an artisan (auth gate)
   → on the day it becomes a live job, same `/job/:id`.
3. **Artisan Tiago** — heard about the pilot. Any page → *Become an artisan* →
   `/for-artisans` (how it pays, vetting, the app) → applies with name + WhatsApp + trade →
   a human calls him on WhatsApp within 48 h. Supply acquisition is manual by design.
4. **Returning Rita** — signed in. `/` is the map with her composer, her active job and
   her rebook shortcuts; tapping a pin opens `/explore` with that artisan selected. Her
   history and saved places live under `/activity`. Everything lands on `/explore` or
   `/job/:id`.

## 4. The route map

### Launch set (everything else is cut or deferred)

| Route | Surface | Purpose | Status |
|---|---|---|---|
| `/` | marketing / app | Composer + map hero; signed-in → app home | built |
| `/explore` | app | THE product surface: search, map, now/later modes | built |
| `/activity` | app | Signed-in: past requests, saved places (redirects visitors home) | built (rev 1.1) |
| `/artisan/:id` | app | Profile: trust before the commit point | Phase 4 |
| `/job/:id` | app | Live job: tracking, approved estimate, receipt, rating | Phase 4 |
| `/for-artisans` | marketing | Supply landing + pilot application (`#apply`) | built (rev 1) |
| `/about` | marketing | Story, philosophy, coverage (`#coverage`) | built (rev 1) |
| `/help` | marketing | Honest pre-launch FAQ + contact | built (rev 1) |
| `/privacy` `/terms` `/cookies` | marketing | Minimal, honest, GDPR-aware | built (rev 1) |
| `/waitlist` | marketing | Pre-launch front door; at launch → redirect to `/` | built |

### Cut in revision 1, and why

| Was planned | Verdict | Reason |
|---|---|---|
| `/fix` | **redirect → `/explore`** | It was the same screen as `/explore` under another name. Uber has one request flow, not a "request" page and a "see drivers" page. One product surface. |
| `/book` | **redirect → `/explore?when=later`** | Booking ahead is a *mode* of the search, not a place. The `when` toggle already lives in the URL; the date/window picker lives in the explore panel. |
| `/for-artisans/details` | **cut** | One strong artisan page beats a lean one plus a long one. Depth becomes sections (`#pay`, `#vetting`, `#app`). |
| `/artisan-app` | **cut** | An app that doesn't ship yet doesn't earn a route. It is a section of `/for-artisans`. |
| `/coverage` | **fold → `/about#coverage`** | One pilot area is a paragraph and a map, not a page. Returns as a page when there are areas to choose between. |
| `/trade/:slug` | **defer** (SEO, post-launch) | Trade tiles already deep-link `/explore?trade=x`, which is the better product answer today. SEO pages come when there is supply to rank for. |
| Careers / Press links | **removed from footer** | A pre-launch company of one has neither. Footer links must all resolve to something true. |

### Redirect policy

Old paths never 404. `/fix`, `/book`, `/coverage` are real `<Route>` entries that issue
client redirects to their new homes. `src/routes.ts` stays the single place any internal
link resolves through (`link()`), so a future re-cut is a one-file change.

## 5. Navigation

Three chrome components, in `src/components/chrome/`. Nothing else renders a header.

**`SiteNav`** — marketing surface. Links go to the *product*, not to explainer anchors:
*Fix* → `/explore` · *Book ahead* → `/explore?when=later` · *Become an artisan* →
`/for-artisans` · *Help* → `/help`. Right cluster: language, Log in, Sign up (ink pill).
Under `md` it collapses to the shared `MobileMenu` sheet. Auth comes from `useAuth()`
directly — no prop drilling.

**`SiteFooter`** — marketing surface only. Four columns, every link true:
*Services* (trade deep-links into `/explore`), *Company* (About, Coverage → `/about#coverage`,
Contact → `/help#contact`), *For artisans* (Join → `/for-artisans#apply`, payouts/vetting/app
anchors), *Support* (Help, Safety, Cancellations → `/help` anchors). Legal row at the bottom.

**`AppBar`** — product surface. Slim, 69 px, **auth-aware** like Uber's: a visitor sees
*Find an artisan · How it works · Become an artisan* plus Log in / Sign up; a signed-in
customer sees *Home · Activity · Help* with the bell and the account chip (sign out).
Used by the signed-in home, `/explore` and `/activity` today; `/artisan/:id` and
`/job/:id` reuse it in Phase 4. The current route's link renders brand-bold.

Sections on `/` remain reachable by scrolling and by `/#anchor` links (the router's
`HashScroll` makes these work from any page), but the nav's job is to move people into the
product, so nav links point at routes.

## 6. State and data

- **Search state** (`src/search.ts`): `need, trade, address, lng/lat, when, artisan` —
  parsed from and serialised to the URL. The composer, trade tiles, nearby cards and the
  signed-in home all speak this one language; `/explore` only reads it.
- **Auth** (`src/auth.tsx`): in-memory walkthrough today. `gate(action)` is the only
  API pages use, so swapping in phone-OTP later (Phase 5) changes no page code.
- **Language** (`src/i18n/`): flat key dictionaries EN/PT with a parity test (keys and
  `{placeholders}` must match). `Rich` renders translated sentences containing links.
  Persisted per browser, mirrored to `<html lang>`.
- **Geography** (`src/lib/geo.ts`, `geocode.ts`): one derivation chain —
  address → `lng/lat` → `getSupply(home)` → distances, ETAs, median. Nominatim bounded to
  the pilot box, offline street list fallback, out-of-area positions refused with a notice.
- **Sample supply** (`components/explore/artisans.ts`): the only place fake artisans exist.
  Everything renders from it, always badged. When the backend arrives (Phase 5), this file's
  exports become the API client's return shape — the components don't change.

### Future backend contract (Phase 5, Spring Boot per `../Dashfixe.md` §7)

```
POST /api/waitlist            { email }                          → 202
POST /api/artisans/apply      { fullName, phone, email, trade }  → 202
GET  /api/artisans?lng&lat    → Supply (same shape as getSupply)
POST /api/jobs · GET /api/jobs/:id · WS /api/jobs/:id/chat       → Phase 5+
```

## 7. The map

`LiveMap` (MapLibre GL, OpenFreeMap Positron tiles, no key) with two variants — `full`
(explore: key, controls, selection pill, sample chip) and `peek` (hero/coverage: inert
backdrop). `MapCanvas` is the drawn-city fallback when tiles or WebGL fail; it mirrors both
variants so no page ever shows a grey box. Basemap tinted to brand; markers are React
portals using design tokens. **Do not touch the worker wiring** without reading the gotcha
in HANDOVER — it broke silently twice.

Phase 4 adds the third variant, `track`: the job screen's map with a route line and the
artisan's pin moving between waypoints (sample-driven until the backend). Phase 5 code-splits
MapLibre (~500 kB) behind `React.lazy` so marketing pages stop paying for it.

## 8. Testing

- **Gate:** `npm run check` = tsc + eslint + vitest. Green before every commit, and after
  every merge — a merge is a code change (see HANDOVER, 2026-09-10 incident).
- **Unit:** geo maths, geocoding (network mocked, offline fallback), URL round-trips,
  route table, i18n parity.
- **Page:** RTL + the MapLibre stub — journeys, not implementations: composer → URL,
  auth gate at chat, marker ↔ card selection, language switch, redirects.
- **Rendered truth:** `node scripts/shot.mjs` against dev *and* `vite preview` — the only
  net that catches WebGL, worker and provider-mounting failures that pass tsc and jsdom.
- **Phase 5:** Playwright smoke on the built app in CI (GitHub Actions running `check` +
  build on every PR). No PR merges red — the one rule that would have prevented the
  2026-09-10 main breakage.

## 9. Delivery

Phases live in `docs/BUILD_PLAN.md`; this document defines *what*, the plan defines *when*.
Current: rev 1 (this restructure) is Phase 3. The job loop is Phase 4. Backend, auth, CI
and the launch switch (waitlist → home redirect decision) are Phase 5.
