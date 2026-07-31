/**
 * One-time bootstrap: grant the two primary accounts full ("super_admin")
 * access to the admin dashboard by creating their `admins/{uid}` records.
 *
 * This is the ONLY way to create the first admin(s) — firestore.rules only
 * lets an *existing* super admin write to the `admins` collection, so there
 * has to be a chicken-and-egg escape hatch via the Admin SDK (which bypasses
 * rules) to create the very first one(s). Safe to re-run; it just re-confirms
 * the same two records (uses `.set()` with merge, doesn't touch anything else).
 *
 * For any FUTURE admin (e.g. a limited "support" role account later), don't
 * add them here — copy this script's shape with the new uid/role, or build
 * the proper in-dashboard "manage admins" UI once one exists.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/bootstrap-primary-admins.js [keyPath]
 *
 * Credentials (first match wins):
 *   1. Pass key path as first argument
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const PRIMARY_ADMINS = [
  { uid: 'wHSQXBLgqsN9a7DPqDqat8958zw2', label: 'Peter J. Ang' },
  { uid: 'Y3UpEKlCeLT4VsvMX6RQoeRyj6h1', label: 'GISUGO Operations (formerly Android Samsung)' }
];

const keyPathArg = process.argv[2];

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

async function run() {
  for (const entry of PRIMARY_ADMINS) {
    const authUser = await admin.auth().getUser(entry.uid).catch(() => null);
    if (!authUser) {
      console.warn(`⚠️  Skipping ${entry.label} (${entry.uid}) — no matching Auth account found.`);
      continue;
    }

    await db.collection('admins').doc(entry.uid).set({
      role: 'super_admin',
      label: entry.label,
      grantedAt: admin.firestore.FieldValue.serverTimestamp(),
      grantedBy: 'bootstrap-script'
    }, { merge: true });

    console.log(`✅ ${entry.label} (${entry.uid}) is now a super_admin.`);
  }

  console.log('\n✅ Bootstrap complete.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Bootstrap failed:', err);
    process.exit(1);
  });
