// ============================================================================
// 🗃️ FIREBASE FIRESTORE DATABASE MODULE - GISUGO
// ============================================================================
// 
// This module handles all Firestore database operations:
// - Jobs CRUD operations
// - Applications management
// - Chat/Messages
// - Notifications
// - Admin analytics
//
// ============================================================================

// ============================================================================
// JOBS COLLECTION
// ============================================================================

/**
 * Create a new job posting
 * @param {Object} jobData - Job data to create
 * @returns {Promise<Object>} - Result with jobId
 */
async function createJob(jobData) {
  const db = getFirestore();
  
  if (!db) {
    // Offline mode - use localStorage
    return createJobOffline(jobData);
  }
  
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'You must be logged in to post a job' };
    }
    
    // Get user profile from Firestore for accurate poster info
    let posterName = currentUser.displayName || 'Anonymous';
    let posterThumbnail = currentUser.photoURL || '';
    
    console.log('🔍 Fetching user profile from Firestore for:', currentUser.uid);
    console.log('📋 Current Auth data:', { 
      displayName: currentUser.displayName, 
      photoURL: currentUser.photoURL 
    });
    
    try {
      const userProfile = await getUserProfile(currentUser.uid);
      console.log('📦 Firestore profile result:', userProfile);
      
      if (userProfile) {
        console.log('✅ Using Firestore profile data:', {
          fullName: userProfile.fullName,
          profilePhoto: userProfile.profilePhoto
        });
        posterName = userProfile.fullName || posterName;
        posterThumbnail = userProfile.profilePhoto || posterThumbnail;
      } else {
        console.warn('⚠️ No Firestore profile found, using Auth data');
      }
    } catch (error) {
      console.error('❌ Error fetching user profile:', error);
      console.warn('⚠️ Falling back to Auth data:', { posterName, posterThumbnail });
    }
    
    console.log('🎯 Final poster data:', { posterName, posterThumbnail });
    
    const jobDoc = {
      // Basic Job Information
      posterId: currentUser.uid,
      posterName: posterName,
      posterThumbnail: posterThumbnail,
      title: jobData.title || jobData.jobTitle,
      description: jobData.description || '',
      category: jobData.category,
      thumbnail: jobData.thumbnail || jobData.photo || '',
      
      // Location
      region: jobData.region || 'CEBU',
      city: jobData.city || 'CEBU CITY',
      
      // Scheduling (convert date string to Timestamp in local timezone)
      scheduledDate: jobData.jobDate ? (() => {
        const [year, month, day] = jobData.jobDate.split('-').map(Number);
        return firebase.firestore.Timestamp.fromDate(new Date(year, month - 1, day));
      })() : (jobData.scheduledDate || null),
      startTime: jobData.startTime,
      endTime: jobData.endTime,
      
      // Pricing
      priceOffer: jobData.priceOffer || jobData.paymentAmount,
      paymentType: jobData.paymentType || 'Per Hour',
      
      // Extras (category-specific fields)
      extras: jobData.extras || [],
      
      // Status
      status: 'active',
      datePosted: firebase.firestore.FieldValue.serverTimestamp(),
      lastModified: firebase.firestore.FieldValue.serverTimestamp(),
      
      // Applications
      applicationCount: 0,
      applicationIds: [],
      
      // Technical
      jobPageUrl: `dynamic-job.html?category=${jobData.category}&jobNumber=`
    };
    
    const docRef = await db.collection('jobs').add(jobDoc);
    
    // Update the jobPageUrl with the actual ID
    await docRef.update({
      jobPageUrl: `dynamic-job.html?category=${jobData.category}&jobNumber=${docRef.id}`
    });
    
    console.log('✅ Job created with ID:', docRef.id);
    
    return {
      success: true,
      jobId: docRef.id,
      message: 'Job posted successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error creating job:', error);
    return { success: false, message: error.message };
  }
}

// Create job in localStorage for offline mode
function createJobOffline(jobData) {
  const jobId = `${jobData.category}_job_${Date.now()}`;
  const category = jobData.category;
  
  // Get current user info from Firebase Auth
  const auth = getFirebaseAuth();
  const currentUser = auth ? auth.currentUser : null;
  const posterId = currentUser?.uid || getCurrentUserId() || 'offline_user';
  const posterName = currentUser?.displayName || 'Demo User';
  const posterThumbnail = currentUser?.photoURL || '';
  
  const jobDoc = {
    jobId: jobId,
    jobNumber: Date.now().toString(),
    posterId: posterId,
    posterName: posterName,
    posterThumbnail: posterThumbnail,
    title: jobData.title || jobData.jobTitle,
    description: jobData.description || '',
    category: category,
    thumbnail: jobData.thumbnail || jobData.photo || '',
    photo: jobData.thumbnail || jobData.photo || '',
    region: jobData.region || 'CEBU',
    city: jobData.city || 'CEBU CITY',
    jobDate: jobData.jobDate || jobData.scheduledDate,
    startTime: jobData.startTime,
    endTime: jobData.endTime,
    priceOffer: jobData.priceOffer || jobData.paymentAmount,
    paymentType: jobData.paymentType || 'Per Hour',
    paymentAmount: jobData.priceOffer || jobData.paymentAmount,
    extras: jobData.extras || [],
    status: 'active',
    datePosted: new Date().toISOString(),
    applicationCount: 0
  };
  
  // Store in localStorage
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  if (!jobs[category]) {
    jobs[category] = [];
  }
  jobs[category].push(jobDoc);
  localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
  
  // Also store in job preview cards format
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  if (!previewCards[category]) {
    previewCards[category] = [];
  }
  
  const previewCard = {
    id: jobId,
    jobNumber: jobDoc.jobNumber,
    category: category,
    title: jobDoc.title,
    photo: jobDoc.photo,
    extra1: jobData.extras?.[0] || '',
    extra2: jobData.extras?.[1] || '',
    price: `₱${jobDoc.priceOffer}`,
    rate: jobDoc.paymentType,
    date: formatDateForPreview(jobDoc.jobDate),
    time: `${jobDoc.startTime} - ${jobDoc.endTime}`,
    region: jobDoc.region,
    city: jobDoc.city,
    status: 'active',
    templateUrl: `dynamic-job.html?category=${category}&jobNumber=${jobDoc.jobNumber}`,
    createdAt: jobDoc.datePosted
  };
  
  previewCards[category].push(previewCard);
  localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
  
  console.log('✅ Job created offline:', jobId);
  
  return {
    success: true,
    jobId: jobId,
    message: 'Job posted successfully! (Offline mode)'
  };
}

