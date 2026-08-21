// Phase 7 Ch 1 — classify Firebase Storage object paths into the four
// Overview "Storage Usage" buckets. Shared by the Storage triggers and
// the one-time seed so prefixes cannot drift.

const STORAGE_TYPE_KEYS = ["profile", "gig", "id", "other"];

function classifyStoragePath(objectName) {
  const name = String(objectName || "").replace(/^\/+/, "");
  if (name.startsWith("profile_photos/")) return "profile";
  if (name.startsWith("job_photos/")) return "gig";
  if (name.startsWith("verification_ids/") || name.startsWith("face_verification/")) {
    return "id";
  }
  // support_photos/ + chat_photos/ + anything else → Other overlay bucket
  return "other";
}

function emptyByType() {
  const byType = {};
  STORAGE_TYPE_KEYS.forEach((key) => {
    byType[key] = { bytes: 0, files: 0 };
  });
  return byType;
}

function isCountableStorageObject(objectName) {
  const name = String(objectName || "").replace(/^\/+/, "");
  return Boolean(name) && !name.endsWith("/");
}

function buildStorageSnapshot(files) {
  const byType = emptyByType();
  let totalBytes = 0;
  let totalFiles = 0;

  (files || []).forEach((file) => {
    const name = file.name || file.path || "";
    if (!isCountableStorageObject(name)) return;
    const size = Math.max(0, Number(file.size) || 0);
    const key = classifyStoragePath(name);
    byType[key].bytes += size;
    byType[key].files += 1;
    totalBytes += size;
    totalFiles += 1;
  });

  return { totalBytes, totalFiles, byType };
}

module.exports = {
  STORAGE_TYPE_KEYS,
  classifyStoragePath,
  emptyByType,
  isCountableStorageObject,
  buildStorageSnapshot
};
