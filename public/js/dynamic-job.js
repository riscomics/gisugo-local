// ========================== DYNAMIC JOB PAGE FUNCTIONALITY ==========================

// Memory leak prevention - Cleanup registry for event listeners and timers
const DYNAMIC_JOB_CLEANUP_REGISTRY = {
  timeouts: new Set(),
  intervals: new Set(),
  eventListeners: new Set(),
  
  addTimeout: function(timeoutId) {
    this.timeouts.add(timeoutId);
  },
  
  addInterval: function(intervalId) {
    this.intervals.add(intervalId);
  },
  
  addEventListener: function(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    this.eventListeners.add({ element, event, handler, options });
  },
  
  cleanup: function() {
    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
    
    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(event, handler, options);
      }
    });
    this.eventListeners.clear();
    
    console.log('🧹 Dynamic job page cleanup completed');
  }
};

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  DYNAMIC_JOB_CLEANUP_REGISTRY.cleanup();
});

// Category configuration for extras
const extrasConfig = {
  hatod: {
    field1: { label: "Pickup at:" },
    field2: { label: "Deliver to:" }
  },
  hakot: {
    field1: { label: "Load at:" },
    field2: { label: "Unload at:" }
  },
  kompra: {
    field1: { label: "Shop at:" },
    field2: { label: "Deliver to:" }
  },
  luto: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  hugas: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  laba: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  limpyo: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  tindera: {
    field1: { label: "Location:" },
    field2: { label: "Product:" }
  },
  bantay: {
    field1: { label: "Location:" },
    field2: { label: "Shift:" }
  },
  painter: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  carpenter: {
    field1: { label: "Location:" },
    field2: { label: "Materials:" }
  },
  plumber: {
    field1: { label: "Location:" },
    field2: { label: "Materials:" }
  },
  security: {
    field1: { label: "Location:" },
    field2: { label: "Shift:" }
  },
  driver: {
    field1: { label: "Location:" },
    field2: { label: "Location:" }
  },
  tutor: {
    field1: { label: "Location:" },
    field2: { label: "Subject:" }
  },
  clerical: {
    field1: { label: "Location:" },
    field2: { label: "Position:" }
  },
  builder: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  reception: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  nurse: {
    field1: { label: "Location:" },
    field2: { label: "Specialty:" }
  },
  doctor: {
    field1: { label: "Location:" },
    field2: { label: "Specialty:" }
  },
  lawyer: {
    field1: { label: "Location:" },
    field2: { label: "Practice:" }
  },
  mechanic: {
    field1: { label: "Location:" },
    field2: { label: "Vehicle:" }
  },
  electrician: {
    field1: { label: "Location:" },
    field2: { label: "Materials:" }
  },
  tailor: {
    field1: { label: "Location:" },
    field2: { label: "Garment:" }
  }
};

function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    category: urlParams.get('category'),
    // Support both jobNumber (legacy) and jobId (Firebase)
    jobNumber: urlParams.get('jobNumber') || urlParams.get('jobId')
  };
}

