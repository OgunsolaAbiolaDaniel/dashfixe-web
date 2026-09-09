# Dashfixe — web

Marketplace for skilled tradespeople in Portugal, starting with a pilot in Amora & Seixal.
This is the customer-facing website: waitlist, home, and the search-and-map surface.

React 19 · Vite 8 · TypeScript 5 · Tailwind 3 · react-router 7 · MapLibre GL (OpenFreeMap tiles)

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck + lint + tests
npm run build    # production bundle in dist/
```

Routes today: `/` (home, signed out and signed in) · `/waitlist` · `/explore`.
Everything else resolves through `src/routes.ts` until its page lands — see `SITEMAP.md`.

Docs:

- `docs/HANDOVER.md` — where the project stands, how to run and migrate it, gotchas
- `docs/BUILD_PLAN.md` — the phased plan and the definition of done
- `docs/DESIGN.md` — implementation-level design decisions (type scale, the map)
- `SITEMAP.md` — every designed screen and its route
- `../Dashfixe.md` — business context, locked copy, design system (one folder up)

No API keys are needed. Map tiles come from OpenFreeMap's public endpoint.
