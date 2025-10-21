// GISUGO Messages Page JavaScript

/*
=== FIREBASE INTEGRATION SUMMARY ===

✅ FIRESTORE-OPTIMIZED DATA STRUCTURES:
- Document IDs: Firebase auto-generated format (e.g., 'notif_xKj9mL2pQ8vR4sW7nC1e')
- User IDs: Firebase UID format (28-character strings)
- Timestamps: Date objects ready for firebase.firestore.Timestamp conversion
- Collections: /notifications, /applications, /jobs, /contracts, /users, /analytics
- Denormalized data for faster reads (user profiles embedded in applications)
- Flat document structure for better indexing and security rules

✅ FIREBASE AUTHENTICATION READY:
- currentUser.uid integration points mapped
- Custom claims support for roles (employer, worker, admin)
- Security rules compatible data access patterns

✅ FIRESTORE BATCH OPERATIONS:
- Multi-document updates in single transaction
- Atomic hire/reject operations with contract creation
- Real-time listener update paths documented
- Error handling and rollback strategies planned

✅ FIREBASE CLOUD FUNCTIONS TRIGGERS:
- Push notification sending via FCM
- Email notifications with templates
- Analytics event tracking
- Recommendation engine updates
- Automatic status synchronization

✅ FIREBASE STORAGE INTEGRATION:
- User photos: gs://gisugo-storage/users/{uid}/profile.jpg
- Job images: gs://gisugo-storage/jobs/{jobId}/images/
- Automatic URL transformation for display

✅ REAL-TIME LISTENERS MAPPED:
- /notifications/{recipientUid} - Live notification updates
- /applications/{applicationId} - REMOVED (applications moved to jobs.html)
- /jobs/{jobId} - Job status and assignment updates
- /contracts/{contractId} - Contract creation and updates

✅ ANALYTICS & PERFORMANCE:
- Daily analytics aggregation with FieldValue.increment()
- Compound indexes planned for complex queries
- Pagination with startAfter/limit for large datasets
- Optimized for mobile offline capabilities

🔧 IMPLEMENTATION READY FOR:
- Firebase SDK v9+ modular syntax
- Firestore security rules
- Cloud Functions deployment
- FCM push notifications
- Firebase Storage file handling
- Real-time synchronization
*/

/*
=== BACKEND INTEGRATION DOCUMENTATION ===

This modular tab system provides comprehensive data structures for backend integration:

1. NOTIFICATIONS TAB:
   - Data: MOCK_NOTIFICATIONS array (line ~1200)
   - Structure: notification objects with full metadata
   - Actions: mark_read, reply_message, view_application, review_applications
   - Required Endpoints: GET /notifications, PUT /notifications/{id}/read, POST /notifications/action

2. MESSAGES TAB:
   - Data: MOCK_MESSAGES array (line ~1550)
   - Structure: threaded conversations with full message history
   - Actions: send_message, expand_thread, keyboard_handling
   - Required Endpoints: GET /messages, POST /messages, PUT /messages/{threadId}/read

3. MESSAGES TAB (formerly Applications):
   - Data: Static HTML for admin communications (no mock data)
   - Structure: Inbox/details layout for admin messages and broadcasts
   - Actions: read_message, reply_to_admin, mark_read
   - Required Endpoints: GET /admin-messages, POST /admin-messages/reply

4. BACKEND DATA PAYLOADS:
   - All action handlers prepare complete backend payload objects
   - Includes user IDs, timestamps, notification data, analytics
   - Check console.log outputs for exact data structures needed

5. MODULAR LOADING:
   - Only active tab loads content (eliminates 67% initial load)
   - Each tab has independent scroll containers
   - No shared state or background resource consumption

6. DATA ATTRIBUTES:
   - All UI elements include comprehensive data-* attributes
   - Enables easy data extraction for API calls
   - Maintains referential integrity between related objects
*/

/*
=== FIREBASE INTEGRATION DOCUMENTATION ===

This modular tab system is optimized for Firebase (Firestore + Authentication):

1. FIRESTORE COLLECTIONS STRUCTURE:
   /notifications/{notificationId} - Individual notification documents
   /messages/{threadId} - Message thread documents with subcollection
   /messages/{threadId}/messages/{messageId} - Individual messages
   /jobs/{jobId} - Job documents
   /applications/{applicationId} - REMOVED (applications moved to jobs.html)
   /users/{uid} - User profile documents

2. FIREBASE AUTHENTICATION:
   - Uses Firebase UID format (28-character strings)
   - currentUser.uid for authenticated user
   - Custom claims for roles (employer, worker, admin)

3. FIRESTORE TIMESTAMP FORMAT:
   - firebase.firestore.Timestamp.now() for server timestamps
   - firebase.firestore.FieldValue.serverTimestamp() for auto timestamps
   - Properly indexed timestamp fields for queries

4. FIRESTORE QUERIES READY:
   - Compound indexes for complex filtering
   - Pagination with startAfter/limit
   - Real-time listeners for live updates
   - Security rules compatible structure

5. FIREBASE CLOUD FUNCTIONS:
   - Notification triggers on document changes
   - Application status change handlers
   - Email/SMS notification workflows
   - Data validation and sanitization

6. FIREBASE STORAGE:
   - User photos in /users/{uid}/profile.jpg
   - Job images in /jobs/{jobId}/images/
   - Message attachments in /messages/{threadId}/attachments/
*/

// ===== MEMORY LEAK PREVENTION SYSTEM =====

// Global registry for tracking all event listeners and cleanup functions
const CLEANUP_REGISTRY = {
    documentListeners: new Map(), // Track document-level listeners
    elementListeners: new WeakMap(), // Track element-specific listeners
    activeControllers: new Set(), // Track AbortControllers
    intervals: new Set(), // Track setInterval/setTimeout
    cleanupFunctions: new Set() // Track custom cleanup functions
};

// MEMORY LEAK FIX: Enhanced cleanup utility
function registerCleanup(type, key, cleanupFn) {
    if (type === 'function') {
        CLEANUP_REGISTRY.cleanupFunctions.add(cleanupFn);
    } else if (type === 'controller') {
        CLEANUP_REGISTRY.activeControllers.add(cleanupFn);
    } else if (type === 'interval') {
        CLEANUP_REGISTRY.intervals.add(cleanupFn);
    }
    console.log(`🧹 Registered cleanup for ${type}: ${key || 'anonymous'}`);
}

// MEMORY LEAK FIX: Execute all registered cleanup functions
function executeAllCleanups() {
    console.log('🧹 EXECUTING COMPREHENSIVE CLEANUP...');
    
    // Clean up document listeners
    CLEANUP_REGISTRY.documentListeners.forEach((listener, key) => {
        const [event, handler, options] = listener;
        document.removeEventListener(event, handler, options);
        console.log(`🧹 Removed document listener: ${key}`);
    });
    CLEANUP_REGISTRY.documentListeners.clear();
    
    // Abort all active controllers
    CLEANUP_REGISTRY.activeControllers.forEach(controller => {
        if (controller && typeof controller.abort === 'function') {
            controller.abort();
        }
    });
    CLEANUP_REGISTRY.activeControllers.clear();
    
    // Clear all intervals/timeouts
    CLEANUP_REGISTRY.intervals.forEach(id => {
        clearTimeout(id);
        clearInterval(id);
    });
    CLEANUP_REGISTRY.intervals.clear();
    
    // Execute custom cleanup functions
    CLEANUP_REGISTRY.cleanupFunctions.forEach(fn => {
        try {
            fn();
        } catch (error) {
            console.warn('Cleanup function error:', error);
        }
    });
    CLEANUP_REGISTRY.cleanupFunctions.clear();
    
    console.log('✅ COMPREHENSIVE CLEANUP COMPLETED');
}

// MEMORY LEAK FIX: Safe document event listener with automatic tracking
function addDocumentListener(event, handler, options = false) {
    const key = `${event}_${Date.now()}_${Math.random()}`;
    document.addEventListener(event, handler, options);
    CLEANUP_REGISTRY.documentListeners.set(key, [event, handler, options]);
    return key; // Return key for manual removal if needed
}

// MEMORY LEAK FIX: Remove specific document listener
function removeDocumentListener(key) {
    const listener = CLEANUP_REGISTRY.documentListeners.get(key);
    if (listener) {
        const [event, handler, options] = listener;
        document.removeEventListener(event, handler, options);
        CLEANUP_REGISTRY.documentListeners.delete(key);
        console.log(`🧹 Removed tracked document listener: ${key}`);
    }
}

// MEMORY LEAK FIX: Helper function to track timeouts for automatic cleanup
function trackTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
        CLEANUP_REGISTRY.intervals.delete(timeoutId);
        callback();
    }, delay);
    CLEANUP_REGISTRY.intervals.add(timeoutId);
    return timeoutId;
}

// MEMORY LEAK FIX: Helper function to track intervals for automatic cleanup
function trackInterval(callback, delay) {
    const intervalId = setInterval(callback, delay);
    CLEANUP_REGISTRY.intervals.add(intervalId);
    return intervalId;
}

// MEMORY LEAK FIX: Manual timeout/interval cleanup for immediate cancellation
function clearTrackedTimeout(timeoutId) {
    clearTimeout(timeoutId);
    CLEANUP_REGISTRY.intervals.delete(timeoutId);
}

function clearTrackedInterval(intervalId) {
    clearInterval(intervalId);
    CLEANUP_REGISTRY.intervals.delete(intervalId);
}

// Role-specific tab initialization functions
async function initializeWorkerAlertsTab() {
    console.log('📋 Initializing worker alerts tab');
    // Load worker-specific notifications
    loadWorkerNotifications();
}

async function initializeWorkerChatsTab() {
    console.log('💬 Initializing worker chats tab');
    // Load worker-specific chats
    loadWorkerChats();
}

async function initializeWorkerMessagesTab() {
    console.log('📧 Initializing worker messages tab');
    // Initialize worker admin messages functionality
    loadWorkerMessages();
    setupMessageFiltering('worker');
    setupMessageDetailHandlers('worker');
    
    // Force update the Messages tab counter when initializing
    setTimeout(() => {
        updateMessageCounts('worker');
        updateMainMessagesTabCount(); // Update main tab count
    }, 100);
}

async function initializeCustomerAlertsTab() {
    console.log('📋 Initializing customer alerts tab');
    // Load customer-specific notifications
    loadCustomerNotifications();
}

async function initializeCustomerInterviewsTab() {
    console.log('🎯 Initializing customer interviews tab');
    // Load customer interview chats
    loadCustomerInterviews();
}

async function initializeUnifiedMessagesTab() {
    console.log('📧 Initializing unified messages tab');
    // Initialize unified admin messages functionality using customer data
    loadUnifiedMessages();
    setupMessageFiltering('unified');
    setupMessageDetailHandlers('unified');
    
    // Force update the Messages tab counter when initializing
    setTimeout(() => {
        updateMainMessagesTabCount(); // Update main tab count
    }, 100);
}

async function initializeCustomerMessagesTab() {
    console.log('📧 Initializing customer messages tab');
    // Initialize customer admin messages functionality
    loadCustomerMessages();
    setupMessageFiltering('customer');
    setupMessageDetailHandlers('customer');
    
    // Force update the Messages tab counter when initializing
    setTimeout(() => {
        updateMessageCounts('customer');
        updateMainMessagesTabCount(); // Update main tab count
    }, 100);
}

// Load segregated notifications based on role
function loadWorkerNotifications() {
    const container = document.querySelector('#worker-alerts-content .notifications-container');
    if (container) {
        // Filter notifications for worker role
        const workerNotifications = MOCK_NOTIFICATIONS.filter(notif => 
            notif.notificationType === 'interview_request'
        );
        
        const content = workerNotifications.map(notification => generateNotificationHTML(notification)).join('');
        container.innerHTML = content;
        
        // Initialize event handlers
        initializeNotifications();
        
        // Update count
        const countElement = document.querySelector('#workerAlertsTab .notification-count');
        if (countElement) {
            countElement.textContent = workerNotifications.length;
        }
        
        console.log('Worker notifications loaded:', workerNotifications.length);
    }
}

function loadCustomerNotifications() {
    const container = document.querySelector('#customer-alerts-content .notifications-container');
    if (container) {
        // Filter notifications for customer role
        const customerNotifications = MOCK_NOTIFICATIONS.filter(notif => 
            notif.notificationType !== 'interview_request'
        );
        
        const content = customerNotifications.map(notification => generateNotificationHTML(notification)).join('');
        container.innerHTML = content;
        
        // Initialize event handlers
        initializeNotifications();
        
        // Update count
        const countElement = document.querySelector('#customerAlertsTab .notification-count');
        if (countElement) {
            countElement.textContent = customerNotifications.length;
        }
        
        console.log('Customer notifications loaded:', customerNotifications.length);
    }
}

// Load segregated chats based on role
function loadWorkerChats() {
    const container = document.querySelector('#worker-chats-content .messages-container');
    if (container) {
        // Filter chats for worker role
        const workerChats = MOCK_MESSAGES.filter(thread => 
            thread.currentUserRole === 'worker'
        );
        
        const content = workerChats.map(thread => generateMessageThreadHTML(thread)).join('');
        container.innerHTML = content;
        
        // Initialize event handlers for this specific container
        initializeMessages(container);
        
        // Update count
        const countElement = document.querySelector('#workerChatsTab .notification-count');
        if (countElement) {
            const newCount = workerChats.filter(thread => thread.isNew).length;
            countElement.textContent = newCount;
        }
        
        console.log('Worker chats loaded:', workerChats.length);
    }
}

function loadCustomerInterviews() {
    const container = document.querySelector('#customer-interviews-content .messages-container');
    if (container) {
        // Filter chats for customer role
        const customerChats = MOCK_MESSAGES.filter(thread => 
            thread.currentUserRole === 'customer'
        );
        
        const content = customerChats.map(thread => generateMessageThreadHTML(thread)).join('');
        container.innerHTML = content;
        
        // Initialize event handlers for this specific container
        initializeMessages(container);
        
        // Update count
        const countElement = document.querySelector('#customerInterviewsTab .notification-count');
        if (countElement) {
            const newCount = customerChats.filter(thread => thread.isNew).length;
            countElement.textContent = newCount;
        }
        
        console.log('Customer interviews loaded:', customerChats.length);
    }
}

// Initialize the Messages app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Role-based messages system initializing...');
    
    // Initialize core systems
    initializeRoles();
    initializeTabs();
    initializeMenu(); 
    initializeConfirmationOverlay();
    initializeContactMessageOverlay();
    
    // Initialize default role (worker) and tab (worker-alerts)
    initializeWorkerAlertsTab();
    
    // SAFETY CLEANUP: Ensure no lingering mobile input adjustments on page load
    cleanupMobileInputVisibility();
    
    // MEMORY LEAK FIX: Register page unload cleanup
    window.addEventListener('beforeunload', executeAllCleanups);
    window.addEventListener('unload', executeAllCleanups);
    
    // MEMORY LEAK FIX: Use tracked document listener for overlay clicks
    const overlayClickKey = addDocumentListener('click', function(e) {
        // Find the correct messages container based on active role and tab
        const messagesContainer = document.querySelector('.tab-content-wrapper.active .messages-container') || 
                                 document.querySelector('.messages-container');
        const expandedThread = document.querySelector('.message-thread.expanded');
        
        // Only proceed if there's an active thread
        if (!messagesContainer || !messagesContainer.classList.contains('thread-active') || !expandedThread) {
            return;
        }
        
        // Check if click is outside the expanded thread
        if (!expandedThread.contains(e.target)) {
            closeAllMessageThreads();
        }
    });
    
    // Register cleanup for overlay click listener
    registerCleanup('function', 'overlayClickCleanup', () => {
        removeDocumentListener(overlayClickKey);
    });
    
    console.log('Modular tab system initialized - only notifications loaded on startup');
});

// MODULAR APPROACH: Initialize only the specified tab's content
function initializeActiveTab(tabType) {
    console.log(`Loading tab content for: ${tabType}`);
    
    switch(tabType) {
        case 'notifications':
            loadNotificationsTab();
            break;
        case 'messages':
            loadMessagesTab();
            break;
        case 'applications':
            loadApplicationsTab();
            break;
        default:
            console.warn(`Unknown tab type: ${tabType}`);
    }
}

function initializeMenu() {
    const menuBtn = document.getElementById('messagesMenuBtn');
    const menuOverlay = document.getElementById('messagesMenuOverlay');
    
    if (menuBtn && menuOverlay) {
        menuBtn.addEventListener('click', function() {
            menuOverlay.classList.toggle('show');
        });
        
        // Close menu when clicking outside
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('show');
            }
        });
    }
}

// Role Management - NEW TOP LEVEL ROLE SWITCHING
function initializeRoles() {
    const roleButtons = document.querySelectorAll('.role-tab-btn');
    
    roleButtons.forEach(button => {
        button.addEventListener('click', async function() {
            const roleType = this.getAttribute('data-role');
            
            // Update role button states
            roleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Switch to the selected role
            await switchToRole(roleType);
        });
    });
}

async function switchToRole(roleType) {
    console.log(`🔄 Switching to role: ${roleType}`);
    
    if (roleType === 'customer') {
        // Show customer tabs and content
        document.querySelector('.worker-tabs').style.display = 'none';
        document.querySelector('.customer-tabs').style.display = 'flex';
        
        // Hide all content first
        document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
            wrapper.classList.remove('active');
        });
        
        // Show customer content (default to alerts)
        const customerAlertsContent = document.getElementById('customer-alerts-content');
        if (customerAlertsContent) {
            customerAlertsContent.style.display = 'block';
            customerAlertsContent.classList.add('active');
        }
        
        // Activate customer alerts tab
        document.querySelectorAll('.customer-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('customerAlertsTab')?.classList.add('active');
        
        // Initialize the default customer alerts tab content
        await initializeCustomerAlertsTab();
        
    } else if (roleType === 'worker') {
        // Show worker tabs and content
        document.querySelector('.customer-tabs').style.display = 'none';
        document.querySelector('.worker-tabs').style.display = 'flex';
        
        // Hide all content first
        document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
            wrapper.classList.remove('active');
        });
        
        // Show worker content (default to alerts)
        const workerAlertsContent = document.getElementById('worker-alerts-content');
        if (workerAlertsContent) {
            workerAlertsContent.style.display = 'block';
            workerAlertsContent.classList.add('active');
        }
        
        // Activate worker alerts tab
        document.querySelectorAll('.worker-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('workerAlertsTab')?.classList.add('active');
        
        // Initialize the default worker alerts tab content
        await initializeWorkerAlertsTab();
    }
}

// Tab Management - UPDATED FOR ROLE-BASED TABS
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const tabType = this.getAttribute('data-tab');
            
            // Check if this is the unified Messages tab
            if (tabType === 'unified-messages') {
                await switchToUnifiedMessages();
                return;
            }
            
            // Determine if this is a customer or worker tab
            const isCustomerTab = this.closest('.customer-tabs');
            const isWorkerTab = this.closest('.worker-tabs');
            
            if (isCustomerTab) {
                await switchToCustomerTab(tabType);
            } else if (isWorkerTab) {
                await switchToWorkerTab(tabType);
            }
        });
    });
}

async function switchToUnifiedMessages() {
    console.log('🔄 Switching to unified Messages tab');
    
    // CLEANUP: Close all message threads when switching tabs
    closeAllMessageThreads();
    
    // CLEANUP: Cancel any active selections when switching tabs
    cancelSelection();
    
    // Hide all content first
    document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
        wrapper.style.display = 'none';
        wrapper.classList.remove('active');
    });
    
    // Show unified messages content
    const unifiedContent = document.getElementById('unified-messages-content');
    if (unifiedContent) {
        unifiedContent.style.display = 'block';
        unifiedContent.classList.add('active');
    }
    
    // Update tab button states - both customer and worker Messages tabs should be active
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('unifiedMessagesTab')?.classList.add('active');
    document.getElementById('unifiedMessagesTabWorker')?.classList.add('active');
    
    // Initialize unified messages tab content
    await initializeUnifiedMessagesTab();
}

async function switchToCustomerTab(tabType) {
    // CLEANUP: Close all message threads when switching tabs
    closeAllMessageThreads();
    
    // CLEANUP: Cancel any active selections when switching tabs
    cancelSelection();
    
    // CLEANUP: Hide avatar overlay when switching tabs
    hideAvatarOverlay();
    
    // Update customer tab states
    document.querySelectorAll('.customer-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeTabBtn = document.querySelector(`.customer-tabs [data-tab="${tabType}"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active');
    }
    
    // Update customer content visibility
    document.querySelectorAll('.customer-content').forEach(wrapper => {
        wrapper.style.display = 'none';
        wrapper.classList.remove('active');
    });
    
    // Ensure unified messages content is hidden when switching away
    const unifiedContentCustomerScope = document.getElementById('unified-messages-content');
    if (unifiedContentCustomerScope) {
        unifiedContentCustomerScope.style.display = 'none';
        unifiedContentCustomerScope.classList.remove('active');
    }
    
    // Remove active state from unified Messages tabs (both roles)
    document.getElementById('unifiedMessagesTab')?.classList.remove('active');
    document.getElementById('unifiedMessagesTabWorker')?.classList.remove('active');
    
    const activeWrapper = document.getElementById(`${tabType}-content`);
    if (activeWrapper) {
        activeWrapper.style.display = 'block';
        activeWrapper.classList.add('active');
    }
    
    console.log(`🔄 Switched to customer tab: ${tabType}`);
    
    // Load customer content
    if (tabType === 'customer-alerts') {
        await initializeCustomerAlertsTab();
    } else if (tabType === 'customer-interviews') {
        await initializeCustomerInterviewsTab();
    } else if (tabType === 'customer-messages') {
        await initializeCustomerMessagesTab();
    }
}

async function switchToWorkerTab(tabType) {
    // CLEANUP: Close all message threads when switching tabs
    closeAllMessageThreads();
    
    // CLEANUP: Cancel any active selections when switching tabs
    cancelSelection();
    
    // CLEANUP: Hide avatar overlay when switching tabs
    hideAvatarOverlay();
    
    // Update worker tab states
    document.querySelectorAll('.worker-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeTabBtn = document.querySelector(`.worker-tabs [data-tab="${tabType}"]`);
    if (activeTabBtn) {
        activeTabBtn.classList.add('active');
    }
    
    // Update worker content visibility
    document.querySelectorAll('.worker-content').forEach(wrapper => {
        wrapper.style.display = 'none';
        wrapper.classList.remove('active');
    });
    
    // Ensure unified messages content is hidden when switching away
    const unifiedContentWorkerScope = document.getElementById('unified-messages-content');
    if (unifiedContentWorkerScope) {
        unifiedContentWorkerScope.style.display = 'none';
        unifiedContentWorkerScope.classList.remove('active');
    }
    
    // Remove active state from unified Messages tabs (both roles)
    document.getElementById('unifiedMessagesTab')?.classList.remove('active');
    document.getElementById('unifiedMessagesTabWorker')?.classList.remove('active');
    
    const activeWrapper = document.getElementById(`${tabType}-content`);
    if (activeWrapper) {
        activeWrapper.style.display = 'block';
        activeWrapper.classList.add('active');
    }
    
    console.log(`🔄 Switched to worker tab: ${tabType}`);
    
    // Load worker content
    if (tabType === 'worker-alerts') {
        await initializeWorkerAlertsTab();
    } else if (tabType === 'worker-chats') {
        await initializeWorkerChatsTab();
    } else if (tabType === 'worker-messages') {
        await initializeWorkerMessagesTab();
    }
}

// Title management removed - header always shows "COMMUNICATIONS"

// MEMORY LEAK FIX: Cleanup job listing event listeners before reinitializing
function cleanupJobListingListeners() {
    const jobHeaders = document.querySelectorAll('.job-header');
    
    jobHeaders.forEach(header => {
        // Clone and replace node to remove ALL event listeners
        if (header && header.parentNode) {
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
        }
    });
    
    console.log('🧹 Cleaned up job listing event listeners');
}

// Job Listings Management
function initializeJobListings() {
    // CRITICAL FIX: Clean up existing event listeners before re-initializing
    cleanupJobListingListeners();
    
    const jobHeaders = document.querySelectorAll('.job-header');
    
    jobHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            const jobListing = this.closest('.job-listing');
            const applicationsList = document.getElementById('applications-' + jobId);
            const expandIcon = this.querySelector('.expand-icon');
            
            if (applicationsList && expandIcon) {
                const isExpanded = jobListing.classList.contains('expanded');
                
                if (isExpanded) {
                    // Collapse current listing
                    jobListing.classList.remove('expanded');
                    applicationsList.style.display = 'none';
                    expandIcon.textContent = '▼';
                } else {
                    // First, close all other expanded listings
                    closeAllJobListings();
                    
                    // Then expand the current listing
                    jobListing.classList.add('expanded');
                    applicationsList.style.display = 'block';
                    expandIcon.textContent = '▲';
                    
                    // Smooth scroll to center the expanded job listing
                    setTimeout(() => {
                        scrollToJobListing(jobListing);
                    }, 100); // Small delay to allow expansion animation
                }
            }
        });
    });
}

// Helper function to close all expanded job listings
function closeAllJobListings() {
    const allJobListings = document.querySelectorAll('.job-listing');
    
    allJobListings.forEach(listing => {
        const jobHeader = listing.querySelector('.job-header');
        const jobId = jobHeader.getAttribute('data-job-id');
        const applicationsList = document.getElementById('applications-' + jobId);
        const expandIcon = jobHeader.querySelector('.expand-icon');
        
        if (listing.classList.contains('expanded')) {
            listing.classList.remove('expanded');
            if (applicationsList) {
                applicationsList.style.display = 'none';
            }
            if (expandIcon) {
                expandIcon.textContent = '▼';
            }
        }
    });
}

// Smooth scroll to center an expanded job listing for optimal UX
function scrollToJobListing(jobListing) {
    // Find the applications tab scroll container
    const applicationsTab = document.querySelector('#applications-content');
    const scrollContainer = applicationsTab?.querySelector('.tab-scroll-container');
    
    if (!scrollContainer || !jobListing) {
        console.warn('Scroll container or job listing not found for auto-scroll');
        return;
    }
    
    // Calculate the position to center the job listing
    const containerRect = scrollContainer.getBoundingClientRect();
    const jobRect = jobListing.getBoundingClientRect();
    
    // Get current scroll position
    const currentScrollTop = scrollContainer.scrollTop;
    
    // Calculate where the job listing currently is relative to the scroll container
    const jobOffsetFromTop = jobRect.top - containerRect.top + currentScrollTop;
    
    // Calculate the scroll position to center the job listing
    const containerHeight = containerRect.height;
    const jobHeight = jobRect.height;
    
    // Position job listing in the center of the visible area
    // Account for the expanded height by adding some extra space
    const targetScrollTop = jobOffsetFromTop - (containerHeight / 2) + (jobHeight / 2);
    
    // Ensure we don't scroll past the top
    const finalScrollTop = Math.max(0, targetScrollTop);
    
    // Smooth scroll animation
    scrollContainer.scrollTo({
        top: finalScrollTop,
        behavior: 'smooth'
    });
    
    console.log(`Auto-scrolling to center job listing at position ${finalScrollTop}`);
}

// Application Action Overlay Management
function initializeApplicationActions() {
    // CRITICAL FIX: Clean up existing event listeners before re-initializing
    // This prevents duplicate listeners that cause the double-click bug
    cleanupApplicationActionListeners();
    
    const applicationCards = document.querySelectorAll('.application-card');
    const actionOverlay = document.getElementById('applicationActionOverlay');
    const actionProfileName = document.getElementById('actionProfileName');
    const actionProfileImage = document.getElementById('actionProfileImage');
    const actionProfileRating = document.getElementById('actionProfileRating');
    const actionReviewCount = document.getElementById('actionReviewCount');
    const hireJobBtn = document.getElementById('hireJobBtn');
    
    applicationCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Prevent event bubbling
            e.stopPropagation();
            
            // Get applicant data from the card
            const userName = this.querySelector('[data-user-name]').getAttribute('data-user-name');
            const userId = this.getAttribute('data-user-id');
            const userPhoto = this.getAttribute('data-user-photo'); // Get from card data attribute
            const userRating = parseInt(this.querySelector('[data-user-rating]').getAttribute('data-user-rating'));
            const reviewCount = parseInt(this.querySelector('[data-review-count]').getAttribute('data-review-count'));
            // REMOVED: applicationId - applications moved to jobs.html
            const jobTitle = this.getAttribute('data-job-title'); // Get job title
            
            // Find the job ID from the parent job listing
            const jobListing = this.closest('.job-listing');
            const jobId = jobListing ? jobListing.getAttribute('data-job-id') : null;
            
            console.log(`Opening overlay for ${userName} with ${userRating} star rating (${reviewCount} reviews)`);
            console.log(`Job context: ${jobTitle} (ID: ${jobId})`);
            
            // Update overlay content
            actionProfileName.textContent = userName;
            actionProfileImage.src = userPhoto; // Use photo URL directly
            actionProfileImage.alt = userName;
            
            // Update star rating and review count
            updateActionStars(userRating);
            actionReviewCount.textContent = `(${reviewCount})`;
            
            // Store application data for hire button
            // REMOVED: applicationId - applications moved to jobs.html
            hireJobBtn.setAttribute('data-user-id', userId);
            hireJobBtn.setAttribute('data-user-name', userName);
            hireJobBtn.setAttribute('data-job-id', jobId);
            hireJobBtn.setAttribute('data-job-title', jobTitle);
            
            // Store application data for reject button
            const rejectJobBtn = document.getElementById('rejectJobBtn');
            if (rejectJobBtn) {
                // REMOVED: applicationId - applications moved to jobs.html
                rejectJobBtn.setAttribute('data-user-id', userId);
                rejectJobBtn.setAttribute('data-user-name', userName);
                rejectJobBtn.setAttribute('data-job-id', jobId);
                rejectJobBtn.setAttribute('data-job-title', jobTitle);
                console.log('=== SETTING REJECT BUTTON DATA ===');
                // REMOVED: Application ID console.log - applications moved to jobs.html
                console.log('User ID set to:', userId);
                console.log('User Name set to:', userName);
                console.log('Job ID set to:', jobId);
                console.log('Job Title set to:', jobTitle);
            } else {
                console.error('Reject button not found!');
            }
            
            // Store application data for contact button
            const contactBtn = document.getElementById('contactBtn');
            if (contactBtn) {
                contactBtn.setAttribute('data-user-id', userId);
                contactBtn.setAttribute('data-user-name', userName);
                // REMOVED: applicationId - applications moved to jobs.html
            }
            
            // Show overlay
            actionOverlay.classList.add('show');
            
            // Double-check stars are updated after overlay is shown
            setTimeout(() => {
                updateActionStars(userRating);
            }, 50);
        });
    });
    
    // Close overlay when clicking outside
    actionOverlay.addEventListener('click', function(e) {
        if (e.target === actionOverlay) {
            closeActionOverlay();
        }
    });
    
    // Handle profile button click
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            const userName = actionProfileImage.alt;
            if (userName) {
                // Convert user name to URL-friendly format
                const userId = userName.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                // Navigate to profile page
                window.location.href = `profile.html?userId=${userId}`;
            }
        });
    }

    // Handle contact button click
    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            console.log('Contact button clicked');
            const userName = this.getAttribute('data-user-name');
            const userId = this.getAttribute('data-user-id');
            // REMOVED: applicationId - applications moved to jobs.html
            
            console.log('Contact button data:', { userName, userId });
            
            if (userName && userId) {
                console.log(`Opening contact message for ${userName}`);
                
                // Close the current overlay
                closeActionOverlay();
                
                // Show contact message overlay
                showContactMessageOverlay(userId, userName, null); // REMOVED: applicationId parameter
            } else {
                console.error('Missing contact button data attributes:', { userName, userId });
            }
        });
    }
    
    // Handle hire button click
    if (hireJobBtn) {
        hireJobBtn.addEventListener('click', function() {
            // REMOVED: applicationId - applications moved to jobs.html
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const jobId = this.getAttribute('data-job-id');
            const jobTitle = this.getAttribute('data-job-title');
            
            // CRITICAL FIX: Validate data before proceeding
            if (!userId || !userName) {
                console.error('❌ HIRE BUTTON ERROR: Missing critical data attributes');
                return;
            }
            
            // REMOVED: Firebase hire action logging - hire/reject functionality moved to jobs.html
            console.log('REMOVED: Firebase hire action - functionality moved to jobs.html');
            
            // REMOVED: Firestore batch operations block - hire/reject functionality moved to jobs.html
            
            // Close action overlay first
            closeActionOverlay();
            
            // Show confirmation with hire-specific styling
            showConfirmationOverlay(
                'success',
                'Application Accepted!',
                `You have hired ${userName} for the job. They will be notified and you can coordinate the work details through messages.`
            );
            
            // REMOVED: Job listing removal logic - applications moved to jobs.html
            setTimeout(() => {
                // REMOVED: Application card DOM manipulation - applications moved to jobs.html
                const applicationCard = null;
                
                if (applicationCard) {
                    // Find the parent job listing
                    const jobListing = applicationCard.closest('.job-listing');
                    
                    if (jobListing) {
                        jobListing.style.transition = 'all 0.4s ease';
                        jobListing.style.opacity = '0';
                        jobListing.style.transform = 'translateY(-20px)';
                        
                        setTimeout(() => {
                            jobListing.remove();
                            updateApplicationsCount();
                            updateJobHeaderCounts();
                        }, 400);
                    }
                }
            }, 500); // Reduced delay from 2000ms to 500ms
        });
    }
    
    // Handle reject button click
    const rejectJobBtn = document.getElementById('rejectJobBtn');
    if (rejectJobBtn) {
        rejectJobBtn.addEventListener('click', function() {
            // REMOVED: applicationId - applications moved to jobs.html
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const jobId = this.getAttribute('data-job-id');
            const jobTitle = this.getAttribute('data-job-title');
            
            // CRITICAL FIX: Validate data before proceeding
            if (!userId || !userName) {
                console.error('❌ REJECT BUTTON ERROR: Missing critical data attributes');
                return;
            }
            
            // REMOVED: Firebase reject action logging - hire/reject functionality moved to jobs.html
            console.log('REMOVED: Firebase reject action - functionality moved to jobs.html');
            
            // REMOVED: Firestore batch operations block - hire/reject functionality moved to jobs.html
            
            // Close action overlay first
            closeActionOverlay();
            
            // Show confirmation with reject-specific styling  
            showConfirmationOverlay(
                'reject',
                'Application Rejected',
                `${userName}'s application has been rejected. They will be notified appropriately.`
            );
            
            // Remove the application card from UI after confirmation
            setTimeout(() => {
                // REMOVED: Application card DOM manipulation - applications moved to jobs.html
                const applicationCard = null;
                if (applicationCard) {
                    applicationCard.style.transition = 'all 0.3s ease';
                    applicationCard.style.opacity = '0';
                    applicationCard.style.transform = 'translateX(100%)';
                    
                    setTimeout(() => {
                        applicationCard.remove();
                        
                        // Update counts after removing application card
                        // Keep job listing even if empty (job is still open for new applications)
                        updateJobHeaderCounts();
                        updateApplicationsCount();
                    }, 300);
                }
            }, 500); // Reduced delay from 2000ms to 500ms
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && actionOverlay.classList.contains('show')) {
            closeActionOverlay();
        }
    });
}

// CRITICAL BUG FIX: Clean up existing event listeners from shared modal buttons
// This prevents the double-click bug when navigating between tabs
function cleanupApplicationActionListeners() {
    // Clean up application card listeners first
    const applicationCards = document.querySelectorAll('.application-card');
    applicationCards.forEach(card => {
        if (card && card.parentNode) {
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        }
    });
    
    // Clean up action button listeners
    const hireJobBtn = document.getElementById('hireJobBtn');
    const rejectJobBtn = document.getElementById('rejectJobBtn');
    const profileBtn = document.getElementById('profileBtn');
    const contactBtn = document.getElementById('contactBtn');
    const actionOverlay = document.getElementById('applicationActionOverlay');
    
    // Clone and replace nodes to remove ALL event listeners
    // This is the most reliable way to ensure complete cleanup
    if (hireJobBtn && hireJobBtn.parentNode) {
        const newHireBtn = hireJobBtn.cloneNode(true);
        hireJobBtn.parentNode.replaceChild(newHireBtn, hireJobBtn);
    }
    
    if (rejectJobBtn && rejectJobBtn.parentNode) {
        const newRejectBtn = rejectJobBtn.cloneNode(true);
        rejectJobBtn.parentNode.replaceChild(newRejectBtn, rejectJobBtn);
    }
    
    if (profileBtn && profileBtn.parentNode) {
        const newProfileBtn = profileBtn.cloneNode(true);
        profileBtn.parentNode.replaceChild(newProfileBtn, profileBtn);
    }
    
    if (contactBtn && contactBtn.parentNode) {
        const newContactBtn = contactBtn.cloneNode(true);
        contactBtn.parentNode.replaceChild(newContactBtn, contactBtn);
    }
    
    // Clean up overlay click listeners
    if (actionOverlay && actionOverlay.parentNode) {
        const newOverlay = actionOverlay.cloneNode(true);
        actionOverlay.parentNode.replaceChild(newOverlay, actionOverlay);
    }
    
    console.log('🧹 Cleaned up application cards and action button event listeners');
}

function updateActionStars(rating) {
    const stars = document.querySelectorAll('.action-star');
    console.log(`Found ${stars.length} stars, updating to ${rating} rating`);
    
    // First, remove all filled classes to reset
    stars.forEach(star => {
        star.classList.remove('filled');
    });
    
    // Then add filled class to the appropriate number of stars
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            console.log(`Filled star ${index + 1}`);
        }
    });
    
    console.log(`Updated overlay stars to ${rating} rating`);
}

function closeActionOverlay() {
    const actionOverlay = document.getElementById('applicationActionOverlay');
    if (actionOverlay) {
        actionOverlay.classList.remove('show');
    }
}

