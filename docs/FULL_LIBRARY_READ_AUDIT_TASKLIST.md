# Full-library download audit

> Status: **Later. Do this with the final review, not during the listings rebuild.**
> Written: 2026-10-06
> This file is the checklist. It is not a finished audit, and it is not a build.
> Do not “fix” items while walking the list. Write down what each screen downloads, then Peter decides what to change.

## Why this exists

Category listings download every live gig in that category, then only draw 20 cards. That was easy to miss because the cards looked paged and the lists were still small. The same kind of shortcut may exist on other screens. This pass is how we find them before a public crowd pays for them.

## What “explosive” means

A normal person opens one screen, and the app downloads an entire library: every user, every gig, every alert, or every message in the system.

Also write down the smaller version of the same mistake: one person’s own history with no cap (every gig they ever posted, every review, every alert), because that still grows without a ceiling. It is not the whole site, but it is the same habit.

A download that is capped (a page of 25, a thread of 50) is not this bug. Say so and move on.

## How to check one screen

For each item below, answer in writing:

- Which screen, and who can open it (every visitor, a signed-in person, or admin only)?
- What library does it download (gigs, applications, alerts, users, messages, reviews)?
- Is there a maximum, or does it take everything that matches?
- Does the cost grow with the whole site, or only with that one person’s history?
- Is the code actually used, or is it an old function nothing calls? Search for the function name being called. Unused code is not a live bill. Say “unused” instead of fixing it.
- One line: leave it, cap it later, or it is already capped.

Do not add indexes. Do not change queries in this pass.

## Already confirmed — handle in the listings tasklist, not here

Category pages download every live gig in that category. See `docs/LISTINGS_PAGED_FETCH_TASKLIST.md`.

## Check these next

These are first looks from 2026-10-06, not a verdict. Confirm each one against the code that actually runs.

### Admin overview — every user account

`getAdminAnalytics()` in `public/js/firebase-db.js` downloads the entire users library to count people. The admin dashboard calls it (`admin-dashboard.js`). Admin-only, so the public does not pay it, but the bill grows with every signup and it downloads full account records just to count them. A count does not need every record.

### Old “fix every gig’s application count” button

`fixApplicationCounts()` downloads every gig, then looks at applications for each one. It lives on `cleanup-duplicate-applications.html`. Confirm whether that page is linked from the live site or is only a leftover tool. If a person can open it and press the button, it is a full-library read.

### Gigs Manager — this person’s gigs

`getUserJobListings()` downloads every gig that person posted and every gig where they were hired. No page size. It does not download the whole market. It does grow with that person’s history. Confirm the live Gigs Manager path still uses this, including the iPhone timed load.

### Alerts

The alerts page people use, `getUserNotificationsPage()`, asks for one page at a time and caps that page (25, never more than 100).

An older function, `getUserNotifications()`, downloads every alert for that person and has no cap. A search on 2026-10-06 found it exported and found no screen calling it. Confirm it is still unused. If something calls it, that screen is uncapped.

### Profile reviews

On a computer, `fetchUserReviews()` downloads every review for that person in that role, with no cap, then reads the gig record once per review.

On an iPhone it stops at 50. Confirm that split is still true. Desktop is the one to watch.

### Messages

Messages inside one conversation are capped (`getThreadMessages()`, 50). The conversation list listeners are also capped. Gig chat stays parked. Do not build chat. Only confirm the cap is what would run if the page were opened, so we are not guessing.

### Admin suspended and banned lists

`getUserManagementSuspended()` downloads every suspended account and every banned account, with no page size. Admin-only. Fine while those lists are tiny. Write down that they are uncapped so they are not a surprise later.

### Deleting a gig’s photo

`otherLiveJobReferencesPath()` downloads every gig posted by that one person to see if another gig still uses the same photo file. One person, not the whole market. Note it. Do not treat it as the listings bug.

### Applications on one gig

View Applications and the listings count already limit how many application rows they scan (the listings count stops at 500 pending for that poster). Confirm the gig page and Gigs Manager “view applications” path are still limited to that one gig, not every application in the system.

## What this pass does not include

- Rebuilding category listings (its own tasklist)
- Native app behavior, until the website audit is the list native should copy
- Adding indexes or changing queries “while we are here”
