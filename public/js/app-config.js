// ========================== GISUGO APP CONFIG ==========================
// Central configuration for dev/production mode and Firebase features
// All pages should import this file and check these settings
// Toggle via Admin Dashboard > Settings > Development Tools
// ========================================================================

const APP_CONFIG = {
  // ===== DEV MODE (RETIRED) =====
  // Production policy: mock-data runtime mode is disabled.
  get devMode() {
    return false;
  },
  
  set devMode(_value) {
    try {
      localStorage.removeItem('gisugo_dev_mode');
    } catch (_error) {
      // Ignore storage failures; mode remains disabled regardless.
    }
    console.warn('🚫 Dev Mode toggle ignored: mock data mode is retired.');
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
    return true;
  },
  
  // Should we use mock data?
  useMockData() {
    return false;
  },
  
  // Should we use Firebase data?
  useFirebaseData() {
    return this.isFirebaseConnected;
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
    console.log('   Dev Mode: 🚫 Retired');
    console.log(`   Firebase: ${this.isFirebaseConnected ? '🟢 Connected' : '🔴 Not Connected'}`);
    console.log(`   Auth Required: ${this.requireAuth() ? 'Yes' : 'No'}`);
    console.log(`   Data Source: ${this.useFirebaseData() ? 'Firebase' : 'Unavailable'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
};

// Log status on load (helpful for debugging)
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
  // Uncomment to see status on every page load:
  // document.addEventListener('DOMContentLoaded', () => APP_CONFIG.logStatus());
}

