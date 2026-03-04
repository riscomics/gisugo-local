// GISUGO Sign-Up Form JavaScript
// 🔥 FIREBASE INTEGRATED

// Form elements
let form, submitBtn, loadingOverlay, successOverlay;

// Photo upload functionality
let photoPreview, photoInput, selectedPhoto = null;
let selectedPhotoDataUrl = null;

// Track authenticated user (from OAuth or login redirect)
let authenticatedUser = null;
let isSigningUp = false; // Flag to prevent race conditions during signup
let currentSignupLang = 'english';
const LEGACY_PROFILE_PHONE_MIGRATION_SIGNUP_FLAG = 'legacyProfilePhoneMigrationDoneV1';

const SIGNUP_I18N = {
  english: {
    profilePhoto: 'Profile Photo',
    tapSelfie: 'Tap to Take a Clear Selfie',
    signupWith: 'Sign Up With',
    or: 'OR',
    signupPhone: 'Sign up with Phone Number',
    phoneVerification: '📱 Phone Verification',
    enterPhone: 'Enter Your Phone Number',
    sendCode: 'Send Verification Code',
    enterOtp: 'Enter 6-Digit Code',
    codeSentHint: 'Code sent to your phone',
    verifyContinue: 'Verify & Continue',
    resendCode: 'Resend Code',
    signupEmail: '📧 Sign up with Email',
    emailSignup: 'Email Sign Up',
    basicInfo: 'Basic Information',
    fullNameLabel: 'Full Name *',
    aboutMe: 'About Me',
    summaryLabel: 'Introduction & Summary *',
    aboutHint: 'Tell potential customers about yourself, your experience, and why they can trust you.',
    backgroundOptional: 'User Background (Optional)',
    dobLabel: 'Date of Birth (Private Only - Not Visible To Public)',
    educationLabel: 'Education Level (Private Only - Not Visible To Public)',
    socialOptional: 'Social Media (Optional)',
    socialHint: 'Link your social media to build trust with customers',
    agreePrefix: 'I agree to the',
    termsLink: 'Terms of Service',
    agreeAnd: 'and',
    privacyLink: 'Privacy Policy',
    createAccount: 'CREATE ACCOUNT',
    authSignedInWith: '✅ Signed in with {provider}',
    authCompleteProfile: 'Complete your profile below to continue'
  },
  bisaya: {
    profilePhoto: 'Profile Photo',
    tapSelfie: 'Pislita para mokuha ug klaro nga selfie',
    signupWith: 'PAAGI SA PAG-SIGN UP',
    or: 'O',
    signupPhone: 'Sign up gamit ang Phone Number',
    phoneVerification: '📱 Pag-verify sa Phone',
    enterPhone: 'Ibutang ang Imong Phone Number',
    sendCode: 'Ipadala ang Verification Code',
    enterOtp: 'Ibutang ang 6-Digit Code',
    codeSentHint: 'Na-send ang code sa imong phone',
    verifyContinue: 'Verify ug Padayon',
    resendCode: 'I-resend ang Code',
    signupEmail: '📧 Sign up gamit ang Email',
    emailSignup: 'Email Sign Up',
    basicInfo: 'Basic Information',
    fullNameLabel: 'Full Name *',
    aboutMe: 'About Me',
    summaryLabel: 'Introduction & Summary *',
    aboutHint: 'Isulti sa potential customers ang imong background, experience, ug ngano kasaligan ka.',
    backgroundOptional: 'User Background (Optional)',
    dobLabel: 'Date of Birth (Private Only - Not Visible To Public)',
    educationLabel: 'Education Level (Private Only - Not Visible To Public)',
    socialOptional: 'Social Media (Optional)',
    socialHint: 'I-link imong social media para mas mudako ang trust sa customers',
    agreePrefix: 'Mouyon ko sa',
    termsLink: 'Terms of Service',
    agreeAnd: 'ug',
    privacyLink: 'Privacy Policy',
    createAccount: 'CREATE ACCOUNT',
    authSignedInWith: '✅ Signed in with {provider}',
    authCompleteProfile: 'Kompletoha ang imong profile sa ubos aron makapadayon'
  },
  tagalog: {
    profilePhoto: 'Profile Photo',
    tapSelfie: 'Pindutin para kumuha ng malinaw na selfie',
    signupWith: 'SIGN UP GAMIT',
    or: 'O',
    signupPhone: 'Mag-sign up gamit ang Phone Number',
    phoneVerification: '📱 Phone Verification',
    enterPhone: 'Ilagay ang Iyong Phone Number',
    sendCode: 'Ipadala ang Verification Code',
    enterOtp: 'Ilagay ang 6-Digit Code',
    codeSentHint: 'Naipadala na ang code sa phone mo',
    verifyContinue: 'I-verify at Magpatuloy',
    resendCode: 'Ipadala Muli ang Code',
    signupEmail: '📧 Mag-sign up gamit ang Email',
    emailSignup: 'Email Sign Up',
    basicInfo: 'Basic Information',
    fullNameLabel: 'Full Name *',
    aboutMe: 'About Me',
    summaryLabel: 'Introduction & Summary *',
    aboutHint: 'Sabihin sa potential customers ang tungkol sa iyo, experience mo, at bakit ka mapagkakatiwalaan.',
    backgroundOptional: 'User Background (Optional)',
    dobLabel: 'Date of Birth (Private Only - Not Visible To Public)',
    educationLabel: 'Education Level (Private Only - Not Visible To Public)',
    socialOptional: 'Social Media (Optional)',
    socialHint: 'I-link ang social media mo para mas tumaas ang trust ng customers',
    agreePrefix: 'Sumasang-ayon ako sa',
    termsLink: 'Terms of Service',
    agreeAnd: 'at',
    privacyLink: 'Privacy Policy',
    createAccount: 'CREATE ACCOUNT',
    authSignedInWith: '✅ Signed in with {provider}',
    authCompleteProfile: 'Kumpletuhin ang profile mo sa ibaba para magpatuloy'
  }
};

