// deleteJob() application + coin cleanup. Client batch.delete() fails
// the whole batch when any applicationId is already gone (rules read
// resource.data). Client coin refund cannot write another user's
// applicationCoins*. This runs on the Admin SDK.

const ID_RE = /^[A-Za-z0-9_-]{8,128}$/;
const DEFAULT_APPLICATION_COINS_MAX = 10;

function isSafeId(value) {
  return ID_RE.test(String(value || "").trim());
}

function isApplicationHoldingCoin(application) {
  const status = String((application && application.status) || "").toLowerCase();
  const holdsByStatus = status === "pending" || status === "accepted" || status === "hired";
  return application.coinHeld !== false && !application.coinReleasedAt && holdsByStatus;
}

function normalizeApplicationCoins(profile) {
  const maxRaw = Number(profile && profile.applicationCoinsMax);
  const max = Number.isFinite(maxRaw) && maxRaw > 0 ? maxRaw : DEFAULT_APPLICATION_COINS_MAX;
  const currentRaw = Number(profile && profile.applicationCoinsCurrent);
  const current = Number.isFinite(currentRaw) ? Math.max(0, Math.min(max, currentRaw)) : max;
  return { current, max };
}

async function refundApplicationCoin(db, FieldValue, applicantId, reason) {
  const userRef = db.collection("users").doc(applicantId);
  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    const normalized = normalizeApplicationCoins(userSnap.exists ? userSnap.data() || {} : {});
    tx.set(userRef, {
      applicationCoinsMax: normalized.max,
      applicationCoinsCurrent: Math.min(normalized.max, normalized.current + 1),
      applicationCoinLastReleaseReason: reason,
      applicationCoinLastReleasedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });
}

/**
 * Set remaining apply-coins from this worker's still-held slots (pending, or
 * unanswered offer). Same count My Applications uses. Use this after owner
 * reject instead of +1, so a worker who already self-healed to 10 is not
 * given 11.
 */
async function recomputeAndWriteApplicationCoins(db, FieldValue, applicantId, reason) {
  const safeUserId = String(applicantId || "").trim();
  if (!isSafeId(safeUserId)) {
    return { current: DEFAULT_APPLICATION_COINS_MAX, max: DEFAULT_APPLICATION_COINS_MAX, heldCount: 0 };
  }

  const appsSnap = await db.collection("applications").where("applicantId", "==", safeUserId).get();
  let heldCount = 0;
  const ambiguousJobIds = [];
  const jobIdsToFetch = new Set();
  for (const doc of appsSnap.docs) {
    const app = doc.data() || {};
    if (app.coinHeld === false || app.coinReleasedAt) continue;
    const status = String(app.status || "").toLowerCase();
    if (status === "pending") {
      heldCount += 1;
      continue;
    }
    if (status === "accepted" || status === "hired") {
      const jobId = String(app.jobId || "").trim();
      if (!jobId) continue;
      ambiguousJobIds.push(jobId);
      jobIdsToFetch.add(jobId);
    }
  }
  const jobStatusCache = new Map();
  if (jobIdsToFetch.size > 0) {
    const uniqueJobIds = Array.from(jobIdsToFetch);
    const jobDocs = await Promise.all(
      uniqueJobIds.map((jobId) => db.collection("jobs").doc(jobId).get())
    );
    uniqueJobIds.forEach((jobId, index) => {
      const jobSnap = jobDocs[index];
      jobStatusCache.set(
        jobId,
        jobSnap && jobSnap.exists ? String((jobSnap.data() || {}).status || "").toLowerCase() : ""
      );
    });
  }
  for (const jobId of ambiguousJobIds) {
    if (jobStatusCache.get(jobId) === "hired") heldCount += 1;
  }

  const userRef = db.collection("users").doc(safeUserId);
  const userSnap = await userRef.get();
  const normalized = normalizeApplicationCoins(userSnap.exists ? userSnap.data() || {} : {});
  const expectedCurrent = Math.max(0, Math.min(normalized.max, normalized.max - heldCount));
  await userRef.set({
    applicationCoinsMax: normalized.max,
    applicationCoinsCurrent: expectedCurrent,
    applicationCoinLastReleaseReason: reason || "rejected",
    applicationCoinLastReleasedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return { current: expectedCurrent, max: normalized.max, heldCount };
}

async function cleanupJobApplications(db, FieldValue, options) {
  const jobId = String((options && options.jobId) || "").trim();
  const rawIds = Array.isArray(options && options.applicationIds)
    ? options.applicationIds
    : [];
  const reason = String((options && options.reason) || "job_deleted").slice(0, 80);
  const fromClient = rawIds.map((id) => String(id || "").trim()).filter(isSafeId);
  const fromQuery = [];
  if (isSafeId(jobId)) {
    const queried = await db.collection("applications").where("jobId", "==", jobId).get();
    queried.docs.forEach((doc) => fromQuery.push(doc.id));
  }
  const uniqueIds = [...new Set([...fromClient, ...fromQuery])];

  const deleted = [];
  const skippedMissing = [];
  const skippedWrongJob = [];
  const refunded = [];

  for (const applicationId of uniqueIds) {
    const appRef = db.collection("applications").doc(applicationId);
    const snap = await appRef.get();
    if (!snap.exists) {
      skippedMissing.push(applicationId);
      continue;
    }
    const app = snap.data() || {};
    if (jobId && String(app.jobId || "") !== jobId) {
      skippedWrongJob.push(applicationId);
      continue;
    }
    const applicantId = String(app.applicantId || "").trim();
    if (isApplicationHoldingCoin(app) && isSafeId(applicantId)) {
      await refundApplicationCoin(db, FieldValue, applicantId, reason);
      refunded.push(applicationId);
    }
    await appRef.delete();
    deleted.push(applicationId);
  }

  return { jobId, deleted, skippedMissing, skippedWrongJob, refunded };
}

module.exports = {
  isSafeId,
  isApplicationHoldingCoin,
  refundApplicationCoin,
  recomputeAndWriteApplicationCoins,
  cleanupJobApplications
};
