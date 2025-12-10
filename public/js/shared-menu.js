// ========================== SHARED MENU SYSTEM ==========================
// Single source of truth for all 5-icon menu overlays
// Uses the exact same simple paths that worked in the original hardcoded version
// 🔥 FIREBASE INTEGRATED - Shows login/logout based on auth state

const MENU_ITEMS = [
  {
    emoji: '🏠',
    text: 'Home',
    link: 'index.html'
  },
  {
    emoji: '✏️',
    text: 'Post',
    link: 'new-post2.html'
  },
  {
    emoji: '💬',
    text: 'Messages',
    link: 'messages.html'
  },
  {
    emoji: '💼',
    text: 'Gigs',
    link: 'jobs.html'
  },
  {
    emoji: '👤',
    text: 'Profile',
    link: 'profile.html',
    id: 'profile-menu-item'
  }
];

// Dynamically generates menu HTML with emojis
function generateMenuHTML() {
  // Check if user is logged in (Firebase auth)
  const isUserLoggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;
  
  let menuHTML = MENU_ITEMS.map(item => {
    const link = item.link || '#';
    const clickHandler = item.link ? `onclick="window.location.href='${item.link}'"` : '';
    const cursorStyle = !item.link ? 'style="cursor: default; opacity: 0.5;"' : '';
    const itemId = item.id ? `id="${item.id}"` : '';
    
    return `
      <div class="menu-item-wrapper ${item.text.toLowerCase()}-menu-item" ${itemId} ${clickHandler} ${cursorStyle}>
        <div class="menu-emoji">${item.emoji}</div>
        <div>${item.text}</div>
      </div>
    `;
  }).join('');
  
  // Add login/logout item based on auth state
  if (isUserLoggedIn) {
    menuHTML += `
      <div class="menu-item-wrapper logout-menu-item" onclick="handleMenuLogout()" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
        <div class="menu-emoji">🚪</div>
        <div>Logout</div>
      </div>
    `;
  } else {
    menuHTML += `
      <div class="menu-item-wrapper login-menu-item" onclick="window.location.href='login.html'" style="margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
        <div class="menu-emoji">🔐</div>
        <div>Login</div>
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