function buildSignupDeviceFingerprint() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const parts = [
    navigator.userAgent || '',
    navigator.platform || '',
    navigator.language || '',
    `${screen.width || 0}x${screen.height || 0}`,
    tz
  ];
  return btoa(unescape(encodeURIComponent(parts.join('|')))).slice(0, 160);
}

async function checkSignupRateLimitGuard() {
  if (typeof firebase === 'undefined' || !firebase.functions) {
    return { allowed: true };
  }
  try {
    const callable = firebase.functions().httpsCallable('checkSignupRateLimit');
    const result = await callable({
      deviceFingerprint: buildSignupDeviceFingerprint(),
      action: 'create_account'
    });
    return result?.data || { allowed: true };
  } catch (error) {
    console.warn('⚠️ Signup rate check skipped:', error?.message || error);
    return { allowed: true };
  }
}

function tSignup(key) {
  return SIGNUP_I18N[currentSignupLang]?.[key] || SIGNUP_I18N.english[key] || key;
}

function updateAuthStatusCopy() {
  const status = document.getElementById('authStatusMessage');
  if (!status) return;
  const provider = status.dataset.providerLabel || 'phone';
  const signedInEl = status.querySelector('.auth-status-title');
  const subtitleEl = status.querySelector('.auth-status-subtitle');
  if (signedInEl) {
    signedInEl.textContent = tSignup('authSignedInWith').replace('{provider}', provider);
  }
  if (subtitleEl) {
    subtitleEl.textContent = tSignup('authCompleteProfile');
  }
}

function applySignupLanguage(lang) {
  if (!SIGNUP_I18N[lang]) return;
  currentSignupLang = lang;
  document.querySelectorAll('#signupLangTabs .face-lang-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.lang === lang);
  });
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = tSignup(key);
    el.textContent = value;
  });
  updateAuthStatusCopy();
}

function initializeSignupLanguageTabs() {
  const tabs = document.getElementById('signupLangTabs');
  if (!tabs) return;
  tabs.addEventListener('click', (event) => {
    const tab = event.target.closest('.face-lang-tab');
    if (!tab) return;
    applySignupLanguage(tab.dataset.lang || 'english');
  });
  applySignupLanguage('english');
}

