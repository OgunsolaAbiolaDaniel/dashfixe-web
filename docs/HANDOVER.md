# Dashfixe web — handover

> Read this first when picking the project up on another machine or in a new session.
> Business context, design system and locked copy live one folder up in
> `../Dashfixe.md` (full handover) and `../Dashfixemarklatest.md`; the design files are in
> `../designs/`. This file is about **the code and where it stands**.

**Last updated:** 2026-09-12 · **Branch:** `feat/launch-hardening` (PR to `main`) ·
**Remote:** `github.com/OgunsolaAbiolaDaniel/dashfixe-web` · **Deploy:** Vercel (`.vercel/`)

---

## Where we stopped

Phases 0–4 are done and merged. Phase 5's code is done. #1–#8 are merged, including
revision 1.3 (the pilot backend and `/login`), and `main` is green.

**Revision 1.4**, on branch `feat/launch-hardening`, is launch hardening. Three commits,
each one green:

- **Lazy map.** MapLibre is code-split: always import maps from
  `components/map/lazy.tsx`, which ESLint enforces. Entry JS dropped from 1,445 to
  424 kB.
- **Lighter images.** 3× brand PNGs and a JPEG OG card.
- **SEO pack.** `src/seo.ts` drives both the runtime tags and a static head per route
  generated at build, plus the sitemap and `robots.txt`.
- **Trade pages.** Five `/trade/:slug` landing pages.
- **Launch switch.** `VITE_LAUNCHED`.
- **Smoke tests.** Playwright (`e2e/`) runs against the built app, as a CI job after
  `check`.
- **Two honesty/UX fixes:** the explore chip no longer says "live", and the address
  field's suggestion list no longer opens on load.

Start any new session by reading `docs/ARCHITECTURE.md` rev 1.4:
- §4 covers the route map, and search and sharing
- §6 holds the endpoints and the env table
- §7 covers the maps and the lazy rule
- §8 covers testing

**Next:** Phase 5's operator steps (Vercel env vars, then `VITE_LAUNCHED` on launch day),
then Phase 6, which is real supply and live operations.


> **What happened on 2026-09-10.** Phase 2 was built on two machines at once. The second working
> copy synced its half-finished state straight onto `main`. When `main` was then merged back into
> `feat/site-rebuild-from-designs`, the conflicts were resolved by taking `main`'s side. That
> dropped most of the Phase 2 finish (commit `76a9ce1`) and left `main` failing `tsc`, so the
> Vercel build broke. The restore branch replays `76a9ce1` onto `main`. It keeps the second
> machine's fixes (peek mode in `MapCanvas`, `translate()` in `strings.ts`, derived suggestion
> visibility in `AddressField`, the waitlist footer key) and brings back what the merge lost.
>
> **To avoid a repeat:** work from one machine at a time, `git pull` before starting, never resolve
> a merge by taking one side wholesale, and run `npm run check` after every merge.

> **Careful:** a runtime-only failure, like a provider that is never mounted, passes both `tsc`
> and the test suite. Screenshot the real pages (`scripts/shot.mjs` prints console errors) before
> shipping.

Phase 2 as a whole:

- **Map-peek hero.** The stock photo on `/` is the live map (`LiveMap variant="peek"`: no
  chrome, no interaction). Picking an address re-centres it.
- **One address, everywhere.** A picked address, or a typed one looked up on submit, rides
  into `/explore` as `lng`/`lat`. The map, the list, distances and arrival times are all worked
  out from it with `getSupply(home)`. "Use my location" refuses a position outside the pilot
  box rather than pinning the customer 30 km from every sample artisan.
- **Phone menu.** `components/shared/MobileMenu.tsx` on the public nav, the signed-in nav and
  the `/explore` header. The language toggle is on all three.
- **Address autocomplete.** `components/shared/AddressField.tsx` + `lib/geocode.ts`: Nominatim
  bounded to the pilot area, 350 ms debounce, an offline list of pilot streets, and "use my
  location" via Geolocation + reverse geocode.
- **EN/PT across the customer side.** Every string on `/`, the signed-in home, `/explore`,
  chat, the auth sheet and the map fallback reads from `src/i18n/`. A test fails if keys or
  `{placeholders}` drift between languages. `i18n/Rich.tsx` handles sentences with links in
  them. The choice persists in localStorage and sets `<html lang>`.
- **Derived sample data.** The "Free in Amora" cards use `getNearby()`. The signed-in home's
  buttons (find, rebook, open chat, quick request) open `/explore` at the saved address.

Known gaps, on purpose:

- **`/waitlist` is not translated.** It keeps its own local EN/PT toggle and English copy. It
  is a separate page with locked copy (`../Dashfixe.md` §6); translating it is its own task.
- **"Change area"** in the hero still opens the auth sheet. It needs a real area picker once
  there is more than one pilot area.

