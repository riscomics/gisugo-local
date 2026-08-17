// ============================================================================
// ADMIN DASHBOARD ACCESS GATE
// ============================================================================
// admin-dashboard.html starts with the whole page hidden behind an overlay
// (see the inline <style> + `admin-auth-pending` body class in the HTML).
// This script is the ONLY thing that can remove that class. Until it does,
// nothing else on the page — including admin-dashboard.js's own init — is
// visible to whoever is looking at the page.
//
// Checks, in order:
//   1. Is anyone signed in at all? If not -> send to login.
//   2. Is that signed-in account listed in the `admins` Firestore collection?
//      If not -> block with "Access denied" (they're a real logged-in user,
//      just not an admin, so we don't send them back through login again).
//   3. Otherwise -> reveal the dashboard and stash the admin's role on
//      `window.currentAdmin` for later use (e.g. hiding Settings from a
//      future limited "support" role admin).
// ============================================================================

(function () {
  'use strict';

  var MIN_SPLASH_MS = 2000;
  var splashStartedAt = Date.now();
  var overviewSettleTimer = null;
  var overviewSettleBound = false;

  function waitForMinSplash() {
    var remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - splashStartedAt));
    return new Promise(function (resolve) { setTimeout(resolve, remaining); });
  }

  function settleOverviewTiles() {
    if (overviewSettleTimer) {
      clearTimeout(overviewSettleTimer);
      overviewSettleTimer = null;
    }
    document.body.classList.add('overview-tiles-settled');
  }

  function armOverviewTileSettle() {
    if (overviewSettleBound) return;
    overviewSettleBound = true;
    var lastTile = document.getElementById('trafficCostsCard');
    function onEnd(event) {
      if (event.animationName && event.animationName !== 'overviewTileIn') return;
      if (lastTile) lastTile.removeEventListener('animationend', onEnd);
      settleOverviewTiles();
    }
    if (lastTile) lastTile.addEventListener('animationend', onEnd);
    overviewSettleTimer = setTimeout(function () {
      if (lastTile) lastTile.removeEventListener('animationend', onEnd);
      settleOverviewTiles();
    }, 2500);
  }

  function showGate(title, message, showReturnLink) {
    var overlay = document.getElementById('adminAuthGateOverlay');
    var titleEl = document.getElementById('adminAuthGateTitle');
    var msgEl = document.getElementById('adminAuthGateMessage');
    var actionEl = document.getElementById('adminAuthGateAction');
    if (overlay) overlay.classList.add('is-denied');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (actionEl) actionEl.style.display = showReturnLink ? 'inline-block' : 'none';
  }

  async function revealDashboard(adminRecord, user) {
    window.currentAdmin = {
      uid: user.uid,
      role: (adminRecord && adminRecord.role) || 'super_admin',
      name: (user.displayName || '').trim() || 'Admin'
    };

    await waitForMinSplash();
    document.body.classList.remove('admin-auth-pending');
    armOverviewTileSettle();

    // Reflect the real signed-in admin instead of the hardcoded mock name.
    var nameEl = document.querySelector('.admin-name');
    if (nameEl && window.currentAdmin.name) {
      nameEl.textContent = window.currentAdmin.name;
    }

    console.log('✅ Admin access granted:', window.currentAdmin.name, '(' + window.currentAdmin.role + ')');
  }

  async function runGate() {
    if (typeof firebase === 'undefined') {
      showGate('Setup error', 'Firebase failed to load. Refresh the page or contact support.', false);
      return;
    }

    var user;
    try {
      user = typeof resolveCurrentAuthUser === 'function'
        ? await resolveCurrentAuthUser()
        : (firebase.auth().currentUser || null);
    } catch (error) {
      console.error('❌ Could not resolve auth state:', error);
      user = null;
    }

    if (!user) {
      await waitForMinSplash();
      window.location.href = 'login.html?redirect=admin-dashboard.html';
      return;
    }

    try {
      // New mobile-Chrome tabs often have currentUser before Firestore has
      // the ID token. The old `admins` read then failed as "not an admin".
      await user.getIdToken();
    } catch (tokenError) {
      console.warn('⚠️ Could not get ID token before admin check:', tokenError);
    }

    async function readAdminDoc() {
      return firebase.firestore().collection('admins').doc(user.uid).get();
    }

    try {
      var adminDoc;
      try {
        adminDoc = await readAdminDoc();
      } catch (firstError) {
        console.warn('⚠️ Admin doc read failed, retrying after token refresh:', firstError);
        try { await user.getIdToken(true); } catch (_) { /* ignore */ }
        await new Promise(function (resolve) { setTimeout(resolve, 300); });
        adminDoc = await readAdminDoc();
      }

      if (!adminDoc.exists) {
        console.warn('⚠️ Access denied for uid:', user.uid);
        await waitForMinSplash();
        showGate(
          'Access denied',
          'This account does not have admin access. Contact the primary administrator if you believe this is a mistake.',
          true
        );
        return;
      }

      await revealDashboard(adminDoc.data(), user);
    } catch (error) {
      console.error('❌ Admin access check failed:', error);
      await waitForMinSplash();
      showGate('Access check failed', 'Could not verify admin access. Refresh the page or try again later.', true);
    }
  }

  runGate();
})();
