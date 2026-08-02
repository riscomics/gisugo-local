# Admin Dashboard / Messages — Mock Data Removal Plan

> Status: **Complete.** Written 2026-08-01, finished 2026-08-02.
> Goal: strip every piece of simulated/mock data out of `admin-dashboard.js` (and the
> small dead-comment cleanup in `messages.js`) BEFORE wiring any real Firestore data in,
> so there's no chance of a fake `setInterval` timer colliding with real data mid-wire.
> This is a pure removal pass — no Firestore wiring happens in this doc's scope.
>
> **Post-plan findings, same session (2026-08-02):** two issues surfaced during manual
> verification that were outside this doc's original scope but blocked a clean sign-off,
> both now fixed — see "Post-plan fixes" section at the bottom.

## Rollback safety net (already in place)

- **Git tag:** `pre-mock-removal-2026-08-01` on commit `bb9dd39` — `git diff pre-mock-removal-2026-08-01` or
  `git checkout pre-mock-removal-2026-08-01 -- <file>` to fully revert any file to its pre-surgery state.
- **Local file snapshots** (gitignored, never pushed): `backups/pre-mock-removal-2026-08-01/`
  contains untouched copies of `admin-dashboard.js`, `admin-dashboard.html`, `messages.js`, `app-config.js`.
- Before starting, confirm working tree is clean (`git status`) so any new dirt is only from this work.

## How to resume this cold (new session, no prior context)

1. Read this doc top to bottom — it has every line number needed, no need to re-run investigation.
2. Work through Part A, then Part B step-by-step, in order (later steps depend on earlier ones being clean).
3. After EACH step: reload `admin-dashboard.html` (or `messages.html` for Part A), click through the
   affected section, confirm no console errors and no button/handler references a deleted function.
4. Check off the step below before moving to the next one.

---

## Part A — `messages.js` (low risk, ~20 min)

All mock data here is already dead/commented-out text with zero runtime effect. Confirmed no live
`if/else` mock-vs-real branching exists — separation is 100% via comments, so this is pure deletion.

- [x] Delete comment block: lines **3–136** (old integration planning notes, 3 separate `/* */` blocks)
      — DONE 2026-08-02.
- [x] Delete comment block: lines **3804–3979** (`COMPREHENSIVE MESSAGE SYSTEM FIREBASE INTEGRATION
      MAPPING` schema spec with fake thread examples) — DONE 2026-08-02.
- [x] Delete comment block: lines **5049–6381** (`// const LEGACY_APPLICATIONS = [` + fake applicant
      dataset — Mario Santos, Ana Rodriguez, Miguel Torres, etc. — ~1,330 lines) — DONE 2026-08-02
      (turned out contiguous with the next block, deleted together as lines 4736–6130).
- [x] Delete comment block: lines **6383–6443** (`// REMOVED:` tombstones + Firebase migration
      instructions comment) — DONE 2026-08-02 (see note above, deleted with LEGACY_APPLICATIONS).
- [x] Delete comment block: lines **9182–10045** (mock admin messages, customer/worker fake arrays,
      ~860 lines) — DONE 2026-08-02 (found at shifted lines 7472–8337 after earlier deletions).
- [x] Cosmetic: renamed the `mockThread` local variable inside the LIVE function
      `generateMessageThreadHTMLFromFirebase()` to `threadForRenderer` — DONE 2026-08-02.
- [ ] **Verify:** reload `messages.html` logged in as a real account. Confirm alerts tab and chats tab
      both still load real data, no console errors. `node --check` passed 2026-08-02; **manual
      logged-in click-through still pending (needs a human tester on a real account).**

**Result:** `messages.js` went from ~11,577 lines to 9,002 lines. Syntax-checked clean
(`node --check public/js/messages.js` → exit 0).

**Do NOT touch:** anything from line ~138 onward outside the blocks above — that's the live
Firebase system (`ACTIVE_LISTENERS`, `subscribeToUserThreads`, `subscribeToThreadMessages`,
`subscribeToUserNotifications`, `generateMessageThreadHTML`, `generateMessageHTML`,
`ensureSupportResponsesRealtimeStream`, `blockUserInFirebase`, chat modal send/receive, the two
legitimate localStorage keys `gisugo_gig_tips_ack_v1` and `gisugo_pending_notification_reads`).

---

## Part B — `admin-dashboard.js` (the real surgery — do in this exact order)

### Step 1 — Delete confirmed dead code (zero callers, zero risk) — DONE 2026-08-02
- [x] Delete `initializeMockData()`, `generateInitialMockData()`, `applyGrowth()` — confirmed zero
      external callers before deleting (only called each other).
