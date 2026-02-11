// ===== DEMO VERIFICATION STATE SWITCHER =====
// Change these values to test different verification states:
const DEMO_CONFIG = {
  // Set verification state for testing (only one should be true):
  businessVerified: false,  // Shows Business Verified badge → Business overlay
  proVerified: false,       // Shows Pro Verified badge → Pro overlay  
  newMember: false          // Shows New Member badge → Not Verified overlay (auto when both false)
  // Priority: Business > Pro > New Member
};

// Account Button and Overlay functionality
const accountBtn = document.getElementById('accountBtn');
const accountOverlay = document.getElementById('accountOverlay');
const accountCloseBtn = document.getElementById('accountCloseBtn');

if (accountBtn && accountOverlay && accountCloseBtn) {
  // Open account overlay - uses guard function for defense-in-depth
  // FIREBASE TODO: This click handler is protected by both:
  // 1. Button visibility (hidden if not owner) - updateBadgeVisibility()
  // 2. Guard function check (blocks if not logged in or not own profile)
  accountBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    // Use guard function - defined later but available via window when clicked
    if (typeof openAccountSettingsIfOwner === 'function') {
      openAccountSettingsIfOwner();
      document.body.style.overflow = 'hidden';
    } else {
      // Fallback for initial load (guard will be available after DOMContentLoaded)
      accountOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });

  // Close account overlay via close button
  accountCloseBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    accountOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    justCompletedEligiblePurchase = false; // Reset flag when closing
  });

  // Close account overlay via background click
  accountOverlay.addEventListener('click', function(e) {
    if (e.target === accountOverlay) {
      accountOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      justCompletedEligiblePurchase = false; // Reset flag when closing
    }
  });

  // Close account overlay via Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && accountOverlay.classList.contains('active')) {
      accountOverlay.classList.remove('active');
      document.body.style.overflow = ''; // Restore scrolling
      justCompletedEligiblePurchase = false; // Reset flag when closing
    }
  });

  // Handle account option clicks
  const accountOptions = document.querySelectorAll('.account-option.clickable');
  accountOptions.forEach(option => {
    option.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleAccountAction(action);
    });
  });

  // Handle submit ID button click (separate from account options)
  const submitIdBtn = document.getElementById('submitIdOption');
  if (submitIdBtn) {
    submitIdBtn.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      handleAccountAction(action);
    });
  }
}

// ===== BUSINESS PRESTIGE OVERLAY FUNCTIONALITY =====

// Get business prestige overlay elements
const businessPrestigeOverlay = document.getElementById('businessPrestigeOverlay');
const businessPrestigeClose = document.getElementById('businessPrestigeClose');
const prestigeUnderstandBtn = document.getElementById('prestigeUnderstandBtn');

// Open business prestige overlay
function openBusinessPrestigeOverlay() {
  if (businessPrestigeOverlay) {
    businessPrestigeOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('👑 Business prestige overlay opened');
  }
}

// Close business prestige overlay
function closeBusinessPrestigeOverlay() {
  if (businessPrestigeOverlay) {
    businessPrestigeOverlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('👑 Business prestige overlay closed');
  }
}

// Business verified badge click handler (grid)
const businessVerifiedBadgeGrid = document.getElementById('businessVerifiedBadgeGrid');
if (businessVerifiedBadgeGrid) {
  businessVerifiedBadgeGrid.addEventListener('click', function(e) {
    e.stopPropagation();
    openBusinessPrestigeOverlay();
  });
  
  // Add cursor pointer to indicate clickability
  businessVerifiedBadgeGrid.style.cursor = 'pointer';
}

// ===== PRO VERIFIED OVERLAY FUNCTIONALITY =====

// Get pro prestige overlay elements
const proPrestigeOverlay = document.getElementById('proPrestigeOverlay');
const proPrestigeClose = document.getElementById('proPrestigeClose');
const proPrestigeUnderstandBtn = document.getElementById('proPrestigeUnderstandBtn');

// Open pro prestige overlay
function openProPrestigeOverlay() {
  if (proPrestigeOverlay) {
    proPrestigeOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('⭐ Pro prestige overlay opened');
  }
}

// Close pro prestige overlay
function closeProPrestigeOverlay() {
  if (proPrestigeOverlay) {
    proPrestigeOverlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('⭐ Pro prestige overlay closed');
  }
}

// Pro verified badge click handler (grid)
const proVerifiedBadgeGrid = document.getElementById('proVerifiedBadgeGrid');
if (proVerifiedBadgeGrid) {
  proVerifiedBadgeGrid.addEventListener('click', function(e) {
    e.stopPropagation();
    openProPrestigeOverlay();
  });
  
  // Add cursor pointer to indicate clickability
  proVerifiedBadgeGrid.style.cursor = 'pointer';
}

// Close button handlers for pro prestige overlay
if (proPrestigeClose) {
  proPrestigeClose.addEventListener('click', closeProPrestigeOverlay);
}

if (proPrestigeUnderstandBtn) {
  proPrestigeUnderstandBtn.addEventListener('click', closeProPrestigeOverlay);
}

// Background click to close
if (proPrestigeOverlay) {
  proPrestigeOverlay.addEventListener('click', function(e) {
    if (e.target === proPrestigeOverlay) {
      closeProPrestigeOverlay();
    }
  });
}

// ===== NOT VERIFIED YET OVERLAY FUNCTIONALITY =====

// Get not verified overlay elements
const notVerifiedOverlay = document.getElementById('notVerifiedOverlay');
const notVerifiedClose = document.getElementById('notVerifiedClose');
const notVerifiedUnderstandBtn = document.getElementById('notVerifiedUnderstandBtn');
const newUserBadgeGrid = document.getElementById('newUserBadgeGrid');

// Open not verified overlay
function openNotVerifiedOverlay() {
  if (notVerifiedOverlay) {
    notVerifiedOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('🌱 Not verified overlay opened');
  }
}

// Close not verified overlay
function closeNotVerifiedOverlay() {
  if (notVerifiedOverlay) {
    notVerifiedOverlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('🌱 Not verified overlay closed');
  }
}

// New user badge click handler
if (newUserBadgeGrid) {
  newUserBadgeGrid.addEventListener('click', function(e) {
    e.stopPropagation();
    openNotVerifiedOverlay();
  });
  
  // Add cursor pointer to indicate clickability
  newUserBadgeGrid.style.cursor = 'pointer';
}

// Close button handlers for not verified overlay
if (notVerifiedClose) {
  notVerifiedClose.addEventListener('click', closeNotVerifiedOverlay);
}

if (notVerifiedUnderstandBtn) {
  notVerifiedUnderstandBtn.addEventListener('click', closeNotVerifiedOverlay);
}

// Background click to close
if (notVerifiedOverlay) {
  notVerifiedOverlay.addEventListener('click', function(e) {
    if (e.target === notVerifiedOverlay) {
      closeNotVerifiedOverlay();
    }
  });
}

// Keyboard escape to close (updated to include all verification overlays)
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (businessPrestigeOverlay && businessPrestigeOverlay.classList.contains('active')) {
      closeBusinessPrestigeOverlay();
    } else if (proPrestigeOverlay && proPrestigeOverlay.classList.contains('active')) {
      closeProPrestigeOverlay();
    } else if (notVerifiedOverlay && notVerifiedOverlay.classList.contains('active')) {
      closeNotVerifiedOverlay();
    }
  }
});

// Close button handlers
if (businessPrestigeClose) {
  businessPrestigeClose.addEventListener('click', closeBusinessPrestigeOverlay);
}

if (prestigeUnderstandBtn) {
  prestigeUnderstandBtn.addEventListener('click', closeBusinessPrestigeOverlay);
}

// Background click to close
if (businessPrestigeOverlay) {
  businessPrestigeOverlay.addEventListener('click', function(e) {
    if (e.target === businessPrestigeOverlay) {
      closeBusinessPrestigeOverlay();
    }
  });
}

// Keyboard escape to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && businessPrestigeOverlay && businessPrestigeOverlay.classList.contains('active')) {
    closeBusinessPrestigeOverlay();
  }
});

function handleAccountAction(action) {
  switch(action) {
    case 'edit-profile':
      console.log('Edit Profile clicked - opening edit profile overlay');
      openEditProfileOverlay();
      break;
    case 'privacy-settings':
      console.log('Privacy Settings clicked');
      // TODO: Open privacy settings
      break;
    case 'notification-settings':
      console.log('Notification Settings clicked');
      // TODO: Open notification settings
      break;
    case 'upgrade-explanation':
      console.log('Upgrade Status clicked - opening explanation overlay');
      openExplanationOverlay();
      break;
    case 'submit-id':
      console.log('Submit ID clicked - opening verification overlay');
      // Mark ID as submitted in backend (mock)
      if (window.currentUserProfile && window.currentUserProfile.verification) {
        window.currentUserProfile.verification.idSubmitted = true;
      }
      justCompletedEligiblePurchase = false; // Reset flag after use
      openVerificationOverlay();
      break;
    default:
      console.log('Unknown action:', action);
  }
}

// ===== EDIT PROFILE OVERLAY FUNCTIONALITY =====
function openEditProfileOverlay() {
  // First close the account overlay (uses 'active' class, not 'show')
  const accountOverlay = document.getElementById('accountOverlay');
  if (accountOverlay) {
    accountOverlay.classList.remove('active');
    // Don't use inline display:none - it persists and breaks reopening
  }
  document.body.style.overflow = ''; // Restore scrolling temporarily
  
  // Then open the edit profile overlay after a brief delay
  setTimeout(() => {
    const overlay = document.getElementById('editProfileOverlay');
    if (overlay) {
      // Populate form with current user data
      populateEditProfileForm();
      // Update login methods UI to show linked providers
      if (typeof updateLoginMethodsUI === 'function') {
        updateLoginMethodsUI();
      }
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
  }, 150);
}

function closeEditProfileOverlay() {
  console.log('closeEditProfileOverlay called');
  const overlay = document.getElementById('editProfileOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
    console.log('Edit profile overlay closed');
  }
}

// Make closeEditProfileOverlay globally accessible
window.closeEditProfileOverlay = closeEditProfileOverlay;

function populateEditProfileForm() {
  const profile = window.currentUserProfile;
  console.log('Populating edit profile form with:', profile);
  if (!profile) {
    console.warn('No profile data available');
    return;
  }

  // Basic Info
  const firstNameInput = document.getElementById('editFirstName');
  const lastNameInput = document.getElementById('editLastName');
  const dobInput = document.getElementById('editDateOfBirth');
  const educationSelect = document.getElementById('editEducation');
  const aboutMeTextarea = document.getElementById('editAboutMe');
  const photoPreview = document.getElementById('editProfilePhotoPreview');

  // Parse fullName into first and last name
  if (profile.fullName) {
    const nameParts = profile.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    if (firstNameInput) firstNameInput.value = firstName;
    if (lastNameInput) lastNameInput.value = lastName;
  } else {
    // Check for separate firstName/lastName fields
    if (firstNameInput && profile.firstName) firstNameInput.value = profile.firstName;
    if (lastNameInput && profile.lastName) lastNameInput.value = profile.lastName;
  }
  
  if (dobInput && profile.dateOfBirth) {
    dobInput.value = profile.dateOfBirth;
  }
  if (educationSelect && profile.educationLevel) {
    educationSelect.value = profile.educationLevel;
  }
  if (aboutMeTextarea && profile.userSummary) {
    aboutMeTextarea.value = profile.userSummary;
    updateCharCount();
  }
  if (photoPreview) {
    const photoSrc = profile.profilePhoto || profile.profileImage;
    const photoPlaceholder = document.getElementById('editPhotoPlaceholder');
    
    if (photoSrc) {
      photoPreview.src = photoSrc;
      photoPreview.style.display = 'block';
      if (photoPlaceholder) photoPlaceholder.style.display = 'none';
    } else {
      photoPreview.style.display = 'none';
      if (photoPlaceholder) photoPlaceholder.style.display = 'flex';
    }
  }

  // Social Media usernames (extracted from URLs)
  const facebookInput = document.getElementById('editFacebook');
  const instagramInput = document.getElementById('editInstagram');
  const linkedinInput = document.getElementById('editLinkedIn');

  // Helper to extract username from URL
  const extractUsername = (url, platform) => {
    if (!url || !url.startsWith('http') || url.includes('/icons/')) return '';
    
    try {
      // Handle different URL patterns
      if (platform === 'facebook') {
        // facebook.com/username or facebook.com/profile.php?id=xxx
        const match = url.match(/facebook\.com\/([^/?]+)/);
        return match ? match[1] : '';
      } else if (platform === 'instagram') {
        // instagram.com/username
        const match = url.match(/instagram\.com\/([^/?]+)/);
        return match ? match[1] : '';
      } else if (platform === 'linkedin') {
        // linkedin.com/in/username
        const match = url.match(/linkedin\.com\/in\/([^/?]+)/);
        return match ? match[1] : '';
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  if (facebookInput) {
    const fbUrl = profile.socialUrls?.facebook || profile.socialMedia?.facebook;
    facebookInput.value = extractUsername(fbUrl, 'facebook');
  }
  if (instagramInput) {
    const igUrl = profile.socialUrls?.instagram || profile.socialMedia?.instagram;
    instagramInput.value = extractUsername(igUrl, 'instagram');
  }
  if (linkedinInput) {
    const liUrl = profile.socialUrls?.linkedin || profile.socialMedia?.linkedin;
    linkedinInput.value = extractUsername(liUrl, 'linkedin');
  }
}

function updateCharCount() {
  const textarea = document.getElementById('editAboutMe');
  const charCount = document.getElementById('aboutMeCharCount');
  if (textarea && charCount) {
    charCount.textContent = textarea.value.length;
  }
}

function initializeEditProfileOverlay() {
  const overlay = document.getElementById('editProfileOverlay');
  const closeBtn = document.getElementById('editProfileCloseBtn');
  const cancelBtn = document.getElementById('editProfileCancelBtn');
  const form = document.getElementById('editProfileForm');
  const aboutMeTextarea = document.getElementById('editAboutMe');
  const photoInput = document.getElementById('editProfilePhotoInput');

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', closeEditProfileOverlay);
  }

  // Cancel button
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditProfileOverlay);
  }

  // Close on overlay background click
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        closeEditProfileOverlay();
      }
    });
  }

  // Character count for About Me
  if (aboutMeTextarea) {
    aboutMeTextarea.addEventListener('input', updateCharCount);
    // Set max length
    aboutMeTextarea.maxLength = 500;
  }

  // Photo upload preview
  if (photoInput) {
    photoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('editProfilePhotoPreview');
          const placeholder = document.getElementById('editPhotoPlaceholder');
          
          if (preview) {
            preview.src = e.target.result;
            preview.style.display = 'block';
          }
          
          if (placeholder) {
            placeholder.style.display = 'none';
          }
          
          // ===== MEMORY CLEANUP =====
          reader.onload = null;
          reader.onerror = null;
        };
        reader.onerror = function() {
          console.error('Failed to read profile photo file');
          reader.onload = null;
          reader.onerror = null;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Form submission
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      saveProfileChanges();
    });
  }
}

