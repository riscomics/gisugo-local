/**
 * One-time maintenance job: stamp `gigOwnerId` (= the gig's posterId) onto every
 * application document that is missing it.
 *
 * Why: new applications now record which gig owner they belong to, so the Firestore
 * read rule can be tightened to "applicant or gig owner only." Applications created
 * before that change have no owner stamp; this fills them in.
 *
 * Safe to run more than once — it skips applications that already have the correct
 * stamp and only touches the `gigOwnerId` field (pending stays pending, etc.).
 * Uses the Admin SDK, which bypasses security rules, so it stamps applications across
 * ALL accounts/gigs in a single pass.
 *
 * Usage (PowerShell):
 *   node scripts/backfill-gig-owner.js "C:\\Users\\risco\\gisugo-admin\\serviceAccountKey.json"
 *
 * Or set GOOGLE_APPLICATION_CREDENTIALS to the key path and run with no argument.
 */
const path = require('path');
const admin = require('firebase-admin');

const keyPathArg = process.argv[2];

try {
  if (keyPathArg) {
    const serviceAccount = require(path.resolve(keyPathArg));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    console.error('❌ No service-account key provided.');
    console.error('   Pass the key file path as an argument, e.g.:');
    console.error('   node scripts/backfill-gig-owner.js "C:\\\\Users\\\\risco\\\\gisugo-admin\\\\serviceAccountKey.json"');
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Could not load the service-account key:', err.message);
  process.exit(1);
}

const db = admin.firestore();

async function run() {
  console.log('🔎 Reading all applications...');
  const appsSnap = await db.collection('applications').get();
  console.log(`   Found ${appsSnap.size} application(s).\n`);

  const jobOwnerCache = new Map();
  async function getOwner(jobId) {
    if (!jobId) return null;
    if (jobOwnerCache.has(jobId)) return jobOwnerCache.get(jobId);
    const jobSnap = await db.collection('jobs').doc(jobId).get();
    const owner = jobSnap.exists ? (jobSnap.data().posterId || null) : null;
    jobOwnerCache.set(jobId, owner);
    return owner;
  }

  let stamped = 0;
  let alreadyCorrect = 0;
  let overwritten = 0;
  let orphanedSkipped = 0;

  let batch = db.batch();
  let batchCount = 0;

  for (const appDoc of appsSnap.docs) {
    const data = appDoc.data();
    const owner = await getOwner(data.jobId);

    if (!owner) {
      orphanedSkipped++;
      console.warn(`   ⚠️  Application ${appDoc.id}: parent job "${data.jobId || '(none)'}" not found — skipped.`);
      continue;
    }

    const existing = data.gigOwnerId;
    if (existing && existing === owner) {
      alreadyCorrect++;
      continue;
    }
    if (existing && existing !== owner) {
      overwritten++;
      console.warn(`   ⚠️  Application ${appDoc.id}: existing owner stamp differs from job owner — correcting.`);
    }

    batch.update(appDoc.ref, { gigOwnerId: owner });
    batchCount++;
    stamped++;

    if (batchCount >= 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log('\n✅ Backfill complete.');
  console.log(`   Newly stamped:        ${stamped}`);
  console.log(`   Already correct:      ${alreadyCorrect}`);
  console.log(`   Corrected (mismatch): ${overwritten}`);
  console.log(`   Orphaned (skipped):   ${orphanedSkipped}`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Backfill failed:', err);
    process.exit(1);
  });
