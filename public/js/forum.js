// GISUGO Forum - Coming Soon JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMenuOverlay();
});

// Menu Overlay Functionality
function initializeMenuOverlay() {
    const menuBtn = document.getElementById('menuBtn');
    const menuOverlay = document.getElementById('menuOverlay');
    
    if (!menuBtn || !menuOverlay) {
        console.error('Menu elements not found');
        return;
    }

    // Show menu overlay
    menuBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showMenuOverlay();
    });

    // Hide menu overlay when clicking outside
    document.addEventListener('click', function(e) {
        if (menuOverlay.classList.contains('show') && !menuOverlay.contains(e.target) && e.target !== menuBtn) {
            hideMenuOverlay();
        }
    });

    // Prevent menu overlay clicks from closing the menu
    menuOverlay.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menuOverlay.classList.contains('show')) {
            hideMenuOverlay();
        }
    });
}

function showMenuOverlay() {
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.classList.add('show');
        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    }
}

function hideMenuOverlay() {
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Coming Soon Overlay Functions
function showComingSoonMessage() {
    const overlay = document.getElementById('comingSoonOverlay');
    if (overlay) {
        overlay.classList.add('show');
        // Prevent body scroll when overlay is open
        document.body.style.overflow = 'hidden';
    }
}

function hideComingSoonMessage() {
    const overlay = document.getElementById('comingSoonOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        // Restore body scroll
        document.body.style.overflow = '';
    }
}

// Close overlay when clicking outside the modal
document.addEventListener('click', function(e) {
    const overlay = document.getElementById('comingSoonOverlay');
    const modal = overlay ? overlay.querySelector('.success-modal') : null;
    
    if (overlay && overlay.classList.contains('show') && 
        e.target === overlay && !modal.contains(e.target)) {
        hideComingSoonMessage();
    }
});

// Close overlay when pressing Escape key
document.addEventListener('keydown', function(e) {
    const overlay = document.getElementById('comingSoonOverlay');
    if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
        hideComingSoonMessage();
    }
});

// Add smooth scroll behavior for better UX
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation to external links
document.querySelectorAll('a[href]:not([href^="#"]):not([href^="javascript:"])').forEach(link => {
    link.addEventListener('click', function() {
        // Add a subtle loading indication
        this.style.opacity = '0.7';
        this.style.pointerEvents = 'none';
        
        // Reset after a short delay (in case navigation is prevented)
        setTimeout(() => {
            this.style.opacity = '';
            this.style.pointerEvents = '';
        }, 2000);
    });
});

// Feature card hover effects for touch devices
if ('ontouchstart' in window) {
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('touchstart', function() {
            this.classList.add('touch-hover');
        });
        
        card.addEventListener('touchend', function() {
            setTimeout(() => {
                this.classList.remove('touch-hover');
            }, 300);
        });
    });
}

// Intersection Observer for fade-in animations
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

// Observe elements for animations
document.addEventListener('DOMContentLoaded', function() {
    // Add initial animation styles
    const animatedElements = document.querySelectorAll('.feature-card, .timeline-item, .notification-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});

// Console welcome message
console.log(`
🚀 GISUGO Forum - Coming Soon!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We're building something amazing for our community.
Stay tuned for updates!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Visit: https://gisugo.com
`); 