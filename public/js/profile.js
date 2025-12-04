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
  // Open account overlay
  accountBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    accountOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
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
    accountOverlay.style.display = 'none'; // Force hide
  }
  
  // Then open the edit profile overlay after a brief delay
  setTimeout(() => {
    const overlay = document.getElementById('editProfileOverlay');
    if (overlay) {
      // Populate form with current user data
      populateEditProfileForm();
      overlay.classList.add('show');
    }
  }, 150);
}

function closeEditProfileOverlay() {
  console.log('closeEditProfileOverlay called');
  const overlay = document.getElementById('editProfileOverlay');
  if (overlay) {
    overlay.classList.remove('show');
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
    if (photoSrc) photoPreview.src = photoSrc;
  }

  // Social Media URLs (optional - separate from icon paths)
  // Check socialUrls first (actual URLs), then socialMedia but skip icon paths
  const facebookInput = document.getElementById('editFacebook');
  const instagramInput = document.getElementById('editInstagram');
  const linkedinInput = document.getElementById('editLinkedIn');

  // Helper to check if value is a valid URL (not an icon path)
  const isValidUrl = (val) => val && val.startsWith('http') && !val.includes('/icons/');

  if (facebookInput) {
    const fbUrl = profile.socialUrls?.facebook || profile.socialMedia?.facebook;
    if (isValidUrl(fbUrl)) facebookInput.value = fbUrl;
  }
  if (instagramInput) {
    const igUrl = profile.socialUrls?.instagram || profile.socialMedia?.instagram;
    if (isValidUrl(igUrl)) instagramInput.value = igUrl;
  }
  if (linkedinInput) {
    const liUrl = profile.socialUrls?.linkedin || profile.socialMedia?.linkedin;
    if (isValidUrl(liUrl)) linkedinInput.value = liUrl;
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
          if (preview) {
            preview.src = e.target.result;
          }
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

function saveProfileChanges() {
  console.log('🚀 saveProfileChanges() called!');
  
  const profile = window.currentUserProfile;
  
  // Get form values
  const firstName = document.getElementById('editFirstName')?.value?.trim() || '';
  const lastName = document.getElementById('editLastName')?.value?.trim() || '';
  const dob = document.getElementById('editDateOfBirth')?.value;
  const education = document.getElementById('editEducation')?.value;
  const aboutMe = document.getElementById('editAboutMe')?.value;
  const facebook = document.getElementById('editFacebook')?.value?.trim() || '';
  const instagram = document.getElementById('editInstagram')?.value?.trim() || '';
  const linkedin = document.getElementById('editLinkedIn')?.value?.trim() || '';

  // Combine first and last name
  const fullName = `${firstName} ${lastName}`.trim();

  // Update profile object (would send to backend in production)
  if (profile) {
    profile.fullName = fullName;
    profile.firstName = firstName;
    profile.lastName = lastName;
    profile.dateOfBirth = dob;
    profile.educationLevel = education;
    profile.userSummary = aboutMe;
    
    // Store social URLs separately (don't overwrite icon paths in socialMedia)
    if (facebook || instagram || linkedin) {
      profile.socialUrls = {
        facebook: facebook || null,
        instagram: instagram || null,
        linkedin: linkedin || null
      };
    }
  }

  // Update displayed profile info - FORCE DOM UPDATES
  console.log('🔄 Updating DOM elements...');
  
  // Update full name
  const fullNameElement = document.querySelector('.full-name');
  console.log('Full name element:', fullNameElement);
  if (fullNameElement) {
    fullNameElement.innerHTML = fullName || 'No Name';
    console.log('✅ Updated full name to:', fullName);
  } else {
    console.error('❌ Full name element not found');
  }

  // Update About Me / User Summary
  const userSummaryElement = document.getElementById('userSummary');
  console.log('User summary element:', userSummaryElement);
  if (userSummaryElement) {
    // Use innerHTML and preserve line breaks
    userSummaryElement.innerHTML = (aboutMe || '').replace(/\n/g, '<br>');
    console.log('✅ Updated user summary to:', aboutMe?.substring(0, 50));
  } else {
    console.error('❌ User summary element not found');
  }

  // Update Education Level
  const educationElement = document.getElementById('educationLevel');
  console.log('Education element:', educationElement);
  if (educationElement) {
    educationElement.innerHTML = education || 'Not specified';
    console.log('✅ Updated education to:', education);
  } else {
    console.error('❌ Education element not found');
  }

  // Update profile photo if changed
  const photoPreview = document.getElementById('editProfilePhotoPreview');
  const mainProfilePhoto = document.getElementById('profilePhoto');
  if (photoPreview && mainProfilePhoto && photoPreview.src !== mainProfilePhoto.src) {
    mainProfilePhoto.src = photoPreview.src;
    console.log('✅ Updated profile photo');
  }

  console.log('✅ Profile changes saved:', {
    fullName, dob, education, aboutMe: aboutMe?.substring(0, 50) + '...'
  });

  // Close overlay
  closeEditProfileOverlay();
  
  console.log('✅ Profile updated successfully!');
}

// Make saveProfileChanges globally accessible
window.saveProfileChanges = saveProfileChanges;

// ===== USER AUTHENTICATION & VERIFICATION LOGIC =====

// Check if user is currently logged in
function isUserLoggedIn() {
  // Check Firebase Auth first (for production)
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    return true;
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
  // In production, compare current authenticated user ID with profile user ID
  // For now, we'll assume user is viewing their own profile for development
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevelopment) {
    return true; // Mock own profile for development
  }
  
  // TEMPORARY: For live demo purposes, simulate own profile
  // TODO: Replace with real user ID comparison when authentication is implemented
  return true; // Allow Account button to show on live site for demo
  
  // Production logic would be:
  // const currentUserId = getCurrentUserId();
  // const profileUserId = getProfileUserId(); // Get from URL params or page data
  // return currentUserId === profileUserId;
  
  return false;
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
  // Check Firebase Auth first
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    return firebase.auth().currentUser.uid;
  }
  
  // Fallback to mock user for development
  return 'peter-j-ang-001';
}

