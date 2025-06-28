// GISUGO Jobs JavaScript

// ===== MEMORY LEAK PREVENTION SYSTEM =====
const CLEANUP_REGISTRY = {
    documentListeners: new Map(),
    elementListeners: new WeakMap(), 
    activeControllers: new Set(),
    intervals: new Set(),
    cleanupFunctions: new Set()
};

// ===== GLOBAL MOCK DATA STORE =====
// This simulates Firebase real-time updates for development
// In production, this will be replaced by Firebase listeners
let MOCK_LISTINGS_DATA = null;
let MOCK_HIRING_DATA = null;

// Current user ID for testing different perspectives
const CURRENT_USER_ID = 'user_peter_ang_001';

// ===== DATA ACCESS LAYER (Firebase-Ready) =====
// This layer abstracts data access to make Firebase transition seamless
const JobsDataService = {
    // Initialize data (simulates Firebase connection)
    initialize() {
        if (!MOCK_LISTINGS_DATA) {
            MOCK_LISTINGS_DATA = this._generateInitialData();
        }
        return MOCK_LISTINGS_DATA;
    },
    
    // Get all jobs (simulates Firebase query)
    async getAllJobs() {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // const currentUserId = firebase.auth().currentUser.uid;
        // 
        // const listingsSnapshot = await db.collection('jobs')
        //     .where('posterId', '==', currentUserId)
        //     .where('status', 'in', ['active', 'paused'])
        //     .orderBy('datePosted', 'desc')
        //     .get();
        // 
        // return listingsSnapshot.docs.map(doc => {
        //     const data = doc.data();
        //     return {
        //         jobId: doc.id,
        //         posterId: data.posterId,
        //         posterName: data.posterName,
        //         title: data.title,
        //         category: data.category,
        //         thumbnail: data.thumbnail,
        //         jobDate: data.scheduledDate,
        //         startTime: data.startTime,
        //         endTime: data.endTime,
        //         datePosted: data.datePosted,
        //         status: data.status,
        //         applicationCount: data.applicationCount || 0,
        //         applicationIds: data.applicationIds || [],
        //         jobPageUrl: `${data.category}.html`
        //     };
        // });
        
        return this.initialize();
    },
    
    // Get all hired jobs (simulates Firebase query)
    async getAllHiredJobs() {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // const currentUserId = firebase.auth().currentUser.uid;
        // 
        // const hiredJobsSnapshot = await db.collection('jobs')
        //     .where('status', '==', 'hired')
        //     .where(firebase.firestore.Filter.or(
        //         firebase.firestore.Filter.where('posterId', '==', currentUserId),
        //         firebase.firestore.Filter.where('hiredWorkerId', '==', currentUserId)
        //     ))
        //     .orderBy('hiredAt', 'desc')
        //     .get();
        // 
        // return hiredJobsSnapshot.docs.map(doc => {
        //     const data = doc.data();
        //     return {
        //         jobId: doc.id,
        //         posterId: data.posterId,
        //         posterName: data.posterName,
        //         posterThumbnail: data.posterThumbnail,
        //         title: data.title,
        //         category: data.category,
        //         thumbnail: data.thumbnail,
        //         jobDate: data.scheduledDate,
        //         startTime: data.startTime,
        //         endTime: data.endTime,
        //         priceOffer: data.priceOffer,
        //         datePosted: data.datePosted,
        //         dateHired: data.hiredAt,
        //         status: data.status,
        //         hiredWorkerId: data.hiredWorkerId,
        //         hiredWorkerName: data.hiredWorkerName,
        //         hiredWorkerThumbnail: data.hiredWorkerThumbnail,
        //         role: data.posterId === currentUserId ? 'customer' : 'worker'
        //     };
        // });
        
        if (!MOCK_HIRING_DATA) {
            MOCK_HIRING_DATA = this._generateHiredJobsData();
        }
        return MOCK_HIRING_DATA;
    },
    
    // Get single job (simulates Firebase doc get)
    async getJobById(jobId) {
        // Firebase: return await db.collection('jobs').doc(jobId).get()
        const jobs = this.initialize();
        return jobs.find(job => job.jobId === jobId);
    },
    
    // Update job status (simulates Firebase update)
    async updateJobStatus(jobId, newStatus) {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // 
        // await db.collection('jobs').doc(jobId).update({
        //     status: newStatus,
        //     lastModified: firebase.firestore.FieldValue.serverTimestamp(),
        //     modifiedBy: firebase.auth().currentUser.uid
        // });
        // 
        // return { success: true };
        
        const jobs = this.initialize();
        const jobIndex = jobs.findIndex(job => job.jobId === jobId);
        if (jobIndex !== -1) {
            jobs[jobIndex].status = newStatus;
            jobs[jobIndex].lastModified = new Date().toISOString();
            return { success: true };
        }
        return { success: false, error: 'Job not found' };
    },
    
    // Delete job (simulates Firebase delete)
    async deleteJob(jobId) {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // const batch = db.batch();
        // 
        // // Delete the job document
        // const jobRef = db.collection('jobs').doc(jobId);
        // batch.delete(jobRef);
        // 
        // // Delete all applications for this job
        // const applicationsSnapshot = await db.collection('applications')
        //     .where('jobId', '==', jobId).get();
        // applicationsSnapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        // });
        // 
        // // Create deletion record for audit trail
        // const deletionRef = db.collection('job_deletions').doc();
        // batch.set(deletionRef, {
        //     jobId: jobId,
        //     deletedBy: firebase.auth().currentUser.uid,
        //     deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
        //     reason: 'user_requested'
        // });
        // 
        // await batch.commit();
        // return { success: true };
        
        if (MOCK_LISTINGS_DATA) {
            const jobIndex = MOCK_LISTINGS_DATA.findIndex(job => job.jobId === jobId);
            if (jobIndex !== -1) {
                MOCK_LISTINGS_DATA.splice(jobIndex, 1);
                return { success: true };
            }
        }
        return { success: false, error: 'Job not found' };
    },
    
    // Clean up (prevents memory leaks)
    cleanup() {
        MOCK_LISTINGS_DATA = null;
        MOCK_HIRING_DATA = null;
    },
    
    // Private method to generate initial mock data
    _generateInitialData() {
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
                posterName: 'Mario Santos',
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
                posterId: 'user_carla_dela_cruz_003',
                posterName: 'Carla Dela Cruz',
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
    },
    
    // Private method to generate hired jobs mock data
    _generateHiredJobsData() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(today.getDate() - 2);
        
        const formatDateTime = (date) => date.toISOString();
        
        return [
            // Job where current user hired someone (customer perspective)
            {
                jobId: 'job_2024_hired_001',
                posterId: CURRENT_USER_ID, // Current user posted this job
                posterName: 'Peter J. Ang',
                title: 'Washing Dishes for Busy Restaurant During Peak Hours',
                category: 'limpyo',
                thumbnail: 'public/mock/mock-limpyo-post2.jpg',
                jobDate: '2024-01-20',
                startTime: '10AM',
                endTime: '2PM',
                priceOffer: '₱800',
                datePosted: formatDateTime(twoDaysAgo),
                dateHired: formatDateTime(yesterday),
                status: 'hired',
                hiredWorkerId: 'user_maria_santos_002',
                hiredWorkerName: 'Mario Santos',
                hiredWorkerThumbnail: 'public/users/User-02.jpg',
                role: 'customer' // Current user is the customer
            },
            
            // Job where current user was hired (worker perspective)
            {
                jobId: 'job_2024_hired_002',
                posterId: 'user_miguel_torres_006',
                posterName: 'Miguel Torres',
                posterThumbnail: 'public/users/User-06.jpg',
                title: 'Move Furniture to New Place',
                category: 'hakot',
                thumbnail: 'public/mock/mock-hakot-post3.jpg',
                jobDate: '2024-01-22',
                startTime: '8AM',
                endTime: '12PM',
                priceOffer: '₱1,200',
                datePosted: formatDateTime(twoDaysAgo),
                dateHired: formatDateTime(yesterday),
                status: 'hired',
                hiredWorkerId: CURRENT_USER_ID, // Current user was hired for this job
                hiredWorkerName: 'Peter J. Ang',
                hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg',
                role: 'worker' // Current user is the worker
            },
            
            // Another job where current user hired someone
            {
                jobId: 'job_2024_hired_003',
                posterId: CURRENT_USER_ID,
                posterName: 'Peter J. Ang',
                title: 'Weekly Grocery Shopping',
                category: 'kompra',
                thumbnail: 'public/mock/mock-kompra-post4.jpg',
                jobDate: '2024-01-25',
                startTime: '2PM',
                endTime: '4PM',
                priceOffer: '₱500',
                datePosted: formatDateTime(yesterday),
                dateHired: formatDateTime(today),
                status: 'hired',
                hiredWorkerId: 'user_ana_reyes_004',
                hiredWorkerName: 'Ana Reyes',
                hiredWorkerThumbnail: 'public/users/User-03.jpg',
                role: 'customer'
            },
            
            // Additional long title jobs for testing
            {
                jobId: 'job_2024_hired_004',
                posterId: 'user_elena_rodriguez_005',
                posterName: 'Elena Rodriguez',
                posterThumbnail: 'public/users/User-05.jpg',
                title: 'Professional Deep Cleaning of 4-Bedroom House Today',
                category: 'limpyo',
                thumbnail: 'public/mock/mock-limpyo-post5.jpg',
                jobDate: '2024-01-26',
                startTime: '9AM',
                endTime: '3PM',
                priceOffer: '₱1,500',
                datePosted: formatDateTime(yesterday),
                dateHired: formatDateTime(today),
                status: 'hired',
                hiredWorkerId: CURRENT_USER_ID,
                hiredWorkerName: 'Peter J. Ang',
                hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg',
                role: 'worker'
            },
            
                         {
                 jobId: 'job_2024_hired_005',
                 posterId: CURRENT_USER_ID,
                 posterName: 'Peter J. Ang',
                 title: 'Airport Pickup & Drop-off Service',
                 category: 'hatod',
                 thumbnail: 'public/mock/mock-hatod-post2.jpg',
                jobDate: '2024-01-28',
                startTime: '6AM',
                endTime: '10AM',
                priceOffer: '₱2,000',
                datePosted: formatDateTime(today),
                dateHired: formatDateTime(today),
                status: 'hired',
                hiredWorkerId: 'user_carla_dela_cruz_003',
                hiredWorkerName: 'Carla Dela Cruz',
                hiredWorkerThumbnail: 'public/users/User-04.jpg',
                role: 'customer'
            },
            
            {
                jobId: 'job_2024_hired_006',
                posterId: 'user_rosa_martinez_007',
                posterName: 'Ryan Martinez',
                posterThumbnail: 'public/users/User-07.jpg',
                title: 'Heavy Construction Materials Transport & Delivery',
                category: 'hakot',
                thumbnail: 'public/mock/mock-hakot-post4.jpg',
                jobDate: '2024-01-30',
                startTime: '7AM',
                endTime: '5PM',
                priceOffer: '₱3,000',
                datePosted: formatDateTime(twoDaysAgo),
                dateHired: formatDateTime(yesterday),
                status: 'hired',
                hiredWorkerId: CURRENT_USER_ID,
                hiredWorkerName: 'Peter J. Ang',
                hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg',
                role: 'worker'
            }
        ];
    }
};

function registerCleanup(type, key, cleanupFn) {
    if (type === 'function') {
        CLEANUP_REGISTRY.cleanupFunctions.add(cleanupFn);
    } else if (type === 'controller') {
        CLEANUP_REGISTRY.activeControllers.add(cleanupFn);
    } else if (type === 'interval') {
        CLEANUP_REGISTRY.intervals.add(cleanupFn);
    } else {
        // For overlay-specific cleanup (hiring, listings, confirmation, success)
        cleanupFn._type = type;
        cleanupFn._key = key;
        CLEANUP_REGISTRY.cleanupFunctions.add(cleanupFn);
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
    
    // ===== CLEANUP GLOBAL MOCK DATA =====
    // Prevent memory leaks and scope contamination
    JobsDataService.cleanup();
    console.log('🧹 Global mock data cleared');
    
    console.log('🧹 Jobs page cleanup completed');
}

function executeCleanupsByType(type) {
    console.log(`🧹 Executing cleanup functions for type: ${type}`);
    
    // Clean up functions registered for specific type
    const toRemove = [];
    CLEANUP_REGISTRY.cleanupFunctions.forEach((cleanupFn) => {
        if (typeof cleanupFn === 'function' && cleanupFn._type === type) {
            try {
                cleanupFn();
                toRemove.push(cleanupFn);
                console.log(`🧹 Executed cleanup for ${type}.${cleanupFn._key || 'unknown'}`);
            } catch (error) {
                console.warn(`Cleanup function error for type ${type}:`, error);
            }
        }
    });
    
    // Remove executed cleanup functions from the Set
    toRemove.forEach(cleanupFn => {
        CLEANUP_REGISTRY.cleanupFunctions.delete(cleanupFn);
    });
    
    console.log(`🧹 Cleanup completed for type: ${type} (${toRemove.length} functions)`);
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
document.addEventListener('DOMContentLoaded', async function() {
    initializeMenu();
    initializeTabs();
    // Initialize the first tab (listings) content
    await initializeActiveTab('listings');
    // Update tab counts based on actual data
    await updateTabCounts();
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
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const tabType = this.getAttribute('data-tab');
            await switchToTab(tabType);
        });
    });
}

async function switchToTab(tabType) {
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
    await initializeActiveTab(tabType);
    
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

async function initializeActiveTab(tabType) {
    console.log(`🚀 Initializing ${tabType} tab content`);
    
    switch (tabType) {
        case 'listings':
            await initializeListingsTab();
            break;
        case 'hiring':
            await initializeHiringTab();
            break;
        case 'previous':
            initializePreviousTab();
            break;
        default:
            console.warn('Unknown tab type:', tabType);
    }
}

async function initializeListingsTab() {
    const container = document.querySelector('.listings-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('📋 Listings tab already loaded');
        return;
    }
    
    // Load listings content
    await loadListingsContent();
    
    console.log('📋 Listings tab initialized');
}

async function loadListingsContent() {
    const container = document.querySelector('.listings-container');
    if (!container) return;
    
    // Generate mock listings data
    const mockListings = await generateMockListings();
    
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

async function generateMockListings() {
    // Use the data service layer for Firebase-ready data access
    return await JobsDataService.getAllJobs();
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
                month: 'short', 
                day: 'numeric' 
            });
        }
    }
}