async function saveProfileChanges() {
  console.log('🚀 saveProfileChanges() called!');
  
  // Show saving modal
  showSavingModal();
  
  const profile = window.currentUserProfile;
  
  // Get form values
  const firstName = document.getElementById('editFirstName')?.value?.trim() || '';
  const lastName = document.getElementById('editLastName')?.value?.trim() || '';
  const dob = document.getElementById('editDateOfBirth')?.value;
  const education = document.getElementById('editEducation')?.value;
  const aboutMe = document.getElementById('editAboutMe')?.value;
  // Get usernames and build full URLs
  const facebookUsername = document.getElementById('editFacebook')?.value?.trim() || '';
  const instagramUsername = document.getElementById('editInstagram')?.value?.trim() || '';
  const linkedinUsername = document.getElementById('editLinkedIn')?.value?.trim() || '';
  
  // Build full URLs from usernames
  const facebook = facebookUsername ? `https://facebook.com/${facebookUsername}` : '';
  const instagram = instagramUsername ? `https://instagram.com/${instagramUsername}` : '';
  const linkedin = linkedinUsername ? `https://linkedin.com/in/${linkedinUsername}` : '';

  // Combine first and last name
  const fullName = `${firstName} ${lastName}`.trim();

  // Get profile photo if changed
  const photoPreview = document.getElementById('editProfilePhotoPreview');
  const mainProfilePhoto = document.getElementById('profilePhoto');
  let newPhotoUrl = null;
  let photoChanged = false;
  
  if (photoPreview && mainProfilePhoto && photoPreview.src !== mainProfilePhoto.src) {
    photoChanged = true;
    // We'll upload to Firebase Storage below
  }

  // Update profile object
  if (profile) {
    profile.fullName = fullName;
    profile.firstName = firstName;
    profile.lastName = lastName;
    profile.dateOfBirth = dob;
    profile.educationLevel = education;
    profile.userSummary = aboutMe;
    if (newPhotoUrl) {
      profile.profilePhoto = newPhotoUrl;
    }
    
    // Store social URLs separately from icon paths
    profile.socialUrls = {
      facebook: facebook || null,
      instagram: instagram || null,
      linkedin: linkedin || null
    };
  }

  // 🔥 SAVE TO FIRESTORE
  const userId = getCurrentUserId();
  if (userId && typeof updateUserProfile === 'function') {
    try {
      console.log('🔥 Saving profile to Firestore...');
      
      const updates = {
        fullName,
        dateOfBirth: dob,
        educationLevel: education,
        userSummary: aboutMe,
        socialUrls: {
          facebook: facebook || null,
          instagram: instagram || null,
          linkedin: linkedin || null
        }
      };
      
      // Upload photo to Firebase Storage if changed
      const oldPhotoUrl = profile.profilePhoto; // Store before upload
      
      if (photoChanged && photoPreview) {
        console.log('📤 Uploading profile photo to Firebase Storage...');
        
        // Convert data URL back to file for upload
        if (typeof uploadProfilePhoto === 'function' && typeof dataUrlToFile === 'function') {
          try {
            // ═══════════════════════════════════════════════════════════════
            // UPLOAD NEW PHOTO FIRST (don't touch old yet)
            // ═══════════════════════════════════════════════════════════════
            const photoFile = dataUrlToFile(photoPreview.src, `profile_${userId}.jpg`);
            const uploadResult = await uploadProfilePhoto(userId, photoFile);
            
            if (!uploadResult.success) {
              // Upload failed - abort operation
              console.error('❌ Photo upload failed:', uploadResult.errors);
              throw new Error('Photo upload failed');
            }
            
              newPhotoUrl = uploadResult.url;
              updates.profilePhoto = newPhotoUrl;
              console.log('✅ Photo uploaded to Storage:', newPhotoUrl.substring(0, 50) + '...');
            
          } catch (uploadError) {
            console.error('❌ Photo upload error:', uploadError);
            alert('Failed to upload photo. Please try again.');
            hideSavingModal();
            return; // Abort - keep old photo
          }
        } else {
          // Storage functions not available - offline mode
          console.warn('⚠️ Storage not available, operation aborted');
          alert('Photo upload requires internet connection.');
          hideSavingModal();
          return;
        }
      }
      
      const result = await updateUserProfile(userId, updates);
      
      if (result.success) {
        console.log('✅ Profile saved to Firestore!');
        
        // ═══════════════════════════════════════════════════════════════
        // DELETE OLD PHOTO (LAST - after everything else succeeds)
        // ═══════════════════════════════════════════════════════════════
        if (photoChanged && oldPhotoUrl && oldPhotoUrl.includes('firebasestorage')) {
          if (typeof deletePhotoFromStorageUrl === 'function') {
            console.log('🗑️ Deleting old profile photo...');
            const deleteResult = await deletePhotoFromStorageUrl(oldPhotoUrl);
            
            if (deleteResult.success) {
              console.log('✅ Old profile photo cleaned up');
            } else {
              console.error('⚠️ Old photo deletion failed (orphaned):', deleteResult.message);
              // TODO: Track orphan in Firestore
            }
          }
        }
      } else {
        console.error('❌ Failed to save to Firestore:', result.message);
        hideSavingModal();
        
        // Show specific error for name-locked users
        if (result.code === 'NAME_CHANGE_LOCKED') {
          alert('🔒 Name Change Requires Approval\n\n' + result.message + '\n\nThis protects the trust and safety of the GISUGO community.');
        } else {
          alert('Failed to save profile: ' + result.message);
        }
        return; // Don't update UI if save failed
        // TODO: If we uploaded new photo but Firestore failed, track as orphan
      }
    } catch (error) {
      console.error('❌ Error saving to Firestore:', error);
    }
  } else {
    console.log('⚠️ No user ID or updateUserProfile not available - changes saved locally only');
  }

  // Update displayed profile info - FORCE DOM UPDATES
  console.log('🔄 Updating DOM elements...');
  
  // Update full name
  const fullNameElement = document.querySelector('.full-name');
  if (fullNameElement) {
    fullNameElement.innerHTML = fullName || 'No Name';
    console.log('✅ Updated full name to:', fullName);
  }

  // Update About Me / User Summary
  const userSummaryElement = document.getElementById('userSummary');
  if (userSummaryElement) {
    userSummaryElement.innerHTML = (aboutMe || '').replace(/\n/g, '<br>');
    console.log('✅ Updated user summary');
  }

  // Update Education Level
  const educationElement = document.getElementById('educationLevel');
  if (educationElement) {
    educationElement.innerHTML = education || 'Not specified';
    console.log('✅ Updated education to:', education);
  }

  // Update Age if DOB changed
  if (dob) {
    const userAgeElement = document.getElementById('userAge');
    if (userAgeElement) {
      const newAge = calculateAge(dob);
      userAgeElement.textContent = `${newAge} years old`;
      console.log('✅ Updated age to:', newAge);
    }
  }

  // Update profile photo if changed
  if (newPhotoUrl && mainProfilePhoto) {
    mainProfilePhoto.classList.remove('loaded');
    mainProfilePhoto.src = newPhotoUrl;
    // The onload handler in HTML will add 'loaded' class
    console.log('✅ Updated profile photo');
  }

  console.log('✅ Profile changes saved:', {
    fullName, dob, education, aboutMe: aboutMe?.substring(0, 50) + '...'
  });

  // Hide saving modal and close overlay
  // Update social links (make icons clickable)
  updateSocialLinks(profile);
  
  hideSavingModal();
  closeEditProfileOverlay();
  
  console.log('✅ Profile updated successfully!');
}

/**
 * Show saving modal with spinner
 */
