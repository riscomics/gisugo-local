# iOS Legacy Device Compatibility Note (Observed 2026-03-12)

## Scope
- Document known issues seen on older iOS devices before implementation work.
- No code changes are included in this note.

## Devices Reported
- iPad mini (older model) running Safari.
- iPhone SE / older iPhone class running Safari.

## Reported Symptoms

### 1) iPad mini layout issue
- On GISUGO pages, header appears disproportionately large.
- View is dominated by top header/logo area, reducing usable content area.
- Same device displays other websites normally, which suggests a GISUGO-specific responsive/layout bug.

### 2) iPhone older-model data-loading instability
- Pages that depend on Firebase/Firestore data sometimes stall on loading animations.
- Behavior is inconsistent:
  - Sometimes category pages load and render 20+ cards correctly.
  - Other times category pages (including some with little/no data) remain stuck on loaders.
- This points to runtime/state/compatibility edge cases rather than simple memory capacity limits.

## Current Hypotheses (No Fix Applied Yet)

### Header/viewport rendering on older Safari
- Older iOS Safari text autosizing and viewport handling may be inflating header dimensions.
- Header layout scripts/CSS may rely on viewport calculations that are unstable on legacy Safari.
- Shared responsive styles may not be applied consistently across all pages/components.

### Firestore initialization/query lifecycle fragility on older Safari
- IndexedDB/persistence behavior can be unstable on older iOS Safari.
- Initialization race conditions may leave loaders visible when data flow fails or times out.
- Error/empty-state code paths may not consistently clear loading overlays.

## Why This Is Likely App-Side
- Repro is specific to GISUGO behavior and Firebase-backed flows.
- Device/browser can render other websites normally.
- Intermittency and category-dependent behavior align with app lifecycle/race handling issues.

## Investigation Plan for Separate Work Session

1) **Header/Responsive Audit (legacy Safari)**
- Verify viewport meta + `text-size-adjust` behavior.
- Audit header size rules and any JS-driven resize calculations.
- Compare old-device Safari computed styles against modern device baseline.

2) **Firebase/Firestore Init Hardening**
- Audit persistence initialization for legacy iOS fallback behavior.
- Add safe fallback path when persistence or initialization degrades.
- Ensure initialization failures do not leave unresolved loading state.

3) **Loader Lifecycle Reliability**
- Guarantee hide/resolve behavior on success, empty data, timeout, and error branches.
- Add guard rails so one stalled promise cannot block full-page UI forever.

4) **Targeted QA Matrix**
- Foreground/background navigation tests on legacy iPhone/iPad Safari.
- Multiple category pages (high data + zero/low data).
- Cold start, refresh, and repeated tab/category switching.

## Risk Notes
- These issues can impact first impression and perceived reliability on older Apple devices.
- Fixes should be surgical to avoid regressions on modern devices.
- Prefer compatibility guards/fallbacks over broad architecture changes in first pass.

## Decision Status
- Documented only.
- Implementation deferred to a separate dedicated chat/task.