- [x] Bonus find during execution: `roundToValidIncrement()` right after them was also dead (zero
      callers anywhere) and part of the same mock-revenue cluster — deleted too, wasn't in the
      original plan text but flagged and removed since it was unambiguously dead code.

### Step 2 — Gig Moderation mock removal — DONE 2026-08-02
- [x] Deleted `generateMockGigData()` and its call site in `initializeGigModeration()`.
- [x] `allGigs = []` stays declared. Confirmed `loadGigCards()`'s `filter`/`map`/`join` chain degrades
      safely to an empty result with no crash.

### Step 3 — User Management mock removal — DONE 2026-08-02
- [x] Deleted `generateMockUserData()` and its call site in `initializeUserManagement()`.
- [x] `allUsers = []` stays declared. Confirmed `loadUserCards()` degrades safely the same way.

### Step 4 — User Chats hardcoded dataset — DONE 2026-08-02 (safer approach than originally planned)
- [x] **Plan deviation, on purpose:** investigation found `userChatsData` has **12** reference sites
      across the file (renderChatList, selectChat, toggleChatFlag, ignoreChat, toggleChatLock,
      unlockChat, updateChatCategoryCounts, performChatSearch, initializeChatStates, etc.) — far more
      than the original plan anticipated touching individually. Rather than deleting the array and
      chasing down every caller, replaced the ~356-line hardcoded fake dataset with a plain
      `const userChatsData = [];`. Every consumer already used `.filter()`/`.forEach()`/`.find()`,
      which all degrade safely to empty/no-op on an empty array — zero of those functions needed to
      be touched or rewritten. Much lower risk than the original per-function rewrite plan.
- [x] Deleted `generateMockConversationMessages()` (fabricated fake chat dialogue based on job title
      keywords) and rewrote `generateConversationPreview()` to show an honest "Conversation preview
      not available yet" message instead of inventing dialogue that never happened.
- [x] Left `initializeChatStates()`, `initializeUserChats()`, `renderChatList()`,
      `updateChatCategoryCounts()` etc. completely untouched — verified each is safe on an empty array.
- [ ] **Verify:** User Chats panel opens to an empty state, no console errors, search/toggle don't crash
      — still needs a manual click-through.

### Step 5 — Admin Messages "Load More" pagination — DONE 2026-08-02
- [x] Deleted `generateMockMessages()` and `loadMoreMessages()` (the latter existed only to wrap the
      former plus a fake network delay).
- [x] `initializeMessagesPagination()` now unconditionally hides `#loadMoreMessagesBtn` instead of
      wiring it to a click handler — honest "not implemented yet" instead of a button that would throw.
- [x] `updateMessagesStats()` no longer reports a fabricated `156` total — now counts the actual
      `.customer-message-item` elements present in the DOM and shows "Showing N messages".
- [ ] **Verify:** Admin Messages inbox loads, "Load More" button is hidden, no console errors — still
      needs a manual click-through.

### Step 6 — Overview stat cards (biggest, most tangled — do last, own sub-steps) — DONE 2026-08-02
This is the Overview page's entire simulation engine: 15 timers across 3 functions, all feeding the
same stat cards a future Firestore listener would update.

- [x] Deleted `startMainDashboardCounting()`, `updateStatCardsDisplay()`, `saveMockDataToStorage()`,
      `loadMockDataFromStorage()` in one block (all four were tangled together).
- [x] Deleted the 8 `populate*Data()` functions (`populateTotalUsersData`, `populateVerificationsData`,
      `populateRevenueData`, `populateGigsReportedData`, `populateUserActivityData`,
      `populateGigsAnalyticsData`, `populateStorageUsageData`, `populateTrafficCostsData`) plus their
      `generateDistribution()`/`generateWeightedDistribution()` helpers.
- [x] Rewrote `openStatOverlay()`/`closeStatOverlay()` to drop all mock timer logic — shell (open/close
      animation, click-to-open wiring) stays, populate calls and their timers are gone.
- [x] **`startCountingAnimation()`/`stopCountingAnimation()` — deleted in full** (plan deviation: the
      "keep Phase 1, delete Phase 2" split turned out to be more tangled in practice than worth
      preserving; a clean one-shot count-up helper is simple to write fresh when real data lands).
- [x] Removed the `updateStatCardsDisplay();` call from `initializeStatOverlays()` (function itself
      was already deleted above, so this was just cleaning up the now-dangling call site).
