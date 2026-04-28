// ========================== DYNAMIC JOB PAGE FUNCTIONALITY ==========================

// Memory leak prevention - Cleanup registry for event listeners and timers
const DYNAMIC_JOB_CLEANUP_REGISTRY = {
  timeouts: new Set(),
  intervals: new Set(),
  eventListeners: new Set(),
  
  addTimeout: function(timeoutId) {
    this.timeouts.add(timeoutId);
  },
  
  addInterval: function(intervalId) {
    this.intervals.add(intervalId);
  },
  
  addEventListener: function(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    this.eventListeners.add({ element, event, handler, options });
  },
  
  cleanup: function() {
    // Clear timeouts
    this.timeouts.forEach(id => clearTimeout(id));
    this.timeouts.clear();
    
    // Clear intervals
    this.intervals.forEach(id => clearInterval(id));
    this.intervals.clear();
    
    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      if (element && element.removeEventListener) {
        element.removeEventListener(event, handler, options);
      }
    });
    this.eventListeners.clear();
    
    console.log('🧹 Dynamic job page cleanup completed');
  }
};

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  DYNAMIC_JOB_CLEANUP_REGISTRY.cleanup();
});
window.addEventListener('pagehide', function() {
  DYNAMIC_JOB_CLEANUP_REGISTRY.cleanup();
});

const DYNAMIC_JOB_FETCH_TIMEOUT_MS = 15000;
let ACTIVE_JOB_LOAD_TOKEN = 0;
const DYNAMIC_REPORT_MODAL_STATE = {
  resolver: null
};
const REPORT_MODAL_CONTEXT = {
  jobTitle: 'this gig'
};
let ACTIVE_REPORT_LANG = 'english';
const REPORT_GIG_TRANSLATIONS = {
  english: {
    header: 'Report Gig',
    subtitle: (jobTitle) => `Send a moderation report for "${jobTitle}"`,
    subjectLabel: 'Report subject',
    subjectPlaceholder: 'Select a reason',
    messagePlaceholder: 'Describe why this gig should be reviewed...',
    sendBtn: 'Submit Report',
    cancelBtn: 'Cancel',
    subjects: {
      inappropriate_content: 'Inappropriate content',
      scam_fraud: 'Scam/Fraud',
      misleading_info: 'Misleading info',
      duplicate_post: 'Duplicate post',
      other_reasons: 'Other reasons'
    }
  },
  tagalog: {
    header: 'I-report ang Gig',
    subtitle: (jobTitle) => `Magpadala ng ulat para sa "${jobTitle}" sa Admin para masuri`,
    subjectLabel: 'Paksa ng ulat',
    subjectPlaceholder: 'Pumili ng dahilan',
    messagePlaceholder: 'Ilarawan kung bakit dapat i-review ang gig na ito...',
    sendBtn: 'Ipasa ang Ulat',
    cancelBtn: 'Kanselahin',
    subjects: {
      inappropriate_content: 'Hindi angkop na nilalaman',
      scam_fraud: 'Scam/Panloloko',
      misleading_info: 'Maling impormasyon',
      duplicate_post: 'Dobleng post',
      other_reasons: 'Iba pang dahilan'
    }
  },
  bisaya: {
    header: 'I-report ang Gig',
    subtitle: (jobTitle) => `Ipadala ang report para sa "${jobTitle}" ngadto sa Admin aron mareview`,
    subjectLabel: 'Ulohan sa report',
    subjectPlaceholder: 'Pili og rason',
    messagePlaceholder: 'Isaysay ngano nga kinahanglan i-review kining gig...',
    sendBtn: 'Isumite ang Report',
    cancelBtn: 'Kansela',
    subjects: {
      inappropriate_content: 'Dili angay nga sulod',
      scam_fraud: 'Scam/Panikas',
      misleading_info: 'Makalibog nga impormasyon',
      duplicate_post: 'Parehas nga post',
      other_reasons: 'Ubang rason'
    }
  }
};
const DYNAMIC_JOB_INITIAL_FETCH_TIMEOUT_MS = (() => {
  try {
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    // iOS cold-start Firestore reads can take longer; avoid false "Error Loading Job".
    return isIOS ? 32000 : 12000;
  } catch (_) {
    return 12000;
  }
})();

function isIOSWebKitBrowserForDataPath() {
  try {
    const ua = navigator.userAgent || '';
    return /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  } catch (_) {
    return false;
  }
}

function getReportTranslationPack(langKey) {
  const safeLang = String(langKey || '').trim().toLowerCase();
  return REPORT_GIG_TRANSLATIONS[safeLang] || REPORT_GIG_TRANSLATIONS.english;
}

function applyReportGigLanguage(langKey) {
  const safeLang = String(langKey || '').trim().toLowerCase();
  if (!REPORT_GIG_TRANSLATIONS[safeLang]) {
    ACTIVE_REPORT_LANG = 'english';
  } else {
    ACTIVE_REPORT_LANG = safeLang;
  }
  const pack = getReportTranslationPack(ACTIVE_REPORT_LANG);
  const jobTitle = String(REPORT_MODAL_CONTEXT.jobTitle || 'this gig').trim() || 'this gig';

  const header = document.getElementById('contactChatHeader');
  const subtitle = document.getElementById('contactChatSubtitle');
  const subjectLabel = document.querySelector('label[for="contactChatSubject"]');
  const subjectInput = document.getElementById('contactChatSubject');
  const messageInput = document.getElementById('contactChatMessage');
  const sendBtn = document.getElementById('contactChatSendBtn');
  const cancelBtn = document.getElementById('contactChatCancelBtn');

  if (header) header.textContent = pack.header;
  if (subtitle) subtitle.textContent = pack.subtitle(jobTitle);
  if (subjectLabel) subjectLabel.textContent = pack.subjectLabel;
  if (messageInput) messageInput.placeholder = pack.messagePlaceholder;
  if (sendBtn) sendBtn.textContent = pack.sendBtn;
  if (cancelBtn) cancelBtn.textContent = pack.cancelBtn;

  if (subjectInput) {
    const currentValue = String(subjectInput.value || '').trim();
    const options = [
      { value: '', label: pack.subjectPlaceholder },
      { value: 'inappropriate_content', label: pack.subjects.inappropriate_content },
      { value: 'scam_fraud', label: pack.subjects.scam_fraud },
      { value: 'misleading_info', label: pack.subjects.misleading_info },
      { value: 'duplicate_post', label: pack.subjects.duplicate_post },
      { value: 'other_reasons', label: pack.subjects.other_reasons }
    ];
    subjectInput.innerHTML = options.map((item) => (
      `<option value="${item.value}">${item.label}</option>`
    )).join('');
    if (currentValue && options.some((item) => item.value === currentValue)) {
      subjectInput.value = currentValue;
    } else {
      subjectInput.value = '';
    }
  }

  document.querySelectorAll('#reportLangTabs .report-lang-tab').forEach((tab) => {
    const tabLang = String(tab.getAttribute('data-lang') || '').toLowerCase();
    tab.classList.toggle('active', tabLang === ACTIVE_REPORT_LANG);
  });
}

function initializeReportGigLanguageTabs() {
  const tabContainer = document.getElementById('reportLangTabs');
  if (!tabContainer) return;

  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(tabContainer, 'click', (event) => {
    const tab = event.target.closest('.report-lang-tab');
    if (!tab) return;
    event.preventDefault();
    const nextLang = String(tab.getAttribute('data-lang') || '').trim().toLowerCase();
    if (!nextLang) return;
    applyReportGigLanguage(nextLang);
  });

  applyReportGigLanguage(ACTIVE_REPORT_LANG);
}

function getProjectIdForFirestoreRest() {
  try {
    if (window.firebaseConfig && window.firebaseConfig.projectId) {
      return String(window.firebaseConfig.projectId).trim();
    }
    if (typeof firebase !== 'undefined' && firebase.app && typeof firebase.app === 'function') {
      const app = firebase.app();
      if (app && app.options && app.options.projectId) {
        return String(app.options.projectId).trim();
      }
    }
  } catch (_) {
    // fall through
  }
  return '';
}

function decodeFirestoreValue(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Object.prototype.hasOwnProperty.call(raw, 'stringValue')) return raw.stringValue;
  if (Object.prototype.hasOwnProperty.call(raw, 'integerValue')) return Number(raw.integerValue);
  if (Object.prototype.hasOwnProperty.call(raw, 'doubleValue')) return Number(raw.doubleValue);
  if (Object.prototype.hasOwnProperty.call(raw, 'booleanValue')) return raw.booleanValue === true;
  if (Object.prototype.hasOwnProperty.call(raw, 'timestampValue')) return raw.timestampValue;
  if (Object.prototype.hasOwnProperty.call(raw, 'nullValue')) return null;
  if (raw.arrayValue && Array.isArray(raw.arrayValue.values)) {
    return raw.arrayValue.values.map((entry) => decodeFirestoreValue(entry));
  }
  if (raw.mapValue && raw.mapValue.fields && typeof raw.mapValue.fields === 'object') {
    const mapped = {};
    Object.entries(raw.mapValue.fields).forEach(([key, value]) => {
      mapped[key] = decodeFirestoreValue(value);
    });
    return mapped;
  }
  return null;
}

function mapFirestoreRestDoc(rawDoc) {
  if (!rawDoc || !rawDoc.name) return null;
  const fields = rawDoc.fields || {};
  const mapped = {
    id: String(rawDoc.name).split('/').pop(),
    jobId: String(rawDoc.name).split('/').pop()
  };
  Object.entries(fields).forEach(([key, value]) => {
    mapped[key] = decodeFirestoreValue(value);
  });
  return mapped;
}

