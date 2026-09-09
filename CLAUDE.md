# Working on dashfixe-web

Start with `docs/HANDOVER.md`, then `docs/BUILD_PLAN.md` for what is next.

- Build one phase at a time; finish green (`npm run check`) and leave it **uncommitted** —
  the owner reviews in a browser and commits.
- Update `docs/HANDOVER.md` → "Where we stopped" at the end of every pass.
- Design files in `../designs/` and `../Dashfixe.md` are the visual and copy contract.
  Marketing type uses the `display/h2/h3/lead/nav` tokens (see `docs/DESIGN.md`).
- Never claim live supply. Sample artisans stay badged as sample data.
- The in-app preview cannot render WebGL; verify the map with `node scripts/shot.mjs`.
- Do not touch the MapLibre worker wiring in `vite.config.ts` / `LiveMap.tsx` without reading
  the gotcha in the handover.
