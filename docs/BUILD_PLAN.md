# Dashfixe web — build plan

How we build: **one phase at a time, each phase ends green and testable.** A phase is done
when `npm run check` passes (types + lint + unit tests), the page renders headless
(`node scripts/shot.mjs`), and the owner has clicked through it in a real browser. Since
Phase 3 the owner asked for progressive commits: each green chunk is committed on a
feature branch and pushed to its PR; the owner reviews and merges.

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

## Phase 5 · Backend, launch, hardening ✅ code · ⬜ ops

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

### Revision 1.4 · Launch hardening ✅ (merged, #9; Vercel API fix #10)

- ✅ **Perf: MapLibre code-split.** Every map now loads through `components/map/lazy.tsx`,
  and ESLint rejects direct imports.
  - Entry JS: 1,445 → 424 kB (gzip 399 → 123 kB).
  - Marketing pages and `/login` never fetch the map.
- ✅ **Image weight pass.**
  - Brand PNGs are now 3× their display size: 327 → 61 kB on every page.
  - The OG card is a JPEG: 330 → 83 kB.
  - The unused `phone-screen.png` (136 kB) is deleted.
- ✅ **SEO.** `src/seo.ts` holds one table.
  - At runtime it sets titles, descriptions, canonical, robots and OG/Twitter tags per
    route and language.
  - The build writes a static head per public route (14 pages), plus `sitemap.xml` and
    `robots.txt`.
  - Private and sample pages are `noindex`. `public/og.jpg` is the share card.
- ✅ **`/trade/:slug`.** Five landing pages in EN and PT: what the trade covers, price
  guidance taken from the sample data, how it works, badged sample artisans and sibling
  trades. The footer's Services column links to them.
- ✅ **Launch switch.** `VITE_LAUNCHED=true` redirects `/waitlist` to `/`, `link()`
  follows, and the sitemap drops the page.
- ✅ **Playwright smoke.** Six journeys run against the built app, which `vite preview`
  serves with the pilot API. CI gains a `smoke` job after `check`.
- ✅ **Honesty and UX fixes.** The explore chip said "· live" with a pulsing dot; it now
  says "pilot area". A prefilled address no longer pops open its suggestion list on load
  (it was covering the Now/Later toggle).

**Owner test:**
1. Run `npx vite build && npm run smoke`, and expect 6 passed.
2. Open `/trade/electrical` in EN, then PT, and watch the tab title follow.
3. View source on the built `/trade/plumbing` (via `npx vite preview`); it has its own
   `<title>` and `og:*` tags.
4. Load `/help` with DevTools → Network open; no `LiveMap`/`MapCanvas` chunk should
   appear.

### Revision 1.5 · Product polish ✅ (merged, #11 — verified live in production)

The owner's review asked for consistency, a location that reacts, a real chat and a login
that just works without paid SMS:

- ✅ **One header everywhere** (`components/chrome/Header.tsx`), replacing four.
  - The same logo (always home), links per auth state, language control and account
    area on every page.
  - Content-width on marketing pages, edge to edge on map screens, minimal on `/login`.
  - The waitlist logo now goes home.
