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
  suspendMessages: false,
  techDifficulties: false,
  maintenanceMode: false,
  maintenanceResumeTime: '',
  techWarningTitle: '',
  techWarningMessage: '',
  techWarningSeverity: 'medium',
  techWarningEta: '',
  maintenanceTitle: '',
  maintenanceMessage: '',
  maintenanceStartTime: '',
  maintenanceEndTime: '',
  maintenanceContact: '',
  allowRegistration: true,
  maxActiveGigs: 0,
  minGigPrice: 50,
  maxGigPrice: 10000,
  launchBucketOn: true
};

async function main() {
  const ref = db.collection('platform_settings').doc('general');
  const snap = await ref.get();

  let generalData = snap.exists ? snap.data() : null;
  if (!snap.exists) {
    console.log(apply ? '✏️  Seeding platform_settings/general with defaults...' : '🔍 DRY RUN -- would seed platform_settings/general with:');
    console.log(JSON.stringify(DEFAULT_SETTINGS, null, 2));
    if (apply) {
      await ref.set({
        ...DEFAULT_SETTINGS,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: 'seed-script'
      });
      generalData = DEFAULT_SETTINGS;
      console.log('✅ Seeded platform_settings/general.');
    }
  } else {
    console.log('ℹ️  platform_settings/general already exists.');
  }

  const publicPayload = {
    suspendGigs: !!(generalData && generalData.suspendGigs),
    suspendMessages: !!(generalData && generalData.suspendMessages),
    techDifficulties: !!(generalData && generalData.techDifficulties),
    techWarningTitle: String((generalData && generalData.techWarningTitle) || ''),
    techWarningMessage: String((generalData && generalData.techWarningMessage) || ''),
    techWarningSeverity: String((generalData && generalData.techWarningSeverity) || 'medium'),
    techWarningEta: String((generalData && generalData.techWarningEta) || ''),
    maintenanceMode: !!(generalData && generalData.maintenanceMode),
    maintenanceResumeTime: String((generalData && generalData.maintenanceResumeTime) || ''),
    maintenanceTitle: String((generalData && generalData.maintenanceTitle) || ''),
    maintenanceMessage: String((generalData && generalData.maintenanceMessage) || ''),
    maintenanceStartTime: String((generalData && generalData.maintenanceStartTime) || ''),
    maintenanceEndTime: String((generalData && generalData.maintenanceEndTime) || ''),
    maintenanceContact: String((generalData && generalData.maintenanceContact) || ''),
    allowRegistration: !generalData || generalData.allowRegistration !== false,
    maxActiveGigs: Number(generalData && generalData.maxActiveGigs) > 0 ? Number(generalData.maxActiveGigs) : 0,
    minGigPrice: Number(generalData && generalData.minGigPrice) >= 0 ? Number(generalData.minGigPrice) : 50,
    maxGigPrice: Number(generalData && generalData.maxGigPrice) > 0 ? Number(generalData.maxGigPrice) : 100000,
    launchBucketOn: !generalData || generalData.launchBucketOn !== false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  if (!apply) {
    console.log('🔍 DRY RUN -- would write platform_settings/public:');
    console.log(JSON.stringify({ ...publicPayload, updatedAt: '(server timestamp)' }, null, 2));
    console.log('\nRe-run with --apply to write this for real.');
    return;
  }

  await db.collection('platform_settings').doc('public').set(publicPayload, { merge: false });
  console.log('✅ Synced platform_settings/public.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
