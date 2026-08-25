# GISUGO V1 — Production Hardening Tasklist

> Status: **Active** · Last updated: 2026-08-17
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

## Track B — Security hardening (now Phase 12 — launch gate)
> **Full scope mapped in `docs/NOTIFICATIONS_AND_APPLICATIONS_LOCKDOWN.md` — read that first.**
> Applications + notifications lockdown is one server-side job (notification delivery and the
> worker-accept→reject-others flow are cross-user and must move to Cloud Functions). Notifications
> are already half server-side (push + counters). Groundwork (`gigOwnerId` stamp + backfill) is
> done and stays. **Locked 2026-08-17:** do this after remaining product phases, immediately
> before full-platform QA. Do not mark V1 complete until Phase 12 ships. Do not start until
> those earlier phases are done.

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

### Phase roster (macro — updated 2026-08-22)
Honest status of each numbered phase. **Shipped** means that phase’s scoped job is done, not
that the whole dashboard section is finished forever. **Phase 10 in-app engine is live**
(Chapters 1–4). Shelf + Email/WhatsApp is **parked — owner will do it**, not an agent task.
**Phase 8 Contact + notify shipped (Ch 1–6), owner tested + audit 2026-08-17** (Settings tray toggle skipped, accepted). **Phase 6 Ad Placement shipped (Ch 1–6); inventory owner-tested 2026-08-19.** **Phase 7 closed 2026-08-24** (Ch 1–5 owner-tested; Ch 6 leftover audit). **Storage hygiene closed 2026-08-23** (sweep + prevent accumulation Ch 1–8). Overview tile tour parked. **deleteJob() application + coin leftovers closed 2026-08-24** (owner retest + audit). **Phase 9 Ch 1–3 live 2026-08-24.** Phone banlist + uniqueness coded 2026-08-25, **not deployed.** Owner Ban test deferred (after this ships, or after dummy-account deletes right before launch). Phase 11 parked.
**Phase 12 is the launch gate:** Track B lockdown after remaining build, then full-platform QA. Do not mark everything complete until 12 ships.

| Phase | What it actually was | Status |
|---|---|---|
| 1 | Overview counters (users / reported / gigs analytics). Storage / activity / traffic cards were **never** in this phase — see 7. | Shipped |
| 2 | Gig Moderation queues (suspend / reinstate / ignore / delete). Admin **Contact** button was **never** in this phase — see 8. | Shipped |
| 3 | User Management (suspend / reinstate). **Permanently Ban** and **Contact** were **never** in this phase — see 8 / 9. | Shipped |
| 4 | Support **admin** queue: one-slot `reply`, Mark Resolved, broadcasts. Thread follow-up is 10 (now live). | Shipped (admin half only) |
| 5 | Settings **storage only** — `localStorage` → Firestore `platform_settings/general`. Not “Settings is a finished product.” After the homepage-video toggle was removed (2026-08-11), **zero** fields are live/enforced. The panel still shows ~46 switches that save and do nothing, plus unused Maintenance / Tech Warning composers still on their own localStorage keys. Product leftover is 11. | Shipped (cabinet only) |
| 6 | Ad Placement: persist the existing admin panel to Firestore; listing / profile / gig-detail read that config (no live listener). Frequency is the only cadence control. Inventory thumbnails (Hosting only). | Shipped (Ch 1–6; inventory test 2026-08-19) |
| 7 | Wire Overview’s Storage Usage / User Activity / Traffic & Costs to real snapshots (own Storage counter + GA4 + Cloud Monitoring estimate). | Shipped (Ch 6 leftover audit 2026-08-24) |
| 8 | Admin **Contact** on Gig Moderation + User Management. Lands in the live Support thread (`support_requests`), not `chat_threads`. Gig Contact, User Management Contact, notify (menu / Support icon / Alerts / tray). | Shipped (Ch 1–6, 2026-08-17) |
| 9 | Permanently Ban = Auth disable (Ch 1–3 live). Phone banlist coded 2026-08-25, not deployed. Ban test deferred. | Ch 1–3 live; banlist coded, not deployed; Ban test deferred |
| 10 | Support thread engine (chat *pattern*, not `chat_threads`). Chapters 1–4 shipped and **left live** 2026-08-14. Shelf + Email/WhatsApp (Ch 5–6) is owner-owned later — do **not** hide Reply. | Engine live; shelf parked |
| 11 | Settings **product**: for each leftover control, wire it for real or remove/hide it so the panel does not imply fake power. Includes Maintenance / Tech Warning composers. | Not started, not next |
| 12 | Track B lockdown: move cross-user notification create + worker-accept reject-others to Cloud Functions, then lock `applications` / `notifications` rules. Last build before full-platform QA / public launch. | Launch gate — after remaining build, not started |

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
- [x] **Phase 1: Overview built end-to-end — shipped (2026-08-02 through 2026-08-03).**
      (Labeled retroactively for consistent numbering — built across Step 0.5 above +
      the Gig Use Type note.) Total Users, Gigs Reported, Gigs Analytics (incl. Personal/
      Business breakdown) wired to real counters. Verification Submissions + Total Revenue
      shown as honest `0` placeholders (no backing feature yet). Storage Usage/User
      Activity/Traffic & Costs intentionally NOT part of this phase — see Phase 7 below.
- [x] **Phase 2: Gig Moderation built end-to-end — shipped and deployed (2026-08-09).**
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
      6. Docs updated (this entry + architecture study). **Deployed 2026-08-09** — two of the new
         Cloud Functions (`syncGigReportCountersOnCreate`, `executeBanCascadeOnUserSuspend`) got
         stuck as broken HTTP stubs from a first failed deploy attempt (Firestore won't let a
         trigger type change in place); deleted those two stubs and redeployed clean.
      **Two separate report/contact surfaces exist here — status of each, confirmed 2026-08-09:**
      - **User-facing "Report Gig"** (the button/modal on the live gig detail page,
        `dynamic-job.js` → `submitGigReportToAdmin()` in `firebase-db.js`, writes straight into
        `gig_reports`) is **already fully built and confirmed wired end-to-end** — same collection
        and field names (`jobId`, `reporterName`, `reporterAvatar`, `subject`, `message`,
        `createdAt`) that Chapter 1's `syncGigReportCountersOnCreate` and Chapter 5's
        `getGigReportsForJob()`/"Reported By" list already consume. **No action needed.**
      - **Admin-side "Contact" button** (in the Gig Moderation detail panel/overlay — desktop
        `contactGigBtn` + mobile `gigOverlayContactBtn`) was still unbuilt at this Phase 2
        ship. **Now live (Phase 8, 2026-08-15/17)** — writes `support_requests`, not
        `chat_threads`. See Phase 8.
- [x] **Phase 3: User Management built end-to-end — shipped and deployed (2026-08-09).**
      Full design in `docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md` "User Management — resolved
      design" → "Implementation status" subsection. Built in 4 audited chapters, same pattern as
      Phase 2:
      1. `firestore.rules`: closed a real gap — `users/{userId}` had **no admin bypass on update
         at all**, and the owner-update rule didn't block moderation fields, so a suspended user
         could have simply re-saved their own profile to quietly clear `status: 'suspended'`
         themselves. Now explicitly blocks the owner from touching
         `status`/`suspendedAt`/`suspendedBy`/`suspendedByName`/`suspendReason`/`reinstatedAt`/
         `reinstatedBy`. New `adminModerateUser` callable (suspend/reinstate only — no `ignore`,
         no report-threshold concept for users) + `user_moderation_log` audit collection
         (admin-read-only). `suspend` sets `status='suspended'`, which is the exact transition
         `executeBanCascadeOnUserSuspend` (Phase 2) already listens for — the real ban cascade
         just fires automatically, no duplicate logic. `reinstate` only restores login access, not
         whatever the cascade touched (their gigs stay suspended). **Locked 2026-08-17:** the
         restored user re-posts if they want those gigs live again. Admin is not expected to
         relist them. Investigate listed gigs from User Management → Gigs Listed (reuses the
         on-demand `posterId` jobs read; public gig page opens in a new tab). Gig Moderation
         search stays title-prefix only.
         Extra guard: moderating another admin requires `super_admin`.
      2. Full code-level audit of chapter 1 (confirmed the account-type analytics counter
         correctly no-ops on suspend/reinstate writes — verified it wouldn't double-count).
      3. `admin-dashboard.js`/`.html` rewired off in-memory mock data (which, on inspection, was
         actually already emptied to `[]` by the earlier mock-data-removal pass — so tabs were
         showing "0 users" honestly, not fake data) onto real Firestore: New (glance + Load
         More)/Suspended tabs, Suspend/Restore buttons, debounced name-prefix search. Pending/
         Verified tab buttons hidden (not deleted) — that tier doesn't exist in the real schema.
         Region/last-signup-IP/Gigs-Listed/Applications-count fetched on demand only (never
         batched across the list) — region+IP from admin-only `security_metadata`, activity counts
         via `count()` aggregation queries (~1 read regardless of match count). City shown
         honestly as "Not tracked" (no city-capture pipeline exists, only region). Suspension
         "Duration" field hidden (no auto-expiry function exists — every suspension is indefinite
         until manually restored). Also fixed real bugs found in the mock code along the way: a
         missing `age` calculation (referenced but never computed), unguarded `new Date(null)` on
         birthdate for accounts predating the required-DOB change, and several unescaped
         user-submitted strings (`fullName`/`education`/`introduction`) going into `innerHTML` in
         the mobile overlay (desktop panel was already safe via `.textContent`) — a real
         stored-XSS gap once real user data started flowing through, not just cosmetic.
      4. Docs updated (this entry + architecture study). Deployed clean, no stuck stubs this time.
      **"Permanently Ban User" deliberately NOT built this pass** — visible button, but shows an
      honest "not implemented" toast instead of the old mock's fake-success behavior (which
      silently removed the card locally without touching the real account). What it should
      actually do (disable Auth login vs. hard-delete account/data) is an open decision — see the
      dedicated task below.
