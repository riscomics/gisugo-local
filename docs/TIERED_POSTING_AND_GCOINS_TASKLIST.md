# Tiered Posting, Application Slots, and G-Coins

> Status: **Launch tasklist built 2026-11-13.** Section 4 is in the product. The tier system in section 3 stays parked. Do not build it until Peter assigns a step.

## 1. Payments stay off

GISUGO cannot accept payments until Philippine business registration is in place. There is no payment gateway. There must be no checkout, no Buy button, and no peso charge for PRO, Business, or G-Coins. Money collected stays zero. The Financial Management sidebar page stays parked and must not become a payment screen.

Signup already stores `gCoinsBalance: 0`. Leave it at 0. Do not show it, sell it, or spend it.

Two later G-Coin surfaces are written down and **not chosen**:

- **Option A — Hidden balance.** The field stays at 0. Buy G-Coins stays hidden. Peter can grant complimentary coins from Admin if a trusted partner needs to go past a PRO or Business free ceiling.
- **Option B — Visible complimentary credits.** The balance is visible and labeled as complimentary launch credits, not for sale. Peter grants packs from Admin.

The G-Coin boosted caps (25 active for PRO, 50 active for Business) stay dormant until Peter chooses A or B and a gateway exists. Checkout later plugs into `verification.proVerified`, `verification.businessVerified`, and `gCoinsBalance`. Do not build checkout now.

---

## 2. Launch, without the tier system

Launch does not show tiers, prices, KYC upgrades, or a monthly gig allowance. Flood control is two numbers in **Admin Dashboard → Settings → Gig & Content Moderation**.

| Setting | Launch behavior |
|---|---|
| **Maximum Active Gigs Per User** | Already on the screen. `0` means no cap. Peter sets the number when he wants a cap. The spec does not pick one. |
| **Maximum Active Applications Per User** | New field, directly above Maximum Active Gigs. Starts at **10**, which is already what signup stores and what Apply enforces. |
| **Launch feed bucket** | Unchanged. It sorts or pauses a crowded gig. It is not a per-person cap. |
| **User Tier System toggle** | Not part of this launch build. It is the first piece of the parked tier system in section 3. |

### What already works

- **Gigs.** `createJob` in `public/js/firebase-db.js` reads `maxActiveGigs` from `platform_settings`. New posts and completed-gig relists (`new-post2.html?relist=`) both go through `createJob`. At `0` the check is skipped. Above `0`, the post is refused. Today the count is only `status == 'active'`, and the refusal is a browser alert plus a generic toast.
- **Applications.** Signup writes `applicationCoinsMax: 10` and `applicationCoinsCurrent: 10` on the user. Apply reads those fields. At 0 left, `dynamic-job.html` already opens one overlay: the person has hit the limit, and they can cancel a pending application. There is no settings field for this number yet.
- **Pause.** The poster can pause and unpause a gig. With the launch feed bucket off, a crowded gig is also set to `paused` (`pauseReason: auto_paused_max_applications`). Listing pages show only `active`.

### Counting rules for the launch gig cap

Count gigs whose `status` is `active` or `paused`. A paused gig stays off the public list and still occupies a slot. Pausing does not free a slot, so unpause does not need one. Keep the Pause button. Manual pause and the backend auto-pause both count.

These do **not** occupy a slot, and putting the **same** gig back to `active` is allowed even when the poster is already at the maximum:

- Worker declines the offer
- Worker resigns
- Customer void-and-relist of a hired or accepted gig

No prompt on those returns. The poster hears about the cap only when they try to create another gig.

A completed-gig relist creates a new gig, so the cap applies. Editing a gig does not. Deleting a gig frees the slot.

### Prompts

One prompt, only when the next new gig would go past the maximum. It is a friendly overlay, not the browser alert that exists today. It explains how and why launch limits how many gigs one person can have listed at a time, and that this changes when the market matures. No tier names, no KYC, no prices, no Buy action.

Applications keep the overlay that already exists. Add the same kind of launch explanation above the cancel list. No second modal. No tier or KYC language while the tier system is unbuilt.

### Super Admin

`admins/{uid}.role == 'super_admin'` bypasses the launch gig cap and the launch application cap. Do not hardcode names. The current holders of that role are GISUGO Operations and Peter J. Ang.

### Direct writes

A logged-in script can create a job document and skip the gig cap. Firestore rules allow that create and cannot count the user's other gigs. The price floor has the same shape. Ordinary posting from the site is checked. This is parked under cloud security in section 3. It is not part of the launch tasklist.

---

## 3. Tier system (parked)

Do not build this section in the launch tasklist. It is here so it can be tweaked and later built in pieces.

### Switch

Add **User Tier System** directly under Launch feed bucket.

