# GISUGO V1 — Production Hardening Tasklist

> Status: **Active** · Last updated: 2026-07-24
> Mode: production-hardening. Policy: no mock fallback / fail clearly. No platform rewrite.
> Companion docs: `docs/V2_NATIVE_APP_PLAN.md` (future app), `FIREBASE_SCHEMA.md` (data model).

This is the working tasklist for getting GISUGO web production-solid. Resume here after
any break. Linchpin insight: **the Admin Dashboard is the unlock** for Support email,
disputes, and admin notifications — and it needs an architecture/cost study first.

### Where we are (2026-07-20)
**Track G (login / auth) is CLOSED.** **Item 3 SHIPPED** (code + hosting/functions deploy):
standalone Alerts + Support pages live; Contact merged into Support Write overlay; Messages hidden
from menu (page kept for premium chat); push deep-links → `/alerts.html?role=…`; chat unread
listeners gated. Theme polish rolled to Alerts/Jobs chrome + `#141b24` page fill across Profile,
new-post, Support, Updates, Forum, category listings/modals (PRs #44–#49).
**Notification alert/count + tray smoke: COMPLETE** — 2026-07-19/20 and **phone retest
2026-07-24** (alert card + unread count + phone tray for all 8 critical types — see §E0d).
**Tray tap → Alerts:** shipped 2026-07-20 PM + **user-confirmed in phone retests** (opens Alerts,
role-aware; §E0c / §E0d).
**Still open (real next work):** Admin Dashboard (Track C) — unblocks Support *admin reply*,
Report Dispute beyond mock UI, moderation, etc. **Deferred (3+ accounts):** 5+/auto-pause.
**Not blocking / not next:** user-side Support Write already ships tickets to `support_requests`
(admin reply is the dashboard piece); optional legacy `messages.html?threadId=` deep-link check
(hidden Messages page kept for future premium chat — not a product priority).
**Meta Facebook app:** Live (published ~days before 2026-07-15) — not waiting on App Review.
Agents cannot see the Meta dashboard; treat Live as confirmed when non-role users can FB-login
(user + friend-device tests) and Auth shows multiple distinct `facebook.com` providers.

### ⛔ Agent rule — verify production data before reporting status
**Hard gate:** run the matching script in the **same turn** before answering. No script output → no claim.

| Topic | Command |
|---|---|
| Login / auth methods | `node scripts/verify-production-data.js users-auth` |
| Phone on file | `node scripts/verify-production-data.js users-phone` |
| Counts / backlog status | `node scripts/verify-production-data.js summary` |

`providerId=password` is **not** phone+password unless credential email ends with `@phone.gisugo.app`.

See `AGENTS.md` § "verify production data."

---

## ✅ Done
- **Documentation audit + reorg** — 14 docs deleted, 24 archived to `docs/archive/`,
  root trimmed to 10 living refs, stale statuses updated, FVV marked implemented.
- **V2 native app plan** — direction locked (React Native/Expo), documented.
- **`npm run dev`** — live-server wired (`http://127.0.0.1:5500`), dev convenience only.
- **Item 3 Alerts/Support pages** — shipped + deployed 2026-07-16/17 (see Item 3 section).
- **Theme fill polish** — `#141b24` + Alerts-style chrome across main app surfaces (PRs #44–#49).

---

## Track A — Quick, safe cleanup (DONE 2026-06-18, except 1 deploy)
- [x] **Delete orphaned phone-migration Cloud Function** (`migrateLegacyProfilePhones`).
      **Code deleted + client callers removed** (`profile.js` `runLegacyProfilePhoneMigrationIfAdmin`
      and the `sign-up.js` caller). ✅ **Backend function deleted from the cloud 2026-06-27** during
      the push-enable functions deploy (`firebase deploy --only functions --force`). Fully closed.
- [x] **Remove dead fake-chat code** in `messages.js` — removed the whole dead island:
      `initializeDynamicMessageSending`, `sendDynamicMessage`, `createMockMessage`,
      `createMockResponse`, `getCurrentUserAvatar`, `addMessageToThread`, plus the 3 helpers
      left orphaned (`formatMessageTime`, `extractParticipantId`, `getParticipantAvatar`).
      Live `showTemporaryNotification` / `generateMessageHTML` untouched. ✅ Hosting deployed.
- [x] **Remove the "always logged in" demo shim** — `isUserLoggedIn()` kept its real Firebase
      check and now falls through to an honest session check (removed the localhost-dev bypass
      + the `return true` live-demo line). Used in 3 live spots (own-profile view + account
      settings gating). ✅ Hosting deployed.
      ⚠️ Verify on live: a logged-OUT user should no longer see Account/own-profile controls.

## Track B — Security hardening (DEFERRED — fold into Admin/backend pass)
> **Full scope mapped in `docs/NOTIFICATIONS_AND_APPLICATIONS_LOCKDOWN.md` — read that first.**
> Applications + notifications lockdown is one server-side job (notification delivery and the
> worker-accept→reject-others flow are cross-user and must move to Cloud Functions). Notifications
> are already half server-side (push + counters). Pre-launch, the gap is non-UI/technical-only and
> NOT urgent. Groundwork (`gigOwnerId` stamp + backfill) is done and stays.

- [~] **Applications read rule (Option B):**
      - [x] Step 1 — stamp `gigOwnerId` (= job.posterId) on new applications, both write
            paths (`firebase-db.js` SDK object + REST fallback serializer). Additive, no
            access change. ✅ Hosting deployed 2026-06-18.
      - [x] Step 2 — one-time backfill via `scripts/backfill-gig-owner.js` (Admin SDK key).
            ✅ Ran 2026-06-18: 113 stamped, 2 orphaned-skipped (apps whose parent gig
            `Ji2aIuRJNYAegWgWRzfv` was deleted — junk to clean up later).
      - [ ] Step 3 — tighten read rule. **BIGGER THAN PLANNED (discovered 2026-06-18).**
            Firestore only allows a query if its constraints guarantee every returned doc is
            readable. Several live queries read "all applications for a job" with no
            applicant/owner constraint and would be REJECTED by a strict rule:
              • worker reapplication check — `firebase-db.js` SDK path ~L1778 (broad scan +
                client-side filter; REST path already filters by applicantId)
              • worker auto-pause fallback — `firebase-db.js` ~L1883 (primary path already
                uses `job.applicationCount`; only the fallback scans)
              • owner views/manages applicants — `firebase-db.js` ~L2121/2383/2784,
                `jobs.js` ~L4351/4488
            Safe tighten requires: refactor those to filter by `applicantId == uid` (worker)
            or `gigOwnerId == uid` (owner); make auto-pause rely ONLY on the job counter
            (workers can't read others' apps); add gigOwnerId composite indexes + deploy;
            then tighten rule + enforce `gigOwnerId == job.posterId` on create; test apply +
            hire/manage on BOTH SDK and iOS-REST paths. Treat as its own tested task.
- [ ] **Notifications hardening:** move deduped cross-user notification *creation* to the
      backend (a callable function; negligible cost — same reads/writes + ~1 free function
      call each), THEN lock reads/updates/deletes to the recipient only. **Test for blocked
      notifications after.**
- [x] **Re-enable admin identity — COMPLETE (2026-07-31).** Replaced the disabled email
      allowlist with a proper `admins/{uid}` Firestore collection (uid-keyed, not email —
      accounts sign in via multiple providers whose "primary" email can vary). `isAdmin()` /
      `isSuperAdmin()` in `firestore.rules` check membership + `role` there. Bootstrapped via
      `scripts/bootstrap-primary-admins.js` (Admin SDK, bypasses rules — the only way to create
      the first admin(s)); both primary accounts (Peter J. Ang, GISUGO Operations) are
      `super_admin`. Prerequisite for Track C.

## Track C — Admin Dashboard (linchpin)
- [x] **#8 Architecture + cost study — COMPLETE (2026-07-27).** Full detail in
      `docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md`. Core rule: never live-listen or scan real
      collections for a number/feed — small counter docs (Cloud Function–maintained) feed
      headline stats, workflow queues (Reported/Suspended/Support) stay small paginated lists,
      "browse everything" lists get a no-guarantee "glance" treatment (refresh + optional Load
      More, no live listener, no gap-guarantee) instead of real-time population.
      **Resolved:** Gig Moderation (Posted = glance, Reported/Suspended = queues, search by title
      + status badges, ban cascade incl. new customer-facing "worker revoked, gig reopened"
      notification), User Management (New = glance, Suspended = queue, Pending/Verified hidden
      until ID verification ships), Overview (Total Users/Gigs Reported/Gigs Analytics wired with
      counters incl. Age Groups off `dateOfBirth` made required + Regional Distribution off a
      one-time signup-only GPS capture bucketed into the 17 official PH regions, no province
      carve-outs for now; Verification Submissions + Total Revenue hidden until their backing
      features exist; Storage/User Activity/Traffic-Costs kept as manual-refresh snapshot cards
      sourced from the *correct* external tool instead of self-reported Firestore), and Support
      (paged queue on `support_requests`, in-platform-only replies — no email/push, topic filter
      reads the real shared taxonomy in `support-taxonomy.js`, Public Message broadcast confirmed
      safe/cheap and unrelated to Alerts counts). Settings + Ad Placement already scoped from
      earlier tasklist work. Chats/Financial/sidebar-Analytics-page stay **cut/deferred** (no real
      backend to wire against yet, or need tools Firestore can't provide — e.g. self-reporting
      Firebase cost). Unblocks: Support tab responses, dispute submissions, admin notifications,
      gig-report moderation.
- [x] **Step 0: Admin dashboard access gate — COMPLETE (2026-07-31).** `admin-dashboard.html`
      now stays fully hidden behind an overlay (`public/js/admin-auth-gate.js`) until the signed-in
      account is confirmed present in the `admins` collection: logged-out → sent to login; logged
      in but not an admin → blocked with "Access denied"; admin → dashboard reveals, real name/role
      replaces the old hardcoded "Peter J. Ang" mock, `window.currentAdmin.role` available for
      future role-based section hiding (e.g. a limited support-only admin). Logout button now
      actually calls Firebase `signOut()` (previously a no-op redirect). **Next: lock build order,
      then build.**
      **False alarm investigated + reverted (2026-08-04): "Access denied" for a real admin, root
      cause never confirmed.** Both primary test accounts hit "Access denied" on
      `admin-dashboard.html` once, then worked on retry with no code change in between. Guessed at
      a Firestore stale-cache root cause (pattern-matched to other SDK cache flakiness seen
      elsewhere that day) and iterated four rounds of increasingly defensive code
      (`source:'server'` re-verification, background revoke-detection, read timeouts) on top of
      that guess — without ever actually confirming it with real evidence (no console log was
      captured at the moment of the original failure). **Self-audit + user call: reverted all of
      it back to the original committed gate** (`git checkout`, nothing had been shipped). None of
      the four rounds were ever confirmed necessary, the accounts affected are 2 trusted internal
      testers (not a live attack surface), and the added complexity (background DOM mutation,
      cache-vs-server branching) wasn't worth carrying on an unverified theory. **If this recurs:**
      get a console log from the exact moment of failure before writing any fix — diagnose from
      evidence, not pattern-matching.
- [x] **Step 0.5: Strip all mock/simulated data from the dashboard before wiring real data —
      COMPLETE (2026-08-02).** Full surgical step-by-step + post-plan fixes in
      `docs/ADMIN_DASHBOARD_MOCK_REMOVAL_PLAN.md` (rollback tag `pre-mock-removal-2026-08-01` +
      local file snapshots still in place). Removed: 15 `setInterval` timers driving fake Overview
      stat cards, `generateMock*` functions for gigs/users/chats/admin-messages, 18
      `admin_mock_*` localStorage keys, the "Reset Analytics Data" dev-tools button, ~150 hardcoded
      mock numbers baked into `admin-dashboard.html`'s overlays/cards (now honest `0`/`0%`/etc.
      placeholders), and a small dead-comment cleanup in `messages.js`. Real operational localStorage
      (Settings, Ad Placement, sidebar state) explicitly left alone.
      **Bonus fix, same pass:** found and fixed a pre-existing (non-mock) bug in
      `getAdminAnalytics()` (`firebase-db.js`) — it queried two Firestore collections with no
      security-rules entry (`verification_requests`, `transactions`), which silently failed the
      whole batch and zeroed out two *other* reads (`users`, `jobs`) that were already valid and
      permitted. Fixed to fetch independently; **Total Users and Gigs Reported stat cards now show
      real live Firestore counts** (verified: 3 total users). Verifications/Revenue stay at 0 (no
      backend yet, matches the 2026-07-27 decision to hide them — though that hide was never
      actually implemented in the HTML; still flagged as open, see Overview section below).
      **Manual click-through still outstanding** (not done this pass): Gig Moderation, User
      Management, Messages/Support, Settings, Ad Placement — only Overview was interactively tested.
      **Next: lock build order, then build** (Overview is the shortest remaining lift, since
      `getAdminAnalytics()` now has 2 of 4 metrics already real).
      **Note added 2026-08-03:** when Gigs Analytics is built, also break it down by **Gig Use
      Type (Personal vs Business)**, not just category — full detail added to the "Gigs Analytics"
      bullet in `docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md`. Didn't exist when that study was
      originally written (Gig Use Type shipped 2026-08-03, see Track D).
- [x] **Phase 2: Gig Moderation built end-to-end — code complete, PENDING DEPLOY (2026-08-09).**
      Full design in `docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md` "Gig Moderation — resolved
      design" → "Implementation status" subsection. Built in 6 audited chapters:
      1. `firestore.rules` locks `jobs.status`/`reportCount`/`reportThreshold` away from owner
         writes once a gig is reported/suspended; `syncGigReportCountersOnCreate` Cloud Function
         aggregates `gig_reports` into those fields.
      2. `adminModerateGig` callable (suspend/reinstate/ignore) + `job_moderation_log` audit
         collection (admin-read-only).
      3. `executeBanCascadeOnUserSuspend` — auto-suspends a banned user's own gigs, withdraws
         their pending applications elsewhere, reopens gigs where they were the hired worker +
         new customer-facing `worker_banned_gig_reopened` notification.
      4. Full code-level audit of chapters 1-3 (no deploy yet).
      5. `admin-dashboard.js`/`.html` rewired off in-memory mock data onto the real
         functions/queries above — Posted (glance + Load More)/Reported/Suspended tabs,
         Suspend/Reinstate/Ignore/Permanently-Delete buttons, on-demand Reported-By list,
         debounced title search. Caught and fixed 2 real bugs during this pass: the job-date
         field is `jobDate` (plain string) not `scheduledDate`, and there is no separate
         `locationDetails` field (the free-text barangay/area input lives inside `extras`).
         Added the missing `jobs` (status+datePosted) and `gig_reports` (jobId+createdAt)
         composite indexes this UI needs.
      6. Docs updated (this entry + architecture study). **Not deployed** — functions/rules/
         indexes/frontend all need a Ship before any of this is live. Until then `jobs.status`
         changes remain fully open to owners in production (old behavior, unchanged risk).
      **Two separate report/contact surfaces exist here — status of each, confirmed 2026-08-09:**
      - **User-facing "Report Gig"** (the button/modal on the live gig detail page,
        `dynamic-job.js` → `submitGigReportToAdmin()` in `firebase-db.js`, writes straight into
        `gig_reports`) is **already fully built and confirmed wired end-to-end** — same collection
        and field names (`jobId`, `reporterName`, `reporterAvatar`, `subject`, `message`,
        `createdAt`) that Chapter 1's `syncGigReportCountersOnCreate` and Chapter 5's
        `getGigReportsForJob()`/"Reported By" list already consume. **No action needed.**
      - **Admin-side "Contact" button** (in the Gig Moderation detail panel/overlay — desktop
        `contactGigBtn` + mobile `gigOverlayContactBtn`, both always visible regardless of gig
        status, opening the "Contact Regarding Gig" form with Recipient/Message/Attachment) is a
        **real, separate, still-unbuilt feature** — see next bullet.
- [ ] **Wire "Gig Moderation → Contact" admin messaging (Send Message button is currently a mock).**
      Confirmed 2026-08-09: the button/overlay itself is real and always shown in the Gig
      Moderation detail panel (`admin-dashboard.html`/`.js`, `contactGigOverlay` /
      `initializeContactGigOverlay()`), but clicking Send Message only shows a toast + logs to
      console — no message is actually created or delivered. Needs: pick a delivery mechanism (most
      likely reuse the existing `chat_threads`/`chat_messages` system so it lands in the
      poster's/worker's regular Messages inbox, tagged as coming from an admin re: this gig, rather
      than inventing a parallel admin-only inbox) + wire the Recipient dropdown to the gig's actual
      poster/hired worker + wire the optional photo attachment. Not part of Phase 2 (Gig
      Moderation's read/suspend/reinstate/ignore/delete actions don't depend on it) — tracked here
      so it isn't lost, build whenever it's prioritized.
- [ ] **Support responder (admin side) — BLOCKED on this dashboard.** User-facing Support page
      shipped (Item 3); admin reply tooling is still missing. Current wiring:
      • **Submit side WORKS:** Support Write overlay (`support-compose.js`, channel `contact_page`)
        writes to `support_requests` (`contacts.html` redirects to `support.html?compose=1`).
      • **User read side WORKS:** `support.js` streams the user's own `support_requests` and renders
        an admin reply when the record carries one (`mapSupportRecordToUnifiedMessage`).
      • **MISSING = admin side:** no tool for an admin to read the `support_requests` queue and write
        a response (`admin-dashboard.js` still has mock support data). Users can send but nothing
        can reply until the dashboard adds a Support queue + reply writer (+ optional email notify).
        Build with #8/#4.
- [ ] **Settings must be server-backed (Firestore), NOT localStorage.** (2026-06-27) The admin
      settings object (`gisugo_admin_settings`) currently lives in per-browser `localStorage`,
      so global toggles behave inconsistently across browsers/devices. Concrete symptom found:
      the homepage intro-video gate (`showHomepageVideoForLoggedIn`, read in `index.html`
      `getHomeVideoSettingAllowLoggedIn()`) shows the video to logged-in users only on browsers
      where the dashboard had been opened. When wiring the dashboard, move these settings to
      Firestore and have `index.html` read the shared value. Until then, cosmetic only — deferred.
- [ ] **#9 Block-user feature (approved).** Likely user-to-user only (NOT dependent on
      Admin Dashboard) — needs its own small backend (store blocks + chat enforcement).
      Confirm plumbing when started.

