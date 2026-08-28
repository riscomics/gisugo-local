// Public Phase 11 keeper UI: tech-difficulties banner + maintenance cover.
// Never runs a cover on login or the admin dashboard. Fail-open if policy
// cannot be read (getPublicPlatformPolicy already fails open).

(function applyPublicPlatformPolicyUi() {
  const page = String(window.location.pathname.split('/').pop() || '').toLowerCase();
  if (page === 'login.html' || page === 'admin-dashboard.html') return;

  function waitForPolicyReader(attempts) {
    if (typeof getPublicPlatformPolicy === 'function') {
      return getPublicPlatformPolicy();
    }
    if (attempts <= 0) return Promise.resolve(null);
    return new Promise((resolve) => {
      setTimeout(() => resolve(waitForPolicyReader(attempts - 1)), 200);
    });
  }

  function showTechWarning(policy) {
    if (!policy.techDifficulties) return;
    const title = String(policy.techWarningTitle || 'Technical difficulties').trim();
    const message = String(policy.techWarningMessage || 'Some features may be temporarily unavailable. Please try again shortly.').trim();
    const eta = String(policy.techWarningEta || '').trim();
    const dismissKey = `gisugo_tech_warning:${title}|${message}|${eta}`;
    try {
      if (sessionStorage.getItem(dismissKey) === '1') return;
    } catch (_) {}

    const existing = document.getElementById('gisugoTechWarningBanner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.id = 'gisugoTechWarningBanner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
      'position:fixed',
      'left:12px',
      'right:12px',
      'top:50%',
      'transform:translateY(-50%)',
      'z-index:99980',
      'background:#78350f',
      'color:#fffbeb',
      'border:1px solid #f59e0b',
      'border-radius:12px',
      'padding:12px 14px',
      'box-shadow:0 10px 30px rgba(0,0,0,0.35)',
      'font-family:Arial,Helvetica,sans-serif'
    ].join(';');
    banner.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="font-size:22px;line-height:1;">⚠️</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:800;margin-bottom:4px;">${escapeHtml(title)}</div>
          <div style="font-size:14px;line-height:1.4;">${escapeHtml(message)}</div>
          ${eta ? `<div style="margin-top:6px;font-size:12px;opacity:0.85;">Expected: ${escapeHtml(eta)}</div>` : ''}
        </div>
        <button type="button" id="gisugoTechWarningDismiss" style="background:transparent;border:0;color:#fffbeb;font-size:22px;line-height:1;cursor:pointer;">×</button>
      </div>
    `;
    document.body.appendChild(banner);
    const dismissBtn = document.getElementById('gisugoTechWarningDismiss');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        try { sessionStorage.setItem(dismissKey, '1'); } catch (_) {}
        banner.remove();
      });
    }
  }

  function showMaintenanceCover(policy) {
    if (!policy.maintenanceMode) return;
    if (document.getElementById('gisugoMaintenanceCover')) return;

    const title = String(policy.maintenanceTitle || 'Scheduled maintenance').trim();
    const message = String(policy.maintenanceMessage || 'GISUGO is briefly unavailable while we finish an update.').trim();
    const resume = String(policy.maintenanceResumeTime || policy.maintenanceEndTime || '').trim();
    const contact = String(policy.maintenanceContact || '').trim();

    const cover = document.createElement('div');
    cover.id = 'gisugoMaintenanceCover';
    cover.setAttribute('role', 'alertdialog');
    cover.setAttribute('aria-modal', 'true');
    cover.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:100000',
      'background:rgba(2,6,23,0.94)',
      'color:#e5e7eb',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:24px',
      'font-family:Arial,Helvetica,sans-serif'
    ].join(';');
    cover.innerHTML = `
      <div style="width:min(520px,100%);background:#111827;border:1px solid #10b981;border-radius:16px;padding:28px 22px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.45);">
        <div style="font-size:36px;margin-bottom:10px;">🛠️</div>
        <h1 style="margin:0 0 10px;font-size:24px;color:#fff;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 14px;line-height:1.5;">${escapeHtml(message)}</p>
        ${resume ? `<p style="margin:0 0 8px;color:#6ee7b7;font-weight:700;">Expected back: ${escapeHtml(formatResume(resume))}</p>` : ''}
        ${contact ? `<p style="margin:12px 0 0;font-size:13px;opacity:0.8;">${escapeHtml(contact)}</p>` : ''}
      </div>
    `;
    document.body.appendChild(cover);
    document.body.style.overflow = 'hidden';
  }

  function formatResume(value) {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate.toLocaleString();
    }
    return value;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  waitForPolicyReader(25).then((policy) => {
    if (!policy) return;
    showMaintenanceCover(policy);
    if (!policy.maintenanceMode) showTechWarning(policy);
  }).catch(() => {});
})();
