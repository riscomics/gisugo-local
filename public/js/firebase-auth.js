// ============================================================================
// 🔐 FIREBASE AUTHENTICATION MODULE - GISUGO
// ============================================================================
// 
// This module handles all user authentication operations:
// - Sign up with email/password
// - Login with email/password
// - Google Sign-in
// - Logout
// - Password reset
// - Auth state monitoring
//
// ============================================================================

// ============================================================================
// AUTH STATE MANAGEMENT
// ============================================================================

let currentUser = null;
let authStateListeners = [];

function getEmailVerificationActionSettings() {
  try {
    const origin = window && window.location ? window.location.origin : '';
    if (!origin) return undefined;
    return {
      url: `${origin}/login.html?emailVerified=1`
    };
  } catch (_) {
    return undefined;
  }
}

// Subscribe to auth state changes
function onAuthStateChange(callback) {
  authStateListeners.push(callback);
  
  // If Firebase is available, set up the listener
  const auth = getFirebaseAuth();
  if (auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      authStateListeners.forEach(cb => cb(user));
    });
  }
  
  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}

// Get current authenticated user
/**
 * Get currently authenticated user
 * @returns {Object|null} Current Firebase user or null
 * @warning This returns the CACHED auth state. If called immediately on page load,
 *          it may return null even if user is logged in (auth state not yet restored).
 *          For reliable auth checks, use onAuthStateChanged() instead.
 */
function getCurrentUser() {
  const auth = getFirebaseAuth();
  if (auth) {
    return auth.currentUser;
  }
  
  // Fallback to localStorage for offline mode
  // Note: This will fail if browser blocks storage (e.g., Edge Tracking Prevention)
  try {
    const storedUser = localStorage.getItem('gisugo_current_user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.warn('⚠️ localStorage blocked - cannot retrieve cached user');
    return null;
  }
}

// Get current user ID
function getCurrentUserId() {
  const user = getCurrentUser();
  if (user) {
    return user.uid || user.userId || user.id;
  }
  return null;
}

/**
 * Check if user is currently logged in
 * @returns {boolean} True if user is logged in
 * @warning This checks the CACHED auth state. For reliable auth checks on page load
 *          or in click handlers, use firebase.auth().onAuthStateChanged() instead.
 *          This is especially important when browser storage might be blocked.
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// ============================================================================
// GOOGLE SIGN-IN
// ============================================================================

/**
 * Sign in with Google
 * @returns {Promise<Object>} - Result object with success status and user/error
 */
async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Google sign-in requires Firebase. Please configure Firebase first.'
    };
  }
  
  try {
    console.log('🔐 Starting Google sign-in (popup)...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    // Always show the account chooser so users aren't silently locked to one Google account.
    provider.setCustomParameters({ prompt: 'select_account' });
    
    // Popup keeps the app window open and receives the result directly, so it works
    // on localhost and embedded browsers where the redirect storage handoff fails.
    const result = await auth.signInWithPopup(provider);
    return await finalizeOAuthSignIn(result, 'google.com');
    
  } catch (error) {
    return mapOAuthSignInError(error, 'Google');
  }
}

// ============================================================================
// FACEBOOK SIGN-IN
// ============================================================================

/**
 * Sign in with Facebook
 * @returns {Promise<Object>} - Result object with success status and user/error
 */
async function loginWithFacebook() {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Facebook sign-in requires Firebase. Please configure Firebase first.'
    };
  }
  
  try {
    console.log('🔐 Starting Facebook sign-in (popup)...');
    
    const provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    
    // Popup keeps the app window open and receives the result directly.
    const result = await auth.signInWithPopup(provider);
    return await finalizeOAuthSignIn(result, 'facebook.com');
    
  } catch (error) {
    return mapOAuthSignInError(error, 'Facebook');
  }
}

// ============================================================================
// EMAIL / PASSWORD SIGN-IN (TEMPORARY)
// ----------------------------------------------------------------------------
// Re-added as a dev/testing login that works in embedded browsers (Cursor) and
// anywhere popups/redirects fail. Intended to be removed before public launch.
// ============================================================================

/**
 * Sign in with email + password. Requires the account to have an email/password
 * credential (set via signup or account linking).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} - { success, user, isNewUser } or { success:false, message }
 */
