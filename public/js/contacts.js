// GISUGO Contacts Page JavaScript

// ===== GLOBAL VARIABLES =====
let isSubmitting = false;
let uploadedPhoto = null;
let currentFormData = null;
const SUPPORT_GUEST_SESSION_KEY = 'gisugo_support_guest_session_id';

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

function showContactInputGuide(message) {
    let hint = document.getElementById('contacts-input-guide');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'contacts-input-guide';
        hint.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: min(88vw, 360px);
            padding: 8px;
            border-radius: 16px;
            background: repeating-linear-gradient(135deg, #facc15 0 10px, #111827 10px 20px);
            color: #fee2e2;
            text-align: center;
            box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.55), 0 20px 40px rgba(0,0,0,0.45);
            z-index: 11000;
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
            <div style="font-size:14px; font-weight:600; line-height:1.38;">${message}</div>
        </div>
    `;
    hint.style.opacity = '1';
    hint.style.transform = 'translate(-50%, -50%) scale(1)';
    clearTimeout(window.__contactsInputGuideTimer);
    window.__contactsInputGuideTimer = setTimeout(() => {
        hint.style.opacity = '0';
        hint.style.transform = 'translate(-50%, -50%) scale(0.98)';
    }, 3200);
}

function blockUnsupportedCharsForContactInput(inputEl) {
    if (!inputEl || inputEl.dataset.markupCharsBlocked === 'true') return;
    inputEl.dataset.markupCharsBlocked = 'true';

    const showGuide = () => {
        const now = Date.now();
        const lastShownAt = Number(inputEl.dataset.inputGuideShownAt || 0);
        if (now - lastShownAt < 1500) return;
        inputEl.dataset.inputGuideShownAt = String(now);
        showContactInputGuide('Only letters, numbers, emojis, spaces, and basic punctuation are allowed.');
    };

    inputEl.addEventListener('keydown', function(e) {
        if (e.key.length === 1 && !isAllowedContactTextCharacter(e.key)) {
            e.preventDefault();
            showGuide();
        }
    });

    inputEl.addEventListener('paste', function(e) {
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

    inputEl.addEventListener('input', function() {
        const sanitized = sanitizeContactTextInput(inputEl.value);
        if (sanitized !== inputEl.value) {
            inputEl.value = sanitized;
            showGuide();
        }
    });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Contacts page loaded');

    initializeContactTopicOptions();
    initializeForm();
    initializeCharacterCounters();
    initializePhotoUpload();
    setupFormValidation();
    initializeContactInputSecurity();
    
    // Pre-fill user data if available
    preloadUserData();
});

function getPublicContactTopics() {
    const taxonomy = window.GISUGO_SUPPORT_TAXONOMY;
    const topics = taxonomy && Array.isArray(taxonomy.publicContactTopics)
        ? taxonomy.publicContactTopics
        : null;

    if (topics && topics.length) {
        return topics;
    }

    return [
        { code: 'general_inquiry', label: 'General Inquiry' },
        { code: 'website_issues', label: 'Website Issues' },
        { code: 'feature_request', label: 'Feature Request' },
        { code: 'partners_sponsors', label: 'Partners & Sponsors' }
    ];
}

function initializeContactTopicOptions() {
    const topicSelect = document.getElementById('contactTopic');
    if (!topicSelect) return;

    const topics = getPublicContactTopics();
    const expectedOptions = [
        { value: '', label: 'Select a topic...' },
        ...topics.map((topic) => ({ value: topic.code, label: topic.label }))
    ];
    const existingOptions = Array.from(topicSelect.options).map((option) => ({
        value: option.value,
        label: option.textContent.trim()
    }));

    const isAlreadyUpToDate = (
        existingOptions.length === expectedOptions.length &&
        expectedOptions.every((expected, index) => {
            const current = existingOptions[index];
            return current && current.value === expected.value && current.label === expected.label;
        })
    );

    if (isAlreadyUpToDate) return;

    const firstOption = '<option value="">Select a topic...</option>';
    const topicOptions = topics
        .map((topic) => `<option value="${topic.code}">${topic.label}</option>`)
        .join('');
    topicSelect.innerHTML = `${firstOption}${topicOptions}`;
}

// ===== HEADER FUNCTIONALITY =====
function goBack() {
    console.log('📱 Back button clicked');
    
    // If user has made changes, show confirmation
    if (hasFormChanges()) {
        showLeaveConfirmation();
    } else {
        window.history.back();
    }
}

function toggleMenu() {
    const menuOverlay = document.getElementById('menuOverlay');
    console.log('📱 Menu button clicked');
    
    if (menuOverlay.classList.contains('show')) {
        hideMenu();
    } else {
        showMenu();
    }
}

function showMenu() {
    const menuOverlay = document.getElementById('menuOverlay');
    menuOverlay.classList.add('show');
    console.log('📱 Menu overlay shown');
    
    // Add click outside to close
    setTimeout(() => {
        document.addEventListener('click', handleMenuOutsideClick);
    }, 100);
    
    // Add click listeners to menu items to close menu
    const menuItems = menuOverlay.querySelectorAll('.contacts-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', hideMenu);
    });
}

function hideMenu() {
    const menuOverlay = document.getElementById('menuOverlay');
    menuOverlay.classList.remove('show');
    console.log('📱 Menu overlay hidden');
    
    document.removeEventListener('click', handleMenuOutsideClick);
    
    // Remove click listeners from menu items
    const menuItems = menuOverlay.querySelectorAll('.contacts-menu-item');
    menuItems.forEach(item => {
        item.removeEventListener('click', hideMenu);
    });
}

function handleMenuOutsideClick(event) {
    const menuOverlay = document.getElementById('menuOverlay');
    const menuButton = document.querySelector('.contacts-header-btn.menu');
    const menuItems = document.querySelector('.contacts-menu-items');
    
    // Close menu if clicking outside of menu items and menu button
    if (!menuItems.contains(event.target) && !menuButton.contains(event.target)) {
        hideMenu();
    }
}

// ===== FORM INITIALIZATION =====
function initializeForm() {
    const form = document.getElementById('contactForm');
    
    form.addEventListener('submit', handleFormSubmit);
    
    // Add input event listeners for real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateField(input);
        });
        
        input.addEventListener('blur', () => {
            validateField(input);
        });
    });
    
    console.log('✅ Form initialized with validation');
}

function initializeContactInputSecurity() {
    const textFieldIds = ['userName', 'contactSubject', 'contactMessage'];
    textFieldIds.forEach((fieldId) => {
        const field = document.getElementById(fieldId);
        blockUnsupportedCharsForContactInput(field);
    });
    console.log('✅ Contact input security guard enabled');
}

// ===== CHARACTER COUNTERS =====
function initializeCharacterCounters() {
    const subjectInput = document.getElementById('contactSubject');
    const messageTextarea = document.getElementById('contactMessage');
    const subjectCounter = document.getElementById('subjectCharCount');
    const messageCounter = document.getElementById('messageCharCount');
    
    subjectInput.addEventListener('input', () => {
        const count = subjectInput.value.length;
        subjectCounter.textContent = count;
        
        if (count > 180) {
            subjectCounter.style.color = '#fbbf24';
        } else if (count > 200) {
            subjectCounter.style.color = '#fc8181';
        } else {
            subjectCounter.style.color = '#9ca3af';
        }
    });
    
    messageTextarea.addEventListener('input', () => {
        const count = messageTextarea.value.length;
        messageCounter.textContent = count;
        
        if (count > 1800) {
            messageCounter.style.color = '#fbbf24';
        } else if (count > 2000) {
            messageCounter.style.color = '#fc8181';
        } else {
            messageCounter.style.color = '#9ca3af';
        }
    });
    
    console.log('✅ Character counters initialized');
}

// ===== PHOTO UPLOAD FUNCTIONALITY =====
function initializePhotoUpload() {
    const photoInput = document.getElementById('contactPhoto');
    const photoPreview = document.getElementById('photoPreview');
    const previewImage = document.getElementById('previewImage');
    
    photoInput.addEventListener('change', handlePhotoSelection);
    
    console.log('✅ Photo upload initialized');
}

function handlePhotoSelection(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    console.log('📸 Photo selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    // Validate file
    if (!validatePhotoFile(file)) {
        return;
    }
    
    // Read and display preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImage = document.getElementById('previewImage');
        const photoPreview = document.getElementById('photoPreview');
        
        previewImage.src = e.target.result;
        photoPreview.style.display = 'block';
        
        // Hide upload label
        const uploadLabel = document.querySelector('.photo-upload-label');
        uploadLabel.style.display = 'none';
        
        uploadedPhoto = file;
        console.log('✅ Photo preview displayed');
    };
    
    reader.readAsDataURL(file);
}

function validatePhotoFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    
    if (file.size > maxSize) {
        showError('Photo file size must be under 5MB');
        return false;
    }
    
    if (!allowedTypes.includes(file.type)) {
        showError('Only JPG, PNG, and GIF files are supported');
        return false;
    }
    
    return true;
}

function removePhoto() {
    const photoInput = document.getElementById('contactPhoto');
    const photoPreview = document.getElementById('photoPreview');
    const uploadLabel = document.querySelector('.photo-upload-label');
    
    photoInput.value = '';
    photoPreview.style.display = 'none';
    uploadLabel.style.display = 'flex';
    
    uploadedPhoto = null;
    console.log('🗑️ Photo removed');
}

// ===== FORM VALIDATION =====
function setupFormValidation() {
    console.log('✅ Form validation setup complete');
}

function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name;
    
    // Remove existing error styling
    field.classList.remove('error');
    removeFieldError(field);
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Specific field validations
    switch (fieldName) {
        case 'userName':
            if (value && contactHasUnsupportedTextChars(value)) {
                isValid = false;
                errorMessage = 'Name has unsupported symbols';
            } else if (value && value.length < 2) {
                isValid = false;
                errorMessage = 'Name must be at least 2 characters';
            }
            break;
            
        case 'userEmail':
            if (value && !isValidEmail(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
            break;
            
        case 'contactSubject':
            if (value && contactHasUnsupportedTextChars(value)) {
                isValid = false;
                errorMessage = 'Subject has unsupported symbols';
            } else if (value && value.length < 5) {
                isValid = false;
                errorMessage = 'Subject must be at least 5 characters';
            }
            break;
            
        case 'contactMessage':
            if (value && contactHasUnsupportedTextChars(value)) {
                isValid = false;
                errorMessage = 'Message has unsupported symbols';
            } else if (value && value.length < 10) {
                isValid = false;
                errorMessage = 'Message must be at least 10 characters';
            }
            break;
    }
    
    if (!isValid) {
        field.classList.add('error');
        showFieldError(field, errorMessage);
    }
    
    return isValid;
}

function validateForm() {
    const form = document.getElementById('contactForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(field, message) {
    // Remove existing error
    removeFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-text';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function removeFieldError(field) {
    const existingError = field.parentNode.querySelector('.error-text');
    if (existingError) {
        existingError.remove();
    }
}

// ===== FORM SUBMISSION =====
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (isSubmitting) {
        console.log('⚠️ Form already submitting');
        return;
    }
    
    console.log('📤 Form submission started');
    
    // Validate form
    if (!validateForm()) {
        console.log('❌ Form validation failed');
        showError('Please fix the errors above and try again');
        return;
    }
    
    isSubmitting = true;
    updateSubmitButton(true);
    showLoadingOverlay();
    let uploadedPhotoPathForCleanup = null;
    
    try {
        // Collect form data
        const formData = collectFormData();
        currentFormData = formData;
        const userId = getCurrentUserId();
        const guestSessionId = userId ? null : getSupportGuestSessionId();
        const referenceId = generateReferenceId();
        let uploadedPhotoPath = null;
        let uploadedPhotoUrl = null;
        
        // Upload photo if exists
        if (uploadedPhoto) {
            const uploadMeta = await uploadPhoto(uploadedPhoto, referenceId, userId);
            uploadedPhotoUrl = uploadMeta.url;
            uploadedPhotoPath = uploadMeta.path || null;
            uploadedPhotoPathForCleanup = uploadedPhotoPath;
        }
        
        // Prepare contact data
        const now = new Date();
        const categoryLabel = getTopicDisplayName(formData.categoryCode);
        const contactData = {
            source: 'public_contact',
            messageType: 'support_request',
            channel: 'contact_page',
            categoryCode: formData.categoryCode,
            categoryLabel: categoryLabel,
            subject: formData.subject,
            message: formData.message,
            requester: {
                userId: userId,
                guestSessionId: guestSessionId,
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
            referenceId: referenceId,
            createdAtISO: now.toISOString(),
            updatedAtISO: now.toISOString(),
            lastUpdatedAtISO: now.toISOString(),
            createdAtMs: now.getTime(),
            updatedAtMs: now.getTime(),
            lastUpdatedAtMs: now.getTime(),

            // Backward-compatibility aliases for existing UI/legacy readers.
            topic: formData.categoryCode,
            userName: formData.userName,
            userEmail: formData.userEmail,
            userId: userId,
            photoUrl: uploadedPhotoUrl,
            timestamp: now
        };
        
        console.log('📋 Contact data prepared:', contactData);
        
        // Submit to Firebase (mock for now)
        await submitContactForm(contactData);
        uploadedPhotoPathForCleanup = null;
        
        // Show success
        hideLoadingOverlay();
        showSuccessOverlay(contactData);
        
        console.log('✅ Contact form submitted successfully');
        
    } catch (error) {
        console.error('❌ Form submission error:', error);
        const uploadPath = uploadedPhotoPathForCleanup;
        if (uploadPath && typeof window.deleteFile === 'function') {
            const cleanupResult = await window.deleteFile(uploadPath);
            if (!cleanupResult.success) {
                console.warn('⚠️ Failed to clean orphaned support photo:', cleanupResult.message || cleanupResult);
            } else {
                console.log('🧹 Cleaned orphaned support photo:', uploadPath);
            }
        }
        hideLoadingOverlay();
        showErrorOverlay(error.message);
    } finally {
        isSubmitting = false;
        updateSubmitButton(false);
    }
}

function collectFormData() {
    const form = document.getElementById('contactForm');
    const formData = new FormData(form);
    
    return {
        userName: sanitizeContactTextInput(formData.get('userName').trim()),
        userEmail: formData.get('userEmail').trim(),
        categoryCode: formData.get('contactTopic'),
        subject: sanitizeContactTextInput(formData.get('contactSubject').trim()),
        message: sanitizeContactTextInput(formData.get('contactMessage').trim())
    };
}

function getSupportGuestSessionId() {
    try {
        const existing = localStorage.getItem(SUPPORT_GUEST_SESSION_KEY);
        if (existing) return existing;

        const next = (
            typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
                : `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
        );
        localStorage.setItem(SUPPORT_GUEST_SESSION_KEY, next);
        return next;
    } catch (error) {
        return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    }
}