async function loadJobData() {
  // Show loading modal
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
  }
  
  const { category, jobNumber } = getUrlParameters();
  
  if (!category || !jobNumber) {
    // Hide loading modal on error
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
    showErrorMessage('Invalid job URL. Missing category or job ID.');
    return;
  }
  
  console.log(`🔍 Loading job data for category: ${category}, jobId/jobNumber: ${jobNumber}`);
  
  // Check if we should use Firebase
  const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
  console.log(`📊 Data mode: ${useFirebase ? 'FIREBASE' : 'MOCK'}`);
  
  let job = null;
  
  // ══════════════════════════════════════════════════════════════
  // FIREBASE MODE - Try to load from Firestore first
  // ══════════════════════════════════════════════════════════════
  if (useFirebase) {
    console.log('🔥 FIREBASE MODE: Loading job from Firestore...');
    
    // jobNumber is actually the Firebase document ID
    if (typeof getJobById === 'function') {
      try {
        job = await getJobById(jobNumber);
        if (job) {
          console.log(`✅ Found job in Firebase:`, job);
          // Normalize Firebase data
          job = normalizeFirebaseJob(job);
        }
      } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
      }
    }
  }
  
  // ══════════════════════════════════════════════════════════════
  // FALLBACK - Try localStorage
  // ══════════════════════════════════════════════════════════════
  if (!job) {
    console.log('📦 Trying localStorage...');
    
    const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    const categoryJobs = jobData[category] || [];
    
    console.log(`📱 Found ${categoryJobs.length} jobs in localStorage for category '${category}'`);
    
    // Find the specific job by jobNumber OR by extracting from jobId
    job = categoryJobs.find(j => j.jobNumber == jobNumber);
    
    if (!job) {
      // Try alternative: match by jobId pattern (for RELISTED jobs that might have different jobNumber)
      job = categoryJobs.find(j => {
        if (j.jobId) {
          // Extract number from jobId like "limpyo_job_2025_1751300670771"
          const extractedNumber = j.jobId.split('_').pop();
          return extractedNumber == jobNumber;
        }
        return false;
      });
      
      if (job) {
        console.log(`✅ Found job by jobId pattern match:`, job);
      }
    } else {
      console.log(`✅ Found job by direct jobNumber match:`, job);
    }
  }
  
  if (!job) {
    console.error(`❌ Job not found in Firebase or localStorage`);
    // Hide loading modal on error
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
    showErrorMessage('Job not found. This job may have been removed or does not exist.');
    return;
  }
  
  console.log(`🎯 Loading job data:`, job);
  
  // Populate the page with job data
  populateJobPage(job);
  
  // Load customer rating from Firestore
  await loadCustomerRating(job.posterId);
  
  // Check job status and poster, hide Apply button if needed
  const applyBtn = document.getElementById('jobApplyBtn');
  const currentUser = firebase.auth ? firebase.auth().currentUser : null;
  
  if (job.status === 'completed' && applyBtn) {
    console.log('🏁 Job is completed - hiding Apply button');
    applyBtn.style.display = 'none';
  } else if (currentUser && job.posterId === currentUser.uid && applyBtn) {
    console.log('👤 User is viewing their own job - showing USER GIG button');
    applyBtn.disabled = true;
    applyBtn.style.opacity = '0.5';
    applyBtn.style.cursor = 'not-allowed';
    applyBtn.style.backgroundColor = '';
    applyBtn.querySelector('span').textContent = 'USER GIG';
    applyBtn.title = 'This is your own gig';
  } else {
    // Check if user has already applied to this job (only for active jobs by other posters)
    await checkIfUserAlreadyApplied(jobNumber);
  }
  
  // Hide loading modal after page is populated
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show');
  }
}

// Normalize Firebase job data to match expected format
function normalizeFirebaseJob(job) {
  // Convert Firestore Timestamp to date string (local timezone)
  let scheduledDate = job.scheduledDate;
  if (job.scheduledDate && typeof job.scheduledDate.toDate === 'function') {
    const d = job.scheduledDate.toDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    scheduledDate = `${year}-${month}-${day}`; // Local timezone YYYY-MM-DD
  }
  
  return {
    ...job,
    jobTitle: job.title || job.jobTitle,
    title: job.title || job.jobTitle,
    jobDate: scheduledDate,
    scheduledDate: scheduledDate,
    photo: job.thumbnail || job.photo,
    paymentAmount: job.priceOffer || job.paymentAmount,
    priceOffer: job.priceOffer,
    extra1: job.extras?.[0] || '',
    extra2: job.extras?.[1] || '',
    posterName: job.posterName || 'Customer',
    posterThumbnail: job.posterThumbnail || '',
    applicationCount: job.applicationCount || 0
  };
}

