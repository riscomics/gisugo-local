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
                titleElement.textContent = 'JOBS MANAGER';
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
    
    // Sort by job date (earliest jobs first - most urgent at top)
    const sortedListings = mockListings.sort((a, b) => {
        const dateA = new Date(a.jobDate);
        const dateB = new Date(b.jobDate);
        return dateA - dateB;
    });
    
    // Generate listings HTML
    const listingsHTML = sortedListings.map(listing => generateListingCardHTML(listing)).join('');
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
    
    const formatDateTime = (date) => date.toISOString();
    
    return [
        {
            jobId: 'job_2024_001_limpyo',
            posterId: 'user_peter_ang_001',
            posterName: 'Peter J. Ang',
            title: 'Deep Clean My 3-Bedroom House Before Family Visit',
            category: 'limpyo',
            thumbnail: 'public/mock/mock-limpyo-post1.jpg',
            jobDate: '2024-01-18',
                    startTime: '9AM',
        endTime: '1PM',
            datePosted: formatDateTime(yesterday),
            status: 'active',
            applicationCount: 3,
            applicationIds: ['app_001_user05', 'app_002_user08', 'app_003_user11'],
            jobPageUrl: 'limpyo.html'
        },
        {
            jobId: 'job_2024_002_kompra',
            posterId: 'user_maria_santos_002',
            posterName: 'Maria Santos',
            title: 'Weekly Grocery Shopping for Elderly Grandmother',
            category: 'kompra',
            thumbnail: 'public/mock/mock-kompra-post3.jpg',
            jobDate: '2024-01-20',
                    startTime: '3PM',
        endTime: '5PM',
            datePosted: formatDateTime(twoDaysAgo),
            status: 'active',
            applicationCount: 7,
            applicationIds: ['app_004_user03', 'app_005_user07', 'app_006_user09', 'app_007_user12', 'app_008_user15', 'app_009_user18', 'app_010_user20'],
            jobPageUrl: 'kompra.html'
        },
        {
            jobId: 'job_2024_003_hatod',
            posterId: 'user_carlos_dela_cruz_003',
            posterName: 'Carlos Dela Cruz',
            title: 'Airport Pickup & Drop-off for Business Trip',
            category: 'hatod',
            thumbnail: 'public/mock/mock-kompra-post6.jpg',
            jobDate: '2024-01-17',
                    startTime: '7AM',
        endTime: '9AM',
            datePosted: formatDateTime(today),
            status: 'active',
            applicationCount: 2,
            applicationIds: ['app_011_user06', 'app_012_user14'],
            jobPageUrl: 'hatod.html'
        },
        {
            jobId: 'job_2024_004_hakot',
            posterId: 'user_ana_reyes_004',
            posterName: 'Ana Reyes',
            title: 'Move Heavy Furniture from 2nd Floor to Storage',
            category: 'hakot',
            thumbnail: 'public/mock/mock-hakot-post7.jpg',
            jobDate: '2024-01-19',
                    startTime: '1PM',
        endTime: '4PM',
            datePosted: formatDateTime(threeDaysAgo),
            status: 'active',
            applicationCount: 5,
            applicationIds: ['app_013_user02', 'app_014_user10', 'app_015_user13', 'app_016_user16', 'app_017_user19'],
            jobPageUrl: 'hakot.html'
        }
    ];
}

