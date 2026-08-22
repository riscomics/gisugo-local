// Storage hygiene Ch 5 — delete one account's media prefixes.
// Used by the wipeAccountMedia callable (self only) and the Admin-SDK
// script. Permanently Ban must NOT call this (ban keeps evidence).

const UID_RE = /^[A-Za-z0-9_-]{8,128}$/;

function assertSafeUid(uid) {
  const safe = String(uid || "").trim();
  if (!UID_RE.test(safe)) {
    throw new Error("Invalid uid");
  }
  return safe;
}

async function listPrefixFiles(bucket, prefix) {
  const [files] = await bucket.getFiles({ prefix });
  return (files || []).filter((file) => file.name && !file.name.endsWith("/"));
}

async function wipeAccountMedia(db, bucket, uid, options) {
  const dryRun = Boolean(options && options.dryRun);
  const safeUid = assertSafeUid(uid);
  const jobsSnap = await db.collection("jobs").where("posterId", "==", safeUid).limit(1).get();
  const hasJobs = !jobsSnap.empty;

  const prefixes = [
    `profile_photos/${safeUid}/`,
    `face_verification/${safeUid}/`,
    `verification_ids/${safeUid}/`
  ];
  if (!hasJobs) {
    prefixes.push(`job_photos/${safeUid}/`);
  }

  const names = [];
  for (const prefix of prefixes) {
    const files = await listPrefixFiles(bucket, prefix);
    for (const file of files) {
      names.push(file.name);
      if (!dryRun) {
        await file.delete();
      }
    }
  }

  return {
    uid: safeUid,
    dryRun,
    jobPhotosWiped: !hasJobs,
    jobPhotosSkippedBecauseJobsRemain: hasJobs,
    files: names,
    count: names.length
  };
}

module.exports = {
  assertSafeUid,
  wipeAccountMedia
};
