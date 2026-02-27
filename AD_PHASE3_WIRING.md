# Ad Placement Phase 3 -> Firebase Wiring Plan

## Current State (Implemented)

- Admin UI scaffold is available in `admin-dashboard.html` under `Ad Placement`.
- Local state is managed in `public/js/admin-dashboard.js` using:
  - `AD_SETTINGS_STORAGE_KEY`
  - `DEFAULT_AD_PANEL_SETTINGS`
  - `adPanelState`
- Feed/Profile/Gig detail runtime rendering is currently hardcoded in:
  - `public/js/listing.js`
  - `public/js/profile.js`
  - `public/js/dynamic-job.js`

## Target Firebase Model (v1)

### 1) Global ad config document

- Collection: `adSettings`
- Doc ID: `global`
- Fields:
  - `enabled: boolean`
  - `frequencyCards: number`
  - `maxAdsPerSession: number`
  - `startAfterCards: number`
  - `allowTailAd: boolean`
  - `allowEmptyStateAd: boolean`
  - `zones: { listing_feed_inline: boolean, profile_logout_slot: boolean, gig_detail_post_customer: boolean }`
  - `updatedAt: serverTimestamp`
  - `updatedBy: string`

### 2) Ad inventory collection

- Collection: `ads`
- Suggested fields:
  - `id: string` (same as doc id)
  - `status: 'active' | 'paused' | 'draft'`
  - `type: 'site_offer' | 'sponsored_external' | 'video_popup'`
  - `subtype: 'in_app_offer' | 'sponsor_paid'`
  - `imageSrc: string`
  - `altText: string`
  - `weight: number`
  - `targetZones: string[]`
  - `targetCategories: string[]` (`['all']` allowed)
  - `action: { type: string, target?: string, videoSrc?: string, poster?: string }`
  - `startAt: timestamp | null`
  - `endAt: timestamp | null`
  - `updatedAt: serverTimestamp`

## Runtime Adapter Plan

Create a single adapter module, e.g. `public/js/ad-config-service.js`:

1. `getAdGlobalSettings()`
2. `getActiveAds({ zoneId, category })`
3. `normalizeAdminAction(ad)` to map `target` into runtime action fields:
   - `navigate` -> `{ type: 'navigate', url: target }`
   - `open_modal` -> `{ type: 'open_modal', modalId/modalSelector: target }`
   - `open_video_popup` -> `{ type: 'open_video_popup', videoSrc: target }`

Then replace local config reads in:

- `listing.js` -> uses adapter for listing zone (`listing_feed_inline`)
- `profile.js` -> uses adapter for profile zone (`profile_logout_slot`)
- `dynamic-job.js` -> uses adapter for gig detail zone (`gig_detail_post_customer`)

## Rollout Sequence

1. Keep current local scaffold running (already done).
2. Wire admin save to Firestore (`adSettings/global` + `ads` docs).
3. Add adapter reads in runtime pages behind a feature flag.
4. Validate per-zone rendering with fallback to local defaults on read errors.
5. Enable Firebase mode for ads.
