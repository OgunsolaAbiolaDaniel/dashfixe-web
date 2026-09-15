# Dashfixe web — handover

> Read this first when picking the project up on another machine or in a new session.
> Business context, design system and locked copy live one folder up in
> `../Dashfixe.md` (full handover) and `../Dashfixemarklatest.md`; the design files are in
> `../designs/`. This file is about **the code and where it stands**.

**Last updated:** 2026-09-15 · **Branch:** `feat/admin-requests` (revision 2.14, the admin
console's third PR), stacked on #34 (`feat/admin-work`, 2.13). Everything through #33 is
merged, including the console's foundation (2.12), and production runs on Postgres ·
**Remote:** `github.com/OgunsolaAbiolaDaniel/dashfixe-web` · **Deploy:** Vercel (`.vercel/`)

---

## Where we stopped

Phases 0–4 are done, Phase 5's code is done, and **Dashfixe Pro is built and live**.

**Production, verified live on 2026-09-15** (`dashfixe-web.vercel.app`, merge `468b70e`):
`node scripts/check-prod.mjs` gives **32/32**, and the "production check" workflow passed
on the deploy.
- Every page loads cold, `/ops` included.
- The security headers are set, and hashed assets are cached for a year.
- The trade pages carry hreflang and JSON-LD.
- The pilot log in works, and a forged session is rejected.
- **`/ops` is switched on:** the owner set `OPS_PHONES` and `OPS_PASSCODE`. A visitor gets
  401 and a signed-in phone that isn't on the list gets 403 `not_ops`, even with a
  guessed passcode.

The four owner-picked chunks are all merged: launch readiness (2.7, #27), `/ops` (2.8,
#28), help with a job (2.9, #29) and the customer journey in Playwright (2.10, #30).
Notes on each are below.

**In progress: the admin console, in three PRs** (owner request, 2026-09-15: "my admin
route… layers of access… a supervisor… I as the super admin can also see the flow").
1. **Foundation** (2.12, #33): accounts, sign-in, setup, roles, team, audit log, and the
   black console frame. Notes below.
2. **Work screens** (2.13, #34): the overview's figures, applications, problem
   reports and the waitlist in `/admin`, with owners, targets, history and logged exports.
   `/ops` redirects here. Notes below.
3. **Supervisor sign-off and chat** (2.14, this branch): Admins send requests on a
   record, Supervisors sign off, every record has a discussion, and the Super admin sees
   all of it plus the team's workload. Notes below.

**What's left is the owner's (no code), in order:**
1. **Claim the console** once 2.12 is live: open `/admin/setup` and enter `OPS_PASSCODE`
   as the setup key. `DATABASE_URL` is set, so admins and the audit log are kept.
2. A domain, then `SITE_URL` and the `PROD_URL` repo variable.
3. The `TWILIO_*` variables when SMS is funded.
4. `VITE_LAUNCHED=true` on launch day.

Then Phase 6: real artisans (recruited through `/pro/apply`), then real jobs, chat
and payouts on the database. The code notes for each revision follow, newest first.

**Revision 2.14**, on branch `feat/admin-requests`, is supervisor sign-off and chat.
ARCHITECTURE §4 "Supervisor sign-off" has the model.
- **Server** (`server/adminApi.ts`, the store's `admin_requests` + `admin_messages`):
  - `requests` (list, create, `/review`, `/withdraw`), `thread` and `messages`
  - approving applies the decision with the requester's name in the audit detail;
    sending back needs a reason; nobody reviews their own; one waiting request per record
    (a partial unique index on Postgres)
- **Screens:**
  - `pages/admin/AdminRequests.tsx`: the queue for reviewers, "my requests" for Admins
  - `RequestPanel` and `Discussion` in `components/admin/work.tsx`, inside both detail
    panels; a "Sign-off pending" pill in the tables
  - a Requests item with a waiting count in the sidebar
  - sign-offs first in the overview's attention list, plus a Team workload panel for
    reviewers
  - a Requests filter on the audit log
- **Tests:** `server/adminRequests.test.ts` (5: the whole flow, refusals, one at a time,
  withdraw, threads) and `pages/admin/AdminRequests.test.tsx` (3: ask and discuss, send
  back with a reason, approve from the panel).

**Revision 2.13**, on branch `feat/admin-work` (#34), gives the console its work.
- **Server** (`server/adminApi.ts`, `adminStats.ts`, the store):
  - the routes: `applications` (+ `/update`), `reports` (+ `/update`), `waitlist`,
    `export`, `history`, `stats` and `people` (names only)
  - Postgres columns: applications gain `owner_id` and `called_at`; reports gain
    `status`, `owner_id`, `resolution`, `called_at` and `resolved_at`; the audit log gets
    an index on `record`
- **Rules, all on the server:**
  - Deciding, or undoing a decision, needs `applications.decide`; an Admin gets
    `needs_supervisor`.
  - An Admin can only take unowned work or let go of their own; `work.assign` gives it
    to anyone.
  - Resolving a report needs a written resolution. Safety reports and reopening need a
    Supervisor.
  - Exports need `data.export` and are always written to the audit log.
- **Screens** (`pages/admin/AdminOverview`, `AdminApplications`, `AdminReports`,
  `AdminWaitlist`, `components/admin/work.tsx`, `Sparkline.tsx`, `lib/consoleData.ts`):
  the overview's figures, attention list, pipeline, coverage and system panels; the
  work tables with tabs, filters, search and bulk actions; detail panels with history;
  CSV export that escapes formula-like cells.
- **`shared/pilot.ts`** holds the pilot's areas (also used by `/pro/apply`) and the
  response targets (applicants 48 h, safety 1 h, other reports 24 h).
- **`/ops`** now redirects to `/admin`. The page, its test and its strings are gone;
  `/api/ops/*` stays for now.
- **Tests:** `server/adminWork.test.ts` (the rules and the stats maths) and
  `pages/admin/AdminWork.test.tsx` (an Admin's limits, a Supervisor's decision and
  export, and safety-first reports).

**Revision 2.12**, on branch `feat/admin-foundation` (#33), is the admin console's foundation.
ARCHITECTURE §4 "The admin console" has the full model.
- **Server** (`server/adminApi.ts`, `passwords.ts`, `session.ts`, `http.ts`, and the
  store's `admins` + `admin_audit`):
  - one-time setup keyed by `OPS_PASSCODE`, race-safe on Postgres through an advisory
    lock
  - email + password sign-in with scrypt, a 15-minute lock after 5 misses, and unknown
    emails that look like wrong passwords
  - starting passwords: once, within 72 h, forced change
  - 12-hour sessions revoked by a session version
  - team management with its guard rails, and a role-scoped audit log
  - `handlers.ts` hands `/api/admin/*` to `adminApi.ts`; the request helpers moved to
    `http.ts`
- **Roles** (`shared/adminRoles.ts`): Super admin, Supervisor and Admin, and one
  permission table read by both the server and the console.
- **Console** (`pages/admin/*`, `components/admin/*`, `lib/adminSession.tsx`,
  `lib/console.ts`):
  - sign-in, setup, and the forced password change
  - the black frame with the role colour (Super admin violet, Supervisor blue, Admin teal)
  - an overview with your access, the team at a glance and recent activity
  - team: add with a suggested starting password shown once, change role, reset, disable
    after a confirm
  - the audit log with filters, and account
  - IBM Plex loads only on console pages; the console is one lazy chunk.
- **Tests:** `server/adminApi.test.ts` has 12 tests: setup, lockout, unknown email,
  starting passwords, 12-hour expiry, role refusals, the guard rails, sign-out on disable
  and reset, and audit scopes. `pages/admin/AdminApp.test.tsx` runs 4 journeys. axe
  checks `/admin`, and `check-prod` checks the console refuses a visitor.
- **Next:** PR 2 (work screens) and PR 3 (supervisor sign-off and chat), per the list
  above.

**Revision 2.11** (#32) added `GET /api/health`, whose `storage` is `postgres` or
`memory`, never the URL. `check-prod` now fails production unless it's Postgres, and a
failed database connection is retried instead of cached.

**Revision 2.10**, on branch `feat/journey`, adds `e2e/journey.spec.ts`: two whole customer
journeys on the built app, run in CI's smoke job on every PR.
- **now:** search on the home as a visitor → Tiago's card → Chat asks for a log in →
  back to `/explore` → the chat's estimate → approve → book → Track → the walkthrough
  finishes it → receipt → 5★ → Activity links the receipt, and it's still rated after a
  reload.
- **later:** `/explore?when=later&day=3&win=2` (three days ahead, so no window has
  passed whatever the clock) → book → View booking → change 12–14 to 16–18 → cancel →
  Activity shows a plain "Cancelled before travel" row.
- axe now also audits `/job/dfx-1042` signed in.
- Written to wait on what appears, never on time: the chat replies on timers. It passed
  three repeat runs locally.

**Revision 2.9**, on branch `feat/job-help` (#29), puts "Need help with this job?" on `/job/:id`
(`components/job/JobHelp.tsx`). It's an inline card, not a modal, because the slot
picker's own popover and sheet (z-80/81) must sit on top.
- **Booked ahead:** *Change the time* uses the booking SlotPicker (`lib/jobs`
  `rescheduleJob`), and saying "same time" is caught. *Cancel the booking* is free before
  travel (`cancelJob`) and gives back any Dashfixe credit the job used
  (`lib/wallet` `refundCredit`, a `refund` history entry, once per job); the page then
  lands on Activity.
- **On the way:** the time can't change here. It says so and offers *Message Tiago*,
  which opens the chat.
- **Always:** *Report a problem*. You pick one of six reasons; details are required for
  "Something else". Picking safety adds "call 112 first", and the form says which number
  the team will call back. It's real: `POST /api/support/report` stores it, and `/ops` now
  has a *Problem reports* section beside Applications. The job remembers the reference.
  A dead session says to log in again.
- The receipt has the same card (report, help centre, safety) in place of the old "Get
  help" button.
- **Tests:** `pages/JobPage.test.tsx` (reschedule, cancel with refund, message, report
  and its validation, an ended session, the receipt), `server/support.test.ts`, and the
  `lib/jobs` and `lib/wallet` unit tests. `/ops` shows the report end to end.

**Revision 2.8**, on branch `feat/ops` (#28), gives the founders `/ops`: the review of Dashfixe
Pro applications. It's stacked on #27 because it registers its page in `routePages.ts`.
- **Access** (`server/handlers.ts` `opsGate`, `server/session.ts`) requires a signed-in
  phone in `OPS_PHONES` **and** the `OPS_PASSCODE`. The passcode buys an 8-hour
  httpOnly `dfx_ops` cookie, scoped to `/api/ops` and bound to that phone. The passcode is
  needed because pilot login signs anyone in as any number, so the owner's phone alone
  would expose applicants' contact details. When SMS is live, the phone check becomes
  real on its own; the passcode stays as a second factor.
- **The page** (`pages/OpsPage.tsx`, minimal Pro header, linked from nowhere) lists
  applications newest first, with counts per status as filters. Each shows Call / WhatsApp
  / Email, what the applicant sent, a private note, and buttons for the other statuses.
  It warns when `DATABASE_URL` is missing ("Not saved…").
- **Storage** (`server/store.ts`): `listApplications` and `setApplicationStatus` on both
  drivers. Postgres gains `note` and `reviewed_at` (`ADD COLUMN IF NOT EXISTS`, as before).
- **Tests:** `server/ops.test.ts` covers every refusal, the phone-bound unlock, the
  review, lock and sign-out. `pages/OpsPage.test.tsx` runs the page end to end, the other
  phone, and the set-up notice. axe runs on `/ops`, and `check-prod` checks a visitor gets
  401/503.
- **Owner test:** set `OPS_PHONES` to your number and `OPS_PASSCODE` in Vercel, then
  redeploy. Apply once on `/pro/apply`, then open `/ops`, log in, enter the passcode, and
  approve the application with a note.

**Revision 2.7**, on branch `feat/launch-ready` (#27), is the launch-readiness pass.
- **Security headers** (`vercel.json`): a CSP naming every outside host, HSTS, no
  framing, nosniff, referrer and permissions policies, and immutable caching for
  `/assets/*`. `vite preview` sends the same headers (`productionHeaders()` in
  `vite.config.ts`), and a smoke test fails if the CSP blocks anything on `/` or
  `/explore`.
- **Lazy pages** (`lib/lazyPage.tsx`, `routePages.ts`, `main.tsx`), with each
  pre-rendered page modulepreloading its chunk. See the gotchas.
- **Photos** (`shared/Photo`): Pexels photos with srcset/sizes, dimensions and async
  decode, so a phone gets a 640–960px image instead of the 1600px one.
- **Search** (`seo.ts`, `lib/faq.ts`): hreflang (`?lang=pt`, which `i18n` now reads and
  remembers) in the heads, at runtime and in the sitemap, and JSON-LD: `Organization` +
  `WebSite`, a `Service` per trade, and `FAQPage` on both help pages. No ratings claimed.
- **`check-prod.mjs`** gains checks for the headers, asset caching, hreflang and JSON-LD.

Measured cold loads of the built app, served over HTTP/2 with gzip. The phone profile is
412px wide, with 4× CPU throttling and 1.6 Mbps at 150 ms. Each figure is the median of 5
runs of first/largest paint (`scripts/measure.mjs`; rerun it before and after any change
that touches loading):

| Page | Before (main) | After |
|---|---|---|
| `/` | 1,896 ms | 1,732 ms |
| `/trade/plumbing` | 1,716 ms | 1,580 ms |
| `/pro` | 1,792 ms | 1,680 ms |
| `/help` | 1,648 ms | 1,528 ms |
| `/explore` | 1,736 ms | 1,940 ms (the baseline itself ranged 1,736–1,968 across runs) |

JS before `load`: 165 → 138–146 kB gzip. Entry chunk: 589 → 288 kB raw.

**Revision 2.4** (#22, merged; its focus fix is #25) was an owner request, made mid-way
through the Pro work. It adds the artisan's profile card to the chat. In the chat header, the avatar
and name are now a "View Tiago's profile" button. It opens `ArtisanProfileModal`, a card
on desktop and a sheet on phones, with the same pieces as `/artisan/:id`
(`ArtisanProfileParts.tsx`), plus "Full profile" and "Back to chat". Escape closes it
and focus returns to the chat. Tests: 158 Vitest (the card opens, shows the profile,
closes and returns focus, closes on Escape) and 17 Playwright.

**Production, verified live on 2026-09-12** (`dashfixe-web.vercel.app`, merge
`ec9d36d`):
- ✅ **One-tap pilot login:** request-code, verify, then the name saved to the session.
  No database and no Twilio needed.
- ✅ **Per-route heads:** `/how-it-works`, `/trade/*` and `/explore` each ship their own
  title.
- ✅ **Sitemap:** 14 pages, with the waitlist parked.
- ✅ **`AUTH_SECRET` is set** (the owner did this on 2026-09-14). A token signed with
  the public fallback key is now rejected, and real logins still work.
- ✅ **Every page loads cold** (#14). The SPA rewrite targets `/`, because `/index.html`
  redirects under `cleanUrls`. The "production check" workflow ran by itself after the
  deploy and passed, and `node scripts/check-prod.mjs` gives 16/16 (11/16 before).

**Revision 2.1**, on branch `feat/notifications`, makes the bell work. It used to say
"nothing yet" whatever happened.

- **`lib/notifications.ts`** derives notices from what the browser already has:
  - every job's state: booked, on the way, started, receipt ready, a rating nudge
    until rated, cancelled with no charge
  - every promo credit
- **The panel.** Each notice links to its job (or to Account, for credit), newest first,
  with "See all activity" at the bottom.
- **Unread count.** The bell shows a count of new notices, and its accessible name says
  it ("Notifications, 5 new"). Opening the panel marks everything read, while still
  highlighting what was new.
- **A new state is a new notice.** Ids are per state, so finishing a job brings a fresh
  "Receipt ready" notice.
- **Tests:** 155 Vitest and 17 Playwright.

**Now: Dashfixe Pro** (the owner said "continue till we finish"). It's a separate artisan
world, like Uber's driver site, built in four PRs in the order in BUILD_PLAN →
"Dashfixe Pro".

**Revision 2.2**, on branch `feat/pro-shell`, is PR 1: the shell and the landing.

- **One Header, now with a `pro` surface** (`ProHeader`):
  - dark chrome, the logo and a Pro mark going to `/pro`
  - How it works · Earnings · Vetting · The app
  - "Need a repair?" back to `/`, and Apply
  - never the customer menu
- **The footer and shell follow.** `SiteFooter` and `MarketingShell` take
  `surface="pro"`. The Pro footer has Work with Dashfixe, The app, Support and For
  customers.
- **`/pro` is the landing** (`pages/ProLandingPage.tsx`, formerly `ForArtisansPage`):
  anchors `#how`, `#pay`, `#vetting`, `#app` (now a still of the app, not a stock photo)
  and `#apply`. It's indexed, and it's in the sitemap in place of `/for-artisans`.
- **`/pro/app` is the showcase** (`pages/ProAppPage.tsx`), with its own h1, "The
  Dashfixe Pro app".
- **The old address still works.** `/for-artisans` gets a permanent 308 in
  `vercel.json`, plus an in-app redirect that keeps `#apply` and the like. Every
  "Become an artisan" link now lands on `/pro`.
- **Production checks:** `check-prod.mjs` now also cold-loads `/pro/app` and checks the
  redirect (22 checks).

**Revision 2.3**, on branch `feat/pro-apply`, is Pro PR 2: the application.

- **`/pro/apply`** (`pages/ProApplyPage.tsx`) has four steps, each checked before
  moving on, with focus on the first error:
  - **About you:** name, WhatsApp and email.
  - **Your work:** main trade, other trades and experience.
  - **Where and when:** areas, availability and transport.
  - **Papers:** licences, insurance and consent.
  - Then a review with Edit links, and submit.
- **The API.** `POST /api/artisans/apply` takes an optional `profile`, validated, with
  consent required, and returns a reference. Postgres gains `profile JSONB` and
  `reference`.
- **`/pro/application`** (`pages/ProApplicationPage.tsx`) shows the reference, then
  received → a WhatsApp call within 48 hours → documents → onboarding → ready. It says
  plainly that it shows what this device sent.
- **The landing's `#apply`** is now a start card that opens `/pro/apply`. Once this
  device has applied, it reads "See your application". Every Apply link goes to
  `/pro/apply`.
- **Tests:** 158 Vitest, including the full four-step flow in the UI and the
  server's profile validation.

The owner then asked for an artisan profile card in the customer's chat. That's #22,
on its own branch.

**Revision 2.5**, on branch `feat/pro-dashboard`, is Pro PR 3: artisans can log in.

- **`/pro/login`** is `LoginPage surface="pro"`: the same phone sign-in and pilot bypass,
  in the minimal Pro header, headed "Log in to Dashfixe Pro". It lands on
  `/pro/dashboard`.
- **`/pro/dashboard`** (`pages/ProDashboardPage.tsx`) is signed-in only. It's honest
  that nobody is approved yet, so it shows:
  - the application's status and next step
  - a "get ready for your call" checklist built from the application: ID, NIF, IBAN,
    and insurance and DGEG/gas licences if declared
  - hours and radius
  - the profile, with sign out
  - a badged sample preview of the earnings view
  - Choices are saved on this device (`lib/proDashboard.ts`); nothing is uploaded.
- **The application record** now also keeps licences, insurance and availability, which
  the checklist uses.
- **The Pro header** shows Log in, or Dashboard once signed in. Robots now disallow
  `/pro/login`, `/pro/dashboard` and `/pro/application`.

**Revision 2.6**, on branch `feat/pro-help`, is Pro PR 4, and Dashfixe Pro is complete.

- **`/pro/help`** (`pages/ProHelpPage.tsx`) gives straight answers in the Pro frame. It
  has topic chips at the top, each a section: pay, jobs, estimates, papers, safety and
  your account.
- **Honest pre-pilot.** Where something is still being set up (the rate, the payout
  day), it says it's confirmed at onboarding.
- **`#contact`** points applicants to WhatsApp and to their dashboard, and everyone else
  to Apply.
- **Linked from** the Pro header (Help, `lg` and up), the mobile menu, the footer (Help
  centre and Contact now stay in the Pro world) and the dashboard.

**What's left is the owner's (no code):** set `DATABASE_URL` (free on Neon), so
applications and the waitlist survive restarts. Choose a domain, then set `SITE_URL`
and the `PROD_URL` repo variable. Set the `TWILIO_*` variables when SMS is funded, and
`VITE_LAUNCHED` on launch day. After that comes Phase 6: real supply.

**Revision 2.0**, on branch `feat/artisan-app` (#18), shows the apps, honestly. It went
through one change of direction: it began as an interactive walkthrough at `/pro`, and at
the owner's request that became a showcase page instead ("like a reference page… preview
screens… download for iOS and Android").

- **`/pro`** is the artisan app's showcase (`pages/ProPage.tsx`):
  - a dark hero with the pitch
  - four still screens from `designs/Dashfixe Artisan App.dc.html`: Today, a job offer,
    the estimate builder and Earnings (`components/pro/Shots.tsx`, framed by `PhoneShot`)
  - what's in the app, then "Get the app with the pilot"
- **Store badges are "Coming soon"** (`StoreBadges`) and link nowhere. The owner updated
  the honesty rule in `../Dashfixe.md` on 2026-09-14: the apps are promoted as coming
  soon while the product is built, and badges become links only once the apps are
  published.
- **Customers:** the visitor home closes with **"Do more with the app"**
  (`home/Apps.tsx`): benefits, badges, three customer-app stills (`home/AppShots.tsx`)
  and a link for tradespeople to `/pro`. Signed-in customers get the **"Do more on the
  Dashfixe app"** band (`AppPromoBand`) at the end of the home panel, Activity and
  Account.
- **Strings:** 138 walkthrough and old `apps.*` keys were pruned from both dictionaries.

*The walkthrough, for the record* (it's in git history, `1689211`, and the notes below
describe it):

- **The job, end to end** (`components/pro/JobFlow.tsx`):
  - **Offer.** It arrives once the artisan goes online. The take-home is stated before
    accepting, and there's a 30-second countdown. "Not now" is free.
  - **Brief.** The address stays masked until the customer approves the price.
  - **Chat.** Suggested replies; the customer's answers are scripted.
  - **Estimate builder.** Every line is editable, and parts and labour can be added. It
    shows the subtotal, IVA 23%, what the customer pays, the 12% commission and what the
    artisan receives.
  - **Approved.** The address unlocks, with Copy and Open maps.
  - **Driving, then on site.** An optional second estimate needs its own approval.
  - **Close.** Photos, then a checklist that gates "Mark complete & charge".
  - **Paid.**
- **Between jobs** (`components/pro/ProTabs.tsx`):
  - **Today:** the online switch on a dark header, the day's numbers, the next booking
    and Friday's payout.
  - **Schedule.**
  - **Earnings:** "Lead fees €0" is a permanent tile.
  - **Profile & standing.**
- **Money** (`lib/pro.ts`) reproduces the design to the cent: €61.01, €53.69, a second
  estimate of €19.56, and a €70.90 payout. The walkthrough job joins a seeded week, for
  €412.40.
- **Where it's linked:** For artisans → "Try the artisan app"; `link('artisanApp')` and
  `/artisan-app` now land on `/pro`. It's noindex, since it's sample data. Every screen
  carries a "Walkthrough · sample job · nothing is sent" ribbon.
- **Housekeeping.** `check-prod.mjs` now cold-loads `/account`, `/pro` and a 20-day slot
  URL, and checks that `robots.txt` keeps `/activity` and `/account` out (19 checks).
  The build's size warning is the MapLibre worker, which is lazy and only loads on map
  pages. It's expected; its wiring is not to be touched.
- **Tests:** 150 Vitest (the design's money to the cent; the whole walkthrough from
  offer to Earnings; passing on an offer) and 17 Playwright (axe on `/pro`).

**Revision 1.9**, on branch `feat/date-picker` (#17), designs the book-ahead picker. The owner
saw the browser's default calendar on "Plan it for later".

- **`components/shared/SlotPicker.tsx`** is the day and window picker for the home card
  and for `/explore`'s later mode.
  - The day is a month calendar: Monday first, today marked, and quick picks for today,
    tomorrow and Saturday.
  - The window is a set of chips grouped morning, afternoon and evening.
  - It opens as a popover on desktop (it flips above the field when there isn't room)
    and as a bottom sheet on phones. Arrow keys move through the days; Escape closes and
    hands focus back.
- **The 30-day promise is real now.** The old date input allowed 30 days but the URL
  kept only 7, so a date past the first week was quietly booked as day 7.
  - `day` now runs 0–29.
  - Same-day windows need an hour's notice, and the ones that have passed are crossed
    out.
  - `normalizeSlot` keeps what `/explore` books identical to what the picker shows.
- **Tests:** 144 Vitest (the picker's calendar, keys, horizon and passed windows; the
  slot rules) and 16 Playwright.

**Revision 1.8**, on branch `feat/account` (#16), gives the customer their own page. The owner
said the profile didn't belong at the bottom of Activity.

- **`/account`** (`pages/AccountPage.tsx`) is a dashboard. It holds:
  - the profile: avatar, first name edited in place, phone
  - three stats: jobs, paid in the app, artisans used
  - **Dashfixe credit**
  - an invite code
  - "Your artisans", with Rebook
  - saved places (moved from Activity to `components/account/Places.tsx`)
  - payment methods: an honest "arrives with the pilot"
  - preferences: language, and SMS switches saved on the device
  - "Your data": download it as JSON, or clear the device
- **Credit** (`lib/wallet.ts`) is walkthrough money, labelled so. `PILOT10` adds €10. The
  next approval spends it: the chat's confirm step says "Your €10.00 credit comes off:
  you pay €53.00", and the job and receipt carry a "Dashfixe credit −€10.00" line.
- **Activity** is just the jobs now, with a link to Account. The account menu and the
  mobile sheet gain Account. `/account` is noindex and disallowed in robots, and it sends
  visitors to log in and back.
- **Tests:** 137 Vitest (wallet, the account page, credit on a booking) and 16 Playwright,
  including axe on `/account` and `/activity` signed in.

**Revision 1.7**, on branch `feat/smart-search` (#15), is the owner's smart-search requests:

- **Trade recognition.** `lib/classify.ts` matches English and Portuguese keywords to a
  trade: tap and torneira go to plumbing, socket and disjuntor to electrical, and so on.
  The chip shows the word it matched on, and `TradePicker` (a sheet with icon tiles)
  changes it. Every trade now has sample artisans, and the list and the map filter by
  trade.
- **The Dashfixe assistant** (`components/assistant/`). "Something else" opens a
  conversation that works out the trade from the customer's own words. When it can't tell,
  it asks with quick picks. It then opens `/explore` with the need, the trade and the
  address filled in. It is labelled as automatic.
- **Location on arrival** (`LocationPrompt`). Map pages show a card that asks once for
  the customer's position. The browser permission prompt only follows a tap. The position
  becomes the saved place; outside the pilot area the search stays at the pilot address.
  "Change area" focuses the address field.
- **Book for later on the home.** It scrolls to "Plan it for later", which carries the
  need, the trade and the address into the booking.

**Revision 1.6** (#13) gets the site ready for real visitors, with no money or accounts
needed:

- **A crash safety net.** `ErrorBoundary` wraps every route: a crash shows a reload
  screen instead of a white page, and navigating away recovers.
- **A real 404.** `NotFoundPage` replaces the silent redirect home. It is `noindex`, and
  it links to the pages people usually meant.
- **Honest legal pages.** Privacy, cookies and terms now state exactly what is stored:
  the two httpOnly cookies, and what the browser keeps in local storage.
- **The Dashfixe icons.** The browser tab was showing Vite's template logo. Now there's a
  favicon, `favicon.ico`, the touch and app icons, and a web app manifest, so the site can
  be added to a phone's home screen.
- **WCAG 2.1 AA.** axe-core runs on eight landing pages inside the CI smoke job. The
  contrast tokens were darkened, links in running text are underlined, and icon-only
  buttons have names. `docs/DESIGN.md` has a "Colour and contrast" section.

**Revision 1.5** (#11) is the owner's review pass. Four commits, each one green:

- **One header on every page** (`components/chrome/Header.tsx`). `SiteNav` and `AppBar`
  are now thin wrappers around it.
- **One-tap pilot login.** With no SMS provider, Send code verifies the returned code
  itself. Then a one-time name step; the name rides in the session token
  (`POST /api/auth/profile`).
- **One shared place** (`lib/place.ts`). Every map, pin and ETA follows the address the
  customer picked.
- **Chat → estimate → approve → booked → track → finish → rate.** This runs on the job
  store (`lib/jobs.ts`) and `lib/estimate.ts`, and every step is labelled as sample.
- **`/how-it-works`**, home layout fixes, and the waitlist parked.

**For the owner:** nothing to do to log in. When SMS is funded, set `TWILIO_*` and the
code step returns by itself.

Revision 1.4 (#9, launch hardening), for reference:

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

Start any new session by reading `docs/ARCHITECTURE.md` rev 1.6:
- §4 covers the route map, and search and sharing
- §6 holds the endpoints and the env table
- §7 covers the maps and the lazy rule
- §8 covers testing

**Next:**
1. Merge `fix/vercel-spa-fallback`, then read the "production check" run on GitHub. It
   should show 16/16.
2. `DATABASE_URL`, a free Neon database, so signups persist.
3. `TWILIO_*` when funded.
4. `SITE_URL` once there is a domain. Also set the repository variable `PROD_URL`, so the
   production check follows the domain.
5. `VITE_LAUNCHED` on launch day.
6. Then Phase 6: real supply and live operations.

**Checking production by hand, at any time:** `node scripts/check-prod.mjs`.


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

Earlier phases (0–4, revisions 1.1–1.3) are recorded phase by phase in
`docs/BUILD_PLAN.md`, and commit by commit in git. They are not repeated here.

Known gaps, on purpose:

- **`/waitlist` is parked and untranslated.** It keeps its own EN/PT toggle and the locked
  English copy (`../Dashfixe.md` §6). Nothing links to it.
- **One pilot area.** "Change area" opens `/about#coverage`. A real area picker arrives when
  there is a second area.
- **Sample data everywhere a backend is missing,** always labelled: supply, chat replies,
  jobs (per browser), receipts and payments. That is Phase 6.
- **`request-code` has no rate limit.** Add one, per phone and IP, before real SMS costs
  money.

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
3. `npm run check` — 119 tests should pass. Then `npx vite build && npm run smoke` —
   14 Playwright tests, 6 smoke journeys and 8 accessibility pages (set `PW_CHANNEL=msedge`
   or run `npx playwright install chromium`).
4. `npm run dev`, open `/login`, enter any number → Send code (pilot mode signs you in),
   then `/`, `/explore` (chat with Tiago → approve → track), `/how-it-works`, `/trade/plumbing`.
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
| `DATABASE_URL` | persistence | Neon connection string; tables auto-create on first use. It takes effect on the next deploy. Confirm with `GET /api/health`, which should say `"storage":"postgres"`; `check-prod` fails production otherwise. A failed connection is retried on the next request, not cached |
| `AUTH_SECRET` | sessions | any long random string; rotating it logs everyone out |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | real SMS codes | without them login shows labelled pilot codes on screen |
| `VITE_MAP_STYLE` | optional | switch tiles to a keyed provider without code changes; add its hosts to the CSP in `vercel.json` |
| `SITE_URL` | canonical/OG/sitemap URLs | e.g. `https://dashfixe.pt`; absent → Vercel's production hostname |
| `VITE_LAUNCHED` | launch day | `true` retires `/waitlist` to `/` and drops it from the sitemap |
| `OPS_PHONES` | `/ops` | the team's phones, comma-separated (`912 345 678, +351 913 …`) |
| `OPS_PASSCODE` | `/ops`, `/admin/setup` | a long random phrase, 12+ characters; without it `/ops` says it isn't set up. Share it only with the team; changing it locks everyone out of `/ops` (not out of the site). Since 2.12 it's also the one-time setup key that claims the admin console |

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
- **With `cleanUrls` on, the SPA rewrite must target `/`, not `/index.html`.** Under
  `cleanUrls`, `/index.html` answers with a 308 redirect, so a rewrite to it made Vercel
  return its own plain 404. This hit every page without a pre-rendered file on a cold load
  (`/login`, `/activity`, `/job/*`, `/artisan/*`, the 404 page). Clicks inside the app
  still worked, and every local test passed, because `vite preview` is not Vercel. That is
  why `scripts/check-prod.mjs` exists and runs after every production deploy.
- **Preview deployments sit behind Vercel's login** (401 without a bypass token), so
  routing changes can only be proven on production. `prod-check.yml` does exactly that,
  against the production alias.
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
- **A delayed `setTimeout` must die with its component.** The home's "Choose when"
  focused the calendar 400 ms after scrolling, on a timer nothing cancelled. In the tests
  it outlived its page and stole focus from the next test's address field after one
  keystroke ("s"), so the suggestion test failed now and then, only under full-suite load.
  A visitor who left within 400 ms could have hit the same thing. `PublicHero` now keeps
  the timer in a ref and clears it on unmount, and a regression test covers it. Put any
  deferred focus or scroll in a ref with an unmount cleanup.
- **scrypt is deliberately CPU-heavy.** The console's suites hash dozens of passwords, so
  `src/test/setup.ts` sets `DFX_SCRYPT_N=1024` to keep them fast. `server/passwords.ts`
  honours it only under `NODE_ENV=test`, and every hash stores its own N, so production
  is untouched.
- **`sr-only` inputs escape a non-positioned scroller.** `sr-only` is `position:
  absolute`. Inside a scrolling column that isn't `relative`, the inputs sit against
  the page at their static position far down the column, which stretches the document
  under a one-screen (`h-dvh overflow-hidden`) layout. On `/job/:id` the report form's
  radios made the page 184px taller, so the app bar could scroll away. Give such
  scrollers `relative`; the smoke test "the job page stays one screen" guards it.
- **A scrolling flex column shrinks its children.** Cards with `overflow-hidden` get
  clipped (the chat's approved estimate lost its footer). Add `[&>*]:shrink-0` to the
  scroller.
- **External stores need a stable snapshot.** `usePlace()` and `useJobs()` use
  `useSyncExternalStore`, which re-renders forever if `getSnapshot` returns a new object
  on each call. Both memoise on the raw localStorage string.
- **Tests share module state.** `src/test/setup.ts` clears localStorage and the chat
  threads after every test. Add any new per-browser store to that reset.
- **The chat's replies run on timers.** Every `setState` for a scripted reply happens
  inside a timeout, never synchronously in an effect (`react-hooks/set-state-in-effect`).
  Each reply also has a cleanup, so StrictMode's double mount doesn't greet twice.
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
- **The Content-Security-Policy lists every outside host** (`vercel.json` → `headers`):
  Google Fonts, Pexels photos, OpenFreeMap tiles/sprites/glyphs and Nominatim. A new one
  (analytics, a new tile provider via `VITE_MAP_STYLE`, a payments script) is **blocked
  silently** in production until it is added there. `vite preview` sends the same headers,
  so the smoke test "the production Content-Security-Policy blocks nothing" catches a
  missing host before it ships. Vercel's preview-comments toolbar is deliberately not
  allowed.
- **Pages are lazy (`lib/lazyPage.tsx`, `routePages.ts`).** Only the home is in the entry
  chunk. A new page goes in `routePages.ts`: add its `lazyPage(() => import(...))` and its
  `BY_ROUTE` entry, so `main.tsx` loads it before the first render. If it's indexable,
  add it to `PAGE_MODULES` in `vite.config.ts` too; the build fails without it. Tests
  that mount the whole tree call `preloadPages()` in `beforeAll`, or the first `getBy…`
  sees the Suspense fallback.
- **Don't let the first page render into a Suspense fallback.** React 19 holds back the
  reveal (about 300 ms), and it made every lazy page paint later than the old single
  bundle, even with fewer bytes. `preloadRoute()` before `createRoot` fixed it.
- **Nominatim's usage policy** allows light, debounced, attributed use only. Fine for the
  pilot; swap `ENDPOINT` in `lib/geocode.ts` for a paid geocoder before real traffic.
- **React lint is strict** (`react-hooks/set-state-in-effect`): clear state in event handlers,
  not synchronously inside an effect. Keep non-component exports out of component files
  (`translate()` lives in `i18n/strings.ts`) so fast refresh keeps working.

## Honesty rules that shape the code

Nothing on the site claims live supply. Every list of artisans is labelled sample data
(`Nearby.tsx` badge, the "Sample artisans · real map" chip on the map, the trade pages'
"Sample data" badge and pilot line). The `/explore` area chip says "pilot area" with a
still dot — never "live"; its intro says nine *sample* artisans. The chat header reads
"Sample artisan · scripted replies", receipts carry a Sample badge, the job screen's
finish button is labelled "Walkthrough", and pilot login says it skipped the SMS. Sample artisan profiles are `noindex`. Keep all of it until the
pilot cohort is real. See `../Dashfixe.md` §2 for the full list of forbidden claims.
