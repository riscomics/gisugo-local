# Admin Dashboard — Architecture & Cost Study (Track C #8)

> Status: **In progress — discuss before wiring.** Owner + agent working session, started
> 2026-07-17, resumed 2026-07-26.
> Companion: `docs/V1_HARDENING_TASKLIST.md` Track C (this doc is the detailed backing study).
> Current mock: `admin-dashboard.html` / `public/js/admin-dashboard.js` — fully simulated
> (`localStorage` + `setInterval`), zero real Firebase wiring today.

## Core principle (applies to every section below)

Never make the dashboard scan or live-listen real collections just to show a number or a feed.
Instead:
- A Cloud Function bumps a small counter/aggregate doc whenever something happens (signup, report,
  verification, etc.). The dashboard reads that tiny doc, not the underlying collection.
- Workflow lists (Support inbox, Reported gigs, Suspended users) are small, naturally bounded
  queues — paginated `.get()`, not open-ended real-time listeners.
- "Browse everything" lists (all gigs ever posted, all users ever signed up) are NOT workflow
  queues — they get the "glance" treatment below, or are cut/redesigned.
- This mirrors patterns already live in the app: notification unread counters
  (`syncNotificationCountersOnWrite`), `metrics/contact_reveals` (Direct Contact reveal count).

## Section-by-section verdict

| Section | Verdict | Status |
|---|---|---|
| Overview (stat cards + overlays) | Resolved — see below | Studied 2026-07-26/27 |
| User Management | Resolved — see below | Studied 2026-07-26 |
| Gig Moderation | Resolved — see below | Studied 2026-07-26 |
| Messages (Support admin reply) | Wire as a paged queue — cheapest, most-blocked, highest-value piece | Resolved 2026-07-27 |
| Settings | Wire as one small Firestore doc, replaces `localStorage` | Already scoped in tasklist, not detailed here |
| Ad Placement | Wire per existing `AD_PHASE3_WIRING.md` plan — config reads only | Already scoped |
| Chats (monitor user conversations) | Cut/defer — open-ended live connections per thread, no ceiling, privacy concern, not needed to run the business | Decided (first session, 2026-07-17) |
| Financial | Cut for now — placeholder page, no real payment system live to wire against | Decided |
| Analytics (demographics, peak hours, "Traffic & Costs") | Cut for now — needs Google Analytics/BigQuery or GCP Billing API, not Firestore; Firestore can't self-report its own read/write cost | Decided |

---

## Overview — resolved design (2026-07-26/27)

Current mock has 8 cards total: 4 headline stat cards (Total Users, Verification Submissions,
Total Revenue, Gigs Reported) each opening a large overlay, plus 4 secondary "dashboard cards"
below (User Activity, Gigs Analytics, Storage Usage, Traffic & Firebase Costs) that also open
overlays. Verdict per card:

### Keep, wire with counters (real value, cheap)
- **Total Users** — headline count + growth rate + ONE New/Pro/Business split (mock currently
  shows this same split twice under different names — "User Status" and "Account Types" —
  collapse to one). Simple +1/-1 counter on signup/delete.
- **Gigs Reported** — headline count, this week, change rate, Report Reasons breakdown, Report
  Status (Pending/Ignored/Suspended). All of this is just counting the same Reported/Suspended
  queues already being built for Gig Moderation — no separate system.
