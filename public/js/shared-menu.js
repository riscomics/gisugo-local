// ========================== SHARED MENU SYSTEM ==========================
// Single source of truth for all 5-icon menu overlays

const MENU_ITEMS = [
  { icon: 'Home.png', text: 'Home', link: 'index.html' },
  { icon: 'Messages.png', text: 'Messages', link: null }, // Future implementation
  { icon: 'Profile.png', text: 'Profile', link: 'profile.html' },
  { icon: 'Jobs.png', text: 'Jobs', link: null }, // Future implementation
  { icon: 'Post.png', text: 'Post', link: 'new-post.html' }
];

// Robust path detection that works across different server environments
function detectPathPrefix() {
  const currentPath = window.location.pathname;
  console.log('🔍 Full current path:', currentPath);
  
  // Remove the filename to get the directory path
  const pathParts = currentPath.split('/');
  const fileName = pathParts[pathParts.length - 1];
  const directoryPath = pathParts.slice(0, -1).join('/');
  
  console.log('📁 Directory path:', directoryPath);
  console.log('📄 File name:', fileName);
  
  // Count how many levels deep we are from root
  const levels = directoryPath.split('/').filter(part => part && part.trim() !== '');
  const depth = levels.length;
  
  console.log('📊 Directory levels:', levels);
  console.log('📏 Calculated depth:', depth);
  
  // Generate prefix based on depth
  const prefix = depth > 0 ? '../'.repeat(depth) : '';
  console.log('🎯 Generated prefix:', `"${prefix}"`);
  
  return prefix;
}

// Auto-detects page depth and adjusts paths accordingly
function getCorrectPath(basePath) {
  if (!basePath) return '#'; // Handle null links (future features)
  
  const prefix = detectPathPrefix();
  const fullPath = prefix + basePath;
  
  console.log('🔗 Link path for', basePath, '→', fullPath);
  
  return fullPath;
}

// Auto-detects icon path based on page depth with robust online/local handling
function getIconPath(iconName) {
  const prefix = detectPathPrefix();
  const iconPath = prefix + 'public/icons/' + iconName;
  
  console.log('🖼️ Icon path for', iconName, '→', iconPath);
  
  return iconPath;
}

// Dynamically generates menu HTML based on current page type
function generateMenuHTML() {
  console.log('🚀 Generating menu HTML...');
  
  return MENU_ITEMS.map(item => {
    const link = getCorrectPath(item.link);
    const iconPath = getIconPath(item.icon);
    const clickHandler = link !== '#' ? `onclick="window.location.href='${link}'"` : '';
    const cursorStyle = link === '#' ? 'style="cursor: default; opacity: 0.5;"' : '';
    
    // Add error handling for missing icons
    const imgElement = `<img src="${iconPath}" alt="${item.text}" onerror="console.error('❌ Failed to load icon:', this.src); this.style.backgroundColor='#ff6b6b'; this.style.color='white'; this.innerHTML='${item.text[0]}'; this.style.textAlign='center'; this.style.lineHeight='48px';">`;
    
    return `
      <div class="menu-item-wrapper ${item.text.toLowerCase()}-menu-item" ${clickHandler} ${cursorStyle}>
        ${imgElement}
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