What changed in the latest pass (Phase 2, second half):

| Area | Change |
|---|---|
| `/explore` | Reads `lng`/`lat`; map, list, ETAs and median follow the address; header has the phone menu and shared language toggle |
| i18n | Remaining home sections, footers, signed-in home, search panel, chat, auth sheet and map fallback moved onto `t()` |
| Hero | Typed-but-unpicked addresses are looked up on submit (2.5 s cap); locations outside the pilot area are refused with a notice |
| Data | `getNearby(home)` for the home cards; signed-in home actions carry the saved address into `/explore` |
| Tests | New `HomePage.test.tsx` (composer, typed lookup, PT switch, phone menu, out-of-area location, derived cards) and URL-location test on `/explore` |

## Run

```bash
npm install
npm run dev        # http://localhost:5173 — including the FULL pilot API, zero secrets
npm run check      # typecheck + lint + tests — must be green before a commit
npm run build      # typechecks, then bundles to dist/ (+ per-route heads, sitemap, robots)
npm run preview    # serves dist/ on 4173 — with the pilot API
npm run smoke      # Playwright on the built app (build first); PW_CHANNEL=msedge reuses Edge
```

Headless screenshot of any page (needs a Chromium: Playwright's cache, Chrome or Edge):

```bash
node scripts/shot.mjs "http://localhost:5173/explore?need=tap" shot.png 1440 900 12000
```

Optional 6th argument is a JS expression evaluated in the page and printed, e.g.
`"document.querySelectorAll('.maplibregl-marker').length"`.

## Migrating to another machine

1. Clone the repo and `npm install` (Node 24 is what this was built on; 20+ should work).
2. Copy the parent folder's `designs/`, `Dashfixe.md`, `Dashfixemarklatest.md` alongside the
   repo if you want the design context — the code does not depend on them.
3. `npm run check` — 108 tests should pass. Then `npx vite build && npm run smoke` —
   6 smoke journeys (set `PW_CHANNEL=msedge` or run `npx playwright install chromium`).
4. `npm run dev` and open `/`, `/waitlist`, `/explore`, `/trade/plumbing`.
5. No env vars, no API keys. The map uses OpenFreeMap's public tiles (fair-use, attribution is
   rendered). If they ever rate-limit, set `VITE_MAP_STYLE` (read in `components/map/kit.ts`).

## Layout of the code

```
src/
  App.tsx            BrowserRouter > LangProvider > AuthProvider > AppRoutes
  AppRoutes.tsx      the route tree, redirects for cut pages, HashScroll, RouteMeta (SEO)
  routes.ts          ROUTES + link() + artisanUrl/jobUrl/tradeUrl + TRADE_SLUGS
  config.ts          build-time switches (launched())
  seo.ts             per-route title/description/robots; build renderers (heads, sitemap, robots)
  search.ts          the search carried in the URL between home and /explore
  auth.tsx           server-backed session (/api/auth/me); requireAuth() → /login?next=
  server/            handlers (the pilot API), store (Postgres | memory), session, sms
  lib/               geo · geocode · api (fetch client) · jobs (sample) · places (localStorage)
  i18n/              EN/PT dictionaries, LangProvider/useLang, translate(), Rich.tsx
  pages/             Home · Explore · Activity · ArtisanProfile · Job · Login · Trade ·
                     ForArtisans · About · Help · Legal · Waitlist
  components/chrome  SiteNav · SiteFooter · MarketingShell · AppBar
  components/map     kit.ts (MapLibre + WORKER WIRING) · lazy.tsx (the only map import)
  components/explore SearchPanel · LiveMap · MapCanvas (fallback) · ChatPanel · artisans.ts
  components/job     TrackMap
  components/home    public + signed-in home sections
  components/shared  MobileMenu · LangToggle · AddressField · PhotoPick
  test/              vitest setup · MapLibre stub · pilot API fetch mock
api/router.ts        Vercel adapter for server/handlers (vercel.json rewrites /api/* here)
e2e/                 Playwright smoke suite (playwright.config.ts at the root)
scripts/shot.mjs     headless screenshot via CDP
docs/                ARCHITECTURE · BUILD_PLAN · HANDOVER · DESIGN
```

## Going live (Vercel env)

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | persistence | Neon connection string; tables auto-create on first use |
| `AUTH_SECRET` | sessions | any long random string; rotating it logs everyone out |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | real SMS codes | without them login shows labelled pilot codes on screen |
| `VITE_MAP_STYLE` | optional | switch tiles to a keyed provider without code changes |
| `SITE_URL` | canonical/OG/sitemap URLs | e.g. `https://dashfixe.pt`; absent → Vercel's production hostname |
| `VITE_LAUNCHED` | launch day | `true` retires `/waitlist` to `/` and drops it from the sitemap |

