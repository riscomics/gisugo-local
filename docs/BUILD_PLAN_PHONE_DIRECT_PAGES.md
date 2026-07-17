# GISUGO — Build Plan: Phone-at-Signup · Direct Route · Alerts/Support Pages

> Status: **Active plan** · Created 2026-07-04 · Last updated: 2026-07-17
> Covers recommended-order items **1, 2, 3** from `docs/V1_HARDENING_TASKLIST.md`.
> Items **1–3 shipped** (Item 3 in-app primary alert smoke done; leftovers in V1 §E). Next linchpin: Admin Dashboard (Track C).
> Companion: `docs/DIRECT_CONTACT_LISTINGS_STUDY.md` (full Direct rationale).
> Norm: **verify in code AND live Firestore before each step and before any status report**
> (`node scripts/verify-production-data.js`); deploy hosting after mobile-facing changes; bump `?v=`.
> **Never** treat `[USER]` backlog lines or doc timestamps as current without a production check.
> See `AGENTS.md` § "verify production data."

---

## ITEM 1 — Mandatory verified phone at signup

**Goal:** every account has a **mandatory phone number** as a contact field (feeds Direct). **No SMS
verification** — see decision below.

**Current state (traced):**
- Phone SMS-OTP flow exists in `sign-up.js`, but we are NOT using it for verification (cost). The
  user doc already stores `phoneNumber` (`sign-up.js` ~L431).
- `sign-up.js` builds the profile then calls `createUserProfile(userId, profileData)` (~L1324).
- **Gap:** phone is not currently required for email/Google signups.

**Decisions LOCKED (2026-07-05):**
- **NO SMS verification.** PH SMS = **$0.15/send** (~$1,500 per 10k signups) — not worth it for a
  number that's unverifiable-in-practice anyway. Phone is a plain **required contact field**.
- **Phone field is mandatory** on all signup paths. Its only job: let the customer contact the
  worker (Direct). Add a short trilingual note in the field explaining why it's required.
- **No phone-OTP login either** (that also bills SMS). Login stays Google/FB/email.
- **Signup rails = Google + Facebook** (corrected 2026-07-06). Google is enabled/working now.
  Facebook is **not yet enabled** in Firebase, but enabling it does **NOT** require a PH business —
  Meta Business Verification accepts the owner's **US LLC (Real Interface Studios LLC, NJ)**; entity
  country need not match user country. FB path (pursue in parallel, may hit launch): create Meta app
  under a Business Portfolio owned by the LLC → Business Verification → App Review for
  `public_profile`+`email` → add App ID/secret to Firebase. Remove the phone rail (OTP-based, kills
  no-SMS), phone sign-in, and Email signup rail → OAuth only, **no password login**. Build UI with
  both buttons but **hide FB until the provider is live** (avoid the "Not Enabled" error), then unhide.
  - **Do NOT conflate with SMS:** the US LLC unblocks Facebook; it does NOT necessarily satisfy PH
    telco **sender-ID** registration for Semaphore/SMS (that may still want a PH entity). FB ≠ SMS.
- **Phone** moves into **Basic Information** as a required field. **Email** becomes an **optional
  profile field** (e.g. in Social Media / Optional), NOT a signup method.
- **Coverage check:** Every Android phone ships tied to a **Google account**, and **Facebook is
  near-universal** in PH. FB + Google covers essentially all smartphone users. The no-FB-no-Google
  holdout is negligible.
- **Messenger:** not a separate rail — every Messenger user has a Facebook-linked login (Meta killed
  phone-only Messenger signup years ago). The Facebook button already covers them. **Relabel the FB
  button "Facebook / Messenger."**
