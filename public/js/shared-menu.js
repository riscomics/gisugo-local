// ========================== SHARED MENU SYSTEM ==========================
// Single source of truth for all 5-icon menu overlays
// Uses the exact same simple paths that worked in the original hardcoded version
// 🔥 FIREBASE READY - Auth enforcement activates when Firebase is connected

// ⚙️ DEV MODE: Set to false when Firebase auth is ready for production
// When true: All menu items accessible without login (for development/testing)
// When false: Protected items redirect to login.html if not authenticated
const DEV_MODE_BYPASS_AUTH = true;

const MENU_ITEMS = [
  {
    emoji: '🏠',
    text: 'Home',
    link: 'index.html',
    requiresAuth: false  // Home is always accessible
  },
  {
    emoji: '✏️',
    text: 'Post',
    link: 'new-post2.html',
    requiresAuth: true   // Requires login (when auth active)
  },
  {
    emoji: '💬',
    text: 'Messages',
    link: 'messages.html',
    requiresAuth: true   // Requires login (when auth active)
  },
  {
    emoji: '💼',
    text: 'Gigs',
    link: 'jobs.html',
    requiresAuth: true   // Requires login (when auth active)
  },
  {
    emoji: '👤',
    text: 'Profile',
    link: 'profile.html',
    id: 'profile-menu-item',
    requiresAuth: true   // Requires login (when auth active)
  }
];

// Check if Firebase is actually configured and connected
function isFirebaseActive() {
  return typeof firebase !== 'undefined' && 
         firebase.apps && 
         firebase.apps.length > 0;
}

// Check if user is currently logged in
function checkUserLoggedIn() {
  // If dev mode is on OR Firebase isn't active, allow access
  if (DEV_MODE_BYPASS_AUTH || !isFirebaseActive()) {
    return true; // Bypass auth check in dev mode
  }
  
  // Production mode with Firebase active - check actual auth state
  if (typeof isLoggedIn === 'function') {
    return isLoggedIn();
  }
  return false;
}

// Handle menu item click with auth check
function handleMenuClick(link, requiresAuth) {
  // In dev mode or no Firebase: always allow navigation
  if (DEV_MODE_BYPASS_AUTH || !isFirebaseActive()) {
    window.location.href = link;
    return;
  }
  
  // Production mode: enforce auth for protected items
  if (requiresAuth && !checkUserLoggedIn()) {
    window.location.href = 'login.html';
  } else {
    window.location.href = link;
  }
}

// Dynamically generates menu HTML with emojis
function generateMenuHTML() {
  let menuHTML = MENU_ITEMS.map(item => {
    const link = item.link || '#';
    const itemId = item.id ? `id="${item.id}"` : '';
    const clickHandler = item.link 
      ? `onclick="handleMenuClick('${item.link}', ${item.requiresAuth})"` 
      : '';
    const cursorStyle = !item.link ? 'style="cursor: default; opacity: 0.5;"' : '';
    
    return `
      <div class="menu-item-wrapper ${item.text.toLowerCase()}-menu-item" ${itemId} ${clickHandler} ${cursorStyle}>
        <div class="menu-emoji">${item.emoji}</div>
        <div>${item.text}</div>
      </div>
    `;
  }).join('');
  
  // Only show Logout when Firebase is active AND user is logged in
  if (isFirebaseActive() && !DEV_MODE_BYPASS_AUTH && typeof isLoggedIn === 'function' && isLoggedIn()) {
    menuHTML += `
      <div class="menu-item-wrapper logout-menu-item" onclick="handleMenuLogout()" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
        <div class="menu-emoji">🚪</div>
        <div>Logout</div>
      </div>
    `;
  }
  
  return menuHTML;
}

// Handle logout from menu
async function handleMenuLogout() {
  if (typeof logout === 'function') {
    const result = await logout();
    if (result.success) {
      console.log('✅ Logged out successfully');
      window.location.href = 'index.html';
    }
  } else {
    // Fallback for pages without Firebase
    localStorage.removeItem('gisugo_current_user');
    window.location.href = 'index.html';
  }
}

// Initialize menu on page load
function initializeSharedMenu() {
  // Find the menu container (works across different page types)
  const menuContainer = document.querySelector(
    '.profile-menu-items, .jobcat-menu-items, .new-post-menu-items, .messages-menu-items, .jobs-menu-items, .uniform-menu-items'
  );
  
  if (!menuContainer) {
    console.warn('Shared Menu: No menu container found on this page');
    return;
  }
  
  // Generate and insert menu HTML
  menuContainer.innerHTML = generateMenuHTML();
  
  // Apply appropriate CSS classes based on page type
  const menuItems = menuContainer.querySelectorAll('.menu-item-wrapper');
  menuItems.forEach(item => {
    // Determine the correct class name based on container type
    if (menuContainer.classList.contains('profile-menu-items')) {
      item.className = item.className.replace('menu-item-wrapper', 'profile-menu-item');
    } else if (menuContainer.classList.contains('jobcat-menu-items')) {
      item.className = item.className.replace('menu-item-wrapper', 'jobcat-menu-item');
    } else if (menuContainer.classList.contains('new-post-menu-items')) {
      item.className = item.className.replace('menu-item-wrapper', 'new-post-menu-item');
    } else if (menuContainer.classList.contains('messages-menu-items')) {
      item.className = item.className.replace('menu-item-wrapper', 'messages-menu-item');
    } else if (menuContainer.classList.contains('jobs-menu-items')) {
      item.className = item.className.replace('menu-item-wrapper', 'jobs-menu-item');
    } else if (menuContainer.classList.contains('uniform-menu-items')) {
      item.className = item.className.replace('menu-item-wrapper', 'uniform-menu-item');
    }
  });
  
  console.log('Shared Menu: Successfully initialized');
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSharedMenu); 