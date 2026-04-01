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
  if (/[.,!?'"()\/$&@₱-]/.test(char)) return true;
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

async function fetchUserProfileViaFirestoreRest(userId) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for profile REST fallback');
  const safeUserId = String(userId || '').trim();
  if (!safeUserId) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/users/${encodeURIComponent(safeUserId)}`;
  const response = await fetch(endpoint, { method: 'GET' });
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

async function fetchApplicationsByJobAndApplicantViaFirestoreRest(jobId, applicantId, maxItems = 6) {
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
    headers: { 'Content-Type': 'application/json' },
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

async function fetchPendingApplicationsByJobViaFirestoreRest(jobId, maxItems = 11) {
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
    headers: { 'Content-Type': 'application/json' },
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
    // Offline mode - use localStorage
    return createJobOffline(jobData);
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

// Create job in localStorage for offline mode
function createJobOffline(jobData) {
  const jobId = `${jobData.category}_job_${Date.now()}`;
  const category = jobData.category;
  
  // Get current user info from Firebase Auth
  const auth = getFirebaseAuth();
  const currentUser = auth ? auth.currentUser : null;
  const posterId = (currentUser && currentUser.uid) || getCurrentUserId() || 'offline_user';
  const posterName = (currentUser && currentUser.displayName) || 'Demo User';
  const posterThumbnail = (currentUser && currentUser.photoURL) || '';
  
  const jobDoc = {
    jobId: jobId,
    jobNumber: Date.now().toString(),
    posterId: posterId,
    posterName: posterName,
    posterThumbnail: posterThumbnail,
    title: jobData.title || jobData.jobTitle,
    description: jobData.description || '',
    category: category,
    thumbnail: jobData.thumbnail || jobData.photo || '',
    photo: jobData.thumbnail || jobData.photo || '',
    region: jobData.region || 'CEBU',
    city: jobData.city || 'CEBU CITY',
    jobDate: jobData.jobDate || jobData.scheduledDate,
    startTime: jobData.startTime,
    endTime: jobData.endTime,
    priceOffer: jobData.priceOffer || jobData.paymentAmount,
    paymentType: jobData.paymentType || 'Per Hour',
    paymentAmount: jobData.priceOffer || jobData.paymentAmount,
    extras: jobData.extras || [],
    status: 'active',
    datePosted: new Date().toISOString(),
    applicationCount: 0
  };
  
  // Store in localStorage
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  if (!jobs[category]) {
    jobs[category] = [];
  }
  jobs[category].push(jobDoc);
  localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
  
  // Also store in job preview cards format
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  if (!previewCards[category]) {
    previewCards[category] = [];
  }
  
  const previewCard = {
    id: jobId,
    jobNumber: jobDoc.jobNumber,
    category: category,
    title: jobDoc.title,
    photo: jobDoc.photo,
    extra1: getArrayItemSafe(jobData.extras, 0, ''),
    extra2: getArrayItemSafe(jobData.extras, 1, ''),
    price: `₱${jobDoc.priceOffer}`,
    rate: jobDoc.paymentType,
    date: formatDateForPreview(jobDoc.jobDate),
    time: `${jobDoc.startTime} - ${jobDoc.endTime}`,
    region: jobDoc.region,
    city: jobDoc.city,
    status: 'active',
    templateUrl: `dynamic-job.html?category=${category}&jobNumber=${jobDoc.jobNumber}`,
    createdAt: jobDoc.datePosted
  };
  
  previewCards[category].push(previewCard);
  localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
  
  console.log('✅ Job created offline:', jobId);
  
  triggerPushMilestonePrompt('post');
  return {
    success: true,
    jobId: jobId,
    message: 'Job posted successfully! (Offline mode)'
  };
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
    // Offline mode - search localStorage
    return getCachedJobById(safeJobId) || getJobByIdOffline(safeJobId);
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
    return getCachedJobById(safeJobId) || getJobByIdOffline(safeJobId);
  }
}

// Get job from localStorage for offline mode
function getJobByIdOffline(jobId) {
  // Search through all categories in localStorage
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  for (const category of Object.keys(allJobs)) {
    const jobs = allJobs[category] || [];
    const found = jobs.find(job => job.jobId === jobId || job.id === jobId);
    if (found) {
      return found;
    }
  }
  
  // Also check preview cards
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  for (const category of Object.keys(previewCards)) {
    const jobs = previewCards[category] || [];
    const found = jobs.find(job => job.jobId === jobId || job.id === jobId);
    if (found) {
      return found;
    }
  }
  
  return null;
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
    // Offline mode - use localStorage
    if (!allowFallback) return [];
    const cachedJobs = getCachedJobsByCategory(category);
    if (cachedJobs.length > 0) return cachedJobs;
    return getJobsByCategoryOffline(category, filters);
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
    return getJobsByCategoryOffline(category, filters);
  }
}

// Get jobs from localStorage for offline mode
function getJobsByCategoryOffline(category, filters = {}) {
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  let jobs = previewCards[category] || [];
  
  // Apply filters
  if (filters.region) {
    jobs = jobs.filter(job => job.region === filters.region);
  }
  
  if (filters.payType && filters.payType !== 'PAY TYPE') {
    jobs = jobs.filter(job => 
      (((job && job.rate) || '').toUpperCase()) === filters.payType.toUpperCase()
    );
  }
  
  console.log(`📋 Found ${jobs.length} jobs offline in category: ${category}`);
  return jobs;
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
    return getUserJobListingsOffline(userId, statuses);
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

function getUserJobListingsOffline(userId, statuses) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  let userJobs = [];
  
  Object.values(jobs).forEach(categoryJobs => {
    const filtered = categoryJobs.filter(job => 
      job.posterId === userId && statuses.includes(job.status)
    );
    userJobs = userJobs.concat(filtered);
  });
  
  return userJobs.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
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
    return updateJobOffline(jobId, jobData);
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

function updateJobOffline(jobId, jobData) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  for (const category of Object.keys(jobs)) {
    const jobIndex = jobs[category].findIndex(j => j.jobId === jobId || j.id === jobId);
    if (jobIndex !== -1) {
      const existingJob = jobs[category][jobIndex];
      jobs[category][jobIndex] = {
        ...existingJob,
        ...jobData,
        datePosted: existingJob.datePosted,
        createdAt: existingJob.createdAt,
        applicationCount: existingJob.applicationCount || 0,
        applicationIds: existingJob.applicationIds || [],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
      return { success: true, message: 'Job updated (offline)', jobId };
    }
  }
  return { success: false, message: 'Job not found' };
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
    return updateJobStatusOffline(jobId, newStatus, additionalData);
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

function updateJobStatusOffline(jobId, newStatus, additionalData) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  for (const category of Object.keys(jobs)) {
    const jobIndex = jobs[category].findIndex(j => j.jobId === jobId || j.id === jobId);
    if (jobIndex !== -1) {
      jobs[category][jobIndex] = {
        ...jobs[category][jobIndex],
        status: newStatus,
        ...additionalData
      };
      localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
      return { success: true, message: 'Job updated (offline)' };
    }
  }
  
  return { success: false, message: 'Job not found' };
}

/**
 * Delete a job with comprehensive cleanup (Firestore + Storage)
 * @param {string} jobId - Job document ID
 * @returns {Promise<Object>} - Result object
 */
async function deleteJob(jobId) {
  const db = getFirestore();
  
  if (!db) {
    return deleteJobOffline(jobId);
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
    // STEP 2: Delete associated applications & update applicant statistics
    // ═══════════════════════════════════════════════════════════════
    if (jobData.applicationIds && jobData.applicationIds.length > 0) {
      console.log(`🗑️ Deleting ${jobData.applicationIds.length} associated applications...`);
      
      // First, get applicant IDs before deleting (we need this data for statistics)
      const applicantIds = [];
      try {
        const appPromises = jobData.applicationIds.map(appId => 
          db.collection('applications').doc(appId).get()
        );
        const appDocs = await Promise.all(appPromises);
        
        appDocs.forEach(appDoc => {
          if (appDoc.exists) {
            const applicantId = appDoc.data().applicantId;
            if (applicantId) {
              applicantIds.push(applicantId);
            }
          }
        });
        
        console.log(`📊 Found ${applicantIds.length} applicants to update statistics for`);
      } catch (fetchError) {
        console.error('⚠️ Error fetching applicant IDs:', fetchError);
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
      
      // Update applicant statistics (decrement their application counts)
      if (applicantIds.length > 0) {
        console.log('📊 Updating applicant statistics...');
        try {
          const userBatch = db.batch();
          
          // Remove duplicates (in case user applied multiple times)
          const uniqueApplicantIds = [...new Set(applicantIds)];
          
          for (const applicantId of uniqueApplicantIds) {
            const userRef = db.collection('users').doc(applicantId);
            userBatch.update(userRef, {
              appliedJobsCount: firebase.firestore.FieldValue.increment(-1)
            });
          }
          
          await userBatch.commit();
          console.log(`✅ Updated statistics for ${uniqueApplicantIds.length} applicants`);
        } catch (statsError) {
          console.error('⚠️ Error updating applicant statistics:', statsError);
          // Non-critical - continue with deletion
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
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Update poster statistics (decrement their job counts)
    // ═══════════════════════════════════════════════════════════════
    console.log('📊 Updating poster statistics...');
    try {
      const posterRef = db.collection('users').doc(jobData.posterId);
      await posterRef.update({
        activeJobsCount: firebase.firestore.FieldValue.increment(-1)
      });
      console.log('✅ Poster statistics updated');
    } catch (posterError) {
      console.error('⚠️ Error updating poster statistics:', posterError);
      // Non-critical - job is already deleted
    }
    
    console.log(`✅ Job ${jobId} deleted completely (Firestore + Storage + Applications + Statistics)`);
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

function deleteJobOffline(jobId) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  
  for (const category of Object.keys(jobs)) {
    const jobIndex = jobs[category].findIndex(j => j.jobId === jobId || j.id === jobId);
    if (jobIndex !== -1) {
      jobs[category].splice(jobIndex, 1);
      localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
      
      // Also remove from preview cards
      if (previewCards[category]) {
        previewCards[category] = previewCards[category].filter(
          c => c.id !== jobId && c.jobNumber !== jobId
        );
        localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
      }
      
      return { success: true, message: 'Job deleted (offline)' };
    }
  }
  
  return { success: false, message: 'Job not found' };
}

// ============================================================================
// APPLICATIONS COLLECTION
// ============================================================================

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
    return applyForJobOffline(jobId, applicationData, currentUser);
  }
  
  try {
    emitIOSDataTrace('dynamic-job:apply', 'submit:start', {
      jobId: String(jobId || ''),
      applicantId: currentUser && currentUser.uid ? currentUser.uid : ''
    });
    emitIOSDataTrace('dynamic-job:apply', 'fetch:mode', useRestPrimaryForApply ? 'REST_PRIMARY' : 'SDK');
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
    const existingApplications = {
      size: matchingApplicationDocs.length,
      docs: matchingApplicationDocs
    };
    emitIOSDataTrace('dynamic-job:apply', 'applications:fetch:done', {
      mode: 'SDK_JOB_SCAN',
      scanned: jobApplicationsSnapshot.size,
      count: existingApplications.size
    });
    
    const applicationCount = existingApplications.size;
    
    console.log(`📊 Existing application count: ${applicationCount}`);
    
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
      const existingApp = existingApplications.docs
        .map((doc) => doc.data())
        .sort((a, b) => toComparableMillis(b.appliedAt) - toComparableMillis(a.appliedAt))[0];
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
      
      // If status is 'rejected', 'voided', or 'resigned', allow reapplication
      if (existingApp.status === 'rejected') {
        console.log('♻️ User was rejected - allowing reapplication (2nd chance)');
      } else if (existingApp.status === 'voided') {
        console.log('♻️ User was voided (contract terminated by customer) - allowing reapplication (2nd chance)');
      } else if (existingApp.status === 'resigned') {
        console.log('♻️ User resigned (left the job) - allowing reapplication (2nd chance)');
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
    
    // Get applicant profile from Firestore for accurate info
    let applicantName = currentUser.displayName || 'Anonymous';
    let applicantThumbnail = currentUser.photoURL || '';
    
    console.log('🔍 Fetching applicant profile from Firestore for:', currentUser.uid);
    
    try {
      const applicantProfile = await getUserProfile(currentUser.uid);
      
      if (applicantProfile) {
        console.log('✅ Using Firestore profile data for applicant');
        applicantName = applicantProfile.fullName || applicantName;
        applicantThumbnail = applicantProfile.profilePhoto || applicantThumbnail;
      } else {
        console.warn('⚠️ No Firestore profile found for applicant, using Auth data');
      }
    } catch (error) {
      console.error('❌ Error fetching applicant profile:', error);
      console.warn('⚠️ Falling back to Auth data for applicant');
    }
    
    console.log('🎯 Final applicant data:', { applicantName, applicantThumbnail });
    
    // Create application document
    const application = {
      jobId: jobId,
      applicantId: currentUser.uid,
      applicantName: applicantName,
      applicantThumbnail: applicantThumbnail,
      appliedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      message: applicationData.message || '',
      counterOffer: applicationData.counterOffer || null
    };
    
    const appRef = await withFirestoreReadTimeout(db.collection('applications').add(application), applyWriteTimeoutMs);
    
    // Update job application count
    await withFirestoreReadTimeout(
      db.collection('jobs').doc(jobId).update({
        applicationCount: firebase.firestore.FieldValue.increment(1),
        applicationIds: firebase.firestore.FieldValue.arrayUnion(appRef.id)
      }),
      applyWriteTimeoutMs
    );
    
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
    const message = (error && error.message) ? error.message : String(error);
    const stage = /timed out/i.test(message) ? 'submit:timeout' : 'submit:error';
    emitIOSDataTrace('dynamic-job:apply', stage, message);
    return { success: false, message: error.message };
  }
}

function applyForJobOffline(jobId, applicationData, currentUser) {
  const applications = JSON.parse(localStorage.getItem('gisugo_applications') || '[]');
  
  const applicationId = `app_${Date.now()}`;
  const application = {
    applicationId: applicationId,
    jobId: jobId,
    applicantId: currentUser.uid || 'offline_user',
    applicantName: currentUser.displayName || 'Demo User',
    appliedAt: new Date().toISOString(),
    status: 'pending',
    message: applicationData.message || '',
    counterOffer: applicationData.counterOffer || null
  };
  
  applications.push(application);
  localStorage.setItem('gisugo_applications', JSON.stringify(applications));
  
  triggerPushMilestonePrompt('apply');
  return {
    success: true,
    applicationId: applicationId,
    message: 'Application submitted! (Offline mode)'
  };
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
    console.log('   ⚠️ Offline mode - checking localStorage');
    const applications = JSON.parse(localStorage.getItem('gisugo_applications') || '[]');
    const filtered = applications.filter(app => app.jobId === jobId);
    console.log('   Found', filtered.length, 'applications in localStorage');
    return filtered;
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
async function hireWorker(jobId, applicationId) {
  const db = getFirestore();
  
  if (!db) {
    return { success: true, message: 'Worker hired! (Offline mode)' };
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
    
    // Determine agreed price: counter offer takes priority, otherwise use job's original price
    const agreedPrice = appData.counterOffer || jobData.priceOffer;
    
    console.log('💰 Price negotiation:', {
      originalJobPrice: jobData.priceOffer,
      counterOffer: appData.counterOffer,
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
      applicationCount: 0 // Visually zeroed while waiting; restored if worker rejects
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
    
    // Get all jobs
    const jobsSnapshot = await db.collection('jobs').get();
    let fixed = 0;
    
    for (const jobDoc of jobsSnapshot.docs) {
      const jobId = jobDoc.id;
      
      // Count ONLY pending applications for this job
      const pendingApps = await db.collection('applications')
        .where('jobId', '==', jobId)
        .where('status', '==', 'pending')
        .get();
      
      const correctCount = pendingApps.size;
      const currentCount = jobDoc.data().applicationCount || 0;
      
      if (correctCount !== currentCount) {
        console.log(`📊 Job ${jobId}: Fixing count from ${currentCount} to ${correctCount}`);
        await db.collection('jobs').doc(jobId).update({
          applicationCount: correctCount
        });
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
    return { success: true, message: 'Application rejected! (Offline mode)' };
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
    
    // ═══════════════════════════════════════════════════════════════
    // UPDATE JOB APPLICATION COUNT (decrement for rejected)
    // ═══════════════════════════════════════════════════════════════
    await db.collection('jobs').doc(appData.jobId).update({
      applicationCount: firebase.firestore.FieldValue.increment(-1)
    });

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
    return getOrCreateChatThreadOffline(jobId, otherUserId, otherUserInfo, currentUser);
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
      return {
        success: true,
        threadId: existingThread.id,
        thread: existingThread.data(),
        isNew: false
      };
    }
    
    // Create new thread
    const threadData = {
      jobId: jobId,
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

function getOrCreateChatThreadOffline(jobId, otherUserId, otherUserInfo, currentUser) {
  const threads = JSON.parse(localStorage.getItem('gisugo_chat_threads') || '[]');
  
  // Check for existing thread
  const existing = threads.find(t => 
    t.jobId === jobId && 
    t.participantIds.includes(currentUser.uid) &&
    t.participantIds.includes(otherUserId)
  );
  
  if (existing) {
    return {
      success: true,
      threadId: existing.threadId,
      thread: existing,
      isNew: false
    };
  }
  
  // Create new thread
  const threadId = `thread_${Date.now()}`;
  const threadData = {
    threadId: threadId,
    jobId: jobId,
    participantIds: [currentUser.uid, otherUserId],
    participant1: {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Demo User'
    },
    participant2: {
      userId: otherUserId,
      userName: otherUserInfo.userName || 'User'
    },
    createdAt: new Date().toISOString(),
    lastMessageTime: new Date().toISOString(),
    isActive: true
  };
  
  threads.push(threadData);
  localStorage.setItem('gisugo_chat_threads', JSON.stringify(threads));
  
  return {
    success: true,
    threadId: threadId,
    thread: threadData,
    isNew: true
  };
}

/**
 * Send a message in a chat thread
 * @param {string} threadId - Chat thread ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} - Result object
 */
async function sendMessage(threadId, content) {
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
    return sendMessageOffline(threadId, content, currentUser);
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
    
    // Get thread to find other participant
    const threadDoc = await db.collection('chat_threads').doc(threadId).get();
    const threadData = threadDoc.data();
    const otherUserId = threadData.participantIds.find(id => id !== currentUser.uid);
    
    // Update thread metadata
    await db.collection('chat_threads').doc(threadId).update({
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: content.substring(0, 100),
      [`unreadCount.${otherUserId}`]: firebase.firestore.FieldValue.increment(1)
    });
    
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

function sendMessageOffline(threadId, content, currentUser) {
  const messages = JSON.parse(localStorage.getItem('gisugo_chat_messages') || '[]');
  
  const messageId = `msg_${Date.now()}`;
  const message = {
    messageId: messageId,
    threadId: threadId,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || 'Demo User',
    content: content,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  messages.push(message);
  localStorage.setItem('gisugo_chat_messages', JSON.stringify(messages));
  
  // Update thread last message
  const threads = JSON.parse(localStorage.getItem('gisugo_chat_threads') || '[]');
  const threadIndex = threads.findIndex(t => t.threadId === threadId);
  if (threadIndex !== -1) {
    threads[threadIndex].lastMessageTime = new Date().toISOString();
    threads[threadIndex].lastMessagePreview = content.substring(0, 100);
    localStorage.setItem('gisugo_chat_threads', JSON.stringify(threads));
  }
  
  return {
    success: true,
    messageId: messageId,
    message: 'Message sent (offline)'
  };
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
    const messages = JSON.parse(localStorage.getItem('gisugo_chat_messages') || '[]');
    return messages
      .filter(m => m.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-limit);
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
    const threads = JSON.parse(localStorage.getItem('gisugo_chat_threads') || '[]');
    return threads
      .filter(t => t.participantIds.includes(currentUser.uid))
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
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
    }));
    
  } catch (error) {
    console.error('❌ Error getting chat threads:', error);
    return [];
  }
}

// ============================================================================
// NOTIFICATIONS COLLECTION
// ============================================================================
const APPLICATION_CLOSURE_BATCH_WINDOW_MS = 6 * 60 * 60 * 1000;

function buildGroupedApplicationClosureMessage(type, count) {
  const safeCount = Math.max(1, Number(count) || 1);
  const plural = safeCount === 1 ? '' : 's';
  if (type === 'application_not_selected_batch') {
    return `Application update: Your application${plural} to ${safeCount} gig${plural} were not selected this round. If a selected worker cannot continue, some gigs may reopen.`;
  }
  return `Application update: ${safeCount} of your application${plural} were declined by customers. Keep applying to other gigs-new matches open regularly.`;
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

async function createGroupedApplicationClosureNotification(recipientId, options = {}) {
  const db = getFirestore();
  const outcomeType = options.outcomeType === 'manual_reject' ? 'application_rejected_batch' : 'application_not_selected_batch';
  const nowMs = Date.now();
  const windowEndsAt = new Date(nowMs + APPLICATION_CLOSURE_BATCH_WINDOW_MS);
  const jobId = String(options.jobId || '').trim();
  const jobTitle = String(options.jobTitle || '').trim() || 'Gig';

  if (!db) {
    const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
    const activeBatch = notifications.find((notif) => (
      notif.recipientId === recipientId &&
      notif.type === outcomeType &&
      notif.read !== true &&
      toMillis(notif.batchWindowEndsAt) > nowMs
    ));

    if (activeBatch) {
      const existingTitles = Array.isArray(activeBatch.jobTitles) ? activeBatch.jobTitles : [];
      const existingIds = Array.isArray(activeBatch.jobIds) ? activeBatch.jobIds : [];
      if (jobId && !existingIds.includes(jobId)) existingIds.push(jobId);
      if (jobTitle && !existingTitles.includes(jobTitle)) existingTitles.push(jobTitle);
      activeBatch.jobIds = existingIds.slice(0, 25);
      activeBatch.jobTitles = existingTitles.slice(0, 25);
      activeBatch.closureCount = Math.max(1, Number(activeBatch.closureCount || 0) + 1);
      activeBatch.batchWindowEndsAt = windowEndsAt.toISOString();
      activeBatch.message = buildGroupedApplicationClosureMessage(outcomeType, activeBatch.closureCount);
      localStorage.setItem('gisugo_notifications', JSON.stringify(notifications));
      return { success: true, notificationId: activeBatch.notificationId, grouped: true };
    }

    return createNotificationOffline(recipientId, {
      type: outcomeType,
      message: buildGroupedApplicationClosureMessage(outcomeType, 1),
      actionRequired: false,
      closureCount: 1,
      batchWindowEndsAt: windowEndsAt.toISOString(),
      jobIds: jobId ? [jobId] : [],
      jobTitles: jobTitle ? [jobTitle] : [],
      jobTitle: jobTitle
    });
  }

  try {
    const batchSnapshot = await db.collection('notifications')
      .where('recipientId', '==', recipientId)
      .where('type', '==', outcomeType)
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
        message: buildGroupedApplicationClosureMessage(outcomeType, closureCount),
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
      type: outcomeType,
      role: 'worker',
      jobId: jobId,
      jobTitle: jobTitle,
      message: buildGroupedApplicationClosureMessage(outcomeType, 1),
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
    return createNotificationOffline(recipientId, notificationData);
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

function createNotificationOffline(recipientId, notificationData) {
  const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
  const dedupeKey = String(getSafeValue(notificationData, 'dedupeKey', '')).trim();
  const type = String(getSafeValue(notificationData, 'type', '')).trim();
  const jobId = String(getSafeValue(notificationData, 'jobId', '')).trim();
  if (dedupeKey) {
    const existing = notifications.find((n) =>
      String(n.recipientId || '') === String(recipientId || '') &&
      String(n.type || '') === type &&
      String(n.jobId || '') === jobId &&
      String(n.dedupeKey || '') === dedupeKey
    );
    if (existing) {
      return { success: true, notificationId: existing.notificationId || existing.id || 'offline_deduped' };
    }
  }
  
  const notifId = `notif_${Date.now()}`;
  notifications.push({
    notificationId: notifId,
    recipientId: recipientId,
    ...notificationData,
    createdAt: new Date().toISOString(),
    read: false
  });
  
  localStorage.setItem('gisugo_notifications', JSON.stringify(notifications));
  
  return { success: true, notificationId: notifId };
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
    const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
    let filtered = notifications.filter(n => n.recipientId === currentUser.uid);
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
    let filtered = notifications
      .filter((n) => n.recipientId === currentUser.uid)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

    if (unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    if (startAfterCreatedAt) {
      const cursorMillis = toMillis(startAfterCreatedAt);
      filtered = filtered.filter((n) => toMillis(n.createdAt) < cursorMillis);
    }

    const page = filtered.slice(0, safeLimit);
    const nextCursor = page.length ? (page[page.length - 1].createdAt || null) : null;
    return {
      notifications: page,
      nextCursor,
      hasMore: filtered.length > safeLimit
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
    const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
    const index = notifications.findIndex(n => n.notificationId === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('gisugo_notifications', JSON.stringify(notifications));
    }
    return { success: true };
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
    return db.collection('users').doc(currentUser.uid).onSnapshot(
      (snap) => {
        const snapData = snap && snap.exists && typeof snap.data === 'function' ? (snap.data() || {}) : {};
        const counters = sanitizeNotificationCounters(snapData.notificationCounters || null);
        if (typeof callback === 'function') callback(counters);
      },
      (error) => {
        console.warn('⚠️ Notification counters listener error:', error);
        if (typeof callback === 'function') callback(sanitizeNotificationCounters(null));
      }
    );
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
  
  console.log('👂 Starting real-time listener for chat threads');
  
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
          }));
          console.log(`💬 Threads updated: ${threads.length} items`);
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
  
  console.log(`👂 Starting real-time listener for thread: ${threadId}`);
  
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
          console.log(`📨 Messages updated in thread ${threadId}: ${messages.length} items`);
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
    // Return mock data for offline mode
    return {
      totalUsers: parseInt(localStorage.getItem('mockTotalUsers') || '1250'),
      verificationSubmissions: parseInt(localStorage.getItem('mockVerifications') || '23'),
      monthlyRevenue: parseInt(localStorage.getItem('mockRevenue') || '125000'),
      reportedGigs: parseInt(localStorage.getItem('mockReportedGigs') || '7')
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
window.hireWorker = hireWorker;

// Chat
window.getOrCreateChatThread = getOrCreateChatThread;
window.sendMessage = sendMessage;
window.getThreadMessages = getThreadMessages;
window.getUserChatThreads = getUserChatThreads;

// Notifications
window.createNotification = createNotification;
window.getUserNotifications = getUserNotifications;
window.getUserNotificationsPage = getUserNotificationsPage;
window.markNotificationRead = markNotificationRead;

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

console.log('📦 Firebase database module loaded');

