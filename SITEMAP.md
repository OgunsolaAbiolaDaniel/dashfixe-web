# Dashfixe — site map and build order

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
| Waitlist landing | `Dashfixe waitlist.dc.html` | `/waitlist` | **built** |
| Home — signed out | `Dashfixe Home v2(real).dc.html` | `/` | **built** |
| Home — signed in | same file, second screen | `/` (after auth) | **built** |

Pre-launch the waitlist is the real front door; at launch the home page takes over. Both are
live now so the switch is a redirect decision, not a build.

---

## Lane 2 · Getting something fixed

Every screen lives inside one design file: `Dashfixe Customer Pages.dc.html`.

**Urgent — the main path**

| Screen | Anchor in the design | Route | Status |
|---|---|---|---|
| Fix now | `#now` | `/fix` | planned |
| Artisan profile | `#profile` | `/artisan/:id` | planned |
| Job & receipt | `#receipt` | `/job/:id` | planned |

**Not urgent — the browsing path**

| Screen | Anchor | Route | Status |
|---|---|---|---|
| Plumbing in Amora (trade page) | `#trade` | `/trade/:slug` | planned |
| Book for later | `#book` | `/book` | planned |

The browsing path rejoins the main path: on the day, a booking becomes a live job.

**Reachable from the footer, any time**

| Screen | Anchor | Route | Status |
|---|---|---|---|
| Help centre | `#help` | `/help` | planned |
| Coverage | `#coverage` | `/coverage` | planned |
| About Dashfixe | `#about` | `/about` | planned |
| Search + map app | `Dashfixe Web.dc.html` | `/explore` | **built** (live map) |

> `/explore` is rebuilt from `Dashfixe Web.dc.html` on real OpenFreeMap tiles
> (`components/explore/LiveMap.tsx`). See `docs/DESIGN.md` for the map spec.

---

## Lane 3 · Becoming an artisan

Its own site on the navy ground, reached from every customer page.

| Screen | Design file | Route | Status |
|---|---|---|---|
| For artisans (lean) | `Dashfixe for Artisans.dc.html` | `/for-artisans` | planned |
| Create your profile | `Dashfixe for Artisans.dc.html#apply` | `/for-artisans/apply` | planned |
| The artisan app | `Dashfixe Artisan App.dc.html` | `/artisan-app` | planned |
| Long version, all on one page | `Dashfixe for Artisans (detailed).dc.html` | `/for-artisans/details` | planned |

Named in Flow as **to design** — no design file exists yet:

- How you're paid
- Vetting & licensing
- Subcontracting
- AI calls
- Artisan help centre

Until `/for-artisans` is built, every artisan link points at `/waitlist#artisans` — the only
real artisan sign-up that exists today. That redirect lives in one place, `src/routes.ts`.

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

## Build order

1. **`/for-artisans`** — the most-linked missing destination. Every nav, footer and CTA on the
   home page currently detours to the waitlist because it does not exist.
2. ~~**`/explore`**~~ — built. The search-and-map surface from `Dashfixe Web.dc.html`.
3. **`/fix` → `/artisan/:id` → `/job/:id`** — the urgent path, in that order. They share
   components, so building them together is cheaper than one at a time.
4. **`/trade/:slug` and `/book`** — the browsing path.
5. **`/help`, `/coverage`, `/about`** — footer pages, lowest urgency, but they kill the last
   dead links.

Routes 3–5 all come out of one design file, so read `Dashfixe Customer Pages.dc.html` once and
build them as a set.
