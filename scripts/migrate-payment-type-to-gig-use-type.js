/**
 * One-time data migration: rename the `jobs` collection's `paymentType` field
 * to `gigUseType`, mapping the old two payment-type values to the new
 * gig-use-type concept:
 *
 *   "Per Job"  -> "Personal"
 *   "Per Hour" -> "Business"
 *
 * Any other/legacy value (e.g. old snake_case "per_job"/"per_hour", or a
 * missing field) defaults to "Personal". The old `paymentType` field is
 * removed from each migrated document so the collection doesn't carry both
 * the old and new field forever.
 *
 * Safety: runs in DRY-RUN mode by default (reports what it WOULD change,
 * writes nothing). Pass --apply to actually commit the writes.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/migrate-payment-type-to-gig-use-type.js            (dry run)
 *   node scripts/migrate-payment-type-to-gig-use-type.js --apply    (writes)
 *   node scripts/migrate-payment-type-to-gig-use-type.js --apply [keyPath]
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
const keyPathArg = args.find(a => a !== '--apply');

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

function mapToGigUseType(oldValue) {
  if (!oldValue) return 'Personal';
  const normalized = String(oldValue).trim().toLowerCase();
  if (normalized.includes('hour')) return 'Business';
  return 'Personal';
}

async function run() {
  console.log(apply ? '🚀 APPLY MODE — writes will be committed.' : '🔎 DRY RUN — no writes will be made (pass --apply to commit).');
  console.log('Scanning jobs collection for documents with a paymentType field...\n');

  const snapshot = await db.collection('jobs').get();

  let toMigrate = 0;
  let alreadyMigrated = 0;
  let noPaymentTypeAtAll = 0;
  const mappingCounts = { Personal: 0, Business: 0 };

  let batch = db.batch();
  let batchOps = 0;
  const commits = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const hasOldField = Object.prototype.hasOwnProperty.call(data, 'paymentType');
    const hasNewField = Object.prototype.hasOwnProperty.call(data, 'gigUseType');

    if (!hasOldField && hasNewField) {
      alreadyMigrated++;
      continue;
    }
    if (!hasOldField && !hasNewField) {
      noPaymentTypeAtAll++;
      continue;
    }

    const newValue = mapToGigUseType(data.paymentType);
    mappingCounts[newValue]++;
    toMigrate++;

    console.log(`  ${doc.id}: paymentType="${data.paymentType}" -> gigUseType="${newValue}"`);

    if (apply) {
      batch.update(doc.ref, {
        gigUseType: newValue,
        paymentType: admin.firestore.FieldValue.delete()
      });
      batchOps++;
      if (batchOps >= 450) {
        commits.push(batch.commit());
        batch = db.batch();
        batchOps = 0;
      }
    }
  }

  if (apply && batchOps > 0) {
    commits.push(batch.commit());
  }
  if (apply && commits.length > 0) {
    await Promise.all(commits);
  }

  console.log('\n--- SUMMARY ---');
  console.log(`Total jobs scanned:        ${snapshot.size}`);
  console.log(`Migrated (or would be):    ${toMigrate}  (Personal: ${mappingCounts.Personal}, Business: ${mappingCounts.Business})`);
  console.log(`Already on gigUseType:     ${alreadyMigrated}`);
  console.log(`No payment field at all:   ${noPaymentTypeAtAll}`);
  console.log(apply ? '\n✅ Migration applied.' : '\n✅ Dry run complete — re-run with --apply to write these changes.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  });