// Check if there are any applications and show/hide placeholder accordingly
function checkApplicationsContent() {
    const applicationsContainer = document.getElementById('applicationsContainer');
    const applicationsPlaceholder = document.getElementById('applicationsPlaceholder');
    
    if (applicationsContainer && applicationsPlaceholder) {
        const jobListings = applicationsContainer.querySelectorAll('.job-listing');
        const hasApplications = jobListings.length > 0;
        
        if (hasApplications) {
            // Show job listings, hide placeholder
            applicationsContainer.style.display = 'block';
            applicationsPlaceholder.style.display = 'none';
        } else {
            // Show placeholder, hide job listings
            applicationsContainer.style.display = 'none';
            applicationsPlaceholder.style.display = 'block';
        }
    }
}

// Function to be called when applications are added/removed dynamically
function updateApplicationsDisplay() {
    checkApplicationsContent();
}

// Confirmation Overlay Functions
function showConfirmationOverlay(type, title, message) {
    const overlay = document.getElementById('confirmationOverlay');
    const icon = document.getElementById('confirmationIcon');
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    
    if (overlay && icon && titleElement && messageElement) {
        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Set icon and styling based on type
        if (type === 'success') {
            icon.textContent = '✓';
            icon.className = 'confirmation-icon success';
        } else if (type === 'reject') {
            icon.textContent = '✗';
            icon.className = 'confirmation-icon reject';
        }
        
        // Show overlay
        overlay.classList.add('show');
    }
}

function closeConfirmationOverlay() {
    const overlay = document.getElementById('confirmationOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        
        // MEMORY LEAK FIX: Remove escape key listener
        if (overlay._escapeHandler) {
            document.removeEventListener('keydown', overlay._escapeHandler);
            overlay._escapeHandler = null;
        }
    }
}

// Initialize confirmation overlay
function initializeConfirmationOverlay() {
    const overlay = document.getElementById('confirmationOverlay');
    const confirmBtn = document.getElementById('confirmationBtn');
    
    // Close overlay when clicking OK button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', closeConfirmationOverlay);
    }
    
    // Close overlay when clicking outside
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeConfirmationOverlay();
            }
        });
    }
    
    // Close with Escape key - MEMORY LEAK FIX: Store reference for cleanup
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
            closeConfirmationOverlay();
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Store reference for cleanup
    overlay._escapeHandler = escapeHandler;
}

// Notifications Management
function initializeNotifications() {
    // Handle notification item clicks (mark as read, etc.) with memory leak prevention
    const notificationItems = document.querySelectorAll('.notification-item');
    
    // Clear any existing event listeners first (your memory leak prevention)
    notificationItems.forEach(item => {
        // Clone node to remove all event listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
    });
    
    // Re-select items after cloning (clean slate)
    const freshNotificationItems = document.querySelectorAll('.notification-item');
    
    // Initialize action buttons on clean elements (no duplicates)
    const freshActionBtns = document.querySelectorAll('.notification-action-btn');
    
    freshActionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent notification item click
            
            const btnText = this.textContent.trim();
            const notificationItem = this.closest('.notification-item');
            const notificationTitle = notificationItem.querySelector('.notification-title').textContent;
            
            // Mark notification as read when any action button is clicked
            markNotificationAsRead(notificationItem);
            
            // Handle different action types
            switch(btnText) {
                case 'Review Applications':
                    handleReviewApplications(notificationItem);
                    break;
                case 'View Application':
                    handleViewApplication(notificationItem);
                    break;
                case 'Reply':
                    handleReplyMessage(notificationItem);
                    break;
                default:
                    console.log(`Action: ${btnText} for notification: ${notificationTitle}`);
            }
        });
    });
    
    freshNotificationItems.forEach((item, index) => {
        // Add debugging for first notification item
        if (index === 0) {
            console.log('First notification item initialized:', item);
            item.setAttribute('data-first-item', 'true');
            console.log('First item identification applied');
        }
        
        // Initialize long press selection for each notification
        initializeLongPressSelection(item);
        
        // Add click handler with immediate binding
        const clickHandler = function(e) {
            console.log(`Notification clicked - Index: ${index}, First item: ${this.hasAttribute('data-first-item')}`);
            
            // Check if we're in selection mode by looking for selection controls
            const selectionBar = document.getElementById('selectionControls');
            const isInSelectionMode = selectionBar && selectionBar.style.display === 'flex';
            
            if (isInSelectionMode) {
                // Prevent normal action in selection mode
                e.preventDefault();
                e.stopPropagation();
                
                // Additional debugging for first item
                if (this.hasAttribute('data-first-item')) {
                    console.log('*** FIRST NOTIFICATION ITEM CLICKED IN SELECTION MODE ***');
                }
                
                // Toggle selection
                this.classList.toggle('selected');
                updateSelectionControls();
                console.log('Toggled selection for notification');
            } else {
                // Normal click - mark as read only if not in selection mode
                markNotificationAsRead(this);
            }
        };
        
        item.addEventListener('click', clickHandler);
        
        // Store reference for debugging
        item._clickHandler = clickHandler;
    });
}

function handleReviewApplications(notificationItem) {
    // Extract job info from notification
    const message = notificationItem.querySelector('.notification-message').textContent;
    
    // REMOVED: Switch to applications tab - applications moved to jobs.html
    // const applicationsTab = document.getElementById('applicationsTab');
    // if (applicationsTab) {
    //     applicationsTab.click();
    // }
    
    // Show confirmation that we're navigating
    showConfirmationOverlay(
        'success',
        'Navigating to Applications',
        'Taking you to review your job applications.'
    );
    
    console.log('Backend action: Navigate to applications for job review - REMOVED');
}

function handleViewApplication(notificationItem) {
    const message = notificationItem.querySelector('.notification-message').textContent;
    const applicantMatch = message.match(/\*\*(.*?)\*\*/);
    const applicantName = applicantMatch ? applicantMatch[1] : 'Unknown';
    
    // REMOVED: Extract application data - applications moved to jobs.html
    const jobId = notificationItem.getAttribute('data-job-id');
    const jobTitle = notificationItem.getAttribute('data-job-title');
    
    if (jobId) {
        // REMOVED: navigateToApplicationCard call - applications moved to jobs.html
        try {
            console.log('REMOVED: navigateToApplicationCard call - applications moved to jobs.html');
        } catch (error) {
            // Backend-ready error handling
            console.warn('Navigation failed, using fallback:', error);
            // REMOVED: Switch to applications tab - applications moved to jobs.html
            showTemporaryNotification('Application view functionality moved to jobs.html');
        }
    } else {
        // REMOVED: Fallback tab switch - applications moved to jobs.html
        console.warn('Missing job ID - application functionality moved to jobs.html');
        showTemporaryNotification('Application view functionality moved to jobs.html');
    }
    
    console.log('Backend action: Navigate to specific application for:', applicantName, '- REMOVED');
}

function handleReplyMessage(notificationItem) {
    const message = notificationItem.querySelector('.notification-message').textContent;
    const senderMatch = message.match(/\*\*(.*?)\*\*/);
    const senderName = senderMatch ? senderMatch[1] : 'Unknown';
    
    // Get the threadId from the Reply button's data attributes
    const replyButton = notificationItem.querySelector('[data-action="reply_message"]');
    const threadId = replyButton ? replyButton.getAttribute('data-thread-id') : null;
    
    if (threadId) {
        // Navigate to specific thread
        navigateToMessageThread(threadId);
    } else {
        // Fallback: just switch to messages tab
        const messagesTab = document.getElementById('messagesTab');
        if (messagesTab) {
            messagesTab.click();
        }
    }
    
    console.log('Backend action: Open message thread with:', senderName, 'ThreadID:', threadId);
}

function navigateToMessageThread(threadId) {
    // Switch to messages tab first
    const messagesTab = document.getElementById('messagesTab');
    if (messagesTab) {
        messagesTab.click();
        
        // Use multiple attempts with increasing delays to find the thread
        const attemptToFindThread = (attempt = 1, maxAttempts = 3) => {
            // Try to find the specific message thread
            const messageThread = document.querySelector(`.message-thread[data-thread-id="${threadId}"]`);
            
            if (messageThread) {
                const threadHeader = messageThread.querySelector('.message-thread-header');
                
                if (threadHeader) {
                    // Check if thread is already expanded
                    const isExpanded = messageThread.classList.contains('expanded');
                    
                    if (!isExpanded) {
                        // Click the header to expand the thread
                        threadHeader.click();
                    }
                    
                    // Scroll to the thread
                    messageThread.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }
            } else if (attempt < maxAttempts) {
                setTimeout(() => attemptToFindThread(attempt + 1, maxAttempts), attempt * 100);
            }
        };
        
        // Start the first attempt after a short delay
        setTimeout(() => attemptToFindThread(), 100);
    }
}

// Update notification count (would be called when new notifications arrive)
function updateNotificationCount(count) {
    const notificationCountElement = document.querySelector('.notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = count;
        
        // Hide badge if count is 0
        if (count === 0) {
            notificationCountElement.style.display = 'none';
        } else {
            notificationCountElement.style.display = 'inline-block';
        }
    }
} 

// Mark notification as read functionality
function markNotificationAsRead(notificationItem) {
    if (!notificationItem.classList.contains('read')) {
        notificationItem.classList.add('read');
        
        // Add a read indicator
        let readIndicator = notificationItem.querySelector('.read-indicator');
        if (!readIndicator) {
            readIndicator = document.createElement('div');
            readIndicator.className = 'read-indicator';
            readIndicator.innerHTML = '✓ Read';
            notificationItem.appendChild(readIndicator);
        }
        
        // Update the notifications count
        updateNotificationsCount();
        
        // Here you would send read status to backend
        const notificationTitle = notificationItem.querySelector('.notification-title').textContent;
        console.log('Notification marked as read:', notificationTitle);
    }
}

// Long press selection functionality
function initializeLongPressSelection(notificationItem) {
    let longPressTimer;
    let isLongPress = false;
    let touchStartTime = 0;
    
    // Debug logging for first item
    if (notificationItem.hasAttribute('data-first-item')) {
        console.log('Initializing long press for FIRST notification item');
        console.log('First item element:', notificationItem);
        console.log('First item position:', notificationItem.getBoundingClientRect());
    }
    
    // Remove any existing event listeners first (cleanup)
    const events = ['touchstart', 'touchend', 'touchmove', 'mousedown', 'mouseup', 'mouseleave'];
    events.forEach(eventType => {
        notificationItem.removeEventListener(eventType, notificationItem[`_${eventType}Handler`]);
    });
    
    // Touch events for mobile
    notificationItem.addEventListener('touchstart', handleTouchStart, { passive: true });
    notificationItem.addEventListener('touchend', handleTouchEnd, { passive: true });
    notificationItem.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Mouse events for desktop
    notificationItem.addEventListener('mousedown', handleMouseStart);
    notificationItem.addEventListener('mouseup', handleMouseEnd);
    notificationItem.addEventListener('mouseleave', handleMouseEnd);
    
    // Store event handler references for cleanup
    notificationItem._touchstartHandler = handleTouchStart;
    notificationItem._touchendHandler = handleTouchEnd;
    notificationItem._touchmoveHandler = handleTouchMove;
    notificationItem._mousedownHandler = handleMouseStart;
    notificationItem._mouseupHandler = handleMouseEnd;
    notificationItem._mouseleaveHandler = handleMouseEnd;
    
    function handleTouchStart(e) {
        // Debug logging for first item
        if (notificationItem.hasAttribute('data-first-item')) {
            console.log('*** FIRST ITEM TOUCH START ***');
        }
        
        isLongPress = false;
        touchStartTime = Date.now();
        
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            if (notificationItem.hasAttribute('data-first-item')) {
                console.log('*** FIRST ITEM LONG PRESS TRIGGERED ***');
            }
            startSelectionMode(notificationItem);
        }, 500); // 500ms long press
    }
    
    function handleTouchMove(e) {
        // Cancel long press if user moves finger
        clearTimeout(longPressTimer);
        isLongPress = false;
    }
    
    function handleTouchEnd(e) {
        clearTimeout(longPressTimer);
        
        // If it was a long press, prevent the click event
        if (isLongPress || (Date.now() - touchStartTime > 450)) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        isLongPress = false;
    }
    
    function handleMouseStart(e) {
        if (e.button !== 0) return; // Only left mouse button
        
        // Debug logging for first item
        if (notificationItem.hasAttribute('data-first-item')) {
            console.log('*** FIRST ITEM MOUSE START ***');
        }
        
        isLongPress = false;
        touchStartTime = Date.now();
        
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            if (notificationItem.hasAttribute('data-first-item')) {
                console.log('*** FIRST ITEM MOUSE LONG PRESS TRIGGERED ***');
            }
            startSelectionMode(notificationItem);
        }, 500);
    }
    
    function handleMouseEnd(e) {
        clearTimeout(longPressTimer);
        
        // If it was a long press, prevent the click event
        if (isLongPress || (Date.now() - touchStartTime > 450)) {
            if (e && typeof e.preventDefault === 'function') {
                e.preventDefault();
                e.stopPropagation();
            }
        }
        
        isLongPress = false;
    }
}

function startSelectionMode(notificationItem) {
    // Add vibration feedback on mobile
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Debug logging for first item
    if (notificationItem.hasAttribute('data-first-item')) {
        console.log('*** STARTING SELECTION MODE FOR FIRST ITEM ***');
    }
    
    // Add selection class to the notification
    notificationItem.classList.add('selected');
    
    // Show selection controls
    showSelectionControls();
    
    console.log('Selection mode activated');
}

function showSelectionControls() {
    let selectionBar = document.getElementById('selectionControls');
    
    if (!selectionBar) {
        // Create selection controls bar
        selectionBar = document.createElement('div');
        selectionBar.id = 'selectionControls';
        selectionBar.className = 'selection-controls';
        selectionBar.innerHTML = `
            <div class="selection-info">
                <span id="selectionCount">1</span> selected
            </div>
            <div class="selection-actions">
                <button class="selection-btn cancel-btn" id="cancelSelectionBtn">Cancel</button>
                <button class="selection-btn delete-btn" id="deleteSelectionBtn">Delete</button>
            </div>
        `;
        
        // Add event listeners immediately after DOM insertion
        const cancelBtn = selectionBar.querySelector('.cancel-btn');
        const deleteBtn = selectionBar.querySelector('.delete-btn');
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel button clicked');
                cancelSelection();
            });
            console.log('Cancel button event listener added');
        }
        
        if (deleteBtn) {
            // Simple, direct click handler
            deleteBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Immediate deletion without any timing dependencies
                const selectedItems = document.querySelectorAll('.notification-item.selected');
                if (selectedItems.length > 0) {
                    selectedItems.forEach(item => item.remove());
                    
                    // Hide selection controls with animation
                    const selectionBar = document.getElementById('selectionControls');
                    if (selectionBar) {
                        selectionBar.style.opacity = '0';
                        selectionBar.style.transform = 'translateY(-100%)';
                        
                        setTimeout(() => {
                        selectionBar.style.display = 'none';
                        }, 300);
                    }
                    
                    // Remove selection class from active tab wrapper immediately
                    const activeTabWrapper = document.querySelector('.tab-content-wrapper.active');
                    if (activeTabWrapper) {
                        activeTabWrapper.classList.remove('selection-active');
                    }
                    
                    // Update notifications count
                    updateNotificationsCount();
                }
                
                return false;
            };
            
            console.log('Delete button direct onclick handler added');
        }
        
        // Insert after the tabs but before the messages content
        const messagesContent = document.querySelector('.messages-content');
        const tabsContainer = document.querySelector('.messages-tabs');
        
        // Insert after tabs container
        if (tabsContainer && tabsContainer.nextSibling) {
            tabsContainer.parentNode.insertBefore(selectionBar, tabsContainer.nextSibling);
        } else {
            // Fallback to before messages content
            messagesContent.parentNode.insertBefore(selectionBar, messagesContent);
        }
        
        console.log('Created selection controls bar');
    }
    
    // Ensure visibility with animated entrance
    selectionBar.style.display = 'flex';
    selectionBar.style.position = 'fixed';
    selectionBar.style.zIndex = '998';
    
    // Trigger entrance animation
    setTimeout(() => {
        selectionBar.style.opacity = '1';
        selectionBar.style.transform = 'translateY(0)';
    }, 10);
    
    // Add class to adjust content in independent tabs
    const activeTabWrapper = document.querySelector('.tab-content-wrapper.active');
    if (activeTabWrapper) {
        activeTabWrapper.classList.add('selection-active');
    }
    
    console.log('Selection controls shown with smooth animation');
    updateSelectionControls();
}

function updateSelectionControls() {
    const selectedItems = document.querySelectorAll('.notification-item.selected');
    const selectionCount = document.getElementById('selectionCount');
    const selectionBar = document.getElementById('selectionControls');
    
    if (selectedItems.length === 0) {
        // Don't auto-hide - let cancelSelection() handle hiding
        console.log('No items selected, but keeping selection bar visible');
    } else {
        if (selectionCount) {
            selectionCount.textContent = selectedItems.length;
        }
        console.log(`Updated selection count: ${selectedItems.length}`);
    }
}

function cancelSelection() {
    // Remove selection from all items
    const selectedItems = document.querySelectorAll('.notification-item.selected');
    selectedItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Hide selection controls with animation
    const selectionBar = document.getElementById('selectionControls');
    if (selectionBar) {
        // Trigger exit animation
        selectionBar.style.opacity = '0';
        selectionBar.style.transform = 'translateY(-100%)';
        
        // Actually hide after animation completes
        setTimeout(() => {
        selectionBar.style.display = 'none';
        }, 300);
    }
    
    // Remove selection class from active tab wrapper immediately for smooth transition
    const activeTabWrapper = document.querySelector('.tab-content-wrapper.active');
    if (activeTabWrapper) {
        activeTabWrapper.classList.remove('selection-active');
    }
    
    console.log('Selection cancelled with smooth animation');
}

// Add debouncing to prevent multiple calls
let deletionInProgress = false;

function deleteSelectedNotifications() {
    console.log('Delete function called');
    
    if (deletionInProgress) {
        console.log('Deletion already in progress, skipping');
        return;
    }
    
    deletionInProgress = true;
    
    const selectedItems = document.querySelectorAll('.notification-item.selected');
    console.log(`Found ${selectedItems.length} selected items`);
    
    if (selectedItems.length === 0) {
        console.log('No items selected, returning');
        deletionInProgress = false;
        return;
    }
    
    // Store references in an array to avoid NodeList issues
    const itemsToDelete = Array.from(selectedItems);
    console.log(`Converted to array: ${itemsToDelete.length} items`);
    
    // Add removing animation to selected items
    itemsToDelete.forEach((item, index) => {
        console.log(`Adding removing class to item ${index + 1}`);
        item.classList.add('removing');
    });
    
    // Force immediate deletion if animation doesn't work
    const forceDelete = () => {
        console.log('Force deleting items');
        itemsToDelete.forEach((item, index) => {
            if (item.parentNode) {
                console.log(`Force removing item ${index + 1} from DOM`);
                item.remove();
            }
        });
        
        // Update notifications count
        updateNotificationsCount();
        
        // Hide selection controls with animation
        const selectionBar = document.getElementById('selectionControls');
        if (selectionBar) {
            selectionBar.style.opacity = '0';
            selectionBar.style.transform = 'translateY(-100%)';
            
            setTimeout(() => {
            selectionBar.style.display = 'none';
            }, 300);
        }
        
        // Remove selection class from active tab wrapper immediately
        const activeTabWrapper = document.querySelector('.tab-content-wrapper.active');
        if (activeTabWrapper) {
            activeTabWrapper.classList.remove('selection-active');
        }
        
        console.log(`${itemsToDelete.length} notifications successfully deleted`);
        
        // Reset deletion flag
        deletionInProgress = false;
    };
    
    // Try animation first, but force delete as backup
    let deleted = false;
    
    // Animation approach
    setTimeout(() => {
        if (!deleted) {
            console.log('Animation timeout - removing items');
            deleted = true;
            forceDelete();
        }
    }, 350);
    
    // Also add a much faster backup in case console timing affects things
    setTimeout(() => {
        if (!deleted) {
            console.log('Fast backup delete triggered');
            deleted = true;
            forceDelete();
        }
    }, 50);
}

// ===== PHASE 1: MOCK DATA AND TEMPLATES =====

// Mock Notifications Data
const MOCK_NOTIFICATIONS = [
    {
        id: 'notif_xKj9mL2pQ8vR4sW7nC1e',  // Firebase auto-generated ID format
        notificationType: 'interview_request',
        recipientUid: 'user_currentUserUid', // Firebase UID format
        senderUid: 'system',
        read: false,
        createdAt: new Date('2025-12-22T12:30:00Z'), // Will be firebase.firestore.Timestamp
        updatedAt: new Date('2025-12-22T12:30:00Z'),
        
        // Firestore document structure - flat for better indexing
        title: '🎯 APPLICATION INTERVIEW REQUEST',
        message: '<strong>Janice Legaspi</strong> wants to interview you: "Hi Peter! I reviewed your application for the mobile app development project. Your portfolio is impressive! I\'d like to discuss the project details with you."',
        icon: '🎯',
        iconClass: 'interview-icon',
        priority: 'critical',
        category: 'interview',
        timeDisplay: '1 hour ago',
        dateDisplay: 'Dec. 22, 2025',
        
        // Related documents for Firestore
        relatedDocuments: {
            threadId: 4,
            messageId: 'msg_jL3nH8mK9vR4xJ2pS7',
            senderProfile: 'user_sL9nR4mK6jV8wT3yG7'
        },
        
        // Firebase-optimized action structure
        actions: [
            {
                type: 'secondary',
                action: 'reply_message',
                text: 'Reply',
                actionData: {
                    threadId: 4,
                    navigateTo: 'messages'
                }
            }
        ],
        
        // Firestore security rules compatibility
        metadata: {
            source: 'interview_system',
            businessLogic: 'application_interview_flow',
            indexed: true,
            specialCategory: 'high_priority_career_opportunity'
        }
    },
    {
        id: 'notif_bT8nX3mR9qY2fH6kL5w',
        notificationType: 'new_application',
        recipientUid: 'user_currentUserUid',
        senderUid: 'user_3vN8mQ4rT9xK2jP7sC1',
        read: false,
        createdAt: new Date('2025-12-22T10:15:00Z'),
        updatedAt: new Date('2025-12-22T10:15:00Z'),
        
        title: 'New Job Application Received',
        message: '<strong>Ana Rodriguez</strong> applied for "House cleaning service needed - weekly basis" with a ₱1,200 counter-offer.',
        icon: '🧑',
        iconClass: 'app-icon',
        priority: 'medium',
        category: 'application',
        timeDisplay: '3 hours ago',
        dateDisplay: 'Dec. 22, 2025',
        
        // Related document references for Firestore
        relatedDocuments: {
            // REMOVED: applicationId - applications moved to jobs.html
            jobId: 'job_gT5nM8xK2jS6wF3eA9',
            userProfile: 'user_3vN8mQ4rT9xK2jP7sC1'
        },
        
        actions: [
            // REMOVED: View Application button - applications moved to jobs.html
        ],
        
        metadata: {
            source: 'user_application',
            businessLogic: 'job_application_flow',
            indexed: true
        }
    },
    {
        id: 'notif_wR4nJ8mL9qX2kP5sT7v',
        notificationType: 'new_message',
        recipientUid: 'user_currentUserUid',
        senderUid: 'user_7yM3nK9rQ4vX2bS8jC5',
        read: false,
        createdAt: new Date('2025-12-21T16:00:00Z'),
        updatedAt: new Date('2025-12-21T16:00:00Z'),
        
        title: 'New Message Received',
        message: '<strong>Carlos Mendoza</strong> sent you a message: "Good morning! I saw your garden maintenance job posting. I have 12 years experience in landscaping and lawn care. I can start this week if you\'re interested."',
        icon: '💬',
        iconClass: 'msg-icon',
        priority: 'medium',
        category: 'message',
        timeDisplay: '1 day ago',
        dateDisplay: 'Dec. 21, 2025',
        
        relatedDocuments: {
            threadId: 3,
            messageId: 'msg_bQ3nH7mK8vR2xJ4pS9',
            senderProfile: 'user_7yM3nK9rQ4vX2bS8jC5'
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'reply_message',
                text: 'Reply',
                actionData: {
                    threadId: 3,
                    navigateTo: 'messages'
                }
            }
        ],
        
        metadata: {
            source: 'user_message',
            businessLogic: 'messaging_system',
            indexed: true
        }
    },
    {
        id: 'notif_cK8mL3nR9qY2fH6kX5w',
        notificationType: 'job_warning',
        recipientUid: 'user_currentUserUid',
        senderUid: 'system',
        read: false,
        createdAt: new Date('2025-12-21T15:00:00Z'),
        updatedAt: new Date('2025-12-21T15:00:00Z'),
        
        title: 'Job Application Limit Warning',
        message: 'Job "Carpenter needed for kitchen cabinet repair and refinish" has received 15/20 applications. Consider reviewing applications soon to avoid unlisting.',
        icon: '📋',
        iconClass: 'status-icon',
        priority: 'medium',
        category: 'job_status',
        timeDisplay: '1 day ago',
        dateDisplay: 'Dec. 21, 2025',
        
        relatedDocuments: {
            jobId: 'job_tR5nM8xK2jS6wF3eQ9',
            applicationCount: 15,
            maxApplications: 20
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'review_applications',
                text: 'Review Applications',
                actionData: {
                    jobId: 'job_tR5nM8xK2jS6wF3eQ9',
                    navigateTo: 'applications'
                }
            }
        ],
        
        metadata: {
            source: 'system',
            businessLogic: 'job_management',
            indexed: true
        }
    },
    {
        id: 'notif_pL9nX4mT7qK2jR8sW5',
        notificationType: 'new_application',
        recipientUid: 'user_currentUserUid',
        senderUid: 'user_dR7nK4mQ9xT2jP6sL8',
        read: false,
        createdAt: new Date('2025-12-20T14:00:00Z'),
        updatedAt: new Date('2025-12-20T14:00:00Z'),
        
        title: 'New Job Application Received',
        message: '<strong>Roberto Garcia</strong> applied for "Carpenter needed for kitchen cabinet repair and refinish" with a ₱2,800 counter-offer.',
        icon: '🧑',
        iconClass: 'app-icon',
        priority: 'medium',
        category: 'application',
        timeDisplay: '2 days ago',
        dateDisplay: 'Dec. 20, 2025',
        
        relatedDocuments: {
            // REMOVED: applicationId - applications moved to jobs.html
            jobId: 'job_xK4nM7rT8qJ2wS5nP9',
            userProfile: 'user_dR7nK4mQ9xT2jP6sL8'
        },
        
        actions: [
            // REMOVED: View Application button - applications moved to jobs.html
        ],
        
        metadata: {
            source: 'user_application',
            businessLogic: 'job_application_flow',
            indexed: true
        }
    },
    {
        id: 'notif_mK6nR3qT8jX2wS7nL4',
        notificationType: 'job_posted',
        recipientUid: 'user_currentUserUid',
        senderUid: 'system',
        read: false,
        createdAt: new Date('2025-12-19T10:00:00Z'),
        updatedAt: new Date('2025-12-19T10:00:00Z'),
        
        title: 'Job Successfully Posted',
        message: 'Your job "Plumbing repair - kitchen sink leak" has been successfully posted and is now visible to service providers.',
        icon: '⚙️',
        iconClass: 'system-icon',
        priority: 'low',
        category: 'system',
        timeDisplay: '3 days ago',
        dateDisplay: 'Dec. 19, 2025',
        
        relatedDocuments: {
            jobId: 'job_wR4nM7xT9qK2jP5sL8'
        },
        
        actions: [],
        
        metadata: {
            source: 'system',
            businessLogic: 'job_posting',
            indexed: true
        }
    },
    {
        id: 'notif_sT5nL8mR9qK2jX4wP7',
        notificationType: 'new_message',
        recipientUid: 'user_currentUserUid',
        senderUid: 'user_nP6mR3qT8jK2wS7nL9',
        read: false,
        createdAt: new Date('2025-12-19T09:00:00Z'),
        updatedAt: new Date('2025-12-19T09:00:00Z'),
        
        title: 'New Message Received',
        message: '<strong>Pedro Santos</strong> sent you a message: "Good morning! I can start the work tomorrow if you\'re available. Please let me know."',
        icon: '💬',
        iconClass: 'msg-icon',
        priority: 'medium',
        category: 'message',
        timeDisplay: '3 days ago',
        dateDisplay: 'Dec. 19, 2025',
        
        relatedDocuments: {
            threadId: 'thread_qJ4nX7mR8kT2wP5sL9',
            messageId: 'msg_vW8nL3mK7qR2jT4sP6',
            senderProfile: 'user_nP6mR3qT8jK2wS7nL9'
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'reply_message',
                text: 'Reply',
                actionData: {
                    threadId: 'thread_qJ4nX7mR8kT2wP5sL9',
                    navigateTo: 'messages'
                }
            }
        ],
        
        metadata: {
            source: 'user_message',
            businessLogic: 'messaging_system',
            indexed: true
        }
    },
    {
        id: 'notif_hJ3nM6rT9qX2kS8wL5',
        notificationType: 'job_status',
        recipientUid: 'user_currentUserUid',
        senderUid: 'system',
        read: true,
        createdAt: new Date('2025-12-18T15:30:00Z'),
        updatedAt: new Date('2025-12-21T10:00:00Z'),
        
        title: 'Job Completed Successfully',
        message: 'Your job "Garden landscaping and maintenance" has been marked as completed by Maria Santos. Please review the work and rate your experience.',
        icon: '✅',
        iconClass: 'system-icon',
        priority: 'medium',
        category: 'job_status',
        timeDisplay: '4 days ago',
        dateDisplay: 'Dec. 18, 2025',
        
        relatedDocuments: {
            jobId: 'job_lM8nR4qT7xK2jW5sP3',
            contractId: 'contract_app_bH5nK8mR2qX4jT7sW9',
            workerProfile: 'user_qX5nK8mT3jR7wS2nC9'
        },
        
        actions: [
            {
                type: 'primary',
                action: 'rate_worker',
                text: 'Rate Work',
                actionData: {
                    contractId: 'contract_app_bH5nK8mR2qX4jT7sW9',
                    workerId: 'user_qX5nK8mT3jR7wS2nC9'
                }
            }
        ],
        
        metadata: {
            source: 'system',
            businessLogic: 'job_completion',
            indexed: true
        }
    }
];

// Generate Notification HTML
function generateNotificationHTML(notification) {
    const dataAttributes = [
        `data-notification-id="${notification.id}"`,
        `data-notification-type="${notification.notificationType}"`,
        `data-read="${notification.read}"`,
        `data-timestamp="${notification.timestamp}"`
    ];

    // Add conditional data attributes - check both top-level and relatedDocuments
    const jobId = notification.jobId || notification.relatedDocuments?.jobId;
    // REMOVED: applicationId - applications moved to jobs.html
    const threadId = notification.threadId || notification.relatedDocuments?.threadId;
    
    if (jobId) dataAttributes.push(`data-job-id="${jobId}"`);
    if (notification.jobTitle) dataAttributes.push(`data-job-title="${notification.jobTitle}"`);
    // REMOVED: applicationId data attribute - applications moved to jobs.html
    if (threadId) dataAttributes.push(`data-thread-id="${threadId}"`);
    if (notification.userId) dataAttributes.push(`data-user-id="${notification.userId}"`);
    if (notification.userName) dataAttributes.push(`data-user-name="${notification.userName}"`);

    const actionsHTML = notification.actions.map(action => {
        const actionDataAttrs = [`data-action="${action.action}"`];
        // Use actionData for button-specific attributes
        if (action.actionData?.jobId) actionDataAttrs.push(`data-job-id="${action.actionData.jobId}"`);
        // REMOVED: applicationId action data - applications moved to jobs.html
        if (action.actionData?.threadId) actionDataAttrs.push(`data-thread-id="${action.actionData.threadId}"`);
        
        return `<button class="notification-action-btn ${action.type}" ${actionDataAttrs.join(' ')}>${action.text}</button>`;
    }).join('');

    return `
        <div class="notification-item ${notification.type}" ${dataAttributes.join(' ')}>
            <div class="notification-icon ${notification.iconClass}">${notification.icon}</div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-meta">
                    <span class="notification-time">${notification.timeDisplay}</span>
                    <span class="notification-date">${notification.dateDisplay}</span>
                </div>
                ${actionsHTML ? `<div class="notification-actions">${actionsHTML}</div>` : ''}
            </div>
        </div>
    `;
}

// Generate All Notifications Content
function generateNotificationsContent() {
    return MOCK_NOTIFICATIONS.map(notification => generateNotificationHTML(notification)).join('');
}

// Load Notifications Tab
function loadNotificationsTab() {
    const container = document.querySelector('#notifications-content .notifications-container');
    if (container) {
        container.innerHTML = generateNotificationsContent();
        
        // Reinitialize event handlers for the dynamically loaded content
        initializeNotifications();
        
        // TEMPORARY FIX: Force-enable selection for first item
        fixFirstNotificationSelection();
        
        // Update notification count badge
        updateNotificationsCount();
        
        console.log('Notifications tab content loaded independently');
    } else {
        console.error('Notifications container not found');
    }
}

// TEMPORARY FIX: Force selection capability for first notification item
function fixFirstNotificationSelection() {
    const firstItem = document.querySelector('#notifications-content .notification-item:first-child');
    if (firstItem) {
        console.log('Applying first item selection fix');
        
        // Force-add selection capability with highest priority event listeners
        const forceSelectionHandler = function(e) {
            console.log('FORCE SELECTION HANDLER TRIGGERED for first item');
            
            const selectionBar = document.getElementById('selectionControls');
            const isInSelectionMode = selectionBar && selectionBar.style.display === 'flex';
            
            if (isInSelectionMode) {
                e.preventDefault();
                e.stopPropagation();
                
                // Force toggle selection
                this.classList.toggle('selected');
                updateSelectionControls();
                console.log('FORCED selection toggle for first notification');
                
                return false; // Stop all other processing
            }
        };
        
        // Add with capture = true to get first priority
        firstItem.addEventListener('click', forceSelectionHandler, true);
        
        // Add visual indicator this fix is applied
        firstItem.style.boxShadow = '0 0 5px rgba(255, 165, 0, 0.8)';
        firstItem.setAttribute('data-selection-fixed', 'true');
        
        console.log('First item selection fix applied');
    }
}

