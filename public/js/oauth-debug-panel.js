// On-page OAuth debug log for mobile troubleshooting.
// Enable: add ?oauth_debug=1 to the URL (persists across redirect return).
// Or long-press the LOGIN / CREATE ACCOUNT page title for 2 seconds.
(function() {
  const ENABLED_KEY = 'gisugo_oauth_debug';
  const LOG_KEY = 'gisugo_auth_debug_log';

  function isEnabled() {
    try {
      if (new URLSearchParams(window.location.search).get('oauth_debug') === '1') {
        sessionStorage.setItem(ENABLED_KEY, '1');
        return true;
      }
      return sessionStorage.getItem(ENABLED_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function readLog() {
    try {
      const raw = sessionStorage.getItem(LOG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function formatEntry(entry) {
    const time = entry.t ? new Date(entry.t).toLocaleTimeString() : '';
    const detail = entry.detail ? ' — ' + entry.detail : '';
    return (time ? time + ' ' : '') + entry.msg + detail;
  }

  function ensureFab() {
    if (document.getElementById('gisugoAuthDebugFab')) return;
    const fab = document.createElement('button');
    fab.id = 'gisugoAuthDebugFab';
    fab.type = 'button';
    fab.textContent = 'Log';
    fab.setAttribute('aria-label', 'Show OAuth debug log');
    fab.style.cssText = [
      'position:fixed;top:12px;right:12px;z-index:100002;',
      'padding:8px 12px;border:0;border-radius:999px;',
      'background:#f5a623;color:#111;font:700 12px/1 sans-serif;',
      'box-shadow:0 2px 10px rgba(0,0,0,.35);'
    ].join('');
    fab.addEventListener('click', function() {
      try { sessionStorage.setItem(ENABLED_KEY, '1'); } catch (e) {}
      renderPanel();
    });
    document.body.appendChild(fab);
  }

  function ensurePanel() {
    if (document.getElementById('gisugoAuthDebugPanel')) return;

    const style = document.createElement('style');
    style.textContent = [
      '#gisugoAuthDebugPanel{position:fixed;left:0;right:0;bottom:0;z-index:99999;',
      'max-height:42vh;background:#111;color:#e8e8e8;font:12px/1.4 monospace;',
      'border-top:2px solid #f5a623;box-shadow:0 -4px 20px rgba(0,0,0,.45);}',
      '#gisugoAuthDebugPanel .auth-debug-head{display:flex;align-items:center;gap:8px;padding:8px 10px;',
      'background:#1b1b1b;border-bottom:1px solid #333;}',
      '#gisugoAuthDebugPanel .auth-debug-title{flex:1;font-weight:700;color:#f5a623;}',
      '#gisugoAuthDebugPanel button{background:#333;color:#fff;border:0;border-radius:4px;padding:6px 10px;}',
      '#gisugoAuthDebugPanel .auth-debug-body{margin:0;padding:8px 10px;overflow:auto;max-height:34vh;white-space:pre-wrap;}'
    ].join('');
    document.head.appendChild(style);

    const panel = document.createElement('div');
    panel.id = 'gisugoAuthDebugPanel';
    panel.innerHTML = [
      '<div class="auth-debug-head">',
      '<span class="auth-debug-title">OAuth debug</span>',
      '<button type="button" id="gisugoAuthDebugCopy">Copy</button>',
      '<button type="button" id="gisugoAuthDebugHide">Hide</button>',
      '</div>',
      '<pre class="auth-debug-body" id="gisugoAuthDebugBody"></pre>'
    ].join('');
    document.body.appendChild(panel);

    document.getElementById('gisugoAuthDebugHide').addEventListener('click', function() {
      panel.style.display = 'none';
    });
    document.getElementById('gisugoAuthDebugCopy').addEventListener('click', function() {
      const text = document.getElementById('gisugoAuthDebugBody').textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function() {});
      }
    });
  }

  function renderPanel() {
    if (!isEnabled()) return;
    ensurePanel();
    const panel = document.getElementById('gisugoAuthDebugPanel');
    const body = document.getElementById('gisugoAuthDebugBody');
    if (!panel || !body) return;
    panel.style.display = 'block';
    const lines = readLog().map(formatEntry);
    body.textContent = lines.length ? lines.join('\n') : '(no auth log yet)';
    body.scrollTop = body.scrollHeight;
  }

  window.__gisugoRenderAuthDebugPanel = renderPanel;

  function bindLongPress(el) {
    if (!el) return;
    let timer = null;
    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    el.addEventListener('touchstart', function() {
      clear();
      timer = setTimeout(function() {
        try { sessionStorage.setItem(ENABLED_KEY, '1'); } catch (e) {}
        renderPanel();
      }, 2000);
    }, { passive: true });
    el.addEventListener('touchend', clear);
    el.addEventListener('touchmove', clear);
    el.addEventListener('touchcancel', clear);
  }

  document.addEventListener('DOMContentLoaded', function() {
    ensureFab();
    if (isEnabled()) renderPanel();
    try {
      if (sessionStorage.getItem('gisugo_oauth_pending') === '1') {
        sessionStorage.setItem(ENABLED_KEY, '1');
        renderPanel();
      }
    } catch (e) {}
    bindLongPress(document.getElementById('loginHeaderTitle'));
    bindLongPress(document.getElementById('signupHeaderTitle'));
    window.addEventListener('gisugo-auth-log', renderPanel);
  });
})();
