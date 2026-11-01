/**
 * One-time (re-runnable) seed for the Gigs Reported overlay
 * (platform_analytics/reports).
 *
 * Overwrites that summary from gig_reports, jobs currently status
 * "reported", and job_moderation_log. Dashboard reads never scan those
 * collections. Re-run only to reconcile. Safe to run again: it sets the
 * whole doc, it does not increment.
 *
 * Day buckets are Manila dates for gigs still in the reported queue.
 * The flip day is the report that reached that gig's threshold
 * (reportThreshold, or 2). Ignored and Suspended totals come from the
 * moderation log (ignore, and suspend whose previous status was reported).
 *
 * Safety: DRY-RUN by default. Pass --apply to write.
 *
 * Usage (PowerShell, from repo root):
 *   node scripts/seed-report-analytics.js
 *   node scripts/seed-report-analytics.js --apply
 *
 * Credentials (first match wins):
 *   1. Positional key path (after --apply, if present)
 *   2. GOOGLE_APPLICATION_CREDENTIALS
 *   3. scripts/github-action-gisugo1-key.json (local, gitignored)
 */

const path = require("path");
const admin = require(path.join(__dirname, "../functions/node_modules/firebase-admin"));

const REASON_KEYS = [
  "inappropriate_content",
  "scam_fraud",
  "misleading_info",
  "duplicate_post",
  "other_reasons"
];

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
  const init = {};
  if (keyPath) {
    init.credential = admin.credential.cert(require(keyPath));
  }
  admin.initializeApp(init);
} catch (err) {
  console.error("Could not load service-account key:", err.message);
  process.exit(1);
}

const db = admin.firestore();

function manilaDayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function asDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function reasonKeyOf(data) {
  const key = String((data && data.reasonKey) || "").trim();
  return REASON_KEYS.includes(key) ? key : "other_reasons";
}

async function main() {
  console.log(apply ? "APPLY — will overwrite platform_analytics/reports" : "DRY-RUN — no write");

  const [reportsSnap, reportedJobsSnap, logSnap] = await Promise.all([
    db.collection("gig_reports").get(),
    db.collection("jobs").where("status", "==", "reported").get(),
    db.collection("job_moderation_log").get()
  ]);

  const byReason = {
    inappropriate_content: 0,
    scam_fraud: 0,
    misleading_info: 0,
    duplicate_post: 0,
    other_reasons: 0
  };
  const reportsByJob = {};
  reportsSnap.forEach((doc) => {
    const data = doc.data() || {};
    byReason[reasonKeyOf(data)] += 1;
    const jobId = String(data.jobId || "").trim();
    if (!jobId) return;
    if (!reportsByJob[jobId]) reportsByJob[jobId] = [];
    reportsByJob[jobId].push(data);
  });

  const flaggedByDay = {};
  reportedJobsSnap.forEach((doc) => {
    const job = doc.data() || {};
    const threshold = Number(job.reportThreshold) || 2;
    const reports = (reportsByJob[doc.id] || []).slice().sort((a, b) => {
      const aMs = asDate(a.createdAt)?.getTime() || 0;
      const bMs = asDate(b.createdAt)?.getTime() || 0;
      return aMs - bMs;
    });
    const flip = reports[threshold - 1] || reports[reports.length - 1];
    const when = flip ? asDate(flip.createdAt) : null;
    if (!when) return;
    const day = manilaDayKey(when);
    flaggedByDay[day] = (flaggedByDay[day] || 0) + 1;
  });

  let ignoredCount = 0;
  let suspendedCount = 0;
  logSnap.forEach((doc) => {
    const row = doc.data() || {};
    if (row.action === "ignore") ignoredCount += 1;
    if (row.action === "suspend" && row.previousStatus === "reported") suspendedCount += 1;
  });

  const summary = {
    queueCount: reportedJobsSnap.size,
    ignoredCount,
    suspendedCount,
    byReason,
    flaggedByDay,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    seededAt: admin.firestore.FieldValue.serverTimestamp()
  };

  console.log(`Reports: ${reportsSnap.size}`);
  console.log(`Live queue (status reported): ${summary.queueCount}`);
  console.log(`Ignored (log): ${ignoredCount}`);
  console.log(`Suspended from reported (log): ${suspendedCount}`);
  console.log("Reasons:", byReason);
  console.log("Flagged days:", flaggedByDay);

  if (!apply) {
    console.log("Dry run only. Re-run with --apply to write.");
    return;
  }

  await db.collection("platform_analytics").doc("reports").set(summary);
  console.log("Wrote platform_analytics/reports");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
