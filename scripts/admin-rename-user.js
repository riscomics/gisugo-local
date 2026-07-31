/**
 * Admin-approved name change — the correct way to rename a user.
 *
 * Why this script exists: self-service name edits are blocked (both in the
 * Edit Profile UI and server-side in `updateUserProfile()`), and there was
 * previously no tooling that changed a name correctly. A prior manual edit
 * (Firestore-only) left Firebase Auth's `displayName` stale forever, which
 * caused features that read the Auth copy (chat, some notifications) to
 * keep showing the OLD name indefinitely. See `firebase-auth.js`'s
 * `getFreshOwnDisplayName()` for the read-side fix; this script is the
 * write-side fix — it updates Firestore `users/{uid}.fullName` AND Firebase
 * Auth's `displayName` together, in one step, so they never drift again.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/admin-rename-user.js <uid> "New Full Name" [keyPath]
 *
 * Credentials (first match wins):
 *   1. Pass key path as third positional arg
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const uid = process.argv[2];
const newFullName = (process.argv[3] || '').trim();
const keyPathArg = process.argv[4];

if (!uid || !newFullName) {
  console.error('❌ Usage: node scripts/admin-rename-user.js <uid> "New Full Name" [keyPath]');
  process.exit(1);
}

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

// Naive split — good enough for the org-style "GISUGO Operations" case.
// Real person names with a "Firstname Lastname" shape split fine too.
function splitName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts[parts.length - 1] };
}

async function run() {
  console.log(`🔎 Looking up uid: ${uid}`);

  const [userDoc, authUser] = await Promise.all([
    db.collection('users').doc(uid).get(),
    admin.auth().getUser(uid)
  ]);

  if (!userDoc.exists) {
    console.error('❌ No Firestore users/{uid} document found for that uid.');
    process.exit(1);
  }

  const before = userDoc.data();
  console.log('\n--- BEFORE ---');
  console.log('Firestore fullName:  ', before.fullName || '(empty)');
  console.log('Firestore firstName: ', before.firstName || '(empty)');
  console.log('Firestore lastName:  ', before.lastName || '(empty)');
  console.log('Auth displayName:    ', authUser.displayName || '(empty)');

  const { firstName, lastName } = splitName(newFullName);

  await db.collection('users').doc(uid).update({
    fullName: newFullName,
    firstName: firstName,
    lastName: lastName,
    lastModified: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('\n✅ Firestore updated.');

  await admin.auth().updateUser(uid, { displayName: newFullName });
  console.log('✅ Firebase Auth updated.');

  const [afterDoc, afterAuth] = await Promise.all([
    db.collection('users').doc(uid).get(),
    admin.auth().getUser(uid)
  ]);

  console.log('\n--- AFTER ---');
  console.log('Firestore fullName:  ', afterDoc.data().fullName);
  console.log('Firestore firstName: ', afterDoc.data().firstName);
  console.log('Firestore lastName:  ', afterDoc.data().lastName);
  console.log('Auth displayName:    ', afterAuth.displayName);
  console.log('\n✅ Rename complete — both stores are in sync.');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Rename failed:', err);
    process.exit(1);
  });