// ===== FIREBASE DATA MAPPING DOCUMENTATION =====
/*
COMPREHENSIVE MESSAGE SYSTEM FIREBASE INTEGRATION MAPPING

This mock data structure is designed for direct Firebase Firestore integration.
All fields and relationships are mapped for production backend implementation.

COLLECTIONS STRUCTURE:
1. conversations/ - Main conversation threads
2. conversations/{conversationId}/messages/ - Individual messages
3. users/{userId}/conversations/ - User conversation indexes
4. applications/{applicationId} - Referenced applications
5. jobs/{jobId} - Referenced job posts

CONVERSATION DOCUMENT SCHEMA:
{
  conversationId: string (auto-generated or threadId),
  participants: [userId1, userId2], // Array for easy querying
  participantDetails: {
    userId1: { name: string, avatar: string, role: 'customer'|'worker' },
    userId2: { name: string, avatar: string, role: 'customer'|'worker' }
  },
  jobId: string, // Reference to jobs collection
  jobTitle: string, // Denormalized for performance
  threadOrigin: 'application'|'job', // How the conversation started
  applicationId: string|null, // Reference to applications collection if origin is 'application'
  currentUserRole: { // Per-user role mapping
    userId1: 'customer'|'worker',
    userId2: 'customer'|'worker'
  },
  status: 'active'|'archived'|'deleted',
  isNew: { // Per-user new status
    userId1: boolean,
    userId2: boolean
  },
  lastMessage: {
    content: string,
    senderId: string,
    timestamp: timestamp,
    messageId: string
  },
  lastActivity: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp,
  // Privacy and moderation
  blockedBy: { userId: blockedUserId }, // If conversation is blocked by user
  hiddenFor: { userId: boolean }, // If conversation is hidden for user
  deletedFor: { userId: timestamp }, // Soft delete per user
  reportedBy: [userId], // Moderation flags
  // Firebase security rules support
  readPermissions: [userId1, userId2],
  writePermissions: [userId1, userId2]
}

MESSAGE DOCUMENT SCHEMA:
{
  messageId: string (auto-generated),
  conversationId: string, // Parent conversation reference
  senderId: string, // Reference to users collection
  senderName: string, // Denormalized for performance
  senderType: 'customer'|'worker', // Role in this conversation
  recipientId: string, // Other participant
  content: string,
  timestamp: timestamp,
  read: boolean,
  readAt: timestamp|null,
  direction: 'incoming'|'outgoing', // Relative to current user
  messageType: 'text'|'image'|'file'|'system', // Future extensibility
  // Moderation and privacy
  deletedFor: { userId: timestamp }, // Soft delete per user
  hiddenFor: { userId: boolean },
  edited: boolean,
  editedAt: timestamp|null,
  reportedBy: [userId],
  // Firebase security
  readPermissions: [senderId, recipientId],
  writePermissions: [senderId] // Only sender can edit/delete
}

CONVERSATION CREATION RULES:
1. APPLICATION-BASED THREADS (threadOrigin: 'application'):
   - Created when customer contacts worker's application via "Contact" button
   - applicationId must be provided and valid
   - currentUserRole determines user permissions  
   - Customer and Worker roles have different overlay options
   - "View Application" button removed since applications moved to jobs.html

2. JOB-BASED THREADS (threadOrigin: 'job'):
   - Created when worker contacts customer's job post via "Contact" button
   - applicationId is null
   - All participants can view job post via "View Job Post" button
   - Essential for workers to reference original job requirements

AVATAR OVERLAY PERMISSIONS:
- Current user's own avatars: NO overlay (prevents self-actions)
- Other participants' avatars: Full overlay with context-aware buttons
- View Application: Only for customers in application threads
- View Job Post: Available for all participants in all threads
- Profile/Block/Delete: Available for all other participants

FIREBASE SECURITY RULES LOGIC:
- Users can only read/write conversations they participate in
- Messages inherit parent conversation permissions
- Soft deletes preserve data for the other participant
- Block functionality hides conversations without deleting
- All user actions are logged with timestamps for moderation

INDEXING REQUIREMENTS:
- conversations: participants array, lastActivity desc
- messages: conversationId, timestamp desc
- users conversations: userId, lastActivity desc
- applications: applicantUid, jobId
- jobs: customerId, createdAt desc

REAL-TIME LISTENERS:
- Conversation list: Listen to user's active conversations
- Message thread: Listen to specific conversation messages
- Notification system: Listen to new messages and conversation updates
- Online status: Track participant availability (future feature)

WORKER PERSPECTIVE EXAMPLES (Threads 4 & 5):
Thread 4 - Peter as Worker receiving Interview Request:
- Janice (customer) contacted Peter's application
- Peter sees "Application Interview with Janice Legaspi"
- "View Application" button removed (applications moved to jobs.html)
- "View Job Post" button available to reference original job
- Critical for Peter to understand what job Janice is hiring for

Thread 5 - Peter as Worker inquiring about Job:
- Peter (worker) contacted Chris's job post
- Peter sees "Direct Message with Chris Vicente"
- No response yet from Chris (realistic scenario)
- "View Job Post" button essential for Peter to reference job details
- Helps Peter follow up appropriately when Chris eventually responds

BACKEND INTEGRATION POINTS:
1. Authentication: getCurrentUserId() → Firebase Auth
2. Real-time: Firestore listeners for live updates
3. Notifications: Cloud Functions for push notifications
4. Moderation: Automated content filtering + manual review
5. Analytics: Conversation success rates, response times
6. Search: Full-text search on conversation content (future)

DETAILED THREAD AVATAR OVERLAY MAPPING:

Thread 1 (Miguel Torres - Plumber):
- threadOrigin: 'job', currentUserRole: 'customer', applicationId: null
- Miguel's Avatar Overlay: View Profile, View Job Post, Block, Delete, Close
- Peter's Avatar: NO overlay (current user)

Thread 2 (Ana Rodriguez - Cleaner):
- threadOrigin: 'application', currentUserRole: 'customer', applicationId: 'app_kT3nH7mR8qX2bS9jL6'
- Ana's Avatar Overlay: View Profile, View Job Post, VIEW APPLICATION, Block, Delete, Close
- Peter's Avatar: NO overlay (current user)

Thread 3 (Carlos Mendoza - Gardener):
- threadOrigin: 'job', currentUserRole: 'customer', applicationId: null
- Carlos's Avatar Overlay: View Profile, View Job Post, Block, Delete, Close
- Peter's Avatar: NO overlay (current user)

Thread 4 (Janice Legaspi - Customer seeking Programmer):
- threadOrigin: 'application', currentUserRole: 'worker', applicationId: 'app_nK5jT7mR8pL3wQ2xF6'
- Janice's Avatar Overlay: View Profile, View Job Post, Block, Delete, Close
- NO "View Application" (worker perspective - can't view own application)
- Peter's Avatar: NO overlay (current user)

Thread 5 (Chris Vicente - Customer needing App Development):
- threadOrigin: 'job', currentUserRole: 'worker', applicationId: null
- Chris's Avatar Overlay: View Profile, View Job Post, Block, Delete, Close
- CRITICAL: View Job Post essential for Peter to reference original requirements
- Peter's Avatar: NO overlay (current user)

NAVIGATION IMPORTANCE:
- Thread 4: Peter needs "View Job Post" to understand what position Janice is hiring for
- Thread 5: Peter needs "View Job Post" to reference his inquiry and follow up appropriately
- All worker perspective threads benefit from easy job post access for context
*/

// Mock Messages Data (Firebase-ready structure)
const MOCK_MESSAGES = [
    {
        threadId: 1,
        jobId: 1,
        jobTitle: 'Plumbing repair - kitchen sink leak',
        participantId: 6,
        participantName: 'Miguel Torres',
        threadOrigin: 'job', // NEW: Tracks thread origin ('job' or 'application')
        applicationId: null, // NEW: null for job-based threads
        currentUserRole: 'customer', // NEW: Current user (Peter) is the customer who posted the job
        isNew: true,
        lastMessageTime: '2025-12-22T15:30:00Z',
        messages: [
            {
                id: 1,
                threadId: 1,
                senderId: 6,
                senderName: 'Miguel Torres',
                senderType: 'worker',
                timestamp: '2025-12-22T09:15:00Z',
                timeDisplay: 'Dec. 22, 2025 - 9:15 AM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-06.jpg',
                content: 'Good morning po! I saw your plumbing job posting. I have 8 years experience with kitchen sink repairs. When would be a good time to check your sink?'
            },
            {
                id: 2,
                threadId: 1,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-22T10:30:00Z',
                timeDisplay: 'Dec. 22, 2025 - 10:30 AM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Hi Miguel! Thanks for reaching out. I\'m available this afternoon after 2 PM or tomorrow morning. What\'s your rate for sink repair?'
            },
            {
                id: 3,
                threadId: 1,
                senderId: 6,
                senderName: 'Miguel Torres',
                senderType: 'worker',
                timestamp: '2025-12-22T11:45:00Z',
                timeDisplay: 'Dec. 22, 2025 - 11:45 AM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-06.jpg',
                content: 'Perfect! I can come this afternoon at 3 PM. My rate is ₱800 for standard sink leak repair, including parts. Is that okay with you?'
            },
            {
                id: 4,
                threadId: 1,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-22T12:15:00Z',
                timeDisplay: 'Dec. 22, 2025 - 12:15 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'That sounds reasonable! 3 PM works perfectly. Do you need me to prepare anything beforehand? Also, what\'s your estimated time to complete the repair?'
            },
            {
                id: 5,
                threadId: 1,
                senderId: 6,
                senderName: 'Miguel Torres',
                senderType: 'worker',
                timestamp: '2025-12-22T12:45:00Z',
                timeDisplay: 'Dec. 22, 2025 - 12:45 PM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-06.jpg',
                content: 'Just clear the area under the sink so I can access the pipes easily. The repair should take 1-2 hours depending on the issue. I\'ll bring all my tools and replacement parts.'
            },
            {
                id: 6,
                threadId: 1,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-22T13:10:00Z',
                timeDisplay: 'Dec. 22, 2025 - 1:10 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Great! I\'ll clear everything out now. Should I turn off the main water valve before you arrive, or will you handle that?'
            },
            {
                id: 7,
                threadId: 1,
                senderId: 6,
                senderName: 'Miguel Torres',
                senderType: 'worker',
                timestamp: '2025-12-22T13:25:00Z',
                timeDisplay: 'Dec. 22, 2025 - 1:25 PM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-06.jpg',
                content: 'No need to turn off the main valve yet. I\'ll assess the situation first and turn off only what\'s necessary. See you at 3 PM! I\'ll text when I\'m on my way.'
            },
            {
                id: 8,
                threadId: 1,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-22T14:50:00Z',
                timeDisplay: 'Dec. 22, 2025 - 2:50 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Perfect! Everything is cleared out and ready. Looking forward to getting this fixed. Thank you Miguel!'
            }
        ]
    },
    {
        threadId: 2,
        jobId: 'job_gT5nM8xK2jS6wF3eA9', // Updated to match the application's jobId
        jobTitle: 'Home cleaning service - 3 bedroom house deep clean',
        participantId: 'user_qX5nK8mT3jR7wS2nC9', // Updated to match Ana's applicantUid
        participantName: 'Ana Rodriguez',
        threadOrigin: 'application', // NEW: This thread originated from contacting from an application card
        applicationId: 'app_kT3nH7mR8qX2bS9jL6', // NEW: Reference to Ana Rodriguez's specific application
        currentUserRole: 'customer', // NEW: Current user (Peter) is the customer who contacted Ana's application
        isNew: false,
        lastMessageTime: '2025-12-21T11:30:00Z',
        messages: [
            {
                id: 9,
                threadId: 2,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-20T14:15:00Z',
                timeDisplay: 'Dec. 20, 2025 - 2:15 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Hi Ana! I reviewed your application for the house cleaning job. Your profile looks great! I wanted to ask about your availability this weekend.'
            },
            {
                id: 10,
                threadId: 2,
                senderId: 'user_qX5nK8mT3jR7wS2nC9',
                senderName: 'Ana Rodriguez',
                senderType: 'worker',
                timestamp: '2025-12-20T15:45:00Z',
                timeDisplay: 'Dec. 20, 2025 - 3:45 PM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-03.jpg',
                content: 'Hello po! Thank you for considering my application. I\'m available both Saturday and Sunday. What time would work best for you?'
            },
            {
                id: 11,
                threadId: 2,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-20T16:20:00Z',
                timeDisplay: 'Dec. 20, 2025 - 4:20 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Saturday morning around 9 AM would be perfect. How long do you think it will take for a deep clean of a 3-bedroom house?'
            },
            {
                id: 12,
                threadId: 2,
                senderId: 'user_qX5nK8mT3jR7wS2nC9',
                senderName: 'Ana Rodriguez',
                senderType: 'worker',
                timestamp: '2025-12-20T17:15:00Z',
                timeDisplay: 'Dec. 20, 2025 - 5:15 PM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-03.jpg',
                content: 'For a 3-bedroom deep clean, it usually takes 4-5 hours. I\'ll bring all cleaning supplies and equipment. Do you have any specific areas that need extra attention?'
            },
            {
                id: 13,
                threadId: 2,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-20T18:30:00Z',
                timeDisplay: 'Dec. 20, 2025 - 6:30 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'The master bathroom needs extra attention, and the kitchen hasn\'t been deep cleaned in months. Also, we have two cats so there might be some pet hair around.'
            },
            {
                id: 14,
                threadId: 2,
                senderId: 'user_qX5nK8mT3jR7wS2nC9',
                senderName: 'Ana Rodriguez',
                senderType: 'worker',
                timestamp: '2025-12-20T19:45:00Z',
                timeDisplay: 'Dec. 20, 2025 - 7:45 PM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-03.jpg',
                content: 'No problem! I have experience with pet hair removal and I\'ll bring special tools for that. I\'ll focus extra time on the bathroom and kitchen. Should I bring my own vacuum or do you prefer I use yours?'
            },
            {
                id: 15,
                threadId: 2,
                senderId: 1,
                senderName: 'You',
                senderType: 'customer',
                timestamp: '2025-12-21T08:20:00Z',
                timeDisplay: 'Dec. 21, 2025 - 8:20 AM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Please bring your own vacuum if possible - ours is quite old. What time should I expect you on Saturday? And is ₱500 still your final rate?'
            },
            {
                id: 16,
                threadId: 2,
                senderId: 'user_qX5nK8mT3jR7wS2nC9',
                senderName: 'Ana Rodriguez',
                senderType: 'worker',
                timestamp: '2025-12-21T09:10:00Z',
                timeDisplay: 'Dec. 21, 2025 - 9:10 AM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-03.jpg',
                content: 'I\'ll arrive at exactly 9 AM on Saturday with all my equipment. Yes, ₱500 is my final rate for the deep clean. I\'ll make sure your house sparkles! 😊'
            }
        ]
    },
    {
        threadId: 3,
        jobId: 3,
        jobTitle: 'Garden maintenance and lawn mowing service',
        participantId: 8,
        participantName: 'Carlos Mendoza',
        threadOrigin: 'job', // NEW: This thread originated from worker contacting job post
        applicationId: null, // NEW: null for job-based threads
        currentUserRole: 'customer', // NEW: Current user (Peter) is the customer who posted the job
        isNew: true,
        lastMessageTime: '2025-12-23T07:30:00Z',
        messages: [
            {
                id: 17,
                threadId: 3,
                senderId: 8,
                senderName: 'Carlos Mendoza',
                senderType: 'worker',
                timestamp: '2025-12-23T07:30:00Z',
                timeDisplay: 'Dec. 23, 2025 - 7:30 AM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-08.jpg',
                content: 'Good morning! I saw your garden maintenance job posting. I have 12 years experience in landscaping and lawn care. I can start this week if you\'re interested. My rate is ₱1,200 for full garden maintenance including mowing, trimming, and weeding.'
            }
        ]
    },
    {
        threadId: 4,
        jobId: 'job_mR8pL3nK5jT7wQ2xF6', // Programmer job that Peter applied to
        jobTitle: 'Mobile App Development - iOS and Android',
        participantId: 'user_sL9nR4mK6jV8wT3yG7', // Janice Legaspi's user ID
        participantName: 'Janice Legaspi',
        threadOrigin: 'application', // NEW: This thread originated from customer contacting Peter's application
        applicationId: 'app_nK5jT7mR8pL3wQ2xF6', // NEW: Reference to Peter's application
        currentUserRole: 'worker', // NEW: Current user (Peter) is the worker whose application was contacted
        isNew: true,
        lastMessageTime: '2025-12-23T10:15:00Z',
        messages: [
            {
                id: 18,
                threadId: 4,
                senderId: 'user_sL9nR4mK6jV8wT3yG7',
                senderName: 'Janice Legaspi',
                senderType: 'customer',
                timestamp: '2025-12-23T10:15:00Z',
                timeDisplay: 'Dec. 23, 2025 - 10:15 AM',
                read: true,
                direction: 'incoming',
                avatar: 'public/users/User-11.jpg',
                content: 'Hi Peter! I reviewed your application for the mobile app development project. Your portfolio is impressive! I\'d like to discuss the project details with you. Are you available for a call this week?'
            }
        ]
    },
    {
        threadId: 5,
        jobId: 'job_vW9nM4kL7jS8wR5xB3', // App building project job
        jobTitle: 'Custom Business App Development',
        participantId: 'user_tX2nP5mK8jU9wS6yC4', // Chris Vicente's user ID
        participantName: 'Chris Vicente',
        threadOrigin: 'job', // NEW: This thread originated from Peter contacting job post
        applicationId: null, // NEW: null for job-based threads
        currentUserRole: 'worker', // NEW: Current user (Peter) is the worker who contacted the job
        isNew: false,
        lastMessageTime: '2025-12-22T16:30:00Z',
        messages: [
            {
                id: 20,
                threadId: 5,
                senderId: 1,
                senderName: 'You',
                senderType: 'worker',
                timestamp: '2025-12-22T16:30:00Z',
                timeDisplay: 'Dec. 22, 2025 - 4:30 PM',
                read: true,
                direction: 'outgoing',
                avatar: 'public/users/Peter-J-Ang-User-01.jpg',
                content: 'Good afternoon! I saw your custom business app development project and I\'m very interested. I have 5+ years experience in mobile app development with expertise in both iOS and Android. I\'d love to learn more about your specific requirements and discuss how I can help bring your vision to life. What\'s the best time to discuss the project details?'
            }
        ]
    }
];

// Generate Message Card HTML
function generateMessageHTML(message) {
    const messageDataAttrs = [
        `data-message-id="${message.id}"`,
        `data-thread-id="${message.threadId}"`,
        `data-sender-id="${message.senderId}"`,
        `data-sender-name="${message.senderName}"`,
        `data-sender-type="${message.senderType}"`,
        `data-timestamp="${message.timestamp}"`,
        `data-read="${message.read}"`
    ].join(' ');

    return `
        <div class="message-card ${message.direction}" ${messageDataAttrs}>
            <div class="message-header">
                ${message.direction === 'outgoing' ? `
                    <div class="message-avatar">
                        <img src="${message.avatar}" alt="${message.senderName}">
                    </div>
                    <div class="message-info">
                        <div class="message-sender">${message.senderName}</div>
                        <div class="message-timestamp">${message.timeDisplay}</div>
                    </div>
                ` : `
                    <div class="message-info">
                        <div class="message-sender">${message.senderName}</div>
                        <div class="message-timestamp">${message.timeDisplay}</div>
                    </div>
                    <div class="message-avatar">
                        <img src="${message.avatar}" alt="${message.senderName}">
                    </div>
                `}
            </div>
            <div class="message-bubble ${message.direction}">
                ${message.content}
            </div>
        </div>
    `;
}

// Helper function to generate participant text based on user perspective
function generateParticipantText(thread) {
    const participantName = thread.participantName;
    
    if (thread.threadOrigin === 'application') {
        // Application Interview - always shows "Application Interview with [name]"
        return `Application Interview with ${participantName}`;
    } else {
        // Direct Message - depends on current user role
        if (thread.currentUserRole === 'worker') {
            // Worker perspective: "You contacted [customer name]"
            return `You contacted ${participantName}`;
        } else {
            // Customer perspective: "[worker name] contacted you"
            return `${participantName} contacted you`;
        }
    }
}

