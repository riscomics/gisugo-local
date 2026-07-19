/**
 * GISUGO Direct Contact Reveal
 * ------------------------------------------------------------------
 * Customer-side flow to contact a job applicant directly (call/text) in the
 * Direct model. Opens the contact actions overlay immediately; the number is
 * NEVER shown on screen and never lives on a readable doc — it is fetched only
 * through the ownership-checked `revealApplicantContact` callable.
 *
 * Public API:
 *   window.startDirectContactReveal({ applicationId, userName })
 */
(function () {
  'use strict';

  let built = false;
  let els = null;
  let revealInFlight = false;
  let revealSeq = 0; // ignore stale reveal results after close / re-open
  let viberDetectTimer = null;
  let viberBlurHandler = null;
  let externalResetTimer = null;
  let externalResetHandler = null;

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
      .contact-reveal-title { color: #10b981; font-size: 1.2rem; font-weight: 700; margin-bottom: 10px; }
      .contact-reveal-langs { display: flex; gap: 6px; justify-content: center; margin: 8px 0 0; }
      .contact-reveal-lang { flex: 1; background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.3);
        border-radius: 8px; padding: 8px 4px; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
      .contact-reveal-lang.active { background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); color: #fff; }
      .contact-reveal-tips { text-align: left; margin: 20px 0; }
      .contact-reveal-tips-title { color: #7dd3fc; font-size: 0.82rem; font-weight: 700; letter-spacing: 0.02em;
        text-transform: uppercase; margin-bottom: 6px; text-align: center; }
      .contact-reveal-tips-list { margin: 0; padding-left: 1.15em; color: #cbd5e1; font-size: 0.86rem;
        line-height: 1.45; }
      .contact-reveal-tips-list li { margin-bottom: 4px; }
      .contact-reveal-tips-list li:last-child { margin-bottom: 0; }
      .contact-reveal-status { color: #93c5fd; font-size: 0.85rem; margin: 0 0 10px; }
      .contact-reveal-error { color: #fca5a5; font-size: 0.85rem; margin: 0 0 10px; }
      .contact-reveal-status:empty, .contact-reveal-error:empty { display: none; margin: 0; }
      .contact-reveal-btn { display: block; width: 100%; border: none; border-radius: 10px; padding: 13px;
        font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s ease; text-decoration: none;
        box-sizing: border-box; }
      .contact-reveal-actions { display: flex; flex-direction: column; gap: 8px; margin: 0 0 14px; }
      .contact-reveal-actions.is-loading { opacity: 0.55; pointer-events: none; }
      .contact-reveal-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
      .contact-reveal-tile { border-radius: 10px; border: none; cursor: pointer;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
        text-decoration: none; font-weight: 700; font-size: 0.68rem; color: #fff; box-sizing: border-box;
        padding: 4px; transition: transform 0.15s ease, filter 0.15s ease; }
      .contact-reveal-grid .contact-reveal-tile { aspect-ratio: auto; height: 68px; padding: 6px 4px; }
      .contact-reveal-tile:hover { filter: brightness(1.08); }
      .contact-reveal-tile:active { transform: scale(0.97); }
      .contact-reveal-tile svg { width: 32px; height: 32px; flex-shrink: 0; }
      .contact-reveal-call { display: flex; width: 100%; aspect-ratio: auto; min-height: 52px;
        flex-direction: row; gap: 8px; font-size: 0.9rem; padding: 10px 12px;
        background: linear-gradient(135deg,#10b981 0%,#059669 100%); color: #fff; }
      .contact-reveal-call svg { width: 28px; height: 28px; }
      .contact-reveal-text { background: linear-gradient(135deg,#3b82f6 0%,#2563eb 100%); color: #fff; }
      .contact-reveal-whatsapp { background: linear-gradient(135deg,#25d366 0%,#128c7e 100%); color: #fff; }
      .contact-reveal-viber { background: linear-gradient(135deg,#7360f2 0%,#59267c 100%); color: #fff; }
      .contact-reveal-cancel { background: linear-gradient(135deg,#10b981 0%,#059669 100%); color: #fff;
        border: none; font-size: 1.05rem; font-weight: 800; letter-spacing: 0.03em; padding: 15px;
        margin-top: 2px; box-shadow: 0 6px 18px rgba(16,185,129,0.4); }
      .contact-reveal-cancel:hover { filter: brightness(1.08); color: #fff; }
      .contact-reveal-cancel:active { transform: scale(0.98); }
      .contact-reveal-foot { color: #94a3b8; font-size: 0.75rem; line-height: 1.4; margin-top: 12px; }
    `;
    document.head.appendChild(style);
  }

  const TIPS = {
    english: {
      title: "What's Important:",
      items: [
        'Call first, get to know them.',
        'Explain the gig clearly.',
        'Agree on Price and Schedule.',
        'If hiring, text the agreed details for records.',
        "Don't forget to click HIRE to Send Gig Offer!"
      ]
    },
    bisaya: {
      title: 'Unsa ang Importante:',
      items: [
        'Tawga una, pagkilala sa usag usa.',
        'Ipahayag og klaro ang gig.',
        'Magkasabot sa Presyo ug Schedule.',
        'Kung mag-hire, i-text ang gikasabutan para sa records.',
        'Ayaw kalimot i-click ang HIRE aron ma-Send ang Gig Offer!'
      ]
    },
    tagalog: {
      title: 'Ano ang Mahalaga:',
      items: [
        'Tumawag muna, magkakilala.',
        'Ipaliwanag nang malinaw ang gig.',
        'Magkasundo sa Presyo at Schedule.',
        'Kung magha-hire, i-text ang napagkasunduan para sa records.',
        'Huwag kalimutang i-click ang HIRE para mag-Send ng Gig Offer!'
      ]
    }
  };

  let currentLang = 'english';

  // Prefilled greeting for chat/SMS launches (editable by the sender). Intentionally
  // NOT applied to Call (tel:) so dialing is not blocked, nor to Viber (no reliable
  // prefill param on its deep link).
  const CONTACT_GREETING = 'Hi! I saw your application on GISUGO and would like to discuss the gig.';

  function build() {
    if (built) return;
    injectStyles();

    const overlay = document.createElement('div');
    overlay.className = 'contact-reveal-overlay';
    overlay.id = 'contactRevealOverlay';
    overlay.innerHTML = `
      <div class="contact-reveal-box" role="dialog" aria-modal="true" aria-labelledby="contactRevealTitle">
        <div class="contact-reveal-title" id="contactRevealTitle">Contact Worker</div>

        <div class="contact-reveal-langs" id="contactRevealLangs">
          <button type="button" class="contact-reveal-lang active" data-lang="english">English</button>
          <button type="button" class="contact-reveal-lang" data-lang="bisaya">Bisaya</button>
          <button type="button" class="contact-reveal-lang" data-lang="tagalog">Tagalog</button>
        </div>
        <div class="contact-reveal-tips" id="contactRevealTips">
          <div class="contact-reveal-tips-title" id="contactRevealTipsTitle"></div>
          <ol class="contact-reveal-tips-list" id="contactRevealTipsList"></ol>
        </div>
        <div class="contact-reveal-status" id="contactRevealStatus"></div>
        <div class="contact-reveal-error" id="contactRevealError"></div>
        <div class="contact-reveal-actions is-loading" id="contactRevealActions">
          <a class="contact-reveal-tile contact-reveal-call" id="contactRevealCall" href="#"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.29 21 3 13.71 3 4.5 3 3.95 3.45 3.5 4 3.5H7.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg><span>Phone</span></a>
          <div class="contact-reveal-grid">
            <a class="contact-reveal-tile contact-reveal-text" id="contactRevealText" href="#"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg><span>Text</span></a>
            <a class="contact-reveal-tile contact-reveal-whatsapp" id="contactRevealWhatsapp" href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.9 11.9 0 005.71 1.454h.006c6.585 0 11.946-5.359 11.949-11.893A11.821 11.821 0 0020.52 3.449"/></svg><span>WhatsApp</span></a>
            <a class="contact-reveal-tile contact-reveal-viber" id="contactRevealViber" href="#"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.576 3.85.324 6.812-.416 7.15-.525.777-.252 5.176-.816 5.892-6.657.74-6.02-.36-9.83-2.34-11.546l-.007-.003c-.6-.55-3.007-2.303-8.37-2.327 0 0-.395-.025-1.031-.01L11.4 0zm.066 1.717c.538-.004.87.015.87.015 4.538.02 6.712 1.417 7.22 1.876 1.674 1.435 2.53 4.868 1.904 9.896v.003c-.606 4.876-4.174 5.184-4.832 5.394-.28.09-2.882.737-6.153.524 0 0-2.436 2.94-3.197 3.704-.119.12-.259.167-.352.144-.13-.033-.166-.188-.164-.415l.02-4.019c-4.762-1.32-4.485-6.292-4.432-8.895.055-2.603.544-4.736 1.996-6.17 1.958-1.774 5.472-2.04 7.107-2.06l.014-.002zm.529 2.65a.185.185 0 00-.185.181.185.185 0 00.181.19c1.437.011 2.62.446 3.573 1.315.947.862 1.428 2.032 1.443 3.573a.185.185 0 00.187.183.185.185 0 00.183-.187c-.016-1.635-.54-2.913-1.565-3.847-1.019-.928-2.31-1.405-3.816-1.418a.185.185 0 00-.001 0zm.532 1.588a.185.185 0 00-.014 0 .185.185 0 00-.175.194.185.185 0 00.194.176c.87.046 1.517.323 1.99.822.473.5.717 1.13.734 1.9a.185.185 0 00.19.181.185.185 0 00.18-.19c-.02-.86-.303-1.6-.86-2.19-.556-.588-1.34-.914-2.24-.963v-.03zm-4.019.198a.583.583 0 00-.354.045l-.014.006c-.28.13-.53.31-.744.53-.163.17-.252.34-.276.505a.756.756 0 00.014.28l.01.008c.098.288.324.767.788 1.61.298.543.615 1.077.955 1.6.17.26.35.516.54.762l.028.036.028.037.028.037c.246.32.51.632.792.928.523.55 1.09 1.06 1.694 1.518l.037.028.037.028.037.028c.246.19.502.37.762.54.523.34 1.057.657 1.6.955.843.464 1.322.69 1.61.788l.008.01a.756.756 0 00.28.014c.165-.024.335-.113.505-.276.22-.214.4-.464.53-.744l.006-.014a.583.583 0 00.045-.354c-.033-.16-.135-.29-.31-.42-.35-.29-.716-.556-1.096-.8-.194-.13-.39-.192-.6-.15-.203.043-.373.16-.516.34l-.29.365c-.147.184-.28.264-.44.264a.5.5 0 01-.17-.03c-.66-.27-1.253-.72-1.79-1.32-.6-.537-1.05-1.13-1.32-1.79a.5.5 0 01-.03-.17c0-.16.08-.293.264-.44l.365-.29c.18-.143.297-.313.34-.516.042-.21-.02-.406-.15-.6-.244-.38-.51-.746-.8-1.096-.13-.175-.26-.277-.42-.31a.583.583 0 00-.048-.007z"/></svg><span>Viber</span></a>
          </div>
        </div>
        <div id="contactRevealViberHint" style="display:none;color:#fbbf24;font-size:0.82rem;line-height:1.35;text-align:center;margin:2px 0 8px;">If nothing opened, Viber may not be installed on this phone.</div>
        <button type="button" class="contact-reveal-btn contact-reveal-cancel" id="contactRevealDone">Done</button>
        <div class="contact-reveal-foot">GISUGO is only a platform and is not part of your arrangement. For your privacy and the worker's, GISUGO does not display or store this number publicly.</div>
      </div>
    `;
    document.body.appendChild(overlay);

    els = {
      overlay,
      title: overlay.querySelector('#contactRevealTitle'),
      langs: overlay.querySelector('#contactRevealLangs'),
      tipsTitle: overlay.querySelector('#contactRevealTipsTitle'),
      tipsList: overlay.querySelector('#contactRevealTipsList'),
      status: overlay.querySelector('#contactRevealStatus'),
      error: overlay.querySelector('#contactRevealError'),
      actions: overlay.querySelector('#contactRevealActions'),
      call: overlay.querySelector('#contactRevealCall'),
      text: overlay.querySelector('#contactRevealText'),
      whatsapp: overlay.querySelector('#contactRevealWhatsapp'),
      viber: overlay.querySelector('#contactRevealViber'),
      viberHint: overlay.querySelector('#contactRevealViberHint'),
      done: overlay.querySelector('#contactRevealDone')
    };

    // Listeners attached exactly once (overlay reused across calls) — no leaks.
    els.langs.addEventListener('click', (e) => {
      const btn = e.target.closest('.contact-reveal-lang');
      if (!btn) return;
      currentLang = btn.getAttribute('data-lang') || 'english';
      renderLang();
    });
    els.done.addEventListener('click', close);
    els.overlay.addEventListener('click', (e) => { if (e.target === els.overlay) close(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els && els.overlay.classList.contains('show')) close();
    });

    // Block taps until the reveal callable has populated real hrefs.
    [els.call, els.text, els.whatsapp, els.viber].forEach((a) => {
      if (!a) return;
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '#';
        if (revealInFlight || href === '#' || href === '') {
          e.preventDefault();
          return;
        }
        markExternalLaunch();
      });
    });

    // Viber has no web fallback: if it isn't installed, tapping does nothing.
    // Best-effort detection — when the app opens, the page loses focus/visibility.
    // If we're still visible ~1.5s later, assume it's not installed and hint.
    if (els.viber) {
      els.viber.addEventListener('click', () => {
        const href = els.viber.getAttribute('href') || '#';
        if (revealInFlight || href === '#' || href === '') return;
        if (els.viberHint) els.viberHint.style.display = 'none';
        clearViberDetect();
        let handled = false;
        viberBlurHandler = () => { handled = true; };
        window.addEventListener('blur', viberBlurHandler, { once: true });
        viberDetectTimer = setTimeout(() => {
          viberDetectTimer = null;
          if (viberBlurHandler) {
            window.removeEventListener('blur', viberBlurHandler);
            viberBlurHandler = null;
          }
          if (!handled && !document.hidden && els && els.viberHint) {
            els.viberHint.style.display = 'block';
          }
        }, 1500);
      });
    }

    built = true;
  }

  function clearViberDetect() {
    if (viberDetectTimer) {
      clearTimeout(viberDetectTimer);
      viberDetectTimer = null;
    }
    if (viberBlurHandler) {
      window.removeEventListener('blur', viberBlurHandler);
      viberBlurHandler = null;
    }
  }

  function clearExternalLaunchFlag() {
    if (externalResetTimer) {
      clearTimeout(externalResetTimer);
      externalResetTimer = null;
    }
    if (externalResetHandler) {
      window.removeEventListener('focus', externalResetHandler);
      externalResetHandler = null;
    }
    window.__gisugoExternalLaunch = false;
  }

  function markExternalLaunch() {
    clearExternalLaunchFlag();
    window.__gisugoExternalLaunch = true;
    externalResetHandler = function () {
      clearExternalLaunchFlag();
    };
    window.addEventListener('focus', externalResetHandler);
    externalResetTimer = setTimeout(clearExternalLaunchFlag, 8000);
  }

  function renderLang() {
    if (!els) return;
    Array.from(els.langs.querySelectorAll('.contact-reveal-lang')).forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-lang') === currentLang);
    });
    const tips = TIPS[currentLang] || TIPS.english;
    if (els.tipsTitle) els.tipsTitle.textContent = tips.title;
    if (els.tipsList) {
      els.tipsList.innerHTML = tips.items.map((item) => '<li>' + item + '</li>').join('');
    }
  }

  function setActionsReady(ready) {
    if (!els || !els.actions) return;
    els.actions.classList.toggle('is-loading', !ready);
  }

  function resetContactLinks() {
    els.call.setAttribute('href', '#');
    els.text.setAttribute('href', '#');
    els.whatsapp.setAttribute('href', '#');
    els.viber.setAttribute('href', '#');
    if (els.viberHint) els.viberHint.style.display = 'none';
  }

  function close() {
    if (!els) return;
    // Invalidate in-flight reveal so a late response cannot arm the wrong links.
    revealSeq += 1;
    revealInFlight = false;
    clearViberDetect();
    resetContactLinks();
    els.status.textContent = '';
    els.error.textContent = '';
    setActionsReady(false);
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

  // Same work the old CONTINUE button did — fetch phone via callable, then arm links.
  async function revealContact(applicationId) {
    if (!applicationId || !els) return;
    const seq = ++revealSeq;

    if (typeof firebase === 'undefined' || !firebase.app || !firebase.app().functions) {
      if (seq !== revealSeq) return;
      els.status.textContent = '';
      els.error.textContent = 'Contact service is unavailable. Please refresh and try again.';
      setActionsReady(false);
      return;
    }

    revealInFlight = true;
    setActionsReady(false);
    els.error.textContent = '';
    els.status.textContent = 'PLEASE WAIT...';
    resetContactLinks();

    try {
      const callable = firebase.app().functions('asia-southeast1').httpsCallable('revealApplicantContact');
      const res = await callable({ applicationId: applicationId });
      if (seq !== revealSeq) return;
      const phone = res && res.data && res.data.phoneNumber ? String(res.data.phoneNumber).trim() : '';
      if (!phone) {
        els.status.textContent = '';
        els.error.textContent = 'This worker has no contact number on file yet.';
        return;
      }
      // Populate launch links without ever rendering the number as text.
      const digits = phone.replace(/[^\d]/g, '');
      const greeting = encodeURIComponent(CONTACT_GREETING);
      els.call.setAttribute('href', 'tel:' + phone);
      els.text.setAttribute('href', 'sms:' + phone + '?body=' + greeting);
      els.whatsapp.setAttribute('href', 'https://wa.me/' + digits + '?text=' + greeting);
      els.viber.setAttribute('href', 'viber://chat?number=' + encodeURIComponent(phone));
      if (els.viberHint) els.viberHint.style.display = 'none';
      els.status.textContent = '';
      els.error.textContent = '';
      setActionsReady(true);
    } catch (err) {
      if (seq !== revealSeq) return;
      console.warn('\u26A0\uFE0F revealApplicantContact failed:', (err && err.code) || err);
      els.status.textContent = '';
      els.error.textContent = mapError(err);
      setActionsReady(false);
    } finally {
      if (seq === revealSeq) revealInFlight = false;
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

    // Invalidate any in-flight reveal before resetting UI/links (avoids a brief
    // window where a late response could re-arm the previous applicant's number).
    revealSeq += 1;
    revealInFlight = false;
    clearViberDetect();

    els.title.textContent = userName ? ('Contact ' + userName) : 'Contact Worker';
    els.error.textContent = '';
    els.status.textContent = '';
    currentLang = 'english';
    renderLang();
    resetContactLinks();
    setActionsReady(false);
    els.overlay.classList.add('show');
    revealContact(applicationId);
  }

  window.startDirectContactReveal = startDirectContactReveal;
})();