async function uploadPhoto(file, referenceId, userId = null) {
    console.log('📸 Uploading photo...');

    const useFirebaseData = !!(
        window.APP_CONFIG &&
        typeof window.APP_CONFIG.useFirebaseData === 'function' &&
        window.APP_CONFIG.useFirebaseData()
    );
    if (useFirebaseData && typeof window.uploadSupportPhoto === 'function') {
        const uploadResult = await window.uploadSupportPhoto(referenceId, file, userId);
        if (!uploadResult.success) {
            throw new Error((uploadResult.errors && uploadResult.errors[0]) || 'Photo upload failed');
        }
        return {
            url: uploadResult.url || null,
            path: uploadResult.path || null
        };
    }

    // Dev/local fallback (short delay for UI feedback)
    await new Promise(resolve => setTimeout(resolve, 200));
    const mockPhotoUrl = `https://gisugo-uploads.com/contacts/${Date.now()}_${file.name}`;
    console.log('🧪 Photo upload simulated in dev/local mode:', mockPhotoUrl);
    return {
        url: mockPhotoUrl,
        path: null
    };
}

async function submitContactForm(contactData) {
    console.log('🔥 Submitting to Firebase...');

    const db = typeof getFirestore === 'function' ? getFirestore() : null;
    const useFirebaseData = !!(window.APP_CONFIG && typeof window.APP_CONFIG.useFirebaseData === 'function' && window.APP_CONFIG.useFirebaseData());

    if (db && useFirebaseData) {
        const serverTimestamp = (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore.FieldValue)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date();
        const payload = {
            ...contactData,
            createdAt: serverTimestamp,
            updatedAt: serverTimestamp,
            lastUpdatedAt: serverTimestamp
        };

        const docRef = await db.collection('support_requests').add(payload);
        contactData.supportRequestId = docRef.id;
        console.log('✅ Contact submitted to support_requests:', docRef.id);
        return docRef.id;
    }

    // Dev/local fallback mode
    await new Promise(resolve => setTimeout(resolve, 250));
    console.log('🧪 Contact submission simulated in dev/local mode');
    return null;
}

