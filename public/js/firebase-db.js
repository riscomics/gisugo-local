// ============================================================================
// 🗃️ FIREBASE FIRESTORE DATABASE MODULE - GISUGO
// ============================================================================
// 
// This module handles all Firestore database operations:
// - Jobs CRUD operations
// - Applications management
// - Chat/Messages
// - Notifications
// - Admin analytics
//
// ============================================================================

// Launch feed bucket. Default ON. Settings writes launchBucketOn to
// platform_settings/public; apply + listing read it via resolveLaunchFeedBucketOn().
// ON: stay live; at 20 apps notify to review (no pause); listing hides 20+ automatically.
// OFF: pause + block apply at 10.
window.GisugoGigFeedPolicy = {
  launchBucketOn: true,
  bucketMinApps: 20,
  maturePauseAt: 10
};

function isLaunchFeedBucketOn() {
  return window.GisugoGigFeedPolicy && window.GisugoGigFeedPolicy.launchBucketOn !== false;
}

function launchFeedBucketMinApps() {
  const n = Number(window.GisugoGigFeedPolicy && window.GisugoGigFeedPolicy.bucketMinApps);
  return Number.isFinite(n) && n > 0 ? n : 20;
}

function maturePauseAtApps() {
  const n = Number(window.GisugoGigFeedPolicy && window.GisugoGigFeedPolicy.maturePauseAt);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

async function resolveLaunchFeedBucketOn() {
  try {
    if (typeof getPublicPlatformPolicy === 'function') {
      const policy = await getPublicPlatformPolicy();
      const on = !policy || policy.launchBucketOn !== false;
      if (window.GisugoGigFeedPolicy) window.GisugoGigFeedPolicy.launchBucketOn = on;
      return on;
    }
  } catch (_) {
    // fail-open to hardcoded launch default
  }
  return isLaunchFeedBucketOn();
}

// ============================================================================
// JOBS COLLECTION
// ============================================================================

function isAllowedTextCharacter(char) {
  if (!char) return true;
  if (/[\p{L}\p{N}\p{M}\p{Zs}\r\n]/u.test(char)) return true;
  if (/[.,!?'"()\/$&@₱%+=-]/.test(char)) return true;
  if (/[’‘]/.test(char)) return true;
  if (/[\p{Extended_Pictographic}\u200D\uFE0F]/u.test(char)) return true;
  return false;
}

function hasUnsupportedTextChars(value) {
  return Array.from(String(value || ''))
    .some((char) => !isAllowedTextCharacter(char));
}

function validateAllowedTextChars(fields) {
  for (const field of fields) {
    if (!field || typeof field.value !== 'string') continue;
    if (hasUnsupportedTextChars(field.value)) {
      return {
        valid: false,
        message: `${field.label} can only include letters, numbers, emojis, spaces, and basic punctuation.`
      };
    }
  }
  return { valid: true };
}

function triggerPushMilestonePrompt(milestoneType) {
  try {
    if (window.GisugoPushNotifications && typeof window.GisugoPushNotifications.onEngagementMilestone === 'function') {
      window.GisugoPushNotifications.onEngagementMilestone(milestoneType);
    }
  } catch (error) {
    console.warn('⚠️ Push milestone trigger failed:', error);
  }
}

function getSafeValue(source, key, fallback = '') {
  if (!source || typeof source !== 'object') return fallback;
  const value = source[key];
  return value === undefined || value === null ? fallback : value;
}

function getArrayItemSafe(list, index, fallback = '') {
  if (!Array.isArray(list)) return fallback;
  const value = list[index];
  return value === undefined || value === null ? fallback : value;
}

const JOB_CACHE_BY_ID_KEY = 'gisugo_job_cache_by_id_v1';
const JOB_CACHE_BY_CATEGORY_KEY = 'gisugo_job_cache_by_category_v1';
const DEFAULT_APPLICATION_COINS_MAX = 10;

function readJsonStorageSafe(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJsonStorageSafe(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    // Ignore storage quota/privacy mode failures.
  }
}

function normalizeApplicationCoins(profile = {}) {
  const maxCoinsRaw = Number(profile.applicationCoinsMax);
  const maxCoins = Number.isFinite(maxCoinsRaw) && maxCoinsRaw > 0
    ? maxCoinsRaw
    : DEFAULT_APPLICATION_COINS_MAX;
  const currentCoinsRaw = Number(profile.applicationCoinsCurrent);
  const currentCoins = Number.isFinite(currentCoinsRaw)
    ? Math.max(0, Math.min(maxCoins, currentCoinsRaw))
    : maxCoins;
  return { current: currentCoins, max: maxCoins };
}

function isApplicationHoldingCoin(application = {}) {
  const status = String(application.status || '').toLowerCase();
  const holdsByStatus = status === 'pending' || status === 'accepted' || status === 'hired';
  return application.coinHeld !== false && !application.coinReleasedAt && holdsByStatus;
}

async function ensureApplicationCoinsForUser(userId, dbOverride = null) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return { current: DEFAULT_APPLICATION_COINS_MAX, max: DEFAULT_APPLICATION_COINS_MAX };
  const db = dbOverride || getFirestore();
  if (!db) {
    return { current: DEFAULT_APPLICATION_COINS_MAX, max: DEFAULT_APPLICATION_COINS_MAX };
  }

  const userRef = db.collection('users').doc(safeUserId);

  if (isIOSWebKitBrowserForDataPath()) {
    emitIOSDataTrace('dynamic-job:apply', 'coin:status:start', { mode: 'REST_AUTH' });
    try {
      const restHeaders = await withFirestoreReadTimeout(buildFirestoreRestHeadersWithAuth(), 6000);
      const restProfile = await withFirestoreReadTimeout(
        fetchUserProfileViaFirestoreRest(safeUserId, restHeaders),
        8000
      );
      if (!restProfile) {
        emitIOSDataTrace('dynamic-job:apply', 'coin:status:done', { mode: 'REST_AUTH', found: false });
        return { current: DEFAULT_APPLICATION_COINS_MAX, max: DEFAULT_APPLICATION_COINS_MAX };
      }
      const normalized = normalizeApplicationCoins(restProfile);
      let reconciledCurrent = normalized.current;
      try {
        const applicantRows = await withFirestoreReadTimeout(
          fetchApplicationsByApplicantViaFirestoreRest(safeUserId, 200, restHeaders),
          8000
        );
        const heldByJob = new Set();
        const jobCache = new Map();
        const orphanApplications = [];
        for (const row of applicantRows) {
          if (!isApplicationHoldingCoin(row)) continue;
          const applicationId = String(row.id || '').trim();
          const jobId = String(row.jobId || '').trim();
          if (!applicationId || !jobId) continue;
          let jobData = jobCache.get(jobId);
          if (jobData === undefined) {
            try {
              jobData = await withFirestoreReadTimeout(fetchJobByIdViaFirestoreRest(jobId), 7000);
            } catch (_) {
              jobData = null;
            }
            jobCache.set(jobId, jobData);
          }
          const jobAppIds = jobData && Array.isArray(jobData.applicationIds) ? jobData.applicationIds.map((id) => String(id || '').trim()) : [];
          const linkedToJob = jobAppIds.includes(applicationId);
          if (!linkedToJob) {
            orphanApplications.push(applicationId);
            continue;
          }
          // Getting hired frees the slot: an 'accepted' app only still holds while the gig is an
          // unanswered offer (gig status 'hired'); once the worker is working (gig 'accepted') it
          // no longer counts. Pending always holds.
          const appStatusForHold = String(row.status || '').toLowerCase();
          const jobStatusForHold = String((jobData || {}).status || '').toLowerCase();
          const stillHolds = appStatusForHold === 'pending'
            || ((appStatusForHold === 'accepted' || appStatusForHold === 'hired') && jobStatusForHold === 'hired');
          if (!stillHolds) continue;
          heldByJob.add(jobId);
        }
        for (const orphanAppId of orphanApplications) {
          try {
            await withFirestoreReadTimeout(
              markApplicationCoinReleasedViaFirestoreRest(orphanAppId, 'orphan_reconcile', restHeaders),
              7000
            );
          } catch (_) {
            // continue reconciliation even if one app release fails
          }
        }
        const expectedCurrent = Math.max(0, normalized.max - heldByJob.size);
        emitIOSDataTrace('dynamic-job:apply', 'coin:status:audit', {
          mode: 'REST_AUTH',
          currentProfile: normalized.current,
          expectedCurrent,
          held: heldByJob.size,
          orphanDetected: orphanApplications.length,
          heldJobIds: Array.from(heldByJob).slice(0, 8)
        });
        if (normalized.current !== expectedCurrent) {
          await withFirestoreReadTimeout(
            updateUserApplicationCoinsViaFirestoreRest(safeUserId, expectedCurrent, normalized.max, restHeaders),
            9000
          );
          reconciledCurrent = expectedCurrent;
          emitIOSDataTrace('dynamic-job:apply', 'coin:status:reconciled', {
            mode: 'REST_AUTH',
            before: normalized.current,
            after: expectedCurrent,
            held: heldByJob.size,
            orphanReleased: orphanApplications.length
          });
        }
      } catch (reconcileError) {
        emitIOSDataTrace('dynamic-job:apply', 'coin:status:reconcile:error', {
          mode: 'REST_AUTH',
          message: reconcileError && reconcileError.message ? reconcileError.message : String(reconcileError)
        });
      }
      emitIOSDataTrace('dynamic-job:apply', 'coin:status:done', {
        mode: 'REST_AUTH',
        current: reconciledCurrent,
        max: normalized.max
      });
      return {
        current: reconciledCurrent,
        max: normalized.max
      };
    } catch (restError) {
      emitIOSDataTrace('dynamic-job:apply', 'coin:status:error', {
        mode: 'REST_AUTH',
        message: restError && restError.message ? restError.message : String(restError)
      });
      throw restError;
    }
  }

  const userDoc = await userRef.get();
  if (!userDoc.exists) {
    return { current: DEFAULT_APPLICATION_COINS_MAX, max: DEFAULT_APPLICATION_COINS_MAX };
  }
  const normalized = normalizeApplicationCoins(userDoc.data() || {});

  // Authoritative recompute: "applications remaining" is derived from the worker's own
  // applications that still hold a slot (pending review, or an unanswered offer). Getting
  // hired releases the slot, so working gigs no longer count. This keeps the stored number
  // from drifting and self-heals any past mismatch (corrects both up and down).
  let expectedCurrent = normalized.current;
  try {
    const appsSnapshot = await db.collection('applications')
      .where('applicantId', '==', safeUserId)
      .get();
    let heldCount = 0;
    // First pass (no I/O): pending always holds. Collect the ambiguous accepted/hired apps
    // that need a gig-status check to decide (unanswered offer vs. already working).
    const ambiguousJobIds = [];
    const jobIdsToFetch = new Set();
    for (const doc of appsSnapshot.docs) {
      const app = doc.data() || {};
      // A slot already returned never counts again.
      if (app.coinHeld === false || app.coinReleasedAt) continue;
      const status = String(app.status || '').toLowerCase();
      if (status === 'pending') {
        heldCount += 1;
        continue;
      }
      if (status === 'accepted' || status === 'hired') {
        // 'accepted' is ambiguous: an unanswered offer (gig still 'hired') holds a slot,
        // but a gig the worker is already working (gig 'accepted') does not. Check the gig.
        const jobId = String(app.jobId || '').trim();
        if (!jobId) continue;
        ambiguousJobIds.push(jobId);
        jobIdsToFetch.add(jobId);
      }
    }
    // Fetch every needed gig status in ONE parallel batch instead of sequential round-trips
    // (was the source of multi-second apply/withdraw latency for accounts with many apps).
    const jobStatusCache = new Map();
    if (jobIdsToFetch.size > 0) {
      const uniqueJobIds = Array.from(jobIdsToFetch);
      const jobDocs = await Promise.all(
        uniqueJobIds.map((jobId) => db.collection('jobs').doc(jobId).get().catch(() => null))
      );
      uniqueJobIds.forEach((jobId, index) => {
        const jobDoc = jobDocs[index];
        jobStatusCache.set(
          jobId,
          jobDoc && jobDoc.exists ? String((jobDoc.data() || {}).status || '').toLowerCase() : ''
        );
      });
    }
    for (const jobId of ambiguousJobIds) {
      if (jobStatusCache.get(jobId) === 'hired') heldCount += 1; // still an unanswered offer
    }
    expectedCurrent = Math.max(0, Math.min(normalized.max, normalized.max - heldCount));
  } catch (reconcileError) {
    console.warn('⚠️ Coin reconcile skipped, using stored value:', reconcileError);
    expectedCurrent = normalized.current;
  }

  const existingData = userDoc.data() || {};
  const existingCurrent = Number(existingData.applicationCoinsCurrent);
  const existingMax = Number(existingData.applicationCoinsMax);
  const needsWrite = (
    !Number.isFinite(existingCurrent)
    || !Number.isFinite(existingMax)
    || existingCurrent !== expectedCurrent
    || existingMax !== normalized.max
  );
  if (needsWrite) {
    await userRef.set({
      applicationCoinsCurrent: expectedCurrent,
      applicationCoinsMax: normalized.max
    }, { merge: true });
  }
  return { current: expectedCurrent, max: normalized.max };
}

async function getUserApplicationCoinStatus(userId) {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return { success: false, message: 'User ID is required' };
  try {
    const coinState = await ensureApplicationCoinsForUser(safeUserId);
    return { success: true, ...coinState };
  } catch (error) {
    console.error('❌ Error getting application coin status:', error);
    return { success: false, message: error.message, current: 0, max: DEFAULT_APPLICATION_COINS_MAX };
  }
}

async function releaseApplicationCoinForUser(userId, reason = '') {
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return;
  const db = getFirestore();
  if (!db) {
    return;
  }

  if (isIOSWebKitBrowserForDataPath()) {
    try {
      const restHeaders = await withFirestoreReadTimeout(buildFirestoreRestHeadersWithAuth(), 6000);
      const normalized = await withFirestoreReadTimeout(ensureApplicationCoinsForUser(safeUserId, db), 8000);
      await withFirestoreReadTimeout(
        updateUserApplicationCoinsViaFirestoreRest(
          safeUserId,
          Math.min(normalized.max, normalized.current + 1),
          normalized.max,
          restHeaders
        ),
        9000
      );
      return;
    } catch (restRefundError) {
      console.warn('⚠️ REST coin refund failed, attempting SDK fallback:', restRefundError);
    }
  }

  const userRef = db.collection('users').doc(safeUserId);
  const userDoc = await userRef.get();
  const normalized = normalizeApplicationCoins(userDoc.exists ? (userDoc.data() || {}) : {});
  await userRef.set({
    applicationCoinsMax: normalized.max,
    applicationCoinsCurrent: Math.min(normalized.max, normalized.current + 1),
    applicationCoinLastReleaseReason: reason || '',
    applicationCoinLastReleasedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
}

function withFirestoreReadTimeout(promise, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Firestore read timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    Promise.resolve(promise)
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function isIOSWebKitBrowserForDataPath() {
  try {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch (_) {
    return false;
  }
}

// Optional iOS trace bridge. On-screen HUDs were removed after stabilization.
function emitIOSDataTrace(route, stage, details) {
  if (!isIOSWebKitBrowserForDataPath()) return;
  if (typeof window === 'undefined') return;
  if (typeof window.__GISUGO_IOS_TRACE !== 'function') return;
  try {
    window.__GISUGO_IOS_TRACE({
      route: route || 'unknown',
      stage: stage || 'event',
      details: details === undefined ? null : details,
      at: Date.now()
    });
  } catch (_) {
    // never break production flows because of temporary tracing
  }
}

function getProjectIdForFirestoreRest() {
  try {
    if (window.firebaseConfig && window.firebaseConfig.projectId) {
      return String(window.firebaseConfig.projectId).trim();
    }
    if (typeof firebase !== 'undefined' && firebase.app && typeof firebase.app === 'function') {
      const app = firebase.app();
      if (app && app.options && app.options.projectId) {
        return String(app.options.projectId).trim();
      }
    }
  } catch (_) {
    // fall through
  }
  return '';
}

function decodeFirestoreValue(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(raw, 'stringValue')) return raw.stringValue;
  if (Object.prototype.hasOwnProperty.call(raw, 'integerValue')) return Number(raw.integerValue);
  if (Object.prototype.hasOwnProperty.call(raw, 'doubleValue')) return Number(raw.doubleValue);
  if (Object.prototype.hasOwnProperty.call(raw, 'booleanValue')) return raw.booleanValue === true;
  if (Object.prototype.hasOwnProperty.call(raw, 'timestampValue')) return raw.timestampValue;
  if (Object.prototype.hasOwnProperty.call(raw, 'nullValue')) return null;
  if (raw.arrayValue && Array.isArray(raw.arrayValue.values)) {
    return raw.arrayValue.values.map((entry) => decodeFirestoreValue(entry));
  }
  if (raw.mapValue && raw.mapValue.fields && typeof raw.mapValue.fields === 'object') {
    const mapped = {};
    Object.entries(raw.mapValue.fields).forEach(([key, value]) => {
      mapped[key] = decodeFirestoreValue(value);
    });
    return mapped;
  }
  return null;
}

function mapFirestoreRestDoc(rawDoc) {
  if (!rawDoc || !rawDoc.name) return null;
  const mapped = {
    id: String(rawDoc.name).split('/').pop()
  };
  const fields = rawDoc.fields || {};
  Object.entries(fields).forEach(([key, value]) => {
    mapped[key] = decodeFirestoreValue(value);
  });
  return mapped;
}

async function fetchUserProfileViaFirestoreRest(userId, headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for profile REST fallback');
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(safeUserId)}`;
  const requestInit = { method: 'GET' };
  if (headers && typeof headers === 'object') {
    requestInit.headers = headers;
  }
  const response = await fetch(endpoint, requestInit);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`REST profile fetch failed (${response.status})`);
  }
  const raw = await response.json();
  return mapFirestoreRestDoc(raw);
}

async function fetchNotificationsViaFirestoreRest(recipientId, maxItems = 50) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for notifications REST fallback');
  const safeRecipientId = String(recipientId || '').trim();
  if (!safeRecipientId) return [];
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'notifications' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'recipientId' },
          op: 'EQUAL',
          value: { stringValue: safeRecipientId }
        }
      },
      orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
      limit: Math.max(1, Math.min(Number(maxItems) || 50, 100))
    }
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST notifications fetch failed (${response.status})`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapFirestoreRestDoc(row && row.document ? row.document : null))
    .filter(Boolean);
}

async function fetchJobsByFieldViaFirestoreRest(fieldPath, value) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for jobs REST fallback');
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'jobs' }],
      where: {
        fieldFilter: {
          field: { fieldPath },
          op: 'EQUAL',
          value: { stringValue: String(value || '').trim() }
        }
      },
      orderBy: [{ field: { fieldPath: 'datePosted' }, direction: 'DESCENDING' }],
      limit: 200
    }
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST jobs fetch failed (${response.status})`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapFirestoreRestDoc(row && row.document ? row.document : null))
    .filter(Boolean);
}

async function fetchJobByIdViaFirestoreRest(jobId) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for job REST fetch');
  const safeJobId = String(jobId || '').trim();
  if (!safeJobId) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/jobs/${encodeURIComponent(safeJobId)}`;
  const response = await fetch(endpoint, { method: 'GET' });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`REST job fetch failed (${response.status})`);
  }
  const raw = await response.json();
  return mapFirestoreRestDoc(raw);
}

async function buildFirestoreRestHeadersWithAuth() {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const currentUser = getCurrentUser();
    if (currentUser && typeof currentUser.getIdToken === 'function') {
      const idToken = await currentUser.getIdToken();
      if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
      }
    }
  } catch (_) {
    // Keep unauthenticated headers as fallback.
  }
  return headers;
}

async function updateUserApplicationCoinsViaFirestoreRest(userId, currentCoins, maxCoins, headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for coins REST update');
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) throw new Error('Missing userId for coins REST update');
  const safeCurrent = Math.max(0, Math.floor(Number(currentCoins) || 0));
  const safeMax = Math.max(1, Math.floor(Number(maxCoins) || DEFAULT_APPLICATION_COINS_MAX));
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(safeUserId)}?updateMask.fieldPaths=applicationCoinsCurrent&updateMask.fieldPaths=applicationCoinsMax`;
  const payload = {
    fields: {
      applicationCoinsCurrent: { integerValue: String(safeCurrent) },
      applicationCoinsMax: { integerValue: String(safeMax) }
    }
  };
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST coin update failed (${response.status})`);
  }
  return true;
}

async function createApplicationViaFirestoreRest(applicationData, headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for applications REST create');
  const safeJobId = String(applicationData && applicationData.jobId ? applicationData.jobId : '').trim();
  const safeApplicantId = String(applicationData && applicationData.applicantId ? applicationData.applicantId : '').trim();
  if (!safeJobId || !safeApplicantId) {
    throw new Error('Missing required application fields');
  }
  const safeDocId = `app_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/applications?documentId=${encodeURIComponent(safeDocId)}`;
  const safeCounterOffer = Number(applicationData && applicationData.counterOffer);
  const payload = {
    fields: {
      jobId: { stringValue: safeJobId },
      applicantId: { stringValue: safeApplicantId },
      gigOwnerId: { stringValue: String(applicationData && applicationData.gigOwnerId ? applicationData.gigOwnerId : '') },
      applicantName: { stringValue: String(applicationData && applicationData.applicantName ? applicationData.applicantName : '') },
      applicantThumbnail: { stringValue: String(applicationData && applicationData.applicantThumbnail ? applicationData.applicantThumbnail : '') },
      appliedAt: { timestampValue: new Date().toISOString() },
      status: { stringValue: 'pending' },
      message: { stringValue: String(applicationData && applicationData.message ? applicationData.message : '') },
      counterOffer: Number.isFinite(safeCounterOffer)
        ? { doubleValue: safeCounterOffer }
        : { nullValue: null },
      jobTitle: { stringValue: String(applicationData && applicationData.jobTitle ? applicationData.jobTitle : '') },
      coinHeld: { booleanValue: true },
      coinConsumedAt: { timestampValue: new Date().toISOString() }
    }
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST application create failed (${response.status})`);
  }
  const raw = await response.json();
  return {
    id: raw && raw.name ? String(raw.name).split('/').pop() : safeDocId
  };
}

async function markApplicationCoinReleasedViaFirestoreRest(applicationId, releaseReason = 'reconciled_orphan', headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for application coin release');
  const safeApplicationId = String(applicationId || '').trim();
  if (!safeApplicationId) throw new Error('Missing applicationId for coin release');
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/applications/${encodeURIComponent(safeApplicationId)}?updateMask.fieldPaths=coinHeld&updateMask.fieldPaths=coinReleaseReason&updateMask.fieldPaths=coinReleasedAt`;
  const payload = {
    fields: {
      coinHeld: { booleanValue: false },
      coinReleaseReason: { stringValue: String(releaseReason || 'reconciled_orphan') },
      coinReleasedAt: { timestampValue: new Date().toISOString() }
    }
  };
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST application coin release failed (${response.status})`);
  }
  return true;
}

/**
 * Set jobs.applicationCount from a live pending query (REST / iOS path).
 * Optionally appends applicationId to applicationIds (apply flow).
 */
async function syncJobApplicationCountViaFirestoreRest(jobId, applicationId = '', headers = null, setCount = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for job REST update');
  const safeJobId = String(jobId || '').trim();
  if (!safeJobId) throw new Error('Missing job id for applicationCount sync');

  const correctCount = Math.max(0, Number(setCount));
  if (!Number.isFinite(Number(setCount)) || Number(setCount) < 0) {
    throw new Error('setCount is required for applicationCount write');
  }
  const safeApplicationId = String(applicationId || '').trim();

  const fieldTransforms = [];
  if (safeApplicationId) {
    fieldTransforms.push({
      fieldPath: 'applicationIds',
      appendMissingElements: {
        values: [{ stringValue: safeApplicationId }]
      }
    });
  }

  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:commit`;
  const write = {
    update: {
      name: `projects/${projectId}/databases/(default)/documents/jobs/${safeJobId}`,
      fields: {
        applicationCount: { integerValue: String(correctCount) }
      }
    },
    updateMask: { fieldPaths: ['applicationCount'] }
  };
  if (fieldTransforms.length) {
    write.updateTransforms = fieldTransforms;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify({ writes: [write] })
  });
  if (!response.ok) {
    throw new Error(`REST job applicationCount sync failed (${response.status})`);
  }
  return correctCount;
}

// Legacy name used by applyForJob — now recounts pending instead of increment(+1).
async function incrementJobApplicationCountViaFirestoreRest(jobId, applicationId, headers = null) {
  return syncJobApplicationCountViaFirestoreRest(jobId, applicationId, headers);
}

/**
 * After hire, other applicants stay pending but the badge is forced to 0.
 * heldPendingCount is that leftover number. Restore it when the offer
 * ends before Accept (decline / void-from-hired / resign-from-hired).
 * After Accept the sweep already closed those rows, so the count is 0.
 * @param {Object|null} jobData
 * @returns {number|null} count to write, or null when unknown (skip)
 */
