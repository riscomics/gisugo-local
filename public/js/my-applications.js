const MY_APP_TABS = {
  active: ['pending'],
  closed: ['rejected', 'expired', 'rejected_by_worker', 'voided', 'resigned'],
  withdrawn: ['withdrawn']
};

const MY_APP_CAPTIONS = {
  pending: 'Your application is awaiting customer review.',
  rejected: 'This application is closed because another worker was selected or the customer declined your profile.',
  expired: 'This gig closed before hiring was completed.',
  rejected_by_worker: 'You declined this offer. This application token has been returned.',
  voided: 'This contract was ended by the customer. This application token has been returned.',
  resigned: 'You ended this gig before completion. This application token has been returned.',
  withdrawn: 'You withdrew this application and your token was returned.'
};

const MY_APP_STATUS_LABELS = {
  pending: 'Pending',
  rejected: 'Rejected',
  expired: 'Expired',
  rejected_by_worker: 'Rejected by Worker',
  voided: 'Expired',
  resigned: 'Rejected by Worker',
  withdrawn: 'Withdrawn'
};

const MY_APP_EMPTY_PLACEHOLDERS = {
  active: 'No applications found for this tab yet.',
  closed: 'Applications will appear here:<ul class="my-app-empty-list"><li>If it is rejected by customer.</li><li>If you are hired and complete your Gig.</li></ul>',
  withdrawn: 'Applications will appear here:<ul class="my-app-empty-list"><li>If you cancel an active application.</li></ul>'
};

const MY_APP_TAB_INTROS = {
  active: {
    icon: '',
    title: {
      english: 'Active Applications',
      bisaya: 'Aktibong Applications',
      tagalog: 'Aktibong Applications'
    },
    subtitle: {
      english: '',
      bisaya: '',
      tagalog: ''
    },
    bullets: {
      english: [
        'You get 10 FREE Tokens always.',
        'Tokens return if application is cancelled/closed.',
        'You can withdraw to cancel applications.',
        'Apply only to Gigs you are available to do!'
      ],
      bisaya: [
        'Makadawat ka ug 10 ka FREE Tokens kanunay.',
        'Mobalik ang tokens kung na-cancel o na-close ang application.',
        'Pwede ka mag-withdraw para i-cancel ang applications.',
        'Pag-apply lang sa Gigs nga available ka buhaton!'
      ],
      tagalog: [
        'Lagi kang may 10 FREE Tokens.',
        'Bumabalik ang tokens kapag cancelled/closed ang application.',
        'Pwede kang mag-withdraw para i-cancel ang applications.',
        'Mag-apply lang sa Gigs na available mong gawin!'
      ]
    },
    footer: {
      english: '',
      bisaya: '',
      tagalog: ''
    },
    confirmLabel: {
      english: 'I Understand Active Tab',
      bisaya: 'Nasabtan ang Active Tab',
      tagalog: 'Naintindihan ko ang Active Tab'
    }
  },
  closed: {
    icon: '📪',
    title: {
      english: 'Closed Applications',
      bisaya: 'Closed Applications',
      tagalog: 'Closed Applications'
    },
    subtitle: {
      english: 'Review applications that have already reached an outcome.',
      bisaya: 'Tan-awa ang applications nga naa nay resulta.',
      tagalog: 'Suriin ang applications na may final outcome na.'
    },
    bullets: {
      english: [
        'Closed includes rejected, expired, or worker-declined outcomes.',
        'Tokens return automatically when an application closes.',
        'Use status labels to learn which gigs moved fastest.'
      ],
      bisaya: [
        'Ang Closed naglakip sa rejected, expired, ug declined sa worker.',
        'Mobalik dayon ang tokens kung ma-close ang application.',
        'Gamita ang status labels aron makita kung asa ka mas dali ma-hire.'
      ],
      tagalog: [
        'Kasama sa Closed ang rejected, expired, o worker-declined outcomes.',
        'Awtomatikong bumabalik ang tokens kapag closed ang application.',
        'Gamitin ang status labels para makita kung saang gigs ka mas mabilis umusad.'
      ]
    },
    footer: {
      english: 'This history helps you refine where and how you apply next.',
      bisaya: 'Kini nga history makatabang nimo kung asa ug unsaon nimo sunod pag-apply.',
      tagalog: 'Makakatulong ang history na ito para mas gumanda ang susunod mong pag-apply.'
    },
    confirmLabel: {
      english: 'I Understand Closed Tab',
      bisaya: 'Nasabtan ang Closed Tab',
      tagalog: 'Naintindihan ko ang Closed Tab'
    }
  },
  withdrawn: {
    icon: '↩️',
    title: {
      english: 'Withdrawn Applications',
      bisaya: 'Withdrawn Applications',
      tagalog: 'Withdrawn Applications'
    },
    subtitle: {
      english: 'Manage records of gigs you voluntarily pulled back from.',
      bisaya: 'I-manage ang records sa gigs nga imong gi-withdrawan.',
      tagalog: 'I-manage ang records ng gigs na kusa mong winithdraw.'
    },
    bullets: {
      english: [
        'Withdrawn applications are removed from active consideration.',
        'Your held token is returned after withdrawal.',
        'Use this to free tokens when you need to prioritize better opportunities.'
      ],
      bisaya: [
        'Ang withdrawn applications dili na i-consider sa customer.',
        'Mobalik ang imong token human sa withdrawal.',
        'Gamita ni aron ma-free ang tokens para sa mas importante nga opportunities.'
      ],
      tagalog: [
        'Ang withdrawn applications ay hindi na kasama sa active review ng customer.',
        'Bumabalik ang token mo pagkatapos ng withdrawal.',
        'Gamitin ito para mag-free ng tokens sa mas mahalagang opportunities.'
      ]
    },
    footer: {
      english: 'Withdraw only when needed so your profile remains intentional and reliable.',
      bisaya: 'Pag-withdraw lang kung kinahanglan aron magpabiling klaro ug kasaligan imong profile.',
      tagalog: 'Mag-withdraw lang kung kailangan para manatiling intentional at reliable ang profile mo.'
    },
    confirmLabel: {
      english: 'I Understand Withdrawn Tab',
      bisaya: 'Nasabtan ang Withdrawn Tab',
      tagalog: 'Naintindihan ko ang Withdrawn Tab'
    }
  }
};