async function loginWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, message: 'Email sign-in requires Firebase. Please configure Firebase first.' };
  }
  try {
    console.log('🔐 Starting email/password sign-in...');
    const result = await auth.signInWithEmailAndPassword(email, password);
    return await finalizeOAuthSignIn(result, 'password');
  } catch (error) {
    const code = (error && error.code) || '';
    console.error('❌ Email sign-in error:', code || error);
    let message = 'Email sign-in failed. Please try again.';
    if (code === 'auth/invalid-email') {
      message = 'That email address looks invalid.';
    } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      message = 'Incorrect email or password.';
    } else if (code === 'auth/user-disabled') {
      message = 'This account has been disabled.';
    } else if (code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please wait a moment and try again.';
    }
    return { success: false, error: error, message: message };
  }
}

// ============================================================================
// OAUTH SIGN-IN HELPERS (shared by the Google + Facebook popup flows)
// ============================================================================

/**
 * Finalize a successful popup sign-in: refresh lastLogin (best-effort) and
 * return a normalized result for callers to route on.
 * @param {Object} result - The UserCredential from signInWithPopup.
 * @param {string} [method] - The provider actually used this session
 *   ('google.com' | 'facebook.com' | 'password'). Stored so the completion
 *   page can show the real sign-in method rather than the account's first
 *   linked provider.
 * @returns {Promise<Object>} - { success, user, isNewUser }
 */
async function finalizeOAuthSignIn(result, method) {
  const user = result && result.user;
  if (!user) {
    return { success: false, message: 'Sign-in failed. Please try again.' };
  }
  console.log('✅ OAuth sign-in complete:', user.uid);

  if (method) {
    try { sessionStorage.setItem('gisugo_last_signin_method', method); } catch (e) {}
  }
  
  // Best-effort lastLogin bump. Fire-and-forget (no await) so sign-in returns
  // immediately, and update() — not set() — so we never create a partial doc for a
  // brand-new user; a 'not-found' just means "no profile yet". Avoids a redundant
  // read here since handleAuthRedirect() already fetches the profile to route.
  const db = getFirestore();
  if (db) {
    db.collection('users').doc(user.uid).update({
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(dbError) {
      if (dbError && dbError.code !== 'not-found') {
        console.warn('⚠️ Could not update lastLogin:', (dbError && dbError.code) || dbError);
      }
    });
  }
  
  const info = result.additionalUserInfo || {};
  return { success: true, user: user, isNewUser: info.isNewUser || false };
}

/**
 * Normalize an OAuth popup error. A user closing/double-triggering the popup is
 * reported as { cancelled: true } (a silent no-op), not a real failure.
 * @param {Object} error - The thrown Firebase auth error.
 * @param {string} providerLabel - 'Google' or 'Facebook' (for messaging).
 * @returns {Object} - { success: false, cancelled?, error?, message? }
 */
function mapOAuthSignInError(error, providerLabel) {
  const code = (error && error.code) || '';
  console.error(`❌ ${providerLabel} sign-in error:`, code || error);
  
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return { success: false, cancelled: true };
  }
  
  let message = `Could not complete ${providerLabel} sign-in. Please try again.`;
  if (code === 'auth/popup-blocked') {
    message = 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
  } else if (code === 'auth/account-exists-with-different-credential') {
    message = 'An account already exists with the same email. Try a different sign-in method.';
  } else if (code === 'auth/operation-not-allowed') {
    message = `${providerLabel} sign-in isn't available yet — please use Google for now.`;
  } else if (code === 'auth/unauthorized-domain') {
    message = 'This domain isn\'t authorized for sign-in. Please use the live site or add it to Firebase authorized domains.';
  }
  return { success: false, error: error, message: message };
}

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * Sign out the current user
 * @returns {Promise<Object>} - Result object with success status
 */