- ✅ **One-tap pilot login.** With no SMS provider, Send code signs you in, then a
  one-time, skippable "What should we call you?".
  - The name rides in the session. The greeting follows the time of day ("Good
    afternoon, Ana."), and Activity has an Account card.
  - The code step returns automatically once `TWILIO_*` is set.
- ✅ **One shared place** (`lib/place.ts`). Picking an address anywhere moves every map,
  pin, distance and ETA.
  - The signed-in home can change its address.
  - An out-of-area location snaps to the pilot area, and says so.
- ✅ **Chat is the real flow.**
  - The artisan asks, then an itemised estimate arrives → Approve → confirm → booked →
    Track.
  - Suggested questions, a typing indicator, and a full-screen sheet on phones.
  - Labelled as scripted sample replies.
- ✅ **Jobs are a live store** (`lib/jobs.ts`).
  - Jobs booked in chat appear in the home banner, Activity and `/job/:id`.
  - Booked and travelling states; "Walkthrough: finish this job" leads to the receipt,
    and ratings persist.
- ✅ **`/how-it-works`**, plus home tidy-ups: 2×2 cards with honest buttons, a balanced
  "Plan it for later", and the Apps card goes to `/explore`.
- ✅ **The waitlist is parked:** reachable, but linked from nowhere, `noindex`, and out of
  the sitemap.

**Owner test:**
1. On `/login`, enter any number → Send code → type a name. You land where you were
   headed, greeted by name.
2. On `/`, pick "Seixal" in the hero: the "Free near you" ETAs change, and the
   signed-in home shows the same address.
3. On `/explore`, chat with Tiago, send, then Approve €63.00 → Confirm → Track Tiago.
4. On the job, choose "Walkthrough: finish this job", then rate it. It shows in Activity.

### Revision 1.6 · Production readiness ✅ (merged, #13; the cold-load routing fix #14)

The site is complete; this pass makes it safe for real visitors. It needs no money or
accounts:

- ✅ **A crash screen instead of a white page** (`ErrorBoundary`). Navigating away
  recovers.
- ✅ **A real 404** (`NotFoundPage`, `noindex`) instead of a silent redirect home.
- ✅ **Privacy, cookies and terms rewritten to match what is actually stored:** the
  `dfx_session` and `dfx_otp` cookies, plus local storage for language, address, places
  and walkthrough jobs.
- ✅ **The Dashfixe icons.** The tab showed Vite's template logo. Now there's a favicon, a
  `favicon.ico`, touch and app icons, and a web app manifest (installable on phones).
- ✅ **WCAG 2.1 AA, enforced by axe in CI.**
  - The first run failed 6 of 8 pages.
  - Fixed through contrast tokens, underlined in-text links, and named icon buttons.

**Owner test:**
1. Open `/no-such-page` and you get the 404, with links back in.
2. The browser tab shows the Dashfixe mark.
3. On a phone, open the site and choose "Add to Home Screen"; the Dashfixe icon appears.
4. Read `/cookies`: it names the two cookies and what the browser keeps.

### Revision 1.7 · Smart search ✅ (branch `feat/smart-search`)

The owner asked for location on arrival, trade recognition, an assistant for "Something
else", and Book for later through the home's slot picker:

- ✅ **The trade is recognised from what's typed** (`lib/classify.ts`, EN and PT). The
  chip shows the matched word, and the `TradePicker` sheet changes it. Every trade has
  sample artisans, and the list and the map filter by trade.
- ✅ **"Something else" opens the Dashfixe assistant.** The customer describes the
  problem, it works out the trade (or asks), and it opens `/explore` filled in.
- ✅ **Location is asked for on arrival** (map pages, once, only after a tap). It drives
  every map and ETA, and "Change area" focuses the address field.
- ✅ **"Book for later" on the home** scrolls to "Plan it for later", and **Next**
  carries the need, the trade and the address.

**Owner test:**
1. Open `/` in a private window: the location card appears. Share, and "Around <your
   street>" updates.
2. Type "kitchen tap is leaking": the chip says Plumbing, matched from "tap". Tap it and
   pick Electrical.
3. Tap "Something else", then type "the socket sparks": it suggests electricians, and
   "See electricians near me" opens the search filled in.
4. Switch the hero to "Book for later": it scrolls to the calendar, and Next keeps your
   words.

### Revision 1.8 · The account dashboard ✅ (branch `feat/account`, after #15)

The owner asked for the profile to have its own page, "like his own dashboard" with a
balance and credits:

- ✅ **`/account`:**
  - profile editing and stats
  - Dashfixe credit, with a promo code and a history
  - an invite code
  - your artisans, with Rebook
  - saved places
  - payment methods, honest that they come with the pilot
  - preferences
  - download or clear your data
- ✅ **Credit is spent on the next booking,** said at the chat's confirm step, and shown
  as its own receipt line.
- ✅ **Activity is jobs only.** Account is in the account menu and the mobile sheet.

**Owner test:**
1. Sign in, open the account menu, then **Account**.
2. Tap **Edit** by your name, change it and save: the header follows.
3. Enter `PILOT10` and tap **Apply**: the balance shows €10.00. Apply it again and it
   says it was already used.
4. Book Tiago from `/explore`. Confirm says "you pay €53.00", and the job's receipt shows
   Dashfixe credit −€10.00. Back on Account, the credit is €0.00 and the history says
   where it went.

### Revision 1.9 · A designed slot picker ✅ (branch `feat/date-picker`, after #16)

The owner said the "Plan it for later" calendar was the browser default:

- ✅ **One `SlotPicker`** for the home card and `/explore`: a month calendar with quick
  picks, and two-hour windows grouped by time of day. A popover on desktop, a bottom
  sheet on phones.
- ✅ **A real 30-day horizon.** Dates past the first week used to be clamped to day 7
  silently.
- ✅ **Same-day windows need an hour's notice.** Passed windows are crossed out, and a
  day that's over can't be picked.

**Owner test:**
1. On `/`, scroll to "Plan it for later" and tap the date: a calendar opens. Pick a day
   three weeks out, then tap Next: `/explore` shows that same day.
2. Tap the time: morning, afternoon and evening windows. Pick 16–18.
3. On a phone, both open as a sheet from the bottom.
4. Late in the day, today is greyed out; earlier, today's passed windows are crossed out.

### Revision 2.0 · The artisan app ✅ (branch `feat/artisan-app`)

The owner agreed to build the artisan side next: Uber's driver app, for tradespeople.

It started as an interactive walkthrough. The owner then asked for a reference page
instead: preview screens and "download for iOS and Android", the way product sites
present an app. It also asked for the customer app to be promoted.

- ✅ **`/pro`** is the artisan app's showcase: the pitch, four still screens (Today,
  offer, estimate, earnings), what's in the app, and "Get the app with the pilot". It's
  not interactive.