function resolveApplicationCountAfterOfferEnd(jobData) {
  const status = String((jobData && jobData.status) || '').toLowerCase();
  if (status === 'accepted') return 0;
  if (status === 'hired') {
    const held = Number(jobData && jobData.heldPendingCount);
    return (Number.isFinite(held) && held >= 0) ? held : null;
  }
  return null;
}

/**
 * Write jobs.applicationCount from a number the caller already knows.
 * Does not scan applications. After lock a worker cannot query pending
 * apps on someone else's gig.
 * @param {string} jobId
 * @param {{ setCount?: number, applicationIdToUnion?: string, skipWriteIfCountEquals?: number }} [options]
 *   setCount — pending count to store. Required unless skipping.
 *   applicationIdToUnion — apply flow: also union the new app id into applicationIds.
 *     When set, failures THROW (the union is required for later job-delete cleanup).
 *   skipWriteIfCountEquals — skip the job write when setCount already matches.
 * @returns {Promise<number>} written count (or -1 on soft skip/failure)
 */
async function syncJobApplicationCount(jobId, options = {}) {
  const db = getFirestore();
  const safeJobId = String(jobId || '').trim();
  const unionId = String(options.applicationIdToUnion || '').trim();
  if (!db || !safeJobId) {
    if (unionId) throw new Error('syncJobApplicationCount: missing db or jobId');
    return -1;
  }

  const hasSetCount = Number.isFinite(options.setCount);
  const correctCount = hasSetCount ? Math.max(0, Number(options.setCount)) : null;
  if (!hasSetCount) {
    if (Number.isFinite(options.skipWriteIfCountEquals)) {
      return options.skipWriteIfCountEquals;
    }
    console.warn('⚠️ syncJobApplicationCount skipped (no setCount):', safeJobId);
    return -1;
  }

  try {
    if (!unionId
        && Number.isFinite(options.skipWriteIfCountEquals)
        && options.skipWriteIfCountEquals === correctCount) {
      return correctCount;
    }

    const updatePayload = { applicationCount: correctCount };
    if (unionId) {
      updatePayload.applicationIds = firebase.firestore.FieldValue.arrayUnion(unionId);
    }
    await db.collection('jobs').doc(safeJobId).update(updatePayload);
    return correctCount;
  } catch (error) {
    if (unionId) throw error;
    console.warn('⚠️ syncJobApplicationCount failed:', safeJobId, error);
    return -1;
  }
}

async function fetchApplicationsByJobAndApplicantViaFirestoreRest(jobId, applicantId, maxItems = 6, headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for applications REST fallback');
  const safeJobId = String(jobId || '').trim();
  const safeApplicantId = String(applicantId || '').trim();
  if (!safeJobId || !safeApplicantId) return [];
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'applications' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'jobId' },
                op: 'EQUAL',
                value: { stringValue: safeJobId }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'applicantId' },
                op: 'EQUAL',
                value: { stringValue: safeApplicantId }
              }
            }
          ]
        }
      },
      limit: Math.max(1, Math.min(Number(maxItems) || 6, 30))
    }
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST applications(by applicant) fetch failed (${response.status})`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapFirestoreRestDoc(row && row.document ? row.document : null))
    .filter(Boolean);
}

async function fetchPendingApplicationsByJobViaFirestoreRest(jobId, maxItems = 11, headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for pending applications REST fallback');
  const safeJobId = String(jobId || '').trim();
  if (!safeJobId) return [];
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'applications' }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            {
              fieldFilter: {
                field: { fieldPath: 'jobId' },
                op: 'EQUAL',
                value: { stringValue: safeJobId }
              }
            },
            {
              fieldFilter: {
                field: { fieldPath: 'status' },
                op: 'EQUAL',
                value: { stringValue: 'pending' }
              }
            }
          ]
        }
      },
      limit: Math.max(1, Math.min(Number(maxItems) || 11, 30))
    }
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST applications(pending) fetch failed (${response.status})`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapFirestoreRestDoc(row && row.document ? row.document : null))
    .filter(Boolean);
}

