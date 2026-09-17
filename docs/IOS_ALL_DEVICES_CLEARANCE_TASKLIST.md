# iOS — clear every iPhone (not just iOS 15)

> Status: **Open** · Opened 2026-09-17 after iPhone 13 mini / iOS 26 smoke  
> Device for this work: the **iPhone 13 mini** (Safari). That is now the launch iPhone, not the iPhone 7.  
> Policy: one data rule for **all** iPhones. Do not split “old iPhone vs new iPhone” for loading screens.

## What we mixed up

There were **two different iPhone problems**. We talked about them as if fixing one fixed the other.

### Problem A — Facebook login on very old iPhones
- iPhone 7 cannot go past iOS 15.
- Facebook sometimes demands a passkey, which needs iOS 16+.
- That is a **Facebook + OS ceiling**, not GISUGO data loading.
- A newer phone **was** the right way to test normal “continue with Facebook” (app already signed in, hand back to Safari).
- The 13 mini **did** that: Facebook connected, GISUGO logged in.

### Problem B — GISUGO screens that wait on a live data pipe Safari does not like
- On iPhone Safari (and iPhone Chrome), Firebase’s live connection often **never comes back**. The page keeps spinning, or it gives up and shows nothing.
- Alerts already avoid that: they load with a normal timed web request. That is why Peter’s alert history showed on the mini while Profile and Gigs Manager did not.
- We only skipped the dangerous extra waits on **iOS 15 and older**. iOS 16, 18, 26 still do those waits. Buying a newer phone does **not** clear Problem B.

The homepage warning (“use iOS 16 or newer”) described Problem A. It oversold Problem B. The 13 mini was necessary for Facebook. It was **not** a substitute for finishing the data-path work.

## The rule going forward

On **any** iPhone:

1. Load the screen the same way Alerts already does: a normal request with a time limit.
2. Never sit forever on Firebase’s live pipe.
3. If the request fails: show empty or an error. Do not spin forever.
4. After the main content is on screen, extra private lookups (phone, face-check files, stats repair) may run in the background or be skipped. They must not block the page.
5. Desktop / Android can keep the live pipe where it already works.

## What the 13 mini already proved (2026-09-17)

| Screen | Result | Meaning |
| --- | --- | --- |
| Continue with Facebook (Rider, already in the Facebook app) | Login succeeded | Problem A is not the blocker on this phone |
| Sent to home instead of account setup | Expected | Rider Facebook is already tied to **Peter J. Ang**, which already has a full account |
| Alerts | Real Peter history cards | Login is Peter; the Alerts-style load works on this phone |
| Profile | Did not appear | After login, Profile still waits on the live pipe for extra private data |
| Gigs Manager live + history | Nothing, despite Peter being active | Live list uses an iPhone query that does not match how desktop loads it (and can come back empty). History still uses the live pipe, then times out empty |

Do **not** Ban. Do **not** unlink Rider from Peter unless Peter asks. For a true “new Facebook account” smoke, use a Facebook identity that is **not** already linked.

## Wave 1 — Unblock what the mini just hit

- [x] **1. Lock the rule in code:** any iPhone uses the Alerts-style load. Stop treating “iOS 16+” as safe for Profile / Gigs Manager. (2026-09-17)
- [x] **2. Profile:** show the public profile as soon as the timed request returns. Do not wait on the private record, face-check repair, or stats repair before painting the page. Those can follow, or skip, with a time limit. (2026-09-17 — skip on every iPhone, same as iOS 15 already did)
      **Follow-up same day:** review tabs still waited on the live pipe (“Loading reviews…”). Timed load now. Peter has 15 customer + 10 worker reviews.
- [x] **3. Gigs Manager — live tabs:** load the user’s gigs the same way category listings already load on iPhone (simple timed request, sort in the browser). Do not ask the server for a sort that desktop does not use and that we never indexed. (2026-09-17)
- [x] **4. Gigs Manager — history:** same timed request as live. Do not use the live pipe for completed gigs on iPhone. (2026-09-17)
- [ ] **5. Smoke on the 13 mini, logged in as Peter (Rider Facebook is fine for this):** Profile shows Peter. Gigs Manager live shows real gigs. History shows completed gigs. Alerts still match.

## Wave 2 — Same treatment for the other logged-in pages

- [ ] **6. My Applications:** worker application list still uses the live pipe with no time limit. Move it to the timed request already used for Apply-on-iPhone coin checks.
- [ ] **7. Home Alerts badge:** homepage still listens on the live pipe for unread counts. If that hang is silent, the badge stays wrong even when Alerts itself is fine. One-shot or poll like Alerts. (Chat unread is not on the home menu.)
- [x] **8. Support inbox:** this page is live in the menu. Ticket list/thread still uses the live pipe (not the Alerts-style load). Timed request, same rule as Gigs Manager. Broadcasts / notice cards that already share the Alerts path can stay. **(2026-09-17: iPhone timed load. Peter has 5 resolved tickets, all already read → Old Messages.)**
- [ ] **9. Post a gig / edit a gig:** confirm save and return-to-manager on the mini. Writes that hang leave a “it posted but I can’t see it” loop next to Wave 1.
- [ ] **10. Category listing fallback:** if the timed listing request fails, **do not** fall through to the live pipe on any iPhone (today only iOS 15 blocks that fall-through). Retry the timed request or show empty/error.
- [ ] **11. Open a gig + Apply:** already on the timed path for all iPhones. Regression-smoke on the mini (open, apply, coin count). Do not change 20/10.

## Wave 3 — Owner smoke only (no GISUGO build until it fails)

Rider skipping setup is **closed**: that Facebook is already Peter. Peter will try a Facebook that is **not** linked to Peter or Operations.

- [ ] **12. New Facebook on the mini:** create account → finish setup → Profile loads → log out → log in → Profile still loads.
- If that works: Wave 3 is done. Do not invent extra login routing.
- If that still skips setup or Profile still blanks for a brand-new Facebook: then it is a real routing bug, and we add a timed “does this account already exist?” check. Not before.

iOS 15 Facebook-app / device-code door stays as-is. Do not reopen iPhone 7 Apply as a launch gate.

## Wave 4 — Gig chat / Messages — parked

Not a clearance item. That page is hidden until a later PRO subscription. Do not ask Peter to test it. Do not spend a wave wiring it now.

## Wave 5 — Close the loop

- [ ] **13. Retire the two-gate model** once Waves 1–2 pass on the mini: one iPhone check, not “all iPhones” plus “only 15 and older.”
- [ ] **14. Homepage copy:** iOS 15 warning is about old OS / Facebook passkey. Do **not** tell people a newer iPhone will make GISUGO fully work until Wave 1 has passed on the mini.
- [ ] **15. Launch smoke matrix on the 13 mini (Safari), then one more iPhone if available:** Profile; Gigs Manager live + history; Alerts; Support inbox; My Applications; one category feed; open gig; Apply; Post. New Facebook if Peter has one (item 12). Android unchanged.

## Out of scope (do not fold into this list)

- Native app
- Ban / dummy deletes
- Launch Feed 20/10 numbers
- Unlinking Rider from Peter unless asked
- Inventing a Rider GISUGO profile that does not exist
- Gig-to-gig chat (`messages.html`) until PRO
- Wiring chat “for later” as part of this clearance unless Support work happens to share a helper — even then, no owner chat smoke