function showSavingModal() {
  let modal = document.getElementById('savingModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'savingModal';
    modal.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                  background: rgba(0, 0, 0, 0.85); z-index: 99999;
                  display: flex; align-items: center; justify-content: center;">
        <div style="background: linear-gradient(160deg, #2d3748 0%, #1f2937 100%);
                    border-radius: 20px; padding: 40px 56px; text-align: center;
                    border: 2px solid rgba(16, 185, 129, 0.4);
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(16, 185, 129, 0.15);">
          
          <!-- Animated Emoji Row -->
          <div style="font-size: 40px; margin-bottom: 20px; display: flex; justify-content: center; gap: 16px;">
            <span style="animation: bounce 0.6s ease-in-out infinite; animation-delay: 0s;">💾</span>
            <span style="animation: bounce 0.6s ease-in-out infinite; animation-delay: 0.2s;">✨</span>
            <span style="animation: bounce 0.6s ease-in-out infinite; animation-delay: 0.4s;">🚀</span>
          </div>
          
          <!-- Spinner -->
          <div style="width: 56px; height: 56px; border: 4px solid rgba(16, 185, 129, 0.2); 
                      border-top-color: #10b981; border-radius: 50%; 
                      animation: spin 0.8s linear infinite; margin: 0 auto 20px;"></div>
          
          <div style="color: #10b981; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">
            Saving Your Profile
          </div>
          <div style="color: #9ca3af; font-size: 15px; margin-top: 10px;">
            Making you look awesome! ✨
          </div>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      </style>
    `;
    document.body.appendChild(modal);
  }
  modal.style.display = 'block';
}

/**
 * Hide saving modal
 */
function hideSavingModal() {
  const modal = document.getElementById('savingModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Make saveProfileChanges globally accessible
window.saveProfileChanges = saveProfileChanges;

// ===== USER AUTHENTICATION & VERIFICATION LOGIC =====

// Check if user is currently logged in
function isUserLoggedIn() {
  // Check Firebase Auth first (for production) - with try-catch for uninitialized Firebase
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        return true;
      }
    }
  } catch (e) {
    // Firebase not initialized - continue to fallback checks
    console.log('📋 Firebase not connected, using fallback auth check');
  }
  
  // Fallback to mock check for development AND demo purposes
  // In development, we'll simulate a logged-in user
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevelopment) {
    return true; // Mock logged-in state for development
  }
  
  // TEMPORARY: For live demo purposes, simulate logged-in user
  // TODO: Remove this when real authentication is implemented
  return true; // Allow Account button to show on live site for demo
  
  // Check session storage or other auth methods
  const sessionUser = sessionStorage.getItem('currentUserId');
  return sessionUser !== null && sessionUser !== 'undefined';
}

// Check if current user is viewing their own profile
function isOwnProfile() {
  // Get current authenticated user ID
  const currentUserId = getCurrentUserId();
  if (!currentUserId) {
    return false; // Not logged in
  }
  
  // Get profile user ID from URL or loaded profile
  const profileUserId = getProfileUserId();
  
  // Compare IDs
  return currentUserId === profileUserId;
}

/**
 * Get the user ID of the profile being viewed
 * Reads from URL parameter or falls back to current user
 */
function getProfileUserId() {
  // Check URL parameter first
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('userId');
  
  if (urlUserId) {
    return urlUserId;
  }
  
  // Check if profile is already loaded
  if (window.currentUserProfile && window.currentUserProfile.userId) {
    return window.currentUserProfile.userId;
  }
  
  // Fall back to current user (viewing own profile)
  return getCurrentUserId();
}

// Check if user has any verification status
function hasVerificationStatus(userProfile) {
  if (!userProfile || !userProfile.verification) {
    return false;
  }
  
  return userProfile.verification.businessVerified || userProfile.verification.proVerified;
}

// Get current user ID (enhanced from existing logic)
function getCurrentUserId() {
  // Check Firebase Auth first (with try-catch for uninitialized Firebase)
  try {
    if (typeof firebase !== 'undefined' && firebase.auth) {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        return currentUser.uid;
      }
    }
  } catch (e) {
    // Firebase not initialized - use fallback
    console.log('📋 Using mock user ID (Firebase not connected)');
  }
  
  // Fallback to mock user for development
  return 'peter-j-ang-001';
}

// ===== ACCOUNT SETTINGS ACCESS CONTROL =====
// FIREBASE TODO: This function guards all entry points to Account Settings
// Only the profile owner (logged-in user viewing their own profile) can access Account Settings
function openAccountSettingsIfOwner() {
  if (!isUserLoggedIn()) {
    console.log('⚠️ Account Settings blocked: User not logged in');
    // FIREBASE TODO: Redirect to login or show login prompt
    return;
  }
  
  if (!isOwnProfile()) {
    console.log('⚠️ Account Settings blocked: Not viewing own profile');
    // User is viewing someone else's profile - do nothing
    return;
  }
  
  // User is logged in AND viewing their own profile - allow access
  const accountOverlay = document.getElementById('accountOverlay');
  if (accountOverlay) {
    accountOverlay.classList.add('active');
    console.log('✅ Account Settings opened for profile owner');
  }
}

// Make globally accessible for onclick handlers
window.openAccountSettingsIfOwner = openAccountSettingsIfOwner;

// ===== LINKED LOGIN METHODS MANAGEMENT =====

/**
 * Update the login methods UI based on current user's linked providers
 */
function updateLoginMethodsUI() {
  try {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.log('📋 Firebase not available for login methods check');
      return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('📋 No user logged in for login methods check');
      return;
    }
    
    // ══════════════════════════════════════════════════════════════
    // DETAILED PROVIDER LOGGING - For debugging provider issues
    // ══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔐 PROVIDER STATUS CHECK');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📌 User UID:', user.uid);
    console.log('📌 User Email:', user.email);
    console.log('📌 User Phone:', user.phoneNumber);
    console.log('📌 Provider Count:', user.providerData.length);
    
    // Log each provider in detail
    user.providerData.forEach((provider, index) => {
      console.log(`   Provider ${index + 1}:`, {
        providerId: provider.providerId,
        uid: provider.uid,
        email: provider.email,
        phoneNumber: provider.phoneNumber,
        displayName: provider.displayName
      });
    });
    
    // Get linked provider IDs
    const providerIds = user.providerData.map(p => p.providerId);
    console.log('🔗 Linked provider IDs:', providerIds);
    console.log('═══════════════════════════════════════════════════════');
    
    // Update Google
    const googleLinked = providerIds.includes('google.com');
    updateMethodUI('Google', googleLinked, user.providerData.find(p => p.providerId === 'google.com')?.email);
    
    // Update Facebook
    const facebookLinked = providerIds.includes('facebook.com');
    updateMethodUI('Facebook', facebookLinked, user.providerData.find(p => p.providerId === 'facebook.com')?.email);
    
    // Update Phone
    const phoneLinked = providerIds.includes('phone');
    updateMethodUI('Phone', phoneLinked, user.phoneNumber);
    
    // Update Email/Password
    const emailLinked = providerIds.includes('password');
    updateMethodUI('Email', emailLinked, user.email);
    
  } catch (error) {
    console.error('Error updating login methods UI:', error);
  }
}

/**
 * Update individual method UI
 */
function updateMethodUI(methodName, isLinked, detail) {
  const statusEl = document.getElementById(`${methodName.toLowerCase()}MethodStatus`);
  const btnEl = document.getElementById(`link${methodName}Btn`);
  const itemEl = document.getElementById(`loginMethod${methodName}`);
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  
  if (statusEl) {
    if (isLinked) {
      statusEl.textContent = detail ? `Linked: ${detail}` : 'Linked ✓';
      statusEl.classList.add('linked');
    } else {
      statusEl.textContent = 'Not linked';
      statusEl.classList.remove('linked');
    }
  }
  
  if (btnEl) {
    if (isLinked) {
      btnEl.textContent = 'Linked';
      btnEl.classList.remove('login-method-link');
      btnEl.classList.add('login-method-linked');
      btnEl.disabled = true;
    } else {
      btnEl.textContent = 'Link';
      btnEl.classList.add('login-method-link');
      btnEl.classList.remove('login-method-linked');
      btnEl.disabled = false;
    }
  }
  
  if (itemEl) {
    if (isLinked) {
      itemEl.classList.add('linked');
    } else {
      itemEl.classList.remove('linked');
    }
  }
  
  // Show/hide Change Password button for Email method
  if (methodName === 'Email' && changePasswordBtn) {
    if (isLinked) {
      changePasswordBtn.style.display = 'inline-block';
    } else {
      changePasswordBtn.style.display = 'none';
    }
  }
}

// ===== LINK MODAL FUNCTIONS =====

/**
 * Show the link result modal (success/error/info)
 */
function showLinkModal(type, title, message) {
  const overlay = document.getElementById('linkModalOverlay');
  const iconEl = document.getElementById('linkModalIcon');
  const titleEl = document.getElementById('linkModalTitle');
  const messageEl = document.getElementById('linkModalMessage');
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  iconEl.textContent = icons[type] || icons.info;
  iconEl.className = `link-modal-icon ${type}`;
  titleEl.textContent = title;
  messageEl.textContent = message;
  
  overlay.classList.add('show');
}

function closeLinkModal() {
  document.getElementById('linkModalOverlay').classList.remove('show');
}

// Phone linking modal functions
function openPhoneLinkModal() {
  const overlay = document.getElementById('phoneLinkModalOverlay');
  overlay.classList.add('show');
  document.getElementById('phoneLinkStep1').style.display = 'block';
  document.getElementById('phoneLinkStep2').style.display = 'none';
  document.getElementById('linkPhoneInput').value = '';
  document.getElementById('linkPhoneOTPInput').value = '';
  // Focus the input after a short delay
  setTimeout(() => {
    document.getElementById('linkPhoneInput').focus();
  }, 100);
}

function closePhoneLinkModal() {
  document.getElementById('phoneLinkModalOverlay').classList.remove('show');
  // Clean up reCAPTCHA
  if (window.phoneLinkRecaptcha) {
    window.phoneLinkRecaptcha.clear();
    window.phoneLinkRecaptcha = null;
  }
}

function resetPhoneLinkModal() {
  document.getElementById('phoneLinkStep1').style.display = 'block';
  document.getElementById('phoneLinkStep2').style.display = 'none';
}

// Email linking modal functions
function openEmailLinkModal() {
  const overlay = document.getElementById('emailLinkModalOverlay');
  overlay.classList.add('show');
  document.getElementById('linkEmailInput').value = '';
  document.getElementById('linkPasswordInput').value = '';
  document.getElementById('linkConfirmPasswordInput').value = '';
  // Focus the input after a short delay
  setTimeout(() => {
    document.getElementById('linkEmailInput').focus();
  }, 100);
}

function closeEmailLinkModal() {
  document.getElementById('emailLinkModalOverlay').classList.remove('show');
}

// Make modal functions globally accessible
window.showLinkModal = showLinkModal;
window.closeLinkModal = closeLinkModal;
window.openPhoneLinkModal = openPhoneLinkModal;
window.closePhoneLinkModal = closePhoneLinkModal;
window.resetPhoneLinkModal = resetPhoneLinkModal;
window.openEmailLinkModal = openEmailLinkModal;
window.closeEmailLinkModal = closeEmailLinkModal;

// Initialize link modal event handlers (prevent click-through)
document.addEventListener('DOMContentLoaded', function() {
  // Stop propagation on modal containers to prevent click-through
  const modalContainers = document.querySelectorAll('.link-modal-container');
  modalContainers.forEach(container => {
    container.addEventListener('click', (e) => e.stopPropagation());
    container.addEventListener('mousedown', (e) => e.stopPropagation());
    container.addEventListener('touchstart', (e) => e.stopPropagation());
  });
  
  // Close modals when clicking overlay background
  const overlays = ['linkModalOverlay', 'phoneLinkModalOverlay', 'emailLinkModalOverlay', 'changePasswordModalOverlay'];
  overlays.forEach(id => {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('show');
        }
      });
    }
  });
});

/**
 * Link Google account to current user
 */
async function linkGoogleAccount() {
  try {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      showLinkModal('error', 'Connection Error', 'Firebase not available. Please try again later.');
      return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
      showLinkModal('error', 'Not Logged In', 'Please log in first to link accounts.');
      return;
    }
    
    // ══════════════════════════════════════════════════════════════
    // PRE-LINK LOGGING
    // ══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔗 LINKING GOOGLE - BEFORE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📌 User UID:', user.uid);
    console.log('📌 Current providers BEFORE link:', user.providerData.map(p => p.providerId));
    user.providerData.forEach((p, i) => {
      console.log(`   [${i}] ${p.providerId}: ${p.email || p.phoneNumber || 'no identifier'}`);
    });
    console.log('═══════════════════════════════════════════════════════');
    
    const provider = new firebase.auth.GoogleAuthProvider();
    const linkResult = await user.linkWithPopup(provider);
    
    // ══════════════════════════════════════════════════════════════
    // POST-LINK LOGGING
    // ══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔗 LINKING GOOGLE - AFTER');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📌 Link result user UID:', linkResult.user.uid);
    console.log('📌 Linked Google email:', linkResult.user.providerData.find(p => p.providerId === 'google.com')?.email);
    console.log('📌 Current providers AFTER link:', linkResult.user.providerData.map(p => p.providerId));
    linkResult.user.providerData.forEach((p, i) => {
      console.log(`   [${i}] ${p.providerId}: ${p.email || p.phoneNumber || 'no identifier'}`);
    });
    console.log('═══════════════════════════════════════════════════════');
    
    console.log('✅ Google account linked successfully!');
    showLinkModal('success', 'Google Linked!', 'Your Google account has been linked successfully. You can now sign in with Google.');
    updateLoginMethodsUI();
    
  } catch (error) {
    console.error('❌ Error linking Google:', error);
    if (error.code === 'auth/credential-already-in-use') {
      showLinkModal('error', 'Already In Use', 'This Google account is already linked to another GISUGO account.');
    } else if (error.code === 'auth/provider-already-linked') {
      showLinkModal('warning', 'Already Linked', 'A Google account is already linked to your profile.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User closed popup, no error needed
    } else {
      showLinkModal('error', 'Link Failed', error.message);
    }
  }
}

/**
 * Link Facebook account to current user
 */
async function linkFacebookAccount() {
  try {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      showLinkModal('error', 'Connection Error', 'Firebase not available. Please try again later.');
      return;
    }
    
    const user = firebase.auth().currentUser;
    if (!user) {
      showLinkModal('error', 'Not Logged In', 'Please log in first to link accounts.');
      return;
    }
    
    const provider = new firebase.auth.FacebookAuthProvider();
    await user.linkWithPopup(provider);
    
    console.log('✅ Facebook account linked successfully!');
    showLinkModal('success', 'Facebook Linked!', 'Your Facebook account has been linked successfully. You can now sign in with Facebook.');
    updateLoginMethodsUI();
    
  } catch (error) {
    console.error('❌ Error linking Facebook:', error);
    if (error.code === 'auth/credential-already-in-use') {
      showLinkModal('error', 'Already In Use', 'This Facebook account is already linked to another GISUGO account.');
    } else if (error.code === 'auth/provider-already-linked') {
      showLinkModal('warning', 'Already Linked', 'A Facebook account is already linked to your profile.');
    } else if (error.code === 'auth/operation-not-allowed') {
      showLinkModal('error', 'Not Enabled', 'Facebook sign-in is not enabled. Please contact support or enable it in Firebase Console.');
    } else if (error.code === 'auth/popup-closed-by-user') {
      // User closed popup, no error needed
    } else {
      showLinkModal('error', 'Link Failed', error.message);
    }
  }
}

/**
 * Open phone linking modal
 */
function linkPhoneNumber() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    showLinkModal('error', 'Connection Error', 'Firebase not available. Please try again later.');
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    showLinkModal('error', 'Not Logged In', 'Please log in first to link accounts.');
    return;
  }
  
  openPhoneLinkModal();
}

/**
 * Send verification code for phone linking
 */
async function sendPhoneLinkCode() {
  const phoneInput = document.getElementById('linkPhoneInput');
  const phoneNumber = phoneInput.value.trim();
  const sendBtn = document.getElementById('sendPhoneCodeBtn');
  
  if (!phoneNumber) {
    showLinkModal('warning', 'Phone Required', 'Please enter your phone number with country code.');
    return;
  }
  
  if (!phoneNumber.startsWith('+')) {
    showLinkModal('warning', 'Invalid Format', 'Please include the country code (e.g., +639123456789).');
    return;
  }
  
  try {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
    
    // Set up reCAPTCHA
    if (!window.phoneLinkRecaptcha) {
      window.phoneLinkRecaptcha = new firebase.auth.RecaptchaVerifier('phoneRecaptchaContainer', {
        size: 'invisible',
        callback: () => {}
      });
    }
    
    const provider = new firebase.auth.PhoneAuthProvider();
    window.phoneLinkVerificationId = await provider.verifyPhoneNumber(phoneNumber, window.phoneLinkRecaptcha);
    
    // Show step 2
    document.getElementById('phoneLinkStep1').style.display = 'none';
    document.getElementById('phoneLinkStep2').style.display = 'block';
    document.getElementById('phoneLinkNumber').textContent = phoneNumber;
    document.getElementById('linkPhoneOTPInput').focus();
    
  } catch (error) {
    console.error('❌ Error sending code:', error);
    showLinkModal('error', 'Send Failed', error.message);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Verification Code';
  }
}

/**
 * Verify OTP and link phone
 */
async function verifyPhoneLinkCode() {
  const otpInput = document.getElementById('linkPhoneOTPInput');
  const code = otpInput.value.trim();
  
  if (!code || code.length !== 6) {
    showLinkModal('warning', 'Invalid Code', 'Please enter the 6-digit verification code.');
    return;
  }
  
  try {
    const user = firebase.auth().currentUser;
    const credential = firebase.auth.PhoneAuthProvider.credential(window.phoneLinkVerificationId, code);
    await user.linkWithCredential(credential);
    
    console.log('✅ Phone number linked successfully!');
    closePhoneLinkModal();
    showLinkModal('success', 'Phone Linked!', 'Your phone number has been linked successfully. You can now sign in with SMS.');
    updateLoginMethodsUI();
    
  } catch (error) {
    console.error('❌ Error verifying code:', error);
    if (error.code === 'auth/invalid-verification-code') {
      showLinkModal('error', 'Invalid Code', 'The verification code is incorrect. Please try again.');
    } else if (error.code === 'auth/credential-already-in-use') {
      closePhoneLinkModal();
      showLinkModal('error', 'Already In Use', 'This phone number is already linked to another GISUGO account.');
    } else if (error.code === 'auth/provider-already-linked') {
      closePhoneLinkModal();
      showLinkModal('warning', 'Already Linked', 'A phone number is already linked to your profile.');
    } else {
      showLinkModal('error', 'Verification Failed', error.message);
    }
  }
}

/**
 * Open email/password linking modal
 */
function linkEmailPassword() {
  if (typeof firebase === 'undefined' || !firebase.auth) {
    showLinkModal('error', 'Connection Error', 'Firebase not available. Please try again later.');
    return;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    showLinkModal('error', 'Not Logged In', 'Please log in first to link accounts.');
    return;
  }
  
  openEmailLinkModal();
}

/**
 * Submit email/password link
 */
async function submitEmailLink() {
  const email = document.getElementById('linkEmailInput').value.trim();
  const password = document.getElementById('linkPasswordInput').value;
  const confirmPassword = document.getElementById('linkConfirmPasswordInput').value;
  
  if (!email) {
    showLinkModal('warning', 'Email Required', 'Please enter your email address.');
    return;
  }
  
  if (!password || password.length < 6) {
    showLinkModal('warning', 'Password Too Short', 'Password must be at least 6 characters.');
    return;
  }
  
  if (password !== confirmPassword) {
    showLinkModal('warning', 'Password Mismatch', 'Passwords do not match. Please try again.');
    return;
  }
  
  try {
    const user = firebase.auth().currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(email, password);
    await user.linkWithCredential(credential);
    
    console.log('✅ Email/password linked successfully!');
    closeEmailLinkModal();
    showLinkModal('success', 'Email Linked!', 'Your email and password have been linked. You can now sign in with either method.');
    updateLoginMethodsUI();
    
  } catch (error) {
    console.error('❌ Error linking email/password:', error);
    if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
      showLinkModal('error', 'Email In Use', 'This email is already linked to another account.');
    } else if (error.code === 'auth/provider-already-linked') {
      closeEmailLinkModal();
      showLinkModal('warning', 'Already Linked', 'An email/password is already linked to your profile.');
    } else if (error.code === 'auth/invalid-email') {
      showLinkModal('warning', 'Invalid Email', 'Please enter a valid email address.');
    } else {
      showLinkModal('error', 'Link Failed', error.message);
    }
  }
}

// ===== CHANGE PASSWORD FUNCTIONS =====

function openChangePasswordModal() {
  const overlay = document.getElementById('changePasswordModalOverlay');
  overlay.classList.add('show');
  document.getElementById('currentPasswordInput').value = '';
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('confirmNewPasswordInput').value = '';
  setTimeout(() => {
    document.getElementById('currentPasswordInput').focus();
  }, 100);
}

function closeChangePasswordModal() {
  document.getElementById('changePasswordModalOverlay').classList.remove('show');
}

/**
 * Submit password change
 */
async function submitChangePassword() {
  const currentPassword = document.getElementById('currentPasswordInput').value;
  const newPassword = document.getElementById('newPasswordInput').value;
  const confirmPassword = document.getElementById('confirmNewPasswordInput').value;
  
  if (!currentPassword) {
    showLinkModal('warning', 'Current Password Required', 'Please enter your current password to verify your identity.');
    return;
  }
  
  if (!newPassword || newPassword.length < 6) {
    showLinkModal('warning', 'Password Too Short', 'New password must be at least 6 characters.');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showLinkModal('warning', 'Password Mismatch', 'New passwords do not match. Please try again.');
    return;
  }
  
  if (currentPassword === newPassword) {
    showLinkModal('warning', 'Same Password', 'New password must be different from current password.');
    return;
  }
  
  try {
    const user = firebase.auth().currentUser;
    if (!user || !user.email) {
      showLinkModal('error', 'Not Logged In', 'Please log in first.');
      return;
    }
    
    // Re-authenticate user first (required for sensitive operations)
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    
    // Now update the password
    await user.updatePassword(newPassword);
    
    console.log('✅ Password changed successfully!');
    closeChangePasswordModal();
    showLinkModal('success', 'Password Updated!', 'Your password has been changed successfully.');
    
  } catch (error) {
    console.error('❌ Error changing password:', error);
    if (error.code === 'auth/wrong-password') {
      showLinkModal('error', 'Wrong Password', 'The current password you entered is incorrect.');
    } else if (error.code === 'auth/weak-password') {
      showLinkModal('warning', 'Weak Password', 'Please choose a stronger password (at least 6 characters).');
    } else if (error.code === 'auth/requires-recent-login') {
      showLinkModal('error', 'Session Expired', 'For security, please log out and log back in, then try again.');
    } else {
      showLinkModal('error', 'Update Failed', error.message);
    }
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail() {
  try {
    const user = firebase.auth().currentUser;
    if (!user || !user.email) {
      showLinkModal('error', 'No Email', 'No email address found for your account.');
      return;
    }
    
    await firebase.auth().sendPasswordResetEmail(user.email);
    
    closeChangePasswordModal();
    showLinkModal('success', 'Email Sent!', `A password reset link has been sent to ${user.email}. Check your inbox.`);
    
  } catch (error) {
    console.error('❌ Error sending reset email:', error);
    showLinkModal('error', 'Send Failed', error.message);
  }
}

// Make change password functions globally accessible
window.openChangePasswordModal = openChangePasswordModal;
window.closeChangePasswordModal = closeChangePasswordModal;
window.submitChangePassword = submitChangePassword;
window.sendPasswordResetEmail = sendPasswordResetEmail;

// Make linking functions globally accessible
window.sendPhoneLinkCode = sendPhoneLinkCode;
window.verifyPhoneLinkCode = verifyPhoneLinkCode;
window.submitEmailLink = submitEmailLink;

// Make functions globally accessible
window.linkGoogleAccount = linkGoogleAccount;
window.linkFacebookAccount = linkFacebookAccount;
window.linkPhoneNumber = linkPhoneNumber;
window.linkEmailPassword = linkEmailPassword;
window.updateLoginMethodsUI = updateLoginMethodsUI;

// Update badge and account button visibility based on auth and verification status
function updateBadgeVisibility(userProfile) {
  const businessVerifiedBadgeGrid = document.getElementById('businessVerifiedBadgeGrid');
  const proVerifiedBadgeGrid = document.getElementById('proVerifiedBadgeGrid');
  const newUserBadgeGrid = document.getElementById('newUserBadgeGrid');
  const accountBtn = document.getElementById('accountBtn');
  const profilePhotoContainer = document.getElementById('profilePhotoContainer');
  const logoutSection = document.getElementById('logoutSection');
  
  console.log('🔍 Updating badge visibility...');
  console.log('User logged in:', isUserLoggedIn());
  console.log('Own profile:', isOwnProfile());
  console.log('Has verification:', hasVerificationStatus(userProfile));
  
  // Determine if user can access Account Settings
  const canAccessAccountSettings = isUserLoggedIn() && isOwnProfile();
  
  // Account button logic: Only show when user is logged in AND viewing their own profile
  if (accountBtn) {
    accountBtn.style.display = canAccessAccountSettings ? 'inline-flex' : 'none';
    console.log('Account button visibility:', canAccessAccountSettings ? 'visible' : 'hidden');
  }
  
  // Logout button logic: Only show when viewing own profile
  if (logoutSection) {
    logoutSection.style.display = canAccessAccountSettings ? 'block' : 'none';
    console.log('Logout button visibility:', canAccessAccountSettings ? 'visible' : 'hidden');
  }
  
  // Profile photo click-to-open: Only enable for profile owner
  // FIREBASE TODO: In production, this controls whether clicking the photo opens Account Settings
  if (profilePhotoContainer) {
    profilePhotoContainer.style.cursor = canAccessAccountSettings ? 'pointer' : 'default';
    // Remove interactive attributes if not owner
    if (canAccessAccountSettings) {
      profilePhotoContainer.setAttribute('role', 'button');
      profilePhotoContainer.setAttribute('tabindex', '0');
      profilePhotoContainer.setAttribute('aria-label', 'Open Account Settings');
    } else {
      profilePhotoContainer.removeAttribute('role');
      profilePhotoContainer.removeAttribute('tabindex');
      profilePhotoContainer.removeAttribute('aria-label');
    }
    console.log('Profile photo clickable:', canAccessAccountSettings ? 'yes' : 'no');
  }
  
  // Badge visibility logic
  const hasVerification = hasVerificationStatus(userProfile);
  
  // Badge visibility logic: Show only one badge in grid
  if (businessVerifiedBadgeGrid && proVerifiedBadgeGrid && newUserBadgeGrid && userProfile?.verification) {
    // Priority: Business > Pro > New User
    if (userProfile.verification.businessVerified) {
      businessVerifiedBadgeGrid.style.display = 'inline-flex';
      proVerifiedBadgeGrid.style.display = 'none';
      newUserBadgeGrid.style.display = 'none';
      console.log('Showing: Business Verified badge (grid)');
    } else if (userProfile.verification.proVerified) {
      businessVerifiedBadgeGrid.style.display = 'none';
      proVerifiedBadgeGrid.style.display = 'inline-flex';
      newUserBadgeGrid.style.display = 'none';
      console.log('Showing: Pro Verified badge (grid)');
    } else {
      businessVerifiedBadgeGrid.style.display = 'none';
      proVerifiedBadgeGrid.style.display = 'none';
      newUserBadgeGrid.style.display = 'inline-flex';
      console.log('Showing: New Member badge (grid)');
    }
  }
  
  // Update account overlay verification status
  updateAccountOverlayVerificationStatus(userProfile);
  
  // Update G-Coins display
  updateGCoinsDisplay(userProfile);
}

// Update the verification status display in account overlay
function updateAccountOverlayVerificationStatus(userProfile) {
  const verificationStatusIcon = document.getElementById('verificationStatusIcon');
  const verificationStatusName = document.getElementById('verificationStatusName');
  const verificationStatusDesc = document.getElementById('verificationStatusDesc');
  const verificationStatusBadge = document.getElementById('verificationStatusBadge');
  const submitIdOption = document.getElementById('submitIdOption');
  
  if (verificationStatusIcon && verificationStatusName && verificationStatusDesc && verificationStatusBadge && userProfile?.verification) {
    // Determine current verification status
    if (userProfile.verification.businessVerified) {
      // Business Verified
      verificationStatusIcon.textContent = '👑';
      verificationStatusName.textContent = 'Business Verified';
      verificationStatusDesc.textContent = 'Your business account is verified';
      verificationStatusBadge.textContent = 'Active';
      verificationStatusBadge.className = 'account-option-status active';
      console.log('💼 Account overlay showing: Business Verified');
    } else if (userProfile.verification.proVerified) {
      // Pro Verified
      verificationStatusIcon.textContent = '⭐';
      verificationStatusName.textContent = 'Pro Verified';
      verificationStatusDesc.textContent = 'Your account is verified';
      verificationStatusBadge.textContent = 'Active';
      verificationStatusBadge.className = 'account-option-status active';
      console.log('⭐ Account overlay showing: Pro Verified');
    } else {
      // New Member (Not Verified)
      verificationStatusIcon.textContent = '🌱';
      verificationStatusName.textContent = 'New Member';
      verificationStatusDesc.textContent = 'Not verified yet';
      verificationStatusBadge.textContent = 'Not Verified';
      verificationStatusBadge.className = 'account-option-status inactive';
      console.log('🌱 Account overlay showing: New Member');
    }
  }
  
  // Show/hide Submit ID option based on real backend logic
  if (submitIdOption && userProfile?.verification) {
    // Backend Logic: Show if user purchased P250/P500 but hasn't submitted ID yet
    const canSubmitId = userProfile.verification.eligibleForSubmission && 
                        !userProfile.verification.idSubmitted;
    
    if (canSubmitId) {
      submitIdOption.style.display = 'block';
      console.log('💳 Submit ID option shown - user eligible and hasn\'t submitted yet');
    } else {
      submitIdOption.style.display = 'none';
      console.log('💳 Submit ID option hidden - not eligible or already submitted');
    }
  }
}

// ===== G-COINS WALLET SYSTEM =====

// Update G-Coins display in account overlay
function updateGCoinsDisplay(userProfile) {
  const gCoinsBalance = document.getElementById('gCoinsBalance');
  const gCoinsCurrentBalance = document.getElementById('gCoinsCurrentBalance');
  
  if (userProfile?.wallet?.gCoinsBalance !== undefined) {
    const balance = userProfile.wallet.gCoinsBalance;
    
    // Update main balance display
    if (gCoinsBalance) {
      gCoinsBalance.textContent = balance;
    }
    
    // Update current balance in top-up overlay
    if (gCoinsCurrentBalance) {
      gCoinsCurrentBalance.textContent = `${balance} G-Coins`;
    }
    
    console.log(`💰 G-Coins balance updated: ${balance}`);
  }
}

// G-Coins Top-Up Overlay functionality
const gCoinsTopUpBtn = document.getElementById('gCoinsTopUpBtn');
const gCoinsOverlay = document.getElementById('gCoinsOverlay');
const gCoinsCloseBtn = document.getElementById('gCoinsCloseBtn');
const gCoinsCancelBtn = document.getElementById('gCoinsCancelBtn');
const gCoinsPurchaseBtn = document.getElementById('gCoinsPurchaseBtn');

let selectedPackage = null;

if (gCoinsTopUpBtn && gCoinsOverlay) {
  // Open G-Coins overlay
  gCoinsTopUpBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    gCoinsOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('💰 G-Coins top-up overlay opened');
  });

  // Close overlay functions
  function closeGCoinsOverlay() {
    gCoinsOverlay.classList.remove('active');
    document.body.style.overflow = '';
    selectedPackage = null;
    updatePurchaseButton();
    // Clear any selected packages
    document.querySelectorAll('.gcoins-package').forEach(pkg => {
      pkg.classList.remove('selected');
    });
    console.log('💰 G-Coins overlay closed');
  }

  // Close via close button
  if (gCoinsCloseBtn) {
    gCoinsCloseBtn.addEventListener('click', closeGCoinsOverlay);
  }

  // Close via cancel button
  if (gCoinsCancelBtn) {
    gCoinsCancelBtn.addEventListener('click', closeGCoinsOverlay);
  }

  // Close via background click
  gCoinsOverlay.addEventListener('click', function(e) {
    if (e.target === gCoinsOverlay) {
      closeGCoinsOverlay();
    }
  });

  // Close via Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && gCoinsOverlay.classList.contains('active')) {
      closeGCoinsOverlay();
    }
  });
}

// Package selection functionality
const gCoinsPackages = document.querySelectorAll('.gcoins-package');
gCoinsPackages.forEach(package => {
  package.addEventListener('click', function() {
    // Remove selected class from all packages
    gCoinsPackages.forEach(pkg => pkg.classList.remove('selected'));
    
    // Add selected class to clicked package
    this.classList.add('selected');
    
    // Store selected package data
    selectedPackage = {
      amount: parseInt(this.getAttribute('data-amount')),
      coins: parseInt(this.getAttribute('data-coins')),
      verification: this.getAttribute('data-verification') || null
    };
    
    console.log(`💰 Package selected: ₱${selectedPackage.amount} for ${selectedPackage.coins} G-Coins${selectedPackage.verification ? ` + ${selectedPackage.verification} verification` : ''}`);
    
    // Update purchase button
    updatePurchaseButton();
  });
});

// Update purchase button based on selection
function updatePurchaseButton() {
  if (gCoinsPurchaseBtn) {
    if (selectedPackage) {
      gCoinsPurchaseBtn.disabled = false;
      gCoinsPurchaseBtn.textContent = `Purchase ₱${selectedPackage.amount} Package`;
    } else {
      gCoinsPurchaseBtn.disabled = true;
      gCoinsPurchaseBtn.textContent = 'Select Package to Continue';
    }
  }
}

// Purchase button functionality
if (gCoinsPurchaseBtn) {
  gCoinsPurchaseBtn.addEventListener('click', function() {
    if (selectedPackage) {
      handleGCoinsPurchase(selectedPackage);
    }
  });
}

// Handle G-Coins purchase (mock implementation)
function handleGCoinsPurchase(packageData) {
  console.log(`💰 Processing purchase: ₱${packageData.amount} for ${packageData.coins} G-Coins`);
  
  // TODO: PRODUCTION INTEGRATION POINTS
  // 1. Replace with real payment processor API (GCash, PayMaya, Credit Card)
  // 2. Add Firebase transaction logging
  // 3. Implement server-side verification status updates
  // 4. Add proper error handling for failed payments
  // 5. Integrate with backend wallet service
  
  // In production, this would integrate with payment processor
  // For now, we'll simulate the purchase process
  
  // Show loading state
  if (gCoinsPurchaseBtn) {
    gCoinsPurchaseBtn.disabled = true;
    gCoinsPurchaseBtn.textContent = 'Processing Payment...';
  }
  
  // Simulate payment processing delay
  setTimeout(() => {
    // Mock successful purchase
    console.log('💰 Payment successful! Adding G-Coins to account...');
    
    // Update user's G-Coins balance (mock)
    if (window.currentUserProfile && window.currentUserProfile.wallet) {
      window.currentUserProfile.wallet.gCoinsBalance += packageData.coins;
      window.currentUserProfile.wallet.totalPurchased += packageData.coins;
      window.currentUserProfile.wallet.lastTopUp = new Date().toISOString();
      
      // Handle verification upgrades
      let verificationMessage = '';
      if (packageData.verification === 'pro') {
        window.currentUserProfile.verification.proVerified = true;
        window.currentUserProfile.verification.verificationDate = new Date().toISOString();
        window.currentUserProfile.verification.eligibleForSubmission = true; // Can submit ID
        verificationMessage = ' 🆔 BONUS: Your account has been upgraded to Pro Verified status!';
        justCompletedEligiblePurchase = true; // Flag for Submit ID visibility
      } else if (packageData.verification === 'business') {
        window.currentUserProfile.verification.businessVerified = true;
        window.currentUserProfile.verification.verificationDate = new Date().toISOString();
        window.currentUserProfile.verification.eligibleForSubmission = true; // Can submit ID
        verificationMessage = ' 🏢 BONUS: Your account has been upgraded to Business Verified status!';
        justCompletedEligiblePurchase = true; // Flag for Submit ID visibility
      }
      
      // Update displays
      updateGCoinsDisplay(window.currentUserProfile);
      updateBadgeVisibility(window.currentUserProfile);
      updateAccountOverlayVerificationStatus(window.currentUserProfile);
      
      // Show custom success overlay instead of browser alert
      showPurchaseSuccessOverlay(packageData, window.currentUserProfile.wallet.gCoinsBalance, verificationMessage);
      
      // Close G-Coins overlay
      closeGCoinsOverlay();
    }
    
    // Reset button
    if (gCoinsPurchaseBtn) {
      gCoinsPurchaseBtn.disabled = false;
      gCoinsPurchaseBtn.textContent = 'Select Package to Continue';
    }
  }, 2000); // 2 second delay to simulate payment processing
}

// ===== PURCHASE SUCCESS OVERLAY FUNCTIONALITY =====

// Create confetti burst animation from popper icon - EXACT copy from jobs.html
function createConfettiBurst() {
  const container = document.querySelector('.purchase-success-container');
  if (!container) return;
  
  console.log('🎊 Creating confetti effect with 40 particles');
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
  const particleCount = 40;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-piece';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    // Start all particles at the popper icon position (50% left, 12% top to align with icon)
    particle.style.left = '50%';
    particle.style.top = '12%';
    
    // Calculate random burst direction and distance in pixels
    const angle = Math.random() * 360; // Random angle in degrees
    const velocity = Math.random() * 200 + 100; // Random velocity between 100-300px
    const gravity = -(Math.random() * 150 + 100); // Random upward force (negative gravity)
    
    // Convert angle to radians for calculation
    const angleRad = angle * (Math.PI / 180);
    const endX = Math.cos(angleRad) * velocity;
    const endY = Math.sin(angleRad) * velocity + gravity; // Add gravity
    
    // Set CSS custom properties for animation
    particle.style.setProperty('--end-x', endX + 'px');
    particle.style.setProperty('--end-y', endY + 'px');
    particle.style.setProperty('--rotation', (Math.random() * 720 + 360) + 'deg');
    
    // Random timing for more natural effect
    particle.style.animationDelay = Math.random() * 0.3 + 's';
    particle.style.animationDuration = (Math.random() * 1 + 1.5) + 's';
    
    container.appendChild(particle);
    
    // Remove particle after animation
    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 3000);
  }
  
  console.log('🎉 Confetti burst triggered!');
}

// Show custom purchase success overlay
function showPurchaseSuccessOverlay(packageData, newBalance, verificationMessage) {
  const purchaseSuccessOverlay = document.getElementById('purchaseSuccessOverlay');
  const purchaseSuccessMessage = document.getElementById('purchaseSuccessMessage');
  const successBalanceAmount = document.getElementById('successBalanceAmount');
  const verificationUpgradeSection = document.getElementById('verificationUpgradeSection');
  const verificationUpgradeMessage = document.getElementById('verificationUpgradeMessage');
  
  if (purchaseSuccessOverlay) {
    // Update purchase message
    if (purchaseSuccessMessage) {
      purchaseSuccessMessage.textContent = `You've successfully purchased ${packageData.coins} G-Coins for ₱${packageData.amount}!`;
    }
    
    // Update balance display
    if (successBalanceAmount) {
      successBalanceAmount.textContent = `${newBalance} G-Coins`;
    }
    
    // Show verification upgrade section if applicable
    if (verificationUpgradeSection && verificationMessage) {
      if (verificationUpgradeMessage) {
        if (packageData.verification === 'pro') {
          verificationUpgradeMessage.textContent = 'Your account is now eligible to be upgraded to Pro Verified status!';
        } else if (packageData.verification === 'business') {
          verificationUpgradeMessage.textContent = 'Your account is now eligible to be upgraded to Business Verified status!';
        }
      }
      verificationUpgradeSection.style.display = 'block';
    } else if (verificationUpgradeSection) {
      verificationUpgradeSection.style.display = 'none';
    }
    
    // Show overlay
    purchaseSuccessOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Trigger confetti burst after a short delay (wait for overlay to render)
    setTimeout(() => {
      createConfettiBurst();
    }, 100);
    
    console.log('💰 Purchase success overlay displayed');
  }
}