async function fetchApplicationsByApplicantViaFirestoreRest(applicantId, maxItems = 200, headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for applicant applications REST fallback');
  const safeApplicantId = String(applicantId || '').trim();
  if (!safeApplicantId) return [];
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`;
  const payload = {
    structuredQuery: {
      from: [{ collectionId: 'applications' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'applicantId' },
          op: 'EQUAL',
          value: { stringValue: safeApplicantId }
        }
      },
      limit: Math.max(1, Math.min(Number(maxItems) || 200, 300))
    }
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: headers || { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error(`REST applications(by applicant all) fetch failed (${response.status})`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => mapFirestoreRestDoc(row && row.document ? row.document : null))
    .filter(Boolean);
}

function toComparableMillis(rawValue) {
  if (!rawValue) return 0;
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue;
  if (typeof rawValue === 'string') {
    const parsed = Date.parse(rawValue);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (typeof rawValue === 'object') {
    if (typeof rawValue.toDate === 'function') {
      const dt = rawValue.toDate();
      return dt instanceof Date ? dt.getTime() : 0;
    }
    if (typeof rawValue.seconds === 'number') {
      return Math.floor(rawValue.seconds * 1000);
    }
  }
  return 0;
}

function cacheJobById(job) {
  if (!job || !job.id) return;
  const cache = readJsonStorageSafe(JOB_CACHE_BY_ID_KEY, {});
  cache[job.id] = {
    ...job,
    _cachedAt: Date.now()
  };
  writeJsonStorageSafe(JOB_CACHE_BY_ID_KEY, cache);
}

function getCachedJobById(jobId) {
  if (!jobId) return null;
  const cache = readJsonStorageSafe(JOB_CACHE_BY_ID_KEY, {});
  return cache[jobId] || null;
}

function cacheJobsByCategory(category, jobs) {
  if (!category || !Array.isArray(jobs)) return;
  const cache = readJsonStorageSafe(JOB_CACHE_BY_CATEGORY_KEY, {});
  cache[category] = {
    jobs: jobs,
    _cachedAt: Date.now()
  };
  writeJsonStorageSafe(JOB_CACHE_BY_CATEGORY_KEY, cache);
}

function getCachedJobsByCategory(category) {
  if (!category) return [];
  const cache = readJsonStorageSafe(JOB_CACHE_BY_CATEGORY_KEY, {});
  const entry = cache[category];
  if (!entry || !Array.isArray(entry.jobs)) return [];
  return entry.jobs;
}

/**
 * Create a new job posting
 * @param {Object} jobData - Job data to create
 * @returns {Promise<Object>} - Result with jobId
 */
async function createJob(jobData) {
  const db = getFirestore();
  const textValidation = validateAllowedTextChars([
    { label: 'Job title', value: getSafeValue(jobData, 'title', getSafeValue(jobData, 'jobTitle', '')) },
    { label: 'Job description', value: getSafeValue(jobData, 'description', '') }
  ]);
  if (!textValidation.valid) {
    return { success: false, message: textValidation.message };
  }
  
  if (!db) {
    return { success: false, message: 'Jobs backend unavailable' };
  }
  
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'You must be logged in to post a job' };
    }
    
    // Get user profile from Firestore for accurate poster info
    let posterName = currentUser.displayName || 'Anonymous';
    let posterThumbnail = currentUser.photoURL || '';
    
    console.log('🔍 Fetching user profile from Firestore for:', currentUser.uid);
    console.log('📋 Current Auth data:', { 
      displayName: currentUser.displayName, 
      photoURL: currentUser.photoURL 
    });
    
    try {
      const userProfile = await getUserProfile(currentUser.uid);
      console.log('📦 Firestore profile result:', userProfile);
      
      if (userProfile) {
        console.log('✅ Using Firestore profile data:', {
          fullName: userProfile.fullName,
          profilePhoto: userProfile.profilePhoto
        });
        posterName = userProfile.fullName || posterName;
        posterThumbnail = userProfile.profilePhoto || posterThumbnail;
      } else {
        console.warn('⚠️ No Firestore profile found, using Auth data');
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      console.warn('⚠️ Falling back to Auth data:', { posterName, posterThumbnail });
    }
    
    console.log('🎯 Final poster data:', { posterName, posterThumbnail });

    const policy = await getPublicPlatformPolicy();
    if (policy.suspendGigs) {
      return {
        success: false,
        message: 'New gig posts are paused right now. Please try again later.'
      };
    }
    const postedPrice = Number(jobData.priceOffer || jobData.paymentAmount);
    if (Number.isFinite(postedPrice) && postedPrice > 0) {
      if (postedPrice < policy.minGigPrice) {
        return {
          success: false,
          message: `Payment amount must be at least ₱${policy.minGigPrice}.`
        };
      }
      if (postedPrice > policy.maxGigPrice) {
        return {
          success: false,
          message: `Payment amount cannot exceed ₱${policy.maxGigPrice}.`
        };
      }
    }
    if (policy.maxActiveGigs > 0) {
      const activeSnap = await db.collection('jobs')
        .where('posterId', '==', currentUser.uid)
        .where('status', '==', 'active')
        .get();
      if (activeSnap.size >= policy.maxActiveGigs) {
        return {
          success: false,
          message: `You already have ${policy.maxActiveGigs} active gigs. Close or complete one before posting another.`
        };
      }
    }
    
    const jobDoc = {
      // Basic Job Information
      posterId: currentUser.uid,
      posterName: posterName,
      posterThumbnail: posterThumbnail,
      title: jobData.title || jobData.jobTitle,
      description: jobData.description || '',
      category: jobData.category,
      thumbnail: jobData.thumbnail || jobData.photo || '',
      
      // Location
      region: jobData.region || 'CEBU',
      city: jobData.city || 'CEBU CITY',
      
      // Scheduling (convert date string to Timestamp in local timezone)
      scheduledDate: jobData.jobDate ? (() => {
        const [year, month, day] = jobData.jobDate.split('-').map(Number);
        return firebase.firestore.Timestamp.fromDate(new Date(year, month - 1, day));
      })() : (jobData.scheduledDate || null),
      startTime: jobData.startTime,
      endTime: jobData.endTime,
      
      // Pricing
      priceOffer: jobData.priceOffer || jobData.paymentAmount,
      gigUseType: jobData.gigUseType || 'Personal',
      
      // Extras (category-specific fields)
      extras: jobData.extras || [],
      
      // Status
      status: 'active',
      datePosted: firebase.firestore.FieldValue.serverTimestamp(),
      lastModified: firebase.firestore.FieldValue.serverTimestamp(),
      
      // Applications
      applicationCount: 0,
      applicationIds: [],
      
      // Technical
      jobPageUrl: `dynamic-job.html?category=${jobData.category}&jobNumber=`,
      
      // Relist metadata (if present)
      ...(jobData.originalJobId && {
        originalJobId: jobData.originalJobId,
        relistedFrom: jobData.relistedFrom,
        relistedAt: jobData.relistedAt
      })
    };
    
    // Log relist metadata if present
    if (jobData.originalJobId) {
      console.log('🔄 Relist metadata included:', {
        originalJobId: jobData.originalJobId,
        relistedFrom: jobData.relistedFrom,
        relistedAt: jobData.relistedAt
      });
    }
    
    const docRef = await db.collection('jobs').add(jobDoc);
    
    // Update the jobPageUrl with the actual ID
    await docRef.update({
      jobPageUrl: `dynamic-job.html?category=${jobData.category}&jobNumber=${docRef.id}`
    });

    // Track customer posting activity (non-blocking).
    try {
      await db.collection('users').doc(currentUser.uid).update({
        'statistics.customer.totalGigsPosted': firebase.firestore.FieldValue.increment(1)
      });
      console.log('✅ Customer posting statistics updated');
    } catch (statsError) {
      // Keep job creation successful even if activity stats update fails.
      console.warn('⚠️ Could not update customer posting statistics:', statsError);
    }
    
    console.log('✅ Job created with ID:', docRef.id);
    
    triggerPushMilestonePrompt('post');
    return {
      success: true,
      jobId: docRef.id,
      message: 'Job posted successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error creating job:', error);
    return { success: false, message: error.message };
  }
}

// Format date for preview cards
function formatDateForPreview(dateStr) {
  if (!dateStr) return 'TBD';
  
  // Parse in local timezone to avoid date rollback
  let date;
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return 'TBD';
  
  // Return full date with year (YYYY-MM-DD format) for proper sorting and expiration checking
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a single job by ID
 * @param {string} jobId - The job document ID
 * @returns {Promise<Object|null>} - Job data or null if not found
 */
async function getJobById(jobId) {
  const db = getFirestore();
  const safeJobId = String(jobId || '').trim();
  
  if (!db) {
    return getCachedJobById(safeJobId) || null;
  }
  
  try {
    const docRef = db.collection('jobs').doc(safeJobId);
    let doc = await withFirestoreReadTimeout(docRef.get(), 9000);
    if (!doc.exists) {
      try {
        // iOS can occasionally surface an empty first read before server is ready.
        const serverDoc = await withFirestoreReadTimeout(docRef.get({ source: 'server' }), 5000);
        if (serverDoc && serverDoc.exists) {
          doc = serverDoc;
        }
      } catch (serverReadError) {
        console.warn('⚠️ getJobById server retry skipped/failed:', serverReadError);
      }
    }
    
    if (doc.exists) {
      const jobData = {
        id: doc.id,
        jobId: doc.id,
        ...doc.data()
      };
      cacheJobById(jobData);
      console.log('✅ Job found by document ID:', safeJobId);
      return jobData;
    }

    console.log('⚠️ Job not found in Firestore by document ID:', safeJobId);
    return getCachedJobById(safeJobId) || null;
    
  } catch (error) {
    console.error('❌ Error getting job:', error);
    return getCachedJobById(safeJobId) || null;
  }
}

/**
 * Get jobs by category with filters
 * @param {string} category - Job category
 * @param {Object} filters - Filter options (region, city, gigUseType)
 * @returns {Promise<Array>} - Array of jobs
 */
async function getJobsByCategory(category, filters = {}, options = {}) {
  const db = getFirestore();
  const allowFallback = options && options.allowFallback !== undefined ? options.allowFallback === true : true;
  
  if (!db) {
    return [];
  }
  
  try {
    // Simplified query - only category + status (no composite index needed)
    let query = db.collection('jobs')
      .where('category', '==', category)
      .where('status', '==', 'active');
    
    let snapshot = await query.get();
    if (snapshot.empty) {
      try {
        // iOS/WebKit can report empty first reads from cold cache. Retry from server once.
        const serverSnapshot = await withFirestoreReadTimeout(query.get({ source: 'server' }), 6000);
        if (serverSnapshot && !serverSnapshot.empty) {
          snapshot = serverSnapshot;
        }
      } catch (serverReadError) {
        console.warn('⚠️ getJobsByCategory server retry skipped/failed:', serverReadError);
      }
    }
    
    let jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Client-side filtering (all filters done here to avoid indexes)
    if (filters.region) {
      jobs = jobs.filter(job => job.region === filters.region);
    }
    
    // City was previously accepted by callers (e.g. the listing page's City picker) but
    // silently ignored here -- gigs were only ever narrowed down to Region, so picking a
    // specific City had no filtering effect at all (2026-08-04 user report: switching City
    // within the same Region never changed which gigs showed).
    if (filters.city) {
      jobs = jobs.filter(job => job.city === filters.city);
    }
    
    if (filters.gigUseType && filters.gigUseType !== 'GIG TYPE') {
      jobs = jobs.filter(job => 
        (((job && job.gigUseType) || '').toUpperCase()) === filters.gigUseType.toUpperCase()
      );
    }
    
    // Client-side sorting by date posted
    jobs.sort((a, b) => {
      const dateA = a && a.datePosted && typeof a.datePosted.toDate === 'function' ? a.datePosted.toDate() : new Date(0);
      const dateB = b && b.datePosted && typeof b.datePosted.toDate === 'function' ? b.datePosted.toDate() : new Date(0);
      return dateB - dateA; // Newest first
    });

    cacheJobsByCategory(category, jobs);
    jobs.forEach((job) => {
      if (job && job.id) {
        cacheJobById({
          jobId: job.id,
          ...job
        });
      }
    });
    
    console.log(`📋 Found ${jobs.length} jobs in category: ${category}`);
    return jobs;
    
  } catch (error) {
    console.error('❌ Error getting jobs:', error);
    if (!allowFallback) {
      throw error;
    }
    const cachedJobs = getCachedJobsByCategory(category);
    if (cachedJobs.length > 0) {
      console.warn(`⚠️ Using cached jobs for category ${category}: ${cachedJobs.length}`);
      return cachedJobs;
    }
    return [];
  }
}

/**
 * Get user's job listings (as poster)
 * @param {string} userId - User ID
 * @param {Array} statuses - Array of status values to filter
 * @returns {Promise<Array>} - Array of jobs
 */
async function getUserJobListings(userId, statuses = ['active', 'paused']) {
  const db = getFirestore();
  
  if (!db) {
    return [];
  }
  
  console.log(`🔍 Fetching jobs for user: ${userId}, statuses: ${statuses.join(', ')}`);
  emitIOSDataTrace('jobs:listings', 'fetch:start', {
    userId: String(userId || ''),
    statuses: Array.isArray(statuses) ? statuses.join(',') : ''
  });
  
  try {
    if (isIOSWebKitBrowserForDataPath()) {
      emitIOSDataTrace('jobs:listings', 'fetch:mode', 'REST');
      const asPoster = await withFirestoreReadTimeout(fetchJobsByFieldViaFirestoreRest('posterId', userId), 10000);
      const asWorker = await withFirestoreReadTimeout(fetchJobsByFieldViaFirestoreRest('hiredWorkerId', userId), 10000);
      const allRows = [...asPoster, ...asWorker];
      const unique = new Map();
      allRows.forEach((job) => {
        if (!job || !job.id || unique.has(job.id)) return;
        unique.set(job.id, {
          id: job.id,
          jobId: job.id,
          ...job,
          role: job.posterId === userId ? 'customer' : 'worker'
        });
      });
      const jobs = Array.from(unique.values())
        .filter((job) => statuses.includes(job.status))
        .sort((a, b) => {
          const dateA = new Date(a.datePosted || 0).getTime();
          const dateB = new Date(b.datePosted || 0).getTime();
          return dateB - dateA;
        });
      emitIOSDataTrace('jobs:listings', 'fetch:done', { count: jobs.length, mode: 'REST' });
      return jobs;
    }
    emitIOSDataTrace('jobs:listings', 'fetch:mode', 'SDK');

    // Query for jobs where user is the poster
    const posterSnapshot = await db.collection('jobs')
      .where('posterId', '==', userId)
      .get();
    
    // Query for jobs where user is the hired worker
    const workerSnapshot = await db.collection('jobs')
      .where('hiredWorkerId', '==', userId)
      .get();
    
    console.log(`📊 Raw Firestore results: ${posterSnapshot.docs.length} as poster, ${workerSnapshot.docs.length} as worker`);
    
    // Combine both snapshots and remove duplicates
    const allDocs = [...posterSnapshot.docs, ...workerSnapshot.docs];
    const uniqueJobIds = new Set();
    const uniqueDocs = allDocs.filter(doc => {
      if (uniqueJobIds.has(doc.id)) return false;
      uniqueJobIds.add(doc.id);
      return true;
    });
    
    // Map to job objects, filter by status, and add role
    const jobs = uniqueDocs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          jobId: doc.id, // Ensure jobId is set
          ...data,
          // Determine role: customer if they posted it, worker if they were hired
          role: data.posterId === userId ? 'customer' : 'worker'
        };
      })
      .filter(job => statuses.includes(job.status))
      .sort((a, b) => {
        // Sort by datePosted descending
        const dateA = (a && a.datePosted && typeof a.datePosted.toDate === 'function') ? a.datePosted.toDate() : (new Date(a.datePosted) || new Date(0));
        const dateB = (b && b.datePosted && typeof b.datePosted.toDate === 'function') ? b.datePosted.toDate() : (new Date(b.datePosted) || new Date(0));
        return dateB - dateA;
      });
    
    console.log(`✅ Filtered & sorted jobs: ${jobs.length}`);
    emitIOSDataTrace('jobs:listings', 'fetch:done', { count: jobs.length, mode: 'SDK' });
    return jobs;
    
  } catch (error) {
    console.error('❌ Error getting user listings:', error);
    const message = (error && error.message) ? error.message : String(error);
    const stage = /timed out/i.test(message) ? 'fetch:timeout' : 'fetch:error';
    emitIOSDataTrace('jobs:listings', stage, message);
    
    // Check if it's an index error
    if (error.message && error.message.includes('index')) {
      console.error('📋 Firestore composite index required. Check the error link above.');
    }
    
    return [];
  }
}

/**
 * Update an existing job (for edit mode)
 * @param {string} jobId - Job document ID
 * @param {Object} jobData - Updated job data
 * @returns {Promise<Object>} - Result object
 */
async function updateJob(jobId, jobData) {
  const db = getFirestore();
  const textValidation = validateAllowedTextChars([
    { label: 'Job title', value: getSafeValue(jobData, 'title', '') },
    { label: 'Job description', value: getSafeValue(jobData, 'description', '') }
  ]);
  if (!textValidation.valid) {
    return { success: false, message: textValidation.message };
  }
  
  if (!db) {
    return { success: false, message: 'Jobs backend unavailable' };
  }
  
  try {
    // First, get the existing job to preserve fields that shouldn't be changed
    const existingJob = await db.collection('jobs').doc(jobId).get();
    const existingData = existingJob.data();

    // Guard against accidental wipe (empty np2State defaults / "null AM" race)
    const incomingTitle = String(getSafeValue(jobData, 'title', '') || '').trim();
    const incomingDescription = String(getSafeValue(jobData, 'description', '') || '').trim();
    const incomingStart = String(jobData.startTime || '');
    const looksLikeNullTime = /^null\s/i.test(incomingStart) || incomingStart.includes('null');
    if (existingData && existingData.title && !incomingTitle) {
      console.error('❌ updateJob refused: would clear existing title', jobId);
      return { success: false, message: 'Update blocked: missing title' };
    }
    if (existingData && existingData.description && !incomingDescription) {
      console.error('❌ updateJob refused: would clear existing description', jobId);
      return { success: false, message: 'Update blocked: missing description' };
    }
    if (looksLikeNullTime) {
      console.error('❌ updateJob refused: invalid startTime', jobId, incomingStart);
      return { success: false, message: 'Update blocked: invalid start time' };
    }
    
    // Smart category handling: never save 'unknown' or empty, preserve existing
    let finalCategory = jobData.category;
    if (!finalCategory || finalCategory === 'unknown' || finalCategory === '') {
      finalCategory = existingData && existingData.category ? existingData.category : '';
      
      // If existing is also empty, try to infer from jobPageUrl
      if (!finalCategory && existingData && existingData.jobPageUrl) {
        const match = existingData.jobPageUrl.match(/category=([^&]+)/);
        if (match) {
          finalCategory = match[1];
          console.log(`📍 Inferred category from jobPageUrl: ${finalCategory}`);
        }
      }
      
      if (!finalCategory) {
        finalCategory = '';
      }
      console.log(`⚠️ Invalid category provided, resolved to: ${finalCategory}`);
    }
    
    const policy = await getPublicPlatformPolicy();
    const postedPrice = Number(jobData.priceOffer || jobData.paymentAmount);
    if (Number.isFinite(postedPrice) && postedPrice > 0) {
      if (postedPrice < policy.minGigPrice) {
        return {
          success: false,
          message: `Payment amount must be at least ₱${policy.minGigPrice}.`
        };
      }
      if (postedPrice > policy.maxGigPrice) {
        return {
          success: false,
          message: `Payment amount cannot exceed ₱${policy.maxGigPrice}.`
        };
      }
    }

    const updateData = {
      title: jobData.title || '',
      description: jobData.description || '',
      category: finalCategory,
      thumbnail: jobData.thumbnail || jobData.photo || ((existingData && existingData.thumbnail) || ''),
      region: jobData.region || 'CEBU',
      city: jobData.city || 'CEBU CITY',
      scheduledDate: jobData.jobDate ? (() => {
        const [year, month, day] = jobData.jobDate.split('-').map(Number);
        return firebase.firestore.Timestamp.fromDate(new Date(year, month - 1, day));
      })() : (jobData.scheduledDate || null),
      startTime: jobData.startTime,
      endTime: jobData.endTime,
      priceOffer: jobData.priceOffer || jobData.paymentAmount,
      gigUseType: jobData.gigUseType || 'Personal',
      extras: jobData.extras || [],
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('jobs').doc(jobId).update(updateData);
    console.log(`✅ Job ${jobId} updated`);
    return { success: true, message: 'Job updated', jobId };
  } catch (error) {
    console.error('❌ Error updating job:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Update job status
 * @param {string} jobId - Job document ID
 * @param {string} newStatus - New status value
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<Object>} - Result object
 */
async function updateJobStatus(jobId, newStatus, additionalData = {}) {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Jobs backend unavailable' };
  }
  
  try {
    await db.collection('jobs').doc(jobId).update({
      status: newStatus,
      lastModified: firebase.firestore.FieldValue.serverTimestamp(),
      ...additionalData
    });
    
    console.log(`✅ Job ${jobId} status updated to: ${newStatus}`);
    return { success: true, message: 'Job updated successfully' };
    
  } catch (error) {
    console.error('❌ Error updating job:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Delete a job with comprehensive cleanup (Firestore + Storage)
 * @param {string} jobId - Job document ID
 * @returns {Promise<Object>} - Result object
 */
function extractStoragePathFromUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('gs://')) {
    const withoutScheme = raw.slice(5);
    const slash = withoutScheme.indexOf('/');
    return slash === -1 ? '' : withoutScheme.slice(slash + 1);
  }
  try {
    const parsed = new URL(raw);
    const fromO = parsed.pathname.match(/\/o\/(.+)$/);
    if (fromO) return decodeURIComponent(fromO[1]);
  } catch (_) { /* fall through */ }
  const match = raw.match(/\/o\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function canonicalJobPhotoPath(posterId, jobId) {
  const uid = String(posterId || '').trim();
  const id = String(jobId || '').trim();
  if (!uid || !id) return '';
  return `job_photos/${uid}/${id}.jpg`;
}

async function deleteStoragePathQuiet(storagePath) {
  const path = String(storagePath || '').replace(/^\/+/, '');
  if (!path) return false;
  if (typeof deleteFile === 'function') {
    const result = await deleteFile(path);
    return !!(result && result.success);
  }
  const storage = typeof getFirebaseStorage === 'function' ? getFirebaseStorage() : null;
  if (!storage) return false;
  try {
    await storage.ref().child(path).delete();
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') return true;
    console.error('❌ Error deleting Storage path:', path, error);
    return false;
  }
}

async function otherLiveJobReferencesPath(db, posterId, jobId, storagePath, thumbnailUrl) {
  const uid = String(posterId || '').trim();
  const path = String(storagePath || '').replace(/^\/+/, '');
  if (!uid || !path) return false;
  const snap = await db.collection('jobs').where('posterId', '==', uid).get();
  return snap.docs.some((doc) => {
    if (doc.id === jobId) return false;
    const thumb = String((doc.data() || {}).thumbnail || '');
    if (!thumb) return false;
    if (thumbnailUrl && thumb === thumbnailUrl) return true;
    return extractStoragePathFromUrl(thumb) === path;
  });
}

async function callDeleteJobStoragePhotos(jobId, posterId, extraPath) {
  try {
    if (typeof firebase === 'undefined' || typeof firebase.app !== 'function') {
      return { attempted: false, success: false };
    }
    const app = firebase.app();
    if (!app.functions) return { attempted: false, success: false };
    const callable = app.functions('asia-southeast1').httpsCallable('deleteJobStoragePhotos');
    const response = await callable({
      jobId: String(jobId || ''),
      posterId: String(posterId || ''),
      extraPath: String(extraPath || '')
    });
    return { attempted: true, success: true, deleted: (response && response.data && response.data.deleted) || [] };
  } catch (error) {
    console.error('❌ deleteJobStoragePhotos call failed:', error);
    return { attempted: true, success: false };
  }
}

async function callCleanupDeletedJobApplications(jobId, applicationIds) {
  try {
    if (typeof firebase === 'undefined' || typeof firebase.app !== 'function') {
      return { attempted: false, success: false };
    }
    const app = firebase.app();
    if (!app.functions) return { attempted: false, success: false };
    const callable = app.functions('asia-southeast1').httpsCallable('cleanupDeletedJobApplications');
    const response = await callable({
      jobId: String(jobId || ''),
      applicationIds: Array.isArray(applicationIds) ? applicationIds : []
    });
    return { attempted: true, success: true, ...(response && response.data ? response.data : {}) };
  } catch (error) {
    console.error('❌ cleanupDeletedJobApplications call failed:', error);
    return { attempted: true, success: false };
  }
}

async function collectApplicationIdsForJobDelete(db, jobId, applicationIds) {
  const ids = new Set((applicationIds || []).map((id) => String(id || '').trim()).filter(Boolean));
  if (!jobId || !db) return [...ids];
  try {
    const queried = await db.collection('applications').where('jobId', '==', jobId).get();
    queried.docs.forEach((doc) => ids.add(doc.id));
  } catch (error) {
    console.warn('⚠️ Could not query applications by jobId; using listed IDs only', error);
  }
  return [...ids];
}

async function cleanupJobApplicationsOnClient(db, jobId, applicationIds) {
  let deleted = 0;
  const idsToDelete = await collectApplicationIdsForJobDelete(db, jobId, applicationIds);
  for (const rawId of idsToDelete) {
    const applicationId = String(rawId || '').trim();
    if (!applicationId) continue;
    try {
      const appRef = db.collection('applications').doc(applicationId);
      const appDoc = await appRef.get();
      if (!appDoc.exists) continue;
      const appData = appDoc.data() || {};
      if (jobId && String(appData.jobId || '') !== String(jobId)) continue;
      if (isApplicationHoldingCoin(appData)) {
        try {
          await releaseApplicationCoinForApplication(applicationId, 'job_deleted');
        } catch (coinError) {
          console.warn('⚠️ Could not release coin for deleted-job applicant:', coinError);
        }
      }
      await appRef.delete();
      deleted += 1;
    } catch (appError) {
      console.error('❌ Error deleting application:', applicationId, appError);
    }
  }
  return deleted;
}

async function cleanupJobPhotosOnDelete(db, jobId, jobData) {
  const posterId = (jobData && (jobData.posterId || jobData.userId)) || '';
  const thumbnail = (jobData && jobData.thumbnail) || '';
  const canonical = canonicalJobPhotoPath(posterId, jobId);
  const fromUrl = extractStoragePathFromUrl(thumbnail);
  let extraPath = fromUrl && fromUrl !== canonical && fromUrl.startsWith('job_photos/')
    ? fromUrl
    : '';

  if (extraPath) {
    try {
      const referenced = await otherLiveJobReferencesPath(db, posterId, jobId, extraPath, thumbnail);
      if (referenced) {
        console.log('ℹ️ Extra thumbnail path still used by another live job, leaving it:', extraPath);
        extraPath = '';
      }
    } catch (error) {
      console.warn('⚠️ Could not check other jobs for shared photo; leaving extra path', extraPath, error);
      extraPath = '';
    }
  }

  // Admin SDK callable first — client Storage isAdmin() 403s on someone
  // else's job_photos/{posterId}/ folder. Owner client-delete is fallback.
  const viaFn = await callDeleteJobStoragePhotos(jobId, posterId, extraPath);
  if (viaFn.success) return true;

  let deletedAny = false;
  if (canonical) {
    deletedAny = (await deleteStoragePathQuiet(canonical)) || deletedAny;
  }
  if (extraPath) {
    deletedAny = (await deleteStoragePathQuiet(extraPath)) || deletedAny;
  }
  return deletedAny;
}

async function deleteJob(jobId) {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Jobs backend unavailable' };
      }
      
      try {
    // Get job data for audit and photo cleanup
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return { success: false, message: 'Job not found' };
    }
    
    const jobData = jobDoc.data();
    
    // STEP 1: Delete Storage photo by canonical path, then any extra
    // thumbnail path only if no other live job still points at it.
    let photoDeleted = false;
    try {
      photoDeleted = await cleanupJobPhotosOnDelete(db, jobId, jobData);
    } catch (storageError) {
      console.error('❌ Error deleting job photo from Storage:', storageError);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Delete associated applications & release held coins
    // Admin SDK callable first — a stale/missing applicationId must not
    // fail the rest, and only pending/accepted/hired apps still hold a
    // coin. Client fallback skips missing IDs (batch.delete of a ghost
    // doc is denied by rules and aborts the whole batch).
    // ═══════════════════════════════════════════════════════════════
    const applicationIds = Array.isArray(jobData.applicationIds) ? jobData.applicationIds : [];
    let applicationsDeleted = 0;
    console.log(`🗑️ Cleaning applications for job ${jobId} (listed ${applicationIds.length})`);
    const viaFn = await callCleanupDeletedJobApplications(jobId, applicationIds);
    if (viaFn.success) {
      applicationsDeleted = (viaFn.deleted || []).length;
      console.log('✅ Applications cleaned via cleanupDeletedJobApplications', viaFn);
    } else {
      applicationsDeleted = await cleanupJobApplicationsOnClient(db, jobId, applicationIds);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Create deletion audit record
    // ═══════════════════════════════════════════════════════════════
    await db.collection('job_deletions').add({
      jobId: jobId,
      deletedBy: getCurrentUserId(),
      deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reason: 'user_requested',
      jobData: jobData,
      photoDeleted: photoDeleted,
      applicationsDeleted
    });
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Delete the job document from Firestore
    // ═══════════════════════════════════════════════════════════════
    await db.collection('jobs').doc(jobId).delete();
    
    console.log(`✅ Job ${jobId} deleted completely (Firestore + Storage + Applications)`);
    return { 
      success: true, 
      message: 'Job deleted successfully',
      cleanup: {
        firestoreDeleted: true,
        photoDeleted: photoDeleted,
        applicationsDeleted
      }
    };
    
  } catch (error) {
    console.error('❌ Error deleting job:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// APPLICATIONS COLLECTION
// ============================================================================

async function releaseApplicationCoinForApplication(applicationId, releaseReason = 'released') {
  const safeApplicationId = String(applicationId || '').trim();
  if (!safeApplicationId) return { success: false, message: 'Application ID required' };
  const db = getFirestore();
  if (!db) return { success: false, message: 'Applications backend unavailable' };

  try {
    const appRef = db.collection('applications').doc(safeApplicationId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) return { success: false, message: 'Application not found' };
    const appData = appDoc.data() || {};
    const applicantId = String(appData.applicantId || '').trim();
    if (!applicantId) return { success: false, message: 'Application has no applicantId' };

    if (appData.coinHeld === false || appData.coinReleasedAt) {
      return { success: true, released: false };
    }

    await releaseApplicationCoinForUser(applicantId, releaseReason);
    await appRef.update({
      coinHeld: false,
      coinReleaseReason: releaseReason,
      coinReleasedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, released: true };
  } catch (error) {
    console.error('❌ Error releasing application coin:', error);
    return { success: false, message: error.message };
  }
}

async function getWorkerApplications(workerId, filters = {}) {
  const db = getFirestore();
  const safeWorkerId = String(workerId || '').trim();
  if (!safeWorkerId) return [];
  const statusFilter = Array.isArray(filters.statuses) ? filters.statuses.filter(Boolean) : [];
  const searchTerm = String(filters.search || '').trim().toLowerCase();

  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection('applications')
      .where('applicantId', '==', safeWorkerId)
      .orderBy('appliedAt', 'desc')
      .limit(200)
      .get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((app) => statusFilter.length === 0 || statusFilter.includes(String(app.status || '')))
      .filter((app) => !searchTerm || String(app.jobTitle || '').toLowerCase().includes(searchTerm));
  } catch (error) {
    console.error('❌ Error loading worker applications:', error);
    return [];
  }
}

async function withdrawWorkerApplication(applicationId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeApplicationId = String(applicationId || '').trim();
  if (!safeApplicationId) return { success: false, message: 'Application ID required' };
  if (!currentUser) return { success: false, message: 'You must be logged in' };

  if (!db) {
    return { success: false, message: 'Applications backend unavailable' };
  }

  try {
    const appRef = db.collection('applications').doc(safeApplicationId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) return { success: false, message: 'Application not found' };
    const appData = appDoc.data() || {};
    if (String(appData.applicantId || '') !== currentUser.uid) {
      return { success: false, message: 'You can only withdraw your own applications' };
    }
    if (String(appData.status || '') !== 'pending') {
      return { success: false, message: 'Only pending applications can be withdrawn' };
    }

    await appRef.update({
      status: 'withdrawn',
      withdrawnAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const jobSnap = await db.collection('jobs').doc(appData.jobId).get();
    const currentCount = Number((jobSnap.data() || {}).applicationCount) || 0;
    await syncJobApplicationCount(appData.jobId, { setCount: Math.max(0, currentCount - 1) });

    await releaseApplicationCoinForApplication(safeApplicationId, 'withdrawn');
    return { success: true, message: 'Application withdrawn successfully' };
  } catch (error) {
    console.error('❌ Error withdrawing application:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Apply for a job
 * @param {string} jobId - Job document ID
 * @param {Object} applicationData - Application data (message, counterOffer)
 * @returns {Promise<Object>} - Result object
 */
async function applyForJob(jobId, applicationData) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const useRestPrimaryForApply = isIOSWebKitBrowserForDataPath();
  let restAuthHeaders = null;
  // iOS WebKit can exceed normal Firestore timing during multi-step apply validation.
  const applyReadTimeoutMs = useRestPrimaryForApply ? 18000 : 9000;
  const applyWriteTimeoutMs = useRestPrimaryForApply ? 22000 : 12000;
  const textValidation = validateAllowedTextChars([
    { label: 'Application message', value: getSafeValue(applicationData, 'message', '') }
  ]);
  if (!textValidation.valid) {
    return { success: false, message: textValidation.message };
  }
  
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to apply' };
  }
  
  if (!db) {
    return { success: false, message: 'Applications backend unavailable' };
  }
  let consumedCoin = false;
  
  try {
    emitIOSDataTrace('dynamic-job:apply', 'submit:start', {
      jobId: String(jobId || ''),
      applicantId: currentUser && currentUser.uid ? currentUser.uid : ''
    });
    emitIOSDataTrace('dynamic-job:apply', 'fetch:mode', useRestPrimaryForApply ? 'REST_PRIMARY' : 'SDK');
    if (useRestPrimaryForApply) {
      emitIOSDataTrace('dynamic-job:apply', 'auth:token:start', null);
      restAuthHeaders = await withFirestoreReadTimeout(buildFirestoreRestHeadersWithAuth(), applyReadTimeoutMs);
      emitIOSDataTrace('dynamic-job:apply', 'auth:token:done', {
        hasAuth: !!(restAuthHeaders && restAuthHeaders.Authorization)
      });
      if (!restAuthHeaders || !restAuthHeaders.Authorization) {
        return {
          success: false,
          message: 'Session verification failed. Please refresh and sign in again.'
        };
      }
    }
    // ═══════════════════════════════════════════════════════════════
    // VALIDATION: Prevent self-application
    // ═══════════════════════════════════════════════════════════════
    let job = null;
    if (useRestPrimaryForApply) {
      try {
        const restJob = await withFirestoreReadTimeout(fetchJobByIdViaFirestoreRest(jobId), applyReadTimeoutMs);
        if (restJob) {
          job = { id: restJob.id, jobId: restJob.id, ...restJob };
          emitIOSDataTrace('dynamic-job:apply', 'job:fetch:done', { mode: 'REST', found: true });
        } else {
          emitIOSDataTrace('dynamic-job:apply', 'job:fetch:done', { mode: 'REST', found: false });
        }
      } catch (restJobError) {
        emitIOSDataTrace('dynamic-job:apply', 'job:fetch:error', {
          mode: 'REST',
          message: restJobError && restJobError.message ? restJobError.message : String(restJobError)
        });
      }
    }
    if (!job) {
      const safeJobId = String(jobId || '').trim();
      const doc = await withFirestoreReadTimeout(db.collection('jobs').doc(safeJobId).get(), applyReadTimeoutMs);
      job = doc && doc.exists ? { id: doc.id, jobId: doc.id, ...doc.data() } : null;
      emitIOSDataTrace('dynamic-job:apply', 'job:fetch:done', { mode: 'SDK', found: !!job });
    }
    
    if (!job) {
      return { success: false, message: 'Job not found' };
    }
    
    if (job.posterId === currentUser.uid) {
      console.warn('⚠️ User attempted to apply to their own gig');
      return { 
        success: false, 
        message: 'You cannot apply to your own gig' 
      };
    }
    
    // Block applications to jobs that are already hired/accepted/completed
    if (['hired', 'accepted', 'completed'].includes(job.status)) {
      console.warn('⚠️ User attempted to apply to a job that is no longer accepting applications');
      return {
        success: false,
        message: 'This gig is no longer accepting applications.'
      };
    }
    
    console.log('✅ Self-application check passed');
    
    // ═══════════════════════════════════════════════════════════════
    // VALIDATION: Smart reapplication system (max 2 applications)
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Checking for existing applications...');
    
    let existingApplications = null;
    if (useRestPrimaryForApply) {
      emitIOSDataTrace('dynamic-job:apply', 'applications:fetch:start', { mode: 'REST_AUTH' });
      try {
        const restRows = await withFirestoreReadTimeout(
          fetchApplicationsByJobAndApplicantViaFirestoreRest(jobId, currentUser.uid, 6, restAuthHeaders),
          applyReadTimeoutMs
        );
        const sortedRows = [...restRows].sort((a, b) => toComparableMillis(b.appliedAt) - toComparableMillis(a.appliedAt));
        existingApplications = {
          size: sortedRows.length,
          docs: sortedRows.map((row) => ({ data: () => row }))
        };
        emitIOSDataTrace('dynamic-job:apply', 'applications:fetch:done', {
          mode: 'REST_AUTH',
          count: existingApplications.size
        });
      } catch (restAppError) {
        emitIOSDataTrace('dynamic-job:apply', 'applications:fetch:error', {
          mode: 'REST_AUTH',
          message: restAppError && restAppError.message ? restAppError.message : String(restAppError)
        });
        return {
          success: false,
          message: 'Application check failed on this connection. Please retry.'
        };
      }
    }
    if (!existingApplications) {
      const ownApplicationsSnapshot = await withFirestoreReadTimeout(
        db.collection('applications')
          .where('jobId', '==', jobId)
          .where('applicantId', '==', currentUser.uid)
          .orderBy('appliedAt', 'desc')
          .get(),
        applyReadTimeoutMs
      );
      existingApplications = {
        size: ownApplicationsSnapshot.size,
        docs: ownApplicationsSnapshot.docs
      };
      emitIOSDataTrace('dynamic-job:apply', 'applications:fetch:done', {
        mode: 'SDK_OWN_ONLY',
        count: existingApplications.size
      });
    }
    
    // Withdrawn applications never reached the customer, so they do not consume
    // a re-apply chance. Count only applications the customer can see or acted on.
    const sortedExistingDocs = existingApplications.docs
      .map((doc) => doc.data())
      .sort((a, b) => toComparableMillis(b.appliedAt) - toComparableMillis(a.appliedAt));
    const nonWithdrawnDocs = sortedExistingDocs.filter((data) => String(data.status || '') !== 'withdrawn');
    const applicationCount = nonWithdrawnDocs.length;
    
    console.log(`📊 Existing application count (excluding withdrawn): ${applicationCount}`);
    
    // ═══════════════════════════════════════════════════════════════
    // RULE 1: Block if 2+ applications already exist
    // ═══════════════════════════════════════════════════════════════
    if (applicationCount >= 2) {
      console.warn('⚠️ User has reached maximum applications (2) for this gig');
      return {
        success: false,
        message: 'You have reached the maximum number of applications for this job'
      };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RULE 2: Block if 1 application exists and it's pending or accepted
    // ═══════════════════════════════════════════════════════════════
    if (applicationCount === 1) {
      const existingApp = nonWithdrawnDocs[0];
      console.log(`📊 Existing application status: ${existingApp.status}`);
      
      if (existingApp.status === 'pending') {
        console.warn('⚠️ User already has a pending application for this gig');
        return {
          success: false,
          message: 'You have already applied to this gig (application pending)'
        };
      }
      
      if (existingApp.status === 'accepted') {
        console.warn('⚠️ User has already been hired for this gig');
        return {
          success: false,
          message: 'You have already been hired for this job'
        };
      }
      
      // Allow reapplication after closed outcomes.
      if (existingApp.status === 'rejected') {
        console.log('♻️ User was rejected - allowing reapplication (2nd chance)');
      } else if (existingApp.status === 'voided') {
        console.log('♻️ User was voided (contract terminated by customer) - allowing reapplication (2nd chance)');
      } else if (existingApp.status === 'resigned') {
        console.log('♻️ User resigned (left the job) - allowing reapplication (2nd chance)');
      } else if (existingApp.status === 'withdrawn' || existingApp.status === 'rejected_by_worker' || existingApp.status === 'expired') {
        console.log(`♻️ User status "${existingApp.status}" - allowing reapplication`);
      }
    }
    
    console.log('✅ Application validation check passed');
    
    // ═══════════════════════════════════════════════════════════════
    // AUTO-PAUSE CHECK: Count total pending applications for this gig
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Checking total application count for auto-pause logic...');
    
    let totalPendingApplications = Number(job.applicationCount);
    let hasPendingCountFromJob = Number.isFinite(totalPendingApplications) && totalPendingApplications >= 0;
    if (hasPendingCountFromJob) {
      emitIOSDataTrace('dynamic-job:apply', 'pending:count:done', { mode: 'JOB_FIELD', count: totalPendingApplications });
    } else {
      totalPendingApplications = 0;
      emitIOSDataTrace('dynamic-job:apply', 'pending:count:done', { mode: 'JOB_FIELD_MISSING', count: 0 });
    }
    
    console.log(`📊 Total pending applications for this gig: ${totalPendingApplications}`);
    
    const launchFeedOn = await resolveLaunchFeedBucketOn();
    // Mature mode only: block apply at the pause cap. Launch bucket stays live.
    if (!launchFeedOn && totalPendingApplications >= maturePauseAtApps()) {
      console.warn('🛑 Gig has reached maximum applications — paused (mature mode)');
      return {
        success: false,
        message: 'This gig is currently paused due to high interest. The poster is reviewing applications.'
      };
    }
    
    console.log('✅ Auto-pause check passed - gig still accepting applications');

    // Validate coin availability and consume one coin before writing the application.
    const coinState = await ensureApplicationCoinsForUser(currentUser.uid, db);
    if (coinState.current <= 0) {
      return {
        success: false,
        message: 'You have no applications remaining right now. Wait for a current application to close, or withdraw a pending one.'
      };
    }
    emitIOSDataTrace('dynamic-job:apply', 'write:coin:start', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK'
    });
    if (useRestPrimaryForApply) {
      await withFirestoreReadTimeout(
        updateUserApplicationCoinsViaFirestoreRest(
          currentUser.uid,
          coinState.current - 1,
          coinState.max,
          restAuthHeaders
        ),
        applyWriteTimeoutMs
      );
    } else {
      await withFirestoreReadTimeout(
        db.collection('users').doc(currentUser.uid).set({
          applicationCoinsCurrent: coinState.current - 1,
          applicationCoinsMax: coinState.max
        }, { merge: true }),
        applyWriteTimeoutMs
      );
    }
    emitIOSDataTrace('dynamic-job:apply', 'write:coin:done', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK'
    });
    consumedCoin = true;
    
    // Get applicant profile from Firestore for accurate info
    let applicantName = currentUser.displayName || 'Anonymous';
    let applicantThumbnail = currentUser.photoURL || '';
    
    console.log('🔍 Fetching applicant profile from Firestore for:', currentUser.uid);
    
    emitIOSDataTrace('dynamic-job:apply', 'profile:fetch:start', null);
    try {
      const applicantProfile = await withFirestoreReadTimeout(
        getUserProfile(currentUser.uid),
        applyReadTimeoutMs
      );
      emitIOSDataTrace('dynamic-job:apply', 'profile:fetch:done', { hasProfile: !!applicantProfile });
      
      if (applicantProfile) {
        console.log('✅ Using Firestore profile data for applicant');
        applicantName = applicantProfile.fullName || applicantName;
        applicantThumbnail = applicantProfile.profilePhoto || applicantThumbnail;
      } else {
        console.warn('⚠️ No Firestore profile found for applicant, using Auth data');
      }
    } catch (error) {
      emitIOSDataTrace('dynamic-job:apply', 'profile:fetch:error', {
        message: error && error.message ? error.message : String(error)
      });
      console.error('❌ Error fetching applicant profile:', error);
      console.warn('⚠️ Falling back to Auth data for applicant');
    }
    
    console.log('🎯 Final applicant data:', { applicantName, applicantThumbnail });
    
    // Create application document
    const application = {
      jobId: jobId,
      applicantId: currentUser.uid,
      // Denormalized gig owner (job poster) UID. Lets the applications read rule be
      // tightened to "applicant or gig owner" without a per-read get() on the job doc.
      gigOwnerId: (job && job.posterId) ? job.posterId : '',
      applicantName: applicantName,
      applicantThumbnail: applicantThumbnail,
      appliedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      message: applicationData.message || '',
      counterOffer: applicationData.counterOffer || null,
      jobTitle: job.title || '',
      coinHeld: true,
      coinConsumedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    emitIOSDataTrace('dynamic-job:apply', 'write:application:start', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK'
    });
    let appRef = null;
    if (useRestPrimaryForApply) {
      const restApp = await withFirestoreReadTimeout(
        createApplicationViaFirestoreRest(application, restAuthHeaders),
        applyWriteTimeoutMs
      );
      appRef = { id: restApp && restApp.id ? restApp.id : '' };
    } else {
      appRef = await withFirestoreReadTimeout(
        db.collection('applications').add(application),
        applyWriteTimeoutMs
      );
    }
    emitIOSDataTrace('dynamic-job:apply', 'write:application:done', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK',
      applicationId: appRef && appRef.id ? appRef.id : ''
    });
    
    // Update job application count
    emitIOSDataTrace('dynamic-job:apply', 'write:jobCount:start', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK'
    });
    if (useRestPrimaryForApply) {
      await withFirestoreReadTimeout(
        syncJobApplicationCountViaFirestoreRest(jobId, appRef.id, restAuthHeaders, totalPendingApplications + 1),
        applyWriteTimeoutMs
      );
    } else {
      await withFirestoreReadTimeout(
        syncJobApplicationCount(jobId, { applicationIdToUnion: appRef.id, setCount: totalPendingApplications + 1 }),
        applyWriteTimeoutMs
      );
    }
    emitIOSDataTrace('dynamic-job:apply', 'write:jobCount:done', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK'
    });
    
    console.log('✅ Application submitted:', appRef.id);
    
    // Owner alert is awaited, not fire-and-forget, so leaving the gig page right
    // after applying cannot drop it. Bounded like every other network step here:
    // a cold clerk must not fail an apply that is already written and paid for.
    const newTotalApplications = totalPendingApplications + 1;
    const applyAlertTimeoutMs = useRestPrimaryForApply ? 12000 : 10000;
    try {
      const applyAlertBase = {
        recipientId: job.posterId,
        jobId: jobId,
        jobTitle: job.title || 'Your Gig',
        applicationId: appRef && appRef.id ? appRef.id : ''
      };
      let applyAlert = null;
      if (newTotalApplications === 1) {
        applyAlert = {
          type: 'application_received',
            message: `Someone applied to "${job.title}". Click here to review.`,
          actionRequired: false
        };
      } else if (newTotalApplications === 5) {
        applyAlert = {
          type: 'application_milestone',
          message: `🔥 Your gig "${job.title}" has 5+ applications pending review!`,
          actionRequired: false
        };
      } else if (launchFeedOn && newTotalApplications === launchFeedBucketMinApps()) {
        applyAlert = {
          type: 'gig_review_needed',
          message: `Your gig "${job.title}" has ${launchFeedBucketMinApps()} applications. Review them in Gigs Manager — hire one or reject applicants you won't use.`,
          actionRequired: true
        };
      } else if (!launchFeedOn && newTotalApplications === maturePauseAtApps()) {
        await db.collection('jobs').doc(jobId).update({
          status: 'paused',
          pausedAt: firebase.firestore.FieldValue.serverTimestamp(),
          pauseReason: 'auto_paused_max_applications'
        });
        applyAlert = {
          type: 'gig_auto_paused',
          message: `🛑 Your gig "${job.title}" has been paused. You've received ${maturePauseAtApps()} applications. Please review and hire a worker or reject all applicants to reactivate your gig.`,
          actionRequired: true
        };
      }

      if (!applyAlert) {
        console.log('ℹ️ Apply alert not gated at this count:', newTotalApplications);
      } else if (!applyAlertBase.recipientId) {
        console.error('❌ Apply owner alert skipped: gig has no posterId');
      } else {
        const alertResult = await withFirestoreReadTimeout(
          callCreateUserAlert({ ...applyAlertBase, ...applyAlert }),
          applyAlertTimeoutMs
        );
        console.log(`✅ Apply owner alert (${applyAlert.type}) result:`, alertResult);
      }
    } catch (notifError) {
      // The application is already written and the coin already spent, so alert
      // trouble must never turn a successful apply into a failure for the worker.
      console.error('❌ Apply owner alert failed:', notifError);
    }
    
    triggerPushMilestonePrompt('apply');
    return {
      success: true,
      applicationId: appRef.id,
      message: 'Application submitted successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error applying for job:', error);
    if (consumedCoin && currentUser && currentUser.uid) {
      try {
        await releaseApplicationCoinForUser(currentUser.uid, 'apply_error_refund');
      } catch (refundError) {
        console.warn('⚠️ Could not auto-refund consumed coin after apply failure:', refundError);
      }
    }
    const message = (error && error.message) ? error.message : String(error);
    const stage = /timed out/i.test(message) ? 'submit:timeout' : 'submit:error';
    emitIOSDataTrace('dynamic-job:apply', stage, message);
    return { success: false, message: error.message };
  }
}

