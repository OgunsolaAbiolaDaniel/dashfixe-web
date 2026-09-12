# Working on dashfixe-web

Start with `docs/HANDOVER.md`, then `docs/ARCHITECTURE.md` (the authority on routes, state
and the API) and `docs/BUILD_PLAN.md` for what is next.

- Work on a feature branch off `main`. Finish every chunk green (`npm run check`, and
  `npx vite build && npm run smoke` when the build or a journey changed), then commit it —
  the owner asked for progressive commits — and open a PR to `main`. The owner merges.
- Update `docs/HANDOVER.md` → "Where we stopped" at the end of every pass, and the
  ARCHITECTURE revision line when routes, state or the API change.
- Design files in `../designs/` and `../Dashfixe.md` are the visual and copy contract.
  Marketing type uses the `display/h2/h3/lead/nav` tokens (see `docs/DESIGN.md`).
- Never claim live supply. Sample artisans, chat replies and receipts stay labelled as sample.
- One header for every page: `components/chrome/Header.tsx` (never build another).
- Import maps only from `components/map/lazy.tsx` (ESLint enforces it; a direct import puts
  ~800 kB of MapLibre back in the entry chunk).
- Do not touch the MapLibre worker wiring in `vite.config.ts` / `components/map/kit.ts`
  without reading the gotcha in the handover.
- Server code under `src/server/` imports with `.js` extensions (Vercel runs it as plain
  Node ESM) and is never imported by client code.
- The in-app preview cannot render WebGL; verify maps with `node scripts/shot.mjs`.
- Every string goes in both dictionaries in `src/i18n/strings.ts` (a test checks parity).
- New per-browser stores must be reset in `src/test/setup.ts` so tests stay isolated.
