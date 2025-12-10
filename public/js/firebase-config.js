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

// Firebase configuration object - REPLACE THESE WITH YOUR ACTUAL VALUES
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

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
    // Initialize Firebase app
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.apps[0];
    }
    
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

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
  const initialized = initializeFirebase();
  console.log(`🔥 Firebase Status: ${initialized ? 'ONLINE' : 'OFFLINE (localStorage fallback)'}`);
});

console.log('📦 Firebase config module loaded');