/**
 * Get applications for a job
 * @param {string} jobId - Job document ID
 * @returns {Promise<Array>} - Array of applications
 */
async function getJobApplications(jobId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  console.log('🔍 firebase-db.js: getJobApplications() called');
  console.log('   Querying with jobId:', jobId);
  
  if (!db) {
    return [];
  }
  if (!currentUser || !currentUser.uid) {
    return [];
  }
  
  try {
    console.log('   📡 Querying Firestore: applications where gigOwnerId == me and jobId ==', jobId);
    const snapshot = await db.collection('applications')
      .where('gigOwnerId', '==', currentUser.uid)
      .where('jobId', '==', jobId)
      .orderBy('appliedAt', 'desc')
      .get();
    
    console.log('   ✅ Firestore returned', snapshot.docs.length, 'documents');
    
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('      -', doc.id, '| jobId:', data.jobId, '| applicant:', data.applicantName);
      return {
        id: doc.id,
        ...data
      };
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error getting applications:', error);
    return [];
  }
}

/**
 * Accept an application and hire the worker
 * @param {string} jobId - Job document ID
 * @param {string} applicationId - Application document ID
 * @returns {Promise<Object>} - Result object
 */
async function hireWorker(jobId, applicationId, confirmedPrice) {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Jobs backend unavailable' };
  }
  
  try {
    // Get application data
    const appDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!appDoc.exists) {
      return { success: false, message: 'Application not found' };
    }
    
    const appData = appDoc.data();
    
    // Get job data to determine agreed price
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return { success: false, message: 'Job not found' };
    }
    
    const jobData = jobDoc.data();

    // Idempotent guard: do not re-send an offer already waiting on this worker.
    const appStatus = String(appData.status || '').trim().toLowerCase();
    const jobStatus = String(jobData.status || '').trim().toLowerCase();
    const hiredWorkerId = String(jobData.hiredWorkerId || '').trim();
    const applicantId = String(appData.applicantId || '').trim();
    if (
      applicantId
      && hiredWorkerId === applicantId
      && (jobStatus === 'hired' || appStatus === 'accepted' || appStatus === 'hired')
    ) {
      return {
        success: false,
        alreadySent: true,
        message: 'Offer already sent. Waiting for the worker to respond.'
      };
    }
    
    // Determine agreed price. Priority: customer-confirmed price from the hire
    // overlay (price-verify field) → worker counter offer → job's original price.
    const parsedConfirmed = Number(confirmedPrice);
    const hasConfirmed = Number.isFinite(parsedConfirmed) && parsedConfirmed > 0;
    const agreedPrice = hasConfirmed ? parsedConfirmed : (appData.counterOffer || jobData.priceOffer);
    
    console.log('💰 Price negotiation:', {
      originalJobPrice: jobData.priceOffer,
      counterOffer: appData.counterOffer,
      confirmedPrice: hasConfirmed ? parsedConfirmed : null,
      agreedPrice: agreedPrice
    });
    
    // Update job with hired worker info AND agreed price
    await db.collection('jobs').doc(jobId).update({
      status: 'hired',
      hiredWorkerId: appData.applicantId,
      hiredWorkerName: appData.applicantName,
      hiredWorkerThumbnail: appData.applicantThumbnail,
      agreedPrice: agreedPrice, // Store the agreed price
      hiredAt: firebase.firestore.FieldValue.serverTimestamp(),
      // Offer-out UI: badge shows 0 until worker responds (other pendings stay pending).
      applicationCount: 0,
      heldPendingCount: Math.max(0, (Number(jobData.applicationCount) || 0) - 1)
    });
    
    // Update application status of the chosen applicant to 'accepted' (offer extended)
    await db.collection('applications').doc(applicationId).update({
      status: 'accepted'
    });
    
    // DO NOT reject other applications yet - keep them pending.
    // They will only be rejected after the hired worker confirms acceptance.
    // If the worker rejects the offer, other applicants remain available.
    console.log('📋 Other applications kept pending until worker accepts offer');
    
    console.log('🔔 About to create offer notification for worker:', appData.applicantId);
    
    // Offer alert: clerk deletes stale offer_sent for this gig, then writes one row.
    try {
      const result = await callCreateUserAlert({
        type: 'offer_sent',
        recipientId: appData.applicantId,
        jobId: jobId,
        jobTitle: jobData.title || 'Gig',
        message: `Click to Accept or Decline: ${jobData.title || 'Gig'}!`,
        actionRequired: true,
        applicationId: applicationId
      });
      console.log('✅ Offer notification result:', result);
    } catch (notifError) {
      console.error('❌ Error creating offer notification:', notifError);
      // Don't fail the hiring if notification fails
    }
    
    console.log('✅ Worker hired successfully with agreed price:', agreedPrice);
    return { success: true, message: 'Worker hired successfully!' };
    
  } catch (error) {
    console.error('❌ Error hiring worker:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Worker-side offer acceptance used by chat-thread offer card actions.
 * Mirrors the offered->accepted transition without relying on jobs.js globals.
 * @param {string} jobId - Job document ID
 * @returns {Promise<{success:boolean,message:string}>}
 */
async function acceptGigOfferInChat(jobId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();

  if (!db) return { success: false, message: 'Jobs backend unavailable' };
  if (!currentUser?.uid) return { success: false, message: 'You must be logged in' };
  if (!safeJobId) return { success: false, message: 'Missing job id' };

  try {
    const jobDoc = await db.collection('jobs').doc(safeJobId).get();
    if (!jobDoc.exists) return { success: false, message: 'Job not found' };
    const jobData = jobDoc.data() || {};
    if (String(jobData.hiredWorkerId || '').trim() !== currentUser.uid) {
      return { success: false, message: 'Offer does not belong to your account' };
    }

    await db.collection('jobs').doc(safeJobId).update({
      status: 'accepted',
      acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
      workerAccepted: true
    });

    // Getting hired returns the worker's application slot (only pending/offer states hold one).
    try {
      const ownApps = await db.collection('applications')
        .where('jobId', '==', safeJobId)
        .where('applicantId', '==', currentUser.uid)
        .get();
      const releasePromises = ownApps.docs
        .filter((doc) => {
          const status = String((doc.data() || {}).status || '').toLowerCase();
          return status === 'accepted' || status === 'hired' || status === 'pending';
        })
        .map((doc) => releaseApplicationCoinForApplication(doc.id, 'hired')
          .catch((error) => console.warn('⚠️ Coin release on hire skipped:', error)));
      await Promise.all(releasePromises);
    } catch (hireReleaseError) {
      console.warn('⚠️ Coin release on hire skipped:', hireReleaseError);
    }

    try {
      const workerProfile = await getUserProfile(currentUser.uid);
      const workerName = workerProfile?.fullName || currentUser.displayName || 'Worker';
      if (jobData.posterId) {
        await createNotification(jobData.posterId, {
          type: 'offer_accepted',
          jobId: safeJobId,
          jobTitle: jobData.title || 'Gig',
          message: `${workerName} has accepted your gig offer for "${jobData.title || 'Gig'}"!`,
          actionRequired: false
        });
      }
    } catch (notifyError) {
      console.warn('⚠️ Offer accepted notification skipped:', notifyError);
    }

    try {
      const offerNotifs = await db.collection('notifications')
        .where('recipientId', '==', currentUser.uid)
        .where('jobId', '==', safeJobId)
        .where('type', '==', 'offer_sent')
        .get();
      if (!offerNotifs.empty) {
        const deletePromises = offerNotifs.docs.map((doc) => doc.ref.delete());
        await Promise.all(deletePromises);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Offer notification cleanup skipped:', cleanupError);
    }

    // NOTE: Do not run pending-application rejection sweep from worker chat accept.
    // Some projects enforce write rules that only allow the poster/backend to mutate
    // other applicants, which causes noisy permission errors in worker context.
    // Keep worker-side accept focused on accepting the offer + customer notification.

    return { success: true, message: 'Offer accepted' };
  } catch (error) {
    console.error('❌ Error accepting offer from chat:', error);
    return { success: false, message: error.message || 'Failed to accept offer' };
  }
}

/**
 * Worker-side offer rejection used by chat-thread offer card actions.
 * @param {string} jobId - Job document ID
 * @returns {Promise<{success:boolean,message:string}>}
 */
async function rejectGigOfferInChat(jobId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();

  if (!db) return { success: false, message: 'Jobs backend unavailable' };
  if (!currentUser?.uid) return { success: false, message: 'You must be logged in' };
  if (!safeJobId) return { success: false, message: 'Missing job id' };

  try {
    const jobDoc = await db.collection('jobs').doc(safeJobId).get();
    if (!jobDoc.exists) return { success: false, message: 'Job not found' };
    const jobData = jobDoc.data() || {};
    if (String(jobData.hiredWorkerId || '').trim() !== currentUser.uid) {
      return { success: false, message: 'Offer does not belong to your account' };
    }

    await db.collection('jobs').doc(safeJobId).update({
      status: 'active',
      hiredWorkerId: firebase.firestore.FieldValue.delete(),
      hiredWorkerName: firebase.firestore.FieldValue.delete(),
      hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
      agreedPrice: firebase.firestore.FieldValue.delete(),
      hiredAt: firebase.firestore.FieldValue.delete(),
      acceptedAt: firebase.firestore.FieldValue.delete(),
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    const applicationsSnapshot = await db.collection('applications')
      .where('jobId', '==', safeJobId)
      .where('applicantId', '==', currentUser.uid)
      .get();
    const targetApps = applicationsSnapshot.docs.filter((doc) => {
      const status = String((doc.data() || {}).status || '').toLowerCase();
      return status === 'accepted' || status === 'hired' || status === 'pending';
    });
    if (targetApps.length > 0) {
      const batch = db.batch();
      targetApps.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'rejected_by_worker',
          rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    }

    if (typeof releaseApplicationCoinForApplication === 'function') {
      const releasePromises = targetApps.map((doc) =>
        releaseApplicationCoinForApplication(doc.id, 'rejected_by_worker')
          .catch((error) => console.warn('⚠️ Coin release skipped:', error))
      );
      await Promise.all(releasePromises);
    }

    const declineCount = resolveApplicationCountAfterOfferEnd(jobData);
    if (declineCount !== null) {
      await syncJobApplicationCount(safeJobId, { setCount: declineCount });
    }

    try {
      const workerProfile = await getUserProfile(currentUser.uid);
      const workerName = workerProfile?.fullName || currentUser.displayName || 'Worker';
      await sendOfferRejectedNotification(
        jobData.posterId,
        String(jobData.posterName || 'Customer'),
        safeJobId,
        jobData.title || 'Gig',
        workerName
      );
    } catch (notifyError) {
      console.warn('⚠️ Offer rejected notification skipped:', notifyError);
    }

    try {
      const offerNotifs = await db.collection('notifications')
        .where('recipientId', '==', currentUser.uid)
        .where('jobId', '==', safeJobId)
        .where('type', '==', 'offer_sent')
        .get();
      if (!offerNotifs.empty) {
        const deletePromises = offerNotifs.docs.map((doc) => doc.ref.delete());
        await Promise.all(deletePromises);
      }
    } catch (cleanupError) {
      console.warn('⚠️ Offer notification cleanup skipped:', cleanupError);
    }

    return { success: true, message: 'Offer rejected' };
  } catch (error) {
    console.error('❌ Error rejecting offer from chat:', error);
    return { success: false, message: error.message || 'Failed to reject offer' };
  }
}

/**
 * Customer-side relist/void action from chat Gig Status modal.
 * @param {string} jobId
 * @param {string} reason
 * @returns {Promise<{success:boolean,message:string}>}
 */
async function relistGigFromChat(jobId, reason) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();
  const safeReason = String(reason || '').trim();

  if (!db) return { success: false, message: 'Jobs backend unavailable' };
  if (!currentUser?.uid) return { success: false, message: 'You must be logged in' };
  if (!safeJobId) return { success: false, message: 'Missing job id' };
  if (safeReason.length < 2) return { success: false, message: 'Reason must be at least 2 characters' };

  try {
    const jobDoc = await db.collection('jobs').doc(safeJobId).get();
    if (!jobDoc.exists) return { success: false, message: 'Job not found' };
    const jobData = jobDoc.data() || {};
    if (String(jobData.posterId || '').trim() !== currentUser.uid) {
      return { success: false, message: 'Only the customer can relist this gig' };
    }

    const hiredWorkerId = String(jobData.hiredWorkerId || '').trim();
    const hiredWorkerName = String(jobData.hiredWorkerName || '').trim() || 'Worker';

    await db.collection('jobs').doc(safeJobId).update({
      status: 'active',
      hiredWorkerId: firebase.firestore.FieldValue.delete(),
      hiredWorkerName: firebase.firestore.FieldValue.delete(),
      hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
      agreedPrice: firebase.firestore.FieldValue.delete(),
      hiredAt: firebase.firestore.FieldValue.delete(),
      acceptedAt: firebase.firestore.FieldValue.delete(),
      relistedAt: firebase.firestore.FieldValue.serverTimestamp(),
      relistReason: safeReason,
      voidedWorker: hiredWorkerName,
      voidedWorkerId: hiredWorkerId,
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    });

    if (hiredWorkerId) {
      try {
        const applicationsSnapshot = await db.collection('applications')
          .where('jobId', '==', safeJobId)
          .where('applicantId', '==', hiredWorkerId)
          .where('status', 'in', ['accepted', 'hired', 'pending'])
          .get();
        const batch = db.batch();
        applicationsSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'voided',
            voidedAt: firebase.firestore.FieldValue.serverTimestamp(),
            voidReason: safeReason
          });
        });
        if (!applicationsSnapshot.empty) {
          await batch.commit();
          if (typeof releaseApplicationCoinForApplication === 'function') {
            const releasePromises = applicationsSnapshot.docs.map((doc) =>
              releaseApplicationCoinForApplication(doc.id, 'voided_by_customer')
                .catch((error) => console.warn('⚠️ Coin release skipped:', error))
            );
            await Promise.all(releasePromises);
          }
        }
      } catch (appError) {
        console.warn('⚠️ Worker application voiding skipped:', appError);
      }
    }

    const voidCount = resolveApplicationCountAfterOfferEnd(jobData);
    if (voidCount !== null) {
      await syncJobApplicationCount(safeJobId, { setCount: voidCount });
    }

    if (hiredWorkerId && typeof sendContractVoidedNotification === 'function') {
      await sendContractVoidedNotification(
        hiredWorkerId,
        hiredWorkerName,
        safeJobId,
        jobData.title || 'Gig',
        safeReason,
        String(jobData.posterName || 'Customer')
      ).catch((error) => {
        console.warn('⚠️ Contract voided notification skipped:', error);
      });
    }

    return { success: true, message: 'Gig relisted' };
  } catch (error) {
    console.error('❌ Error relisting gig from chat:', error);
    return { success: false, message: error.message || 'Failed to relist gig' };
  }
}

/**
 * Worker-side resignation action from chat Gig Status modal.
 * @param {string} jobId
 * @param {string} reason
 * @returns {Promise<{success:boolean,message:string}>}
 */
async function resignGigFromChat(jobId, reason) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();
  const safeReason = String(reason || '').trim();

  if (!db) return { success: false, message: 'Jobs backend unavailable' };
  if (!currentUser?.uid) return { success: false, message: 'You must be logged in' };
  if (!safeJobId) return { success: false, message: 'Missing job id' };
  if (safeReason.length < 2) return { success: false, message: 'Reason must be at least 2 characters' };

  try {
    const jobDoc = await db.collection('jobs').doc(safeJobId).get();
    if (!jobDoc.exists) return { success: false, message: 'Job not found' };
    const jobData = jobDoc.data() || {};
    if (String(jobData.hiredWorkerId || '').trim() !== currentUser.uid) {
      return { success: false, message: 'Only the hired worker can resign this gig' };
    }

    const workerName = await getFreshOwnDisplayName(currentUser, currentUser.displayName || 'Worker');
    const customerId = String(jobData.posterId || '').trim();
    const customerName = String(jobData.posterName || 'Customer');

    await db.collection('jobs').doc(safeJobId).update({
      status: 'active',
      hiredWorkerId: firebase.firestore.FieldValue.delete(),
      hiredWorkerName: firebase.firestore.FieldValue.delete(),
      hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
      agreedPrice: firebase.firestore.FieldValue.delete(),
      hiredAt: firebase.firestore.FieldValue.delete(),
      acceptedAt: firebase.firestore.FieldValue.delete(),
      resignedAt: firebase.firestore.FieldValue.serverTimestamp(),
      resignReason: safeReason,
      resignedWorkerId: currentUser.uid,
      resignedWorkerName: workerName,
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    });

    try {
      const applicationsSnapshot = await db.collection('applications')
        .where('jobId', '==', safeJobId)
        .where('applicantId', '==', currentUser.uid)
        .where('status', 'in', ['accepted', 'hired'])
        .get();
      const batch = db.batch();
      applicationsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: 'resigned',
          resignedAt: firebase.firestore.FieldValue.serverTimestamp(),
          resignReason: safeReason
        });
      });
      if (!applicationsSnapshot.empty) {
        await batch.commit();
        if (typeof releaseApplicationCoinForApplication === 'function') {
          const releasePromises = applicationsSnapshot.docs.map((doc) =>
            releaseApplicationCoinForApplication(doc.id, 'resigned_by_worker')
              .catch((error) => console.warn('⚠️ Coin release skipped:', error))
          );
          await Promise.all(releasePromises);
        }
      }
    } catch (appError) {
      console.warn('⚠️ Resigned application update skipped:', appError);
    }

    const resignCount = resolveApplicationCountAfterOfferEnd(jobData);
    if (resignCount !== null) {
      await syncJobApplicationCount(safeJobId, { setCount: resignCount });
    }

    if (customerId && typeof sendWorkerResignedNotification === 'function') {
      await sendWorkerResignedNotification(
        customerId,
        customerName,
        safeJobId,
        jobData.title || 'Gig',
        safeReason,
        workerName
      ).catch((error) => {
        console.warn('⚠️ Worker resigned notification skipped:', error);
      });
    }

    return { success: true, message: 'Gig resignation complete' };
  } catch (error) {
    console.error('❌ Error resigning gig from chat:', error);
    return { success: false, message: error.message || 'Failed to resign from gig' };
  }
}

/**
 * Customer-side completion action from chat Gig Status flow.
 * @param {string} jobId
 * @returns {Promise<{success:boolean,message:string}>}
 */
