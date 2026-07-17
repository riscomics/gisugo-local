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

// TEMP iOS trace bridge. Page scripts can register window.__GISUGO_IOS_TRACE(payload).
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
async function syncJobApplicationCountViaFirestoreRest(jobId, applicationId = '', headers = null) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for job REST update');
  const safeJobId = String(jobId || '').trim();
  if (!safeJobId) throw new Error('Missing job id for applicationCount sync');

  const pending = await fetchPendingApplicationsByJobViaFirestoreRest(safeJobId, 11, headers);
  const correctCount = Array.isArray(pending) ? pending.length : 0;
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
 * Authoritative jobs.applicationCount = number of pending applications.
 * Prefer this over FieldValue.increment(±1) so Listings badges cannot drift.
 * @param {string} jobId
 * @param {{ applicationIdToUnion?: string, skipWriteIfCountEquals?: number }} [options]
 *   applicationIdToUnion — apply flow: also union the new app id into applicationIds.
 *     When set, failures THROW (the union is required for later job-delete cleanup).
 *   skipWriteIfCountEquals — bulk repair: skip the job write when count already matches.
 * @returns {Promise<number>} pending count (or -1 on soft failure)
 */
async function syncJobApplicationCount(jobId, options = {}) {
  const db = getFirestore();
  const safeJobId = String(jobId || '').trim();
  const unionId = String(options.applicationIdToUnion || '').trim();
  if (!db || !safeJobId) {
    if (unionId) throw new Error('syncJobApplicationCount: missing db or jobId');
    return -1;
  }

  try {
    const pendingApps = await db.collection('applications')
      .where('jobId', '==', safeJobId)
      .where('status', '==', 'pending')
      .get();
    const correctCount = pendingApps.size;

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
      paymentType: jobData.paymentType || 'Per Hour',
      
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
 * @param {Object} filters - Filter options (region, city, payType)
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
    
    if (filters.payType && filters.payType !== 'PAY TYPE') {
      jobs = jobs.filter(job => 
        (((job && job.paymentType) || '').toUpperCase()) === filters.payType.toUpperCase()
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
      paymentType: jobData.paymentType || 'Per Hour',
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
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Delete photo from Firebase Storage (if it's a Storage URL)
    // ═══════════════════════════════════════════════════════════════
    if (jobData.thumbnail) {
      const isStorageUrl = jobData.thumbnail.includes('firebasestorage.googleapis.com') || 
                          jobData.thumbnail.includes('storage.googleapis.com');
      
      if (isStorageUrl) {
        console.log('🗑️ Deleting photo from Firebase Storage...');
        
        try {
          // Extract storage path from URL
          const storage = getFirebaseStorage();
          if (storage) {
            // Method 1: Try to extract path from URL
            let storagePath = null;
            
            // Parse URL to get the file path
            const url = new URL(jobData.thumbnail);
            const pathMatch = url.pathname.match(/\/o\/(.+)$/);
            
            if (pathMatch) {
              storagePath = decodeURIComponent(pathMatch[1]);
              console.log('📍 Extracted storage path:', storagePath);
              
              // Delete the file
              const fileRef = storage.ref().child(storagePath);
              await fileRef.delete();
              console.log('✅ Photo deleted from Storage');
            } else {
              console.warn('⚠️ Could not extract storage path from URL');
            }
          }
        } catch (storageError) {
          // Don't fail the entire deletion if photo deletion fails
          if (storageError.code === 'storage/object-not-found') {
            console.warn('⚠️ Photo already deleted from Storage');
          } else {
            console.error('❌ Error deleting photo from Storage:', storageError);
          }
        }
      } else {
        console.log('ℹ️ Photo is base64/local, no Storage cleanup needed');
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Delete associated applications & release held coins
    // (Legacy appliedJobsCount / activeJobsCount increments were removed —
    //  they were decrement-only leftovers nothing reads; profile stats use
    //  statistics.* instead.)
    // ═══════════════════════════════════════════════════════════════
    if (jobData.applicationIds && jobData.applicationIds.length > 0) {
      console.log(`🗑️ Deleting ${jobData.applicationIds.length} associated applications...`);
      
      // First, get applicants that still hold an application coin so we can release it.
      const coinReleaseCandidates = [];
      try {
        const appPromises = jobData.applicationIds.map(appId => 
          db.collection('applications').doc(appId).get()
        );
        const appDocs = await Promise.all(appPromises);
        
        appDocs.forEach(appDoc => {
          if (appDoc.exists) {
            const appData = appDoc.data() || {};
            const applicantId = appData.applicantId;
            if (applicantId && appData.coinHeld !== false && !appData.coinReleasedAt) {
              coinReleaseCandidates.push({
                applicantId,
                applicationId: appDoc.id
              });
            }
          }
        });
      } catch (fetchError) {
        console.error('⚠️ Error fetching applications for coin release:', fetchError);
        // Continue with deletion even if we can't get IDs
      }
      
      // Delete applications
      const batch = db.batch();
      for (const appId of jobData.applicationIds) {
        const appRef = db.collection('applications').doc(appId);
        batch.delete(appRef);
      }
      
      try {
        await batch.commit();
        console.log('✅ Applications deleted');
      } catch (appError) {
        console.error('❌ Error deleting applications:', appError);
        // Continue with job deletion even if applications fail
      }

      if (coinReleaseCandidates.length > 0) {
        try {
          const uniqueReleaseUsers = [...new Set(coinReleaseCandidates.map((entry) => entry.applicantId))];
          const releasePromises = uniqueReleaseUsers.map((uid) =>
            releaseApplicationCoinForUser(uid, 'job_deleted').catch((error) => {
              console.warn('⚠️ Could not release coin for deleted-job applicant:', error);
            })
          );
          await Promise.all(releasePromises);
        } catch (coinReleaseError) {
          console.warn('⚠️ Error releasing coins for deleted job applications:', coinReleaseError);
        }
      }
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
      photoDeleted: jobData.thumbnail ? jobData.thumbnail.includes('firebasestorage') : false,
      applicationsDeleted: jobData.applicationIds ? jobData.applicationIds.length : 0
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
        photoDeleted: jobData.thumbnail ? jobData.thumbnail.includes('firebasestorage') : false,
        applicationsDeleted: jobData.applicationIds ? jobData.applicationIds.length : 0
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

    await syncJobApplicationCount(appData.jobId);

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
      const jobApplicationsSnapshot = await withFirestoreReadTimeout(
        db.collection('applications')
          .where('jobId', '==', jobId)
          .get(),
        applyReadTimeoutMs
      );
      const matchingApplicationDocs = jobApplicationsSnapshot.docs.filter((doc) => {
        const data = doc.data() || {};
        return String(data.applicantId || '') === String(currentUser.uid || '');
      });
      existingApplications = {
        size: matchingApplicationDocs.length,
        docs: matchingApplicationDocs
      };
      emitIOSDataTrace('dynamic-job:apply', 'applications:fetch:done', {
        mode: 'SDK_JOB_SCAN',
        scanned: jobApplicationsSnapshot.size,
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
      if (useRestPrimaryForApply) {
        emitIOSDataTrace('dynamic-job:apply', 'pending:count:start', { mode: 'REST_AUTH' });
        try {
          const pendingRows = await withFirestoreReadTimeout(
            fetchPendingApplicationsByJobViaFirestoreRest(jobId, 11, restAuthHeaders),
            applyReadTimeoutMs
          );
          totalPendingApplications = pendingRows.length;
          emitIOSDataTrace('dynamic-job:apply', 'pending:count:done', { mode: 'REST_AUTH', count: totalPendingApplications });
        } catch (pendingError) {
          emitIOSDataTrace('dynamic-job:apply', 'pending:count:error', {
            mode: 'REST_AUTH',
            message: pendingError && pendingError.message ? pendingError.message : String(pendingError)
          });
          return {
            success: false,
            message: 'Unable to verify gig capacity right now. Please retry.'
          };
        }
      } else {
        const allApplicationsSnapshot = await withFirestoreReadTimeout(
          db.collection('applications')
            .where('jobId', '==', jobId)
            .where('status', '==', 'pending')
            .get(),
          applyReadTimeoutMs
        );
        totalPendingApplications = allApplicationsSnapshot.size;
        emitIOSDataTrace('dynamic-job:apply', 'pending:count:done', { mode: 'SDK', count: totalPendingApplications });
      }
    }
    
    console.log(`📊 Total pending applications for this gig: ${totalPendingApplications}`);
    
    // Block if gig already has 10+ applications (paused)
    if (totalPendingApplications >= 10) {
      console.warn('🛑 Gig has reached maximum applications (10) - currently paused');
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
        syncJobApplicationCountViaFirestoreRest(jobId, appRef.id, restAuthHeaders),
        applyWriteTimeoutMs
      );
    } else {
      await withFirestoreReadTimeout(
        syncJobApplicationCount(jobId, { applicationIdToUnion: appRef.id }),
        applyWriteTimeoutMs
      );
    }
    emitIOSDataTrace('dynamic-job:apply', 'write:jobCount:done', {
      mode: useRestPrimaryForApply ? 'REST_AUTH' : 'SDK'
    });
    
    console.log('✅ Application submitted:', appRef.id);
    
    // Notification/update side effects run in background so apply submit does not stall on iOS.
    const newTotalApplications = totalPendingApplications + 1;
    Promise.resolve().then(async () => {
      try {
        const existingNotifSnapshot = await db.collection('notifications')
          .where('recipientId', '==', job.posterId)
          .where('jobId', '==', jobId)
          .where('type', 'in', ['application_received', 'application_milestone', 'gig_auto_paused'])
          .get();
        
        if (newTotalApplications === 1) {
          await createNotification(job.posterId, {
            type: 'application_received',
            jobId: jobId,
            jobTitle: job.title || 'Your Gig',
            message: `Your gig "${job.title}" has received an application. Review it in Gigs Manager.`,
            actionRequired: false
          });
        } else if (newTotalApplications === 5) {
          if (existingNotifSnapshot.size > 0) {
            const notifId = existingNotifSnapshot.docs[0].id;
            await db.collection('notifications').doc(notifId).update({
              type: 'application_milestone',
              message: `🔥 Your gig "${job.title}" has 5+ applications pending review!`,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          }
        } else if (newTotalApplications === 10) {
          await db.collection('jobs').doc(jobId).update({
            status: 'paused',
            pausedAt: firebase.firestore.FieldValue.serverTimestamp(),
            pauseReason: 'auto_paused_max_applications'
          });
          const deletePromises = existingNotifSnapshot.docs.map(doc => db.collection('notifications').doc(doc.id).delete());
          await Promise.all(deletePromises);
          await createNotification(job.posterId, {
            type: 'gig_auto_paused',
            jobId: jobId,
            jobTitle: job.title || 'Your Gig',
            message: `🛑 Your gig "${job.title}" has been paused. You've received 10 applications. Please review and hire a worker or reject all applicants to reactivate your gig.`,
            actionRequired: true
          });
        }
      } catch (notifError) {
        console.error('❌ Background application notification error:', notifError);
      }
    });
    
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
  
  console.log('🔍 firebase-db.js: getJobApplications() called');
  console.log('   Querying with jobId:', jobId);
  
  if (!db) {
    return [];
  }
  
  try {
    console.log('   📡 Querying Firestore: applications where jobId ==', jobId);
    const snapshot = await db.collection('applications')
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
      // rejectGigOfferInChat / jobs reject-offer path recounts via syncJobApplicationCount.
      applicationCount: 0
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
    
    // Create notification for worker about the gig offer (delete old ones first to prevent duplicates)
    try {
      if (typeof createNotification === 'function') {
        // Delete ALL existing offer_sent notifications for this worker (any job) to avoid stale ones
        const existingNotifs = await db.collection('notifications')
          .where('recipientId', '==', appData.applicantId)
          .where('jobId', '==', jobId)
          .where('type', '==', 'offer_sent')
          .get();
        
        if (!existingNotifs.empty) {
          const deletePromises = existingNotifs.docs.map(doc => doc.ref.delete());
          await Promise.all(deletePromises);
          console.log(`🗑️ Deleted ${existingNotifs.size} old offer notification(s) for this job`);
        }
        
        // Create fresh notification
        const result = await createNotification(appData.applicantId, {
          type: 'offer_sent',
          jobId: jobId,
          jobTitle: jobData.title || 'Gig',
          message: `You've been offered the gig "${jobData.title}"! Check Gigs Manager > Offered tab to accept or decline.`,
          actionRequired: true
        });
        console.log('✅ Offer notification result:', result);
      } else {
        console.error('❌ createNotification function not found');
      }
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

    await syncJobApplicationCount(safeJobId);

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

    await syncJobApplicationCount(safeJobId);

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

    const workerName = currentUser.displayName || 'Worker';
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

    await syncJobApplicationCount(safeJobId);

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

    if (hiredWorkerId && typeof createNotification === 'function') {
      await createNotification(hiredWorkerId, {
        type: 'job_completed',
        jobId: safeJobId,
        jobTitle: jobData.title || 'Gig',
        message: `Gig "${jobData.title || 'Gig'}" has been marked completed.`,
        actionRequired: false
      }).catch((error) => {
        console.warn('⚠️ Completion notification skipped:', error);
      });
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

    await syncJobApplicationCount(appData.jobId);

    // Send grouped courtesy closure notification to applicant (6-hour batch window).
    try {
      await createGroupedApplicationClosureNotification(appData.applicantId, {
        outcomeType: 'manual_reject',
        jobId: appData.jobId,
        jobTitle: jobData.title || appData.jobTitle || 'Gig'
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
    const threadData = {
      jobId: jobId,
      jobTitle: String(otherUserInfo?.jobTitle || '').trim(),
      threadOrigin: String(otherUserInfo?.threadOrigin || '').trim() || 'job',
      participantIds: [currentUser.uid, otherUserId],
      participant1: {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
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
    const message = {
      threadId: threadId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
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
    const message = {
      threadId: threadId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
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
  'offer_rejected',
  'worker_resigned',
  'worker_feedback_received'
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

    const notification = {
      recipientId: recipientId,
      type: notificationType,
      role: 'worker',
      jobId: jobId,
      jobTitle: jobTitle,
      message: buildSlotsReopenedMessage(1),
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
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
    const notification = {
      recipientId: recipientId,
      type: type,
      role: notificationData.role || '',
      jobId: jobId,
      jobTitle: notificationData.jobTitle || '',
      message: notificationData.message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      read: false,
      actionRequired: notificationData.actionRequired || false,
      dedupeKey: dedupeKey || null
    };

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
  const payload = {
    reportId: reportId,
    jobId: safeJobId,
    jobTitle: String(reportData.jobTitle || '').trim(),
    jobCategory: String(reportData.jobCategory || '').trim(),
    posterId: String(reportData.posterId || '').trim(),
    reporterId: currentUser.uid,
    reporterName: currentUser.displayName || 'Anonymous',
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
    return db.collection('notifications')
      .where('recipientId', '==', currentUser.uid)
      .where('read', '==', false)
      .orderBy('createdAt', 'desc')
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
  
  try {
    // Get real-time counts from Firestore
    const [usersSnapshot, verificationsSnapshot, jobsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('verification_requests').where('status', '==', 'pending').get(),
      db.collection('jobs').where('status', '==', 'reported').get()
    ]);
    
    // Calculate revenue from transactions
    const transactionsSnapshot = await db.collection('transactions')
      .where('timestamp', '>=', getMonthStartTimestamp())
      .get();
    
    const monthlyRevenue = transactionsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);
    
    return {
      totalUsers: usersSnapshot.size,
      verificationSubmissions: verificationsSnapshot.size,
      monthlyRevenue: monthlyRevenue,
      reportedGigs: jobsSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error getting admin analytics:', error);
    return {
      totalUsers: 0,
      verificationSubmissions: 0,
      monthlyRevenue: 0,
      reportedGigs: 0
    };
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
    // Use existing createNotification() function
    const result = await createNotification(workerId, {
      type: 'contract_voided',
      jobId: jobId,
      jobTitle: jobTitle,
      message: `Your contract for "${jobTitle}" has been voided. Reason: ${voidReason}`,
      actionRequired: false,
      // Additional data for future use
      voidReason: voidReason,
      customerName: customerName
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
    // Use existing createNotification() function
    const result = await createNotification(customerId, {
      type: 'worker_resigned',
      jobId: jobId,
      jobTitle: jobTitle,
      message: `${workerName} has resigned from "${jobTitle}". Reason: ${resignReason}. Your job is now active for new applications.`,
      actionRequired: false,
      // Additional data for future reference
      workerName: workerName,
      resignReason: resignReason  // Matches job field naming
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

