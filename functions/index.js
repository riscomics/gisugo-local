const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { randomUUID, createHash } = require("crypto");

admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();
const FACE_MEDIA_URL_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const ADMIN_EMAIL_ALLOWLIST = new Set([
  "risco@gisugo.com",
  "riscomics@gmail.com"
]);
const VIDEO_FILE_REGEX = /\.(webm|mp4|mov|m4v)$/i;
const SIGNUP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SIGNUP_RATE_BLOCK_MS = 15 * 60 * 1000; // 15 minutes
const SIGNUP_RATE_MAX_PER_IP = 25;
const SIGNUP_RATE_MAX_PER_IP_DEVICE = 8;

function hasJobCounterpartyAccess(job, requesterUid, targetUserId) {
  if (!job || !requesterUid || !targetUserId) return false;
  const posterId = job.posterId || "";
  const workerId = job.hiredWorkerId || "";
  const validStatus = ["hired", "accepted", "completed"].includes(job.status || "");
  if (!validStatus) return false;
  return (
    (posterId === requesterUid && workerId === targetUserId) ||
    (workerId === requesterUid && posterId === targetUserId)
  );
}

async function hasApplicationAccess(applicationId, requesterUid, targetUserId) {
  if (!applicationId || !requesterUid || !targetUserId) return false;

  const appDoc = await db.collection("applications").doc(applicationId).get();
  if (!appDoc.exists) return false;
  const app = appDoc.data() || {};
  const jobId = app.jobId || "";
  if (!jobId) return false;

  const jobDoc = await db.collection("jobs").doc(jobId).get();
  if (!jobDoc.exists) return false;
  const job = jobDoc.data() || {};

  // Customer reviewing applicant in "Confirm Hiring Decision".
  if (job.posterId === requesterUid && app.applicantId === targetUserId) {
    return true;
  }

  // Applicant viewing poster context (future symmetry).
  if (app.applicantId === requesterUid && job.posterId === targetUserId) {
    return true;
  }

  return false;
}

function parseStoragePathFromDownloadUrl(url) {
  if (!url || typeof url !== "string") return "";
  const marker = "/o/";
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) return "";
  const encodedPath = url.slice(markerIndex + marker.length).split("?")[0];
  if (!encodedPath) return "";
  try {
    return decodeURIComponent(encodedPath);
  } catch (_) {
    return "";
  }
}

function buildFirebaseDownloadUrl(path, token) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

async function ensureDownloadUrlForPath(path) {
  if (!path) return "";
  const file = bucket.file(path);
  const [exists] = await file.exists();
  if (!exists) return "";

  const [metadata] = await file.getMetadata();
  const rawTokens = metadata?.metadata?.firebaseStorageDownloadTokens || "";
  const firstToken = String(rawTokens).split(",").map((value) => value.trim()).find(Boolean);
  if (firstToken) {
    return buildFirebaseDownloadUrl(path, firstToken);
  }

  const generatedToken = randomUUID();
  await file.setMetadata({
    metadata: {
      firebaseStorageDownloadTokens: generatedToken
    }
  });
  return buildFirebaseDownloadUrl(path, generatedToken);
}

async function resolveFaceVideoPath(userId, seededPaths = []) {
  const candidates = seededPaths.filter(Boolean);
  for (const path of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const [exists] = await bucket.file(path).exists();
    if (exists) return path;
  }

  const [items] = await bucket.getFiles({
    prefix: `face_verification/${userId}/`
  });
  const matched = (items || []).find((item) => {
    const name = item?.name || "";
    if (!name || name.includes("poster")) return false;
    return VIDEO_FILE_REGEX.test(name);
  });
  return matched?.name || "";
}

