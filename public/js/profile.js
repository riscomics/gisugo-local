// Mobile Menu Overlay functionality
const profileMenuBtn = document.querySelector('.profile-menu-btn');
const profileMenuOverlay = document.getElementById('profileMenuOverlay');

if (profileMenuBtn && profileMenuOverlay) {
  profileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profileMenuOverlay.classList.add('show');
  });

  profileMenuOverlay.addEventListener('click', function(e) {
    if (e.target === profileMenuOverlay) {
      profileMenuOverlay.classList.remove('show');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      profileMenuOverlay.classList.remove('show');
    }
  });
}

// Profile Dropdown functionality
const profileDropdownTrigger = document.getElementById('profileDropdownTrigger');
const profileDropdownOverlay = document.getElementById('profileDropdownOverlay');
const selectedProfileOption = document.getElementById('selectedProfileOption');

if (profileDropdownTrigger && profileDropdownOverlay) {
  // Toggle dropdown
  profileDropdownTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    profileDropdownOverlay.classList.toggle('show');
    profileDropdownTrigger.classList.toggle('active');
  });

  // Handle option selection
  profileDropdownOverlay.addEventListener('click', function(e) {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const selectedText = e.target.textContent;
      const selectedValue = e.target.getAttribute('data-option');
      
      // Update the dropdown text
      selectedProfileOption.textContent = selectedText;
      
      // Remove active class from all options
      profileDropdownOverlay.querySelectorAll('a').forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to selected option
      e.target.classList.add('active');
      
      // Close dropdown
      profileDropdownOverlay.classList.remove('show');
      profileDropdownTrigger.classList.remove('active');
      
      // Handle the selection (you can add specific logic here)
      handleProfileOptionChange(selectedValue, selectedText);
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!profileDropdownTrigger.contains(e.target) && !profileDropdownOverlay.contains(e.target)) {
      profileDropdownOverlay.classList.remove('show');
      profileDropdownTrigger.classList.remove('active');
    }
  });
}

// Handle profile option changes
function handleProfileOptionChange(value, text) {
  console.log('Profile option changed to:', value, text);
  
  // You can add specific logic here for each option
  switch(value) {
    case 'user-info':
      // Load user information content
      console.log('Loading user information...');
      break;
    case 'reviews-customer':
      // Load customer reviews content
      console.log('Loading customer reviews...');
      break;
    case 'reviews-worker':
      // Load worker reviews content
      console.log('Loading worker reviews...');
      break;
    default:
      console.log('Unknown option selected');
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Profile page loaded');
  
  // Initialize star rating system
  initializeStarRating();
  
  // Set default active option
  const defaultOption = profileDropdownOverlay?.querySelector('a[data-option="user-info"]');
  if (defaultOption) {
    defaultOption.classList.add('active');
  }
});

// Star Rating System
function renderStars(container, rating) {
  if (!container) return;
  
  const stars = container.querySelectorAll('.star');
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  stars.forEach((star, index) => {
    // Clear existing classes
    star.classList.remove('filled', 'half-filled');
    
    if (index < fullStars) {
      // Full stars
      star.classList.add('filled');
    } else if (index === fullStars && hasHalfStar) {
      // Half star
      star.classList.add('half-filled');
    }
    // Else: empty star (default state)
  });
}

function initializeStarRating() {
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer) {
    const rating = parseFloat(starsContainer.getAttribute('data-rating')) || 0;
    const count = parseInt(starsContainer.getAttribute('data-count')) || 0;
    
    // Render the stars based on rating
    renderStars(starsContainer, rating);
    
    // Update the reviews count display
    if (reviewsCountElement) {
      reviewsCountElement.textContent = count;
    }
    
    console.log(`Profile rating initialized: ${rating} stars with ${count} reviews`);
  }
}

// Update star rating (for future Firebase integration)
function updateProfileRating(newRating, newCount) {
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer) {
    // Update data attributes
    starsContainer.setAttribute('data-rating', newRating);
    starsContainer.setAttribute('data-count', newCount);
    
    // Re-render stars
    renderStars(starsContainer, newRating);
    
    // Update count display
    if (reviewsCountElement) {
      reviewsCountElement.textContent = newCount;
    }
    
    console.log(`Profile rating updated: ${newRating} stars with ${newCount} reviews`);
  }
} 