async function fetchJobByIdViaFirestoreRest(jobId) {
  const projectId = getProjectIdForFirestoreRest();
  if (!projectId) throw new Error('Missing projectId for Firestore REST fallback');
  const safeJobId = String(jobId || '').trim();
  if (!safeJobId) return null;
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/jobs/${encodeURIComponent(safeJobId)}`;
  const response = await fetch(endpoint, { method: 'GET' });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`REST job fetch failed (${response.status})`);
  }
  const raw = await response.json();
  return mapFirestoreRestDoc(raw);
}

const DYNAMIC_JOB_TRACE_STATE = {
  ready: false,
  maxLines: 18,
  collapsed: false
};

function dynamicTraceIsEnabled() {
  return isIOSWebKitBrowserForDataPath();
}

function ensureDynamicTraceOverlay() {
  if (!dynamicTraceIsEnabled()) return null;
  let panel = document.getElementById('dynamicJobIosTracePanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'dynamicJobIosTracePanel';
    panel.style.cssText = [
      'position:fixed',
      'left:8px',
      'right:8px',
      'bottom:46px',
      'max-height:30vh',
      'overflow:auto',
      'padding:8px',
      'border:1px solid rgba(255,255,255,0.28)',
      'border-radius:10px',
      'background:rgba(5,8,20,0.90)',
      'color:#d8f5ff',
      'font:11px/1.35 monospace',
      'letter-spacing:0.1px',
      'z-index:2147483647',
      'white-space:pre-wrap',
      'word-break:break-word',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(panel);
  }

  let toggleBtn = document.getElementById('dynamicJobIosTraceToggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'dynamicJobIosTraceToggle';
    toggleBtn.type = 'button';
    toggleBtn.textContent = 'TRACE HIDE';
    toggleBtn.style.cssText = [
      'position:fixed',
      'right:8px',
      'bottom:8px',
      'height:32px',
      'padding:0 10px',
      'border:1px solid rgba(255,255,255,0.35)',
      'border-radius:8px',
      'background:rgba(10,20,35,0.95)',
      'color:#d8f5ff',
      'font:600 11px/1 monospace',
      'z-index:2147483647',
      'pointer-events:auto'
    ].join(';');
    toggleBtn.addEventListener('click', () => {
      DYNAMIC_JOB_TRACE_STATE.collapsed = !DYNAMIC_JOB_TRACE_STATE.collapsed;
      panel.style.display = DYNAMIC_JOB_TRACE_STATE.collapsed ? 'none' : 'block';
      toggleBtn.textContent = DYNAMIC_JOB_TRACE_STATE.collapsed ? 'TRACE SHOW' : 'TRACE HIDE';
    });
    document.body.appendChild(toggleBtn);
  }

  panel.style.display = DYNAMIC_JOB_TRACE_STATE.collapsed ? 'none' : 'block';
  return panel;
}

function dynamicTrace(event, details) {
  if (!dynamicTraceIsEnabled()) return;
  const panel = ensureDynamicTraceOverlay();
  if (!panel) return;
  const time = new Date().toISOString().slice(11, 19);
  const detailText = details === undefined
    ? ''
    : (typeof details === 'string' ? details : JSON.stringify(details));
  const line = `[${time}] ${event}${detailText ? ` | ${detailText}` : ''}`;
  const rows = panel.textContent ? panel.textContent.split('\n') : [];
  rows.push(line);
  if (rows.length > DYNAMIC_JOB_TRACE_STATE.maxLines) {
    rows.splice(0, rows.length - DYNAMIC_JOB_TRACE_STATE.maxLines);
  }
  panel.textContent = rows.join('\n');
  panel.scrollTop = panel.scrollHeight;
}

function setApplyButtonSyncState(applyBtn, isSyncing) {
  if (!applyBtn) return;
  const span = applyBtn.querySelector('span');
  if (isSyncing) {
    applyBtn.disabled = true;
    applyBtn.style.opacity = '0.75';
    applyBtn.style.cursor = 'wait';
    if (span) span.textContent = 'SYNCING STATUS...';
    applyBtn.title = 'Checking your latest application status...';
  } else {
    if (span && span.textContent === 'SYNCING STATUS...') {
      span.textContent = 'APPLY TO GIG';
      applyBtn.title = '';
      applyBtn.disabled = false;
      applyBtn.style.opacity = '1';
      applyBtn.style.cursor = 'pointer';
      applyBtn.style.backgroundColor = '';
    }
  }
}

function withDynamicJobTimeout(promise, label, timeoutMs = DYNAMIC_JOB_FETCH_TIMEOUT_MS) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function isAllowedTextCharacter(char) {
  if (!char) return true;
  if (/[\p{L}\p{N}\p{M}\p{Zs}\r\n]/u.test(char)) return true;
  if (/[.,!?'"()\/$&@₱-]/.test(char)) return true;
  if (/[’‘]/.test(char)) return true;
  if (/[\p{Extended_Pictographic}\u200D\uFE0F]/u.test(char)) return true;
  return false;
}

function sanitizeTextInput(value) {
  return Array.from(String(value || ''))
    .filter(isAllowedTextCharacter)
    .join('');
}

function hasUnsupportedTextChars(value) {
  return Array.from(String(value || ''))
    .some((char) => !isAllowedTextCharacter(char));
}

function showInputGuide(message) {
  let hint = document.getElementById('dynamicInputHint');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'dynamicInputHint';
    hint.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(88vw, 360px);
      padding: 8px;
      border-radius: 16px;
      background: repeating-linear-gradient(
        135deg,
        #facc15 0 10px,
        #111827 10px 20px
      );
      color: #fee2e2;
      text-align: center;
      box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.55), 0 20px 40px rgba(0,0,0,0.45);
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      overflow: hidden;
    `;
    document.body.appendChild(hint);
  }

  hint.innerHTML = `
    <div style="background:linear-gradient(180deg, rgba(127, 29, 29, 0.98), rgba(69, 10, 10, 0.98)); border:1px solid rgba(248,113,113,0.7); border-radius:12px; padding:12px 14px 14px;">
      <div style="font-size:30px; line-height:1; margin-bottom:6px;">🚨</div>
      <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; margin-bottom:8px;">SECURITY ALERT</div>
      <div style="font-size:14px; font-weight:600; line-height:1.38;">
        ${message}
      </div>
    </div>
  `;
  hint.style.opacity = '1';
  hint.style.transform = 'translate(-50%, -50%) scale(1)';
  clearTimeout(window.__dynamicInputHintTimer);
  window.__dynamicInputHintTimer = setTimeout(() => {
    hint.style.opacity = '0';
    hint.style.transform = 'translate(-50%, -50%) scale(0.98)';
  }, 3200);
}

function blockUnsupportedCharsForInput(inputEl) {
  if (!inputEl || inputEl.dataset.markupCharsBlocked === 'true') return;
  inputEl.dataset.markupCharsBlocked = 'true';

  const showGuideOnce = () => {
    const now = Date.now();
    const lastShownAt = Number(inputEl.dataset.inputGuideShownAt || 0);
    if (now - lastShownAt < 1500) return;
    inputEl.dataset.inputGuideShownAt = String(now);
    showInputGuide('Only letters, numbers, emojis, spaces, and basic punctuation are allowed.');
  };

  const keydownHandler = function(e) {
    if (e.key.length === 1 && !isAllowedTextCharacter(e.key)) {
      e.preventDefault();
      showGuideOnce();
    }
  };

  const pasteHandler = function(e) {
    const pastedText = e.clipboardData ? e.clipboardData.getData('text') : '';
    if (!hasUnsupportedTextChars(pastedText)) return;
    e.preventDefault();
    showGuideOnce();
    const cleaned = sanitizeTextInput(pastedText);
    const start = inputEl.selectionStart == null ? inputEl.value.length : inputEl.selectionStart;
    const end = inputEl.selectionEnd == null ? inputEl.value.length : inputEl.selectionEnd;
    inputEl.setRangeText(cleaned, start, end, 'end');
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const inputHandler = function() {
    const sanitized = sanitizeTextInput(inputEl.value);
    if (sanitized !== inputEl.value) {
      inputEl.value = sanitized;
      showGuideOnce();
    }
  };

  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(inputEl, 'keydown', keydownHandler);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(inputEl, 'paste', pasteHandler);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(inputEl, 'input', inputHandler);
}

// Category configuration for extras
const extrasConfig = {
  hatod: {
    field1: { label: "Pickup at:" },
    field2: { label: "Deliver to:" }
  },
  hakot: {
    field1: { label: "Load at:" },
    field2: { label: "Unload at:" }
  },
  kompra: {
    field1: { label: "Shop at:" },
    field2: { label: "Deliver to:" }
  },
  luto: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  hugas: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  laba: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  limpyo: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  tindera: {
    field1: { label: "Location:" },
    field2: { label: "Product:" }
  },
  bantay: {
    field1: { label: "Location:" },
    field2: { label: "Shift:" }
  },
  painter: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  carpenter: {
    field1: { label: "Location:" },
    field2: { label: "Materials:" }
  },
  plumber: {
    field1: { label: "Location:" },
    field2: { label: "Materials:" }
  },
  security: {
    field1: { label: "Location:" },
    field2: { label: "Shift:" }
  },
  driver: {
    field1: { label: "Location:" },
    field2: { label: "Location:" }
  },
  tutor: {
    field1: { label: "Location:" },
    field2: { label: "Subject:" }
  },
  clerical: {
    field1: { label: "Location:" },
    field2: { label: "Position:" }
  },
  builder: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  reception: {
    field1: { label: "Location:" },
    field2: { label: "Supplies:" }
  },
  nurse: {
    field1: { label: "Location:" },
    field2: { label: "Specialty:" }
  },
  doctor: {
    field1: { label: "Location:" },
    field2: { label: "Specialty:" }
  },
  lawyer: {
    field1: { label: "Location:" },
    field2: { label: "Practice:" }
  },
  mechanic: {
    field1: { label: "Location:" },
    field2: { label: "Vehicle:" }
  },
  electrician: {
    field1: { label: "Location:" },
    field2: { label: "Materials:" }
  },
  tailor: {
    field1: { label: "Location:" },
    field2: { label: "Garment:" }
  }
};

function getUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawId = urlParams.get('jobId') || urlParams.get('jobNumber');
  return {
    category: (urlParams.get('category') || '').trim().toLowerCase(),
    jobId: String(rawId || '').trim()
  };
}

function isActiveJobLoad(token) {
  return token === ACTIVE_JOB_LOAD_TOKEN;
}

