// Job page specific scripts will go here. 

// Function to format rating numbers
function formatRatingCount(number) {
  if (number >= 1000) {
    return (number / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return number.toString();
}

// Function to update all rating counts on the page
function updateRatingCounts() {
  const ratingCounts = document.querySelectorAll('.rating-count');
  ratingCounts.forEach(element => {
    const currentText = element.textContent.trim();
    const number = parseInt(currentText.replace('k', '000')); // Handle existing 'k' format
    if (!isNaN(number)) {
      element.textContent = formatRatingCount(number);
    }
  });
}

// Function to update star ratings based on data attributes
function updateStarRatings() {
  const ratingContainers = document.querySelectorAll('.customer-rating');
  
  ratingContainers.forEach(container => {
    const rating = parseFloat(container.getAttribute('data-rating'));
    const count = parseInt(container.getAttribute('data-count'));
    const stars = container.querySelectorAll('.star');
    
    // If no reviews, all stars are white (empty)
    if (count === 0 || isNaN(rating)) {
      stars.forEach(star => {
        star.className = 'star';
      });
      return;
    }
    
    // Calculate filled stars
    const fullStars = Math.floor(rating);
    const remainder = rating - fullStars;
    
    stars.forEach((star, index) => {
      star.className = 'star'; // Reset
      
      if (index < fullStars) {
        // Full star
        star.classList.add('filled');
      } else if (index === fullStars && remainder >= 0.3) {
        // Half star (show half if remainder is 0.3 or more)
        if (remainder >= 0.7) {
          star.classList.add('filled');
        } else {
          star.classList.add('half-filled');
        }
      }
      // Else remains empty (white)
    });
  });
}

// Function to handle contact dropdown
function initContactDropdown() {
  const contactBtn = document.getElementById('contactBtn');
  const contactDropdown = document.getElementById('contactDropdown');
  
  if (contactBtn && contactDropdown) {
    contactBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      contactDropdown.classList.toggle('show');
    });
    
    // Handle dropdown item clicks
    const dropdownItems = contactDropdown.querySelectorAll('.contact-dropdown-item');
    dropdownItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const action = this.getAttribute('data-action');
        
        if (action === 'contact') {
          // Handle contact action
          console.log('Contact customer');
          // Add your contact logic here
        } else if (action === 'report') {
          // Handle report job action
          console.log('Report job');
          // Add your report logic here
        }
        
        // Close dropdown after selection
        contactDropdown.classList.remove('show');
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!contactBtn.contains(e.target) && !contactDropdown.contains(e.target)) {
        contactDropdown.classList.remove('show');
      }
    });
  }
}

