/**
 * Support compose overlay — Contact form merged into Support (Write icon).
 * Writes the same support_requests schema as contacts.js.
 */
(function initSupportCompose(global) {
  let isSubmitting = false;
  let uploadedPhoto = null;
  let composeInitialized = false;

  function getSharedSupportTopics() {
    const taxonomy = global.GISUGO_SUPPORT_TAXONOMY;
    if (taxonomy && Array.isArray(taxonomy.publicContactTopics) && taxonomy.publicContactTopics.length) {
      return taxonomy.publicContactTopics;
    }
    return [
      { code: 'account_issues', label: 'Account Issues' },
      { code: 'complaints_disputes', label: 'Complaints & Disputes' },
      { code: 'feature_request', label: 'Feature Request' },
      { code: 'bug_report', label: 'Bug Report' },
      { code: 'safety_security', label: 'Safety & Security' },
      { code: 'payment_billing', label: 'Payment & Billing' },
      { code: 'partners_sponsors', label: 'Partners & Sponsors' },
      { code: 'other', label: 'Other' }
    ];
  }

  function isAllowedContactTextCharacter(char) {
    if (!char) return true;
    if (/[\p{L}\p{N}\p{M}\p{Zs}\r\n]/u.test(char)) return true;
    if (/[.,!?'"()\/$&@₱%+=-]/.test(char)) return true;
    if (/[’‘]/.test(char)) return true;
    if (/[\p{Extended_Pictographic}\u200D\uFE0F]/u.test(char)) return true;
    return false;
  }

  function sanitizeContactTextInput(value) {
    return Array.from(String(value || ''))
      .filter(isAllowedContactTextCharacter)
      .join('');
  }

  function contactHasUnsupportedTextChars(value) {
    return Array.from(String(value || ''))
      .some((char) => !isAllowedContactTextCharacter(char));
  }

  function showComposeInputGuide(message) {
    let hint = document.getElementById('support-compose-input-guide');
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'support-compose-input-guide';
      hint.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: min(88vw, 360px); padding: 8px; border-radius: 16px;
        background: repeating-linear-gradient(135deg, #facc15 0 10px, #111827 10px 20px);
        color: #fee2e2; text-align: center;
        box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.55), 0 20px 40px rgba(0,0,0,0.45);
        z-index: 12000; opacity: 0; transition: opacity 0.2s ease; pointer-events: none;
      `;
      document.body.appendChild(hint);
    }
    hint.innerHTML = `
      <div style="background:linear-gradient(180deg, rgba(127, 29, 29, 0.98), rgba(69, 10, 10, 0.98)); border:1px solid rgba(248,113,113,0.7); border-radius:12px; padding:12px 14px 14px;">
        <div style="font-size:30px; line-height:1; margin-bottom:6px;">🚨</div>
        <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; margin-bottom:8px;">SECURITY ALERT</div>
        <div style="font-size:14px; font-weight:600; line-height:1.38;">${message}</div>
      </div>
    `;
    hint.style.opacity = '1';
    clearTimeout(global.__supportComposeGuideTimer);
    global.__supportComposeGuideTimer = setTimeout(() => { hint.style.opacity = '0'; }, 3200);
  }

  function blockUnsupportedCharsForComposeInput(inputEl) {
    if (!inputEl || inputEl.dataset.markupCharsBlocked === 'true') return;
    inputEl.dataset.markupCharsBlocked = 'true';

    const showGuide = () => {
      const now = Date.now();
      const lastShownAt = Number(inputEl.dataset.inputGuideShownAt || 0);
      if (now - lastShownAt < 1500) return;
      inputEl.dataset.inputGuideShownAt = String(now);
      showComposeInputGuide('Only letters, numbers, emojis, spaces, and basic punctuation are allowed.');
    };

    inputEl.addEventListener('keydown', function (e) {
      if (e.key.length === 1 && !isAllowedContactTextCharacter(e.key)) {
        e.preventDefault();
        showGuide();
      }
    });

    inputEl.addEventListener('paste', function (e) {
      const pastedText = e.clipboardData ? e.clipboardData.getData('text') : '';
      if (!contactHasUnsupportedTextChars(pastedText)) return;
      e.preventDefault();
      showGuide();
      const cleaned = sanitizeContactTextInput(pastedText);
      const start = inputEl.selectionStart ?? inputEl.value.length;
      const end = inputEl.selectionEnd ?? inputEl.value.length;
      inputEl.setRangeText(cleaned, start, end, 'end');
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
    });

    inputEl.addEventListener('input', function () {
      const sanitized = sanitizeContactTextInput(inputEl.value);
      if (sanitized !== inputEl.value) {
        inputEl.value = sanitized;
        showGuide();
      }
    });
  }

  function populateComposeTopicOptions() {
    const topicSelect = document.getElementById('composeTopic');
    if (!topicSelect) return;
    const topics = getSharedSupportTopics();
    topicSelect.innerHTML = [
      '<option value="">Select a topic...</option>',
      ...topics.map((t) => `<option value="${t.code}">${t.label}</option>`)
    ].join('');
  }

  function getTopicDisplayName(code) {
    return getSharedSupportTopics().find((t) => t.code === code)?.label || code || 'Support';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));
  }

  function generateReferenceId() {
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const stamp = Date.now().toString().slice(-4);
    return `CONTACT-${y}${m}${d}-${stamp}`;
  }

  function getCurrentUserId() {
    try {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        return user ? user.uid : null;
      }
    } catch (_) { /* ignore */ }
    return null;
  }

  async function preloadComposeUserData() {
    let currentUser = null;
    try {
      if (typeof firebase !== 'undefined' && firebase.auth) {
        currentUser = firebase.auth().currentUser;
      }
    } catch (_) { /* ignore */ }
    if (!currentUser) return;

    const nameField = document.getElementById('composeName');
    const emailField = document.getElementById('composeEmail');

    // Prefer Firestore profile fullName (Auth displayName is often empty for phone accounts).
    let profile = null;
    try {
      if (typeof global.getUserProfile === 'function') {
        profile = await global.getUserProfile(currentUser.uid);
      }
    } catch (_) { /* ignore */ }

    if (nameField) {
      const profileName = String(profile && profile.fullName ? profile.fullName : '').trim();
      const nextName = profileName || String(currentUser.displayName || '').trim();
      if (nextName) nameField.value = nextName;
    }

    // Never prefill synthetic phone-login mailboxes (…@phone.gisugo.app) — those
    // are Auth credentials only, not a reachable inbox for Support replies.
    if (emailField) {
      const authEmail = String(currentUser.email || '').trim();
      const profileEmail = String(profile && profile.email ? profile.email : '').trim();
      const isSyntheticEmail = (email) => (
        typeof global.isSyntheticPhoneEmail === 'function'
          ? global.isSyntheticPhoneEmail(email)
          : /@phone\.gisugo\.app$/i.test(String(email || ''))
      );
      // Leave empty for phone+password (synthetic) accounts — user types a real email.
      const candidate = (!isSyntheticEmail(authEmail) && authEmail) || profileEmail || '';
      emailField.value = candidate && !isSyntheticEmail(candidate) ? candidate : '';
      emailField.placeholder = '';
    }
  }

  function hasComposeChanges() {
    // Ignore prefilled name/email — only topic, message, or photo count as "dirty".
    const topic = document.getElementById('composeTopic');
    const message = document.getElementById('composeMessage');
    if (topic && String(topic.value || '').trim()) return true;
    if (message && String(message.value || '').trim()) return true;
    return !!uploadedPhoto;
  }

  function resetComposeForm() {
    const form = document.getElementById('supportComposeForm');
    if (form) form.reset();
    const messageCount = document.getElementById('composeMessageCount');
    if (messageCount) messageCount.textContent = '0';
    removeComposePhoto();
    form?.querySelectorAll('.error-text').forEach((el) => el.remove());
    form?.querySelectorAll('.error').forEach((el) => el.classList.remove('error'));
    void preloadComposeUserData();
  }

  function removeComposePhoto() {
    const photoInput = document.getElementById('composePhotoInput');
    const preview = document.getElementById('composePhotoPreview');
    if (photoInput) photoInput.value = '';
    if (preview) preview.style.display = 'none';
    uploadedPhoto = null;
  }

  function validateComposeField(field) {
    if (!field) return true;
    const value = field.value.trim();
    field.classList.remove('error');
    const existing = field.parentNode.querySelector('.error-text');
    if (existing) existing.remove();

    let isValid = true;
    let errorMessage = '';
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (field.id === 'composeName' && value) {
      if (contactHasUnsupportedTextChars(value)) {
        isValid = false;
        errorMessage = 'Name has unsupported symbols';
      } else if (value.length < 2) {
        isValid = false;
        errorMessage = 'Name must be at least 2 characters';
      }
    } else if (field.id === 'composeEmail' && value && !isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (field.id === 'composeMessage' && value) {
      if (contactHasUnsupportedTextChars(value)) {
        isValid = false;
        errorMessage = 'Message has unsupported symbols';
      } else if (value.length < 10) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters';
      }
    }

    if (!isValid) {
      field.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-text';
      errorDiv.textContent = errorMessage;
      field.parentNode.appendChild(errorDiv);
    }
    return isValid;
  }

  function validateComposeForm() {
    const ids = ['composeName', 'composeEmail', 'composeTopic', 'composeMessage'];
    return ids.every((id) => validateComposeField(document.getElementById(id)));
  }

  function setComposeBusy(busy) {
    const sendBtn = document.getElementById('sendComposeBtn');
    if (!sendBtn) return;
    sendBtn.disabled = !!busy;
    sendBtn.textContent = busy ? 'Sending...' : 'Send Message';
    sendBtn.style.opacity = busy ? '0.7' : '1';
  }

  function showComposeStatus(kind, title, message) {
    const overlay = document.getElementById('composeStatusOverlay');
    const iconEl = document.getElementById('composeStatusIcon');
    const titleEl = document.getElementById('composeStatusTitle');
    const msgEl = document.getElementById('composeStatusMessage');
    if (!overlay || !iconEl || !titleEl || !msgEl) {
      window.alert(message || title);
      return;
    }
    iconEl.textContent = kind === 'success' ? '✓' : '⚠️';
    titleEl.textContent = title || (kind === 'success' ? 'Message Sent' : 'Error');
    msgEl.textContent = message || '';
    overlay.style.display = 'flex';
    overlay.dataset.kind = kind || 'error';
  }

  function hideComposeStatus() {
    const overlay = document.getElementById('composeStatusOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  async function uploadComposePhoto(file, referenceId, userId) {
    const useFirebaseData = !!(
      global.APP_CONFIG &&
      typeof global.APP_CONFIG.useFirebaseData === 'function' &&
      global.APP_CONFIG.useFirebaseData()
    );
    if (useFirebaseData && typeof global.uploadSupportPhoto === 'function') {
      const uploadResult = await global.uploadSupportPhoto(referenceId, file, userId);
      if (!uploadResult.success) {
        throw new Error((uploadResult.errors && uploadResult.errors[0]) || 'Photo upload failed');
      }
      return { url: uploadResult.url || null, path: uploadResult.path || null };
    }
    throw new Error('Photo upload backend unavailable');
  }

  async function submitSupportRequest(contactData) {
    const db = typeof getFirestore === 'function' ? getFirestore() : null;
    const useFirebaseData = !!(
      global.APP_CONFIG &&
      typeof global.APP_CONFIG.useFirebaseData === 'function' &&
      global.APP_CONFIG.useFirebaseData()
    );
    if (!db || !useFirebaseData) throw new Error('Support backend unavailable');

    const serverTimestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
      ? firebase.firestore.FieldValue.serverTimestamp()
      : new Date();

    const docRef = await db.collection('support_requests').add({
      ...contactData,
      createdAt: serverTimestamp,
      updatedAt: serverTimestamp,
      lastUpdatedAt: serverTimestamp
    });
    contactData.supportRequestId = docRef.id;
    return docRef.id;
  }

  async function handleComposeSubmit(event) {
    if (event) event.preventDefault();
    if (isSubmitting) return;
    if (!validateComposeForm()) {
      showComposeStatus('error', 'Check the form', 'Please fix the highlighted fields and try again.');
      return;
    }

    isSubmitting = true;
    setComposeBusy(true);
    let uploadedPhotoPathForCleanup = null;

    try {
      const userId = getCurrentUserId();
      if (!userId) {
        throw new Error('Please log in to send a support request.');
      }

      const categoryCode = document.getElementById('composeTopic').value;
      const categoryLabel = getTopicDisplayName(categoryCode);
      // Topic replaces the old Subject field — store the topic label as subject for admin/inbox.
      const formData = {
        userName: sanitizeContactTextInput(document.getElementById('composeName').value.trim()),
        userEmail: document.getElementById('composeEmail').value.trim(),
        categoryCode,
        subject: categoryLabel,
        message: sanitizeContactTextInput(document.getElementById('composeMessage').value.trim())
      };

      const referenceId = generateReferenceId();
      let uploadedPhotoUrl = null;
      let uploadedPhotoPath = null;

      if (uploadedPhoto) {
        const uploadMeta = await uploadComposePhoto(uploadedPhoto, referenceId, userId);
        uploadedPhotoUrl = uploadMeta.url;
        uploadedPhotoPath = uploadMeta.path || null;
        uploadedPhotoPathForCleanup = uploadedPhotoPath;
      }

      const now = new Date();
      const contactData = {
        source: 'public_contact',
        messageType: 'support_request',
        channel: 'support_page',
        categoryCode: formData.categoryCode,
        categoryLabel,
        subject: formData.subject,
        message: formData.message,
        requester: {
          userId,
          guestSessionId: null,
          name: formData.userName,
          email: formData.userEmail
        },
        attachments: {
          photoUrl: uploadedPhotoUrl || null,
          photoPath: uploadedPhotoPath || null
        },
        status: 'pending',
        priority: 'normal',
        assignedTo: null,
        isReadByRequester: false,
        referenceId,
        createdAtISO: now.toISOString(),
        updatedAtISO: now.toISOString(),
        lastUpdatedAtISO: now.toISOString(),
        createdAtMs: now.getTime(),
        updatedAtMs: now.getTime(),
        lastUpdatedAtMs: now.getTime(),
        topic: formData.categoryCode,
        userName: formData.userName,
        userEmail: formData.userEmail,
        userId,
        photoUrl: uploadedPhotoUrl,
        timestamp: now
      };

      await submitSupportRequest(contactData);
      uploadedPhotoPathForCleanup = null;

      resetComposeForm();
      closeSupportComposeModal({ force: true });
      showComposeStatus(
        'success',
        'Message Sent!',
        `Reference: ${referenceId}\nTopic: ${categoryLabel}\n\nWe'll get back to you within 24–48 hours. Your request will appear in this inbox.`
      );
    } catch (error) {
      console.error('Support compose submit failed:', error);
      if (uploadedPhotoPathForCleanup && typeof global.deleteFile === 'function') {
        try { await global.deleteFile(uploadedPhotoPathForCleanup); } catch (_) { /* ignore */ }
      }
      showComposeStatus('error', 'Could not send', error.message || 'Please try again.');
    } finally {
      isSubmitting = false;
      setComposeBusy(false);
    }
  }

  function openSupportComposeModal() {
    const overlay = document.getElementById('composeOverlay');
    if (!overlay) return;
    initializeSupportCompose();
    void preloadComposeUserData();
    overlay.style.display = 'flex';
    document.body.classList.add('support-compose-open');
    const first = document.getElementById('composeTopic') || document.getElementById('composeMessage');
    if (first) setTimeout(() => first.focus(), 80);
  }

  function closeSupportComposeModal(options = {}) {
    const force = options.force === true;
    if (!force && hasComposeChanges()) {
      const ok = window.confirm('You have unsaved changes. Discard this request?');
      if (!ok) return;
    }
    const overlay = document.getElementById('composeOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('support-compose-open');
    if (force || hasComposeChanges()) {
      // Only wipe after send (force) or confirmed discard.
      if (force) resetComposeForm();
      else resetComposeForm();
    }
  }

  function initializeSupportCompose() {
    if (composeInitialized) return;
    const form = document.getElementById('supportComposeForm');
    if (!form) return;

    populateComposeTopicOptions();

    ['composeName', 'composeMessage'].forEach((id) => {
      blockUnsupportedCharsForComposeInput(document.getElementById(id));
    });

    const messageInput = document.getElementById('composeMessage');
    const messageCount = document.getElementById('composeMessageCount');
    if (messageInput && messageCount) {
      messageInput.addEventListener('input', () => {
        messageCount.textContent = String(messageInput.value.length);
      });
    }

    const photoInput = document.getElementById('composePhotoInput');
    if (photoInput) {
      photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;
        const maxSize = 5 * 1024 * 1024;
        const allowed = ['image/jpeg', 'image/png', 'image/gif'];
        if (file.size > maxSize) {
          showComposeStatus('error', 'Photo too large', 'Photo file size must be under 5MB');
          photoInput.value = '';
          return;
        }
        if (!allowed.includes(file.type)) {
          showComposeStatus('error', 'Unsupported file', 'Only JPG, PNG, and GIF files are supported');
          photoInput.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.getElementById('composePhotoPreviewImg');
          const preview = document.getElementById('composePhotoPreview');
          if (img) img.src = e.target.result;
          if (preview) preview.style.display = 'block';
          uploadedPhoto = file;
        };
        reader.readAsDataURL(file);
      });
    }

    form.addEventListener('submit', handleComposeSubmit);

    document.getElementById('closeComposeModal')?.addEventListener('click', () => closeSupportComposeModal());
    document.getElementById('cancelComposeBtn')?.addEventListener('click', () => closeSupportComposeModal());
    document.getElementById('openSupportComposeBtn')?.addEventListener('click', () => openSupportComposeModal());
    document.getElementById('composeStatusOkBtn')?.addEventListener('click', () => {
      const overlay = document.getElementById('composeStatusOverlay');
      const wasSuccess = overlay && overlay.dataset.kind === 'success';
      hideComposeStatus();
      if (wasSuccess && typeof global.loadUnifiedMessages === 'function') {
        try { global.loadUnifiedMessages(); } catch (_) { /* ignore */ }
      }
    });

    document.getElementById('composeOverlay')?.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'composeOverlay') {
        closeSupportComposeModal();
      }
    });

    composeInitialized = true;
  }

  function maybeOpenComposeFromUrl() {
    try {
      const params = new URLSearchParams(global.location.search || '');
      if (params.get('compose') === '1') {
        openSupportComposeModal();
        params.delete('compose');
        const query = params.toString();
        const nextUrl = `${global.location.pathname}${query ? `?${query}` : ''}${global.location.hash || ''}`;
        global.history.replaceState({}, '', nextUrl);
      }
    } catch (_) { /* ignore */ }
  }

  global.openSupportComposeModal = openSupportComposeModal;
  global.closeSupportComposeModal = closeSupportComposeModal;
  global.initializeSupportCompose = initializeSupportCompose;
  global.maybeOpenComposeFromUrl = maybeOpenComposeFromUrl;
  global.removeComposePhoto = removeComposePhoto;
})(window);