function assertAuditAccess(request) {
  const requesterUid = request.auth?.uid || "";
  const requesterEmail = String(request.auth?.token?.email || "").toLowerCase();
  if (!requesterUid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  if (!ADMIN_EMAIL_ALLOWLIST.has(requesterEmail)) {
    throw new HttpsError("permission-denied", "Admin audit access required.");
  }
}

function hashForRateKey(input) {
  return createHash("sha256").update(String(input || "")).digest("hex").slice(0, 24);
}

function getCallerIp(request) {
  const forwarded = String(request.rawRequest?.headers?.["x-forwarded-for"] || "");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return String(request.rawRequest?.ip || "unknown");
}

function normalizeFingerprint(value) {
  const raw = String(value || "").trim();
  if (!raw) return "unknown-device";
  return raw.slice(0, 160);
}

exports.checkSignupRateLimit = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const now = Date.now();
    const ip = getCallerIp(request);
    const deviceFingerprint = normalizeFingerprint(request.data?.deviceFingerprint);

    const ipKey = `signup_rate_limits/ip_${hashForRateKey(ip)}`;
    const comboKey = `signup_rate_limits/combo_${hashForRateKey(`${ip}|${deviceFingerprint}`)}`;
    const ipRef = db.doc(ipKey);
    const comboRef = db.doc(comboKey);

    const evaluateEntry = (entry, limit) => {
      const data = entry || {};
      const blockUntilMs = Number(data.blockUntilMs || 0);
      if (blockUntilMs > now) {
        return {
          allowed: false,
          retryAfterMs: blockUntilMs - now,
          next: data
        };
      }

      const windowStartMs = Number(data.windowStartMs || now);
      const withinWindow = (now - windowStartMs) < SIGNUP_RATE_WINDOW_MS;
      const count = withinWindow ? Number(data.count || 0) : 0;
      const nextCount = count + 1;
      const next = {
        windowStartMs: withinWindow ? windowStartMs : now,
        count: nextCount,
        lastAttemptMs: now,
        blockUntilMs: 0
      };

      if (nextCount > limit) {
        next.blockUntilMs = now + SIGNUP_RATE_BLOCK_MS;
        return {
          allowed: false,
          retryAfterMs: SIGNUP_RATE_BLOCK_MS,
          next
        };
      }

      return {
        allowed: true,
        retryAfterMs: 0,
        next
      };
    };

    const result = await db.runTransaction(async (tx) => {
      const [ipSnap, comboSnap] = await Promise.all([tx.get(ipRef), tx.get(comboRef)]);
      const ipEval = evaluateEntry(ipSnap.exists ? ipSnap.data() : null, SIGNUP_RATE_MAX_PER_IP);
      const comboEval = evaluateEntry(comboSnap.exists ? comboSnap.data() : null, SIGNUP_RATE_MAX_PER_IP_DEVICE);

      tx.set(ipRef, ipEval.next, { merge: true });
      tx.set(comboRef, comboEval.next, { merge: true });

      const allowed = ipEval.allowed && comboEval.allowed;
      const retryAfterMs = Math.max(ipEval.retryAfterMs, comboEval.retryAfterMs);
      return { allowed, retryAfterMs };
    });

    if (!result.allowed) {
      return {
        allowed: false,
        retryAfterSec: Math.ceil(result.retryAfterMs / 1000),
        message: "Too many sign-up attempts. Please wait a few minutes, then try again."
      };
    }

    return {
      allowed: true,
      retryAfterSec: 0
    };
  }
);

