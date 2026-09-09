# Design notes for the code

The design system itself is locked in `../designs/Dashfixe Design System - Web.dc.html` and
summarised in `../Dashfixe.md` §5. This file records the decisions made **while implementing**
that the design files do not spell out.

## Type scale (Phase 0)

The design files' marketing sizes (hero 74px, sections 48px) read oversized next to
uber.com, which is the reference the owner set. The public pages now use these tokens from
`tailwind.config.js`; product surfaces (`/explore`, signed-in home) keep the design system's
web scale (`title 34 · section 19 · row 16.5 · body 14.5 · meta 13.5 · label 12`).

| Token | Size | Use |
|---|---|---|
| `text-display` | `clamp(34px, 4.4vw, 52px)` / 800 / −4% | One per page: the hero headline |
| `text-h2` | `clamp(24px, 2.8vw, 34px)` / 800 / −3% | Section headings |
| `text-h3` | 20 / 800 / −2% | Card titles |
| `text-lead` | 15.5 / 500 / 1.55 | Intro paragraphs under a heading |
| `text-nav` | 14 / 700 | Navigation links and text buttons |

Rules of thumb: body copy 14.5, never above 15.5; buttons 15/700 at 52px tall for hero
actions, 14.5 at 44px elsewhere; section rhythm `pb-[clamp(48px,6vw,80px)]`.

## The live map (Phase 1)

- **Tiles:** OpenFreeMap "positron" (vector, OpenStreetMap). Free, keyless, attribution
  rendered bottom-right. Positron is the "desaturated real tiles" the design system asks for.
- **Tint:** water `#d9e3f3`, background `#f4f6fa`, parks `#e6eee4` — set on load in
  `tintBasemap()` so the basemap sits inside the brand-tint family rather than looking pasted in.
- **Markers** follow the design: available = 40px, radius 13, 2px brand border, initials;
  on a job = 36px dashed `ink-30`; selected = brand pill `price · ETA` with a 72px pulse;
  your address = 38px ink circle with the home glyph and a 9px stem. They are React
  components rendered through portals, so tokens stay in one place.
- **Radius:** a 5 km circle as a fill (5%) + dashed line (45%) layer, so it scales with zoom.
- **Motion:** 650ms ease to the midpoint of you and the selected artisan; 800ms fly to your
  address on locate; zoom steps of 1. No idle animation on markers — sample data must not
  look alive.
- **Layout:** desktop is `minmax(340px,436px)` panel + map, both pinned to `100dvh − 69px`
  header; only the panel scrolls. Under 1024px the page stacks and the map is 520px tall.
- **Frosted glass** is used only over the map (key card), per the design rule.

## Honesty in the UI

Sample supply is always badged: the warning-tint chip on Nearby cards and the
"Sample artisans · real map" chip on the map. The live dot next to "Amora & Seixal · live"
refers to the map, not to artisans.
