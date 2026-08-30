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
  cleanupJobApplications
};
