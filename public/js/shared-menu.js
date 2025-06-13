// ========================== SHARED MENU SYSTEM ==========================
// Single source of truth for all 5-icon menu overlays
// Uses the exact same simple paths that worked in the original hardcoded version

const MENU_ITEMS = [
  {
    icon: 'public/icons/Home.png',
    text: 'Home',
    link: 'index.html'
  },
  {
    icon: 'public/icons/Messages.png',
    text: 'Messages',
    link: 'messages.html'
  },
  {
    icon: 'public/icons/Profile.png',
    text: 'Profile',
    link: 'profile.html'
  },
  {
    icon: 'public/icons/Jobs.png',
    text: 'Jobs',
    link: null // Future implementation
  },
  {
    icon: 'public/icons/Post.png',
    text: 'Post',
    link: 'new-post.html'
  }
];

// Dynamically generates menu HTML - using exact same paths as original hardcoded version
function generateMenuHTML() {
  return MENU_ITEMS.map(item => {
    const link = item.link || '#';
    const clickHandler = item.link ? `onclick="window.location.href='${item.link}'"` : '';
    const cursorStyle = !item.link ? 'style="cursor: default; opacity: 0.5;"' : '';
    
    return `
      <div class="menu-item-wrapper ${item.text.toLowerCase()}-menu-item" ${clickHandler} ${cursorStyle}>
        <img src="${item.icon}" alt="${item.text}">
        <div>${item.text}</div>
      </div>
    `;
  }).join('');
}

// Initialize menu on page load
function initializeSharedMenu() {
  // Find the menu container (works across different page types)
  const menuContainer = document.querySelector(
    '.profile-menu-items, .jobcat-menu-items, .new-post-menu-items, .messages-menu-items'
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
    }
  });
  
  console.log('Shared Menu: Successfully initialized');
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSharedMenu); 