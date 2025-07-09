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

// Profile Tab functionality
const profileTabs = document.querySelectorAll('.tab-btn');
const tabContentWrappers = document.querySelectorAll('.tab-content-wrapper');

// Add click listeners to all tab buttons
profileTabs.forEach(tab => {
  tab.addEventListener('click', function(e) {
      e.preventDefault();
    const targetTab = this.getAttribute('data-tab');
      
    // Remove active class from all tabs and content
    profileTabs.forEach(t => t.classList.remove('active'));
    tabContentWrappers.forEach(content => content.classList.remove('active'));
      
    // Add active class to clicked tab
    this.classList.add('active');
      
    // Show corresponding content
    const targetContent = document.getElementById(`${targetTab}-content`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Handle the tab change with specific logic
    handleProfileTabChange(targetTab);
  });
});

// Handle profile tab changes
function handleProfileTabChange(tabValue) {
  console.log('Profile tab changed to:', tabValue);
  
  // Load content based on selected tab
  switch(tabValue) {
    case 'user-info':
      console.log('Loading user information...');
      // User info is already populated on page load
      break;
    case 'reviews-customer':
      populateCustomerReviews();
      console.log('Loading customer reviews...');
      break;
    case 'reviews-worker':
      populateWorkerReviews();
      console.log('Loading worker reviews...');
      break;
    default:
      console.log('Unknown tab selected');
  }
}

// Sample user profile data (in the future this will come from Firebase)
// These field names match the create account form structure for backend integration
const sampleUserProfile = {
  // Basic Profile Information (from create account form)
  fullName: "Peter J. Ang",
      profilePhoto: "public/users/Peter-J-Ang-User-01.jpg",
  dateOfBirth: "1988-04-15", // Will calculate age from this
  educationLevel: "College", // Options: "No-High-School", "High School", "College", "Masters", "Doctorate"
  userSummary: "Hello! I'm Peter, a reliable and hardworking individual with over 3 years of experience in various service jobs. I take great pride in delivering quality work and building lasting relationships with my clients. Whether it's cleaning, maintenance, or assistance tasks, you can count on me to get the job done right and on time. I'm punctual, detail-oriented, and always ready to go the extra mile to ensure customer satisfaction.",
  
  // System Generated Fields (from Firebase)
  userId: "peter-j-ang-001",
  accountCreated: "2025-04-12T10:30:00Z", // ISO format for Firebase
  rating: 4.7,
  reviewCount: 28,
  
  // Social Media (optional from create account form)
  socialMedia: {
    facebook: "public/icons/FB.png",
    instagram: "public/icons/IG.png", 
    linkedin: "public/icons/IN.png"
  }
};

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to format account creation date for display
function formatRegistrationDate(accountCreated) {
  const date = new Date(accountCreated);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Load user profile data (backend ready)
function loadUserProfile(userProfile = sampleUserProfile) {
  // Update user name (updated field name)
  const nameElement = document.querySelector('.full-name');
  if (nameElement && userProfile.fullName) {
    nameElement.textContent = userProfile.fullName;
  }
  
  // Update user photo (updated field name)
  const photoElement = document.querySelector('.profile-photo img');
  if (photoElement && userProfile.profilePhoto) {
    photoElement.src = userProfile.profilePhoto;
    photoElement.alt = userProfile.fullName || 'User Profile';
  }
  
  // Update star rating and review count
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer && userProfile.rating !== undefined) {
    starsContainer.setAttribute('data-rating', userProfile.rating);
    renderStars(starsContainer, userProfile.rating);
  }
  
  if (reviewsCountElement && userProfile.reviewCount !== undefined) {
    reviewsCountElement.textContent = userProfile.reviewCount;
    if (starsContainer) {
      starsContainer.setAttribute('data-count', userProfile.reviewCount);
    }
  }
  
  // Update social media icons (if provided)
  if (userProfile.socialMedia) {
    const socialIcons = document.querySelectorAll('.social-icon img');
    if (socialIcons.length >= 3) {
      if (userProfile.socialMedia.facebook) socialIcons[0].src = userProfile.socialMedia.facebook;
      if (userProfile.socialMedia.instagram) socialIcons[1].src = userProfile.socialMedia.instagram;
      if (userProfile.socialMedia.linkedin) socialIcons[2].src = userProfile.socialMedia.linkedin;
    }
  }
  
  // Update user information section
  populateUserInformation(userProfile);
  
  console.log(`Profile loaded for: ${userProfile.fullName}`);
}

// Populate user information section (backend ready)
function populateUserInformation(userProfile) {
  // Update registered since (from accountCreated timestamp)
  const registeredSinceElement = document.getElementById('registeredSince');
  if (registeredSinceElement && userProfile.accountCreated) {
    registeredSinceElement.textContent = formatRegistrationDate(userProfile.accountCreated);
  }
  
  // Update age (calculated from dateOfBirth)
  const userAgeElement = document.getElementById('userAge');
  if (userAgeElement && userProfile.dateOfBirth) {
    const age = calculateAge(userProfile.dateOfBirth);
    userAgeElement.textContent = `${age} years old`;
  }
  
  // Update education level (same field name)
  const educationLevelElement = document.getElementById('educationLevel');
  if (educationLevelElement && userProfile.educationLevel) {
    educationLevelElement.textContent = userProfile.educationLevel;
  }
  
  // Update user summary (updated field name)
  const userSummaryElement = document.getElementById('userSummary');
  if (userSummaryElement && userProfile.userSummary) {
    userSummaryElement.textContent = userProfile.userSummary;
  }
  
  console.log('User information populated');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Profile page loaded');
  
  // Load user profile data
  loadUserProfile();
  
  // Initialize star rating system
  initializeStarRating();
  
  console.log('Profile page initialization complete');
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

// Available user thumbnails (excluding Peter's own photo)
const availableUserThumbnails = [
  "public/users/User-02.jpg",
  "public/users/User-03.jpg", 
  "public/users/User-04.jpg",
  "public/users/User-05.jpg",
  "public/users/User-06.jpg",
  "public/users/User-07.jpg",
  "public/users/User-08.jpg",
  "public/users/User-09.jpg",
  "public/users/User-10.jpg",
  "public/users/User-11.jpg"
];

// Function to get random user thumbnail
function getRandomUserThumbnail() {
  const randomIndex = Math.floor(Math.random() * availableUserThumbnails.length);
  return availableUserThumbnails[randomIndex];
}

// Sample review data (in the future this will come from Firebase)
const sampleCustomerReviews = [
  {
    id: 1,
    jobTitle: "Home cleaning service - 3 bedroom house",
    feedbackDate: "Dec. 20, 2025",
    rating: 5,
    feedbackText: "Excellent customer! Very understanding and provided all necessary cleaning supplies. Payment was prompt.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=cleaning&jobNumber=123"
  },
  {
    id: 2,
    jobTitle: "Garden maintenance and lawn mowing",
    feedbackDate: "Dec. 17, 2025",
    rating: 4,
    feedbackText: "Customer was very clear about expectations. Nice working environment and fair pay.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=gardening&jobNumber=124"
  },
  {
    id: 3,
    jobTitle: "Pet grooming for two small dogs",
    feedbackDate: "Dec. 14, 2025",
    rating: 5,
    feedbackText: "Great customer who really cares about his pets. Provided detailed instructions and was very appreciative.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=pet-care&jobNumber=125"
  },
  {
    id: 4,
    jobTitle: "Event setup for birthday party",
    feedbackDate: "Dec. 12, 2025",
    rating: 4,
    feedbackText: "Well-organized customer with clear timeline. Good communication throughout the setup process.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=events&jobNumber=126"
  },
  {
    id: 5,
    jobTitle: "Computer repair and software installation",
    feedbackDate: "Dec. 10, 2025",
    rating: 5,
    feedbackText: "Very patient customer who listened to all explanations. Fair payment and respectful interaction.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=tech&jobNumber=127"
  },
  {
    id: 6,
    jobTitle: "Furniture assembly for new bedroom set",
    feedbackDate: "Dec. 8, 2025",
    rating: 4,
    feedbackText: "Customer provided all tools needed and was flexible with timing. Pleasant working atmosphere.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=labor&jobNumber=128"
  },
  {
    id: 7,
    jobTitle: "Car detailing and interior cleaning",
    feedbackDate: "Dec. 5, 2025",
    rating: 5,
    feedbackText: "Professional customer who trusts your expertise. Quick payment and would work for him again.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=automotive&jobNumber=129"
  },
  {
    id: 8,
    jobTitle: "Photography for family portrait session",
    feedbackDate: "Dec. 3, 2025",
    rating: 4,
    feedbackText: "Creative customer with good vision. Collaborative approach and respectful of artistic input.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=creative&jobNumber=130"
  }
];

const sampleWorkerReviews = [];

// Create a review card element
function createReviewCard(reviewData) {
  const reviewCard = document.createElement('div');
  reviewCard.className = 'review-card';
  
  // Add click functionality if jobPostUrl exists
  if (reviewData.jobPostUrl) {
    reviewCard.style.cursor = 'pointer';
    reviewCard.addEventListener('click', function() {
      window.location.href = reviewData.jobPostUrl;
    });
    
    // Add hover effect
    reviewCard.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)';
    });
    
    reviewCard.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    });
  }
  
  reviewCard.innerHTML = `
    <div class="review-job-title">${reviewData.jobTitle}</div>
    <div class="review-feedback-section">
      <div class="review-feedback-left">
        <div class="review-feedback-date">${reviewData.feedbackDate}</div>
        <div class="review-rating">
          ${generateStarsHTML(reviewData.rating)}
        </div>
        <div class="review-feedback-label">FEEDBACK:</div>
      </div>
      <div class="review-user-thumbnail">
        <img src="${reviewData.userThumbnail}" alt="User thumbnail">
      </div>
    </div>
    <div class="review-feedback-text">
      ${reviewData.feedbackText}
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

// Populate customer reviews (backend ready)
function populateCustomerReviews(customerReviews = sampleCustomerReviews, userName = null) {
  const container = document.getElementById('reviewsCustomerContainer');
  if (!container) return;
  
  // Get user name from profile or default
  const profileName = userName || document.querySelector('.full-name')?.textContent || 'this user';
  
  // Clear existing content
  container.innerHTML = '';
  
  if (customerReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #e6d6ae; padding: 2rem;">
        <p style="color: #bfc6d0; font-size: 1rem; line-height: 1.8;">No reviews of ${profileName} as a customer yet.</p>
      </div>
    `;
    return;
  }
  
  customerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}

// Populate worker reviews (backend ready)
function populateWorkerReviews(workerReviews = sampleWorkerReviews, userName = null) {
  const container = document.getElementById('reviewsWorkerContainer');
  if (!container) return;
  
  // Get user name from profile or default
  const profileName = userName || document.querySelector('.full-name')?.textContent || 'this user';
  
  // Clear existing content
  container.innerHTML = '';
  
  if (workerReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #e6d6ae; padding: 2rem;">
        <h3 style="color: #e6d6ae; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">No Jobs Completed Yet.</h3>
        <p style="color: #bfc6d0; font-size: 1rem; line-height: 1.8;">All reviews of ${profileName} completing jobs will be displayed here.</p>
      </div>
    `;
    return;
  }
  
  workerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}