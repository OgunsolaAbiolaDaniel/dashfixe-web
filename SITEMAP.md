# Dashfixe — site map and build order

> **Revision 1 (2026-09-11):** `docs/ARCHITECTURE.md` is now the source of truth for
> which pages exist and how they connect; this file is kept as the design-file index.
> The Flow ordering below still describes the *designs*, but several of its screens were
> deliberately cut or folded in revision 1: `/fix` and `/book` are modes of `/explore`,
> `/coverage` is a section of `/about`, and the three artisan pages are one `/for-artisans`
> with anchors. Cut paths redirect — see `src/AppRoutes.tsx`.
>
> **Revision 1.5 (2026-09-12):** every designed customer screen is built. The statuses
> below are current. `/how-it-works` was added (not in Flow), and the waitlist is parked.

The canonical ordering comes from **`Dashfixe Flow.dc.html`** in the Claude Design project
("Dashfixe Home Repair Design", `3b0cdabf-620a-4669-bb28-0c9eae098362`). That file is the
designer's own map of how the pages connect — four lanes, in the order somebody actually moves
through them. This document mirrors it and adds the route each design lands on.

If Flow and this document disagree, Flow wins and this gets corrected.

Legend: **built** = live in this repo · **planned** = designed, not yet implemented ·
**to design** = named in Flow, no design file yet.

---

## Lane 1 · Arriving

Two front doors, depending on whether we have launched.

| Screen | Design file | Route | Status |
|---|---|---|---|
| Waitlist landing | `Dashfixe waitlist.dc.html` | `/waitlist` | **built · parked** (rev 1.5: not linked, `noindex`) |
| Home — signed out | `Dashfixe Home v2(real).dc.html` | `/` | **built** |
| Home — signed in | same file, second screen | `/` (after auth) | **built** (map-first, rev 1.1) |

The home page is the front door. The waitlist is reachable but no longer promoted, and
`VITE_LAUNCHED=true` redirects it to `/`.

---

## Lane 2 · Getting something fixed

Every screen lives inside one design file: `Dashfixe Customer Pages.dc.html`.

**Urgent — the main path**

| Screen | Anchor in the design | Route | Status |
|---|---|---|---|
| Fix now | `#now` | `/fix` → `/explore` | **built** as `/explore` (redirect) |
| Artisan profile | `#profile` | `/artisan/:id` | **built** (rev 1.2) |
| Job & receipt | `#receipt` | `/job/:id` | **built** (booked · on the way · receipt, rev 1.5) |

**Not urgent — the browsing path**

| Screen | Anchor | Route | Status |
|---|---|---|---|
| Plumbing in Amora (trade page) | `#trade` | `/trade/:slug` | **built** (five trades, rev 1.4) |
| Book for later | `#book` | `/book` → `/explore?when=later` | **built** as a mode of `/explore` |

The browsing path rejoins the main path: on the day, a booking becomes a live job.

**Reachable from the footer, any time**

| Screen | Anchor | Route | Status |
|---|---|---|---|
| Help centre | `#help` | `/help` | **built** |
| Coverage | `#coverage` | `/coverage` → `/about#coverage` | **built** as a section of `/about` |
| About Dashfixe | `#about` | `/about` | **built** |
| Search + map app | `Dashfixe Web.dc.html` | `/explore` | **built** (live map, chat → booking) |

> `/explore` is rebuilt from `Dashfixe Web.dc.html` on real OpenFreeMap tiles. The maps live
> in `components/explore/LiveMap.tsx` and `components/job/TrackMap.tsx`, on the shared kit
> in `components/map/kit.ts`, and always load through `components/map/lazy.tsx`. See
> `docs/DESIGN.md` for the map spec.

---

## Lane 3 · Becoming an artisan

Its own site on the navy ground, reached from every customer page.

| Screen | Design file | Route | Status |
|---|---|---|---|
| For artisans (lean) | `Dashfixe for Artisans.dc.html` | `/for-artisans` | **built** |
| Create your profile | `Dashfixe for Artisans.dc.html#apply` | `/for-artisans/apply` → `/for-artisans#apply` | **built** (real application form, posts to the API) |
| The artisan app | `Dashfixe Artisan App.dc.html` | `/artisan-app` → `/for-artisans#app` | **built** as a section |
| Long version, all on one page | `Dashfixe for Artisans (detailed).dc.html` | `/for-artisans/details` → `/for-artisans` | **folded** into the one page (`#pay`, `#vetting`) |

Named in Flow as **to design** — no design file exists yet:

- How you're paid
- Vetting & licensing
- Subcontracting
- AI calls
- Artisan help centre

Every artisan link now lands on `/for-artisans` or one of its anchors, all resolved in one
place, `src/routes.ts`. "How you're paid" and "Vetting & licensing" exist as its `#pay` and
`#vetting` sections. The other three items are still to design.

---

## Lane 4 · Foundations

Not pages. The reference every screen follows.

| Reference | Design file | Consumed as |
|---|---|---|
| Design system — web | `Dashfixe Design System - Web.dc.html` | `tailwind.config.js` tokens |
| Design system — app | `Dashfixe Design System - App.dc.html` | app scales, for `dashfixe-mobile` |
| Customer app screens | `Dashfixe Design.dc.html` | the mobile flow the web mirrors |
| Home v1 | `Dashfixe Home.dc.html` | superseded by v2, kept for comparison |

---

## Not part of Dashfixe

**`_ds/industry-019e59f9-…/`** is a stock design system called "Industry" — a steel-blue
blueprint/wireframe kit in Barlow Condensed, whose own landing template sells an invented
fastener catalogue. It is attached to the Claude Design project but **no Dashfixe design file
references it**, and its `_adherence.oxlintrc.json` would reject Plus Jakarta Sans and every
Dashfixe hex. Do not apply it. Dashfixe's design system is Lane 4.

---

## Build order — complete

Every item of the original order is built:

1. ~~`/for-artisans`~~ — Phase 3.
2. ~~`/explore`~~ — Phase 1.
3. ~~`/fix` → `/artisan/:id` → `/job/:id`~~ — Phases 3–4. `/fix` became `/explore`.
4. ~~`/trade/:slug` and `/book`~~ — rev 1.4. `/book` became `/explore?when=later`.
5. ~~`/help`, `/coverage`, `/about`~~ — Phase 3. `/coverage` became `/about#coverage`.

What remains is Phase 6 (real supply and live operations) in `docs/BUILD_PLAN.md`, plus
the three artisan screens that are still to design.
