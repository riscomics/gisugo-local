# Tiered Posting Quotas, Application Slots, G-Coins & Face Verification Lock — Tasklist

> Status: **Spec locked (2026-11-11) — Parked until native-to-web feature sync is complete. Do NOT start building until Peter says so.**

## 1. Locked 3-Tier Matrix

| Feature | Verified (FVV) | PRO Verified | BUSINESS Verified |
|---|---|---|---|
| **How to Unlock** | Free 1-Time Selfie Video (`verification.faceVerified`) | One-time GCash ID KYC (`verification.proVerified`) | Business KYC (`verification.businessVerified`) |
| **Free Active Gigs at a Time** | **2** at a time | **7** at a time | **15** at a time |
| **Free Gigs per Calendar Month** | **8** / month *(~2/wk)* | **28** / month *(~7/wk)* | **30** / month *(~1/day)* |
| **G-Coin Boosted Active Cap** | *Must upgrade to PRO first* | Up to **25** active at a time *(1 G-Coin per post above 7 active or 28/mo)* | Up to **50** active at a time *(1 G-Coin per post above 15 active or 30/mo)* |
| **Monthly Total with G-Coins** | — | Unlimited *(1 G-Coin / extra gig)* | Unlimited *(1 G-Coin / extra gig)* |
| **Worker Application Slots** | **10** at a time | **20** at a time | **20** at a time *(inherits PRO)* |

*(Admin / `GISUGO Operations` accounts bypass posting caps for platform seeding.)*

---

## 2. Counting & Exception Rules (Customer Posting)

- **What counts as an "Active Gig at a Time" (Concurrent Slot):**
  - A gig posted by the user whose `status` is in `['active', 'paused', 'hired', 'accepted']`.
  - As soon as a gig reaches `'completed'`, `'expired'`, `'suspended'`, or is **deleted**, that concurrent active slot opens right back up.
- **What counts toward the "Monthly Free Allowance" (`postsUsedThisMonth`):**
  - Creating a **brand-new gig** (`createJob` in `new-post2.js` / `firebase-db.js`).
  - **Relisting a Completed gig** (`new-post2.html?relist=...`, which creates a new gig document).
  - Deleting a gig frees up the *concurrent active slot*, but **does NOT refund** the monthly post count (prevents delete-and-repost spam/evasion).
- **What does NOT count toward the Monthly Free Allowance (0 posts used, 0 G-Coins):**
  - **Editing** an existing gig (`updateJob`).
  - **Void & Relist**, **Retract Offer**, or **Worker Resign** on an in-progress gig (reopens the *same* gig document after a worker backed out or no-showed).
- **When 1 G-Coin is Deducted (PRO & Business Only):**
  - When a `PRO` or `BUSINESS` user posts a new gig and they are **either**:
    1. Above their free concurrent active limit (`8–25` active for PRO; `16–50` active for Business), **OR**
    2. Above their free monthly allowance (`29+` in the current `YYYY-MM` month for PRO; `31+` for Business).
  - If a `PRO` or `BUSINESS` user has `0` G-Coins left, they never drop below their permanent free baseline (`7 active / 28 per month` for PRO; `15 active / 30 per month` for Business).

---

## 3. Build Chapters (Execute One at a Time When Assigned)

### [ ] Step 1 — Enforce Face Verification (`faceVerified == true`) on Write Paths & Firestore Rules
- **Web (`public/js/dynamic-job.js` & `public/js/firebase-db.js`):**
  - Gate **Report Gig** (`handleDynamicGigReportAction` / `submitGigReportToAdmin`) on `gisugoEnsureFaceIntro('report', ...)` + `verification.faceVerified === true` to match Native.
  - Add defense-in-depth `verification.faceVerified` checks inside `createJob()` and `applyForJob()`.
- **Firestore Rules (`firestore.rules`):**
  - Require `get(/databases/$(database)/documents/users/$(request.auth.uid)).data.verification.faceVerified == true` (or `isAdmin()`) on `jobs` `create`, `applications` `create`, and `gig_reports` `create` so console scripts/bots cannot bypass the UI gate.

### [ ] Step 2 — Tier-Aware Worker Application Slots (`10` for FVV → `20` for PRO / Business)
- Update `DEFAULT_APPLICATION_COINS_MAX` / `normalizeApplicationCoins(userProfile)` in `public/js/firebase-db.js` and `functions/index.js` (`recomputeAndWriteApplicationCoins`):
  - If `userProfile.verification?.proVerified || userProfile.verification?.businessVerified`, max application slots = **`20`** (otherwise **`10`**).
- When a user is upgraded to `proVerified` or `businessVerified`, bump their `applicationCoinsMax` to `20` and add `+10` to `applicationCoinsCurrent` (clamped to `20 - heldCount`).

### [ ] Step 3 — Customer Posting Quota Schema & Server/Client Enforcement
- **User document schema (`users/{uid}.postingQuota`):**
  - `monthKey`: `'YYYY-MM'` (in `Asia/Manila` timezone)
  - `monthlyPostsUsed`: `number` (resets to `0` when `monthKey` rolls over to a new month)
  - `gCoinsBalance`: `number` (existing or unified G-Coins balance field on `users/{uid}`)
- **Pre-post check in `new-post2.js` & `createJob()` (`firebase-db.js`):**
  - Count poster's current concurrent active gigs (`status` in `['active', 'paused', 'hired', 'accepted']`).
  - Evaluate against the poster's tier (`FVV`: `2 / 8`; `PRO`: `7 / 28`, max `25` with G-Coins; `BUSINESS`: `15 / 30`, max `50` with G-Coins; `Admin`: unlimited).
  - If within free limits → allow post (`0` G-Coins) and increment `monthlyPostsUsed`.
  - If PRO/Business exceeds free concurrent or monthly limit (but is under `25` / `50` hard ceiling) → prompt to confirm spending **1 G-Coin**, deduct 1 G-Coin, and increment `monthlyPostsUsed`.

### [ ] Step 4 — Upgrade / Quota Reached Modal & Admin Controls
- When an `FVV` user hits `2 active` or `8/month` (or when a `PRO`/`BUSINESS` user hits their limit with `0` G-Coins):
  - Show a clean **Posting Limit Reached / Upgrade Tier** modal explaining the `FVV (2/8)`, `PRO (7/28 + 20 app slots)`, and `BUSINESS (15/30 + up to 50 active)` tiers.
  - While automated GCash checkout is still in V2, provide a direct **Contact Support to Upgrade / Top Up G-Coins** button that opens a pre-tagged Support request, plus an Admin Dashboard User Management control to toggle `PRO Verified`, `Business Verified`, and adjust a user's `G-Coins` balance.

### [ ] Step 5 — Native App Parity Sync
- Provide the exact schema and helper spec prompt to the native build agent so `gisugo-native` enforces the identical `2/8`, `7/28 (25 max)`, `15/30 (50 max)`, and `10 vs 20` application slot rules.
