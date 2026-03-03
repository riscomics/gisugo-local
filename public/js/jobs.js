// GISUGO Jobs JavaScript

// ===== MEMORY LEAK PREVENTION SYSTEM =====
const CLEANUP_REGISTRY = {
    documentListeners: new Map(),
    elementListeners: new Map(), 
    activeControllers: new Set(),
    intervals: new Set(),
    cleanupFunctions: new Set()
};

// ===== GLOBAL MOCK DATA STORE =====
// This simulates Firebase real-time updates for development
// In production, this will be replaced by Firebase listeners
let MOCK_LISTINGS_DATA = null;
let MOCK_HIRING_DATA = null;
let MOCK_COMPLETED_DATA = null; // ADD: Missing completed data tracking
let MOCK_OFFERED_DATA = null; // ADD: Offered jobs data for worker perspective

// Current user ID for testing different perspectives
const CURRENT_USER_ID = 'user_peter_ang_001';

// ===== LOADING OVERLAY FUNCTIONS =====
function showLoadingOverlay(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const textEl = document.getElementById('loadingText');
    
    if (overlay) {
        if (textEl) textEl.textContent = message;
        overlay.style.display = 'flex';
        console.log(`⏳ Loading: ${message}`);
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log('✅ Loading complete');
    }
}

// Global utility function for date formatting
function formatDateTime(date) {
    return date.toISOString();
}

// Global utility function for relative date formatting (e.g., "2 days ago", "today")
function formatRelativeDate(dateString) {
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

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeUrl(url, fallback = '') {
    if (!url) return fallback;
    try {
        const parsed = new URL(url, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.toString();
        }
    } catch (error) {
        // fall through
    }
    return fallback;
}

const TAB_RENDER_GUARDS = {
    tokens: new Map(),
    activeRole: 'customer',
    activeCustomerTab: 'listings',
    activeWorkerTab: 'offered'
};
let faceViewerEscapeListenerKey = null;

function beginTabRender(scope) {
    const token = `${scope}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
    TAB_RENDER_GUARDS.tokens.set(scope, token);
    return token;
}

function isTabRenderCurrent(scope, token) {
    return TAB_RENDER_GUARDS.tokens.get(scope) === token;
}

function shouldApplyTabRender(scope, token) {
    if (!isTabRenderCurrent(scope, token)) return false;
    if (scope === 'listings' || scope === 'hiring' || scope === 'previous') {
        return TAB_RENDER_GUARDS.activeRole === 'customer' && TAB_RENDER_GUARDS.activeCustomerTab === scope;
    }
    if (scope === 'offered' || scope === 'accepted' || scope === 'worker-completed') {
        return TAB_RENDER_GUARDS.activeRole === 'worker' && TAB_RENDER_GUARDS.activeWorkerTab === scope;
    }
    return true;
}

function isAllowedTextCharacter(char) {
    if (!char) return true;
    if (/[\p{L}\p{N}\p{M}\p{Zs}\r\n]/u.test(char)) return true;
    if (/[.,!?'"()\/$&@₱-]/.test(char)) return true;
    if (/[\p{Extended_Pictographic}\u200D\uFE0F]/u.test(char)) return true;
    return false;
}

function sanitizeTextInput(value) {
    return Array.from(String(value || ''))
        .filter(isAllowedTextCharacter)
        .join('');
}

function hasUnsupportedTextChars(value) {
    return Array.from(String(value || ''))
        .some((char) => !isAllowedTextCharacter(char));
}

function showInputGuideHint(message) {
    let hint = document.getElementById('jobs-input-guide');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'jobs-input-guide';
        hint.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(88vw, 360px);
            padding: 8px;
            border-radius: 16px;
            background: repeating-linear-gradient(
                135deg,
                #facc15 0 10px,
                #111827 10px 20px
            );
            color: #fee2e2;
            text-align: center;
            box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.55), 0 20px 40px rgba(0,0,0,0.45);
            z-index: 11000;
            opacity: 0;
            transition: opacity 0.2s ease, transform 0.2s ease;
            pointer-events: none;
            overflow: hidden;
        `;
        document.body.appendChild(hint);
    }

    hint.innerHTML = `
        <div style="background:linear-gradient(180deg, rgba(127, 29, 29, 0.98), rgba(69, 10, 10, 0.98)); border:1px solid rgba(248,113,113,0.7); border-radius:12px; padding:12px 14px 14px;">
            <div style="font-size:30px; line-height:1; margin-bottom:6px;">🚨</div>
            <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; margin-bottom:8px;">SECURITY ALERT</div>
            <div style="font-size:14px; font-weight:600; line-height:1.38;">
                ${message}
            </div>
        </div>
    `;
    hint.style.opacity = '1';
    hint.style.transform = 'translate(-50%, -50%) scale(1)';
    clearTimeout(window.__jobsInputGuideTimer);
    window.__jobsInputGuideTimer = setTimeout(() => {
        hint.style.opacity = '0';
        hint.style.transform = 'translate(-50%, -50%) scale(0.98)';
    }, 3200);
}

function blockUnsupportedCharsForInput(inputEl) {
    if (!inputEl || inputEl.dataset.markupCharsBlocked === 'true') return;
    inputEl.dataset.markupCharsBlocked = 'true';

    const showInputGuide = () => {
        const now = Date.now();
        const lastShownAt = Number(inputEl.dataset.inputGuideShownAt || 0);
        if (now - lastShownAt < 1500) return;
        inputEl.dataset.inputGuideShownAt = String(now);
        showInputGuideHint('Only letters, numbers, emojis, spaces, and basic punctuation are allowed.');
    };

    inputEl.addEventListener('keydown', function(e) {
        if (e.key.length === 1 && !isAllowedTextCharacter(e.key)) {
            e.preventDefault();
            showInputGuide();
        }
    });

    inputEl.addEventListener('paste', function(e) {
        const pastedText = e.clipboardData ? e.clipboardData.getData('text') : '';
        if (!hasUnsupportedTextChars(pastedText)) return;
        e.preventDefault();
        showInputGuide();
        const cleaned = sanitizeTextInput(pastedText);
        const start = inputEl.selectionStart ?? inputEl.value.length;
        const end = inputEl.selectionEnd ?? inputEl.value.length;
        inputEl.setRangeText(cleaned, start, end, 'end');
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });

    inputEl.addEventListener('input', function() {
        const sanitized = sanitizeTextInput(inputEl.value);
        if (sanitized !== inputEl.value) {
            inputEl.value = sanitized;
            showInputGuide();
        }
    });
}

// Debug function to check data status
function debugDataStatus() {
    console.log('🔍 DEBUG: Current data status:', {
        MOCK_LISTINGS_DATA: MOCK_LISTINGS_DATA ? MOCK_LISTINGS_DATA.length : 'null',
        MOCK_HIRING_DATA: MOCK_HIRING_DATA ? MOCK_HIRING_DATA.length : 'null',
        MOCK_COMPLETED_DATA: MOCK_COMPLETED_DATA ? MOCK_COMPLETED_DATA.length : 'null',
        MOCK_OFFERED_DATA: MOCK_OFFERED_DATA ? MOCK_OFFERED_DATA.length : 'null'
    });
}