function generateReferenceId() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    
    return `CONTACT-${year}${month}${day}-${timestamp}`;
}

function getCurrentUserId() {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            return user ? user.uid : null;
        }
    } catch (error) {
        console.warn('⚠️ Unable to resolve current user ID for contact form:', error);
    }
    return null;
}

// ===== UI HELPERS =====
function updateSubmitButton(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnIcon = submitBtn.querySelector('.btn-icon');
    
    if (isLoading) {
        submitBtn.disabled = true;
        btnText.textContent = 'Sending...';
        btnIcon.textContent = '⏳';
        submitBtn.style.opacity = '0.7';
    } else {
        submitBtn.disabled = false;
        btnText.textContent = 'Send Message';
        btnIcon.textContent = '📤';
        submitBtn.style.opacity = '1';
    }
}

function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('show');
    console.log('⏳ Loading overlay shown');
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.remove('show');
    console.log('⏳ Loading overlay hidden');
}

function showSuccessOverlay(contactData) {
    const overlay = document.getElementById('successOverlay');
    const referenceId = document.getElementById('referenceId');
    const submittedTopic = document.getElementById('submittedTopic');
    
    referenceId.textContent = contactData.referenceId;
    submittedTopic.textContent = getTopicDisplayName(contactData.topic);
    
    overlay.classList.add('show');
    console.log('✅ Success overlay shown');
}

