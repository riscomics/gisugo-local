/**
 * GISUGO Direct Contact Reveal
 * ------------------------------------------------------------------
 * Customer-side flow to contact a job applicant directly (call/text) in the
 * Direct model. Two steps in one overlay:
 *   1. Disclaimer/tips (incl. worker-fairness + consent recap).
 *   2. Call / Text actions — launched via tel:/sms:. The number is NEVER shown
 *      on screen and never lives on a readable doc; it is fetched only through
 *      the ownership-checked `revealApplicantContact` callable.
 *
 * Public API:
 *   window.startDirectContactReveal({ applicationId, userName })
 */
(function () {
  'use strict';

  let built = false;
  let els = null;

  function injectStyles() {
    if (document.getElementById('contactRevealStyles')) return;
    const style = document.createElement('style');
    style.id = 'contactRevealStyles';
    style.textContent = `
      .contact-reveal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.82);
        display: flex; align-items: center; justify-content: center; z-index: 100001;
        opacity: 0; visibility: hidden; transition: opacity 0.25s ease, visibility 0.25s ease;
        padding: 16px; }
      .contact-reveal-overlay.show { opacity: 1; visibility: visible; }
      .contact-reveal-box { width: 100%; max-width: 400px; background: linear-gradient(160deg,#2d3748 0%,#1f2937 100%);
        border: 1px solid rgba(16,185,129,0.25); border-radius: 16px; padding: 22px 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5); font-family: Arial, Helvetica, sans-serif; text-align: center; }
      .contact-reveal-icon { font-size: 34px; line-height: 1; margin-bottom: 8px; }
      .contact-reveal-title { color: #10b981; font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; }
      .contact-reveal-note { color: #cbd5e1; font-size: 0.86rem; line-height: 1.45; margin-bottom: 8px; text-align: left; }
      .contact-reveal-note strong { color: #e5e7eb; }
      .contact-reveal-langs { display: flex; gap: 6px; justify-content: center; margin: 12px 0 10px; }
      .contact-reveal-lang { flex: 1; background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3);
        border-radius: 8px; padding: 8px 4px; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
      .contact-reveal-lang.active { background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); color: #fff; }
      .contact-reveal-error { color: #fca5a5; font-size: 0.85rem; min-height: 18px; margin: 6px 0 10px; }
      .contact-reveal-btn { display: block; width: 100%; border: none; border-radius: 10px; padding: 13px;
        font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; text-decoration: none;
        box-sizing: border-box; }
      .contact-reveal-primary { background: linear-gradient(135deg,#10b981 0%,#059669 100%); color: #fff; margin-bottom: 8px; }
      .contact-reveal-primary:hover:not(:disabled) { background: linear-gradient(135deg,#059669 0%,#047857 100%); }
      .contact-reveal-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      .contact-reveal-call { background: linear-gradient(135deg,#10b981 0%,#059669 100%); color: #fff; margin-bottom: 8px; }
      .contact-reveal-text { background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); color: #fff; margin-bottom: 8px; }
      .contact-reveal-cancel { background: transparent; color: #9ca3af; border: 1px solid rgba(107,114,128,0.4); }
      .contact-reveal-cancel:hover { color: #d1d5db; background: rgba(107,114,128,0.12); }
      .contact-reveal-foot { color: #94a3b8; font-size: 0.75rem; line-height: 1.4; margin-top: 12px; }
    `;
    document.head.appendChild(style);
  }

  // Short trilingual disclaimer + worker-fairness + consent recap.
  const NOTES = {
    english: 'You are about to contact this worker directly by phone. <strong>GISUGO is only a platform</strong> and is not part of your arrangement. Agree on details, price, and safety yourselves. The worker consented to share their contact when they applied.',
    bisaya: 'Kontakon nimo direkta ang worker pinaagi sa telepono. <strong>Ang GISUGO usa lang ka platform</strong>, dili apil sa inyong deal. Kamo ang magkasabot sa detalye, presyo, ug kaluwasan. Miuyon ang worker nga ipaambit ang iyang kontak dihang ni-apply siya.',
    tagalog: 'Direkta mong tatawagan ang worker sa telepono. <strong>Ang GISUGO ay platform lamang</strong> at hindi kasali sa inyong usapan. Kayo ang magkakasundo sa detalye, presyo, at kaligtasan. Pumayag ang worker na ibahagi ang kaniyang contact noong nag-apply siya.'
  };

  let currentLang = 'english';

  function build() {
    if (built) return;
    injectStyles();

    const overlay = document.createElement('div');
    overlay.className = 'contact-reveal-overlay';
    overlay.id = 'contactRevealOverlay';
    overlay.innerHTML = `
      <div class="contact-reveal-box" role="dialog" aria-modal="true" aria-labelledby="contactRevealTitle">
        <div class="contact-reveal-icon">\u{1F4DE}</div>
        <div class="contact-reveal-title" id="contactRevealTitle">Contact Worker</div>

        <div id="contactRevealStep1">
          <div class="contact-reveal-langs" id="contactRevealLangs">
            <button type="button" class="contact-reveal-lang active" data-lang="english">English</button>
            <button type="button" class="contact-reveal-lang" data-lang="bisaya">Bisaya</button>
            <button type="button" class="contact-reveal-lang" data-lang="tagalog">Tagalog</button>
          </div>
          <div class="contact-reveal-note" id="contactRevealNote"></div>
          <div class="contact-reveal-error" id="contactRevealError"></div>
          <button type="button" class="contact-reveal-btn contact-reveal-primary" id="contactRevealContinue">CONTINUE</button>
          <button type="button" class="contact-reveal-btn contact-reveal-cancel" id="contactRevealCancel">Cancel</button>
        </div>

        <div id="contactRevealStep2" style="display:none;">
          <div class="contact-reveal-note" style="text-align:center;">Choose how to reach this worker.</div>
          <a class="contact-reveal-btn contact-reveal-call" id="contactRevealCall" href="#">\u{1F4DE} Call</a>
          <a class="contact-reveal-btn contact-reveal-text" id="contactRevealText" href="#">\u{1F4AC} Text</a>
          <button type="button" class="contact-reveal-btn contact-reveal-cancel" id="contactRevealDone">Done</button>
          <div class="contact-reveal-foot">For your privacy and the worker's, GISUGO does not display or store this number publicly.</div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    els = {
      overlay,
      title: overlay.querySelector('#contactRevealTitle'),
      step1: overlay.querySelector('#contactRevealStep1'),
      step2: overlay.querySelector('#contactRevealStep2'),
      langs: overlay.querySelector('#contactRevealLangs'),
      note: overlay.querySelector('#contactRevealNote'),
      error: overlay.querySelector('#contactRevealError'),
      continue: overlay.querySelector('#contactRevealContinue'),
      cancel: overlay.querySelector('#contactRevealCancel'),
      call: overlay.querySelector('#contactRevealCall'),
      text: overlay.querySelector('#contactRevealText'),
      done: overlay.querySelector('#contactRevealDone')
    };

    // Listeners attached exactly once (overlay reused across calls) — no leaks.
    els.langs.addEventListener('click', (e) => {
      const btn = e.target.closest('.contact-reveal-lang');
      if (!btn) return;
      currentLang = btn.getAttribute('data-lang') || 'english';
      renderLang();
    });
    els.cancel.addEventListener('click', close);
    els.done.addEventListener('click', close);
    els.overlay.addEventListener('click', (e) => { if (e.target === els.overlay) close(); });

    built = true;
  }

  function renderLang() {
    if (!els) return;
    Array.from(els.langs.querySelectorAll('.contact-reveal-lang')).forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-lang') === currentLang);
    });
    els.note.innerHTML = NOTES[currentLang] || NOTES.english;
  }

  function close() {
    if (!els) return;
    els.overlay.classList.remove('show');
  }

  function mapError(err) {
    const code = (err && err.code) ? String(err.code) : '';
    if (code.indexOf('failed-precondition') !== -1) {
      return 'This worker has no contact number on file yet.';
    }
    if (code.indexOf('resource-exhausted') !== -1) {
      return 'Too many contact reveals right now. Please wait a bit and try again.';
    }
    if (code.indexOf('permission-denied') !== -1) {
      return 'You can only contact applicants on your own gigs.';
    }
    if (code.indexOf('unauthenticated') !== -1) {
      return 'Please sign in again to contact this worker.';
    }
    return 'Could not get the contact right now. Please try again.';
  }

  async function onContinue(applicationId) {
    if (!applicationId) return;
    if (typeof firebase === 'undefined' || !firebase.app || !firebase.app().functions) {
      els.error.textContent = 'Contact service is unavailable. Please refresh and try again.';
      return;
    }
    els.error.textContent = '';
    const originalText = els.continue.textContent;
    els.continue.disabled = true;
    els.continue.textContent = 'PLEASE WAIT...';
    try {
      const callable = firebase.app().functions('asia-southeast1').httpsCallable('revealApplicantContact');
      const res = await callable({ applicationId: applicationId });
      const phone = res && res.data && res.data.phoneNumber ? String(res.data.phoneNumber).trim() : '';
      if (!phone) {
        els.error.textContent = 'This worker has no contact number on file yet.';
        return;
      }
      // Populate tel:/sms: without ever rendering the number as text.
      els.call.setAttribute('href', 'tel:' + phone);
      els.text.setAttribute('href', 'sms:' + phone);
      els.step1.style.display = 'none';
      els.step2.style.display = 'block';
    } catch (err) {
      console.warn('\u26A0\uFE0F revealApplicantContact failed:', (err && err.code) || err);
      els.error.textContent = mapError(err);
    } finally {
      els.continue.disabled = false;
      els.continue.textContent = originalText;
    }
  }

  function startDirectContactReveal(opts) {
    const applicationId = String((opts && opts.applicationId) || '').trim();
    const userName = String((opts && opts.userName) || '').trim();
    if (!applicationId) {
      console.warn('startDirectContactReveal: missing applicationId');
      return;
    }
    build();

    // Reset to step 1.
    els.title.textContent = userName ? ('Contact ' + userName) : 'Contact Worker';
    els.error.textContent = '';
    els.step2.style.display = 'none';
    els.step1.style.display = 'block';
    els.call.setAttribute('href', '#');
    els.text.setAttribute('href', '#');
    currentLang = 'english';
    renderLang();

    // Rebind continue to this application (single active handler).
    els.continue.onclick = function () { onContinue(applicationId); };

    els.overlay.classList.add('show');
  }

  window.startDirectContactReveal = startDirectContactReveal;
})();
