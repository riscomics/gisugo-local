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
- /applications/{applicationId} - Application status changes
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

3. APPLICATIONS TAB:
   - Data: MOCK_APPLICATIONS array (line ~2450)
   - Structure: job listings with nested application arrays
   - Actions: hire_applicant, reject_applicant, contact_user, view_profile
   - Required Endpoints: GET /applications, PUT /applications/{id}/hire, PUT /applications/{id}/reject

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
   /applications/{applicationId} - Application documents
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

// Initialize the Messages app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize only the core functionality
    initializeTabs();
    initializeMenu(); 
    initializeConfirmationOverlay();
    initializeContactMessageOverlay();
    
    // MODULAR APPROACH: Only load the initially active tab (notifications)
    // Other tabs will load their content only when clicked
    initializeActiveTab('notifications');
    
    // CRITICAL FIX: Update all tab counts on page load to show correct numbers
    updateAllTabCounts();
    
    // SAFETY CLEANUP: Ensure no lingering mobile input adjustments on page load
    cleanupMobileInputVisibility();
    
    // MEMORY LEAK FIX: Register page unload cleanup
    registerCleanup('function', 'pageUnload', () => {
        window.addEventListener('beforeunload', executeAllCleanups);
        window.addEventListener('unload', executeAllCleanups);
    });
    
    // MEMORY LEAK FIX: Use tracked document listener for overlay clicks
    const overlayClickKey = addDocumentListener('click', function(e) {
        const messagesContainer = document.querySelector('.messages-container');
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

// Tab Management - UPDATED FOR INDEPENDENT SCROLL CONTAINERS
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabWrappers = document.querySelectorAll('.tab-content-wrapper');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // CLEANUP: Close all message threads when switching tabs
            // This prevents the bug where clicking Messages tab while thread is open causes empty content
            closeAllMessageThreads();
            
            // CLEANUP: Cancel any active selections when switching tabs
            cancelSelection();
            
            // CRITICAL FIX: Clean up avatar overlay when switching tabs
            // This prevents stuck overlays from persisting across tab switches
            hideAvatarOverlay();
            
            // MEMORY LEAK FIX: Clean up all avatar listeners when switching tabs
            const activeTabContent = document.querySelector('.tab-content-wrapper.active');
            if (activeTabContent) {
                cleanupAvatarOverlays(activeTabContent);
            }
            
            // CRITICAL BUG FIX: Close any open action overlays when switching tabs
            // This prevents the double-click bug by ensuring clean state
            closeActionOverlay();
            
            // Clear any lingering data attributes from shared buttons
            // This prevents contaminated data from previous tab interactions
            const hireBtn = document.getElementById('hireJobBtn');
            const rejectBtn = document.getElementById('rejectJobBtn');
            if (hireBtn) {
                ['data-application-id', 'data-user-id', 'data-user-name', 'data-job-id', 'data-job-title'].forEach(attr => {
                    hireBtn.removeAttribute(attr);
                });
            }
            if (rejectBtn) {
                ['data-application-id', 'data-user-id', 'data-user-name', 'data-job-id', 'data-job-title'].forEach(attr => {
                    rejectBtn.removeAttribute(attr);
                });
            }
            
            // NUCLEAR OPTION: Force reset if normal cleanup fails
            setTimeout(() => {
                if (document.getElementById('avatarOverlay')) {
                    console.log('🚨 Normal cleanup failed, using force reset');
                    window.forceResetAvatarOverlay();
                }
            }, 250);
            
            // Remove active class from all tabs and wrappers
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabWrappers.forEach(wrapper => {
                wrapper.classList.remove('active');
                // No need to set display: none since CSS handles it
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding wrapper with independent scroll
            const targetWrapper = document.getElementById(targetTab + '-content');
            if (targetWrapper) {
                targetWrapper.classList.add('active');
            }

            // MODULAR APPROACH: Initialize only the newly active tab's content
            initializeActiveTab(targetTab);

            // Update page title based on active tab
            updatePageTitle(targetTab);
            
            console.log(`Switched to independent tab: ${targetTab} - each tab now has separate scroll position`);
        });
    });
}

function updatePageTitle(activeTab) {
    const titleElement = document.getElementById('messagesTitle');
    if (!titleElement) return;

    const titles = {
        'notifications': 'NOTIFICATIONS',
        'applications': 'APPLICATIONS', 
        'messages': 'MESSAGES'
    };

    titleElement.textContent = titles[activeTab] || 'MESSAGES';
}