function populateJobPage(jobData) {
  // Store job data globally for customer profile link
  window.currentJobData = jobData;
  
  // Set page title (check both jobTitle and title fields)
  const jobTitle = jobData.jobTitle || jobData.title;
  document.title = `${jobTitle} - GISUGO`;
  document.getElementById('pageTitle').textContent = `${jobTitle} - GISUGO`;
  
  // Set job title
  document.getElementById('jobTitle').textContent = jobTitle;
  
  // Set job photo if available (check both photo and thumbnail fields)
  const photoSrc = jobData.photo || jobData.thumbnail;
  console.log(`🖼️ Photo debugging:`, {
    hasPhoto: !!jobData.photo,
    hasThumbnail: !!jobData.thumbnail,
    photoValue: jobData.photo,
    thumbnailValue: jobData.thumbnail,
    finalPhotoSrc: photoSrc,
    allJobFields: Object.keys(jobData)
  });
  
  if (photoSrc) {
    const photoContainer = document.getElementById('jobPhotoContainer');
    const photoBorderline = document.getElementById('jobPhotoBorderline');
    const photoImg = document.getElementById('jobPhoto');
    
    if (photoContainer && photoBorderline && photoImg) {
      photoImg.src = photoSrc;
    photoContainer.style.display = 'block';
    photoBorderline.style.display = 'block';
      console.log('✅ Job photo loaded successfully:', photoSrc);
      
      // Add error handling for broken images
      photoImg.onload = function() {
        console.log('✅ Photo image loaded successfully from:', photoSrc);
      };
      
      photoImg.onerror = function() {
        console.error('❌ Failed to load photo image from:', photoSrc);
        photoContainer.style.display = 'none';
        photoBorderline.style.display = 'none';
      };
    } else {
      console.error('❌ Photo container elements not found:', {
        photoContainer: !!photoContainer,
        photoBorderline: !!photoBorderline,
        photoImg: !!photoImg
      });
    }
  } else {
    console.log('⚠️ No job photo found. Job data structure:', {
      availableFields: Object.keys(jobData),
      photoField: jobData.photo,
      thumbnailField: jobData.thumbnail,
      imageField: jobData.image,
      pictureField: jobData.picture
    });
  }
  
  // Set region and city
  if (jobData.region) {
    document.getElementById('jobRegion').textContent = jobData.region;
  } else {
    document.getElementById('jobRegion').textContent = 'Not specified';
  }
  
  if (jobData.city) {
    document.getElementById('jobCity').textContent = jobData.city;
  } else {
    document.getElementById('jobCity').textContent = 'Not specified';
  }
  
  // Set date (parse in local timezone to avoid UTC rollback)
  if (jobData.jobDate) {
    let date;
    if (jobData.jobDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse YYYY-MM-DD in local timezone
      const [year, month, day] = jobData.jobDate.split('-').map(Number);
      date = new Date(year, month - 1, day);
    } else {
      date = new Date(jobData.jobDate);
    }
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    document.getElementById('jobDate').textContent = date.toLocaleDateString('en-US', options);
  }
  
  // Set time
  if (jobData.startTime && jobData.endTime) {
    document.getElementById('jobTime').textContent = `${jobData.startTime} to ${jobData.endTime}`;
  }
  
  // Set extras based on category
  populateExtras(jobData);
  
  // Set description
  document.getElementById('jobDescription').textContent = jobData.description || 'No description provided.';
  
  // Set payment (check multiple field variations)
  const paymentAmount = jobData.paymentAmount || jobData.priceOffer || '0';
  const paymentType = jobData.paymentType || 'Per Hour';
  document.getElementById('jobPaymentAmount').textContent = `₱${paymentAmount}`;
  document.getElementById('jobPaymentRate').textContent = paymentType;
  document.getElementById('modalPaymentAmount').textContent = `₱${paymentAmount}`;
  
  // Set customer info (poster)
  const customerNameEl = document.getElementById('customerName');
  const customerAvatarEl = document.getElementById('customerAvatar');
  
  if (customerNameEl) {
    customerNameEl.textContent = jobData.posterName || 'Customer';
  }
  
  if (customerAvatarEl) {
    const avatarSrc = jobData.posterThumbnail;
    
    if (avatarSrc) {
      customerAvatarEl.src = avatarSrc;
      customerAvatarEl.alt = jobData.posterName || 'Customer';
      customerAvatarEl.style.display = 'block';
      
      // Add error handling for broken images - use emoji
      customerAvatarEl.onerror = function() {
        console.warn('⚠️ Failed to load customer avatar, using emoji');
        this.style.display = 'none';
        this.parentElement.innerHTML = '<span style="font-size: 2.5rem;">👤</span>';
      };
    } else {
      // No photo - use emoji
      customerAvatarEl.style.display = 'none';
      customerAvatarEl.parentElement.innerHTML = '<span style="font-size: 2.5rem;">👤</span>';
    }
  }
}

/**
 * Render star rating visually
 * @param {HTMLElement} container - Container element with .star children
 * @param {number} rating - Rating value (0-5)
 */
function renderStars(container, rating) {
  if (!container) return;
  
  const stars = container.querySelectorAll('.star');
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  stars.forEach((star, index) => {
    star.classList.remove('filled', 'half-filled');
    
    if (index < fullStars) {
      star.classList.add('filled');
      star.textContent = '★';
    } else if (index === fullStars && hasHalfStar) {
      star.classList.add('half-filled');
      star.textContent = '★';
    } else {
      star.textContent = '☆';
    }
  });
}

/**
 * Load and display customer (poster) rating from Firestore
 * @param {string} posterId - The user ID of the job poster
 */