// Update badge and account button visibility based on auth and verification status
function updateBadgeVisibility(userProfile) {
  const businessVerifiedBadgeGrid = document.getElementById('businessVerifiedBadgeGrid');
  const proVerifiedBadgeGrid = document.getElementById('proVerifiedBadgeGrid');
  const newUserBadgeGrid = document.getElementById('newUserBadgeGrid');
  const accountBtn = document.getElementById('accountBtn');
  
  console.log('🔍 Updating badge visibility...');
  console.log('User logged in:', isUserLoggedIn());
  console.log('Own profile:', isOwnProfile());
  console.log('Has verification:', hasVerificationStatus(userProfile));
  
  // Account button logic: Only show when user is logged in AND viewing their own profile
  if (accountBtn) {
    const shouldShowAccountBtn = isUserLoggedIn() && isOwnProfile();
    accountBtn.style.display = shouldShowAccountBtn ? 'inline-flex' : 'none';
    console.log('Account button visibility:', shouldShowAccountBtn ? 'visible' : 'hidden');
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
  const photoElement = document.querySelector('.profile-photo img');
  if (photoElement && (userProfile.profilePhoto || userProfile.profileImage)) {
    photoElement.src = userProfile.profilePhoto || userProfile.profileImage;
    photoElement.alt = userProfile.fullName || 'User Profile';
  }
  
  // Update star rating and review count
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer && (userProfile.rating !== undefined)) {
    const ratingValue = typeof userProfile.rating === 'number' ? userProfile.rating : userProfile.rating?.average;
    if (ratingValue !== undefined) {
      starsContainer.setAttribute('data-rating', ratingValue);
      renderStars(starsContainer, ratingValue);
    }
  }
  
  if (reviewsCountElement && (userProfile.reviewCount !== undefined || userProfile.rating?.totalReviews !== undefined)) {
    const reviewCount = userProfile.reviewCount || userProfile.rating?.totalReviews;
    reviewsCountElement.textContent = reviewCount;
    if (starsContainer) {
      starsContainer.setAttribute('data-count', reviewCount);
    }
  }
  
  // Update social media icons (if provided)
  if (userProfile.socialMedia) {
    const socialIcons = document.querySelectorAll('.social-icon img');
    if (socialIcons.length >= 3) {
      socialIcons[0].src = userProfile.socialMedia.facebook || 'public/icons/FB.png';
      socialIcons[1].src = userProfile.socialMedia.instagram || 'public/icons/IG.png';
      socialIcons[2].src = userProfile.socialMedia.linkedin || 'public/icons/IN.png';
    }
  }
  
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
document.addEventListener('DOMContentLoaded', function() {
  console.log('Profile page loaded');
  
  // Load user profile data
  loadUserProfile();
  
  // Initialize star rating system
  initializeStarRating();
  
  // Initialize edit profile overlay
  initializeEditProfileOverlay();
  
  console.log('Profile page initialization complete');
});

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
  const photoElement = document.querySelector('.profile-photo img');
  if (photoElement && (userProfile.profilePhoto || userProfile.profileImage)) {
    photoElement.src = userProfile.profilePhoto || userProfile.profileImage;
    photoElement.alt = userProfile.fullName || 'User Profile';
  }
  
  // Update star rating and review count
  const starsContainer = document.getElementById('profileStars');
  const reviewsCountElement = document.getElementById('reviewsCount');
  
  if (starsContainer && (userProfile.rating !== undefined)) {
    const ratingValue = typeof userProfile.rating === 'number' ? userProfile.rating : userProfile.rating?.average;
    if (ratingValue !== undefined) {
      starsContainer.setAttribute('data-rating', ratingValue);
      renderStars(starsContainer, ratingValue);
    }
  }
  
  if (reviewsCountElement && (userProfile.reviewCount !== undefined || userProfile.rating?.totalReviews !== undefined)) {
    const reviewCount = userProfile.reviewCount || userProfile.rating?.totalReviews;
    reviewsCountElement.textContent = reviewCount;
    if (starsContainer) {
      starsContainer.setAttribute('data-count', reviewCount);
    }
  }
  
  // Update social media icons (if provided)
  if (userProfile.socialMedia) {
    const socialIcons = document.querySelectorAll('.social-icon img');
    if (socialIcons.length >= 3) {
      if (userProfile.socialMedia.facebook) socialIcons[0].src = userProfile.socialMedia.facebook;
      if (userProfile.socialMedia.instagram) socialIcons[1].src = userProfile.socialMedia.instagram;
      if (userProfile.socialMedia.linkedin) socialIcons[2].src = userProfile.socialMedia.linkedin;
    }
  }
  
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
  
  // Close any active overlays
  const overlays = ['accountOverlay', 'gCoinsOverlay', 'purchaseSuccessOverlay', 'verificationOverlay', 'businessPrestigeOverlay', 'proPrestigeOverlay', 'notVerifiedOverlay', 'explanationOverlay'];
  overlays.forEach(overlayId => {
    const overlay = document.getElementById(overlayId);
    if (overlay && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
    }
  });
  
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

// Sample review data (in the future this will come from Firebase)
const sampleCustomerReviews = [
  {
    id: 1,
    jobTitle: "Home cleaning service - 3 bedroom house",
    feedbackDate: "Dec. 20, 2025",
    rating: 5,
    feedbackText: "Excellent customer! Very understanding and provided all necessary cleaning supplies. Payment was prompt.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=cleaning&jobNumber=123"
  },
  {
    id: 2,
    jobTitle: "Garden maintenance and lawn mowing",
    feedbackDate: "Dec. 17, 2025",
    rating: 4,
    feedbackText: "Customer was very clear about expectations. Nice working environment and fair pay.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=gardening&jobNumber=124"
  },
  {
    id: 3,
    jobTitle: "Pet grooming for two small dogs",
    feedbackDate: "Dec. 14, 2025",
    rating: 5,
    feedbackText: "Great customer who really cares about his pets. Provided detailed instructions and was very appreciative.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=pet-care&jobNumber=125"
  },
  {
    id: 4,
    jobTitle: "Event setup for birthday party",
    feedbackDate: "Dec. 12, 2025",
    rating: 4,
    feedbackText: "Well-organized customer with clear timeline. Good communication throughout the setup process.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=events&jobNumber=126"
  },
  {
    id: 5,
    jobTitle: "Computer repair and software installation",
    feedbackDate: "Dec. 10, 2025",
    rating: 5,
    feedbackText: "Very patient customer who listened to all explanations. Fair payment and respectful interaction.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=tech&jobNumber=127"
  },
  {
    id: 6,
    jobTitle: "Furniture assembly for new bedroom set",
    feedbackDate: "Dec. 8, 2025",
    rating: 4,
    feedbackText: "Customer provided all tools needed and was flexible with timing. Pleasant working atmosphere.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=labor&jobNumber=128"
  },
  {
    id: 7,
    jobTitle: "Car detailing and interior cleaning",
    feedbackDate: "Dec. 5, 2025",
    rating: 5,
    feedbackText: "Professional customer who trusts your expertise. Quick payment and would work for him again.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=automotive&jobNumber=129"
  },
  {
    id: 8,
    jobTitle: "Photography for family portrait session",
    feedbackDate: "Dec. 3, 2025",
    rating: 4,
    feedbackText: "Creative customer with good vision. Collaborative approach and respectful of artistic input.",
    userThumbnail: getRandomUserThumbnail(),
    jobPostUrl: "dynamic-job.html?category=creative&jobNumber=130"
  }
];

const sampleWorkerReviews = [];

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
function populateCustomerReviews(customerReviews = sampleCustomerReviews, userName = null) {
  const container = document.getElementById('reviewsCustomerContainer');
  if (!container) return;
  
  // Get user name from profile or default
  const profileName = userName || document.querySelector('.full-name')?.textContent || 'this user';
  
  // Clear existing content
  container.innerHTML = '';
  
  if (customerReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #e6d6ae; padding: 2rem;">
        <p style="color: #bfc6d0; font-size: 1rem; line-height: 1.8;">No reviews of ${profileName} as a customer yet.</p>
      </div>
    `;
    return;
  }
  
  customerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}

// Populate worker reviews (backend ready)
function populateWorkerReviews(workerReviews = sampleWorkerReviews, userName = null) {
  const container = document.getElementById('reviewsWorkerContainer');
  if (!container) return;
  
  // Get user name from profile or default
  const profileName = userName || document.querySelector('.full-name')?.textContent || 'this user';
  
  // Clear existing content
  container.innerHTML = '';
  
  if (workerReviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: #e6d6ae; padding: 2rem;">
        <h3 style="color: #e6d6ae; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">No Jobs Completed Yet.</h3>
        <p style="color: #bfc6d0; font-size: 1rem; line-height: 1.8;">All reviews of ${profileName} completing jobs will be displayed here.</p>
      </div>
    `;
    return;
  }
  
  workerReviews.forEach(review => {
    const reviewCard = createReviewCard(review);
    container.appendChild(reviewCard);
  });
}