// Purchase Success Overlay functionality
const purchaseSuccessCloseBtn = document.getElementById('purchaseSuccessCloseBtn');
const purchaseSuccessOverlay = document.getElementById('purchaseSuccessOverlay');
const verificationSubmitBtn = document.getElementById('verificationSubmitBtn');

// Close purchase success overlay
function closePurchaseSuccessOverlay() {
  if (purchaseSuccessOverlay) {
    purchaseSuccessOverlay.classList.remove('active');
    
    // Smooth transition to Account Settings overlay with updated info
    setTimeout(() => {
      if (accountOverlay) {
        accountOverlay.classList.add('active');
        // Refresh the account overlay with latest user data
        if (window.currentUserProfile) {
          updateGCoinsDisplay(window.currentUserProfile);
          updateAccountOverlayVerificationStatus(window.currentUserProfile);
        }
        console.log('💰 Transitioned to Account Settings with updated info');
      }
    }, 100);
    
    console.log('💰 Purchase success overlay closed');
  }
}

if (purchaseSuccessCloseBtn) {
  purchaseSuccessCloseBtn.addEventListener('click', closePurchaseSuccessOverlay);
}

// Handle verification submit button in success overlay
if (verificationSubmitBtn) {
  verificationSubmitBtn.addEventListener('click', function() {
    closePurchaseSuccessOverlay();
    openVerificationOverlay();
  });
}

