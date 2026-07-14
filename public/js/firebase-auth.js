// ============================================================================
// 🔐 FIREBASE AUTHENTICATION MODULE - GISUGO
// ============================================================================
// 
// This module handles all user authentication operations:
// - Sign up with email/password
// - Login with email/password
// - Google Sign-in
// - Logout
// - Password reset
// - Auth state monitoring
//
// ============================================================================

// ============================================================================
// AUTH STATE MANAGEMENT
// ============================================================================

let currentUser = null;
let authStateListeners = [];

function getEmailVerificationActionSettings() {
  try {
    const origin = window && window.location ? window.location.origin : '';
    if (!origin) return undefined;
    return {
      url: `${origin}/login.html?emailVerified=1`
    };
  } catch (_) {
    return undefined;
  }
}

// Subscribe to auth state changes
function onAuthStateChange(callback) {
  authStateListeners.push(callback);
  
  // If Firebase is available, set up the listener
  const auth = getFirebaseAuth();
  if (auth) {
    auth.onAuthStateChanged((user) => {
      currentUser = user;
      authStateListeners.forEach(cb => cb(user));
    });
  }
  
  // Return unsubscribe function
  return () => {
    const index = authStateListeners.indexOf(callback);
    if (index > -1) {
      authStateListeners.splice(index, 1);
    }
  };
}

// Get current authenticated user
/**
 * Get currently authenticated user
 * @returns {Object|null} Current Firebase user or null
 * @warning This returns the CACHED auth state. If called immediately on page load,
 *          it may return null even if user is logged in (auth state not yet restored).
 *          For reliable auth checks, use onAuthStateChanged() instead.
 */
function getCurrentUser() {
  const auth = getFirebaseAuth();
  if (auth) {
    return auth.currentUser;
  }
  
  // Fallback to localStorage for offline mode
  // Note: This will fail if browser blocks storage (e.g., Edge Tracking Prevention)
  try {
    const storedUser = localStorage.getItem('gisugo_current_user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.warn('⚠️ localStorage blocked - cannot retrieve cached user');
    return null;
  }
}

// Get current user ID
function getCurrentUserId() {
  const user = getCurrentUser();
  if (user) {
    return user.uid || user.userId || user.id;
  }
  return null;
}

/**
 * Check if user is currently logged in
 * @returns {boolean} True if user is logged in
 * @warning This checks the CACHED auth state. For reliable auth checks on page load
 *          or in click handlers, use firebase.auth().onAuthStateChanged() instead.
 *          This is especially important when browser storage might be blocked.
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

// ============================================================================
// GOOGLE SIGN-IN
// ============================================================================

const OAUTH_PENDING_KEY = 'gisugo_oauth_pending';
const AUTH_DEBUG_LOG_KEY = 'gisugo_auth_debug_log';

function gisugoAuthLog(message, detail) {
  const entry = {
    t: Date.now(),
    msg: String(message || ''),
    detail: detail == null ? '' : (typeof detail === 'string' ? detail : JSON.stringify(detail))
  };
  try {
    const raw = sessionStorage.getItem(AUTH_DEBUG_LOG_KEY);
    const log = raw ? JSON.parse(raw) : [];
    log.push(entry);
    while (log.length > 50) log.shift();
    sessionStorage.setItem(AUTH_DEBUG_LOG_KEY, JSON.stringify(log));
  } catch (e) {}
  console.log('[GISUGO Auth]', entry.msg, entry.detail || '');
  try {
    window.dispatchEvent(new CustomEvent('gisugo-auth-log'));
  } catch (e) {}
}

function isMobileOAuthEnvironment() {
  try {
    const ua = navigator.userAgent || '';
    return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  } catch (e) {
    return false;
  }
}

async function startOAuthRedirect(auth, provider, providerLabel) {
  gisugoAuthLog(providerLabel + ': same-tab redirect');
  try {
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
    sessionStorage.setItem('gisugo_oauth_debug', '1');
  } catch (e) {}
  try {
    await auth.signInWithRedirect(provider);
    return { success: true, redirecting: true };
  } catch (error) {
    try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
    gisugoAuthLog(providerLabel + ': redirect start failed', {
      code: (error && error.code) || '',
      message: (error && error.message) || ''
    });
    return {
      success: false,
      message: 'Could not start sign-in. Please try again.'
    };
  }
}

function waitForAuthUser(auth, timeoutMs) {
  return new Promise(function(resolve) {
    if (!auth) return resolve(null);
    if (auth.currentUser) return resolve(auth.currentUser);
    let settled = false;
    const timer = setTimeout(function() {
      if (settled) return;
      settled = true;
      try { unsub(); } catch (e) {}
      resolve(auth.currentUser || null);
    }, timeoutMs);
    const unsub = auth.onAuthStateChanged(function(user) {
      if (!user || settled) return;
      settled = true;
      clearTimeout(timer);
      unsub();
      resolve(user);
    });
  });
}

function inferOAuthMethodFromUser(user) {
  const providerId = user && user.providerData && user.providerData[0] && user.providerData[0].providerId;
  if (providerId === 'facebook.com') return 'facebook.com';
  if (providerId === 'google.com') return 'google.com';
  return 'google.com';
}

function createGoogleAuthProvider() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  // Always show the account chooser so users aren't silently locked to one Google account.
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

function createFacebookAuthProvider() {
  const provider = new firebase.auth.FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');
  return provider;
}

/**
 * Try popup sign-in; if the browser blocks the popup, fall back to same-tab redirect.
 * @param {Object} auth - Firebase auth instance.
 * @param {Object} provider - Auth provider instance.
 * @param {string} method - Provider id for finalizeOAuthSignIn.
 * @param {string} providerLabel - 'Google' or 'Facebook' (for errors).
 * @returns {Promise<Object>}
 */
async function signInWithPopupOrRedirect(auth, provider, method, providerLabel) {
  // Mobile (Android Chrome + iOS): popups are unreliable — the tab opens then
  // closes without returning a credential (auth/popup-closed-by-user), so we go
  // straight to same-tab redirect, Firebase's recommended path for mobile.
  if (isMobileOAuthEnvironment()) {
    gisugoAuthLog(providerLabel + ': mobile -> same-tab redirect');
    return startOAuthRedirect(auth, provider, providerLabel);
  }

  // Desktop: popup first (inside the tap, so it isn't blocked); fall back to
  // same-tab redirect only if the browser actually blocks the popup.
  try {
    gisugoAuthLog(providerLabel + ': trying popup');
    const result = await auth.signInWithPopup(provider);
    gisugoAuthLog(providerLabel + ': popup success', { uid: result.user && result.user.uid });
    return await finalizeOAuthSignIn(result, method);
  } catch (error) {
    const code = (error && error.code) || '';
    gisugoAuthLog(providerLabel + ': popup error', { code: code, message: error && error.message });
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      return startOAuthRedirect(auth, provider, providerLabel);
    }
    return mapOAuthSignInError(error, providerLabel);
  }
}

/**
 * Sign in with Google
 * @returns {Promise<Object>} - Result object with success status and user/error
 */
async function loginWithGoogle() {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Google sign-in requires Firebase. Please configure Firebase first.'
    };
  }
  
  return signInWithPopupOrRedirect(auth, createGoogleAuthProvider(), 'google.com', 'Google');
}

// ============================================================================
// FACEBOOK SIGN-IN
// ============================================================================

/**
 * Sign in with Facebook
 * @returns {Promise<Object>} - Result object with success status and user/error
 */
async function loginWithFacebook() {
  const auth = getFirebaseAuth();
  
  if (!auth) {
    return {
      success: false,
      message: 'Facebook sign-in requires Firebase. Please configure Firebase first.'
    };
  }
  
  return signInWithPopupOrRedirect(auth, createFacebookAuthProvider(), 'facebook.com', 'Facebook');
}

// ============================================================================
// FACEBOOK SIGN-IN VIA FACEBOOK JS SDK (token -> signInWithCredential)
// ----------------------------------------------------------------------------
// Firebase's signInWithRedirect/signInWithPopup are broken specifically for
// Facebook on Android Chrome (known, unfixed: firebase-js-sdk #4256 / #9256 —
// "missing initial state"). This path gets the access token straight from
// Facebook's own SDK in-page and hands it to Firebase, so Firebase's OAuth
// handler + cross-tab sessionStorage (the thing that breaks) is never involved.
// ============================================================================

const FACEBOOK_APP_ID = '1027099963510428';
// Client token (public by design — pairs with the app id for device login).
const FACEBOOK_CLIENT_TOKEN = '2dbd136c5fec90f2c8ab4611558bf9b1';
const FACEBOOK_GRAPH_VERSION = 'v21.0';
let facebookSdkPromise = null;

/**
 * Load + init the Facebook JS SDK once. Resolves with window.FB when ready.
 * Call this on page load (preload) so FB.login() can run synchronously inside
 * the click gesture (otherwise the login popup is blocked).
 */
