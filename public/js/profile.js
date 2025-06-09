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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('Profile page loaded');
}); 