// Applications Data - Moved from messages.js for integration
const MOCK_APPLICATIONS = [
    {
        jobId: 'job_2024_001_limpyo', // Match existing job in listings
        jobTitle: 'House Cleaning - General cleaning, 3-bedroom apartment',
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
                jobId: 'job_2024_001_limpyo',
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
                jobId: 'job_2024_001_limpyo',
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
        jobId: 'job_2024_002_kompra',
        jobTitle: 'Shopping & Errands - Weekly grocery shopping',
        employerUid: 'user_currentUserUid',
        applicationCount: 2, // Reduced for Firebase demo
        jobStatus: 'active',
        createdAt: new Date('2025-12-19T08:00:00Z'),
        updatedAt: new Date('2025-12-22T11:00:00Z'),
        
        applications: [
            {
                applicationId: 'app_nR6mK3qT8jX2wS7nL9',
                applicantUid: 'user_bM9nR4kX8qT2jW5sP3',
                jobId: 'job_2024_002_kompra',
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
                jobId: 'job_2024_002_kompra',
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

// ===== DATA ACCESS LAYER (Firebase-Ready) =====
// This layer abstracts data access with CLEAN SEPARATION between Mock and Firebase
// Uses DataService pattern - toggle controls which data source is used
// ===== GLOBAL DATA SERVICE FOR CROSS-FILE ACCESS =====
window.JobsDataService = {
    
    // ===== MODE DETECTION =====
    _useFirebase() {
        return typeof DataService !== 'undefined' && DataService.useFirebase();
    },
    
    // ===== NORMALIZE FIREBASE JOB DATA =====
    // Convert Firebase field names to expected format
    _normalizeFirebaseJob(job) {
        // Extract numeric price from priceOffer string
        const priceValue = job.priceOffer ? parseInt(job.priceOffer.toString().replace(/[₱,]/g, '')) : 0;
        
        // Normalize paymentType from "Per Hour" to "per_hour"
        let normalizedPaymentType = 'per_job';
        if (job.paymentType) {
            if (job.paymentType.toLowerCase().includes('hour')) {
                normalizedPaymentType = 'per_hour';
            } else if (job.paymentType.toLowerCase().includes('day')) {
                normalizedPaymentType = 'per_day';
            } else {
                normalizedPaymentType = 'per_job';
            }
        }
        
        return {
            ...job,
            // Map scheduledDate -> jobDate
            jobDate: job.jobDate || job.scheduledDate,
            // Map id -> jobId (Firebase doc ID)
            jobId: job.jobId || job.id,
            // Extract numeric price from priceOffer
            price: priceValue,
            // Normalize paymentType to lowercase with underscore
            paymentType: normalizedPaymentType,
            // Ensure priceOffer has peso sign (display format)
            priceOffer: job.priceOffer ? 
                (job.priceOffer.toString().startsWith('₱') ? job.priceOffer : `₱${job.priceOffer}`) : 
                `₱${priceValue}`,
            // Normalize agreedPrice if it exists (for hired jobs)
            agreedPrice: job.agreedPrice ? 
                (job.agreedPrice.toString().startsWith('₱') ? job.agreedPrice : `₱${job.agreedPrice}`) : 
                undefined,
            // Ensure thumbnail exists
            thumbnail: job.thumbnail || job.photo || 'public/images/placeholder.png',
            // Ensure applicationCount is a number
            applicationCount: job.applicationCount || 0
        };
    },
    
    // Initialize data (for mock mode only)
    initialize() {
        if (!MOCK_LISTINGS_DATA) {
            MOCK_LISTINGS_DATA = this._generateInitialData();
        }
        return MOCK_LISTINGS_DATA;
    },
    
    // Get all jobs for current user (My Listings)
    async getAllJobs() {
        console.log(`📊 JobsDataService.getAllJobs() - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Load ONLY from Firestore
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                const user = await DataService.waitForAuth();
                if (!user) {
                    console.log('⚠️ Not authenticated in Firebase mode');
                    return [];
                }
                
                // Use getUserJobListings from firebase-db.js
                if (typeof getUserJobListings === 'function') {
                    const rawJobs = await getUserJobListings(user.uid, ['active', 'paused']);
                    console.log('🔍 DEBUG - Raw Firebase job sample (FULL):', JSON.stringify(rawJobs[0], null, 2)); // Full debug
                    // Normalize Firebase data to match expected field names
                    const jobs = rawJobs.map(job => this._normalizeFirebaseJob(job));
                    console.log('🔍 DEBUG - Normalized job sample (FULL):', JSON.stringify(jobs[0], null, 2)); // Full debug
                    console.log(`🔥 Loaded ${jobs.length} jobs from Firebase`);
                    return jobs;
                } else {
                    console.error('❌ getUserJobListings function not available');
                    return [];
                }
            } catch (error) {
                console.error('❌ Error loading jobs from Firebase:', error);
                return [];
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE - Load from mock data + localStorage
        // ══════════════════════════════════════════════════════════════
        console.log('🧪 Loading jobs from MOCK data...');
        
        // Get base mock data and merge with localStorage updates
        const baseMockJobs = this.initialize();
        
        // Get user-generated/modified jobs from localStorage (where new-post.js saves them)
        const localStorageJobs = this._getJobsFromLocalStorage();
        
        // Merge localStorage jobs with mock data, prioritizing localStorage versions
        const allJobs = this._mergeJobData(baseMockJobs, localStorageJobs);
        
        console.log('🧪 JobsDataService.getAllJobs() - Combined mock data:', {
            mockJobs: baseMockJobs.length,
            localStorageJobs: localStorageJobs.length,
            totalMerged: allJobs.length
        });
        
        // Filter for jobs posted by current user with active/paused status
        return allJobs.filter(job => 
            job.posterId === CURRENT_USER_ID && 
            (job.status === 'active' || job.status === 'paused')
        );
    },
    
    // Get all hired jobs (jobs in "hiring" status)
    async getAllHiredJobs() {
        console.log(`📊 JobsDataService.getAllHiredJobs() - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                const user = await DataService.waitForAuth();
                if (!user) {
                    console.log('⚠️ Not authenticated');
                    return [];
                }
                
                // Get jobs with 'hired' and 'accepted' status for this user
                // 'hired' = customer hired someone (appears in customer's Hiring tab)
                // 'accepted' = worker accepted the offer (appears in worker's Working tab)
                if (typeof getUserJobListings === 'function') {
                    const jobs = await getUserJobListings(user.uid, ['hired', 'accepted']);
                    console.log(`🔥 Loaded ${jobs.length} hired/accepted jobs from Firebase`);
                    return jobs;
                }
                return [];
            } catch (error) {
                console.error('❌ Error loading hired jobs:', error);
                return [];
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE
        // ══════════════════════════════════════════════════════════════
        if (!MOCK_HIRING_DATA) {
            MOCK_HIRING_DATA = this._generateHiredJobsData();
        }
        return MOCK_HIRING_DATA;
    },
    
    // Get single job by ID
    async getJobById(jobId) {
        console.log(`📊 JobsDataService.getJobById(${jobId}) - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                if (typeof getJobById === 'function') {
                    const job = await getJobById(jobId);
                    if (job) {
                        console.log(`🔥 Found job from Firebase: ${job.title}`);
                    }
                    return job;
                }
                console.error('❌ getJobById function not available');
                return null;
            } catch (error) {
                console.error('❌ Error getting job from Firebase:', error);
                return null;
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE
        // ══════════════════════════════════════════════════════════════
        const baseMockJobs = this.initialize();
        const localStorageJobs = this._getJobsFromLocalStorage();
        const allJobs = this._mergeJobData(baseMockJobs, localStorageJobs);
        
        console.log(`🧪 getJobById(${jobId}) - searching in ${allJobs.length} mock jobs`);
        
        const foundJob = allJobs.find(job => job.jobId === jobId || job.id === jobId);
        if (foundJob) {
            console.log(`✅ getJobById found job with status: ${foundJob.status}`);
        } else {
            console.log(`❌ getJobById job not found: ${jobId}`);
        }
        
        return foundJob;
    },
    
    // Update job status
    async updateJobStatus(jobId, newStatus) {
        console.log(`📊 JobsDataService.updateJobStatus(${jobId}, ${newStatus}) - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                if (typeof updateJobStatus === 'function') {
                    const result = await updateJobStatus(jobId, newStatus);
                    console.log(`🔥 Job status updated in Firebase:`, result);
                    return result;
                }
                return { success: false, error: 'updateJobStatus function not available' };
            } catch (error) {
                console.error('❌ Error updating job status in Firebase:', error);
                return { success: false, error: error.message };
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE
        // ══════════════════════════════════════════════════════════════
        const jobs = this.initialize();
        const jobIndex = jobs.findIndex(job => job.jobId === jobId);
        if (jobIndex !== -1) {
            jobs[jobIndex].status = newStatus;
            jobs[jobIndex].lastModified = new Date().toISOString();
            return { success: true };
        }
        return { success: false, error: 'Job not found' };
    },
    
    // Delete job
    async deleteJob(jobId) {
        console.log(`📊 JobsDataService.deleteJob(${jobId}) - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                if (typeof deleteJob === 'function') {
                    const result = await deleteJob(jobId);
                    console.log(`🔥 Job deleted in Firebase:`, result);
                    return result;
                }
                return { success: false, error: 'deleteJob function not available' };
            } catch (error) {
                console.error('❌ Error deleting job in Firebase:', error);
                return { success: false, error: error.message };
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE
        // ══════════════════════════════════════════════════════════════
        console.log(`🧪 Attempting to delete job from mock data: ${jobId}`);
        
        // FIXED: Check localStorage jobs first (where RELISTED jobs are stored)
        try {
            const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
            let foundInLocalStorage = false;
            
            // Search through all categories in localStorage
            Object.keys(allJobs).forEach(category => {
                if (Array.isArray(allJobs[category])) {
                    const jobIndex = allJobs[category].findIndex(job => job.jobId === jobId);
                    if (jobIndex !== -1) {
                        const deletedJob = allJobs[category][jobIndex];
                        console.log(`✅ Found RELISTED job in localStorage category '${category}':`, deletedJob);
                        
                        // Job deletion confirmed (no special blacklist needed)
                        console.log(`✅ RELISTED job deleted successfully: ${jobId}`);
                        
                        // Remove the job from the array
                        allJobs[category].splice(jobIndex, 1);
                        foundInLocalStorage = true;
                        
                        // Update localStorage
                        localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
                        console.log(`🗑️ Successfully deleted RELISTED job from localStorage: ${jobId}`);
                        
                        // CRITICAL FIX: Also remove from jobPreviewCards (used by category pages)
                        console.log('🔍 Removing job from jobPreviewCards for category pages...');
                        try {
                            let previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
                            const categoryPreviewCards = previewCards[category] || [];
                            
                            // Extract jobNumber from jobId (e.g., limpyo_job_2025_1751300670777 → 1751300670777)
                            const jobNumberMatch = jobId.match(/_(\d+)$/);
                            const jobNumber = jobNumberMatch ? jobNumberMatch[1] : null;
                            
                            console.log(`🔍 Extracted jobNumber: ${jobNumber} from jobId: ${jobId}`);
                            
                            // Find and remove the job preview card by matching template URL containing jobNumber
                            const previewCardIndex = categoryPreviewCards.findIndex(card => 
                                card.templateUrl && card.templateUrl.includes(`jobNumber=${jobNumber}`)
                            );
                            
                            if (previewCardIndex !== -1) {
                                const deletedCard = categoryPreviewCards[previewCardIndex];
                                categoryPreviewCards.splice(previewCardIndex, 1);
                                previewCards[category] = categoryPreviewCards;
                                localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
                                console.log(`✅ Job preview card also deleted from category '${category}':`, deletedCard);
                            } else {
                                console.log(`⚠️ Job preview card not found in category '${category}' for jobNumber '${jobNumber}'`);
                                console.log(`🔍 Available template URLs:`, categoryPreviewCards.map(c => c.templateUrl));
                            }
                        } catch (error) {
                            console.error('❌ Error removing job preview card:', error);
                        }
                    }
                }
            });
            
            if (foundInLocalStorage) {
                return { success: true };
            }
        } catch (error) {
            console.error('❌ Error deleting from localStorage:', error);
        }
        
        // Fallback: Check mock data for original jobs
        if (MOCK_LISTINGS_DATA) {
            const jobIndex = MOCK_LISTINGS_DATA.findIndex(job => job.jobId === jobId);
            if (jobIndex !== -1) {
                console.log(`✅ Found original job in mock data:`, MOCK_LISTINGS_DATA[jobIndex]);
                MOCK_LISTINGS_DATA.splice(jobIndex, 1);
                console.log(`🗑️ Successfully deleted original job from mock data: ${jobId}`);
                return { success: true };
            }
        }
        
        console.error(`❌ Job not found in localStorage or mock data: ${jobId}`);
        return { success: false, error: 'Job not found' };
    },
    
    // Clean up (prevents memory leaks) - ENHANCED
    cleanup() {
        MOCK_LISTINGS_DATA = null;
        MOCK_HIRING_DATA = null;
        MOCK_COMPLETED_DATA = null; // ADD: Clean up completed data
        MOCK_OFFERED_DATA = null; // ADD: Clean up offered data
        console.log('🧹 JobsDataService mock data cleared');
    },
    
    // ENHANCED: Get jobs from localStorage (where new-post.js saves modified jobs)
    _getJobsFromLocalStorage() {
        try {
            const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
            
            // Flatten all category arrays into a single jobs array
            const flattenedJobs = [];
            Object.keys(allJobs).forEach(category => {
                if (Array.isArray(allJobs[category])) {
                    allJobs[category].forEach(job => {
                        // Ensure each job has the required fields for compatibility
                        flattenedJobs.push({
                            ...job,
                            category: job.category || category,
                            jobPageUrl: job.jobPageUrl || `${job.category || category}.html`
                        });
                    });
                }
            });
            
            console.log('📱 Retrieved jobs from localStorage:', {
                totalJobs: flattenedJobs.length,
                byCategory: Object.keys(allJobs).map(cat => ({ category: cat, count: allJobs[cat]?.length || 0 }))
            });
            
            return flattenedJobs;
        } catch (error) {
            console.error('❌ Error reading localStorage jobs:', error);
            return [];
        }
    },
    
    // ENHANCED: Merge localStorage jobs with mock data (localStorage takes priority)
    _mergeJobData(mockJobs, localStorageJobs) {
        // Create a map of localStorage jobs by jobId for fast lookup
        const localStorageJobsMap = new Map();
        localStorageJobs.forEach(job => {
            if (job.jobId) {
                localStorageJobsMap.set(job.jobId, job);
            }
        });
        
        // Start with localStorage jobs (highest priority)
        const mergedJobs = [...localStorageJobs];
        
        // Add mock jobs that don't exist in localStorage
        mockJobs.forEach(mockJob => {
            if (!localStorageJobsMap.has(mockJob.jobId)) {
                mergedJobs.push(mockJob);
            }
        });
        
        // ENHANCED DEBUGGING - Show exactly what's happening with job data
        console.log('🔀 DETAILED Merged job data:', {
            localStorageOverrides: localStorageJobsMap.size,
            mockJobsAdded: mockJobs.length - localStorageJobsMap.size,
            totalAfterMerge: mergedJobs.length,
            mockJobIds: mockJobs.map(j => j.jobId),
            localStorageJobIds: localStorageJobs.map(j => j.jobId),
            overriddenMockJobs: mockJobs.filter(mockJob => localStorageJobsMap.has(mockJob.jobId)).map(j => j.jobId),
            finalJobIds: mergedJobs.map(j => j.jobId)
        });
        
        // Show specific job details for troubleshooting
        const problemJobId = 'job_2024_001_limpyo'; // The "Deep Clean" job that should be getting updated
        if (localStorageJobsMap.has(problemJobId)) {
            console.log('✅ Found updated version in localStorage for:', problemJobId, localStorageJobsMap.get(problemJobId));
        } else {
            console.log('❌ No localStorage override found for:', problemJobId);
            console.log('Mock version will be used:', mockJobs.find(j => j.jobId === problemJobId));
        }
        
        return mergedJobs;
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
                jobNumber: 1, // Extracted from jobId for update operations
                posterId: CURRENT_USER_ID, // Current user posted this job
                posterName: 'Peter J. Ang',
                title: 'Deep Clean My 3-Bedroom House Before Family Visit',
                description: 'Looking for experienced cleaner to deep clean my 3-bedroom house before family arrives for holidays. Need thorough cleaning of bathrooms, kitchen, living areas, and bedrooms. All cleaning supplies will be provided.',
                category: 'limpyo',
                thumbnail: 'public/mock/mock-limpyo-post1.jpg',
                jobDate: '2024-01-18',
                dateNeeded: '2024-01-18', // Backend field name
                startTime: '9AM',
                endTime: '1PM',
                priceOffer: '800', // Remove ₱ symbol for form population
                paymentAmount: '800', // Backend field name
                paymentType: 'total', // hourly, daily, total
                region: 'Metro Manila',
                city: 'Quezon City',
                extras: ['Deep Kitchen Cleaning', 'Bathroom Disinfection'],
                datePosted: formatDateTime(yesterday),
                status: 'active',
                applicationCount: 3,
                applicationIds: ['app_001_user05', 'app_002_user08', 'app_003_user11'],
                jobPageUrl: 'limpyo.html'
            },
            {
                jobId: 'job_2024_002_kompra',
                jobNumber: 2, // Extracted from jobId for update operations
                posterId: CURRENT_USER_ID, // Current user posted this job
                posterName: 'Peter J. Ang',
                title: 'Weekly Grocery Shopping for Elderly Grandmother',
                description: 'Need reliable person to do weekly grocery shopping for my 85-year-old grandmother. Will provide detailed list and payment. Must be careful with fresh produce selection and check expiration dates.',
                category: 'kompra',
                thumbnail: 'public/mock/mock-kompra-post3.jpg',
                jobDate: '2024-01-20',
                dateNeeded: '2024-01-20',
                startTime: '3PM',
                endTime: '5PM',
                priceOffer: '500',
                paymentAmount: '500',
                paymentType: 'total',
                region: 'Metro Manila',
                city: 'Manila',
                extras: ['Fresh Produce Selection', 'Receipt Required'],
                datePosted: formatDateTime(twoDaysAgo),
                status: 'active',
                applicationCount: 7,
                applicationIds: ['app_004_user03', 'app_005_user07', 'app_006_user09', 'app_007_user12', 'app_008_user15', 'app_009_user18', 'app_010_user20'],
                jobPageUrl: 'kompra.html'
            },
            {
                jobId: 'job_2024_003_hatod',
                jobNumber: 3, // Extracted from jobId for update operations
                posterId: CURRENT_USER_ID, // Current user posted this job
                posterName: 'Peter J. Ang',
                title: 'Airport Pickup & Drop-off for Business Trip',
                description: 'Need reliable driver for airport pickup and drop-off service for important business trip. Must have clean, air-conditioned vehicle and be punctual. Will provide flight details.',
                category: 'hatod',
                thumbnail: 'public/mock/mock-kompra-post6.jpg',
                jobDate: '2024-01-17',
                dateNeeded: '2024-01-17',
                startTime: '7AM',
                endTime: '9AM',
                priceOffer: '1200',
                paymentAmount: '1200',
                paymentType: 'total',
                region: 'Metro Manila',
                city: 'Pasay',
                extras: ['Air-conditioned Vehicle', 'Luggage Assistance'],
                datePosted: formatDateTime(today),
                status: 'active',
                applicationCount: 2,
                applicationIds: ['app_011_user06', 'app_012_user14'],
                jobPageUrl: 'hatod.html'
            },
            {
                jobId: 'job_2024_004_hakot',
                jobNumber: 4, // Extracted from jobId for update operations
                posterId: CURRENT_USER_ID, // Current user posted this job
                posterName: 'Peter J. Ang',
                title: 'Move Heavy Furniture from 2nd Floor to Storage',
                description: 'Need 2-3 strong workers to move heavy furniture and boxes from 2nd floor apartment to ground floor storage unit. Items include sofa, dining table, refrigerator, and multiple boxes.',
                category: 'hakot',
                thumbnail: 'public/mock/mock-hakot-post7.jpg',
                jobDate: '2024-01-19',
                dateNeeded: '2024-01-19',
                startTime: '1PM',
                endTime: '4PM',
                priceOffer: '1000',
                paymentAmount: '1000',
                paymentType: 'total',
                region: 'Metro Manila',
                city: 'Makati',
                extras: ['Heavy Lifting Required', 'Furniture Protection'],
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
                title: 'Move Heavy Furniture & Electronics to New House Location',
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
                 title: 'Airport Pickup & Drop-off Service with Luggage Handling',
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
    },
    
    // Get completed jobs (simulates Firebase query) - FIREBASE READY
    async getCompletedJobs() {
        console.log(`📊 JobsDataService.getCompletedJobs() - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Load completed jobs from Firestore
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                const user = await DataService.waitForAuth();
                if (!user) {
                    console.log('⚠️ Not authenticated in Firebase mode');
                    return [];
                }
                
                const currentUserId = user.uid;
                console.log(`🔍 Fetching completed jobs for user: ${currentUserId}`);
                
                const db = firebase.firestore();
                
                // Query for completed jobs where user is the poster
                // Force server read to avoid stale cache after feedback submission
                const posterSnapshot = await db.collection('jobs')
                    .where('status', '==', 'completed')
                    .where('posterId', '==', currentUserId)
                    .get({ source: 'server' });
                
                // Query for completed jobs where user is the hired worker
                // Force server read to avoid stale cache after feedback submission
                const workerSnapshot = await db.collection('jobs')
                    .where('status', '==', 'completed')
                    .where('hiredWorkerId', '==', currentUserId)
                    .get({ source: 'server' });
                
                console.log(`📊 Raw Firestore results: ${posterSnapshot.docs.length} as poster, ${workerSnapshot.docs.length} as worker`);
                
                // Combine both snapshots and remove duplicates
                const allDocs = [...posterSnapshot.docs, ...workerSnapshot.docs];
                const uniqueJobIds = new Set();
                const uniqueDocs = allDocs.filter(doc => {
                    if (uniqueJobIds.has(doc.id)) return false;
                    uniqueJobIds.add(doc.id);
                    return true;
                });
                
                console.log(`📊 Unique completed jobs: ${uniqueDocs.length}`);
                
                const completedJobs = uniqueDocs.map(doc => {
                    const data = doc.data();
                    const isCustomer = data.posterId === currentUserId;
                    
                    // Normalize paymentType
                    let normalizedPaymentType = 'per_job';
                    if (data.paymentType) {
                        if (data.paymentType.toLowerCase().includes('hour')) {
                            normalizedPaymentType = 'per_hour';
                        } else if (data.paymentType.toLowerCase().includes('day')) {
                            normalizedPaymentType = 'per_day';
                        }
                    }
                    
                    return {
                        // Core job identification
                        id: doc.id,
                        jobId: doc.id,
                        posterId: data.posterId,
                        posterName: data.posterName,
                        posterThumbnail: data.posterThumbnail,
                        
                        // Job details
                        title: data.title,
                        category: data.category,
                        thumbnail: data.thumbnail,
                        description: data.description,
                        
                        // Scheduling
                        scheduledDate: data.scheduledDate,
                        startTime: data.startTime,
                        endTime: data.endTime,
                        
                        // Financial
                        priceOffer: '₱' + (data.agreedPrice || data.priceOffer || 0),
                        price: parseFloat(data.agreedPrice || data.priceOffer || 0),
                        paymentType: normalizedPaymentType,
                        
                        // Completion data
                        completedAt: data.completedAt,
                        completedBy: data.completedBy,
                        
                        // Hiring information
                        hiredWorkerId: data.hiredWorkerId,
                        hiredWorkerName: data.hiredWorkerName,
                        hiredWorkerThumbnail: data.hiredWorkerThumbnail,
                        
                        // Role determination
                        role: isCustomer ? 'customer' : 'worker',
                        
                        // Rating and feedback from Firebase
                        rating: data.customerRating || 0,
                        feedback: data.customerFeedback || null,
                        workerFeedback: data.workerFeedback || null,
                        workerRating: data.workerRating || 0,
                        
                        // Status tracking
                        status: data.status,
                        datePosted: data.datePosted,
                        
                        // Firebase metadata
                        lastModified: data.lastModified,
                        modifiedBy: data.modifiedBy
                    };
                });
                
                // Sort by completion date (most recent first)
                completedJobs.sort((a, b) => {
                    const timeA = a.completedAt?.seconds || 0;
                    const timeB = b.completedAt?.seconds || 0;
                    return timeB - timeA;
                });
                
                console.log(`✅ Returning ${completedJobs.length} completed jobs`);
                return completedJobs;
                
            } catch (error) {
                console.error('❌ Error fetching completed jobs from Firebase:', error);
                return [];
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE - Return mock data
        // ══════════════════════════════════════════════════════════════
        if (!MOCK_COMPLETED_DATA) {
            MOCK_COMPLETED_DATA = generateCompletedJobsData();
        }
        return MOCK_COMPLETED_DATA;
    },
    
    // Get offered jobs (simulates Firebase query) - NEW FOR GIGS OFFERED TAB
    async getOfferedJobs() {
        console.log(`📊 JobsDataService.getOfferedJobs() - Mode: ${this._useFirebase() ? 'FIREBASE' : 'MOCK'}`);
        
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Load offered jobs from Firestore
        // ══════════════════════════════════════════════════════════════
        if (this._useFirebase()) {
            try {
                const user = await DataService.waitForAuth();
                if (!user) {
                    console.log('⚠️ Not authenticated in Firebase mode');
                    return [];
                }
                
                // Use getOfferedJobsForWorker from firebase-db.js
                if (typeof getOfferedJobsForWorker === 'function') {
                    const rawJobs = await getOfferedJobsForWorker(user.uid);
                    console.log(`🔥 Loaded ${rawJobs.length} offered jobs from Firebase`);
                    // Normalize data if needed
                    const jobs = rawJobs.map(job => this._normalizeFirebaseJob(job));
                    return jobs;
                } else {
                    console.error('❌ getOfferedJobsForWorker function not available');
                    return [];
                }
            } catch (error) {
                console.error('❌ Error loading offered jobs from Firebase:', error);
                return [];
            }
        }
        
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE - Use mock data
        // ══════════════════════════════════════════════════════════════
        console.log('🧪 Loading offered jobs from MOCK data...');
        
        if (!MOCK_OFFERED_DATA) {
            MOCK_OFFERED_DATA = this._generateOfferedJobsData();
        }
        return MOCK_OFFERED_DATA;
    },
    
    // Generate mock offered jobs data
    _generateOfferedJobsData() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        const formatDateTime = (date) => date.toISOString();
        
        return [
            {
                jobId: 'job_2024_offered_001',
                posterId: 'user_maria_santos_002',
                posterName: 'Maria Santos',
                posterThumbnail: 'public/users/User-02.jpg',
                title: 'Deep Clean 3-Bedroom House After Renovation',
                description: 'Need thorough cleaning after home renovation. Includes dust removal, window cleaning, and floor polishing.',
                category: 'limpyo',
                thumbnail: 'public/mock/mock-limpyo-post1.jpg',
                jobDate: '2024-01-25',
                startTime: '8AM',
                endTime: '5PM',
                priceOffer: '₱2,500',
                datePosted: formatDateTime(yesterday),
                dateOffered: formatDateTime(today),
                status: 'offered',
                hiredWorkerId: CURRENT_USER_ID,
                hiredWorkerName: 'Peter J. Ang',
                role: 'worker'
            },
            {
                jobId: 'job_2024_offered_002',
                posterId: 'user_ana_reyes_004',
                posterName: 'Ana Reyes',
                posterThumbnail: 'public/users/User-03.jpg',
                title: 'Transport Furniture from Makati to Quezon City',
                description: 'Need reliable transport for moving furniture and boxes to new apartment.',
                category: 'hatod',
                thumbnail: 'public/mock/mock-hatod-post2.jpg',
                jobDate: '2024-01-26',
                startTime: '10AM',
                endTime: '2PM',
                priceOffer: '₱1,800',
                datePosted: formatDateTime(yesterday),
                dateOffered: formatDateTime(today),
                status: 'offered',
                hiredWorkerId: CURRENT_USER_ID,
                hiredWorkerName: 'Peter J. Ang',
                role: 'worker'
            },
            {
                jobId: 'job_2024_offered_003',
                posterId: 'user_carlos_rivera_005',
                posterName: 'Carlos Rivera',
                posterThumbnail: 'public/users/User-05.jpg',
                title: 'Fix Kitchen Plumbing - Leaky Faucet and Clogged Drain',
                description: 'Need experienced plumber to fix kitchen sink issues. Faucet has been leaking for days and drain is completely blocked.',
                category: 'plumber',
                thumbnail: 'public/mock/mock-limpyo-post3.jpg',
                jobDate: '2024-01-27',
                startTime: '2PM',
                endTime: '4PM',
                priceOffer: '₱1,200',
                datePosted: formatDateTime(yesterday),
                dateOffered: formatDateTime(today),
                status: 'offered',
                hiredWorkerId: CURRENT_USER_ID,
                hiredWorkerName: 'Peter J. Ang',
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
        // For overlay-specific cleanup (hiring, listings, confirmation, success, previous)
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
    
    // Clean up element listeners - ENHANCED
    CLEANUP_REGISTRY.elementListeners.forEach((listeners, element) => {
        listeners.forEach(([event, handler]) => {
            element.removeEventListener(event, handler);
        });
    });
    CLEANUP_REGISTRY.elementListeners.clear();
    
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
    JobsDataService.cleanup();
    console.log('🧹 Global mock data cleared');
    
    console.log('🧹 Jobs page cleanup completed');
}

function executeCleanupsByType(type) {
    console.log(`🧹 Executing cleanup functions for type: ${type}`);
    
    // Clean up element listeners for specific type
    const elementsToClean = [];
    CLEANUP_REGISTRY.elementListeners.forEach((listeners, element) => {
        const filteredListeners = listeners.filter(([event, handler]) => {
            if (handler._type === type) {
                element.removeEventListener(event, handler);
                return false;
            }
            return true;
        });
        
        if (filteredListeners.length === 0) {
            elementsToClean.push(element);
        } else {
            CLEANUP_REGISTRY.elementListeners.set(element, filteredListeners);
        }
    });
    
    // Remove empty element entries
    elementsToClean.forEach(element => {
        CLEANUP_REGISTRY.elementListeners.delete(element);
    });
    
    // Clean up functions registered for specific type
    const toRemove = [];
    CLEANUP_REGISTRY.cleanupFunctions.forEach((cleanupFn) => {
        if (typeof cleanupFn === 'function' && cleanupFn._type === type) {
            try {
                cleanupFn();
                toRemove.push(cleanupFn);
            } catch (error) {
                console.warn(`Cleanup function error for type ${type}:`, error);
            }
        }
    });
    
    // Remove completed cleanup functions
    toRemove.forEach(cleanupFn => {
        CLEANUP_REGISTRY.cleanupFunctions.delete(cleanupFn);
    });
    
    console.log(`🧹 Cleanup completed for type: ${type}`);
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
    // Only run jobs page initialization on jobs.html (check for jobs-specific elements)
    const jobsTabsContainer = document.querySelector('.jobs-tabs');
    const uniformHeader = document.querySelector('.uniform-header');
    const isJobsPage = document.body.classList.contains('page-jobs');
    
    // Only initialize if we're on the actual jobs page
    if (jobsTabsContainer && uniformHeader && isJobsPage) {
        try {
        console.log('🎯 Jobs page detected - initializing jobs functionality');
        
        // Check for refresh parameter from MODIFY/RELIST success overlays
        const urlParams = new URLSearchParams(window.location.search);
        const shouldRefresh = urlParams.get('refresh');
        const preferredTab = urlParams.get('tab') || 'listings';
        
        if (shouldRefresh) {
            console.log('🔄 Refresh parameter detected - clearing cached job data');
            // Clear all cached data to force fresh load
            MOCK_LISTINGS_DATA = null;
            MOCK_HIRING_DATA = null;
            MOCK_COMPLETED_DATA = null;
            MOCK_OFFERED_DATA = null;
            
            // Remove refresh parameter from URL without reloading page
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('✅ Job data cache cleared and URL cleaned');
        }
        
    initializeMenu();
    initializeRoleTabs();
    initializeTabs();
        
        // Initialize the default role properly based on HTML state
        const defaultActiveRole = document.querySelector('.role-tab-btn.active')?.getAttribute('data-role') || 'customer';
        console.log(`🎯 Default active role detected: ${defaultActiveRole}`);
        
        if (defaultActiveRole === 'worker') {
            // Worker role is default - activate worker role and its default tab
            await switchToRole('worker');
        } else {
            // Customer role is default - initialize customer tabs normally
            await initializeActiveTab(preferredTab);
            
            // If preferred tab is not listings, switch to it
            if (preferredTab !== 'listings') {
                await switchToTab(preferredTab);
            }
        }
        
    // Update tab counts based on actual data
    await updateTabCounts();
        } catch (error) {
            console.error('❌ Jobs page initialization failed:', error);
            // Keep shell responsive even when one async loader fails.
            const listings = document.getElementById('listings-content');
            const offered = document.getElementById('offered-content');
            if (listings && listings.style.display !== 'none') {
                const container = listings.querySelector('.listings-container');
                if (container) {
                    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Unable to load tabs</div><div class="empty-state-message">Please refresh and try again.</div></div>`;
                }
            } else if (offered) {
                const container = offered.querySelector('.offered-container');
                if (container) {
                    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Unable to load tabs</div><div class="empty-state-message">Please refresh and try again.</div></div>`;
                }
            }
        }
    } else {
        console.log('📋 Non-jobs page detected - skipping jobs initialization (DataService still available)');
    }
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

function initializeRoleTabs() {
    const roleButtons = document.querySelectorAll('.role-tab-btn');
    
    roleButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const roleType = this.getAttribute('data-role');
            await switchToRole(roleType);
        });
    });
}

async function switchToRole(roleType) {
    closeFaceVerificationViewerIfOpen();

    // Track role switch timestamp for contamination detection
    window.lastRoleSwitch = Date.now();
    
    // NUCLEAR CLEANUP: Clear all overlay handlers when switching roles to prevent contamination
    executeCleanupsByType('hiring');
    executeCleanupsByType('hiring-listener');
    executeCleanupsByType('accepted-overlay');
    
    // Update role button states
    document.querySelectorAll('.role-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeRoleBtn = document.querySelector(`[data-role="${roleType}"]`);
    if (activeRoleBtn) {
        activeRoleBtn.classList.add('active');
    }
    
    console.log(`🔄 Switched to ${roleType} role`);
    TAB_RENDER_GUARDS.activeRole = roleType;
    
    // Show/hide appropriate tab sets and content
    if (roleType === 'customer') {
        TAB_RENDER_GUARDS.activeCustomerTab = 'listings';
        // Show customer tabs and content
        document.querySelector('.customer-tabs').style.display = 'flex';
        document.querySelector('.worker-tabs').style.display = 'none';
        
        // Hide all content first
        document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
            wrapper.classList.remove('active');
        });
        
        // Show customer content (default to listings)
        const listingsContent = document.getElementById('listings-content');
        if (listingsContent) {
            listingsContent.style.display = 'block';
            listingsContent.classList.add('active');
        }
        
        // Activate listings tab
        document.querySelectorAll('.customer-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('listingsTab')?.classList.add('active');
        
        // Initialize the default listings tab content
        await initializeListingsTab();
        
        console.log('✅ Customer role activated - showing Listings/Hiring/Completed tabs');
        
    } else if (roleType === 'worker') {
        TAB_RENDER_GUARDS.activeWorkerTab = 'offered';
        // Show worker tabs and content
        document.querySelector('.customer-tabs').style.display = 'none';
        document.querySelector('.worker-tabs').style.display = 'flex';
        
        // Hide all content first
        document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
            wrapper.classList.remove('active');
        });
        
        // Show worker content (default to offered)
        const offeredContent = document.getElementById('offered-content');
        if (offeredContent) {
            offeredContent.style.display = 'block';
            offeredContent.classList.add('active');
        }
        
        // Activate offered tab
        document.querySelectorAll('.worker-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('offeredTab')?.classList.add('active');
        
        // Initialize the default offered tab content
        await initializeOfferedTab();
        
        console.log('✅ Worker role activated - showing Gigs Offered/Gigs Accepted/Gigs Completed tabs');
    }
}

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const tabType = this.getAttribute('data-tab');
            
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

async function switchToCustomerTab(tabType) {
    closeFaceVerificationViewerIfOpen();

    TAB_RENDER_GUARDS.activeRole = 'customer';
    TAB_RENDER_GUARDS.activeCustomerTab = tabType;
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
    
    const activeWrapper = document.getElementById(`${tabType}-content`);
    if (activeWrapper) {
        activeWrapper.style.display = 'block';
        activeWrapper.classList.add('active');
    }
    
    console.log(`🔄 Switched to customer tab: ${tabType}`);
    
    // Clean up hiring listener when leaving the hiring tab
    if (tabType !== 'hiring') {
        executeCleanupsByType('hiring-listener');
    }
    
    // Load content based on tab type (existing functionality)
    if (tabType === 'listings') {
        await initializeListingsTab();
    } else if (tabType === 'hiring') {
        await initializeHiringTab();
    } else if (tabType === 'previous') {
        await initializePreviousTab();
    }
}

async function switchToWorkerTab(tabType) {
    closeFaceVerificationViewerIfOpen();

    TAB_RENDER_GUARDS.activeRole = 'worker';
    TAB_RENDER_GUARDS.activeWorkerTab = tabType;
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
    
    const activeWrapper = document.getElementById(`${tabType}-content`);
    if (activeWrapper) {
        activeWrapper.style.display = 'block';
        activeWrapper.classList.add('active');
    }
    
    console.log(`🔄 Switched to worker tab: ${tabType}`);
    
    // Load worker content
    if (tabType === 'offered') {
        await initializeOfferedTab();
    } else if (tabType === 'accepted') {
        await initializeAcceptedTab();
    } else if (tabType === 'worker-completed') {
        await initializeWorkerCompletedTab();
    }
}

// Worker tab content functions
async function initializeOfferedTab() {
    console.log('📋 Initializing offered gigs tab');
    
    // Debug data status before loading
    debugDataStatus();
    
    const container = document.querySelector('.offered-container');
    if (!container) return;
    
    // Only force reload if we detect potential contamination from role switching
    if (container.hasAttribute('data-loaded')) {
        // Check if we need to force reload due to potential contamination
        const lastRoleSwitch = window.lastRoleSwitch || 0;
        const tabLastLoaded = parseInt(container.getAttribute('data-loaded-time') || '0');
        
        if (lastRoleSwitch > tabLastLoaded) {
            console.log('🔄 Force reloading offered tab due to role switch contamination');
            container.removeAttribute('data-loaded');
        } else {
            console.log('✅ Offered gigs tab already loaded and clean');
            return;
        }
    }
    
    await loadOfferedContent();
    container.setAttribute('data-loaded', 'true');
    container.setAttribute('data-loaded-time', Date.now().toString());
}

async function loadOfferedContent() {
    const container = document.querySelector('.offered-container');
    if (!container) return;
    const renderToken = beginTabRender('offered');
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner">🔄</div>
            <div class="loading-text">Loading your gig offers...</div>
        </div>
    `;
    
    try {
        // Get all offered jobs for current user (worker perspective)
        console.log('🔄 Calling JobsDataService.getOfferedJobs()...');
        const offeredJobs = await JobsDataService.getOfferedJobs();
        if (!shouldApplyTabRender('offered', renderToken)) return;
        
        console.log(`🎯 Found ${offeredJobs.length} offered gigs for worker`);
        console.log('📋 Offered jobs data:', offeredJobs);
        
        if (offeredJobs.length === 0) {
            if (shouldApplyTabRender('offered', renderToken)) showEmptyOfferedState();
            return;
        }
        
        // Generate HTML for offered gigs cards using the same design as accepted cards
        const cardsHTML = await generateMockOfferedJobs(offeredJobs);
        if (!shouldApplyTabRender('offered', renderToken)) return;
        container.innerHTML = cardsHTML;
        
        // Attach event listeners for offered gig cards
        attachOfferedCardHandlers();
        
    } catch (error) {
        console.error('❌ Error loading offered content:', error);
        if (shouldApplyTabRender('offered', renderToken)) showEmptyOfferedState();
    }
}

function showEmptyOfferedState() {
    const container = document.querySelector('.offered-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">💼</div>
            <div class="empty-state-title">Gigs Offered</div>
            <div class="empty-state-message">Gig offers from customers will appear here</div>
        </div>
    `;
}

async function generateMockOfferedJobs(offeredJobs) {
    const cardsHTML = offeredJobs.map(job => generateOfferedJobCard(job)).join('');
    return cardsHTML;
}

function generateOfferedJobCard(job) {
    // Use same card design as accepted gigs but with "OFFERED BY" caption
    const safePosterNameRaw = job.posterName || 'Customer';
    const roleCaption = `OFFERED BY ${safePosterNameRaw.toUpperCase()}`;
    const userThumbnail = job.posterThumbnail || 'public/users/User-04.jpg';
    const userName = job.posterName;
    
    // Use agreed price if it exists, otherwise fall back to original price
    // Format with peso symbol
    const rawPrice = job.agreedPrice || job.priceOffer;
    const displayPrice = formatPriceWithPeso(rawPrice) || `₱${rawPrice}`;
    const safeJobId = escapeHtml(job.jobId || '');
    const safePosterId = escapeHtml(job.posterId || '');
    const safePosterName = escapeHtml(job.posterName || '');
    const safePosterThumbnailData = escapeHtml(job.posterThumbnail || '');
    const safeCategory = escapeHtml(job.category || '');
    const safeRole = escapeHtml(job.role || 'worker');
    const safeDisplayPrice = escapeHtml(displayPrice || '₱0');
    const safeDateOffered = escapeHtml(job.dateOffered || '');
    const safeJobPageUrl = escapeHtml(sanitizeUrl(job.jobPageUrl || `dynamic-job.html?category=${job.category}&jobNumber=${job.jobId}`, '#'));
    const safeTitle = escapeHtml(job.title || 'Untitled Job');
    const safeDueDate = escapeHtml(formatJobDate(job.jobDate));
    const safeStartTime = escapeHtml(formatTime(job.startTime));
    const safeEndTime = escapeHtml(formatTime(job.endTime));
    const safeThumbnail = escapeHtml(sanitizeUrl(job.thumbnail, 'public/images/placeholder.jpg'));
    const safeRoleCaption = escapeHtml(roleCaption);
    const safeUserThumbnail = escapeHtml(sanitizeUrl(userThumbnail, 'public/users/default-user.jpg'));
    const safeUserName = escapeHtml(userName || 'User');
    
    return `
        <div class="hiring-card worker offered-gig" 
             data-job-id="${safeJobId}"
             data-poster-id="${safePosterId}"
             data-poster-name="${safePosterName}"
             data-poster-thumbnail="${safePosterThumbnailData}"
             data-category="${safeCategory}"
             data-role="${safeRole}"
             data-price-offer="${safeDisplayPrice}"
             data-date-offered="${safeDateOffered}"
             data-job-page-url="${safeJobPageUrl}">
            
            <div class="hiring-title">${safeTitle}</div>
            
            <div class="hiring-date-time-row">
                <div class="hiring-date-part">
                    <span class="hiring-date-label">DUE:</span>
                    <span class="hiring-date-value">${safeDueDate}</span>
                </div>
                <div class="hiring-time-part">
                    <span class="hiring-time-label">FROM:</span>
                    <span class="hiring-time-value">${safeStartTime}</span>
                    <span class="hiring-time-label">TO:</span>
                    <span class="hiring-time-value">${safeEndTime}</span>
                </div>
            </div>
            
            <div class="hiring-main-row">
                <div class="hiring-thumbnail">
                    <img src="${safeThumbnail}" alt="${safeTitle}" loading="lazy">
                </div>
                
                <div class="hiring-content">
                    <div class="hiring-left-content">
                        <div class="hiring-price">${safeDisplayPrice}</div>
                        <div class="hiring-role-caption worker">${safeRoleCaption}</div>
                    </div>
                    <div class="hiring-right-content">
                        <div class="hiring-user-thumbnail">
                            <img src="${safeUserThumbnail}" alt="${safeUserName}" loading="lazy">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachOfferedCardHandlers() {
    const offeredCards = document.querySelectorAll('.offered-gig');
    
    // Clean up any existing handlers first
    executeCleanupsByType('offered-cards');
    
    const cleanOfferedCards = Array.from(offeredCards).filter(card => card && card.parentNode);
    
    cleanOfferedCards.forEach((card, index) => {
        const cardClickHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('🎯 Offered gig card clicked');
            
            const jobData = extractOfferedJobDataFromCard(card);
            if (jobData) {
                showGigOfferOptionsOverlay(jobData);
            }
        };
        
        card.addEventListener('click', cardClickHandler);
        
        // Register cleanup for this card
        if (!CLEANUP_REGISTRY.elementListeners.has(card)) {
            CLEANUP_REGISTRY.elementListeners.set(card, []);
        }
        CLEANUP_REGISTRY.elementListeners.get(card).push(['click', cardClickHandler]);
        
        // Register cleanup function for this specific card
        registerCleanup('offered-cards', `card-${index}`, () => {
            card.removeEventListener('click', cardClickHandler);
        });
    });
    
    console.log(`✅ Added handlers to ${cleanOfferedCards.length} offered gig cards`);
}

function extractOfferedJobDataFromCard(cardElement) {
    return {
        jobId: cardElement.getAttribute('data-job-id'),
        posterId: cardElement.getAttribute('data-poster-id'),
        posterName: cardElement.getAttribute('data-poster-name'),
        posterThumbnail: cardElement.getAttribute('data-poster-thumbnail'),
        category: cardElement.getAttribute('data-category'),
        role: cardElement.getAttribute('data-role'),
        priceOffer: cardElement.getAttribute('data-price-offer'),
        dateOffered: cardElement.getAttribute('data-date-offered'),
        jobPageUrl: cardElement.getAttribute('data-job-page-url'),
        title: cardElement.querySelector('.hiring-title')?.textContent || 'Unknown Job'
    };
}

async function initializeAcceptedTab() {
    console.log('📋 Initializing accepted gigs tab');
    const container = document.querySelector('.accepted-container');
    if (!container) return;
    
    // Only force reload if we detect potential contamination from role switching
    if (container.hasAttribute('data-loaded')) {
        // Check if we need to force reload due to potential contamination
        const lastRoleSwitch = window.lastRoleSwitch || 0;
        const tabLastLoaded = parseInt(container.getAttribute('data-loaded-time') || '0');
        
        if (lastRoleSwitch > tabLastLoaded) {
            console.log('🔄 Force reloading accepted tab due to role switch contamination');
            container.removeAttribute('data-loaded');
        } else {
            console.log('✅ Accepted gigs tab already loaded and clean');
            return;
        }
    }
    
    await loadAcceptedContent();
    container.setAttribute('data-loaded', 'true');
    container.setAttribute('data-loaded-time', Date.now().toString());
}

async function loadAcceptedContent() {
    const container = document.querySelector('.accepted-container');
    if (!container) return;
    const renderToken = beginTabRender('accepted');
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner">🔄</div>
            <div class="loading-text">Loading your working jobs...</div>
        </div>
    `;
    
    try {
        // Get all hired/accepted jobs and filter for worker perspective (where current user is the worker)
        const allHiredJobs = await JobsDataService.getAllHiredJobs();
        if (!shouldApplyTabRender('accepted', renderToken)) return;
        // Worker's Working tab shows only 'accepted' status (offers they've accepted)
        const workerJobs = allHiredJobs.filter(job => 
            job.role === 'worker' && job.status === 'accepted'
        );
        
        console.log(`🎯 Found ${workerJobs.length} accepted worker jobs for Working tab`);
        
        if (workerJobs.length === 0) {
            if (shouldApplyTabRender('accepted', renderToken)) showEmptyAcceptedState();
            return;
        }
        
        // Generate HTML for worker perspective cards using the existing hiring card template
        const cardsHTML = await generateMockAcceptedJobs(workerJobs);
        if (!shouldApplyTabRender('accepted', renderToken)) return;
        container.innerHTML = cardsHTML;
        
        // Attach event listeners for worker perspective cards
        attachAcceptedCardHandlers();
        
        console.log('✅ Accepted gigs content loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading accepted gigs content:', error);
        if (shouldApplyTabRender('accepted', renderToken)) showEmptyAcceptedState();
    }
}

async function generateMockAcceptedJobs(acceptedJobs) {
    // Reuse the existing hiring card generation logic
    return acceptedJobs.map(job => generateHiringCardHTML(job)).join('');
}

function showEmptyAcceptedState() {
    const container = document.querySelector('.accepted-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-title">No Accepted Gigs Yet</div>
            <div class="empty-state-message">
                Jobs you've been hired to work on will appear here.
                Check available job listings to find work opportunities.
            </div>
            <a href="jobs.html" class="empty-state-btn">
                FIND WORK
            </a>
        </div>
    `;
}

function attachAcceptedCardHandlers() {
    // NUCLEAR CLEANUP: Remove all possible card handlers to prevent duplicates
    executeCleanupsByType('accepted-cards');
    executeCleanupsByType('hiring-cards'); // Also clean customer card handlers
    
    // Add click handlers for accepted gig cards
    const acceptedCards = document.querySelectorAll('.accepted-container .hiring-card');
    
    // Remove any existing click listeners directly from cards (brute force)
    acceptedCards.forEach(card => {
        card.replaceWith(card.cloneNode(true));
    });
    
    // Re-select cards after cloning to ensure clean slate
    const cleanAcceptedCards = document.querySelectorAll('.accepted-container .hiring-card');
    cleanAcceptedCards.forEach(card => {
        const clickHandler = (e) => {
            // CRITICAL FIX: Don't intercept button clicks inside overlays
            const clickedElement = e.target;
            const isButton = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button');
            const isInOverlay = clickedElement.closest('.listing-options-overlay');
            
            if (isButton) {
                console.log('🔘 Button click detected in accepted card - allowing button handler to process');
                return; // Let button handlers handle this
            }
            
            if (isInOverlay) {
                console.log('🔘 Click inside overlay from accepted card - allowing event to propagate');
                return; // Don't interfere with overlay interactions
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Get job data from card attributes (use hiring data extractor since these are hiring cards)
            const jobData = extractHiringJobDataFromCard(card);
            console.log('🎯 Accepted gig card clicked:', jobData);
            
            // Show hiring options overlay with worker-specific options
            showHiringOptionsOverlay(jobData);
        };
        
        card.addEventListener('click', clickHandler);
        
        // Track for cleanup
        registerCleanup('accepted-cards', `card-${Array.from(cleanAcceptedCards).indexOf(card)}`, () => {
            card.removeEventListener('click', clickHandler);
        });
    });
    
    console.log(`✅ Added handlers to ${cleanAcceptedCards.length} accepted gig cards`);
}


async function initializeWorkerCompletedTab() {
    console.log('📋 Initializing worker completed gigs tab');
    const container = document.querySelector('.worker-completed-container');
    if (!container) return;
    
    // Check if already loaded
    if (container.hasAttribute('data-loaded')) {
        console.log('✅ Worker completed gigs tab already loaded');
        return;
    }
    
    await loadWorkerCompletedContent();
    container.setAttribute('data-loaded', 'true');
}

async function loadWorkerCompletedContent() {
    const container = document.querySelector('.worker-completed-container');
    if (!container) return;
    const renderToken = beginTabRender('worker-completed');
    
    try {
        // Get all completed jobs and filter for worker perspective (where current user was the worker)
        const allCompletedJobs = await JobsDataService.getCompletedJobs();
        if (!shouldApplyTabRender('worker-completed', renderToken)) return;
        const workerCompletedJobs = allCompletedJobs.filter(job => job.role === 'worker');
        
        console.log(`🎯 Found ${workerCompletedJobs.length} worker perspective completed jobs`);
        
        if (workerCompletedJobs.length === 0) {
            if (shouldApplyTabRender('worker-completed', renderToken)) showEmptyWorkerCompletedState();
            return;
        }
        
        // Generate HTML for worker perspective completed cards using the existing completed card template
        const cardsHTML = await generateMockWorkerCompletedJobs(workerCompletedJobs);
        if (!shouldApplyTabRender('worker-completed', renderToken)) return;
        container.innerHTML = cardsHTML;
        
        // Attach event listeners for worker perspective completed cards
        attachWorkerCompletedCardHandlers();
        
        console.log('✅ Worker completed gigs content loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading worker completed gigs content:', error);
        if (shouldApplyTabRender('worker-completed', renderToken)) showEmptyWorkerCompletedState();
    }
}

async function generateMockWorkerCompletedJobs(workerCompletedJobs) {
    // Reuse the existing completed card generation logic
    return workerCompletedJobs.map(job => generateCompletedCardHTML(job)).join('');
}

function showEmptyWorkerCompletedState() {
    const container = document.querySelector('.worker-completed-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <div class="empty-state-title">No Completed Gigs Yet</div>
            <div class="empty-state-message">
                Jobs you've completed as a worker will appear here.
                Check available job listings to find work opportunities.
            </div>
            <a href="jobs.html" class="empty-state-btn">
                FIND WORK
            </a>
        </div>
    `;
}

function attachWorkerCompletedCardHandlers() {
    // Cleanup any existing handlers first
    executeCleanupsByType('worker-completed-cards');
    
    // Add click handlers for worker completed gig cards
    const workerCompletedCards = document.querySelectorAll('.worker-completed-container .completed-card');
    workerCompletedCards.forEach(card => {
        const clickHandler = (e) => {
            // CRITICAL FIX: Don't intercept button clicks inside overlays
            // Check if the clicked element is a button or inside a button
            const clickedElement = e.target;
            const isButton = clickedElement.tagName === 'BUTTON' || clickedElement.closest('button');
            const isInOverlay = clickedElement.closest('.listing-options-overlay');
            
            
            if (isButton) {
                console.log('🔘 Button click detected - allowing button handler to process');
                return; // Let button handlers handle this, regardless of location
            }
            
            if (isInOverlay) {
                console.log('🔘 Click inside overlay but not on button - allowing event to propagate');
                return; // Don't interfere with overlay interactions
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // Get job data from card attributes (use completed data extractor)
            const jobData = extractCompletedJobDataFromCard(card);
            console.log('🎯 Worker completed gig card clicked:', jobData);
            
            // Show previous options overlay with worker-specific options
            showPreviousOptionsOverlay(jobData);
        };
        
        card.addEventListener('click', clickHandler);
        
        // Track for cleanup
        registerCleanup('worker-completed-cards', `card-${Array.from(workerCompletedCards).indexOf(card)}`, () => {
            card.removeEventListener('click', clickHandler);
        });
    });
    
    console.log(`✅ Added handlers to ${workerCompletedCards.length} worker completed gig cards`);
}

async function switchToTab(tabType) {
    // Clean up old deletion blacklist (no longer needed) - one-time cleanup
    if (localStorage.getItem('deletedJobsBlacklist')) {
        localStorage.removeItem('deletedJobsBlacklist');
        console.log('🧹 Cleaned up old deletion blacklist');
    }
    
    // Get current active tab before making changes
    const currentActiveTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
    
    // Only clean up if we're actually switching to a different tab
    if (currentActiveTab && currentActiveTab !== tabType) {
        console.log(`🧹 Cleaning up ${currentActiveTab} tab handlers before switching to ${tabType}`);
        switch (currentActiveTab) {
            case 'listings':
                executeCleanupsByType('listings');
                executeCleanupsByType('listing-cards');
                executeCleanupsByType('listing-overlay');
                break;
            case 'hiring':
                executeCleanupsByType('hiring');
                executeCleanupsByType('hiring-cards');
                executeCleanupsByType('hiring-overlay');
                break;
            case 'previous':
                executeCleanupsByType('previous');
                executeCleanupsByType('previous-cards');
                executeCleanupsByType('previous-overlay');
                executeCleanupsByType('previous-feedback-overlay');
                break;
            case 'accepted':
                executeCleanupsByType('accepted');
                executeCleanupsByType('accepted-cards');
                executeCleanupsByType('accepted-overlay');
                break;
            case 'worker-completed':
                executeCleanupsByType('worker-completed');
                executeCleanupsByType('worker-completed-cards');
                executeCleanupsByType('worker-completed-overlay');
                break;
        }
    }
    
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
    
    console.log(`🔄 Switched to ${tabType} tab with proper cleanup`);
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
            await initializePreviousTab(); // Make this async to ensure proper initialization
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
    const renderToken = beginTabRender('listings');
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner">🔄</div>
            <div class="loading-text">Loading your gig listings...</div>
        </div>
    `;
    
    // Generate mock listings data
    const mockListings = await generateMockListings();
    if (!shouldApplyTabRender('listings', renderToken)) return;
    
    if (mockListings.length === 0) {
        if (!shouldApplyTabRender('listings', renderToken)) return;
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No active gig listings yet</div>
                <div class="empty-state-message">Ready to post your first gig? Create a listing and start finding help!</div>
                <button class="empty-state-btn" onclick="window.location.href='new-post2.html'">
                    Post Your First Gig
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
    console.log('🔍 DEBUG - Generating cards for', sortedListings.length, 'listings');
    sortedListings.forEach((listing, index) => {
        console.log(`   Card ${index+1}: ID=${listing.jobId}, price=${listing.price}, paymentType=${listing.paymentType}, status=${listing.status}`);
    });
    const listingsHTML = sortedListings.map(listing => generateListingCardHTML(listing)).join('');
    if (!shouldApplyTabRender('listings', renderToken)) return;
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
    
    // Check if job is expired
    let displayStatus = listing.status;
    if (listing.status === 'active' || listing.status === 'paused') {
        const isExpired = checkIfJobExpired(listing.jobDate, listing.endTime);
        if (isExpired) {
            displayStatus = 'expired';
        }
    }
    const safeDisplayStatus = escapeHtml(String(displayStatus || 'active').toLowerCase());
    const safeDisplayStatusLabel = escapeHtml(String(displayStatus || 'active').toUpperCase());
    const safeJobId = escapeHtml(listing.jobId || '');
    const safePosterId = escapeHtml(listing.posterId || '');
    const safeCategory = escapeHtml(listing.category || '');
    const safeApplicationCount = escapeHtml(String(listing.applicationCount || 0));
    const safeJobPageUrl = escapeHtml(sanitizeUrl(listing.jobPageUrl, '#'));
    const safePrice = escapeHtml(String(listing.price || 0));
    const safePaymentType = escapeHtml(listing.paymentType || 'per_job');
    const safeThumbnail = escapeHtml(sanitizeUrl(listing.thumbnail, 'public/images/placeholder.jpg'));
    const safeTitle = escapeHtml(listing.title || 'Untitled Job');
    const safeJobDate = escapeHtml(jobDateFormatted);
    const safeApplicationText = escapeHtml(applicationText);
    const safeTimeRange = escapeHtml(timeRange);
    const safeTimeAgo = escapeHtml(timeAgo);
    
    return `
        <div class="listing-card" 
             data-job-id="${safeJobId}" 
             data-poster-id="${safePosterId}"
             data-category="${safeCategory}"
             data-application-count="${safeApplicationCount}"
             data-job-page-url="${safeJobPageUrl}"
             data-status="${safeDisplayStatus}"
             data-price="${safePrice}"
             data-payment-type="${safePaymentType}">
            <div class="listing-thumbnail">
                <img src="${safeThumbnail}" alt="${safeTitle}">
                <div class="status-badge status-${safeDisplayStatus}">${safeDisplayStatusLabel}</div>
            </div>
            <div class="listing-content">
                <div class="listing-title">${safeTitle}</div>
                <div class="listing-meta">
                    <div class="job-schedule">
                        <div class="job-date-row">
                            <span class="job-date">📅 ${safeJobDate}</span>
                        </div>
                        <div class="job-time-row">
                            <div class="application-count">${safeApplicationText}</div>
                            <span class="job-time">🕒 ${safeTimeRange}</span>
                        </div>
                    </div>
                    <div class="posting-info">
                        <span class="listing-time-ago">Posted ${safeTimeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function checkIfJobExpired(jobDate, endTime) {
    if (!jobDate || !endTime) return false;
    
    try {
        const now = new Date();
        let dateObj;
        
        // Handle Firestore Timestamp objects
        if (jobDate && typeof jobDate.toDate === 'function') {
            dateObj = jobDate.toDate();
        }
        // Handle Date objects
        else if (jobDate instanceof Date) {
            dateObj = jobDate;
        }
        // Parse string dates
        else if (typeof jobDate === 'string') {
            if (jobDate.includes('-') && /^\d{4}-\d{2}-\d{2}/.test(jobDate)) {
                const [year, month, day] = jobDate.split('-').map(Number);
                dateObj = new Date(year, month - 1, day);
            } else if (jobDate.includes(',')) {
                dateObj = new Date(jobDate);
            } else {
                const currentYear = new Date().getFullYear();
                dateObj = new Date(`${jobDate} ${currentYear}`);
            }
        }
        else {
            return false;
        }
        
        if (isNaN(dateObj.getTime())) return false;
        
        // Parse end time
        const endTimeMatch = endTime.match(/(\d+)\s*(AM|PM)/i);
        if (endTimeMatch) {
            let hour = parseInt(endTimeMatch[1]);
            const isPM = endTimeMatch[2].toUpperCase() === 'PM';
            
            if (isPM && hour !== 12) hour += 12;
            if (!isPM && hour === 12) hour = 0;
            
            dateObj.setHours(hour, 0, 0, 0);
        } else {
            // If no end time, mark as expired at end of job date
            dateObj.setHours(23, 59, 59, 999);
        }
        
        return dateObj.getTime() < now.getTime();
    } catch (error) {
        console.warn('Error checking expiration:', error);
        return false;
    }
}

function formatTimeAgo(dateInput) {
    // Handle Firestore Timestamp, Date object, or string
    let date;
    if (dateInput && typeof dateInput.toDate === 'function') {
        // Firestore Timestamp
        date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else {
        return 'recently';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
        return 'recently';
    }
    
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

function formatJobDate(dateInput) {
    // Handle Firestore Timestamp, Date object, or string
    let date;
    if (dateInput && typeof dateInput.toDate === 'function') {
        // Firestore Timestamp
        date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else if (typeof dateInput === 'string') {
        date = new Date(dateInput);
    } else {
        return 'TBD';
    }
    
    // Check for invalid date
    if (isNaN(date.getTime())) {
        return 'TBD';
    }
    
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
    const container = document.querySelector('.listings-container');
    if (!container) return;
    
    // Remove any existing delegated handler first
    if (container.dataset.cardHandlerAttached === 'true') {
        return; // Already initialized
    }
    
    // Use event delegation - single handler on container instead of one per card
    const cardClickHandler = async function(e) {
        // Find the clicked card (traverse up from click target)
        const card = e.target.closest('.listing-card');
        if (!card) return;
        
        e.preventDefault();
        const jobData = extractJobDataFromCard(card);
        await showListingOptionsOverlay(jobData);
    };
    
    container.addEventListener('click', cardClickHandler);
    container.dataset.cardHandlerAttached = 'true';
    
    // Register cleanup for when listings tab is hidden
    registerCleanup('listings', 'cardClickHandler', () => {
        container.removeEventListener('click', cardClickHandler);
        delete container.dataset.cardHandlerAttached;
    });
}

function extractJobDataFromCard(cardElement) {
    const extracted = {
        jobId: cardElement.getAttribute('data-job-id'),
        posterId: cardElement.getAttribute('data-poster-id'),
        category: cardElement.getAttribute('data-category'),
        applicationCount: parseInt(cardElement.getAttribute('data-application-count')),
        jobPageUrl: cardElement.getAttribute('data-job-page-url'),
        status: cardElement.getAttribute('data-status') || 'active',
        price: cardElement.getAttribute('data-price'),
        paymentType: cardElement.getAttribute('data-payment-type'),
        title: cardElement.querySelector('.listing-title').textContent,
        thumbnail: cardElement.querySelector('.listing-thumbnail img').src
    };
    
    return extracted;
}

async function showListingOptionsOverlay(jobData) {
    console.log(`🔧 Opening options overlay for job: ${jobData.jobId}`);
    
    const overlay = document.getElementById('listingOptionsOverlay');
    const title = document.getElementById('listingOptionsTitle');
    const subtitle = document.getElementById('listingOptionsSubtitle');
    const pauseBtn = document.getElementById('pauseJobBtn');
    
    // ═══════════════════════════════════════════════════════════════
    // OPTIMIZATION: Use status from card data (no Firebase call!)
    // ═══════════════════════════════════════════════════════════════
    const currentStatus = jobData.status || 'active';
    console.log(`⚡ Using cached status: ${currentStatus} (no Firebase fetch)`);
    
    // Update overlay content
    title.textContent = 'Manage Gig';
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
    overlay.setAttribute('data-title', jobData.title);
    overlay.setAttribute('data-price', jobData.price || '0');
    overlay.setAttribute('data-payment-type', jobData.paymentType || 'per_job');
    
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
    
    // Clean up any existing listener
    executeCleanupsByType('hiring-listener');
    
    console.log('👥 Loading hiring tab with real-time updates...');
    await loadHiringContent();
    
    // Set up real-time listener so status changes (e.g., hired → accepted) refresh automatically
    if (typeof firebase !== 'undefined') {
        const user = firebase.auth().currentUser;
        if (user && firebase.firestore) {
            const db = firebase.firestore();
            let isFirstSnapshot = true;
            
            const unsubscribe = db.collection('jobs')
                .where('posterId', '==', user.uid)
                .where('status', 'in', ['hired', 'accepted'])
                .onSnapshot(snapshot => {
                    if (isFirstSnapshot) {
                        isFirstSnapshot = false;
                        return; // Skip initial snapshot since loadHiringContent already rendered
                    }
                    console.log('🔄 Hiring tab: job status change detected, refreshing...');
                    loadHiringContent();
                }, err => {
                    console.warn('⚠️ Hiring tab listener error:', err);
                });
            
            registerCleanup('hiring-listener', 'jobs-snapshot', () => {
                unsubscribe();
                console.log('🧹 Hiring tab real-time listener unsubscribed');
            });
        }
    }
    
    console.log('👥 Hiring tab loaded');
}

async function loadHiringContent() {
    const container = document.querySelector('.hiring-container');
    if (!container) return;
    const renderToken = beginTabRender('hiring');
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner">🔄</div>
            <div class="loading-text">Loading your hired workers...</div>
        </div>
    `;
    
    try {
        // Get all hired/accepted jobs and filter for customer perspective only (where current user is the customer)
        const allHiredJobs = await JobsDataService.getAllHiredJobs();
        if (!shouldApplyTabRender('hiring', renderToken)) return;
        // Customer's Hiring tab shows only 'hired' status (pending worker acceptance) and 'accepted' status (worker accepted)
        const customerJobs = allHiredJobs.filter(job => 
            job.role === 'customer' && (job.status === 'hired' || job.status === 'accepted')
        );
        
        console.log(`👥 Found ${customerJobs.length} customer jobs for hiring tab (filtered from ${allHiredJobs.length} total)`);
        
        if (customerJobs.length === 0) {
            if (shouldApplyTabRender('hiring', renderToken)) showEmptyHiringState();
            return;
        }
        
        const hiringHTML = await generateMockHiredJobs(customerJobs);
        if (!shouldApplyTabRender('hiring', renderToken)) return;
        container.innerHTML = hiringHTML;
        
        // Initialize event handlers for hiring cards
        initializeHiringCardHandlers();
        
        console.log(`👥 Loaded ${customerJobs.length} customer hired jobs`);
        
    } catch (error) {
        console.error('❌ Error loading hiring content:', error);
        if (!shouldApplyTabRender('hiring', renderToken)) return;
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
    let roleCaption, userThumbnail, userName, statusClass = '';
    const safeWorkerNameRaw = (job.hiredWorkerName || 'Worker');
    const safePosterNameRaw = (job.posterName || 'Customer');
    if (job.role === 'customer') {
        // Customer perspective: Distinguish between pending offer and accepted
        if (job.status === 'hired') {
            // Job offered but worker hasn't accepted yet
            roleCaption = `YOU OFFERED ${safeWorkerNameRaw.toUpperCase()}`;
            statusClass = ' pending-offer';
        } else {
            // Worker has accepted (status === 'accepted')
            roleCaption = `YOU HIRED ${safeWorkerNameRaw.toUpperCase()}`;
        }
        userThumbnail = job.hiredWorkerThumbnail;
        userName = safeWorkerNameRaw;
    } else {
        // Worker perspective: I'm working for someone, show the customer's thumbnail
        roleCaption = `WORKING FOR ${safePosterNameRaw.toUpperCase()}`;
        // For worker cards, we need the poster's thumbnail (customer who posted the job)
        userThumbnail = job.posterThumbnail || 'public/users/User-04.jpg';
        userName = safePosterNameRaw;
    }
    
    // Add highlighting class for newly hired jobs
    const highlightClass = job.isNewlyHired ? ' newly-hired-highlight' : '';
    const safeJobId = escapeHtml(job.jobId || '');
    const safePosterId = escapeHtml(job.posterId || '');
    const safePosterName = escapeHtml(job.posterName || '');
    const safeCategory = escapeHtml(job.category || '');
    const safeRole = escapeHtml(job.role || '');
    const safeHiredWorkerId = escapeHtml(job.hiredWorkerId || '');
    const safeHiredWorkerNameData = escapeHtml(job.hiredWorkerName || '');
    const safeTitle = escapeHtml(job.title || 'Untitled Job');
    const safeDueDate = escapeHtml(formatJobDate(job.jobDate));
    const safeStartTime = escapeHtml(formatTime(job.startTime));
    const safeEndTime = escapeHtml(formatTime(job.endTime));
    const safeThumbnail = escapeHtml(sanitizeUrl(job.thumbnail, 'public/images/placeholder.jpg'));
    const safePriceOffer = escapeHtml(`₱${job.priceOffer}`);
    const safeRoleCaption = escapeHtml(roleCaption);
    const safeUserThumbnail = escapeHtml(sanitizeUrl(userThumbnail, 'public/users/default-user.jpg'));
    const safeUserName = escapeHtml(userName || 'User');
    
    return `
        <div class="hiring-card ${roleClass}${statusClass}${highlightClass}" 
             data-job-id="${safeJobId}"
             data-poster-id="${safePosterId}"
             data-poster-name="${safePosterName}"
             data-category="${safeCategory}"
             data-role="${safeRole}"
             data-hired-worker-id="${safeHiredWorkerId}"
             data-hired-worker-name="${safeHiredWorkerNameData}">
            
            <div class="hiring-title">${safeTitle}</div>
            
            <div class="hiring-date-time-row">
                <div class="hiring-date-part">
                    <span class="hiring-date-label">DUE:</span>
                    <span class="hiring-date-value">${safeDueDate}</span>
                </div>
                <div class="hiring-time-part">
                    <span class="hiring-time-label">FROM:</span>
                    <span class="hiring-time-value">${safeStartTime}</span>
                    <span class="hiring-time-label">TO:</span>
                    <span class="hiring-time-value">${safeEndTime}</span>
                </div>
            </div>
            
            <div class="hiring-main-row">
                <div class="hiring-thumbnail">
                    <img src="${safeThumbnail}" alt="${safeTitle}" loading="lazy">
                </div>
                
                <div class="hiring-content">
                    <div class="hiring-left-content">
                        <div class="hiring-price">${safePriceOffer}</div>
                        <div class="hiring-role-caption ${roleClass}">${safeRoleCaption}</div>
                        ${job.role === 'customer' && job.status === 'hired' ? '<div class="hiring-status-badge pending">Waiting for Worker</div>' : ''}
                        ${job.role === 'customer' && job.status === 'accepted' ? '<div class="hiring-status-badge in-progress">Work in Progress</div>' : ''}
                        ${job.role === 'worker' && job.status === 'accepted' ? '<div class="hiring-status-badge in-progress">Work in Progress</div>' : ''}
                    </div>
                    <div class="hiring-right-content">
                        <div class="hiring-user-thumbnail">
                            <img src="${safeUserThumbnail}" alt="${safeUserName}" loading="lazy">
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
    const jobId = cardElement.getAttribute('data-job-id');
    const posterId = cardElement.getAttribute('data-poster-id');
    const posterName = cardElement.getAttribute('data-poster-name');
    const category = cardElement.getAttribute('data-category');
    const role = cardElement.getAttribute('data-role');
    const hiredWorkerId = cardElement.getAttribute('data-hired-worker-id');
    const hiredWorkerName = cardElement.getAttribute('data-hired-worker-name');
    const title = cardElement.querySelector('.hiring-title')?.textContent || 'Unknown Job';
    
    // Get job status from the card's classList
    const status = cardElement.classList.contains('pending-offer') ? 'hired' : 'accepted';
    
    return {
        jobId,
        posterId,
        posterName,
        category,
        role,
        hiredWorkerId,
        hiredWorkerName,
        title,
        status
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

    const counterpartUserId = jobData.role === 'customer' ? jobData.hiredWorkerId : jobData.posterId;
    const counterpartName = jobData.role === 'customer' ? (jobData.hiredWorkerName || 'Worker') : (jobData.posterName || 'Customer');
    const counterpartRole = jobData.role === 'customer' ? 'worker' : 'customer';
    const counterpartStatus = await resolveUserAccountStatus(counterpartUserId, {
        role: counterpartRole,
        fallbackName: counterpartName
    });
    const counterpartPoster = sanitizeUrl(counterpartStatus?.media?.posterUrl || '', '');
    const counterpartVideo = sanitizeUrl(counterpartStatus?.media?.videoUrl || '', '');
    const counterpartPosterPath = counterpartStatus?.media?.posterPath || '';
    const counterpartVideoPath = counterpartStatus?.media?.videoPath || '';
    const canWatchFaceVerification = counterpartStatus?.type !== 'unverified' && !!counterpartVideo;

    overlay.setAttribute('data-counterpart-user-id', counterpartUserId || '');
    overlay.setAttribute('data-counterpart-name', counterpartName);
    overlay.setAttribute('data-counterpart-face-poster-url', counterpartPoster);
    overlay.setAttribute('data-counterpart-face-video-url', counterpartVideo);
    overlay.setAttribute('data-counterpart-face-poster-path', counterpartPosterPath);
    overlay.setAttribute('data-counterpart-face-video-path', counterpartVideoPath);
    
    // Update title and subtitle
    title.textContent = 'Manage Hiring';
    subtitle.textContent = `Choose an action for "${jobData.title}"`;
    
    // Generate buttons based on role and job status
    let buttonsHTML = '';
    
    if (jobData.role === 'customer') {
        // Customer perspective: Check if worker has accepted or still pending
        if (jobData.status === 'hired') {
            // Offer pending - worker hasn't accepted yet
            // Only show RELIST with "Retract Offer" text
            buttonsHTML = `
                <button class="listing-option-btn pause" id="relistJobBtn">
                    RELIST GIG (Retract Offer)
                </button>
                <button class="listing-option-btn cancel" id="cancelHiringBtn">
                    CLOSE
                </button>
            `;
        } else {
            // Worker has accepted - show both options
            buttonsHTML = `
                <button class="listing-option-btn modify" id="completeJobBtn">
                    MARK AS COMPLETED
                </button>
                ${canWatchFaceVerification ? `<button class="listing-option-btn view" id="watchFaceVerificationBtn">
                    WATCH ${escapeHtml(counterpartName).toUpperCase()} FACE VERIFICATION VIDEO
                </button>` : ''}
                <button class="listing-option-btn pause" id="relistJobBtn">
                    RELIST GIG (Void Current Hire)
                </button>
                <button class="listing-option-btn cancel" id="cancelHiringBtn">
                    CLOSE
                </button>
            `;
        }
    } else if (jobData.role === 'worker') {
        // Worker perspective: You were hired
        buttonsHTML = `
            ${canWatchFaceVerification ? `<button class="listing-option-btn view" id="watchFaceVerificationBtn">
                WATCH ${escapeHtml(counterpartName).toUpperCase()} FACE VERIFICATION VIDEO
            </button>` : ''}
            <button class="listing-option-btn delete" id="resignJobBtn">
                RESIGN FROM GIG
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
    if (!overlay) {
        console.error('❌ Hiring overlay not found!');
        return;
    }
    
    if (overlay.dataset.handlersInitialized) {
        console.log('🔧 Hiring overlay handlers already initialized, clearing and re-initializing');
        // Clear the flag and re-initialize to ensure handlers work for different cards
        delete overlay.dataset.handlersInitialized;
    }
    
    // Determine cleanup type based on current role and tab context
    const currentRole = document.querySelector('.role-tab-btn.active')?.getAttribute('data-role');
    const currentWorkerTab = document.querySelector('.worker-tabs .tab-btn.active')?.getAttribute('data-tab');
    
    console.log(`🔍 DEBUG hiring overlay context: role=${currentRole}, workerTab=${currentWorkerTab}`);
    
    // Only use accepted-overlay cleanup type if we're specifically in worker role AND accepted tab
    // Otherwise, default to 'hiring' for all other contexts (including customer role)
    const cleanupType = (currentRole === 'worker' && currentWorkerTab === 'accepted') ? 'accepted-overlay' : 'hiring';
    
    // CONSISTENCY FIX: Store cleanup type to prevent potential future issues
    overlay.dataset.registeredCleanupType = cleanupType;
    
    console.log(`🔧 Initializing overlay handlers with cleanup type: ${cleanupType}`);
    
    const completeBtn = document.getElementById('completeJobBtn');
    const relistBtn = document.getElementById('relistJobBtn');
    const watchFaceBtn = document.getElementById('watchFaceVerificationBtn');
    const resignBtn = document.getElementById('resignJobBtn');
    const cancelBtn = document.getElementById('cancelHiringBtn');
    
    console.log('🔍 Button elements found:', {
        completeBtn: !!completeBtn,
        relistBtn: !!relistBtn, 
        watchFaceBtn: !!watchFaceBtn,
        resignBtn: !!resignBtn,
        cancelBtn: !!cancelBtn
    });
    
    // Complete job handler (customer)
    if (completeBtn) {
        const completeHandler = function(e) {
            e.preventDefault();
            const jobData = getHiringJobDataFromOverlay();
            handleCompleteJob(jobData);
        };
        completeBtn.addEventListener('click', completeHandler);
        registerCleanup(cleanupType, 'completeBtn', () => {
            completeBtn.removeEventListener('click', completeHandler);
        });
    }
    
    // Relist job handler (customer)
    if (relistBtn) {
        // Clear any existing handlers first
        relistBtn.onclick = null;
        const relistHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Relist button clicked');
            const jobData = getHiringJobDataFromOverlay();
            handleRelistJob(jobData);
        };
        relistBtn.addEventListener('click', relistHandler);
        console.log('✅ Relist button handler attached');
        registerCleanup(cleanupType, 'relistBtn', () => {
            relistBtn.removeEventListener('click', relistHandler);
        });
    }
    
    // Resign job handler (worker)
    if (resignBtn) {
        // Clear any existing handlers first
        resignBtn.onclick = null;
        const resignHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('👋 Resign button clicked');
            const jobData = getHiringJobDataFromOverlay();
            handleResignJob(jobData);
        };
        resignBtn.addEventListener('click', resignHandler);
        console.log('✅ Resign button handler attached');
        registerCleanup(cleanupType, 'resignBtn', () => {
            resignBtn.removeEventListener('click', resignHandler);
        });
    }

    // Watch face verification media (customer/worker once job is in hiring/working).
    if (watchFaceBtn) {
        watchFaceBtn.onclick = null;
        const watchHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            const jobData = getHiringJobDataFromOverlay();
            openFaceVerificationViewer(jobData.counterpartName, {
                targetUserId: jobData.counterpartUserId,
                posterUrl: jobData.counterpartFacePosterUrl,
                videoUrl: jobData.counterpartFaceVideoUrl,
                posterPath: jobData.counterpartFacePosterPath,
                videoPath: jobData.counterpartFaceVideoPath
            });
        };
        watchFaceBtn.addEventListener('click', watchHandler);
        registerCleanup(cleanupType, 'watchFaceBtn', () => {
            watchFaceBtn.removeEventListener('click', watchHandler);
        });
    }
    
    // Cancel handler
    if (cancelBtn) {
        const cancelHandler = function(e) {
            e.preventDefault();
            hideHiringOptionsOverlay();
        };
        cancelBtn.addEventListener('click', cancelHandler);
        registerCleanup(cleanupType, 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }
    
    // Background click handler
    const backgroundHandler = function(e) {
        // Only close if clicking directly on overlay background, not on any child elements
        if (e.target === overlay) {
            console.log('🔘 Background click detected - closing overlay');
            hideHiringOptionsOverlay();
            return;
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup(cleanupType, 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });
    
    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideHiringOptionsOverlay();
        }
    };
    const escapeListenerKey = addDocumentListener('keydown', escapeHandler);
    registerCleanup(cleanupType, 'overlayEscape', () => {
        removeDocumentListener(escapeListenerKey);
    });
    
    overlay.dataset.handlersInitialized = 'true';
    console.log('👥 Hiring overlay handlers initialized with cleanup');
}

function getHiringJobDataFromOverlay() {
    const overlay = document.getElementById('hiringOptionsOverlay');
    return {
        jobId: overlay.getAttribute('data-job-id'),
        role: overlay.getAttribute('data-role'),
        title: overlay.getAttribute('data-title'),
        counterpartUserId: overlay.getAttribute('data-counterpart-user-id'),
        counterpartName: overlay.getAttribute('data-counterpart-name'),
        counterpartFacePosterUrl: overlay.getAttribute('data-counterpart-face-poster-url'),
        counterpartFaceVideoUrl: overlay.getAttribute('data-counterpart-face-video-url'),
        counterpartFacePosterPath: overlay.getAttribute('data-counterpart-face-poster-path'),
        counterpartFaceVideoPath: overlay.getAttribute('data-counterpart-face-video-path')
    };
}

function closeFaceVerificationViewerIfOpen() {
    const overlay = document.getElementById('faceVerificationViewerOverlay');
    const videoEl = document.getElementById('faceVerificationViewerVideo');
    const imageEl = document.getElementById('faceVerificationViewerImage');
    const closeBtn = document.getElementById('faceVerificationViewerCloseBtn');
    if (!overlay || !videoEl || !imageEl || !closeBtn) return;
    if (overlay.style.display === 'none' || !overlay.style.display) return;

    overlay.style.display = 'none';
    closeBtn.onclick = null;
    overlay.onclick = null;
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.style.display = 'none';
    videoEl.load();
    imageEl.removeAttribute('src');
    imageEl.style.display = 'none';
    if (faceViewerEscapeListenerKey) {
        removeDocumentListener(faceViewerEscapeListenerKey);
        faceViewerEscapeListenerKey = null;
    }
}

async function openFaceVerificationViewer(memberName, media = {}) {
    const overlay = document.getElementById('faceVerificationViewerOverlay');
    const title = document.getElementById('faceVerificationViewerTitle');
    const message = document.getElementById('faceVerificationViewerMessage');
    const videoEl = document.getElementById('faceVerificationViewerVideo');
    const imageEl = document.getElementById('faceVerificationViewerImage');
    const closeBtn = document.getElementById('faceVerificationViewerCloseBtn');
    if (!overlay || !title || !message || !videoEl || !imageEl || !closeBtn) return;
    closeFaceVerificationViewerIfOpen();

    const safeName = memberName || 'Member';
    const videoUrl = sanitizeUrl(media.videoUrl || '', '');
    const posterUrl = sanitizeUrl(media.posterUrl || '', '');
    console.info('[FV_MODAL_MEDIA_RESOLVE]', {
        surface: 'watch_viewer',
        memberName: safeName,
        hasVideoUrl: !!videoUrl,
        hasPosterUrl: !!posterUrl
    });

    title.textContent = `${safeName} Face Verification`;
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.style.display = 'none';
    imageEl.removeAttribute('src');
    imageEl.style.display = 'none';

    overlay.style.display = 'flex';
    if (videoUrl) {
        videoEl.src = videoUrl;
        videoEl.style.display = 'block';
        message.textContent = 'Face Verification video shared for hiring trust review.';
    } else if (posterUrl) {
        imageEl.src = posterUrl;
        imageEl.style.display = 'block';
        message.textContent = 'Face Verification thumbnail is available, but video metadata is missing.';
    } else {
        message.textContent = 'Face Verification video is unavailable for this account.';
    }

    const closeViewer = () => {
        overlay.style.display = 'none';
        closeBtn.onclick = null;
        overlay.onclick = null;
        if (videoEl.style.display !== 'none') {
            videoEl.pause();
            videoEl.removeAttribute('src');
            videoEl.load();
        }
        imageEl.removeAttribute('src');
        imageEl.style.display = 'none';
    };

    closeBtn.onclick = closeViewer;
    overlay.onclick = (event) => {
        if (event.target === overlay) closeViewer();
    };

    const viewerEscapeHandler = (event) => {
        if (event.key === 'Escape' && overlay.style.display !== 'none') {
            closeViewer();
        }
    };
    faceViewerEscapeListenerKey = addDocumentListener('keydown', viewerEscapeHandler);
    const previousClose = closeViewer;
    const closeWithEscapeCleanup = () => {
        if (faceViewerEscapeListenerKey) {
            removeDocumentListener(faceViewerEscapeListenerKey);
            faceViewerEscapeListenerKey = null;
        }
        previousClose();
    };
    closeBtn.onclick = closeWithEscapeCleanup;
    overlay.onclick = (event) => {
        if (event.target === overlay) closeWithEscapeCleanup();
    };
}

function hideHiringOptionsOverlay() {
    const overlay = document.getElementById('hiringOptionsOverlay');
    overlay.classList.remove('show');
    
    // CONSISTENCY FIX: Use stored cleanup type instead of re-detecting context
    const registeredCleanupType = overlay.dataset.registeredCleanupType;
    const fallbackCleanupType = 'hiring'; // Safe fallback if no stored type
    const cleanupType = registeredCleanupType || fallbackCleanupType;
    
    console.log(`🔍 DEBUG hide overlay cleanup: stored=${registeredCleanupType}, using=${cleanupType}`);
    
    executeCleanupsByType(cleanupType);
    
    // Clear handlers initialization flag and stored cleanup type to allow re-initialization
    delete overlay.dataset.handlersInitialized;
    delete overlay.dataset.registeredCleanupType;
    
    console.log(`👥 Hiring overlay hidden and ${cleanupType} handlers cleaned up`);
}

// ===== GIG OFFER OVERLAY FUNCTIONS =====
async function showGigOfferOptionsOverlay(jobData) {
    console.log('💼 Show gig offer options for:', jobData);
    
    const overlay = document.getElementById('gigOfferOptionsOverlay');
    const title = document.getElementById('gigOfferOptionsTitle');
    const subtitle = document.getElementById('gigOfferOptionsSubtitle');
    
    if (!overlay) {
        console.error('❌ Gig offer overlay elements not found');
        return;
    }
    
    // Set overlay title and subtitle
    title.textContent = 'Gig Offer';
    subtitle.textContent = `Choose an action for "${jobData.title}"`;
    
    // Store job data in overlay for handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-poster-id', jobData.posterId);
    overlay.setAttribute('data-poster-name', jobData.posterName);
    overlay.setAttribute('data-poster-thumbnail', jobData.posterThumbnail);
    overlay.setAttribute('data-job-title', jobData.title);
    overlay.setAttribute('data-price-offer', jobData.priceOffer);
    overlay.setAttribute('data-category', jobData.category);
    overlay.setAttribute('data-job-page-url', jobData.jobPageUrl || `dynamic-job.html?category=${jobData.category}&jobNumber=${jobData.jobId}`);
    
    // Initialize handlers
    initializeGigOfferOverlayHandlers();
    
    // Show overlay
    overlay.classList.add('show');
    
    console.log('💼 Gig offer options overlay shown');
}

function initializeGigOfferOverlayHandlers() {
    const overlay = document.getElementById('gigOfferOptionsOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;
    
    const acceptBtn = document.getElementById('acceptOfferBtn');
    const rejectBtn = document.getElementById('rejectOfferBtn');
    const contactBtn = document.getElementById('contactCustomerBtn');
    const viewGigPostBtn = document.getElementById('viewGigPostBtn');
    const closeBtn = document.getElementById('closeOfferOptionsBtn');
    
    console.log('🔧 Initializing gig offer overlay handlers');
    
    // Accept Offer button
    if (acceptBtn) {
        acceptBtn.addEventListener('click', function() {
            const jobData = extractGigOfferDataFromOverlay();
            if (jobData) {
                hideGigOfferOptionsOverlay();
                showConfirmAcceptGigOverlay(jobData);
            }
        });
    }
    
    // Reject Offer button
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            const jobData = extractGigOfferDataFromOverlay();
            if (jobData) {
                hideGigOfferOptionsOverlay();
                showRejectGigOfferOverlay(jobData);
            }
        });
    }
    
    // Contact Customer button
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            const jobData = extractGigOfferDataFromOverlay();
            if (jobData) {
                hideGigOfferOptionsOverlay();
                showContactCustomerOverlay(jobData);
            }
        });
    }
    
    // View Gig Post button
    if (viewGigPostBtn) {
        viewGigPostBtn.addEventListener('click', function() {
            const jobPageUrl = overlay.getAttribute('data-job-page-url');
            if (jobPageUrl) {
                console.log('📄 Opening gig post:', jobPageUrl);
                window.location.href = jobPageUrl;
            }
        });
    }
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', hideGigOfferOptionsOverlay);
    }
    
    // Backdrop click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideGigOfferOptionsOverlay();
        }
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideGigOfferOptionsOverlay();
        }
    });
    
    overlay.dataset.handlersInitialized = 'true';
}

function extractGigOfferDataFromOverlay() {
    const overlay = document.getElementById('gigOfferOptionsOverlay');
    if (!overlay) return null;
    
    return {
        jobId: overlay.getAttribute('data-job-id'),
        posterId: overlay.getAttribute('data-poster-id'),
        posterName: overlay.getAttribute('data-poster-name'),
        posterThumbnail: overlay.getAttribute('data-poster-thumbnail'),
        title: overlay.getAttribute('data-job-title'),
        priceOffer: overlay.getAttribute('data-price-offer'),
        category: overlay.getAttribute('data-category')
    };
}

function hideGigOfferOptionsOverlay() {
    const overlay = document.getElementById('gigOfferOptionsOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('show');
    
    // Clean up handlers
    executeCleanupsByType('gig-offer-overlay');
    
    // Clear handlers initialization flag
    delete overlay.dataset.handlersInitialized;
    
    console.log('💼 Gig offer overlay hidden and handlers cleaned up');
}

// ===== CONFIRM ACCEPT GIG OVERLAY FUNCTIONS =====
async function showConfirmAcceptGigOverlay(jobData) {
    console.log('🤝 Show confirm accept gig overlay for:', jobData);
    
    const overlay = document.getElementById('confirmAcceptGigOverlay');
    if (!overlay) {
        console.error('❌ Confirm accept gig overlay not found');
        return;
    }
    
    // Store job data in overlay
    overlay.dataset.jobId = jobData.jobId;
    overlay.dataset.posterId = jobData.posterId;
    overlay.dataset.posterName = jobData.posterName;
    overlay.dataset.posterThumbnail = jobData.posterThumbnail;
    overlay.dataset.jobTitle = jobData.title;
    overlay.dataset.priceOffer = jobData.priceOffer;
    overlay.dataset.category = jobData.category;
    
    // Update customer status using real profile verification when available.
    const customerStatus = await resolveUserAccountStatus(jobData.posterId, {
        role: 'customer',
        fallbackName: jobData.posterName
    });
    applyCustomerStatusDisplay(customerStatus);
    updateStatusFacePreview('acceptFacePreviewBlock', 'acceptFacePreviewImage', customerStatus);
    overlay.dataset.verificationStatusType = customerStatus?.type || '';
    updateVerificationReminderActions('accept', customerStatus?.type, jobData.posterName, jobData.posterId);
    setVerificationDecision('acceptGig', null);
    
    // Initialize handlers
    initializeConfirmAcceptGigHandlers();
    
    // Initialize language tabs (resets state each time modal opens)
    initializeDisclaimerLanguageTabs('acceptGig');
    
    // Show overlay
    overlay.classList.add('show');
    startVerificationReminderTicker('accept');
    attachConfirmAcceptGigEscHandler();
    
    console.log('🤝 Confirm accept gig overlay shown');
}

function applyCustomerStatusDisplay(customerStatus) {
    const statusIcon = document.getElementById('customerStatusFriendlyIcon');
    const statusTitle = document.getElementById('customerStatusInfoTitle');
    const statusContent = document.getElementById('customerStatusInfoContent');
    
    if (statusIcon && statusTitle && statusContent) {
        statusIcon.textContent = customerStatus.icon;
        statusTitle.textContent = customerStatus.title;
        statusContent.textContent = customerStatus.description;
    }
}

function extractVerificationMedia(verification) {
    if (!verification) return { posterUrl: '', videoUrl: '', posterPath: '', videoPath: '' };
    const posterUrl = verification.facePosterUrl || '';
    const videoUrl = verification.faceVideoUrl || '';
    const posterPath = verification.facePosterPath || '';
    const videoPath = verification.faceVideoPath || '';
    return {
        posterUrl,
        videoUrl,
        posterPath,
        videoPath
    };
}

function buildAccountStatusFromVerification(verification, roleLabel) {
    const role = roleLabel || 'member';
    const media = extractVerificationMedia(verification);
    if (verification?.businessVerified || verification?.status === 'business_verified') {
        return {
            type: 'business',
            icon: '👑',
            title: 'Business Verified',
            description: `This ${role} completed Business verification and has enhanced trust status on GISUGO.`,
            media
        };
    }
    if (verification?.proVerified || verification?.status === 'pro_verified') {
        return {
            type: 'pro',
            icon: '⭐',
            title: 'Pro Verified',
            description: `This ${role} completed Pro verification with added identity checks for trust and credibility.`,
            media
        };
    }
    if (verification?.faceVerified || verification?.status === 'face_verified') {
        return {
            type: 'face',
            icon: '🎥',
            title: 'Face Verified',
            description: `This ${role} completed Face Verification with a short selfie introduction.`,
            media
        };
    }
    return {
        type: 'unverified',
        icon: '🌱',
        title: 'Unverified',
        description: `This ${role} has not completed Face Verification yet. You may continue, but Face Verification adds an extra trust signal for gig interactions.`,
        media
    };
}

async function resolveUserAccountStatus(userId, options = {}) {
    const role = options.role || 'member';

    try {
        if (typeof getUserProfile === 'function' && userId) {
            const profile = await getUserProfile(userId);
            if (profile && profile.verification) {
                return buildAccountStatusFromVerification(profile.verification, role);
            }
        }
    } catch (error) {
        console.warn('⚠️ Could not load counterpart verification profile:', error);
    }

    return buildAccountStatusFromVerification(null, role);
}

function updateStatusFacePreview(previewBlockId, previewImageId, status) {
    const previewBlock = document.getElementById(previewBlockId);
    const previewImage = document.getElementById(previewImageId);
    if (!previewBlock || !previewImage) return;

    const posterUrl = sanitizeUrl(status?.media?.posterUrl || '', '');
    console.info('[FV_MODAL_MEDIA_RESOLVE]', {
        surface: previewBlockId,
        hasPosterUrl: !!posterUrl
    });
    if (posterUrl) {
        previewImage.src = posterUrl;
        previewBlock.style.display = 'flex';
    } else {
        previewImage.removeAttribute('src');
        previewBlock.style.display = 'none';
    }
}

function getDisclaimerEnabledMessage(modalId) {
    if (modalId === 'acceptGig') return 'This will confirm your commitment to complete the gig.';
    if (modalId === 'confirmHire') return 'All other applicants will be rejected.';
    return 'You may now proceed.';
}

function getVerificationGateElements(modalId) {
    if (modalId === 'acceptGig') {
        return {
            overlay: document.getElementById('confirmAcceptGigOverlay'),
            reminderCard: document.getElementById('acceptUnverifiedReminder')
        };
    }
    if (modalId === 'confirmHire') {
        return {
            overlay: document.getElementById('hireConfirmationOverlay'),
            reminderCard: document.getElementById('hireUnverifiedReminder')
        };
    }
    return { overlay: null, reminderCard: null };
}

function refreshDisclaimerGate(modalId) {
    const tabContainer = document.getElementById(`${modalId}LangTabs`);
    const warningEl = document.getElementById(`${modalId}Warning`);
    const buttonIdMap = { acceptGig: 'confirmAcceptGigBtn', confirmHire: 'confirmHireBtn' };
    const confirmBtn = document.getElementById(buttonIdMap[modalId] || `${modalId}Btn`);
    if (!tabContainer || !confirmBtn || !warningEl) return;

    const { overlay, reminderCard } = getVerificationGateElements(modalId);
    const hasSelectedLanguage = !!tabContainer.querySelector('.lang-tab.active');
    const requiresDecision = !!(reminderCard && reminderCard.style.display !== 'none');
    const hasProceedDecision = !!(overlay && overlay.dataset.verificationDecision === 'proceed');
    const canProceed = hasSelectedLanguage && (!requiresDecision || hasProceedDecision);

    confirmBtn.disabled = !canProceed;

    const iconEl = warningEl.querySelector('.final-warning-icon');
    const textEl = warningEl.querySelector('.final-warning-text');
    if (!iconEl || !textEl) return;

    if (!hasSelectedLanguage) {
        iconEl.textContent = '📖';
        textEl.textContent = 'Please read the disclaimer above to continue';
    } else if (requiresDecision && !hasProceedDecision) {
        iconEl.textContent = '⚠️';
        textEl.textContent = modalId === 'confirmHire'
            ? 'To proceed now, choose Send Offer Anyway.'
            : 'To proceed now, choose Accept Offer Anyway.';
    } else {
        iconEl.textContent = '✅';
        textEl.textContent = getDisclaimerEnabledMessage(modalId);
    }
}

function setVerificationDecision(modalId, decision) {
    const { overlay } = getVerificationGateElements(modalId);
    if (!overlay) return;
    if (decision) {
        overlay.dataset.verificationDecision = decision;
    } else {
        delete overlay.dataset.verificationDecision;
    }
    refreshDisclaimerGate(modalId);
}

function getCurrentReminderActorId() {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            return firebase.auth().currentUser?.uid || 'anonymous';
        }
    } catch (_) {
        // fall through
    }
    return 'anonymous';
}

function getVerificationReminderKey(counterpartId) {
    const actorId = getCurrentReminderActorId();
    return `verificationReminder:${actorId}:${counterpartId || 'unknown'}`;
}

function getVerificationReminderState(counterpartId) {
    const key = getVerificationReminderKey(counterpartId);
    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return { key, state: { status: 'none', requestedAt: 0 } };
        }
        const parsed = JSON.parse(raw);
        return {
            key,
            state: {
                status: parsed.status || 'none',
                requestedAt: Number(parsed.requestedAt || 0)
            }
        };
    } catch (_) {
        return { key, state: { status: 'none', requestedAt: 0 } };
    }
}

function setVerificationReminderPending(counterpartId) {
    const { key } = getVerificationReminderState(counterpartId);
    try {
        localStorage.setItem(
            key,
            JSON.stringify({ status: 'pending', requestedAt: Date.now() })
        );
    } catch (_) {
        // Non-fatal in private mode/full storage.
    }
}

function formatRelativeReminderTime(requestedAt) {
    if (!requestedAt) return 'Requested just now';
    const elapsedMs = Date.now() - requestedAt;
    const minutes = Math.max(1, Math.floor(elapsedMs / 60000));
    if (minutes < 60) {
        return `Requested ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `Requested ${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.floor(hours / 24);
    return `Requested ${days} day${days === 1 ? '' : 's'} ago`;
}

function clearVerificationReminderTicker(context) {
    const overlay = document.getElementById(
        context === 'hire' ? 'hireConfirmationOverlay' : 'confirmAcceptGigOverlay'
    );
    if (!overlay) return;
    if (overlay.__verificationReminderTicker) {
        clearInterval(overlay.__verificationReminderTicker);
        overlay.__verificationReminderTicker = null;
    }
}

function startVerificationReminderTicker(context) {
    const overlay = document.getElementById(
        context === 'hire' ? 'hireConfirmationOverlay' : 'confirmAcceptGigOverlay'
    );
    if (!overlay) return;

    clearVerificationReminderTicker(context);
    overlay.__verificationReminderTicker = setInterval(() => {
        if (!overlay.classList.contains('show')) {
            clearVerificationReminderTicker(context);
            return;
        }
        const counterpartName = context === 'hire'
            ? (overlay.dataset.userName || 'this worker')
            : (overlay.dataset.posterName || 'this customer');
        const counterpartId = context === 'hire'
            ? (overlay.dataset.userId || counterpartName)
            : (overlay.dataset.posterId || counterpartName);
        const statusType = overlay.dataset.verificationStatusType || '';
        updateVerificationReminderActions(context, statusType, counterpartName, counterpartId);
    }, 60000);
}

function attachConfirmAcceptGigEscHandler() {
    const overlay = document.getElementById('confirmAcceptGigOverlay');
    if (!overlay || overlay.__escHandlerAttached) return;
    if (!overlay.__escHandler) {
        overlay.__escHandler = function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('show')) {
                hideConfirmAcceptGigOverlay();
            }
        };
    }
    document.addEventListener('keydown', overlay.__escHandler);
    overlay.__escHandlerAttached = true;
}

function detachConfirmAcceptGigEscHandler() {
    const overlay = document.getElementById('confirmAcceptGigOverlay');
    if (!overlay || !overlay.__escHandlerAttached || !overlay.__escHandler) return;
    document.removeEventListener('keydown', overlay.__escHandler);
    overlay.__escHandlerAttached = false;
}

function attachHireConfirmationEscHandler() {
    const overlay = document.getElementById('hireConfirmationOverlay');
    if (!overlay || overlay.__escHandlerAttached) return;
    if (!overlay.__escHandler) {
        overlay.__escHandler = function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('show')) {
                hideHireConfirmationOverlay();
            }
        };
    }
    document.addEventListener('keydown', overlay.__escHandler);
    overlay.__escHandlerAttached = true;
}

function detachHireConfirmationEscHandler() {
    const overlay = document.getElementById('hireConfirmationOverlay');
    if (!overlay || !overlay.__escHandlerAttached || !overlay.__escHandler) return;
    document.removeEventListener('keydown', overlay.__escHandler);
    overlay.__escHandlerAttached = false;
}

// ===== DISCLAIMER LANGUAGE TABS =====
function initializeDisclaimerLanguageTabs(modalId) {
    const tabContainer = document.getElementById(`${modalId}LangTabs`);
    const placeholder = document.getElementById(`${modalId}Placeholder`);
    const englishContent = document.getElementById(`${modalId}English`);
    const bisayaContent = document.getElementById(`${modalId}Bisaya`);
    const tagalogContent = document.getElementById(`${modalId}Tagalog`);
    // Button ID mapping (different modals have different naming patterns)
    const buttonIdMap = {
        acceptGig: 'confirmAcceptGigBtn',
        confirmHire: 'confirmHireBtn'
    };
    const confirmBtn = document.getElementById(buttonIdMap[modalId] || `${modalId}Btn`);
    const warningEl = document.getElementById(`${modalId}Warning`);
    
    if (!tabContainer) return;
    
    const tabs = tabContainer.querySelectorAll('.lang-tab');
    const contentMap = {
        english: englishContent,
        bisaya: bisayaContent,
        tagalog: tagalogContent
    };
    
    // Reset state when modal opens
    tabs.forEach(tab => tab.classList.remove('active'));
    Object.values(contentMap).forEach(content => {
        if (content) content.style.display = 'none';
    });
    if (placeholder) {
        placeholder.classList.remove('hidden');
        placeholder.style.display = 'flex';
    }
    
    // Disable confirm button and set warning baseline
    if (confirmBtn) confirmBtn.disabled = true;
    if (warningEl) {
        const iconEl = warningEl.querySelector('.final-warning-icon');
        const textEl = warningEl.querySelector('.final-warning-text');
        if (iconEl) iconEl.textContent = '📖';
        if (textEl) textEl.textContent = 'Please read the disclaimer above to continue';
    }
    
    // Add click handlers to tabs
    tabs.forEach(tab => {
        // Remove existing listeners by cloning
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        newTab.addEventListener('click', () => {
            const lang = newTab.dataset.lang;
            
            // Update active tab
            tabContainer.querySelectorAll('.lang-tab').forEach(t => t.classList.remove('active'));
            newTab.classList.add('active');
            
            // Hide placeholder
            if (placeholder) {
                placeholder.classList.add('hidden');
                placeholder.style.display = 'none';
            }
            
            // Show selected content, hide others
            Object.entries(contentMap).forEach(([key, content]) => {
                if (content) {
                    content.style.display = key === lang ? 'block' : 'none';
                }
            });
            
            // Gate confirm button by language + verification choice (when required).
            refreshDisclaimerGate(modalId);
            
            console.log(`📖 Disclaimer language selected: ${lang}`);
        });
    });
    
    console.log(`🌐 Disclaimer language tabs initialized for ${modalId}`);
}

function initializeConfirmAcceptGigHandlers() {
    const overlay = document.getElementById('confirmAcceptGigOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;
    
    const closeBtn = document.getElementById('confirmAcceptGigCloseBtn');
    const cancelBtn = document.getElementById('cancelAcceptGigBtn');
    const confirmBtn = document.getElementById('confirmAcceptGigBtn');
    const requestBtn = document.getElementById('acceptRequestVerificationBtn');
    const proceedBtn = document.getElementById('acceptProceedAnywayBtn');
    
    console.log('🔧 Initializing confirm accept gig handlers');
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', hideConfirmAcceptGigOverlay);
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideConfirmAcceptGigOverlay);
    }
    
    // Confirm accept button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            console.log('✅ Final accept gig confirmation clicked!');
            const jobData = {
                jobId: overlay.dataset.jobId,
                posterId: overlay.dataset.posterId,
                posterName: overlay.dataset.posterName,
                posterThumbnail: overlay.dataset.posterThumbnail,
                title: overlay.dataset.jobTitle,
                priceOffer: overlay.dataset.priceOffer,
                category: overlay.dataset.category
            };
            
            processAcceptGigConfirmation(jobData);
        });
    }

    if (requestBtn) {
        requestBtn.addEventListener('click', function() {
            const counterpartName = overlay.dataset.posterName || 'this customer';
            const counterpartId = overlay.dataset.posterId || counterpartName;
            setVerificationReminderPending(counterpartId);
            if (proceedBtn) {
                proceedBtn.classList.remove('selected');
                proceedBtn.textContent = 'Accept Offer Anyway';
            }
            setVerificationDecision('acceptGig', null);
            hideConfirmAcceptGigOverlay();
            showConfirmationWithCallback(
                '📨',
                'Verification Reminder Sent',
                `A Face Verification reminder has been sent to ${counterpartName}. Reopen this offer when you are ready to proceed.`,
                null
            );
        });
    }

    if (proceedBtn) {
        proceedBtn.addEventListener('click', function() {
            const isSelected = proceedBtn.classList.toggle('selected');
            proceedBtn.textContent = isSelected ? '✓ Accept Offer Anyway' : 'Accept Offer Anyway';
            if (isSelected && requestBtn && !requestBtn.disabled) {
                requestBtn.classList.remove('selected');
                requestBtn.textContent = 'Request Verification';
            }
            const warningEl = document.getElementById('acceptGigWarning');
            if (warningEl) {
                const icon = warningEl.querySelector('.final-warning-icon');
                const text = warningEl.querySelector('.final-warning-text');
                if (icon) icon.textContent = '📖';
                if (text) text.textContent = isSelected
                    ? 'Offer choice saved. Please read one disclaimer tab to continue.'
                    : 'Please read the disclaimer above to continue';
            }
            setVerificationDecision('acceptGig', isSelected ? 'proceed' : null);
        });
    }
    
    // Backdrop click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideConfirmAcceptGigOverlay();
        }
    });
    
    overlay.dataset.handlersInitialized = 'true';
}

function hideConfirmAcceptGigOverlay() {
    const overlay = document.getElementById('confirmAcceptGigOverlay');
    if (!overlay) return;
    
    clearVerificationReminderTicker('accept');
    detachConfirmAcceptGigEscHandler();
    overlay.classList.remove('show');
    
    console.log('🤝 Confirm accept gig overlay hidden and handlers cleaned up');
}

function processAcceptGigConfirmation(jobData) {
    console.log('🎉 Processing accept gig confirmation for:', jobData);
    
    // Hide confirmation overlay
    hideConfirmAcceptGigOverlay();
    
    // Show success confirmation with celebration animation
    showConfirmationWithCallback(
        '🎉',
        'Gig Offer Accepted!',
        `You have accepted the gig offer from ${jobData.posterName}. The gig will now appear in your "WORKING" tab. You can coordinate work details through messages.`,
        async () => {
            try {
                // Move job from offered to accepted status
                await moveJobFromOfferedToAccepted(jobData.jobId);
                
                // Refresh both offered and accepted tabs
                await loadOfferedContent();
                await loadAcceptedContent();
                
                // Update tab counts
                await updateTabCounts();
                
                console.log('✅ Job successfully moved from offered to accepted');
            } catch (error) {
                console.error('❌ Error in accept gig process:', error);
            }
        },
        'celebration'
    );
}

// ===== REJECT GIG OFFER OVERLAY FUNCTIONS =====
function showRejectGigOfferOverlay(jobData) {
    console.log('❌ Show reject gig offer overlay for:', jobData);
    
    const overlay = document.getElementById('rejectGigOfferOverlay');
    const customerNameSpan = document.getElementById('rejectCustomerName');
    
    if (!overlay) {
        console.error('❌ Reject gig offer overlay not found');
        return;
    }
    
    // Store full jobData on overlay for later use
    overlay.dataset.jobData = JSON.stringify(jobData);
    
    // Update customer name in warning text
    if (customerNameSpan) {
        customerNameSpan.textContent = jobData.posterName;
    }
    
    // Store job data in overlay
    overlay.dataset.jobId = jobData.jobId;
    overlay.dataset.posterName = jobData.posterName;
    overlay.dataset.jobTitle = jobData.title;
    
    // Initialize handlers
    initializeRejectGigOfferHandlers();
    
    // Show overlay
    overlay.classList.add('show');
    
    console.log('❌ Reject gig offer overlay shown');
}

function initializeRejectGigOfferHandlers() {
    const overlay = document.getElementById('rejectGigOfferOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;
    
    const cancelBtn = document.getElementById('rejectGigOfferCancelBtn');
    const confirmBtn = document.getElementById('confirmRejectGigOfferBtn');
    
    console.log('🔧 Initializing reject gig offer handlers');
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideRejectGigOfferOverlay);
    }
    
    // Confirm reject button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            // Retrieve full jobData from overlay
            const jobData = JSON.parse(overlay.dataset.jobData || '{}');
            processRejectGigConfirmation(jobData);
        });
    }
    
    // Backdrop click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideRejectGigOfferOverlay();
        }
    });
    
    // Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideRejectGigOfferOverlay();
        }
    });
    
    overlay.dataset.handlersInitialized = 'true';
}

function hideRejectGigOfferOverlay() {
    const overlay = document.getElementById('rejectGigOfferOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('show');
    
    // Clean up handlers
    delete overlay.dataset.handlersInitialized;
    
    console.log('❌ Reject gig offer overlay hidden');
}

async function processRejectGigConfirmation(jobData) {
    console.log('❌ Processing reject gig confirmation for:', jobData);
    
    // Hide rejection overlay
    hideRejectGigOfferOverlay();
    
    // Show loading while processing
    showLoadingOverlay('Rejecting offer...');
    
    try {
        // Remove job from offered data and restore applications for customer
        await rejectGigOffer(jobData.jobId);
        
        // ═══════════════════════════════════════════════════════════════
        // SEND NOTIFICATION TO CUSTOMER (Uses existing ALERTS tab)
        // ═══════════════════════════════════════════════════════════════
        try {
            if (typeof sendOfferRejectedNotification === 'function') {
                const currentUser = firebase.auth ? firebase.auth().currentUser : null;
                const workerName = currentUser?.displayName || 'A worker';
                
                const notifResult = await sendOfferRejectedNotification(
                    jobData.posterId,
                    jobData.posterName,
                    jobData.jobId,
                    jobData.title,
                    workerName
                );
                
                if (notifResult.success) {
                    console.log('✅ Customer will see notification in Messages > ALERTS tab');
                }
            }
        } catch (notifError) {
            console.error('⚠️ Error sending notification (non-critical):', notifError);
            // Don't fail reject operation if notification fails
        }
        
        // Hide loading
        hideLoadingOverlay();
        
        // Show success confirmation
        showConfirmationWithCallback(
            '❌',
            'Gig Offer Rejected',
            `You have rejected the gig offer from ${jobData.posterName}. The customer has been notified of your decision.`,
            async () => {
                try {
                    // Refresh offered tab
                    await loadOfferedContent();
                    
                    // Update tab counts
                    await updateTabCounts();
                    
                    console.log('✅ Gig offer successfully rejected');
                } catch (error) {
                    console.error('❌ Error refreshing after rejection:', error);
                }
            },
            'rejection'
        );
    } catch (error) {
        hideLoadingOverlay();
        console.error('❌ Error in reject gig process:', error);
        showErrorNotification('Failed to reject offer. Please try again.');
    }
}

// ===== CONTACT CUSTOMER OVERLAY FUNCTIONS =====
function showContactCustomerOverlay(jobData) {
    console.log('📞 Show contact customer overlay for:', jobData);
    
    // Use the existing contact message overlay system
    showContactMessageOverlay(jobData.posterId, jobData.posterName, jobData.jobId);
    
    // Update placeholder text for customer context
    const messageInput = document.getElementById('contactMessageInput');
    if (messageInput) {
        messageInput.placeholder = 'Write your message to the customer. Suggestion: Ask for contact details or clarify job requirements.';
    }
    
    console.log('📞 Contact customer overlay shown');
}

// ===== DATA MANIPULATION FUNCTIONS =====
async function moveJobFromOfferedToAccepted(jobId) {
    console.log(`🔄 Moving job ${jobId} from offered to accepted status`);
    
    // Check if Firebase mode is active
    const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
    
    if (useFirebase && typeof firebase !== 'undefined') {
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Update job status to accepted
        // ══════════════════════════════════════════════════════════════
        try {
            const db = firebase.firestore();
            
            console.log('🔥 Accepting offer in Firebase...');
            
            // Update job: change status to 'accepted' and add timestamp
            await db.collection('jobs').doc(jobId).update({
                status: 'accepted', // Change from 'hired' to 'accepted'
                acceptedAt: firebase.firestore.FieldValue.serverTimestamp(),
                workerAccepted: true // Flag to indicate worker has accepted
            });

            // Track worker acceptance activity.
            try {
                const acceptedWorker = firebase.auth().currentUser;
                if (acceptedWorker?.uid) {
                    await db.collection('users').doc(acceptedWorker.uid).update({
                        'statistics.worker.totalGigsAccepted': firebase.firestore.FieldValue.increment(1)
                    });
                    console.log('✅ Worker acceptance statistics updated');
                }
            } catch (statsError) {
                console.warn('⚠️ Could not update worker acceptance statistics:', statsError);
            }
            
            // Get job data for notification
            const jobDoc = await db.collection('jobs').doc(jobId).get();
            const jobData = jobDoc.data();
            
            console.log('🔔 About to create acceptance notification for customer:', jobData?.posterId);
            
            // Show loading state during acceptance
            showLoadingOverlay('Processing acceptance...');
            
            // Create notification for customer about offer acceptance
            try {
                if (typeof createNotification === 'function' && jobData && jobData.posterId) {
                    console.log('✅ createNotification function exists');
                    const currentUser = firebase.auth().currentUser;
                    const workerProfile = await getUserProfile(currentUser.uid);
                    const workerName = workerProfile?.fullName || 'Worker';
                    
                    const result = await createNotification(jobData.posterId, {
                        type: 'offer_accepted',
                        jobId: jobId,
                        jobTitle: jobData.title || 'Your Gig',
                        message: `${workerName} has accepted your gig offer for "${jobData.title}"!`,
                        actionRequired: false
                    });
                    console.log('✅ Acceptance notification result:', result);
                } else {
                    console.error('❌ createNotification not found or missing job data');
                }
            } catch (notifError) {
                console.error('❌ Error creating acceptance notification:', notifError);
                // Don't fail the acceptance if notification fails
            }
            
            // Hide loading state
            hideLoadingOverlay();
            
            console.log('✅ Job offer accepted in Firebase - status changed to accepted');
            
            // Clean up offer_sent notification - no longer needed once accepted
            try {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    const offerNotifs = await db.collection('notifications')
                        .where('recipientId', '==', currentUser.uid)
                        .where('jobId', '==', jobId)
                        .where('type', '==', 'offer_sent')
                        .get();
                    if (!offerNotifs.empty) {
                        const deletePromises = offerNotifs.docs.map(doc => doc.ref.delete());
                        await Promise.all(deletePromises);
                        console.log(`🗑️ Cleaned up ${offerNotifs.size} offer notification(s) after acceptance`);
                    }
                }
            } catch (cleanupError) {
                console.warn('⚠️ Could not clean up offer notifications:', cleanupError);
            }
            
            // Now that worker has accepted, reject all other pending applications for this job
            try {
                const otherApps = await db.collection('applications')
                    .where('jobId', '==', jobId)
                    .where('status', '==', 'pending')
                    .get();
                if (!otherApps.empty) {
                    const batch = db.batch();
                    otherApps.docs.forEach(doc => {
                        batch.update(doc.ref, {
                            status: 'rejected',
                            rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                    await batch.commit();
                    console.log(`✅ Rejected ${otherApps.size} other pending application(s) after worker accepted`);
                }
            } catch (rejectError) {
                console.warn('⚠️ Could not reject other applications:', rejectError);
            }
            
            return;
        } catch (error) {
            console.error('❌ Error accepting offer in Firebase:', error);
            throw error;
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // MOCK MODE - Move from offered to hiring data
    // ══════════════════════════════════════════════════════════════
    if (!MOCK_OFFERED_DATA) return;
    
    const jobIndex = MOCK_OFFERED_DATA.findIndex(job => job.jobId === jobId);
    if (jobIndex === -1) {
        console.error(`❌ Job ${jobId} not found in offered data`);
        return;
    }
    
    // Get the job data
    const offeredJob = MOCK_OFFERED_DATA[jobIndex];
    
    // Remove from offered data
    MOCK_OFFERED_DATA.splice(jobIndex, 1);
    
    // Convert to accepted job format and add to hiring data
    const acceptedJob = {
        ...offeredJob,
        status: 'hired',
        dateHired: formatDateTime(new Date()),
        hiredWorkerName: offeredJob.hiredWorkerName,
        hiredWorkerId: offeredJob.hiredWorkerId,
        hiredWorkerThumbnail: 'public/users/Peter-J-Ang-User-01.jpg'
    };
    
    // Add to hiring data (this makes it appear in both customer's Hiring tab and worker's Accepted tab)
    if (!MOCK_HIRING_DATA) {
        MOCK_HIRING_DATA = [];
    }
    MOCK_HIRING_DATA.push(acceptedJob);
    
    console.log(`✅ Job ${jobId} successfully moved from offered to accepted`);
}

async function rejectGigOffer(jobId) {
    console.log(`❌ Rejecting gig offer ${jobId}`);
    
    // Check if Firebase mode is active
    const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
    
    if (useFirebase && typeof firebase !== 'undefined') {
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Update job status back to active
        // ══════════════════════════════════════════════════════════════
        try {
            const db = firebase.firestore();
            
            console.log('🔥 Rejecting offer in Firebase...');
            
            // Get current user ID
            const currentUser = firebase.auth().currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            
            // Update job: remove hired worker info and set status back to active
            await db.collection('jobs').doc(jobId).update({
                status: 'active',
                hiredWorkerId: firebase.firestore.FieldValue.delete(),
                hiredWorkerName: firebase.firestore.FieldValue.delete(),
                hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
                agreedPrice: firebase.firestore.FieldValue.delete(),
                hiredAt: firebase.firestore.FieldValue.delete(),
                acceptedAt: firebase.firestore.FieldValue.delete(),
                rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
                // applicationCount will be restored after tallying pending applications below
            });
            
            console.log('✅ Job offer rejected in Firebase, job restored to active');
            
            // ═══════════════════════════════════════════════════════════════
            // UPDATE WORKER'S APPLICATION STATUS TO 'REJECTED'
            // ═══════════════════════════════════════════════════════════════
            try {
                const applicationsSnapshot = await db.collection('applications')
                    .where('jobId', '==', jobId)
                    .where('applicantId', '==', currentUser.uid)
                    .where('status', '==', 'accepted')
                    .get();
                
                const batch = db.batch();
                applicationsSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, {
                        status: 'rejected',
                        rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                console.log('✅ Worker application status updated to rejected');
                
                // Count remaining pending applications and restore applicationCount
                const pendingApps = await db.collection('applications')
                    .where('jobId', '==', jobId)
                    .where('status', '==', 'pending')
                    .get();
                await db.collection('jobs').doc(jobId).update({
                    applicationCount: pendingApps.size
                });
                console.log(`✅ Restored applicationCount to ${pendingApps.size} pending application(s)`);
            } catch (appError) {
                console.error('⚠️ Error updating application status:', appError);
                // Don't throw - job update succeeded, application update is non-critical
            }
            
            // Clean up offer_sent notification for this job (no longer relevant)
            try {
                const offerNotifs = await db.collection('notifications')
                    .where('recipientId', '==', currentUser.uid)
                    .where('jobId', '==', jobId)
                    .where('type', '==', 'offer_sent')
                    .get();
                if (!offerNotifs.empty) {
                    const deletePromises = offerNotifs.docs.map(doc => doc.ref.delete());
                    await Promise.all(deletePromises);
                    console.log(`🗑️ Cleaned up ${offerNotifs.size} offer notification(s) after rejection`);
                }
            } catch (cleanupError) {
                console.warn('⚠️ Could not clean up offer notifications:', cleanupError);
            }
            
            return;
        } catch (error) {
            console.error('❌ Error rejecting offer in Firebase:', error);
            throw error;
        }
    }
    
    // ══════════════════════════════════════════════════════════════
    // MOCK MODE - Remove from offered data
    // ══════════════════════════════════════════════════════════════
    if (!MOCK_OFFERED_DATA) return;
    
    const jobIndex = MOCK_OFFERED_DATA.findIndex(job => job.jobId === jobId);
    if (jobIndex === -1) {
        console.error(`❌ Job ${jobId} not found in offered data`);
        return;
    }
    
    // Remove from offered data
    MOCK_OFFERED_DATA.splice(jobIndex, 1);
    
    console.log(`✅ Job ${jobId} successfully rejected and removed from offered data`);
}

async function addToOfferedData(jobData, workerData) {
    console.log(`💼 Adding job ${jobData.jobId} to offered data for worker ${workerData.userName}`);
    
    // Initialize offered data if it doesn't exist
    if (!MOCK_OFFERED_DATA) {
        MOCK_OFFERED_DATA = [];
    }
    
    // Create offered job entry
    const offeredJob = {
        jobId: jobData.jobId,
        posterId: jobData.posterId || 'unknown-poster',
        posterName: jobData.posterName || 'Unknown Customer',
        posterThumbnail: jobData.posterThumbnail || 'public/users/User-04.jpg',
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        thumbnail: jobData.thumbnail,
        jobDate: jobData.jobDate,
        startTime: jobData.startTime,
        endTime: jobData.endTime,
        priceOffer: workerData.priceOffer,
        datePosted: jobData.datePosted,
        dateOffered: formatDateTime(new Date()),
        status: 'offered',
        hiredWorkerId: workerData.userId,
        hiredWorkerName: workerData.userName,
        role: 'worker' // Always worker perspective for offered jobs
    };
    
    // Add to offered data
    MOCK_OFFERED_DATA.push(offeredJob);
    
    console.log(`✅ Job ${jobData.jobId} successfully added to offered data`);
    
    // In Firebase, this would be:
    // const db = firebase.firestore();
    // await db.collection('jobs').doc(jobId).update({
    //     status: 'offered',
    //     hiredWorkerId: workerData.userId,
    //     hiredWorkerName: workerData.userName,
    //     offeredAt: firebase.firestore.FieldValue.serverTimestamp(),
    //     agreedPrice: workerData.priceOffer
    // });
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
    console.log(`📋 Job details:`, {
        jobId: jobData.jobId,
        title: jobData.title,
        hiredWorkerId: jobData.hiredWorkerId,
        hiredWorkerName: jobData.hiredWorkerName
    });
    
    // Prevent multiple relist operations on the same job
    const overlay = document.getElementById('relistJobConfirmationOverlay');
    if (overlay.classList.contains('show')) {
        console.log('⚠️ Relist overlay already shown, ignoring duplicate call');
        return;
    }
    
    hideHiringOptionsOverlay();
    
    // Show loading animation while preparing confirmation modal
    showLoadingOverlay('Loading...');
    
    try {
        // Get worker name from job data
        const hiredJobs = await JobsDataService.getAllHiredJobs();
        const job = hiredJobs.find(j => j.jobId === jobData.jobId);
    const workerName = job ? job.hiredWorkerName : 'the worker';
    
    // Show relist confirmation overlay (overlay already defined above)
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
    overlay.setAttribute('data-hired-worker-id', job ? job.hiredWorkerId : '');
    overlay.removeAttribute('data-relist-type'); // Clear previous relist type
    
    overlay.classList.add('show');
    console.log('📋 Relist confirmation overlay shown');
    
    // Initialize confirmation handlers
    initializeRelistJobConfirmationHandlers();
    
    } catch (error) {
        console.error('❌ Error preparing relist modal:', error);
        alert('Failed to load relist details. Please try again.');
    } finally {
        // Hide loading animation
        hideLoadingOverlay();
    }
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
    console.log('📋 Resign confirmation overlay shown');
    
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
            
            // ══════════════════════════════════════════════════════════════
            // FIREBASE IMPLEMENTATION - Mark job as completed
            // ══════════════════════════════════════════════════════════════
            try {
                showLoadingOverlay('Marking job as completed...');
                
                const db = firebase.firestore();
                const jobRef = db.collection('jobs').doc(jobId);
                
                // Step 1: Get job data to retrieve price and worker ID
                const jobDoc = await jobRef.get();
                if (!jobDoc.exists) {
                    throw new Error('Job not found');
                }
                
                const jobData = jobDoc.data();
                const agreedPrice = jobData.agreedPrice || jobData.priceOffer || 0;
                const currentYear = new Date().getFullYear().toString();
                
                console.log('💰 Completing job with agreed price:', agreedPrice);
                console.log('📅 Current year:', currentYear);
                
                // Step 2: Update job status to completed
                await jobRef.update({
                    status: 'completed',
                    completedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    completedBy: 'customer',
                    completionConfirmed: true
                });
                
                console.log('✅ Job status updated to completed');
                
                // Step 2b: Send notification to worker about completion (with feedback reminder)
                try {
                    if (typeof createNotification === 'function' && jobData.hiredWorkerId) {
                        const customerProfile = await getUserProfile(jobData.posterId);
                        const customerName = customerProfile?.fullName || 'Customer';
                        
                        await createNotification(jobData.hiredWorkerId, {
                            type: 'job_completed',
                            jobId: jobId,
                            jobTitle: jobData.title || 'Gig',
                            message: `"${jobData.title}" has been marked as complete by ${customerName}.`,
                            actionRequired: false
                        });
                        console.log('✅ Completion notification sent to worker');
                    }
                } catch (notifError) {
                    console.error('❌ Error creating completion notification:', notifError);
                    // Don't fail the completion if notification fails
                }
                
                // Step 3: Update customer statistics
                await db.collection('users').doc(jobData.posterId).update({
                    'statistics.customer.totalGigsCompleted': firebase.firestore.FieldValue.increment(1),
                    'statistics.customer.totalSpent': firebase.firestore.FieldValue.increment(agreedPrice),
                    [`statistics.customer.yearlyStats.${currentYear}.gigsCompleted`]: firebase.firestore.FieldValue.increment(1),
                    [`statistics.customer.yearlyStats.${currentYear}.spent`]: firebase.firestore.FieldValue.increment(agreedPrice)
                });
                
                console.log('✅ Customer statistics updated');
                
                // Step 4: Update worker statistics
                await db.collection('users').doc(jobData.hiredWorkerId).update({
                    'statistics.worker.totalGigsCompleted': firebase.firestore.FieldValue.increment(1),
                    'statistics.worker.totalEarned': firebase.firestore.FieldValue.increment(agreedPrice),
                    [`statistics.worker.yearlyStats.${currentYear}.gigsCompleted`]: firebase.firestore.FieldValue.increment(1),
                    [`statistics.worker.yearlyStats.${currentYear}.earned`]: firebase.firestore.FieldValue.increment(agreedPrice)
                });
                
                console.log('✅ Worker statistics updated');
                
                hideLoadingOverlay();
                
            } catch (error) {
                console.error('❌ Error marking job as completed:', error);
                hideLoadingOverlay();
                showErrorNotification('Failed to mark job as completed: ' + error.message);
                return;
            }
            // ══════════════════════════════════════════════════════════════
            
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
    const overlay = document.getElementById('relistJobConfirmationOverlay');
    if (overlay.dataset.handlersInitialized) {
        console.log('🔧 Relist confirmation handlers already initialized, skipping');
        return;
    }
    
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
            
            // Prevent multiple executions
            if (overlay.dataset.processing === 'true') {
                console.log('⚠️ Relist already in progress, ignoring duplicate call');
                return;
            }
            overlay.dataset.processing = 'true';
            
            // Disable the button to prevent rapid clicking
            yesBtn.disabled = true;
            
            const jobId = overlay.getAttribute('data-job-id');
            const jobTitle = overlay.getAttribute('data-job-title');
            const relistType = overlay.getAttribute('data-relist-type');
            const reason = reasonInput ? reasonInput.value.trim() : '';
            
            // Validate reason input
            if (!reason || reason.length < 2) {
                reasonError.classList.add('show');
                overlay.dataset.processing = 'false'; // Reset processing flag
                yesBtn.disabled = false; // Re-enable button
                return;
            }
            
            // Hide confirmation overlay
            overlay.classList.remove('show');
            
            // Clear handlers initialization flag to allow re-initialization
            delete overlay.dataset.handlersInitialized;
            
            // Show loading animation
            showLoadingOverlay('Voiding contract...');
            
            if (relistType === 'completed') {
                // Handle completed job relisting - create draft
                console.log(`🔄 Creating job draft from completed job: ${jobId}`);
                
                // Get the completed job data to copy
                const completedJobs = await JobsDataService.getCompletedJobs();
                const sourceJob = completedJobs.find(j => j.jobId === jobId);
                
                if (sourceJob) {
                    // Create new draft based on completed job
                    // In Firebase, this would create a new job document with status: 'draft'
                    showSuccessNotification(`Gig draft created! You can now edit details and repost "${jobTitle}".`);
                    
                    // Navigate to new-post2.html with pre-filled data for editing
                    // In real implementation: window.location.href = `/new-post2.html?draft=${newDraftId}`;
                    setTimeout(() => {
                        showSuccessNotification('Draft feature not yet implemented - would redirect to edit page');
                    }, 2000);
                } else {
                    showErrorNotification('Failed to find job data for relisting');
                }
            } else {
                // Handle hiring job relisting - REACTIVATE existing job (don't create new one)
                const workerName = overlay.getAttribute('data-worker-name');
                const hiredWorkerId = overlay.getAttribute('data-hired-worker-id');
                
                console.log(`🔄 RELIST hiring job: ${jobId} (Customer perspective) - REACTIVATING existing job`);
                
                // Check if Firebase mode is active
                const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
                
                if (useFirebase && typeof firebase !== 'undefined') {
                    // ══════════════════════════════════════════════════════════════
                    // FIREBASE MODE - Reactivate job in Firestore
                    // ══════════════════════════════════════════════════════════════
                    try {
                        const db = firebase.firestore();
                        
                        console.log('🔥 Relisting job in Firebase...');
                        console.log('📋 Job ID:', jobId);
                        console.log('📋 Hired Worker ID:', hiredWorkerId);
                        
                        // Update job: remove hired worker info, set status back to active, add relist metadata
                        await db.collection('jobs').doc(jobId).update({
                            status: 'active',
                            hiredWorkerId: firebase.firestore.FieldValue.delete(),
                            hiredWorkerName: firebase.firestore.FieldValue.delete(),
                            hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
                            agreedPrice: firebase.firestore.FieldValue.delete(),
                            hiredAt: firebase.firestore.FieldValue.delete(),
                            acceptedAt: firebase.firestore.FieldValue.delete(), // Remove if worker had accepted before relist
                            relistedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            relistReason: reason,
                            voidedWorker: workerName,
                            voidedWorkerId: hiredWorkerId,
                            applicationCount: 0, // Reset for consistency (already 0 from hiring, but explicit is safer)
                            lastModified: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        console.log('✅ Job relisted in Firebase, restored to active status');

                        // Track firing/removal activity for customer and worker.
                        try {
                            const actingCustomerId = firebase.auth().currentUser?.uid;
                            if (actingCustomerId) {
                                await db.collection('users').doc(actingCustomerId).update({
                                    'statistics.customer.totalWorkersFired': firebase.firestore.FieldValue.increment(1)
                                });
                            }
                            if (hiredWorkerId) {
                                await db.collection('users').doc(hiredWorkerId).update({
                                    'statistics.worker.totalGigsRemoved': firebase.firestore.FieldValue.increment(1)
                                });
                            }
                            console.log('✅ Relist activity statistics updated');
                        } catch (statsError) {
                            console.warn('⚠️ Could not update relist activity statistics:', statsError);
                        }
                        
                        // Verify the update by reading the document back
                        const verifyDoc = await db.collection('jobs').doc(jobId).get();
                        console.log('🔍 Verification - Job status after update:', verifyDoc.data().status);
                        console.log('🔍 Verification - hiredWorkerId after update:', verifyDoc.data().hiredWorkerId || 'DELETED');
                        const jobData = verifyDoc.data();
                        
                        // Update the worker's application status to 'voided' to notify them
                        if (hiredWorkerId) {
                            try {
                                const applicationsSnapshot = await db.collection('applications')
                                    .where('jobId', '==', jobId)
                                    .where('applicantId', '==', hiredWorkerId)
                                    .where('status', '==', 'accepted')
                                    .get();
                                
                                const batch = db.batch();
                                applicationsSnapshot.docs.forEach(doc => {
                                    batch.update(doc.ref, {
                                        status: 'voided',
                                        voidedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                        voidReason: reason
                                    });
                                });
                                await batch.commit();
                                console.log('✅ Worker application marked as voided');
                                
                                // ═══════════════════════════════════════════════════════════════
                                // SEND NOTIFICATION TO WORKER (Uses existing ALERTS tab)
                                // ═══════════════════════════════════════════════════════════════
                                try {
                                    if (typeof sendContractVoidedNotification === 'function') {
                                        const notifResult = await sendContractVoidedNotification(
                                            hiredWorkerId,
                                            workerName,
                                            jobId,
                                            jobTitle,
                                            reason,
                                            jobData.posterName || 'Customer'
                                        );
                                        
                                        if (notifResult.success) {
                                            console.log('✅ Worker will see notification in Messages > ALERTS tab');
                                        }
                                    }
                                } catch (notifError) {
                                    console.error('⚠️ Error sending notification (non-critical):', notifError);
                                    // Don't fail relist operation if notification fails
                                }
                                
                            } catch (appError) {
                                console.error('⚠️ Error updating worker application:', appError);
                                // Don't fail the relist operation if this fails
                            }
                        }
                        
                        // Hide loading animation
                        hideLoadingOverlay();
                        
                        showContractVoidedSuccess(`Job reactivated successfully! "${jobTitle}" is now active in your Listings.`);
                        
                    } catch (error) {
                        console.error('❌ Error relisting job in Firebase:', error);
                        hideLoadingOverlay();
                        showErrorNotification('Failed to relist gig. Please try again.');
                    } finally {
                        // Reset processing flag
                        overlay.dataset.processing = 'false';
                        yesBtn.disabled = false;
                    }
                } else {
                    // ══════════════════════════════════════════════════════════════
                    // MOCK MODE - Move from hiring data back to listings
                    // ══════════════════════════════════════════════════════════════
                    if (MOCK_HIRING_DATA) {
                        const jobToRelist = MOCK_HIRING_DATA.find(job => job.jobId === jobId);
                        if (jobToRelist) {
                            // Remove from hiring data first
                            MOCK_HIRING_DATA = MOCK_HIRING_DATA.filter(job => job.jobId !== jobId);
                            console.log(`🗑️ Removed job ${jobId} from MOCK_HIRING_DATA`);
                            
                            // Reactivate job by adding back to listings data with SAME ID
                            if (!MOCK_LISTINGS_DATA) {
                                MOCK_LISTINGS_DATA = [];
                            }
                            
                            // Restore original job with preserved applications (minus the hired worker)
                            const reactivatedJob = {
                                jobId: jobToRelist.jobId, // Keep original ID - THIS IS KEY!
                                posterId: jobToRelist.posterId,
                                posterName: jobToRelist.posterName,
                                title: jobToRelist.title,
                                category: jobToRelist.category,
                                thumbnail: jobToRelist.thumbnail,
                                jobDate: jobToRelist.jobDate,
                                startTime: jobToRelist.startTime,
                                endTime: jobToRelist.endTime,
                                datePosted: new Date().toISOString(), // Update posted date to show as recent
                                status: 'active', // Reactivate the job
                                // Preserve applications but exclude the hired worker's application
                                applicationCount: Math.max(0, (jobToRelist.originalApplicationCount || 0) - 1),
                                applicationIds: (jobToRelist.originalApplicationIds || []).filter(id => id !== jobToRelist.hiredWorkerId),
                                jobPageUrl: `${jobToRelist.category}.html`,
                                // Store metadata about reactivation
                                originalApplicationCount: jobToRelist.originalApplicationCount || 0,
                                originalApplicationIds: jobToRelist.originalApplicationIds || [],
                                reactivatedAt: new Date().toISOString(),
                                reactivatedFrom: 'hiring',
                                voidedWorker: workerName,
                                voidedWorkerId: jobToRelist.hiredWorkerId,
                                relistReason: reason
                            };
                            
                            MOCK_LISTINGS_DATA.push(reactivatedJob);
                            console.log(`✅ REACTIVATED job ${jobId} - moved from hiring to listings with ${reactivatedJob.applicationCount} preserved applications (excluded hired worker: ${workerName})`);
                            
                            // Show success message
                            showContractVoidedSuccess(`Gig reactivated successfully! "${jobToRelist.title}" is now active in your Listings with preserved applications.`);
                        } else {
                            console.error(`❌ Source hiring job not found: ${jobId}`);
                            showErrorNotification('Failed to relist job - source job not found');
                        }
                    } else {
                        console.error(`❌ MOCK_HIRING_DATA not available`);
                        showErrorNotification('Failed to relist job - hiring data not available');
                    }
                }
            }
            
            // Reset processing flag and re-enable button
            overlay.dataset.processing = 'false';
            yesBtn.disabled = false;
        };
        yesBtn.addEventListener('click', yesHandler);
        registerCleanup('confirmation', 'relistYes', () => {
            yesBtn.removeEventListener('click', yesHandler);
        });
    }
    
    if (noBtn) {
        noBtn.onclick = null;
        const noHandler = function() {
            const overlay = document.getElementById('relistJobConfirmationOverlay');
            overlay.classList.remove('show');
            // Clear handlers initialization flag to allow re-initialization
            delete overlay.dataset.handlersInitialized;
        };
        noBtn.addEventListener('click', noHandler);
        registerCleanup('confirmation', 'relistNo', () => {
            noBtn.removeEventListener('click', noHandler);
        });
    }
    
    overlay.dataset.handlersInitialized = 'true';
    console.log('🔧 Relist confirmation handlers initialized');
}

function initializeResignJobConfirmationHandlers() {
    const overlay = document.getElementById('resignJobConfirmationOverlay');
    if (overlay.dataset.handlersInitialized) {
        console.log('🔧 Resign confirmation handlers already initialized, skipping');
        return;
    }
    
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
            
            // Prevent multiple executions
            if (overlay.dataset.processing === 'true') {
                console.log('⚠️ Resignation already in progress, ignoring duplicate call');
                return;
            }
            overlay.dataset.processing = 'true';
            
            // Disable the button to prevent rapid clicking
            yesBtn.disabled = true;
            
            const jobId = overlay.getAttribute('data-job-id');
            const jobTitle = overlay.getAttribute('data-job-title');
            const customerName = overlay.getAttribute('data-customer-name');
            const reason = reasonInput ? reasonInput.value.trim() : '';
            
            // Validate reason input
            if (!reason || reason.length < 2) {
                reasonError.classList.add('show');
                overlay.dataset.processing = 'false'; // Reset processing flag
                yesBtn.disabled = false; // Re-enable button
                return;
            }
            
            // Hide confirmation overlay
            overlay.classList.remove('show');
            
            // Clear handlers initialization flag to allow re-initialization
            delete overlay.dataset.handlersInitialized;
            
            // Show loading animation
            showLoadingOverlay('Resigning from job...');
            
            // ═══════════════════════════════════════════════════════════════
            // FIREBASE MODE - Worker resignation
            // ═══════════════════════════════════════════════════════════════
            const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
            
            if (useFirebase && typeof firebase !== 'undefined') {
                try {
                    const db = firebase.firestore();
                    const currentUser = firebase.auth().currentUser;
                    const currentUserId = currentUser ? currentUser.uid : '';
                    
                    console.log('🔥 Processing resignation in Firebase...');
                    console.log('📋 Job ID:', jobId);
                    console.log('📋 Worker ID:', currentUserId);
                    
                    // Get job data to find customer ID
                    const jobDoc = await db.collection('jobs').doc(jobId).get();
                    const jobData = jobDoc.data();
                    const customerId = jobData.posterId;
                    
                    // Update job: remove hired worker info, set status back to active
                    await db.collection('jobs').doc(jobId).update({
                        status: 'active',
                        hiredWorkerId: firebase.firestore.FieldValue.delete(),
                        hiredWorkerName: firebase.firestore.FieldValue.delete(),
                        hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
                        agreedPrice: firebase.firestore.FieldValue.delete(),
                        hiredAt: firebase.firestore.FieldValue.delete(),
                        acceptedAt: firebase.firestore.FieldValue.delete(),
                        resignedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        resignReason: reason,
                        resignedWorkerId: currentUserId,
                        resignedWorkerName: currentUser?.displayName || 'Worker',
                        applicationCount: 0,
                        lastModified: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('✅ Job resigned in Firebase, restored to active status');

                    // Track worker quit and customer worker-quit activity.
                    try {
                        if (currentUserId) {
                            await db.collection('users').doc(currentUserId).update({
                                'statistics.worker.totalGigsResigned': firebase.firestore.FieldValue.increment(1)
                            });
                        }
                        if (customerId) {
                            await db.collection('users').doc(customerId).update({
                                'statistics.customer.totalWorkersQuit': firebase.firestore.FieldValue.increment(1)
                            });
                        }
                        console.log('✅ Resignation activity statistics updated');
                    } catch (statsError) {
                        console.warn('⚠️ Could not update resignation activity statistics:', statsError);
                    }
                    
                    // Verify the update
                    const verifyDoc = await db.collection('jobs').doc(jobId).get();
                    console.log('🔍 Verification - Job status after resignation:', verifyDoc.data().status);
                    
                    // Update worker's application status to 'resigned'
                    if (currentUserId) {
                        try {
                            const applicationsSnapshot = await db.collection('applications')
                                .where('jobId', '==', jobId)
                                .where('applicantId', '==', currentUserId)
                                .where('status', '==', 'accepted')
                                .get();
                            
                            const batch = db.batch();
                            applicationsSnapshot.docs.forEach(doc => {
                                batch.update(doc.ref, {
                                    status: 'resigned',
                                    resignedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                    resignReason: reason
                                });
                            });
                            await batch.commit();
                            console.log('✅ Worker application marked as resigned');
                        } catch (appError) {
                            console.error('⚠️ Error updating application:', appError);
                        }
                    }
                    
                    // ═══════════════════════════════════════════════════════════════
                    // SEND NOTIFICATION TO CUSTOMER (Uses existing ALERTS tab)
                    // ═══════════════════════════════════════════════════════════════
                    try {
                        if (typeof sendWorkerResignedNotification === 'function') {
                            const workerName = currentUser?.displayName || 'A worker';
                            await sendWorkerResignedNotification(
                                customerId,
                                customerName,
                                jobId,
                                jobTitle,
                                reason,
                                workerName
                            );
                            console.log('✅ Worker resignation notification sent to customer');
                        }
                    } catch (notifError) {
                        console.error('⚠️ Error sending resignation notification:', notifError);
                    }
                    
                } catch (error) {
                    console.error('❌ Error processing resignation in Firebase:', error);
                    hideLoadingOverlay();
                    showErrorNotification('Failed to process resignation. Please try again.');
                    return;
                } finally {
                    // Reset processing flag after operation completes (success or error)
                    overlay.dataset.processing = 'false';
                    yesBtn.disabled = false;
                }
            }
            
            // Hide loading animation
            hideLoadingOverlay();
            
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
            const overlay = document.getElementById('resignJobConfirmationOverlay');
            overlay.classList.remove('show');
            // Clear handlers initialization flag to allow re-initialization
            delete overlay.dataset.handlersInitialized;
        };
        noBtn.addEventListener('click', noHandler);
        registerCleanup('confirmation', 'resignNo', () => {
            noBtn.removeEventListener('click', noHandler);
        });
    }
    
    overlay.dataset.handlersInitialized = 'true';
    console.log('🔧 Resign confirmation handlers initialized');
}

function showJobCompletedSuccess(jobTitle, workerName) {
    const overlay = document.getElementById('jobCompletedSuccessOverlay');
    const message = document.getElementById('jobCompletedMessage');
    const workerNameSpan = document.getElementById('completedWorkerName');
    const submitBtn = document.getElementById('jobCompletedOkBtn');
    
    message.textContent = `"${jobTitle}" has been marked as completed successfully!`;
    workerNameSpan.textContent = workerName;
    
    // Initialize feedback systems ONLY if not already initialized (prevent memory leaks)
    if (!overlay.dataset.feedbackHandlersInitialized) {
        initializeFeedbackStarRating();
        initializeFeedbackCharacterCount();
        overlay.dataset.feedbackHandlersInitialized = 'true';
    } else {
        // Just reset the form if already initialized
        resetFeedbackForm();
    }
    
    // Clear any existing handler and add new one with cleanup
    submitBtn.onclick = null;
    const submitHandler = async function() {
        // Get feedback data
        const rating = getFeedbackRating();
        const feedbackText = document.getElementById('completionFeedback').value.trim();
        
        // Get job and user data for Firebase integration
        const jobId = overlay.getAttribute('data-completed-job-id');
        // CRITICAL: Job was just marked as 'completed', so query completed jobs, not hired jobs!
        const completedJobs = await JobsDataService.getCompletedJobs();
        const job = completedJobs.find(j => j.jobId === jobId);
        
        // Validate required fields
        if (rating === 0) {
            showErrorNotification('Please select a star rating before submitting');
            return;
        }
        
        if (feedbackText.length < 2) {
            showErrorNotification('Please provide feedback with at least 2 characters');
            return;
        }
        if (hasUnsupportedTextChars(feedbackText)) {
            showErrorNotification('Feedback has unsupported symbols');
            return;
        }
        
        if (job) {
            // Submit feedback to Firebase
            try {
                showLoadingOverlay('Submitting feedback...');
                
                // Get actual Firebase auth UID (not mock ID)
                const currentUserId = firebase.auth().currentUser.uid;
                
                const result = await submitJobCompletionFeedback(
                    jobId,
                    job.hiredWorkerId || 'worker-user-id',
                    currentUserId,  // Use real Firebase UID, not mock CURRENT_USER_ID
                    rating,
                    feedbackText
                );
                
                hideLoadingOverlay();
                console.log(`✅ Feedback submitted successfully:`, result);
            } catch (error) {
                hideLoadingOverlay();
                console.error('❌ Error submitting feedback:', error);
                
                // Close the congratulations overlay so user can see the error
                overlay.classList.remove('show');
                
                // Clear any pending scroll timeouts
                if (window._feedbackScrollTimeouts) {
                    window._feedbackScrollTimeouts.forEach(clearTimeout);
                    window._feedbackScrollTimeouts = [];
                }
                
                // Execute cleanup for feedback handlers
                executeCleanupsByType('success');
                
                // Clear initialization flag
                delete overlay.dataset.feedbackHandlersInitialized;
                
                showErrorNotification('Failed to submit feedback: ' + error.message);
                return; // Don't proceed with UI updates if submission failed
            }
        }
        
        overlay.classList.remove('show');
        
        // Clear any pending scroll timeouts to prevent memory leaks
        if (window._feedbackScrollTimeouts) {
            window._feedbackScrollTimeouts.forEach(clearTimeout);
            window._feedbackScrollTimeouts = [];
        }
        
        // Execute cleanup for feedback handlers
        executeCleanupsByType('success');
        console.log('🧹 Feedback handlers cleaned up after submission');
        
        // Clear initialization flag so modal can be re-initialized on next open
        delete overlay.dataset.feedbackHandlersInitialized;
        
        // Find and slide out the card first
        const completedJobId = overlay.getAttribute('data-completed-job-id');
        const cardToRemove = document.querySelector(`[data-job-id="${completedJobId}"]`);
        
        // Slide out card and show toast
        await slideOutCard(cardToRemove, 'right');
        showSuccessNotification('Gig completed and feedback submitted');
        
        // Remove completed job from hiring data and transfer to completed data
        // ONLY manipulate mock data if NOT in Firebase mode
        const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
        if (!useFirebase && completedJobId && MOCK_HIRING_DATA) {
            const completedJob = MOCK_HIRING_DATA.find(job => job.jobId === completedJobId);
            if (completedJob) {
                // Add to completed jobs data
                await addJobToCompletedData(completedJob, rating, feedbackText);
                
                // Remove from hiring data
                MOCK_HIRING_DATA = MOCK_HIRING_DATA.filter(job => job.jobId !== completedJobId);
                console.log(`✅ Transferred completed job ${completedJobId} from Hiring to Previous tab`);
            }
        } else if (useFirebase) {
            console.log(`🔥 Firebase mode: Skipping mock data manipulation, will refresh from Firestore`);
        }
        
        // Reset feedback form for next use
        resetFeedbackForm();
        
        // In Firebase mode, add a small delay to ensure writes propagate before refresh
        if (useFirebase) {
            console.log('🔥 Waiting for Firebase propagation before refresh...');
            await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }
        
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
        
        // Create handlers with proper cleanup
        const mouseEnterHandler = () => {
            highlightStars(rating, stars);
        };
        
        const clickHandler = () => {
            currentRating = rating;
            selectStars(rating, stars);
            updateJobCompletionSubmitButtonState();
        };
        
        star.addEventListener('mouseenter', mouseEnterHandler);
        star.addEventListener('click', clickHandler);
        
        // Register cleanup for each star
        registerCleanup('success', `feedbackStar_${index}`, () => {
            star.removeEventListener('mouseenter', mouseEnterHandler);
            star.removeEventListener('click', clickHandler);
        });
    });
    
    // Reset to current rating when mouse leaves container
    const starsContainer = document.querySelector('.feedback-stars-container');
    const containerLeaveHandler = () => {
        if (currentRating > 0) {
            selectStars(currentRating, stars);
        } else {
            clearStars(stars);
        }
    };
    
    starsContainer.addEventListener('mouseleave', containerLeaveHandler);
    
    // Register cleanup for container
    registerCleanup('success', 'feedbackStarsContainer', () => {
        starsContainer.removeEventListener('mouseleave', containerLeaveHandler);
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
    console.log('📝 Submitting job completion feedback:', { jobId, workerUserId, customerUserId, rating });
    
    const db = firebase.firestore();
    const batch = db.batch();
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    
    // 1. Create review record in reviews collection
    const reviewRef = db.collection('reviews').doc();
    batch.set(reviewRef, {
        reviewId: reviewRef.id,
        jobId: jobId,
        reviewerUserId: customerUserId,        // Customer leaving review
        revieweeUserId: workerUserId,          // Worker being reviewed
        reviewerRole: 'customer',
        revieweeRole: 'worker',
        rating: rating,                        // 1-5 stars
        feedbackText: feedbackText,            // Text feedback
        createdAt: timestamp,
        modifiedAt: timestamp,
        status: 'active',
        helpful: 0,                            // For future voting system
        reported: false
    });
    
    console.log('✅ Review document prepared:', reviewRef.id);
    
    // 2. Update worker's aggregate rating in users collection
    const workerRef = db.collection('users').doc(workerUserId);
    const workerDoc = await workerRef.get();
    
    if (workerDoc.exists) {
        const workerData = workerDoc.data();
        const currentRating = workerData.averageRating || 0;
        const currentCount = workerData.totalReviews || 0;
        
        // Calculate new average rating
        const newTotalRating = (currentRating * currentCount) + rating;
        const newCount = currentCount + 1;
        const newAverageRating = parseFloat((newTotalRating / newCount).toFixed(2));
        
        console.log('📊 Updating worker rating:', { 
            current: currentRating, 
            count: currentCount, 
            new: newAverageRating, 
            newCount 
        });
        
        batch.set(workerRef, {
            averageRating: newAverageRating,
            totalReviews: newCount,
            lastReviewAt: timestamp
        }, { merge: true });
    } else {
        // First review for this worker
        console.log('⭐ First review for worker:', workerUserId);
        batch.set(workerRef, {
            averageRating: rating,
            totalReviews: 1,
            lastReviewAt: timestamp
        }, { merge: true });
    }
    
    // 3. Update job document with review data
    const jobRef = db.collection('jobs').doc(jobId);
    batch.set(jobRef, {
        customerFeedbackSubmitted: true,
        customerFeedbackAt: timestamp,
        customerRating: rating,
        customerFeedback: feedbackText
    }, { merge: true });
    
    console.log('✅ Job review metadata prepared');
    
    // 4. Create notification for worker about customer feedback
    try {
      if (typeof createNotification === 'function') {
        const jobDoc = await jobRef.get();
        const jobData = jobDoc.data();
        const customerProfile = await getUserProfile(customerUserId);
        const customerName = customerProfile?.fullName || 'Customer';
        
        await createNotification(workerUserId, {
          type: 'feedback_received',
          jobId: jobId,
          jobTitle: jobData.title || 'Completed Gig',
          message: `${customerName} left ${rating}-star feedback on "${jobData.title}". Don't forget to leave your feedback in Gigs Manager > Completed tab.`,
          actionRequired: false
        });
        console.log('✅ Feedback notification sent to worker');
      }
    } catch (notifError) {
      console.error('❌ Error creating feedback notification:', notifError);
      // Don't fail the feedback submission if notification fails
    }
    
    // Commit all operations atomically
    await batch.commit();
    console.log('✅ Review batch committed successfully');
    
    return {
        success: true,
        reviewId: reviewRef.id,
        newWorkerRating: workerDoc.exists ? 
            parseFloat(((workerDoc.data().averageRating || 0) * (workerDoc.data().totalReviews || 0) + rating) / ((workerDoc.data().totalReviews || 0) + 1).toFixed(2)) : 
            rating,
        newWorkerReviewCount: workerDoc.exists ? (workerDoc.data().totalReviews || 0) + 1 : 1
    };
}

// Initialize character counting for feedback text
function initializeFeedbackCharacterCount() {
    const textarea = document.getElementById('completionFeedback');
    const charCount = document.getElementById('feedbackCharCount');
    const submitBtn = document.getElementById('jobCompletedOkBtn');
    
    if (textarea && charCount) {
        blockUnsupportedCharsForInput(textarea);
        // Add input event listener with validation
        const updateHandler = function() {
            updateFeedbackCharCount();
            updateJobCompletionSubmitButtonState();
        };
        textarea.addEventListener('input', updateHandler);
        
        // Add mobile-specific event handlers to prevent zoom
        textarea.addEventListener('focus', handleFeedbackTextareaFocus);
        textarea.addEventListener('blur', handleFeedbackTextareaBlur);
        
        // Register cleanup for all textarea handlers
        registerCleanup('success', 'feedbackTextarea', () => {
            textarea.removeEventListener('input', updateHandler);
            textarea.removeEventListener('focus', handleFeedbackTextareaFocus);
            textarea.removeEventListener('blur', handleFeedbackTextareaBlur);
        });
        
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
        // Track timeout for cleanup to prevent memory leaks
        const timeoutId = setTimeout(() => {
            // Only scroll if overlay is still shown
            if (overlay.classList.contains('show')) {
                textarea.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }, 300);
        
        // Store timeout ID for potential cleanup
        if (!window._feedbackScrollTimeouts) window._feedbackScrollTimeouts = [];
        window._feedbackScrollTimeouts.push(timeoutId);
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
    console.log('🎉 Showing contract voided success:', message);
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
        showSuccessNotification('You have resigned from this gig');
        
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
    
    message.textContent = `Contract with ${workerName} has been voided for "${jobTitle}". The gig is now active for new applications.`;
    
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
                Jobs you've hired workers for will appear here.
                Check your active listings to hire workers.
            </div>
            <button class="empty-state-btn" onclick="switchToRole('customer').then(() => switchToTab('listings'))">
                VIEW LISTINGS
            </button>
        </div>
    `;
}

// ========================== PREVIOUS TAB FUNCTIONALITY ==========================

// Note: MOCK_COMPLETED_DATA is declared globally at the top of this file

async function initializePreviousTab() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    console.log('📜 Initializing Previous tab...');
    
    // Always clean up existing handlers to prevent the bug
    executeCleanupsByType('previous-cards');
    executeCleanupsByType('previous-overlay');
    executeCleanupsByType('previous-feedback-overlay');
    
    // Always reload fresh content from Firebase
    await loadPreviousContent();
}

async function loadPreviousContent() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    const renderToken = beginTabRender('previous');
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner">🔄</div>
            <div class="loading-text">Loading completed jobs...</div>
        </div>
    `;
    
    try {
        // Get all completed jobs and filter for customer perspective only (where current user was the customer)
        const allCompletedJobs = await JobsDataService.getCompletedJobs();
        if (!shouldApplyTabRender('previous', renderToken)) return;
        const customerCompletedJobs = allCompletedJobs.filter(job => job.role === 'customer');
        
        console.log(`📜 Found ${customerCompletedJobs.length} customer perspective completed jobs (filtered from ${allCompletedJobs.length} total)`);
        
        if (customerCompletedJobs.length === 0) {
            if (shouldApplyTabRender('previous', renderToken)) showEmptyPreviousState();
        } else {
            await generateMockCompletedJobs(customerCompletedJobs);
            if (!shouldApplyTabRender('previous', renderToken)) return;
            initializeCompletedCardHandlers();
            checkTruncatedFeedback();
            
            // Create overlay immediately for testing
            createFeedbackExpandedOverlay();
        }
        
        console.log(`📜 Previous tab loaded with ${customerCompletedJobs.length} customer completed jobs`);
        
    } catch (error) {
        console.error('❌ Error loading previous jobs:', error);
    if (!shouldApplyTabRender('previous', renderToken)) return;
    container.innerHTML = `
        <div class="content-placeholder">
                ❌ Error loading completed jobs.<br>
                Please try again later.
        </div>
    `;
    }
}

// ===== GLOBAL FUNCTION FOR CROSS-FILE ACCESS =====
window.getCompletedJobs = async function() {
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
            title: 'Complete Bathroom Renovation with Plumbing & Tile Work',
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
            title: 'Complete Interior & Exterior House Painting with Primer',
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
    const safeCompletedWorkerName = job.hiredWorkerName || 'Worker';
    const safeCompletedPosterName = job.posterName || 'Customer';
    if (job.role === 'customer') {
        // Customer perspective: I hired someone and completed the job
        roleCaption = `YOU HIRED ${safeCompletedWorkerName.toUpperCase()}`;
        userThumbnail = job.hiredWorkerThumbnail;
        userName = safeCompletedWorkerName;
        userLabel = 'WORKER';
    } else {
        // Worker perspective: I worked for someone who completed the job
        roleCaption = `WORKED FOR ${safeCompletedPosterName.toUpperCase()}`;
        userThumbnail = job.posterThumbnail;
        userName = safeCompletedPosterName;
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
    const safeRoleClass = escapeHtml(roleClass || '');
    const safeJobId = escapeHtml(job.jobId || '');
    const safePosterId = escapeHtml(job.posterId || '');
    const safeCategory = escapeHtml(job.category || '');
    const safeRole = escapeHtml(job.role || '');
    const safeHiredWorkerId = escapeHtml(job.hiredWorkerId || '');
    const safeHiredWorkerName = escapeHtml(job.hiredWorkerName || '');
    const safePosterName = escapeHtml(job.posterName || '');
    const safeHasWorkerFeedback = escapeHtml(job.role === 'worker' && job.workerFeedback ? 'true' : 'false');
    const safeTitle = escapeHtml(job.title || 'Untitled Job');
    const safeJobDate = escapeHtml(formatJobDate(job.jobDate));
    const safeStartTime = escapeHtml(formatTime(job.startTime));
    const safeEndTime = escapeHtml(formatTime(job.endTime));
    const safeThumbnail = escapeHtml(sanitizeUrl(job.thumbnail, 'public/images/placeholder.jpg'));
    const safeRoleCaption = escapeHtml(roleCaption);
    const safeCompletedDate = escapeHtml(formatCompletedDate(job.completedAt));
    const safeRatingCount = escapeHtml(ratingCount);
    const safePriceOffer = escapeHtml(typeof job.priceOffer === 'number' ? '₱' + job.priceOffer : ((job.priceOffer || '').startsWith('₱') ? job.priceOffer : '₱' + (job.priceOffer || 0)));
    const safeUserThumbnail = escapeHtml(sanitizeUrl(userThumbnail, 'public/users/default-user.jpg'));
    const safeUserName = escapeHtml(userName || 'User');
    const safeUserLabel = escapeHtml(userLabel);
    
    // Generate feedback section
    let feedbackHTML = '';
    if (job.role === 'customer') {
        if (job.feedback) {
            // Customer perspective: Show feedback left for worker
            feedbackHTML = `
                <div class="completed-feedback-section">
                    <div class="completed-feedback-label">Your Feedback</div>
                    <div class="completed-feedback-text">${escapeHtml(job.feedback)}</div>
                </div>
            `;
        } else {
            // Customer perspective: Show instructions to leave feedback (if not yet submitted)
            feedbackHTML = `
                <div class="completed-feedback-section customer-instructions">
                    <div class="completed-feedback-label">LEAVE FEEDBACK</div>
                    <div class="completed-feedback-instructions">For ${escapeHtml(job.hiredWorkerName || '')}</div>
                </div>
            `;
        }
    } else if (job.role === 'worker') {
        if (job.workerFeedback) {
            // Worker perspective: Show feedback left for customer
            feedbackHTML = `
                <div class="completed-feedback-section">
                    <div class="completed-feedback-label">Your Feedback</div>
                    <div class="completed-feedback-text">${escapeHtml(job.workerFeedback)}</div>
                </div>
            `;
        } else {
            // Worker perspective: Show instructions to leave feedback
            feedbackHTML = `
                <div class="completed-feedback-section worker-instructions">
                    <div class="completed-feedback-label">LEAVE FEEDBACK</div>
                    <div class="completed-feedback-instructions">For ${escapeHtml(job.posterName || '')}</div>
                </div>
            `;
        }
    }
    
    return `
        <div class="completed-card ${safeRoleClass}" 
             data-job-id="${safeJobId}"
             data-poster-id="${safePosterId}"
             data-category="${safeCategory}"
             data-role="${safeRole}"
             data-hired-worker-id="${safeHiredWorkerId}"
             data-hired-worker-name="${safeHiredWorkerName}"
             data-poster-name="${safePosterName}"
             data-has-worker-feedback="${safeHasWorkerFeedback}">
            
            <div class="completed-title">${safeTitle}</div>
            
            <div class="completed-date-time-row">
                <div class="completed-date-part">
                    <span class="completed-date-label">DATE:</span>
                    <span class="completed-date-value">${safeJobDate}</span>
                </div>
                <div class="completed-time-part">
                    <span class="completed-time-label">FROM:</span>
                    <span class="completed-time-value">${safeStartTime}</span>
                    <span class="completed-time-label">TO:</span>
                    <span class="completed-time-value">${safeEndTime}</span>
                </div>
            </div>
            
            <div class="completed-main-row">
                <div class="completed-thumbnail">
                    <img src="${safeThumbnail}" alt="${safeTitle}" loading="lazy">
                    <div class="completed-overlay-badge">COMPLETED</div>
                </div>
                
                <div class="completed-content">
                    <div class="completed-upper-row">
                        <div class="completed-left-content">
                            <div class="completed-role-caption ${safeRoleClass}">${safeRoleCaption}</div>
                            
                            <div class="completed-info-section">
                                <div class="completed-on-date">Completed ${safeCompletedDate}</div>
                            </div>
                            
                            <div class="completed-rating-section">
                                <div class="completed-rating-label">Rating</div>
                                <div class="completed-rating-stars">
                                    ${starsHTML}
                                    <span class="completed-rating-count">${safeRatingCount}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="completed-right-content">
                            <div class="completed-price">${safePriceOffer}</div>
                            <div class="completed-user-thumbnail">
                                <img src="${safeUserThumbnail}" alt="${safeUserName}" loading="lazy">
                            </div>
                            <div class="completed-user-label">${safeUserLabel}</div>
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
    // Handle undefined or null values
    if (!timeString) {
        return 'TBD';
    }
    // Remove :00 from times like "8:00 AM" -> "8 AM" and "12:00 PM" -> "12 PM"
    return timeString.replace(':00', '');
}

function formatPriceWithPeso(price) {
    // Handle undefined, null, or empty values
    if (!price && price !== 0) {
        return null;
    }
    
    // If it's already formatted with peso symbol, return as is
    if (typeof price === 'string' && price.includes('₱')) {
        return price;
    }
    
    // If it's a number, format it with peso symbol
    if (typeof price === 'number') {
        return `₱${price}`;
    }
    
    // If it's a string number, format it
    if (typeof price === 'string' && !isNaN(price)) {
        return `₱${price}`;
    }
    
    // Fallback: return as is
    return price;
}

function formatCompletedDate(timestamp) {
    // Handle Firebase timestamp object
    let date;
    if (timestamp && timestamp.seconds) {
        // Firebase Timestamp object
        date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
        // Already a Date object
        date = timestamp;
    } else if (typeof timestamp === 'string') {
        // String date
        date = new Date(timestamp);
    } else {
        // Invalid input
        return 'Invalid Date';
    }
    
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

// ===== ENHANCED COMPLETED CARD HANDLERS - MEMORY LEAK PREVENTION =====
function initializeCompletedCardHandlers() {
    const completedCards = document.querySelectorAll('.completed-card');
    
    // Clean up existing handlers first to prevent memory leaks
    executeCleanupsByType('previous-cards');
    
    // Safety check: prevent multiple simultaneous initializations
    if (window.previousCardsInitializing) {
        console.log('⚠️ Previous card handlers already being initialized, skipping...');
        return;
    }
    window.previousCardsInitializing = true;
    
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
                const isInstructionBox = feedbackSection.classList.contains('worker-instructions') 
                                      || feedbackSection.classList.contains('customer-instructions');
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
            
            // Mark handler for cleanup tracking
            feedbackClickHandler._type = 'previous-cards';
            feedbackClickHandler._key = `feedback-section-${index}`;
            
            feedbackSection.addEventListener('click', feedbackClickHandler);
            
            // Also add handler to feedback text specifically
            const feedbackText = feedbackSection.querySelector('.completed-feedback-text');
            if (feedbackText) {
                const feedbackTextClickHandler = function(e) {
                    feedbackClickHandler(e); // Reuse same logic
                };
                feedbackTextClickHandler._type = 'previous-cards';
                feedbackTextClickHandler._key = `feedback-text-${index}`;
                
                feedbackText.addEventListener('click', feedbackTextClickHandler);
                
                // Register for cleanup
                if (!CLEANUP_REGISTRY.elementListeners.has(feedbackText)) {
                    CLEANUP_REGISTRY.elementListeners.set(feedbackText, []);
                }
                CLEANUP_REGISTRY.elementListeners.get(feedbackText).push(['click', feedbackTextClickHandler]);
                
                console.log(`📝 Added click handler to feedback text in card ${index}`);
            }
            
            // Register for cleanup
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
        
        // Mark handler for cleanup tracking
        cardClickHandler._type = 'previous-cards';
        cardClickHandler._key = `card-${index}`;
        
        card.addEventListener('click', cardClickHandler);
        
        // Register for cleanup
        if (!CLEANUP_REGISTRY.elementListeners.has(card)) {
            CLEANUP_REGISTRY.elementListeners.set(card, []);
        }
        CLEANUP_REGISTRY.elementListeners.get(card).push(['click', cardClickHandler]);
        
        // Register cleanup function for this specific card
        registerCleanup('previous-cards', `card-${index}`, () => {
            card.removeEventListener('click', cardClickHandler);
            if (feedbackSection) {
                const feedbackHandler = CLEANUP_REGISTRY.elementListeners.get(feedbackSection)?.[0]?.[1];
                if (feedbackHandler) {
                    feedbackSection.removeEventListener('click', feedbackHandler);
                }
            }
        });
    });
    
    // Mark initialization as complete
    window.previousCardsInitializing = false;
    
    console.log(`🔧 Initialized ${completedCards.length} completed card handlers with memory leak prevention`);
}

// ===== FIREBASE-READY DATA EXTRACTION - CONSISTENT WITH OTHER TABS =====
function extractCompletedJobDataFromCard(cardElement) {
    // Extract data attributes (Firebase document fields)
    const jobData = {
        // Core job identification - CONSISTENT WITH FIREBASE SCHEMA
        jobId: cardElement.getAttribute('data-job-id'),
        posterId: cardElement.getAttribute('data-poster-id'),
        posterName: cardElement.getAttribute('data-poster-name'),
        posterThumbnail: cardElement.getAttribute('data-poster-thumbnail'),
        
        // Job details - CONSISTENT WITH OTHER TABS
        title: cardElement.querySelector('.completed-title')?.textContent || 'Unknown Job',
        category: cardElement.getAttribute('data-category'),
        thumbnail: cardElement.getAttribute('data-thumbnail'),
        
        // Scheduling data - FIREBASE TIMESTAMP READY
        scheduledDate: cardElement.getAttribute('data-scheduled-date'), // YYYY-MM-DD format
        startTime: cardElement.getAttribute('data-start-time'),
        endTime: cardElement.getAttribute('data-end-time'),
        
        // Financial data - CONSISTENT FORMAT
        priceOffer: cardElement.getAttribute('data-price-offer'),
        
        // Completion data - FIREBASE TIMESTAMPS
        completedAt: cardElement.getAttribute('data-completed-at'), // ISO string
        completedBy: cardElement.getAttribute('data-completed-by'), // 'customer' | 'worker'
        
        // Role determination - CONSISTENT LOGIC
        role: cardElement.getAttribute('data-role'), // 'customer' | 'worker'
        
        // Hiring information - CONSISTENT WITH HIRING TAB
        hiredWorkerId: cardElement.getAttribute('data-hired-worker-id'),
        hiredWorkerName: cardElement.getAttribute('data-hired-worker-name'),
        hiredWorkerThumbnail: cardElement.getAttribute('data-hired-worker-thumbnail'),
        
        // Rating and feedback data - FIREBASE SUBCOLLECTION READY
        rating: parseInt(cardElement.getAttribute('data-rating')) || 0,
        feedback: cardElement.getAttribute('data-feedback'),
        workerFeedback: cardElement.getAttribute('data-worker-feedback'),
        workerRating: parseInt(cardElement.getAttribute('data-worker-rating')) || 0,
        hasWorkerFeedback: cardElement.getAttribute('data-has-worker-feedback') === 'true',
        
        // Status tracking - CONSISTENT WITH OTHER TABS
        status: cardElement.getAttribute('data-status') || 'completed',
        datePosted: cardElement.getAttribute('data-date-posted'), // ISO string
        
        // Firebase metadata - PREPARED FOR BACKEND
        lastModified: cardElement.getAttribute('data-last-modified'),
        modifiedBy: cardElement.getAttribute('data-modified-by')
    };
    
    // Validate critical fields
    if (!jobData.jobId) {
        console.error('❌ Missing jobId in completed card data extraction');
    }
    if (!jobData.role) {
        console.error('❌ Missing role in completed card data extraction');
    }
    
    return jobData;
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
    
    // Close handler with proper cleanup
    const closeHandler = function() {
        overlay.classList.remove('show');
        // Clean up handlers
        closeBtn.removeEventListener('click', closeHandler);
        overlay.removeEventListener('click', backgroundHandler);
        document.removeEventListener('keydown', escapeHandler);
        console.log('🧹 Feedback expanded overlay closed and cleaned up');
    };
    closeBtn.addEventListener('click', closeHandler);
    
    // Background close handler
    const backgroundHandler = function(e) {
        if (e.target === overlay) {
            closeHandler(); // Use main close handler for consistent cleanup
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    
    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape') {
            closeHandler(); // Use main close handler for consistent cleanup
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Register cleanup for this overlay instance
    registerCleanup('previous-feedback-overlay', 'expanded-overlay', () => {
        overlay.classList.remove('show');
        closeBtn.removeEventListener('click', closeHandler);
        overlay.removeEventListener('click', backgroundHandler);
        document.removeEventListener('keydown', escapeHandler);
    });
    
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
    
    // Set overlay data attributes - ALL FIELDS FOR FIREBASE OPERATIONS
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-poster-id', jobData.posterId || '');
    overlay.setAttribute('data-poster-name', jobData.posterName || '');
    overlay.setAttribute('data-poster-thumbnail', jobData.posterThumbnail || '');
    overlay.setAttribute('data-role', jobData.role);
    overlay.setAttribute('data-title', jobData.title);
    overlay.setAttribute('data-category', jobData.category || ''); // CRITICAL FIX: Add missing category
    overlay.setAttribute('data-thumbnail', jobData.thumbnail || '');
    overlay.setAttribute('data-scheduled-date', jobData.scheduledDate || jobData.jobDate || '');
    overlay.setAttribute('data-start-time', jobData.startTime || '');
    overlay.setAttribute('data-end-time', jobData.endTime || '');
    overlay.setAttribute('data-price-offer', jobData.priceOffer || '');
    overlay.setAttribute('data-completed-at', jobData.completedAt || '');
    overlay.setAttribute('data-completed-by', jobData.completedBy || '');
    overlay.setAttribute('data-hired-worker-id', jobData.hiredWorkerId || '');
    overlay.setAttribute('data-hired-worker-name', jobData.hiredWorkerName || '');
    overlay.setAttribute('data-hired-worker-thumbnail', jobData.hiredWorkerThumbnail || '');
    overlay.setAttribute('data-rating', jobData.rating || '0');
    overlay.setAttribute('data-feedback', jobData.feedback || '');
    overlay.setAttribute('data-worker-feedback', jobData.workerFeedback || '');
    overlay.setAttribute('data-worker-rating', jobData.workerRating || '0');
    overlay.setAttribute('data-has-worker-feedback', jobData.hasWorkerFeedback);
    overlay.setAttribute('data-status', jobData.status || 'completed');
    overlay.setAttribute('data-date-posted', jobData.datePosted || '');
    overlay.setAttribute('data-last-modified', jobData.lastModified || '');
    overlay.setAttribute('data-modified-by', jobData.modifiedBy || '');
    
    // Update title and subtitle
    title.textContent = 'Completed Gig Options';
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
            <div class="empty-state-title">No Completed Gigs Yet</div>
            <div class="empty-state-message">
                Completed gigs will appear here once you finish working on hired gigs.
                You can relist completed gigs or leave feedback for customers.
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

    // Determine cleanup type based on current role and tab context (same logic as hiring overlay)
    const currentRole = document.querySelector('.role-tab-btn.active')?.getAttribute('data-role');
    const currentWorkerTab = document.querySelector('.worker-tabs .tab-btn.active')?.getAttribute('data-tab');
    const cleanupType = (currentRole === 'worker' && currentWorkerTab === 'worker-completed') ? 'worker-completed-overlay' : 'previous';
    
    // CRITICAL FIX: Store the cleanup type in overlay dataset to prevent mismatch during role switches
    overlay.dataset.registeredCleanupType = cleanupType;
    
    console.log(`🔧 Initializing previous overlay handlers with cleanup type: ${cleanupType}`);

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
        registerCleanup(cleanupType, 'relistBtn', () => {
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
        registerCleanup(cleanupType, 'feedbackBtn', () => {
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
        registerCleanup(cleanupType, 'disputeBtn', () => {
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
        registerCleanup(cleanupType, 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }

    // Background click handler
    const backgroundHandler = function(e) {
        
        // Close if clicking on overlay background
        if (e.target === overlay) {
            hidePreviousOptionsOverlay();
            return;
        }
        
        // CRITICAL FIX: Also close if clicking on cancel button (since button handler isn't firing)
        if (e.target && e.target.id === 'cancelPreviousBtn') {
            hidePreviousOptionsOverlay();
            return;
        }
    };
    overlay.addEventListener('click', backgroundHandler);
    registerCleanup(cleanupType, 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });

    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hidePreviousOptionsOverlay();
        }
    };
    const escapeListenerKey = addDocumentListener('keydown', escapeHandler);
    registerCleanup(cleanupType, 'previousOverlayEscape', () => {
        removeDocumentListener(escapeListenerKey);
    });

    overlay.dataset.handlersInitialized = 'true';
    console.log('🔧 Previous overlay handlers initialized');
}

// ===== FIREBASE-READY DATA EXTRACTION FROM OVERLAY =====
function getPreviousJobDataFromOverlay() {
    const overlay = document.getElementById('previousOptionsOverlay');
    
    // Extract comprehensive data for Firebase operations
    const jobData = {
        // Core job identification - FIREBASE DOCUMENT ID
        jobId: overlay.getAttribute('data-job-id'),
        posterId: overlay.getAttribute('data-poster-id'),
        posterName: overlay.getAttribute('data-poster-name'),
        posterThumbnail: overlay.getAttribute('data-poster-thumbnail'),
        
        // Job details - CONSISTENT WITH OTHER TABS
        title: overlay.getAttribute('data-title'),
        category: overlay.getAttribute('data-category'),
        thumbnail: overlay.getAttribute('data-thumbnail'),
        
        // Scheduling data - FIREBASE TIMESTAMP READY
        scheduledDate: overlay.getAttribute('data-scheduled-date'),
        startTime: overlay.getAttribute('data-start-time'),
        endTime: overlay.getAttribute('data-end-time'),
        
        // Financial data
        priceOffer: overlay.getAttribute('data-price-offer'),
        
        // Completion data - FIREBASE TIMESTAMPS
        completedAt: overlay.getAttribute('data-completed-at'),
        completedBy: overlay.getAttribute('data-completed-by'),
        
        // Role determination - CONSISTENT LOGIC
        role: overlay.getAttribute('data-role'), // 'customer' | 'worker'
        
        // Hiring information - CONSISTENT WITH HIRING TAB
        hiredWorkerId: overlay.getAttribute('data-hired-worker-id'),
        hiredWorkerName: overlay.getAttribute('data-hired-worker-name'),
        hiredWorkerThumbnail: overlay.getAttribute('data-hired-worker-thumbnail'),
        
        // Rating and feedback data - FIREBASE SUBCOLLECTION READY
        rating: parseInt(overlay.getAttribute('data-rating')) || 0,
        feedback: overlay.getAttribute('data-feedback'),
        workerFeedback: overlay.getAttribute('data-worker-feedback'),
        workerRating: parseInt(overlay.getAttribute('data-worker-rating')) || 0,
        hasWorkerFeedback: overlay.getAttribute('data-has-worker-feedback') === 'true',
        
        // Status tracking - CONSISTENT WITH OTHER TABS
        status: overlay.getAttribute('data-status') || 'completed',
        datePosted: overlay.getAttribute('data-date-posted'),
        
        // Firebase metadata
        lastModified: overlay.getAttribute('data-last-modified'),
        modifiedBy: overlay.getAttribute('data-modified-by')
    };
    
    // Validate critical fields for Firebase operations
    if (!jobData.jobId) {
        console.error('❌ Missing jobId in previous overlay data extraction');
    }
    if (!jobData.role) {
        console.error('❌ Missing role in previous overlay data extraction');
    }
    
    console.log('📋 Previous overlay job data extracted:', jobData);
    return jobData;
}

function hidePreviousOptionsOverlay() {
    const overlay = document.getElementById('previousOptionsOverlay');
    
    if (!overlay) {
        console.log(`❌ Previous overlay element not found!`);
        return;
    }
    
    overlay.classList.remove('show');
    
    // CRITICAL FIX: Use the stored cleanup type instead of re-detecting context
    // This prevents cleanup type mismatch when role changes between registration and cleanup
    const registeredCleanupType = overlay.dataset.registeredCleanupType;
    const fallbackCleanupType = 'previous'; // Safe fallback if no stored type
    const cleanupType = registeredCleanupType || fallbackCleanupType;
    
    
    executeCleanupsByType(cleanupType);
    
    // Clear handlers initialization flag and stored cleanup type to allow re-initialization
    delete overlay.dataset.handlersInitialized;
    delete overlay.dataset.registeredCleanupType;
    
    console.log(`🔧 Previous overlay hidden and ${cleanupType} handlers cleaned up`);
}

function handleRelistCompletedJob(jobData) {
    console.log(`🔄 RELIST completed job: ${jobData.jobId}`);
    hidePreviousOptionsOverlay();
    
    // Navigate directly to new-post2.html with relist mode
    const relistUrl = `new-post2.html?relist=${jobData.jobId}&category=${jobData.category}`;
    console.log(`📝 Navigating to relist mode: ${relistUrl}`);
    
    // Firebase data mapping for relist mode:
    // - Load completed job document: db.collection('completedJobs').doc(jobData.jobId)
    // - Create new job document with status: 'active' (not update existing)
    // - Link original job: { originalJobId: jobData.jobId, relistedAt: timestamp }
    // - Update analytics: trackJobAction('job_relisted', { originalJobId, newJobId })
    
    window.location.href = relistUrl;
}

function handleLeaveFeedback(jobData) {
    console.log(`💭 LEAVE FEEDBACK:`, jobData);
    hidePreviousOptionsOverlay();
    
    // Determine perspective based on role
    const isCustomer = jobData.role === 'customer';
    const targetPersonName = isCustomer ? jobData.hiredWorkerName : jobData.posterName;
    const targetPersonLabel = isCustomer ? 'worker' : 'customer';
    
    // Update feedback overlay content based on perspective
    if (isCustomer) {
        document.getElementById('feedbackCustomerName').textContent = `Rate your experience with ${targetPersonName}`;
        document.getElementById('feedbackCustomerNameSpan').textContent = targetPersonName;
    } else {
        document.getElementById('feedbackCustomerName').textContent = `Rate your experience working for ${targetPersonName}`;
        document.getElementById('feedbackCustomerNameSpan').textContent = targetPersonName;
    }
    
    // Store job data in the overlay for submission
    const feedbackOverlay = document.getElementById('leaveFeedbackOverlay');
    feedbackOverlay.setAttribute('data-job-id', jobData.jobId);
    feedbackOverlay.setAttribute('data-customer-name', targetPersonName);
    feedbackOverlay.setAttribute('data-role', jobData.role); // Store role for submission
    feedbackOverlay.setAttribute('data-target-user-id', isCustomer ? jobData.hiredWorkerId : jobData.posterId);
    
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

    const viewBtn = document.getElementById('viewJobBtn');
    const modifyBtn = document.getElementById('modifyJobBtn');
    const pauseBtn = document.getElementById('pauseJobBtn');
    const viewApplicationsBtn = document.getElementById('viewApplicationsBtn');
    const deleteBtn = document.getElementById('deleteJobBtn');
    const cancelBtn = document.getElementById('cancelOptionsBtn');

    // View job handler
    if (viewBtn) {
        const viewHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            handleViewJob(jobData);
        };
        viewBtn.addEventListener('click', viewHandler);
        registerCleanup('listings-overlay', 'viewBtn', () => {
            viewBtn.removeEventListener('click', viewHandler);
        });
    }

    // Modify job handler
    if (modifyBtn) {
        const modifyHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            handleModifyJob(jobData);
        };
        modifyBtn.addEventListener('click', modifyHandler);
        registerCleanup('listings-overlay', 'modifyBtn', () => {
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
        registerCleanup('listings-overlay', 'pauseBtn', () => {
            pauseBtn.removeEventListener('click', pauseHandler);
        });
    }

    // View applications handler
    if (viewApplicationsBtn) {
        const applicationsHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            showApplicationsOverlay(jobData);
        };
        viewApplicationsBtn.addEventListener('click', applicationsHandler);
        registerCleanup('listings-overlay', 'viewApplicationsBtn', () => {
            viewApplicationsBtn.removeEventListener('click', applicationsHandler);
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
        registerCleanup('listings-overlay', 'deleteBtn', () => {
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
        registerCleanup('listings-overlay', 'cancelBtn', () => {
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
    registerCleanup('listings-overlay', 'overlayBackground', () => {
        overlay.removeEventListener('click', backgroundHandler);
    });

    // Escape key handler
    const escapeHandler = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideListingOptionsOverlay();
        }
    };
    const escapeListenerKey = addDocumentListener('keydown', escapeHandler);
    registerCleanup('listings-overlay', 'overlayEscape', () => {
        removeDocumentListener(escapeListenerKey);
    });

    overlay.dataset.handlersInitialized = 'true';
    console.log('🔧 Options overlay handlers initialized');
}

function getJobDataFromOverlay() {
    const overlay = document.getElementById('listingOptionsOverlay');
    const extracted = {
        jobId: overlay.getAttribute('data-job-id'),
        posterId: overlay.getAttribute('data-poster-id'),
        category: overlay.getAttribute('data-category'),
        jobPageUrl: overlay.getAttribute('data-job-page-url'),
        currentStatus: overlay.getAttribute('data-current-status'),
        title: overlay.getAttribute('data-title'),
        price: overlay.getAttribute('data-price'),
        paymentType: overlay.getAttribute('data-payment-type')
    };
    
    console.log('🔍 DEBUG - getJobDataFromOverlay:', {
        jobId: extracted.jobId,
        price: extracted.price,
        paymentType: extracted.paymentType
    });
    
    return extracted;
}

function hideListingOptionsOverlay() {
    const overlay = document.getElementById('listingOptionsOverlay');
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to allow re-initialization
    delete overlay.dataset.handlersInitialized;
    
    // Clean up ONLY the overlay handlers, NOT the card handlers
    executeCleanupsByType('listings-overlay');
    
    console.log('🔧 Options overlay hidden and handlers cleaned up');
}

// ========================== APPLICATIONS OVERLAY HANDLERS ==========================

async function showApplicationsOverlay(jobData) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📋 OPENING APPLICATIONS OVERLAY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Job ID:', jobData.jobId);
    console.log('Job Title:', jobData.title);
    console.log('Job Price (from jobData):', jobData.price);
    console.log('Payment Type (from jobData):', jobData.paymentType);
    
    // ═══════════════════════════════════════════════════════════════
    // FALLBACK: If price is missing from jobData, fetch from listing array
    // ═══════════════════════════════════════════════════════════════
    if (!jobData.price || jobData.price === '0' || jobData.price === 0) {
        console.warn('⚠️ Price missing from jobData, fetching from listings array...');
        const allListings = await JobsDataService.getAllJobs();
        const matchingListing = allListings.find(job => job.jobId === jobData.jobId);
        if (matchingListing) {
            jobData.price = matchingListing.price;
            jobData.paymentType = matchingListing.paymentType;
            console.log('✅ Fetched price from listings:', jobData.price, jobData.paymentType);
        }
    }
    
    console.log('Job Price (final):', jobData.price);
    console.log('Payment Type (final):', jobData.paymentType);
    console.log('Application Count:', jobData.applicationCount || 0);
    console.log('═══════════════════════════════════════════════════════');
    
    const overlay = document.getElementById('applicationsOverlay');
    const title = document.getElementById('applicationsTitle');
    const subtitle = document.getElementById('applicationsSubtitle');
    const applicationsList = document.getElementById('applicationsList');
    
    if (!overlay || !applicationsList) {
        console.error('Applications overlay elements not found');
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SHOW LOADING ANIMATION
    // ═══════════════════════════════════════════════════════════════
    applicationsList.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading applications...</div>
        </div>
    `;
    
    // Show overlay immediately with loading state
    overlay.classList.add('show');
    
    // Set subtitle first (we know the job title)
    subtitle.textContent = jobData.title;
    
    // Get applications for this job
    // Fetch applications (now async)
    const jobApplications = await getApplicationsForJob(jobData.jobId);
    
    // ═══════════════════════════════════════════════════════════════
    // USE ACTUAL COUNT (not stored count which might be wrong)
    // ═══════════════════════════════════════════════════════════════
    const actualCount = jobApplications ? jobApplications.length : 0;
    title.textContent = `Applications (${actualCount})`;
    
    if (jobApplications && jobApplications.length > 0) {
        // Generate applications HTML  
        const applicationsHTML = jobApplications.map(app => {
            // Ensure application has the correct jobId and pass original job price
            app.jobId = jobData.jobId;
            return generateApplicationCardHTML(app, jobData.title, jobData.price, jobData.paymentType);
        }).join('');
        
        applicationsList.innerHTML = applicationsHTML;
        
        // Initialize application card event listeners
        initializeApplicationCardHandlers();
    } else {
        // Show empty state
        applicationsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <div class="empty-state-title">No Applications Yet</div>
                <div class="empty-state-message">This job hasn't received any applications yet.</div>
            </div>
        `;
    }
    
    // Store job data for handlers
    overlay.setAttribute('data-job-id', jobData.jobId);
    overlay.setAttribute('data-job-title', jobData.title);
    
    // ═══════════════════════════════════════════════════════════════
    // UPDATE CARD'S DISPLAYED COUNT (in case Firestore count is wrong)
    // ═══════════════════════════════════════════════════════════════
    const listingCard = document.querySelector(`.listing-card[data-job-id="${jobData.jobId}"]`);
    // Always update the card count to match actual pending applications
    if (listingCard) {
        const storedCount = parseInt(listingCard.getAttribute('data-application-count')) || 0;
        if (actualCount !== storedCount) {
            console.log(`📊 Updating card count from ${storedCount} to ${actualCount}`);
            const appCountElement = listingCard.querySelector('.application-count');
            if (appCountElement) {
                const newText = actualCount === 1 ? '1 application' : `${actualCount} applications`;
                appCountElement.textContent = newText;
            }
            listingCard.setAttribute('data-application-count', actualCount);
        }
    }
    
    // Initialize close button handler
    initializeApplicationsOverlayHandlers();
}

async function getApplicationsForJob(jobId) {
    console.log('───────────────────────────────────────────────────────');
    console.log('📋 FETCHING APPLICATIONS');
    console.log('───────────────────────────────────────────────────────');
    console.log('Querying with Job ID:', jobId);
    console.log('Firebase Mode:', typeof DataService !== 'undefined' && DataService.useFirebase());
    console.log('───────────────────────────────────────────────────────');
    
    // Check if Firebase mode is active
    const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
    
    if (useFirebase && typeof getJobApplications === 'function') {
        try {
            const applications = await getJobApplications(jobId);
            console.log('✅ Firebase Query Complete:');
            console.log('   Found Applications:', applications.length);
            
            // ═══════════════════════════════════════════════════════════════
            // FILTER: Only show PENDING applications (hide rejected/accepted)
            // ═══════════════════════════════════════════════════════════════
            const pendingApplications = applications.filter(app => app.status === 'pending');
            console.log('   Pending Applications:', pendingApplications.length);
            console.log('   Filtered out:', applications.length - pendingApplications.length, 'non-pending');
            
            if (pendingApplications.length > 0) {
                console.log('   First Application:', {
                    id: pendingApplications[0].id,
                    jobId: pendingApplications[0].jobId,
                    applicantName: pendingApplications[0].applicantName,
                    status: pendingApplications[0].status
                });
            }
            console.log('───────────────────────────────────────────────────────');
            
            // Note: Let increment/decrement operations handle count updates
            // Just use actual pending count for display
            const actualCount = pendingApplications.length;
            
            // Transform Firebase data to match expected format
            return pendingApplications.map(app => ({
                applicationId: app.id,
                applicantUid: app.applicantId,
                jobId: app.jobId,
                status: app.status || 'pending',
                appliedAt: app.appliedAt,
                updatedAt: app.updatedAt || app.appliedAt,
                applicantProfile: {
                    displayName: app.applicantName || 'Anonymous',
                    photoURL: app.applicantThumbnail || 'public/users/placeholder.jpg',
                    averageRating: app.averageRating || 0,
                    totalReviews: app.totalReviews || 0,
                    verified: app.verified || false,
                    lastActive: app.lastActive || new Date()
                },
                pricing: {
                    offeredAmount: app.counterOffer || 0,
                    originalAmount: app.originalAmount || 0,
                    currency: 'PHP',
                    paymentType: 'per_job',
                    isCounterOffer: app.counterOffer ? true : false
                },
                applicationMessage: app.message || '',
                qualifications: app.qualifications || {},
                displayData: {
                    appliedDate: app.appliedAt ? formatDateForDisplay(app.appliedAt) : 'Unknown',
                    appliedTime: app.appliedAt ? formatTimeForDisplay(app.appliedAt) : '',
                    formattedPrice: app.counterOffer ? `₱${app.counterOffer} Per Job` : 'No offer',
                    originalAmount: app.originalAmount || 0  // Store original for later use
                }
            }));
        } catch (error) {
            console.error('❌ Error fetching applications from Firebase:', error);
            return [];
        }
    }
    
    // Fallback to mock data
    console.log('🧪 Using mock applications data');
    const jobData = MOCK_APPLICATIONS.find(job => job.jobId === jobId);
    return jobData ? jobData.applications : [];
}

// Helper function to format date from Firestore Timestamp
function formatDateForDisplay(timestamp) {
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to format time from Firestore Timestamp
function formatTimeForDisplay(timestamp) {
    let date;
    if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
        date = timestamp;
    } else {
        date = new Date(timestamp);
    }
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
}

// Helper function to convert Firestore Timestamp to ISO string
function timestampToISOString(timestamp) {
    if (!timestamp) return new Date().toISOString();
    
    if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString();
    } else if (timestamp instanceof Date) {
        return timestamp.toISOString();
    } else {
        return new Date(timestamp).toISOString();
    }
}

function generateApplicationCardHTML(application, jobTitle, jobOriginalPrice, jobPaymentType) {
    const stars = Array.from({length: 5}, (_, i) => 
        `<span class="star ${i < application.applicantProfile.averageRating ? 'filled' : ''}">★</span>`
    ).join('');
    
    // ═══════════════════════════════════════════════════════════════
    // SMART PRICE DISPLAY: Show counter offer OR original job price
    // ═══════════════════════════════════════════════════════════════
    let displayPrice;
    if (application.pricing.isCounterOffer && application.pricing.offeredAmount) {
        // Worker made a counter offer - show it
        displayPrice = `₱${application.pricing.offeredAmount} Per Job`;
    } else if (jobOriginalPrice) {
        // No counter offer - show original job price
        const paymentTypeText = jobPaymentType === 'per_hour' ? 'Per Hour' : 
                                jobPaymentType === 'per_day' ? 'Per Day' : 'Per Job';
        displayPrice = `₱${jobOriginalPrice} ${paymentTypeText}`;
    } else {
        // Fallback (shouldn't happen)
        displayPrice = 'No offer';
    }
    const safeApplicationId = escapeHtml(application.applicationId || '');
    const safeApplicantUid = escapeHtml(application.applicantUid || '');
    const safeJobId = escapeHtml(application.jobId || '');
    const safeJobTitle = escapeHtml(jobTitle || 'Untitled Job');
    const safeApplicantName = escapeHtml(application.applicantProfile.displayName || 'Applicant');
    const safeApplicantPhoto = escapeHtml(sanitizeUrl(application.applicantProfile.photoURL, 'public/users/default-user.jpg'));
    const safeApplicantRating = escapeHtml(String(application.applicantProfile.averageRating || 0));
    const safeTotalReviews = escapeHtml(String(application.applicantProfile.totalReviews || 0));
    const safePriceOffer = escapeHtml(String(application.pricing.offeredAmount || jobOriginalPrice || 0));
    const safePriceType = escapeHtml(application.pricing.paymentType || '');
    const safeIsCounterOffer = escapeHtml(String(application.pricing.isCounterOffer || false));
    const safeStatus = escapeHtml(application.status || '');
    const safeTimestamp = escapeHtml(timestampToISOString(application.appliedAt));
    const safeDisplayPrice = escapeHtml(displayPrice);
    const safeAppliedDate = escapeHtml(application.displayData.appliedDate || '');
    const safeAppliedTime = escapeHtml(application.displayData.appliedTime || '');
    const safeMessage = escapeHtml(application.applicationMessage || '');

    return `
        <div class="application-card" 
             data-application-id="${safeApplicationId}" 
             data-user-id="${safeApplicantUid}" 
             data-job-id="${safeJobId}"
             data-job-title="${safeJobTitle}"
             data-user-name="${safeApplicantName}"
             data-user-photo="${safeApplicantPhoto}"
             data-user-rating="${safeApplicantRating}"
             data-review-count="${safeTotalReviews}"
             data-price-offer="${safePriceOffer}"
             data-price-type="${safePriceType}"
             data-is-counter-offer="${safeIsCounterOffer}"
             data-status="${safeStatus}"
             data-timestamp="${safeTimestamp}">
            <div class="application-job-title">
                <span class="applicant-name" data-user-name="${safeApplicantName}">${safeApplicantName}</span>
                <span class="price-offer">${safeDisplayPrice}</span>
            </div>
            <div class="application-header">
                <div class="application-left">
                    <div class="application-date">${safeAppliedDate}</div>
                    <div class="application-time">${safeAppliedTime}</div>
                    <div class="application-rating" data-user-rating="${safeApplicantRating}" data-review-count="${safeTotalReviews}">
                        <div class="stars">${stars}</div>
                        <span class="review-count">(${safeTotalReviews})</span>
                    </div>
                </div>
                <div class="applicant-photo">
                    <img src="${safeApplicantPhoto}" alt="${safeApplicantName}" data-user-photo="${safeApplicantPhoto}">
                </div>
            </div>
            <div class="application-message">
                <strong>MESSAGE:</strong>
                ${safeMessage}
            </div>
        </div>
    `;
}

function initializeApplicationsOverlayHandlers() {
    const overlay = document.getElementById('applicationsOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;
    
    // Clean up existing overlay handlers first
    executeCleanupsByType('applications-overlay');
    
    const closeBtn = document.getElementById('applicationsCloseBtn');
    
    // Close button handler
    const handleCloseClick = () => hideApplicationsOverlay();
    if (closeBtn) {
        closeBtn.addEventListener('click', handleCloseClick);
        
        // Register cleanup
        registerCleanup('element', 'applications-overlay', () => {
            console.log('🧹 Cleaning up applications overlay close button');
            closeBtn.removeEventListener('click', handleCloseClick);
        });
    }
    
    // Backdrop click handler
    const handleBackdropClick = (e) => {
        if (e.target === overlay) {
            hideApplicationsOverlay();
        }
    };
    overlay.addEventListener('click', handleBackdropClick);
    
    // Register backdrop cleanup
    registerCleanup('element', 'applications-overlay', () => {
        console.log('🧹 Cleaning up applications overlay backdrop');
        overlay.removeEventListener('click', handleBackdropClick);
    });
    
    overlay.dataset.handlersInitialized = 'true';
}

function initializeApplicationCardHandlers() {
    // Clean up existing handlers first to prevent memory leaks
    executeCleanupsByType('application-cards');
    
    const applicationsList = document.getElementById('applicationsList');
    if (!applicationsList) return;
    
    // ═══════════════════════════════════════════════════════════════
    // Use EVENT DELEGATION to prevent memory leaks
    // Single listener on parent instead of multiple on each card
    // ═══════════════════════════════════════════════════════════════
    const handleCardClick = function(e) {
        // Find the clicked application card (bubble up to find it)
        const card = e.target.closest('.application-card');
        if (!card) return;
        
        // Prevent event bubbling
        e.stopPropagation();
        
        // Get applicant data from the card
        const userName = card.getAttribute('data-user-name');
        const userId = card.getAttribute('data-user-id');
        const userPhoto = card.getAttribute('data-user-photo');
        const userRating = parseFloat(card.getAttribute('data-user-rating'));
        const reviewCount = parseInt(card.getAttribute('data-review-count'));
        const applicationId = card.getAttribute('data-application-id');
        const jobTitle = card.getAttribute('data-job-title');
        const jobId = card.getAttribute('data-job-id');
        
        console.log(`Opening application action overlay for ${userName} with ${userRating} star rating (${reviewCount} reviews)`);
        console.log(`Job context: ${jobTitle} (ID: ${jobId})`);
        
        showApplicationActionOverlay(card);
    };
    
    // Add single delegated listener
    applicationsList.addEventListener('click', handleCardClick);
    
    // Register cleanup to remove listener when overlay closes
    registerCleanup('element', 'application-cards', () => {
        console.log('🧹 Cleaning up application card handlers');
        applicationsList.removeEventListener('click', handleCardClick);
    });
}

function updateActionStars(rating) {
    const stars = document.querySelectorAll('.action-star');
    console.log(`Found ${stars.length} stars, updating to ${rating} rating`);
    
    // First, remove all filled classes to reset
    stars.forEach(star => {
        star.classList.remove('filled');
    });
    
    // Add filled class to stars up to the rating
    for (let i = 0; i < Math.floor(rating); i++) {
        if (stars[i]) {
            stars[i].classList.add('filled');
        }
    }
    
    console.log(`Updated ${Math.floor(rating)} stars with filled class`);
}

function showApplicationActionOverlay(applicationCard) {
    const overlay = document.getElementById('applicationActionOverlay');
    const profileName = document.getElementById('actionProfileName');
    const profileImage = document.getElementById('actionProfileImage');
    const profileRating = document.getElementById('actionProfileRating');
    const reviewCount = document.getElementById('actionReviewCount');
    
    // Extract data from the application card
    const applicationId = applicationCard.getAttribute('data-application-id');
    const userId = applicationCard.getAttribute('data-user-id');
    const userName = applicationCard.getAttribute('data-user-name');
    const userPhoto = applicationCard.getAttribute('data-user-photo');
    const userRating = parseFloat(applicationCard.getAttribute('data-user-rating'));
    const userReviewCount = applicationCard.getAttribute('data-review-count');
    const jobTitle = applicationCard.getAttribute('data-job-title');
    const jobId = applicationCard.getAttribute('data-job-id');
    
    console.log(`Opening overlay for ${userName} with ${userRating} star rating (${userReviewCount} reviews)`);
    console.log(`Job context: ${jobTitle} (ID: ${jobId})`);
    
    // Update overlay content
    profileName.textContent = userName;
    profileImage.src = userPhoto;
    profileImage.alt = userName;
    reviewCount.textContent = `(${userReviewCount})`;
    
    // Update rating stars
    updateActionStars(userRating);
    
    // Store data in overlay for button handlers
    overlay.setAttribute('data-application-id', applicationId);
    overlay.setAttribute('data-user-id', userId);
    overlay.setAttribute('data-user-name', userName);
    overlay.setAttribute('data-job-title', jobTitle);
    overlay.setAttribute('data-job-id', jobId);
    
    // Update button data attributes
    const profileBtn = document.getElementById('profileBtn');
    const contactBtn = document.getElementById('contactBtn');
    const hireBtn = document.getElementById('hireJobBtn');
    const rejectBtn = document.getElementById('rejectJobBtn');
    
    if (profileBtn) {
        profileBtn.setAttribute('data-user-id', userId);
        profileBtn.setAttribute('data-user-name', userName);
    }
    
    if (contactBtn) {
        contactBtn.setAttribute('data-user-id', userId);
        contactBtn.setAttribute('data-user-name', userName);
        contactBtn.setAttribute('data-application-id', applicationId);
    }
    
    if (hireBtn) {
        hireBtn.setAttribute('data-application-id', applicationId);
        hireBtn.setAttribute('data-user-id', userId);
        hireBtn.setAttribute('data-user-name', userName);
        hireBtn.setAttribute('data-job-id', jobId);
        hireBtn.setAttribute('data-job-title', jobTitle);
        hireBtn.setAttribute('data-user-rating', userRating);
        hireBtn.setAttribute('data-user-photo', userPhoto);
        // Add price information from application card
        const priceOffer = applicationCard.getAttribute('data-price-offer');
        const priceType = applicationCard.getAttribute('data-price-type');
        hireBtn.setAttribute('data-price-offer', priceOffer || '');
        hireBtn.setAttribute('data-price-type', priceType || '');
    }
    
    if (rejectBtn) {
        rejectBtn.setAttribute('data-application-id', applicationId);
        rejectBtn.setAttribute('data-user-id', userId);
        rejectBtn.setAttribute('data-user-name', userName);
        rejectBtn.setAttribute('data-job-id', jobId);
        rejectBtn.setAttribute('data-job-title', jobTitle);
    }
    
    // Show overlay
    overlay.classList.add('show');
    
    // Initialize action handlers
    initializeApplicationActionHandlers();
    
    // Double-check stars are updated after overlay is shown
    setTimeout(() => {
        updateActionStars(userRating);
    }, 50);
}

function initializeApplicationActionHandlers() {
    const overlay = document.getElementById('applicationActionOverlay');
    if (!overlay) {
        console.error('❌ Application action overlay not found!');
        return;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // MEMORY LEAK FIX: Clean up existing handlers before adding new ones
    // ═══════════════════════════════════════════════════════════════
    executeCleanupsByType('application-action-handlers');
    
    const profileBtn = document.getElementById('profileBtn');
    const contactBtn = document.getElementById('contactBtn');
    const hireBtn = document.getElementById('hireJobBtn');
    const rejectBtn = document.getElementById('rejectJobBtn');
    
    // Handle profile button click
    const handleProfileClick = function() {
        console.log('🔍 Profile button clicked!');
        const userName = this.getAttribute('data-user-name');
        const userId = this.getAttribute('data-user-id');
        
        if (userId && userName) {
            console.log(`🔍 View profile for: ${userName} (${userId})`);
            hideApplicationActionOverlay();
            showConfirmation('🔍', 'Opening Profile', `Opening profile for ${userName}...`);
            
            // Navigate to profile page using Firebase UID (not slugified name)
            setTimeout(() => {
                window.location.href = `profile.html?userId=${userId}`;
            }, 1000);
        } else {
            console.error('❌ Missing userId or userName for profile navigation');
        }
    };
    
    if (profileBtn) {
        console.log('✅ Profile button found, adding event listener');
        profileBtn.addEventListener('click', handleProfileClick);
        
        // Register cleanup
        registerCleanup('element', 'application-action-handlers', () => {
            profileBtn.removeEventListener('click', handleProfileClick);
        });
    }
    
    // Handle contact button click
    const handleContactClick = function() {
        console.log('💬 Contact button clicked!');
        const userName = this.getAttribute('data-user-name');
        const userId = this.getAttribute('data-user-id');
        const applicationId = this.getAttribute('data-application-id');
        const jobId = overlay.getAttribute('data-job-id'); // Get jobId from overlay
        
        console.log('Contact button data:', { userName, userId, applicationId, jobId });
        
        if (userName && userId) {
            console.log(`Opening contact message for ${userName}`);
            
            // Close the current overlay
            hideApplicationActionOverlay();
            
            // Show contact message overlay with jobId and applicationId
            showContactMessageOverlay(userId, userName, jobId, applicationId);
        } else {
            console.error('Missing contact button data attributes:', { userName, userId });
        }
    };
    
    if (contactBtn) {
        console.log('✅ Contact button found, adding event listener');
        contactBtn.addEventListener('click', handleContactClick);
        
        // Register cleanup
        registerCleanup('element', 'application-action-handlers', () => {
            contactBtn.removeEventListener('click', handleContactClick);
        });
    }
    
    // Handle hire button click
    const handleHireClick = function() {
        console.log('✅ Hire button clicked!');
        const applicationId = this.getAttribute('data-application-id');
        const userId = this.getAttribute('data-user-id');
        const userName = this.getAttribute('data-user-name');
        const jobId = this.getAttribute('data-job-id');
        const jobTitle = this.getAttribute('data-job-title');
        const userRating = this.getAttribute('data-user-rating');
        const userPhoto = this.getAttribute('data-user-photo');
        const priceOffer = this.getAttribute('data-price-offer');
        const priceType = this.getAttribute('data-price-type');
        
        // Validate data before proceeding
        if (!applicationId || !userId || !userName) {
            console.error('❌ HIRE BUTTON ERROR: Missing critical data attributes');
            return;
        }
        
        console.log('HIRE ACTION:', {
            applicationId,
            userId,
            userName,
            jobId,
            jobTitle,
            userRating,
            userPhoto,
            priceOffer,
            priceType
        });
        
        // Debug: Check if price data is being captured
        console.log('🔍 PRICE DEBUG - Hire button price data:', {
            priceOffer: priceOffer,
            priceType: priceType,
            priceOfferType: typeof priceOffer,
            priceOfferLength: priceOffer?.length
        });
        
        // Hide current action overlay
        hideApplicationActionOverlay();
        
        // Show hire confirmation overlay with worker details
        showHireConfirmationOverlay({
            applicationId,
            userId,
            userName,
            jobId,
            jobTitle,
            userRating: parseFloat(userRating) || 0,
            userPhoto: userPhoto,
            priceOffer: priceOffer,
            priceType: priceType
        });
    };
    
    if (hireBtn) {
        console.log('✅ Hire button found, adding event listener');
        hireBtn.addEventListener('click', handleHireClick);
        
        // Register cleanup
        registerCleanup('element', 'application-action-handlers', () => {
            hireBtn.removeEventListener('click', handleHireClick);
        });
    }
    
    // Handle reject button click
    const handleRejectClick = async function() {
        console.log('❌ Reject button clicked!');
        const applicationId = this.getAttribute('data-application-id');
        const userId = this.getAttribute('data-user-id');
        const userName = this.getAttribute('data-user-name');
        const jobId = this.getAttribute('data-job-id');
        const jobTitle = this.getAttribute('data-job-title');
        
        // Validate data before proceeding
        if (!applicationId || !userId || !userName) {
            console.error('❌ REJECT BUTTON ERROR: Missing critical data attributes');
            return;
        }
        
        console.log('REJECT ACTION:', {
            applicationId,
            userId,
            userName,
            jobId,
            jobTitle
        });
            
            // Close action overlay first
            hideApplicationActionOverlay();
            
            // ═══════════════════════════════════════════════════════════════
            // SHOW LOADING INDICATOR
            // ═══════════════════════════════════════════════════════════════
            const applicationCard = document.querySelector(`#applicationsList [data-application-id="${applicationId}"]`);
            if (applicationCard) {
                // Add a subtle loading state to the card
                applicationCard.style.opacity = '0.6';
                applicationCard.style.pointerEvents = 'none';
                applicationCard.style.position = 'relative';
                
                // Add loading spinner
                const loadingSpinner = document.createElement('div');
                loadingSpinner.className = 'application-loading-spinner';
                loadingSpinner.innerHTML = '<div class="spinner-icon">⏳</div>';
                loadingSpinner.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 24px;
                    animation: spin 1s linear infinite;
                `;
                applicationCard.appendChild(loadingSpinner);
            }
            
            // ═══════════════════════════════════════════════════════════════
            // FIREBASE: Reject application in Firestore
            // ═══════════════════════════════════════════════════════════════
            const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
            
            if (useFirebase && typeof rejectApplication === 'function') {
                try {
                    console.log('🔥 Rejecting application in Firebase:', applicationId);
                    const result = await rejectApplication(applicationId);
                    
                    if (!result.success) {
                        console.error('❌ Failed to reject application:', result.message);
                        
                        // Remove loading state on error
                        if (applicationCard) {
                            applicationCard.style.opacity = '1';
                            applicationCard.style.pointerEvents = 'auto';
                            const spinner = applicationCard.querySelector('.application-loading-spinner');
                            if (spinner) spinner.remove();
                        }
                        
                        alert(result.message || 'Failed to reject application. Please try again.');
                        return;
                    }
                    
                    console.log('✅ Application rejected in Firebase');
                } catch (error) {
                    console.error('❌ Error rejecting application:', error);
                    
                    // Remove loading state on error
                    if (applicationCard) {
                        applicationCard.style.opacity = '1';
                        applicationCard.style.pointerEvents = 'auto';
                        const spinner = applicationCard.querySelector('.application-loading-spinner');
                        if (spinner) spinner.remove();
                    }
                    
                    alert('An error occurred while rejecting the application. Please try again.');
                    return;
                }
            }
            
            // ═══════════════════════════════════════════════════════════════
            // SUCCESS: Show confirmation and remove from UI
            // ═══════════════════════════════════════════════════════════════
            showConfirmation(
                '❌',
                'Application Rejected',
                `${userName}'s application has been rejected.`,
                'rejection'
            );
            
            // Remove the application card from UI after confirmation
            setTimeout(() => {
                if (applicationCard) {
                    applicationCard.style.transition = 'all 0.3s ease';
                    applicationCard.style.opacity = '0';
                    applicationCard.style.transform = 'translateX(100%)';
                    
                    setTimeout(() => {
                        applicationCard.remove();
                        
                        // Check if no applications left and show empty state
                        const remainingCards = document.querySelectorAll('#applicationsList .application-card');
                        if (remainingCards.length === 0) {
                            const applicationsList = document.getElementById('applicationsList');
                            applicationsList.innerHTML = `
                                <div class="empty-state">
                                    <div class="empty-state-icon">✅</div>
                                    <div class="empty-state-title">All Applications Processed</div>
                                    <div class="empty-state-message">No pending applications for this job.</div>
                                </div>
                            `;
                        }
                    }, 300);
                }
            }, 200);
    };
    
    if (rejectBtn) {
        console.log('✅ Reject button found, adding event listener');
        rejectBtn.addEventListener('click', handleRejectClick);
        
        // Register cleanup
        registerCleanup('element', 'application-action-handlers', () => {
            rejectBtn.removeEventListener('click', handleRejectClick);
        });
    }
    
    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === overlay) {
            hideApplicationActionOverlay();
        }
    };
    overlay.addEventListener('click', handleBackdropClick);
    
    // Register backdrop cleanup
    registerCleanup('element', 'application-action-handlers', () => {
        overlay.removeEventListener('click', handleBackdropClick);
    });
    
    // Close with Escape key
    const handleEscapeKey = function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
            hideApplicationActionOverlay();
        }
    };
    document.addEventListener('keydown', handleEscapeKey);
    
    // Register escape key cleanup
    registerCleanup('element', 'application-action-handlers', () => {
        document.removeEventListener('keydown', handleEscapeKey);
    });
    
    overlay.dataset.actionHandlersInitialized = 'true';
}

function showContactMessageOverlay(userId, userName, jobId = null, applicationId = null) {
    const overlay = document.getElementById('contactMessageOverlay');
    const userNameElement = document.getElementById('contactUserName');
    const messageInput = document.getElementById('contactMessageInput');
    const sendBtn = document.getElementById('contactSendBtn');
    const cancelBtn = document.getElementById('contactCancelBtn');
    const closeBtn = document.getElementById('contactCloseBtn');
    
    if (!overlay) return;
    if (messageInput) {
        blockUnsupportedCharsForInput(messageInput);
    }
    
    // Set user information
    userNameElement.textContent = `Contact ${userName}`;
    
    // Set data attributes
    overlay.setAttribute('data-user-id', userId);
    overlay.setAttribute('data-user-name', userName);
    if (jobId) {
        overlay.setAttribute('data-job-id', jobId);
    }
    if (applicationId) {
        overlay.setAttribute('data-application-id', applicationId);
    }
    
    messageInput.setAttribute('data-user-id', userId);
    messageInput.setAttribute('data-user-name', userName);
    if (jobId) {
        messageInput.setAttribute('data-job-id', jobId);
    }
    if (applicationId) {
        messageInput.setAttribute('data-application-id', applicationId);
    }
    
    // Clear previous message
    messageInput.value = '';
    
    // Show overlay
    overlay.classList.add('show');
    
    // On small viewports, scroll input into view to avoid keyboard overlap
    if (window.innerWidth <= 600 && messageInput) {
        setTimeout(() => {
            messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 250);
    }

    // Initialize handlers if not already done
    if (!overlay.dataset.contactHandlersInitialized) {
        console.log('🔧 Initializing contact overlay handlers');
        if (sendBtn) {
            console.log('✅ Send button found, adding event listener');
            sendBtn.addEventListener('click', handleSendContactMessage);
        } else {
            console.error('❌ Send button not found!');
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', hideContactMessageOverlay);
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', hideContactMessageOverlay);
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideContactMessageOverlay();
            }
        });
        
        overlay.dataset.contactHandlersInitialized = 'true';
    }
    
    // Focus on message input
    setTimeout(() => messageInput.focus(), 100);
}

async function handleSendContactMessage() {
    console.log('📤 handleSendContactMessage called');
    
    const overlay = document.getElementById('contactMessageOverlay');
    const messageInput = document.getElementById('contactMessageInput');
    
    if (!overlay || !messageInput) {
        console.error('❌ Contact overlay or input not found', { overlay, messageInput });
        return;
    }
    
    const recipientId = overlay.getAttribute('data-user-id');
    const recipientName = overlay.getAttribute('data-user-name');
    const jobId = overlay.getAttribute('data-job-id');
    const applicationId = overlay.getAttribute('data-application-id');
    const message = messageInput.value.trim();
    
    console.log('📤 Contact data:', { recipientId, recipientName, jobId, applicationId, message });
    
    if (!message) {
        console.log('⚠️ No message entered, focusing input');
        messageInput.focus();
        return;
    }
    if (hasUnsupportedTextChars(message)) {
        showErrorNotification('Message has unsupported symbols');
        messageInput.focus();
        return;
    }
    
    console.log(`📤 Sending message to ${recipientName}:`, message);
    
    /* FIREBASE IMPLEMENTATION - UNCOMMENT WHEN FIREBASE IS CONFIGURED
    try {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            console.error('❌ User not authenticated');
            showConfirmation('❌', 'Error', 'You must be logged in to send messages', 'error');
            return;
        }
        
        const db = firebase.firestore();
        
        // Get current user info from Firestore (or cached profile)
        const currentUserDoc = await db.collection('users').doc(currentUser.uid).get();
        const currentUserData = currentUserDoc.data();
        
        // Get job info for thread metadata
        const jobDoc = await db.collection('jobs').doc(jobId).get();
        const jobData = jobDoc.data();
        
        // Get recipient info
        const recipientDoc = await db.collection('users').doc(recipientId).get();
        const recipientData = recipientDoc.data();
        
        // Determine roles based on job poster
        const currentUserRole = jobData.posterId === currentUser.uid ? 'customer' : 'worker';
        const recipientRole = jobData.posterId === recipientId ? 'customer' : 'worker';
        
        // Check if thread already exists for this job/application between these users
        let existingThreadQuery;
        if (applicationId) {
            // If from application, search by applicationId for more specific match
            existingThreadQuery = await db.collection('chat_threads')
                .where('applicationId', '==', applicationId)
                .where('participantIds', 'array-contains', currentUser.uid)
                .get();
        } else {
            // If from job offer (no applicationId), search by jobId
            existingThreadQuery = await db.collection('chat_threads')
                .where('jobId', '==', jobId)
                .where('participantIds', 'array-contains', currentUser.uid)
                .get();
        }
        
        let threadId;
        let isNewThread = false;
        
        // Find exact match with both participants
        const matchingThread = existingThreadQuery.docs.find(doc => {
            const data = doc.data();
            return data.participantIds.includes(recipientId);
        });
        
        if (matchingThread) {
            // Use existing thread
            threadId = matchingThread.id;
            console.log('📝 Using existing thread:', threadId);
        } else {
            // Create new thread
            isNewThread = true;
            const threadRef = await db.collection('chat_threads').add({
                jobId: jobId,
                jobTitle: jobData.title,
                applicationId: applicationId || null, // Set if contacting from application, null if from job offer
                participantIds: [currentUser.uid, recipientId],
                participant1: {
                    userId: currentUser.uid,
                    userName: currentUserData.displayName,
                    userThumbnail: currentUserData.photoURL || '👤', // Emoji fallback
                    role: currentUserRole
                },
                participant2: {
                    userId: recipientId,
                    userName: recipientData.displayName,
                    userThumbnail: recipientData.photoURL || '👤', // Emoji fallback
                    role: recipientRole
                },
                threadOrigin: applicationId ? 'application' : 'job', // 'application' if from Listings, 'job' if from Gigs Offered
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessagePreview: message.substring(0, 100),
                isActive: true,
                unreadCount: {
                    [currentUser.uid]: 0,
                    [recipientId]: 1
                }
            });
            threadId = threadRef.id;
            console.log('✅ Created new thread:', threadId);
        }
        
        // Create message and update thread in batch
        const batch = db.batch();
        
        // Create message document
        const messageRef = db.collection('chat_messages').doc();
        batch.set(messageRef, {
            messageId: messageRef.id,
            threadId: threadId,
            senderId: currentUser.uid,
            senderName: currentUserData.displayName,
            senderType: currentUserRole,
            senderAvatar: currentUserData.photoURL || '👤', // Emoji fallback
            content: message,
            messageType: 'text',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            read: false
        });
        
        // Update thread metadata (only if not a new thread, as new thread already has this data)
        if (!isNewThread) {
            const threadRef = db.collection('chat_threads').doc(threadId);
            batch.update(threadRef, {
                lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessagePreview: message.substring(0, 100),
                [`unreadCount.${recipientId}`]: firebase.firestore.FieldValue.increment(1)
            });
        }
        
        await batch.commit();
        
        console.log('✅ Message sent successfully');
        showConfirmation('📤', 'Message Sent', `Your message has been sent to ${recipientName}`, 'celebration');
        hideContactMessageOverlay();
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        showConfirmation('❌', 'Error', 'Failed to send message. Please try again.', 'error');
    }
    */
    
    // MOCK IMPLEMENTATION (remove when Firebase is ready)
    showConfirmation('📤', 'Message Sent', `Your message has been sent to ${recipientName}`, 'celebration');
    hideContactMessageOverlay();
}

function hideContactMessageOverlay() {
    const overlay = document.getElementById('contactMessageOverlay');
    if (!overlay) return;
    
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to prevent memory leaks
    delete overlay.dataset.contactHandlersInitialized;
    
    console.log('💬 Contact message overlay hidden and handlers cleaned up');
}

function hideApplicationActionOverlay() {
    const overlay = document.getElementById('applicationActionOverlay');
    if (!overlay) return;
    
    // Clean up event listeners before hiding to prevent memory leaks
    executeCleanupsByType('application-action-handlers');
    
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to prevent memory leaks
    delete overlay.dataset.actionHandlersInitialized;
    
    console.log('👤 Application action overlay hidden and handlers cleaned up');
}

function showConfirmation(icon, title, message, animationType = 'default') {
    const overlay = document.getElementById('confirmationOverlay');
    const iconElement = document.getElementById('confirmationIcon');
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    const modalElement = document.querySelector('.confirmation-modal');
    const okBtn = document.getElementById('confirmationBtn');
    
    if (!overlay) return;
    
    iconElement.textContent = icon;
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // Clear previous animation classes
    modalElement.className = 'confirmation-modal';
    iconElement.className = 'confirmation-icon';
    
    // Add animation based on type
    if (animationType === 'celebration') {
        modalElement.classList.add('celebration', 'celebration-pulse');
        iconElement.classList.add('celebration');
        createConfetti(overlay);
    } else if (animationType === 'rejection') {
        modalElement.classList.add('rejection', 'rejection-pulse');
        iconElement.classList.add('rejection');
    }
    
    overlay.classList.add('show');
    
    // Initialize handler if not already done
    if (!overlay.dataset.confirmationHandlersInitialized) {
        if (okBtn) {
            okBtn.addEventListener('click', hideConfirmationOverlay);
        }
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideConfirmationOverlay();
            }
        });
        
        overlay.dataset.confirmationHandlersInitialized = 'true';
    }
}

function showConfirmationWithCallback(icon, title, message, callback, animationType = 'default') {
    const overlay = document.getElementById('confirmationOverlay');
    const iconElement = document.getElementById('confirmationIcon');
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    const modalElement = document.querySelector('.confirmation-modal');
    const okBtn = document.getElementById('confirmationBtn');
    
    if (!overlay) return;
    
    iconElement.textContent = icon;
    titleElement.textContent = title;
    messageElement.innerHTML = message; // Use innerHTML to support HTML formatting
    
    // Clear previous animation classes
    modalElement.className = 'confirmation-modal';
    iconElement.className = 'confirmation-icon';
    
    // Add animation based on type
    if (animationType === 'celebration') {
        modalElement.classList.add('celebration', 'celebration-pulse');
        iconElement.classList.add('celebration');
        createConfetti(overlay);
    } else if (animationType === 'rejection') {
        modalElement.classList.add('rejection', 'rejection-pulse');
        iconElement.classList.add('rejection');
    }
    
    overlay.classList.add('show');
    
    // Remove any prior callback handlers to prevent stacking.
    if (overlay.__okHandler && okBtn) {
        okBtn.removeEventListener('click', overlay.__okHandler);
        overlay.__okHandler = null;
    }
    if (overlay.__backdropHandler) {
        overlay.removeEventListener('click', overlay.__backdropHandler);
        overlay.__backdropHandler = null;
    }
    
    // Set up new handlers with callback
    const handleOkClick = () => {
        console.log('🔗 Confirmation OK clicked, executing callback...');
        hideConfirmationOverlay();
        if (callback) {
            callback();
        }
        // Clean up this specific handler
        if (okBtn) {
            okBtn.removeEventListener('click', handleOkClick);
        }
        overlay.removeEventListener('click', handleBackdropClick);
    };
    
    const handleBackdropClick = (e) => {
        if (e.target === overlay) {
            handleOkClick();
        }
    };
    
    overlay.__okHandler = handleOkClick;
    overlay.__backdropHandler = handleBackdropClick;

    if (okBtn) {
        okBtn.addEventListener('click', overlay.__okHandler);
    }
    
    overlay.addEventListener('click', overlay.__backdropHandler);
    overlay.dataset.confirmationHandlersInitialized = 'true';
}

function hideConfirmationOverlay() {
    const overlay = document.getElementById('confirmationOverlay');
    const modalElement = document.querySelector('.confirmation-modal');
    const iconElement = document.getElementById('confirmationIcon');
    
    if (!overlay) return;
    
    overlay.classList.remove('show');

    const okBtn = document.getElementById('confirmationBtn');
    if (overlay.__okHandler && okBtn) {
        okBtn.removeEventListener('click', overlay.__okHandler);
        overlay.__okHandler = null;
    }
    if (overlay.__backdropHandler) {
        overlay.removeEventListener('click', overlay.__backdropHandler);
        overlay.__backdropHandler = null;
    }
    
    // Clear animation classes
    if (modalElement) {
        modalElement.className = 'confirmation-modal';
    }
    if (iconElement) {
        iconElement.className = 'confirmation-icon';
    }
    
    // Remove any confetti particles
    const confettiParticles = overlay.querySelectorAll('.confetti-particle');
    confettiParticles.forEach(particle => particle.remove());
    
    // Clear handlers initialization flag
    delete overlay.dataset.confirmationHandlersInitialized;
}

// Create confetti effect for celebrations - popper style burst
function createConfetti(container) {
    console.log('🎊 Creating confetti effect with', 40, 'particles');
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const particleCount = 40;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        // Start all particles at the confetti icon position (50% left, 40% top)
        particle.style.left = '50%';
        particle.style.top = '40%';
        
        // Calculate random burst direction and distance in pixels
        const angle = Math.random() * 360; // Random angle in degrees
        const velocity = Math.random() * 200 + 100; // Random velocity between 100-300px
        const gravity = -(Math.random() * 150 + 100); // Random upward force (negative gravity)
        
        // Convert angle to radians for calculation
        const angleRad = angle * (Math.PI / 180);
        const endX = Math.cos(angleRad) * velocity;
        const endY = Math.sin(angleRad) * velocity + gravity; // Add gravity
        
        // Set CSS custom properties for animation
        particle.style.setProperty('--end-x', endX + 'px');
        particle.style.setProperty('--end-y', endY + 'px');
        particle.style.setProperty('--rotation', (Math.random() * 720 + 360) + 'deg');
        
        // Random timing for more natural effect
        particle.style.animationDelay = Math.random() * 0.3 + 's';
        particle.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
        
        console.log(`🎊 Particle ${i}: endX=${endX}px, endY=${endY}px, delay=${particle.style.animationDelay}, duration=${particle.style.animationDuration}`);
        
        container.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }
}

function hideApplicationsOverlay() {
    const overlay = document.getElementById('applicationsOverlay');
    if (!overlay) return;
    
    // Clean up event listeners before hiding to prevent memory leaks
    executeCleanupsByType('application-cards');
    executeCleanupsByType('applications-overlay');
    
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag to prevent memory leaks
    delete overlay.dataset.handlersInitialized;
    
    console.log('📋 Applications overlay hidden and handlers cleaned up');
}

// Hire Confirmation Overlay Functions
async function showHireConfirmationOverlay(workerData) {
    console.log('🚀 showHireConfirmationOverlay called with:', workerData);
    
    const overlay = document.getElementById('hireConfirmationOverlay');
    if (!overlay) {
        console.error('❌ Hire confirmation overlay not found!');
        return;
    }

    // Update worker status using real profile verification when available.
    const workerStatus = await resolveUserAccountStatus(workerData.userId, {
        role: 'worker',
        fallbackRating: workerData.userRating
    });
    updateWorkerStatusDisplay(workerStatus);
    updateStatusFacePreview('hireFacePreviewBlock', 'hireFacePreviewImage', workerStatus);
    overlay.dataset.verificationStatusType = workerStatus?.type || '';
    updateVerificationReminderActions('hire', workerStatus?.type, workerData.userName, workerData.userId);
    setVerificationDecision('confirmHire', null);

    // Store worker data for confirmation action
    overlay.dataset.applicationId = workerData.applicationId;
    overlay.dataset.userId = workerData.userId;
    overlay.dataset.userName = workerData.userName;
    overlay.dataset.jobId = workerData.jobId;
    overlay.dataset.jobTitle = workerData.jobTitle;
    overlay.dataset.userRating = workerData.userRating;
    overlay.dataset.userPhoto = workerData.userPhoto || '';
    overlay.dataset.priceOffer = workerData.priceOffer || '';
    overlay.dataset.priceType = workerData.priceType || '';

    // Initialize language tabs (resets state each time modal opens)
    initializeDisclaimerLanguageTabs('confirmHire');
    
    // Show overlay
    overlay.classList.add('show');
    startVerificationReminderTicker('hire');
    attachHireConfirmationEscHandler();
    
    // Initialize event handlers
    initializeHireConfirmationHandlers();
}

function updateWorkerStatusDisplay(status) {
    const info = document.getElementById('workerStatusInfo');
    const friendlyIcon = document.getElementById('statusFriendlyIcon');
    const infoTitle = document.getElementById('statusInfoTitle');
    const infoContent = document.getElementById('statusInfoContent');

    // Support both new status shape and any legacy fields.
    friendlyIcon.textContent = status.icon || status.friendlyIcon || '🌱';
    infoTitle.textContent = status.title || status.infoTitle || 'Unverified';
    infoContent.textContent = status.description || status.infoContent || 'This member has not completed Face Verification yet.';

    // Style info section based on type
    if (status.type === 'business') {
        info.style.background = 'rgba(251, 191, 36, 0.08)';
        info.style.borderColor = 'rgba(251, 191, 36, 0.2)';
        infoTitle.style.color = '#fbbf24';
    } else if (status.type === 'pro') {
        info.style.background = 'rgba(16, 185, 129, 0.08)';
        info.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        infoTitle.style.color = '#10b981';
    } else if (status.type === 'face') {
        info.style.background = 'rgba(59, 130, 246, 0.08)';
        info.style.borderColor = 'rgba(59, 130, 246, 0.2)';
        infoTitle.style.color = '#60a5fa';
    } else {
        info.style.background = 'rgba(230, 214, 174, 0.08)';
        info.style.borderColor = 'rgba(230, 214, 174, 0.2)';
        infoTitle.style.color = '#e6d6ae';
    }
}

function updateVerificationReminderActions(context, statusType, counterpartName = 'this member', counterpartId = '') {
    const isUnverified = statusType === 'unverified' || statusType === 'new-member';
    const isHire = context === 'hire';

    const reminderCard = document.getElementById(isHire ? 'hireUnverifiedReminder' : 'acceptUnverifiedReminder');
    const reminderText = document.getElementById(isHire ? 'hireReminderText' : 'acceptReminderText');
    const reminderMeta = document.getElementById(isHire ? 'hireReminderMeta' : 'acceptReminderMeta');
    const requestBtn = document.getElementById(isHire ? 'hireRequestVerificationBtn' : 'acceptRequestVerificationBtn');
    const safeCounterpartId = counterpartId || counterpartName;
    const firstName = (counterpartName || 'This member').split(' ')[0];

    if (!reminderCard) return;

    if (!isUnverified) {
        reminderCard.style.display = 'none';
        if (reminderMeta) {
            reminderMeta.style.display = 'none';
            reminderMeta.textContent = '';
        }
        resetVerificationProceedButton(context);
        setVerificationDecision(context === 'hire' ? 'confirmHire' : 'acceptGig', null);
        return;
    }

    reminderCard.style.display = 'block';
    const { state } = getVerificationReminderState(safeCounterpartId);
    const isPending = state.status === 'pending' && state.requestedAt > 0;

    if (reminderText) {
        reminderText.textContent = isPending
            ? (isHire
                ? `${counterpartName} is still unverified. You already requested Face Verification.`
                : `${counterpartName} is still unverified. You already requested Face Verification.`)
            : (isHire
                ? `${counterpartName} is currently unverified. You can request Face Verification or continue sending the offer.`
                : `${counterpartName} is currently unverified. You can request Face Verification or continue accepting the offer.`);
    }

    if (requestBtn) {
        if (isPending) {
            requestBtn.disabled = true;
            requestBtn.classList.add('selected');
            requestBtn.textContent = `Waiting for ${firstName} to Face Verify`;
        } else {
            requestBtn.disabled = false;
            requestBtn.classList.remove('selected');
            requestBtn.textContent = 'Request Verification';
        }
    }

    if (reminderMeta) {
        if (isPending) {
            reminderMeta.style.display = 'block';
            reminderMeta.textContent = formatRelativeReminderTime(state.requestedAt);
        } else {
            reminderMeta.style.display = 'none';
            reminderMeta.textContent = '';
        }
    }
    refreshDisclaimerGate(isHire ? 'confirmHire' : 'acceptGig');
}

function resetVerificationProceedButton(context) {
    const isHire = context === 'hire';
    const proceedBtn = document.getElementById(isHire ? 'hireProceedAnywayBtn' : 'acceptProceedAnywayBtn');
    const requestBtn = document.getElementById(isHire ? 'hireRequestVerificationBtn' : 'acceptRequestVerificationBtn');
    if (!proceedBtn) return;
    proceedBtn.classList.remove('selected');
    proceedBtn.textContent = isHire ? 'Send Offer Anyway' : 'Accept Offer Anyway';
    if (requestBtn) {
        requestBtn.disabled = false;
        requestBtn.classList.remove('selected');
        requestBtn.textContent = 'Request Verification';
    }
}

function initializeHireConfirmationHandlers() {
    const overlay = document.getElementById('hireConfirmationOverlay');
    if (!overlay || overlay.dataset.hireHandlersInitialized) return;

    const closeBtn = document.getElementById('hireConfirmationCloseBtn');
    const cancelBtn = document.getElementById('cancelHireBtn');
    const confirmBtn = document.getElementById('confirmHireBtn');
    const requestBtn = document.getElementById('hireRequestVerificationBtn');
    const proceedBtn = document.getElementById('hireProceedAnywayBtn');

    console.log('🔧 Initializing hire confirmation handlers');

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', hideHireConfirmationOverlay);
    }

    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideHireConfirmationOverlay);
    }

    // Confirm hire button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            console.log('✅ Final hire confirmation clicked!');
            const workerData = {
                applicationId: overlay.dataset.applicationId,
                userId: overlay.dataset.userId,
                userName: overlay.dataset.userName,
                jobId: overlay.dataset.jobId,
                jobTitle: overlay.dataset.jobTitle,
                userRating: overlay.dataset.userRating,
                userPhoto: overlay.dataset.userPhoto,
                priceOffer: overlay.dataset.priceOffer,
                priceType: overlay.dataset.priceType
            };
            
            processHireConfirmation(workerData);
        });
    }

    if (requestBtn) {
        requestBtn.addEventListener('click', function() {
            const counterpartName = overlay.dataset.userName || 'this worker';
            const counterpartId = overlay.dataset.userId || counterpartName;
            setVerificationReminderPending(counterpartId);
            if (proceedBtn) {
                proceedBtn.classList.remove('selected');
                proceedBtn.textContent = 'Send Offer Anyway';
            }
            setVerificationDecision('confirmHire', null);
            hideHireConfirmationOverlay();
            showConfirmationWithCallback(
                '📨',
                'Verification Reminder Sent',
                `A Face Verification reminder has been sent to ${counterpartName}. Reopen this applicant when you are ready to proceed.`,
                null
            );
        });
    }

    if (proceedBtn) {
        proceedBtn.addEventListener('click', function() {
            const isSelected = proceedBtn.classList.toggle('selected');
            proceedBtn.textContent = isSelected ? '✓ Send Offer Anyway' : 'Send Offer Anyway';
            if (isSelected && requestBtn && !requestBtn.disabled) {
                requestBtn.classList.remove('selected');
                requestBtn.textContent = 'Request Verification';
            }
            const warningEl = document.getElementById('confirmHireWarning');
            if (warningEl) {
                const icon = warningEl.querySelector('.final-warning-icon');
                const text = warningEl.querySelector('.final-warning-text');
                if (icon) icon.textContent = '📖';
                if (text) text.textContent = isSelected
                    ? 'Offer choice saved. Please read one disclaimer tab to continue.'
                    : 'Please read the disclaimer above to continue';
            }
            setVerificationDecision('confirmHire', isSelected ? 'proceed' : null);
        });
    }

    // Backdrop click
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            hideHireConfirmationOverlay();
        }
    });

    overlay.dataset.hireHandlersInitialized = 'true';
}