// Handle Get Verified button in Account Settings
const getVerifiedBtn = document.getElementById('getVerifiedBtn');
if (getVerifiedBtn) {
  getVerifiedBtn.addEventListener('click', function() {
    // Close account overlay first
    if (accountOverlay) {
      accountOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
    // Open verification overlay
    openVerificationOverlay();
  });
}

// ===== ID VERIFICATION OVERLAY FUNCTIONALITY =====

const verificationOverlay = document.getElementById('verificationOverlay');
const verificationCloseBtn = document.getElementById('verificationCloseBtn');
const verificationCancelBtn = document.getElementById('verificationCancelBtn');
const uploadAreaId = document.getElementById('uploadAreaId');
const uploadAreaSelfie = document.getElementById('uploadAreaSelfie');
const idFileInput = document.getElementById('idFileInput');
const selfieFileInput = document.getElementById('selfieFileInput');
const verificationSubmitIdBtn = document.getElementById('verificationSubmitIdBtn');

let selectedIdFile = null;
let selectedSelfieFile = null;

// Open verification overlay
function openVerificationOverlay() {
  if (verificationOverlay) {
    verificationOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('🆔 Verification overlay opened');
  }
}

// Close verification overlay
function closeVerificationOverlay() {
  if (verificationOverlay) {
    verificationOverlay.classList.remove('active');
    document.body.style.overflow = '';
    selectedIdFile = null;
    selectedSelfieFile = null;
    updateVerificationSubmitButton();
    
    // Reset ID upload area
    if (uploadAreaId) {
      uploadAreaId.innerHTML = `
        <div class="upload-icon">🆔</div>
        <div class="upload-text">
          <div class="upload-primary">Click to upload your ID photo</div>
          <div class="upload-secondary">JPG, PNG files up to 5MB</div>
        </div>
      `;
    }
    
    // Reset selfie upload area
    if (uploadAreaSelfie) {
      uploadAreaSelfie.innerHTML = `
        <div class="upload-icon">
          <img src="public/images/Selfie-ID.jpg" alt="Selfie with ID example" class="selfie-example-img">
        </div>
        <div class="upload-text">
          <div class="upload-primary">Click to upload selfie holding your ID</div>
          <div class="upload-secondary">Clear photo of you holding the ID next to your face</div>
        </div>
      `;
    }
    
    console.log('🆔 Verification overlay closed');
  }
}

// Close buttons
if (verificationCloseBtn) {
  verificationCloseBtn.addEventListener('click', closeVerificationOverlay);
}

if (verificationCancelBtn) {
  verificationCancelBtn.addEventListener('click', closeVerificationOverlay);
}

// ===== EXPLANATION OVERLAY FUNCTIONALITY =====

// Get explanation overlay elements
const explanationOverlay = document.getElementById('explanationOverlay');
const explanationCloseBtn = document.getElementById('explanationCloseBtn');
const explanationCancelBtn = document.getElementById('explanationCancelBtn');
const explanationPurchaseBtn = document.getElementById('explanationPurchaseBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const facebookShareBtn = document.getElementById('facebookShareBtn');
const smsShareBtn = document.getElementById('smsShareBtn');
const linkShareBtn = document.getElementById('linkShareBtn');
const userReferralCode = document.getElementById('userReferralCode');
const explanationGCoinsBalance = document.getElementById('explanationGCoinsBalance');

// Open explanation overlay
function openExplanationOverlay() {
  if (explanationOverlay) {
    // Update G-Coins balance display
    if (explanationGCoinsBalance && window.currentUserProfile) {
      explanationGCoinsBalance.textContent = window.currentUserProfile.wallet.gCoinsBalance;
    }
    
    // Update referral code and progress
    updateReferralDisplay();
    
    explanationOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('📋 Explanation overlay opened');
  }
}

// Close explanation overlay
function closeExplanationOverlay() {
  if (explanationOverlay) {
    explanationOverlay.classList.remove('active');
    document.body.style.overflow = '';
    console.log('📋 Explanation overlay closed');
  }
}

// Close buttons
if (explanationCloseBtn) {
  explanationCloseBtn.addEventListener('click', closeExplanationOverlay);
}

if (explanationCancelBtn) {
  explanationCancelBtn.addEventListener('click', closeExplanationOverlay);
}

// Purchase button - redirect to G-Coins overlay
if (explanationPurchaseBtn) {
  explanationPurchaseBtn.addEventListener('click', function() {
    closeExplanationOverlay();
    // Open G-Coins overlay after a brief delay
    setTimeout(() => {
      if (gCoinsTopUpBtn) {
        gCoinsTopUpBtn.click();
      }
    }, 200);
  });
}

// Background click to close
if (explanationOverlay) {
  explanationOverlay.addEventListener('click', function(e) {
    if (e.target === explanationOverlay) {
      closeExplanationOverlay();
    }
  });
}

// Escape key to close
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && explanationOverlay && explanationOverlay.classList.contains('active')) {
    closeExplanationOverlay();
  }
});

// ===== REFERRAL SYSTEM FUNCTIONALITY =====

// Generate user referral code
function generateReferralCode(userId) {
  // Format: GISUGO-{userId}-REFER
  return `GISUGO-${userId || 'USER123'}-REFER`;
}

// Update referral display with current user data
function updateReferralDisplay() {
  if (!window.currentUserProfile) return;
  
  const userProfile = window.currentUserProfile;
  const referralData = userProfile.referral || {
    signupCount: 3, // Mock data: 3 signups so far
    proEligible: false,
    businessEligible: false,
    referralCode: generateReferralCode(userProfile.userId || 'USER123')
  };
  
  // Update referral code display
  if (userReferralCode) {
    userReferralCode.textContent = referralData.referralCode;
  }
  
  // Update progress bars
  const proProgressBar = document.querySelector('.pro-progress');
  const businessProgressBar = document.querySelector('.business-progress');
  const proProgressLabel = document.querySelector('.referral-option:first-child .progress-label');
  const businessProgressLabel = document.querySelector('.referral-option:last-child .progress-label');
  
  // Pro progress (10 signups needed)
  const proProgress = Math.min((referralData.signupCount / 10) * 100, 100);
  if (proProgressBar) {
    proProgressBar.style.width = `${proProgress}%`;
  }
  if (proProgressLabel) {
    proProgressLabel.textContent = `${referralData.signupCount} / 10 signups`;
  }
  
  // Business progress (20 signups needed)
  const businessProgress = Math.min((referralData.signupCount / 20) * 100, 100);
  if (businessProgressBar) {
    businessProgressBar.style.width = `${businessProgress}%`;
  }
  if (businessProgressLabel) {
    businessProgressLabel.textContent = `${referralData.signupCount} / 20 signups`;
  }
}

// Copy referral code to clipboard
if (copyCodeBtn) {
  copyCodeBtn.addEventListener('click', async function() {
    const codeText = userReferralCode ? userReferralCode.textContent : '';
    
    try {
      await navigator.clipboard.writeText(codeText);
      copyCodeBtn.textContent = '✅';
      setTimeout(() => {
        copyCodeBtn.textContent = '📋';
      }, 2000);
      console.log('Referral code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy referral code:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = codeText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      copyCodeBtn.textContent = '✅';
      setTimeout(() => {
        copyCodeBtn.textContent = '📋';
      }, 2000);
    }
  });
}

// Social sharing functionality
if (facebookShareBtn) {
  facebookShareBtn.addEventListener('click', function() {
    const referralCode = userReferralCode ? userReferralCode.textContent : '';
    const shareText = `Join me on GISUGO.com and help each other find work! Use my referral code: ${referralCode}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://gisugo.com')}&quote=${encodeURIComponent(shareText)}`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    console.log('Facebook share clicked');
  });
}

if (smsShareBtn) {
  smsShareBtn.addEventListener('click', function() {
    const referralCode = userReferralCode ? userReferralCode.textContent : '';
    const shareText = `Join me on GISUGO.com and help each other find work! Use my referral code: ${referralCode}. Visit: https://gisugo.com`;
    const smsUrl = `sms:?body=${encodeURIComponent(shareText)}`;
    
    window.location.href = smsUrl;
    console.log('SMS share clicked');
  });
}

if (linkShareBtn) {
  linkShareBtn.addEventListener('click', async function() {
    const referralCode = userReferralCode ? userReferralCode.textContent : '';
    const shareLink = `https://gisugo.com?ref=${encodeURIComponent(referralCode)}`;
    
    try {
      await navigator.clipboard.writeText(shareLink);
      linkShareBtn.innerHTML = '<span class="share-icon">✅</span><span>Copied!</span>';
      setTimeout(() => {
        linkShareBtn.innerHTML = '<span class="share-icon">🔗</span><span>Copy Link</span>';
      }, 2000);
      console.log('Referral link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  });
}

// Purchase option click handlers (PRO ID and BUSINESS ID)
document.addEventListener('click', function(e) {
  const purchaseOption = e.target.closest('[data-purchase]');
  if (purchaseOption) {
    const purchaseType = purchaseOption.getAttribute('data-purchase');
    console.log(`${purchaseType.toUpperCase()} ID option clicked`);
    
    // Close explanation overlay
    closeExplanationOverlay();
    
    // Open G-Coins overlay and pre-select the appropriate package
    setTimeout(() => {
      if (gCoinsTopUpBtn) {
        gCoinsTopUpBtn.click();
        
        // Pre-select the appropriate package after overlay opens
        setTimeout(() => {
          const targetPackage = purchaseType === 'pro' ? 
            document.querySelector('[data-amount="250"]') : 
            document.querySelector('[data-amount="500"]');
          
          if (targetPackage) {
            // Remove any existing selection
            document.querySelectorAll('.gcoins-package').forEach(pkg => {
              pkg.classList.remove('selected');
            });
            
            // Select the target package
            targetPackage.classList.add('selected');
            selectedPackage = {
              amount: parseInt(targetPackage.getAttribute('data-amount')),
              coins: parseInt(targetPackage.getAttribute('data-coins')),
              verification: targetPackage.getAttribute('data-verification')
            };
            
            console.log(`Pre-selected ${purchaseType} package:`, selectedPackage);
          }
        }, 300);
      }
    }, 200);
  }
});

// ID File upload functionality
if (uploadAreaId && idFileInput) {
  uploadAreaId.addEventListener('click', function() {
    idFileInput.click();
  });
  
  idFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('ID file size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file for your ID');
        return;
      }
      
      selectedIdFile = file;
      
      // Update upload area to show selected file
      uploadAreaId.innerHTML = `
        <div class="upload-icon">✅</div>
        <div class="upload-text">
          <div class="upload-primary">ID Selected: ${file.name}</div>
          <div class="upload-secondary">Click to change file</div>
        </div>
      `;
      
      updateVerificationSubmitButton();
      console.log('🆔 ID file selected:', file.name);
    }
  });
}

// Selfie File upload functionality
if (uploadAreaSelfie && selfieFileInput) {
  uploadAreaSelfie.addEventListener('click', function() {
    selfieFileInput.click();
  });
  
  selfieFileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Selfie file size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file for your selfie');
        return;
      }
      
      selectedSelfieFile = file;
      
      // Update upload area to show selected file
      uploadAreaSelfie.innerHTML = `
        <div class="upload-icon">✅</div>
        <div class="upload-text">
          <div class="upload-primary">Selfie Selected: ${file.name}</div>
          <div class="upload-secondary">Click to change file</div>
        </div>
      `;
      
      updateVerificationSubmitButton();
      console.log('🤳 Selfie file selected:', file.name);
    }
  });
}

// Update submit button based on file selection
function updateVerificationSubmitButton() {
  if (verificationSubmitIdBtn) {
    if (selectedIdFile && selectedSelfieFile) {
      verificationSubmitIdBtn.disabled = false;
      verificationSubmitIdBtn.textContent = 'Submit for Review';
    } else if (selectedIdFile && !selectedSelfieFile) {
      verificationSubmitIdBtn.disabled = true;
      verificationSubmitIdBtn.textContent = 'Upload Selfie to Continue';
    } else if (!selectedIdFile && selectedSelfieFile) {
      verificationSubmitIdBtn.disabled = true;
      verificationSubmitIdBtn.textContent = 'Upload ID to Continue';
    } else {
      verificationSubmitIdBtn.disabled = true;
      verificationSubmitIdBtn.textContent = 'Upload Both Files to Continue';
    }
  }
}

// Handle ID submission
if (verificationSubmitIdBtn) {
  verificationSubmitIdBtn.addEventListener('click', function() {
    if (selectedIdFile && selectedSelfieFile) {
      handleIdSubmission(selectedIdFile, selectedSelfieFile);
    }
  });
}

// Handle ID submission (mock implementation with Firebase prep)
function handleIdSubmission(idFile, selfieFile) {
  console.log('🆔 Processing ID submission:');
  console.log('- ID file:', idFile.name);
  console.log('- Selfie file:', selfieFile.name);
  
  // TODO: FIREBASE INTEGRATION POINTS
  // 1. Upload file to Firebase Storage
  // 2. Create verification request document in Firestore
  // 3. Send notification to admin panel
  // 4. Update user verification status to 'pending'
  
  // Show loading state
  if (verificationSubmitIdBtn) {
    verificationSubmitIdBtn.disabled = true;
    verificationSubmitIdBtn.textContent = 'Uploading...';
  }
  
  // Simulate upload process
  setTimeout(() => {
    // Mock successful submission
    console.log('🆔 ID submission successful');
    
    // In production, this would call Firebase functions
    // await submitIdForVerification(getCurrentUserId(), file);
    
    // Show success message
    alert('🎉 Your ID and selfie have been submitted for verification! You\'ll receive an email confirmation within 24-48 hours.');
    
    // Close overlay
    closeVerificationOverlay();
    
    // Reset button
    if (verificationSubmitIdBtn) {
      verificationSubmitIdBtn.disabled = false;
      verificationSubmitIdBtn.textContent = 'Submit for Review';
    }
  }, 3000); // 3 second delay to simulate upload
}

// Mobile Menu Overlay functionality
const profileMenuBtn = document.querySelector('.profile-menu-btn');
const profileMenuOverlay = document.getElementById('profileMenuOverlay');

if (profileMenuBtn && profileMenuOverlay) {
  profileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    profileMenuOverlay.classList.add('show');
  });

  profileMenuOverlay.addEventListener('click', function(e) {
    if (e.target === profileMenuOverlay) {
      profileMenuOverlay.classList.remove('show');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      profileMenuOverlay.classList.remove('show');
    }
  });
}

// Profile Tab functionality
const profileTabs = document.querySelectorAll('.tab-btn');
const tabContentWrappers = document.querySelectorAll('.tab-content-wrapper');

// Add click listeners to all tab buttons
profileTabs.forEach(tab => {
  tab.addEventListener('click', function(e) {
      e.preventDefault();
    const targetTab = this.getAttribute('data-tab');
      
    // Remove active class from all tabs and content
    profileTabs.forEach(t => t.classList.remove('active'));
    tabContentWrappers.forEach(content => content.classList.remove('active'));
      
    // Add active class to clicked tab
    this.classList.add('active');
      
    // Show corresponding content
    const targetContent = document.getElementById(`${targetTab}-content`);
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Handle the tab change with specific logic
    handleProfileTabChange(targetTab);
  });
});

// Handle profile tab changes
function handleProfileTabChange(tabValue) {
  console.log('Profile tab changed to:', tabValue);
  
  // Load content based on selected tab
  switch(tabValue) {
    case 'user-info':
      console.log('Loading user information...');
      // User info is already populated on page load
      break;
    case 'reviews-customer':
      populateCustomerReviews();
      console.log('Loading customer reviews...');
      break;
    case 'reviews-worker':
      populateWorkerReviews();
      console.log('Loading worker reviews...');
      break;
    default:
      console.log('Unknown tab selected');
  }
}

// Track if user just completed an eligible purchase (for Submit ID visibility)
let justCompletedEligiblePurchase = false;

// Sample user profile data (in the future this will come from Firebase)
// These field names match the create account form structure for backend integration
const sampleUserProfile = {
  // Basic Profile Information (from create account form)
  fullName: "Peter J. Ang",
      profilePhoto: "public/users/Peter-J-Ang-User-01.jpg",
  dateOfBirth: "1988-04-15", // Will calculate age from this
  educationLevel: "College", // Options: "No-High-School", "High School", "College", "Masters", "Doctorate"
  userSummary: "Hello! I'm Peter, a reliable and hardworking individual with over 3 years of experience in various service jobs. I take great pride in delivering quality work and building lasting relationships with my clients. Whether it's cleaning, maintenance, or assistance tasks, you can count on me to get the job done right and on time. I'm punctual, detail-oriented, and always ready to go the extra mile to ensure customer satisfaction.",
  
  // System Generated Fields (from Firebase)
  userId: "peter-j-ang-001",
  accountCreated: "2025-04-12T10:30:00Z", // ISO format for Firebase
  rating: 4.7,
  reviewCount: 28,
  
  // Social Media (optional from create account form)
  socialMedia: {
    facebook: "public/icons/FB.png",
    instagram: "public/icons/IG.png", 
    linkedin: "public/icons/IN.png"
  },
  
  // Verification Status (from backend verification system)
  verification: {
    businessVerified: true, // DEMO: Set to true for Business Verified badge
    proVerified: false, // DEMO: Set to false (businessVerified takes priority)
    verificationDate: "2025-04-20T14:30:00Z", // When verification was completed
    idSubmitted: false, // Whether user has uploaded ID documents (for mock: false = can still submit)
    eligibleForSubmission: false // Whether user purchased P250/P500 but hasn't submitted ID yet
  },
  
  // G-Coins Wallet System (from backend wallet service)
  wallet: {
    gCoinsBalance: 15, // Current G-Coins balance (realistic for new pricing)
    lastTopUp: "2025-09-10T16:45:00Z", // Last top-up timestamp
    totalSpent: 35, // Total G-Coins spent (lifetime)
    totalPurchased: 50 // Total G-Coins purchased (lifetime)
  },
  
  // Referral System (from backend referral tracking service)
  referral: {
    referralCode: "GISUGO-PETER001-REFER", // Auto-generated unique referral code
    signupCount: 3, // Current number of successful signups from referrals
    proEligible: false, // Will be true when signupCount >= 10
    businessEligible: false, // Will be true when signupCount >= 20
    totalEarned: 0, // Total PHP value earned from referrals (only at milestones)
    gCoinsEarned: 0, // Total G-Coins earned from referrals (25 at 10 signups, 50 at 20 signups)
    lastReferralDate: "2025-09-15T12:20:00Z", // Most recent successful referral
    referralHistory: [
      { date: "2025-09-15T12:20:00Z", userId: "ref-user-003", verified: true },
      { date: "2025-09-10T08:15:00Z", userId: "ref-user-002", verified: true },
      { date: "2025-09-05T16:30:00Z", userId: "ref-user-001", verified: true }
    ]
  }
};

