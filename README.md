# Dashfixe — web

Marketplace for skilled tradespeople in Portugal, starting with a pilot in Amora & Seixal.
This repo is the whole customer-facing product: the marketing site, the map-first search,
chat → estimate → booking → tracking → receipt, and the pilot API behind it.

React 19 · Vite 8 · TypeScript 5 · Tailwind 3 · react-router 7 · MapLibre GL (OpenFreeMap tiles)
· serverless API on Vercel (`api/router.ts` → `src/server/`)

```bash
npm install
npm run dev      # http://localhost:5173 — site + the full pilot API, zero secrets
npm run check    # typecheck + lint + tests (118)
npm run build    # production bundle in dist/ (+ per-route SEO heads, sitemap, robots)
npm run smoke    # Playwright on the built app (build first; PW_CHANNEL=msedge reuses Edge)
```

Routes: `/` (marketing home; the map-first app home when signed in) · `/explore` ·
`/login` · `/activity` · `/job/:id` · `/artisan/:id` · `/trade/:slug` · `/how-it-works` ·
`/for-artisans` · `/about` · `/help` · legal. `/waitlist` is parked (reachable, not linked).
`docs/ARCHITECTURE.md` §4 is the authority; every link resolves through `src/routes.ts`.

Pilot mode: with no SMS provider configured, **Send code signs you in** — no Twilio needed
to use the site. All artisans, chat replies and receipts are sample data, and say so.

Docs:

- `docs/HANDOVER.md` — where the project stands, how to run and migrate it, gotchas, go-live env
- `docs/ARCHITECTURE.md` — the product architecture: surfaces, journeys, routes, state, API, maps
- `docs/BUILD_PLAN.md` — the phased plan, what is done, what is open, owner tests
- `docs/DESIGN.md` — implementation-level design decisions (type scale, the map)
- `SITEMAP.md` — the historical map of designed screens (ARCHITECTURE wins where they differ)
- `../Dashfixe.md` — business context, locked copy, design system (one folder up)

No API keys are needed to run it. Production needs `AUTH_SECRET` set in Vercel — see
`docs/HANDOVER.md` → "Going live".
