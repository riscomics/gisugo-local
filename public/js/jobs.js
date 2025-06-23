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
    
    // Load listings content
    loadListingsContent();
    
    console.log('📋 Listings tab initialized');
}

function loadListingsContent() {
    const container = document.querySelector('.listings-container');
    if (!container) return;
    
    // Generate mock listings data
    const mockListings = generateMockListings();
    
    if (mockListings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No active job listings yet</div>
                <div class="empty-state-message">Ready to post your first job? Create a listing and start finding help!</div>
                <button class="empty-state-btn" onclick="window.location.href='new-post.html'">
                    Post Your First Job
                </button>
            </div>
        `;
        return;
    }
    
    // Generate listings HTML
    const listingsHTML = mockListings.map(listing => generateListingCardHTML(listing)).join('');
    container.innerHTML = listingsHTML;
    
    // Initialize card click handlers
    initializeListingCardHandlers();
}

function generateMockListings() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    return [
        {
            id: 'listing-1',
            title: 'Deep Clean My 3-Bedroom House Before Family Visit',
            category: 'limpyo',
            thumbnail: 'public/mock/mock-limpyo-post1.jpg',
            datePosted: formatDate(yesterday),
            timePosted: '10:30 AM',
            jobDate: '2024-01-18',
            jobTime: '9:00 AM',
            status: 'active',
            applicationCount: 3
        },
        {
            id: 'listing-2', 
            title: 'Weekly Grocery Shopping for Elderly Grandmother',
            category: 'kompra',
            thumbnail: 'public/mock/mock-kompra-post3.jpg',
            datePosted: formatDate(twoDaysAgo),
            timePosted: '2:15 PM',
            jobDate: '2024-01-20',
            jobTime: '3:00 PM',
            status: 'active',
            applicationCount: 7
        },
        {
            id: 'listing-3',
            title: 'Airport Pickup & Drop-off for Business Trip',
            category: 'hatod',
            thumbnail: 'public/mock/mock-hatod-post2.jpg',
            datePosted: formatDate(today),
            timePosted: '8:45 AM',
            jobDate: '2024-01-17',
            jobTime: '6:30 AM',
            status: 'active',
            applicationCount: 2
        },
        {
            id: 'listing-4',
            title: 'Move Heavy Furniture from 2nd Floor to Storage',
            category: 'hakot',
            thumbnail: 'public/mock/mock-hakot-post4.jpg',
            datePosted: formatDate(threeDaysAgo),
            timePosted: '4:20 PM',
            jobDate: '2024-01-19',
            jobTime: '1:00 PM',
            status: 'active',
            applicationCount: 5
        }
    ];
}

function generateListingCardHTML(listing) {
    const timeAgo = formatTimeAgo(listing.datePosted);
    const applicationText = listing.applicationCount === 1 ? '1 application' : `${listing.applicationCount} applications`;
    const jobDateFormatted = formatJobDate(listing.jobDate);
    
    return `
        <div class="listing-card" data-listing-id="${listing.id}" data-category="${listing.category}">
            <div class="listing-thumbnail">
                <img src="${listing.thumbnail}" alt="${listing.title}">
                <div class="status-badge status-${listing.status}">${listing.status.toUpperCase()}</div>
            </div>
            <div class="listing-content">
                <div class="listing-title">${listing.title}</div>
                <div class="listing-meta">
                    <div class="job-schedule">
                        <span class="job-date">📅 ${jobDateFormatted}</span>
                        <div class="job-time-row">
                            <span class="job-time">🕒 ${listing.jobTime}</span>
                            <div class="application-count">${applicationText}</div>
                        </div>
                    </div>
                    <div class="posting-info">
                        <span class="listing-time-ago">Posted ${timeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'today';
    } else if (diffDays === 2) {
        return 'yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else if (diffDays <= 30) {
        return `${Math.ceil(diffDays / 7)} weeks ago`;
    } else {
        return `${Math.ceil(diffDays / 30)} months ago`;
    }
}

function formatJobDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset time to compare just dates
    const jobDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    
    if (jobDate.getTime() === todayDate.getTime()) {
        return 'Today';
    } else if (jobDate.getTime() === tomorrowDate.getTime()) {
        return 'Tomorrow';
    } else {
        const diffTime = jobDate - todayDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays <= 7) {
            return `In ${diffDays} days`;
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
            });
        }
    }
}

function initializeListingCardHandlers() {
    const listingCards = document.querySelectorAll('.listing-card');
    
    listingCards.forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const listingId = this.getAttribute('data-listing-id');
            const category = this.getAttribute('data-category');
            showListingOptionsOverlay(listingId, category);
        });
    });
}

function showListingOptionsOverlay(listingId, category) {
    console.log(`🔧 Opening options overlay for listing: ${listingId} (${category})`);
    
    // TODO: Create and show overlay with Modify/Delete options
    // For now, just log the action
    console.log('📋 Listings overlay options: MODIFY | DELETE');
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