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
function getCurrentUser() {
  const auth = getFirebaseAuth();
  if (auth) {
    return auth.currentUser;
  }
  
  // Fallback to localStorage for offline mode
  const storedUser = localStorage.getItem('gisugo_current_user');
  return storedUser ? JSON.parse(storedUser) : null;
}

// Get current user ID
function getCurrentUserId() {
  const user = getCurrentUser();
  if (user) {
    return user.uid || user.userId || user.id;
  }
  return null;
}

// Check if user is logged in
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// ============================================================================
// SIGN UP
// ============================================================================

/**
 * Create a new user account with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password (min 6 characters)
 * @param {Object} profileData - Additional profile data to store
 * @returns {Promise<Object>} - Result object with success status and user/error
 */
async function signUpWithEmail(email, password, profileData = {}) {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    // Offline mode - create mock user in localStorage
    console.log('⚠️ Firebase offline - creating mock user');
    return createMockUser(email, profileData);
  }
  
  try {
    console.log('🔐 Creating user account...');
    
    // Create user with email and password
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('✅ User account created:', user.uid);
    
    // Update display name if provided
    if (profileData.fullName) {
      await user.updateProfile({
        displayName: profileData.fullName,
        photoURL: profileData.profilePhoto || null
      });
    }
    
    // Create user profile document in Firestore
    const db = getFirestore();
    if (db) {
      await createUserProfile(user.uid, {
        email: email,
        ...profileData,
        accountCreated: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      success: true,
      user: user,
      message: 'Account created successfully!'
    };
    
  } catch (error) {
    console.error('❌ Sign up error:', error);
    
    // Parse Firebase error codes to user-friendly messages
    let errorMessage = 'Failed to create account. Please try again.';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered. Please login instead.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password must be at least 6 characters long.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Email/password sign up is not enabled. Please contact support.';
        break;
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
  }
}

// Create mock user for offline mode
function createMockUser(email, profileData) {
  const mockUserId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  const mockUser = {
    uid: mockUserId,
    email: email,
    displayName: profileData.fullName || email.split('@')[0],
    photoURL: profileData.profilePhoto || null,
    emailVerified: false,
    isAnonymous: false,
    metadata: {
      creationTime: new Date().toISOString(),
      lastSignInTime: new Date().toISOString()
    }
  };
  
  // Store in localStorage
  localStorage.setItem('gisugo_current_user', JSON.stringify(mockUser));
  
  // Also store full profile
  const fullProfile = {
    ...mockUser,
    ...profileData,
    userId: mockUserId,
    accountCreated: new Date().toISOString()
  };
  
  // Store in users collection (localStorage)
  const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
  users[mockUserId] = fullProfile;
  localStorage.setItem('gisugo_users', JSON.stringify(users));
  
  console.log('✅ Mock user created:', mockUserId);
  
  // Notify listeners
  authStateListeners.forEach(cb => cb(mockUser));
  
  return {
    success: true,
    user: mockUser,
    message: 'Account created successfully! (Offline mode)'
  };
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Sign in with email and password
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @returns {Promise<Object>} - Result object with success status and user/error
 */
async function loginWithEmail(email, password) {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    // Offline mode - check localStorage
    console.log('⚠️ Firebase offline - checking localStorage');
    return loginMockUser(email, password);
  }
  
  try {
    console.log('🔐 Signing in...');
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    console.log('✅ Login successful:', user.uid);
    
    // Update last login timestamp in Firestore
    const db = getFirestore();
    if (db) {
      await db.collection('users').doc(user.uid).update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      success: true,
      user: user,
      message: 'Welcome back!'
    };
    
  } catch (error) {
    console.error('❌ Login error:', error);
    
    let errorMessage = 'Login failed. Please check your credentials.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email. Please sign up first.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password. Please try again.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled. Please contact support.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later.';
        break;
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
  }
}

// Login mock user for offline mode
function loginMockUser(email, password) {
  const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
  
  // Find user by email
  const userEntry = Object.entries(users).find(([id, user]) => user.email === email);
  
  if (!userEntry) {
    return {
      success: false,
      error: { code: 'auth/user-not-found' },
      message: 'No account found with this email. Please sign up first.'
    };
  }
  
  const [userId, userData] = userEntry;
  
  // In offline mode, we skip password verification (for demo purposes)
  // In production, this would never happen as Firebase handles auth
  
  const mockUser = {
    uid: userId,
    email: userData.email,
    displayName: userData.fullName || userData.displayName,
    photoURL: userData.profilePhoto || userData.photoURL,
    emailVerified: false,
    isAnonymous: false
  };
  
  localStorage.setItem('gisugo_current_user', JSON.stringify(mockUser));
  
  // Notify listeners
  authStateListeners.forEach(cb => cb(mockUser));
  
  return {
    success: true,
    user: mockUser,
    message: 'Welcome back! (Offline mode)'
  };
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
    console.log('🔐 Starting Google sign-in...');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    
    console.log('✅ Google sign-in successful:', user.uid);
    
    // DON'T auto-create profile here - let sign-up form handle it
    // Just update last login if profile already exists
    const db = getFirestore();
    if (db) {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        // Existing user - update last login
        await db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      // If profile doesn't exist, don't create it - redirect will send to sign-up
    }
    
    return {
      success: true,
      user: user,
      isNewUser: result.additionalUserInfo?.isNewUser || false,
      message: result.additionalUserInfo?.isNewUser ? 
        'Welcome to GISUGO!' : 'Welcome back!'
    };
    
  } catch (error) {
    console.error('❌ Google sign-in error:', error);
    
    let errorMessage = 'Google sign-in failed. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up blocked. Please allow pop-ups for this site.';
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
  }
}