function loadFacebookSDK() {
  if (facebookSdkPromise) return facebookSdkPromise;
  facebookSdkPromise = new Promise(function(resolve, reject) {
    try {
      if (window.FB && window.FB.login) { resolve(window.FB); return; }
      window.fbAsyncInit = function() {
        try {
          window.FB.init({
            appId: FACEBOOK_APP_ID,
            cookie: true,
            xfbml: false,
            version: FACEBOOK_GRAPH_VERSION
          });
          gisugoAuthLog('Facebook: SDK initialized');
          resolve(window.FB);
        } catch (e) {
          reject(e);
        }
      };
      if (document.getElementById('facebook-jssdk')) return; // script already injecting
      const js = document.createElement('script');
      js.id = 'facebook-jssdk';
      js.async = true;
      js.defer = true;
      js.crossOrigin = 'anonymous';
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      js.onerror = function() { reject(new Error('Facebook SDK failed to load')); };
      document.head.appendChild(js);
    } catch (e) {
      reject(e);
    }
  });
  return facebookSdkPromise;
}

function preloadFacebookSDK() {
  try { loadFacebookSDK().catch(function() {}); } catch (e) {}
}

/**
 * Sign in with Facebook using the Facebook JS SDK access token, then exchange
 * it for a Firebase session via signInWithCredential. Must be called directly
 * from the click handler (FB.login opens a popup that needs the user gesture).
 * @returns {Promise<Object>} - { success, user, isNewUser } | { cancelled } | { success:false, message }
 */
function loginWithFacebookToken() {
  const auth = getFirebaseAuth();
  if (!auth) {
    return Promise.resolve({
      success: false,
      message: 'Facebook sign-in requires Firebase. Please configure Firebase first.'
    });
  }
  if (typeof window.FB === 'undefined' || !window.FB.login) {
    loadFacebookSDK(); // kick off load; keep the within-gesture rule by not awaiting
    gisugoAuthLog('Facebook: SDK not ready yet');
    return Promise.resolve({
      success: false,
      message: 'Facebook is still loading — tap the button again in a moment.'
    });
  }

  gisugoAuthLog('Facebook: FB.login (token flow)');
  return new Promise(function(resolve) {
    try {
      window.FB.login(function(response) {
        const accessToken = response && response.authResponse && response.authResponse.accessToken;
        if (!accessToken) {
          gisugoAuthLog('Facebook: login not completed', { status: response && response.status });
          resolve({ success: false, cancelled: true });
          return;
        }
        gisugoAuthLog('Facebook: got token -> signInWithCredential');
        const credential = firebase.auth.FacebookAuthProvider.credential(accessToken);
        auth.signInWithCredential(credential)
          .then(function(result) {
            gisugoAuthLog('Facebook: credential sign-in success', { uid: result.user && result.user.uid });
            resolve(finalizeOAuthSignIn(result, 'facebook.com'));
          })
          .catch(function(error) {
            gisugoAuthLog('Facebook: credential error', { code: (error && error.code) || '' });
            resolve(mapOAuthSignInError(error, 'Facebook'));
          });
      }, { scope: 'email,public_profile' });
    } catch (e) {
      gisugoAuthLog('Facebook: FB.login threw', { message: e && e.message });
      resolve({ success: false, message: 'Could not start Facebook sign-in. Please try again.' });
    }
  });
}

// ============================================================================
// FACEBOOK SIGN-IN VIA FULL-PAGE REDIRECT (FB OAuth -> token -> credential)
// ----------------------------------------------------------------------------
// The FB JS SDK login runs in a popup, which on Android Chrome can't surface the
// Facebook app for login-approval — the "Yes, that's me" confirmation gets stuck
// in a hidden notification and the popup dead-ends. A full-page redirect to
// Facebook's own OAuth dialog runs in a top-level tab, so the FB app can handle
// login inline (when its "Open supported links" is on), and returns the access
// token in the URL fragment. We exchange that via signInWithCredential, so
// Firebase's broken cross-tab redirect handler is never involved.
// ============================================================================

const FACEBOOK_OAUTH_STATE_KEY = 'gisugo_fb_oauth_state';

