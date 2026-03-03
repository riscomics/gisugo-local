# Face Verification Option A Policy

## Decision

GISUGO uses **Option A** for Face Verification media access.

- `users.verification.facePosterUrl` and `users.verification.faceVideoUrl` are direct Firebase Storage download URLs.
- Access is **UX-gated** by product flow (profile trust view, hiring/offer decisions, hiring/working actions), not token-gated per request.

## Canonical Verification Fields

All client and backend logic must use only these fields:

- `verification.faceVerified` (boolean)
- `verification.facePosterUrl` (string)
- `verification.facePosterPath` (string)
- `verification.faceVideoUrl` (string)
- `verification.faceVideoPath` (string)
- `verification.verificationDate` (timestamp/string)
- `verification.status` (`none` | `face_verified` | `needs_reverify` | other existing verification status values)

Deprecated aliases (for example `faceThumbnailUrl`, `facePreviewUrl`, `videoUrl`) must not be used in runtime code paths.

## Performance Rule

UI modals and tab flows must not do expensive media discovery:

- No Storage folder scans (`listAll`) in user-facing modal open paths.
- No fallback probing loops for multiple candidate filenames during interaction.
- Modal rendering should rely on canonical profile fields and return quickly.

## Integrity Rule

Face Verification save is atomic:

- Only set `faceVerified=true` when poster upload succeeds, video upload succeeds, and canonical fields are written.
- If any step fails, do not finalize a verified state.

If a profile has `faceVerified=true` but required media fields are missing, status should be corrected to `needs_reverify` until media is complete.
# Face Verification Option A Policy

This project uses **Option A** for Face Verification media.

## Contract

- Public profile verification fields are canonical:
  - `verification.faceVerified` (boolean)
  - `verification.status` (`face_verified` / `needs_reverify` / etc.)
  - `verification.facePosterUrl`
  - `verification.facePosterPath`
  - `verification.faceVideoUrl`
  - `verification.faceVideoPath`
  - `verification.verificationDate`
- UI reads these fields directly and must not rely on legacy aliases.

## Access model

- Face media URLs are direct URLs in profile data.
- Access control is primarily **UX-gated navigation**, not signed URL token gating.
- Storage rules enforce authenticated read and owner/admin write/delete.

## Non-goals in Option A

- No client-side folder scans (`listAll`) during normal UX flows.
- No hidden fallback probes that dynamically search storage paths in modals.
- No hybrid tokenized path unless explicitly approved as a future model change.

## Performance guardrail

- Confirm and hiring modals must open from profile metadata only.
- Thumbnail rendering and watch actions must be deterministic from canonical fields.

## Change control

- Any shift away from Option A requires explicit product approval and a documented migration plan.
