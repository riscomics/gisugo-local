// ========================== SHARED MENU SYSTEM ==========================
// Single source of truth for all 5-icon menu overlays

const MENU_ITEMS = [
  { icon: 'Home.png', text: 'Home', link: 'index.html' },
  { icon: 'Messages.png', text: 'Messages', link: null }, // Future implementation
  { icon: 'Profile.png', text: 'Profile', link: 'profile.html' },
  { icon: 'Jobs.png', text: 'Jobs', link: null }, // Future implementation
  { icon: 'Post.png', text: 'Post', link: 'new-post.html' }
];

// Auto-detects page depth and adjusts paths accordingly
function getCorrectPath(basePath) {
  if (!basePath) return '#'; // Handle null links (future features)
  
  // Get current page depth by counting path segments
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/').filter(segment => segment && segment !== 'index.html');
  
  // Calculate how many levels deep we are from the root
  // Root pages (like profile.html): depth = 0
  // public/jobs/category/job.html: depth = 3
  const depth = pathSegments.length - 1;
  
  // Generate the correct relative path prefix
  const prefix = depth > 0 ? '../'.repeat(depth) : '';
  
  return prefix + basePath;
}

// Auto-detects icon path based on page depth
function getIconPath(iconName) {
  const currentPath = window.location.pathname;
  const pathSegments = currentPath.split('/').filter(segment => segment && segment !== 'index.html');
  const depth = pathSegments.length - 1;
  
  const prefix = depth > 0 ? '../'.repeat(depth) : '';
  return prefix + 'public/icons/' + iconName;
}

// Dynamically generates menu HTML based on current page type
function generateMenuHTML() {
  return MENU_ITEMS.map(item => {
    const link = getCorrectPath(item.link);
    const iconPath = getIconPath(item.icon);
    const clickHandler = link !== '#' ? `onclick="window.location.href='${link}'"` : '';
    const cursorStyle = link === '#' ? 'style="cursor: default; opacity: 0.5;"' : '';
    
    return `
      <div class="menu-item-wrapper ${item.text.toLowerCase()}-menu-item" ${clickHandler} ${cursorStyle}>
        <img src="${iconPath}" alt="${item.text}">
        <div>${item.text}</div>
      </div>
    `;
  }).join('');
}

// Initialize menu on page load
function initializeSharedMenu() {
  // Find the menu container (works across different page types)
  const menuContainer = document.querySelector(
    '.profile-menu-items, .jobcat-menu-items, .new-post-menu-items'
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
    }
  });
  
  console.log('Shared Menu: Successfully initialized');
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeSharedMenu); 