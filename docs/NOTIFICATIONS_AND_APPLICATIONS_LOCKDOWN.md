# Notifications & Applications — Security Lockdown Scope

> Status: **SHIPPED (Phase 12).** Rules lock `9430a319` (2026-09-06). Gigs Manager
> prove 2026-09-05; lock smoke 2026-09-06–09. iPhone 7 REST Apply lock-smoke skipped
> 2026-09-10 (iOS 15 homepage warning).
> Last updated: 2026-09-10
> **Live-door map + prove log: `docs/V1_HARDENING_TASKLIST.md` (Phase 12).**
> Chat Accept/Reject is **retired** (owner 2026-08-29). Do not reopen lockdown unless
> a live `permission-denied` on a real Gigs Manager door requires it.
> READ THIS FIRST whenever notifications or application-access rules come up. It exists so
> the full scope is known up front and we never "discover walls" mid-change again.
>
> **Agent rule:** before citing counts, backfill status, or "what's deployed" from this doc,
> verify live Firestore + `firestore.rules` + `functions/index.js` in the repo. Use
> `node scripts/verify-production-data.js summary` and query `applications` for `gigOwnerId`
> stamps. See `AGENTS.md` § "verify production data."

---

## TL;DR
- **Locked.** A signed-in stranger cannot list everyone else's `applications` or
  `notifications`, and cannot create an inbox row from the client (`create: if false`).
  Cross-user creates go through `createUserAlert` / Accept sweep / `ownerRejectApplication`
  (Admin SDK). Apply still writes the worker's own application doc (SDK or iOS REST).
- Tightening was **not** a quick rule flip. Notification delivery and several application
  flows are cross-user by design; those writes moved to Cloud Functions first.
- Notifications were already half server-side (push + counters). Phase 12 finished that.
- **Shipped 2026-09-06/10.** Remaining work is Pre-launch QA in `docs/V1_HARDENING_TASKLIST.md`,
  not more lockdown. Keep the additive `gigOwnerId` groundwork.

---

## What already runs server-side TODAY (functions/index.js)
- `sendPushOnNotificationCreate` — `onDocumentCreated('notifications/{id}')`: sends the push
  alert whenever a notification document is created.
- `syncNotificationCountersOnWrite` — `onDocumentWritten('notifications/{id}')`: keeps unread
  counters in sync on every notification write.
- Implication: every notification already costs ~2 function runs. Moving *creation* server-side
  adds ~1 more (~3 total). See "Cost" below.

## What was done in the browser (the gap — now closed)
- `createNotification(recipientId, ...)` used to write notification docs **directly from the
  client into another user's inbox**. Live Gigs Manager doors now call `createUserAlert`.
  Retired chat Accept/Decline may still reference the old helper — Messages is out of the
  public menu; do not treat that as a lock-smoke door.
- Dedup for Apply/Hire runs on the clerk.
- Application review/hire/accept/reject: owner/applicant client updates where the rule
  allows; Accept sweep of *other* pending apps is `workerAcceptRejectOthers`.

---

## Complete cross-user flow map (the part that breaks under strict rules)

### Applications — broad reads (would be DENIED by a strict "applicant or gigOwner only" rule)
| Flow | Where | Run by |
|---|---|---|
| Apply: duplicate check (SDK path scans all apps for the job) | `firebase-db.js` ~1778 | worker |
| Apply: auto-pause pending count (fallback scan) | `firebase-db.js` ~1883 | worker |
| Owner views applicant list | `firebase-db.js` ~2125 (`getJobApplications`) | gig owner |
| Restore pending count | `firebase-db.js` ~2387 | worker |
| Pending count | `firebase-db.js` ~2784 | mixed |
| Reject-others read | `jobs.js` ~4351 | worker |
| Pending count | `jobs.js` ~4488 | owner |
> REST/iOS note: the apply-flow REST fallbacks mirror these; the duplicate-check REST path is
> already applicant-scoped, but the pending-count REST path is broad.

### Applications — cross-user writes (would be DENIED)
| Flow | Where | Who writes whose doc |
|---|---|---|
| Hire: set chosen applicant → accepted | `firebase-db.js` ~2201 | owner → applicant doc |
| **Worker accepts → mass-reject all other pending applicants** | `jobs.js` ~4351-4370 | **worker → other workers' docs** (hard blocker — must be a Cloud Function) |
| Void / relist / complete updates | `firebase-db.js` (relist/complete fns) | owner → applicant docs |
| Delete gig → delete all its applications | `firebase-db.js` ~1434-1438 | owner → applicant docs |

### Notifications — ALL creation is cross-user (would be DENIED by strict create/read rules)
- Every alert type is one user writing into another's inbox: `offer_sent` (owner→worker),
  `offer_accepted` / `offer_rejected` (worker→owner), `application_received` (worker→owner),
  hired / completed / resigned / contract_voided, and grouped "not selected" closure notices.
- Dedup: hire flow deletes the worker's stale `offer_sent` notifications
  (`firebase-db.js` ~2216); apply flow touches the owner's milestone/auto-pause notifications.

---

## What a proper lockdown requires (full scope — no surprises)
1. **Cloud Function: notification creation** — one callable (or a few) that all client
   `createNotification` call sites (~20) route through; carries the existing dedup logic.
2. **Cloud Function: worker-accept → reject-others** — the worker cannot touch other applicants'
   docs from the browser; this sweep must run server-side (with the closure notifications + coin
   releases it triggers).
3. **Refactor broad application reads** to be scoped: `applicantId == uid` (worker) or
   `gigOwnerId == uid` (owner). Auto-pause count must rely ONLY on the job's stored counter.
4. **Composite indexes** (gigOwnerId-based) + index deploy.
   Index added 2026-08-31 (`gigOwnerId` + `jobId` + `appliedAt` desc).
   `getJobApplications` uses that query (Phase 12 Step 5).
5. **Tighten rules** — **done (`9430a319`).** Applications read = applicant, gig poster
   (`get(job).posterId`), or admin; create stamps `gigOwnerId == job.posterId`.
   Notifications read = recipient (or admin); update = own `read` only; delete = own row;
   create = server only.
6. **Functions deploy** (also cleared the already-deleted `migrateLegacyProfilePhones`).
7. **Lifecycle prove** — Step 6 (rules open, 2026-09-05) + Step 7 lock smoke
   (2026-09-06–09) on Gigs Manager. iPhone 7 REST Apply skipped 2026-09-10.

## Already done (keep — do not revert)
- `gigOwnerId` stamped on new applications (both SDK + REST write paths).
- One-time backfill of existing applications (113 stamped; 2 orphaned skipped — apps whose parent
  gig was deleted; safe to delete later via `scripts/backfill-gig-owner.js` companion cleanup).

---

## Cost note
Moving creation server-side is ~cost-neutral: Firestore writes are identical; it adds ~1 function
run per notification on top of the ~2 that already fire. Cloud Functions free tier = 2M runs/mo.
Function runs are NOT the cost driver — Firestore reads/writes are. (The separate real cost risk
is the Admin Dashboard's real-time metrics — that needs its own counter-design study.)