function resolveStrictFirestore() {
  if (typeof getFirestore === 'function') {
    return getFirestore();
  }
  if (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') {
    try {
      return firebase.firestore();
    } catch (error) {
      console.warn('⚠️ Could not access firebase.firestore():', error);
    }
  }
  return null;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFirestoreReady(maxWaitMs = 8000) {
  const start = Date.now();
  while ((Date.now() - start) < maxWaitMs) {
    const db = resolveStrictFirestore();
    if (db) return db;
    await delay(160);
  }
  return resolveStrictFirestore();
}

async function fetchStrictJobById(jobId, dbInstance = null) {
  const db = dbInstance || resolveStrictFirestore();
  if (!db) {
    throw new Error('Firestore is unavailable');
  }
  const safeJobId = String(jobId || '').trim();
  if (!safeJobId) return null;
  const useRestPrimary = isIOSWebKitBrowserForDataPath();
  dynamicTrace('fetch:mode', { restPrimary: useRestPrimary });
  if (useRestPrimary) {
    try {
      dynamicTrace('fetch:rest:start', { jobId: safeJobId });
      const restDoc = await withDynamicJobTimeout(fetchJobByIdViaFirestoreRest(safeJobId), 'doc.get(rest)', 12000);
      if (restDoc) {
        dynamicTrace('fetch:rest:done', { exists: true });
        return restDoc;
      }
      dynamicTrace('fetch:rest:done', { exists: false });
    } catch (restError) {
      dynamicTrace('fetch:rest:error', (restError && restError.message) ? restError.message : String(restError));
    }
  }
  const docRef = db.collection('jobs').doc(safeJobId);
  const ua = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let doc = null;
  if (isIOS) {
    // Prefer server read first on iOS to bypass stale/empty cold cache snapshots.
    try {
      dynamicTrace('fetch:server:start', { jobId: safeJobId });
      doc = await withDynamicJobTimeout(docRef.get({ source: 'server' }), 'doc.get(server)', 14000);
      dynamicTrace('fetch:server:done', { exists: !!(doc && doc.exists) });
    } catch (serverError) {
      dynamicTrace('fetch:server:error', (serverError && serverError.message) ? serverError.message : String(serverError));
      console.warn('⚠️ iOS server-first read failed, trying default read:', serverError);
    }
    if (!doc || !doc.exists) {
      dynamicTrace('fetch:default:start', { jobId: safeJobId });
      doc = await withDynamicJobTimeout(docRef.get(), 'doc.get(default)', 10000);
      dynamicTrace('fetch:default:done', { exists: !!(doc && doc.exists) });
    }
  } else {
    doc = await withDynamicJobTimeout(docRef.get(), 'doc.get(default)', 10000);
    if (!doc || !doc.exists) {
      try {
        const serverDoc = await withDynamicJobTimeout(docRef.get({ source: 'server' }), 'doc.get(server)', 7000);
        if (serverDoc && serverDoc.exists) {
          doc = serverDoc;
        }
      } catch (serverError) {
        console.warn('⚠️ server retry skipped/failed:', serverError);
      }
    }
  }

  if (!doc || !doc.exists) return null;
  return {
    id: doc.id,
    jobId: doc.id,
    ...doc.data()
  };
}

function isTransientFirestoreError(error) {
  const code = String(error?.code || '').toLowerCase();
  if (code === 'unavailable' || code === 'deadline-exceeded' || code === 'aborted' || code === 'failed-precondition') {
    return true;
  }
  const message = String(error?.message || '').toLowerCase();
  return message.includes('network') || message.includes('offline') || message.includes('timeout');
}

async function fetchStrictJobByIdWithRetry(jobId, dbInstance = null, attempts = 4) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const job = await fetchStrictJobById(jobId, dbInstance);
      if (job) return job;
      if (attempt < attempts) {
        await delay(220 * attempt);
      }
    } catch (error) {
      lastError = error;
      if (!isTransientFirestoreError(error) || attempt >= attempts) {
        throw error;
      }
      console.warn(`⚠️ Strict job fetch transient failure ${attempt}/${attempts}; retrying`, error);
      await delay(280 * attempt);
    }
  }
  if (lastError) throw lastError;
  return null;
}

async function loadJobData() {
  const loadToken = ++ACTIVE_JOB_LOAD_TOKEN;
  // Show loading overlay
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
  }
  
  let hasRenderedCore = false;
  try {
    const { category, jobId } = getUrlParameters();
    dynamicTrace('load:start', { category, jobId });
    if (!category || !jobId) {
      dynamicTrace('load:url:error', 'missing category/jobId');
      showErrorMessage('Invalid job URL. Missing category or job ID.');
      return;
    }
    console.log(`🔍 Loading job data for category: ${category}, jobId: ${jobId}`);
    const firestore = await waitForFirestoreReady();
    dynamicTrace('firestore:ready', { ready: !!firestore });
    if (!firestore) {
      throw new Error('Firestore client not ready');
    }
    const jobDoc = await withDynamicJobTimeout(
      fetchStrictJobByIdWithRetry(jobId, firestore),
      `fetchStrictJobById(${jobId})`,
      DYNAMIC_JOB_INITIAL_FETCH_TIMEOUT_MS
    );
    if (!isActiveJobLoad(loadToken)) return;
    if (!jobDoc) {
      dynamicTrace('fetch:result', 'not_found');
      showErrorMessage('Job not found. This job may have been removed or does not exist.');
      return;
    }

    const job = normalizeFirebaseJob(jobDoc);
    dynamicTrace('fetch:result', { id: job.id || job.jobId, hasPhoto: !!(job.thumbnail || job.photo) });
    populateJobPage(job);
    dynamicTrace('render:core:ok');
    hasRenderedCore = true;

    const applyBtn = document.getElementById('jobApplyBtn');
    const currentUser = firebase.auth ? firebase.auth().currentUser : null;
    const postRenderTasks = [];
    if (['completed', 'hired', 'accepted'].includes(job.status) && applyBtn) {
      applyBtn.style.display = 'none';
    } else if (currentUser && job.posterId === currentUser.uid && applyBtn) {
      applyBtn.disabled = true;
      applyBtn.style.opacity = '0.5';
      applyBtn.style.cursor = 'not-allowed';
      applyBtn.style.backgroundColor = '';
      const span = applyBtn.querySelector('span');
      if (span) span.textContent = 'YOUR GIG';
      applyBtn.title = 'This is your own gig';
    } else {
      setApplyButtonSyncState(applyBtn, true);
      postRenderTasks.push(
        withDynamicJobTimeout(checkIfUserAlreadyApplied(jobId), 'checkIfUserAlreadyApplied', 4500)
          .then(() => {
            setApplyButtonSyncState(applyBtn, false);
          })
          .catch((error) => {
            setApplyButtonSyncState(applyBtn, false);
            dynamicTrace('post:applyCheck:timeout', (error && error.message) ? error.message : String(error));
          })
      );
    }

    // Customer section enrichment should not block primary page render.
    postRenderTasks.push(
      withDynamicJobTimeout(loadCustomerRating(job.posterId), 'loadCustomerRating', 6000)
        .catch((error) => {
          dynamicTrace('post:customerRating:timeout', (error && error.message) ? error.message : String(error));
        })
    );

    Promise.allSettled(postRenderTasks).then(() => {
      dynamicTrace('render:complete');
    });
    if (!isActiveJobLoad(loadToken)) return;
  } catch (unexpectedError) {
    console.error('❌ Unexpected error in loadJobData:', unexpectedError);
    dynamicTrace('load:crash', (unexpectedError && unexpectedError.message) ? unexpectedError.message : String(unexpectedError));
    if (!hasRenderedCore && isActiveJobLoad(loadToken)) {
      showErrorMessage('Failed to load job. Please refresh the page.');
    }
  } finally {
    if (loadingOverlay && isActiveJobLoad(loadToken)) {
      loadingOverlay.classList.remove('show');
      console.log('✅ Loading overlay hidden');
    }
  }
}

// Normalize Firebase job data to match expected format
function normalizeFirebaseJob(job) {
  // Convert Firestore Timestamp to date string (local timezone)
  let scheduledDate = job.scheduledDate;
  if (job.scheduledDate && typeof job.scheduledDate.toDate === 'function') {
    const d = job.scheduledDate.toDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    scheduledDate = `${year}-${month}-${day}`; // Local timezone YYYY-MM-DD
  }
  
  return {
    ...job,
    jobTitle: job.title || job.jobTitle,
    title: job.title || job.jobTitle,
    jobDate: scheduledDate,
    scheduledDate: scheduledDate,
    photo: job.thumbnail || job.photo,
    paymentAmount: job.priceOffer || job.paymentAmount,
    priceOffer: job.priceOffer,
    extra1: Array.isArray(job.extras) ? (job.extras[0] || '') : '',
    extra2: Array.isArray(job.extras) ? (job.extras[1] || '') : '',
    posterName: job.posterName || 'Customer',
    posterThumbnail: job.posterThumbnail || '',
    applicationCount: job.applicationCount || 0
  };
}

function safeSetText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function formatJobDateForDisplay(value) {
  try {
    let date = null;
    if (!value) return 'TBD';
    if (typeof value?.toDate === 'function') {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split('-').map(Number);
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(value);
      }
    }
    if (!date || isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'TBD';
  }
}

function populateJobPage(jobData) {
  // Store job data globally for customer profile link
  window.currentJobData = jobData;
  
  // Set page title (check both jobTitle and title fields)
  const jobTitle = jobData.jobTitle || jobData.title || 'Untitled Gig';
  document.title = `${jobTitle} - GISUGO`;
  safeSetText('pageTitle', `${jobTitle} - GISUGO`);
  
  // Set job title
  safeSetText('jobTitle', jobTitle);
  
  // Set job photo if available (check both photo and thumbnail fields)
  const photoSrc = jobData.photo || jobData.thumbnail;
  console.log(`🖼️ Photo debugging:`, {
    hasPhoto: !!jobData.photo,
    hasThumbnail: !!jobData.thumbnail,
    photoValue: jobData.photo,
    thumbnailValue: jobData.thumbnail,
    finalPhotoSrc: photoSrc,
    allJobFields: Object.keys(jobData)
  });
  
  if (photoSrc) {
    const photoContainer = document.getElementById('jobPhotoContainer');
    const photoBorderline = document.getElementById('jobPhotoBorderline');
    const photoImg = document.getElementById('jobPhoto');
    
    if (photoContainer && photoBorderline && photoImg) {
      photoImg.src = photoSrc;
    photoContainer.style.display = 'block';
    photoBorderline.style.display = 'block';
      console.log('✅ Job photo loaded successfully:', photoSrc);
      
      // Add error handling for broken images
      photoImg.onload = function() {
        console.log('✅ Photo image loaded successfully from:', photoSrc);
      };
      
      photoImg.onerror = function() {
        console.error('❌ Failed to load photo image from:', photoSrc);
        photoContainer.style.display = 'none';
        photoBorderline.style.display = 'none';
      };
    } else {
      console.error('❌ Photo container elements not found:', {
        photoContainer: !!photoContainer,
        photoBorderline: !!photoBorderline,
        photoImg: !!photoImg
      });
    }
  } else {
    console.log('⚠️ No job photo found. Job data structure:', {
      availableFields: Object.keys(jobData),
      photoField: jobData.photo,
      thumbnailField: jobData.thumbnail,
      imageField: jobData.image,
      pictureField: jobData.picture
    });
  }
  
  // Set region and city
  if (jobData.region) {
    safeSetText('jobRegion', jobData.region);
  } else {
    safeSetText('jobRegion', 'Not specified');
  }
  
  if (jobData.city) {
    safeSetText('jobCity', jobData.city);
  } else {
    safeSetText('jobCity', 'Not specified');
  }
  
  // Set date with robust parsing for string/Date/Timestamp variants.
  safeSetText('jobDate', formatJobDateForDisplay(jobData.jobDate || jobData.scheduledDate));
  
  // Set time
  if (jobData.startTime && jobData.endTime) {
    safeSetText('jobTime', `${jobData.startTime} to ${jobData.endTime}`);
  } else {
    safeSetText('jobTime', 'TBD');
  }
  
  // Set extras based on category
  populateExtras(jobData);
  
  // Set description
  safeSetText('jobDescription', jobData.description || 'No description provided.');
  
  // Set payment (check multiple field variations)
  const paymentAmount = jobData.paymentAmount || jobData.priceOffer || '0';
  const paymentType = jobData.paymentType || 'Per Hour';
  safeSetText('jobPaymentAmount', `₱${paymentAmount}`);
  safeSetText('jobPaymentRate', paymentType);
  safeSetText('modalPaymentAmount', `₱${paymentAmount}`);
  
  // Set customer info (poster)
  const customerNameEl = document.getElementById('customerName');
  const customerAvatarEl = document.getElementById('customerAvatar');
  
  if (customerNameEl) {
    customerNameEl.textContent = jobData.posterName || 'Customer';
  }
  
  if (customerAvatarEl) {
    const avatarSrc = jobData.posterThumbnail;
    
    if (avatarSrc) {
      customerAvatarEl.src = avatarSrc;
      customerAvatarEl.alt = jobData.posterName || 'Customer';
      customerAvatarEl.style.display = 'block';
      
      // Add error handling for broken images - use emoji
      customerAvatarEl.onerror = function() {
        console.warn('⚠️ Failed to load customer avatar, using emoji');
        this.style.display = 'none';
        this.parentElement.innerHTML = '<span style="font-size: 2.5rem;">👤</span>';
      };
    } else {
      // No photo - use emoji
      customerAvatarEl.style.display = 'none';
      customerAvatarEl.parentElement.innerHTML = '<span style="font-size: 2.5rem;">👤</span>';
    }
  }
}