// Generate Message Thread HTML
function generateMessageThreadHTML(thread) {
    const threadDataAttrs = [
        `data-thread-id="${thread.threadId}"`,
        `data-job-id="${thread.jobId}"`,
        `data-job-title="${thread.jobTitle}"`,
        `data-participant-id="${thread.participantId}"`,
        `data-participant-name="${thread.participantName}"`,
        `data-thread-origin="${thread.threadOrigin}"`, // NEW: Track thread origin
        `data-application-id="${thread.applicationId || ''}"`, // NEW: Application ID for application-based threads
        `data-is-new="${thread.isNew}"`,
        `data-last-message-time="${thread.lastMessageTime}"`,
        `data-current-user-role="${thread.currentUserRole || 'customer'}"` // NEW: Track current user's role in this thread
    ].join(' ');

    // CHRONOLOGICAL MESSAGE ORDER: Oldest messages at top, newest at bottom
    const messagesHTML = thread.messages
        .slice()  // Create copy to avoid mutating original
        .map(message => generateMessageHTML(message))
        .join('');

    return `
        <div class="message-thread" ${threadDataAttrs}>
            <div class="message-thread-header" data-thread-id="${thread.threadId}">
                <div class="thread-info">
                    <div class="thread-job-title">${thread.jobTitle}</div>
                    <div class="thread-participant">${generateParticipantText(thread)}</div>
                </div>
                <div class="thread-status">
                    ${thread.isNew ? '<span class="thread-new-tag">new</span>' : ''}
                    <div class="expand-icon">▼</div>
                </div>
            </div>
            <div class="message-thread-content" id="thread-${thread.threadId}" style="display: none;">
                <!-- MODAL CONTAINER - Wraps the entire chat window -->
                <div class="message-thread-modal">
                    <!-- Modal Header -->
                    <div class="modal-header">
                        <div class="modal-thread-info">
                            <div class="modal-job-title">${thread.jobTitle}</div>
                            <div class="modal-participant">${generateParticipantText(thread)}</div>
                        </div>
                        <button class="modal-close-btn">×</button>
                    </div>
                    
                    <!-- Modal Body -->
                    <div class="modal-body">
                        <!-- Messages area - scrollable -->
                        <div class="message-scroll-container">
                            ${messagesHTML}
                        </div>
                        
                        <!-- Message input at bottom -->
                        <div class="message-input-container">
                            <textarea class="message-input" placeholder="Type a message..." maxlength="200"></textarea>
                            <button class="message-send-btn">Send</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate All Messages Content
function generateMessagesContent() {
    return MOCK_MESSAGES.map(thread => generateMessageThreadHTML(thread)).join('');
}

// Load Messages Tab
function loadMessagesTab() {
    const container = document.querySelector('#messages-content .messages-container');
    if (container) {
        // SAFETY CLEANUP: Ensure we start with a clean state
        // This prevents the bug where expanded threads cause empty content
        closeAllMessageThreads();
        
        container.innerHTML = generateMessagesContent();
        
        // Initialize event handlers for the dynamically loaded content
        initializeMessages(container);
        
        // Update message count badge
        updateMessageCount();
        
        console.log('Messages tab content loaded independently');
    } else {
        console.error('Messages container not found');
    }
}

// ===== END PHASE 1 TEMPLATES =====

// Messages Management
function initializeMessages(container = document) {
    const messageThreadHeaders = container.querySelectorAll('.message-thread-header');
    
    messageThreadHeaders.forEach(header => {
        header.addEventListener('click', function(e) {
            const threadId = this.getAttribute('data-thread-id');
            const messageThread = this.closest('.message-thread');
            const threadContent = document.getElementById('thread-' + threadId);
            const expandIcon = this.querySelector('.expand-icon');
            
            if (threadContent && expandIcon) {
                const isExpanded = messageThread.classList.contains('expanded');
                // Find the correct messages container based on active role and tab
                const messagesContainer = document.querySelector('.tab-content-wrapper.active .messages-container') || 
                                         document.querySelector('.messages-container');
                
                // IMPROVED UX: Different behavior for expanded threads
                if (isExpanded) {
                    // Check if the click was on the expand icon (X button)
                    const clickedOnExpandIcon = e.target.closest('.expand-icon');
                    
                    if (clickedOnExpandIcon) {
                        // Collapse current thread
                        messageThread.classList.remove('expanded', 'show');
                        threadContent.style.display = 'none';
                        expandIcon.textContent = '▼';
                        
                        // Remove thread-active class and overlay from container
                        messagesContainer.classList.remove('thread-active', 'show-overlay');
                        
                        // Clean up mobile input visibility handlers
                        cleanupMobileInputVisibility();
                    } else {
                        // If clicked elsewhere on header when expanded, open overlay
                        const userData = {
                            threadId: messageThread.getAttribute('data-thread-id'),
                            senderId: messageThread.getAttribute('data-participant-id'),
                            senderName: messageThread.getAttribute('data-participant-name'),
                            threadOrigin: messageThread.getAttribute('data-thread-origin'),
                            applicationId: messageThread.getAttribute('data-application-id'),
                            jobId: messageThread.getAttribute('data-job-id'),
                            jobTitle: messageThread.getAttribute('data-job-title'),
                            currentUserRole: messageThread.getAttribute('data-current-user-role'),
                            // Firebase integration fields
                            currentUserId: getCurrentUserId(),
                            conversationRef: `conversations/${messageThread.getAttribute('data-thread-id')}`,
                            participantIds: [getCurrentUserId(), messageThread.getAttribute('data-participant-id')],
                            lastActivity: new Date().toISOString()
                        };
                        
                        console.log('🔍 Thread header clicked (expanded), opening overlay:', userData);
                        showAvatarOverlay(e, userData);
                    }
                    return;
                } else {
                    // First, close all other expanded threads
                    closeAllMessageThreads();
                    
                    // Create and show the chat modal overlay
                    showChatModal(messageThread, threadContent);
                    expandIcon.textContent = '✕';
                    
                    // Mark thread as active (for styling purposes)
                    messagesContainer.classList.add('thread-active');
                    
                    // Remove "new" tag when opening thread
                    const newTag = this.querySelector('.thread-new-tag');
                    if (newTag) {
                        newTag.remove();
                        
                        // Update count based on which container this thread is in
                        const isWorkerChats = this.closest('#worker-chats-content');
                        const isCustomerInterviews = this.closest('#customer-interviews-content');
                        const isMainMessages = this.closest('#messages-content');
                        
                        if (isWorkerChats) {
                            updateWorkerChatsCount();
                        } else if (isCustomerInterviews) {
                            updateCustomerInterviewsCount();
                        } else if (isMainMessages) {
                            updateMessageCount();
                        }
                    }
                    
                    // Modal initialization is handled in showChatModal function
                }
            }
        });
    });
}



function closeAllMessageThreads() {
    // Close any open chat modals
    const openModals = document.querySelectorAll('.chat-modal-overlay');
    openModals.forEach(modal => {
        closeChatModal(modal);
    });
    
    // Reset all thread states and remove greyed out appearance
    const allMessageThreads = document.querySelectorAll('.message-thread');
    allMessageThreads.forEach(thread => {
        const header = thread.querySelector('.message-thread-header');
        const threadId = header?.getAttribute('data-thread-id');
        const threadContent = document.getElementById('thread-' + threadId);
        const expandIcon = header?.querySelector('.expand-icon');
        
        // Reset thread state
        thread.classList.remove('expanded', 'show');
        if (threadContent) {
            threadContent.style.display = 'none';
        }
        if (expandIcon) {
            expandIcon.textContent = '▼';
        }
        
        // CRITICAL: Reset thread appearance - remove greyed out state
        thread.style.opacity = '';
        thread.style.transform = '';
        thread.style.pointerEvents = '';
        
        // Clean up avatar overlays
        cleanupAvatarOverlays(thread);
    });
    
    // Find all messages containers and remove active state
    const messagesContainers = document.querySelectorAll('.messages-container');
    messagesContainers.forEach(container => {
        container.classList.remove('thread-active', 'show-overlay');
    });
    
    // Clean up avatar overlay and mobile handlers
    hideAvatarOverlay();
    cleanupMobileInputVisibility();
    
    console.log('✅ All message threads closed and cleaned up');
}

function scrollToThreadTop() {
    // Scroll page to top under tabs to give room for message scroll container
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function updateMessageCount() {
    // Count remaining "new" tags only within the messages container to avoid counting orphaned elements
    const messagesContainer = document.querySelector('#messages-content .messages-container');
    const newTags = messagesContainer ? messagesContainer.querySelectorAll('.thread-new-tag') : [];
    const messageCountElement = document.querySelector('#messagesTab .notification-count');
    
    console.log('Updating message count:', {
        newTagsFound: newTags.length,
        newTagElements: Array.from(newTags).map(tag => tag.closest('.message-thread')?.querySelector('.thread-job-title')?.textContent)
    });
    
    if (messageCountElement) {
        const remainingCount = newTags.length;
        messageCountElement.textContent = remainingCount;
        
        // Hide badge if count is 0
        if (remainingCount === 0) {
            messageCountElement.style.display = 'none';
        } else {
            messageCountElement.style.display = 'inline-block';
        }
        
        console.log('Message count updated to:', remainingCount);
    }
}

function updateWorkerChatsCount() {
    const workerContainer = document.querySelector('#worker-chats-content .messages-container');
    const newTags = workerContainer ? workerContainer.querySelectorAll('.thread-new-tag') : [];
    const countElement = document.querySelector('#workerChatsTab .notification-count');
    
    if (countElement) {
        const remainingCount = newTags.length;
        countElement.textContent = remainingCount;
        
        if (remainingCount === 0) {
            countElement.style.display = 'none';
        } else {
            countElement.style.display = 'inline-block';
        }
        
        console.log(`Updated worker chats count to: ${remainingCount}`);
    }
}

function updateCustomerInterviewsCount() {
    const customerContainer = document.querySelector('#customer-interviews-content .messages-container');
    const newTags = customerContainer ? customerContainer.querySelectorAll('.thread-new-tag') : [];
    const countElement = document.querySelector('#customerInterviewsTab .notification-count');
    
    if (countElement) {
        const remainingCount = newTags.length;
        countElement.textContent = remainingCount;
        
        if (remainingCount === 0) {
            countElement.style.display = 'none';
        } else {
            countElement.style.display = 'inline-block';
        }
        
        console.log(`Updated customer interviews count to: ${remainingCount}`);
    }
}

function updateApplicationsCount() {
    // UPDATED: 3rd tab is now Messages (admin communications), not applications
    // Set static count for Messages tab
    const applicationsCountElement = document.querySelector('#applicationsTab .notification-count');
    
    if (applicationsCountElement) {
        const remainingCount = 6; // Static count for Messages tab
        applicationsCountElement.textContent = remainingCount;
        
        // Hide badge if count is 0
        if (remainingCount === 0) {
            applicationsCountElement.style.display = 'none';
            // Show placeholder when no applications remain
            if (applicationsPlaceholder) {
                applicationsPlaceholder.style.display = 'block';
                console.log('✅ Applications placeholder now visible - no applications remaining');
            }
        } else {
            applicationsCountElement.style.display = 'inline-block';
            // Hide placeholder when applications are present
            if (applicationsPlaceholder) {
                applicationsPlaceholder.style.display = 'none';
            }
        }
    }
}

function updateJobHeaderCounts() {
    // Update each individual job header count based on remaining application cards
    const jobListings = document.querySelectorAll('.job-listing');
    
    jobListings.forEach(jobListing => {
        const applicationCards = jobListing.querySelectorAll('.application-card');
        const countElement = jobListing.querySelector('.application-count');
        
        if (countElement) {
            const currentCount = applicationCards.length;
            countElement.textContent = currentCount;
            
            // If no applications left, the job listing will be removed elsewhere
            // This just ensures the count is accurate while visible
        }
    });
}

function updateAllTabCounts() {
    // Calculate and update all tab counts on page load based on mock data
    // This ensures counts are accurate before tabs are clicked
    
    // Applications count - total application cards from mock data
    const applicationsCountElement = document.querySelector('#applicationsTab .notification-count');
    const applicationsPlaceholder = document.getElementById('applications-placeholder');
    
    if (applicationsCountElement) {
        let totalApplications = 0;
        MOCK_APPLICATIONS.forEach(jobData => {
            totalApplications += jobData.applications.length;
        });
        applicationsCountElement.textContent = totalApplications;
        
        if (totalApplications === 0) {
            applicationsCountElement.style.display = 'none';
            // Show placeholder when no applications exist
            if (applicationsPlaceholder) {
                applicationsPlaceholder.style.display = 'block';
            }
        } else {
            applicationsCountElement.style.display = 'inline-block';
            // Hide placeholder when applications exist
            if (applicationsPlaceholder) {
                applicationsPlaceholder.style.display = 'none';
            }
        }
    }
    
    // Notifications count - keep existing count logic
    updateNotificationsCount();
    
    // Messages count - calculate from mock data
    const messagesCountElement = document.querySelector('#messagesTab .notification-count');
    if (messagesCountElement) {
        // Count "new" threads from MOCK_MESSAGES data
        const newThreadsCount = MOCK_MESSAGES.filter(thread => thread.isNew === true).length;
        messagesCountElement.textContent = newThreadsCount;
        
        if (newThreadsCount === 0) {
            messagesCountElement.style.display = 'none';
        } else {
            messagesCountElement.style.display = 'inline-block';
        }
        
        console.log('Messages count updated from mock data:', newThreadsCount);
    }
    
    console.log('All tab counts updated on page load');
}

function updateNotificationsCount() {
    // Count unread notifications (those without the 'read' class)
    const unreadNotifications = document.querySelectorAll('.notification-item:not(.read)');
    const notificationsCountElement = document.querySelector('#notificationsTab .notification-count');
    
    if (notificationsCountElement) {
        const unreadCount = unreadNotifications.length;
        notificationsCountElement.textContent = unreadCount;
        
        // Hide badge if count is 0
        if (unreadCount === 0) {
            notificationsCountElement.style.display = 'none';
        } else {
            notificationsCountElement.style.display = 'inline-block';
        }
    }
}

// Contact Message Overlay Functions
function showContactMessageOverlay(userId, userName, applicationId = null) {
    const overlay = document.getElementById('contactMessageOverlay');
    const userNameElement = document.getElementById('contactUserName');
    const messageInput = document.getElementById('contactMessageInput');
    
    if (overlay && userNameElement && messageInput) {
        // Set user information
        userNameElement.textContent = userName;
        
        // Set data attributes
        overlay.setAttribute('data-user-id', userId);
        overlay.setAttribute('data-user-name', userName);
        if (applicationId) {
            overlay.setAttribute('data-application-id', applicationId);
        }
        
        messageInput.setAttribute('data-user-id', userId);
        messageInput.setAttribute('data-user-name', userName);
        if (applicationId) {
            messageInput.setAttribute('data-application-id', applicationId);
        }
        
        // Clear previous message
        messageInput.value = '';
        
        // Show overlay
        overlay.classList.add('show');
        
        // Initialize keyboard detection for mobile
        initializeKeyboardDetection(overlay);
        
        // Focus on input
        setTimeout(() => {
            messageInput.focus();
        }, 300);
    }
}

function closeContactMessageOverlay() {
    const overlay = document.getElementById('contactMessageOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        // Clean up keyboard detection
        cleanupKeyboardDetection();
    }
}

// Keyboard detection for mobile devices
function initializeKeyboardDetection(overlay) {
    // Only run on mobile devices
    if (window.innerWidth > 600) return;
    
    const modal = overlay.querySelector('.contact-message-modal');
    const messageInput = overlay.querySelector('#contactMessageInput');
    let initialViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    function handleKeyboardShow() {
        const currentViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const keyboardHeight = initialViewportHeight - currentViewportHeight;
        
        if (keyboardHeight > 150) { // Keyboard is likely open
            // Position modal above keyboard with some padding
            const translateY = -(keyboardHeight / 2 + 20);
            modal.style.transform = `translateY(${translateY}px)`;
            console.log('Keyboard detected, adjusting modal position:', translateY);
        }
    }
    
    function handleKeyboardHide() {
        // Reset position when keyboard is hidden
        modal.style.transform = 'translateY(0)';
        console.log('Keyboard hidden, resetting modal position');
    }
    
    // MEMORY LEAK FIX: Listen for viewport changes with AbortController
    const controller = new AbortController();
    const signal = controller.signal;
    
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const currentHeight = window.visualViewport.height;
            if (currentHeight < initialViewportHeight - 150) {
                handleKeyboardShow();
            } else {
                handleKeyboardHide();
            }
        }, { signal });
    } else {
        // Fallback for older browsers
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            if (currentHeight < initialViewportHeight - 150) {
                handleKeyboardShow();
            } else {
                handleKeyboardHide();
            }
        }, { signal });
    }
    
    // Register controller for cleanup
    registerCleanup('controller', `keyboardDetection_${Date.now()}`, controller);
    
    // Also listen for input focus/blur as additional detection
    messageInput.addEventListener('focus', () => {
        setTimeout(handleKeyboardShow, 300); // Delay to allow keyboard to appear
    });
    
    messageInput.addEventListener('blur', () => {
        setTimeout(handleKeyboardHide, 300); // Delay to allow keyboard to disappear
    });
}

function cleanupKeyboardDetection() {
    // Reset any transforms when overlay is closed
    const modal = document.querySelector('.contact-message-modal');
    if (modal) {
        modal.style.transform = '';
    }
}

// ===== CLEAN MOBILE INPUT VISIBILITY SOLUTION =====
// Targeted fix for problematic browsers where keyboard hides input field

let mobileInputListeners = [];
let scrollTimeouts = [];

function initializeMobileInputVisibility(messageThread) {
    // DISABLED: Reverting to simpler UI restructure approach
    // Input will be moved to top of thread to avoid keyboard entirely
    console.log('✓ Mobile input visibility - using top-input layout approach');
    return;
}

function cleanupMobileInputVisibility() {
    // Clear any pending scroll operations
    scrollTimeouts.forEach(id => clearTimeout(id));
    scrollTimeouts = [];
    
    // Remove all event listeners
    mobileInputListeners.forEach(({ target, event, listener }) => {
        if (target && typeof target.removeEventListener === 'function') {
            target.removeEventListener(event, listener);
        }
    });
    mobileInputListeners = [];
    
    console.log('🧹 Mobile input visibility cleanup completed');
}

function initializeContactMessageOverlay() {
    const overlay = document.getElementById('contactMessageOverlay');
    const closeBtn = document.getElementById('contactCloseBtn');
    const cancelBtn = document.getElementById('contactCancelBtn');
    const sendBtn = document.getElementById('contactSendBtn');
    const messageInput = document.getElementById('contactMessageInput');
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeContactMessageOverlay);
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeContactMessageOverlay);
    }
    
    // Send button
    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', function() {
            const message = messageInput.value.trim();
            const userId = messageInput.getAttribute('data-user-id');
            const userName = messageInput.getAttribute('data-user-name');
            const applicationId = messageInput.getAttribute('data-application-id');
            
            if (message && userId && userName) {
                // Here you would send the message to backend
                console.log('Backend data to send:', {
                    action: 'send_contact_message',
                    senderId: 'current_user_id', // In real app, get from authentication
                    senderName: 'Current User', // In real app, get from authentication
                    recipientId: userId,
                    recipientName: userName,
                    applicationId: applicationId,
                    message: message,
                    timestamp: new Date().toISOString(),
                    messageType: 'contact_inquiry',
                    messageLength: message.length,
                    channelType: 'application_inquiry'
                });
                
                // Close contact overlay
                closeContactMessageOverlay();
                
                // Show confirmation
                showConfirmationOverlay(
                    'success',
                    'Message Sent!',
                    `Your message has been sent to ${userName}. They will be notified and can respond through the messages tab.`
                );
                
                // Clear the input
                messageInput.value = '';
            } else {
                // Show error if message is empty
                messageInput.style.borderColor = '#e53e3e';
                setTimeout(() => {
                    messageInput.style.borderColor = '#4a5568';
                }, 2000);
            }
        });
    }
    
    // Click outside to close
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeContactMessageOverlay();
            }
        });
    }
    
    // Enable/disable send button based on input
    if (messageInput && sendBtn) {
        messageInput.addEventListener('input', function() {
            const message = this.value.trim();
            if (message.length > 0) {
                sendBtn.disabled = false;
            } else {
                sendBtn.disabled = true;
            }
        });
        
        // Initially disable send button
        sendBtn.disabled = true;
    }
}

// Make functions globally accessible for onclick handlers
window.cancelSelection = cancelSelection;
window.deleteSelectedNotifications = deleteSelectedNotifications;

// Removed: MOCK_APPLICATIONS array - Applications data moved to jobs.html overlay system
// The Messages tab (3rd tab) now contains admin communications, not application cards
// const MOCK_APPLICATIONS = [
    /*{
        jobId: 'job_gT5nM8xK2jS6wF3eA9', // Firebase document ID format
        jobTitle: 'Home cleaning service - 3 bedroom house deep clean',
        employerUid: 'user_currentUserUid', // Job owner
        applicationCount: 2,
        jobStatus: 'active',
        createdAt: new Date('2025-12-18T10:00:00Z'),
        updatedAt: new Date('2025-12-22T14:45:00Z'),
        
        // Denormalized for better Firestore performance
        applications: [
            {
                applicationId: 'app_dH9kL3mN7pR2vX8qY4t',
                applicantUid: 'user_mR8nT4kX2qJ5wP9sC7',
                jobId: 'job_gT5nM8xK2jS6wF3eA9',
                status: 'pending',
                
                // Firestore timestamp format
                appliedAt: new Date('2025-12-20T14:45:00Z'),
                updatedAt: new Date('2025-12-20T14:45:00Z'),
                
                // Denormalized user data for faster reads
                applicantProfile: {
                    displayName: 'Mario Santos',
                    photoURL: 'public/users/User-02.jpg', // Fixed local path
                    averageRating: 5.0,
                    totalReviews: 50,
                    verified: true,
                    lastActive: new Date('2025-12-22T12:00:00Z')
                },
                
                // Application-specific data
                pricing: {
                    offeredAmount: 550,
                    originalAmount: 600,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hi Sir! Please hire me for this job, I have 10 years experience in professional cleaning of offices and hotels. I won\'t let you down!',
                
                // Worker qualifications (denormalized for quick access)
                qualifications: {
                    experience: '10 years',
                    specializations: ['professional cleaning', 'offices', 'hotels'],
                    availability: 'immediate',
                    equipment: 'own equipment',
                    languages: ['English', 'Filipino']
                },
                
                // For display formatting
                displayData: {
                    appliedDate: '2025-12-20',
                    appliedTime: '2:45 PM',
                    formattedPrice: '₱550 Per Job'
                },
                
                // Firestore metadata
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_kT3nH7mR8qX2bS9jL6',
                applicantUid: 'user_qX5nK8mT3jR7wS2nC9',
                jobId: 'job_gT5nM8xK2jS6wF3eA9',
                status: 'pending',
                
                appliedAt: new Date('2025-12-21T10:15:00Z'),
                updatedAt: new Date('2025-12-21T10:15:00Z'),
                
                applicantProfile: {
                    displayName: 'Ana Rodriguez',
                    photoURL: 'public/users/User-03.jpg', // Fixed local path - matches message thread
                    averageRating: 4.0,
                    totalReviews: 32,
                    verified: true,
                    lastActive: new Date('2025-12-22T09:30:00Z')
                },
                
                pricing: {
                    offeredAmount: 600,
                    originalAmount: 600,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Good day! I\'m available for your cleaning job. I specialize in deep cleaning and have excellent references.',
                
                qualifications: {
                    experience: '5 years',
                    specializations: ['deep cleaning', 'residential'],
                    availability: 'flexible',
                    references: 'available upon request',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-21',
                    appliedTime: '10:15 AM',
                    formattedPrice: '₱600 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_wR4nM7xT9qK2jP5sL8',
        jobTitle: 'Plumbing repair - kitchen sink leak',
        employerUid: 'user_currentUserUid',
        applicationCount: 2, // Reduced for Firebase demo
        jobStatus: 'active',
        createdAt: new Date('2025-12-19T08:00:00Z'),
        updatedAt: new Date('2025-12-22T11:00:00Z'),
        
        applications: [
            {
                applicationId: 'app_nR6mK3qT8jX2wS7nL9',
                applicantUid: 'user_bM9nR4kX8qT2jW5sP3',
                jobId: 'job_wR4nM7xT9qK2jP5sL8',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T08:30:00Z'),
                updatedAt: new Date('2025-12-22T08:30:00Z'),
                
                applicantProfile: {
                    displayName: 'Miguel Torres',
                    photoURL: 'public/users/User-06.jpg', // Fixed local path
                    averageRating: 5.0,
                    totalReviews: 67,
                    verified: true,
                    lastActive: new Date('2025-12-22T08:00:00Z')
                },
                
                pricing: {
                    offeredAmount: 800,
                    originalAmount: 800,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: false
                },
                
                applicationMessage: 'I can fix your sink today! 8 years experience in plumbing repairs. I have all necessary tools and parts.',
                
                qualifications: {
                    experience: '8 years',
                    specializations: ['plumbing repairs', 'sink', 'pipes'],
                    availability: 'today',
                    equipment: 'complete plumbing toolkit',
                    certifications: ['licensed plumber'],
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '8:30 AM',
                    formattedPrice: '₱800 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_lP4nX7mR9qK2jT8sW5',
                applicantUid: 'user_sW6nM3rT8qJ2kX9nL4',
                jobId: 'job_wR4nM7xT9qK2jP5sL8',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T11:00:00Z'),
                updatedAt: new Date('2025-12-22T11:00:00Z'),
                
                applicantProfile: {
                    displayName: 'Carlos Mendoza',
                    photoURL: 'public/users/User-07.jpg', // Fixed local path
                    averageRating: 4.0,
                    totalReviews: 28,
                    verified: true,
                    lastActive: new Date('2025-12-22T10:45:00Z')
                },
                
                pricing: {
                    offeredAmount: 750,
                    originalAmount: 800,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Licensed plumber available today. Quick and reliable service with 1-year warranty on repairs.',
                
                qualifications: {
                    experience: '6 years',
                    specializations: ['licensed plumbing', 'repairs'],
                    availability: 'today',
                    warranty: '1-year warranty',
                    certifications: ['government licensed'],
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '11:00 AM',
                    formattedPrice: '₱750 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_bN6kT9xR3mJ8wQ2sH5',
        jobTitle: 'Grocery shopping and delivery - weekly service',
        employerUid: 'user_currentUserUid',
        applicationCount: 3,
        jobStatus: 'active',
        createdAt: new Date('2025-12-19T08:30:00Z'),
        updatedAt: new Date('2025-12-22T16:20:00Z'),
        
        applications: [
            {
                applicationId: 'app_nK7jM3xQ9rT6wL4sB8',
                applicantUid: 'user_wL9kR5mT8qX3jN6sP2',
                jobId: 'job_bN6kT9xR3mJ8wQ2sH5',
                status: 'pending',
                
                appliedAt: new Date('2025-12-21T09:20:00Z'),
                updatedAt: new Date('2025-12-21T09:20:00Z'),
                
                applicantProfile: {
                    displayName: 'Miguel Cruz',
                    photoURL: 'public/users/User-04.jpg',
                    averageRating: 4.5,
                    totalReviews: 23,
                    verified: true,
                    lastActive: new Date('2025-12-22T15:45:00Z')
                },
                
                pricing: {
                    offeredAmount: 150,
                    originalAmount: 180,
                    currency: 'PHP',
                    paymentType: 'per_trip',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hello! I can do your weekly grocery shopping. I have my own vehicle and know all the best markets for fresh produce.',
                
                qualifications: {
                    experience: '3 years',
                    specializations: ['grocery shopping', 'delivery'],
                    availability: 'weekends',
                    transportation: 'own vehicle',
                    languages: ['English', 'Filipino', 'Cebuano']
                },
                
                displayData: {
                    appliedDate: '2025-12-21',
                    appliedTime: '9:20 AM',
                    formattedPrice: '₱150 Per Trip'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_rT8kN4xM7qW9jL3sC6',
                applicantUid: 'user_jL3kN7mR9qT5wX8sB4',
                jobId: 'job_bN6kT9xR3mJ8wQ2sH5',
                status: 'pending',
                
                appliedAt: new Date('2025-12-21T11:45:00Z'),
                updatedAt: new Date('2025-12-21T11:45:00Z'),
                
                applicantProfile: {
                    displayName: 'Ana Reyes',
                    photoURL: 'public/users/User-05.jpg',
                    averageRating: 5.0,
                    totalReviews: 41,
                    verified: true,
                    lastActive: new Date('2025-12-22T14:30:00Z')
                },
                
                pricing: {
                    offeredAmount: 180,
                    originalAmount: 180,
                    currency: 'PHP',
                    paymentType: 'per_trip',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Good day! I\'m very experienced with grocery shopping and always choose the freshest items. I can start immediately.',
                
                qualifications: {
                    experience: '6 years',
                    specializations: ['grocery shopping', 'fresh produce selection'],
                    availability: 'flexible schedule',
                    references: 'excellent customer feedback',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-21',
                    appliedTime: '11:45 AM',
                    formattedPrice: '₱180 Per Trip'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_xW5kL8mQ2rT7jN9sK3',
                applicantUid: 'user_qT6kW9mL3rX7jN4sC8',
                jobId: 'job_bN6kT9xR3mJ8wQ2sH5',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T07:15:00Z'),
                updatedAt: new Date('2025-12-22T07:15:00Z'),
                
                applicantProfile: {
                    displayName: 'Roberto Silva',
                    photoURL: 'public/users/User-06.jpg',
                    averageRating: 4.0,
                    totalReviews: 18,
                    verified: false,
                    lastActive: new Date('2025-12-22T16:00:00Z')
                },
                
                pricing: {
                    offeredAmount: 120,
                    originalAmount: 180,
                    currency: 'PHP',
                    paymentType: 'per_trip',
                    isCounterOffer: true
                },
                
                applicationMessage: 'I can help with your grocery needs. I\'m new to the platform but very reliable and hardworking.',
                
                qualifications: {
                    experience: '1 year',
                    specializations: ['delivery', 'shopping assistance'],
                    availability: 'morning hours',
                    transportation: 'motorcycle',
                    languages: ['Filipino', 'English']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '7:15 AM',
                    formattedPrice: '₱120 Per Trip'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_sH2kM6xT4qR9wN7jL3',
        jobTitle: 'Garden maintenance - lawn mowing and plant care',
        employerUid: 'user_currentUserUid',
        applicationCount: 3,
        jobStatus: 'active',
        createdAt: new Date('2025-12-20T13:15:00Z'),
        updatedAt: new Date('2025-12-22T17:30:00Z'),
        
        applications: [
            {
                applicationId: 'app_mQ4kT7xN2rW8jL5sH9',
                applicantUid: 'user_rW8kQ4mT7xN2jL5sH9',
                jobId: 'job_sH2kM6xT4qR9wN7jL3',
                status: 'pending',
                
                appliedAt: new Date('2025-12-21T14:30:00Z'),
                updatedAt: new Date('2025-12-21T14:30:00Z'),
                
                applicantProfile: {
                    displayName: 'Juan Flores',
                    photoURL: 'public/users/User-07.jpg',
                    averageRating: 4.5,
                    totalReviews: 37,
                    verified: true,
                    lastActive: new Date('2025-12-22T13:20:00Z')
                },
                
                pricing: {
                    offeredAmount: 400,
                    originalAmount: 450,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'I have 8 years experience in landscaping and garden maintenance. I bring my own tools and equipment.',
                
                qualifications: {
                    experience: '8 years',
                    specializations: ['landscaping', 'lawn care', 'plant maintenance'],
                    availability: 'weekdays',
                    equipment: 'professional tools included',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-21',
                    appliedTime: '2:30 PM',
                    formattedPrice: '₱400 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_tL9kX3mR6qW2jN8sK4',
                applicantUid: 'user_xN8kL9mR6qW2jT3sK4',
                jobId: 'job_sH2kM6xT4qR9wN7jL3',
                status: 'pending',
                
                appliedAt: new Date('2025-12-21T16:10:00Z'),
                updatedAt: new Date('2025-12-21T16:10:00Z'),
                
                applicantProfile: {
                    displayName: 'Elena Morales',
                    photoURL: 'public/users/User-08.jpg',
                    averageRating: 5.0,
                    totalReviews: 29,
                    verified: true,
                    lastActive: new Date('2025-12-22T11:45:00Z')
                },
                
                pricing: {
                    offeredAmount: 450,
                    originalAmount: 450,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: false
                },
                
                applicationMessage: 'I specialize in organic gardening and plant care. Your garden will be in excellent hands with me!',
                
                qualifications: {
                    experience: '5 years',
                    specializations: ['organic gardening', 'plant care', 'lawn maintenance'],
                    availability: 'flexible',
                    certifications: 'organic gardening certified',
                    languages: ['English', 'Filipino', 'Spanish']
                },
                
                displayData: {
                    appliedDate: '2025-12-21',
                    appliedTime: '4:10 PM',
                    formattedPrice: '₱450 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_wK6kR9mT3xQ7jL2sN5',
                applicantUid: 'user_mT3kW6rQ9xL7jN2sK5',
                jobId: 'job_sH2kM6xT4qR9wN7jL3',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T08:45:00Z'),
                updatedAt: new Date('2025-12-22T08:45:00Z'),
                
                applicantProfile: {
                    displayName: 'Carlos Mendoza',
                    photoURL: 'public/users/User-09.jpg',
                    averageRating: 3.5,
                    totalReviews: 14,
                    verified: false,
                    lastActive: new Date('2025-12-22T17:15:00Z')
                },
                
                pricing: {
                    offeredAmount: 350,
                    originalAmount: 450,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'I can take care of your garden at a good price. I\'m starting out but very motivated to do excellent work.',
                
                qualifications: {
                    experience: '2 years',
                    specializations: ['basic lawn care', 'weeding'],
                    availability: 'weekends',
                    transportation: 'bicycle',
                    languages: ['Filipino', 'English']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '8:45 AM',
                    formattedPrice: '₱350 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_xP8kL9mR2qT5wN3jH6',
        jobTitle: 'Babysitting - weekend childcare for 2 kids',
        employerUid: 'user_currentUserUid',
        applicationCount: 3,
        jobStatus: 'active',
        createdAt: new Date('2025-12-21T10:00:00Z'),
        updatedAt: new Date('2025-12-23T09:30:00Z'),
        
        applications: [
            {
                applicationId: 'app_bN7mK4xR8qT2wL9sP5',
                applicantUid: 'user_sP6nK3mR7qX8jL2wT9',
                jobId: 'job_xP8kL9mR2qT5wN3jH6',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T13:20:00Z'),
                updatedAt: new Date('2025-12-22T13:20:00Z'),
                
                applicantProfile: {
                    displayName: 'Maria Santos',
                    photoURL: 'public/users/User-08.jpg',
                    averageRating: 5.0,
                    totalReviews: 89,
                    verified: true,
                    lastActive: new Date('2025-12-23T08:45:00Z')
                },
                
                pricing: {
                    offeredAmount: 200,
                    originalAmount: 250,
                    currency: 'PHP',
                    paymentType: 'per_hour',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hello! I have 12 years experience taking care of children. I am a licensed teacher and first aid certified. Your kids will be safe with me!',
                
                qualifications: {
                    experience: '12 years',
                    specializations: ['childcare', 'education'],
                    availability: 'weekends',
                    certifications: ['licensed teacher', 'first aid'],
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '1:20 PM',
                    formattedPrice: '₱200 Per Hour'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_rT6kN9mX4qL7wS3jP8',
                applicantUid: 'user_jL8kT5mR9qW3nX6sB2',
                jobId: 'job_xP8kL9mR2qT5wN3jH6',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T16:45:00Z'),
                updatedAt: new Date('2025-12-22T16:45:00Z'),
                
                applicantProfile: {
                    displayName: 'Elena Rodriguez',
                    photoURL: 'public/users/User-09.jpg',
                    averageRating: 4.5,
                    totalReviews: 34,
                    verified: true,
                    lastActive: new Date('2025-12-23T07:20:00Z')
                },
                
                pricing: {
                    offeredAmount: 250,
                    originalAmount: 250,
                    currency: 'PHP',
                    paymentType: 'per_hour',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Good afternoon! I love working with children and have experience with ages 3-10. I can help with homework and activities.',
                
                qualifications: {
                    experience: '5 years',
                    specializations: ['homework help', 'activities'],
                    availability: 'flexible weekends',
                    references: 'available',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '4:45 PM',
                    formattedPrice: '₱250 Per Hour'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_wS5kJ7mQ9rT3xN8lP4',
                applicantUid: 'user_nP9kS6mT4qL8wR3jX7',
                jobId: 'job_xP8kL9mR2qT5wN3jH6',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T08:15:00Z'),
                updatedAt: new Date('2025-12-23T08:15:00Z'),
                
                applicantProfile: {
                    displayName: 'Grace Lim',
                    photoURL: 'public/users/User-10.jpg',
                    averageRating: 4.0,
                    totalReviews: 15,
                    verified: false,
                    lastActive: new Date('2025-12-23T09:00:00Z')
                },
                
                pricing: {
                    offeredAmount: 180,
                    originalAmount: 250,
                    currency: 'PHP',
                    paymentType: 'per_hour',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hi! I\'m new to the platform but very responsible. I have younger siblings so I understand children well.',
                
                qualifications: {
                    experience: '2 years',
                    specializations: ['sibling care', 'playtime'],
                    availability: 'Saturday mornings',
                    references: 'family references',
                    languages: ['English', 'Filipino', 'Chinese']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '8:15 AM',
                    formattedPrice: '₱180 Per Hour'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_qH4nL7mX9rK2jT8sW6',
        jobTitle: 'Car washing and detailing - monthly service',
        employerUid: 'user_currentUserUid',
        applicationCount: 2,
        jobStatus: 'active',
        createdAt: new Date('2025-12-20T16:30:00Z'),
        updatedAt: new Date('2025-12-23T11:15:00Z'),
        
        applications: [
            {
                applicationId: 'app_mK8jL4xN9qR5wT2sH7',
                applicantUid: 'user_wT9nK6mL4qR8jX3sP5',
                jobId: 'job_qH4nL7mX9rK2jT8sW6',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T09:30:00Z'),
                updatedAt: new Date('2025-12-22T09:30:00Z'),
                
                applicantProfile: {
                    displayName: 'Rico Fernandez',
                    photoURL: 'public/users/User-11.jpg',
                    averageRating: 5.0,
                    totalReviews: 78,
                    verified: true,
                    lastActive: new Date('2025-12-23T10:30:00Z')
                },
                
                pricing: {
                    offeredAmount: 400,
                    originalAmount: 500,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Professional car detailing service! I have my own equipment and premium cleaning products. Your car will look brand new!',
                
                qualifications: {
                    experience: '8 years',
                    specializations: ['car detailing', 'premium service'],
                    availability: 'flexible schedule',
                    equipment: 'professional grade',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '9:30 AM',
                    formattedPrice: '₱400 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_xL5nK8mR2qT7jW4sP9',
                applicantUid: 'user_sP7kL4mT9qR6wX8nJ3',
                jobId: 'job_qH4nL7mX9rK2jT8sW6',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T07:45:00Z'),
                updatedAt: new Date('2025-12-23T07:45:00Z'),
                
                applicantProfile: {
                    displayName: 'John Martinez',
                    photoURL: 'public/users/User-02.jpg',
                    averageRating: 4.0,
                    totalReviews: 22,
                    verified: true,
                    lastActive: new Date('2025-12-23T11:00:00Z')
                },
                
                pricing: {
                    offeredAmount: 500,
                    originalAmount: 500,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Good morning! I can wash and detail your car monthly. I\'m very thorough and always on time.',
                
                qualifications: {
                    experience: '4 years',
                    specializations: ['car washing', 'interior cleaning'],
                    availability: 'monthly schedule',
                    equipment: 'basic tools',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '7:45 AM',
                    formattedPrice: '₱500 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_tN9kR3mX6qL8wS2jP7',
        jobTitle: 'Tutoring - high school math and science',
        employerUid: 'user_currentUserUid',
        applicationCount: 3,
        jobStatus: 'active',
        createdAt: new Date('2025-12-21T14:20:00Z'),
        updatedAt: new Date('2025-12-23T12:45:00Z'),
        
        applications: [
            {
                applicationId: 'app_bL7nK5mR9qX4wT8sJ2',
                applicantUid: 'user_jT6nL9mK4qR8wX3sP7',
                jobId: 'job_tN9kR3mX6qL8wS2jP7',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T11:30:00Z'),
                updatedAt: new Date('2025-12-22T11:30:00Z'),
                
                applicantProfile: {
                    displayName: 'Prof. Anna Cruz',
                    photoURL: 'public/users/User-03.jpg',
                    averageRating: 5.0,
                    totalReviews: 156,
                    verified: true,
                    lastActive: new Date('2025-12-23T12:20:00Z')
                },
                
                pricing: {
                    offeredAmount: 300,
                    originalAmount: 350,
                    currency: 'PHP',
                    paymentType: 'per_hour',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hello! I\'m a licensed Math teacher with 15 years experience. I specialize in making difficult concepts easy to understand.',
                
                qualifications: {
                    experience: '15 years',
                    specializations: ['mathematics', 'physics', 'chemistry'],
                    availability: 'afternoons and weekends',
                    certifications: ['licensed teacher', 'masters degree'],
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '11:30 AM',
                    formattedPrice: '₱300 Per Hour'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_rW8kN3mL7qT5jX9sK4',
                applicantUid: 'user_kX8nW5mT2qL9jR6sP3',
                jobId: 'job_tN9kR3mX6qL8wS2jP7',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T15:15:00Z'),
                updatedAt: new Date('2025-12-22T15:15:00Z'),
                
                applicantProfile: {
                    displayName: 'Mark Gonzales',
                    photoURL: 'public/users/User-04.jpg',
                    averageRating: 4.5,
                    totalReviews: 67,
                    verified: true,
                    lastActive: new Date('2025-12-23T11:45:00Z')
                },
                
                pricing: {
                    offeredAmount: 350,
                    originalAmount: 350,
                    currency: 'PHP',
                    paymentType: 'per_hour',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Hi! I\'m an engineering student and have been tutoring high school students for 3 years. Great with math and science!',
                
                qualifications: {
                    experience: '3 years',
                    specializations: ['algebra', 'calculus', 'physics'],
                    availability: 'evenings',
                    education: 'engineering student',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '3:15 PM',
                    formattedPrice: '₱350 Per Hour'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_sJ6nM9mK3qR7wL5tX8',
                applicantUid: 'user_wL4nJ8mR6qT9kX2sP5',
                jobId: 'job_tN9kR3mX6qL8wS2jP7',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T09:20:00Z'),
                updatedAt: new Date('2025-12-23T09:20:00Z'),
                
                applicantProfile: {
                    displayName: 'Sarah Valdez',
                    photoURL: 'public/users/User-05.jpg',
                    averageRating: 4.0,
                    totalReviews: 29,
                    verified: false,
                    lastActive: new Date('2025-12-23T12:30:00Z')
                },
                
                pricing: {
                    offeredAmount: 250,
                    originalAmount: 350,
                    currency: 'PHP',
                    paymentType: 'per_hour',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hello! I just graduated with a science degree and love helping students understand math and science concepts.',
                
                qualifications: {
                    experience: '1 year',
                    specializations: ['basic math', 'general science'],
                    availability: 'flexible',
                    education: 'science graduate',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '9:20 AM',
                    formattedPrice: '₱250 Per Hour'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_wK7nL2mX9qR5jT8sP3',
        jobTitle: 'House painting - living room and kitchen',
        employerUid: 'user_currentUserUid',
        applicationCount: 2,
        jobStatus: 'active',
        createdAt: new Date('2025-12-22T08:45:00Z'),
        updatedAt: new Date('2025-12-23T13:30:00Z'),
        
        applications: [
            {
                applicationId: 'app_nT5kW8mL3qR7jX2sK9',
                applicantUid: 'user_jX9nT4mW8qL5kR2sP6',
                jobId: 'job_wK7nL2mX9qR5jT8sP3',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T14:10:00Z'),
                updatedAt: new Date('2025-12-22T14:10:00Z'),
                
                applicantProfile: {
                    displayName: 'Pablo Ramirez',
                    photoURL: 'public/users/User-06.jpg',
                    averageRating: 5.0,
                    totalReviews: 94,
                    verified: true,
                    lastActive: new Date('2025-12-23T13:00:00Z')
                },
                
                pricing: {
                    offeredAmount: 2500,
                    originalAmount: 3000,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Professional painter with 10+ years experience. I use high-quality paints and guarantee perfect finish. Free color consultation!',
                
                qualifications: {
                    experience: '10+ years',
                    specializations: ['interior painting', 'color consultation'],
                    availability: 'this week',
                    equipment: 'professional tools and paints',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '2:10 PM',
                    formattedPrice: '₱2500 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_kR6nS9mL4qT8wX3jP7',
                applicantUid: 'user_sP3nK7mR9qL4wT8jX6',
                jobId: 'job_wK7nL2mX9qR5jT8sP3',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T10:25:00Z'),
                updatedAt: new Date('2025-12-23T10:25:00Z'),
                
                applicantProfile: {
                    displayName: 'Dante Silva',
                    photoURL: 'public/users/User-07.jpg',
                    averageRating: 4.0,
                    totalReviews: 38,
                    verified: true,
                    lastActive: new Date('2025-12-23T13:15:00Z')
                },
                
                pricing: {
                    offeredAmount: 3000,
                    originalAmount: 3000,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Good day! I can paint your living room and kitchen. I\'m very careful with furniture and clean up after work.',
                
                qualifications: {
                    experience: '5 years',
                    specializations: ['residential painting', 'clean work'],
                    availability: 'next week',
                    equipment: 'own brushes and rollers',
                    languages: ['Filipino', 'English']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '10:25 AM',
                    formattedPrice: '₱3000 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_rS8nK5mX2qT9wL6jP4',
        jobTitle: 'Computer repair - laptop not starting up',
        employerUid: 'user_currentUserUid',
        applicationCount: 3,
        jobStatus: 'active',
        createdAt: new Date('2025-12-22T11:30:00Z'),
        updatedAt: new Date('2025-12-23T14:20:00Z'),
        
        applications: [
            {
                applicationId: 'app_mX7kR4nL9qT6wS3jP8',
                applicantUid: 'user_wS6nX9mR4qL7kT3jP5',
                jobId: 'job_rS8nK5mX2qT9wL6jP4',
                status: 'pending',
                
                appliedAt: new Date('2025-12-22T16:20:00Z'),
                updatedAt: new Date('2025-12-22T16:20:00Z'),
                
                applicantProfile: {
                    displayName: 'Tech Mike Santos',
                    photoURL: 'public/users/User-08.jpg',
                    averageRating: 5.0,
                    totalReviews: 112,
                    verified: true,
                    lastActive: new Date('2025-12-23T14:00:00Z')
                },
                
                pricing: {
                    offeredAmount: 500,
                    originalAmount: 800,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Computer technician with 12 years experience. I can diagnose and fix your laptop today. Free diagnosis if I can\'t fix it!',
                
                qualifications: {
                    experience: '12 years',
                    specializations: ['laptop repair', 'hardware troubleshooting'],
                    availability: 'same day service',
                    certifications: ['A+ certified', 'authorized technician'],
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-22',
                    appliedTime: '4:20 PM',
                    formattedPrice: '₱500 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_lK9nT6mS3qR8wX4jL7',
                applicantUid: 'user_jL4nK8mT6qS9wR3xP7',
                jobId: 'job_rS8nK5mX2qT9wL6jP4',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T08:45:00Z'),
                updatedAt: new Date('2025-12-23T08:45:00Z'),
                
                applicantProfile: {
                    displayName: 'Ryan Tech',
                    photoURL: 'public/users/User-09.jpg',
                    averageRating: 4.5,
                    totalReviews: 56,
                    verified: true,
                    lastActive: new Date('2025-12-23T13:50:00Z')
                },
                
                pricing: {
                    offeredAmount: 800,
                    originalAmount: 800,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Hello! I\'m an IT professional and can fix laptop issues. I have diagnostic tools and replacement parts if needed.',
                
                qualifications: {
                    experience: '7 years',
                    specializations: ['IT support', 'hardware repair'],
                    availability: 'today or tomorrow',
                    equipment: 'diagnostic tools',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '8:45 AM',
                    formattedPrice: '₱800 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_wP5nL8mK4qR7jT9sX3',
                applicantUid: 'user_sX7nP3mL9qK4wR8jT6',
                jobId: 'job_rS8nK5mX2qT9wL6jP4',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T12:10:00Z'),
                updatedAt: new Date('2025-12-23T12:10:00Z'),
                
                applicantProfile: {
                    displayName: 'Carl Mendoza',
                    photoURL: 'public/users/User-10.jpg',
                    averageRating: 4.0,
                    totalReviews: 21,
                    verified: false,
                    lastActive: new Date('2025-12-23T14:05:00Z')
                },
                
                pricing: {
                    offeredAmount: 600,
                    originalAmount: 800,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hi! I study computer science and repair laptops as part-time work. I can check your laptop this afternoon.',
                
                qualifications: {
                    experience: '2 years',
                    specializations: ['basic repairs', 'software troubleshooting'],
                    availability: 'afternoon',
                    education: 'computer science student',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '12:10 PM',
                    formattedPrice: '₱600 Per Job'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    },
    {
        jobId: 'job_nL6kT4mR9qX8wS5jP2',
        jobTitle: 'Dog walking - daily walks for 2 small dogs',
        employerUid: 'user_currentUserUid',
        applicationCount: 2,
        jobStatus: 'active',
        createdAt: new Date('2025-12-22T15:15:00Z'),
        updatedAt: new Date('2025-12-23T15:45:00Z'),
        
        applications: [
            {
                applicationId: 'app_kS9nL5mT8qR4wX7jP3',
                applicantUid: 'user_wX4nS8mL9qT5kR7jP6',
                jobId: 'job_nL6kT4mR9qX8wS5jP2',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T07:30:00Z'),
                updatedAt: new Date('2025-12-23T07:30:00Z'),
                
                applicantProfile: {
                    displayName: 'Luna Pet Care',
                    photoURL: 'public/users/User-11.jpg',
                    averageRating: 5.0,
                    totalReviews: 73,
                    verified: true,
                    lastActive: new Date('2025-12-23T15:20:00Z')
                },
                
                pricing: {
                    offeredAmount: 100,
                    originalAmount: 150,
                    currency: 'PHP',
                    paymentType: 'per_walk',
                    isCounterOffer: true
                },
                
                applicationMessage: 'Hello! I absolutely love dogs and have been walking pets for 6 years. Your dogs will get exercise and lots of love!',
                
                qualifications: {
                    experience: '6 years',
                    specializations: ['dog walking', 'pet care'],
                    availability: 'daily morning and evening',
                    insurance: 'pet care insured',
                    languages: ['English', 'Filipino']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '7:30 AM',
                    formattedPrice: '₱100 Per Walk'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            },
            {
                applicationId: 'app_rT7nK3mS9qL6wX8jP4',
                applicantUid: 'user_jP8nT5mK9qS6wL3rX7',
                jobId: 'job_nL6kT4mR9qX8wS5jP2',
                status: 'pending',
                
                appliedAt: new Date('2025-12-23T13:55:00Z'),
                updatedAt: new Date('2025-12-23T13:55:00Z'),
                
                applicantProfile: {
                    displayName: 'Jose Animal Lover',
                    photoURL: 'public/users/User-02.jpg',
                    averageRating: 4.5,
                    totalReviews: 42,
                    verified: true,
                    lastActive: new Date('2025-12-23T15:30:00Z')
                },
                
                pricing: {
                    offeredAmount: 150,
                    originalAmount: 150,
                    currency: 'PHP',
                    paymentType: 'per_walk',
                    isCounterOffer: false
                },
                
                applicationMessage: 'Good afternoon! I have 2 dogs myself and understand how important daily exercise is. I can walk your dogs every day!',
                
                qualifications: {
                    experience: '4 years',
                    specializations: ['small dogs', 'daily routine'],
                    availability: 'morning preferred',
                    equipment: 'own leashes and poop bags',
                    languages: ['Filipino', 'English']
                },
                
                displayData: {
                    appliedDate: '2025-12-23',
                    appliedTime: '1:55 PM',
                    formattedPrice: '₱150 Per Walk'
                },
                
                metadata: {
                    source: 'mobile_app',
                    version: '1.0',
                    indexed: true
                }
            }
        ]
    }*/
// ]; // End of removed MOCK_APPLICATIONS

// REMOVED: Generate Application Card HTML - FIREBASE DATA-DRIVEN
// REMOVED: generateApplicationCardHTML() function - obsolete since applications moved to jobs.html

// REMOVED: generateJobListingHTML() function - obsolete since applications moved to jobs.html

/*
🔥 FIREBASE MIGRATION INSTRUCTIONS - CRITICAL REFACTOR NEEDED 🔥

CURRENT STATE: Mock data with full DOM regeneration
TARGET STATE: Real-time Firebase with granular updates

🚨 BEFORE IMPLEMENTING FIREBASE, REFACTOR THIS ARCHITECTURE:

1. **REPLACE FULL REGENERATION WITH GRANULAR UPDATES:**
   Current: container.innerHTML = generateApplicationsContent() // Destroys all state
   Needed: Individual card add/remove functions that preserve user state

2. **IMPLEMENT REAL-TIME LISTENER PATTERN:**
   onSnapshot(collection('applications'), (snapshot) => {
     snapshot.docChanges().forEach((change) => {
       if (change.type === 'added') addApplicationCard(change.doc.data());
       if (change.type === 'removed') removeApplicationCard(change.doc.id);
       if (change.type === 'modified') updateApplicationCard(change.doc.data());
     });
     updatePlaceholderVisibility(); // Check if placeholder should show
   });

3. **PRESERVE USER STATE DURING UPDATES:**
   - Save scroll position before updates
   - Maintain expanded job states
   - Preserve selection states
   - Restore after granular updates

4. **IMPLEMENT OPTIMISTIC UI:**
   - Update UI immediately on user actions (HIRE/REJECT)
   - Show loading states during Firebase operations
   - Rollback on Firebase errors with user feedback

5. **CRITICAL PLACEHOLDER CONSIDERATIONS:**
   - Placeholder must persist through real-time updates
   - Only show/hide based on actual application count
   - Handle race conditions between user actions and incoming data

6. **PERFORMANCE OPTIMIZATIONS:**
   - Implement virtual scrolling for large datasets
   - Use document references instead of full data transfer
   - Batch multiple Firebase operations
   - Add proper cleanup for real-time listeners

7. **ERROR HANDLING & OFFLINE SUPPORT:**
   - Handle network failures gracefully
   - Implement retry mechanisms
   - Show appropriate offline indicators
   - Cache data for offline viewing

🎯 START HERE: Replace generateApplicationsContent() with granular functions
📋 MAINTAIN: Current placeholder logic but adapt for real-time updates
⚡ PRIORITY: State preservation and optimistic UI patterns

DO NOT proceed with Firebase integration until this architecture is refactored!
*/

// Applications Content Generation - NOW DATA-DRIVEN
function generateApplicationsContent() {
    // Generate placeholder HTML
    const placeholderHTML = `
        <!-- Applications Placeholder - Shows when no applications present -->
        <div class="content-placeholder" id="applications-placeholder" style="display: none;">
            📋<br>
            No job applications yet<br>
            <span style="font-size: 0.9em; color: #8a92a5; margin-top: 8px; display: block;">Applications from job seekers will appear here when you post job listings</span>
        </div>
    `;
    
    // Generate job listings HTML
    const jobListingsHTML = MOCK_APPLICATIONS.map(jobData => generateJobListingHTML(jobData)).join('');
    
    // Return placeholder + job listings
    return placeholderHTML + jobListingsHTML;
}

function loadApplicationsTab() {
    // UPDATED: This tab now shows the new Messages UI (inbox/details layout)
    // The content is now static HTML, so no dynamic loading needed
    console.log('📧 Messages tab loaded - using static HTML content');
    
    // The new Messages UI is already in the HTML, so we don't need to generate content
    // Future: This is where we'll add JavaScript for message functionality
}

// INPUT FOCUS ELEGANCE: Dim surrounding content when input is focused
function initializeInputFocusElegance(messageThread) {
    const inputField = messageThread.querySelector('.message-input');
    const inputContainer = messageThread.querySelector('.message-input-container');
    
    if (inputField && inputContainer) {
        console.log('Initializing input focus elegance for thread');
        
        // Focus event - add dimming classes with slight delay for smooth effect
        inputField.addEventListener('focus', function() {
            console.log('Input focused - applying elegance effect');
            setTimeout(() => {
                inputContainer.classList.add('input-focused');
                messageThread.classList.add('input-focused');
            }, 100);
        });
        
        // Blur event - remove dimming classes
        inputField.addEventListener('blur', function() {
            console.log('Input blurred - removing elegance effect');
            inputContainer.classList.remove('input-focused');
            messageThread.classList.remove('input-focused');
        });
        
        // Input field expands on focus via CSS :focus, but also needs to expand when typing
        inputField.addEventListener('input', function() {
            if (this.value.length > 0) {
                // Add expanded class when user starts typing (in addition to focus expansion)
                this.classList.add('expanded');
            } else {
                // Remove expanded class when empty (fall back to focus-only expansion)
                this.classList.remove('expanded');
            }
        });
        
        // Mobile-specific: Handle keyboard show/hide with Visual Viewport API
        if ('visualViewport' in window) {
            const handleViewportChange = () => {
                if (document.activeElement === inputField) {
                    // Input is focused and viewport changed (likely keyboard)
                    console.log('Mobile keyboard detected - applying focus elegance');
                    inputContainer.classList.add('input-focused');
                    messageThread.classList.add('input-focused');
                }
            };
            
            // MEMORY LEAK FIX: Use AbortController for proper cleanup
            const controller = new AbortController();
            window.visualViewport.addEventListener('resize', handleViewportChange, { signal: controller.signal });
            
            // Register controller for cleanup
            registerCleanup('controller', `viewportFocus_${messageThread.dataset.threadId}`, controller);
            
            // Store cleanup function for potential future use
            messageThread._cleanupFocusElegance = () => {
                controller.abort();
                console.log(`🧹 Cleaned up viewport listener for thread ${messageThread.dataset.threadId}`);
            };
        }
        
        console.log('Input focus elegance initialized successfully');
    } else {
        console.warn('Input field or container not found for focus elegance');
    }
}

// ===== DYNAMIC MESSAGE ENTRY FUNCTIONALITY =====
// BACKEND-READY: This functionality is purely frontend mock data
// When backend is ready, replace the mock logic with API calls

/**
 * Initialize dynamic message sending for a specific thread
 * @param {HTMLElement} messageThread - The message thread container
 */
function initializeDynamicMessageSending(messageThread) {
    const threadId = messageThread.getAttribute('data-thread-id');
    const participantName = messageThread.getAttribute('data-participant-name');
    const jobTitle = messageThread.getAttribute('data-job-title');
    
    const inputContainer = messageThread.querySelector('.message-input-container');
    const messageInput = messageThread.querySelector('.message-input');
    const sendButton = messageThread.querySelector('.message-send-btn');
    const scrollContainer = messageThread.querySelector('.message-scroll-container');
    
    if (!inputContainer || !messageInput || !sendButton || !scrollContainer) {
        console.warn(`Dynamic messaging: Missing elements for thread ${threadId}`);
        return;
    }
    
    // Handle send button click
    sendButton.addEventListener('click', function() {
        sendDynamicMessage(threadId, messageInput, scrollContainer, participantName, jobTitle);
    });
    
    // Handle Enter key press (but not Shift+Enter for line breaks)
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendDynamicMessage(threadId, messageInput, scrollContainer, participantName, jobTitle);
        }
    });
    
    // Handle input expansion on focus and typing
    messageInput.addEventListener('focus', function() {
        this.classList.add('expanded');
        inputContainer.classList.add('input-focused');
        messageThread.classList.add('input-focused');
    });
    
    messageInput.addEventListener('blur', function() {
        // Only remove expanded if input is empty
        if (this.value.trim() === '') {
            this.classList.remove('expanded');
        }
        inputContainer.classList.remove('input-focused');
        messageThread.classList.remove('input-focused');
    });
    
    messageInput.addEventListener('input', function() {
        // Keep expanded while typing
        this.classList.add('expanded');
    });
    
    console.log(`Dynamic messaging initialized for thread: ${threadId}`);
}

/**
 * Send a dynamic message and add it to the thread
 * BACKEND-READY: Replace this with actual API call
 * @param {string} threadId - Thread identifier
 * @param {HTMLElement} messageInput - Input element
 * @param {HTMLElement} scrollContainer - Scroll container for messages
 * @param {string} participantName - Name of the other participant
 * @param {string} jobTitle - Job title for context
 */
function sendDynamicMessage(threadId, messageInput, scrollContainer, participantName, jobTitle) {
    const messageText = messageInput.value.trim();
    
    if (messageText === '') {
        return; // Don't send empty messages
    }
    
    // BACKEND PREPARATION: This is the payload structure you'll need
    const newMessagePayload = {
        threadId: threadId,
        content: messageText,
        senderId: 'current_user_id', // Replace with actual Firebase UID
        senderName: 'You', // Replace with actual user name
        senderType: 'employer', // Replace with actual user role
        recipientId: extractParticipantId(threadId), // Extract from thread data
        recipientName: participantName,
        timestamp: new Date().toISOString(),
        jobTitle: jobTitle,
        // Additional backend fields you might need:
        messageType: 'text',
        readStatus: false,
        priority: 'normal'
    };
    
    // MOCK FRONTEND IMPLEMENTATION: Create message object for display
    const newMessage = createMockMessage(messageText, threadId);
    
    // Add message to the thread (at the top since newest are first)
    addMessageToThread(newMessage, scrollContainer);
    
    // Clear input and reset state
    messageInput.value = '';
    messageInput.classList.remove('expanded');
    messageInput.blur();
    
    // BACKEND TODO: Replace this console.log with actual API call
    console.log('BACKEND PAYLOAD:', newMessagePayload);
    console.log('Message sent successfully (mock)');
    
    // Simulate recipient response after 2-3 seconds (for demo purposes)
    if (Math.random() > 0.3) { // 70% chance of auto-response
        setTimeout(() => {
            const responseMessage = createMockResponse(participantName, threadId);
            addMessageToThread(responseMessage, scrollContainer);
            
            // Show notification for new message
            showTemporaryNotification(`New message from ${participantName}`);
        }, Math.random() * 2000 + 1500); // 1.5-3.5 seconds delay
    }
}

/**
 * Create a mock message object for frontend display
 * BACKEND-READY: This structure matches your existing message format
 * @param {string} content - Message content
 * @param {string} threadId - Thread identifier
 * @returns {Object} Message object
 */
function createMockMessage(content, threadId) {
    const now = new Date();
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    return {
        id: messageId,
        threadId: threadId,
        content: content,
        senderId: 'current_user_id',
        senderName: 'You',
        senderType: 'employer',
        direction: 'outgoing',
        avatar: 'public/users/Peter-J-Ang-User-01.jpg', // Current user avatar
        timestamp: now.toISOString(),
        timeDisplay: formatMessageTime(now),
        read: true
    };
}

/**
 * Create a mock response message (for demo purposes)
 * @param {string} participantName - Name of the participant
 * @param {string} threadId - Thread identifier
 * @returns {Object} Response message object
 */
function createMockResponse(participantName, threadId) {
    const responses = [
        "Thanks for your message! I'll get back to you soon.",
        "Sounds good! When would be a good time to discuss this?",
        "I'm interested in learning more about this opportunity.",
        "That works for me. Let me know the next steps.",
        "I have some questions about the job requirements.",
        "Perfect! I'm available for an interview anytime.",
        "Thank you for considering my application!"
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const now = new Date();
    const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    return {
        id: messageId,
        threadId: threadId,
        content: randomResponse,
        senderId: extractParticipantId(threadId),
        senderName: participantName,
        senderType: 'worker',
        direction: 'incoming',
        avatar: getParticipantAvatar(threadId),
        timestamp: now.toISOString(),
        timeDisplay: formatMessageTime(now),
        read: false
    };
}

/**
 * Add a message to the thread display
 * @param {Object} message - Message object
 * @param {HTMLElement} scrollContainer - Scroll container
 */
function addMessageToThread(message, scrollContainer) {
    const messageHTML = generateMessageHTML(message);
    
    // Add to bottom since newest messages are last (chronological order)
    scrollContainer.insertAdjacentHTML('beforeend', messageHTML);
    
    // Add entrance animation
    const newMessageElement = scrollContainer.lastElementChild;
    if (newMessageElement) {
        newMessageElement.style.opacity = '0';
        newMessageElement.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            newMessageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            newMessageElement.style.opacity = '1';
            newMessageElement.style.transform = 'translateY(0)';
        }, 50);
        
        // CRITICAL FIX: Initialize avatar overlay for newly added message
        // This ensures dynamic messages (like mock responses) have clickable avatars
        const newAvatar = newMessageElement.querySelector('.message-avatar');
        if (newAvatar) {
            initializeAvatarForOverlay(newAvatar);
            console.log('🎯 Avatar overlay initialized for new dynamic message');
        }
    }
    
    // Scroll to bottom to show the new message
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
}

/**
 * Format message time for display
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
function formatMessageTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
}

/**
 * Extract participant ID from thread ID (mock implementation)
 * BACKEND: Replace with actual data extraction
 * @param {string} threadId - Thread identifier
 * @returns {string} Participant ID
 */
function extractParticipantId(threadId) {
    // Mock implementation - extract from existing thread data
    const threadElement = document.querySelector(`[data-thread-id="${threadId}"]`);
    return threadElement ? threadElement.getAttribute('data-participant-id') || 'participant_123' : 'participant_123';
}

/**
 * Get participant avatar from thread data - CONSISTENT per participant
 * @param {string} threadId - Thread identifier
 * @returns {string} Avatar URL
 */
function getParticipantAvatar(threadId) {
    // CONSISTENT AVATAR: First try to get existing avatar from thread DOM - use specific selector
    const threadElement = document.querySelector(`.message-thread[data-thread-id="${threadId}"]`);
    if (threadElement) {
        // Look for existing incoming message avatar in this thread
        const existingAvatar = threadElement.querySelector('.message-card.incoming .message-avatar img');
        if (existingAvatar && existingAvatar.src) {
            // Extract just the path part that works for both local and online
            const src = existingAvatar.src;
            // Look for 'public/users/' in the URL and extract from there
            const publicUsersIndex = src.indexOf('public/users/');
            if (publicUsersIndex !== -1) {
                return src.substring(publicUsersIndex);
            }
            // Fallback: try to extract relative path
            return src.replace(window.location.origin + '/', '');
        }
    }
    
    // If no existing avatar found, assign one consistently based on threadId
    const avatars = [
        'public/users/User-03.jpg',
        'public/users/User-06.jpg', 
        'public/users/User-08.jpg',
        'public/users/User-10.jpg'
    ];
    
    // Use threadId to create consistent hash for avatar selection
    let hash = 0;
    const threadIdStr = String(threadId); // Ensure it's a string for consistent hashing
    for (let i = 0; i < threadIdStr.length; i++) {
        const char = threadIdStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and modulo to get consistent index
    const avatarIndex = Math.abs(hash) % avatars.length;
    return avatars[avatarIndex];
}

/**
 * Show temporary notification for new messages
 * @param {string} message - Notification message
 */
function showTemporaryNotification(message) {
    // Create temporary notification element
    const notification = document.createElement('div');
    notification.className = 'temp-notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 0.9rem;
        font-weight: 600;
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== AVATAR OVERLAY FUNCTIONALITY =====

// SHARED DEBOUNCING: Prevent rapid successive clicks across all avatars
let globalAvatarClickProcessing = false;

// MEMORY LEAK FIX: Track avatar listeners for proper cleanup
const avatarListeners = new WeakMap(); // WeakMap prevents memory leaks for DOM elements

function initializeAvatarForOverlay(avatar) {
    // Skip if already initialized (prevent duplicate handlers)
    if (avatar.hasAttribute('data-overlay-initialized')) {
        return;
    }
    
    // Get message data to check if this is the current user's avatar
    const messageCard = avatar.closest('.message-card');
    if (messageCard) {
        const senderId = messageCard.getAttribute('data-sender-id');
        const currentUserId = getCurrentUserId();
        
        // Skip overlay initialization for current user's own avatar
        // Convert both to strings for comparison since DOM attributes are strings
        if (String(senderId) === String(currentUserId) || senderId === '1') {
            console.log(`🚫 Skipping avatar overlay for current user (ID: ${senderId})`);
            return;
        }
    }
    
    // Mark as initialized
    avatar.setAttribute('data-overlay-initialized', 'true');
    
    // MEMORY LEAK FIX: Create named functions for proper cleanup
    const clickHandler = function(e) {
        e.stopPropagation(); // Prevent thread toggle
        
        // CRITICAL FIX: Debounce rapid clicks to prevent overlay stacking
        if (globalAvatarClickProcessing) {
            console.log('Avatar click ignored - still processing previous click');
            return;
        }
        
        globalAvatarClickProcessing = true;
        
        // Reset debounce flag after processing
        setTimeout(() => {
            globalAvatarClickProcessing = false;
        }, 300); // 300ms debounce window
        
        // Get message data from the parent message card
        const messageCard = this.closest('.message-card');
        if (messageCard) {
            const senderId = messageCard.getAttribute('data-sender-id');
            const senderName = messageCard.getAttribute('data-sender-name');
            const threadId = messageCard.getAttribute('data-thread-id');
            
            // Get job information from the thread
            const threadElement = messageCard.closest('.message-thread');
            const jobId = threadElement.getAttribute('data-job-id');
            const jobTitle = threadElement.getAttribute('data-job-title');
            const threadOrigin = threadElement.getAttribute('data-thread-origin'); // NEW
            const applicationId = threadElement.getAttribute('data-application-id'); // NEW
            const currentUserRole = threadElement.getAttribute('data-current-user-role'); // NEW
            
                            // Show avatar overlay
                showAvatarOverlay(e, {
                    senderId: senderId,
                    senderName: senderName,
                    threadId: threadId,
                    jobId: jobId,
                    jobTitle: jobTitle,
                    threadOrigin: threadOrigin, // NEW: Include thread origin
                    applicationId: applicationId, // NEW: Include application ID
                    currentUserRole: currentUserRole, // NEW: Include current user role
                    avatar: this.querySelector('img').src
                });
            }
        };
        
        const mouseEnterHandler = function() {
            this.style.transform = 'scale(1.05)';
        };
        
        const mouseLeaveHandler = function() {
            this.style.transform = 'scale(1)';
        };
        
        // Add all event listeners
        avatar.addEventListener('click', clickHandler);
        avatar.addEventListener('mouseenter', mouseEnterHandler);
        avatar.addEventListener('mouseleave', mouseLeaveHandler);
        
        // MEMORY LEAK FIX: Store listener references for cleanup
        avatarListeners.set(avatar, {
            click: clickHandler,
            mouseenter: mouseEnterHandler,
            mouseleave: mouseLeaveHandler
        });
        
        // Add touch-friendly styling
        avatar.style.cursor = 'pointer';
        avatar.style.transition = 'transform 0.2s ease';
    }

function initializeAvatarOverlays(messageThread) {
    // Find all message avatars in this thread
    const avatars = messageThread.querySelectorAll('.message-avatar');
    
    // Initialize each avatar for overlay functionality
    avatars.forEach(avatar => {
        initializeAvatarForOverlay(avatar);
    });
    
    console.log(`🎯 Initialized avatar overlays for ${avatars.length} avatars in thread`);
}

// Create and show chat modal overlay - TRUE MODAL SYSTEM
function showChatModal(messageThread, threadContent) {
    // Get thread data
    const threadId = messageThread.getAttribute('data-thread-id');
    const jobTitle = messageThread.querySelector('.thread-job-title').textContent;
    const participant = messageThread.querySelector('.thread-participant').textContent;
    
    // Get messages content from the thread
    const messagesContainer = threadContent.querySelector('.message-scroll-container');
    const messagesHTML = messagesContainer ? messagesContainer.innerHTML : '';
    
    // Create modal overlay - append to body for proper z-index
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'chat-modal-overlay';
    modalOverlay.id = `chat-modal-${threadId}`;
    
    // Add data attributes for message sending
    modalOverlay.setAttribute('data-thread-id', threadId);
    modalOverlay.setAttribute('data-participant-id', messageThread.getAttribute('data-participant-id'));
    modalOverlay.setAttribute('data-job-id', messageThread.getAttribute('data-job-id'));
    modalOverlay.setAttribute('data-thread-origin', messageThread.getAttribute('data-thread-origin'));
    modalOverlay.setAttribute('data-application-id', messageThread.getAttribute('data-application-id'));
    modalOverlay.setAttribute('data-current-user-role', messageThread.getAttribute('data-current-user-role'));
    
    modalOverlay.innerHTML = `
        <div class="chat-modal-container">
            <div class="chat-modal-header">
                <div class="chat-modal-info">
                    <div class="chat-modal-title">${jobTitle}</div>
                    <div class="chat-modal-participant">${participant}</div>
                </div>
                <button class="chat-modal-menu">⋮</button>
            </div>
            <div class="chat-modal-body">
                <div class="chat-messages-container">
                    ${messagesHTML}
                </div>
                <div class="chat-input-container">
                    <textarea class="chat-input" placeholder="Type a message..." maxlength="200"></textarea>
                    <button class="chat-photo-btn" type="button" title="Attach Photo">
                        <svg class="photo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                        </svg>
                    </button>
                    <input type="file" class="chat-photo-input" accept="image/*" style="display: none;">
                    <button class="chat-send-btn">Send</button>
                </div>
            </div>
        </div>
    `;
    
    // Append to body for proper layering
    document.body.appendChild(modalOverlay);
    
    // Initialize modal functionality
    initializeChatModal(modalOverlay, messageThread, threadId);
    
    // Show modal with animation
    setTimeout(() => {
        modalOverlay.classList.add('show');
        
        // Scroll to bottom to show latest messages (chronological order)
        const messagesContainer = modalOverlay.querySelector('.chat-messages-container');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, 10);
    
    console.log(`✅ Chat modal created for thread ${threadId}`);
}

// Initialize chat modal functionality
function initializeChatModal(modalOverlay, messageThread, threadId) {
    const menuBtn = modalOverlay.querySelector('.chat-modal-menu');
    const chatHeader = modalOverlay.querySelector('.chat-modal-header');
    const modalContainer = modalOverlay.querySelector('.chat-modal-container');
    
    // Menu handler - show options overlay (triggered by header or menu button)
    const menuHandler = (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        console.log('🔍 Menu button clicked, event target:', e.target);
        console.log('🔍 Menu button position:', e.target.getBoundingClientRect());
        
        // Get thread data for avatar overlay - extract participant name properly
        const participantText = messageThread.querySelector('.thread-participant').textContent;
        const senderName = participantText
            .replace('Direct Message with ', '')
            .replace('Application Interview with ', '')
            .replace('You contacted ', '')
            .replace(' contacted you', '')
            .trim();
        
        // Get thread data for avatar overlay
        const threadData = {
            senderId: messageThread.getAttribute('data-participant-id') || '2', // Default if not found
            senderName: senderName,
            threadId: threadId,
            jobId: messageThread.getAttribute('data-job-id'),
            jobTitle: messageThread.querySelector('.thread-job-title').textContent,
            threadOrigin: messageThread.getAttribute('data-thread-origin') || 'direct',
            applicationId: messageThread.getAttribute('data-application-id'),
            currentUserRole: messageThread.getAttribute('data-current-user-role') || 'customer',
            avatar: '', // Will be populated by avatar system
            participantIds: [getCurrentUserId(), messageThread.getAttribute('data-participant-id')],
            lastActivity: new Date().toISOString()
        };
        
        console.log('🔍 Opening chat options for:', threadData);
        
        // Ensure showAvatarOverlay function exists before calling
        if (typeof showAvatarOverlay === 'function') {
            showAvatarOverlay(e, threadData);
        } else {
            console.error('❌ showAvatarOverlay function not found');
        }
    };
    
    // Click outside to close
    const outsideClickHandler = (e) => {
        if (e.target === modalOverlay) {
            closeChatModal(modalOverlay);
        }
    };
    
    // Escape key to close
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeChatModal(modalOverlay);
        }
    };
    
    // Add event listeners - both header and menu button trigger options
    menuBtn.addEventListener('click', menuHandler);
    chatHeader.addEventListener('click', menuHandler);
    modalOverlay.addEventListener('click', outsideClickHandler);
    document.addEventListener('keydown', escapeHandler);
    
    // Initialize chat functionality with proper selectors
    initializeChatInputFunctionality(modalOverlay);
    initializeAvatarOverlays(modalOverlay);
    
    // Store cleanup functions
    modalOverlay._cleanup = () => {
        menuBtn.removeEventListener('click', menuHandler);
        chatHeader.removeEventListener('click', menuHandler);
        modalOverlay.removeEventListener('click', outsideClickHandler);
        document.removeEventListener('keydown', escapeHandler);
    };
}

// Initialize chat input functionality for modal
function initializeChatInputFunctionality(modalOverlay) {
    const inputField = modalOverlay.querySelector('.chat-input');
    const sendBtn = modalOverlay.querySelector('.chat-send-btn');
    const photoBtn = modalOverlay.querySelector('.chat-photo-btn');
    const photoInput = modalOverlay.querySelector('.chat-photo-input');
    const inputContainer = modalOverlay.querySelector('.chat-input-container');
    
    if (!inputField || !sendBtn || !photoBtn || !photoInput) {
        console.error('❌ Chat input elements not found');
        return;
    }
    
    // Use original CSS class system for input expansion
    inputField.addEventListener('focus', function() {
        this.classList.add('expanded');
        inputContainer.classList.add('input-focused');
    });
    
    inputField.addEventListener('blur', function() {
        // Only remove expanded if input is empty
        if (this.value.trim() === '') {
            this.classList.remove('expanded');
        }
        inputContainer.classList.remove('input-focused');
    });
    
    inputField.addEventListener('input', function() {
        // Keep expanded while typing
        this.classList.add('expanded');
    });
    
    // Send message functionality
    const sendMessage = () => {
        const message = inputField.value.trim();
        if (message) {
            console.log('📤 Sending message:', message);
            
            // Get thread data from modal
            const threadId = modalOverlay.getAttribute('data-thread-id');
            const participantId = modalOverlay.getAttribute('data-participant-id');
            
            // Create message data
            const messageData = {
                threadId: threadId,
                senderId: getCurrentUserId(),
                receiverId: participantId,
                content: message,
                timestamp: new Date().toISOString(),
                type: 'text'
            };
            
            // Add message to chat immediately (optimistic update) - Use proper message bubble structure
            const messagesContainer = modalOverlay.querySelector('.chat-messages-container');
            const messageElement = document.createElement('div');
            messageElement.className = 'message-card outgoing';
            messageElement.innerHTML = `
                <div class="message-header">
                    <div class="message-avatar">
                        <img src="public/users/Peter-J-Ang-User-01.jpg" alt="You" onerror="this.src='public/images/logo.png'">
                    </div>
                    <div class="message-info">
                        <div class="message-sender">You</div>
                        <div class="message-timestamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                    </div>
                </div>
                <div class="message-bubble outgoing">
                    ${message}
                </div>
            `;
            
            // Insert at bottom since newest messages are last (chronological order)
            messagesContainer.appendChild(messageElement);
            
            // Add entrance animation
            messageElement.style.opacity = '0';
            messageElement.style.transform = 'translateY(10px)';
            setTimeout(() => {
                messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                messageElement.style.opacity = '1';
                messageElement.style.transform = 'translateY(0)';
            }, 50);
            
            // Scroll to bottom to show the new message
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Clear input and reset state
            inputField.value = '';
            inputField.classList.remove('expanded');
            inputContainer.classList.remove('input-focused');
            
            // SIMULATE AUTO-RESPONSE (like original system)
            const participantName = modalOverlay.querySelector('.chat-modal-participant').textContent
                .replace('Direct Message with ', '')
                .replace('Application Interview with ', '')
                .replace('You contacted ', '')
                .replace(' contacted you', '')
                .trim();
            
            // 70% chance of auto-response after 1.5-3.5 seconds
            if (Math.random() > 0.3) {
                setTimeout(() => {
                    const responses = [
                        "Thanks for your message! I'll get back to you soon.",
                        "Sounds good! When would be a good time to discuss this?",
                        "I'm interested in learning more about this opportunity.",
                        "That works for me. Let me know the next steps.",
                        "I have some questions about the job requirements.",
                        "Perfect! I'm available for an interview anytime.",
                        "Thank you for considering my application!"
                    ];
                    
                    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                    
                    const responseElement = document.createElement('div');
                    responseElement.className = 'message-card incoming';
                    responseElement.innerHTML = `
                        <div class="message-header">
                            <div class="message-info">
                                <div class="message-sender">${participantName}</div>
                                <div class="message-timestamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                            <div class="message-avatar">
                                <img src="${getParticipantAvatar(threadId)}" alt="${participantName}" onerror="this.src='public/images/logo.png'">
                            </div>
                        </div>
                        <div class="message-bubble incoming">
                            ${randomResponse}
                        </div>
                    `;
                    
                    // Insert at bottom since newest messages are last
                    messagesContainer.appendChild(responseElement);
                    
                    // Add entrance animation
                    responseElement.style.opacity = '0';
                    responseElement.style.transform = 'translateY(10px)';
                    setTimeout(() => {
                        responseElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        responseElement.style.opacity = '1';
                        responseElement.style.transform = 'translateY(0)';
                    }, 50);
                    
                    // Scroll to bottom to show the new message
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    
                    console.log(`🤖 Auto-response from ${participantName}: ${randomResponse}`);
                }, Math.random() * 2000 + 1500); // 1.5-3.5 seconds delay
            }
            
            // Send to backend (if available)
            if (typeof sendMessageToBackend === 'function') {
                sendMessageToBackend(messageData);
            } else {
                console.log('📝 Message data (backend not connected):', messageData);
            }
            
            // Update the original thread's last message
            updateThreadLastMessage(threadId, message);
        }
    };
    
    // Send button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Enter key to send (Shift+Enter for new line)
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Photo upload functionality
    photoBtn.addEventListener('click', () => {
        if (!photoBtn.classList.contains('loading')) {
            photoInput.click();
        }
    });

    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            handlePhotoUpload(file, modalOverlay);
        }
        // Reset input so same file can be selected again
        photoInput.value = '';
    });
    
    console.log('✅ Chat input functionality initialized');
}

/**
 * Handle photo upload in chat
 * @param {File} file - Selected image file
 * @param {HTMLElement} modalOverlay - Chat modal overlay
 */
function handlePhotoUpload(file, modalOverlay) {
    const photoBtn = modalOverlay.querySelector('.chat-photo-btn');
    const messagesContainer = modalOverlay.querySelector('.chat-messages-container');
    
    // Show loading state
    photoBtn.classList.add('loading');
    
    console.log('📸 Processing photo for chat...');
    
    // Process image using new-post.js compression standards
    processChatImage(file, (processedImage) => {
        // Get thread data
        const threadId = modalOverlay.getAttribute('data-thread-id');
        const participantId = modalOverlay.getAttribute('data-participant-id');
        
        // Create photo message data with dual URLs
        const photoMessageData = {
            threadId: threadId,
            senderId: getCurrentUserId(),
            receiverId: participantId,
            content: '', // Empty for photo messages
            thumbnailUrl: processedImage.thumbnailURL,
            fullSizeUrl: processedImage.fullSizeURL,
            messageType: 'image',
            timestamp: new Date().toISOString(),
            dimensions: processedImage.dimensions,
            aspectRatio: processedImage.aspectRatio,
            fileSizes: {
                thumbnail: processedImage.thumbnailSize,
                fullSize: processedImage.fullSizeSize
            }
        };
        
        // Create photo message HTML with thumbnail for display, full-size for lightbox
        const photoMessageHTML = createPhotoMessageHTML(
            processedImage.thumbnailURL,
            processedImage.fullSizeURL,
            'outgoing',
            'You',
            'public/users/Peter-J-Ang-User-01.jpg'
        );
        
        // Add photo message to chat
        const messageElement = document.createElement('div');
        messageElement.innerHTML = photoMessageHTML;
        const photoMessage = messageElement.firstElementChild;
        
        // Insert at bottom since newest messages are last
        messagesContainer.appendChild(photoMessage);
        
        // Ensure proper scrolling after image loads
        const photoImg = photoMessage.querySelector('.photo-thumbnail');
        const scrollToBottom = () => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        };
        
        // Add load event listener to image for proper scroll positioning
        photoImg.addEventListener('load', scrollToBottom);
        
        // Add entrance animation
        photoMessage.style.opacity = '0';
        photoMessage.style.transform = 'translateY(10px)';
        setTimeout(() => {
            photoMessage.style.opacity = '1';
            photoMessage.style.transform = 'translateY(0)';
            photoMessage.style.transition = 'all 0.3s ease';
            
            // Scroll to bottom after animation starts (fallback if image already loaded)
            setTimeout(scrollToBottom, 50);
        }, 10);
        
        // Reset photo button
        photoBtn.classList.remove('loading');
        
        // Log performance metrics
        const originalSize = Math.round(processedImage.originalFile.size / 1024); // KB
        const thumbnailSizeKB = Math.round(processedImage.thumbnailSize / 1024); // KB  
        const fullSizeSizeKB = Math.round(processedImage.fullSizeSize / 1024); // KB
        const bandwidthSavings = Math.round(((fullSizeSizeKB - thumbnailSizeKB) / fullSizeSizeKB) * 100);
        
        console.log('📸 Photo Upload Performance:');
        console.log(`   Original: ${originalSize} KB`);
        console.log(`   Full-size: ${fullSizeSizeKB} KB`);
        console.log(`   Thumbnail: ${thumbnailSizeKB} KB`);
        console.log(`   💰 Bandwidth savings: ${bandwidthSavings}% (${fullSizeSizeKB - thumbnailSizeKB} KB saved)`);
        console.log('✅ Photo message sent:', photoMessageData);
        
        // BACKEND TODO: Send photoMessageData to server
        // In production, upload image to Firebase Storage and send message with image URL
        
        // Simulate auto-response with TEXT (30% chance) - photos should get text responses, not photo responses
        if (Math.random() > 0.7) {
            setTimeout(() => {
                // Extract participant name properly (same logic as text auto-response)
                const participantNameElement = modalOverlay.querySelector('.chat-modal-participant');
                const participantName = participantNameElement ? 
                    participantNameElement.textContent
                        .replace('Direct Message with ', '')
                        .replace('Application Interview with ', '')
                        .replace('You contacted ', '')
                        .replace(' contacted you', '')
                        .trim() : 'Bot';
                
                const photoResponses = [
                    "Nice photo! 📸",
                    "Looks great! Thanks for sharing.",
                    "Perfect! That's exactly what I needed to see.",
                    "Thanks for the photo! Very helpful.",
                    "Great shot! 👍",
                    "Awesome! This gives me a better idea.",
                    "Perfect timing with that photo!"
                ];
                
                const randomResponse = photoResponses[Math.floor(Math.random() * photoResponses.length)];
                
                const responseElement = document.createElement('div');
                responseElement.className = 'message-card incoming';
                responseElement.innerHTML = `
                    <div class="message-header">
                        <div class="message-info">
                            <div class="message-sender">${participantName}</div>
                            <div class="message-timestamp">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                        <div class="message-avatar">
                            <img src="${getParticipantAvatar(threadId)}" alt="${participantName}" onerror="this.src='public/images/logo.png'">
                        </div>
                    </div>
                    <div class="message-bubble incoming">
                        ${randomResponse}
                    </div>
                `;
                
                // Insert at bottom since newest messages are last
                messagesContainer.appendChild(responseElement);
                
                // Add entrance animation
                responseElement.style.opacity = '0';
                responseElement.style.transform = 'translateY(10px)';
                setTimeout(() => {
                    responseElement.style.opacity = '1';
                    responseElement.style.transform = 'translateY(0)';
                    responseElement.style.transition = 'all 0.3s ease';
                }, 10);
                
                // Scroll to bottom
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
                
                console.log('💬 Auto-response text sent for photo');
            }, 2000 + Math.random() * 2000); // 2-4 seconds delay
        }
    });
}

// Close chat modal
function closeChatModal(modalOverlay) {
    if (modalOverlay && modalOverlay.parentNode) {
        // Cleanup event listeners
        if (modalOverlay._cleanup) {
            modalOverlay._cleanup();
        }
        
        // Reset all thread states and remove greyed out appearance
        const allMessageThreads = document.querySelectorAll('.message-thread');
        allMessageThreads.forEach(thread => {
            const header = thread.querySelector('.message-thread-header');
            const expandIcon = header?.querySelector('.expand-icon');
            
            // CRITICAL: Reset thread appearance - remove greyed out state
            thread.style.opacity = '';
            thread.style.transform = '';
            thread.style.pointerEvents = '';
            
            // Reset expand icon to downarrow
            if (expandIcon) {
                expandIcon.textContent = '▼';
            }
            
            // Remove expanded state
            thread.classList.remove('expanded', 'show');
        });
        
        // Find all messages containers and remove active state
        const messagesContainers = document.querySelectorAll('.messages-container');
        messagesContainers.forEach(container => {
            container.classList.remove('thread-active', 'show-overlay');
        });
        
        // Fade out animation
        modalOverlay.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (modalOverlay.parentNode) {
                modalOverlay.parentNode.removeChild(modalOverlay);
            }
        }, 300);
        
        console.log('✅ Chat modal closed and cleaned up');
    }
}

// MEMORY LEAK FIX: Cleanup function for avatar listeners
function cleanupAvatarOverlays(container) {
    const avatars = container.querySelectorAll('.message-avatar[data-overlay-initialized="true"]');
    
    avatars.forEach(avatar => {
        const listeners = avatarListeners.get(avatar);
        if (listeners) {
            // Remove all event listeners
            avatar.removeEventListener('click', listeners.click);
            avatar.removeEventListener('mouseenter', listeners.mouseenter);
            avatar.removeEventListener('mouseleave', listeners.mouseleave);
            
            // Remove from tracking
            avatarListeners.delete(avatar);
            
            // Reset initialization flag
            avatar.removeAttribute('data-overlay-initialized');
            
            // Reset styling
            avatar.style.cursor = '';
            avatar.style.transition = '';
            avatar.style.transform = '';
        }
    });
    
    console.log(`🧹 Cleaned up avatar overlays for ${avatars.length} avatars`);
}

function showAvatarOverlay(event, userData) {
    // CRITICAL FIX: Prevent rapid clicking from creating multiple overlays
    if (document.getElementById('avatarOverlay')) {
        console.log('Avatar overlay already exists, ignoring rapid click');
        return; // Exit early if overlay already exists
    }
    
    // CRITICAL FIX: Always clean up existing listeners first
    // This prevents the stacking listener bug that causes stuck overlays
    document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, true);
    document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, false);
    
    // Remove any existing overlay (redundant safety check)
    hideAvatarOverlay();
    
    // Create overlay element
    const overlay = document.createElement('div');
    overlay.className = 'avatar-overlay';
    overlay.id = 'avatarOverlay';
    
    // DEBUG: Log userData to see what we're working with
    console.log(`🔍 DEBUG: Avatar overlay userData:`, userData);
    console.log(`🔍 DEBUG: threadOrigin = "${userData.threadOrigin}"`);
    console.log(`🔍 DEBUG: applicationId = "${userData.applicationId}"`);
    console.log(`🔍 DEBUG: jobId = "${userData.jobId}"`);
    
    // REMOVED: "View Application" button - no longer needed since applications moved to jobs.html
    const viewApplicationButton = ''; // Always empty now
    
    overlay.innerHTML = `
        <div class="avatar-overlay-header">
            <div class="avatar-overlay-name">${userData.senderName}</div>
            <div class="avatar-overlay-subtitle">${userData.threadOrigin === 'application' ? 'Application Conversation' : 'Job Post Conversation'}</div>
        </div>
        <div class="avatar-overlay-actions">
            <button class="avatar-action-btn close" data-thread-id="${userData.threadId || 'unknown'}">
                <span>✕</span>
                <span>CLOSE CONVERSATION</span>
            </button>
            <button class="avatar-action-btn profile" data-user-id="${userData.senderId}" data-user-name="${userData.senderName}">
                <span>👤</span>
                <span>VIEW PROFILE</span>
            </button>
            <button class="avatar-action-btn job" data-job-id="${userData.jobId}" data-job-title="${userData.jobTitle}">
                <span>💼</span>
                <span>VIEW JOB POST</span>
            </button>
            ${viewApplicationButton}
            <button class="avatar-action-btn block" data-user-id="${userData.senderId}" data-user-name="${userData.senderName}">
                <span>🚫</span>
                <span>BLOCK USER</span>
            </button>
            <button class="avatar-action-btn delete" data-thread-id="${userData.threadId || 'unknown'}" data-user-name="${userData.senderName}">
                <span>🗑️</span>
                <span>DELETE CONVERSATION</span>
            </button>
        </div>
    `;
    
    // Create backdrop for subtle shadow and click-to-close functionality
    const backdrop = document.createElement('div');
    backdrop.className = 'avatar-overlay-backdrop';
    backdrop.id = 'avatarOverlayBackdrop';
    
    // Add backdrop click handler to close modal
    backdrop.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        hideAvatarOverlay();
    });
    
    // Add backdrop and overlay to page
    document.body.appendChild(backdrop);
    document.body.appendChild(overlay);
    
    // Position overlay near the clicked avatar
    positionAvatarOverlay(overlay, event);
    
    // Show backdrop and overlay with animation - MEMORY LEAK FIX: Use tracked timeout
    trackTimeout(() => {
        backdrop.classList.add('show');
        overlay.classList.add('show');
    }, 10);
    
    // Add action handlers
    initializeAvatarOverlayActions(overlay, userData);
    
    // IMPROVED LISTENER MANAGEMENT: Add single listener with proper timing and tracking
    // Wait for the overlay to be fully rendered before adding outside click detection
    // MEMORY LEAK FIX: Use tracked timeout
    trackTimeout(() => {
        // Initialize listener count if not exists
        if (!window.avatarOverlayListenerCount) {
            window.avatarOverlayListenerCount = 0;
        }
        
        // Store reference for proper cleanup
        window.avatarOverlayClickHandler = hideAvatarOverlayOnOutsideClick;
        document.addEventListener('click', window.avatarOverlayClickHandler, true);
        window.avatarOverlayListenerCount++;
        
        console.log(`📌 Avatar overlay listener added (count: ${window.avatarOverlayListenerCount})`);
    }, 150); // Increased delay to ensure overlay is fully positioned
}

function positionAvatarOverlay(overlay, event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = rect.bottom + 10;
    let left = rect.left + (rect.width / 2) - (200 / 2); // Center on avatar
    
    // Adjust for viewport boundaries
    if (left + 200 > viewportWidth - 20) {
        left = viewportWidth - 220; // 200 + 20 margin
    }
    if (left < 20) {
        left = 20;
    }
    
    // If overlay would go below viewport, position above avatar
    if (top + 150 > viewportHeight - 20) {
        top = rect.top - 150 - 10;
    }
    
    // Ensure it doesn't go above viewport
    if (top < 20) {
        top = 20;
    }
    
    overlay.style.top = `${top}px`;
    overlay.style.left = `${left}px`;
}

function initializeAvatarOverlayActions(overlay, userData) {
    // MEMORY LEAK FIX: Create AbortController for proper cleanup
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Store controller reference on overlay for cleanup
    overlay._abortController = controller;
    
    // MEMORY LEAK FIX: Track controller in global registry
    CLEANUP_REGISTRY.activeControllers.add(controller);
    
    // VIEW PROFILE button
    const profileBtn = overlay.querySelector('.avatar-action-btn.profile');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            
            console.log(`🔗 Opening profile for user: ${userName} (ID: ${userId})`);
            
            // BACKEND INTEGRATION POINT: Navigate to user profile
            // Example: window.location.href = `/profile/${userId}`;
            // Or: openUserProfile(userId);
            
            // Show temporary notification
            showTemporaryNotification(`Opening profile for ${userName}...`);
            
            // Hide overlay
            hideAvatarOverlay();
        }, { signal }); // MEMORY LEAK FIX: Use AbortController signal
    }
    
    // VIEW JOB POST button
    const jobBtn = overlay.querySelector('.avatar-action-btn.job');
    if (jobBtn) {
        jobBtn.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            const jobTitle = this.getAttribute('data-job-title');
            
            console.log(`🔗 Opening job post: ${jobTitle} (ID: ${jobId})`);
            
            // BACKEND INTEGRATION POINT: Navigate to job post
            // Example: window.location.href = `/job/${jobId}`;
            // Or: openJobPost(jobId);
            
            // Show temporary notification
            showTemporaryNotification(`Opening job post: ${jobTitle}...`);
            
            // Hide overlay
            hideAvatarOverlay();
        }, { signal }); // MEMORY LEAK FIX: Use AbortController signal
    }
    
    // VIEW APPLICATION button (only for application-based threads)
    const applicationBtn = overlay.querySelector('.avatar-action-btn.application');
    if (applicationBtn) {
        console.log(`🔍 DEBUG: View Application button found:`, applicationBtn);
        console.log(`🔍 DEBUG: Button data attributes:`, {
            applicationId: applicationBtn.getAttribute('data-application-id'),
            jobId: applicationBtn.getAttribute('data-job-id')
        });
        
        // REMOVED: View Application button click handler - no longer needed
        console.log(`🔍 DEBUG: View Application button functionality removed`);
    } else {
        console.log(`🔍 DEBUG: No View Application button found in overlay (expected - removed)`);
    }
    
    // BLOCK USER button
    const blockBtn = overlay.querySelector('.avatar-action-btn.block');
    if (blockBtn) {
        blockBtn.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            
            console.log(`🚫 Blocking user: ${userName} (ID: ${userId})`);
            
            // Show custom confirmation dialog
            showCustomConfirmation(
                'Block User',
                `Are you sure you want to block ${userName}? This will prevent them from contacting you and hide this conversation.`,
                'Block',
                'Cancel',
                async () => {
                    // Confirmed - block the user with Firebase integration
                    console.log(`🚫 Initiating block for user: ${userName} (ID: ${userId})`);
                    
                    try {
                        // Get current user ID for Firebase operations
                        const currentUserId = getCurrentUserId();
                        
                        // Show loading state
                        showTemporaryNotification(`Blocking ${userName}...`);
                        
                        // Firebase: Block user operation
                        const result = await blockUserInFirebase(currentUserId, userId, userName);
                        
                        if (result.success) {
                            // Success - update UI
                            console.log(`✅ Firebase: User ${userName} successfully blocked`);
                            showTemporaryNotification(`${userName} has been blocked`);
                            
                            // Hide overlay
                            hideAvatarOverlay();
                            
                            // Close the expanded thread since user is blocked
                            closeAllMessageThreads();
                            
                            // Refresh conversations list to hide blocked user's conversations
                            await refreshConversationsList();
                            
                        } else {
                            // Firebase operation failed
                            console.error(`❌ Firebase: Failed to block ${userName}:`, result.error);
                            showTemporaryNotification(`Failed to block ${userName}. Please try again.`);
                        }
                        
                    } catch (error) {
                        // Network or unexpected error
                        console.error(`❌ Block user error:`, error);
                        showTemporaryNotification(`Network error. Please check your connection and try again.`);
                    }
                },
                () => {
                    // Cancelled - do nothing
                    console.log(`❌ Block cancelled for ${userName}`);
                }
            );
        }, { signal });
    }
    
    // DELETE CONVERSATION button
    const deleteBtn = overlay.querySelector('.avatar-action-btn.delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            const threadId = this.getAttribute('data-thread-id');
            const userName = this.getAttribute('data-user-name');
            
            console.log(`🗑️ Deleting conversation with: ${userName} (Thread ID: ${threadId})`);
            
            // Show custom confirmation dialog
            showCustomConfirmation(
                'Delete Conversation',
                `Are you sure you want to delete this conversation with ${userName}? This action cannot be undone.`,
                'Delete',
                'Cancel',
                async () => {
                    // Confirmed - delete the conversation with Firebase integration
                    console.log(`🗑️ Initiating delete for conversation: ${threadId} with ${userName}`);
                    
                    try {
                        // Get current user ID for Firebase operations
                        const currentUserId = getCurrentUserId();
                        
                        // Show loading state
                        showTemporaryNotification(`Deleting conversation with ${userName}...`);
                        
                        // Firebase: Delete conversation operation
                        const result = await deleteConversationInFirebase(currentUserId, threadId, userName);
                        
                        if (result.success) {
                            // Success - update UI
                            console.log(`✅ Firebase: Conversation with ${userName} successfully deleted`);
                            showTemporaryNotification(`Conversation with ${userName} deleted`);
                            
                            // Hide overlay
                            hideAvatarOverlay();
                            
                            // Close the expanded thread and remove it from the list
                            closeAllMessageThreads();
                            
                            // Remove the thread from the DOM immediately for better UX
                            const threadElement = document.querySelector(`[data-thread-id="${threadId}"]`);
                            if (threadElement) {
                                // Fade out animation before removal
                                threadElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                threadElement.style.opacity = '0';
                                threadElement.style.transform = 'translateX(-20px)';
                                
                                // MEMORY LEAK FIX: Use tracked timeout
                                trackTimeout(() => {
                                    if (threadElement.parentNode) {
                                        threadElement.remove();
                                    }
                                    // Update message count after removal
                                    updateMessageCount();
                                }, 300);
                            }
                            
                            // Refresh conversations list to reflect Firebase changes
                            // MEMORY LEAK FIX: Use tracked timeout
                            trackTimeout(async () => {
                                await refreshConversationsList();
                            }, 500);
                            
                        } else {
                            // Firebase operation failed
                            console.error(`❌ Firebase: Failed to delete conversation with ${userName}:`, result.error);
                            showTemporaryNotification(`Failed to delete conversation. Please try again.`);
                        }
                        
                    } catch (error) {
                        // Network or unexpected error
                        console.error(`❌ Delete conversation error:`, error);
                        showTemporaryNotification(`Network error. Please check your connection and try again.`);
                    }
                },
                () => {
                    // Cancelled - do nothing
                    console.log(`❌ Delete cancelled for conversation with ${userName}`);
                }
            );
        }, { signal });
    }
    
    // CLOSE CONVERSATION button
    const closeBtn = overlay.querySelector('.avatar-action-btn.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const threadId = this.getAttribute('data-thread-id');
            
            console.log(`✕ Closing conversation (Thread ID: ${threadId})`);
            
            // Hide overlay
            hideAvatarOverlay();
            
            // Close the expanded thread
            closeAllMessageThreads();
        }, { signal });
    }
}

function hideAvatarOverlay() {
    const existingOverlay = document.getElementById('avatarOverlay');
    const existingBackdrop = document.getElementById('avatarOverlayBackdrop');
    
    if (existingOverlay) {
        // MEMORY LEAK FIX: Cleanup action button listeners before removing overlay
        if (existingOverlay._abortController) {
            existingOverlay._abortController.abort();
            // MEMORY LEAK FIX: Remove from global registry
            CLEANUP_REGISTRY.activeControllers.delete(existingOverlay._abortController);
            existingOverlay._abortController = null;
        }
        
        existingOverlay.classList.remove('show');
        // MEMORY LEAK FIX: Use tracked timeout
        trackTimeout(() => {
            if (existingOverlay.parentNode) {
                existingOverlay.parentNode.removeChild(existingOverlay);
            }
        }, 200);
    }
    
    if (existingBackdrop) {
        existingBackdrop.classList.remove('show');
        // MEMORY LEAK FIX: Use tracked timeout
        trackTimeout(() => {
            if (existingBackdrop.parentNode) {
                existingBackdrop.parentNode.removeChild(existingBackdrop);
            }
        }, 200);
    }
    
    // CRITICAL FIX: Complete listener cleanup with multiple strategies
    // Strategy 1: Remove using stored reference
    if (window.avatarOverlayClickHandler) {
        document.removeEventListener('click', window.avatarOverlayClickHandler, true);
        document.removeEventListener('click', window.avatarOverlayClickHandler, false);
        window.avatarOverlayClickHandler = null;
    }
    
    // Strategy 2: Remove using function reference (fallback)
    document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, true);
    document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, false);
    
    // Strategy 3: Clear any possible duplicate listeners by redefining the function
    // This nuclear option ensures no listeners can survive
    if (window.avatarOverlayListenerCount > 0) {
        for (let i = 0; i < window.avatarOverlayListenerCount; i++) {
            document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, true);
            document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, false);
        }
        window.avatarOverlayListenerCount = 0;
    }
    
    console.log('🧹 Avatar overlay cleanup completed');
}

function hideAvatarOverlayOnOutsideClick(event) {
    const overlay = document.getElementById('avatarOverlay');
    if (overlay && !overlay.contains(event.target)) {
        // ENHANCED SAFETY: Extra checks to prevent stuck overlays
        const isAvatarClick = event.target.closest('.message-avatar');
        const isOverlayAction = event.target.closest('.avatar-action-btn');
        
        // Don't close if clicking on an avatar (new overlay will replace) or action button
        if (!isAvatarClick && !isOverlayAction) {
            console.log('🎯 Outside click detected, hiding avatar overlay');
            hideAvatarOverlay();
        }
    }
}

/*
 * FIREBASE INTEGRATION DOCUMENTATION
 * 
 * Required Firestore Collections Structure:
 * 
 * /users/{userId}
 *   - blockedUsers: [array] - List of blocked user IDs for quick lookup
 *   - activeConversations: [array] - List of active conversation IDs
 *   - deletedConversations: [array] - List of deleted conversation IDs
 *   - lastActivity: [timestamp] - Last user activity timestamp
 * 
 * /users/{userId}/blockedUsers/{blockedUserId}
 *   - blockedUserId: [string] - ID of blocked user
 *   - blockedUserName: [string] - Name of blocked user
 *   - blockedAt: [timestamp] - When user was blocked
 *   - reason: [string] - Reason for blocking ('user_initiated', etc.)
 * 
 * /conversations/{conversationId}
 *   - participants: [array] - Array of participant user IDs
 *   - hiddenFor: [object] - Map of userId -> boolean for hidden conversations
 *   - deletedFor: [object] - Map of userId -> timestamp for deleted conversations
 *   - blockedBy: [object] - Map of userId -> blockedUserId for blocked conversations
 *   - lastActivity: [object] - Map of userId -> timestamp for activity tracking
 * 
 * /conversations/{conversationId}/messages/{messageId}
 *   - senderId: [string] - ID of message sender
 *   - content: [string] - Message content
 *   - timestamp: [timestamp] - When message was sent
 *   - deletedFor: [object] - Map of userId -> timestamp for deleted messages
 *   - hiddenFor: [object] - Map of userId -> boolean for hidden messages
 * 
 * Required Firestore Security Rules:
 * 
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // Users can only access their own data
 *     match /users/{userId} {
 *       allow read, write: if request.auth != null && request.auth.uid == userId;
 *       
 *       // Blocked users subcollection
 *       match /blockedUsers/{blockedUserId} {
 *         allow read, write: if request.auth != null && request.auth.uid == userId;
 *       }
 *     }
 *     
 *     // Conversations - only participants can access
 *     match /conversations/{conversationId} {
 *       allow read, write: if request.auth != null && 
 *         request.auth.uid in resource.data.participants &&
 *         !isUserBlocked(request.auth.uid, resource.data);
 *       
 *       // Messages subcollection
 *       match /messages/{messageId} {
 *         allow read, write: if request.auth != null && 
 *           request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participants;
 *       }
 *     }
 *   }
 *   
 *   // Helper function to check if user is blocked
 *   function isUserBlocked(userId, conversationData) {
 *     return conversationData.blockedBy != null && 
 *            conversationData.blockedBy[userId] != null;
 *   }
 * }
 */

// Firebase Helper Functions
function getCurrentUserId() {
    // Get current user ID from Firebase Auth or session storage
    if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
        return firebase.auth().currentUser.uid;
    }
    // Fallback to session storage for development
    return localStorage.getItem('currentUserId') || '1'; // Peter's ID for mock environment
}

function checkFirebaseConnection() {
    // Check if Firebase is available and properly initialized
    if (typeof firebase === 'undefined') {
        console.warn('⚠️ Firebase not loaded');
        return { connected: false, error: 'Firebase not loaded' };
    }
    
    if (typeof db === 'undefined') {
        console.warn('⚠️ Firestore not initialized');
        return { connected: false, error: 'Firestore not initialized' };
    }
    
    // Check authentication
    const currentUser = getCurrentUserId();
    if (!currentUser || currentUser === 'current_user_id') {
        console.warn('⚠️ User not authenticated');
        return { connected: false, error: 'User not authenticated' };
    }
    
    return { connected: true };
}

async function blockUserInFirebase(currentUserId, blockedUserId, blockedUserName) {
    try {
        console.log(`🔥 Firebase: Blocking user ${blockedUserName} (${blockedUserId})`);
        
        // Check Firebase connection first
        const connectionCheck = checkFirebaseConnection();
        if (!connectionCheck.connected) {
            throw new Error(`Firebase connection failed: ${connectionCheck.error}`);
        }
        
        // Initialize Firestore batch
        const batch = db.batch();
        
        // 1. Add to blocked users subcollection
        const blockedUserRef = db.collection('users').doc(currentUserId)
                                .collection('blockedUsers').doc(blockedUserId);
        batch.set(blockedUserRef, {
            blockedUserId: blockedUserId,
            blockedUserName: blockedUserName,
            blockedAt: firebase.firestore.FieldValue.serverTimestamp(),
            reason: 'user_initiated'
        });
        
        // 2. Update user's blocked list array for quick lookups
        const userRef = db.collection('users').doc(currentUserId);
        batch.update(userRef, {
            blockedUsers: firebase.firestore.FieldValue.arrayUnion(blockedUserId),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 3. Hide all conversations with blocked user
        const conversationsQuery = await db.collection('conversations')
            .where('participants', 'array-contains', currentUserId)
            .get();
        
        const conversationsToUpdate = [];
        conversationsQuery.forEach(doc => {
            const participants = doc.data().participants || [];
            if (participants.includes(blockedUserId)) {
                conversationsToUpdate.push(doc.ref);
            }
        });
        
        conversationsToUpdate.forEach(conversationRef => {
            batch.update(conversationRef, {
                [`hiddenFor.${currentUserId}`]: true,
                [`blockedBy.${currentUserId}`]: blockedUserId,
                [`lastActivity.${currentUserId}`]: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        // 4. Commit all changes atomically
        await batch.commit();
        
        console.log(`✅ Firebase: Successfully blocked user ${blockedUserName}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Firebase: Block user failed:', error);
        return { success: false, error: error.message };
    }
}

