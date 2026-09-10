# Dashfixe web — build plan

How we build: **one phase at a time, each phase ends green and testable.** A phase is done
when `npm run check` passes (types + lint + unit tests), the page renders headless
(`node scripts/shot.mjs`), and the owner has clicked through it in a real browser. The owner
commits; the assistant never runs `git commit` or `git push`.

Reference for taste: **uber.com** — calm marketing pages, tight type, product surfaces that
put a real map front and centre. Reference for truth: `docs/HANDOVER.md` (state) and the
designs in `../designs/` (visual contract). If those disagree with this plan, they win.

Legend: ✅ done · 🔄 in progress · ⬜ not started

---

## Phase 0 · Foundations ✅

Goal: a codebase where every later phase can be built and tested the same way.

- ✅ Test harness: Vitest + jsdom + Testing Library (`npm test`), setup in `src/test/`
- ✅ `npm run check` = typecheck + lint + tests; `npm run build` typechecks first
- ✅ Lint actually runs (TypeScript pinned to 5.x; typescript-eslint does not support TS 7)
- ✅ Marketing type scale one step under uber.com (`display`/`h2`/`h3`/`lead`/`nav` tokens in
  `tailwind.config.js`); every public section moved onto it. Hero caps at 52px, not 74.
- ✅ Headless screenshot tool for pages the in-app preview cannot render (`scripts/shot.mjs`)
- ✅ Dev server reachable on IPv4 and IPv6 (`server.host: true`)

**Owner test:** open `/`, `/waitlist`, `/explore` — type should feel like uber.com, nothing
should look oversized at 1440px or cramped at 390px.

## Phase 1 · Live map on /explore ✅

Goal: the search-and-map surface from `Dashfixe Web.dc.html` on real geography.

- ✅ MapLibre GL + OpenFreeMap Positron vector tiles (free, no API key, OpenStreetMap data)
- ✅ Basemap tinted to the brand (water `#d9e3f3`, ground `#f4f6fa`, parks green-grey)
- ✅ Markers are React components in portals: available (blue outline), on a job (dashed),
  selected (blue pill with price · ETA and a pulse), your address (ink pin)
- ✅ 5 km search radius drawn as a GeoJSON layer; map fits every marker on load; selecting a
  card glides the map to the midpoint of you and the artisan; locate / zoom controls
- ✅ Distances and ETAs derived from coordinates (`src/lib/geo.ts`) so list, pills and
  stats can never disagree; sample pins placed on land around Amora, Cruz de Pau, Corroios,
  Paio Pires, Arrentela
- ✅ Desktop: map pins to the viewport, results panel scrolls on its own. Mobile: stacked.
- ✅ Graceful fallback to the drawn city (`MapCanvas.tsx`) if tiles cannot load
- ✅ Worker bug fixed for dev **and** production (see HANDOVER → gotchas)
- ✅ Tests: geo maths, sample-data invariants, URL search round-trip, route table, page
  behaviour (markers mount, URL pre-selection, auth gate on chat, marker → card selection)

**Owner test:** `/explore?need=kitchen%20tap` — tiles load, 8 pins, click pins and cards,
zoom, locate; `Chat` opens the auth sheet when signed out. Try `?artisan=mc`.

## Phase 2 · Home page, Uber grade ✅

Goal: the signed-out and signed-in home from `Dashfixe Home v2(real).dc.html`, polished.

- ✅ Hero: the stock photo is now a **live map peek** (same LiveMap, non-interactive);
  picking an address re-centres it
- ✅ Mobile navigation sheet (`shared/MobileMenu`), wired into PublicNav
- ✅ Address field: Nominatim autocomplete bounded to the pilot area, offline street list,
  "use my location" with a permission fallback
- ✅ EN/PT dictionary in `src/i18n/` with a key-parity test; provider mounted, persisted
- ✅ Supply derived per location (`getSupply(home)`); search URL carries `lng`/`lat`

**Phase 2 · second half**

- ✅ `/explore` reads `lng`/`lat` from the URL; map, list, distances and ETAs follow it
- ✅ Phone menu on CustomerNav and the `/explore` header; language toggle on every nav
- ✅ Every customer-facing section on `t()`, including the signed-in home, chat, the auth
  sheet and the map fallback
- ✅ "Nearby" cards use derived distance and ETA (`getNearby()`)
- ✅ Typed addresses are looked up on submit; out-of-area locations are refused honestly
- ✅ Page-level tests: composer → `/explore` URL, typed lookup, language switch, phone menu,
  out-of-area location, derived cards, URL-driven distances on `/explore`

Left for later on purpose: translating `/waitlist` (locked copy, own toggle) and a real
"Change area" picker.

**Owner test:** on `/`, type "seixal" in the address, pick the suggestion, press
"See who's available". `/explore` should open on Seixal with Tiago at 1.2 km. Switch to PT
from the globe button and check every section changes. At phone width, open the menu.

## Phase 3 · The urgent path ⬜

`Dashfixe Customer Pages.dc.html` — build as a set, they share components.

- ⬜ `/fix` — photo → AI diagnosis preview → trade → matches (honest "preview" labelling)
- ⬜ `/artisan/:id` — profile, reviews, badges, "Chat" / "Book" commit points
- ⬜ `/job/:id` — live job: on the way (map with the artisan's pin moving), approved
  estimate, itemised receipt, rate the artisan
- ⬜ Chat panel becomes a real component with a message store (still local; no backend)

## Phase 4 · Becoming an artisan ⬜

`Dashfixe for Artisans.dc.html` — navy ground, its own nav.

- ⬜ `/for-artisans` lean page · ⬜ `/for-artisans/apply` (reuse `ArtisanModal` fields)
- ⬜ `/for-artisans/details` long version · ⬜ `/artisan-app` preview of the app
- ⬜ Flip `BUILT.forArtisans` etc. in `src/routes.ts` so every artisan link stops detouring to
  the waitlist

## Phase 5 · Browsing path and footer pages ⬜

- ⬜ `/trade/:slug` (SEO pages per trade) · ⬜ `/book` (date + window picker)
- ⬜ `/help`, `/coverage` (map of the pilot area, reuse LiveMap), `/about`
- ⬜ `/privacy`, `/terms`, `/cookies` (minimal, honest, GDPR notice for the waitlist)

## Phase 6 · Backend and launch ⬜

- ⬜ `POST /api/waitlist` and `POST /api/artisans/apply` (Spring Boot per the handover doc,
  or a Vercel function as a stop-gap) — the forms already hold submissions in local state
- ⬜ Real auth (phone OTP) behind `src/auth.tsx`; the interface stays the same
- ⬜ Playwright smoke tests against the production build; GitHub Actions running `npm run check`
- ⬜ Analytics (privacy-preserving), error reporting, `robots.txt`, OG images
- ⬜ Redirect decision: waitlist vs home as the front door at launch

---

## Definition of done, every phase

1. `npm run check` is green.
2. `node scripts/shot.mjs <url> out.png` renders the new surface without console errors.
3. `docs/HANDOVER.md` "Where we stopped" is updated.
4. Owner clicks through in a real browser, then commits.
