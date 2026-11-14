# Native-to-Web Port Audit — Batches A–D

> Status: **Audit run 2026-11-14.** Items 9 and 10 were not built. No fixes were made in this pass.

The port is Items 1–8 from the native app, shipped as four batches on 2026-11-12. Items 9 and 10 were judged to need no web change. They are included in Pass 1 only, so that judgment gets checked instead of assumed.

The November 12 re-audit of these batches looked at syntax, selectors, missing element IDs, and conflicts between files. `node --check` cannot see a call to a function that is not loaded on that page. That is how Item 5 shipped calling `escapeHtml` on the gig page, where that function does not exist. The gig page died for every category that has a pay note. One scripted run of that function would have thrown on the first category.

The `escapeHtml` crash on the gig page was fixed on 2026-11-14. This audit still re-runs that path, and it looks for the same class of miss everywhere else in the port.

## What shipped

| Batch | Commit | Items | Files |
|---|---|---|---|
| A | `fb038876` | 7, 8 | `public/js/dynamic-job.js`, `public/js/firebase-db.js`, `public/js/jobs.js`, `public/js/profile.js`, `dynamic-job.html`, `jobs.html`, `profile.html` |
| B | `ca030ba5` | 1 | `public/js/new-post2.js`, `public/js/listing.js`, `public/js/dynamic-job.js`, `public/js/jobs.js`, `new-post2.html`, `dynamic-job.html`, `jobs.html` |
| C | `24aca74c` | 4, 5, 6 | `public/js/category-guides.js`, `public/js/new-post2.js`, `public/js/dynamic-job.js`, `public/js/jobs.js`, `public/js/gig-overlays.js`, `new-post2.html`, `dynamic-job.html`, `jobs.html`, `public/css/new-post2.css`, `public/css/jobpage.css` |
| D | `7fc0890a` | 2, 3 | `public/js/new-post2.js`, `new-post2.html`, `public/css/new-post2.css` |

Item names:

1. Optional gig photo and 57-category artwork fallbacks.
2. Trilingual post wizard, plus 57 category placeholders, title tips, and the privacy note.
3. Mobile keyboard: Enter moves the wizard, and a Done pill sits under the description.
4. Price Guide box on the payment step, including the travel tip and the 50% shopper rule.
5. “How This Gig Works” card on the gig detail page.
6. Category rule box inside Hire and Accept disclaimers.
7. Worker resign copy for `terms_changed`.
8. Face-verification gate on Report Gig.
9. Inline face-verification gate versus redirect. No web change was claimed.
10. Secondary info and legal page headers. No web change was claimed.

## Pass 1 — Name check, per page

A function counts as available only when the HTML page that runs the caller loads a script that defines it, earlier in that page. “It exists somewhere in the repo” is a fail.

### [x] 1. Build the call list

Pass. Bare calls in the eight changed scripts were checked after comments and strings were removed. Leftover hits were method definitions, `Promise` resolve/reject, or words inside console text. No remaining call of the `escapeHtml` class: a name used on a page that does not load the file which defines it.

For each changed script above, list every function it calls that the same file does not define. Skip language builtins and the Firebase globals those pages already load (`firebase`, `document`, `window`).

### [x] 2. Check each page that loads that script

Pass. `dynamic-job.html` does not load `jobs.js`. `escapeHtml` is no longer called there. `getFirestore` comes from `firebase-config.js`, which loads earlier. `jobs.html` does not load `profile.js`. That is expected. `profile.html` loads `profile.js`, which defines its own `escapeHtml` and `sanitizeUrl`.

Pages to open for script order:

- `dynamic-job.html` loads `dynamic-job.js` and `category-guides.js`. It does not load `jobs.js`.
- `new-post2.html` loads `new-post2.js` and `category-guides.js`.
- `jobs.html` loads `jobs.js`, `gig-overlays.js`, and `category-guides.js`.
- `profile.html` loads `profile.js`.
- Listing pages load `listing.js`.

For each call, name the page, the caller, and the script that defines the callee. If no earlier script on that page defines it, that row is a fail. Record it. Do not fix it in this pass.

### [x] 3. Confirm Items 9 and 10

Pass. Commits `fb038876` through `7fc0890a` do not touch `face-intro-gate.js`, `support.html`, `updates.html`, `forum.html`, `termsofservice.html`, or `privacy.html`. Those items were not built. This audit did not build them.

Read the claimed no-change files (`face-intro-gate.js`, `support.html`, `updates.html`, `forum.html`, `termsofservice.html`, `privacy.html`) only far enough to say whether the port actually edited them. A silent edit is a finding. No web change, confirmed, is a pass.

## Pass 2 — Run the category data