exports.migrateLegacyProfilePhones = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const requesterUid = request.auth?.uid || "";
    if (!requesterUid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const migrationRef = db.collection("system_migrations").doc("legacy_profile_phone_v1");
    const migrationSnap = await migrationRef.get();
    const migrationData = migrationSnap.exists ? (migrationSnap.data() || {}) : {};
    if (migrationData.status === "done") {
      return {
        ok: true,
        alreadyDone: true,
        scannedUsers: Number(migrationData.scannedUsers || 0),
        updatedUsers: Number(migrationData.updatedUsers || 0)
      };
    }

    await migrationRef.set({
      status: "running",
      startedBy: requesterUid,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const usersRef = db.collection("users");
    const deleteValue = admin.firestore.FieldValue.delete();
    const docIdField = admin.firestore.FieldPath.documentId();
    let lastDoc = null;
    let scannedUsers = 0;
    let updatedUsers = 0;

    while (true) {
      let query = usersRef.orderBy(docIdField).limit(250);
      if (lastDoc) query = query.startAfter(lastDoc);

      // eslint-disable-next-line no-await-in-loop
      const snapshot = await query.get();
      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.docs.forEach((docSnap) => {
        scannedUsers += 1;
        const data = docSnap.data() || {};
        if (!Object.prototype.hasOwnProperty.call(data, "phoneNumber")) return;

        batch.update(docSnap.ref, {
          phoneNumber: deleteValue,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        updatedUsers += 1;
      });

      // eslint-disable-next-line no-await-in-loop
      await batch.commit();
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }

    logger.info("Legacy profile phone migration completed", {
      scannedUsers,
      updatedUsers
    });

    await migrationRef.set({
      status: "done",
      completedBy: requesterUid,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      scannedUsers,
      updatedUsers,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return {
      ok: true,
      scannedUsers,
      updatedUsers
    };
  }
);

exports.getFaceVerificationMediaAccess = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    const requesterUid = request.auth?.uid || "";
    if (!requesterUid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const targetUserId = String(request.data?.targetUserId || "").trim();
    const jobId = String(request.data?.jobId || "").trim();
    const applicationId = String(request.data?.applicationId || "").trim();

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required.");
    }

    let allowed = requesterUid === targetUserId; // Owner access

    if (!allowed && jobId) {
      const jobDoc = await db.collection("jobs").doc(jobId).get();
      if (jobDoc.exists) {
        allowed = hasJobCounterpartyAccess(jobDoc.data() || {}, requesterUid, targetUserId);
      }
    }

    if (!allowed && applicationId) {
      allowed = await hasApplicationAccess(applicationId, requesterUid, targetUserId);
    }

    if (!allowed) {
      throw new HttpsError("permission-denied", "Not allowed to access this Face Verification media.");
    }

    const userDoc = await db.collection("users").doc(targetUserId).get();
    if (!userDoc.exists) {
      throw new HttpsError("not-found", "Target profile not found.");
    }
    const profile = userDoc.data() || {};
    const verification = profile.verification || {};

    if (!verification.faceVerified) {
      throw new HttpsError("failed-precondition", "Target user is not Face Verified.");
    }

    const fallbackPosterPath = `face_verification/${targetUserId}/face_poster.jpg`;
    let posterPath = verification.facePosterPath || fallbackPosterPath;
    let videoPath = verification.faceVideoPath || "";

    if (!videoPath) {
      const candidateVideoPaths = [
        `face_verification/${targetUserId}/face_intro.webm`,
        `face_verification/${targetUserId}/face_intro.mp4`
      ];
      for (const candidate of candidateVideoPaths) {
        // eslint-disable-next-line no-await-in-loop
        const [exists] = await bucket.file(candidate).exists();
        if (exists) {
          videoPath = candidate;
          break;
        }
      }
    }
    if (!videoPath) {
      throw new HttpsError("failed-precondition", "Face Verification video path is missing.");
    }

    const expiresAtMs = Date.now() + FACE_MEDIA_URL_TTL_MS;
    const expiresAt = new Date(expiresAtMs);

    let videoUrl = "";
    let posterUrl = verification.facePosterUrl || "";
    const profilePatch = {};

    try {
      [videoUrl] = await bucket.file(videoPath).getSignedUrl({
        version: "v4",
        action: "read",
        expires: expiresAt
      });
      if (!verification.faceVideoPath) {
        profilePatch["verification.faceVideoPath"] = videoPath;
      }
    } catch (error) {
      logger.error("Face video signed URL failed", { targetUserId, videoPath, error: String(error) });
      throw new HttpsError("internal", "Could not generate Face Verification video access.");
    }

    if (!posterUrl && posterPath) {
      try {
        [posterUrl] = await bucket.file(posterPath).getSignedUrl({
          version: "v4",
          action: "read",
          expires: expiresAt
        });
        if (!verification.facePosterPath) {
          profilePatch["verification.facePosterPath"] = posterPath;
        }
        if (!verification.facePosterUrl) {
          profilePatch["verification.facePosterUrl"] = posterUrl;
        }
      } catch (error) {
        logger.warn("Face poster signed URL skipped", { targetUserId, posterPath, error: String(error) });
      }
    }

    if (Object.keys(profilePatch).length > 0) {
      try {
        await db.collection("users").doc(targetUserId).set(profilePatch, { merge: true });
      } catch (error) {
        logger.warn("FV profile patch skipped", { targetUserId, error: String(error) });
      }
    }

    return {
      posterUrl,
      videoUrl,
      expiresAtMs
    };
  }
);

exports.auditAndRepairFaceVerification = onCall(
  { region: "us-central1", cors: true },
  async (request) => {
    assertAuditAccess(request);

    const dryRun = !!request.data?.dryRun;
    const targetUserId = String(request.data?.targetUserId || "").trim();
    let docs = [];

    if (targetUserId) {
      const doc = await db.collection("users").doc(targetUserId).get();
      if (!doc.exists) {
        throw new HttpsError("not-found", "Target user not found.");
      }
      docs = [doc];
    } else {
      const snap = await db.collection("users")
        .where("verification.faceVerified", "==", true)
        .get();
      docs = snap.docs;
    }

    let scanned = 0;
    let repaired = 0;
    let downgraded = 0;
    let healthy = 0;
    const samples = [];

    for (const doc of docs) {
      scanned += 1;
      const userId = doc.id;
      const profile = doc.data() || {};
      const verification = profile.verification || {};
      const privateDoc = await db.collection("user_private").doc(userId).get();
      const privateVerification = (privateDoc.exists ? (privateDoc.data() || {}).verification : {}) || {};

      let posterPath = verification.facePosterPath ||
        privateVerification.facePosterPath ||
        parseStoragePathFromDownloadUrl(verification.facePosterUrl) ||
        parseStoragePathFromDownloadUrl(privateVerification.facePosterUrl) ||
        `face_verification/${userId}/face_poster.jpg`;
      let videoPath = verification.faceVideoPath ||
        privateVerification.faceVideoPath ||
        parseStoragePathFromDownloadUrl(verification.faceVideoUrl) ||
        parseStoragePathFromDownloadUrl(privateVerification.faceVideoUrl);

      if (!videoPath) {
        videoPath = await resolveFaceVideoPath(userId, [
          `face_verification/${userId}/face_intro.webm`,
          `face_verification/${userId}/face_intro.mp4`
        ]);
      }

      const posterUrl = await ensureDownloadUrlForPath(posterPath);
      const videoUrl = await ensureDownloadUrlForPath(videoPath);
      const hasPoster = !!posterUrl;
      const hasVideo = !!videoUrl;
      const complete = hasPoster && hasVideo;

      const patch = {
        "verification.facePosterPath": hasPoster ? posterPath : "",
        "verification.facePosterUrl": hasPoster ? posterUrl : "",
        "verification.faceVideoPath": hasVideo ? videoPath : "",
        "verification.faceVideoUrl": hasVideo ? videoUrl : "",
        "verification.status": complete ? "face_verified" : "needs_reverify",
        "verification.faceVerified": complete
      };

      if (!verification.verificationDate && complete) {
        patch["verification.verificationDate"] = admin.firestore.FieldValue.serverTimestamp();
      }

      const changed =
        verification.facePosterPath !== patch["verification.facePosterPath"] ||
        verification.facePosterUrl !== patch["verification.facePosterUrl"] ||
        verification.faceVideoPath !== patch["verification.faceVideoPath"] ||
        verification.faceVideoUrl !== patch["verification.faceVideoUrl"] ||
        verification.faceVerified !== patch["verification.faceVerified"] ||
        verification.status !== patch["verification.status"] ||
        (!verification.verificationDate && complete);

      if (changed) {
        repaired += 1;
        if (!patch["verification.faceVerified"]) downgraded += 1;
        if (!dryRun) {
          await db.collection("users").doc(userId).set(patch, { merge: true });
          if (privateDoc.exists) {
            await db.collection("user_private").doc(userId).set(patch, { merge: true });
          }
        }
      } else {
        healthy += 1;
      }

      if (samples.length < 20) {
        samples.push({
          userId,
          complete,
          hasPoster,
          hasVideo,
          changed
        });
      }
    }

    logger.info("FV audit complete", { scanned, repaired, downgraded, healthy, dryRun, targetUserId });
    return {
      ok: true,
      dryRun,
      scanned,
      repaired,
      downgraded,
      healthy,
      samples
    };
  }
);
