// ============================================================================
// 🔔 GISUGO PUSH NOTIFICATIONS (FCM WEB)
// ============================================================================

(function () {
  const PUSH_TOKEN_STORAGE_KEY = 'gisugo_push_token';
  const PUSH_LAST_UID_STORAGE_KEY = 'gisugo_push_last_uid';
  const PUSH_PROMPT_TS_KEY = 'gisugo_push_prompt_ts';
  const PUSH_PROMPT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
  const PUSH_MODAL_ID = 'gisugo-push-optin-modal';
  const PUSH_TEST_STATUS_ID = 'gisugo-push-test-status';

  let messagingInstance = null;
  let swRegistration = null;
  let authUnsubscribe = null;
  let initialized = false;
  let currentUid = '';
  const userPushPrefCache = new Map();

  function isSupportedEnvironment() {
    return (
      typeof window !== 'undefined' &&
      typeof firebase !== 'undefined' &&
      typeof firebase.messaging === 'function' &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      typeof Notification !== 'undefined'
    );
  }

  function canUsePushOnOrigin() {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    return window.isSecureContext || isLocal;
  }

  function getStoredPushToken() {
    try {
      return String(localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) || '');
    } catch (_) {
      return '';
    }
  }

  function setStoredPushToken(token) {
    try {
      if (token) localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      else localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    } catch (_) {
      // Ignore localStorage failures.
    }
  }

  function setStoredUid(uid) {
    try {
      if (uid) localStorage.setItem(PUSH_LAST_UID_STORAGE_KEY, uid);
      else localStorage.removeItem(PUSH_LAST_UID_STORAGE_KEY);
    } catch (_) {
      // Ignore localStorage failures.
    }
  }

  function shouldPromptForPermission() {
    if (Notification.permission !== 'default') return false;
    try {
      const lastPromptTs = Number(localStorage.getItem(PUSH_PROMPT_TS_KEY) || '0');
      return !lastPromptTs || (Date.now() - lastPromptTs) > PUSH_PROMPT_COOLDOWN_MS;
    } catch (_) {
      return true;
    }
  }

  function markPermissionPrompted() {
    try {
      localStorage.setItem(PUSH_PROMPT_TS_KEY, String(Date.now()));
    } catch (_) {
      // Ignore localStorage failures.
    }
  }


  function isIOSFamilyBrowser() {
    const ua = navigator.userAgent || '';
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const iPadOSDesktopUA = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return iOS || iPadOSDesktopUA;
  }

  function isStandalonePwa() {
    if (typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(display-mode: standalone)');
      if (media && media.matches) return true;
    }
    return Boolean(navigator.standalone);
  }

  function getAdaptivePromptMode() {
    if (!isSupportedEnvironment() || !canUsePushOnOrigin()) return 'unsupported';
    if (Notification.permission === 'granted') return 'already_granted';
    if (Notification.permission === 'denied') return 'blocked';
    if (isIOSFamilyBrowser() && !isStandalonePwa()) return 'ios_add_to_home';
    return 'enable';
  }

  function removePromptModal() {
    const existing = document.getElementById(PUSH_MODAL_ID);
    if (existing) existing.remove();
  }

  function ensurePushModalSpinnerStyles() {
    if (document.getElementById('gisugo-push-spinner-style')) return;
    const style = document.createElement('style');
    style.id = 'gisugo-push-spinner-style';
    style.textContent = `
      @keyframes gisugoPushSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  function setPromptBusyState(modal, busy, busyText = 'Working...') {
    if (!modal) return;
    ensurePushModalSpinnerStyles();
    const actionButtons = modal.querySelectorAll('button[data-action]');
    actionButtons.forEach((btn) => {
      btn.disabled = !!busy;
      btn.style.opacity = busy ? '0.7' : '1';
      btn.style.cursor = busy ? 'wait' : 'pointer';
    });
    const primaryButton = modal.querySelector('button[data-action="enable"], button[data-action="added"]');
    if (primaryButton) {
      if (busy) {
        primaryButton.dataset.originalLabel = primaryButton.textContent || '';
        primaryButton.textContent = busyText;
      } else if (primaryButton.dataset.originalLabel) {
        primaryButton.textContent = primaryButton.dataset.originalLabel;
        delete primaryButton.dataset.originalLabel;
      }
    }
    const spinnerOverlay = modal.querySelector('#gisugo-push-loading-overlay');
    if (spinnerOverlay) {
      spinnerOverlay.style.display = busy ? 'flex' : 'none';
    }
  }

  function showPushTestStatus(message, type = 'info') {
    if (!message) return;
    const palette = {
      info: { bg: '#1f2937', fg: '#f3f4f6', border: '#4b5563' },
      success: { bg: '#064e3b', fg: '#d1fae5', border: '#059669' },
      warn: { bg: '#78350f', fg: '#fef3c7', border: '#f59e0b' },
      error: { bg: '#7f1d1d', fg: '#fecaca', border: '#ef4444' }
    };
    const tone = palette[type] || palette.info;
    let node = document.getElementById(PUSH_TEST_STATUS_ID);
    if (!node) {
      node = document.createElement('div');
      node.id = PUSH_TEST_STATUS_ID;
      node.style.position = 'fixed';
      node.style.left = '50%';
      node.style.bottom = '14px';
      node.style.transform = 'translateX(-50%)';
      node.style.maxWidth = 'min(92vw, 560px)';
      node.style.width = 'fit-content';
      node.style.padding = '10px 12px';
      node.style.borderRadius = '10px';
      node.style.fontSize = '13px';
      node.style.lineHeight = '1.35';
      node.style.fontWeight = '600';
      node.style.zIndex = '100002';
      node.style.boxShadow = '0 10px 24px rgba(0,0,0,0.3)';
      node.style.textAlign = 'center';
      node.style.pointerEvents = 'none';
      document.body.appendChild(node);
    }
    node.textContent = String(message);
    node.style.background = tone.bg;
    node.style.color = tone.fg;
    node.style.border = `1px solid ${tone.border}`;
    clearTimeout(node._hideTimer);
    node._hideTimer = setTimeout(() => {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    }, 5200);
  }

  async function requestPermissionAndSync(user) {
    markPermissionPrompted();
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      try {
        await syncUserToken(user, { prompt: false });
        showPushTestStatus('Notifications enabled. This device is now linked for alerts.', 'success');
      } catch (error) {
        showPushTestStatus('Permission allowed, but device registration failed. Retrying next milestone.', 'error');
        throw error;
      }
    } else if (permission === 'denied') {
      showPushTestStatus('Notifications blocked in browser settings. Re-enable site notifications to receive alerts.', 'warn');
    } else {
      showPushTestStatus('Notification request dismissed. You can enable on the next milestone.', 'info');
    }
    return permission;
  }

  function getPushPromptCopy(milestoneLabel) {
    return {
      english: {
        title: 'Stay in the loop',
        subtitle: `Nice - your first ${milestoneLabel} is done.`,
        regularBody: 'Turn on phone alerts so you do not miss important activity:',
        iosBody: 'On iPhone/iPad, alerts work after adding GISUGO to Home Screen:',
        bullets: [
          'Someone sends you an offer',
          'Your offer gets accepted',
          'A worker marks the gig completed',
          'Your posted gig gets new applications'
        ],
        iosBullets: [
          'Tap Share in Safari',
          'Tap Add to Home Screen',
          'Open GISUGO from the app icon',
          'Then tap Enable Notifications'
        ],
        later: 'Not now',
        enable: 'Enable Notifications',
        added: 'I Added It'
      },
      bisaya: {
        title: 'Ayaw palabi ka behind',
        subtitle: `Human na imong first ${milestoneLabel}.`,
        regularBody: 'I-on ang phone alerts para dili ka ma-miss ug importanteng update:',
        iosBody: 'Sa iPhone/iPad, mugana ang alerts kung naka Add to Home Screen na:',
        bullets: [
          'Naay mo-send ug offer nimo',
          'Na-accept ang imong offer',
          'Gi-mark completed ang gig',
          'Naay bag-ong applications sa imong gig'
        ],
        iosBullets: [
          'Tap Share sa Safari',
          'Tap Add to Home Screen',
          'Ablihi ang GISUGO gikan sa app icon',
          'Dayon tap Enable Notifications'
        ],
        later: 'Unya na',
        enable: 'Enable Notifications',
        added: 'Na-add na nako'
      },
      tagalog: {
        title: 'Huwag ma-late sa updates',
        subtitle: `Tapos na ang first ${milestoneLabel} mo.`,
        regularBody: 'I-on ang phone alerts para hindi mo ma-miss ang importanteng galaw:',
        iosBody: 'Sa iPhone/iPad, gagana ang alerts kapag naka Add to Home Screen:',
        bullets: [
          'May bagong offer para sa iyo',
          'Na-accept ang offer mo',
          'Na-mark na completed ang gig',
          'May bagong applications sa gig mo'
        ],
        iosBullets: [
          'Tap Share sa Safari',
          'Tap Add to Home Screen',
          'Buksan ang GISUGO gamit app icon',
          'Pagkatapos tap Enable Notifications'
        ],
        later: 'Mamaya na',
        enable: 'Enable Notifications',
        added: 'Na-add ko na'
      }
    };
  }

  function renderPromptModal({ mode, milestoneLabel }) {
    removePromptModal();
    const backdrop = document.createElement('div');
    backdrop.id = PUSH_MODAL_ID;
    backdrop.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div style="position:relative;width:min(460px,100%);background:#141414;color:#fff;border-radius:14px;padding:18px 16px;border:1px solid rgba(255,255,255,0.14);box-shadow:0 14px 50px rgba(0,0,0,0.45);">
          <div id="gisugo-push-modal-title" style="font-size:22px;font-weight:700;line-height:1.2;margin-bottom:6px;"></div>
          <div id="gisugo-push-modal-subtitle" style="font-size:14px;line-height:1.45;opacity:0.9;margin-bottom:12px;"></div>
          <div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
            <button data-lang="english" style="background:#2a2a2a;color:#fff;border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer;">English</button>
            <button data-lang="bisaya" style="background:#2a2a2a;color:#fff;border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer;">Bisaya</button>
            <button data-lang="tagalog" style="background:#2a2a2a;color:#fff;border:1px solid rgba(255,255,255,0.16);border-radius:999px;padding:5px 10px;font-size:12px;cursor:pointer;">Tagalog</button>
          </div>
          <div id="gisugo-push-modal-copy" style="font-size:14px;line-height:1.5;opacity:0.95;margin-bottom:14px;"></div>
          <div id="gisugo-push-modal-actions" style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;"></div>
          <div id="gisugo-push-loading-overlay" style="display:none;position:absolute;inset:0;background:rgba(10,10,10,0.6);align-items:center;justify-content:center;border-radius:14px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px;">
              <div style="width:42px;height:42px;border:4px solid rgba(255,255,255,0.25);border-top-color:#f59e0b;border-radius:50%;animation:gisugoPushSpin 0.85s linear infinite;"></div>
              <div style="font-size:13px;font-weight:700;letter-spacing:0.2px;color:#fff;">Setting up notifications...</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);

    const titleEl = backdrop.querySelector('#gisugo-push-modal-title');
    const subtitleEl = backdrop.querySelector('#gisugo-push-modal-subtitle');
    const copyEl = backdrop.querySelector('#gisugo-push-modal-copy');
    const actionsEl = backdrop.querySelector('#gisugo-push-modal-actions');
    if (!titleEl || !subtitleEl || !copyEl || !actionsEl) return backdrop;

    const langButtons = Array.from(backdrop.querySelectorAll('button[data-lang]'));
    const copyByLang = getPushPromptCopy(milestoneLabel);
    let activeLang = 'english';

    const applyLanguage = (lang) => {
      const key = copyByLang[lang] ? lang : 'english';
      activeLang = key;
      const t = copyByLang[key];
      titleEl.textContent = t.title;
      subtitleEl.textContent = t.subtitle;
      const intro = mode === 'ios_add_to_home' ? t.iosBody : t.regularBody;
      const bulletList = (mode === 'ios_add_to_home' ? t.iosBullets : t.bullets)
        .map((line) => `<li>${line}</li>`)
        .join('');
      copyEl.innerHTML = `<div style="margin-bottom:8px;">${intro}</div><ul style="margin:0;padding-left:18px;opacity:0.92;">${bulletList}</ul>`;
      actionsEl.innerHTML = mode === 'ios_add_to_home'
        ? `
          <button data-action="later" style="background:#2c2c2c;color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer;">${t.later}</button>
          <button data-action="added" style="background:#f59e0b;color:#111;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;">${t.added}</button>
        `
        : `
          <button data-action="later" style="background:#2c2c2c;color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer;">${t.later}</button>
          <button data-action="enable" style="background:#f59e0b;color:#111;border:0;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;">${t.enable}</button>
        `;
      langButtons.forEach((btn) => {
        const isActive = btn.getAttribute('data-lang') === key;
        btn.style.background = isActive ? '#f59e0b' : '#2a2a2a';
        btn.style.color = isActive ? '#111' : '#fff';
      });
    };

    langButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        applyLanguage(String(btn.getAttribute('data-lang') || 'english'));
      });
    });
    applyLanguage(activeLang);
    return backdrop;
  }

  async function ensureServiceWorker() {
    if (swRegistration) return swRegistration;
    swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { updateViaCache: 'none' });
    try {
      await swRegistration.update();
    } catch (_) {
      // Non-blocking: registration already succeeded.
    }
    return swRegistration;
  }

  function tokenDocId(token) {
    return encodeURIComponent(String(token || ''));
  }

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return [];
    return value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean);
  }

  function readUserPushPreference(userDocData = {}) {
    const settings = userDocData.notificationSettings || userDocData.notifications || {};
    const pushEnabled = !(
      settings.pushEnabled === false ||
      settings.pushNotifications === false ||
      settings.notificationsEnabled === false ||
      settings.allowPush === false
    );
    const criticalEnabled = !(
      settings.pushCriticalEnabled === false ||
      settings.criticalPushEnabled === false ||
      settings.allowCriticalPush === false
    );
    return {
      pushEnabled,
      criticalEnabled,
      disabledTypes: normalizeStringArray(settings.disabledPushTypes || settings.pushDisabledTypes),
      enabledTypes: normalizeStringArray(settings.enabledPushTypes || settings.pushEnabledTypes)
    };
  }

  async function getUserPushPreference(uid) {
    if (!uid) {
      return { pushEnabled: true, criticalEnabled: true, disabledTypes: [], enabledTypes: [] };
    }
    if (userPushPrefCache.has(uid)) {
      return userPushPrefCache.get(uid);
    }
    const db = typeof window.getFirestore === 'function' ? window.getFirestore() : null;
    if (!db) {
      const fallback = { pushEnabled: true, criticalEnabled: true, disabledTypes: [], enabledTypes: [] };
      userPushPrefCache.set(uid, fallback);
      return fallback;
    }
    try {
      const userSnap = await db.collection('users').doc(uid).get();
      const prefs = readUserPushPreference(userSnap.exists ? (userSnap.data() || {}) : {});
      userPushPrefCache.set(uid, prefs);
      return prefs;
    } catch (error) {
      console.warn('⚠️ Failed reading push preference, using defaults:', error);
      const fallback = { pushEnabled: true, criticalEnabled: true, disabledTypes: [], enabledTypes: [] };
      userPushPrefCache.set(uid, fallback);
      return fallback;
    }
  }

  async function upsertTokenForUser(uid, token) {
    const db = typeof window.getFirestore === 'function' ? window.getFirestore() : null;
    if (!db || !uid || !token) return false;
    const now = firebase.firestore.FieldValue.serverTimestamp();
    await db
      .collection('users')
      .doc(uid)
      .collection('notificationTokens')
      .doc(tokenDocId(token))
      .set({
        token,
        platform: 'web',
        revoked: false,
        lastSeenAt: now,
        updatedAt: now,
        createdAt: now
      }, { merge: true });
    return true;
  }

  async function revokeTokenForUser(uid, token) {
    const db = typeof window.getFirestore === 'function' ? window.getFirestore() : null;
    if (!db || !uid || !token) return false;
    await db
      .collection('users')
      .doc(uid)
      .collection('notificationTokens')
      .doc(tokenDocId(token))
      .set({
        revoked: true,
        revokedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    return true;
  }

  async function getMessagingToken() {
    if (!messagingInstance) return '';
    const options = {};
    if (swRegistration) options.serviceWorkerRegistration = swRegistration;
    if (typeof window.GISUGO_PUSH_VAPID_KEY === 'string' && window.GISUGO_PUSH_VAPID_KEY.trim()) {
      options.vapidKey = window.GISUGO_PUSH_VAPID_KEY.trim();
    }
    const token = await messagingInstance.getToken(options);
    return String(token || '');
  }

  async function ensurePermissionIfNeeded() {
    if (Notification.permission === 'granted') return true;
    if (!shouldPromptForPermission()) return false;
    markPermissionPrompted();
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async function syncUserToken(user, options = {}) {
    if (!user || !user.uid) return;
    const prefs = await getUserPushPreference(user.uid);
    if (!prefs.pushEnabled || !prefs.criticalEnabled) {
      console.log('🔕 Push disabled by account settings; skipping token sync');
      return;
    }
    const permissionReady = options.prompt === false ? (Notification.permission === 'granted') : await ensurePermissionIfNeeded();
    if (!permissionReady) {
      console.log('🔕 Push permission not granted; skipping token sync');
      return;
    }
    await ensureServiceWorker();
    const token = await getMessagingToken();
    if (!token) {
      console.warn('⚠️ FCM returned empty token');
      return;
    }
    await upsertTokenForUser(user.uid, token);
    setStoredPushToken(token);
    setStoredUid(user.uid);
    currentUid = user.uid;
    console.log('✅ Push token synced');
  }

  async function handleLogoutCleanup(previousUid) {
    let cachedUid = '';
    try {
      cachedUid = String(localStorage.getItem(PUSH_LAST_UID_STORAGE_KEY) || '');
    } catch (_) {
      cachedUid = '';
    }
    const fallbackUid = previousUid || currentUid || cachedUid;
    const storedToken = getStoredPushToken();
    if (!fallbackUid || !storedToken) return;
    try {
      await revokeTokenForUser(fallbackUid, storedToken);
      if (messagingInstance) {
        try {
          await messagingInstance.deleteToken(storedToken);
        } catch (_) {
          // Non-blocking if deleteToken is unavailable in this browser state.
        }
      }
      setStoredPushToken('');
      setStoredUid('');
      currentUid = '';
      console.log('✅ Push token revoked on logout');
    } catch (error) {
      console.warn('⚠️ Push token revoke failed on logout:', error);
    }
  }

  function attachForegroundHandler() {
    if (!messagingInstance) return;
    messagingInstance.onMessage(async (payload) => {
      try {
        // Foreground policy: do not create OS tray notifications while user
        // is actively using GISUGO. In-app alerts counters are updated instead.
        window.dispatchEvent(new CustomEvent('gisugo:push-foreground-message', { detail: payload || {} }));
      } catch (error) {
        console.warn('⚠️ Foreground push handling error:', error);
      }
    });
  }

  async function initializePushNotifications() {
    if (initialized) return true;
    if (!isSupportedEnvironment()) {
      console.log('ℹ️ Push notifications not supported in this environment');
      return false;
    }
    if (!canUsePushOnOrigin()) {
      console.log('ℹ️ Push notifications require HTTPS or localhost');
      return false;
    }
    try {
      messagingInstance = firebase.messaging();
      await ensureServiceWorker();
      attachForegroundHandler();
      const authFromWindow = typeof window.getFirebaseAuth === 'function' ? window.getFirebaseAuth() : null;
      const authFromFirebase = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
      const auth = authFromWindow || authFromFirebase;
      if (!auth || typeof auth.onAuthStateChanged !== 'function') {
        console.warn('⚠️ Push init skipped: auth not ready');
        return false;
      }

      authUnsubscribe = auth.onAuthStateChanged(async (user) => {
        try {
          if (user && user.uid) {
            currentUid = user.uid;
            setStoredUid(user.uid);
            // N-B: do not auto-request browser permission on page load.
            await syncUserToken(user, { prompt: false });
            return;
          }
          await handleLogoutCleanup(currentUid);
        } catch (error) {
          console.warn('⚠️ Push auth-state sync failed:', error);
        }
      });

      initialized = true;
      console.log('✅ Push notifications initialized');
      return true;
    } catch (error) {
      console.error('❌ Push initialization failed:', error);
      return false;
    }
  }

  async function shutdownPushNotifications() {
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    messagingInstance = null;
    swRegistration = null;
    initialized = false;
  }

  window.GisugoPushNotifications = {
    init: initializePushNotifications,
    shutdown: shutdownPushNotifications,
    syncCurrentUserToken: async () => {
      const authFromWindow = typeof window.getFirebaseAuth === 'function' ? window.getFirebaseAuth() : null;
      const authFromFirebase = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
      const auth = authFromWindow || authFromFirebase;
      const user = auth ? auth.currentUser : null;
      if (!user) return false;
      await syncUserToken(user);
      return true;
    },
    prepareForLogout: async (uid) => handleLogoutCleanup(uid),
    onEngagementMilestone: async (milestoneType = '') => {
      const authFromWindow = typeof window.getFirebaseAuth === 'function' ? window.getFirebaseAuth() : null;
      const authFromFirebase = (typeof firebase !== 'undefined' && typeof firebase.auth === 'function') ? firebase.auth() : null;
      const auth = authFromWindow || authFromFirebase;
      const user = auth ? auth.currentUser : null;
      if (!user || !user.uid) return { prompted: false, reason: 'no_user' };
      const milestone = String(milestoneType || '').toLowerCase().trim();
      if (milestone !== 'apply' && milestone !== 'post') {
        return { prompted: false, reason: 'unsupported_milestone' };
      }
      const prefs = await getUserPushPreference(user.uid);
      if (!prefs.pushEnabled || !prefs.criticalEnabled) {
        showPushTestStatus('Push is disabled in your account notification settings.', 'warn');
        return { prompted: false, reason: 'disabled_by_account_settings' };
      }
      const mode = getAdaptivePromptMode();
      if (mode === 'unsupported') {
        showPushTestStatus('Push is not supported in this browser context.', 'warn');
        return { prompted: false, reason: 'unsupported_environment' };
      }
      if (mode === 'already_granted') {
        try {
          await syncUserToken(user, { prompt: false });
          showPushTestStatus('Notifications are already enabled on this browser.', 'success');
          return { prompted: false, reason: 'already_granted' };
        } catch (error) {
          showPushTestStatus('Notifications allowed, but token sync failed. Retrying next milestone.', 'error');
          return { prompted: false, reason: 'already_granted_sync_failed', error: String(error) };
        }
      }
      if (mode === 'blocked') {
        showPushTestStatus('Notifications are blocked for this site. Please allow them in browser settings.', 'warn');
        return { prompted: false, reason: 'permission_blocked' };
      }

      const milestoneLabel = milestone === 'apply' ? 'application' : 'gig post';
      const modal = renderPromptModal({ mode, milestoneLabel });
      if (!modal) {
        return { prompted: false, reason: 'modal_render_failed' };
      }

      return await new Promise((resolve) => {
        const finish = (result) => {
          removePromptModal();
          resolve(result);
        };
        modal.addEventListener('click', async (event) => {
          let button = null;
          if (event && event.target && typeof event.target.closest === 'function') {
            button = event.target.closest('button[data-action]');
          }
          if (!button) return;
          const action = String(button.getAttribute('data-action') || '');
          if (action === 'later') {
            finish({ prompted: true, permission: 'dismissed' });
            return;
          }
          if (action === 'enable') {
            setPromptBusyState(modal, true, 'Enabling...');
            try {
              const permission = await requestPermissionAndSync(user);
              finish({ prompted: true, permission });
            } catch (error) {
              console.warn('⚠️ Push enable flow failed:', error);
              setPromptBusyState(modal, false);
              finish({
                prompted: true,
                permission: Notification.permission || 'default',
                tokenSyncFailed: true
              });
            }
            return;
          }
          if (action === 'added') {
            setPromptBusyState(modal, true, 'Checking...');
            if (isStandalonePwa() && Notification.permission === 'default') {
              try {
                const permission = await requestPermissionAndSync(user);
                finish({ prompted: true, permission });
              } catch (error) {
                console.warn('⚠️ iOS add-to-home enable flow failed:', error);
                setPromptBusyState(modal, false);
                finish({
                  prompted: true,
                  permission: Notification.permission || 'default',
                  tokenSyncFailed: true
                });
              }
              return;
            }
            finish({ prompted: true, permission: Notification.permission || 'default' });
          }
        });
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    void initializePushNotifications();
  });
})();
