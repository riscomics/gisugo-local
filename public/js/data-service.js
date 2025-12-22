// ============================================================================
// GISUGO DATA SERVICE
// ============================================================================
// Central utility for loading data with clean Mock/Firebase separation
// 
// USAGE:
//   if (DataService.useFirebase()) {
//     // Load from Firebase ONLY
//   } else {
//     // Load from Mock ONLY
//   }
//
// TOGGLE:
//   DataService.setMode('firebase')  → Use real Firebase data
//   DataService.setMode('mock')      → Use mock data for testing
//
// ============================================================================

const DataService = {
  
  // ===== MODE DETECTION =====
  
  /**
   * Check if we should use Firebase (production mode)
   * @returns {boolean}
   */
  useFirebase() {
    // Check APP_CONFIG if available
    if (typeof APP_CONFIG !== 'undefined') {
      return APP_CONFIG.useFirebaseData();
    }
    
    // Fallback: check localStorage directly
    const devMode = localStorage.getItem('gisugo_dev_mode');
    const firebaseConnected = this._isFirebaseConnected();
    
    // Use Firebase only if NOT in dev mode AND Firebase is connected
    return devMode === 'false' && firebaseConnected;
  },
  
  /**
   * Check if we should use Mock data (development mode)
   * @returns {boolean}
   */
  useMock() {
    return !this.useFirebase();
  },
  
  /**
   * Get current mode as string
   * @returns {'firebase' | 'mock'}
   */
  getMode() {
    return this.useFirebase() ? 'firebase' : 'mock';
  },
  
  /**
   * Set the data mode
   * @param {'firebase' | 'mock'} mode
   */
  setMode(mode) {
    if (mode === 'firebase') {
      localStorage.setItem('gisugo_dev_mode', 'false');
      console.log('🔥 DataService: Switched to FIREBASE mode');
    } else {
      localStorage.setItem('gisugo_dev_mode', 'true');
      console.log('🧪 DataService: Switched to MOCK mode');
    }
    
    // Update APP_CONFIG if available
    if (typeof APP_CONFIG !== 'undefined') {
      APP_CONFIG.devMode = (mode === 'mock');
    }
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
   * Load data with automatic mock/firebase switching
   * @param {Object} options
   * @param {Function} options.firebaseLoader - Async function to load from Firebase
   * @param {Function|any} options.mockLoader - Function or data to use for mock mode
   * @param {string} [options.loadingElementId] - Optional loading element ID
   * @returns {Promise<any>}
   */
  async load({ firebaseLoader, mockLoader, loadingElementId }) {
    // Show loading if element provided
    if (loadingElementId) {
      this.showLoading(loadingElementId);
    }
    
    try {
      if (this.useFirebase()) {
        // ══════════════════════════════════════
        // FIREBASE MODE
        // ══════════════════════════════════════
        console.log('🔥 DataService: Loading from Firebase...');
        const data = await firebaseLoader();
        return data;
        
      } else {
        // ══════════════════════════════════════
        // MOCK MODE
        // ══════════════════════════════════════
        console.log('🧪 DataService: Loading from Mock data...');
        
        // mockLoader can be a function or direct data
        if (typeof mockLoader === 'function') {
          return mockLoader();
        }
        return mockLoader;
      }
      
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
    console.log(`   Dev Mode (localStorage): ${localStorage.getItem('gisugo_dev_mode')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }
};

// Make globally available
if (typeof window !== 'undefined') {
  window.DataService = DataService;
}

console.log('📦 Data Service module loaded');