// Format date for preview cards
function formatDateForPreview(dateStr) {
  if (!dateStr) return 'TBD';
  
  // Parse in local timezone to avoid date rollback
  let date;
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-').map(Number);
    date = new Date(year, month - 1, day);
  } else {
    date = new Date(dateStr);
  }
  
  if (isNaN(date.getTime())) return 'TBD';
  
  // Return full date with year (YYYY-MM-DD format) for proper sorting and expiration checking
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get a single job by ID
 * @param {string} jobId - The job document ID
 * @returns {Promise<Object|null>} - Job data or null if not found
 */
async function getJobById(jobId) {
  const db = getFirestore();
  
  if (!db) {
    // Offline mode - search localStorage
    return getJobByIdOffline(jobId);
  }
  
  try {
    const doc = await db.collection('jobs').doc(jobId).get();
    
    if (doc.exists) {
      const jobData = {
        id: doc.id,
        jobId: doc.id,
        ...doc.data()
      };
      console.log('✅ Job found:', jobId);
      return jobData;
    } else {
      console.log('⚠️ Job not found:', jobId);
      return null;
    }
    
  } catch (error) {
    console.error('❌ Error getting job:', error);
    return null;
  }
}

// Get job from localStorage for offline mode
function getJobByIdOffline(jobId) {
  // Search through all categories in localStorage
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  for (const category of Object.keys(allJobs)) {
    const jobs = allJobs[category] || [];
    const found = jobs.find(job => job.jobId === jobId || job.id === jobId);
    if (found) {
      return found;
    }
  }
  
  // Also check preview cards
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  for (const category of Object.keys(previewCards)) {
    const jobs = previewCards[category] || [];
    const found = jobs.find(job => job.jobId === jobId || job.id === jobId);
    if (found) {
      return found;
    }
  }
  
  return null;
}

/**
 * Get jobs by category with filters
 * @param {string} category - Job category
 * @param {Object} filters - Filter options (region, city, payType)
 * @returns {Promise<Array>} - Array of jobs
 */
async function getJobsByCategory(category, filters = {}) {
  const db = getFirestore();
  
  if (!db) {
    // Offline mode - use localStorage
    return getJobsByCategoryOffline(category, filters);
  }
  
  try {
    // Simplified query - only category + status (no composite index needed)
    let query = db.collection('jobs')
      .where('category', '==', category)
      .where('status', '==', 'active');
    
    const snapshot = await query.get();
    
    let jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Client-side filtering (all filters done here to avoid indexes)
    if (filters.region) {
      jobs = jobs.filter(job => job.region === filters.region);
    }
    
    if (filters.payType && filters.payType !== 'PAY TYPE') {
      jobs = jobs.filter(job => 
        job.paymentType?.toUpperCase() === filters.payType.toUpperCase()
      );
    }
    
    // Client-side sorting by date posted
    jobs.sort((a, b) => {
      const dateA = a.datePosted?.toDate ? a.datePosted.toDate() : new Date(0);
      const dateB = b.datePosted?.toDate ? b.datePosted.toDate() : new Date(0);
      return dateB - dateA; // Newest first
    });
    
    console.log(`📋 Found ${jobs.length} jobs in category: ${category}`);
    return jobs;
    
  } catch (error) {
    console.error('❌ Error getting jobs:', error);
    return [];
  }
}

// Get jobs from localStorage for offline mode
function getJobsByCategoryOffline(category, filters = {}) {
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  let jobs = previewCards[category] || [];
  
  // Apply filters
  if (filters.region) {
    jobs = jobs.filter(job => job.region === filters.region);
  }
  
  if (filters.payType && filters.payType !== 'PAY TYPE') {
    jobs = jobs.filter(job => 
      job.rate?.toUpperCase() === filters.payType.toUpperCase()
    );
  }
  
  console.log(`📋 Found ${jobs.length} jobs offline in category: ${category}`);
  return jobs;
}

/**
 * Get user's job listings (as poster)
 * @param {string} userId - User ID
 * @param {Array} statuses - Array of status values to filter
 * @returns {Promise<Array>} - Array of jobs
 */
async function getUserJobListings(userId, statuses = ['active', 'paused']) {
  const db = getFirestore();
  
  if (!db) {
    return getUserJobListingsOffline(userId, statuses);
  }
  
  console.log(`🔍 Fetching jobs for user: ${userId}, statuses: ${statuses.join(', ')}`);
  
  try {
    // Query for jobs where user is the poster
    const posterSnapshot = await db.collection('jobs')
      .where('posterId', '==', userId)
      .get();
    
    // Query for jobs where user is the hired worker
    const workerSnapshot = await db.collection('jobs')
      .where('hiredWorkerId', '==', userId)
      .get();
    
    console.log(`📊 Raw Firestore results: ${posterSnapshot.docs.length} as poster, ${workerSnapshot.docs.length} as worker`);
    
    // Combine both snapshots and remove duplicates
    const allDocs = [...posterSnapshot.docs, ...workerSnapshot.docs];
    const uniqueJobIds = new Set();
    const uniqueDocs = allDocs.filter(doc => {
      if (uniqueJobIds.has(doc.id)) return false;
      uniqueJobIds.add(doc.id);
      return true;
    });
    
    // Map to job objects, filter by status, and add role
    const jobs = uniqueDocs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          jobId: doc.id, // Ensure jobId is set
          ...data,
          // Determine role: customer if they posted it, worker if they were hired
          role: data.posterId === userId ? 'customer' : 'worker'
        };
      })
      .filter(job => statuses.includes(job.status))
      .sort((a, b) => {
        // Sort by datePosted descending
        const dateA = a.datePosted?.toDate?.() || new Date(a.datePosted) || new Date(0);
        const dateB = b.datePosted?.toDate?.() || new Date(b.datePosted) || new Date(0);
        return dateB - dateA;
      });
    
    console.log(`✅ Filtered & sorted jobs: ${jobs.length}`);
    return jobs;
    
  } catch (error) {
    console.error('❌ Error getting user listings:', error);
    
    // Check if it's an index error
    if (error.message && error.message.includes('index')) {
      console.error('📋 Firestore composite index required. Check the error link above.');
    }
    
    return [];
  }
}