/**
 * Render star rating visually
 * @param {HTMLElement} container - Container element with .star children
 * @param {number} rating - Rating value (0-5)
 */
function renderStars(container, rating) {
  if (!container) return;
  
  const stars = container.querySelectorAll('.star');
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  stars.forEach((star, index) => {
    star.classList.remove('filled', 'half-filled');
    
    if (index < fullStars) {
      star.classList.add('filled');
      star.textContent = '★';
    } else if (index === fullStars && hasHalfStar) {
      star.classList.add('half-filled');
      star.textContent = '★';
    } else {
      star.textContent = '☆';
    }
  });
}

/**
 * Load and display customer (poster) rating from Firestore
 * @param {string} posterId - The user ID of the job poster
 */
async function loadCustomerRating(posterId) {
  if (!posterId) {
    console.warn('⚠️ No posterId provided for customer rating');
    return;
  }
  
  try {
    console.log(`⭐ Fetching customer rating for posterId: ${posterId}`);
    
    // Get customer rating element
    const ratingElement = document.querySelector('.customer-rating');
    const ratingCountElement = document.querySelector('.customer-rating .rating-count');
    const ratingStarsContainer = document.querySelector('.customer-rating .rating-stars');
    
    if (!ratingElement) {
      console.warn('⚠️ Customer rating element not found');
      return;
    }
    
    // Fetch poster's profile from Firestore
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const db = firebase.firestore();
      const userDoc = await db.collection('users').doc(posterId).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const averageRating = userData.averageRating || 0;
        const totalReviews = userData.totalReviews || 0;
        
        console.log(`⭐ Customer rating loaded: ${averageRating} stars (${totalReviews} reviews)`);
        
        // Update rating count
        if (ratingCountElement) {
          ratingCountElement.textContent = totalReviews;
        }
        
        // Update data attributes
        ratingElement.setAttribute('data-rating', averageRating);
        ratingElement.setAttribute('data-count', totalReviews);
        
        // Render stars visually
        if (ratingStarsContainer && typeof renderStars === 'function') {
          renderStars(ratingStarsContainer, averageRating);
        }
        
        console.log(`✅ Customer rating displayed: ${averageRating}/5 (${totalReviews} reviews)`);
      } else {
        console.warn(`⚠️ User profile not found for posterId: ${posterId}`);
        // Set to 0 reviews if profile doesn't exist
        if (ratingCountElement) ratingCountElement.textContent = '0';
        if (ratingElement) {
          ratingElement.setAttribute('data-rating', '0');
          ratingElement.setAttribute('data-count', '0');
        }
      }
    } else {
      console.warn('⚠️ Firebase not available for customer rating');
    }
  } catch (error) {
    console.error('❌ Error loading customer rating:', error);
  }
}

function populateExtras(jobData) {
  const category = jobData.category;
  const config = extrasConfig[category];
  
  if (!config || !jobData.extras || jobData.extras.length === 0) {
    return; // No extras to show
  }
  
  const extrasRow = document.getElementById('jobExtrasRow');
  if (!extrasRow) return;
  extrasRow.style.display = 'flex';
  
  // Populate field 1
  if (jobData.extras[0] && config.field1) {
    const parts = jobData.extras[0].split(':');
    const label = parts[0] ? parts[0].trim() + ':' : config.field1.label;
    const value = parts[1] ? parts[1].trim() : '';
    
    safeSetText('jobExtra1Label', label);
    safeSetText('jobExtra1Value', value || 'Not specified');
  }
  
  // Populate field 2
  if (jobData.extras[1] && config.field2) {
    const parts = jobData.extras[1].split(':');
    const label = parts[0] ? parts[0].trim() + ':' : config.field2.label;
    const value = parts[1] ? parts[1].trim() : '';
    
    safeSetText('jobExtra2Label', label);
    safeSetText('jobExtra2Value', value || 'Not specified');
  }
}

function showErrorMessage(message) {
  safeSetText('jobTitle', 'Error Loading Job');
  safeSetText('jobDate', 'N/A');
  safeSetText('jobTime', 'N/A');
  safeSetText('jobDescription', message || 'Failed to load job data.');
  safeSetText('jobPaymentAmount', '₱0');
  safeSetText('jobPaymentRate', 'N/A');
  safeSetText('jobRegion', 'N/A');
  safeSetText('jobCity', 'N/A');
  safeSetText('jobExtra1Value', 'N/A');
  safeSetText('jobExtra2Value', 'N/A');
  const photoContainer = document.getElementById('jobPhotoContainer');
  const photoBorderline = document.getElementById('jobPhotoBorderline');
  if (photoContainer) photoContainer.style.display = 'none';
  if (photoBorderline) photoBorderline.style.display = 'none';
}

// Initialize menu functionality
function initializeMenu() {
  const menuBtn = document.getElementById('jobMenuBtn');
  const menuOverlay = document.getElementById('jobcatMenuOverlay');
  
  if (menuBtn && menuOverlay) {
    if (menuOverlay.dataset.menuInitialized === '1') return;
    menuOverlay.dataset.menuInitialized = '1';

    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(menuBtn, 'click', function(e) {
      e.stopPropagation();
      menuOverlay.classList.toggle('show');
    });
    
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(menuOverlay, 'click', function(e) {
      if (e.target === menuOverlay) {
        menuOverlay.classList.remove('show');
      }
    });
    
    // Menu escape key handler - using cleanup registry
    const menuEscapeHandler = function(e) {
      if (e.key === 'Escape') {
        menuOverlay.classList.remove('show');
      }
    };
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', menuEscapeHandler);
  }
}

// Initialize apply job functionality
function renderApplyTokenCaption(captionEl, isLowToken) {
  if (!captionEl) return;
  const guidanceText = 'Apply only if you are qualified and available.';
  const lowTokenText = isLowToken ? '<span class="apply-coin-caption-low">You are low on tokens.</span>' : '';
  captionEl.innerHTML = `<span class="apply-coin-caption-guidance">${guidanceText}</span><span class="apply-coin-caption-cost">Each time you Apply costs 1 Token.</span>${lowTokenText}`;
}

async function refreshApplyCoinStatus() {
  const statusBox = document.getElementById('applyCoinStatus');
  const valueEl = document.getElementById('applyCoinValue');
  const captionEl = document.getElementById('applyCoinCaption');
  const submitBtn = document.getElementById('submitApplication');
  const user = firebase?.auth ? firebase.auth().currentUser : null;
  if (!statusBox || !valueEl || !captionEl || !submitBtn || !user?.uid || typeof getUserApplicationCoinStatus !== 'function') {
    return { current: 0, max: 10 };
  }

  try {
    const result = await getUserApplicationCoinStatus(user.uid);
    if (result && result.success === false) {
      throw new Error(result.message || 'coin_status_failed');
    }
    const current = Number(result?.current ?? 0);
    const max = Number(result?.max ?? 10);
    valueEl.textContent = `${current} / ${max}`;
    statusBox.classList.toggle('low', current <= 2);
    renderApplyTokenCaption(captionEl, current <= 2);
    submitBtn.disabled = current <= 0;
    submitBtn.style.opacity = current <= 0 ? '0.65' : '';
    if (current <= 0) {
      submitBtn.textContent = 'NO TOKENS AVAILABLE';
    } else {
      submitBtn.textContent = 'APPLY TO GIG';
    }
    return { current, max };
  } catch (error) {
    console.warn('⚠️ Could not refresh apply token status:', error);
    valueEl.textContent = '— / —';
    statusBox.classList.remove('low');
    renderApplyTokenCaption(captionEl, false);
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.65';
    submitBtn.textContent = 'TOKEN CHECK FAILED — RETRY';
    if (!submitBtn.dataset.retryHandlerBound) {
      submitBtn.dataset.retryHandlerBound = '1';
      submitBtn.addEventListener('click', function handleRetry(ev) {
        if (submitBtn.textContent !== 'TOKEN CHECK FAILED — RETRY') return;
        ev.preventDefault();
        ev.stopPropagation();
        submitBtn.textContent = 'CHECKING TOKENS...';
        Promise.resolve(refreshApplyCoinStatus()).catch(() => {});
      }, true);
    }
    return { current: 0, max: 10, failed: true };
  }
}

