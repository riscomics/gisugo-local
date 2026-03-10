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

const SHARED_MENU_CSS_HREF = 'public/css/shared-menu.css?v=3.6';
const LOGOUT_RETRY_DELAY_MS = 250;
const LOGOUT_MAX_RETRIES = 20;
const SHARED_MENU_DEPENDENCY_SCRIPTS = [
  {
    key: 'firebase-app-compat',
    match: 'firebase-app-compat.js',
    src: 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js'
  },
  {
    key: 'firebase-auth-compat',
    match: 'firebase-auth-compat.js',
    src: 'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js'
  },
  {
    key: 'firebase-firestore-compat',
    match: 'firebase-firestore-compat.js',
    src: 'https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js'
  },
  {
    key: 'firebase-config',
    match: 'public/js/firebase-config.js',
    src: 'public/js/firebase-config.js'
  },
  {
    key: 'firebase-db',
    match: 'public/js/firebase-db.js',
    src: 'public/js/firebase-db.js?v=21'
  },
  {
    key: 'firebase-auth-helper',
    match: 'public/js/firebase-auth.js',
    src: 'public/js/firebase-auth.js'
  },
  {
    key: 'app-config',
    match: 'public/js/app-config.js',
    src: 'public/js/app-config.js?v=1.0'
  }
];
const _scriptLoadPromises = new Map();
const SHARED_MENU_BADGE_PULSE_STYLE_ID = 'shared-menu-badge-pulse-style';

function checkUserLoggedIn() {
  if (typeof APP_CONFIG !== 'undefined' && !APP_CONFIG.requireAuth()) return true;
  if (typeof isLoggedIn === 'function') return isLoggedIn();
  return false;
}

function ensureSharedMenuStylesheetLoaded() {
  const existingLinks = Array.from(document.querySelectorAll('link[href*="shared-menu.css"]'));
  if (existingLinks.length > 0) {
    existingLinks.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const baseHref = href.split('?')[0];
      if (baseHref.includes('shared-menu.css')) {
        link.setAttribute('href', SHARED_MENU_CSS_HREF);
      }
    });
    return;
  }

  const head = document.head || document.querySelector('head');
  if (!head) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = SHARED_MENU_CSS_HREF;
  head.appendChild(link);
  console.warn('Shared Menu: shared-menu.css was missing, injected dynamically');
}

function ensureSharedMenuBadgePulseStyles() {
  if (document.getElementById(SHARED_MENU_BADGE_PULSE_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = SHARED_MENU_BADGE_PULSE_STYLE_ID;
  style.textContent = `
    .shared-menu-messages-badge,
    .jobcat-menu-unread-badge,
    .header-menu-unread-badge,
    .uniform-menu-unread-badge {
      animation: menuBadgeColorPulse 2.4s ease-in-out infinite;
    }
    @keyframes menuBadgeColorPulse {
      0%, 100% { background: #ef4444; }
      50% { background: #f59e0b; }
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function isScriptPresent(match) {
  return !!document.querySelector(`script[src*="${match}"]`);
}

function loadScriptOnce(definition) {
  if (isScriptPresent(definition.match)) {
    return Promise.resolve();
  }
  if (_scriptLoadPromises.has(definition.key)) {
    return _scriptLoadPromises.get(definition.key);
  }

  const promise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = definition.src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${definition.src}`));
    (document.head || document.body || document.documentElement).appendChild(script);
  });

  _scriptLoadPromises.set(definition.key, promise);
  return promise;
}

function bootstrapSharedMenuDependencies() {
  let sequence = Promise.resolve();
  SHARED_MENU_DEPENDENCY_SCRIPTS.forEach((definition) => {
    sequence = sequence.then(() => loadScriptOnce(definition));
  });
  return sequence;
}

function isHomeOverlayElement(overlay) {
  if (!overlay) return false;
  return overlay.classList.contains('menu-overlay') || overlay.id === 'homeMenuOverlay';
}

function setOverlayOpenState(overlay, shouldOpen) {
  if (!overlay) return;
  if (isHomeOverlayElement(overlay)) {
    overlay.classList.toggle('active', shouldOpen);
  } else {
    overlay.classList.toggle('show', shouldOpen);
  }
}

function isOverlayOpen(overlay) {
  if (!overlay) return false;
  return isHomeOverlayElement(overlay)
    ? overlay.classList.contains('active')
    : overlay.classList.contains('show');
}