async function loadCustomerRating(posterId) {
  if (!posterId) {
    console.warn('⚠️ No posterId provided for customer rating');
    return;
  }
  
  try {
    console.log(`⭐ Fetching customer rating for posterId: ${posterId}`);
    
    // Get customer rating element
    const ratingElement = document.querySelector('.customer-rating');
    const ratingCountElement = document.querySelector('.customer-rating .rating-count');
    const ratingStarsContainer = document.querySelector('.customer-rating .rating-stars');
    
    if (!ratingElement) {
      console.warn('⚠️ Customer rating element not found');
      return;
    }
    
    // Fetch poster's profile from Firestore
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      const userDoc = await db.collection('users').doc(posterId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const averageRating = userData.averageRating || 0;
        const totalReviews = userData.totalReviews || 0;
        
        console.log(`⭐ Customer rating loaded: ${averageRating} stars (${totalReviews} reviews)`);
        
        // Update rating count
        if (ratingCountElement) {
          ratingCountElement.textContent = totalReviews;
        }
        
        // Update data attributes
        ratingElement.setAttribute('data-rating', averageRating);
        ratingElement.setAttribute('data-count', totalReviews);
        
        // Render stars visually
        if (ratingStarsContainer && typeof renderStars === 'function') {
          renderStars(ratingStarsContainer, averageRating);
        }
        
        console.log(`✅ Customer rating displayed: ${averageRating}/5 (${totalReviews} reviews)`);
      } else {
        console.warn(`⚠️ User profile not found for posterId: ${posterId}`);
        // Set to 0 reviews if profile doesn't exist
        if (ratingCountElement) ratingCountElement.textContent = '0';
        if (ratingElement) {
          ratingElement.setAttribute('data-rating', '0');
          ratingElement.setAttribute('data-count', '0');
        }
      }
    } else {
      console.warn('⚠️ Firebase not available for customer rating');
    }
  } catch (error) {
    console.error('❌ Error loading customer rating:', error);
  }
}

function populateExtras(jobData) {
  const category = jobData.category;
  const config = extrasConfig[category];
  
  if (!config || !jobData.extras || jobData.extras.length === 0) {
    return; // No extras to show
  }
  
  const extrasRow = document.getElementById('jobExtrasRow');
  extrasRow.style.display = 'flex';
  
  // Populate field 1
  if (jobData.extras[0] && config.field1) {
    const parts = jobData.extras[0].split(':');
    const label = parts[0] ? parts[0].trim() + ':' : config.field1.label;
    const value = parts[1] ? parts[1].trim() : '';
    
    document.getElementById('jobExtra1Label').textContent = label;
    document.getElementById('jobExtra1Value').textContent = value || 'Not specified';
  }
  
  // Populate field 2
  if (jobData.extras[1] && config.field2) {
    const parts = jobData.extras[1].split(':');
    const label = parts[0] ? parts[0].trim() + ':' : config.field2.label;
    const value = parts[1] ? parts[1].trim() : '';
    
    document.getElementById('jobExtra2Label').textContent = label;
    document.getElementById('jobExtra2Value').textContent = value || 'Not specified';
  }
}

function showErrorMessage(message) {
  document.getElementById('jobTitle').textContent = 'Error Loading Job';
  document.getElementById('jobDate').textContent = 'N/A';
  document.getElementById('jobTime').textContent = 'N/A';
  document.getElementById('jobDescription').textContent = message;
  document.getElementById('jobPaymentAmount').textContent = '₱0';
  document.getElementById('jobPaymentRate').textContent = 'N/A';
}

// Initialize menu functionality
function initializeMenu() {
  const menuBtn = document.getElementById('jobMenuBtn');
  const menuOverlay = document.getElementById('jobcatMenuOverlay');
  
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menuOverlay.classList.toggle('show');
    });
    
    menuOverlay.addEventListener('click', function(e) {
      if (e.target === menuOverlay) {
        menuOverlay.classList.remove('show');
      }
    });
    
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        menuOverlay.classList.remove('show');
      }
    });
  }
}

