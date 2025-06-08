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
  
  // Try to get job data from localStorage
  const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const categoryJobs = jobData[category] || [];
  
  // Find the specific job
  const job = categoryJobs.find(j => j.jobNumber == jobNumber);
  
  if (!job) {
    showErrorMessage('Job not found. This job may have been removed or does not exist.');
    return;
  }
  
  // Populate the page with job data
  populateJobPage(job);
}

function populateJobPage(jobData) {
  // Set page title
  document.title = `${jobData.jobTitle} - GISUGO`;
  document.getElementById('pageTitle').textContent = `${jobData.jobTitle} - GISUGO`;
  
  // Set job title
  document.getElementById('jobTitle').textContent = jobData.jobTitle;
  
  // Set job photo if available
  if (jobData.photo) {
    const photoContainer = document.getElementById('jobPhotoContainer');
    const photoBorderline = document.getElementById('jobPhotoBorderline');
    const photoImg = document.getElementById('jobPhoto');
    
    photoImg.src = jobData.photo;
    photoContainer.style.display = 'block';
    photoBorderline.style.display = 'block';
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
  
  // Set payment
  document.getElementById('jobPaymentAmount').textContent = `₱${jobData.paymentAmount}`;
  document.getElementById('jobPaymentRate').textContent = jobData.paymentType;
  document.getElementById('modalPaymentAmount').textContent = `₱${jobData.paymentAmount}`;
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

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  loadJobData();
  initializeMenu();
  initializeApplyJob();
  initializeApplicationSentOverlay();
  initCounterOfferFormatting();
  initializeContactDropdown();
}); 