// GISUGO Sign-Up Form JavaScript
// 🔥 FIREBASE INTEGRATED

// Form elements
let form, submitBtn, loadingOverlay, successOverlay;

// Photo upload functionality
let photoPreview, photoInput, selectedPhoto = null;
let selectedPhotoDataUrl = null;

// Track authenticated user (from OAuth or login redirect)
let authenticatedUser = null;

// Initialize form when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initializeForm();
  initializePhotoUpload();
  initializeCharacterCounter();
  initializeValidation();
  initializeGoogleSignIn();
  initializeFacebookSignIn();
  checkPendingAuth(); // Check if redirected from login with pending auth
  checkExistingAuthUser(); // Check if user is already authenticated
  
  console.log('🔥 Sign-up form initialized with Firebase integration');
});

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
    // Wait for Firebase auth to initialize
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user && !authenticatedUser) {
        console.log('🔍 Found existing Firebase Auth user:', user.uid);
        
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
  
  // Pre-fill phone if available
  if (authData.phoneNumber) {
    const phoneInput = document.getElementById('phoneNumber');
    if (phoneInput && !phoneInput.value) {
      // Remove country code prefix if present
      let phone = authData.phoneNumber;
      if (phone.startsWith('+63')) phone = phone.substring(3);
      else if (phone.startsWith('+1')) phone = phone.substring(2);
      else if (phone.startsWith('+')) phone = phone.substring(phone.indexOf(' ') + 1);
      phoneInput.value = phone;
    }
  }
  
  // Pre-fill profile photo if available
  if (authData.photoURL) {
    const previewImg = document.getElementById('photoPreviewImg');
    const photoEmoji = document.getElementById('photoEmoji');
    
    if (previewImg) {
      previewImg.src = authData.photoURL;
      previewImg.style.display = 'block'; // Show the image
      selectedPhotoDataUrl = authData.photoURL;
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
  // Hide social login buttons since user is already authenticated
  const socialSection = document.querySelector('.form-section:has(#googleSignInBtn)');
  const googleBtn = document.getElementById('googleSignInBtn');
  const facebookBtn = document.getElementById('facebookSignInBtn');
  const phoneSignUpBtn = document.getElementById('phoneSignUpBtn');
  const emailToggleBtn = document.getElementById('emailToggleBtn');
  
  // Hide OAuth buttons
  if (googleBtn) googleBtn.style.display = 'none';
  if (facebookBtn) facebookBtn.style.display = 'none';
  if (phoneSignUpBtn) phoneSignUpBtn.style.display = 'none';
  if (emailToggleBtn) emailToggleBtn.style.display = 'none';
  
  // Hide email/password section since OAuth handled auth
  const emailSection = document.getElementById('emailSignupSection');
  if (emailSection) emailSection.style.display = 'none';
  
  // Hide phone OTP section
  const phoneOtpSection = document.getElementById('phoneOtpSection');
  if (phoneOtpSection) phoneOtpSection.style.display = 'none';
  
  // Hide the email divider section
  const emailDivider = document.getElementById('emailDivider');
  if (emailDivider) emailDivider.style.display = 'none';
  
  // Add a message showing they're authenticated
  const authMessage = document.createElement('div');
  authMessage.className = 'auth-status-message';
  authMessage.innerHTML = `
    <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); 
                border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; text-align: center;">
      <span style="color: #10b981; font-weight: 600;">
        ✅ Signed in with ${provider === 'google.com' ? 'Google' : provider === 'facebook.com' ? 'Facebook' : provider}
      </span>
      <br>
      <span style="color: #9ca3af; font-size: 0.85rem;">Complete your profile below to continue</span>
    </div>
  `;
  
  // Insert after photo section
  const photoSection = document.querySelector('.form-section:has(#photoPreview)');
  if (photoSection && photoSection.nextSibling) {
    photoSection.parentNode.insertBefore(authMessage, photoSection.nextSibling);
  }
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
      if (!value) {
        showError(fieldId, 'Date of birth is required');
        return false;
      }
      
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
      if (!value) {
        showError(fieldId, 'Please select your education level');
        return false;
      }
      break;
      
    case 'userSummary':
      if (!value) {
        showError(fieldId, 'Introduction summary is required');
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

// Show error message
function showError(fieldId, message) {
  const errorElement = document.getElementById(fieldId + 'Error');
  const inputElement = document.getElementById(fieldId);
  
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }
  
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
}

// Clear error message
function clearError(fieldId) {
  const errorElement = document.getElementById(fieldId + 'Error');
  const inputElement = document.getElementById(fieldId);
  
  if (errorElement) {
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
}

// Handle form submission
async function handleFormSubmission(event) {
  event.preventDefault();
  
  // Validate all fields
  if (!validateForm()) {
    return;
  }
  
  // Show loading overlay
  showLoadingOverlay();
  
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
    
    if (typeof createUserProfile === 'function') {
      try {
        await createUserProfile(userId, profileData);
        console.log('✅ Profile saved to Firestore successfully');
      } catch (profileError) {
        // This is CRITICAL - profile save failed
        console.error('❌ CRITICAL: Failed to save profile to Firestore:', profileError);
        
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
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  let isValid = true;
  
  inputs.forEach(input => {
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  // Validate profile photo is uploaded (unless user came from OAuth with photo)
  if (!selectedPhoto && !authenticatedUser?.photoURL) {
    showError('profilePhoto', 'Please upload a profile photo');
    isValid = false;
    
    // Scroll to photo section
    const photoPreview = document.getElementById('photo-preview');
    if (photoPreview) {
      photoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  return isValid;
}

// Collect form data in Firebase-ready format
function collectFormData() {
  // Get phone number with country code
  const phoneInput = document.getElementById('phoneNumber')?.value.trim() || '';
  const countryCode = document.getElementById('countryCode')?.value || '+63';
  const fullPhoneNumber = phoneInput ? countryCode + phoneInput.replace(/\D/g, '') : '';
  
  const formData = {
    // Basic Profile Information (matches profile.js structure)
    fullName: document.getElementById('fullName').value.trim(),
    dateOfBirth: document.getElementById('dateOfBirth').value,
    educationLevel: document.getElementById('educationLevel').value,
    userSummary: document.getElementById('userSummary').value.trim(),
    
    // Contact Information
    phoneNumber: fullPhoneNumber,
    
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
    jobsCompleted: 0,
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
  }
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