// Initialize apply job functionality
function initializeApplyJob() {
  const applyBtn = document.getElementById('jobApplyBtn');
  const applyOverlay = document.getElementById('applyJobOverlay');
  const submitBtn = document.getElementById('submitApplication');
  const cancelBtn = document.getElementById('cancelApplication');
  const messageTextarea = document.getElementById('applyMessage');
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  if (applyBtn && applyOverlay) {
    // Prevent any form submission behavior on the modal
    const modal = applyOverlay.querySelector('.apply-job-modal');
    if (modal) {
      modal.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }
    
    // Prevent Enter key from submitting in textarea/input
    if (messageTextarea) {
      messageTextarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleJobApplication();
        }
      });
    }
    
    if (counterOfferInput) {
      counterOfferInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleJobApplication();
        }
      });
    }
    
    // Show modal when apply button is clicked
    applyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // ═══════════════════════════════════════════════════════════════
      // AUTH CHECK: Must be logged in to apply
      // ═══════════════════════════════════════════════════════════════
      const useFirebase = typeof firebase !== 'undefined' && firebase.auth;
      if (useFirebase) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          // Not logged in - redirect to login page
          console.log('⚠️ User must log in to apply');
          window.location.href = 'login.html';
          return;
        }
      }
      
      // Scroll window to top to prevent Android keyboard positioning issues
      window.scrollTo(0, 0);
      applyOverlay.scrollTop = 0;
      applyOverlay.classList.add('show');
      // Focus on message textarea for better UX
      if (messageTextarea) {
        const focusTimeout = setTimeout(() => messageTextarea.focus(), 300);
        DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(focusTimeout);
      }
    });
    
    // Hide modal when cancel button is clicked
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        closeApplyModal();
      });
    }
    
    // Hide modal when clicking outside the modal content
    applyOverlay.addEventListener('click', function(e) {
      if (e.target === applyOverlay) {
        closeApplyModal();
      }
    });
    
    // Handle form submission
    if (submitBtn) {
      submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleJobApplication();
        return false;
      });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && applyOverlay.classList.contains('show')) {
        closeApplyModal();
      }
    });
  }
}

// Function to close apply modal
function closeApplyModal() {
  const applyOverlay = document.getElementById('applyJobOverlay');
  if (applyOverlay) {
    applyOverlay.classList.remove('show');
  }
}

// Function to handle job application submission
function handleJobApplication() {
  const messageTextarea = document.getElementById('applyMessage');
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  // Check if user is trying to apply to their own job
  const currentUser = firebase.auth ? firebase.auth().currentUser : null;
  if (currentUser && window.currentJobData && window.currentJobData.posterId === currentUser.uid) {
    console.error('🚫 User attempted to apply to their own job');
    alert('You cannot apply to your own job posting!');
    return;
  }
  
  // Get form values
  const message = messageTextarea ? messageTextarea.value.trim() : '';
  const counterOffer = counterOfferInput ? counterOfferInput.value.trim() : '';
  
  // Basic validation
  if (!message) {
    showValidationError('Please enter a message to the customer.', messageTextarea);
    return;
  }
  
  // Validate counter offer if provided
  if (counterOffer && (isNaN(counterOffer) || parseFloat(counterOffer) <= 0)) {
    showValidationError('Please enter a valid counter offer amount.', counterOfferInput);
    return;
  }
  
  // Prepare application data
  const { category, jobNumber } = getUrlParameters();
  // jobNumber from URL IS the Firebase document ID (e.g., "job_abc123")
  const jobId = jobNumber;
  
  const applicationData = {
    message: message,
    counterOffer: counterOffer ? parseFloat(counterOffer) : null
  };
  
  console.log('📤 Submitting job application for jobId:', jobId, applicationData);
  
  // Show loading overlay
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.querySelector('#loadingOverlay .loading-text');
  if (loadingOverlay) {
    if (loadingText) loadingText.textContent = 'Sending Application...';
    loadingOverlay.classList.add('show');
  }
  
  // Submit application to Firebase
  if (typeof applyForJob === 'function') {
    applyForJob(jobId, applicationData)
      .then(result => {
        // Hide loading
        if (loadingOverlay) loadingOverlay.classList.remove('show');
        
        if (result.success) {
          console.log('✅ Application submitted successfully!');
          console.log('   Application ID:', result.applicationId);
          console.log('   Job ID:', jobId);
          console.log('   🔍 Customer should query applications with jobId:', jobId);
          
          // Clear form and close apply modal
          if (messageTextarea) messageTextarea.value = '';
          if (counterOfferInput) counterOfferInput.value = '';
          closeApplyModal();
          
          // Show confirmation overlay
          showApplicationSentOverlay();
        } else {
          console.error('❌ Application submission failed:', result.message);
          alert(result.message || 'Failed to submit application. Please try again.');
        }
      })
      .catch(error => {
        // Hide loading
        if (loadingOverlay) loadingOverlay.classList.remove('show');
        
        console.error('❌ Error submitting application:', error);
        alert('An error occurred. Please try again.');
      });
  } else {
    // Hide loading
    if (loadingOverlay) loadingOverlay.classList.remove('show');
    
    console.error('❌ applyForJob function not available');
    alert('Application system unavailable. Please refresh the page.');
  }
}

