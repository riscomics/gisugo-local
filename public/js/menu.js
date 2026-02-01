document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.header__menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  let isMenuOpen = false;

  // Use static image icon like main pages (no innerHTML swapping)
  const iconImg = menuButton ? menuButton.querySelector('img') : null;

  // Event handler functions (stored for cleanup)
  const handleMenuClick = (event) => {
    event.stopPropagation(); // Prevent click from bubbling to document
    isMenuOpen = !isMenuOpen;
    menuOverlay.classList.toggle('active');
    // Keep icon static to match main pages
  };

  const handleDocumentClick = (event) => {
    if (isMenuOpen && 
        !menuButton.contains(event.target) && 
        !menuOverlay.contains(event.target)) {
      isMenuOpen = false;
      menuOverlay.classList.remove('active');
      // Keep icon static
    }
  };

  const handleEscapeKey = (event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      isMenuOpen = false;
      menuOverlay.classList.remove('active');
      // Keep icon static
    }
  };

  // Toggle menu when hamburger button is clicked
  menuButton.addEventListener('click', handleMenuClick);

  // Close menu when clicking outside
  document.addEventListener('click', handleDocumentClick);

  // Close menu when pressing Escape key
  document.addEventListener('keydown', handleEscapeKey);

  // Dropdown for service menu in listing header
  const serviceMenuBtn = document.getElementById('serviceMenuBtn');
  const serviceMenuOverlay = document.getElementById('serviceMenuOverlay');

  if (serviceMenuBtn && serviceMenuOverlay) {
    serviceMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      serviceMenuOverlay.classList.toggle('show');
    });

    // Close overlay when clicking outside
    document.addEventListener('click', function(e) {
      if (serviceMenuOverlay.classList.contains('show') && !serviceMenuBtn.contains(e.target)) {
        serviceMenuOverlay.classList.remove('show');
      }
    });

    // Close overlay when clicking a menu item
    serviceMenuOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        serviceMenuOverlay.classList.remove('show');
      }
    });
  }

  // Dropdown for job listing header
  const listingServiceMenuBtn = document.getElementById('listingServiceMenuBtn');
  const listingServiceMenuOverlay = document.getElementById('listingServiceMenuOverlay');

  if (listingServiceMenuBtn && listingServiceMenuOverlay) {
    listingServiceMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      listingServiceMenuOverlay.classList.toggle('show');
    });

    // Close overlay when clicking outside
    document.addEventListener('click', function(e) {
      if (listingServiceMenuOverlay.classList.contains('show') && !listingServiceMenuBtn.contains(e.target)) {
        listingServiceMenuOverlay.classList.remove('show');
      }
    });

    // Close overlay when clicking a menu item
    listingServiceMenuOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'A') {
        listingServiceMenuOverlay.classList.remove('show');
      }
    });
  }

  // Cleanup: Remove event listeners on page unload (defensive, usually not needed for full page loads)
  window.addEventListener('beforeunload', () => {
    menuButton.removeEventListener('click', handleMenuClick);
    document.removeEventListener('click', handleDocumentClick);
    document.removeEventListener('keydown', handleEscapeKey);
  });
}); 