function isAllowedTextCharacter(char) {
  if (!char) return true;
  if (/[\p{L}\p{N}\p{M}\p{Zs}\r\n]/u.test(char)) return true;
  if (/[.,!?'"()\/$&@₱-]/.test(char)) return true;
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

function showInputGuideHint(message) {
  let hint = document.getElementById('signup-input-guide');
  if (!hint) {
    hint = document.createElement('div');
    hint.id = 'signup-input-guide';
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
      <div style="font-size:14px; font-weight:600; line-height:1.38;">
        ${message}
      </div>
    </div>
  `;
  hint.style.opacity = '1';
  hint.style.transform = 'translate(-50%, -50%) scale(1)';
  clearTimeout(window.__signupInputGuideTimer);
  window.__signupInputGuideTimer = setTimeout(() => {
    hint.style.opacity = '0';
    hint.style.transform = 'translate(-50%, -50%) scale(0.98)';
  }, 3200);
}

function blockUnsupportedCharsForInput(inputEl) {
  if (!inputEl || inputEl.dataset.markupCharsBlocked === 'true') return;
  inputEl.dataset.markupCharsBlocked = 'true';

  const showGuide = () => {
    const now = Date.now();
    const lastShownAt = Number(inputEl.dataset.inputGuideShownAt || 0);
    if (now - lastShownAt < 1500) return;
    inputEl.dataset.inputGuideShownAt = String(now);
    showInputGuideHint('Only letters, numbers, emojis, spaces, and basic punctuation are allowed.');
  };

  inputEl.addEventListener('keydown', function(e) {
    if (e.key.length === 1 && !isAllowedTextCharacter(e.key)) {
      e.preventDefault();
      showGuide();
    }
  });

  inputEl.addEventListener('paste', function(e) {
    const pastedText = e.clipboardData ? e.clipboardData.getData('text') : '';
    if (!hasUnsupportedTextChars(pastedText)) return;
    e.preventDefault();
    showGuide();
    const cleaned = sanitizeTextInput(pastedText);
    const start = inputEl.selectionStart ?? inputEl.value.length;
    const end = inputEl.selectionEnd ?? inputEl.value.length;
    inputEl.setRangeText(cleaned, start, end, 'end');
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  });

  inputEl.addEventListener('input', function() {
    const sanitized = sanitizeTextInput(inputEl.value);
    if (sanitized !== inputEl.value) {
      inputEl.value = sanitized;
      showGuide();
    }
  });
}

// Initialize form when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initializeSignupLanguageTabs();
  initializeForm();
  initializePhotoUpload();
  initializeCharacterCounter();
  initializeTextInputProtection();
  initializeValidation();
  initializeCollapsibleSections();
  initializeGoogleSignIn();
  initializeFacebookSignIn();
  checkPendingAuth(); // Check if redirected from login with pending auth
  checkExistingAuthUser(); // Check if user is already authenticated
  
  console.log('🔥 Sign-up form initialized with Firebase integration');
});

function initializeTextInputProtection() {
  blockUnsupportedCharsForInput(document.getElementById('fullName'));
  blockUnsupportedCharsForInput(document.getElementById('userSummary'));
}

/**
 * Check for pending auth data from login redirect
 * If user logged in via login.html but has no profile, they're redirected here
 */
function checkPendingAuth() {
  const pendingAuthData = sessionStorage.getItem('gisugo_pending_auth');
  
  if (pendingAuthData) {
    try {
      const authData = JSON.parse(pendingAuthData);
      console.log('📋 Found pending auth data:', authData.email);
      
      // Store the authenticated user info
      authenticatedUser = authData;
      
      // Pre-fill available fields
      prefillFromAuth(authData);
      
      // Update UI to show they're already authenticated
      showAuthenticatedState(authData.provider);
      
      // Clear the pending auth (one-time use)
      sessionStorage.removeItem('gisugo_pending_auth');
      
    } catch (error) {
      console.error('Error parsing pending auth data:', error);
      sessionStorage.removeItem('gisugo_pending_auth');
    }
  }
}

/**
 * Check if user is already authenticated in Firebase
 * This handles "zombie users" who authenticated but didn't complete profile
 */
async function checkExistingAuthUser() {
  // Only check if we don't already have an authenticated user from sessionStorage
  if (authenticatedUser) {
    console.log('✅ Already have authenticated user from sessionStorage');
    return;
  }
  
  // Check if Firebase is available
  if (typeof firebase === 'undefined' || !firebase.auth) {
    console.log('⚠️ Firebase not available, skipping auth check');
    return;
  }
  
  try {
    const runLegacyProfilePhoneMigrationIfNeeded = async () => {
      if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
      if (window.localStorage.getItem(LEGACY_PROFILE_PHONE_MIGRATION_SIGNUP_FLAG) === '1') return;
      if (typeof firebase === 'undefined' || !firebase.functions) return;
      try {
        const migrateLegacyProfilePhones = firebase.functions().httpsCallable('migrateLegacyProfilePhones');
        await migrateLegacyProfilePhones({});
        window.localStorage.setItem(LEGACY_PROFILE_PHONE_MIGRATION_SIGNUP_FLAG, '1');
      } catch (migrationError) {
        // Non-blocking: account creation flow should proceed even if migration call is unavailable.
        console.warn('⚠️ Legacy profile phone migration skipped on sign-up page:', migrationError?.message || migrationError);
      }
    };

    // Wait for Firebase auth to initialize
    firebase.auth().onAuthStateChanged(async (user) => {
      // Skip checks during active signup to prevent race conditions
      if (isSigningUp) {
        console.log('⏸️ Skipping auth check - signup in progress');
        return;
      }
      
      if (user && !authenticatedUser) {
        console.log('🔍 Found existing Firebase Auth user:', user.uid);
        await runLegacyProfilePhoneMigrationIfNeeded();
        
        // Check if they already have a complete profile
        if (typeof checkUserHasProfile === 'function') {
          const { hasProfile } = await checkUserHasProfile(user.uid);
          
          if (hasProfile) {
            // They have a profile - redirect to home
            console.log('✅ User has profile, redirecting to home');
            window.location.href = 'index.html';
            return;
          }
        }
        
        // No profile yet - capture this user and pre-fill form
        console.log('📝 User authenticated but no profile - capturing for sign-up');
        authenticatedUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          phoneNumber: user.phoneNumber || '',
          provider: user.providerData?.[0]?.providerId || 'unknown'
        };
        
        // Pre-fill form with available data
        prefillFromAuth(authenticatedUser);
        showAuthenticatedState(authenticatedUser.provider);
      }
    });
  } catch (error) {
    console.error('❌ Error checking Firebase auth state:', error);
  }
}

/**
 * Pre-fill form fields from auth data
 */
function prefillFromAuth(authData) {
    // Pre-fill name if available
    if (authData.displayName) {
      const fullNameInput = document.getElementById('fullName');
      if (fullNameInput && !fullNameInput.value) {
        // Truncate to 50 chars if needed
        fullNameInput.value = authData.displayName.substring(0, 50);
        // Update character counter
        const counter = document.getElementById('fullNameCounter');
        if (counter) counter.textContent = fullNameInput.value.length;
      }
    }
  
  // Pre-fill email if available (for display, may be read-only)
  if (authData.email) {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.value = authData.email;
      emailInput.readOnly = true;
      emailInput.style.opacity = '0.7';
    }
  }
  
  // Pre-fill profile photo if available
  if (authData.photoURL) {
    const previewImg = document.getElementById('photoPreviewImg');
    const photoEmoji = document.getElementById('photoEmoji');
    
    if (previewImg) {
      previewImg.src = authData.photoURL;
      previewImg.style.display = 'block'; // Show the image
    }
    
    // Hide the emoji when photo is loaded
    if (photoEmoji) {
      photoEmoji.style.display = 'none';
    }
  }
  
  console.log('✅ Form pre-filled from auth data');
}

/**
 * Update UI to show user is already authenticated
 */
function showAuthenticatedState(provider) {
  // Hide auth-method selection area once the user is already authenticated.
  const signupMethodsSection = document.getElementById('signupMethodsSection');
  const googleBtn = document.getElementById('googleSignInBtn');
  const facebookBtn = document.getElementById('facebookSignInBtn');
  const phoneSignUpBtn = document.getElementById('phoneSignUpBtn');
  const emailToggleBtn = document.getElementById('emailToggleBtn');
  
  // Hide OAuth buttons
  if (googleBtn) googleBtn.style.display = 'none';
  if (facebookBtn) facebookBtn.style.display = 'none';
  if (phoneSignUpBtn) phoneSignUpBtn.style.display = 'none';
  if (emailToggleBtn) emailToggleBtn.style.display = 'none';
  if (signupMethodsSection) signupMethodsSection.style.display = 'none';
  
  // Hide email/password section since OAuth handled auth
  const emailSection = document.getElementById('emailSignupSection');
  if (emailSection) emailSection.style.display = 'none';
  
  // Hide phone OTP section
  const phoneOtpSection = document.getElementById('phoneOtpSection');
  if (phoneOtpSection) phoneOtpSection.style.display = 'none';
  
  // Hide the email divider section
  const emailDivider = document.getElementById('emailDivider');
  if (emailDivider) emailDivider.style.display = 'none';
  
  let providerLabel = provider;
  if (provider === 'google.com') providerLabel = 'Google';
  else if (provider === 'facebook.com') providerLabel = 'Facebook';
  else if (provider === 'phone') providerLabel = 'phone';
  
  // Add/update message showing they're authenticated
  let authMessage = document.getElementById('authStatusMessage');
  if (!authMessage) {
    authMessage = document.createElement('div');
    authMessage.id = 'authStatusMessage';
    authMessage.className = 'auth-status-message';
    authMessage.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; text-align: center;">
        <span class="auth-status-title" style="color: #10b981; font-weight: 600;"></span>
        <br>
        <span class="auth-status-subtitle" style="color: #9ca3af; font-size: 0.85rem;"></span>
      </div>
    `;
  }
  authMessage.dataset.providerLabel = providerLabel;
  
  // Insert after photo section
  const photoSection = document.querySelector('.form-section:has(#photoPreview)');
  if (photoSection && photoSection.nextSibling) {
    photoSection.parentNode.insertBefore(authMessage, photoSection.nextSibling);
  }
  updateAuthStatusCopy();
}

// Initialize form elements and event listeners
function initializeForm() {
  form = document.getElementById('signupForm');
  submitBtn = document.getElementById('submitBtn');
  loadingOverlay = document.getElementById('loadingOverlay');
  successOverlay = document.getElementById('successOverlay');
  
  if (form) {
    form.addEventListener('submit', handleFormSubmission);
  }
  
  // Set maximum date for date of birth (18 years ago)
  const dateInput = document.getElementById('dateOfBirth');
  if (dateInput) {
    const today = new Date();
    const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    dateInput.max = eighteenYearsAgo.toISOString().split('T')[0];
  }
}

// Initialize photo upload functionality
function initializePhotoUpload() {
  photoPreview = document.getElementById('photoPreview');
  photoInput = document.getElementById('profilePhoto');
  
  if (photoPreview && photoInput) {
    photoPreview.addEventListener('click', function() {
      photoInput.click();
    });
    
    photoInput.addEventListener('change', handlePhotoUpload);
  }
}

// Smart profile photo processing - similar to gig creation system
// Creates optimized versions based on image size and quality needs
function processImageTo500Width(file, callback) {
  const img = new Image();
  const reader = new FileReader();
  
  img.onload = function() {
    const originalSize = file.size;
    const dimensions = `${img.width}×${img.height}`;
    
    console.log(`📸 Profile photo analysis:`, {
      dimensions: dimensions,
      originalSize: `${(originalSize / 1024).toFixed(1)}KB`,
      aspectRatio: (img.width / img.height).toFixed(2)
    });
    
    // Determine optimal processing strategy
    const needsHighQuality = img.width > 800 || img.height > 800;
    const targetWidth = 500;
    const scale = targetWidth / img.width;
    const targetHeight = Math.round(img.height * scale);
    
    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Draw the resized image with high-quality smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    
    // Use adaptive quality based on original size
    const quality = needsHighQuality ? 0.88 : 0.92;
    
    canvas.toBlob(function(blob) {
      const dataURL = canvas.toDataURL('image/jpeg', quality);
      const finalSize = blob.size;
      
      console.log(`✅ Profile photo processed:`, {
        newDimensions: `${targetWidth}×${targetHeight}`,
        finalSize: `${(finalSize / 1024).toFixed(1)}KB`,
        reduction: `${((1 - finalSize / originalSize) * 100).toFixed(1)}%`,
        quality: `${(quality * 100)}%`
      });
      
      callback(blob, dataURL);
      
      // ===== MEMORY CLEANUP =====
      // Clear image source (releases the data URL from memory)
      img.src = '';
      img.onload = null;
      img.onerror = null;
      
      // Clear canvas (releases pixel data from memory)
      canvas.width = 0;
      canvas.height = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Clear FileReader result
      reader.abort();
      reader.onload = null;
      reader.onerror = null;
      
      console.log('🧹 Memory cleaned up');
    }, 'image/jpeg', quality);
  };
  
  img.onerror = function() {
    console.error('Failed to load image for processing');
    callback(null, null);
    
    // Cleanup on error
    img.src = '';
    img.onload = null;
    img.onerror = null;
    reader.abort();
    reader.onload = null;
    reader.onerror = null;
  };
  
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  
  reader.onerror = function() {
    console.error('Failed to read image file');
    callback(null, null);
    
    // Cleanup on error
    img.src = '';
    img.onload = null;
    img.onerror = null;
    reader.abort();
    reader.onload = null;
    reader.onerror = null;
  };
  
  reader.readAsDataURL(file);
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    // Validate file size (max 5MB before processing)
    if (file.size > 5 * 1024 * 1024) {
      showError('profilePhoto', 'Photo size must be less than 5MB');
      return;
    }
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('profilePhoto', 'Please select a valid image file');
      return;
    }
    
    // Clear any previous errors
    clearError('profilePhoto');
    
    console.log(`📤 Processing profile photo: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    
    // Process and compress image with smart sizing
    processImageTo500Width(file, function(blob, dataURL) {
      if (!blob || !dataURL) {
        showError('profilePhoto', 'Failed to process image. Please try another photo.');
        return;
      }
      
      const previewImg = document.getElementById('photoPreviewImg');
      const photoEmoji = document.getElementById('photoEmoji');
      
      if (previewImg) {
        previewImg.src = dataURL;
        previewImg.style.display = 'block'; // Show the image
      }
      
      // Hide the emoji once photo is uploaded
      if (photoEmoji) {
        photoEmoji.style.display = 'none';
      }
      
      // Store the processed blob and data URL for backend upload
      selectedPhoto = blob;
      selectedPhotoDataUrl = dataURL;
      
      console.log('✅ Photo uploaded and preview shown');
    });
  }
}

// Initialize character counter for summary and full name
function initializeCharacterCounter() {
  // Summary character counter
  const summaryTextarea = document.getElementById('userSummary');
  const summaryCounter = document.getElementById('summaryCounter');
  
  if (summaryTextarea && summaryCounter) {
    summaryTextarea.addEventListener('input', function() {
      const currentLength = this.value.length;
      summaryCounter.textContent = currentLength;
      
      // Color coding for character count
      if (currentLength > 500) {
        summaryCounter.style.color = '#fc8181';
        this.value = this.value.substring(0, 500);
        summaryCounter.textContent = '500';
      } else if (currentLength < 50) {
        summaryCounter.style.color = '#fc8181';
      } else {
        summaryCounter.style.color = '#a0aec0';
      }
    });
  }
  
  // Full Name character counter
  const fullNameInput = document.getElementById('fullName');
  const fullNameCounter = document.getElementById('fullNameCounter');
  
  if (fullNameInput && fullNameCounter) {
    fullNameInput.addEventListener('input', function() {
      const currentLength = this.value.length;
      fullNameCounter.textContent = currentLength;
      
      // Color coding for character count
      if (currentLength >= 45) {
        fullNameCounter.style.color = '#fbbf24'; // Warning color (yellow/orange)
      } else if (currentLength >= 50) {
        fullNameCounter.style.color = '#fc8181'; // Error color (red)
      } else {
        fullNameCounter.style.color = '#a0aec0'; // Default color (gray)
      }
    });
  }
}

// Initialize real-time validation
function initializeValidation() {
  const inputs = form.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      validateField(this);
    });
    
    input.addEventListener('input', function() {
      clearError(this.id);
    });
  });
}

const SIGNUP_COLLAPSIBLE_FLOW = [
  'signupSectionBasic',
  'signupSectionAbout',
  'signupSectionBackground',
  'signupSectionSocial',
  'signupSectionTerms'
];

function setSectionCollapsed(sectionId, collapsed) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.toggle('is-collapsed', !!collapsed);
}

function isSectionComplete(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return true;
  const requiredInputs = section.querySelectorAll('input[required], select[required], textarea[required]');
  if (!requiredInputs.length) return true;
  for (const input of requiredInputs) {
    if (!validateField(input)) {
      return false;
    }
  }
  return true;
}

function autoAdvanceSignupSections() {
  for (let i = 0; i < SIGNUP_COLLAPSIBLE_FLOW.length - 1; i += 1) {
    const currentId = SIGNUP_COLLAPSIBLE_FLOW[i];
    const nextId = SIGNUP_COLLAPSIBLE_FLOW[i + 1];
    if (isSectionComplete(currentId)) {
      setSectionCollapsed(nextId, false);
    } else {
      break;
    }
  }
}

function initializeCollapsibleSections() {
  SIGNUP_COLLAPSIBLE_FLOW.forEach((sectionId, index) => {
    setSectionCollapsed(sectionId, index !== 0);
    const section = document.getElementById(sectionId);
    if (!section) return;
    const header = section.querySelector('.collapsible-header');
    if (!header) return;
    header.addEventListener('click', () => {
      section.classList.toggle('is-collapsed');
    });
  });
  form.addEventListener('input', autoAdvanceSignupSections);
  form.addEventListener('change', autoAdvanceSignupSections);
}

// Validate individual field
function validateField(field) {
  const fieldId = field.id;
  const value = field.value.trim();
  
  // Clear previous error
  clearError(fieldId);
  
  switch (fieldId) {
    case 'email':
      if (!value) {
        showError(fieldId, 'Email address is required');
        return false;
      }
      if (!isValidEmail(value)) {
        showError(fieldId, 'Please enter a valid email address');
        return false;
      }
      if (isDisposableEmail(value)) {
        showError(fieldId, 'Disposable email addresses are not allowed. Please use your real email.');
        return false;
      }
      break;
      
    case 'password':
      if (!value) {
        showError(fieldId, 'Password is required');
        return false;
      }
      if (value.length < 6) {
        showError(fieldId, 'Password must be at least 6 characters');
        return false;
      }
      break;
      
    case 'confirmPassword':
      if (!value) {
        showError(fieldId, 'Please confirm your password');
        return false;
      }
      const password = document.getElementById('password')?.value;
      if (value !== password) {
        showError(fieldId, 'Passwords do not match');
        return false;
      }
      break;
      
    case 'fullName':
      if (!value) {
        showError(fieldId, 'Full name is required');
        return false;
      }
      if (hasUnsupportedTextChars(value)) {
        showError(fieldId, 'Use letters, numbers, emojis, spaces, and basic punctuation only');
        return false;
      }
      if (value.length < 2) {
        showError(fieldId, 'Full name must be at least 2 characters');
        return false;
      }
      if (value.length > 50) {
        showError(fieldId, 'Full name must be 50 characters or less');
        return false;
      }
      break;
      
    case 'dateOfBirth':
      if (!value) break;
      
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 18) {
        showError(fieldId, 'You must be at least 18 years old');
        return false;
      }
      if (age > 100) {
        showError(fieldId, 'Please enter a valid date of birth');
        return false;
      }
      break;
      
    case 'educationLevel':
      if (!value) break;
      break;
      
    case 'userSummary':
      if (!value) {
        showError(fieldId, 'Introduction summary is required');
        return false;
      }
      if (hasUnsupportedTextChars(value)) {
        showError(fieldId, 'Use letters, numbers, emojis, spaces, and basic punctuation only');
        return false;
      }
      if (value.length < 50) {
        showError(fieldId, 'Summary must be at least 50 characters');
        return false;
      }
      if (value.length > 500) {
        showError(fieldId, 'Summary must be less than 500 characters');
        return false;
      }
      break;
      
    case 'facebook':
    case 'instagram':
    case 'linkedin':
      if (value && !isValidUrl(value)) {
        showError(fieldId, 'Please enter a valid URL');
        return false;
      }
      break;
      
    case 'termsAccepted':
      if (!field.checked) {
        showError(fieldId, 'You must agree to the terms and conditions');
        return false;
      }
      break;
  }
  
  return true;
}

// Validate URL format
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'sharklasers.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'throwawaymail.com',
  'mailnesia.com',
  'trashmail.com',
  'tempmailo.com',
  'emailondeck.com',
  'moakt.com',
  'mintemail.com',
  'mytemp.email',
  'fakemail.net',
  '33mail.com'
]);

function getEmailDomain(email) {
  const value = String(email || '').trim().toLowerCase();
  const atIndex = value.lastIndexOf('@');
  if (atIndex < 0) return '';
  return value.slice(atIndex + 1);
}

function isDisposableEmail(email) {
  const domain = getEmailDomain(email);
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

function resolveErrorElementId(fieldId) {
  if (fieldId === 'termsAccepted') return 'termsError';
  return `${fieldId}Error`;
}

function setSubmitError(messages) {
  const submitError = document.getElementById('signupSubmitError');
  if (!submitError) return;
  const normalized = Array.isArray(messages) ? messages.filter(Boolean) : [messages].filter(Boolean);
  if (!normalized.length) {
    submitError.textContent = '';
    submitError.classList.remove('show');
    return;
  }
  submitError.textContent = normalized.join(' • ');
  submitError.classList.add('show');
}

function refreshSubmitErrorFromVisibleErrors() {
  const formEl = document.getElementById('signupForm');
  if (!formEl) return;
  const messages = Array.from(formEl.querySelectorAll('.form-error.show'))
    .filter((el) => el.id !== 'signupSubmitError')
    .map((el) => (el.textContent || '').trim())
    .filter(Boolean);
  const uniqueMessages = Array.from(new Set(messages));
  setSubmitError(uniqueMessages);
}

// Show error message
function showError(fieldId, message) {
  const errorElement = document.getElementById(resolveErrorElementId(fieldId));
  const inputElement = document.getElementById(fieldId);
  
  if (errorElement && fieldId !== 'termsAccepted') {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
  setSubmitError(message);
  
  if (inputElement) {
    inputElement.classList.add('error');
  }
  
  // Special handling for photo preview error styling
  if (fieldId === 'profilePhoto') {
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
      photoPreview.style.border = '3px solid #ef4444';
    }
  }
  refreshSubmitErrorFromVisibleErrors();
}

// Clear error message
function clearError(fieldId) {
  const errorElement = document.getElementById(resolveErrorElementId(fieldId));
  const inputElement = document.getElementById(fieldId);
  
  if (errorElement && fieldId !== 'termsAccepted') {
    errorElement.classList.remove('show');
  }
  
  if (inputElement) {
    inputElement.classList.remove('error');
  }
  
  // Special handling for photo preview error styling
  if (fieldId === 'profilePhoto') {
    const photoPreview = document.getElementById('photoPreview');
    if (photoPreview) {
      photoPreview.style.border = '';
    }
  }
  refreshSubmitErrorFromVisibleErrors();
}

// Handle form submission
async function handleFormSubmission(event) {
  event.preventDefault();
  setSubmitError('');
  
  // Validate all fields
  if (!validateForm()) {
    // Scroll to first error
    const firstError = form.querySelector('.form-error.show');
    if (firstError) {
      firstError.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }
  
  // Set signup flag to prevent race conditions
  isSigningUp = true;
  
  // Show loading overlay
  showLoadingOverlay();

  const rateLimit = await checkSignupRateLimitGuard();
  if (!rateLimit.allowed) {
    hideLoadingOverlay();
    const retryMessage = rateLimit.retryAfterSec
      ? `${rateLimit.message || 'Too many attempts.'} Try again in about ${Math.ceil(rateLimit.retryAfterSec / 60)} minute(s).`
      : (rateLimit.message || 'Too many attempts. Please try again later.');
    showError('email', retryMessage);
    return;
  }
  
  try {
    // Collect profile data
    const profileData = collectFormData();
    
    let userId;
    
    // Check if user is already authenticated (from OAuth or login redirect)
    if (authenticatedUser && authenticatedUser.uid) {
      // User already authenticated - just create/update their profile
      userId = authenticatedUser.uid;
      console.log('📝 Creating profile for authenticated user:', userId);
      
      // Add auth provider info
      profileData.email = authenticatedUser.email || '';
      profileData.authProvider = authenticatedUser.provider || 'oauth';
      
    } else {
      // New email/password signup
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      
      if (!email || !password) {
        hideLoadingOverlay();
        showError('email', 'Email and password are required');
        return;
      }
      
      console.log('🔐 Creating new email/password account...');
      
      // DON'T pass profileData to signUpWithEmail - it will create a basic profile
      // We'll update it later with complete data including photo
      const result = await signUpWithEmail(email, password, {
        fullName: profileData.fullName,
        email: email
      });
      
      if (!result.success) {
        hideLoadingOverlay();
        showError('email', result.message);
        console.error('❌ Account creation failed:', result.message);
        return;
      }

      if (result.requiresEmailVerification) {
        hideLoadingOverlay();
        clearError('email');
        setSubmitError(result.message || 'Account created. Please verify your email before continuing.');
        return;
      }
      
      userId = result.user?.uid;
      profileData.email = email;
      profileData.authProvider = 'email';
      console.log('✅ Firebase Auth account created:', userId);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // UPLOAD PHOTO TO STORAGE (if selected)
    // ═══════════════════════════════════════════════════════════════
    if (selectedPhoto && userId) {
      console.log('📤 Uploading profile photo to Firebase Storage...');
      
      if (typeof uploadProfilePhoto === 'function') {
        try {
          // Convert blob to File if needed
          const photoFile = selectedPhoto instanceof File ? selectedPhoto : 
                           new File([selectedPhoto], `profile_${userId}.jpg`, { type: 'image/jpeg' });
          
          const uploadResult = await uploadProfilePhoto(userId, photoFile);
          
          if (uploadResult.success) {
            profileData.profilePhoto = uploadResult.url;
            console.log('✅ Photo uploaded to Storage:', uploadResult.url.substring(0, 60) + '...');
          } else {
            // Photo upload failed - LOG IT but don't abort signup
            console.error('⚠️ Photo upload failed, continuing without photo:', uploadResult.error);
            profileData.profilePhoto = null; // No photo for now, user can update later
          }
        } catch (uploadError) {
          // Photo upload error - LOG IT but don't abort signup  
          console.error('⚠️ Photo upload error, continuing without photo:', uploadError);
          profileData.profilePhoto = null; // No photo for now, user can update later
        }
      } else {
        // Fallback to base64 ONLY if Storage is not available (offline mode)
        console.warn('⚠️ uploadProfilePhoto not available, using base64 (offline mode)');
        profileData.profilePhoto = selectedPhotoDataUrl;
      }
    } else if (authenticatedUser?.photoURL) {
      // OAuth user already has a photo URL
      profileData.profilePhoto = authenticatedUser.photoURL;
    }
    
    // Update Firebase Auth profile (displayName and photoURL) for ALL auth methods
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const currentUser = firebase.auth().currentUser;
      if (currentUser && profileData.fullName) {
        try {
          await currentUser.updateProfile({
            displayName: profileData.fullName,
            photoURL: profileData.profilePhoto || null
          });
          console.log('✅ Firebase Auth profile updated:', profileData.fullName);
        } catch (error) {
          console.error('⚠️ Failed to update Auth profile:', error);
          // Continue anyway - not critical
        }
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // SAVE COMPLETE PROFILE TO FIRESTORE - THIS IS CRITICAL!
    // ═══════════════════════════════════════════════════════════════
    if (!userId) {
      throw new Error('No userId - cannot save profile');
    }
    
    console.log('💾 Saving complete profile to Firestore for user:', userId);
    console.log('📋 Profile data keys:', Object.keys(profileData));
    
    if (typeof createUserProfile === 'function') {
      try {
        console.log('📞 Calling createUserProfile...');
        await createUserProfile(userId, profileData);
        console.log('✅ Profile saved to Firestore successfully');
      } catch (profileError) {
        // This is CRITICAL - profile save failed
        console.error('❌ CRITICAL: Failed to save profile to Firestore:', profileError);
        console.error('Error details:', profileError.message, profileError.stack);
        
        // ═══════════════════════════════════════════════════════════════
        // ROLLBACK: Clean up orphaned photo and Auth user (email/password only)
        // ═══════════════════════════════════════════════════════════════
        
        // Delete orphaned photo if it was uploaded
        if (profileData.profilePhoto && typeof deletePhotoFromStorage === 'function') {
          try {
            await deletePhotoFromStorage(profileData.profilePhoto);
            console.log('✅ Orphaned photo cleaned up');
          } catch (photoDeleteError) {
            console.error('⚠️ Failed to delete orphaned photo:', photoDeleteError);
          }
        }
        
        // Delete Auth user ONLY if email/password (OAuth users already logged in elsewhere)
        if (profileData.authProvider === 'email' && typeof firebase !== 'undefined' && firebase.auth) {
          try {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
              await currentUser.delete();
              console.log('✅ Auth user rolled back');
            }
          } catch (authDeleteError) {
            console.error('⚠️ Failed to delete Auth user during rollback:', authDeleteError);
          }
        }

        hideLoadingOverlay();
        showError('email', 'Failed to save profile. Please try again.');
        return;
      }
    } else {
      console.error('❌ createUserProfile function not available!');
      hideLoadingOverlay();
      showError('email', 'Profile save function not available. Please refresh and try again.');
      return;
    }
    
    // Show success overlay
    hideLoadingOverlay();
    showSuccessOverlay();
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('❌ Account creation failed:', error);
    showError('email', 'Failed to create account. Please try again.');
  }
}

// Validate entire form
function validateForm() {
  setSubmitError('');
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  // Validate profile photo is uploaded/taken in this form flow.
  if (!selectedPhoto && !selectedPhotoDataUrl) {
    showError('profilePhoto', 'Please upload a profile photo');
    isValid = false;
    
    // Scroll to photo section
    const photoPreview = document.getElementById('photo-preview');
    if (photoPreview) {
      photoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  if (!isValid) {
    const messages = Array.from(form.querySelectorAll('.form-error.show'))
      .map(el => (el.textContent || '').trim())
      .filter(Boolean);
    const termsInput = document.getElementById('termsAccepted');
    if (termsInput && !termsInput.checked) {
      messages.push('You must agree to the terms and conditions');
    }
    const uniqueMessages = Array.from(new Set(messages));
    setSubmitError(uniqueMessages);
  }
  
  return isValid;
}

// Collect form data in Firebase-ready format
function collectFormData() {
  const formData = {
    // Basic Profile Information (matches profile.js structure)
    fullName: document.getElementById('fullName').value.trim(),
    dateOfBirth: document.getElementById('dateOfBirth').value,
    educationLevel: document.getElementById('educationLevel').value,
    userSummary: document.getElementById('userSummary').value.trim(),
    
    // Social Media (optional)
    socialMedia: {
      facebook: document.getElementById('facebook')?.value.trim() || null,
      instagram: document.getElementById('instagram')?.value.trim() || null,
      linkedin: document.getElementById('linkedin')?.value.trim() || null
    },
    
    // Profile photo placeholder (will be updated if photo uploaded)
    profilePhoto: null,
    
    // Account metadata
    accountCreated: new Date().toISOString(),
    termsAccepted: document.getElementById('termsAccepted')?.checked || false,
    termsAcceptedDate: new Date().toISOString(),
    
    // Default values for new users
    rating: 0,
    reviewCount: 0,
    verification: {
      status: 'none',
      businessVerified: false,
      proVerified: false
    }
  };
  
  // Remove empty social media entries
  Object.keys(formData.socialMedia).forEach(key => {
    if (!formData.socialMedia[key]) {
      delete formData.socialMedia[key];
    }
  });
  
  return formData;
}

// Initialize Google Sign-In button
function initializeGoogleSignIn() {
  const googleBtn = document.getElementById('googleSignInBtn');
  
  if (googleBtn) {
    googleBtn.addEventListener('click', handleGoogleSignIn);
  }
}

// Handle Google Sign-In
async function handleGoogleSignIn() {
  showLoadingOverlay();
  
  try {
    const result = await loginWithGoogle();
    
    // Check if Firebase not configured (dev mode)
    if (!result.success && result.message?.includes('configure Firebase')) {
      hideLoadingOverlay();
      console.log('⚠️ Firebase not configured - OAuth unavailable in dev mode');
      alert('Google Sign-In will be available once Firebase is configured for production.');
      return;
    }
    
    if (result.success) {
      console.log('✅ Google sign-in successful:', result.user?.uid);
      
      // Check if user already has a complete profile
      const { hasProfile } = await checkUserHasProfile(result.user.uid);
      
      if (hasProfile) {
        // Existing complete user - redirect to home
        console.log('👤 Existing user with profile - redirecting to home');
        hideLoadingOverlay();
        window.location.href = 'index.html';
      } else {
        // New or incomplete user - stay on sign-up page to complete profile
        console.log('📝 New user - staying on sign-up to complete profile');
        
        // Store authenticated user info
        authenticatedUser = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          phoneNumber: result.user.phoneNumber || '',
          provider: 'google.com'
        };
        
        // Pre-fill form with auth data
        prefillFromAuth(authenticatedUser);
        showAuthenticatedState('google.com');
        
        hideLoadingOverlay();
      }
    } else {
      hideLoadingOverlay();
      showError('email', result.message);
      console.error('Google sign-in failed:', result.message);
    }
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('Google sign-in error:', error);
    showError('email', 'Google sign-in failed. Please try again.');
  }
}

// Handle Facebook Sign-In
async function handleFacebookSignIn() {
  showLoadingOverlay();
  
  try {
    const result = await loginWithFacebook();
    
    // Check if Firebase not configured (dev mode)
    if (!result.success && result.message?.includes('configure Firebase')) {
      hideLoadingOverlay();
      console.log('⚠️ Firebase not configured - OAuth unavailable in dev mode');
      alert('Facebook Sign-In will be available once Firebase is configured for production.');
      return;
    }
    
    if (result.success) {
      console.log('✅ Facebook sign-in successful:', result.user?.uid);
      
      // Check if user already has a complete profile
      const { hasProfile } = await checkUserHasProfile(result.user.uid);
      
      if (hasProfile) {
        // Existing complete user - redirect to home
        console.log('👤 Existing user with profile - redirecting to home');
        hideLoadingOverlay();
        window.location.href = 'index.html';
      } else {
        // New or incomplete user - stay on sign-up page to complete profile
        console.log('📝 New user - staying on sign-up to complete profile');
        
        // Store authenticated user info
        authenticatedUser = {
          uid: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || '',
          photoURL: result.user.photoURL || '',
          phoneNumber: result.user.phoneNumber || '',
          provider: 'facebook.com'
        };
        
        // Pre-fill form with auth data
        prefillFromAuth(authenticatedUser);
        showAuthenticatedState('facebook.com');
        
        hideLoadingOverlay();
      }
    } else {
      hideLoadingOverlay();
      showError('email', result.message);
      console.error('Facebook sign-in failed:', result.message);
    }
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('Facebook sign-in error:', error);
    showError('email', 'Facebook sign-in failed. Please try again.');
  }
}

// Initialize Facebook Sign-In button
function initializeFacebookSignIn() {
  const facebookBtn = document.getElementById('facebookSignInBtn');
  
  if (facebookBtn) {
    facebookBtn.addEventListener('click', handleFacebookSignIn);
  }
}

// Utility functions for overlays
function showLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
    submitBtn.disabled = true;
  }
}

function hideLoadingOverlay() {
  if (loadingOverlay) {
    loadingOverlay.classList.remove('show');
    submitBtn.disabled = false;
  }
}

function showSuccessOverlay() {
  if (successOverlay) {
    successOverlay.classList.add('show');
    // Launch confetti animation
    launchConfetti();
  }
}

// Confetti animation for success modal
function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const confettiPieces = [];
  const confettiCount = 150;
  const colors = ['#FFD700', '#4CAF50', '#2196F3', '#FF5722', '#9C27B0', '#FF4081'];
  
  // Create confetti pieces
  for (let i = 0; i < confettiCount; i++) {
    confettiPieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5,
      size: Math.random() * 8 + 4,
      speedX: Math.random() * 3 - 1.5,
      speedY: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? 'circle' : 'square'
    });
  }
  
  let animationFrame;
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiPieces.forEach((piece, index) => {
      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate((piece.rotation * Math.PI) / 180);
      ctx.fillStyle = piece.color;
      
      if (piece.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, piece.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
      }
      
      ctx.restore();
      
      // Update position
      piece.y += piece.speedY;
      piece.x += piece.speedX;
      piece.rotation += piece.rotationSpeed;
      
      // Remove pieces that fall off screen
      if (piece.y > canvas.height + 20) {
        confettiPieces.splice(index, 1);
      }
    });
    
    // Continue animation if there are still confetti pieces
    if (confettiPieces.length > 0) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationFrame);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  
  animate();
}

// Helper function to calculate age (matches profile.js)
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
} 