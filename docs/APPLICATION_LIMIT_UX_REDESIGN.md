# Application Limit — UX Redesign (Design Spec)

> Status: **SHIPPED** — Phases A–D built + deployed (slot/allowance UX live). Phase E verify was
> ongoing at write time; treat as done unless a regression is found.
> Last updated: 2026-07-17 (status sync; original design write-up 2026-06-23)
> **Agent rule:** "BUILT/DEPLOYED/SIGNED OFF" claims here must be cross-checked against live
> code (`?v=` bumps), production Firestore slot/coin fields, and user-visible behavior — not
> repeated from this doc alone. See `AGENTS.md` § "verify production data."
> Goal: replace the "token/coin currency" framing with a plain **"Applications Remaining"**
> allowance, delivered at the decision moment, so the `my-applications` page is no longer
> *needed* (kept only as an afterthought to withdraw/free an application). No money/currency/
> gamification wording — MVP launches as a Publishing Model; monetization is post-MVP.
>
> **Revision 2026-06-23 3:14 PM — explainer removed, merged into Confirm:** dropped the separate
> "HOW APPLYING WORKS" overlay (and its localStorage first-time flag — it was per-browser, not
> tied to real account history, so unreliable). Its content is now folded into the **Confirm**
> modal, which gained: English/Bisaya/Tagalog language tabs (reusing the My Applications tab
> styling) and a short line linking the **My Applications** page for withdrawing/freeing a slot.
> One screen now does the explaining + the commit decision.

---

## 1. Finalized decisions
- **Terminology:** "Applications Remaining" (e.g., **"Applications Remaining: 8 / 10"**). No
  "token", "coin", "G", or currency visuals anywhere in this flow.
- **Flow order:** **confirm intent first (with count), THEN compose the message.** Don't let a
  worker write a message and then bail — surface the commitment decision before any effort.
- **First-time explainer:** one-time overlay on the first-ever Apply click, explaining the
  allowance. After that, a lightweight **confirmation overlay still shows every time** with the
  remaining count (isolated from the compose step).
- **Cap = 10**, but must become an **Admin Dashboard config value** (per-worker max), not
  hardcoded. (Logged into Admin Dashboard scope.)
- **Dead-end prevention:** at 0 remaining, intercept and let them free one inline (no forced
  trip to `my-applications`).

## 2. The mental model (accurate to the code)
A slot is occupied from apply → offered → hired → working, and frees ONLY at a terminal
outcome: `gig_completed`, `rejected`, `not_selected_after_hire`, `rejected_by_worker`,
`voided_by_customer`, `resigned_by_worker`, `withdrawn`, `job_deleted`. So it's "how many gigs
you can be committed to at once," which reinforces "apply only where you're truly available."

## 3. Redesigned flow

Tap **APPLY TO GIG** → check remaining count (use already-loaded value; see efficiency §5):

- **0 remaining → Capacity overlay (intercept):**
  > "You've reached your limit of 10 active applications. An application frees up when a gig
  > finishes or doesn't work out. To apply here, cancel one you no longer need:" + inline list of
  > active applications, each with **Cancel**. (Reuses `my-applications` data/logic.)

- **≥1 remaining → three beats:**
  1. **(First time only) Explainer overlay** — "How applying works": up to 10 active
     applications at once; each stays active until the gig finishes or doesn't work out; apply
     only where you're genuinely available. **[Got it]** (persist a one-time flag).
  2. **Confirm overlay (every time)** — the isolated commitment beat:
     > "Submit an application to **[Gig Title]**? You have **8 of 10** applications remaining.
     > This uses 1 — it comes back if you're not chosen, you cancel, or the gig finishes."
     > **[Continue →]   [Cancel]**
  3. **Compose overlay** — message + optional counter-offer ONLY (current "WRITE MESSAGE"
     overlay minus the count box). CTA: **[Submit Application]**.

## 4. Copy to change (ALL THREE LANGUAGES: English, Cebuano, Tagalog)
`my-applications.js` holds trilingual strings (~lines 11–143) that say "token(s)". Every one
must be reworded to "application(s)". Examples:
- "This application token has been returned." → "This application has been returned to you."
- "You get 10 FREE Tokens always." → "You always have 10 applications."
- "Tokens return if application is cancelled/closed." → "Applications come back when cancelled or closed."
- Apply caption (`dynamic-job.js` `renderApplyTokenCaption`): drop "Each time you Apply costs 1
  Token." → "Applying uses 1 of your applications; it comes back if you're not chosen."

