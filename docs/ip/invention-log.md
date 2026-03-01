# GISUGO Invention Log

Purpose: Maintain a lightweight, dated technical record of platform mechanics and new feature design decisions.

Usage:
- Keep this file as the primary working log.
- At each major milestone, export a PDF snapshot and store it under `docs/ip/snapshots/YYYY-MM-DD/`.
- For planned features, mark `Status: Planned (not implemented)`.
- After shipping, update the same entry to `Status: Implemented` and add commit/release references.

---

## Entry 001 - Platform Baseline Mechanics

- Entry ID: `GIS-INV-001`
- Date (UTC): `2026-03-01T00:00:00Z`
- Status: `Baseline (implemented before this entry date)`
- Scope: `Whole platform (high-level mechanics)`

### Problem/Need
Create a dated baseline of currently implemented platform mechanics before major trust-layer expansion.

### Technical Mechanics (Current Baseline)
- Authentication and onboarding flows (email, OAuth, profile completion gating).
- Marketplace lifecycle flows (post, apply, offer/hire, accept/reject, complete/relist/resign).
- Messaging and notification flows for transaction lifecycle updates.
- Existing trust layers and status messaging (`PRO`, `Business`, non-verified/new member state).
- Media handling for profile/job/chat images with client-side compression and cloud storage usage.

### Known Boundaries
- This entry describes current mechanics only.
- It does not claim novelty or exclusivity.
- It is intended as dated platform-state evidence for planning and IP review context.

### Evidence Links
- Repository path baseline: `C:/Users/risco/OneDrive/Desktop/gisugo-local`
- Supporting artifacts to attach later:
  - architecture notes
  - commit hashes
  - internal review notes

---

## Entry 002 - Face Verification Core Concept

- Entry ID: `GIS-INV-002`
- Date (UTC): `2026-03-01T00:00:00Z`
- Status: `Planned (not implemented)`
- Scope: `Trust layer extension`

### Problem/Need
Increase accountability and trust signals without blocking signup conversion.

### Proposed Mechanics
- Optional face verification at signup via short selfie video (2-3 seconds), with user speaking their name.
- Verification states visible in trust surfaces:
  - `UNVERIFIED`
  - `FACE VERIFIED`
- Non-public-by-default media policy with contextual sharing in relevant gig interactions.

### Product Positioning Constraint
- Transparency/accountability signal, not a guarantee of safety or identity certainty.

### Evidence Links
- Product direction notes and requirement discussions (internal).

---

## Entry 003 - Two-Way Trust Reminder Flow

- Entry ID: `GIS-INV-003`
- Date (UTC): `2026-03-01T00:00:00Z`
- Status: `Planned (not implemented)`
- Scope: `Hire/accept decision points`

### Problem/Need
Ensure informed decisions when either party is not face verified, without forcing platform lockouts.

### Proposed Mechanics
- Customer hiring unverified worker:
  - `Request Verification`
  - `Send Offer Anyway`
- Worker accepting offer from unverified customer:
  - `Request Verification`
  - `Accept Offer Anyway`
- Keep decisions non-blocking while logging user intent/action for product analytics.

### Evidence Links
- Interaction flow notes and modal behavior decisions (internal).

---

## Entry 004 - Face Video Capture and Guardrails

- Entry ID: `GIS-INV-004`
- Date (UTC): `2026-03-01T00:00:00Z`
- Status: `Planned (not implemented)`
- Scope: `Capture, media handling, and rollout controls`

### Problem/Need
Add lightweight trust media with minimal cost/performance impact.

### Proposed Mechanics
- Recording cap at 3 seconds with pre-submit playback/retake.
- Baseline media target for clarity/cost balance:
  - default around `640x480` with lower fallback where needed
- Re-upload control:
  - update allowed in profile with cooldown (example: once per 24 hours)
- Rollout controls:
  - feature flags
  - staged rollout
  - kill switch
  - metric thresholds for rollback

### Evidence Links
- Cost/planning notes and rollout strategy discussions (internal).

---

## Snapshot Record

Add one line whenever you export a PDF snapshot:
- `YYYY-MM-DD - Exported PDF snapshot - reason/milestone - file location`

