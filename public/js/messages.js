// GISUGO Messages Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Messages page loaded');
    
    // Initialize all functionality
    initializeMenu();
    initializeTabs();
    initializeJobListings();
});

function initializeMenu() {
    const menuBtn = document.getElementById('messagesMenuBtn');
    const menuOverlay = document.getElementById('messagesMenuOverlay');
    
    if (menuBtn && menuOverlay) {
        menuBtn.addEventListener('click', function() {
            menuOverlay.classList.toggle('show');
        });
        
        // Close menu when clicking outside
        menuOverlay.addEventListener('click', function(e) {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('show');
            }
        });
    }
}

// Tab Management
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Show corresponding content
            const targetContent = document.getElementById(targetTab + '-content');
            if (targetContent) {
                targetContent.classList.add('active');
                targetContent.style.display = 'block';
            }

            // Update page title based on active tab
            updatePageTitle(targetTab);
        });
    });
}

function updatePageTitle(activeTab) {
    const titleElement = document.getElementById('messagesTitle');
    if (!titleElement) return;

    const titles = {
        'notifications': 'NOTIFICATIONS',
        'applications': 'APPLICATIONS', 
        'messages': 'MESSAGES'
    };

    titleElement.textContent = titles[activeTab] || 'MESSAGES';
}

// Job Listings Management
function initializeJobListings() {
    const jobHeaders = document.querySelectorAll('.job-header');
    
    jobHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const jobId = this.getAttribute('data-job-id');
            const jobListing = this.closest('.job-listing');
            const applicationsList = document.getElementById('applications-' + jobId);
            const expandIcon = this.querySelector('.expand-icon');
            
            if (applicationsList && expandIcon) {
                const isExpanded = jobListing.classList.contains('expanded');
                
                if (isExpanded) {
                    // Collapse
                    jobListing.classList.remove('expanded');
                    applicationsList.style.display = 'none';
                    expandIcon.textContent = '▼';
                } else {
                    // Expand
                    jobListing.classList.add('expanded');
                    applicationsList.style.display = 'block';
                    expandIcon.textContent = '▲';
                }
            }
        });
    });
} 