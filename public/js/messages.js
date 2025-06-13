// GISUGO Messages Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Messages page loaded');
    
    // Initialize all functionality
    initializeMenu();
    initializeTabs();
    initializeJobListings();
    initializeApplicationActions();
    initializeConfirmationOverlay();
    checkApplicationsContent();
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
                    // Collapse current listing
                    jobListing.classList.remove('expanded');
                    applicationsList.style.display = 'none';
                    expandIcon.textContent = '▼';
                } else {
                    // First, close all other expanded listings
                    closeAllJobListings();
                    
                    // Then expand the current listing
                    jobListing.classList.add('expanded');
                    applicationsList.style.display = 'block';
                    expandIcon.textContent = '▲';
                }
            }
        });
    });
}

// Helper function to close all expanded job listings
function closeAllJobListings() {
    const allJobListings = document.querySelectorAll('.job-listing');
    
    allJobListings.forEach(listing => {
        const jobHeader = listing.querySelector('.job-header');
        const jobId = jobHeader.getAttribute('data-job-id');
        const applicationsList = document.getElementById('applications-' + jobId);
        const expandIcon = jobHeader.querySelector('.expand-icon');
        
        if (listing.classList.contains('expanded')) {
            listing.classList.remove('expanded');
            if (applicationsList) {
                applicationsList.style.display = 'none';
            }
            if (expandIcon) {
                expandIcon.textContent = '▼';
            }
        }
    });
}

