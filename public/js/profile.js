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
  
  // Hide all sections first
  const sections = document.querySelectorAll('.profile-section');
  sections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Show the selected section
  switch(value) {
    case 'user-info':
      document.getElementById('userInfoSection').style.display = 'block';
      console.log('Loading user information...');
      break;
    case 'reviews-customer':
      document.getElementById('reviewsCustomerSection').style.display = 'block';
      populateCustomerReviews();
      console.log('Loading customer reviews...');
      break;
    case 'reviews-worker':
      document.getElementById('reviewsWorkerSection').style.display = 'block';
      populateWorkerReviews();
      console.log('Loading worker reviews...');
      break;
    default:
      // Default to user info
      document.getElementById('userInfoSection').style.display = 'block';
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

// Sample review data (in the future this will come from Firebase)
const sampleCustomerReviews = [
  {
    id: 1,
    jobTitle: "Clear drinks and clean tables at our new coffee shop. Easy relaxing job!",
    jobImage: "public/mock/mock-food-service-post1.jpg",
    feedbackDate: "Dec. 21, 2025",
    rating: 5.0,
    feedbackText: "Thank you so much sir for the opportunity! Please keep me in your favorite for next time."
  },
  {
    id: 2,
    jobTitle: "Help with moving furniture to new apartment",
    jobImage: "public/mock/mock-labor-post2.jpg",
    feedbackDate: "Dec. 18, 2025",
    rating: 4.5,
    feedbackText: "Great worker! Very punctual and careful with our furniture. Would definitely hire again."
  },
  {
    id: 3,
    jobTitle: "Dog walking service for weekend",
    jobImage: "public/mock/mock-pet-care-post1.jpg",
    feedbackDate: "Dec. 15, 2025",
    rating: 4.0,
    feedbackText: "Good service overall. My dog enjoyed the walks. Could have been a bit longer walks though."
  }
];

const sampleWorkerReviews = [
  {
    id: 1,
    jobTitle: "Home cleaning service - 3 bedroom house",
    jobImage: "public/mock/mock-cleaning-post1.jpg",
    feedbackDate: "Dec. 20, 2025",
    rating: 5.0,
    feedbackText: "Excellent customer! Very understanding and provided all necessary cleaning supplies. House was spotless after!"
  },
  {
    id: 2,
    jobTitle: "Garden maintenance and lawn mowing",
    jobImage: "public/mock/mock-gardening-post1.jpg",
    feedbackDate: "Dec. 17, 2025",
    rating: 4.5,
    feedbackText: "Customer was very clear about expectations. Payment was prompt. Nice working environment."
  }
];

// Create a review card element
function createReviewCard(reviewData) {
  const reviewCard = document.createElement('div');
  reviewCard.className = 'review-card';
  
  reviewCard.innerHTML = `
    <div class="review-job-info">
      <div class="review-job-img">
        <img src="${reviewData.jobImage}" alt="Job image">
      </div>
      <div class="review-job-details">
        <div class="review-job-title">${reviewData.jobTitle}</div>
      </div>
    </div>
    <div class="review-feedback-section">
      <div class="review-feedback-header">
        <span class="review-feedback-label">FEEDBACK:</span>
        <span class="review-feedback-date">${reviewData.feedbackDate}</span>
      </div>
      <div class="review-rating">
        ${generateStarsHTML(reviewData.rating)}
      </div>
      <div class="review-feedback-text">
        ${reviewData.feedbackText}
      </div>
    </div>
  `;
  
  return reviewCard;
}

// Generate stars HTML for review cards
function generateStarsHTML(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let starsHTML = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += '<span class="star filled">★</span>';
    } else if (i === fullStars && hasHalfStar) {
      starsHTML += '<span class="star half-filled">★</span>';
    } else {
      starsHTML += '<span class="star">★</span>';
    }
  }
  
  return starsHTML;
}

// Populate customer reviews
function populateCustomerReviews() {
  const container = document.getElementById('reviewsCustomerContainer');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  if (sampleCustomerReviews.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #bfc6d0; font-style: italic;">No customer reviews yet.</p>';
    return;
  }
  
  sampleCustomerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}

// Populate worker reviews  
function populateWorkerReviews() {
  const container = document.getElementById('reviewsWorkerContainer');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  if (sampleWorkerReviews.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #bfc6d0; font-style: italic;">No worker reviews yet.</p>';
    return;
  }
  
  sampleWorkerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}