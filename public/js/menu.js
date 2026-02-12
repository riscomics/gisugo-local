// Store cleanup state globally to prevent double-initialization
let menuInitialized = false;
let menuHandlers = null;

function initializeMenu() {
  // Prevent double initialization
  if (menuInitialized) {
    console.log('⚠️ Menu already initialized, skipping...');
    return;
  }
  
  const menuButton = document.querySelector('.header__menu');
  const menuOverlay = document.querySelector('.menu-overlay');
  
  if (!menuButton || !menuOverlay) {
    console.log('⚠️ Menu elements not found');
    return;
  }
  
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
  
  // Store handlers for cleanup
  menuHandlers = {
    button: menuButton,
    menuClick: handleMenuClick,
    documentClick: handleDocumentClick,
    escapeKey: handleEscapeKey
  };
  
  menuInitialized = true;
  console.log('✅ Homepage menu initialized');

  // Dropdown for service menu in listing header
  const serviceMenuBtn = document.getElementById('serviceMenuBtn');
  const serviceMenuOverlay = document.getElementById('serviceMenuOverlay');

  if (serviceMenuBtn && serviceMenuOverlay) {
    const serviceMenuClickHandler = function(e) {
      e.stopPropagation();
      serviceMenuOverlay.classList.toggle('show');
    };
    
    const serviceDocClickHandler = function(e) {
      if (serviceMenuOverlay.classList.contains('show') && !serviceMenuBtn.contains(e.target)) {
        serviceMenuOverlay.classList.remove('show');
      }
    };
    
    const serviceOverlayClickHandler = function(e) {
      if (e.target.tagName === 'A') {
        serviceMenuOverlay.classList.remove('show');
      }
    };
    
    serviceMenuBtn.addEventListener('click', serviceMenuClickHandler);
    document.addEventListener('click', serviceDocClickHandler);
    serviceMenuOverlay.addEventListener('click', serviceOverlayClickHandler);
    
    // Store for cleanup
    menuHandlers.serviceMenu = {
      btn: serviceMenuBtn,
      overlay: serviceMenuOverlay,
      btnClick: serviceMenuClickHandler,
      docClick: serviceDocClickHandler,
      overlayClick: serviceOverlayClickHandler
    };
  }

  // Dropdown for job listing header
  const listingServiceMenuBtn = document.getElementById('listingServiceMenuBtn');
  const listingServiceMenuOverlay = document.getElementById('listingServiceMenuOverlay');

  if (listingServiceMenuBtn && listingServiceMenuOverlay) {
    const listingMenuClickHandler = function(e) {
      e.stopPropagation();
      listingServiceMenuOverlay.classList.toggle('show');
    };
    
    const listingDocClickHandler = function(e) {
      if (listingServiceMenuOverlay.classList.contains('show') && !listingServiceMenuBtn.contains(e.target)) {
        listingServiceMenuOverlay.classList.remove('show');
      }
    };
    
    const listingOverlayClickHandler = function(e) {
      if (e.target.tagName === 'A') {
        listingServiceMenuOverlay.classList.remove('show');
      }
    };
    
    listingServiceMenuBtn.addEventListener('click', listingMenuClickHandler);
    document.addEventListener('click', listingDocClickHandler);
    listingServiceMenuOverlay.addEventListener('click', listingOverlayClickHandler);
    
    // Store for cleanup
    menuHandlers.listingServiceMenu = {
      btn: listingServiceMenuBtn,
      overlay: listingServiceMenuOverlay,
      btnClick: listingMenuClickHandler,
      docClick: listingDocClickHandler,
      overlayClick: listingOverlayClickHandler
    };
  }

}

// Cleanup function
function cleanupMenu() {
  if (!menuHandlers) return;
  
  console.log('🧹 Cleaning up homepage menu handlers');
  
  // Clean up main menu
  menuHandlers.button.removeEventListener('click', menuHandlers.menuClick);
  document.removeEventListener('click', menuHandlers.documentClick);
  document.removeEventListener('keydown', menuHandlers.escapeKey);
  
  // Clean up service menu dropdown (if exists)
  if (menuHandlers.serviceMenu) {
    menuHandlers.serviceMenu.btn.removeEventListener('click', menuHandlers.serviceMenu.btnClick);
    document.removeEventListener('click', menuHandlers.serviceMenu.docClick);
    menuHandlers.serviceMenu.overlay.removeEventListener('click', menuHandlers.serviceMenu.overlayClick);
  }
  
  // Clean up listing service menu dropdown (if exists)
  if (menuHandlers.listingServiceMenu) {
    menuHandlers.listingServiceMenu.btn.removeEventListener('click', menuHandlers.listingServiceMenu.btnClick);
    document.removeEventListener('click', menuHandlers.listingServiceMenu.docClick);
    menuHandlers.listingServiceMenu.overlay.removeEventListener('click', menuHandlers.listingServiceMenu.overlayClick);
  }
  
  menuHandlers = null;
  menuInitialized = false;
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeMenu);

// CRITICAL: Re-initialize when page is restored from bfcache (mobile swipe back)
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Page was loaded from bfcache (browser back/forward cache)
    console.log('🔄 Page restored from cache - re-initializing menu');
    cleanupMenu();
    initializeMenu();
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupMenu); 