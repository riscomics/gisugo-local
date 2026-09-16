/**
 * One-time backfill for the Admin Dashboard's Gigs Analytics counter docs
 * (platform_analytics/gigs, platform_analytics/applications).
 *
 * Why this is needed: the Cloud Functions that maintain these docs going
 * forward (syncGigAnalyticsCountersOnCreate / syncApplicationAnalyticsCountersOnCreate
 * / syncGigCompletedVolumeOnUpdate in functions/index.js) only fire on NEW
 * jobs/applications/completes AFTER they're deployed. Every gig/application
 * that already exists in Firestore needs to be counted once, here, to seed
 * the starting totals. This is a one-time full collection scan run from a
 * trusted script (Admin SDK), NOT a pattern the live app or dashboard ever
 * repeats — the whole point of the counter-doc design is that nothing scans
 * these collections after this.
 *
 * Safety: runs in DRY-RUN mode by default (reports computed totals, writes
 * nothing). Pass --apply to actually commit the seed write.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/backfill-platform-analytics.js            (dry run)
 *   node scripts/backfill-platform-analytics.js --apply    (writes)
 *   node scripts/backfill-platform-analytics.js --completed-only
 *   node scripts/backfill-platform-analytics.js --completed-only --apply
 *   node scripts/backfill-platform-analytics.js --apply [keyPath]
 *
 * --completed-only: scan jobs only and merge completedCount / completedValuePHP
 * onto platform_analytics/gigs. Does not rewrite posted/application/user totals
 * (those are historical increment-never-decrement counters).
 *
 * Credentials (first match wins):
 *   1. Pass key path as a positional arg (after flags, if present)
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const completedOnly = args.includes('--completed-only');
const keyPathArg = args.find((a) => a !== '--apply' && a !== '--completed-only');

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

function sanitizeKey(value, fallback) {
  const raw = String(value || '').trim();
  return raw || fallback;
}

function isCompletedGigStatus(status) {
  return String(status || '').trim().toLowerCase() === 'completed';
}

// Mirrors parseGigPricePHP() in functions/index.js — keep in sync.
function parseGigPricePHP(job) {
  if (!job || typeof job !== 'object') return 0;
  const raw = (job.agreedPrice != null && String(job.agreedPrice).trim() !== '')
    ? job.agreedPrice
    : job.priceOffer;
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.max(0, Math.round(raw));
  }
  const n = Number(String(raw || '').replace(/[₱,\s]/g, ''));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

// Mirrors bucketAgeGroup() in functions/index.js exactly -- keep in sync.
function bucketAgeGroup(dateOfBirthValue) {
  const raw = String(dateOfBirthValue || '').trim();
  if (!raw) return 'unknown';
  const birthDate = new Date(raw);
  if (Number.isNaN(birthDate.getTime())) return 'unknown';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 18) return 'unknown';
  if (age <= 25) return '18-25';
  if (age <= 40) return '26-40';
  if (age <= 59) return '41-59';
  return '60+';
}

// Mirrors bucketAccountType() in functions/index.js exactly -- keep in sync.
function bucketAccountType(userData) {
  const verification = (userData && userData.verification) || {};
  if (verification.businessVerified) return 'business';
  if (verification.proVerified) return 'pro';
  return 'new';
}

async function run() {
  console.log(apply ? '🚀 APPLY MODE — writes will be committed.' : '🔎 DRY RUN — no writes will be made (pass --apply to commit).');
  if (completedOnly) {
    console.log('📌 --completed-only: jobs scan + completedCount/completedValuePHP merge only.');
  }

  console.log('\nScanning jobs collection...');
  const jobsSnapshot = await db.collection('jobs').get();
  const gigsByCategory = {};
  const gigsByUseType = {};
  let totalPosted = 0;
  let completedCount = 0;
  let completedValuePHP = 0;
  const completedByCategory = {};
  const completedValueByCategory = {};

  jobsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const category = sanitizeKey(data.category, 'uncategorized');
    const gigUseType = sanitizeKey(data.gigUseType, 'Personal');
    totalPosted++;
    gigsByCategory[category] = (gigsByCategory[category] || 0) + 1;
    gigsByUseType[gigUseType] = (gigsByUseType[gigUseType] || 0) + 1;
    if (isCompletedGigStatus(data.status)) {
      const pesos = parseGigPricePHP(data);
      completedCount++;
      completedValuePHP += pesos;
      completedByCategory[category] = (completedByCategory[category] || 0) + 1;
      completedValueByCategory[category] = (completedValueByCategory[category] || 0) + pesos;
    }
  });

  console.log(`  Total jobs found: ${jobsSnapshot.size}`);
  console.log('  By category:', gigsByCategory);
  console.log('  By gig use type:', gigsByUseType);
  console.log(`  Completed gigs: ${completedCount}`);
  console.log(`  Completed volume PHP: ${completedValuePHP}`);
  console.log('  Completed by category (count):', completedByCategory);
  console.log('  Completed by category (PHP):', completedValueByCategory);

  if (completedOnly) {
    if (apply) {
      await db.collection('platform_analytics').doc('gigs').set({
        completedCount,
        completedValuePHP,
        completedByCategory,
        completedValueByCategory,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        completedSeededBy: 'backfill-platform-analytics.js'
      }, { merge: true });
      console.log('\n✅ platform_analytics/gigs completed volume maps merged.');
    } else {
      console.log('\n✅ Dry run complete — re-run with --completed-only --apply to merge these totals.');
    }
    return;
  }

  console.log('\nScanning applications collection...');
  const applicationsSnapshot = await db.collection('applications').get();
  const appsByCategory = {};
  let totalApplications = 0;

  // Build a jobId -> category lookup from the jobs we already scanned above,
  // so we don't issue a per-application read (applications don't store
  // category directly — same lookup the live Cloud Function trigger does,
  // just batched here since we already have every job in memory).
  const jobCategoryById = {};
  jobsSnapshot.docs.forEach((doc) => {
    jobCategoryById[doc.id] = sanitizeKey(doc.data().category, 'uncategorized');
  });

  applicationsSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    const jobId = String(data.jobId || '').trim();
    const category = jobCategoryById[jobId] || 'uncategorized';
    totalApplications++;
    appsByCategory[category] = (appsByCategory[category] || 0) + 1;
  });

  console.log(`  Total applications found: ${applicationsSnapshot.size}`);
  console.log('  By category:', appsByCategory);

  console.log('\nScanning users collection for Age Groups + Account Types + Regional Distribution...');
  const usersSnapshot = await db.collection('users').get();
  const usersByAgeGroup = {};
  const usersByAccountType = {};
  const usersByRegion = {};

  for (const doc of usersSnapshot.docs) {
    const data = doc.data();
    const ageGroup = bucketAgeGroup(data.dateOfBirth);
    const accountType = bucketAccountType(data);
    usersByAgeGroup[ageGroup] = (usersByAgeGroup[ageGroup] || 0) + 1;
    usersByAccountType[accountType] = (usersByAccountType[accountType] || 0) + 1;

    // Most pre-existing accounts predate this feature and will have no
    // security_metadata doc at all -- correctly falls into "unknown", same
    // as a brand-new signup that hasn't reached/completed the location
    // explainer yet.
    let region = 'unknown';
    try {
      const securitySnap = await db.collection('security_metadata').doc(doc.id).get();
      if (securitySnap.exists) {
        region = securitySnap.data().location?.region || 'unknown';
      }
    } catch (err) {
      // leave as 'unknown'
    }
    usersByRegion[region] = (usersByRegion[region] || 0) + 1;
  }

  console.log(`  Total users found: ${usersSnapshot.size}`);
  console.log('  By age group:', usersByAgeGroup);
  console.log('  By account type:', usersByAccountType);
  console.log('  By region:', usersByRegion);

  if (apply) {
    await db.collection('platform_analytics').doc('gigs').set({
      totalPosted,
      byCategory: gigsByCategory,
      byGigUseType: gigsByUseType,
      completedCount,
      completedValuePHP,
      completedByCategory,
      completedValueByCategory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seededBy: 'backfill-platform-analytics.js'
    });
    await db.collection('platform_analytics').doc('applications').set({
      totalApplications,
      byCategory: appsByCategory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seededBy: 'backfill-platform-analytics.js'
    });
    await db.collection('platform_analytics').doc('users').set({
      byAgeGroup: usersByAgeGroup,
      byAccountType: usersByAccountType,
      byRegion: usersByRegion,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      seededBy: 'backfill-platform-analytics.js'
    });
    console.log('\n✅ platform_analytics/gigs, /applications, and /users seeded.');
  } else {
    console.log('\n✅ Dry run complete — re-run with --apply to write these totals.');
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Backfill failed:', err);
    process.exit(1);
  });