## 5. Efficiency plan (required)
**Good news — already efficient at the data layer:** the remaining count is a **denormalized
field** on the user doc (`applicationCoinsCurrent` / `applicationCoinsMax`). Showing it is ~1
read, NOT a live tally of all applications. `my-applications.js` also already caches it
client-side (`readCachedCoinStatus`).

**The one cost watch-out:** on iOS/WebKit, `ensureApplicationCoinsForUser()` runs a heavy
*reconciliation* (fetches up to 200 of the worker's applications + a job read per held one) to
self-heal the counter. That is expensive and must NOT be repeated per overlay.

**Rules for the new flow (no read/write multiplication):**
- Fetch the remaining count **once** per apply attempt (the value already loaded when the gig
  page opened via `refreshApplyCoinStatus`) and **reuse it** across confirm → compose. Do NOT
  call `getUserApplicationCoinStatus` again on each overlay.
- Submit path is **unchanged**: 1 counter write (consume) + 1 application create. No new writes.
- Capacity (0) overlay's active-application list is a query that runs **only when at 0** (rare);
  reuse the `my-applications` fetch + its existing cache.
- Net vs today: **0 extra reads/writes** for the added overlays.

## 6. Removal / rework audit (do this BEFORE building new UI)

**REMOVE / REPLACE (user-facing currency presentation):**
- `dynamic-job.html` ~205–242: the apply overlay's coin box — `apply-coin-status` /
  `apply-coin-value` ("10 / 10"), the "G" coin icon, gold styling. Re-label to "Applications
  Remaining"; move the count OUT of the compose overlay into the new confirm overlay.
- `dynamic-job.js` `renderApplyTokenCaption()` + the "costs 1 Token" / "low on tokens" /
  "NO TOKENS AVAILABLE" / "CHECKING TOKENS" / "TOKEN CHECK FAILED" button strings.
- `my-applications.html` ~33–48: `coin-status-strip` + coin visual (`coin-status-coin`,
  `coin-status-letter` "G", "TOKENS REMAINING"). Re-label to "Applications Remaining" and
  remove the coin disc from the live header (see PRESERVE note below — do NOT just delete it).
- `my-applications.js` ~11–143: all trilingual "token" copy (see §4).
- CSS: `apply-coin-*` rules — de-gamify (remove coin/gold visuals).

**PRESERVE — do NOT delete (owner request, 2026-06-20): the G-coin spin animation.**
The My Applications header has a hand-tuned 3D spinning gold coin that took real effort to get
right and should be kept for future use (post-MVP monetization / G-Coins reintroduction). It
lives in `public/css/my-applications.css` (~lines 99–195):
- `.coin-status-float` (44px stage), `.coin-status-coin` (gold gradient disc + 2px ring +
  inset highlight), `.coin-status-coin::before` (specular glint), `.coin-status-letter` ("G").
- `@keyframes coinSpin` — `rotateY(0deg → 360deg)`, applied as `coinSpin 4s linear infinite`.
- `@keyframes coinCountLoadingSpin` (the ⏳ loading state) + the 600px mobile sizing block.
Plan: when removing the coin from the live `my-applications` header, **move this CSS block
verbatim into `docs/preserved-ui/` (or an archive section) with a comment**, rather than
deleting it from git history. Keep the markup snippet too so it can be dropped back in later.
The new "Applications Remaining" header uses plain text only (no coin) for MVP.

**KEEP (backend mechanics — this IS the limit system; only the presentation changes):**
- Fields: `applicationCoinsCurrent` / `applicationCoinsMax` (user doc), `coinHeld` /
  `coinReleasedAt` (application). **Do NOT rename Firestore fields** — that's a risky migration
  for zero user benefit. Internal "coin" naming stays; only what users SEE changes.
- Functions: `ensureApplicationCoinsForUser`, `getUserApplicationCoinStatus`,
  `normalizeApplicationCoins`, `isApplicationHoldingCoin`, `releaseApplicationCoin*`, the coin
  cache helpers. (Optional later: rename for clarity — not now.)

**RESTRUCTURE:**
- Split the single "WRITE MESSAGE TO CUSTOMER" overlay (`dynamic-job.html`) into:
  confirm-overlay (new) → compose-overlay (existing, minus count). Add first-time explainer +
  capacity (0) overlay.

**DO NOT TOUCH (separate system):**
- The G-Coins / wallet UI retained for post-MVP reference (per Track E). Verify the apply box's
  "G" coin visual is NOT shared with the wallet component before deleting styles; if shared,
  fork a de-gamified style for the application flow only.

## 7. Admin Dashboard dependency
- Per-worker **max applications** (currently `DEFAULT_APPLICATION_COINS_MAX = 10`) must be an
  admin-configurable setting. Add to Admin Dashboard scope/build.

---

## 8. Micro-tasklist (execute in order — start here tomorrow)

> Each step is small and independently verifiable. Deploy hosting after the UI is in place
> (Phase D). Do NOT start until the build gate below is cleared.

**Phase A — Preserve before removing (no behavior change)  ✅ DONE 2026-06-22 3:30 PM**
- [x] A1. Created `docs/preserved-ui/coin-spin-animation.md` with the full coin-status CSS block
      (`my-applications.css` ~5–204: strip, value, suffix, caption, `.coin-status-float`,
      `.coin-status-coin` + `::before`, `.coin-status-letter`, 600px block, `@keyframes coinSpin`,
      `@keyframes coinCountLoadingSpin`) + the `my-applications.html` ~33–48 markup, with reuse notes.
- [x] A2. Verified scope of coin styles — **safe to de-gamify the application flow without
      touching the wallet:**
      • `apply-coin-*` (apply overlay) lives only in `dynamic-job.html` / `dynamic-job.js` /
        `jobpage.css`. Not in any wallet file.
      • `coin-status-*` (My Applications header) lives only in `my-applications.html` /
        `my-applications.css`.
      • The G-Coins **wallet** coin is independent — its own `@keyframes coinSpin` in
        `profile.css` (~1375/1416). Same keyframe name in two files but page-scoped; removing the
        application-flow copies will NOT affect the wallet coin.

**Phase B — Copy rework (trilingual: EN / Cebuano / Tagalog)  ✅ DONE 2026-06-22 3:40 PM**
- [x] B1. `my-applications.js` — reworded all token→application copy in all 3 languages:
      `MY_APP_CAPTIONS` (rejected_by_worker/voided/resigned/withdrawn), the Active/Closed/Withdrawn
      tab-intro bullets, the withdraw `confirm()`, and both low-count strip captions
      ("Few applications remaining. Withdraw a pending one to free it up."). Keys/structure
      unchanged. Verified zero remaining "token" strings in the file.
- [x] B2. `dynamic-job.js` — reworded user-facing apply copy + button states: caption now
      "Applying uses 1 of your applications; it comes back if you are not chosen."; low text →
      "You are low on applications remaining."; buttons → "NO APPLICATIONS REMAINING" /
      "CHECKING APPLICATIONS..." / "APPLICATION CHECK FAILED — RETRY" (retry guard string updated
      to match); self-apply blocked alert → "You have no applications remaining right now."
      Left untouched (not user-facing): render-guard `ACTIVE_JOB_LOAD_TOKEN`/`loadToken`, the
      internal `renderApplyTokenCaption` name, and dev `console.warn` logs.
- Lint clean on both files. NOT deployed yet — holding hosting deploy until Phase C re-labels the
  header ("TOKENS REMAINING" + coin still live in HTML), so the live site stays consistent (per D5).

**Phase C — New overlays + header (UI)  ✅ DONE 2026-06-22 4:30 PM**
- [x] C1. `my-applications.html`/`.css`: header now "APPLICATIONS REMAINING", coin disc removed
      from live markup (preserved in A1), value recolored gold→sky-blue (`#7dd3fc`).
- [~] C2. **Adjusted, not fully removed (intentional):** de-coined the compose box in
      `dynamic-job.html` (removed the gold coin disc, relabeled "Token Remaining" →
      "Applications Remaining", reworded static caption) but KEPT the `applyCoinStatus` /
      `applyCoinValue` / `applyCoinCaption` element IDs so the existing submit-gating still works
      and nothing breaks between phases. Full removal/relocation of the count box into the Confirm
      overlay happens in **Phase D** (the flow-rewire step) to avoid breaking the zero-gating.
- [x] C3. Confirm overlay added — `#applyConfirmOverlay` (title, `#applyConfirmCountValue`
      "X of Y", commitment note, Continue/Cancel).
- [~] C4. Explainer overlay — **REMOVED 2026-06-23** (see top revision note). The standalone
      "HOW APPLYING WORKS" screen + its localStorage flag were dropped; the Confirm modal now
      carries the explanation (trilingual) + a My Applications withdraw link instead.
- [x] C5. Capacity (0) overlay added — `#applyCapacityOverlay` with `#applyCapacityList` for the
      inline active-applications + Cancel rows (populated/wired in Phase D).
- Also reworded the two leftover currency strings (intro coin-banner in `my-applications.js`,
  static compose caption) and the post-send tip ("Apply to multiple gigs…" → "You'll get this
  application back if you're not chosen.").
- All 3 overlays reuse the existing `.application-sent-overlay`/`.application-sent-modal` shell
  (hidden until `.show`), so they're purely additive — current apply flow is unchanged. New
  content classes (`.apply-flow-*`) added to `jobpage.css`. Lint clean. NOT deployed (Phase D).

**Phase D — Wiring + efficiency (the careful part)  ✅ BUILT 2026-06-22 4:55 PM (deploy pending local check)**
- [x] D1. `dynamic-job.js`: APPLY tap now calls `beginApplyFlow()` which fetches the count
      ONCE (`fetchApplyCoinStatus`) then branches: 0 → Capacity overlay; first-time → Explainer
      → Confirm; otherwise → Confirm. Confirm "Continue" → Compose.
- [x] D2. Count is fetched once per attempt, cached in `lastApplyCoinStatus`, and reused across
      Explainer → Confirm → Compose with **no re-reads** (`refreshApplyCoinStatus` split into
      `fetchApplyCoinStatus` + `paintApplyCoinStatus`; compose paints from the cached value).
- [x] D3. Submit path unchanged (still `handleJobApplication` → consume 1 + create app). Each
      fresh APPLY tap re-fetches, so the count is never stale across attempts.
- [x] D4. Capacity overlay lists pending applications (`getWorkerApplications` statuses:[pending]);
      Cancel → `withdrawWorkerApplication` (releases the slot) → one re-read → advances to Confirm.
- [x] D5. Deployed to hosting 2026-06-23 3:30 PM. Bumped `dynamic-job.js`→v53,
      `firebase-db.js`→v50 + v41, `jobpage.css`→v40, `my-applications.css`→v2,
      `my-applications.js`→v2. Live at https://gisugo1.web.app.
- Also reworded the last server-side string (`firebase-db.js` apply guard: "no G tokens" →
  "no applications remaining"). Lint clean across dynamic-job.js / firebase-db.js / jobpage.css.

**Confirm-modal consolidation  ✅ 2026-06-23 3:30 PM**
- Removed the separate "HOW APPLYING WORKS" explainer overlay; its content is merged into the
  Confirm modal, which now carries the 3-language tabs (English/Bisaya/Tagalog) styled to match
  My Applications.
- Per owner: dropped the "APPLY TO THIS GIG?" title and the "Need to free one up?" lead-in to keep
  the copy short. Confirm now shows: count → "This uses 1 application… comes back…" → withdraw line
  linking to **My Applications**.

**Compose-box de-dupe  ✅ 2026-06-23 3:35 PM (deployed, dynamic-job.js→v54)**
- Removed the redundant "Applications Remaining N/10" banner + explainer captions from the
  WRITE MESSAGE compose modal — that info now lives in the Confirm overlay shown right before it.
- Kept the submit-button safety gate: `paintApplyCoinStatus` still disables APPLY at 0 remaining
  and shows the failed-check retry. Removed the now-unused `renderApplyTokenCaption` helper.

**Overlay positioning fix  ✅ 2026-06-23 3:40 PM (deployed, jobpage.css→v41)**
- The Confirm/Capacity overlays reused the centered `.application-sent-*` success shell (no
  max-height, `overflow:hidden`), so tall content was cut off at the bottom on phones.
- Added `.apply-flow-overlay` / `.apply-flow-modal` overrides that mirror the compose
  `.apply-job-*` modal: top-aligned, `padding-top:100px` (base) / `60px` (≤600px), `max-height:70vh`
  with internal scroll. Smaller breakpoints (400/375/320) inherit the 60px rule, matching how the
  compose modal already behaves across all mobile viewports.

**"Application Sent!" success modal — trilingual + repositioned  ✅ 2026-06-23 5:10 PM (deployed, dynamic-job.js→v55)**
- Added the same English/Bisaya/Tagalog language tabs to the `#applicationSentOverlay` success
  modal; content (title, "what happens next" steps, tip, GOT IT button) now translates. Language is
  shared with the Confirm overlay (`applyConfirmLang`), so the choice carries through the whole flow.
- Gave it the `apply-flow-overlay`/`apply-flow-modal` classes so it sits high (top-aligned, 70vh +
  scroll) like the compose/Confirm modals instead of being vertically centered.
- Pure client-side strings — zero new Firestore reads/writes; tab listeners registered through the
  cleanup registry (no memory leak).

**Confirm-note → bullets  ✅ 2026-06-27 11:20 AM (deployed, dynamic-job.js→v56, jobpage.css→v42)**
- Reworded the Confirm modal note to a lead line + bullet list (trilingual): "This uses 1
  application and comes back:" → • If you're not hired • If you cancel • If the gig finishes.
- `noteLead` + `noteBullets[]` in `APPLY_CONFIRM_COPY`; rendered as a centered `inline-block` disc
  list (`.apply-flow-note-bullets`). Still zero added reads/writes.

---

## Closure-notification reframe → "Application Slots Open" (✅ 2026-06-27, deployed)

**Why.** The decline notification predates the My Applications page + application allowance. It was
built as a defensive "courtesy" (apologize for rejection, batch to avoid annoyance). With the
allowance system, the same event is now *good news the worker wants*: a slot reopened → go apply
again. So the notification is repurposed from apology → re-engagement.

**How the system actually works (verified in code):**
- Closure triggers: manual reject (`rejectApplication`, firebase-db.js) and not-selected-after-hire
  (`jobs.js` accept-offer → reject other pending apps). Withdraw / resign / void / complete also
  release slots but notify separately or not at all.
- **The slot returns instantly** on every closure via `releaseApplicationCoinForApplication` →
  `releaseApplicationCoinForUser` (`applicationCoinsCurrent + 1`). Batching the *notification* never
  delays the actual capacity — the "Applications Remaining" count is always live.
- Batching: a rolling 6-hour window groups closures into one unread card (`closureCount`,
  `jobIds[]`, `jobTitles[]`, capped 25). Once read, the next closure starts a fresh card.
- **These closure types do NOT push** — they're absent from the Cloud Function's
  `CRITICAL_PUSH_NOTIFICATION_TYPES`, so they're in-app Alerts-tab only.

**Decisions made (owner, 2026-06-27):**
- Reframe = uniform, reason-neutral, abundance copy emphasizing ONLY the number of slots reopened
  per batch ("N application slots just opened — find your next gigs!"). No rejection language.
  Rejection is already conveyed by the 2-applications-max-per-gig rule + "Limit Reached" button.
- Keep batching: the multi-slot tally ("you have N slots open") is psychologically stronger than a
  string of individual rejection pings, and it's effectively free.

**Cost study (ballpark, assumes ~20 applies/worker/mo, ~90% close):**
- Firebase anchors: writes ~$1.80/M, reads ~$0.60/M, function calls ~$0.40/M (2M/mo free), FCM free.
- Notification subsystem: ~$0–1/mo at 10k workers, ~$3–5/mo at 50k, ~$7–12/mo at 100k.
- Batched-vs-real-time difference: **<$1/mo even at 100k** → decide on UX, not cost.
- Real cost driver is READS on listings/messages (tens of millions/mo at scale), not these writes —
  same concern as the Admin Dashboard cost study.

**Implementation:** unified type `application_slots_reopened_batch`. `firebase-db.js`
(`buildSlotsReopenedMessage`, unified type in `createGroupedApplicationClosureNotification`,
counter-type set). `messages.js` (`getLocalizedAlertMessage` trilingual `slotsEn/Bi/Tl`,
`tAlertLang.slotsOpen`, render switch 🔓 + `success-icon`, `BATCH_WORKER_ALERT_TYPES`). Legacy
types kept in render/copy so any pre-existing cards still show the same uniform message. No Functions
redeploy. Deployed: `messages.js→v13.23`, `firebase-db.js→v42` (messages.html + jobs.html).

**Push: ENABLED ✅ 2026-06-27** (owner approved). Added `application_slots_reopened_batch` to
`CRITICAL_PUSH_NOTIFICATION_TYPES` + push title ("Application Slots Open") in `functions/index.js`;
deployed via `firebase deploy --only functions --force` (same deploy removed the dead
`migrateLegacyProfilePhones`). Workers now get a browser/phone push — one per 6-hour batch (push
fires on doc CREATE only; fold-ins update silently), so no spam. iOS web-push caveat applies (PWA
install required on iOS 16.4+); reliable on Android/desktop Chrome.

**Phase E — Verify**
- [ ] E1. Desktop + mobile breakpoints (overlays, header) on a real apply.
- [ ] E2. First-time explainer shows once, then suppressed; Confirm shows every time.
- [ ] E3. At 0: Capacity overlay intercepts; inline cancel frees a slot and re-enables apply.
- [ ] E4. iOS/WebKit path: count correct, no read storm (one reconciliation max per attempt).
- [ ] E5. Trilingual copy renders correctly in all 3 languages.

**Phase F — Admin (deferred to Admin Dashboard build)**
- [ ] F1. Make max-applications (`DEFAULT_APPLICATION_COINS_MAX`) an admin config value.

---

## Build gate
Nothing in this spec is implemented yet. **Await explicit final approval before building**,
even now that this doc exists (owner instruction, 2026-06-20). Tasklist above is sequenced and
ready to start at Phase A tomorrow on your go.
