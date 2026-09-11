# Dashfixe web — handover

> Read this first when picking the project up on another machine or in a new session.
> Business context, design system and locked copy live one folder up in
> `../Dashfixe.md` (full handover) and `../Dashfixemarklatest.md`; the design files are in
> `../designs/`. This file is about **the code and where it stands**.

**Last updated:** 2026-09-11 · **Branch:** `main` ·
**Remote:** `github.com/OgunsolaAbiolaDaniel/dashfixe-web` · **Deploy:** Vercel (`.vercel/`)

---

## Where we stopped

Phases 0–4 of `docs/BUILD_PLAN.md` are done; 0–3 are merged (#4–#6) and `main` is green.

Phase 4 (branch `feat/job-loop`) closed the job loop: `/artisan/:id` (public trust
page), `/job/:id` (tracking with `TrackMap`, receipts with rating), a real chat store,
the shared map kit in `components/map/kit.ts` (**the worker gotcha lives THERE now**),
and the later-mode slot in the URL. Start any new session by reading
`docs/ARCHITECTURE.md` (rev 1.2). Next work: Phase 5 — backend endpoints, phone-OTP
auth, CI, the MapLibre code-split, SEO and the launch switch.


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
npm run dev        # http://localhost:5173  (also on your LAN IP)
npm run check      # typecheck + lint + tests — must be green before a commit
npm run build      # typechecks, then bundles to dist/
npm run preview    # serves dist/ on 4173
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
3. `npm run check` — 48 tests should pass.
4. `npm run dev` and open `/`, `/waitlist`, `/explore`.
5. No env vars, no API keys. The map uses OpenFreeMap's public tiles (fair-use, attribution is
   rendered). If they ever rate-limit, `MAP_STYLE` in `LiveMap.tsx` is the one line to change.

## Layout of the code

```
src/
  App.tsx            routes (react-router); one AuthSheet for the whole app
  routes.ts          route table + link() fallback for unbuilt pages (SITEMAP.md)
  search.ts          the search carried in the URL between home and /explore
  auth.tsx           in-memory session; gate() is the commit point
  lib/geo.ts         LngLat helpers: distance, ETA, bounds, radius polygon
  lib/geocode.ts     address search + reverse geocode (Nominatim, offline fallback)
  i18n/              EN/PT dictionaries, LangProvider/useLang, translate()
  components/shared  MobileMenu · LangToggle · AddressField
  i18n/Rich.tsx      translated sentences with links or other nodes inside
  pages/             HomePage · WaitlistPage · ExplorePage
  components/home    public + signed-in home sections
  components/waitlist
  components/explore SearchPanel · LiveMap (real) · MapCanvas (fallback) · ChatPanel · artisans.ts
  components/icons.tsx
  test/              vitest setup + MapLibre stub
scripts/shot.mjs     headless screenshot via CDP
docs/                BUILD_PLAN · HANDOVER · DESIGN
```

## Gotchas (each one cost real time)

- **MapLibre's worker.** MapLibre 6 spawns its tile worker from
  `new URL('./maplibre-gl-worker.mjs', import.meta.url)`. Vite's dep pre-bundling moves the
  entry so that URL 404s; the production build never emits the worker at all. Either way the
  failure is **silent**: tiles never parse, `load` never fires, the map is a blank grey box.
  Fix in place: `optimizeDeps.exclude: ['maplibre-gl']` + `worker.format: 'es'` in
  `vite.config.ts`, and `maplibregl.setWorkerUrl(import ... '?worker&url')` in `LiveMap.tsx`.
  Do not remove either half.
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
(`Nearby.tsx` badge, the "Sample artisans · real map" chip on the map). Keep those until the
pilot cohort is real. See `../Dashfixe.md` §2 for the full list of forbidden claims.