function closeAllSharedMenuOverlays() {
  const uOverlay = document.querySelector('.uniform-menu-overlay');
  const jOverlay = document.getElementById('jobcatMenuOverlay');
  const hOverlay = document.querySelector('.menu-overlay');
  setOverlayOpenState(uOverlay, false);
  setOverlayOpenState(jOverlay, false);
  setOverlayOpenState(hOverlay, false);

  const backdrop = document.getElementById('menuBackdrop');
  if (backdrop) backdrop.classList.remove('active');
}

function openSharedMenuOverlay(overlay) {
  if (!overlay) return;
  closeAllSharedMenuOverlays();
  setOverlayOpenState(overlay, true);
  if (!isHomeOverlayElement(overlay) && typeof positionSharedMenuPanel === 'function') {
    positionSharedMenuPanel();
  }
}

function toggleSharedMenuOverlay(overlay) {
  if (!overlay) return;
  const currentlyOpen = isOverlayOpen(overlay);
  if (currentlyOpen) {
    setOverlayOpenState(overlay, false);
    if (isHomeOverlayElement(overlay)) {
      const backdrop = document.getElementById('menuBackdrop');
      if (backdrop) backdrop.classList.remove('active');
    }
    return;
  }
  openSharedMenuOverlay(overlay);
}

// Navigate with auth check — closes whichever overlay is active first
function sharedMenuNavigate(e, link, requiresAuth) {
  if (e) e.preventDefault();
  closeAllSharedMenuOverlays();

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
  const hasUnreadBadge = String(text).toLowerCase() === 'messages';
  const badgeHtml = hasUnreadBadge
    ? '<span class="shared-menu-messages-badge" style="display:none;">0</span>'
    : '';
  return `<a class="home-menu-card" href="${link}"
              data-color="${color}"
              onclick="sharedMenuNavigate(event,'${link}',${requiresAuth})">
    <span class="home-menu-card-icon">${emoji}${badgeHtml}</span>
    <span class="home-menu-card-label">${text}</span>
  </a>`;
}

// Generate the full grid HTML (section label + cards)
function generateMenuHTML() {
  let html = '<div class="home-menu-section-label">Menu</div>';
  html += MENU_ITEMS.map(item =>
    buildCard(item.emoji, item.text, item.link, item.color, item.requiresAuth)
  ).join('');
  return html;
}

// Module-level reference so we can unsubscribe before re-subscribing
let _logoutAuthUnsub = null;
let _menuUnreadAuthUnsub = null;
let _menuUnreadCounterUnsub = null;
let _menuUnreadInitTimer = null;
let _menuCounterState = { workerUnread: 0, customerUnread: 0, totalUnread: 0 };

function formatMenuUnreadCount(totalUnread) {
  const safe = Math.max(0, Number(totalUnread) || 0);
  return safe > 99 ? '99+' : String(safe);
}

function applyMenuUnreadBadge(totalUnread) {
  const safe = Math.max(0, Number(totalUnread) || 0);
  const badges = document.querySelectorAll('.shared-menu-messages-badge');
  badges.forEach((badge) => {
    badge.textContent = formatMenuUnreadCount(safe);
    badge.style.display = safe > 0 ? 'inline-flex' : 'none';
  });

  // Support listing/job-detail menu icon badges on pages without header-uniform.js.
  const menuButtons = document.querySelectorAll('.jobcat-menu-btn');
  menuButtons.forEach((menuBtn) => {
    let iconBadge = menuBtn.querySelector('.jobcat-menu-unread-badge');
    if (!iconBadge) {
      iconBadge = document.createElement('span');
      iconBadge.className = 'jobcat-menu-unread-badge';
      menuBtn.appendChild(iconBadge);
    }
    iconBadge.textContent = formatMenuUnreadCount(safe);
    iconBadge.style.display = safe > 0 ? 'inline-flex' : 'none';
  });
}

function publishMenuCounterUpdate() {
  const detail = {
    workerUnread: Math.max(0, Number(_menuCounterState.workerUnread) || 0),
    customerUnread: Math.max(0, Number(_menuCounterState.customerUnread) || 0),
    totalUnread: Math.max(0, Number(_menuCounterState.totalUnread) || 0)
  };
  applyMenuUnreadBadge(detail.totalUnread);
  document.dispatchEvent(new CustomEvent('gisugo:notification-counter-update', { detail }));
}