let activeTab = 'active';
let allApplications = [];
let currentWorkerId = '';
let activeTutorialLang = 'english';
let tabsInitialized = false;
let authObserverUnsubscribe = null;
let tabIntroConfirmed = {
  active: false,
  closed: false,
  withdrawn: false
};

function getCoinCacheKey(userId) {
  return `gisugo_my_app_coin_cache_${String(userId || '').trim()}`;
}

function readCachedCoinStatus(userId) {
  try {
    const key = getCoinCacheKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const current = Number(parsed?.current);
    if (!Number.isFinite(current)) return null;
    return { current: Math.max(0, current) };
  } catch (_) {
    return null;
  }
}

function writeCachedCoinStatus(userId, current) {
  try {
    const key = getCoinCacheKey(userId);
    localStorage.setItem(key, JSON.stringify({
      current: Math.max(0, Number(current) || 0),
      updatedAt: Date.now()
    }));
  } catch (_) {
    // Ignore cache write failures.
  }
}

function getIntroStorageKey() {
  return `gisugo_my_app_intro_seen_${currentWorkerId || 'guest'}`;
}

function loadTabIntroState() {
  try {
    const raw = localStorage.getItem(getIntroStorageKey());
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return;
    tabIntroConfirmed = {
      active: !!parsed.active,
      closed: !!parsed.closed,
      withdrawn: !!parsed.withdrawn
    };
  } catch (_) {
    // Ignore malformed localStorage.
  }
}

function saveTabIntroState() {
  try {
    localStorage.setItem(getIntroStorageKey(), JSON.stringify(tabIntroConfirmed));
  } catch (_) {
    // Ignore storage write failures.
  }
}

function getLocalizedIntroCopy(intro, key) {
  const value = intro?.[key];
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[activeTutorialLang] || value.english || '';
}

function getLocalizedIntroList(intro) {
  const list = intro?.bullets;
  if (!list) return [];
  if (Array.isArray(list)) return list;
  return list[activeTutorialLang] || list.english || [];
}

