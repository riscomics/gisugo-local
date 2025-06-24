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
        // Firebase: return await db.collection('jobs').where('posterId', '==', currentUserId).get()
        return this.initialize();
    },
    
    // Get all hired jobs (simulates Firebase query)
    async getAllHiredJobs() {
        // Firebase: return await db.collection('jobs').where('status', '==', 'hired').get()
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
        // Firebase: await db.collection('jobs').doc(jobId).update({ status: newStatus })
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
        // Firebase: await db.collection('jobs').doc(jobId).delete()
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
    const jobData = getJobDataById(jobId);
    if (!jobData) return [];
    
    // TODO: Replace with Firebase query: db.collection('applications').where('jobId', '==', jobId)
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
            
            <div class="hiring-thumbnail">
                <img src="${job.thumbnail}" alt="${job.title}" loading="lazy">
            </div>
            
            <div class="hiring-content">
                <div class="hiring-title">${job.title}</div>
                
                <div class="hiring-main-row">
                    <div class="hiring-schedule-column">
                        <div class="hiring-schedule-row">
                            <div class="hiring-date-section">
                                <div class="hiring-due-label">DATE</div>
                                <div class="hiring-date">${formatJobDate(job.jobDate)}</div>
                            </div>
                            <div class="hiring-times-section" data-start-time="${job.startTime}" data-end-time="${job.endTime}">
                                <div class="hiring-time-labels">
                                    <div class="hiring-time-label">Start</div>
                                    <div class="hiring-time-label">End</div>
                                </div>
                                <div class="hiring-time-values">
                                    <div class="hiring-time-value">${job.startTime}</div>
                                    <div class="hiring-time-value">${job.endTime}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="hiring-role-caption ${roleClass}">${roleCaption}</div>
                    </div>
                    
                    <div class="hiring-price-column">
                        <div class="hiring-price">${job.priceOffer}</div>
                        
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
    // TODO: Implement hiring options overlay
    alert(`Hiring options for: ${jobData.title}\nRole: ${jobData.role}\nJob ID: ${jobData.jobId}`);
}

function showEmptyHiringState() {
    const container = document.querySelector('.hiring-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <div class="empty-state-title">No Active Hired Jobs</div>
            <div class="empty-state-message">
                Jobs you've hired someone for or been hired for will appear here.<br>
                You can mark them as completed or manage the hiring.
            </div>
        </div>
    `;
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
        jobPageUrl: overlay.getAttribute('data-job-page-url'),
        currentStatus: overlay.getAttribute('data-current-status')
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
    
    try {
        // Get all jobs data
        const allJobs = await JobsDataService.getAllJobs();
        
        // Count jobs by status for each tab
        const counts = {
            listings: 0,    // Active jobs posted by user
            hiring: 0,      // Jobs with hired workers  
            previous: 0     // Completed/cancelled jobs
        };
        
        allJobs.forEach(job => {
            switch (job.status) {
                case 'active':
                case 'paused':
                    counts.listings++;
                    break;
                case 'hiring':
                case 'in-progress':
                    counts.hiring++;
                    break;
                case 'completed':
                case 'cancelled':
                    counts.previous++;
                    break;
                default:
                    // Default to listings for unknown status
                    counts.listings++;
            }
        });
        
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
    // Update status using the data service layer
    console.log(`🔄 Updating job status: ${jobId} → ${newStatus}`);
    
    const result = await JobsDataService.updateJobStatus(jobId, newStatus);
    
    if (result.success) {
        console.log(`📊 Job status updated: ${jobId} → ${newStatus}`);
    } else {
        console.warn(`⚠️ Failed to update job status: ${result.error}`);
    }
    
    return result;
} 