// Application Action Overlay Management
function initializeApplicationActions() {
    const applicationCards = document.querySelectorAll('.application-card');
    const actionOverlay = document.getElementById('applicationActionOverlay');
    const actionProfileImage = document.getElementById('actionProfileImage');
    const actionProfileRating = document.getElementById('actionProfileRating');
    const hireJobBtn = document.getElementById('hireJobBtn');
    
    applicationCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Prevent event bubbling
            e.stopPropagation();
            
            // Get applicant data from the card
            const userName = this.querySelector('[data-user-name]').getAttribute('data-user-name');
            const userPhoto = this.querySelector('[data-user-photo]').getAttribute('data-user-photo');
            const userRating = parseInt(this.querySelector('[data-user-rating]').getAttribute('data-user-rating'));
            const applicationId = this.getAttribute('data-application-id');
            
            console.log(`Opening overlay for ${userName} with ${userRating} star rating`);
            
            // Update overlay content
            actionProfileImage.src = `public/users/${userPhoto}`;
            actionProfileImage.alt = userName;
            
            // Update star rating
            updateActionStars(userRating);
            
            // Store application data for hire button
            hireJobBtn.setAttribute('data-application-id', applicationId);
            hireJobBtn.setAttribute('data-user-name', userName);
            
            // Show overlay
            actionOverlay.classList.add('show');
            
            // Double-check stars are updated after overlay is shown
            setTimeout(() => {
                updateActionStars(userRating);
            }, 50);
        });
    });
    
    // Close overlay when clicking outside
    actionOverlay.addEventListener('click', function(e) {
        if (e.target === actionOverlay) {
            closeActionOverlay();
        }
    });
    
    // Handle profile view click
    const profileCaption = document.querySelector('.action-profile-caption');
    if (profileCaption) {
        profileCaption.addEventListener('click', function() {
            const userName = actionProfileImage.alt;
            if (userName) {
                // Convert user name to URL-friendly format
                const userId = userName.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                // Navigate to profile page
                window.location.href = `profile.html?userId=${userId}`;
            }
        });
    }
    
    // Handle hire button click
    if (hireJobBtn) {
        hireJobBtn.addEventListener('click', function() {
            const applicationId = this.getAttribute('data-application-id');
            const userName = this.getAttribute('data-user-name');
            
            // Get the application card to extract additional data
            const hireApplicationCard = document.querySelector(`[data-application-id="${applicationId}"]`);
            let jobData = {};
            
            if (hireApplicationCard) {
                // Extract job and application details
                const jobTitle = hireApplicationCard.getAttribute('data-job-title');
                const originalPrice = hireApplicationCard.getAttribute('data-original-price');
                const isCounterOffer = hireApplicationCard.getAttribute('data-is-counter-offer') === 'true';
                
                // Get price offer details
                const priceElement = hireApplicationCard.querySelector('[data-price-amount]');
                const priceAmount = priceElement ? priceElement.getAttribute('data-price-amount') : null;
                const priceType = priceElement ? priceElement.getAttribute('data-price-type') : null;
                const offerType = priceElement ? priceElement.getAttribute('data-offer-type') : null;
                
                // Get applicant details
                const userPhoto = hireApplicationCard.querySelector('[data-user-photo]');
                const userPhotoSrc = userPhoto ? userPhoto.getAttribute('data-user-photo') : null;
                const userRating = hireApplicationCard.querySelector('[data-user-rating]');
                const rating = userRating ? parseInt(userRating.getAttribute('data-user-rating')) : null;
                
                // Get application details
                const applicationDate = hireApplicationCard.querySelector('[data-application-date]');
                const applicationTime = hireApplicationCard.querySelector('[data-application-time]');
                const applicationMessage = hireApplicationCard.querySelector('[data-application-message]');
                
                jobData = {
                    jobTitle: jobTitle,
                    originalPrice: originalPrice,
                    agreedPrice: priceAmount,
                    priceType: priceType,
                    isCounterOffer: isCounterOffer,
                    offerType: offerType,
                    applicantDetails: {
                        name: userName,
                        photo: userPhotoSrc,
                        rating: rating
                    },
                    applicationDetails: {
                        date: applicationDate ? applicationDate.getAttribute('data-application-date') : null,
                        time: applicationTime ? applicationTime.getAttribute('data-application-time') : null,
                        message: applicationMessage ? applicationMessage.getAttribute('data-application-message') : null
                    }
                };
            }
            
            // Here you would send comprehensive hire data to backend
            console.log('Backend data to send:', {
                action: 'hire',
                applicationId: applicationId,
                timestamp: new Date().toISOString(),
                jobData: jobData,
                // Additional fields that would be useful for backend
                status: 'hired',
                contractDetails: {
                    jobTitle: jobData.jobTitle,
                    agreedPrice: jobData.agreedPrice,
                    priceType: jobData.priceType,
                    contractor: jobData.applicantDetails.name,
                    contractDate: new Date().toISOString()
                }
            });
            
            // Remove the entire job listing since someone was hired
            if (hireApplicationCard) {
                const jobListing = hireApplicationCard.closest('.job-listing');
                if (jobListing) {
                    // Add fade out animation to the entire job listing
                    jobListing.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    jobListing.style.opacity = '0';
                    jobListing.style.transform = 'translateY(-10px)';
                    
                    // Remove the job listing after animation
                    setTimeout(() => {
                        jobListing.remove();
                        // Check if there are any job listings left overall
                        updateApplicationsDisplay();
                    }, 300);
                }
            }
            
            closeActionOverlay();
            
            // Show confirmation overlay
            showConfirmationOverlay(
                'success',
                'Application Accepted!',
                `${userName} has been hired for the job. You can now coordinate the work details.`
            );
        });
    }
    
    // Handle reject button click
    const rejectJobBtn = document.getElementById('rejectJobBtn');
    if (rejectJobBtn) {
        rejectJobBtn.addEventListener('click', function() {
            const applicationId = hireJobBtn.getAttribute('data-application-id');
            const userName = hireJobBtn.getAttribute('data-user-name');
            
            // Here you would send rejection data to backend
            console.log('Backend data to send:', {
                action: 'reject',
                applicationId: applicationId,
                userName: userName,
                timestamp: new Date().toISOString()
            });
            
            // Remove the application card from UI (mock functionality)
            const applicationCard = document.querySelector(`[data-application-id="${applicationId}"]`);
            if (applicationCard) {
                // Add fade out animation
                applicationCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                applicationCard.style.opacity = '0';
                applicationCard.style.transform = 'translateX(-20px)';
                
                // Remove the card after animation
                setTimeout(() => {
                    applicationCard.remove();
                    
                                         // Check if this was the last application in the job listing
                     const jobListing = applicationCard.closest('.job-listing');
                     if (jobListing) {
                         const remainingApplications = jobListing.querySelectorAll('.application-card');
                         if (remainingApplications.length === 0) {
                             // Remove the entire job listing since there are no applications left
                             jobListing.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                             jobListing.style.opacity = '0';
                             jobListing.style.transform = 'translateY(-10px)';
                             
                             setTimeout(() => {
                                 jobListing.remove();
                                 // Check if there are any job listings left overall
                                 updateApplicationsDisplay();
                             }, 300);
                         } else {
                             // Update the application count
                             const countElement = jobListing.querySelector('.applications-count');
                             if (countElement) {
                                 const newCount = remainingApplications.length;
                                 countElement.textContent = `${newCount} Application${newCount !== 1 ? 's' : ''}`;
                             }
                         }
                     }
                    
                    // Check if there are any applications left overall
                    updateApplicationsDisplay();
                }, 300);
            }
            
            closeActionOverlay();
            
            // Show confirmation overlay
            showConfirmationOverlay(
                'reject',
                'Application Rejected',
                `${userName}'s application has been rejected and removed from your listings.`
            );
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && actionOverlay.classList.contains('show')) {
            closeActionOverlay();
        }
    });
}