function stopMenuUnreadCounterListeners() {
  if (_menuUnreadCounterUnsub) {
    _menuUnreadCounterUnsub();
    _menuUnreadCounterUnsub = null;
  }
  if (_menuUnreadAuthUnsub) {
    _menuUnreadAuthUnsub();
    _menuUnreadAuthUnsub = null;
  }
  if (_menuUnreadInitTimer) {
    clearTimeout(_menuUnreadInitTimer);
    _menuUnreadInitTimer = null;
  }
}

function startMenuUnreadCounterListeners(retry = 0) {
  if (typeof firebase === 'undefined' || !firebase.auth || typeof subscribeToUnreadNotificationCounters !== 'function') {
    if (retry < 120) {
      _menuUnreadInitTimer = setTimeout(() => startMenuUnreadCounterListeners(retry + 1), 500);
    }
    return;
  }
  if (_menuUnreadAuthUnsub) return;

  _menuUnreadAuthUnsub = firebase.auth().onAuthStateChanged((user) => {
    if (_menuUnreadCounterUnsub) {
      _menuUnreadCounterUnsub();
      _menuUnreadCounterUnsub = null;
    }
    if (!user) {
      _menuCounterState = { workerUnread: 0, customerUnread: 0, totalUnread: 0 };
      publishMenuCounterUpdate();
      return;
    }
    _menuUnreadCounterUnsub = subscribeToUnreadNotificationCounters(user, (counters) => {
      _menuCounterState = {
        workerUnread: Math.max(0, Number(counters?.workerUnread) || 0),
        customerUnread: Math.max(0, Number(counters?.customerUnread) || 0),
        totalUnread: Math.max(0, Number(counters?.totalUnread) || 0)
      };
      publishMenuCounterUpdate();
    });
  });
}

// Append logout row for logged-in users
function appendLogoutIfNeeded(container) {
  const firebaseConnected = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.isFirebaseConnected : false;
  const isDevMode         = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.devMode : false;
  if (!firebaseConnected || isDevMode) return false;

  // Always clean up the previous observer before creating a new one
  if (_logoutAuthUnsub) {
    _logoutAuthUnsub();
    _logoutAuthUnsub = null;
  }

  if (typeof firebase !== 'undefined' && firebase.auth) {
    _logoutAuthUnsub = firebase.auth().onAuthStateChanged(function(user) {
      const existing = container.querySelector('.home-menu-logout-row');
      if (existing) existing.remove();
      if (user) {
        const row = document.createElement('div');
        row.className = 'home-menu-logout-row';
        row.innerHTML = `
          <button class="home-menu-logout-btn" onclick="handleSharedMenuLogout()">
            <span>🚪</span> Log Out
          </button>`;
        container.appendChild(row);
      }
    });
    return true;
  }
  return false;
}

function appendLogoutWithRetry(container, attempt = 0) {
  if (!container) return;
  const isDevMode = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.devMode : false;
  if (isDevMode) return;

  const attached = appendLogoutIfNeeded(container);
  if (attached) return;

  if (attempt < LOGOUT_MAX_RETRIES) {
    setTimeout(() => appendLogoutWithRetry(container, attempt + 1), LOGOUT_RETRY_DELAY_MS);
  } else {
    console.warn('Shared Menu: logout observer not attached after retries');
  }
}

async function handleSharedMenuLogout() {
  closeAllSharedMenuOverlays();

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
  appendLogoutWithRetry(container);
  applyMenuUnreadBadge(_menuCounterState.totalUnread);
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
let sharedMenuInitInProgress = false;

function autoInitSharedMenu() {
  if (sharedMenuInitialized || sharedMenuInitInProgress) return;
  sharedMenuInitInProgress = true;
  ensureSharedMenuBadgePulseStyles();
  ensureSharedMenuStylesheetLoaded();
  bootstrapSharedMenuDependencies()
    .catch((error) => {
      console.warn('Shared Menu: dependency bootstrap issue, continuing anyway', error);
    })
    .finally(() => {
      initializeSharedMenu();
      startMenuUnreadCounterListeners();
      sharedMenuInitialized = true;
      sharedMenuInitInProgress = false;
    });
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
  stopMenuUnreadCounterListeners();
});

window.SharedMenuController = {
  open: openSharedMenuOverlay,
  toggle: toggleSharedMenuOverlay,
  closeAll: closeAllSharedMenuOverlays,
  isOpen: isOverlayOpen
};
