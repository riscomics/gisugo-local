# iOS Legacy Device Compatibility Note (Observed 2026-03-12)

> **Agent rule:** device/login compatibility claims must be verified against current
> `public/js/firebase-auth.js` and live https://gisugo.com — not this note alone.
> Facebook device-login rescue shipped 2026-07-14. See `AGENTS.md` § "verify production data."

## Scope
- Document known issues seen on older iOS devices before implementation work.
- No code changes are included in this note.

## Devices Reported
- iPad mini (older model) running Safari.
- iPhone SE / older iPhone class running Safari.

## Reported Symptoms

### 1) iPad mini layout issue
- On GISUGO pages, header appears disproportionately large.
- View is dominated by top header/logo area, reducing usable content area.
- Same device displays other websites normally, which suggests a GISUGO-specific responsive/layout bug.

### 2) iPhone older-model data-loading instability
- Pages that depend on Firebase/Firestore data sometimes stall on loading animations.
- Behavior is inconsistent:
  - Sometimes category pages load and render 20+ cards correctly.
  - Other times category pages (including some with little/no data) remain stuck on loaders.
- This points to runtime/state/compatibility edge cases rather than simple memory capacity limits.

## Current Hypotheses (No Fix Applied Yet)

### Header/viewport rendering on older Safari
- Older iOS Safari text autosizing and viewport handling may be inflating header dimensions.
- Header layout scripts/CSS may rely on viewport calculations that are unstable on legacy Safari.
- Shared responsive styles may not be applied consistently across all pages/components.

### Firestore initialization/query lifecycle fragility on older Safari
- IndexedDB/persistence behavior can be unstable on older iOS Safari.
- Initialization race conditions may leave loaders visible when data flow fails or times out.
- Error/empty-state code paths may not consistently clear loading overlays.

## Why This Is Likely App-Side
- Repro is specific to GISUGO behavior and Firebase-backed flows.
- Device/browser can render other websites normally.
- Intermittency and category-dependent behavior align with app lifecycle/race handling issues.

## Investigation Plan for Separate Work Session

1) **Header/Responsive Audit (legacy Safari)**
- Verify viewport meta + `text-size-adjust` behavior.
- Audit header size rules and any JS-driven resize calculations.
- Compare old-device Safari computed styles against modern device baseline.

2) **Firebase/Firestore Init Hardening**
- Audit persistence initialization for legacy iOS fallback behavior.
- Add safe fallback path when persistence or initialization degrades.
- Ensure initialization failures do not leave unresolved loading state.

3) **Loader Lifecycle Reliability**
- Guarantee hide/resolve behavior on success, empty data, timeout, and error branches.
- Add guard rails so one stalled promise cannot block full-page UI forever.

4) **Targeted QA Matrix**
- Foreground/background navigation tests on legacy iPhone/iPad Safari.
- Multiple category pages (high data + zero/low data).
- Cold start, refresh, and repeated tab/category switching.

## Risk Notes
- These issues can impact first impression and perceived reliability on older Apple devices.
- Fixes should be surgical to avoid regressions on modern devices.
- Prefer compatibility guards/fallbacks over broad architecture changes in first pass.

## Update 2026-07-13 — Facebook login dead-ends on iPhone 7 (NOT app-side)

### Observed
- On **iPhone 7 (iOS 15, Safari and Chrome)**, Facebook login (GISUGO's full-page redirect flow)
  reaches Facebook, then stalls on Facebook's **passkey / "approve on another device"** screen.
- Approving the request in the **Facebook app** does nothing for the browser — iOS Safari and the
  FB app are sandboxed, so the approval never hands back to the Safari tab.
- Reproduced **directly on facebook.com** (a fresh Safari tab, no GISUGO involved): the same account
  cannot even log into facebook.com on this device. This **exonerates GISUGO** — the failure is
  upstream, inside Facebook's own authentication.
- Debug log confirms GISUGO's side is fine: it logs `Facebook: full-page redirect` but **never**
  `Facebook: redirect token -> signInWithCredential`, i.e. Facebook never returns a token to Safari.

### Root cause
- **iPhone 7 tops out at iOS 15; Apple passkeys require iOS 16+.** When Facebook forces passkey
  verification (which it does for cold/unrecognized sessions), the device physically cannot complete
  it, so the flow dead-ends. This is a **device/OS ceiling + Facebook policy**, not a GISUGO bug and
  not fixable from the web app.

### Not a broad-user problem
- Modern iPhones (iOS 16+) can complete passkey.
- Users already signed into facebook.com **in Safari** skip passkey (instant "Continue as").
- The dead-end = old device + cold FB Safari session + FB forcing passkey.

### Mitigation (tracked in `docs/V1_HARDENING_TASKLIST.md` → Track G)
- **Phone + password login** (OAuth-independent) — works on the iPhone 7 and everywhere else.
- V2 native app uses the native Facebook SDK (true app-to-app login), which sidesteps this entirely.

## Update 2026-07-14 — SOLVED via Facebook Device Login (deployed)

The "won't-fix" verdict below is superseded. The passkey dead-end is now bypassed with
**Facebook's device-code login** (`facebook.com/device`): the page fetches a short code, the
user confirms it inside the Facebook APP (already logged in there), and the page polls the
Graph API for the access token → `signInWithCredential`. No handoff back through the browser
is ever needed, so the iOS sandbox/passkey wall never enters the flow.

- **Verified end-to-end on the iPhone 7 (iOS 15)** — the device this note declared unrescuable.
- Also verified on an **untrusted Android phone**: the wall is account/device-trust based, not
  iOS-only. The rescue now auto-offers on any mobile Facebook attempt that returns tokenless.
- iOS 16+ confirmed fine with the normal redirect (iPhone 12 test) → no modal there.
- Full implementation details: `docs/V1_HARDENING_TASKLIST.md` → Track G.

## Decision Status
- Facebook-login-on-legacy-iOS: **SOLVED on web via device login** (2026-07-14). Phone+password
  fallback and the V2 native app remain as additional paths.
- The OTHER two issues in this note (iPad mini header layout; legacy-iPhone data-loading stalls)
  remain **documented only / deferred** (see V1 tasklist Track E "iOS legacy-device issues").
