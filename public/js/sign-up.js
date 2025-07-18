// GISUGO Sign-Up Form JavaScript

// Form elements
let form, submitBtn, loadingOverlay, successOverlay;

// Photo upload functionality
let photoPreview, photoInput, selectedPhoto = null;

// Initialize form when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  initializeForm();
  initializePhotoUpload();
  initializeCharacterCounter();
  initializeValidation();
  
  console.log('Sign-up form initialized');
});

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

// Auto crop and resize image to 500px width, maintaining aspect ratio
function processImageTo500Width(file, callback) {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  img.onload = function() {
    const targetWidth = 500;
    const scale = targetWidth / img.width;
    const targetHeight = Math.round(img.height * scale);
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
    canvas.toBlob(function(blob) {
      const dataURL = canvas.toDataURL('image/jpeg', 0.92);
      callback(blob, dataURL);
    }, 'image/jpeg', 0.92);
  };
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('profilePhoto', 'Photo size must be less than 5MB');
      return;
    }
    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('profilePhoto', 'Please select a valid image file');
      return;
    }
    // Crop and resize, then preview and store blob for backend
    processImageTo500Width(file, function(blob, dataURL) {
      const previewImg = document.getElementById('photoPreviewImg');
      if (previewImg) {
        previewImg.src = dataURL;
      }
      // Store the processed blob for backend upload
      selectedPhoto = blob;
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
      if (currentLength >= 13) {
        fullNameCounter.style.color = '#fbbf24'; // Warning color (yellow/orange)
      } else if (currentLength >= 15) {
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
    case 'fullName':
      if (!value) {
        showError(fieldId, 'Full name is required');
        return false;
      }
      if (value.length < 2) {
        showError(fieldId, 'Full name must be at least 2 characters');
        return false;
      }
      if (value.length > 15) {
        showError(fieldId, 'Full name must be 15 characters or less');
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
    // Collect form data
    const formData = collectFormData();
    
    // Simulate account creation (replace with Firebase call)
    await createAccount(formData);
    
    // Show success overlay
    hideLoadingOverlay();
    showSuccessOverlay();
    
  } catch (error) {
    hideLoadingOverlay();
    console.error('Account creation failed:', error);
    alert('Failed to create account. Please try again.');
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
      facebook: document.getElementById('facebook').value.trim() || null,
      instagram: document.getElementById('instagram').value.trim() || null,
      linkedin: document.getElementById('linkedin').value.trim() || null
    },
    
    // System generated fields (will be added by backend)
    accountCreated: new Date().toISOString(),
    userId: null, // Will be generated by Firebase
    rating: 0,
    reviewCount: 0,
    
    // Profile photo (if uploaded)
    profilePhoto: selectedPhoto
  };
  
  // Remove empty social media entries
  Object.keys(formData.socialMedia).forEach(key => {
    if (!formData.socialMedia[key]) {
      delete formData.socialMedia[key];
    }
  });
  
  return formData;
}

// Create account (Firebase integration point)
async function createAccount(userData) {
  // TODO: Replace this with actual Firebase authentication and user creation
  console.log('Creating account with data:', userData);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For now, just log the data that would be sent to Firebase
  const firebaseData = {
    // Authentication data
    email: '', // This would come from a separate authentication step
    password: '', // This would come from a separate authentication step
    
    // User profile data
    profile: {
      fullName: userData.fullName,
      dateOfBirth: userData.dateOfBirth,
      educationLevel: userData.educationLevel,
      userSummary: userData.userSummary,
      socialMedia: userData.socialMedia,
      accountCreated: userData.accountCreated,
      rating: 0,
      reviewCount: 0
    }
  };
  
  console.log('Firebase-ready data structure:', firebaseData);
  
  // Simulate successful account creation
  return {
    success: true,
    userId: 'generated-user-id-123',
    message: 'Account created successfully'
  };
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