function generateOAuthState() {
  try {
    const arr = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.prototype.map.call(arr, function(b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
  } catch (e) {
    return 'st' + Date.now() + Math.random().toString(36).slice(2);
  }
}

function getFacebookRedirectUri() {
  return window.location.origin + window.location.pathname;
}

/**
 * Detect iPhone / iPad (incl. iOS Chrome/Firefox, which all run WebKit, and
 * iPadOS which reports as "MacIntel" with touch). Used to warn before Facebook
 * login, which frequently dead-ends on iOS (Facebook's passkey/"approve on
 * another device" flow is sandboxed away from Safari — see
 * docs/IOS_LEGACY_DEVICE_COMPATIBILITY_NOTE_2026-03-12.md).
 * @returns {boolean}
 */
function isLikelyIOS() {
  try {
    const ua = navigator.userAgent || '';
    if (/iPad|iPhone|iPod/.test(ua)) return true;
    // iPadOS 13+ masquerades as macOS Safari; distinguish by touch support.
    if (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1) return true;
  } catch (e) {}
  return false;
}

/**
 * Parse the iOS major version from the user agent (e.g. "iPhone OS 15_8" -> 15).
 * Returns null when unknown — including iPadOS 13+ masquerading as macOS, which
 * we treat as modern.
 * @returns {number|null}
 */
function getIOSMajorVersion() {
  try {
    const m = (navigator.userAgent || '').match(/(?:iPhone|iPad|iPod).+?OS (\d+)_/);
    if (m) return parseInt(m[1], 10);
  } catch (e) {}
  return null;
}

/**
 * Gate Facebook login on iOS.
 *
 * Verified on real devices (2026-07-14): on iOS 16+ the normal browser redirect
 * completes even on a cold Facebook session (iPhone 12 — Facebook's own
 * "With the Facebook App" handoff returns to Safari correctly), so modern iOS
 * proceeds straight through with NO modal, same as Android. On iOS 15 and older
 * (iPhone 7) the redirect dead-ends at Facebook's passkey wall, so those devices
 * get a modal steering them to the working paths instead:
 *   'login'  — leads with "Log in with the Facebook app" (device login escape
 *              hatch; works on every device), no browser attempt offered.
 *   'signup' — short steer to Google / Phone + Password.
 * Resolves with the user's choice:
 *   'facebook' — proceed with the normal Facebook redirect
 *   'device'   — use the Facebook-app device login (iOS escape hatch)
 *   false      — cancel (caller lets the user pick Google / Phone + Password)
 * Must be awaited from the FB button click handler BEFORE calling
 * startFacebookRedirect().
 * @param {string} context - 'login' | 'signup'
 * @returns {Promise<string|false>}
 */
function confirmFacebookOnIOS(context) {
  if (!isLikelyIOS()) return Promise.resolve('facebook');
  // iOS 16+ (or unknown version): the normal redirect works — no modal. The
  // redirect-failure rescue still auto-offers device login if it ever stalls.
  const iosVersion = getIOSMajorVersion();
  if (iosVersion === null || iosVersion >= 16) return Promise.resolve('facebook');
  const isLogin = context === 'login';
  return new Promise(function(resolve) {
    // Guard against stacking modals if tapped twice.
    if (document.getElementById('gisugoIOSFbWarn')) {
      resolve(false);
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'gisugoIOSFbWarn';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,23,0.72);';

    const card = document.createElement('div');
    card.style.cssText = 'max-width:360px;width:100%;box-sizing:border-box;background:#0f172a;border:1px solid rgba(130,148,177,0.35);border-radius:16px;padding:22px 20px;color:#f8fafc;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;font-family:inherit;';
    card.innerHTML =
      '<div style="font-size:2rem;line-height:1;margin-bottom:10px;">📱</div>' +
      '<div style="font-size:1.15rem;font-weight:800;margin-bottom:10px;">Using an iPhone or iPad?</div>' +
      (isLogin
        ? '<div style="font-size:0.95rem;line-height:1.5;color:#cbd5e1;margin-bottom:18px;">Facebook login gets stuck in this browser on your device. Use the <strong>Facebook app</strong> instead.</div>'
        : '<div style="font-size:0.95rem;line-height:1.5;color:#cbd5e1;margin-bottom:18px;">Facebook sign-up gets stuck on this device. <strong>Google</strong> or <strong>Phone &amp; Password</strong> is faster.</div>');

    function makeButton(text, primary) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = text;
      btn.style.cssText = primary
        ? 'width:100%;padding:13px 14px;border:none;border-radius:10px;background:#1877f2;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;margin-bottom:10px;'
        : 'width:100%;padding:12px 14px;border:1px solid rgba(130,148,177,0.35);border-radius:10px;background:transparent;color:#93c5fd;font-size:0.92rem;font-weight:700;cursor:pointer;margin-bottom:10px;';
      return btn;
    }

    function close(result) {
      try { overlay.remove(); } catch (e) {}
      resolve(result);
    }
    overlay.addEventListener('click', function(e) { if (e.target === overlay) close(false); });

    if (isLogin) {
      // No "try in browser" option: on the old-iOS devices that see this modal,
      // the browser redirect is a verified dead-end (passkey wall).
      const useDevice = makeButton('Log in with the Facebook app', true);
      const useOther = makeButton('Use another method', false);
      useDevice.addEventListener('click', function() { close('device'); });
      useOther.addEventListener('click', function() { close(false); });
      card.appendChild(useDevice);
      card.appendChild(useOther);
    } else {
      const useOther = makeButton("OK, I'll use another method", true);
      useOther.style.background = '#2563eb';
      const goFb = makeButton('Continue with Facebook anyway', false);
      useOther.addEventListener('click', function() { close(false); });
      goFb.addEventListener('click', function() { close('facebook'); });
      card.appendChild(useOther);
      card.appendChild(goFb);
    }

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}

/**
 * Start Facebook sign-in as a full-page redirect. Must be called directly from
 * the click handler. Navigates away, so it resolves with { redirecting: true }.
 * @returns {Promise<Object>}
 */
function startFacebookRedirect() {
  const state = generateOAuthState();
  try {
    // localStorage survives even if the FB app returns into a fresh tab;
    // sessionStorage is the belt-and-suspenders copy for the same-tab case.
    localStorage.setItem(FACEBOOK_OAUTH_STATE_KEY, state);
    sessionStorage.setItem(FACEBOOK_OAUTH_STATE_KEY, state);
    sessionStorage.setItem(OAUTH_PENDING_KEY, '1');
    sessionStorage.setItem('gisugo_oauth_debug', '1');
  } catch (e) {}
  const params = new URLSearchParams({
    client_id: FACEBOOK_APP_ID,
    redirect_uri: getFacebookRedirectUri(),
    state: state,
    response_type: 'token',
    scope: 'email,public_profile'
  });
  const url = 'https://www.facebook.com/' + FACEBOOK_GRAPH_VERSION + '/dialog/oauth?' + params.toString();
  gisugoAuthLog('Facebook: full-page redirect', { redirect_uri: getFacebookRedirectUri() });
  try {
    window.location.href = url;
  } catch (e) {
    return Promise.resolve({ success: false, message: 'Could not start Facebook sign-in. Please try again.' });
  }
  return Promise.resolve({ redirecting: true });
}

/**
 * Read the Facebook OAuth result from the URL fragment after returning from the
 * redirect. Returns { accessToken, state, error } or null if nothing to handle.
 */
function parseFacebookRedirectFragment() {
  let hash = '';
  try { hash = window.location.hash || ''; } catch (e) {}
  if (!hash) return null;
  if (hash.indexOf('access_token=') === -1 && hash.indexOf('error') === -1) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return {
    accessToken: params.get('access_token'),
    state: params.get('state'),
    error: params.get('error') || params.get('error_code') || '',
    errorReason: params.get('error_reason') || params.get('error_message') || ''
  };
}

/**
 * Complete Facebook sign-in from a full-page redirect return: verify state and
 * exchange the token via signInWithCredential.
 * @returns {Promise<Object>} normalized result with { handled: true }, or
 *   { handled: false } when there's no Facebook redirect to process.
 */
async function completeFacebookRedirectSignIn() {
  const parsed = parseFacebookRedirectFragment();
  if (!parsed) return { handled: false };

  // Strip the token/fragment from the URL immediately so it never lingers in
  // history or gets re-processed on refresh.
  try {
    history.replaceState(null, '', window.location.origin + window.location.pathname + window.location.search);
  } catch (e) {}

  let expected = null;
  try {
    expected = localStorage.getItem(FACEBOOK_OAUTH_STATE_KEY) || sessionStorage.getItem(FACEBOOK_OAUTH_STATE_KEY);
  } catch (e) {}
  try {
    localStorage.removeItem(FACEBOOK_OAUTH_STATE_KEY);
    sessionStorage.removeItem(FACEBOOK_OAUTH_STATE_KEY);
  } catch (e) {}

  if (parsed.error || !parsed.accessToken) {
    try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
    gisugoAuthLog('Facebook: redirect returned no token', { error: parsed.error, reason: parsed.errorReason });
    const denied = (parsed.error + ' ' + parsed.errorReason).toLowerCase().indexOf('denied') !== -1;
    if (denied) return { handled: true, success: false, cancelled: true };
    // On iOS the redirect usually dies at Facebook's passkey wall — offer the
    // Facebook-app device login as the rescue path.
    return {
      handled: true,
      success: false,
      offerDeviceLogin: isLikelyIOS(),
      message: 'Facebook sign-in didn\'t complete. Please try again.'
    };
  }

  // CSRF check — only enforced when we still have the stored state to compare.
  // If storage was lost across an app hand-off we proceed anyway: the token is
  // validated with Facebook by signInWithCredential, so risk is minimal and
  // blocking here would defeat the reliability this whole flow exists for.
  if (expected && parsed.state && expected !== parsed.state) {
    try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
    gisugoAuthLog('Facebook: state mismatch');
    return { handled: true, success: false, message: 'Facebook sign-in could not be verified. Please try again.' };
  }

  const auth = getFirebaseAuth();
  if (!auth) return { handled: true, success: false, message: 'Firebase not ready. Please try again.' };

  try {
    gisugoAuthLog('Facebook: redirect token -> signInWithCredential');
    const credential = firebase.auth.FacebookAuthProvider.credential(parsed.accessToken);
    const result = await auth.signInWithCredential(credential);
    try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
    gisugoAuthLog('Facebook: credential sign-in success (redirect)', { uid: result.user && result.user.uid });
    const finalized = await finalizeOAuthSignIn(result, 'facebook.com');
    finalized.handled = true;
    return finalized;
  } catch (error) {
    try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
    gisugoAuthLog('Facebook: credential error (redirect)', { code: (error && error.code) || '' });
    const mapped = mapOAuthSignInError(error, 'Facebook');
    mapped.handled = true;
    return mapped;
  }
}

// ============================================================================
// FACEBOOK DEVICE LOGIN (facebook.com/device) — iOS escape hatch
// ----------------------------------------------------------------------------
// On a cold Safari session, iOS can't finish ANY browser-based Facebook OAuth:
// Facebook's passkey/"approve on another device" step is sandboxed away from
// Safari, so the handshake never returns. Device login sidesteps the handshake
// entirely — we fetch a short code from the Graph API, the user confirms it
// inside the Facebook APP (where they're already logged in), and we POLL
// Facebook for the access token. Nothing has to come back through Safari.
// Verified end-to-end on iPhone 7 / iOS 15 (2026-07-14). Note: the in-app
// "login requests" screen ignores the ?user_code= prefill, so the user must
// paste/type the code — hence the copy-code button.
// ============================================================================

const FACEBOOK_DEVICE_STATE_KEY = 'gisugo_fb_device_login';

function fbDeviceGraphPost(path, params) {
  const body = new URLSearchParams(params).toString();
  return fetch('https://graph.facebook.com/' + FACEBOOK_GRAPH_VERSION + '/' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body
  }).then(function(res) { return res.json(); });
}

function loadFacebookDeviceState() {
  try {
    const raw = localStorage.getItem(FACEBOOK_DEVICE_STATE_KEY);
    const state = raw ? JSON.parse(raw) : null;
    if (state && state.code && Date.now() < state.expiresAt) return state;
  } catch (e) {}
  return null;
}

function clearFacebookDeviceState() {
  try { localStorage.removeItem(FACEBOOK_DEVICE_STATE_KEY); } catch (e) {}
}

/**
 * Exchange a Facebook access token (from device login) for a Firebase session.
 * Same finalize path as the redirect flow, so routing behaves identically.
 */
async function signInWithFacebookAccessToken(accessToken) {
  const auth = getFirebaseAuth();
  if (!auth) return { success: false, message: 'Firebase not ready. Please try again.' };
  try {
    gisugoAuthLog('FB device: token -> signInWithCredential');
    const credential = firebase.auth.FacebookAuthProvider.credential(accessToken);
    const result = await auth.signInWithCredential(credential);
    gisugoAuthLog('FB device: credential sign-in success', { uid: result.user && result.user.uid });
    return await finalizeOAuthSignIn(result, 'facebook.com');
  } catch (error) {
    gisugoAuthLog('FB device: credential error', { code: (error && error.code) || '' });
    return mapOAuthSignInError(error, 'Facebook');
  }
}

/**
 * Show the device-login overlay and run the poll loop until sign-in completes,
 * the user cancels, or the code expires. Resolves with the same result shape as
 * loginWithFacebook: { success, user, ... } | { cancelled: true } |
 * { success: false, message }.
 * @param {Object|null} existingState - resume a pending device login, or null
 *   to request a fresh code.
 */
function runFacebookDeviceLogin(existingState) {
  return new Promise(function(resolve) {
    if (document.getElementById('gisugoFbDeviceOverlay')) {
      resolve({ cancelled: true });
      return;
    }

    let state = existingState || null;
    let pollTimer = null;
    let finished = false;

    const overlay = document.createElement('div');
    overlay.id = 'gisugoFbDeviceOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(2,6,23,0.78);';

    const card = document.createElement('div');
    card.style.cssText = 'max-width:380px;width:100%;box-sizing:border-box;background:#0f172a;border:1px solid rgba(130,148,177,0.35);border-radius:16px;padding:22px 20px;color:#f8fafc;box-shadow:0 20px 60px rgba(0,0,0,0.5);text-align:center;font-family:inherit;';
    card.innerHTML =
      '<div style="font-size:1.15rem;font-weight:800;margin-bottom:10px;">Log in with the Facebook app</div>' +
      '<div style="font-size:0.92rem;line-height:1.55;color:#cbd5e1;text-align:left;margin-bottom:14px;">' +
      '1. Tap the button below — it copies your code and opens Facebook.<br>' +
      '2. If asked, choose <strong>With the Facebook App</strong> (not "With this Browser").<br>' +
      '3. Paste or type the code, approve, then come back to this tab.</div>' +
      '<div id="gisugoFbDeviceCode" style="font-size:1.7rem;letter-spacing:0.25rem;font-weight:800;color:#fbbf24;margin-bottom:6px;min-height:2rem;">&hellip;</div>' +
      '<div id="gisugoFbDeviceCopied" style="font-size:0.8rem;color:#34d399;min-height:1.1rem;margin-bottom:8px;"></div>';

    const openBtn = document.createElement('a');
    openBtn.id = 'gisugoFbDeviceOpen';
    openBtn.target = '_blank';
    openBtn.rel = 'noopener';
    openBtn.textContent = 'Copy code & open Facebook';
    openBtn.style.cssText = 'display:block;width:100%;box-sizing:border-box;padding:13px 14px;border:none;border-radius:10px;background:#1877f2;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;text-decoration:none;margin-bottom:10px;opacity:0.5;pointer-events:none;';

    const statusEl = document.createElement('div');
    statusEl.style.cssText = 'font-size:0.88rem;color:#93c5fd;margin-bottom:12px;min-height:1.2rem;';
    statusEl.textContent = 'Getting your code from Facebook\u2026';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = 'width:100%;padding:11px 14px;border:1px solid rgba(130,148,177,0.35);border-radius:10px;background:transparent;color:#cbd5e1;font-size:0.92rem;font-weight:700;cursor:pointer;';

    card.appendChild(openBtn);
    card.appendChild(statusEl);
    card.appendChild(cancelBtn);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const codeEl = card.querySelector('#gisugoFbDeviceCode');
    const copiedEl = card.querySelector('#gisugoFbDeviceCopied');

    function finish(result) {
      if (finished) return;
      finished = true;
      if (pollTimer) clearTimeout(pollTimer);
      document.removeEventListener('visibilitychange', onVisible);
      try { overlay.remove(); } catch (e) {}
      resolve(result);
    }

    function onVisible() {
      // iOS throttles background-tab timers; poll the moment the user returns.
      if (document.visibilityState === 'visible' && state && !finished) pollOnce();
    }
    document.addEventListener('visibilitychange', onVisible);

    cancelBtn.addEventListener('click', function() {
      clearFacebookDeviceState();
      gisugoAuthLog('FB device: cancelled by user');
      finish({ cancelled: true });
    });

    openBtn.addEventListener('click', function() {
      // Copy inside the tap gesture (fire-and-forget) while the anchor's
      // default navigation opens Facebook.
      if (!state) return;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(state.userCode).then(function() {
            copiedEl.textContent = 'Code copied \u2014 paste it in the Facebook app';
          }).catch(function() {});
        }
      } catch (e) {}
      statusEl.textContent = 'Waiting for you to approve in the Facebook app\u2026';
    });

    function activate(freshState) {
      state = freshState;
      codeEl.textContent = state.userCode;
      openBtn.href = 'https://www.facebook.com/device?user_code=' + encodeURIComponent(state.userCode);
      openBtn.style.opacity = '1';
      openBtn.style.pointerEvents = 'auto';
      statusEl.textContent = 'Waiting for approval\u2026 this page finishes by itself.';
      schedulePoll(state.intervalMs);
    }

    function requestCode() {
      statusEl.textContent = 'Getting your code from Facebook\u2026';
      fbDeviceGraphPost('device/login', {
        access_token: FACEBOOK_APP_ID + '|' + FACEBOOK_CLIENT_TOKEN,
        scope: 'public_profile'
      }).then(function(data) {
        if (finished) return;
        if (!data || data.error || !data.code) {
          gisugoAuthLog('FB device: code request failed', { error: data && data.error && data.error.message });
          finish({ success: false, message: 'Could not start Facebook app login. Please try again.' });
          return;
        }
        const fresh = {
          code: data.code,
          userCode: data.user_code,
          expiresAt: Date.now() + (data.expires_in * 1000),
          intervalMs: Math.max(5000, (data.interval || 5) * 1000)
        };
        try { localStorage.setItem(FACEBOOK_DEVICE_STATE_KEY, JSON.stringify(fresh)); } catch (e) {}
        gisugoAuthLog('FB device: code issued', { userCode: fresh.userCode });
        activate(fresh);
      }).catch(function(err) {
        if (finished) return;
        gisugoAuthLog('FB device: code request network error', { message: err && err.message });
        finish({ success: false, message: 'Could not reach Facebook. Check your connection and try again.' });
      });
    }

    function schedulePoll(delayMs) {
      if (pollTimer) clearTimeout(pollTimer);
      pollTimer = setTimeout(pollOnce, delayMs);
    }

    function pollOnce() {
      if (finished || !state) return;
      if (Date.now() > state.expiresAt) {
        gisugoAuthLog('FB device: code expired, requesting a new one');
        clearFacebookDeviceState();
        state = null;
        openBtn.style.opacity = '0.5';
        openBtn.style.pointerEvents = 'none';
        copiedEl.textContent = '';
        requestCode();
        return;
      }
      fbDeviceGraphPost('device/login_status', {
        access_token: FACEBOOK_APP_ID + '|' + FACEBOOK_CLIENT_TOKEN,
        code: state.code
      }).then(function(data) {
        if (finished) return;
        if (data && data.access_token) {
          gisugoAuthLog('FB device: access token received');
          clearFacebookDeviceState();
          statusEl.textContent = 'Approved! Signing you in\u2026';
          signInWithFacebookAccessToken(data.access_token).then(finish);
          return;
        }
        const sub = data && data.error && data.error.error_subcode;
        if (sub === 1349174) { schedulePoll(state.intervalMs); return; } // pending
        if (sub === 1349172) { schedulePoll(state.intervalMs * 2); return; } // slow down
        gisugoAuthLog('FB device: poll failed', { error: data && data.error && data.error.message, subcode: sub });
        clearFacebookDeviceState();
        finish({ success: false, message: 'Facebook app login didn\'t complete. Please try again.' });
      }).catch(function() {
        if (!finished) schedulePoll(state.intervalMs); // transient network blip — keep polling
      });
    }

    if (state) {
      gisugoAuthLog('FB device: resuming pending login', { userCode: state.userCode });
      activate(state);
      pollOnce();
    } else {
      requestCode();
    }
  });
}

