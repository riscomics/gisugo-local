// Phase 7 Ch 1 — classify Firebase Storage object paths into the four
// Overview "Storage Usage" buckets. Shared by the Storage triggers and
// the one-time seed so prefixes cannot drift.

const STORAGE_TYPE_KEYS = ["profile", "gig", "id", "other"];
const STORAGE_USD_PER_GB_MONTH = 0.020;
const STORAGE_FREE_BYTES = 5 * 1024 * 1024 * 1024;

function manilaMonthKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date || new Date());
  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;
  return `${year}-${month}`;
}

function billableStorageBytes(bytes) {
  return Math.max(0, (Number(bytes) || 0) - STORAGE_FREE_BYTES);
}

function estimateStorageUsd(bytes) {
  return (billableStorageBytes(bytes) / (1024 * 1024 * 1024)) * STORAGE_USD_PER_GB_MONTH;
}

function attachGrowthStamp(existingGrowth, previousTotalBytes, nextTotalBytes) {
  const monthKey = manilaMonthKey();
  const prevGrowth = existingGrowth || {};
  const months = Object.assign({}, prevGrowth.months || {});
  const prevMonthKey = String(prevGrowth.monthKey || "").trim();
  const prevStart = Math.max(0, Number(prevGrowth.monthStartBytes) || 0);
  const prevTotal = Math.max(0, Number(previousTotalBytes) || 0);
  const nextTotal = Math.max(0, Number(nextTotalBytes) || 0);

  let monthStartBytes = prevStart;
  let monthStartAt = prevGrowth.monthStartAt || "";

  if (!prevMonthKey) {
    monthStartBytes = nextTotal;
    monthStartAt = new Date().toISOString();
  } else if (prevMonthKey !== monthKey) {
    months[prevMonthKey] = {
      startBytes: prevStart,
      endBytes: prevTotal
    };
    monthStartBytes = prevTotal;
    monthStartAt = new Date().toISOString();
  }

  return {
    monthKey,
    monthStartBytes,
    monthStartAt,
    months
  };
}

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
  STORAGE_USD_PER_GB_MONTH,
  STORAGE_FREE_BYTES,
  classifyStoragePath,
  emptyByType,
  isCountableStorageObject,
  buildStorageSnapshot,
  manilaMonthKey,
  billableStorageBytes,
  estimateStorageUsd,
  attachGrowthStamp
};
