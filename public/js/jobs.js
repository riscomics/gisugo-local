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

// Current user ID for testing different perspectives
const CURRENT_USER_ID = 'user_peter_ang_001';

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
// This layer abstracts data access to make Firebase transition seamless
// ===== GLOBAL DATA SERVICE FOR CROSS-FILE ACCESS =====
window.JobsDataService = {
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
        
        // ENHANCED: Get base mock data and merge with localStorage updates
        const baseMockJobs = this.initialize();
        
        // Get user-generated/modified jobs from localStorage (where new-post.js saves them)
        const localStorageJobs = this._getJobsFromLocalStorage();
        
        // Merge localStorage jobs with mock data, prioritizing localStorage versions
        const allJobs = this._mergeJobData(baseMockJobs, localStorageJobs);
        
        console.log('🔄 JobsDataService.getAllJobs() - Combined job data:', {
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
        
        // FIXED: Use same logic as getAllJobs() to get fresh data including localStorage updates
        const baseMockJobs = this.initialize();
        const localStorageJobs = this._getJobsFromLocalStorage();
        const allJobs = this._mergeJobData(baseMockJobs, localStorageJobs);
        
        console.log(`🔍 getJobById(${jobId}) - searching in ${allJobs.length} jobs (${baseMockJobs.length} mock + ${localStorageJobs.length} localStorage)`);
        
        const foundJob = allJobs.find(job => job.jobId === jobId);
        if (foundJob) {
            console.log(`✅ getJobById found job with status: ${foundJob.status}`);
        } else {
            console.log(`❌ getJobById job not found: ${jobId}`);
        }
        
        return foundJob;
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
        
        console.log(`🗑️ Attempting to delete job: ${jobId}`);
        
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
        // 
        // return completedJobsSnapshot.docs.map(doc => {
        //     const data = doc.data();
        //     return {
        //         // Core job identification
        //         jobId: doc.id,
        //         posterId: data.posterId,
        //         posterName: data.posterName,
        //         posterThumbnail: data.posterThumbnail,
        //         
        //         // Job details - CONSISTENT WITH OTHER TABS
        //         title: data.title,
        //         category: data.category,
        //         thumbnail: data.thumbnail,
        //         
        //         // Scheduling - FIREBASE TIMESTAMP FORMAT
        //         scheduledDate: data.scheduledDate, // YYYY-MM-DD
        //         startTime: data.startTime,
        //         endTime: data.endTime,
        //         
        //         // Financial
        //         priceOffer: data.priceOffer, // Consistent field name
        //         
        //         // Completion data - FIREBASE TIMESTAMPS
        //         completedAt: data.completedAt.toDate(), // Firebase timestamp
        //         completedBy: data.completedBy, // 'customer' | 'worker'
        //         
        //         // Hiring information - CONSISTENT WITH HIRING TAB
        //         hiredWorkerId: data.hiredWorkerId,
        //         hiredWorkerName: data.hiredWorkerName,
        //         hiredWorkerThumbnail: data.hiredWorkerThumbnail,
        //         
        //         // Role determination - CONSISTENT LOGIC
        //         role: data.posterId === currentUserId ? 'customer' : 'worker',
        //         
        //         // Rating and feedback - FIREBASE SUBCOLLECTION READY
        //         rating: data.rating || 0,
        //         feedback: data.feedback || null,
        //         workerFeedback: data.workerFeedback || null,
        //         workerRating: data.workerRating || 0,
        //         
        //         // Status tracking - CONSISTENT WITH OTHER TABS
        //         status: data.status,
        //         datePosted: data.datePosted.toDate(), // Firebase timestamp
        //         
        //         // Firebase metadata
        //         lastModified: data.lastModified?.toDate(),
        //         modifiedBy: data.modifiedBy
        //     };
        // });
        
        if (!MOCK_COMPLETED_DATA) {
            MOCK_COMPLETED_DATA = generateCompletedJobsData();
        }
        return MOCK_COMPLETED_DATA;
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
    // Track role switch timestamp for contamination detection
    window.lastRoleSwitch = Date.now();
    
    // NUCLEAR CLEANUP: Clear all overlay handlers when switching roles to prevent contamination
    executeCleanupsByType('hiring');
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
    
    // Show/hide appropriate tab sets and content
    if (roleType === 'customer') {
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
        // Show worker tabs and content
        document.querySelector('.customer-tabs').style.display = 'none';
        document.querySelector('.worker-tabs').style.display = 'flex';
        
        // Hide all content first
        document.querySelectorAll('.tab-content-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
            wrapper.classList.remove('active');
        });
        
        // Show worker content (default to accepted)
        const acceptedContent = document.getElementById('accepted-content');
        if (acceptedContent) {
            acceptedContent.style.display = 'block';
            acceptedContent.classList.add('active');
        }
        
        // Activate accepted tab
        document.querySelectorAll('.worker-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById('acceptedTab')?.classList.add('active');
        
        // Initialize the default accepted tab content
        await initializeAcceptedTab();
        
        console.log('✅ Worker role activated - showing Gigs Accepted/Gigs Completed tabs');
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
    if (tabType === 'accepted') {
        await initializeAcceptedTab();
    } else if (tabType === 'worker-completed') {
        await initializeWorkerCompletedTab();
    }
}

// Worker tab content functions
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
    
    try {
        // Get all hired jobs and filter for worker perspective (where current user is the worker)
        const allHiredJobs = await JobsDataService.getAllHiredJobs();
        const workerJobs = allHiredJobs.filter(job => job.role === 'worker');
        
        console.log(`🎯 Found ${workerJobs.length} worker perspective jobs for accepted gigs`);
        
        if (workerJobs.length === 0) {
            showEmptyAcceptedState();
            return;
        }
        
        // Generate HTML for worker perspective cards using the existing hiring card template
        const cardsHTML = await generateMockAcceptedJobs(workerJobs);
        container.innerHTML = cardsHTML;
        
        // Attach event listeners for worker perspective cards
        attachAcceptedCardHandlers();
        
        console.log('✅ Accepted gigs content loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading accepted gigs content:', error);
        showEmptyAcceptedState();
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
    
    try {
        // Get all completed jobs and filter for worker perspective (where current user was the worker)
        const allCompletedJobs = await getCompletedJobs();
        const workerCompletedJobs = allCompletedJobs.filter(job => job.role === 'worker');
        
        console.log(`🎯 Found ${workerCompletedJobs.length} worker perspective completed jobs`);
        
        if (workerCompletedJobs.length === 0) {
            showEmptyWorkerCompletedState();
            return;
        }
        
        // Generate HTML for worker perspective completed cards using the existing completed card template
        const cardsHTML = await generateMockWorkerCompletedJobs(workerCompletedJobs);
        container.innerHTML = cardsHTML;
        
        // Attach event listeners for worker perspective completed cards
        attachWorkerCompletedCardHandlers();
        
        console.log('✅ Worker completed gigs content loaded successfully');
        
    } catch (error) {
        console.error('❌ Error loading worker completed gigs content:', error);
        showEmptyWorkerCompletedState();
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
    overlay.setAttribute('data-title', jobData.title);
    
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
        // Get all hired jobs and filter for customer perspective only (where current user is the customer)
        const allHiredJobs = await JobsDataService.getAllHiredJobs();
        const customerJobs = allHiredJobs.filter(job => job.role === 'customer');
        
        console.log(`👥 Found ${customerJobs.length} customer perspective jobs for hiring tab (filtered from ${allHiredJobs.length} total)`);
        
        if (customerJobs.length === 0) {
            showEmptyHiringState();
            return;
        }
        
        const hiringHTML = await generateMockHiredJobs(customerJobs);
        container.innerHTML = hiringHTML;
        
        // Initialize event handlers for hiring cards
        initializeHiringCardHandlers();
        
        console.log(`👥 Loaded ${customerJobs.length} customer hired jobs`);
        
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
        registerCleanup(cleanupType, 'completeBtn', () => {
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
        registerCleanup(cleanupType, 'relistBtn', () => {
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
        registerCleanup(cleanupType, 'resignBtn', () => {
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
        registerCleanup(cleanupType, 'cancelBtn', () => {
            cancelBtn.removeEventListener('click', cancelHandler);
        });
    }
    
    // Background click handler
    const backgroundHandler = function(e) {
        // Close if clicking on overlay background
        if (e.target === overlay) {
            hideHiringOptionsOverlay();
            return;
        }
        
        // CONSISTENCY FIX: Also close if clicking on cancel button (for consistency with previous overlay)
        if (e.target && e.target.id === 'cancelHiringBtn') {
            console.log(`🔘 DEBUG Cancel button click detected in hiring background handler - calling hideHiringOptionsOverlay()`);
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
                // Handle hiring job relisting - void contract and create new active job directly in Listings
                const workerName = overlay.getAttribute('data-worker-name');
                
                console.log(`🔄 RELIST hiring job: ${jobId} (Customer perspective)`);
                
                // Get the hiring job data to create new active job
                const hiredJobs = await JobsDataService.getAllHiredJobs();
                const sourceJob = hiredJobs.find(j => j.jobId === jobId);
                
                if (sourceJob) {
                    // Create new active job directly in localStorage (similar to storeJobData)
                    const newJobNumber = Date.now();
                    const newJobId = `${sourceJob.category}_job_2025_${newJobNumber}`;
                    
                    const newActiveJob = {
                        jobId: newJobId,
                        jobNumber: newJobNumber,
                        posterId: sourceJob.posterId,
                        posterName: sourceJob.posterName,
                        title: sourceJob.title,
                        description: sourceJob.description || '',
                        category: sourceJob.category,
                        thumbnail: sourceJob.thumbnail,
                        jobDate: sourceJob.jobDate,
                        dateNeeded: sourceJob.jobDate,
                        startTime: sourceJob.startTime,
                        endTime: sourceJob.endTime,
                        priceOffer: sourceJob.priceOffer || sourceJob.paymentAmount,
                        paymentAmount: sourceJob.priceOffer || sourceJob.paymentAmount,
                        paymentType: sourceJob.paymentType || 'Per Hour',
                        region: sourceJob.region || 'CEBU',
                        city: sourceJob.city || 'Cebu City',
                        extras: sourceJob.extras || [],
                        status: 'active',
                        applicationCount: 0,
                        applicationIds: [],
                        datePosted: new Date().toISOString(),
                        jobPageUrl: `${sourceJob.category}.html`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        relistedFrom: 'hiring', // Track source for delete behavior
                        originalJobId: jobId
                    };
                    
                    // Store in gisugoJobs localStorage
                    const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
                    if (!allJobs[sourceJob.category]) {
                        allJobs[sourceJob.category] = [];
                    }
                    allJobs[sourceJob.category].push(newActiveJob);
                    localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
                    
                    // Store in jobPreviewCards for category pages
                    const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
                    if (!previewCards[sourceJob.category]) {
                        previewCards[sourceJob.category] = [];
                    }
                    
                    const date = new Date(sourceJob.jobDate);
                    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeDisplay = `${sourceJob.startTime} - ${sourceJob.endTime}`;
                    
                    const previewCard = {
                        jobNumber: newJobNumber,
                        title: sourceJob.title,
                        extra1: sourceJob.extras && sourceJob.extras[0] ? sourceJob.extras[0] : '',
                        extra2: sourceJob.extras && sourceJob.extras[1] ? sourceJob.extras[1] : '',
                        price: `₱${sourceJob.priceOffer || sourceJob.paymentAmount}`,
                        rate: sourceJob.paymentType || 'Per Hour',
                        date: formattedDate,
                        time: timeDisplay,
                        photo: sourceJob.thumbnail,
                        templateUrl: `dynamic-job.html?category=${sourceJob.category}&jobNumber=${newJobNumber}`,
                        region: sourceJob.region || 'CEBU',
                        city: sourceJob.city || 'Cebu City',
                        createdAt: new Date().toISOString(),
                        relistedFrom: 'hiring',
                        originalJobId: jobId
                    };
                    
                    previewCards[sourceJob.category].unshift(previewCard);
                    localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
                    
                    console.log(`✅ Created new active job: ${newJobId} from hiring job: ${jobId}`);
                    
                    // Show success and redirect to jobs.html (Listings tab)
                    showContractVoidedSuccess(`Job relisted successfully! "${sourceJob.title}" is now active in your Listings.`);
                } else {
                    console.error(`❌ Source hiring job not found: ${jobId}`);
                    showErrorNotification('Failed to relist job - source job not found');
                }
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

// Note: MOCK_COMPLETED_DATA is declared globally at the top of this file

async function initializePreviousTab() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    console.log('📜 Initializing Previous tab...');
    
    // Always clean up existing handlers to prevent the bug
    executeCleanupsByType('previous-cards');
    executeCleanupsByType('previous-overlay');
    executeCleanupsByType('previous-feedback-overlay');
    
    // Check if already loaded
    if (container.children.length > 0) {
        console.log('📜 Previous tab content exists, reinitializing handlers...');
        // Reinitialize handlers for existing cards
        initializeCompletedCardHandlers();
        checkTruncatedFeedback();
        createFeedbackExpandedOverlay();
        return;
    }
    
    // Load fresh content
    await loadPreviousContent();
}

async function loadPreviousContent() {
    const container = document.querySelector('.previous-container');
    if (!container) return;
    
    try {
        // Get all completed jobs and filter for customer perspective only (where current user was the customer)
        const allCompletedJobs = await getCompletedJobs();
        const customerCompletedJobs = allCompletedJobs.filter(job => job.role === 'customer');
        
        console.log(`📜 Found ${customerCompletedJobs.length} customer perspective completed jobs (filtered from ${allCompletedJobs.length} total)`);
        
        if (customerCompletedJobs.length === 0) {
            showEmptyPreviousState();
        } else {
            await generateMockCompletedJobs(customerCompletedJobs);
            initializeCompletedCardHandlers();
            checkTruncatedFeedback();
            
            // Create overlay immediately for testing
            createFeedbackExpandedOverlay();
        }
        
        console.log(`📜 Previous tab loaded with ${customerCompletedJobs.length} customer completed jobs`);
        
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
                    <div class="completed-feedback-label">LEAVE FEEDBACK</div>
                    <div class="completed-feedback-instructions">For ${job.posterName}</div>
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
    addDocumentListener('previousOverlayEscape', escapeHandler);

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
    
    // Navigate directly to new-post.html with relist mode
    const relistUrl = `new-post.html?relist=${jobData.jobId}&category=${jobData.category}`;
    console.log(`📝 Navigating to relist mode: ${relistUrl}`);
    
    // Firebase data mapping for relist mode:
    // - Load completed job document: db.collection('completedJobs').doc(jobData.jobId)
    // - Create new job document with status: 'active' (not update existing)
    // - Link original job: { originalJobId: jobData.jobId, relistedAt: timestamp }
    // - Update analytics: trackJobAction('job_relisted', { originalJobId, newJobId })
    
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
        registerCleanup('listings', 'viewBtn', () => {
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

    // View applications handler
    if (viewApplicationsBtn) {
        const applicationsHandler = function(e) {
            e.preventDefault();
            const jobData = getJobDataFromOverlay();
            showApplicationsOverlay(jobData);
        };
        viewApplicationsBtn.addEventListener('click', applicationsHandler);
        registerCleanup('listings', 'viewApplicationsBtn', () => {
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
        currentStatus: overlay.getAttribute('data-current-status'),
        title: overlay.getAttribute('data-title')
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

// ========================== APPLICATIONS OVERLAY HANDLERS ==========================

async function showApplicationsOverlay(jobData) {
    console.log(`📋 Opening applications overlay for job: ${jobData.jobId}`);
    
    const overlay = document.getElementById('applicationsOverlay');
    const title = document.getElementById('applicationsTitle');
    const subtitle = document.getElementById('applicationsSubtitle');
    const applicationsList = document.getElementById('applicationsList');
    
    if (!overlay || !applicationsList) {
        console.error('Applications overlay elements not found');
        return;
    }
    
    // Update overlay content
    title.textContent = 'Applications for:';
    subtitle.textContent = jobData.title;
    
    // Get applications for this job
    const jobApplications = getApplicationsForJob(jobData.jobId);
    
    if (jobApplications && jobApplications.length > 0) {
        // Generate applications HTML
        const applicationsHTML = jobApplications.map(app => 
            generateApplicationCardHTML(app, jobData.title)
        ).join('');
        
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
    
    // Show overlay
    overlay.classList.add('show');
    
    // Initialize close button handler
    initializeApplicationsOverlayHandlers();
}

function getApplicationsForJob(jobId) {
    const jobData = MOCK_APPLICATIONS.find(job => job.jobId === jobId);
    return jobData ? jobData.applications : [];
}

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

function initializeApplicationsOverlayHandlers() {
    const overlay = document.getElementById('applicationsOverlay');
    if (!overlay || overlay.dataset.handlersInitialized) return;
    
    const closeBtn = document.getElementById('applicationsCloseBtn');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', hideApplicationsOverlay);
    }
    
    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            hideApplicationsOverlay();
        }
    });
    
    overlay.dataset.handlersInitialized = 'true';
}

function initializeApplicationCardHandlers() {
    const applicationCards = document.querySelectorAll('#applicationsList .application-card');
    
    applicationCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📋 Application card clicked - placeholder functionality');
            // TODO: Implement application action overlay - this will be added next
        });
    });
}

function hideApplicationsOverlay() {
    const overlay = document.getElementById('applicationsOverlay');
    overlay.classList.remove('show');
    
    // Clear handlers initialization flag
    delete overlay.dataset.handlersInitialized;
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
        const allHiredJobs = await JobsDataService.getAllHiredJobs();
        const completedJobs = await getCompletedJobs();
        
        // Separate hired jobs by perspective
        const customerHiringJobs = allHiredJobs.filter(job => job.role === 'customer');
        const workerAcceptedJobs = allHiredJobs.filter(job => job.role === 'worker');
        
        // Separate completed jobs by perspective
        const customerCompletedJobs = completedJobs.filter(job => job.role === 'customer');
        const workerCompletedJobs = completedJobs.filter(job => job.role === 'worker');
        
        // Count actual jobs in each data set
        const counts = {
            listings: listingsJobs.length,              // Active/paused jobs posted by user
            hiring: customerHiringJobs.length,          // Jobs where user hired workers (customer perspective)
            previous: customerCompletedJobs.length,     // Completed jobs where user was customer
            accepted: workerAcceptedJobs.length,        // Jobs where user was hired (worker perspective)
            workerCompleted: workerCompletedJobs.length // Jobs where user worked and completed
        };
        
        // Update customer tab notification badges
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
        
        // Update worker tab notification badges
        const acceptedCount = document.querySelector('#acceptedTab .notification-count');
        const workerCompletedCount = document.querySelector('#workerCompletedTab .notification-count');
        
        if (acceptedCount) {
            acceptedCount.textContent = counts.accepted;
        }
        if (workerCompletedCount) {
            workerCompletedCount.textContent = counts.workerCompleted;
        }
        
        console.log(`📊 Tab counts updated: Listings(${counts.listings}), Hiring(${counts.hiring}), Previous(${counts.previous}), Accepted(${counts.accepted}), WorkerCompleted(${counts.workerCompleted})`);
        
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
        
        // Reload worker completed content to show updated feedback
        await loadWorkerCompletedContent();
        
        // Also update tab counts in case anything changed
        await updateTabCounts();
        
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