function initializeListingCardHandlers() {
    const listingCards = document.querySelectorAll('.listing-card');
    
    listingCards.forEach(card => {
        card.addEventListener('click', async function(e) {
            e.preventDefault();
            const jobData = extractJobDataFromCard(this);
            await showListingOptionsOverlay(jobData);
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

async function showListingOptionsOverlay(jobData) {
    console.log(`🔧 Opening options overlay for job: ${jobData.jobId}`);
    
    const overlay = document.getElementById('listingOptionsOverlay');
    const title = document.getElementById('listingOptionsTitle');
    const subtitle = document.getElementById('listingOptionsSubtitle');
    const pauseBtn = document.getElementById('pauseJobBtn');
    
    // Get full job data to check current status
    const fullJobData = await getJobDataById(jobData.jobId);
    const currentStatus = fullJobData ? fullJobData.status : 'active';
    
    // Update overlay content
    title.textContent = 'Manage Job';
    subtitle.textContent = jobData.title;
    
    // Update pause/activate button text based on current status
    if (pauseBtn) {
        if (currentStatus === 'paused') {
            pauseBtn.textContent = 'ACTIVATE';
            pauseBtn.setAttribute('data-action', 'activate');
        } else {
            pauseBtn.textContent = 'PAUSE';
            pauseBtn.setAttribute('data-action', 'pause');
        }
    }
    
    // Store current job data for button handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-poster-id', jobData.posterId);
    overlay.setAttribute('data-category', jobData.category);
    overlay.setAttribute('data-job-page-url', jobData.jobPageUrl);
    overlay.setAttribute('data-current-status', currentStatus);
    
    // Show overlay
    overlay.classList.add('show');
    
    // Initialize overlay event handlers if not already done
    initializeOptionsOverlayHandlers();
}

// Helper function to get full job data by ID (for Firebase integration)
async function getJobDataById(jobId) {
    return await JobsDataService.getJobById(jobId);
}

// Helper function to get applications for a job (for Firebase integration)
function getApplicationsByJobId(jobId) {
    // Firebase Implementation:
    // const db = firebase.firestore();
    // 
    // const applicationsSnapshot = await db.collection('applications')
    //     .where('jobId', '==', jobId)
    //     .where('status', 'in', ['pending', 'accepted'])
    //     .orderBy('appliedAt', 'desc')
    //     .get();
    // 
    // return applicationsSnapshot.docs.map(doc => {
    //     const data = doc.data();
    //     return {
    //         applicationId: doc.id,
    //         jobId: data.jobId,
    //         applicantId: data.applicantId,
    //         applicantName: data.applicantName,
    //         applicantThumbnail: data.applicantThumbnail,
    //         appliedAt: data.appliedAt,
    //         status: data.status,
    //         message: data.message || ''
    //     };
    // });
    
    const jobData = getJobDataById(jobId);
    if (!jobData) return [];
    
    // For now, return mock application IDs
    return jobData.applicationIds;
}

async function initializeHiringTab() {
    const container = document.querySelector('.hiring-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('👥 Hiring tab already loaded');
        return;
    }
    
    console.log('👥 Loading hiring tab...');
    await loadHiringContent();
    console.log('👥 Hiring tab loaded, checking for captions and thumbnails...');
}

async function loadHiringContent() {
    const container = document.querySelector('.hiring-container');
    if (!container) return;
    
    try {
        const hiredJobs = await JobsDataService.getAllHiredJobs();
        
        if (!hiredJobs || hiredJobs.length === 0) {
            showEmptyHiringState();
            return;
        }
        
        const hiringHTML = await generateMockHiredJobs(hiredJobs);
        container.innerHTML = hiringHTML;
        
        // Initialize event handlers for hiring cards
        initializeHiringCardHandlers();
        
        console.log(`👥 Loaded ${hiredJobs.length} hired jobs`);
        
    } catch (error) {
        console.error('❌ Error loading hiring content:', error);
        container.innerHTML = `
            <div class="content-placeholder">
                ❌ Error loading hired jobs.<br>
                Please try refreshing the page.
            </div>
        `;
    }
}

async function generateMockHiredJobs(hiredJobs) {
    return hiredJobs.map(job => generateHiringCardHTML(job)).join('');
}

function generateHiringCardHTML(job) {
    const roleClass = job.role; // 'customer' or 'worker'
    
    // Determine role caption and user info based on perspective
    let roleCaption, userThumbnail, userName;
    if (job.role === 'customer') {
        // Customer perspective: I hired someone, show the worker's thumbnail
        roleCaption = `YOU HIRED ${job.hiredWorkerName.toUpperCase()}`;
        userThumbnail = job.hiredWorkerThumbnail;
        userName = job.hiredWorkerName;
    } else {
        // Worker perspective: I'm working for someone, show the customer's thumbnail
        roleCaption = `WORKING FOR ${job.posterName.toUpperCase()}`;
        // For worker cards, we need the poster's thumbnail (customer who posted the job)
        userThumbnail = job.posterThumbnail || 'public/users/User-04.jpg';
        userName = job.posterName;
    }
    
    return `
        <div class="hiring-card ${roleClass}" 
             data-job-id="${job.jobId}"
             data-poster-id="${job.posterId}"
             data-category="${job.category}"
             data-role="${job.role}"
             data-hired-worker-id="${job.hiredWorkerId}"
             data-hired-worker-name="${job.hiredWorkerName}">
            
            <div class="hiring-title">${job.title}</div>
            
            <div class="hiring-date-time-row">
                <div class="hiring-date-part">
                    <span class="hiring-date-label">DUE:</span>
                    <span class="hiring-date-value">${formatJobDate(job.jobDate)}</span>
                </div>
                <div class="hiring-time-part">
                    <span class="hiring-time-label">FROM:</span>
                    <span class="hiring-time-value">${formatTime(job.startTime)}</span>
                    <span class="hiring-time-label">TO:</span>
                    <span class="hiring-time-value">${formatTime(job.endTime)}</span>
                </div>
            </div>
            
            <div class="hiring-main-row">
                <div class="hiring-thumbnail">
                    <img src="${job.thumbnail}" alt="${job.title}" loading="lazy">
                </div>
                
                <div class="hiring-content">
                    <div class="hiring-left-content">
                        <div class="hiring-price">${job.priceOffer}</div>
                        <div class="hiring-role-caption ${roleClass}">${roleCaption}</div>
                    </div>
                    <div class="hiring-right-content">
                        <div class="hiring-user-thumbnail">
                            <img src="${userThumbnail}" alt="${userName}" loading="lazy">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initializeHiringCardHandlers() {
    const hiringCards = document.querySelectorAll('.hiring-card');
    
    hiringCards.forEach(card => {
        const clickHandler = function(e) {
            e.preventDefault();
            const jobData = extractHiringJobDataFromCard(card);
            showHiringOptionsOverlay(jobData);
        };
        
        card.addEventListener('click', clickHandler);
        
        // Store handler for cleanup
        if (!CLEANUP_REGISTRY.elementListeners.has(card)) {
            CLEANUP_REGISTRY.elementListeners.set(card, []);
        }
        CLEANUP_REGISTRY.elementListeners.get(card).push(['click', clickHandler]);
    });
    
    console.log(`🔧 Initialized ${hiringCards.length} hiring card handlers`);
}

function extractHiringJobDataFromCard(cardElement) {
    return {
        jobId: cardElement.getAttribute('data-job-id'),
        posterId: cardElement.getAttribute('data-poster-id'),
        category: cardElement.getAttribute('data-category'),
        role: cardElement.getAttribute('data-role'),
        hiredWorkerId: cardElement.getAttribute('data-hired-worker-id'),
        hiredWorkerName: cardElement.getAttribute('data-hired-worker-name'),
        title: cardElement.querySelector('.hiring-title')?.textContent || 'Unknown Job'
    };
}

async function showHiringOptionsOverlay(jobData) {
    console.log('👥 Show hiring options for:', jobData);
    
    const overlay = document.getElementById('hiringOptionsOverlay');
    const title = document.getElementById('hiringOptionsTitle');
    const subtitle = document.getElementById('hiringOptionsSubtitle');
    const actionsContainer = document.getElementById('hiringOptionsActions');
    
    if (!overlay || !actionsContainer) {
        console.error('❌ Hiring overlay elements not found');
        return;
    }
    
    // Set overlay data attributes
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-role', jobData.role);
    overlay.setAttribute('data-title', jobData.title);
    
    // Update title and subtitle
    title.textContent = 'Manage Hiring';
    subtitle.textContent = `Choose an action for "${jobData.title}"`;
    
    // Generate buttons based on role
    let buttonsHTML = '';
    
    if (jobData.role === 'customer') {
        // Customer perspective: You hired someone
        buttonsHTML = `
            <button class="listing-option-btn modify" id="completeJobBtn">
                MARK AS COMPLETED
            </button>
            <button class="listing-option-btn pause" id="relistJobBtn">
                RELIST JOB (Void Current Hire)
            </button>
            <button class="listing-option-btn cancel" id="cancelHiringBtn">
                CLOSE
            </button>
        `;
    } else if (jobData.role === 'worker') {
        // Worker perspective: You were hired
        buttonsHTML = `
            <button class="listing-option-btn delete" id="resignJobBtn">
                RESIGN FROM JOB
            </button>
            <button class="listing-option-btn cancel" id="cancelHiringBtn">
                CLOSE
            </button>
        `;
    }
    
    actionsContainer.innerHTML = buttonsHTML;
    
    // Initialize handlers for the dynamically created buttons
    initializeHiringOverlayHandlers();
    
    // Show overlay
    overlay.classList.add('show');
    console.log(`👥 Hiring overlay shown for ${jobData.role} role`);
}

function initializeHiringOverlayHandlers() {
    const overlay = document.getElementById('hiringOptionsOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;
    
    const completeBtn = document.getElementById('completeJobBtn');
    const relistBtn = document.getElementById('relistJobBtn');
    const resignBtn = document.getElementById('resignJobBtn');
    const cancelBtn = document.getElementById('cancelHiringBtn');
    
    // Complete job handler (customer)
    if (completeBtn) {
        const completeHandler = function(e) {
            e.preventDefault();
            const jobData = getHiringJobDataFromOverlay();
            handleCompleteJob(jobData);
        };
        completeBtn.addEventListener('click', completeHandler);
        registerCleanup('hiring', 'completeBtn', () => {
            completeBtn.removeEventListener('click', completeHandler);
        });
    }
    
    // Relist job handler (customer)
    if (relistBtn) {
        const relistHandler = function(e) {
            e.preventDefault();
            const jobData = getHiringJobDataFromOverlay();
            handleRelistJob(jobData);
        };
        relistBtn.addEventListener('click', relistHandler);
        registerCleanup('hiring', 'relistBtn', () => {
            relistBtn.removeEventListener('click', relistHandler);
        });
    }
    
    // Resign job handler (worker)
    if (resignBtn) {
        const resignHandler = function(e) {
            e.preventDefault();
            const jobData = getHiringJobDataFromOverlay();
            handleResignJob(jobData);
        };
        resignBtn.addEventListener('click', resignHandler);
        registerCleanup('hiring', 'resignBtn', () => {
            resignBtn.removeEventListener('click', resignHandler);
        });
    }
    
    // Cancel handler
    if (cancelBtn) {
        const cancelHandler = function(e) {
            e.preventDefault();
            hideHiringOptionsOverlay();
        };
        cancelBtn.addEventListener('click', cancelHandler);
        registerCleanup('hiring', 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }
    
    // Background click handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            hideHiringOptionsOverlay();
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup('hiring', 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });
    
    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideHiringOptionsOverlay();
        }
    };
    addDocumentListener('overlayEscape', escapeHandler);
    
    overlay.dataset.handlersInitialized = 'true';
    console.log('👥 Hiring overlay handlers initialized with cleanup');
}

function getHiringJobDataFromOverlay() {
    const overlay = document.getElementById('hiringOptionsOverlay');
    return {
        jobId: overlay.getAttribute('data-job-id'),
        role: overlay.getAttribute('data-role'),
        title: overlay.getAttribute('data-title')
    };
}

function hideHiringOptionsOverlay() {
    const overlay = document.getElementById('hiringOptionsOverlay');
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to allow re-initialization
    delete overlay.dataset.handlersInitialized;
    
    // Clean up all hiring overlay handlers
    executeCleanupsByType('hiring');
    
    console.log('👥 Hiring overlay hidden and handlers cleaned up');
}

async function handleCompleteJob(jobData) {
    console.log(`✅ COMPLETE job: ${jobData.jobId} (Customer perspective)`);
    hideHiringOptionsOverlay();
    
    // Get worker name from job data
    const hiredJobs = await JobsDataService.getAllHiredJobs();
    const job = hiredJobs.find(j => j.jobId === jobData.jobId);
    const workerName = job ? job.hiredWorkerName : 'the worker';
    
    // Show completion confirmation overlay
    const overlay = document.getElementById('completeJobConfirmationOverlay');
    const subtitle = document.getElementById('completeJobSubtitle');
    
    subtitle.textContent = `Please confirm that "${jobData.title}" has been completed`;
    
    // Store job data for confirmation handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-job-title', jobData.title);
    overlay.setAttribute('data-worker-name', workerName);
    
    overlay.classList.add('show');
    
    // Initialize confirmation handlers
    initializeCompleteJobConfirmationHandlers();
}

async function handleRelistJob(jobData) {
    console.log(`🔄 RELIST job: ${jobData.jobId} (Customer perspective)`);
    hideHiringOptionsOverlay();
    
    // Get worker name from job data
    const hiredJobs = await JobsDataService.getAllHiredJobs();
    const job = hiredJobs.find(j => j.jobId === jobData.jobId);
    const workerName = job ? job.hiredWorkerName : 'the worker';
    
    // Show relist confirmation overlay
    const overlay = document.getElementById('relistJobConfirmationOverlay');
    const subtitle = document.getElementById('relistJobSubtitle');
    const workerNameSpan = document.getElementById('relistWorkerName');
    const workerNameReminderSpan = document.getElementById('relistWorkerNameReminder');
    const workerNameInputSpan = document.getElementById('relistWorkerNameInput');
    const reasonInput = document.getElementById('relistReasonInput');
    const charCount = document.getElementById('relistCharCount');
    const reasonError = document.getElementById('relistReasonError');
    const yesBtn = document.getElementById('relistJobYesBtn');
    
    subtitle.textContent = `This will void the contract with ${workerName}`;
    workerNameSpan.textContent = workerName;
    workerNameReminderSpan.textContent = workerName;
    workerNameInputSpan.textContent = workerName;
    
    // Reset form state and button text for hiring context
    if (reasonInput) {
        reasonInput.value = '';
        charCount.textContent = '0';
        reasonError.classList.remove('show');
        yesBtn.disabled = true;
    }
    
    // Reset button text for hiring job context
    const noBtn = document.getElementById('relistJobNoBtn');
    if (noBtn) noBtn.textContent = 'NO, KEEP CONTRACT';
    if (yesBtn) yesBtn.textContent = 'YES, VOID & RELIST';
    
    // Store job data for confirmation handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-job-title', jobData.title);
    overlay.setAttribute('data-worker-name', workerName);
    overlay.removeAttribute('data-relist-type'); // Clear previous relist type
    
    overlay.classList.add('show');
    
    // Initialize confirmation handlers
    initializeRelistJobConfirmationHandlers();
}

async function handleResignJob(jobData) {
    console.log(`👋 RESIGN from job: ${jobData.jobId} (Worker perspective)`);
    hideHiringOptionsOverlay();
    
    // Get customer name from job data
    const hiredJobs = await JobsDataService.getAllHiredJobs();
    const job = hiredJobs.find(j => j.jobId === jobData.jobId);
    const customerName = job ? job.posterName : 'the customer';
    
    // Show resign confirmation overlay
    const overlay = document.getElementById('resignJobConfirmationOverlay');
    const subtitle = document.getElementById('resignJobSubtitle');
    const customerNameSpan = document.getElementById('resignCustomerName');
    const reasonInput = document.getElementById('resignReasonInput');
    const charCount = document.getElementById('resignCharCount');
    const reasonError = document.getElementById('resignReasonError');
    const yesBtn = document.getElementById('resignJobYesBtn');
    
    subtitle.textContent = `This will void your contract with ${customerName}`;
    customerNameSpan.textContent = customerName;
    
    // Reset form state
    if (reasonInput) {
        reasonInput.value = '';
        charCount.textContent = '0';
        reasonError.classList.remove('show');
        yesBtn.disabled = true;
    }
    
    // Store job data for confirmation handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-job-title', jobData.title);
    overlay.setAttribute('data-customer-name', customerName);
    
    overlay.classList.add('show');
    
    // Initialize confirmation handlers
    initializeResignJobConfirmationHandlers();
}

// ========================== CONFIRMATION OVERLAY HANDLERS ==========================

function initializeCompleteJobConfirmationHandlers() {
    const yesBtn = document.getElementById('completeJobYesBtn');
    const noBtn = document.getElementById('completeJobNoBtn');
    
    // Clear any existing handlers to prevent duplicates
    if (yesBtn) {
        yesBtn.onclick = null;
        const yesHandler = async function() {
            const overlay = document.getElementById('completeJobConfirmationOverlay');
            const jobId = overlay.getAttribute('data-job-id');
            const jobTitle = overlay.getAttribute('data-job-title');
            const workerName = overlay.getAttribute('data-worker-name');
            
            // Hide confirmation overlay
            overlay.classList.remove('show');
            
            // Firebase Implementation - Mark job as completed:
            // const db = firebase.firestore();
            // const batch = db.batch();
            // 
            // // Update job status to completed
            // const jobRef = db.collection('jobs').doc(jobId);
            // batch.update(jobRef, {
            //     status: 'completed',
            //     completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     completedBy: 'customer',
            //     completionConfirmed: true
            // });
            // 
            // // Create completion record for tracking
            // const completionRef = db.collection('job_completions').doc();
            // batch.set(completionRef, {
            //     jobId: jobId,
            //     completedBy: firebase.auth().currentUser.uid,
            //     completedAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     workerNotified: false
            // });
            // 
            // await batch.commit();
            
            // Store job ID for data manipulation
            const successOverlay = document.getElementById('jobCompletedSuccessOverlay');
            successOverlay.setAttribute('data-completed-job-id', jobId);
            
            // Show success overlay with worker name for feedback
            showJobCompletedSuccess(jobTitle, workerName);
        };
        yesBtn.addEventListener('click', yesHandler);
        registerCleanup('confirmation', 'completeYes', () => {
            yesBtn.removeEventListener('click', yesHandler);
        });
    }
    
    if (noBtn) {
        noBtn.onclick = null;
        const noHandler = function() {
            document.getElementById('completeJobConfirmationOverlay').classList.remove('show');
        };
        noBtn.addEventListener('click', noHandler);
        registerCleanup('confirmation', 'completeNo', () => {
            noBtn.removeEventListener('click', noHandler);
        });
    }
}

function initializeRelistJobConfirmationHandlers() {
    const yesBtn = document.getElementById('relistJobYesBtn');
    const noBtn = document.getElementById('relistJobNoBtn');
    const reasonInput = document.getElementById('relistReasonInput');
    const charCount = document.getElementById('relistCharCount');
    const reasonError = document.getElementById('relistReasonError');
    
    // Initialize input validation handlers
    if (reasonInput) {
        const inputHandler = function() {
            const text = reasonInput.value;
            const length = text.length;
            
            // Update character count
            charCount.textContent = length;
            
            // Check minimum length requirement
            if (length >= 2) {
                yesBtn.disabled = false;
                reasonError.classList.remove('show');
            } else {
                yesBtn.disabled = true;
                if (length > 0) {
                    reasonError.classList.add('show');
                }
            }
        };
        
        // Focus handler for mobile keyboard positioning
        const focusHandler = function() {
            // Mark overlay as having active input (for iOS Safari keyboard detection)
            const overlay = document.getElementById('relistJobConfirmationOverlay');
            overlay.classList.add('input-focused');
            
            // Small delay to allow keyboard to appear
            setTimeout(() => {
                reasonInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        };
        
        // Blur handler to remove focused state
        const blurHandler = function() {
            const overlay = document.getElementById('relistJobConfirmationOverlay');
            overlay.classList.remove('input-focused');
        };
        
        reasonInput.addEventListener('input', inputHandler);
        reasonInput.addEventListener('focus', focusHandler);
        reasonInput.addEventListener('blur', blurHandler);
        registerCleanup('confirmation', 'relistInput', () => {
            reasonInput.removeEventListener('input', inputHandler);
            reasonInput.removeEventListener('focus', focusHandler);
            reasonInput.removeEventListener('blur', blurHandler);
        });
    }
    
    // Clear any existing handlers to prevent duplicates
    if (yesBtn) {
        yesBtn.onclick = null;
        const yesHandler = async function() {
            const overlay = document.getElementById('relistJobConfirmationOverlay');
            const jobId = overlay.getAttribute('data-job-id');
            const jobTitle = overlay.getAttribute('data-job-title');
            const relistType = overlay.getAttribute('data-relist-type');
            const reason = reasonInput ? reasonInput.value.trim() : '';
            
            // Validate reason input
            if (!reason || reason.length < 2) {
                reasonError.classList.add('show');
                return;
            }
            
            // Hide confirmation overlay
            overlay.classList.remove('show');
            
            if (relistType === 'completed') {
                // Handle completed job relisting - create draft
                console.log(`🔄 Creating job draft from completed job: ${jobId}`);
                
                // Get the completed job data to copy
                const completedJobs = await getCompletedJobs();
                const sourceJob = completedJobs.find(j => j.jobId === jobId);
                
                if (sourceJob) {
                    // Create new draft based on completed job
                    // In Firebase, this would create a new job document with status: 'draft'
                    showSuccessNotification(`Job draft created! You can now edit details and repost "${jobTitle}".`);
                    
                    // Navigate to new-post.html with pre-filled data for editing
                    // In real implementation: window.location.href = `/new-post.html?draft=${newDraftId}`;
                    setTimeout(() => {
                        showSuccessNotification('Draft feature not yet implemented - would redirect to edit page');
                    }, 2000);
                } else {
                    showErrorNotification('Failed to find job data for relisting');
                }
            } else {
                // Handle hiring job relisting - void contract
                const workerName = overlay.getAttribute('data-worker-name');
                
                // Firebase Implementation - Void contract and relist job:
                // [Firebase code stays the same as before for hiring jobs]
                
                // Store job ID for data manipulation
                const negativeOverlay = document.getElementById('contractVoidedNegativeOverlay');
                negativeOverlay.setAttribute('data-relisted-job-id', jobId);
                
                // Show contract voided with negative theme (since we're breaking a contract)
                showContractVoidedNegative(jobTitle, workerName);
            }
        };
        yesBtn.addEventListener('click', yesHandler);
        registerCleanup('confirmation', 'relistYes', () => {
            yesBtn.removeEventListener('click', yesHandler);
        });
    }
    
    if (noBtn) {
        noBtn.onclick = null;
        const noHandler = function() {
            document.getElementById('relistJobConfirmationOverlay').classList.remove('show');
        };
        noBtn.addEventListener('click', noHandler);
        registerCleanup('confirmation', 'relistNo', () => {
            noBtn.removeEventListener('click', noHandler);
        });
    }
}

function initializeResignJobConfirmationHandlers() {
    const yesBtn = document.getElementById('resignJobYesBtn');
    const noBtn = document.getElementById('resignJobNoBtn');
    const reasonInput = document.getElementById('resignReasonInput');
    const charCount = document.getElementById('resignCharCount');
    const reasonError = document.getElementById('resignReasonError');
    
    // Initialize input validation handlers
    if (reasonInput) {
        const inputHandler = function() {
            const text = reasonInput.value;
            const length = text.length;
            
            // Update character count
            charCount.textContent = length;
            
            // Check minimum length requirement
            if (length >= 2) {
                yesBtn.disabled = false;
                reasonError.classList.remove('show');
            } else {
                yesBtn.disabled = true;
                if (length > 0) {
                    reasonError.classList.add('show');
                }
            }
        };
        
        // Focus handler for mobile keyboard positioning
        const focusHandler = function() {
            // Mark overlay as having active input (for iOS Safari keyboard detection)
            const overlay = document.getElementById('resignJobConfirmationOverlay');
            overlay.classList.add('input-focused');
            
            // Small delay to allow keyboard to appear
            setTimeout(() => {
                reasonInput.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        };
        
        // Blur handler to remove focused state
        const blurHandler = function() {
            const overlay = document.getElementById('resignJobConfirmationOverlay');
            overlay.classList.remove('input-focused');
        };
        
        reasonInput.addEventListener('input', inputHandler);
        reasonInput.addEventListener('focus', focusHandler);
        reasonInput.addEventListener('blur', blurHandler);
        registerCleanup('confirmation', 'resignInput', () => {
            reasonInput.removeEventListener('input', inputHandler);
            reasonInput.removeEventListener('focus', focusHandler);
            reasonInput.removeEventListener('blur', blurHandler);
        });
    }
    
    // Clear any existing handlers to prevent duplicates
    if (yesBtn) {
        yesBtn.onclick = null;
        const yesHandler = async function() {
            const overlay = document.getElementById('resignJobConfirmationOverlay');
            const jobId = overlay.getAttribute('data-job-id');
            const jobTitle = overlay.getAttribute('data-job-title');
            const customerName = overlay.getAttribute('data-customer-name');
            const reason = reasonInput ? reasonInput.value.trim() : '';
            
            // Validate reason input
            if (!reason || reason.length < 2) {
                reasonError.classList.add('show');
                return;
            }
            
            // Hide confirmation overlay
            overlay.classList.remove('show');
            
            // Firebase Implementation - Worker resignation:
            // const db = firebase.firestore();
            // const batch = db.batch();
            // const currentUserId = 'current-user-id'; // Get from auth
            // 
            // // Update job to active status and remove hired worker data
            // const jobRef = db.collection('jobs').doc(jobId);
            // batch.update(jobRef, {
            //     status: 'active',
            //     hiredWorkerId: firebase.firestore.FieldValue.delete(),
            //     hiredWorkerName: firebase.firestore.FieldValue.delete(),
            //     hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
            //     hiredAt: firebase.firestore.FieldValue.delete(),
            //     resignedAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     resignedBy: 'worker',
            //     resignationReason: reason,
            //     applicationCount: 0,
            //     datePosted: firebase.firestore.FieldValue.serverTimestamp() // Refresh posting date
            // });
            // 
            // // Create notification for the customer
            // const notificationRef = db.collection('notifications').doc();
            // batch.set(notificationRef, {
            //     recipientId: customerName, // Should be posterId in real implementation
            //     type: 'worker_resigned',
            //     jobId: jobId,
            //     jobTitle: jobTitle,
            //     message: `The worker has resigned from "${jobTitle}". Reason: ${reason}. Your job is now active for new applications.`,
            //     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     read: false
            // });
            // 
            // // Create admin dashboard record for resignation tracking
            // const resignationRef = db.collection('user_termination_records').doc();
            // batch.set(resignationRef, {
            //     customerId: customerName, // Should be posterId
            //     workerId: currentUserId,
            //     jobId: jobId,
            //     jobTitle: jobTitle,
            //     reason: reason,
            //     terminatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     type: 'worker_resigned'
            // });
            // 
            // // Update worker's resignation count
            // const workerStatsRef = db.collection('user_admin_stats').doc(currentUserId);
            // batch.set(workerStatsRef, {
            //     resignationCount: firebase.firestore.FieldValue.increment(1),
            //     lastResignationAt: firebase.firestore.FieldValue.serverTimestamp()
            // }, { merge: true });
            // 
            // await batch.commit();
            
            // Store job ID for data manipulation
            const resignationOverlay = document.getElementById('resignationConfirmedOverlay');
            resignationOverlay.setAttribute('data-resigned-job-id', jobId);
            
            // Show resignation confirmation with disappointed theme
            showResignationConfirmed(jobTitle, customerName);
        };
        yesBtn.addEventListener('click', yesHandler);
        registerCleanup('confirmation', 'resignYes', () => {
            yesBtn.removeEventListener('click', yesHandler);
        });
    }
    
    if (noBtn) {
        noBtn.onclick = null;
        const noHandler = function() {
            document.getElementById('resignJobConfirmationOverlay').classList.remove('show');
        };
        noBtn.addEventListener('click', noHandler);
        registerCleanup('confirmation', 'resignNo', () => {
            noBtn.removeEventListener('click', noHandler);
        });
    }
}

function showJobCompletedSuccess(jobTitle, workerName) {
    const overlay = document.getElementById('jobCompletedSuccessOverlay');
    const message = document.getElementById('jobCompletedMessage');
    const workerNameSpan = document.getElementById('completedWorkerName');
    const submitBtn = document.getElementById('jobCompletedOkBtn');
    
    message.textContent = `"${jobTitle}" has been marked as completed successfully!`;
    workerNameSpan.textContent = workerName;
    
    // Initialize feedback systems
    initializeFeedbackStarRating();
    initializeFeedbackCharacterCount();
    
    // Clear any existing handler and add new one with cleanup
    submitBtn.onclick = null;
    const submitHandler = async function() {
        // Get feedback data
        const rating = getFeedbackRating();
        const feedbackText = document.getElementById('completionFeedback').value.trim();
        
        // Get job and user data for Firebase integration
        const jobId = overlay.getAttribute('data-completed-job-id');
        const hiredJobs = await JobsDataService.getAllHiredJobs();
        const job = hiredJobs.find(j => j.jobId === jobId);
        
        // Validate required fields
        if (rating === 0) {
            showErrorNotification('Please select a star rating before submitting');
            return;
        }
        
        if (feedbackText.length < 2) {
            showErrorNotification('Please provide feedback with at least 2 characters');
            return;
        }
        
        if (job) {
            // Submit feedback to Firebase (or mock for development)
            try {
                await submitJobCompletionFeedback(
                    jobId,
                    job.hiredWorkerId || 'worker-user-id',
                    CURRENT_USER_ID,
                    rating,
                    feedbackText
                );
                console.log(`✅ Feedback submitted successfully for job ${jobId}`);
            } catch (error) {
                console.error('❌ Error submitting feedback:', error);
            }
        }
        
        overlay.classList.remove('show');
        
        // Find and slide out the card first
        const completedJobId = overlay.getAttribute('data-completed-job-id');
        const cardToRemove = document.querySelector(`[data-job-id="${completedJobId}"]`);
        
        // Slide out card and show toast
        await slideOutCard(cardToRemove, 'right');
        showSuccessNotification('Job completed and feedback submitted');
        
        // Remove completed job from hiring data and transfer to completed data
        if (completedJobId && MOCK_HIRING_DATA) {
            const completedJob = MOCK_HIRING_DATA.find(job => job.jobId === completedJobId);
            if (completedJob) {
                // Add to completed jobs data
                await addJobToCompletedData(completedJob, rating, feedbackText);
                
                // Remove from hiring data
                MOCK_HIRING_DATA = MOCK_HIRING_DATA.filter(job => job.jobId !== completedJobId);
                console.log(`✅ Transferred completed job ${completedJobId} from Hiring to Previous tab`);
            }
        }
        
        // Reset feedback form for next use
        resetFeedbackForm();
        
        // Refresh hiring tab content to remove completed job and previous tab to show new job
        await loadHiringContent();
        await loadPreviousContent();
        // Update tab counts
        await updateTabCounts();
    };
    submitBtn.addEventListener('click', submitHandler);
    registerCleanup('success', 'jobCompletedOk', () => {
        submitBtn.removeEventListener('click', submitHandler);
    });
    
    overlay.classList.add('show');
}

// Initialize star rating functionality
function initializeFeedbackStarRating() {
    const stars = document.querySelectorAll('.feedback-star');
    let currentRating = 0;
    
    stars.forEach((star, index) => {
        const rating = index + 1;
        
        // Remove existing event listeners to prevent duplicates
        star.replaceWith(star.cloneNode(true));
    });
    
    // Re-select stars after cloning to remove listeners
    const newStars = document.querySelectorAll('.feedback-star');
    
    newStars.forEach((star, index) => {
        const rating = index + 1;
        
        // Hover effect
        star.addEventListener('mouseenter', () => {
            highlightStars(rating, newStars);
        });
        
        // Click to select rating
        star.addEventListener('click', () => {
            currentRating = rating;
            selectStars(rating, newStars);
            updateJobCompletionSubmitButtonState();
        });
    });
    
    // Reset to current rating when mouse leaves container
    const starsContainer = document.querySelector('.feedback-stars-container');
    starsContainer.addEventListener('mouseleave', () => {
        if (currentRating > 0) {
            selectStars(currentRating, newStars);
        } else {
            clearStars(newStars);
        }
    });
}

// Highlight stars on hover
function highlightStars(rating, stars) {
    stars.forEach((star, index) => {
        star.classList.remove('filled', 'hover');
        if (index < rating) {
            star.classList.add('hover');
        }
    });
}

// Select stars on click
function selectStars(rating, stars) {
    stars.forEach((star, index) => {
        star.classList.remove('filled', 'hover');
        if (index < rating) {
            star.classList.add('filled');
        }
    });
}

// Clear all star highlights
function clearStars(stars) {
    stars.forEach(star => {
        star.classList.remove('filled', 'hover');
    });
}

// Get current feedback rating
function getFeedbackRating() {
    const filledStars = document.querySelectorAll('.feedback-star.filled');
    return filledStars.length;
}

// Firebase Integration Structure for Job Completion Feedback
// This will replace the console.log when backend is ready
async function submitJobCompletionFeedback(jobId, workerUserId, customerUserId, rating, feedbackText) {
    // Firebase Implementation:
    // const db = firebase.firestore();
    // const batch = db.batch();
    // const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    // 
    // // 1. Create review record in reviews collection
    // const reviewRef = db.collection('reviews').doc();
    // batch.set(reviewRef, {
    //     reviewId: reviewRef.id,
    //     jobId: jobId,
    //     reviewerUserId: customerUserId,        // Customer leaving review
    //     revieweeUserId: workerUserId,          // Worker being reviewed
    //     reviewerRole: 'customer',
    //     revieweeRole: 'worker',
    //     rating: rating,                        // 1-5 stars
    //     feedbackText: feedbackText,           // Optional text feedback
    //     createdAt: timestamp,
    //     modifiedAt: timestamp,
    //     status: 'active',
    //     helpful: 0,                           // For future voting system
    //     reported: false
    // });
    // 
    // // 2. Update worker's aggregate rating stats
    // const workerStatsRef = db.collection('user_stats').doc(workerUserId);
    // const workerStatsDoc = await workerStatsRef.get();
    // 
    // if (workerStatsDoc.exists) {
    //     const currentStats = workerStatsDoc.data();
    //     const currentRating = currentStats.averageRating || 0;
    //     const currentCount = currentStats.reviewCount || 0;
    //     
    //     // Calculate new average rating
    //     const newTotalRating = (currentRating * currentCount) + rating;
    //     const newCount = currentCount + 1;
    //     const newAverageRating = newTotalRating / newCount;
    //     
    //     batch.update(workerStatsRef, {
    //         averageRating: newAverageRating,
    //         reviewCount: newCount,
    //         lastReviewAt: timestamp
    //     });
    // } else {
    //     // First review for this worker
    //     batch.set(workerStatsRef, {
    //         averageRating: rating,
    //         reviewCount: 1,
    //         lastReviewAt: timestamp
    //     }, { merge: true });
    // }
    // 
    // // 3. Update job document with completion feedback flag
    // const jobRef = db.collection('jobs').doc(jobId);
    // batch.update(jobRef, {
    //     customerFeedbackSubmitted: true,
    //     customerFeedbackAt: timestamp,
    //     customerRating: rating
    // });
    // 
    // // 4. Create notification for worker
    // const notificationRef = db.collection('notifications').doc();
    // batch.set(notificationRef, {
    //     recipientId: workerUserId,
    //     type: 'review_received',
    //     title: 'New Review Received',
    //     message: `You received a ${rating}-star review for your completed job.`,
    //     jobId: jobId,
    //     reviewId: reviewRef.id,
    //     createdAt: timestamp,
    //     read: false
    // });
    // 
    // // Commit all operations atomically
    // await batch.commit();
    // 
    // return {
    //     success: true,
    //     reviewId: reviewRef.id,
    //     newWorkerRating: newAverageRating,
    //     newWorkerReviewCount: newCount
    // };
    
    // Mock implementation for development
    console.log(`📝 Job completion feedback submitted:`, {
        jobId,
        workerUserId,
        customerUserId,
        rating,
        feedbackText,
        timestamp: new Date().toISOString()
    });
    
    return {
        success: true,
        reviewId: `review_${Date.now()}`,
        newWorkerRating: 4.5,
        newWorkerReviewCount: 12
    };
}

// Initialize character counting for feedback text
function initializeFeedbackCharacterCount() {
    const textarea = document.getElementById('completionFeedback');
    const charCount = document.getElementById('feedbackCharCount');
    const submitBtn = document.getElementById('jobCompletedOkBtn');
    
    if (textarea && charCount) {
        // Clear existing listeners
        textarea.removeEventListener('input', updateFeedbackCharCount);
        
        // Add input event listener with validation
        const updateHandler = function() {
            updateFeedbackCharCount();
            updateJobCompletionSubmitButtonState();
        };
        textarea.addEventListener('input', updateHandler);
        
        // Add mobile-specific event handlers to prevent zoom
        textarea.addEventListener('focus', handleFeedbackTextareaFocus);
        textarea.addEventListener('blur', handleFeedbackTextareaBlur);
        
        // Initialize count and button state
        updateFeedbackCharCount();
        updateJobCompletionSubmitButtonState();
    }
}

// Handle textarea focus with zoom prevention
function handleFeedbackTextareaFocus(e) {
    const textarea = e.target;
    const overlay = document.getElementById('jobCompletedSuccessOverlay');
    
    // Mark overlay as having active input for mobile positioning
    overlay.classList.add('input-focused');
    
    // Prevent iOS zoom by ensuring font-size is 16px+ during focus
    if (window.innerWidth <= 600) {
        textarea.style.fontSize = '16px';
        
        // Small delay to allow keyboard to appear, then scroll into view
        setTimeout(() => {
            textarea.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
            });
        }, 300);
    }
}

// Handle textarea blur - restore original styling
function handleFeedbackTextareaBlur(e) {
    const textarea = e.target;
    const overlay = document.getElementById('jobCompletedSuccessOverlay');
    
    // Remove focused state
    overlay.classList.remove('input-focused');
    
    // Restore responsive font-size
    if (window.innerWidth <= 600) {
        textarea.style.fontSize = '';
    }
}

// Update character count display
function updateFeedbackCharCount() {
    const textarea = document.getElementById('completionFeedback');
    const charCount = document.getElementById('feedbackCharCount');
    
    if (textarea && charCount) {
        const length = textarea.value.length;
        charCount.textContent = length;
        
        // Color feedback based on length
        if (length < 2) {
            charCount.style.color = '#fc8181'; // Red for insufficient
        } else if (length > 280) {
            charCount.style.color = '#fc8181'; // Red for too long
        } else if (length > 240) {
            charCount.style.color = '#fbbf24'; // Yellow for warning
        } else {
            charCount.style.color = '#10b981'; // Green for good
        }
    }
}

function updateJobCompletionSubmitButtonState() {
    const textarea = document.getElementById('completionFeedback');
    const submitBtn = document.getElementById('jobCompletedOkBtn');
    const rating = getFeedbackRating();
    
    if (textarea && submitBtn) {
        const feedbackText = textarea.value.trim();
        const isValid = rating > 0 && feedbackText.length >= 2;
        
        if (isValid) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.style.cursor = 'pointer';
        } else {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        }
    }
}

function resetFeedbackForm() {
    // Clear star rating
    const stars = document.querySelectorAll('.feedback-star');
    clearStars(stars);
    
    // Clear text input
    const textarea = document.getElementById('completionFeedback');
    if (textarea) {
        textarea.value = '';
        updateFeedbackCharCount();
    }
    
    // Reset submit button state
    updateJobCompletionSubmitButtonState();
}

function showContractVoidedSuccess(message) {
    const overlay = document.getElementById('contractVoidedSuccessOverlay');
    const messageEl = document.getElementById('contractVoidedMessage');
    const okBtn = document.getElementById('contractVoidedOkBtn');
    
    messageEl.textContent = message;
    
    // Clear any existing handler and add new one with cleanup
    okBtn.onclick = null;
    const okHandler = async function() {
        overlay.classList.remove('show');
        // Refresh both hiring and listings tabs
        await loadHiringContent();
        await loadListingsContent();
        // Update tab counts
        await updateTabCounts();
    };
    okBtn.addEventListener('click', okHandler);
    registerCleanup('success', 'contractVoidedOk', () => {
        okBtn.removeEventListener('click', okHandler);
    });
    
    overlay.classList.add('show');
}

function showResignationConfirmed(jobTitle, customerName) {
    const overlay = document.getElementById('resignationConfirmedOverlay');
    const message = document.getElementById('resignationMessage');
    const okBtn = document.getElementById('resignationOkBtn');
    
    message.textContent = `You have resigned from "${jobTitle}". Your contract with ${customerName} has been voided.`;
    
    // Clear any existing handler and add new one with cleanup
    okBtn.onclick = null;
    const okHandler = async function() {
        overlay.classList.remove('show');
        
        // Find and slide out the card first
        const resignedJobId = overlay.getAttribute('data-resigned-job-id');
        const cardToRemove = document.querySelector(`[data-job-id="${resignedJobId}"]`);
        
        // Slide out card and show toast
        await slideOutCard(cardToRemove, 'right');
        showSuccessNotification('You have resigned from this job');
        
        // Remove resigned job from hiring data (worker resignation = job simply disappears)
        if (resignedJobId && MOCK_HIRING_DATA) {
            // Find the job to resign from
            const jobToResign = MOCK_HIRING_DATA.find(job => job.jobId === resignedJobId);
            if (jobToResign) {
                // Remove from hiring data (worker resigned, so job is effectively completed/cancelled from worker's perspective)
                MOCK_HIRING_DATA = MOCK_HIRING_DATA.filter(job => job.jobId !== resignedJobId);
                
                // Worker resignation: Job simply disappears from worker's view
                // Backend handles: Job goes back to customer's Listings + notification sent to customer
                // Worker has no further involvement with this job
                
                console.log(`👋 Worker resigned from job ${resignedJobId} - removed from worker's hiring view`);
            }
        }
        
        // Refresh hiring tab only (worker won't see customer's listings)
        await loadHiringContent();
        // Update tab counts
        await updateTabCounts();
    };
    okBtn.addEventListener('click', okHandler);
    registerCleanup('success', 'resignationOk', () => {
        okBtn.removeEventListener('click', okHandler);
    });
    
    overlay.classList.add('show');
}

function showContractVoidedNegative(jobTitle, workerName) {
    const overlay = document.getElementById('contractVoidedNegativeOverlay');
    const message = document.getElementById('contractVoidedNegativeMessage');
    const okBtn = document.getElementById('contractVoidedNegativeOkBtn');
    
    message.textContent = `Contract with ${workerName} has been voided for "${jobTitle}". The job is now active for new applications.`;
    
    // Clear any existing handler and add new one with cleanup
    okBtn.onclick = null;
    const okHandler = async function() {
        overlay.classList.remove('show');
        
        // Find and slide out the card first
        const relistedJobId = overlay.getAttribute('data-relisted-job-id');
        const cardToRemove = document.querySelector(`[data-job-id="${relistedJobId}"]`);
        
        // Slide out card and show toast
        await slideOutCard(cardToRemove, 'left');
        showSuccessNotification('Job moved back to Listings');
        
        // Remove relisted job from hiring data and add back to listings
        if (relistedJobId && MOCK_HIRING_DATA) {
            // Find the job to relist
            const jobToRelist = MOCK_HIRING_DATA.find(job => job.jobId === relistedJobId);
            if (jobToRelist) {
                // Remove from hiring data
                MOCK_HIRING_DATA = MOCK_HIRING_DATA.filter(job => job.jobId !== relistedJobId);
                
                // Add back to listings data (convert back to active listing)
                if (MOCK_LISTINGS_DATA) {
                    const reactivatedJob = {
                        jobId: jobToRelist.jobId,
                        posterId: jobToRelist.posterId,
                        posterName: jobToRelist.posterName,
                        title: jobToRelist.title,
                        category: jobToRelist.category,
                        thumbnail: jobToRelist.thumbnail,
                        jobDate: jobToRelist.jobDate,
                        startTime: jobToRelist.startTime,
                        endTime: jobToRelist.endTime,
                        datePosted: new Date().toISOString(), // Update posted date
                        status: 'active',
                        applicationCount: 0, // Reset application count
                        applicationIds: [], // Reset applications
                        jobPageUrl: `${jobToRelist.category}.html`
                    };
                    MOCK_LISTINGS_DATA.push(reactivatedJob);
                    console.log(`🔄 Relisted job ${relistedJobId} - moved from hiring to listings`);
                }
            }
        }
        
        // Refresh both hiring and listings tabs
        await loadHiringContent();
        await loadListingsContent();
        // Update tab counts
        await updateTabCounts();
    };
    okBtn.addEventListener('click', okHandler);
    registerCleanup('success', 'contractVoidedNegativeOk', () => {
        okBtn.removeEventListener('click', okHandler);
    });
    
    overlay.classList.add('show');
}

function showEmptyHiringState() {
    const container = document.querySelector('.hiring-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <div class="empty-state-title">No Active Hires Yet</div>
            <div class="empty-state-message">
                Jobs you've hired workers for or been hired to work on will appear here.
                Check your active listings to hire workers or find work.
            </div>
            <a href="jobs.html" class="empty-state-btn">
                VIEW LISTINGS
            </a>
        </div>
    `;
}

// ========================== PREVIOUS TAB FUNCTIONALITY ==========================

// Global store for completed jobs data
let MOCK_COMPLETED_DATA = null;

function initializePreviousTab() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('📜 Previous tab already loaded');
        return;
    }
    
    console.log('📜 Initializing Previous tab...');
    loadPreviousContent();
}

async function loadPreviousContent() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    try {
        // Get completed jobs data
        const completedJobs = await getCompletedJobs();
        
        if (completedJobs.length === 0) {
            showEmptyPreviousState();
        } else {
            await generateMockCompletedJobs(completedJobs);
            initializeCompletedCardHandlers();
            checkTruncatedFeedback();
            
            // Create overlay immediately for testing
            createFeedbackExpandedOverlay();
        }
        
        console.log(`📜 Previous tab loaded with ${completedJobs.length} completed jobs`);
        
    } catch (error) {
        console.error('❌ Error loading previous jobs:', error);
    container.innerHTML = `
        <div class="content-placeholder">
                ❌ Error loading completed jobs.<br>
                Please try again later.
        </div>
    `;
    }
}

async function getCompletedJobs() {
    // Firebase Implementation:
    // const db = firebase.firestore();
    // const currentUserId = firebase.auth().currentUser.uid;
    // 
    // const completedJobsSnapshot = await db.collection('jobs')
    //     .where('status', '==', 'completed')
    //     .where(firebase.firestore.Filter.or(
    //         firebase.firestore.Filter.where('posterId', '==', currentUserId),
    //         firebase.firestore.Filter.where('hiredWorkerId', '==', currentUserId)
    //     ))
    //     .orderBy('completedAt', 'desc')
    //     .get();
    
    if (!MOCK_COMPLETED_DATA) {
        MOCK_COMPLETED_DATA = generateCompletedJobsData();
    }
    return MOCK_COMPLETED_DATA;
}

function generateCompletedJobsData() {
    const today = new Date();
    const formatDateTime = (date) => date.toISOString();
    
    // Generate 6 mock completed jobs with mix of customer and worker perspectives
    return [
        {
            jobId: 'completed_job_001',
            posterId: CURRENT_USER_ID, // Peter posted this job
            posterName: 'Peter J. Ang',
            posterThumbnail: 'public/users/Peter-J-Ang-User-01.jpg',
            title: 'Kitchen Deep Cleaning Service with Cabinet Organization',
            category: 'limpyo',
            thumbnail: 'public/mock/mock-limpyo-post1.jpg', // Use actual job photo
            jobDate: '2024-12-20',
            startTime: '8:00 AM',
            endTime: '12:00 PM',
            priceOffer: '800',
            completedAt: formatDateTime(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)), // 3 days ago
            rating: 5,
            feedback: 'Maria did an excellent job! My kitchen looks brand new. Very professional and thorough work.',
            role: 'customer', // Current user (Peter) hired someone
            hiredWorkerId: 'user_maria_santos_005',
            hiredWorkerName: 'Maria Santos',
            hiredWorkerThumbnail: 'public/users/User-05.jpg'
        },
        {
            jobId: 'completed_job_002',
            posterId: 'user_carlos_dela_cruz_003',
            posterName: 'Carlos Dela Cruz',
            posterThumbnail: 'public/users/User-03.jpg',
            title: 'Custom Furniture Repair & Assembly with Wood Finishing',
            category: 'carpenter',
            thumbnail: 'public/mock/mock-hakot-post2.jpg', // Use actual job photo
            jobDate: '2024-12-18',
            startTime: '1:00 PM',
            endTime: '5:00 PM',
            priceOffer: '1200',
            completedAt: formatDateTime(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
            rating: 4, // Customer's rating of the job completion
            feedback: null, // Worker perspective - no feedback initially, will show instructions
            workerFeedback: null, // No feedback left yet - first card
            workerRating: null, // No rating given yet - will be set when worker submits feedback
            role: 'worker', // Current user (Peter) worked for Carlos
            hiredWorkerId: CURRENT_USER_ID,
            hiredWorkerName: 'Peter J. Ang',
            hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg'
        },
        {
            jobId: 'completed_job_003',
            posterId: CURRENT_USER_ID, // Peter posted this job
            posterName: 'Peter J. Ang',
            posterThumbnail: 'public/users/Peter-J-Ang-User-01.jpg',
            title: 'Complete Garden Maintenance & Landscaping Project',
            category: 'limpyo',
            thumbnail: 'public/mock/mock-limpyo-post3.jpg', // Use actual job photo
            jobDate: '2024-12-15',
            startTime: '7:00 AM',
            endTime: '11:00 AM',
            priceOffer: '600',
            completedAt: formatDateTime(new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000)), // 8 days ago
            rating: 5,
            feedback: 'Amazing work! Ana transformed our garden completely. Highly recommended!',
            role: 'customer', // Current user (Peter) hired someone
            hiredWorkerId: 'user_ana_reyes_007',
            hiredWorkerName: 'Ana Reyes',
            hiredWorkerThumbnail: 'public/users/User-07.jpg'
        },
        {
            jobId: 'completed_job_004',
            posterId: 'user_rico_torres_009',
            posterName: 'Rico Torres',
            posterThumbnail: 'public/users/User-09.jpg',
            title: 'Complete Appliance Installation & Electrical Wiring Setup',
            category: 'electrician',
            thumbnail: 'public/mock/mock-hatod-post4.jpg', // Use actual job photo
            jobDate: '2024-12-12',
            startTime: '9:00 AM',
            endTime: '2:00 PM',
            priceOffer: '1500',
            completedAt: formatDateTime(new Date(today.getTime() - 11 * 24 * 60 * 60 * 1000)), // 11 days ago
            rating: 3, // Customer's rating of the job completion
            feedback: null, // Worker perspective - no feedback shown initially
            workerFeedback: 'Rico was very organized and clear with his instructions. The workspace was clean and he provided all necessary tools. Great communication throughout the job.',
            workerRating: 4, // Worker already gave a 4-star rating along with feedback
            role: 'worker', // Current user (Peter) worked for Rico
            hiredWorkerId: CURRENT_USER_ID,
            hiredWorkerName: 'Peter J. Ang',
            hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg'
        },
        {
            jobId: 'completed_job_005',
            posterId: CURRENT_USER_ID, // Peter posted this job
            posterName: 'Peter J. Ang',
            posterThumbnail: 'public/users/Peter-J-Ang-User-01.jpg',
            title: 'Bathroom Renovation',
            category: 'plumber',
            thumbnail: 'public/mock/mock-limpyo-post5.jpg', // Use actual job photo
            jobDate: '2024-12-10',
            startTime: '8:00 AM',
            endTime: '6:00 PM',
            priceOffer: '2500',
            completedAt: formatDateTime(new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000)), // 13 days ago
            rating: 5,
            feedback: 'Outstanding service! Elena finished the bathroom renovation perfectly. Very skilled and reliable.',
            role: 'customer', // Current user (Peter) hired someone
            hiredWorkerId: 'user_elena_garcia_006',
            hiredWorkerName: 'Elena Garcia',
            hiredWorkerThumbnail: 'public/users/User-06.jpg'
        },
        {
            jobId: 'completed_job_006',
            posterId: 'user_miguel_santos_011',
            posterName: 'Miguel Santos',
            posterThumbnail: 'public/users/User-11.jpg',
            title: 'House Painting',
            category: 'painter',
            thumbnail: 'public/mock/mock-kompra-post6.jpg', // Use actual job photo
            jobDate: '2024-12-08',
            startTime: '7:00 AM',
            endTime: '4:00 PM',
            priceOffer: '1800',
            completedAt: formatDateTime(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000)), // 15 days ago
            rating: 4, // Customer's rating of the job completion
            feedback: null, // Worker perspective - no feedback shown initially
            workerFeedback: 'Miguel was a fantastic customer! He was flexible with timing and very appreciative of the work. The house preparation was perfect and payment was prompt.',
            workerRating: 5, // Worker already gave a 5-star rating along with feedback
            role: 'worker', // Current user (Peter) worked for Miguel
            hiredWorkerId: CURRENT_USER_ID,
            hiredWorkerName: 'Peter J. Ang',
            hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg'
        }
    ];
}

async function generateMockCompletedJobs(completedJobs) {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    const cardsHTML = completedJobs.map(job => {
        const hasWorkerFeedback = job.role === 'worker' && job.workerFeedback;
        console.log(`🔍 Job ${job.jobId} - Role: ${job.role}, HasWorkerFeedback: ${hasWorkerFeedback}, WorkerFeedback: ${job.workerFeedback ? 'exists' : 'null'}`);
        return generateCompletedCardHTML(job);
    }).join('');
    container.innerHTML = cardsHTML;
}

function generateCompletedCardHTML(job) {
    const roleClass = job.role; // 'customer' or 'worker'
    
    // Determine role caption and user info based on perspective
    let roleCaption, userThumbnail, userName, userLabel;
    if (job.role === 'customer') {
        // Customer perspective: I hired someone and completed the job
        roleCaption = `YOU HIRED ${job.hiredWorkerName.toUpperCase()}`;
        userThumbnail = job.hiredWorkerThumbnail;
        userName = job.hiredWorkerName;
        userLabel = 'WORKER';
    } else {
        // Worker perspective: I worked for someone who completed the job
        roleCaption = `WORKED FOR ${job.posterName.toUpperCase()}`;
        userThumbnail = job.posterThumbnail;
        userName = job.posterName;
        userLabel = 'CUSTOMER';
    }
    
    // Generate star rating HTML - use appropriate rating based on role and feedback status
    let displayRating, ratingCount;
    if (job.role === 'customer') {
        // Customer perspective: Show the rating they gave for the worker
        displayRating = job.rating || 0;
        ratingCount = `(${displayRating}/5)`;
    } else {
        // Worker perspective: Show the rating they gave for the customer (only if feedback submitted)
        if (job.workerFeedback && job.workerRating) {
            displayRating = job.workerRating;
            ratingCount = `(${displayRating}/5)`;
        } else {
            // No feedback submitted yet - show 0 stars
            displayRating = 0;
            ratingCount = '(0/5)';
        }
    }
    const starsHTML = generateStarRatingHTML(displayRating);
    
    // Generate feedback section
    let feedbackHTML = '';
    if (job.role === 'customer' && job.feedback) {
        // Customer perspective: Show feedback left for worker
        feedbackHTML = `
            <div class="completed-feedback-section">
                <div class="completed-feedback-label">Your Feedback</div>
                <div class="completed-feedback-text">${job.feedback}</div>
            </div>
        `;
    } else if (job.role === 'worker') {
        if (job.workerFeedback) {
            // Worker perspective: Show feedback left for customer
            feedbackHTML = `
                <div class="completed-feedback-section">
                    <div class="completed-feedback-label">Your Feedback</div>
                    <div class="completed-feedback-text">${job.workerFeedback}</div>
                </div>
            `;
        } else {
            // Worker perspective: Show instructions to leave feedback
            feedbackHTML = `
                <div class="completed-feedback-section worker-instructions">
                    <div class="completed-feedback-label">Leave Feedback</div>
                    <div class="completed-feedback-instructions">Tap to rate your experience with ${job.posterName}.</div>
                </div>
            `;
        }
    }
    
    return `
        <div class="completed-card ${roleClass}" 
             data-job-id="${job.jobId}"
             data-poster-id="${job.posterId}"
             data-category="${job.category}"
             data-role="${job.role}"
             data-hired-worker-id="${job.hiredWorkerId}"
             data-hired-worker-name="${job.hiredWorkerName}"
             data-poster-name="${job.posterName}"
             data-has-worker-feedback="${job.role === 'worker' && job.workerFeedback ? 'true' : 'false'}">
            
            <div class="completed-title">${job.title}</div>
            
            <div class="completed-date-time-row">
                <div class="completed-date-part">
                    <span class="completed-date-label">DATE:</span>
                    <span class="completed-date-value">${formatJobDate(job.jobDate)}</span>
                </div>
                <div class="completed-time-part">
                    <span class="completed-time-label">FROM:</span>
                    <span class="completed-time-value">${formatTime(job.startTime)}</span>
                    <span class="completed-time-label">TO:</span>
                    <span class="completed-time-value">${formatTime(job.endTime)}</span>
                </div>
            </div>
            
            <div class="completed-main-row">
                <div class="completed-thumbnail">
                    <img src="${job.thumbnail}" alt="${job.title}" loading="lazy">
                    <div class="completed-overlay-badge">COMPLETED</div>
                </div>
                
                <div class="completed-content">
                    <div class="completed-upper-row">
                        <div class="completed-left-content">
                            <div class="completed-role-caption ${roleClass}">${roleCaption}</div>
                            
                            <div class="completed-info-section">
                                <div class="completed-on-date">Completed ${formatCompletedDate(job.completedAt)}</div>
                            </div>
                            
                            <div class="completed-rating-section">
                                <div class="completed-rating-label">Rating</div>
                                <div class="completed-rating-stars">
                                    ${starsHTML}
                                    <span class="completed-rating-count">${ratingCount}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="completed-right-content">
                            <div class="completed-price">${job.priceOffer.startsWith('₱') ? job.priceOffer : '₱' + job.priceOffer}</div>
                            <div class="completed-user-thumbnail">
                                <img src="${userThumbnail}" alt="${userName}" loading="lazy">
                            </div>
                            <div class="completed-user-label">${userLabel}</div>
                        </div>
                    </div>
                    
                    ${feedbackHTML}
                </div>
            </div>
        </div>
    `;
}

function generateStarRatingHTML(rating) {
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            starsHTML += '<span class="completed-rating-star">★</span>';
        } else {
            starsHTML += '<span class="completed-rating-star empty">★</span>';
        }
    }
    return starsHTML;
}

function formatTime(timeString) {
    // Remove :00 from times like "8:00 AM" -> "8 AM" and "12:00 PM" -> "12 PM"
    return timeString.replace(':00', '');
}

function formatCompletedDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

function initializeCompletedCardHandlers() {
    const completedCards = document.querySelectorAll('.completed-card');
    
    completedCards.forEach((card, index) => {
        // Add click handlers to feedback sections directly
        const feedbackSection = card.querySelector('.completed-feedback-section');
        if (feedbackSection) {
            console.log(`🎯 Adding feedback handler to card ${index}:`, feedbackSection);
            
            const feedbackClickHandler = function(e) {
                console.log('💬 Feedback section clicked!', e.target);
                e.stopPropagation();
                e.preventDefault();
                
                const jobData = extractCompletedJobDataFromCard(card);
                console.log('📋 Job data:', jobData);
                
                // Check if this is an instruction box (for leaving feedback) or actual feedback text
                const isInstructionBox = feedbackSection.classList.contains('worker-instructions');
                const hasInstructionText = feedbackSection.querySelector('.completed-feedback-instructions');
                
                if (isInstructionBox || hasInstructionText) {
                    // This is an instruction box - trigger leave feedback flow
                    console.log('📝 Instruction box clicked - triggering leave feedback');
                    handleLeaveFeedback(jobData);
                } else {
                    // This is actual feedback text - trigger expand overlay
                    console.log('📖 Feedback text clicked - showing expanded view');
                    showFeedbackExpandedOverlay(jobData);
                }
            };
            
            feedbackSection.addEventListener('click', feedbackClickHandler);
            
            // Also add handler to feedback text specifically
            const feedbackText = feedbackSection.querySelector('.completed-feedback-text');
            if (feedbackText) {
                feedbackText.addEventListener('click', feedbackClickHandler);
                console.log(`📝 Added click handler to feedback text in card ${index}`);
            }
            
            // Store handler for cleanup
            if (!CLEANUP_REGISTRY.elementListeners.has(feedbackSection)) {
                CLEANUP_REGISTRY.elementListeners.set(feedbackSection, []);
            }
            CLEANUP_REGISTRY.elementListeners.get(feedbackSection).push(['click', feedbackClickHandler]);
        } else {
            console.log(`❌ No feedback section found in card ${index}`);
        }
        
        // Card click handler (excluding feedback sections)
        const cardClickHandler = function(e) {
            // Don't handle if click was on feedback section
            if (e.target.closest('.completed-feedback-section')) {
                console.log('🚫 Click on feedback section, ignoring card handler');
                return;
            }
            
            console.log('📄 Card clicked (non-feedback area)');
            e.preventDefault();
            const jobData = extractCompletedJobDataFromCard(card);
            showPreviousOptionsOverlay(jobData);
        };
        
        card.addEventListener('click', cardClickHandler);
        
        // Store handler for cleanup
        if (!CLEANUP_REGISTRY.elementListeners.has(card)) {
            CLEANUP_REGISTRY.elementListeners.set(card, []);
        }
        CLEANUP_REGISTRY.elementListeners.get(card).push(['click', cardClickHandler]);
    });
    
    console.log(`🔧 Initialized ${completedCards.length} completed card handlers`);
}

function extractCompletedJobDataFromCard(cardElement) {
    return {
        jobId: cardElement.getAttribute('data-job-id'),
        posterId: cardElement.getAttribute('data-poster-id'),
        category: cardElement.getAttribute('data-category'),
        role: cardElement.getAttribute('data-role'),
        hiredWorkerId: cardElement.getAttribute('data-hired-worker-id'),
        hiredWorkerName: cardElement.getAttribute('data-hired-worker-name'),
        posterName: cardElement.getAttribute('data-poster-name'),
        hasWorkerFeedback: cardElement.getAttribute('data-has-worker-feedback') === 'true',
        title: cardElement.querySelector('.completed-title')?.textContent || 'Unknown Job'
    };
}

async function showFeedbackExpandedOverlay(jobData) {
    console.log('💬 Show expanded feedback for:', jobData);
    
    // Find the feedback content from the completed jobs data (use updated data if available)
    const completedJobs = MOCK_COMPLETED_DATA || generateCompletedJobsData();
    const job = completedJobs.find(j => j.jobId === jobData.jobId);
    
    if (!job) {
        console.error('❌ Job not found for feedback expansion');
        return;
    }
    
    console.log('📝 Found job for feedback:', job);
    
    let overlay = document.getElementById('feedbackExpandedOverlay');
    if (!overlay) {
        console.log('🏗️ Creating feedback expanded overlay');
        createFeedbackExpandedOverlay();
        overlay = document.getElementById('feedbackExpandedOverlay');
    }
    
    const title = document.getElementById('feedbackExpandedTitle');
    const content = document.getElementById('feedbackExpandedContent');
    const closeBtn = document.getElementById('feedbackExpandedCloseBtn');
    
    if (!overlay || !title || !content || !closeBtn) {
        console.error('❌ Overlay elements not found after creation');
        return;
    }
    
    // Determine feedback content (instruction boxes are handled at click level now)
    let feedbackText = '';
    if (job.role === 'customer' && job.feedback) {
        feedbackText = job.feedback;
        title.textContent = 'Your Feedback';
        console.log('📝 Showing customer feedback');
    } else if (job.role === 'worker' && job.workerFeedback) {
        feedbackText = job.workerFeedback;
        title.textContent = 'Your Feedback';
        console.log('📝 Showing worker feedback');
    } else {
        console.error('❌ No feedback content found for expansion');
        return;
    }
    
    console.log('📝 Feedback text:', feedbackText);
    content.textContent = feedbackText;
    
    // Close handler
    const closeHandler = function() {
        overlay.classList.remove('show');
        closeBtn.removeEventListener('click', closeHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
    
    // Background close handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('show');
            overlay.removeEventListener('click', backgroundHandler);
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    
    console.log('🎭 Showing feedback overlay');
    overlay.classList.add('show');
}

function createFeedbackExpandedOverlay() {
    // Check if overlay already exists
    if (document.getElementById('feedbackExpandedOverlay')) {
        console.log('📱 Feedback expanded overlay already exists');
        return;
    }
    
    const overlayHTML = `
        <div id="feedbackExpandedOverlay">
            <div class="feedback-expanded-content">
                <div class="overlay-header">
                    <h3 id="feedbackExpandedTitle">Feedback</h3>
                    <button id="feedbackExpandedCloseBtn" class="close-btn">&times;</button>
                </div>
                <div class="overlay-body">
                    <div id="feedbackExpandedContent" class="feedback-expanded-text"></div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
    console.log('📱 Feedback expanded overlay created successfully');
    
    // Verify elements were created
    const overlay = document.getElementById('feedbackExpandedOverlay');
    const title = document.getElementById('feedbackExpandedTitle');
    const content = document.getElementById('feedbackExpandedContent');
    const closeBtn = document.getElementById('feedbackExpandedCloseBtn');
    
    console.log('🔍 Overlay verification:', {
        overlay: !!overlay,
        title: !!title,
        content: !!content,
        closeBtn: !!closeBtn
    });
}

function checkTruncatedFeedback() {
    // Small delay to ensure proper rendering
    setTimeout(() => {
        // Check all feedback text elements for truncation
        const feedbackTexts = document.querySelectorAll('.completed-feedback-text');
        
        feedbackTexts.forEach(textElement => {
            // Skip instruction boxes
            if (textElement.closest('.worker-instructions')) {
                return;
            }
            
            // Remove truncated class temporarily to measure natural height
            textElement.classList.remove('truncated');
            const naturalHeight = textElement.scrollHeight;
            
            // Add truncated class back to measure constrained height
            textElement.classList.add('truncated');
            const truncatedHeight = textElement.clientHeight;
            
            // Only keep truncated class if text actually overflows
            if (naturalHeight <= truncatedHeight + 5) { // 5px tolerance
                textElement.classList.remove('truncated');
                console.log(`📏 No truncation needed: ${textElement.textContent.substring(0, 30)}...`);
            } else {
                console.log(`📏 Applied truncation: ${textElement.textContent.substring(0, 30)}...`);
            }
        });
        
        console.log(`🔍 Processed ${feedbackTexts.length} feedback texts`);
    }, 100);
}

async function showPreviousOptionsOverlay(jobData) {
    console.log('📜 Show previous options for:', jobData);
    
    const overlay = document.getElementById('previousOptionsOverlay');
    const title = document.getElementById('previousOptionsTitle');
    const subtitle = document.getElementById('previousOptionsSubtitle');
    const actionsContainer = document.getElementById('previousOptionsActions');
    
    if (!overlay || !actionsContainer) {
        console.error('❌ Previous overlay elements not found');
        return;
    }
    
    // Set overlay data attributes
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-role', jobData.role);
    overlay.setAttribute('data-title', jobData.title);
    overlay.setAttribute('data-hired-worker-name', jobData.hiredWorkerName);
    overlay.setAttribute('data-poster-name', jobData.posterName);
    overlay.setAttribute('data-has-worker-feedback', jobData.hasWorkerFeedback);
    
    // Update title and subtitle
    title.textContent = 'Completed Job Options';
    subtitle.textContent = `Choose an action for "${jobData.title}"`;
    
    // Generate buttons based on role
    let buttonsHTML = '';
    
    if (jobData.role === 'worker') {
        // Worker perspective: You worked for someone
        if (jobData.hasWorkerFeedback) {
            // Worker already left feedback - only show report dispute option
            buttonsHTML = `
                <button class="listing-option-btn delete" id="reportDisputeBtn">
                    REPORT DISPUTE
                </button>
                <button class="listing-option-btn cancel" id="cancelPreviousBtn">
                    CLOSE
                </button>
            `;
        } else {
            // Worker hasn't left feedback yet - show both options
            buttonsHTML = `
                <button class="listing-option-btn modify" id="leaveFeedbackBtn">
                    LEAVE FEEDBACK
                </button>
                <button class="listing-option-btn delete" id="reportDisputeBtn">
                    REPORT DISPUTE
                </button>
                <button class="listing-option-btn cancel" id="cancelPreviousBtn">
                    CLOSE
                </button>
            `;
        }
    } else if (jobData.role === 'customer') {
        // Customer perspective: You hired someone and completed the job - can relist
        buttonsHTML = `
            <button class="listing-option-btn modify" id="relistCompletedJobBtn">
                RELIST JOB
            </button>
            <button class="listing-option-btn cancel" id="cancelPreviousBtn">
                CLOSE
            </button>
        `;
    }
    
    actionsContainer.innerHTML = buttonsHTML;
    
    // Initialize handlers for the dynamically created buttons
    initializePreviousOverlayHandlers();
    
    // Show overlay
    overlay.classList.add('show');
    console.log(`📜 Previous overlay shown for ${jobData.role} role - hasWorkerFeedback: ${jobData.hasWorkerFeedback}`);
}

function showEmptyPreviousState() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📜</div>
            <div class="empty-state-title">No Completed Jobs Yet</div>
            <div class="empty-state-message">
                Completed jobs will appear here once you finish working on hired jobs.
                You can relist completed jobs or leave feedback for customers.
            </div>
            <a href="jobs.html" class="empty-state-btn">
                VIEW ACTIVE JOBS
            </a>
        </div>
    `;
}

// ========================== PREVIOUS TAB OVERLAY HANDLERS ==========================

function initializePreviousOverlayHandlers() {
    const overlay = document.getElementById('previousOptionsOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;

    const relistBtn = document.getElementById('relistCompletedJobBtn');
    const feedbackBtn = document.getElementById('leaveFeedbackBtn');
    const disputeBtn = document.getElementById('reportDisputeBtn');
    const cancelBtn = document.getElementById('cancelPreviousBtn');

    // Relist completed job handler (customer)
    if (relistBtn) {
        const relistHandler = function(e) {
            e.preventDefault();
            const jobData = getPreviousJobDataFromOverlay();
            handleRelistCompletedJob(jobData);
        };
        relistBtn.addEventListener('click', relistHandler);
        registerCleanup('previous', 'relistBtn', () => {
            relistBtn.removeEventListener('click', relistHandler);
        });
    }

    // Leave feedback handler (worker)
    if (feedbackBtn) {
        const feedbackHandler = function(e) {
            e.preventDefault();
            const jobData = getPreviousJobDataFromOverlay();
            handleLeaveFeedback(jobData);
        };
        feedbackBtn.addEventListener('click', feedbackHandler);
        registerCleanup('previous', 'feedbackBtn', () => {
            feedbackBtn.removeEventListener('click', feedbackHandler);
        });
    }

    // Report dispute handler (worker)
    if (disputeBtn) {
        const disputeHandler = function(e) {
            e.preventDefault();
            const jobData = getPreviousJobDataFromOverlay();
            handleReportDispute(jobData);
        };
        disputeBtn.addEventListener('click', disputeHandler);
        registerCleanup('previous', 'disputeBtn', () => {
            disputeBtn.removeEventListener('click', disputeHandler);
        });
    }

    // Cancel handler
    if (cancelBtn) {
        const cancelHandler = function(e) {
            e.preventDefault();
            hidePreviousOptionsOverlay();
        };
        cancelBtn.addEventListener('click', cancelHandler);
        registerCleanup('previous', 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }

    // Background click handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            hidePreviousOptionsOverlay();
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup('previous', 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });

    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hidePreviousOptionsOverlay();
        }
    };
    addDocumentListener('previousOverlayEscape', escapeHandler);

    overlay.dataset.handlersInitialized = 'true';
    console.log('🔧 Previous overlay handlers initialized');
}

function getPreviousJobDataFromOverlay() {
    const overlay = document.getElementById('previousOptionsOverlay');
    return {
        jobId: overlay.getAttribute('data-job-id'),
        role: overlay.getAttribute('data-role'),
        title: overlay.getAttribute('data-title'),
        hiredWorkerName: overlay.getAttribute('data-hired-worker-name'),
        posterName: overlay.getAttribute('data-poster-name'),
        hasWorkerFeedback: overlay.getAttribute('data-has-worker-feedback') === 'true'
    };
}

function hidePreviousOptionsOverlay() {
    const overlay = document.getElementById('previousOptionsOverlay');
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to allow re-initialization
    delete overlay.dataset.handlersInitialized;
    
    // Clean up all previous overlay handlers
    executeCleanupsByType('previous');
    
    console.log('🔧 Previous overlay hidden and handlers cleaned up');
}

function handleRelistCompletedJob(jobData) {
    console.log(`🔄 RELIST completed job: ${jobData.jobId}`);
    hidePreviousOptionsOverlay();
    
    // Navigate directly to new-post.html with relist mode (like MODIFY)
    const relistUrl = `new-post.html?relist=${jobData.jobId}&category=${jobData.category}`;
    console.log(`📝 Navigating to relist mode: ${relistUrl}`);
    
    // Firebase data mapping for relist mode:
    // - Load completed job document from: db.collection('completedJobs').doc(jobData.jobId)
    // - Pre-populate form with existing data (title, description, price, etc.)
    // - Clear date/time fields for new scheduling
    // - Create new job document on save (not update existing)
    
    window.location.href = relistUrl;
}

function handleLeaveFeedback(jobData) {
    console.log(`💭 LEAVE FEEDBACK for customer: ${jobData.posterName}`);
    hidePreviousOptionsOverlay();
    
    // Update feedback overlay content
    document.getElementById('feedbackCustomerName').textContent = `Rate your experience working for ${jobData.posterName}`;
    document.getElementById('feedbackCustomerNameSpan').textContent = jobData.posterName;
    
    // Store job data in the overlay for submission
    const feedbackOverlay = document.getElementById('leaveFeedbackOverlay');
    feedbackOverlay.setAttribute('data-job-id', jobData.jobId);
    feedbackOverlay.setAttribute('data-customer-name', jobData.posterName);
    
    // Reset feedback form
    resetCustomerFeedbackForm();
    
    // Initialize feedback handlers
    initializeCustomerFeedbackHandlers();
    
    // Show feedback overlay
    feedbackOverlay.classList.add('show');
}

function handleReportDispute(jobData) {
    console.log(`⚠️ REPORT DISPUTE for customer: ${jobData.posterName}`);
    hidePreviousOptionsOverlay();
    
    // Update dispute overlay content
    document.getElementById('disputeJobSubtitle').textContent = `Report an issue with "${jobData.title}"`;
    document.getElementById('disputeCustomerName').textContent = jobData.posterName;
    
    // Store job data in the overlay for submission
    const disputeOverlay = document.getElementById('reportDisputeOverlay');
    disputeOverlay.setAttribute('data-job-id', jobData.jobId);
    disputeOverlay.setAttribute('data-customer-name', jobData.posterName);
    disputeOverlay.setAttribute('data-job-title', jobData.title);
    
    // Reset dispute form
    resetDisputeForm();
    
    // Initialize dispute handlers
    initializeDisputeHandlers();
    
    // Show dispute overlay
    disputeOverlay.classList.add('show');
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
        jobPageUrl: overlay.getAttribute('data-job-page-url'),
        currentStatus: overlay.getAttribute('data-current-status')
    };
}

function hideListingOptionsOverlay() {
    const overlay = document.getElementById('listingOptionsOverlay');
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to allow re-initialization
    delete overlay.dataset.handlersInitialized;
    
    // Clean up all listings overlay handlers
    executeCleanupsByType('listings');
    
    console.log('🔧 Options overlay hidden and handlers cleaned up');
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
    const currentStatus = jobData.currentStatus || 'active';
    const action = currentStatus === 'paused' ? 'activate' : 'pause';
    const newStatus = action === 'pause' ? 'paused' : 'active';
    
    console.log(`${action === 'pause' ? '⏸️ PAUSE' : '▶️ ACTIVATE'} job: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    try {
        // Firebase data mapping for pause/activate:
        if (action === 'pause') {
            // db.collection('jobs').doc(jobData.jobId).update({
            //     status: 'paused',
            //     pausedAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     isActive: false,
            //     lastModified: firebase.firestore.FieldValue.serverTimestamp()
            // });
        } else {
            // db.collection('jobs').doc(jobData.jobId).update({
            //     status: 'active',
            //     activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            //     isActive: true,
            //     pausedAt: firebase.firestore.FieldValue.delete(),
            //     lastModified: firebase.firestore.FieldValue.serverTimestamp()
            // });
        }
        
        // Update status in mock data for demonstration
        updateJobStatusInMockData(jobData.jobId, newStatus);
        
        // Update the status badge in the UI immediately
        const statusBadge = document.querySelector(`[data-job-id="${jobData.jobId}"] .status-badge`);
        if (statusBadge) {
            if (newStatus === 'paused') {
                statusBadge.textContent = 'PAUSED';
                statusBadge.className = 'status-badge status-paused';
            } else {
                statusBadge.textContent = 'ACTIVE';
                statusBadge.className = 'status-badge status-active';
            }
        }
        
        console.log(`${action === 'pause' ? '⏸️' : '▶️'} Job ${jobData.jobId} ${action}d successfully`);
        console.log(`📊 Status updated: ${currentStatus} → ${newStatus}`);
        console.log(`🔄 UI updated to show ${newStatus} status`);
        
        showSuccessNotification(`Job ${action}d successfully`);
        
        // Update tab counts after status change
        await updateTabCounts();
        
    } catch (error) {
        console.error(`❌ Error ${action}ing job ${jobData.jobId}:`, error);
        showErrorNotification(`Failed to ${action} job. Please try again.`);
    }
}

async function handleDeleteJob(jobData) {
    console.log(`🗑️ DELETE job: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    // Get full job data for confirmation dialog
    const fullJobData = await getJobDataById(jobData.jobId);
    const confirmationData = { ...jobData, ...fullJobData };
    
    // Show confirmation dialog before deleting
    const confirmed = await showDeleteConfirmationDialog(confirmationData);
    if (!confirmed) return;
    
    try {
        // Firebase data mapping for comprehensive deletion:
        
        // 1. Get all applications for this job BEFORE deleting the job
        // const applicationsQuery = db.collection('applications').where('jobId', '==', jobData.jobId);
        // const applicationsSnapshot = await applicationsQuery.get();
        // const applicationIds = applicationsSnapshot.docs.map(doc => doc.id);
        // const applicantUserIds = applicationsSnapshot.docs.map(doc => doc.data().applicantId);
        
        // For mock data, get application count
        const applicationCount = fullJobData ? fullJobData.applicationCount : 0;
        const mockApplicationIds = fullJobData ? fullJobData.applicationIds : [];
        
        // 2. Delete all related applications in a batch
        // const batch = db.batch();
        // applicationsSnapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        // });
        
        // 3. Update applicant users' statistics (remove from their applied jobs count)
        // for (const applicantId of applicantUserIds) {
        //     const applicantRef = db.collection('users').doc(applicantId);
        //     batch.update(applicantRef, {
        //         appliedJobsCount: firebase.firestore.FieldValue.increment(-1),
        //         activeApplicationsCount: firebase.firestore.FieldValue.increment(-1)
        //     });
        // }
        
        // 4. Delete conversation threads related to this job
        // const conversationsQuery = db.collection('conversations').where('jobId', '==', jobData.jobId);
        // const conversationsSnapshot = await conversationsQuery.get();
        // conversationsSnapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        // });
        
        // 5. Delete job notifications related to this job
        // const notificationsQuery = db.collection('notifications').where('jobId', '==', jobData.jobId);
        // const notificationsSnapshot = await notificationsQuery.get();
        // notificationsSnapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        // });
        
        // 6. Delete the main job document
        // const jobRef = db.collection('jobs').doc(jobData.jobId);
        // batch.delete(jobRef);
        
        // 7. Update job poster's statistics
        // const posterRef = db.collection('users').doc(jobData.posterId);
        // batch.update(posterRef, {
        //     activeJobsCount: firebase.firestore.FieldValue.increment(-1),
        //     totalJobsPosted: firebase.firestore.FieldValue.increment(-1)
        // });
        
        // 8. Execute all deletions and updates in a single batch
        // await batch.commit();
        
        // 9. Delete job images from Cloud Storage
        // const storageRef = firebase.storage().ref(`jobs/${jobData.jobId}/`);
        // try {
        //     const listResult = await storageRef.listAll();
        //     const deletePromises = listResult.items.map(item => item.delete());
        //     await Promise.all(deletePromises);
        //     console.log(`🖼️ Deleted ${listResult.items.length} job images from Storage`);
        // } catch (storageError) {
        //     console.warn('⚠️ Some job images may not have been deleted:', storageError);
        // }
        
        // ===== ACTUALLY DELETE THE JOB FROM DATA =====
        const deleteResult = await JobsDataService.deleteJob(jobData.jobId);
        if (!deleteResult.success) {
            throw new Error(deleteResult.error || 'Failed to delete job from data store');
        }
        
        console.log(`🗑️ Job ${jobData.jobId} deleted successfully`);
        console.log(`📄 Job document removed from Firestore`);
        console.log(`📝 ${applicationCount} related applications cleaned up`);
        console.log(`💬 Related conversations and notifications removed`);
        console.log(`🖼️ Job images removed from Cloud Storage`);
        console.log(`👤 User statistics updated for poster and applicants`);
        
        // Refresh listings to remove deleted job
        await refreshListingsAfterDeletion(jobData.jobId);
        
        // Show success notification
        showSuccessNotification('Job deleted successfully');
        
    } catch (error) {
        console.error(`❌ Error deleting job ${jobData.jobId}:`, error);
        
        // Detailed error handling for different failure scenarios
        if (error.code === 'permission-denied') {
            showErrorNotification('You do not have permission to delete this job.');
        } else if (error.code === 'not-found') {
            showErrorNotification('Job no longer exists.');
        } else if (error.code === 'failed-precondition') {
            showErrorNotification('Job cannot be deleted due to active applications.');
        } else {
            showErrorNotification('Failed to delete job. Please try again.');
        }
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
    createToastNotification(message, 'success');
}

function showErrorNotification(message) {
    console.log(`❌ Error: ${message}`);
    createToastNotification(message, 'error');
}

function createToastNotification(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Force reflow and add show class for animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300); // Wait for fade-out animation
    }, 3000);
}

function slideOutCard(cardElement, direction = 'right') {
    return new Promise((resolve) => {
        if (!cardElement) {
            resolve();
            return;
        }
        
        // Add slide-out animation class
        cardElement.style.transition = 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out';
        cardElement.style.transform = direction === 'right' ? 'translateX(100%)' : 'translateX(-100%)';
        cardElement.style.opacity = '0';
        
        // Remove card after animation completes
        setTimeout(() => {
            if (cardElement.parentNode) {
                cardElement.parentNode.removeChild(cardElement);
            }
            resolve();
        }, 500);
    });
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
    
    try {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // const currentUserId = firebase.auth().currentUser.uid;
        // 
        // // Count listings (active/paused jobs posted by current user)
        // const listingsSnapshot = await db.collection('jobs')
        //     .where('posterId', '==', currentUserId)
        //     .where('status', 'in', ['active', 'paused'])
        //     .get();
        // 
        // // Count hiring jobs (jobs where current user is customer OR worker)
        // const hiringSnapshot = await db.collection('jobs')
        //     .where('status', '==', 'hired')
        //     .where(firebase.firestore.Filter.or(
        //         firebase.firestore.Filter.where('posterId', '==', currentUserId),
        //         firebase.firestore.Filter.where('hiredWorkerId', '==', currentUserId)
        //     ))
        //     .get();
        // 
        // // Count previous jobs (completed/cancelled involving current user)
        // const previousSnapshot = await db.collection('jobs')
        //     .where('status', 'in', ['completed', 'cancelled'])
        //     .where(firebase.firestore.Filter.or(
        //         firebase.firestore.Filter.where('posterId', '==', currentUserId),
        //         firebase.firestore.Filter.where('hiredWorkerId', '==', currentUserId)
        //     ))
        //     .get();
        // 
        // const counts = {
        //     listings: listingsSnapshot.size,
        //     hiring: hiringSnapshot.size,
        //     previous: previousSnapshot.size
        // };
        
        // Get data directly from their respective arrays
        const listingsJobs = await JobsDataService.getAllJobs();
        const hiringJobs = await JobsDataService.getAllHiredJobs();
        const completedJobs = await getCompletedJobs();
        
        // Count actual jobs in each data set
        const counts = {
            listings: listingsJobs.length,    // Active/paused jobs posted by user
            hiring: hiringJobs.length,        // Jobs with hired workers (status: 'hired')
            previous: completedJobs.length    // Completed jobs involving current user
        };
        
        // Update the notification badges in DOM
        const listingsCount = document.querySelector('#listingsTab .notification-count');
        const hiringCount = document.querySelector('#hiringTab .notification-count');
        const previousCount = document.querySelector('#previousTab .notification-count');
        
        if (listingsCount) {
            listingsCount.textContent = counts.listings;
        }
        if (hiringCount) {
            hiringCount.textContent = counts.hiring;
        }
        if (previousCount) {
            previousCount.textContent = counts.previous;
        }
        
        console.log(`📊 Tab counts updated: Listings(${counts.listings}), Hiring(${counts.hiring}), Previous(${counts.previous})`);
        
    } catch (error) {
        console.error('❌ Error updating tab counts:', error);
    }
}

async function updateJobStatusInMockData(jobId, newStatus) {
    if (MOCK_LISTINGS_DATA) {
        const jobIndex = MOCK_LISTINGS_DATA.findIndex(job => job.jobId === jobId);
        if (jobIndex !== -1) {
            MOCK_LISTINGS_DATA[jobIndex].status = newStatus;
            MOCK_LISTINGS_DATA[jobIndex].lastModified = new Date().toISOString();
            console.log(`📊 Mock data updated: Job ${jobId} status → ${newStatus}`);
            return true;
        }
    }
    return false;
}

async function updateCompletedJobWorkerFeedback(jobId, feedbackText, rating) {
    // This simulates updating worker feedback in Firebase
    console.log(`📝 Updating worker feedback for job ${jobId}: "${feedbackText}" with ${rating} stars`);
    
    // Update the mock data
    if (!MOCK_COMPLETED_DATA) {
        MOCK_COMPLETED_DATA = generateCompletedJobsData();
    }
    
    const jobIndex = MOCK_COMPLETED_DATA.findIndex(job => job.jobId === jobId);
    if (jobIndex !== -1) {
        MOCK_COMPLETED_DATA[jobIndex].workerFeedback = feedbackText;
        MOCK_COMPLETED_DATA[jobIndex].workerRating = rating;
        console.log(`✅ Mock data updated: Job ${jobId} now has worker feedback (${rating} stars)`);
        
        // Refresh the Previous tab to show the updated card
        await loadPreviousContent();
        return true;
    }
    
    console.error(`❌ Job ${jobId} not found in completed jobs data`);
    return false;
}

async function addJobToCompletedData(hiringJob, customerRating, customerFeedback) {
    // Initialize completed data if it doesn't exist
    if (!MOCK_COMPLETED_DATA) {
        MOCK_COMPLETED_DATA = generateCompletedJobsData();
    }
    
    // Transform hiring job into completed job format
    const completedJob = {
        jobId: hiringJob.jobId,
        posterId: hiringJob.posterId,
        posterName: hiringJob.posterName,
        posterThumbnail: hiringJob.posterThumbnail,
        title: hiringJob.title,
        category: hiringJob.category,
        thumbnail: hiringJob.thumbnail,
        jobDate: hiringJob.jobDate,
        startTime: hiringJob.startTime,
        endTime: hiringJob.endTime,
        priceOffer: hiringJob.priceOffer,
        completedAt: new Date().toISOString(), // Current timestamp
        rating: customerRating, // Customer's rating for the worker
        feedback: customerFeedback, // Customer's feedback for the worker
        workerFeedback: null, // Worker can leave feedback later
        workerRating: 0, // Worker rating for customer (can be added later)
        role: 'customer', // Current user (Peter) is the customer in this scenario
        hiredWorkerId: hiringJob.hiredWorkerId,
        hiredWorkerName: hiringJob.hiredWorkerName,
        hiredWorkerThumbnail: hiringJob.hiredWorkerThumbnail
    };
    
    // Add to the beginning of completed data (most recent first)
    MOCK_COMPLETED_DATA.unshift(completedJob);
    
    console.log(`📋 Added job ${hiringJob.jobId} to completed data with customer rating: ${customerRating}/5`);
    return true;
}

// ========================== CUSTOMER FEEDBACK HANDLING ==========================

function initializeCustomerFeedbackHandlers() {
    const overlay = document.getElementById('leaveFeedbackOverlay');
    if (!overlay || overlay.dataset.feedbackHandlersInitialized) return;

    const submitBtn = document.getElementById('submitCustomerFeedbackBtn');
    const cancelBtn = document.getElementById('cancelCustomerFeedbackBtn');
    const textarea = document.getElementById('customerFeedback');
    const stars = document.querySelectorAll('#customerFeedbackStars .feedback-star');

    // Submit feedback handler
    if (submitBtn) {
        const submitHandler = async function() {
            await submitCustomerFeedback();
        };
        submitBtn.addEventListener('click', submitHandler);
        registerCleanup('customerFeedback', 'submitBtn', () => {
            submitBtn.removeEventListener('click', submitHandler);
        });
    }

    // Cancel feedback handler
    if (cancelBtn) {
        const cancelHandler = function() {
            hideCustomerFeedbackOverlay();
        };
        cancelBtn.addEventListener('click', cancelHandler);
        registerCleanup('customerFeedback', 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }

    // Initialize star rating for customer feedback
    initializeCustomerFeedbackStarRating();

    // Initialize character count for customer feedback
    initializeCustomerFeedbackCharacterCount();

    // Background click handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            hideCustomerFeedbackOverlay();
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup('customerFeedback', 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });

    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideCustomerFeedbackOverlay();
        }
    };
    addDocumentListener('customerFeedbackEscape', escapeHandler);

    overlay.dataset.feedbackHandlersInitialized = 'true';
    console.log('🔧 Customer feedback handlers initialized');
}

function initializeCustomerFeedbackStarRating() {
    const stars = document.querySelectorAll('#customerFeedbackStars .feedback-star');
    
    stars.forEach((star, index) => {
        const rating = parseInt(star.getAttribute('data-rating'));
        
        const mouseEnterHandler = function() {
            highlightCustomerStars(rating, stars);
        };
        
        const mouseLeaveHandler = function() {
            const selectedRating = getCustomerFeedbackRating();
            if (selectedRating > 0) {
                selectCustomerStars(selectedRating, stars);
    } else {
                clearCustomerStars(stars);
            }
        };
        
        const clickHandler = function() {
            selectCustomerStars(rating, stars);
            star.dataset.selected = 'true';
            
            // Clear other selections
            stars.forEach((s, i) => {
                if (i < rating) {
                    s.dataset.selected = 'true';
                } else {
                    s.dataset.selected = 'false';
                }
            });
            
            // Update submit button state when rating changes
            const textarea = document.getElementById('customerFeedback');
            const submitBtn = document.getElementById('submitCustomerFeedbackBtn');
            if (textarea && submitBtn) {
                const textLength = textarea.value.trim().length;
                if (textLength >= 2 && rating > 0) {
                    submitBtn.disabled = false;
                } else {
                    submitBtn.disabled = true;
                }
            }
        };
        
        star.addEventListener('mouseenter', mouseEnterHandler);
        star.addEventListener('mouseleave', mouseLeaveHandler);
        star.addEventListener('click', clickHandler);
        
        // Store handlers for cleanup
        registerCleanup('customerFeedback', `star_${index}`, () => {
            star.removeEventListener('mouseenter', mouseEnterHandler);
            star.removeEventListener('mouseleave', mouseLeaveHandler);
            star.removeEventListener('click', clickHandler);
        });
    });
}

function highlightCustomerStars(rating, stars) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('hover');
            star.classList.remove('filled');
        } else {
            star.classList.remove('hover', 'filled');
        }
    });
}

function selectCustomerStars(rating, stars) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            star.classList.remove('hover');
        } else {
            star.classList.remove('filled', 'hover');
        }
    });
}

function clearCustomerStars(stars) {
    stars.forEach(star => {
        star.classList.remove('filled', 'hover');
    });
}

function getCustomerFeedbackRating() {
    const stars = document.querySelectorAll('#customerFeedbackStars .feedback-star');
    for (let i = stars.length - 1; i >= 0; i--) {
        if (stars[i].dataset.selected === 'true') {
            return i + 1;
        }
    }
    return 0;
}

function initializeCustomerFeedbackCharacterCount() {
    const textarea = document.getElementById('customerFeedback');
    const charCount = document.getElementById('customerFeedbackCharCount');
    const submitBtn = document.getElementById('submitCustomerFeedbackBtn');
    
    if (!textarea || !charCount || !submitBtn) return;
    
    const updateHandler = function() {
        const count = textarea.value.length;
        charCount.textContent = count;
        
        // Update character count color
        if (count > 280) {
            charCount.style.color = '#fc8181';
        } else if (count > 240) {
            charCount.style.color = '#fbbf24';
        } else {
            charCount.style.color = '#a0aec0';
        }
        
        // Enable/disable submit button based on minimum 2 characters
        const rating = getCustomerFeedbackRating();
        if (count >= 2 && rating > 0) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    };
    
    const focusHandler = function(e) {
        handleCustomerFeedbackTextareaFocus(e);
    };
    
    const blurHandler = function(e) {
        handleCustomerFeedbackTextareaBlur(e);
    };
    
    textarea.addEventListener('input', updateHandler);
    textarea.addEventListener('focus', focusHandler);
    textarea.addEventListener('blur', blurHandler);
    
    registerCleanup('customerFeedback', 'textarea', () => {
        textarea.removeEventListener('input', updateHandler);
        textarea.removeEventListener('focus', focusHandler);
        textarea.removeEventListener('blur', blurHandler);
    });
}

function handleCustomerFeedbackTextareaFocus(e) {
    const overlay = document.getElementById('leaveFeedbackOverlay');
    overlay.classList.add('input-focused');
}

function handleCustomerFeedbackTextareaBlur(e) {
    const overlay = document.getElementById('leaveFeedbackOverlay');
    overlay.classList.remove('input-focused');
}

async function submitCustomerFeedback() {
    const overlay = document.getElementById('leaveFeedbackOverlay');
    const jobId = overlay.getAttribute('data-job-id');
    const customerName = overlay.getAttribute('data-customer-name');
    const rating = getCustomerFeedbackRating();
    const feedbackText = document.getElementById('customerFeedback').value.trim();
    
    if (rating === 0) {
        showErrorNotification('Please select a rating before submitting');
        return;
    }
    
    if (feedbackText.length < 2) {
        showErrorNotification('Feedback must be at least 2 characters long');
        return;
    }
    
    console.log('💭 Submitting customer feedback:', {
        jobId,
        customerName,
        rating,
        feedbackText
    });
    
    try {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // const currentUserId = firebase.auth().currentUser.uid;
        // 
        // await db.collection('feedback').add({
        //     jobId: jobId,
        //     fromUserId: currentUserId,
        //     toUserId: customerUserId,
        //     rating: rating,
        //     feedbackText: feedbackText,
        //     feedbackType: 'worker_to_customer',
        //     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        //     isPublic: true
        // });
        
        // Mock submission delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update mock data to reflect the new feedback
        await updateCompletedJobWorkerFeedback(jobId, feedbackText, rating);
        
        hideCustomerFeedbackOverlay();
        showFeedbackSubmittedSuccess(customerName);
        
    } catch (error) {
        console.error('❌ Error submitting customer feedback:', error);
        showErrorNotification('Failed to submit feedback. Please try again.');
    }
}

function resetCustomerFeedbackForm() {
    const stars = document.querySelectorAll('#customerFeedbackStars .feedback-star');
    const textarea = document.getElementById('customerFeedback');
    const charCount = document.getElementById('customerFeedbackCharCount');
    const submitBtn = document.getElementById('submitCustomerFeedbackBtn');
    
    // Reset stars
    stars.forEach(star => {
        star.classList.remove('filled', 'hover');
        star.dataset.selected = 'false';
    });
    
    // Reset textarea
    if (textarea) {
        textarea.value = '';
    }
    
    // Reset char count
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#a0aec0';
    }
    
    // Disable submit button initially
    if (submitBtn) {
        submitBtn.disabled = true;
    }
}

function hideCustomerFeedbackOverlay() {
    const overlay = document.getElementById('leaveFeedbackOverlay');
    overlay.classList.remove('show', 'input-focused');
    
    // Clear handlers initialization flag
    delete overlay.dataset.feedbackHandlersInitialized;
    
    // Clean up handlers
    executeCleanupsByType('customerFeedback');
    
    console.log('🔧 Customer feedback overlay hidden and handlers cleaned up');
}

function showFeedbackSubmittedSuccess(customerName) {
    const overlay = document.getElementById('feedbackSubmittedOverlay');
    const message = document.getElementById('feedbackSubmittedMessage');
    
    message.textContent = `Thank you! Your feedback for ${customerName} has been submitted successfully.`;
    
    const okBtn = document.getElementById('feedbackSubmittedOkBtn');
    const okHandler = function() {
        overlay.classList.remove('show');
        okBtn.removeEventListener('click', okHandler);
    };
    okBtn.addEventListener('click', okHandler);
    
    overlay.classList.add('show');
}

// ========================== DISPUTE HANDLING ==========================

function initializeDisputeHandlers() {
    const overlay = document.getElementById('reportDisputeOverlay');
    if (!overlay || overlay.dataset.disputeHandlersInitialized) return;

    const submitBtn = document.getElementById('submitDisputeBtn');
    const cancelBtn = document.getElementById('disputeCancelBtn');
    const textarea = document.getElementById('disputeReasonInput');

    // Submit dispute handler
    if (submitBtn) {
        const submitHandler = async function() {
            await submitDispute();
        };
        submitBtn.addEventListener('click', submitHandler);
        registerCleanup('dispute', 'submitBtn', () => {
            submitBtn.removeEventListener('click', submitHandler);
        });
    }

    // Cancel dispute handler
    if (cancelBtn) {
        const cancelHandler = function() {
            hideDisputeOverlay();
        };
        cancelBtn.addEventListener('click', cancelHandler);
        registerCleanup('dispute', 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }

    // Initialize character count and validation
    initializeDisputeCharacterCount();

    // Background click handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            hideDisputeOverlay();
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup('dispute', 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });

    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideDisputeOverlay();
        }
    };
    addDocumentListener('disputeEscape', escapeHandler);

    overlay.dataset.disputeHandlersInitialized = 'true';
    console.log('🔧 Dispute handlers initialized');
}

function initializeDisputeCharacterCount() {
    const textarea = document.getElementById('disputeReasonInput');
    const charCount = document.getElementById('disputeCharCount');
    const submitBtn = document.getElementById('submitDisputeBtn');
    const errorDiv = document.getElementById('disputeReasonError');
    
    if (!textarea || !charCount || !submitBtn || !errorDiv) return;
    
    const updateHandler = function() {
        const count = textarea.value.length;
        charCount.textContent = count;
        
        // Update character count color
        if (count > 450) {
            charCount.style.color = '#fc8181';
        } else if (count > 400) {
            charCount.style.color = '#fbbf24';
        } else {
            charCount.style.color = '#a0aec0';
        }
        
        // Validate minimum length (10 characters)
        if (count >= 10) {
            submitBtn.disabled = false;
            errorDiv.classList.remove('show');
        } else {
            submitBtn.disabled = true;
            if (count > 0) {
                errorDiv.classList.add('show');
            } else {
                errorDiv.classList.remove('show');
            }
        }
    };
    
    const focusHandler = function(e) {
        handleDisputeTextareaFocus(e);
    };
    
    const blurHandler = function(e) {
        handleDisputeTextareaBlur(e);
    };
    
    textarea.addEventListener('input', updateHandler);
    textarea.addEventListener('focus', focusHandler);
    textarea.addEventListener('blur', blurHandler);
    
    registerCleanup('dispute', 'textarea', () => {
        textarea.removeEventListener('input', updateHandler);
        textarea.removeEventListener('focus', focusHandler);
        textarea.removeEventListener('blur', blurHandler);
    });
    
    // Initial validation
    updateHandler();
}

function handleDisputeTextareaFocus(e) {
    const overlay = document.getElementById('reportDisputeOverlay');
    overlay.classList.add('input-focused');
}

function handleDisputeTextareaBlur(e) {
    const overlay = document.getElementById('reportDisputeOverlay');
    overlay.classList.remove('input-focused');
}

async function submitDispute() {
    const overlay = document.getElementById('reportDisputeOverlay');
    const jobId = overlay.getAttribute('data-job-id');
    const customerName = overlay.getAttribute('data-customer-name');
    const jobTitle = overlay.getAttribute('data-job-title');
    const disputeReason = document.getElementById('disputeReasonInput').value.trim();
    
    if (disputeReason.length < 10) {
        showErrorNotification('Please provide at least 10 characters for the dispute reason');
        return;
    }
    
    console.log('⚠️ Submitting dispute:', {
        jobId,
        customerName,
        jobTitle,
        disputeReason
    });
    
    try {
        // Firebase Implementation:
        // const db = firebase.firestore();
        // const currentUserId = firebase.auth().currentUser.uid;
        // 
        // await db.collection('disputes').add({
        //     jobId: jobId,
        //     reporterUserId: currentUserId,
        //     reportedUserId: customerUserId,
        //     jobTitle: jobTitle,
        //     disputeReason: disputeReason,
        //     status: 'pending',
        //     createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        //     priority: 'medium'
        // });
        
        // Mock submission delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        hideDisputeOverlay();
        showDisputeSubmittedSuccess(customerName, jobTitle);
        
    } catch (error) {
        console.error('❌ Error submitting dispute:', error);
        showErrorNotification('Failed to submit dispute. Please try again.');
    }
}

function resetDisputeForm() {
    const textarea = document.getElementById('disputeReasonInput');
    const charCount = document.getElementById('disputeCharCount');
    const submitBtn = document.getElementById('submitDisputeBtn');
    const errorDiv = document.getElementById('disputeReasonError');
    
    // Reset textarea
    if (textarea) {
        textarea.value = '';
    }
    
    // Reset char count
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#a0aec0';
    }
    
    // Reset button state
    if (submitBtn) {
        submitBtn.disabled = true;
    }
    
    // Hide error
    if (errorDiv) {
        errorDiv.classList.remove('show');
    }
}

function hideDisputeOverlay() {
    const overlay = document.getElementById('reportDisputeOverlay');
    overlay.classList.remove('show', 'input-focused');
    
    // Clear handlers initialization flag
    delete overlay.dataset.disputeHandlersInitialized;
    
    // Clean up handlers
    executeCleanupsByType('dispute');
    
    console.log('🔧 Dispute overlay hidden and handlers cleaned up');
}

function showDisputeSubmittedSuccess(customerName, jobTitle) {
    const overlay = document.getElementById('disputeSubmittedOverlay');
    const message = document.getElementById('disputeSubmittedMessage');
    
    message.textContent = `Your dispute regarding "${jobTitle}" with ${customerName} has been submitted and will be reviewed by our support team within 24-48 hours.`;
    
    const okBtn = document.getElementById('disputeSubmittedOkBtn');
    const okHandler = function() {
        overlay.classList.remove('show');
        okBtn.removeEventListener('click', okHandler);
    };
    okBtn.addEventListener('click', okHandler);
    
    overlay.classList.add('show');
} 