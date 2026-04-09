// ============================================================================
// 🔥 FIREBASE CONFIGURATION - GISUGO
// ============================================================================
// 
// SETUP INSTRUCTIONS:
// 1. Go to Firebase Console: https://console.firebase.google.com
// 2. Select your GISUGO project
// 3. Click Settings (gear icon) > Project settings
// 4. Scroll to "Your apps" section
// 5. If no web app exists, click "</>" to add one
// 6. Copy your config values and replace the placeholders below
//
// ============================================================================

// Firebase configuration object - GISUGO PRODUCTION CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyC5w-ITUnCDaA-ZXTmwAwgGo1mErS-k-BE",
  authDomain: "gisugo1.firebaseapp.com",
  projectId: "gisugo1",
  storageBucket: "gisugo1.firebasestorage.app",
  messagingSenderId: "380568649178",
  appId: "1:380568649178:web:725c745becbb89412094e3"
};

// Optional: Firebase Web Push certificate key (Project Settings -> Cloud Messaging)
// Keep empty to let SDK fall back to project defaults.
const GISUGO_PUSH_VAPID_KEY = "";

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

// Check if Firebase SDK is loaded
function isFirebaseLoaded() {
  return typeof firebase !== 'undefined';
}

// Initialize Firebase
let firebaseApp = null;
let firebaseInitialized = false;
let firestorePersistenceAttempted = false;

function isIOSWebKit() {
  try {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/i.test(ua) || touchMac;
  } catch (error) {
    return false;
  }
}

function enableFirestorePersistenceSafely() {
  if (firestorePersistenceAttempted || !firebase.firestore) return;
  firestorePersistenceAttempted = true;

  const db = firebase.firestore();
  const isIOS = isIOSWebKit();

  // Improve Safari transport reliability. Apply custom transport settings only
  // on iOS WebKit to avoid unnecessary host/settings warnings elsewhere.
  if (isIOS) {
    try {
      db.settings({
        experimentalAutoDetectLongPolling: true,
        experimentalForceLongPolling: true,
        useFetchStreams: false
      });
      console.log('🧭 iOS Firestore transport fallback enabled (long-polling mode)');
    } catch (settingsError) {
      console.warn('⚠️ Firestore settings() skipped:', settingsError);
    }
  }

  // iOS Safari is more stable with single-tab persistence mode.
  const primaryOptions = isIOS ? { synchronizeTabs: false } : { synchronizeTabs: true };
  db.enablePersistence(primaryOptions)
    .then(() => {
      console.log(`💾 Firestore offline persistence enabled (${isIOS ? 'single-tab iOS mode' : 'multi-tab mode'})`);
    })
    .catch((error) => {
      const code = error && error.code ? error.code : 'unknown';
      console.warn(`⚠️ Firestore persistence setup issue (${code})`, error);

      // Retry without synchronizeTabs if multi-tab precondition fails.
      if (!isIOS && code === 'failed-precondition') {
        db.enablePersistence({ synchronizeTabs: false })
          .then(() => {
            console.log('💾 Firestore persistence enabled after single-tab fallback');
          })
          .catch((retryError) => {
            console.warn('⚠️ Firestore persistence disabled after fallback:', retryError);
          });
      }
      // App continues to work without persistence.
    });
}

function initializeFirebase() {
  if (firebaseInitialized) {
    console.log('🔥 Firebase already initialized');
    return true;
  }

  if (!isFirebaseLoaded()) {
    console.error('❌ Firebase SDK not loaded. Make sure to include Firebase scripts in your HTML.');
    return false;
  }

  // Check if config is still placeholder
  if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
    console.warn('⚠️ Firebase config contains placeholder values. Please update firebase-config.js with your actual Firebase credentials.');
    console.warn('⚠️ Running in OFFLINE MODE - using localStorage fallback');
    return false;
  }

  try {
    // Check if storage is available (Edge Tracking Prevention can block it)
    let storageAvailable = true;
    try {
      localStorage.setItem('_test', '1');
      localStorage.removeItem('_test');
    } catch (e) {
      storageAvailable = false;
      console.error('🚫 Storage blocked by browser (Tracking Prevention?)');
      console.warn('💡 In Edge: Go to edge://settings/privacy → Set Tracking prevention to Basic');
    }
    
    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.apps[0];
    }
    
    // Set auth persistence to LOCAL for consistent behavior across browsers
    // This ensures auth state persists across browser sessions
    if (firebase.auth) {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
          console.log('🔐 Auth persistence set to LOCAL');
          if (!storageAvailable) {
            console.warn('⚠️ Auth persistence may not work - storage is blocked');
          }
        })
        .catch((error) => {
          console.warn('⚠️ Could not set auth persistence:', error);
        });
    }
    
    // ═══════════════════════════════════════════════════════════════
    // ENABLE FIRESTORE OFFLINE PERSISTENCE
    // ═══════════════════════════════════════════════════════════════
    // Cache Firestore data locally for faster loads and offline access
    // Saves 600-900ms on repeat page visits by using local cache
    //
    // ⚠️ FUTURE FIREBASE SDK UPGRADE (v11+) - UPDATE THIS CODE:
    // When upgrading Firebase SDK beyond v10.x, replace this block with:
    //
    //   firebase.firestore().settings({
    //     cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    //     experimentalForceLongPolling: false,
    //     experimentalAutoDetectLongPolling: true
    //   });
    //
    // Current method works but is deprecated in future versions.
    // If you see error: "enablePersistence is not a function" - use code above
    // ═══════════════════════════════════════════════════════════════
    enableFirestorePersistenceSafely();
    
    firebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Project ID:', firebaseConfig.projectId);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    return false;
  }
}

// ============================================================================
// FIREBASE SERVICE GETTERS
// ============================================================================

// Get Firebase Auth instance
function getFirebaseAuth() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  
  if (firebaseInitialized && typeof firebase !== 'undefined') {
    return firebase.auth();
  }
  return null;
}

// Get Firestore instance
function getFirestore() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  
  if (firebaseInitialized && typeof firebase !== 'undefined') {
    return firebase.firestore();
  }
  return null;
}

// Get Firebase Storage instance
function getFirebaseStorage() {
  if (!firebaseInitialized) {
    initializeFirebase();
  }
  
  if (firebaseInitialized && typeof firebase !== 'undefined') {
    return firebase.storage();
  }
  return null;
}

// ============================================================================
// OFFLINE MODE DETECTION
// ============================================================================

// Check if Firebase is properly configured and running
function isFirebaseOnline() {
  return firebaseInitialized && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
}

// Get data source mode for logging
function getDataSourceMode() {
  return isFirebaseOnline() ? 'FIREBASE' : 'LOCALSTORAGE';
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make functions globally available
window.firebaseConfig = firebaseConfig;
window.initializeFirebase = initializeFirebase;
window.isFirebaseLoaded = isFirebaseLoaded;
window.isFirebaseOnline = isFirebaseOnline;
window.getDataSourceMode = getDataSourceMode;
window.getFirebaseAuth = getFirebaseAuth;
window.getFirestore = getFirestore;
window.getFirebaseStorage = getFirebaseStorage;
window.GISUGO_PUSH_VAPID_KEY = GISUGO_PUSH_VAPID_KEY;

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
  const initialized = initializeFirebase();
  console.log(`🔥 Firebase Status: ${initialized ? 'ONLINE' : 'OFFLINE (localStorage fallback)'}`);
});

console.log('📦 Firebase config module loaded');