- **Viber:** cannot be a login rail — no consumer "Sign in with Viber" identity provider (Bot/
  Business API only), unsupported by Firebase, and phone-based (what we're dropping).
- **Apple sign-in:** optional future rail for iOS coverage; not required for launch.
- **TikTok:** possible but not built into Firebase — needs custom OAuth → Cloud Function → custom
  token, plus TikTok dev-app review; returns thin data (no reliable email/phone). High overlap with
  FB/email. **Skip for launch;** revisit only if signup data shows demand.
- **One phone per account:** without verification this is weak (users can type anything), so keep it
  light — optional soft duplicate-check at most; do not over-engineer.

**Tasks:**
1. **Signup UI → two rails only: Facebook and Google.** Remove the "Sign up with Phone Number" rail,
   the "Sign up with Email" rail, and the **phone sign-in** option from login. Relabel the FB button
   **"Facebook / Messenger."**
2. **Add required phone field to Basic Information** (keep the `+63` country-code selector). Replace
   the old "Send Verification Code" section with a **trilingual note tab** emphasizing the
   communication requirement ("Customers use this to contact you when you apply"). Basic PH-format
   validation only — no OTP.
3. **Add optional email field** (e.g. under Social Media / Optional). Purely a profile/contact
   field, not an auth method.
4. Persist on the user doc: `phoneNumber` (+ optional `email`). ALSO write the phone to the worker's
   **private profile subcollection** (owner-only readable) so Item 2's callable can serve it without
   public exposure.
5. Gate signup completion on a non-empty, format-valid phone.
6. Add a **trilingual consent line** at signup: phone may be shared with a customer when you apply /
   are hired (ties to Item 2).
7. Existing users without a phone → prompt to add one on next login (backfill path).
8. (Optional) Soft duplicate-check on phone; surface a gentle notice, don't hard-block.
9. **Clean up dead auth code:** phone-OTP send/verify handlers AND email/password signup+login paths
   once the rails are removed. Confirm no live account depends on email/password first (likely only
   test accounts pre-launch).

**Dependencies:** none. Prerequisite for Item 2.

---

## ITEM 1 — APPENDIX: SMS OTP verification research + decision (2026-07-05)

> We revisited *verified* phone (vs. plain field) after finding cheap local OTP channels. Findings
> below. **Key blocker: GISUGO business registration in Cebu is still pending**, which gates the
> verification route (see decision).

### Cost per OTP (PH numbers)
| Channel | Per OTP | ~200 signups |
|---|---|---|
| Firebase native phone auth | ~$0.15 | ~$30 |
| **Semaphore** (OTP endpoint = 2 credits × ₱0.56) | ~₱1.12 / **~$0.02** | ~$4 |
| **WhatsApp** auth template (PH rate) | **~$0.0113** / ₱0.63 | ~$2.30 |

### Semaphore (local PH aggregator) — confirmed from FAQ
- **What it requires:** free account → submit ONE Sender Name (e.g. `GISUGO`, ≤11 alphanumeric) with
  a sample OTP message → buy prepaid credits (online or bank deposit to Sombra, Inc. Unionbank;
  ₱0.56/credit, valid 12 months) → copy API key.
- **Sender Name approval: up to 5 business days.** First sender name free.
- **Business association required** — a top rejection reason is "account not associated with a
  business." **This is where the pending Cebu registration bites** (see decision).
- **OTP endpoint** `POST /api/v4/otp`: auto-generates the code (`{otp}` placeholder), priority route
  dedicated to OTP traffic, no rate limit. 2 credits per 160 chars.
- Banned sender words: TEST/MESSAGE/SMS/OTP/PIN and telco names (SMART/GLOBE/SUN). No URLs in body.

### WhatsApp Business API — for later, not launch
- Cheapest per message at PH auth rate (~$0.0113) + volume discounts.
- Heavier gate: Meta Business Portfolio verification → WABA → **auth template pre-approval** → new
  accounts **throttled** during ramp-up. Requires recipient to have WhatsApp installed (needs SMS
  fallback). Good as a **second channel** behind the same abstraction, added post-launch.

### Regulatory notes
- Alphanumeric Sender IDs must be telco-registered (Globe/Smart/DITO). International aggregators =
  2–4 weeks; **Semaphore (local) collapses this to ≤5 business days in-house.**
- BSP/AFASA OTP-SMS ban (July 2026) applies only to **banks/financial institutions** — NOT us.

### Architecture (provider-agnostic, so a 2nd provider drops in later)
- Generate the OTP code **ourselves** in a Cloud Function; store **hash + expiry + attempt counter**
  in Firestore; provider only delivers the text.
- Interface `SmsProvider.sendOtp(phone, code)` → `SemaphoreProvider` now, `WhatsAppProvider` later;
  selected by a config flag. All server-side (callable, asia-southeast1) so the API key stays secret
  and sends are rate-limited/abuse-guarded.

### DECISION (leaning — pending user's final call)
- **Launch with the plain mandatory phone FIELD (no verification)** — the original Direct path. It is
  cleaner and has **zero external dependency**, so business-registration timing can't block launch.
- **Add Semaphore OTP verification as a FAST-FOLLOW** once GISUGO is registered (needed for sender-ID
  approval anyway).
- **No throwaway work:** the phone field UI + storage are identical either way; verification is just
  an extra step layered on later. Choosing "unverified now" costs us nothing to upgrade later.

---

## ITEM 1 — ACCOUNT CREATION REDESIGN micro-tasklist (LOCKED 2026-07-06: Direct, plain phone, no SMS)

> Rails → **Google + Facebook.** Google is live now; Facebook is being enabled in parallel via the
> US LLC (Meta app + Business Verification + App Review). **Keep the FB button VISIBLE as it shows
> today** (per user 2026-07-06) — it triggers the existing graceful "Not Enabled" overlay until the
> provider goes live. Must be enabled before public launch or real users hit that overlay. Phone =
> required contact field. Email = optional.
> No OTP. Touches `sign-up.html`, its inline `<script>`, `sign-up.js`, `firebase-auth.js`,
> `login.html` (sign-in mirrors the same trim), and `profile.js` Login Methods. Real element IDs below.

### ✅ STATUS (2026-07-07) — redesign DONE + deployed; 3 follow-ups remain
- **STEP 0 (migrate phone accounts): DONE** — spare Gmail linked to the phone-login primary; other
  primary already had Google. Both safe.
- **A / B / C (sign-up.html + inline script + sign-up.js): DONE** — OAuth-only, required phone in
  Basic Info, optional email, trilingual note/consent/name-lock, dead OTP paths removed, `?v=6.5`.
- **E (login.html): DONE** — removed phone/OTP + email/password + forgot-password/reset overlay and
  all their inline JS; errors route to a new `#loginError` slot; FB relabeled **"Facebook / Messenger."**
- **F (createUserProfile persists phone/email): DONE** (confirmed).
- **H1/H2 (profile Login Methods): DONE** — Phone + Email/Password rows, their 3 modals, and
  Change-Password removed; Google + Facebook linking kept. STEP 0 was confirmed first.
- **FB button relabel: DONE** on both `sign-up.html` and `login.html` ("Facebook / Messenger").
- **G1 (cache-bust + deploy): DONE** — `firebase-auth.js ?v=8→9` across all 12 pages, `profile.js
  ?v=85→86`; `firebase deploy --only hosting` shipped to https://gisugo1.web.app.
- **D1 (retire dead auth fns): DONE (2026-07-07)** — grepped repo first (only self-references), then
  removed `signUpWithEmail`+`createMockUser`, `loginWithEmail`+`loginMockUser`, the whole phone block
  (`initPhoneRecaptcha`/`sendPhoneVerificationCode`/`verifyPhoneCode`) and `sendPasswordReset`, plus
  their `window.*` exports. Kept `getEmailVerificationActionSettings` (still used by the email-gate).
  `firebase-auth.js ?v=9→10` across all 12 pages. Zero orphaned refs, no lint errors.
- **H3 (phone backfill + gate): DONE (2026-07-07)** — new shared `public/js/phone-gate.js` exposes
  `window.ensurePhoneOnFile()`: reads the profile once, and if `phoneNumber` is empty it opens a
  self-contained modal (same validation as sign-up) that saves via `updateUserProfile`. Wired into
  `beginApplyFlow()` (dynamic-job) and `postJob()` (new-post2) so apply/post is blocked until a phone
  is on file. Loaded on `dynamic-job.html` + `new-post2.html`. Caches confirmation in-memory (0 extra
  reads on repeat clicks); fails open on not-logged-in / transient read errors.
- **G2 (QA):** code-level double-check DONE — no orphaned code (cleaned dead `showAuthenticatedState`
  refs in sign-up.js), no listener/timer leaks (gate builds modal + binds listeners once), no cost
  regressions (single cached read, one write on backfill). **Mobile device QA still on you:** verify
  FB/Google + trilingual tabs + the phone-gate modal on a phone.

### STEP 0 — MIGRATE existing phone-login accounts FIRST (before removing any rail)
- Removing UI does **not** sign anyone out (sessions persist LOCAL); active sessions survive. But a
  phone-only account that signs out AFTER the rail is gone would be locked out.
- **Action:** the phone-login primary → **Profile → Login Methods → Link Google** (free popup, no
  SMS). Facebook can't be used (provider not enabled). Use a **fresh Gmail** (fastest) or free the
  spare from the 4 extras — any Google account works, one per Firebase user. Do NOT sign it out until
  Google is linked.
- The other primary already has Google → needs nothing.
- The 4 extra test accounts also lose phone/email sign-in after the trim; if you still need to log
  into them, keep them signed in or link a Google account too — otherwise disposable.

### A. `sign-up.html` — markup
- **A1.** In `#signupMethodsSection`: delete `#phoneSignUpBtn` + the `.or-divider` directly above it.
  **Keep `#facebookSignInBtn` VISIBLE** (as it shows today) — it uses the existing "Not Enabled"
  overlay until the FB provider goes live. Optionally relabel span → "Facebook / Messenger".
- **A2.** Delete the whole `#phoneOtpSection` block (country code, `#phoneAuth`, `#sendOtpBtn`,
  `#otpVerifySection`, verify/resend).
- **A3.** Delete `#emailDivider` (OR + `#emailToggleBtn`) and `#emailSignupSection`
  (`#email`/`#password`/`#confirmPassword`) — email is no longer a signup rail.
- **A4.** In `#signupSectionBasic`: add a **required phone field** — `.phone-input-wrapper` with a
  `+63` country-code `<select id="phone-country">` (reuse the existing option list) + `<input
  type="tel" id="phone" required>`. Add a **trilingual note** ("Customers use this to contact you
  when you apply") + error slot `#phoneError`.
- **A5.** In `#signupSectionSocial` (Optional): add an **optional email** input (`id="email"`).
- **A6.** Add a **trilingual consent line** (phone may be shared with a customer when you apply / are
  hired) near the phone field or above Terms.
- **A7.** Add a **trilingual name-lock notice** near the first/last name fields: names can't be changed
  later without admin approval, so enter your real name correctly. (Mirrors the profile editor, which
  now locks the name fields read-only once a name exists — done in `profile.js`
  `populateEditProfileForm`.)

### B. `sign-up.html` — inline `<script>`
- **B1.** Remove handlers/fns: `phoneSignUpBtn`, `sendOtpBtn`, `verifyOtpBtn`, `resendOtpBtn`,
  `startResendCountdown`, `emailToggleBtn`, `hideEmailSection`. Keep FB/Google + Terms/Privacy modals.

### C. `sign-up.js`
- **C1.** Remove phone-signup + email/password signup code paths; keep FB/Google OAuth → profile.
- **C2.** Collect `#phone` (+ country code) into `profileData.phoneNumber`; collect optional `#email`.
- **C3.** Make phone **required** in form validation (basic PH format).
- **C4.** Add trilingual strings (phone label, note, consent) to the LANG dicts; drop dead OTP strings.

### D. `firebase-auth.js`
- **D1.** Remove/retire now-unused `sendPhoneVerificationCode`, `verifyPhoneCode`, and email/password
  auth fns once nothing references them (grep first).

### E. `login.html` (sign-in mirror)
- **E1.** Remove phone-login rail + OTP section, email/password section + forgot-password/reset
  overlay. Keep FB/Google. Relabel FB → "Facebook / Messenger."
- **E2.** Remove associated inline JS handlers.

### F. Storage
- **F1.** Confirm `createUserProfile` persists `phoneNumber` (+ optional `email`); adjust if needed.
  (Private-profile-subcollection copy for Direct = Item 2, defer.)

### H. `profile.js` — Login Methods overlay (existing linking system, ~L2584+)
- `updateLoginMethodsUI()` reads `user.providerData` and renders Google/Facebook/Phone/Email link
  state; Google/FB link via popup (free), Phone via reCAPTCHA+OTP (SMS), Email sets a password.
- **H1.** Keep **Google + Facebook** link rows. **Remove Phone + Email/Password** link rows,
  their modals (`openPhoneLinkModal`/`openEmailLinkModal` + related), and the Change-Password button —
  consistent with OAuth-only + no-SMS.
- **H2.** Do H1 only **after STEP 0** migration is confirmed done for the 2 phone accounts.
- **H3.** Backfill: existing accounts with empty `phoneNumber` → prompt to add one (reuse the same
  required-phone field), gate gig apply/post until filled.

### G. Finish
- **G1.** Bump `?v=` on `sign-up.css`, `sign-up.js`, `firebase-auth.js` in `sign-up.html` +
  `login.html`. Deploy hosting.
- **G2.** Mobile QA: FB, Google, phone required, optional email, consent visible, trilingual across
  all three tabs.

**Pre-check:** grep for any live dependency on email/password or phone auth before deleting (login,
profile edit, password reset). Likely only test accounts pre-launch.

---

## ITEM 2 — Direct contact route (the flip)

**LOCKED (2026-07-05):** Direct is the model. Chat sits in the background as future "premium."

**Current state (traced — good news):**
- The **entire hire lifecycle already lives in Gigs Manager, chat-free** (`jobs.js`:
  `hireWorker`/`processHireConfirmation` ~L8802, `moveJobFromOfferedToAccepted`, `handleCompleteJob`,
  `handleRelistJob`, `handleResignJob`, `openFaceVerificationViewer`). **Nothing to migrate.**
- Application cards render in `jobs.js` (~L7700–7830). Hire = `processHireConfirmation` → `hireWorker`.
- Chat Gig Status modal + OPEN HIRE CHECKLIST are duplicate mirrors (can become premium later).

**Tasks:**
1. **Backend callable `revealApplicantContact(applicationId)`** (asia-southeast1): verify caller
   **owns the gig**, rate-limit, **increment a reveal counter** (dashboard metric), return the
   worker's phone read from the worker's **private profile**. NEVER store the phone on the
   application/job doc → so it's not scrapable and does NOT depend on the Track B lockdown.
2. **View Applications card (`jobs.js`):** add a **CONTACT** button. 2-overlay flow:
   - Overlay 1: trilingual disclaimer/tips (incl. worker-fairness note + consent recap).
   - Overlay 2 (on confirm): call `revealApplicantContact` → launch `tel:`/`sms:` (number never
     displayed). Reuse the existing cleanup registry so Contact/Hire don't double-bind listeners.
3. **HIRE unchanged mechanism:** reuses the existing offer→accept flow (worker confirms via Offered
   tab). Add a **price-verify field** to `processHireConfirmation` → confirmed value becomes
   `agreedPrice`, reflected when the worker accepts. Ratings/earnings/completion stay intact.
4. **Worker Apply disclaimer (`dynamic-job.js` Overlay 1):** add consent line — "your contact may be
   shared with the customer."
5. **Reveal counter** surfaced later by the Admin Dashboard (Item 4).

**Dependencies:** Item 1 (verified phone in private profile). NOT dependent on the Track B lockdown
or the dashboard.

---

## ITEM 3 — Support & Alerts → their own pages + menu links

**Goal:** split ALERTS and SUPPORT out of the unified messages view into standalone pages; update
the menu overlay links.

**Status (2026-07-17): SHIPPED** — `alerts.html`/`alerts.js`, `support.html`/`support.js` +
`support-compose.js`, menu swap, G2 chat-listener gate, push → `/alerts.html?role=…` (+ `data.link`),
Contact merged into Support Write (`contacts.html` → `support.html?compose=1`). Hosting + functions
deployed (`673d1fb`, `8f9d4b5`; chrome polish `d30dff3`). Micro-tasklist /
smoke checklist: `docs/V1_HARDENING_TASKLIST.md` → Item 3.

**Still open:**
- Item 3 smoke leftovers (detail in `docs/V1_HARDENING_TASKLIST.md` Item 3 §E):
  - ✅ In-app primary worker/customer gig alerts (2026-07-17 two-account pass).
  - ⬜ Customer `application_milestone` (5+) and `gig_auto_paused` (10).
  - ⬜ Support Write / empty-state smoke.
  - ⬜ Phone-tray session (delivery + tray *tap* → Alerts; tap currently FAIL — §D2 / E4).
  - ⬜ Direct `messages.html?threadId=` regression.
- Support **admin responder** (Admin Dashboard / Track C) — user page can stay empty until then.

**Current state:**
- Standalone pages are the user-facing UX; menu shows **Alerts** + **Support** (Messages hidden).
- `messages.html` left intact for premium chat (direct URL / `?threadId=` still valid).

**LOCKED (2026-07-05):** **Leave `messages.html` as-is** — copy/extract, not a teardown.

**Tasks (all build items done):**
1. [x] `alerts.html` + `alerts.js`
2. [x] `support.html` + `support.js` (+ compose / Contact merge)
3. [x] `messages.html` untouched for premium
4. [x] Menu: Alerts + Support; Messages hidden; chat unread gated
5. [x] Push deep-links → `alerts.html` (support-reply push when dashboard ships)
6. [x] Alerts badge via notification counters

**Note:** Support **responder (admin side)** still comes with the Admin Dashboard.

---

## Suggested sequencing within 1–3
1. ✅ **Item 1** (prerequisite).
2. ✅ **Item 2** (Direct contact).
3. ✅ **Item 3** (Alerts/Support pages) — in-app primary alert smoke done; leftovers in V1 §E.
4. **Next:** Admin Dashboard architecture + cost study (V1 Track C #8).

---

## DEFERRED BACKLOG (tracked 2026-07-11)

> Running list so nothing slips. Item 1 DONE. Item 2 core (Direct contact reveal +
> private phone storage + apply consent) DONE + deployed + pushed (commit 1cc839c).

- **[RESOLVED 2026-07-15 — verified against live Firestore]** Primary accounts already have
  phones in `user_private`: **Peter J. Ang** (`+19…7393`) and **Android Samsung** (`+18…9957`).
  No accounts still have a public-only legacy copy; the July-11 "re-enter phone" note is obsolete.
  Live users now: those two + **Chris Casas** (Google only, no phone — fine). Deleted 2026-07-15:
  iPhone Firefox, New Model iPhone, Real Interface Studios (+ orphan sweep).
- **[DONE ~2026-07 — Meta app Live]** Facebook app published Live (user-confirmed 2026-07-15).
  Evidence: non-owner Facebook logins work in the wild (friend iPhone test + both primary
  accounts have distinct FB providers in Auth). Docs previously still said WAITING — stale.
  FB button already labeled "Facebook / Messenger".
- **Item 2 — HIRE button + price-verify at Hire: DONE (2026-07-11) + deployed.** Added a
  HIRE button to the application action overlay (persistent overlay, independent of Contact)
  and a "Confirm or Change Agreed Price" field in the hire-confirmation overlay. Confirmed
  value flows to `agreedPrice` via `hireWorker(jobId, applicationId, confirmedPrice)` (blank →
  job default). No new wiring/rules needed — `agreedPrice` was already stored at hire and
  already drives earnings/spending/completion stats. Files: `jobs.html`, `public/css/jobs.css`,
  `public/js/gig-overlays.js`, `public/js/firebase-db.js`, `public/js/jobs.js`.
- **Hire overlay dead-code cleanup (DEFERRED, low priority)** — legacy duplication from when
  the hire overlay was extracted into `gig-overlays.js`: (a) `jobs.js` `showHireConfirmationOverlay`
  + `processHireConfirmation` are dead (nothing calls them) — safe delete; (b) `jobs.html` still
  ships a **static** `#hireConfirmationOverlay` that `ensureHireConfirmationOverlay` reuses, while
  `messages.html` builds it dynamically. Unify to one source (delete static markup, let
  gig-overlays build it) so the overlay is only defined once. Re-test HIRE on jobs.html after.
- **Surface reveal counter on Admin Dashboard** — `metrics/contact_reveals` (total +
  lastRevealAt) written by `revealApplicantContact`. Also per-application
  `contactRevealCount`. Wire into admin-dashboard.
- **Firestore cleanup pass** — (a) ✅ DONE 2026-07-15: stopped dead decrement-only writes to
  `activeJobsCount` / `appliedJobsCount` (never incremented, never read; had drifted to -13/-6);
  removed signup init + Firestore rules helper; deleted fields from all live user docs.
  (b) one-time migration to strip legacy fields `rating`, `reviewCount`, and the
  `socialMedia` dup (live pair is `averageRating`/`totalReviews`, saves write `socialUrls`);
  (c) purge legacy public `users.phoneNumber` copies (now purged on next profile save).
- **Ghost-hire jobs (from 2026-07-15 test-account deletion)** — ✅ DONE 2026-07-15: 3 `accepted`
  jobs with deleted worker as `hiredWorkerId` reopened to `active` (hire fields cleared,
  `voidedWorkerId` set, same shape as client void/relist). History on completed/active jobs
  left alone.
- **Privacy + Terms deep rewrite** — current `privacy.html` / `termsofservice.html` are
  placeholder-grade for Meta review; rewrite to reflect the actual platform (Direct contact,
  no commission/lead-gen stance, off-platform disputes, face verification, G-Coins, etc.).
- **Verify/build in-app account deletion** — privacy policy promises it; Meta + users will
  look for it. Confirm it exists in Profile settings or build it.
- **Remove temporary email/password login** — added only for Cursor-browser dev testing;
  strip once OAuth works everywhere post-approval.
- **Item 3 — Alerts + Support → own pages: DONE (2026-07-16/17) + deployed.** In-app primary
  alert smoke done 2026-07-17; leftovers + Admin Support responder still open (V1 §E / Track C).
- **UI theme fill polish (2026-07-16/17)** — `#141b24` page fill + Alerts-style surfaces rolled to
  Profile, new-post, Support, Updates, Forum, category listings/modals (PRs #44–#49); Alerts/Jobs
  role chrome shared look (`d30dff3`).