- ✅ **Store badges say "Coming soon"** and link nowhere. This follows the honesty rule
  as the owner updated it on 2026-09-14 (`../Dashfixe.md`). They become real links when
  the apps are published.
- ✅ **"Do more with the app"** closes the visitor home, with customer-app stills.
  Signed-in customers get the **"Do more on the Dashfixe app"** band on the home panel,
  Activity and Account.
- ✅ **The design's money is kept as real arithmetic** (`lib/pro.ts`): IVA 23%, and a 12%
  example commission on finished jobs only. The stills show €61.01 → €53.69.
- ✅ **Production checks** now cover `/account`, `/pro`, 30-day slot URLs and
  `robots.txt`.

**Owner test:**
1. On `/` signed out, scroll to the end: **Do more with the app**, with three phone
   screens and "Coming soon" badges.
2. Tap **See the Dashfixe Pro app** to open `/pro`: four app screens, and what's in the
   app.
3. Sign in, then open **Activity** or **Account**: the **Do more on the Dashfixe app**
   band is at the bottom.

### Revision 2.1 · A working bell ✅ (branch `feat/notifications`)

- ✅ **Notices come from the customer's own jobs and credit:** booked, on the way,
  started, receipt ready, "rate your job" until rated, cancelled with no charge, and
  credit added.
- ✅ **An unread count on the bell.** Opening the panel marks everything read, and a job
  that moves on raises a fresh notice.
- ✅ **Each notice links where it's about;** "See all activity" closes the panel.

**Owner test:**
1. Sign in: the bell shows **5**. Open it to see Tiago on the way, two receipts, "Rate
   your job with Rita" and a cancelled job.
2. Close and reopen it: the count is gone.
3. Enter `PILOT10` on Account: the bell shows **1** new, "€10.00 Dashfixe credit added".

### Still open in Phase 5 (operator steps, no code)

- ⬜ **Real SMS codes when funded.** Set the three `TWILIO_*` vars. Until then, pilot mode
  signs people in on Send code; the structure (codes, attempts, signed challenge) is
  already in place and tested.

- ⬜ **Vercel env vars.** Set `DATABASE_URL` and `AUTH_SECRET` (plus `TWILIO_*` when
  ready), and `SITE_URL` once the domain is chosen. Then verify one production login and
  one waitlist row.
- ⬜ **Launch day.** Set `VITE_LAUNCHED=true` and redeploy. The honesty badges stay until
  real supply replaces the sample data (Phase 6).

## Dashfixe Pro · the artisan world ✅ (built 2026-09-14: "continue till we finish")

The owner wants artisans to have a world of their own, the way Uber keeps drivers apart:
uber.com/drive (marketing), drivers.uber.com (the portal) and the Driver app, with their
own navigation, look and sign-in, never mixed with the rider experience. Agreed on
2026-09-14: the name is **Dashfixe Pro**, and it's planned only — the owner starts it.
The `/pro` app showcase from #18 becomes the Pro app page (`/pro/app`).

