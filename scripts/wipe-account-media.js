/**
 * Storage hygiene Ch 5 — Admin-SDK wipe of one account's media.
 * DRY-RUN by default. Does not touch support_photos/.
 * Permanently Ban must not use this.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/wipe-account-media.js --uid USER_ID
 *   node scripts/wipe-account-media.js --uid USER_ID --apply
 */

const path = require("path");
const admin = require(path.join(__dirname, "../functions/node_modules/firebase-admin"));
const { wipeAccountMedia } = require(path.join(__dirname, "../functions/wipe-account-media"));

const STORAGE_BUCKET = "gisugo1.firebasestorage.app";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const uidFlag = args.indexOf("--uid");
const uid = uidFlag >= 0 ? String(args[uidFlag + 1] || "").trim() : "";
const keyPathArg = args.find((a, i) => a !== "--apply" && a !== "--uid" && args[i - 1] !== "--uid");

function resolveKeyPath() {
  if (keyPathArg) return path.resolve(keyPathArg);
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null;
  return path.join(__dirname, "github-action-gisugo1-key.json");
}

if (!uid) {
  console.error("Usage: node scripts/wipe-account-media.js --uid USER_ID [--apply]");
  process.exit(1);
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

async function main() {
  console.log(apply ? "APPLY — will delete listed files" : "DRY-RUN — no deletes");
  console.log("uid:", uid);
  const result = await wipeAccountMedia(
    admin.firestore(),
    admin.storage().bucket(STORAGE_BUCKET),
    uid,
    { dryRun: !apply }
  );
  console.log("job photos:", result.jobPhotosWiped ? "included (no live jobs)" : "skipped (jobs still exist)");
  console.log(`${apply ? "Deleted" : "Would delete"} ${result.count} file(s):`);
  if (!result.files.length) {
    console.log("(none)");
    return;
  }
  result.files.forEach((name) => console.log(" ", name));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