- [x] **Phase 8: Admin Contact → live Support thread. DECIDED 2026-08-15. Ch 1–6 complete 2026-08-17.**
      Supersedes the 2026-08-09 "reuse `chat_threads`" line (that plan is stale: chat is
      shelved, requires `jobId` + exactly 2 participants, Messages is hidden). Contact is
      admin writing *out* about a gig or a person; it uses the Phase 10 Support engine
      already live — not a new inbox, not group chat, not Support tickets-as-chat-dump.
      **Locked product:**
      • One Send = one recipient = one Support conversation. No group chat.
      • Gig Contact recipients: **poster** or **hired worker** only. Strip **All Applicants**.
      • Hired Worker is enabled only when the already-loaded gig has `hiredWorkerId`
        (set only after the poster actually Hires). No extra read. No hire → option
        hidden/disabled before the admin types. Send still refuses a missing id.
      • If both sides need the message, admin sends twice (two tickets / two users).
      • Lands in that user's Support → **New** (`isReadByRequester: false`,
        `lastSender: 'admin'`). They Reply; admin continues in Admin → Messages.
      • One open thread **per topic**, and Gig Contact is one thread **per gig**.
        User Feature Request / Account Issues / etc. stay their own tickets.
        A second Contact on the same gig appends to that gig's
        `admin_contact` / "Message from GISUGO" thread. A different gig opens
        a new GISUGO thread (same topic badge, different subject). Never
        append into a user-topic ticket. User can Reply immediately; Mark
        Resolved is not required. Write stays available for other topics.
      • Gig SUSPEND is already live (Phase 2). Not this phase. Phase 9 is Permanently
        Ban User (Auth disable), not gig suspend.
      • **Notify is in this phase (Chapter 5), after User Management Contact.**
        Contact + admin Reply now write a `support_admin_message`
        `notifications` row so menu count, Support icon count, Alerts, and
        browser tray fire through the existing pipeline.
      **Why a callable:** `support_requests` create requires `requester.userId == auth.uid`.
      An admin cannot client-write a ticket owned by the poster/worker. Admin SDK
      callable creates or appends.
      **Microtasklist**
      1. **[x] Callable + taxonomy — shipped 2026-08-15.**
         `createOrAppendAdminSupportMessage` (asia-southeast1): admin check; gig
         target must be poster or `hiredWorkerId`; user-mgmt target must exist;
         append only an open `admin_contact` ticket for that same `jobId`
         (user-mgmt: no jobId) else create owned by the target
         (`lastSender: 'admin'`, `isReadByRequester: false`, status `replied`).
         Topic `admin_contact` / "Message from GISUGO". Photo URLs https-only,
         50-message cap. No rules change — Admin SDK bypasses create lock;
         users still cannot client-write `messages`.
      2. **[x] Gig Contact UI — shipped 2026-08-15.** All Applicants
         stripped. Hired Worker gated on loaded `hiredWorkerId`. Send →
         `uploadSupportPhoto` + orphan cleanup + callable. Hourglass. Toast
         only after real success. Names from the loaded gig.
      3. **[x] Test pass (gig) — owner 2026-08-15.** Customer + hired worker
         each got their own Message from GISUGO thread (New). Close moved
         worker's to Old. Same-topic Write still blocked. Per-gig threads
         after the second ship. Photo on worker thread confirmed in log.
      4. **[x] User Management Contact — shipped 2026-08-15, owner tested 2026-08-17.**
         Same callable (`admin_user_contact`), no recipient dropdown, no
         topic/subject (topic is Message from GISUGO). Photo + hourglass.
         Appends only an open no-`jobId` GISUGO thread — does not join a gig
         Contact thread.
      5. **[x] Support notify — shipped 2026-08-15, owner tested 2026-08-17
         (steps 1–8; Settings tray toggle skipped, accepted).** One type
         (`support_admin_message`). Contact callable writes the
         `notifications` row (create + append). Admin Reply writes the same
         shape via `createNotification`. Existing pipeline then fires: menu
         count, hamburger/Support icon count, Alerts (both role tabs — one
         notification row; opening marks both cards read), browser tray
         (`sendPushOnNotificationCreate`). Deep-link `support.html?ticket=`.
         Profile toggle “Messages from GISUGO” exists; tray-off was not
         retested. No second listener on `support_requests`. Admin Messages
         stays glance (no live listener — refresh the dashboard to see new
         tickets). Test-pass fixes shipped 2026-08-17 (`9905a64`): Just now
         stamp (no −2m), Mark Resolved hourglass, Alerts deep-link waits for
         the live thread.
      6. **[x] Full-phase leftover audit — 2026-08-17.** Syntax clean
         (`functions/index.js`, `firebase-db.js`, `admin-dashboard.js`,
         `support-taxonomy.js`, `alerts.js`). Contact Send (gig + user, desktop
         + mobile) waits on `createOrAppendAdminSupportMessage`; toast only
         after success; hourglass; photo orphan cleanup. No `chat_threads`
         write from these buttons (callable writes `support_requests` only;
         users still cannot client-create a ticket for someone else). Notify:
         Contact create/append writes `support_admin_message`; admin Reply
         writes the same via `createNotification`; type is on the push
         allowlist and both Alerts role lists; Profile toggle exists.
         `admin_contact` is not on the user Write dropdown. All Applicants
         stripped; Hired Worker gated. **Accepted leftovers (not this phase):**
         dead mock Messages helpers still in `admin-dashboard.js` (Phase 4
         cleanup); callable finds an open GISUGO thread among the user's 20
         newest tickets (fine at V1 volume); admin Reply stamps
         `role: 'worker'` (Alerts filters by type; both tabs intentional);
         Settings tray-off not owner-tested; admin Messages stays glance.
- [ ] **Phase 9: Permanently Ban User — DECIDED (2026-08-10): Disable Auth login,
      NOT hard delete.** Evidence stays query-able. **Ch 1–3 live 2026-08-24.**
      **Locked 2026-08-25 (order):**
      1. Phone banlist + uniqueness write path **first** (signup + Edit Profile).
      2. Owner keeps phone+password signup to mint dummy test accounts.
      3. Phone+password **sunset later** (signup **and** login UI gone, plus
         server reject of **new** `*@phone.gisugo.app` creates). Not this
         build. Existing social login stays.
      4. Owner Ban test **deferred** — after the banlist ships, **or** after
         dummy-account deletes right before launch. Not now.
      5. Dummy deletes = Auth user + `users` / `user_private` /
         `security_metadata`. **Do not** put those fake numbers on the
         banlist.
      6. Permaban IP **later**, after launch. Not a launch gate.
      7. Signup velocity limit **already live** (`checkSignupRateLimit`:
         25/hour per IP, 8/hour per IP+device, 15 min block). Hits at
         **profile submit**, not at the Google/Facebook tap. Do not build
         a second limiter. Fail-open if the callable errors.
      8. Phone-gate is not a banlist door. Signup + Edit Profile are
         enough; audit leftover phoneless accounts before launch.
      **Ban (already live):** Suspended tab only; Auth `disabled`;
      `status='banned'`; no second cascade; no `wipeAccountMedia`; Unban
      re-enables login and does not relist gigs.
      **Banlist write (next build):** one server path. Normalize phone.
      Reject if on the banlist or already on another live `user_private`.
      Ban copies that user’s current phone onto the list (no admin typing).
      Unban frees that number for **that uid only**. Delete-without-ban
      does not stamp the list.
      **Parked (not next):** suspend-cascade leftovers (refund coins on
      auto-suspended listings; close + notify worker when a hired
      *customer* is banned). Phone+password sunset. Permaban IP.
      **Not this phase:** data wipe, Phase 12, self-delete, Ban from New,
      SMS OTP.
      **Microtasklist**
      1. **[x] Callable `ban` + `unban`.** Live 2026-08-24.
      2. **[x] Confirm UI.** Live 2026-08-24.
      3. **[x] Suspended queue.** Live 2026-08-24.
      4. **[x] Phone banlist + uniqueness write.** `saveUserPhone` callable.
         Signup + Edit Profile. Client cannot write `phoneNumber`. Unban
         leaves the list entry (that uid only). Coded 2026-08-25, not
         deployed.
      5. **[x] Wire Ban to stamp `user_private.phoneNumber` onto the list.**
         Coded 2026-08-25, not deployed.
      6. **[ ] Pre-launch phone audit.** Every live account has a unique
         normalized phone, or is cleaned / gated.
      7. **[ ] Dummy test-account delete (no banlist).** Auth + Firestore
         docs. US fakes do not go on the list.
      8. **[ ] Owner Ban test (deferred).** After 4–5, or after 7 right
         before launch. Suspend → Ban → cannot log in / same social
         blocked / old phone refused on a new account. Evidence stays.
         Unban → login works; gigs stay suspended.
      9. **[ ] Leftover audit** after the banlist ships (not the deferred
         Ban test).
      10. **[ ] Phone+password sunset (later).** Kill signup + login UI
          and reject new synthetic-email creates. After dummies are done.
