const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { randomUUID, createHash } = require("crypto");
const { promises: fs } = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");
const ffmpegPath = require("ffmpeg-static");

admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();
const execFileAsync = promisify(execFile);
const FACE_MEDIA_URL_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const FV_NORMALIZER_VERSION = "fv-normalizer-v1";
const ADMIN_EMAIL_ALLOWLIST = new Set([
  "risco@gisugo.com",
  "riscomics@gmail.com"
]);
const VIDEO_FILE_REGEX = /\.(webm|mp4|mov|m4v)$/i;
const SIGNUP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const SIGNUP_RATE_BLOCK_MS = 15 * 60 * 1000; // 15 minutes
const SIGNUP_RATE_MAX_PER_IP = 25;
const SIGNUP_RATE_MAX_PER_IP_DEVICE = 8;
const ALERT_RETENTION_DAYS = 50;

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

function parseFaceIntroObjectPath(objectName) {
  const match = String(objectName || "").match(/^face_verification\/([^/]+)\/face_intro\.(mp4|webm|mov|m4v)$/i);
  if (!match) return null;
  return {
    userId: match[1],
    extension: match[2].toLowerCase()
  };
}

function getCanonicalFaceVideoPath(userId) {
  return `face_verification/${userId}/face_intro.mp4`;
}

async function deleteStorageObjectIfExists(objectPath) {
  if (!objectPath) return;
  try {
    await bucket.file(objectPath).delete();
  } catch (error) {
    const code = Number(error?.code || 0);
    if (code === 404) return;
    logger.warn("Could not delete stale FV variant", {
      path: objectPath,
      error: String(error)
    });
  }
}

async function transcodeFaceVideoToCanonicalMp4(inputPath, outputPath) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static binary path unavailable.");
  }
  const args = [
    "-y",
    "-i",
    inputPath,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-profile:v",
    "main",
    "-pix_fmt",
    "yuv420p",
    "-b:v",
    "420k",
    "-maxrate",
    "520k",
    "-bufsize",
    "780k",
    "-c:a",
    "aac",
    "-b:a",
    "64k",
    "-ac",
    "1",
    "-ar",
    "44100",
    "-movflags",
    "+faststart",
    outputPath
  ];
  await execFileAsync(ffmpegPath, args);
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
    const scope = String(request.data?.scope || "").trim().toLowerCase();

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required.");
    }

    let allowed = requesterUid === targetUserId; // Owner access
    // Current app behavior treats Face Verified media as public to authenticated users.
    if (!allowed && scope === "profile") {
      allowed = true;
    }

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
    const privateDoc = await db.collection("user_private").doc(targetUserId).get();
    const privateVerification = (privateDoc.exists ? (privateDoc.data() || {}).verification : {}) || {};

    if (!verification.faceVerified) {
      throw new HttpsError("failed-precondition", "Target user is not Face Verified.");
    }

    const fallbackPosterPath = `face_verification/${targetUserId}/face_poster.jpg`;
    let posterPath = verification.facePosterPath ||
      privateVerification.facePosterPath ||
      parseStoragePathFromDownloadUrl(verification.facePosterUrl) ||
      parseStoragePathFromDownloadUrl(privateVerification.facePosterUrl) ||
      fallbackPosterPath;
    let videoPath = verification.faceVideoPath ||
      privateVerification.faceVideoPath ||
      parseStoragePathFromDownloadUrl(verification.faceVideoUrl) ||
      parseStoragePathFromDownloadUrl(privateVerification.faceVideoUrl) ||
      "";

    if (!videoPath) {
      const seededPaths = [
        `face_verification/${targetUserId}/face_intro.mp4`,
        `face_verification/${targetUserId}/face_intro.webm`,
        `face_verification/${targetUserId}/face_intro.mov`,
        `face_verification/${targetUserId}/face_intro.m4v`
      ];
      videoPath = await resolveFaceVideoPath(targetUserId, seededPaths);
    }
    if (!videoPath) {
      throw new HttpsError("failed-precondition", "Face Verification video path is missing.");
    }

    const expiresAtMs = Date.now() + FACE_MEDIA_URL_TTL_MS;
    const expiresAt = new Date(expiresAtMs);

    let videoUrl = "";
    let posterUrl = verification.facePosterUrl || privateVerification.facePosterUrl || "";
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
        if (privateDoc.exists) {
          await db.collection("user_private").doc(targetUserId).set(profilePatch, { merge: true });
        }
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
          `face_verification/${userId}/face_intro.mp4`,
          `face_verification/${userId}/face_intro.webm`
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