function generateListingCardHTML(listing) {
    const timeAgo = formatTimeAgo(listing.datePosted);
    const applicationText = listing.applicationCount === 1 ? '1 application' : `${listing.applicationCount} applications`;
    const jobDateFormatted = formatJobDate(listing.jobDate);
    const timeRange = `${listing.startTime} - ${listing.endTime}`;
    
    return `
        <div class="listing-card" 
             data-job-id="${listing.jobId}" 
             data-poster-id="${listing.posterId}"
             data-category="${listing.category}"
             data-application-count="${listing.applicationCount}"
             data-job-page-url="${listing.jobPageUrl}">
            <div class="listing-thumbnail">
                <img src="${listing.thumbnail}" alt="${listing.title}">
                <div class="status-badge status-${listing.status}">${listing.status.toUpperCase()}</div>
            </div>
            <div class="listing-content">
                <div class="listing-title">${listing.title}</div>
                <div class="listing-meta">
                    <div class="job-schedule">
                        <div class="job-date-row">
                            <span class="job-date">📅 ${jobDateFormatted}</span>
                        </div>
                        <div class="job-time-row">
                            <div class="application-count">${applicationText}</div>
                            <span class="job-time">🕒 ${timeRange}</span>
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
            const jobData = extractJobDataFromCard(this);
            showListingOptionsOverlay(jobData);
        });
    });
}

function extractJobDataFromCard(cardElement) {
    return {
        jobId: cardElement.getAttribute('data-job-id'),
        posterId: cardElement.getAttribute('data-poster-id'),
        category: cardElement.getAttribute('data-category'),
        applicationCount: parseInt(cardElement.getAttribute('data-application-count')),
        jobPageUrl: cardElement.getAttribute('data-job-page-url'),
        title: cardElement.querySelector('.listing-title').textContent,
        thumbnail: cardElement.querySelector('.listing-thumbnail img').src
    };
}

function showListingOptionsOverlay(jobData) {
    console.log(`🔧 Opening options overlay for job: ${jobData.jobId}`);
    
    const overlay = document.getElementById('listingOptionsOverlay');
    const title = document.getElementById('listingOptionsTitle');
    const subtitle = document.getElementById('listingOptionsSubtitle');
    
    // Update overlay content
    title.textContent = 'Manage Job';
    subtitle.textContent = jobData.title;
    
    // Store current job data for button handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-poster-id', jobData.posterId);
    overlay.setAttribute('data-category', jobData.category);
    overlay.setAttribute('data-job-page-url', jobData.jobPageUrl);
    
    // Show overlay
    overlay.classList.add('show');
    
    // Initialize overlay event handlers if not already done
    initializeOptionsOverlayHandlers();
}

// Helper function to get full job data by ID (for Firebase integration)
function getJobDataById(jobId) {
    const mockListings = generateMockListings();
    return mockListings.find(job => job.jobId === jobId);
}

// Helper function to get applications for a job (for Firebase integration)
function getApplicationsByJobId(jobId) {
    const jobData = getJobDataById(jobId);
    if (!jobData) return [];
    
    // TODO: Replace with Firebase query: db.collection('applications').where('jobId', '==', jobId)
    return jobData.applicationIds;
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

// ========================== LISTING OPTIONS OVERLAY HANDLERS ==========================

function initializeOptionsOverlayHandlers() {
    const overlay = document.getElementById('listingOptionsOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;

    const modifyBtn = document.getElementById('modifyJobBtn');
    const pauseBtn = document.getElementById('pauseJobBtn');
    const deleteBtn = document.getElementById('deleteJobBtn');
    const cancelBtn = document.getElementById('cancelOptionsBtn');

    // Modify job handler
    if (modifyBtn) {
        const modifyHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            handleModifyJob(jobData);
        };
        modifyBtn.addEventListener('click', modifyHandler);
        registerCleanup('listings', 'modifyBtn', () => {
            modifyBtn.removeEventListener('click', modifyHandler);
        });
    }

    // Pause job handler  
    if (pauseBtn) {
        const pauseHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            handlePauseJob(jobData);
        };
        pauseBtn.addEventListener('click', pauseHandler);
        registerCleanup('listings', 'pauseBtn', () => {
            pauseBtn.removeEventListener('click', pauseHandler);
        });
    }

    // Delete job handler
    if (deleteBtn) {
        const deleteHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            handleDeleteJob(jobData);
        };
        deleteBtn.addEventListener('click', deleteHandler);
        registerCleanup('listings', 'deleteBtn', () => {
            deleteBtn.removeEventListener('click', deleteHandler);
        });
    }

    // Cancel handler
    if (cancelBtn) {
        const cancelHandler = function(e) {
            e.preventDefault();
            hideListingOptionsOverlay();
        };
        cancelBtn.addEventListener('click', cancelHandler);
        registerCleanup('listings', 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }

    // Background click handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            hideListingOptionsOverlay();
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup('listings', 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });

    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideListingOptionsOverlay();
        }
    };
    addDocumentListener('overlayEscape', escapeHandler);

    overlay.dataset.handlersInitialized = 'true';
    console.log('🔧 Options overlay handlers initialized');
}

function getJobDataFromOverlay() {
    const overlay = document.getElementById('listingOptionsOverlay');
    return {
        jobId: overlay.getAttribute('data-job-id'),
        posterId: overlay.getAttribute('data-poster-id'),
        category: overlay.getAttribute('data-category'),
        jobPageUrl: overlay.getAttribute('data-job-page-url')
    };
}

function hideListingOptionsOverlay() {
    const overlay = document.getElementById('listingOptionsOverlay');
    overlay.classList.remove('show');
    console.log('🔧 Options overlay hidden');
}

function handleModifyJob(jobData) {
    console.log(`✏️ MODIFY job: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    // Navigate to new-post.html with edit mode
    const editUrl = `new-post.html?edit=${jobData.jobId}&category=${jobData.category}`;
    console.log(`📝 Navigating to edit mode: ${editUrl}`);
    
    // Firebase data mapping for edit mode:
    // - Load job document from: db.collection('jobs').doc(jobData.jobId)
    // - Pre-populate form with existing data
    // - Update document on save instead of creating new
    
    window.location.href = editUrl;
}