// ===== CLEAN SINGLE-PROFILE SYSTEM =====
// All verification states controlled by DEMO_CONFIG above
// Single profile with dynamic verification - no duplicate objects

// ===== HELPER FUNCTIONS =====

/**
 * Update social media icons to be clickable links
 * Icons ALWAYS stay as the default icons - URLs are used for href only
 */
function updateSocialLinks(userProfile) {
  const socialIconContainers = document.querySelectorAll('.social-icon');
  if (socialIconContainers.length < 3) return;
  
  // Get URLs from socialUrls (preferred) or socialMedia (if they're valid URLs)
  const socialUrls = userProfile.socialUrls || {};
  const socialMedia = userProfile.socialMedia || {};
  
  // Helper to check if value is a valid URL (not an icon path)
  const isValidUrl = (val) => val && val.startsWith('http') && !val.includes('/icons/');
  
  const platforms = [
    { 
      container: socialIconContainers[0], 
      url: socialUrls.facebook || (isValidUrl(socialMedia.facebook) ? socialMedia.facebook : null),
      icon: 'public/icons/FB.png',
      alt: 'Facebook'
    },
    { 
      container: socialIconContainers[1], 
      url: socialUrls.instagram || (isValidUrl(socialMedia.instagram) ? socialMedia.instagram : null),
      icon: 'public/icons/IG.png',
      alt: 'Instagram'
    },
    { 
      container: socialIconContainers[2], 
      url: socialUrls.linkedin || (isValidUrl(socialMedia.linkedin) ? socialMedia.linkedin : null),
      icon: 'public/icons/IN.png',
      alt: 'LinkedIn'
    }
  ];
  
  platforms.forEach(platform => {
    const container = platform.container;
    const img = container.querySelector('img');
    
    // Always reset icon to default
    if (img) {
      img.src = platform.icon;
      img.alt = platform.alt;
    }
    
    // Remove any existing link wrapper
    const existingLink = container.querySelector('a');
    if (existingLink) {
      // Unwrap: move img out of link
      container.insertBefore(img, existingLink);
      existingLink.remove();
    }
    
    // If URL exists, wrap icon in a link
    if (platform.url) {
      const link = document.createElement('a');
      link.href = platform.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = `Visit ${platform.alt} profile`;
      link.appendChild(img);
      container.appendChild(link);
      container.classList.add('has-link');
    } else {
      container.classList.remove('has-link');
    }
  });
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to format account creation date for display
function formatRegistrationDate(accountCreated) {
  const date = new Date(accountCreated);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Load user profile data (backend ready)
function loadUserProfile(userProfile = sampleUserProfile) { // Main profile with dynamic verification states
  // Apply demo configuration to override verification state
  if (userProfile.verification) {
    userProfile.verification.businessVerified = DEMO_CONFIG.businessVerified;
    userProfile.verification.proVerified = DEMO_CONFIG.proVerified;
    // newMember is just the absence of both business and pro verification
  }
  
  // Store reference for G-Coins purchase system
  window.currentUserProfile = userProfile;
  // Update user name (updated field name)
  const nameElement = document.querySelector('.full-name');
  if (nameElement && userProfile.fullName) {
    nameElement.textContent = userProfile.fullName;
  }
  
  // Update user photo (updated field name - check both profilePhoto and profileImage)
  const photoElement = document.getElementById('profilePhoto');
  if (photoElement && (userProfile.profilePhoto || userProfile.profileImage)) {
    // Reset loaded state before changing src (for fade-in effect)
    photoElement.classList.remove('loaded');
    photoElement.src = userProfile.profilePhoto || userProfile.profileImage;
    photoElement.alt = userProfile.fullName || 'User Profile';
  }
  
  // Update star rating and review count
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  // Get rating value from Firebase fields (averageRating) or fallback to old format
  const ratingValue = userProfile.averageRating !== undefined 
    ? userProfile.averageRating 
    : (typeof userProfile.rating === 'number' ? userProfile.rating : userProfile.rating?.average);
  
  // Get review count from Firebase fields (totalReviews) or fallback to old format
  const reviewCount = userProfile.totalReviews !== undefined
    ? userProfile.totalReviews
    : (userProfile.reviewCount || userProfile.rating?.totalReviews || 0);
  
  if (starsContainer && ratingValue !== undefined) {
    starsContainer.setAttribute('data-rating', ratingValue);
    renderStars(starsContainer, ratingValue);
    starsContainer.setAttribute('data-count', reviewCount);
    console.log(`⭐ Profile rating updated: ${ratingValue} stars with ${reviewCount} reviews`);
  }
  
  if (reviewsCountElement) {
    reviewsCountElement.textContent = reviewCount;
  }
  
  // Update social media links (make icons clickable if URLs provided)
  updateSocialLinks(userProfile);
  
  // Update badge visibility based on verification status
  updateBadgeVisibility(userProfile);
  
  // Update age if date of birth is provided
  const ageElement = document.getElementById('userAge');
  if (ageElement && userProfile.dateOfBirth) {
    ageElement.textContent = calculateAge(userProfile.dateOfBirth);
  }
  
  // Update registered since (from accountCreated timestamp)
  const registeredSinceElement = document.getElementById('registeredSince');
  if (registeredSinceElement && userProfile.accountCreated) {
    registeredSinceElement.textContent = formatRegistrationDate(userProfile.accountCreated);
  }

  // Update education level
  const educationLevelElement = document.getElementById('educationLevel');
  if (educationLevelElement && userProfile.educationLevel) {
    educationLevelElement.textContent = userProfile.educationLevel;
  }
  
  // Update user summary (About Me)
  const userSummaryElement = document.getElementById('userSummary');
  if (userSummaryElement && userProfile.userSummary) {
    userSummaryElement.textContent = userProfile.userSummary;
  }

  // Display activity statistics
  displayActivityStatistics(userProfile);

  // Load reviews for this user profile (TODO: implement when reviews system is ready)
  // loadUserReviews();
  
  console.log('Profile loaded successfully with verification state:', {
    business: userProfile.verification?.businessVerified,
    pro: userProfile.verification?.proVerified,
    education: userProfile.educationLevel,
    summary: userProfile.userSummary ? 'loaded' : 'missing'
  });
}

// ===== DEMO TESTING =====
// To test different verification states, change DEMO_CONFIG at top of file

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔥 Profile page loaded with Firebase integration');
  
  // Wait for Firebase auth to be ready before loading profile
  await waitForAuthAndLoadProfile();
  
  // Initialize star rating system
  initializeStarRating();
  
  // Initialize edit profile overlay
  initializeEditProfileOverlay();
  
  console.log('Profile page initialization complete');
});

/**
 * Wait for auth and load profile using CLEAN DATA SEPARATION pattern
 * - Firebase mode: ONLY loads from Firebase, redirects if not authenticated
 * - Mock mode: ONLY loads from mock data, no Firebase calls
 */
async function waitForAuthAndLoadProfile() {
  // Show loading state
  showProfileLoadingState();
  
  // Check which mode we're in using DataService
  const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
  
  console.log(`📊 Profile loading in ${useFirebase ? 'FIREBASE' : 'MOCK'} mode`);
  
  if (useFirebase) {
    // ══════════════════════════════════════════════════════════════
    // FIREBASE MODE - Load ONLY from Firebase
    // ══════════════════════════════════════════════════════════════
    console.log('🔥 FIREBASE MODE: Loading profile from Firestore...');
    
    try {
      // Wait for auth state
      const user = await DataService.waitForAuth();
      
      if (!user) {
        // Not authenticated - redirect to login
        console.log('⚠️ Not authenticated in Firebase mode, redirecting to login...');
        hideProfileLoadingState();
        window.location.href = 'login.html?redirect=profile.html';
        return;
      }
      
      console.log('🔥 User authenticated:', user.uid);
      
      // ══════════════════════════════════════════════════════════════
      // INITIAL PROVIDER STATE LOGGING
      // ══════════════════════════════════════════════════════════════
      console.log('═══════════════════════════════════════════════════════');
      console.log('🔐 INITIAL PROVIDER STATE ON PAGE LOAD');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📌 User UID:', user.uid);
      console.log('📌 User Email:', user.email);
      console.log('📌 User Phone:', user.phoneNumber);
      console.log('📌 Email Verified:', user.emailVerified);
      console.log('📌 Provider Count:', user.providerData.length);
      user.providerData.forEach((provider, index) => {
        console.log(`   Provider ${index + 1}:`, {
          providerId: provider.providerId,
          uid: provider.uid,
          email: provider.email,
          phoneNumber: provider.phoneNumber,
          displayName: provider.displayName
        });
      });
      console.log('═══════════════════════════════════════════════════════');
      
      // Determine which user profile to load
      const profileUserId = getProfileUserId(); // Will check URL param or fall back to current user
      const isViewingOwnProfile = (profileUserId === user.uid);
      
      console.log('👤 Profile to load:', profileUserId);
      console.log('🔍 Viewing own profile:', isViewingOwnProfile);
      
      // Load profile from Firestore
      if (typeof getUserProfile === 'function') {
        const firebaseProfile = await getUserProfile(profileUserId);
        
        if (firebaseProfile) {
          console.log('✅ Profile loaded from Firebase:', firebaseProfile.fullName);
          window.currentUserProfile = firebaseProfile;
          hideProfileLoadingState();
          loadUserProfile(firebaseProfile);
        } else {
          // Profile not found
          if (isViewingOwnProfile) {
          // User is authenticated but has no profile - redirect to sign-up
          console.log('⚠️ No profile found, redirecting to complete sign-up...');
          hideProfileLoadingState();
          window.location.href = 'sign-up.html?complete=true';
          return;
          } else {
            // Viewing someone else's profile that doesn't exist
            console.error('❌ Profile not found for user:', profileUserId);
            hideProfileLoadingState();
            showProfileError('User profile not found.');
            return;
          }
        }
      } else {
        throw new Error('getUserProfile function not available');
      }
      
    } catch (error) {
      console.error('❌ Error loading Firebase profile:', error);
      hideProfileLoadingState();
      // Show error message instead of falling back to mock
      showProfileError('Failed to load profile. Please try again.');
    }
    
  } else {
    // ══════════════════════════════════════════════════════════════
    // MOCK MODE - Load ONLY from mock data
    // ══════════════════════════════════════════════════════════════
    console.log('🧪 MOCK MODE: Loading sample profile data...');
    
    // Small delay to simulate network request (optional, for testing)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    window.currentUserProfile = sampleUserProfile;
    hideProfileLoadingState();
    loadUserProfile(sampleUserProfile);
  }
}

/**
 * Show profile loading error (Firebase mode only)
 */
