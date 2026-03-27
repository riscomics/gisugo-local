# iOS Data Path Risks (2026-03-27)

## Context

iOS WebKit devices (Safari and iOS Chrome) showed repeated Firestore SDK read timeouts on:

- listing/category reads
- dynamic job document reads
- user profile reads
- notifications/alerts streams

To stabilize alpha behavior, iOS now uses REST-first reads for key paths while desktop/non-iOS keeps SDK-first behavior where it is reliable.

## Medium Risk: Non-blocking Secondary Sync

`dynamic-job` now renders core data first, then runs secondary checks in background:

- `checkIfUserAlreadyApplied()`
- `loadCustomerRating()`

If those checks are slow, page still opens quickly, but button/rating can lag briefly.

Why acceptable now:

- core navigation no longer blocks for 10-45s
- duplicate apply protection remains enforced by backend data/rules

## Low Risk: REST Path Depends on Read Policy

iOS fallback paths rely on Firestore REST reads for:

- `jobs` docs/query
- `users` doc by ID
- `notifications` query by recipient

If Firestore rules are tightened later, these reads can fail until client logic is updated to match new policy.

Current compatibility:

- existing rules allow these reads in current app behavior

## Monitoring / Retest Triggers

Retest iOS listing + dynamic-job + profile + messages alerts immediately when:

- Firestore rules change
- auth/session model changes
- `firebase-db.js` fetch/subscribe internals are refactored
- iOS WebKit versions are targeted with new transport settings

## Performance Note

The "syncing status" UX on apply button is safe to add later; it is UI-only and does not increase network calls.
