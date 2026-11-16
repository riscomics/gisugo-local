# View Applications — one page of pending rows

> Status: **Not started.**
> Written: 2026-11-15.
> Scope: the View Applications panel on one gig. Gigs Manager paging and profile reviews are already shipped. Admin suspended and banned lists stay parked.
> Rule: finish a step, mark it audited, then start the next one. Do not skip ahead.
> The number saved on the gig is not the number of rows on screen.

## Locked choices

- One gig only. Pending only. Newest first (`appliedAt` descending).
- First paint is 20. The next ask is 15 after the last row shown. A short page means there are no more. A full page of 20 followed by an empty page is also the end.
- Computer, Android, iPhone, and iPad ask for the same page. iPhone and iPad keep the timed web request.
- The title uses the application count already stored on the gig. Do not write the page length back onto the gig. Do not change the listing-card count from this panel.
- The listings tab’s pending recount, capped at 500, stays where it is. This panel does not run it.
- New applications store `averageRating` and `totalReviews` from the profile already loaded at apply time. Old applications are not rewritten. A card that lacks those two fields may read that one applicant. A card that has them does not.
- Apply already rejects a poster applying to their own gig. Do not add code for that case.

## Micro tasklist

- [ ] **1. Confirm the map below.** No code change in this step.
- [ ] **2. Audit step 1.** The query, the count write, both apply writes, and the profile reads match the code.
- [ ] **3. Stamp `averageRating` and `totalReviews` on both live apply writes.** Use the profile read that already loads the name and photo. Leave old applications as they are.
- [ ] **4. Audit step 3.** Both writes store the two fields. Apply does not add a second profile read. The create rule allows the extra fields. No old application was rewritten.
- [ ] **5. Add the one index this page needs:** `gigOwnerId`, `jobId`, `status`, `appliedAt` descending.
- [ ] **6. Audit step 5.** That index is the one the pending page uses. An unused index is a fail.
- [ ] **7. Wire the panel to one paged read.** Pending only. 20 then 15. Cursor is `appliedAt` plus the application id. Scroll appends. The title stays the stored gig count.
- [ ] **8. Audit step 7.** One query, at most 20 application documents, on the first paint. No download of every application on the gig. No write of the page length. A stamped card does not read the applicant. The 500 listings recount was not changed.
- [ ] **9. Audit on the live site.** Do not apply, hire, or reject to force a second page. If the gig you open has 20 or fewer pending, say so and prove the end. If one gig has at least two pending, prove one `startAfter`. The canopy gig from the last log had 20 pending and 4 that are not pending. Use it only as a read.

## Step 1 map (confirm before any edit)

**What the panel does today**

- `getJobApplications` in `public/js/firebase-db.js` reads every application where `gigOwnerId` is the signed-in poster and `jobId` is that gig, ordered by `appliedAt` descending. No limit. No status filter. No iPhone branch.
- `getApplicationsForJob` in `public/js/jobs.js` keeps `status === 'pending'` after that download. The canopy gig log was 24 rows, 20 pending.
- The title is `Applications (N)` where N is that full pending length.
- If the gig is `active` or `paused` and the stored `applicationCount` differs, `persistJobApplicationCount` writes that pending length onto the gig, and the listing card is updated to the same number.

**Rating reads**

- The panel reads every pending applicant’s user document, then uses `averageRating` and `totalReviews` from the application when those keys exist. The profile read still happens for applicants who already have the keys.
- Apply already loads that profile for the name and photo, in `applyForJob`, for both the normal write and the iPhone web write. Neither write stores the rating or the review total.
- `isValidApplication` uses `hasAll` for `jobId`, `applicantId`, and `gigOwnerId`. Extra fields are allowed. Do not change the rule unless a real apply is rejected.

**Already in place. Do not add a second copy.**

- Index on `applications`: `gigOwnerId`, `jobId`, `appliedAt` descending. The new page also filters `status`, so this index is not enough. The new index is step 5.
- The listings pending recount (`getPendingApplicationCountsByOwner`, stop at 500) is not this panel.

## What each later audit must check

- Name the live caller. A paged function nothing calls is not a pass.
- First paint is one applications query, at most 20 documents, for that one gig, pending only.
- No `onSnapshot` on that query, and no `.get()` of every application on the gig.
- Android uses the same page function as a computer. The only device branch is the iPhone and iPad transport.
- A second page uses `startAfter` the last shown application and does not request the first 20 again.
- The gig document’s `applicationCount` is not written by this panel.
