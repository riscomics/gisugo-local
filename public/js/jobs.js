// GISUGO Jobs Page JavaScript

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeMenu();
});

function initializeMenu() {
    const menuBtn = document.getElementById('jobsMenuBtn');
    const menuOverlay = document.getElementById('jobsMenuOverlay');
    
    if (menuBtn && menuOverlay) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            menuOverlay.classList.add('show');
        });

        // Close menu when clicking outside
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('show');
            }
        });

        // Close menu with escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && menuOverlay.classList.contains('show')) {
                menuOverlay.classList.remove('show');
            }
        });
    }
} 