- [ ] **Phase 10: Support thread engine — Chapters 1–4 LIVE (2026-08-14). Not shelving yet.**
      New phase (Phase 4 stays closed). Owner confirmed the test loop (text + photo both
      ways, Mark Resolved, hourglass). **Leave the in-app desk on.** Do not flip a shelf
      flag, hide Reply, or put Email/WhatsApp in front until the owner does that work and
      updates these docs. Chapters 5–7 stay written below as the later swap plan, not as
      the next agent build.
      Original 2026-08-14 intent (still the later swap, not current): email + an official
      WhatsApp number will eventually be the public door; in-app support stays in repo so
      a later "use the desk" decision is a flag flip — same shelf pattern as chat
      (`MENU_CHAT_UNREAD_ENABLED = false`: engine stays, public door closed).
      **What this is not:** dumping tickets into `chat_threads` / `chat_messages`. Chat is
      two users + a `jobId`; only those two can read; guests cannot write; there is no
      topic / New / Old / resolve. Support keeps `support_requests`. "Use the chat engine"
      means copy the append-only message list + last-activity pattern, not the inbox.
      **Live conversation (after shelf):** Support page becomes Contact Us — a form that
      actually delivers to `support@gisugo.com` (today that address is decorative; the
      current form only writes Firestore), plus a WhatsApp **button** that opens `wa.me/…`.
      The number lives in config, never as visible page text (spam harvest). Number is
      **pending** — button stays disabled until it exists. No hybrid: users are not told
      to start in-app and continue on WhatsApp.
      **Shelf rule:** hide Reply / in-app back-and-forth in the **same ship** as the Email
      + WhatsApp door. Do not leave a working Reply live on production while "about to
      swap." Fake `support.js` `sendReply()` → `messageStates` (never Firestore) must die
      either by becoming the real append (during test) or by being removed at shelf.
      **Test bar (honest, short):** user → admin → user → admin, photo both ways, Mark
      Resolved moves to Old. Do not block the shelf on push/badge polish — that waits
      until business opens the in-app desk.
      **Supersedes** the 2026-08-12 "defer Email/WhatsApp until scale" line in Track E
      (that entry is kept as history and pointed here).
      **Microtasklist — Chapters 1–4 done and live. Do not start 5–6 until the owner
      shelves. Chapters 5+6 still ship together when that happens.**
      1. **[x] Schema + rules + callable.** `support_requests` gets a `messages[]` list
         (sender, text, photo thumb/full, timestamp) and `lastSender: 'user'|'admin'`.
         Existing single `reply` object is migrated into the list on read/write so old
         tickets still render. Users cannot write `messages` from the client (rules).
         User append goes through a callable so history cannot be tampered. Admin append
         can stay a privileged client write or the same callable. No `chat_threads` row,
         no `jobId`, no site-wide chat listener.
      2. **[x] Admin dashboard thread.** `replyToSupportRequest` appends instead of
         overwriting `reply`. Detail panel renders the list (same overlay chrome, topic
         pill, Mark Resolved). Reply photo already uploaded via `uploadSupportPhoto` —
         store it on the new message item. `lastSender = 'admin'`. Ticket stays in New
         until resolved.
      3. **[x] User-facing thread + real Reply.** Replace concatenated
         `— Your original message —` blob with the same list. Rip fake `sendReply()` /
         in-memory `messageStates.replies`. Wire **Your Response** + photo to the
         callable. `lastSender = 'user'`. Same Support page, same modal — no Messages
         menu.
      4. **[x] Test pass.** Confirm the loop on the current UI (the test harness). Fix only
         what breaks the loop. Then stop — no extra polish. Owner: all checks good
         2026-08-14. Left live.
      5. **Shelf flag (parked — owner).** Feature flag off (chat-style). Hide Reply and any "we'll reply
         in-app" copy. Engine stays in repo. Broadcasts stay. Ticket compose used for
         the test can be gated the same way.
      6. **Public door (parked — owner; same ship as 5).** Contact form → real send to
         `support@gisugo.com` (mailbox must exist; this is a new send path, not a rename
         of the Firestore form). WhatsApp button → `wa.me`, number in config, not
         plastered on the page; disabled while pending. Same pattern as
         `contact-reveal.js` (tap opens the app, number is not page text).
      7. **Full-phase audit (after owner shelf).** Syntax, rules, no leftover fake Reply path, flag actually
         off on production, Email/WhatsApp is the only public conversation door.
- [ ] **Phase 11: Settings product — wire or remove leftover controls. Not started,
      not next (parked; owner picks).** Phase 5 only moved storage. The Settings
      panel still presents System Status, User Management thresholds, Gig Moderation
      limits, Financial / G-Coin, Communication, Security, Notifications, Performance,
      and Feature Toggles as if they do something. Confirmed 2026-08-11: **zero** of
      those fields are read by live app or Cloud Functions. Maintenance Mode and
      Technical Warning composers still write unread `localStorage` keys
      (`maintenanceData`, `techWarningData`). This phase is a field-by-field pass:
      keep + enforce, or hide/remove so the UI does not imply fake power. Do not
      reopen Phase 5. Do not start until owner prioritizes it.
- [ ] **Phase 12: Applications + notifications lockdown (Track B). DECIDED 2026-08-17 — launch gate.**
      Do this **after remaining product phases are done**, immediately **before** the full-platform
      test pass, **before** public launch. Do **not** mark V1 / dashboard work complete until
      this ships. Not next while Phases 6 / 7 / 9 / 11 (and any other chosen leftovers)
      are still open. Full scope: `docs/NOTIFICATIONS_AND_APPLICATIONS_LOCKDOWN.md`.
      **Why last:** flipping rules too early breaks Apply / Hire / Accept. Doing it after
      launch has the same code size but a bigger blast radius. Quiet window + full QA after
      the lock is the point.
      **Ship order (do not skip):**
      1. Cloud Functions + switch client call sites. **Keep current rules up.**
      2. Prove Apply → review → hire → accept → alerts still work (SDK + iOS REST).
      3. Then lock rules: notifications create/update/delete = server; read = recipient
         only. Applications read = applicant or `gigOwnerId`; create enforces the stamp.
      4. Then full-platform QA. Not before step 3.
      Groundwork already shipped (`gigOwnerId` stamp + backfill). Push + unread counters
      already run server-side. This phase completes that architecture; it is not new
      Firebase setup and is not a cost project.
- [x] **SUPERSEDED 2026-08-15 (was: Gig Moderation Contact via `chat_threads`).**
      That 2026-08-09 write-up is history. Live decision is the Phase 8 entry above
      (Contact → `support_requests` Support thread). Overlays are live as of
      Phase 8 Ch 1–6 (2026-08-15/17).