async function deleteConversationInFirebase(currentUserId, threadId, participantName) {
    try {
        console.log(`🔥 Firebase: Deleting conversation ${threadId} for user ${currentUserId}`);
        
        // Check Firebase connection first
        const connectionCheck = checkFirebaseConnection();
        if (!connectionCheck.connected) {
            throw new Error(`Firebase connection failed: ${connectionCheck.error}`);
        }
        
        // Initialize Firestore batch
        const batch = db.batch();
        
        // 1. Mark conversation as deleted for current user (soft delete)
        const conversationRef = db.collection('conversations').doc(threadId);
        batch.update(conversationRef, {
            [`deletedFor.${currentUserId}`]: firebase.firestore.FieldValue.serverTimestamp(),
            [`hiddenFor.${currentUserId}`]: true,
            [`lastActivity.${currentUserId}`]: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 2. Soft delete all messages for this user
        const messagesQuery = await db.collection('conversations').doc(threadId)
                                    .collection('messages').get();
        
        messagesQuery.forEach(messageDoc => {
            batch.update(messageDoc.ref, {
                [`deletedFor.${currentUserId}`]: firebase.firestore.FieldValue.serverTimestamp(),
                [`hiddenFor.${currentUserId}`]: true
            });
        });
        
        // 3. Update user's conversation management
        const userRef = db.collection('users').doc(currentUserId);
        batch.update(userRef, {
            activeConversations: firebase.firestore.FieldValue.arrayRemove(threadId),
            deletedConversations: firebase.firestore.FieldValue.arrayUnion(threadId),
            lastActivity: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 4. Commit all changes atomically
        await batch.commit();
        
        console.log(`✅ Firebase: Successfully deleted conversation with ${participantName}`);
        return { success: true };
        
    } catch (error) {
        console.error('❌ Firebase: Delete conversation failed:', error);
        return { success: false, error: error.message };
    }
}

async function refreshConversationsList() {
    try {
        console.log('🔄 Firebase: Refreshing conversations list...');
        
        // Re-load the messages tab to reflect changes
        const messagesTab = document.querySelector('.tab-btn[data-tab="messages"]');
        if (messagesTab && messagesTab.classList.contains('active')) {
            loadMessagesTab();
        }
        
        // Update message count
        updateMessageCount();
        
        console.log('✅ Firebase: Conversations list refreshed');
        
    } catch (error) {
        console.error('❌ Firebase: Failed to refresh conversations:', error);
    }
}

// Custom Confirmation Dialog System
function showCustomConfirmation(title, message, confirmText, cancelText, onConfirm, onCancel) {
    // Remove any existing custom confirmation
    const existingConfirm = document.getElementById('customConfirmationOverlay');
    if (existingConfirm) {
        existingConfirm.remove();
    }
    
    // Create confirmation overlay
    const confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'customConfirmationOverlay';
    confirmOverlay.className = 'custom-confirmation-overlay';
    confirmOverlay.innerHTML = `
        <div class="custom-confirmation-modal">
            <div class="custom-confirmation-title">${title}</div>
            <div class="custom-confirmation-message">${message}</div>
            <div class="custom-confirmation-buttons">
                <button class="custom-confirmation-btn cancel" id="customCancelBtn">${cancelText}</button>
                <button class="custom-confirmation-btn confirm" id="customConfirmBtn">${confirmText}</button>
            </div>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(confirmOverlay);
    
    // Show with animation - MEMORY LEAK FIX: Use tracked timeout
    trackTimeout(() => {
        confirmOverlay.classList.add('show');
    }, 10);
    
    // Handle button clicks
    const confirmBtn = confirmOverlay.querySelector('#customConfirmBtn');
    const cancelBtn = confirmOverlay.querySelector('#customCancelBtn');
    
    const cleanup = () => {
        confirmOverlay.classList.remove('show');
        // MEMORY LEAK FIX: Use tracked timeout
        trackTimeout(() => {
            if (confirmOverlay.parentNode) {
                confirmOverlay.parentNode.removeChild(confirmOverlay);
            }
        }, 200);
    };
    
    confirmBtn.addEventListener('click', () => {
        cleanup();
        if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
        cleanup();
        if (onCancel) onCancel();
    });
    
    // Close on outside click
    confirmOverlay.addEventListener('click', (e) => {
        if (e.target === confirmOverlay) {
            cleanup();
            if (onCancel) onCancel();
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            cleanup();
            document.removeEventListener('keydown', escapeHandler);
            if (onCancel) onCancel();
        }
    };
    document.addEventListener('keydown', escapeHandler);
}

// NUCLEAR OPTION: Global reset function for stuck overlays
// This can be called manually or triggered by specific events
// REMOVED: navigateToApplicationCard() function - no longer needed since applications moved to jobs.html
// function navigateToApplicationCard(applicationId, jobId) {
    /*console.log(`🎯 Navigating to application: ${applicationId} in job: ${jobId}`);
    
    // 1. Switch to Applications tab
    const applicationsTab = document.querySelector('.tab-btn[data-tab="applications"]');
    console.log(`📱 Applications tab found:`, applicationsTab);
    console.log(`📱 Applications tab active:`, applicationsTab?.classList.contains('active'));
    
    if (applicationsTab && !applicationsTab.classList.contains('active')) {
        console.log(`🔄 Switching to applications tab...`);
        applicationsTab.click(); // This will load the applications content
        
        // 2. Wait for content to load, then find and expand the specific application
        setTimeout(() => {
            console.log(`🔍 Looking for job listing with data-job-id="${jobId}"`);
            
            // SCOPED SELECTOR: Only search within applications container for job listings
            const applicationsContainer = document.querySelector('#applications-content .applications-container');
            console.log(`📦 Applications container found:`, applicationsContainer);
            
            if (!applicationsContainer) {
                console.error(`❌ Applications container not found!`);
                return;
            }
            
            // Debug: Show all job listings in the applications container only
            const allJobListings = applicationsContainer.querySelectorAll('.job-listing[data-job-id]');
            console.log(`📊 Found ${allJobListings.length} job listings in applications container:`, 
                Array.from(allJobListings).map(el => el.getAttribute('data-job-id')));
            
            // Find the job listing that contains this application (scoped to applications container)
            const targetJobListing = applicationsContainer.querySelector(`.job-listing[data-job-id="${jobId}"]`);
            console.log(`🎯 Target job listing found:`, targetJobListing);
            
            if (targetJobListing) {
                console.log(`📂 Job listing found, checking if expanded...`);
                console.log(`📂 Is expanded:`, targetJobListing.classList.contains('expanded'));
                
                // Expand the job listing if not already expanded
                if (!targetJobListing.classList.contains('expanded')) {
                    console.log(`🔽 Manually expanding job listing...`);
                    
                    // First, close all other expanded listings (same as job click handler)
                    const allJobListings = document.querySelectorAll('.job-listing');
                    allJobListings.forEach(listing => {
                        const header = listing.querySelector('.job-header');
                        const listingJobId = header.getAttribute('data-job-id');
                        const applicationsList = document.getElementById('applications-' + listingJobId);
                        const expandIcon = header.querySelector('.expand-icon');
                        
                        if (listing.classList.contains('expanded')) {
                            listing.classList.remove('expanded');
                            if (applicationsList) {
                                applicationsList.style.display = 'none';
                            }
                            if (expandIcon) {
                                expandIcon.textContent = '▼';
                            }
                        }
                    });
                    
                    // Now expand the target listing (same logic as job click handler)
                    const applicationsList = document.getElementById('applications-' + jobId);
                    const expandIcon = targetJobListing.querySelector('.expand-icon');
                    
                    console.log(`📋 Applications list found:`, applicationsList);
                    console.log(`🔽 Expand icon found:`, expandIcon);
                    
                    if (applicationsList && expandIcon) {
                        targetJobListing.classList.add('expanded');
                        applicationsList.style.display = 'block';
                        expandIcon.textContent = '▲';
                        console.log(`✅ Job listing expanded successfully`);
                    } else {
                        console.warn(`⚠️ Could not expand - missing applicationsList or expandIcon`);
                    }
                } else {
                    console.log(`📂 Job listing already expanded`);
                }
                
                // Wait for expansion animation, then find specific application card
                setTimeout(() => {
                    console.log(`🔍 Looking for application card with data-application-id="${applicationId}"`);
                    
                    // SCOPED SELECTOR: Only search within applications container to avoid message threads
                    const applicationsContainer = document.querySelector('#applications-content .applications-container');
                    console.log(`📦 Applications container found:`, applicationsContainer);
                    
                    if (!applicationsContainer) {
                        console.error(`❌ Applications container not found!`);
                        return;
                    }
                    
                    // Debug: Show all application cards in the applications container only
                    const allApplicationCards = applicationsContainer.querySelectorAll('[data-application-id]');
                    console.log(`📊 Found ${allApplicationCards.length} application cards in applications container:`, 
                        Array.from(allApplicationCards).map(el => el.getAttribute('data-application-id')));
                    
                    const targetApplicationCard = applicationsContainer.querySelector(`[data-application-id="${applicationId}"]`);
                    
                    if (targetApplicationCard) {
                        console.log(`✨ Scrolling to and highlighting application card...`);
                        
                        // Scroll to the application card and center it
                        targetApplicationCard.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                        // Enhanced multi-stage highlight effect
                        setTimeout(() => {
                            // Stage 1: Initial pulse and glow
                            targetApplicationCard.style.transition = 'all 0.3s ease-in-out';
                            targetApplicationCard.style.boxShadow = '0 0 25px rgba(52, 152, 219, 0.8), 0 0 40px rgba(52, 152, 219, 0.4)';
                            targetApplicationCard.style.transform = 'scale(1.03)';
                            targetApplicationCard.style.borderRadius = '12px';
                            targetApplicationCard.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                            
                            // Stage 2: Secondary pulse
                            setTimeout(() => {
                                targetApplicationCard.style.transform = 'scale(1.01)';
                                targetApplicationCard.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.6), 0 0 30px rgba(52, 152, 219, 0.3)';
                            }, 300);
                            
                            // Stage 3: Gentle settle
                            setTimeout(() => {
                                targetApplicationCard.style.transform = 'scale(1.005)';
                                targetApplicationCard.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.4)';
                                targetApplicationCard.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
                            }, 600);
                            
                            // Stage 4: Final fade out
                            setTimeout(() => {
                                targetApplicationCard.style.transition = 'all 0.8s ease-out';
                                targetApplicationCard.style.boxShadow = '';
                                targetApplicationCard.style.transform = '';
                                targetApplicationCard.style.backgroundColor = '';
                                targetApplicationCard.style.borderRadius = '';
                                
                                // Clean up after animation
                                setTimeout(() => {
                                    targetApplicationCard.style.transition = '';
                                }, 800);
                            }, 2500);
                        }, 600); // Wait for scroll to complete
                        
                        console.log(`✅ Successfully navigated to application: ${applicationId}`);
                    } else {
                        console.warn(`⚠️ Application card not found: ${applicationId}`);
                        console.warn(`Available application IDs:`, 
                            Array.from(allApplicationCards).map(el => el.getAttribute('data-application-id')));
                    }
                }, 500); // Increased wait time for expansion
            } else {
                console.warn(`⚠️ Job listing not found: ${jobId}`);
                console.warn(`Available job IDs:`, 
                    Array.from(allJobListings).map(el => el.getAttribute('data-job-id')));
            }
        }, 300); // Increased wait time for tab content to load
    } else {
        console.log(`📱 Already on applications tab, searching directly...`);
        
        // Already on applications tab, just find the application with scoped selector
        const applicationsContainer = document.querySelector('#applications-content .applications-container');
        console.log(`📦 Applications container found for direct search:`, applicationsContainer);
        
        if (!applicationsContainer) {
            console.error(`❌ Applications container not found for direct search!`);
            return;
        }
        
        // Debug: Show all application cards in the applications container only
        const allApplicationCards = applicationsContainer.querySelectorAll('[data-application-id]');
        console.log(`📊 Found ${allApplicationCards.length} application cards in applications container (direct):`, 
            Array.from(allApplicationCards).map(el => el.getAttribute('data-application-id')));
        
        const targetApplicationCard = applicationsContainer.querySelector(`[data-application-id="${applicationId}"]`);
        console.log(`🎯 Target application card found directly:`, targetApplicationCard);
        
        if (targetApplicationCard) {
            // Enhanced scroll and highlight for direct navigation
            targetApplicationCard.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            
            // Same enhanced highlight effect as the full navigation
            setTimeout(() => {
                // Stage 1: Initial pulse and glow
                targetApplicationCard.style.transition = 'all 0.3s ease-in-out';
                targetApplicationCard.style.boxShadow = '0 0 25px rgba(52, 152, 219, 0.8), 0 0 40px rgba(52, 152, 219, 0.4)';
                targetApplicationCard.style.transform = 'scale(1.03)';
                targetApplicationCard.style.borderRadius = '12px';
                targetApplicationCard.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
                
                // Stage 2: Secondary pulse
                setTimeout(() => {
                    targetApplicationCard.style.transform = 'scale(1.01)';
                    targetApplicationCard.style.boxShadow = '0 0 20px rgba(52, 152, 219, 0.6), 0 0 30px rgba(52, 152, 219, 0.3)';
                }, 300);
                
                // Stage 3: Gentle settle
                setTimeout(() => {
                    targetApplicationCard.style.transform = 'scale(1.005)';
                    targetApplicationCard.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.4)';
                    targetApplicationCard.style.backgroundColor = 'rgba(52, 152, 219, 0.05)';
                }, 600);
                
                // Stage 4: Final fade out
                setTimeout(() => {
                    targetApplicationCard.style.transition = 'all 0.8s ease-out';
                    targetApplicationCard.style.boxShadow = '';
                    targetApplicationCard.style.transform = '';
                    targetApplicationCard.style.backgroundColor = '';
                    targetApplicationCard.style.borderRadius = '';
                    
                    // Clean up after animation
                    setTimeout(() => {
                        targetApplicationCard.style.transition = '';
                    }, 800);
                }, 2500);
            }, 300); // Shorter wait since no tab switching
            
            console.log(`✅ Scrolled to and highlighted application: ${applicationId}`);
        } else {
            console.warn(`⚠️ Application card not found: ${applicationId}`);
            const allCards = document.querySelectorAll('[data-application-id]');
            console.warn(`Available application IDs:`, 
                Array.from(allCards).map(el => el.getAttribute('data-application-id')));
        }
    }*/
// } // End of removed navigateToApplicationCard function

// NUCLEAR OPTION: Global reset function for stuck overlays
// This can be called manually or triggered by specific events
window.forceResetAvatarOverlay = function() {
    console.log('🚨 FORCE RESET: Cleaning up any stuck avatar overlays');
    
    // MEMORY LEAK FIX: Clean up all avatar listeners globally
    const allAvatars = document.querySelectorAll('.message-avatar[data-overlay-initialized="true"]');
    allAvatars.forEach(avatar => {
        const listeners = avatarListeners.get(avatar);
        if (listeners) {
            avatar.removeEventListener('click', listeners.click);
            avatar.removeEventListener('mouseenter', listeners.mouseenter);
            avatar.removeEventListener('mouseleave', listeners.mouseleave);
            avatarListeners.delete(avatar);
        }
        avatar.removeAttribute('data-overlay-initialized');
        avatar.style.cursor = '';
        avatar.style.transition = '';
        avatar.style.transform = '';
    });
    
    // Remove all possible overlays
    const overlays = document.querySelectorAll('#avatarOverlay, .avatar-overlay');
    overlays.forEach(overlay => {
        // MEMORY LEAK FIX: Abort action button listeners
        if (overlay._abortController) {
            overlay._abortController.abort();
            overlay._abortController = null;
        }
        
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    });
    
    // Reset all tracking variables
    window.avatarOverlayClickHandler = null;
    window.avatarOverlayListenerCount = 0;
    globalAvatarClickProcessing = false;
    
    // Remove all possible listeners (brute force)
    for (let i = 0; i < 10; i++) { // Remove up to 10 possible duplicate listeners
        document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, true);
        document.removeEventListener('click', hideAvatarOverlayOnOutsideClick, false);
    }
    
    console.log(`✅ Force reset completed - cleaned up ${allAvatars.length} avatar listeners and all overlays`);
};

// ===== PHOTO UPLOAD FUNCTIONALITY =====

/**
 * Process image for chat using dual-size optimization
 * Generates both thumbnail (100px) and full-size (720px) versions
 * @param {File} file - Image file to process
 * @param {Function} callback - Callback with processed image data
 */
function processChatImage(file, callback) {
    if (!file || !file.type.startsWith('image/')) {
        console.error('❌ Invalid file type for chat image');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            let thumbnailComplete = false;
            let fullSizeComplete = false;
            const result = {
                originalFile: file,
                dimensions: `${img.width}×${img.height}`,
                aspectRatio: img.width / img.height
            };

            // Generate thumbnail (100px max, 60% quality)
            createChatThumbnail(img, function(thumbnailDataURL) {
                result.thumbnailURL = thumbnailDataURL;
                result.thumbnailSize = Math.round(thumbnailDataURL.length * 0.75); // Approximate size in bytes
                thumbnailComplete = true;
                
                if (fullSizeComplete) {
                    callback(result);
                }
            });

            // Generate full-size (720px max, 75% quality)
            createCompressedChatImage(img, function(fullSizeDataURL) {
                result.fullSizeURL = fullSizeDataURL;
                result.fullSizeSize = Math.round(fullSizeDataURL.length * 0.75); // Approximate size in bytes
                fullSizeComplete = true;
                
                if (thumbnailComplete) {
                    callback(result);
                }
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * Create compressed chat image (max 720px width, 75% quality)
 * Based on new-post.js compression standards
 * @param {Image} img - Source image
 * @param {Function} callback - Callback with compressed data URL
 */
function createCompressedChatImage(img, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions (max 720px width, maintain aspect ratio)
    const maxWidth = 720;
    let newWidth = img.width;
    let newHeight = img.height;
    
    if (img.width > maxWidth) {
        const scale = maxWidth / img.width;
        newWidth = maxWidth;
        newHeight = Math.round(img.height * scale);
    }
    
    // Set canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Draw the resized image (maintain original aspect ratio)
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Convert to data URL with 75% quality (same as new-post.js)
    const compressedDataURL = canvas.toDataURL('image/jpeg', 0.75);
    callback(compressedDataURL);
}

/**
 * Create thumbnail for chat display (100px max dimension, 60% quality)
 * Optimized for fast loading and bandwidth efficiency
 * @param {Image} img - Source image
 * @param {Function} callback - Callback with thumbnail data URL
 */
function createChatThumbnail(img, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions (100px max dimension, maintain aspect ratio)
    const maxSize = 100;
    let newWidth = img.width;
    let newHeight = img.height;
    
    // Scale to fit within 100px while maintaining aspect ratio
    if (newWidth > newHeight) {
        if (newWidth > maxSize) {
            newHeight = Math.round((newHeight * maxSize) / newWidth);
            newWidth = maxSize;
        }
    } else {
        if (newHeight > maxSize) {
            newWidth = Math.round((newWidth * maxSize) / newHeight);
            newHeight = maxSize;
        }
    }
    
    // Set canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Draw the resized image
    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
    // Convert to data URL with 60% quality (higher compression for thumbnails)
    const thumbnailDataURL = canvas.toDataURL('image/jpeg', 0.6);
    callback(thumbnailDataURL);
}

/**
 * Collect all photos from current chat thread for gallery navigation
 * @param {string} currentImageUrl - Currently displayed image URL
 * @returns {Object} Gallery data with photos array and current index
 */
function collectChatThreadPhotos(currentImageUrl) {
    // Find the currently open chat modal
    const chatModal = document.querySelector('.chat-modal-overlay');
    if (!chatModal) {
        return { photos: [currentImageUrl], currentIndex: 0 };
    }

    // Get all photo thumbnails from the current chat thread
    const photoElements = chatModal.querySelectorAll('.message-photo img.photo-thumbnail');
    const photos = [];
    let currentIndex = 0;

    photoElements.forEach((img, index) => {
        const fullSizeUrl = img.getAttribute('data-full-size') || img.src;
        photos.push({
            thumbnailUrl: img.src,
            fullSizeUrl: fullSizeUrl,
            element: img
        });

        // Find current photo index
        if (fullSizeUrl === currentImageUrl) {
            currentIndex = index;
        }
    });

    // Fallback if no photos found or current not in collection
    if (photos.length === 0) {
        photos.push({
            thumbnailUrl: currentImageUrl,
            fullSizeUrl: currentImageUrl,
            element: null
        });
    }

    return { photos, currentIndex };
}

/**
 * Show photo lightbox with gallery navigation
 * @param {string} imageUrl - URL of the image to display
 */
function showPhotoLightbox(imageUrl) {
    // Remove existing lightbox if any
    const existingLightbox = document.querySelector('.photo-lightbox-overlay');
    if (existingLightbox) {
        existingLightbox.remove();
    }

    // Collect photos from current chat thread
    const gallery = collectChatThreadPhotos(imageUrl);
    const hasMultiplePhotos = gallery.photos.length > 1;
    

    // Create lightbox overlay with gallery support
    const lightboxOverlay = document.createElement('div');
    lightboxOverlay.className = 'photo-lightbox-overlay';
    lightboxOverlay.setAttribute('data-current-index', gallery.currentIndex);
    
    // Only create arrows if there are multiple photos
    const arrowsHTML = hasMultiplePhotos ? `
        <button class="nav-arrow nav-prev" type="button">‹</button>
        <button class="nav-arrow nav-next" type="button">›</button>
    ` : '';
    
    lightboxOverlay.innerHTML = `
        <div class="photo-lightbox">
            <img src="${imageUrl}" alt="Full size photo" class="lightbox-image">
            <button class="close-lightbox" type="button">×</button>
            ${arrowsHTML}
        </div>
    `;

    // Store gallery data on the overlay
    lightboxOverlay._gallery = gallery;

    // Add to body
    document.body.appendChild(lightboxOverlay);

    // Initialize gallery functionality if multiple photos
    if (hasMultiplePhotos) {
        initializePhotoGallery(lightboxOverlay);
    } else {
        // Add vertical swipe to close for single photos
        initializeSinglePhotoGestures(lightboxOverlay);
    }

    // Show with animation
    setTimeout(() => {
        lightboxOverlay.classList.add('show');
    }, 10);

    // Close handlers
    const closeBtn = lightboxOverlay.querySelector('.close-lightbox');
    const closeLightbox = () => {
        // Call cleanup function if it exists
        if (lightboxOverlay._cleanup) {
            lightboxOverlay._cleanup();
        }
        
        lightboxOverlay.classList.remove('show');
        setTimeout(() => {
            if (lightboxOverlay.parentNode) {
                lightboxOverlay.remove();
            }
        }, 300);
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) {
            closeLightbox();
        }
    });

    // ESC key to close
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            closeLightbox();
            document.removeEventListener('keydown', handleEscKey);
        }
    };
    document.addEventListener('keydown', handleEscKey);
}

/**
 * Update arrow visibility based on current position in gallery
 * @param {number} currentIndex - Current photo index
 * @param {number} totalPhotos - Total number of photos
 * @param {HTMLElement} prevBtn - Previous button element
 * @param {HTMLElement} nextBtn - Next button element
 */
function updateArrowVisibility(currentIndex, totalPhotos, prevBtn, nextBtn) {
    // Previous arrow: show if not at first photo
    if (currentIndex > 0) {
        prevBtn.style.display = 'flex';
        prevBtn.style.opacity = '0.2';
    } else {
        prevBtn.style.display = 'none';
    }
    
    // Next arrow: show if not at last photo
    if (currentIndex < totalPhotos - 1) {
        nextBtn.style.display = 'flex';
        nextBtn.style.opacity = '0.2';
    } else {
        nextBtn.style.display = 'none';
    }
}

/**
 * Initialize photo gallery functionality with swipe gestures and navigation
 * @param {HTMLElement} lightboxOverlay - The lightbox overlay element
 */
function initializePhotoGallery(lightboxOverlay) {
    const gallery = lightboxOverlay._gallery;
    const lightboxImage = lightboxOverlay.querySelector('.lightbox-image');
    const prevBtn = lightboxOverlay.querySelector('.nav-prev');
    const nextBtn = lightboxOverlay.querySelector('.nav-next');
    
    // Safety check - if no buttons exist, don't initialize gallery
    if (!prevBtn || !nextBtn) {
        console.log('📸 No navigation buttons found - skipping gallery initialization');
        return;
    }
    
    let currentIndex = parseInt(lightboxOverlay.getAttribute('data-current-index'));

    /**
     * Navigate to specific photo index
     * @param {number} newIndex - Target photo index
     */
    const navigateToPhoto = (newIndex) => {
        if (newIndex < 0 || newIndex >= gallery.photos.length) return;
        
        const photo = gallery.photos[newIndex];
        
        // Add transition effect
        lightboxImage.style.opacity = '0.7';
        lightboxImage.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            lightboxImage.src = photo.fullSizeUrl;
            currentIndex = newIndex;
            lightboxOverlay.setAttribute('data-current-index', currentIndex);
            
            // Reset transition
            lightboxImage.style.opacity = '1';
            lightboxImage.style.transform = 'scale(1)';
            
            // Update navigation button visibility and states
            updateArrowVisibility(currentIndex, gallery.photos.length, prevBtn, nextBtn);
        }, 150);
    };

    // Navigation button handlers
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            navigateToPhoto(currentIndex - 1);
        }
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (currentIndex < gallery.photos.length - 1) {
            navigateToPhoto(currentIndex + 1);
        }
    });

    // Keyboard navigation
    const handleGalleryKeys = (e) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            navigateToPhoto(currentIndex - 1);
        } else if (e.key === 'ArrowRight' && currentIndex < gallery.photos.length - 1) {
            e.preventDefault();
            navigateToPhoto(currentIndex + 1);
        }
    };
    document.addEventListener('keydown', handleGalleryKeys);

    // Touch/Swipe gesture support
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isDragging = false;
    let hasMoved = false;

    const handleTouchStart = (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchEndX = touchStartX; // Initialize end positions
        touchEndY = touchStartY;
        isDragging = true;
        hasMoved = false;
        
        // Add visual feedback
        lightboxImage.style.transition = 'none';
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        
        touchEndX = e.touches[0].clientX;
        touchEndY = e.touches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Mark that user has moved their finger (10px threshold)
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            hasMoved = true;
        }
        
        // Only handle horizontal swipes (ignore vertical scrolling)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
            e.preventDefault();
            
            // Visual drag feedback
            const dragAmount = Math.min(Math.abs(deltaX) / 3, 50);
            const opacity = Math.max(0.7, 1 - dragAmount / 100);
            lightboxImage.style.transform = `translateX(${deltaX / 3}px) scale(${0.95 + (opacity - 0.7) * 0.17})`;
            lightboxImage.style.opacity = opacity;
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Reset visual state
        lightboxImage.style.transition = 'all 0.3s ease';
        lightboxImage.style.transform = 'translateX(0) scale(1)';
        lightboxImage.style.opacity = '1';
        
        // Only process gestures if user actually moved their finger
        if (hasMoved) {
            // Determine swipe direction (minimum 50px swipe distance)
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
                // Horizontal swipe - navigate photos
                if (deltaX > 0 && currentIndex > 0) {
                    // Swipe right - go to previous photo
                    navigateToPhoto(currentIndex - 1);
                } else if (deltaX < 0 && currentIndex < gallery.photos.length - 1) {
                    // Swipe left - go to next photo
                    navigateToPhoto(currentIndex + 1);
                }
            } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 80) {
                // Vertical swipe - close lightbox (80px minimum for intentional gesture)
                console.log('📸 Vertical swipe detected - closing lightbox');
                
                // Find and trigger close function
                const closeBtn = lightboxOverlay.querySelector('.close-lightbox');
                if (closeBtn) {
                    closeBtn.click();
                }
            }
        }
        
        // Reset touch coordinates
        touchStartX = touchStartY = touchEndX = touchEndY = 0;
        hasMoved = false;
    };

    // Add touch event listeners to the lightbox image
    lightboxImage.addEventListener('touchstart', handleTouchStart, { passive: false });
    lightboxImage.addEventListener('touchmove', handleTouchMove, { passive: false });
    lightboxImage.addEventListener('touchend', handleTouchEnd);

    // Initialize button visibility and states
    updateArrowVisibility(currentIndex, gallery.photos.length, prevBtn, nextBtn);
    
    // Cleanup function (called when lightbox closes)
    lightboxOverlay._cleanup = () => {
        document.removeEventListener('keydown', handleGalleryKeys);
        lightboxImage.removeEventListener('touchstart', handleTouchStart);
        lightboxImage.removeEventListener('touchmove', handleTouchMove);
        lightboxImage.removeEventListener('touchend', handleTouchEnd);
    };
    
    console.log(`📸 Photo gallery initialized: ${gallery.photos.length} photos, starting at ${currentIndex + 1}`);
}

/**
 * Initialize vertical swipe gestures for single photos
 * @param {HTMLElement} lightboxOverlay - The lightbox overlay element
 */
function initializeSinglePhotoGestures(lightboxOverlay) {
    const lightboxImage = lightboxOverlay.querySelector('.lightbox-image');
    
    let touchStartY = 0;
    let touchEndY = 0;
    let isDragging = false;
    let hasMoved = false;

    const handleTouchStart = (e) => {
        touchStartY = e.touches[0].clientY;
        touchEndY = touchStartY; // Initialize end position
        isDragging = true;
        hasMoved = false;
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        touchEndY = e.touches[0].clientY;
        
        // Mark that user has moved their finger
        const deltaY = Math.abs(touchEndY - touchStartY);
        if (deltaY > 10) { // 10px threshold to detect actual movement
            hasMoved = true;
        }
    };

    const handleTouchEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const deltaY = touchEndY - touchStartY;
        
        // Only close if user actually moved their finger AND it's a significant swipe
        if (hasMoved && Math.abs(deltaY) > 80) {
            console.log('📸 Vertical swipe detected on single photo - closing lightbox');
            
            const closeBtn = lightboxOverlay.querySelector('.close-lightbox');
            if (closeBtn) {
                closeBtn.click();
            }
        }
        
        // Reset coordinates
        touchStartY = touchEndY = 0;
        hasMoved = false;
    };

    // Add touch event listeners
    lightboxImage.addEventListener('touchstart', handleTouchStart, { passive: true });
    lightboxImage.addEventListener('touchmove', handleTouchMove, { passive: true });
    lightboxImage.addEventListener('touchend', handleTouchEnd);

    // Cleanup function
    lightboxOverlay._cleanup = () => {
        lightboxImage.removeEventListener('touchstart', handleTouchStart);
        lightboxImage.removeEventListener('touchmove', handleTouchMove);
        lightboxImage.removeEventListener('touchend', handleTouchEnd);
    };
    
    console.log('📸 Single photo gestures initialized');
}


/**
 * Create photo message HTML with thumbnail optimization
 * @param {string} thumbnailUrl - URL of the thumbnail for chat display
 * @param {string} fullSizeUrl - URL of the full-size image for lightbox
 * @param {string} direction - 'incoming' or 'outgoing'
 * @param {string} senderName - Name of the sender
 * @param {string} avatar - Avatar URL
 * @returns {string} HTML string for photo message
 */
function createPhotoMessageHTML(thumbnailUrl, fullSizeUrl, direction, senderName, avatar) {
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    return `
        <div class="message-card ${direction}">
            <div class="message-header">
                ${direction === 'outgoing' ? `
                    <div class="message-avatar">
                        <img src="${avatar}" alt="${senderName}" onerror="this.src='public/images/logo.png'">
                    </div>
                    <div class="message-info">
                        <div class="message-sender">${senderName}</div>
                        <div class="message-timestamp">${timestamp}</div>
                    </div>
                ` : `
                    <div class="message-info">
                        <div class="message-sender">${senderName}</div>
                        <div class="message-timestamp">${timestamp}</div>
                    </div>
                    <div class="message-avatar">
                        <img src="${avatar}" alt="${senderName}" onerror="this.src='public/images/logo.png'">
                    </div>
                `}
            </div>
            <div class="message-photo" onclick="showPhotoLightbox('${fullSizeUrl}')">
                <img src="${thumbnailUrl}" alt="Shared photo" class="photo-thumbnail" data-full-size="${fullSizeUrl}">
            </div>
        </div>
    `;
}

// ===== MOCK MESSAGE DATA FOR ADMIN COMMUNICATIONS =====

const MOCK_ADMIN_MESSAGES = {
    customer: [
        {
            id: 'msg_cust_001',
            topic: 'support',
            subject: 'Account Verification Complete',
            excerpt: 'Your GISUGO account has been successfully verified. You can now post jobs and hire workers.',
            content: `Dear Valued Customer,

We're pleased to inform you that your GISUGO account verification has been completed successfully! 

Your account is now fully activated and you have access to all customer features:
• Post unlimited job listings
• Browse verified worker profiles
• Use our secure G-Coins payment system
• Access 24/7 customer support

Welcome to the GISUGO community! We're excited to help you find the perfect workers for your needs.

Best regards,
The GISUGO Team`,
            sender: {
                name: 'GISUGO Support',
                email: 'support@gisugo.com',
                avatar: 'public/users/User-02.jpg'
            },
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isRead: false,
            hasAttachment: false
        },
        {
            id: 'msg_cust_002',
            topic: 'support',
            subject: 'G-Coins Wallet Issue Resolution',
            excerpt: 'We have resolved the wallet connectivity issue you reported. Your G-Coins balance is now accessible.',
            content: `Dear Customer,

Thank you for reporting the G-Coins wallet connectivity issue. Our technical team has successfully resolved the problem.

ISSUE RESOLVED:
The temporary server maintenance that was causing wallet timeouts has been completed. All G-Coins transactions are now processing normally.

YOUR ACCOUNT STATUS:
• Current G-Coins Balance: ₱2,450 (confirmed secure)
• All pending transactions have been processed
• Wallet access fully restored

We apologize for any inconvenience this may have caused. As compensation for the disruption, we've added a 5% bonus (₱122.50) to your wallet.

If you experience any further issues, please don't hesitate to contact us.

Best regards,
GISUGO Technical Support Team
support@gisugo.com`,
            sender: {
                name: 'GISUGO Technical Support',
                email: 'tech-support@gisugo.com', 
                avatar: 'public/users/User-03.jpg'
            },
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
            isRead: false,
            hasAttachment: true,
            attachmentName: 'wallet-resolution-receipt.pdf'
        },
        {
            id: 'msg_cust_003',
            topic: 'system',
            subject: 'Platform Maintenance Scheduled',
            excerpt: 'GISUGO will undergo scheduled maintenance on Sunday, October 22nd from 2:00 AM to 4:00 AM.',
            content: `Dear GISUGO Users,

We will be performing scheduled system maintenance to improve our platform performance and security.

MAINTENANCE DETAILS:
• Date: Sunday, October 22nd, 2025
• Time: 2:00 AM - 4:00 AM (Philippine Time)
• Duration: Approximately 2 hours

SERVICES AFFECTED:
• Job posting and applications (temporarily unavailable)
• G-Coins transactions (delayed processing)
• Message notifications (may be delayed)

SERVICES AVAILABLE:
• Browsing job listings
• Viewing profiles
• Accessing existing conversations

We recommend completing any urgent transactions before the maintenance window. All services will be fully restored by 4:00 AM.

Thank you for your patience and understanding.

GISUGO Operations Team`,
            sender: {
                name: 'GISUGO Operations',
                email: 'operations@gisugo.com',
                avatar: 'public/users/User-04.jpg'
            },
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_cust_004',
            topic: 'system',
            subject: 'New Security Features Available',
            excerpt: 'Enhanced security features including two-factor authentication are now available for your account.',
            content: `Dear Customer,

We're excited to announce new security features to better protect your GISUGO account:

NEW SECURITY FEATURES:
✓ Two-Factor Authentication (2FA)
✓ Login notifications via SMS/email
✓ Enhanced password requirements
✓ Account activity monitoring

RECOMMENDED ACTIONS:
1. Enable 2FA in your account settings
2. Update your password if it's over 6 months old
3. Review your account activity regularly
4. Add a backup email address

These features are optional but highly recommended for maximum account security.

To enable these features, go to Settings > Security in your account dashboard.

Stay secure,
GISUGO Security Team`,
            sender: {
                name: 'GISUGO Security',
                email: 'security@gisugo.com',
                avatar: 'public/users/User-05.jpg'
            },
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_cust_005',
            topic: 'notifications',
            subject: 'Important: Updated Terms of Service',
            excerpt: 'Please review our updated Terms of Service, effective November 1st, 2025.',
            content: `Important Notice: Updated Terms of Service

Dear GISUGO Customer,

We are updating our Terms of Service to better serve you and comply with new regulations. The updated terms will take effect on November 1st, 2025.

KEY CHANGES:
• Enhanced user privacy protections
• Clearer dispute resolution procedures  
• Updated payment processing terms
• Improved worker verification standards

WHAT YOU NEED TO DO:
Please review the updated Terms of Service in your account dashboard. Continued use of GISUGO after November 1st constitutes acceptance of the new terms.

QUESTIONS?
If you have any questions about these changes, please contact our legal team at legal@gisugo.com or visit our FAQ section.

The updated terms are designed to provide better protection for both customers and workers while maintaining the quality service you expect from GISUGO.

Thank you for your attention to this important matter.

GISUGO Legal Team
legal@gisugo.com`,
            sender: {
                name: 'GISUGO Legal Team',
                email: 'legal@gisugo.com',
                avatar: 'public/users/User-06.jpg'
            },
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            isRead: false,
            hasAttachment: true,
            attachmentName: 'updated-terms-of-service.pdf'
        },
        {
            id: 'msg_cust_006',
            topic: 'notifications',
            subject: 'Holiday Schedule Notice',
            excerpt: 'GISUGO support hours during the upcoming holidays and emergency contact information.',
            content: `Holiday Schedule and Support Information

Dear Valued Customer,

Please note our modified support schedule during the upcoming holiday period:

HOLIDAY DATES:
• October 31st - November 2nd, 2025

MODIFIED SUPPORT HOURS:
• October 31st: 9:00 AM - 5:00 PM
• November 1st: CLOSED (All Saints' Day)
• November 2nd: 10:00 AM - 6:00 PM

EMERGENCY SUPPORT:
For urgent issues during holidays, use our emergency hotline: +63-917-GISUGO-1 (available 24/7)

PLATFORM AVAILABILITY:
All GISUGO services remain fully operational during holidays. Only customer support hours are modified.

We wish you and your family a safe and happy holiday season!

GISUGO Customer Care Team`,
            sender: {
                name: 'GISUGO Customer Care',
                email: 'care@gisugo.com',
                avatar: 'public/users/User-07.jpg'
            },
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_cust_007',
            topic: 'updates',
            subject: 'New Feature: Advanced Job Matching',
            excerpt: 'Introducing AI-powered job matching to help you find the perfect workers faster.',
            content: `Exciting News: Advanced Job Matching is Here!

Dear Customer,

We're thrilled to introduce our new AI-powered job matching feature that will revolutionize how you find workers on GISUGO!

NEW FEATURES:
🤖 AI-Powered Matching: Our algorithm analyzes job requirements and worker skills for perfect matches
📊 Compatibility Scores: See percentage match ratings for each worker
⚡ Instant Recommendations: Get worker suggestions as soon as you post a job
🎯 Smart Filters: Advanced filtering based on experience, ratings, and availability

HOW IT WORKS:
1. Post your job with detailed requirements
2. Our AI analyzes your needs
3. Receive ranked worker recommendations
4. Review compatibility scores and profiles
5. Contact top matches directly

BENEFITS FOR YOU:
• 60% faster hiring process
• Higher quality matches
• Reduced time screening candidates
• Better project outcomes

The feature is automatically enabled for all job postings. Try it out with your next job post!

Happy hiring,
GISUGO Product Team`,
            sender: {
                name: 'GISUGO Product Team',
                email: 'product@gisugo.com',
                avatar: 'public/users/User-08.jpg'
            },
            timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            isRead: false,
            hasAttachment: false
        },
        {
            id: 'msg_cust_008',
            topic: 'updates',
            subject: 'Mobile App Update Available',
            excerpt: 'Version 3.2.0 of the GISUGO mobile app is now available with improved messaging and notifications.',
            content: `GISUGO Mobile App Update - Version 3.2.0

Dear Customer,

A new version of the GISUGO mobile app is now available for download!

NEW IN VERSION 3.2.0:
📱 Improved messaging interface
🔔 Enhanced push notifications
📷 Better photo upload quality
🔍 Faster search functionality
🛡️ Enhanced security features

BUG FIXES:
• Fixed occasional app crashes during photo uploads
• Resolved notification delay issues
• Improved app performance on older devices
• Fixed GPS location accuracy

DOWNLOAD NOW:
• iOS: Available on the App Store
• Android: Available on Google Play Store

The update is recommended for all users to ensure the best GISUGO experience.

UPDATE INSTRUCTIONS:
1. Open your device's app store
2. Search for "GISUGO"
3. Tap "Update" if available
4. Restart the app after installation

Thank you for keeping your app updated!

GISUGO Mobile Team`,
            sender: {
                name: 'GISUGO Mobile Team',
                email: 'mobile@gisugo.com',
                avatar: 'public/users/User-09.jpg'
            },
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_cust_009',
            topic: 'promotions',
            subject: 'Limited Time: 20% Bonus on G-Coins Purchase',
            excerpt: 'Get 20% extra G-Coins when you top up ₱500 or more. Offer valid until October 31st.',
            content: `🎉 Special Promotion: 20% Bonus G-Coins!

Dear Valued Customer,

For a limited time, get 20% extra G-Coins when you top up your wallet!

PROMOTION DETAILS:
💰 Minimum purchase: ₱500
🎁 Bonus: 20% extra G-Coins
⏰ Valid until: October 31st, 2025
🎯 Maximum bonus: ₱1,000 extra G-Coins

EXAMPLES:
• Top up ₱500 → Get ₱600 G-Coins (₱100 bonus)
• Top up ₱1,000 → Get ₱1,200 G-Coins (₱200 bonus)
• Top up ₱2,500 → Get ₱3,000 G-Coins (₱500 bonus)

HOW TO CLAIM:
1. Go to your G-Coins wallet
2. Select "Top Up"
3. Choose ₱500 or higher amount
4. Complete payment
5. Bonus G-Coins added automatically!

This is perfect timing to stock up for your upcoming projects. More G-Coins means more flexibility in hiring the best workers!

Don't miss out - offer ends October 31st!

GISUGO Promotions Team`,
            sender: {
                name: 'GISUGO Promotions',
                email: 'promotions@gisugo.com',
                avatar: 'public/users/User-10.jpg'
            },
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: false,
            hasAttachment: false
        },
        {
            id: 'msg_cust_010',
            topic: 'promotions',
            subject: 'Refer Friends and Earn G-Coins',
            excerpt: 'Invite friends to GISUGO and earn ₱100 G-Coins for each successful referral.',
            content: `💸 Earn G-Coins by Referring Friends!

Dear Customer,

Share the GISUGO experience with friends and family while earning G-Coins!

REFERRAL PROGRAM:
🎁 Earn ₱100 G-Coins per successful referral
👥 No limit on referrals
⚡ G-Coins credited within 24 hours
🏆 Bonus rewards for top referrers

HOW IT WORKS:
1. Share your unique referral code: CUST-REF-2025
2. Friends sign up using your code
3. They complete their first job transaction
4. You both earn ₱100 G-Coins!

YOUR FRIEND GETS:
• ₱100 welcome G-Coins
• Priority customer support for 30 days
• Access to exclusive new user promotions

SHARE YOUR CODE:
Use your referral code CUST-REF-2025 or share this link:
https://gisugo.com/signup?ref=CUST-REF-2025

LEADERBOARD PRIZES:
Top 3 referrers each month win:
🥇 1st place: ₱5,000 G-Coins
🥈 2nd place: ₱3,000 G-Coins  
🥉 3rd place: ₱2,000 G-Coins

Start referring today and watch your G-Coins grow!

GISUGO Referral Team`,
            sender: {
                name: 'GISUGO Referral Team',
                email: 'referrals@gisugo.com',
                avatar: 'public/users/User-11.jpg'
            },
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
            isRead: true,
            hasAttachment: false
        }
    ],
    worker: [
        {
            id: 'msg_work_001',
            topic: 'support',
            subject: 'Profile Verification Approved',
            excerpt: 'Congratulations! Your worker profile has been verified and you can now accept job applications.',
            content: `Congratulations! Profile Verification Complete

Dear Worker,

We're excited to inform you that your GISUGO worker profile has been successfully verified!

VERIFICATION COMPLETED:
✅ Identity verification
✅ Skills assessment
✅ Background check
✅ Portfolio review

YOU CAN NOW:
• Accept job applications from customers
• Set your own rates and availability
• Receive direct messages from potential clients
• Access premium worker features

NEXT STEPS:
1. Complete your profile with recent work samples
2. Set your availability calendar
3. Upload additional skill certifications
4. Start browsing and applying for jobs!

Your verified badge will appear on your profile within 24 hours, making you more attractive to potential customers.

Welcome to the verified GISUGO worker community!

Best regards,
GISUGO Verification Team`,
            sender: {
                name: 'GISUGO Verification Team',
                email: 'verification@gisugo.com',
                avatar: 'public/users/User-02.jpg'
            },
            timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            isRead: false,
            hasAttachment: true,
            attachmentName: 'verification-certificate.pdf'
        },
        {
            id: 'msg_work_002',
            topic: 'support',
            subject: 'Payment Issue Resolved',
            excerpt: 'The delayed payment for Job #JOB-2025-1234 has been processed and credited to your account.',
            content: `Payment Issue Resolution - Job #JOB-2025-1234

Dear Worker,

We have successfully resolved the payment delay issue for your completed job.

JOB DETAILS:
• Job ID: JOB-2025-1234
• Customer: Maria Santos
• Service: House Cleaning (3-bedroom)
• Amount: ₱800 G-Coins

ISSUE RESOLVED:
The payment delay was caused by a temporary system glitch during our recent maintenance. The issue has been fixed and your payment has been processed.

PAYMENT STATUS:
✅ ₱800 G-Coins credited to your wallet
✅ Transaction completed successfully
✅ Customer rating and review recorded

We sincerely apologize for the inconvenience. As compensation for the delay, we've added a ₱50 bonus to your account.

If you experience any future payment issues, please contact us immediately at payments@gisugo.com.

Thank you for your patience and continued service excellence.

GISUGO Payments Team`,
            sender: {
                name: 'GISUGO Payments Team',
                email: 'payments@gisugo.com',
                avatar: 'public/users/User-03.jpg'
            },
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            isRead: false,
            hasAttachment: true,
            attachmentName: 'payment-receipt-JOB-2025-1234.pdf'
        },
        {
            id: 'msg_work_003',
            topic: 'system',
            subject: 'New Worker Safety Guidelines',
            excerpt: 'Updated safety protocols and guidelines for all GISUGO workers, effective immediately.',
            content: `Important: Updated Worker Safety Guidelines

Dear GISUGO Worker,

Your safety is our top priority. Please review these updated safety guidelines that are now in effect.

NEW SAFETY PROTOCOLS:

🏠 ON-SITE SAFETY:
• Always verify customer identity before starting work
• Take photos of work area before and after
• Report any unsafe working conditions immediately
• Keep emergency contact information accessible

💬 COMMUNICATION SAFETY:
• Use GISUGO messaging for all job-related communication
• Never share personal contact information
• Report inappropriate customer behavior
• Document all agreements in writing

💰 PAYMENT SAFETY:
• Only accept payments through G-Coins system
• Never accept cash or external payments
• Report payment pressure or unusual requests
• Verify job completion before leaving site

🚨 EMERGENCY PROCEDURES:
• Emergency hotline: +63-917-GISUGO-911
• Local emergency: 911 or 117
• GISUGO safety team: safety@gisugo.com

MANDATORY TRAINING:
All workers must complete the updated safety training module in their dashboard within 7 days.

Your safety enables you to provide excellent service. Thank you for following these guidelines.

GISUGO Safety Team`,
            sender: {
                name: 'GISUGO Safety Team',
                email: 'safety@gisugo.com',
                avatar: 'public/users/User-04.jpg'
            },
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isRead: true,
            hasAttachment: true,
            attachmentName: 'worker-safety-guidelines-2025.pdf'
        },
        {
            id: 'msg_work_004',
            topic: 'system',
            subject: 'Worker App Performance Improvements',
            excerpt: 'Recent updates to improve app performance and reduce job notification delays.',
            content: `Worker App Performance Update

Dear Worker,

We've implemented several improvements to enhance your GISUGO app experience:

PERFORMANCE IMPROVEMENTS:
⚡ 40% faster job loading times
📱 Reduced app memory usage
🔔 Improved notification reliability
📷 Better photo upload speeds
🗺️ More accurate GPS location tracking

NOTIFICATION ENHANCEMENTS:
• Instant job alerts (previously up to 5 minutes delay)
• Priority notifications for high-paying jobs
• Custom notification sounds for different job types
• Offline notification queuing

BUG FIXES:
• Fixed app crashes during photo uploads
• Resolved GPS accuracy issues
• Fixed calendar sync problems
• Improved chat message delivery

WHAT YOU'LL NOTICE:
• Faster response times when browsing jobs
• More reliable job notifications
• Smoother photo and document uploads
• Better overall app stability

These improvements are automatically applied - no action needed from you. If you experience any issues, please report them through the app's feedback feature.

Thank you for your patience as we continue improving your GISUGO experience!

GISUGO Technical Team`,
            sender: {
                name: 'GISUGO Technical Team',
                email: 'tech@gisugo.com',
                avatar: 'public/users/User-05.jpg'
            },
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_work_005',
            topic: 'notifications',
            subject: 'Tax Information for 2025',
            excerpt: 'Important tax information for GISUGO workers and year-end documentation requirements.',
            content: `Important: 2025 Tax Information for Workers

Dear GISUGO Worker,

As we approach the end of 2025, here's important tax information for your GISUGO earnings:

TAX DOCUMENTATION:
📄 BIR Form 2307 (Certificate of Creditable Tax Withheld at Source)
📊 Annual earnings summary
📋 Monthly transaction reports
🧾 Detailed payment receipts

WHAT GISUGO PROVIDES:
• Comprehensive earnings report for 2025
• Tax withholding certificates (if applicable)
• Monthly transaction summaries
• Support for tax filing questions

TAX OBLIGATIONS:
As an independent contractor, you are responsible for:
• Declaring GISUGO earnings in your tax return
• Paying appropriate income taxes
• Keeping records of business expenses
• Consulting with a tax professional if needed

ACCESSING YOUR TAX DOCUMENTS:
1. Go to your Worker Dashboard
2. Click "Financial Reports"
3. Select "Tax Documents"
4. Download your 2025 earnings summary

IMPORTANT DATES:
• December 31, 2025: Tax year ends
• January 15, 2026: Tax documents available
• April 15, 2026: Tax filing deadline

For tax-related questions, contact our finance team at finance@gisugo.com.

GISUGO Finance Team`,
            sender: {
                name: 'GISUGO Finance Team',
                email: 'finance@gisugo.com',
                avatar: 'public/users/User-06.jpg'
            },
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
            isRead: false,
            hasAttachment: true,
            attachmentName: 'worker-tax-guide-2025.pdf'
        },
        {
            id: 'msg_work_006',
            topic: 'notifications',
            subject: 'Worker Recognition Program Launch',
            excerpt: 'Introducing the GISUGO Excellence Awards - monthly recognition and rewards for top-performing workers.',
            content: `🏆 Introducing GISUGO Excellence Awards!

Dear Outstanding Worker,

We're launching a new program to recognize and reward exceptional workers like you!

MONTHLY AWARDS CATEGORIES:

🌟 Customer Favorite Award
• Highest customer ratings (minimum 10 jobs)
• Prize: ₱2,000 G-Coins + Featured profile

⚡ Speed Demon Award  
• Fastest job completion times
• Prize: ₱1,500 G-Coins + Priority job alerts

💎 Quality Champion Award
• Highest quality work ratings
• Prize: ₱2,500 G-Coins + Verified Pro badge

🤝 Reliability Star Award
• Perfect attendance and punctuality
• Prize: ₱1,000 G-Coins + Reliability badge

📈 Growth Leader Award
• Most improved worker of the month
• Prize: ₱1,500 G-Coins + Mentorship opportunity

ANNUAL GRAND PRIZES:
🥇 Worker of the Year: ₱25,000 G-Coins
🥈 Runner-up: ₱15,000 G-Coins
🥉 Third Place: ₱10,000 G-Coins

HOW TO PARTICIPATE:
Simply continue providing excellent service! All active workers are automatically eligible.

Winners announced monthly via email and featured on our social media channels.

Keep up the excellent work - you could be our next award winner!

GISUGO Recognition Team`,
            sender: {
                name: 'GISUGO Recognition Team',
                email: 'recognition@gisugo.com',
                avatar: 'public/users/User-07.jpg'
            },
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_work_007',
            topic: 'updates',
            subject: 'New Skill Categories Available',
            excerpt: 'Expand your opportunities with newly added skill categories: Tech Support, Event Planning, and Pet Training.',
            content: `🚀 New Skill Categories Now Available!

Dear Worker,

Exciting news! We've added new skill categories to help you expand your service offerings and reach more customers.

NEW CATEGORIES:

💻 TECH SUPPORT
• Computer troubleshooting
• Software installation
• Network setup
• Device repair
• Data recovery

🎉 EVENT PLANNING
• Party organization
• Wedding coordination
• Corporate events
• Catering coordination
• Venue decoration

🐕 PET TRAINING
• Dog obedience training
• Puppy socialization
• Behavioral correction
• Pet sitting with training
• Agility training

📱 DIGITAL SERVICES
• Social media management
• Basic web design
• Online tutoring
• Virtual assistance
• Content creation

HOW TO ADD NEW SKILLS:
1. Go to your Worker Profile
2. Click "Edit Skills & Services"
3. Select new categories
4. Add relevant experience/certifications
5. Set your rates for new services

BENEFITS:
• Access to new customer segments
• Higher earning potential
• Diversified income streams
• Reduced competition in new categories

Start adding these skills today and watch your job opportunities grow!

GISUGO Skills Team`,
            sender: {
                name: 'GISUGO Skills Team',
                email: 'skills@gisugo.com',
                avatar: 'public/users/User-08.jpg'
            },
            timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
            isRead: false,
            hasAttachment: false
        },
        {
            id: 'msg_work_008',
            topic: 'updates',
            subject: 'Enhanced Worker Dashboard Features',
            excerpt: 'New dashboard features including earnings analytics, job history search, and customer feedback insights.',
            content: `📊 Enhanced Worker Dashboard is Here!

Dear Worker,

Your worker dashboard just got a major upgrade with powerful new features to help you manage your GISUGO business better!

NEW DASHBOARD FEATURES:

📈 EARNINGS ANALYTICS
• Monthly and yearly earnings charts
• Income trends and projections
• Peak earning hours analysis
• Service category performance
• Goal setting and tracking

🔍 ADVANCED JOB HISTORY
• Search jobs by date, customer, or service
• Filter by earnings, ratings, or location
• Export job history to spreadsheet
• Detailed job performance metrics

💬 CUSTOMER FEEDBACK INSIGHTS
• Detailed rating breakdowns
• Common feedback themes
• Improvement suggestions
• Response templates for reviews

📅 SMART SCHEDULING
• Calendar integration
• Automatic availability updates
• Job conflict detection
• Travel time calculations

📱 MOBILE OPTIMIZATION
• Faster loading on mobile devices
• Touch-friendly interface
• Offline data viewing
• Push notification settings

🎯 PERFORMANCE TRACKING
• Customer satisfaction scores
• Response time metrics
• Job completion rates
• Earnings per hour calculations

ACCESS YOUR NEW DASHBOARD:
Log in to your worker account to explore all the new features. We've also added helpful tooltips to guide you through the updates.

These improvements will help you work smarter, not harder!

GISUGO Product Team`,
            sender: {
                name: 'GISUGO Product Team',
                email: 'product@gisugo.com',
                avatar: 'public/users/User-09.jpg'
            },
            timestamp: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000), // 11 days ago
            isRead: true,
            hasAttachment: false
        },
        {
            id: 'msg_work_009',
            topic: 'promotions',
            subject: 'Double G-Coins Weekend Special',
            excerpt: 'Earn double G-Coins on all completed jobs this weekend! October 21-22, 2025.',
            content: `💰 DOUBLE G-COINS WEEKEND SPECIAL! 💰

Dear Hardworking GISUGO Worker,

This weekend only, earn DOUBLE G-Coins on every completed job!

PROMOTION DETAILS:
📅 Dates: October 21-22, 2025 (Saturday & Sunday)
⏰ Time: 12:01 AM Saturday to 11:59 PM Sunday
💎 Bonus: 100% extra G-Coins on completed jobs
🎯 No minimum job value required

HOW IT WORKS:
• Complete any job during the weekend
• Earn your normal rate PLUS 100% bonus
• Bonus G-Coins credited within 24 hours
• No limit on number of jobs

EXAMPLES:
• ₱500 job → Earn ₱1,000 G-Coins total
• ₱1,200 job → Earn ₱2,400 G-Coins total
• ₱300 job → Earn ₱600 G-Coins total

MAXIMIZE YOUR EARNINGS:
🚀 Accept multiple jobs this weekend
📱 Keep your availability status updated
⚡ Respond quickly to job requests
🏆 Deliver exceptional service for great reviews

BONUS TIPS:
• Popular weekend services: cleaning, gardening, event setup
• Update your profile to highlight weekend availability
• Consider offering package deals for multiple services

This is your chance to supercharge your earnings! Don't miss out on this limited-time opportunity.

Happy earning!
GISUGO Promotions Team`,
            sender: {
                name: 'GISUGO Promotions Team',
                email: 'promotions@gisugo.com',
                avatar: 'public/users/User-10.jpg'
            },
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isRead: false,
            hasAttachment: false
        },
        {
            id: 'msg_work_010',
            topic: 'promotions',
            subject: 'Worker Referral Bonus Program',
            excerpt: 'Refer skilled workers to GISUGO and earn ₱200 for each successful referral who completes 5 jobs.',
            content: `👥 Worker Referral Bonus Program!

Dear GISUGO Worker,

Know other skilled workers? Invite them to GISUGO and earn generous referral bonuses!

REFERRAL REWARDS:
💰 Earn ₱200 for each successful referral
🎁 Your referral gets ₱100 welcome bonus
🏆 Monthly bonus for top referrers: ₱2,000
📈 No limit on referrals

QUALIFICATION CRITERIA:
✅ Referral must complete profile verification
✅ Complete at least 5 jobs within 60 days
✅ Maintain 4.0+ star rating
✅ Use your referral code during signup

YOUR REFERRAL CODE: WORK-REF-2025

HOW TO REFER:
1. Share your code: WORK-REF-2025
2. Send this link: https://gisugo.com/worker-signup?ref=WORK-REF-2025
3. Help them through the verification process
4. Earn ₱200 when they complete 5 jobs!

IDEAL REFERRALS:
• Skilled tradespeople (electricians, plumbers, carpenters)
• Service professionals (cleaners, gardeners, drivers)
• Creative professionals (photographers, designers)
• Technical experts (IT support, tutors)

MONTHLY LEADERBOARD:
🥇 Most referrals: ₱2,000 bonus
🥈 Second place: ₱1,200 bonus
🥉 Third place: ₱800 bonus

TRACKING YOUR REFERRALS:
Check your dashboard's "Referrals" section to track:
• Number of people who used your code
• Their verification status
• Jobs completed
• Bonuses earned

Start referring today and build your passive income stream!

GISUGO Referral Team`,
            sender: {
                name: 'GISUGO Referral Team',
                email: 'referrals@gisugo.com',
                avatar: 'public/users/User-11.jpg'
            },
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
            isRead: true,
            hasAttachment: false
        }
    ]
};

// ===== ADMIN MESSAGES FUNCTIONALITY =====

// Initialize admin messages when page loads
function initializeAdminMessages() {
    loadCustomerMessages();
    loadWorkerMessages();
    setupMessageFiltering('customer');
    setupMessageFiltering('worker');
    setupMessageDetailHandlers('customer');
    setupMessageDetailHandlers('worker');
    initializeReplyModal();
}

// Load customer messages
function loadCustomerMessages() {
    console.log('Loading customer messages...');
    const container = document.querySelector('#customer-messages-content .user-messages-list-container');
    if (container && MOCK_ADMIN_MESSAGES.customer) {
        // Start with New messages only (filtering will handle Old messages)
        const newMessages = MOCK_ADMIN_MESSAGES.customer.filter(msg => {
            const messageState = messageStates[msg.id];
            return messageState ? !messageState.isClosed : true;
        });
        console.log('Customer new messages count:', newMessages.length);
        
        container.innerHTML = newMessages.map(message => generateAdminMessageHTML(message, 'customer')).join('');
        
        // Setup click handlers for message items
        setupMessageDetailHandlers('customer');
        
        updateMessageCounts('customer');
    }
}

// Load unified messages (using customer data as the single source)
function loadUnifiedMessages() {
    console.log('Loading unified messages...');
    const container = document.querySelector('#unified-messages-content .user-messages-list-container');
    if (container && MOCK_ADMIN_MESSAGES.customer) {
        // Start with New messages only (filtering will handle Old messages)
        const newMessages = MOCK_ADMIN_MESSAGES.customer.filter(msg => {
            const messageState = messageStates[msg.id];
            return messageState ? !messageState.isClosed : true;
        });
        console.log('Unified new messages count:', newMessages.length);
        
        container.innerHTML = newMessages.map(message => generateAdminMessageHTML(message, 'unified')).join('');
        
        // Setup click handlers for message items
        setupMessageDetailHandlers('unified');
        
        updateMainMessagesTabCount();
    }
}

// Load worker messages  
function loadWorkerMessages() {
    console.log('Loading worker messages...');
    const container = document.querySelector('#worker-messages-content .user-messages-list-container');
    if (container && MOCK_ADMIN_MESSAGES.worker) {
        // Start with New messages only (filtering will handle Old messages)
        const newMessages = MOCK_ADMIN_MESSAGES.worker.filter(msg => {
            const messageState = messageStates[msg.id];
            return messageState ? !messageState.isClosed : true;
        });
        console.log('Worker new messages count:', newMessages.length);
        
        container.innerHTML = newMessages.map(message => generateAdminMessageHTML(message, 'worker')).join('');
        
        // Setup click handlers for message items
        setupMessageDetailHandlers('worker');
        
        updateMessageCounts('worker');
    }
}

// Generate admin message HTML
function generateAdminMessageHTML(message, role) {
    const topicClass = message.topic.toLowerCase().replace(/\s+/g, '-');
    const topicLabel = getTopicLabel(message.topic);
    const timeAgo = formatTimeAgo(message.timestamp);
    
    return `
        <div class="admin-message-item ${!message.isRead ? 'unread' : ''}" 
             data-message-id="${message.id}" 
             data-topic="${message.topic}">
            <div class="message-topic ${topicClass}">${topicLabel}</div>
            <div class="message-content-area">
                <div class="message-header">
                    <div class="message-sender">
                        <img src="${message.sender.avatar}" alt="${message.sender.name}" class="sender-avatar">
                        <div class="sender-info">
                            <div class="sender-name">${message.sender.name}</div>
                            <div class="sender-email">${message.sender.email}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="message-time">${timeAgo}</div>
                        ${message.hasAttachment ? '<div class="message-attachment" title="Has attachment">🖼️</div>' : ''}
                    </div>
                </div>
                <div class="message-preview">
                    <div class="message-subject">${message.subject}</div>
                    <div class="message-excerpt">${message.excerpt}</div>
                </div>
            </div>
        </div>
    `;
}

// Get topic label for display
function getTopicLabel(topic) {
    const labels = {
        'support': 'Support Responses',
        'system': 'System Updates', 
        'notifications': 'Important Notices',
        'updates': 'Platform Updates',
        'promotions': 'Promotions'
    };
    return labels[topic] || topic;
}

// Format timestamp to relative time
function formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - new Date(timestamp);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days / 7)} weeks ago`;
}

    // Show message detail (window or overlay based on screen size)
    function showMessageDetail(message, role) {
        if (window.innerWidth >= 887) {
            // Desktop: Show in right panel window
            showMessageWindow(message, role);
        } else {
            // Mobile: Show in overlay
            showMessageOverlay(message, role);
        }
        
        // DO NOT automatically mark as read when showing - only when user explicitly marks as read
        // This prevents the timing issue where messages disappear immediately
    }

// Show message in desktop window
function showMessageWindow(message, role) {
    const detailId = role === 'unified' ? 'unifiedMessageDetail' : `${role}MessageDetail`;
    const contentId = role === 'unified' ? 'unifiedMessageContent' : `${role}MessageContent`;
    const detailContainer = document.getElementById(detailId);
    const contentContainer = document.getElementById(contentId);
    
    if (!detailContainer || !contentContainer) return;
    
    // Hide no-message-selected and show content
    detailContainer.style.display = 'none';
    contentContainer.style.display = 'flex';
    
    // Populate content
    contentContainer.innerHTML = generateMessageDetailHTML(message, role);
    
    // Add close handler
    const closeBtn = contentContainer.querySelector('.detail-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeMessage(message.id, role));
    }
    
    // Add reply handler
    const replyBtn = contentContainer.querySelector('.detail-reply-btn');
    if (replyBtn) {
        replyBtn.addEventListener('click', () => showReplyModal(message, role));
    }
}

    // Show message in mobile overlay
    function showMessageOverlay(message, role) {
        const overlayId = role === 'unified' ? 'unifiedMessageDetailOverlay' : `${role}MessageDetailOverlay`;
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        
        // Generate clean message content for overlay (no buttons in content)
        const overlayMessageContent = generateOverlayMessageHTML(message, role);
        
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-header">
                    <button class="overlay-close-btn" data-message-id="${message.id}" data-role="${role}">✕</button>
                    <h3>Message Details</h3>
                </div>
                <div class="overlay-body">
                    ${overlayMessageContent}
                </div>
                <div class="overlay-footer">
                    <button class="detail-reply-btn" onclick="showReplyModal(${role === 'unified' ? 'MOCK_ADMIN_MESSAGES.customer' : 'MOCK_ADMIN_MESSAGES.' + role}.find(m => m.id === '${message.id}'), '${role}')">Reply</button>
                    <button class="detail-close-btn" onclick="closeMessage('${message.id}', '${role}')">Close</button>
                </div>
            </div>
        `;
        
        // Add event listener for the X close button to trigger auto-close
        const closeBtn = overlay.querySelector('.overlay-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                // Auto-close the message (move to Old Messages)
                closeMessage(message.id, role);
                // Hide the overlay
                overlay.style.display = 'none';
            });
        }
        
        // Show overlay
        overlay.style.display = 'flex';
    }

// Generate reply thread HTML (like dashboard)
function generateReplyThreadHTML(messageId) {
    const messageState = messageStates[messageId];
    
    if (!messageState || !messageState.replies || messageState.replies.length === 0) {
        return ''; // No replies to show
    }
    
    let threadHTML = '<div class="reply-thread"><h4 class="thread-title">Conversation History</h4>';
    
    // Reverse the replies array to show newest first
    const reversedReplies = [...messageState.replies].reverse();
    
    reversedReplies.forEach(reply => {
        const replyDate = new Date(reply.timestamp);
        const formattedDate = replyDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        threadHTML += `
            <div class="reply-item ${reply.type}">
                <div class="reply-header">
                    <div class="reply-author">
                        <div class="reply-author-avatar">
                            <img src="${reply.avatar}" alt="${reply.author}" class="author-avatar">
                        </div>
                        <div class="reply-author-info">
                            <span class="author-name">${reply.author}</span>
                            <span class="reply-time">${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div class="reply-content">
                    ${reply.content.replace(/\n/g, '<br>')}
                    ${reply.hasPhoto ? `
                        <div class="reply-photo-attachment" onclick="showPhotoLightbox('${reply.photoData.fullSizeUrl}')">
                            <img src="${reply.photoData.thumbnailUrl}" alt="Reply photo" class="reply-photo-thumbnail" data-full-size="${reply.photoData.fullSizeUrl}">
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    threadHTML += '</div>';
    return threadHTML;
}

// Generate message detail HTML (for desktop window)
function generateMessageDetailHTML(message, role) {
    const timeAgo = formatTimeAgo(message.timestamp);
    const topicLabel = getTopicLabel(message.topic);
    
    // Get reply thread HTML
    const replyThreadHTML = generateReplyThreadHTML(message.id);
    
    return `
        <div class="message-detail-header">
            <div class="detail-sender">
                <img src="${message.sender.avatar}" alt="${message.sender.name}" class="detail-avatar">
                <div class="detail-sender-info">
                    <div class="detail-sender-name">${message.sender.name}</div>
                    <div class="detail-sender-email">${message.sender.email}</div>
                    <div class="detail-message-time">${timeAgo}</div>
                </div>
            </div>
            <div class="detail-topic-section">
                <div class="detail-topic ${message.topic}">${topicLabel}</div>
                <div class="detail-actions">
                    <button class="detail-reply-btn">Reply</button>
                    <button class="detail-close-btn">Close</button>
                </div>
            </div>
        </div>
        
        <div class="message-content-inner">
            <div class="message-detail-body">
                ${replyThreadHTML.trim() !== '' ? replyThreadHTML : ''}
                
                ${replyThreadHTML.trim() !== '' ? '<div class="original-message-separator"><h4>Original Message</h4></div>' : ''}
                
                <div class="detail-subject">${message.subject}</div>
                <div class="detail-message-text">${message.content.replace(/\n/g, '<br>')}</div>
                
                ${message.hasAttachment ? `
                    <div class="detail-attachment">
                        <div class="attachment-label">Attachment:</div>
                        <div class="attachment-file">
                            <div class="attachment-name">${message.attachmentName || 'attachment.pdf'}</div>
                        </div>
                    </div>
                ` : ''}
                
                ${replyThreadHTML.trim() === '' ? replyThreadHTML : ''}
            </div>
        </div>
    `;
}

// Generate clean message content for overlay (no action buttons)
function generateOverlayMessageHTML(message, role) {
    const timeAgo = formatTimeAgo(message.timestamp);
    const topicLabel = getTopicLabel(message.topic);
    
    return `
        <div class="overlay-message-header">
            <div class="overlay-sender">
                <img src="${message.sender.avatar}" alt="${message.sender.name}" class="overlay-avatar">
                <div class="overlay-sender-info">
                    <div class="overlay-sender-name">${message.sender.name}</div>
                    <div class="overlay-sender-email">${message.sender.email}</div>
                    <div class="overlay-message-time">${timeAgo}</div>
                </div>
            </div>
            <div class="overlay-topic ${message.topic}">${topicLabel}</div>
        </div>
        
        <div class="overlay-message-content">
            ${generateReplyThreadHTML(message.id).trim() !== '' ? generateReplyThreadHTML(message.id) : ''}
            
            ${generateReplyThreadHTML(message.id).trim() !== '' ? '<div class="original-message-separator"><h4>Original Message</h4></div>' : ''}
            
            <div class="overlay-subject">${message.subject}</div>
            <div class="overlay-message-text">${message.content.replace(/\n/g, '<br>')}</div>
            
            ${message.hasAttachment ? `
                <div class="overlay-attachment">
                    <div class="overlay-attachment-label">Attachment:</div>
                    <div class="overlay-attachment-file">
                        <div class="overlay-attachment-name">${message.attachmentName || 'attachment.pdf'}</div>
                    </div>
                </div>
            ` : ''}
            
            ${generateReplyThreadHTML(message.id).trim() === '' ? generateReplyThreadHTML(message.id) : ''}
        </div>
    `;
}

// Mark message as read (simplified - no reloading)
function markMessageAsRead(message, role) {
    console.log('markMessageAsRead called:', message.id, role);
    
    // Initialize message state if it doesn't exist
    if (!messageStates[message.id]) {
        messageStates[message.id] = {
            status: 'new',
            isReplied: false,
            isRead: false,
            isClosed: false,
            replies: []
        };
    }
    
    // Update message state
    messageStates[message.id].isRead = true;
    messageStates[message.id].isClosed = true; // Also mark as closed when marking as read
    
    console.log('Message state updated:', { isRead: messageStates[message.id].isRead, isClosed: messageStates[message.id].isClosed });
    
    // Update UI - remove unread class
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
    if (messageElement) {
        messageElement.classList.remove('unread');
        console.log('Removed unread class from message element');
    }
    
    // Note: This function only updates UI state
    // Message reloading is handled by the calling function (closeMessage)
    console.log('markMessageAsRead completed - UI updated only');
}

// Helper function for filtering messages
function filterMessages(messages, searchTerm, messageType, currentTab) {
    return messages.filter(message => {
        // Filter by current tab (New/Old) - check messageStates instead of message object
        const messageState = messageStates[message.id];
        const isClosed = messageState ? messageState.isClosed : false;
        const isNewMessage = !isClosed;
        const showInNewTab = currentTab === 'new' && isNewMessage;
        const showInOldTab = currentTab === 'old' && isClosed;
        
        if (!showInNewTab && !showInOldTab) {
            return false;
        }
        
        // Filter by message type
        if (messageType !== 'all' && message.topic !== messageType) {
            return false;
        }
        
        // Filter by search term
        if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            return message.subject.toLowerCase().includes(searchLower) ||
                   message.excerpt.toLowerCase().includes(searchLower) ||
                   message.content.toLowerCase().includes(searchLower) ||
                   message.sender.name.toLowerCase().includes(searchLower) ||
                   message.sender.email.toLowerCase().includes(searchLower);
        }
        
        return true;
    });
}

// Close message (move to Old Messages)
function closeMessage(messageId, role) {
    // Use customer messages for unified, otherwise use role-specific messages
    const messages = role === 'unified' ? MOCK_ADMIN_MESSAGES.customer : MOCK_ADMIN_MESSAGES[role];
    const message = messages.find(m => m.id === messageId);
    
    if (message) {
        // Get current tab BEFORE making any changes
        const filteringSystem = window[`${role}FilteringSystem`];
        const currentTab = filteringSystem ? filteringSystem.getCurrentTab() : 'new';
        console.log(`🔄 Closing message from ${currentTab} tab`);
        
        // Initialize message state if it doesn't exist
        if (!messageStates[messageId]) {
            messageStates[messageId] = {
                status: 'new',
                isReplied: false,
                isRead: false,
                isClosed: false,
                replies: []
            };
        }
        
        // Check if message was already closed (to determine if we should show toast)
        const wasAlreadyClosed = messageStates[messageId].isClosed;
        
        // Update message state
        messageStates[messageId].isRead = true;
        messageStates[messageId].isClosed = true;
        
        // Update UI - remove unread class
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.remove('unread');
        }
        
        // Hide detail view
        const detailId = role === 'unified' ? 'unifiedMessageDetail' : `${role}MessageDetail`;
        const contentId = role === 'unified' ? 'unifiedMessageContent' : `${role}MessageContent`;
        const detailContainer = document.getElementById(detailId);
        const contentContainer = document.getElementById(contentId);
        
        if (detailContainer && contentContainer) {
            detailContainer.style.display = 'flex';
            contentContainer.style.display = 'none';
        }
        
        // Hide overlay if it's open
        const overlayId = role === 'unified' ? 'unifiedMessageDetailOverlay' : `${role}MessageDetailOverlay`;
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Use filtering system to reload messages (preserves current tab)
        if (filteringSystem && filteringSystem.reloadFilteredMessages) {
            console.log(`🔄 Reloading ${currentTab} tab messages after close`);
            filteringSystem.reloadFilteredMessages();
            
            // Update notification counts AFTER the message list is reloaded
            // Only update the specific role that changed, then update main tab
            setTimeout(() => {
                // Update the specific role's inbox tabs
                updateInboxTabCounts(role);
                
                // Update main Messages tab with fresh calculation
                updateMainMessagesTabCount();
            }, 5);
        } else {
            // Fallback: reload messages manually
            if (role === 'customer') {
                loadCustomerMessages();
            } else {
                loadWorkerMessages();
            }
            
            // Update notification counts for fallback
            setTimeout(() => {
                // Update the specific role's inbox tabs
                updateInboxTabCounts(role);
                
                // Update main Messages tab with fresh calculation
                updateMainMessagesTabCount();
            }, 5);
        }
        
        // Show toast notification only if message was actually moved from New to Old
        if (!wasAlreadyClosed) {
            showToast(`Moved to Old Messages`);
            console.log('📧 Message moved from New to Old - showing toast');
        } else {
            console.log('📧 Message was already in Old - no toast shown');
        }
        
        // Clear currently open message tracking if this message was closed
        if (currentlyOpenMessage && currentlyOpenMessage.id === messageId) {
            currentlyOpenMessage = null;
            currentlyOpenRole = null;
        }
    }
}

// Debounced counter update to prevent race conditions
let counterUpdateTimeout = null;

// Update message counts with debouncing to prevent race conditions
function updateMessageCounts(role) {
    // Clear any pending counter updates
    if (counterUpdateTimeout) {
        clearTimeout(counterUpdateTimeout);
    }
    
    // Debounce the actual update to prevent rapid-fire calls from interfering
    counterUpdateTimeout = setTimeout(() => {
        // Update the specific role's inbox tabs
        updateInboxTabCounts(role);
        
        // Update main Messages tab with fresh calculation
        updateMainMessagesTabCount();
        
        counterUpdateTimeout = null;
    }, 10); // Very small delay to batch rapid updates while staying responsive
}


// Update inbox tab counts (New/Old)
function updateInboxTabCounts(role) {
    const messages = MOCK_ADMIN_MESSAGES[role];
    const newCount = messages.filter(msg => {
        const messageState = messageStates[msg.id];
        return messageState ? !messageState.isClosed : true;
    }).length;
    const oldCount = messages.filter(msg => {
        const messageState = messageStates[msg.id];
        return messageState ? messageState.isClosed : false;
    }).length;
    
    // Update New tab count
    const newTabBadge = document.querySelector(`#${role}-messages-content .inbox-tab-btn[data-tab="new"] .notification-badge`);
    if (newTabBadge) {
        newTabBadge.textContent = newCount;
        newTabBadge.style.display = newCount > 0 ? 'inline-block' : 'none';
    }
    
    // Update Old tab count
    const oldTabBadge = document.querySelector(`#${role}-messages-content .inbox-tab-btn[data-tab="old"] .notification-badge`);
    if (oldTabBadge) {
        oldTabBadge.textContent = oldCount;
        oldTabBadge.style.display = oldCount > 0 ? 'inline-block' : 'none';
    }
    
    console.log(`📊 Updated ${role} inbox tabs: New(${newCount}), Old(${oldCount})`);
}

// Update main Messages tab count (separate function to avoid race conditions)
function updateMainMessagesTabCount() {
    // Always recalculate both customer and worker counts for accuracy
    const customerCount = MOCK_ADMIN_MESSAGES.customer.filter(msg => {
        const messageState = messageStates[msg.id];
        return messageState ? (!messageState.isRead && !messageState.isClosed) : (!msg.isRead);
    }).length;
    const workerCount = MOCK_ADMIN_MESSAGES.worker.filter(msg => {
        const messageState = messageStates[msg.id];
        return messageState ? (!messageState.isRead && !messageState.isClosed) : (!msg.isRead);
    }).length;
    const totalCount = customerCount + workerCount;
    
    // Update both customer and worker Messages tab badges (unified IDs)
    const customerMessagesTabBadge = document.querySelector('#unifiedMessagesTab .notification-count');
    const workerMessagesTabBadge = document.querySelector('#unifiedMessagesTabWorker .notification-count');
    
    // Update customer Messages tab badge
    if (customerMessagesTabBadge) {
        customerMessagesTabBadge.textContent = totalCount;
        customerMessagesTabBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';
    }
    
    // Update worker Messages tab badge
    if (workerMessagesTabBadge) {
        workerMessagesTabBadge.textContent = totalCount;
        workerMessagesTabBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';
    }
    
    // Fallback selector if the specific ones don't work
    if (!customerMessagesTabBadge && !workerMessagesTabBadge) {
        const fallbackBadge = document.querySelector('.tab-btn[data-tab*="messages"] .notification-count');
        if (fallbackBadge) {
            fallbackBadge.textContent = totalCount;
            fallbackBadge.style.display = totalCount > 0 ? 'inline-block' : 'none';
        }
    }
    
    console.log(`📊 Updated Messages tab badge: ${totalCount} (Customer: ${customerCount}, Worker: ${workerCount})`);
}

    // Setup message filtering functionality
    function setupMessageFiltering(role) {
        // Handle unified messages with different selector
        const contentSelector = role === 'unified' ? '#unified-messages-content' : `#${role}-messages-content`;
        const searchInput = document.querySelector(`${contentSelector} .search-input-small`);
        const searchBtn = document.querySelector(`${contentSelector} .search-btn-small`);
        const typeDropdown = document.querySelector(`${contentSelector} .type-dropdown`);
        const newTabBtn = document.querySelector(`${contentSelector} .inbox-tab-btn[data-tab="new"]`);
        const oldTabBtn = document.querySelector(`${contentSelector} .inbox-tab-btn[data-tab="old"]`);
        
        if (!searchInput || !typeDropdown || !newTabBtn || !oldTabBtn) {
            console.log('setupMessageFiltering: Missing elements for role', role);
            return;
        }
        
        let currentTab = 'new';
        let currentSearchTerm = '';
        let currentMessageType = 'all';
        
        // Handle tab switching
        function switchTab(tab) {
            console.log('switchTab called:', tab, 'for role:', role);
            currentTab = tab;
            
            // Update active tab styling - ensure proper class management
            const allInboxTabs = document.querySelectorAll(`${contentSelector} .inbox-tab-btn`);
            allInboxTabs.forEach(btn => btn.classList.remove('active'));
            
            if (tab === 'new') {
                newTabBtn.classList.add('active');
                console.log(`✅ Set New tab as active for ${role}`);
            } else {
                oldTabBtn.classList.add('active');
                console.log(`✅ Set Old tab as active for ${role}`);
            }
            
            // Reload messages with current filters
            reloadFilteredMessages();
        }
        
        // Handle search
        function performSearch() {
            currentSearchTerm = searchInput.value.trim();
            console.log('performSearch:', currentSearchTerm);
            reloadFilteredMessages();
        }
        
        // Handle type filter
        function changeMessageType() {
            currentMessageType = typeDropdown.value;
            console.log('changeMessageType:', currentMessageType);
            reloadFilteredMessages();
        }
        
        // Reload messages with current filters
        function reloadFilteredMessages() {
            console.log('reloadFilteredMessages called for role:', role, 'tab:', currentTab);
            // Use customer messages for unified, otherwise use role-specific messages
            const messages = role === 'unified' ? MOCK_ADMIN_MESSAGES.customer : MOCK_ADMIN_MESSAGES[role];
            const filteredMessages = filterMessages(messages, currentSearchTerm, currentMessageType, currentTab);
            
            console.log('Total messages:', messages.length);
            console.log('New messages:', messages.filter(m => {
                const messageState = messageStates[m.id];
                return messageState ? !messageState.isClosed : true;
            }).length);
            console.log('Old messages:', messages.filter(m => {
                const messageState = messageStates[m.id];
                return messageState ? messageState.isClosed : false;
            }).length);
            console.log('Filtered messages count for', currentTab, 'tab:', filteredMessages.length);
            
            // Update message list
            const listContainer = document.querySelector(`${contentSelector} .user-messages-list-container`);
            if (listContainer) {
                if (filteredMessages.length === 0) {
                    listContainer.innerHTML = `
                        <div style="text-align: center; padding: 2rem; color: #a0aec0;">
                            <p>No ${currentTab} messages found${currentSearchTerm ? ` for "${currentSearchTerm}"` : ''}</p>
                        </div>
                    `;
                } else {
                    listContainer.innerHTML = filteredMessages.map(message => generateAdminMessageHTML(message, role)).join('');
                    
                    // Re-attach click handlers
                    setupMessageDetailHandlers(role);
                }
            }
            
            // Update counts
            if (role === 'unified') {
                updateMainMessagesTabCount();
            } else {
                updateMessageCounts(role);
            }
        }
        
        // Store the filtering system globally so markMessageAsRead can access it
        window[`${role}FilteringSystem`] = {
            reloadFilteredMessages,
            getCurrentTab: () => currentTab,
            setCurrentTab: (tab) => { currentTab = tab; }
        };
        
        // Initialize with proper tab state
        switchTab('new'); // Ensure New tab starts as active
        
        // Event listeners
        newTabBtn.addEventListener('click', () => switchTab('new'));
        oldTabBtn.addEventListener('click', () => switchTab('old'));
        
        if (searchBtn) {
            searchBtn.addEventListener('click', performSearch);
        }
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        searchInput.addEventListener('input', () => {
            // Real-time search with debounce
            clearTimeout(searchInput.searchTimeout);
            searchInput.searchTimeout = setTimeout(performSearch, 300);
        });
        
        typeDropdown.addEventListener('change', changeMessageType);
        
        // Initialize with new tab active
        switchTab('new');
    }

// Track currently open message for auto-close behavior
let currentlyOpenMessage = null;
let currentlyOpenRole = null;

// Setup message detail handlers
function setupMessageDetailHandlers(role) {
    // Get all message items for this role
    const contentSelector = role === 'unified' ? '#unified-messages-content' : `#${role}-messages-content`;
    const messageItems = document.querySelectorAll(`${contentSelector} .admin-message-item`);
    
    messageItems.forEach(item => {
        item.addEventListener('click', () => {
            const messageId = item.dataset.messageId;
            // Use customer messages for unified, otherwise use role-specific messages
            const messages = role === 'unified' ? MOCK_ADMIN_MESSAGES.customer : MOCK_ADMIN_MESSAGES[role];
            const message = messages.find(m => m.id === messageId);
            
            if (message) {
                // Auto-close previously open message (any viewed message should move to Old when switching)
                if (currentlyOpenMessage && currentlyOpenRole && currentlyOpenMessage.id !== messageId) {
                    const previousMessageState = messageStates[currentlyOpenMessage.id];
                    if (previousMessageState && !previousMessageState.isClosed) {
                        console.log(`🔄 Auto-closing previously viewed message: ${currentlyOpenMessage.id}`);
                        closeMessage(currentlyOpenMessage.id, currentlyOpenRole);
                    }
                }
                
                // Initialize message state when first viewed (this marks it as "viewed")
                if (!messageStates[messageId]) {
                    messageStates[messageId] = {
                        status: 'new',
                        isReplied: false,
                        isRead: false,
                        isClosed: false,
                        replies: []
                    };
                }
                
                // Track the newly opened message
                currentlyOpenMessage = message;
                currentlyOpenRole = role;
                
                showMessageDetail(message, role);
            }
        });
    });
    
    // Handle window resize to switch between window and overlay
    window.addEventListener('resize', () => {
        // Close any open overlays when switching to desktop
        if (window.innerWidth >= 887) {
            const overlays = document.querySelectorAll('.user-message-detail-overlay');
            overlays.forEach(overlay => {
                overlay.style.display = 'none';
            });
        }
    });
}

// Show toast notification
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    if (toast) {
        const messageElement = toast.querySelector('#toastMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// ===== REPLY FUNCTIONALITY (COPIED FROM DASHBOARD) =====

let currentReplyMessage = null;
let currentReplyRole = null;

// Track message states for threading (like dashboard)
let messageStates = {};

// Show reply modal
function showReplyModal(message, role) {
    currentReplyMessage = message;
    currentReplyRole = role;
    
    const replyOverlay = document.getElementById('replyOverlay');
    const replyTextarea = document.getElementById('floatingReplyTextarea');
    
    if (replyOverlay && replyTextarea) {
        // Clear previous content
        replyTextarea.value = '';
        
        // Show modal
        replyOverlay.style.display = 'flex';
        
        // Focus on textarea
        setTimeout(() => {
            replyTextarea.focus();
        }, 100);
    }
}

// Close reply modal
function closeReplyModal() {
    const replyOverlay = document.getElementById('replyOverlay');
    const replyTextarea = document.getElementById('floatingReplyTextarea');
    
    if (replyOverlay) {
        replyOverlay.style.display = 'none';
    }
    
    if (replyTextarea) {
        replyTextarea.value = '';
    }
    
    // Clear photo preview and data
    window.removeReplyPhoto();
    
    currentReplyMessage = null;
    currentReplyRole = null;
}

// Send reply
function sendReply() {
    const replyTextarea = document.getElementById('floatingReplyTextarea');
    const attachmentInput = document.getElementById('floatingReplyAttachment');
    
    if (!replyTextarea || !currentReplyMessage || !currentReplyRole) return;
    
    const replyText = replyTextarea.value.trim();
    
    if (!replyText) {
        showToast('Please enter a reply message');
        return;
    }
    
    // Use customer data for unified messages
    const actualRole = currentReplyRole === 'unified' ? 'customer' : currentReplyRole;
    
    // Initialize message state if it doesn't exist
    if (!messageStates[currentReplyMessage.id]) {
        messageStates[currentReplyMessage.id] = {
            status: 'new',
            isReplied: false,
            isRead: false,
            replies: []
        };
    }
    
    // Add user reply to the thread (like dashboard)
    const replyData = {
        type: 'user_reply',
        content: replyText,
        timestamp: new Date().toISOString(),
        author: 'You',
        avatar: 'public/users/Peter-J-Ang-User-01.jpg' // Use proper user avatar
    };
    
    // Add photo attachment if present
    if (replyPhotoData) {
        replyData.hasPhoto = true;
        replyData.photoData = replyPhotoData;
        console.log('📷 Adding photo to reply:', replyPhotoData);
    }
    
    messageStates[currentReplyMessage.id].replies.push(replyData);
    
    // Mark as replied
    messageStates[currentReplyMessage.id].isReplied = true;
    messageStates[currentReplyMessage.id].lastActivity = 'user_reply';
    messageStates[currentReplyMessage.id].lastReplyTime = new Date().toISOString();
    
    // Update the message's excerpt to show latest activity
    const messageIndex = MOCK_ADMIN_MESSAGES[actualRole].findIndex(msg => msg.id === currentReplyMessage.id);
    if (messageIndex !== -1) {
        MOCK_ADMIN_MESSAGES[actualRole][messageIndex].excerpt = `You replied: ${replyText.substring(0, 50)}${replyText.length > 50 ? '...' : ''}`;
        MOCK_ADMIN_MESSAGES[actualRole][messageIndex].timestamp = new Date(); // Update timestamp for sorting
    }
    
    // Close the reply modal immediately
    const replyOverlay = document.getElementById('replyOverlay');
    if (replyOverlay) {
        replyOverlay.style.display = 'none';
    }
    
    // Clear the textarea
    const textareaElement = document.getElementById('floatingReplyTextarea');
    if (textareaElement) {
        textareaElement.value = '';
    }
    
    // Clear photo preview if exists
    const photoPreview = document.getElementById('replyPhotoPreview');
    if (photoPreview) {
        photoPreview.style.display = 'none';
    }
    
    // Clear reply data
    replyPhotoData = null;
    
    // Refresh the message list and display immediately
    if (currentReplyRole === 'unified') {
        // For unified messages, use customer filtering system
        const filteringSystem = window['customerFilteringSystem'];
        if (filteringSystem && filteringSystem.reloadFilteredMessages) {
            filteringSystem.reloadFilteredMessages();
        } else {
            loadUnifiedMessages();
        }
    } else {
        const filteringSystem = window[`${actualRole}FilteringSystem`];
        if (filteringSystem && filteringSystem.reloadFilteredMessages) {
            filteringSystem.reloadFilteredMessages();
        } else {
            if (actualRole === 'customer') {
                loadCustomerMessages();
            } else {
                loadWorkerMessages();
            }
        }
    }
    
    // Update counts
    updateMessageCounts(actualRole);
    if (currentReplyRole === 'unified') {
        updateMainMessagesTabCount();
    }
    
    // Refresh the currently open message display to show new replies immediately
    refreshCurrentMessageDisplay(currentReplyMessage, currentReplyRole);
    
    // Show success toast
    showToast('Reply sent successfully');
}

// Update New/Old Messages tab counters
function updateInboxTabCounts(role) {
    // Use customer data for unified messages
    const actualRole = role === 'unified' ? 'customer' : role;
    const messages = MOCK_ADMIN_MESSAGES[actualRole];
    
    if (!messages) return;
    
    let newCount = 0;
    let oldCount = 0;
    
    messages.forEach(message => {
        const messageState = messageStates[message.id];
        if (messageState && messageState.isClosed) {
            oldCount++;
        } else {
            newCount++;
        }
    });
    
    // Update the notification badges
    const newBadge = document.querySelector('.inbox-tab-btn[data-tab="new"] .notification-badge');
    const oldBadge = document.querySelector('.inbox-tab-btn[data-tab="old"] .notification-badge');
    
    if (newBadge) {
        newBadge.textContent = newCount;
        newBadge.style.display = newCount > 0 ? 'inline' : 'none';
    }
    
    if (oldBadge) {
        oldBadge.textContent = oldCount;
        oldBadge.style.display = oldCount > 0 ? 'inline' : 'none';
    }
    
    console.log(`📊 Updated inbox counters: New=${newCount}, Old=${oldCount}`);
}

// Refresh currently open message display to show new replies
function refreshCurrentMessageDisplay(message, role) {
    if (!message || !role) return;
    
    console.log('🔄 Refreshing message display for:', message.id, 'role:', role);
    
    // Handle unified messages - use correct IDs
    const contentId = role === 'unified' ? 'unifiedMessageContent' : `${role}MessageContent`;
    const overlayId = role === 'unified' ? 'unifiedMessageDetailOverlay' : `${role}MessageDetailOverlay`;
    
    // Check if message is currently displayed in desktop window
    const contentContainer = document.getElementById(contentId);
    if (contentContainer && contentContainer.style.display !== 'none') {
        // Refresh desktop window content
        contentContainer.innerHTML = generateMessageDetailHTML(message, role);
        
        // Re-attach event handlers
        const closeBtn = contentContainer.querySelector('.detail-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeMessage(message.id, role));
        }
        
        const replyBtn = contentContainer.querySelector('.detail-reply-btn');
        if (replyBtn) {
            replyBtn.addEventListener('click', () => showReplyModal(message, role));
        }
        
        console.log('✅ Refreshed desktop message window with new replies');
    }
    
    // Check if message is currently displayed in mobile overlay
    const overlay = document.getElementById(overlayId);
    if (overlay && overlay.style.display === 'flex') {
        // Refresh overlay content
        const overlayMessageContent = generateOverlayMessageHTML(message, role);
        
        // Get the correct data source for unified messages
        const dataSource = role === 'unified' ? 'MOCK_ADMIN_MESSAGES.customer' : `MOCK_ADMIN_MESSAGES.${role}`;
        
        overlay.innerHTML = `
            <div class="overlay-content">
                <div class="overlay-header">
                    <h3>Message Details</h3>
                    <button class="overlay-close-btn" data-message-id="${message.id}" data-role="${role}">&times;</button>
                </div>
                <div class="overlay-body">
                    ${overlayMessageContent}
                </div>
                <div class="overlay-footer">
                    <button class="detail-reply-btn" onclick="showReplyModal(${dataSource}.find(m => m.id === '${message.id}'), '${role}')">Reply</button>
                    <button class="detail-close-btn" onclick="closeMessage('${message.id}', '${role}')">Close</button>
                </div>
            </div>
        `;
        
        // Add event listener for the refreshed X close button to trigger auto-close
        const refreshedCloseBtn = overlay.querySelector('.overlay-close-btn');
        if (refreshedCloseBtn) {
            refreshedCloseBtn.addEventListener('click', () => {
                // Auto-close the message (move to Old Messages)
                closeMessage(message.id, role);
                // Hide the overlay
                overlay.style.display = 'none';
            });
        }
        
        console.log('✅ Refreshed mobile overlay with new replies');
    }
}

// Close reply modal function
function closeReplyModal() {
    const replyOverlay = document.getElementById('replyOverlay');
    if (replyOverlay) {
        replyOverlay.style.display = 'none';
    }
    
    // Clear the textarea
    const modalTextarea = document.getElementById('floatingReplyTextarea');
    if (modalTextarea) {
        modalTextarea.value = '';
    }
    
    // Clear photo preview if exists
    const photoPreview = document.getElementById('replyPhotoPreview');
    if (photoPreview) {
        photoPreview.style.display = 'none';
    }
    
    // Clear photo data
    replyPhotoData = null;
    
    // Reset current reply variables
    currentReplyMessage = null;
    currentReplyRole = null;
}

// Initialize reply modal event handlers
function initializeReplyModal() {
    const closeBtn = document.getElementById('closeReplyModal');
    const cancelBtn = document.getElementById('cancelReplyBtn');
    const sendBtn = document.getElementById('sendFloatingReplyBtn');
    const photoInput = document.getElementById('floatingReplyAttachment');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeReplyModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeReplyModal);
    }
    
    if (sendBtn) {
        sendBtn.addEventListener('click', sendReply);
    }
    
    // Initialize photo upload functionality
    if (photoInput) {
        photoInput.addEventListener('change', handleReplyPhotoUpload);
    }
    
    // Close modal when clicking outside
    const replyOverlay = document.getElementById('replyOverlay');
    if (replyOverlay) {
        replyOverlay.addEventListener('click', (e) => {
            if (e.target === replyOverlay) {
                closeReplyModal();
            }
        });
    }
}

// Global variable to store uploaded photo data
let replyPhotoData = null;

// Handle reply photo upload
function handleReplyPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file');
        return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showToast('Image file is too large. Please select a file under 10MB.');
        return;
    }
    
    console.log('📷 Processing reply photo...');
    
    // Process image using the same compression as chat
    processChatImage(file, (processedImage) => {
        // Store processed image data
        replyPhotoData = {
            thumbnailUrl: processedImage.thumbnailURL,
            fullSizeUrl: processedImage.fullSizeURL,
            dimensions: processedImage.dimensions,
            aspectRatio: processedImage.aspectRatio,
            fileSizes: processedImage.fileSizes
        };
        
        // Show preview
        showReplyPhotoPreview(processedImage.thumbnailURL);
        
        console.log('✅ Reply photo processed and ready');
    });
}

// Show photo preview in reply modal
function showReplyPhotoPreview(imageUrl) {
    const previewContainer = document.getElementById('replyPhotoPreview');
    const previewImage = document.getElementById('replyPreviewImage');
    
    if (previewContainer && previewImage) {
        previewImage.src = imageUrl;
        previewContainer.style.display = 'block';
    }
}

// Remove reply photo (global function for HTML onclick)
window.removeReplyPhoto = function() {
    const previewContainer = document.getElementById('replyPhotoPreview');
    const photoInput = document.getElementById('floatingReplyAttachment');
    
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    if (photoInput) {
        photoInput.value = '';
    }
    
    replyPhotoData = null;
    console.log('🗑️ Reply photo removed');
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize reply modal only - messages will be initialized when their tabs are accessed
    setTimeout(() => {
        initializeReplyModal();
        // Initialize Messages tab counter on page load
        initializeMessagesTabCounter();
    }, 500);
});

// Initialize Messages tab counter on page load (before any tab is accessed)
function initializeMessagesTabCounter() {
    updateMainMessagesTabCount();
    // Also initialize inbox tab counters
    updateInboxTabCounts('customer'); // Use customer data for unified messages
}

