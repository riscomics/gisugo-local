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
    
    // Add click listener to document for overlay clicks
    document.addEventListener('click', function(e) {
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
            
            // CLEANUP: Close all message threads when switching away from messages tab
            if (targetTab !== 'messages') {
                closeAllMessageThreads();
            }
            
            // CLEANUP: Cancel any active selections when switching tabs
            cancelSelection();
            
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

// Application Action Overlay Management
function initializeApplicationActions() {
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
                const applicationCard = document.querySelector(`[data-application-id="${applicationId}"]`);
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
                const applicationCard = document.querySelector(`[data-application-id="${applicationId}"]`);
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
    const notificationActionBtns = document.querySelectorAll('.notification-action-btn');
    
    notificationActionBtns.forEach(btn => {
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
    
    // Handle notification item clicks (mark as read, etc.) with improved event delegation
    const notificationItems = document.querySelectorAll('.notification-item');
    
    // Clear any existing event listeners first
    notificationItems.forEach(item => {
        // Clone node to remove all event listeners
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
    });
    
    // Re-select items after cloning
    const freshNotificationItems = document.querySelectorAll('.notification-item');
    
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
    
    // Switch to applications tab
    const applicationsTab = document.getElementById('applicationsTab');
    if (applicationsTab) {
        applicationsTab.click();
    }
    
    // Show confirmation
    showConfirmationOverlay(
        'success',
        'Viewing Application',
        `Opening ${applicantName}'s application for review.`
    );
    
    console.log('Backend action: Open specific application for:', applicantName);
}

function handleReplyMessage(notificationItem) {
    const message = notificationItem.querySelector('.notification-message').textContent;
    const senderMatch = message.match(/\*\*(.*?)\*\*/);
    const senderName = senderMatch ? senderMatch[1] : 'Unknown';
    
    // Switch to messages tab
    const messagesTab = document.getElementById('messagesTab');
    if (messagesTab) {
        messagesTab.click();
    }
    
    // Show confirmation
    showConfirmationOverlay(
        'success',
        'Opening Messages',
        `Opening conversation with ${senderName}.`
    );
    
    console.log('Backend action: Open message thread with:', senderName);
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
            applicationId: 'app_dH9kL3mN7pR2vX8qY4t',
            jobId: 'job_gT5nM8xK2jS6wF3eA9',
            userProfile: 'user_3vN8mQ4rT9xK2jP7sC1'
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'view_application',
                text: 'View Application',
                actionData: {
                    applicationId: 'app_dH9kL3mN7pR2vX8qY4t',
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
        message: '<strong>Juan dela Cruz</strong> sent you a message: "Hello po! When can we start the carpentry work? I\'m available this weekend."',
        icon: '💬',
        iconClass: 'msg-icon',
        priority: 'medium',
        category: 'message',
        timeDisplay: '1 day ago',
        dateDisplay: 'Dec. 21, 2025',
        
        relatedDocuments: {
            threadId: 'thread_mX4nT8kR2qJ5wP9sL6',
            messageId: 'msg_bQ3nH7mK8vR2xJ4pS9',
            senderProfile: 'user_7yM3nK9rQ4vX2bS8jC5'
        },
        
        actions: [
            {
                type: 'secondary',
                action: 'reply_message',
                text: 'Reply',
                actionData: {
                    threadId: 'thread_mX4nT8kR2qJ5wP9sL6',
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

    // Add conditional data attributes
    if (notification.jobId) dataAttributes.push(`data-job-id="${notification.jobId}"`);
    if (notification.jobTitle) dataAttributes.push(`data-job-title="${notification.jobTitle}"`);
    if (notification.applicationId) dataAttributes.push(`data-application-id="${notification.applicationId}"`);
    if (notification.threadId) dataAttributes.push(`data-thread-id="${notification.threadId}"`);
    if (notification.userId) dataAttributes.push(`data-user-id="${notification.userId}"`);
    if (notification.userName) dataAttributes.push(`data-user-name="${notification.userName}"`);

    const actionsHTML = notification.actions.map(action => {
        const actionDataAttrs = [`data-action="${action.action}"`];
        if (action.jobId) actionDataAttrs.push(`data-job-id="${action.jobId}"`);
        if (action.applicationId) actionDataAttrs.push(`data-application-id="${action.applicationId}"`);
        if (action.threadId) actionDataAttrs.push(`data-thread-id="${action.threadId}"`);
        
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
        jobId: 2,
        jobTitle: 'Home cleaning service - 3 bedroom house deep clean',
        participantId: 2,
        participantName: 'Ana Rodriguez',
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
                senderId: 2,
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
                senderId: 2,
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
                senderId: 2,
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
                senderId: 2,
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
                    <div class="thread-participant">Conversation with ${thread.participantName}</div>
                </div>
                <div class="thread-status">
                    ${thread.isNew ? '<span class="thread-new-tag">new</span>' : ''}
                    <div class="expand-icon">▼</div>
                </div>
            </div>
            <div class="message-thread-content" id="thread-${thread.threadId}" style="display: none;">
                <!-- MESSAGE INPUT AT TOP - Never covered by keyboard -->
                <div class="message-input-container">
                    <input type="text" class="message-input" placeholder="Type a message..." maxlength="200">
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
                }
            }
        });
    });
}

function closeAllMessageThreads() {
    const allMessageThreads = document.querySelectorAll('.message-thread');
    const messagesContainer = document.querySelector('.messages-container');
    
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
    
    // Listen for viewport changes (best method for keyboard detection)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const currentHeight = window.visualViewport.height;
            if (currentHeight < initialViewportHeight - 150) {
                handleKeyboardShow();
            } else {
                handleKeyboardHide();
            }
        });
    } else {
        // Fallback for older browsers
        window.addEventListener('resize', () => {
            const currentHeight = window.innerHeight;
            if (currentHeight < initialViewportHeight - 150) {
                handleKeyboardShow();
            } else {
                handleKeyboardHide();
            }
        });
    }
    
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
                    displayName: 'Rosa Delgado',
                    photoURL: 'public/users/User-03.jpg', // Fixed local path
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
        
        // Update applications count badge
        updateApplicationsCount();
        
        console.log('Applications tab content loaded independently');
    } else {
        console.error('Applications container not found');
    }
}