- [x] **Phase 4: Support responder (admin side only) — shipped (2026-08-10).**
      Admin queue + one-slot `reply` + Mark Resolved + broadcasts. **Not** a complete
      support product: user-facing Reply is still a fake in-memory write; tickets cannot
      hold a real back-and-forth. That leftover is Phase 10, not a reopen of this phase.
      Full design in `docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md` "Support (Messages) — resolved design".
      Built in 5 audited chapters, same pattern as Phase 2/3:
      1. `firestore.rules`/`firestore.indexes.json`: `support_requests` admin update narrowed to a
         field-restricted allow-list (`status`/`reply`/`assignedTo`/`priority`/`isReadByRequester`/
         timestamps only — the requester's original submission content stays immutable, same
         discipline as jobs.status/users.status locking in Phases 2/3). New `platform_broadcasts`
         collection for Compose Public Message (any signed-in user can read; only admins can
         create, with shape validation; immutable — "Unsend" is a real delete, not an edit). New
         composite index (`status` ASC + `createdAt` DESC) for the New/Old admin queue queries.
         Both direct client writes (no Cloud Function needed) — unlike `jobs.status`/`users.status`,
         `support_requests`/`platform_broadcasts` never had a rules gap blocking `isAdmin()`.
      2. `firebase-db.js`: `getSupportQueueNew`/`getSupportQueueOld` (paginated glance queues, no
         live listener), `getSupportQueueCounts` (cheap `count()` aggregation tab badges),
         `replyToSupportRequest`/`resolveSupportRequest` (in-platform-only reply — no email/push,
         owner decision), `createPlatformBroadcast`/`getSentBroadcasts`/`deleteBroadcast`, and
         `getPlatformBroadcastsForUser` (one-time fetch for the user-facing side, not a live
         listener — broadcasts are rare enough that per-session-fresh is plenty).
      3. `admin-dashboard.js`/`.html`: replaced the mock New/Old/Sent inbox (hardcoded sample
         tickets + hardcoded stale topic dropdown with different/legacy option names) with the real
         queue, wired Reply (floating modal) and Mark Resolved, topic filter now reads the real
         shared taxonomy (`support-taxonomy.js`) instead of a separate hardcoded list, and wired
         Compose Public Message + Sent tab + Unsend to the new `platform_broadcasts` collection.
         Old mock-driven init functions (`initializeAdminMessages`/`initializeMessagesPagination`/
         `initializeInboxToggle`/`initializePublicMessageOverlay`/`initializeInboxSearch`/
         `initializeMessageOverlay`/`initializeReplyModal`, ~2,230 lines) are no longer called
         anywhere and are dead — left in place rather than surgically deleted from an 8,000+ line
         file under time pressure; tracked in the Dead Code Cleanup list below, same treatment as
         the existing `support.js` item.
      4. `support.js` (user-facing read side): `mapSupportRecordToUnifiedMessage` previously echoed
         the requester's OWN submitted message back at them mislabeled as "GISUGO Support" content
         (no `reply` field existed yet) — now surfaces the real admin reply as the headline content,
         falls back to an honest "received, 24-48h" placeholder before one exists. Added real
         broadcast reading (`ensureBroadcastMessagesLoaded`/`mapBroadcastRecordToUnifiedMessage`) —
         previously 100% mock/commented-out, zero backend existed. Mapped broadcast category codes
         to the unified inbox's legacy type-filter values (`system`/`notifications`/`updates`/
         `promotions`) so the existing filter dropdown actually matches broadcasts — this filter
         path was silently broken even in the original mock (never set `.topic` on public
         messages), fixed as a side effect of wiring this for real.
      5. Full-phase audit (this entry + architecture study), `node --check` clean on all 3 JS files,
         zero duplicate function/variable declarations introduced, every referenced DOM id
         cross-checked against the HTML.
- [x] **Phase 5: Settings storage only (`localStorage` → Firestore) — shipped (2026-08-10).**
      **Not a complete Settings product.** This phase moved the cabinet. It did not wire,
      hide, or delete the leftover controls. After the homepage-video toggle was removed
      (2026-08-11), **zero** Settings fields are live. Remaining product work is Phase 11.
      (originally flagged 2026-06-27) The admin settings object (`gisugo_admin_settings`) used to live
      in per-browser `localStorage`, so global toggles behaved inconsistently across browsers/devices.
      **Pre-build audit finding:** only **1 of the 47** settings had any real consumer anywhere in the
      app — `showHomepageVideoForLoggedIn`, read by `index.html`'s `getHomeVideoSettingAllowLoggedIn()`.
      The other 46 (System Status suspend-toggles, User Management thresholds, Gig Moderation price
      limits, Financial Controls/commission/G-Coin, Communication Controls, Security, Notifications,
      Performance, and 4 of 5 Feature Toggles) are dashboard-only UI scaffolding with zero enforcement
      anywhere in the frontend or `functions/index.js`. The Technical Warning Composer and Maintenance
      Mode Composer also save to their own separate, equally-unread localStorage keys (`techWarningData`,
      `maintenanceData`) — same category of decorative mock, left as-is (out of scope for this phase,
      no public-facing banner/gate exists yet for either). Moving storage to Firestore fixes the real
      cross-browser-consistency bug regardless of how many settings are currently enforced, but
      "server-backed" ≠ "functional" for 46 of 47 — tracked honestly in the dashboard UI itself (see
      Chapter 6) instead of silently implying otherwise.
      **Built in 6 audited chapters, same pattern as Phases 2-4:**
      1. Audit (above).
      2. `firestore.rules`: new `platform_settings/general` doc — **public read** (`allow read: if true`,
         needed because `index.html`'s video gate runs for logged-out homepage visitors too, not just
         admins), **`isSuperAdmin()`-only write** (same "full admin powers" tier as granting/revoking
         other admins — the owner's admin doc already has `role: 'super_admin'` from the Phase 3
         bootstrap script, so no migration needed). No index needed — single-doc `get()`, not a query.
      3. `firebase-db.js`: `getPlatformSettings(defaults)` (one-time read, auto-seeds the doc with
         `defaults` on first-ever read if missing, fails open to `defaults` on any error — never blocks
         dashboard/homepage load) and `savePlatformSettings(settings)`.
      4. `admin-dashboard.js`: `loadSettings()`/`saveSettings()`/`resetSettings()` swapped from
         `localStorage.getItem/setItem/removeItem(SETTINGS_STORAGE_KEY)` onto the new Firestore
         functions (`loadSettings`/`initializeSystemSettings` now `async`, awaited so the maintenance-mode
         initial-state check still sees the real loaded value). Save/Reset now show an error toast if the
         Firestore write fails instead of silently "succeeding" locally. No UI/markup redesign — same 9
         category panels, same ~47 fields. Dead `SETTINGS_STORAGE_KEY` constant removed.
      5. `index.html`: `getHomeVideoSettingAllowLoggedIn()` still reads a local cache for an instant,
         non-blocking render (no visitor should wait on a network round trip just to see the homepage),
         but that cache is now a **1-hour Firestore cache**, not the source of truth — a new
         `refreshHomeVideoSettingFromFirestore()` revalidates it in the background at most once/hour/device
         via `getPlatformSettings()` and re-applies video visibility only if the fetched value actually
         differs, so a real admin change is live everywhere within an hour without adding a Firestore read
         to every single homepage pageview. `firebase-db.js` bumped to `?v=65` across all 9 pages that
         load it (`index`/`support`/`jobs`/`profile`/`alerts`/`new-post2`/`dynamic-job`/`messages`/
         `my-applications`) to avoid any browser serving a stale cached copy missing the new functions.
         One-time `scripts/seed-platform-settings.js` (dry-run by default, `--apply` to write) run via
         the Admin SDK to seed `platform_settings/general` with `DEFAULT_SETTINGS` *before* shipping —
         avoids every anonymous homepage visitor's first read hitting a missing doc and attempting (and
         failing, permission-denied) to self-seed it before any admin ever opens the Settings tab.
      6. Honest-labeling pass: added a `⚠️` notice at the top of the Settings panel explaining most
         controls aren't wired to live enforcement yet, plus a `🟢 Live` badge on the one field that is
         (Homepage Video for Logged-in Users) — same "don't imply fake behavior is real" discipline as
         the `₱0` Revenue placeholder and the Permaban "not built yet" toast. No fields hidden or
         removed; future phases can wire individual ones for real as needed.
      7. Full-phase audit (this entry), `node --check` clean on `firebase-db.js`/`admin-dashboard.js`,
         inline `<script>` in `index.html` parse-checked, `firestore.rules` brace-balanced with exactly
         one `platform_settings` match block, zero duplicate function declarations, `git diff --stat`
         reviewed file-by-file to confirm only the intended 15 files changed.
