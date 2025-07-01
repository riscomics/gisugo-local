// ========================== DYNAMIC JOB PAGE FUNCTIONALITY ==========================

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
    jobNumber: urlParams.get('jobNumber')
  };
}

function loadJobData() {
  const { category, jobNumber } = getUrlParameters();
  
  if (!category || !jobNumber) {
    showErrorMessage('Invalid job URL. Missing category or job number.');
    return;
  }
  
  console.log(`🔍 Loading job data for category: ${category}, jobNumber: ${jobNumber}`);
  
  // Try to get job data from localStorage
  const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const categoryJobs = jobData[category] || [];
  
  console.log(`📱 Found ${categoryJobs.length} jobs in localStorage for category '${category}':`, categoryJobs);
  
  // Find the specific job by jobNumber OR by extracting from jobId
  let job = categoryJobs.find(j => j.jobNumber == jobNumber);
  
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
  
  if (!job) {
    console.error(`❌ Job not found. Available jobNumbers:`, categoryJobs.map(j => ({
      jobId: j.jobId,
      jobNumber: j.jobNumber,
      title: j.title || j.jobTitle
    })));
    showErrorMessage('Job not found. This job may have been removed or does not exist.');
    return;
  }
  
  console.log(`🎯 Loading job data:`, job);
  
  // Populate the page with job data
  populateJobPage(job);
}

function populateJobPage(jobData) {
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
  
  // Set date
  if (jobData.jobDate) {
    const date = new Date(jobData.jobDate);
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
      applyOverlay.classList.add('show');
      // Focus on message textarea for better UX
      if (messageTextarea) {
        setTimeout(() => messageTextarea.focus(), 300);
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
  
  // Get form values
  const message = messageTextarea ? messageTextarea.value.trim() : '';
  const counterOffer = counterOfferInput ? counterOfferInput.value.trim() : '';
  
  // Basic validation
  if (!message) {
    alert('Please enter a message to the customer.');
    if (messageTextarea) messageTextarea.focus();
    return;
  }
  
  // Validate counter offer if provided
  if (counterOffer && (isNaN(counterOffer) || parseFloat(counterOffer) <= 0)) {
    alert('Please enter a valid counter offer amount.');
    if (counterOfferInput) counterOfferInput.focus();
    return;
  }
  
  // Prepare application data
  const { category, jobNumber } = getUrlParameters();
  const applicationData = {
    message: message,
    counterOffer: counterOffer ? parseFloat(counterOffer) : null,
    jobId: `${category}-job-2025-${jobNumber}`,
    timestamp: new Date().toISOString()
  };
  
  console.log('Job application submitted:', applicationData);
  
  // Clear form and close apply modal
  if (messageTextarea) messageTextarea.value = '';
  if (counterOfferInput) counterOfferInput.value = '';
  closeApplyModal();
  
  // Show confirmation overlay
  showApplicationSentOverlay();
}

// Function to show application sent confirmation overlay
function showApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  if (applicationSentOverlay) {
    applicationSentOverlay.classList.add('show');
  }
}

// Function to close application sent overlay
function closeApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  if (applicationSentOverlay) {
    applicationSentOverlay.classList.remove('show');
  }
}

// Function to initialize application sent overlay
function initializeApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const closeBtn = document.getElementById('applicationSentClose');
  
  if (applicationSentOverlay && closeBtn) {
    // Close overlay when close button is clicked
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeApplicationSentOverlay();
    });
    
    // Close overlay when clicking outside the modal content
    applicationSentOverlay.addEventListener('click', function(e) {
      if (e.target === applicationSentOverlay) {
        closeApplicationSentOverlay();
      }
    });
    
    // Close overlay with Escape key
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
      
      // Get customer data to construct profile URL
      const customerName = document.getElementById('customerName')?.textContent;
      
      if (customerName) {
        // Convert customer name to URL-friendly format (similar to userId)
        const userId = customerName.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');
        
        // Navigate to profile page with userId parameter
        window.location.href = `profile.html?userId=${userId}`;
      } else {
        console.log('Customer name not found for profile link');
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
  
  console.log('✅ Dynamic job page initialization completed');
}); 