function getUserJobListingsOffline(userId, statuses) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  let userJobs = [];
  
  Object.values(jobs).forEach(categoryJobs => {
    const filtered = categoryJobs.filter(job => 
      job.posterId === userId && statuses.includes(job.status)
    );
    userJobs = userJobs.concat(filtered);
  });
  
  return userJobs.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
}

/**
 * Update an existing job (for edit mode)
 * @param {string} jobId - Job document ID
 * @param {Object} jobData - Updated job data
 * @returns {Promise<Object>} - Result object
 */
async function updateJob(jobId, jobData) {
  const db = getFirestore();
  
  if (!db) {
    return updateJobOffline(jobId, jobData);
  }
  
  try {
    // First, get the existing job to preserve fields that shouldn't be changed
    const existingJob = await db.collection('jobs').doc(jobId).get();
    const existingData = existingJob.data();
    
    // Smart category handling: never save 'unknown' or empty, preserve existing
    let finalCategory = jobData.category;
    if (!finalCategory || finalCategory === 'unknown' || finalCategory === '') {
      finalCategory = existingData?.category;
      
      // If existing is also empty, try to infer from jobPageUrl
      if (!finalCategory && existingData?.jobPageUrl) {
        const match = existingData.jobPageUrl.match(/category=([^&]+)/);
        if (match) {
          finalCategory = match[1];
          console.log(`📍 Inferred category from jobPageUrl: ${finalCategory}`);
        }
      }
      
      if (!finalCategory) {
        finalCategory = '';
      }
      console.log(`⚠️ Invalid category provided, resolved to: ${finalCategory}`);
    }
    
    const updateData = {
      title: jobData.title || '',
      description: jobData.description || '',
      category: finalCategory,
      thumbnail: jobData.thumbnail || jobData.photo || existingData?.thumbnail || '',
      region: jobData.region || 'CEBU',
      city: jobData.city || 'CEBU CITY',
      scheduledDate: jobData.jobDate ? (() => {
        const [year, month, day] = jobData.jobDate.split('-').map(Number);
        return firebase.firestore.Timestamp.fromDate(new Date(year, month - 1, day));
      })() : (jobData.scheduledDate || null),
      startTime: jobData.startTime,
      endTime: jobData.endTime,
      priceOffer: jobData.priceOffer || jobData.paymentAmount,
      paymentType: jobData.paymentType || 'Per Hour',
      extras: jobData.extras || [],
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('jobs').doc(jobId).update(updateData);
    console.log(`✅ Job ${jobId} updated`);
    return { success: true, message: 'Job updated', jobId };
  } catch (error) {
    console.error('❌ Error updating job:', error);
    return { success: false, message: error.message };
  }
}

function updateJobOffline(jobId, jobData) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  for (const category of Object.keys(jobs)) {
    const jobIndex = jobs[category].findIndex(j => j.jobId === jobId || j.id === jobId);
    if (jobIndex !== -1) {
      const existingJob = jobs[category][jobIndex];
      jobs[category][jobIndex] = {
        ...existingJob,
        ...jobData,
        datePosted: existingJob.datePosted,
        createdAt: existingJob.createdAt,
        applicationCount: existingJob.applicationCount || 0,
        applicationIds: existingJob.applicationIds || [],
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
      return { success: true, message: 'Job updated (offline)', jobId };
    }
  }
  return { success: false, message: 'Job not found' };
}

/**
 * Update job status
 * @param {string} jobId - Job document ID
 * @param {string} newStatus - New status value
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<Object>} - Result object
 */
async function updateJobStatus(jobId, newStatus, additionalData = {}) {
  const db = getFirestore();
  
  if (!db) {
    return updateJobStatusOffline(jobId, newStatus, additionalData);
  }
  
  try {
    await db.collection('jobs').doc(jobId).update({
      status: newStatus,
      lastModified: firebase.firestore.FieldValue.serverTimestamp(),
      ...additionalData
    });
    
    console.log(`✅ Job ${jobId} status updated to: ${newStatus}`);
    return { success: true, message: 'Job updated successfully' };
    
  } catch (error) {
    console.error('❌ Error updating job:', error);
    return { success: false, message: error.message };
  }
}

function updateJobStatusOffline(jobId, newStatus, additionalData) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  for (const category of Object.keys(jobs)) {
    const jobIndex = jobs[category].findIndex(j => j.jobId === jobId || j.id === jobId);
    if (jobIndex !== -1) {
      jobs[category][jobIndex] = {
        ...jobs[category][jobIndex],
        status: newStatus,
        ...additionalData
      };
      localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
      return { success: true, message: 'Job updated (offline)' };
    }
  }
  
  return { success: false, message: 'Job not found' };
}

/**
 * Delete a job with comprehensive cleanup (Firestore + Storage)
 * @param {string} jobId - Job document ID
 * @returns {Promise<Object>} - Result object
 */
