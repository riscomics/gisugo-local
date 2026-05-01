// ============================================================================
// GISUGO DATA SERVICE
// ============================================================================
// Central utility for loading data from Firebase.
// Mock-data runtime mode is retired by production policy.
// ============================================================================

const DataService = {
  _isLocalDevRuntime() {
    if (typeof window === 'undefined' || !window.location) return false;
    const host = String(window.location.hostname || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || window.location.protocol === 'file:';
  },
  
  // ===== MODE DETECTION =====
  
  /**
   * Check if we should use Firebase (production mode)
   * @returns {boolean}
   */
  useFirebase() {
    if (typeof APP_CONFIG !== 'undefined' && typeof APP_CONFIG.useFirebaseData === 'function') {
      return APP_CONFIG.useFirebaseData();
    }
    return this._isFirebaseConnected();
  },
  
  /**
   * Check if we should use Mock data (development mode)
   * @returns {boolean}
   */
  useMock() {
    return false;
  },
  
  /**
   * Get current mode as string
   * @returns {'firebase' | 'mock'}
   */
  getMode() {
    return this.useFirebase() ? 'firebase' : 'unavailable';
  },
  
  /**
   * Set the data mode
   * @param {'firebase' | 'mock'} mode
   */
  setMode(_mode) {
    if (typeof APP_CONFIG !== 'undefined') {
      APP_CONFIG.devMode = false;
    }
    console.warn('🚫 DataService.setMode ignored: mock mode is retired.');
  },
  
  // ===== HELPER METHODS =====
  
  /**
   * Check if Firebase is connected
   * @private
   */
  _isFirebaseConnected() {
    return typeof firebase !== 'undefined' && 
           firebase.apps && 
           firebase.apps.length > 0;
  },
  
  /**
   * Check if user is authenticated
   * @returns {Promise<firebase.User|null>}
   */
  async getCurrentUser() {
    if (!this._isFirebaseConnected()) {
      return null;
    }
    
    return new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, 5000);
    });
  },
  
  /**
   * Wait for auth to be ready, then return user
   * @returns {Promise<firebase.User|null>}
   */
  async waitForAuth() {
    if (!this._isFirebaseConnected()) {
      console.log('📋 DataService: Firebase not connected');
      return null;
    }
    
    // If already have a user, return immediately
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      return currentUser;
    }
    
    // Otherwise wait for auth state
    return this.getCurrentUser();
  },
  
  // ===== LOADING STATE HELPERS =====
  
  /**
   * Show a loading state element
   * @param {string} elementId - ID of loading element to show
   */
  showLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.style.display = 'flex';
      el.classList.add('show');
    }
  },
  
  /**
   * Hide a loading state element
   * @param {string} elementId - ID of loading element to hide
   */
  hideLoading(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
      el.style.display = 'none';
      el.classList.remove('show');
    }
  },
  
  // ===== GENERIC DATA LOADER =====
  
  /**
   * Load data from Firebase only.
   * @param {Object} options
   * @param {Function} options.firebaseLoader - Async function to load from Firebase
   * @param {string} [options.loadingElementId] - Optional loading element ID
   * @returns {Promise<any>}
   */
  async load({ firebaseLoader, loadingElementId }) {
    // Show loading if element provided
    if (loadingElementId) {
      this.showLoading(loadingElementId);
    }
    
    try {
      if (!this.useFirebase()) {
        throw new Error('Firebase backend unavailable');
      }
      console.log('🔥 DataService: Loading from Firebase...');
      const data = await firebaseLoader();
      return data;
      
    } catch (error) {
      console.error('❌ DataService: Load error:', error);
      throw error;
      
    } finally {
      // Hide loading if element provided
      if (loadingElementId) {
        this.hideLoading(loadingElementId);
      }
    }
  },
  
  // ===== DEBUG =====
  
  /**
   * Log current status
   */
  logStatus() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 GISUGO Data Service Status');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Mode: ${this.getMode().toUpperCase()}`);
    console.log(`   Firebase Connected: ${this._isFirebaseConnected() ? '✅' : '❌'}`);
    console.log('   Mock Mode: 🚫 Retired');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.DataService = DataService;
}

console.log('📦 Data Service module loaded');

