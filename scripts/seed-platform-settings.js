/**
 * One-time seed for the Admin Dashboard's Settings doc
 * (platform_settings/general) -- Admin Dashboard Phase 5.
 *
 * Why this is needed: firestore.rules gives this doc PUBLIC read (index.html's
 * homepage video gate reads it for every visitor, logged in or not) but
 * isSuperAdmin()-only WRITE. If the doc doesn't exist yet, the client-side
 * fallback seed-on-first-read in firebase-db.js's getPlatformSettings() would
 * only succeed once an admin opens the Settings tab -- until then, every
 * anonymous homepage visitor's read would hit a missing doc, attempt (and
 * fail, permission-denied) to seed it themselves, and log a harmless but
 * noisy console warning. Running this once via the Admin SDK avoids that
 * entirely by seeding the doc before Phase 5 ships.
 *
 * Safety: runs in DRY-RUN mode by default (reports what it would write,
 * writes nothing). Pass --apply to actually commit. Refuses to overwrite an
 * existing doc (this is a seed, not a reset -- use the dashboard's own
 * "Reset to Defaults" button for that).
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/seed-platform-settings.js            (dry run)
 *   node scripts/seed-platform-settings.js --apply    (writes)
 *   node scripts/seed-platform-settings.js --apply [keyPath]
 *
 * Credentials (first match wins):
 *   1. Pass key path as a positional arg (after --apply, if present)
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var
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
  console.error('❌ Could not load service-account key:', err.message);
  process.exit(1);
}

const db = admin.firestore();

// Mirrors DEFAULT_SETTINGS in public/js/admin-dashboard.js -- kept in sync by
// hand since this only ever runs once (or after a deliberate reset).
const DEFAULT_SETTINGS = {
  suspendGigs: false,
  suspendChats: false,
  suspendMessages: false,
  suspendCoins: false,
  techDifficulties: false,
  maintenanceMode: false,
  maintenanceResumeTime: '',
  allowRegistration: true,
  requireEmailVerify: true,
  requirePhoneVerify: false,
  idVerifyThreshold: 500,
  autoBanThreshold: 5,
  deletionGracePeriod: 30,
  firstGigApproval: true,
  maxActiveGigs: 10,
  minGigPrice: 5,
  maxGigPrice: 10000,
  autoFlagKeywords: '',
  commissionRate: 15,
  showServiceFees: true,
  payoutFrequency: 'weekly',
  minPayoutAmount: 25,
  refundAutoApproval: 50,
  gCoinRate: 100,
  dailyCoinLimit: 1000,
  maxMessageLength: 2000,
  allowChatUploads: true,
  maxFileSize: 5,
  profanityFilter: true,
  spamThreshold: 10,
  loginAttemptLimit: 5,
  sessionTimeout: 60,
  require2FA: false,
  blockedIPs: '',
  emailNotifications: true,
  pushNotifications: true,
  flaggedAlertThreshold: 5,
  maintenanceLeadTime: 24,
  rateLimit: 100,
  searchResultsPerPage: 20,
  dataRetentionPeriod: 365,
  backupFrequency: 'daily',
  // showHomepageVideoForLoggedIn removed 2026-08-11 -- see admin-dashboard.js DEFAULT_SETTINGS
  featuredGigs: true,
  reviewsSystem: true,
  directMessaging: false,
  darkMode: true
};

async function main() {
  const ref = db.collection('platform_settings').doc('general');
  const snap = await ref.get();

  if (snap.exists) {
    console.log('ℹ️  platform_settings/general already exists -- nothing to seed. Current data:');
    console.log(JSON.stringify(snap.data(), null, 2));
    return;
  }

  console.log(apply ? '✏️  Seeding platform_settings/general with defaults...' : '🔍 DRY RUN -- would seed platform_settings/general with:');
  console.log(JSON.stringify(DEFAULT_SETTINGS, null, 2));

  if (!apply) {
    console.log('\nRe-run with --apply to write this for real.');
    return;
  }

  await ref.set({
    ...DEFAULT_SETTINGS,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: 'seed-script'
  });
  console.log('✅ Seeded platform_settings/general.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
