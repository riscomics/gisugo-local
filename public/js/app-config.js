// ========================== GISUGO APP CONFIG ==========================
// Central configuration for dev/production mode and Firebase features
// All pages should import this file and check these settings
// Toggle via Admin Dashboard > Settings > Development Tools
// ========================================================================

const APP_CONFIG = {
  // ===== MASTER DEV MODE =====
  // When true: All features accessible without login, uses mock data
  // When false: Full Firebase enforcement (auth required, live data)
  // Controlled by: Admin Dashboard toggle OR localStorage
  get devMode() {
    // Check localStorage first (set by admin dashboard)
    const stored = localStorage.getItem('gisugo_dev_mode');
    if (stored !== null) {
      return stored === 'true';
    }
    // Default to false for production (Firebase mode)
    return false;
  },
  
  set devMode(value) {
    localStorage.setItem('gisugo_dev_mode', value.toString());
    console.log(`🔧 Dev Mode: ${value ? 'ON' : 'OFF'}`);
  },

  // ===== FIREBASE STATUS =====
  // Read-only: Checks if Firebase is actually configured
  get isFirebaseConnected() {
    return typeof firebase !== 'undefined' && 
           firebase.apps && 
           firebase.apps.length > 0;
  },

  // ===== HELPER METHODS =====
  
  // Should we enforce authentication?
  requireAuth() {
    return !this.devMode && this.isFirebaseConnected;
  },
  
  // Should we use mock data?
  useMockData() {
    return this.devMode || !this.isFirebaseConnected;
  },
  
  // Should we use Firebase data?
  useFirebaseData() {
    return !this.devMode && this.isFirebaseConnected;
  },

  // ===== FUTURE FEATURE FLAGS =====
  // Add new toggles here as we implement Firebase features
  // Example:
  // get requireAuthForPosting() { ... }
  // get requireAuthForMessaging() { ... }
  // get useFirebaseStorage() { ... }

  // ===== DEBUG INFO =====
  logStatus() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 GISUGO App Config');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Dev Mode: ${this.devMode ? '✅ ON' : '❌ OFF'}`);
    console.log(`   Firebase: ${this.isFirebaseConnected ? '🟢 Connected' : '🔴 Not Connected'}`);
    console.log(`   Auth Required: ${this.requireAuth() ? 'Yes' : 'No'}`);
    console.log(`   Data Source: ${this.useMockData() ? 'Mock Data' : 'Firebase'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
};

// Log status on load (helpful for debugging)
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  // Uncomment to see status on every page load:
  // document.addEventListener('DOMContentLoaded', () => APP_CONFIG.logStatus());
}