## Track D-misc — Notification copy / "slots reopened" reframe
- [x] **Closure alerts reframed to a reason-neutral "Application Slots Open" abundance signal**
      (2026-06-27, deployed). Full rationale + cost study in
      `docs/APPLICATION_LIMIT_UX_REDESIGN.md`. Summary:
      • All closure reasons (manual decline + not-selected-after-hire) now funnel into ONE unified
        notification type `application_slots_reopened_batch`, batched in the existing rolling 6-hour
        window. Card shows only the **count of slots that reopened** + "find your next gig(s)!" —
        zero rejection language. Title "Application Slots Open" (🔓), trilingual.
      • Rejection is conveyed elsewhere (2-applications-max-per-gig + the "Limit Reached" apply
        button state), so the alert stays purely positive/re-engagement.
      • Batching kept deliberately: the worker sees one card tallying multiple freed slots
        (abundance framing) rather than a string of individual losses. Cost difference batched vs.
        real-time is <$1/mo even at 100k workers, so the choice is UX-driven.
      • Slot itself returns INSTANTLY on every closure (`releaseApplicationCoinForApplication` →
        `applicationCoinsCurrent + 1`); the notification is just the heads-up, never gates capacity.
      • Changed: `firebase-db.js` (`buildSlotsReopenedMessage`, unified type in
        `createGroupedApplicationClosureNotification`, counter-type set) + `messages.js`
        (`getLocalizedAlertMessage`, `tAlertLang`, render switch, `BATCH_WORKER_ALERT_TYPES`).
        Legacy types still render (with the same uniform copy) for any pre-existing cards.
      • NO Functions redeploy needed: these closure types are NOT in the Cloud Function's
        `CRITICAL_PUSH_NOTIFICATION_TYPES`, so they're **in-app Alerts only — they do not push.**
- [x] **Push enabled for "slots reopened"** (2026-06-27, functions deployed). Added
      `application_slots_reopened_batch` to `CRITICAL_PUSH_NOTIFICATION_TYPES` + push title
      ("Application Slots Open") in `functions/index.js`. Workers now get a browser/phone push
      (one per 6-hour batch, since push fires on doc CREATE only — fold-ins stay silent), same
      channel customers already get for `application_received`. Caveat: iOS web push only works if
      the site is installed as a PWA to the home screen (iOS 16.4+); plain Safari tabs get nothing —
      another point for the V2 native app.

## Track F — Infrastructure
- [x] **Cloud Functions relocated `us-central1` → `asia-southeast1`** (2026-06-27, deployed + verified).
      Database, users, and audience are all SE-Asia; functions were on the Firebase default region,
      adding cross-region latency (the "slight delay" noticed for months) and minor egress cost.
      • All 7 functions now live ONLY in `asia-southeast1` (verified via `firebase functions:list`):
        `checkSignupRateLimit`, `getFaceVerificationMediaAccess`, `auditAndRepairFaceVerification`,
        `normalizeFaceVerificationVideo`, `cleanupOldReadNotifications`, `sendPushOnNotificationCreate`,
        `syncNotificationCountersOnWrite`. Set via `region: "asia-southeast1"` in `functions/index.js`.
      • CRITICAL companion change: callable clients defaulted to `firebase.functions()` (= us-central1).
        Updated the 4 call sites to `firebase.app().functions('asia-southeast1')` so FVV + signup
        rate-limit hit the new region — `profile.js` (×2), `sign-up.js`, `jobs.js`. Hosting redeployed
        with bumped versions (profile.js v85, sign-up.js v5.6, jobs.js v143).
      • Deploy note for future region moves: first `--force` deploy failed to BUILD
        `normalizeFaceVerificationVideo` (generic, transient Cloud Build error) which made Firebase
        skip ALL us-central1 deletes (safe — both regions coexisted briefly). Fixed by redeploying that
        one function, then a final `--force` deploy cleaned up the 6 leftover us-central1 functions.
      • Post-deploy verification (2026-06-27): `getFaceVerificationMediaAccess` CONFIRMED working in
        the new region — viewed an FVV via Gigs Manager → Customer → Listings → View Applications →
        Profile → Face Verified; video reached CANPLAY and the client logged NO
        "fallback to local URLs" warning (that warning only prints on callable failure). Same callable
        powers the `jobs.js` path, so that's covered too.
      • [x] **All callers verified working in asia-southeast1 (2026-06-27).**
        - `getFaceVerificationMediaAccess` — confirmed (FVV view, no fallback warning).
        - `normalizeFaceVerificationVideo` — confirmed via the stored video's custom metadata
          `normalizedBy: fv-normalizer-v1` after a new-account FVV record + edit. NOTE: its first
          relocation deploy failed to build and got patched via an "update," which skipped the
          public-invoker grant → browser CORS error. Fixed by deleting + cleanly recreating the
          function (a clean CREATE restores the invoker). Lesson logged: for "did it work?"
          checks, read the stored artifact's metadata first (fastest source of truth).
        - `checkSignupRateLimit` — confirmed via function log: real AUTOSCALING invocation during a
          new signup, "Callable request verification passed" (auth VALID).

