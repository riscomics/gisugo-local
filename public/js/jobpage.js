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

document.addEventListener('DOMContentLoaded', function() {
  // Update rating counts on page load
  updateRatingCounts();
  
  // Update star ratings based on data attributes
  updateStarRatings();
  
  // Initialize contact dropdown
  initContactDropdown();
  
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