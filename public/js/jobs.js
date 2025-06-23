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
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    const formatDateTime = (date) => date.toISOString();
    
    return [
        {
            // Job Post Core Data
            jobId: 'job_2024_001_limpyo',
            posterId: 'user_peter_ang_001',
            posterName: 'Peter J. Ang',
            posterAvatar: 'public/users/Peter-J-Ang-User-01.jpg',
            
            // Job Details
            title: 'Deep Clean My 3-Bedroom House Before Family Visit',
            description: 'Need thorough cleaning of entire 3-bedroom house including bathrooms, kitchen, living areas. Family visiting this weekend, need everything spotless.',
            category: 'limpyo',
            categoryName: 'Cleaning Services',
            
            // Scheduling
            jobDate: '2024-01-18',
            jobTime: '9:00 AM',
            estimatedDuration: '4-6 hours',
            urgency: 'high',
            
            // Location & Contact
            location: {
                barangay: 'Lahug',
                city: 'Cebu City',
                coordinates: { lat: 10.3157, lng: 123.8854 }
            },
            
            // Payment & Budget
            budget: {
                amount: 2500,
                currency: 'PHP',
                paymentType: 'fixed' // fixed, hourly, negotiable
            },
            
            // Media
            thumbnail: 'public/mock/mock-limpyo-post1.jpg',
            images: ['public/mock/mock-limpyo-post1.jpg'],
            
            // Post Metadata
            datePosted: formatDateTime(yesterday),
            timePosted: '10:30 AM',
            status: 'active', // active, paused, completed, cancelled
            
            // Applications Data
            applicationCount: 3,
            applicationIds: ['app_001_user05', 'app_002_user08', 'app_003_user11'],
            
            // Engagement
            viewCount: 24,
            favoriteCount: 7
        },
        {
            // Job Post Core Data
            jobId: 'job_2024_002_kompra',
            posterId: 'user_maria_santos_002',
            posterName: 'Maria Santos',
            posterAvatar: 'public/users/User-02.jpg',
            
            // Job Details
            title: 'Weekly Grocery Shopping for Elderly Grandmother',
            description: 'Help with weekly grocery shopping for my 85-year-old grandmother. Need someone reliable and patient. Shopping list provided.',
            category: 'kompra',
            categoryName: 'Shopping Services',
            
            // Scheduling
            jobDate: '2024-01-20',
            jobTime: '3:00 PM',
            estimatedDuration: '2-3 hours',
            urgency: 'medium',
            isRecurring: true,
            recurringType: 'weekly',
            
            // Location & Contact
            location: {
                barangay: 'Capitol Site',
                city: 'Cebu City',
                coordinates: { lat: 10.3036, lng: 123.8939 }
            },
            
            // Payment & Budget
            budget: {
                amount: 800,
                currency: 'PHP',
                paymentType: 'fixed'
            },
            
            // Media
            thumbnail: 'public/mock/mock-kompra-post3.jpg',
            images: ['public/mock/mock-kompra-post3.jpg'],
            
            // Post Metadata
            datePosted: formatDateTime(twoDaysAgo),
            timePosted: '2:15 PM',
            status: 'active',
            
            // Applications Data
            applicationCount: 7,
            applicationIds: ['app_004_user03', 'app_005_user07', 'app_006_user09', 'app_007_user12', 'app_008_user15', 'app_009_user18', 'app_010_user20'],
            
            // Engagement
            viewCount: 45,
            favoriteCount: 12
        },
        {
            // Job Post Core Data
            jobId: 'job_2024_003_hatod',
            posterId: 'user_carlos_dela_cruz_003',
            posterName: 'Carlos Dela Cruz',
            posterAvatar: 'public/users/User-03.jpg',
            
            // Job Details
            title: 'Airport Pickup & Drop-off for Business Trip',
            description: 'Need reliable driver for airport pickup early morning. Flight arrives 6:30 AM, need to be at terminal by 6:00 AM.',
            category: 'hatod',
            categoryName: 'Transportation Services',
            
            // Scheduling
            jobDate: '2024-01-17',
            jobTime: '6:30 AM',
            estimatedDuration: '1-2 hours',
            urgency: 'high',
            
            // Location & Contact
            location: {
                barangay: 'Guadalupe',
                city: 'Cebu City',
                coordinates: { lat: 10.2929, lng: 123.9061 }
            },
            pickupLocation: 'Mactan-Cebu International Airport',
            dropoffLocation: 'IT Park, Lahug',
            
            // Payment & Budget
            budget: {
                amount: 1200,
                currency: 'PHP',
                paymentType: 'fixed'
            },
            
            // Media
            thumbnail: 'public/mock/mock-kompra-post6.jpg',
            images: ['public/mock/mock-kompra-post6.jpg'],
            
            // Post Metadata
            datePosted: formatDateTime(today),
            timePosted: '8:45 AM',
            status: 'active',
            
            // Applications Data
            applicationCount: 2,
            applicationIds: ['app_011_user06', 'app_012_user14'],
            
            // Engagement
            viewCount: 18,
            favoriteCount: 4
        },
        {
            // Job Post Core Data
            jobId: 'job_2024_004_hakot',
            posterId: 'user_ana_reyes_004',
            posterName: 'Ana Reyes',
            posterAvatar: 'public/users/User-04.jpg',
            
            // Job Details
            title: 'Move Heavy Furniture from 2nd Floor to Storage',
            description: 'Need 2-3 strong people to help move heavy furniture (sofa, dining table, cabinets) from 2nd floor apartment to storage facility.',
            category: 'hakot',
            categoryName: 'Moving Services',
            
            // Scheduling
            jobDate: '2024-01-19',
            jobTime: '1:00 PM',
            estimatedDuration: '3-4 hours',
            urgency: 'medium',
            
            // Location & Contact
            location: {
                barangay: 'Kamputhaw',
                city: 'Cebu City',
                coordinates: { lat: 10.3103, lng: 123.8947 }
            },
            
            // Requirements
            requirements: ['Physical strength', 'Experience with furniture moving', 'Own transportation preferred'],
            teamSize: '2-3 people',
            
            // Payment & Budget
            budget: {
                amount: 1800,
                currency: 'PHP',
                paymentType: 'fixed',
                splitBetweenWorkers: true
            },
            
            // Media
            thumbnail: 'public/mock/mock-hakot-post7.jpg',
            images: ['public/mock/mock-hakot-post7.jpg'],
            
            // Post Metadata
            datePosted: formatDateTime(threeDaysAgo),
            timePosted: '4:20 PM',
            status: 'active',
            
            // Applications Data
            applicationCount: 5,
            applicationIds: ['app_013_user02', 'app_014_user10', 'app_015_user13', 'app_016_user16', 'app_017_user19'],
            
            // Engagement
            viewCount: 32,
            favoriteCount: 8
        }
    ];
}