- **OFF** is launch. The two maximum fields in section 2 are the only caps. Monthly allowance is not enforced and not shown.
- **ON** replaces those two numbers. Maximum Active Gigs and Maximum Active Applications gray out so they cannot fight the tiers. Fields for the matrix below appear, including the monthly allowance.

Flipping ON does not take live gigs down. Someone already over a new cap keeps those gigs. The new limit appears only when they try to post or apply past it.

### Matrix (the ON numbers)

| Feature | Verified (FVV) | PRO Verified | BUSINESS Verified |
|---|---|---|---|
| **How to unlock** | Face verification the account already has | Peter verifies them. Admin sets `verification.proVerified` | Peter verifies them. Admin sets `verification.businessVerified` |
| **Active gigs at a time** | **2** | **7** | **15** |
| **Gigs per calendar month** | **8** | **28** | **30** |
| **G-Coin boosted active cap** | Must become PRO first | Up to **25** | Up to **50** |
| **Monthly total with G-Coins** | — | 1 G-Coin per extra gig | 1 G-Coin per extra gig |
| **Worker application slots** | **10** | **20** | **20** |

GCash / checkout in older notes is the later paid path. It is not how PRO or Business is unlocked while payments are off. The boosted 25 and 50 stay dormant until Option A or B is chosen and a gateway exists. With the switch ON and coins still at 0, PRO stops at 7 active and 28 per month, and Business stops at 15 active and 30 per month.

Super Admin bypasses these caps too.

### What counts once the switch is ON

Same gig-slot rules as launch: `active` and `paused` count. Hired and accepted do not. Returning that same gig to `active` is allowed over the cap. No prompt on that return.

Monthly allowance (`Asia/Manila`, `YYYY-MM`) counts a brand-new gig and a completed-gig relist. It does not count an edit, a void-and-relist, a retracted offer, or a worker resign. Deleting a gig frees the concurrent slot and does not refund the monthly count.

Application slots left = that tier's maximum minus applications still active. Example: 4 active and a PRO maximum of 20 means 16 left. A Free account already stored at 10 is already on the Verified allowance. Turning the switch on does not rewrite those accounts. Marking one person PRO or Business writes the new maximum onto that account only.

### Prompt when the switch is ON

The posting prompt and the existing application overlay explain the tier the person is on and offer KYC verification for PRO or Business. The path is a pre-tagged Support thread. Peter verifies them. Admin User Management sets the flag. No price and no Buy button. No second modal.

### Piece by piece, when assigned later

1. The toggle, the grayed launch fields, and the tier fields. OFF must keep behaving as section 2.
2. Face verification on the write paths that do not already have it (report, `createJob`, `applyForJob`) and the matching Firestore rules.
3. Tier caps on new posts and on applications, using the counting rules above. Admin controls for PRO Verified and Business Verified.
4. Monthly allowance.
5. G-Coin grant and the boosted caps, only after A or B is chosen. Still no checkout until registration and a gateway exist.
6. A prompt for the native app so `gisugo-native` matches. That prompt is not a web build.

### Parked cloud security

Job creation through a Cloud Function, with client creates denied, so a logged-in script cannot skip the cap. Not part of launch.

---

## 4. Tasklist without the tier system

Build these only when Peter assigns them. Do not add the tier toggle, tier fields, monthly allowance, PRO/Business controls, G-Coin UI, or checkout in this list.

### [x] 1. Count paused gigs toward the gig cap

In `createJob`, count the poster's gigs with `status` in `['active', 'paused']` against `maxActiveGigs`. Leave unpause, offer decline, resign, and customer void-and-relist unchecked. Those paths keep writing the same gig back to `active`.

### [x] 2. Super Admin bypass

Skip the gig cap in `createJob` and the application-slot check in Apply when `admins/{uid}.role == 'super_admin'`.

### [x] 3. Launch posting overlay

When a new gig or a completed-gig relist would pass the maximum, show one friendly overlay instead of the browser alert. Launch-phase explanation only. No tier names, prices, or Buy action. Below the maximum, no warning.

### [x] 4. Maximum Active Applications Per User

Add the field above Maximum Active Gigs. Default **10**. Save it with the other Gig & Content settings.

Signup writes that saved number onto `applicationCoinsMax` and `applicationCoinsCurrent`.

The dashboard client cannot update another user's application fields under current Firestore rules. Saving a **changed** number runs a super-admin Cloud Function that updates existing accounts: set the maximum to the new number, and set slots left to the new maximum minus applications still active. Leaving the number at 10 does not require that write. Signup already stored 10.

### [x] 5. Launch sentence on the application overlay

On the existing capacity overlay, add the launch explanation above the cancel list. Keep the cancel action. No second modal. No tier or KYC language.
