// GISUGO Universal Header System JavaScript
// Extracted and optimized from messages.js

/*
=== UNIVERSAL HEADER FUNCTIONALITY ===

This module provides:
1. Universal menu overlay functionality
2. Header initialization
3. Memory leak prevention
4. Cross-page compatibility

Usage:
1. Include this JS file after header-uniform.css
2. Call initializeUniformHeader() on page load
3. Optionally call setHeaderTitle() to change title dynamically

*/

// ===== MEMORY LEAK PREVENTION SYSTEM =====

// Global registry for tracking all event listeners and cleanup functions
const HEADER_CLEANUP_REGISTRY = {
    documentListeners: new Map(),
    elementListeners: new WeakMap(),
    activeControllers: new Set(),
    intervals: new Set(),
    cleanupFunctions: new Set()
};

const HEADER_NOTIFICATION_COUNTER_STATE = {
    workerUnread: 0,
    customerUnread: 0,
    totalUnread: 0
};
let headerCounterBridgeAttached = false;
let headerCounterBridgeHandler = null;
const HEADER_BADGE_PULSE_STYLE_ID = 'uniform-menu-badge-pulse-style';

function ensureHeaderBadgePulseStyles() {
    if (document.getElementById(HEADER_BADGE_PULSE_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = HEADER_BADGE_PULSE_STYLE_ID;
    style.textContent = `
      .uniform-menu-unread-badge { animation: menuBadgeColorPulse 2.4s ease-in-out infinite; }
      @keyframes menuBadgeColorPulse {
        0%, 100% { background: #ef4444; }
        50% { background: #f59e0b; }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
}

function formatHeaderUnreadCount(totalUnread) {
    const safe = Math.max(0, Number(totalUnread) || 0);
    return safe > 99 ? '99+' : String(safe);
}

function updateHeaderMenuBadge(totalUnread) {
    const menuBtn = document.querySelector('.uniform-header-btn.menu');
    if (!menuBtn) return;
    let badge = menuBtn.querySelector('.uniform-menu-unread-badge');
    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'uniform-menu-unread-badge';
        menuBtn.appendChild(badge);
    }
    const safe = Math.max(0, Number(totalUnread) || 0);
    badge.textContent = formatHeaderUnreadCount(safe);
    badge.style.display = safe > 0 ? 'inline-flex' : 'none';
}

function initializeHeaderNotificationBadge() {
    updateHeaderMenuBadge(HEADER_NOTIFICATION_COUNTER_STATE.totalUnread);
}

function initializeHeaderCounterBridge() {
    if (headerCounterBridgeAttached && headerCounterBridgeHandler) return;
    const handler = (event) => {
        const detail = event?.detail || {};
        HEADER_NOTIFICATION_COUNTER_STATE.workerUnread = Math.max(0, Number(detail.workerUnread) || 0);
        HEADER_NOTIFICATION_COUNTER_STATE.customerUnread = Math.max(0, Number(detail.customerUnread) || 0);
        HEADER_NOTIFICATION_COUNTER_STATE.totalUnread = Math.max(0, Number(detail.totalUnread) || 0);
        updateHeaderMenuBadge(HEADER_NOTIFICATION_COUNTER_STATE.totalUnread);
    };
    headerCounterBridgeHandler = handler;
    headerCounterBridgeAttached = true;
    document.addEventListener('gisugo:notification-counter-update', handler);
    registerHeaderCleanup('function', 'notificationCounterBridge', () => {
        document.removeEventListener('gisugo:notification-counter-update', handler);
        headerCounterBridgeAttached = false;
        headerCounterBridgeHandler = null;
    });
}

// Memory leak prevention: Enhanced cleanup utility
function registerHeaderCleanup(type, key, cleanupFn) {
    if (type === 'function') {
        HEADER_CLEANUP_REGISTRY.cleanupFunctions.add(cleanupFn);
    } else if (type === 'controller') {
        HEADER_CLEANUP_REGISTRY.activeControllers.add(cleanupFn);
    } else if (type === 'interval') {
        HEADER_CLEANUP_REGISTRY.intervals.add(cleanupFn);
    }
    console.log(`🧹 Registered header cleanup for ${type}: ${key || 'anonymous'}`);
}

// Execute all registered cleanup functions
function executeHeaderCleanups() {
    console.log('🧹 EXECUTING HEADER CLEANUP...');
    
    // Clean up document listeners
    HEADER_CLEANUP_REGISTRY.documentListeners.forEach((listener, key) => {
        const [event, handler, options] = listener;
        document.removeEventListener(event, handler, options);
        console.log(`🧹 Removed header document listener: ${key}`);
    });
    HEADER_CLEANUP_REGISTRY.documentListeners.clear();
    
    // Abort all active controllers
    HEADER_CLEANUP_REGISTRY.activeControllers.forEach(controller => {
        if (controller && typeof controller.abort === 'function') {
            controller.abort();
        }
    });
    HEADER_CLEANUP_REGISTRY.activeControllers.clear();
    
    // Clear all intervals/timeouts
    HEADER_CLEANUP_REGISTRY.intervals.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
    });
    HEADER_CLEANUP_REGISTRY.intervals.clear();
    
    // Execute custom cleanup functions
    HEADER_CLEANUP_REGISTRY.cleanupFunctions.forEach(fn => {
        try {
            fn();
        } catch (error) {
            console.warn('Header cleanup function error:', error);
        }
    });
    HEADER_CLEANUP_REGISTRY.cleanupFunctions.clear();
    
    console.log('✅ HEADER CLEANUP COMPLETED');
}

// Safe document event listener with automatic tracking
function addHeaderDocumentListener(event, handler, options = false) {
    const key = `header_${event}_${Date.now()}_${Math.random()}`;
    document.addEventListener(event, handler, options);
    HEADER_CLEANUP_REGISTRY.documentListeners.set(key, [event, handler, options]);
    return key;
}

// ===== UNIVERSAL HEADER INITIALIZATION =====

/**
 * Initialize the uniform header system
 * @param {Object} options - Configuration options
 * @param {string} options.pageTitle - The title to display (optional, can use CSS class instead)
 * @param {string} options.menuSelector - Custom menu button selector (default: '.uniform-header-btn.menu')
 * @param {string} options.overlaySelector - Custom overlay selector (default: '.uniform-menu-overlay')
 */
function initializeUniformHeader(options = {}) {
    const config = {
        pageTitle: options.pageTitle || null,
        menuSelector: options.menuSelector || '.uniform-header-btn.menu',
        overlaySelector: options.overlaySelector || '.uniform-menu-overlay',
        ...options
    };

    console.log('🔧 Initializing Universal Header System...');
    ensureHeaderBadgePulseStyles();

    // Set title if provided
    if (config.pageTitle) {
        setHeaderTitle(config.pageTitle);
    }

    // Initialize menu functionality
    initializeUniformMenu(config);

    // Initialize back button functionality
    initializeUniformBackButton();

    // Register page unload cleanup
    window.addEventListener('beforeunload', executeHeaderCleanups);
    window.addEventListener('unload', executeHeaderCleanups);

    console.log('✅ Universal Header System initialized');
}

// ===== UNIVERSAL MENU FUNCTIONALITY =====

function initializeUniformMenu(config) {
    const menuBtn = document.querySelector(config.menuSelector);
    const menuOverlay = document.querySelector(config.overlaySelector);
    
    if (!menuBtn || !menuOverlay) {
        console.warn('⚠️ Menu button or overlay not found. Skipping menu initialization.');
        console.log('Menu button selector:', config.menuSelector);
        console.log('Overlay selector:', config.overlaySelector);
        return;
    }

    // Clean up any existing listeners
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    
    const newMenuOverlay = menuOverlay.cloneNode(true);
    menuOverlay.parentNode.replaceChild(newMenuOverlay, menuOverlay);

    // Re-get references after cloning
    const cleanMenuBtn = document.querySelector(config.menuSelector);
    const cleanMenuOverlay = document.querySelector(config.overlaySelector);

    // Add menu button click handler
    if (cleanMenuBtn) {
        cleanMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🍔 Menu button clicked');
            if (window.SharedMenuController && typeof window.SharedMenuController.toggle === 'function') {
                window.SharedMenuController.toggle(cleanMenuOverlay);
            } else {
                cleanMenuOverlay.classList.toggle('show');
                // Position panel exactly below the borderline when opening
                if (cleanMenuOverlay.classList.contains('show') &&
                    typeof positionSharedMenuPanel === 'function') {
                    positionSharedMenuPanel();
                }
            }
            
            // Add slight haptic feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        });

        console.log('✅ Menu button initialized');
        initializeHeaderNotificationBadge();
    }

    // Add overlay click handler (close when clicking outside)
    if (cleanMenuOverlay) {
        cleanMenuOverlay.addEventListener('click', function(e) {
            if (e.target === cleanMenuOverlay) {
                console.log('🍔 Menu overlay clicked - closing menu');
                if (window.SharedMenuController && typeof window.SharedMenuController.closeAll === 'function') {
                    window.SharedMenuController.closeAll();
                } else {
                    cleanMenuOverlay.classList.remove('show');
                }
            }
        });

        // Initialize menu items if they exist
        initializeMenuItems(cleanMenuOverlay);

        console.log('✅ Menu overlay initialized');
    }

    // Close menu with Escape key
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && cleanMenuOverlay.classList.contains('show')) {
            console.log('⌨️ Escape key pressed - closing menu');
            if (window.SharedMenuController && typeof window.SharedMenuController.closeAll === 'function') {
                window.SharedMenuController.closeAll();
            } else {
                cleanMenuOverlay.classList.remove('show');
            }
        }
    };
    
    addHeaderDocumentListener('keydown', escapeHandler);
    
    registerHeaderCleanup('function', 'menuEscapeHandler', () => {
        document.removeEventListener('keydown', escapeHandler);
    });
    initializeHeaderCounterBridge();
}

// ===== MENU ITEMS INITIALIZATION =====

function initializeMenuItems(menuOverlay) {
    // This will be called by shared-menu.js if it exists
    // Or you can manually populate menu items here
    
    const menuItemsContainer = menuOverlay.querySelector('.uniform-menu-items');
    if (!menuItemsContainer) {
        console.warn('⚠️ Menu items container not found');
        return;
    }

    // Check if shared-menu.js has already populated the menu (card-grid or legacy items)
    if (menuItemsContainer.children.length > 0) {
        console.log(`✅ Found ${menuItemsContainer.children.length} existing menu children`);
        return;
    }

    // Default menu items if no shared-menu.js is found
    const defaultMenuItems = [
        { href: 'index.html', img: 'public/icons/Home.png', text: 'Home' },
        { href: 'new-post2.html', img: 'public/icons/Post.png', text: 'Post' },
        { href: 'messages.html', img: 'public/icons/Messages.png', text: 'Messages' },
        { href: 'jobs.html', img: 'public/icons/Jobs.png', text: 'Gigs' },
        { href: 'profile.html', img: 'public/icons/Profile.png', text: 'Profile' }
    ];

    const menuHTML = defaultMenuItems.map(item => `
        <a href="${item.href}" class="uniform-menu-item">
            <img src="${item.img}" alt="${item.text}">
            <span>${item.text}</span>
        </a>
    `).join('');

    menuItemsContainer.innerHTML = menuHTML;
    console.log('✅ Default menu items created');
}

// ===== BACK BUTTON FUNCTIONALITY =====

function initializeUniformBackButton() {
    const backBtn = document.querySelector('.uniform-header-btn.back');
    
    if (!backBtn) {
        console.warn('⚠️ Back button not found');
        return;
    }

    // Clean up any existing listeners
    const newBackBtn = backBtn.cloneNode(true);
    backBtn.parentNode.replaceChild(newBackBtn, backBtn);
    
    const cleanBackBtn = document.querySelector('.uniform-header-btn.back');
    const safeReferrerPath = (() => {
        try {
            if (!document.referrer) return "";
            const refUrl = new URL(document.referrer);
            if (refUrl.origin !== window.location.origin) return "";
            return `${refUrl.pathname}${refUrl.search || ""}${refUrl.hash || ""}`;
        } catch (_) {
            return "";
        }
    })();
    const fromParam = new URLSearchParams(window.location.search).get('from') || "";

    if (cleanBackBtn) {
        cleanBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            console.log('⬅️ Back button clicked');
            
            // Add slight haptic feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
            
            // Deterministic return path for alert-driven deep links.
            if (fromParam === 'messages') {
                window.location.href = 'messages.html';
                return;
            }

            const fallbackPath = safeReferrerPath || 'index.html';
            const currentUrl = window.location.href;
            window.history.back();

            // Some browsers/webviews report short history stacks; apply deterministic fallback.
            setTimeout(() => {
                if (window.location.href === currentUrl) {
                    window.location.href = fallbackPath;
                }
            }, 180);
        });

        console.log('✅ Back button initialized');
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Dynamically set the header title
 * @param {string} title - The title to display
 */
function setHeaderTitle(title) {
    const titleElement = document.querySelector('.uniform-header-title');
    if (titleElement) {
        titleElement.textContent = title;
        console.log(`📝 Header title set to: ${title}`);
    } else {
        console.warn('⚠️ Header title element not found');
    }
}

/**
 * Get the current header title
 * @returns {string} Current title text
 */
function getHeaderTitle() {
    const titleElement = document.querySelector('.uniform-header-title');
    return titleElement ? titleElement.textContent : '';
}

/**
 * Show/hide the menu overlay programmatically
 * @param {boolean} show - Whether to show the menu
 */
function toggleUniformMenu(show = null) {
    const menuOverlay = document.querySelector('.uniform-menu-overlay');
    if (!menuOverlay) {
        console.warn('⚠️ Menu overlay not found');
        return;
    }

    if (show === null) {
        menuOverlay.classList.toggle('show');
    } else if (show) {
        menuOverlay.classList.add('show');
    } else {
        menuOverlay.classList.remove('show');
    }
    
    console.log(`🍔 Menu ${menuOverlay.classList.contains('show') ? 'opened' : 'closed'}`);
}

/**
 * Add debug styling to header elements
 * @param {boolean} enable - Whether to enable debug mode
 */
function debugUniformHeader(enable = true) {
    const header = document.querySelector('.uniform-header');
    if (header) {
        if (enable) {
            header.classList.add('uniform-header-debug');
            console.log('🐛 Header debug mode enabled');
        } else {
            header.classList.remove('uniform-header-debug');
            console.log('🐛 Header debug mode disabled');
        }
    }
}

// ===== AUTO-INITIALIZATION =====

// Track initialization state
let headerInitialized = false;

function autoInitHeader() {
    // Prevent double initialization
    if (headerInitialized) {
        console.log('⚠️ Header already initialized, skipping...');
        return;
    }
    
    console.log('📄 Checking for uniform header...');
    
    // Only auto-initialize if uniform header exists
    const uniformHeader = document.querySelector('.uniform-header');
    if (uniformHeader) {
        console.log('🎯 Uniform header found - auto-initializing...');
        initializeUniformHeader();
        headerInitialized = true;
    } else {
        console.log('ℹ️ No uniform header found - skipping auto-initialization');
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', autoInitHeader);

// CRITICAL: Re-initialize when page is restored from bfcache (mobile swipe back)
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // Page was loaded from bfcache (browser back/forward cache)
        console.log('🔄 Page restored from cache - re-initializing header');
        executeHeaderCleanups();
        headerInitialized = false;
        autoInitHeader();
    }
});

// ===== EXPORTS FOR MANUAL USAGE =====

// Make functions available globally for manual usage
window.initializeUniformHeader = initializeUniformHeader;
window.setHeaderTitle = setHeaderTitle;
window.getHeaderTitle = getHeaderTitle;
window.toggleUniformMenu = toggleUniformMenu;
window.debugUniformHeader = debugUniformHeader;
window.executeHeaderCleanups = executeHeaderCleanups;

console.log('📦 Universal Header System loaded and ready');