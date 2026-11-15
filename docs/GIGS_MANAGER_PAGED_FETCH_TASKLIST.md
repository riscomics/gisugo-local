# Gigs Manager — one page per tab

> Status: **Steps 1–8 done 2026-11-15. Step 9 is the live cursor check after the indexes deploy.**
> Written: 2026-11-15.
> Scope: the six Gigs Manager tabs. Profile reviews are already shipped. View Applications row-cap and the saved application count stay for later. Admin suspended and banned lists stay parked.
> Rule: finish a step, mark it audited, then start the next one. Do not skip ahead.
> Each tab is its own query. A customer tab never also loads gigs someone else posted.

## Locked choices

- One page rule on a computer, Android, iPhone, and iPad. First paint is 20. The next ask is 15 after the last gig shown. A short page means there are no more. iPhone and iPad keep the timed web request. That request uses this page, not the old download of 200 unsorted gigs.
- The six tabs stay separate. Do not combine a customer tab’s query with a worker tab’s query.

| Tab the person sees | Whose gig | Statuses | Order |
|---|---|---|---|
| LISTINGS | you posted it | `active`, `paused`, `expired` | ending soonest first (`scheduledEnd` ascending). This is the cold load in `loadListingsContent`. It is not `datePosted`. |
| HIRING | you posted it | `hired`, `accepted` | `datePosted` descending. The tab does not sort again. |
| COMPLETED (customer) | you posted it | `completed` | `completedAt` descending. Most recently finished first. |
| OFFERS | someone else posted it, and they hired you | `hired` | `datePosted` descending. Today this tab has no sort. The page needs one, and this is that order. |
| WORKING | someone else posted it, and you accepted | `accepted` | `datePosted` descending. The tab does not sort again. |
| COMPLETED (worker) | someone else posted it, and you finished the work | `completed` | `completedAt` descending. |

`datePosted`, `scheduledEnd`, and `completedAt` are timestamps. All 89 live gigs have the timestamp their tab orders by.

- A person cannot work a gig they posted. Apply already rejects that. Do not add code for that case.
- While another page still exists, the badge is the number loaded so far followed by a plus. When the last page has been loaded, the badge is the exact number. Scrolling updates it. Do not read the unread gigs just to count them. Do not add a stored counter.
- Opening Gigs Manager asks for the first 20 of each of the six tabs, including the role that is not on screen, so every badge can be painted. It does not ask for a second page until that tab is scrolled. The visible tab reuses the first page already fetched for its badge.
- LISTINGS still runs the existing pending-application count, capped at 500, when that tab is shown. The badge refresh does not run that count.
- A button that only needs one gig reads that gig. It does not download a tab.
- `new-post2.html` is the live post page. This list does not change it. `new-post.html` and `new-post.js` were abandoned more than a year ago. Do not change them, and do not point anything back at them.

## Micro tasklist

- [x] **1. Confirm the map below, including the field check.** No code change in this step. Read production only far enough to count gigs that are missing the order field for their tab.
- [x] **2. Audit step 1.** The six tabs, the orders, and the one-gig callers match the code. If any tab has a gig missing its order field, stop. Do not write the page query until that row is decided.
- [x] **3. Add only the indexes those six queries need.** No index for a merged list.
- [x] **4. Audit step 3.** Each index is named against one tab. An index that no query uses is a fail.
- [x] **5. Add one paged read per tab and use it on every device.** First 20, then 15. The cursor is that tab’s order field plus the gig id. iPhone uses the timed request with that same cursor.
- [x] **6. Audit step 5.** Each tab is one query. Statuses and order match the table. A full page reports more. A short page reports done. Two gigs with the same order value do not skip or repeat. The old 200 dump is not on these paths. A customer tab does not also query gigs where this person was hired.
- [x] **7. Wire the six tabs, the badges, and the one-gig buttons.** Scroll appends the next page. The warm list for LISTINGS follows `scheduledEnd`, not `jobDate`.
- [x] **8. Audit step 7.** A hidden tab’s second page is not fetched. Page 2 does not re-download page 1. Each one-gig button reads one document. `new-post.js` and `new-post.html` were not edited. `new-post2.html` was not edited either.
- [ ] **9. Audit on the live site.** For each tab, record how many gigs that person has and whether a second page was requested. If a tab has 20 or fewer, say so and still prove the end signal. Prove one cursor with a one-gig page followed by `startAfter`. Do not post, hire, or complete a gig to force a second page.

## Step 1 map (confirm before any edit)

**What each tab loads today**

