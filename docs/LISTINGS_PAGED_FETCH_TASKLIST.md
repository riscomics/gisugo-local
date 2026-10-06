# Category listings — download a page, not the whole category

> Status: **Spec only. Do not build until Peter says start.**
> Written: 2026-10-06
> No query change, no new database indexes, and no deploy came with this file.
> Live web is the north star. The phone app copies this only after the website proves it.

## What is wrong today

Opening a category (Transporter, and every other one) downloads **every live gig in that category**, then draws 20 cards, then 15 more as you scroll.

The 20 and the 15 only control how many cards are drawn. They do not make the download smaller. They do not make the first card appear sooner. They do not lower the database bill.

Each downloaded gig is a paid database read, every time someone opens that category, and again when they change city, region, or Personal/Business. Photos are a separate storage cost. Off-screen photos mostly wait. The gig records (title, price, date, photo address) do not.

At about 34 Transporter gigs this felt acceptable on a decent connection (~2 seconds, ~105 KB) and already struggled on a weak one. Empty categories feel instant because there is nothing to download. That is not proof this stays fine at hundreds or thousands.

This was a shortcut so the site would not need extra database indexes. The shortcut was never flagged as “every visitor pays for every live gig in the category.” The card batches were what got tested. That is the blindside.

## What must stay the same

The first 20 cards after the rebuild must be the same 20 a person sees today, for the same filters:

- Default place is Cebu, Cebu City. A chosen region and city still apply.
- Personal / Business applies only when that filter is on. “GIG TYPE” means both.
- Skip gigs whose end time has already passed. A gig with no date still shows.
- Order is soonest start, then soonest end.
- When Launch Feed is ON (the live default): gigs with under 20 applications come first, then gigs with 20 or more, on the same scroll, with no heading and no divider. The busy gig stays on the list. It is not hidden.
- When Launch Feed is OFF: no second group. Soonest start only. Applying stops at 10 applications. Do not change the numbers 20 or 10.
- Cards use the small photo. The gig page uses the large photo.
- The phone app does not get its own version of this. It keeps copying today’s full download until the website version is proven, then it copies the new page size, sort, and filters.

A shortcut that says “download any 20” will show the wrong 20. Do not ship that.

## Why the database cannot do this on today’s fields

The order people see is worked out on the phone or computer after the full list arrives. The end time is text. “Expired” is calculated, not stored. “20 or more applications” is a split of an already-sorted list. The database cannot hand back “the first 20 on screen” until those facts are stored in a form it can sort.

## Work, in order

Do these in order. Do not skip to the new download before old gigs have the new facts, or the first page will lie.

### 1. Store a real start time on every gig

When a gig is posted or edited, save a real start timestamp built from the gig date plus the start time. Keep writing the date and time text the screens already show. The new field is for sorting only.

Name it in the job record as `scheduledStart`.

### 2. Mark gigs finished on the server when their time has passed

Today a finished gig can still be “live” in the database. The category page downloads it and then hides it.

Add a scheduled pass that sets those gigs off `active` once the end time has passed. After that, the category download does not include them.

Until that pass exists, do not try to filter “already ended” inside the paged download. The database cannot sort by start time and also filter on a calculated end time in the same question.

### 3. Store a busy / not-busy marker

When a gig’s application count crosses 20, store “busy.” If the count falls back under 20, store “not busy.” Apply already updates the count. The marker has to move in that same save.

Name it `feedGroup`: `0` = under 20, `1` = 20 or more.

Launch Feed OFF ignores this marker.

### 4. Fill in old gigs

Before the new download is turned on, backfill every existing gig:

- `scheduledStart` from the date and start time already saved
- `feedGroup` from the application count already saved
- any gig whose end time has already passed gets marked not live by the same rule as step 2

Write down how many gigs were updated, how many had no date, and how many were marked finished. Gigs with no date stay visible, matching today.

### 5. Switch the website download

Ask the database for the first 20 gigs that match the filters, already in screen order. When the person scrolls, ask for the next 15, starting after the last gig already shown.

The question includes:

- this category
- still live
- the selected region and city
- Personal or Business, only when that filter is on
- ordered by busy/not-busy, then start time, when Launch Feed is ON
- ordered by start time only, when Launch Feed is OFF

Changing city, region, or Personal/Business starts again at the first 20 for that filter. It must not download the rest of the category first.

Keep the 2-minute “show what I saw a moment ago” memory if it still helps, but a fresh visit must not download the whole category behind it.

### 6. Indexes

Add them only in this build, with the new download, not before.

- Launch Feed ON: category, live/not live, region, city, busy marker, start time
- Launch Feed OFF: the same without the busy marker
- Personal/Business filter: the same plus that field

The admin/rules deploy owns these indexes. Do not add them during a docs-only pass.

### 7. Phone app

Leave the app on today’s full download until the website tests below pass. Then copy the same first-20 / next-15, the same sort, and the same filters. No second design in the app.

## How Peter tests it

Do this on the live website after the website build is deployed. Use Transporter (Hatod). Keep the known busy gig in the picture: “Deliver expo kiosk canopy parts to Mall loading dock” (20 applications, still live, belongs in the bottom group).

Before the new download is turned on, write down the first 20 titles on Transporter for Cebu City, both types, Launch Feed ON. Note which gig is the first one in the bottom group.

After it is on:

1. **Same first screen.** Cebu City, both types, Launch Feed ON. The first 20 titles match the list you wrote down. The canopy gig is still on the list, in the bottom group, not hidden and not at the top.
2. **Scroll.** The next cards are the next 15 in that same order. A busy gig does not jump above the quieter ones.
3. **Another city.** Pick a city that should have fewer or no gigs. The list changes. A quiet category still shows an empty state quickly.
4. **Personal / Business.** Turn one on. Only those gigs show, still soonest-first, still with the busy ones at the bottom of that filtered list.
5. **A gig that has ended.** It does not appear. It was marked finished on the server. It was not downloaded and then hidden.
6. **Crossing 20.** On a test gig you can add applications to, the 20th application moves it into the bottom group after a refresh. It stays live. Apply still works. The poster still gets the “review your applicants” alert.
7. **Launch Feed off.** Only if you choose to flip the setting for a short test: no bottom group, and Apply is blocked at 10. Turn it back ON when the test is done. Do not leave it off.
8. **Weak network.** On a poor connection, the first cards show without waiting for every live gig in the category. This is the failure you already saw at ~34 gigs.
9. **Post and edit.** A new gig and an edited gig get a start time and a not-busy marker, and show up in the right place.
10. **App.** Confirm the phone app was not changed in this deploy. It still uses the old full download until you explicitly copy the proven website behavior.

If the first 20 titles do not match the list you wrote down, the new download is wrong. Turn it back and fix it before any app work.
