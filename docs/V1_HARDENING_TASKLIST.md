# GISUGO V1 — Production Hardening Tasklist

> Status: **Active** · Last updated: 2026-07-17
> Mode: production-hardening. Policy: no mock fallback / fail clearly. No platform rewrite.
> Companion docs: `docs/V2_NATIVE_APP_PLAN.md` (future app), `FIREBASE_SCHEMA.md` (data model).

This is the working tasklist for getting GISUGO web production-solid. Resume here after
any break. Linchpin insight: **the Admin Dashboard is the unlock** for Support email,
disputes, and admin notifications — and it needs an architecture/cost study first.

### Where we are (2026-07-17)
**Track G (login / auth) is CLOSED.** **Item 3 SHIPPED** (code + hosting/functions deploy):
standalone Alerts + Support pages live; Contact merged into Support Write overlay; Messages hidden
from menu (page kept for premium chat); push deep-links → `/alerts.html?role=…`; chat unread
listeners gated. Theme polish rolled to Alerts/Jobs chrome + `#141b24` page fill across Profile,
new-post, Support, Updates, Forum, category listings/modals (PRs #44–#49).
**Still open on Item 3:** fuller Alerts/Support smoke testing by user; Admin Support queue remains
blocked on Track C.
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
- [ ] **Re-enable admin identity** in `firestore.rules` (`isAdmin()` email allowlist is
      currently commented out → all admin powers disabled). Prerequisite for Track C.

## Track C — Admin Dashboard (linchpin)
- [ ] **#8 Architecture + cost study (TBD — discuss first).** Current design reports many
      real-time metrics that would blow up read/write costs without a strategic counter
      design. MUST plan before wiring. Unblocks: Support tab responses, dispute submissions,
      admin notifications, gig-report moderation.
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
- [x] **"Direct" contact route — SHIPPED (Item 2, 2026-07).** Contact reveal (tel:/sms:) + private
      phone storage + apply consent + HIRE price-verify live. Rationale in
      `docs/DIRECT_CONTACT_LISTINGS_STUDY.md`. Remaining Direct follow-ups live in BUILD_PLAN
      deferred backlog (reveal counter on Admin Dashboard, hire-overlay dead-code cleanup).
      • **Bigger threads still open:** chat as premium tier; ToS/Privacy rewrite for Direct stance.
- [~] **Notification deep-linking + tray copy** — **Alert deep-links DONE (Item 3):** critical pushes
      go to `/alerts.html?role=worker|customer` (+ `data.link` for SW). Still open: shorten tray
      title/body per type; chat/`threadId` deep-links when premium Messages returns.
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
- [ ] A4 Smoke (user): stream both roles; card tap → jobs/profile; read persists; lang tabs; push tap.

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
- [x] D2 `firebase-messaging-sw.js` — default click/fallback → `/alerts.html` (+ `data.link`).
- [x] D3 Cache-bust + **Deploy hosting + functions** (Item 3 ship + tidy). Done 2026-07-16.

### E. Live test checklist (user — in progress)
1. [~] Menu shows Alerts + Support; Messages hidden.
2. [ ] Alerts page loads real notifications; role + lang tabs work; fuller gig-activity coverage.
3. [ ] Support page loads (likely empty until admin responder); Write works.
4. [ ] Push tap opens `alerts.html` (not messages).
5. [ ] Direct `messages.html?threadId=…` still opens chat.
6. [ ] Support Write / `contacts.html?compose` still creates `support_requests`.
7. [ ] Regression: jobs/profile navigation from an alert card; back returns to Alerts.

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
- [x] G3 Confirm Contact + Hire paths still do not call chat-create / `navigateToExistingChatThread`
      (except an explicit "Open Chat" on legacy offers if that UI still exists — document it).
      Direct Contact = phone reveal only (`gig-overlays.js`).
- [x] G4 Do **not** delete `messages.html` code; do **not** wire new features into it during Item 3.

### Out of scope (do not fold into Item 3)
- Admin Support queue / reply writer
- Premium chat UX / re-showing Messages in menu
- Shortening push tray title/body copy (separate optimization)
- Killing every legacy chat code path inside `jobs.js`/`messages.js` (dead code cleanup later)

---

## Recommended order (re-synced 2026-07-17)
> Items 1–3 SHIPPED (Item 3 smoke still ongoing). **Track G auth CLOSED.** Meta FB app Live.
> **Next linchpin = Admin Dashboard study/build (Track C #8).**

0. ✅ Track A. ✅ Track D (except Phase F admin-config with dashboard). ✅ Item 1 phone field.
   ✅ Item 2 Direct contact. ✅ Item 3 Alerts/Support pages (+ theme fill polish). ✅ Track G.
   ✅ Meta FB app Live.
1. **Finish Item 3 smoke** (Alerts/Support/push/messages deep-link checklist above) — user testing.
2. **Admin Dashboard architecture + cost study** (Track C #8), then **build**. Unblocks disputes,
   admin notifications, gig-report moderation, the deferred lockdown, the Support responder/admin
   side, and displays the Direct reveal counter.
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
account deletion, hire-overlay dead-code cleanup).

## Key reminders
- **Auth/login claims → `users-auth` first.** `password` provider ≠ phone+password without `@phone.gisugo.app` email.
- **Status/backlog → `summary` / `users-phone` as needed.** No script output, no claim.
- **Ship:** Desktop agent may commit/push/deploy when user says ship/deploy (see `AGENTS.md`).
  Local server still hits PRODUCTION Firebase data.