function generateListingCardHTML(listing) {
    const timeAgo = formatTimeAgo(listing.datePosted);
    const applicationText = listing.applicationCount === 1 ? '1 application' : `${listing.applicationCount} applications`;
    const jobDateFormatted = formatJobDate(listing.jobDate);
    
    return `
        <div class="listing-card" 
             data-job-id="${listing.jobId}" 
             data-poster-id="${listing.posterId}"
             data-category="${listing.category}"
             data-application-count="${listing.applicationCount}"
             data-budget="${listing.budget.amount}"
             data-urgency="${listing.urgency}">
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
                            <span class="job-time">🕒 ${listing.jobTime}</span>
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
        budget: parseInt(cardElement.getAttribute('data-budget')),
        urgency: cardElement.getAttribute('data-urgency'),
        title: cardElement.querySelector('.listing-title').textContent,
        thumbnail: cardElement.querySelector('.listing-thumbnail img').src
    };
}

function showListingOptionsOverlay(jobData) {
    console.log(`🔧 Opening options overlay for job: ${jobData.jobId}`);
    console.log(`📊 Job Data:`, jobData);
    
    // TODO: Create and show overlay with Modify/Delete options
    // For now, just log the comprehensive job data
    console.log('📋 Listings overlay options: MODIFY | DELETE');
    console.log(`💰 Budget: ₱${jobData.budget}`);
    console.log(`👥 Applications: ${jobData.applicationCount}`);
    console.log(`⚡ Urgency: ${jobData.urgency}`);
}

// Helper function to get full job data by ID (for future Firebase integration)
function getJobDataById(jobId) {
    const mockListings = generateMockListings();
    return mockListings.find(job => job.jobId === jobId);
}

// Helper function to get application data by job ID (for future Firebase integration)
function getApplicationsByJobId(jobId) {
    const jobData = getJobDataById(jobId);
    if (!jobData) return [];
    
    // TODO: Replace with actual Firebase query
    // return await db.collection('applications').where('jobId', '==', jobId).get();
    
    // Mock application data structure
    return jobData.applicationIds.map(appId => ({
        applicationId: appId,
        applicantId: appId.split('_')[2],
        jobId: jobId,
        status: 'pending', // pending, accepted, rejected
        appliedAt: new Date().toISOString(),
        message: 'I am interested in this job...',
        rating: null,
        proposal: {
            rate: jobData.budget.amount,
            estimatedTime: jobData.estimatedDuration,
            message: 'I have experience with this type of work...'
        }
    }));
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