async function handlePauseJob(jobData) {
    console.log(`⏸️ PAUSE job: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    try {
        // Firebase data mapping for pause:
        // db.collection('jobs').doc(jobData.jobId).update({
        //     status: 'paused',
        //     pausedAt: firebase.firestore.FieldValue.serverTimestamp(),
        //     isActive: false,
        //     lastModified: firebase.firestore.FieldValue.serverTimestamp()
        // });
        
        // Update status in mock data for demonstration
        updateJobStatusInMockData(jobData.jobId, 'paused');
        
        // Update the status badge in the UI immediately
        const statusBadge = document.querySelector(`[data-job-id="${jobData.jobId}"] .status-badge`);
        if (statusBadge) {
            statusBadge.textContent = 'PAUSED';
            statusBadge.className = 'status-badge status-paused';
        }
        
        console.log(`⏸️ Job ${jobData.jobId} paused successfully`);
        console.log(`📊 Status updated: active → paused`);
        console.log(`🔄 UI updated to show paused status`);
        
    } catch (error) {
        console.error(`❌ Error pausing job ${jobData.jobId}:`, error);
        // Show error notification to user
        showErrorNotification('Failed to pause job. Please try again.');
    }
}

async function handleDeleteJob(jobData) {
    console.log(`🗑️ DELETE job: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    // Get full job data for confirmation dialog
    const fullJobData = getJobDataById(jobData.jobId);
    const confirmationData = { ...jobData, ...fullJobData };
    
    // Show confirmation dialog before deleting
    const confirmed = await showDeleteConfirmationDialog(confirmationData);
    if (!confirmed) return;
    
    try {
        // Firebase data mapping for delete:
        // 1. Delete job document: db.collection('jobs').doc(jobData.jobId).delete()
        // 2. Delete related applications: 
        //    const applicationsRef = db.collection('applications').where('jobId', '==', jobData.jobId);
        //    const applicationsSnapshot = await applicationsRef.get();
        //    const batch = db.batch();
        //    applicationsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        //    await batch.commit();
        // 3. Delete job images from Storage:
        //    const storageRef = firebase.storage().ref(`jobs/${jobData.jobId}/`);
        //    await deleteJobImages(storageRef);
        // 4. Update user's job count:
        //    db.collection('users').doc(jobData.posterId).update({
        //        activeJobsCount: firebase.firestore.FieldValue.increment(-1),
        //        totalJobsPosted: firebase.firestore.FieldValue.increment(-1)
        //    });
        
        console.log(`🗑️ Job ${jobData.jobId} deleted successfully`);
        console.log(`📄 Job document removed from Firestore`);
        console.log(`📝 Related applications cleaned up`);
        console.log(`🖼️ Job images removed from Storage`);
        console.log(`👤 User stats updated`);
        
        // Refresh listings to remove deleted job
        await refreshListingsAfterDeletion(jobData.jobId);
        
        // Show success notification
        showSuccessNotification('Job deleted successfully');
        
    } catch (error) {
        console.error(`❌ Error deleting job ${jobData.jobId}:`, error);
                 showErrorNotification('Failed to delete job. Please try again.');
     }
}

// ========================== FIREBASE HELPER FUNCTIONS ==========================

async function refreshListingsAfterStatusChange() {
    // Reload listings data to reflect status changes
    console.log('🔄 Refreshing listings after status change...');
    
    // Firebase query: db.collection('jobs').where('posterId', '==', currentUserId).orderBy('datePosted', 'desc')
    // Update the listings container with fresh data
    const listingsContainer = document.querySelector('.listings-container');
    if (listingsContainer) {
        await loadListingsContent();
    }
}

async function refreshListingsAfterDeletion(deletedJobId) {
    // Remove deleted job from UI and refresh counts
    console.log(`🔄 Refreshing listings after deletion of ${deletedJobId}...`);
    
    // Remove the deleted card from DOM immediately
    const deletedCard = document.querySelector(`[data-job-id="${deletedJobId}"]`);
    if (deletedCard) {
        deletedCard.remove();
    }
    
    // Update tab notification counts
    await updateTabCounts();
    
    // If no jobs left, show empty state
    const remainingCards = document.querySelectorAll('.listing-card');
    if (remainingCards.length === 0) {
        showEmptyListingsState();
    }
}

async function showDeleteConfirmationDialog(jobData) {
    console.log(`⚠️ Showing delete confirmation for job: ${jobData.jobId}`);
    
    return new Promise((resolve) => {
        const overlay = document.getElementById('deleteConfirmationOverlay');
        const subtitle = document.getElementById('deleteConfirmationSubtitle');
        const applicationCount = document.getElementById('deleteApplicationCount');
        const cancelBtn = document.getElementById('deleteConfirmCancelBtn');
        const deleteBtn = document.getElementById('deleteConfirmDeleteBtn');
        
        // Update overlay content
        subtitle.textContent = `Are you sure you want to permanently delete "${jobData.title}"?`;
        
        // Show application count warning if there are applications
        const appCount = parseInt(jobData.applicationCount) || 0;
        if (appCount > 0) {
            applicationCount.innerHTML = `⚠️ This job has <strong>${appCount} application${appCount === 1 ? '' : 's'}</strong> that will also be deleted.`;
            applicationCount.style.display = 'block';
        } else {
            applicationCount.style.display = 'none';
        }
        
        // Show overlay
        overlay.classList.add('show');
        
        // Set up button handlers
        const handleCancel = () => {
            overlay.classList.remove('show');
            cancelBtn.removeEventListener('click', handleCancel);
            deleteBtn.removeEventListener('click', handleDelete);
            document.removeEventListener('keydown', handleEscape);
            resolve(false);
        };
        
        const handleDelete = () => {
            overlay.classList.remove('show');
            cancelBtn.removeEventListener('click', handleCancel);
            deleteBtn.removeEventListener('click', handleDelete);
            document.removeEventListener('keydown', handleEscape);
            resolve(true);
        };
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        
        // Add event listeners
        cancelBtn.addEventListener('click', handleCancel);
        deleteBtn.addEventListener('click', handleDelete);
        document.addEventListener('keydown', handleEscape);
        
        // Background click to cancel
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                handleCancel();
            }
        });
    });
}

