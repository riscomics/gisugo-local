# Account Settings — deferred / relocated UI

> Updated: 2026-07-17  
> File: `profile.html` — `#accountOverlay` (Account Settings).

## Hidden until ready (not deleted)

| Feature | Element | How it’s hidden |
|---|---|---|
| **GISUGO Coins Wallet** | `#gCoinsWalletSection` | `hidden` + `display: none` + HTML comment |
| **Upgrade Status** | `#upgradeStatusOption` | same |

Related overlays still in the page (not deleted): `#gCoinsOverlay`, `#explanationOverlay`. Handlers remain in `public/js/profile.js`.

**Restore:** remove `hidden` / `display: none` from those elements, smoke-test, deploy hosting.  
Do not re-show until purchase / Pro–Business verification product work is ready.

## Face Verification — relocated (2026-07-17)

Moved **out of Edit Profile** into **Account Settings → Profile Verification**.

| Piece | Location |
|---|---|
| Card | `#accountFaceVerificationCard` (under `#verificationStatusDisplay`) |
| Status pill | `#accountFaceVerificationStatus` |
| Action button | `#accountFaceVerificationBtn` (“Verify Now” / “Re-record Video”) |
| JS update | `updateAccountFaceVerificationControls()` in `public/js/profile.js` |
| Capture flow | unchanged — still `openFaceVerificationEntryPoint()` → face capture overlays |

Edit Profile no longer contains a Face Verification section (basic info / about / social / login methods only).

## Current visible Account Settings layout

**Profile Verification**
1. Overall status row (`#verificationStatusDisplay` — Unverified / Face / Pro / Business)
2. **Face Verification** card (enable / re-record)
3. Upgrade Status — hidden
4. Submit ID — shown only when eligible (existing logic)

**Account Management**
1. Edit Profile  
2. Notifications  
3. Privacy Settings (row present; settings UI still TODO)

## Cross-refs

- Track E: `docs/V1_HARDENING_TASKLIST.md` (G-Coins, ID / Upgrade)
- My Applications coin animation archive: `docs/preserved-ui/coin-spin-animation.md`
- Face Verification policy: `docs/FV_OPTION_A_POLICY.md`