/**
 * Start Facebook device login (fresh code). Entry point for the iOS escape
 * hatch. Resolves like loginWithFacebook.
 * @returns {Promise<Object>}
 */
function loginWithFacebookDevice() {
  return runFacebookDeviceLogin(loadFacebookDeviceState());
}

/**
 * If a device login was in progress and this page (re)loaded before it
 * finished (e.g. the user returned via a fresh tab), reopen the overlay and
 * resume polling. On success, routes the user like any completed sign-in.
 * Call once on load for login.html and sign-up.html. Never throws.
 */
function resumeFacebookDeviceLoginIfPending() {
  const state = loadFacebookDeviceState();
  if (!state) return;
  runFacebookDeviceLogin(state).then(function(result) {
    if (result && result.success && result.user && typeof handleAuthRedirect === 'function') {
      handleAuthRedirect(result.user);
    }
  }).catch(function() {});
}

/**
 * Complete a same-tab OAuth sign-in after the browser returns from the provider.
 * Call once on load for login.html and sign-up.html.
 * @returns {Promise<Object>}
 */
async function completeRedirectSignIn() {
  const auth = getFirebaseAuth();
  if (!auth) return { pending: true };

  // Facebook comes back as a token in the URL fragment (our own redirect flow),
  // handled before Firebase's getRedirectResult (which is for Google).
  const fb = await completeFacebookRedirectSignIn();
  if (fb && fb.handled) {
    delete fb.handled;
    return fb;
  }

  let wasPending = false;
  try { wasPending = sessionStorage.getItem(OAUTH_PENDING_KEY) === '1'; } catch (e) {}
  gisugoAuthLog('completeRedirectSignIn', { wasPending: wasPending, path: location.pathname });

  let result;
  try {
    // getRedirectResult() can HANG on old iOS Safari (storage partitioning),
    // which would block the caller forever — freezing the loading overlay and
    // (on login.html) preventing the sign-in buttons from ever being wired.
    // Race it with a timeout so this function always returns.
    const REDIRECT_RESULT_TIMEOUT_MS = 8000;
    result = await Promise.race([
      auth.getRedirectResult(),
      new Promise(function(resolve) {
        setTimeout(function() { resolve({ __timedOut: true }); }, REDIRECT_RESULT_TIMEOUT_MS);
      })
    ]);
    if (result && result.__timedOut) {
      gisugoAuthLog('getRedirectResult timed out');
      result = null; // fall through to the currentUser fallback / clean exit below
    }
  } catch (error) {
    try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
    const code = (error && error.code) || '';
    gisugoAuthLog('redirect error', { code: code, message: error && error.message });
    let message = 'Sign-in failed. Please try again.';
    if (code === 'auth/account-exists-with-different-credential') {
      message = 'An account already exists with the same email. Try a different sign-in method.';
    } else if (code === 'auth/operation-not-allowed') {
      message = 'That sign-in method isn\'t available yet — please use Google for now.';
    } else if (code === 'auth/invalid-session-id') {
      message = 'Sign-in session expired. Please try again.';
    }
    return { success: false, error: error, message: message };
  }

  if (!result || !result.user) {
    if (wasPending) {
      const fallbackUser = await waitForAuthUser(auth, 5000);
      if (fallbackUser) {
        const method = inferOAuthMethodFromUser(fallbackUser);
        gisugoAuthLog('redirect: using currentUser fallback', { uid: fallbackUser.uid, method: method });
        try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
        return await finalizeOAuthSignIn(
          { user: fallbackUser, additionalUserInfo: { isNewUser: false } },
          method
        );
      }
      try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
      gisugoAuthLog('redirect incomplete (no user)');
      return { success: false, message: 'Sign-in did not complete. Please try again.' };
    }
    gisugoAuthLog('no pending redirect');
    return { pending: true };
  }

  try { sessionStorage.removeItem(OAUTH_PENDING_KEY); } catch (e) {}
  gisugoAuthLog('redirect success', { uid: result.user.uid });
  const providerId = (result.additionalUserInfo && result.additionalUserInfo.providerId) ||
    (result.credential && result.credential.providerId) || '';
  const method = providerId === 'facebook.com' ? 'facebook.com' : 'google.com';
  return await finalizeOAuthSignIn(result, method);
}