- LISTINGS calls `JobsDataService.getAllJobs()`, which calls `getUserJobListings` for `active`, `paused`, and `expired`. That function downloads every gig this person posted and every gig where they were hired, then keeps those three statuses. `loadListingsContent` then sorts by `getListingEndTimeMs`: `scheduledEnd` when it is present, otherwise the date and end-time text. Ending soonest is first.
- HIRING calls `getAllHiredJobs()`, same dump, statuses `hired` and `accepted`, then keeps `role === 'customer'`. Order is `datePosted` descending from the dump. No second sort.
- Customer COMPLETED calls `getCompletedJobs()`. Today, on a computer, that is two unlimited queries (`posterId` and `hiredWorkerId`, both `status == completed`), then it keeps the rows you posted and sorts `completedAt` descending. On iPhone it uses the 200 dump and then sorts by `completedAt`. The new page is only the poster row in the table above.
- OFFERS calls `getOfferedJobsForWorker`. On a computer: `status == hired` and `hiredWorkerId`, no order. On iPhone: the 200 dump of every gig where they were hired, then keeps `hired`.
- WORKING calls `getAllHiredJobs()`, then keeps `role === 'worker'` and `status === 'accepted'`. Order is `datePosted` descending. A `hired` gig you have not accepted is OFFERS, not WORKING.
- Worker COMPLETED calls `getCompletedJobs()`, then keeps `role === 'worker'`, `completedAt` descending.

`getUserJobListings` labels a row customer when you posted it, and worker when someone else posted it and hired you. Apply already refuses a poster who tries to apply to their own gig.

**Badges**

`updateTabCounts` calls `getAllJobs`, `getAllHiredJobs`, `getCompletedJobs`, and `getOfferedJobs`, then uses the filtered lengths. That is the full download. The listings call in that function passes `skipLiveApplicationCounts: true`.

**One-gig callers. These must not depend on a paged array.**

- `handleCompleteJob` downloads every hired gig to read `hiredWorkerName`.
- `handleRelistJob` downloads every hired gig to read the worker name and the status.
- `handleResignJob` downloads every hired gig to read `posterName`.
- The completion-feedback submit downloads every completed gig to find the one just completed.
- The completed-relist branch downloads every completed gig to copy that one gig.
- View Applications, when the price on the card is missing, downloads every listing to find that one gig.

**Not this list**

- `new-post.js` also calls `getCompletedJobs` and `getAllHiredJobs`. That file and `new-post.html` were abandoned more than a year ago. `new-post2.html` is the live post page. Leave both abandoned files alone.
- The LISTINGS pending-application scan (`getPendingApplicationCountsByOwner`, stop at 500) stays. It is not the tab page.
- `fix-review-counts.html` and the old cleanup page are not part of this.

**Field check, before any index or query**

Count, read-only:

- LISTINGS-status gigs with no `scheduledEnd`.
- HIRING, OFFERS, and WORKING gigs with no `datePosted`.
- Both COMPLETED tabs’ gigs with no `completedAt`.
A missing order field disappears from an `orderBy` query. A count above zero stops the list before step 3.

## What each later audit must check

Use this on steps 4, 6, and 8, in addition to the step’s own checks.

- Name the live caller for that tab. A paged function nothing calls is not a pass.
- One first paint of one tab is one jobs query, at most 20 gig documents, plus the LISTINGS application-count scan only when LISTINGS itself is showing.
- No `onSnapshot` on that tab’s jobs query, and no download of every gig this person posted or worked.
- Android uses the same page function as a computer. The only device branch is the iPhone and iPad transport.
- A second page uses `startAfter` the last shown gig and does not request the first 20 again.
- `new-post.js`, `new-post.html`, and `new-post2.html` were not edited.

## Step 2 audit (2026-11-15)

89 jobs. Statuses: 52 active, 3 accepted, 32 completed, 1 hired, 1 reported. No paused and no expired right now. The reported gig is not on these tabs.

Missing `scheduledEnd` on listing statuses: 0. Missing `datePosted` on hired or accepted: 0. Missing `completedAt` on completed: 0. Every `datePosted` is a timestamp. The page queries were allowed to proceed.

The six tab filters match the code. The one-gig buttons were still downloading a whole tab. `new-post.js` is the abandoned caller and was left alone.

## Step 4 audit (2026-11-15)

Five indexes, each used:

- LISTINGS: `posterId`, `status`, `scheduledEnd` ascending.
- HIRING: `posterId`, `status`, `datePosted` descending.
- OFFERS and WORKING: `hiredWorkerId`, `status`, `datePosted` descending. One index, two tabs, same order field.
- Customer COMPLETED: `posterId`, `status`, `completedAt` descending.
- Worker COMPLETED: `hiredWorkerId`, `status`, `completedAt` descending.

## Step 6 audit (2026-11-15)

`getGigsManagerPage` is the read. `fetchGigsTabPage` is the live caller for every tab. Poster tabs query `posterId`. Worker tabs query `hiredWorkerId`. A full page of 20 sets more. A shorter page does not. The cursor is that order field plus the gig id. iPhone and iPad use the timed request with the same limit and cursor. The old 200 dump is not on these tab paths.

## Step 8 audit (2026-11-15)

Opening Gigs Manager asks for the first 20 of each tab through `updateTabCounts`. A tab that is already loaded is not fetched again. Scroll asks for the next 15 and appends. The LISTINGS application-count scan runs when that tab is shown, not from the badge pass.

Complete, relist, resign, completion feedback, the completed-relist branch, and the missing-price applications fallback each read one gig with `getJobById`.

`new-post.js`, `new-post.html`, and `new-post2.html` were not edited. The warm LISTINGS paint sorts by `scheduledEnd`.

