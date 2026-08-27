const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten, onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onObjectFinalized, onObjectDeleted } = require("firebase-functions/v2/storage");
const {
  classifyStoragePath,
  isCountableStorageObject,
  emptyByType,
  STORAGE_TYPE_KEYS,
  attachGrowthStamp,
  estimateStorageUsd
} = require("./storage-analytics");
const {
  emptyUserActivity,
  emptyTraffic,
  fetchUserActivityFromGa4,
  fetchTrafficFromMonitoring
} = require("./overview-snapshots");
const { wipeAccountMedia } = require("./wipe-account-media");
const { cleanupJobApplications, isSafeId } = require("./cleanup-job-applications");
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
const CONTACT_REVEAL_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const CONTACT_REVEAL_MAX_PER_WINDOW = 30; // per gig owner, per hour
const ALERT_RETENTION_DAYS = 50;
const PUSH_TOKEN_SUBCOLLECTION = "notificationTokens";
const PUSH_SEND_BATCH_SIZE = 500;
const CRITICAL_PUSH_NOTIFICATION_TYPES = new Set([
  "offer_sent",
  "offer_accepted",
  "offer_rejected",
  "interview_request",
  "contract_voided",
  "worker_resigned",
  "job_completed",
  "application_received",
  "gig_review_needed",
  "application_slots_reopened_batch",
  "feedback_received",
  "worker_feedback_received",
  "support_admin_message"
]);

function inferNotificationRoleForCounter(notification = {}) {
  const explicitRole = String(notification.role || notification.recipientRole || "").toLowerCase();
  if (explicitRole === "worker" || explicitRole === "customer") return explicitRole;

  const type = String(notification.type || notification.notificationType || "").toLowerCase();
  const workerTypes = new Set([
    "offer_sent",
    "interview_request",
    "job_completed",
    "feedback_received",
    "contract_voided",
    "application_not_selected_batch",
    "application_rejected_batch"
  ]);
  const customerTypes = new Set([
    "application_received",
    "application_milestone",
    "gig_auto_paused",
    "gig_review_needed",
    "offer_accepted",
    "offer_rejected",
    "worker_resigned",
    "worker_feedback_received"
  ]);

  if (workerTypes.has(type)) return "worker";
  if (customerTypes.has(type)) return "customer";
  return "worker";
}

async function recomputeNotificationCountersForUser(userId) {
  const safeUserId = String(userId || "").trim();
  if (!safeUserId) return;

  const unreadSnapshot = await db
    .collection("notifications")
    .where("recipientId", "==", safeUserId)
    .where("read", "==", false)
    .get();

  const counters = {
    workerUnread: 0,
    customerUnread: 0,
    totalUnread: 0
  };

  unreadSnapshot.docs.forEach((doc) => {
    const notification = doc.data() || {};
    const role = inferNotificationRoleForCounter(notification);
    counters.totalUnread += 1;
    if (role === "worker") counters.workerUnread += 1;
    if (role === "customer") counters.customerUnread += 1;
  });

  await db.collection("users").doc(safeUserId).set({
    notificationCounters: {
      ...counters,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }
  }, { merge: true });
}

function chunkArray(items, size) {
  const output = [];
  const safeSize = Math.max(1, Number(size) || 1);
  for (let i = 0; i < items.length; i += safeSize) {
    output.push(items.slice(i, i + safeSize));
  }
  return output;
}

function shouldPrunePushToken(errorCode = "") {
  const code = String(errorCode || "");
  return (
    code === "messaging/registration-token-not-registered" ||
    code === "messaging/invalid-registration-token" ||
    code === "messaging/invalid-argument"
  );
}

function buildPushPayloadFromNotification(notification = {}) {
  const type = String(notification.type || notification.notificationType || "general").trim();
  const rawMessage = String(notification.message || "").trim();
  const message = rawMessage || "You have a new GISUGO alert.";
  const fallbackTitleMap = {
    offer_sent: "Gig Offer Received",
    offer_accepted: "Offer Accepted",
    offer_rejected: "Offer Declined",
    application_received: "New Application",
    application_milestone: "Application Update",
    gig_auto_paused: "Gig Auto-Paused",
    gig_review_needed: "Review applications",
    worker_resigned: "Worker Resigned",
    contract_voided: "Contract Voided",
    job_completed: "Gig Completed",
    feedback_received: "Feedback Received",
    worker_feedback_received: "Feedback Received",
    application_not_selected_batch: "Application Slots Open",
    application_rejected_batch: "Application Slots Open",
    application_slots_reopened_batch: "Application Slots Open",
    interview_request: "Interview Request",
    support_admin_message: "Message from GISUGO"
  };
  const title = String(notification.title || fallbackTitleMap[type] || "GISUGO Alert");
  const role = inferNotificationRoleForCounter(notification);
  const explicitLink = String(notification.link || "").trim();
  const alertsLink = explicitLink || (role === "customer"
    ? "/alerts.html?role=customer"
    : "/alerts.html?role=worker");

  // Data-only payload (no top-level `notification`): with a notification payload the FCM SDK
  // inside the service worker auto-displays the tray entry and its own click handler intercepts
  // the tap (stopImmediatePropagation), so our notificationclick never controls navigation.
  // Data-only lets firebase-messaging-sw.js show the notification itself and own the tap →
  // reliable /alerts.html?role=… landing (tasklist D2).
  return {
    data: {
      title,
      body: message,
      notificationId: String(notification.id || ""),
      type,
      recipientId: String(notification.recipientId || ""),
      jobId: String(notification.jobId || ""),
      role,
      link: alertsLink
    },
    webpush: {
      headers: {
        Urgency: "high"
      }
    }
  };
}

function normalizePushTypeList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
}

function readUserPushPolicy(userData = {}) {
  const settings = userData.notificationSettings || userData.notifications || {};
  const pushEnabled = !(
    settings.pushEnabled === false ||
    settings.pushNotifications === false ||
    settings.notificationsEnabled === false ||
    settings.allowPush === false
  );
  const criticalEnabled = !(
    settings.pushCriticalEnabled === false ||
    settings.criticalPushEnabled === false ||
    settings.allowCriticalPush === false
  );
  return {
    pushEnabled,
    criticalEnabled,
    disabledTypes: normalizePushTypeList(settings.disabledPushTypes || settings.pushDisabledTypes),
    enabledTypes: normalizePushTypeList(settings.enabledPushTypes || settings.pushEnabledTypes)
  };
}

function isPushAllowedByPolicy(policy, type) {
  if (!policy?.pushEnabled || !policy?.criticalEnabled) return false;
  const safeType = String(type || "").trim().toLowerCase();
  if (safeType && policy.disabledTypes.includes(safeType)) return false;
  if (policy.enabledTypes.length && safeType && !policy.enabledTypes.includes(safeType)) return false;
  return true;
}

async function sendPushForNotificationDoc(notificationId, notification = {}) {
  const recipientId = String(notification.recipientId || "").trim();
  if (!recipientId) return { sent: 0, failed: 0, tokens: 0 };
  const type = String(notification.type || notification.notificationType || "").toLowerCase().trim();
  if (!CRITICAL_PUSH_NOTIFICATION_TYPES.has(type)) {
    logger.info("Push skipped: non-critical notification type", {
      notificationId,
      recipientId,
      type
    });
    return { sent: 0, failed: 0, tokens: 0, skipped: true, reason: "non_critical_type" };
  }

  const userDoc = await db.collection("users").doc(recipientId).get();
  const userPolicy = readUserPushPolicy(userDoc.exists ? (userDoc.data() || {}) : {});
  if (!isPushAllowedByPolicy(userPolicy, type)) {
    logger.info("Push skipped: disabled by user settings", {
      notificationId,
      recipientId,
      type
    });
    return { sent: 0, failed: 0, tokens: 0, skipped: true, reason: "disabled_by_user_settings" };
  }

  const tokenDocs = await db
    .collection("users")
    .doc(recipientId)
    .collection(PUSH_TOKEN_SUBCOLLECTION)
    .where("revoked", "==", false)
    .get();

  if (tokenDocs.empty) {
    logger.info("Push skipped: no active tokens", { notificationId, recipientId });
    return { sent: 0, failed: 0, tokens: 0 };
  }

  const tokenRows = tokenDocs.docs
    .map((doc) => ({ ref: doc.ref, ...doc.data() }))
    .filter((row) => !!String(row.token || "").trim());
  if (!tokenRows.length) return { sent: 0, failed: 0, tokens: 0 };

  let sent = 0;
  let failed = 0;
  const staleRefs = [];
  const payloadTemplate = buildPushPayloadFromNotification(notification);

  const batches = chunkArray(tokenRows, PUSH_SEND_BATCH_SIZE);
  for (const batch of batches) {
    const tokens = batch.map((row) => String(row.token || "").trim()).filter(Boolean);
    if (!tokens.length) continue;

    const response = await admin.messaging().sendEachForMulticast({
      ...payloadTemplate,
      tokens
    });

    sent += response.successCount || 0;
    failed += response.failureCount || 0;

    response.responses.forEach((item, index) => {
      if (item.success) return;
      const code = item.error?.code || "";
      if (shouldPrunePushToken(code) && batch[index]?.ref) {
        staleRefs.push(batch[index].ref);
      }
    });
  }

  if (staleRefs.length) {
    await Promise.allSettled(staleRefs.map((ref) => ref.delete()));
  }

  logger.info("Push send complete", {
    notificationId,
    recipientId,
    attempted: tokenRows.length,
    sent,
    failed,
    stalePruned: staleRefs.length
  });

  return { sent, failed, tokens: tokenRows.length };
}

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
  { region: "asia-southeast1", cors: true },
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

// ---------------------------------------------------------------------------
// Phone+password login email sync.
// The client cannot call updateEmail() because Email Enumeration Protection is
// enabled on the project (auth/operation-not-allowed), so re-pointing the
// synthetic login mailbox (<digits>@phone.gisugo.app) at the user's new profile
// phone must happen here with the Admin SDK. The phone is read from the
// caller's OWN user_private doc — never from client input.
// ---------------------------------------------------------------------------

const PHONE_SYNTHETIC_EMAIL_DOMAIN = "phone.gisugo.app";
// Mirrors the login/profile dropdowns and firebase-auth.js.
const PHONE_COUNTRY_CODES = ["+971", "+63", "+44", "+61", "+81", "+82", "+65", "+60", "+66", "+84", "+62", "+49", "+33", "+86", "+91", "+1"];

