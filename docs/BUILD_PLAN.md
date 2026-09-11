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

## Phase 3 · Product architecture, revision 1 ✅

Goal: stop assembling screens; make the flow one thing. `docs/ARCHITECTURE.md` is the new
source of truth for pages, navigation and journeys.

- ✅ `docs/ARCHITECTURE.md`: principles, the two surfaces, four journeys, route map with
  the cuts and their reasons, navigation spec, state/data, map, testing
- ✅ Route cuts: `/fix` and `/book` fold into `/explore` (now/later modes), coverage into
  `/about#coverage`, the three artisan pages into one `/for-artisans` with anchors. Cut
  paths are real routes that redirect — nothing 404s
- ✅ One chrome per surface (`components/chrome/`): `SiteNav` + `SiteFooter` +
  `MarketingShell` replace PublicNav/PublicFooter; nav links now point at the product
  (`/explore`, `/explore?when=later`, `/for-artisans`, `/help`), not page anchors
- ✅ `/for-artisans`: dark hero, three steps, commission stated plainly, vetting &
  licensing (Lei 14/2015, Lei 15/2015), app section, inline pilot application — every
  artisan link on the site now lands somewhere real
- ✅ `/about` (story, belief, coverage + map), `/help` (four straight answers + contact),
  `/privacy` `/terms` `/cookies` — the last dead links are gone
- ✅ Book-for-later is a mode: day + two-hour-window picker inside the explore panel
- ✅ `AppRoutes` split from `App` so tests drive real navigation; tests for redirects,
  the artisan application, later mode, and the new route table (58 tests)

**Owner test:** open `/fix` — you should land on `/explore`. Click "Become an artisan"
anywhere — one page, apply at the bottom, works in PT. Footer: every link goes somewhere.

### Revision 1.1 · The signed-in home goes map-first ✅

The signed-in `/` looked like a dashboard; Uber's signed-in home is the map. Fixed:

- ✅ `AppHome`: map fills the screen (interactive; tapping a pin opens `/explore` with
  that artisan selected), panel = greeting + composer + active job + rebooks + quick trades
- ✅ `/activity` (signed-in only, visitors redirected home): recent requests + saved
  places — the lists that used to crowd the home, Uber's Activity
- ✅ `AppBar` extracted to `components/chrome/`, auth-aware (visitor: explore links +
  log in/sign up; customer: Home · Activity · Help + bell + account chip); used by the
  app home, `/explore` and `/activity`. CustomerNav/CustomerFooter/CustomerHome deleted
- ✅ Tests: 63 — map-first home, composer → `/explore`, pin-tap → pre-selected artisan,
  Activity via the app bar, signed-out `/activity` redirect

**Owner test:** log in (Continue) — the home should be the map with the composer, not a
dashboard. Tap a pin. Open Activity from the top bar. Sign out from the account chip.

## Phase 4 · The job loop ✅

The product moment after "Chat", built on the AppBar chrome.

- ✅ `/artisan/:id` — the public trust page: identity + verification, about (EN/PT),
  stats, languages, sample reviews (PT on purpose, badged), and a commit CTA that drops
  back into `/explore` with the artisan selected. Artisan names on cards and in chat
  link here
- ✅ `/job/:id` — one route, two states. Travelling: step timeline, the approved
  itemised estimate, chat docked over `TrackMap` — a curved sample route on real tiles
  with the artisan's pin easing along it. Done: itemised receipt, paid-in-app, star
  rating, rebook. Unknown jobs → Activity; visitors → home
- ✅ Shared map kit (`components/map/kit.ts`) owns the MapLibre worker wiring, tint and
  curve helpers; `LiveMap` and `TrackMap` both build on it
- ✅ Chat is real state (`chatStore`): sending appends, threads survive close/reopen,
  one canned walkthrough reply per thread
- ✅ The later-mode day/window rides in the URL (`day`, `win`)
- ✅ Wiring: the home job banner opens the job (`?chat=1` deep-links chat), Activity's
  completed rows open their receipts, `lib/jobs.ts` keeps every receipt summing to its
  total (tested)
- ✅ Tests: 76 — receipt maths, profile journey, live-job chat send, rating, guards,
  Activity → receipt, slot round-trip

**Owner test:** sign in → Track on the job banner (watch the pin move) → Open chat and
send a message → Activity → open the €48.00 receipt → rate it → tap an artisan's name
from any search card.

## Phase 5 · Backend, launch, hardening 🔄

### Revision 1.3 · The functional core ✅

- ✅ The pilot API, in-repo and serverless: waitlist + artisan applications persist
  (Postgres via `DATABASE_URL`/Neon, in-memory in dev), full phone-OTP auth
  (request-code → verify → httpOnly session), one handler core across Vercel, the dev
  server and the tests. SMS behind an adapter — real texts are three env vars away;
  pilot mode shows the code on screen, labelled
- ✅ `/login` is a page (the modal is deleted): one phone-first flow for log in and
  sign up, `?next=` returns to the commit point (Chat on /explore round-trips and
  reopens)
- ✅ Both waitlist forms, the artisan modal and `/for-artisans` submit for real, with
  busy/disabled/error states
- ✅ The dead-button sweep: sort (URL-backed), editable need + address on /explore,
  real date/window on Book-ahead deep-linking the slot, the bell's honest popover,
  photo attach with preview everywhere (chat images too), saved places on /activity
  (localStorage until accounts), honest links for Change-area and the app card
- ✅ CI (GitHub Actions: check + build on every PR) and the Vercel SPA rewrite so deep
  links stop 404ing
- ✅ Maps decision written down (ARCHITECTURE §7): MapLibre stays; style env-switchable;
  real-time = our backend pushing positions (Phase 6); licensed geocoder before scale

**Owner test:** with no env vars, `npm run dev` → join the waitlist (network tab shows the
POST), log in with the on-screen pilot code from the Chat gate, add a saved place, sort by
price, attach a photo. Then set `DATABASE_URL` + `AUTH_SECRET` in Vercel and watch rows land.

### Still open in Phase 5

- ⬜ Ops to go live: set `DATABASE_URL`, `AUTH_SECRET` (and `TWILIO_*` when ready) in
  Vercel; verify a production login and a waitlist row
- ⬜ Perf: code-split MapLibre (~500 kB) behind `React.lazy`; image weight pass
- ⬜ SEO: `/trade/:slug` pages, sitemap.xml, OG images, robots.txt
- ⬜ Playwright smoke on the built app in CI
- ⬜ Launch switch: `/waitlist` redirects to `/`; honesty badges come off only as real
  supply replaces sample data

## Phase 6 · Live operations ⬜

The parts that need real supply and real infrastructure, in honesty order:

- ⬜ Real artisans: `GET /api/artisans` replaces the sample supply; the sample badges
  come off screen by screen as real data replaces them
- ⬜ Live positions over WebSocket/SSE into the existing reactive markers; real jobs
  (`POST /api/jobs`), chat backend, photo upload to storage
- ⬜ Notifications backend behind the bell; saved places move from localStorage to the
  account; payments (in-app only, per the business model)

---

## Definition of done, every phase

1. `npm run check` is green.
2. `node scripts/shot.mjs <url> out.png` renders the new surface without console errors.
3. `docs/HANDOVER.md` "Where we stopped" is updated.
4. Owner clicks through in a real browser, then commits.