function initializeApplyJob() {
  const applyBtn = document.getElementById('jobApplyBtn');
  const applyOverlay = document.getElementById('applyJobOverlay');
  const submitBtn = document.getElementById('submitApplication');
  const cancelBtn = document.getElementById('cancelApplication');
  const messageTextarea = document.getElementById('applyMessage');
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  if (applyBtn && applyOverlay) {
    if (applyOverlay.dataset.applyInitialized === '1') return;
    applyOverlay.dataset.applyInitialized = '1';

    // Prevent any form submission behavior on the modal
    const modal = applyOverlay.querySelector('.apply-job-modal');
    if (modal) {
      DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(modal, 'submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    }
    
    // Prevent Enter key from submitting in textarea/input
    if (messageTextarea) {
      blockUnsupportedCharsForInput(messageTextarea);
      DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(messageTextarea, 'keydown', function(e) {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleJobApplication();
        }
      });
    }
    
    if (counterOfferInput) {
      DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(counterOfferInput, 'keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleJobApplication();
        }
      });
    }
    
    // Show modal when apply button is clicked
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(applyBtn, 'click', function(e) {
      e.preventDefault();
      
      // ═══════════════════════════════════════════════════════════════
      // AUTH CHECK: Must be logged in to apply
      // ═══════════════════════════════════════════════════════════════
      const useFirebase = typeof firebase !== 'undefined' && firebase.auth;
      if (useFirebase) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
          // Not logged in - redirect to login page
          console.log('⚠️ User must log in to apply');
          window.location.href = 'login.html';
          return;
        }
      }
      
      // Scroll window to top to prevent Android keyboard positioning issues
      window.scrollTo(0, 0);
      applyOverlay.scrollTop = 0;
      applyOverlay.classList.add('show');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.65';
        submitBtn.textContent = 'CHECKING TOKENS...';
      }
      // Refresh token state after opening so modal appears instantly.
      Promise.resolve(refreshApplyCoinStatus()).catch((error) => {
        console.warn('⚠️ Delayed token refresh failed after opening modal:', error);
      });
      // Focus on message textarea for better UX
      if (messageTextarea) {
        const focusTimeout = setTimeout(() => messageTextarea.focus(), 300);
        DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(focusTimeout);
      }
    });
    
    // Hide modal when cancel button is clicked
    if (cancelBtn) {
      DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(cancelBtn, 'click', function(e) {
        e.preventDefault();
        closeApplyModal();
      });
    }
    
    // Hide modal when clicking outside the modal content
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(applyOverlay, 'click', function(e) {
      if (e.target === applyOverlay) {
        closeApplyModal();
      }
    });
    
    // Handle form submission
    if (submitBtn) {
      DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(submitBtn, 'click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleJobApplication();
        return false;
      });
    }
    
    // Close modal with Escape key - using cleanup registry
    const applyModalEscapeHandler = function(e) {
      if (e.key === 'Escape' && applyOverlay.classList.contains('show')) {
        closeApplyModal();
      }
    };
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', applyModalEscapeHandler);
  }
}

// Function to close apply modal
function closeApplyModal() {
  const applyOverlay = document.getElementById('applyJobOverlay');
  if (applyOverlay) {
    applyOverlay.classList.remove('show');
  }
}

// Function to handle job application submission
function handleJobApplication() {
  const messageTextarea = document.getElementById('applyMessage');
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  // Check if user is trying to apply to their own job
  const currentUser = firebase.auth ? firebase.auth().currentUser : null;
  const { jobId } = getUrlParameters();
  dynamicTrace('route:dynamic-job/apply', {
    jobId: String(jobId || ''),
    userId: currentUser && currentUser.uid ? currentUser.uid : 'guest'
  });
  if (currentUser && window.currentJobData && window.currentJobData.posterId === currentUser.uid) {
    console.error('🚫 User attempted to apply to their own job');
    dynamicTrace('render:apply:error', 'self_apply_blocked');
    alert('You cannot apply to your own job posting!');
    return;
  }

  const submitBtn = document.getElementById('submitApplication');
  if (submitBtn && submitBtn.disabled) {
    alert('You have no G tokens available right now.');
    return;
  }
  
  // Get form values
  const message = messageTextarea ? messageTextarea.value.trim() : '';
  const counterOffer = counterOfferInput ? counterOfferInput.value.trim() : '';
  
  // Basic validation
  if (!message) {
    showValidationError('Please enter a message to the customer.', messageTextarea);
    return;
  }
  
  // Validate counter offer if provided
  if (counterOffer && (isNaN(counterOffer) || parseFloat(counterOffer) <= 0)) {
    showValidationError('Please enter a valid counter offer amount.', counterOfferInput);
    return;
  }
  
  // Prepare application data
  const applicationData = {
    message: message,
    counterOffer: counterOffer ? parseFloat(counterOffer) : null
  };
  
  console.log('📤 Submitting job application for jobId:', jobId, applicationData);
  
  // Show loading overlay
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.querySelector('#loadingOverlay .loading-text');
  if (loadingOverlay) {
    if (loadingText) loadingText.textContent = 'Sending Application...';
    loadingOverlay.classList.add('show');
  }
  dynamicTrace('render:apply:loading', 'Sending Application...');
  
  // Submit application to Firebase
  if (typeof applyForJob === 'function') {
    dynamicTrace('fetch:mode', dynamicTraceIsEnabled() ? 'REST_PRIMARY' : 'SDK');
    const applySubmitTimeoutMs = dynamicTraceIsEnabled() ? 34000 : 15000;
    withDynamicJobTimeout(applyForJob(jobId, applicationData), 'applyForJob', applySubmitTimeoutMs)
      .then(result => {
        // Hide loading
        if (loadingOverlay) loadingOverlay.classList.remove('show');
        
        if (result.success) {
          dynamicTrace('render:apply:success', { applicationId: result.applicationId || '' });
          console.log('✅ Application submitted successfully!');
          console.log('   Application ID:', result.applicationId);
          console.log('   Job ID:', jobId);
          console.log('   🔍 Customer should query applications with jobId:', jobId);
          
          // Clear form and close apply modal
          if (messageTextarea) messageTextarea.value = '';
          if (counterOfferInput) counterOfferInput.value = '';
          closeApplyModal();
          
          // Show confirmation overlay
          showApplicationSentOverlay();
          refreshApplyCoinStatus();
        } else {
          dynamicTrace('render:apply:error', result.message || 'apply_failed');
          console.error('❌ Application submission failed:', result.message);
          alert(result.message || 'Failed to submit application. Please try again.');
        }
      })
      .catch(error => {
        // Hide loading
        if (loadingOverlay) loadingOverlay.classList.remove('show');
        
        console.error('❌ Error submitting application:', error);
        if (String(error?.message || '').includes('timed out')) {
          dynamicTrace('fetch:timeout', String(error.message || error));
          dynamicTrace('render:apply:error', 'timeout');
          alert('Application request is taking too long on this connection. Please try again.');
        } else {
          dynamicTrace('fetch:error', String(error?.message || error));
          dynamicTrace('render:apply:error', 'exception');
          alert('An error occurred. Please try again.');
        }
      });
  } else {
    // Hide loading
    if (loadingOverlay) loadingOverlay.classList.remove('show');
    
    console.error('❌ applyForJob function not available');
    dynamicTrace('render:apply:error', 'applyForJob_unavailable');
    alert('Application system unavailable. Please refresh the page.');
  }
}

// Function to show application sent confirmation overlay
function showApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const lightRaysContainer = document.getElementById('lightRaysContainer');
  
  if (applicationSentOverlay) {
    applicationSentOverlay.classList.add('show');
  }
  
  // Show and animate light rays - position at icon after modal appears
  if (lightRaysContainer) {
    lightRaysContainer.classList.add('active');
    
    // Wait for modal to render, then position rays at icon
    const positionTimeout = setTimeout(() => {
      const icon = document.querySelector('.application-sent-icon');
      if (icon) {
        const rect = icon.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Position each ray at the icon center
        const rays = lightRaysContainer.querySelectorAll('.light-ray');
        rays.forEach(ray => {
          ray.style.top = centerY + 'px';
          ray.style.left = centerX + 'px';
          ray.style.animation = 'none';
          ray.offsetHeight; // Trigger reflow
          ray.style.animation = '';
        });
      }
    }, 100);
    DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(positionTimeout);
  }
}

// Function to just close the overlay (for backdrop click / escape)
function closeApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const lightRaysContainer = document.getElementById('lightRaysContainer');
  
  if (applicationSentOverlay) {
    applicationSentOverlay.classList.remove('show');
  }
  
  if (lightRaysContainer) {
    lightRaysContainer.classList.remove('active');
  }
}

function showReportGigSentOverlay() {
  const overlay = document.getElementById('reportGigSentOverlay');
  const lightRaysContainer = document.getElementById('lightRaysContainer');
  if (overlay) {
    overlay.classList.add('show');
  }
  if (lightRaysContainer) {
    lightRaysContainer.classList.add('active');
    const positionTimeout = setTimeout(() => {
      const icon = overlay ? overlay.querySelector('.application-sent-icon') : null;
      if (!icon) return;
      const rect = icon.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rays = lightRaysContainer.querySelectorAll('.light-ray');
      rays.forEach((ray) => {
        ray.style.top = centerY + 'px';
        ray.style.left = centerX + 'px';
        ray.style.animation = 'none';
        ray.offsetHeight;
        ray.style.animation = '';
      });
    }, 100);
    DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(positionTimeout);
  }
}

function closeReportGigSentOverlay() {
  const overlay = document.getElementById('reportGigSentOverlay');
  const lightRaysContainer = document.getElementById('lightRaysContainer');
  if (overlay) {
    overlay.classList.remove('show');
  }
  if (lightRaysContainer) {
    lightRaysContainer.classList.remove('active');
  }
}

// ========================== VALIDATION OVERLAY ==========================
function showValidationError(message, focusElement = null) {
  const overlay = document.getElementById('validationOverlay');
  const messageEl = document.getElementById('validationMessage');
  const okBtn = document.getElementById('validationOkBtn');
  
  if (!overlay || !messageEl) return;
  
  // Set the message
  messageEl.textContent = message;
  
  // Show the overlay
  overlay.classList.add('show');
  
  // Handle OK button click
  const closeValidation = () => {
    overlay.classList.remove('show');
    okBtn.removeEventListener('click', closeValidation);
    overlay.removeEventListener('click', handleBackdropClick);
    document.removeEventListener('keydown', handleEscKey);
    
    // Focus the element that needs attention
    if (focusElement) {
      setTimeout(() => focusElement.focus(), 100);
    }
  };
  
  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === overlay) {
      closeValidation();
    }
  };
  
  // Close on Escape key - using cleanup registry
  const handleEscKey = (e) => {
    if (e.key === 'Escape') {
      closeValidation();
    }
  };
  
  okBtn.addEventListener('click', closeValidation);
  overlay.addEventListener('click', handleBackdropClick);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', handleEscKey);
}

// Function to close overlay AND navigate back to listings (for GOT IT button)
function closeAndNavigateToListings() {
  closeApplicationSentOverlay();
  
  // Get the category from URL to navigate back to the correct listings page
  const { category } = getUrlParameters();
  if (category) {
    // Navigate to the category listings page
    window.location.href = `${category}.html`;
  } else {
    // Fallback to browser back
    window.history.back();
  }
}