function renderTabIntro(container) {
  const intro = MY_APP_TAB_INTROS[activeTab] || MY_APP_TAB_INTROS.active;
  const bullets = getLocalizedIntroList(intro);
  container.innerHTML = `
    <section class="my-app-intro">
      <div class="my-app-intro-lang-tabs" id="myAppIntroLangTabs">
        <button class="my-app-intro-lang-tab ${activeTutorialLang === 'english' ? 'active' : ''}" data-lang="english">English</button>
        <button class="my-app-intro-lang-tab ${activeTutorialLang === 'bisaya' ? 'active' : ''}" data-lang="bisaya">Bisaya</button>
        <button class="my-app-intro-lang-tab ${activeTutorialLang === 'tagalog' ? 'active' : ''}" data-lang="tagalog">Tagalog</button>
      </div>
      <div class="my-app-intro-hero">
        <div class="my-app-intro-icon">${intro.icon}</div>
        <div class="my-app-intro-title">${getLocalizedIntroCopy(intro, 'title')}</div>
      </div>
      <div class="my-app-intro-coin-banner">
        <span class="rule-prefix">${activeTutorialLang === 'english' ? 'Each time you Apply costs 1' : activeTutorialLang === 'bisaya' ? 'Sa matag pag-Apply, mugasto og 1 ka' : 'Sa bawat pag-Apply, may cost na 1'}</span>
        <span class="coin-dot coin-dot-g"><span class="coin-dot-letter">G</span></span>
        <span class="rule-suffix"></span>
      </div>
      <div class="my-app-intro-subtitle">${getLocalizedIntroCopy(intro, 'subtitle')}</div>
      <ul class="my-app-intro-list">
        ${bullets.map((line) => `<li>${line}</li>`).join('')}
      </ul>
      <div class="my-app-intro-footer">${getLocalizedIntroCopy(intro, 'footer')}</div>
      <button class="my-app-intro-confirm-btn" id="myAppIntroConfirmBtn">${getLocalizedIntroCopy(intro, 'confirmLabel')}</button>
    </section>
  `;

  const langTabs = container.querySelectorAll('.my-app-intro-lang-tab');
  langTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTutorialLang = tab.getAttribute('data-lang') || 'english';
      renderTabIntro(container);
    });
  });

  const confirmBtn = document.getElementById('myAppIntroConfirmBtn');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      tabIntroConfirmed[activeTab] = true;
      saveTabIntroState();
      renderApplicationCards();
    });
  }
}

function formatDateForCard(value) {
  if (!value) return 'Just now';
  try {
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString();
  } catch (_) {
    return 'Just now';
  }
}

function getCaptionForStatus(status) {
  return MY_APP_CAPTIONS[String(status || '').trim()] || 'Application status updated.';
}

function getStatusLabel(status) {
  return MY_APP_STATUS_LABELS[String(status || '').trim()] || 'Closed';
}

function classifyCardState(status) {
  if (activeTab === 'active') return 'active';
  if (activeTab === 'withdrawn') return 'withdrawn';
  if (status === 'withdrawn') return 'withdrawn';
  return 'closed';
}

async function navigateToGigPost(application) {
  const jobId = String(application.jobId || '').trim();
  if (!jobId) return;
  let category = String(application.category || '').trim().toLowerCase();
  if (!category && typeof getJobById === 'function') {
    const job = await getJobById(jobId);
    category = String(job?.category || '').trim().toLowerCase();
  }
  if (!category) {
    alert('Gig post is no longer available.');
    return;
  }
  window.location.href = `dynamic-job.html?category=${encodeURIComponent(category)}&jobId=${encodeURIComponent(jobId)}`;
}

async function handleWithdrawApplication(applicationId) {
  if (!applicationId) return;
  const confirmWithdraw = window.confirm('Withdraw this application? Your token will be returned.');
  if (!confirmWithdraw) return;
  if (typeof withdrawWorkerApplication !== 'function') {
    alert('Withdraw function is unavailable right now.');
    return;
  }
  const result = await withdrawWorkerApplication(applicationId);
  if (!result?.success) {
    alert(result?.message || 'Could not withdraw this application right now.');
    return;
  }
  await Promise.all([loadCoinStatus(), loadApplications()]);
}

