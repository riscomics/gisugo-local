/**
 * GISUGO Phone Gate
 * ------------------------------------------------------------------
 * Ensures a logged-in user has a phone number in their owner-only private
 * storage (user_private) before they can APPLY to or POST a gig. This is the
 * backfill path for accounts created before the phone field was mandatory.
 *
 * There is NO SMS / verification here — phone is a required contact field only
 * (customers use it to reach the worker). Same validation rules as sign-up.js.
 *
 * Public API:
 *   window.ensurePhoneOnFile() -> Promise<boolean>
 *     - true  : a phone is (now) on file — caller may proceed.
 *     - false : user dismissed the prompt — caller must abort its action.
 *   Fails OPEN (returns true) when not logged in or on a transient read error,
 *   so a network hiccup never hard-blocks a legitimate user.
 *
 * Cost note: once a phone is confirmed on file we cache that in-memory, so
 * repeat apply/post clicks in the same session cost ZERO extra Firestore reads.
 */
(function () {
  'use strict';

  let phoneConfirmed = false; // session cache — avoids repeat profile reads
  let gateResolve = null;     // resolver for the currently-open prompt (if any)
  let built = false;
  let els = null;

  const COUNTRY_CODES = [
    ['+63', '\u{1F1F5}\u{1F1ED} +63'], ['+1', '\u{1F1FA}\u{1F1F8} +1'],
    ['+44', '\u{1F1EC}\u{1F1E7} +44'], ['+61', '\u{1F1E6}\u{1F1FA} +61'],
    ['+81', '\u{1F1EF}\u{1F1F5} +81'], ['+82', '\u{1F1F0}\u{1F1F7} +82'],
    ['+65', '\u{1F1F8}\u{1F1EC} +65'], ['+60', '\u{1F1F2}\u{1F1FE} +60'],
    ['+66', '\u{1F1F9}\u{1F1ED} +66'], ['+84', '\u{1F1FB}\u{1F1F3} +84'],
    ['+62', '\u{1F1EE}\u{1F1E9} +62'], ['+971', '\u{1F1E6}\u{1F1EA} +971'],
    ['+49', '\u{1F1E9}\u{1F1EA} +49'], ['+33', '\u{1F1EB}\u{1F1F7} +33'],
    ['+86', '\u{1F1E8}\u{1F1F3} +86'], ['+91', '\u{1F1EE}\u{1F1F3} +91']
  ];

  // --- validation (mirrors sign-up.js exactly) ---
  function getPhoneDigits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function isValidPhone(value, countryCode) {
    let digits = getPhoneDigits(value);
    if (!digits) return false;
    if (countryCode === '+63') {
      if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
      return digits.length === 10 && digits.startsWith('9');
    }
    return digits.length >= 7 && digits.length <= 15;
  }

  function buildFullPhoneNumber(countryCode, value) {
    let digits = getPhoneDigits(value);
    if (countryCode === '+63' && digits.length === 11 && digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return digits ? `${countryCode}${digits}` : '';
  }

  function injectStyles() {
    if (document.getElementById('phoneGateStyles')) return;
    const style = document.createElement('style');
    style.id = 'phoneGateStyles';
    style.textContent = `
      .phone-gate-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82);
        display: flex; align-items: center; justify-content: center; z-index: 100000;
        opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s ease;
        padding: 16px; }
      .phone-gate-overlay.show { opacity: 1; visibility: visible; }
      .phone-gate-box { width: 100%; max-width: 380px; background: linear-gradient(160deg,#2d3748 0%,#1f2937 100%);
        border: 1px solid rgba(16,185,129,0.25); border-radius: 16px; padding: 22px 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5); font-family: Arial, Helvetica, sans-serif; text-align: center; }
      .phone-gate-icon { font-size: 34px; line-height: 1; margin-bottom: 8px; }
      .phone-gate-title { color: #10b981; font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
      .phone-gate-desc { color: #cbd5e1; font-size: 0.9rem; line-height: 1.4; margin-bottom: 16px; }
      .phone-gate-field { display: flex; gap: 8px; margin-bottom: 6px; }
      .phone-gate-country { background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); color: #fff;
        font-weight: 700; font-size: 0.9rem; border: 2px solid rgba(59,130,246,0.3); border-radius: 8px;
        padding: 12px 8px; min-width: 96px; cursor: pointer; }
      .phone-gate-country option { background: #1f2937; color: #e5e7eb; }
      .phone-gate-input { flex: 1; background: #1a202c; border: 2px solid rgba(107,114,128,0.35);
        color: #e5e7eb; border-radius: 8px; padding: 12px; font-size: 1rem; min-width: 0; }
      .phone-gate-input:focus { outline: none; border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
      .phone-gate-error { color: #fca5a5; font-size: 0.82rem; min-height: 18px; text-align: left; margin-bottom: 10px; }
      .phone-gate-btn { display: block; width: 100%; border: none; border-radius: 10px; padding: 13px;
        font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; }
      .phone-gate-save { background: linear-gradient(135deg,#10b981 0%,#059669 100%); color: #fff; margin-bottom: 8px; }
      .phone-gate-save:hover:not(:disabled) { background: linear-gradient(135deg,#059669 0%,#047857 100%); }
      .phone-gate-save:disabled { opacity: 0.6; cursor: not-allowed; }
      .phone-gate-later { background: transparent; color: #9ca3af; border: 1px solid rgba(107,114,128,0.4); }
      .phone-gate-later:hover { color: #d1d5db; background: rgba(107,114,128,0.12); }
    `;
    document.head.appendChild(style);
  }

  function build() {
    if (built) return;
    injectStyles();

    const overlay = document.createElement('div');
    overlay.className = 'phone-gate-overlay';
    overlay.id = 'phoneGateOverlay';

    const options = COUNTRY_CODES
      .map(([code, label]) => `<option value="${code}">${label}</option>`)
      .join('');

    overlay.innerHTML = `
      <div class="phone-gate-box" role="dialog" aria-modal="true" aria-labelledby="phoneGateTitle">
        <div class="phone-gate-icon">\u{1F4DE}</div>
        <div class="phone-gate-title" id="phoneGateTitle">Add your phone number</div>
        <div class="phone-gate-desc">Customers use this to contact you when you apply for or are hired for a gig. A phone number is required to continue.</div>
        <div class="phone-gate-field">
          <select id="phoneGateCountry" class="phone-gate-country" aria-label="Country code">${options}</select>
          <input type="tel" id="phoneGateInput" class="phone-gate-input" placeholder="9123456789" maxlength="15" autocomplete="tel" inputmode="numeric">
        </div>
        <div class="phone-gate-error" id="phoneGateError"></div>
        <button type="button" class="phone-gate-btn phone-gate-save" id="phoneGateSaveBtn">SAVE &amp; CONTINUE</button>
        <button type="button" class="phone-gate-btn phone-gate-later" id="phoneGateLaterBtn">Not now</button>
      </div>
    `;
    document.body.appendChild(overlay);

    els = {
      overlay,
      country: overlay.querySelector('#phoneGateCountry'),
      input: overlay.querySelector('#phoneGateInput'),
      error: overlay.querySelector('#phoneGateError'),
      save: overlay.querySelector('#phoneGateSaveBtn'),
      later: overlay.querySelector('#phoneGateLaterBtn')
    };

    // Listeners are attached exactly ONCE (modal is reused across calls) — no leaks.
    els.save.addEventListener('click', onSave);
    els.later.addEventListener('click', () => finish(false));
    els.input.addEventListener('input', () => { els.error.textContent = ''; });
    els.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); onSave(); }
    });

    built = true;
  }

  function open() {
    build();
    els.error.textContent = '';
    els.input.value = '';
    els.country.value = '+63';
    els.save.disabled = false;
    els.overlay.classList.add('show');
    setTimeout(() => { try { els.input.focus(); } catch (_) {} }, 120);
  }

  function finish(result) {
    if (els && els.overlay) els.overlay.classList.remove('show');
    const resolve = gateResolve;
    gateResolve = null;
    if (resolve) resolve(result);
  }

  async function onSave() {
    const cc = (els.country && els.country.value) || '+63';
    const raw = els.input ? els.input.value : '';
    if (!isValidPhone(raw, cc)) {
      els.error.textContent = cc === '+63'
        ? 'Enter a valid PH mobile number (e.g. 9123456789).'
        : 'Enter a valid phone number (7\u201315 digits).';
      return;
    }
    const full = buildFullPhoneNumber(cc, raw);

    const userId = typeof window.getCurrentUserId === 'function' ? window.getCurrentUserId() : null;
    if (!userId) { finish(true); return; }

    if (typeof window.savePrivatePhone !== 'function') {
      // No save path available — don't trap the user.
      console.warn('\u26A0\uFE0F Phone gate: savePrivatePhone unavailable, allowing through');
      phoneConfirmed = true;
      finish(true);
      return;
    }

    const originalText = els.save.textContent;
    els.save.disabled = true;
    els.save.textContent = 'SAVING...';
    try {
      const res = await window.savePrivatePhone(userId, full);
      if (res && res.success === false) {
        els.error.textContent = res.message || 'Could not save. Please try again.';
        return;
      }
      phoneConfirmed = true;
      finish(true);
    } catch (err) {
      console.warn('\u26A0\uFE0F Phone gate save failed:', err);
      els.error.textContent = 'Could not save right now. Please try again.';
    } finally {
      els.save.disabled = false;
      els.save.textContent = originalText;
    }
  }

  async function ensurePhoneOnFile() {
    if (phoneConfirmed) return true;

    // A prompt is already open (shouldn't normally happen) — don't stack modals.
    if (gateResolve) return false;

    let userId = null;
    try {
      userId = typeof window.getCurrentUserId === 'function' ? window.getCurrentUserId() : null;
    } catch (_) {}
    if (!userId) return true; // not logged in — page's own auth handles it

    let phone = '';
    try {
      if (typeof window.getPrivatePhone === 'function') {
        phone = await window.getPrivatePhone(userId);
      }
    } catch (err) {
      console.warn('\u26A0\uFE0F Phone gate: private phone read failed, allowing through:', err);
      return true; // fail open on transient error
    }

    phone = (typeof phone === 'string') ? phone.trim() : '';
    if (phone) { phoneConfirmed = true; return true; }

    // No phone on file → prompt and block until saved or dismissed.
    return new Promise((resolve) => {
      gateResolve = resolve;
      open();
    });
  }

  window.ensurePhoneOnFile = ensurePhoneOnFile;
})();