// ============================================================================
// EMAIL / PASSWORD SIGN-IN (TEMPORARY)
// ----------------------------------------------------------------------------
// Re-added as a dev/testing login that works in embedded browsers (Cursor) and
// anywhere popups/redirects fail. Intended to be removed before public launch.
// ============================================================================

/**
 * Sign in with email + password. Requires the account to have an email/password
 * credential (set via signup or account linking).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} - { success, user, isNewUser } or { success:false, message }
 */
async function loginWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, message: 'Email sign-in requires Firebase. Please configure Firebase first.' };
  }
  try {
    console.log('🔐 Starting email/password sign-in...');
    const result = await auth.signInWithEmailAndPassword(email, password);
    return await finalizeOAuthSignIn(result, 'password');
  } catch (error) {
    const code = (error && error.code) || '';
    console.error('❌ Email sign-in error:', code || error);
    let message = 'Email sign-in failed. Please try again.';
    if (code === 'auth/invalid-email') {
      message = 'That email address looks invalid.';
    } else if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      message = 'Incorrect email or password.';
    } else if (code === 'auth/user-disabled') {
      message = 'This account has been disabled.';
    } else if (code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please wait a moment and try again.';
    }
    return { success: false, error: error, message: message };
  }
}

// ============================================================================
// PHONE + PASSWORD SIGN-IN / SIGN-UP (OAuth-independent fallback)
// ----------------------------------------------------------------------------
// Firebase has no native "phone + password" provider, so we map a normalized
// phone number to a hidden synthetic email and drive Firebase's email/password
// engine underneath. The real phone is stored on the profile (owner-only
// user_private) as the contact field; the synthetic email is never shown to the
// user and never receives mail. This works on EVERY device/browser (incl. the
// iPhone 7), so no one is ever blocked by a Facebook/Google/OS quirk.
//
// Uniqueness (1 phone : 1 account) is enforced for free: the synthetic email is
// deterministic from the phone, so a second signup for the same number fails
// with auth/email-already-in-use.
//
// IMPORTANT: normalization MUST be identical at signup + login or a user gets
// locked out. Both paths go through normalizePhoneNumber() — do not inline.
// ============================================================================

// Never a real, deliverable domain — these mailboxes are synthetic identifiers.
const PHONE_SYNTHETIC_EMAIL_DOMAIN = 'phone.gisugo.app';

/**
 * Normalize a phone number to canonical E.164 ("+63XXXXXXXXXX" for PH).
 * The SAME output must be produced at signup and login. Returns null if the
 * number is not plausibly valid for the given country.
 * @param {string} phone - Raw digits the user typed (may include 0/63/+63/spaces).
 * @param {string} [countryCode='+63'] - Selected country dial code, e.g. '+63'.
 * @returns {string|null} canonical '+<cc><national>' or null when invalid.
 */
function normalizePhoneNumber(phone, countryCode) {
  let digits = String(phone == null ? '' : phone).replace(/\D/g, '');
  const ccDigits = String(countryCode || '+63').replace(/\D/g, '') || '63';
  if (!digits) return null;

  if (ccDigits === '63') {
    // Philippines mobile: 10 national digits starting with 9.
    if (digits.length === 12 && digits.startsWith('63')) digits = digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    if (digits.length !== 10 || !digits.startsWith('9')) return null;
    return '+63' + digits;
  }

  // Other countries: strip a leading country code or trunk 0, then sanity-check length.
  if (digits.startsWith(ccDigits)) digits = digits.slice(ccDigits.length);
  digits = digits.replace(/^0+/, '');
  if (digits.length < 5 || digits.length > 15) return null;
  return '+' + ccDigits + digits;
}

/**
 * Map a canonical E.164 phone to its hidden synthetic login email.
 * @param {string} e164Phone - Output of normalizePhoneNumber (e.g. '+639171234567').
 * @returns {string|null} e.g. '639171234567@phone.gisugo.app'
 */
function phoneToSyntheticEmail(e164Phone) {
  const digits = String(e164Phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return digits + '@' + PHONE_SYNTHETIC_EMAIL_DOMAIN;
}

/**
 * Create a phone + password account (OAuth-independent). Enforces 1 phone : 1
 * account via the deterministic synthetic email. Does NOT write the Firestore
 * profile — the signup form does that next (savePrivatePhone + createUserProfile).
 * @param {string} phone
 * @param {string} password
 * @param {string} [countryCode='+63']
 * @returns {Promise<Object>} { success, user, phone } or { success:false, code, message }
 */
async function signUpWithPhonePassword(phone, password, countryCode) {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, message: 'Sign-up requires Firebase. Please try again in a moment.' };
  }
  const normalized = normalizePhoneNumber(phone, countryCode);
  if (!normalized) {
    return { success: false, code: 'invalid-phone', message: 'Please enter a valid phone number.' };
  }
  if (!password || String(password).length < 6) {
    return { success: false, code: 'weak-password', message: 'Password must be at least 6 characters.' };
  }
  const syntheticEmail = phoneToSyntheticEmail(normalized);
  try {
    gisugoAuthLog('phone signup: creating account', { phone: normalized });
    const result = await auth.createUserWithEmailAndPassword(syntheticEmail, password);
    // Brand-new phone+password account: no profile doc yet.
    try { sessionStorage.setItem('gisugo_profile_exists', '0'); } catch (e) {}
    try { sessionStorage.setItem('gisugo_last_signin_method', 'password'); } catch (e) {}
    return { success: true, user: result.user, phone: normalized };
  } catch (error) {
    const code = (error && error.code) || '';
    console.error('❌ Phone sign-up error:', code || error);
    let message = 'Could not create your account. Please try again.';
    if (code === 'auth/email-already-in-use') {
      message = 'This phone number is already registered. Try signing in instead.';
    } else if (code === 'auth/weak-password') {
      message = 'Password must be at least 6 characters.';
    } else if (code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please wait a moment and try again.';
    }
    return { success: false, code: code || 'unknown', error: error, message: message };
  }
}

/**
 * Sign in with phone + password. Mirrors signUpWithPhonePassword normalization.
 * @param {string} phone
 * @param {string} password
 * @param {string} [countryCode='+63']
 * @returns {Promise<Object>} { success, user, isNewUser } or { success:false, message }
 */
async function loginWithPhonePassword(phone, password, countryCode) {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { success: false, message: 'Sign-in requires Firebase. Please try again in a moment.' };
  }
  const normalized = normalizePhoneNumber(phone, countryCode);
  if (!normalized) {
    return { success: false, code: 'invalid-phone', message: 'Please enter a valid phone number.' };
  }
  if (!password) {
    return { success: false, code: 'missing-password', message: 'Please enter your password.' };
  }
  const syntheticEmail = phoneToSyntheticEmail(normalized);
  try {
    gisugoAuthLog('phone login: signing in', { phone: normalized });
    const result = await auth.signInWithEmailAndPassword(syntheticEmail, password);
    return await finalizeOAuthSignIn(result, 'password');
  } catch (error) {
    const code = (error && error.code) || '';
    console.error('❌ Phone sign-in error:', code || error);
    let message = 'Sign-in failed. Please try again.';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
      message = 'Incorrect phone number or password.';
    } else if (code === 'auth/user-disabled') {
      message = 'This account has been disabled.';
    } else if (code === 'auth/too-many-requests') {
      message = 'Too many attempts. Please wait a moment and try again.';
    }
    return { success: false, code: code || 'unknown', error: error, message: message };
  }
}