// Function to initialize application sent overlay
function initializeApplicationSentOverlay() {
  const applicationSentOverlay = document.getElementById('applicationSentOverlay');
  const closeBtn = document.getElementById('applicationSentClose');
  
  if (applicationSentOverlay && closeBtn) {
    // GOT IT button - close and navigate back to listings
    closeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      closeAndNavigateToListings();
    });
    
    // Backdrop click - just close overlay (user can stay on page)
    applicationSentOverlay.addEventListener('click', function(e) {
      if (e.target === applicationSentOverlay) {
        closeApplicationSentOverlay();
      }
    });
    
    // Escape key - just close overlay - using cleanup registry
    const applicationSentEscapeHandler = function(e) {
      if (e.key === 'Escape' && applicationSentOverlay.classList.contains('show')) {
        closeApplicationSentOverlay();
      }
    };
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', applicationSentEscapeHandler);
  }
}

function initializeReportGigSentOverlay() {
  const overlay = document.getElementById('reportGigSentOverlay');
  const closeBtn = document.getElementById('reportGigSentClose');
  if (!overlay || !closeBtn) return;

  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(closeBtn, 'click', (e) => {
    if (e) e.preventDefault();
    closeReportGigSentOverlay();
  });
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(overlay, 'click', (e) => {
    if (e.target === overlay) closeReportGigSentOverlay();
  });

  const reportSentEscHandler = function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('show')) {
      closeReportGigSentOverlay();
    }
  };
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', reportSentEscHandler);
}

// Function to format counter offer input
function initCounterOfferFormatting() {
  const counterOfferInput = document.getElementById('counterOfferAmount');
  
  if (counterOfferInput) {
    // Prevent negative values and non-numeric input
    counterOfferInput.addEventListener('input', function(e) {
      let value = e.target.value;
      
      // Remove any non-numeric characters except decimal point
      value = value.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      
      // Limit to 2 decimal places
      if (parts[1] && parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
      
      e.target.value = value;
    });
    
    // Prevent negative values on keydown
    counterOfferInput.addEventListener('keydown', function(e) {
      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
      }
    });
  }
}

// Initialize customer profile link
function initializeCustomerProfileLink() {
  const customerProfileLink = document.getElementById('customerProfileLink');
  
  if (customerProfileLink) {
    customerProfileLink.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Use the actual posterId stored in the job data
      if (window.currentJobData && window.currentJobData.posterId) {
        // Navigate to profile page with the real userId
        window.location.href = `profile.html?userId=${window.currentJobData.posterId}`;
      } else {
        console.error('❌ Poster ID not found in job data');
      }
    });
  }
}

// Initialize gig report modal
function openDynamicReportModal(jobTitle = 'this gig') {
  const overlay = document.getElementById('contactChatOverlay');
  const subjectInput = document.getElementById('contactChatSubject');
  const textarea = document.getElementById('contactChatMessage');
  if (!overlay || !subjectInput || !textarea) {
    const fallbackSubject = String(window.prompt('Report subject (reason):') || '').trim();
    if (!fallbackSubject) return Promise.resolve(null);
    const fallbackMessage = String(window.prompt('Describe the issue:') || '').trim();
    if (!fallbackMessage) return Promise.resolve(null);
    return Promise.resolve({
      subject: fallbackSubject,
      message: fallbackMessage
    });
  }

  REPORT_MODAL_CONTEXT.jobTitle = String(jobTitle || '').trim() || 'this gig';
  applyReportGigLanguage(ACTIVE_REPORT_LANG);
  subjectInput.value = '';
  textarea.value = '';
  overlay.classList.add('show');

  const focusTimeout = setTimeout(() => subjectInput.focus(), 120);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(focusTimeout);

  return new Promise((resolve) => {
    DYNAMIC_REPORT_MODAL_STATE.resolver = resolve;
  });
}

function closeDynamicReportModal(payload = null) {
  const overlay = document.getElementById('contactChatOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
  if (typeof DYNAMIC_REPORT_MODAL_STATE.resolver === 'function') {
    DYNAMIC_REPORT_MODAL_STATE.resolver(payload);
    DYNAMIC_REPORT_MODAL_STATE.resolver = null;
  }
}

function initializeDynamicReportModal() {
  const overlay = document.getElementById('contactChatOverlay');
  const sendBtn = document.getElementById('contactChatSendBtn');
  const cancelBtn = document.getElementById('contactChatCancelBtn');
  const subjectInput = document.getElementById('contactChatSubject');
  const textarea = document.getElementById('contactChatMessage');

  if (!overlay || !sendBtn || !cancelBtn || !subjectInput || !textarea) return;

  blockUnsupportedCharsForInput(textarea);

  const submitHandler = () => {
    const subject = String(subjectInput.value || '').trim();
    const message = String(textarea.value || '').trim();
    if (!subject) {
      showValidationError('Please select a report subject.', subjectInput);
      return;
    }
    if (!message) {
      showValidationError('Please enter report details for Admin.', textarea);
      return;
    }
    closeDynamicReportModal({ subject, message });
  };

  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(sendBtn, 'click', submitHandler);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(cancelBtn, 'click', () => closeDynamicReportModal(null));
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(overlay, 'click', (event) => {
    if (event.target === overlay) {
      closeDynamicReportModal(null);
    }
  });
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(subjectInput, 'keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDynamicReportModal(null);
    }
  });
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(textarea, 'keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDynamicReportModal(null);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      submitHandler();
    }
  });
}

function getGigReportSubjectLabel(subjectValue) {
  const labels = {
    inappropriate_content: 'Inappropriate content',
    scam_fraud: 'Scam/Fraud',
    misleading_info: 'Misleading info',
    duplicate_post: 'Duplicate post',
    other_reasons: 'Other reasons'
  };
  return labels[String(subjectValue || '').trim()] || String(subjectValue || '').trim();
}

async function handleDynamicGigReportAction() {
  try {
    const authUser = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    if (!authUser) {
      window.location.href = 'login.html';
      return;
    }

    const jobData = window.currentJobData || {};
    const jobId = String(jobData.jobId || jobData.id || '').trim();
    const posterId = String(jobData.posterId || '').trim();
    const jobTitle = String(jobData.title || jobData.jobTitle || 'Gig').trim();
    if (!jobId) {
      alert('Unable to submit report: missing gig details. Please refresh.');
      return;
    }
    if (posterId && posterId === authUser.uid) {
      showValidationError('You cannot report your own gig posting.');
      return;
    }

    if (typeof hasSubmittedGigReport === 'function') {
      const alreadyReported = await hasSubmittedGigReport(jobId);
      if (alreadyReported) {
        showValidationError('You already reported this gig. Admin review is already in queue.');
        return;
      }
    }

    const draft = await openDynamicReportModal(jobTitle);
    if (draft == null) return;
    const subject = String(draft.subject || '').trim();
    const message = String(draft.message || '').trim();
    const subjectLabel = getGigReportSubjectLabel(subject);
    if (!subjectLabel) {
      showValidationError('Please select a report subject.');
      return;
    }
    if (!message) {
      showValidationError('Please enter report details for Admin.');
      return;
    }
    if (typeof hasUnsupportedTextChars === 'function' && (hasUnsupportedTextChars(subjectLabel) || hasUnsupportedTextChars(message))) {
      showValidationError('Report has unsupported symbols.');
      return;
    }

    if (typeof submitGigReportToAdmin !== 'function') {
      alert('Report service is unavailable right now. Please try again later.');
      return;
    }

    const reportResult = await submitGigReportToAdmin(jobId, {
      reasonKey: subject,
      subject: subjectLabel,
      message: message,
      jobTitle: jobTitle,
      jobCategory: String(jobData.category || '').trim(),
      posterId: posterId
    });
    if (!reportResult || reportResult.success !== true) {
      if (String(reportResult?.code || '') === 'already-reported') {
        showValidationError('You already reported this gig. Admin review is already in queue.');
        return;
      }
      throw new Error(reportResult?.message || 'Failed to submit report');
    }

    showReportGigSentOverlay();
  } catch (error) {
    console.error('❌ Dynamic gig report failed:', error);
    alert('Failed to submit report. Please try again.');
  }
}

function initializeReportGigButton() {
  const contactBtn = document.getElementById('contactBtn');
  if (!contactBtn) return;

  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(contactBtn, 'click', async function(e) {
    if (e) e.preventDefault();
    if (contactBtn.disabled) return;
    contactBtn.disabled = true;
    try {
      await handleDynamicGigReportAction();
    } finally {
      contactBtn.disabled = false;
    }
    });
}

// ========================== PHOTO LIGHTBOX FUNCTIONALITY ==========================

function initializePhotoLightbox() {
  const jobPhoto = document.getElementById('jobPhoto');
  const lightboxOverlay = document.getElementById('photoLightboxOverlay');
  const lightboxImage = document.getElementById('photoLightboxImage');
  const lightboxClose = document.getElementById('photoLightboxClose');

  if (!jobPhoto || !lightboxOverlay || !lightboxImage || !lightboxClose) {
    console.log('Photo lightbox elements not found');
    return;
  }

  // Function to open lightbox with smart photo selection
  function openLightbox() {
    const photoSrc = jobPhoto.src;
    if (photoSrc && photoSrc !== '') {
      lightboxImage.src = photoSrc;
      lightboxOverlay.style.display = 'flex';
      
      // Add show class with slight delay for smooth animation
      const showTimeout = setTimeout(() => {
        lightboxOverlay.classList.add('show');
      }, 10);
      DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(showTimeout);
      
      // Prevent body scrolling when lightbox is open
      document.body.style.overflow = 'hidden';
      
      console.log('📸 Photo lightbox opened');
    }
  }

  // Function to close lightbox
  function closeLightbox() {
    lightboxOverlay.classList.remove('show');
    
    // Hide overlay after animation completes
    const hideTimeout = setTimeout(() => {
      lightboxOverlay.style.display = 'none';
      lightboxImage.src = '';
    }, 300);
    DYNAMIC_JOB_CLEANUP_REGISTRY.addTimeout(hideTimeout);
    
    // Restore body scrolling
    document.body.style.overflow = '';
    
    console.log('📸 Photo lightbox closed');
  }

  // Event listeners with cleanup registry
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(jobPhoto, 'click', openLightbox);
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(lightboxClose, 'click', closeLightbox);
  
  // Close on backdrop click
  const backdropHandler = function(e) {
    if (e.target === lightboxOverlay) {
      closeLightbox();
    }
  };
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(lightboxOverlay, 'click', backdropHandler);
  
  // Close on Escape key
  const escapeHandler = function(e) {
    if (e.key === 'Escape' && lightboxOverlay.classList.contains('show')) {
      closeLightbox();
    }
  };
  DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', escapeHandler);

  console.log('✅ Photo lightbox initialized');
}

// ========================== CHECK IF USER ALREADY APPLIED ==========================

/**
 * Check if the current user has already applied to this job
 * @param {string} jobId - The job ID to check
 */
