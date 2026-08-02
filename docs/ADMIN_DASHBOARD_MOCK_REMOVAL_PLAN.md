# Admin Dashboard / Messages — Mock Data Removal Plan

> Status: **Ready to execute — not started.** Written 2026-08-01.
> Goal: strip every piece of simulated/mock data out of `admin-dashboard.js` (and the
> small dead-comment cleanup in `messages.js`) BEFORE wiring any real Firestore data in,
> so there's no chance of a fake `setInterval` timer colliding with real data mid-wire.
> This is a pure removal pass — no Firestore wiring happens in this doc's scope.

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

- [ ] Delete comment block: lines **3–136** (old integration planning notes, 3 separate `/* */` blocks)
- [ ] Delete comment block: lines **3804–3979** (`COMPREHENSIVE MESSAGE SYSTEM FIREBASE INTEGRATION
      MAPPING` schema spec with fake thread examples)
- [ ] Delete comment block: lines **5049–6381** (`// const LEGACY_APPLICATIONS = [` + fake applicant
      dataset — Mario Santos, Ana Rodriguez, Miguel Torres, etc. — ~1,330 lines)
- [ ] Delete comment block: lines **6383–6443** (`// REMOVED:` tombstones + Firebase migration
      instructions comment)
- [ ] Delete comment block: lines **9182–10045** (mock admin messages, customer/worker fake arrays,
      ~860 lines)
- [ ] Cosmetic (optional, not required for correctness): rename the `mockThread` local variable inside
      the LIVE function `generateMessageThreadHTMLFromFirebase()` (~line 4623) to something like
      `threadForRenderer` — it holds real Firebase data, the name is just misleading now that the mock
      context around it is gone.
- [ ] **Verify:** reload `messages.html` logged in as a real account. Confirm alerts tab and chats tab
      both still load real data, no console errors, line numbers in any remaining code still make sense
      (re-check nearby line references after deletion shifts line numbers).

**Do NOT touch:** anything from line ~138 onward outside the blocks above — that's the live
Firebase system (`ACTIVE_LISTENERS`, `subscribeToUserThreads`, `subscribeToThreadMessages`,
`subscribeToUserNotifications`, `generateMessageThreadHTML`, `generateMessageHTML`,
`ensureSupportResponsesRealtimeStream`, `blockUserInFirebase`, chat modal send/receive, the two
legitimate localStorage keys `gisugo_gig_tips_ack_v1` and `gisugo_pending_notification_reads`).

---

## Part B — `admin-dashboard.js` (the real surgery — do in this exact order)

### Step 1 — Delete confirmed dead code (zero callers, zero risk)
- [ ] Delete `initializeMockData()` (lines **5755–5792**)
- [ ] Delete `generateInitialMockData()` (lines **5796–5894**)
- [ ] Delete `applyGrowth()` (lines **5898–5940**)
- [ ] Confirm via search that nothing else in the file calls any of these three names before deleting.

### Step 2 — Gig Moderation mock removal
- [ ] Delete `generateMockGigData()` (lines **3945–4308**)
- [ ] In `initializeGigModeration()` (starts line 3915), delete the call `generateMockGigData();`
      (line 3919). Keep every other line in that function as-is (`initializeGigTabs()`,
      `initializeGigSearch()`, `initializeGigActions()`, `initializeContactGigOverlay()`,
      `initializeConfirmationOverlays()`, `initializeGigDetailOverlay()`, `loadGigCards('posted')`).
- [ ] `allGigs = []` (line 3913) stays declared — it's now an empty cache array, ready for a future
      Firestore fill. `loadGigCards()` already just reads from it regardless of source.
- [ ] **Verify:** Gig Moderation tab loads with empty/zero state, no console errors, search/tabs/action
      buttons don't crash on an empty array.

### Step 3 — User Management mock removal
- [ ] Delete `generateMockUserData()` (lines **9585–9746**)
- [ ] In `initializeUserManagement()` (starts line 9552), delete the call `generateMockUserData();`
      (line 9556). Keep everything else in that function as-is.