// ============================================================================
// OAUTH SIGN-IN HELPERS (shared by the Google + Facebook popup flows)
// ============================================================================

/**
 * Finalize a successful popup sign-in: refresh lastLogin (best-effort) and
 * return a normalized result for callers to route on.
 * @param {Object} result - The UserCredential from signInWithPopup.
 * @param {string} [method] - The provider actually used this session
 *   ('google.com' | 'facebook.com' | 'password'). Stored so the completion
 *   page can show the real sign-in method rather than the account's first
 *   linked provider.
 * @returns {Promise<Object>} - { success, user, isNewUser }
 */
async function finalizeOAuthSignIn(result, method) {
  const user = result && result.user;
  if (!user) {
    return { success: false, message: 'Sign-in failed. Please try again.' };
  }
  console.log('✅ OAuth sign-in complete:', user.uid);

  if (method) {
    try { sessionStorage.setItem('gisugo_last_signin_method', method); } catch (e) {}
  }

  // Probe profile existence via the lastLogin write itself. update() (not set())
  // succeeds ONLY if the profile doc already exists; 'not-found' means a brand-new
  // user. This is our most reliable existence signal for routing: the write path
  // is server-acked and works on fresh sessions even when a source:'server' READ
  // flakily returns empty — which was misrouting real users (with a real profile)
  // to sign-up. We stash the verdict for handleAuthRedirect(). Raced with a
  // timeout so a slow/offline network never hangs the sign-in.
  let profileExists = null; // null = unknown/inconclusive
  const db = getFirestore();
  if (db) {
    try {
      await Promise.race([
        db.collection('users').doc(user.uid).update({
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
          profileExists = true;
        }).catch(function(dbError) {
          const code = (dbError && dbError.code) || '';
          if (code === 'not-found') profileExists = false;
          else console.warn('⚠️ lastLogin probe inconclusive:', code || dbError);
        }),
        new Promise(function(resolve) { setTimeout(resolve, 4000); })
      ]);
    } catch (e) {}
  }
  try {
    sessionStorage.setItem('gisugo_profile_exists', profileExists === null ? '' : (profileExists ? '1' : '0'));
  } catch (e) {}
  gisugoAuthLog('finalizeOAuthSignIn: existence probe', { profileExists: profileExists });

  const info = result.additionalUserInfo || {};
  return { success: true, user: user, isNewUser: info.isNewUser || false, profileExists: profileExists };
}

/**
 * Normalize an OAuth popup error. A user closing/double-triggering the popup is
 * reported as { cancelled: true } (a silent no-op), not a real failure.
 * @param {Object} error - The thrown Firebase auth error.
 * @param {string} providerLabel - 'Google' or 'Facebook' (for messaging).
 * @returns {Object} - { success: false, cancelled?, error?, message? }
 */
function mapOAuthSignInError(error, providerLabel) {
  const code = (error && error.code) || '';
  console.error(`❌ ${providerLabel} sign-in error:`, code || error);
  
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return { success: false, cancelled: true };
  }
  
  let message = `Could not complete ${providerLabel} sign-in. Please try again.`;
  if (code === 'auth/popup-blocked') {
    message = 'Your browser blocked the sign-in popup. Please allow popups for this site and try again.';
  } else if (code === 'auth/account-exists-with-different-credential') {
    message = 'An account already exists with the same email. Try a different sign-in method.';
  } else if (code === 'auth/operation-not-allowed') {
    message = `${providerLabel} sign-in isn't available yet — please use Google for now.`;
  } else if (code === 'auth/unauthorized-domain') {
    message = 'This domain isn\'t authorized for sign-in. Please use the live site or add it to Firebase authorized domains.';
  }
  return { success: false, error: error, message: message };
}

// ============================================================================
// LOGOUT
// ============================================================================

/**
 * Sign out the current user
 * @returns {Promise<Object>} - Result object with success status
 */