async function checkIfUserAlreadyApplied(jobId) {
  const applyBtn = document.getElementById('jobApplyBtn');
  if (!applyBtn) return;
  
  // Check if Firebase is available
  const useFirebase = typeof firebase !== 'undefined' && firebase.auth && firebase.firestore;
  if (!useFirebase) {
    console.log('⚠️ Firebase not available, skipping duplicate application check');
    return;
  }
  
  // Get current user
  const currentUser = firebase.auth().currentUser;
  if (!currentUser) {
    console.log('ℹ️ User not logged in, apply button remains enabled');
    return;
  }
  
  try {
    console.log('🔍 Checking if user already applied to job:', jobId);
    
    const db = firebase.firestore();
    let existingApplications;
    
    try {
      existingApplications = await db.collection('applications')
        .where('jobId', '==', jobId)
        .where('applicantId', '==', currentUser.uid)
        .orderBy('appliedAt', 'desc')  // Most recent first
        .get();
    } catch (indexError) {
      if (indexError.code === 'failed-precondition' || indexError.message.includes('index')) {
        console.error('❌ FIREBASE INDEX REQUIRED!');
        console.error('📋 Error:', indexError.message);
        console.error('🔗 Look for a link in the error above to create the index');
        console.error('⏱️ After clicking the link, wait 5-10 minutes for index to build');
        
        // Keep button enabled so user can see the error message when they try to apply
        return;
      }
      throw indexError;
    }
    
    const applicationCount = existingApplications.size;
    const mostRecentApp = existingApplications.empty ? null : existingApplications.docs[0].data();
    
    console.log(`📊 Application count: ${applicationCount}`);
    if (mostRecentApp) {
      console.log(`📊 Most recent status: ${mostRecentApp.status}`);
    }
    
    if (applicationCount === 0) {
      // Never applied - button stays as "APPLY TO GIG" (enabled)
      console.log('✅ User has not applied yet, button remains enabled');
      return;
      
    } else if (
      applicationCount === 1 && (
        mostRecentApp.status === 'rejected' ||
        mostRecentApp.status === 'rejected_by_worker' ||
        mostRecentApp.status === 'voided' ||
        mostRecentApp.status === 'resigned'
      )
    ) {
      // ═══════════════════════════════════════════════════════════════
      // Applied once, got rejected/voided/resigned - show "APPLY AGAIN" (enabled)
      // ═══════════════════════════════════════════════════════════════
      let reason = '';
      if (mostRecentApp.status === 'rejected') {
        reason = 'You were rejected. You can apply one more time.';
        console.log('♻️ User was rejected - showing APPLY AGAIN button');
      } else if (mostRecentApp.status === 'rejected_by_worker') {
        reason = 'You declined a prior offer. You can apply one more time.';
        console.log('♻️ User previously rejected offer - showing APPLY AGAIN button');
      } else if (mostRecentApp.status === 'voided') {
        reason = 'Your contract was voided. You can apply one more time.';
        console.log('♻️ User was voided (customer relisted) - showing APPLY AGAIN button');
      } else if (mostRecentApp.status === 'resigned') {
        reason = 'You resigned. You can apply one more time.';
        console.log('♻️ User resigned - showing APPLY AGAIN button');
      }
      
      applyBtn.disabled = false;
      applyBtn.style.opacity = '1';
      applyBtn.style.cursor = 'pointer';
      applyBtn.style.backgroundColor = '#ff9800';  // Orange for "try again"
      applyBtn.querySelector('span').textContent = 'APPLY AGAIN';
      applyBtn.title = reason;
      
      console.log('✅ Apply button set to "APPLY AGAIN" mode');
      
    } else {
      // ═══════════════════════════════════════════════════════════════
      // Either: pending, accepted, or 2+ applications - gray it out
      // ═══════════════════════════════════════════════════════════════
      console.log('🚫 User has already applied (cannot reapply)');
      
      applyBtn.disabled = true;
      applyBtn.style.opacity = '0.5';
      applyBtn.style.cursor = 'not-allowed';
      applyBtn.style.backgroundColor = '';  // Reset to default
      
      // Set button text based on application count
      if (applicationCount >= 2) {
        // User has used both application chances
        applyBtn.querySelector('span').textContent = 'LIMIT REACHED';
        applyBtn.title = 'You have reached the maximum number of applications (2) for this job';
        console.log('🚫 Showing LIMIT REACHED (2+ applications)');
      } else {
        // User has 1 application that's pending or accepted
        applyBtn.querySelector('span').textContent = 'ALREADY APPLIED';
        
        // Set appropriate tooltip based on status
        if (mostRecentApp.status === 'pending') {
          applyBtn.title = 'Your application is pending review';
        } else if (mostRecentApp.status === 'accepted') {
          applyBtn.title = 'You have been hired for this job';
        } else {
          applyBtn.title = 'You have already applied to this job';
        }
        console.log('🚫 Showing ALREADY APPLIED (1 pending/accepted application)');
      }
      
      console.log('✅ Apply button disabled');
    }
  } catch (error) {
    console.error('❌ Error checking for existing applications:', error);
    // Keep button enabled on error to not block legitimate applications
  }
}

const GIG_DETAIL_AD_ZONE_CONFIG = {
  enabled: true,
  zoneId: 'gig_detail_post_customer',
  rotationMode: 'random',
  ads: [
    {
      id: 'gig-detail-safety-video',
      type: 'video_popup',
      subtype: 'in_app_offer',
      imageSrc: 'public/images/womensafety.jpg',
      altText: 'Watch women safety tips while working',
      badgeText: 'Platform Update',
      action: {
        type: 'open_video_popup',
        target: 'https://www.youtube.com/shorts/BVCmz9KnwWk',
        poster: 'public/images/womensafety.jpg',
        aspectRatio: '9:16'
      }
    },
    {
      id: 'gig-detail-sponsored-partner',
      type: 'sponsored_external',
      subtype: 'sponsored_campaign',
      imageSrc: 'public/images/adsponsor.jpg',
      altText: 'Sponsored partner spotlight',
      badgeText: 'Sponsored',
      action: {
        type: 'navigate',
        url: 'https://www.RealinterfaceStudios.com'
      }
    },
    {
      id: 'gig-detail-video-updates',
      type: 'video_popup',
      subtype: 'in_app_offer',
      imageSrc: 'public/images/updatesbanner.jpg',
      altText: 'Watch latest platform updates',
      badgeText: 'Platform Update',
      action: {
        type: 'open_video_popup',
        target: 'https://youtu.be/L2GUEZpNCsQ',
        poster: 'public/images/updatesbanner.jpg',
        aspectRatio: '16:9'
      }
    },
    {
      id: 'gig-detail-offer-verify',
      type: 'site_offer',
      subtype: 'in_app_offer',
      imageSrc: 'public/images/verify.png',
      altText: 'Get verified for trust and safety',
      badgeText: '',
      action: {
        type: 'navigate',
        url: 'profile.html'
      }
    },
    {
      id: 'gig-detail-offer-share',
      type: 'site_offer',
      subtype: 'in_app_offer',
      imageSrc: 'public/images/sharebanner.jpg',
      altText: 'Share GisuGo with your network',
      badgeText: '',
      action: {
        type: 'share',
        title: 'Check out GisuGo',
        text: 'Browse local gigs and opportunities on GisuGo.',
        url: 'https://www.Gisugo.com'
      }
    }
  ]
};

let gigDetailAdVideoEscHandler = null;
const GIG_DETAIL_AD_RENDER_STATE = {
  rotationIndex: 0,
  lastRandomAdId: null,
  randomBag: [],
  randomBagSignature: ''
};

function getGigDetailSlotAd() {
  if (!GIG_DETAIL_AD_ZONE_CONFIG.enabled) return null;
  const ads = Array.isArray(GIG_DETAIL_AD_ZONE_CONFIG.ads) ? GIG_DETAIL_AD_ZONE_CONFIG.ads : [];
  const activeAds = ads.filter(ad => ad && ad.imageSrc);
  if (activeAds.length === 0) return null;

  const mode = GIG_DETAIL_AD_ZONE_CONFIG.rotationMode || 'sequential';
  if (mode === 'random') {
    return getNextRandomGigDetailAd(activeAds);
  }

  const nextAd = activeAds[GIG_DETAIL_AD_RENDER_STATE.rotationIndex % activeAds.length];
  GIG_DETAIL_AD_RENDER_STATE.rotationIndex += 1;
  return nextAd || null;
}

function getGigDetailAdPoolSignature(activeAds) {
  if (!Array.isArray(activeAds)) return '';
  return activeAds.map(ad => (ad && ad.id) ? ad.id : '').join('|');
}