function showErrorOverlay(message) {
    const overlay = document.getElementById('errorOverlay');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.textContent = message || 'Sorry, there was an error sending your message. Please try again.';
    
    overlay.classList.add('show');
    console.log('❌ Error overlay shown');
}

function getTopicDisplayName(topicValue) {
    const taxonomyLabel = getPublicContactTopics().find((topic) => topic.code === topicValue)?.label;
    if (taxonomyLabel) return taxonomyLabel;

    // Legacy fallback labels for old topic values.
    const legacyTopicMap = {
        'general': 'General Inquiry',
        'website-issues': 'Website Issues',
        'feature-request': 'Feature Request',
        'partners-sponsors': 'Partners & Sponsors'
    };

    return legacyTopicMap[topicValue] || topicValue;
}

// ===== OVERLAY CONTROLS =====
function closeSuccessOverlay() {
    const overlay = document.getElementById('successOverlay');
    overlay.classList.remove('show');
    
    // Reset form and redirect
    resetForm();
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
    
    console.log('✅ Success overlay closed');
}

function closeErrorOverlay() {
    const overlay = document.getElementById('errorOverlay');
    overlay.classList.remove('show');
    console.log('❌ Error overlay closed');
}

function retrySubmission() {
    closeErrorOverlay();
    
    if (currentFormData) {
        console.log('🔄 Retrying form submission');
        // Trigger form submission again
        const form = document.getElementById('contactForm');
        handleFormSubmit({ preventDefault: () => {} });
    }
}