exports.normalizeFaceVerificationVideo = onCall(
  { region: "us-central1", timeoutSeconds: 180, memory: "1GiB", cors: true },
  async (request) => {
    const requesterUid = request.auth?.uid || "";
    if (!requesterUid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const targetUserId = String(request.data?.targetUserId || requesterUid).trim();
    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required.");
    }
    if (targetUserId !== requesterUid) {
      throw new HttpsError("permission-denied", "Cannot normalize another user's Face Verification.");
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
    const privateDoc = await db.collection("user_private").doc(targetUserId).get();
    const privateVerification = (privateDoc.exists ? (privateDoc.data() || {}).verification : {}) || {};

    let sourcePath = String(request.data?.sourcePath || "").trim();
    if (!sourcePath) {
      sourcePath = verification.faceVideoPath ||
        privateVerification.faceVideoPath ||
        parseStoragePathFromDownloadUrl(verification.faceVideoUrl) ||
        parseStoragePathFromDownloadUrl(privateVerification.faceVideoUrl) ||
        "";
    }
    if (!sourcePath) {
      sourcePath = await resolveFaceVideoPath(targetUserId, [
        `face_verification/${targetUserId}/face_intro.mp4`,
        `face_verification/${targetUserId}/face_intro.webm`,
        `face_verification/${targetUserId}/face_intro.mov`,
        `face_verification/${targetUserId}/face_intro.m4v`
      ]);
    }
    if (!sourcePath) {
      throw new HttpsError("failed-precondition", "Face Verification source video not found.");
    }

    const canonicalPath = getCanonicalFaceVideoPath(targetUserId);
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const tempInputPath = path.join(os.tmpdir(), `fv-src-${unique}-${path.basename(sourcePath)}`);
    const tempOutputPath = path.join(os.tmpdir(), `fv-out-${unique}.mp4`);

    try {
      await bucket.file(sourcePath).download({ destination: tempInputPath });
      await transcodeFaceVideoToCanonicalMp4(tempInputPath, tempOutputPath);

      await bucket.upload(tempOutputPath, {
        destination: canonicalPath,
        metadata: {
          contentType: "video/mp4",
          cacheControl: "public,max-age=86400",
          metadata: {
            normalizedBy: FV_NORMALIZER_VERSION,
            normalizedAt: new Date().toISOString(),
            sourcePath,
            sourceContentType: "video/*"
          }
        }
      });

      const staleVariants = [
        `face_verification/${targetUserId}/face_intro.webm`,
        `face_verification/${targetUserId}/face_intro.mov`,
        `face_verification/${targetUserId}/face_intro.m4v`
      ];
      await Promise.all(staleVariants.map((variantPath) => deleteStorageObjectIfExists(variantPath)));

      const canonicalUrl = await ensureDownloadUrlForPath(canonicalPath);
      const patch = {
        "verification.faceVerified": true,
        "verification.status": "face_verified",
        "verification.faceVideoPath": canonicalPath,
        "verification.faceVideoUrl": canonicalUrl
      };
      await db.collection("users").doc(targetUserId).set(patch, { merge: true });
      await db.collection("user_private").doc(targetUserId).set(patch, { merge: true });

      logger.info("FV normalization complete", {
        userId: targetUserId,
        sourcePath,
        canonicalPath,
        canonicalUrlSet: !!canonicalUrl
      });
      return {
        ok: true,
        canonicalPath,
        canonicalUrl
      };
    } catch (error) {
      logger.error("FV normalization failed", {
        userId: targetUserId,
        sourcePath,
        error: String(error)
      });
      throw new HttpsError("internal", "Failed to normalize Face Verification video.");
    } finally {
      await Promise.allSettled([
        fs.rm(tempInputPath, { force: true }),
        fs.rm(tempOutputPath, { force: true })
      ]);
    }
  }
);

exports.cleanupOldReadNotifications = onSchedule(
  { schedule: "every 24 hours", region: "us-central1", timeZone: "Asia/Manila" },
  async () => {
    const cutoffMs = Date.now() - (ALERT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const cutoff = admin.firestore.Timestamp.fromMillis(cutoffMs);
    const batchSize = 400;
    let totalDeleted = 0;
    let lastDoc = null;

    while (true) {
      let query = db
        .collection("notifications")
        .where("read", "==", true)
        .where("createdAt", "<", cutoff)
        .orderBy("createdAt", "asc")
        .limit(batchSize);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snap = await query.get();
      if (snap.empty) break;

      const batch = db.batch();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();

      totalDeleted += snap.size;
      lastDoc = snap.docs[snap.docs.length - 1];

      if (snap.size < batchSize) break;
    }

    logger.info("cleanupOldReadNotifications complete", {
      retentionDays: ALERT_RETENTION_DAYS,
      deleted: totalDeleted
    });
  }
);