async function deleteJob(jobId) {
  const db = getFirestore();
  
  if (!db) {
    return deleteJobOffline(jobId);
  }
  
  try {
    // Get job data for audit and photo cleanup
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      return { success: false, message: 'Job not found' };
    }
    
    const jobData = jobDoc.data();
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Delete photo from Firebase Storage (if it's a Storage URL)
    // ═══════════════════════════════════════════════════════════════
    if (jobData.thumbnail) {
      const isStorageUrl = jobData.thumbnail.includes('firebasestorage.googleapis.com') || 
                          jobData.thumbnail.includes('storage.googleapis.com');
      
      if (isStorageUrl) {
        console.log('🗑️ Deleting photo from Firebase Storage...');
        
        try {
          // Extract storage path from URL
          const storage = getFirebaseStorage();
          if (storage) {
            // Method 1: Try to extract path from URL
            let storagePath = null;
            
            // Parse URL to get the file path
            const url = new URL(jobData.thumbnail);
            const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
            
            if (pathMatch) {
              storagePath = decodeURIComponent(pathMatch[1]);
              console.log('📍 Extracted storage path:', storagePath);
              
              // Delete the file
              const fileRef = storage.ref().child(storagePath);
              await fileRef.delete();
              console.log('✅ Photo deleted from Storage');
            } else {
              console.warn('⚠️ Could not extract storage path from URL');
            }
          }
        } catch (storageError) {
          // Don't fail the entire deletion if photo deletion fails
          if (storageError.code === 'storage/object-not-found') {
            console.warn('⚠️ Photo already deleted from Storage');
          } else {
            console.error('❌ Error deleting photo from Storage:', storageError);
          }
        }
      } else {
        console.log('ℹ️ Photo is base64/local, no Storage cleanup needed');
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Delete associated applications & update applicant statistics
    // ═══════════════════════════════════════════════════════════════
    if (jobData.applicationIds && jobData.applicationIds.length > 0) {
      console.log(`🗑️ Deleting ${jobData.applicationIds.length} associated applications...`);
      
      // First, get applicant IDs before deleting (we need this data for statistics)
      const applicantIds = [];
      try {
        const appPromises = jobData.applicationIds.map(appId => 
          db.collection('applications').doc(appId).get()
        );
        const appDocs = await Promise.all(appPromises);
        
        appDocs.forEach(appDoc => {
          if (appDoc.exists) {
            const applicantId = appDoc.data().applicantId;
            if (applicantId) {
              applicantIds.push(applicantId);
            }
          }
        });
        
        console.log(`📊 Found ${applicantIds.length} applicants to update statistics for`);
      } catch (fetchError) {
        console.error('⚠️ Error fetching applicant IDs:', fetchError);
        // Continue with deletion even if we can't get IDs
      }
      
      // Delete applications
      const batch = db.batch();
      for (const appId of jobData.applicationIds) {
        const appRef = db.collection('applications').doc(appId);
        batch.delete(appRef);
      }
      
      try {
        await batch.commit();
        console.log('✅ Applications deleted');
      } catch (appError) {
        console.error('❌ Error deleting applications:', appError);
        // Continue with job deletion even if applications fail
      }
      
      // Update applicant statistics (decrement their application counts)
      if (applicantIds.length > 0) {
        console.log('📊 Updating applicant statistics...');
        try {
          const userBatch = db.batch();
          
          // Remove duplicates (in case user applied multiple times)
          const uniqueApplicantIds = [...new Set(applicantIds)];
          
          for (const applicantId of uniqueApplicantIds) {
            const userRef = db.collection('users').doc(applicantId);
            userBatch.update(userRef, {
              appliedJobsCount: firebase.firestore.FieldValue.increment(-1)
            });
          }
          
          await userBatch.commit();
          console.log(`✅ Updated statistics for ${uniqueApplicantIds.length} applicants`);
        } catch (statsError) {
          console.error('⚠️ Error updating applicant statistics:', statsError);
          // Non-critical - continue with deletion
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Create deletion audit record
    // ═══════════════════════════════════════════════════════════════
    await db.collection('job_deletions').add({
      jobId: jobId,
      deletedBy: getCurrentUserId(),
      deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reason: 'user_requested',
      jobData: jobData,
      photoDeleted: jobData.thumbnail ? jobData.thumbnail.includes('firebasestorage') : false,
      applicationsDeleted: jobData.applicationIds ? jobData.applicationIds.length : 0
    });
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Delete the job document from Firestore
    // ═══════════════════════════════════════════════════════════════
    await db.collection('jobs').doc(jobId).delete();
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Update poster statistics (decrement their job counts)
    // ═══════════════════════════════════════════════════════════════
    console.log('📊 Updating poster statistics...');
    try {
      const posterRef = db.collection('users').doc(jobData.posterId);
      await posterRef.update({
        activeJobsCount: firebase.firestore.FieldValue.increment(-1)
      });
      console.log('✅ Poster statistics updated');
    } catch (posterError) {
      console.error('⚠️ Error updating poster statistics:', posterError);
      // Non-critical - job is already deleted
    }
    
    console.log(`✅ Job ${jobId} deleted completely (Firestore + Storage + Applications + Statistics)`);
    return { 
      success: true, 
      message: 'Job deleted successfully',
      cleanup: {
        firestoreDeleted: true,
        photoDeleted: jobData.thumbnail ? jobData.thumbnail.includes('firebasestorage') : false,
        applicationsDeleted: jobData.applicationIds ? jobData.applicationIds.length : 0
      }
    };
    
  } catch (error) {
    console.error('❌ Error deleting job:', error);
    return { success: false, message: error.message };
  }
}

function deleteJobOffline(jobId) {
  const jobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  
  for (const category of Object.keys(jobs)) {
    const jobIndex = jobs[category].findIndex(j => j.jobId === jobId || j.id === jobId);
    if (jobIndex !== -1) {
      jobs[category].splice(jobIndex, 1);
      localStorage.setItem('gisugoJobs', JSON.stringify(jobs));
      
      // Also remove from preview cards
      if (previewCards[category]) {
        previewCards[category] = previewCards[category].filter(
          c => c.id !== jobId && c.jobNumber !== jobId
        );
        localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
      }
      
      return { success: true, message: 'Job deleted (offline)' };
    }
  }
  
  return { success: false, message: 'Job not found' };
}

// ============================================================================
// APPLICATIONS COLLECTION
// ============================================================================

/**
 * Apply for a job
 * @param {string} jobId - Job document ID
 * @param {Object} applicationData - Application data (message, counterOffer)
 * @returns {Promise<Object>} - Result object
 */
async function applyForJob(jobId, applicationData) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to apply' };
  }
  
  if (!db) {
    return applyForJobOffline(jobId, applicationData, currentUser);
  }
  
  try {
    // ═══════════════════════════════════════════════════════════════
    // VALIDATION: Prevent self-application
    // ═══════════════════════════════════════════════════════════════
    const job = await getJobById(jobId);
    
    if (!job) {
      return { success: false, message: 'Job not found' };
    }
    
    if (job.posterId === currentUser.uid) {
      console.warn('⚠️ User attempted to apply to their own gig');
      return { 
        success: false, 
        message: 'You cannot apply to your own gig' 
      };
    }
    
    console.log('✅ Self-application check passed');
    
    // ═══════════════════════════════════════════════════════════════
    // VALIDATION: Smart reapplication system (max 2 applications)
    // ═══════════════════════════════════════════════════════════════
    console.log('🔍 Checking for existing applications...');
    
    let existingApplications;
    try {
      existingApplications = await db.collection('applications')
        .where('jobId', '==', jobId)
        .where('applicantId', '==', currentUser.uid)
        .orderBy('appliedAt', 'desc')  // Most recent first
        .get();
    } catch (indexError) {
      // ═══════════════════════════════════════════════════════════════
      // Firebase Index Missing - Show helpful error
      // ═══════════════════════════════════════════════════════════════
      if (indexError.code === 'failed-precondition' || indexError.message.includes('index')) {
        console.error('❌ FIREBASE INDEX REQUIRED!');
        console.error('📋 Error:', indexError.message);
        console.error('🔗 Look for a link in the error above to create the index');
        console.error('⏱️ After clicking the link, wait 5-10 minutes for index to build');
        
        return {
          success: false,
          message: '⚠️ Firebase index is being set up. Please check the browser console for a link to create the required index, then try again in 5-10 minutes.'
        };
      }
      throw indexError; // Re-throw if it's a different error
    }
    
    const applicationCount = existingApplications.size;
    
    console.log(`📊 Existing application count: ${applicationCount}`);
    
    // ═══════════════════════════════════════════════════════════════
    // RULE 1: Block if 2+ applications already exist
    // ═══════════════════════════════════════════════════════════════
    if (applicationCount >= 2) {
      console.warn('⚠️ User has reached maximum applications (2) for this gig');
      return {
        success: false,
        message: 'You have reached the maximum number of applications for this job'
      };
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RULE 2: Block if 1 application exists and it's pending or accepted
    // ═══════════════════════════════════════════════════════════════
    if (applicationCount === 1) {
      const existingApp = existingApplications.docs[0].data();
      console.log(`📊 Existing application status: ${existingApp.status}`);
      
      if (existingApp.status === 'pending') {
        console.warn('⚠️ User already has a pending application for this gig');
        return {
          success: false,
          message: 'You have already applied to this gig (application pending)'
        };
      }
      
      if (existingApp.status === 'accepted') {
        console.warn('⚠️ User has already been hired for this gig');
        return {
          success: false,
          message: 'You have already been hired for this job'
        };
      }
      
      // If status is 'rejected', allow reapplication
      if (existingApp.status === 'rejected') {
        console.log('♻️ User was rejected - allowing reapplication (2nd chance)');
      }
    }
    
    console.log('✅ Application validation check passed');
    
    // Get applicant profile from Firestore for accurate info
    let applicantName = currentUser.displayName || 'Anonymous';
    let applicantThumbnail = currentUser.photoURL || '';
    
    console.log('🔍 Fetching applicant profile from Firestore for:', currentUser.uid);
    
    try {
      const applicantProfile = await getUserProfile(currentUser.uid);
      
      if (applicantProfile) {
        console.log('✅ Using Firestore profile data for applicant');
        applicantName = applicantProfile.fullName || applicantName;
        applicantThumbnail = applicantProfile.profilePhoto || applicantThumbnail;
      } else {
        console.warn('⚠️ No Firestore profile found for applicant, using Auth data');
      }
    } catch (error) {
      console.error('❌ Error fetching applicant profile:', error);
      console.warn('⚠️ Falling back to Auth data for applicant');
    }
    
    console.log('🎯 Final applicant data:', { applicantName, applicantThumbnail });
    
    // Create application document
    const application = {
      jobId: jobId,
      applicantId: currentUser.uid,
      applicantName: applicantName,
      applicantThumbnail: applicantThumbnail,
      appliedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      message: applicationData.message || '',
      counterOffer: applicationData.counterOffer || null
    };
    
    const appRef = await db.collection('applications').add(application);
    
    // Update job application count
    await db.collection('jobs').doc(jobId).update({
      applicationCount: firebase.firestore.FieldValue.increment(1),
      applicationIds: firebase.firestore.FieldValue.arrayUnion(appRef.id)
    });
    
    console.log('✅ Application submitted:', appRef.id);
    
    return {
      success: true,
      applicationId: appRef.id,
      message: 'Application submitted successfully!'
    };
    
  } catch (error) {
    console.error('❌ Error applying for job:', error);
    return { success: false, message: error.message };
  }
}

function applyForJobOffline(jobId, applicationData, currentUser) {
  const applications = JSON.parse(localStorage.getItem('gisugo_applications') || '[]');
  
  const applicationId = `app_${Date.now()}`;
  const application = {
    applicationId: applicationId,
    jobId: jobId,
    applicantId: currentUser.uid || 'offline_user',
    applicantName: currentUser.displayName || 'Demo User',
    appliedAt: new Date().toISOString(),
    status: 'pending',
    message: applicationData.message || '',
    counterOffer: applicationData.counterOffer || null
  };
  
  applications.push(application);
  localStorage.setItem('gisugo_applications', JSON.stringify(applications));
  
  return {
    success: true,
    applicationId: applicationId,
    message: 'Application submitted! (Offline mode)'
  };
}

/**
 * Get applications for a job
 * @param {string} jobId - Job document ID
 * @returns {Promise<Array>} - Array of applications
 */
async function getJobApplications(jobId) {
  const db = getFirestore();
  
  console.log('🔍 firebase-db.js: getJobApplications() called');
  console.log('   Querying with jobId:', jobId);
  
  if (!db) {
    console.log('   ⚠️ Offline mode - checking localStorage');
    const applications = JSON.parse(localStorage.getItem('gisugo_applications') || '[]');
    const filtered = applications.filter(app => app.jobId === jobId);
    console.log('   Found', filtered.length, 'applications in localStorage');
    return filtered;
  }
  
  try {
    console.log('   📡 Querying Firestore: applications where jobId ==', jobId);
    const snapshot = await db.collection('applications')
      .where('jobId', '==', jobId)
      .orderBy('appliedAt', 'desc')
      .get();
    
    console.log('   ✅ Firestore returned', snapshot.docs.length, 'documents');
    
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('      -', doc.id, '| jobId:', data.jobId, '| applicant:', data.applicantName);
      return {
        id: doc.id,
        ...data
      };
    });
    
    return results;
    
  } catch (error) {
    console.error('❌ Error getting applications:', error);
    return [];
  }
}

/**
 * Accept an application and hire the worker
 * @param {string} jobId - Job document ID
 * @param {string} applicationId - Application document ID
 * @returns {Promise<Object>} - Result object
 */
async function hireWorker(jobId, applicationId) {
  const db = getFirestore();
  
  if (!db) {
    return { success: true, message: 'Worker hired! (Offline mode)' };
  }
  
  try {
    // Get application data
    const appDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!appDoc.exists) {
      return { success: false, message: 'Application not found' };
    }
    
    const appData = appDoc.data();
    
    // Get job data to determine agreed price
    const jobDoc = await db.collection('jobs').doc(jobId).get();
    if (!jobDoc.exists) {
      return { success: false, message: 'Job not found' };
    }
    
    const jobData = jobDoc.data();
    
    // Determine agreed price: counter offer takes priority, otherwise use job's original price
    const agreedPrice = appData.counterOffer || jobData.priceOffer;
    
    console.log('💰 Price negotiation:', {
      originalJobPrice: jobData.priceOffer,
      counterOffer: appData.counterOffer,
      agreedPrice: agreedPrice
    });
    
    // Update job with hired worker info AND agreed price
    await db.collection('jobs').doc(jobId).update({
      status: 'hired',
      hiredWorkerId: appData.applicantId,
      hiredWorkerName: appData.applicantName,
      hiredWorkerThumbnail: appData.applicantThumbnail,
      agreedPrice: agreedPrice, // Store the agreed price
      hiredAt: firebase.firestore.FieldValue.serverTimestamp(),
      applicationCount: 0 // Reset to 0 since all applications are now processed
    });
    
    // Update application status
    await db.collection('applications').doc(applicationId).update({
      status: 'accepted'
    });
    
    // Reject other applications
    const otherApps = await db.collection('applications')
      .where('jobId', '==', jobId)
      .where('status', '==', 'pending')
      .get();
    
    const batch = db.batch();
    otherApps.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'rejected' });
    });
    await batch.commit();
    
    console.log('✅ Worker hired successfully with agreed price:', agreedPrice);
    return { success: true, message: 'Worker hired successfully!' };
    
  } catch (error) {
    console.error('❌ Error hiring worker:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get offered jobs for a worker (jobs with status 'hired' where they are the hired worker)
 * @param {string} workerId - Worker's user ID
 * @returns {Promise<Array>} - Array of offered job objects
 */
async function getOfferedJobsForWorker(workerId) {
  const db = getFirestore();
  
  if (!db) {
    console.log('⚠️ Firebase not available, returning empty offered jobs');
    return [];
  }
  
  try {
    console.log(`🔍 Fetching offered jobs for worker: ${workerId}`);
    
    // Get jobs where status is 'hired' and worker is the hired worker
    const offeredJobsSnapshot = await db.collection('jobs')
      .where('status', '==', 'hired')
      .where('hiredWorkerId', '==', workerId)
      .get();
    
    console.log(`📊 Raw Firestore results: ${offeredJobsSnapshot.size} documents`);
    
    const offeredJobs = offeredJobsSnapshot.docs.map(doc => ({
      id: doc.id,
      jobId: doc.id,
      ...doc.data()
    }));
    
    console.log(`✅ Returning ${offeredJobs.length} offered jobs`);
    return offeredJobs;
    
  } catch (error) {
    console.error('❌ Error fetching offered jobs:', error);
    return [];
  }
}

/**
 * Fix application counts for all jobs (recalculate from actual pending applications)
 * @returns {Promise<Object>} - Result object
 */
async function fixApplicationCounts() {
  const db = getFirestore();
  
  if (!db) {
    return { success: false, message: 'Firebase not available' };
  }
  
  try {
    console.log('🔧 Fixing application counts for all jobs...');
    
    // Get all jobs
    const jobsSnapshot = await db.collection('jobs').get();
    let fixed = 0;
    
    for (const jobDoc of jobsSnapshot.docs) {
      const jobId = jobDoc.id;
      
      // Count ONLY pending applications for this job
      const pendingApps = await db.collection('applications')
        .where('jobId', '==', jobId)
        .where('status', '==', 'pending')
        .get();
      
      const correctCount = pendingApps.size;
      const currentCount = jobDoc.data().applicationCount || 0;
      
      if (correctCount !== currentCount) {
        console.log(`📊 Job ${jobId}: Fixing count from ${currentCount} to ${correctCount}`);
        await db.collection('jobs').doc(jobId).update({
          applicationCount: correctCount
        });
        fixed++;
      }
    }
    
    console.log(`✅ Fixed ${fixed} job(s)`);
    return { success: true, message: `Fixed application counts for ${fixed} job(s)` };
    
  } catch (error) {
    console.error('❌ Error fixing application counts:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Reject a job application
 * @param {string} applicationId - Application document ID
 * @returns {Promise<Object>} - Result object
 */
async function rejectApplication(applicationId) {
  const db = getFirestore();
  
  if (!db) {
    return { success: true, message: 'Application rejected! (Offline mode)' };
  }
  
  try {
    // Get application data to verify it exists
    const appDoc = await db.collection('applications').doc(applicationId).get();
    
    if (!appDoc.exists) {
      return { success: false, message: 'Application not found' };
    }
    
    const appData = appDoc.data();
    
    // Verify the current user is the job poster
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return { success: false, message: 'You must be logged in' };
    }
    
    // Get job to verify poster
    const jobDoc = await db.collection('jobs').doc(appData.jobId).get();
    if (!jobDoc.exists) {
      return { success: false, message: 'Job not found' };
    }
    
    const jobData = jobDoc.data();
    if (jobData.posterId !== currentUser.uid) {
      return { success: false, message: 'You are not authorized to reject this application' };
    }
    
    // Update application status to rejected
    await db.collection('applications').doc(applicationId).update({
      status: 'rejected',
      rejectedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // ═══════════════════════════════════════════════════════════════
    // UPDATE JOB APPLICATION COUNT (decrement for rejected)
    // ═══════════════════════════════════════════════════════════════
    await db.collection('jobs').doc(appData.jobId).update({
      applicationCount: firebase.firestore.FieldValue.increment(-1)
    });
    
    console.log('✅ Application rejected successfully:', applicationId);
    console.log('✅ Job application count decremented');
    return { success: true, message: 'Application rejected successfully!' };
    
  } catch (error) {
    console.error('❌ Error rejecting application:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// CHAT/MESSAGES COLLECTION
// ============================================================================

/**
 * Create or get existing chat thread
 * @param {string} jobId - Job document ID
 * @param {string} otherUserId - Other participant's user ID
 * @param {Object} otherUserInfo - Other user's info (name, thumbnail)
 * @returns {Promise<Object>} - Thread data
 */
async function getOrCreateChatThread(jobId, otherUserId, otherUserInfo = {}) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to chat' };
  }
  
  if (!db) {
    return getOrCreateChatThreadOffline(jobId, otherUserId, otherUserInfo, currentUser);
  }
  
  try {
    // Check for existing thread
    const existingSnapshot = await db.collection('chat_threads')
      .where('jobId', '==', jobId)
      .where('participantIds', 'array-contains', currentUser.uid)
      .get();
    
    const existingThread = existingSnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participantIds.includes(otherUserId);
    });
    
    if (existingThread) {
      return {
        success: true,
        threadId: existingThread.id,
        thread: existingThread.data(),
        isNew: false
      };
    }
    
    // Create new thread
    const threadData = {
      jobId: jobId,
      participantIds: [currentUser.uid, otherUserId],
      participant1: {
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous',
        userThumbnail: currentUser.photoURL || ''
      },
      participant2: {
        userId: otherUserId,
        userName: otherUserInfo.userName || 'User',
        userThumbnail: otherUserInfo.userThumbnail || ''
      },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: '',
      isActive: true,
      unreadCount: {
        [currentUser.uid]: 0,
        [otherUserId]: 0
      }
    };
    
    const threadRef = await db.collection('chat_threads').add(threadData);
    
    return {
      success: true,
      threadId: threadRef.id,
      thread: threadData,
      isNew: true
    };
    
  } catch (error) {
    console.error('❌ Error creating chat thread:', error);
    return { success: false, message: error.message };
  }
}

function getOrCreateChatThreadOffline(jobId, otherUserId, otherUserInfo, currentUser) {
  const threads = JSON.parse(localStorage.getItem('gisugo_chat_threads') || '[]');
  
  // Check for existing thread
  const existing = threads.find(t => 
    t.jobId === jobId && 
    t.participantIds.includes(currentUser.uid) &&
    t.participantIds.includes(otherUserId)
  );
  
  if (existing) {
    return {
      success: true,
      threadId: existing.threadId,
      thread: existing,
      isNew: false
    };
  }
  
  // Create new thread
  const threadId = `thread_${Date.now()}`;
  const threadData = {
    threadId: threadId,
    jobId: jobId,
    participantIds: [currentUser.uid, otherUserId],
    participant1: {
      userId: currentUser.uid,
      userName: currentUser.displayName || 'Demo User'
    },
    participant2: {
      userId: otherUserId,
      userName: otherUserInfo.userName || 'User'
    },
    createdAt: new Date().toISOString(),
    lastMessageTime: new Date().toISOString(),
    isActive: true
  };
  
  threads.push(threadData);
  localStorage.setItem('gisugo_chat_threads', JSON.stringify(threads));
  
  return {
    success: true,
    threadId: threadId,
    thread: threadData,
    isNew: true
  };
}

/**
 * Send a message in a chat thread
 * @param {string} threadId - Chat thread ID
 * @param {string} content - Message content
 * @returns {Promise<Object>} - Result object
 */
async function sendMessage(threadId, content) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { success: false, message: 'You must be logged in to send messages' };
  }
  
  if (!db) {
    return sendMessageOffline(threadId, content, currentUser);
  }
  
  try {
    // Create message
    const message = {
      threadId: threadId,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      senderAvatar: currentUser.photoURL || '',
      content: content,
      messageType: 'text',
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    };
    
    const msgRef = await db.collection('chat_messages').add(message);
    
    // Get thread to find other participant
    const threadDoc = await db.collection('chat_threads').doc(threadId).get();
    const threadData = threadDoc.data();
    const otherUserId = threadData.participantIds.find(id => id !== currentUser.uid);
    
    // Update thread metadata
    await db.collection('chat_threads').doc(threadId).update({
      lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
      lastMessagePreview: content.substring(0, 100),
      [`unreadCount.${otherUserId}`]: firebase.firestore.FieldValue.increment(1)
    });
    
    return {
      success: true,
      messageId: msgRef.id,
      message: 'Message sent'
    };
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return { success: false, message: error.message };
  }
}

function sendMessageOffline(threadId, content, currentUser) {
  const messages = JSON.parse(localStorage.getItem('gisugo_chat_messages') || '[]');
  
  const messageId = `msg_${Date.now()}`;
  const message = {
    messageId: messageId,
    threadId: threadId,
    senderId: currentUser.uid,
    senderName: currentUser.displayName || 'Demo User',
    content: content,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  messages.push(message);
  localStorage.setItem('gisugo_chat_messages', JSON.stringify(messages));
  
  // Update thread last message
  const threads = JSON.parse(localStorage.getItem('gisugo_chat_threads') || '[]');
  const threadIndex = threads.findIndex(t => t.threadId === threadId);
  if (threadIndex !== -1) {
    threads[threadIndex].lastMessageTime = new Date().toISOString();
    threads[threadIndex].lastMessagePreview = content.substring(0, 100);
    localStorage.setItem('gisugo_chat_threads', JSON.stringify(threads));
  }
  
  return {
    success: true,
    messageId: messageId,
    message: 'Message sent (offline)'
  };
}

/**
 * Get messages for a thread
 * @param {string} threadId - Chat thread ID
 * @param {number} limit - Max messages to retrieve
 * @returns {Promise<Array>} - Array of messages
 */
async function getThreadMessages(threadId, limit = 50) {
  const db = getFirestore();
  
  if (!db) {
    const messages = JSON.parse(localStorage.getItem('gisugo_chat_messages') || '[]');
    return messages
      .filter(m => m.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(-limit);
  }
  
  try {
    const snapshot = await db.collection('chat_messages')
      .where('threadId', '==', threadId)
      .orderBy('timestamp', 'asc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    return [];
  }
}

/**
 * Get user's chat threads
 * @returns {Promise<Array>} - Array of chat threads
 */
async function getUserChatThreads() {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return [];
  }
  
  if (!db) {
    const threads = JSON.parse(localStorage.getItem('gisugo_chat_threads') || '[]');
    return threads
      .filter(t => t.participantIds.includes(currentUser.uid))
      .sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
  }
  
  try {
    const snapshot = await db.collection('chat_threads')
      .where('participantIds', 'array-contains', currentUser.uid)
      .where('isActive', '==', true)
      .orderBy('lastMessageTime', 'desc')
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ Error getting chat threads:', error);
    return [];
  }
}

// ============================================================================
// NOTIFICATIONS COLLECTION
// ============================================================================

/**
 * Create a notification
 * @param {string} recipientId - User ID to receive notification
 * @param {Object} notificationData - Notification content
 * @returns {Promise<Object>} - Result object
 */
async function createNotification(recipientId, notificationData) {
  const db = getFirestore();
  
  if (!db) {
    return createNotificationOffline(recipientId, notificationData);
  }
  
  try {
    const notification = {
      recipientId: recipientId,
      type: notificationData.type,
      jobId: notificationData.jobId || '',
      jobTitle: notificationData.jobTitle || '',
      message: notificationData.message,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      read: false,
      actionRequired: notificationData.actionRequired || false
    };
    
    const notifRef = await db.collection('notifications').add(notification);
    
    return {
      success: true,
      notificationId: notifRef.id
    };
    
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    return { success: false, message: error.message };
  }
}

function createNotificationOffline(recipientId, notificationData) {
  const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
  
  const notifId = `notif_${Date.now()}`;
  notifications.push({
    notificationId: notifId,
    recipientId: recipientId,
    ...notificationData,
    createdAt: new Date().toISOString(),
    read: false
  });
  
  localStorage.setItem('gisugo_notifications', JSON.stringify(notifications));
  
  return { success: true, notificationId: notifId };
}

/**
 * Get user's notifications
 * @param {boolean} unreadOnly - Only return unread notifications
 * @returns {Promise<Array>} - Array of notifications
 */
async function getUserNotifications(unreadOnly = false) {
  const db = getFirestore();
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return [];
  }
  
  if (!db) {
    const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
    let filtered = notifications.filter(n => n.recipientId === currentUser.uid);
    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  
  try {
    let query = db.collection('notifications')
      .where('recipientId', '==', currentUser.uid);
    
    if (unreadOnly) {
      query = query.where('read', '==', false);
    }
    
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
  } catch (error) {
    console.error('❌ Error getting notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification document ID
 * @returns {Promise<Object>} - Result object
 */
async function markNotificationRead(notificationId) {
  const db = getFirestore();
  
  if (!db) {
    const notifications = JSON.parse(localStorage.getItem('gisugo_notifications') || '[]');
    const index = notifications.findIndex(n => n.notificationId === notificationId);
    if (index !== -1) {
      notifications[index].read = true;
      localStorage.setItem('gisugo_notifications', JSON.stringify(notifications));
    }
    return { success: true };
  }
  
  try {
    await db.collection('notifications').doc(notificationId).update({
      read: true
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error marking notification read:', error);
    return { success: false };
  }
}

// ============================================================================
// ADMIN ANALYTICS
// ============================================================================

/**
 * Get admin analytics data
 * @returns {Promise<Object>} - Analytics data
 */
async function getAdminAnalytics() {
  const db = getFirestore();
  
  if (!db) {
    // Return mock data for offline mode
    return {
      totalUsers: parseInt(localStorage.getItem('mockTotalUsers') || '1250'),
      verificationSubmissions: parseInt(localStorage.getItem('mockVerifications') || '23'),
      monthlyRevenue: parseInt(localStorage.getItem('mockRevenue') || '125000'),
      reportedGigs: parseInt(localStorage.getItem('mockReportedGigs') || '7')
    };
  }
  
  try {
    // Get real-time counts from Firestore
    const [usersSnapshot, verificationsSnapshot, jobsSnapshot] = await Promise.all([
      db.collection('users').get(),
      db.collection('verification_requests').where('status', '==', 'pending').get(),
      db.collection('jobs').where('status', '==', 'reported').get()
    ]);
    
    // Calculate revenue from transactions
    const transactionsSnapshot = await db.collection('transactions')
      .where('timestamp', '>=', getMonthStartTimestamp())
      .get();
    
    const monthlyRevenue = transactionsSnapshot.docs.reduce((sum, doc) => {
      return sum + (doc.data().amount || 0);
    }, 0);
    
    return {
      totalUsers: usersSnapshot.size,
      verificationSubmissions: verificationsSnapshot.size,
      monthlyRevenue: monthlyRevenue,
      reportedGigs: jobsSnapshot.size
    };
    
  } catch (error) {
    console.error('❌ Error getting admin analytics:', error);
    return {
      totalUsers: 0,
      verificationSubmissions: 0,
      monthlyRevenue: 0,
      reportedGigs: 0
    };
  }
}

// Get start of current month timestamp
function getMonthStartTimestamp() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

// ============================================================================
// USER PROFILE FUNCTIONS
// ============================================================================

/**
 * Get user profile from Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
async function getUserProfile(userId) {
  console.log('🔎 getUserProfile called for:', userId);
  
  const db = getFirestore();
  
  if (!db) {
    console.error('❌ Firestore not available - cannot fetch profile');
    return null;
  }
  
  try {
    console.log('📡 Querying Firestore: users/' + userId);
    const userDoc = await db.collection('users').doc(userId).get();
    
    console.log('📨 Firestore response:', {
      exists: userDoc.exists,
      id: userDoc.id,
      hasData: userDoc.exists ? Object.keys(userDoc.data()).length : 0
    });
    
    if (userDoc.exists) {
      const profileData = { userId: userDoc.id, ...userDoc.data() };
      console.log('✅ Profile found:', {
        userId: profileData.userId,
        fullName: profileData.fullName,
        email: profileData.email,
        hasPhoto: !!profileData.profilePhoto
      });
      return profileData;
    } else {
      console.warn('⚠️ User profile not found in Firestore:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting user profile from Firestore:', error);
    return null;
  }
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Jobs
window.createJob = createJob;
window.getJobById = getJobById;
window.getJobsByCategory = getJobsByCategory;
window.getUserJobListings = getUserJobListings;
window.updateJobStatus = updateJobStatus;
window.deleteJob = deleteJob;

// Users
window.getUserProfile = getUserProfile;

// Applications
window.applyForJob = applyForJob;
window.getJobApplications = getJobApplications;
window.hireWorker = hireWorker;

// Chat
window.getOrCreateChatThread = getOrCreateChatThread;
window.sendMessage = sendMessage;
window.getThreadMessages = getThreadMessages;
window.getUserChatThreads = getUserChatThreads;

// Notifications
window.createNotification = createNotification;
window.getUserNotifications = getUserNotifications;
window.markNotificationRead = markNotificationRead;

// Admin
window.getAdminAnalytics = getAdminAnalytics;

console.log('📦 Firebase database module loaded');