## Track F — Infrastructure (cont.)
- [ ] **Migrate FVV to client-side mp4 (deferred — full study done).** Replace the server-side
      `normalizeFaceVerificationVideo` transcode with on-device mp4 recording + direct upload.
      Full plan, code touchpoints, browser matrix, risks, and test plan in
      `docs/FVV_CLIENT_SIDE_MIGRATION.md` (2026-06-27). Key points:
      • Driver is **reliability / fewer moving parts**, NOT cost (~$25/100k lifetime) or bandwidth
        (capture is already size-constrained at 360×640 / 220 kbps → ~146 KB files).
      • Capture **already prefers mp4** and constrains size; migration mostly means dropping the
        webm fallback, gating unsupported browsers with a clean block, and removing the server call.
      • Verified browser support: Chrome 126+ (desktop+Android), all Chromium mobile, Safari (iOS/
        macOS) record mp4; **Firefox (non-iOS) is the only real gap** → hard-block (per no-fallback).
      • Decision needed: accept hard-blocking Firefox-Android/legacy (tiny SE-Asia slice).
      • Recommended sequencing: build + harden the recorder in the OTHER project first, then port
        here as a clean swap (don't rewrite a working trust flow on an unproven module).

## Track D — Product/UX
- [x] **"Payment Type" → "Gig Use Type" rename (Per Gig/Per Hour → Personal/Business) — COMPLETE
      (2026-08-03).** Product decision: avoid "Per Hour" phrasing (reads like employment, not
      one-time freelance gigs); replaced with Personal/Business so workers know what kind of
      customer/setting they're applying to, and it doubles as future platform-usage analytics.
      Renamed field end-to-end: `paymentType` → `gigUseType` in `firebase-db.js` (write defaults +
      `getJobsByCategory` filter), `new-post2.html`/`new-post2.js` (step picker, edit-mode dropdown,
      new icons — 🙋🏻 Personal / 🏢 Business), `listing.js` (badges, filter dropdown, class logic),
      all ~58 category HTML files (filter widget + footer label), `dynamic-job.html`/`.js`, and
      `jobs.js` display text. Also swept `new-post2.html` for user-facing "job/jobs" → "gig/gigs"
      text (careful not to touch function/file names). One-time data migration
      (`scripts/migrate-payment-type-to-gig-use-type.js --apply`) run 2026-08-03 against all 69
      live sample gigs (55 → Personal, 14 → Business), old `paymentType` field removed.
      `new-post.html`/`new-post.js` (pre-`new-post2` legacy files) confirmed dead/unreferenced —
      deletion + `new-post2` → `new-post` rename still pending as a separate low-risk follow-up.
      **Two real (pre-existing, unrelated to the rename itself) bugs found + fixed in `listing.js`
      during verification:**
      1. A leftover filter guard still checked the literal string `'PAY TYPE'` (the old sentinel
         value) instead of the renamed default `'GIG TYPE'`, so it was always-true and silently
         filtered out every single gig on every category page regardless of any filter selection.
      2. When a filter narrowed results to zero matches, the code showed the "no gigs" empty state
         but never removed previously-rendered cards still in the DOM; a separate guard then saw
         those stale leftover cards and cancelled the empty state, so an old card would keep
         showing under a filter that should have produced no results (most visible on categories
         with very few gigs, e.g. a lone Personal gig still showing under a Business filter).
      **Bonus fix, same pass (2026-08-03):** found and fixed a genuine race condition in
      `filterAndSortJobs()` — the warm-cache-then-background-revalidate flow could have its
      background Firebase read resolve *after* a newer filter/region click's own read, silently
      overwriting the newer (correct) result with the stale one. Fixed with a request-generation
      counter: each call gets an incrementing ticket, and a result is only applied to the DOM if
      no newer call has started since. Verified this does not affect the instant-from-cache render
      on back-navigation (that render is fully synchronous, happens before any network call, and
      isn't gated by the new check at all) and does not change Firestore read counts (the
      duplicate background read still happens either way — this only decides which of the two
      answers wins on screen). A related cost optimization (skip the background re-check entirely
      when the cache is very fresh) was discussed and intentionally **deferred** — see Track E.
- [x] **Nationwide Region/City expansion + kill the barangay dropdown for free-text location
      details — BUILT (2026-08-03), statically audited, pending user's live click-through test.**
      Triggered by the Region picker
      (`hatod.html` screenshot) only offering 9 hand-picked regions (Cebu/Bohol/Leyte/Masbate/
      Negros/Panay/Samar/Davao/Manila) with hand-typed city lists, duplicated across exactly 2
      files (`public/js/listing.js` + `public/js/new-post2.js` — **not** duplicated across the 56+
      category HTML files themselves, which only hold an empty placeholder div populated by
      `listing.js` at runtime). Locked scope:
      1. **Region → City reference file, all 17 official PH regions (~1,634 cities/municipalities),
         sourced from the official PSGC (Philippine Standard Geographic Code) dataset** — not
         hand-typed from memory (accuracy risk at this scale). One shared file replacing the
         duplicated 9-region data in both `listing.js` and `new-post2.js`. Load eagerly (no lazy
         loading) — measured the current 9-region block at 5,866 bytes for ~385 cities; scaling to
         all 1,634 lands ~25-30KB uncompressed / ~6-10KB gzipped, a rounding error next to the
         Firestore SDK (~250-300KB) already loaded on every page. City dropdown stays filtered by
         the already-selected region (same 2-step UX as today), so this is not a "1,634-item
         dropdown" usability problem either.
      2. **Barangay-level granularity dropped entirely — replaced with free text.** Originally
         planned as a 3rd tier (region→city→barangay) for `new-post2.js`'s "location detail" fields
         (Pickup at:/Deliver to: for `hatod`, Load at:/Unload at: for `hakot`, Shop at:/Deliver to:
         for `kompra`, and a generic "Location:" field used by ~35 other categories — see
         `extrasConfig` in `new-post2.js`). Rejected: full nationwide barangay coverage is ~42,046
         barangays (several MB, real lazy-load architecture needed) vs. the actual product need
         (a human-readable landmark/area hint for gauging travel distance) — free text serves that
         better and more accurately than a rigid official-name dropdown anyway. Also **not a new
         behavior** — the current code already silently falls back to free text for any city
         without hand-curated barangay data (i.e. everywhere except ~10 major cities), so this
         change actually makes an already-inconsistent UX (10 cities dropdown, everywhere else
         text) into one universal, consistent behavior. Delete `barangaysByCity` +
         `getBarangaysForCurrentCity`/`cityHasBarangayData` dropdown-vs-fallback logic entirely.
      3. **Input UX for the free-text fields:** category-specific placeholder hint (e.g. `hatod`
         Pickup at: → "barangay name or general area"), `maxlength` (starting point ~40 chars,
         tunable), **and a live character counter** (e.g. "24/40") — explicitly NOT relying on the
         card's existing CSS `text-overflow: ellipsis` (`listing.css` `.extra-value`) to communicate
         the limit, since a typist can't see where an ellipsis will cut until after the fact.
      4. **Listing-page filters unaffected** — confirmed they only ever need region + city, never
         barangay, so this doesn't touch `listing.js`'s filter-by-region behavior beyond swapping in
         the bigger reference file.
      **Known trade-off, accepted:** free text means no structured barangay data for any future
      admin analytic or filter that might want it (e.g. "gig activity by barangay") — nothing today
      needs that and nothing is roadmapped to, so deemed acceptable; reversible later if it ever is.
      **What was actually built (2026-08-03):**
      1. New shared file `public/js/ph-locations.js` — 73 top-level "region" groups (up from 9),
         ~1,632 cities/municipalities total, ~25KB uncompressed. The **original 9 keys/values are
         byte-for-byte identical** to the prior hardcoded data (extracted programmatically from
         `listing.js`, never retyped) — zero risk to existing live Firestore gig documents whose
         `region`/`city` fields already match those exact strings. The other 64 groups are
         **auto-generated from the official PSGC dataset** (via
         `open-admin-data/philippines-administrative-divisions`, CC-BY-4.0, PSA-sourced), grouped
         by **province** (not the stricter 17-region tier) to match the granularity the original 9
         keys already established (e.g. "DAVAO"/"PANAY" are themselves multi-province informal
         groupings, not single official regions) — switching to strict 17-region tier would have
         actually been a UX regression (e.g. Cebu + Bohol + Negros Oriental + Siquijor would all
         collapse into one "Region VII" bucket). Two pre-existing naming quirks carried forward
         as-is, not introduced: `"NEGROS"` = Negros Occidental only (new `"NEGROS ORIENTAL"` is a
         separate key); `"SAMAR"` = Western Samar only (new `"EASTERN SAMAR"`/`"NORTHERN SAMAR"`
         are separate keys). Full attribution and rationale documented in the file's header comment.
      2. `public/js/listing.js` and `public/js/new-post2.js` both now source region/city data from
         `PH_LOCATIONS`/`PH_LOCATIONS_REGION_ORDER` (new script loaded before each on every page)
         instead of their own local copies — kept the exact same variable names
         (`regions`/`citiesByRegion` in `listing.js`, `locationData` in `new-post2.js`) so no
         downstream code in either large file had to change. Found and fixed a **second**, separate
         hardcoded 9-region array in `listing.js` (`populateRegions()`'s local `regionData`, the
         code that actually renders the "Select Region" picker UI) that the shared-file swap alone
         wouldn't have caught — plus a display-casing bug there (`region.charAt(0) + ...` mangled
         multi-word names like "LA UNION" → "La union"; replaced with a word-aware title-case
         helper that also keeps "del"/"de" lowercase per PH naming convention, e.g. "Zamboanga del
         Norte"). Fixed a dead-code key mismatch in `new-post2.js`'s `defaultCities` map (`"DINAGAT"`
         → `"DINAGAT ISLANDS"`, now matches the real key so that default actually fires).
      3. Barangay dropdown system fully removed from `new-post2.js`/`new-post2.html`: deleted
         `barangaysByCity` (hand-curated data for ~10 major cities only), `getBarangaysForCurrentCity()`,
         and the unused/dead `cityHasBarangayData()`. The "location" `menuType` (Pickup at:/Deliver
         at:/Load at:/etc., ~35 categories) is now unconditionally a free-text input, never a
         dropdown.
      4. Free-text location inputs: `maxlength="25"` (started at 40, user visually checked against
         the listing card layout and cut it to 25 — 40 ran into the price box), placeholder
         "Barangay name or general area", live character counter (e.g. "12/25") using the same
         `.np2-char-counter` pattern already used for the Gig Title field, reusing the existing
         `blockUnsupportedCharsForInput` sanitizer for consistency with other text fields. Counter
         resets correctly on category/city change and on full form reset.
      **Audit method:** no live browser tool was available in this session (cursor-ide-browser MCP
      server not present), so verification was done via `node --check` syntax checks on every touched
      file, `git diff` line-by-line review of all changes, programmatic evaluation of the generated
      data file (73 keys confirmed, no duplicates, original 9 spot-checked byte-identical, casing
      spot-checked), and full-repo greps confirming no orphaned references to deleted
      functions/variables remain anywhere (including the duplicate/dead `regionPickerOverlay` markup
      in category HTML files, which was already a pre-existing issue, confirmed harmless and
      unrelated to this change). **Live click-through testing (actually opening the pages, clicking
      through the pickers, posting a test gig) was NOT done by the agent and still needs the user's
      pass before this is considered fully verified.**
      **Bundled-in fix (2026-08-03) — Select Region / Select City picker modals restyled.** User
      flagged these two modals as visually stuck on the old flat-gray design theme, out of step with
      the "FILTER Gigs" panel they open from. Rewrote `.region-picker-*`/`.city-picker-*` in
      `public/css/listing.css` to match the Gaming Filter Panel look (dark `#1a202c`→`#2d3748`
      gradient, `#10b981` green border/glow, rounded pill-style list items with hover/active glow,
      rotating "×" close button) — pure CSS, no HTML/JS changes (`listing.js` only toggles `.show`
      and queries `.region-picker-item`/`.city-picker-item` by class name, both left untouched).
      Bumped `listing.css?v=` cache-buster across all 55 category HTML files so the new styling
      isn't served stale from browser cache.       Also two small copy tweaks in the same pass: `new-post2`
      free-text location field limit lowered from 40→25 chars (user's live visual check against the
      listing card layout — 40 ran into the price box), and the Section 2 card title renamed from
      "Location & Gig Specifics" to "Location Details".
      **Bundled-in fix (2026-08-04) — Select Region/City picker overflow + font size.** User's live
      click-through caught a real regression from the 2026-08-03 restyle: `.region-picker-item`/
      `.city-picker-item` got horizontal padding + a border added for the new pill-style look, but no
      `box-sizing: border-box` — so each item rendered *wider than its container* (old design had
      zero horizontal padding, `padding: 18px 0`, which is why this never surfaced before). Fixed by
      adding `box-sizing: border-box` to both item classes plus their modal/list wrappers, and bumped
      font-size from `clamp(15px, 2.8vw, 18px)` to `clamp(17px, 3.6vw, 21px)` (region) / same (city)
      now that there's no more overflow margin to protect. Cache-buster bumped again
      (`listing.css?v=20260804b`).
      **Bundled-in fix (2026-08-04) — collapsed Filter Gigs footer bar text crowding.** Long
      region/city names (post-nationwide-expansion) had no overflow handling in
      `.filter-display-value` (`white-space: nowrap`, no `overflow`/`text-overflow`), so they spilled
      out of their column and visually smashed into the neighboring REGION/CITY/GIG TYPE value —
      user's screenshot showed "ZAMBOANGA DEL NORTBEACUNGAN (LEON T. POSTIGOSELECT" all overlapping
      on one line. Discussed 3 options (ellipsis truncation / JS font auto-shrink / wrap to 2 lines
      with a taller collapsed-bar height budget); user picked **plain character truncation, no
      ellipsis** — reasoning: the user already read+selected the full name in the picker modal, so a
      shortened reminder in this tiny at-a-glance strip is enough, and the untruncated name is always
      one tap away again via the REGION/CITY buttons in the expanded panel. Implemented
      `truncateFilterDisplayValue()` in `listing.js` (hard cap at 11 chars, picked by the user
      visually checking the actual footer bar width against names like "ALOGUINSAN"), applied in
      `updateFilterDisplay()` to the Region/City values only (Gig Type text is always short:
      SELECT/PERSONAL/BUSINESS, never truncated). Confirmed the only other reader of that same
      `filterDisplayRegion`/`filterDisplayCity` DOM text (`getSelectedRegion()`/`getSelectedCity()`
      in the search-bar script) only feeds a `console.log`, not actual filtering logic (which reads
      the separate `activeRegion`/`activeCity` module variables, never the truncated DOM text) — so
      truncating the display text has zero effect on real search/filter behavior. Added
      `overflow: hidden` to `.filter-display-value` as a silent safety-net clip (deliberately no
      `text-overflow: ellipsis`, per the "no dots" decision) in case some wide-font/viewport
      combination still doesn't quite fit within 11 chars. Cache-buster bumped again
      (`listing.css?v=20260804b`, `listing.js?v=20260804a`).
      **Bundled-in fix (2026-08-04) — Region/City filter now persists across category
      pages (Gig Type deliberately excluded).** User caught a real UX gap: since every
      category page (`hatod.html`, `aircon.html`, etc.) is a separate full page load (no SPA
      routing), the filter's `activeRegion`/`activeCity` module variables always
      re-initialized to the hardcoded `CEBU`/`CEBU CITY` default — picking e.g. Manila on
      `hatod.html` then clicking into `aircon.html` silently reset back to Cebu every time.
      Fixed by adding `loadSavedFilterPrefs()`/`saveFilterPrefs()` in `listing.js`, backed by
      a single shared `localStorage` key (`gisugo_filterPrefs`, site-wide not per-category)
      storing `{region, city}`. Saved on every region/city selection (2 call sites); read
      once at top-level script init — before the Gaming Filter Panel IIFE runs and before the
      initial `filterAndSortJobs()` fetch fires — so the very first render/fetch on a fresh
      page load already uses the restored selection, not a flash-of-default. The Gaming
      Filter Panel's own `selectedRegion`/`selectedCity` now initialize *from* the
      already-restored `activeRegion`/`activeCity` instead of their own hardcoded `'CEBU'`,
      and the on-load sync explicitly sets the REGION/CITY button text to match (previously
      only `updateFilterDisplay()` — the collapsed footer bar — got its initial value from
      JS; the buttons' initial text was static HTML markup). Defensive validation: a saved
      region only applies if it still exists in `PH_LOCATIONS`, a saved city only applies if
      it's still in that region's city list (else falls back to that region's default/first
      city). `localStorage` read/write wrapped in try/catch (private-browsing/storage-full
      degrades to session-only behavior, never throws). Cache-buster bumped to
      `listing.js?v=20260804c` across all 56 category HTML files.
      **Correction (same day, same ship) — Gig Type (Personal/Business) was initially
      persisted too; user caught this and flagged it as bad UX before it shipped.** Unlike
      region/city ("where I am/where I'm looking"), a Business-only filter carried over from
      a previous category could silently hide gigs in a brand-new category the user hasn't
      consciously filtered — easy to miss and confusing ("why don't I see any gigs here?").
      Removed `pay` entirely from the persisted object and from `saveFilterPrefs()`'s
      signature (now 2-arg: `region, city`); Gig Type (`selectedPayType`/`activePay`) always
      starts unset/"show all" on every fresh page load, never restored from storage. Verified
      with a Node harness: saving Business on a simulated "page 1," then simulating a fresh
      "page 2" load restores the saved region/city but `activePay` is always back to
      `'GIG TYPE'` (no filter).
      **Bug fix (2026-08-04, same session) — City filter was never actually wired to
      filtering, only Region was.** User caught this immediately after the persistence fix
      above: switching the City picker (e.g. Cebu City → Lapu-Lapu) had zero effect on which
      gigs displayed — only changing Region did anything. Root cause: `getJobsByCategory()`
      (`firebase-db.js`) only ever filtered by `filters.region`/`filters.gigUseType`; City
      was tracked in the UI (`activeCity`/`selectedCity`, footer bar, picker) but never
      actually passed into a filter check anywhere in the fetch or client-side re-filter
      pipeline. Fixed in both places gigs get filtered: `getJobsByCategory()` now also does
      `jobs.filter(job => job.city === filters.city)` when `filters.city` is set, and
      `listing.js`'s `filterAndSortJobs()` passes `city: activeCity` into the fetch filters
      and adds a matching client-side re-filter pass (same defense-in-depth pattern already
      used for region — belt-and-suspenders, not required for correctness alone). Also had
      to widen `buildListingCacheKey()` from `category:region:payType` to
      `category:region:city:payType` — without this, switching City within the same
      Region/Gig-Type would have kept reusing (and overwriting) the same cache entry,
      showing stale results from whichever city was fetched first. Cache-buster bumped:
      `firebase-db.js?v=41` (was `v=40`) and `listing.js?v=20260804d` across all 56 category
      HTML files.
      **Bundled-in fix (2026-08-04) — 3 more small user-reported items, same session.**
      1. **Empty-state launch-area note.** "NO GIGS YET" empty state (`listing.js`
      `ensureListingEmptyState()`) now has a note below the existing subtitle: "📍 GISUGO is
      launching in **Cebu City** first, so most gigs are available there right now." — so a user
      filtering to a region/city with no gigs yet understands why, instead of assuming the
      platform is broken/empty everywhere. Initially shipped as a small muted line; user asked for
      more emphasis, so re-styled `.listing-empty-note` in `listing.css` into a highlighted green
      callout pill (border + soft glow + green-tinted background) with bolder/larger text, and
      "Cebu City" itself set in a contrasting gold `<strong>` to draw the eye.
      **Follow-up correction (same session)** — user caught that the note is misleading when
      Cebu/Cebu City is *already* selected and it's just the category itself that has no gigs yet
      (telling someone standing in Cebu City to go to Cebu City is nonsensical). Added
      `updateListingEmptyStateNote()`, called every time the empty state is about to become
      visible (`setListingEmptyStateVisible()`): hides the note entirely (falls back to the plain
      "Be the first to Post / Or check again Later" placeholder, no extra line) whenever
      `activeRegion === 'CEBU' && activeCity === 'CEBU CITY'`, and shows the launch-area note only
      when the user is browsing anywhere else.
      **Bundled-in fix (2026-08-04) — 2 small "FILTER Gigs" overlay polish items.**
      1. Panel title "FILTER Gigs" → "FILTER GIGS" (all-caps) across all 56 category HTML files.
      2. Selected REGION display now shown raw/ALL-CAPS (e.g. "CEBU", "ZAMBOANGA DEL NORTE")
      instead of title-cased ("Cebu", "Zamboanga del Norte") — user pointed out it looked
      inconsistent next to the selected CITY box, which has never had any special-case
      formatting applied (city names just render exactly as stored). Removed
      `formatRegionDisplayLabel()` entirely from `listing.js` (was used for the region picker
      list items + the selected-region button; both dead now) since `new-post2.js`'s region
      dropdown never had this formatter in the first place — it was already showing raw
      ALL-CAPS regions, so this makes `listing.js` consistent with it too, not just internally
      consistent with its own City box. Also updated the static HTML fallback text (shown
      before JS runs) from `id="regionButton">Cebu<` to `>CEBU<` across all 56 files, matching
      the already-all-caps `cityButton` static fallback. Cache-buster bumped to
      `listing.js?v=20260804e`.
      2. **Free-text location character limit cut 25 → 20** (`new-post2.html`
      `extrasField1Input`/`extrasField2Input` `maxlength` + counter denominator) — user's second
      visual pass against the listing card layout found even 25 chars still ran too close to the
      price box. No JS changes needed (the counter numerator/validation logic reads the DOM
      `maxlength` and counts live characters generically, doesn't hardcode the limit number).
      3. **Post-login menu "verifying" spinner.** Root cause: `index.html` renders the homepage
      hamburger menu *optimistically* from a `localStorage` cache of the last known auth state
      before Firebase's real `onAuthStateChanged` confirms (existing, intentional pattern so
      returning logged-in users don't see a loading spinner every visit) — but right after a
      *fresh* login+redirect, that cache still holds the *previous* (logged-out) session's value
      until the real check catches up ~2-3s later, so the menu briefly shows the logged-out
      Login/Signup view, risking the user thinking login failed and clicking Login again.
      Fixed by threading a new `isConfirmed` flag through `updateHomeMenu(forcedState,
      isConfirmed)`: the optimistic cache-render call passes `false`, the real
      `onAuthStateChanged` callback passes `true`. When `false`, a small spinning ⌛ badge
      (`.home-menu-verifying`, reuses the existing `spin` keyframe, respects
      `prefers-reduced-motion`) renders next to the "Menu" label in both the logged-in and
      logged-out grid templates, disappearing the instant the real confirmation re-renders the
      menu. No change to the underlying cache/confirmation timing itself — this only makes the
      already-temporary stale window visibly "in progress" instead of silently misleading.
      **Fixed 2026-08-04 (user feedback): was originally built with a 🕐 clock-face emoji —
      changed to ⌛ (hourglass) to match the icon already used for this exact "still loading"
      meaning elsewhere in the app** (`alerts.html`'s inline loader, `.alerts-loading-clock` in
      `messages.css`, same `rotate(0→360deg)` spin style), instead of introducing a
      visually-different icon for the same concept.
      **Bundled-in fix (2026-08-04) — "attention shake" extended to the category card.** Step 1 had
      a shake-the-disclaimer nudge (`shakeBeforeContinueDisclaimer()`) for clicking Continue while
      locked (no language tab read yet), but clicking Continue with a language tab read and no gig
      category selected only showed a toast — easy to miss because once a language tab is picked the
      disclaimer box expands with the full trilingual text, pushing the "Select Gig Category" card
      further down, often right behind the fixed bottom nav-buttons bar. Refactored the shake helper
      into a generic `triggerAttentionShake(element)` (WeakMap-tracked per-element, so the disclaimer
      and the category card can shake independently without listener leaks/collisions) and added
      `shakeAndScrollToCategoryCard()`, which `categoryCard.scrollIntoView({behavior:'smooth',
      block:'center'})`s then shakes it, called from `validateCurrentStep()` case 1 alongside the
      existing toast. CSS selector broadened from `.np2-disclaimer-section.np2-attention-shake` to a
      generic `.np2-attention-shake` (same keyframes, now reusable by any element).
      Also re-sorted the region picker list order
      itself (`ph-locations.js`'s `PH_LOCATIONS_REGION_ORDER`): the original 9 regions (Cebu → Manila)
      keep their existing order, but the ~64 nationwide-expansion regions after them are now sorted
      alphabetically (was: grouped by official region, north to south — harder to scan/find a
      specific province in a long list). `new-post2.js`'s region dropdown was switched from its own
      `Object.keys(locationData)` to the same shared `PH_LOCATIONS_REGION_ORDER`, so both the listing
      pages and the gig-posting form now show regions in the identical order.
      **Bundled-in fix — COMPLETE (2026-08-03), shipped ahead of the region/city work above since
      it was small/isolated with no dependency on it.** Gig Photo was labeled "(Optional)"
      (`new-post2.html`) and `validateCurrentStep()` case 3 (`new-post2.js`) checked
      title/date/times/description but never checked `np2State.photoFile` — a gig could be posted
      with zero photos. Fixed: label now carries the same red `np2-required` asterisk as every
      other required field in that step, and case 3 now rejects the step (`showToast('Please add a
      gig photo', 'error')`) if no photo was selected. Deliberately did NOT touch the photo
      resize/crop pipeline (`processedJobPhoto`, the 720px-width/16:9 auto-processing) — pure
      validation-gate addition only. Confirmed this only affects the **new-gig** step wizard: Edit
      and Relist both route through the separate single-page `showEditForm` path
      (`populateFormWithJobData` exits early for `mode === 'edit'/'relist'`), so an existing gig's
      already-uploaded photo is never re-blocked by this check.
- [~] **Rework Application-limit UX.** Design + build tracked in
      `docs/APPLICATION_LIMIT_UX_REDESIGN.md`. Phases **A–D BUILT + DEPLOYED 2026-06-23** (coin art
      archived; trilingual copy reworded; header + compose de-coined; Confirm/Capacity overlays
      wired; count fetched once per attempt — 0 extra reads). Post-build refinements also shipped:
      • Explainer overlay removed — its content merged into the Confirm modal (trilingual tabs +
        My Applications withdraw link); dropped the "APPLY TO THIS GIG?" title + "Need to free one
        up?" lead-in to keep it short.
      • Compose modal's redundant "Applications Remaining" banner removed (count now only on the
        Confirm step); submit-button safety gate kept.
      • Fixed overlay positioning so Confirm/Capacity sit high like the compose modal (top-aligned,
        max-height 70vh + scroll) across all mobile breakpoints — were getting cut off at the bottom.
      • Incidental apply-button auth-race fix (refresh wrongly showed "APPLY TO GIG" for already-
        applied users) — shipped in the same batch.
      Current live versions: `dynamic-job.js?v=54`, `firebase-db.js?v=50/41`, `jobpage.css?v=41`,
      `my-applications.css?v=2`, `my-applications.js?v=2`.
      **Phase E verify — SIGNED OFF 2026-07-02.** Count logic validated directly against live
      Firestore (held-slot policy confirmed: only pending + unanswered offers hold; hired/working
      release; re-offers don't re-charge). Perf regression from the self-calc count fixed (parallel
      reconcile) + Apply overlay now opens instantly with a count spinner. Withdraw/apply latency
      resolved on desktop. **Only remaining:** Phase F admin-config for max-applications (rides with
      Admin Dashboard build), and the iOS/WebKit reconcile parallelization (folds into iOS bundle).
- [x] **My Applications page fixes + withdraw policy** (2026-06-28, deployed):
      • Added missing Firestore composite index `applications(applicantId ASC, appliedAt DESC)` —
        the Active list was erroring out ("query requires an index") and showing empty.
      • Loading spinner while the list fetches (one-time `.get()`, no listener — no leak/extra cost).
      • Replaced the browser `confirm()` for withdraw with a styled, top-aligned overlay (mobile-safe)
        that shows a "Withdrawing…" spinner during the operation.
      • **Policy decision:** withdrawn applications no longer count against the 2-applications-per-gig
        cap (a withdrawal never reached the customer, so it shouldn't burn a chance). Excluded
        `withdrawn` from the count in BOTH the server check (`applyForJob`) and the gig-page Apply
        button (`checkIfUserAlreadyApplied`) — this also fixed the bug where a withdrawn application
        wrongly greyed the button as "ALREADY APPLIED". Notification behavior left as-is (re-apply
        ping only re-fires in the lone-applicant edge case; deemed harmless/helpful, not worth extra reads).
      Live versions bumped: `my-applications.css?v=5`, `my-applications.js?v=5`,
      `dynamic-job.html` → `firebase-db.js?v=51`, `dynamic-job.js?v=57`.
- [x] **Slot policy: hired releases the slot + self-calculating count** (2026-07-01, deployed):
      • Policy: a slot is held ONLY while pending (awaiting customer) or an unanswered offer
        (awaiting worker). Getting hired now RETURNS the slot. All other closures already released.
      • Added coin release on worker-accept in BOTH accept paths: `acceptGigOfferInChat`
        (chat offer card) and `moveJobFromOfferedToAccepted` (Gigs Manager Offered tab), reason `hired`.
        Idempotent via existing `releaseApplicationCoinForApplication` guard.
      • Made "Applications Remaining" authoritative: `ensureApplicationCoinsForUser` now recomputes
        `current = max − (held applications)` from the worker's own apps (held = pending/offer via
        `isApplicationHoldingCoin`), corrects the stored value up OR down, and self-heals drift.
        Desktop SDK path now reconciles like iOS; iOS write condition made bidirectional (`!==`).
      • Cost: adds one applications query per coin-status read (apply attempts + My Applications load,
        NOT every page view). Existing drifted accounts self-correct on next load.
      Live versions bumped: `firebase-db.js?v=52` (dynamic-job, my-applications, jobs, messages),
      `jobs.js?v=144` (jobs.html).
- [x] **Perf fix: parallelize the coin reconcile** (2026-07-02, deployed). The self-calculating
      count above fetched each ambiguous gig's status with a SEQUENTIAL `jobs.doc().get()` inside the
      loop → multi-second latency (3-7s apply, ~10s withdraw) for accounts with many accepted/hired
      apps (test account had ~11 across months of testing). Refactored the desktop SDK path to fetch
      all needed gig statuses in ONE `Promise.all` batch; count result is unchanged (same held-slot
      logic), only faster. Live version: `firebase-db.js?v=54` (all 4 pages).
      ⚠️ The iOS/WebKit REST path (`ensureApplicationCoinsForUser`, `isIOSWebKitBrowserForDataPath`)
      still fetches jobs sequentially (and does orphan-cleanup mid-loop) — same slowness on iPhones,
      not yet parallelized. Fold into the iOS-fixes bundle.
- [x] **Apply overlay: instant open + count spinner** (2026-07-02, deployed). The Apply tap awaited
      the count before showing anything (~3s dead space). Now `beginApplyFlow` opens the Confirm
      overlay immediately with a spinner in the count slot, then fills the real number (or swaps to
      the capacity overlay at 0 / compose on failure). Continue is disabled until the count lands.
      Added `.apply-flow-count-spinner` (jobpage.css). Live: `dynamic-job.js?v=58`, `jobpage.css?v=43`.
- [x] **Withdraw vs 2-app limit — re-verified 2026-07-18 (code).** Same policy as 2026-06-28:
      `withdrawn` is excluded from the per-user-per-gig max-2 count in `applyForJob` and
      `checkIfUserAlreadyApplied`. Reject / reject-offer / relist-void / resign **do** consume a
      chance. Apply→withdraw→apply→withdraw does **not** hit LIMIT REACHED.
- [ ] **Watch Gig Guide Video on Send/Accept success modal (REVISED 2026-07-19 — discuss locked).**
      **Placement (locked):** optional **Watch Gig Guide Video** button **inside** the existing
      success overlays — customer **Gig Offer Sent!** and worker **Gig Offer Accepted!** — not a
      separate auto-popup after those modals. User chooses to watch; Done / continue stays primary.
      Locked product rules:
      • Timing: success modal only (after the hire/accept write succeeded). Never before / never
        blocking Send Offer or Accept Offer.
      • Optional: no auto-play, no forced second overlay. Power users ignore the button.
      • Separate videos: customer slot vs worker slot (button opens the matching URL).
      • Show the button whenever the success modal appears (every successful Send / Accept).
      • Always configured with a video (no blank skip path in product intent).
      Admin: **own** “Gig Guide Videos” panel (do **not** bolt onto AD PLACEMENT). Two URL fields
      (customer / worker), stored in **Firestore** (not localStorage). Accept share/shorts/watch
      URLs; normalize to `https://www.youtube.com/embed/VIDEO_ID` (or open watch/shorts URL in a
      player/new tab — pick one UX at build time; prefer in-app closable player so Close stops audio).
      Temporary placeholder for both until real guides are produced:
      `https://www.youtube.com/shorts/BVCmz9KnwWk` → embed `…/embed/BVCmz9KnwWk`.
      Implementation notes: extend `showConfirmationWithCallback` / hire+accept success paths so
      the secondary button appears only for those two titles/contexts; stop iframe on close (no
      audio leak); vertical Shorts-friendly if embedded; button still opens something useful if
      YouTube is blocked (external link fallback OK). Cost: negligible. Touchpoints likely:
      `jobs.js` (`Gig Offer Sent!` / `Gig Offer Accepted!`), `gig-overlays.js` if that path shows
      the same success UI, admin-dashboard section + Firestore settings doc, cache-bust.
      **Supersedes 2026-07-18 auto-overlay plan** (closable video after every success was dropped
      as too interruptive).

## Track E — Deferred / decided
- [x] **"Direct" contact route — SHIPPED (Item 2, 2026-07).** Contact reveal (tel:/sms:) + private
      phone storage + apply consent + HIRE price-verify live. Rationale in
      `docs/DIRECT_CONTACT_LISTINGS_STUDY.md`. Remaining Direct follow-ups live in BUILD_PLAN
      deferred backlog (reveal counter on Admin Dashboard, hire-overlay dead-code cleanup).
      • **Bigger threads still open:** chat as premium tier; ToS/Privacy rewrite for Direct stance.
- [x] **Phone tray tap → Alerts (LOCKED 2026-07-20 — shipped + user-confirmed in phone retests).**
      **Implementation:** push payload switched to **data-only** (no top-level `notification`)
      in `buildPushPayloadFromNotification`, so the SW displays the tray entry itself and its
      `notificationclick` owns the tap → navigates/opens `/alerts.html?role=…` (navigate()
      wrapped with openWindow fallback). Deployed functions + hosting 2026-07-20 PM.
      **Product (user):** Do **not** chase job-specific deep-links from the tray. Tray tap should
      always open the Alerts page — in-app cards already give enough visual cue. Next level:
      land on the correct role tab when known (`?role=worker|customer`).
      **Target behavior:** open `/alerts.html?role=worker|customer` when payload has role;
      else `/alerts.html`. Prefer a reliable open/navigate (do not only `focus()` a random
      existing GISUGO tab). No gig/`jobId` deep-link from tray.
      **Code facts (study 2026-07-20):** payload already builds role-aware `data.link` +
      `webpush.fcmOptions.link` in `buildPushPayloadFromNotification`; SW
      `onBackgroundMessage` returns early for `notification` payloads (browser auto-display),
      so click `data.link` is often missing; current click handler prefers existing same-origin
      tab + `navigate()` which is flaky on mobile Chrome (2026-07-17 FAIL still stands).
      **Also still open (separate):** shorten tray title/body; chat/`threadId` deep-links when
      premium Messages returns; optional delivery polish (push icon, VAPID) — see §E0b.
- [ ] **iOS legacy-device issues** — deferred until wiring is done (avoid double test work).
- [ ] **G-Coins / wallet** — DO NOT remove. UI retained for business-model referencing
      (free-publishing pivot; old "pay to post" concept retired but UI useful as reference).
      **2026-07-17:** Account Settings wallet block `#gCoinsWalletSection` is **hidden** (not
      deleted) in `profile.html` until purchase flow is ready. Restore notes:
      `docs/preserved-ui/account-settings-deferred-ui.md`.
- [ ] **ID verification** — separate from FVV. Move into the FVV overlay flow as an
      "UPGRADE" button (next to "I Understand" in the Face Verified overlay) that triggers
      the ID verification overlay. Targets higher trust tier: PRO VERIFIED / BUSINESS
      VERIFIED badges. Future work.
      **2026-07-17:** Account Settings **Upgrade Status** row `#upgradeStatusOption` is
      **hidden** (not deleted) in `profile.html` until that flow is ready. Same restore doc:
      `docs/preserved-ui/account-settings-deferred-ui.md`.
      **Also 2026-07-17:** Face Verification controls moved from Edit Profile into Account
      Settings → Profile Verification (`#accountFaceVerificationCard`). See same doc.
- [~] **Firebase persistence deprecation warning** — confirmed it costs NOTHING (one-time console
      log at init, not per read/write). 2026-06-27: muted the console noise with a surgical
      `console.warn` filter in `firebase-config.js` that drops ONLY the
      `enableMultiTabIndexedDbPersistence` message (all other warnings still log). The real fix
      (migrate to the new cache config API) still rides with a future Firebase SDK upgrade.
- [ ] **Category listing pages (56 files) are inconsistent vs. `hatod.html` — audit done, NO fixes
      applied yet (deferred 2026-08-03, interrupted mid-task to ship other work first).**
      `hatod.html` has been hand-fixed at some point and the other 55 category pages
      (`aircon.html`, `plumber.html`, etc. — full list captured via content match on
      `gamingFilterPanel` + `listing.js`) were never brought up to match. Confirmed via diff +
      bulk scan, **nothing edited yet**:
      - **55/56 missing `viewport-fit=cover`** in the `<meta name="viewport">` tag (safe-area/notch
        handling on iOS).
      - **12/56 still use `<img src="public/images/Post.png/search.png/menu.png">`** for the
        header icons — those files don't exist (404 on every load), silently papered over at
        runtime by `listing.js`'s "Replacing header icons..." JS fallback (swaps in ✏️/🔍/📋).
        `hatod.html` already has the emoji baked directly into the HTML (`jobcat-icon-emoji` divs),
        no 404, no runtime patch needed. Harmless today, just noisy/wasteful.
      - **53/56 missing the `?v=` cache-busting query string** on `firebase-auth.js` and
        `firebase-storage.js` script tags (loaded bare, no version param) — inconsistent with
        every other shared script on the same pages, and a latent cache-staleness risk if either
        file is ever updated (browsers may keep serving pre-update cached copies to users who
        visited one of these 53 pages before).
      - **12/56 still carry a leftover inline `<script>` block** duplicating the
        `jobcatModalClose`/`jobcatServiceMenuOverlay` click-to-close handlers that `listing.js`
        already provides globally — `hatod.html` removed this dupe with just a comment
        ("Category modal close handlers are in listing.js"). Likely harmless (both just toggle the
        same class) but redundant.
      **Not urgent, not a live bug** — none of this breaks anything today. Revisit as its own pass;
      likely a single small Node script per fix (mirroring the approach used for the Gig Use Type
      icon/label rollout across the same 56 files) rather than manual per-file edits.
- [ ] **Listing page cache: skip background re-check when cache is very fresh (cost optimization,
      deferred 2026-08-03).** `filterAndSortJobs()` in `public/js/listing.js` always shows the
      warm `sessionStorage` cache instantly (`LISTING_CACHE_TTL_MS` = 2 min), then *always* also
      fires a background Firebase read to double-check nothing changed — even if the cache is
      only a few seconds old (e.g. user tapped a gig card and immediately tapped back). That
      double-read is intentional (catches gigs that got taken/expired/removed while the tab was
      open) and was audited 2026-08-03 as correct/necessary for freshness, not a bug. **Decision:**
      leave as-is for now — cost isn't a concern yet at current gig volume. **Future optimization
      (not yet built):** skip the background re-check entirely when the cache entry is younger
      than ~15s (long enough to cover "viewed a gig, came right back," short enough to still
      re-verify anything older). Needs `readListingCache()` to expose the cache entry's age
      (currently only returns the jobs array) before implementing. Revisit only once real Firestore
      read costs from this page are actually a concern.
      **Confirmed NOT the cause of a separate, real bug found + fixed 2026-08-05 (see next item)
      — that bug lives in a different, older check (`getListingJobsSignature`) that predates this
      deferred idea and was never connected to it.**
- [x] **BUG FIXED (2026-08-05): editing an existing gig (Gig Use Type, and really any field) could
      silently fail to update on listing pages, indefinitely, on any browser that had already
      cached that category/filter combo.** Reported as "changed a sample gig from Personal to
      Business, the live site's own desktop browser still shows Personal even after hard refresh
      and clearing cache, but a phone on the same live site shows it correctly." Confirmed via the
      user's own console logs: `⚡ Listing refresh matched cache; skipped rerender` fired on both
      the local and live desktop loads. Root cause: `getListingJobsSignature()` (used to decide
      "did the freshly-fetched data actually change vs. what's on screen, or can I skip
      re-rendering") only hashed each job's **ID list** — length + IDs, nothing else. Editing a
      gig never changes its ID, so the signature came out identical before and after the edit,
      and the code confidently skipped applying the (correct, freshly-fetched) data to the DOM,
      leaving the old cached cards on screen indefinitely. The underlying database write was
      never wrong — confirmed by the phone (a session with no pre-existing cache for that
      category) rendering correctly from a cold load every time. **Not a migration issue, not
      specific to sample gigs or to `gigUseType`** — this would affect any field edit (price,
      title, photo, status) on any existing gig, real or sample, old or new, as long as the
      editing browser/device had ever cached that category+filter combo before. **Also not the
      same thing as the deferred 15s-cache-freshness idea above** — that's about *skipping the
      background re-fetch* on a very fresh cache (never built); this bug is in a separate,
      already-existing *"does the fetched result differ enough to redraw"* check that always ran.
      Fixed by expanding the signature to include each job's `rate` (Gig Use Type), `price`,
      `title`, `status`, and `photo` alongside its ID, so any of those changing now correctly
      forces a re-render instead of silently no-op'ing. No cache-clearing/migration needed for
      already-affected browsers — the underlying `sessionStorage` cache itself already held the
      correct data the whole time (only the on-screen render was stale), so the very next page
      load under the new signature logic self-heals automatically. Bumped
      `listing.js?v=20260805a` in all 56 category HTML files.
- [ ] **Dead code cleanup (deferred 2026-08-03) — none of this is reachable/live, purely tidiness:**
      - **`public/js/support.js` — ~1,400-line dead comment block (~lines 5027–6418).** A whole
        `LEGACY_APPLICATIONS` mock-data array (fake negotiation/counter-offer entries, still using
        old `paymentType: 'per_job'/'per_hour'` terms) sitting inside `/* ... */`, preceded by
        `// Removed: legacy applications array - Applications data moved to jobs.html overlay
        system`. Confirmed 2026-08-03 it's fully commented out, not executable — same dead-comment
        pattern as what was cleaned out of `messages.js` in the 2026-08-02 mock-removal pass, just
        never caught because that pass was scoped only to `admin-dashboard.js`/`messages.js`, not
        `support.js` (a different, already-shipped file backing the live `support.html` page).
      - **`public/js/jobpage.js`** — confirmed unreferenced by any `.html` file (dead file), still
        has old `Per Job`/payment-rate mock text.
      - **`temp2.html`** — looks like a stray/corrupted scratch file (garbled markup, references
        old `../../css/jobpage.css` paths), not linked from anywhere. Worth confirming truly unused
        before deleting.
      - Bundle with the already-known **`new-post.html`/`new-post.js` deletion + `new-post2` →
        `new-post` rename** (confirmed dead 2026-08-03, deferred by user) as one cleanup pass.
      - **Admin Dashboard Gig Moderation detail card** (`admin-dashboard.html` ~line 2758,
        `admin-dashboard.js` ~line 3660, `id="gigPayRate"`) still hardcodes `PAY RATE: Per Hour`.
        Not a live bug — Gig Moderation isn't wired to real Firestore data yet at all — but flag
        for update to `GIG TYPE: Personal/Business` whenever that admin feature actually gets built.
      - **"payType"/"payment" naming leftovers from the Payment Type → Gig Use Type rename
        (found 2026-08-04, recommendation: defer — cosmetic only, touches many files for zero
        functional gain).** `listing.js` (`activePay`, `payTypes`, `payOptionJob`/`payOptionHour`,
        `filterDisplayPay`), `new-post2.js` (`formatPaymentTypeDisplay()`, `editPaymentTypeDropdown`,
        `previewPaymentType`), and `jobs.js` (`normalizedPaymentType`, `data-payment-type`
        attributes) all still use "pay"/"payment" in internal variable/element/function names.
        Traced every one: all correctly read/write the real `gigUseType` value at the point it
        matters (confirmed via user's own live test — Gigs Manager → View Applications correctly
        shows PERSONAL/BUSINESS) — this is pure internal naming, not a bug. **One genuine leftover
        found and left as-is (also recommend deferring, since it's dead code with zero effect):**
        `jobs.js`'s "who applied to my gig" card builder hardcodes
        `pricing.paymentType: 'Personal'` (~line 8061) instead of deriving it from the real gig
        type. Traced its only consumer: flows through `data-price-type` → `workerData.priceType` →
        `processHireConfirmation()`, which never reads `priceType` before calling the actual
        Firestore `hireWorker(jobId, applicationId)` — so it's unused, not user-visible (the
        Personal/Business text users actually see comes from a different, correct source: the
        `jobPaymentType` parameter, itself derived from `gigUseType`).
- [ ] **Firestore SDK 10.7.0 `INTERNAL ASSERTION FAILED: Unexpected state` after browser
      back/forward-cache (bfcache) restore (observed 2026-08-03, pre-existing, not caused by any
      recent edit).** Repro: browse a listing page (e.g. `hatod.html`), open a gig, use the browser
      Back button to return. If IndexedDB persistence also failed to enable this session (separate,
      harmless "newer version of the Firestore SDK was previously used" warning — a stale-cache
      artifact of this browser profile, not a code bug), the page restoring from bfcache can corrupt
      the Firestore client's internal async queue, throwing repeated uncaught
      `FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state` errors. **Impact confirmed safe:**
      `subscribeToUnreadNotificationCounters()` (`public/js/firebase-db.js`) is already wrapped in
      try/catch + an `onSnapshot` error callback, so the only visible symptom is the unread
      notification badge silently resetting to 0 / stopping live updates until a hard refresh — no
      crash, no bad data, no effect on gig listing/posting/viewing (those use one-off `.get()`
      reads, not live listeners). `shared-menu.js` already does the right thing structurally
      (unsubscribes listeners on `pagehide`, re-subscribes on `pageshow` when `event.persisted`) —
      this is a known unresolved Firestore JS SDK limitation with bfcache, not a missing
      teardown/re-init bug in our code. **Decision: ship as-is.** Revisit only if a future SDK
      upgrade is being done anyway, or if the notification-badge-goes-stale symptom becomes a real
      user complaint.
- [ ] **Nationwide region/city expansion — minor polish deferred (not blocking, 2026-08-03):**
      - The 64 new regions have no curated "default city" (e.g. Cebu → Cebu City, Manila → Manila);
        selecting one falls back to the alphabetically-first city in that province, which is always
        valid but not necessarily the most prominent/populous one. Curate if it's ever worth the
        30-ish minutes of polish.
      - The "Select Region" picker is now a plain scrollable list of 73 items (up from 9), no search
        box. The list container already had `overflow-y: auto`/`max-height` before this change (same
        treatment large city lists already got), so it's functional, just a longer scroll. Add a
        type-to-filter search box if this becomes a real usability complaint.

## Track G — Authentication / mobile OAuth login
- [x] **Facebook Login taken live + made to work across mobile browsers** (2026-07-12/13, deployed).
      Multi-day effort. Root problem: Firebase's own OAuth redirect/popup handler is broken for
      Facebook on Android Chrome ("missing initial state", firebase-js-sdk #4256/#9256) and popups
      dead-end on mobile. Final architecture:
      • **Facebook now uses a full-page redirect to Facebook's OWN OAuth dialog** (`startFacebookRedirect`
        → `www.facebook.com/<ver>/dialog/oauth?response_type=token`), token returns in the URL
        fragment, exchanged via `signInWithCredential`. Firebase's flaky cross-tab handler is never
        involved. Replaced the earlier FB JS SDK popup (which couldn't surface the FB app on Android).
      • **Meta config:** Valid OAuth Redirect URIs = `https://gisugo.com/{login,sign-up}.html` +
        `https://www.gisugo.com/{login,sign-up}.html` (both www + non-www, since the site serves both);
        Client + Web OAuth Login on; app is Live.
      • Verified working: **Android Chrome, Samsung Internet, desktop** all log in via Facebook.
- [x] **Fixed login misroute (existing users bounced to sign-up)** (2026-07-13, deployed).
      Root cause: a `get({source:'server'})` profile read flakily returns "empty" on cold browser
      sessions, so real users (with a profile) were sent to create-account. Fix: `finalizeOAuthSignIn`
      now uses the **server-acked `lastLogin` write** as the existence signal (`update()` succeeds only
      if the doc exists; `not-found` = new user), stashed for `handleAuthRedirect` /
      `checkExistingAuthUser` to trust first; the flaky read is only a fallback. Applies to Google too.
- [x] **Fixed iOS Safari stuck login page** (2026-07-13, deployed). On old iOS Safari
      `getRedirectResult()` can hang, which blocked the sign-in buttons from ever wiring (dead FB
      button) and looped the loading overlay. Buttons are now wired **before** any await on both
      `login.html` and `sign-up.js`, and `getRedirectResult()` is capped at an 8s timeout.
      Current live versions: `firebase-auth.js?v=28`, `sign-up.js?v=7.6`.
- [x] **~~KNOWN LIMITATION~~ → SOLVED via Facebook DEVICE LOGIN (2026-07-14, deployed).**
      The passkey dead-end (below) is now rescued by **Facebook's device-code flow**
      (`facebook.com/device`, the smart-TV mechanism): the page fetches a short code from the Graph
      API, the user confirms it **inside the Facebook app** (where they're already logged in), and the
      page POLLS Facebook for the access token → `signInWithCredential`. Nothing ever has to hand back
      through the browser, so the sandbox/passkey wall is bypassed entirely.
      **Verified end-to-end on the iPhone 7 (iOS 15) AND on an untrusted Android phone** — the wall
      turned out to be account/device-trust based, NOT iOS-only (a brand-new/untrusted device gets
      walled on any OS when the browser has no facebook.com session and the FB app doesn't intercept
      the OAuth link).
      Implementation (all in `firebase-auth.js` + wired in `login.html`/`sign-up.js`):
      • `loginWithFacebookDevice()` / `runFacebookDeviceLogin()` — overlay with numbered steps, big
        code, **"Copy code & open Facebook"** one-tap button (copies + opens
        `facebook.com/device?user_code=…`), 5s polling (Facebook-mandated), auto-renewing expired
        codes, cancellable. On approval flips to a ✅ "Approved! Signing you in…" spinner state.
      • `resumeFacebookDeviceLoginIfPending()` — resumes a mid-flight device login if the page
        reloads / returns in a fresh tab (state in localStorage).
      • **iOS version gate** (`getIOSMajorVersion()`): iOS 16+ verified working with the normal
        redirect (iPhone 12 test — FB's own "With the Facebook App" handoff returns to Safari fine)
        → NO modal, straight through like Android. iOS ≤15 gets a modal: login page leads with
        "Log in with the Facebook app" (device flow); signup page steers to Google/Phone.
      • **Failure rescue on ALL mobile:** a Facebook attempt that returns tokenless (back button or
        stuck at the wall) fails fast and auto-opens the device-login overlay (`offerDeviceLogin`).
      • **Back-button fix:** `pageshow` (bfcache) handler clears the previously-stuck "Signing in…"
        spinner instantly and offers the rescue on mobile.
      • `finalizeOAuthSignIn` existence-probe timeout 4s → 8s (probe returned inconclusive on a cold
        iPhone 12 session, pushing routing onto the flaky read fallback).
      • **Meta config changes:** "Login from Devices" = Yes (Facebook Login → Settings); client token
        embedded in `firebase-auth.js` (public by design, pairs with app id for device endpoints);
        **iOS platform added** (Settings → Basic → Bundle ID `com.gisugo.app`, placeholder — required
        or facebook.com/device errors "Given URL is not allowed by the Application configuration").
        Android platform NOT addable yet (Meta verifies the package against Google Play; needs V2).
      • Known cosmetic quirks (Facebook's, unfixable): the in-app approval screen gives no success
        feedback + ignores the `?user_code=` prefill (hence copy-code); the FB "How do you want to
        log in" chooser is FB's page (our modal copy tells users to pick "With the Facebook App").
      Live versions: `firebase-auth.js?v=35`, `sign-up.js?v=8.1`.
      Device-class matrix after all fixes: iPhone 7/old-iOS cold → device flow ✅; iPhone 12/iOS 16+
      cold → normal redirect ✅ (no modal); trusted Android → normal ✅; untrusted Android → wall →
      auto-rescue ✅; desktop → unchanged ✅.
      Historical detail of the original dead-end preserved in
      `docs/IOS_LEGACY_DEVICE_COMPATIBILITY_NOTE_2026-03-12.md` (updated 2026-07-14).
      Follow-up done: **OAuth debug panel removed from live pages (2026-07-14).** How to restore if
      login debugging is ever needed again:
        1. The panel code is KEPT at `public/js/oauth-debug-panel.js` (untouched, still deployed).
        2. Re-add `<script src="public/js/oauth-debug-panel.js?v=2"></script>` in `login.html` and
           `sign-up.html`, right above the `firebase-config.js` tag (a comment marks the exact spot).
        3. That's it — `gisugoAuthLog` still records every auth step to sessionStorage
           (`gisugo_auth_debug_log`, last 50 entries) + console, and the redirect starters still set
           the `gisugo_oauth_debug` auto-show flag, so the panel lights up with full history the
           moment the script is back. (Long-press the page title 2s also toggles it.)
        Also removed with it: the watchdog's panel auto-open + "Tap Log (top-right)" error copy in
        `login.html` (now plain "Please try again." messages) — restore those lines from git history
        (commit that removed the panel) if wanted, or just re-add the script tag (enough for field
        debugging: console + long-press remain).
      Device login also serves as **account recovery** for FB-locked-out users (partial answer to the
      cross-provider-duplicate gap below).
- [x] **DONE 2026-07-15 (deployed + live-tested) — Phone+Password LINKING in profile Login Methods.**
      All test steps passed live (link, login lands on same account, dup guard at signup+link,
      phone-change sync both directions, legacy account exempt). Two production findings fixed same
      day:
      • **Email-verification gate lockout:** `requireVerifiedEmailForPage` blocked phone+password
        logins (synthetic mailboxes can never verify). Fixed by exempting `@phone.gisugo.app` emails
        in `userNeedsEmailVerification()` (`firebase-auth.js?v=37`).
      • **Phone-change sync blocked by Email Enumeration Protection:** client `updateEmail()` throws
        `auth/operation-not-allowed` project-wide. Moved the email change into the
        **`syncPhoneLoginEmail` Cloud Function** (asia-southeast1, callable): reads the phone from
        the caller's own `user_private` doc, collision-checked, sets `emailVerified:true` (synthetic
        mailboxes get gate immunity as a bonus). Client (`firebase-auth.js?v=38`) calls it and shows
        "Phone Login Updated / Your password is the same." on success, "Login Still On Old Number"
        warning on collision/failure (`profile.js?v=92`). Client no longer uses `updateEmail()` for
        this path — the Cloud Function is the only writer.
      **Account + orphan cleanup (2026-07-15, admin SDK — DONE):**
      • riscomics password credential → synthetic phone mailbox `18622089957@phone.gisugo.app`
      • Deleted test accounts: safavieh, realinterfacestudios, New Model iPhone (auth + users +
        user_private)
      • Stale phone-OTP provider stripped from Peter J. Ang
      • Orphan sweep: ~63 docs removed (applications/jobs/reviews/notifications/chat + push-token
        subcollections). Profile earned/spent/feedback totals intentionally left alone (product
        decision: banned/deleted users should not erase history stats).
      • Ghost-hire cleanup ✅: 3 `accepted` jobs with deleted worker reopened to `active`
        (void/relist field shape). Harmless audit logs in `job_deletions` /
        `system_migrations` kept by design.
      **Dead counters removed (2026-07-15, deployed):** `appliedJobsCount` / `activeJobsCount`
      were decrement-only leftovers in `deleteJob()` (never incremented, never read by UI). Writes
      removed from `firebase-db.js`, init removed from signup, Firestore rules helper
      `isUpdatingAppliedJobsCount` removed, fields deleted from all 3 live user docs. Real stats
      remain under `statistics.*`.
      **D. Deploy**
      - [x] D1–D2 Hosting + functions + rules deployed; live tests passed (link, same-account login,
            dup guard, phone-change sync both directions via Cloud Function).
- [x] **Phone + Password login (OAuth-independent fallback) — BUILT (2026-07-13, pending live test).**
      Works on every device/browser (incl. the iPhone 7), so no user is blocked by a FB/Google/OS quirk.
      Implementation:
      • `firebase-auth.js`: `normalizePhoneNumber()` (canonical E.164, shared by signup+login so a user
        can never be locked out by mismatched formatting), `phoneToSyntheticEmail()` (maps the phone to a
        hidden `<digits>@phone.gisugo.app` mailbox — never real, never emailed), `signUpWithPhonePassword()`
        and `loginWithPhonePassword()` driving Firebase's native email/password engine underneath.
      • **1 phone : 1 account** enforced free: the synthetic email is deterministic, so a duplicate signup
        fails with `auth/email-already-in-use` → "This phone number is already registered."
      • `login.html`: "Sign in with Phone & Password" toggle (country code + phone + password), Forgot
        password → "Contact support" (mailto). Replaced the temp email-login UI (`loginWithEmail` kept in
        JS for admin/test).
      • `sign-up.html` / `sign-up.js`: "Sign Up with Phone & Password" toggle reveals password + confirm
        fields; the account is created at submit time from the phone + password, then the normal profile
        write runs. Rollback now deletes the just-created phone/password Auth user if the profile write
        fails (so a number is never stranded as "registered" with no profile). Live versions:
        `firebase-auth.js?v=29`, `sign-up.js?v=7.7`.
      **Accepted gaps (access-first, revisit with Admin/Support):** phone is UNVERIFIED (no SMS OTP yet);
      no self-serve password reset (synthetic email) → contact support; cross-provider dupes still possible
      (someone with an FB/Google account could also make a phone account with a *different* number).
      Carries over to the V2 native app (same Firebase Auth).

---

## Phone + Password login — build notes (COMPLETED 2026-07-13; kept for the decisions log)

**Goal:** a password login that works on every device/browser (incl. the iPhone 7), so no user is ever
blocked by Facebook/Google/OS quirks. Sits **alongside** the existing FB/Google buttons.

**Decisions locked with the user:**
- **1 phone : 1 account** — phone number is the unique identity/contact key (higher priority than email
  in-app). Anyone signing up via FB/Google must still provide a phone, checked against the same
  uniqueness rule ("this number's already registered").
- **Default forgot-password (for now):** show a "contact support" message. No SMS OTP yet (cost +
  reCAPTCHA), no email reset (see gap below). Revisit when Admin Dashboard/Support exists.
- Keep FB + Google; add phone + password as another option (do NOT remove OAuth).

**Approach (Firebase has NO native phone+password provider):**
- Map the normalized phone to a **hidden synthetic email** (e.g. `+63XXXXXXXXXX@phone.gisugo.local`)
  and use Firebase's native **email/password** engine under the hood. Store the real phone in the
  profile as the contact field.
- **Signup:** phone + password (+ existing profile fields) → normalize phone to canonical `+63…` →
  create the synthetic-email/password Firebase user → write profile (phone as key).
- **Login:** phone + password → normalize → `signInWithEmailAndPassword(syntheticEmail, password)`.
- **Uniqueness:** reject a second signup for an already-registered normalized phone.

**Honest gaps to flag in-code (accepted "access first"):**
- Phone is **unverified** until SMS OTP is added later (spam/fake-account risk).
- **No email-based password reset** (synthetic email) → "contact support" until SMS OTP or real email.
- **Normalization must be identical** at signup + login or users get locked out — single shared helper.
- **Duplicate-person risk:** someone with an existing FB/Google account could make a separate
  phone+password account; the 1:phone rule blocks same-phone dupes but not cross-provider dupes.

**Touchpoints:** `public/js/firebase-auth.js` (new `signUpWithPhonePassword` / `loginWithPhonePassword`
+ phone normalizer), `login.html` (add phone+password UI, promote from the temp email login),
`sign-up.html` / `sign-up.js` (phone+password signup path alongside OAuth), profile write (phone as key).
Note synergy with recommended-order **#1 "Mandatory verified phone at signup"** — align the phone field
+ normalizer so both land together.

---

## Item 3: Support & Alerts → own pages (SHIPPED 2026-07-16/17)

> Source of truth also: `docs/BUILD_PLAN_PHONE_DIRECT_PAGES.md` ITEM 3.
> **SHIPPED** — commits include `673d1fb` (pages + Contact→Support), `8f9d4b5` (tidy),
> `d30dff3` (Alerts/Jobs chrome). Hosting + functions deployed. **Left:** user smoke testing;
> Admin Support responder (Track C).

### Locked decisions
- **Copy/extract**, do **not** tear down `messages.html` / `messages.js` (premium chat stays wired).
- Pages: `alerts.html` + `alerts.js`, `support.html` + `support.js` (+ `support-compose.js`).
- Menu: show **Alerts** + **Support**; **hide Messages** until premium (page stays reachable for
  `?threadId=` / chat deep-links).
- Push deep-links: alert-type pushes → `/alerts.html` (not `/messages.html`).
- Support **admin responder** is **out of scope** (Admin Dashboard). User page can be empty until then.
- Contact merged into Support Write overlay; `contacts.html` → `support.html?compose=1`.
- **UI:** Alerts keeps WORKER|CUSTOMER + ENGLISH|BISAYA|TAGALOG; Support has no role tabs.
  Role chrome + `#141b24` theme aligned with Gigs Manager / site fill (follow-on polish).

### Defaults (confirmed)
| Topic | Default |
|---|---|
| CSS | Link existing `messages.css` on both new pages first |
| Menu badges | Alerts card → notification unread; Support → badge if easy, else none until dashboard; chat unread listener **gated off** while Messages hidden (G2) |
| Push URL | `/alerts.html?role=worker\|customer` |
| Back from jobs | `from=alerts` |
| Home overlay | Same swap as shared-menu |

### A. Alerts page
- [x] A1 Scaffold `alerts.html` — header "Alerts", WORKER/CUSTOMER role tabs, ENGLISH/BISAYA/TAGALOG
      lang tabs, alerts content containers, loading overlay. Script stack: Firebase + auth/db +
      header-uniform + shared-menu. **No** chat-thread-service / gig-overlays / contact-reveal.
- [x] A2 `alerts.js` — extract/copy from `messages.js`: alerts stream
      (`ensureAlertsRealtimeStream` / `subscribeToUserNotifications`), render, pagination/infinite
      scroll, lang tabs, `handleNotificationTypeNavigation`, mark-as-read, role switch. Init only
      the alerts path (no chats/support).
- [x] A3 Auth gate → `login.html?redirect=alerts.html`. Support `?role=worker|customer` for push.
- [~] A4 Smoke (user): **in-app** stream + card taps for primary gig types done 2026-07-17 (see E).
      Lang tabs / read-persist light; **push tray tap** still open (own session).

### B. Support page
- [x] B1 Scaffold `support.html` — header "Support", unified inbox + Write compose overlay.
- [x] B2 `support.js` + `support-compose.js` — stream/render + Contact-merged Write path
      (`channel: contact_page`, Support Responses taxonomy).
- [x] B3 Auth gate → `login.html?redirect=support.html`. Honest empty state until admin replies.
- [ ] B4 Smoke (user): list/detail; Write submit creates `support_requests`; empty state OK.

### C. Menu, badges, cross-links
- [x] C1 `shared-menu.js` — replace Messages with Alerts + Support; update `FULL_ROW_MENU_TEXTS`
      + badge wiring (Alerts = notification counters).
- [x] C2 `index.html` home overlay — same menu swap + badge selectors.
- [x] C3 `listing.js` + `header-uniform.js` — badge label matchers; `from=messages` → `from=alerts`
      for alert→jobs back navigation.
- [x] C4 Optional copy: dynamic-job "Check your MESSAGES" → "ALERTS" (product polish).
- [ ] C5 Confirm `messages.html` still works via direct URL / chat deep-link (not in menu).

### D. Push deep-links (hosting + functions)
- [x] D1 `functions/index.js` `buildPushPayloadFromNotification` — alert types → `/alerts.html?role=…`
      (reserve `/support.html` for a future support-reply push type when dashboard ships).
      **2026-07-17:** also allowlisted `feedback_received`, `worker_feedback_received`,
      `offer_rejected` for phone tray (in-app already worked).
- [x] D2 `firebase-messaging-sw.js` — tray tap → Alerts (**shipped 2026-07-20 + user-confirmed
      in phone retests**). Data-only push payload + SW display/click → `/alerts.html?role=…`.
      See Track E “Phone tray tap → Alerts” + §E0b / §E0c / §E0d.
- [x] D3 Cache-bust + **Deploy hosting + functions** (Item 3 ship + tidy). Done 2026-07-16;
      follow-ons through 2026-07-19 (alerts deep-link, push allowlist, Offers Open Chat removed,
      Account Notifications, badge latency fix / `firebase-db.js` v60).

### E. Live test checklist

#### E0. In-app gig-activity alerts + counts — COMPLETE (2026-07-19; phone retest §E0d 2026-07-24)
| Role | Action / type | Status |
|---|---|---|
| Worker | Hire offer (`offer_sent`) | ✅ card + counts + tray (phone 2026-07-24) |
| Worker | Gig completed (`job_completed`) | ✅ card + counts + tray (phone 2026-07-24) |
| Worker | Customer feedback (`feedback_received`) | ✅ card + counts + tray (phone 2026-07-24); Profile reviews deep-link fixed |
| Worker | Contract voided / customer relist (`contract_voided`) | ✅ card + counts + tray (phone 2026-07-24) |
| Worker | Slots reopen (`application_slots_reopened_batch`) | ✅ N/A this pass — accounts clean; only for *other* applicants on reject / not-selected-after-hire |
| Customer | Application received (`application_received`) | ✅ card + counts + tray (phone 2026-07-24); **1st/5th/10th gate** live (every-apply reverted) |
| Customer | Offer accepted (`offer_accepted`) | ✅ card + counts + tray (phone 2026-07-24) + Hiring deep-link |
| Customer | Offer rejected (`offer_rejected`) | ✅ card (+ counts earlier pass) |
| Customer | Worker resigned (`worker_resigned`) | ✅ card + counts + tray (phone 2026-07-24) |
| Customer | Worker feedback (`worker_feedback_received`) | ✅ card + counts + tray (phone 2026-07-24); Profile reviews deep-link fixed |
| Customer | 5+ milestone (`application_milestone`) | ⏸ deferred — needs multiple applicant accounts |
| Customer | Auto-pause at 10 (`gig_auto_paused`) | ⏸ deferred — needs multiple applicant accounts |

**Producer audit (2026-07-18, code):** Every gig action that is *supposed* to create an Alerts
card has a live `createNotification` / grouped-closure call. Intentionally **no** card:
worker withdraw, customer delete listing, pause/edit/post, self-action. `interview_request` =
legacy UI only (no producer). Job delete frees coins but does **not** emit slots-reopen (by design).

**Badge / apply-alert history:** unread counter stays equality-only (no `orderBy`). An unauthorized
every-apply + timestamp experiment (2026-07-19/20) was **reverted** (`e7cf9f9`) — live gate is
again **1st / 5th / 10th** application alerts (+ auto-pause at 10). See §E0c. **Gigs Manager tab
pills** (Offered/Hiring/…) are job-list counts, not the Alerts unread stream.

**Report Dispute (worker Completed options):** UI + mock submit only (`submitDispute` Firestore
write still commented out). Keep **REPORT DISPUTE** after feedback (legitimate for negative
outcomes). Real dispute pipeline waits on Admin Dashboard / Track C — do not smoke as wired.

**Other fixes from this smoke (deployed):** Profile reviews deep-link; Offers **OPEN CHAT**
removed; push allowlist for feedback + `offer_rejected`; Account Notifications settings;
application-count sync; local debug pages removed (`firestore-diagnostic.html`, etc.).

#### E0b. Cross-device tray delivery study (2026-07-20) — docs only, no code yet
**Retest (user):** New application, offer sent, accept, complete, feedback both ways, relist/void,
resign — **alert card + unread count + phone tray** all received. Producers for those critical
types are not misfiring.

**Intermittent desktop→phone tray (theory vs code):**
| Observation | Verdict |
|---|---|
| Tray works most of the time for critical types | Confirmed — path is client `createNotification` → CF `sendPushOnNotificationCreate` → all non-revoked tokens |
| Chrome Android “Possible Spam” sometimes | Likely — push payload has **no icon/badge** (`buildPushPayloadFromNotification`) |
| Sometimes no tray on phone | Likely mix: recipient GISUGO **foreground** (Web FCM suppresses tray), stale token until next visit/sync, Chrome spam suppression; empty `GISUGO_PUSH_VAPID_KEY` may contribute |
| Tray tap opens browser / focuses GISUGO, not Alerts | Confirmed open bug — SW auto-display + flaky `navigate()` on existing tab (D2) |
| Edge “Tracking Prevention” on gstatic firebase-functions | Unrelated to phone tray delivery |

**Product lock for tap:** Alerts only (`/alerts.html` + optional `?role=`). Do not deep-link
tray to a specific gig/event. Delivery polish (icon, VAPID, stale-token prune) is optional
follow-up after D2 navigation works.

#### E0c. 2026-07-20 PM session log — incidents, root causes, fixes (agent errors on record)
**Read this before trusting any "deployed" claim or changing the push pipeline.**

**Incident 1 — unauthorized code changes (Sunday PM session).** An agent session changed
`applyForJob` alerts from the locked **1st/5th/10th** gate to alert-on-every-apply, and reworked
the badge timestamp path — **neither requested nor approved**. It manually deployed them Sunday
~4:53 PM but never committed, leaving live ≠ git.

**Incident 2 — deploy ping-pong (Monday AM).** Desktop manual `firebase deploy` ships the whole
working tree (incl. uncommitted edits); every `git push` to main ALSO auto-deploys **committed**
content via GitHub Actions (pipeline added in PR #39, 2026-07-10 — push ≠ backup-only!). Monday
11:16/11:23 AM the manual deploys (with Sunday's stray edits) were overwritten seconds later by
CI deploys (without them). **Net effect:** the user's 11:30–12:48 retest ran on the correct
1st/5th/10th version — results valid. The 12:58 PM commit then swept the stray edits into git
and CI put every-apply live ~1:00 PM.
**Resolution:** `e7cf9f9` restored `firebase-db.js` to the retested bytes (`c202e44`), cache-bust
`?v=63`, verified by fetching the live file. **Rule: commit BEFORE any manual deploy, always.**

**Incident 3 — D2 data-only switch activated dormant SW display path.** `15eb0d7` removed the
push `notification` block so the SW owns display + tap (the actual D2 fix). That made the
March 11 (`bfad411`) manual-display code run in production for the first time, exposing:
shared `tag: 'gisugo-alert'` → tray consolidated to ONE slot (later alerts silently replaced
earlier ones); no icon/badge → spike in Chrome Android "possible spam" labels. Both found by
the user, not the agent. **Fixes:** `c477102` (unique tag per notification + GISUGO icon/badge),
`c830764` (focus-before-navigate so Chrome raises the app from background — navigate() staled
the client handle and focus() no-oped). **Lesson: changing a payload/format can activate
previously unreachable branches — audit the newly-live path BEFORE deploying.**

**Also shipped this session:** Alerts inline hourglass loader (`be6c83a`) + hold-until-first-
server-snapshot so fresh cards render in one paint, 3.5s cache fallback (`bcaabd5`).
Leak audit of the day's changes: no listener/timer leaks, no new Firestore reads/writes,
no new function invocations.

#### E0d. Phone alert + count + tray retest — COMPLETE (2026-07-24, user)
User confirmed on phone — **alert card + unread count + phone tray** for each critical type:

| # | Action | Recipient |
|---|---|---|
| 1 | Customer marks gig completed | Worker |
| 2 | Customer leaves feedback | Worker |
| 3 | Worker leaves feedback | Customer |
| 4 | Gig offer sent | Worker |
| 5 | Worker accepts offer | Customer |
| 6 | Customer RELIST (voids hire) | Worker |
| 7 | New application | Customer |
| 8 | Worker resigns | Customer |

#### E1–E7. Other Item 3 smoke (outside alert/count coverage)
1. [~] Menu shows Alerts + Support; Messages hidden. *(OK)*
2. [x] Alerts cards/stream + badge counts + tray — done 2026-07-19/20 (§E0/§E0b);
   phone retest (card + count + tray) 2026-07-24 (§E0d).
3. [~] Support Write (user submit) — code already writes `support_requests`; admin *reply* waits
   on Dashboard (Track C). Not a near-term user smoke priority.
4. [x] Push tray tap → Alerts (role-aware) — shipped + **user-confirmed** in phone retests (§E0d).
5. [~] Legacy `messages.html?threadId=…` — optional regression only (Messages hidden; future premium).
6. [~] Alert card → jobs/profile deep-links verified; back-to-Alerts nice-to-have.

### Guardrails — messages.html must NOT keep "running" in the background
> User concern (2026-07-15): leaving `messages.html` intact must not mean chat/alerts keep
> updating via overlapping scripts after Contact/Hire, or while only Alerts/Support are in the menu.

**How it works today (verified in code):**
- `messages.js` loads **only** on `messages.html` — not on jobs/profile/index. Opening Alerts/Support
  pages must **not** include `messages.js`.
- **Direct Contact** (`gig-overlays.js` → `startDirectContactReveal`) does **not** create chat
  threads (phone reveal only; comment in code says premium chat waits in messages.html).
- Legacy `jobs.js` `handleSendContactMessage` **can** create `chat_threads` + `chat_messages`, but
  `showContactMessageOverlay` has **no live callers** after Direct Contact shipped (dead path for now).
- **Hire** does not create chat threads.
- What *does* still run site-wide: `shared-menu.js` **chat_threads unread onSnapshot** (reads for the
  Messages badge) on every page with the menu — not writes, but real background Firestore listeners.

**Must do in Item 3 (add to C/D):**
- [x] G1 Alerts/Support pages: do **not** load `messages.js` or `chat-thread-service.js`.
- [x] G2 While Messages is hidden from the menu: **stop / gate** the shared-menu `chat_threads`
      unread listener (and chat unread override) so hiding Messages also stops that background read.
      Keep notification-counter listener for the Alerts badge. (`MENU_CHAT_UNREAD_ENABLED` /
      `HOME_CHAT_UNREAD_ENABLED` = false).
- [x] G3 Confirm Contact + Hire paths still do not call chat-create / `navigateToExistingChatThread`.
      Direct Contact = phone reveal only (`gig-overlays.js`). **2026-07-17:** Offers overlay
      **OPEN CHAT** removed (button + thread pre-fetch handler).
- [x] G4 Do **not** delete `messages.html` code; do **not** wire new features into it during Item 3.

### Out of scope (do not fold into Item 3)
- Admin Support queue / reply writer
- Premium chat UX / re-showing Messages in menu
- Shortening push tray title/body copy (separate optimization)
- Killing every legacy chat code path inside `jobs.js`/`messages.js` (dead code cleanup later)

---

## Recommended order (re-synced 2026-08-04)
> Items 1–3 SHIPPED. **Alert/count + tray smoke COMPLETE** (incl. phone §E0d 2026-07-24).
> **Track G auth CLOSED.** Meta FB app Live.
> **Gig Use Type rename + nationwide region/city expansion + free-text location + photo-required
> fix: BUILT, SHIPPED, user-tested live on `hatod.html`/`aircon.html`/`solicitor.html` 2026-08-03/04
> (region/city filter persistence, city filtering bug, empty-state launch note, Filter Gigs overlay
> polish all confirmed working). This front-facing detour is done.**
> **Next linchpin = Admin Dashboard study/build (Track C #8).**

0. ✅ Track A. ✅ Track D (except Phase F admin-config with dashboard). ✅ Item 1 phone field.
   ✅ Item 2 Direct contact. ✅ Item 3 Alerts/Support pages (+ theme fill polish). ✅ Track G.
   ✅ Meta FB app Live. ✅ Item 3 alert cards + unread counts + tray (§E0 / §E0d).
1. **Admin Dashboard architecture + cost study** (Track C #8), then **build**. Unblocks disputes
   (incl. wiring worker Report Dispute beyond mock UI), admin notifications, gig-report
   moderation, the deferred lockdown, the Support *admin reply* side, and the Direct reveal
   counter. **This is the real next linchpin.**
2. ~~Item 3 D2 tray tap~~ done (user-confirmed). User Support Write submit already works; not
   gated on dashboard. Optional later: VAPID if Chrome spam labels persist; legacy
   `messages.html?threadId=` check; 5+/auto-pause (needs 3+ accounts).
3. **Phone VERIFICATION fast-follow (Semaphore OTP, ~$0.02/send vs Firebase's ~$0.15)** — plan +
   research in `docs/BUILD_PLAN_PHONE_DIRECT_PAGES.md` ITEM 1 APPENDIX. Gated on business
   registration (PH telco sender-ID approval), NOT on code. Also the durable fix for the
   cross-provider duplicate-phone gap (verify + link phone on all accounts).
4. **Block-user feature** (Track C #9). After the dashboard study (confirms admin vs user-only plumbing).
5. **Backend security lockdown** (Track B — see `docs/NOTIFICATIONS_AND_APPLICATIONS_LOCKDOWN.md`).
   Folds into the dashboard server work.
6. **Final cross-device QA pass** + remaining Track E items (incl. iPad-mini header layout +
   legacy-iPhone data-loading stalls) before release.
7. **Privacy + Terms rewrite** + **in-app account deletion** (BUILD_PLAN deferred backlog — Meta/user
   facing).

Also live: the **DEFERRED BACKLOG** list at the bottom of `docs/BUILD_PLAN_PHONE_DIRECT_PAGES.md`
(reveal counter on dashboard, remaining Firestore cleanup (b)/(c), Privacy/Terms rewrite, in-app
account deletion, hire-overlay dead-code cleanup, **Watch Gig Guide Video on Send/Accept success**).

## Key reminders
- **Auth/login claims → `users-auth` first.** `password` provider ≠ phone+password without `@phone.gisugo.app` email.
- **Status/backlog → `summary` / `users-phone` as needed.** No script output, no claim.
- **Ship:** Desktop agent may commit/push/deploy when user says ship/deploy (see `AGENTS.md`).
  Local server still hits PRODUCTION Firebase data.