function showProfileError(message) {
  const profileContainer = document.querySelector('.profile-container');
  if (profileContainer) {
    profileContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; 
                  min-height: 50vh; text-align: center; padding: 40px;">
        <div style="font-size: 60px; margin-bottom: 20px;">😔</div>
        <h2 style="color: #ef4444; margin-bottom: 16px;">Unable to Load Profile</h2>
        <p style="color: #9ca3af; margin-bottom: 24px;">${message}</p>
        <button onclick="location.reload()" 
                style="background: #10b981; color: white; padding: 12px 24px; 
                       border-radius: 8px; border: none; cursor: pointer; font-size: 16px;">
          Try Again
        </button>
      </div>
    `;
    profileContainer.style.visibility = 'visible';
    profileContainer.style.opacity = '1';
  }
}

/**
 * Show loading state while profile is being fetched - CLEAN SLATE
 */
function showProfileLoadingState() {
  // Completely hide all profile content
  const profileContainer = document.querySelector('.profile-container');
  if (profileContainer) {
    profileContainer.style.visibility = 'hidden';
    profileContainer.style.opacity = '0';
  }
  
  // Hide any other profile sections that might be outside container
  const profileSections = document.querySelectorAll('.profile-header, .profile-content, .profile-stats');
  profileSections.forEach(section => {
    section.style.visibility = 'hidden';
    section.style.opacity = '0';
  });
  
  // Create full-screen loading overlay with fun animated emojis
  let loadingIndicator = document.getElementById('profileLoadingIndicator');
  if (!loadingIndicator) {
    loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'profileLoadingIndicator';
    loadingIndicator.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                  background: linear-gradient(180deg, #0f1419 0%, #1a202c 30%, #242936 50%, #1a202c 70%, #0f1419 100%);
                  z-index: 9999; display: flex; align-items: center; justify-content: center;
                  flex-direction: column;">
        
        <!-- Fun Animated Emoji Parade -->
        <div style="font-size: 48px; margin-bottom: 24px; display: flex; gap: 20px;">
          <span style="animation: wave 1.5s ease-in-out infinite; animation-delay: 0s; display: inline-block;">👋</span>
          <span style="animation: pulse 1.2s ease-in-out infinite; animation-delay: 0.2s; display: inline-block;">🎯</span>
          <span style="animation: wave 1.5s ease-in-out infinite; animation-delay: 0.4s; display: inline-block;">⭐</span>
          <span style="animation: pulse 1.2s ease-in-out infinite; animation-delay: 0.6s; display: inline-block;">🔥</span>
        </div>
        
        <!-- Glowing Spinner -->
        <div style="position: relative; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; border: 4px solid rgba(16, 185, 129, 0.15); 
                      border-top-color: #10b981; border-radius: 50%; 
                      animation: spin 0.8s linear infinite;
                      box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                      font-size: 24px; animation: heartbeat 1s ease-in-out infinite;">🚀</div>
        </div>
        
        <div style="color: #10b981; font-size: 24px; font-weight: 700; margin-bottom: 10px;
                    text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">
          Loading Your Profile
        </div>
        <div style="color: #6b7280; font-size: 15px; animation: fadeInOut 2s ease-in-out infinite;">
          Getting everything ready for you... ✨
        </div>
        
        <!-- Animated dots -->
        <div style="margin-top: 20px; display: flex; gap: 8px;">
          <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; 
                      animation: dotPulse 1.4s ease-in-out infinite; animation-delay: 0s;"></div>
          <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; 
                      animation: dotPulse 1.4s ease-in-out infinite; animation-delay: 0.2s;"></div>
          <div style="width: 10px; height: 10px; background: #10b981; border-radius: 50%; 
                      animation: dotPulse 1.4s ease-in-out infinite; animation-delay: 0.4s;"></div>
        </div>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes dotPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(loadingIndicator);
  }
}

/**
 * Hide loading state when profile is ready
 */
function hideProfileLoadingState() {
  // Show all profile content with fade-in
  const profileContainer = document.querySelector('.profile-container');
  if (profileContainer) {
    profileContainer.style.visibility = 'visible';
    profileContainer.style.opacity = '1';
    profileContainer.style.transition = 'opacity 0.3s ease';
  }
  
  // Show other profile sections
  const profileSections = document.querySelectorAll('.profile-header, .profile-content, .profile-stats');
  profileSections.forEach(section => {
    section.style.visibility = 'visible';
    section.style.opacity = '1';
    section.style.transition = 'opacity 0.3s ease';
  });
  
  // Remove loading indicator with fade
  const loadingIndicator = document.getElementById('profileLoadingIndicator');
  if (loadingIndicator) {
    loadingIndicator.style.opacity = '0';
    loadingIndicator.style.transition = 'opacity 0.3s ease';
    setTimeout(() => loadingIndicator.remove(), 300);
  }
}

// ===== VERIFICATION SYSTEM BACKEND MAPPING =====

/*
 * COMPREHENSIVE VERIFICATION OVERLAY SYSTEM:
    signupCount: 7,
    proEligible: false, // Already Pro verified
    businessEligible: false, // Not enough referrals yet (needs 20)
    totalEarned: 175, // 7 * P25 = P175
    gCoinsEarned: 35, // 7 * 5 G-coins = 35 G-coins
    lastReferralDate: "2025-09-20T09:30:00Z",
    referralHistory: [
      { date: "2025-09-20T09:30:00Z", userName: "Juan Dela Cruz", earnings: 25 },
      { date: "2025-09-18T16:45:00Z", userName: "Ana Rodriguez", earnings: 25 },
      { date: "2025-09-15T13:20:00Z", userName: "Carlos Manila", earnings: 25 },
      { date: "2025-09-12T10:15:00Z", userName: "Rosa Guerrero", earnings: 25 },
      { date: "2025-09-08T14:30:00Z", userName: "Miguel Torres", earnings: 25 },
      { date: "2025-09-05T11:45:00Z", userName: "Lisa Fernandez", earnings: 25 },
      { date: "2025-09-02T16:20:00Z", userName: "David Reyes", earnings: 25 }
    ]
  }
};

const sampleNewUserProfile_UNUSED = {
  fullName: "Maria Santos",
  profilePhoto: "public/users/Peter-J-Ang-User-01.jpg", // Using same photo for demo
  dateOfBirth: "1995-08-22",
  educationLevel: "High School",
  userSummary: "Hi there! I'm Maria, new to the platform and excited to start providing quality services. I'm reliable, hardworking, and ready to build great relationships with clients.",
  
  userId: "maria-santos-002",
  accountCreated: "2025-09-15T09:00:00Z", // Recent account
  rating: 0, // No ratings yet
  reviewCount: 0, // No reviews yet
  
  socialMedia: {
    facebook: "public/icons/FB.png",
    instagram: "public/icons/IG.png", 
    linkedin: "public/icons/IN.png"
  },
  
  // No verification status - will show "New User" badge
  verification: {
    businessVerified: false,
    proVerified: false,
    verificationDate: null
  },
  
  // G-Coins Wallet System - New user with low balance
  wallet: {
    gCoinsBalance: 1, // Very low balance for new user (realistic with new pricing)
    lastTopUp: "2025-09-16T11:20:00Z", // Recent first top-up
    totalSpent: 4, // Minimal spending
    totalPurchased: 5 // Small initial purchase (1 P100 package)
  }
};

// Helper function to calculate age from date of birth
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

// Helper function to format account creation date for display
function formatRegistrationDate(accountCreated) {
  const date = new Date(accountCreated);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Load user profile data (backend ready)
function loadUserProfile(userProfile = sampleUserProfile) { // Main profile with dynamic verification states
  // Apply demo configuration to override verification state
  if (userProfile.verification) {
    userProfile.verification.businessVerified = DEMO_CONFIG.businessVerified;
    userProfile.verification.proVerified = DEMO_CONFIG.proVerified;
    // newMember is just the absence of both business and pro verification
  }
  
  // Store reference for G-Coins purchase system
  window.currentUserProfile = userProfile;
  // Update user name (updated field name)
  const nameElement = document.querySelector('.full-name');
  if (nameElement && userProfile.fullName) {
    nameElement.textContent = userProfile.fullName;
  }
  
  // Update user photo (updated field name - check both profilePhoto and profileImage)
  const photoElement = document.getElementById('profilePhoto');
  if (photoElement && (userProfile.profilePhoto || userProfile.profileImage)) {
    // Reset loaded state before changing src (for fade-in effect)
    photoElement.classList.remove('loaded');
    photoElement.src = userProfile.profilePhoto || userProfile.profileImage;
    photoElement.alt = userProfile.fullName || 'User Profile';
  }
  
  // Update star rating and review count
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  // Get rating value from Firebase fields (averageRating) or fallback to old format
  const ratingValue = userProfile.averageRating !== undefined 
    ? userProfile.averageRating 
    : (typeof userProfile.rating === 'number' ? userProfile.rating : userProfile.rating?.average);
  
  // Get review count from Firebase fields (totalReviews) or fallback to old format
  const reviewCount = userProfile.totalReviews !== undefined
    ? userProfile.totalReviews
    : (userProfile.reviewCount || userProfile.rating?.totalReviews || 0);
  
  if (starsContainer && ratingValue !== undefined) {
    starsContainer.setAttribute('data-rating', ratingValue);
    renderStars(starsContainer, ratingValue);
    starsContainer.setAttribute('data-count', reviewCount);
    console.log(`⭐ Profile rating updated: ${ratingValue} stars with ${reviewCount} reviews`);
  }
  
  if (reviewsCountElement) {
    reviewsCountElement.textContent = reviewCount;
  }
  
  // Update social media links (make icons clickable if URLs provided)
  updateSocialLinks(userProfile);
  
  // Update user information section
  populateUserInformation(userProfile);
  
  // Update badge and account button visibility
  updateBadgeVisibility(userProfile);
  
  console.log(`Profile loaded for: ${userProfile.fullName}`);
}

// Populate user information section (backend ready)
function populateUserInformation(userProfile) {
  // Update registered since (from accountCreated timestamp)
  const registeredSinceElement = document.getElementById('registeredSince');
  if (registeredSinceElement && userProfile.accountCreated) {
    registeredSinceElement.textContent = formatRegistrationDate(userProfile.accountCreated);
  }
  
  // Update age (calculated from dateOfBirth)
  const userAgeElement = document.getElementById('userAge');
  if (userAgeElement && userProfile.dateOfBirth) {
    const age = calculateAge(userProfile.dateOfBirth);
    userAgeElement.textContent = `${age} years old`;
  }
  
  // Update education level (same field name)
  const educationLevelElement = document.getElementById('educationLevel');
  if (educationLevelElement && userProfile.educationLevel) {
    educationLevelElement.textContent = userProfile.educationLevel;
  }
  
  // Update user summary (updated field name)
  const userSummaryElement = document.getElementById('userSummary');
  if (userSummaryElement && userProfile.userSummary) {
    userSummaryElement.textContent = userProfile.userSummary;
  }
  
  // Display activity statistics
  displayActivityStatistics(userProfile);
}

// ===== VERIFICATION SYSTEM BACKEND MAPPING =====

/*
 * COMPREHENSIVE VERIFICATION OVERLAY SYSTEM:
 * 
 * 1. VERIFICATION STATES:
 *    - businessVerified: true  → Shows "BUSINESS VERIFIED" badge → Opens Business Prestige Overlay
 *    - proVerified: true       → Shows "PRO VERIFIED" badge → Opens Pro Prestige Overlay (TO BE CREATED)
 *    - Neither verified        → Shows "NOT VERIFIED YET" badge → Opens Not Verified Overlay
 * 
 * 2. BADGE VISIBILITY LOGIC (updateBadgeVisibility function):
 *    if (userProfile.verification.businessVerified) {
 *      Show: businessVerifiedBadge + cursor pointer + click → Business Prestige Overlay
 *    } else if (userProfile.verification.proVerified) {
 *      Show: proVerifiedBadge + cursor pointer + click → Pro Prestige Overlay (TODO)
 *    } else {
 *      Show: newUserBadge ("NOT VERIFIED YET") + cursor pointer + click → Not Verified Overlay
 *    }
 * 
 * 3. FIREBASE DATA STRUCTURE:
 *    /users/{userId}/verification: {
 *      businessVerified: boolean,
 *      proVerified: boolean,
 *      verificationDate: timestamp,
 *      verificationLevel: string ('none', 'pro', 'business'),
 *      idSubmitted: boolean,
 *      eligibleForSubmission: boolean
 *    }
 * 
 * 4. SECURITY RULES:
 *    - Only verified admins can update verification status
 *    - Users can read their own verification status
 *    - Public profiles show verification badges publicly
 * 
 * 5. CLOUD FUNCTIONS NEEDED:
 *    - processVerificationRequest(userId, documents)
 *    - updateVerificationStatus(userId, level, approved)
 *    - notifyVerificationComplete(userId, level)
 * 
 * 6. TODO - PRO VERIFIED OVERLAY:
 *    Create proPrestigeOverlay similar to businessPrestigeOverlay but with:
 *    - Green/blue color theme instead of gold
 *    - "PRO VERIFIED" title with ⭐ icon
 *    - "Trusted Community Member" subtitle
 *    - Different feature list (ID verified, priority listing, etc.)
 *    - Same safety disclaimer structure
 */

// ===== FIREBASE BACKEND INTEGRATION DOCUMENTATION =====
/*
 * FIREBASE INTEGRATION CHECKLIST FOR PRODUCTION:
 * 
 * 1. USER AUTHENTICATION
 *    - Replace isUserLoggedIn() mock logic with firebase.auth().onAuthStateChanged()
 *    - Update getCurrentUserId() to use firebase.auth().currentUser.uid
 *    - Add proper error handling for authentication failures
 *    
 *    ACCOUNT SETTINGS ACCESS CONTROL:
 *    - openAccountSettingsIfOwner() guards ALL entry points to Account Settings
 *    - Account button visibility controlled by updateBadgeVisibility()
 *    - Profile photo clickability also controlled by updateBadgeVisibility()
 *    - isOwnProfile() must compare firebase.auth().currentUser.uid with profile's userId
 *    - getProfileUserId() should extract userId from URL params (e.g., /profile?userId=xxx)
 * 
 * 2. FIRESTORE DATA STRUCTURE
 *    Required Collections:
 *    
 *    /users/{userId}
 *      - fullName: string
 *      - profilePhoto: string (URL)
 *      - dateOfBirth: timestamp
 *      - educationLevel: string
 *      - userSummary: string
 *      - accountCreated: timestamp
 *      - rating: number
 *      - reviewCount: number
 *      - socialMedia: {facebook: string, instagram: string, linkedin: string}
 *      - verification: {
 *          businessVerified: boolean,
 *          proVerified: boolean,
 *          verificationDate: timestamp,
 *          status: string ('none', 'pending', 'approved', 'rejected'),
 *          pendingRequestId: string,
 *          submittedAt: timestamp,
 *          idSubmitted: boolean,
 *          eligibleForSubmission: boolean
 *        }
 *      - wallet: {
 *          gCoinsBalance: number,
 *          lastTopUp: timestamp,
 *          totalSpent: number,
 *          totalPurchased: number
 *        }
 * 
 *    /transactions/{transactionId}
 *      - userId: string
 *      - amount: number (PHP)
 *      - coins: number
 *      - verification: string | null ('pro', 'business', null)
 *      - timestamp: timestamp
 *      - paymentMethod: string
 *      - status: string ('pending', 'completed', 'failed')
 * 
 * 3. PAYMENT INTEGRATION
 *    - Integrate with Philippine payment gateways (GCash, PayMaya, Credit Card)
 *    - Add webhook handlers for payment confirmation
 *    - Implement transaction logging and reconciliation
 * 
 * 
 *    /verification_requests/{requestId}
 *      - userId: string
 *      - fileUrl: string (Firebase Storage URL)
 *      - fileName: string
 *      - fileSize: number
 *      - status: string ('pending', 'approved', 'rejected')
 *      - submittedAt: timestamp
 *      - reviewedAt: timestamp
 *      - reviewedBy: string (admin userId)
 *      - rejectionReason: string
 *      - verificationType: string ('id_verification', 'business_verification')
 * 
 *    /admin_notifications/{notificationId}
 *      - type: string ('verification_request', 'payment_received', etc.)
 *      - userId: string
 *      - requestId: string
 *      - message: string
 *      - createdAt: timestamp
 *      - read: boolean
 * 
 * 4. FIREBASE STORAGE STRUCTURE
 *    /verification_ids/{userId}/{timestamp}_{filename}
 *      - Store uploaded ID documents securely
 *      - Implement proper access controls (admin-only read)
 *      - Set up automatic deletion after verification completion
 * 
 * 5. VERIFICATION SYSTEM WORKFLOW
 *    - Create admin panel for manual verification approval
 *    - Add document upload for ID verification (✅ IMPLEMENTED)
 *    - Implement automated verification workflows
 *    - Set up email notifications for status updates
 *    - Add appeal process for rejected verifications
 * 
 * 6. CLOUD FUNCTIONS REQUIRED
 *    - onVerificationSubmitted: Trigger admin notifications
 *    - processVerificationApproval: Update user verification status
 *    - sendVerificationEmails: Email confirmation and status updates
 *    - cleanupExpiredDocuments: Remove old ID files from storage
 * 
 * 7. REFERRAL SYSTEM BACKEND REQUIREMENTS
 *    
 *    /referrals/{referralId}
 *      - referralCode: string (unique, indexed for fast lookup)
 *      - referredBy: string (userId of referrer)
 *      - referredUser: string (userId of new signup)
 *      - signupDate: timestamp
 *      - verified: boolean (email/phone verification completed)
 *      - socialLoginProvider: string ('facebook', 'google', 'instagram')
 *      - rewardEarned: number (PHP value earned by referrer)
 *      - gCoinsAwarded: number (G-Coins awarded to referrer)
 *      - status: string ('pending', 'verified', 'rejected', 'expired')
 *    
 *    /referral_tracking/{userId}
 *      - totalReferrals: number
 *      - verifiedReferrals: number
 *      - totalEarned: number (PHP)
 *      - gCoinsEarned: number
 *      - proEligible: boolean (>= 10 verified referrals)
 *      - businessEligible: boolean (>= 20 verified referrals)
 *      - lastReferralDate: timestamp
 *      - referralCode: string (user's unique code)
 *      - rewardsClaimHistory: array of claim records
 *    
 *    /referral_codes/{code} (for fast code lookup)
 *      - userId: string
 *      - createdAt: timestamp
 *      - active: boolean
 *    
 * 8. REFERRAL CLOUD FUNCTIONS REQUIRED
 *    - processNewSignup: Validate referral codes, check for abuse
 *    - updateReferralProgress: Award G-Coins and verification eligibility
 *    - validateSocialLogin: Prevent fake accounts with duplicate social IDs
 *    - processReferralRewards: Calculate and distribute rewards
 *    - checkVerificationEligibility: Update user verification status
 *    - preventReferralAbuse: Rate limiting, IP checking, device fingerprinting
 *    
 * 9. REFERRAL SYSTEM VALIDATION RULES
 *    - Only one referral reward per unique social media account
 *    - Referred user must complete email/phone verification
 *    - Referred user must remain active for 30 days to qualify
 *    - Maximum 20 referrals per referrer (stops at Business level)
 *    - G-Coins awarded in batches: 25 G-Coins at 10 signups, 50 G-Coins total at 20 signups
 *    - Each signup worth ₱25, total rewards capped at ₱1,250 (₱250 Pro + ₱500 Business + ₱500 G-Coins)
 *    - Verification badges awarded automatically when thresholds met
 *    
 * 10. SECURITY RULES
 *    - Users can only read/write their own profile data
 *    - Wallet transactions require server-side verification
 *    - Verification status changes require admin approval
 *    - ID documents in Storage accessible only to admins and document owner
 *    - Verification requests readable only by user and admins
 *    - Referral data readable only by referrer and admin
 *    - Referral code creation requires authentication
 *    - Signup attribution validated server-side only
 */

// ===== PRODUCTION FIREBASE FUNCTIONS =====

// Production function to load user profile from Firebase
async function loadUserProfileFromFirebase(userId) {
  try {
    const userDoc = await firebase.firestore().collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      loadUserProfile(userData);
    } else {
      console.error('User profile not found');
      // Handle new user creation flow
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    // Handle error state
  }
}

// Production function to update G-Coins balance in Firebase
async function updateGCoinsInFirebase(userId, newBalance, transactionData) {
  try {
    const batch = firebase.firestore().batch();
    
    // Update user wallet
    const userRef = firebase.firestore().collection('users').doc(userId);
    batch.update(userRef, {
      'wallet.gCoinsBalance': newBalance,
      'wallet.lastTopUp': firebase.firestore.FieldValue.serverTimestamp(),
      'wallet.totalPurchased': firebase.firestore.FieldValue.increment(transactionData.coins)
    });
    
    // Log transaction
    const transactionRef = firebase.firestore().collection('transactions').doc();
    batch.set(transactionRef, {
      userId: userId,
      amount: transactionData.amount,
      coins: transactionData.coins,
      verification: transactionData.verification,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
    
    await batch.commit();
    console.log('G-Coins balance updated successfully');
  } catch (error) {
    console.error('Error updating G-Coins balance:', error);
    throw error;
  }
}

// Production function to update verification status in Firebase
async function updateVerificationInFirebase(userId, verificationType) {
  try {
    const updateData = {
      'verification.verificationDate': firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (verificationType === 'pro') {
      updateData['verification.proVerified'] = true;
    } else if (verificationType === 'business') {
      updateData['verification.businessVerified'] = true;
    }
    
    await firebase.firestore().collection('users').doc(userId).update(updateData);
    console.log('Verification status updated successfully');
  } catch (error) {
    console.error('Error updating verification status:', error);
    throw error;
  }
}

// Production function to submit ID for verification
async function submitIdForVerification(userId, file) {
  try {
    // 1. Upload file to Firebase Storage
    const storageRef = firebase.storage().ref();
    const idRef = storageRef.child(`verification_ids/${userId}/${Date.now()}_${file.name}`);
    
    console.log('Uploading ID file to Firebase Storage...');
    const uploadTask = await idRef.put(file);
    const downloadUrl = await uploadTask.ref.getDownloadURL();
    
    // 2. Create verification request document
    const verificationData = {
      userId: userId,
      fileUrl: downloadUrl,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending', // pending, approved, rejected
      submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      verificationType: 'id_verification' // or 'business_verification'
    };
    
    const verificationRef = await firebase.firestore()
      .collection('verification_requests')
      .add(verificationData);
    
    // 3. Update user status to indicate pending verification
    await firebase.firestore().collection('users').doc(userId).update({
      'verification.status': 'pending',
      'verification.pendingRequestId': verificationRef.id,
      'verification.submittedAt': firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 4. Send notification to admin (Cloud Function trigger)
    // This would be handled by a Firebase Cloud Function
    await firebase.firestore().collection('admin_notifications').add({
      type: 'verification_request',
      userId: userId,
      requestId: verificationRef.id,
      message: `New verification request from user ${userId}`,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    console.log('ID verification request submitted successfully');
    return verificationRef.id;
    
  } catch (error) {
    console.error('Error submitting ID for verification:', error);
    throw error;
  }
}

// Production function to check verification status
async function checkVerificationStatus(userId) {
  try {
    const userDoc = await firebase.firestore().collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return {
        status: userData.verification?.status || 'none',
        businessVerified: userData.verification?.businessVerified || false,
        proVerified: userData.verification?.proVerified || false,
        pendingRequestId: userData.verification?.pendingRequestId || null
      };
    }
    
    return { status: 'none', businessVerified: false, proVerified: false };
  } catch (error) {
    console.error('Error checking verification status:', error);
    throw error;
  }
}

// ===== CLEANUP AND MEMORY MANAGEMENT =====

// Simple cleanup function appropriate for traditional websites
function cleanupProfilePage() {
  console.log('🧹 Starting profile page cleanup...');
  
  // Clear global references (important for Firebase integration)
  window.currentUserProfile = null;
  selectedPackage = null;
  selectedIdFile = null;
  selectedSelfieFile = null;
  
  // Ensure overlays are closed and body scrolling is restored
  document.body.style.overflow = '';
  
  // Close any active overlays (using 'active' class)
  const activeOverlays = ['accountOverlay', 'gCoinsOverlay', 'purchaseSuccessOverlay', 'verificationOverlay', 'businessPrestigeOverlay', 'proPrestigeOverlay', 'notVerifiedOverlay', 'explanationOverlay'];
  activeOverlays.forEach(overlayId => {
    const overlay = document.getElementById(overlayId);
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
  });
  
  // Close edit profile overlay (uses 'show' class)
  const editProfileOverlay = document.getElementById('editProfileOverlay');
  if (editProfileOverlay && editProfileOverlay.classList.contains('show')) {
    editProfileOverlay.classList.remove('show');
  }
  
  console.log('🧹 Profile page cleanup completed');
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanupProfilePage);

// Production initialization (currently commented for development)
/*
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    loadUserProfileFromFirebase(user.uid);
  } else {
    // Redirect to login page
    window.location.href = '/login.html';
  }
});
*/

// Star Rating System
function renderStars(container, rating) {
  if (!container) return;
  
  const stars = container.querySelectorAll('.star');
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  
  stars.forEach((star, index) => {
    // Clear existing classes
    star.classList.remove('filled', 'half-filled');
    
    if (index < fullStars) {
      // Full stars
      star.classList.add('filled');
    } else if (index === fullStars && hasHalfStar) {
      // Half star
      star.classList.add('half-filled');
    }
    // Else: empty star (default state)
  });
}

function initializeStarRating() {
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer) {
    const rating = parseFloat(starsContainer.getAttribute('data-rating')) || 0;
    const count = parseInt(starsContainer.getAttribute('data-count')) || 0;
    
    // Render the stars based on rating
    renderStars(starsContainer, rating);
    
    // Update the reviews count display
    if (reviewsCountElement) {
      reviewsCountElement.textContent = count;
    }
    
    console.log(`Profile rating initialized: ${rating} stars with ${count} reviews`);
  }
}

// Update star rating (for future Firebase integration)
function updateProfileRating(newRating, newCount) {
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer) {
    // Update data attributes
    starsContainer.setAttribute('data-rating', newRating);
    starsContainer.setAttribute('data-count', newCount);
    
    // Re-render stars
    renderStars(starsContainer, newRating);
    
    // Update count display
    if (reviewsCountElement) {
      reviewsCountElement.textContent = newCount;
    }
    
    console.log(`Profile rating updated: ${newRating} stars with ${newCount} reviews`);
  }
}

// Available user thumbnails (excluding Peter's own photo)
const availableUserThumbnails = [
  "public/users/User-02.jpg",
  "public/users/User-03.jpg", 
  "public/users/User-04.jpg",
  "public/users/User-05.jpg",
  "public/users/User-06.jpg",
  "public/users/User-07.jpg",
  "public/users/User-08.jpg",
  "public/users/User-09.jpg",
  "public/users/User-10.jpg",
  "public/users/User-11.jpg"
];

// Function to get random user thumbnail
function getRandomUserThumbnail() {
  const randomIndex = Math.floor(Math.random() * availableUserThumbnails.length);
  return availableUserThumbnails[randomIndex];
}

// Review data - will be loaded from Firebase when available
// Empty arrays = "No reviews yet" message shown
const sampleCustomerReviews = [];
const sampleWorkerReviews = [];

// ═══════════════════════════════════════════════════════════════
// FIREBASE REVIEWS INTEGRATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get user ID from profile being viewed (not necessarily the logged-in user)
 * @returns {string|null} User ID of the profile being viewed
 */
function getUserIdFromProfile() {
  return getProfileUserId();
}

/**
 * Fetch reviews for a user from Firestore
 * @param {string} userId - The user ID to fetch reviews for
 * @param {string} role - 'customer' or 'worker' - the role being reviewed
 * @returns {Promise<Array>} Array of formatted review objects
 */
async function fetchUserReviews(userId, role) {
  try {
    console.log(`🔍 Fetching ${role} reviews for user:`, userId);
    
    const db = firebase.firestore();
    const reviewsRef = db.collection('reviews');
    
    // Query reviews where this user is the reviewee with the specified role
    const snapshot = await reviewsRef
      .where('revieweeUserId', '==', userId)
      .where('revieweeRole', '==', role)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`📊 Found ${snapshot.size} ${role} reviews`);
    
    if (snapshot.empty) {
      return [];
    }
    
    // Format reviews for display
    const reviews = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Fetch reviewer profile for thumbnail
      let reviewerThumbnail = 'public/users/default-user.jpg';
      try {
        const reviewerDoc = await db.collection('users').doc(data.reviewerUserId).get();
        if (reviewerDoc.exists) {
          const reviewerData = reviewerDoc.data();
          reviewerThumbnail = reviewerData.profilePhoto || reviewerData.profileImage || reviewerThumbnail;
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch reviewer thumbnail:', err);
      }
      
      // Fetch job details for title
      let jobTitle = 'Completed Gig';
      let jobPostUrl = null;
      try {
        const jobDoc = await db.collection('jobs').doc(data.jobId).get();
        if (jobDoc.exists) {
          const jobData = jobDoc.data();
          jobTitle = jobData.title || jobTitle;
          jobPostUrl = jobData.jobPageUrl || null;
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch job details:', err);
      }
      
      // Format date
      const feedbackDate = data.createdAt 
        ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : 'Recent';
      
      reviews.push({
        jobTitle: jobTitle,
        feedbackDate: feedbackDate,
        rating: data.rating || 0,
        userThumbnail: reviewerThumbnail,
        feedbackText: data.feedbackText || 'No feedback provided.',
        jobPostUrl: jobPostUrl,
        reviewId: doc.id
      });
    }
    
    console.log(`✅ Formatted ${reviews.length} ${role} reviews`);
    return reviews;
    
  } catch (error) {
    console.error(`❌ Error fetching ${role} reviews:`, error);
    return [];
  }
}

// Create a review card element
function createReviewCard(reviewData) {
  const reviewCard = document.createElement('div');
  reviewCard.className = 'review-card';
  
  // Add click functionality if jobPostUrl exists
  if (reviewData.jobPostUrl) {
    reviewCard.style.cursor = 'pointer';
    reviewCard.addEventListener('click', function() {
      window.location.href = reviewData.jobPostUrl;
    });
    
    // Add hover effect
    reviewCard.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 4px 16px rgba(0,0,0,0.16)';
    });
    
    reviewCard.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)';
    });
  }
  
  reviewCard.innerHTML = `
    <div class="review-job-title">${reviewData.jobTitle}</div>
    <div class="review-feedback-section">
      <div class="review-feedback-left">
        <div class="review-feedback-date">${reviewData.feedbackDate}</div>
        <div class="review-rating">
          ${generateStarsHTML(reviewData.rating)}
        </div>
        <div class="review-feedback-label">FEEDBACK:</div>
      </div>
      <div class="review-user-thumbnail">
        <img src="${reviewData.userThumbnail}" alt="User thumbnail">
      </div>
    </div>
    <div class="review-feedback-text">
      ${reviewData.feedbackText}
    </div>
  `;
  
  return reviewCard;
}

// Generate stars HTML for review cards
function generateStarsHTML(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let starsHTML = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHTML += '<span class="star filled">★</span>';
    } else if (i === fullStars && hasHalfStar) {
      starsHTML += '<span class="star half-filled">★</span>';
    } else {
      starsHTML += '<span class="star">★</span>';
    }
  }
  
  return starsHTML;
}

// Populate customer reviews (backend ready)
async function populateCustomerReviews(customerReviews = null, userName = null) {
  const container = document.getElementById('reviewsCustomerContainer');
  if (!container) return;
  
  // Get user name from profile or default
  const profileName = userName || document.querySelector('.full-name')?.textContent || 'this user';
  
  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; color: #bfc6d0; padding: 2rem;">
      <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
      <p>Loading reviews...</p>
    </div>
  `;
  
  // Fetch reviews from Firebase if not provided
  if (customerReviews === null) {
    const userId = getUserIdFromProfile();
    if (userId) {
      customerReviews = await fetchUserReviews(userId, 'customer');
    } else {
      customerReviews = sampleCustomerReviews;
    }
  }
  
  // Clear existing content
  container.innerHTML = '';
  
  if (customerReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #e6d6ae; padding: 2rem;">
        <h3 style="color: #e6d6ae; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">No Reviews Yet</h3>
        <p style="color: #bfc6d0; font-size: 1rem; line-height: 1.8;">All reviews of ${profileName} as a customer will be displayed here.</p>
      </div>
    `;
    return;
  }
  
  customerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
  
  console.log(`✅ Displayed ${customerReviews.length} customer reviews`);
}

// Populate worker reviews (backend ready)
async function populateWorkerReviews(workerReviews = null, userName = null) {
  const container = document.getElementById('reviewsWorkerContainer');
  if (!container) return;
  
  // Get user name from profile or default
  const profileName = userName || document.querySelector('.full-name')?.textContent || 'this user';
  
  // Show loading state
  container.innerHTML = `
    <div style="text-align: center; color: #bfc6d0; padding: 2rem;">
      <div style="font-size: 2rem; margin-bottom: 1rem;">⏳</div>
      <p>Loading reviews...</p>
    </div>
  `;
  
  // Fetch reviews from Firebase if not provided
  if (workerReviews === null) {
    const userId = getUserIdFromProfile();
    if (userId) {
      workerReviews = await fetchUserReviews(userId, 'worker');
    } else {
      workerReviews = sampleWorkerReviews;
    }
  }
  
  // Clear existing content
  container.innerHTML = '';
  
  if (workerReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #e6d6ae; padding: 2rem;">
        <h3 style="color: #e6d6ae; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">No Reviews Yet</h3>
        <p style="color: #bfc6d0; font-size: 1rem; line-height: 1.8;">All reviews of ${profileName} as a worker will be displayed here.</p>
      </div>
    `;
    return;
  }
  
  workerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
  
  console.log(`✅ Displayed ${workerReviews.length} worker reviews`);
}

// ═══════════════════════════════════════════════════════════════
// ACTIVITY STATISTICS DISPLAY
// ═══════════════════════════════════════════════════════════════

/**
 * Display user activity statistics (worker & customer)
 * @param {Object} userProfile - User profile data with statistics field
 */
function displayActivityStatistics(userProfile) {
  console.log('📊 Displaying activity statistics...', userProfile.statistics);
  
  // Get stats from profile (with fallback for users without stats field)
  const stats = userProfile.statistics || {
    worker: { totalGigsCompleted: 0, totalEarned: 0, yearlyStats: {} },
    customer: { totalGigsCompleted: 0, totalSpent: 0, yearlyStats: {} }
  };
  
  // Worker stats
  const workerGigsEl = document.getElementById('workerGigsCompleted');
  const workerEarnedEl = document.getElementById('workerTotalEarned');
  if (workerGigsEl) workerGigsEl.textContent = stats.worker.totalGigsCompleted || 0;
  if (workerEarnedEl) workerEarnedEl.textContent = `₱${(stats.worker.totalEarned || 0).toLocaleString()}`;
  
  // Customer stats
  const customerGigsEl = document.getElementById('customerGigsCompleted');
  const customerSpentEl = document.getElementById('customerTotalSpent');
  if (customerGigsEl) customerGigsEl.textContent = stats.customer.totalGigsCompleted || 0;
  if (customerSpentEl) customerSpentEl.textContent = `₱${(stats.customer.totalSpent || 0).toLocaleString()}`;
  
  // Check if there's any activity
  const hasWorkerActivity = (stats.worker.totalGigsCompleted || 0) > 0;
  const hasCustomerActivity = (stats.customer.totalGigsCompleted || 0) > 0;
  const hasAnyActivity = hasWorkerActivity || hasCustomerActivity;
  
  // Show/hide cards and no-activity message
  const workerCard = document.getElementById('workerStatsCard');
  const customerCard = document.getElementById('customerStatsCard');
  const noActivityMsg = document.getElementById('noActivityMessage');
  
  if (hasAnyActivity) {
    // Show cards with activity
    if (workerCard) workerCard.style.display = hasWorkerActivity ? 'block' : 'none';
    if (customerCard) customerCard.style.display = hasCustomerActivity ? 'block' : 'none';
    if (noActivityMsg) noActivityMsg.style.display = 'none';
    
    // Populate year dropdowns if yearly data exists
    if (hasWorkerActivity && stats.worker.yearlyStats) {
      populateYearDropdown('worker', stats.worker.yearlyStats);
    }
    if (hasCustomerActivity && stats.customer.yearlyStats) {
      populateYearDropdown('customer', stats.customer.yearlyStats);
    }
  } else {
    // No activity - show message, hide cards
    if (workerCard) workerCard.style.display = 'none';
    if (customerCard) customerCard.style.display = 'none';
    if (noActivityMsg) noActivityMsg.style.display = 'block';
  }
  
  console.log('✅ Activity statistics displayed');
}

/**
 * Populate year dropdown for worker or customer
 * @param {string} role - 'worker' or 'customer'
 * @param {Object} yearlyStats - Object with year keys (e.g., {"2025": {gigsCompleted: 5, earned: 1000}})
 */
function populateYearDropdown(role, yearlyStats) {
  const years = Object.keys(yearlyStats || {}).sort((a, b) => b - a); // Descending order
  
  if (years.length === 0) return; // No yearly data
  
  const dropdown = document.getElementById(`${role}YearDropdown`);
  const selector = document.getElementById(`${role}YearSelector`);
  
  if (!dropdown || !selector) return;
  
  // Show the selector
  selector.style.display = 'flex';
  
  // Clear existing options except "All Time"
  dropdown.innerHTML = '<option value="all">All Time</option>';
  
  // Add year options
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    dropdown.appendChild(option);
  });
  
  // Add change handler
  dropdown.addEventListener('change', function() {
    displayYearlyBreakdown(role, this.value, yearlyStats);
  });
  
  console.log(`📅 Populated ${role} year dropdown with years:`, years);
}

