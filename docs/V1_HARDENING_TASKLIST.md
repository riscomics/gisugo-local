# GISUGO V1 — Production Hardening Tasklist

> Status: **Active** · Last updated: 2026-06-28
> Mode: production-hardening. Policy: no mock fallback / fail clearly. No platform rewrite.
> Companion docs: `docs/V2_NATIVE_APP_PLAN.md` (future app), `FIREBASE_SCHEMA.md` (data model).

This is the working tasklist for getting GISUGO web production-solid. Resume here after
any break. Linchpin insight: **the Admin Dashboard is the unlock** for Support email,
disputes, and admin notifications — and it needs an architecture/cost study first.

---

## ✅ Done
- **Documentation audit + reorg** — 14 docs deleted, 24 archived to `docs/archive/`,
  root trimmed to 10 living refs, stale statuses updated, FVV marked implemented.
- **V2 native app plan** — direction locked (React Native/Expo), documented.
- **`npm run dev`** — live-server wired (`http://127.0.0.1:5500`), dev convenience only.

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
- [ ] **Re-enable admin identity** in `firestore.rules` (`isAdmin()` email allowlist is
      currently commented out → all admin powers disabled). Prerequisite for Track C.

## Track C — Admin Dashboard (linchpin)
- [ ] **#8 Architecture + cost study (TBD — discuss first).** Current design reports many
      real-time metrics that would blow up read/write costs without a strategic counter
      design. MUST plan before wiring. Unblocks: Support tab responses, dispute submissions,
      admin notifications, gig-report moderation.
- [ ] **Support tab responder (messages.html Support) — BLOCKED on this dashboard.** This is the
      one front-end feature still non-functional, and it's tethered here by design. Current wiring:
      • **Submit side WORKS:** `contacts.js` (~L670) writes user support requests to the
        `support_requests` Firestore collection.
      • **User read side WORKS:** `messages.js` (`ensureSupportResponsesRealtimeStream` ~L10107)
        live-streams that user's own `support_requests` (`where requester.userId == uid`) into the
        Support tab and already renders an admin reply when the record carries one
        (`mapSupportRecordToUnifiedMessage` maps `GISUGO Support` as responder + `isReadByRequester`).
      • **MISSING = admin side:** no tool for an admin to read the incoming `support_requests` queue
        and write a response back onto the record (`admin-dashboard.js` has only mock support data).
        So users can send but nothing can reply — the tab looks dead until the dashboard adds a
        Support queue + reply writer (+ optional email notify on reply). Build with #8/#4.
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

## Track E — Deferred / decided
- [ ] **"Direct" contact route — NOW A REAL PLANNED FEATURE (2026-07-03).** Direction committed:
      the "flip" (§9b) — worker's contact reaches the customer's **View Applications** card, revealed
      only on **Contact** (tel:/sms:, number never shown) via a rate-limited callable; **Hire reuses
      the existing offer→accept flow** so ratings/earnings/completion stay fully intact. Rationale +
      full plan in `docs/DIRECT_CONTACT_LISTINGS_STUDY.md`.
      • **Trace finding (big):** the ENTIRE hire lifecycle already lives in **Gigs Manager, chat-free**
        (`jobs.js`: `hireWorker`/`processHireConfirmation`, `moveJobFromOfferedToAccepted`,
        `handleCompleteJob`, `handleRelistJob`, `handleResignJob`, `openFaceVerificationViewer`).
        **Nothing to migrate out of chat.** The chat Gig Status modal + OPEN HIRE CHECKLIST are
        **duplicate mirrors** of the same ops → over-engineering that can collapse (chat → optional/premium).
      • **Net-new to build:** (1) Contact reveal (tel:/sms:) in View Applications; (2) worker phone
        storage + `revealApplicantContact` callable (auth + rate-limit + dashboard reveal counter);
        (3) price-verify field on `processHireConfirmation`; (4) worker-apply consent line.
      • **Prerequisite:** mandatory verified phone at signup (+ consent lines).
      • **No scraping dependency (corrected 2026-07-03):** store the worker phone ONLY in the worker's
        private profile (owner-only readable) and serve it solely via the `revealApplicantContact`
        callable (checks gig ownership). The number is then never in any readable job/application doc,
        so Direct does NOT wait on the Track B lockdown. (Track B still worth doing for other applicant
        data, but it's independent.)
      • **Bigger threads (separate, major):** chat as a premium tier; **Support and Alerts each become
        their own page** (decided); ToS makes dispute-proof the users' responsibility (no in-app records
        for Direct). See §9c.
