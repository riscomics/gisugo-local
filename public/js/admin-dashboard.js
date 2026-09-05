// GISUGO Admin Dashboard JavaScript

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Admin Dashboard initialized');
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize sidebar toggle
    initializeSidebarToggle();
    
    // Initialize responsive behavior
    initializeResponsive();
    
    // Initialize search functionality
    initializeSearch();
    
    // Initialize Support Center (Admin Dashboard Phase 4) -- real
    // support_requests queue + reply + platform_broadcasts, replaces the
    // old mock-driven initializeAdminMessages()/initializeMessagesPagination()/
    // initializeInboxToggle()/initializePublicMessageOverlay()/
    // initializeInboxSearch()/initializeMessageOverlay()/initializeReplyModal()
    // call chain (those functions are now unreachable dead code -- left in
    // place rather than surgically deleted from an 8000+ line file under
    // time pressure; tracked as a cleanup follow-up in V1_HARDENING_TASKLIST.md,
    // same treatment as the existing support.js dead-code item).
    initializeSupportCenter();
    
    // Initialize user chats system
    initializeUserChats();
    
    // Initialize gig moderation system
    initializeGigModeration();
    
    // Initialize user management system
    initializeUserManagement();
    
    // Initialize stat overlay system
    initializeStatOverlays();
    
    // Initialize system settings
    initializeSystemSettings();

    // Initialize ad placement settings (Phase 6 — Firestore)
    initializeAdSettingsPanel();
    
    // Initialize admin profile dropdown
    initializeAdminDropdown();
});

// ===== SIDEBAR TOGGLE SYSTEM =====
function initializeSidebarToggle() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const mainContent = document.querySelector('.admin-main');
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', function() {
            toggleSidebar();
        });
        
        // Auto-collapse on tablet breakpoints
        window.addEventListener('resize', function() {
            handleResponsiveSidebar();
        });
        
        // Initial check
        handleResponsiveSidebar();
    }
    
    console.log('🔧 Sidebar toggle initialized');
}

function toggleSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const mainContent = document.querySelector('.admin-main');
    
    // Don't allow toggle if auto-collapsed (at 1350px and below)
    if (sidebar && sidebar.classList.contains('auto-collapsed')) {
        console.log('🚫 Toggle disabled - sidebar is auto-collapsed at this viewport size');
        return;
    }
    
    if (sidebar && mainContent) {
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        if (isCollapsed) {
            // Expand sidebar
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', 'false');
            console.log('📖 Sidebar expanded');
        } else {
            // Collapse sidebar
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', 'true');
            console.log('📕 Sidebar collapsed');
        }
    }
}

function handleResponsiveSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const mainContent = document.querySelector('.admin-main');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (window.innerWidth <= 1350) {
        // Auto-collapse at 1350px and below - sidebar becomes icon-only permanently
        if (sidebar && mainContent) {
            sidebar.classList.add('collapsed', 'auto-collapsed');
            mainContent.classList.add('sidebar-collapsed');
        }
        // Keep toggle button visible but disabled (for visual consistency)
        if (sidebarToggle) {
            sidebarToggle.style.display = 'flex'; // Keep visible
            sidebarToggle.style.pointerEvents = 'none'; // Disable clicking
            sidebarToggle.style.opacity = '0.5'; // Show it's disabled
        }
    } else {
        // Above 1350px: enable toggle and restore saved state
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (sidebar && mainContent && sidebarToggle) {
            sidebarToggle.style.display = 'flex';
            sidebarToggle.style.pointerEvents = 'auto';
            sidebarToggle.style.opacity = '1';
            
            sidebar.classList.remove('auto-collapsed');
            
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('sidebar-collapsed');
            } else {
                sidebar.classList.remove('collapsed');
                mainContent.classList.remove('sidebar-collapsed');
            }
        }
    }
}

// ===== NAVIGATION SYSTEM =====
// Global variable to track current active section
let currentActiveSection = 'overview';

function initializeNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Cleanup overlays from previous section
            cleanupSectionOverlays();
            
            // Update current active section
            currentActiveSection = targetSection;
            
            // Remove active class from all menu items
            menuItems.forEach(menu => menu.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
            // Reset scroll position to top when switching sections
            window.scrollTo(0, 0);
            
            // Update page title
            updatePageTitle(targetSection);
            
            console.log(`📱 Navigated to: ${targetSection}`);
        });
    });
}

// Cleanup function to hide all overlays when switching sections
function cleanupSectionOverlays() {
    // Hide message overlay
    const messageOverlay = document.getElementById('messageDetailOverlay');
    if (messageOverlay) {
        messageOverlay.style.display = '';
        messageOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // CHAT OVERLAY DELETED
    
    // Hide gig overlay
    const gigOverlay = document.getElementById('gigDetailOverlay');
    if (gigOverlay) {
        gigOverlay.style.display = '';
        document.body.style.overflow = '';
    }
    
    // Hide user overlay
    const userOverlay = document.getElementById('userDetailOverlay');
    if (userOverlay) {
        userOverlay.style.display = '';
        document.body.style.overflow = '';
    }

    closeUserListedGigsOverlay();
    
    console.log('🧹 Cleaned up all section overlays');
}

// Update page title based on current section
function updatePageTitle(section) {
    const titles = {
        'overview': 'Dashboard Overview',
        'users': 'User Management', 
        'finance': 'Financial Management',
        'analytics': 'Platform Analytics',
        'moderation': 'Gig Moderation',
        'ads': 'Ad Placement',
        'settings': 'System Settings'
    };
    
    const newTitle = titles[section] || 'Admin Dashboard';
    document.title = `GISUGO Admin - ${newTitle}`;
}

// ===== RESPONSIVE BEHAVIOR =====
function initializeResponsive() {
    const sidebar = document.querySelector('.admin-sidebar');
    const mainContent = document.querySelector('.admin-main');
    
    // Handle window resize
    window.addEventListener('resize', function() {
        handleResponsiveLayout();
        repositionTopicBadge(); // Reposition topic badge on resize
    });
    
    // Initial check
    handleResponsiveLayout();
    
    // Mobile menu toggle (for future implementation)
    createMobileMenuToggle();
}

function handleResponsiveLayout() {
    const sidebar = document.querySelector('.admin-sidebar');
    const windowWidth = window.innerWidth;
    
    if (windowWidth <= 400) {
        sidebar.classList.add('mobile-hidden');
    } else {
        sidebar.classList.remove('mobile-hidden');
        sidebar.classList.remove('mobile-open');
    }
}

function createMobileMenuToggle() {
    // This will be used for mobile menu toggle functionality
    // Can be implemented later when mobile menu overlay is needed
    const mobileToggle = document.createElement('button');
    mobileToggle.className = 'mobile-menu-toggle';
    mobileToggle.innerHTML = '☰';
    mobileToggle.style.display = 'none'; // Hidden for now
    
    // Add to header if needed in mobile view
    if (window.innerWidth <= 400) {
        const headerLeft = document.querySelector('.admin-logo');
        if (headerLeft) {
            headerLeft.appendChild(mobileToggle);
        }
    }
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });
        
        // Add search suggestions (future feature)
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value;
            if (query.length > 2) {
                // Future: Show search suggestions
                console.log(`🔍 Search query: ${query}`);
            }
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const query = searchInput ? searchInput.value : '';
            performSearch(query);
        });
    }
}

function performSearch(query) {
    if (!query.trim()) {
        console.log('❌ Empty search query');
        return;
    }
    
    console.log(`🔍 Performing search for: ${query}`);
    
    // Future implementation: 
    // - Search users, jobs, transactions
    // - Show search results overlay
    // - Navigate to relevant section with filters applied
    
    // For now, just show a simple feedback
    showSearchFeedback(query);
}

function showSearchFeedback(query) {
    // Simple feedback for now - can be replaced with proper search results
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        const originalPlaceholder = searchInput.placeholder;
        searchInput.placeholder = `Searching for "${query}"...`;
        
        setTimeout(() => {
            searchInput.placeholder = originalPlaceholder;
            searchInput.value = '';
        }, 2000);
    }
}

// ===== NOTIFICATION SYSTEM =====
function initializeNotifications() {
    const notificationBtn = document.querySelector('.notification-btn');
    
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            // Future: Show notifications dropdown
            console.log('🔔 Notifications clicked');
            toggleNotificationsPanel();
        });
    }
}

function toggleNotificationsPanel() {
    // Future implementation: Show/hide notifications panel
    console.log('📬 Toggle notifications panel');
}

// ===== UTILITY FUNCTIONS =====

// Format numbers for display
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Format currency for Philippine Peso
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

// Format dates for admin display
function formatAdminDate(date) {
    return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

// Show loading state
function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
    }
}

// Hide loading state
function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
    }
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', function(e) {
    // Alt + 1-6 for quick navigation
    if (e.altKey && e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        const sectionIndex = parseInt(e.key) - 1;
        const menuItems = document.querySelectorAll('.menu-item');
        if (menuItems[sectionIndex]) {
            menuItems[sectionIndex].click();
        }
    }
    
    // Ctrl/Cmd + K for search focus
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
});

// ===== ADMIN MESSAGES SYSTEM =====

// Storage for sent public messages
const sentPublicMessages = {
    'pub_001': {
        category: 'system-updates',
        subject: 'Scheduled System Maintenance - December 15, 2025',
        message: 'Dear GISUGO users, we will be performing scheduled system maintenance on December 15, 2025, from 2:00 AM to 6:00 AM PHT. During this time, the platform will be temporarily unavailable. We apologize for any inconvenience this may cause and appreciate your understanding as we work to improve our services.',
        recipients: 'All Users'
    },
    'pub_002': {
        category: 'platform-updates',
        subject: 'Exciting New Features: AI Job Matching & In-App Chat',
        message: 'We\'re excited to announce new features that will improve your GISUGO experience! Starting today, you\'ll have access to AI-powered job matching that suggests relevant opportunities based on your skills and preferences. Additionally, our new in-app chat system allows for seamless communication between job posters and workers. Update your app to access these features!',
        recipients: 'All Users'
    },
    'pub_003': {
        category: 'promotions',
        subject: 'Holiday Special: Get 20% Bonus G-Coins!',
        message: 'Celebrate the holidays with GISUGO! For a limited time, receive 20% bonus G-Coins on all top-ups of ₱500 or more. Offer valid until December 31, 2025. Simply top up your account through any of our payment channels to receive your bonus instantly. Terms and conditions apply. Happy holidays from the GISUGO team!',
        recipients: 'All Users'
    }
};

function initializeAdminMessages() {
    console.log('💬 Initializing Admin Messages System');
    
    // Store original message content HTML for restoration
    storeOriginalMessageHTML();
    
    // Initialize customer message handlers
    initializeCustomerMessages();
    
    // Initialize thread search and filters
    initializeThreadSearch();
    
    // Initialize reply functionality
    initializeReplySystem();
    
    // Initialize unsend confirmation
    initializeUnsendConfirmation();
    
    console.log('✅ Admin Messages System initialized');
}

// ===== CUSTOMER MESSAGES FUNCTIONALITY =====
function initializeCustomerMessages() {
    const messagesList = document.getElementById('customerMessagesList');
    const topicFilter = document.getElementById('topicFilter');
    
    // Use event delegation for message items (handles dynamically loaded messages)
    if (messagesList) {
        messagesList.addEventListener('click', function(e) {
            const messageItem = e.target.closest('.customer-message-item');
            if (messageItem) {
                // Remove selection from all items
                document.querySelectorAll('.customer-message-item').forEach(msg => msg.classList.remove('selected'));
                
                // Select clicked item
                messageItem.classList.add('selected');
                
                // Load message details
                loadMessageDetails(messageItem);
            }
        });
    }
    
    // Handle topic filtering
    if (topicFilter) {
        topicFilter.addEventListener('change', function() {
            filterMessagesByTopic(this.value);
        });
    }
}

function loadMessageDetails(messageElement) {
    const messageId = messageElement.getAttribute('data-message-id');
    
    console.log(`🖱️ Loading message ${messageId} at ${window.innerWidth}px`);
    
    try {
        // Check if it's a public message (sent message)
        if (messageId.startsWith('pub_')) {
            console.log('📢 Loading public message');
            loadPublicMessageDetails(messageElement);
            return;
        }
        
        // Check screen size and use appropriate method
        if (window.innerWidth <= 887) {
            // Use overlay for mobile/tablet (887px and below)
            console.log('📱 Using overlay mode');
            showMessageOverlay(messageId);
            return;
        }
        
        // Continue with desktop panel mode (888px and above)
        console.log('🖥️ Using panel mode');
        const topic = messageElement.getAttribute('data-topic');
        
        // Extract message data
        const messageData = {
            id: messageId,
            topic: topic,
            sender: {
                name: messageElement.querySelector('.sender-name').textContent,
                email: messageElement.querySelector('.sender-email').textContent,
                avatar: messageElement.querySelector('.sender-avatar').src
            },
            subject: messageElement.querySelector('.message-subject').textContent,
            content: getFullMessageContent(messageId), // This would come from backend
            time: messageElement.querySelector('.message-time').textContent,
            hasAttachment: messageElement.querySelector('.message-attachment') !== null
        };
        
        // Populate message detail panel
        populateMessageDetail(messageData);
        
        // Show message content panel
        const messageDetail = document.getElementById('messageDetail');
        const messageContent = document.getElementById('messageContent');
        
        if (messageDetail) messageDetail.style.display = 'none';
        if (messageContent) messageContent.style.display = 'block';
        
        // Mark as read
        messageElement.classList.remove('unread');
        
        console.log('📧 Message loaded:', messageId);
    } catch (error) {
        console.error('❌ Error loading message:', error);
        console.error('Message element:', messageElement);
        console.error('Message ID:', messageId);
    }
}

function loadPublicMessageDetails(messageElement) {
    const messageId = messageElement.getAttribute('data-message-id');
    const topic = messageElement.getAttribute('data-topic');
    
    // Check if we have stored data for this message
    const storedMessage = sentPublicMessages[messageId];
    
    // Extract public message data (use stored data if available)
    const sentMessage = {
        id: messageId,
        category: storedMessage ? storedMessage.category : getCategoryFromTopic(messageElement),
        subject: storedMessage ? storedMessage.subject : messageElement.querySelector('.message-subject').textContent,
        message: storedMessage ? storedMessage.message : getFullPublicMessageContent(messageId),
        timeAgo: messageElement.querySelector('.message-time').textContent,
        recipients: storedMessage ? storedMessage.recipients : messageElement.querySelector('.sender-email').textContent,
        status: 'sent'
    };
    
    // Check screen size and use appropriate method
    if (window.innerWidth <= 887) {
        // Use overlay for mobile/tablet (887px and below)
        console.log('📱 Using overlay mode for public message');
        showPublicMessageOverlay(sentMessage);
    } else {
        // Use desktop panel for larger screens (888px and above)
        console.log('🖥️ Using panel mode for public message');
        showPublicMessageDetail(sentMessage);
    }
    
    console.log('📢 Public message loaded:', messageId);
}

function getCategoryFromTopic(messageElement) {
    const topicElement = messageElement.querySelector('.message-topic');
    if (!topicElement) return 'important-notices';
    
    const classList = Array.from(topicElement.classList);
    const categoryClasses = ['important-notices', 'platform-updates', 'system-updates', 'promotions'];
    
    for (const cls of categoryClasses) {
        if (classList.includes(cls)) {
            return cls;
        }
    }
    
    return 'important-notices';
}

function getFullPublicMessageContent(messageId) {
    // Check if message exists in storage
    if (sentPublicMessages[messageId]) {
        return sentPublicMessages[messageId].message;
    }
    
    // Fallback for messages not in storage
    console.warn('Message content not found for:', messageId);
    return 'Message content not available.';
}

function populateMessageDetail(data) {
    // Restore original HTML structure if it was replaced by SENT message
    restoreOriginalMessageHTML();
    
    // Update avatar and sender info
    document.getElementById('detailAvatar').src = data.sender.avatar;
    document.getElementById('detailSenderName').textContent = data.sender.name;
    document.getElementById('detailSenderEmail').textContent = data.sender.email;
    document.getElementById('detailMessageTime').textContent = data.time;
    
    // Update topic badge
    const topicElement = document.getElementById('detailTopic');
    topicElement.textContent = getTopicDisplayName(data.topic);
    topicElement.className = `detail-topic ${data.topic}`;
    
    // Update subject and content
    document.getElementById('detailSubject').textContent = data.subject;
    
    // Get the message ID from the selected message to show reply thread
    const activeMessage = document.querySelector('.customer-message-item.selected');
    const messageId = activeMessage ? activeMessage.getAttribute('data-message-id') : null;
    
    // Combine original content with reply thread
    const replyThreadHTML = messageId ? generateReplyThreadHTML(messageId) : '';
    const fullContent = data.content + replyThreadHTML;
    
    document.getElementById('detailMessageText').innerHTML = fullContent;
    
    // Handle attachment
    const attachmentElement = document.getElementById('detailAttachment');
    if (data.hasAttachment) {
        attachmentElement.style.display = 'block';
        // Would populate attachment details from backend
    } else {
        attachmentElement.style.display = 'none';
    }
    
    // Position topic badge based on viewport
    repositionTopicBadge();
}

function repositionTopicBadge() {
    const topicElement = document.getElementById('detailTopic');
    const subjectElement = document.getElementById('detailSubject');
    const topicSection = document.querySelector('.detail-topic-section');
    
    if (!topicElement || !subjectElement || !topicSection) return;
    
    // Check viewport width (desktop detail panel only, not overlay)
    if (window.innerWidth >= 888 && window.innerWidth <= 1050) {
        // Move topic below subject
        if (topicElement.parentElement !== subjectElement.parentElement) {
            subjectElement.parentElement.insertBefore(topicElement, subjectElement.nextSibling);
        }
    } else {
        // Move topic back to header
        if (topicElement.parentElement !== topicSection) {
            topicSection.insertBefore(topicElement, topicSection.firstChild);
        }
    }
}

function filterMessagesByTopic(topic) {
    const messageItems = document.querySelectorAll('.customer-message-item');
    const topicHeaders = document.querySelectorAll('.message-topic');
    
    messageItems.forEach(item => {
        const itemTopic = item.getAttribute('data-topic');
        
        if (topic === 'all' || itemTopic === topic) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide topic headers based on filter selection
    if (topic === 'all') {
        // Show all topic headers when "All Topics" is selected
        topicHeaders.forEach(header => {
            header.style.display = 'block';
        });
        
        // Remove headers-hidden class from all message items
        messageItems.forEach(item => {
            item.classList.remove('headers-hidden');
        });
    } else {
        // Hide topic headers when specific topic is selected
        topicHeaders.forEach(header => {
            header.style.display = 'none';
        });
        
        // Add headers-hidden class to visible message items for styling
        messageItems.forEach(item => {
            const itemTopic = item.getAttribute('data-topic');
            if (topic === 'all' || itemTopic === topic) {
                item.classList.add('headers-hidden');
            }
        });
    }
    
    console.log('🔍 Filtered messages by topic:', topic);
    console.log('📋 Topic headers visibility:', topic === 'all' ? 'shown' : 'hidden');
}

function getTopicDisplayName(topic) {
    const topicNames = {
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
    
    return topicNames[topic] || topic;
}

function generateReplyThreadHTML(messageId) {
    const messageState = messageStates[messageId];
    
    if (!messageState || !messageState.replies || messageState.replies.length === 0) {
        return ''; // No replies to show
    }
    
    let threadHTML = '<div class="reply-thread"><h4 class="thread-title">Conversation History</h4>';
    
    messageState.replies.forEach(reply => {
        const replyDate = new Date(reply.timestamp);
        const formattedDate = replyDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
        
        threadHTML += `
            <div class="reply-item ${reply.type}">
                <div class="reply-header">
                    <div class="reply-author">
                        <div class="reply-author-avatar">
                            <img src="public/icons/user.png" alt="${reply.author}" class="author-avatar">
                        </div>
                        <div class="reply-author-info">
                            <span class="author-name">${reply.author}</span>
                            <span class="reply-time">${formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div class="reply-content">
                    ${reply.content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    });
    
    threadHTML += '</div>';
    return threadHTML;
}

function getFullMessageContent(messageId) {
    // Mock function - would fetch from backend
    const mockContent = {
        'msg_001': `Hi GISUGO Support Team,<br><br>
                   I hope this message finds you well. I am writing to report a critical issue that I've been experiencing with my G-Coins wallet for the past 2 days, and I'm quite frustrated with the situation.<br><br>
                   
                   <strong>THE PROBLEM:</strong><br>
                   Every time I try to access my G-Coins wallet through the app or website, I keep getting an error message that says "Connection timeout - Unable to load wallet data". This happens consistently regardless of what I try to do.<br><br>
                   
                   <strong>WHAT I'VE ALREADY TRIED:</strong><br>
                   1. Refreshed the page multiple times (at least 20+ times)<br>
                   2. Cleared my entire browser cache and cookies<br>
                   3. Tried using different browsers (Chrome, Firefox, Safari)<br>
                   4. Logged out and logged back in several times<br>
                   5. Restarted my phone and computer<br>
                   6. Checked my internet connection (it's working fine for everything else)<br>
                   7. Tried accessing the wallet at different times of the day<br>
                   8. Updated my app to the latest version<br>
                   9. Disabled all browser extensions<br>
                   10. Tried using incognito/private browsing mode<br><br>
                   
                   <strong>URGENT SITUATION:</strong><br>
                   This is becoming quite urgent because I have several pending transactions that I need to complete:<br><br>
                   - I hired Ana Rodriguez for a deep cleaning service of my 3-bedroom house<br>
                   - She's supposed to come tomorrow morning at 9 AM<br>
                   - I promised to pay her ₱800 through G-Coins as agreed<br>
                   - I also have a plumber (Miguel Torres) scheduled for Thursday who expects G-Coins payment<br>
                   - My current G-Coins balance should be ₱2,450 from my recent top-up<br><br>
                   
                   <strong>IMPACT ON MY TRUST:</strong><br>
                   As a long-time GISUGO user (member since 2022), I've always trusted your platform for my household service needs. This wallet issue is really affecting my ability to hire workers and is making me look unreliable to the service providers I've booked.<br><br>
                   
                   <strong>TECHNICAL DETAILS:</strong><br>
                   - Device: iPhone 13 Pro (iOS 17.2)<br>
                   - App Version: GISUGO v3.4.2<br>
                   - Browser: Safari 17.2 (also tried Chrome 119)<br>
                   - Internet: Globe Fiber 100 Mbps (stable connection)<br>
                   - Location: Quezon City, Philippines<br><br>
                   
                   <strong>ADDITIONAL CONCERNS:</strong><br>
                   I'm also worried about the security of my funds. Is my ₱2,450 balance safe? Are other users experiencing this issue? Could this be a broader system problem?<br><br>
                   
                   I've attached a screenshot showing the exact error message I'm seeing. You'll notice that the wallet section just shows a loading spinner that eventually times out.<br><br>
                   
                   <strong>REQUESTED ACTIONS:</strong><br>
                   1. Please investigate what's causing this wallet access issue<br>
                   2. Confirm that my G-Coins balance (₱2,450) is secure<br>
                   3. Provide an estimated timeline for when this will be resolved<br>
                   4. If possible, manually process my payment to Ana Rodriguez (₱800) for tomorrow's cleaning<br>
                   5. Consider providing compensation for the inconvenience this has caused<br><br>
                   
                   I really hope you can resolve this quickly. I've been recommending GISUGO to friends and family, but issues like this make it difficult to maintain confidence in the platform.<br><br>
                   
                   Please respond as soon as possible. I'm available at this email or my mobile number +63 917 123 4567.<br><br>
                   
                   Thank you for your immediate attention to this matter.<br><br>
                   
                   Frustrated but hopeful,<br>
                   Maria Santos<br>
                   GISUGO User ID: MS789456<br>
                   Account created: March 15, 2022<br><br>
                   
                   P.S. - I've also noticed that the "Transaction History" button in the wallet section has been grayed out for the past week. Is this related to the same issue?`,
        'msg_002': `Hello,<br><br>
                   I hired someone for a cleaning job scheduled for yesterday at 2 PM, but they never showed up. I tried contacting them multiple times through the platform messages but got no response.<br><br>
                   I paid upfront and now I'm out of money and still need the cleaning done. What can you do to help?<br><br>
                   Regards,<br>
                   Juan`,
        'msg_003': `Hi GISUGO Team,<br><br>
                   I've been using your platform for a few months now and I love it! I have a suggestion that could make it even better.<br><br>
                   It would be great if workers could also rate customers to help build trust on both sides. Sometimes customers can be difficult too, and this would help workers make better decisions about which jobs to accept.<br><br>
                   Thanks for considering this!<br><br>
                   Best regards,<br>
                   Ana`
    };
    
    return mockContent[messageId] || 'Message content not found.';
}

// ===== THREAD SEARCH FUNCTIONALITY =====
function initializeThreadSearch() {
    const searchInput = document.getElementById('threadSearchInput');
    const searchBtn = document.getElementById('threadSearchBtn');
    const statusFilter = document.getElementById('threadStatusFilter');
    
    // Handle search input
    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            performThreadSearch(searchInput.value);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performThreadSearch(this.value);
            }
        });
    }
    
    // Handle status filtering
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterThreadsByStatus(this.value);
        });
    }
    
    // Handle thread actions
    initializeThreadActions();
}

function performThreadSearch(query) {
    const threads = document.querySelectorAll('.conversation-thread');
    const searchTerm = query.toLowerCase().trim();
    
    threads.forEach(thread => {
        const title = thread.getAttribute('data-job-title').toLowerCase();
        const participants = thread.querySelectorAll('.participant-name');
        let participantNames = '';
        
        participants.forEach(participant => {
            participantNames += participant.textContent.toLowerCase() + ' ';
        });
        
        const isMatch = title.includes(searchTerm) || participantNames.includes(searchTerm);
        
        thread.style.display = isMatch ? 'block' : 'none';
    });
    
    console.log('🔍 Thread search performed:', query);
}

function filterThreadsByStatus(status) {
    const threads = document.querySelectorAll('.conversation-thread');
    
    threads.forEach(thread => {
        const threadStatus = thread.querySelector('.thread-status').textContent.toLowerCase();
        
        if (status === 'all' || threadStatus === status) {
            thread.style.display = 'block';
        } else {
            thread.style.display = 'none';
        }
    });
    
    console.log('🔍 Threads filtered by status:', status);
}

function initializeThreadActions() {
    const priorityButtons = document.querySelectorAll('.thread-action-btn.priority');
    const archiveButtons = document.querySelectorAll('.thread-action-btn.archive');
    const conversationThreads = document.querySelectorAll('.conversation-thread');
    
    // Make entire conversation thread clickable
    conversationThreads.forEach(thread => {
        thread.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.thread-action-btn')) {
                loadConversationThread(this);
            }
        });
    });
    
    // Priority conversation handlers
    priorityButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const thread = this.closest('.conversation-thread');
            const threadId = thread.getAttribute('data-thread-id');
            togglePriority(threadId);
        });
    });
    
    // Archive conversation handlers
    archiveButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const thread = this.closest('.conversation-thread');
            const threadId = thread.getAttribute('data-thread-id');
            archiveConversation(threadId);
        });
    });
}

function loadConversationThread(threadElement) {
    const threadId = threadElement.getAttribute('data-thread-id');
    const jobTitle = threadElement.getAttribute('data-job-title');
    
    // Extract thread data
    const threadData = {
        id: threadId,
        jobTitle: jobTitle,
        participants: extractParticipantData(threadElement),
        status: threadElement.querySelector('.thread-status').textContent.trim(),
        messageCount: threadElement.querySelector('.message-count').textContent,
        startDate: threadElement.querySelector('.thread-date').textContent,
        isDisputed: threadElement.classList.contains('disputed')
    };
    
    // Populate conversation view in center panel
    populateConversationView(threadData);
    
    // Show conversation content panel
    document.getElementById('messageDetail').style.display = 'none';
    document.getElementById('messageContent').style.display = 'block';
    
    // Highlight selected thread
    document.querySelectorAll('.conversation-thread').forEach(t => t.classList.remove('selected'));
    threadElement.classList.add('selected');
    
    // Clear customer message selection
    document.querySelectorAll('.customer-message-item').forEach(msg => msg.classList.remove('selected'));
    
    console.log('💬 Conversation thread loaded:', threadId);
}

function extractParticipantData(threadElement) {
    const participantRows = threadElement.querySelectorAll('.participant-row');
    const participantData = [];
    
    participantRows.forEach(row => {
        const name = row.querySelector('.participant-name')?.textContent || '';
        const role = row.querySelector('.participant-role')?.textContent || '';
        
        participantData.push({ 
            avatar: 'public/users/User-02.jpg', // Default avatar for compatibility
            name, 
            role 
        });
    });
    
    return participantData;
}

function populateConversationView(data) {
    // Update header with conversation info
    document.getElementById('detailAvatar').src = data.participants[0]?.avatar || 'public/users/User-02.jpg';
    document.getElementById('detailSenderName').textContent = `${data.participants[0]?.name} ↔ ${data.participants[1]?.name}`;
    document.getElementById('detailSenderEmail').textContent = `${data.participants[0]?.role} - ${data.participants[1]?.role}`;
    document.getElementById('detailMessageTime').textContent = data.startDate;
    
    // Update topic badge with conversation status
    const topicElement = document.getElementById('detailTopic');
    topicElement.textContent = data.status.toUpperCase();
    topicElement.className = `detail-topic ${data.status.toLowerCase()}`;
    
    // Update subject with job title
    document.getElementById('detailSubject').textContent = data.jobTitle;
    
    // Update content with conversation preview
    document.getElementById('detailMessageText').innerHTML = generateConversationPreview(data);
    
    // Hide attachment section for conversations
    document.getElementById('detailAttachment').style.display = 'none';
    
    // Update reply section for conversation monitoring
    updateReplyForConversation(data);
}

function generateConversationPreview(data) {
    // Full message history isn't wired to Firestore yet -- show an honest
    // placeholder instead of inventing fake dialogue for this thread.
    return `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <strong>Job Conversation Thread</strong><br>
            <span style="color: #a0aec0;">Messages: ${data.messageCount}</span><br>
            <span style="color: #a0aec0;">Status: ${data.status}</span>
            ${data.isDisputed ? '<br><span style="color: #ff4757;">Flagged for Review</span>' : ''}
        </div>

        <p style="color: #a0aec0; line-height: 1.4; margin-top: 1rem; font-size: 0.9rem; font-style: italic;">
            Conversation preview not available yet -- full message history requires the real-time
            chat backend to be wired up here.
        </p>
    `;
}

function updateReplyForConversation(data) {
    const replyHeader = document.querySelector('.reply-header h4');
    const statusBadge = document.querySelector('.status-badge');
    const replyTextarea = document.getElementById('replyTextarea');
    const sendBtn = document.getElementById('sendReplyBtn');
    const markResolvedBtn = document.getElementById('markResolvedBtn');
    
    // Update reply section for conversation monitoring
    if (replyHeader) replyHeader.textContent = 'Admin Notes';
    if (statusBadge) {
        statusBadge.textContent = data.status.toUpperCase();
        statusBadge.className = `status-badge ${data.status.toLowerCase()}`;
    }
    
    if (replyTextarea) {
        replyTextarea.placeholder = 'Add admin notes about this conversation...';
    }
    
    if (sendBtn) sendBtn.textContent = 'Add Note';
    if (markResolvedBtn) markResolvedBtn.textContent = data.isDisputed ? 'Mark Resolved' : 'Flag for Review';
}

function flagConversation(threadId) {
    console.log('🚨 Flagging conversation:', threadId);
    const confirmed = confirm('Flag this conversation for review?\n\nThis will mark it as requiring admin attention.');
    
    if (confirmed) {
        // Would send flag request to backend
        alert('Conversation flagged for review. You will be notified of any updates.');
    }
}

function togglePriority(threadId) {
    console.log('🔥 Toggling priority for:', threadId);
    alert(`Priority status toggled for thread: ${threadId}\n\nHigh priority conversations will appear at the top of the list.`);
}

function archiveConversation(threadId) {
    console.log('📁 Archiving conversation:', threadId);
    const confirmed = confirm('Archive this conversation?\n\nArchived conversations can be restored later.');
    
    if (confirmed) {
        // Would send archive request to backend
        const thread = document.querySelector(`[data-thread-id="${threadId}"]`);
        if (thread) {
            thread.style.display = 'none';
        }
        alert('Conversation archived successfully.');
    }
}

// ===== REPLY SYSTEM FUNCTIONALITY =====
function initializeReplySystem() {
    const replyTextarea = document.getElementById('replyTextarea');
    const attachmentInput = document.getElementById('replyAttachment');
    const sendBtn = document.getElementById('sendReplyBtn');
    const markResolvedBtn = document.getElementById('markResolvedBtn');
    
    // Handle attachment upload
    if (attachmentInput) {
        attachmentInput.addEventListener('change', function(e) {
            handleReplyAttachment(e.target.files[0]);
        });
    }
    
    // Handle send reply
    if (sendBtn) {
        sendBtn.addEventListener('click', function() {
            sendAdminReply();
        });
    }
    
    // Handle mark resolved
    if (markResolvedBtn) {
        markResolvedBtn.addEventListener('click', function() {
            markMessageResolved();
        });
    }
    
    // Handle remove attachment
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-attachment')) {
            removeReplyAttachment();
        }
    });
}

function handleReplyAttachment(file) {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, GIF).');
        return;
    }
    
    const replyAttachTooLarge = typeof isSupportPhotoOriginalTooLarge === 'function'
        ? isSupportPhotoOriginalTooLarge(file)
        : file.size > 25 * 1024 * 1024;
    if (replyAttachTooLarge) {
        const maxMb = typeof getSupportPhotoOriginalMaxBytes === 'function'
            ? Math.round(getSupportPhotoOriginalMaxBytes() / (1024 * 1024))
            : 25;
        alert(`This photo is too large to attach (over ${maxMb}MB).`);
        return;
    }
    
    // Preview the attachment
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewArea = document.getElementById('replyAttachmentPreview');
        const img = previewArea.querySelector('.reply-attachment-img');
        
        img.src = e.target.result;
        previewArea.style.display = 'inline-block';
    };
    
    reader.readAsDataURL(file);
    console.log('📎 Reply attachment added:', file.name);
}

function removeReplyAttachment() {
    const previewArea = document.getElementById('replyAttachmentPreview');
    const attachmentInput = document.getElementById('replyAttachment');
    
    previewArea.style.display = 'none';
    attachmentInput.value = '';
    
    console.log('🗑️ Reply attachment removed');
}

function sendAdminReply() {
    const textarea = document.getElementById('replyTextarea');
    const replyText = textarea.value.trim();
    
    if (!replyText) {
        alert('Please enter a reply message.');
        return;
    }
    
    // Get attachment if any
    const attachmentInput = document.getElementById('replyAttachment');
    const hasAttachment = attachmentInput.files.length > 0;
    
    console.log('📤 Sending admin reply:', {
        message: replyText,
        hasAttachment: hasAttachment
    });
    
    // Would send to backend here
    showToast('Reply sent successfully!', 'success', 2000);
    
    // Update message status with reply content
    handleReplySuccess(replyText);
    
    // Refresh the message view to show the new reply in the thread
    const activeMessage = document.querySelector('.customer-message-item.selected');
    if (activeMessage) {
        const messageId = activeMessage.getAttribute('data-message-id');
        // Reload the message to display the updated conversation thread
        setTimeout(() => {
            activeMessage.click();
        }, 300);
    }
    
    // Clear the form
    textarea.value = '';
    removeReplyAttachment();
    
    // Update status
    updateReplyStatus('resolved');
}

function markMessageResolved() {
    const confirmed = confirm('Mark this message as resolved?\n\nThis will close the ticket and move it to the resolved section.');
    
    if (confirmed) {
        updateReplyStatus('resolved');
        alert('Message marked as resolved.');
        console.log('✅ Message marked as resolved');
    }
}

function updateReplyStatus(status) {
    const statusBadge = document.querySelector('.status-badge');
    
    if (statusBadge) {
        statusBadge.className = `status-badge ${status}`;
        statusBadge.textContent = status === 'resolved' ? 'Resolved' : 'Pending Response';
    }
}

// ===== USER CHATS SYSTEM =====

/**
 * FIREBASE BACKEND INTEGRATION NOTES:
 * 
 * CURRENT STRUCTURE (Mock Data):
 * - id: Unique chat identifier
 * - gigTitle: Job/gig title (55 char limit)
 * - participants: Array[2] with {name, role, avatar}
 * - initiator: 'customer' or 'worker' (who started chat)
 * - dateCreated: ISO timestamp
 * - status: 'new' | 'flagged' | 'locked'
 * - messages: Array with {sender, senderName, text, time, photo (optional)}
 * 
 * FIREBASE MAPPING REQUIRED:
 * - Firestore threadId → id
 * - Firestore jobTitle → gigTitle
 * - Firestore participants (UIDs array) → expand to full participant objects with names/avatars
 * - Firestore message.content → text
 * - Firestore message.senderType → sender
 * - Firestore message.timestamp → time (ISO string)
 * - Firestore message.photoURL → photo (if exists)
 * 
 * FIRESTORE STRUCTURE NEEDED:
 * conversations/{threadId}
 *   - jobId, jobTitle, participants[], createdAt, adminStatus ('new'|'flagged'|'locked')
 *   - messages/{messageId}: senderId, senderType, content, timestamp, photoURL
 * 
 * See messages.js lines ~2515-2620 for customer/worker chat structure reference
 */

// User chat threads -- to be populated from real Firestore chat-thread data once wired.
const userChatsData = [];

// Chat State Management
let currentChatCategory = 'new';
let chatStates = {};

// Initialize per-chat UI state (flagged/locked/etc) from whatever's in userChatsData
function initializeChatStates() {
    userChatsData.forEach(chat => {
        chatStates[chat.id] = {
            status: chat.status,
            isFlagged: chat.status === 'flagged',
            isLocked: chat.status === 'locked'
        };
    });
}

// Initialize User Chats System
function initializeUserChats() {
    console.log('🚀 Initializing User Chats System...');
    
    initializeChatStates();
    renderChatList();
    initializeChatCategoryToggle();
    initializeChatSearch();
    updateChatCategoryCounts();
    
    console.log('✅ User Chats System initialized');
}

// Render Chat List
function renderChatList() {
    const chatListContainer = document.getElementById('chatListContainer');
    if (!chatListContainer) return;
    
    // Filter chats by current category
    const filteredChats = userChatsData.filter(chat => {
        const state = chatStates[chat.id];
        if (currentChatCategory === 'new') {
            return state.status === 'new';
        } else if (currentChatCategory === 'flagged') {
            return state.isFlagged;
        } else if (currentChatCategory === 'locked') {
            return state.isLocked;
        }
        return false;
    });
    
    // Sort by date created (newest first)
    filteredChats.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    
    // Render chat items
    chatListContainer.innerHTML = filteredChats.map(chat => {
        const state = chatStates[chat.id];
        const dateFormatted = new Date(chat.dateCreated).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        let statusBadges = '';
        if (state.isFlagged) {
            statusBadges += '<span class="chat-status-badge flagged">FLAGGED</span>';
        }
        if (state.isLocked) {
            statusBadges += '<span class="chat-status-badge locked">LOCKED</span>';
        }
        
        return `
            <div class="chat-item-card" data-chat-id="${chat.id}">
                <div class="chat-item-header">
                    <div class="chat-gig-title">${chat.gigTitle}</div>
                    <div class="chat-item-date">${dateFormatted}</div>
                </div>
                <div class="chat-participants">
                    ${chat.participants.map(p => `
                        <div class="chat-participant">
                            ${p.avatar.startsWith('http') ? 
                                `<img src="${p.avatar}" class="participant-avatar" alt="${p.name}" />` : 
                                `<div class="participant-avatar">${p.avatar}</div>`}
                            <span>${p.name}</span>
                            <span class="participant-role ${p.role}">${p.role}</span>
                        </div>
                    `).join('')}
                </div>
                ${statusBadges ? `<div class="chat-status-badges">${statusBadges}</div>` : ''}
            </div>
        `;
    }).join('');
    
    // Add lazy loading indicator (placeholder for backend pagination)
    if (filteredChats.length > 0) {
        chatListContainer.innerHTML += `
            <div style="padding: 1rem; text-align: center; color: rgba(230, 214, 174, 0.5); font-size: 0.85rem;">
                <!-- Lazy loading will fetch more chats from backend -->
            </div>
        `;
    }
    
    // Add click handlers to chat cards
    const chatCards = chatListContainer.querySelectorAll('.chat-item-card');
    chatCards.forEach(card => {
        card.addEventListener('click', () => {
            const chatId = card.getAttribute('data-chat-id');
            selectChat(chatId);
        });
    });
}

// Select and Display Chat
function selectChat(chatId) {
    const chat = userChatsData.find(c => c.id === chatId);
    if (!chat) return;
    
    // Update selected state
    document.querySelectorAll('.chat-item-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-chat-id="${chatId}"]`)?.classList.add('selected');
    
    // Check viewport to determine window or overlay
    if (window.innerWidth <= 820) {
        showChatOverlay(chat);
    } else {
        showChatDetailWindow(chat);
    }
}

// Show Chat in Detail Window (Desktop)
function showChatDetailWindow(chat) {
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (!chatDetailWindow) return;
    
    const state = chatStates[chat.id];
    const dateFormatted = new Date(chat.dateCreated).toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
    
    chatDetailWindow.innerHTML = `
        <div class="chat-detail-header">
            <div class="chat-detail-title">${chat.gigTitle}</div>
            <div class="chat-detail-participants">
                ${chat.participants.map(p => `
                    <div class="chat-detail-participant">
                        ${p.avatar.startsWith('http') ? 
                            `<img src="${p.avatar}" class="participant-avatar-large" alt="${p.name}" />` : 
                            `<div class="participant-avatar-large">${p.avatar}</div>`}
                        <div class="participant-info">
                            <span class="participant-name">${p.name}</span>
                            <span class="participant-role ${p.role}">${p.role}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="chat-detail-date">Created: ${dateFormatted}</div>
        </div>
        
        <div class="chat-messages-body">
            ${chat.messages.map(msg => {
                const msgTime = new Date(msg.time).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                });
                return `
                    <div class="chat-message-bubble sender-${msg.sender}">
                        <div class="chat-message-meta">
                            <span class="chat-message-sender">${msg.senderName}</span>
                            <span class="chat-message-time">${msgTime}</span>
                        </div>
                        <div class="chat-message-text">${msg.text}</div>
                        ${msg.photo ? `<div class="chat-message-photo"><img src="${msg.photo}" alt="Shared photo" /></div>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="chat-detail-footer">
            ${currentChatCategory === 'flagged' ? `
                <button class="chat-action-btn ignore" data-chat-id="${chat.id}">
                    Ignore
                </button>
            ` : `
                <button class="chat-action-btn flag ${state.isFlagged ? 'flagged' : ''}" data-chat-id="${chat.id}">
                    ${state.isFlagged ? '🚩 Flagged' : 'Flag'}
                </button>
            `}
            ${currentChatCategory === 'locked' ? `
                <button class="chat-action-btn unlock" data-chat-id="${chat.id}">
                    🔓 Unlock
                </button>
            ` : `
                <button class="chat-action-btn lock ${state.isLocked ? 'locked' : ''}" data-chat-id="${chat.id}">
                    ${state.isLocked ? '🔒 Locked' : 'Lock'}
                </button>
            `}
            <button class="chat-action-btn close" data-chat-id="${chat.id}">
                Close
            </button>
        </div>
    `;
    
    // Add action button handlers
    attachChatActionHandlers();
}

// Show Chat in Overlay (Mobile)
function showChatOverlay(chat) {
    const overlay = document.getElementById('chatDetailOverlay');
    const overlayContent = overlay.querySelector('.chat-overlay-content');
    if (!overlay || !overlayContent) return;
    
    const state = chatStates[chat.id];
    const dateFormatted = new Date(chat.dateCreated).toLocaleString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
    
    overlayContent.innerHTML = `
        <div class="chat-detail-header">
            <div class="chat-detail-title">${chat.gigTitle}</div>
            <div class="chat-detail-participants">
                ${chat.participants.map(p => `
                    <div class="chat-detail-participant">
                        ${p.avatar.startsWith('http') ? 
                            `<img src="${p.avatar}" class="participant-avatar-large" alt="${p.name}" />` : 
                            `<div class="participant-avatar-large">${p.avatar}</div>`}
                        <div class="participant-info">
                            <span class="participant-name">${p.name}</span>
                            <span class="participant-role ${p.role}">${p.role}</span>
            </div>
        </div>
                `).join('')}
            </div>
            <div class="chat-detail-date">Created: ${dateFormatted}</div>
        </div>
        
        <div class="chat-messages-body">
            ${chat.messages.map(msg => {
                const msgTime = new Date(msg.time).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                });
                return `
                    <div class="chat-message-bubble sender-${msg.sender}">
                        <div class="chat-message-meta">
                            <span class="chat-message-sender">${msg.senderName}</span>
                            <span class="chat-message-time">${msgTime}</span>
                        </div>
                        <div class="chat-message-text">${msg.text}</div>
                        ${msg.photo ? `<div class="chat-message-photo"><img src="${msg.photo}" alt="Shared photo" /></div>` : ''}
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="chat-detail-footer">
            ${currentChatCategory === 'flagged' ? `
                <button class="chat-action-btn ignore" data-chat-id="${chat.id}">
                    Ignore
                </button>
            ` : `
                <button class="chat-action-btn flag ${state.isFlagged ? 'flagged' : ''}" data-chat-id="${chat.id}">
                    ${state.isFlagged ? '🚩 Flagged' : 'Flag'}
                </button>
            `}
            ${currentChatCategory === 'locked' ? `
                <button class="chat-action-btn unlock" data-chat-id="${chat.id}">
                    🔓 Unlock
                </button>
            ` : `
                <button class="chat-action-btn lock ${state.isLocked ? 'locked' : ''}" data-chat-id="${chat.id}">
                    ${state.isLocked ? '🔒 Locked' : 'Lock'}
                </button>
            `}
            <button class="chat-action-btn close" data-chat-id="${chat.id}">
                Close
            </button>
        </div>
    `;
    
    overlay.classList.add('active');
    
    // Add action button handlers
    attachChatActionHandlers();
    
    // Add overlay close handler (click outside)
    setTimeout(() => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeChatOverlay();
            }
        });
    }, 100);
}

// Close Chat Overlay
function closeChatOverlay() {
    const overlay = document.getElementById('chatDetailOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// Attach Chat Action Handlers
function attachChatActionHandlers() {
    // Flag button
    document.querySelectorAll('.chat-action-btn.flag').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatId = btn.getAttribute('data-chat-id');
            toggleChatFlag(chatId);
        });
    });
    
    // Ignore button (in Flagged tab)
    document.querySelectorAll('.chat-action-btn.ignore').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatId = btn.getAttribute('data-chat-id');
            ignoreChat(chatId);
        });
    });
    
    // Lock button
    document.querySelectorAll('.chat-action-btn.lock').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatId = btn.getAttribute('data-chat-id');
            toggleChatLock(chatId);
        });
    });
    
    // Unlock button (in Locked tab)
    document.querySelectorAll('.chat-action-btn.unlock').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatId = btn.getAttribute('data-chat-id');
            unlockChat(chatId);
        });
    });
    
    // Close button
    document.querySelectorAll('.chat-action-btn.close').forEach(btn => {
        btn.addEventListener('click', () => {
            const chatId = btn.getAttribute('data-chat-id');
            closeChat(chatId);
        });
    });
}

// Toggle Chat Flag (from Chats tab)
function toggleChatFlag(chatId) {
    const state = chatStates[chatId];
    const chat = userChatsData.find(c => c.id === chatId);
    
    // Flag the chat and move to Flagged tab
    state.isFlagged = true;
    state.isLocked = false;
    chat.status = 'flagged';
    console.log(`🚩 Chat ${chatId} flagged`);
    
    // Close the detail window/overlay
    closeChatOverlay();
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (chatDetailWindow) {
        chatDetailWindow.innerHTML = `
            <div class="chat-detail-placeholder">
                <div class="placeholder-icon">💬</div>
                <p>Select a chat to view conversation</p>
            </div>
        `;
    }
    
    // Switch to flagged tab
    switchChatCategory('flagged');
    
    // Refresh display
    renderChatList();
    updateChatCategoryCounts();
}

// Ignore Chat (from Flagged tab - restore to Chats)
function ignoreChat(chatId) {
    const state = chatStates[chatId];
    const chat = userChatsData.find(c => c.id === chatId);
    
    // Unflag and restore to Chats tab
    state.isFlagged = false;
    state.isLocked = false;
    chat.status = 'new';
    console.log(`✅ Chat ${chatId} ignored (restored to Chats)`);
    
    // Close the detail window/overlay
    closeChatOverlay();
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (chatDetailWindow) {
        chatDetailWindow.innerHTML = `
            <div class="chat-detail-placeholder">
                <div class="placeholder-icon">💬</div>
                <p>Select a chat to view conversation</p>
            </div>
        `;
    }
    
    // Switch to chats tab
    switchChatCategory('new');
    
    // Refresh display
    renderChatList();
    updateChatCategoryCounts();
}

// Toggle Chat Lock (from Chats tab)
function toggleChatLock(chatId) {
    const state = chatStates[chatId];
    const chat = userChatsData.find(c => c.id === chatId);
    
    // Lock the chat and move to Locked tab
    state.isLocked = true;
    state.isFlagged = false;
    chat.status = 'locked';
    console.log(`🔒 Chat ${chatId} locked`);
    
    // Close the detail window/overlay
    closeChatOverlay();
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (chatDetailWindow) {
        chatDetailWindow.innerHTML = `
            <div class="chat-detail-placeholder">
                <div class="placeholder-icon">💬</div>
                <p>Select a chat to view conversation</p>
            </div>
        `;
    }
    
    // Switch to locked tab
    switchChatCategory('locked');
    
    // Refresh display
    renderChatList();
    updateChatCategoryCounts();
}

// Unlock Chat (from Locked tab - restore to Chats)
function unlockChat(chatId) {
    const state = chatStates[chatId];
    const chat = userChatsData.find(c => c.id === chatId);
    
    // Unlock and restore to Chats tab
    state.isLocked = false;
    state.isFlagged = false;
    chat.status = 'new';
    console.log(`🔓 Chat ${chatId} unlocked (restored to Chats)`);
    
    // Close the detail window/overlay
    closeChatOverlay();
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (chatDetailWindow) {
        chatDetailWindow.innerHTML = `
            <div class="chat-detail-placeholder">
                <div class="placeholder-icon">💬</div>
                <p>Select a chat to view conversation</p>
            </div>
        `;
    }
    
    // Switch to chats tab
    switchChatCategory('new');
    
    // Refresh display
    renderChatList();
    updateChatCategoryCounts();
}

// Close Chat (Delete)
function closeChat(chatId) {
    // Just close the overlay/window, don't delete
    console.log(`📕 Closing chat ${chatId} detail view`);
    
    // Close overlay if open
    closeChatOverlay();
    
    // Reset detail window
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (chatDetailWindow) {
        chatDetailWindow.innerHTML = `
            <div class="chat-detail-placeholder">
                <div class="placeholder-icon">💬</div>
                <p>Select a chat to view conversation</p>
            </div>
        `;
    }
    
    // Remove selected state from chat cards
    document.querySelectorAll('.chat-item-card').forEach(card => {
        card.classList.remove('selected');
    });
}

// Initialize Chat Category Toggle
function initializeChatCategoryToggle() {
    const categoryBtns = document.querySelectorAll('.chat-category-btn');
    
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            switchChatCategory(category);
        });
    });
}

// Switch Chat Category
function switchChatCategory(category) {
    currentChatCategory = category;
    
    // Update button states
    document.querySelectorAll('.chat-category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`)?.classList.add('active');
    
    // Clear search
    const searchInput = document.getElementById('chatSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Render filtered list
    renderChatList();
    
    // Reset detail window
    const chatDetailWindow = document.getElementById('chatDetailWindow');
    if (chatDetailWindow) {
        chatDetailWindow.innerHTML = `
            <div class="chat-detail-placeholder">
                <div class="placeholder-icon">💬</div>
                <p>Select a chat to view conversation</p>
            </div>
        `;
    }
    
    console.log(`📂 Switched to ${category} chats`);
}

// Update Chat Category Counts
function updateChatCategoryCounts() {
    const newCount = userChatsData.filter(c => chatStates[c.id].status === 'new').length;
    const flaggedCount = userChatsData.filter(c => chatStates[c.id].isFlagged).length;
    const lockedCount = userChatsData.filter(c => chatStates[c.id].isLocked).length;
    
    document.getElementById('newChatsCount').textContent = newCount;
    document.getElementById('flaggedChatsCount').textContent = flaggedCount;
    document.getElementById('lockedChatsCount').textContent = lockedCount;
}

// Initialize Chat Search
function initializeChatSearch() {
    const searchInput = document.getElementById('chatSearchInput');
    
    if (searchInput) {
        // Live search as user types
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query === '') {
                renderChatList(); // Show all if search is cleared
            } else {
                performChatSearch(query);
            }
        });
        
        console.log('✅ Chat search initialized');
    }
}

// Perform Chat Search (by gig title only)
function performChatSearch(query) {
    const chatListContainer = document.getElementById('chatListContainer');
    if (!chatListContainer) return;
    
    // Filter chats by current category first
    const filteredChats = userChatsData.filter(chat => {
        const state = chatStates[chat.id];
        let belongsToCategory = false;
        
        if (currentChatCategory === 'new') {
            belongsToCategory = state.status === 'new';
        } else if (currentChatCategory === 'flagged') {
            belongsToCategory = state.isFlagged;
        } else if (currentChatCategory === 'locked') {
            belongsToCategory = state.isLocked;
        }
        
        // Then filter by search query (gig title only)
        const matchesSearch = chat.gigTitle.toLowerCase().includes(query);
        
        return belongsToCategory && matchesSearch;
    });
    
    // Sort by date created (newest first)
    filteredChats.sort((a, b) => new Date(b.dateCreated) - new Date(a.dateCreated));
    
    // Render filtered results
    if (filteredChats.length === 0) {
        chatListContainer.innerHTML = `
            <div style="text-align: center; color: rgba(230, 214, 174, 0.5); padding: 2rem;">
                <p>No chats found matching "${query}"</p>
            </div>
        `;
    } else {
        chatListContainer.innerHTML = filteredChats.map(chat => {
            const state = chatStates[chat.id];
            const dateFormatted = new Date(chat.dateCreated).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            
            let statusBadges = '';
            if (state.isFlagged) {
                statusBadges += '<span class="chat-status-badge flagged">FLAGGED</span>';
            }
            if (state.isLocked) {
                statusBadges += '<span class="chat-status-badge locked">LOCKED</span>';
            }
            
            return `
                <div class="chat-item-card" data-chat-id="${chat.id}">
                    <div class="chat-item-header">
                        <div class="chat-gig-title">${chat.gigTitle}</div>
                        <div class="chat-item-date">${dateFormatted}</div>
                    </div>
                    <div class="chat-participants">
                        ${chat.participants.map(p => `
                            <div class="chat-participant">
                                ${p.avatar.startsWith('http') ? 
                                    `<img src="${p.avatar}" class="participant-avatar" alt="${p.name}" />` : 
                                    `<div class="participant-avatar">${p.avatar}</div>`}
                                <span>${p.name}</span>
                                <span class="participant-role ${p.role}">${p.role}</span>
                            </div>
                        `).join('')}
                    </div>
                    ${statusBadges ? `<div class="chat-status-badges">${statusBadges}</div>` : ''}
                </div>
            `;
        }).join('');
        
        // Re-attach click handlers
        const chatCards = chatListContainer.querySelectorAll('.chat-item-card');
        chatCards.forEach(card => {
            card.addEventListener('click', () => {
                const chatId = card.getAttribute('data-chat-id');
                selectChat(chatId);
            });
        });
    }
    
    console.log(`🔍 Search: "${query}" - ${filteredChats.length} results`);
}

// ===== FLOATING REPLY MODAL SYSTEM =====
function initializeReplyModal() {
    console.log('💬 Initializing Reply Modal System');
    
    const openReplyBtn = document.getElementById('openReplyBtn');
    const replyOverlay = document.getElementById('replyOverlay');
    const closeReplyModal = document.getElementById('closeReplyModal');
    const cancelReplyBtn = document.getElementById('cancelReplyBtn');
    const sendFloatingReplyBtn = document.getElementById('sendFloatingReplyBtn');
    
    // Open reply modal
    if (openReplyBtn) {
        openReplyBtn.addEventListener('click', function() {
            // Reset context for regular customer inquiry reply
            currentReplyContext = null;
            const replyModalTitle = document.querySelector('.reply-modal-title');
            if (replyModalTitle) {
                replyModalTitle.textContent = 'Reply to Customer Inquiry';
            }
            replyOverlay.classList.add('show');
            document.getElementById('floatingReplyTextarea').focus();
        });
    }
    
    // Close reply modal
    function closeModal() {
        replyOverlay.classList.remove('show');
        document.getElementById('floatingReplyTextarea').value = '';
    }
    
    if (closeReplyModal) {
        closeReplyModal.addEventListener('click', closeModal);
    }
    
    if (cancelReplyBtn) {
        cancelReplyBtn.addEventListener('click', closeModal);
    }
    
    // Close on overlay click
    replyOverlay.addEventListener('click', function(e) {
        if (e.target === replyOverlay) {
            closeModal();
        }
    });
    
    // Send reply
    if (sendFloatingReplyBtn) {
        sendFloatingReplyBtn.addEventListener('click', function() {
            const replyText = document.getElementById('floatingReplyTextarea').value.trim();
            
            if (replyText) {
                console.log('📤 Sending reply:', replyText);
                showToast('Reply sent successfully!', 'success', 2000);
                closeModal();
                
                // Update message status
                const statusBadge = document.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Replied';
                    statusBadge.className = 'status-badge replied';
                }
                
                // Mark as replied but keep in thread
                handleReplySuccess(replyText);
                
                // Refresh the message view to show the new reply in the thread
                const activeMessage = document.querySelector('.customer-message-item.selected');
                if (activeMessage) {
                    setTimeout(() => {
                        activeMessage.click();
                    }, 300);
                }
            } else {
                alert('Please enter a reply message.');
            }
        });
    }
    
    // File attachment handling
    const attachmentInput = document.getElementById('floatingReplyAttachment');
    if (attachmentInput) {
        attachmentInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                console.log('📎 Attachment selected:', file.name);
                // Handle file preview here
            }
        });
    }
    
    console.log('✅ Reply Modal System initialized');
}

// ===== MESSAGES PAGINATION SYSTEM =====
// No real pagination source is wired yet -- "Load More" stays hidden until
// the admin support inbox reads from Firestore (support_requests) with a
// real cursor to page through.
function initializeMessagesPagination() {
    console.log('Initializing Messages Pagination');

    const loadMoreBtn = document.getElementById('loadMoreMessagesBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
    }

    // Update initial stats
    updateMessagesStats();

    console.log('Messages Pagination initialized');
}

function appendMessagesToList(messages) {
    const messagesList = document.getElementById('customerMessagesList');
    
    messages.forEach(msg => {
        // Initialize message state for new messages
        if (!messageStates[msg.id]) {
            messageStates[msg.id] = {
                status: 'new', // New messages default to 'new' status
                isReplied: false,
                isRead: false
            };
            console.log('📧 Initialized state for new message:', msg.id);
        }
        
        const topicClass = msg.topic.replace(/[^a-z-]/gi, '');
        const topicName = msg.topic.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        
        const messageHTML = `
            <div class="customer-message-item" data-message-id="${msg.id}" data-topic="${msg.topic}">
                <div class="message-topic ${topicClass}">${topicName}</div>
                <div class="message-content-area">
                    <div class="message-header">
                        <div class="message-sender">
                            <img src="${msg.sender.avatar}" alt="${msg.sender.name}" class="sender-avatar">
                            <div class="sender-info">
                                <div class="sender-name">${msg.sender.name}</div>
                                <div class="sender-email">${msg.sender.email}</div>
                            </div>
                        </div>
                        <div class="message-meta">
                            <div class="message-time">${msg.time}</div>
                            ${msg.hasAttachment ? '<div class="message-attachment" title="Has photo attachment">🖼️</div>' : ''}
                        </div>
                    </div>
                    <div class="message-preview">
                        <div class="message-subject">${msg.subject}</div>
                        <div class="message-excerpt">${msg.excerpt}</div>
                    </div>
                </div>
            </div>
        `;
        
        messagesList.insertAdjacentHTML('beforeend', messageHTML);
    });
    
    // Re-initialize click handlers for new messages
    initializeCustomerMessages();
}

function updateMessagesStats() {
    const messagesStats = document.getElementById('messagesStats');
    if (!messagesStats) return;

    // No real total-count source is wired yet -- report what's actually
    // rendered instead of a fabricated grand total.
    const messagesLoaded = document.querySelectorAll('.customer-message-item').length;
    messagesStats.textContent = `Showing ${messagesLoaded} message${messagesLoaded === 1 ? '' : 's'}`;
}

// ===== INBOX TOGGLE SYSTEM =====
let currentInboxType = 'new';
let messageStates = {}; // Track message states

function initializeInboxToggle() {
    console.log('📧 Initializing Inbox Toggle System');
    
    const newBtn = document.getElementById('newInboxBtn');
    const oldBtn = document.getElementById('oldInboxBtn');
    const sentBtn = document.getElementById('sentInboxBtn');
    const closeBtn = document.getElementById('closeMessageBtn');
    
    // Initialize message states for existing messages
    initializeMessageStates();
    
    // Handle inbox toggle
    if (newBtn) {
        newBtn.addEventListener('click', () => switchInbox('new'));
    }
    
    if (oldBtn) {
        oldBtn.addEventListener('click', () => switchInbox('old'));
    }
    
    if (sentBtn) {
        sentBtn.addEventListener('click', () => switchInbox('sent'));
    }
    
    // Handle close message button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCurrentMessage);
    }
    
    // Update counts on initial load
    updateInboxCount();
    
    // Apply initial filter to show only NEW messages on page load
    filterMessagesByInboxType('new');
    
    console.log('✅ Inbox Toggle System initialized');
}

function initializeMessageStates() {
    const messages = document.querySelectorAll('.customer-message-item');
    messages.forEach(message => {
        const messageId = message.getAttribute('data-message-id');
        if (!messageStates[messageId]) {
            // Check if it's a public message (sent message)
            const isPublicMessage = messageId.startsWith('pub_');
            messageStates[messageId] = {
                status: isPublicMessage ? 'sent' : 'new',
                isReplied: false,
                isRead: isPublicMessage ? true : false
            };
        }
    });
}

function switchInbox(type) {
    currentInboxType = type;
    
    // Update button states
    document.getElementById('newInboxBtn').classList.toggle('active', type === 'new');
    document.getElementById('oldInboxBtn').classList.toggle('active', type === 'old');
    document.getElementById('sentInboxBtn').classList.toggle('active', type === 'sent');
    
    // Clear any selected message
    const selectedMessages = document.querySelectorAll('.customer-message-item.selected');
    selectedMessages.forEach(msg => msg.classList.remove('selected'));
    
    // Clear search input when switching tabs
    const searchInput = document.getElementById('messagesSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Restore original HTML structure if it was replaced by SENT message
    restoreOriginalMessageHTML();
    
    // Reset message panels to default state
    const messageDetail = document.getElementById('messageDetail');
    const messageContent = document.getElementById('messageContent');
    if (messageDetail) messageDetail.style.display = 'block';
    if (messageContent) {
        messageContent.style.display = 'none';
    }
    
    // Filter messages based on type
    filterMessagesByInboxType(type);
    
    // Update inbox count
    updateInboxCount();
    
    // Reset scroll position to top AFTER filtering (using setTimeout to ensure DOM is updated)
    setTimeout(() => {
        const messagesListContainer = document.querySelector('.messages-list-container');
        if (messagesListContainer) {
            messagesListContainer.scrollTop = 0;
        }
    }, 0);
    
    console.log('📧 Switched to', type, 'inbox');
}

function filterMessagesByInboxType(type) {
    const messages = document.querySelectorAll('.customer-message-item');
    
    messages.forEach(message => {
        const messageId = message.getAttribute('data-message-id');
        let messageState = messageStates[messageId];
        
        // Create default state if it doesn't exist (for dynamically loaded messages)
        if (!messageState) {
            messageStates[messageId] = {
                status: 'new', // Default to 'new' for dynamically loaded messages
                isReplied: false,
                isRead: false
            };
            messageState = messageStates[messageId];
            console.log('📧 Created default state for message:', messageId);
        }
        
        if (type === 'new') {
            // Show new/unread messages
            message.style.display = messageState.status === 'new' ? 'block' : 'none';
        } else if (type === 'old') {
            // Show old/replied/closed messages
            message.style.display = messageState.status === 'old' ? 'block' : 'none';
        } else if (type === 'sent') {
            // Show sent public messages only
            message.style.display = messageState.status === 'sent' ? 'block' : 'none';
        }
    });
}

function closeCurrentMessage() {
    const activeMessage = document.querySelector('.customer-message-item.selected');
    if (activeMessage) {
        const messageId = activeMessage.getAttribute('data-message-id');
        closeMessageDirectly(messageId);
        
        // Remove selection
        activeMessage.classList.remove('selected');
    }
}

function closeMessageDirectly(messageId) {
    console.log('📧 Closing message directly:', messageId);
    
    // Ensure message state exists
    if (!messageStates[messageId]) {
        messageStates[messageId] = {
            status: 'new',
            isReplied: false,
            isRead: false
        };
    }
    
    const previousStatus = messageStates[messageId].status;
    
    // Only move NEW messages to OLD - keep SENT and OLD as they are
    if (previousStatus === 'new') {
        messageStates[messageId].status = 'old';
    }
    // If status is 'old' or 'sent', it stays the same
    
    // Hide message detail panels (for desktop view)
    const messageDetail = document.getElementById('messageDetail');
    const messageContent = document.getElementById('messageContent');
    if (messageDetail) messageDetail.style.display = 'block';
    if (messageContent) messageContent.style.display = 'none';
    
    // Refresh current view
    filterMessagesByInboxType(currentInboxType);
    updateInboxCount();
    
    // Only show toast when moving NEW messages to OLD
    if (previousStatus === 'new') {
        console.log('📧 Message moved to old inbox:', messageId);
        showToast('Message moved to Old inbox');
    } else {
        console.log('📧 Message closed (status unchanged):', messageId);
        // No toast for OLD or SENT messages
    }
}

function markMessageAsReplied(messageId, replyContent = '') {
    if (messageStates[messageId]) {
        // Admin reply becomes part of the thread - message stays in current inbox
        messageStates[messageId].isReplied = true;
        messageStates[messageId].lastActivity = 'admin_reply';
        messageStates[messageId].lastReplyTime = new Date().toISOString();
        
        // Store reply content for threading (in real app, this would go to backend)
        if (!messageStates[messageId].replies) {
            messageStates[messageId].replies = [];
        }
        
        if (replyContent) {
            messageStates[messageId].replies.push({
                type: 'admin_reply',
                content: replyContent,
                timestamp: new Date().toISOString(),
                author: 'Admin'
            });
            console.log('📧 Admin reply added to thread:', messageId, '- Reply stored');
        }
        
        // Don't move to old - keep in current location for threaded conversation
        console.log('📧 Admin replied to message - thread continues:', messageId);
    }
}

function markMessageAsNewFromUser(messageId) {
    // This would be called when user replies back to admin
    if (messageStates[messageId]) {
        messageStates[messageId].status = 'new';
        
        // Refresh current view if on new inbox
        if (currentInboxType === 'new') {
            filterMessagesByInboxType('new');
        }
        updateInboxCount();
        
        console.log('📧 Message moved back to new inbox:', messageId);
    }
}

function updateInboxCount() {
    const newCount = Object.values(messageStates).filter(state => state.status === 'new').length;
    const oldCount = Object.values(messageStates).filter(state => state.status === 'old').length;
    const sentCount = Object.values(messageStates).filter(state => state.status === 'sent').length;
    
    const newCountElement = document.getElementById('newCountLabel');
    const oldCountElement = document.getElementById('oldCountLabel');
    const sentCountElement = document.getElementById('sentCountLabel');
    
    if (newCountElement) {
        newCountElement.textContent = formatCount(newCount);
    }
    if (oldCountElement) {
        oldCountElement.textContent = formatCount(oldCount);
    }
    if (sentCountElement) {
        sentCountElement.textContent = formatCount(sentCount);
    }
    
    // Also update the navigation panel badge
    updateNavigationMessageBadge(newCount);
}

// Update the Messages navigation badge to reflect current new message count
function updateNavigationMessageBadge(count) {
    const navBadge = document.querySelector('.menu-item[data-section="messages"] .menu-notification-badge');
    if (navBadge) {
        navBadge.textContent = count;
        
        // Hide badge if count is 0
        if (count === 0) {
            navBadge.style.display = 'none';
        } else {
            navBadge.style.display = 'inline-flex';
        }
    }
}

function formatCount(count) {
    if (count >= 1000) {
        const thousands = Math.floor(count / 1000);
        const remainder = count % 1000;
        
        if (remainder === 0) {
            return `${thousands}K+`;
        } else {
            // Show one decimal place if needed (e.g., 1.2K)
            return `${(count / 1000).toFixed(1)}K+`;
        }
    } else if (count >= 100) {
        return '100+';
    }
    
    return count.toString();
}

// Update the existing reply success handler
function handleReplySuccess(replyContent = '') {
    const activeMessage = document.querySelector('.customer-message-item.selected');
    if (activeMessage) {
        const messageId = activeMessage.getAttribute('data-message-id');
        markMessageAsReplied(messageId, replyContent);
    }
}

// ===== PUBLIC MESSAGE COMPOSE OVERLAY =====
/*
=== FIREBASE INTEGRATION: ADMIN MESSAGING SYSTEMS ===

Two distinct messaging systems with unified backend structure:

1. COMPOSE PUBLIC MESSAGE (Messages Section)
   - messageType: "public"
   - Broadcasts to ALL users
   - Uses category field: "important-notices" | "platform-updates" | "system-updates" | "promotions"
   - Firestore Collection: adminMessages
   - Target audience: "all" | "customers" | "workers" | "verified-only"

2. CONTACT USER (User Management)
   - messageType: "direct"
   - Sends to INDIVIDUAL user
   - Uses topic field: "account-verification" | "account-suspension" | "policy-violation" | etc.
   - Firestore Collection: adminMessages (same collection, different messageType)
   - Target: specific userId

Unified Firestore Document Structure:
{
  messageId: auto-generated,
  messageType: "public" | "direct",
  
  // Common fields
  from: {
    adminId: currentUser.uid,
    adminName: "Peter J. Ang",
    adminEmail: "admin@gisugo.com",
    role: "admin"
  },
  subject: string,
  content: string,
  timestamp: Firestore.Timestamp.now(),
  attachments: [],
  isRead: false,
  readAt: null,
  
  // Public-specific
  category: string (only if messageType === "public"),
  targetAudience: "all" | "customers" | "workers" (only if messageType === "public"),
  
  // Direct-specific
  to: {
    userId: string,
    userName: string,
    userEmail: string
  } (only if messageType === "direct"),
  topic: string (only if messageType === "direct"),
  priority: "normal" | "high" | "urgent" (only if messageType === "direct")
}

Firestore Security Rules:
- Public messages: readable by all authenticated users
- Direct messages: readable only by to.userId
- Only admins can write to this collection

User-side queries (messages.html):
- Public: adminMessages.where('messageType', '==', 'public')
- Direct: adminMessages.where('messageType', '==', 'direct').where('to.userId', '==', currentUserId)
- Combined: Client-side merge or composite query

Visual distinction in messages.html:
- 📢 icon + blue badge for PUBLIC broadcasts
- 📨 icon + green badge for DIRECT messages
- Left border color coding
*/

function initializePublicMessageOverlay() {
    console.log('📧 Initializing Public Message Overlay');
    
    const composeBtn = document.getElementById('composePublicMessageBtn');
    const overlay = document.getElementById('publicMessageOverlay');
    const closeBtn = document.getElementById('closePublicMessageModal');
    const cancelBtn = document.getElementById('cancelPublicMessageBtn');
    const sendBtn = document.getElementById('sendPublicMessageBtn');
    const categorySelect = document.getElementById('publicCategorySelect');
    const subjectInput = document.getElementById('publicSubjectInput');
    const messageTextarea = document.getElementById('publicMessageTextarea');
    const subjectCharCounter = document.getElementById('subjectCharCounter');
    const messageCharCounter = document.getElementById('messageCharCounter');
    
    // Open overlay
    if (composeBtn) {
        composeBtn.addEventListener('click', () => {
            overlay.classList.add('show');
            console.log('📧 Public message overlay opened');
        });
    }
    
    // Close overlay
    const closeOverlay = () => {
        overlay.classList.remove('show');
        resetPublicMessageForm();
        console.log('📧 Public message overlay closed');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);
    
    // Close on background click
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeOverlay();
            }
        });
    }
    
    // Character counters
    if (subjectInput && subjectCharCounter) {
        subjectInput.addEventListener('input', () => {
            const count = subjectInput.value.length;
            subjectCharCounter.textContent = `${count}/100`;
        });
    }
    
    if (messageTextarea && messageCharCounter) {
        messageTextarea.addEventListener('input', () => {
            const count = messageTextarea.value.length;
            messageCharCounter.textContent = `${count}/1000`;
        });
    }
    
    // Send public message
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const category = categorySelect.value;
            const subject = subjectInput.value.trim();
            const message = messageTextarea.value.trim();
            
            // Validation
            if (!category) {
                showToast('Please select a message category', 'error');
                return;
            }
            
            if (!subject) {
                showToast('Please enter a message subject', 'error');
                return;
            }
            
            if (!message) {
                showToast('Please enter a message', 'error');
                return;
            }
            
            // Send public message
            sendPublicMessage(category, subject, message);
            closeOverlay();
        });
    }
    
    console.log('✅ Public Message Overlay initialized');
}

function resetPublicMessageForm() {
    const categorySelect = document.getElementById('publicCategorySelect');
    const subjectInput = document.getElementById('publicSubjectInput');
    const messageTextarea = document.getElementById('publicMessageTextarea');
    const subjectCharCounter = document.getElementById('subjectCharCounter');
    const messageCharCounter = document.getElementById('messageCharCounter');
    
    if (categorySelect) categorySelect.value = '';
    if (subjectInput) subjectInput.value = '';
    if (messageTextarea) messageTextarea.value = '';
    if (subjectCharCounter) subjectCharCounter.textContent = '0/100';
    if (messageCharCounter) messageCharCounter.textContent = '0/1000';
}

// ===== TEXT FORMATTING UTILITIES =====
function formatMessageText(text) {
    // Convert plain text to HTML with basic formatting
    // Note: Since users can only type ** and * (no < or >), we don't need to escape HTML
    
    let formatted = text;
    
    // 1. Convert **bold** to <strong>
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Convert *italic* to <em>
    formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // 3. Convert ALL newlines to <br> tags (preserves all line breaks)
    formatted = formatted.replace(/\n/g, '<br>');
    
    // 4. Wrap in paragraph tag
    return `<p>${formatted}</p>`;
}

function sendPublicMessage(category, subject, message) {
    console.log('📧 Sending public message:', { category, subject, message });
    
    // Generate unique message ID
    const messageId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const timeAgo = 'Just now';
    
    // Format message text with HTML
    const formattedMessage = formatMessageText(message);
    
    // Create sent message data
    const sentMessage = {
        id: messageId,
        category: category,
        subject: subject,
        message: formattedMessage, // Use formatted HTML
        timestamp: timestamp,
        timeAgo: timeAgo,
        recipients: 'All Users',
        status: 'sent'
    };
    
    // Store the full message data for retrieval
    sentPublicMessages[messageId] = {
        category: category,
        subject: subject,
        message: formattedMessage, // Store formatted version
        recipients: 'All Users'
    };
    
    // Add to sent messages list
    addSentMessageToList(sentMessage);
    
    // Update message states
    messageStates[messageId] = {
        status: 'sent',
        isRead: true,
        isReplied: false
    };
    
    // Update inbox counts
    updateInboxCount();
    
    // Show success message
    showToast(`Public message sent to all users: "${subject}"`, 'success', 3000);
    
    console.log('✅ Public message sent successfully:', messageId);
}

function addSentMessageToList(sentMessage) {
    const messagesList = document.getElementById('customerMessagesList');
    if (!messagesList) return;
    
    // Get category emoji and label
    const categoryInfo = getCategoryInfo(sentMessage.category);
    
    // Create message HTML
    const messageHTML = `
        <div class="customer-message-item" data-message-id="${sentMessage.id}" data-topic="public-message">
            <div class="message-topic ${sentMessage.category}">${categoryInfo.emoji} ${categoryInfo.label}</div>
            <div class="message-content-area">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar" style="background: #10b981; color: white; font-weight: 600; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%;">
                            📢
                        </div>
                        <div class="sender-info">
                            <div class="sender-name">Public Announcement</div>
                            <div class="sender-email">${sentMessage.recipients}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="message-time">${sentMessage.timeAgo}</div>
                    </div>
                </div>
                <div class="message-preview">
                    <div class="message-subject">${sentMessage.subject}</div>
                    <div class="message-excerpt">${sentMessage.message.substring(0, 100)}${sentMessage.message.length > 100 ? '...' : ''}</div>
                </div>
            </div>
        </div>
    `;
    
    // Add to top of list
    messagesList.insertAdjacentHTML('afterbegin', messageHTML);
    
    // The click handler will be handled by the event delegation in initializeCustomerMessages()
    // No need to add individual click handlers here
    
    console.log('📧 Sent message added to list:', sentMessage.id);
}

function getCategoryInfo(category) {
    const categories = {
        'important-notices': { emoji: '🔴', label: 'Important Notices' },
        'platform-updates': { emoji: '🔵', label: 'Platform Updates' },
        'system-updates': { emoji: '⚙️', label: 'System Updates' },
        'promotions': { emoji: '🎁', label: 'Promotions' }
    };
    
    return categories[category] || { emoji: '📢', label: 'Public Message' };
}

function showPublicMessageDetail(sentMessage) {
    const categoryInfo = getCategoryInfo(sentMessage.category);
    const messageContent = document.getElementById('messageContent');
    const messageDetail = document.getElementById('messageDetail');
    
    // Store original HTML before replacing it
    storeOriginalMessageHTML();
    
    // Clear previous selection
    const previouslySelected = document.querySelector('.customer-message-item.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }
    
    // Mark the current message as selected
    const currentMessage = document.querySelector(`[data-message-id="${sentMessage.id}"]`);
    if (currentMessage) {
        currentMessage.classList.add('selected');
    }
    
    if (messageContent) {
        messageContent.innerHTML = `
            <div class="message-detail-header sent-message-header">
                <div class="sent-header-row-1">
                    <div class="message-detail-topic ${sentMessage.category}">${categoryInfo.emoji} ${categoryInfo.label}</div>
                    <div class="detail-actions">
                        <button class="message-action-btn reply-btn" id="replySentMessageBtn">Reply</button>
                        <button class="message-action-btn close-btn" id="closeSentMessageBtn">Close</button>
                    </div>
                </div>
                <div class="sent-header-row-2">
                    <span class="message-detail-time">${sentMessage.timeAgo}</span>
                </div>
            </div>
            <div class="message-detail-sender">
                <div class="sender-avatar-large" style="background: #10b981; color: white; font-weight: 600; display: flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; font-size: 1.5rem;">
                    📢
                </div>
                <div class="sender-detail-info">
                    <h3 class="sender-detail-name">Public Announcement</h3>
                    <p class="sender-detail-email">${sentMessage.recipients}</p>
                </div>
            </div>
            <div class="message-detail-subject">
                <h2>${sentMessage.subject}</h2>
            </div>
            <div class="message-detail-body">
                ${sentMessage.message}
                ${generateReplyThreadHTML(sentMessage.id)}
            </div>
            <div class="message-actions">
                <button class="message-action-btn unsend-btn" onclick="unsendPublicMessage('${sentMessage.id}')">
                    🗑️ Unsend Message
                </button>
            </div>
        `;
        
        messageContent.style.display = 'block';
        if (messageDetail) {
            messageDetail.style.display = 'none';
        }
        
        // Attach reply button handler
        const replyBtn = document.getElementById('replySentMessageBtn');
        if (replyBtn) {
            replyBtn.addEventListener('click', function() {
                openPublicMessageReplyForm(sentMessage);
            });
        }
        
        // Attach close button handler
        const closeSentBtn = document.getElementById('closeSentMessageBtn');
        if (closeSentBtn) {
            closeSentBtn.addEventListener('click', function() {
                // Clear selection
                const selectedMessage = document.querySelector('.customer-message-item.selected');
                if (selectedMessage) {
                    selectedMessage.classList.remove('selected');
                }
                
                // Restore original HTML structure
                restoreOriginalMessageHTML();
                
                // Hide message content and show message detail placeholder
                messageContent.style.display = 'none';
                if (messageDetail) {
                    messageDetail.style.display = 'block';
                }
                
                console.log('📧 Sent message closed');
            });
        }
    }
}

function showPublicMessageOverlay(sentMessage) {
    const overlay = document.getElementById('messageDetailOverlay');
    const overlayBody = overlay.querySelector('.overlay-body');
    
    if (!overlay || !overlayBody) {
        console.error('❌ Overlay elements not found');
        return;
    }
    
    // Store message ID for tracking
    overlay.dataset.messageId = sentMessage.id;
    
    // Generate public message overlay content
    const categoryInfo = getCategoryInfo(sentMessage.category);
    
    overlayBody.innerHTML = `
        <div class="message-detail-header">
            <div class="overlay-header-layout">
                <div class="sender-avatar-large" style="background: #10b981; color: white; font-weight: 600; display: flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 50%; font-size: 1.5rem;">
                    📢
                </div>
                <div class="overlay-sender-details">
                    <div class="overlay-name-row">
                        <h3 class="detail-sender-name">Public Announcement</h3>
                    </div>
                    <div class="overlay-email-time-row">
                        <p class="detail-sender-email">${sentMessage.recipients}</p>
                        <span class="detail-timestamp">${sentMessage.timeAgo}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="message-detail-body">
            <h2 class="detail-subject overlay-subject">${sentMessage.subject}</h2>
            <div class="message-content-inner">
                ${sentMessage.message}
                ${generateReplyThreadHTML(sentMessage.id)}
            </div>
            <div class="message-actions">
                <button class="message-action-btn unsend-btn" onclick="unsendPublicMessage('${sentMessage.id}')">
                    🗑️ Unsend Message
                </button>
            </div>
        </div>
    `;
    
    // Show overlay
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Public message overlay displayed');
}

// Store the message ID to be unsent
let messageIdToUnsend = null;

window.unsendPublicMessage = function(messageId) {
    // Store the message ID for the confirmation handler
    messageIdToUnsend = messageId;
    
    // Show confirmation overlay
    const confirmOverlay = document.getElementById('unsendMessageConfirmOverlay');
    if (confirmOverlay) {
        confirmOverlay.style.display = 'flex';
        confirmOverlay.style.visibility = 'visible';
        confirmOverlay.style.opacity = '1';
    }
};

function confirmUnsendMessage() {
    if (!messageIdToUnsend) return;
    
    const messageElement = document.querySelector(`[data-message-id="${messageIdToUnsend}"]`);
    if (messageElement) {
        messageElement.remove();
        delete messageStates[messageIdToUnsend];
        delete sentPublicMessages[messageIdToUnsend]; // Remove from storage
        showToast('Public message unsent successfully', 'success');
        
        // Clear message content for desktop
        const messageContent = document.getElementById('messageContent');
        const messageDetail = document.getElementById('messageDetail');
        
        if (messageContent) {
            restoreOriginalMessageHTML();
            messageContent.style.display = 'none';
        }
        if (messageDetail) {
            messageDetail.style.display = 'block';
        }
        
        // Close overlay if open
        const overlay = document.getElementById('messageDetailOverlay');
        if (overlay && overlay.style.display === 'flex') {
            hideMessageOverlay();
        }
        
        // Update inbox count
        updateInboxCount();
        
        console.log('🗑️ Public message unsent:', messageIdToUnsend);
    }
    
    // Hide confirmation overlay
    hideUnsendConfirmOverlay();
    messageIdToUnsend = null;
}

function hideUnsendConfirmOverlay() {
    const confirmOverlay = document.getElementById('unsendMessageConfirmOverlay');
    if (confirmOverlay) {
        confirmOverlay.style.opacity = '0';
        confirmOverlay.style.visibility = 'hidden';
        setTimeout(() => {
            confirmOverlay.style.display = 'none';
        }, 300);
    }
}

function initializeUnsendConfirmation() {
    const confirmBtn = document.getElementById('confirmUnsendMessageBtn');
    const cancelBtn = document.getElementById('cancelUnsendMessageBtn');
    const confirmOverlay = document.getElementById('unsendMessageConfirmOverlay');
    
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmUnsendMessage);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideUnsendConfirmOverlay);
    }
    
    // Close on outside click
    if (confirmOverlay) {
        confirmOverlay.addEventListener('click', function(e) {
            if (e.target === confirmOverlay) {
                hideUnsendConfirmOverlay();
            }
        });
    }
    
    console.log('✅ Unsend confirmation overlay initialized');
}

// Store reply context
let currentReplyContext = null;

// Store original message content HTML to restore after SENT messages
let originalMessageContentHTML = null;

function storeOriginalMessageHTML() {
    if (!originalMessageContentHTML) {
        const messageContent = document.getElementById('messageContent');
        if (messageContent) {
            originalMessageContentHTML = messageContent.innerHTML;
        }
    }
}

function restoreOriginalMessageHTML() {
    if (originalMessageContentHTML) {
        const messageContent = document.getElementById('messageContent');
        if (messageContent) {
            messageContent.innerHTML = originalMessageContentHTML;
            
            // Re-attach event listeners after restoring HTML
            const openReplyBtn = document.getElementById('openReplyBtn');
            const closeBtn = document.getElementById('closeMessageBtn');
            
            if (openReplyBtn) {
                openReplyBtn.addEventListener('click', function() {
                    // Reset context for regular customer inquiry reply
                    currentReplyContext = null;
                    const replyModalTitle = document.querySelector('.reply-modal-title');
                    if (replyModalTitle) {
                        replyModalTitle.textContent = 'Reply to Customer Inquiry';
                    }
                    const replyOverlay = document.getElementById('replyOverlay');
                    if (replyOverlay) {
                        replyOverlay.classList.add('show');
                        document.getElementById('floatingReplyTextarea')?.focus();
                    }
                });
            }
            
            if (closeBtn) {
                closeBtn.addEventListener('click', closeCurrentMessage);
            }
        }
    }
}

function openPublicMessageReplyForm(sentMessage) {
    const replyOverlay = document.getElementById('replyOverlay');
    const replyModalTitle = document.querySelector('.reply-modal-title');
    const replyTextarea = document.getElementById('floatingReplyTextarea');
    
    if (replyOverlay && replyModalTitle) {
        // Set context for follow-up message
        currentReplyContext = {
            type: 'follow-up',
            originalMessageId: sentMessage.id,
            originalSubject: sentMessage.subject,
            category: sentMessage.category
        };
        
        // Update modal title
        replyModalTitle.textContent = 'Post Follow Up Message';
        
        // Open reply modal
        replyOverlay.classList.add('show');
        if (replyTextarea) {
            replyTextarea.focus();
        }
        
        console.log('📤 Follow-up message composer opened for:', sentMessage.id);
    }
}

// ===== INBOX SEARCH SYSTEM =====
function initializeInboxSearch() {
    const searchInput = document.getElementById('messagesSearchInput');
    const searchBtn = document.getElementById('messagesSearchBtn');
    
    if (searchInput) {
        // Search on button click (if button exists)
        if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            performInboxSearch(searchInput.value.trim());
        });
        }
        
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performInboxSearch(searchInput.value.trim());
            }
        });
        
        // Live search as user types
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query === '') {
                clearInboxSearch();
            } else {
                performInboxSearch(query);
            }
        });
        
        console.log('✅ Inbox search initialized');
    }
}

function performInboxSearch(query) {
    // TODO: BACKEND INTEGRATION - When implementing Firebase:
    // 1. Query Firebase for matching messages in current inbox type
    // 2. Return all results (not just lazy-loaded ones)
    // 3. Clear messagesList and populate with search results
    // 4. Handle pagination for large result sets
    
    // CURRENT: Search only DOM-loaded messages (fine for prototype)
    const messageItems = document.querySelectorAll('.customer-message-item');
    let visibleCount = 0;
    
    if (!query) {
        clearInboxSearch();
        return;
    }
    
    messageItems.forEach(item => {
        const messageId = item.getAttribute('data-message-id');
        const messageState = messageStates[messageId];
        
        // Check if message belongs to current inbox type
        const belongsToCurrentInbox = messageState && messageState.status === currentInboxType;
        
        if (!belongsToCurrentInbox) {
            item.style.display = 'none';
            return;
        }
        
        // Search within message content
        const senderName = item.querySelector('.sender-name')?.textContent.toLowerCase() || '';
        const senderEmail = item.querySelector('.sender-email')?.textContent.toLowerCase() || '';
        const subject = item.querySelector('.message-subject')?.textContent.toLowerCase() || '';
        const excerpt = item.querySelector('.message-excerpt')?.textContent.toLowerCase() || '';
        const topic = item.querySelector('.message-topic')?.textContent.toLowerCase() || '';
        
        const searchText = `${senderName} ${senderEmail} ${subject} ${excerpt} ${topic}`.toLowerCase();
        const matches = searchText.includes(query.toLowerCase());
        
        if (matches) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Update search feedback
    updateSearchFeedback(query, visibleCount);
    console.log(`🔍 Search in ${currentInboxType.toUpperCase()} inbox for "${query}" found ${visibleCount} results`);
}

function clearInboxSearch() {
    // Restore the current inbox filter instead of showing all messages
    filterMessagesByInboxType(currentInboxType);
    
    // Count visible messages in current inbox
    const visibleCount = Object.values(messageStates).filter(state => state.status === currentInboxType).length;
    
    // Clear search feedback
    updateSearchFeedback('', visibleCount);
    console.log(`🔍 Search cleared - showing ${currentInboxType.toUpperCase()} inbox (${visibleCount} messages)`);
}

function updateSearchFeedback(query, resultCount) {
    // Add search feedback near the search bar if needed
    // For now, just update console logs
    if (query && resultCount === 0) {
        console.log(`🔍 No messages found for "${query}"`);
    }
}

// ===== MESSAGE OVERLAY SYSTEM =====
function initializeMessageOverlay() {
    const overlay = document.getElementById('messageDetailOverlay');
    const overlayCloseBtn = document.getElementById('overlayCloseBtn');
    const overlayReplyBtn = document.getElementById('overlayReplyBtn');
    const overlayArchiveBtn = document.getElementById('overlayArchiveBtn');
    
    // Ensure overlay starts hidden
    if (overlay) {
        overlay.style.display = 'none';
        console.log('✅ Message overlay initialized and hidden');
    }
    
    // Close overlay will be handled by global event delegation below
    // (Removed direct binding to prevent conflicts)
    
    // Close overlay when clicking outside content
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                hideMessageOverlay();
            }
        });
    }
    
    // Use event delegation for overlay buttons since they're added dynamically
    document.addEventListener('click', (e) => {
        
        // Close button in overlay (X button)
        if (e.target.id === 'overlayCloseBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Overlay X button clicked');
            hideMessageOverlay();
        }
        
        // Reply button in overlay
        if (e.target.id === 'overlayReplyBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Overlay Reply button clicked');
            
            // Check if this is a follow-up reply from overlay
            const overlay = document.getElementById('messageDetailOverlay');
            const currentMessageId = overlay?.dataset.messageId;
            
            // Check if it's a public message (sent message)
            if (currentMessageId && currentMessageId.startsWith('pub_')) {
                // Get the sent message data
                const messageElement = document.querySelector(`[data-message-id="${currentMessageId}"]`);
                if (messageElement) {
                    const sentMessage = {
                        id: currentMessageId,
                        category: getCategoryFromTopic(messageElement),
                        subject: messageElement.querySelector('.message-subject').textContent
                    };
                    openPublicMessageReplyForm(sentMessage);
                }
            } else {
                // Regular customer inquiry reply
                const replyOverlay = document.getElementById('replyOverlay');
                const replyModalTitle = document.querySelector('.reply-modal-title');
                if (replyOverlay) {
                    // Reset context for regular reply
                    currentReplyContext = null;
                    if (replyModalTitle) {
                        replyModalTitle.textContent = 'Reply to Customer Inquiry';
                    }
                    replyOverlay.classList.add('show');
                    document.getElementById('floatingReplyTextarea')?.focus();
                    console.log('📤 Reply modal opened from overlay');
                } else {
                    console.error('❌ Reply overlay not found');
                }
            }
        }
        
        // Archive button in overlay (Close button that moves to Old)
        if (e.target.id === 'overlayArchiveBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Overlay Archive/Close button clicked');
            const overlay = document.getElementById('messageDetailOverlay');
            const currentMessageId = overlay?.dataset.messageId;
            console.log('📋 Current message ID:', currentMessageId);
            if (currentMessageId) {
                // Try to close using the existing function first
                const activeMessage = document.querySelector('.customer-message-item.selected');
                if (activeMessage) {
                    console.log('✅ Found selected message, using closeCurrentMessage()');
                    closeCurrentMessage();
                } else {
                    // Fallback: close using the overlay's message ID directly
                    console.log('⚠️ No selected message found, using direct close method');
                    closeMessageDirectly(currentMessageId);
                }
                hideMessageOverlay();
                console.log('📁 Message closed from overlay');
            } else {
                console.error('❌ No message ID found for overlay');
                // Still hide the overlay
                hideMessageOverlay();
            }
        }
    });
    
    console.log('✅ Overlay system ready - existing handlers will route correctly');
}

function showMessageOverlay(messageId) {
    console.log(`🔍 showMessageOverlay called with messageId: ${messageId}`);
    
    const overlay = document.getElementById('messageDetailOverlay');
    const overlayBody = overlay.querySelector('.overlay-body');
    
    console.log('🔍 Overlay element found:', !!overlay);
    console.log('🔍 Overlay body found:', !!overlayBody);
    
    if (!overlay || !overlayBody) {
        console.error('❌ Overlay elements not found', {overlay, overlayBody});
        return;
    }
    
    console.log(`📱 Showing overlay for message ${messageId} at ${window.innerWidth}px`);
    
    // Set message ID
    overlay.dataset.messageId = messageId;
    
    // Populate overlay content
    const messageContent = generateMessageDetailContent(messageId);
    console.log('🔍 Generated content length:', messageContent.length);
    overlayBody.innerHTML = messageContent;
    
    // Show overlay
    overlay.style.display = 'flex';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '1';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Overlay should now be visible');
}

function hideMessageOverlay() {
    const overlay = document.getElementById('messageDetailOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        overlay.dataset.messageId = '';
    }
}


function generateMessageDetailContent(messageId) {
    // Find the message element in the DOM to extract data (same as desktop version)
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    
    if (!messageElement) {
        return '<p>Message not found</p>';
    }
    
    // Extract data from DOM elements (same way as desktop)
    const senderName = messageElement.querySelector('.sender-name')?.textContent || 'Unknown Sender';
    const senderEmail = messageElement.querySelector('.sender-email')?.textContent || 'unknown@email.com';
    const senderAvatar = messageElement.querySelector('.sender-avatar')?.src || 'public/users/User-02.jpg';
    const subject = messageElement.querySelector('.message-subject')?.textContent || 'No Subject';
    const timestamp = messageElement.querySelector('.message-time')?.textContent || '';
    const hasAttachment = messageElement.querySelector('.message-attachment') !== null;
    const fullContent = getFullMessageContent(messageId);
    const replyThreadHTML = generateReplyThreadHTML(messageId);
    
    return `
        <div class="message-detail-header">
            <div class="overlay-header-layout">
                <img src="${senderAvatar}" alt="User Avatar" class="overlay-avatar">
                <div class="overlay-sender-details">
                    <div class="overlay-name-row">
                        <h3 class="detail-sender-name">${senderName}</h3>
                    </div>
                    <div class="overlay-email-time-row">
                        <p class="detail-sender-email">${senderEmail}</p>
                        <span class="detail-timestamp">${timestamp}</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="message-detail-body">
            <h2 class="detail-subject overlay-subject">${subject}</h2>
            <div class="message-content-inner">
                <p>${fullContent}</p>
                ${replyThreadHTML}
                ${hasAttachment ? `
                    <div class="detail-attachment">
                        <h4>Attachment:</h4>
                        <div class="attachment-item">
                            <span class="attachment-icon">🖼️</span>
                            <span class="attachment-name">selfie-id-verification.jpg</span>
                            <button class="attachment-download">Download</button>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Handle resize to switch between overlay/panel views for Messages
window.addEventListener('resize', () => {
    // Only handle messages section resizing if messages is active
    if (currentActiveSection !== 'messages') return;
    
    const overlay = document.getElementById('messageDetailOverlay');
    
    if (window.innerWidth >= 888 && overlay && overlay.style.display === 'flex') {
        const messageId = overlay.dataset.messageId;
        hideMessageOverlay();
        
        // Find the message element and trigger normal panel view
        if (messageId) {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            if (messageElement) {
                messageElement.click();
            }
        }
    }
});

// ===== SUPPORT CENTER (Admin Dashboard Phase 4) =====
// Real support_requests queue + reply + platform_broadcasts. Small paginated
// "glance" lists, no live listener -- same cost pattern as Gig Moderation /
// User Management. See docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md
// "Support (Messages) -- resolved design".

let supportCurrentTab = 'new';
let supportTickets = { new: [], old: [] };
let supportLastDoc = { new: null, old: null };
let supportHasMore = { new: false, old: false };
let supportBroadcasts = [];
let supportBroadcastsLastDoc = null;
let supportBroadcastsHasMore = false;
let supportSelectedTicketId = null;
let supportSelectedBroadcastId = null;
let supportActionInFlight = false;

function initializeSupportCenter() {
    console.log('📨 Initializing Support Center (Phase 4)');
    populateSupportTopicFilterOptions();
    initializeSupportTabButtons();
    initializeSupportSearch();
    initializeSupportReplyModal();
    initializeSupportDetailButtons();
    initializeSupportMobileOverlay();
    initializeSupportComposeOverlay();
    initializeSupportAttachmentLightbox();
    initializeSupportInboxRefresh();
    loadSupportTab('new', { reset: true });
    refreshSupportTabCounts();
    console.log('✅ Support Center initialized');
}

// Support ticket attachment previews (desktop panel + mobile overlay both
// render a `.attachment-preview[data-lightbox-url]` thumbnail) reuse the
// existing #imageLightboxOverlay -- built for verification photos, but a
// generic image-in-a-box modal so it works fine here too. One delegated
// listener covers both render targets since they share the same markup.
function initializeSupportAttachmentLightbox() {
    document.addEventListener('click', (e) => {
        const img = e.target.closest('.attachment-preview[data-lightbox-url]');
        if (!img) return;
        const overlay = document.getElementById('imageLightboxOverlay');
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxLabel = document.getElementById('lightboxLabel');
        if (!overlay || !lightboxImage) return;
        lightboxImage.src = img.getAttribute('data-lightbox-url');
        if (lightboxLabel) lightboxLabel.textContent = 'Support Ticket Attachment';
        overlay.classList.add('active');
    });
}

function populateSupportTopicFilterOptions() {
    const dropdown = document.getElementById('topicFilter');
    if (!dropdown) return;
    const taxonomy = window.GISUGO_SUPPORT_TAXONOMY;
    const topics = taxonomy ? taxonomy.supportResponseSublabels : [];
    dropdown.innerHTML = `
        <option value="all">All Topics</option>
        ${topics.map((t) => `<option value="${escapeHtml(t.code)}">${escapeHtml(t.label)}</option>`).join('')}
    `;
}

function initializeSupportTabButtons() {
    document.getElementById('newInboxBtn')?.addEventListener('click', () => switchSupportTab('new'));
    document.getElementById('oldInboxBtn')?.addEventListener('click', () => switchSupportTab('old'));
    document.getElementById('sentInboxBtn')?.addEventListener('click', () => switchSupportTab('sent'));

    document.getElementById('topicFilter')?.addEventListener('change', () => renderSupportList());

    document.getElementById('loadMoreMessagesBtn')?.addEventListener('click', () => {
        if (supportCurrentTab === 'sent') {
            loadSupportSentTab({ reset: false });
        } else {
            loadSupportTab(supportCurrentTab, { reset: false });
        }
    });

    // Event delegation: card list is re-rendered on every load, so bind once
    // on the stable container instead of per-card.
    document.getElementById('customerMessagesList')?.addEventListener('click', (e) => {
        const ticketCard = e.target.closest('.customer-message-item[data-ticket-id]');
        if (ticketCard) {
            selectSupportTicket(ticketCard.getAttribute('data-ticket-id'));
            return;
        }
        const broadcastCard = e.target.closest('.customer-message-item[data-broadcast-id]');
        if (broadcastCard) {
            selectSupportBroadcast(broadcastCard.getAttribute('data-broadcast-id'));
        }
    });
}

function switchSupportTab(tab) {
    supportCurrentTab = tab;
    document.getElementById('newInboxBtn')?.classList.toggle('active', tab === 'new');
    document.getElementById('oldInboxBtn')?.classList.toggle('active', tab === 'old');
    document.getElementById('sentInboxBtn')?.classList.toggle('active', tab === 'sent');

    closeSupportDetail();

    const searchInput = document.getElementById('messagesSearchInput');
    if (searchInput) searchInput.value = '';

    const topicFilterWrap = document.querySelector('.topic-filter');
    if (topicFilterWrap) topicFilterWrap.style.display = tab === 'sent' ? 'none' : '';

    // Compose Public Message stays visible on every tab -- it's a standalone
    // action (write a new broadcast), not something scoped to the Sent tab.

    if (tab === 'sent') {
        if (!supportBroadcasts.length) {
            loadSupportSentTab({ reset: true });
        } else {
            renderSupportList();
        }
    } else if (!supportTickets[tab].length) {
        loadSupportTab(tab, { reset: true });
    } else {
        renderSupportList();
    }
}

async function loadSupportTab(tab, options = {}) {
    const { reset = false } = options;
    const list = document.getElementById('customerMessagesList');
    if (reset && list) {
        list.innerHTML = supportEmptyStateHTML('Loading...', '');
    }
    const fetcher = tab === 'new' ? window.getSupportQueueNew : window.getSupportQueueOld;
    if (typeof fetcher !== 'function') {
        if (list) list.innerHTML = supportEmptyStateHTML('Support backend unavailable', 'Try refreshing the page.');
        return;
    }
    const result = await fetcher(reset ? null : supportLastDoc[tab]);
    supportTickets[tab] = reset ? result.tickets : supportTickets[tab].concat(result.tickets);
    supportLastDoc[tab] = result.lastDoc;
    supportHasMore[tab] = result.hasMore;
    renderSupportList();
}

async function loadSupportSentTab(options = {}) {
    const { reset = false } = options;
    const fetcher = window.getSentBroadcasts;
    if (typeof fetcher !== 'function') return;
    const result = await fetcher(reset ? null : supportBroadcastsLastDoc);
    supportBroadcasts = reset ? result.broadcasts : supportBroadcasts.concat(result.broadcasts);
    supportBroadcastsLastDoc = result.lastDoc;
    supportBroadcastsHasMore = result.hasMore;
    renderSupportList();
}

async function refreshSupportTabCounts() {
    if (typeof window.getSupportQueueCounts !== 'function') return;
    const { newCount, oldCount } = await window.getSupportQueueCounts();
    document.getElementById('newCountLabel') && (document.getElementById('newCountLabel').textContent = formatCount(newCount));
    document.getElementById('oldCountLabel') && (document.getElementById('oldCountLabel').textContent = formatCount(oldCount));
    if (supportCurrentTab === 'sent' || supportBroadcasts.length) {
        document.getElementById('sentCountLabel') && (document.getElementById('sentCountLabel').textContent = formatCount(supportBroadcasts.length));
    }
    if (typeof updateNavigationMessageBadge === 'function') {
        updateNavigationMessageBadge(newCount);
    }
}

function initializeSupportInboxRefresh() {
    const button = document.getElementById('refreshMessagesBtn');
    if (!button || button.dataset.bound) return;
    button.dataset.bound = '1';
    button.addEventListener('click', (event) => {
        event.preventDefault();
        refreshSupportInbox();
    });
}

async function refreshSupportInbox() {
    const button = document.getElementById('refreshMessagesBtn');
    if (button) {
        button.disabled = true;
        button.classList.add('is-refreshing');
    }
    if (supportCurrentTab !== 'new') {
        supportTickets.new = [];
        supportLastDoc.new = null;
        supportHasMore.new = false;
    }
    if (supportCurrentTab !== 'old') {
        supportTickets.old = [];
        supportLastDoc.old = null;
        supportHasMore.old = false;
    }
    if (supportCurrentTab !== 'sent') {
        supportBroadcasts = [];
        supportBroadcastsLastDoc = null;
        supportBroadcastsHasMore = false;
    }
    if (typeof closeSupportDetail === 'function') closeSupportDetail();
    try {
        if (supportCurrentTab === 'sent') {
            await loadSupportSentTab({ reset: true });
        } else {
            await loadSupportTab(supportCurrentTab, { reset: true });
        }
        await refreshSupportTabCounts();
    } finally {
        if (button) {
            button.disabled = false;
            button.classList.remove('is-refreshing');
        }
    }
}

function renderSupportList() {
    const list = document.getElementById('customerMessagesList');
    if (!list) return;

    if (supportCurrentTab === 'sent') {
        renderSupportBroadcastList(list);
        updateSupportPaginationUI();
        return;
    }

    const topicFilter = document.getElementById('topicFilter')?.value || 'all';
    const searchQuery = (document.getElementById('messagesSearchInput')?.value || '').trim().toLowerCase();

    let items = supportTickets[supportCurrentTab] || [];
    if (topicFilter !== 'all') {
        items = items.filter((t) => String(t.data.categoryCode || '') === topicFilter);
    }
    if (searchQuery) {
        items = items.filter((t) => {
            const d = t.data;
            return (d.subject || '').toLowerCase().includes(searchQuery)
                || (d.message || '').toLowerCase().includes(searchQuery)
                || (d.requester?.name || '').toLowerCase().includes(searchQuery)
                || (d.requester?.email || '').toLowerCase().includes(searchQuery);
        });
    }

    if (!items.length) {
        list.innerHTML = supportEmptyStateHTML(
            supportCurrentTab === 'new' ? 'No open support tickets' : 'No resolved tickets yet',
            supportCurrentTab === 'new' ? 'New and awaiting-resolution requests will appear here.' : 'Resolved tickets will appear here.'
        );
        updateSupportPaginationUI();
        return;
    }

    list.innerHTML = items.map((t) => renderSupportTicketCard(t)).join('');
    updateSupportPaginationUI();
}

function renderSupportBroadcastList(list) {
    const searchQuery = (document.getElementById('messagesSearchInput')?.value || '').trim().toLowerCase();
    let items = supportBroadcasts;
    if (searchQuery) {
        items = items.filter((b) => (b.data.subject || '').toLowerCase().includes(searchQuery)
            || (b.data.message || '').toLowerCase().includes(searchQuery));
    }
    if (!items.length) {
        list.innerHTML = supportEmptyStateHTML('No broadcasts sent yet', 'Use the ✉️ button above to compose one.');
        return;
    }
    list.innerHTML = items.map((b) => renderSupportBroadcastCard(b)).join('');
}

const SUPPORT_BROADCAST_CATEGORY_LABELS = {
    'important-notices': '🔴 Important Notices',
    'platform-updates': '🔵 Platform Updates',
    'system-updates': '⚙️ System Updates',
    'promotions': '🎁 Promotions'
};

function renderSupportBroadcastCard(broadcast) {
    const d = broadcast.data;
    const category = String(d.category || 'system-updates');
    const label = SUPPORT_BROADCAST_CATEGORY_LABELS[category] || category;
    const subject = escapeHtml(d.subject || '');
    const messageRaw = String(d.message || '').trim();
    const excerpt = escapeHtml(messageRaw.length > 120 ? messageRaw.slice(0, 120) + '...' : messageRaw);
    const timeLabel = formatSupportTime(d, 'createdAt', 'createdAtMs', 'createdAtISO');

    return `
        <div class="customer-message-item" data-broadcast-id="${broadcast.id}" data-topic="public-message">
            <div class="message-topic ${category}">${label}</div>
            <div class="message-content-area">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-avatar" style="background:#10b981;color:#fff;font-weight:600;display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;">📢</div>
                        <div class="sender-info">
                            <div class="sender-name">Public Announcement</div>
                            <div class="sender-email">All Users</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="message-time">${timeLabel}</div>
                    </div>
                </div>
                <div class="message-preview">
                    <div class="message-subject">${subject}</div>
                    <div class="message-excerpt">${excerpt}</div>
                </div>
            </div>
        </div>
    `;
}

function renderSupportTicketCard(ticket) {
    const d = ticket.data;
    const topicCode = String(d.categoryCode || 'other');
    const topicClass = topicCode.replace(/_/g, '-');
    const topicLabel = d.categoryLabel || topicCode;
    const lastSender = (typeof window.getSupportLastSender === 'function')
        ? window.getSupportLastSender(d)
        : (d.lastSender || (d.status === 'pending' ? 'user' : 'admin'));
    const isUnread = lastSender === 'user';
    const name = escapeHtml(d.requester?.name || 'Unknown');
    const email = escapeHtml(d.requester?.email || '');
    const timeLabel = formatSupportTime(d, 'createdAt', 'createdAtMs', 'createdAtISO');
    const subject = escapeHtml((typeof window.displaySupportSubject === 'function')
        ? (window.displaySupportSubject(d.subject, d.categoryLabel) || d.jobTitle || '')
        : (d.subject || ''));
    const thread = (typeof window.normalizeSupportMessages === 'function')
        ? window.normalizeSupportMessages(d)
        : [];
    const lastText = thread.length ? String(thread[thread.length - 1].message || '').trim() : '';
    const excerptRaw = lastText || String(d.message || '').trim();
    const excerpt = escapeHtml(excerptRaw.length > 120 ? excerptRaw.slice(0, 120) + '...' : excerptRaw) || 'No details provided.';
    const lastPhoto = [...thread].reverse().find((entry) => !!(entry.photoThumbUrl || entry.photoUrl));
    const hasAttachment = !!(lastPhoto || d.attachments?.photoUrl || d.photoUrl);
    // Prefer the small thumb for the list-row preview; older tickets only
    // have the single full-size photoUrl, so fall back to that.
    const attachmentThumbUrl = lastPhoto?.photoThumbUrl || lastPhoto?.photoUrl
        || d.attachments?.photoThumbUrl || d.attachments?.photoUrl || d.photoUrl || null;

    return `
        <div class="customer-message-item ${isUnread ? 'unread' : ''}" data-ticket-id="${ticket.id}" data-topic="${escapeHtml(topicCode)}">
            <div class="message-topic ${topicClass}">${escapeHtml(topicLabel)}</div>
            <div class="message-content-area">
                <div class="message-header">
                    <div class="message-sender">
                        <div class="sender-info">
                            <div class="sender-name">${name}</div>
                            <div class="sender-email">${email}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="message-time">${timeLabel}</div>
                        ${hasAttachment ? `<img src="${attachmentThumbUrl}" alt="Has photo attachment" title="Has photo attachment" class="message-attachment-thumb">` : ''}
                    </div>
                </div>
                <div class="message-preview">
                    <div class="message-subject">${subject}</div>
                    <div class="message-excerpt">${excerpt}</div>
                </div>
            </div>
        </div>
    `;
}

function formatSupportTime(data, tsField, msField, isoField) {
    if (data[tsField]) {
        const formatted = formatGigTimestamp(data[tsField]);
        if (formatted) return formatted;
    }
    if (Number.isFinite(data[msField])) {
        const formatted = formatGigTimestamp(new Date(data[msField]));
        if (formatted) return formatted;
    }
    if (data[isoField]) {
        const formatted = formatGigTimestamp(new Date(data[isoField]));
        if (formatted) return formatted;
    }
    return '';
}

function supportEmptyStateHTML(title, subtitle) {
    return `
        <div class="no-message-selected" style="padding: 2rem 1rem;">
            <div class="no-message-icon">💬</div>
            <h4>${escapeHtml(title)}</h4>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
    `;
}

function updateSupportPaginationUI() {
    const loadMoreBtn = document.getElementById('loadMoreMessagesBtn');
    const stats = document.getElementById('messagesStats');
    const hasMore = supportCurrentTab === 'sent' ? supportBroadcastsHasMore : supportHasMore[supportCurrentTab];
    if (loadMoreBtn) loadMoreBtn.style.display = hasMore ? 'block' : 'none';
    if (stats) {
        const count = supportCurrentTab === 'sent' ? supportBroadcasts.length : (supportTickets[supportCurrentTab] || []).length;
        stats.textContent = `Showing ${count} message${count === 1 ? '' : 's'}`;
    }
}

// ----- Ticket detail (desktop panel + mobile overlay) -----

function findSupportTicketById(ticketId) {
    return (supportTickets.new.find((t) => t.id === ticketId))
        || (supportTickets.old.find((t) => t.id === ticketId))
        || null;
}

function selectSupportTicket(ticketId) {
    const ticket = findSupportTicketById(ticketId);
    if (!ticket) return;
    supportSelectedTicketId = ticketId;
    supportSelectedBroadcastId = null;

    document.querySelectorAll('.customer-message-item').forEach((el) => el.classList.remove('selected'));
    document.querySelector(`.customer-message-item[data-ticket-id="${ticketId}"]`)?.classList.add('selected');

    const isResolved = ticket.data?.status === 'resolved';
    if (window.innerWidth <= 887) {
        showSupportOverlay(buildSupportDetailHeaderMeta(ticket), buildSupportDetailBodyHTML(ticket), { isResolved });
    } else {
        showSupportDetailDesktop(ticket, { isResolved });
    }
}

function selectSupportBroadcast(broadcastId) {
    const broadcast = supportBroadcasts.find((b) => b.id === broadcastId);
    if (!broadcast) return;
    supportSelectedBroadcastId = broadcastId;
    supportSelectedTicketId = null;

    document.querySelectorAll('.customer-message-item').forEach((el) => el.classList.remove('selected'));
    document.querySelector(`.customer-message-item[data-broadcast-id="${broadcastId}"]`)?.classList.add('selected');

    const d = broadcast.data;
    const label = SUPPORT_BROADCAST_CATEGORY_LABELS[d.category] || d.category;
    const meta = { name: 'Public Announcement', email: 'All Users', time: formatSupportTime(d, 'createdAt', 'createdAtMs', 'createdAtISO'), topic: label, topicClass: 'general' };
    const body = `
        <div class="detail-subject">${escapeHtml(d.subject || '')}</div>
        <div class="detail-message-text">${escapeHtml(d.message || '').replace(/\n/g, '<br>')}</div>
    `;

    if (window.innerWidth <= 887) {
        showSupportOverlay(meta, body, { isBroadcast: true });
    } else {
        applySupportDetailHeader(meta, { isBroadcast: true });
        document.querySelector('#messageContent .message-detail-body').innerHTML = body;
        document.getElementById('messageDetail').style.display = 'none';
        document.getElementById('messageContent').style.display = 'block';
    }
}

function buildSupportDetailHeaderMeta(ticket) {
    const d = ticket.data;
    return {
        name: d.requester?.name || 'Unknown',
        email: d.requester?.email || '',
        time: formatSupportTime(d, 'createdAt', 'createdAtMs', 'createdAtISO'),
        topic: d.categoryLabel || d.categoryCode || 'Other',
        topicClass: String(d.categoryCode || 'other').replace(/_/g, '-')
    };
}

function buildSupportDetailBodyHTML(ticket) {
    const d = ticket.data;
    const thread = (typeof window.normalizeSupportMessages === 'function')
        ? window.normalizeSupportMessages(d)
        : [];

    const threadHTML = thread.map((entry) => {
        const isAdmin = entry.sender === 'admin';
        const who = escapeHtml(isAdmin ? (entry.senderName || 'Admin') : (entry.senderName || 'User'));
        const text = escapeHtml(entry.message || '').replace(/\n/g, '<br>');
        const thumbUrl = entry.photoThumbUrl || entry.photoUrl || null;
        const fullUrl = entry.photoUrl || entry.photoThumbUrl || null;
        const border = isAdmin ? '#3b82f6' : '#e6d6ae';
        const bg = isAdmin ? 'rgba(59,130,246,0.08)' : 'rgba(230,214,174,0.08)';
        const labelColor = isAdmin ? '#3b82f6' : '#e6d6ae';
        const prefix = isAdmin ? '↩️' : '👩🏻';
        return `
            <div class="support-thread-entry" style="margin-top:1rem; padding:1rem; border-left:3px solid ${border}; background:${bg}; border-radius:6px;">
                <div style="font-weight:600; color:${labelColor}; margin-bottom:0.5rem;">${prefix} ${who}</div>
                <div>${text}</div>
                ${thumbUrl ? `
                <div class="attachment-file" style="margin-top:0.75rem;">
                    <img src="${escapeHtml(thumbUrl)}" alt="Attachment" class="attachment-preview" data-lightbox-url="${escapeHtml(fullUrl)}" style="cursor: zoom-in;">
                    <div class="attachment-name">Photo attachment (click to enlarge)</div>
                </div>` : ''}
            </div>
        `;
    }).join('');

    return `
        ${(() => {
            const subject = (typeof window.displaySupportSubject === 'function')
                ? (window.displaySupportSubject(d.subject, d.categoryLabel) || d.jobTitle || '')
                : (d.subject || '');
            return subject ? `<div class="detail-subject">${escapeHtml(subject)}</div>` : '';
        })()}
        <div class="detail-message-text" id="detailMessageText">${threadHTML || '<div>No message content.</div>'}</div>
        ${d.referenceId ? `<div style="margin-top:1rem; font-size:0.75rem; color:rgba(230,214,174,0.5);">Reference: ${escapeHtml(d.referenceId)}</div>` : ''}
    `;
}

function applySupportDetailHeader(meta, options = {}) {
    document.getElementById('detailSenderName') && (document.getElementById('detailSenderName').textContent = meta.name);
    document.getElementById('detailSenderEmail') && (document.getElementById('detailSenderEmail').textContent = meta.email);
    document.getElementById('detailMessageTime') && (document.getElementById('detailMessageTime').textContent = meta.time);
    document.getElementById('detailTopic') && (document.getElementById('detailTopic').textContent = meta.topic);

    const replyBtn = document.getElementById('openReplyBtn');
    const closeBtn = document.getElementById('closeMessageBtn');
    if (replyBtn) replyBtn.style.display = options.isBroadcast ? 'none' : '';
    if (closeBtn) {
        if (options.isBroadcast) {
            closeBtn.textContent = 'Unsend';
            closeBtn.style.display = '';
        } else if (options.isResolved) {
            // FIX (2026-08-12): an already-resolved ticket (viewed from the Old
            // tab) has nowhere left to move -- showing "Mark Resolved" here just
            // re-runs the same "move to Old tab" confirmation on a ticket that's
            // already there, which is confusing busywork with no real effect.
            closeBtn.style.display = 'none';
        } else {
            closeBtn.textContent = 'Mark Resolved';
            closeBtn.style.display = '';
        }
    }
}

function showSupportDetailDesktop(ticket, options = {}) {
    applySupportDetailHeader(buildSupportDetailHeaderMeta(ticket), options);
    const bodyEl = document.querySelector('#messageContent .message-detail-body');
    if (bodyEl) bodyEl.innerHTML = buildSupportDetailBodyHTML(ticket);

    document.getElementById('messageDetail').style.display = 'none';
    document.getElementById('messageContent').style.display = 'block';
}

function closeSupportDetail() {
    supportSelectedTicketId = null;
    supportSelectedBroadcastId = null;
    document.querySelectorAll('.customer-message-item.selected').forEach((el) => el.classList.remove('selected'));
    const messageDetail = document.getElementById('messageDetail');
    const messageContent = document.getElementById('messageContent');
    if (messageDetail) messageDetail.style.display = 'block';
    if (messageContent) messageContent.style.display = 'none';
    const overlayEl = document.getElementById('messageDetailOverlay');
    if (overlayEl) {
        overlayEl.classList.remove('active', 'show');
        overlayEl.style.display = 'none';
    }
}

function initializeSupportDetailButtons() {
    document.getElementById('openReplyBtn')?.addEventListener('click', () => openSupportReplyModal());
    document.getElementById('closeMessageBtn')?.addEventListener('click', () => handleSupportCloseAction());
}

function handleSupportCloseAction() {
    if (supportSelectedBroadcastId) {
        confirmUnsendSupportBroadcast(supportSelectedBroadcastId);
        return;
    }
    if (supportSelectedTicketId) {
        confirmResolveSupportTicket(supportSelectedTicketId);
    }
}

function confirmResolveSupportTicket(ticketId) {
    showSettingsConfirmation(
        '✅ Mark as Resolved',
        'This will close the ticket and move it to the Old tab. Continue?',
        async () => {
            if (supportActionInFlight) return;
            supportActionInFlight = true;
            const hourglass = document.getElementById('supportResolveHourglass');
            if (hourglass) {
                hourglass.classList.add('is-visible');
                hourglass.setAttribute('aria-hidden', 'false');
            }
            let result = { success: false };
            try {
                result = await window.resolveSupportRequest(ticketId);
            } finally {
                supportActionInFlight = false;
                if (hourglass) {
                    hourglass.classList.remove('is-visible');
                    hourglass.setAttribute('aria-hidden', 'true');
                }
            }
            if (result.success) {
                showToast('Ticket marked as resolved', 'success', 2000);
                closeSupportDetail();
                supportTickets.new = supportTickets.new.filter((t) => t.id !== ticketId);
                supportTickets.old = [];
                supportLastDoc.old = null;
                switchSupportTab('old');
                refreshSupportTabCounts();
            } else {
                showToast(result.message || 'Could not resolve ticket', 'error', 2500);
            }
        }
    );
}

function confirmUnsendSupportBroadcast(broadcastId) {
    showSettingsConfirmation(
        '🗑️ Unsend Broadcast',
        'This will permanently delete this broadcast for all users. Continue?',
        async () => {
            if (supportActionInFlight) return;
            supportActionInFlight = true;
            const result = await window.deleteBroadcast(broadcastId);
            supportActionInFlight = false;
            if (result.success) {
                showToast('Broadcast unsent', 'success', 2000);
                closeSupportDetail();
                supportBroadcasts = supportBroadcasts.filter((b) => b.id !== broadcastId);
                renderSupportList();
                refreshSupportTabCounts();
            } else {
                showToast(result.message || 'Could not unsend broadcast', 'error', 2500);
            }
        }
    );
}

// ----- Reply modal (floating) -----

// FIX (2026-08-12): the "Add Photo" button/input here was real markup that
// was never actually wired to anything -- selecting a file did nothing, and
// the send handler below never read it, so any photo silently vanished on
// send. This variable + the handlers in initializeSupportReplyModal() are
// the actual wiring, mirroring the same pattern already used for the
// original ticket's photo upload (uploadSupportPhoto -> thumb + full).
let supportReplyPhotoFile = null;
let supportReplyPhotoPreviewUrl = null;

function initializeSupportReplyModal() {
    const replyOverlay = document.getElementById('replyOverlay');
    const closeReplyModal = document.getElementById('closeReplyModal');
    const cancelReplyBtn = document.getElementById('cancelReplyBtn');
    const sendFloatingReplyBtn = document.getElementById('sendFloatingReplyBtn');
    const photoInput = document.getElementById('floatingReplyAttachment');
    const photoPreview = document.getElementById('floatingReplyPhotoPreview');
    const photoPreviewImg = document.getElementById('floatingReplyPhotoPreviewImg');
    const photoRemoveBtn = document.getElementById('floatingReplyPhotoRemoveBtn');

    function clearReplyPhoto() {
        supportReplyPhotoFile = null;
        if (supportReplyPhotoPreviewUrl) {
            URL.revokeObjectURL(supportReplyPhotoPreviewUrl);
            supportReplyPhotoPreviewUrl = null;
        }
        if (photoInput) photoInput.value = '';
        if (photoPreview) photoPreview.style.display = 'none';
        if (photoPreviewImg) photoPreviewImg.src = '';
    }

    function closeModal() {
        replyOverlay?.classList.remove('show');
        const ta = document.getElementById('floatingReplyTextarea');
        if (ta) ta.value = '';
        clearReplyPhoto();
    }

    closeReplyModal?.addEventListener('click', closeModal);
    cancelReplyBtn?.addEventListener('click', closeModal);
    replyOverlay?.addEventListener('click', (e) => {
        if (e.target === replyOverlay) closeModal();
    });

    photoInput?.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'image/gif'];
        const tooLarge = typeof isSupportPhotoOriginalTooLarge === 'function'
            ? isSupportPhotoOriginalTooLarge(file)
            : file.size > 25 * 1024 * 1024;
        if (tooLarge) {
            const maxMb = typeof getSupportPhotoOriginalMaxBytes === 'function'
                ? Math.round(getSupportPhotoOriginalMaxBytes() / (1024 * 1024))
                : 25;
            showToast(`This photo is too large to attach (over ${maxMb}MB).`, 'error', 2500);
            photoInput.value = '';
            return;
        }
        if (!allowed.includes(file.type)) {
            showToast('Only JPG, PNG, and GIF files are supported', 'error', 2500);
            photoInput.value = '';
            return;
        }
        if (supportReplyPhotoPreviewUrl) {
            URL.revokeObjectURL(supportReplyPhotoPreviewUrl);
            supportReplyPhotoPreviewUrl = null;
        }
        supportReplyPhotoPreviewUrl = URL.createObjectURL(file);
        if (photoPreviewImg) photoPreviewImg.src = supportReplyPhotoPreviewUrl;
        if (photoPreview) photoPreview.style.display = 'inline-block';
        supportReplyPhotoFile = file;
    });

    photoRemoveBtn?.addEventListener('click', clearReplyPhoto);

    sendFloatingReplyBtn?.addEventListener('click', async () => {
        const textarea = document.getElementById('floatingReplyTextarea');
        const replyText = (textarea?.value || '').trim();
        if (!replyText) {
            showToast('Please enter a reply message.', 'error', 2000);
            return;
        }
        if (!supportSelectedTicketId) {
            showToast('No ticket selected.', 'error', 2000);
            return;
        }
        if (supportActionInFlight) return;
        supportActionInFlight = true;
        const originalSendHtml = sendFloatingReplyBtn.innerHTML;
        sendFloatingReplyBtn.disabled = true;
        sendFloatingReplyBtn.innerHTML = '<span class="settings-btn-spinner">⌛</span> Sending...';
        const replyHourglass = document.getElementById('adminReplySendHourglass');
        if (replyHourglass) {
            replyHourglass.classList.add('is-visible');
            replyHourglass.setAttribute('aria-hidden', 'false');
        }

        function restoreSendBtn() {
            sendFloatingReplyBtn.disabled = false;
            sendFloatingReplyBtn.innerHTML = originalSendHtml;
            supportActionInFlight = false;
            if (replyHourglass) {
                replyHourglass.classList.remove('is-visible');
                replyHourglass.setAttribute('aria-hidden', 'true');
            }
        }

        const selectedTicket = findSupportTicketById(supportSelectedTicketId);
        const existingThread = (typeof window.normalizeSupportMessages === 'function' && selectedTicket)
            ? window.normalizeSupportMessages(selectedTicket.data)
            : [];
        if (existingThread.length >= 50) {
            restoreSendBtn();
            showToast('This conversation has reached its message limit.', 'error', 2500);
            return;
        }

        let photoMeta = null;
        let uploadedPhotoForCleanup = null;
        if (supportReplyPhotoFile) {
            // Upload into the ADMIN's own support_photos/{uid}/ folder so
            // Storage isOwner() passes. Putting it under the ticket user's
            // uid was a 403: admin is not that owner, and isAdmin() in
            // storage.rules was not granting access (2026-08-14).
            const uploaderId = (window.currentAdmin && window.currentAdmin.uid) || null;
            const uploadResult = await window.uploadSupportPhoto(
                `${supportSelectedTicketId}_reply_${Date.now()}`,
                supportReplyPhotoFile,
                uploaderId
            );
            if (!uploadResult.success) {
                restoreSendBtn();
                showToast((uploadResult.errors && uploadResult.errors[0]) || 'Photo upload failed', 'error', 2500);
                return;
            }
            photoMeta = { url: uploadResult.url, thumbUrl: uploadResult.thumbUrl };
            uploadedPhotoForCleanup = uploadResult;
        }

        const result = await window.replyToSupportRequest(supportSelectedTicketId, replyText, photoMeta);
        restoreSendBtn();

        if (result.success) {
            showToast('Reply sent!', 'success', 2000);
            closeModal();
            // FIX (2026-08-12): replying no longer moves the ticket to Old --
            // it stays in New (just no longer bold/pending) until an admin
            // explicitly clicks Mark Resolved. Update the in-memory copy so
            // the list re-render reflects the new status without a re-fetch,
            // then re-select it so the header re-evaluates the Mark Resolved
            // button (still shown -- replied isn't resolved) and the
            // resolved-only Old tab stays untouched.
            const ticketId = supportSelectedTicketId;
            const ticket = findSupportTicketById(ticketId);
            if (ticket) {
                ticket.data.status = 'replied';
                ticket.data.lastSender = 'admin';
                if (result.messages) ticket.data.messages = result.messages;
            }
            renderSupportList();
            refreshSupportTabCounts();
            if (ticket) selectSupportTicket(ticketId);
        } else {
            if (uploadedPhotoForCleanup && typeof window.cleanupSupportPhotoUpload === 'function') {
                await window.cleanupSupportPhotoUpload(uploadedPhotoForCleanup);
            }
            showToast(result.message || 'Reply failed', 'error', 2500);
        }
    });
}

function openSupportReplyModal() {
    const replyOverlay = document.getElementById('replyOverlay');
    const title = document.querySelector('.reply-modal-title');
    if (title) title.textContent = 'Reply to Support Ticket';
    replyOverlay?.classList.add('show');
    document.getElementById('floatingReplyTextarea')?.focus();
}

// ----- Mobile overlay -----

function initializeSupportMobileOverlay() {
    document.getElementById('overlayCloseBtn')?.addEventListener('click', () => {
        const overlayEl = document.getElementById('messageDetailOverlay');
        if (overlayEl) {
            overlayEl.classList.remove('active', 'show');
            overlayEl.style.display = 'none';
        }
    });
    document.getElementById('overlayReplyBtn')?.addEventListener('click', () => openSupportReplyModal());
    document.getElementById('overlayArchiveBtn')?.addEventListener('click', () => handleSupportCloseAction());
}

function showSupportOverlay(meta, bodyHTML, options = {}) {
    const overlay = document.getElementById('messageDetailOverlay');
    const body = overlay?.querySelector('.overlay-body');
    if (!overlay || !body) return;

    const nameEl = document.getElementById('overlayDetailName');
    if (nameEl) nameEl.textContent = meta.name || 'Message Details';
    const emailEl = document.getElementById('overlayDetailEmail');
    if (emailEl) emailEl.textContent = meta.email || '';
    const timeEl = document.getElementById('overlayDetailTime');
    if (timeEl) timeEl.textContent = meta.time || '';

    const topicEl = document.getElementById('overlayDetailTopic');
    if (topicEl) {
        if (meta.topic) {
            topicEl.textContent = meta.topic;
            topicEl.className = `message-topic topic-pill ${meta.topicClass || ''}`.trim();
            topicEl.style.display = '';
        } else {
            topicEl.style.display = 'none';
        }
    }

    body.innerHTML = bodyHTML;

    const replyBtn = document.getElementById('overlayReplyBtn');
    const archiveBtn = document.getElementById('overlayArchiveBtn');
    if (replyBtn) replyBtn.style.display = options.isBroadcast ? 'none' : '';
    if (archiveBtn) {
        if (options.isBroadcast) {
            archiveBtn.textContent = 'Unsend';
            archiveBtn.style.display = '';
        } else if (options.isResolved) {
            archiveBtn.style.display = 'none';
        } else {
            archiveBtn.textContent = 'Mark Resolved';
            archiveBtn.style.display = '';
        }
    }

    // FIX (2026-08-12): the CSS for #messageDetailOverlay only defines a
    // `display: none` default plus a `[style*="flex"]` visible-state
    // selector -- there is no `.active`/`.show` class rule at all. Adding
    // those classes (the old code below) silently did nothing, so the
    // overlay was fully built with the ticket's data but never actually
    // shown. Set the inline display directly, matching the CSS's own hook.
    overlay.classList.add('active', 'show');
    overlay.style.display = 'flex';
}

// ----- Search -----

function initializeSupportSearch() {
    document.getElementById('messagesSearchInput')?.addEventListener('input', () => renderSupportList());
}

// ----- Compose Public Message (broadcast) -----

function initializeSupportComposeOverlay() {
    const overlay = document.getElementById('publicMessageOverlay');
    const openBtn = document.getElementById('composePublicMessageBtn');
    const closeBtn = document.getElementById('closePublicMessageModal');
    const cancelBtn = document.getElementById('cancelPublicMessageBtn');
    const sendBtn = document.getElementById('sendPublicMessageBtn');
    const categorySelect = document.getElementById('publicCategorySelect');
    const subjectInput = document.getElementById('publicSubjectInput');
    const messageTextarea = document.getElementById('publicMessageTextarea');
    const subjectCounter = document.getElementById('subjectCharCounter');
    const messageCounter = document.getElementById('messageCharCounter');

    function resetForm() {
        if (categorySelect) categorySelect.value = '';
        if (subjectInput) subjectInput.value = '';
        if (messageTextarea) messageTextarea.value = '';
        if (subjectCounter) subjectCounter.textContent = '0/100';
        if (messageCounter) messageCounter.textContent = '0/1000';
    }

    function closeOverlay() {
        overlay?.classList.remove('active', 'show');
        resetForm();
    }

    openBtn?.addEventListener('click', () => overlay?.classList.add('active', 'show'));
    closeBtn?.addEventListener('click', closeOverlay);
    cancelBtn?.addEventListener('click', closeOverlay);

    subjectInput?.addEventListener('input', () => {
        if (subjectCounter) subjectCounter.textContent = `${subjectInput.value.length}/100`;
    });
    messageTextarea?.addEventListener('input', () => {
        if (messageCounter) messageCounter.textContent = `${messageTextarea.value.length}/1000`;
    });

    sendBtn?.addEventListener('click', async () => {
        const category = categorySelect?.value || '';
        const subject = (subjectInput?.value || '').trim();
        const message = (messageTextarea?.value || '').trim();

        if (!category || !subject || !message) {
            showToast('Please fill in category, subject, and message.', 'error', 2500);
            return;
        }
        if (supportActionInFlight) return;
        supportActionInFlight = true;
        sendBtn.disabled = true;
        const result = await window.createPlatformBroadcast(category, subject, message);
        sendBtn.disabled = false;
        supportActionInFlight = false;

        if (result.success) {
            showToast('Broadcast sent to all users!', 'success', 2000);
            closeOverlay();
            supportBroadcasts = [];
            supportBroadcastsLastDoc = null;
            if (supportCurrentTab === 'sent') {
                loadSupportSentTab({ reset: true });
            }
            refreshSupportTabCounts();
        } else {
            showToast(result.message || 'Could not send broadcast', 'error', 2500);
        }
    });
}

// ===== TOAST NOTIFICATION SYSTEM =====
function showToast(message, type = 'success', duration = 1500) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    if (!toast || !toastMessage) return;
    
    // Set message and icon based on type
    toastMessage.textContent = message;
    
    switch(type) {
        case 'success':
            toastIcon.textContent = '✅';
            toast.style.background = '#10b981';
            break;
        case 'error':
            toastIcon.textContent = '❌';
            toast.style.background = '#ef4444';
            break;
        case 'info':
            toastIcon.textContent = 'ℹ️';
            toast.style.background = '#3b82f6';
            break;
        default:
            toastIcon.textContent = '✅';
            toast.style.background = '#10b981';
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ===== GIG MODERATION SYSTEM =====
// Wired to real Firestore data (Admin Dashboard Phase 2, 2026-08-09). See
// docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md "Gig Moderation — resolved
// design" for the Posted-is-a-glance / Reported+Suspended-are-live-queues
// reasoning, and functions/index.js (syncGigReportCountersOnCreate,
// adminModerateGig) for the backend half of this.

let currentGigTab = 'posted'; // Track current tab: 'posted', 'reported', 'suspended'
let currentGigData = null; // Track currently selected gig (normalized shape, see normalizeGigForDisplay)
let allGigs = []; // Currently-loaded gigs for the active tab only -- NOT the whole collection.
let gigsPostedLastDoc = null; // Firestore cursor for Posted tab's "Load More" glance pagination
let gigsPostedHasMore = false;
let gigModerationActionInFlight = false; // Guards double-submits on Suspend/Reinstate/Ignore/Delete

const GIG_MODERATION_FALLBACK_AVATAR = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">' +
    '<circle cx="20" cy="20" r="20" fill="#3d4a5c"/>' +
    '<ellipse cx="20" cy="15" rx="7.2" ry="7.6" fill="#f3c7a7"/>' +
    '<path d="M12.2 15.2c.4-6.2 4-9.4 7.8-9.4s7.4 3.2 7.8 9.4c-.6-2.4-2.6-4.2-5.2-4.8-1.4 2.2-4.4 2.4-6.2.4-1.8.6-3.6 2.2-4.2 4.4z" fill="#2a1a12"/>' +
    '<path d="M8 36.5c1.2-7.6 6.2-12.2 12-12.2s10.8 4.6 12 12.2" fill="#2f241c"/>' +
    '</svg>'
);

function formatGigTimestamp(ts) {
    if (!ts) return '';
    try {
        const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
        });
    } catch (_) {
        return '';
    }
}

function renderReportedByInfoHtml(gig) {
    const reporters = Array.isArray(gig && gig.reportedBy) ? gig.reportedBy : [];
    if (!reporters.length) {
        const count = Number(gig && gig.reportCount) || 0;
        return `<div class="reported-by-loading">${count} report${count === 1 ? '' : 's'} — loading details…</div>`;
    }
    return reporters.map((reporter) => {
        const name = escapeHtml(reporter.reporterName || 'A user');
        const avatar = escapeHtml(reporter.reporterAvatar || GIG_MODERATION_FALLBACK_AVATAR);
        const date = escapeHtml(reporter.reportDate || '');
        const subject = String(reporter.subject || '').trim();
        const message = String(reporter.message || '').trim();
        const subjectHtml = subject
            ? `<span class="reporter-subject">${escapeHtml(subject)}</span>`
            : '';
        const messageHtml = message
            ? `<span class="reporter-message">${escapeHtml(message)}</span>`
            : '';
        return `
            <div class="reported-by-entry">
                <div class="reported-by-profile">
                    <img src="${avatar}" alt="${name}" class="reporter-avatar">
                    <div class="reporter-details">
                        <span class="reporter-name">${name}</span>
                        ${date ? `<span class="report-date">${date}</span>` : ''}
                    </div>
                </div>
                ${subjectHtml || messageHtml ? `<div class="reporter-copy">${subjectHtml}${messageHtml}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Handles both shapes seen on job docs: a plain "YYYY-MM-DD" string
// (new-post2.js jobDate, no time component) and a Firestore Timestamp
// (legacy scheduledDate). The plain string is parsed manually instead of
// via `new Date(str)` -- that treats "YYYY-MM-DD" as UTC midnight, which
// can silently roll back a day once localized in timezones behind UTC.
function formatGigDateOnly(ts) {
    if (!ts) return '';
    try {
        const plainDateMatch = typeof ts === 'string' && ts.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (plainDateMatch) {
            const [, y, m, d] = plainDateMatch;
            const date = new Date(Number(y), Number(m) - 1, Number(d));
            return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        const date = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (_) {
        return '';
    }
}

// Extras are already pre-formatted "Label: Value" strings (see new-post2.js
// createJobPostWithData) -- split once here so the existing 2-slot
// EXTRA 1 / EXTRA 2 template markup can stay unchanged.
function splitGigExtraString(str) {
    const safe = String(str || '');
    const idx = safe.indexOf(': ');
    if (idx === -1) return { label: '', value: safe };
    return { label: safe.slice(0, idx).toUpperCase() + ':', value: safe.slice(idx + 2) };
}

// Converts a raw jobs/{jobId} Firestore document into the flat shape the
// existing card/panel/overlay templates already expect. This is the ONLY
// place real field names (posterThumbnail, priceOffer, gigUseType,
// scheduledDate, etc.) get translated -- keeps the rendering functions
// below unchanged from their pre-Phase-2 shape as much as possible.
function normalizeGigForDisplay(jobId, job) {
    const data = job || {};
    const hiredWorker = data.hiredWorkerId ? {
        workerAvatar: data.hiredWorkerThumbnail || GIG_MODERATION_FALLBACK_AVATAR,
        workerName: data.hiredWorkerName || 'Worker'
    } : null;

    const suspendedBy = (data.status === 'suspended' && data.suspendedByName) ? {
        adminName: data.suspendedByName,
        suspendDate: formatGigTimestamp(data.suspendedAt),
        reason: data.suspendReason || ''
    } : null;

    return {
        gigId: jobId,
        posterId: data.posterId || '',
        posterAvatar: data.posterThumbnail || GIG_MODERATION_FALLBACK_AVATAR,
        posterName: data.posterName || 'Customer',
        datePosted: formatGigTimestamp(data.datePosted),
        category: data.category || 'uncategorized',
        title: data.title || '(untitled gig)',
        thumbnail: data.thumbnail || '',
        // jobDate is the current (new-post2.js) field name -- a plain
        // "YYYY-MM-DD" string. scheduledDate is a legacy/alternate name
        // some older or relisted docs may still carry; kept as a fallback.
        jobDate: formatGigDateOnly(data.jobDate || data.scheduledDate),
        startTime: data.startTime || '',
        endTime: data.endTime || '',
        region: data.region || '',
        city: data.city || '',
        // No separate "locationDetails" field exists on the job doc -- the
        // free-text barangay/general-area input (2026-08-03 barangay-removal
        // decision) is stored as part of `extras` (e.g. "Pickup at: Marigondon"),
        // rendered below via splitGigExtraString, not duplicated here.
        extras: Array.isArray(data.extras) ? data.extras : [],
        description: data.description || '',
        price: (data.priceOffer !== undefined && data.priceOffer !== null) ? data.priceOffer : '',
        gigUseType: data.gigUseType || 'Personal',
        applicationCount: Number(data.applicationCount) || 0,
        status: data.status || 'active',
        reportCount: Number(data.reportCount) || 0,
        hiredWorker,
        hiredWorkerId: data.hiredWorkerId ? String(data.hiredWorkerId) : '',
        suspendedBy,
        // Populated on demand (async) only when the detail panel/overlay for
        // this specific gig is opened -- see loadGigReportsIntoCurrentGig().
        reportedBy: []
    };
}

function initializeGigModeration() {
    console.log('🛡️ Initializing Gig Moderation system');
    
    // Initialize tab buttons
    initializeGigTabs();
    
    // Initialize search
    initializeGigSearch();

    // Initialize Load More (Posted tab glance pagination)
    initializeGigLoadMore();
    
    // Initialize action buttons (desktop)
    initializeGigActions();
    
    // Initialize contact overlay
    initializeContactGigOverlay();
    
    // Initialize confirmation overlays
    initializeConfirmationOverlays();
    
    // Initialize mobile overlay
    initializeGigDetailOverlay();
    
    // Load initial gigs (posted tab)
    loadGigCards('posted');
    
    console.log('✅ Gig Moderation initialized');
}

function initializeGigTabs() {
    const tabButtons = document.querySelectorAll('.gig-tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabType = this.dataset.tab;
            switchGigTab(tabType);
        });
    });
}

function switchGigTab(tabType) {
    console.log(`📑 Switching to ${tabType} tab`);
    
    currentGigTab = tabType;
    
    // Update active tab button
    document.querySelectorAll('.gig-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabType}"]`)?.classList.add('active');
    
    // Clear detail view
    clearGigDetail();

    // A stale search query would otherwise silently keep filtering after
    // switching tabs -- clear it so the tab shows its normal full view.
    const searchInput = document.getElementById('gigsSearchInput');
    if (searchInput) searchInput.value = '';
    
    // Load gigs for this tab
    loadGigCards(tabType);
    
    // Reset scroll position to top AFTER loading content (using setTimeout to ensure DOM is updated)
    setTimeout(() => {
        const gigCardsContainer = document.querySelector('.gig-cards-container');
        if (gigCardsContainer) {
            gigCardsContainer.scrollTop = 0;
        }
    }, 0);
}

async function loadGigCards(tabType, options = {}) {
    const gigCardsList = document.getElementById('gigCardsList');
    if (!gigCardsList) return;

    const append = options.append === true;
    const loadingIndicator = document.getElementById('gigsLoading');
    const loadMoreBtn = document.getElementById('loadMoreGigsBtn');

    if (!append) {
        gigCardsList.innerHTML = '<div class="gig-cards-empty-loading" style="padding:2rem;text-align:center;color:#a0aec0;">Loading gigs…</div>';
        clearGigDetail();
    }
    if (loadingIndicator) loadingIndicator.style.display = append ? 'block' : 'none';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    try {
        let fetchedGigs = [];

        if (tabType === 'reported') {
            const results = (typeof getGigModerationReported === 'function')
                ? await getGigModerationReported()
                : [];
            fetchedGigs = results.map(r => normalizeGigForDisplay(r.id, r.data));
            gigsPostedHasMore = false;
        } else if (tabType === 'suspended') {
            const results = (typeof getGigModerationSuspended === 'function')
                ? await getGigModerationSuspended()
                : [];
            fetchedGigs = results.map(r => normalizeGigForDisplay(r.id, r.data));
            gigsPostedHasMore = false;
        } else {
            // Posted tab: "glance" pattern -- newest batch, optional Load More,
            // no gap-guarantee. See architecture study for why this is
            // deliberate, not a shortcut.
            const startAfter = append ? gigsPostedLastDoc : null;
            const result = (typeof getGigModerationPosted === 'function')
                ? await getGigModerationPosted(startAfter)
                : { jobs: [], lastDoc: null, hasMore: false };
            const normalized = result.jobs.map(r => normalizeGigForDisplay(r.id, r.data));
            fetchedGigs = append ? [...allGigs, ...normalized] : normalized;
            gigsPostedLastDoc = result.lastDoc;
            gigsPostedHasMore = result.hasMore;
        }

        allGigs = fetchedGigs;
        currentGigTab = tabType;

        // Update tab counts (Reported/Suspended are exact since those queues
        // are fully loaded; Posted count reflects only what's been fetched so
        // far -- see updateTabCounts()).
        updateTabCounts();

        if (allGigs.length === 0) {
            gigCardsList.innerHTML = '<div class="gig-cards-empty" style="padding:2rem;text-align:center;color:#a0aec0;">No gigs here right now.</div>';
        } else {
            gigCardsList.innerHTML = allGigs.map(gig => generateGigCardHTML(gig)).join('');
        }

        const gigsStats = document.getElementById('gigsStats');
        if (gigsStats) {
            gigsStats.textContent = `Showing ${allGigs.length} gig${allGigs.length === 1 ? '' : 's'}`;
        }

        if (loadMoreBtn) {
            loadMoreBtn.style.display = (tabType === 'posted' && gigsPostedHasMore) ? 'inline-block' : 'none';
        }

        attachGigCardHandlers();
    } catch (error) {
        console.error('❌ Error loading gig moderation cards:', error);
        gigCardsList.innerHTML = '<div class="gig-cards-empty" style="padding:2rem;text-align:center;color:#e53e3e;">Could not load gigs. Try refreshing.</div>';
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

function initializeGigLoadMore() {
    document.getElementById('loadMoreGigsBtn')?.addEventListener('click', function () {
        if (currentGigTab === 'posted') {
            loadGigCards('posted', { append: true });
        }
    });
}

function gigModerationStatusBadge(status) {
    const raw = String(status || '').toLowerCase();
    if (raw === 'completed') return { label: 'Completed', className: 'completed' };
    if (raw === 'suspended') return { label: 'Suspended', className: 'suspended' };
    if (raw === 'active') return { label: 'Live', className: 'live' };
    const label = raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : 'Unknown';
    return { label, className: 'other' };
}

function generateGigCardHTML(gig) {
    const safeTitle = escapeHtml(gig.title || '');
    const safeThumb = escapeHtml(gig.thumbnail || GIG_MODERATION_FALLBACK_AVATAR);
    const priceLabel = gig.price !== '' ? `₱${gig.price}` : '₱—';
    const statusBadge = gigModerationStatusBadge(gig.status);
    return `
        <div class="gig-card" data-gig-id="${gig.gigId}" data-poster-id="${gig.posterId}">
            <div class="gig-thumbnail">
                <img src="${safeThumb}" alt="${safeTitle}">
            </div>
            <div class="gig-card-content">
                <span class="gig-mod-status-badge ${statusBadge.className}">${escapeHtml(statusBadge.label)}</span>
                <div class="gig-card-title">${safeTitle}</div>
                <div class="gig-card-meta">
                    <div class="gig-card-schedule">
                        <span class="gig-card-date">📅 ${escapeHtml(gig.jobDate || '—')}</span>
                        <span class="gig-card-time">🕐 ${escapeHtml(gig.startTime || '—')} - ${escapeHtml(gig.endTime || '—')}</span>
                    </div>
                    <div class="gig-card-price">${priceLabel} (${escapeHtml(gig.gigUseType || 'Personal')})</div>
                    <div class="gig-card-posted">Posted ${escapeHtml(gig.datePosted || '—')} • ${gig.applicationCount} applicants</div>
                </div>
            </div>
        </div>
    `;
}

function attachGigCardHandlers() {
    const gigCards = document.querySelectorAll('.gig-card');
    
    gigCards.forEach(card => {
        card.addEventListener('click', function() {
            const gigId = this.dataset.gigId;
            loadGigDetails(gigId);
        });
    });
}

function loadGigDetails(gigId) {
    const gig = allGigs.find(g => g.gigId === gigId);
    if (!gig) return;
    
    currentGigData = gig;
    
    // Update selected card highlight
    document.querySelectorAll('.gig-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-gig-id="${gigId}"]`)?.classList.add('selected');
    
    // Check viewport width
    if (window.innerWidth <= 887) {
        // Mobile: Show overlay
        showGigOverlay(gig);
    } else {
        // Desktop: Populate right panel
        populateGigDetailPanel(gig);
    }

    // "Reported By" list is fetched on demand (not stored on the job doc).
    if (gig.status === 'reported' || gig.status === 'suspended') {
        loadGigReportsIntoCurrentGig(gigId);
    }
}

let gigReportsFetchInFlightId = '';

function patchReportedByUi(gig) {
    const html = renderReportedByInfoHtml(gig);
    const desktopInfo = document.getElementById('reportedByInfo');
    if (desktopInfo) desktopInfo.innerHTML = html;
    const overlay = document.getElementById('gigDetailOverlay');
    if (overlay && overlay.style.display === 'flex') {
        const overlayInfo = overlay.querySelector('.reported-by-info');
        if (overlayInfo) overlayInfo.innerHTML = html;
    }
}

async function loadGigReportsIntoCurrentGig(gigId) {
    if (typeof getGigReportsForJob !== 'function') return;
    const alreadyLoaded = currentGigData
        && currentGigData.gigId === gigId
        && Array.isArray(currentGigData.reportedBy)
        && currentGigData.reportedBy.length > 0;
    if (alreadyLoaded) return;
    if (gigReportsFetchInFlightId === gigId) return;
    gigReportsFetchInFlightId = gigId;
    try {
        const reports = await getGigReportsForJob(gigId);
        // Guard against the admin having clicked to a different gig while this was in flight.
        if (!currentGigData || currentGigData.gigId !== gigId) return;
        currentGigData.reportedBy = reports.map(r => ({
            reporterName: r.reporterName || 'A user',
            reporterAvatar: r.reporterAvatar || GIG_MODERATION_FALLBACK_AVATAR,
            reportDate: formatGigTimestamp(r.createdAt),
            subject: r.subject || '',
            message: r.message || ''
        }));
        patchReportedByUi(currentGigData);
    } catch (error) {
        console.warn('⚠️ Could not load gig reports for detail panel:', error);
    } finally {
        if (gigReportsFetchInFlightId === gigId) gigReportsFetchInFlightId = '';
    }
}

function populateGigDetailPanel(gig) {
    const gigContent = document.getElementById('gigContent');
    const gigDetail = document.getElementById('gigDetail');
    const gigContentInner = document.querySelector('.gig-content-inner');
    
    if (!gigContent) return;
    
    // Reset scroll position to top
    if (gigContentInner) {
        gigContentInner.scrollTop = 0;
    }
    
    // Hide "no selection" message
    if (gigDetail) {
        gigDetail.style.display = 'none';
    }
    
    // Show content
    gigContent.style.display = 'flex';
    
    // Populate header
    document.getElementById('gigPosterAvatar').src = gig.posterAvatar;
    document.getElementById('gigPosterName').textContent = gig.posterName;
    document.getElementById('gigPostedTime').textContent = `Posted ${gig.datePosted}`;
    
    // Populate body
    document.getElementById('gigCategory').textContent = (gig.category || '').toUpperCase();
    document.getElementById('gigTitle').textContent = gig.title;
    
    // Photo
    const gigPhoto = document.getElementById('gigPhoto');
    const gigPhotoContainer = document.getElementById('gigPhotoContainer');
    if (gig.thumbnail) {
        gigPhoto.src = gig.thumbnail;
        gigPhotoContainer.style.display = 'block';
    } else {
        gigPhotoContainer.style.display = 'none';
    }
    
    // Info fields
    document.getElementById('gigDate').textContent = gig.jobDate || '—';
    document.getElementById('gigTime').textContent = gig.startTime ? `${gig.startTime} - ${gig.endTime}` : '—';
    document.getElementById('gigRegion').textContent = gig.region || '—';
    document.getElementById('gigCity').textContent = gig.city || '—';
    
    // Extras -- already pre-formatted "Label: Value" strings (new-post2.js),
    // split here to reuse the existing 2-slot EXTRA 1 / EXTRA 2 markup.
    const extrasRow = document.getElementById('gigExtrasRow');
    if (gig.extras && gig.extras.length > 0) {
        const extra1 = splitGigExtraString(gig.extras[0]);
        document.getElementById('gigExtra1Label').textContent = extra1.label || 'DETAIL:';
        document.getElementById('gigExtra1Value').textContent = extra1.value || 'N/A';

        const extra2El = document.getElementById('gigExtra2Label');
        if (gig.extras[1]) {
            const extra2 = splitGigExtraString(gig.extras[1]);
            extra2El.textContent = extra2.label || 'DETAIL:';
            document.getElementById('gigExtra2Value').textContent = extra2.value || 'N/A';
            extra2El.parentElement.style.display = '';
        } else if (extra2El) {
            extra2El.parentElement.style.display = 'none';
        }
        extrasRow.style.display = 'grid';
    } else {
        extrasRow.style.display = 'none';
    }
    
    // Description
    document.getElementById('gigDescription').textContent = gig.description || '';
    
    // Payment
    document.getElementById('gigPrice').textContent = gig.price !== '' ? `₱${gig.price}` : '₱—';
    document.getElementById('gigPayRate').textContent = gig.gigUseType || 'Personal';
    
    // Hired worker
    const hiredWorkerInfo = document.getElementById('hiredWorkerInfo');
    if (gig.hiredWorker) {
        hiredWorkerInfo.innerHTML = `
            <div class="hired-worker-profile">
                <img src="${gig.hiredWorker.workerAvatar}" alt="${gig.hiredWorker.workerName}" class="hired-worker-avatar">
                <span class="hired-worker-name">${gig.hiredWorker.workerName}</span>
            </div>
        `;
    } else {
        hiredWorkerInfo.innerHTML = '<div class="no-hired-worker">This Gig has no hired worker.</div>';
    }
    
    // Reported By section (for reported and suspended gigs)
    const reportedBySection = document.getElementById('reportedBySection');
    const reportedByInfo = document.getElementById('reportedByInfo');
    if (gig.status === 'reported' || gig.status === 'suspended') {
        reportedByInfo.innerHTML = renderReportedByInfoHtml(gig);
        reportedBySection.style.display = 'block';
    } else {
        reportedBySection.style.display = 'none';
    }
    
    // Suspended By section (for suspended gigs)
    const suspendedBySection = document.getElementById('suspendedBySection');
    const suspendedByInfo = document.getElementById('suspendedByInfo');
    if (gig.status === 'suspended' && gig.suspendedBy) {
        const reasonLine = gig.suspendedBy.reason
            ? `<span class="suspend-reason">Reason: ${escapeHtml(gig.suspendedBy.reason)}</span>`
            : '';
        suspendedByInfo.innerHTML = `
            <div class="suspended-by-profile">
                <img src="${GIG_MODERATION_FALLBACK_AVATAR}" alt="${escapeHtml(gig.suspendedBy.adminName)}" class="admin-avatar">
                <div class="admin-details">
                    <span class="admin-name">${escapeHtml(gig.suspendedBy.adminName)}</span>
                    <span class="suspend-date">${escapeHtml(gig.suspendedBy.suspendDate)}</span>
                    ${reasonLine}
                </div>
            </div>
        `;
        suspendedBySection.style.display = 'block';
    } else {
        suspendedBySection.style.display = 'none';
    }
    
    // Update action buttons based on gig status. Keyed off gig.status
    // directly (not the async-loaded reportedBy list) since status is
    // known immediately, before the on-demand gig_reports fetch resolves.
    const suspendBtn = document.getElementById('suspendGigBtn');
    const relistBtn = document.getElementById('relistGigBtn');
    const closeBtn = document.getElementById('closeGigBtn');
    const ignoreBtn = document.getElementById('ignoreGigBtn');
    const bigSuspendSection = document.getElementById('bigSuspendSection');
    const permDeleteSection = document.getElementById('permDeleteSection');
    
    if (gig.status === 'completed') {
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (ignoreBtn) ignoreBtn.style.display = 'none';
        if (relistBtn) relistBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        if (bigSuspendSection) bigSuspendSection.style.display = 'none';
        if (permDeleteSection) permDeleteSection.style.display = 'none';
    } else if (gig.status === 'suspended') {
        // Suspended: Hide SUSPEND/IGNORE, Show RELIST/CLOSE, Hide BIG SUSPEND, Show PERM DELETE section
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (ignoreBtn) ignoreBtn.style.display = 'none';
        if (relistBtn) relistBtn.style.display = 'inline-block';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        if (bigSuspendSection) bigSuspendSection.style.display = 'none';
        if (permDeleteSection) permDeleteSection.style.display = 'block';
    } else if (gig.status === 'reported') {
        // Reported: Hide SUSPEND, Show IGNORE/CLOSE, Show BIG SUSPEND section, Hide PERM DELETE
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (ignoreBtn) ignoreBtn.style.display = 'inline-block';
        if (relistBtn) relistBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        if (bigSuspendSection) bigSuspendSection.style.display = 'block';
        if (permDeleteSection) permDeleteSection.style.display = 'none';
    } else {
        // Posted: Show SUSPEND/CLOSE, Hide IGNORE/RELIST, Hide BIG SUSPEND and PERM DELETE sections
        if (suspendBtn) suspendBtn.style.display = 'inline-block';
        if (ignoreBtn) ignoreBtn.style.display = 'none';
        if (relistBtn) relistBtn.style.display = 'none';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        if (bigSuspendSection) bigSuspendSection.style.display = 'none';
        if (permDeleteSection) permDeleteSection.style.display = 'none';
    }
}

function clearGigDetail() {
    const gigContent = document.getElementById('gigContent');
    const gigDetail = document.getElementById('gigDetail');
    
    if (gigContent) {
        gigContent.style.display = 'none';
    }
    if (gigDetail) {
        gigDetail.style.display = 'flex';
    }
    
    // Clear selected card
    document.querySelectorAll('.gig-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    currentGigData = null;
}

function initializeGigActions() {
    // Suspend button
    document.getElementById('suspendGigBtn')?.addEventListener('click', handleSuspendGig);
    
    // Big Suspend button (for reported gigs)
    document.getElementById('bigSuspendGigBtn')?.addEventListener('click', handleSuspendGig);
    
    // Ignore button (for reported gigs)
    document.getElementById('ignoreGigBtn')?.addEventListener('click', handleIgnoreGig);
    
    // Relist button (for suspended gigs)
    document.getElementById('relistGigBtn')?.addEventListener('click', handleRelistGig);
    
    // Permanent Delete button (for suspended gigs)
    document.getElementById('permDeleteGigBtn')?.addEventListener('click', handlePermanentDeleteGig);
    
    // Contact button
    document.getElementById('contactGigBtn')?.addEventListener('click', handleContactGig);
    
    // Close button
    document.getElementById('closeGigBtn')?.addEventListener('click', handleCloseGig);
}

function handleSuspendGig() {
    if (!currentGigData) return;
    
    // Show confirmation overlay
    showSuspendConfirmation();
}

function showSuspendConfirmation() {
    const overlay = document.getElementById('suspendConfirmOverlay');
    const message = document.getElementById('suspendConfirmMessage');
    
    if (overlay && currentGigData) {
        const safeTitle = escapeHtml(currentGigData.title || '');
        const safePoster = escapeHtml(currentGigData.posterName || '');
        message.innerHTML = `<strong>${safeTitle}</strong> by ${safePoster} will be moved to the "Suspended" tab.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideSuspendConfirmation() {
    const overlay = document.getElementById('suspendConfirmOverlay');
    setGigConfirmHourglass('suspendGigHourglass', false);
    setGigConfirmOverlayBusy('suspendConfirmOverlay', false);
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function setGigConfirmHourglass(hourglassId, visible) {
    const hourglass = document.getElementById(hourglassId);
    if (!hourglass) return;
    hourglass.classList.toggle('is-visible', visible);
    hourglass.setAttribute('aria-hidden', visible ? 'false' : 'true');
}

function setGigConfirmOverlayBusy(overlayId, busy) {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;
    overlay.querySelectorAll('button').forEach((btn) => {
        btn.disabled = busy;
    });
}

async function confirmSuspendGig() {
    if (!currentGigData || gigModerationActionInFlight) return;
    const gigId = currentGigData.gigId;
    gigModerationActionInFlight = true;
    setGigConfirmOverlayBusy('suspendConfirmOverlay', true);
    setGigConfirmHourglass('suspendGigHourglass', true);

    let result = { success: false, message: 'Could not suspend gig' };
    try {
        result = await callAdminModerateGig(gigId, 'suspend');
    } finally {
        gigModerationActionInFlight = false;
        hideSuspendConfirmation();
    }

    if (!result.success) {
        showToast(result.message || 'Could not suspend gig', 'error');
        console.error('❌ Suspend failed:', result.message);
        return;
    }

    clearGigDetail();
    loadGigCards(currentGigTab);
    showToast('Gig suspended successfully', 'success');
    console.log(`🚫 Gig ${gigId} suspended`);
}

function handleRelistGig() {
    if (!currentGigData) return;
    
    // Show confirmation overlay
    showRelistConfirmation();
}

function showRelistConfirmation() {
    const overlay = document.getElementById('relistConfirmOverlay');
    const message = document.getElementById('relistConfirmMessage');
    
    if (overlay && currentGigData) {
        const safeTitle = escapeHtml(currentGigData.title || '');
        const safePoster = escapeHtml(currentGigData.posterName || '');
        message.innerHTML = `<strong>${safeTitle}</strong> by ${safePoster} will be moved back to the "Posted" tab.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideRelistConfirmation() {
    const overlay = document.getElementById('relistConfirmOverlay');
    setGigConfirmHourglass('relistGigHourglass', false);
    setGigConfirmOverlayBusy('relistConfirmOverlay', false);
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

async function confirmRelistGig() {
    if (!currentGigData || gigModerationActionInFlight) return;
    const gigId = currentGigData.gigId;
    gigModerationActionInFlight = true;
    setGigConfirmOverlayBusy('relistConfirmOverlay', true);
    setGigConfirmHourglass('relistGigHourglass', true);

    let result = { success: false, message: 'Could not relist gig' };
    try {
        result = await callAdminModerateGig(gigId, 'reinstate');
    } finally {
        gigModerationActionInFlight = false;
        hideRelistConfirmation();
    }

    if (!result.success) {
        showToast(result.message || 'Could not relist gig', 'error');
        console.error('❌ Reinstate failed:', result.message);
        return;
    }

    clearGigDetail();
    loadGigCards(currentGigTab);
    showToast('Gig relisted successfully', 'success');
    console.log(`✅ Gig ${gigId} relisted`);
}

function handleIgnoreGig() {
    if (!currentGigData) return;
    
    // Show confirmation overlay
    showIgnoreConfirmation();
}

function showIgnoreConfirmation() {
    const overlay = document.getElementById('ignoreConfirmOverlay');
    const message = document.getElementById('ignoreConfirmMessage');
    
    if (overlay && currentGigData) {
        const safeTitle = escapeHtml(currentGigData.title || '');
        const safeThreshold = escapeHtml(String((currentGigData.reportCount || 0) + 2));
        message.innerHTML = `<strong>${safeTitle}</strong> will be hidden from "Reported" and requires ${safeThreshold} total reports to reappear.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideIgnoreConfirmation() {
    const overlay = document.getElementById('ignoreConfirmOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

async function confirmIgnoreGig() {
    if (!currentGigData || gigModerationActionInFlight) return;
    const gigId = currentGigData.gigId;
    gigModerationActionInFlight = true;

    const result = await callAdminModerateGig(gigId, 'ignore');

    gigModerationActionInFlight = false;
    hideIgnoreConfirmation();

    if (!result.success) {
        showToast(result.message || 'Could not ignore reports', 'error');
        console.error('❌ Ignore failed:', result.message);
        return;
    }

    clearGigDetail();
    loadGigCards('reported');
    showToast('Reports ignored. Gig will reappear after 2 more unique reports.', 'success');
    console.log(`🙈 Gig ${gigId} ignored`);
}

function handleDeleteGig() {
    if (!currentGigData) return;
    
    // Same as permanent delete - redirect
    handlePermanentDeleteGig();
}

function handlePermanentDeleteGig() {
    if (!currentGigData) return;
    
    // Show confirmation overlay
    showDeleteConfirmation();
}

function showDeleteConfirmation() {
    const overlay = document.getElementById('deleteConfirmOverlay');
    const message = document.getElementById('deleteConfirmMessage');
    
    if (overlay && currentGigData) {
        const safeTitle = escapeHtml(currentGigData.title || '');
        const safePoster = escapeHtml(currentGigData.posterName || '');
        message.innerHTML = `<strong>⚠️ Warning:</strong> <strong>"${safeTitle}"</strong> posted by ${safePoster} will be permanently removed from the marketplace and database. This action cannot be undone.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideDeleteConfirmation() {
    const overlay = document.getElementById('deleteConfirmOverlay');
    setGigConfirmHourglass('deleteGigHourglass', false);
    setGigConfirmOverlayBusy('deleteConfirmOverlay', false);
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

async function confirmDeleteGig() {
    if (!currentGigData || gigModerationActionInFlight) return;
    const gigId = currentGigData.gigId;
    gigModerationActionInFlight = true;
    setGigConfirmOverlayBusy('deleteConfirmOverlay', true);
    setGigConfirmHourglass('deleteGigHourglass', true);

    // Reuses the same battle-tested deleteJob() the gig owner's own listing
    // deletion flow uses (firebase-db.js) -- photo cleanup, application
    // cleanup + coin release, audit log, then the Firestore delete itself.
    // Works for an admin here because firestore.rules already allows
    // isAdmin() on jobs delete (no new Cloud Function needed for this one).
    let result = { success: false, message: 'deleteJob() unavailable' };
    try {
        result = (typeof deleteJob === 'function')
            ? await deleteJob(gigId)
            : { success: false, message: 'deleteJob() unavailable' };
    } finally {
        gigModerationActionInFlight = false;
        hideDeleteConfirmation();
    }

    if (!result.success) {
        showToast(result.message || 'Could not delete gig', 'error');
        console.error('❌ Permanent delete failed:', result.message);
        return;
    }

    clearGigDetail();
    loadGigCards('suspended');
    showToast('Gig permanently deleted from database', 'success');
    console.log(`🗑️ Gig ${gigId} permanently deleted`);
}

function populateContactGigRecipients() {
    const select = document.getElementById('contactRecipientSelect');
    if (!select || !currentGigData) return;
    const posterName = currentGigData.posterName || 'Gig Poster';
    const hiredId = String(currentGigData.hiredWorkerId || '').trim();
    const hiredName = (currentGigData.hiredWorker && currentGigData.hiredWorker.workerName) || 'Hired Worker';
    select.innerHTML = `
        <option value="">Select recipient...</option>
        <option value="poster">${escapeHtml(posterName)} (Gig Poster)</option>
        ${hiredId
            ? `<option value="hired-worker">${escapeHtml(hiredName)} (Hired Worker)</option>`
            : '<option value="hired-worker" disabled>Hired Worker (none on this gig)</option>'}
    `;
}

function handleContactGig() {
    if (!currentGigData) return;
    populateContactGigRecipients();
    const contactOverlay = document.getElementById('contactGigOverlay');
    if (contactOverlay) {
        contactOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function handleCloseGig() {
    clearGigDetail();
}

let contactGigPhotoFile = null;
let contactGigPhotoPreviewUrl = null;

function clearContactGigPhoto() {
    contactGigPhotoFile = null;
    if (contactGigPhotoPreviewUrl) {
        URL.revokeObjectURL(contactGigPhotoPreviewUrl);
        contactGigPhotoPreviewUrl = null;
    }
    const previewContainer = document.getElementById('contactAttachmentPreview');
    const previewImage = document.getElementById('contactPreviewImage');
    const attachInput = document.getElementById('contactAttachmentInput');
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImage) previewImage.src = '';
    if (attachInput) attachInput.value = '';
}

function initializeContactGigOverlay() {
    document.getElementById('closeContactGigModal')?.addEventListener('click', closeContactGigOverlay);
    document.getElementById('cancelContactBtn')?.addEventListener('click', closeContactGigOverlay);

    const attachBtn = document.getElementById('contactAttachBtn');
    const attachInput = document.getElementById('contactAttachmentInput');
    if (attachBtn && attachInput) {
        attachBtn.addEventListener('click', function() {
            attachInput.click();
        });
        attachInput.addEventListener('change', function() {
            const file = attachInput.files && attachInput.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Only image attachments are supported', 'error', 2500);
                attachInput.value = '';
                return;
            }
            const contactGigTooLarge = typeof isSupportPhotoOriginalTooLarge === 'function'
                ? isSupportPhotoOriginalTooLarge(file)
                : file.size > 25 * 1024 * 1024;
            if (contactGigTooLarge) {
                const maxMb = typeof getSupportPhotoOriginalMaxBytes === 'function'
                    ? Math.round(getSupportPhotoOriginalMaxBytes() / (1024 * 1024))
                    : 25;
                showToast(`This photo is too large to attach (over ${maxMb}MB).`, 'error', 2500);
                attachInput.value = '';
                return;
            }
            if (contactGigPhotoPreviewUrl) URL.revokeObjectURL(contactGigPhotoPreviewUrl);
            contactGigPhotoFile = file;
            contactGigPhotoPreviewUrl = URL.createObjectURL(file);
            const previewContainer = document.getElementById('contactAttachmentPreview');
            const previewImage = document.getElementById('contactPreviewImage');
            if (previewImage) previewImage.src = contactGigPhotoPreviewUrl;
            if (previewContainer) previewContainer.style.display = 'block';
        });
    }

    document.getElementById('removeContactAttachment')?.addEventListener('click', clearContactGigPhoto);

    const sendBtn = document.getElementById('sendContactMessageBtn');
    sendBtn?.addEventListener('click', async function() {
        if (!currentGigData) {
            showToast('No gig selected.', 'error', 2000);
            return;
        }
        const recipient = document.getElementById('contactRecipientSelect')?.value;
        const message = (document.getElementById('contactMessageInput')?.value || '').trim();
        if (!recipient) {
            showToast('Please select a recipient', 'error', 2000);
            return;
        }
        if (!message) {
            showToast('Please enter a message', 'error', 2000);
            return;
        }

        let targetUserId = '';
        if (recipient === 'poster') {
            targetUserId = String(currentGigData.posterId || '').trim();
        } else if (recipient === 'hired-worker') {
            targetUserId = String(currentGigData.hiredWorkerId || '').trim();
        }
        if (!targetUserId) {
            showToast(recipient === 'hired-worker'
                ? 'This gig has no hired worker.'
                : 'This gig has no poster id.', 'error', 2500);
            return;
        }
        if (typeof window.createOrAppendAdminSupportMessage !== 'function') {
            showToast('Support send is unavailable.', 'error', 2500);
            return;
        }
        if (gigModerationActionInFlight) return;
        gigModerationActionInFlight = true;
        const originalSendHtml = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="settings-btn-spinner">⌛</span> Sending...';
        const contactHourglass = document.getElementById('contactGigSendHourglass');
        if (contactHourglass) {
            contactHourglass.classList.add('is-visible');
            contactHourglass.setAttribute('aria-hidden', 'false');
        }

        let uploadedPhotoForCleanup = null;
        try {
            let photoMeta = null;
            if (contactGigPhotoFile && typeof window.uploadSupportPhoto === 'function') {
                const uploaderId = (window.currentAdmin && window.currentAdmin.uid) || null;
                const uploadResult = await window.uploadSupportPhoto(
                    `${currentGigData.gigId}_contact_${Date.now()}`,
                    contactGigPhotoFile,
                    uploaderId
                );
                if (!uploadResult.success) {
                    showToast((uploadResult.errors && uploadResult.errors[0]) || 'Photo upload failed', 'error', 2500);
                    return;
                }
                photoMeta = { url: uploadResult.url, thumbUrl: uploadResult.thumbUrl };
                uploadedPhotoForCleanup = uploadResult;
            }

            const result = await window.createOrAppendAdminSupportMessage({
                targetUserId,
                message,
                source: 'admin_gig_contact',
                jobId: currentGigData.gigId,
                photoMeta
            });
            if (!result.success) {
                if (uploadedPhotoForCleanup && typeof window.cleanupSupportPhotoUpload === 'function') {
                    await window.cleanupSupportPhotoUpload(uploadedPhotoForCleanup);
                }
                showToast(result.message || 'Send failed', 'error', 2500);
                return;
            }

            const who = recipient === 'hired-worker'
                ? ((currentGigData.hiredWorker && currentGigData.hiredWorker.workerName) || 'hired worker')
                : (currentGigData.posterName || 'gig poster');
            showToast(result.action === 'appended'
                ? `Added to ${who}'s open Support thread`
                : `Message sent to ${who}`, 'success', 2500);
            closeContactGigOverlay();
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalSendHtml;
            gigModerationActionInFlight = false;
            if (contactHourglass) {
                contactHourglass.classList.remove('is-visible');
                contactHourglass.setAttribute('aria-hidden', 'true');
            }
        }
    });

    document.getElementById('contactGigOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            closeContactGigOverlay();
        }
    });
}

function closeContactGigOverlay() {
    const contactOverlay = document.getElementById('contactGigOverlay');
    if (contactOverlay) {
        contactOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    // Reset form
    const recipientSelect = document.getElementById('contactRecipientSelect');
    const messageInput = document.getElementById('contactMessageInput');
    if (recipientSelect) recipientSelect.value = '';
    if (messageInput) messageInput.value = '';
    clearContactGigPhoto();
}

function initializeConfirmationOverlays() {
    // Suspend Confirmation
    document.getElementById('confirmSuspendBtn')?.addEventListener('click', confirmSuspendGig);
    document.getElementById('cancelSuspendBtn')?.addEventListener('click', hideSuspendConfirmation);
    
    // Close on background click
    document.getElementById('suspendConfirmOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideSuspendConfirmation();
        }
    });
    
    // Relist Confirmation
    document.getElementById('confirmRelistBtn')?.addEventListener('click', confirmRelistGig);
    document.getElementById('cancelRelistBtn')?.addEventListener('click', hideRelistConfirmation);
    
    // Close on background click
    document.getElementById('relistConfirmOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideRelistConfirmation();
        }
    });
    
    // Ignore Confirmation
    document.getElementById('confirmIgnoreBtn')?.addEventListener('click', confirmIgnoreGig);
    document.getElementById('cancelIgnoreBtn')?.addEventListener('click', hideIgnoreConfirmation);
    
    // Close on background click
    document.getElementById('ignoreConfirmOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideIgnoreConfirmation();
        }
    });
    
    // Delete Confirmation
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDeleteGig);
    document.getElementById('cancelDeleteBtn')?.addEventListener('click', hideDeleteConfirmation);
    
    // Close on background click
    document.getElementById('deleteConfirmOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideDeleteConfirmation();
        }
    });
    
    console.log('✅ Confirmation overlays initialized');
}

function initializeGigDetailOverlay() {
    // Close buttons (X in header and CLOSE in footer)
    document.getElementById('gigOverlayCloseBtnX')?.addEventListener('click', hideGigOverlay);
    document.getElementById('gigOverlayCloseBtn')?.addEventListener('click', hideGigOverlay);
    
    // Overlay action buttons
    document.getElementById('gigOverlaySuspendBtn')?.addEventListener('click', function() {
        hideGigOverlay();
        handleSuspendGig();
    });
    
    document.getElementById('gigOverlayIgnoreBtn')?.addEventListener('click', function() {
        hideGigOverlay();
        handleIgnoreGig();
    });
    
    document.getElementById('gigOverlayRelistBtn')?.addEventListener('click', function() {
        hideGigOverlay();
        handleRelistGig();
    });
    
    document.getElementById('gigOverlayContactBtn')?.addEventListener('click', function() {
        hideGigOverlay();
        handleContactGig();
    });
    
    // Close on background click
    document.getElementById('gigDetailOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) {
            hideGigOverlay();
        }
    });
}

function showGigOverlay(gig) {
    const overlay = document.getElementById('gigDetailOverlay');
    const overlayBody = overlay?.querySelector('.overlay-body');
    
    if (!overlay || !overlayBody) return;
    
    // Populate header info
    document.getElementById('gigOverlayPosterAvatar').src = gig.posterAvatar;
    document.getElementById('gigOverlayPosterName').textContent = gig.posterName;
    document.getElementById('gigOverlayPostedTime').textContent = `Posted ${gig.datePosted || '—'}`;
    document.getElementById('gigOverlayCategory').textContent = (gig.category || '').toUpperCase();
    
    // Generate content (body only, without header)
    overlayBody.innerHTML = generateGigOverlayContent(gig);
    
    // Attach permanent delete button listener (dynamically generated)
    const overlayPermDeleteBtn = document.getElementById('overlayPermDeleteBtn');
    if (overlayPermDeleteBtn) {
        overlayPermDeleteBtn.addEventListener('click', function() {
            hideGigOverlay();
            handlePermanentDeleteGig();
        });
    }
    
    // Attach big suspend button listener (dynamically generated for reported gigs)
    const overlayBigSuspendBtn = document.getElementById('overlayBigSuspendBtn');
    if (overlayBigSuspendBtn) {
        overlayBigSuspendBtn.addEventListener('click', function() {
            hideGigOverlay();
            handleSuspendGig();
        });
    }
    
    // Update action buttons based on gig status (keyed off gig.status
    // directly, same reasoning as the desktop panel above).
    const overlaySuspendBtn = document.getElementById('gigOverlaySuspendBtn');
    const overlayIgnoreBtn = document.getElementById('gigOverlayIgnoreBtn');
    const overlayRelistBtn = document.getElementById('gigOverlayRelistBtn');
    const overlayCloseBtn = document.getElementById('gigOverlayCloseBtn');
    
    if (gig.status === 'completed') {
        if (overlaySuspendBtn) overlaySuspendBtn.style.display = 'none';
        if (overlayIgnoreBtn) overlayIgnoreBtn.style.display = 'none';
        if (overlayRelistBtn) overlayRelistBtn.style.display = 'none';
        if (overlayCloseBtn) overlayCloseBtn.style.display = 'inline-block';
    } else if (gig.status === 'suspended') {
        // Suspended: Hide SUSPEND/IGNORE, Show RELIST/CLOSE
        if (overlaySuspendBtn) overlaySuspendBtn.style.display = 'none';
        if (overlayIgnoreBtn) overlayIgnoreBtn.style.display = 'none';
        if (overlayRelistBtn) overlayRelistBtn.style.display = 'inline-block';
        if (overlayCloseBtn) overlayCloseBtn.style.display = 'inline-block';
    } else if (gig.status === 'reported') {
        // Reported: Hide SUSPEND, Show IGNORE/CLOSE
        if (overlaySuspendBtn) overlaySuspendBtn.style.display = 'none';
        if (overlayIgnoreBtn) overlayIgnoreBtn.style.display = 'inline-block';
        if (overlayRelistBtn) overlayRelistBtn.style.display = 'none';
        if (overlayCloseBtn) overlayCloseBtn.style.display = 'inline-block';
    } else {
        // Posted: Show SUSPEND/CLOSE, Hide RELIST/IGNORE
        if (overlaySuspendBtn) overlaySuspendBtn.style.display = 'inline-block';
        if (overlayIgnoreBtn) overlayIgnoreBtn.style.display = 'none';
        if (overlayRelistBtn) overlayRelistBtn.style.display = 'none';
        if (overlayCloseBtn) overlayCloseBtn.style.display = 'inline-block';
    }
    
    // Show overlay
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reset scroll position to top (after overlay is visible)
    if (overlayBody) {
        overlayBody.scrollTop = 0;
    }
    
    console.log(`📱 Showing gig overlay for ${gig.gigId}`);
}

function hideGigOverlay() {
    const overlay = document.getElementById('gigDetailOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function generateGigOverlayContent(gig) {
    // Extras are already pre-formatted "Label: Value" strings (new-post2.js).
    let extrasHTML = '';
    if (gig.extras && gig.extras.length > 0) {
        extrasHTML = gig.extras.map((extraStr) => {
            const { label, value } = splitGigExtraString(extraStr);
            return `
            <div class="gig-info-item">
                <div class="gig-info-label">${escapeHtml(label || 'DETAIL:')}</div>
                <div class="gig-info-value">${escapeHtml(value)}</div>
            </div>
        `;
        }).join('');
    }
    
    let hiredWorkerHTML = '';
    if (gig.hiredWorker) {
        hiredWorkerHTML = `
            <div class="hired-worker-profile">
                <img src="${escapeHtml(gig.hiredWorker.workerAvatar)}" alt="${escapeHtml(gig.hiredWorker.workerName)}" class="hired-worker-avatar">
                <span class="hired-worker-name">${escapeHtml(gig.hiredWorker.workerName)}</span>
            </div>
        `;
    } else {
        hiredWorkerHTML = '<div class="no-hired-worker">This Gig has no hired worker.</div>';
    }
    
    // Reported By HTML (for reported and suspended gigs). Per-reporter list
    // is fetched on demand (loadGigReportsIntoCurrentGig) -- reportCount is
    // known immediately and shown as a fallback while that resolves.
    let reportedByHTML = '';
    if (gig.status === 'reported' || gig.status === 'suspended') {
        reportedByHTML = `
            <div class="reported-by-section">
                <div class="reported-by-label">REPORTED BY:</div>
                <div class="reported-by-info">${renderReportedByInfoHtml(gig)}</div>
            </div>
        `;
    }
    
    // Big Suspend HTML (for reported gigs only)
    let bigSuspendHTML = '';
    if (gig.status === 'reported') {
        bigSuspendHTML = `
            <div class="big-suspend-section">
                <div class="big-suspend-warning">
                    <div class="big-suspend-icon">⚠️</div>
                    <div class="big-suspend-text">
                        <strong>Action Required:</strong> This gig has been reported by users. Review the content and suspend if it violates community guidelines.
                    </div>
                </div>
                <button class="big-suspend-btn" id="overlayBigSuspendBtn">SUSPEND GIG</button>
            </div>
        `;
    }
    
    // Suspended By HTML (for suspended gigs)
    let suspendedByHTML = '';
    if (gig.status === 'suspended' && gig.suspendedBy) {
        const reasonLine = gig.suspendedBy.reason
            ? `<span class="suspend-reason">Reason: ${escapeHtml(gig.suspendedBy.reason)}</span>`
            : '';
        suspendedByHTML = `
            <div class="suspended-by-section">
                <div class="suspended-by-label">SUSPENDED BY:</div>
                <div class="suspended-by-info">
                    <div class="suspended-by-profile">
                        <img src="${GIG_MODERATION_FALLBACK_AVATAR}" alt="${escapeHtml(gig.suspendedBy.adminName)}" class="admin-avatar">
                        <div class="admin-details">
                            <span class="admin-name">${escapeHtml(gig.suspendedBy.adminName)}</span>
                            <span class="suspend-date">${escapeHtml(gig.suspendedBy.suspendDate)}</span>
                            ${reasonLine}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Permanent Delete HTML (for suspended gigs only)
    let permDeleteHTML = '';
    if (gig.status === 'suspended') {
        permDeleteHTML = `
            <div class="perm-delete-section">
                <div class="perm-delete-warning">
                    <div class="perm-delete-icon">⚠️</div>
                    <div class="perm-delete-text">
                        <strong>Danger Zone:</strong> This action cannot be undone. The gig will be permanently removed from the marketplace and database.
                    </div>
                </div>
                <button class="perm-delete-btn" id="overlayPermDeleteBtn">PERMANENTLY DELETE GIG</button>
            </div>
        `;
    }
    
    return `
        <div class="gig-overlay-body-content">
            <div class="gig-title">${escapeHtml(gig.title)}</div>
            
            ${gig.thumbnail ? `
                <div class="gig-photo-container">
                    <img src="${escapeHtml(gig.thumbnail)}" alt="Gig Photo" class="gig-photo">
                </div>
            ` : ''}
            
            <div class="gig-info-section">
                <div class="gig-info-row">
                    <div class="gig-info-item">
                        <div class="gig-info-label">DATE:</div>
                        <div class="gig-info-value">${escapeHtml(gig.jobDate || '—')}</div>
                    </div>
                    <div class="gig-info-item">
                        <div class="gig-info-label">TIME:</div>
                        <div class="gig-info-value">${gig.startTime ? `${escapeHtml(gig.startTime)} - ${escapeHtml(gig.endTime)}` : '—'}</div>
                    </div>
                </div>
                <div class="gig-info-row">
                    <div class="gig-info-item">
                        <div class="gig-info-label">REGION:</div>
                        <div class="gig-info-value">${escapeHtml(gig.region || '—')}</div>
                    </div>
                    <div class="gig-info-item">
                        <div class="gig-info-label">CITY:</div>
                        <div class="gig-info-value">${escapeHtml(gig.city || '—')}</div>
                    </div>
                </div>
                ${extrasHTML ? `<div class="gig-info-row">${extrasHTML}</div>` : ''}
            </div>
            
            <div class="gig-description-section">
                <div class="gig-description-label">DETAILS:</div>
                <div class="gig-description-text">${escapeHtml(gig.description)}</div>
            </div>
            
            <div class="gig-payment-section">
                <div class="gig-payment-row">
                    <div class="gig-payment-item">
                        <div class="gig-payment-label">PRICE:</div>
                        <div class="gig-payment-value">${gig.price !== '' ? `₱${gig.price}` : '₱—'}</div>
                    </div>
                    <div class="gig-payment-item">
                        <div class="gig-payment-label">GIG TYPE:</div>
                        <div class="gig-payment-value">${escapeHtml(gig.gigUseType || 'Personal')}</div>
                    </div>
                </div>
            </div>
            
            <div class="hired-worker-section">
                <div class="hired-worker-label">HIRED WORKER:</div>
                <div class="hired-worker-info">${hiredWorkerHTML}</div>
            </div>
            
            ${reportedByHTML}
            ${bigSuspendHTML}
            ${suspendedByHTML}
            ${permDeleteHTML}
        </div>
    `;
}

let gigSearchDebounceTimer = null;

function initializeGigSearch() {
    const searchInput = document.getElementById('gigsSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                clearTimeout(gigSearchDebounceTimer);
                performGigSearch();
            }
        });
        
        // Debounced so every keystroke doesn't fire a Firestore read.
        searchInput.addEventListener('input', function() {
            clearTimeout(gigSearchDebounceTimer);
            gigSearchDebounceTimer = setTimeout(performGigSearch, 400);
        });
    }
}

// Server-side prefix search across ALL gigs (any status) by title, so an
// admin can find something they spotted live even if it's not in the
// currently-loaded tab page. See searchGigsByTitlePrefix in firebase-db.js.
async function performGigSearch() {
    const rawQuery = document.getElementById('gigsSearchInput')?.value.trim() || '';
    const gigCardsList = document.getElementById('gigCardsList');
    if (!gigCardsList) return;

    if (!rawQuery) {
        // Empty box: back to the normal tab view.
        loadGigCards(currentGigTab);
        return;
    }

    gigCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a0aec0;">Searching…</div>';

    try {
        const results = (typeof searchGigsByTitlePrefix === 'function')
            ? await searchGigsByTitlePrefix(rawQuery)
            : [];
        const searchedGigs = results.map(r => normalizeGigForDisplay(r.id, r.data));

        // Swap allGigs so clicking a result still works via attachGigCardHandlers/loadGigDetails.
        allGigs = searchedGigs;

        if (searchedGigs.length === 0) {
            gigCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a0aec0;">No gigs found matching your search.</div>';
        } else {
            gigCardsList.innerHTML = searchedGigs.map(gig => generateGigCardHTML(gig)).join('');
            attachGigCardHandlers();
        }

        const gigsStats = document.getElementById('gigsStats');
        if (gigsStats) {
            gigsStats.textContent = `Found ${searchedGigs.length} gig${searchedGigs.length === 1 ? '' : 's'} matching "${rawQuery}"`;
        }

        const loadMoreBtn = document.getElementById('loadMoreGigsBtn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } catch (error) {
        console.error('❌ Gig search failed:', error);
        gigCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #e53e3e;">Search failed. Try again.</div>';
    }
}

// Reported/Suspended counts reflect the fully-loaded queue for that tab.
// Posted count reflects only what's been fetched so far this session (that
// tab paginates via Load More) -- an approximation, not the true live total,
// which is an accepted tradeoff to avoid a separate always-on counter read.
function updateTabCounts() {
    const postedCountEl = document.getElementById('postedCount');
    const reportedCountEl = document.getElementById('reportedCount');
    const suspendedCountEl = document.getElementById('suspendedCount');

    if (currentGigTab === 'posted' && postedCountEl) {
        postedCountEl.textContent = allGigs.length + (gigsPostedHasMore ? '+' : '');
    } else if (currentGigTab === 'reported' && reportedCountEl) {
        reportedCountEl.textContent = allGigs.length;
    } else if (currentGigTab === 'suspended' && suspendedCountEl) {
        suspendedCountEl.textContent = allGigs.length;
    }
}

// Handle resize to switch between overlay/panel views for Gig Moderation
window.addEventListener('resize', () => {
    // Only handle gig moderation section resizing if moderation is active
    if (currentActiveSection !== 'moderation') return;
    
    const gigOverlay = document.getElementById('gigDetailOverlay');
    
    if (window.innerWidth >= 888 && gigOverlay && gigOverlay.style.display === 'flex') {
        // Switched to desktop - hide overlay and show in panel
        hideGigOverlay();
        
        if (currentGigData) {
            populateGigDetailPanel(currentGigData);
        }
    } else if (window.innerWidth < 888 && currentGigData && document.getElementById('gigContent')?.style.display !== 'none') {
        // Switched to mobile - hide panel and show overlay
        if (currentGigData) {
            showGigOverlay(currentGigData);
        }
    }
});

// Helper function to switch sections (used for Contact -> Messages flow)
function switchAdminSection(sectionId) {
    // Cleanup overlays from previous section
    cleanupSectionOverlays();
    
    // Update current active section
    currentActiveSection = sectionId;
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`.menu-item[data-section="${sectionId}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Update page title
    updatePageTitle(sectionId);
}

// ===== STAT OVERLAY SYSTEM =====
// ⚠️ MOCK DATA WARNING: Remove this entire section when implementing Firebase real-time data

// localStorage keys for persistent mock data
// =============================================================================
// 🔥 FIREBASE INTEGRATION POINTS - MOCK DATA SIMULATION
// =============================================================================
// This section handles MOCK analytics data for simulation purposes only.
// When implementing Firebase, replace ALL functions in this section with Firebase queries.
//
// FIREBASE DATABASE STRUCTURE:
// /admin/
//   /analytics/
//     /users/
//       total: number              // Total registered users
//       new: number                // New members (unverified)
//       proVerified: number        // Pro verified count
//       businessVerified: number   // Business verified count
//       byAge/                     // Age distribution (18-25, 26-40, 41-59, 60+)
//         18_25: number
//         26_40: number
//         41_59: number
//         60plus: number
//       byRegion/                  // Regional distribution
//         luzon: number
//         visayas: number
//         mindanao: number
//     /verifications/
//       pending: number            // Pending verification requests
//       submissions/               // Individual submission records
//     /revenue/
//       monthly: number            // Current month revenue in PHP
//       transactions/              // Individual transaction records
//     /gigs/
//       reported/                  // Reported gigs with reportedBy arrays
//       suspended/                 // Suspended gigs with suspendedBy data
//     /lastUpdate: timestamp       // Last analytics update
// =============================================================================

// Initialize stat overlay system
async function initializeStatOverlays() {
    console.log('📊 Initializing stat overlay system...');
    
    try {
        // 🔥 Firebase Integration - Try to load analytics from Firebase
        if (typeof getAdminAnalytics === 'function' && typeof isFirebaseOnline === 'function' && isFirebaseOnline()) {
            try {
                console.log('🔥 Loading analytics from Firebase...');
                const analytics = await getAdminAnalytics();
                
                if (analytics) {
                    console.log('✅ Firebase analytics loaded:', analytics);
                    // Update display with Firebase data
                    updateStatCardsFromFirebase(analytics);
                } else {
                    console.warn('⚠️ No Firebase analytics returned');
                    updateStatCardsFromFirebase({
                        totalUsers: 0,
                        verificationSubmissions: 0,
                        monthlyRevenue: 0,
                        reportedGigs: 0
                    });
                }
            } catch (error) {
                console.error('❌ Firebase analytics error:', error);
                updateStatCardsFromFirebase({
                    totalUsers: 0,
                    verificationSubmissions: 0,
                    monthlyRevenue: 0,
                    reportedGigs: 0
                });
            }
        } else {
            console.warn('⚠️ Firebase analytics backend unavailable');
            updateStatCardsFromFirebase({
                totalUsers: 0,
                verificationSubmissions: 0,
                monthlyRevenue: 0,
                reportedGigs: 0
            });
        }
        
        console.log('✅ Stat cards display updated');

        // Gigs Analytics glance card (Total Gigs/Applications/Avg + Gig Use
        // Type) lives directly on the Overview grid, not behind a click, so
        // it loads here alongside the other stat cards rather than lazily
        // on overlay open like renderGigsAnalyticsOverlay().
        loadGigsAnalyticsGlanceCard();
        loadStorageUsageGlanceCard();
        loadUserActivityGlanceCard();
        loadTrafficCostsGlanceCard();
        attachOverviewSnapshotRefreshListeners();
        attachStorageBudgetListeners();

        // Attach click listeners to stat cards
        attachStatCardListeners();
        console.log('✅ Stat card listeners attached');
        
        // Attach overlay close listeners
        attachOverlayCloseListeners();
        console.log('✅ Overlay close listeners attached');
        
        // Initialize expandable sections
        initializeExpandableSections();
        console.log('✅ Expandable sections initialized');
        
        // Initialize dropdown filters
        initializeDropdownFilters();
        console.log('✅ Dropdown filters initialized');
        
        console.log('✅ Stat overlay system initialized successfully');
    } catch (error) {
        console.error('❌ CRITICAL ERROR in initializeStatOverlays:', error);
        console.error('Error stack:', error.stack);
        alert('⚠️ Dashboard initialization failed. Please open browser console (F12) and share the error message.');
    }
}

// Update stat cards from Firebase analytics data (writes directly to the DOM, no localStorage bridge)
function updateStatCardsFromFirebase(analytics) {
    const totalUsersEl = document.getElementById('totalUsersNumber');
    const verificationsEl = document.getElementById('verificationsNumber');
    const revenueEl = document.getElementById('revenueNumber');
    const gigsReportedEl = document.getElementById('gigsReportedNumber');

    if (totalUsersEl) totalUsersEl.textContent = (analytics.totalUsers || 0).toLocaleString();
    if (verificationsEl) verificationsEl.textContent = (analytics.verificationSubmissions || 0).toLocaleString();
    if (revenueEl) revenueEl.textContent = '₱' + (analytics.monthlyRevenue || 0).toLocaleString();
    if (gigsReportedEl) gigsReportedEl.textContent = (analytics.reportedGigs || 0).toLocaleString();

    console.log('✅ Firebase analytics stored for display');
}


// Attach click listeners to stat cards
function attachStatCardListeners() {
    const totalUsersCard = document.getElementById('totalUsersCard');
    const verificationsCard = document.getElementById('verificationsCard');
    const revenueCard = document.getElementById('revenueCard');
    const gigsReportedCard = document.getElementById('gigsReportedCard');
    const userActivityCard = document.getElementById('userActivityCard');
    const gigsAnalyticsCard = document.getElementById('gigsAnalyticsCard');
    const storageUsageCard = document.getElementById('storageUsageCard');
    const trafficCostsCard = document.getElementById('trafficCostsCard');
    
    if (totalUsersCard) {
        totalUsersCard.addEventListener('click', () => openStatOverlay('totalUsers'));
    }
    
    if (verificationsCard) {
        verificationsCard.addEventListener('click', () => openStatOverlay('verifications'));
    }
    
    if (revenueCard) {
        revenueCard.addEventListener('click', () => openStatOverlay('revenue'));
    }
    
    if (gigsReportedCard) {
        gigsReportedCard.addEventListener('click', () => openStatOverlay('gigsReported'));
    }
    
    if (userActivityCard) {
        userActivityCard.addEventListener('click', () => openStatOverlay('userActivity'));
    }
    
    if (gigsAnalyticsCard) {
        gigsAnalyticsCard.addEventListener('click', () => openStatOverlay('gigsAnalytics'));
    }
    
    if (storageUsageCard) {
        storageUsageCard.addEventListener('click', () => openStatOverlay('storageUsage'));
    }
    
    if (trafficCostsCard) {
        trafficCostsCard.addEventListener('click', () => openStatOverlay('trafficCosts'));
    }
}

// Attach overlay close listeners
function attachOverlayCloseListeners() {
    const closeButtons = [
        { id: 'closeTotalUsersOverlay', overlayId: 'totalUsersOverlay' },
        { id: 'closeVerificationsOverlay', overlayId: 'verificationsOverlay' },
        { id: 'closeRevenueOverlay', overlayId: 'revenueOverlay' },
        { id: 'closeGigsReportedOverlay', overlayId: 'gigsReportedOverlay' },
        { id: 'closeUserActivityOverlay', overlayId: 'userActivityOverlay' },
        { id: 'closeGigsAnalyticsOverlay', overlayId: 'gigsAnalyticsOverlay' },
        { id: 'closeStorageUsageOverlay', overlayId: 'storageUsageOverlay' },
        { id: 'closeTrafficCostsOverlay', overlayId: 'trafficCostsOverlay' }
    ];
    
    closeButtons.forEach(({ id, overlayId }) => {
        const btn = document.getElementById(id);
        const overlay = document.getElementById(overlayId);
        
        if (btn && overlay) {
            btn.addEventListener('click', () => closeStatOverlay(overlayId));
            
            // Close on overlay background click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeStatOverlay(overlayId);
                }
            });
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        const budgetOverlay = document.getElementById('storageBudgetOverlay');
        if (budgetOverlay && budgetOverlay.classList.contains('active')) {
            closeStorageBudgetOverlay();
            return;
        }
        const activeOverlay = document.querySelector('.stat-overlay.active');
        if (activeOverlay) {
            closeStatOverlay(activeOverlay.id);
        }
    });
}

// Open stat overlay
function openStatOverlay(type) {
    const overlays = {
        totalUsers: 'totalUsersOverlay',
        verifications: 'verificationsOverlay',
        revenue: 'revenueOverlay',
        gigsReported: 'gigsReportedOverlay',
        userActivity: 'userActivityOverlay',
        gigsAnalytics: 'gigsAnalyticsOverlay',
        storageUsage: 'storageUsageOverlay',
        trafficCosts: 'trafficCostsOverlay'
    };

    const overlayId = overlays[type];
    const overlay = document.getElementById(overlayId);

    if (overlay) {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll

        // NOTE: most overlay content isn't wired to a real data source yet.
        // Previously this populated the overlay from mock localStorage on a
        // recurring timer -- that's been removed. Once Firestore-backed
        // analytics exist, populate the overlay's fields here.
        if (type === 'gigsAnalytics') {
            renderGigsAnalyticsOverlay();
        } else if (type === 'totalUsers') {
            renderAgeGroupsBreakdown();
        } else if (type === 'storageUsage') {
            renderStorageUsageOverlay();
        } else if (type === 'userActivity') {
            renderUserActivityOverlay();
        } else if (type === 'trafficCosts') {
            renderTrafficCostsOverlay();
        }

        console.log(`Opened ${type} overlay`);
    }
}

// ============================================================================
// GIGS ANALYTICS OVERLAY (real Firestore wiring, 2026-08-05)
// ============================================================================
// Data source: two tiny Cloud Function-maintained counter docs
// (platform_analytics/gigs, platform_analytics/applications) -- see
// functions/index.js syncGigAnalyticsCountersOnCreate /
// syncApplicationAnalyticsCountersOnCreate. This overlay never scans the
// live jobs/applications collections. Loaded on-demand when the overlay
// opens (cheap: 2 doc reads), not on dashboard init.

// Canonical category value -> {icon, label} map, mirrors the picker list in
// new-post2.js (buildJobCategoryGrid) so admin-facing labels match what
// customers actually selected when posting.
const GIG_CATEGORY_DISPLAY = {
    aircon: { icon: '❄️', label: 'AC Cleaner' },
    hatod: { icon: '📦', label: 'Transporter' },
    solicitor: { icon: '📣', label: 'Solicitor' },
    limpyo: { icon: '🧹', label: 'Basic Cleaner' },
    plumber: { icon: '🚰', label: 'Plumber' },
    handyman: { icon: '🛠️', label: 'Handyman' },
    gardner: { icon: '👩🏻\u200d🌾', label: 'Gardner' },
    electrician: { icon: '⚡', label: 'Electrician' },
    mechanic: { icon: '👨🏻\u200d🔧', label: 'Mechanic' },
    hakot: { icon: '🚚', label: 'Movers' },
    clerical: { icon: '🗂️', label: 'Clerical' },
    staff: { icon: '🙋🏻', label: 'Assistant' },
    ittech: { icon: '🛜', label: 'IT Tech' },
    researcher: { icon: '🔍', label: 'Researcher' },
    accountant: { icon: '💰', label: 'Accountant' },
    marketer: { icon: '📊', label: 'Marketer' },
    tindera: { icon: '🏪', label: 'Tindera' },
    reception: { icon: '👩🏻\u200d💼', label: 'Reception' },
    waiter: { icon: '💁🏻\u200d♂️', label: 'Waiter' },
    security: { icon: '👮🏻', label: 'Security' },
    driver: { icon: '🚗', label: 'Driver' },
    tourguide: { icon: '🧭', label: 'Tour Guide' },
    trainer: { icon: '🏃', label: 'Trainer' },
    chef: { icon: '👩🏻\u200d🍳', label: 'Chef' },
    realtor: { icon: '🏡', label: 'Realtor' },
    hugas: { icon: '🍽️', label: 'Washer' },
    laba: { icon: '👕', label: 'Laba' },
    luto: { icon: '🍳', label: 'Cook' },
    kompra: { icon: '🛒', label: 'Shopper' },
    barber: { icon: '💇🏻', label: 'Barber' },
    bantay: { icon: '👁️', label: 'Bantay' },
    pila: { icon: '🧍🏻', label: 'Line-Up' },
    tutor: { icon: '📚', label: 'Tutor' },
    massage: { icon: '💆🏻\u200d♀️', label: 'Massager' },
    petcare: { icon: '🐾', label: 'Pet Care' },
    builder: { icon: '👷🏻', label: 'Builder' },
    carpenter: { icon: '🔨', label: 'Carpenter' },
    painter: { icon: '🖌️', label: 'Painter' },
    engineer: { icon: '⚙️', label: 'Engineer' },
    architect: { icon: '🏛️', label: 'Architect' },
    landscaper: { icon: '🌿', label: 'Landscaper' },
    photographer: { icon: '📷', label: 'Photographer' },
    videographer: { icon: '🎥', label: 'Videographer' },
    editor: { icon: '🎬', label: 'Editor' },
    artist: { icon: '🖼️', label: 'Artist' },
    musician: { icon: '🎵', label: 'Musician' },
    performer: { icon: '💃🏻', label: 'Performer' },
    creative: { icon: '✨', label: 'Creative' },
    tailor: { icon: '✂️', label: 'Tailor' },
    social: { icon: '📱', label: 'Social' },
    doctor: { icon: '🧑🏻\u200d⚕️', label: 'Doctor' },
    nurse: { icon: '❤️\u200d🩹', label: 'Nurse' },
    lawyer: { icon: '⚖️', label: 'Lawyer' },
    consultant: { icon: '💼', label: 'Consultant' },
    therapist: { icon: '🧘🏻', label: 'Therapist' },
    programmer: { icon: '💻', label: 'Programmer' }
};

function getGigCategoryDisplay(categoryKey) {
    const known = GIG_CATEGORY_DISPLAY[categoryKey];
    if (known) return known;
    if (categoryKey === 'uncategorized' || !categoryKey) {
        return { icon: '❓', label: 'Uncategorized' };
    }
    // Fallback for any category key not in the map yet: title-case the raw key.
    const label = categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
    return { icon: '📦', label };
}

// Render a sorted list of {icon, label, value} into a container using the
// generic .breakdown-item / .breakdown-bar-container markup (scales to any
// number of categories, unlike a fixed per-category card grid).
function renderCategoryBreakdownList(containerId, byCategoryMap, emptyMessage, maxRows = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const entries = Object.keys(byCategoryMap || {})
        .map((key) => ({ key, count: Number(byCategoryMap[key]) || 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count);

    if (entries.length === 0) {
        container.innerHTML = `<div class="breakdown-empty-note">${emptyMessage}</div>`;
        return;
    }

    const total = entries.reduce((sum, entry) => sum + entry.count, 0);
    const topEntries = entries.slice(0, maxRows);
    const remainder = entries.slice(maxRows);
    const remainderCount = remainder.reduce((sum, entry) => sum + entry.count, 0);

    const rowsHtml = topEntries.map((entry) => {
        const display = getGigCategoryDisplay(entry.key);
        const percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
        return `
            <div class="breakdown-item">
                <div class="breakdown-bar-container">
                    <span class="breakdown-label">${display.icon} ${display.label}</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="breakdown-value">${entry.count.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');

    const remainderHtml = remainderCount > 0 ? `
        <div class="breakdown-item">
            <div class="breakdown-bar-container">
                <span class="breakdown-label">📦 Other (${remainder.length})</span>
                <div class="breakdown-bar">
                    <div class="breakdown-bar-fill" style="width: ${Math.round((remainderCount / total) * 100)}%;"></div>
                </div>
                <span class="breakdown-value">${remainderCount.toLocaleString()}</span>
            </div>
        </div>
    ` : '';

    container.innerHTML = rowsHtml + remainderHtml;
}

// Maps each of the 17 official region names (must match PH_REGION_NAMES in
// functions/index.js and public/js/ph-regions-geo.js) to its island group,
// for the quick-glance Luzon/Visayas/Mindanao pie chart. "unknown" (never
// shared location, or hasn't reached the explainer yet) is deliberately
// excluded from island totals -- it's shown only as its own row in the full
// breakdown list below, not folded into a fake 4th island.
const PH_REGION_ISLAND_GROUP = {
  'Ilocos Region': 'luzon',
  'Cagayan Valley': 'luzon',
  'Central Luzon': 'luzon',
  'Calabarzon': 'luzon',
  'Bicol Region': 'luzon',
  'NCR (Metro Manila)': 'luzon',
  'CAR (Cordillera)': 'luzon',
  'Mimaropa': 'luzon',
  'Western Visayas': 'visayas',
  'Central Visayas': 'visayas',
  'Eastern Visayas': 'visayas',
  'Zamboanga Peninsula': 'mindanao',
  'Northern Mindanao': 'mindanao',
  'Davao Region': 'mindanao',
  'Soccsksargen': 'mindanao',
  'Caraga': 'mindanao',
  'BARMM': 'mindanao'
};

function renderRegionBreakdownList(byRegion) {
    const container = document.getElementById('regionBreakdownList');
    if (!container) return;

    const entries = Object.keys(byRegion || {})
        .map((name) => ({ name, count: Number(byRegion[name]) || 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count);

    if (entries.length === 0) {
        container.innerHTML = '<div class="breakdown-empty-note">No location data yet.</div>';
        return;
    }

    const total = entries.reduce((sum, entry) => sum + entry.count, 0);
    container.innerHTML = entries.map((entry) => {
        // 'unknown' = never shared/declined (no data at all). 'Overseas' =
        // shared a REAL location, just not one of the 17 PH regions --
        // deliberately kept distinct so this stat doesn't lump "didn't
        // answer" and "answered, lives abroad" together. See
        // ph-regions-geo.js classifyCoordinateToRegion.
        const icon = entry.name === 'unknown' ? '❔' : entry.name === 'Overseas' ? '🌏' : '📍';
        const label = entry.name === 'unknown' ? 'Not shared / unknown' : entry.name;
        const percentage = total > 0 ? Math.round((entry.count / total) * 100) : 0;
        return `
            <div class="breakdown-item">
                <div class="breakdown-bar-container">
                    <span class="breakdown-label">${icon} ${label}</span>
                    <div class="breakdown-bar">
                        <div class="breakdown-bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                    <span class="breakdown-value">${entry.count.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// TOTAL USERS OVERLAY — AGE GROUPS + ACCOUNT TYPES + REGIONAL DISTRIBUTION
// (real Firestore wiring, 2026-08-06)
// ============================================================================
// Data source: platform_analytics/users (byAgeGroup, byAccountType,
// byRegion), maintained by syncUserAnalyticsCountersOnWrite +
// submitSignupLocation in functions/index.js.
// Age Groups buckets match the 4 existing cards: 18-25 / 26-40 / 41-59 / 60+.
// Account Types collapses what used to be two independently-mocked splits
// ("User Status": New Members/ID Verified, and "Account Types": New
// Member/Pro Verified/Business Verified) into ONE real counter doc, per
// docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md -- both UI spots now read the
// same New/Pro/Business numbers instead of two independent (and previously
// inconsistent, since both were hand-typed mock values) data paths.
// Regional Distribution: partial coverage by design (GPS is opt-in, once at
// signup) -- a glance stat, not a census. "unknown" covers declined/pending
// (never shared, no data at all). "Overseas" is a real, successfully-shared
// location that's just outside the 17 PH regions -- it counts toward
// regionKnownTotal ("LOCATION SHARED") below but is deliberately excluded
// from the Luzon/Visayas/Mindanao pie since it isn't a PH island group.
async function renderAgeGroupsBreakdown() {
    if (typeof isFirebaseOnline !== 'function' || !isFirebaseOnline()) {
        console.warn('⚠️ Total Users breakdowns: Firebase offline, skipping load');
        return;
    }
    if (typeof getPlatformAnalyticsUsers !== 'function') {
        console.warn('⚠️ Total Users breakdowns: analytics function unavailable');
        return;
    }

    try {
        const usersAnalytics = await getPlatformAnalyticsUsers();
        const byAgeGroup = usersAnalytics.byAgeGroup || {};
        const byAccountType = usersAnalytics.byAccountType || {};
        const byRegion = usersAnalytics.byRegion || {};

        setElementValue('age18_25Value', (Number(byAgeGroup['18-25']) || 0).toLocaleString());
        setElementValue('age26_40Value', (Number(byAgeGroup['26-40']) || 0).toLocaleString());
        setElementValue('age41_59Value', (Number(byAgeGroup['41-59']) || 0).toLocaleString());
        setElementValue('age60PlusValue', (Number(byAgeGroup['60+']) || 0).toLocaleString());

        const newCount = Number(byAccountType.new) || 0;
        const proCount = Number(byAccountType.pro) || 0;
        const businessCount = Number(byAccountType.business) || 0;
        const accountTypeTotal = newCount + proCount + businessCount;

        // "Account Types" breakdown (the fuller, correctly-labeled 3-way split)
        setElementValue('newMemberLegend', newCount.toLocaleString());
        setElementValue('proVerifiedLegend', proCount.toLocaleString());
        setElementValue('businessVerifiedLegend', businessCount.toLocaleString());
        setElementValue('accountTypePieTotal', accountTypeTotal.toLocaleString());
        if (typeof updatePieChart === 'function') {
            updatePieChart('accountTypePieChart', [
                { value: newCount, color: '#6c5ce7' },
                { value: proCount, color: '#00b894' },
                { value: businessCount, color: '#ff6b6b' }
            ]);
        }

        // Top "USER STATUS" glance card -- same underlying numbers, just
        // reads New Member count directly and folds Pro+Business together
        // into a single "Verified" figure for a quick at-a-glance summary.
        setElementValue('usersNewDisplay', newCount.toLocaleString());
        setElementValue('usersVerifiedDisplay', (proCount + businessCount).toLocaleString());

        // Regional Distribution -- island-group quick glance + pie, full
        // 17-region breakdown list below it.
        let luzonCount = 0, visayasCount = 0, mindanaoCount = 0;
        let regionKnownTotal = 0;
        Object.keys(byRegion).forEach((name) => {
            const count = Number(byRegion[name]) || 0;
            if (name === 'unknown') return;
            regionKnownTotal += count;
            const group = PH_REGION_ISLAND_GROUP[name];
            if (group === 'luzon') luzonCount += count;
            else if (group === 'visayas') visayasCount += count;
            else if (group === 'mindanao') mindanaoCount += count;
        });
        setElementValue('luzonLegend', luzonCount.toLocaleString());
        setElementValue('visayasLegend', visayasCount.toLocaleString());
        setElementValue('mindanaoLegend', mindanaoCount.toLocaleString());
        setElementValue('regionPieTotal', regionKnownTotal.toLocaleString());
        if (typeof updatePieChart === 'function' && regionKnownTotal > 0) {
            updatePieChart('regionPieChart', [
                { value: luzonCount, color: '#ff6b6b' },
                { value: visayasCount, color: '#4ecdc4' },
                { value: mindanaoCount, color: '#ffd93d' }
            ]);
        }
        renderRegionBreakdownList(byRegion);

        console.log('✅ Total Users breakdowns populated from platform_analytics/users', { byAgeGroup, byAccountType, byRegion });
    } catch (error) {
        console.error('❌ Error rendering Total Users breakdowns:', error);
    }
}

// Glance card on the main Overview grid (not the overlay) — shows the same
// Total Gigs/Applications/Avg + Gig Use Type split at a glance, before the
// admin even clicks in. Loads once on dashboard init (cheap: 2 doc reads).
async function loadGigsAnalyticsGlanceCard() {
    if (typeof isFirebaseOnline !== 'function' || !isFirebaseOnline()) {
        console.warn('⚠️ Gigs Analytics glance card: Firebase offline, skipping load');
        return;
    }
    if (typeof getPlatformAnalyticsGigs !== 'function' || typeof getPlatformAnalyticsApplications !== 'function') {
        console.warn('⚠️ Gigs Analytics glance card: analytics functions unavailable');
        return;
    }

    try {
        const [gigsAnalytics, applicationsAnalytics] = await Promise.all([
            getPlatformAnalyticsGigs(),
            getPlatformAnalyticsApplications()
        ]);

        const totalGigs = gigsAnalytics.totalPosted || 0;
        const totalApplications = applicationsAnalytics.totalApplications || 0;
        const avgPerGig = totalGigs > 0 ? (totalApplications / totalGigs) : 0;

        setElementValue('totalGigsPosted', totalGigs.toLocaleString());
        setElementValue('totalApplicants', totalApplications.toLocaleString());
        setElementValue('avgApplicantsPerGig', avgPerGig.toFixed(1));

        const byGigUseType = gigsAnalytics.byGigUseType || {};
        const personalCount = Number(byGigUseType.Personal) || 0;
        const businessCount = Number(byGigUseType.Business) || 0;
        const gigUseTypeTotal = personalCount + businessCount;
        const personalPct = gigUseTypeTotal > 0 ? Math.round((personalCount / gigUseTypeTotal) * 100) : 0;
        const businessPct = gigUseTypeTotal > 0 ? Math.round((businessCount / gigUseTypeTotal) * 100) : 0;

        setElementValue('gigsCardPersonalCount', personalCount.toLocaleString());
        setElementValue('gigsCardBusinessCount', businessCount.toLocaleString());
        setElementValue('gigsCardPersonalPercent', `${personalPct}%`);
        setElementValue('gigsCardBusinessPercent', `${businessPct}%`);

        console.log('✅ Gigs Analytics glance card populated', { totalGigs, totalApplications, personalCount, businessCount });
    } catch (error) {
        console.error('❌ Error loading Gigs Analytics glance card:', error);
    }
}

async function renderGigsAnalyticsOverlay() {
    if (typeof isFirebaseOnline !== 'function' || !isFirebaseOnline()) {
        console.warn('⚠️ Gigs Analytics: Firebase offline, skipping load');
        return;
    }
    if (typeof getPlatformAnalyticsGigs !== 'function' || typeof getPlatformAnalyticsApplications !== 'function') {
        console.warn('⚠️ Gigs Analytics: analytics functions unavailable');
        return;
    }

    try {
        const [gigsAnalytics, applicationsAnalytics] = await Promise.all([
            getPlatformAnalyticsGigs(),
            getPlatformAnalyticsApplications()
        ]);

        const totalGigs = gigsAnalytics.totalPosted || 0;
        const totalApplications = applicationsAnalytics.totalApplications || 0;
        const avgPerGig = totalGigs > 0 ? (totalApplications / totalGigs) : 0;

        setElementValue('gigsOverlayTotalGigs', totalGigs.toLocaleString());
        setElementValue('gigsOverlayTotalApplicants', totalApplications.toLocaleString());
        setElementValue('gigsOverlayAvgPerGig', avgPerGig.toFixed(1));

        renderCategoryBreakdownList('gigsPostedBreakdownList', gigsAnalytics.byCategory, 'No gigs posted yet.');
        renderCategoryBreakdownList('applicationsBreakdownList', applicationsAnalytics.byCategory, 'No applications yet.');

        const byGigUseType = gigsAnalytics.byGigUseType || {};
        const personalCount = Number(byGigUseType.Personal) || 0;
        const businessCount = Number(byGigUseType.Business) || 0;
        const gigUseTypeTotal = personalCount + businessCount;
        const personalPct = gigUseTypeTotal > 0 ? (personalCount / gigUseTypeTotal) * 100 : 0;
        const businessPct = gigUseTypeTotal > 0 ? (businessCount / gigUseTypeTotal) * 100 : 0;

        setElementValue('gigUseTypePersonalValue', personalCount.toLocaleString());
        setElementValue('gigUseTypeBusinessValue', businessCount.toLocaleString());
        const personalBar = document.getElementById('gigUseTypePersonalBar');
        const businessBar = document.getElementById('gigUseTypeBusinessBar');
        if (personalBar) personalBar.style.width = `${personalPct}%`;
        if (businessBar) businessBar.style.width = `${businessPct}%`;

        console.log('✅ Gigs Analytics overlay populated from platform_analytics', {
            totalGigs, totalApplications, personalCount, businessCount
        });
    } catch (error) {
        console.error('❌ Error rendering Gigs Analytics overlay:', error);
    }
}

// ============================================================================
// STORAGE USAGE (Phase 7 Ch 1)
// ============================================================================
// Data source: platform_analytics/storage (Storage finalize/delete triggers
// + one-time seed). One doc read. Never lists the bucket.
// Published Standard regional estimate: $0.020 / GB-month.

const STORAGE_USD_PER_GB_MONTH = 0.020;
const STORAGE_FREE_BYTES = 5 * 1024 * 1024 * 1024;

function formatStorageBytes(bytes) {
    const n = Math.max(0, Number(bytes) || 0);
    if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    if (n >= 1024) return `${Math.round(n / 1024)} KB`;
    return `${n} B`;
}

function formatStorageDelta(bytes) {
    const n = Number(bytes) || 0;
    const sign = n > 0 ? '+' : n < 0 ? '−' : '';
    return `${sign}${formatStorageBytes(Math.abs(n))}`;
}

function estimateStorageUsd(bytes) {
    const billable = Math.max(0, (Number(bytes) || 0) - STORAGE_FREE_BYTES);
    return (billable / (1024 * 1024 * 1024)) * STORAGE_USD_PER_GB_MONTH;
}

function applyStorageGrowthTiles(storageAnalytics) {
    const totalBytes = Math.max(0, Number(storageAnalytics && storageAnalytics.totalBytes) || 0);
    const growth = (storageAnalytics && storageAnalytics.growth) || {};
    const monthStart = Math.max(0, Number(growth.monthStartBytes) || 0);
    const hasAnchor = Boolean(growth.monthKey);
    const monthDelta = hasAnchor ? totalBytes - monthStart : 0;

    setElementValue('storageGrowthMonth', hasAnchor ? formatStorageDelta(monthDelta) : '—');
    const startLabel = growth.monthStartAt
        ? new Date(growth.monthStartAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '';
    setElementValue('storageGrowthMonthNote', hasAnchor
        ? (startLabel ? `since ${startLabel} (Manila)` : 'since month stamp')
        : 'waiting for first stamp');

    const closed = Object.keys(growth.months || {}).map((key) => {
        const row = growth.months[key];
        return (Number(row.endBytes) || 0) - (Number(row.startBytes) || 0);
    });
    if (closed.length) {
        const avg = closed.reduce((sum, value) => sum + value, 0) / closed.length;
        setElementValue('storageGrowthAvg', formatStorageDelta(avg));
    } else {
        setElementValue('storageGrowthAvg', '—');
    }

    setElementValue('storageGrowthAllTime', formatStorageBytes(totalBytes));
    setElementValue('storageAllTimeCost', `(${formatStorageUsd(estimateStorageUsd(totalBytes))})`);
    applyStorageBudgetTile(totalBytes, storageAnalytics && storageAnalytics.budgetUsdPerMonth);
}

function applyStorageBudgetTile(totalBytes, budgetUsd) {
    const input = document.getElementById('storageBudgetInput');
    const hasBudget = budgetUsd !== null && budgetUsd !== undefined && Number.isFinite(Number(budgetUsd));
    if (input && document.activeElement !== input) {
        input.value = hasBudget ? String(Number(budgetUsd)) : '';
    }
    if (!hasBudget) {
        setElementValue('storageBudgetAmount', '—');
        setElementValue('storageBudgetNote', 'set a $ / month');
        return;
    }
    const remaining = Number(budgetUsd) - estimateStorageUsd(totalBytes);
    if (remaining < 0) {
        setElementValue('storageBudgetAmount', '$0.00');
        setElementValue('storageBudgetNote', 'over monthly budget');
        return;
    }
    setElementValue('storageBudgetAmount', formatStorageUsd(remaining));
    setElementValue('storageBudgetNote', 'monthly budget remaining');
}

function formatStorageUsd(usd) {
    const n = Math.max(0, Number(usd) || 0);
    if (n <= 0) return '$0.00';
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(2)}`;
}

function applyStorageTypeRow(prefix, row, totalBytes) {
    const bytes = Math.max(0, Number(row && row.bytes) || 0);
    const files = Math.max(0, Number(row && row.files) || 0);
    const pct = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0;
    setElementValue(`${prefix}Count`, files.toLocaleString());
    setElementValue(`${prefix}Size`, `(${formatStorageBytes(bytes)})`);
    setElementValue(`${prefix}Percent`, `${pct}%`);
}

async function loadStorageUsageGlanceCard() {
    if (typeof isFirebaseOnline !== 'function' || !isFirebaseOnline()) {
        console.warn('⚠️ Storage Usage glance card: Firebase offline, skipping load');
        return;
    }
    if (typeof getPlatformAnalyticsStorage !== 'function') {
        console.warn('⚠️ Storage Usage glance card: analytics function unavailable');
        return;
    }

    try {
        const storageAnalytics = await getPlatformAnalyticsStorage();
        const totalBytes = storageAnalytics.totalBytes || 0;
        setElementValue('totalStorageUsed', formatStorageBytes(totalBytes));
        setElementValue('storageCostEstimate', `est. ${formatStorageUsd(estimateStorageUsd(totalBytes))} / month after 5 GB free`);
        console.log('✅ Storage Usage glance card populated', {
            totalBytes,
            totalFiles: storageAnalytics.totalFiles || 0
        });
    } catch (error) {
        console.error('❌ Error loading Storage Usage glance card:', error);
    }
}

async function renderStorageUsageOverlay() {
    if (typeof isFirebaseOnline !== 'function' || !isFirebaseOnline()) {
        console.warn('⚠️ Storage Usage: Firebase offline, skipping load');
        return;
    }
    if (typeof getPlatformAnalyticsStorage !== 'function') {
        console.warn('⚠️ Storage Usage: analytics function unavailable');
        return;
    }

    try {
        const [storageAnalytics, budgetDoc] = await Promise.all([
            getPlatformAnalyticsStorage(),
            typeof getStorageBudget === 'function'
                ? getStorageBudget()
                : Promise.resolve({ budgetUsdPerMonth: null })
        ]);
        const totalBytes = storageAnalytics.totalBytes || 0;
        const totalFiles = storageAnalytics.totalFiles || 0;
        const byType = storageAnalytics.byType || {};
        const estUsd = estimateStorageUsd(totalBytes);
        storageAnalytics.budgetUsdPerMonth = budgetDoc && budgetDoc.budgetUsdPerMonth;

        setElementValue('storageOverlayTotal', formatStorageBytes(totalBytes));
        setElementValue('storageOverlayMediaCount', totalFiles.toLocaleString());
        setElementValue('storageOverlayMediaSize', formatStorageBytes(totalBytes));
        setElementValue('storageOverlayCost', formatStorageUsd(estUsd));

        applyStorageTypeRow('profilePhotos', byType.profile, totalBytes);
        applyStorageTypeRow('gigPhotos', byType.gig, totalBytes);
        applyStorageTypeRow('idVerifications', byType.id, totalBytes);
        applyStorageTypeRow('otherFiles', byType.other, totalBytes);
        applyStorageGrowthTiles(storageAnalytics);

        console.log('✅ Storage Usage overlay populated from platform_analytics/storage', {
            totalBytes, totalFiles
        });
    } catch (error) {
        console.error('❌ Error rendering Storage Usage overlay:', error);
    }
}

function formatSessionDuration(seconds) {
    const s = Math.max(0, Math.round(Number(seconds) || 0));
    const m = Math.floor(s / 60);
    return `${m}m ${s % 60}s`;
}

function applyUserActivitySnapshot(activity) {
    const data = activity || {};
    setElementValue('androidDeviceCount', Number(data.androidCount || 0).toLocaleString());
    setElementValue('iphoneDeviceCount', Number(data.iphoneCount || 0).toLocaleString());
    setElementValue('androidDevicePercent', `${Number(data.androidPercent || 0)}%`);
    setElementValue('iphoneDevicePercent', `${Number(data.iphonePercent || 0)}%`);
    setElementValue('avgSessionDuration', formatSessionDuration(data.avgSessionSeconds));
    setElementValue('peakHoursDisplay', data.peakHoursLabel || 'N/A');

    setElementValue('userActivityMobilePercent', `${Number(data.mobilePercent || 0)}%`);
    setElementValue('userActivityDesktopPercent', `${Number(data.desktopPercent || 0)}%`);
    setElementValue('androidBreakdownPercent', `${Number(data.androidPercent || 0)}%`);
    setElementValue('iphoneBreakdownPercent', `${Number(data.iphonePercent || 0)}%`);
    setElementValue('userActivityRepeatPercent', `${Number(data.repeatPercent || 0)}%`);
    setElementValue('userActivityBounceRate', `${Number(data.bounceRate || 0)}%`);
    setElementValue('avgSessionOverlayDisplay', formatSessionDuration(data.avgSessionSeconds));

    const browsers = data.browsers || {};
    setElementValue('chromePercent', `${Number(browsers.chrome || 0)}%`);
    setElementValue('safariPercent', `${Number(browsers.safari || 0)}%`);
    setElementValue('firefoxPercent', `${Number(browsers.firefox || 0)}%`);
    setElementValue('edgePercent', `${Number(browsers.edge || 0)}%`);
    setElementValue('messengerPercent', `${Number(browsers.messenger || 0)}%`);
    setElementValue('otherBrowserPercent', `${Number(browsers.other || 0)}%`);

    const peaks = data.peakBuckets || {};
    setElementValue('morningUsersCount', Number(peaks.morning || 0).toLocaleString());
    setElementValue('afternoonUsersCount', Number(peaks.afternoon || 0).toLocaleString());
    setElementValue('eveningUsersCount', Number(peaks.evening || 0).toLocaleString());
    setElementValue('nightUsersCount', Number(peaks.night || 0).toLocaleString());
}

function applyTrafficSnapshot(traffic) {
    const data = traffic || {};
    const breakdown = data.costBreakdown || {};
    const totalUsd = Number(data.costUsd || 0);
    setElementValue('bandwidthUsageMTD', formatStorageBytes(data.bandwidthBytes || 0));
    setElementValue('firebaseCostMTD', formatStorageUsd(totalUsd));
    setElementValue('trafficOverlayBandwidth', formatStorageBytes(data.bandwidthBytes || 0));
    setElementValue('trafficOverlayReads', Number(data.firestoreReads || 0).toLocaleString());
    setElementValue('trafficOverlayWrites', Number(data.firestoreWrites || 0).toLocaleString());
    setElementValue('trafficOverlayCost', formatStorageUsd(totalUsd));

    const dbUsd = Number(breakdown.database || 0);
    const storageUsd = Number(breakdown.storage || 0);
    const bandwidthUsd = Number(breakdown.bandwidth || 0);
    const authUsd = Number(breakdown.auth || 0);
    setElementValue('dbOperationsCostValue', formatStorageUsd(dbUsd));
    setElementValue('storageCostValue', formatStorageUsd(storageUsd));
    setElementValue('bandwidthCostValue', formatStorageUsd(bandwidthUsd));
    setElementValue('authCostValue', formatStorageUsd(authUsd));
    setElementValue('dbOperationsCostPercent', `${totalUsd > 0 ? Math.round((dbUsd / totalUsd) * 100) : 0}%`);
    setElementValue('storageCostPercent', `${totalUsd > 0 ? Math.round((storageUsd / totalUsd) * 100) : 0}%`);
    setElementValue('bandwidthCostPercent', `${totalUsd > 0 ? Math.round((bandwidthUsd / totalUsd) * 100) : 0}%`);
    setElementValue('authCostPercent', `${totalUsd > 0 ? Math.round((authUsd / totalUsd) * 100) : 0}%`);
}

function snapshotStatusMessage(kind, status) {
    if (status === 'ok') return 'Snapshot updated.';
    if (status === 'needs_ga4') return 'Google Analytics is not linked yet. Enable it in Firebase Console and send the G- ID.';
    if (status === 'empty' && kind === 'activity') return 'No Analytics traffic yet. Card stays at 0 until GA has sessions.';
    if (status === 'needs_monitoring') return 'Cloud Monitoring did not return usage. Check project IAM.';
    if (status === 'error') return 'Snapshot refresh failed. Try again.';
    return 'Snapshot saved.';
}

async function loadUserActivityGlanceCard() {
    if (typeof getPlatformAnalyticsUserActivity !== 'function') return;
    try {
        applyUserActivitySnapshot(await getPlatformAnalyticsUserActivity());
    } catch (error) {
        console.error('❌ Error loading User Activity glance card:', error);
    }
}

async function renderUserActivityOverlay() {
    if (typeof getPlatformAnalyticsUserActivity !== 'function') return;
    try {
        applyUserActivitySnapshot(await getPlatformAnalyticsUserActivity());
    } catch (error) {
        console.error('❌ Error rendering User Activity overlay:', error);
    }
}

async function loadTrafficCostsGlanceCard() {
    if (typeof getPlatformAnalyticsTraffic !== 'function') return;
    try {
        applyTrafficSnapshot(await getPlatformAnalyticsTraffic());
    } catch (error) {
        console.error('❌ Error loading Traffic glance card:', error);
    }
}

async function renderTrafficCostsOverlay() {
    if (typeof getPlatformAnalyticsTraffic !== 'function') return;
    try {
        applyTrafficSnapshot(await getPlatformAnalyticsTraffic());
    } catch (error) {
        console.error('❌ Error rendering Traffic overlay:', error);
    }
}

async function handleOverviewSnapshotRefresh(kind) {
    const isActivity = kind === 'activity';
    const buttonId = isActivity ? 'refreshUserActivitySnapshot' : 'refreshTrafficSnapshot';
    const button = document.getElementById(buttonId);
    if (button) button.disabled = true;
    try {
        const result = isActivity
            ? await refreshUserActivitySnapshot()
            : await refreshTrafficSnapshot();
        if (!result || !result.success) {
            showToast((result && result.message) || 'Refresh failed', 'error');
            return;
        }
        if (isActivity) {
            await loadUserActivityGlanceCard();
            await renderUserActivityOverlay();
        } else {
            await loadTrafficCostsGlanceCard();
            await renderTrafficCostsOverlay();
        }
        showToast(
            snapshotStatusMessage(kind, result.status),
            result.status === 'ok' ? 'success' : 'info',
            4000
        );
    } catch (error) {
        showToast(error.message || 'Refresh failed', 'error');
    } finally {
        if (button) button.disabled = false;
    }
}

function parseStorageBudgetInput(raw) {
    const text = String(raw == null ? '' : raw).trim();
    if (!text) return { ok: true, value: null };
    const n = Number(text);
    if (!Number.isFinite(n) || n < 0 || n > 9999) {
        return { ok: false, value: null };
    }
    return { ok: true, value: Math.round(n * 100) / 100 };
}

async function handleStorageBudgetSave() {
    const input = document.getElementById('storageBudgetInput');
    const button = document.getElementById('storageBudgetSaveBtn');
    if (!input || typeof saveStorageBudget !== 'function') return;
    const parsed = parseStorageBudgetInput(input.value);
    if (!parsed.ok) {
        showToast('Enter a $ / month of 0 or more.', 'error');
        return;
    }
    if (button) button.disabled = true;
    try {
        const success = await saveStorageBudget(parsed.value);
        if (!success) {
            showToast('Could not save budget. Super admin only.', 'error');
            return;
        }
        await renderStorageUsageOverlay();
        closeStorageBudgetOverlay();
        showToast(
            parsed.value === null ? 'Storage budget cleared.' : `Storage budget set to ${formatStorageUsd(parsed.value)} / month.`,
            'success'
        );
    } catch (error) {
        showToast(error.message || 'Could not save budget.', 'error');
    } finally {
        if (button) button.disabled = false;
    }
}

function openStorageBudgetOverlay() {
    const overlay = document.getElementById('storageBudgetOverlay');
    if (!overlay) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    const input = document.getElementById('storageBudgetInput');
    if (input) {
        setTimeout(() => input.focus(), 0);
    }
}

function closeStorageBudgetOverlay() {
    const overlay = document.getElementById('storageBudgetOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

function attachStorageBudgetListeners() {
    const card = document.getElementById('storageBudgetCard');
    const button = document.getElementById('storageBudgetSaveBtn');
    const input = document.getElementById('storageBudgetInput');
    const closeBtn = document.getElementById('closeStorageBudgetBtn');
    const overlay = document.getElementById('storageBudgetOverlay');
    if (card && !card.dataset.bound) {
        card.dataset.bound = '1';
        card.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openStorageBudgetOverlay();
        });
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openStorageBudgetOverlay();
            }
        });
    }
    if (button && !button.dataset.bound) {
        button.dataset.bound = '1';
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleStorageBudgetSave();
        });
    }
    if (closeBtn && !closeBtn.dataset.bound) {
        closeBtn.dataset.bound = '1';
        closeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            closeStorageBudgetOverlay();
        });
    }
    if (overlay && !overlay.dataset.bound) {
        overlay.dataset.bound = '1';
        overlay.addEventListener('click', (event) => {
            if (event.target.id === 'storageBudgetOverlay') {
                closeStorageBudgetOverlay();
            }
        });
    }
    if (input && !input.dataset.bound) {
        input.dataset.bound = '1';
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleStorageBudgetSave();
            }
        });
    }
}

function attachOverviewSnapshotRefreshListeners() {
    const activityBtn = document.getElementById('refreshUserActivitySnapshot');
    const trafficBtn = document.getElementById('refreshTrafficSnapshot');
    if (activityBtn && !activityBtn.dataset.bound) {
        activityBtn.dataset.bound = '1';
        activityBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleOverviewSnapshotRefresh('activity');
        });
    }
    if (trafficBtn && !trafficBtn.dataset.bound) {
        trafficBtn.dataset.bound = '1';
        trafficBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            handleOverviewSnapshotRefresh('traffic');
        });
    }
}

// Close stat overlay
function closeStatOverlay(overlayId) {
    if (overlayId === 'storageUsageOverlay') {
        closeStorageBudgetOverlay();
    }
    const overlay = document.getElementById(overlayId);

    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll

        console.log(`Closed ${overlayId}`);
    }
}


// Helper: Set element value safely
function setElementValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

// Helper: Update breakdown bar
function updateBreakdownBar(prefix, value, total, currency = '') {
    const barEl = document.getElementById(`${prefix}Bar`);
    const valueEl = document.getElementById(`${prefix}Value`);
    
    if (barEl) {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        barEl.style.width = `${percentage}%`;
    }
    
    if (valueEl) {
        const displayValue = currency ? `${currency}${value.toLocaleString()}` : value.toLocaleString();
        valueEl.textContent = displayValue;
    }
}

// Helper: Update pie/donut chart with dynamic conic-gradient
function updatePieChart(chartId, segments) {
    const chartEl = document.getElementById(chartId);
    if (!chartEl) return;
    
    // Calculate total
    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    if (total === 0) return;
    
    // Build conic-gradient
    let gradientStops = [];
    let currentDeg = 0;
    
    segments.forEach(segment => {
        const percentage = (segment.value / total) * 100;
        const degrees = (percentage / 100) * 360;
        const endDeg = currentDeg + degrees;
        
        gradientStops.push(`${segment.color} ${currentDeg}deg`);
        gradientStops.push(`${segment.color} ${endDeg}deg`);
        
        currentDeg = endDeg;
    });
    
    const gradient = `conic-gradient(${gradientStops.join(', ')})`;
    chartEl.style.background = gradient;
    
    console.log(`🥧 Updated ${chartId} with gradient`);
}


// Initialize expandable sections
function initializeExpandableSections() {
    const expandableHeaders = document.querySelectorAll('.breakdown-header.expandable');
    
    expandableHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            
            if (targetContent) {
                // Toggle expanded state
                this.classList.toggle('expanded');
                targetContent.classList.toggle('expanded');
                
                console.log(`${targetContent.classList.contains('expanded') ? '▼' : '▶'} Toggled ${targetId}`);
            }
        });
    });
    
    console.log(`✅ Initialized ${expandableHeaders.length} expandable sections`);
}

// Initialize dropdown filters
// Date-range filtering isn't wired to a real data source yet -- the selects
// exist in the markup but changing them is a no-op until Firestore-backed
// overlay data replaces the old mock population functions.
function initializeDropdownFilters() {
    console.log('Dropdown filters present (not yet wired to a real data source)');
}

// ===== SYSTEM SETTINGS =====
// Source of truth is Firestore (platform_settings/general), not localStorage
// -- see loadSettings()/saveSettings() below and firebase-db.js
// getPlatformSettings()/savePlatformSettings() (Admin Dashboard Phase 5).

// Default settings values -- also used to seed platform_settings/general on
// its very first read, and as the fallback if Firestore is unreachable.
const DEFAULT_SETTINGS = {
    // System Status (Phase 11 keepers)
    suspendGigs: false,
    suspendMessages: false,
    techDifficulties: false,
    maintenanceMode: false,
    maintenanceResumeTime: '',
    techWarningTitle: '',
    techWarningMessage: '',
    techWarningSeverity: 'medium',
    techWarningEta: '',
    maintenanceTitle: '',
    maintenanceMessage: '',
    maintenanceStartTime: '',
    maintenanceEndTime: '',
    maintenanceContact: '',

    // User Management
    allowRegistration: true,

    // Gig Moderation
    maxActiveGigs: 0,
    minGigPrice: 50,
    maxGigPrice: 10000,
    launchBucketOn: true
};
const SETTINGS_COMPOSER_KEYS = [
    'techWarningTitle', 'techWarningMessage', 'techWarningSeverity', 'techWarningEta',
    'maintenanceTitle', 'maintenanceMessage', 'maintenanceStartTime', 'maintenanceEndTime', 'maintenanceContact'
];
let loadedSettingsComposer = {};

async function initializeSystemSettings() {
    console.log('⚙️ Initializing System Settings...');
    
    // Load saved settings from Firestore (or defaults) -- awaited so the
    // maintenance-mode initial-state check below sees the real loaded value,
    // not whatever the HTML checkbox happened to default to.
    await loadSettings();
    
    // Initialize collapsible categories
    initializeCollapsibleCategories();
    
    // Initialize maintenance mode toggle handler
    const maintenanceModeToggle = document.getElementById('maintenanceMode');
    const maintenanceTimeRow = document.getElementById('maintenanceTimeRow');
    
    if (maintenanceModeToggle && maintenanceTimeRow) {
        maintenanceModeToggle.addEventListener('change', function() {
            maintenanceTimeRow.style.display = this.checked ? 'flex' : 'none';
        });
        
        // Set initial state
        maintenanceTimeRow.style.display = maintenanceModeToggle.checked ? 'flex' : 'none';
    }
    
    // Initialize save button
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Initialize reset button
    const resetBtn = document.getElementById('resetSettingsBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetSettings);
    }
    
    // Initialize technical warning composer
    initializeTechWarningComposer();
    
    // Initialize maintenance mode composer
    initializeMaintenanceComposer();
    
    console.log('✅ System Settings initialized');
}

function initializeCollapsibleCategories() {
    const categories = document.querySelectorAll('.settings-category');
    
    categories.forEach((category, index) => {
        const header = category.querySelector('.category-header');
        
        if (!header) return;
        
        // Collapse all categories by default
        category.classList.add('collapsed');
        
        // Add click handler
        header.addEventListener('click', function() {
            category.classList.toggle('collapsed');
            
            // Log for debugging
            const title = category.querySelector('.category-title')?.textContent;
            const isCollapsed = category.classList.contains('collapsed');
            console.log(`${isCollapsed ? '📕' : '📖'} ${title} ${isCollapsed ? 'collapsed' : 'expanded'}`);
        });
    });
    
    console.log('✅ Collapsible categories initialized (all collapsed by default)');
}

// Settings now live in Firestore (platform_settings/general), not per-browser
// localStorage (Admin Dashboard Phase 5) -- fixes global toggles behaving
// inconsistently across browsers/devices. See docs/V1_HARDENING_TASKLIST.md
// Phase 5. `getPlatformSettings`/`savePlatformSettings` are defined in
// firebase-db.js; both fail safe (fall back to DEFAULT_SETTINGS / log +
// return false) if Firestore is unreachable so this never blocks dashboard load.
async function loadSettings() {
    const settings = await getPlatformSettings(DEFAULT_SETTINGS);
    SETTINGS_COMPOSER_KEYS.forEach((key) => {
        loadedSettingsComposer[key] = settings[key] != null ? settings[key] : DEFAULT_SETTINGS[key];
    });
    if (typeof syncPublicPlatformPolicy === 'function') {
        try { await syncPublicPlatformPolicy(settings); } catch (_) {}
    }

    // Apply settings to form elements
    Object.keys(DEFAULT_SETTINGS).forEach(key => {
        const element = document.getElementById(key);
        if (!element) return;
        const value = Object.prototype.hasOwnProperty.call(settings, key) ? settings[key] : DEFAULT_SETTINGS[key];

        if (element.type === 'checkbox') {
            element.checked = value;
        } else if (element.type === 'number' || element.type === 'text' || element.type === 'datetime-local') {
            element.value = value;
        } else if (element.tagName === 'SELECT') {
            element.value = value;
        } else if (element.tagName === 'TEXTAREA') {
            element.value = value;
        }
    });

    console.log('📥 Settings loaded from Firestore (platform_settings/general)');
}

function saveSettings() {
    showSettingsConfirmation(
        '💾 Save All Settings',
        'This will save all current settings. Continue?',
        async () => {
            const settings = {};
            
            // Collect all settings from form elements
            Object.keys(DEFAULT_SETTINGS).forEach(key => {
                if (SETTINGS_COMPOSER_KEYS.includes(key)) {
                    settings[key] = loadedSettingsComposer[key] != null ? loadedSettingsComposer[key] : DEFAULT_SETTINGS[key];
                    return;
                }
                const element = document.getElementById(key);
                if (!element) return;
                
                if (element.type === 'checkbox') {
                    settings[key] = element.checked;
                } else if (element.type === 'number') {
                    settings[key] = parseFloat(element.value) || 0;
                } else if (element.type === 'text' || element.type === 'datetime-local') {
                    settings[key] = element.value;
                } else if (element.tagName === 'SELECT') {
                    settings[key] = element.value;
                } else if (element.tagName === 'TEXTAREA') {
                    settings[key] = element.value;
                }
            });

            // Fix (2026-08-11): this write is a real Firestore round trip now
            // (not instant localStorage), so show a spinner instead of
            // leaving the button looking unresponsive for the ~1-3s it takes.
            const saveBtn = document.getElementById('saveSettingsBtn');
            const originalHtml = saveBtn ? saveBtn.innerHTML : '';
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="btn-icon settings-btn-spinner">⏳</span><span class="btn-text">Saving...</span>';
            }

            const success = await savePlatformSettings(settings);

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = originalHtml; // restore before showSettingsSaveConfirmation() captures its own "original" state
            }

            if (success) {
                console.log('💾 Settings saved to Firestore:', settings);
                showSettingsSaveConfirmation();
            } else {
                console.error('❌ Failed to save settings to Firestore');
                showToast('Failed to save settings — check your connection and try again.', 'error');
            }
        }
    );
}

function resetSettings() {
    showSettingsConfirmation(
        '↺ Reset to Defaults',
        'This will reset all settings to their default values. This action cannot be undone.',
        async () => {
            const resetBtn = document.getElementById('resetSettingsBtn');
            const originalResetHtml = resetBtn ? resetBtn.innerHTML : '';
            if (resetBtn) {
                resetBtn.disabled = true;
                resetBtn.innerHTML = '<span class="btn-icon settings-btn-spinner">⏳</span><span class="btn-text">Resetting...</span>';
            }

            const success = await savePlatformSettings(DEFAULT_SETTINGS);

            if (resetBtn) {
                resetBtn.disabled = false;
                resetBtn.innerHTML = originalResetHtml;
            }

            if (!success) {
                console.error('❌ Failed to reset settings in Firestore');
                showToast('Failed to reset settings — check your connection and try again.', 'error');
                return;
            }

            // Reload defaults into the form
            await loadSettings();
            
            console.log('🔄 Settings reset to defaults');
            
            // Show success feedback (reuse the save confirmation but with custom message)
            const saveBtn = document.getElementById('saveSettingsBtn');
            if (saveBtn) {
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Reset Complete!</span>';
                saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                setTimeout(() => {
                    saveBtn.innerHTML = originalText;
                }, 2000);
            }
        }
    );
}

function showSettingsSaveConfirmation() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (!saveBtn) return;
    
    const originalText = saveBtn.innerHTML;
    
    saveBtn.innerHTML = '<span class="btn-icon">✅</span><span class="btn-text">Settings Saved!</span>';
    saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    
    setTimeout(() => {
        saveBtn.innerHTML = originalText;
    }, 2000);
}

function showSettingsConfirmation(title, message, onConfirm) {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('settingsConfirmOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'settingsConfirmOverlay';
        overlay.className = 'settings-confirm-overlay';
        overlay.innerHTML = `
            <div class="settings-confirm-dialog">
                <div class="settings-confirm-title" id="confirmTitle"></div>
                <div class="settings-confirm-message" id="confirmMessage"></div>
                <div class="settings-confirm-actions">
                    <button class="settings-confirm-btn cancel" id="confirmCancel">Cancel</button>
                    <button class="settings-confirm-btn confirm" id="confirmOk">Confirm</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    
    // Update content
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    // Show overlay
    overlay.classList.add('active');
    
    // Handle confirm
    const confirmBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    const handleConfirm = () => {
        overlay.classList.remove('active');
        if (onConfirm) onConfirm();
        cleanup();
    };
    
    const handleCancel = () => {
        overlay.classList.remove('active');
        cleanup();
    };
    
    const cleanup = () => {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        overlay.removeEventListener('click', handleOverlayClick);
    };
    
    const handleOverlayClick = (e) => {
        if (e.target === overlay) {
            handleCancel();
        }
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOverlayClick);
}

// ===== TECHNICAL WARNING COMPOSER =====
function initializeTechWarningComposer() {
    const composeBtn = document.getElementById('composeTechWarningBtn');
    const overlay = document.getElementById('techWarningComposeOverlay');
    const closeBtn = document.getElementById('closeTechWarningCompose');
    const cancelBtn = document.getElementById('cancelTechWarningCompose');
    const saveBtn = document.getElementById('saveTechWarningCompose');
    
    // Form fields
    const titleInput = document.getElementById('techWarningTitle');
    const messageTextarea = document.getElementById('techWarningMessage');
    const severitySelect = document.getElementById('techWarningSeverity');
    const etaInput = document.getElementById('techWarningETA');
    
    // Character counters
    const titleCounter = document.getElementById('techWarningTitleCounter');
    const messageCounter = document.getElementById('techWarningMessageCounter');
    
    // Preview elements
    const previewTitle = document.querySelector('.preview-warning-title');
    const previewMessage = document.querySelector('.preview-warning-message');
    const previewEta = document.querySelector('.preview-warning-eta');
    const previewIcon = document.querySelector('.preview-warning-icon');
    const previewBox = document.querySelector('.compose-preview-box');
    
    if (!composeBtn || !overlay) return;
    
    // Load saved warning data
    let savedWarning = loadTechWarningData();
    
    // Open overlay
    if (composeBtn) {
        composeBtn.addEventListener('click', () => {
            // Load saved data into form
            if (savedWarning) {
                titleInput.value = savedWarning.title || '';
                messageTextarea.value = savedWarning.message || '';
                severitySelect.value = savedWarning.severity || 'medium';
                etaInput.value = savedWarning.eta || '';
            }
            
            // Update character counters
            updateCharCounter(titleInput, titleCounter, 60);
            updateCharCounter(messageTextarea, messageCounter, 500);
            
            // Update preview
            updatePreview();
            
            overlay.classList.add('active');
        });
    }
    
    // Close overlay
    const closeOverlay = () => {
        overlay.classList.remove('active');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);
    
    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });
    
    // Character counters
    if (titleInput && titleCounter) {
        titleInput.addEventListener('input', () => {
            updateCharCounter(titleInput, titleCounter, 60);
            updatePreview();
        });
    }
    
    if (messageTextarea && messageCounter) {
        messageTextarea.addEventListener('input', () => {
            updateCharCounter(messageTextarea, messageCounter, 500);
            updatePreview();
        });
    }
    
    // Update preview on any field change
    if (severitySelect) {
        severitySelect.addEventListener('change', updatePreview);
    }
    
    if (etaInput) {
        etaInput.addEventListener('input', updatePreview);
    }
    
    // Save warning
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = titleInput.value.trim();
            const message = messageTextarea.value.trim();
            
            // Validation
            if (!title) {
                showToast('Please enter a warning title', 'error');
                return;
            }
            
            if (!message) {
                showToast('Please enter a warning message', 'error');
                return;
            }
            
            // Save warning data
            const warningData = {
                title: title,
                message: message,
                severity: severitySelect.value,
                eta: etaInput.value.trim(),
                lastUpdated: new Date().toISOString()
            };
            
            saveTechWarningData(warningData);
            loadedSettingsComposer.techWarningTitle = warningData.title || '';
            loadedSettingsComposer.techWarningMessage = warningData.message || '';
            loadedSettingsComposer.techWarningSeverity = warningData.severity || 'medium';
            loadedSettingsComposer.techWarningEta = warningData.eta || '';
            persistComposerSettingsToFirestore();
            
            // Show success feedback
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span style="margin-right: 0.5rem;">✅</span> Saved!';
            saveBtn.style.background = '#0d9668';
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.style.background = '';
                closeOverlay();
            }, 1500);
            
            showToast('Technical warning message saved successfully', 'success');
            
            console.log('💾 Technical warning saved:', warningData);
        });
    }
    
    // Update preview function
    function updatePreview() {
        const title = titleInput.value.trim() || 'Technical Difficulties';
        const message = messageTextarea.value.trim() || "We're experiencing technical issues. Some features may be temporarily unavailable.";
        const severity = severitySelect.value;
        const eta = etaInput.value.trim() || 'Under investigation';
        
        // Update preview content
        if (previewTitle) previewTitle.textContent = title;
        if (previewMessage) previewMessage.textContent = message;
        if (previewEta) previewEta.textContent = `Expected resolution: ${eta}`;
        
        // Update preview styling based on severity
        if (previewBox) {
            // Remove all severity classes
            previewBox.className = 'compose-preview-box';
            
            // Update border color and icon based on severity
            const severityStyles = {
                low: { border: '#10b981', icon: 'ℹ️' },
                medium: { border: '#f59e0b', icon: '⚠️' },
                high: { border: '#ef4444', icon: '⚠️' },
                critical: { border: '#dc2626', icon: '🚨' }
            };
            
            const style = severityStyles[severity] || severityStyles.medium;
            previewBox.style.borderColor = style.border;
            
            if (previewIcon) {
                previewIcon.textContent = style.icon;
            }
        }
    }
    
    console.log('✅ Technical Warning Composer initialized');
}

// Update character counter helper
function updateCharCounter(input, counter, maxLength) {
    const count = input.value.length;
    counter.textContent = `${count}/${maxLength}`;
    
    if (count >= maxLength * 0.9) {
        counter.style.color = '#f59e0b';
    } else {
        counter.style.color = '#a0aec0';
    }
}

async function persistComposerSettingsToFirestore() {
    try {
        const current = await getPlatformSettings(DEFAULT_SETTINGS);
        const merged = { ...DEFAULT_SETTINGS, ...current, ...loadedSettingsComposer };
        const launchEl = document.getElementById('launchBucketOn');
        if (launchEl) merged.launchBucketOn = launchEl.checked;
        const formKeys = Object.keys(DEFAULT_SETTINGS).filter((key) => !SETTINGS_COMPOSER_KEYS.includes(key));
        formKeys.forEach((key) => {
            const element = document.getElementById(key);
            if (!element) return;
            if (element.type === 'checkbox') merged[key] = element.checked;
            else if (element.type === 'number') merged[key] = parseFloat(element.value) || 0;
            else if (element.type === 'text' || element.type === 'datetime-local') merged[key] = element.value;
        });
        await savePlatformSettings(merged);
    } catch (error) {
        console.warn('⚠️ Could not persist composer copy to Firestore:', error);
    }
}

// Save technical warning data to localStorage
function saveTechWarningData(data) {
    localStorage.setItem('techWarningData', JSON.stringify(data));
}

// Load technical warning data from localStorage
function loadTechWarningData() {
    if (loadedSettingsComposer.techWarningTitle || loadedSettingsComposer.techWarningMessage) {
        return {
            title: loadedSettingsComposer.techWarningTitle,
            message: loadedSettingsComposer.techWarningMessage,
            severity: loadedSettingsComposer.techWarningSeverity || 'medium',
            eta: loadedSettingsComposer.techWarningEta || ''
        };
    }
    const saved = localStorage.getItem('techWarningData');
    return saved ? JSON.parse(saved) : null;
}

// ===== MAINTENANCE MODE COMPOSER =====
function initializeMaintenanceComposer() {
    const composeBtn = document.getElementById('composeMaintenanceBtn');
    const overlay = document.getElementById('maintenanceComposeOverlay');
    const closeBtn = document.getElementById('closeMaintenanceCompose');
    const cancelBtn = document.getElementById('cancelMaintenanceCompose');
    const saveBtn = document.getElementById('saveMaintenanceCompose');
    
    // Form fields
    const titleInput = document.getElementById('maintenanceTitle');
    const messageTextarea = document.getElementById('maintenanceMessage');
    const startTimeInput = document.getElementById('maintenanceStartTime');
    const endTimeInput = document.getElementById('maintenanceEndTime');
    const contactInput = document.getElementById('maintenanceContact');
    
    // Character counters
    const titleCounter = document.getElementById('maintenanceTitleCounter');
    const messageCounter = document.getElementById('maintenanceMessageCounter');
    
    // Preview elements
    const previewTitle = document.querySelector('.preview-maintenance-title');
    const previewMessage = document.querySelector('.preview-maintenance-message');
    const previewTimeItems = document.querySelectorAll('.preview-time-item .time-value');
    const previewContact = document.querySelector('.preview-maintenance-contact');
    
    if (!composeBtn || !overlay) return;
    
    // Load saved maintenance data
    let savedMaintenance = loadMaintenanceData();
    
    // Open overlay
    if (composeBtn) {
        composeBtn.addEventListener('click', () => {
            // Load saved data into form
            if (savedMaintenance) {
                titleInput.value = savedMaintenance.title || '';
                messageTextarea.value = savedMaintenance.message || '';
                startTimeInput.value = savedMaintenance.startTime || '';
                endTimeInput.value = savedMaintenance.endTime || '';
                contactInput.value = savedMaintenance.contact || '';
            }
            
            // Update character counters
            updateCharCounter(titleInput, titleCounter, 60);
            updateCharCounter(messageTextarea, messageCounter, 500);
            
            // Update preview
            updateMaintenancePreview();
            
            overlay.classList.add('active');
        });
    }
    
    // Close overlay
    const closeOverlay = () => {
        overlay.classList.remove('active');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);
    
    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeOverlay();
        }
    });
    
    // Character counters
    if (titleInput && titleCounter) {
        titleInput.addEventListener('input', () => {
            updateCharCounter(titleInput, titleCounter, 60);
            updateMaintenancePreview();
        });
    }
    
    if (messageTextarea && messageCounter) {
        messageTextarea.addEventListener('input', () => {
            updateCharCounter(messageTextarea, messageCounter, 500);
            updateMaintenancePreview();
        });
    }
    
    // Update preview on any field change
    if (startTimeInput) {
        startTimeInput.addEventListener('change', updateMaintenancePreview);
    }
    
    if (endTimeInput) {
        endTimeInput.addEventListener('change', updateMaintenancePreview);
    }
    
    if (contactInput) {
        contactInput.addEventListener('input', updateMaintenancePreview);
    }
    
    // Save maintenance
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const title = titleInput.value.trim();
            const message = messageTextarea.value.trim();
            const startTime = startTimeInput.value;
            const endTime = endTimeInput.value;
            
            // Validation
            if (!title) {
                showToast('Please enter a maintenance title', 'error');
                return;
            }
            
            if (!message) {
                showToast('Please enter a maintenance message', 'error');
                return;
            }
            
            if (!startTime) {
                showToast('Please select a start time', 'error');
                return;
            }
            
            if (!endTime) {
                showToast('Please select an expected end time', 'error');
                return;
            }
            
            // Validate end time is after start time
            if (new Date(endTime) <= new Date(startTime)) {
                showToast('End time must be after start time', 'error');
                return;
            }
            
            // Save maintenance data
            const maintenanceData = {
                title: title,
                message: message,
                startTime: startTime,
                endTime: endTime,
                contact: contactInput.value.trim(),
                lastUpdated: new Date().toISOString()
            };
            
            saveMaintenanceData(maintenanceData);
            loadedSettingsComposer.maintenanceTitle = maintenanceData.title || '';
            loadedSettingsComposer.maintenanceMessage = maintenanceData.message || '';
            loadedSettingsComposer.maintenanceStartTime = maintenanceData.startTime || '';
            loadedSettingsComposer.maintenanceEndTime = maintenanceData.endTime || '';
            loadedSettingsComposer.maintenanceContact = maintenanceData.contact || '';
            persistComposerSettingsToFirestore();
            
            // Show success feedback
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<span style="margin-right: 0.5rem;">✅</span> Saved!';
            saveBtn.style.background = '#0d9668';
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                saveBtn.style.background = '';
                closeOverlay();
            }, 1500);
            
            showToast('Maintenance message saved successfully', 'success');
            
            console.log('💾 Maintenance data saved:', maintenanceData);
        });
    }
    
    // Update preview function
    function updateMaintenancePreview() {
        const title = titleInput.value.trim() || 'Scheduled Maintenance';
        const message = messageTextarea.value.trim() || "We're performing scheduled maintenance to improve our services. The platform will be temporarily unavailable.";
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const contact = contactInput.value.trim() || 'support@gisugo.com';
        
        // Update preview content
        if (previewTitle) previewTitle.textContent = title;
        if (previewMessage) previewMessage.textContent = message;
        
        // Update time displays
        if (previewTimeItems.length >= 2) {
            // Format start time
            if (startTime) {
                const startDate = new Date(startTime);
                previewTimeItems[0].textContent = startDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                previewTimeItems[0].textContent = 'Not set';
            }
            
            // Format end time
            if (endTime) {
                const endDate = new Date(endTime);
                previewTimeItems[1].textContent = endDate.toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                previewTimeItems[1].textContent = 'Not set';
            }
        }
        
        // Update contact
        if (previewContact) {
            previewContact.textContent = `Contact: ${contact}`;
        }
    }
    
    console.log('✅ Maintenance Mode Composer initialized');
}

// Save maintenance data to localStorage
function saveMaintenanceData(data) {
    localStorage.setItem('maintenanceData', JSON.stringify(data));
}

// Load maintenance data from localStorage
function loadMaintenanceData() {
    if (loadedSettingsComposer.maintenanceTitle || loadedSettingsComposer.maintenanceMessage) {
        return {
            title: loadedSettingsComposer.maintenanceTitle,
            message: loadedSettingsComposer.maintenanceMessage,
            startTime: loadedSettingsComposer.maintenanceStartTime || '',
            endTime: loadedSettingsComposer.maintenanceEndTime || '',
            contact: loadedSettingsComposer.maintenanceContact || ''
        };
    }
    const saved = localStorage.getItem('maintenanceData');
    return saved ? JSON.parse(saved) : null;
}

// ===== ADMIN PROFILE DROPDOWN =====
function initializeAdminDropdown() {
    const profileBtn = document.getElementById('adminProfileBtn');
    const dropdown = document.getElementById('adminDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (!profileBtn || !dropdown || !logoutBtn) {
        console.warn('⚠️ Admin dropdown elements not found');
        return;
    }
    
    // Toggle dropdown on profile click
    profileBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
    
    // Handle logout
    logoutBtn.addEventListener('click', async function() {
        console.log('🚪 Logging out...');
        try {
            if (typeof window.logout === 'function') {
                await window.logout();
            }
        } catch (error) {
            console.warn('⚠️ Logout error (continuing to redirect):', error);
        }
        window.location.href = 'login.html';
    });
    
    console.log('✅ Admin dropdown initialized');
}

// ===== USER MANAGEMENT SYSTEM =====

let currentUserTab = 'new'; // Track current tab: 'new', 'suspended' (pending/verified hidden -- not built)
let currentUserData = null; // Track currently selected user
let allUsers = []; // Store currently-displayed page of users
let usersNewLastDoc = null; // Pagination cursor for the New tab's "glance" Load More
let usersNewHasMore = false;
let userModerationActionInFlight = false; // Throttle: prevent double-click double-submits on Suspend/Restore

function initializeUserManagement() {
    console.log('👥 Initializing User Management system');
    
    // Initialize tab buttons
    initializeUserTabs();
    
    // Initialize search
    initializeUserSearch();
    
    // Initialize action buttons (desktop)
    initializeUserActions();
    
    // Initialize contact overlay
    initializeContactUserOverlay();
    
    // Initialize confirmation overlays
    initializeUserConfirmationOverlays();
    
    // Initialize mobile overlay
    initializeUserDetailOverlay();

    initializeUserListedGigsOverlay();
    
    // Initialize image lightbox
    initializeImageLightbox();
    
    // Initialize Load More (New tab only)
    initializeUserLoadMore();
    
    // Load initial users (new tab)
    loadUserCards('new');
    
    console.log('✅ User Management initialized');
}

function initializeUserLoadMore() {
    document.getElementById('loadMoreUsersBtn')?.addEventListener('click', function () {
        if (currentUserTab === 'new') {
            loadUserCards('new', { append: true });
        }
    });
}


function initializeUserTabs() {
    const tabButtons = [
        { id: 'usersNewBtn', tab: 'new' },
        { id: 'usersPendingBtn', tab: 'pending' },
        { id: 'usersVerifiedBtn', tab: 'verified' },
        { id: 'usersSuspendedBtn', tab: 'suspended' }
    ];
    
    tabButtons.forEach(({ id, tab }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => switchUserTab(tab));
        }
    });
}

function switchUserTab(tabType) {
    currentUserTab = tabType;
    
    // Update active tab button
    document.querySelectorAll('.user-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabType}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Clear selection
    currentUserData = null;
    const userDetail = document.getElementById('userDetail');
    const userContent = document.getElementById('userContent');
    if (userDetail) userDetail.style.display = 'flex';
    if (userContent) userContent.style.display = 'none';
    
    // Load users for this tab
    loadUserCards(tabType);
    
    // Reset scroll position to top AFTER loading content (using setTimeout to ensure DOM is updated)
    setTimeout(() => {
        const userCardsList = document.querySelector('.user-cards-list');
        if (userCardsList) {
            userCardsList.scrollTop = 0;
        }
    }, 0);
}

/**
 * Normalize a raw users/{userId} Firestore doc into the flat shape the
 * User Management UI expects. Mirrors normalizeGigForDisplay's role in Gig
 * Moderation. region/city/ipAddress/gigsListed/applications are NOT filled
 * here -- those come from getUserModerationExtras(), fetched on demand only
 * when an admin opens this specific user (see selectUser()).
 */
// dateOfBirth became a required signup field 2026-08-06; pre-existing
// accounts from before then may have it blank, so this returns null
// instead of NaN/garbage in that case (displayed as "Not specified").
function calculateAgeFromDOB(dateOfBirth) {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function normalizeUserForDisplay(id, data) {
    const d = data || {};
    const verification = d.verification || {};
    let verificationStatus = 'NEW MEMBER';
    if (verification.businessVerified) verificationStatus = 'BUSINESS VERIFIED';
    else if (verification.proVerified) verificationStatus = 'PRO VERIFIED';

    const isBanned = d.status === 'banned';
    const isSuspended = d.status === 'suspended' || isBanned;

    return {
        id,
        fullName: d.fullName || 'Unnamed User',
        avatar: d.profilePhoto || GIG_MODERATION_FALLBACK_AVATAR,
        rating: Number(d.averageRating != null ? d.averageRating : d.rating) || 0,
        reviewCount: Number(d.totalReviews != null ? d.totalReviews : d.reviewCount) || 0,
        verificationStatus,
        status: isBanned ? 'banned' : (isSuspended ? 'suspended' : 'new'),
        registeredDate: d.accountCreated ? new Date(d.accountCreated) : new Date(0),
        birthdate: d.dateOfBirth || null,
        age: calculateAgeFromDOB(d.dateOfBirth),
        education: d.educationLevel || 'Not specified',
        introduction: (d.userSummary || '').trim() || 'No introduction provided.',
        socialMediaLinks: {
            facebook: d.socialMedia?.facebook || null,
            instagram: d.socialMedia?.instagram || null,
            linkedin: d.socialMedia?.linkedin || null
        },
        // Filled on demand via getUserModerationExtras() when this user is opened.
        region: 'Loading...',
        city: 'Loading...',
        ipAddress: 'Loading...',
        gigsListed: 0,
        listedGigs: null,
        moderationExtrasLoaded: false,
        applications: 0,
        suspendedInfo: isSuspended ? {
            suspendedBy: d.suspendedByName || 'Unknown admin',
            suspensionDate: formatGigTimestamp ? formatGigTimestamp(d.suspendedAt) : '',
            reason: d.suspendReason || '',
            duration: 'indefinite',
            notes: ''
        } : null,
        bannedInfo: isBanned ? {
            bannedBy: d.bannedByName || 'Unknown admin',
            bannedDate: formatGigTimestamp ? formatGigTimestamp(d.bannedAt) : ''
        } : null
    };
}

async function loadUserCards(tabType, options = {}) {
    const userCardsList = document.getElementById('userCardsList');
    if (!userCardsList) return;

    const append = options.append === true;
    const loadingIndicator = document.getElementById('usersLoading');
    const loadMoreBtn = document.getElementById('loadMoreUsersBtn');

    if (!append) {
        userCardsList.innerHTML = '<div class="user-cards-empty-loading" style="padding:2rem;text-align:center;color:#a0aec0;">Loading users…</div>';
        closeUserDetail();
    }
    if (loadingIndicator) loadingIndicator.style.display = append ? 'block' : 'none';
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';

    try {
        let fetchedUsers = [];

        if (tabType === 'suspended') {
            const results = (typeof getUserManagementSuspended === 'function')
                ? await getUserManagementSuspended()
                : [];
            fetchedUsers = results.map(r => normalizeUserForDisplay(r.id, r.data));
            usersNewHasMore = false;
        } else {
            // New tab: "glance" pattern -- newest batch, optional Load More, no
            // gap-guarantee. Suspended accounts filtered out client-side (see
            // getUserManagementNew's doc comment for why this can't be a
            // server-side query filter).
            const startAfter = append ? usersNewLastDoc : null;
            const result = (typeof getUserManagementNew === 'function')
                ? await getUserManagementNew(startAfter)
                : { users: [], lastDoc: null, hasMore: false };
            const normalized = result.users
                .map(r => normalizeUserForDisplay(r.id, r.data))
                .filter(u => u.status !== 'suspended' && u.status !== 'banned');
            fetchedUsers = append ? [...allUsers, ...normalized] : normalized;
            usersNewLastDoc = result.lastDoc;
            usersNewHasMore = result.hasMore;
        }

        allUsers = fetchedUsers;
        currentUserTab = tabType;

        updateUserTabCounts();

        if (allUsers.length === 0) {
            userCardsList.innerHTML = '<div class="user-cards-empty" style="padding:2rem;text-align:center;color:#a0aec0;">No users here right now.</div>';
        } else {
            userCardsList.innerHTML = allUsers.map(user => generateUserCardHTML(user)).join('');
        }

        const usersStats = document.getElementById('usersStats');
        if (usersStats) {
            usersStats.textContent = `Showing ${allUsers.length} user${allUsers.length === 1 ? '' : 's'}`;
        }

        if (loadMoreBtn) {
            loadMoreBtn.style.display = (tabType === 'new' && usersNewHasMore) ? 'inline-block' : 'none';
        }

        attachUserCardHandlers();
    } catch (error) {
        console.error('❌ Error loading user management cards:', error);
        userCardsList.innerHTML = '<div class="user-cards-empty" style="padding:2rem;text-align:center;color:#e53e3e;">Could not load users. Try refreshing.</div>';
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

function generateUserCardHTML(user) {
    // Format registration date
    const regDate = new Date(user.registeredDate);
    const now = new Date();
    const diffTime = Math.abs(now - regDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let timeAgo;
    if (diffDays === 0) {
        timeAgo = 'Today';
    } else if (diffDays === 1) {
        timeAgo = '1 day ago';
    } else if (diffDays < 7) {
        timeAgo = `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        timeAgo = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        timeAgo = months === 1 ? '1 month ago' : `${months} months ago`;
    } else {
        const years = Math.floor(diffDays / 365);
        timeAgo = years === 1 ? '1 year ago' : `${years} years ago`;
    }
    
    // Generate stars
    const fullStars = Math.floor(user.rating);
    const hasHalfStar = user.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<span class="user-card-star filled"></span>';
    }
    if (hasHalfStar) {
        starsHTML += '<span class="user-card-star filled"></span>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<span class="user-card-star gray"></span>';
    }
    
    // Status class
    let statusClass = 'new';
    if (user.verificationStatus === 'PRO VERIFIED') {
        statusClass = 'pro';
    } else if (user.verificationStatus === 'BUSINESS VERIFIED') {
        statusClass = 'business';
    }
    
    const safeName = escapeHtml(user.fullName || '');
    const ageLabel = Number.isFinite(user.age) ? `${user.age} years old` : 'Age not specified';
    const bannedBadge = user.status === 'banned'
        ? '<span class="user-mod-status-badge banned">Banned</span>'
        : '';

    return `
        <div class="user-card" data-user-id="${user.id}">
            <img src="${user.avatar}" alt="${safeName}" class="user-card-avatar">
            <div class="user-card-info">
                <div class="user-card-header">
                    <div class="user-card-name">${safeName}</div>
                    <div class="user-card-header-badges">
                        ${bannedBadge}
                        <div class="user-card-status ${statusClass}">${user.verificationStatus}</div>
                    </div>
                </div>
                <div class="user-card-rating">
                    <span class="user-card-reviews">${user.reviewCount}</span>
                    <div class="user-card-stars">
                        ${starsHTML}
                    </div>
                </div>
                <div class="user-card-details">
                    <div class="user-card-detail-item">
                        <span class="user-card-detail-icon">📅</span>
                        <span>${timeAgo}</span>
                    </div>
                    <div class="user-card-detail-item">
                        <span class="user-card-detail-icon">🎂</span>
                        <span>${ageLabel}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Only the currently-active tab's count is authoritative (mirrors Gig
// Moderation's updateTabCounts) -- New shows a trailing "+" while more
// pages remain unfetched. Pending/Verified counts are left untouched
// (hidden tabs, never queried).
function updateUserTabCounts() {
    const newCountEl = document.getElementById('newUsersCount');
    const suspendedCountEl = document.getElementById('suspendedUsersCount');

    if (currentUserTab === 'new' && newCountEl) {
        newCountEl.textContent = allUsers.length + (usersNewHasMore ? '+' : '');
    } else if (currentUserTab === 'suspended' && suspendedCountEl) {
        suspendedCountEl.textContent = allUsers.length;
    }
}

function attachUserCardHandlers() {
    const cards = document.querySelectorAll('.user-card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const user = allUsers.find(u => u.id === userId);
            if (user) {
                selectUser(user);
            }
        });
    });
}

function selectUser(user) {
    closeUserListedGigsOverlay();
    currentUserData = user;
    
    // Update selected state on cards
    document.querySelectorAll('.user-card').forEach(card => {
        card.classList.remove('selected');
    });
    const selectedCard = document.querySelector(`[data-user-id="${user.id}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Check viewport width
    const isMobile = window.innerWidth <= 887;
    
    // Region/City/IP/activity counts are fetched on demand (never batched
    // across the whole list) -- fill them in once they arrive, whichever
    // view (desktop panel or mobile overlay) is currently showing.
    loadUserModerationExtrasInto(user);

    if (isMobile) {
        // Show mobile overlay
        showUserDetailOverlay(user);
    } else {
        // Show desktop detail panel
        displayUserDetails(user);
    }
}

function displayUserDetails(user) {
    const userDetail = document.getElementById('userDetail');
    const userContent = document.getElementById('userContent');
    const userContentInner = document.querySelector('.user-content-inner');
    
    if (!userContent) return;
    
    // Reset scroll position to top
    if (userContentInner) {
        userContentInner.scrollTop = 0;
    }
    
    // Hide "no user selected", show content
    if (userDetail) userDetail.style.display = 'none';
    userContent.style.display = 'flex';
    
    // Update header (name and rating)
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userReviewsCount').textContent = user.reviewCount;
    updateStars('userStars', user.rating);
    
    // Update profile photo in body
    document.getElementById('userProfilePhoto').src = user.avatar;
    
    // Update status badge
    document.getElementById('userStatusBadge').textContent = user.verificationStatus;
    const desktopModerationBadge = document.getElementById('userModerationBadge');
    if (desktopModerationBadge) {
        desktopModerationBadge.style.display = user.status === 'banned' ? 'inline-block' : 'none';
    }
    
    // Update social links (always show all 3 icons)
    const socialLinksContainer = document.getElementById('userSocialLinks');
    socialLinksContainer.innerHTML = '';
    
    // Facebook - always show, clickable if link exists
    if (user.socialMediaLinks.facebook) {
        socialLinksContainer.innerHTML += `<a href="${user.socialMediaLinks.facebook}" target="_blank" class="user-social-link"><img src="public/icons/FB.png" alt="Facebook"></a>`;
    } else {
        socialLinksContainer.innerHTML += `<span class="user-social-link user-social-link-inactive"><img src="public/icons/FB.png" alt="Facebook"></span>`;
    }
    
    // Instagram - always show, clickable if link exists
    if (user.socialMediaLinks.instagram) {
        socialLinksContainer.innerHTML += `<a href="${user.socialMediaLinks.instagram}" target="_blank" class="user-social-link"><img src="public/icons/IG.png" alt="Instagram"></a>`;
    } else {
        socialLinksContainer.innerHTML += `<span class="user-social-link user-social-link-inactive"><img src="public/icons/IG.png" alt="Instagram"></span>`;
    }
    
    // LinkedIn - always show, clickable if link exists
    if (user.socialMediaLinks.linkedin) {
        socialLinksContainer.innerHTML += `<a href="${user.socialMediaLinks.linkedin}" target="_blank" class="user-social-link"><img src="public/icons/IN.png" alt="LinkedIn"></a>`;
    } else {
        socialLinksContainer.innerHTML += `<span class="user-social-link user-social-link-inactive"><img src="public/icons/IN.png" alt="LinkedIn"></span>`;
    }
    
    // Update user info
    document.getElementById('userRegisteredSince').textContent = user.registeredDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const birthDateObj = user.birthdate ? new Date(user.birthdate) : null;
    document.getElementById('userBirthdate').textContent = (birthDateObj && !Number.isNaN(birthDateObj.getTime()))
        ? birthDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Not specified';
    document.getElementById('userAge').textContent = Number.isFinite(user.age) ? `${user.age} years old` : 'Not specified';
    document.getElementById('userEducation').textContent = user.education;
    document.getElementById('userRegion').textContent = user.region;
    document.getElementById('userCity').textContent = user.city;
    document.getElementById('userGigsListed').textContent = user.gigsListed;
    document.getElementById('userApplications').textContent = user.applications;
    document.getElementById('userIntro').textContent = user.introduction;
    
    // Update action buttons based on tab
    updateUserActionButtons(user);
    
    // Update footer sections based on tab
    updateUserFooterSections(user);
}

let userExtrasInFlight = { uid: null, promise: null };

function applyUserModerationExtras(user, extras) {
    user.region = extras.region || 'Not shared';
    user.city = 'Not tracked'; // no city-level capture pipeline exists, only region -- see submitSignupLocation
    user.ipAddress = extras.ipAddress || 'Not available';
    user.gigsListed = extras.gigsListed;
    user.listedGigs = Array.isArray(extras.listedGigs) ? extras.listedGigs : [];
    user.applications = extras.applications;
    user.moderationExtrasLoaded = true;

    // Desktop panel: individual field IDs, safe to patch in place.
    const regionEl = document.getElementById('userRegion');
    const cityEl = document.getElementById('userCity');
    const gigsListedEl = document.getElementById('userGigsListed');
    const applicationsEl = document.getElementById('userApplications');
    const ipEl = document.getElementById('userIpAddress');
    if (regionEl) regionEl.textContent = user.region;
    if (cityEl) cityEl.textContent = user.city;
    if (gigsListedEl) gigsListedEl.textContent = user.gigsListed;
    if (applicationsEl) applicationsEl.textContent = user.applications;
    if (ipEl) ipEl.textContent = user.ipAddress;

    // Mobile overlay has no per-field IDs (its body is a single
    // regenerated HTML blob) -- if it's currently open on this same
    // user, just rebuild it now that the extras have arrived.
    const overlay = document.getElementById('userDetailOverlay');
    if (overlay && overlay.classList.contains('active')) {
        showUserDetailOverlay(user);
    }
}

async function loadUserModerationExtrasInto(user) {
    if (!user || user.moderationExtrasLoaded) return;
    if (typeof getUserModerationExtras !== 'function') return;
    try {
        let extrasPromise = userExtrasInFlight.promise;
        if (!extrasPromise || userExtrasInFlight.uid !== user.id) {
            extrasPromise = getUserModerationExtras(user.id);
            userExtrasInFlight = { uid: user.id, promise: extrasPromise };
        }
        const extras = await extrasPromise;
        if (userExtrasInFlight.uid === user.id) {
            userExtrasInFlight = { uid: null, promise: null };
        }
        if (!currentUserData || currentUserData.id !== user.id) return; // selection changed mid-fetch
        applyUserModerationExtras(user, extras);
    } catch (error) {
        if (userExtrasInFlight.uid === user.id) {
            userExtrasInFlight = { uid: null, promise: null };
        }
        console.error('❌ Error loading user moderation extras:', error);
    }
}

function updateStars(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.setAttribute('data-rating', rating);
    
    const stars = container.querySelectorAll('.detail-star, .overlay-star');
    const fullStars = Math.floor(rating);
    
    stars.forEach((star, index) => {
        star.classList.remove('filled', 'gray');
        if (index < fullStars) {
            star.classList.add('filled');
        } else {
            star.classList.add('gray');
        }
    });
}

function updateUserActionButtons(user) {
    const suspendBtn = document.getElementById('suspendUserBtn');
    const restoreBtn = document.getElementById('restoreUserBtn');
    
    if (user.status === 'banned') {
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (restoreBtn) restoreBtn.style.display = 'none';
    } else if (user.status === 'suspended') {
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (restoreBtn) restoreBtn.style.display = 'inline-block';
    } else {
        if (suspendBtn) suspendBtn.style.display = 'inline-block';
        if (restoreBtn) restoreBtn.style.display = 'none';
    }
}

function updateUserFooterSections(user) {
    // Hide all footer sections first
    const verificationImagesSection = document.getElementById('verificationImagesSection');
    const bigApproveSection = document.getElementById('bigApproveSection');
    const bigRevokeSection = document.getElementById('bigRevokeSection');
    const suspendedInfoSection = document.getElementById('suspendedInfoSection');
    const permBanSection = document.getElementById('permBanSection');
    
    if (verificationImagesSection) verificationImagesSection.style.display = 'none';
    if (bigApproveSection) bigApproveSection.style.display = 'none';
    if (bigRevokeSection) bigRevokeSection.style.display = 'none';
    if (suspendedInfoSection) suspendedInfoSection.style.display = 'none';
    if (permBanSection) permBanSection.style.display = 'none';
    
    // Show relevant sections based on status
    if (user.status === 'pending') {
        // Show verification images and approve button
        if (verificationImagesSection && user.verificationImages) {
            verificationImagesSection.style.display = 'block';
            document.getElementById('idImage').src = user.verificationImages.idImage;
            document.getElementById('selfieImage').src = user.verificationImages.selfieImage;
        }
        if (bigApproveSection) bigApproveSection.style.display = 'block';
    } else if (user.status === 'verified') {
        // Show revoke button
        if (bigRevokeSection) bigRevokeSection.style.display = 'block';
    } else if (user.status === 'suspended' || user.status === 'banned') {
        // Show suspended info and permanent ban / unban section
        if (suspendedInfoSection && user.suspendedInfo) {
            suspendedInfoSection.style.display = 'block';
            document.getElementById('suspendedBy').textContent = user.suspendedInfo.suspendedBy;
            document.getElementById('suspensionDate').textContent = user.suspendedInfo.suspensionDate;
            
            // Display reason
            const reasonEl = document.getElementById('suspensionReason');
            if (reasonEl) {
                reasonEl.textContent = user.suspendedInfo.reason || 'Not specified';
            }
            
            // Display duration with expiry date if applicable
            const durationEl = document.getElementById('suspensionDuration');
            if (durationEl) {
                const durationText = formatSuspensionDuration(user.suspendedInfo);
                durationEl.innerHTML = durationText;
            }
            
            // Display notes (only if they exist)
            const notesEl = document.getElementById('suspensionNotes');
            const notesLabelEl = document.getElementById('suspensionNotesLabel');
            if (notesEl && notesLabelEl) {
                if (user.suspendedInfo.notes && user.suspendedInfo.notes.trim()) {
                    notesEl.textContent = user.suspendedInfo.notes;
                    notesEl.style.display = 'block';
                    notesLabelEl.style.display = 'block';
                } else {
                    notesEl.style.display = 'none';
                    notesLabelEl.style.display = 'none';
                }
            }
        }
        const bannedInfoBlock = document.getElementById('bannedInfoBlock');
        if (bannedInfoBlock) {
            if (user.status === 'banned' && user.bannedInfo) {
                bannedInfoBlock.style.display = 'block';
                const bannedByEl = document.getElementById('bannedBy');
                const bannedDateEl = document.getElementById('bannedDate');
                if (bannedByEl) bannedByEl.textContent = user.bannedInfo.bannedBy;
                if (bannedDateEl) bannedDateEl.textContent = user.bannedInfo.bannedDate;
            } else {
                bannedInfoBlock.style.display = 'none';
            }
        }
        if (permBanSection) {
            permBanSection.style.display = 'block';
            document.getElementById('userIpAddress').textContent = user.ipAddress;
            const permBanText = document.getElementById('permBanSectionText');
            const permBanBtn = document.getElementById('permBanUserBtn');
            const unbanBtn = document.getElementById('unbanUserBtn');
            if (user.status === 'banned') {
                if (permBanText) {
                    permBanText.innerHTML = '<strong>Banned:</strong> Login is disabled. Evidence (reviews, gigs, applications, messages, logs, uploaded files) stays on file. Unban re-enables login and does not relist their gigs.';
                }
                if (permBanBtn) permBanBtn.style.display = 'none';
                if (unbanBtn) unbanBtn.style.display = 'block';
            } else {
                if (permBanText) {
                    permBanText.innerHTML = '<strong>Danger Zone:</strong> Permanent ban disables this account\'s login. Reviews, gigs, applications, messages, logs, and uploaded files stay on file as evidence. This is not a data delete and not an IP block.';
                }
                if (permBanBtn) permBanBtn.style.display = 'block';
                if (unbanBtn) unbanBtn.style.display = 'none';
            }
        }
    }
}

function initializeUserActions() {
    // Contact button
    const contactBtn = document.getElementById('contactUserBtn');
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            if (currentUserData) {
                showContactUserOverlay();
            }
        });
    }
    
    // Suspend button
    const suspendBtn = document.getElementById('suspendUserBtn');
    if (suspendBtn) {
        suspendBtn.addEventListener('click', () => {
            if (currentUserData) {
                showSuspendUserConfirmation();
            }
        });
    }
    
    // Restore button
    const restoreBtn = document.getElementById('restoreUserBtn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            if (currentUserData) {
                showRestoreUserConfirmation();
            }
        });
    }

    const unbanBtn = document.getElementById('unbanUserBtn');
    if (unbanBtn) {
        unbanBtn.addEventListener('click', () => {
            if (currentUserData) {
                showUnbanUserConfirmation();
            }
        });
    }
    
    // Close button
    const closeBtn = document.getElementById('closeUserBtn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeUserDetail();
        });
    }
    
    // View Profile button
    const viewProfileBtn = document.getElementById('viewProfileBtn');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', () => {
            openUserPublicProfile(currentUserData && currentUserData.id);
        });
    }

    document.getElementById('userGigsListed')?.addEventListener('click', () => {
        openUserListedGigsOverlay();
    });
    
    // Big Approve button
    const bigApproveBtn = document.getElementById('bigApproveUserBtn');
    if (bigApproveBtn) {
        bigApproveBtn.addEventListener('click', () => {
            if (currentUserData) {
                showApproveVerificationConfirmation();
            }
        });
    }
    
    // Big Revoke button
    const bigRevokeBtn = document.getElementById('bigRevokeUserBtn');
    if (bigRevokeBtn) {
        bigRevokeBtn.addEventListener('click', () => {
            if (currentUserData) {
                showRevokeVerificationConfirmation();
            }
        });
    }
    
    // Permanent Ban button
    const permBanBtn = document.getElementById('permBanUserBtn');
    if (permBanBtn) {
        permBanBtn.addEventListener('click', () => {
            if (currentUserData) {
                showPermBanUserConfirmation();
            }
        });
    }
}

function openUserPublicProfile(userId) {
    const id = String(userId || '').trim();
    if (!id) {
        showToast('No user selected', 'error', 2000);
        return;
    }
    window.open(`profile.html?userId=${encodeURIComponent(id)}`, '_blank', 'noopener');
}
window.openUserPublicProfile = openUserPublicProfile;

function buildPublicGigPageUrl(jobId, category) {
    const id = String(jobId || '').trim();
    if (!id) return '';
    const params = new URLSearchParams({ jobId: id });
    const cat = String(category || '').trim();
    if (cat) params.set('category', cat);
    return `dynamic-job.html?${params.toString()}`;
}

function listedGigStatusMeta(status) {
    const key = String(status || 'unknown').trim().toLowerCase() || 'unknown';
    const labels = {
        active: 'Active',
        reported: 'Reported',
        suspended: 'Suspended',
        hired: 'Hired',
        accepted: 'In Progress',
        completed: 'Completed',
        closed: 'Closed'
    };
    return {
        key: key.replace(/[^a-z0-9_-]/g, '') || 'unknown',
        label: labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())
    };
}

function closeUserListedGigsOverlay() {
    const overlay = document.getElementById('userListedGigsOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
}

function renderUserListedGigsList(gigs) {
    const list = document.getElementById('userListedGigsList');
    if (!list) return;
    const rows = Array.isArray(gigs) ? gigs : [];
    if (!rows.length) {
        list.innerHTML = '<div class="user-listed-gigs-empty">This user has no listed gigs.</div>';
        return;
    }
    list.innerHTML = rows.map((gig) => {
        const href = buildPublicGigPageUrl(gig.id, gig.category);
        if (!href) return '';
        const posted = gig.datePostedMs
            ? formatGigTimestamp(new Date(gig.datePostedMs))
            : 'Date unknown';
        const statusMeta = listedGigStatusMeta(gig.status);
        return `
            <a class="user-listed-gig-row" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">
                <div class="user-listed-gig-title">${escapeHtml(gig.title || 'Untitled gig')}</div>
                <div class="user-listed-gig-meta">
                    <span class="user-listed-gig-status is-${escapeHtml(statusMeta.key)}">${escapeHtml(statusMeta.label)}</span>
                    <span>•</span>
                    <span>${escapeHtml(posted)}</span>
                </div>
            </a>
        `;
    }).join('');
}

async function openUserListedGigsOverlay() {
    const user = currentUserData;
    if (!user) {
        showToast('No user selected', 'error', 2000);
        return;
    }
    const overlay = document.getElementById('userListedGigsOverlay');
    const titleEl = document.getElementById('userListedGigsTitle');
    const subtitleEl = document.getElementById('userListedGigsSubtitle');
    const list = document.getElementById('userListedGigsList');
    if (!overlay || !list) return;

    if (titleEl) titleEl.textContent = 'Gigs listed';
    if (subtitleEl) subtitleEl.textContent = user.fullName || '';
    list.innerHTML = '<div class="user-listed-gigs-empty">Loading…</div>';
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    if (!user.moderationExtrasLoaded) {
        await loadUserModerationExtrasInto(user);
    }
    if (!currentUserData || currentUserData.id !== user.id) return;
    if (!user.moderationExtrasLoaded) {
        list.innerHTML = '<div class="user-listed-gigs-empty">Could not load gigs. Try again.</div>';
        return;
    }

    const count = Array.isArray(user.listedGigs) ? user.listedGigs.length : 0;
    if (titleEl) titleEl.textContent = `Gigs listed (${count})`;
    renderUserListedGigsList(user.listedGigs);
}

function initializeUserListedGigsOverlay() {
    document.getElementById('closeUserListedGigsBtn')?.addEventListener('click', closeUserListedGigsOverlay);
    document.getElementById('userListedGigsOverlay')?.addEventListener('click', (e) => {
        if (e.target.id === 'userListedGigsOverlay') closeUserListedGigsOverlay();
    });
}

function closeUserDetail() {
    closeUserListedGigsOverlay();
    currentUserData = null;
    
    // Clear card selection
    document.querySelectorAll('.user-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Hide content, show "no user selected"
    const userDetail = document.getElementById('userDetail');
    const userContent = document.getElementById('userContent');
    if (userDetail) userDetail.style.display = 'flex';
    if (userContent) userContent.style.display = 'none';
    
    // Close overlay (for mobile/tablet view)
    const overlay = document.getElementById('userDetailOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

let userSearchDebounceTimer = null;

function initializeUserSearch() {
    const searchInput = document.getElementById('usersSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            clearTimeout(userSearchDebounceTimer);
            performUserSearch();
        }
    });

    // Debounced so every keystroke doesn't fire a Firestore read.
    searchInput.addEventListener('input', function() {
        clearTimeout(userSearchDebounceTimer);
        userSearchDebounceTimer = setTimeout(performUserSearch, 400);
    });
}

// Server-side prefix search across ALL users (any status) by name, so an
// admin can find someone even if they're not on the currently-loaded tab
// page. See searchUsersByNamePrefix in firebase-db.js.
async function performUserSearch() {
    const rawQuery = document.getElementById('usersSearchInput')?.value.trim() || '';
    const userCardsList = document.getElementById('userCardsList');
    if (!userCardsList) return;

    if (!rawQuery) {
        loadUserCards(currentUserTab);
        return;
    }

    userCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a0aec0;">Searching…</div>';

    try {
        const results = (typeof searchUsersByNamePrefix === 'function')
            ? await searchUsersByNamePrefix(rawQuery)
            : [];
        const searchedUsers = results.map(r => normalizeUserForDisplay(r.id, r.data));

        // Swap allUsers so clicking a result still works via attachUserCardHandlers/selectUser.
        allUsers = searchedUsers;

        if (searchedUsers.length === 0) {
            userCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a0aec0;">No users found matching your search.</div>';
        } else {
            userCardsList.innerHTML = searchedUsers.map(user => generateUserCardHTML(user)).join('');
            attachUserCardHandlers();
        }

        const usersStats = document.getElementById('usersStats');
        if (usersStats) {
            usersStats.textContent = `Found ${searchedUsers.length} user${searchedUsers.length === 1 ? '' : 's'} matching "${rawQuery}"`;
        }

        const loadMoreBtn = document.getElementById('loadMoreUsersBtn');
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    } catch (error) {
        console.error('❌ User search failed:', error);
        userCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #e53e3e;">Search failed. Try again.</div>';
    }
}

function initializeImageLightbox() {
    const lightboxOverlay = document.getElementById('imageLightboxOverlay');
    const lightboxClose = document.getElementById('lightboxCloseBtn');
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxLabel = document.getElementById('lightboxLabel');
    
    // View ID button
    const viewIdBtn = document.getElementById('viewIdBtn');
    if (viewIdBtn) {
        viewIdBtn.addEventListener('click', () => {
            if (currentUserData && currentUserData.verificationImages) {
                lightboxImage.src = currentUserData.verificationImages.idImage;
                lightboxLabel.textContent = 'Government ID';
                lightboxOverlay.classList.add('active');
            }
        });
    }
    
    // View Selfie button
    const viewSelfieBtn = document.getElementById('viewSelfieBtn');
    if (viewSelfieBtn) {
        viewSelfieBtn.addEventListener('click', () => {
            if (currentUserData && currentUserData.verificationImages) {
                lightboxImage.src = currentUserData.verificationImages.selfieImage;
                lightboxLabel.textContent = 'Selfie with ID';
                lightboxOverlay.classList.add('active');
            }
        });
    }
    
    // Download ID button
    const downloadIdBtn = document.getElementById('downloadIdBtn');
    if (downloadIdBtn) {
        downloadIdBtn.addEventListener('click', () => {
            if (currentUserData && currentUserData.verificationImages) {
                downloadImage(currentUserData.verificationImages.idImage, `${currentUserData.fullName}_ID.jpg`);
            }
        });
    }
    
    // Download Selfie button
    const downloadSelfieBtn = document.getElementById('downloadSelfieBtn');
    if (downloadSelfieBtn) {
        downloadSelfieBtn.addEventListener('click', () => {
            if (currentUserData && currentUserData.verificationImages) {
                downloadImage(currentUserData.verificationImages.selfieImage, `${currentUserData.fullName}_Selfie.jpg`);
            }
        });
    }
    
    // Close lightbox
    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightboxOverlay.classList.remove('active');
        });
    }
    
    // Close on background click
    if (lightboxOverlay) {
        lightboxOverlay.addEventListener('click', (e) => {
            if (e.target === lightboxOverlay) {
                lightboxOverlay.classList.remove('active');
            }
        });
    }
}

function downloadImage(imageUrl, filename) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Downloading ${filename}`, 'success');
}

let contactUserPhotoFile = null;
let contactUserPhotoPreviewUrl = null;

function clearContactUserPhoto() {
    contactUserPhotoFile = null;
    if (contactUserPhotoPreviewUrl) {
        URL.revokeObjectURL(contactUserPhotoPreviewUrl);
        contactUserPhotoPreviewUrl = null;
    }
    const previewContainer = document.getElementById('contactUserAttachmentPreview');
    const previewImage = document.getElementById('contactUserAttachmentImg');
    const attachInput = document.getElementById('contactUserAttachmentInput');
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImage) previewImage.src = '';
    if (attachInput) attachInput.value = '';
}

function closeContactUserOverlay() {
    const overlay = document.getElementById('contactUserOverlay');
    if (overlay) overlay.classList.remove('active');
    const messageInput = document.getElementById('contactUserMessageInput');
    if (messageInput) messageInput.value = '';
    clearContactUserPhoto();
}

function initializeContactUserOverlay() {
    const overlay = document.getElementById('contactUserOverlay');
    const closeBtn = document.getElementById('closeContactUserModal');
    const cancelBtn = document.getElementById('cancelContactUserBtn');
    const sendBtn = document.getElementById('sendContactUserBtn');
    const messageInput = document.getElementById('contactUserMessageInput');
    const attachBtn = document.getElementById('contactUserAttachBtn');
    const attachmentInput = document.getElementById('contactUserAttachmentInput');
    const attachmentPreview = document.getElementById('contactUserAttachmentPreview');
    const attachmentImg = document.getElementById('contactUserAttachmentImg');
    const removeAttachment = document.getElementById('removeContactUserAttachment');

    if (closeBtn) closeBtn.addEventListener('click', closeContactUserOverlay);
    if (cancelBtn) cancelBtn.addEventListener('click', closeContactUserOverlay);
    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay) closeContactUserOverlay();
    });

    if (attachBtn && attachmentInput) {
        attachBtn.addEventListener('click', () => attachmentInput.click());
        attachmentInput.addEventListener('change', function() {
            const file = attachmentInput.files && attachmentInput.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                showToast('Only image attachments are supported', 'error', 2500);
                attachmentInput.value = '';
                return;
            }
            const contactUserTooLarge = typeof isSupportPhotoOriginalTooLarge === 'function'
                ? isSupportPhotoOriginalTooLarge(file)
                : file.size > 25 * 1024 * 1024;
            if (contactUserTooLarge) {
                const maxMb = typeof getSupportPhotoOriginalMaxBytes === 'function'
                    ? Math.round(getSupportPhotoOriginalMaxBytes() / (1024 * 1024))
                    : 25;
                showToast(`This photo is too large to attach (over ${maxMb}MB).`, 'error', 2500);
                attachmentInput.value = '';
                return;
            }
            if (contactUserPhotoPreviewUrl) URL.revokeObjectURL(contactUserPhotoPreviewUrl);
            contactUserPhotoFile = file;
            contactUserPhotoPreviewUrl = URL.createObjectURL(file);
            if (attachmentImg) attachmentImg.src = contactUserPhotoPreviewUrl;
            if (attachmentPreview) attachmentPreview.style.display = 'block';
        });
    }

    if (removeAttachment) {
        removeAttachment.addEventListener('click', clearContactUserPhoto);
    }

    sendBtn?.addEventListener('click', async function() {
        if (!currentUserData || !currentUserData.id) {
            showToast('No user selected.', 'error', 2000);
            return;
        }
        const message = (messageInput?.value || '').trim();
        if (!message) {
            showToast('Please enter a message', 'error', 2000);
            return;
        }
        if (typeof window.createOrAppendAdminSupportMessage !== 'function') {
            showToast('Support send is unavailable.', 'error', 2500);
            return;
        }
        if (userModerationActionInFlight) return;
        userModerationActionInFlight = true;
        const originalSendHtml = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<span class="settings-btn-spinner">⌛</span> Sending...';
        const hourglass = document.getElementById('contactUserSendHourglass');
        if (hourglass) {
            hourglass.classList.add('is-visible');
            hourglass.setAttribute('aria-hidden', 'false');
        }

        let uploadedPhotoForCleanup = null;
        try {
            let photoMeta = null;
            if (contactUserPhotoFile && typeof window.uploadSupportPhoto === 'function') {
                const uploaderId = (window.currentAdmin && window.currentAdmin.uid) || null;
                const uploadResult = await window.uploadSupportPhoto(
                    `${currentUserData.id}_contact_${Date.now()}`,
                    contactUserPhotoFile,
                    uploaderId
                );
                if (!uploadResult.success) {
                    showToast((uploadResult.errors && uploadResult.errors[0]) || 'Photo upload failed', 'error', 2500);
                    return;
                }
                photoMeta = { url: uploadResult.url, thumbUrl: uploadResult.thumbUrl };
                uploadedPhotoForCleanup = uploadResult;
            }

            const result = await window.createOrAppendAdminSupportMessage({
                targetUserId: currentUserData.id,
                message,
                source: 'admin_user_contact',
                photoMeta
            });
            if (!result.success) {
                if (uploadedPhotoForCleanup && typeof window.cleanupSupportPhotoUpload === 'function') {
                    await window.cleanupSupportPhotoUpload(uploadedPhotoForCleanup);
                }
                showToast(result.message || 'Send failed', 'error', 2500);
                return;
            }

            const who = currentUserData.fullName || 'user';
            showToast(result.action === 'appended'
                ? `Added to ${who}'s open Support thread`
                : `Message sent to ${who}`, 'success', 2500);
            closeContactUserOverlay();
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalSendHtml;
            userModerationActionInFlight = false;
            if (hourglass) {
                hourglass.classList.remove('is-visible');
                hourglass.setAttribute('aria-hidden', 'true');
            }
        }
    });
}

function showContactUserOverlay() {
    const overlay = document.getElementById('contactUserOverlay');
    const userInfoDisplay = document.getElementById('contactUserInfoDisplay');
    
    if (userInfoDisplay && currentUserData) {
        const safeName = escapeHtml(currentUserData.fullName || '');
        userInfoDisplay.innerHTML = `
            <img src="${currentUserData.avatar}" alt="${safeName}">
            <div class="contact-user-info-name">${safeName}</div>
        `;
    }
    
    overlay.classList.add('active');
}

function initializeUserConfirmationOverlays() {
    // Suspend User
    const suspendConfirm = document.getElementById('confirmSuspendUserBtn');
    const suspendCancel = document.getElementById('cancelSuspendUserBtn');
    const suspendOverlay = document.getElementById('suspendUserConfirmOverlay');
    
    if (suspendConfirm) {
        suspendConfirm.addEventListener('click', () => {
            // Get form values
            const reasonSelect = document.getElementById('suspensionReasonSelect');
            const notesTextarea = document.getElementById('suspensionNotesTextarea');
            const durationSelect = document.getElementById('suspensionDurationSelect');
            
            const reason = reasonSelect ? reasonSelect.value : '';
            const notes = notesTextarea ? notesTextarea.value.trim() : '';
            const duration = durationSelect ? durationSelect.value : 'indefinite';
            
            // Validate required fields
            if (!reason) {
                showToast('Please select a suspension reason', 'error');
                return;
            }
            
            // Build suspension data object
            const suspensionData = {
                reason: reason,
                notes: notes,
                duration: duration
            };
            
            // Suspend user with captured data -- the overlay is closed by
            // suspendUser() itself once the callable resolves (success or
            // failure), not immediately, so it stays visible/disabled
            // through the network round-trip (matches Gig Moderation's
            // confirmSuspendGig pattern).
            suspendUser(currentUserData, suspensionData);
            resetSuspendForm();
        });
    }
    
    if (suspendCancel) {
        suspendCancel.addEventListener('click', () => {
            suspendOverlay.classList.remove('active');
            resetSuspendForm();
        });
    }
    
    // Close suspend overlay when clicking outside
    if (suspendOverlay) {
        suspendOverlay.addEventListener('click', (e) => {
            if (e.target === suspendOverlay) {
                suspendOverlay.classList.remove('active');
                resetSuspendForm();
            }
        });
    }
    
    // Restore User
    const restoreConfirm = document.getElementById('confirmRestoreUserBtn');
    const restoreCancel = document.getElementById('cancelRestoreUserBtn');
    
    if (restoreConfirm) {
        restoreConfirm.addEventListener('click', () => {
            // Overlay is closed by restoreUser() itself once the callable
            // resolves, same reasoning as the suspend confirm above.
            restoreUser(currentUserData);
        });
    }
    
    if (restoreCancel) {
        restoreCancel.addEventListener('click', () => {
            document.getElementById('restoreUserConfirmOverlay').classList.remove('active');
        });
    }
    
    // Approve Verification
    const approveConfirm = document.getElementById('confirmApproveVerificationBtn');
    const approveCancel = document.getElementById('cancelApproveVerificationBtn');
    
    if (approveConfirm) {
        approveConfirm.addEventListener('click', () => {
            approveVerification(currentUserData);
            document.getElementById('approveVerificationConfirmOverlay').classList.remove('active');
        });
    }
    
    if (approveCancel) {
        approveCancel.addEventListener('click', () => {
            document.getElementById('approveVerificationConfirmOverlay').classList.remove('active');
        });
    }
    
    // Revoke Verification
    const revokeConfirm = document.getElementById('confirmRevokeVerificationBtn');
    const revokeCancel = document.getElementById('cancelRevokeVerificationBtn');
    
    if (revokeConfirm) {
        revokeConfirm.addEventListener('click', () => {
            revokeVerification(currentUserData);
            document.getElementById('revokeVerificationConfirmOverlay').classList.remove('active');
        });
    }
    
    if (revokeCancel) {
        revokeCancel.addEventListener('click', () => {
            document.getElementById('revokeVerificationConfirmOverlay').classList.remove('active');
        });
    }
    
    // Permanent Ban -- overlay stays open through the callable (hourglass),
    // same as Gig Moderation suspend/delete. Closed by permanentlyBanUser().
    const permBanConfirm = document.getElementById('confirmPermBanUserBtn');
    const permBanCancel = document.getElementById('cancelPermBanUserBtn');
    
    if (permBanConfirm) {
        permBanConfirm.addEventListener('click', () => {
            permanentlyBanUser(currentUserData);
        });
    }
    
    if (permBanCancel) {
        permBanCancel.addEventListener('click', () => {
            if (userModerationActionInFlight) return;
            document.getElementById('permBanUserConfirmOverlay').classList.remove('active');
        });
    }

    const unbanConfirm = document.getElementById('confirmUnbanUserBtn');
    const unbanCancel = document.getElementById('cancelUnbanUserBtn');

    if (unbanConfirm) {
        unbanConfirm.addEventListener('click', () => {
            unbanUser(currentUserData);
        });
    }

    if (unbanCancel) {
        unbanCancel.addEventListener('click', () => {
            if (userModerationActionInFlight) return;
            document.getElementById('unbanUserConfirmOverlay').classList.remove('active');
        });
    }
    
    // Click outside to close overlays
    const approveOverlay = document.getElementById('approveVerificationConfirmOverlay');
    const revokeOverlay = document.getElementById('revokeVerificationConfirmOverlay');
    const permBanOverlay = document.getElementById('permBanUserConfirmOverlay');
    const unbanOverlay = document.getElementById('unbanUserConfirmOverlay');
    
    [approveOverlay, revokeOverlay, permBanOverlay, unbanOverlay].forEach(overlay => {
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay && !userModerationActionInFlight) {
                    overlay.classList.remove('active');
                }
            });
        }
    });
}

function showSuspendUserConfirmation() {
    const overlay = document.getElementById('suspendUserConfirmOverlay');
    overlay.classList.add('active');
}

function showRestoreUserConfirmation() {
    if (currentUserData && currentUserData.status === 'banned') {
        showToast('This user is banned. Use Unban, not Restore.', 'error', 3000);
        return;
    }
    const overlay = document.getElementById('restoreUserConfirmOverlay');
    overlay.classList.add('active');
}

function showApproveVerificationConfirmation() {
    const overlay = document.getElementById('approveVerificationConfirmOverlay');
    overlay.classList.add('active');
}

function showRevokeVerificationConfirmation() {
    const overlay = document.getElementById('revokeVerificationConfirmOverlay');
    overlay.classList.add('active');
}

function showPermBanUserConfirmation() {
    if (currentUserData && currentUserData.status === 'banned') {
        showToast('This user is already banned.', 'error', 3000);
        return;
    }
    if (currentUserData && currentUserData.status !== 'suspended') {
        showToast('Ban is only available from the Suspended tab after a suspend.', 'error', 3000);
        return;
    }
    const overlay = document.getElementById('permBanUserConfirmOverlay');
    overlay.classList.add('active');
}

function showUnbanUserConfirmation() {
    if (!currentUserData || currentUserData.status !== 'banned') {
        showToast('Unban is only available for banned users.', 'error', 3000);
        return;
    }
    const overlay = document.getElementById('unbanUserConfirmOverlay');
    overlay.classList.add('active');
}

// Reset suspend form fields
function resetSuspendForm() {
    const reasonSelect = document.getElementById('suspensionReasonSelect');
    const notesTextarea = document.getElementById('suspensionNotesTextarea');
    const durationSelect = document.getElementById('suspensionDurationSelect');
    
    if (reasonSelect) reasonSelect.value = '';
    if (notesTextarea) notesTextarea.value = '';
    if (durationSelect) durationSelect.value = 'indefinite';
}

// Format suspension duration for display
function formatSuspensionDuration(suspendedInfo) {
    const duration = suspendedInfo.duration || 'indefinite';
    
    if (duration === 'indefinite') {
        return '<span style="color: #ef4444; font-weight: 600;">Indefinite</span><br><span style="font-size: 0.85rem; color: #a0aec0;">Until manually restored by admin</span>';
    }
    
    // Calculate expiry date based on suspension date and duration
    // Parse suspension date (format: "Month Day, Year, Time")
    const suspensionDateStr = suspendedInfo.suspensionDate;
    let suspensionDate;
    
    try {
        // Try to parse the date string
        suspensionDate = new Date(suspensionDateStr);
    } catch (e) {
        console.error('Failed to parse suspension date:', e);
        return `<span style="color: #f59e0b;">${duration}</span>`;
    }
    
    // Calculate days to add based on duration
    let daysToAdd = 0;
    let durationLabel = '';
    
    switch(duration) {
        case '7-days':
            daysToAdd = 7;
            durationLabel = '7 Days';
            break;
        case '14-days':
            daysToAdd = 14;
            durationLabel = '14 Days';
            break;
        case '30-days':
            daysToAdd = 30;
            durationLabel = '30 Days';
            break;
        case '90-days':
            daysToAdd = 90;
            durationLabel = '90 Days';
            break;
        default:
            return `<span style="color: #f59e0b;">${duration}</span>`;
    }
    
    // Calculate expiry date
    const expiryDate = new Date(suspensionDate);
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);
    
    // Format expiry date
    const expiryDateStr = expiryDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Calculate time remaining
    const now = new Date();
    const timeRemaining = expiryDate - now;
    const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
    
    let statusColor = '#f59e0b'; // orange default
    let statusText = '';
    
    if (daysRemaining <= 0) {
        // Suspension expired - should be auto-restored
        statusColor = '#10b981'; // green
        statusText = '<br><span style="color: #10b981; font-weight: 600;">⚠️ EXPIRED - Should be restored</span>';
    } else if (daysRemaining <= 2) {
        statusColor = '#ef4444'; // red for urgent
        statusText = `<br><span style="color: #ef4444; font-weight: 600;">Expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}</span>`;
    } else {
        statusText = `<br><span style="color: #a0aec0; font-size: 0.85rem;">Expires in ${daysRemaining} days</span>`;
    }
    
    return `<span style="color: ${statusColor}; font-weight: 600;">${durationLabel}</span><br><span style="font-size: 0.85rem; color: #a0aec0;">Until: ${expiryDateStr}</span>${statusText}`;
}

/**
 * Suspend a user via the adminModerateUser callable Cloud Function -- the
 * ONLY write path for users.status (see firestore.rules and
 * functions/index.js). Setting status='suspended' also triggers
 * executeBanCascadeOnUserSuspend server-side, which auto-suspends their
 * gigs, withdraws their pending applications, and reopens gigs where they
 * were the hired worker. The Duration field is hidden in the UI (no
 * auto-expiry function exists) -- suspensionData.duration is always
 * 'indefinite' and isn't sent to the backend at all; notes are folded into
 * the reason string sent, since the backend only stores one reason field.
 */
async function suspendUser(user, suspensionData) {
    if (userModerationActionInFlight) return;
    userModerationActionInFlight = true;
    const confirmBtn = document.getElementById('confirmSuspendUserBtn');
    if (confirmBtn) confirmBtn.disabled = true;

    const reasonParts = [suspensionData.reason];
    if (suspensionData.notes && suspensionData.notes.trim()) {
        reasonParts.push(suspensionData.notes.trim());
    }
    const combinedReason = reasonParts.join(' — ');

    try {
        const result = await callAdminModerateUser(user.id, 'suspend', combinedReason);
        document.getElementById('suspendUserConfirmOverlay')?.classList.remove('active');

        if (!result.success) {
            showToast(result.message || `Could not suspend ${user.fullName}.`, 'error', 3000);
            return;
        }

        closeUserDetail();
        loadUserCards(currentUserTab); // stays on New -- matches Gig Moderation's suspend behavior (reload current tab, not force-navigate)
        showToast(`${user.fullName} has been suspended`, 'success', 2000);
    } catch (error) {
        console.error('❌ Error suspending user:', error);
        document.getElementById('suspendUserConfirmOverlay')?.classList.remove('active');
        showToast('Something went wrong suspending this user.', 'error', 3000);
    } finally {
        userModerationActionInFlight = false;
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

/**
 * Restore (reinstate) a suspended user via adminModerateUser. This only
 * restores account/login access -- it deliberately does NOT auto-restore
 * whatever executeBanCascadeOnUserSuspend touched (their gigs stay
 * suspended). Locked 2026-08-17: the user re-posts if they want those
 * gigs live again. Admin is not expected to relist them. Investigate via
 * Gigs Listed overlay. See functions/index.js adminModerateUser comment.
 */
async function restoreUser(user) {
    if (!user || user.status === 'banned') {
        showToast('This user is banned. Use Unban, not Restore.', 'error', 3000);
        document.getElementById('restoreUserConfirmOverlay')?.classList.remove('active');
        return;
    }
    if (userModerationActionInFlight) return;
    userModerationActionInFlight = true;
    const confirmBtn = document.getElementById('confirmRestoreUserBtn');
    if (confirmBtn) confirmBtn.disabled = true;

    try {
        const result = await callAdminModerateUser(user.id, 'reinstate');
        document.getElementById('restoreUserConfirmOverlay')?.classList.remove('active');

        if (!result.success) {
            showToast(result.message || `Could not restore ${user.fullName}.`, 'error', 3000);
            return;
        }

        closeUserDetail();
        loadUserCards(currentUserTab); // stays on Suspended -- the restored user naturally drops out
        showToast(`${user.fullName} has been restored`, 'success', 2000);
    } catch (error) {
        console.error('❌ Error restoring user:', error);
        document.getElementById('restoreUserConfirmOverlay')?.classList.remove('active');
        showToast('Something went wrong restoring this user.', 'error', 3000);
    } finally {
        userModerationActionInFlight = false;
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

// Dead code below: approveVerification/revokeVerification are unreachable
// (Pending/Verified tabs are hidden -- that tier doesn't exist in the real
// schema, see docs/ADMIN_DASHBOARD_ARCHITECTURE_STUDY.md "User Management —
// resolved design"). Left in place, not deleted, in case that workflow
// gets built later; harmless since nothing can ever call them with a real
// user.status of 'pending'/'verified'.
function approveVerification(user) {
    // Approve verification
    user.status = 'verified';
    user.verificationStatus = 'PRO VERIFIED';
    user.verificationImages = null;
    
    // Close detail overlay
    closeUserDetail();
    
    // Switch to verified tab
    switchUserTab('verified');
    
    showToast(`${user.fullName}'s verification has been approved`, 'success', 2000);
}

function revokeVerification(user) {
    // Revoke verification - user needs to resubmit documents
    user.status = 'pending';
    user.verificationStatus = 'NEW MEMBER';
    // Keep verification images so admin can see what was rejected
    
    // Close detail overlay
    closeUserDetail();
    
    // Switch to pending tab
    switchUserTab('pending');
    
    showToast(`${user.fullName}'s verification has been revoked`, 'success', 2000);
}

async function permanentlyBanUser(user) {
    if (!user || userModerationActionInFlight) return;
    if (user.status !== 'suspended') {
        showToast('Ban is only available after a suspend.', 'error', 3000);
        return;
    }
    userModerationActionInFlight = true;
    setGigConfirmOverlayBusy('permBanUserConfirmOverlay', true);
    setGigConfirmHourglass('permBanUserHourglass', true);

    try {
        const result = await callAdminModerateUser(user.id, 'ban');
        document.getElementById('permBanUserConfirmOverlay')?.classList.remove('active');

        if (!result.success) {
            showToast(result.message || `Could not ban ${user.fullName}.`, 'error', 3000);
            return;
        }

        closeUserDetail();
        loadUserCards(currentUserTab);
        showToast(`${user.fullName} has been banned — login disabled.`, 'success', 2000);
    } catch (error) {
        console.error('❌ Error banning user:', error);
        document.getElementById('permBanUserConfirmOverlay')?.classList.remove('active');
        showToast('Something went wrong banning this user.', 'error', 3000);
    } finally {
        userModerationActionInFlight = false;
        setGigConfirmHourglass('permBanUserHourglass', false);
        setGigConfirmOverlayBusy('permBanUserConfirmOverlay', false);
    }
}

async function unbanUser(user) {
    if (!user || userModerationActionInFlight) return;
    if (user.status !== 'banned') {
        showToast('Unban is only available for banned users.', 'error', 3000);
        return;
    }
    userModerationActionInFlight = true;
    setGigConfirmOverlayBusy('unbanUserConfirmOverlay', true);
    setGigConfirmHourglass('unbanUserHourglass', true);

    try {
        const result = await callAdminModerateUser(user.id, 'unban');
        document.getElementById('unbanUserConfirmOverlay')?.classList.remove('active');

        if (!result.success) {
            showToast(result.message || `Could not unban ${user.fullName}.`, 'error', 3000);
            return;
        }

        closeUserDetail();
        loadUserCards(currentUserTab);
        showToast(`${user.fullName} has been unbanned — login re-enabled.`, 'success', 2000);
    } catch (error) {
        console.error('❌ Error unbanning user:', error);
        document.getElementById('unbanUserConfirmOverlay')?.classList.remove('active');
        showToast('Something went wrong unbanning this user.', 'error', 3000);
    } finally {
        userModerationActionInFlight = false;
        setGigConfirmHourglass('unbanUserHourglass', false);
        setGigConfirmOverlayBusy('unbanUserConfirmOverlay', false);
    }
}

function initializeUserDetailOverlay() {
    const overlay = document.getElementById('userDetailOverlay');
    const closeBtn = document.getElementById('userOverlayCloseBtnX');
    const closeFooterBtn = document.getElementById('userOverlayCloseBtn');
    
    // Close overlay
    const closeOverlay = () => {
        overlay.classList.remove('active');
        closeUserListedGigsOverlay();
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeOverlay);

    overlay?.addEventListener('click', (e) => {
        if (e.target.closest('[data-open-user-gigs]')) {
            openUserListedGigsOverlay();
        }
    });
    
    // Mobile action buttons
    const contactBtn = document.getElementById('userOverlayContactBtn');
    const suspendBtn = document.getElementById('userOverlaySuspendBtn');
    const restoreBtn = document.getElementById('userOverlayRestoreBtn');
    const unbanBtn = document.getElementById('userOverlayUnbanBtn');
    
    if (contactBtn) {
        contactBtn.addEventListener('click', () => {
            showContactUserOverlay();
        });
    }
    
    if (suspendBtn) {
        suspendBtn.addEventListener('click', () => {
            showSuspendUserConfirmation();
        });
    }
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', () => {
            showRestoreUserConfirmation();
        });
    }

    if (unbanBtn) {
        unbanBtn.addEventListener('click', () => {
            showUnbanUserConfirmation();
        });
    }
}

function showUserDetailOverlay(user) {
    const overlay = document.getElementById('userDetailOverlay');
    const overlayBody = overlay.querySelector('.overlay-body');
    
    // Update header (name, rating, status, and social links)
    document.getElementById('userOverlayName').textContent = user.fullName;
    document.getElementById('userOverlayReviewsCount').textContent = user.reviewCount;
    updateStars('userOverlayStars', user.rating);
    document.getElementById('userOverlayStatusBadge').textContent = user.verificationStatus;
    const overlayModerationBadge = document.getElementById('userOverlayModerationBadge');
    if (overlayModerationBadge) {
        overlayModerationBadge.style.display = user.status === 'banned' ? 'inline-block' : 'none';
    }
    
    // Update social links in header (always show all 3 icons)
    const overlaySocialLinksContainer = document.getElementById('userOverlaySocialLinks');
    overlaySocialLinksContainer.innerHTML = '';
    
    // Facebook - always show, clickable if link exists
    if (user.socialMediaLinks.facebook) {
        overlaySocialLinksContainer.innerHTML += `<a href="${user.socialMediaLinks.facebook}" target="_blank" class="user-social-link"><img src="public/icons/FB.png" alt="Facebook"></a>`;
    } else {
        overlaySocialLinksContainer.innerHTML += `<span class="user-social-link user-social-link-inactive"><img src="public/icons/FB.png" alt="Facebook"></span>`;
    }
    
    // Instagram - always show, clickable if link exists
    if (user.socialMediaLinks.instagram) {
        overlaySocialLinksContainer.innerHTML += `<a href="${user.socialMediaLinks.instagram}" target="_blank" class="user-social-link"><img src="public/icons/IG.png" alt="Instagram"></a>`;
    } else {
        overlaySocialLinksContainer.innerHTML += `<span class="user-social-link user-social-link-inactive"><img src="public/icons/IG.png" alt="Instagram"></span>`;
    }
    
    // LinkedIn - always show, clickable if link exists
    if (user.socialMediaLinks.linkedin) {
        overlaySocialLinksContainer.innerHTML += `<a href="${user.socialMediaLinks.linkedin}" target="_blank" class="user-social-link"><img src="public/icons/IN.png" alt="LinkedIn"></a>`;
    } else {
        overlaySocialLinksContainer.innerHTML += `<span class="user-social-link user-social-link-inactive"><img src="public/icons/IN.png" alt="LinkedIn"></span>`;
    }
    
    // Update action buttons
    const suspendBtn = document.getElementById('userOverlaySuspendBtn');
    const restoreBtn = document.getElementById('userOverlayRestoreBtn');
    const overlayUnbanBtn = document.getElementById('userOverlayUnbanBtn');
    
    if (user.status === 'banned') {
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (restoreBtn) restoreBtn.style.display = 'none';
        if (overlayUnbanBtn) overlayUnbanBtn.style.display = 'inline-block';
    } else if (user.status === 'suspended') {
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (restoreBtn) restoreBtn.style.display = 'inline-block';
        if (overlayUnbanBtn) overlayUnbanBtn.style.display = 'none';
    } else {
        if (suspendBtn) suspendBtn.style.display = 'inline-block';
        if (restoreBtn) restoreBtn.style.display = 'none';
        if (overlayUnbanBtn) overlayUnbanBtn.style.display = 'none';
    }
    
    // Build body content (photo, info boxes, intro). fullName/education/
    // introduction are real user-submitted text going into innerHTML --
    // escaped here (unlike the desktop panel, which uses safe .textContent).
    const safeFullName = escapeHtml(user.fullName || '');
    const safeEducation = escapeHtml(user.education || '');
    const safeIntro = escapeHtml(user.introduction || '');
    let bodyHTML = `
        <!-- User Profile Photo (large, like gig photo) -->
        <div class="user-profile-photo-container">
            <img src="${user.avatar}" alt="${safeFullName}" class="user-profile-photo">
        </div>
        
        <!-- User Information Boxes (like gig info boxes) -->
        <div class="user-info-section">
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">REGISTERED SINCE:</div>
                    <div class="user-info-value">${user.registeredDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">BIRTHDATE:</div>
                    <div class="user-info-value">${(() => {
                        const bd = user.birthdate ? new Date(user.birthdate) : null;
                        return (bd && !Number.isNaN(bd.getTime())) ? bd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified';
                    })()}</div>
                </div>
            </div>
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">AGE:</div>
                    <div class="user-info-value">${Number.isFinite(user.age) ? `${user.age} years old` : 'Not specified'}</div>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">EDUCATION:</div>
                    <div class="user-info-value">${safeEducation}</div>
                </div>
            </div>
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">REGION:</div>
                    <div class="user-info-value">${escapeHtml(String(user.region || ''))}</div>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">CITY:</div>
                    <div class="user-info-value">${escapeHtml(String(user.city || ''))}</div>
                </div>
            </div>
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">GIGS LISTED:</div>
                    <button type="button" class="user-info-value user-gigs-listed-btn" data-open-user-gigs="1" title="View listed gigs">${user.gigsListed}</button>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">APPLICATIONS:</div>
                    <div class="user-info-value">${user.applications}</div>
                </div>
            </div>
        </div>
        
        <div class="user-intro-section">
            <div class="user-intro-label">INTRODUCTION:</div>
            <div class="user-intro-text">${safeIntro}</div>
        </div>
        
        <div class="user-profile-section">
            <button class="view-profile-btn" onclick="openUserPublicProfile('${user.id}')">
                <span class="profile-btn-icon">👩🏻</span>
                <span>VIEW PROFILE</span>
            </button>
        </div>
    `;
    
    // Add footer sections based on status
    if (user.status === 'pending' && user.verificationImages) {
        bodyHTML += `
            <div class="user-detail-footer" style="margin-top: 1rem;">
                <div class="verification-images-section" style="display: block;">
                    <div class="verification-images-label">VERIFICATION DOCUMENTS:</div>
                    <div class="verification-images-grid">
                        <div class="verification-image-item">
                            <div class="verification-image-preview">
                                <img src="${user.verificationImages.idImage}" alt="ID">
                            </div>
                            <div class="verification-image-actions">
                                <button class="verification-view-btn" onclick="viewVerificationImage('${user.verificationImages.idImage}', 'Government ID')">👁️ View</button>
                                <button class="verification-download-btn" onclick="downloadImage('${user.verificationImages.idImage}', '${user.fullName}_ID.jpg')">⬇️ Download</button>
                            </div>
                            <div class="verification-image-label">Government ID</div>
                        </div>
                        <div class="verification-image-item">
                            <div class="verification-image-preview">
                                <img src="${user.verificationImages.selfieImage}" alt="Selfie with ID">
                            </div>
                            <div class="verification-image-actions">
                                <button class="verification-view-btn" onclick="viewVerificationImage('${user.verificationImages.selfieImage}', 'Selfie with ID')">👁️ View</button>
                                <button class="verification-download-btn" onclick="downloadImage('${user.verificationImages.selfieImage}', '${user.fullName}_Selfie.jpg')">⬇️ Download</button>
                            </div>
                            <div class="verification-image-label">Selfie with ID</div>
                        </div>
                    </div>
                </div>
                <div class="big-approve-section" style="display: block;">
                    <div class="big-approve-message">
                        <div class="big-approve-icon">✅</div>
                        <div class="big-approve-text">
                            <strong>Action Required:</strong> Review the verification documents and approve this user's identity verification request.
                        </div>
                    </div>
                    <button class="big-approve-btn" onclick="showApproveVerificationConfirmation()">APPROVE VERIFICATION</button>
                </div>
            </div>
        `;
    } else if (user.status === 'verified') {
        bodyHTML += `
            <div class="user-detail-footer" style="margin-top: 1rem;">
                <div class="big-revoke-section" style="display: block;">
                    <div class="big-revoke-warning">
                        <div class="big-revoke-icon">⚠️</div>
                        <div class="big-revoke-text">
                            <strong>Revoke Verification:</strong> This will remove the user's verified status and badge. They will need to re-submit documents to regain verification.
                        </div>
                    </div>
                    <button class="big-revoke-btn" onclick="showRevokeVerificationConfirmation()">REVOKE VERIFICATION</button>
                </div>
            </div>
        `;
    } else if ((user.status === 'suspended' || user.status === 'banned') && user.suspendedInfo) {
        // Format duration for display
        const durationText = formatSuspensionDuration(user.suspendedInfo);
        
        // Build notes HTML only if notes exist
        let notesHTML = '';
        if (user.suspendedInfo.notes && user.suspendedInfo.notes.trim()) {
            notesHTML = `
                <div class="suspended-info-label" style="margin-top: 1rem;">ADDITIONAL NOTES:</div>
                <div class="suspended-info-text" style="white-space: pre-wrap; line-height: 1.5;">${escapeHtml(user.suspendedInfo.notes)}</div>
            `;
        }

        const bannedRows = (user.status === 'banned' && user.bannedInfo) ? `
                    <div class="suspended-info-label" style="margin-top: 1rem;">BANNED BY:</div>
                    <div class="suspended-info-text">${escapeHtml(user.bannedInfo.bannedBy || '')}</div>
                    <div class="suspended-info-label" style="margin-top: 1rem;">BAN DATE:</div>
                    <div class="suspended-info-text">${escapeHtml(user.bannedInfo.bannedDate || '')}</div>
        ` : '';

        const banSectionCopy = user.status === 'banned'
            ? '<strong>Banned:</strong> Login is disabled. Evidence stays on file. Unban re-enables login and does not relist their gigs.'
            : '<strong>Danger Zone:</strong> Permanent ban disables this account\'s login. Reviews, gigs, applications, messages, logs, and uploaded files stay on file as evidence. This is not a data delete and not an IP block.';
        const banSectionButton = user.status === 'banned'
            ? '<button class="perm-ban-btn unban-user-btn" onclick="showUnbanUserConfirmation()">UNBAN USER</button>'
            : '<button class="perm-ban-btn" onclick="showPermBanUserConfirmation()">PERMANENTLY BAN USER</button>';
        
        bodyHTML += `
            <div class="user-detail-footer" style="margin-top: 1rem;">
                <div class="suspended-info-section" style="display: block;">
                    <div class="suspended-info-label">SUSPENDED BY:</div>
                    <div class="suspended-info-text">${escapeHtml(user.suspendedInfo.suspendedBy || '')}</div>
                    
                    <div class="suspended-info-label" style="margin-top: 1rem;">SUSPENSION DATE:</div>
                    <div class="suspended-info-text">${escapeHtml(user.suspendedInfo.suspensionDate || '')}</div>
                    
                    <div class="suspended-info-label" style="margin-top: 1rem;">REASON:</div>
                    <div class="suspended-info-text">${escapeHtml(user.suspendedInfo.reason || 'Not specified')}</div>
                    
                    <div class="suspended-info-label" style="margin-top: 1rem;">DURATION:</div>
                    <div class="suspended-info-text">${durationText}</div>
                    ${notesHTML}
                    ${bannedRows}
                </div>
                <div class="perm-ban-section" style="display: block;">
                    <div class="perm-ban-warning">
                        <div class="perm-ban-icon">🚫</div>
                        <div class="perm-ban-text">${banSectionCopy}</div>
                    </div>
                    <div class="perm-ban-ip-display">
                        <div class="perm-ban-ip-label">Last Signup IP:</div>
                        <div class="perm-ban-ip-value">${escapeHtml(String(user.ipAddress || ''))}</div>
                    </div>
                    ${banSectionButton}
                </div>
            </div>
        `;
    }
    
    overlayBody.innerHTML = bodyHTML;
    
    overlay.classList.add('active');
    
    // Reset scroll position to top (after overlay is visible)
    setTimeout(() => {
        if (overlayBody) {
            overlayBody.scrollTop = 0;
        }
    }, 0);
}

// Global helper function for mobile overlay buttons
function viewVerificationImage(imageUrl, label) {
    const lightboxImage = document.getElementById('lightboxImage');
    const lightboxLabel = document.getElementById('lightboxLabel');
    const lightboxOverlay = document.getElementById('imageLightboxOverlay');
    
    lightboxImage.src = imageUrl;
    lightboxLabel.textContent = label;
    lightboxOverlay.classList.add('active');
}

// Resize listener for User Management - switch between panel and overlay
window.addEventListener('resize', () => {
    const userOverlay = document.getElementById('userDetailOverlay');
    
    if (window.innerWidth >= 888 && userOverlay && userOverlay.classList.contains('active')) {
        // Switched to desktop - hide overlay and show in panel
        userOverlay.classList.remove('active');
        
        if (currentUserData) {
            displayUserDetails(currentUserData);
        }
    } else if (window.innerWidth < 888 && currentUserData && document.getElementById('userContent')?.style.display !== 'none') {
        // Switched to mobile - hide panel and show overlay
        if (currentUserData) {
            showUserDetailOverlay(currentUserData);
        }
    }
});

// ===== AD PLACEMENT SETTINGS (PHASE 3) =====
const AD_PANEL_COLLAPSE_STORAGE_KEY = 'gisugo_admin_ad_panel_collapse_v1';
const DEFAULT_AD_PANEL_COLLAPSE_STATE = {
    adItemCardBody: false,
    adInventoryCardBody: false,
    adActionsCardBody: false
};
// Reset / fallback matches the Phase 6 seed (listing.js AD_TRIAL_CONFIG).
const DEFAULT_AD_PANEL_SETTINGS = {
    enabled: true,
    frequencyCards: 6,
    maxAdsPerSession: 6,
    startAfterCards: 0,
    allowTailAd: true,
    allowEmptyStateAd: true,
    rotationMode: 'random',
    zones: {
        listing_feed_inline: true,
        profile_logout_slot: true,
        gig_detail_post_customer: true
    },
    ads: [
        {
            id: 'video-safety-tips',
            type: 'video_popup',
            subtype: 'in_app_offer',
            status: 'active',
            imageSrc: 'public/images/womensafety.jpg',
            altText: 'Watch quick platform guide',
            badgeText: 'Platform Update',
            weight: 100,
            maxImpressions: 0,
            maxClicks: 0,
            currentImpressions: 0,
            currentClicks: 0,
            startAt: '',
            endAt: '',
            action: {
                type: 'open_video_popup',
                target: 'https://www.youtube.com/shorts/BVCmz9KnwWk',
                youtubeEmbed: 'https://www.youtube.com/shorts/BVCmz9KnwWk',
                poster: 'public/images/womensafety.jpg',
                aspectRatio: '9:16'
            }
        },
        {
            id: 'sponsored-partner-spot',
            type: 'sponsored_external',
            subtype: 'sponsored_campaign',
            status: 'active',
            imageSrc: 'public/images/adsponsor.jpg',
            altText: 'Sponsored partner spotlight',
            badgeText: 'Sponsored',
            weight: 100,
            maxImpressions: 0,
            maxClicks: 0,
            currentImpressions: 0,
            currentClicks: 0,
            startAt: '',
            endAt: '',
            action: {
                type: 'navigate',
                target: 'https://www.RealinterfaceStudios.com',
                url: 'https://www.RealinterfaceStudios.com'
            }
        },
        {
            id: 'video-platform-updates',
            type: 'video_popup',
            subtype: 'in_app_offer',
            status: 'active',
            imageSrc: 'public/images/updatesbanner.jpg',
            altText: 'Watch latest platform updates',
            badgeText: 'Platform Update',
            weight: 100,
            maxImpressions: 0,
            maxClicks: 0,
            currentImpressions: 0,
            currentClicks: 0,
            startAt: '',
            endAt: '',
            action: {
                type: 'open_video_popup',
                target: 'https://youtu.be/L2GUEZpNCsQ',
                youtubeEmbed: 'https://youtu.be/L2GUEZpNCsQ',
                poster: 'public/images/updatesbanner.jpg',
                aspectRatio: '16:9'
            }
        },
        {
            id: 'offer-verify',
            type: 'site_offer',
            subtype: 'in_app_offer',
            status: 'active',
            imageSrc: 'public/images/verify.png',
            altText: 'Get verified offer',
            badgeText: '',
            weight: 100,
            maxImpressions: 0,
            maxClicks: 0,
            currentImpressions: 0,
            currentClicks: 0,
            startAt: '',
            endAt: '',
            action: {
                type: 'navigate',
                target: 'profile.html',
                url: 'profile.html'
            }
        },
        {
            id: 'offer-share-gisugo',
            type: 'site_offer',
            subtype: 'in_app_offer',
            status: 'active',
            imageSrc: 'public/images/sharebanner.jpg',
            altText: 'Share GisuGo with your network',
            badgeText: '',
            weight: 100,
            maxImpressions: 0,
            maxClicks: 0,
            currentImpressions: 0,
            currentClicks: 0,
            startAt: '',
            endAt: '',
            action: {
                type: 'share',
                title: 'Check out GisuGo',
                text: 'Browse local gigs and opportunities on GisuGo.',
                url: 'https://www.Gisugo.com',
                target: 'https://www.Gisugo.com'
            }
        }
    ]
};

let adPanelState = JSON.parse(JSON.stringify(DEFAULT_AD_PANEL_SETTINGS));
let adPanelCollapseState = { ...DEFAULT_AD_PANEL_COLLAPSE_STATE };

function mergeAdPanelState(parsed) {
    const source = parsed && typeof parsed === 'object' ? parsed : {};
    return {
        ...JSON.parse(JSON.stringify(DEFAULT_AD_PANEL_SETTINGS)),
        ...source,
        zones: {
            ...DEFAULT_AD_PANEL_SETTINGS.zones,
            ...(source.zones || {})
        },
        ads: Array.isArray(source.ads) ? source.ads : [...DEFAULT_AD_PANEL_SETTINGS.ads]
    };
}

function getAdPanelPayload() {
    return {
        enabled: !!adPanelState.enabled,
        frequencyCards: Number(adPanelState.frequencyCards) || 6,
        maxAdsPerSession: Number(adPanelState.maxAdsPerSession) || 6,
        startAfterCards: Number(adPanelState.startAfterCards) || 0,
        allowTailAd: !!adPanelState.allowTailAd,
        allowEmptyStateAd: !!adPanelState.allowEmptyStateAd,
        rotationMode: adPanelState.rotationMode || 'random',
        zones: {
            listing_feed_inline: !!(adPanelState.zones && adPanelState.zones.listing_feed_inline),
            profile_logout_slot: !!(adPanelState.zones && adPanelState.zones.profile_logout_slot),
            gig_detail_post_customer: !!(adPanelState.zones && adPanelState.zones.gig_detail_post_customer)
        },
        ads: Array.isArray(adPanelState.ads) ? adPanelState.ads : []
    };
}

async function persistAdPanelToFirestore() {
    if (typeof window.saveAdSettings !== 'function') {
        console.error('saveAdSettings is not available');
        return false;
    }
    return window.saveAdSettings(getAdPanelPayload());
}

async function initializeAdSettingsPanel() {
    const adsSection = document.getElementById('ads');
    if (!adsSection) return;

    loadAdPanelCollapseState();
    bindAdPanelActions();
    setupAdPanelCollapsibles();
    applyAdPanelCollapseState();
    await loadAdPanelState();
    renderAdInventoryList();
    syncAdPanelFormFromState();
    updateAdEnabledIndicator();
    console.log('Ad placement settings panel initialized');
}

async function loadAdPanelState() {
    adPanelState = JSON.parse(JSON.stringify(DEFAULT_AD_PANEL_SETTINGS));
    if (typeof window.getAdSettings !== 'function') {
        console.warn('getAdSettings is not available; using seeded defaults');
        return;
    }
    try {
        const remote = await window.getAdSettings();
        if (remote) {
            adPanelState = mergeAdPanelState(remote);
            return;
        }
        console.warn('adSettings/global missing; using seeded defaults');
    } catch (error) {
        console.warn('Failed to load ad settings; using seeded defaults.', error);
        adPanelState = JSON.parse(JSON.stringify(DEFAULT_AD_PANEL_SETTINGS));
    }
}

function loadAdPanelCollapseState() {
    try {
        const raw = localStorage.getItem(AD_PANEL_COLLAPSE_STORAGE_KEY);
        if (!raw) {
            const isMobile = window.innerWidth <= 768;
            adPanelCollapseState = {
                adItemCardBody: false,
                adInventoryCardBody: isMobile,
                adActionsCardBody: isMobile
            };
            return;
        }
        const parsed = JSON.parse(raw);
        adPanelCollapseState = {
            ...DEFAULT_AD_PANEL_COLLAPSE_STATE,
            ...(parsed || {})
        };
    } catch (error) {
        console.warn('⚠️ Failed to load ad panel collapse state; using defaults.', error);
        adPanelCollapseState = { ...DEFAULT_AD_PANEL_COLLAPSE_STATE };
    }
}

function saveAdPanelCollapseState() {
    localStorage.setItem(AD_PANEL_COLLAPSE_STORAGE_KEY, JSON.stringify(adPanelCollapseState));
}

function bindAdPanelActions() {
    const saveBtn = document.getElementById('adSaveBtn');
    const resetBtn = document.getElementById('adResetBtn');
    const addOrUpdateBtn = document.getElementById('adAddOrUpdateBtn');
    const clearFormBtn = document.getElementById('adClearFormBtn');
    const enabledToggle = document.getElementById('adEnabled');
    const adTypeSelect = document.getElementById('adItemType');

    if (enabledToggle) {
        enabledToggle.addEventListener('change', () => {
            updateAdEnabledIndicator();
            syncAdSystemDependentToggles(true);
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            collectAdPanelControls();
            const original = saveBtn.textContent;
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
            const success = await persistAdPanelToFirestore();
            saveBtn.disabled = false;
            saveBtn.textContent = original;
            if (success) {
                showToast('Ad settings saved.', 'success');
                flashButtonState(saveBtn, 'Saved');
            } else {
                showToast('Failed to save ad settings. Try again.', 'error');
            }
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            adPanelState = JSON.parse(JSON.stringify(DEFAULT_AD_PANEL_SETTINGS));
            syncAdPanelFormFromState();
            renderAdInventoryList();
            clearAdItemForm();
            const original = resetBtn.textContent;
            resetBtn.disabled = true;
            resetBtn.textContent = 'Resetting...';
            const success = await persistAdPanelToFirestore();
            resetBtn.disabled = false;
            resetBtn.textContent = original;
            if (success) {
                showToast('Ad settings reset to defaults.', 'success');
                flashButtonState(resetBtn, 'Reset');
            } else {
                showToast('Failed to reset ad settings. Try again.', 'error');
            }
        });
    }

    if (addOrUpdateBtn) {
        addOrUpdateBtn.addEventListener('click', async () => {
            collectAdPanelControls();
            if (!upsertAdFromForm()) {
                showToast('Fill Ad ID, image, and action target first.', 'error');
                return;
            }
            renderAdInventoryList();
            const original = addOrUpdateBtn.textContent;
            addOrUpdateBtn.disabled = true;
            addOrUpdateBtn.textContent = 'Saving...';
            const success = await persistAdPanelToFirestore();
            addOrUpdateBtn.disabled = false;
            addOrUpdateBtn.textContent = original;
            if (success) {
                clearAdItemForm();
                showToast('Ad saved.', 'success');
                flashButtonState(addOrUpdateBtn, 'Updated');
            } else {
                showToast('Failed to save ad. Try again.', 'error');
            }
        });
    }

    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', clearAdItemForm);
    }

    if (adTypeSelect) {
        adTypeSelect.addEventListener('change', () => {
            syncAdTypeFormState(adTypeSelect.value);
        });
    }
}

function setupAdPanelCollapsibles() {
    const toggles = document.querySelectorAll('.ad-collapse-toggle[data-collapse-target]');
    toggles.forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const targetId = toggle.getAttribute('data-collapse-target');
            if (!targetId) return;
            const current = !!adPanelCollapseState[targetId];
            adPanelCollapseState[targetId] = !current;
            applyAdPanelCollapseState();
            saveAdPanelCollapseState();
        });
    });
}

function applyAdPanelCollapseState() {
    const toggles = document.querySelectorAll('.ad-collapse-toggle[data-collapse-target]');
    toggles.forEach((toggle) => {
        const targetId = toggle.getAttribute('data-collapse-target');
        if (!targetId) return;
        const target = document.getElementById(targetId);
        if (!target) return;
        const isCollapsed = !!adPanelCollapseState[targetId];
        target.classList.toggle('is-collapsed', isCollapsed);
        toggle.textContent = isCollapsed ? 'Show' : 'Hide';
        toggle.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
    });
}

function syncAdTypeFormState(currentType) {
    const activeType = currentType || 'site_offer';
    const conditionalFields = document.querySelectorAll('.ad-type-field[data-ad-type]');
    conditionalFields.forEach((field) => {
        const targetType = field.getAttribute('data-ad-type');
        field.style.display = targetType === activeType ? '' : 'none';
    });
}

function updateAdEnabledIndicator() {
    const enabledEl = document.getElementById('adEnabled');
    const stateEl = document.getElementById('adEnabledText');
    if (!enabledEl || !stateEl) return;
    const isOn = enabledEl.type === 'checkbox' ? !!enabledEl.checked : enabledEl.value === 'true';
    stateEl.textContent = isOn ? 'ON' : 'OFF';
}

function syncAdSystemDependentToggles(forceOffWhenDisabled = false) {
    const enabledEl = document.getElementById('adEnabled');
    if (!enabledEl) return;
    const isOn = enabledEl.type === 'checkbox' ? !!enabledEl.checked : enabledEl.value === 'true';

    const dependentIds = ['adAllowTail', 'adAllowEmpty', 'zoneListingInline', 'zoneProfileSlot', 'zoneGigDetailSlot'];
    dependentIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!isOn && forceOffWhenDisabled) {
            el.checked = false;
        }
        el.disabled = !isOn;
    });
}

function collectAdPanelControls() {
    const enabled = document.getElementById('adEnabled');
    const frequencyCards = document.getElementById('adFrequencyCards');
    const allowTail = document.getElementById('adAllowTail');
    const allowEmpty = document.getElementById('adAllowEmpty');
    const zoneListingInline = document.getElementById('zoneListingInline');
    const zoneProfileSlot = document.getElementById('zoneProfileSlot');
    const zoneGigDetailSlot = document.getElementById('zoneGigDetailSlot');

    if (enabled) {
        adPanelState.enabled = enabled.type === 'checkbox' ? !!enabled.checked : enabled.value === 'true';
    } else {
        adPanelState.enabled = true;
    }
    adPanelState.frequencyCards = frequencyCards ? Math.max(1, parseInt(frequencyCards.value, 10) || 6) : (Number(adPanelState.frequencyCards) || 6);
    adPanelState.allowTailAd = allowTail ? !!allowTail.checked : true;
    adPanelState.allowEmptyStateAd = allowEmpty ? !!allowEmpty.checked : true;

    adPanelState.zones = {
        listing_feed_inline: zoneListingInline ? !!zoneListingInline.checked : true,
        profile_logout_slot: zoneProfileSlot ? !!zoneProfileSlot.checked : true,
        gig_detail_post_customer: zoneGigDetailSlot ? !!zoneGigDetailSlot.checked : true
    };
}

function syncAdPanelFormFromState() {
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = String(value);
    };
    const setChecked = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.checked = !!value;
    };

    const enabledEl = document.getElementById('adEnabled');
    if (enabledEl) {
        if (enabledEl.type === 'checkbox') {
            enabledEl.checked = !!adPanelState.enabled;
        } else {
            enabledEl.value = adPanelState.enabled ? 'true' : 'false';
        }
    }
    updateAdEnabledIndicator();
    setValue('adFrequencyCards', adPanelState.frequencyCards);
    setChecked('adAllowTail', adPanelState.allowTailAd);
    setChecked('adAllowEmpty', adPanelState.allowEmptyStateAd);
    setChecked('zoneListingInline', adPanelState.zones.listing_feed_inline);
    setChecked('zoneProfileSlot', adPanelState.zones.profile_logout_slot);
    setChecked('zoneGigDetailSlot', adPanelState.zones.gig_detail_post_customer);
    syncAdSystemDependentToggles(false);
    const typeEl = document.getElementById('adItemType');
    syncAdTypeFormState(typeEl ? typeEl.value : 'site_offer');
}

function getAdItemFormData() {
    const adId = (document.getElementById('adItemId')?.value || '').trim();
    const type = document.getElementById('adItemType')?.value || 'site_offer';
    const imageSrc = (document.getElementById('adItemImageSrc')?.value || '').trim();
    const altText = (document.getElementById('adItemAltText')?.value || '').trim();
    const actionTypeInput = document.getElementById('adItemActionType')?.value || 'navigate';
    const actionTarget = (document.getElementById('adItemActionTarget')?.value || '').trim();
    const externalUrl = (document.getElementById('adItemExternalUrl')?.value || '').trim();
    const videoUrl = (document.getElementById('adItemVideoUrl')?.value || '').trim();
    const videoThumbnail = (document.getElementById('adItemVideoThumbnail')?.value || '').trim();
    const weight = Math.max(1, parseInt(document.getElementById('adItemWeight')?.value || '100', 10));
    const status = document.getElementById('adItemStatus')?.value || 'active';
    const maxImpressions = Math.max(0, parseInt(document.getElementById('adItemMaxImpressions')?.value || '0', 10));
    const maxClicks = Math.max(0, parseInt(document.getElementById('adItemMaxClicks')?.value || '0', 10));
    const startAt = document.getElementById('adItemStartAt')?.value || '';
    const endAt = document.getElementById('adItemEndAt')?.value || '';
    let resolvedActionType = actionTypeInput;
    let resolvedActionTarget = actionTarget;
    let resolvedVideoUrl = '';
    let resolvedImageSrc = imageSrc;

    if (type === 'sponsored_external') {
        resolvedActionType = 'navigate';
        resolvedActionTarget = externalUrl;
    } else if (type === 'video_popup') {
        resolvedActionType = 'open_video_popup';
        resolvedActionTarget = videoUrl;
        resolvedVideoUrl = videoUrl;
        if (videoThumbnail) {
            resolvedImageSrc = videoThumbnail;
        }
    }

    if (!adId || !resolvedImageSrc || !resolvedActionTarget) {
        return null;
    }

    return {
        id: adId,
        type,
        status,
        imageSrc: resolvedImageSrc,
        altText: altText || adId,
        weight,
        maxImpressions,
        maxClicks,
        currentImpressions: 0,
        currentClicks: 0,
        startAt,
        endAt,
        action: {
            type: resolvedActionType,
            target: resolvedActionTarget,
            ...(resolvedVideoUrl ? { youtubeEmbed: resolvedVideoUrl } : {}),
            ...(videoThumbnail ? { poster: videoThumbnail } : {})
        }
    };
}

function upsertAdFromForm() {
    const formData = getAdItemFormData();
    if (!formData) return false;

    const existingIndex = adPanelState.ads.findIndex(ad => ad.id === formData.id);
    if (existingIndex >= 0) {
        const existing = adPanelState.ads[existingIndex];
        adPanelState.ads[existingIndex] = {
            ...existing,
            ...formData,
            currentImpressions: Number(existing.currentImpressions || 0),
            currentClicks: Number(existing.currentClicks || 0)
        };
    } else {
        adPanelState.ads.push(formData);
    }
    return true;
}

function clearAdItemForm() {
    const fields = ['adItemId', 'adItemImageSrc', 'adItemAltText', 'adItemActionTarget', 'adItemExternalUrl', 'adItemVideoUrl', 'adItemVideoThumbnail', 'adItemStartAt', 'adItemEndAt'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const weight = document.getElementById('adItemWeight');
    if (weight) weight.value = '100';
    const type = document.getElementById('adItemType');
    if (type) type.value = 'site_offer';
    const actionType = document.getElementById('adItemActionType');
    if (actionType) actionType.value = 'navigate';
    const status = document.getElementById('adItemStatus');
    if (status) status.value = 'active';
    const maxImpressions = document.getElementById('adItemMaxImpressions');
    if (maxImpressions) maxImpressions.value = '0';
    const maxClicks = document.getElementById('adItemMaxClicks');
    if (maxClicks) maxClicks.value = '0';
    const ctrField = document.getElementById('adItemCtr');
    if (ctrField) ctrField.value = '0.00%';
    syncAdTypeFormState('site_offer');
}

function renderAdInventoryList() {
    const container = document.getElementById('adInventoryList');
    const emptyState = document.getElementById('adInventoryEmpty');
    if (!container || !emptyState) return;

    container.innerHTML = '';
    const items = Array.isArray(adPanelState.ads) ? adPanelState.ads : [];
    emptyState.style.display = items.length ? 'none' : 'block';

    items.forEach((ad) => {
        const item = document.createElement('div');
        item.className = 'ad-inventory-item';
        const typeIconMap = {
            site_offer: '🏷️',
            sponsored_external: '📣',
            video_popup: '🎬'
        };
        const typeIcon = typeIconMap[ad.type] || '🔔';

        const thumb = document.createElement('div');
        thumb.className = 'ad-inventory-thumb';
        const imageSrc = String(ad.imageSrc || '').trim();
        if (imageSrc) {
            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = ad.altText || ad.id || '';
            img.loading = 'lazy';
            img.addEventListener('error', () => {
                thumb.classList.add('is-missing');
                img.remove();
            });
            thumb.appendChild(img);
        } else {
            thumb.classList.add('is-missing');
        }

        const meta = document.createElement('div');
        meta.className = 'ad-inventory-meta';
        const status = ad.status || 'active';
        const impressionCap = Number(ad.maxImpressions || 0);
        const clickCap = Number(ad.maxClicks || 0);
        const ctr = calculateCtr(ad.currentClicks || 0, ad.currentImpressions || 0);
        const impressionText = impressionCap > 0 ? `${ad.currentImpressions || 0}/${impressionCap}` : `${ad.currentImpressions || 0}/∞`;
        const clickText = clickCap > 0 ? `${ad.currentClicks || 0}/${clickCap}` : `${ad.currentClicks || 0}/∞`;
        const windowText = formatAdDateWindow(ad.startAt, ad.endAt);
        meta.innerHTML = `
            <div class="ad-inventory-title">${typeIcon} ${ad.id}</div>
            <div class="ad-inventory-sub">${ad.type} • ${ad.action?.type || 'navigate'} • w:${ad.weight || 100} • ${status}</div>
            <div class="ad-inventory-sub">Impressions: ${impressionText} • Clicks: ${clickText} • CTR: ${ctr}</div>
            <div class="ad-inventory-sub">${windowText}</div>
        `;

        const actions = document.createElement('div');
        actions.className = 'ad-inventory-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'ad-mini-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => populateAdFormForEdit(ad));

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'ad-mini-btn';
        removeBtn.textContent = 'Delete';
        removeBtn.addEventListener('click', async () => {
            adPanelState.ads = adPanelState.ads.filter(itemAd => itemAd.id !== ad.id);
            renderAdInventoryList();
            const success = await persistAdPanelToFirestore();
            if (!success) {
                showToast('Failed to delete ad. Try again.', 'error');
            }
        });

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'ad-mini-btn';
        toggleBtn.textContent = status === 'paused' ? 'Resume' : 'Pause';
        toggleBtn.addEventListener('click', async () => {
            const target = adPanelState.ads.find(itemAd => itemAd.id === ad.id);
            if (!target) return;
            target.status = target.status === 'paused' ? 'active' : 'paused';
            renderAdInventoryList();
            const success = await persistAdPanelToFirestore();
            if (!success) {
                showToast('Failed to update ad status. Try again.', 'error');
            }
        });

        actions.appendChild(editBtn);
        actions.appendChild(toggleBtn);
        actions.appendChild(removeBtn);
        item.appendChild(thumb);
        item.appendChild(meta);
        item.appendChild(actions);
        container.appendChild(item);
    });
}

function expandAdItemFormForEdit() {
    adPanelCollapseState.adItemCardBody = false;
    applyAdPanelCollapseState();
    saveAdPanelCollapseState();
    const formCard = document.getElementById('adItemCardBody')
        && document.getElementById('adItemCardBody').closest('.ad-settings-card');
    if (formCard && typeof formCard.scrollIntoView === 'function') {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function populateAdFormForEdit(ad) {
    if (!ad) return;
    expandAdItemFormForEdit();
    const setValue = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = value || '';
    };
    setValue('adItemId', ad.id);
    setValue('adItemType', ad.type || 'site_offer');
    setValue('adItemImageSrc', ad.imageSrc);
    setValue('adItemAltText', ad.altText);
    const resolvedTarget = ad.action?.target || ad.action?.url || ad.action?.modalId || '';
    const adType = ad.type || 'site_offer';
    if (adType === 'sponsored_external') {
        setValue('adItemActionType', 'navigate');
        setValue('adItemExternalUrl', resolvedTarget);
        setValue('adItemActionTarget', '');
        setValue('adItemVideoUrl', '');
        setValue('adItemVideoThumbnail', '');
    } else if (adType === 'video_popup') {
        setValue('adItemActionType', 'open_video_popup');
        setValue('adItemVideoUrl', ad.action?.youtubeEmbed || resolvedTarget);
        setValue('adItemVideoThumbnail', ad.action?.poster || ad.imageSrc || '');
        setValue('adItemActionTarget', '');
        setValue('adItemExternalUrl', '');
    } else {
        setValue('adItemActionType', ad.action?.type || 'navigate');
        setValue('adItemActionTarget', resolvedTarget);
        setValue('adItemExternalUrl', '');
        setValue('adItemVideoUrl', '');
        setValue('adItemVideoThumbnail', '');
    }
    setValue('adItemWeight', ad.weight || 100);
    setValue('adItemStatus', ad.status || 'active');
    setValue('adItemMaxImpressions', ad.maxImpressions || 0);
    setValue('adItemMaxClicks', ad.maxClicks || 0);
    setValue('adItemStartAt', ad.startAt || '');
    setValue('adItemEndAt', ad.endAt || '');
    setValue('adItemCtr', calculateCtr(ad.currentClicks || 0, ad.currentImpressions || 0));
    syncAdTypeFormState(adType);
    showToast('Loaded ' + (ad.id || 'ad') + ' into the form.', 'success');
}

function formatAdDateWindow(startAt, endAt) {
    if (!startAt && !endAt) return 'Schedule: always on';
    const start = startAt ? `from ${startAt}` : 'from now';
    const end = endAt ? `until ${endAt}` : 'until manually stopped';
    return `Schedule: ${start} • ${end}`;
}

function calculateCtr(clicks, impressions) {
    const c = Number(clicks || 0);
    const i = Number(impressions || 0);
    if (i <= 0) return '0.00%';
    return `${((c / i) * 100).toFixed(2)}%`;
}

function flashButtonState(button, text) {
    if (!button) return;
    const original = button.textContent;
    button.textContent = text;
    setTimeout(() => {
        button.textContent = original;
    }, 1200);
}

// ===== INITIALIZATION COMPLETE =====
console.log('✅ Admin Dashboard JavaScript loaded successfully');
console.log('🎮 Keyboard shortcuts: Alt+1-6 (navigation), Ctrl+K (search)');
