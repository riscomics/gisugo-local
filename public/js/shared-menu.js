// ========================== SHARED MENU SYSTEM ==========================
// Card-grid panel menu — consistent across ALL pages (listing + uniform header)
// 🔥 FIREBASE READY - Auth enforcement controlled by APP_CONFIG

const MENU_ITEMS = [
  { emoji: '✏️', text: 'Post Gig',     link: 'new-post2.html', requiresAuth: true,  color: 'amber'  },
  { emoji: '😊', text: 'Account',      link: 'profile.html',   requiresAuth: true,  color: 'purple' },
  { emoji: '💬', text: 'Messages',     link: 'messages.html',  requiresAuth: true,  color: 'cyan'   },
  { emoji: '💼', text: 'Gigs Manager', link: 'jobs.html',      requiresAuth: true,  color: 'green'  },
  { emoji: '🚀', text: 'Updates',      link: 'updates.html',   requiresAuth: false, color: 'orange' },
  { emoji: '🎭', text: 'Community',    link: 'forum.html',     requiresAuth: false, color: 'teal'   },
  { emoji: '🏠', text: 'Home',         link: 'index.html',     requiresAuth: false, color: 'blue'   },
  { emoji: '📬', text: 'Contact',      link: 'contacts.html',  requiresAuth: false, color: 'pink'   },
];

function checkUserLoggedIn() {
  if (typeof APP_CONFIG !== 'undefined' && !APP_CONFIG.requireAuth()) return true;
  if (typeof isLoggedIn === 'function') return isLoggedIn();
  return false;
}

// Navigate with auth check — closes whichever overlay is active first
function sharedMenuNavigate(e, link, requiresAuth) {
  if (e) e.preventDefault();
  // Close any open overlay
  const uOverlay = document.querySelector('.uniform-menu-overlay');
  if (uOverlay) uOverlay.classList.remove('show');
  const jOverlay = document.getElementById('jobcatMenuOverlay');
  if (jOverlay) jOverlay.classList.remove('show');

  setTimeout(() => handleMenuClick(link, requiresAuth), 120);
}
window.sharedMenuNavigate = sharedMenuNavigate;

function handleMenuClick(link, requiresAuth) {
  const isDevMode         = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.devMode : false;
  const firebaseConnected = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.isFirebaseConnected : false;

  if (isDevMode || !firebaseConnected) {
    window.location.href = link;
    return;
  }

  if (requiresAuth) {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const unsub = firebase.auth().onAuthStateChanged(function(user) {
        unsub();
        window.location.href = user ? link : 'login.html';
      });
    } else {
      window.location.href = 'login.html';
    }
  } else {
    window.location.href = link;
  }
}

// Build a single card element string
function buildCard(emoji, text, link, color, requiresAuth) {
  return `<a class="unif-menu-card" href="${link}"
              data-color="${color}"
              onclick="sharedMenuNavigate(event,'${link}',${requiresAuth})">
    <span class="unif-menu-card-icon">${emoji}</span>
    <span class="unif-menu-card-label">${text}</span>
  </a>`;
}

// Generate the full grid HTML (section label + cards)
function generateMenuHTML() {
  let html = '<div class="unif-menu-section-label">Menu</div>';
  html += MENU_ITEMS.map(item =>
    buildCard(item.emoji, item.text, item.link, item.color, item.requiresAuth)
  ).join('');
  return html;
}

// Module-level reference so we can unsubscribe before re-subscribing
let _logoutAuthUnsub = null;

function _insertLogoutRow(container) {
  const existing = container.querySelector('.unif-menu-logout-row');
  if (existing) existing.remove();
  const row = document.createElement('div');
  row.className = 'unif-menu-logout-row';
  row.innerHTML = `
    <button class="unif-menu-logout-btn" onclick="handleSharedMenuLogout()">
      <span>🚪</span> Log Out
    </button>`;
  container.appendChild(row);
}

// Append logout row for logged-in users
function appendLogoutIfNeeded(container) {
  const firebaseConnected = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.isFirebaseConnected : false;
  const isDevMode         = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.devMode : false;

  // Firebase path: use auth state observer
  if (firebaseConnected && !isDevMode && typeof firebase !== 'undefined' && firebase.auth) {
    if (_logoutAuthUnsub) { _logoutAuthUnsub(); _logoutAuthUnsub = null; }
    _logoutAuthUnsub = firebase.auth().onAuthStateChanged(function(user) {
      const existing = container.querySelector('.unif-menu-logout-row');
      if (existing) existing.remove();
      if (user) _insertLogoutRow(container);
    });
    return;
  }

  // Fallback: pages without Firebase SDK (updates, forum, contacts, etc.)
  // Show logout if there is a local session in localStorage
  try {
    if (localStorage.getItem('gisugo_current_user')) {
      _insertLogoutRow(container);
    }
  } catch (e) { /* localStorage blocked */ }
}

async function handleSharedMenuLogout() {
  const uOverlay = document.querySelector('.uniform-menu-overlay');
  if (uOverlay) uOverlay.classList.remove('show');
  const jOverlay = document.getElementById('jobcatMenuOverlay');
  if (jOverlay) jOverlay.classList.remove('show');

  if (typeof logout === 'function') {
    const result = await logout();
    if (result.success) window.location.href = 'index.html';
  } else {
    localStorage.removeItem('gisugo_current_user');
    window.location.href = 'index.html';
  }
}
window.handleSharedMenuLogout = handleSharedMenuLogout;

// ── Populate a container with the card grid ──────────────────────────────────
function populateContainer(container) {
  if (!container) return;
  container.innerHTML = generateMenuHTML();
  appendLogoutIfNeeded(container);
}

// ── Initialize: detect which page type we're on ──────────────────────────────
function initializeSharedMenu() {
  // 1. Uniform-header pages (forum, updates, messages, jobs, profile, etc.)
  const uniformContainer = document.querySelector('.uniform-menu-items');
  if (uniformContainer) {
    populateContainer(uniformContainer);
    console.log('Shared Menu: initialized uniform-menu-items');
  }

  // 2. Listing / jobpage pages (.jobcat-menu-items)
  const jobcatContainer = document.querySelector('.jobcat-menu-items');
  if (jobcatContainer) {
    populateContainer(jobcatContainer);
    console.log('Shared Menu: initialized jobcat-menu-items');
  }

  if (!uniformContainer && !jobcatContainer) {
    console.warn('Shared Menu: No menu container found on this page');
  }
}

// Position the popup panel exactly below the page's borderline element
function positionSharedMenuPanel() {
  const panel = document.querySelector('.uniform-menu-items, .jobcat-menu-items');
  if (!panel) return;
  const borderline = document.querySelector(
    '.uniform-header-borderline, .jobcat-borderline'
  );
  if (borderline) {
    const bottom = borderline.getBoundingClientRect().bottom;
    panel.style.top = bottom + 'px';
  }
}
window.positionSharedMenuPanel = positionSharedMenuPanel;

let sharedMenuInitialized = false;

function autoInitSharedMenu() {
  if (sharedMenuInitialized) return;
  initializeSharedMenu();
  sharedMenuInitialized = true;
}

document.addEventListener('DOMContentLoaded', autoInitSharedMenu);

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    sharedMenuInitialized = false;
    autoInitSharedMenu();
  }
});

// Clean up the auth observer on unload so it doesn't linger in bfcache
window.addEventListener('pagehide', () => {
  if (_logoutAuthUnsub) {
    _logoutAuthUnsub();
    _logoutAuthUnsub = null;
  }
});
