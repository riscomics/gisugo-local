# Gigs Manager — one page per tab

> Status: **Not started.**
> Written: 2026-11-15.
> Scope: the six Gigs Manager tabs. Profile reviews are already shipped. View Applications row-cap and the saved application count stay for later. Admin suspended and banned lists stay parked.
> Rule: finish a step, mark it audited, then start the next one. Do not skip ahead.
> Do not merge two sides into one list. Each tab is one query.

## Locked choices

- One page rule on a computer, Android, iPhone, and iPad. First paint is 20. The next ask is 15 after the last gig shown. A short page means there are no more. iPhone and iPad keep the timed web request. That request uses this page, not the old download of 200 unsorted gigs.
- The six tabs stay separate. Nothing is merged.

| Tab the person sees | Who | Statuses | Order |
|---|---|---|---|
| LISTINGS | the poster | `active`, `paused`, `expired` | ending soonest first (`scheduledEnd` ascending). This is the cold load in `loadListingsContent`. It is not `datePosted`. |
| HIRING | the poster | `hired`, `accepted` | `datePosted` descending. The tab does not sort again. |
| COMPLETED (customer) | the poster | `completed` | `completedAt` descending. Most recently finished first. |
| OFFERS | the hired worker | `hired` | `datePosted` descending. Today this tab has no sort. The page needs one, and this is that order. |
| WORKING | the hired worker | `accepted` | `datePosted` descending. The tab does not sort again. |
| COMPLETED (worker) | the hired worker | `completed` | `completedAt` descending. |

- A gig you posted is the customer side only, even if you are also the hired worker. HIRING and the customer COMPLETED tab keep it. WORKING, OFFERS, and the worker COMPLETED tab do not. After a hired-worker page returns, drop a gig whose `posterId` is this person. If that drop leaves the page short and more exist, ask for the next page.
- The badge is the real count when the first page is the whole tab. When that page is full, the badge shows that more exist. Do not read the rest of the tab to count it. Do not add a stored counter.
- Opening Gigs Manager may ask for the first 20 of each tab so the six badges can be painted. It does not ask for a second page until that tab is scrolled. The visible tab reuses the first page already fetched for its badge.
- LISTINGS still runs the existing pending-application count, capped at 500, when that tab is shown. The badge refresh does not run that count.
- A button that only needs one gig reads that gig. It does not download a tab.
- `new-post.js` and `new-post.html` are unlinked. Do not change them.

## Micro tasklist

- [ ] **1. Confirm the map below, including the field check.** No code change in this step. Read production only far enough to count, per tab, gigs that are missing the order field, and LISTINGS gigs that would show today only because this person is the hired worker.
- [ ] **2. Audit step 1.** The six tabs, the orders, and the one-gig callers match the code. If any tab has a gig missing its order field, or LISTINGS has a hired-worker-only gig, stop. Do not write the page query until that row is decided.
- [ ] **3. Add only the indexes those six queries need.** No index for a merged list.
- [ ] **4. Audit step 3.** Each index is named against one tab. An index that no query uses is a fail.
- [ ] **5. Add one paged read per tab and use it on every device.** First 20, then 15. The cursor is that tab’s order field plus the gig id. iPhone uses the timed request with that same cursor.
- [ ] **6. Audit step 5.** Each tab is one query. Statuses and order match the table. A full page reports more. A short page reports done. Two gigs with the same order value do not skip or repeat. The old 200 dump is not on these paths. No query merges poster and hired worker.
- [ ] **7. Wire the six tabs, the badges, and the one-gig buttons.** Scroll appends the next page. The warm list for LISTINGS follows `scheduledEnd`, not `jobDate`.
- [ ] **8. Audit step 7.** A hidden tab’s second page is not fetched. Page 2 does not re-download page 1. A poster-and-worker gig stays on the customer tab only. Each one-gig button reads one document. `new-post.js` was not edited.
- [ ] **9. Audit on the live site.** For each tab, record how many gigs that person has and whether a second page was requested. If a tab has 20 or fewer, say so and still prove the end signal. Prove one cursor with a one-gig page followed by `startAfter`. Do not post, hire, or complete a gig to force a second page.

## Step 1 map (confirm before any edit)

**What each tab loads today**

- LISTINGS calls `JobsDataService.getAllJobs()`, which calls `getUserJobListings` for `active`, `paused`, and `expired`. That function downloads every gig this person posted and every gig where they were hired, then keeps those three statuses. `loadListingsContent` then sorts by `getListingEndTimeMs`: `scheduledEnd` when it is present, otherwise the date and end-time text. Ending soonest is first.
- HIRING calls `getAllHiredJobs()`, same dump, statuses `hired` and `accepted`, then keeps `role === 'customer'`. Order is `datePosted` descending from the dump. No second sort.
- Customer COMPLETED calls `getCompletedJobs()`. On a computer that is two unlimited queries, `status == completed` with `posterId`, and the same with `hiredWorkerId`, then keeps `role === 'customer'`, then sorts `completedAt` descending. On iPhone it uses the 200 dump and then sorts by `completedAt`.
- OFFERS calls `getOfferedJobsForWorker`. On a computer: `status == hired` and `hiredWorkerId`, no order. On iPhone: the 200 dump of every gig where they were hired, then keeps `hired`.
- WORKING calls `getAllHiredJobs()`, then keeps `role === 'worker'` and `status === 'accepted'`. Order is `datePosted` descending. A `hired` gig you have not accepted is OFFERS, not WORKING.
- Worker COMPLETED calls `getCompletedJobs()`, then keeps `role === 'worker'`, `completedAt` descending.

`getUserJobListings` sets `role` to customer when `posterId` is this person, otherwise worker. That is why a gig you both posted and worked stays on the customer tab.

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

- `new-post.js` also calls `getCompletedJobs` and `getAllHiredJobs`. Nothing links to `new-post.html`. Leave that file.
- The LISTINGS pending-application scan (`getPendingApplicationCountsByOwner`, stop at 500) stays. It is not the tab page.
- `fix-review-counts.html` and the old cleanup page are not part of this.

**Field check, before any index or query**

Count, read-only:

- LISTINGS-status gigs with no `scheduledEnd`.
- HIRING, OFFERS, and WORKING gigs with no `datePosted`.
- Both COMPLETED tabs’ gigs with no `completedAt`.
- Gigs in `active`, `paused`, or `expired` where this person is `hiredWorkerId` and is not `posterId`.

A missing order field disappears from an `orderBy` query. A hired-worker-only listing disappears from a poster-only query. Either count above zero stops the list before step 3.

## What each later audit must check

Use this on steps 4, 6, and 8, in addition to the step’s own checks.

- Name the live caller for that tab. A paged function nothing calls is not a pass.
- One first paint of one tab is one jobs query, at most 20 gig documents, plus the LISTINGS application-count scan only when LISTINGS itself is showing.
- No `onSnapshot` on that tab’s jobs query, and no download of every gig this person posted or worked.
- Android uses the same page function as a computer. The only device branch is the iPhone and iPad transport.
- A second page uses `startAfter` the last shown gig and does not request the first 20 again.
- `new-post.js` was not edited.