- [x] **Post-Phase-4/5 manual testing bugfix batch — shipped (2026-08-11).** Owner manually tested
      Phase 4 + Phase 5 per the request above; found 3 real bugs, all fixed same session:
      1. **Homepage video toggle didn't actually show/hide the video** despite the setting being
         correctly saved and synced in Firestore (verified via Admin SDK — the write path was never
         the problem). Root cause: `getPlatformSettings()`'s `.get()` call was using Firestore's
         default "server-if-online-else-cache" read mode; this app runs with multi-tab offline
         persistence enabled, and a `.get()` from a fresh tab/page can return an IndexedDB-cached
         snapshot instead of the true current value — the same class of staleness previously seen
         with Gigs Manager edits not reflecting on the listing page in the same browser. Fix: force
         `{ source: 'server' }` on this read. Cheap to do unconditionally since this doc is read at
         most once per dashboard load / once per hour per homepage device.
      2. **Support inbox tab badges (New/Old counts) and User Management's "Gigs Listed"/
         "Applications" stat both silently showed 0**, always, since Phase 3/4 shipped —
         `TypeError: db.collection(...).where(...).count is not a function` in the browser console.
         Root cause, confirmed by directly inspecting the actual `firebase-firestore-compat.js`
         v10.7.0 bundle served to the browser: the **compat/namespaced client SDK does not implement
         Firestore's count() aggregation at all** — `getCountFromServer` only exists in the modular
         SDK, and this codebase is 100% compat/namespaced everywhere. `getSupportQueueCounts()`
         (Phase 4) and `getUserModerationExtras()` (Phase 3) both called `.where(...).count().get()`,
         which threw every time, silently swallowed by `Promise.allSettled` → always fell back to 0.
         Fix: swapped both to a plain `.get()` + `.size`. Slightly more read cost than a true
         aggregate count, but both collections are small/naturally bounded (a support queue, one
         user's own gigs/applications) so the difference is negligible — judged not worth introducing
         the modular SDK into an otherwise 100%-compat codebase just for these two counts.
      3. **Admin Support queue "New" tab threw `FAILED_PRECONDITION: query requires an index`** even
         though a `support_requests` (status ASC, createdAt DESC) index was already deployed in
         Phase 4. Root cause: the New-tab query explicitly sorts `createdAt` **ascending** ("oldest
         first, FIFO"), while the deployed index was built descending (correct for the *Old*-tab
         query, which does need descending) — composite indexes are not direction-interchangeable
         across 2+ sort fields the way single-field indexes are. Fix: added a second composite index,
         (status ASC, createdAt ASC), specifically for the New-tab query. Verified post-deploy (index
         build took ~3 min) via a direct Admin SDK query matching the exact client-side query shape.
      4. **Follow-up (2026-08-11, same day): homepage video toggle was STILL not updating reliably**
         after fix #1 above (`source: 'server'`) — owner tested across Chrome/Edge/incognito and found
         a browser that had already loaded the homepage once would keep showing whatever value was
         true at that *first* load, ignoring all later toggle changes, for up to an hour; a brand-new
         browser/incognito profile always showed the current true value. Real root cause: a **client-side
         1-hour localStorage cache TTL** (`HOME_ADMIN_SETTINGS_CACHE_MS`) that made
         `refreshHomeVideoSettingFromFirestore()` skip its Firestore read entirely if the cache was
         under an hour old — `source: 'server'` was correct but never even ran during that window. Fix:
         removed the TTL/freshness check entirely; every homepage pageview now always re-validates
         against Firestore in the background (instant cached value still paints first, corrected a
         moment later if wrong). Cost is one extra tiny single-doc read per homepage pageview — judged
         negligible at current traffic, and "always eventually correct within seconds" was worth more
         here than saving that one read. Also added a spinning hourglass + disabled state to the
         Save/Reset Settings buttons (`admin-dashboard.js`/`.css`) since the Firestore write now has a
         visible ~1-3s delay the old instant-localStorage version never had. Owner retested and
         confirmed fixed across repeated toggles in the same session/browser.
- [x] **"Homepage Video for Logged-in Users" toggle replaced with a code-level video/thumbnail
      swap — shipped (2026-08-11).** Same-day follow-up discussion after the fix above: instead of
      hiding/showing one video for logged-in users (the only setting with real enforcement out of
      all 47 from Phase 5), owner opted to show a **different** video + thumbnail to logged-in
      users vs. visitors — more useful, and since owner doesn't expect to change either video often,
      hardcoded directly in `index.html` instead of Firestore. Net effect: the ONE real Firestore
      read Phase 5 added to every homepage pageview is now gone entirely (not just cheaper —
      zero), because which video/thumbnail to show is decided from the login state the homepage
      already computes for free (same signal the nav menu uses), no database call involved.
      Changes: `index.html` — removed `refreshHomeVideoSettingFromFirestore()`,
      `getHomeVideoSettingAllowLoggedIn()`, and the show/hide branch in the old
      `applyHomeVideoVisibility()`; added `HOME_VIDEO_LOGGED_OUT`/`HOME_VIDEO_LOGGED_IN` constants
      (youtubeId + thumbnail path each, both currently identical to the pre-existing single video/
      thumbnail — no visual change yet, just future-ready) with an explicit "FUTURE AGENT" comment
      explaining the two-line edit needed to point either one at real different content later; new
      `applyHomeVideoForAuthState()` now only swaps the thumbnail `<img src>`, video section itself
      is unconditionally visible. `admin-dashboard.html`/`.js` — removed the toggle row and its
      `DEFAULT_SETTINGS` key. `firestore.rules` — `platform_settings/{docId}` read narrowed from
      public (`allow read: if true`) to `isAdmin()`-only, since removing this field means **no
      remaining public-facing consumer** of that doc (confirmed via `grep` — only
      `admin-dashboard.js` calls `getPlatformSettings()` now); same tier as `platform_analytics`.
      `firebase-db.js`/`scripts/seed-platform-settings.js` comments updated to match. The other 46
      settings fields are unaffected — this only removes the one field/toggle that had a real
      consumer; Settings panel now honestly shows zero `🟢 Live` badges since none remain.
- [x] **Phase 6: Ad Placement — persist the existing panel; feeds read it.
      Ch 1–6 complete 2026-08-18.**
      The admin **Ad Placement** UI already exists (`admin-dashboard.html` +
      `initializeAdSettingsPanel`). Older plan:
      `docs/archive/admin-dashboard/AD_PHASE3_WIRING.md` (two collections).
      This phase slims that to one config doc.
      **Locked product:**
      • One Firestore doc: `adSettings/global`. Same shape as the panel blob
        (enabled, cadence, zone toggles, `ads[]`). One public `.get()` per
        page. No live listener. No `ads` collection this phase (handful of
        admin-curated cards; split later if inventory grows).
      • Public read, admin write. Category pages are public — this is not
        `platform_settings` (admin-only). Users cannot create/update/delete.
      • Runtime uses **active** + in-window + zone/category. Draft / paused
        stay in the same doc; client ignores them.
      • Three zones already in the panel: listing inline, profile slot, gig
        detail. Three types already in the panel: `site_offer`,
        `sponsored_external`, `video_popup`.
      • Image / video = URL fields already on the form. No Storage upload.
      • Accordion collapse stays `localStorage` (cosmetic).
      • Read fail or empty doc → keep today’s hardcoded `AD_TRIAL_CONFIG`
        so feeds do not go blank.
      • **Not this phase:** impression / click counters (the form has
        `currentImpressions` / `maxClicks` — do not increment from the
        client; that is a write storm). No AdSense, no paid billing, no new
        zones, no GA. Settings-panel feature flag (Settings switches are
        still fake — Phase 11).
      **Microtasklist**
      1. **[x] Rules + one config doc — 2026-08-18.** `adSettings/{docId}`:
         read = anyone; create/update/delete = `isAdmin()`. Seeded
         `adSettings/global` from listing `AD_TRIAL_CONFIG` (5 live cards).
         Seed script refuses overwrite. No Cloud Function. Rules are on
         disk — not live until Deploy.
      2. **[x] Admin persist — 2026-08-18.** Save / Reset / Add / Pause /
         Delete write `adSettings/global`. Hourglass. Toast only after
         success. Collapse stays local. Subtitle no longer says “local
         prototype.” Inventory default is the 5 live cards, not the old
         single sample.
      3. **[x] Runtime adapter + listing — 2026-08-18.**
         `public/js/ad-config-service.js` one-shot `getAdGlobalSettings()`.
         `listing.js` uses it for `listing_feed_inline`. Fallback to
         `AD_TRIAL_CONFIG` on error / missing doc. No listener.
      4. **[x] Profile + gig detail — 2026-08-18.** Same adapter for
         `profile_logout_slot` and `gig_detail_post_customer`. Same fallback.
      5. **[x] Owner test — 2026-08-18 zones; 2026-08-19 inventory.**
         Master, Frequency, Tail, Empty-state, and all three zones
         passed (refresh, not live). Frequency is a full-width row;
         Max Ads / Session and Start After N stripped (unused).
         Inventory 2026-08-19: Pause, Edit (form scroll + toast),
         Status, Add, Delete passed. External links need `https://`
         (bare `facebook.com` becomes `gisugo.com/facebook.com`).
         Deploy new image files before saving the Image URL; same
         filename replacements need `?v=` or a cache clear. Export
         JSON removed (prototype leftover). Inventory rows show a
         Hosting thumbnail (no extra Firestore read).
      6. **[x] Leftover audit — 2026-08-18.** Syntax clean. Rules:
         `adSettings` public read, admin write. Settings persist is
         Firestore only (`adSettings/global`); accordion collapse stays
         localStorage. No ad-config listener. No impression/click writes
         from listing / profile / adapter. Hardcoded `AD_TRIAL_CONFIG`
         (and profile / gig-detail copies) are fallback-only.
         **Accepted leftovers (not this phase):** master OFF still
         unchecks the dependent zone/tail/empty switches (turn them back
         on when restoring); `maxAdsPerSession` / `startAfterCards` still
         stored on the doc, not on the form; Weight / Max Impressions /
         Max Clicks / CTR still on Add/Edit and do not run the feed;
         one inventory still feeds all three zones (no per-ad zone/
         category picker). Per-ad zone/category is a later build.
         **Operator rule:** Deploy the image file first, then save the
         URL. Same-name replacements: `?v=2` or a new filename.
- [x] **Phase 7: Overview Storage / User Activity / Traffic cards — CLOSED
      2026-08-24.** The three cards already exist and show
      honest `0`. Design in
      `docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md` (manual-refresh snapshots +
      Open items #1–#2). The old “one code pass after GA + Billing” lump was
      wrong: Storage is our own running counter, not GA/Billing.
      **Locked product:**
      • Three existing Overview cards + their overlays only. Same HTML IDs.
        No new cards. Gigs Analytics stays Phase 1.
      • Manual-refresh snapshots. No live listener. No scheduled job this
        phase. Dashboard reads tiny `platform_analytics` docs (`isAdmin()`
        read, Functions-only write — rules already match).
      • **Storage Usage** = running byte + file counters, bumped on Storage
        finalize/delete. Never list the bucket from the dashboard. One-time
        Admin SDK seed is allowed so existing files are not invisible. Cost
        = published Firebase Storage $/GB math, labeled estimate. Drop the
        fake “of 500 GB plan” line (Blaze has no storage cap).
      • **User Activity** = GA4 Data API. No data until Analytics is on and
        has traffic. Device / session / peak / repeat / bounce / browser
        fill existing fields; honest empty if the property is new.
      • **Traffic & Costs** = GCP Billing API. Firestore cannot self-count
        reads/writes. Card face = bandwidth MTD + $ MTD. Overlay period
        selector is MTD first; other periods leftover if the export cannot
        cheaply answer them.
      • Secrets stay in Cloud Functions. Browser never calls GA/Billing
        with credentials. Refresh = admin-only callable that writes the
        snapshot doc; card then `.get()`s that doc.
      • `landing.js` already has a dead `gtag('config', 'GA_MEASUREMENT_ID')`
        placeholder — do not treat that as live Analytics.
      • **Owner setup (blocks Ch 3 and Ch 4, not Ch 1):** (a) enable
        Firebase/GA4 and give the Measurement ID; (b) grant the Functions
        service account Billing Account Viewer (confirmed OK 2026-07-27,
        grant not done).
      • **Not this phase:** AdSense, paid billing product, impression
        writes, Regional / Age leftover, cookie-consent banner, nightly
        cron, hiding the 0 cards, “Projected Full” (needs a fake cap).
      **Microtasklist**
      1. **[x] Storage counter + card — shipped 2026-08-21.**
         Triggers + seed live. Other includes `support_photos/` +
         `chat_photos/`. Growth month-start stamp + 5 GB free
         cost built 2026-08-22. Overwrite drift leftover.
      2. **[x] Enable GA4 SDK — built 2026-08-21, not collecting.**
         Owner enabled Analytics 2026-08-21. IDs in code:
         Measurement `G-TBGN7B69R9`, property `551027693`.
         Functions SAs added as GA4 Viewer. Admin dashboard skipped.
         Not collecting on live until Deploy.
      3. **[x] User Activity snapshot — built 2026-08-21, not live.**
         Admin-only `refreshUserActivitySnapshot` →
         `platform_analytics/user_activity`. Overlay **Refresh
         snapshot**. Honest `needs_ga4` until the property ID is set
         (`GA4_PROPERTY_ID` env). Functions SA must be a GA4 Viewer
         after Analytics is on. Session-duration histogram leftover.
      4. **[x] Traffic snapshot — built 2026-08-21, not live.**
         Admin-only `refreshTrafficSnapshot` reads Cloud Monitoring
         (Firestore reads/writes + Hosting/Storage egress) and our
         Storage byte counter. $ is a published-rate **estimate**,
         not an invoice. Overlay period selector leftover (MTD only).
         BigQuery billing export leftover (Cloud Billing API has no
         “get MTD spend” endpoint). Auth cost tile stays 0.
      5. **[~] Owner test — 2026-08-21.** Storage overlay matches the
         seed (17.3 MB / 170 files; 8 profile / 88 gig / 12 ID / 62
         other). Traffic **Refresh snapshot** worked (883.0 MB /
         est. $0.05). User Activity **Refresh snapshot** failed:
         snapshot `status=error` — Google Analytics Data API is
         disabled on project `380568649178`. Owner must enable
         `analyticsdata.googleapis.com` then Refresh again. Honest
         empty is OK until GA has sessions; this toast is not empty.
      6. **[x] Leftover audit — 2026-08-24.** `node --check` clean
         (`functions/index.js`, `firebase-db.js`, `admin-dashboard.js`,
         `firebase-config.js`). `platform_analytics` still
         `allow write: if false` (Functions/Admin SDK only). Dashboard
         Storage / Activity / Traffic are one-shot `.get()` of those
         docs — no bucket `listAll`/`getFiles`, no `onSnapshot`.
         Refresh callables are admin-only; browser never calls
         GA4/Monitoring/Billing with credentials. Admin dashboard
         skips gtag (`initializeConsumerAnalytics`). Public G-
         Measurement ID is not a secret. Live snapshots:
         `user_activity` `status=ok` (2026-08-21), `traffic`
         `status=ok` (2026-08-22). Storage Growth + 5 GB free cost
         already live. **Accepted leftovers (not this phase):**
         same-path overwrite can drift the Storage counter until
         re-seed; no session-duration histogram; Traffic period
         selector is MTD only; Auth cost tile stays 0; BigQuery
         invoice export not wired; `landing.js` still has a dead
         `GA_MEASUREMENT_ID` gtag placeholder; Overview tile tour
         / Budget remaining stays parked.
- [x] **Storage hygiene — CLOSED 2026-08-23.** Phase 7 counts
      files, not accounts. Sweep + prevent-accumulation (Ch 1–8)
      owner-tested. Phase 9 Permanently Ban **keeps** evidence —
      do not reuse this wipe for a ban.
      **Live after owner test (2026-08-23):** 3 users, 70 jobs;
      bucket + `platform_analytics/storage` = **113 files /
      12.5 MB** (3 profile / 70 gig / 4 ID / 36 other). Dry-run
      DELETE 0. ID 4 = 2 face pairs (mp4 + poster only).
      Profile 3 = one `photo.jpg` each.
      **Locked product:**
      • Sweep script stays Admin-SDK, dry-run default. Dashboard
        never lists the bucket. Re-seed after apply.
      • Delete a file only when unreferenced: profile/face/ID =
        UID not in `users`; gig = no live `jobs/{jobId}` **and**
        no live `thumbnail` URL points at that path.
      • Prevention is the real remaining gate: product delete /
        replace / relist must remove or not reuse Storage objects.
      • No live listener. No nightly cron this pass.
      • Support ticket photos stay (evidence). Chat leftovers
        already swept (User Chats empty / parked).
      **Not this pass:** Overview tile tour (Budget remaining is
      a Phase 7 leftover, not hygiene). Phase 9 ban. User
      self-delete product. Chat-thread photo cleanup when chat
      ships. BigQuery. Cookie banner.
      **Microtasklist**
      1. **[x] Dry-run sweep script — 2026-08-22.**
         `scripts/sweep-storage-orphans.js` (dry-run default).
         Ran: 56 DELETE / 114 KEEP.
      2. **[x] Apply sweep + re-seed — 2026-08-22.**
         Deleted 56 orphans (5 deleted-UID profiles, 17 unused
         gig photos, 8 leftover face files, 26 parked
         `chat_photos/`). Support photos kept. Live users/jobs
         untouched. Re-seeded 114 / 12.5 MB.
      3. **[x] Harden `deleteJob()` — 2026-08-22 (not live until
         Deploy).** Always deletes
         `job_photos/{posterId}/{jobId}.jpg` by path. If the
         thumbnail URL points at a different `job_photos/` file
         (relist reuse), deletes that extra path only when no
         other live job by the same poster still references it.
         Owner + admin delete both use this. Manual console job
         deletes will still orphan — accepted.
      4. **[x] Relist writes a new path — 2026-08-22 (not live
         until Deploy).** Completed relist creates a new gig and
         always stores the photo as
         `job_photos/{uid}/{newJobId}.jpg` (re-upload if they
         pick a file, otherwise copy the old Storage file).
         Never copies the old thumbnail URL onto the new gig.
         Void/same-gig relist is unchanged (same gig, same
         file). `new-post.js` leftover URL-copy removed.
      5. **[x] Account-media wipe helper — 2026-08-22 (not live
         until Deploy).** `functions/wipe-account-media.js` +
         self-only callable `wipeAccountMedia` + Admin-SDK
         script `scripts/wipe-account-media.js` (dry-run
         default). Deletes `profile_photos/{uid}/`,
         `face_verification/{uid}/`, `verification_ids/{uid}/`.
         `job_photos/{uid}/` only if that user has no live
         jobs. Support photos untouched. Permanently Ban still
         does not call this.
      6. **[x] Replace paths do not accumulate — 2026-08-22
         (not live until Deploy).** Profile still overwrites
         `photo.jpg`. Face normalize now lists the folder and
         deletes anything except `face_intro.mp4` +
         `face_poster.jpg` (plus existing client variant
         cleanup). ID helpers now write
         `verification_ids/{uid}/id.jpg` + `selfie.jpg` and
         delete leftover timestamp files. Live ID submit UI
         is still mock (not wired).
      7. **[x] Owner test — 2026-08-23.** Delete gig → Gig
         tile −1 (71→70). Replace profile → still 3 files.
         Re-record face → ID stayed 4. Triggers bumped the
         counter (no Refresh). Verified live: jobs 70;
         `platform_analytics/storage` 113 files (3 / 70 / 4 /
         36) matches bucket. Face folders are mp4 + poster
         only (no leftover webm).
      8. **[x] Leftover audit — 2026-08-23.** Dashboard Storage
         overlay is one `.get()` of `platform_analytics/storage`
         — no bucket `listAll` / `getFiles`, no Storage
         listener. `wipeAccountMedia` is not called from
         Permanently Ban (still “not built” toast). Support
         photos still present (36 KEEP). `node --check
         functions/index.js` clean. `storage.rules` public
         reads unchanged (`profile_photos` / `job_photos`
         `allow read: if true`).
- [x] **deleteJob() application + coin leftovers — CLOSED 2026-08-24.**
      **Owner retest + audit 2026-08-24.** Dashboard suspend → delete
      of live “Deliver one pallet of plush toys…” (`SfYhDHE9fwtGNO41qxL4`).
      Console: `cleanupDeletedJobApplications` succeeded. No batch
      permission error. Job gone. All 3 application records gone
      (Chris pending + 2 already-closed GISUGO Ops). Dead-gig leftover
      scan 0. Jobs 67. Applications 84. Chris 10/10 (`job_deleted`).
      GISUGO Operations stayed 9/10. Gig Analytics 100 is a create-only
      lifetime counter and did not drop.
      **Live callers of `deleteJob()`:** Gig Moderation permanent delete
      (this test) and owner My Gigs delete (same function, not retested
      separately today).
      **Locked product (shipped `8f52ddf`):** callable queries by
      `jobId`, skips missing IDs, refunds only pending/accepted/hired
      still holding a coin. Client fallback is one-by-one. Do not
      widen application delete rules. Do not touch Phase 12 here.
- [ ] **Admin name change does not update stamped names — ADDED 2026-08-24.**
      Not a launch blocker (users cannot self-edit names). Worth fixing before
      granting a user-requested rename.
      **Confirmed live:** View Applications and Offered-tab “Offered By”
      still show “Android Samsung”. Live profile is “GISUGO Operations”.
      Hiring cards use the same job stamps (`hiredWorkerName` /
      `posterName`). Working-tab “Working For” can look current when that
      other person never renamed.
      **Cause:** names are copied onto `applications.applicantName` and
      `jobs.posterName` / `hiredWorkerName` at write time. Those cards
      render the stamp. Ratings already backfill from `users/{uid}`.
      `scripts/admin-rename-user.js` updates `users.fullName` + Auth
      `displayName` only. Prior fix (`getFreshOwnDisplayName`) was the
      user’s own name in chat.
      **Locked:** do not let users self-rename. Admin rename must rewrite
      stamped names, or those cards must read `users.fullName`.
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
- [x] **SUPERSEDED 2026-08-14 (was: DEFERRED 2026-08-12 replace in-app Support with Email/WhatsApp).**
      The 2026-08-12 write-up below is kept as history. **2026-08-14:** Phase 10 Chapters 1–4
      shipped and the in-app desk is **left live**. Shelf + Email/WhatsApp is owner-owned
      later — do not hide Reply. Do not treat this 08-12 "keep tickets, defer
      Email/WhatsApp until scale" line as a reason to rip the live thread.
      Original 2026-08-12 text (historical): replace the in-app Support ticket system with
      Email/WhatsApp deep-links — NOT built now, only when scaling makes the current system's
      limits actually matter. Then-current decision: **keep the existing Firestore-backed
      `support_requests` ticket system** (Admin Dashboard queue, reply, status tracking) as-is,
      with the photo-attachment change below. This alternative was fully discussed and
      explicitly shelved, not forgotten:
      - **The idea:** retire `support_requests` entirely. `support.html` becomes a "Contact Us"
        screen offering **Email** (`mailto:`) and **WhatsApp** (`wa.me/<official number>?text=…`)
        options, exactly mirroring the existing `contact-reveal.js` Call/Text/WhatsApp/Viber
        pattern already used for gig applicant contact — tap a link, it opens the user's own
        email/WhatsApp app with a prefilled message, and the entire conversation happens inside
        that app from then on. No ticket, no reply-inside-GISUGO concept, no notification-of-reply
        problem (there's nothing to notify — the "reply" already arrives in their WhatsApp/email).
      - **Why this is genuinely viable, not just an easy way out:** zero backend cost — this is the
        free `wa.me`/`mailto:` deep-link mechanism already shipped, not the paid WhatsApp Business
        API (no Meta App Review, no per-conversation fee, no third-party BSP). Matches how PH users
        actually prefer to communicate (WhatsApp/Viber over email) more closely than the ticket form.
      - **Why it's deferred, not adopted:** it would forfeit everything Phase 4 built — ticket
        history tied to the account, status tracking (pending/replied/resolved), topic tagging, and
        the Admin Dashboard's Support queue as a tool (it would have nothing left to manage for
        whichever contact method wins). It also requires a human actively monitoring a real,
        official WhatsApp number/email inbox — an operational commitment, not just a code change.
        `support@gisugo.com` shown in the UI today is **decorative only** — confirmed 2026-08-12,
        no mailbox is wired to it, nothing has ever sent there from the app.
      - **If revisited later, need before building:** (1) a real, actively-monitored email inbox,
        (2) an official WhatsApp Business number, (3) a decision on Email+WhatsApp only vs. also
        adding Viber (Contact Worker currently offers both WhatsApp and Viber tiles).
- [ ] **QUEUED (after owner shelves Phase 10 + Email/WhatsApp door — not next):
      gig/job listing photo bandwidth optimization.** Support photo-conversion (thumb + full)
      already shipped 2026-08-12. Phase 10 engine is live; this gig-card work is still parked.
      Confirmed 2026-08-12 via code audit: `uploadJobPhoto()` produces exactly ONE
      image — 1200×1200 max, JPEG quality 0.8 — and that same file is what's stored in the job's
      `thumbnail` field and shown on every listing card. The field name is misleading; there is no
      actual small thumbnail. Every browse of every gig card downloads the full-size photo meant
      for the detail view. By contrast, the (currently dormant) chat photo system already does this
      correctly: a 100px/60%-quality thumbnail for list views + a separate 720px/75%-quality
      full-size for detail — proof the pattern already exists in this codebase, just never applied
      to job photos. This is the dominant Firestore/Storage cost driver at real scale (every
      session, every user, every card — not a rare action like filing a support ticket), and pairs
      with the still-open "CDN/cache layer in front of Storage-served images" question from the
      2026-08-12 cost-modeling discussion. Not started — queued as the next build after Support.
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
      - **`public/js/admin-dashboard.js` — ~2,230 lines of unreachable mock-era Messages/Support
        functions (added 2026-08-10, Phase 4).** Two blocks left behind when the real Support
        Center replaced them: `initializeAdminMessages`/`initializeCustomerMessages`/
        `loadMessageDetails`/`populateMessageDetail`/`generateReplyThreadHTML`/`getFullMessageContent`/
        `initializeReplySystem`/`markMessageResolved` etc. (old lines ~447–1269) and
        `initializeReplyModal`/`initializeMessagesPagination`/`initializeInboxToggle`/
        `initializePublicMessageOverlay`/`initializeInboxSearch`/`initializeMessageOverlay`/
        `initializeUnsendConfirmation` etc. (old lines ~1963–3369). Confirmed unreachable — nothing
        in `DOMContentLoaded` calls any of them anymore (replaced by a single
        `initializeSupportCenter()`), and no HTML element ids they target collide with the new
        Support Center code (cross-checked). Safe to delete, just needs someone to carefully carve
        the two ranges out without touching the real "USER CHATS SYSTEM" section sitting in between them.
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
- [ ] **Homepage cold-load audit + logged-in menu delay — INVESTIGATED, measured, DEFERRED
      (decided 2026-08-14). Ship as-is. Do not re-litigate before launch.** Originating report: the
      homepage felt slow on a hard refresh with all site data cleared, on a premium phone with fast
      internet. **Never reproduced** — the user could not replicate it afterwards on 5G and
      attributed it to a mobile browser-app hiccup after clearing all data without fully closing the
      app. Full measurement pass was done anyway; findings below so nobody re-runs it.
      - **Measured cold-load (live gisugo.com, cache disabled, via CDP):** desktop TTFB 137ms /
        FCP 252ms / DOMContentLoaded 354ms / load 359ms. Simulated 4G (5 Mbps, 50ms latency):
        FCP 356ms / **DCL 1,786ms** / **load 4,180ms**. That 4.2s is pure transfer arithmetic
        (2.39 MB ≈ 19.1 megabits ÷ 5 Mbps ≈ 3.8s), not a stall — nothing is "bogging down."
      - **Total first-load weight ≈ 2.39 MB**, of which **2,102 KB is images (88%)**:
        `sharebanner.jpg` 954 KB, `GISUGO-BANNER-horizontal.jpg` 516 KB, `Gisugo-emblem.png` 198 KB,
        `Kompra.png` 136, `Limpyo.png` 134, `Solicitor.png` 86, `Hatod.png` 78. Remainder: Firebase
        compat SDK from gstatic 263 KB gzipped (app 9.1 / auth 133.1 / firestore 98.5 / storage 12.7
        / messaging 9.8 — note these report `transferSize` 0 in Resource Timing because gstatic sends
        no `Timing-Allow-Origin`, so any future measurement must add them manually), own JS 71 KB,
        HTML+CSS ~10 KB.
      - **Oversized-asset targets if ever done (owner was going to handle these manually):**
        `sharebanner.jpg` is 1536×940 displayed at 357×219 → resize **720×440 q80 (~80 KB)**.
        `GISUGO-BANNER-horizontal.jpg` is 1050×581 displayed at 390×219 → **780×432 q80 (~70 KB)**.
        `Gisugo-emblem.png` is 616×676 for a logo displayed at 50–140px → **280×280 (~25 KB)**.
        Those three alone would take the page 2.39 MB → ~0.9 MB. The 4 hero card PNGs (78–136 KB)
        are **fine — deliberately left alone**, recompressing them buys ~0.1s and risks the artwork.
        (Distinct from the gig/job listing photo bandwidth item above, which is Storage-served user
        uploads, not static homepage assets.)
      - **`loading="lazy" decoding="async"` added to the share ad `<img>` (`index.html` ~L426),
        KEPT 2026-08-14 — but it does NOT remove 954 KB from first load.** Measured on an emulated
        390×844 phone with Explore collapsed: the ad sits at offsetTop **814** against an 844px
        fold, i.e. inside the initial viewport, so the browser fetches it during initial load and is
        right to. On desktop it's 217px below the fold, still inside Chrome's preload margin. The
        attribute only lowers fetch priority (stops it competing with logo/hero) and genuinely defers
        once Explore is expanded and the page gets long. Real fix for that file is the resize above.
      - **Homepage video thumbnail: both login states deliberately share ONE file (2026-08-14).**
        Briefly shipped with `HOME_VIDEO_LOGGED_IN` pointing at `GISUGO-BANNER-horizontal2.jpg` while
        `HOME_VIDEO_LOGGED_OUT` and the `<img>` at `index.html:285` still used
        `GISUGO-BANNER-horizontal.jpg`. Owner immediately observed the predicted **~2s thumbnail
        swap after login**, and it also meant logged-in users downloaded **both** banners
        (538 KB + 668 KB ≈ 1.2 MB). **Owner decision: the homepage shows exactly ONE thumbnail,
        always, regardless of which video plays behind it — and `GISUGO-BANNER-horizontal.jpg` is
        the permanent slot for it, so future cover art is a FILE REPLACEMENT, not a new filename +
        code change.** The `<img src>` at `index.html:285` and both configs are all back on that one
        file, so `applyHomeVideoForAuthState()` finds `src` already correct and never swaps — exactly
        one banner per visit, no flash (verified by measurement: forcing the logged-in path triggers
        0 extra downloads). `GISUGO-BANNER-horizontal2.jpg` was committed in `19abd30` and is now
        **unreferenced** — safe to delete, or keep as the source art to copy over the canonical file.
        ⚠️ **Coupling to know about:** `GISUGO-BANNER-horizontal.jpg` is also used by
        `landing.html:34`, so replacing that file changes the landing page image too. If the homepage
        ever needs art that landing must NOT share, that's the moment to split filenames — and the
        `<img src>` must move with it. **Two different thumbnails are structurally possible but
        inherently cost a visible swap + a second download for whichever state doesn't match the
        hardcoded `<img src>`** — that is a property of the design, not a bug to fix. `youtubeId` is
        still shared (no second video exists); splitting *that* alone is free because the video only
        loads on click, well after auth confirms. `GISUGO-BANNER-horizontal.jpg` is still live on
        `landing.html:34` — do not delete it.
      - **Ruled out, with evidence — do not re-investigate:** (1) *Shimmer removal is innocent* —
        `home.css:2052` documents the rule being removed entirely; the `tierShimmer` keyframe above
        it is unreferenced dead CSS with zero runtime cost. (2) *No script blocks images* — images
        start at 145ms, scripts at 146ms; the preload scanner finds `<img>` tags during HTML parse
        and the Firebase tags are at end-of-body. (3) *No data fetches for a logged-out visitor* —
        zero XHR/fetch/beacon/WebSocket entries over a 6s observation window; both homepage
        listeners bail when there's no user, and the heavy `chat_threads` query (up to 50 docs) is
        hard-disabled at `index.html:520` (`HOME_CHAT_UNREAD_ENABLED = false`). (4) *Service worker
        is not intercepting* — `firebase-messaging-sw.js` is active and controlling the page but has
        no `fetch` handler and no Cache Storage use. (5) *CPU/JS parse is not a bottleneck* — at 4x
        CPU throttle with bytes cached, FCP 328ms and full load 426ms. (6) *Deferred Explore images
        work correctly* — all 24 Personal/Professional `<img>` remain 1px-GIF placeholders with the
        grids at height 0 until the shelf opens.
      - **Logged-in menu delay — diagnosed, NOT fixed, mitigation already exists.** Symptom: after
        logging in the user is redirected to the homepage and the menu shows visitor options for
        ~1–2s before swapping to logged-in options. **Cause:** `gisugo_menu_auth` is written at
        exactly ONE site — `index.html:812`, inside the homepage's own `onAuthStateChanged`. No login
        path writes it (`login.html:884` → `handleAuthRedirect` at `firebase-auth.js:2114` →
        `index.html`; also `firebase-auth.js:939` for the OAuth same-tab redirect, and
        `sign-up.js:517`/`:529` after signup). So a visitor session leaves the cache at `'false'`,
        and after a fresh login the homepage's optimistic render paints the **visitor** menu.
        Compounding it, that render sits inside the `DOMContentLoaded` handler at `index.html:780`,
        which waits on all 11 synchronous script tags (measured 1,786ms on 4G) — so the "instant
        menu render from cache" is not instant on mobile.
      - **Why it's deferred: the ⌛ mitigation already covers this exact case.** `verifyingBadge` is
        present in **both** branches of `updateHomeMenu` — logged-in at `index.html:977` and
        logged-out at `index.html:997` — so the user sees the spinning hourglass next to "Menu"
        telling them the state is unconfirmed, and it always resolves to the correct menu. The
        proposed fix would touch `handleAuthRedirect`, the single funnel for every login path which
        also decides home-vs-`sign-up.html` routing and already carries scar tissue from past
        wrong-routing incidents, plus a parallel change in `sign-up.js`. **Purely cosmetic payoff,
        highest-consequence function in the auth flow, days before launch → not worth it.**
      - **The proposed fix, if ever revisited (3 parts, in this order):** (1) write
        `localStorage.setItem('gisugo_menu_auth', 'true')` in `handleAuthRedirect` before it
        navigates — reachability verified, that one write covers both live login paths — plus the
        same at the `sign-up.js` home redirects. (2) Write `'false'` in `logoutUser` at
        `firebase-auth.js:1578`, next to the existing `gisugo_current_user` removal; today logout
        leaves it `'true'`, so the next homepage load briefly renders the logged-in menu (inverse of
        the same bug, also covered by the ⌛). (3) Optional latency half: hoist the cache render out
        of `DOMContentLoaded` into an inline script placed *before* the Firebase tags (~L434, after
        all body markup, so it cannot delay images — every `<img>` is above L433 and the script
        makes no network requests). `updateHomeMenu` (`index.html:941`) was verified safe to hoist:
        it only touches `firebase` in a `typeof`-guarded fallback at `:949-951` that the cache path
        (explicit `forcedState`) never reaches. **Note:** part 1 alone is the actual fix for the
        reported symptom; part 3 only moves a correct menu from ~1.8s to ~300ms.
      - **Two other things share that `DOMContentLoaded` gate** (relevant only if part 3 is ever
        done): `initializeCollapsibleCategorySections()` at `index.html:789`, so tapping "EXPLORE
        OTHER GIG CATEGORIES" does nothing until DCL (~1.8s on 4G — a silently failing tap users
        will repeat); and the `ios-safari` class at `index.html:785`, which gates the Explore-title
        wrapping fix. That CSS is scoped to `@media (min-width: 360px) and (max-width: 390px)`
        (`home.css:1631-1652`), so the late-applied class can reflow that title on iPhone 7/SE-width
        Safari **only** — not iPhones generally. The class check touches only `document.documentElement`
        and could move to an inline `<head>` script as a trivial standalone fix.
      - **Config gap noted, not acted on:** `firebase.json` has no `headers` block, so there is no
        long-lived `Cache-Control` on static assets. Irrelevant to the cleared-cache scenario that
        prompted this, but repeat visitors revalidate more than necessary. CSS/JS already carry `?v=`
        cache-busting, so they'd be safe to mark immutable for a year if this is ever tuned.
      - **Misleading comment to fix whenever this file is next touched:** `index.html:792` claims
        "Firebase stores the auth token in localStorage under this key." It does not — the app writes
        `gisugo_menu_auth` itself at `:812`. That wrong comment is plausibly why the login-side write
        was never added in the first place.

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
5. **Phase 12 — Track B lockdown** (launch gate). After remaining product phases, before
   full-platform QA. Functions + client first; keep old rules up; prove Apply/Hire/Accept;
   then lock rules. See `docs/NOTIFICATIONS_AND_APPLICATIONS_LOCKDOWN.md`. Do not mark
   V1 complete until this ships.
6. **Final cross-device / full-platform QA pass** + remaining Track E items (incl. iPad-mini
   header layout + legacy-iPhone data-loading stalls) **after Phase 12**, before release.
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
