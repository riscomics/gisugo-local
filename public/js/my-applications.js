const MY_APP_TABS = {
  active: ['pending'],
  closed: ['rejected', 'expired', 'rejected_by_worker', 'voided', 'resigned'],
  withdrawn: ['withdrawn']
};

const MY_APP_CAPTIONS = {
  pending: 'Your application is awaiting customer review.',
  rejected: 'This application is closed because another worker was selected or the customer declined your profile.',
  expired: 'This gig closed before hiring was completed.',
  rejected_by_worker: 'You declined this offer. This application coin has been returned.',
  voided: 'This contract was ended by the customer. This application coin has been returned.',
  resigned: 'You ended this gig before completion. This application coin has been returned.',
  withdrawn: 'You withdrew this application and your coin was returned.'
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

let activeTab = 'active';
let allApplications = [];
let currentWorkerId = '';

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
  const confirmWithdraw = window.confirm('Withdraw this application? Your coin will be returned.');
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

  const statuses = MY_APP_TABS[activeTab] || [];
  const records = allApplications
    .filter((application) => statuses.includes(String(application.status || '').trim()))
    .sort((a, b) => {
      const aDate = new Date(a.appliedAt?.toDate ? a.appliedAt.toDate() : a.appliedAt || 0).getTime() || 0;
      const bDate = new Date(b.appliedAt?.toDate ? b.appliedAt.toDate() : b.appliedAt || 0).getTime() || 0;
      return bDate - aDate;
    });

  if (records.length === 0) {
    container.innerHTML = '<div class="my-app-empty">No applications found for this tab yet.</div>';
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
  const result = await getUserApplicationCoinStatus(currentWorkerId);
  const current = Number(result?.current ?? 0);
  const max = Number(result?.max ?? 10);
  valueEl.textContent = `${current} / ${max}`;
  strip.classList.toggle('low', current <= 2);
  captionEl.textContent = current <= 2
    ? 'Low coins. Withdraw a pending application to recover one.'
    : 'Coins Return when Closed.';
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
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });
}

async function initializeMyApplicationsPage() {
  const user = firebase?.auth?.().currentUser;
  if (!user || !user.uid) {
    window.location.href = 'login.html';
    return;
  }
  currentWorkerId = user.uid;
  initializeTabs();
  await Promise.all([loadCoinStatus(), loadApplications()]);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!firebase?.auth) return;
  firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }
    initializeMyApplicationsPage();
  });
});