// Mirrors normalizePhoneNumber() in public/js/firebase-auth.js — the outputs
// MUST match or a login created client-side could never be synced here.
function normalizePhoneForLogin(stored) {
  const s = String(stored || "").trim();
  if (!s) return null;
  let code = "+63";
  let rest = s;
  const codes = PHONE_COUNTRY_CODES.slice().sort((a, b) => b.length - a.length);
  for (const c of codes) {
    if (s.startsWith(c)) { code = c; rest = s.slice(c.length); break; }
  }
  let digits = rest.replace(/\D/g, "");
  const ccDigits = code.replace(/\D/g, "");
  if (!digits) return null;
  if (ccDigits === "63") {
    if (digits.length === 12 && digits.startsWith("63")) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
    if (digits.length !== 10 || !digits.startsWith("9")) return null;
    return "+63" + digits;
  }
  if (digits.startsWith(ccDigits)) digits = digits.slice(ccDigits.length);
  digits = digits.replace(/^0+/, "");
  if (digits.length < 5 || digits.length > 15) return null;
  return "+" + ccDigits + digits;
}

exports.syncPhoneLoginEmail = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const user = await admin.auth().getUser(uid);
    const hasPassword = (user.providerData || []).some((p) => p.providerId === "password");
    const isSynthetic = String(user.email || "").toLowerCase().endsWith("@" + PHONE_SYNTHETIC_EMAIL_DOMAIN);
    if (!hasPassword || !isSynthetic) {
      // No phone+password login on this account (or a legacy real-email one) —
      // nothing to move.
      return { status: "skipped" };
    }

    const privateSnap = await db.collection("user_private").doc(uid).get();
    const storedPhone = privateSnap.exists ? String(privateSnap.data().phoneNumber || "") : "";
    if (!storedPhone) {
      return { status: "no-phone" };
    }
    const normalized = normalizePhoneForLogin(storedPhone);
    if (!normalized) {
      return { status: "invalid-phone" };
    }
    const newEmail = normalized.replace(/\D/g, "") + "@" + PHONE_SYNTHETIC_EMAIL_DOMAIN;
    if (String(user.email).toLowerCase() === newEmail.toLowerCase()) {
      return { status: "unchanged" };
    }

    try {
      // emailVerified:true — synthetic mailboxes have no inbox, so they can
      // never verify; marking verified keeps every email gate out of the way.
      await admin.auth().updateUser(uid, { email: newEmail, emailVerified: true });
    } catch (error) {
      if (error && error.code === "auth/email-already-exists") {
        logger.warn("syncPhoneLoginEmail collision", { uid, phone: normalized });
        return { status: "collision" };
      }
      logger.error("syncPhoneLoginEmail failed", { uid, code: error && error.code });
      throw new HttpsError("internal", "Could not update the phone login.");
    }

    logger.info("syncPhoneLoginEmail moved", { uid, phone: normalized });
    return { status: "moved", phone: normalized };
  }
);

function bannedPhoneDocId(normalizedE164) {
  return String(normalizedE164 || "").replace(/\D/g, "");
}

async function assertPhoneWritable(uid, normalized) {
  const banSnap = await db.collection("banned_phones").doc(bannedPhoneDocId(normalized)).get();
  if (banSnap.exists) {
    const bannedUid = String((banSnap.data() || {}).bannedUid || "");
    if (bannedUid && bannedUid !== uid) {
      throw new HttpsError("failed-precondition", "This phone number cannot be used.");
    }
  }

  const takenSnap = await db.collection("user_private")
    .where("phoneNumber", "==", normalized)
    .limit(8)
    .get();
  const takenByOther = takenSnap.docs.some((doc) => doc.id !== uid);
  if (takenByOther) {
    throw new HttpsError("failed-precondition", "This phone number is already registered.");
  }
}

async function stampBannedPhone(targetUserId, adminUid, adminName) {
  const privateSnap = await db.collection("user_private").doc(targetUserId).get();
  const stored = privateSnap.exists ? String((privateSnap.data() || {}).phoneNumber || "") : "";
  const normalized = normalizePhoneForLogin(stored);
  if (!normalized) {
    logger.warn("adminModerateUser ban: no usable phone to stamp", { targetUserId });
    return { stamped: false };
  }
  await db.collection("banned_phones").doc(bannedPhoneDocId(normalized)).set({
    phone: normalized,
    bannedUid: targetUserId,
    bannedAt: admin.firestore.FieldValue.serverTimestamp(),
    bannedBy: adminUid,
    bannedByName: adminName
  }, { merge: true });
  return { stamped: true, phone: normalized };
}

// Phase 9 phone banlist + uniqueness. The only write path for
// user_private.phoneNumber (rules block client writes). Ban stamps
// banned_phones; Unban leaves the entry so only that uid can reuse it.
exports.saveUserPhone = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const raw = String(request.data?.phone || "").trim();
    const normalized = normalizePhoneForLogin(raw);
    if (!normalized) {
      throw new HttpsError("invalid-argument", "Please enter a valid phone number.");
    }

    await assertPhoneWritable(uid, normalized);

    await db.collection("user_private").doc(uid).set({
      phoneNumber: normalized,
      lastModified: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return { status: "saved", phone: normalized };
  }
);

