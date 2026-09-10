# Dashfixe web — handover

> Read this first when picking the project up on another machine or in a new session.
> Business context, design system and locked copy live one folder up in
> `../Dashfixe.md` (full handover) and `../Dashfixemarklatest.md`; the design files are in
> `../designs/`. This file is about **the code and where it stands**.

**Last updated:** 2026-09-10 · **Branch:** `feat/site-rebuild-from-designs` ·
**Remote:** `github.com/OgunsolaAbiolaDaniel/dashfixe-web` · **Deploy:** Vercel (`.vercel/`)

---

## Where we stopped

Phases 0 and 1 of `docs/BUILD_PLAN.md` are done. **Phase 2 is part-way**: the pieces below
are built, green (`npm run check`, 39 tests) and committed; the rest is listed under
"Phase 2 · still to do" in the build plan.

Phase 2 so far:

- **Map-peek hero.** The stock photo on `/` is now the live map (`LiveMap variant="peek"`:
  no chrome, no interaction). Picking an address in the composer re-centres it.
- **Mobile nav.** `components/shared/MobileMenu.tsx` (hamburger sheet, Escape/overlay close,
  scroll lock). Wired into `PublicNav` only so far.
- **Address autocomplete.** `components/shared/AddressField.tsx` + `lib/geocode.ts`:
  Nominatim bounded to the pilot area, 350 ms debounce, offline fallback list of pilot
  streets, "use my location" via Geolocation + reverse geocode.
- **EN/PT.** `src/i18n/` holds every public string in both languages (a test fails if the
  two drift). `LangProvider` is mounted in `App.tsx`; the choice persists in localStorage
  and sets `<html lang>`. Only the nav, hero, map and mobile menu read from it yet.
- **Supply by location.** `getSupply(home)` in `explore/artisans.ts` derives distance and
  ETA from wherever the customer is; the search URL now carries `lng`/`lat`.

Known gap: the hero writes `lng`/`lat` into the `/explore` URL, but `ExplorePage` does not
read them yet, so `/explore` still centres on the sample address.

What changed in this pass, in one screen:

| Area | Change |
|---|---|
| Tooling | Vitest + Testing Library; `npm run check`; TS pinned to 5.x so ESLint works; `scripts/shot.mjs` |
| Type | New `display / h2 / h3 / lead / nav` tokens; every home section moved off ad-hoc `clamp()` sizes |
| Map | `LiveMap.tsx` on MapLibre + OpenFreeMap; `lib/geo.ts`; coordinates on every sample artisan |
| Explore | Map pins to the viewport on desktop, panel scrolls; header collapses on small screens |
| Fixes | MapLibre worker never loaded in dev **or** prod (silent); `auth.tsx` lint; unused var in WaitlistPage |

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
3. `npm run check` — 39 tests should pass.
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
  not synchronously inside an effect. Non-component exports live in their own file
  (`i18n/translate.ts`) so fast refresh keeps working.

## Honesty rules that shape the code

Nothing on the site claims live supply. Every list of artisans is labelled sample data
(`Nearby.tsx` badge, the "Sample artisans · real map" chip on the map). Keep those until the
pilot cohort is real. See `../Dashfixe.md` §2 for the full list of forbidden claims.