**The map (Uber → Dashfixe Pro):**

| Uber | Dashfixe Pro | What it is |
|---|---|---|
| uber.com/drive | `/pro` | Artisan-only marketing: earnings, how it works, vetting, "no lead fees", FAQs. Own header and footer in the design's darker chrome. `/for-artisans` redirects here. |
| Driver sign-up | `/pro/apply` | A multi-step application (trade, area, experience, documents, availability), then an application-status page. Replaces the short form. |
| Driver login | `/pro/login` | Phone sign-in on the same auth, with the pilot bypass until SMS is funded. |
| drivers.uber.com | `/pro/dashboard` | The artisan's web dashboard: jobs, schedule, earnings, profile and documents. The #18 walkthrough in git history (`1689211`) is a head start. |
| Driver app page | `/pro/app` | The artisan app's download page. Today's `/pro` showcase moves here when the Pro landing takes `/pro`. |
| Driver help | `/pro/help` | Payouts, commission, cancellations, documents. |

**Decisions already made:**
- **A path, not a subdomain, for now.** There's no domain yet. `/pro` works today and can
  later be served at `pro.<domain>` with a Vercel rewrite, with no rebuild.
- **Worlds don't share a menu.** The customer site's "Become an artisan" goes to `/pro`.
  On `/pro`, a small "Need a repair? Go to Dashfixe" link goes back.
- **One account, two roles.** One Dashfixe account can be a customer and an artisan,
  like one Uber account can ride and drive. The artisan side adds an artisan profile
  with an application status (applied → in review → approved).
- **Still one `Header` component.** It gets a `pro` surface variant (darker chrome, Pro
  nav), so the "one header" rule holds.

**Delivery, one PR each:**
1. ✅ **Pro shell and landing** (rev 2.2, branch `feat/pro-shell`). The `pro` header
   and footer, and `/pro` with the For artisans content reworked (plus a live app
   still). `/for-artisans` → `/pro` with a 308 that keeps the `#section`. The app
   showcase moved to `/pro/app`.

   **Owner test:**
   1. Open `/for-artisans`: you land on `/pro`, in the dark Pro header.
   2. The nav has How it works, Earnings, Vetting and The app, plus Apply. "Need a
      repair?" goes back to the customer site.
   3. From the customer site, "Become an artisan" lands on `/pro`.
2. ✅ **Application** (rev 2.3, branch `feat/pro-apply`, on top of #20).
   - `/pro/apply` has four checked steps: about you, your work, where and when, papers.
     Each step checks itself, and focus moves to the first error.
   - A review with Edit links, then submit. The profile is added to
     `POST /api/artisans/apply`, validated, with consent required, and a reference comes
     back.
   - `/pro/application` shows the status timeline. The landing's apply section becomes
     a start card, which reads "See your application" once you've applied.

   **Owner test:**
   1. On `/pro`, tap **Apply**, then tap **Continue** with nothing filled in: each
      missing field says what it needs.
   2. Fill the four steps. The review lists everything, with Edit links.
   3. Send it: the status page shows your reference and the WhatsApp call as the next
      step.
   4. Back on `/pro`, the apply card says **See your application**.
3. ✅ **Artisan login and dashboard** (rev 2.5, branch `feat/pro-dashboard`, on top of
   #21).
   - `/pro/login` is the same phone sign-in, in the minimal Pro header.
   - `/pro/dashboard` shows the status and next step, a call checklist based on the
     application, hours and radius, the profile, and a badged sample preview.
   - The Pro header shows Log in, or Dashboard once signed in.

   **Owner test:**
   1. On `/pro`, tap **Log in** and use any number: you land on your dashboard.
   2. Apply first and the dashboard fills in: your reference, the WhatsApp call next,
      and a checklist to tick off.
   3. Change your hours and radius, then reload the page: they're kept.
4. ✅ **Help for artisans** (rev 2.6, branch `feat/pro-help`, on top of #23).
   - `/pro/help` covers pay, jobs, estimates, papers, safety and your account, then a
     person to talk to.
   - It's linked from the Pro header, mobile menu, footer and dashboard. It's indexed,
     in the sitemap, covered by axe and the production checks.

   **Owner test:**
   1. From any Pro page, tap **Help**. The topic chips jump to each section.
   2. The Pro footer's Help centre and Contact links stay in the Pro world.

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