exports.getFaceVerificationMediaAccess = onCall(
  { region: "asia-southeast1", cors: true },
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
    // FVV is a public trust signal — any authenticated user can view it on a profile page.
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

/**
 * Reveal a job applicant's phone number to the gig owner (Direct contact flow).
 *
 * The worker phone lives ONLY in the owner-only `user_private` collection, never on
 * any world-readable doc, so it can't be scraped. This callable is the single
 * server-side path that returns it, and only after verifying the caller owns the
 * gig the application belongs to. Rate-limited per owner, and every reveal bumps a
 * dashboard metric counter.
 */
exports.revealApplicantContact = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const requesterUid = request.auth?.uid || "";
    if (!requesterUid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const applicationId = String(request.data?.applicationId || "").trim();
    if (!applicationId) {
      throw new HttpsError("invalid-argument", "applicationId is required.");
    }

    // Resolve application -> job and verify the caller owns the gig.
    const appDoc = await db.collection("applications").doc(applicationId).get();
    if (!appDoc.exists) {
      throw new HttpsError("not-found", "Application not found.");
    }
    const app = appDoc.data() || {};
    const jobId = app.jobId || "";
    const applicantId = app.applicantId || "";
    if (!jobId || !applicantId) {
      throw new HttpsError("failed-precondition", "Application is missing job or applicant reference.");
    }

    const jobDoc = await db.collection("jobs").doc(jobId).get();
    if (!jobDoc.exists) {
      throw new HttpsError("not-found", "Job not found.");
    }
    const job = jobDoc.data() || {};
    if (job.posterId !== requesterUid) {
      throw new HttpsError("permission-denied", "Only the gig owner can reveal an applicant's contact.");
    }

    // Sliding-window rate limit per gig owner.
    const limitRef = db.collection("contact_reveal_limits").doc(requesterUid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(limitRef);
      const now = Date.now();
      const data = snap.exists ? (snap.data() || {}) : {};
      const windowStart = typeof data.windowStart === "number" ? data.windowStart : 0;
      const count = typeof data.count === "number" ? data.count : 0;
      if (now - windowStart > CONTACT_REVEAL_WINDOW_MS) {
        tx.set(limitRef, { windowStart: now, count: 1, updatedAt: now });
        return;
      }
      if (count >= CONTACT_REVEAL_MAX_PER_WINDOW) {
        throw new HttpsError("resource-exhausted", "Too many contact reveals right now. Please wait a bit and try again.");
      }
      tx.set(limitRef, { windowStart, count: count + 1, updatedAt: now }, { merge: true });
    });

    // Read the applicant's phone from owner-only private storage (admin bypasses rules).
    const privateDoc = await db.collection("user_private").doc(applicantId).get();
    const phoneNumber = privateDoc.exists
      ? String((privateDoc.data() || {}).phoneNumber || "").trim()
      : "";
    if (!phoneNumber) {
      throw new HttpsError("failed-precondition", "This applicant has no contact number on file.");
    }

    // Best-effort: bump the dashboard reveal counter + application audit fields.
    try {
      await db.collection("metrics").doc("contact_reveals").set({
        total: admin.firestore.FieldValue.increment(1),
        lastRevealAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await appDoc.ref.set({
        contactRevealCount: admin.firestore.FieldValue.increment(1),
        contactLastRevealedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      logger.warn("Contact reveal counter update skipped", { applicationId, error: String(error) });
    }

    return { phoneNumber, applicantId };
  }
);

/**
 * Worker (offered / hired on the gig) reveals the customer's phone from user_private.
 * Same Direct model as revealApplicantContact: number never stored on readable docs.
 * Auth: requester must be job.hiredWorkerId; status hired|accepted. Rate-limited per worker.
 */
exports.revealPosterContact = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const requesterUid = request.auth?.uid || "";
    if (!requesterUid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const jobId = String(request.data?.jobId || "").trim();
    if (!jobId) {
      throw new HttpsError("invalid-argument", "jobId is required.");
    }

    const jobDoc = await db.collection("jobs").doc(jobId).get();
    if (!jobDoc.exists) {
      throw new HttpsError("not-found", "Job not found.");
    }
    const job = jobDoc.data() || {};
    const posterId = String(job.posterId || "").trim();
    const hiredWorkerId = String(job.hiredWorkerId || "").trim();
    const status = String(job.status || "").trim();

    if (!posterId) {
      throw new HttpsError("failed-precondition", "Job is missing poster reference.");
    }
    if (hiredWorkerId !== requesterUid) {
      throw new HttpsError("permission-denied", "Only the offered worker can reveal this customer's contact.");
    }
    if (status !== "hired" && status !== "accepted") {
      throw new HttpsError("failed-precondition", "This gig is not in an offered or active state.");
    }

    const limitRef = db.collection("contact_reveal_limits").doc(requesterUid);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(limitRef);
      const now = Date.now();
      const data = snap.exists ? (snap.data() || {}) : {};
      const windowStart = typeof data.windowStart === "number" ? data.windowStart : 0;
      const count = typeof data.count === "number" ? data.count : 0;
      if (now - windowStart > CONTACT_REVEAL_WINDOW_MS) {
        tx.set(limitRef, { windowStart: now, count: 1, updatedAt: now });
        return;
      }
      if (count >= CONTACT_REVEAL_MAX_PER_WINDOW) {
        throw new HttpsError("resource-exhausted", "Too many contact reveals right now. Please wait a bit and try again.");
      }
      tx.set(limitRef, { windowStart, count: count + 1, updatedAt: now }, { merge: true });
    });

    const privateDoc = await db.collection("user_private").doc(posterId).get();
    const phoneNumber = privateDoc.exists
      ? String((privateDoc.data() || {}).phoneNumber || "").trim()
      : "";
    if (!phoneNumber) {
      throw new HttpsError("failed-precondition", "This customer has no contact number on file.");
    }

    try {
      await db.collection("metrics").doc("contact_reveals").set({
        total: admin.firestore.FieldValue.increment(1),
        lastRevealAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      logger.warn("Contact reveal counter update skipped (poster)", { jobId, error: String(error) });
    }

    return { phoneNumber, posterId };
  }
);

exports.auditAndRepairFaceVerification = onCall(
  { region: "asia-southeast1", cors: true },
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
  { region: "asia-southeast1", timeoutSeconds: 180, memory: "1GiB", cors: true },
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

      const keepFaceFiles = new Set([
        canonicalPath,
        `face_verification/${targetUserId}/face_poster.jpg`
      ]);
      const [faceItems] = await bucket.getFiles({
        prefix: `face_verification/${targetUserId}/`
      });
      await Promise.all((faceItems || []).map((item) => {
        const name = item && item.name;
        if (!name || name.endsWith("/") || keepFaceFiles.has(name)) {
          return Promise.resolve();
        }
        return deleteStorageObjectIfExists(name);
      }));

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
  { schedule: "every 24 hours", region: "asia-southeast1", timeZone: "Asia/Manila" },
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

exports.syncNotificationCountersOnWrite = onDocumentWritten(
  { document: "notifications/{notificationId}", region: "asia-southeast1" },
  async (event) => {
    const before = event.data?.before?.exists ? (event.data.before.data() || {}) : null;
    const after = event.data?.after?.exists ? (event.data.after.data() || {}) : null;

    const recipientCandidates = new Set([
      String(before?.recipientId || "").trim(),
      String(after?.recipientId || "").trim()
    ]);
    const recipientIds = Array.from(recipientCandidates).filter(Boolean);
    if (!recipientIds.length) return;

    await Promise.all(recipientIds.map(async (userId) => {
      try {
        await recomputeNotificationCountersForUser(userId);
      } catch (error) {
        logger.error("Notification counter sync failed", {
          userId,
          notificationId: event.params?.notificationId || "",
          error: String(error)
        });
      }
    }));
  }
);

exports.sendPushOnNotificationCreate = onDocumentCreated(
  { document: "notifications/{notificationId}", region: "asia-southeast1" },
  async (event) => {
    const notification = event.data?.data() || {};
    const notificationId = String(event.params?.notificationId || "");
    try {
      await sendPushForNotificationDoc(notificationId, notification);
    } catch (error) {
      logger.error("Push send failed", {
        notificationId,
        recipientId: String(notification.recipientId || ""),
        error: String(error)
      });
    }
  }
);

// ============================================================================
// PLATFORM ANALYTICS COUNTERS (Admin Dashboard — Gigs Analytics)
// ============================================================================
// Cheap counter-map pattern, same idea as syncNotificationCountersOnWrite /
// metrics/contact_reveals above: the dashboard must never scan or live-listen
// the real jobs/applications collections just to show a number. Instead these
// two tiny platform_analytics docs are kept in sync here, one Firestore write
// per gig post / per application, and the dashboard reads only those two small
// docs. All-time cumulative counters (increment on CREATE only, never
// decremented on edit/delete) per docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md
// ("increment both maps on the same post/apply write") — "Total Gigs Posted"
// and "Total Applications" are meant to read as historical totals, not a
// live snapshot of what's currently active, so editing or deleting a gig
// later intentionally does not move these buckets.

function sanitizePlatformAnalyticsKey(value, fallback) {
  const raw = String(value || "").trim();
  return raw || fallback;
}

exports.syncGigAnalyticsCountersOnCreate = onDocumentCreated(
  { document: "jobs/{jobId}", region: "asia-southeast1" },
  async (event) => {
    const job = event.data?.data() || {};
    const category = sanitizePlatformAnalyticsKey(job.category, "uncategorized");
    const gigUseType = sanitizePlatformAnalyticsKey(job.gigUseType, "Personal");

    try {
      // NOTE: nested-object form (byCategory: {...}), NOT a dotted string key
      // (e.g. "byCategory.hatod") -- set(..., {merge:true}) treats a dotted
      // STRING key as one literal field name containing a dot, it does NOT
      // parse it into a nested path (that's only true for .update()). Using
      // a dotted key here silently created a sibling top-level field like
      // "byCategory.hatod" next to the real byCategory map instead of
      // updating it -- found + fixed 2026-08-07 after a bogus region label
      // (Mimaropa, for a signup tested from New Jersey) surfaced the same
      // bug in submitSignupLocation below.
      await db.collection("platform_analytics").doc("gigs").set({
        totalPosted: admin.firestore.FieldValue.increment(1),
        byCategory: { [category]: admin.firestore.FieldValue.increment(1) },
        byGigUseType: { [gigUseType]: admin.firestore.FieldValue.increment(1) },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      logger.error("Gig analytics counter sync failed", {
        jobId: event.params?.jobId || "",
        error: String(error)
      });
    }
  }
);

exports.syncApplicationAnalyticsCountersOnCreate = onDocumentCreated(
  { document: "applications/{applicationId}", region: "asia-southeast1" },
  async (event) => {
    const application = event.data?.data() || {};
    const jobId = String(application.jobId || "").trim();
    let category = "uncategorized";

    if (jobId) {
      try {
        const jobDoc = await db.collection("jobs").doc(jobId).get();
        if (jobDoc.exists) {
          category = sanitizePlatformAnalyticsKey(jobDoc.data().category, "uncategorized");
        }
      } catch (error) {
        logger.error("Application analytics category lookup failed", {
          jobId,
          applicationId: event.params?.applicationId || "",
          error: String(error)
        });
      }
    }

    try {
      await db.collection("platform_analytics").doc("applications").set({
        totalApplications: admin.firestore.FieldValue.increment(1),
        byCategory: { [category]: admin.firestore.FieldValue.increment(1) },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    } catch (error) {
      logger.error("Application analytics counter sync failed", {
        applicationId: event.params?.applicationId || "",
        error: String(error)
      });
    }
  }
);

// ============================================================================
// STORAGE USAGE COUNTERS (Admin Dashboard — Phase 7 Ch 1)
// ============================================================================
// Running byte + file counts on platform_analytics/storage. Dashboard reads
// that tiny doc only — never lists the bucket. Same-path overwrite (e.g.
// profile_photos/{uid}/photo.jpg) nets correctly when GCS fires delete then
// finalize; if only finalize fires, totals can drift until the seed is re-run.

const STORAGE_ANALYTICS_BUCKET = "gisugo1.firebasestorage.app";

async function applyStorageAnalyticsDelta(objectName, sizeBytes, fileDelta) {
  if (!isCountableStorageObject(objectName)) return;
  const size = Math.max(0, Number(sizeBytes) || 0);
  const typeKey = classifyStoragePath(objectName);
  const direction = fileDelta < 0 ? -1 : 1;
  const byteDelta = direction * size;
  const countDelta = direction;
  const ref = db.collection("platform_analytics").doc("storage");

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const prev = snap.exists ? snap.data() || {} : {};
      const prevByType = emptyByType();
      STORAGE_TYPE_KEYS.forEach((key) => {
        const row = (prev.byType && prev.byType[key]) || {};
        prevByType[key] = {
          bytes: Math.max(0, Number(row.bytes) || 0),
          files: Math.max(0, Number(row.files) || 0)
        };
      });
      const prevTotalBytes = Math.max(0, Number(prev.totalBytes) || 0);
      const nextByType = prevByType;
      nextByType[typeKey] = {
        bytes: Math.max(0, nextByType[typeKey].bytes + byteDelta),
        files: Math.max(0, nextByType[typeKey].files + countDelta)
      };
      const nextTotalBytes = Math.max(0, prevTotalBytes + byteDelta);
      const nextTotalFiles = Math.max(0, (Number(prev.totalFiles) || 0) + countDelta);
      tx.set(ref, {
        totalBytes: nextTotalBytes,
        totalFiles: nextTotalFiles,
        byType: nextByType,
        growth: attachGrowthStamp(prev.growth, prevTotalBytes, nextTotalBytes),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    });
  } catch (error) {
    logger.error("Storage analytics counter sync failed", {
      objectName: String(objectName || ""),
      fileDelta: countDelta,
      error: String(error)
    });
  }
}

exports.syncStorageAnalyticsOnFinalize = onObjectFinalized(
  { bucket: STORAGE_ANALYTICS_BUCKET, region: "asia-southeast1" },
  async (event) => {
    const data = event.data || {};
    await applyStorageAnalyticsDelta(data.name, data.size, 1);
  }
);

exports.syncStorageAnalyticsOnDelete = onObjectDeleted(
  { bucket: STORAGE_ANALYTICS_BUCKET, region: "asia-southeast1" },
  async (event) => {
    const data = event.data || {};
    await applyStorageAnalyticsDelta(data.name, data.size, -1);
  }
);

// Admin/owner gig-photo delete. Client Storage rules isAdmin() via
// firestore.exists(admins/{uid}) 403s live, so admin delete of someone
// else's job_photos/{posterId}/... fails silently. This uses the Admin
// SDK. deleteJob() calls this first; client Storage delete is fallback.
const JOB_PHOTO_ID_RE = /^[A-Za-z0-9_-]{8,128}$/;

exports.deleteJobStoragePhotos = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth && request.auth.uid ? request.auth.uid : "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const jobId = String((request.data && request.data.jobId) || "").trim();
    const posterId = String((request.data && request.data.posterId) || "").trim();
    const extraPath = String((request.data && request.data.extraPath) || "")
      .replace(/^\/+/, "")
      .trim();

    if (!JOB_PHOTO_ID_RE.test(jobId) || !JOB_PHOTO_ID_RE.test(posterId)) {
      throw new HttpsError("invalid-argument", "jobId and posterId are required.");
    }

    if (uid !== posterId) {
      const adminDoc = await db.collection("admins").doc(uid).get();
      if (!adminDoc.exists) {
        throw new HttpsError("permission-denied", "You can only delete your own gig photos.");
      }
    }

    const canonical = `job_photos/${posterId}/${jobId}.jpg`;
    const paths = [canonical];
    if (extraPath && extraPath !== canonical) {
      if (!extraPath.startsWith(`job_photos/${posterId}/`) || extraPath.includes("..")) {
        throw new HttpsError("invalid-argument", "extraPath is not allowed.");
      }
      paths.push(extraPath);
    }

    const bucket = admin.storage().bucket(STORAGE_ANALYTICS_BUCKET);
    const deleted = [];
    for (const name of paths) {
      try {
        await bucket.file(name).delete({ ignoreNotFound: true });
        deleted.push(name);
      } catch (error) {
        logger.error("deleteJobStoragePhotos failed", { name, uid, error: String(error) });
        throw new HttpsError("internal", "Could not delete gig photo.");
      }
    }

    logger.info("deleteJobStoragePhotos", { uid, jobId, posterId, deleted });
    return { success: true, deleted };
  }
);

// deleteJob() application + coin cleanup. Queries applications by
// jobId (do not trust job.applicationIds alone — withdrawn / older
// apps can be missing from that array). Also accepts listed IDs.
// Skips missing docs. Refunds only pending / accepted / hired.
exports.cleanupDeletedJobApplications = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth && request.auth.uid ? request.auth.uid : "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const jobId = String((request.data && request.data.jobId) || "").trim();
    const applicationIds = Array.isArray(request.data && request.data.applicationIds)
      ? request.data.applicationIds
      : [];
    if (!isSafeId(jobId)) {
      throw new HttpsError("invalid-argument", "jobId is required.");
    }
    if (applicationIds.length > 80) {
      throw new HttpsError("invalid-argument", "Too many applicationIds.");
    }

    const jobSnap = await db.collection("jobs").doc(jobId).get();
    if (!jobSnap.exists) {
      throw new HttpsError("not-found", "Gig not found.");
    }
    const posterId = String((jobSnap.data() || {}).posterId || (jobSnap.data() || {}).userId || "").trim();
    if (uid !== posterId) {
      const adminDoc = await db.collection("admins").doc(uid).get();
      if (!adminDoc.exists) {
        throw new HttpsError("permission-denied", "You can only clean up applications on your own gig.");
      }
    }

    try {
      const result = await cleanupJobApplications(db, admin.firestore.FieldValue, {
        jobId,
        applicationIds,
        reason: "job_deleted"
      });
      logger.info("cleanupDeletedJobApplications", { uid, jobId, ...result });
      return { success: true, ...result };
    } catch (error) {
      logger.error("cleanupDeletedJobApplications failed", { uid, jobId, error: String(error) });
      throw new HttpsError("internal", "Could not clean up applications.");
    }
  }
);

// Storage hygiene Ch 5 — self-only. Future account self-delete can call
// this. Permanently Ban must never call it (ban keeps Storage evidence).
exports.wipeAccountMedia = onCall(
  { region: "asia-southeast1", cors: true, timeoutSeconds: 120 },
  async (request) => {
    const uid = request.auth && request.auth.uid ? request.auth.uid : "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const targetUserId = String((request.data && request.data.targetUserId) || uid).trim();
    if (targetUserId !== uid) {
      throw new HttpsError("permission-denied", "You can only wipe your own account media.");
    }
    try {
      const result = await wipeAccountMedia(
        db,
        admin.storage().bucket(STORAGE_ANALYTICS_BUCKET),
        uid,
        { dryRun: Boolean(request.data && request.data.dryRun) }
      );
      logger.info("wipeAccountMedia", {
        uid,
        dryRun: result.dryRun,
        count: result.count,
        jobPhotosWiped: result.jobPhotosWiped
      });
      return result;
    } catch (error) {
      logger.error("wipeAccountMedia failed", { uid, error: String(error) });
      throw new HttpsError("internal", error.message || "Wipe failed.");
    }
  }
);

// ============================================================================
// OVERVIEW SNAPSHOTS (Admin Dashboard — Phase 7 Ch 3–4)
// ============================================================================
// Manual refresh only. Browser never talks to GA4 or Cloud Monitoring.
// GA4_PROPERTY_ID is empty until Analytics is linked. Monitoring fills
// Traffic without a Billing Account grant (invoice export is leftover).

const GA4_PROPERTY_ID = String(process.env.GA4_PROPERTY_ID || "551027693").trim();
async function assertIsAdmin(request) {
  const uid = request.auth?.uid || "";
  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  const adminDoc = await db.collection("admins").doc(uid).get();
  if (!adminDoc.exists) {
    throw new HttpsError("permission-denied", "Admin access required.");
  }
  return uid;
}

exports.refreshUserActivitySnapshot = onCall(
  { region: "asia-southeast1", cors: true, timeoutSeconds: 60 },
  async (request) => {
    await assertIsAdmin(request);
    let snapshot = emptyUserActivity();
    try {
      snapshot = await fetchUserActivityFromGa4(GA4_PROPERTY_ID);
    } catch (error) {
      logger.error("User Activity GA4 refresh failed", { error: String(error) });
      snapshot.status = "error";
      snapshot.error = String(error.message || error);
    }
    snapshot.refreshedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("platform_analytics").doc("user_activity").set(snapshot);
    return { success: true, status: snapshot.status };
  }
);

exports.refreshTrafficSnapshot = onCall(
  { region: "asia-southeast1", cors: true, timeoutSeconds: 60 },
  async (request) => {
    await assertIsAdmin(request);
    let snapshot = emptyTraffic();
    try {
      snapshot = await fetchTrafficFromMonitoring();
      const storageDoc = await db.collection("platform_analytics").doc("storage").get();
      const storageBytes = Math.max(0, Number(storageDoc.exists ? storageDoc.data().totalBytes : 0) || 0);
      const storageUsd = estimateStorageUsd(storageBytes);
      snapshot.costBreakdown = snapshot.costBreakdown || emptyTraffic().costBreakdown;
      snapshot.costBreakdown.storage = storageUsd;
      snapshot.costUsd = Number(snapshot.costUsd || 0) + storageUsd;
    } catch (error) {
      logger.error("Traffic snapshot refresh failed", { error: String(error) });
      snapshot.status = "error";
      snapshot.error = String(error.message || error);
    }
    snapshot.refreshedAt = admin.firestore.FieldValue.serverTimestamp();
    await db.collection("platform_analytics").doc("traffic").set(snapshot);
    return { success: true, status: snapshot.status };
  }
);

// ============================================================================
// GIG MODERATION -- REPORT COUNTER (Admin Dashboard Phase 2)
// ============================================================================
// One gig_reports doc already exists per (jobId, reporterId) pair -- see
// submitGigReportToAdmin() in firebase-db.js. Firestore has no cheap
// "group by jobId, count" query, so instead of scanning gig_reports at read
// time, this trigger keeps a running reportCount directly on the job doc
// (cheap, same counter-doc philosophy as the analytics syncs above) and
// flips status to 'reported' once a threshold is crossed. This is the ONLY
// path that is allowed to write reportCount/status:'reported' -- the owner
// update rule in firestore.rules explicitly blocks the job poster from
// touching either, so a reported gig can't quietly un-report itself.
const GIG_REPORT_THRESHOLD_DEFAULT = 10;

exports.syncGigReportCountersOnCreate = onDocumentCreated(
  { document: "gig_reports/{reportId}", region: "asia-southeast1" },
  async (event) => {
    const report = event.data?.data() || {};
    const jobId = String(report.jobId || "").trim();
    if (!jobId) return;

    const jobRef = db.collection("jobs").doc(jobId);
    try {
      await db.runTransaction(async (tx) => {
        const jobSnap = await tx.get(jobRef);
        if (!jobSnap.exists) return;
        const job = jobSnap.data() || {};
        const newCount = (Number(job.reportCount) || 0) + 1;
        const threshold = Number(job.reportThreshold) || GIG_REPORT_THRESHOLD_DEFAULT;

        const update = {
          reportCount: newCount,
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        };
        // Only escalate a currently-active gig into the moderation queue --
        // a gig that's already reported/suspended/hired/completed isn't
        // re-flagged or overwritten by a late-arriving report.
        if (newCount >= threshold && job.status === "active") {
          update.status = "reported";
          // Lock the threshold in explicitly (was implicit default before)
          // so a future "Ignore" action has a real number to add +10 to.
          update.reportThreshold = threshold;
        }
        tx.update(jobRef, update);
      });
    } catch (error) {
      logger.error("syncGigReportCountersOnCreate failed", { jobId, error: String(error) });
    }
  }
);

// ============================================================================
// GIG MODERATION -- ADMIN ACTIONS (Admin Dashboard Phase 2)
// ============================================================================
// Client-side firestore.rules give admins zero direct write access to
// jobs.status (see the jobs/{jobId} update rule) -- suspend/reinstate/ignore
// only exist through this callable, which checks admin membership itself
// via the Admin SDK (bypasses rules) against the same admins/{uid}
// collection the rules' isAdmin() reads from, so there is exactly one
// source of truth for "who is an admin," not a second hardcoded list.
const GIG_MODERATION_ACTIONS = new Set(["suspend", "reinstate", "ignore"]);

exports.adminModerateGig = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const adminDoc = await db.collection("admins").doc(uid).get();
    if (!adminDoc.exists) {
      throw new HttpsError("permission-denied", "Admin access required.");
    }

    const jobId = String(request.data?.jobId || "").trim();
    const action = String(request.data?.action || "").trim();
    const reason = String(request.data?.reason || "").trim().slice(0, 500);

    if (!jobId) {
      throw new HttpsError("invalid-argument", "jobId is required.");
    }
    if (!GIG_MODERATION_ACTIONS.has(action)) {
      throw new HttpsError("invalid-argument", "action must be one of: suspend, reinstate, ignore.");
    }

    const adminName = String(request.auth.token?.name || request.auth.token?.email || uid);
    const jobRef = db.collection("jobs").doc(jobId);
    let previousStatus = "";
    let newStatus = "";

    await db.runTransaction(async (tx) => {
      const jobSnap = await tx.get(jobRef);
      if (!jobSnap.exists) {
        throw new HttpsError("not-found", "Gig not found.");
      }
      const job = jobSnap.data() || {};
      previousStatus = String(job.status || "");

      if (action === "suspend") {
        // Reachable from an active gig an admin caught directly (search /
        // Posted glance), or one already flagged 'reported' by the counter
        // trigger -- both are legitimate starting points for a suspend.
        if (previousStatus !== "active" && previousStatus !== "reported") {
          throw new HttpsError("failed-precondition", `Cannot suspend a gig with status '${previousStatus}'.`);
        }
        newStatus = "suspended";
        tx.update(jobRef, {
          status: newStatus,
          suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
          suspendedBy: uid,
          suspendedByName: adminName,
          suspendReason: reason,
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (action === "reinstate") {
        if (previousStatus !== "suspended") {
          throw new HttpsError("failed-precondition", `Cannot reinstate a gig with status '${previousStatus}'.`);
        }
        newStatus = "active";
        // Clean slate: reinstating is the admin vouching the gig is fine now,
        // so old report history/suspension stamps are cleared rather than
        // left to linger and immediately re-trigger on the next report.
        tx.update(jobRef, {
          status: newStatus,
          reportCount: admin.firestore.FieldValue.delete(),
          reportThreshold: admin.firestore.FieldValue.delete(),
          suspendedAt: admin.firestore.FieldValue.delete(),
          suspendedBy: admin.firestore.FieldValue.delete(),
          suspendedByName: admin.firestore.FieldValue.delete(),
          suspendReason: admin.firestore.FieldValue.delete(),
          reinstatedAt: admin.firestore.FieldValue.serverTimestamp(),
          reinstatedBy: uid,
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        // ignore: dismiss the current batch of reports without a full
        // suspend. Raises the bar for next time instead of resetting it, so
        // a gig that keeps attracting reports doesn't take an identical
        // (small) number to re-flag every time it's ignored.
        if (previousStatus !== "reported") {
          throw new HttpsError("failed-precondition", `Cannot ignore reports on a gig with status '${previousStatus}'.`);
        }
        const currentCount = Number(job.reportCount) || 0;
        newStatus = "active";
        tx.update(jobRef, {
          status: newStatus,
          reportThreshold: currentCount + 10,
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });

    // Best-effort audit trail -- never let a logging failure undo/mask an
    // action that already succeeded.
    try {
      await db.collection("job_moderation_log").add({
        jobId,
        action,
        adminUid: uid,
        adminName,
        previousStatus,
        newStatus,
        reason: reason || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.warn("job_moderation_log write skipped", { jobId, action, error: String(error) });
    }

    return { success: true, status: newStatus };
  }
);

// ============================================================================
// USER MANAGEMENT -- ADMIN ACTIONS (Admin Dashboard Phase 3)
// ============================================================================
// Mirrors adminModerateGig's shape exactly (same admin-check pattern, same
// transaction + best-effort audit-log structure). Four actions:
// "suspend" sets users/{userId}.status = 'suspended', which is exactly the
// transition executeBanCascadeOnUserSuspend listens for -- that Cloud
// Function does the actual cascade (auto-suspend their gigs, withdraw their
// pending applications, reopen gigs where they were hired).
// "reinstate" only restores login/account access -- it deliberately does NOT
// auto-restore whatever the cascade touched (their suspended gigs stay
// suspended). Locked 2026-08-17: the restored user re-posts if they want
// those gigs live again. Admin is not expected to relist them. Investigate
// listed gigs from User Management → Gigs Listed (same on-demand jobs read).
// "ban" (Phase 9): Auth disabled:true + status='banned'. Must already be
// suspended so the cascade has already run. Does NOT re-run the cascade
// and does NOT call wipeAccountMedia -- evidence stays.
// "unban": Auth disabled:false + status='active'. Does not relist gigs
// (same as reinstate). Auth updates happen outside the Firestore
// transaction; if the Firestore stamp fails, Auth is rolled back only
// when the latest status is not already the intended one (avoids a
// two-admin race that would re-enable a just-banned account).
const USER_MODERATION_ACTIONS = new Set(["suspend", "reinstate", "ban", "unban"]);

async function setUserAuthDisabled(uid, disabled) {
  try {
    await admin.auth().updateUser(uid, { disabled });
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new HttpsError("not-found", "Auth account not found for this user.");
    }
    logger.error("adminModerateUser Auth update failed", { uid, disabled, error: String(error) });
    throw new HttpsError("internal", "Could not update login access for this user.");
  }
}

exports.adminModerateUser = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const callerAdminDoc = await db.collection("admins").doc(uid).get();
    if (!callerAdminDoc.exists) {
      throw new HttpsError("permission-denied", "Admin access required.");
    }

    const targetUserId = String(request.data?.userId || "").trim();
    const action = String(request.data?.action || "").trim();
    const reason = String(request.data?.reason || "").trim().slice(0, 500);

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "userId is required.");
    }
    if (!USER_MODERATION_ACTIONS.has(action)) {
      throw new HttpsError("invalid-argument", "action must be one of: suspend, reinstate, ban, unban.");
    }
    if (targetUserId === uid) {
      throw new HttpsError("failed-precondition", "You cannot moderate your own admin account.");
    }

    // Extra guard: moderating another admin (even to reinstate them) requires
    // super_admin -- a limited/compromised support-role admin should not be
    // able to suspend a fellow admin's account through this path.
    const targetAdminDoc = await db.collection("admins").doc(targetUserId).get();
    if (targetAdminDoc.exists && callerAdminDoc.data()?.role !== "super_admin") {
      throw new HttpsError("permission-denied", "Only a super admin can moderate another admin account.");
    }

    const adminName = String(request.auth.token?.name || request.auth.token?.email || uid);
    const userRef = db.collection("users").doc(targetUserId);
    let previousStatus = "";
    let newStatus = "";

    if (action === "ban" || action === "unban") {
      const intendedStatus = action === "ban" ? "banned" : "active";
      const requiredStatus = action === "ban" ? "suspended" : "banned";
      const disableLogin = action === "ban";

      await setUserAuthDisabled(targetUserId, disableLogin);
      try {
        await db.runTransaction(async (tx) => {
          const userSnap = await tx.get(userRef);
          if (!userSnap.exists) {
            throw new HttpsError("not-found", "User not found.");
          }
          previousStatus = String((userSnap.data() || {}).status || "active");
          if (previousStatus !== requiredStatus) {
            throw new HttpsError(
              "failed-precondition",
              action === "ban"
                ? `Cannot ban a user with status '${previousStatus}'. User must already be suspended.`
                : `Cannot unban a user with status '${previousStatus}'.`
            );
          }
          newStatus = intendedStatus;
          if (action === "ban") {
            tx.update(userRef, {
              status: newStatus,
              bannedAt: admin.firestore.FieldValue.serverTimestamp(),
              bannedBy: uid,
              bannedByName: adminName,
              lastModified: admin.firestore.FieldValue.serverTimestamp()
            });
          } else {
            tx.update(userRef, {
              status: newStatus,
              bannedAt: admin.firestore.FieldValue.delete(),
              bannedBy: admin.firestore.FieldValue.delete(),
              bannedByName: admin.firestore.FieldValue.delete(),
              suspendedAt: admin.firestore.FieldValue.delete(),
              suspendedBy: admin.firestore.FieldValue.delete(),
              suspendedByName: admin.firestore.FieldValue.delete(),
              suspendReason: admin.firestore.FieldValue.delete(),
              unbannedAt: admin.firestore.FieldValue.serverTimestamp(),
              unbannedBy: uid,
              lastModified: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        });
      } catch (error) {
        let latestStatus = "";
        try {
          const latestSnap = await userRef.get();
          latestStatus = latestSnap.exists ? String((latestSnap.data() || {}).status || "") : "";
        } catch (readError) {
          logger.error("adminModerateUser post-Auth status re-read failed", {
            targetUserId, action, error: String(readError)
          });
        }
        if (latestStatus !== intendedStatus) {
          try {
            await setUserAuthDisabled(targetUserId, !disableLogin);
          } catch (rollbackError) {
            logger.error("adminModerateUser Auth rollback failed", {
              targetUserId, action, error: String(error), rollbackError: String(rollbackError)
            });
          }
        }
        if (error instanceof HttpsError) throw error;
        logger.error("adminModerateUser Firestore stamp failed", { targetUserId, action, error: String(error) });
        throw new HttpsError("internal", `Could not stamp the ${action}. Login change was rolled back.`);
      }
    } else {
      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) {
          throw new HttpsError("not-found", "User not found.");
        }
        const user = userSnap.data() || {};
        previousStatus = String(user.status || "active");

        if (action === "suspend") {
          if (previousStatus === "suspended") {
            throw new HttpsError("failed-precondition", "User is already suspended.");
          }
          if (previousStatus === "banned") {
            throw new HttpsError("failed-precondition", "Cannot suspend a banned user. Unban them first.");
          }
          newStatus = "suspended";
          tx.update(userRef, {
            status: newStatus,
            suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
            suspendedBy: uid,
            suspendedByName: adminName,
            suspendReason: reason,
            lastModified: admin.firestore.FieldValue.serverTimestamp()
          });
        } else { // reinstate
          if (previousStatus !== "suspended") {
            throw new HttpsError("failed-precondition", `Cannot reinstate a user with status '${previousStatus}'.`);
          }
          newStatus = "active";
          tx.update(userRef, {
            status: newStatus,
            suspendedAt: admin.firestore.FieldValue.delete(),
            suspendedBy: admin.firestore.FieldValue.delete(),
            suspendedByName: admin.firestore.FieldValue.delete(),
            suspendReason: admin.firestore.FieldValue.delete(),
            reinstatedAt: admin.firestore.FieldValue.serverTimestamp(),
            reinstatedBy: uid,
            lastModified: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      });
    }

    if (action === "ban") {
      try {
        await stampBannedPhone(targetUserId, uid, adminName);
      } catch (error) {
        logger.error("adminModerateUser banned_phones stamp failed", {
          targetUserId, error: String(error)
        });
      }
    }

    try {
      await db.collection("user_moderation_log").add({
        userId: targetUserId,
        action,
        adminUid: uid,
        adminName,
        previousStatus,
        newStatus,
        reason: reason || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      logger.warn("user_moderation_log write skipped", { targetUserId, action, error: String(error) });
    }

    return { success: true, status: newStatus };
  }
);

// Age bucket boundaries for the Admin Dashboard's Age Groups breakdown.
// Matches the 4 brackets already laid out in admin-dashboard.html's Age
// Groups card (18-25 / 26-40 / 41-59 / 60+) so no UI redesign is needed.
// dateOfBirth became a required signup field 2026-08-06 specifically so this
// has full coverage going forward; pre-existing accounts that signed up
// before then may have it blank -- those fall into "unknown", not a crash.
function bucketAgeGroup(dateOfBirthValue) {
  const raw = String(dateOfBirthValue || "").trim();
  if (!raw) return "unknown";

  const birthDate = new Date(raw);
  if (Number.isNaN(birthDate.getTime())) return "unknown";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 18) return "unknown"; // shouldn't happen (signup enforces 18+), guard anyway
  if (age <= 25) return "18-25";
  if (age <= 40) return "26-40";
  if (age <= 59) return "41-59";
  return "60+";
}

// Account-type bucket for the Admin Dashboard's Account Types breakdown
// (New Member / Pro Verified / Business Verified). Mutually exclusive,
// business takes priority over pro if somehow both are true. Both
// verification.proVerified and verification.businessVerified are real,
// already-live fields on every user doc (createUserProfile default), so
// this is real data even though the *workflow* that flips them true for ID
// verification isn't fully built yet -- Face Verification Video already
// sets some of this today.
function bucketAccountType(userData) {
  const verification = (userData && userData.verification) || {};
  if (verification.businessVerified) return "business";
  if (verification.proVerified) return "pro";
  return "new";
}

exports.syncUserAnalyticsCountersOnWrite = onDocumentWritten(
  { document: "users/{userId}", region: "asia-southeast1" },
  async (event) => {
    const before = event.data?.before?.exists ? (event.data.before.data() || {}) : null;
    const after = event.data?.after?.exists ? (event.data.after.data() || {}) : null;
    if (!before && !after) return;

    // Unlike Gigs Analytics (deliberately all-time cumulative), both Age
    // Groups and Account Types are meant to describe the CURRENT user base
    // composition, matching the Overview headline's live totalUsers count
    // (getAdminAnalytics() -> users collection .get().size, which already
    // shrinks on deletion) -- so these counters move on create, update
    // (account-type only -- a verification status change), AND delete, to
    // stay consistent with that number. Not tracking a competing totalUsers
    // field here; these are breakdowns of that same live total, not a
    // second source of truth for it.
    // NOTE: every bucket update below uses a nested-object shape
    // (byAgeGroup: {bucket: increment(...)}), NEVER a dotted string key
    // (e.g. "byAgeGroup.18-25") -- set(..., {merge:true}) treats a dotted
    // STRING key as one literal field name containing a dot, it does NOT
    // parse it into a nested path (only .update() does that). A dotted key
    // here would silently create a useless sibling field instead of
    // touching the real map the dashboard reads -- found + fixed 2026-08-07.
    const updates = {};

    if (!before && after) {
      // create -- location isn't known yet at this instant (it's captured a
      // few seconds later via the separate submitSignupLocation callable, on
      // the success screen), so every new account starts in byRegion.unknown
      // and submitSignupLocation moves it to the real region once resolved.
      const ageGroup = bucketAgeGroup(after.dateOfBirth);
      const accountType = bucketAccountType(after);
      updates.byAgeGroup = { [ageGroup]: admin.firestore.FieldValue.increment(1) };
      updates.byAccountType = { [accountType]: admin.firestore.FieldValue.increment(1) };
      updates.byRegion = { unknown: admin.firestore.FieldValue.increment(1) };
    } else if (before && !after) {
      // delete -- decrement whatever region bucket this user was last known
      // to be in (read from security_metadata; "unknown" if they never
      // shared location or that doc doesn't exist).
      const ageGroup = bucketAgeGroup(before.dateOfBirth);
      const accountType = bucketAccountType(before);
      updates.byAgeGroup = { [ageGroup]: admin.firestore.FieldValue.increment(-1) };
      updates.byAccountType = { [accountType]: admin.firestore.FieldValue.increment(-1) };

      let lastRegion = "unknown";
      try {
        const securitySnap = await db.collection("security_metadata").doc(event.params.userId).get();
        if (securitySnap.exists) {
          lastRegion = securitySnap.data().location?.region || "unknown";
        }
      } catch (error) {
        logger.error("User analytics: failed to read security_metadata on delete", {
          userId: event.params?.userId || "",
          error: String(error)
        });
      }
      updates.byRegion = { [lastRegion]: admin.firestore.FieldValue.increment(-1) };
    } else {
      // update -- dateOfBirth edits after signup deliberately not tracked
      // (same "don't chase every edit" call as Gigs Analytics above), but a
      // verification status change is exactly the kind of transition this
      // breakdown exists to show, so account type DOES move on update.
      const beforeType = bucketAccountType(before);
      const afterType = bucketAccountType(after);
      if (beforeType === afterType) return;
      updates.byAccountType = {
        [beforeType]: admin.firestore.FieldValue.increment(-1),
        [afterType]: admin.firestore.FieldValue.increment(1)
      };
    }

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    try {
      await db.collection("platform_analytics").doc("users").set(updates, { merge: true });
    } catch (error) {
      logger.error("User analytics counter sync failed", {
        userId: event.params?.userId || "",
        error: String(error)
      });
    }
  }
);

// Must match the exact 17 canonical region names baked into
// public/data/ph-regions.geojson (public/js/ph-regions-geo.js classifies
// into these). Validated server-side so a tampered/buggy client can't pollute
// platform_analytics/users.byRegion with arbitrary strings.
const PH_REGION_NAMES = [
  "Ilocos Region", "Cagayan Valley", "Central Luzon", "Calabarzon",
  "Bicol Region", "Western Visayas", "Central Visayas", "Eastern Visayas",
  "Zamboanga Peninsula", "Northern Mindanao", "Davao Region", "Soccsksargen",
  "NCR (Metro Manila)", "CAR (Cordillera)", "Caraga", "Mimaropa", "BARMM"
];

/**
 * Signup-time location + IP capture (Regional Distribution admin stat +
 * Trust & Safety ban-evasion signal, both resolved 2026-08-06). Called once,
 * right after the signup success screen's Face Verification step is
 * confirmed/skipped (see sign-up.js) -- never re-triggered automatically
 * elsewhere. Can also be called again later from Edit Profile's "Share My
 * Location" toggle, which is why this handles a resubmission (region change)
 * cleanly rather than assuming it only ever fires once per account.
 *
 * The client already resolved lat/lng -> region name (public/js/ph-regions-
 * geo.js, free client-side geometry, no server lookup needed) -- this
 * function just validates that region name server-side and adds the one
 * piece a client can never honestly self-report: its own IP address, read
 * here from the request itself.
 */
exports.submitSignupLocation = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const lat = Number(request.data?.lat);
    const lng = Number(request.data?.lng);
    const region = String(request.data?.region || "");

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
        !Number.isFinite(lng) || lng < -180 || lng > 180) {
      throw new HttpsError("invalid-argument", "Invalid coordinates.");
    }
    // 'Overseas' is a legitimate, deliberate result from the client-side
    // classifier (ph-regions-geo.js) -- a real shared location that just
    // isn't one of the 17 PH regions. Distinct from "unknown" (never
    // shared at all). See docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md.
    if (region !== "Overseas" && !PH_REGION_NAMES.includes(region)) {
      throw new HttpsError("invalid-argument", "Invalid region.");
    }

    // Google Cloud Functions/Run sits behind Google Front End, which sets
    // x-forwarded-for to "<client-ip>, <proxy-ips...>" -- the first entry is
    // the real client. req.ip is also populated but x-forwarded-for is the
    // more explicit, well-documented source on this platform.
    const forwardedFor = request.rawRequest?.headers?.["x-forwarded-for"] || "";
    const ip = String(forwardedFor).split(",")[0].trim() || request.rawRequest?.ip || "";

    const securityRef = db.collection("security_metadata").doc(uid);

    try {
      const existingSnap = await securityRef.get();
      const previousRegion = existingSnap.exists ? (existingSnap.data().location?.region || null) : null;

      await securityRef.set({
        location: {
          lat,
          lng,
          region,
          capturedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        lastSignupIp: ip,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Mirror a NON-sensitive flag (no coordinates, no IP) onto user_private
      // so the owner's own "Share My Location" toggle (Edit Profile) can
      // read its own current state -- the owner can never read
      // security_metadata itself (admin-only, see firestore.rules), only
      // this safe summary of it.
      await db.collection("user_private").doc(uid).set({
        locationShared: true,
        locationRegion: region,
        lastModified: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      if (previousRegion !== region) {
        // Nested-object shape (byRegion: {...}), not a dotted string key --
        // see the note on syncUserAnalyticsCountersOnWrite above for why.
        // previousRegion is null on a brand-new capture -- the account is
        // sitting in byRegion.unknown from account-creation time (see
        // syncUserAnalyticsCountersOnWrite above), so move it out of there.
        const previousBucket = previousRegion || "unknown";
        await db.collection("platform_analytics").doc("users").set({
          byRegion: {
            [region]: admin.firestore.FieldValue.increment(1),
            [previousBucket]: admin.firestore.FieldValue.increment(-1)
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }

      return { status: "saved", region };
    } catch (error) {
      logger.error("submitSignupLocation failed", { uid, error: String(error) });
      throw new HttpsError("internal", "Could not save location.");
    }
  }
);

// ============================================================================
// BAN CASCADE (Admin Dashboard Phase 2, dormant until Phase 3 ships)
// ============================================================================
// Phase 3 (User Management) doesn't exist yet -- firestore.rules gives no
// client, including admin, a direct write path to users/{uid}.status today.
// This function is deliberately self-contained and built ahead of that: it
// only needs Phase 3's future ban action to write status: 'suspended' onto
// the user doc via the Admin SDK (which bypasses rules), and this trigger
// picks it up automatically the moment that ships -- nothing here will need
// to change. Implements the locked "Ban cascade" design in
// docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md: (1) auto-suspend the user's
// own live gigs, (2) withdraw their pending applications on other people's
// gigs, (3) reopen any gig where they were the hired worker + notify that
// customer. Deliberately skips refunding "application coins" held by their
// withdrawn applications (see firebase-db.js normalizeApplicationCoins) --
// a banned account has no use for that balance, and isApplicationHoldingCoin()
// already stops treating a 'withdrawn' application as coin-holding regardless,
// so no stale/double-counted state is left behind by skipping it.
exports.executeBanCascadeOnUserSuspend = onDocumentWritten(
  { document: "users/{userId}", region: "asia-southeast1" },
  async (event) => {
    const userId = event.params?.userId || "";
    const before = event.data?.before?.exists ? (event.data.before.data() || {}) : {};
    const after = event.data?.after?.exists ? (event.data.after.data() || {}) : {};

    // Only fire on the actual (not-suspended) -> suspended transition --
    // never on a no-op re-write while already suspended, and never on
    // account deletion (after won't exist, after.status is undefined).
    if (!userId || before.status === "suspended" || after.status !== "suspended") {
      return;
    }

    logger.log("Ban cascade starting", { userId });

    // 1. Auto-suspend every still-live gig this user posted. Not a delete --
    // suspend is reversible and keeps a record, matching adminModerateGig's
    // own suspend semantics above.
    try {
      const postedSnap = await db.collection("jobs")
        .where("posterId", "==", userId)
        .where("status", "in", ["active", "reported"])
        .get();
      if (!postedSnap.empty) {
        const batch = db.batch();
        postedSnap.docs.forEach((doc) => {
          batch.update(doc.ref, {
            status: "suspended",
            suspendedAt: admin.firestore.FieldValue.serverTimestamp(),
            suspendedBy: "system_ban_cascade",
            suspendedByName: "System (account banned)",
            suspendReason: "Poster account banned",
            lastModified: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
      }
      logger.log("Ban cascade: suspended posted gigs", { userId, count: postedSnap.size });
    } catch (error) {
      logger.error("Ban cascade: suspending posted gigs failed", { userId, error: String(error) });
    }

    // 2. Withdraw this user's own pending applications on other people's
    // gigs, freeing whichever application slot they were holding.
    try {
      const pendingAppsSnap = await db.collection("applications")
        .where("applicantId", "==", userId)
        .where("status", "==", "pending")
        .get();
      if (!pendingAppsSnap.empty) {
        const batch = db.batch();
        const jobIdsToResync = new Set();
        pendingAppsSnap.docs.forEach((doc) => {
          const app = doc.data() || {};
          batch.update(doc.ref, {
            status: "withdrawn",
            withdrawnAt: admin.firestore.FieldValue.serverTimestamp(),
            withdrawnReason: "Applicant account banned"
          });
          if (app.jobId) jobIdsToResync.add(String(app.jobId));
        });
        await batch.commit();

        // Keep each affected job's applicationCount honest -- same
        // "count of pending applications" rule the client-side
        // syncJobApplicationCount() enforces after every withdrawal.
        await Promise.all(Array.from(jobIdsToResync).map(async (jobId) => {
          try {
            const stillPending = await db.collection("applications")
              .where("jobId", "==", jobId)
              .where("status", "==", "pending")
              .get();
            await db.collection("jobs").doc(jobId).update({ applicationCount: stillPending.size });
          } catch (error) {
            logger.warn("Ban cascade: applicationCount resync skipped", { jobId, error: String(error) });
          }
        }));
      }
      logger.log("Ban cascade: withdrew pending applications", { userId, count: pendingAppsSnap.size });
    } catch (error) {
      logger.error("Ban cascade: withdrawing pending applications failed", { userId, error: String(error) });
    }

    // 3. Reopen any gig where this (now-banned) user was the hired worker,
    // and notify the customer. Same field-reset shape as the proven
    // relistGigFromChat() "ghost hire" path (public/js/firebase-db.js),
    // replicated here with the Admin SDK since the customer isn't the one
    // acting this time -- the admin's ban is.
    try {
      const hiredSnap = await db.collection("jobs")
        .where("hiredWorkerId", "==", userId)
        .where("status", "in", ["accepted", "hired"])
        .get();

      for (const doc of hiredSnap.docs) {
        const job = doc.data() || {};
        const jobId = doc.id;
        const customerId = String(job.posterId || "").trim();
        const jobTitle = job.title || "Gig";

        await doc.ref.update({
          status: "active",
          hiredWorkerId: admin.firestore.FieldValue.delete(),
          hiredWorkerName: admin.firestore.FieldValue.delete(),
          hiredWorkerThumbnail: admin.firestore.FieldValue.delete(),
          agreedPrice: admin.firestore.FieldValue.delete(),
          hiredAt: admin.firestore.FieldValue.delete(),
          acceptedAt: admin.firestore.FieldValue.delete(),
          relistedAt: admin.firestore.FieldValue.serverTimestamp(),
          relistReason: "Hired worker account banned",
          voidedWorker: job.hiredWorkerName || "Worker",
          voidedWorkerId: userId,
          lastModified: admin.firestore.FieldValue.serverTimestamp()
        });

        // Void this specific worker's own application on this job too, so
        // it stops showing as an active hire in their (now-banned) history.
        try {
          const workerAppsSnap = await db.collection("applications")
            .where("jobId", "==", jobId)
            .where("applicantId", "==", userId)
            .where("status", "in", ["accepted", "hired"])
            .get();
          if (!workerAppsSnap.empty) {
            const appBatch = db.batch();
            workerAppsSnap.docs.forEach((appDoc) => {
              appBatch.update(appDoc.ref, {
                status: "voided",
                voidedAt: admin.firestore.FieldValue.serverTimestamp(),
                voidReason: "Worker account banned"
              });
            });
            await appBatch.commit();
          }
        } catch (error) {
          logger.warn("Ban cascade: voiding worker's own application skipped", { jobId, userId, error: String(error) });
        }

        // Customer-facing notification -- new type, opposite direction from
        // 'contract_voided' (which is worker-facing, for when a customer
        // voids on a worker). Locked copy per architecture study.
        if (customerId) {
          try {
            await db.collection("notifications").add({
              recipientId: customerId,
              type: "worker_banned_gig_reopened",
              role: "customer",
              jobId,
              jobTitle,
              message: `Worker account revoked, your gig "${jobTitle}" has been opened again on the market.`,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              read: false,
              actionRequired: false,
              dedupeKey: null
            });
          } catch (error) {
            logger.warn("Ban cascade: customer notification skipped", { jobId, customerId, error: String(error) });
          }
        }
      }
      logger.log("Ban cascade: reopened hired gigs", { userId, count: hiredSnap.size });
    } catch (error) {
      logger.error("Ban cascade: reopening hired gigs failed", { userId, error: String(error) });
    }

    logger.log("Ban cascade complete", { userId });
  }
);

// ============================================================================
// SUPPORT THREAD — user append (Phase 10 Chapter 1)
// ============================================================================
// Users cannot write support_requests.messages from the client (rules). This
// callable is the only user write path: verify they own the ticket, seed the
// list from the legacy single `reply` field if needed, then append one item.
// Admin replies stay a privileged client write (Chapter 2) using the same
// list shape. Not chat_threads — no jobId, no site-wide listener.
const SUPPORT_THREAD_MAX_MESSAGES = 50;
const SUPPORT_MESSAGE_MAX_CHARS = 5000;

function sanitizeSupportPhotoUrl(value) {
  const url = String(value || "").trim();
  if (!url) return null;
  if (url.length > 2000) return null;
  if (!url.startsWith("https://")) return null;
  return url;
}

function legacySupportMessagesFromTicket(data) {
  const messages = [];
  const original = String(data?.message || "").trim();
  if (original) {
    messages.push({
      sender: "user",
      senderId: data?.requester?.userId || data?.userId || null,
      senderName: String(data?.requester?.name || data?.userName || "User"),
      message: original,
      photoUrl: data?.attachments?.photoUrl || data?.photoUrl || null,
      photoThumbUrl: data?.attachments?.photoThumbUrl || data?.attachments?.photoUrl || data?.photoUrl || null,
      createdAtISO: data?.createdAtISO || null,
      createdAtMs: Number(data?.createdAtMs) || 0
    });
  }
  const replyMessage = String(data?.reply?.message || "").trim();
  if (replyMessage) {
    let replyIso = data?.reply?.repliedAtISO || null;
    let replyMs = Number(data?.reply?.repliedAtMs) || 0;
    const repliedAt = data?.reply?.repliedAt;
    if (repliedAt && typeof repliedAt.toDate === "function") {
      const asDate = repliedAt.toDate();
      replyIso = asDate.toISOString();
      replyMs = asDate.getTime();
    }
    messages.push({
      sender: "admin",
      senderId: data?.reply?.repliedBy?.adminId || null,
      senderName: String(data?.reply?.repliedBy?.adminName || "Admin"),
      message: replyMessage,
      photoUrl: data?.reply?.photoUrl || null,
      photoThumbUrl: data?.reply?.photoThumbUrl || data?.reply?.photoUrl || null,
      createdAtISO: replyIso,
      createdAtMs: replyMs
    });
  }
  return messages;
}

exports.appendSupportUserMessage = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }

    const requestId = String(request.data?.requestId || "").trim();
    const messageText = String(request.data?.message || "").trim();
    const photoUrl = sanitizeSupportPhotoUrl(request.data?.photoUrl);
    const photoThumbUrl = sanitizeSupportPhotoUrl(request.data?.photoThumbUrl) || photoUrl;

    if (!requestId) {
      throw new HttpsError("invalid-argument", "requestId is required.");
    }
    if (!messageText) {
      throw new HttpsError("invalid-argument", "Message text is required.");
    }
    if (messageText.length > SUPPORT_MESSAGE_MAX_CHARS) {
      throw new HttpsError("invalid-argument", `Message must be ${SUPPORT_MESSAGE_MAX_CHARS} characters or fewer.`);
    }

    const ticketRef = db.collection("support_requests").doc(requestId);
    const now = new Date();
    let appended = null;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ticketRef);
      if (!snap.exists) {
        throw new HttpsError("not-found", "Support ticket not found.");
      }
      const data = snap.data() || {};
      const ownerId = data?.requester?.userId || data?.userId || "";
      if (!ownerId || ownerId !== uid) {
        throw new HttpsError("permission-denied", "You can only reply to your own support ticket.");
      }

      const existing = Array.isArray(data.messages) && data.messages.length
        ? data.messages.slice()
        : legacySupportMessagesFromTicket(data);

      if (existing.length >= SUPPORT_THREAD_MAX_MESSAGES) {
        throw new HttpsError("resource-exhausted", "This conversation has reached its message limit.");
      }

      appended = {
        sender: "user",
        senderId: uid,
        senderName: String(request.auth.token?.name || data?.requester?.name || "You"),
        message: messageText,
        photoUrl,
        photoThumbUrl,
        createdAtISO: now.toISOString(),
        createdAtMs: now.getTime()
      };
      existing.push(appended);

      const updates = {
        messages: existing,
        lastSender: "user",
        isReadByRequester: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAtISO: now.toISOString(),
        updatedAtMs: now.getTime(),
        lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdatedAtISO: now.toISOString(),
        lastUpdatedAtMs: now.getTime()
      };
      // Follow-up after resolve returns the ticket to New (status replied).
      if (String(data.status || "") === "resolved") {
        updates.status = "replied";
      }
      tx.update(ticketRef, updates);
    });

    return { success: true, message: appended };
  }
);

// ============================================================================
// SUPPORT — admin Contact (Phase 8)
// ============================================================================
// Admins cannot client-create a support_requests doc owned by someone else
// (create requires requester.userId == auth.uid). This callable creates or
// appends as the target user after verifying the caller is an admin and the
// target is a legal recipient (gig poster / hired worker, or a user-mgmt uid).
const ADMIN_SUPPORT_SOURCES = new Set(["admin_gig_contact", "admin_user_contact"]);
const ADMIN_SUPPORT_TOPIC_CODE = "admin_contact";
const ADMIN_SUPPORT_TOPIC_LABEL = "Message from GISUGO";
const SUPPORT_ADMIN_NOTIFICATION_TYPE = "support_admin_message";

function buildSupportAdminNotificationMessage(jobTitle) {
  const title = String(jobTitle || "").trim();
  if (title) return `GISUGO sent you a message about "${title}".`;
  return "GISUGO sent you a message. Open Support to read and reply.";
}

async function writeSupportAdminNotification({
  recipientId,
  requestId,
  jobId,
  jobTitle,
  role
}) {
  const safeRecipient = String(recipientId || "").trim();
  const safeRequestId = String(requestId || "").trim();
  if (!safeRecipient || !safeRequestId) return null;
  const safeRole = role === "customer" ? "customer" : "worker";
  const safeJobId = String(jobId || "").trim();
  const safeJobTitle = String(jobTitle || "").trim();
  const now = admin.firestore.Timestamp.now();
  const ref = await db.collection("notifications").add({
    recipientId: safeRecipient,
    type: SUPPORT_ADMIN_NOTIFICATION_TYPE,
    role: safeRole,
    jobId: safeJobId,
    jobTitle: safeJobTitle,
    message: buildSupportAdminNotificationMessage(safeJobTitle),
    title: ADMIN_SUPPORT_TOPIC_LABEL,
    supportRequestId: safeRequestId,
    link: `/support.html?ticket=${encodeURIComponent(safeRequestId)}`,
    createdAt: now,
    read: false,
    actionRequired: false
  });
  return ref.id;
}

function buildAdminSupportReferenceId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const stamp = Date.now().toString().slice(-4);
  return `ADMIN-${y}${m}${d}-${stamp}`;
}

exports.createOrAppendAdminSupportMessage = onCall(
  { region: "asia-southeast1", cors: true },
  async (request) => {
    const uid = request.auth?.uid || "";
    if (!uid) {
      throw new HttpsError("unauthenticated", "Authentication required.");
    }
    const adminDoc = await db.collection("admins").doc(uid).get();
    if (!adminDoc.exists) {
      throw new HttpsError("permission-denied", "Admin access required.");
    }

    const targetUserId = String(request.data?.targetUserId || "").trim();
    const messageText = String(request.data?.message || "").trim();
    const source = String(request.data?.source || "").trim();
    const jobId = String(request.data?.jobId || "").trim();
    const photoUrl = sanitizeSupportPhotoUrl(request.data?.photoUrl);
    const photoThumbUrl = sanitizeSupportPhotoUrl(request.data?.photoThumbUrl) || photoUrl;

    if (!targetUserId) {
      throw new HttpsError("invalid-argument", "targetUserId is required.");
    }
    if (!messageText) {
      throw new HttpsError("invalid-argument", "Message text is required.");
    }
    if (messageText.length > SUPPORT_MESSAGE_MAX_CHARS) {
      throw new HttpsError("invalid-argument", `Message must be ${SUPPORT_MESSAGE_MAX_CHARS} characters or fewer.`);
    }
    if (!ADMIN_SUPPORT_SOURCES.has(source)) {
      throw new HttpsError("invalid-argument", "source must be admin_gig_contact or admin_user_contact.");
    }

    let jobTitle = "";
    let notifyRole = "worker";
    if (source === "admin_gig_contact") {
      if (!jobId) {
        throw new HttpsError("invalid-argument", "jobId is required for gig contact.");
      }
      const jobSnap = await db.collection("jobs").doc(jobId).get();
      if (!jobSnap.exists) {
        throw new HttpsError("not-found", "Gig not found.");
      }
      const job = jobSnap.data() || {};
      const posterId = String(job.posterId || "").trim();
      const hiredId = String(job.hiredWorkerId || "").trim();
      if (targetUserId !== posterId && targetUserId !== hiredId) {
        throw new HttpsError(
          "failed-precondition",
          "Recipient must be this gig's poster or hired worker."
        );
      }
      jobTitle = String(job.title || "").trim();
      notifyRole = targetUserId === posterId ? "customer" : "worker";
    } else {
      const userSnap = await db.collection("users").doc(targetUserId).get();
      if (!userSnap.exists) {
        throw new HttpsError("not-found", "User not found.");
      }
    }

    const targetSnap = await db.collection("users").doc(targetUserId).get();
    const target = targetSnap.exists ? (targetSnap.data() || {}) : {};
    const targetName = String(target.fullName || target.name || "User").trim() || "User";
    const targetEmail = String(target.email || "").trim();
    const adminName = String(
      request.auth.token?.name || request.auth.token?.email || adminDoc.data()?.label || "Admin"
    );

    const storedMessage = messageText;

    const openSnap = await db.collection("support_requests")
      .where("requester.userId", "==", targetUserId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    const openDoc = openSnap.docs.find((doc) => {
      const data = doc.data() || {};
      const status = String(data.status || "");
      if (status !== "pending" && status !== "replied") return false;
      const topic = String(data.categoryCode || data.topic || "");
      if (topic !== ADMIN_SUPPORT_TOPIC_CODE) return false;
      const ticketJobId = String(data.jobId || "").trim();
      if (source === "admin_gig_contact") {
        return !!jobId && ticketJobId === jobId;
      }
      return !ticketJobId;
    });

    const now = new Date();
    const adminEntry = {
      sender: "admin",
      senderId: uid,
      senderName: adminName,
      message: storedMessage,
      photoUrl,
      photoThumbUrl,
      createdAtISO: now.toISOString(),
      createdAtMs: now.getTime()
    };

    if (openDoc) {
      const ticketRef = openDoc.ref;
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ticketRef);
        if (!snap.exists) {
          throw new HttpsError("not-found", "Support ticket not found.");
        }
        const data = snap.data() || {};
        const existing = Array.isArray(data.messages) && data.messages.length
          ? data.messages.slice()
          : legacySupportMessagesFromTicket(data);
        if (existing.length >= SUPPORT_THREAD_MAX_MESSAGES) {
          throw new HttpsError("resource-exhausted", "This conversation has reached its message limit.");
        }
        existing.push(adminEntry);
        tx.update(ticketRef, {
          messages: existing,
          lastSender: "admin",
          status: "replied",
          isReadByRequester: false,
          reply: {
            message: storedMessage,
            repliedBy: { adminId: uid, adminName },
            repliedAt: admin.firestore.FieldValue.serverTimestamp(),
            photoUrl,
            photoThumbUrl
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAtISO: now.toISOString(),
          updatedAtMs: now.getTime(),
          lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
          lastUpdatedAtISO: now.toISOString(),
          lastUpdatedAtMs: now.getTime()
        });
      });
      try {
        await writeSupportAdminNotification({
          recipientId: targetUserId,
          requestId: openDoc.id,
          jobId,
          jobTitle,
          role: notifyRole
        });
      } catch (error) {
        logger.error("Support admin notification failed", {
          action: "appended",
          requestId: openDoc.id,
          recipientId: targetUserId,
          error: String(error)
        });
      }
      return { success: true, action: "appended", requestId: openDoc.id };
    }

    const subject = (jobTitle || "").slice(0, 200);
    const referenceId = buildAdminSupportReferenceId();
    const created = {
      source,
      messageType: "support_request",
      channel: "admin_dashboard",
      categoryCode: ADMIN_SUPPORT_TOPIC_CODE,
      categoryLabel: ADMIN_SUPPORT_TOPIC_LABEL,
      subject,
      message: storedMessage,
      requester: {
        userId: targetUserId,
        guestSessionId: null,
        name: targetName,
        email: targetEmail
      },
      attachments: {
        photoUrl: photoUrl || null,
        photoThumbUrl: photoThumbUrl || null
      },
      status: "replied",
      lastSender: "admin",
      messages: [adminEntry],
      priority: "normal",
      assignedTo: null,
      isReadByRequester: false,
      referenceId,
      jobId: jobId || null,
      jobTitle: jobTitle || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAtISO: now.toISOString(),
      updatedAtISO: now.toISOString(),
      lastUpdatedAtISO: now.toISOString(),
      createdAtMs: now.getTime(),
      updatedAtMs: now.getTime(),
      lastUpdatedAtMs: now.getTime(),
      topic: ADMIN_SUPPORT_TOPIC_CODE,
      userName: targetName,
      userEmail: targetEmail,
      userId: targetUserId,
      photoUrl: photoUrl || null
    };
    const docRef = await db.collection("support_requests").add(created);
    try {
      await writeSupportAdminNotification({
        recipientId: targetUserId,
        requestId: docRef.id,
        jobId,
        jobTitle,
        role: notifyRole
      });
    } catch (error) {
      logger.error("Support admin notification failed", {
        action: "created",
        requestId: docRef.id,
        recipientId: targetUserId,
        error: String(error)
      });
    }
    return { success: true, action: "created", requestId: docRef.id };
  }
);
