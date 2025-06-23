// GISUGO Jobs JavaScript

// ===== MEMORY LEAK PREVENTION SYSTEM =====
const CLEANUP_REGISTRY = {
    documentListeners: new Map(),
    elementListeners: new WeakMap(), 
    activeControllers: new Set(),
    intervals: new Set(),
    cleanupFunctions: new Set()
};

function registerCleanup(type, key, cleanupFn) {
    if (type === 'function') {
        CLEANUP_REGISTRY.cleanupFunctions.add(cleanupFn);
    } else if (type === 'controller') {
        CLEANUP_REGISTRY.activeControllers.add(cleanupFn);
    } else if (type === 'interval') {
        CLEANUP_REGISTRY.intervals.add(cleanupFn);
    }
}

function executeAllCleanups() {
    // Clean up document listeners
    CLEANUP_REGISTRY.documentListeners.forEach((listener, key) => {
        const [event, handler, options] = listener;
        document.removeEventListener(event, handler, options);
    });
    CLEANUP_REGISTRY.documentListeners.clear();
    
    // Clean up functions
    CLEANUP_REGISTRY.cleanupFunctions.forEach(cleanupFn => {
        if (typeof cleanupFn === 'function') {
            try {
                cleanupFn();
            } catch (error) {
                console.warn('Cleanup function error:', error);
            }
        }
    });
    CLEANUP_REGISTRY.cleanupFunctions.clear();
    
    // Abort all controllers
    CLEANUP_REGISTRY.activeControllers.forEach(controller => {
        if (controller && typeof controller.abort === 'function') {
            controller.abort();
        }
    });
    CLEANUP_REGISTRY.activeControllers.clear();
    
    // Clear intervals
    CLEANUP_REGISTRY.intervals.forEach(intervalId => {
        clearInterval(intervalId);
    });
    CLEANUP_REGISTRY.intervals.clear();
    
    console.log('🧹 Jobs page cleanup completed');
}

function addDocumentListener(event, handler, options = false) {
    const key = `${event}_${Date.now()}_${Math.random()}`;
    document.addEventListener(event, handler, options);
    CLEANUP_REGISTRY.documentListeners.set(key, [event, handler, options]);
    return key;
}

function removeDocumentListener(key) {
    const listener = CLEANUP_REGISTRY.documentListeners.get(key);
    if (listener) {
        const [event, handler, options] = listener;
        document.removeEventListener(event, handler, options);
        CLEANUP_REGISTRY.documentListeners.delete(key);
        console.log(`🧹 Removed tracked document listener: ${key}`);
    }
}

// Register page unload cleanup
window.addEventListener('beforeunload', executeAllCleanups);

// ===== JOBS PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeMenu();
    initializeTabs();
    // Initialize the first tab (listings) content
    initializeActiveTab('listings');
});

function initializeMenu() {
    const menuBtn = document.getElementById('jobsMenuBtn');
    const menuOverlay = document.getElementById('jobsMenuOverlay');
    
    if (menuBtn && menuOverlay) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            menuOverlay.classList.add('show');
        });

        // Close menu when clicking outside
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('show');
            }
        });

        // Close menu with escape key
        const escapeHandler = function(e) {
            if (e.key === 'Escape' && menuOverlay.classList.contains('show')) {
                menuOverlay.classList.remove('show');
            }
        };
        addDocumentListener('keydown', escapeHandler);
    }
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const tabType = this.getAttribute('data-tab');
            switchToTab(tabType);
        });
    });
}

function switchToTab(tabType) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeTabBtn = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active');
    }
    
    // Update tab content wrappers
    document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
        wrapper.classList.remove('active');
    });
    
    const activeWrapper = document.getElementById(`${tabType}-content`);
    if (activeWrapper) {
        activeWrapper.classList.add('active');
    }
    
    // Update page title
    updatePageTitle(tabType);
    
    // Initialize content for the active tab (lazy loading approach)
    initializeActiveTab(tabType);
    
    console.log(`🔄 Switched to ${tabType} tab`);
}

function updatePageTitle(activeTab) {
    const titleElement = document.getElementById('jobsTitle');
    if (titleElement) {
        switch (activeTab) {
            case 'listings':
                titleElement.textContent = 'JOBS POSTED';
                break;
            case 'hiring':
                titleElement.textContent = 'ACTIVE HIRING';
                break;
            case 'previous':
                titleElement.textContent = 'PREVIOUS JOBS';
                break;
            default:
                titleElement.textContent = 'JOBS MANAGEMENT';
        }
    }
}

function initializeActiveTab(tabType) {
    console.log(`🚀 Initializing ${tabType} tab content`);
    
    switch (tabType) {
        case 'listings':
            initializeListingsTab();
            break;
        case 'hiring':
            initializeHiringTab();
            break;
        case 'previous':
            initializePreviousTab();
            break;
        default:
            console.warn('Unknown tab type:', tabType);
    }
}

function initializeListingsTab() {
    const container = document.querySelector('.listings-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('📋 Listings tab already loaded');
        return;
    }
    
    // Show placeholder for now
    container.innerHTML = `
        <div class="content-placeholder">
            📋 Your job listings will appear here.<br>
            You can modify or delete your posted jobs.
        </div>
    `;
    
    console.log('📋 Listings tab initialized');
}

function initializeHiringTab() {
    const container = document.querySelector('.hiring-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('👥 Hiring tab already loaded');
        return;
    }
    
    // Show placeholder for now
    container.innerHTML = `
        <div class="content-placeholder">
            👥 Active hiring jobs will appear here.<br>
            You can mark jobs as completed or cancel them.
        </div>
    `;
    
    console.log('👥 Hiring tab initialized');
}

function initializePreviousTab() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('📜 Previous tab already loaded');
        return;
    }
    
    // Show placeholder for now
    container.innerHTML = `
        <div class="content-placeholder">
            📜 Completed jobs will appear here.<br>
            You can relist jobs or leave feedback.
        </div>
    `;
    
    console.log('📜 Previous tab initialized');
} 