async function completeGigFromChat(jobId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();

  if (!db) return { success: false, message: 'Jobs backend unavailable' };
  if (!currentUser?.uid) return { success: false, message: 'You must be logged in' };
  if (!safeJobId) return { success: false, message: 'Missing job id' };

  try {
    const jobDoc = await db.collection('jobs').doc(safeJobId).get();
    if (!jobDoc.exists) return { success: false, message: 'Job not found' };
    const jobData = jobDoc.data() || {};
    if (String(jobData.posterId || '').trim() !== currentUser.uid) {
      return { success: false, message: 'Only the customer can complete this gig' };
    }

    await db.collection('jobs').doc(safeJobId).update({
      status: 'completed',
      completedAt: firebase.firestore.FieldValue.serverTimestamp(),
      completedBy: 'customer',
      completionConfirmed: true
    });

    const hiredWorkerId = String(jobData.hiredWorkerId || '').trim();
    if (hiredWorkerId) {
      try {
        const acceptedApps = await db.collection('applications')
          .where('jobId', '==', safeJobId)
          .where('applicantId', '==', hiredWorkerId)
          .where('status', 'in', ['accepted', 'hired'])
          .get();
        if (!acceptedApps.empty) {
          const batch = db.batch();
          acceptedApps.docs.forEach((doc) => {
            batch.update(doc.ref, {
              status: 'completed',
              completedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
          await batch.commit();

          if (typeof releaseApplicationCoinForApplication === 'function') {
            const releasePromises = acceptedApps.docs.map((doc) =>
              releaseApplicationCoinForApplication(doc.id, 'gig_completed')
                .catch((error) => console.warn('⚠️ Coin release skipped:', error))
            );
            await Promise.all(releasePromises);
          }
        }
      } catch (appError) {
        console.warn('⚠️ Completion app update skipped:', appError);
      }
    }

    if (hiredWorkerId) {
      try {
        await callCreateUserAlert({
          type: 'job_completed',
          recipientId: hiredWorkerId,
          jobId: safeJobId,
          jobTitle: jobData.title || 'Gig',
          message: `Gig "${jobData.title || 'Gig'}" has been marked completed.`,
          actionRequired: false,
          dedupeKey: `job_completed_${safeJobId}_worker_${hiredWorkerId}`
        });
      } catch (error) {
        console.warn('⚠️ Completion notification skipped:', error);
      }
    }

    return { success: true, message: 'Gig marked as completed' };
  } catch (error) {
    console.error('❌ Error completing gig from chat:', error);
    return { success: false, message: error.message || 'Failed to complete gig' };
  }
}

/**
 * Get offered jobs for a worker (jobs with status 'hired' where they are the hired worker)
 * @param {string} workerId - Worker's user ID
 * @returns {Promise<Array>} - Array of offered job objects
 */
async function getOfferedJobsForWorker(workerId) {
  const db = getFirestore();
  
  if (!db) {
    console.log('⚠️ Firebase not available, returning empty offered jobs');
    return [];
  }
  
  try {
    console.log(`🔍 Fetching offered jobs for worker: ${workerId}`);
    emitIOSDataTrace('jobs:offered', 'fetch:start', { workerId: String(workerId || '') });
    if (isIOSWebKitBrowserForDataPath()) {
      emitIOSDataTrace('jobs:offered', 'fetch:mode', 'REST');
      const rows = await withFirestoreReadTimeout(fetchJobsByFieldViaFirestoreRest('hiredWorkerId', workerId), 10000);
      const offeredJobs = rows
        .filter((job) => job && job.status === 'hired')
        .map((job) => ({
          id: job.id,
          jobId: job.id,
          ...job
        }));
      emitIOSDataTrace('jobs:offered', 'fetch:done', { count: offeredJobs.length, mode: 'REST' });
      return offeredJobs;
    }
    emitIOSDataTrace('jobs:offered', 'fetch:mode', 'SDK');
    
    // Get jobs where status is 'hired' and worker is the hired worker
    const offeredJobsSnapshot = await db.collection('jobs')
      .where('status', '==', 'hired')
      .where('hiredWorkerId', '==', workerId)
      .get();
    
    console.log(`📊 Raw Firestore results: ${offeredJobsSnapshot.size} documents`);
    
    // Log each job's details for debugging
    offeredJobsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 Offered Job ${index + 1}:`, {
        jobId: doc.id,
        status: data.status,
        hiredWorkerId: data.hiredWorkerId,
        title: data.title
      });
    });
    
    const offeredJobs = offeredJobsSnapshot.docs.map(doc => ({
      id: doc.id,
      jobId: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Returning ${offeredJobs.length} offered jobs`);
    emitIOSDataTrace('jobs:offered', 'fetch:done', { count: offeredJobs.length, mode: 'SDK' });
    return offeredJobs;
    
  } catch (error) {
    console.error('❌ Error fetching offered jobs:', error);
    const message = (error && error.message) ? error.message : String(error);
    const stage = /timed out/i.test(message) ? 'fetch:timeout' : 'fetch:error';
    emitIOSDataTrace('jobs:offered', stage, message);
    return [];
  }
}

/**
 * Fix application counts for all jobs (recalculate from actual pending applications)
 * @returns {Promise<Object>} - Result object
 */
async function fixApplicationCounts() {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Firebase not available' };
  }
  
  try {
    console.log('🔧 Fixing application counts for all jobs...');
    
    const jobsSnapshot = await db.collection('jobs').get();
    let fixed = 0;
    
    for (const jobDoc of jobsSnapshot.docs) {
      const jobId = jobDoc.id;
      const currentCount = Number(jobDoc.data().applicationCount) || 0;
      const correctCount = await syncJobApplicationCount(jobId, { skipWriteIfCountEquals: currentCount });
      if (correctCount >= 0 && correctCount !== currentCount) {
        console.log(`📊 Job ${jobId}: Fixed count from ${currentCount} to ${correctCount}`);
        fixed++;
      }
    }
    
    console.log(`✅ Fixed ${fixed} job(s)`);
    return { success: true, message: `Fixed application counts for ${fixed} job(s)` };
    
  } catch (error) {
    console.error('❌ Error fixing application counts:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Reject a job application
 * @param {string} applicationId - Application document ID
 * @returns {Promise<Object>} - Result object
 */
async function rejectApplication(applicationId) {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Applications backend unavailable' };
  }
  
  try {
    // Get application data to verify it exists
    const appDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!appDoc.exists) {
      return { success: false, message: 'Application not found' };
    }
    
    const appData = appDoc.data();
    
    // Verify the current user is the job poster
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'You must be logged in' };
    }
    
    // Get job to verify poster
    const jobDoc = await db.collection('jobs').doc(appData.jobId).get();
    if (!jobDoc.exists) {
      return { success: false, message: 'Job not found' };
    }
    
    const jobData = jobDoc.data();
    if (jobData.posterId !== currentUser.uid) {
      return { success: false, message: 'You are not authorized to reject this application' };
    }
    
    // Update application status to rejected
    await db.collection('applications').doc(applicationId).update({
      status: 'rejected',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    await releaseApplicationCoinForApplication(applicationId, 'rejected');

    const rejectCount = Math.max(0, (Number(jobData.applicationCount) || 0) - 1);
    await syncJobApplicationCount(appData.jobId, { setCount: rejectCount });

    // Slots-reopened alert: clerk groups on that worker’s inbox. Do not fail reject if it fails.
    try {
      await callCreateUserAlert({
        type: 'application_slots_reopened_batch',
        recipientId: appData.applicantId,
        jobId: appData.jobId,
        jobTitle: jobData.title || appData.jobTitle || 'Gig',
        applicationId: applicationId
      });
    } catch (notifyError) {
      console.warn('⚠️ Manual reject grouped notification skipped:', notifyError);
    }
    
    console.log('✅ Application rejected successfully:', applicationId);
    console.log('✅ Job application count decremented');
    return { success: true, message: 'Application rejected successfully!' };
    
  } catch (error) {
    console.error('❌ Error rejecting application:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// CHAT/MESSAGES COLLECTION
// ============================================================================

/**
 * Create or get existing chat thread
 * @param {string} jobId - Job document ID
 * @param {string} otherUserId - Other participant's user ID
 * @param {Object} otherUserInfo - Other user's info (name, thumbnail)
 * @returns {Promise<Object>} - Thread data
 */
async function getOrCreateChatThread(jobId, otherUserId, otherUserInfo = {}) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to chat' };
  }
  
  if (!db) {
    return { success: false, message: 'Messaging backend unavailable' };
  }
  
  try {
    // Check for existing thread
    const existingSnapshot = await db.collection('chat_threads')
      .where('jobId', '==', jobId)
      .where('participantIds', 'array-contains', currentUser.uid)
      .get();
    
    const existingThread = existingSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participantIds.includes(otherUserId);
    });
    
    if (existingThread) {
      const existingData = existingThread.data() || {};
      const desiredJobTitle = String(otherUserInfo?.jobTitle || '').trim();
      const desiredOrigin = String(otherUserInfo?.threadOrigin || '').trim() || 'job';
      const needsThreadPatch = (
        (desiredJobTitle && !String(existingData.jobTitle || '').trim())
        || !String(existingData.threadOrigin || '').trim()
      );
      if (needsThreadPatch) {
        await db.collection('chat_threads').doc(existingThread.id).update({
          ...(desiredJobTitle ? { jobTitle: desiredJobTitle } : {}),
          threadOrigin: desiredOrigin
        });
      }
      return {
        success: true,
        threadId: existingThread.id,
        thread: {
          ...existingData,
          ...(desiredJobTitle ? { jobTitle: desiredJobTitle } : {}),
          threadOrigin: desiredOrigin
        },
        isNew: false
      };
    }
    
    // Create new thread
    const myThreadName = await getFreshOwnDisplayName(currentUser, currentUser.displayName || 'Anonymous');
    const threadData = {
      jobId: jobId,
      jobTitle: String(otherUserInfo?.jobTitle || '').trim(),
      threadOrigin: String(otherUserInfo?.threadOrigin || '').trim() || 'job',
      participantIds: [currentUser.uid, otherUserId],
      participant1: {
        userId: currentUser.uid,
        userName: myThreadName,
        userThumbnail: currentUser.photoURL || ''
      },
      participant2: {
        userId: otherUserId,
        userName: otherUserInfo.userName || 'User',
        userThumbnail: otherUserInfo.userThumbnail || ''
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: '',
      isActive: true,
      unreadCount: {
        [currentUser.uid]: 0,
        [otherUserId]: 0
      }
    };
    
    const threadRef = await db.collection('chat_threads').add(threadData);
    
    return {
      success: true,
      threadId: threadRef.id,
      thread: threadData,
      isNew: true
    };
    
  } catch (error) {
    console.error('❌ Error creating chat thread:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Send a message in a chat thread
 * @param {string} threadId - Chat thread ID
 * @param {string} content - Message content
 * @param {string} recipientId - Optional recipient UID to avoid extra thread read
 * @returns {Promise<Object>} - Result object
 */
async function sendMessage(threadId, content, recipientId = '') {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const textValidation = validateAllowedTextChars([
    { label: 'Message', value: content || '' }
  ]);
  if (!textValidation.valid) {
    return { success: false, message: textValidation.message };
  }
  
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to send messages' };
  }
  
  if (!db) {
    return { success: false, message: 'Messaging backend unavailable' };
  }
  
  try {
    // Create message
    const senderName = await getFreshOwnDisplayName(currentUser, currentUser.displayName || 'Anonymous');
    const message = {
      threadId: threadId,
      senderId: currentUser.uid,
      senderName: senderName,
      senderAvatar: currentUser.photoURL || '',
      content: content,
      messageType: 'text',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    
    const msgRef = await db.collection('chat_messages').add(message);

    let otherUserId = String(recipientId || '').trim();
    if (!otherUserId || otherUserId === currentUser.uid) {
      // Fallback for legacy callers that do not provide recipientId.
      const threadDoc = await db.collection('chat_threads').doc(threadId).get();
      const threadData = threadDoc.data();
      otherUserId = Array.isArray(threadData?.participantIds)
        ? threadData.participantIds.find((id) => id !== currentUser.uid) || ''
        : '';
    }
    
    // Update thread metadata
    const threadUpdates = {
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: content.substring(0, 100)
    };
    if (otherUserId) {
      threadUpdates[`unreadCount.${otherUserId}`] = firebase.firestore.FieldValue.increment(1);
    }
    await db.collection('chat_threads').doc(threadId).update(threadUpdates);
    
    return {
      success: true,
      messageId: msgRef.id,
      message: 'Message sent'
    };
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return { success: false, message: error.message };
  }
}

async function resolveOtherUserIdForThread(db, threadId, currentUserId, recipientId = '') {
  let otherUserId = String(recipientId || '').trim();
  if (otherUserId && otherUserId !== currentUserId) return otherUserId;

  const threadDoc = await db.collection('chat_threads').doc(threadId).get();
  const threadData = threadDoc.data();
  return Array.isArray(threadData?.participantIds)
    ? threadData.participantIds.find((id) => id !== currentUserId) || ''
    : '';
}

/**
 * Send an image message in a chat thread.
 * @param {string} threadId - Chat thread ID
 * @param {Object} imagePayload - Uploaded image metadata/URLs
 * @param {string} recipientId - Optional recipient UID to avoid extra thread read
 * @returns {Promise<Object>} - Result object
 */
async function sendImageMessage(threadId, imagePayload, recipientId = '') {
  const db = getFirestore();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return { success: false, message: 'You must be logged in to send images' };
  }

  if (!db) {
    return { success: false, message: 'Messaging backend unavailable for image send' };
  }

  const thumbnailUrl = String(imagePayload?.thumbnailUrl || '').trim();
  const fullSizeUrl = String(imagePayload?.fullSizeUrl || '').trim();
  if (!thumbnailUrl || !fullSizeUrl) {
    return { success: false, message: 'Image upload failed (missing URLs)' };
  }

  try {
    const senderName = await getFreshOwnDisplayName(currentUser, currentUser.displayName || 'Anonymous');
    const message = {
      threadId: threadId,
      senderId: currentUser.uid,
      senderName: senderName,
      senderAvatar: currentUser.photoURL || '',
      content: '[image]',
      messageType: 'image',
      thumbnailUrl: thumbnailUrl,
      fullSizeUrl: fullSizeUrl,
      dimensions: String(imagePayload?.dimensions || ''),
      aspectRatio: Number(imagePayload?.aspectRatio) || 0,
      fileSizes: {
        thumbnail: Number(imagePayload?.fileSizes?.thumbnail) || 0,
        fullSize: Number(imagePayload?.fileSizes?.fullSize) || 0
      },
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    };

    const msgRef = await db.collection('chat_messages').add(message);
    const otherUserId = await resolveOtherUserIdForThread(db, threadId, currentUser.uid, recipientId);
    const threadUpdates = {
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: '[Photo]'
    };
    if (otherUserId) {
      threadUpdates[`unreadCount.${otherUserId}`] = firebase.firestore.FieldValue.increment(1);
    }
    await db.collection('chat_threads').doc(threadId).update(threadUpdates);

    return {
      success: true,
      messageId: msgRef.id,
      message: 'Image sent'
    };
  } catch (error) {
    console.error('❌ Error sending image message:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Mark a chat thread as read for current user.
 * This clears unread badge state for the current participant only.
 * @param {string} threadId - Chat thread ID
 * @returns {Promise<Object>} - Result object
 */
async function markChatThreadRead(threadId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return { success: false, message: 'You must be logged in to update thread read state' };
  }

  if (!db) {
    return { success: false, message: 'Messaging backend unavailable' };
  }

  try {
    await db.collection('chat_threads').doc(threadId).update({
      [`unreadCount.${currentUser.uid}`]: 0
    });
    return { success: true, message: 'Thread marked as read' };
  } catch (error) {
    console.error('❌ Error marking thread as read:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Check whether current user already acknowledged Gig Tips for a thread.
 * @param {string} threadId - Chat thread ID
 * @returns {Promise<boolean>}
 */
async function hasGigTipsAcknowledgementForThread(threadId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeThreadId = String(threadId || '').trim();
  if (!currentUser || !safeThreadId) return false;

  if (!db) return false;

  try {
    const threadDoc = await db.collection('chat_threads').doc(safeThreadId).get();
    if (!threadDoc.exists) return false;
    const data = threadDoc.data() || {};
    const ackMap = data.gigTipsAcknowledged && typeof data.gigTipsAcknowledged === 'object'
      ? data.gigTipsAcknowledged
      : {};
    return ackMap[currentUser.uid] === true;
  } catch (error) {
    console.warn('⚠️ Gig Tips acknowledgement read failed:', error);
    return false;
  }
}

/**
 * Persist Gig Tips acknowledgement for current user in a thread.
 * @param {string} threadId - Chat thread ID
 * @returns {Promise<Object>} - Result object
 */
async function acknowledgeGigTipsForThread(threadId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeThreadId = String(threadId || '').trim();
  if (!currentUser) {
    return { success: false, message: 'Authentication required' };
  }
  if (!safeThreadId) {
    return { success: false, message: 'Missing thread id' };
  }

  if (!db) {
    return { success: false, message: 'Messaging backend unavailable' };
  }

  try {
    await db.collection('chat_threads').doc(safeThreadId).update({
      [`gigTipsAcknowledged.${currentUser.uid}`]: true,
      [`gigTipsAcknowledgedAt.${currentUser.uid}`]: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, message: 'Gig Tips acknowledgement saved' };
  } catch (error) {
    console.error('❌ Error saving Gig Tips acknowledgement:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get messages for a thread
 * @param {string} threadId - Chat thread ID
 * @param {number} limit - Max messages to retrieve
 * @returns {Promise<Array>} - Array of messages
 */
async function getThreadMessages(threadId, limit = 50) {
  const db = getFirestore();
  
  if (!db) {
    return [];
  }
  
  try {
    const snapshot = await db.collection('chat_messages')
      .where('threadId', '==', threadId)
      .orderBy('timestamp', 'asc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    return [];
  }
}

/**
 * Get user's chat threads
 * @returns {Promise<Array>} - Array of chat threads
 */
async function getUserChatThreads() {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return [];
  }
  
  if (!db) {
    return [];
  }
  
  try {
    const snapshot = await db.collection('chat_threads')
      .where('participantIds', 'array-contains', currentUser.uid)
      .where('isActive', '==', true)
      .orderBy('lastMessageTime', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter((thread) => shouldShowThreadForUser(thread, currentUser.uid));
    
  } catch (error) {
    console.error('❌ Error getting chat threads:', error);
    return [];
  }
}

function shouldShowThreadForUser(thread, currentUserId) {
  const safeUid = String(currentUserId || '').trim();
  if (!safeUid) return true;
  const deletedMap = thread && thread.deletedFor && typeof thread.deletedFor === 'object'
    ? thread.deletedFor
    : null;
  const deletedAtRaw = deletedMap ? deletedMap[safeUid] : null;
  if (!deletedAtRaw) return true;

  const deletedAtMs = toComparableMillis(deletedAtRaw);
  if (deletedAtMs <= 0) return false;
  const lastActivityMs = Math.max(
    toComparableMillis(thread?.lastMessageTime),
    toComparableMillis(thread?.createdAt)
  );
  return lastActivityMs > deletedAtMs;
}

/**
 * Soft-delete a chat thread for the current user only.
 * Other participants keep their thread intact.
 * @param {string} threadId - Chat thread ID
 * @returns {Promise<Object>} - Result object
 */
async function deleteChatThreadForCurrentUser(threadId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeThreadId = String(threadId || '').trim();

  if (!safeThreadId) {
    return { success: false, message: 'Missing thread id' };
  }
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to delete chat' };
  }

  if (!db) {
    return { success: false, message: 'Messaging backend unavailable' };
  }

  try {
    await db.collection('chat_threads').doc(safeThreadId).update({
      [`deletedFor.${currentUser.uid}`]: firebase.firestore.FieldValue.serverTimestamp(),
      [`unreadCount.${currentUser.uid}`]: 0
    });
    return { success: true, message: 'Conversation deleted for current user' };
  } catch (error) {
    console.error('❌ Error deleting conversation for current user:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// NOTIFICATIONS COLLECTION
// ============================================================================
const APPLICATION_CLOSURE_BATCH_WINDOW_MS = 6 * 60 * 60 * 1000;

// Unified "application slots reopened" type. Every closure reason (declined, not selected,
// withdrawn, etc.) funnels into ONE batched card so the worker sees a single positive count
// of how many slots reopened — never a rejection tally. Reason-neutral by design.
const SLOTS_REOPENED_NOTIFICATION_TYPE = 'application_slots_reopened_batch';

function buildSlotsReopenedMessage(count) {
  const safeCount = Math.max(1, Number(count) || 1);
  return safeCount === 1
    ? '1 application slot just opened — find your next gig!'
    : `${safeCount} application slots just opened — find your next gigs!`;
}

function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value.toMillis) return value.toMillis();
  if (value.toDate) return value.toDate().getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeNotificationCounters(rawCounters = null) {
  const source = rawCounters && typeof rawCounters === 'object' ? rawCounters : {};
  return {
    workerUnread: Math.max(0, Number(source.workerUnread) || 0),
    customerUnread: Math.max(0, Number(source.customerUnread) || 0),
    totalUnread: Math.max(0, Number(source.totalUnread) || 0)
  };
}

const WORKER_NOTIFICATION_COUNTER_TYPES = new Set([
  'offer_sent',
  'job_completed',
  'feedback_received',
  'contract_voided',
  'interview_request',
  'application_not_selected_batch',
  'application_rejected_batch',
  'application_slots_reopened_batch'
]);

const CUSTOMER_NOTIFICATION_COUNTER_TYPES = new Set([
  'offer_accepted',
  'application_received',
  'application_milestone',
  'gig_auto_paused',
  'gig_review_needed',
  'offer_rejected',
  'worker_resigned',
  'worker_feedback_received',
  'worker_banned_gig_reopened'
]);

function classifyUnreadNotificationRole(notification = null) {
  if (!notification || typeof notification !== 'object') return '';
  const explicitRole = String(notification.role || '').toLowerCase();
  if (explicitRole === 'worker' || explicitRole === 'customer') {
    return explicitRole;
  }
  const type = String(notification.type || '').toLowerCase();
  if (WORKER_NOTIFICATION_COUNTER_TYPES.has(type)) return 'worker';
  if (CUSTOMER_NOTIFICATION_COUNTER_TYPES.has(type)) return 'customer';
  return '';
}

function buildUnreadCountersFromNotifications(notifications = []) {
  const counters = {
    workerUnread: 0,
    customerUnread: 0,
    totalUnread: 0
  };
  if (!Array.isArray(notifications)) {
    return counters;
  }
  notifications.forEach((notification) => {
    counters.totalUnread += 1;
    const role = classifyUnreadNotificationRole(notification);
    if (role === 'worker') counters.workerUnread += 1;
    if (role === 'customer') counters.customerUnread += 1;
  });
  return counters;
}

async function createGroupedApplicationClosureNotification(recipientId, options = {}) {
  const db = getFirestore();
  // Reason (manual_reject / not_selected) is intentionally ignored for the card type now —
  // all closures share ONE reason-neutral "slots reopened" card. options.outcomeType is still
  // accepted for backward compatibility with callers but no longer changes the message.
  const notificationType = SLOTS_REOPENED_NOTIFICATION_TYPE;
  const nowMs = Date.now();
  const windowEndsAt = new Date(nowMs + APPLICATION_CLOSURE_BATCH_WINDOW_MS);
  const jobId = String(options.jobId || '').trim();
  const jobTitle = String(options.jobTitle || '').trim() || 'Gig';

  if (!db) {
    return { success: false, message: 'Notification backend unavailable' };
  }

  try {
    const batchSnapshot = await db.collection('notifications')
      .where('recipientId', '==', recipientId)
      .where('type', '==', notificationType)
      .where('read', '==', false)
      .get();

    const activeBatchDoc = batchSnapshot.docs.find((doc) => {
      const data = doc.data() || {};
      return toMillis(data.batchWindowEndsAt) > nowMs;
    });

    if (activeBatchDoc) {
      const data = activeBatchDoc.data() || {};
      const existingTitles = Array.isArray(data.jobTitles) ? data.jobTitles : [];
      const existingIds = Array.isArray(data.jobIds) ? data.jobIds : [];
      if (jobId && !existingIds.includes(jobId)) existingIds.push(jobId);
      if (jobTitle && !existingTitles.includes(jobTitle)) existingTitles.push(jobTitle);
      const closureCount = Math.max(1, Number(data.closureCount || 0) + 1);

      await activeBatchDoc.ref.update({
        closureCount,
        message: buildSlotsReopenedMessage(closureCount),
        jobId: jobId || data.jobId || '',
        jobTitle: jobTitle || data.jobTitle || '',
        jobIds: existingIds.slice(0, 25),
        jobTitles: existingTitles.slice(0, 25),
        batchWindowEndsAt: firebase.firestore.Timestamp.fromDate(windowEndsAt),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return { success: true, notificationId: activeBatchDoc.id, grouped: true };
    }

    const nowTs = firebase.firestore.Timestamp.now();
    const notification = {
      recipientId: recipientId,
      type: notificationType,
      role: 'worker',
      jobId: jobId,
      jobTitle: jobTitle,
      message: buildSlotsReopenedMessage(1),
      // Client timestamp so orderBy listeners see the doc immediately (serverTimestamp can lag).
      createdAt: nowTs,
      updatedAt: nowTs,
      batchWindowEndsAt: firebase.firestore.Timestamp.fromDate(windowEndsAt),
      read: false,
      actionRequired: false,
      closureCount: 1,
      jobIds: jobId ? [jobId] : [],
      jobTitles: jobTitle ? [jobTitle] : []
    };

    const notifRef = await db.collection('notifications').add(notification);
    return { success: true, notificationId: notifRef.id, grouped: false };
  } catch (error) {
    console.error('❌ Error creating grouped application closure notification:', error);
    return { success: false, message: error.message };
  }
}

function getGisugoFunctions() {
  if (typeof firebase === 'undefined' || typeof firebase.app !== 'function') return null;
  const app = firebase.app();
  if (!app.functions) return null;
  return app.functions('asia-southeast1');
}

async function callCreateUserAlert(payload) {
  const fns = getGisugoFunctions();
  if (!fns) {
    console.error('❌ createUserAlert: Functions SDK unavailable');
    return { success: false, message: 'Functions SDK unavailable' };
  }
  const callable = fns.httpsCallable('createUserAlert');
  const response = await callable(payload || {});
  const data = (response && response.data) ? response.data : { success: true };
  if (data && data.success === false) {
    console.error('❌ createUserAlert failed:', data);
  }
  return data;
}

async function callWorkerAcceptRejectOthers(jobId, options = {}) {
  const fns = getGisugoFunctions();
  if (!fns) {
    return { success: false, message: 'Functions SDK unavailable' };
  }
  const callable = fns.httpsCallable('workerAcceptRejectOthers');
  const response = await callable({
    jobId: String(jobId || '').trim(),
    dryRun: options.dryRun === true
  });
  return (response && response.data) ? response.data : { success: true };
}

/**
 * Create a notification
 * @param {string} recipientId - User ID to receive notification
 * @param {Object} notificationData - Notification content
 * @returns {Promise<Object>} - Result object
 */
async function createNotification(recipientId, notificationData) {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Notification backend unavailable' };
  }
  
  try {
    const type = String(notificationData.type || '').trim();
    const jobId = String(notificationData.jobId || '').trim();
    const dedupeKey = String(notificationData.dedupeKey || '').trim();
    const explicitRole = String(notificationData.role || '').toLowerCase();
    const inferredRole = classifyUnreadNotificationRole({ type, role: explicitRole });
    const notification = {
      recipientId: recipientId,
      type: type,
      role: explicitRole === 'worker' || explicitRole === 'customer' ? explicitRole : (inferredRole || ''),
      jobId: jobId,
      jobTitle: notificationData.jobTitle || '',
      message: notificationData.message,
      // Client timestamp so unread-counter / alerts orderBy listeners include the doc
      // immediately. serverTimestamp() often leaves createdAt null until the server round-trip,
      // which made menu badges feel instant sometimes and delayed other times.
      createdAt: firebase.firestore.Timestamp.now(),
      read: false,
      actionRequired: notificationData.actionRequired || false,
      dedupeKey: dedupeKey || null
    };
    const extraTitle = String(notificationData.title || '').trim();
    const extraSupportRequestId = String(notificationData.supportRequestId || '').trim();
    const extraLink = String(notificationData.link || '').trim();
    if (extraTitle) notification.title = extraTitle;
    if (extraSupportRequestId) notification.supportRequestId = extraSupportRequestId;
    if (extraLink) notification.link = extraLink;

    let notifRef;
    if (dedupeKey) {
      const rawKey = `${recipientId}::${type}::${jobId}::${dedupeKey}`;
      const safeKey = encodeURIComponent(rawKey).slice(0, 1400);
      notifRef = db.collection('notifications').doc(`dedupe_${safeKey}`);
      const existing = await notifRef.get();
      if (existing.exists) {
        return {
          success: true,
          notificationId: existing.id,
          deduped: true
        };
      }
      await notifRef.set(notification, { merge: false });
    } else {
      notifRef = await db.collection('notifications').add(notification);
    }
    
    return {
      success: true,
      notificationId: notifRef.id
    };
    
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return { success: false, message: error.message };
  }
}

function buildGigReportDocumentId(jobId, reporterId) {
  const safeJob = String(jobId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeReporter = String(reporterId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  return `gig_${safeJob}__reporter_${safeReporter}`.slice(0, 240);
}

/**
 * Submit a gig report for admin review.
 * One report per job per reporter is allowed.
 * @param {string} jobId - Reported job ID
 * @param {Object} reportData - subject/message and optional metadata
 * @returns {Promise<Object>} - Result object
 */
async function submitGigReportToAdmin(jobId, reportData = {}) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();
  const subject = String(reportData.subject || '').trim();
  const message = String(reportData.message || '').trim();
  const textValidation = validateAllowedTextChars([
    { label: 'Report subject', value: subject },
    { label: 'Report message', value: message }
  ]);

  if (!safeJobId) {
    return { success: false, message: 'Missing job reference for report' };
  }
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to submit a report' };
  }
  if (!subject) {
    return { success: false, message: 'Please select a report subject' };
  }
  if (!message) {
    return { success: false, message: 'Please provide report details' };
  }
  if (!textValidation.valid) {
    return { success: false, message: textValidation.message };
  }
  if (!db) {
    return { success: false, message: 'Reporting backend unavailable' };
  }

  const reportId = buildGigReportDocumentId(safeJobId, currentUser.uid);
  const reportRef = db.collection('gig_reports').doc(reportId);
  const reporterName = await getFreshOwnDisplayName(currentUser, currentUser.displayName || 'Anonymous');
  const payload = {
    reportId: reportId,
    jobId: safeJobId,
    jobTitle: String(reportData.jobTitle || '').trim(),
    jobCategory: String(reportData.jobCategory || '').trim(),
    posterId: String(reportData.posterId || '').trim(),
    reporterId: currentUser.uid,
    reporterName: reporterName,
    reporterAvatar: currentUser.photoURL || '',
    reasonKey: String(reportData.reasonKey || '').trim(),
    subject: subject,
    message: message,
    status: 'pending',
    source: 'gig_page',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(reportRef);
      if (existing.exists) {
        const duplicateError = new Error('Gig report already exists');
        duplicateError.code = 'already-exists';
        throw duplicateError;
      }
      transaction.set(reportRef, payload);
    });
    return {
      success: true,
      reportId: reportId,
      message: 'Gig report submitted'
    };
  } catch (error) {
    const code = String(error?.code || '');
    if (code.includes('already-exists')) {
      return {
        success: false,
        code: 'already-reported',
        message: 'You already submitted a report for this gig.'
      };
    }
    console.error('❌ Error submitting gig report:', error);
    return { success: false, message: error.message || 'Failed to submit gig report' };
  }
}

/**
 * Check if current user already submitted a report for a gig.
 * @param {string} jobId - Reported job ID
 * @returns {Promise<boolean>}
 */
async function hasSubmittedGigReport(jobId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeJobId = String(jobId || '').trim();
  if (!db || !currentUser || !safeJobId) return false;

  try {
    const reportId = buildGigReportDocumentId(safeJobId, currentUser.uid);
    const reportDoc = await db.collection('gig_reports').doc(reportId).get();
    return reportDoc.exists;
  } catch (error) {
    console.warn('⚠️ Gig report duplicate-check lookup failed:', error);
    return false;
  }
}

/**
 * Get user's notifications
 * @param {boolean} unreadOnly - Only return unread notifications
 * @returns {Promise<Array>} - Array of notifications
 */
async function getUserNotifications(unreadOnly = false) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return [];
  }
  
  if (!db) {
    return [];
  }
  
  try {
    let query = db.collection('notifications')
      .where('recipientId', '==', currentUser.uid);
    
    if (unreadOnly) {
      query = query.where('read', '==', false);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return [];
  }
}

/**
 * Get a page of user notifications for infinite scroll loading.
 * @param {Object} options
 * @param {boolean} options.unreadOnly - Only return unread notifications
 * @param {number} options.limit - Page size
 * @param {*} options.startAfterCreatedAt - Cursor (createdAt of last loaded item)
 * @returns {Promise<{notifications:Array,nextCursor:*,hasMore:boolean}>}
 */
async function getUserNotificationsPage(options = {}) {
  const {
    unreadOnly = false,
    limit = 25,
    startAfterCreatedAt = null
  } = options || {};
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
  const db = getFirestore();
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return { notifications: [], nextCursor: null, hasMore: false };
  }

  if (!db) {
    return {
      notifications: [],
      nextCursor: null,
      hasMore: false
    };
  }

  try {
    let query = db.collection('notifications')
      .where('recipientId', '==', currentUser.uid);

    if (unreadOnly) {
      query = query.where('read', '==', false);
    }

    query = query.orderBy('createdAt', 'desc').limit(safeLimit);

    if (startAfterCreatedAt) {
      query = query.startAfter(startAfterCreatedAt);
    }

    const snapshot = await query.get();
    const page = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));
    const nextCursor = page.length ? (page[page.length - 1].createdAt || null) : null;

    return {
      notifications: page,
      nextCursor,
      hasMore: page.length === safeLimit
    };
  } catch (error) {
    console.error('❌ Error getting notifications page:', error);
    return { notifications: [], nextCursor: null, hasMore: false };
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification document ID
 * @returns {Promise<Object>} - Result object
 */
async function markNotificationRead(notificationId) {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Notification backend unavailable' };
  }
  
  try {
    const notificationRef = db.collection('notifications').doc(notificationId);
    // Use update so stale IDs do not become denied "create" attempts under rules.
    await notificationRef.update({ read: true });
    return { success: true };
    
  } catch (error) {
    const code = String((error && error.code) || '');
    if (code === 'not-found' || code.endsWith('/not-found')) {
      // Stale pending read entry for a notification that no longer exists.
      return { success: true, skipped: 'not-found' };
    }
    console.error('❌ Error marking notification read:', error);
    return { success: false };
  }
}

/**
 * Delete notification for current user.
 * No fallback path: this is delete-or-fail by policy.
 * @param {string} notificationId - Notification document ID
 * @returns {Promise<Object>} - Result object
 */
async function deleteNotification(notificationId) {
  const safeNotificationId = String(notificationId || '').trim();
  if (!safeNotificationId) {
    return { success: false, message: 'Missing notification ID' };
  }

  const currentUser = getCurrentUser();
  if (!currentUser || !currentUser.uid) {
    return { success: false, message: 'User not authenticated' };
  }

  const db = getFirestore();

  if (!db) {
    return { success: false, message: 'Delete unavailable: Firestore not ready' };
  }

  try {
    const notificationRef = db.collection('notifications').doc(safeNotificationId);
    await notificationRef.delete();
    return { success: true, mode: 'hard-delete' };
  } catch (error) {
    const code = String(error?.code || '');
    if (code === 'not-found' || code.endsWith('/not-found')) {
      return { success: true, skipped: 'not-found' };
    }
    console.error('❌ Error deleting notification:', error);
    return { success: false, message: error.message || 'Failed to delete notification' };
  }
}

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

/**
 * Subscribe to user's notifications with real-time updates
 * @param {Object} currentUser - Firebase auth user object
 * @param {Function} callback - Function to call with updated notifications
 * @returns {Function} - Unsubscribe function
 */
function subscribeToUserNotifications(currentUser, callback) {
  const db = getFirestore();
  
  if (!db || !currentUser) {
    console.warn('⚠️ Firebase not available or user not logged in for notifications listener');
    return null;
  }
  
  console.log('👂 Starting real-time listener for notifications');
  emitIOSDataTrace('messages:alerts', 'fetch:start', {
    userId: currentUser && currentUser.uid ? currentUser.uid : ''
  });
  
  try {
    if (isIOSWebKitBrowserForDataPath()) {
      emitIOSDataTrace('messages:alerts', 'fetch:mode', 'REST_POLL');
      let disposed = false;
      let inFlight = false;
      let pollTimer = null;

      const pollOnce = async () => {
        if (disposed || inFlight) return;
        inFlight = true;
        try {
          const notifications = await withFirestoreReadTimeout(
            fetchNotificationsViaFirestoreRest(currentUser.uid, 50),
            10000
          );
          emitIOSDataTrace('messages:alerts', 'fetch:done', {
            count: Array.isArray(notifications) ? notifications.length : 0,
            mode: 'REST_POLL'
          });
          if (!disposed) {
            callback(Array.isArray(notifications) ? notifications : [], {
              fromCache: false,
              hasPendingWrites: false,
              source: 'rest-poll'
            });
          }
        } catch (error) {
          console.error('❌ Notifications REST poll error:', error);
          const message = (error && error.message) ? error.message : String(error);
          const stage = /timed out/i.test(message) ? 'fetch:timeout' : 'fetch:error';
          emitIOSDataTrace('messages:alerts', stage, message);
          if (!disposed) {
            callback([], {
              error: true,
              fromCache: false,
              hasPendingWrites: false,
              source: 'rest-poll'
            });
          }
        } finally {
          inFlight = false;
        }
      };

      pollOnce();
      pollTimer = setInterval(pollOnce, 12000);
      return () => {
        disposed = true;
        if (pollTimer) clearInterval(pollTimer);
      };
    }
    emitIOSDataTrace('messages:alerts', 'fetch:mode', 'SDK_SNAPSHOT');

    const unsubscribe = db.collection('notifications')
      .where('recipientId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          emitIOSDataTrace('messages:alerts', 'fetch:done', {
            count: notifications.length,
            mode: 'SDK_SNAPSHOT',
            fromCache: snapshot && snapshot.metadata ? snapshot.metadata.fromCache === true : false
          });
          console.log(`🔔 Notifications updated: ${notifications.length} items`);
          callback(notifications, {
            fromCache: snapshot && snapshot.metadata ? snapshot.metadata.fromCache === true : false,
            hasPendingWrites: snapshot && snapshot.metadata ? snapshot.metadata.hasPendingWrites === true : false
          });
        },
        (error) => {
          console.error('❌ Notifications listener error:', error);
          const message = (error && error.message) ? error.message : String(error);
          const stage = /timed out/i.test(message) ? 'fetch:timeout' : 'fetch:error';
          emitIOSDataTrace('messages:alerts', stage, message);
          callback([], {
            error: true,
            fromCache: false,
            hasPendingWrites: false
          });
        }
      );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up notifications listener:', error);
    return null;
  }
}

function subscribeToUnreadNotificationCounters(currentUser, callback) {
  const db = getFirestore();

  if (!db || !currentUser || !currentUser.uid) {
    if (typeof callback === 'function') callback(sanitizeNotificationCounters(null));
    return null;
  }

  try {
    // No orderBy('createdAt'): ordered queries can omit docs while serverTimestamp is still
    // null, which delayed header/menu badges until navigate/refetch. Counts only need unread set.
    return db.collection('notifications')
      .where('recipientId', '==', currentUser.uid)
      .where('read', '==', false)
      .limit(200)
      .onSnapshot(
      (snap) => {
        const unreadNotifications = snap && Array.isArray(snap.docs)
          ? snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          : [];
        const counters = sanitizeNotificationCounters(buildUnreadCountersFromNotifications(unreadNotifications));
        if (typeof callback === 'function') callback(counters);
      },
      (error) => {
        console.warn('⚠️ Notification counters listener error:', error);
        if (typeof callback === 'function') callback(sanitizeNotificationCounters(null));
      });
  } catch (error) {
    console.error('❌ Error setting up notification counters listener:', error);
    if (typeof callback === 'function') callback(sanitizeNotificationCounters(null));
    return null;
  }
}

/**
 * Subscribe to user's chat threads with real-time updates
 * @param {Object} currentUser - Firebase auth user object
 * @param {Function} callback - Function to call with updated threads
 * @returns {Function} - Unsubscribe function
 */
function subscribeToUserThreads(currentUser, callback) {
  const db = getFirestore();
  
  if (!db || !currentUser) {
    console.warn('⚠️ Firebase not available or user not logged in for threads listener');
    return null;
  }
  
  const seen = {
    signature: ''
  };
  
  try {
    const unsubscribe = db.collection('chat_threads')
      .where('participantIds', 'array-contains', currentUser.uid)
      .where('isActive', '==', true)
      .orderBy('lastMessageTime', 'desc')
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const threads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).filter((thread) => shouldShowThreadForUser(thread, currentUser.uid));
          const signature = threads.map((thread) => `${thread.id}|${JSON.stringify(thread)}`).join('||');
          if (signature === seen.signature) {
            return;
          }
          seen.signature = signature;
          callback(threads);
        },
        (error) => {
          console.error('❌ Threads listener error:', error);
          callback([]);
        }
      );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up threads listener:', error);
    return null;
  }
}

/**
 * Subscribe to messages in a specific thread with real-time updates
 * @param {string} threadId - Thread document ID
 * @param {Function} callback - Function to call with updated messages
 * @returns {Function} - Unsubscribe function
 */
function subscribeToThreadMessages(threadId, callback) {
  const db = getFirestore();
  
  if (!db) {
    console.warn('⚠️ Firebase not available for messages listener');
    return null;
  }
  
  const seen = {
    signature: ''
  };
  
  try {
    const unsubscribe = db.collection('chat_messages')
      .where('threadId', '==', threadId)
      .orderBy('timestamp', 'asc')
      .limit(100)
      .onSnapshot(
        (snapshot) => {
          const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          const signature = messages.map((message) => `${message.id}|${JSON.stringify(message)}`).join('||');
          if (signature === seen.signature) {
            return;
          }
          seen.signature = signature;
          callback(messages);
        },
        (error) => {
          console.error(`❌ Messages listener error for thread ${threadId}:`, error);
          callback([]);
        }
      );
    
    return unsubscribe;
  } catch (error) {
    console.error('❌ Error setting up messages listener:', error);
    return null;
  }
}

// ============================================================================
// ADMIN ANALYTICS
// ============================================================================

/**
 * Get admin analytics data
 * @returns {Promise<Object>} - Analytics data
 */
async function getAdminAnalytics() {
  const db = getFirestore();
  
  if (!db) {
    return {
      totalUsers: 0,
      verificationSubmissions: 0,
      monthlyRevenue: 0,
      reportedGigs: 0
    };
  }
  
  // Verification submissions and revenue have no live data source yet
  // (no verification-review pipeline, no payments/transactions collection),
  // so they're not fetched here. Total users and reported gigs are real,
  // permitted Firestore reads and are fetched independently of each other
  // so a problem with one can never zero out the other.
  const [usersResult, jobsResult] = await Promise.allSettled([
      db.collection('users').get(),
      db.collection('jobs').where('status', '==', 'reported').get()
    ]);
    
  if (usersResult.status === 'rejected') {
    console.error('❌ Error getting total users count:', usersResult.reason);
  }
  if (jobsResult.status === 'rejected') {
    console.error('❌ Error getting reported gigs count:', jobsResult.reason);
  }

  return {
    totalUsers: usersResult.status === 'fulfilled' ? usersResult.value.size : 0,
    verificationSubmissions: 0,
    monthlyRevenue: 0,
    reportedGigs: jobsResult.status === 'fulfilled' ? jobsResult.value.size : 0
  };
}

// ============================================================================
// GIG MODERATION (Admin Dashboard Phase 2)
// ============================================================================
// Posted is a "glance" tool (refresh + optional Load More, no gap-guarantee,
// no live listener). Reported/Suspended are small always-current queues —
// no pagination needed at V1 scale. See docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md
// "Gig Moderation — resolved design" for the full reasoning.
const GIG_MODERATION_POSTED_PAGE_SIZE = 20;

async function getGigModerationPosted(startAfterDoc = null) {
  const db = getFirestore();
  if (!db) return { jobs: [], lastDoc: null, hasMore: false };
  try {
    let query = db.collection('jobs')
      .where('status', '==', 'active')
      .orderBy('datePosted', 'desc')
      .limit(GIG_MODERATION_POSTED_PAGE_SIZE);
    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }
    const snap = await query.get();
    return {
      jobs: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === GIG_MODERATION_POSTED_PAGE_SIZE
    };
  } catch (error) {
    console.error('❌ Error loading Posted gigs (admin):', error);
    return { jobs: [], lastDoc: null, hasMore: false };
  }
}

async function getGigModerationReported() {
  const db = getFirestore();
  if (!db) return [];
  try {
    const snap = await db.collection('jobs')
      .where('status', '==', 'reported')
      .orderBy('datePosted', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  } catch (error) {
    console.error('❌ Error loading Reported gigs (admin):', error);
    return [];
  }
}

async function getGigModerationSuspended() {
  const db = getFirestore();
  if (!db) return [];
  try {
    const snap = await db.collection('jobs')
      .where('status', '==', 'suspended')
      .orderBy('datePosted', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  } catch (error) {
    console.error('❌ Error loading Suspended gigs (admin):', error);
    return [];
  }
}

/**
 * Prefix-match title search across ALL gigs regardless of status, so an
 * admin can act on something they personally spotted live on the site, not
 * just gigs already caught by the Reported queue. Cheap at any scale —
 * Firestore charges for matches returned, not collection size. Limitation:
 * matches from the start of the title only (not fuzzy/contains).
 */
async function searchGigsByTitlePrefix(prefix) {
  const db = getFirestore();
  const safePrefix = String(prefix || '').trim();
  if (!db || !safePrefix) return [];
  try {
    const snap = await db.collection('jobs')
      .orderBy('title')
      .startAt(safePrefix)
      .endAt(safePrefix + '\uf8ff')
      .limit(30)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  } catch (error) {
    console.error('❌ Error searching gigs by title (admin):', error);
    return [];
  }
}

/**
 * Live per-gig report list for the moderation detail panel's "Reported By"
 * section — fetched on demand (only when an admin opens a specific gig),
 * not stored/duplicated as a shadow array on the job doc itself. gig_reports
 * already has admin read access in firestore.rules.
 */
async function getGigReportsForJob(jobId) {
  const db = getFirestore();
  const safeJobId = String(jobId || '').trim();
  if (!db || !safeJobId) return [];
  try {
    const snap = await db.collection('gig_reports')
      .where('jobId', '==', safeJobId)
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('❌ Error loading gig reports (admin):', error);
    return [];
  }
}

/**
 * Suspend / reinstate / ignore a gig via the adminModerateGig callable
 * Cloud Function — the ONLY write path for these transitions, since
 * firestore.rules gives no client (including admin) a direct write to
 * jobs.status for this. See functions/index.js.
 * @param {string} jobId
 * @param {'suspend'|'reinstate'|'ignore'} action
 * @param {string} [reason]
 * @returns {Promise<{success:boolean,status?:string,message?:string}>}
 */
async function callAdminModerateGig(jobId, action, reason = '') {
  try {
    const callable = firebase.app().functions('asia-southeast1').httpsCallable('adminModerateGig');
    const response = await callable({ jobId, action, reason });
    return { success: true, status: response?.data?.status };
  } catch (error) {
    console.error('❌ adminModerateGig call failed:', error);
    return { success: false, message: error.message || 'Action failed' };
  }
}

window.getGigModerationPosted = getGigModerationPosted;
window.getGigModerationReported = getGigModerationReported;
window.getGigModerationSuspended = getGigModerationSuspended;
window.searchGigsByTitlePrefix = searchGigsByTitlePrefix;
window.getGigReportsForJob = getGigReportsForJob;
window.callAdminModerateGig = callAdminModerateGig;

// ============================================================================
// USER MANAGEMENT (Admin Dashboard Phase 3)
// ============================================================================
// New is a "glance" tool (refresh + optional Load More, no gap-guarantee,
// no live listener) — same treatment as Gig Moderation's Posted tab.
// Suspended is a small always-current queue. Pending/Verified are NOT
// queried at all — that tier (ID-verification submissions) isn't built yet,
// see docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md "User Management —
// resolved design".
const USER_MANAGEMENT_NEW_PAGE_SIZE = 20;

/**
 * Most-recently-registered users, newest first. accountCreated is stored as
 * an ISO string (not a Firestore Timestamp) so orderBy still sorts
 * chronologically correctly. No status filter at the query level -- most
 * accounts never had a `status` field written at all (only ever set by
 * adminModerateUser on suspend), so an equality filter would silently
 * exclude everyone without it. Suspended accounts are filtered out
 * client-side instead (same "no gap-guarantee" tradeoff already accepted
 * for Gig Moderation's Posted tab).
 */
async function getUserManagementNew(startAfterDoc = null) {
  const db = getFirestore();
  if (!db) return { users: [], lastDoc: null, hasMore: false };
  try {
    let query = db.collection('users')
      .orderBy('accountCreated', 'desc')
      .limit(USER_MANAGEMENT_NEW_PAGE_SIZE);
    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }
    const snap = await query.get();
    return {
      users: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === USER_MANAGEMENT_NEW_PAGE_SIZE
    };
  } catch (error) {
    console.error('❌ Error loading New users (admin):', error);
    return { users: [], lastDoc: null, hasMore: false };
  }
}

function userModerationTimeMs(data, field) {
  const value = data && data[field];
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

async function getUserManagementSuspended() {
  const db = getFirestore();
  if (!db) return [];
  try {
    const [suspendedResult, bannedResult] = await Promise.allSettled([
      db.collection('users')
        .where('status', '==', 'suspended')
        .orderBy('suspendedAt', 'desc')
        .get(),
      // Equality-only so this works before a status+bannedAt composite
      // index is deployed. Sort client-side by bannedAt / suspendedAt.
      db.collection('users')
        .where('status', '==', 'banned')
        .get()
    ]);

    const mapDocs = (result, label) => {
      if (result.status === 'fulfilled') {
        return result.value.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
      }
      console.error(`❌ Error loading ${label} users (admin):`, result.reason);
      return [];
    };

    const merged = [
      ...mapDocs(suspendedResult, 'Suspended'),
      ...mapDocs(bannedResult, 'Banned')
    ];
    merged.sort((a, b) => {
      const aMs = Math.max(userModerationTimeMs(a.data, 'bannedAt'), userModerationTimeMs(a.data, 'suspendedAt'));
      const bMs = Math.max(userModerationTimeMs(b.data, 'bannedAt'), userModerationTimeMs(b.data, 'suspendedAt'));
      return bMs - aMs;
    });
    return merged;
  } catch (error) {
    console.error('❌ Error loading Suspended users (admin):', error);
    return [];
  }
}

/**
 * Prefix-match name search across ALL users, same "matches from the start
 * only" tradeoff as searchGigsByTitlePrefix.
 */
async function searchUsersByNamePrefix(prefix) {
  const db = getFirestore();
  const safePrefix = String(prefix || '').trim();
  if (!db || !safePrefix) return [];
  try {
    const snap = await db.collection('users')
      .orderBy('fullName')
      .startAt(safePrefix)
      .endAt(safePrefix + '\uf8ff')
      .limit(30)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  } catch (error) {
    console.error('❌ Error searching users by name (admin):', error);
    return [];
  }
}

/**
 * On-demand extras for the user detail panel, fetched only when an admin
 * opens a specific user (never batched across a whole list) — mirrors
 * getGigReportsForJob's "fetch on demand" pattern:
 *  - region/IP come from security_metadata (admin-only collection; the
 *    owner-safe mirror on user_private only has region, not IP)
 *  - gigsListed/applications use a plain `.get()` + `.size` (see fix note
 *    below for why, not the count() aggregation these were originally
 *    written for). One user's own gigs/applications is a small, naturally
 *    bounded set, so the extra per-document read cost here is negligible.
 *  - listedGigs is a slim map of that same jobs `.get()` (id/title/status/
 *    category/datePostedMs). No second query. Full job docs are not kept.
 *
 * FIX (2026-08-11): this originally called Firestore's count() aggregation
 * (`.where(...).count().get()`), which bills as ~1 read regardless of match
 * count -- cheaper in theory, but confirmed (by inspecting the actual
 * firebase-firestore-compat.js v10.7.0 bundle) that the COMPAT/namespaced
 * client SDK does not implement count() at all (`getCountFromServer` is
 * modular-SDK-only) -- every call silently threw a TypeError, caught by
 * Promise.allSettled, so this panel has shown 0/0 since Phase 3 shipped.
 * Swapped to a real `.get()` here instead of chasing a modular-SDK bridge
 * for two low-stakes display numbers.
 */
function listedGigPostedMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function slimListedGigFromDoc(doc) {
  const data = doc.data() || {};
  const title = String(data.title || '').trim();
    return {
    id: doc.id,
    title: title || 'Untitled gig',
    status: String(data.status || 'unknown').trim() || 'unknown',
    category: String(data.category || '').trim(),
    datePostedMs: listedGigPostedMs(data.datePosted)
  };
}

async function getUserModerationExtras(uid) {
  const db = getFirestore();
  const safeUid = String(uid || '').trim();
  const empty = { region: null, ipAddress: null, gigsListed: 0, applications: 0, listedGigs: [] };
  if (!db || !safeUid) return empty;

  const [securityResult, gigsCountResult, appsCountResult] = await Promise.allSettled([
    db.collection('security_metadata').doc(safeUid).get(),
    db.collection('jobs').where('posterId', '==', safeUid).get(),
    db.collection('applications').where('applicantId', '==', safeUid).get()
  ]);

  let region = null;
  let ipAddress = null;
  if (securityResult.status === 'fulfilled' && securityResult.value.exists) {
    const data = securityResult.value.data() || {};
    region = data.location?.region || null;
    ipAddress = data.lastSignupIp || null;
  } else if (securityResult.status === 'rejected') {
    console.error('❌ Error loading security_metadata (admin):', securityResult.reason);
  }

  const listedGigs = gigsCountResult.status === 'fulfilled'
    ? gigsCountResult.value.docs.map(slimListedGigFromDoc)
        .sort((a, b) => (b.datePostedMs || 0) - (a.datePostedMs || 0))
    : [];

  return {
    region,
    ipAddress,
    gigsListed: listedGigs.length,
    listedGigs,
    applications: appsCountResult.status === 'fulfilled' ? appsCountResult.value.size : 0
  };
}

/**
 * Suspend / reinstate / ban / unban a user via the adminModerateUser
 * callable Cloud Function — the ONLY write path for these transitions
 * (firestore.rules gives no client, including admin, a direct write to
 * users.status). See functions/index.js.
 * @param {string} userId
 * @param {'suspend'|'reinstate'|'ban'|'unban'} action
 * @param {string} [reason]
 */
async function callAdminModerateUser(userId, action, reason = '') {
  try {
    const callable = firebase.app().functions('asia-southeast1').httpsCallable('adminModerateUser');
    const response = await callable({ userId, action, reason });
    return { success: true, status: response?.data?.status };
  } catch (error) {
    console.error('❌ adminModerateUser call failed:', error);
    return { success: false, message: error.message || 'Action failed' };
  }
}

window.getUserManagementNew = getUserManagementNew;
window.getUserManagementSuspended = getUserManagementSuspended;
window.searchUsersByNamePrefix = searchUsersByNamePrefix;
window.getUserModerationExtras = getUserModerationExtras;
window.callAdminModerateUser = callAdminModerateUser;

// ============================================================================
// SUPPORT CENTER (Admin Dashboard Phase 4)
// ============================================================================
// Small paginated queue on support_requests, same cost pattern as Gig
// Moderation/User Management — no live listener on the admin side (the
// requester's OWN support.js already live-listens to just their own
// tickets, which is cheap and unrelated to this). Replies + broadcasts are
// direct client writes (no Cloud Function) because firestore.rules already
// grants isAdmin() a scoped, field-restricted update path — unlike
// jobs.status/users.status, nothing here needed a rules workaround.
const SUPPORT_QUEUE_PAGE_SIZE = 20;
const SUPPORT_THREAD_MAX_MESSAGES = 50;

/**
 * New/unanswered tickets, oldest first (FIFO — first come, first served).
 */
/**
 * FIX (2026-08-12): New = "not yet resolved" (pending OR replied), not just
 * "never touched". Previously any reply immediately moved a ticket to Old,
 * which made 'replied' and 'resolved' indistinguishable there (both just
 * "in Old") -- there was no way to tell "still needs a final close-out"
 * apart from "actually done". Now a ticket only leaves New once an admin
 * explicitly clicks Mark Resolved; replying just updates its status in
 * place (still-bold-pending vs. already-replied styling is handled by the
 * UI). Ordered most-recent-first per owner request.
 */
async function getSupportQueueNew(startAfterDoc = null) {
  const db = getFirestore();
  if (!db) return { tickets: [], lastDoc: null, hasMore: false };
  try {
    let query = db.collection('support_requests')
      .where('status', 'in', ['pending', 'replied'])
      .orderBy('createdAt', 'desc')
      .limit(SUPPORT_QUEUE_PAGE_SIZE);
    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }
    const snap = await query.get();
    return {
      tickets: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === SUPPORT_QUEUE_PAGE_SIZE
    };
  } catch (error) {
    console.error('❌ Error loading New support queue (admin):', error);
    return { tickets: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Resolved tickets only (see getSupportQueueNew for why 'replied' no longer
 * lives here), most recently touched first.
 */
async function getSupportQueueOld(startAfterDoc = null) {
  const db = getFirestore();
  if (!db) return { tickets: [], lastDoc: null, hasMore: false };
  try {
    let query = db.collection('support_requests')
      .where('status', '==', 'resolved')
      .orderBy('createdAt', 'desc')
      .limit(SUPPORT_QUEUE_PAGE_SIZE);
    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }
    const snap = await query.get();
    return {
      tickets: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === SUPPORT_QUEUE_PAGE_SIZE
    };
  } catch (error) {
    console.error('❌ Error loading Old support queue (admin):', error);
    return { tickets: [], lastDoc: null, hasMore: false };
  }
}

/**
 * Cheap-ish tab-count badges for the New/Old queue tabs.
 *
 * FIX (2026-08-11): originally used Firestore's count() aggregation
 * (`.where(...).count().get()`), which bills as ~1 read regardless of match
 * count. Confirmed (by inspecting the actual firebase-firestore-compat.js
 * v10.7.0 bundle served to the browser) that the COMPAT/namespaced client
 * SDK does not implement count() at all -- `getCountFromServer` only exists
 * in the modular SDK. Every call silently threw a TypeError, caught here by
 * Promise.allSettled, so both tab badges have shown 0 since Phase 4 shipped.
 * Swapped to a real `.get()` + `.size` -- support_requests is a small,
 * naturally bounded queue (not "every gig ever posted"), so the extra
 * per-document read cost vs. a true aggregate count is negligible.
 */
async function getSupportQueueCounts() {
  const db = getFirestore();
  const empty = { newCount: 0, oldCount: 0 };
  if (!db) return empty;
  try {
    const [newResult, oldResult] = await Promise.allSettled([
      db.collection('support_requests').where('status', 'in', ['pending', 'replied']).get(),
      db.collection('support_requests').where('status', '==', 'resolved').get()
    ]);
    return {
      newCount: newResult.status === 'fulfilled' ? newResult.value.size : 0,
      oldCount: oldResult.status === 'fulfilled' ? oldResult.value.size : 0
    };
  } catch (error) {
    console.error('❌ Error loading support queue counts (admin):', error);
    return empty;
  }
}

/**
 * Write an admin reply directly onto the ticket. Sets status to 'replied'
 * and flips isReadByRequester back to false so the requester's Support
 * inbox shows it as unread. Also writes a support_admin_message
 * notification so menu / Alerts / tray fire (Phase 8 Chapter 5).
 * @param {string} requestId
 * @param {string} replyMessage
 * @param {{url: string, thumbUrl: string}|null} [photoMeta] optional photo
 *   attached to the reply (2026-08-12: uploadSupportPhoto already returns
 *   both a full-size and thumb URL, mirroring the original ticket photo).
 */
async function replyToSupportRequest(requestId, replyMessage, photoMeta = null) {
  const db = getFirestore();
  const safeId = String(requestId || '').trim();
  const safeMessage = String(replyMessage || '').trim();
  if (!db || !safeId || !safeMessage) return { success: false, message: 'Missing ticket or reply text' };

  try {
    const admin = window.currentAdmin || {};
    const now = new Date();
    const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    const ticketRef = db.collection('support_requests').doc(safeId);
    const snap = await ticketRef.get();
    if (!snap.exists) return { success: false, message: 'Ticket not found' };

    const data = snap.data() || {};
    const thread = normalizeSupportMessages(data);
    if (thread.length >= SUPPORT_THREAD_MAX_MESSAGES) {
      return { success: false, message: 'This conversation has reached its message limit.' };
    }
    const adminEntry = {
      sender: 'admin',
      senderId: admin.uid || null,
      senderName: admin.name || 'Admin',
      message: safeMessage,
      photoUrl: photoMeta?.url || null,
      photoThumbUrl: photoMeta?.thumbUrl || null,
      createdAtISO: now.toISOString(),
      createdAtMs: now.getTime()
    };
    thread.push(adminEntry);

    await ticketRef.update({
      status: 'replied',
      lastSender: 'admin',
      messages: thread,
      // Keep the one-slot `reply` in sync so the pre-Phase-10 user inbox
      // still shows the latest admin answer until Chapter 3 swaps that UI.
      reply: {
        message: safeMessage,
        repliedBy: { adminId: admin.uid || null, adminName: admin.name || 'Admin' },
        repliedAt: serverTimestamp,
        photoUrl: photoMeta?.url || null,
        photoThumbUrl: photoMeta?.thumbUrl || null
      },
      isReadByRequester: false,
      updatedAt: serverTimestamp,
      updatedAtISO: now.toISOString(),
      updatedAtMs: now.getTime(),
      lastUpdatedAt: serverTimestamp,
      lastUpdatedAtISO: now.toISOString(),
      lastUpdatedAtMs: now.getTime()
    });
    const requesterId = String(data?.requester?.userId || data?.userId || '').trim();
    if (requesterId) {
      const ticketJobId = String(data.jobId || '').trim();
      const ticketJobTitle = String(data.jobTitle || '').trim();
      try {
        await callCreateUserAlert({
          type: 'support_admin_message',
          recipientId: requesterId,
          role: 'worker',
          jobId: ticketJobId,
          jobTitle: ticketJobTitle,
          title: 'Message from GISUGO',
          message: ticketJobTitle
            ? `GISUGO sent you a message about "${ticketJobTitle}".`
            : 'GISUGO sent you a message. Open Support to read and reply.',
          actionRequired: false,
          supportRequestId: safeId,
          link: `/support.html?ticket=${encodeURIComponent(safeId)}`
        });
      } catch (notifyError) {
        console.warn('⚠️ Support reply notification failed:', notifyError);
      }
    }
    return { success: true, messages: thread };
  } catch (error) {
    console.error('❌ replyToSupportRequest failed:', error);
    return { success: false, message: error.message || 'Reply failed' };
  }
}

/**
 * Mark a ticket resolved without necessarily replying (e.g. already handled
 * out of band, or a duplicate/spam ticket). Does not touch an existing
 * reply if one was already sent.
 * @param {string} requestId
 */
async function markSupportRequestReadByRequester(requestId) {
  const db = getFirestore();
  const safeId = String(requestId || '').trim();
  if (!db || !safeId) return { success: false, message: 'Missing ticket id' };
  try {
    const now = new Date();
    await db.collection('support_requests').doc(safeId).update({
      isReadByRequester: true,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAtISO: now.toISOString(),
      updatedAtMs: now.getTime()
    });
    return { success: true };
  } catch (error) {
    console.error('❌ markSupportRequestReadByRequester failed:', error);
    return { success: false, message: error.message || 'Could not save closed state' };
  }
}

async function resolveSupportRequest(requestId) {
  const db = getFirestore();
  const safeId = String(requestId || '').trim();
  if (!db || !safeId) return { success: false, message: 'Missing ticket id' };

  try {
    const now = new Date();
    const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp();
    await db.collection('support_requests').doc(safeId).update({
      status: 'resolved',
      updatedAt: serverTimestamp,
      updatedAtISO: now.toISOString(),
      updatedAtMs: now.getTime(),
      lastUpdatedAt: serverTimestamp,
      lastUpdatedAtISO: now.toISOString(),
      lastUpdatedAtMs: now.getTime()
    });
    return { success: true };
  } catch (error) {
    console.error('❌ resolveSupportRequest failed:', error);
    return { success: false, message: error.message || 'Resolve failed' };
  }
}

/**
 * Phase 10: turn a ticket doc into an ordered thread. New tickets write
 * `messages[]` on create. Older tickets only have `message` + optional
 * one-slot `reply` — those are synthesized here so Chapter 2/3 can render
 * one list without a migration script.
 * @param {Object} data
 * @returns {Array<Object>}
 */
function stripRegardingGigPrefix(text) {
  return String(text || '').replace(/^Regarding gig\s+"[^"]+"\s*:\s*/i, '').trim();
}

function stripAdminContactSubjectPrefix(subject) {
  return String(subject || '').replace(/^Message from GISUGO\s*[—–-]\s*/i, '').trim();
}

function displaySupportSubject(subject, topicLabel) {
  const cleaned = stripAdminContactSubjectPrefix(subject);
  if (!cleaned) return '';
  if (topicLabel && cleaned.toLowerCase() === String(topicLabel).toLowerCase()) return '';
  return cleaned;
}

function normalizeSupportMessages(data) {
  const source = (Array.isArray(data?.messages) && data.messages.length)
    ? data.messages
    : null;
  if (source) {
    return source.map((entry) => ({
      ...entry,
      message: stripRegardingGigPrefix(entry && entry.message)
    }));
  }
  const messages = [];
  const original = String(data?.message || '').trim();
  if (original) {
    messages.push({
      sender: 'user',
      senderId: data?.requester?.userId || data?.userId || null,
      senderName: String(data?.requester?.name || data?.userName || 'User'),
      message: stripRegardingGigPrefix(original),
      photoUrl: data?.attachments?.photoUrl || data?.photoUrl || null,
      photoThumbUrl: data?.attachments?.photoThumbUrl || data?.attachments?.photoUrl || data?.photoUrl || null,
      createdAtISO: data?.createdAtISO || null,
      createdAtMs: Number(data?.createdAtMs) || 0
    });
  }
  const replyMessage = String(data?.reply?.message || '').trim();
  if (replyMessage) {
    let replyIso = data?.reply?.repliedAtISO || null;
    let replyMs = Number(data?.reply?.repliedAtMs) || 0;
    const repliedAt = data?.reply?.repliedAt;
    if (repliedAt && typeof repliedAt.toDate === 'function') {
      const asDate = repliedAt.toDate();
      replyIso = asDate.toISOString();
      replyMs = asDate.getTime();
    }
    messages.push({
      sender: 'admin',
      senderId: data?.reply?.repliedBy?.adminId || null,
      senderName: String(data?.reply?.repliedBy?.adminName || 'Admin'),
      message: stripRegardingGigPrefix(replyMessage),
      photoUrl: data?.reply?.photoUrl || null,
      photoThumbUrl: data?.reply?.photoThumbUrl || data?.reply?.photoUrl || null,
      createdAtISO: replyIso,
      createdAtMs: replyMs
    });
  }
  return messages;
}

/**
 * @param {Object} data
 * @returns {'user'|'admin'}
 */
function getSupportLastSender(data) {
  if (data?.lastSender === 'user' || data?.lastSender === 'admin') return data.lastSender;
  const messages = normalizeSupportMessages(data);
  if (!messages.length) return 'user';
  return messages[messages.length - 1].sender === 'admin' ? 'admin' : 'user';
}

/**
 * User follow-up on their own ticket. Admin SDK write via callable — the
 * client is not allowed to update `messages` (see firestore.rules).
 * @param {string} requestId
 * @param {string} message
 * @param {{url?: string, thumbUrl?: string}|null} [photoMeta]
 */
async function appendSupportUserMessage(requestId, message, photoMeta = null) {
  const safeId = String(requestId || '').trim();
  const safeMessage = String(message || '').trim();
  if (!safeId || !safeMessage) return { success: false, message: 'Missing ticket or reply text' };
  try {
    const callable = firebase.app().functions('asia-southeast1').httpsCallable('appendSupportUserMessage');
    const result = await callable({
      requestId: safeId,
      message: safeMessage,
      photoUrl: photoMeta?.url || null,
      photoThumbUrl: photoMeta?.thumbUrl || null
    });
    return { success: true, message: result?.data?.message || null };
  } catch (error) {
    console.error('❌ appendSupportUserMessage failed:', error);
    return { success: false, message: error.message || 'Reply failed' };
  }
}

/**
 * Admin Contact (Phase 8): create or append a Support ticket owned by the
 * target user. Server verifies admin + legal recipient.
 * @param {{ targetUserId: string, message: string, source: string, jobId?: string, photoMeta?: {url?: string, thumbUrl?: string}|null }} opts
 */
async function createOrAppendAdminSupportMessage(opts = {}) {
  const targetUserId = String(opts.targetUserId || '').trim();
  const message = String(opts.message || '').trim();
  const source = String(opts.source || '').trim();
  const jobId = String(opts.jobId || '').trim();
  const photoMeta = opts.photoMeta || null;
  if (!targetUserId || !message || !source) {
    return { success: false, message: 'Missing recipient or message' };
  }
  try {
    const callable = firebase.app().functions('asia-southeast1').httpsCallable('createOrAppendAdminSupportMessage');
    const result = await callable({
      targetUserId,
      message,
      source,
      jobId: jobId || null,
      photoUrl: photoMeta?.url || null,
      photoThumbUrl: photoMeta?.thumbUrl || null
    });
    return {
      success: true,
      action: result?.data?.action || null,
      requestId: result?.data?.requestId || null
    };
  } catch (error) {
    console.error('❌ createOrAppendAdminSupportMessage failed:', error);
    return { success: false, message: error.message || 'Send failed' };
  }
}

/**
 * Send a broadcast to all users (Compose Public Message). Read by every
 * user who opens their inbox — one document, not fanned out per recipient.
 * @param {'important-notices'|'platform-updates'|'system-updates'|'promotions'} category
 * @param {string} subject
 * @param {string} message
 */
async function createPlatformBroadcast(category, subject, message) {
  const db = getFirestore();
  const safeSubject = String(subject || '').trim();
  const safeMessage = String(message || '').trim();
  if (!db || !safeSubject || !safeMessage) return { success: false, message: 'Missing subject or message' };

  try {
    const admin = window.currentAdmin || {};
    const now = new Date();
    const docRef = await db.collection('platform_broadcasts').add({
      category,
      subject: safeSubject,
      message: safeMessage,
      sentBy: { adminId: admin.uid || null, adminName: admin.name || 'Admin' },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAtISO: now.toISOString(),
      createdAtMs: now.getTime()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ createPlatformBroadcast failed:', error);
    return { success: false, message: error.message || 'Send failed' };
  }
}

/**
 * Broadcasts sent so far, newest first — feeds the admin dashboard's SENT
 * tab. Small glance list, no live listener (broadcasts are rare).
 */
async function getSentBroadcasts(startAfterDoc = null) {
  const db = getFirestore();
  if (!db) return { broadcasts: [], lastDoc: null, hasMore: false };
  try {
    let query = db.collection('platform_broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(SUPPORT_QUEUE_PAGE_SIZE);
    if (startAfterDoc) {
      query = query.startAfter(startAfterDoc);
    }
    const snap = await query.get();
    return {
      broadcasts: snap.docs.map((doc) => ({ id: doc.id, data: doc.data() })),
      lastDoc: snap.docs.length ? snap.docs[snap.docs.length - 1] : null,
      hasMore: snap.docs.length === SUPPORT_QUEUE_PAGE_SIZE
    };
  } catch (error) {
    console.error('❌ Error loading sent broadcasts (admin):', error);
    return { broadcasts: [], lastDoc: null, hasMore: false };
  }
}

/**
 * "Unsend" a broadcast — a real delete (broadcasts are immutable, no update
 * path in firestore.rules), not a hide/soft-delete.
 * @param {string} broadcastId
 */
async function deleteBroadcast(broadcastId) {
  const db = getFirestore();
  const safeId = String(broadcastId || '').trim();
  if (!db || !safeId) return { success: false, message: 'Missing broadcast id' };
  try {
    await db.collection('platform_broadcasts').doc(safeId).delete();
    return { success: true };
  } catch (error) {
    console.error('❌ deleteBroadcast failed:', error);
    return { success: false, message: error.message || 'Unsend failed' };
  }
}

/**
 * Broadcasts for the user-facing Support/Messages inbox (support.js) — a
 * one-time fetch, NOT a live listener (broadcasts are rare enough that a
 * fresh-on-page-open read is more than adequate, and a live listener
 * across every signed-in user would be needlessly expensive for something
 * that changes maybe a few times a month).
 * @param {number} [limit=30]
 */
async function getPlatformBroadcastsForUser(limit = 30) {
  const db = getFirestore();
  if (!db) return [];
  try {
    const snap = await db.collection('platform_broadcasts')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((doc) => ({ id: doc.id, data: doc.data() }));
  } catch (error) {
    console.error('❌ Error loading broadcasts (user):', error);
    return [];
  }
}

window.getSupportQueueNew = getSupportQueueNew;
window.getSupportQueueOld = getSupportQueueOld;
window.getSupportQueueCounts = getSupportQueueCounts;
window.replyToSupportRequest = replyToSupportRequest;
window.markSupportRequestReadByRequester = markSupportRequestReadByRequester;

async function markSupportAdminNotificationsRead(supportRequestId) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  const safeId = String(supportRequestId || '').trim();
  if (!db || !currentUser || !safeId) return { success: false };
  try {
    const snap = await db.collection('notifications')
      .where('recipientId', '==', currentUser.uid)
      .where('read', '==', false)
      .get();
    const updates = snap.docs
      .filter((doc) => {
        const data = doc.data() || {};
        return String(data.type || '') === 'support_admin_message'
          && String(data.supportRequestId || '') === safeId;
      })
      .map((doc) => doc.ref.update({ read: true }));
    if (updates.length) await Promise.all(updates);
    return { success: true, updated: updates.length };
  } catch (error) {
    console.warn('⚠️ markSupportAdminNotificationsRead failed:', error);
    return { success: false };
  }
}
window.markSupportAdminNotificationsRead = markSupportAdminNotificationsRead;
window.resolveSupportRequest = resolveSupportRequest;
window.normalizeSupportMessages = normalizeSupportMessages;
window.getSupportLastSender = getSupportLastSender;
window.displaySupportSubject = displaySupportSubject;
window.appendSupportUserMessage = appendSupportUserMessage;
window.createOrAppendAdminSupportMessage = createOrAppendAdminSupportMessage;
window.createPlatformBroadcast = createPlatformBroadcast;
window.getSentBroadcasts = getSentBroadcasts;
window.deleteBroadcast = deleteBroadcast;
window.getPlatformBroadcastsForUser = getPlatformBroadcastsForUser;

// ============================================================================
// PLATFORM SETTINGS (Admin Dashboard Phase 5)
// ============================================================================
// Single doc (platform_settings/general) replacing the old per-browser
// localStorage(gisugo_admin_settings). One-time reads/writes, no live
// listener — this is a manual Save/Reset panel, not something that needs to
// react to another admin's edits in real time. Public read (see
// firestore.rules) because index.html's homepage-video gate has to read this
// for logged-out visitors too; write is isSuperAdmin()-gated.
//
// NOTE (audit, 2026-08-10): of the ~47 fields in this doc, only
// `showHomepageVideoForLoggedIn` has a real consumer anywhere in the app.
// The rest are dashboard-only UI scaffolding with no enforcement yet — moving
// them here fixes the cross-browser-consistency bug, it does not make them
// functional. See docs/V1_HARDENING_TASKLIST.md Phase 5.
const PLATFORM_SETTINGS_DOC_PATH = ['platform_settings', 'general'];
const PLATFORM_SETTINGS_PUBLIC_DOC_PATH = ['platform_settings', 'public'];
const SAFE_PUBLIC_PLATFORM_POLICY = {
  suspendGigs: false,
  suspendMessages: false,
  techDifficulties: false,
  techWarningTitle: '',
  techWarningMessage: '',
  techWarningSeverity: 'medium',
  techWarningEta: '',
  maintenanceMode: false,
  maintenanceResumeTime: '',
  maintenanceTitle: '',
  maintenanceMessage: '',
  maintenanceStartTime: '',
  maintenanceEndTime: '',
  maintenanceContact: '',
  allowRegistration: true,
  maxActiveGigs: 0,
  minGigPrice: 50,
  maxGigPrice: 100000,
  launchBucketOn: true
};
let _publicPlatformPolicyCache = { at: 0, value: null };

function buildPublicPlatformPolicy(settings = {}) {
  const src = settings && typeof settings === 'object' ? settings : {};
  const maxActive = Number(src.maxActiveGigs);
  const minPrice = Number(src.minGigPrice);
  const maxPrice = Number(src.maxGigPrice);
  return {
    suspendGigs: src.suspendGigs === true,
    suspendMessages: src.suspendMessages === true,
    techDifficulties: src.techDifficulties === true,
    techWarningTitle: String(src.techWarningTitle || ''),
    techWarningMessage: String(src.techWarningMessage || ''),
    techWarningSeverity: String(src.techWarningSeverity || 'medium'),
    techWarningEta: String(src.techWarningEta || ''),
    maintenanceMode: src.maintenanceMode === true,
    maintenanceResumeTime: String(src.maintenanceResumeTime || ''),
    maintenanceTitle: String(src.maintenanceTitle || ''),
    maintenanceMessage: String(src.maintenanceMessage || ''),
    maintenanceStartTime: String(src.maintenanceStartTime || ''),
    maintenanceEndTime: String(src.maintenanceEndTime || ''),
    maintenanceContact: String(src.maintenanceContact || ''),
    allowRegistration: src.allowRegistration !== false,
    maxActiveGigs: Number.isFinite(maxActive) && maxActive > 0 ? maxActive : 0,
    minGigPrice: Number.isFinite(minPrice) && minPrice >= 0 ? minPrice : 50,
    maxGigPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : 100000,
    launchBucketOn: src.launchBucketOn !== false
  };
}

function invalidatePublicPlatformPolicyCache() {
  _publicPlatformPolicyCache = { at: 0, value: null };
}

async function syncPublicPlatformPolicy(settings) {
  const db = getFirestore();
  if (!db) return false;
  const publicPolicy = buildPublicPlatformPolicy(settings);
  await db.collection(PLATFORM_SETTINGS_PUBLIC_DOC_PATH[0])
    .doc(PLATFORM_SETTINGS_PUBLIC_DOC_PATH[1])
    .set({
      ...publicPolicy,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: false });
  _publicPlatformPolicyCache = { at: Date.now(), value: publicPolicy };
  return true;
}

/**
 * Public keeper flags for the live site. Fail-open to SAFE_PUBLIC_PLATFORM_POLICY
 * when the doc is missing or the read fails (never lock the site on a blip).
 */
async function getPublicPlatformPolicy() {
  const cached = _publicPlatformPolicyCache;
  if (cached.value && (Date.now() - cached.at) < 15000) {
    return { ...cached.value };
  }
  const db = getFirestore();
  if (!db) return { ...SAFE_PUBLIC_PLATFORM_POLICY };
  try {
    const ref = db.collection(PLATFORM_SETTINGS_PUBLIC_DOC_PATH[0])
      .doc(PLATFORM_SETTINGS_PUBLIC_DOC_PATH[1]);
    const snap = await ref.get({ source: 'server' });
    if (!snap.exists) {
      _publicPlatformPolicyCache = { at: Date.now(), value: { ...SAFE_PUBLIC_PLATFORM_POLICY } };
      return { ...SAFE_PUBLIC_PLATFORM_POLICY };
    }
    const policy = buildPublicPlatformPolicy(snap.data() || {});
    _publicPlatformPolicyCache = { at: Date.now(), value: policy };
    return { ...policy };
  } catch (error) {
    console.warn('⚠️ Public platform policy read failed (fail-open):', error && error.message ? error.message : error);
    return { ...SAFE_PUBLIC_PLATFORM_POLICY };
  }
}

/**
 * Read the shared platform settings doc. If it doesn't exist yet (first ever
 * load), seeds it with `defaults` so every future read/write has a doc to
 * work against. Returns a plain object of settings values, or `defaults` on
 * any failure (fails open to the same DEFAULT_SETTINGS the caller already
 * has, never blocks the dashboard from rendering).
 */
async function getPlatformSettings(defaults = {}) {
  const db = getFirestore();
  if (!db) return { ...defaults };
  try {
    const ref = db.collection(PLATFORM_SETTINGS_DOC_PATH[0]).doc(PLATFORM_SETTINGS_DOC_PATH[1]);
    // FIX (2026-08-11): force a real server round-trip, not the default
    // "server-if-online-else-cache" behavior. This app runs with multi-tab
    // offline persistence enabled (see firebase-config.js) -- confirmed
    // previously (Gigs Manager edits not reflecting on the listing page in
    // the same browser) that a plain `.get()` can serve an IndexedDB-cached
    // snapshot from an earlier tab/pageview instead of the true current
    // value. A setting an admin just changed is exactly the case where that
    // staleness is most visible/confusing, and this doc is only read once
    // per Admin Dashboard load (no public page reads it as of 2026-08-11 --
    // see firestore.rules), so always paying for a server round trip costs
    // nothing meaningful.
    const snap = await ref.get({ source: 'server' });
    if (!snap.exists) {
      // First ever read — seed the doc so it exists for subsequent reads/writes.
      try {
        await ref.set({ ...defaults, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      } catch (seedError) {
        // Non-fatal — read rules are isAdmin()-only and write rules are
        // isSuperAdmin()-only; a regular (non-super) admin viewing Settings
        // could hit this on a still-unseeded doc. Just fall back to defaults.
        console.warn('⚠️ Could not seed platform_settings/general (likely non-super-admin reader):', seedError.message);
      }
      return { ...defaults };
    }
    return { ...defaults, ...snap.data() };
  } catch (error) {
    console.error('❌ Error loading platform settings:', error);
    return { ...defaults };
  }
}

/**
 * Overwrite the shared platform settings doc. Admin-only (enforced by
 * firestore.rules isSuperAdmin()) — callers should already be gating the
 * Settings UI to admins before this is ever reachable.
 */
async function savePlatformSettings(settings) {
  const db = getFirestore();
  if (!db) return false;
  try {
    const ref = db.collection(PLATFORM_SETTINGS_DOC_PATH[0]).doc(PLATFORM_SETTINGS_DOC_PATH[1]);
    await ref.set({
      ...settings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null
    }, { merge: false });
    try {
      await syncPublicPlatformPolicy(settings);
    } catch (publicError) {
      console.error('❌ Failed to sync public platform policy:', publicError);
    }
    return true;
  } catch (error) {
    console.error('❌ Error saving platform settings:', error);
    return false;
  }
}

window.getPlatformSettings = getPlatformSettings;
window.savePlatformSettings = savePlatformSettings;
window.getPublicPlatformPolicy = getPublicPlatformPolicy;
window.buildPublicPlatformPolicy = buildPublicPlatformPolicy;
window.syncPublicPlatformPolicy = syncPublicPlatformPolicy;
window.invalidatePublicPlatformPolicyCache = invalidatePublicPlatformPolicyCache;

// Ad Placement (Phase 6) — one public config doc. One-shot .get(), no
// listener. Public read (category pages are logged-out). Write is isAdmin().
const AD_SETTINGS_DOC_PATH = ['adSettings', 'global'];

async function getAdSettings() {
  const db = getFirestore();
  if (!db) return null;
  try {
    const ref = db.collection(AD_SETTINGS_DOC_PATH[0]).doc(AD_SETTINGS_DOC_PATH[1]);
    const snap = await ref.get({ source: 'server' });
    if (!snap.exists) return null;
    return snap.data() || null;
  } catch (error) {
    console.error('Error loading ad settings:', error);
    return null;
  }
}

async function saveAdSettings(settings) {
  const db = getFirestore();
  if (!db) return false;
  try {
    const ref = db.collection(AD_SETTINGS_DOC_PATH[0]).doc(AD_SETTINGS_DOC_PATH[1]);
    await ref.set({
      ...settings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: firebase.auth().currentUser ? firebase.auth().currentUser.uid : null
    }, { merge: false });
    return true;
  } catch (error) {
    console.error('Error saving ad settings:', error);
    return false;
  }
}

window.getAdSettings = getAdSettings;
window.saveAdSettings = saveAdSettings;

/**
 * Get the Gigs Analytics counter doc (platform_analytics/gigs) — a tiny,
 * Cloud Function-maintained aggregate doc (see functions/index.js
 * syncGigAnalyticsCountersOnCreate). Never scans the live jobs collection.
 * @returns {Promise<{totalPosted:number, byCategory:Object, byGigUseType:Object}>}
 */
async function getPlatformAnalyticsGigs() {
  const db = getFirestore();
  if (!db) return { totalPosted: 0, byCategory: {}, byGigUseType: {} };

  try {
    const doc = await db.collection('platform_analytics').doc('gigs').get();
    if (!doc.exists) return { totalPosted: 0, byCategory: {}, byGigUseType: {} };
    const data = doc.data() || {};
    return {
      totalPosted: data.totalPosted || 0,
      byCategory: data.byCategory || {},
      byGigUseType: data.byGigUseType || {}
    };
  } catch (error) {
    console.error('❌ Error getting platform_analytics/gigs:', error);
    return { totalPosted: 0, byCategory: {}, byGigUseType: {} };
  }
}

/**
 * Get the Applications Analytics counter doc (platform_analytics/applications).
 * Same cheap counter-doc pattern as getPlatformAnalyticsGigs() above.
 * @returns {Promise<{totalApplications:number, byCategory:Object}>}
 */
async function getPlatformAnalyticsApplications() {
  const db = getFirestore();
  if (!db) return { totalApplications: 0, byCategory: {} };

  try {
    const doc = await db.collection('platform_analytics').doc('applications').get();
    if (!doc.exists) return { totalApplications: 0, byCategory: {} };
    const data = doc.data() || {};
    return {
      totalApplications: data.totalApplications || 0,
      byCategory: data.byCategory || {}
    };
  } catch (error) {
    console.error('❌ Error getting platform_analytics/applications:', error);
    return { totalApplications: 0, byCategory: {} };
  }
}

/**
 * Get the Users Analytics counter doc (platform_analytics/users) — Age
 * Groups + Account Types + Regional Distribution breakdowns (see
 * functions/index.js syncUserAnalyticsCountersOnWrite +
 * submitSignupLocation). Never scans the live users collection.
 * @returns {Promise<{byAgeGroup:Object, byAccountType:Object, byRegion:Object}>}
 */
async function getPlatformAnalyticsUsers() {
  const empty = { byAgeGroup: {}, byAccountType: {}, byRegion: {} };
  const db = getFirestore();
  if (!db) return empty;

  try {
    const doc = await db.collection('platform_analytics').doc('users').get();
    if (!doc.exists) return empty;
    const data = doc.data() || {};
    return {
      byAgeGroup: data.byAgeGroup || {},
      byAccountType: data.byAccountType || {},
      byRegion: data.byRegion || {}
    };
  } catch (error) {
    console.error('❌ Error getting platform_analytics/users:', error);
    return empty;
  }
}

/**
 * Get the Storage Usage counter doc (platform_analytics/storage).
 * Maintained by Storage finalize/delete triggers + the one-time seed.
 * Never lists the bucket. See functions/storage-analytics.js for buckets.
 */
function emptyStorageTypeRow() {
  return { bytes: 0, files: 0 };
}

async function getPlatformAnalyticsStorage() {
  const emptyByType = {
    profile: emptyStorageTypeRow(),
    gig: emptyStorageTypeRow(),
    id: emptyStorageTypeRow(),
    other: emptyStorageTypeRow()
  };
  const empty = {
    totalBytes: 0,
    totalFiles: 0,
    byType: emptyByType,
    growth: { monthKey: '', monthStartBytes: 0, monthStartAt: '', months: {} }
  };
  const db = getFirestore();
  if (!db) return empty;

  try {
    const doc = await db.collection('platform_analytics').doc('storage').get();
    if (!doc.exists) return empty;
    const data = doc.data() || {};
    const rawByType = data.byType || {};
    const byType = {
      profile: {
        bytes: Math.max(0, Number(rawByType.profile && rawByType.profile.bytes) || 0),
        files: Math.max(0, Number(rawByType.profile && rawByType.profile.files) || 0)
      },
      gig: {
        bytes: Math.max(0, Number(rawByType.gig && rawByType.gig.bytes) || 0),
        files: Math.max(0, Number(rawByType.gig && rawByType.gig.files) || 0)
      },
      id: {
        bytes: Math.max(0, Number(rawByType.id && rawByType.id.bytes) || 0),
        files: Math.max(0, Number(rawByType.id && rawByType.id.files) || 0)
      },
      other: {
        bytes: Math.max(0, Number(rawByType.other && rawByType.other.bytes) || 0),
        files: Math.max(0, Number(rawByType.other && rawByType.other.files) || 0)
      }
    };
    const rawGrowth = data.growth || {};
    const months = {};
    Object.keys(rawGrowth.months || {}).forEach((key) => {
      const row = rawGrowth.months[key] || {};
      months[key] = {
        startBytes: Math.max(0, Number(row.startBytes) || 0),
        endBytes: Math.max(0, Number(row.endBytes) || 0)
      };
    });
    return {
      totalBytes: Math.max(0, Number(data.totalBytes) || 0),
      totalFiles: Math.max(0, Number(data.totalFiles) || 0),
      byType,
      growth: {
        monthKey: String(rawGrowth.monthKey || ''),
        monthStartBytes: Math.max(0, Number(rawGrowth.monthStartBytes) || 0),
        monthStartAt: String(rawGrowth.monthStartAt || ''),
        months
      }
    };
  } catch (error) {
    console.error('❌ Error getting platform_analytics/storage:', error);
    return empty;
  }
}

/**
 * Owner Storage budget ($ / month). Separate from platform_analytics/storage
 * so seed/sweep/triggers cannot wipe it. Super-admin write via
 * platform_settings/storage.
 */
async function getStorageBudget() {
  const empty = { budgetUsdPerMonth: null };
  const db = getFirestore();
  if (!db) return empty;
  try {
    const snap = await db.collection('platform_settings').doc('storage').get({ source: 'server' });
    if (!snap.exists) return empty;
    const raw = snap.data() && snap.data().budgetUsdPerMonth;
    if (raw === null || raw === undefined || raw === '') return empty;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return empty;
    return { budgetUsdPerMonth: n };
  } catch (error) {
    console.error('❌ Error getting storage budget:', error);
    return empty;
  }
}

async function saveStorageBudget(usd) {
  const db = getFirestore();
  if (!db) return false;
  try {
    const ref = db.collection('platform_settings').doc('storage');
    const payload = {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (usd === null || usd === undefined || usd === '') {
      payload.budgetUsdPerMonth = null;
    } else {
      const n = Number(usd);
      if (!Number.isFinite(n) || n < 0) return false;
      payload.budgetUsdPerMonth = Math.round(n * 100) / 100;
    }
    await ref.set(payload, { merge: true });
    return true;
  } catch (error) {
    console.error('❌ Error saving storage budget:', error);
    return false;
  }
}

async function getPlatformAnalyticsUserActivity() {
  const empty = {
    mobilePercent: 0,
    desktopPercent: 0,
    androidCount: 0,
    androidPercent: 0,
    iphoneCount: 0,
    iphonePercent: 0,
    avgSessionSeconds: 0,
    peakHoursLabel: 'N/A',
    repeatPercent: 0,
    bounceRate: 0,
    browsers: { chrome: 0, safari: 0, firefox: 0, edge: 0, messenger: 0, other: 0 },
    peakBuckets: { morning: 0, afternoon: 0, evening: 0, night: 0 },
    status: 'empty'
  };
  const db = getFirestore();
  if (!db) return empty;
  try {
    const doc = await db.collection('platform_analytics').doc('user_activity').get();
    if (!doc.exists) return empty;
    return Object.assign({}, empty, doc.data() || {});
  } catch (error) {
    console.error('❌ Error getting platform_analytics/user_activity:', error);
    return empty;
  }
}

async function getPlatformAnalyticsTraffic() {
  const empty = {
    bandwidthBytes: 0,
    firestoreReads: 0,
    firestoreWrites: 0,
    costUsd: 0,
    costBreakdown: { database: 0, storage: 0, bandwidth: 0, auth: 0 },
    status: 'empty'
  };
  const db = getFirestore();
  if (!db) return empty;
  try {
    const doc = await db.collection('platform_analytics').doc('traffic').get();
    if (!doc.exists) return empty;
    const data = doc.data() || {};
    return Object.assign({}, empty, data, {
      costBreakdown: Object.assign({}, empty.costBreakdown, data.costBreakdown || {})
    });
  } catch (error) {
    console.error('❌ Error getting platform_analytics/traffic:', error);
    return empty;
  }
}

async function refreshUserActivitySnapshot() {
  try {
    const callable = firebase.app().functions('asia-southeast1').httpsCallable('refreshUserActivitySnapshot');
    const response = await callable({});
    return { success: true, status: response && response.data && response.data.status };
  } catch (error) {
    console.error('❌ refreshUserActivitySnapshot failed:', error);
    return { success: false, message: error.message || 'Refresh failed' };
  }
}

async function refreshTrafficSnapshot() {
  try {
    const callable = firebase.app().functions('asia-southeast1').httpsCallable('refreshTrafficSnapshot');
    const response = await callable({});
    return { success: true, status: response && response.data && response.data.status };
  } catch (error) {
    console.error('❌ refreshTrafficSnapshot failed:', error);
    return { success: false, message: error.message || 'Refresh failed' };
  }
}

// Get start of current month timestamp
function getMonthStartTimestamp() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

/**
 * Get user profile from Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
async function getUserProfile(userId) {
  console.log('🔎 getUserProfile called for:', userId);
  
  const db = getFirestore();
  
  if (!db) {
    console.error('❌ Firestore not available - cannot fetch profile');
    return null;
  }
  
  try {
    emitIOSDataTrace('profile:load', 'fetch:start', { userId: String(userId || '') });
    if (isIOSWebKitBrowserForDataPath()) {
      try {
        emitIOSDataTrace('profile:load', 'fetch:mode', 'REST');
        const restProfile = await withFirestoreReadTimeout(fetchUserProfileViaFirestoreRest(userId), 9000);
        if (restProfile) {
          emitIOSDataTrace('profile:load', 'fetch:done', { found: true, mode: 'REST' });
          return { userId: restProfile.id, ...restProfile };
        }
        emitIOSDataTrace('profile:load', 'fetch:done', { found: false, mode: 'REST' });
      } catch (restError) {
        console.warn('⚠️ Profile REST fallback failed, trying SDK:', restError);
        const message = (restError && restError.message) ? restError.message : String(restError);
        const stage = /timed out/i.test(message) ? 'fetch:timeout' : 'fetch:error';
        emitIOSDataTrace('profile:load', stage, { mode: 'REST', message });
      }
    }
    emitIOSDataTrace('profile:load', 'fetch:mode', 'SDK');
    console.log('📡 Querying Firestore: users/' + userId);
    const userDoc = await db.collection('users').doc(userId).get();
    
    console.log('📨 Firestore response:', {
      exists: userDoc.exists,
      id: userDoc.id,
      hasData: userDoc.exists ? Object.keys(userDoc.data()).length : 0
    });
    
    if (userDoc.exists) {
      const profileData = { userId: userDoc.id, ...userDoc.data() };
      console.log('✅ Profile found:', {
        userId: profileData.userId,
        fullName: profileData.fullName,
        email: profileData.email,
        hasPhoto: !!profileData.profilePhoto
      });
      emitIOSDataTrace('profile:load', 'fetch:done', { found: true, mode: 'SDK' });
      return profileData;
    } else {
      console.warn('⚠️ User profile not found in Firestore:', userId);
      emitIOSDataTrace('profile:load', 'fetch:done', { found: false, mode: 'SDK' });
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting user profile from Firestore:', error);
    const message = (error && error.message) ? error.message : String(error);
    const stage = /timed out/i.test(message) ? 'fetch:timeout' : 'fetch:error';
    emitIOSDataTrace('profile:load', stage, { mode: 'SDK', message });
    return null;
  }
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Jobs
window.createJob = createJob;
window.getJobById = getJobById;
window.getJobsByCategory = getJobsByCategory;
window.getUserJobListings = getUserJobListings;
window.updateJobStatus = updateJobStatus;
window.deleteJob = deleteJob;

// Users
window.getUserProfile = getUserProfile;

// Applications
window.applyForJob = applyForJob;
window.getJobApplications = getJobApplications;
window.syncJobApplicationCount = syncJobApplicationCount;
window.resolveApplicationCountAfterOfferEnd = resolveApplicationCountAfterOfferEnd;
window.hireWorker = hireWorker;
window.acceptGigOfferInChat = acceptGigOfferInChat;
window.rejectGigOfferInChat = rejectGigOfferInChat;
window.relistGigFromChat = relistGigFromChat;
window.resignGigFromChat = resignGigFromChat;
window.completeGigFromChat = completeGigFromChat;
window.getWorkerApplications = getWorkerApplications;
window.withdrawWorkerApplication = withdrawWorkerApplication;
window.getUserApplicationCoinStatus = getUserApplicationCoinStatus;
window.releaseApplicationCoinForApplication = releaseApplicationCoinForApplication;

// Chat
window.getOrCreateChatThread = getOrCreateChatThread;
window.sendMessage = sendMessage;
window.sendImageMessage = sendImageMessage;
window.markChatThreadRead = markChatThreadRead;
window.hasGigTipsAcknowledgementForThread = hasGigTipsAcknowledgementForThread;
window.acknowledgeGigTipsForThread = acknowledgeGigTipsForThread;
window.deleteChatThreadForCurrentUser = deleteChatThreadForCurrentUser;
window.getThreadMessages = getThreadMessages;
window.getUserChatThreads = getUserChatThreads;

// Notifications
window.callCreateUserAlert = callCreateUserAlert;
window.callWorkerAcceptRejectOthers = callWorkerAcceptRejectOthers;
window.createNotification = createNotification;
window.getUserNotifications = getUserNotifications;
window.getUserNotificationsPage = getUserNotificationsPage;
window.markNotificationRead = markNotificationRead;
window.deleteNotification = deleteNotification;

// Real-time Listeners
window.subscribeToUserNotifications = subscribeToUserNotifications;
window.subscribeToUnreadNotificationCounters = subscribeToUnreadNotificationCounters;
window.subscribeToUserThreads = subscribeToUserThreads;
window.subscribeToThreadMessages = subscribeToThreadMessages;

// Admin
window.getAdminAnalytics = getAdminAnalytics;
window.getPlatformAnalyticsGigs = getPlatformAnalyticsGigs;
window.getPlatformAnalyticsApplications = getPlatformAnalyticsApplications;
window.getPlatformAnalyticsUsers = getPlatformAnalyticsUsers;
window.getPlatformAnalyticsStorage = getPlatformAnalyticsStorage;
window.getStorageBudget = getStorageBudget;
window.saveStorageBudget = saveStorageBudget;
window.getPlatformAnalyticsUserActivity = getPlatformAnalyticsUserActivity;
window.getPlatformAnalyticsTraffic = getPlatformAnalyticsTraffic;
window.refreshUserActivitySnapshot = refreshUserActivitySnapshot;
window.refreshTrafficSnapshot = refreshTrafficSnapshot;

// ============================================================================
// NOTIFICATION HELPER (Pre-wired for RELIST feature - uses existing ALERTS)
// ============================================================================

/**
 * Send notification to worker when contract is voided
 * Integrates with existing ALERTS tab in Messages page
 */
async function sendContractVoidedNotification(workerId, workerName, jobId, jobTitle, voidReason, customerName) {
  console.log('📬 sendContractVoidedNotification() called');
  console.log('📋 Worker:', workerName, '| Job:', jobTitle);
  
  try {
    const result = await callCreateUserAlert({
      type: 'contract_voided',
      recipientId: workerId,
      jobId: jobId,
      jobTitle: jobTitle || 'Gig',
      message: `Your contract for "${jobTitle}" has been voided. Reason: ${voidReason}`,
      actionRequired: false
    });
    
    if (result.success) {
      console.log('✅ Contract voided notification sent to ALERTS tab');
      return { success: true };
    } else {
      console.error('❌ Failed to send notification:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('❌ Error sending contract voided notification:', error);
    return { success: false, message: error.message };
  }
}

window.sendContractVoidedNotification = sendContractVoidedNotification;
window.createGroupedApplicationClosureNotification = createGroupedApplicationClosureNotification;

/**
 * Send notification to customer when worker rejects offer
 * Integrates with existing ALERTS tab in Messages page
 */
async function sendOfferRejectedNotification(customerId, customerName, jobId, jobTitle, workerName) {
  console.log('📬 sendOfferRejectedNotification() called');
  console.log('📋 Customer:', customerName, '| Worker:', workerName, '| Job:', jobTitle);
  
  try {
    // Use existing createNotification() function
    const result = await createNotification(customerId, {
      type: 'offer_rejected',
      jobId: jobId,
      jobTitle: jobTitle,
      message: `${workerName} has rejected your job offer for "${jobTitle}". The job is now available for applications.`,
      actionRequired: false,
      // Additional data for future use
      workerName: workerName
    });
    
    if (result.success) {
      console.log('✅ Offer rejected notification sent to customer ALERTS tab');
      return { success: true };
    } else {
      console.error('❌ Failed to send notification:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('❌ Error sending offer rejected notification:', error);
    return { success: false, message: error.message };
  }
}

window.sendOfferRejectedNotification = sendOfferRejectedNotification;

/**
 * Send notification to customer when worker resigns from job
 * Integrates with existing ALERTS tab in Messages page
 */
async function sendWorkerResignedNotification(customerId, customerName, jobId, jobTitle, resignReason, workerName) {
  console.log('📬 sendWorkerResignedNotification() called');
  console.log('📋 Customer:', customerName, '| Worker:', workerName, '| Job:', jobTitle);
  
  try {
    const result = await callCreateUserAlert({
      type: 'worker_resigned',
      recipientId: customerId,
      jobId: jobId,
      jobTitle: jobTitle || 'Gig',
      message: `${workerName} has resigned from "${jobTitle}". Reason: ${resignReason}. Your job is now active for new applications.`,
      actionRequired: false
    });
    
    if (result.success) {
      console.log('✅ Worker resignation notification sent to customer ALERTS tab');
      return { success: true };
    } else {
      console.error('❌ Failed to send notification:', result.message);
      return { success: false, message: result.message };
    }
  } catch (error) {
    console.error('❌ Error sending worker resignation notification:', error);
    return { success: false, message: error.message };
  }
}

window.sendWorkerResignedNotification = sendWorkerResignedNotification;
window.submitGigReportToAdmin = submitGigReportToAdmin;
window.hasSubmittedGigReport = hasSubmittedGigReport;

console.log('📦 Firebase database module loaded');