// Function to handle apply job modal
function initApplyJobModal() {
  const applyBtn = document.getElementById('jobApplyBtn');
  const applyOverlay = document.getElementById('applyJobOverlay');
  const submitBtn = document.getElementById('submitApplication');
  const cancelBtn = document.getElementById('cancelApplication');
  const messageTextarea = document.getElementById('applyMessage');
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  if (applyBtn && applyOverlay) {
    // Update modal with job payment info
    updateModalPaymentInfo();
    
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

// Function to update modal with current job payment info
function updateModalPaymentInfo() {
  const jobPaymentSection = document.querySelector('.job-payment-section');
  const modalPaymentAmount = document.querySelector('.apply-payment-amount');
  
  if (jobPaymentSection && modalPaymentAmount) {
    const paymentValue = jobPaymentSection.querySelector('.job-payment-value');
    if (paymentValue) {
      modalPaymentAmount.textContent = paymentValue.textContent;
    }
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
  const applicationData = {
    message: message,
    counterOffer: counterOffer ? parseFloat(counterOffer) : null,
    jobId: getJobIdFromUrl(), // You can implement this based on your URL structure
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
function initApplicationSentOverlay() {
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

// Helper function to extract job ID from URL (implement based on your URL structure)
function getJobIdFromUrl() {
  const path = window.location.pathname;
  const matches = path.match(/\/([^\/]+)\.html$/);
  return matches ? matches[1] : 'unknown';
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

// Utility function to populate job page with dynamic data
function populateJobData(jobData) {
  const fieldsMap = {
    'job-title': ['jobTitle', document.title],
    'job-photo': 'jobPhoto',
    'job-date': 'jobDate', 
    'job-time': 'jobTime',
    'job-location': 'jobLocation',
    'job-supplies': 'jobSupplies',
    'job-description': 'jobDescription',
    'job-payment-amount': ['jobPaymentAmount', 'modalPaymentAmount'],
    'job-payment-rate': 'jobPaymentRate',
    'customer-name': 'customerName',
    'customer-avatar': 'customerAvatar',
    'customer-profile-link': 'customerProfileLink',
    'customer-rating-count': 'customerRatingCount',
    'currency-symbol': 'currencySymbol'
  };
  
  Object.keys(jobData).forEach(field => {
    const elementIds = fieldsMap[field];
    const value = jobData[field];
    
    if (elementIds) {
      const ids = Array.isArray(elementIds) ? elementIds : [elementIds];
      
      ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          if (element.tagName === 'IMG') {
            element.src = value;
            element.alt = value;
          } else if (element.tagName === 'A') {
            element.href = value;
          } else {
            element.textContent = value;
          }
        }
      });
    }
    
    // Update meta tags
    const metaElement = document.querySelector(`meta[data-field="${field}"]`);
    if (metaElement) {
      metaElement.setAttribute('content', value);
    }
    
    // Update body data attributes
    if (field === 'job-id') {
      document.body.setAttribute('data-job-id', value);
    }
    if (field === 'job-category') {
      document.body.setAttribute('data-job-category', value);
    }
  });
  
  // Update payment amount in modal when main payment changes
  updateModalPaymentInfo();
  
  // Update customer rating stars if rating data provided
  if (jobData['customer-rating']) {
    const ratingContainer = document.getElementById('customerRating');
    if (ratingContainer) {
      ratingContainer.setAttribute('data-rating', jobData['customer-rating']);
      updateStarRatings();
    }
  }
}

// Function to extract job data from current page (useful for templates)
function extractJobData() {
  const jobData = {};
  
  // Extract from data-field attributes
  document.querySelectorAll('[data-field]').forEach(element => {
    const field = element.getAttribute('data-field');
    let value = '';
    
    if (element.tagName === 'IMG') {
      value = element.src;
    } else if (element.tagName === 'A') {
      value = element.href;
    } else {
      value = element.textContent.trim();
    }
    
    jobData[field] = value;
  });
  
  // Extract from meta tags
  document.querySelectorAll('meta[data-field]').forEach(meta => {
    const field = meta.getAttribute('data-field');
    jobData[field] = meta.getAttribute('content');
  });
  
  return jobData;
}

// Sample function to demonstrate data population
function loadJobFromDatabase(jobId) {
  // This would typically fetch from your backend/database
  // For demo purposes, here's sample data structure:
  const sampleJobData = {
    'job-title': 'Sample Cleaning Job',
    'job-photo': '../../mock/sample-job.jpg',
    'job-date': 'January 15, 2025',
    'job-time': '9AM to 12PM',
    'job-location': 'Cebu City',
    'job-supplies': 'Customer Provided',
    'job-description': 'Need help cleaning the house before family arrives.',
    'job-payment-amount': '₱500',
    'job-payment-rate': 'Per Job',
    'customer-name': 'Maria Santos',
    'customer-avatar': '../../users/maria-santos.jpg',
    'customer-profile-link': '../../profiles/maria-santos.html',
    'customer-rating': '4.8',
    'customer-rating-count': '250',
    'currency-symbol': '₱'
  };
  
  // Uncomment to populate with sample data:
  // populateJobData(sampleJobData);
  
  return sampleJobData;
}

document.addEventListener('DOMContentLoaded', function() {
  // Update rating counts on page load
  updateRatingCounts();
  
  // Update star ratings based on data attributes
  updateStarRatings();
  
  // Initialize contact dropdown
  initContactDropdown();
  
  // Initialize apply job modal
  initApplyJobModal();
  
  // Initialize application sent overlay
  initApplicationSentOverlay();
  
  // Initialize counter offer input formatting
  initCounterOfferFormatting();
  
  const menuBtn = document.querySelector('.jobcat-menu-btn');
  const menuOverlay = document.getElementById('jobcatMenuOverlay');
  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      menuOverlay.classList.toggle('show');
    });
    
    // Close menu when clicking on the overlay background
    menuOverlay.addEventListener('click', function(e) {
      if (e.target === menuOverlay) {
        menuOverlay.classList.remove('show');
      }
    });
    
    document.addEventListener('click', function(e) {
      if (
        menuOverlay.classList.contains('show') &&
        !menuBtn.contains(e.target) &&
        !menuOverlay.contains(e.target)
      ) {
        menuOverlay.classList.remove('show');
      }
    }, true);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        menuOverlay.classList.remove('show');
      }
    });
  }
}); 