Do this in one scripted run. Do not click through 57 categories by hand. Load `public/js/category-guides.js` and call the render used by each item below, once per category, for English, Bisaya, and Tagalog. A throw, an empty guide on a category that should have one, or a missing placeholder is a fail. Record the category and the language.

### [x] 4. Item 5 — gig detail card

Pass. `populateJobPriceGuide` completed for all 57 categories in English, Bisaya, and Tagalog (171 calls). Live check of the transporter gig `ENYtjsz4ZGVXx4tMJP7r` loaded on `dynamic-job.js?v=76` and showed the How This Gig Works card. Every category in the ported data has a pay note, so there is no category that exercises the hidden-card branch.

Call the gig-page price-guide render (`populateJobPriceGuide` in `dynamic-job.js`) with each category’s guide. This is the path that threw on `escapeHtml`. Confirm the fixed page completes for a category with a pay note and for a category without one.

### [x] 5. Item 4 — post payment guide

Pass. `renderNp2PriceGuide` completed for Step 4 and for edit/relist, 57 categories, 3 languages.

Call the Step 4 and edit/relist price-guide render in `new-post2.js` for each category and language.

### [x] 6. Item 6 — hire and accept rule box

Pass. `renderCategoryRuleBoxHtml` completed for customer and worker, 57 categories, 3 languages. No throw.

Call the rule-box render used by Hire and Accept (`gig-overlays.js` / `jobs.js`) for each category and language.

### [x] 7. Item 2 — wizard copy

Pass. Every category and language has a title placeholder, a title tip, and a description placeholder that includes that language’s privacy note.

For each category and language, resolve the placeholder, title tip, and privacy reminder the wizard shows. A missing string is a fail.

### [x] 8. Item 1 — artwork files

Pass. Listing, the gig page, the post page, and Gigs Manager use the same 57 paths. Each file exists with that exact filename case. `realtor` uses `Consultant.png` and `landscaper` uses `Gardner.png` on all four maps. The files exist.

For each of the 57 categories, confirm the fallback image path used by listing, the gig page, and Gigs Manager points at a file that exists under `public/images/`. A wrong-case filename on a case-sensitive host is a fail.

## Pass 3 — Short live pass

One walk of the paths a script cannot click. One category that has a guide, and one that does not, is enough. The category data was already executed in Pass 2.

### [x] 9. Post, edit, relist

Pass on the gate that was in this batch. Live `new-post2.html` shows “Gig Photo (Optional)” on post and on edit/relist. The file input is not required. The old blocker `if (!np2State.photoFile)` is gone. A gig was not submitted, edited, or relisted. That would write a live production gig.

On `new-post2.html`: post with a photo, post without a photo, edit, and relist a completed gig. Confirm the optional photo does not block posting, and a gig with no photo shows the category artwork on the listing and on the gig page.

### [x] 10. Gig page, hire, accept, resign, report

Gig page: pass, live, card visible. Hire, accept, and resign were not clicked. They need a signed-in session and would change a live gig. The rule-box render already ran for every category. Resign copy for `terms_changed` is present in `jobs.js` in English, Bisaya, and Tagalog, and the short label is in `profile.js`. Report Gig was not clicked. The button is on the page, and the handler calls `gisugoEnsureFaceIntro('report')` with `face-intro-gate.js` loaded earlier on that page.

Open one live gig that has a pay note and confirm the page finishes loading, including the How This Gig Works card. Open one gig with no pay note and confirm the card stays hidden and the page still loads. From Gigs Manager, open Hire and Accept far enough to see the category rule box. Resign with the `terms_changed` reason and confirm the updated copy. Report Gig and confirm the face-verification gate runs.

### [x] 11. Keyboard

Pass on presence. Live `new-post2.html` has `#np2DescriptionDoneBtn` (“Done ✓”) and `#editDescriptionDoneBtn`. Enter handlers for title, description search, and amount are in `new-post2.js`. Enter was not pressed through a phone-width wizard.

On a phone-width view of the post wizard, confirm Enter moves the step and the Done pill under the description closes the keyboard flow. This is Item 3.

## Record

Write the result under each box when the audit is assigned: pass, or the failing page, function, category, and language. Do not fix findings inside the audit pass. List them, then Peter assigns the fixes.

| Pass | Result | Notes |
|---|---|---|
| 1 Name check | Pass | No new missing-function crash. `escapeHtml` on the gig page is already fixed. |
| 2 Category data | Pass | 57 categories, 3 languages. Artwork files match, exact case. |
| 3 Live pass | Pass, with limits | Gig page and post page opened. No production gig was posted, hired, resigned, or reported. |

No fix is waiting. Items 9 and 10 stay unbuilt.