After setting the first two: deploy, join the waitlist in production, log in once, and
check the rows in Neon. That is the go-live smoke test. Then paste a `/trade/plumbing`
link into WhatsApp — the card should show that page's title and the map image.

## Gotchas (each one cost real time)

- **MapLibre's worker.** MapLibre 6 spawns its tile worker from
  `new URL('./maplibre-gl-worker.mjs', import.meta.url)`. Vite's dep pre-bundling moves the
  entry so that URL 404s; the production build never emits the worker at all. Either way the
  failure is **silent**: tiles never parse, `load` never fires, the map is a blank grey box.
  Fix in place: `optimizeDeps.exclude: ['maplibre-gl']` + `worker.format: 'es'` in
  `vite.config.ts`, and `maplibregl.setWorkerUrl(import ... '?worker&url')` in
  `components/map/kit.ts`. Do not remove either half.
- **Map imports go through `components/map/lazy.tsx`.** A direct `import LiveMap from…`
  anywhere puts ~800 kB back in the entry chunk; ESLint (`no-restricted-imports`) fails it.
- **Root-relative URLs in `index.html` get bundled by Vite.** `<link rel="canonical"
  href="/">` resolved to the `public/` folder and failed the build with `EISDIR`. The SEO
  tags carry absolute placeholders; the build and the runtime replace every one.
- **The MapLibre worker is its own sub-build.** Its `closeBundle` fires before the main
  bundle writes `index.html`, so build plugins that read the page must use `writeBundle`
  and check `'index.html' in bundle` (see `seoPages()` in `vite.config.ts`).
- **Per-route pages are `<path>.html`, not `<path>/index.html`.** Vercel's `cleanUrls`
  and `vite preview` resolve `/trade/plumbing` to `trade/plumbing.html`; a directory
  index only matches with a trailing slash.
- **Windows PowerShell 5.1 splits here-strings passed to native commands**, so
  `git commit -m @'…'@` with quotes in it fails. Write the message to a file and use
  `git commit -F <file>`.
- **Vercel functions are not Next.js.** `api/[...path].ts` matched ONE segment, so
  `/api/auth/*` 404'd in production while `/api/waitlist` reached the function. Fixed
  with one `api/router.ts` plus a `vercel.json` rewrite.
- **Vercel runs `api/` as plain Node ES modules.** Extensionless relative imports
  (`./store`) crash at runtime with a 500. Vite and Vitest hide that, so everything under
  `src/server` imports `./x.js`. To prove it without deploying, compile with
  `tsc --module nodenext` (it errors on a missing extension) and `import()` the output
  in Node.
- **Serverless has no shared memory.** An in-memory OTP store fails when `verify` lands
  on a different instance from `request-code`. The pending code now rides in a signed
  cookie (`server/session.ts`).
- **MapLibre's CSS** sets `.maplibregl-map { position: relative }`, which beats Tailwind's
  `absolute` and collapses the map to zero height. `index.css` re-pins `.live-map`.
- **The in-app browser preview cannot render the map** — it never fires
  `requestAnimationFrame`. Use `scripts/shot.mjs` or a real browser for anything WebGL.
- **Vite binds `localhost` to `::1` only on Node 24**; Chrome then refuses 127.0.0.1.
  `server.host: true` fixes it.
- **Tailwind arbitrary `calc()`** needs `_` around operators: `h-[calc(100dvh_-_69px)]`.
  Also, `height` on a flex child is ignored when `flex-1` sets the basis — size the parent.
- **`vi.mock` is hoisted**; the MapLibre stub is a factory (`mapLibreStub`) called from an
  inline `vi.mock(...)` at the top of the test file.
- **`legacy-peer-deps=true`** is in `.npmrc` for Vercel. `@testing-library/dom` had to be
  installed explicitly because of it.
- `window.__dfxMap` is exposed in dev only, for the screenshot probes.
- **`scripts/shot.mjs` can fail to spawn Playwright's Chromium** (`spawn UNKNOWN`) in some
  sandboxed sessions. Point it at Edge: `CHROME_PATH="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"`.
- **Nominatim's usage policy** allows light, debounced, attributed use only. Fine for the
  pilot; swap `ENDPOINT` in `lib/geocode.ts` for a paid geocoder before real traffic.
- **React lint is strict** (`react-hooks/set-state-in-effect`): clear state in event handlers,
  not synchronously inside an effect. Keep non-component exports out of component files
  (`translate()` lives in `i18n/strings.ts`) so fast refresh keeps working.

## Honesty rules that shape the code

Nothing on the site claims live supply. Every list of artisans is labelled sample data
(`Nearby.tsx` badge, the "Sample artisans · real map" chip on the map, the trade pages'
"Sample data" badge and pilot line). The `/explore` area chip says "pilot area" with a
still dot — never "live". Sample artisan profiles are `noindex`. Keep all of it until the
pilot cohort is real. See `../Dashfixe.md` §2 for the full list of forbidden claims.