function shuffleGigDetailAds(values) {
  const arr = Array.isArray(values) ? [...values] : [];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function refillGigDetailAdBag(activeAds) {
  const ids = activeAds.map(ad => ad && ad.id).filter(Boolean);
  if (ids.length === 0) {
    GIG_DETAIL_AD_RENDER_STATE.randomBag = [];
    return;
  }
  const shuffled = shuffleGigDetailAds(ids);
  if (
    shuffled.length > 1 &&
    GIG_DETAIL_AD_RENDER_STATE.lastRandomAdId &&
    shuffled[0] === GIG_DETAIL_AD_RENDER_STATE.lastRandomAdId
  ) {
    const swapIndex = 1 + Math.floor(Math.random() * (shuffled.length - 1));
    const first = shuffled[0];
    shuffled[0] = shuffled[swapIndex];
    shuffled[swapIndex] = first;
  }
  GIG_DETAIL_AD_RENDER_STATE.randomBag = shuffled;
}

function getNextRandomGigDetailAd(activeAds) {
  const signature = getGigDetailAdPoolSignature(activeAds);
  if (signature !== GIG_DETAIL_AD_RENDER_STATE.randomBagSignature) {
    GIG_DETAIL_AD_RENDER_STATE.randomBagSignature = signature;
    GIG_DETAIL_AD_RENDER_STATE.randomBag = [];
  }
  if (!Array.isArray(GIG_DETAIL_AD_RENDER_STATE.randomBag) || GIG_DETAIL_AD_RENDER_STATE.randomBag.length === 0) {
    refillGigDetailAdBag(activeAds);
  }
  if (!Array.isArray(GIG_DETAIL_AD_RENDER_STATE.randomBag) || GIG_DETAIL_AD_RENDER_STATE.randomBag.length === 0) {
    return activeAds[0] || null;
  }

  const nextId = GIG_DETAIL_AD_RENDER_STATE.randomBag.shift();
  const nextAd = activeAds.find(ad => ad && ad.id === nextId);
  if (!nextAd) {
    return getNextRandomGigDetailAd(activeAds);
  }
  GIG_DETAIL_AD_RENDER_STATE.lastRandomAdId = nextAd.id || null;
  return nextAd;
}

function ensureGigDetailAdVideoPopup() {
  let popup = document.getElementById('gigDetailAdVideoPopup');
  if (popup) return popup;

  popup = document.createElement('div');
  popup.id = 'gigDetailAdVideoPopup';
  popup.className = 'gig-detail-ad-video-popup';
  popup.innerHTML = `
    <div class="gig-detail-ad-video-backdrop" data-close="true"></div>
    <div class="gig-detail-ad-video-dialog" role="dialog" aria-modal="true" aria-label="Video offer">
      <button type="button" class="gig-detail-ad-video-close" aria-label="Close video offer">×</button>
      <video class="gig-detail-ad-video-player" controls playsinline preload="metadata"></video>
      <iframe class="gig-detail-ad-video-iframe" title="Video offer" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
    </div>
  `;
  document.body.appendChild(popup);

  const closePopup = () => {
    const player = popup.querySelector('.gig-detail-ad-video-player');
    const iframe = popup.querySelector('.gig-detail-ad-video-iframe');
    if (player) {
      player.pause();
      player.removeAttribute('src');
      player.load();
      player.style.display = 'block';
    }
    if (iframe) {
      iframe.removeAttribute('src');
      iframe.style.display = 'none';
    }
    popup.style.removeProperty('--ad-video-aspect');
    popup.classList.remove('is-visible');
  };

  const closeButton = popup.querySelector('.gig-detail-ad-video-close');
  const backdrop = popup.querySelector('.gig-detail-ad-video-backdrop');
  if (closeButton) closeButton.addEventListener('click', closePopup);
  if (backdrop) backdrop.addEventListener('click', closePopup);
  if (!gigDetailAdVideoEscHandler) {
    gigDetailAdVideoEscHandler = (event) => {
      if (event.key === 'Escape') closePopup();
    };
    DYNAMIC_JOB_CLEANUP_REGISTRY.addEventListener(document, 'keydown', gigDetailAdVideoEscHandler);
  }

  return popup;
}

function isGigDetailAdYouTubeUrl(url) {
  if (!url) return false;
  return /youtube\.com|youtu\.be/i.test(url);
}

function toGigDetailAdYouTubeEmbedUrl(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    const host = parsed.hostname.toLowerCase();

    if (host.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '').trim();
      if (!id) return '';
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    }

    if (host.includes('youtube.com') && parsed.pathname.includes('/watch')) {
      const id = parsed.searchParams.get('v');
      if (!id) return '';
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    }

    if (host.includes('youtube.com') && parsed.pathname.includes('/shorts/')) {
      const parts = parsed.pathname.split('/').filter(Boolean);
      const id = parts[1];
      if (!id) return '';
      return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    }

    if (host.includes('youtube.com') && parsed.pathname.includes('/embed/')) {
      const separator = parsed.search ? '&' : '?';
      return `${parsed.toString()}${separator}autoplay=1`;
    }
  } catch (_) {
    // fall through
  }
  return url;
}

function openGigDetailAdModal(action) {
  if (!action) return;
  const selector = action.modalSelector || action.modalId;
  if (!selector) return;

  const modal = selector.startsWith && selector.startsWith('#')
    ? document.querySelector(selector)
    : document.getElementById(selector) || document.querySelector(selector);

  if (!modal) {
    console.warn('⚠️ Gig detail ad modal target not found:', selector);
    return;
  }

  modal.classList.add('active');
  modal.classList.add('show');
  modal.classList.add('is-visible');
  modal.classList.add('open');
  modal.style.display = modal.style.display || 'flex';
  modal.setAttribute('aria-hidden', 'false');
}

function normalizeGigDetailAdShareUrl(rawUrl) {
  if (!rawUrl) return window.location.href;
  try {
    return new URL(rawUrl, window.location.href).toString();
  } catch (_) {
    return window.location.href;
  }
}

async function openGigDetailAdShare(action) {
  const shareUrl = normalizeGigDetailAdShareUrl(action && (action.url || action.target || action.shareUrl));
  const shareData = {
    title: (action && action.title) || 'GisuGo',
    text: (action && action.text) || 'Check this out on GisuGo.',
    url: shareUrl
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (_) {
      // Fallback to copy flow when native share is unavailable/cancelled.
    }
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied. You can now share it anywhere.');
      return;
    } catch (_) {
      // fall through to prompt fallback
    }
  }

  window.prompt('Copy this link to share:', shareUrl);
}

function handleGigDetailAdAction(event, adConfig) {
  const action = adConfig && adConfig.action ? adConfig.action : null;
  if (!action || !action.type) return;

  if (action.type === 'navigate' && action.url) {
    return;
  }

  event.preventDefault();

  if (action.type === 'open_modal') {
    openGigDetailAdModal(action);
    return;
  }

  if (action.type === 'open_video_popup') {
    const popup = ensureGigDetailAdVideoPopup();
    const player = popup ? popup.querySelector('.gig-detail-ad-video-player') : null;
    const iframe = popup ? popup.querySelector('.gig-detail-ad-video-iframe') : null;
    if (!player || !iframe) return;

    const sourceUrl = action.youtubeEmbed || action.videoSrc || action.target;
    if (!sourceUrl) return;
    const configuredAspect = resolveGigDetailAdAspectRatio(action);

    if (isGigDetailAdYouTubeUrl(sourceUrl)) {
      player.pause();
      player.removeAttribute('src');
      player.load();
      player.style.display = 'none';

      popup.style.setProperty('--ad-video-aspect', configuredAspect || '16 / 9');
      iframe.src = toGigDetailAdYouTubeEmbedUrl(sourceUrl);
      iframe.style.display = 'block';
      popup.classList.add('is-visible');
      return;
    }

    iframe.removeAttribute('src');
    iframe.style.display = 'none';
    player.style.display = 'block';
    popup.style.setProperty('--ad-video-aspect', configuredAspect || '16 / 9');
    player.onloadedmetadata = () => {
      if (configuredAspect) return;
      if (player.videoWidth > 0 && player.videoHeight > 0) {
        popup.style.setProperty('--ad-video-aspect', `${player.videoWidth} / ${player.videoHeight}`);
      }
    };
    player.src = sourceUrl;
    if (action.poster) {
      player.poster = action.poster;
    } else {
      player.removeAttribute('poster');
    }

    popup.classList.add('is-visible');
    const playAttempt = player.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        // Playback can require another direct tap on some mobile browsers.
      });
    }
    return;
  }

  if (action.type === 'share') {
    openGigDetailAdShare(action);
  }
}

function normalizeGigDetailAdAspectRatio(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';

  const pairMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/);
  if (pairMatch) {
    const width = Number(pairMatch[1]);
    const height = Number(pairMatch[2]);
    if (width > 0 && height > 0) return `${width} / ${height}`;
    return '';
  }

  const decimal = Number(trimmed);
  if (!Number.isFinite(decimal) || decimal <= 0) return '';
  return `${decimal} / 1`;
}

function resolveGigDetailAdAspectRatio(actionConfig) {
  if (!actionConfig) return '';
  const raw = actionConfig.aspectRatio || actionConfig.videoAspectRatio || actionConfig.ratio;
  return normalizeGigDetailAdAspectRatio(raw);
}

function shouldOpenGigDetailAdInNewTab(adConfig, href) {
  if (!adConfig || adConfig.type !== 'sponsored_external') return false;
  if (!href || href === '#') return false;
  try {
    const parsed = new URL(href, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch (_) {
    return /^https?:\/\//i.test(href);
  }
}

function createGigDetailAdCard(adConfig) {
  const adCard = document.createElement('a');
  const href = (adConfig.action && adConfig.action.type === 'navigate' && adConfig.action.url) ? adConfig.action.url : '#';
  adCard.className = 'gig-detail-slot-ad-card';
  adCard.href = href;
  adCard.setAttribute('data-ad-zone', GIG_DETAIL_AD_ZONE_CONFIG.zoneId);
  adCard.setAttribute('data-ad-id', adConfig.id || 'gig-detail-ad');
  adCard.setAttribute('data-ad-type', adConfig.type || 'generic');
  adCard.setAttribute('aria-label', adConfig.altText || 'Featured platform offer');
  if (shouldOpenGigDetailAdInNewTab(adConfig, href)) {
    adCard.target = '_blank';
    adCard.rel = 'noopener noreferrer';
  }

  adCard.innerHTML = `
    <div class="gig-detail-slot-ad-media">
      <img src="${adConfig.imageSrc}" alt="${adConfig.altText || 'Featured platform offer'}" loading="lazy">
    </div>
  `;

  adCard.addEventListener('click', (event) => handleGigDetailAdAction(event, adConfig));
  return adCard;
}

function initializeGigDetailAdSlot() {
  const customerSection = document.getElementById('customerSection');
  if (!customerSection) return;

  const existingSlot = document.getElementById('gigDetailAdSlot');
  if (existingSlot) existingSlot.remove();

  const adConfig = getGigDetailSlotAd();
  if (!adConfig) return;

  const slot = document.createElement('div');
  slot.id = 'gigDetailAdSlot';
  slot.className = 'gig-detail-ad-slot';
  slot.appendChild(createGigDetailAdCard(adConfig));

  customerSection.insertAdjacentElement('afterend', slot);
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Dynamic job page loading...');
  if (dynamicTraceIsEnabled()) {
    window.__GISUGO_IOS_TRACE = function(payload) {
      const route = String(payload && payload.route ? payload.route : '');
      if (!route.startsWith('dynamic-job:')) return;
      dynamicTrace(`${route}:${payload && payload.stage ? payload.stage : 'event'}`, payload ? payload.details : null);
    };
  }
  const safeInit = (label, fn) => {
    try {
      fn();
    } catch (error) {
      console.error(`❌ Dynamic job init failed: ${label}`, error);
    }
  };

  safeInit('loadJobData', () => { void loadJobData(); });
  safeInit('initializeMenu', initializeMenu);
  safeInit('initializeApplyJob', initializeApplyJob);
  safeInit('initializeApplicationSentOverlay', initializeApplicationSentOverlay);
  safeInit('initializeReportGigSentOverlay', initializeReportGigSentOverlay);
  safeInit('initializeReportGigLanguageTabs', initializeReportGigLanguageTabs);
  safeInit('initializeCustomerProfileLink', initializeCustomerProfileLink);
  safeInit('initializeDynamicReportModal', initializeDynamicReportModal);
  safeInit('initializeReportGigButton', initializeReportGigButton);
  safeInit('initCounterOfferFormatting', initCounterOfferFormatting);
  safeInit('initializePhotoLightbox', initializePhotoLightbox);
  safeInit('initializeGigDetailAdSlot', initializeGigDetailAdSlot);
  
  console.log('✅ Dynamic job page initialization completed');
}); 