function showSuccessNotification(message) {
    console.log(`✅ Success: ${message}`);
    // TODO: Implement toast notification system
    // Create temporary notification overlay or toast
}

function showErrorNotification(message) {
    console.log(`❌ Error: ${message}`);
    // TODO: Implement error notification system
    // Create temporary error overlay or toast
}

function showEmptyListingsState() {
    const listingsContainer = document.querySelector('.listings-container');
    if (!listingsContainer) return;
    
    listingsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">No Job Listings</div>
            <div class="empty-state-message">
                You haven't posted any jobs yet.<br>
                Start by creating your first job posting.
            </div>
            <a href="new-post.html" class="empty-state-btn">Post Your First Job</a>
        </div>
    `;
}

async function updateTabCounts() {
    // Update notification counts on tabs after job operations
    console.log('🔢 Updating tab notification counts...');
    
    // Firebase queries to get fresh counts:
    // - Active jobs: db.collection('jobs').where('posterId', '==', currentUserId).where('status', '==', 'active').get()
    // - Hiring jobs: db.collection('jobs').where('posterId', '==', currentUserId).where('status', '==', 'hiring').get()
    // - Previous jobs: db.collection('jobs').where('posterId', '==', currentUserId).where('status', 'in', ['completed', 'cancelled']).get()
    
    // Update the notification badges
    const listingsCount = document.querySelector('#listingsTab .notification-count');
    const hiringCount = document.querySelector('#hiringTab .notification-count');
    const previousCount = document.querySelector('#previousTab .notification-count');
    
    // TODO: Replace with actual Firebase counts
    if (listingsCount) {
        const currentCount = parseInt(listingsCount.textContent) || 0;
        listingsCount.textContent = Math.max(0, currentCount - 1);
    }
}

function updateJobStatusInMockData(jobId, newStatus) {
    // Update status in the mock data for demonstration purposes
    console.log(`🔄 Updating mock data: ${jobId} → ${newStatus}`);
    
    // In production, this would be:
    // db.collection('jobs').doc(jobId).update({ 
    //     status: newStatus,
    //     lastModified: firebase.firestore.FieldValue.serverTimestamp()
    // });
    
    // For now, just log the change
    console.log(`📊 Mock data updated: Job ${jobId} status changed to ${newStatus}`);
} 