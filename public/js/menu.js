document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.header__menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  let isMenuOpen = false;

  // Create SVG elements for both hamburger and X icons
  const hamburgerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>`;

  const closeSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`;

  // Toggle menu when hamburger button is clicked
  menuButton.addEventListener('click', (event) => {
    event.stopPropagation(); // Prevent click from bubbling to document
    isMenuOpen = !isMenuOpen;
    menuOverlay.classList.toggle('active');
    menuButton.innerHTML = isMenuOpen ? closeSVG : hamburgerSVG;
  });

  // Close menu when clicking outside
  document.addEventListener('click', (event) => {
    if (isMenuOpen && 
        !menuButton.contains(event.target) && 
        !menuOverlay.contains(event.target)) {
      isMenuOpen = false;
      menuOverlay.classList.remove('active');
      menuButton.innerHTML = hamburgerSVG;
    }
  });

  // Close menu when pressing Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      isMenuOpen = false;
      menuOverlay.classList.remove('active');
      menuButton.innerHTML = hamburgerSVG;
    }
  });

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
}); 