- [x] Fixed `updateStatCardsFromFirebase()` — replaced the `STORAGE_KEYS`/`localStorage.setItem` bridge
      (including the two silently-broken writes noted below) with direct DOM writes to
      `#totalUsersNumber`, `#verificationsNumber`, `#revenueNumber`, `#gigsReportedNumber`. This also
      overwrites the hardcoded HTML placeholder values (85 / 12 / ₱10,000 / 18) once real analytics
      data is available.
- [x] Deleted the entire `STORAGE_KEYS` constant and all 18 `admin_mock_*` keys' plumbing, plus the
      time-based simulation helpers (`getSimulationStartTime`, `getElapsedRealSeconds`,
      `getSimulatedDate`, `addRevenueToHistory`, `getRevenueHistory`, `getRevenueForPeriod`).
- [x] **Verify (2026-08-02):** Overview page loaded, all 8 stat overlays opened/closed (Total Users,
      Verifications, Revenue, Gigs Reported, User Activity, Gigs Analytics, Storage Usage, Traffic
      Costs) plus their breakdown toggles — clean console, no errors, no leftover mock numbers. Total
      Users card confirmed showing a real live count (3), matching the actual `users` collection —
      see "Post-plan fixes" below. Not explicitly re-checked: leaving the page idle 30+ seconds to
      watch for a lingering interval timer (no evidence of one in the console, but not a dedicated test).

### Step 7 — Dev Tools cleanup — DONE 2026-08-02
- [x] Deleted `initializeResetButton()` and `window.resetAdminMockData` from `admin-dashboard.js`
      (plus the `initializeResetButton();` call site).
- [x] In `admin-dashboard.html`: deleted the `#resetMockDataBtn` element, the `#devModeToggle` UI, and
      the whole `.dev-tools-zone` / "Development Tools" section.
- [x] Deleted the inline `<script>` "Dev Mode Toggle Handler" block near the bottom of
      `admin-dashboard.html` (referenced `devModeToggle`, `devModeIcon`, `devModeStatus`,
      `firebaseIcon`, `firebaseStatus` — all now gone).
- [x] Left `app-config.js` as-is per plan — `APP_CONFIG.devMode` is a harmless retired no-op.
- [x] Confirmed zero remaining references to `devModeToggle`, `resetMockDataBtn`, `dev-tools-zone`,
      `devModeIcon`, `firebaseIcon` anywhere in `.html`/`.js` files.
- [ ] **Verify:** Settings page loads without the removed section, no console errors — still needs a
      manual click-through.

### Step 8 — Explicitly NOT touched in this pass (real config, not mock — flag only)
These localStorage keys hold real operational settings and must keep working exactly as they do today.
Migrating them to Firestore is a separate future task, out of scope here:
- `gisugo_admin_settings` (Settings panel — commission rate, feature toggles, payout config, etc.)
- `techWarningData` (Settings — technical warning banner composer)
- `maintenanceData` (Settings — maintenance mode scheduler)
- `gisugo_admin_ad_settings_v1` (Ad Placement panel config)
- `gisugo_admin_ad_panel_collapse_v1` (Ad Placement — UI accordion state, cosmetic)
- `sidebarCollapsed` (sidebar UI preference, cosmetic)

### Step 9 — Final verification pass
- [x] Hard-reload the full dashboard fresh — done 2026-08-02, console log reviewed line-by-line.
- [x] Click through: Overview (all 8 overlays + breakdowns). **Still pending, not yet manually
      click-tested this pass:** Gig Moderation, User Management, Messages/Support, Settings, Ad
      Placement — page-load initialization for all of these logged clean with no errors, but that's
      not the same as clicking their buttons/tabs/search.
- [x] Confirm: zero console errors on load, no button/handler calls a deleted function (verified via
      the `resetAdminMockData()` console-command reference, which WAS still dangling and has now been
      removed — see "Post-plan fixes"). Overview shows honest zero/real values, no leftover fake numbers.
- [ ] Leave dashboard open ~60 seconds on Overview — confirm no numbers are still ticking up on their
      own. Not explicitly done as a dedicated timed test, but no ticking was reported and no timer-driven
      code remains after Step 6's deletions.
- [x] `node --check public/js/admin-dashboard.js` and `node --check public/js/messages.js` — both pass,
      re-verified 2026-08-02 after the post-plan fixes below.

---

## Full reference: all 18 `admin_mock_*` localStorage keys (Step 6)