/**
 * Display yearly breakdown when user selects a specific year
 * @param {string} role - 'worker' or 'customer'
 * @param {string} year - Selected year or 'all'
 * @param {Object} yearlyStats - Yearly statistics object
 */
function displayYearlyBreakdown(role, year, yearlyStats) {
  const breakdownEl = document.getElementById(`${role}YearlyStats`);
  if (!breakdownEl) return;
  
  if (year === 'all') {
    breakdownEl.style.display = 'none';
    return;
  }
  
  const yearData = yearlyStats[year];
  if (!yearData) {
    breakdownEl.style.display = 'none';
    return;
  }
  
  // Show breakdown
  breakdownEl.style.display = 'block';
  
  const isWorker = role === 'worker';
  const gigsLabel = isWorker ? 'Gigs Completed' : 'Gigs Hired';
  const moneyLabel = isWorker ? 'Total Earned' : 'Total Spent';
  const gigsValue = yearData.gigsCompleted || 0;
  const moneyValue = isWorker ? (yearData.earned || 0) : (yearData.spent || 0);
  
  breakdownEl.innerHTML = `
    <div class="yearly-stat-row">
      <span class="yearly-stat-label">${gigsLabel}:</span>
      <span class="yearly-stat-value">${gigsValue}</span>
    </div>
    <div class="yearly-stat-row">
      <span class="yearly-stat-label">${moneyLabel}:</span>
      <span class="yearly-stat-value">₱${moneyValue.toLocaleString()}</span>
    </div>
  `;
  
  console.log(`📊 Displayed ${year} breakdown for ${role}:`, yearData);
}