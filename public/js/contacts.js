// GISUGO Contacts Page JavaScript

// ===== GLOBAL VARIABLES =====
let isSubmitting = false;
let uploadedPhoto = null;
let currentFormData = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Contacts page loaded');
    
    initializeForm();
    initializeCharacterCounters();
    initializePhotoUpload();
    setupFormValidation();
    
    // Pre-fill user data if available
    preloadUserData();
});

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
            if (value && value.length < 2) {
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
            if (value && value.length < 5) {
                isValid = false;
                errorMessage = 'Subject must be at least 5 characters';
            }
            break;
            
        case 'contactMessage':
            if (value && value.length < 10) {
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
    
    try {
        // Collect form data
        const formData = collectFormData();
        currentFormData = formData;
        
        // Upload photo if exists
        let photoUrl = null;
        if (uploadedPhoto) {
            photoUrl = await uploadPhoto(uploadedPhoto);
        }
        
        // Prepare contact data
        const contactData = {
            ...formData,
            photoUrl: photoUrl,
            timestamp: new Date(),
            status: 'pending',
            userId: getCurrentUserId(),
            referenceId: generateReferenceId()
        };
        
        console.log('📋 Contact data prepared:', contactData);
        
        // Submit to Firebase (mock for now)
        await submitContactForm(contactData);
        
        // Show success
        hideLoadingOverlay();
        showSuccessOverlay(contactData);
        
        console.log('✅ Contact form submitted successfully');
        
    } catch (error) {
        console.error('❌ Form submission error:', error);
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
        userName: formData.get('userName').trim(),
        userEmail: formData.get('userEmail').trim(),
        topic: formData.get('contactTopic'),
        subject: formData.get('contactSubject').trim(),
        message: formData.get('contactMessage').trim()
    };
}

async function uploadPhoto(file) {
    console.log('📸 Uploading photo...');
    
    // Simulate photo upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock photo URL
    const mockPhotoUrl = `https://gisugo-uploads.com/contacts/${Date.now()}_${file.name}`;
    console.log('✅ Photo uploaded:', mockPhotoUrl);
    
    return mockPhotoUrl;
}

async function submitContactForm(contactData) {
    console.log('🔥 Submitting to Firebase...');
    
    // Simulate Firebase submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock successful submission
    console.log('✅ Contact submitted to Firebase');
    
    // In real implementation, this would be:
    // const db = getFirestore();
    // await addDoc(collection(db, 'contacts'), contactData);
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
    // Mock user ID - in real implementation, get from Firebase Auth
    return 'user_12345';
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
    const topicMap = {
        'general': 'General Inquiry',
        'website-issues': 'Website Issues',
        'complaints-disputes': 'Complaints & Disputes',
        'feature-request': 'Feature Request',
        'bug-report': 'Bug Report',
        'account-issues': 'Account Issues',
        'safety-security': 'Safety & Security',
        'payment-billing': 'Payment & Billing',
        'other': 'Other'
    };
    
    return topicMap[topicValue] || topicValue;
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
    // Mock user data - in real implementation, get from Firebase Auth
    const mockUser = {
        name: 'John Doe',
        email: 'john.doe@example.com'
    };
    
    // Only pre-fill if fields are empty
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