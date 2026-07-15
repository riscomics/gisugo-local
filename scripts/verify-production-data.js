/**
 * Read-only production audit helper.
 * Run BEFORE reporting account/data/auth status — docs alone are not enough.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/verify-production-data.js summary
 *   node scripts/verify-production-data.js users-phone
 *   node scripts/verify-production-data.js users-auth     ← REQUIRED before any login-method claim
 *
 * Credentials (first match wins):
 *   1. Pass key path as third arg
 *   2. GOOGLE_APPLICATION_CREDENTIALS env var
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const PHONE_SYNTHETIC_EMAIL_DOMAIN = 'phone.gisugo.app';

const mode = (process.argv[2] || 'summary').toLowerCase();
const keyPathArg = process.argv[3];

function resolveKeyPath() {
  if (keyPathArg) return path.resolve(keyPathArg);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;
  return path.join(__dirname, 'github-action-gisugo1-key.json');
}

function initAdmin() {
  const keyPath = resolveKeyPath();
  try {
    if (keyPath) {
      const serviceAccount = require(keyPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } else {
      admin.initializeApp();
    }
  } catch (err) {
    console.error('❌ Could not load service-account key:', err.message);
    console.error('   Pass a key path as the third argument or set GOOGLE_APPLICATION_CREDENTIALS.');
    process.exit(1);
  }
}

function maskPhone(phone) {
  const s = String(phone || '').trim();
  if (!s) return '(empty)';
  if (s.length <= 4) return s;
  return s.slice(0, 3) + '***' + s.slice(-4);
}

function maskEmail(email) {
  const s = String(email || '').trim();
  if (!s) return '(empty)';
  const at = s.indexOf('@');
  if (at <= 1) return s;
  return s.slice(0, 2) + '***' + s.slice(at);
}

function isPhonePasswordCredential(email) {
  return String(email || '').endsWith('@' + PHONE_SYNTHETIC_EMAIL_DOMAIN);
}

function classifyAuthProviders(providerData) {
  const rows = (providerData || []).map((p) => ({
    providerId: p.providerId,
    email: p.email || '',
    phone: p.phoneNumber || '',
  }));

  const phonePassword = rows.find(
    (p) => p.providerId === 'password' && isPhonePasswordCredential(p.email)
  );
  const legacyEmailPassword = rows.find(
    (p) => p.providerId === 'password' && p.email && !isPhonePasswordCredential(p.email)
  );
  const legacyPhoneOtp = rows.find((p) => p.providerId === 'phone');

  return {
    rows,
    phonePasswordLinked: !!phonePassword,
    phonePasswordSyntheticEmail: phonePassword ? phonePassword.email : '',
    legacyEmailPasswordLinked: !!legacyEmailPassword,
    legacyEmailPasswordEmail: legacyEmailPassword ? legacyEmailPassword.email : '',
    legacyPhoneOtpLinked: !!legacyPhoneOtp,
    legacyPhoneOtpNumber: legacyPhoneOtp ? legacyPhoneOtp.phone : '',
  };
}

async function auditUsersPhone(db) {
  const usersSnap = await db.collection('users').get();
  console.log(`users total: ${usersSnap.size}\n`);

  const rows = [];
  for (const doc of usersSnap.docs) {
    const data = doc.data() || {};
    const name = data.fullName || data.displayName || '(no name)';
    const pubPhone = String(data.phoneNumber || '').trim();
    const privSnap = await db.collection('user_private').doc(doc.id).get();
    const privPhone = privSnap.exists
      ? String((privSnap.data() || {}).phoneNumber || '').trim()
      : '';

    rows.push({
      name,
      uid: doc.id,
      pubPhone,
      privPhone,
      status: privPhone
        ? 'OK'
        : pubPhone
          ? 'NEEDS_MIGRATION'
          : 'MISSING',
    });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));
  for (const row of rows) {
    console.log([
      row.status,
      row.name,
      `uid=${row.uid.slice(0, 12)}...`,
      `public=${maskPhone(row.pubPhone)}`,
      `private=${maskPhone(row.privPhone)}`,
    ].join(' | '));
  }

  console.log('\nSUMMARY:', JSON.stringify({
    total: rows.length,
    ok: rows.filter((r) => r.privPhone).length,
    needsMigration: rows.filter((r) => !r.privPhone && r.pubPhone).length,
    missing: rows.filter((r) => !r.privPhone && !r.pubPhone).length,
    legacyPublicCopy: rows.filter((r) => r.pubPhone).length,
  }, null, 2));
}

async function auditUsersAuth(db) {
  const usersSnap = await db.collection('users').get();
  console.log(`users total: ${usersSnap.size}`);
  console.log(`phone+password synthetic domain: *@${PHONE_SYNTHETIC_EMAIL_DOMAIN}\n`);
  console.log('RULE: providerId=password alone is NOT phone+password — check credential email.\n');

  const rows = [];
  for (const doc of usersSnap.docs) {
    const profile = doc.data() || {};
    const name = profile.fullName || profile.displayName || '(no name)';
    const privSnap = await db.collection('user_private').doc(doc.id).get();
    const privPhone = privSnap.exists
      ? String((privSnap.data() || {}).phoneNumber || '').trim()
      : '';

    const authUser = await admin.auth().getUser(doc.id);
    const auth = classifyAuthProviders(authUser.providerData);

    rows.push({ name, uid: doc.id, privPhone, auth, authEmail: authUser.email || '' });
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));

  for (const row of rows) {
    const phonePw = row.auth.phonePasswordLinked
      ? `YES (${maskEmail(row.auth.phonePasswordSyntheticEmail)})`
      : 'NO';
    const legacyEmail = row.auth.legacyEmailPasswordLinked
      ? `YES (${maskEmail(row.auth.legacyEmailPasswordEmail)})`
      : 'NO';
    const legacyOtp = row.auth.legacyPhoneOtpLinked
      ? `YES (${maskPhone(row.auth.legacyPhoneOtpNumber)})`
      : 'NO';

    console.log('---');
    console.log(`name: ${row.name}`);
    console.log(`uid: ${row.uid}`);
    console.log(`profile_phone_private: ${maskPhone(row.privPhone)}`);
    console.log(`auth_primary_email: ${maskEmail(row.authEmail)}`);
    console.log(`providers: ${row.auth.rows.map((p) => p.providerId).join(', ') || '(none)'}`);
    console.log(`phone_password_login: ${phonePw}`);
    console.log(`legacy_email_password: ${legacyEmail}`);
    console.log(`legacy_phone_otp: ${legacyOtp}`);
  }

  console.log('\nSUMMARY:', JSON.stringify({
    total: rows.length,
    phonePasswordLinked: rows.filter((r) => r.auth.phonePasswordLinked).length,
    legacyEmailPassword: rows.filter((r) => r.auth.legacyEmailPasswordLinked).length,
    legacyPhoneOtp: rows.filter((r) => r.auth.legacyPhoneOtpLinked).length,
    profilePhoneOnFile: rows.filter((r) => r.privPhone).length,
    canPhonePasswordLoginToday: rows.filter((r) => r.auth.phonePasswordLinked).length,
  }, null, 2));
}

async function auditSummary(db) {
  const collections = ['users', 'user_private', 'jobs', 'applications', 'notifications', 'support_requests'];
  console.log('Production Firestore counts (gisugo1):\n');
  for (const name of collections) {
    const snap = await db.collection(name).get();
    console.log(`  ${name}: ${snap.size}`);
  }
  console.log('\nNext:');
  console.log('  node scripts/verify-production-data.js users-phone');
  console.log('  node scripts/verify-production-data.js users-auth   (required before login-method claims)');
}

async function run() {
  initAdmin();
  const db = admin.firestore();

  if (mode === 'users-phone') {
    await auditUsersPhone(db);
    return;
  }
  if (mode === 'users-auth') {
    await auditUsersAuth(db);
    return;
  }
  if (mode === 'summary') {
    await auditSummary(db);
    return;
  }

  console.error(`Unknown mode "${mode}". Use: summary | users-phone | users-auth`);
  process.exit(1);
}

run().catch((err) => {
  console.error('FAILED:', err.code || '', err.message);
  process.exit(1);
});
