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
        handleJobApplication();
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
  
  // Here you would typically send the data to your backend
  // For now, we'll just show a success message
  alert('Your application has been submitted successfully!');
  
  // Clear form and close modal
  if (messageTextarea) messageTextarea.value = '';
  if (counterOfferInput) counterOfferInput.value = '';
  closeApplyModal();
  
  // Optionally redirect or update UI
  // window.location.href = '/applications';
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

document.addEventListener('DOMContentLoaded', function() {
  // Update rating counts on page load
  updateRatingCounts();
  
  // Update star ratings based on data attributes
  updateStarRatings();
  
  // Initialize contact dropdown
  initContactDropdown();
  
  // Initialize apply job modal
  initApplyJobModal();
  
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