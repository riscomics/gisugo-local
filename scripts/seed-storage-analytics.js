/**
 * One-time (re-runnable) seed for Overview Storage Usage
 * (platform_analytics/storage) — Admin Dashboard Phase 7 Ch 1.
 *
 * Lists the default Firebase Storage bucket once and overwrites the
 * aggregate doc. Dashboard never lists the bucket; this script is the
 * only allowed scan. Re-run after deploy of the Storage triggers, or
 * later to reconcile overwrite-drift.
 *
 * Safety: DRY-RUN by default. Pass --apply to write. Always overwrites
 * the doc (authoritative snapshot — not a merge).
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/seed-storage-analytics.js
 *   node scripts/seed-storage-analytics.js --apply
 *
 * Credentials (first match wins):
 *   1. Positional key path (after --apply, if present)
 *   2. GOOGLE_APPLICATION_CREDENTIALS
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */

const path = require("path");
const admin = require(path.join(__dirname, "../functions/node_modules/firebase-admin"));
const {
  buildStorageSnapshot,
  STORAGE_TYPE_KEYS,
  attachGrowthStamp
} = require(path.join(__dirname, "../functions/storage-analytics"));

const STORAGE_BUCKET = "gisugo1.firebasestorage.app";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const keyPathArg = args.find((a) => a !== "--apply");

function resolveKeyPath() {
  if (keyPathArg) return path.resolve(keyPathArg);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;
  return path.join(__dirname, "github-action-gisugo1-key.json");
}

try {
  const keyPath = resolveKeyPath();
  const init = { storageBucket: STORAGE_BUCKET };
  if (keyPath) {
    init.credential = admin.credential.cert(require(keyPath));
  }
  admin.initializeApp(init);
} catch (err) {
  console.error("Could not load service-account key:", err.message);
  process.exit(1);
}

const db = admin.firestore();
const bucket = admin.storage().bucket(STORAGE_BUCKET);

function formatBytes(bytes) {
  const n = Math.max(0, Number(bytes) || 0);
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 ** 3)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 ** 2)).toFixed(1)} MB`;
  if (n >= 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

async function main() {
  console.log(apply ? "APPLY — will overwrite platform_analytics/storage" : "DRY-RUN — no write");
  console.log("Bucket:", STORAGE_BUCKET);

  const [files] = await bucket.getFiles();
  const listed = files.map((file) => ({
    name: file.name,
    size: Number((file.metadata && file.metadata.size) || 0)
  }));
  const snapshot = buildStorageSnapshot(listed);

  console.log(`Objects listed: ${listed.length}`);
  console.log(`Countable: ${snapshot.totalFiles} files / ${formatBytes(snapshot.totalBytes)}`);
  STORAGE_TYPE_KEYS.forEach((key) => {
    const row = snapshot.byType[key];
    console.log(`  ${key}: ${row.files} files / ${formatBytes(row.bytes)}`);
  });

  if (!apply) {
    console.log("Re-run with --apply to write the snapshot.");
    process.exit(0);
  }

  const existing = await db.collection("platform_analytics").doc("storage").get();
  const prev = existing.exists ? existing.data() || {} : {};
  await db.collection("platform_analytics").doc("storage").set({
    totalBytes: snapshot.totalBytes,
    totalFiles: snapshot.totalFiles,
    byType: snapshot.byType,
    growth: attachGrowthStamp(prev.growth, prev.totalBytes, snapshot.totalBytes),
    seededAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log("Wrote platform_analytics/storage.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
