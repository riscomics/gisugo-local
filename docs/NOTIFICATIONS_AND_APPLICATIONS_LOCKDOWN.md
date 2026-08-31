# Notifications & Applications — Security Lockdown Scope

> Status: **Groundwork done · Full lockdown is Phase 12 (launch gate)**
> Last updated: 2026-08-28
> **Step 1 live-door map is in `docs/V1_HARDENING_TASKLIST.md` (Phase 12).**
> Apply / Hire / Gigs Manager Accept are the spine, not the whole list.
> Chat Accept/Reject is **retired** (owner 2026-08-29). One step at a time.
> READ THIS FIRST whenever notifications or application-access rules come up. It exists so
> the full scope is known up front and we never "discover walls" mid-change again.
>
> **Agent rule:** before citing counts, backfill status, or "what's deployed" from this doc,
> verify live Firestore + `firestore.rules` + `functions/index.js` in the repo. Use
> `node scripts/verify-production-data.js summary` and query `applications` for `gigOwnerId`
> stamps. See `AGENTS.md` § "verify production data."

---

## TL;DR
- The current Firestore rules let any *authenticated* user read all `applications` and all
  `notifications` (and create/update/delete notifications). This is a **moderate, non-UI,
  technical-only privacy gap** — exploitable only via direct API/dev-tools, never through the
  app's UI. That "not urgent" call was for a tester-only site. Public launch in weeks
  makes this the **Phase 12 launch gate**, not an afterthought.
- Tightening it is **not** a quick rule flip. The notification *delivery system* and several
  application flows are **cross-user by design** and would be denied by strict rules. Those
  pieces must move to Cloud Functions first.
- **Notifications are already half server-side** (push + counters run on the server today), so
  finishing the move is *completing an existing architecture*, not a rewrite.
- Decision **updated 2026-08-17:** this is **Phase 12**, the last build before full-platform
  QA and public launch. Do remaining product phases first. Ship functions + client while
  rules stay loose; prove Apply/Hire/Accept; then lock rules; then full QA. Do not mark
  V1 complete until Phase 12 ships. Keep the additive `gigOwnerId` groundwork (already shipped).

---

## What already runs server-side TODAY (functions/index.js)
- `sendPushOnNotificationCreate` — `onDocumentCreated('notifications/{id}')`: sends the push
  alert whenever a notification document is created.
- `syncNotificationCountersOnWrite` — `onDocumentWritten('notifications/{id}')`: keeps unread
  counters in sync on every notification write.
- Implication: every notification already costs ~2 function runs. Moving *creation* server-side
  adds ~1 more (~3 total). See "Cost" below.

## What is still done in the browser (the gap)
- `createNotification(recipientId, ...)` and helpers write notification docs **directly from the
  client into another user's inbox** (cross-user write).
- Dedup logic **reads and deletes other users' notifications** from the client.
- Application reads/writes for review/hire/accept/reject happen client-side against the loose rule.

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
4. **New composite indexes** (gigOwnerId-based) + index deploy.
   Index added 2026-08-31 (`gigOwnerId` + `jobId` + `appliedAt` desc).
   `getJobApplications` still uses `jobId` only until that index is ENABLED.
5. **Tighten rules**: applications read = applicant or gigOwner; enforce `gigOwnerId ==
   job.posterId` on create. Notifications read/update/delete = recipient only; create = server only.
6. **One `functions` deploy** (also clears the already-deleted `migrateLegacyProfilePhones`).
7. **Full lifecycle test across multiple accounts/devices** (apply → review → hire → accept →
   reject/withdraw → complete → delete, and that every alert still fires). Only the human can do this.

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