function hideHireConfirmationOverlay() {
    const overlay = document.getElementById('hireConfirmationOverlay');
    if (!overlay) return;
    
    clearVerificationReminderTicker('hire');
    detachHireConfirmationEscHandler();
    overlay.classList.remove('show');
    
    // Close all parent modals for cleaner UX (no stacking)
    const applicationsOverlay = document.getElementById('applicationsOverlay');
    if (applicationsOverlay) {
        applicationsOverlay.classList.remove('show');
        delete applicationsOverlay.dataset.handlersInitialized;
    }
    
    const listingOptionsOverlay = document.getElementById('listingOptionsOverlay');
    if (listingOptionsOverlay) {
        listingOptionsOverlay.classList.remove('show');
        delete listingOptionsOverlay.dataset.handlersInitialized;
    }
    
    console.log('🔒 Hire confirmation overlay and parent modals closed');
}

async function processHireConfirmation(workerData) {
    console.log('🎉 Processing hire confirmation for:', workerData);
    
    // Hide hire confirmation overlay
    hideHireConfirmationOverlay();
    
    // Show loading animation
    showLoadingOverlay('Sending Gig Offer');
    
    // Check if Firebase mode is active
    const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
    
    if (useFirebase && typeof hireWorker === 'function') {
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Save hire to database
        // ══════════════════════════════════════════════════════════════
        try {
            console.log('🔥 Hiring worker via Firebase...');
            
            const result = await hireWorker(workerData.jobId, workerData.applicationId);
            
            // Hide loading
            hideLoadingOverlay();
            
            if (result.success) {
                console.log('✅ Worker hired successfully in Firebase');
                
                // Show success confirmation with better formatting
                showConfirmationWithCallback(
                    '🎉',
                    'Gig Offer Sent!',
                    `<div style="line-height: 1.6;">
                        <p style="margin: 0 0 12px 0;"><strong>${workerData.userName}</strong> has been sent a job offer.</p>
                        <p style="margin: 0 0 12px 0;">They will be notified and must accept the offer before work begins.</p>
                        <p style="margin: 0; color: #666;">The job will move to your <strong>Hiring</strong> tab.</p>
                    </div>`,
                    async () => {
                        console.log('✅ User closed success overlay');
                        
                        // Close all overlays
                        closeAllOverlaysAfterHire();
                        
                        // Reload the listings tab to reflect changes
                        setTimeout(async () => {
                            await loadListingsContent();
                            await loadHiringContent();
                            await updateTabCounts();
                        }, 500);
                    },
                    'celebration'
                );
            } else {
                console.error('❌ Hire failed:', result.message);
                showErrorNotification(result.message || 'Failed to hire worker. Please try again.');
            }
        } catch (error) {
            hideLoadingOverlay();
            console.error('❌ Error hiring worker:', error);
            showErrorNotification('An error occurred while hiring. Please try again.');
        }
    } else {
        // ══════════════════════════════════════════════════════════════
        // MOCK MODE - Use existing mock data logic
        // ══════════════════════════════════════════════════════════════
        console.log('🧪 Using mock hire logic');
        
        // Hide loading after short delay
        setTimeout(() => hideLoadingOverlay(), 500);
        
        showConfirmationWithCallback(
            '🎉',
            'Gig Offer Sent!',
            `<div style="line-height: 1.6;">
                <p style="margin: 0 0 12px 0;"><strong>${workerData.userName}</strong> has been sent a job offer.</p>
                <p style="margin: 0 0 12px 0;">They will be notified and must accept the offer before work begins.</p>
                <p style="margin: 0; color: #666;">The job will move to your <strong>Hiring</strong> tab with "Pending Offer" status.</p>
            </div>`,
            async () => {
                console.log('✅ User closed success overlay, starting offer process...');
                
                try {
                    closeAllOverlaysAfterHire();
                    
                    const jobCard = document.querySelector(`[data-job-id="${workerData.jobId}"]`);
                    if (jobCard) {
                        const jobData = extractJobDataFromCard(jobCard);
                        if (jobData) {
                            await addToOfferedData(jobData, workerData);
                            
                            jobData.hiredWorker = workerData.userName;
                            jobData.hiredWorkerPhoto = workerData.userPhoto;
                            jobData.agreedPrice = workerData.priceOffer;
                            jobData.priceType = workerData.priceType;
                            jobData.status = 'pending-offer';
                            addToHiringData(jobData);
                            console.log('✅ Job offer created for both worker and customer');
                        }
                    }
                    
                    console.log('📋 Applications held in reserve until worker accepts offer');
                    
                    setTimeout(async () => {
                        await moveJobListingToHiringWithData(workerData.jobId, workerData.userName, 'pending-offer');
                    }, 500);
                    
                } catch (error) {
                    console.error('❌ Error in offer process:', error);
                }
            },
            'celebration'
        );
    }
}