// Function to show application sent confirmation overlay
function showApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const lightRaysContainer = document.getElementById('lightRaysContainer');
  
  if (applicationSentOverlay) {
    applicationSentOverlay.classList.add('show');
  }
  
  // Show and animate light rays - position at icon after modal appears
  if (lightRaysContainer) {
    lightRaysContainer.classList.add('active');
    
    // Wait for modal to render, then position rays at icon
    const positionTimeout = setTimeout(() => {
      const icon = document.querySelector('.application-sent-icon');
      if (icon) {
        const rect = icon.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Position each ray at the icon center
        const rays = lightRaysContainer.querySelectorAll('.light-ray');
        rays.forEach(ray => {
          ray.style.top = centerY + 'px';
          ray.style.left = centerX + 'px';
          ray.style.animation = 'none';
          ray.offsetHeight; // Trigger reflow
          ray.style.animation = '';
        });
      }
    }, 100);
    DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(positionTimeout);
  }
}

// Function to just close the overlay (for backdrop click / escape)
function closeApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const lightRaysContainer = document.getElementById('lightRaysContainer');
  
  if (applicationSentOverlay) {
    applicationSentOverlay.classList.remove('show');
  }
  
  if (lightRaysContainer) {
    lightRaysContainer.classList.remove('active');
  }
}

// ========================== VALIDATION OVERLAY ==========================
function showValidationError(message, focusElement = null) {
  const overlay = document.getElementById('validationOverlay');
  const messageEl = document.getElementById('validationMessage');
  const okBtn = document.getElementById('validationOkBtn');
  
  if (!overlay || !messageEl) return;
  
  // Set the message
  messageEl.textContent = message;
  
  // Show the overlay
  overlay.classList.add('show');
  
  // Handle OK button click
  const closeValidation = () => {
    overlay.classList.remove('show');
    okBtn.removeEventListener('click', closeValidation);
    overlay.removeEventListener('click', handleBackdropClick);
    document.removeEventListener('keydown', handleEscKey);
    
    // Focus the element that needs attention
    if (focusElement) {
      setTimeout(() => focusElement.focus(), 100);
    }
  };
  
  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === overlay) {
      closeValidation();
    }
  };
  
  // Close on Escape key
  const handleEscKey = (e) => {
    if (e.key === 'Escape') {
      closeValidation();
    }
  };
  
  okBtn.addEventListener('click', closeValidation);
  overlay.addEventListener('click', handleBackdropClick);
  document.addEventListener('keydown', handleEscKey);
}

// Function to close overlay AND navigate back to listings (for GOT IT button)
function closeAndNavigateToListings() {
  closeApplicationSentOverlay();
  
  // Get the category from URL to navigate back to the correct listings page
  const { category } = getUrlParameters();
  if (category) {
    // Navigate to the category listings page
    window.location.href = `${category}.html`;
  } else {
    // Fallback to browser back
    window.history.back();
  }
}

// Function to initialize application sent overlay
function initializeApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const closeBtn = document.getElementById('applicationSentClose');
  
  if (applicationSentOverlay && closeBtn) {
    // GOT IT button - close and navigate back to listings
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeAndNavigateToListings();
    });
    
    // Backdrop click - just close overlay (user can stay on page)
    applicationSentOverlay.addEventListener('click', function(e) {
      if (e.target === applicationSentOverlay) {
        closeApplicationSentOverlay();
      }
    });
    
    // Escape key - just close overlay
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && applicationSentOverlay.classList.contains('show')) {
        closeApplicationSentOverlay();
      }
    });
  }
}

// Function to format counter offer input
function initCounterOfferFormatting() {
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  if (counterOfferInput) {
    // Prevent negative values and non-numeric input
    counterOfferInput.addEventListener('input', function(e) {
      let value = e.target.value;
      
      // Remove any non-numeric characters except decimal point
      value = value.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      e.target.value = value;
    });
    
    // Prevent negative values on keydown
    counterOfferInput.addEventListener('keydown', function(e) {
      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
      }
    });
  }
}

// Initialize customer profile link
function initializeCustomerProfileLink() {
  const customerProfileLink = document.getElementById('customerProfileLink');
  
  if (customerProfileLink) {
    customerProfileLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Use the actual posterId stored in the job data
      if (window.currentJobData && window.currentJobData.posterId) {
        // Navigate to profile page with the real userId
        window.location.href = `profile.html?userId=${window.currentJobData.posterId}`;
      } else {
        console.error('❌ Poster ID not found in job data');
      }
    });
  }
}