function renderApplicationCards() {
  const targetId = `${activeTab}ApplicationsList`;
  const container = document.getElementById(targetId);
  if (!container) return;

  // Keep the guided tutorial only for the Active tab.
  if (activeTab === 'active' && !tabIntroConfirmed[activeTab]) {
    renderTabIntro(container);
    return;
  }

  const statuses = MY_APP_TABS[activeTab] || [];
  const records = allApplications
    .filter((application) => statuses.includes(String(application.status || '').trim()))
    .sort((a, b) => {
      const aDate = new Date(a.appliedAt?.toDate ? a.appliedAt.toDate() : a.appliedAt || 0).getTime() || 0;
      const bDate = new Date(b.appliedAt?.toDate ? b.appliedAt.toDate() : b.appliedAt || 0).getTime() || 0;
      return bDate - aDate;
    });

  if (records.length === 0) {
    const placeholder = MY_APP_EMPTY_PLACEHOLDERS[activeTab] || MY_APP_EMPTY_PLACEHOLDERS.active;
    container.innerHTML = `<div class="my-app-empty">${placeholder}</div>`;
    return;
  }

  container.innerHTML = records.map((application) => {
    const status = String(application.status || '').trim();
    const cardState = classifyCardState(status);
    const canWithdraw = activeTab === 'active' && status === 'pending';
    return `
      <article class="my-application-card" data-application-id="${application.id || ''}">
        <div class="my-application-head">
          <div class="my-application-title">${application.jobTitle || 'Gig Application'}</div>
          <div class="my-application-date">${formatDateForCard(application.appliedAt)}</div>
        </div>
        <div class="my-application-status ${cardState}">${getStatusLabel(status)}</div>
        <div class="my-application-caption">${getCaptionForStatus(status)}</div>
        <div class="my-application-actions">
          <button class="my-application-btn view" data-action="view" data-application-id="${application.id || ''}">VIEW GIG POST</button>
          ${canWithdraw ? `<button class="my-application-btn withdraw" data-action="withdraw" data-application-id="${application.id || ''}">WITHDRAW APPLICATION</button>` : ''}
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('button[data-action="view"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appId = btn.getAttribute('data-application-id');
      const app = allApplications.find((entry) => String(entry.id || '') === String(appId || ''));
      if (app) await navigateToGigPost(app);
    });
  });

  container.querySelectorAll('button[data-action="withdraw"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const appId = btn.getAttribute('data-application-id');
      await handleWithdrawApplication(appId);
    });
  });
}

function updateTabCounts() {
  Object.entries(MY_APP_TABS).forEach(([tabId, statuses]) => {
    const count = allApplications.filter((item) => statuses.includes(String(item.status || '').trim())).length;
    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"] .notification-count`);
    if (btn) btn.textContent = String(count);
  });
}

async function loadApplications() {
  if (!currentWorkerId || typeof getWorkerApplications !== 'function') return;
  allApplications = await getWorkerApplications(currentWorkerId);
  updateTabCounts();
  renderApplicationCards();
}

async function loadCoinStatus() {
  const valueEl = document.getElementById('coinStatusValue');
  const captionEl = document.getElementById('coinStatusCaption');
  const strip = document.getElementById('coinStatusStrip');
  if (!valueEl || !captionEl || !strip || !currentWorkerId || typeof getUserApplicationCoinStatus !== 'function') return;
  const cached = readCachedCoinStatus(currentWorkerId);
  if (cached) {
    valueEl.textContent = String(cached.current);
    strip.classList.toggle('low', cached.current <= 2);
    captionEl.textContent = cached.current <= 2
      ? 'Low tokens. Withdraw a pending application to recover one.'
      : '';
    valueEl.classList.remove('loading');
  } else {
    valueEl.classList.add('loading');
  }
  try {
    const result = await getUserApplicationCoinStatus(currentWorkerId);
    const current = Number(result?.current ?? 0);
    valueEl.textContent = String(current);
    strip.classList.toggle('low', current <= 2);
    captionEl.textContent = current <= 2
      ? 'Low tokens. Withdraw a pending application to recover one.'
      : '';
    writeCachedCoinStatus(currentWorkerId, current);
  } finally {
    valueEl.classList.remove('loading');
  }
}

function switchTab(tabId) {
  activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content-wrapper').forEach((wrapper) => {
    const visible = wrapper.id === `${tabId}-content`;
    wrapper.style.display = visible ? 'block' : 'none';
    wrapper.classList.toggle('active', visible);
  });
  renderApplicationCards();
}

function initializeTabs() {
  if (tabsInitialized) return;
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });
  tabsInitialized = true;
}

async function initializeMyApplicationsPage() {
  const user = firebase?.auth?.().currentUser;
  if (!user || !user.uid) {
    window.location.href = 'login.html';
    return;
  }
  currentWorkerId = user.uid;
  loadTabIntroState();
  initializeTabs();
  // Render immediately (especially the Active tutorial) before network calls.
  renderApplicationCards();
  // Prioritize token display first; applications list can fill in afterward.
  Promise.resolve(loadCoinStatus()).catch((error) => {
    console.warn('⚠️ My Applications coin status load failed:', error);
  });
  Promise.resolve(loadApplications()).catch((error) => {
    console.warn('⚠️ My Applications applications load failed:', error);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!firebase?.auth) return;
  if (authObserverUnsubscribe) return;
  authObserverUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    initializeMyApplicationsPage();
  });
});

window.addEventListener('pagehide', () => {
  if (typeof authObserverUnsubscribe === 'function') {
    authObserverUnsubscribe();
    authObserverUnsubscribe = null;
  }
});