async function logout() {
  const auth = getFirebaseAuth();
  const authCurrentUser = auth ? auth.currentUser : null;
  const lastUid = (authCurrentUser && authCurrentUser.uid) || (currentUser && currentUser.uid) || '';

  if (window.GisugoPushNotifications && typeof window.GisugoPushNotifications.prepareForLogout === 'function') {
    try {
      await window.GisugoPushNotifications.prepareForLogout(lastUid);
    } catch (pushError) {
      console.warn('⚠️ Push logout cleanup failed (continuing logout):', pushError);
    }
  }
  
  if (auth) {
    try {
      await auth.signOut();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }
  
  // Clear localStorage user data
  localStorage.removeItem('gisugo_current_user');
  currentUser = null;
  
  // Notify listeners
  authStateListeners.forEach(cb => cb(null));
  
  return {
    success: true,
    message: 'Logged out successfully'
  };
}

// ============================================================================
// USER PROFILE HELPERS
// ============================================================================

/**
 * Create user profile document in Firestore
 * @param {string} userId - User's UID
 * @param {Object} profileData - Profile data to store
 * @returns {Promise<void>}
 */
async function createUserProfile(userId, profileData) {
  const db = getFirestore();
  
  if (!db) {
    // Store in localStorage for offline mode
    const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
    users[userId] = {
      userId: userId,
      ...profileData,
      accountCreated: new Date().toISOString()
    };
    localStorage.setItem('gisugo_users', JSON.stringify(users));
    console.log('✅ User profile stored in localStorage');
    return;
  }
  
  try {
    // Default profile structure matching FIREBASE_SCHEMA.md
    const defaultProfile = {
      // Basic Information
      userId: userId,
      fullName: '',
      email: '',
      profilePhoto: '',
      dateOfBirth: '',
      educationLevel: '',
      userSummary: '',
      
      // Social Media
      socialMedia: {
        facebook: '',
        instagram: '',
        linkedin: ''
      },
      
      // System Fields
      accountCreated: firebase.firestore.FieldValue.serverTimestamp(),
      lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      rating: 0,
      reviewCount: 0,
      
      // Verification Status
      verification: {
        status: 'none',
        businessVerified: false,
        proVerified: false,
        faceVerified: false,
        facePosterUrl: '',
        facePosterPath: '',
        faceVideoUrl: '',
        faceVideoPath: '',
        verificationDate: null,
        idSubmitted: false,
        eligibleForSubmission: false
      },
      
      // G-Coins Wallet
      wallet: {
        gCoinsBalance: 0,
        lastTopUp: null,
        totalSpent: 0,
        totalPurchased: 0
      },
      
      // Referral System
      referral: {
        referralCode: generateReferralCode(userId),
        signupCount: 0,
        proEligible: false,
        businessEligible: false,
        totalEarned: 0,
        gCoinsEarned: 0
      },
      
      // Job Statistics
      appliedJobsCount: 0,
      activeJobsCount: 0,
      applicationCoinsCurrent: 10,
      applicationCoinsMax: 10,
      
      // Financial Statistics (for tax reporting)
      statistics: {
        worker: {
          totalGigsAccepted: 0,
          totalGigsCompleted: 0,
          totalGigsResigned: 0,
          totalGigsRemoved: 0,
          totalEarned: 0,
          yearlyStats: {}  // Will be populated as { "2025": { gigsCompleted: 0, earned: 0 }, ... }
        },
        customer: {
          totalGigsPosted: 0,
          totalGigsCompleted: 0,
          totalWorkersFired: 0,
          totalWorkersQuit: 0,
          totalSpent: 0,
          yearlyStats: {}  // Will be populated as { "2025": { gigsCompleted: 0, spent: 0 }, ... }
        }
      }
    };
    
    // Merge with provided data
    const finalProfile = {
      ...defaultProfile,
      ...profileData,
      verification: { ...defaultProfile.verification, ...(profileData.verification || {}) },
      wallet: { ...defaultProfile.wallet, ...(profileData.wallet || {}) },
      referral: { ...defaultProfile.referral, ...(profileData.referral || {}) },
      statistics: {
        ...defaultProfile.statistics,
        ...(profileData.statistics || {}),
        worker: {
          ...defaultProfile.statistics.worker,
          ...(((profileData.statistics || {}).worker) || {})
        },
        customer: {
          ...defaultProfile.statistics.customer,
          ...(((profileData.statistics || {}).customer) || {})
        }
      }
    };

    await db.collection('users').doc(userId).set(finalProfile);
    console.log('✅ User profile created in Firestore');
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user profile from Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<Object|null>} - User profile or null if not found
 */
async function getUserProfile(userId) {
  const db = getFirestore();
  
  if (!db) {
    // Get from localStorage for offline mode
    const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
    return users[userId] || null;
  }
  
  try {
    const doc = await db.collection('users').doc(userId).get();
    
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    return null;
  }
}

/**
 * Update user profile in Firestore
 * @param {string} userId - User's UID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - Result object
 */
async function updateUserProfile(userId, updates) {
  const db = getFirestore();
  
  if (!db) {
    // Update in localStorage for offline mode
    const users = JSON.parse(localStorage.getItem('gisugo_users') || '{}');
    if (users[userId]) {
      users[userId] = { ...users[userId], ...updates };
      localStorage.setItem('gisugo_users', JSON.stringify(users));
      return { success: true, message: 'Profile updated (offline mode)' };
    }
    return { success: false, message: 'User not found' };
  }
  
  try {
    // 🔒 SECURITY: Name changes require admin approval. Only block an ACTUAL change —
    // saves that include the (unchanged) name must still go through, otherwise every
    // profile save is rejected just because the payload carries the current name.
    if (updates.fullName !== undefined && updates.fullName !== null) {
      const currentSnap = await db.collection('users').doc(userId).get();
      const currentName = (currentSnap.exists ? (currentSnap.data().fullName || '') : '').trim();
      const requestedName = String(updates.fullName).trim();

      if (requestedName !== currentName) {
        console.warn('🔒 Name change blocked: Requires admin approval');
        return {
          success: false,
          message: 'Name changes require approval from Admin. Please contact support if you need to update your name.',
          code: 'NAME_CHANGE_LOCKED'
        };
      }

      // Name unchanged — drop it so we never overwrite the stored value with a no-op.
      delete updates.fullName;
    }

    await db.collection('users').doc(userId).update({
      ...updates,
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: 'Profile updated successfully' };
    
  } catch (error) {
    console.error('❌ Error updating user profile:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Store a user's phone number in the owner-only `user_private` collection.
 * Phone is a contact field for the Direct-contact reveal flow; it must NOT live
 * on the public `users` doc (world-readable) or it would be scrapable straight
 * from the API. The reveal callable reads it from here on the server side.
 */
async function savePrivatePhone(userId, phoneNumber) {
  const db = getFirestore();
  if (!db || !userId) return { success: false, message: 'No database or user id' };
  try {
    await db.collection('user_private').doc(userId).set({
      phoneNumber: phoneNumber || '',
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving private phone:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Read a user's phone from `user_private` (owner/admin readable only).
 * Returns '' when absent or unreadable.
 */
async function getPrivatePhone(userId) {
  const db = getFirestore();
  if (!db || !userId) return '';
  try {
    const snap = await db.collection('user_private').doc(userId).get();
    return (snap.exists && typeof snap.data().phoneNumber === 'string') ? snap.data().phoneNumber : '';
  } catch (error) {
    console.warn('⚠️ Could not read private phone:', (error && error.code) || error);
    return '';
  }
}

// Generate referral code
function generateReferralCode(userId) {
  const shortId = userId.substring(0, 8).toUpperCase();
  return `GISUGO-${shortId}-REFER`;
}

/**
 * Check if user has a complete GISUGO profile in Firestore
 * @param {string} userId - User's UID
 * @returns {Promise<Object>} - { hasProfile: boolean, profile: Object|null }
 */
async function checkUserHasProfile(userId) {
  if (!userId) {
    return { hasProfile: false, profile: null };
  }
  
  try {
    const profile = await getUserProfile(userId);
    
    // Check if profile exists AND has required fields (fullName at minimum)
    const hasProfile = profile !== null && profile.fullName && profile.fullName.trim() !== '';
    
    console.log(`🔍 Profile check for ${userId}: ${hasProfile ? '✅ Has profile' : '❌ No profile'}`);
    
    return { 
      hasProfile, 
      profile,
      missingFields: !hasProfile ? getMissingProfileFields(profile) : []
    };
  } catch (error) {
    console.error('❌ Error checking user profile:', error);
    return { hasProfile: false, profile: null, error };
  }
}

/**
 * Get list of missing required profile fields
 * @param {Object|null} profile - User profile
 * @returns {Array} - List of missing field names
 */
function getMissingProfileFields(profile) {
  const requiredFields = ['fullName'];
  
  if (!profile) {
    return requiredFields;
  }
  
  return requiredFields.filter(field => !profile[field] || profile[field].toString().trim() === '');
}

/**
 * Handle post-authentication redirect based on profile status
 * @param {Object} user - Firebase user object
 * @param {string} defaultRedirect - Where to redirect if profile exists (default: index.html)
 * @param {string} signupRedirect - Where to redirect if no profile (default: sign-up.html)
 */
/**
 * Authoritative profile existence check for LOGIN ROUTING. Reads from the
 * server (not the local cache) so a cold/empty IndexedDB cache can't wrongly
 * report "no profile" and bounce an existing user to sign-up.
 * @returns {Promise<{hasProfile:boolean, errored:boolean}>}
 */
async function confirmProfileFromServer(userId, attempts = 3) {
  const db = getFirestore();
  if (!db) return { hasProfile: false, errored: true };
  // Retry the server read: right after the Facebook popup/app hand-off the
  // Firestore realtime connection can be briefly down, and a single read would
  // throw (or fall back to a cold cache). Retrying lets the connection recover
  // so we get the authoritative answer instead of a false "no profile".
  for (let i = 0; i < attempts; i++) {
    try {
      const doc = await db.collection('users').doc(userId).get({ source: 'server' });
      const data = doc.exists ? doc.data() : null;
      const hasProfile = !!(data && data.fullName && String(data.fullName).trim() !== '');
      gisugoAuthLog('confirmProfileFromServer read', {
        exists: doc.exists,
        fromCache: !!(doc.metadata && doc.metadata.fromCache),
        hasFullName: !!(data && data.fullName)
      });
      return { hasProfile: hasProfile, errored: false };
    } catch (error) {
      gisugoAuthLog('confirmProfileFromServer attempt failed', {
        attempt: i + 1,
        code: (error && error.code) || ''
      });
      if (i < attempts - 1) {
        await new Promise(function(resolve) { setTimeout(resolve, 500 * (i + 1)); });
      }
    }
  }
  return { hasProfile: false, errored: true };
}

async function handleAuthRedirect(user, defaultRedirect = 'index.html', signupRedirect = 'sign-up.html') {
  if (!user) {
    console.log('⚠️ No user provided for redirect');
    return;
  }
  
  gisugoAuthLog('handleAuthRedirect: checking profile', { uid: user.uid });

  // Most reliable signal first: the write-probe verdict from finalizeOAuthSignIn.
  // update() only succeeds if the profile doc exists, so this is server-truth and
  // immune to the flaky source:'server' read that was bouncing real users to
  // sign-up on fresh sessions (write succeeds, read wrongly returns "empty").
  let known = null;
  try {
    const v = sessionStorage.getItem('gisugo_profile_exists');
    if (v === '1') known = true;
    else if (v === '0') known = false;
    sessionStorage.removeItem('gisugo_profile_exists');
  } catch (e) {}

  if (known === true) {
    gisugoAuthLog('handleAuthRedirect: profile exists (write probe) -> go home');
    window.location.href = defaultRedirect;
    return;
  }
  if (known === false) {
    gisugoAuthLog('handleAuthRedirect: no profile (write probe) -> go sign-up');
    routeAuthedUserToSignup(user, signupRedirect);
    return;
  }

  // Probe was inconclusive (offline/timeout) — fall back to the server read.
  const serverCheck = await confirmProfileFromServer(user.uid);
  let hasProfile = serverCheck.hasProfile;

  if (serverCheck.errored) {
    // Server read failed — fall back to the cache-capable check.
    const fallback = await checkUserHasProfile(user.uid);
    hasProfile = fallback.hasProfile;
    if (!hasProfile) {
      // Still unconfirmed, but the user IS authenticated. Never bounce an
      // existing user to sign-up on an unreliable read — send them home.
      gisugoAuthLog('handleAuthRedirect: profile read unreliable, defaulting home');
      window.location.href = defaultRedirect;
      return;
    }
  }

  if (hasProfile) {
    gisugoAuthLog('handleAuthRedirect: go home');
    window.location.href = defaultRedirect;
  } else {
    gisugoAuthLog('handleAuthRedirect: go sign-up');
    routeAuthedUserToSignup(user, signupRedirect);
  }
}

/**
 * Stash the authenticated user's info for the sign-up page to prefill, then send
 * them there to finish creating their profile.
 */
function routeAuthedUserToSignup(user, signupRedirect) {
  try {
    sessionStorage.setItem('gisugo_pending_auth', JSON.stringify({
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      provider: (Array.isArray(user.providerData) && user.providerData[0] && user.providerData[0].providerId) || 'unknown'
    }));
  } catch (e) {}
  window.location.href = signupRedirect;
}

// ============================================================================
// EMAIL VERIFICATION ACCESS GATE
// ============================================================================

const EMAIL_VERIFICATION_GATE_STYLE_ID = 'gisugo-email-gate-styles';
const EMAIL_VERIFICATION_GATE_OVERLAY_ID = 'gisugoEmailVerificationGateOverlay';

function ensureEmailVerificationGateStyles() {
  if (document.getElementById(EMAIL_VERIFICATION_GATE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = EMAIL_VERIFICATION_GATE_STYLE_ID;
  style.textContent = `
    #${EMAIL_VERIFICATION_GATE_OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: rgba(7, 12, 22, 0.68);
      backdrop-filter: blur(4px);
    }
    #${EMAIL_VERIFICATION_GATE_OVERLAY_ID}.show {
      display: flex;
    }
    .email-gate-modal {
      width: min(500px, 100%);
      border-radius: 18px;
      border: 1px solid rgba(130, 148, 177, 0.32);
      background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
      color: #f8fafc;
      box-shadow: 0 25px 55px rgba(0, 0, 0, 0.45);
      padding: 22px 20px;
      font-family: inherit;
    }
    .email-gate-title {
      margin: 0 0 8px 0;
      font-size: 1.2rem;
      font-weight: 800;
      letter-spacing: 0.01em;
    }
    .email-gate-copy {
      margin: 0;
      color: #d7e1ef;
      font-size: 0.96rem;
      line-height: 1.45;
    }
    .email-gate-actions {
      margin-top: 16px;
      display: grid;
      gap: 9px;
    }
    .email-gate-btn {
      border: none;
      border-radius: 12px;
      padding: 11px 13px;
      font-size: 0.93rem;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.14s ease, opacity 0.14s ease;
    }
    .email-gate-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }
    .email-gate-btn:hover:not(:disabled) {
      transform: translateY(-1px);
    }
    .email-gate-btn-primary {
      background: linear-gradient(135deg, #f59e0b, #f97316);
      color: #111827;
    }
    .email-gate-btn-secondary {
      background: rgba(148, 163, 184, 0.2);
      color: #f8fafc;
      border: 1px solid rgba(148, 163, 184, 0.35);
    }
    .email-gate-note {
      margin-top: 10px;
      min-height: 1.2em;
      font-size: 0.84rem;
      color: #fde68a;
    }
  `;

  document.head.appendChild(style);
}

function ensureEmailVerificationGateModal() {
  let overlay = document.getElementById(EMAIL_VERIFICATION_GATE_OVERLAY_ID);
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = EMAIL_VERIFICATION_GATE_OVERLAY_ID;
  overlay.innerHTML = `
    <div class="email-gate-modal" role="dialog" aria-modal="true" aria-labelledby="emailGateTitle">
      <h2 class="email-gate-title" id="emailGateTitle">Verify your email first</h2>
      <p class="email-gate-copy" id="emailGateCopy"></p>
      <div class="email-gate-actions">
        <button type="button" class="email-gate-btn email-gate-btn-primary" id="emailGateResendBtn">RESEND VERIFICATION EMAIL</button>
        <button type="button" class="email-gate-btn email-gate-btn-secondary" id="emailGateRefreshBtn">I ALREADY VERIFIED, REFRESH</button>
        <button type="button" class="email-gate-btn email-gate-btn-secondary" id="emailGateHomeBtn">GO TO HOME</button>
      </div>
      <div class="email-gate-note" id="emailGateNote"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

async function resolveCurrentAuthUser(timeoutMs = 4500) {
  const auth = getFirebaseAuth();
  if (!auth) return getCurrentUser();

  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    let settled = false;
    let unsubscribe = null;
    const finish = (user) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (typeof unsubscribe === 'function') {
        try { unsubscribe(); } catch (_) {}
      }
      resolve(user || auth.currentUser || null);
    };
    unsubscribe = auth.onAuthStateChanged((user) => finish(user), () => finish(auth.currentUser || null));
    const timer = setTimeout(() => finish(auth.currentUser || null), timeoutMs);
  });
}

function userNeedsEmailVerification(user) {
  if (!user) return false;
  if (!user.email) return false;
  const providerIds = Array.isArray(user.providerData)
    ? user.providerData.map((provider) => provider && provider.providerId).filter(Boolean)
    : [];
  const hasEmailPasswordProvider = providerIds.includes('password') || providerIds.includes('emailLink');
  if (!hasEmailPasswordProvider) {
    return false;
  }
  return user.emailVerified === false;
}

function showEmailVerificationGateModal(user, pageName = 'this page') {
  ensureEmailVerificationGateStyles();
  const overlay = ensureEmailVerificationGateModal();
  const copyEl = overlay.querySelector('#emailGateCopy');
  const noteEl = overlay.querySelector('#emailGateNote');
  const resendBtn = overlay.querySelector('#emailGateResendBtn');
  const refreshBtn = overlay.querySelector('#emailGateRefreshBtn');
  const homeBtn = overlay.querySelector('#emailGateHomeBtn');

  if (copyEl) {
    copyEl.textContent = `Your account is created, but email verification is required before opening ${pageName}. Check your inbox for ${user.email}. If you do not see it, check Spam/Junk and mark it as Not Spam.`;
  }
  if (noteEl) noteEl.textContent = '';

  if (resendBtn && !resendBtn.dataset.bound) {
    resendBtn.dataset.bound = '1';
    resendBtn.addEventListener('click', async () => {
      resendBtn.disabled = true;
      const originalText = resendBtn.textContent;
      resendBtn.textContent = 'SENDING...';
      try {
        const authUser = await resolveCurrentAuthUser(2500);
        if (!authUser) {
          throw new Error('No authenticated user found.');
        }
        const actionSettings = getEmailVerificationActionSettings();
        if (actionSettings) {
          await authUser.sendEmailVerification(actionSettings);
        } else {
          await authUser.sendEmailVerification();
        }
        if (noteEl) noteEl.textContent = 'Verification email sent. Please check Inbox and Spam/Junk.';
      } catch (error) {
        console.warn('⚠️ Failed to resend verification email:', error);
        if (noteEl) noteEl.textContent = 'Could not send right now. Please try again in a moment.';
      } finally {
        setTimeout(() => {
          resendBtn.disabled = false;
          resendBtn.textContent = originalText;
        }, 1400);
      }
    });
  }

  if (refreshBtn && !refreshBtn.dataset.bound) {
    refreshBtn.dataset.bound = '1';
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.disabled = true;
      const originalText = refreshBtn.textContent;
      refreshBtn.textContent = 'CHECKING...';
      try {
        const authUser = await resolveCurrentAuthUser(2500);
        if (!authUser) throw new Error('No authenticated user found.');
        await authUser.reload();
        if (authUser.emailVerified) {
          overlay.classList.remove('show');
          window.__gisugoEmailVerificationBlocked = false;
          window.location.reload();
          return;
        }
        if (noteEl) noteEl.textContent = 'Email is still not verified. Open the link first, then tap refresh.';
      } catch (error) {
        console.warn('⚠️ Failed to refresh verification status:', error);
        if (noteEl) noteEl.textContent = 'Could not refresh status. Please try again.';
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = originalText;
      }
    });
  }

  if (homeBtn && !homeBtn.dataset.bound) {
    homeBtn.dataset.bound = '1';
    homeBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  overlay.classList.add('show');
}

async function requireVerifiedEmailForPage(options = {}) {
  const pageName = options.pageName || 'this page';
  const redirectOnUnauth = options.redirectOnUnauth || '';
  const allowUnverified = options.allowUnverified === true;
  window.__gisugoEmailVerificationBlocked = false;

  const user = await resolveCurrentAuthUser();
  if (!user) {
    if (redirectOnUnauth) {
      window.location.href = redirectOnUnauth;
    }
    return false;
  }

  if (!userNeedsEmailVerification(user)) {
    return true;
  }

  if (allowUnverified) {
    return true;
  }

  window.__gisugoEmailVerificationBlocked = true;
  showEmailVerificationGateModal(user, pageName);
  return false;
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make functions globally available
window.onAuthStateChange = onAuthStateChange;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.isLoggedIn = isLoggedIn;
window.loginWithGoogle = loginWithGoogle;
window.loginWithFacebook = loginWithFacebook;
window.loginWithFacebookToken = loginWithFacebookToken;
window.preloadFacebookSDK = preloadFacebookSDK;
window.completeRedirectSignIn = completeRedirectSignIn;
window.gisugoAuthLog = gisugoAuthLog;
window.loginWithEmail = loginWithEmail;
window.signUpWithPhonePassword = signUpWithPhonePassword;
window.loginWithPhonePassword = loginWithPhonePassword;
window.normalizePhoneNumber = normalizePhoneNumber;
window.isLikelyIOS = isLikelyIOS;
window.confirmFacebookOnIOS = confirmFacebookOnIOS;
window.loginWithFacebookDevice = loginWithFacebookDevice;
window.resumeFacebookDeviceLoginIfPending = resumeFacebookDeviceLoginIfPending;
window.logout = logout;
window.createUserProfile = createUserProfile;
window.getUserProfile = getUserProfile;
window.updateUserProfile = updateUserProfile;
window.savePrivatePhone = savePrivatePhone;
window.getPrivatePhone = getPrivatePhone;
window.checkUserHasProfile = checkUserHasProfile;
window.handleAuthRedirect = handleAuthRedirect;
window.requireVerifiedEmailForPage = requireVerifiedEmailForPage;

console.log('📦 Firebase auth module loaded');

