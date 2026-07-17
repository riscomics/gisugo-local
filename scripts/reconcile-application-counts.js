/**
 * One-time / safe-to-rerun: set jobs.applicationCount = count of pending applications.
 *
 * Stale counts happen when applicants delete accounts or apps leave pending without
 * decrementing the denormalized field. Listing badges then lie; View Applications
 * already shows the truth (pending query).
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/reconcile-application-counts.js
 *   node scripts/reconcile-application-counts.js --dry-run
 *   node scripts/reconcile-application-counts.js "C:\\path\\to\\key.json"
 *
 * Credentials (first match wins):
 *   1. Key path as first non-flag arg
 *   2. GOOGLE_APPLICATION_CREDENTIALS
 *   3. scripts/github-action-gisugo1-key.json
 */
const path = require('path');
const admin = require(path.join(__dirname, '../functions/node_modules/firebase-admin'));

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const keyPathArg = args.find((a) => !a.startsWith('--'));

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
    process.exit(1);
  }
}

async function run() {
  initAdmin();
  const db = admin.firestore();

  console.log(dryRun ? '🔎 DRY RUN — no writes\n' : '🔧 Reconciling applicationCount on jobs…\n');

  const [jobsSnap, appsSnap] = await Promise.all([
    db.collection('jobs').get(),
    db.collection('applications').get(),
  ]);

  const pendingByJob = new Map();
  for (const doc of appsSnap.docs) {
    const data = doc.data() || {};
    if (data.status !== 'pending') continue;
    const jobId = data.jobId;
    if (!jobId) continue;
    pendingByJob.set(jobId, (pendingByJob.get(jobId) || 0) + 1);
  }

  let ok = 0;
  let fixed = 0;
  const changes = [];

  for (const jobDoc of jobsSnap.docs) {
    const jobId = jobDoc.id;
    const data = jobDoc.data() || {};
    const stored = Number(data.applicationCount);
    const current = Number.isFinite(stored) ? stored : 0;
    const correct = pendingByJob.get(jobId) || 0;

    if (current === correct) {
      ok++;
      continue;
    }

    changes.push({
      jobId,
      title: (data.title || '').slice(0, 40),
      from: current,
      to: correct,
      status: data.status || '?',
    });

    if (!dryRun) {
      await db.collection('jobs').doc(jobId).update({ applicationCount: correct });
    }
    fixed++;
  }

  console.log(`Jobs scanned: ${jobsSnap.size}`);
  console.log(`Applications scanned: ${appsSnap.size}`);
  console.log(`Pending applications: ${[...pendingByJob.values()].reduce((a, b) => a + b, 0)}`);
  console.log(`Already correct: ${ok}`);
  console.log(`${dryRun ? 'Would fix' : 'Fixed'}: ${fixed}\n`);

  if (changes.length) {
    console.log('Changes:');
    for (const c of changes) {
      console.log(`  ${c.jobId}  [${c.status}]  ${c.from} → ${c.to}  ${c.title || '(no title)'}`);
    }
  } else {
    console.log('No mismatches.');
  }
}

run().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