- [ ] **Notification deep-linking + tray copy** — pushes hardcode `link: "/messages.html"` instead of
      the `?threadId=&role=&tab=` deep link `messages.js` already supports (`applyThreadDeepLinkFromUrl`);
      also shorten tray title/body per type. Root-caused 2026-07-03; optimization, not a rewrite.
- [ ] **iOS legacy-device issues** — deferred until wiring is done (avoid double test work).
- [ ] **G-Coins / wallet** — DO NOT remove. UI retained for business-model referencing
      (free-publishing pivot; old "pay to post" concept retired but UI useful as reference).
- [ ] **ID verification** — separate from FVV. Move into the FVV overlay flow as an
      "UPGRADE" button (next to "I Understand" in the Face Verified overlay) that triggers
      the ID verification overlay. Targets higher trust tier: PRO VERIFIED / BUSINESS
      VERIFIED badges. Future work.
- [~] **Firebase persistence deprecation warning** — confirmed it costs NOTHING (one-time console
      log at init, not per read/write). 2026-06-27: muted the console noise with a surgical
      `console.warn` filter in `firebase-config.js` that drops ONLY the
      `enableMultiTabIndexedDbPersistence` message (all other warnings still log). The real fix
      (migrate to the new cache config API) still rides with a future Firebase SDK upgrade.

---

## Recommended order (re-synced 2026-07-03)
> Reordered after the Direct decision. Direct is small, high-leverage, and does NOT depend on the
> dashboard or the Track B lockdown (phone served via ownership-checked callable). Dashboard is still
> the ops/Support linchpin but is a bigger build, so Direct goes first.
> **Detailed build plan for items 1–3:** `docs/BUILD_PLAN_PHONE_DIRECT_PAGES.md`.

0. ✅ Track A — done. ✅ Application-limit UX rework (Track D) — built/deployed; only Phase F
   admin-config (rides with dashboard) remains.
1. **Mandatory verified phone at signup** (+ consent lines). Prerequisite for Direct AND a standalone
   trust/safety win. Do first.
2. **Direct contact route** (the renovation). Net-new: Contact reveal (tel:/sms:) in View Applications,
   `revealApplicantContact` callable (+ reveal counter), price-verify at Hire, worker-apply consent.
   Reuses the existing Gigs Manager hire lifecycle; no chat migration needed. See
   `docs/DIRECT_CONTACT_LISTINGS_STUDY.md`.
3. **Support and Alerts → their own pages** (decided). Split them out of the unified messages view
   into standalone pages, and **update the menu overlay button links** to point to the new pages.
   No longer folded inside `messages.html`; decouples Support from the dashboard timeline.
4. **Admin Dashboard architecture + cost study** (Track C #8), then **build**. Unblocks disputes,
   admin notifications, gig-report moderation, the deferred lockdown, and displays the Direct reveal
   counter. (Also builds the Support **responder/admin side**; the user-facing Support page from #3
   feeds into it.)
5. **Block-user feature** (Track C #9). After the dashboard study (confirms admin vs user-only plumbing).
6. **Backend security lockdown** (Track B — see `docs/NOTIFICATIONS_AND_APPLICATIONS_LOCKDOWN.md`).
   Folds into the dashboard server work; includes the single `functions` deploy that also clears the
   already-deleted `migrateLegacyProfilePhones`.
7. **Final cross-device QA pass** + remaining Track E items before release.

Free cleanups (anytime, ~no risk): delete the 2 orphaned applications (parent gig deleted).

## Key reminders
- After any mobile-facing change → deploy hosting and report live result.
- Do not commit unless explicitly asked.
- Local server still hits PRODUCTION Firebase data.