function autoRejectOtherApplications(hiredApplicationId) {
    console.log('🔄 Auto-rejecting all other applications except:', hiredApplicationId);
    
    const applicationCards = document.querySelectorAll('#applicationsList .application-card');
    let rejectedCount = 0;
    
    applicationCards.forEach((card, index) => {
        const applicationId = card.getAttribute('data-application-id');
        
        if (applicationId !== hiredApplicationId) {
            // Stagger the rejection animations
            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                card.style.transform = 'translateX(-100%)';
                card.style.opacity = '0';
                
                setTimeout(() => {
                    card.remove();
                }, 600);
            }, index * 150); // Stagger by 150ms each
            
            rejectedCount++;
        }
    });
    
    console.log(`📤 Auto-rejected ${rejectedCount} applications`);
    
    // TODO: Send auto-rejection notifications to backend
    // This would be where we batch-send rejection notifications to all other applicants
}

function removeApplicationCard(applicationId) {
    setTimeout(() => {
        const applicationCard = document.querySelector(`#applicationsList [data-application-id="${applicationId}"]`);
        if (applicationCard) {
            applicationCard.style.transition = 'all 0.4s ease';
            applicationCard.style.opacity = '0';
            applicationCard.style.transform = 'translateY(-20px) scale(0.95)';
            
            setTimeout(() => {
                applicationCard.remove();
                
                // Show empty state after all animations complete
                setTimeout(() => {
                    const remainingCards = document.querySelectorAll('#applicationsList .application-card');
                    if (remainingCards.length === 0) {
                        const applicationsList = document.getElementById('applicationsList');
                        applicationsList.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-state-icon">📋</div>
                                <div class="empty-state-title">No Applications Yet</div>
                                <div class="empty-state-message">This job hasn't received any applications yet.</div>
                            </div>
                        `;
                    }
                }, 1000);
            }, 400);
        }
    }, 2000); // Wait for auto-rejection animations to complete
}

function closeAllOverlaysAfterHire() {
    console.log('🔒 Closing all overlays after hire confirmation');
    
    // Close applications overlay
    const applicationsOverlay = document.getElementById('applicationsOverlay');
    if (applicationsOverlay) {
        applicationsOverlay.classList.remove('show');
        delete applicationsOverlay.dataset.handlersInitialized;
    }
    
    // Close listing options overlay  
    const listingOptionsOverlay = document.getElementById('listingOptionsOverlay');
    if (listingOptionsOverlay) {
        listingOptionsOverlay.classList.remove('show');
        delete listingOptionsOverlay.dataset.handlersInitialized;
    }
    
    // Note: Confirmation overlay will be closed by user clicking OK
    // This triggers the callback which continues the hire process
}

async function moveJobListingToHiringWithData(jobId, workerName) {
    console.log(`📋 Moving job ${jobId} from Listings to Hiring tab (hired: ${workerName})`);
    
    try {
        // Find the job card in the listings
        const jobCard = document.querySelector(`[data-job-id="${jobId}"]`);
        if (!jobCard) {
            console.log('ℹ️ Job card already removed or not found, proceeding with tab switch');
            // Job data should already be in hiring, just switch tabs
            await switchToHiringTab();
            return;
        }
        
        // Remove from listings with animation
        jobCard.style.transition = 'all 0.5s ease';
        jobCard.style.transform = 'scale(0.9)';
        jobCard.style.opacity = '0.5';
        
        setTimeout(async () => {
            jobCard.remove();
            console.log(`✅ Job card removed from Listings: ${jobId}`);
            
            // Auto-switch to Hiring tab to show the moved job
            setTimeout(async () => {
                await switchToHiringTab();
            }, 500);
            
        }, 500);
        
    } catch (error) {
        console.error('❌ Error moving job to hiring:', error);
        // Fallback: just switch to hiring tab
        await switchToHiringTab();
    }
}

// Keep the old function for backward compatibility
function moveJobListingToHiring(jobId, workerName) {
    return moveJobListingToHiringWithData(jobId, workerName);
}

function addToHiringData(jobData) {
    // Add to mock hiring data (in real app, this would be sent to backend)
    if (!MOCK_HIRING_DATA) {
        MOCK_HIRING_DATA = [];
    }
    
    // Find original job in listings data to preserve application data
    let originalJob = null;
    if (MOCK_LISTINGS_DATA) {
        originalJob = MOCK_LISTINGS_DATA.find(job => job.jobId === jobData.jobId);
    }
    
    // Format data to match hiring tab expectations
    const hiringJob = {
        jobId: jobData.jobId,
        title: jobData.title,
        description: jobData.description,
        category: jobData.category,
        location: jobData.location,
        datePosted: jobData.datePosted,
        salary: jobData.agreedPrice || jobData.salary, // Use agreed price from application, fallback to original
        priceOffer: formatPriceWithPeso(jobData.agreedPrice) || jobData.salary, // Add priceOffer field for hiring card display
        thumbnail: jobData.thumbnail,
        hiredWorker: jobData.hiredWorker,
        hiredWorkerName: jobData.hiredWorker || 'Unknown Worker', // Fix for toUpperCase error
        hiredWorkerThumbnail: jobData.hiredWorkerPhoto || 'public/users/User-01.jpg', // Use actual worker photo
        status: 'hired',
        role: 'customer', // Current user is the customer who hired someone
        hiringStatus: 'active',
        dateHired: new Date().toISOString(),
        hiredDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }),
        // Additional required fields for hiring tab
        posterId: 'user_peter_ang_001', // Current user as poster
        posterName: 'Peter J. Ang',
        // Required time fields to fix formatTime error
        jobDate: new Date().toISOString().split('T')[0], // Today's date as YYYY-MM-DD
        startTime: '9:00 AM', // Default start time
        endTime: '5:00 PM', // Default end time
        // Additional fields for consistency
        hiredWorkerId: 'user_hired_worker_001',
        // PRESERVE ORIGINAL APPLICATION DATA for reactivation
        originalApplicationCount: originalJob ? originalJob.applicationCount : 0,
        originalApplicationIds: originalJob ? [...(originalJob.applicationIds || [])] : []
    };
    
    // Remove original job from listings data (it's now hired)
    if (MOCK_LISTINGS_DATA && originalJob) {
        MOCK_LISTINGS_DATA = MOCK_LISTINGS_DATA.filter(job => job.jobId !== jobData.jobId);
        console.log(`🗑️ Removed job ${jobData.jobId} from MOCK_LISTINGS_DATA (now hired)`);
    }
    
    // Add new hired job to the beginning of the array (top of list)
    MOCK_HIRING_DATA.unshift(hiringJob);
    
    // Mark this job as newly hired for highlighting
    hiringJob.isNewlyHired = true;
    
    // Debug: Check price data in hiring job
    console.log('🔍 PRICE DEBUG - Final hiring job data:', {
        originalSalary: jobData.salary,
        agreedPrice: jobData.agreedPrice,
        finalSalary: hiringJob.salary,
        priceType: jobData.priceType
    });
    
    console.log('✅ Added to hiring data:', jobData.title, hiringJob);
}

async function switchToHiringTab() {
    console.log('🔄 Auto-switching to Hiring tab');
    
    try {
        // Find and click the Hiring tab
        const hiringTab = document.querySelector('[data-tab="hiring"]');
        if (hiringTab && !hiringTab.classList.contains('active')) {
            console.log('📌 Clicking Hiring tab...');
            hiringTab.click();
            
            // Wait a moment for tab switch, then force refresh hiring content
            setTimeout(async () => {
                console.log('🔄 Loading hiring content...');
                try {
                    await loadHiringContent();
                    console.log('✅ Hiring content loaded successfully');
                    
                    // Auto-remove highlighting from newly hired jobs after 5 seconds
                    setTimeout(() => {
                        const highlightedCards = document.querySelectorAll('.hiring-card.newly-hired-highlight');
                        highlightedCards.forEach(card => {
                            card.classList.remove('newly-hired-highlight');
                            // Also remove the flag from the data
                            const jobId = card.getAttribute('data-job-id');
                            const jobData = MOCK_HIRING_DATA.find(job => job.jobId === jobId);
                            if (jobData) {
                                jobData.isNewlyHired = false;
                            }
                        });
                        if (highlightedCards.length > 0) {
                            console.log('🎨 Removed highlighting from newly hired jobs');
                        }
                    }, 5000);
                } catch (loadError) {
                    console.error('❌ Error loading hiring content:', loadError);
                }
            }, 300);
        } else if (hiringTab && hiringTab.classList.contains('active')) {
            console.log('📌 Already on Hiring tab, just refreshing content...');
            // Already on hiring tab, just refresh
            try {
                await loadHiringContent();
                console.log('✅ Hiring content refreshed successfully');
            } catch (loadError) {
                console.error('❌ Error refreshing hiring content:', loadError);
            }
        } else {
            console.error('❌ Hiring tab not found');
        }
    } catch (error) {
        console.error('❌ Error switching to hiring tab:', error);
    }
}

function handleViewJob(jobData) {
    console.log(`👁️ VIEW job post: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    // Navigate to dynamic job page
    const viewUrl = `dynamic-job.html?jobId=${jobData.jobId}&category=${jobData.category}`;
    console.log(`👀 Navigating to job view: ${viewUrl}`);
    
    // Firebase data mapping for view mode:
    // - Load job document from: db.collection('jobs').doc(jobData.jobId)
    // - Display job details in read-only format
    // - Show application statistics and status
    
    window.location.href = viewUrl;
}

function handleModifyJob(jobData) {
    console.log(`✏️ MODIFY job: ${jobData.jobId}`);
    hideListingOptionsOverlay();
    
    // Navigate to new-post2.html with edit mode
    const editUrl = `new-post2.html?edit=${jobData.jobId}&category=${jobData.category}`;
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
        // ══════════════════════════════════════════════════════════════
        // FIREBASE MODE - Update status in Firestore
        // ══════════════════════════════════════════════════════════════
        const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
        
        if (useFirebase && typeof firebase !== 'undefined') {
            const db = firebase.firestore();
            
            if (action === 'pause') {
                await db.collection('jobs').doc(jobData.jobId).update({
                    status: 'paused',
                    pausedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('🔥 Job paused in Firebase');
            } else {
                await db.collection('jobs').doc(jobData.jobId).update({
                    status: 'active',
                    activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log('🔥 Job activated in Firebase');
            }
        } else {
            // ══════════════════════════════════════════════════════════════
            // MOCK MODE - Update status in mock data
            // ══════════════════════════════════════════════════════════════
            console.log('🧪 Updating mock data');
            updateJobStatusInMockData(jobData.jobId, newStatus);
        }
        
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
        
        // Update the data-status attribute on the card
        const jobCard = document.querySelector(`[data-job-id="${jobData.jobId}"]`);
        if (jobCard) {
            console.log(`🔧 Updating card data-status from "${jobCard.getAttribute('data-status')}" to "${newStatus}"`);
            jobCard.setAttribute('data-status', newStatus);
            console.log(`✅ Card data-status now: ${jobCard.getAttribute('data-status')}`);
        } else {
            console.warn(`⚠️ Could not find job card with ID: ${jobData.jobId}`);
        }
        
        console.log(`${action === 'pause' ? '⏸️' : '▶️'} Job ${jobData.jobId} ${action}d successfully`);
        console.log(`📊 Status updated: ${currentStatus} → ${newStatus}`);
        console.log(`🔄 UI updated to show ${newStatus} status`);
        
        showSuccessNotification(`Job ${action}d successfully`);
        
        // Don't refresh listings - Firebase read has delay and will show stale data
        // The UI is already updated correctly above
        console.log('ℹ️ Skipping listings refresh to preserve immediate UI update');
        
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
    
    // Show loading animation
    showLoadingOverlay('Deleting job...');
    
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
        
        // Hide loading animation
        hideLoadingOverlay();
        
        // Show success notification
        showSuccessNotification('Job deleted successfully');
        
    } catch (error) {
        console.error(`❌ Error deleting job ${jobData.jobId}:`, error);
        
        // Hide loading animation
        hideLoadingOverlay();
        
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
            const safeCountText = escapeHtml(`${appCount} application${appCount === 1 ? '' : 's'}`);
            applicationCount.innerHTML = `⚠️ This job has <strong>${safeCountText}</strong> that will also be deleted.`;
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
    
    // Create empty state with auth-protected button
    listingsContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">No Job Listings</div>
            <div class="empty-state-message">
                You haven't posted any jobs yet.<br>
                Start by creating your first job posting.
            </div>
            <button class="empty-state-btn" id="emptyStatePostBtn">Post Your First Job</button>
        </div>
    `;
    
    // Add auth check to the button
    const emptyStatePostBtn = document.getElementById('emptyStatePostBtn');
    if (emptyStatePostBtn) {
        emptyStatePostBtn.addEventListener('click', function() {
            const isLoggedIn = typeof window.isLoggedIn === 'function' && window.isLoggedIn();
            if (isLoggedIn) {
                window.location.href = 'new-post2.html';
            } else {
                window.location.href = 'login.html';
            }
        });
    }
}

async function updateTabCounts() {
    // Update notification counts on tabs after job operations
    console.log('🔢 Updating tab notification counts...');
    
    // Show loading state on all tab counts
    const tabCountElements = document.querySelectorAll('.notification-count');
    tabCountElements.forEach(el => {
        el.classList.add('loading');
        el.textContent = ''; // Content added via CSS ::before for animation
    });
    
    // Debug current data status
    debugDataStatus();
    
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
        const allHiredJobs = await JobsDataService.getAllHiredJobs();
        const completedJobs = await JobsDataService.getCompletedJobs();
        const offeredJobs = await JobsDataService.getOfferedJobs();
        
        // Separate hired jobs by perspective and status
        // Customer Hiring tab: Shows 'hired' and 'accepted' status (both pending and accepted workers)
        const customerHiringJobs = allHiredJobs.filter(job => 
            job.role === 'customer' && (job.status === 'hired' || job.status === 'accepted')
        );
        // Worker Working tab: Shows only 'accepted' status (offers they've accepted)
        const workerAcceptedJobs = allHiredJobs.filter(job => 
            job.role === 'worker' && job.status === 'accepted'
        );
        
        // Separate completed jobs by perspective
        const customerCompletedJobs = completedJobs.filter(job => job.role === 'customer');
        const workerCompletedJobs = completedJobs.filter(job => job.role === 'worker');
        
        // Count actual jobs in each data set
        const counts = {
            listings: listingsJobs.length,              // Active/paused jobs posted by user
            hiring: customerHiringJobs.length,          // Jobs where user hired workers (customer perspective)
            previous: customerCompletedJobs.length,     // Completed jobs where user was customer
            offered: offeredJobs.length,                // Jobs offered to user (worker perspective)
            accepted: workerAcceptedJobs.length,        // Jobs where user was hired (worker perspective)
            workerCompleted: workerCompletedJobs.length // Jobs where user worked and completed
        };
        
        // Update customer tab notification badges
        const listingsCount = document.querySelector('#listingsTab .notification-count');
        const hiringCount = document.querySelector('#hiringTab .notification-count');
        const previousCount = document.querySelector('#previousTab .notification-count');
        
        if (listingsCount) {
            listingsCount.classList.remove('loading');
            listingsCount.textContent = counts.listings;
        }
        if (hiringCount) {
            hiringCount.classList.remove('loading');
            hiringCount.textContent = counts.hiring;
        }
        if (previousCount) {
            previousCount.classList.remove('loading');
            previousCount.textContent = counts.previous;
        }
        
        // Update worker tab notification badges
        const offeredCount = document.querySelector('#offeredTab .notification-count');
        const acceptedCount = document.querySelector('#acceptedTab .notification-count');
        const workerCompletedCount = document.querySelector('#workerCompletedTab .notification-count');
        
        if (offeredCount) {
            offeredCount.classList.remove('loading');
            offeredCount.textContent = counts.offered;
        }
        if (acceptedCount) {
            acceptedCount.classList.remove('loading');
            acceptedCount.textContent = counts.accepted;
        }
        if (workerCompletedCount) {
            workerCompletedCount.classList.remove('loading');
            workerCompletedCount.textContent = counts.workerCompleted;
        }
        
        console.log(`📊 Tab counts updated: Listings(${counts.listings}), Hiring(${counts.hiring}), Previous(${counts.previous}), Offered(${counts.offered}), Accepted(${counts.accepted}), WorkerCompleted(${counts.workerCompleted})`);
        
    } catch (error) {
        console.error('❌ Error updating tab counts:', error);
    }
}

async function updateJobStatusInMockData(jobId, newStatus) {
    let updated = false;
    
    // First, try to update in mock data (for original jobs)
    if (MOCK_LISTINGS_DATA) {
        const jobIndex = MOCK_LISTINGS_DATA.findIndex(job => job.jobId === jobId);
        if (jobIndex !== -1) {
            MOCK_LISTINGS_DATA[jobIndex].status = newStatus;
            MOCK_LISTINGS_DATA[jobIndex].lastModified = new Date().toISOString();
            console.log(`📊 Mock data updated: Job ${jobId} status → ${newStatus}`);
            updated = true;
        }
    }
    
    // If not found in mock data, check localStorage (for RELISTED/MODIFIED jobs)
    if (!updated) {
        console.log(`🔍 Job ${jobId} not found in mock data, checking localStorage...`);
        try {
            // Check both localStorage structures: jobPreviewCards and gisugoJobs
            
            // First check: jobPreviewCards structure (direct category mapping)
            const jobPreviewCardsRaw = localStorage.getItem('jobPreviewCards');
            if (jobPreviewCardsRaw) {
                console.log(`🔍 Checking jobPreviewCards structure...`);
                const jobPreviewCards = JSON.parse(jobPreviewCardsRaw);
                
                for (const [category, jobs] of Object.entries(jobPreviewCards)) {
                    if (Array.isArray(jobs)) {
                        const jobIndex = jobs.findIndex(job => job.jobId === jobId);
                        if (jobIndex !== -1) {
                            jobs[jobIndex].status = newStatus;
                            jobs[jobIndex].lastModified = new Date().toISOString();
                            localStorage.setItem('jobPreviewCards', JSON.stringify(jobPreviewCards));
                            console.log(`📊 jobPreviewCards updated: Job ${jobId} in category '${category}' status → ${newStatus}`);
                            updated = true;
                            break;
                        }
                    }
                }
            }
            
            // Second check: gisugoJobs structure (byCategory format)
            if (!updated) {
                const gisugoJobsRaw = localStorage.getItem('gisugoJobs');
                if (gisugoJobsRaw) {
                    console.log(`🔍 Checking gisugoJobs structure...`);
                    const gisugoJobs = JSON.parse(gisugoJobsRaw);
                    
                    // Handle byCategory format
                    if (gisugoJobs.byCategory && Array.isArray(gisugoJobs.byCategory)) {
                        for (const categoryData of gisugoJobs.byCategory) {
                            if (categoryData.jobs && Array.isArray(categoryData.jobs)) {
                                const jobIndex = categoryData.jobs.findIndex(job => job.jobId === jobId);
                                if (jobIndex !== -1) {
                                    categoryData.jobs[jobIndex].status = newStatus;
                                    categoryData.jobs[jobIndex].lastModified = new Date().toISOString();
                                    localStorage.setItem('gisugoJobs', JSON.stringify(gisugoJobs));
                                    console.log(`📊 gisugoJobs (byCategory) updated: Job ${jobId} in category '${categoryData.category}' status → ${newStatus}`);
                                    updated = true;
                                    break;
                                }
                            }
                        }
                    }
                    // Handle direct category mapping format
                    else {
                        for (const [category, jobs] of Object.entries(gisugoJobs)) {
                            if (Array.isArray(jobs)) {
                                const jobIndex = jobs.findIndex(job => job.jobId === jobId);
                                if (jobIndex !== -1) {
                                    jobs[jobIndex].status = newStatus;
                                    jobs[jobIndex].lastModified = new Date().toISOString();
                                    localStorage.setItem('gisugoJobs', JSON.stringify(gisugoJobs));
                                    console.log(`📊 gisugoJobs (direct mapping) updated: Job ${jobId} in category '${category}' status → ${newStatus}`);
                                    updated = true;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            if (!updated) {
                console.log(`🔍 Job ${jobId} not found in any localStorage structure`);
            }
        } catch (error) {
            console.error('❌ Error updating job status in localStorage:', error);
        }
    }
    
    if (!updated) {
        console.warn(`⚠️ Job ${jobId} not found in either mock data or localStorage`);
    }
    
    return updated;
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
        
        // Only refresh if Previous tab is currently active to avoid handler interference
        const currentActiveTab = document.querySelector('.tab-btn.active')?.getAttribute('data-tab');
        if (currentActiveTab === 'previous') {
            console.log('🔄 Previous tab is active, refreshing content...');
            await loadPreviousContent();
        } else {
            console.log('📋 Previous tab is not active, will refresh on next visit');
        }
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
    const escapeListenerKey = addDocumentListener('keydown', escapeHandler);
    registerCleanup('customerFeedback', 'customerFeedbackEscape', () => {
        removeDocumentListener(escapeListenerKey);
    });

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
    blockUnsupportedCharsForInput(textarea);
    
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
    const targetName = overlay.getAttribute('data-customer-name');
    const targetUserId = overlay.getAttribute('data-target-user-id');
    const role = overlay.getAttribute('data-role'); // 'customer' or 'worker'
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
    if (hasUnsupportedTextChars(feedbackText)) {
        showErrorNotification('Feedback has unsupported symbols');
        return;
    }
    
    console.log('💭 Submitting feedback:', {
        jobId,
        targetName,
        targetUserId,
        role,
        rating,
        feedbackText
    });
    
    try {
        showLoadingOverlay('Submitting feedback...');
        
        // Get current user ID
        const currentUserId = firebase.auth().currentUser.uid;
        
        if (role === 'customer') {
            // Customer leaving feedback for worker
            // REUSE the existing submitJobCompletionFeedback function!
            await submitJobCompletionFeedback(
                jobId,
                targetUserId, // worker ID
                currentUserId, // customer ID
                rating,
                feedbackText
            );
        } else {
            // Worker leaving feedback for customer
            const db = firebase.firestore();
            const batch = db.batch();
            const timestamp = firebase.firestore.FieldValue.serverTimestamp();
            
            // Create review document
            const reviewRef = db.collection('reviews').doc();
            batch.set(reviewRef, {
                reviewId: reviewRef.id,
                jobId: jobId,
                reviewerUserId: currentUserId,     // Worker leaving review
                revieweeUserId: targetUserId,      // Customer being reviewed
                reviewerRole: 'worker',
                revieweeRole: 'customer',
                rating: rating,
                feedbackText: feedbackText,
                createdAt: timestamp,
                modifiedAt: timestamp,
                status: 'active',
                helpful: 0,
                reported: false
            });
            
            // Update job document with worker feedback
            const jobRef = db.collection('jobs').doc(jobId);
            batch.set(jobRef, {
                workerFeedbackSubmitted: true,
                workerFeedbackAt: timestamp,
                workerRating: rating,
                workerFeedback: feedbackText
            }, { merge: true });
            
            await batch.commit();
            console.log('✅ Worker feedback and review submitted successfully');
            
            // Send notification to customer about worker feedback
            try {
                if (typeof createNotification === 'function') {
                    const jobDoc = await jobRef.get();
                    const jobData = jobDoc.data();
                    const workerProfile = await getUserProfile(currentUserId);
                    const workerName = workerProfile?.fullName || 'Worker';
                    
                    await createNotification(targetUserId, {
                        type: 'worker_feedback_received',
                        jobId: jobId,
                        jobTitle: jobData.title || 'Completed Gig',
                        message: `${workerName} left ${rating}-star feedback for you on "${jobData.title}"`,
                        actionRequired: false
                    });
                    console.log('✅ Worker feedback notification sent to customer');
                }
            } catch (notifError) {
                console.error('❌ Error creating worker feedback notification:', notifError);
                // Don't fail the feedback submission if notification fails
            }
            
            // Update customer's rating stats (calculate proper average)
            try {
                const customerRef = db.collection('users').doc(targetUserId);
                const customerDoc = await customerRef.get();
                
                let newAverageRating, newTotalReviews;
                
                if (customerDoc.exists) {
                    const customerData = customerDoc.data();
                    const currentAvg = customerData.averageRating || 0;
                    const currentCount = customerData.totalReviews || 0;
                    
                    // Calculate new average: (currentAvg * currentCount + newRating) / (currentCount + 1)
                    newAverageRating = (currentAvg * currentCount + rating) / (currentCount + 1);
                    newTotalReviews = currentCount + 1;
                    
                    console.log(`📊 Updating customer rating: ${currentAvg.toFixed(1)} (${currentCount}) → ${newAverageRating.toFixed(1)} (${newTotalReviews})`);
                } else {
                    // First review for this customer
                    newAverageRating = rating;
                    newTotalReviews = 1;
                    console.log(`📊 Customer's first review: ${rating} stars`);
                }
                
                await customerRef.set({
                    averageRating: newAverageRating,
                    totalReviews: newTotalReviews,
                    lastReviewAt: timestamp
                }, { merge: true });
                
                console.log('✅ Customer rating stats updated');
            } catch (statsError) {
                console.warn('⚠️ Could not update customer stats (non-critical):', statsError.message);
            }
        }
        
        hideLoadingOverlay();
        hideCustomerFeedbackOverlay();
        showFeedbackSubmittedSuccess(targetName);
        
        // Reload completed content to show updated feedback
        if (role === 'customer') {
            await loadPreviousContent(); // Customer view
        } else {
            await loadWorkerCompletedContent(); // Worker view
        }
        
        // Update tab counts
        await updateTabCounts();
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('❌ Error submitting feedback:', error);
        showErrorNotification('Failed to submit feedback: ' + error.message);
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
    const modal = overlay.querySelector('.success-modal');
    const icon = overlay.querySelector('.success-icon');
    
    message.textContent = `Thank you! Your feedback for ${customerName} has been submitted successfully.`;
    
    // Reset animation classes
    modal.classList.remove('celebrate-bounce');
    icon.classList.remove('celebrate-icon');
    
    const okBtn = document.getElementById('feedbackSubmittedOkBtn');
    const okHandler = function() {
        overlay.classList.remove('show');
        modal.classList.remove('celebrate-bounce');
        icon.classList.remove('celebrate-icon');
        okBtn.removeEventListener('click', okHandler);
    };
    okBtn.addEventListener('click', okHandler);
    
    overlay.classList.add('show');
    
    // Trigger celebration animation after a brief delay to ensure show class is applied
    setTimeout(() => {
        modal.classList.add('celebrate-bounce');
        icon.classList.add('celebrate-icon');
    }, 50);
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
    const escapeListenerKey = addDocumentListener('keydown', escapeHandler);
    registerCleanup('dispute', 'disputeEscape', () => {
        removeDocumentListener(escapeListenerKey);
    });

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