- [ ] `allUsers = []` (line 9550) stays declared, same reasoning as Step 2.
- [ ] **Verify:** User Management tab loads empty, no console errors.

### Step 4 — User Chats hardcoded dataset (requires code changes, not pure deletion)
- [ ] Delete `const userChatsData = [...]` (lines **1380–1735** — 18 hardcoded fake conversations)
- [ ] Delete `initializeChatStates()` (lines **1742–1750** — reads from `userChatsData`)
- [ ] Delete `generateMockConversationMessages()` (lines **1113–1158**)
- [ ] In `generateConversationPreview()` (lines 1091–1111) / `showConversationDetail()` (~line 1082):
      remove the call into the now-deleted mock generator. Since there's no real chat-thread data
      source wired yet, make this render an honest "No conversation data yet" state rather than
      erroring — this is the one spot in this file that needs new (tiny) code, not just deletion.
- [ ] In `initializeUserChats()` (line 1753), remove the call to `initializeChatStates()` (line 1756).
      Keep `renderChatList()`, `initializeChatCategoryToggle()`, `initializeChatSearch()`,
      `updateChatCategoryCounts()` — but check each of these for a direct reference to the now-deleted
      `userChatsData` and make them tolerate an empty/undefined source (render empty state, count = 0)
      instead of throwing.
- [ ] **Verify:** User Chats panel opens to an empty state, no console errors, search/toggle don't crash.

### Step 5 — Admin Messages "Load More" pagination (requires a caller-side fix — do NOT skip)
- [ ] Delete `generateMockMessages()` (lines **2547–2573**)
- [ ] **Critical:** `loadMoreMessages()` (lines 2512–2545) still calls this function and is still wired
      to a live `#loadMoreMessagesBtn` click (`initializeMessagesPagination()`, line 2495). Deleting the
      generator WITHOUT fixing this caller leaves a button that throws on click. Either:
      (a) disable/hide the "Load More" button until real pagination exists, or
      (b) make `loadMoreMessages()` a no-op that shows "Nothing more to load" — pick (a), it's more honest.
- [ ] Keep `initializeMessagesPagination()`'s button-wiring shell and `updateMessagesStats()`.
- [ ] **Verify:** Admin Messages inbox loads, "Load More" button is hidden/disabled, no console errors,
      no click leads to a thrown error.

### Step 6 — Overview stat cards (biggest, most tangled — do last, own sub-steps)
This is the Overview page's entire simulation engine: 15 timers across 3 functions, all feeding the
same stat cards a future Firestore listener would update.

- [ ] Delete `startMainDashboardCounting()` in full (lines **6281–6664**) — this removes 8 of the 15
      timers (Total Users, Total Gigs, Storage, Bandwidth, Verifications, Revenue, Gigs Reported,
      Suspended Count) in one shot, since they're all defined inside this one function.
- [ ] Delete `updateStatCardsDisplay()` (lines **6168–6274**) — reads mock localStorage and calls
      `startMainDashboardCounting()`.
- [ ] Delete `loadMockDataFromStorage()` and `saveMockDataToStorage()` (read/write the 18
      `admin_mock_*` keys — see full key list below).
- [ ] Delete the 4 overlay-specific `populate*Data()` functions and their 4 timers, all inside
      `openStatOverlay()` (lines **6751–6835**):
      `populateUserActivityData()` (line 7453), `populateGigsAnalyticsData()` (line 7568),
      `populateStorageUsageData()` (line 7692), `populateTrafficCostsData()` (line 7797).
      The `openStatOverlay()`/`closeStatOverlay()` shell (open/close animation, click-to-open wiring)
      stays — only the mock-data-populating calls and their timers go.