// Job Listings Management
function initializeJobListings() {
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
            const applicationId = this.getAttribute('data-application-id');
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
            hireJobBtn.setAttribute('data-application-id', applicationId);
            hireJobBtn.setAttribute('data-user-id', userId);
            hireJobBtn.setAttribute('data-user-name', userName);
            hireJobBtn.setAttribute('data-job-id', jobId);
            hireJobBtn.setAttribute('data-job-title', jobTitle);
            
            // Store application data for reject button
            const rejectJobBtn = document.getElementById('rejectJobBtn');
            if (rejectJobBtn) {
                rejectJobBtn.setAttribute('data-application-id', applicationId);
                rejectJobBtn.setAttribute('data-user-id', userId);
                rejectJobBtn.setAttribute('data-user-name', userName);
                rejectJobBtn.setAttribute('data-job-id', jobId);
                rejectJobBtn.setAttribute('data-job-title', jobTitle);
                console.log('=== SETTING REJECT BUTTON DATA ===');
                console.log('Application ID set to:', applicationId);
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
                contactBtn.setAttribute('data-application-id', applicationId);
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
            const applicationId = this.getAttribute('data-application-id');
            
            console.log('Contact button data:', { userName, userId, applicationId });
            
            if (userName && userId) {
                console.log(`Opening contact message for ${userName}`);
                
                // Close the current overlay
                closeActionOverlay();
                
                // Show contact message overlay
                showContactMessageOverlay(userId, userName, applicationId);
            } else {
                console.error('Missing contact button data attributes:', { userName, userId });
            }
        });
    }
    
    // Handle hire button click
    if (hireJobBtn) {
        hireJobBtn.addEventListener('click', function() {
            const applicationId = this.getAttribute('data-application-id');
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const jobId = this.getAttribute('data-job-id');
            const jobTitle = this.getAttribute('data-job-title');
            
            // CRITICAL FIX: Validate data before proceeding
            if (!applicationId || !userId || !userName) {
                console.error('❌ HIRE BUTTON ERROR: Missing critical data attributes');
                return;
            }
            
            console.log('FIREBASE HIRE ACTION - Firestore Batch Operation Ready:', {
                // Cloud Function trigger data
                cloudFunction: 'processApplicationHire',
                
                // Firestore batch operations
                firestoreOperations: {
                    // Update application document
                    updateApplication: {
                        collection: 'applications',
                        documentId: applicationId,
                        data: {
                            status: 'hired',
                            hiredAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            hiredBy: 'firebase.auth().currentUser.uid',
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()'
                        }
                    },
                    
                    // Create contract document
                    createContract: {
                        collection: 'contracts',
                        documentId: 'contract_' + applicationId,
                        data: {
                            applicationId: applicationId,
                            jobId: jobId,
                            workerUid: userId,
                            employerUid: 'firebase.auth().currentUser.uid',
                            status: 'pending_confirmation',
                            agreedPrice: 'application.pricing.offeredAmount',
                            currency: 'PHP',
                            createdAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            metadata: {
                                source: 'application_hire',
                                version: '1.0'
                            }
                        }
                    },
                    
                    // Update job document
                    updateJob: {
                        collection: 'jobs',
                        documentId: jobId,
                        data: {
                            status: 'in_progress',
                            assignedWorkerUid: userId,
                            assignedAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()'
                        }
                    },
                    
                    // Create notification for worker
                    createNotification: {
                        collection: 'notifications',
                        documentId: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        data: {
                            recipientUid: userId,
                            senderUid: 'firebase.auth().currentUser.uid',
                            notificationType: 'application_accepted',
                            title: 'Application Accepted!',
                            message: `Congratulations! Your application for "${jobTitle}" has been accepted.`,
                            read: false,
                            priority: 'high',
                            category: 'application',
                            relatedDocuments: {
                                applicationId: applicationId,
                    jobId: jobId,
                                contractId: 'contract_' + applicationId
                            },
                            createdAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            metadata: {
                                source: 'system',
                                businessLogic: 'application_hire',
                                indexed: true
                            }
                        }
                    }
                },
                
                // Cloud Functions triggers
                cloudFunctionTriggers: {
                    sendPushNotification: {
                        recipientUid: userId,
                        title: 'Application Accepted!',
                        body: `Your application for "${jobTitle}" has been accepted.`,
                        data: {
                            action: 'open_contract',
                            contractId: 'contract_' + applicationId
                        }
                    },
                    
                    sendEmail: {
                        to: 'user.email.from.auth',
                        template: 'application_accepted',
                        data: {
                            workerName: userName,
                            jobTitle: jobTitle,
                            contractId: 'contract_' + applicationId
                        }
                    },
                    
                    updateAnalytics: {
                        event: 'application_hired',
                        parameters: {
                            job_id: jobId,
                            worker_uid: userId,
                            employer_uid: 'firebase.auth().currentUser.uid',
                            hire_source: 'mobile_app'
                        }
                    }
                },
                
                // Real-time listeners to update
                realtimeUpdates: [
                    '/applications/{applicationId}',
                    '/jobs/{jobId}',
                    '/notifications/{recipientUid}',
                    '/contracts/{contractId}'
                ]
            });
            
            // Close action overlay first
            closeActionOverlay();
            
            // Show confirmation with hire-specific styling
            showConfirmationOverlay(
                'success',
                'Application Accepted!',
                `You have hired ${userName} for the job. They will be notified and you can coordinate the work details through messages.`
            );
            
            // Remove the entire job listing when hired (since job is now filled)
            setTimeout(() => {
                // CRITICAL FIX: Scope selector to Applications tab only
                // This prevents finding message threads with same application-id
                const applicationsContainer = document.querySelector('#applications-content .applications-container');
                const applicationCard = applicationsContainer ? 
                    applicationsContainer.querySelector(`[data-application-id="${applicationId}"]`) : 
                    null;
                
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
            const applicationId = this.getAttribute('data-application-id');
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            const jobId = this.getAttribute('data-job-id');
            const jobTitle = this.getAttribute('data-job-title');
            
            // CRITICAL FIX: Validate data before proceeding
            if (!applicationId || !userId || !userName) {
                console.error('❌ REJECT BUTTON ERROR: Missing critical data attributes');
                return;
            }
            
            console.log('FIREBASE REJECT ACTION - Firestore Batch Operation Ready:', {
                // Cloud Function trigger data
                cloudFunction: 'processApplicationReject',
                
                // Firestore batch operations
                firestoreOperations: {
                    // Update application document
                    updateApplication: {
                        collection: 'applications',
                        documentId: applicationId,
                        data: {
                            status: 'rejected',
                            rejectedAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            rejectedBy: 'firebase.auth().currentUser.uid',
                            rejectionReason: 'employer_choice',
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()'
                        }
                    },
                    
                    // Create notification for worker
                    createNotification: {
                        collection: 'notifications',
                        documentId: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                        data: {
                            recipientUid: userId,
                            senderUid: 'firebase.auth().currentUser.uid',
                            notificationType: 'application_rejected',
                            title: 'Application Update',
                            message: `Thank you for your interest in "${jobTitle}". The employer has chosen to proceed with another applicant.`,
                            read: false,
                            priority: 'medium',
                            category: 'application',
                            relatedDocuments: {
                     applicationId: applicationId,
                                jobId: jobId
                            },
                            createdAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()',
                            metadata: {
                                source: 'system',
                                businessLogic: 'application_rejection',
                                indexed: true
                            }
                        }
                    },
                    
                    // Update analytics document
                    updateAnalytics: {
                        collection: 'analytics',
                        documentId: 'daily_' + new Date().toISOString().split('T')[0],
                        data: {
                            applications_rejected: 'firebase.firestore.FieldValue.increment(1)',
                            rejection_reasons: {
                                employer_choice: 'firebase.firestore.FieldValue.increment(1)'
                            },
                            updatedAt: 'firebase.firestore.FieldValue.serverTimestamp()'
                        },
                        merge: true // Merge with existing document
                    }
                },
                
                // Cloud Functions triggers
                cloudFunctionTriggers: {
                    sendPushNotification: {
                        recipientUid: userId,
                        title: 'Application Update',
                        body: 'Thank you for your interest. The employer has proceeded with another applicant.',
                        data: {
                            action: 'view_jobs',
                            category: 'similar_jobs'
                        }
                    },
                    
                    updateRecommendations: {
                        workerUid: userId,
                        action: 'suggest_similar_jobs',
                        excludeJobId: jobId
                    },
                    
                    updateAnalytics: {
                        event: 'application_rejected',
                        parameters: {
                            job_id: jobId,
                            worker_uid: userId,
                            employer_uid: 'firebase.auth().currentUser.uid',
                            rejection_stage: 'application_review'
                        }
                    }
                },
                
                // Real-time listeners to update
                realtimeUpdates: [
                    '/applications/{applicationId}',
                    '/notifications/{recipientUid}',
                    '/analytics/daily_{date}'
                ]
            });
            
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
                // CRITICAL FIX: Scope selector to Applications tab only
                // This prevents finding message threads with same application-id
                const applicationsContainer = document.querySelector('#applications-content .applications-container');
                const applicationCard = applicationsContainer ? 
                    applicationsContainer.querySelector(`[data-application-id="${applicationId}"]`) : 
                    null;
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
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
            closeConfirmationOverlay();
        }
    });
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
    
    // Switch to applications tab
    const applicationsTab = document.getElementById('applicationsTab');
    if (applicationsTab) {
        applicationsTab.click();
    }
    
    // Show confirmation that we're navigating
    showConfirmationOverlay(
        'success',
        'Navigating to Applications',
        'Taking you to review your job applications.'
    );
    
    console.log('Backend action: Navigate to applications for job review');
}

function handleViewApplication(notificationItem) {
    const message = notificationItem.querySelector('.notification-message').textContent;
    const applicantMatch = message.match(/\*\*(.*?)\*\*/);
    const applicantName = applicantMatch ? applicantMatch[1] : 'Unknown';
    
    // Extract application data from notification
    const applicationId = notificationItem.getAttribute('data-application-id');
    const jobId = notificationItem.getAttribute('data-job-id');
    const jobTitle = notificationItem.getAttribute('data-job-title');
    
    if (applicationId && jobId) {
        // Backend-ready: Try navigation with fallback validation
        try {
            navigateToApplicationCard(applicationId, jobId);
        } catch (error) {
            // Backend-ready error handling
            console.warn('Navigation failed, using fallback:', error);
            const applicationsTab = document.getElementById('applicationsTab');
            if (applicationsTab) {
                applicationsTab.click();
                showTemporaryNotification('Opening Applications tab...');
            }
        }
    } else {
        // Fallback to basic tab switch if data is missing
        console.warn('Missing application or job ID, using fallback navigation');
        const applicationsTab = document.getElementById('applicationsTab');
        if (applicationsTab) {
            applicationsTab.click();
        }
    }
    
    console.log('Backend action: Navigate to specific application for:', applicantName);
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
        notificationType: 'critical_action_required',
        recipientUid: 'user_currentUserUid', // Firebase UID format
        senderUid: 'system',
        read: false,
        createdAt: new Date('2025-12-22T12:30:00Z'), // Will be firebase.firestore.Timestamp
        updatedAt: new Date('2025-12-22T12:30:00Z'),
        
        // Firestore document structure - flat for better indexing
        title: 'URGENT: Account Verification Required',
        message: 'Your account requires immediate verification to continue using GISUGO services. Failure to verify within 24 hours will result in account suspension.',
        icon: '⚠️',
        iconClass: 'critical-icon',
        priority: 'high',
        category: 'account',
        timeDisplay: '1 hour ago',
        dateDisplay: 'Dec. 22, 2025',
        
        // Firebase-optimized action structure
        actions: [
            {
                type: 'primary',
                action: 'verify_account',
                text: 'Verify Now',
                actionData: {
                    redirectUrl: '/verify',
                    urgency: 'critical'
                }
            }
        ],
        
        // Firestore security rules compatibility
        metadata: {
            source: 'system',
            businessLogic: 'account_verification',
            indexed: true
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
            applicationId: 'app_kT3nH7mR8qX2bS9jL6',
            jobId: 'job_gT5nM8xK2jS6wF3eA9',
            userProfile: 'user_3vN8mQ4rT9xK2jP7sC1'
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'view_application',
                text: 'View Application',
                actionData: {
                    applicationId: 'app_kT3nH7mR8qX2bS9jL6',
                    navigateTo: 'applications'
                }
            }
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
            applicationId: 'app_nT7mK9qR2xJ4wS8nL6',
            jobId: 'job_xK4nM7rT8qJ2wS5nP9',
            userProfile: 'user_dR7nK4mQ9xT2jP6sL8'
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'view_application',
                text: 'View Application',
                actionData: {
                    applicationId: 'app_nT7mK9qR2xJ4wS8nL6',
                    navigateTo: 'applications'
                }
            }
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
    const applicationId = notification.applicationId || notification.relatedDocuments?.applicationId;
    const threadId = notification.threadId || notification.relatedDocuments?.threadId;
    
    if (jobId) dataAttributes.push(`data-job-id="${jobId}"`);
    if (notification.jobTitle) dataAttributes.push(`data-job-title="${notification.jobTitle}"`);
    if (applicationId) dataAttributes.push(`data-application-id="${applicationId}"`);
    if (threadId) dataAttributes.push(`data-thread-id="${threadId}"`);
    if (notification.userId) dataAttributes.push(`data-user-id="${notification.userId}"`);
    if (notification.userName) dataAttributes.push(`data-user-name="${notification.userName}"`);

    const actionsHTML = notification.actions.map(action => {
        const actionDataAttrs = [`data-action="${action.action}"`];
        // Use actionData for button-specific attributes
        if (action.actionData?.jobId) actionDataAttrs.push(`data-job-id="${action.actionData.jobId}"`);
        if (action.actionData?.applicationId) actionDataAttrs.push(`data-application-id="${action.actionData.applicationId}"`);
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

// Mock Messages Data
const MOCK_MESSAGES = [
    {
        threadId: 1,
        jobId: 1,
        jobTitle: 'Plumbing repair - kitchen sink leak',
        participantId: 6,
        participantName: 'Miguel Torres',
        threadOrigin: 'job', // NEW: Tracks thread origin ('job' or 'application')
        applicationId: null, // NEW: null for job-based threads
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
        `data-last-message-time="${thread.lastMessageTime}"`
    ].join(' ');

    // REVERSE MESSAGE ORDER: Newest messages at top
    const messagesHTML = thread.messages
        .slice()  // Create copy to avoid mutating original
        .reverse()  // Reverse so newest is first
        .map(message => generateMessageHTML(message))
        .join('');

    return `
        <div class="message-thread" ${threadDataAttrs}>
            <div class="message-thread-header" data-thread-id="${thread.threadId}">
                <div class="thread-info">
                    <div class="thread-job-title">${thread.jobTitle}</div>
                    <div class="thread-participant closed-only">${thread.threadOrigin === 'application' ? 'Application Conversation' : 'Job Post Conversation'} with ${thread.participantName}</div>
                    <div class="thread-options-container expanded-only">
                        <button class="thread-options-btn" data-thread-id="${thread.threadId}">
                            <span class="options-icon">▼</span>
                        </button>
                    </div>
                </div>
                <div class="thread-status">
                    ${thread.isNew ? '<span class="thread-new-tag">new</span>' : ''}
                    <div class="expand-icon">▼</div>
                </div>
            </div>
            <div class="message-thread-content" id="thread-${thread.threadId}" style="display: none;">
                <!-- MESSAGE INPUT AT TOP - Never covered by keyboard -->
                <div class="message-input-container">
                    <textarea class="message-input" placeholder="Type a message..." maxlength="200"></textarea>
                    <button class="message-send-btn">Send</button>
                </div>
                
                <!-- Messages below input - newest at top -->
                <div class="message-scroll-container">
                    ${messagesHTML}
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
        initializeMessages();
        
        // Update message count badge
        updateMessageCount();
        
        console.log('Messages tab content loaded independently');
    } else {
        console.error('Messages container not found');
    }
}

// ===== END PHASE 1 TEMPLATES =====

// Messages Management
function initializeMessages() {
    const messageThreadHeaders = document.querySelectorAll('.message-thread-header');
    
    messageThreadHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const threadId = this.getAttribute('data-thread-id');
            const messageThread = this.closest('.message-thread');
            const threadContent = document.getElementById('thread-' + threadId);
            const expandIcon = this.querySelector('.expand-icon');
            
            if (threadContent && expandIcon) {
                const isExpanded = messageThread.classList.contains('expanded');
                const messagesContainer = document.querySelector('.messages-container');
                
                if (isExpanded) {
                    // Collapse current thread
                    messageThread.classList.remove('expanded', 'show');
                    threadContent.style.display = 'none';
                    expandIcon.textContent = '▼';
                    
                    // Remove thread-active class and overlay from container
                    messagesContainer.classList.remove('thread-active', 'show-overlay');
                    
                    // Clean up mobile input visibility handlers
                    cleanupMobileInputVisibility();
                } else {
                    // First, close all other expanded threads
                    closeAllMessageThreads();
                    
                    // Then expand the current thread with fade animation
                    messageThread.classList.add('expanded');
                    threadContent.style.display = 'block';
                    expandIcon.textContent = '✕';
                    
                    // Add thread-active class to container for styling inactive threads
                    messagesContainer.classList.add('thread-active');
                    
                    // Trigger fade-in animation after positioning
                    setTimeout(() => {
                        messageThread.classList.add('show');
                        messagesContainer.classList.add('show-overlay');
                    }, 50);
                    
                    // Scroll to top when opening thread (under tabs)
                    scrollToThreadTop();
                    
                    // Remove "new" tag when opening thread
                    const newTag = this.querySelector('.thread-new-tag');
                    if (newTag) {
                        newTag.remove();
                        // Update message count
                        updateMessageCount();
                    }
                    
                    // Keep scroll at top since newest messages are now at top
                    setTimeout(() => {
                        const scrollContainer = threadContent.querySelector('.message-scroll-container');
                        if (scrollContainer) {
                            scrollContainer.scrollTop = 0;
                        }
                    }, 150);
                    
                    // Initialize mobile keyboard handling for input visibility
                    initializeMobileInputVisibility(messageThread);
                    
                    // Initialize input focus elegance for dimming effect
                    initializeInputFocusElegance(messageThread);
                    
                    // Initialize dynamic message sending for this thread
                    initializeDynamicMessageSending(messageThread);
                    
                    // Initialize avatar overlay functionality for this thread
                    initializeAvatarOverlays(messageThread);
                    
                    // Initialize thread options button for this thread
                    initializeThreadOptionsButton(messageThread);
                }
            }
        });
    });
}

function initializeThreadOptionsButton(messageThread) {
    const optionsBtn = messageThread.querySelector('.thread-options-btn');
    if (!optionsBtn) return;
    
    optionsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent thread header click
        
        const threadId = this.getAttribute('data-thread-id');
        const threadElement = this.closest('.message-thread');
        
        // Collect thread data for the avatar overlay
        const userData = {
            senderId: threadElement.getAttribute('data-participant-id'),
            senderName: threadElement.getAttribute('data-participant-name'),
            threadOrigin: threadElement.getAttribute('data-thread-origin'),
            applicationId: threadElement.getAttribute('data-application-id'),
            jobId: threadElement.getAttribute('data-job-id'),
            jobTitle: threadElement.getAttribute('data-job-title')
        };
        
        console.log('🔍 Thread options button clicked:', userData);
        
        // Store reference to this button for icon toggling
        userData.sourceButton = this;
        
        // Show the same avatar overlay used for avatar clicks
        showAvatarOverlay(e, userData);
    });
}

function closeAllMessageThreads() {
    const allMessageThreads = document.querySelectorAll('.message-thread');
    const messagesContainer = document.querySelector('.messages-container');
    
    // CRITICAL FIX: Clean up avatar overlay when closing threads
    // This prevents overlay from being orphaned when threads are closed
    hideAvatarOverlay();
    
    // MEMORY LEAK FIX: Clean up all avatar listeners when closing threads
    allMessageThreads.forEach(thread => {
        cleanupAvatarOverlays(thread);
    });
    
    allMessageThreads.forEach(thread => {
        const header = thread.querySelector('.message-thread-header');
        const threadId = header.getAttribute('data-thread-id');
        const threadContent = document.getElementById('thread-' + threadId);
        const expandIcon = header.querySelector('.expand-icon');
        
        if (thread.classList.contains('expanded')) {
            thread.classList.remove('expanded', 'show');
            if (threadContent) {
                threadContent.style.display = 'none';
            }
            if (expandIcon) {
                expandIcon.textContent = '▼';
            }
        }
    });
    
    // Remove thread-active class and overlay when all threads are closed
    messagesContainer.classList.remove('thread-active', 'show-overlay');
    
    // Clean up mobile input visibility handlers - ALWAYS clean up
    cleanupMobileInputVisibility();
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

function updateApplicationsCount() {
    // Count all remaining application cards
    const applicationCards = document.querySelectorAll('.application-card');
    const applicationsCountElement = document.querySelector('#applicationsTab .notification-count');
    
    if (applicationsCountElement) {
        const remainingCount = applicationCards.length;
        applicationsCountElement.textContent = remainingCount;
        
        // Hide badge if count is 0
        if (remainingCount === 0) {
            applicationsCountElement.style.display = 'none';
        } else {
            applicationsCountElement.style.display = 'inline-block';
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
    if (applicationsCountElement) {
        let totalApplications = 0;
        MOCK_APPLICATIONS.forEach(jobData => {
            totalApplications += jobData.applications.length;
        });
        applicationsCountElement.textContent = totalApplications;
        
        if (totalApplications === 0) {
            applicationsCountElement.style.display = 'none';
        } else {
            applicationsCountElement.style.display = 'inline-block';
        }
    }
    
    // Notifications count - keep existing count logic
    updateNotificationsCount();
    
    // Messages count - calculate from mock data when available
    const messagesCountElement = document.querySelector('#messagesTab .notification-count');
    if (messagesCountElement) {
        // For now, keep existing count or set based on mock data
        // This can be updated when message mock data is available
        const currentCount = messagesCountElement.textContent;
        // Keep current count for messages tab
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

// Applications Data Structure - FOR BACKEND PREPARATION
const MOCK_APPLICATIONS = [
    {
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
    }
];

// Generate Application Card HTML - FIREBASE DATA-DRIVEN
function generateApplicationCardHTML(application, jobTitle) {
    const stars = Array.from({length: 5}, (_, i) => 
        `<span class="star ${i < application.applicantProfile.averageRating ? 'filled' : ''}">★</span>`
    ).join('');

    return `
        <div class="application-card" 
             data-application-id="${application.applicationId}" 
             data-user-id="${application.applicantUid}" 
             data-job-title="${jobTitle}"
             data-user-name="${application.applicantProfile.displayName}"
             data-user-photo="${application.applicantProfile.photoURL}"
             data-user-rating="${application.applicantProfile.averageRating}"
             data-review-count="${application.applicantProfile.totalReviews}"
             data-price-offer="${application.pricing.offeredAmount}"
             data-price-type="${application.pricing.paymentType}"
             data-is-counter-offer="${application.pricing.isCounterOffer}"
             data-status="${application.status}"
             data-timestamp="${application.appliedAt.toISOString()}">
            <div class="application-job-title">
                <span class="applicant-name" data-user-name="${application.applicantProfile.displayName}">${application.applicantProfile.displayName}</span>
                <span class="price-offer">${application.displayData.formattedPrice}</span>
            </div>
            <div class="application-header">
                <div class="application-left">
                    <div class="application-date">${application.displayData.appliedDate}</div>
                    <div class="application-time">${application.displayData.appliedTime}</div>
                    <div class="application-rating" data-user-rating="${application.applicantProfile.averageRating}" data-review-count="${application.applicantProfile.totalReviews}">
                        <div class="stars">${stars}</div>
                        <span class="review-count">(${application.applicantProfile.totalReviews})</span>
                    </div>
                </div>
                <div class="applicant-photo">
                    <img src="${application.applicantProfile.photoURL}" alt="${application.applicantProfile.displayName}" data-user-photo="${application.applicantProfile.photoURL}">
                </div>
            </div>
            <div class="application-message">
                <strong>MESSAGE:</strong>
                ${application.applicationMessage}
            </div>
        </div>
    `;
}

// Generate Job Listing HTML - DATA-DRIVEN FOR BACKEND
function generateJobListingHTML(jobData) {
    const applicationsHTML = jobData.applications.map(app => 
        generateApplicationCardHTML(app, jobData.jobTitle)
    ).join('');

    return `
        <div class="job-listing" data-job-id="${jobData.jobId}">
            <div class="job-header" data-job-id="${jobData.jobId}">
                <div class="job-title">${jobData.jobTitle}</div>
                <div class="application-count">${jobData.applicationCount}</div>
                <div class="expand-icon">▼</div>
            </div>
            <div class="applications-list" id="applications-${jobData.jobId}" style="display: none;">
                ${applicationsHTML}
            </div>
        </div>
    `;
}

// Applications Content Generation - NOW DATA-DRIVEN
function generateApplicationsContent() {
    return MOCK_APPLICATIONS.map(jobData => generateJobListingHTML(jobData)).join('');
}

function loadApplicationsTab() {
    const container = document.querySelector('#applications-content .applications-container');
    if (container) {
        container.innerHTML = generateApplicationsContent();
        
        // Initialize event handlers for the dynamically loaded content
        initializeJobListings();
        initializeApplicationActions();
        
        // CRITICAL FIX: Re-initialize confirmation overlay after cleanup
        // This ensures the overlay works properly after button cleanup
        initializeConfirmationOverlay();
        
        // Update applications count badge
        updateApplicationsCount();
        
        console.log('Applications tab content loaded independently with cleaned event listeners');
    } else {
        console.error('Applications container not found');
    }
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
    
    // Add to top since newest messages are first
    scrollContainer.insertAdjacentHTML('afterbegin', messageHTML);
    
    // Add entrance animation
    const newMessageElement = scrollContainer.firstElementChild;
    if (newMessageElement) {
        newMessageElement.style.opacity = '0';
        newMessageElement.style.transform = 'translateY(-10px)';
        
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
    
    // Keep scroll at top to show the new message
    scrollContainer.scrollTop = 0;
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
            
                            // Show avatar overlay
                showAvatarOverlay(e, {
                    senderId: senderId,
                    senderName: senderName,
                    threadId: threadId,
                    jobId: jobId,
                    jobTitle: jobTitle,
                    threadOrigin: threadOrigin, // NEW: Include thread origin
                    applicationId: applicationId, // NEW: Include application ID
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
    
    // Create overlay content with conditional "View Application" button
    const viewApplicationButton = userData.threadOrigin === 'application' && userData.applicationId 
        ? `<button class="avatar-action-btn application" data-application-id="${userData.applicationId}" data-job-id="${userData.jobId}">
               <span>📋</span>
               <span>VIEW APPLICATION</span>
           </button>`
        : '';
    
    console.log(`🔍 DEBUG: viewApplicationButton HTML:`, viewApplicationButton);
    
    overlay.innerHTML = `
        <div class="avatar-overlay-header">
            <div class="avatar-overlay-name">${userData.senderName}</div>
            <div class="avatar-overlay-subtitle">${userData.threadOrigin === 'application' ? 'Application Conversation' : 'Job Post Conversation'}</div>
        </div>
        <div class="avatar-overlay-actions">
            <button class="avatar-action-btn profile" data-user-id="${userData.senderId}" data-user-name="${userData.senderName}">
                <span>👤</span>
                <span>VIEW PROFILE</span>
            </button>
            <button class="avatar-action-btn job" data-job-id="${userData.jobId}" data-job-title="${userData.jobTitle}">
                <span>💼</span>
                <span>VIEW JOB POST</span>
            </button>
            ${viewApplicationButton}
        </div>
    `;
    
    // Add to page
    document.body.appendChild(overlay);
    
    // Position overlay near the clicked avatar
    positionAvatarOverlay(overlay, event);
    
    // Show overlay with animation
    setTimeout(() => {
        overlay.classList.add('show');
    }, 10);
    
    // Add action handlers
    initializeAvatarOverlayActions(overlay, userData);
    
    // Change triangle icon to upward if this was opened from a thread options button
    if (userData.sourceButton) {
        const icon = userData.sourceButton.querySelector('.options-icon');
        if (icon) {
            icon.textContent = '▲';
            userData.sourceButton.classList.add('overlay-open');
        }
    }
    
    // IMPROVED LISTENER MANAGEMENT: Add single listener with proper timing and tracking
    // Wait for the overlay to be fully rendered before adding outside click detection
    setTimeout(() => {
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
        
        applicationBtn.addEventListener('click', function() {
            const applicationId = this.getAttribute('data-application-id');
            const jobId = this.getAttribute('data-job-id');
            
            console.log(`🔗 DEBUG: Avatar overlay View Application clicked!`);
            console.log(`🔗 DEBUG: applicationId = "${applicationId}"`);
            console.log(`🔗 DEBUG: jobId = "${jobId}"`);
            
            if (!applicationId || !jobId) {
                console.error(`❌ Missing data: applicationId="${applicationId}", jobId="${jobId}"`);
                showTemporaryNotification(`Error: Missing application data`);
                return;
            }
            
            // BACKEND INTEGRATION POINT: Navigate to specific application card
            // This should scroll to the Applications tab and expand the specific application
            // Example implementation:
            navigateToApplicationCard(applicationId, jobId);
            
            // Show temporary notification
            showTemporaryNotification(`Opening application details...`);
            
            // Hide overlay
            hideAvatarOverlay();
        }, { signal }); // MEMORY LEAK FIX: Use AbortController signal
    } else {
        console.log(`🔍 DEBUG: No View Application button found in overlay`);
    }
}

function hideAvatarOverlay() {
    // Reset triangle icon for any thread options buttons that opened this overlay
    const activeButtons = document.querySelectorAll('.thread-options-btn.overlay-open');
    activeButtons.forEach(button => {
        const icon = button.querySelector('.options-icon');
        if (icon) {
            icon.textContent = '▼';
        }
        button.classList.remove('overlay-open');
    });
    
    const existingOverlay = document.getElementById('avatarOverlay');
    if (existingOverlay) {
        // MEMORY LEAK FIX: Cleanup action button listeners before removing overlay
        if (existingOverlay._abortController) {
            existingOverlay._abortController.abort();
            existingOverlay._abortController = null;
        }
        
        existingOverlay.classList.remove('show');
        setTimeout(() => {
            if (existingOverlay.parentNode) {
                existingOverlay.parentNode.removeChild(existingOverlay);
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

// NUCLEAR OPTION: Global reset function for stuck overlays
// This can be called manually or triggered by specific events
// BACKEND INTEGRATION FUNCTION: Navigate to specific application card
function navigateToApplicationCard(applicationId, jobId) {
    console.log(`🎯 Navigating to application: ${applicationId} in job: ${jobId}`);
    
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
    }
}

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



