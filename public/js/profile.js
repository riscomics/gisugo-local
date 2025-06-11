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
  
  // Set default active option
  const defaultOption = profileDropdownOverlay?.querySelector('a[data-option="user-info"]');
  if (defaultOption) {
    defaultOption.classList.add('active');
  }
}); 