// ===== UTILITY FUNCTIONS =====
function resetForm() {
    const form = document.getElementById('contactForm');
    form.reset();
    
    // Reset character counters
    document.getElementById('subjectCharCount').textContent = '0';
    document.getElementById('messageCharCount').textContent = '0';
    
    // Remove photo
    removePhoto();
    
    // Clear errors
    const errorElements = form.querySelectorAll('.error-text');
    errorElements.forEach(error => error.remove());
    
    const errorFields = form.querySelectorAll('.error');
    errorFields.forEach(field => field.classList.remove('error'));
    
    console.log('🔄 Form reset');
}

function hasFormChanges() {
    const form = document.getElementById('contactForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    for (let input of inputs) {
        if (input.type === 'file') {
            if (uploadedPhoto) return true;
        } else {
            if (input.value.trim()) return true;
        }
    }
    
    return false;
}

function showLeaveConfirmation() {
    const confirmed = confirm('You have unsaved changes. Are you sure you want to leave this page?');
    if (confirmed) {
        window.history.back();
    }
}

function preloadUserData() {
    // Only pre-fill user data if user is actually logged in
    // Mock check for logged-in user - in real implementation, check Firebase Auth
    const isLoggedIn = false; // Set to false for now - will be true when Firebase Auth is connected
    
    if (!isLoggedIn) {
        console.log('👤 No user logged in - leaving form fields empty');
        return;
    }
    
    // Mock user data - in real implementation, get from Firebase Auth
    const mockUser = {
        name: 'John Doe',
        email: 'john.doe@example.com'
    };
    
    // Only pre-fill if fields are empty and user is logged in
    const nameField = document.getElementById('userName');
    const emailField = document.getElementById('userEmail');
    
    if (!nameField.value && mockUser.name) {
        nameField.value = mockUser.name;
        console.log('✅ Pre-filled user name');
    }
    
    if (!emailField.value && mockUser.email) {
        emailField.value = mockUser.email;
        console.log('✅ Pre-filled user email');
    }
}

function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-error show';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">⚠️</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
    
    console.log('⚠️ Error toast shown:', message);
}

function showSuccess(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-success show';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">✅</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
    
    console.log('✅ Success toast shown:', message);
}

// ===== FIREBASE INTEGRATION PLACEHOLDER =====
// TODO: Replace with actual Firebase implementation

/*
// Firebase Config (to be added)
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Real Firebase functions:
async function submitContactForm(contactData) {
    try {
        const docRef = await addDoc(collection(db, 'contacts'), contactData);
        console.log('Contact submitted with ID: ', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error adding contact: ', error);
        throw error;
    }
}

async function uploadPhoto(file) {
    try {
        const timestamp = Date.now();
        const storageRef = ref(storage, `contacts/${timestamp}_${file.name}`);
        
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log('Photo uploaded successfully');
        return downloadURL;
    } catch (error) {
        console.error('Error uploading photo: ', error);
        throw error;
    }
}

function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}
*/

console.log('🚀 Contacts.js loaded successfully'); 