`STORAGE_KEYS` constant, lines ~5507–5527: `admin_mock_total_users`, `admin_mock_verifications`,
`admin_mock_alltime_revenue`, `admin_mock_sim_start`, `admin_mock_revenue_history`,
`admin_mock_gigs_reported`, `admin_mock_android_users`, `admin_mock_iphone_users`,
`admin_mock_total_gigs`, `admin_mock_total_applicants`, `admin_mock_storage_used`,
`admin_mock_bandwidth_mtd`, `admin_mock_firebase_cost_mtd`, `admin_mock_last_update`,
`admin_mock_mobile_percent`, `admin_mock_android_percent`, `admin_mock_repeat_percent`,
`admin_mock_bounce_rate`. Plus one orphaned legacy inline key `admin_mock_revenue` (not in the
`STORAGE_KEYS` object, pre-refactor remnant, already effectively dead).

All 18 are read/written exclusively by the functions being deleted in Step 6
(`saveMockDataToStorage`, `loadMockDataFromStorage`, `generateInitialMockData`, `applyGrowth`,
`updateStatCardsFromFirebase`'s bridge writes) — safe to delete in full alongside those functions.

---

## Post-plan fixes (2026-08-02, same day, after the plan above was executed)

Two problems surfaced during manual verification that were outside this plan's original scope
(neither is "mock data"), both now fixed:

### Fix 1 — Encoding corruption in `admin-dashboard.js`
Several rounds of PowerShell `Get-Content`/`Set-Content` file edits during Steps 1–7 above
(Windows PowerShell's default console/file encoding, not UTF-8-safe) corrupted 259 lines —
almost entirely `console.log(...)` strings and comments containing emoji — into mojibake
(e.g. `ÃƒÆ'Ã¢â‚¬â€ ...` instead of `✅`). Purely cosmetic (never affected functionality or logic),
but showed up as "weird alien language" in the browser console.
- Fixed by diffing every corrupted line against the clean `pre-mock-removal-2026-08-01` git tag
  (250 lines auto-matched by content skeleton, 9 ambiguous ones resolved by reading surrounding
  code context) and rewriting the file via Node.js `fs` (not PowerShell) to avoid repeating the
  same class of bug.
- Verified: 0 remaining mojibake matches, `node --check` passes, real line count unchanged (7830).

### Fix 2 — Hardcoded mock numbers baked into `admin-dashboard.html`
The Step 6 removal deleted the JS functions that *used to populate* the stat overlays and the
Overview preview cards, but the HTML itself still had the old mock values hardcoded as static
element content (e.g. `id="userActivityMobileCount">1,245<`) — since nothing populated them, they
displayed as permanently frozen fake numbers instead of the intended zero/empty state.
- Zeroed ~150 values across all 8 stat overlays, the 4 top-of-page stat cards, and the 4 Overview
  preview cards (User Activity, Gigs Analytics, Storage Usage, Traffic & Costs) — `0`, `0%`, `₱0`,
  `$0.00`, `0 GB` etc. matching each field's format, per instruction to use `0` rather than `—`.
  Static category/context labels (e.g. "6AM-12PM" time buckets, "of 500 GB plan") were left as-is
  since they aren't data points.
- Also removed one dangling console-command message that referenced the deleted
  `resetAdminMockData()` function.

### Fix 3 — `getAdminAnalytics()` silently failing in `firebase-db.js`
Not mock data — this was pre-existing, already-wired code (predates this whole removal pass) that
queries real Firestore collections for the Overview stat cards. It queried `verification_requests`
and `transactions`, neither of which has a security-rules entry (both fall through to the
default-deny rule), so those two reads were always permission-denied. Because all four reads were
bundled in one `Promise.all`, that failure zeroed out the two reads that would have actually
succeeded (`users`, `jobs` — both have `allow read: if true`).
- Fixed: dropped the two doomed queries entirely (matching the earlier, already-agreed decision to
  hide Verifications and Revenue in v1 — no verification-review pipeline or payments system exists
  yet). `totalUsers` and `reportedGigs` now fetch via `Promise.allSettled` so they resolve
  independently of each other.
- Verified live: Total Users card now shows a real count (3) matching the actual `users` collection.
- **Known follow-up, not done here (separate, pre-existing task):** the Verifications and Revenue
  stat cards are still visibly present in the HTML — the earlier decision to hide them (2026-07-27
  discussion) was apparently never implemented at the HTML/CSS level. Flagging so it isn't lost;
  not fixed in this pass since it wasn't part of what broke or what was asked.
- **Known follow-up, noted by user 2026-08-02:** the Total Users stat *card* on Overview now shows
  the real count (3), but clicking into its overlay ("Total Users Analytics") still shows 0 — the
  overlay's breakdown sections (age groups, regional distribution, account types, growth rate, etc.)
  have no backing data source yet, only the top-level card was wired in Fix 3 above. Expected to be
  resolved as part of the full Total Users overlay wiring, not a new bug.