// ============================================================================
// PHONE NUMBER AUTHENTICATION
// ============================================================================

// Store verification ID globally for OTP verification
let phoneVerificationId = null;
let phoneRecaptchaVerifier = null;

/**
 * Initialize reCAPTCHA verifier for phone auth
 * @param {string} buttonId - ID of the button element to attach reCAPTCHA
 * @returns {Object} - reCAPTCHA verifier instance
 */
function initPhoneRecaptcha(buttonId = 'phone-signin-btn') {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    console.error('Firebase Auth not available');
    return null;
  }
  
  // Clear existing verifier if any
  if (phoneRecaptchaVerifier) {
    phoneRecaptchaVerifier.clear();
  }
  
  try {
    phoneRecaptchaVerifier = new firebase.auth.RecaptchaVerifier(buttonId, {
      'size': 'invisible',
      'callback': (response) => {
        console.log('✅ reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('⚠️ reCAPTCHA expired, please try again');
      }
    });
    
    return phoneRecaptchaVerifier;
  } catch (error) {
    console.error('❌ reCAPTCHA initialization error:', error);
    return null;
  }
}

/**
 * Send verification code to phone number
 * @param {string} phoneNumber - Phone number with country code (e.g., +639123456789)
 * @returns {Promise<Object>} - Result object with success status
 */
async function sendPhoneVerificationCode(phoneNumber) {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Phone sign-in requires Firebase. Please configure Firebase first.'
    };
  }
  
  // Validate phone number format
  if (!phoneNumber || !phoneNumber.startsWith('+')) {
    return {
      success: false,
      message: 'Please enter phone number with country code (e.g., +639123456789)'
    };
  }
  
  try {
    console.log('📱 Sending verification code to:', phoneNumber);
    
    // Initialize reCAPTCHA if not already done
    if (!phoneRecaptchaVerifier) {
      initPhoneRecaptcha('phone-signin-btn');
    }
    
    // Send verification code
    const confirmationResult = await auth.signInWithPhoneNumber(phoneNumber, phoneRecaptchaVerifier);
    
    // Store verification ID for later use
    phoneVerificationId = confirmationResult.verificationId;
    window.phoneConfirmationResult = confirmationResult;
    
    console.log('✅ Verification code sent');
    
    return {
      success: true,
      message: 'Verification code sent! Check your SMS.'
    };
    
  } catch (error) {
    console.error('❌ Phone verification error:', error);
    
    let errorMessage = 'Failed to send verification code. Please try again.';
    
    switch (error.code) {
      case 'auth/invalid-phone-number':
        errorMessage = 'Invalid phone number format. Use +639XXXXXXXXX';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many attempts. Please try again later.';
        break;
      case 'auth/quota-exceeded':
        errorMessage = 'SMS quota exceeded. Please try again tomorrow.';
        break;
      case 'auth/captcha-check-failed':
        errorMessage = 'Security check failed. Please refresh and try again.';
        break;
    }
    
    // Reset reCAPTCHA on error
    if (phoneRecaptchaVerifier) {
      phoneRecaptchaVerifier.clear();
      phoneRecaptchaVerifier = null;
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
  }
}

/**
 * Verify the OTP code and complete phone sign-in
 * @param {string} verificationCode - 6-digit code from SMS
 * @param {Object} profileData - Optional profile data for new users
 * @returns {Promise<Object>} - Result object with success status and user
 */