- [ ] **`startCountingAnimation()` (lines 8048–8686) — DO NOT delete wholesale.** It's two things
      stitched together:
      - Phase 1 (the initial count-up-to-a-target-number animation) is genuinely reusable — keep this
        shape for when a real number loads and you want a nice animated count-up instead of an instant
        jump.
      - Phase 2 (the indefinite "keep incrementing forever after reaching target" loop, lines
        8447–8686-ish) is pure mock — real numbers don't self-increment client-side, they update via a
        fresh Firestore read/listener. Delete Phase 2; keep Phase 1 as a simplified one-shot
        count-to-value helper.
      - Delete `stopCountingAnimation()`'s Phase-2-specific cleanup once Phase 2 itself is gone; keep
        whatever's left needed to cancel an in-progress Phase 1 animation if an overlay closes early.
- [ ] In `initializeStatOverlays()` (lines 5664–5732): delete ONLY the line `updateStatCardsDisplay();`
      (line 5707). Keep everything else — the Firebase skeleton `if (typeof getAdminAnalytics ===
      'function' ...)` block (lines 5669–5705) and `attachStatCardListeners()`,
      `attachOverlayCloseListeners()`, `initializeExpandableSections()`, `initializeDropdownFilters()`
      (lines 5711–5731). The skeleton is intentionally left in place — implementing `getAdminAnalytics`
      and `isFirebaseOnline` there is the actual future wiring step, out of scope for this doc.
- [ ] Note for later (don't fix now, just don't get confused by it): `updateStatCardsFromFirebase()`
      (lines 5735–5744) has a pre-existing bug — it writes to `STORAGE_KEYS.verificationSubmissions`
      and `STORAGE_KEYS.reportedGigs`, neither of which exists in the `STORAGE_KEYS` object, so those
      two writes silently go to `undefined`. Since this whole localStorage bridge is being deleted in
      this pass anyway, don't spend time fixing it — it becomes moot.
- [ ] Delete the 18 `admin_mock_*` keys' plumbing entirely (full list in the localStorage section below).
- [ ] **Verify:** Overview page loads with stat cards at zero/empty (no fake numbers, no console
      errors), clicking any stat card still opens its overlay (now empty), closing works, no orphaned
      timers left running (check dev tools for lingering intervals after 30+ seconds on the page).

### Step 7 — Dev Tools cleanup
- [ ] Delete `initializeResetButton()` (lines **8750–8772**) and `window.resetAdminMockData` (lines
      **8775–8787**)
- [ ] In `admin-dashboard.html`: delete the `#resetMockDataBtn` element and its surrounding "Reset
      Analytics" markup, the `#devModeToggle` UI, and the whole `.dev-tools-zone` / "Development
      Tools" section (~lines 3847–3882 in the pre-surgery file — re-locate by searching for
      "Development Tools" since line numbers will have shifted by this point).
- [ ] Delete the inline `<script>` "Dev Mode Toggle Handler" block near the bottom of
      `admin-dashboard.html` (the one referencing `devModeToggle`, `devModeIcon`, `devModeStatus`,
      `firebaseIcon`, `firebaseStatus`) — it's wiring a UI control that no longer exists after the
      above deletion.
- [ ] Leave `app-config.js` as-is — `APP_CONFIG.devMode` is already a harmless retired no-op getter/
      setter; not worth touching in this pass.
- [ ] **Verify:** Settings page loads without the removed section, no console errors referencing
      missing `devModeToggle`/`resetMockDataBtn` elements.

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
- [ ] Hard-reload the full dashboard fresh (empty cache).
- [ ] Click through every section: Overview, Gig Moderation, User Management, Messages/Support,
      Settings, Ad Placement.
- [ ] Confirm: zero console errors, no button/handler calls a deleted function, every section shows an
      honest empty/zero state instead of a crash or a leftover fake number.
- [ ] Leave dashboard open ~60 seconds on Overview — confirm no numbers are still ticking up on their
      own (that would mean a timer wasn't fully removed).
- [ ] `node --check public/js/admin-dashboard.js` and `node --check public/js/messages.js` for syntax
      sanity before considering this done.

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