// Initialize contact dropdown
function initializeContactDropdown() {
  const contactBtn = document.getElementById('contactBtn');
  const contactDropdown = document.getElementById('contactDropdown');
  
  if (contactBtn && contactDropdown) {
    contactBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      contactDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', function() {
      contactDropdown.classList.remove('show');
    });
    
    // Handle dropdown item clicks
    contactDropdown.addEventListener('click', function(e) {
      if (e.target.classList.contains('contact-dropdown-item')) {
        const action = e.target.getAttribute('data-action');
        if (action === 'contact') {
          alert('Contact functionality not implemented yet.');
        } else if (action === 'report') {
          alert('Report functionality not implemented yet.');
        }
        contactDropdown.classList.remove('show');
      }
    });
  }
}

// ========================== PHOTO LIGHTBOX FUNCTIONALITY ==========================

function initializePhotoLightbox() {
  const jobPhoto = document.getElementById('jobPhoto');
  const lightboxOverlay = document.getElementById('photoLightboxOverlay');
  const lightboxImage = document.getElementById('photoLightboxImage');
  const lightboxClose = document.getElementById('photoLightboxClose');

  if (!jobPhoto || !lightboxOverlay || !lightboxImage || !lightboxClose) {
    console.log('Photo lightbox elements not found');
    return;
  }

  // Function to open lightbox with smart photo selection
  function openLightbox() {
    const photoSrc = jobPhoto.src;
    if (photoSrc && photoSrc !== '') {
      // Get current job data to check for original photo
      const { category, jobNumber } = getUrlParameters();
      const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
      const categoryJobs = jobData[category] || [];
      let job = categoryJobs.find(j => j.jobNumber == jobNumber);
      
      // Find job by jobId pattern if not found by jobNumber
      if (!job) {
        job = categoryJobs.find(j => {
          if (j.jobId) {
            const extractedNumber = j.jobId.split('_').pop();
            return extractedNumber == jobNumber;
          }
          return false;
        });
      }
      
      // Use original photo if available, otherwise fallback to cropped version
      let lightboxSrc = photoSrc; // Default fallback
      if (job && job.originalPhoto) {
        lightboxSrc = job.originalPhoto;
        console.log('📸 Using original aspect ratio photo for lightbox');
      } else {
        console.log('📸 Using cropped photo for lightbox (backwards compatibility)');
      }
      
      lightboxImage.src = lightboxSrc;
      lightboxOverlay.style.display = 'flex';
      
      // Add show class with slight delay for smooth animation
      const showTimeout = setTimeout(() => {
        lightboxOverlay.classList.add('show');
      }, 10);
      DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(showTimeout);
      
      // Prevent body scrolling when lightbox is open
      document.body.style.overflow = 'hidden';
      
      console.log('📸 Photo lightbox opened');
    }
  }

  // Function to close lightbox
  function closeLightbox() {
    lightboxOverlay.classList.remove('show');
    
    // Hide overlay after animation completes
    const hideTimeout = setTimeout(() => {
      lightboxOverlay.style.display = 'none';
      lightboxImage.src = '';
    }, 300);
    DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(hideTimeout);
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    console.log('📸 Photo lightbox closed');
  }

  // Event listeners with cleanup registry
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(jobPhoto, 'click', openLightbox);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(lightboxClose, 'click', closeLightbox);
  
  // Close on backdrop click
  const backdropHandler = function(e) {
    if (e.target === lightboxOverlay) {
      closeLightbox();
    }
  };
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(lightboxOverlay, 'click', backdropHandler);
  
  // Close on Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape' && lightboxOverlay.classList.contains('show')) {
      closeLightbox();
    }
  };
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', escapeHandler);

  console.log('✅ Photo lightbox initialized');
}

// ========================== CHECK IF USER ALREADY APPLIED ==========================

/**
 * Check if the current user has already applied to this job
 * @param {string} jobId - The job ID to check
 */
