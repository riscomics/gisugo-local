// GISUGO Landing Page - Coming Soon JS

// Global Variables
let emailFormSubmitted = false;

// DOM Elements
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const phoneInput = document.getElementById('phoneInput');
const emailSuccessOverlay = document.getElementById('emailSuccessOverlay');

// Initialize Landing Page
document.addEventListener('DOMContentLoaded', function() {
    initializeEmailForm();
    initializeSocialTracking();
    initializeAnalytics();
    setupAnimations();
});

// Email Form Functions
function initializeEmailForm() {
    if (emailForm && emailInput) {
        emailForm.addEventListener('submit', handleEmailSubmit);
        
        // Real-time email validation
        emailInput.addEventListener('input', validateEmail);
        emailInput.addEventListener('blur', validateEmail);
        
        // Mobile keyboard handling - prevent zoom on focus
        emailInput.addEventListener('focus', function() {
            // Prevent iOS zoom
            emailInput.style.fontSize = '16px';
        });
        
        emailInput.addEventListener('blur', function() {
            // Reset font size after blur
            emailInput.style.fontSize = '';
        });

        // Phone number formatting (optional)
        phoneInput.addEventListener('input', formatPhoneNumber);
    }
}

function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    emailInput.classList.remove('valid', 'invalid');
    
    if (email.length > 0) {
        if (emailRegex.test(email)) {
            emailInput.classList.add('valid');
        } else {
            emailInput.classList.add('invalid');
        }
    }
}

function formatPhoneNumber() {
    let value = phoneInput.value.replace(/\D/g, ''); // Remove all non-digits
    
    // Basic Philippine number formatting
    if (value.length > 0) {
        if (value.startsWith('63')) {
            // +63 format
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})/, '+$1 $2 $3 $4');
        } else if (value.startsWith('09')) {
            // 09XX format
            value = value.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
        } else if (value.length <= 11) {
            // Basic formatting for other numbers
            value = value.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
        }
    }
    
    phoneInput.value = value;
}

function handleEmailSubmit(e) {
    e.preventDefault();
    
    if (emailFormSubmitted) return;
    
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!validateEmail()) {
        showToast('Please enter a valid email address', 'error');
        emailInput.focus();
        return;
    }
    
    emailFormSubmitted = true;
    
    // Show loading state
    const submitBtn = emailForm.querySelector('.email-submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="btn-text">Submitting...</span>';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Simulate success (in real app, handle API response)
        console.log('Email submitted:', email);
        
        // Track email signup
        trackEmailSignup(email, phone);
        
        // Show success overlay with confetti
        showEmailSuccess();
        
        // Reset form
        emailForm.reset();
        emailInput.classList.remove('valid', 'invalid');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        emailFormSubmitted = false;
        
    }, 1500);
}

function showEmailSuccess() {
    if (emailSuccessOverlay) {
        emailSuccessOverlay.classList.add('show');
        
        // Add confetti effect
        createConfetti();
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            hideEmailSuccess();
        }, 8000);
    }
}

function hideEmailSuccess() {
    if (emailSuccessOverlay) {
        emailSuccessOverlay.classList.remove('show');
    }
}

// Social Media Tracking
function initializeSocialTracking() {
    const socialLinks = document.querySelectorAll('.social-link, .success-social-link');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const platform = this.classList.contains('facebook') ? 'Facebook' :
                           this.classList.contains('youtube') ? 'YouTube' :
                           this.classList.contains('instagram') ? 'Instagram' :
                           this.classList.contains('tiktok') ? 'TikTok' : 'Unknown';
            
            console.log('Social media click:', platform);
            trackSocialClick(platform);
        });
    });
}

// Animation Setup
function setupAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe animated elements
    const animatedElements = document.querySelectorAll('.user-type, .timeline-item, .social-link');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Confetti Animation
function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: hidden;
        z-index: 1;
    `;
    
    // Create confetti pieces
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti-piece';
        confetti.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${getRandomColor()};
            left: ${Math.random() * 100}%;
            animation: confetti-fall ${2 + Math.random() * 2}s ease-out ${Math.random() * 2}s infinite;
            transform: rotate(${Math.random() * 360}deg);
        `;
        
        confettiContainer.appendChild(confetti);
    }
    
    emailSuccessOverlay.querySelector('.success-modal').appendChild(confettiContainer);
    
    // Remove confetti after animation
    setTimeout(() => {
        if (confettiContainer.parentNode) {
            confettiContainer.parentNode.removeChild(confettiContainer);
        }
    }, 6000);
}

function getRandomColor() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe', '#fd79a8', '#00b894'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Analytics Functions
function initializeAnalytics() {
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: 'GISUGO Landing Page',
            page_location: window.location.href
        });
    }
    
    // Facebook Pixel tracking
    if (typeof fbq !== 'undefined') {
        fbq('track', 'PageView');
    }
}

function trackEmailSignup(email, phone) {
    // Google Analytics conversion
    if (typeof gtag !== 'undefined') {
        gtag('event', 'email_signup', {
            event_category: 'engagement',
            event_label: 'landing_page',
            value: 1,
            custom_parameters: {
                email: email,
                phone: phone
            }
        });
    }
    
    // Facebook Pixel conversion
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'GISUGO Early Access',
            content_category: 'Email Signup',
            custom_parameters: {
                email: email,
                phone: phone
            }
        });
    }
    
    console.log('Email signup tracked:', email, phone);
}

function trackSocialClick(platform) {
    // Google Analytics social interaction
    if (typeof gtag !== 'undefined') {
        gtag('event', 'social_click', {
            event_category: 'social',
            event_label: platform.toLowerCase(),
            value: 1
        });
    }
    
    // Facebook Pixel custom event
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'SocialClick', {
            platform: platform
        });
    }
    
    console.log('Social click tracked:', platform);
}

// Toast Notification System
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast-notification');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    
    const icon = type === 'success' ? '✅' : '❌';
    
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Auto-hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

// Smooth scroll to sections (if needed)
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add CSS for confetti animation
const confettiStyles = `
    @keyframes confetti-fall {
        0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(500px) rotate(720deg);
            opacity: 0;
        }
    }
`;

// Inject confetti styles
const styleSheet = document.createElement('style');
styleSheet.textContent = confettiStyles;
document.head.appendChild(styleSheet);

// Global Functions for HTML onclick handlers
window.hideEmailSuccess = hideEmailSuccess;
window.scrollToSection = scrollToSection;

// Error Handling
window.addEventListener('error', function(e) {
    console.error('Landing page error:', e.error);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: e.error.message,
            fatal: false
        });
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: e.reason.message || 'Unhandled promise rejection',
            fatal: false
        });
    }
});

// Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            const metrics = {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                totalTime: perfData.loadEventEnd - perfData.fetchStart
            };
            
            console.log('Performance metrics:', metrics);
            
            if (typeof gtag !== 'undefined') {
                Object.entries(metrics).forEach(([key, value]) => {
                    gtag('event', 'timing_complete', {
                        name: key,
                        value: Math.round(value)
                    });
                });
            }
        }, 0);
    });
} 