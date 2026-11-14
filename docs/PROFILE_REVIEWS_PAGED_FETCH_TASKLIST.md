# Profile reviews — one page at a time, on every device

> Status: **Not started.**
> Written: 2026-11-14.
> Scope: profile reviews only. Gigs Manager paging and the View Applications count split come after this list is done. Admin suspended and banned lists stay parked.
> Rule: finish a step, mark it audited, then start the next one. Do not skip ahead.
> A full history stays readable. The screen asks for the newest 20, then 15 more. It does not stop at 50, and it does not download every review on first open.

## Locked choices

- One page rule for a computer, Android, iPhone, and iPad. The iPhone and iPad keep the timed web request so the Firestore connection cannot hang. That request asks for the same page size and the same cursor. Android already uses the computer query today. It must use this page too.
- Newest first. First paint is 20. The next ask is 15 after the last review shown. A short page means there are no more. Same sizes as category listings (`initialBatchSize` 20, `loadMoreBatchSize` 15 in `listing.js`).
- Customer reviews and worker reviews stay separate lists.
- Only the role tab on screen is fetched. The other role loads when that tab is opened.
- A review card should not read the gig and the reviewer again. New reviews store the gig title, the gig link, and the reviewer photo at submit time. An older review that lacks those fields may still read them for that one card.
- The profile’s star average and review total stay the numbers already stored on the user. They are not recomputed from the cards on screen.

## Micro tasklist

- [ ] **1. Confirm the map below.** No code change in this step.
- [ ] **2. Audit step 1.** The map matches the code. Unused tools are marked unused. A missed live writer or reader is added before step 3.
- [ ] **3. Stamp the card fields on both live review writes.** Gig title, gig link, reviewer photo. Leave existing reviews as they are.
- [ ] **4. Audit step 3.** Both directions store the three fields. An old review is unchanged. The create rule accepts the extra fields. Submit does not add a new full-library read.
- [ ] **5. Add one paged review read and use it on every device.** First 20, then 15. Cursor is the last review’s time plus its id. iPhone uses the timed request with that same cursor. No listener. No full download.
- [ ] **6. Audit step 5.** Computer, Android, and iPhone ask for the same numbers. A full page reports more. A short page reports done. Two reviews with the same time do not skip or repeat. The read is one query. The index used is named.
- [ ] **7. Wire the profile screen to that read.** Visible role only. Scroll appends the next page. Cache remembers the cursor, not “this is the whole list.” Missing stamp fields fall back to one gig read and one reviewer read for that card.
- [ ] **8. Audit step 7.** Opening a profile does not fetch the hidden role. Page 2 does not re-download page 1. The star average still comes from the user record. An old unstamped review still renders. A stamped review does not do the fallback reads. The empty state still shows when a role has no reviews.
- [ ] **9. Audit on the live site.** Record which profile was opened, how many reviews that role has, and whether a second page was actually requested. If no role has more than 20 reviews, say so. Still prove the end signal on that short list, and prove the cursor query with a one-review page followed by `startAfter`. Do not invent reviews to force a second page.

## Step 1 map (confirm before any edit)

**Live writes.** These are the only two places that create a `reviews` document.

- `submitJobCompletionFeedback` in `public/js/jobs.js`. Customer reviews the worker. Called when a customer submits completion feedback, including the reuse from the later feedback path in the same file.
- The worker-reviews-customer branch in `public/js/jobs.js` (the `else` beside that reuse). Writes its own review document. It does not call `submitJobCompletionFeedback`.

Neither write stores the gig title, the gig link, or the reviewer photo. The profile looks those up afterward.

**Live reads.**

- `fetchUserReviews` in `public/js/profile.js`. On iPhone and iPad (`isIOSWebKitBrowserForDataPath`: iPhone, iPad, iPod, or a touch Mac) it calls `fetchReviewsViaFirestoreRest` with a hard 50 and a 10 second timeout. That REST helper caps any request at 100 and has no cursor. On a computer and on Android it runs `reviews` where `revieweeUserId` and `revieweeRole` match, ordered by `createdAt` descending, with no limit.
- After the review docs, each card reads the reviewer user (photo) and the gig (title and link), with a small cache so the same person or gig is not read twice inside that one fetch.
- `getOrFetchUserReviews` caches the finished array for the browser session under user plus role. A later open of that tab returns the cache and does not ask again.
- `prefetchProfileReviews` asks for both roles in the background after a profile loads, including on iPhone. That is two full downloads today.
- `populateCustomerReviews` and `populateWorkerReviews` replace the list on screen with whatever that fetch returned.

**Already in place. Do not add a second copy.**

- Firestore index on `reviews`: `revieweeUserId`, `revieweeRole`, `createdAt` descending. The page query starts from this index.
- `firestore.rules` on `reviews`: anyone may read. Create requires the existing keys (`reviewId`, `jobId`, `reviewerUserId`, `revieweeUserId`, `reviewerRole`, `revieweeRole`, `rating`, `feedbackText`) via `hasAll`, not `hasOnly`. Extra card fields are allowed. Rating must stay 1 through 5. Do not change this rule unless a real submit is rejected.
- The user document already stores `averageRating` and `totalReviews` on submit. The paged list must not replace those.

**Not the profile screen. Do not change them in this list.**

- `fix-review-counts.html`. It downloads every review document. No HTML or script links to it. It is still a file in the site, so a typed address can open it. Leave it. Do not call it from the profile.

## What each later audit must check

Use this on steps 4, 6, and 8, in addition to the step’s own checks.

- Name the live caller. A function that exists and is not called is not a pass.
- Count the reads for one first paint of the visible role: one review query, at most 20 review documents. Name any read beyond that and why it is there.
- Confirm there is no `onSnapshot` on `reviews`, and no `.get()` of the whole role or the whole collection from the profile.
- Confirm Android is on the same page function as a computer. The only device branch left is the iPhone and iPad transport (timed web request, same limit, same cursor).
- Confirm a second page uses `startAfter` the last shown review and does not request the first 20 again.
- Confirm `fix-review-counts.html` was not edited and is not linked.
