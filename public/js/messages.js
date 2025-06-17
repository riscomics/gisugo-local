// GISUGO Messages Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('Messages page loaded');
    
    // Initialize all functionality
    initializeMenu();
    initializeTabs();
    initializeJobListings();
    initializeApplicationActions();
    initializeConfirmationOverlay();
    initializeNotifications();
    initializeMessages();
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
    const actionProfileName = document.getElementById('actionProfileName');
    const actionProfileImage = document.getElementById('actionProfileImage');
    const actionProfileRating = document.getElementById('actionProfileRating');
    const actionReviewCount = document.getElementById('actionReviewCount');
    const hireJobBtn = document.getElementById('hireJobBtn');
    
    applicationCards.forEach(card => {
        card.addEventListener('click', function(e) {
            // Prevent event bubbling
            e.stopPropagation();
            
            // Get applicant data from the card
            const userName = this.querySelector('[data-user-name]').getAttribute('data-user-name');
            const userId = this.getAttribute('data-user-id');
            const userPhoto = this.querySelector('[data-user-photo]').getAttribute('data-user-photo');
            const userRating = parseInt(this.querySelector('[data-user-rating]').getAttribute('data-user-rating'));
            const reviewCount = parseInt(this.querySelector('[data-review-count]').getAttribute('data-review-count'));
            const applicationId = this.getAttribute('data-application-id');
            
            console.log(`Opening overlay for ${userName} with ${userRating} star rating (${reviewCount} reviews)`);
            
            // Update overlay content
            actionProfileName.textContent = userName;
            actionProfileImage.src = `public/users/${userPhoto}`;
            actionProfileImage.alt = userName;
            
            // Update star rating and review count
            updateActionStars(userRating);
            actionReviewCount.textContent = `(${reviewCount})`;
            
            // Store application data for hire button
            hireJobBtn.setAttribute('data-application-id', applicationId);
            hireJobBtn.setAttribute('data-user-id', userId);
            hireJobBtn.setAttribute('data-user-name', userName);
            
            // Store application data for reject button
            const rejectJobBtn = document.getElementById('rejectJobBtn');
            if (rejectJobBtn) {
                rejectJobBtn.setAttribute('data-application-id', applicationId);
                rejectJobBtn.setAttribute('data-user-id', userId);
                rejectJobBtn.setAttribute('data-user-name', userName);
                console.log('=== SETTING REJECT BUTTON DATA ===');
                console.log('Application ID set to:', applicationId);
                console.log('User ID set to:', userId);
                console.log('User Name set to:', userName);
            } else {
                console.error('Reject button not found!');
            }
            
            // Store application data for contact button
            const contactBtn = document.getElementById('contactBtn');
            if (contactBtn) {
                contactBtn.setAttribute('data-user-id', userId);
                contactBtn.setAttribute('data-user-name', userName);
                contactBtn.setAttribute('data-application-id', applicationId);
            }
            
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
    
    // Handle profile button click
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn) {
        profileBtn.addEventListener('click', function() {
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

    // Handle contact button click
    const contactBtn = document.getElementById('contactBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', function() {
            console.log('Contact button clicked');
            const userName = this.getAttribute('data-user-name');
            const userId = this.getAttribute('data-user-id');
            const applicationId = this.getAttribute('data-application-id');
            
            console.log('Contact button data:', { userName, userId, applicationId });
            
            if (userName && userId) {
                console.log(`Opening contact message for ${userName}`);
                
                // Close the current overlay
                closeActionOverlay();
                
                // Show contact message overlay
                showContactMessageOverlay(userId, userName, applicationId);
            } else {
                console.error('Missing contact button data attributes:', { userName, userId });
            }
        });
    }
    
    // Handle hire button click
    if (hireJobBtn) {
        hireJobBtn.addEventListener('click', function() {
            const applicationId = this.getAttribute('data-application-id');
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            
            // Get the application card to extract additional data
            const hireApplicationCard = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
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
                const reviewCount = userRating ? parseInt(userRating.getAttribute('data-review-count')) : null;
                
                // Get application details
                const applicationDate = hireApplicationCard.querySelector('[data-application-date]');
                const applicationTime = hireApplicationCard.querySelector('[data-application-time]');
                const applicationMessage = hireApplicationCard.querySelector('[data-application-message]');
                
                // Get job ID from the job listing
                const jobListing = hireApplicationCard.closest('.job-listing');
                const jobId = jobListing ? jobListing.querySelector('.job-header').getAttribute('data-job-id') : null;
                
                jobData = {
                    jobId: jobId,
                    jobTitle: jobTitle,
                    originalPrice: originalPrice,
                    agreedPrice: priceAmount,
                    priceType: priceType,
                    isCounterOffer: isCounterOffer,
                    offerType: offerType,
                    applicantDetails: {
                        userId: userId,
                        name: userName,
                        photo: userPhotoSrc,
                        rating: rating,
                        reviewCount: reviewCount
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
                    contractorRating: jobData.applicantDetails.rating,
                    contractorReviewCount: jobData.applicantDetails.reviewCount,
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
                        
                        // Update the Applications tab count
                        updateApplicationsCount();
                        
                        // Scroll to top to show other job listings that may be hidden behind header
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
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
            const applicationId = this.getAttribute('data-application-id');
            const userId = this.getAttribute('data-user-id');
            const userName = this.getAttribute('data-user-name');
            
            console.log('=== REJECT BUTTON CLICKED ===');
            console.log('Application ID:', applicationId);
            console.log('User Name:', userName);
            
            // Get the application card to extract additional data for comprehensive backend logging
            const rejectApplicationCard = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
            let rejectionData = {
                action: 'reject',
                applicationId: applicationId,
                userId: userId,
                userName: userName,
                timestamp: new Date().toISOString()
            };
            
            if (rejectApplicationCard) {
                // Extract comprehensive application data for backend
                const jobTitle = rejectApplicationCard.getAttribute('data-job-title');
                const originalPrice = rejectApplicationCard.getAttribute('data-original-price');
                const isCounterOffer = rejectApplicationCard.getAttribute('data-is-counter-offer') === 'true';
                
                // Get price offer details
                const priceElement = rejectApplicationCard.querySelector('[data-price-amount]');
                const priceAmount = priceElement ? priceElement.getAttribute('data-price-amount') : null;
                const priceType = priceElement ? priceElement.getAttribute('data-price-type') : null;
                const offerType = priceElement ? priceElement.getAttribute('data-offer-type') : null;
                
                // Get applicant details
                const userPhoto = rejectApplicationCard.querySelector('[data-user-photo]');
                const userPhotoSrc = userPhoto ? userPhoto.getAttribute('data-user-photo') : null;
                const userRating = rejectApplicationCard.querySelector('[data-user-rating]');
                const rating = userRating ? parseInt(userRating.getAttribute('data-user-rating')) : null;
                const reviewCount = userRating ? parseInt(userRating.getAttribute('data-review-count')) : null;
                
                // Get application details
                const applicationDate = rejectApplicationCard.querySelector('[data-application-date]');
                const applicationTime = rejectApplicationCard.querySelector('[data-application-time]');
                const applicationMessage = rejectApplicationCard.querySelector('[data-application-message]');
                
                // Get job ID from the job listing
                const jobListing = rejectApplicationCard.closest('.job-listing');
                const jobId = jobListing ? jobListing.querySelector('.job-header').getAttribute('data-job-id') : null;
                
                // Build comprehensive rejection data
                                 rejectionData = {
                     action: 'reject',
                     applicationId: applicationId,
                     userId: userId,
                     jobId: jobId,
                     timestamp: new Date().toISOString(),
                    jobDetails: {
                        jobTitle: jobTitle,
                        originalPrice: originalPrice,
                        offeredPrice: priceAmount,
                        priceType: priceType,
                        isCounterOffer: isCounterOffer,
                        offerType: offerType
                    },
                                         applicantDetails: {
                         userId: userId,
                         name: userName,
                         photo: userPhotoSrc,
                         rating: rating,
                         reviewCount: reviewCount
                     },
                    applicationDetails: {
                        date: applicationDate ? applicationDate.getAttribute('data-application-date') : null,
                        time: applicationTime ? applicationTime.getAttribute('data-application-time') : null,
                        message: applicationMessage ? applicationMessage.getAttribute('data-application-message') : null
                    },
                    rejectionReason: 'manual_rejection', // Could be enhanced to capture specific reasons
                    status: 'rejected'
                };
            }
            
            // Here you would send comprehensive rejection data to backend
            console.log('Backend data to send:', rejectionData);
            
            // Remove the application card from UI (mock functionality)
            const applicationCard = document.querySelector(`.application-card[data-application-id="${applicationId}"]`);
            console.log('Application card found:', applicationCard);
            console.log('Selector used:', `.application-card[data-application-id="${applicationId}"]`);
            
            if (applicationCard) {
                // Check if this will be the last application BEFORE removing it
                const jobListing = applicationCard.closest('.job-listing');
                console.log('Job listing found:', jobListing);
                
                let willBeEmpty = false;
                if (jobListing) {
                    const currentApplications = jobListing.querySelectorAll('.application-card');
                    console.log('Current applications before removal:', currentApplications.length);
                    willBeEmpty = currentApplications.length === 1; // This card is the last one
                    console.log('Will be empty after removal:', willBeEmpty);
                }
                
                // Add fade out animation
                applicationCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                applicationCard.style.opacity = '0';
                applicationCard.style.transform = 'translateX(-20px)';
                
                // Remove the card after animation
                setTimeout(() => {
                    applicationCard.remove();
                    
                    if (jobListing) {
                        if (willBeEmpty) {
                             // Update the application count to 0 and collapse the listing
                             const countElement = jobListing.querySelector('.application-count');
                             console.log('=== HANDLING LAST CARD REMOVAL ===');
                             console.log('Count element found:', countElement);
                             console.log('Current count text:', countElement ? countElement.textContent : 'null');
                             
                             if (countElement) {
                                 countElement.textContent = '0';
                                 console.log('Updated count to: 0');
                             }
                             
                             // Collapse the job listing since there are no applications
                             const jobHeader = jobListing.querySelector('.job-header');
                             const applicationsList = jobListing.querySelector('.applications-list');
                             const expandIcon = jobListing.querySelector('.expand-icon');
                             
                             if (jobHeader && applicationsList && expandIcon) {
                                 jobListing.classList.remove('expanded');
                                 applicationsList.style.display = 'none';
                                 expandIcon.textContent = '▼';
                                 console.log('Collapsed job listing');
                             }
                         } else {
                             // Update the application count after ensuring DOM is updated
                             setTimeout(() => {
                                 const remainingApplications = jobListing.querySelectorAll('.application-card');
                                 const countElement = jobListing.querySelector('.application-count');
                                 console.log('=== UPDATING REMAINING COUNT ===');
                                 console.log('Remaining applications found:', remainingApplications.length);
                                 console.log('Count element found:', countElement);
                                 if (countElement) {
                                     const newCount = remainingApplications.length;
                                     countElement.textContent = newCount.toString();
                                     console.log('Updated count to:', newCount);
                                 }
                             }, 10); // Small delay to ensure DOM is fully updated
                         }
                     }
                    
                    // Check if there are any applications left overall
                    updateApplicationsDisplay();
                    
                    // Update the Applications tab count
                    updateApplicationsCount();
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

// Notifications Management
function initializeNotifications() {
    const notificationActionBtns = document.querySelectorAll('.notification-action-btn');
    
    notificationActionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent notification item click
            
            const btnText = this.textContent.trim();
            const notificationItem = this.closest('.notification-item');
            const notificationTitle = notificationItem.querySelector('.notification-title').textContent;
            
            // Mark notification as read when any action button is clicked
            markNotificationAsRead(notificationItem);
            
            // Handle different action types
            switch(btnText) {
                case 'Review Applications':
                    handleReviewApplications(notificationItem);
                    break;
                case 'View Application':
                    handleViewApplication(notificationItem);
                    break;  
                case 'Reply':
                    handleReplyMessage(notificationItem);
                    break;
                default:
                    console.log(`Action: ${btnText} for notification: ${notificationTitle}`);
            }
        });
    });
    
    // Handle notification item clicks (mark as read, etc.)
    const notificationItems = document.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        // Initialize long press selection for each notification
        initializeLongPressSelection(item);
        
        item.addEventListener('click', function() {
            // Check if we're in selection mode
            if (document.querySelector('.notification-item.selected')) {
                // Toggle selection if in selection mode
                this.classList.toggle('selected');
                updateSelectionControls();
            } else {
                // Mark notification as read (visual feedback)
                markNotificationAsRead(this);
            }
        });
    });
}

function handleReviewApplications(notificationItem) {
    // Extract job info from notification
    const message = notificationItem.querySelector('.notification-message').textContent;
    
    // Switch to applications tab
    const applicationsTab = document.getElementById('applicationsTab');
    if (applicationsTab) {
        applicationsTab.click();
    }
    
    // Show confirmation that we're navigating
    showConfirmationOverlay(
        'success',
        'Navigating to Applications',
        'Taking you to review your job applications.'
    );
    
    console.log('Backend action: Navigate to applications for job review');
}

function handleViewApplication(notificationItem) {
    const message = notificationItem.querySelector('.notification-message').textContent;
    const applicantMatch = message.match(/\*\*(.*?)\*\*/);
    const applicantName = applicantMatch ? applicantMatch[1] : 'Unknown';
    
    // Switch to applications tab
    const applicationsTab = document.getElementById('applicationsTab');
    if (applicationsTab) {
        applicationsTab.click();
    }
    
    // Show confirmation
    showConfirmationOverlay(
        'success',
        'Viewing Application',
        `Opening ${applicantName}'s application for review.`
    );
    
    console.log('Backend action: Open specific application for:', applicantName);
}

function handleReplyMessage(notificationItem) {
    const message = notificationItem.querySelector('.notification-message').textContent;
    const senderMatch = message.match(/\*\*(.*?)\*\*/);
    const senderName = senderMatch ? senderMatch[1] : 'Unknown';
    
    // Switch to messages tab
    const messagesTab = document.getElementById('messagesTab');
    if (messagesTab) {
        messagesTab.click();
    }
    
    // Show confirmation
    showConfirmationOverlay(
        'success',
        'Opening Messages',
        `Opening conversation with ${senderName}.`
    );
    
    console.log('Backend action: Open message thread with:', senderName);
}

// Update notification count (would be called when new notifications arrive)
function updateNotificationCount(count) {
    const notificationCountElement = document.querySelector('.notification-count');
    if (notificationCountElement) {
        notificationCountElement.textContent = count;
        
        // Hide badge if count is 0
        if (count === 0) {
            notificationCountElement.style.display = 'none';
        } else {
            notificationCountElement.style.display = 'inline-block';
        }
    }
}

// Mark notification as read functionality
function markNotificationAsRead(notificationItem) {
    if (!notificationItem.classList.contains('read')) {
        notificationItem.classList.add('read');
        
        // Add a read indicator
        let readIndicator = notificationItem.querySelector('.read-indicator');
        if (!readIndicator) {
            readIndicator = document.createElement('div');
            readIndicator.className = 'read-indicator';
            readIndicator.innerHTML = '✓ Read';
            notificationItem.appendChild(readIndicator);
        }
        
        // Update the notifications count
        updateNotificationsCount();
        
        // Here you would send read status to backend
        const notificationTitle = notificationItem.querySelector('.notification-title').textContent;
        console.log('Notification marked as read:', notificationTitle);
    }
}

// Long press selection functionality
function initializeLongPressSelection(notificationItem) {
    let longPressTimer;
    let isLongPress = false;
    
    // Touch events for mobile
    notificationItem.addEventListener('touchstart', handleTouchStart, { passive: true });
    notificationItem.addEventListener('touchend', handleTouchEnd, { passive: true });
    notificationItem.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Mouse events for desktop
    notificationItem.addEventListener('mousedown', handleMouseStart);
    notificationItem.addEventListener('mouseup', handleMouseEnd);
    notificationItem.addEventListener('mouseleave', handleMouseEnd);
    
    function handleTouchStart(e) {
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            startSelectionMode(notificationItem);
        }, 500); // 500ms long press
    }
    
    function handleTouchMove(e) {
        // Cancel long press if user moves finger
        clearTimeout(longPressTimer);
    }
    
    function handleTouchEnd() {
        clearTimeout(longPressTimer);
    }
    
    function handleMouseStart(e) {
        if (e.button !== 0) return; // Only left mouse button
        isLongPress = false;
        longPressTimer = setTimeout(() => {
            isLongPress = true;
            startSelectionMode(notificationItem);
        }, 500);
    }
    
    function handleMouseEnd() {
        clearTimeout(longPressTimer);
    }
}

function startSelectionMode(notificationItem) {
    // Add vibration feedback on mobile
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Add selection class to the notification
    notificationItem.classList.add('selected');
    
    // Show selection controls
    showSelectionControls();
    
    console.log('Selection mode activated');
}

function showSelectionControls() {
    let selectionBar = document.getElementById('selectionControls');
    
    if (!selectionBar) {
        // Create selection controls bar
        selectionBar = document.createElement('div');
        selectionBar.id = 'selectionControls';
        selectionBar.className = 'selection-controls';
        selectionBar.innerHTML = `
            <div class="selection-info">
                <span id="selectionCount">1</span> selected
            </div>
            <div class="selection-actions">
                <button class="selection-btn cancel-btn" onclick="cancelSelection()">Cancel</button>
                <button class="selection-btn delete-btn" onclick="deleteSelectedNotifications()">Delete</button>
            </div>
        `;
        
        // Insert after the tabs
        const messagesContent = document.querySelector('.messages-content');
        messagesContent.parentNode.insertBefore(selectionBar, messagesContent);
    }
    
    selectionBar.style.display = 'flex';
    
    // Add class to adjust content margin
    const messagesContent = document.querySelector('.messages-content');
    messagesContent.classList.add('selection-active');
    
    updateSelectionControls();
}

function updateSelectionControls() {
    const selectedItems = document.querySelectorAll('.notification-item.selected');
    const selectionCount = document.getElementById('selectionCount');
    const selectionBar = document.getElementById('selectionControls');
    
    if (selectedItems.length === 0) {
        // Hide selection controls if no items selected
        if (selectionBar) {
            selectionBar.style.display = 'none';
        }
    } else {
        if (selectionCount) {
            selectionCount.textContent = selectedItems.length;
        }
    }
}

function cancelSelection() {
    // Remove selection from all items
    const selectedItems = document.querySelectorAll('.notification-item.selected');
    selectedItems.forEach(item => {
        item.classList.remove('selected');
    });
    
    // Hide selection controls
    const selectionBar = document.getElementById('selectionControls');
    if (selectionBar) {
        selectionBar.style.display = 'none';
    }
    
    // Remove selection class from content
    const messagesContent = document.querySelector('.messages-content');
    messagesContent.classList.remove('selection-active');
}

function deleteSelectedNotifications() {
    const selectedItems = document.querySelectorAll('.notification-item.selected');
    
    if (selectedItems.length === 0) return;
    
    // Add removing animation to selected items
    selectedItems.forEach(item => {
        item.classList.add('removing');
    });
    
    // Remove from DOM after animation
    setTimeout(() => {
        selectedItems.forEach(item => {
            item.remove();
        });
        
        // Update notifications count
        updateNotificationsCount();
        
        // Hide selection controls
        const selectionBar = document.getElementById('selectionControls');
        if (selectionBar) {
            selectionBar.style.display = 'none';
        }
        
        // Remove selection class from content
        const messagesContent = document.querySelector('.messages-content');
        messagesContent.classList.remove('selection-active');
        
        console.log(`${selectedItems.length} notifications deleted`);
    }, 300);
}

// Messages Management
function initializeMessages() {
    const messageThreadHeaders = document.querySelectorAll('.message-thread-header');
    
    messageThreadHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const threadId = this.getAttribute('data-thread-id');
            const messageThread = this.closest('.message-thread');
            const threadContent = document.getElementById('thread-' + threadId);
            const expandIcon = this.querySelector('.expand-icon');
            
            if (threadContent && expandIcon) {
                const isExpanded = messageThread.classList.contains('expanded');
                const messagesContainer = document.querySelector('.messages-container');
                
                if (isExpanded) {
                    // Collapse current thread
                    messageThread.classList.remove('expanded', 'show');
                    threadContent.style.display = 'none';
                    expandIcon.textContent = '▼';
                    
                    // Remove thread-active class and overlay from container
                    messagesContainer.classList.remove('thread-active', 'show-overlay');
                } else {
                    // First, close all other expanded threads
                    closeAllMessageThreads();
                    
                    // Then expand the current thread with fade animation
                    messageThread.classList.add('expanded');
                    threadContent.style.display = 'block';
                    expandIcon.textContent = '✕';
                    
                    // Add thread-active class to container for styling inactive threads
                    messagesContainer.classList.add('thread-active');
                    
                    // Trigger fade-in animation after positioning
                    setTimeout(() => {
                        messageThread.classList.add('show');
                        messagesContainer.classList.add('show-overlay');
                    }, 50);
                    
                    // Scroll to top when opening thread (under tabs)
                    scrollToThreadTop();
                    
                    // Remove "new" tag when opening thread
                    const newTag = this.querySelector('.thread-new-tag');
                    if (newTag) {
                        newTag.remove();
                        // Update message count
                        updateMessageCount();
                    }
                    
                    // Scroll message container to bottom to show latest messages
                    setTimeout(() => {
                        const scrollContainer = threadContent.querySelector('.message-scroll-container');
                        if (scrollContainer) {
                            scrollContainer.scrollTop = scrollContainer.scrollHeight;
                        }
                    }, 150);
                }
            }
        });
    });
}

function closeAllMessageThreads() {
    const allMessageThreads = document.querySelectorAll('.message-thread');
    const messagesContainer = document.querySelector('.messages-container');
    
    allMessageThreads.forEach(thread => {
        const header = thread.querySelector('.message-thread-header');
        const threadId = header.getAttribute('data-thread-id');
        const threadContent = document.getElementById('thread-' + threadId);
        const expandIcon = header.querySelector('.expand-icon');
        
        if (thread.classList.contains('expanded')) {
            thread.classList.remove('expanded', 'show');
            if (threadContent) {
                threadContent.style.display = 'none';
            }
            if (expandIcon) {
                expandIcon.textContent = '▼';
            }
        }
    });
    
    // Remove thread-active class and overlay when all threads are closed
    messagesContainer.classList.remove('thread-active', 'show-overlay');
}

function scrollToThreadTop() {
    // Scroll page to top under tabs to give room for message scroll container
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

function updateMessageCount() {
    // Count remaining "new" tags
    const newTags = document.querySelectorAll('.thread-new-tag');
    const messageCountElement = document.querySelector('#messagesTab .notification-count');
    
    if (messageCountElement) {
        const remainingCount = newTags.length;
        messageCountElement.textContent = remainingCount;
        
        // Hide badge if count is 0
        if (remainingCount === 0) {
            messageCountElement.style.display = 'none';
        } else {
            messageCountElement.style.display = 'inline-block';
        }
    }
}

function updateApplicationsCount() {
    // Count all remaining application cards
    const applicationCards = document.querySelectorAll('.application-card');
    const applicationsCountElement = document.querySelector('#applicationsTab .notification-count');
    
    if (applicationsCountElement) {
        const remainingCount = applicationCards.length;
        applicationsCountElement.textContent = remainingCount;
        
        // Hide badge if count is 0
        if (remainingCount === 0) {
            applicationsCountElement.style.display = 'none';
        } else {
            applicationsCountElement.style.display = 'inline-block';
        }
    }
}

function updateNotificationsCount() {
    // Count unread notifications (those without the 'read' class)
    const unreadNotifications = document.querySelectorAll('.notification-item:not(.read)');
    const notificationsCountElement = document.querySelector('#notificationsTab .notification-count');
    
    if (notificationsCountElement) {
        const unreadCount = unreadNotifications.length;
        notificationsCountElement.textContent = unreadCount;
        
        // Hide badge if count is 0
        if (unreadCount === 0) {
            notificationsCountElement.style.display = 'none';
        } else {
            notificationsCountElement.style.display = 'inline-block';
        }
    }
}

// Contact Message Overlay Functions
function showContactMessageOverlay(userId, userName, applicationId = null) {
    const overlay = document.getElementById('contactMessageOverlay');
    const userNameElement = document.getElementById('contactUserName');
    const messageInput = document.getElementById('contactMessageInput');
    
    if (overlay && userNameElement && messageInput) {
        // Set user information
        userNameElement.textContent = userName;
        
        // Set data attributes
        overlay.setAttribute('data-user-id', userId);
        overlay.setAttribute('data-user-name', userName);
        if (applicationId) {
            overlay.setAttribute('data-application-id', applicationId);
        }
        
        messageInput.setAttribute('data-user-id', userId);
        messageInput.setAttribute('data-user-name', userName);
        if (applicationId) {
            messageInput.setAttribute('data-application-id', applicationId);
        }
        
        // Clear previous message
        messageInput.value = '';
        
        // Show overlay
        overlay.classList.add('show');
        
        // Focus on input
        setTimeout(() => {
            messageInput.focus();
        }, 300);
    }
}

function closeContactMessageOverlay() {
    const overlay = document.getElementById('contactMessageOverlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

function initializeContactMessageOverlay() {
    const overlay = document.getElementById('contactMessageOverlay');
    const closeBtn = document.getElementById('contactCloseBtn');
    const cancelBtn = document.getElementById('contactCancelBtn');
    const sendBtn = document.getElementById('contactSendBtn');
    const messageInput = document.getElementById('contactMessageInput');
    
    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeContactMessageOverlay);
    }
    
    // Cancel button
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeContactMessageOverlay);
    }
    
    // Send button
    if (sendBtn && messageInput) {
        sendBtn.addEventListener('click', function() {
            const message = messageInput.value.trim();
            const userId = messageInput.getAttribute('data-user-id');
            const userName = messageInput.getAttribute('data-user-name');
            const applicationId = messageInput.getAttribute('data-application-id');
            
            if (message && userId && userName) {
                // Here you would send the message to backend
                console.log('Backend data to send:', {
                    action: 'send_contact_message',
                    senderId: 'current_user_id', // In real app, get from authentication
                    senderName: 'Current User', // In real app, get from authentication
                    recipientId: userId,
                    recipientName: userName,
                    applicationId: applicationId,
                    message: message,
                    timestamp: new Date().toISOString(),
                    messageType: 'contact_inquiry',
                    messageLength: message.length,
                    channelType: 'application_inquiry'
                });
                
                // Close contact overlay
                closeContactMessageOverlay();
                
                // Show confirmation
                showConfirmationOverlay(
                    'success',
                    'Message Sent!',
                    `Your message has been sent to ${userName}. They will be notified and can respond through the messages tab.`
                );
                
                // Clear the input
                messageInput.value = '';
            } else {
                // Show error if message is empty
                messageInput.style.borderColor = '#e53e3e';
                setTimeout(() => {
                    messageInput.style.borderColor = '#4a5568';
                }, 2000);
            }
        });
    }
    
    // Click outside to close
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeContactMessageOverlay();
            }
        });
    }
    
    // Enable/disable send button based on input
    if (messageInput && sendBtn) {
        messageInput.addEventListener('input', function() {
            const message = this.value.trim();
            if (message.length > 0) {
                sendBtn.disabled = false;
            } else {
                sendBtn.disabled = true;
            }
        });
        
        // Initially disable send button
        sendBtn.disabled = true;
    }
}

// Add overlay click to close functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize contact message overlay
    initializeContactMessageOverlay();
    
    // Add click listener to document for overlay clicks
    document.addEventListener('click', function(e) {
        const messagesContainer = document.querySelector('.messages-container');
        const expandedThread = document.querySelector('.message-thread.expanded');
        
        // Only proceed if there's an active thread
        if (!messagesContainer.classList.contains('thread-active') || !expandedThread) {
            return;
        }
        
        // Check if click is outside the expanded thread
        if (!expandedThread.contains(e.target)) {
            closeAllMessageThreads();
        }
    });
});



