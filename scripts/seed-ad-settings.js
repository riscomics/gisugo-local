/**
 * One-time seed for Ad Placement (Phase 6) — adSettings/global.
 *
 * Copies the live listing trial cards (listing.js AD_TRIAL_CONFIG) into the
 * admin panel shape so the first public read matches what feeds already show.
 * Does not use the panel's single localStorage sample (offer-verify-launch).
 *
 * Safety: DRY-RUN by default. Pass --apply to write. Refuses to overwrite
 * an existing doc (use the dashboard Reset after persist ships).
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/seed-ad-settings.js
 *   node scripts/seed-ad-settings.js --apply
 *
 * Credentials (first match wins):
 *   1. Positional key path (after --apply, if present)
 *   2. GOOGLE_APPLICATION_CREDENTIALS
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const keyPathArg = args.find((a) => a !== '--apply');

function resolveKeyPath() {
  if (keyPathArg) return path.resolve(keyPathArg);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;
  return path.join(__dirname, 'github-action-gisugo1-key.json');
}

try {
  const keyPath = resolveKeyPath();
  if (keyPath) {
    const serviceAccount = require(keyPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else {
    admin.initializeApp();
  }
} catch (err) {
  console.error('Could not load service-account key:', err.message);
  process.exit(1);
}

const db = admin.firestore();

function toPanelAd(listingAd) {
  const action = listingAd.action || {};
  let panelAction;
  if (action.type === 'open_video_popup') {
    panelAction = {
      type: 'open_video_popup',
      target: action.target || '',
      youtubeEmbed: action.target || '',
      poster: action.poster || listingAd.imageSrc || '',
      aspectRatio: action.aspectRatio || ''
    };
  } else if (action.type === 'share') {
    panelAction = {
      type: 'share',
      title: action.title || '',
      text: action.text || '',
      url: action.url || '',
      target: action.url || ''
    };
  } else if (action.type === 'open_modal') {
    const modalId = action.modalId || String(action.target || '').replace(/^#/, '');
    panelAction = {
      type: 'open_modal',
      target: modalId ? `#${modalId}` : '',
      modalId
    };
  } else {
    const url = action.url || action.target || '';
    panelAction = { type: 'navigate', target: url, url };
  }

  return {
    id: listingAd.id,
    type: listingAd.type,
    subtype: listingAd.subtype || '',
    status: 'active',
    imageSrc: listingAd.imageSrc,
    altText: listingAd.altText || listingAd.id,
    badgeText: listingAd.badgeText || '',
    weight: 100,
    maxImpressions: 0,
    maxClicks: 0,
    currentImpressions: 0,
    currentClicks: 0,
    startAt: '',
    endAt: '',
    action: panelAction
  };
}

// Mirrors listing.js AD_TRIAL_CONFIG (2026-08-18). Keep in sync with that
// fallback list until Phase 6 leftover audit closes.
const LISTING_TRIAL_ADS = [
  {
    id: 'video-safety-tips',
    type: 'video_popup',
    subtype: 'in_app_offer',
    imageSrc: 'public/images/womensafety.jpg',
    altText: 'Watch quick platform guide',
    badgeText: 'Platform Update',
    action: {
      type: 'open_video_popup',
      target: 'https://www.youtube.com/shorts/BVCmz9KnwWk',
      poster: 'public/images/womensafety.jpg',
      aspectRatio: '9:16'
    }
  },
  {
    id: 'sponsored-partner-spot',
    type: 'sponsored_external',
    subtype: 'sponsored_campaign',
    imageSrc: 'public/images/adsponsor.jpg',
    altText: 'Sponsored partner spotlight',
    badgeText: 'Sponsored',
    action: {
      type: 'navigate',
      url: 'https://www.RealinterfaceStudios.com'
    }
  },
  {
    id: 'video-platform-updates',
    type: 'video_popup',
    subtype: 'in_app_offer',
    imageSrc: 'public/images/updatesbanner.jpg',
    altText: 'Watch latest platform updates',
    badgeText: 'Platform Update',
    action: {
      type: 'open_video_popup',
      target: 'https://youtu.be/L2GUEZpNCsQ',
      poster: 'public/images/updatesbanner.jpg',
      aspectRatio: '16:9'
    }
  },
  {
    id: 'offer-verify',
    type: 'site_offer',
    subtype: 'in_app_offer',
    imageSrc: 'public/images/verify.png',
    altText: 'Get verified offer',
    badgeText: '',
    action: {
      type: 'navigate',
      url: 'profile.html'
    }
  },
  {
    id: 'offer-share-gisugo',
    type: 'site_offer',
    subtype: 'in_app_offer',
    imageSrc: 'public/images/sharebanner.jpg',
    altText: 'Share GisuGo with your network',
    badgeText: '',
    action: {
      type: 'share',
      title: 'Check out GisuGo',
      text: 'Browse local gigs and opportunities on GisuGo.',
      url: 'https://www.Gisugo.com'
    }
  }
];

const SEED_AD_SETTINGS = {
  enabled: true,
  frequencyCards: 6,
  maxAdsPerSession: 6,
  startAfterCards: 0,
  allowTailAd: true,
  allowEmptyStateAd: true,
  rotationMode: 'random',
  zones: {
    listing_feed_inline: true,
    profile_logout_slot: true,
    gig_detail_post_customer: true
  },
  ads: LISTING_TRIAL_ADS.map(toPanelAd)
};

async function main() {
  const ref = db.collection('adSettings').doc('global');
  const snap = await ref.get();

  if (snap.exists) {
    console.log('adSettings/global already exists — nothing to seed. Current ads:');
    const data = snap.data() || {};
    const ads = Array.isArray(data.ads) ? data.ads : [];
    console.log(ads.map((ad) => ad && ad.id).filter(Boolean).join(', ') || '(none)');
    return;
  }

  console.log(apply
    ? 'Seeding adSettings/global from listing trial cards...'
    : 'DRY RUN — would seed adSettings/global with:');
  console.log(JSON.stringify({
    enabled: SEED_AD_SETTINGS.enabled,
    frequencyCards: SEED_AD_SETTINGS.frequencyCards,
    zones: SEED_AD_SETTINGS.zones,
    adIds: SEED_AD_SETTINGS.ads.map((ad) => ad.id)
  }, null, 2));

  if (!apply) {
    console.log('\nRe-run with --apply to write this for real.');
    return;
  }

  await ref.set({
    ...SEED_AD_SETTINGS,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'seed-script'
  });
  console.log('Seeded adSettings/global with', SEED_AD_SETTINGS.ads.length, 'ads.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
