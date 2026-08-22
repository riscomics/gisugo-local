/**
 * Storage hygiene Ch 1–2 — list (and later delete) unreferenced
 * Firebase Storage objects. Dashboard never lists the bucket.
 *
 * Safety: DRY-RUN by default. Pass --apply only after the owner
 * reviews the KEEP / DELETE list. --apply deletes DELETE rows, then
 * overwrites platform_analytics/storage (same recount as the seed).
 *
 * Rules:
 *   profile / face / ID  — KEEP if folder UID is a live users/{uid}
 *   gig                  — KEEP if jobs/{jobId} exists OR a live
 *                          job thumbnail URL still points at the path
 *   chat_photos/         — DELETE (User Chats parked)
 *   support_photos/      — KEEP (ticket evidence)
 *   anything else        — KEEP
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/sweep-storage-orphans.js
 *   node scripts/sweep-storage-orphans.js --apply
 *
 * Credentials (first match wins):
 *   1. Positional key path (after --apply, if present)
 *   2. GOOGLE_APPLICATION_CREDENTIALS
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */

const path = require("path");
const admin = require(path.join(__dirname, "../functions/node_modules/firebase-admin"));
const {
  classifyStoragePath,
  isCountableStorageObject,
  buildStorageSnapshot,
  STORAGE_TYPE_KEYS
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

function extractPathFromUrl(url) {
  const match = String(url || "").match(/\/o\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function pathUid(objectName) {
  const parts = String(objectName || "").replace(/^\/+/, "").split("/");
  return parts[1] || "";
}

function gigJobId(objectName) {
  const parts = String(objectName || "").replace(/^\/+/, "").split("/");
  const leaf = parts[parts.length - 1] || "";
  return leaf.replace(/\.[^.]+$/, "");
}

function decideRow(file, liveUids, liveJobIds, referencedPaths) {
  const name = file.name;
  const size = file.size;
  const bucketKey = classifyStoragePath(name);

  if (name.startsWith("support_photos/")) {
    return { name, size, bucketKey, action: "KEEP", reason: "support evidence" };
  }
  if (name.startsWith("chat_photos/")) {
    return { name, size, bucketKey, action: "DELETE", reason: "parked chat leftover" };
  }
  if (bucketKey === "other") {
    return { name, size, bucketKey, action: "KEEP", reason: "unknown other — leave" };
  }

  if (bucketKey === "gig") {
    const jobId = gigJobId(name);
    if (liveJobIds.has(jobId)) {
      return { name, size, bucketKey, action: "KEEP", reason: `live job ${jobId}` };
    }
    if (referencedPaths.has(name)) {
      return { name, size, bucketKey, action: "KEEP", reason: "live thumbnail still points here" };
    }
    const uid = pathUid(name);
    const whose = liveUids.has(uid) ? "live user, unused file" : "deleted-UID folder";
    return { name, size, bucketKey, action: "DELETE", reason: `${whose}; no live job ${jobId}` };
  }

  const uid = pathUid(name);
  if (liveUids.has(uid)) {
    return { name, size, bucketKey, action: "KEEP", reason: `live user ${uid}` };
  }
  return { name, size, bucketKey, action: "DELETE", reason: `deleted UID ${uid || "(none)"}` };
}

function printGroup(title, rows) {
  console.log("");
  console.log(`==== ${title} (${rows.length}) ====`);
  if (!rows.length) {
    console.log("(none)");
    return;
  }
  rows.forEach((row) => {
    console.log(`${row.action.padEnd(6)}  ${formatBytes(row.size).padStart(7)}  ${row.name}  — ${row.reason}`);
  });
}

async function main() {
  console.log(apply ? "APPLY — will delete DELETE rows, then re-seed platform_analytics/storage" : "DRY-RUN — no deletes, no writes");
  console.log("Bucket:", STORAGE_BUCKET);

  const [usersSnap, jobsSnap] = await Promise.all([
    db.collection("users").get(),
    db.collection("jobs").get()
  ]);
  const liveUids = new Set(usersSnap.docs.map((doc) => doc.id));
  const liveJobIds = new Set(jobsSnap.docs.map((doc) => doc.id));
  const referencedPaths = new Set();
  jobsSnap.docs.forEach((doc) => {
    const storagePath = extractPathFromUrl((doc.data() || {}).thumbnail);
    if (storagePath) referencedPaths.add(storagePath);
  });

  const [files] = await bucket.getFiles();
  const listed = files
    .map((file) => ({
      name: file.name,
      size: Number((file.metadata && file.metadata.size) || 0)
    }))
    .filter((file) => isCountableStorageObject(file.name));

  const rows = listed
    .map((file) => decideRow(file, liveUids, liveJobIds, referencedPaths))
    .sort((a, b) => a.name.localeCompare(b.name));

  const keep = rows.filter((row) => row.action === "KEEP");
  const remove = rows.filter((row) => row.action === "DELETE");

  STORAGE_TYPE_KEYS.forEach((key) => {
    const group = rows.filter((row) => row.bucketKey === key);
    const del = group.filter((row) => row.action === "DELETE");
    const keepGroup = group.filter((row) => row.action === "KEEP");
    printGroup(`DELETE ${key.toUpperCase()}`, del);
    printGroup(`KEEP ${key.toUpperCase()}`, keepGroup);
  });

  const after = buildStorageSnapshot(keep.map((row) => ({ name: row.name, size: row.size })));
  const before = buildStorageSnapshot(listed);

  console.log("");
  console.log("==== SUMMARY ====");
  console.log(`Live users: ${liveUids.size}`);
  console.log(`Live jobs: ${liveJobIds.size}`);
  console.log(`Listed: ${listed.length}  KEEP: ${keep.length}  DELETE: ${remove.length}`);
  STORAGE_TYPE_KEYS.forEach((key) => {
    const now = before.byType[key];
    const next = after.byType[key];
    console.log(
      `  ${key}: ${now.files} → ${next.files} files / ${formatBytes(now.bytes)} → ${formatBytes(next.bytes)}`
    );
  });
  console.log(`  total: ${before.totalFiles} → ${after.totalFiles} files / ${formatBytes(before.totalBytes)} → ${formatBytes(after.totalBytes)}`);

  if (!apply) {
    console.log("");
    console.log("No files deleted. Re-run with --apply only after this list is approved.");
    return;
  }

  let deleted = 0;
  for (const row of remove) {
    await bucket.file(row.name).delete({ ignoreNotFound: true });
    deleted += 1;
    console.log("DELETED", row.name);
  }

  const [afterFiles] = await bucket.getFiles();
  const recount = buildStorageSnapshot(
    afterFiles.map((file) => ({
      name: file.name,
      size: Number((file.metadata && file.metadata.size) || 0)
    }))
  );
  await db.collection("platform_analytics").doc("storage").set({
    totalBytes: recount.totalBytes,
    totalFiles: recount.totalFiles,
    byType: recount.byType,
    seededAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`Deleted ${deleted} files. Re-seeded platform_analytics/storage (${recount.totalFiles} files / ${formatBytes(recount.totalBytes)}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