async function verifyPhoneCode(verificationCode, profileData = {}) {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Phone sign-in requires Firebase. Please configure Firebase first.'
    };
  }
  
  if (!window.phoneConfirmationResult) {
    return {
      success: false,
      message: 'Please request a verification code first.'
    };
  }
  
  try {
    console.log('🔐 Verifying code...');
    
    const result = await window.phoneConfirmationResult.confirm(verificationCode);
    const user = result.user;
    
    console.log('✅ Phone sign-in successful:', user.uid);
    
    // DON'T auto-create profile here - let sign-up form handle it
    // Just update last login if profile already exists
    const db = getFirestore();
    let isNewUser = false;
    
    if (db) {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        // Existing user - update last login
        await db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        isNewUser = false;
      } else {
        // New user - don't create profile, let redirect handle it
        isNewUser = true;
      }
    }
    
    return {
      success: true,
      user: user,
      isNewUser: isNewUser,
      message: isNewUser ? 'Welcome to GISUGO!' : 'Welcome back!'
    };
    
  } catch (error) {
    console.error('❌ Code verification error:', error);
    
    let errorMessage = 'Invalid verification code. Please try again.';
    
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'Invalid code. Please check and try again.';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'Code expired. Please request a new one.';
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
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
    console.log('🔐 Starting Facebook sign-in...');
    
    const provider = new firebase.auth.FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');
    
    const result = await auth.signInWithPopup(provider);
    const user = result.user;
    
    console.log('✅ Facebook sign-in successful:', user.uid);
    
    // DON'T auto-create profile here - let sign-up form handle it
    // Just update last login if profile already exists
    const db = getFirestore();
    if (db) {
      const userDoc = await db.collection('users').doc(user.uid).get();
      
      if (userDoc.exists) {
        // Existing user - update last login
        await db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      // If profile doesn't exist, don't create it - redirect will send to sign-up
    }
    
    return {
      success: true,
      user: user,
      isNewUser: result.additionalUserInfo?.isNewUser || false,
      message: result.additionalUserInfo?.isNewUser ? 
        'Welcome to GISUGO!' : 'Welcome back!'
    };
    
  } catch (error) {
    console.error('❌ Facebook sign-in error:', error);
    
    let errorMessage = 'Facebook sign-in failed. Please try again.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'Sign-in cancelled.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'Pop-up blocked. Please allow pop-ups for this site.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'An account already exists with the same email. Try signing in with a different method.';
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
  }
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
// PASSWORD RESET
// ============================================================================

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} - Result object with success status
 */
async function sendPasswordReset(email) {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Password reset requires Firebase. Please configure Firebase first.'
    };
  }
  
  try {
    await auth.sendPasswordResetEmail(email);
    console.log('✅ Password reset email sent');
    
    return {
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    };
    
  } catch (error) {
    console.error('❌ Password reset error:', error);
    
    let errorMessage = 'Failed to send password reset email.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Please enter a valid email address.';
    }
    
    return {
      success: false,
      error: error,
      message: errorMessage
    };
  }
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
        businessVerified: false,
        proVerified: false,
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
      }
    };
    
    // Merge with provided data
    const finalProfile = {
      ...defaultProfile,
      ...profileData,
      verification: { ...defaultProfile.verification, ...(profileData.verification || {}) },
      wallet: { ...defaultProfile.wallet, ...(profileData.wallet || {}) },
      referral: { ...defaultProfile.referral, ...(profileData.referral || {}) }
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
  const requiredFields = ['fullName', 'phoneNumber', 'dateOfBirth'];
  
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
      provider: user.providerData?.[0]?.providerId || 'unknown'
    }));
    window.location.href = signupRedirect;
  }
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make functions globally available
window.onAuthStateChange = onAuthStateChange;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.isLoggedIn = isLoggedIn;
window.signUpWithEmail = signUpWithEmail;
window.loginWithEmail = loginWithEmail;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.initPhoneRecaptcha = initPhoneRecaptcha;
window.sendPhoneVerificationCode = sendPhoneVerificationCode;
window.verifyPhoneCode = verifyPhoneCode;
window.logout = logout;
window.sendPasswordReset = sendPasswordReset;
window.createUserProfile = createUserProfile;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.checkUserHasProfile = checkUserHasProfile;
window.handleAuthRedirect = handleAuthRedirect;

console.log('📦 Firebase auth module loaded');