function updateActionStars(rating) {
    const stars = document.querySelectorAll('.action-star');
    console.log(`Found ${stars.length} stars, updating to ${rating} rating`);
    
    // First, remove all filled classes to reset
    stars.forEach(star => {
        star.classList.remove('filled');
    });
    
    // Then add filled class to the appropriate number of stars
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            console.log(`Filled star ${index + 1}`);
        }
    });
    
    console.log(`Updated overlay stars to ${rating} rating`);
}

function closeActionOverlay() {
    const actionOverlay = document.getElementById('applicationActionOverlay');
    if (actionOverlay) {
        actionOverlay.classList.remove('show');
    }
}

// Check if there are any applications and show/hide placeholder accordingly
function checkApplicationsContent() {
    const applicationsContainer = document.getElementById('applicationsContainer');
    const applicationsPlaceholder = document.getElementById('applicationsPlaceholder');
    
    if (applicationsContainer && applicationsPlaceholder) {
        const jobListings = applicationsContainer.querySelectorAll('.job-listing');
        const hasApplications = jobListings.length > 0;
        
        if (hasApplications) {
            // Show job listings, hide placeholder
            applicationsContainer.style.display = 'block';
            applicationsPlaceholder.style.display = 'none';
        } else {
            // Show placeholder, hide job listings
            applicationsContainer.style.display = 'none';
            applicationsPlaceholder.style.display = 'block';
        }
    }
}

// Function to be called when applications are added/removed dynamically
function updateApplicationsDisplay() {
    checkApplicationsContent();
}

// Confirmation Overlay Functions
function showConfirmationOverlay(type, title, message) {
    const overlay = document.getElementById('confirmationOverlay');
    const icon = document.getElementById('confirmationIcon');
    const titleElement = document.getElementById('confirmationTitle');
    const messageElement = document.getElementById('confirmationMessage');
    
    if (overlay && icon && titleElement && messageElement) {
        // Set content
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Set icon and styling based on type
        if (type === 'success') {
            icon.textContent = '✓';
            icon.className = 'confirmation-icon success';
        } else if (type === 'reject') {
            icon.textContent = '✗';
            icon.className = 'confirmation-icon reject';
        }
        
        // Show overlay
        overlay.classList.add('show');
    }
}

function closeConfirmationOverlay() {
    const overlay = document.getElementById('confirmationOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

// Initialize confirmation overlay
function initializeConfirmationOverlay() {
    const overlay = document.getElementById('confirmationOverlay');
    const confirmBtn = document.getElementById('confirmationBtn');
    
    // Close overlay when clicking OK button
    if (confirmBtn) {
        confirmBtn.addEventListener('click', closeConfirmationOverlay);
    }
    
    // Close overlay when clicking outside
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeConfirmationOverlay();
            }
        });
    }
    
    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('show')) {
            closeConfirmationOverlay();
        }
    });
} 