async function checkIfUserAlreadyApplied(jobId) {
  const applyBtn = document.getElementById('jobApplyBtn');
  if (!applyBtn) return;
  
  // Check if Firebase is available
  const useFirebase = typeof firebase !== 'undefined' && firebase.auth && firebase.firestore;
  if (!useFirebase) {
    console.log('⚠️ Firebase not available, skipping duplicate application check');
    return;
  }
  
  // Get current user
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    console.log('ℹ️ User not logged in, apply button remains enabled');
    return;
  }
  
  try {
    console.log('🔍 Checking if user already applied to job:', jobId);
    
    const db = firebase.firestore();
    let existingApplications;
    
    try {
      existingApplications = await db.collection('applications')
        .where('jobId', '==', jobId)
        .where('applicantId', '==', currentUser.uid)
        .orderBy('appliedAt', 'desc')  // Most recent first
        .get();
    } catch (indexError) {
      if (indexError.code === 'failed-precondition' || indexError.message.includes('index')) {
        console.error('❌ FIREBASE INDEX REQUIRED!');
        console.error('📋 Error:', indexError.message);
        console.error('🔗 Look for a link in the error above to create the index');
        console.error('⏱️ After clicking the link, wait 5-10 minutes for index to build');
        
        // Keep button enabled so user can see the error message when they try to apply
        return;
      }
      throw indexError;
    }
    
    const applicationCount = existingApplications.size;
    const mostRecentApp = existingApplications.empty ? null : existingApplications.docs[0].data();
    
    console.log(`📊 Application count: ${applicationCount}`);
    if (mostRecentApp) {
      console.log(`📊 Most recent status: ${mostRecentApp.status}`);
    }
    
    if (applicationCount === 0) {
      // Never applied - button stays as "APPLY TO JOB" (enabled)
      console.log('✅ User has not applied yet, button remains enabled');
      return;
      
    } else if (applicationCount === 1 && (mostRecentApp.status === 'rejected' || mostRecentApp.status === 'voided' || mostRecentApp.status === 'resigned')) {
      // ═══════════════════════════════════════════════════════════════
      // Applied once, got rejected/voided/resigned - show "APPLY AGAIN" (enabled)
      // ═══════════════════════════════════════════════════════════════
      let reason = '';
      if (mostRecentApp.status === 'rejected') {
        reason = 'You were rejected. You can apply one more time.';
        console.log('♻️ User was rejected - showing APPLY AGAIN button');
      } else if (mostRecentApp.status === 'voided') {
        reason = 'Your contract was voided. You can apply one more time.';
        console.log('♻️ User was voided (customer relisted) - showing APPLY AGAIN button');
      } else if (mostRecentApp.status === 'resigned') {
        reason = 'You resigned. You can apply one more time.';
        console.log('♻️ User resigned - showing APPLY AGAIN button');
      }
      
      applyBtn.disabled = false;
      applyBtn.style.opacity = '1';
      applyBtn.style.cursor = 'pointer';
      applyBtn.style.backgroundColor = '#ff9800';  // Orange for "try again"
      applyBtn.querySelector('span').textContent = 'APPLY AGAIN';
      applyBtn.title = reason;
      
      console.log('✅ Apply button set to "APPLY AGAIN" mode');
      
    } else {
      // ═══════════════════════════════════════════════════════════════
      // Either: pending, accepted, or 2+ applications - gray it out
      // ═══════════════════════════════════════════════════════════════
      console.log('🚫 User has already applied (cannot reapply)');
      
      applyBtn.disabled = true;
      applyBtn.style.opacity = '0.5';
      applyBtn.style.cursor = 'not-allowed';
      applyBtn.style.backgroundColor = '';  // Reset to default
      
      // Set button text based on application count
      if (applicationCount >= 2) {
        // User has used both application chances
        applyBtn.querySelector('span').textContent = 'LIMIT REACHED';
        applyBtn.title = 'You have reached the maximum number of applications (2) for this job';
        console.log('🚫 Showing LIMIT REACHED (2+ applications)');
      } else {
        // User has 1 application that's pending or accepted
        applyBtn.querySelector('span').textContent = 'ALREADY APPLIED';
        
        // Set appropriate tooltip based on status
        if (mostRecentApp.status === 'pending') {
          applyBtn.title = 'Your application is pending review';
        } else if (mostRecentApp.status === 'accepted') {
          applyBtn.title = 'You have been hired for this job';
        } else {
          applyBtn.title = 'You have already applied to this job';
        }
        console.log('🚫 Showing ALREADY APPLIED (1 pending/accepted application)');
      }
      
      console.log('✅ Apply button disabled');
    }
  } catch (error) {
    console.error('❌ Error checking for existing applications:', error);
    // Keep button enabled on error to not block legitimate applications
  }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Dynamic job page loading...');
  loadJobData();
  initializeMenu();
  initializeApplyJob();
  initializeApplicationSentOverlay();
  initializeCustomerProfileLink();
  initializeContactDropdown();
  initCounterOfferFormatting();
  initializePhotoLightbox();
  
  console.log('✅ Dynamic job page initialization completed');
}); 