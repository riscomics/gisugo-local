# Firebase Migration Prep (Persistence Warning)

This project currently uses Firebase Web SDK `10.7.0` compat scripts and `enablePersistence(...)`.

The warning shown in console is a **future deprecation notice**, not an active break.

## When Migration Is Required

Do the migration only when one of these is true:

- Firebase release notes state old persistence API was removed.
- App breaks after intentional Firebase SDK upgrade.
- Security/compliance requires upgrading Firebase SDK now.

If none of the above is true, do not migrate yet.

## Scope (Expected)

Typical scope for this project is small-to-medium:

- Update Firestore initialization/persistence setup in `public/js/firebase-config.js`.
- Keep data behavior unchanged.
- Run focused regression tests.

Estimated effort: ~1-3 hours including testing.

## Controlled Upgrade Steps

1. Create a dedicated branch for Firebase upgrade.
2. Upgrade Firebase SDK version intentionally (no accidental broad updates).
3. Replace deprecated persistence setup with the current recommended approach.
4. Verify no runtime console errors across key pages.
5. Run manual checks below before merge.

## Manual Test Checklist (Must Pass)

- `index.html`: loads without Firebase init errors.
- `profile.html`: profile loads, tab switching works, reviews load.
- Listing pages (e.g. `hatod.html`, empty category page): load and filter correctly.
- `dynamic-job.html`: job details load correctly.
- `messages.html` and `admin-dashboard.html` (when Firebase wiring is complete): no auth/persistence regression.
- Multi-tab behavior: open 2 tabs and confirm app remains functional.

## Rollback Plan

If regression appears:

1. Revert the migration commit/branch.
2. Redeploy previous stable build.
3. Re-run migration in staging with narrowed changes.

## Notes

- Frontend Firebase CDN scripts are already explicitly versioned in HTML.
- This repo should treat Firebase upgrades as scheduled maintenance, not ad-hoc changes.