- **Gigs Analytics** — total gigs, total applications, avg per gig, gigs-by-category,
  applications-by-category. Category breakdown = one small counter map per collection,
  incremented on post/apply. Genuinely useful (what's popular), not vanity.
  **Note added 2026-08-03 (not yet built):** also break down by **Gig Use Type — Personal vs
  Business** (the field that replaced Payment Type, see `V1_HARDENING_TASKLIST.md` Track D). Same
  cheap counter-map pattern as the category breakdown, just keyed on `gigUseType` instead of
  category — increment both maps on the same post/apply write. Useful platform-usage signal (are
  gigs skewing personal-household or small-business?) and was missing from the original design
  since Gig Use Type didn't exist yet when this study was written.
- **Age Groups** (sub-breakdown under Total Users) — **confirmed buildable.** `dateOfBirth` is
  already collected at signup (`sign-up.js`, plus an existing `calculateAge()` helper) — bucket
  existing accounts by stored birthdate into a cheap counter map. No new data collection needed.

### Hidden for now (not cost — the underlying feature doesn't exist yet)
- **Verification Submissions** (headline card + full overlay: Total Submissions, Overdue,
  Submission Age, Verification Types) — ties to the ID-verification pipeline, which isn't built.
  Same reasoning as hiding the Pending/Verified tabs in User Management — hide together.
- **Total Revenue** (headline card + full overlay: PHP/USD, Revenue Sources, Transaction Stats) —
  depends on G-Coins purchases + verification fees, neither of which is live (no purchase flow
  exists yet). Same reasoning as the Financial section being cut. **Follow-up noted:** this card
  will need to fold in ad revenue once the ad system actually generates money — revisit design
  then, not forgotten.
- **Regional Distribution** (sub-breakdown under Total Users) — **resolved 2026-07-27, design
  locked, not yet built.** Was "not a cost problem, a missing-data problem" (confirmed via code
  search: no signup/profile screen collects city/province today; the `location` field in
  `FIREBASE_SCHEMA.md` is documented but unused, no live write path). Decided design:
  - **Source: device GPS**, requested **once, only during account creation** — never triggered
    anywhere else in the app. The native "Allow location access?" dialog itself cannot be styled
    (browser/OS-controlled, same on every site), but a custom-styled explainer screen right
    before it (why we're asking) is fully our own design — standard soft-ask pattern.
    Coverage will be partial (users can decline) — acceptable for a glance stat, not a census.
  - **Buckets: the 17 official Philippine regions** (NCR/Metro Manila already separates out on
    its own for free under the standard region system — no custom logic needed for that split).
    Classifying a coordinate into a region is free client-side geometry either way, so bucket
    count was never a cost question — it's a public boundary dataset checked in code, not a paid
    lookup.
  - **Explicitly deferred (owner call, 2026-07-27):** province/city-level carve-outs (e.g. Cebu,
    Bohol, Leyte, Davao, Siargao called out individually instead of lumped into their region).
    Not worth the curation effort for an initial Cebu-based promotional launch where most
    signups will cluster in one or two regions anyway — the plain 17-region view already shows
    that clearly. Can be layered in later at the same zero marginal cost once there's an actual
    nationwide spread of users to justify the finer detail.
  - **⚠️ NOT out of scope — read this before touching signup/profile location copy again.**
    Corrected twice already in conversation (2026-08-06, 2026-08-07) after being wrongly
    described as "out of scope" here — that framing was wrong and caused two repeat mistakes
    (nearly rewriting the consent copy, then flagging it as a false claim again). **The actual
    plan, confirmed directly by the owner:** this GPS-classified region snapshot is deliberately
    built *first* as the foundation for a real, planned feature — using a user's registered
    region to drive their default listings feed (e.g. a user registered in Manila sees
    Manila-region gigs by default, across every gig category, instead of always defaulting to
    Cebu). The dashboard/backend work (this file) had to be built before that feed feature
    *could* be built. The Cebu-first empty-state placeholder note already live on listing pages
    exists specifically *because* that region-aware feed isn't wired yet — it's a stopgap, not
    the end state. So: the signup explainer and Edit Profile toggle copy ("used for accuracy in
    local listings and community insights") is describing genuine, confirmed roadmap intent, not
    an unearned claim — **do not reword it without being explicitly asked.** The one real
    open question (not yet decided, don't assume an answer) is *how* the eventual feed feature
    reconciles a one-time signup snapshot with the fact that people move — that's implementation
    detail for whoever builds the feed integration, not a reason to hold back or downplay this
    copy today.
  - **`Overseas` bucket added 2026-08-07 (owner call):** a shared location outside the Philippines
    is a real, useful answer — not the same thing as "declined/never shared" — so it gets its own
    counter instead of being lumped into `unknown`. `unknown` now means strictly "no data" (never
    asked/declined/pending); `Overseas` means "shared successfully, just not one of the 17."
    Same zero marginal cost as the rest of this feature — `classifyCoordinateToRegion()`
    (`public/js/ph-regions-geo.js`) does one cheap bounding-box check before running
    point-in-polygon at all, so classifying "not in PH" costs nothing extra over classifying
    "in PH." Country-level granularity (e.g. "USA", "Japan") was considered and explicitly
    deferred — would need a paid reverse-geocoding API call (the free client-side PH boundary
    dataset has no data for the rest of the world); one `Overseas` bucket is enough signal for
    now, can be layered in later if there's ever a real user base living abroad to justify it.
- **Age Groups — `dateOfBirth` to be made required at signup.** Confirmed in code
  (`sign-up.js` ~line 1111) it's currently optional — the validator silently skips it if blank,
  no error shown. Small change to make it mandatory like other signup fields, needed so the Age
  Groups breakdown has full coverage.

### Keep, but redesigned to a manual-refresh "snapshot" model (not live, not scheduled)
These three were originally going to be cut as "too expensive," but that was conflating cost with
build effort — corrected 2026-07-26/27. All three can be cheap IF sourced correctly and refreshed
only when an admin clicks refresh (no live listener, no background scheduled job):
- **Storage Usage** (Total Storage, Media Files, Storage Cost, by-type breakdown, growth) — track
  as a running byte-counter, incremented/decremented at upload/delete time (file size is already
  known then) — never scan the bucket. Cost is computed math on the running total (Firebase's
  published $/GB), labeled as an estimate.
- **User Activity** (device split, browser, session duration, bounce rate, peak hours, repeat
  users) — this is exactly what Firebase/Google Analytics already tracks for free. Don't hand-roll
  it in Firestore; pull a summary from the Analytics API on manual refresh. **Blocked on a
  prerequisite, not cost:** confirmed via code search that Firebase/Google Analytics is **not
  currently enabled anywhere in the codebase** (no measurement ID, no SDK, no `gtag`/`getAnalytics`
  calls). Turning Analytics on is its own small action item, separate from dashboard wiring — no
  data exists to pull until that happens.
- **Traffic & Firebase Costs** (bandwidth, DB reads/writes, $ cost, breakdown, trends) — the one
  real technical limit in this whole study: an app cannot cheaply self-count its own Firestore
  reads/writes (doing so would require a write for every read, adding MORE write cost just to
  measure existing read cost — a genuine dead end, not just an assumption). The workaround: pull
  the real number from the GCP Billing API on manual refresh — accurate, cheap (an occasional
  request, not per-view), but requires deliberately granting a small piece of code read access to
  the billing account (a one-time setup/security step, not a recurring cost). **Confirmed OK by
  owner (2026-07-27).**
- **Data freshness note (all manual-refresh cards):** Storage is always instantly accurate (it's
  your own counter). Analytics and Billing data both have a natural processing delay on Google's
  side (hours, sometimes closer to a day for Billing) — refreshing more often doesn't bypass that;
  it's how fast Google itself updates those numbers, not a wiring limitation.

---

## Gig Moderation — resolved design (2026-07-26)

**Tabs:** Posted, Reported, Suspended (same 3 tabs as the current mock — UI unchanged).

- **Reported** and **Suspended** stay as small, always-current paginated queues. This is the real
  safety net — the only place moderation is expected to be exhaustive.
- **Posted** is NOT a live/real-time feed. It's a "glance" tool:
  - Refresh loads the newest batch (no live listener).
  - "Load More" is optional, for looking a little further back.
  - **No gap-guarantee.** It is explicitly NOT meant to catch every gig ever posted — that's
    a fool's errand at scale and was never the point, even conceptually, if it had stayed live.
    Trying to guarantee zero gaps (e.g. "since last seen" cursor tracking) was considered and
    **rejected** — it would create an ever-expanding backlog the admin can never catch up to, for
    a tab whose actual job is just probabilistic spot-checking.
  - Cost is 100% usage-driven: nothing is charged between clicks. In practice this tab will cost
    more over time than the equivalent Users tab, purely because gigs get posted faster than users
    sign up (repeat postings from the same customers) — not because a gig record costs more to
    read than a user record (it doesn't; Firestore prices all document reads the same).
- **Search bar** finds any gig by title (not just Reported ones) — this is how an admin acts on
  something they personally spotted live on the site.
  - Implementation: Firestore prefix-match query (`title >= X`, `title <= X + '\uf8ff'`). Cheap at
    any scale — cost is based on matches returned, not collection size. Limitation: matches from
    the start of the title only, not fuzzy/contains search. A dedicated search service (e.g.
    Algolia-style) is a future upgrade if search quality becomes a real complaint — not a v1
    requirement.
  - Search results show a **status badge** per card (Active / In Progress / Completed / Suspended)
    instead of a separate filter dropdown — handles duplicate/similar titles cleanly. No badge
    needed for "Deleted" — confirmed deleted gigs are hard-deleted (removed from Firestore
    entirely), not soft-deleted with a status flag, so there's nothing left to search/badge.
  - The gig detail overlay (Suspend/Contact/Close/Delete actions) is reused unchanged regardless
    of whether the card came from search, Reported, or Suspended — it only needs a gig ID.

**Ban cascade (triggered from User Management → Suspend/Ban action, affects gigs):**
When a user is banned, three things need to happen, not just suspending their own gig listings:
1. **Auto-suspend all gigs posted by that user.** Not auto-delete — suspend is reversible and
   keeps a record (useful if the ban is disputed or needs evidence later). "Permanently Delete
   Gig" stays a separate, deliberate, per-gig manual action.
2. **Withdraw that user's pending applications on other people's gigs**, so they disappear from
   other customers' applicant lists and free whatever application slot they were holding.
3. **Reopen any gig where the banned user was the hired worker**, and notify the customer.
   - The reopening mechanic already exists and is proven: it's the same logic used when a deleted
     account leaves a "ghost hire" behind (`firebase-db.js` ~line 2588/2597 — clears
     `hiredWorkerId`, stamps `voidedWorkerId`, reopens the gig to `active`). Banning just needs to
     trigger this same path, not build new state-change logic.
   - **The notification is new, not reused.** The existing `contract_voided` alert type is
     WORKER-facing (fires when a customer voids/relists a hire) — confirmed in code
     (`PRODUCED_WORKER_ALERT_TYPES` in `alerts.js`/`messages.js`/`support.js`). A ban needs the
     opposite direction: a **customer**-facing notification. Copy (locked):
     **"Worker account revoked, your gig has been opened again on the market."**
   - Net effect: most of the mechanical risk is already tested via the existing reopen path; the
     new surface area is small (new notification recipient/copy + wiring the trigger to "ban"
     instead of only "account deletion").

---

## User Management — resolved design (2026-07-26)

**Tabs:** New, Pending, Verified, Suspended (current mock has all 4 in the first row).

- **New** gets the same "glance" treatment as Gig Moderation's Posted tab: refresh loads the
  newest batch, Load More is optional, no gap-guarantee, no live listener. Same cost model as
  Posted (Firestore prices all document reads the same regardless of collection) — in practice
  this tab will likely need fewer Load More clicks than Posted per check-in, since new signups
  arrive slower than new gig postings, but that's a volume/usage difference, not a technical one.
- **Suspended** stays a small, always-current paginated queue (same category as Reported gigs).
- **Pending** and **Verified** — these map to the ID-verification submission workflow (uploading
  actual ID documents for Pro/Business trust tiers), which is **not built** (separate future work,
  distinct from Face Verification Video which IS live). Decision: **hide these two tabs from the
  tab row for now** (don't delete the markup/code) — an always-empty tab for a feature that
  doesn't exist yet is just confusing UI. Quick to unhide once ID verification ships. Matches the
  existing codebase pattern of hiding (not deleting) unbuilt-feature UI
  (`docs/preserved-ui/account-settings-deferred-ui.md`).

---

## Support (Messages) — resolved design (2026-07-27)

Was deliberately parked earlier in this study ("not releasing for real users until dashboard is
good to go") — now resolved on request, same level of detail as the other three sections.

- **Architecture:** small paginated queue on `support_requests`, same cost pattern as
  Reported/Suspended — no live listener. Submit side and user-read side already work today; only
  the admin queue + reply-writer is missing.
- **Admin workflow:** keep the mock's structure as-is (New / Old / Sent tabs). The mock already
  has a "Mark as Resolved" confirm action that closes a ticket and moves it to the resolved
  section — that's the existing New→Old mechanism, not something new to design.
- **Reply delivery: in-platform only.** A reply is a write to the existing `support_requests`
  record; the user's already-live Support page picks it up next time they open it
  (`mapSupportRecordToUnifiedMessage`). **No email, no push, nothing leaves the platform** — owner
  decision, applies to all platform communication generally, not just Support.
- **Topic filter — must read from the real shared taxonomy, not a separate hardcoded list.**
  Confirmed in code (`public/js/support-taxonomy.js`, `SHARED_SUPPORT_TOPICS`): the actual topic
  list used by the live user-facing compose form is **Account Issues, Complaints & Disputes,
  Feature Request, Bug Report, Safety & Security, Payment & Billing, Partners & Sponsors, Other**
  — this is intentionally a single shared list so the compose form and any inbox filter stay in
  sync. The admin dashboard's topic filter should read from this same shared file, not the mock's
  separate hardcoded dropdown (which has different/stale option names). A legacy code→code map
  also exists in the same file for old pre-taxonomy `support_requests` docs.
- **Public Message (broadcast to all users) — confirmed safe, keep in scope, not a
  spam/abuse concern.** Verified in code: broadcasts are architecturally part of the Support/inbox
  system as their own category (System Updates / Promotions / Platform Updates — already present
  as filter options in `support.html`'s dropdown), completely separate from the personal
  gig-activity notifications that drive the Alerts unread badge (`PRODUCED_WORKER_ALERT_TYPES`
  etc.). A broadcast **does not** touch Alerts counts. It's also naturally cheap: one message
  document is read by every user who opens their inbox, not written once per recipient.
- **No extra "who's handling this" locking mechanism needed.** A reply is visible directly in the
  ticket thread the moment it's written — that visibility alone is enough to avoid double-replies,
  even with multiple admins. Matches how the mock already displays it.

## Open items

1. **Firebase/Google Analytics** — needs to be turned on (Firebase Console + SDK) before the User
   Activity card has any data to pull. Separate action item from dashboard build.
2. **Billing API access** — needs the read-access grant set up once, deliberately, when Traffic &
   Firebase Costs gets built. Owner confirmed OK to proceed (2026-07-27).
3. **Deleted-gigs assumption** — confirmed hard-delete (no soft-delete/status flag kept). If this
   ever changes, the "no Deleted badge needed" call in Gig Moderation would need revisiting.

Regional Distribution and Age Groups are now fully designed (see Overview section above) — no
longer open questions, just not yet built.

## Build order (recommendation, not yet locked)

Architecture/cost study is now **complete**: Gig Moderation, User Management, Overview, and
Support all have resolved designs. Settings and Ad Placement already have scoped plans from
earlier tasklist work and don't need a study pass. Chats/Financial/sidebar-Analytics-page stay
cut/deferred. Next decision is build order across all five real sections (Gig Moderation / User
Management / Overview / Support / Settings / Ad Placement) — none of them technically depend on
each other, so this is a sequencing preference, not a technical constraint.