async function logout() {
  const auth = getFirebaseAuth();
  const authCurrentUser = auth ? auth.currentUser : null;
  const lastUid = (authCurrentUser && authCurrentUser.uid) || (currentUser && currentUser.uid) || '';

  if (window.GisugoPushNotifications && typeof window.GisugoPushNotifications.prepareForLogout === 'function') {
    try {
      await window.GisugoPushNotifications.prepareForLogout(lastUid);
    } catch (pushError) {
      console.warn('⚠️ Push logout cleanup failed (continuing logout):', pushError);
    }
  }
  
  if (auth) {
    try {
      await auth.signOut();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }
  
  // Clear localStorage user data
  localStorage.removeItem('gisugo_current_user');
  currentUser = null;
  
  // Notify listeners
  authStateListeners.forEach(cb => cb(null));
  
  return {
    success: true,
    message: 'Logged out successfully'
  };
}

// ============================================================================
// USER PROFILE HELPERS
// ============================================================================

/**
 * Create user profile document in Firestore
 * @param {string} userId - User's UID
 * @param {Object} profileData - Profile data to store
 * @returns {Promise<void>}
 */
async function createUserProfile(userId, profileData) {
  const db = getFirestore();
  
  if (!db) {
    // Store in localStorage for offline mode
    const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
    users[userId] = {
      userId: userId,
      ...profileData,
      accountCreated: new Date().toISOString()
    };
    localStorage.setItem('gisugo_users', JSON.stringify(users));
    console.log('✅ User profile stored in localStorage');
    return;
  }
  
  try {
    // Default profile structure matching FIREBASE_SCHEMA.md
    const defaultProfile = {
      // Basic Information
      userId: userId,
      fullName: '',
      email: '',
      profilePhoto: '',
      dateOfBirth: '',
      educationLevel: '',
      userSummary: '',
      
      // Social Media
      socialMedia: {
        facebook: '',
        instagram: '',
        linkedin: ''
      },
      
      // System Fields
      accountCreated: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      rating: 0,
      reviewCount: 0,
      
      // Verification Status
      verification: {
        status: 'none',
        businessVerified: false,
        proVerified: false,
        faceVerified: false,
        facePosterUrl: '',
        facePosterPath: '',
        faceVideoUrl: '',
        faceVideoPath: '',
        verificationDate: null,
        idSubmitted: false,
        eligibleForSubmission: false
      },
      
      // G-Coins Wallet
      wallet: {
        gCoinsBalance: 0,
        lastTopUp: null,
        totalSpent: 0,
        totalPurchased: 0
      },
      
      // Referral System
      referral: {
        referralCode: generateReferralCode(userId),
        signupCount: 0,
        proEligible: false,
        businessEligible: false,
        totalEarned: 0,
        gCoinsEarned: 0
      },
      
      // Job Statistics
      appliedJobsCount: 0,
      activeJobsCount: 0,
      applicationCoinsCurrent: 10,
      applicationCoinsMax: 10,
      
      // Financial Statistics (for tax reporting)
      statistics: {
        worker: {
          totalGigsAccepted: 0,
          totalGigsCompleted: 0,
          totalGigsResigned: 0,
          totalGigsRemoved: 0,
          totalEarned: 0,
          yearlyStats: {}  // Will be populated as { "2025": { gigsCompleted: 0, earned: 0 }, ... }
        },
        customer: {
          totalGigsPosted: 0,
          totalGigsCompleted: 0,
          totalWorkersFired: 0,
          totalWorkersQuit: 0,
          totalSpent: 0,
          yearlyStats: {}  // Will be populated as { "2025": { gigsCompleted: 0, spent: 0 }, ... }
        }
      }
    };
    
    // Merge with provided data
    const finalProfile = {
      ...defaultProfile,
      ...profileData,
      verification: { ...defaultProfile.verification, ...(profileData.verification || {}) },
      wallet: { ...defaultProfile.wallet, ...(profileData.wallet || {}) },
      referral: { ...defaultProfile.referral, ...(profileData.referral || {}) },
      statistics: {
        ...defaultProfile.statistics,
        ...(profileData.statistics || {}),
        worker: {
          ...defaultProfile.statistics.worker,
          ...(((profileData.statistics || {}).worker) || {})
        },
        customer: {
          ...defaultProfile.statistics.customer,
          ...(((profileData.statistics || {}).customer) || {})
        }
      }
    };

    await db.collection('users').doc(userId).set(finalProfile);
    console.log('✅ User profile created in Firestore');
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
async function getUserProfile(userId) {
  const db = getFirestore();
  
  if (!db) {
    // Get from localStorage for offline mode
    const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
    return users[userId] || null;
  }
  
  try {
    const doc = await db.collection('users').doc(userId).get();
    
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile in Firestore
 * @param {string} userId - User's UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Result object
 */
async function updateUserProfile(userId, updates) {
  const db = getFirestore();
  
  if (!db) {
    // Update in localStorage for offline mode
    const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
    if (users[userId]) {
      users[userId] = { ...users[userId], ...updates };
      localStorage.setItem('gisugo_users', JSON.stringify(users));
      return { success: true, message: 'Profile updated (offline mode)' };
    }
    return { success: false, message: 'User not found' };
  }
  
  try {
    // 🔒 SECURITY: Name changes require admin approval. Only block an ACTUAL change —
    // saves that include the (unchanged) name must still go through, otherwise every
    // profile save is rejected just because the payload carries the current name.
    if (updates.fullName !== undefined && updates.fullName !== null) {
      const currentSnap = await db.collection('users').doc(userId).get();
      const currentName = (currentSnap.exists ? (currentSnap.data().fullName || '') : '').trim();
      const requestedName = String(updates.fullName).trim();

      if (requestedName !== currentName) {
        console.warn('🔒 Name change blocked: Requires admin approval');
        return {
          success: false,
          message: 'Name changes require approval from Admin. Please contact support if you need to update your name.',
          code: 'NAME_CHANGE_LOCKED'
        };
      }

      // Name unchanged — drop it so we never overwrite the stored value with a no-op.
      delete updates.fullName;
    }

    await db.collection('users').doc(userId).update({
      ...updates,
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Profile updated successfully' };
    
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Store a user's phone number in the owner-only `user_private` collection.
 * Phone is a contact field for the Direct-contact reveal flow; it must NOT live
 * on the public `users` doc (world-readable) or it would be scrapable straight
 * from the API. The reveal callable reads it from here on the server side.
 */
async function savePrivatePhone(userId, phoneNumber) {
  const db = getFirestore();
  if (!db || !userId) return { success: false, message: 'No database or user id' };
  try {
    await db.collection('user_private').doc(userId).set({
      phoneNumber: phoneNumber || '',
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving private phone:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Read a user's phone from `user_private` (owner/admin readable only).
 * Returns '' when absent or unreadable.
 */
async function getPrivatePhone(userId) {
  const db = getFirestore();
  if (!db || !userId) return '';
  try {
    const snap = await db.collection('user_private').doc(userId).get();
    return (snap.exists && typeof snap.data().phoneNumber === 'string') ? snap.data().phoneNumber : '';
  } catch (error) {
    console.warn('⚠️ Could not read private phone:', (error && error.code) || error);
    return '';
  }
}

// Generate referral code
function generateReferralCode(userId) {
  const shortId = userId.substring(0, 8).toUpperCase();
  return `GISUGO-${shortId}-REFER`;
}

/**
 * Check if user has a complete GISUGO profile in Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<Object>} - { hasProfile: boolean, profile: Object|null }
 */
async function checkUserHasProfile(userId) {
  if (!userId) {
    return { hasProfile: false, profile: null };
  }
  
  try {
    const profile = await getUserProfile(userId);
    
    // Check if profile exists AND has required fields (fullName at minimum)
    const hasProfile = profile !== null && profile.fullName && profile.fullName.trim() !== '';
    
    console.log(`🔍 Profile check for ${userId}: ${hasProfile ? '✅ Has profile' : '❌ No profile'}`);
    
    return { 
      hasProfile, 
      profile,
      missingFields: !hasProfile ? getMissingProfileFields(profile) : []
    };
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
    return { hasProfile: false, profile: null, error };
  }
}

/**
 * Get list of missing required profile fields
 * @param {Object|null} profile - User profile
 * @returns {Array} - List of missing field names
 */
function getMissingProfileFields(profile) {
  const requiredFields = ['fullName'];
  
  if (!profile) {
    return requiredFields;
  }
  
  return requiredFields.filter(field => !profile[field] || profile[field].toString().trim() === '');
}

/**
 * Handle post-authentication redirect based on profile status
 * @param {Object} user - Firebase user object
 * @param {string} defaultRedirect - Where to redirect if profile exists (default: index.html)
 * @param {string} signupRedirect - Where to redirect if no profile (default: sign-up.html)
 */
async function handleAuthRedirect(user, defaultRedirect = 'index.html', signupRedirect = 'sign-up.html') {
  if (!user) {
    console.log('⚠️ No user provided for redirect');
    return;
  }
  
  console.log('🔄 Checking profile for redirect...');
  
  const { hasProfile, profile } = await checkUserHasProfile(user.uid);
  
  if (hasProfile) {
    console.log('✅ Profile found - redirecting to:', defaultRedirect);
    window.location.href = defaultRedirect;
  } else {
    console.log('❌ No profile - redirecting to:', signupRedirect);
    // Store auth info for sign-up page to use
    sessionStorage.setItem('gisugo_pending_auth', JSON.stringify({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      provider: (Array.isArray(user.providerData) && user.providerData[0] && user.providerData[0].providerId) || 'unknown'
    }));
    window.location.href = signupRedirect;
  }
}

// ============================================================================
// EMAIL VERIFICATION ACCESS GATE
// ============================================================================

const EMAIL_VERIFICATION_GATE_STYLE_ID = 'gisugo-email-gate-styles';
const EMAIL_VERIFICATION_GATE_OVERLAY_ID = 'gisugoEmailVerificationGateOverlay';

function ensureEmailVerificationGateStyles() {
  if (document.getElementById(EMAIL_VERIFICATION_GATE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = EMAIL_VERIFICATION_GATE_STYLE_ID;
  style.textContent = `
    #${EMAIL_VERIFICATION_GATE_OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(7, 12, 22, 0.68);
      backdrop-filter: blur(4px);
    }
    #${EMAIL_VERIFICATION_GATE_OVERLAY_ID}.show {
      display: flex;
    }
    .email-gate-modal {
      width: min(500px, 100%);
      border-radius: 18px;
      border: 1px solid rgba(130, 148, 177, 0.32);
      background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
      color: #f8fafc;
      box-shadow: 0 25px 55px rgba(0, 0, 0, 0.45);
      padding: 22px 20px;
      font-family: inherit;
    }
    .email-gate-title {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: 0.01em;
    }
    .email-gate-copy {
      margin: 0;
      color: #d7e1ef;
      font-size: 0.96rem;
      line-height: 1.45;
    }
    .email-gate-actions {
      margin-top: 16px;
      display: grid;
      gap: 9px;
    }
    .email-gate-btn {
      border: none;
      border-radius: 12px;
      padding: 11px 13px;
      font-size: 0.93rem;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.14s ease, opacity 0.14s ease;
    }
    .email-gate-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
    .email-gate-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    .email-gate-btn-primary {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: #111827;
    }
    .email-gate-btn-secondary {
      background: rgba(148, 163, 184, 0.2);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    .email-gate-note {
      margin-top: 10px;
      min-height: 1.2em;
      font-size: 0.84rem;
      color: #fde68a;
    }
  `;

  document.head.appendChild(style);
}

function ensureEmailVerificationGateModal() {
  let overlay = document.getElementById(EMAIL_VERIFICATION_GATE_OVERLAY_ID);
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = EMAIL_VERIFICATION_GATE_OVERLAY_ID;
  overlay.innerHTML = `
    <div class="email-gate-modal" role="dialog" aria-modal="true" aria-labelledby="emailGateTitle">
      <h2 class="email-gate-title" id="emailGateTitle">Verify your email first</h2>
      <p class="email-gate-copy" id="emailGateCopy"></p>
      <div class="email-gate-actions">
        <button type="button" class="email-gate-btn email-gate-btn-primary" id="emailGateResendBtn">RESEND VERIFICATION EMAIL</button>
        <button type="button" class="email-gate-btn email-gate-btn-secondary" id="emailGateRefreshBtn">I ALREADY VERIFIED, REFRESH</button>
        <button type="button" class="email-gate-btn email-gate-btn-secondary" id="emailGateHomeBtn">GO TO HOME</button>
      </div>
      <div class="email-gate-note" id="emailGateNote"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

async function resolveCurrentAuthUser(timeoutMs = 4500) {
  const auth = getFirebaseAuth();
  if (!auth) return getCurrentUser();

  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (_) {}
      }
      resolve(user || auth.currentUser || null);
    };
    unsubscribe = auth.onAuthStateChanged((user) => finish(user), () => finish(auth.currentUser || null));
    const timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
}

function userNeedsEmailVerification(user) {
  if (!user) return false;
  if (!user.email) return false;
  const providerIds = Array.isArray(user.providerData)
    ? user.providerData.map((provider) => provider && provider.providerId).filter(Boolean)
    : [];
  const hasEmailPasswordProvider = providerIds.includes('password') || providerIds.includes('emailLink');
  if (!hasEmailPasswordProvider) {
    return false;
  }
  return user.emailVerified === false;
}

function showEmailVerificationGateModal(user, pageName = 'this page') {
  ensureEmailVerificationGateStyles();
  const overlay = ensureEmailVerificationGateModal();
  const copyEl = overlay.querySelector('#emailGateCopy');
  const noteEl = overlay.querySelector('#emailGateNote');
  const resendBtn = overlay.querySelector('#emailGateResendBtn');
  const refreshBtn = overlay.querySelector('#emailGateRefreshBtn');
  const homeBtn = overlay.querySelector('#emailGateHomeBtn');

  if (copyEl) {
    copyEl.textContent = `Your account is created, but email verification is required before opening ${pageName}. Check your inbox for ${user.email}. If you do not see it, check Spam/Junk and mark it as Not Spam.`;
  }
  if (noteEl) noteEl.textContent = '';

  if (resendBtn && !resendBtn.dataset.bound) {
    resendBtn.dataset.bound = '1';
    resendBtn.addEventListener('click', async () => {
      resendBtn.disabled = true;
      const originalText = resendBtn.textContent;
      resendBtn.textContent = 'SENDING...';
      try {
        const authUser = await resolveCurrentAuthUser(2500);
        if (!authUser) {
          throw new Error('No authenticated user found.');
        }
        const actionSettings = getEmailVerificationActionSettings();
        if (actionSettings) {
          await authUser.sendEmailVerification(actionSettings);
        } else {
          await authUser.sendEmailVerification();
        }
        if (noteEl) noteEl.textContent = 'Verification email sent. Please check Inbox and Spam/Junk.';
      } catch (error) {
        console.warn('⚠️ Failed to resend verification email:', error);
        if (noteEl) noteEl.textContent = 'Could not send right now. Please try again in a moment.';
      } finally {
        setTimeout(() => {
          resendBtn.disabled = false;
          resendBtn.textContent = originalText;
        }, 1400);
      }
    });
  }

  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.dataset.bound = '1';
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      const originalText = refreshBtn.textContent;
      refreshBtn.textContent = 'CHECKING...';
      try {
        const authUser = await resolveCurrentAuthUser(2500);
        if (!authUser) throw new Error('No authenticated user found.');
        await authUser.reload();
        if (authUser.emailVerified) {
          overlay.classList.remove('show');
          window.__gisugoEmailVerificationBlocked = false;
          window.location.reload();
          return;
        }
        if (noteEl) noteEl.textContent = 'Email is still not verified. Open the link first, then tap refresh.';
      } catch (error) {
        console.warn('⚠️ Failed to refresh verification status:', error);
        if (noteEl) noteEl.textContent = 'Could not refresh status. Please try again.';
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalText;
      }
    });
  }

  if (homeBtn && !homeBtn.dataset.bound) {
    homeBtn.dataset.bound = '1';
    homeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  overlay.classList.add('show');
}

async function requireVerifiedEmailForPage(options = {}) {
  const pageName = options.pageName || 'this page';
  const redirectOnUnauth = options.redirectOnUnauth || '';
  const allowUnverified = options.allowUnverified === true;
  window.__gisugoEmailVerificationBlocked = false;

  const user = await resolveCurrentAuthUser();
  if (!user) {
    if (redirectOnUnauth) {
      window.location.href = redirectOnUnauth;
    }
    return false;
  }

  if (!userNeedsEmailVerification(user)) {
    return true;
  }

  if (allowUnverified) {
    return true;
  }

  window.__gisugoEmailVerificationBlocked = true;
  showEmailVerificationGateModal(user, pageName);
  return false;
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make functions globally available
window.onAuthStateChange = onAuthStateChange;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.isLoggedIn = isLoggedIn;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.loginWithEmail = loginWithEmail;
window.logout = logout;
window.createUserProfile = createUserProfile;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.savePrivatePhone = savePrivatePhone;
window.getPrivatePhone = getPrivatePhone;
window.checkUserHasProfile = checkUserHasProfile;
window.handleAuthRedirect = handleAuthRedirect;
window.requireVerifiedEmailForPage = requireVerifiedEmailForPage;

console.log('📦 Firebase auth module loaded');

