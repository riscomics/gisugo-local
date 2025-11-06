// GISUGO Admin Dashboard JavaScript

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
    
    // Initialize admin messages system
    initializeAdminMessages();
    
    // Initialize admin chats system
    initializeAdminChats();
    
    // Initialize reply modal system
    initializeReplyModal();
    
    // Initialize messages pagination
    initializeMessagesPagination();
    
    // Initialize inbox toggle system
    initializeInboxToggle();
    
    // Initialize public message compose overlay
    initializePublicMessageOverlay();
    
    // Initialize inbox search
    initializeInboxSearch();
    
    // Initialize message overlay system
    initializeMessageOverlay();
    
    // Initialize gig moderation system
    initializeGigModeration();
    
    // Initialize user management system
    initializeUserManagement();
    
    // Initialize stat overlay system
    initializeStatOverlays();
    
    // Initialize reset button
    initializeResetButton();
    
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
function initializeNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
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
            
            // Update page title
            updatePageTitle(targetSection);
            
            console.log(`📱 Navigated to: ${targetSection}`);
        });
    });
}

// Update page title based on current section
function updatePageTitle(section) {
    const titles = {
        'overview': 'Dashboard Overview',
        'users': 'User Management', 
        'finance': 'Financial Management',
        'analytics': 'Platform Analytics',
        'moderation': 'Gig Moderation',
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

// ===== ADMIN ACTIONS (Future Implementation) =====

// Placeholder functions for future features
function approveVerification(userId) {
    console.log(`✅ Approve verification for user: ${userId}`);
    // Future: Firebase integration
}

function rejectVerification(userId, reason) {
    console.log(`❌ Reject verification for user: ${userId}, reason: ${reason}`);
    // Future: Firebase integration
}

function suspendUser(userId, reason) {
    console.log(`🚫 Suspend user: ${userId}, reason: ${reason}`);
    // Future: Firebase integration
}

function processRefund(transactionId, amount) {
    console.log(`💸 Process refund: ${transactionId}, amount: ${amount}`);
    // Future: Payment gateway integration
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
function initializeAdminMessages() {
    console.log('💬 Initializing Admin Messages System');
    
    // Initialize customer message handlers
    initializeCustomerMessages();
    
    // Initialize thread search and filters
    initializeThreadSearch();
    
    // Initialize reply functionality
    initializeReplySystem();
    
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
    document.getElementById('messageDetail').style.display = 'none';
    document.getElementById('messageContent').style.display = 'block';
    
    // Mark as read
    messageElement.classList.remove('unread');
    
    console.log('📧 Message loaded:', messageId);
}

function loadPublicMessageDetails(messageElement) {
    const messageId = messageElement.getAttribute('data-message-id');
    const topic = messageElement.getAttribute('data-topic');
    
    // Extract public message data
    const sentMessage = {
        id: messageId,
        category: getCategoryFromTopic(messageElement),
        subject: messageElement.querySelector('.message-subject').textContent,
        message: getFullPublicMessageContent(messageId),
        timeAgo: messageElement.querySelector('.message-time').textContent,
        recipients: messageElement.querySelector('.sender-email').textContent,
        status: 'sent'
    };
    
    // Show public message detail
    showPublicMessageDetail(sentMessage);
    
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
    // In a real app, this would fetch from backend
    // For now, return sample content based on message ID
    const contents = {
        'pub_001': 'Dear GISUGO users, we will be performing scheduled system maintenance on December 15, 2025, from 2:00 AM to 6:00 AM PHT. During this time, the platform will be temporarily unavailable. We apologize for any inconvenience this may cause and appreciate your understanding as we work to improve our services.',
        'pub_002': 'We\'re excited to announce new features that will improve your GISUGO experience! Starting today, you\'ll have access to AI-powered job matching that suggests relevant opportunities based on your skills and preferences. Additionally, our new in-app chat system allows for seamless communication between job posters and workers. Update your app to access these features!',
        'pub_003': 'Celebrate the holidays with GISUGO! For a limited time, receive 20% bonus G-Coins on all top-ups of ₱500 or more. Offer valid until December 31, 2025. Simply top up your account through any of our payment channels to receive your bonus instantly. Terms and conditions apply. Happy holidays from the GISUGO team!'
    };
    
    return contents[messageId] || messageElement.querySelector('.message-excerpt').textContent;
}

function populateMessageDetail(data) {
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
    const viewButtons = document.querySelectorAll('.thread-action-btn.view');
    const flagButtons = document.querySelectorAll('.thread-action-btn.flag');
    const priorityButtons = document.querySelectorAll('.thread-action-btn.priority');
    const archiveButtons = document.querySelectorAll('.thread-action-btn.archive');
    const conversationThreads = document.querySelectorAll('.conversation-thread');
    
    // View conversation handlers (both button click and thread click)
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const thread = this.closest('.conversation-thread');
            const threadId = thread.getAttribute('data-thread-id');
            loadConversationThread(thread);
        });
    });
    
    // Make entire conversation thread clickable
    conversationThreads.forEach(thread => {
        thread.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.thread-action-btn')) {
                loadConversationThread(this);
            }
        });
    });
    
    // Flag conversation handlers
    flagButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const thread = this.closest('.conversation-thread');
            const threadId = thread.getAttribute('data-thread-id');
            flagConversation(threadId);
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
    const participants = threadElement.querySelectorAll('.participant');
    const participantData = [];
    
    participants.forEach(participant => {
        const avatar = participant.querySelector('.participant-avatar').src;
        const name = participant.querySelector('.participant-name').textContent;
        const role = participant.querySelector('.participant-role').textContent;
        
        participantData.push({ avatar, name, role });
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
    // Generate mock conversation messages based on thread data
    const mockMessages = generateMockConversationMessages(data);
    
    return `
        <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <strong>Job Conversation Thread</strong><br>
            <span style="color: #a0aec0;">Messages: ${data.messageCount}</span><br>
            <span style="color: #a0aec0;">Status: ${data.status}</span>
            ${data.isDisputed ? '<br><span style="color: #ff4757;">⚠️ Flagged for Review</span>' : ''}
        </div>
        
        <div class="admin-chat-container">
            ${mockMessages}
        </div>
        
        <p style="color: #a0aec0; line-height: 1.4; margin-top: 1rem; font-size: 0.9rem; font-style: italic;">
            💡 This shows recent messages from the conversation thread. Use action buttons to manage disputes or flag inappropriate content.
        </p>
    `;
}

function generateMockConversationMessages(data) {
    // Create realistic conversation based on job type and participants
    const customer = data.participants.find(p => p.role.toLowerCase() === 'customer') || data.participants[0];
    const worker = data.participants.find(p => p.role.toLowerCase() === 'worker') || data.participants[1];
    
    const conversations = {
        'Deep Clean My 3-Bedroom House': [
            { sender: customer, content: "Hi Ana! I saw your application for my house cleaning job. When would you be available?", time: "2 hours ago" },
            { sender: worker, content: "Hello! I'm available this weekend. I have experience with deep cleaning and can bring all supplies. What's your budget?", time: "1 hour ago" },
            { sender: customer, content: "That sounds perfect. My budget is ₱800 as posted. Can you start Saturday morning?", time: "45 minutes ago" },
            { sender: worker, content: "Yes, Saturday 9 AM works for me. I'll need about 4-5 hours for a thorough deep clean. See you then!", time: "30 minutes ago" }
        ],
        'Plumbing repair - kitchen sink leak': [
            { sender: customer, content: "My kitchen sink has been leaking for 2 days. Can you help with this?", time: "1 day ago" },
            { sender: worker, content: "Good morning! I can definitely help. I have 8 years experience with sink repairs. When would be good to check it?", time: "1 day ago" },
            { sender: customer, content: "How about this afternoon after 2 PM? What's your rate?", time: "20 hours ago" },
            { sender: worker, content: "Perfect! I can come at 3 PM. My rate is ₱800 for standard repairs including parts.", time: "19 hours ago" },
            { sender: customer, content: "Sounds good. I'll be here. Address is 123 Main St, Quezon City.", time: "18 hours ago" }
        ],
        'Garden maintenance and lawn mowing': [
            { sender: worker, content: "Hi! I saw your garden maintenance job. I can do weekly lawn mowing and basic garden care.", time: "3 days ago" },
            { sender: customer, content: "Great! How much do you charge for weekly service?", time: "3 days ago" },
            { sender: worker, content: "For your garden size, ₱600 per week including mowing, trimming, and basic weeding.", time: "2 days ago" },
            { sender: customer, content: "That's reasonable. Can you start this weekend?", time: "2 days ago" },
            { sender: worker, content: "Absolutely! I'll come Saturday morning around 8 AM. Thank you!", time: "2 days ago" }
        ]
    };
    
    // Get conversation or create a generic one
    const messages = conversations[data.jobTitle] || [
        { sender: customer, content: `Hi! I'm interested in discussing the "${data.jobTitle}" job with you.`, time: "2 hours ago" },
        { sender: worker, content: "Hello! I'd be happy to help with this job. When would be a good time to discuss details?", time: "1 hour ago" },
        { sender: customer, content: "How about we discuss the timeline and pricing?", time: "45 minutes ago" }
    ];
    
    return messages.map(msg => `
        <div class="admin-message-bubble ${msg.sender === customer ? 'customer-message' : 'worker-message'}">
            <div class="message-sender-info">
                <img src="${msg.sender.avatar}" alt="${msg.sender.name}" class="message-avatar">
                <span class="sender-name">${msg.sender.name}</span>
                <span class="sender-role">(${msg.sender.role})</span>
                <span class="message-time">${msg.time}</span>
            </div>
            <div class="message-content">${msg.content}</div>
        </div>
    `).join('');
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
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
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

// ===== ADMIN CHATS SYSTEM =====
// Global variable to track current chat data for responsive switching
let currentChatData = null;

function initializeAdminChats() {
    console.log('💭 Initializing Admin Chats System');
    
    // Initialize chat thread handlers  
    initializeChatThreads();
    
    // Initialize chat overlay close buttons
    initializeChatOverlay();
    
    console.log('✅ Admin Chats System initialized');
}

// ===== CHAT THREADS FUNCTIONALITY =====
function initializeChatThreads() {
    // Get all conversation threads in the chats section
    const chatThreads = document.querySelectorAll('#chats .conversation-thread');
    const chatSearchInput = document.getElementById('chatsThreadSearchInput');
    const chatSearchBtn = document.getElementById('chatsThreadSearchBtn');
    const chatStatusFilter = document.getElementById('chatsThreadStatusFilter');
    
    // Handle thread clicking
    chatThreads.forEach(thread => {
        thread.addEventListener('click', function(e) {
            // Don't trigger if clicking on action buttons
            if (!e.target.closest('.thread-action-btn')) {
                loadChatConversation(this);
            }
        });
    });
    
    // Handle search functionality
    if (chatSearchInput && chatSearchBtn) {
        chatSearchBtn.addEventListener('click', function() {
            performChatSearch(chatSearchInput.value);
        });
        
        chatSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performChatSearch(this.value);
            }
        });
    }
    
    // Handle status filtering
    if (chatStatusFilter) {
        chatStatusFilter.addEventListener('change', function() {
            filterChatsByStatus(this.value);
        });
    }
    
    console.log('💬 Chat threads initialized');
}

function extractParticipantData(threadElement) {
    const participants = [];
    const participantElements = threadElement.querySelectorAll('.participant');
    
    participantElements.forEach(participant => {
        const avatar = participant.querySelector('.participant-avatar')?.src || '';
        const name = participant.querySelector('.participant-name')?.textContent || '';
        const role = participant.querySelector('.participant-role')?.textContent || '';
        
        participants.push({
            avatar: avatar,
            name: name,
            role: role
        });
    });
    
    return participants;
}

function loadChatConversation(threadElement) {
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
    
    // Store current chat data for responsive switching
    currentChatData = threadData;
    
    // Highlight selected thread
    document.querySelectorAll('#chats .conversation-thread').forEach(t => t.classList.remove('selected'));
    threadElement.classList.add('selected');
    
    // Check viewport width to decide between panel or overlay
    if (window.innerWidth >= 888) {
        // Desktop: Show in right panel
        populateChatPanel(threadData);
    } else {
        // Mobile: Show in overlay
        showChatOverlay(threadData);
    }
    
    console.log('💭 Chat conversation loaded:', threadId);
}

function populateChatPanel(data) {
    const chatBubblesContainer = document.querySelector('#chatContent .chat-bubbles-container');
    
    // Reset scroll position to top
    if (chatBubblesContainer) {
        chatBubblesContainer.scrollTop = 0;
    }
    
    const customer = data.participants.find(p => p.role.toLowerCase() === 'customer') || data.participants[0];
    const worker = data.participants.find(p => p.role.toLowerCase() === 'worker') || data.participants[1];
    
    // Update chat header
    document.getElementById('chatCustomerAvatar').src = customer?.avatar || 'public/users/User-02.jpg';
    document.getElementById('chatCustomerName').textContent = customer?.name || 'Customer';
    document.getElementById('chatWorkerAvatar').src = worker?.avatar || 'public/users/User-03.jpg';
    document.getElementById('chatWorkerName').textContent = worker?.name || 'Worker';
    document.getElementById('chatJobTitle').textContent = data.jobTitle;
    
    // Update status badge
    const statusBadge = document.getElementById('chatStatusBadge');
    if (statusBadge) {
        statusBadge.textContent = data.status;
        statusBadge.className = `chat-status-badge ${data.status.toLowerCase()}`;
    }
    
    // Generate and populate chat bubbles
    const chatBubbles = generateChatBubbles(data, customer, worker);
    document.getElementById('chatBubblesContainer').innerHTML = chatBubbles;
    
    // Update admin controls based on status
    updateChatControls(data);
    
    // Show chat content panel
    document.getElementById('chatDetail').style.display = 'none';
    document.getElementById('chatContent').style.display = 'block';
}

function generateChatBubbles(data, customer, worker) {
    // Get conversation based on job title
    const conversations = {
        'Deep Clean My 3-Bedroom House': [
            { sender: customer, content: "Hi Ana! I saw your application for my house cleaning job. When would you be available?", time: "2 hours ago", direction: "incoming" },
            { sender: worker, content: "Hello! I'm available this weekend. I have experience with deep cleaning and can bring all supplies. What's your budget?", time: "1 hour ago", direction: "outgoing" },
            { sender: customer, content: "That sounds perfect. My budget is ₱800 as posted. Can you start Saturday morning?", time: "45 minutes ago", direction: "incoming" },
            { sender: worker, content: "Yes, Saturday 9 AM works for me. I'll need about 4-5 hours for a thorough deep clean. See you then!", time: "30 minutes ago", direction: "outgoing" }
        ],
        'Plumbing repair - kitchen sink leak': [
            { sender: customer, content: "My kitchen sink has been leaking for 2 days. Can you help with this?", time: "1 day ago", direction: "incoming" },
            { sender: worker, content: "Good morning! I can definitely help. I have 8 years experience with sink repairs. When would be good to check it?", time: "1 day ago", direction: "outgoing" },
            { sender: customer, content: "How about this afternoon after 2 PM? What's your rate?", time: "20 hours ago", direction: "incoming" },
            { sender: worker, content: "Perfect! I can come at 3 PM. My rate is ₱800 for standard repairs including parts.", time: "19 hours ago", direction: "outgoing" },
            { sender: customer, content: "Sounds good. I'll be here. Address is 123 Main St, Quezon City.", time: "18 hours ago", direction: "incoming" }
        ],
        'Garden maintenance and lawn mowing': [
            { sender: worker, content: "Hi! I saw your garden maintenance job. I can do weekly lawn mowing and basic garden care.", time: "3 days ago", direction: "outgoing" },
            { sender: customer, content: "Great! How much do you charge for weekly service?", time: "3 days ago", direction: "incoming" },
            { sender: worker, content: "For your garden size, ₱600 per week including mowing, trimming, and basic weeding.", time: "2 days ago", direction: "outgoing" },
            { sender: customer, content: "That's reasonable. Can you start this weekend?", time: "2 days ago", direction: "incoming" },
            { sender: worker, content: "Absolutely! I'll come Saturday morning around 8 AM. Thank you!", time: "2 days ago", direction: "outgoing" }
        ]
    };
    
    // Get conversation or create a generic one
    const messages = conversations[data.jobTitle] || [
        { sender: customer, content: `Hi! I'm interested in discussing the "${data.jobTitle}" job with you.`, time: "2 hours ago", direction: "incoming" },
        { sender: worker, content: "Hello! I'd be happy to help with this job. When would be a good time to discuss details?", time: "1 hour ago", direction: "outgoing" },
        { sender: customer, content: "How about we discuss the timeline and pricing?", time: "45 minutes ago", direction: "incoming" }
    ];
    
    return messages.map(msg => `
        <div class="chat-bubble ${msg.direction}">
            <div class="bubble-header">
                <img src="${msg.sender.avatar}" alt="${msg.sender.name}" class="bubble-avatar">
                <span class="bubble-sender">${msg.sender.name}</span>
                <span class="bubble-time">${msg.time}</span>
            </div>
            <div class="bubble-content">${msg.content}</div>
        </div>
    `).join('');
}

function updateChatControls(data) {
    const flagBtn = document.getElementById('flagChatBtn');
    const archiveBtn = document.getElementById('archiveChatBtn');
    
    if (flagBtn) {
        flagBtn.textContent = data.isDisputed ? 'Remove Flag' : 'Flag for Review';
        flagBtn.onclick = () => toggleChatFlag(data.id, data.isDisputed);
    }
    
    if (archiveBtn) {
        archiveBtn.onclick = () => archiveChat(data.id);
    }
}

function performChatSearch(query) {
    const threads = document.querySelectorAll('#chats .conversation-thread');
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
    
    console.log('🔍 Chat search performed:', query);
}

function filterChatsByStatus(status) {
    const threads = document.querySelectorAll('#chats .conversation-thread');
    
    threads.forEach(thread => {
        const threadStatus = thread.querySelector('.thread-status').textContent.toLowerCase();
        
        if (status === 'all' || threadStatus === status) {
            thread.style.display = 'block';
        } else {
            thread.style.display = 'none';
        }
    });
    
    console.log('🔍 Chats filtered by status:', status);
}

function toggleChatFlag(threadId, isCurrentlyFlagged) {
    const action = isCurrentlyFlagged ? 'remove flag from' : 'flag';
    const confirmed = confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this conversation?`);
    
    if (confirmed) {
        console.log(`🚩 ${action} conversation:`, threadId);
        alert(`Conversation ${isCurrentlyFlagged ? 'flag removed' : 'flagged for review'}.`);
        // Update UI and backend here
    }
}

function archiveChat(threadId) {
    const confirmed = confirm('Archive this conversation?\n\nArchived conversations can be restored later.');
    
    if (confirmed) {
        console.log('📁 Archiving chat:', threadId);
        alert('Conversation archived successfully.');
        // Update UI and backend here
    }
}

// ===== CHAT OVERLAY FUNCTIONALITY =====
function initializeChatOverlay() {
    const overlay = document.getElementById('chatDetailOverlay');
    const closeBtnX = document.getElementById('chatOverlayCloseBtnX');
    const closeBtnFooter = document.getElementById('chatOverlayCloseBtn');
    const flagBtn = document.getElementById('chatOverlayFlagBtn');
    const archiveBtn = document.getElementById('chatOverlayArchiveBtn');
    
    // Close buttons
    if (closeBtnX) {
        closeBtnX.addEventListener('click', hideChatOverlay);
    }
    if (closeBtnFooter) {
        closeBtnFooter.addEventListener('click', hideChatOverlay);
    }
    
    // Click outside to close
    if (overlay) {
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                hideChatOverlay();
            }
        });
    }
    
    // Action buttons
    if (flagBtn) {
        flagBtn.addEventListener('click', function() {
            if (currentChatData) {
                toggleChatFlag(currentChatData.id, currentChatData.isDisputed);
            }
        });
    }
    
    if (archiveBtn) {
        archiveBtn.addEventListener('click', function() {
            if (currentChatData) {
                archiveChat(currentChatData.id);
            }
        });
    }
    
    console.log('💬 Chat overlay initialized');
}

function showChatOverlay(data) {
    const overlay = document.getElementById('chatDetailOverlay');
    const overlayBody = document.getElementById('chatOverlayBody');
    
    if (!overlay || !overlayBody) return;
    
    const customer = data.participants.find(p => p.role.toLowerCase() === 'customer') || data.participants[0];
    const worker = data.participants.find(p => p.role.toLowerCase() === 'worker') || data.participants[1];
    
    // Update header participants
    document.getElementById('chatOverlayCustomerAvatar').src = customer?.avatar || 'public/users/User-02.jpg';
    document.getElementById('chatOverlayCustomerName').textContent = customer?.name || 'Customer';
    document.getElementById('chatOverlayWorkerAvatar').src = worker?.avatar || 'public/users/User-03.jpg';
    document.getElementById('chatOverlayWorkerName').textContent = worker?.name || 'Worker';
    document.getElementById('chatOverlayJobTitle').textContent = data.jobTitle;
    
    // Update status badge
    const statusBadge = document.getElementById('chatOverlayStatusBadge');
    if (statusBadge) {
        statusBadge.textContent = data.status;
        statusBadge.className = `chat-overlay-status-badge ${data.status.toLowerCase()}`;
    }
    
    // Update action buttons
    const flagBtn = document.getElementById('chatOverlayFlagBtn');
    if (flagBtn) {
        flagBtn.textContent = data.isDisputed ? 'Remove Flag' : 'Flag';
    }
    
    // Generate and populate chat bubbles
    const chatBubbles = generateChatBubbles(data, customer, worker);
    overlayBody.innerHTML = chatBubbles;
    
    // Show overlay
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Reset scroll position to top (after overlay is visible)
    setTimeout(() => {
        if (overlayBody) {
            overlayBody.scrollTop = 0;
        }
    }, 0);
    
    console.log(`📱 Showing chat overlay for ${data.id}`);
}

function hideChatOverlay() {
    const overlay = document.getElementById('chatDetailOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    console.log('📱 Chat overlay hidden');
}

// Handle resize to switch between overlay/panel views for chats
window.addEventListener('resize', () => {
    const chatOverlay = document.getElementById('chatDetailOverlay');
    
    if (window.innerWidth >= 888 && chatOverlay && chatOverlay.classList.contains('active')) {
        // Switched to desktop - hide overlay and show in panel
        hideChatOverlay();
        
        if (currentChatData) {
            populateChatPanel(currentChatData);
        }
    } else if (window.innerWidth < 888 && currentChatData && document.getElementById('chatContent')?.style.display !== 'none') {
        // Switched to mobile - hide panel and show overlay
        if (currentChatData) {
            showChatOverlay(currentChatData);
        }
    }
});

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
let currentMessagesPage = 1;
const messagesPerPage = 20;
let totalMessages = 156; // This would come from backend
let isLoadingMoreMessages = false;

function initializeMessagesPagination() {
    console.log('📄 Initializing Messages Pagination');
    
    const loadMoreBtn = document.getElementById('loadMoreMessagesBtn');
    const loadingIndicator = document.getElementById('messagesLoading');
    const messagesStats = document.getElementById('messagesStats');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreMessages);
    }
    
    // Update initial stats
    updateMessagesStats();
    
    console.log('✅ Messages Pagination initialized');
}

function loadMoreMessages() {
    if (isLoadingMoreMessages) return;
    
    const loadMoreBtn = document.getElementById('loadMoreMessagesBtn');
    const loadingIndicator = document.getElementById('messagesLoading');
    
    // Show loading state
    isLoadingMoreMessages = true;
    loadMoreBtn.style.display = 'none';
    loadingIndicator.classList.add('show');
    
    // Simulate API call delay
    setTimeout(() => {
        // Mock data for additional messages
        const newMessages = generateMockMessages(messagesPerPage);
        appendMessagesToList(newMessages);
        
        currentMessagesPage++;
        isLoadingMoreMessages = false;
        
        // Hide loading state
        loadingIndicator.classList.remove('show');
        
        // Update stats and button visibility
        updateMessagesStats();
        
        const messagesLoaded = currentMessagesPage * messagesPerPage;
        if (messagesLoaded < totalMessages) {
            loadMoreBtn.style.display = 'block';
        }
        
        console.log('📄 Loaded page', currentMessagesPage, 'of messages');
    }, 1000); // 1 second delay to simulate network
}

function generateMockMessages(count) {
    const topics = ['general', 'account-issues', 'feature-requests', 'complaints-disputes'];
    const senders = [
        {name: 'Ana Garcia', email: 'ana.garcia@email.com', avatar: 'public/users/User-04.jpg'},
        {name: 'Robert Kim', email: 'robert.kim@email.com', avatar: 'public/users/User-05.jpg'},
        {name: 'Sofia Martinez', email: 'sofia.martinez@email.com', avatar: 'public/users/User-06.jpg'},
        {name: 'David Chen', email: 'david.chen@email.com', avatar: 'public/users/User-07.jpg'}
    ];
    
    const messages = [];
    for (let i = 0; i < count; i++) {
        const topic = topics[Math.floor(Math.random() * topics.length)];
        const sender = senders[Math.floor(Math.random() * senders.length)];
        const messageId = 'msg_' + Date.now() + '_' + i;
        
        messages.push({
            id: messageId,
            topic: topic,
            sender: sender,
            time: Math.floor(Math.random() * 24) + ' hours ago',
            subject: 'Message subject ' + (currentMessagesPage * messagesPerPage + i + 1),
            excerpt: 'This is a sample message excerpt for pagination testing...',
            hasAttachment: Math.random() > 0.7
        });
    }
    
    return messages;
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
    const messagesLoaded = Math.min(currentMessagesPage * messagesPerPage, totalMessages);
    
    if (messagesStats) {
        messagesStats.textContent = `Showing ${messagesLoaded} of ${totalMessages} messages`;
    }
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
    
    // Filter messages based on type
    filterMessagesByInboxType(type);
    
    // Update inbox count
    updateInboxCount();
    
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
    
    const wasAlreadyOld = messageStates[messageId].status === 'old';
    
    // Move to old inbox (or keep it there if already old)
    messageStates[messageId].status = 'old';
    
    // Hide message detail panels (for desktop view)
    const messageDetail = document.getElementById('messageDetail');
    const messageContent = document.getElementById('messageContent');
    if (messageDetail) messageDetail.style.display = 'block';
    if (messageContent) messageContent.style.display = 'none';
    
    // Refresh current view
    filterMessagesByInboxType(currentInboxType);
    updateInboxCount();
    
    // Show appropriate toast based on action
    if (wasAlreadyOld) {
        console.log('📧 Message closed (was already in old inbox):', messageId);
        showToast('Message closed', 'info', 1000);
    } else {
        console.log('📧 Message moved to old inbox:', messageId);
        showToast('Message moved to Old inbox');
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
    
    const newCountElement = document.getElementById('newCount');
    
    if (newCountElement) {
        newCountElement.textContent = formatCount(newCount);
    }
}

function formatCount(count) {
    if (count >= 1000) {
        const thousands = Math.floor(count / 1000);
        const remainder = count % 1000;
        
        if (remainder === 0) {
            return `${thousands}K`;
        } else {
            // Show one decimal place if needed (e.g., 1.2K)
            return `${(count / 1000).toFixed(1)}K`;
        }
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

function sendPublicMessage(category, subject, message) {
    console.log('📧 Sending public message:', { category, subject, message });
    
    // Generate unique message ID
    const messageId = `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const timeAgo = 'Just now';
    
    // Create sent message data
    const sentMessage = {
        id: messageId,
        category: category,
        subject: subject,
        message: message,
        timestamp: timestamp,
        timeAgo: timeAgo,
        recipients: 'All Users',
        status: 'sent'
    };
    
    // Add to sent messages list
    addSentMessageToList(sentMessage);
    
    // Update message states
    messageStates[messageId] = {
        status: 'sent',
        isRead: true,
        isReplied: false
    };
    
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
    
    // Add click handler for the new message
    const newMessageElement = messagesList.firstElementChild;
    if (newMessageElement) {
        newMessageElement.addEventListener('click', function() {
            showPublicMessageDetail(sentMessage);
        });
    }
    
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
    
    if (messageContent) {
        messageContent.innerHTML = `
            <div class="message-detail-header">
                <div class="message-detail-topic ${sentMessage.category}">${categoryInfo.emoji} ${categoryInfo.label}</div>
                <div class="message-detail-meta">
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
                <p>${sentMessage.message}</p>
            </div>
            <div class="message-actions">
                <button class="message-action-btn unsend-btn" onclick="unsendPublicMessage('${sentMessage.id}')">
                    🗑️ Unsend Message
                </button>
            </div>
        `;
        
        messageContent.style.display = 'block';
        document.getElementById('messageDetail').style.display = 'none';
    }
}

window.unsendPublicMessage = function(messageId) {
    if (confirm('Are you sure you want to unsend this public message? This action cannot be undone.')) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
            delete messageStates[messageId];
            showToast('Public message unsent successfully', 'success');
            
            // Clear message content
            const messageContent = document.getElementById('messageContent');
            if (messageContent) {
                messageContent.style.display = 'none';
                messageContent.innerHTML = '';
            }
            
            document.getElementById('messageDetail').style.display = 'block';
            
            console.log('🗑️ Public message unsent:', messageId);
        }
    }
};

// ===== INBOX SEARCH SYSTEM =====
function initializeInboxSearch() {
    const searchInput = document.getElementById('messagesSearchInput');
    const searchBtn = document.getElementById('messagesSearchBtn');
    
    if (searchInput && searchBtn) {
        // Search on button click
        searchBtn.addEventListener('click', () => {
            performInboxSearch(searchInput.value.trim());
        });
        
        // Search on Enter key
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performInboxSearch(searchInput.value.trim());
            }
        });
        
        // Clear search when input is empty
        searchInput.addEventListener('input', (e) => {
            if (e.target.value.trim() === '') {
                clearInboxSearch();
            }
        });
    }
}

function performInboxSearch(query) {
    const messageItems = document.querySelectorAll('.customer-message-item');
    let visibleCount = 0;
    
    if (!query) {
        clearInboxSearch();
        return;
    }
    
    messageItems.forEach(item => {
        const senderName = item.querySelector('.message-sender-name')?.textContent.toLowerCase() || '';
        const subject = item.querySelector('.message-subject')?.textContent.toLowerCase() || '';
        const preview = item.querySelector('.message-preview')?.textContent.toLowerCase() || '';
        const topic = item.querySelector('.message-topic')?.textContent.toLowerCase() || '';
        
        const searchText = `${senderName} ${subject} ${preview} ${topic}`.toLowerCase();
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
    console.log(`🔍 Search for "${query}" found ${visibleCount} results`);
}

function clearInboxSearch() {
    const messageItems = document.querySelectorAll('.customer-message-item');
    messageItems.forEach(item => {
        item.style.display = 'block';
    });
    
    // Clear search feedback
    updateSearchFeedback('', messageItems.length);
    console.log('🔍 Search cleared - showing all messages');
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
            const replyOverlay = document.getElementById('replyOverlay');
            if (replyOverlay) {
                replyOverlay.classList.add('show');
                document.getElementById('floatingReplyTextarea')?.focus();
                console.log('📤 Reply modal opened from overlay');
            } else {
                console.error('❌ Reply overlay not found');
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
            <div class="header-main">
                <div class="sender-info">
                    <img src="${senderAvatar}" alt="User Avatar" class="detail-avatar">
                    <div class="sender-details">
                        <h3 class="detail-sender-name">${senderName}</h3>
                        <p class="detail-sender-email">${senderEmail}</p>
                    </div>
                </div>
                <div class="message-timestamp-attachment">
                    <span class="detail-timestamp">${timestamp}</span>
                    ${hasAttachment ? '<span class="detail-attachment-icon" title="Has photo attachment">🖼️</span>' : ''}
                </div>
            </div>
            <h2 class="detail-subject">${subject}</h2>
        </div>
        
        <div class="message-detail-body">
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

// Handle resize to switch between overlay/panel views
window.addEventListener('resize', () => {
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

let currentGigTab = 'posted'; // Track current tab: 'posted', 'reported', 'suspended'
let currentGigData = null; // Track currently selected gig
let allGigs = []; // Store all gig data

function initializeGigModeration() {
    console.log('🛡️ Initializing Gig Moderation system');
    
    // Generate mock gig data
    generateMockGigData();
    
    // Initialize tab buttons
    initializeGigTabs();
    
    // Initialize search
    initializeGigSearch();
    
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

function generateMockGigData() {
    // Sample barangays (without "Barangay" prefix - matches backend data structure)
    const barangays = ['Capitol Site', 'Lahug', 'Mabolo', 'Kasambagan', 'Guadalupe', 'Banilad', 'Talamban', 'Apas'];
    const supplies = ['Provided', 'Required'];
    const subjects = ['Math', 'Science', 'Computer', 'Language', 'Other'];
    const positions = ['In-Person', 'Virtual'];
    
    // Realistic Filipino names for customers
    const customerNames = [
        'Maria Santos', 'Juan Dela Cruz', 'Pedro Garcia', 'Rosa Mendoza',
        'Carlos Reyes', 'Elena Ramos', 'Miguel Torres', 'Sofia Villanueva',
        'Antonio Cruz', 'Isabel Fernandez', 'Jose Rodriguez', 'Carmen Lopez',
        'Francisco Gonzales', 'Luz Ramirez', 'Ricardo Silva', 'Teresa Morales',
        'Roberto Diaz', 'Angela Castro', 'Manuel Flores', 'Gloria Ortega',
        'Fernando Santos', 'Cristina Navarro', 'Eduardo Martinez', 'Beatriz Rivera'
    ];
    
    // Realistic Filipino names for workers
    const workerNames = [
        'Ana Reyes', 'Mark Santos', 'Jenny Cruz', 'Ryan Garcia',
        'Liza Mendoza', 'Ben Torres', 'Carla Ramos', 'Dennis Villanueva',
        'Mary Ann Fernandez', 'Joel Rodriguez', 'Lea Lopez', 'Mike Gonzales',
        'Nina Ramirez', 'Jay Silva', 'Grace Morales', 'Jun Diaz'
    ];
    
    // Admin names for suspensions
    const adminNames = [
        'Admin Maria Garcia', 'Admin John Santos', 'Admin Lisa Reyes', 
        'Admin Robert Cruz', 'Admin Sofia Mendoza'
    ];
    
    // Helper function to get realistic titles based on category
    function getRealisticTitle(category, photoNum) {
        // Titles matched to actual thumbnail images (50-55 char limit)
        const titlesByPhoto = {
            'hatod': [
                'Deliver Rice Bags to Store in Mandaue',           // post1: rice bags
                'Transport Cooler Box to Beach Event',            // post2: cooler
                'Deliver Packages Across Town Today',             // post3: boxes
                'Need Ride to Airport - Early Morning',           // post4
                'Quick Delivery Service to SM Seaside',           // post5
                'Transport Documents to City Hall',               // post6
                'Urgent Medical Supply Delivery Needed'           // post7
            ],
            'hakot': [
                'Load and Move Boxes to New Warehouse',           // post1: workers loading
                'Move Heavy Furniture to New House',              // post2
                'Transport Construction Materials to Site',       // post3
                'Haul Office Equipment Across City',              // post4
                'Move Appliances and Heavy Items Today',          // post5
                'Deliver Building Supplies to Talisay',           // post6
                'Pickup and Move Boxes from Storage'              // post7
            ],
            'kompra': [
                'Shop at SM Mall for Party Supplies',             // post1: mall
                'Buy Fresh Produce from Carbon Market',           // post2: Carbon Market
                'Grocery Shopping at Gaisano Grand Mall',         // post3
                'Purchase Medicine from Mercury Drug',            // post4
                'Get School Supplies for 3 Children',             // post5
                'Weekly Grocery Shopping Service Needed',         // post6
                'Buy Hardware Items from Handyman Store'          // post7
            ],
            'limpyo': [
                'Clean Abandoned Property and Grounds',           // post1: old building
                'Restaurant Kitchen Dishwashing Service',         // post2: restaurant dishes
                'Deep Clean 3-Bedroom House This Weekend',        // post3
                'Office Cleaning After Renovation Work',          // post4
                'Post-Construction Cleanup Service Needed',       // post5
                'Move-Out Cleaning for Apartment Unit',           // post6
                'Weekly House Cleaning Service Required'          // post7
            ],
            'luto': [
                'Cook Filipino Dishes for 50 Guests',
                'Prepare Daily Meals for Family of Five',
                'Catering Service for Office Party Event',
                'Home-Cooked Meals for the Whole Week',
                'Private Chef for Birthday Celebration',
                'Meal Prep Service for Busy Professionals',
                'Cook Traditional Cebuano Dishes Today'
            ],
            'hugas': [
                'Wash Dishes After Big Party Event',
                'Daily Dishwashing Service for Family',
                'Clean Kitchen After Wedding Reception',
                'Weekly Dishwashing Help Required',
                'Post-Event Kitchen Cleanup Service',
                'Restaurant Dishwashing Service Needed',
                'Kitchen Cleaning After Catering Event'
            ],
            'laba': [
                'Laundry Service for Two Weeks of Clothes',
                'Wash and Iron All Work Clothes',
                'Bulk Laundry After Month-Long Vacation',
                'Weekly Laundry Service for Large Family',
                'Wash All Bedsheets and Linens Today',
                'Laundry Folding and Ironing Service',
                'Express Laundry Service Needed Urgently'
            ]
        };
        
        const titles = titlesByPhoto[category] || [
            `${category.charAt(0).toUpperCase() + category.slice(1)} Service Needed`,
            `Looking for ${category.charAt(0).toUpperCase() + category.slice(1)} Help`,
            `${category.charAt(0).toUpperCase() + category.slice(1)} Job Available`
        ];
        
        // Return title matching photo number (1-7)
        return titles[(photoNum - 1) % titles.length];
    }
    
    // Helper function to get extras based on category
    function getExtrasForCategory(category) {
        const randomBarangay1 = barangays[Math.floor(Math.random() * barangays.length)];
        const randomBarangay2 = barangays[Math.floor(Math.random() * barangays.length)];
        const randomSupply = supplies[Math.floor(Math.random() * supplies.length)];
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomPosition = positions[Math.floor(Math.random() * positions.length)];
        
        const extrasMap = {
            'hatod': { 'Pickup at': randomBarangay1, 'Deliver to': randomBarangay2 },
            'hakot': { 'Load at': randomBarangay1, 'Unload at': randomBarangay2 },
            'kompra': { 'Shop at': randomBarangay1, 'Deliver to': randomBarangay2 },
            'luto': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'hugas': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'laba': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'limpyo': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'tindera': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'bantay': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'painter': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'carpenter': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'plumber': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'security': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'driver': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'tutor': { 'Location': randomBarangay1, 'Subject': randomSubject },
            'nurse': { 'Location': randomBarangay1, 'Position': randomPosition },
            'doctor': { 'Location': randomBarangay1, 'Position': randomPosition },
            'lawyer': { 'Location': randomBarangay1, 'Position': randomPosition },
            'mechanic': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'electrician': { 'Location': randomBarangay1, 'Supplies': randomSupply },
            'tailor': { 'Location': randomBarangay1, 'Supplies': randomSupply }
        };
        
        return extrasMap[category] || { 'Location': randomBarangay1, 'Supplies': randomSupply };
    }
    
    // Mock gig data for demonstration
    allGigs = [
        // Posted gigs
        {
            gigId: '1760557532318',
            posterId: 'user001',
            posterName: 'Maria Santos',
            posterAvatar: 'public/users/User-02.jpg',
            category: 'hatod',
            title: 'Deliver Rice Bags to Store in Mandaue',
            thumbnail: 'public/mock/mock-hatod-post1.jpg',
            jobDate: 'February 8, 2025',
            startTime: '6AM',
            endTime: '8AM',
            region: 'Cebu',
            city: 'Cebu City',
            extras: { 'Pickup at': 'Capitol Site', 'Deliver to': 'Mactan Airport' },
            description: 'Need reliable driver for early morning airport trip. Must have clean vehicle and arrive on time.',
            price: '800',
            payRate: 'Per Job',
            status: 'posted',
            datePosted: '2 hours ago',
            applicationCount: 12,
            hiredWorker: null
        },
        {
            gigId: '1760557532319',
            posterId: 'user002',
            posterName: 'Juan Dela Cruz',
            posterAvatar: 'public/users/User-03.jpg',
            category: 'limpyo',
            title: 'Restaurant Kitchen Dishwashing Service',
            thumbnail: 'public/mock/mock-limpyo-post2.jpg',
            jobDate: 'March 12, 2025',
            startTime: '9AM',
            endTime: '5PM',
            region: 'Cebu',
            city: 'Mandaue City',
            extras: { 'Location': 'Mabolo', 'Supplies': 'Provided' },
            description: 'Looking for experienced cleaner for deep house cleaning. All supplies provided.',
            price: '1200',
            payRate: 'Per Job',
            status: 'posted',
            datePosted: '5 hours ago',
            applicationCount: 8,
            hiredWorker: { workerId: 'worker001', workerName: 'Ana Reyes', workerAvatar: 'public/users/User-04.jpg' }
        },
        // Reported gigs
        {
            gigId: '1760557532320',
            posterId: 'user003',
            posterName: 'Pedro Garcia',
            posterAvatar: 'public/users/User-05.jpg',
            category: 'hakot',
            title: 'Transport Construction Materials to Site',
            thumbnail: 'public/mock/mock-hakot-post3.jpg',
            jobDate: 'February 14, 2025',
            startTime: '8AM',
            endTime: '12PM',
            region: 'Cebu',
            city: 'Talisay City',
            extras: { 'Load at': 'Kasambagan', 'Unload at': 'Guadalupe' },
            description: 'Need help moving furniture. Heavy items included.',
            price: '1500',
            payRate: 'Per Hour',
            status: 'posted', // Still live in marketplace
            datePosted: '1 day ago',
            applicationCount: 5,
            hiredWorker: null,
            reportedBy: [
                { reporterId: 'user007', reporterName: 'Carlos Reyes', reporterAvatar: 'public/users/User-07.jpg', reportDate: 'January 28, 2025 3:45 PM' },
                { reporterId: 'user012', reporterName: 'Elena Ramos', reporterAvatar: 'public/users/User-02.jpg', reportDate: 'January 28, 2025 5:20 PM' },
                { reporterId: 'user018', reporterName: 'Miguel Torres', reporterAvatar: 'public/users/User-03.jpg', reportDate: 'January 29, 2025 9:15 AM' }
            ],
            reportCount: 3,
            reportThreshold: 0, // Show in Reported tab (initial reports)
            ignoredBy: [] // Track admin ignores
        },
        // Suspended gigs
        {
            gigId: '1760557532321',
            posterId: 'user004',
            posterName: 'Rosa Mendoza',
            posterAvatar: 'public/users/User-06.jpg',
            category: 'kompra',
            title: 'Purchase Medicine from Mercury Drug',
            thumbnail: 'public/mock/mock-kompra-post4.jpg',
            jobDate: 'March 5, 2025',
            startTime: '4PM',
            endTime: '10PM',
            region: 'Cebu',
            city: 'Lapu-Lapu City',
            extras: { 'Shop at': 'Lahug', 'Deliver to': 'Capitol Site' },
            description: 'This gig was reported for suspicious activity and has been suspended.',
            price: '1000',
            payRate: 'Per Job',
            status: 'suspended',
            datePosted: '3 days ago',
            applicationCount: 2,
            hiredWorker: null,
            reportedBy: [
                { reporterId: 'user015', reporterName: 'Antonio Cruz', reporterAvatar: 'public/users/User-05.jpg', reportDate: 'January 27, 2025 2:30 PM' },
                { reporterId: 'user021', reporterName: 'Isabel Fernandez', reporterAvatar: 'public/users/User-06.jpg', reportDate: 'January 28, 2025 11:45 AM' },
                { reporterId: 'user009', reporterName: 'Jose Rodriguez', reporterAvatar: 'public/users/User-07.jpg', reportDate: 'January 29, 2025 4:20 PM' },
                { reporterId: 'user026', reporterName: 'Carmen Lopez', reporterAvatar: 'public/users/User-02.jpg', reportDate: 'January 29, 2025 8:55 PM' },
                { reporterId: 'user033', reporterName: 'Francisco Gonzales', reporterAvatar: 'public/users/User-03.jpg', reportDate: 'January 30, 2025 7:10 AM' }
            ],
            reportCount: 5,
            reportThreshold: 0,
            ignoredBy: [],
            suspendedBy: { 
                adminId: 'admin001', 
                adminName: 'Admin Maria Garcia', 
                adminAvatar: 'public/users/User-01.jpg', 
                suspendDate: 'January 30, 2025 10:20 AM' 
            }
        }
    ];
    
    // Add more mock gigs for each category with real photos
    const categoriesWithPhotos = {
        'hatod': 7,
        'limpyo': 7,
        'hakot': 7,
        'kompra': 7
    };
    
    const categories = Object.keys(categoriesWithPhotos);
    const statuses = ['posted', 'posted', 'posted', 'reported', 'posted'];
    
    // Helper to format time correctly (12-hour format without space: "9AM", "2PM")
    function formatTime(hour) {
        if (hour === 12) return '12PM';
        if (hour > 12) return `${hour - 12}PM`;
        return `${hour}AM`;
    }
    
    for (let i = 0; i < 20; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const photoNum = (i % categoriesWithPhotos[category]) + 1;
        
        // Generate realistic time range (8AM-11PM, with 2-6 hour duration)
        const startHour = ((i % 14) + 8); // 8 to 21 (8AM to 9PM)
        const duration = (i % 4) + 2; // 2 to 5 hours
        const endHour = Math.min(startHour + duration, 23); // Cap at 11PM
        
        const gigData = {
            gigId: `176055753${2322 + i}`,
            posterId: `user${String(i + 5).padStart(3, '0')}`,
            posterName: customerNames[i % customerNames.length],
            posterAvatar: `public/users/User-0${(i % 6) + 2}.jpg`,
            category: category,
            title: getRealisticTitle(category, photoNum),
            thumbnail: `public/mock/mock-${category}-post${photoNum}.jpg`,
            jobDate: `${['January', 'February', 'March'][i % 3]} ${(i % 28) + 1}, 2025`,
            startTime: formatTime(startHour),
            endTime: formatTime(endHour),
            region: 'Cebu',
            city: 'Cebu City',
            extras: getExtrasForCategory(category),
            description: 'Looking for reliable and experienced help. Please review the details carefully before applying. Contact me if you have any questions.',
            price: `${500 + (i % 5) * 250}`,
            payRate: i % 2 === 0 ? 'Per Job' : 'Per Hour',
            status: status,
            datePosted: `${i + 1} hours ago`,
            applicationCount: Math.floor(Math.random() * 20),
            hiredWorker: i % 3 === 0 ? { workerId: `worker${i}`, workerName: workerNames[i % workerNames.length], workerAvatar: 'public/users/User-04.jpg' } : null
        };
        
        // Add reportedBy for reported gigs (array of reporters)
        if (status === 'reported') {
            const numReporters = Math.floor(Math.random() * 5) + 1; // 1-5 reporters
            gigData.reportedBy = [];
            
            for (let r = 0; r < numReporters; r++) {
                gigData.reportedBy.push({
                    reporterId: `user${String((i + 100 + r * 10) % 200).padStart(3, '0')}`,
                    reporterName: customerNames[(i + r + 7) % customerNames.length],
                    reporterAvatar: `public/users/User-0${((i + r + 3) % 6) + 2}.jpg`,
                    reportDate: `January ${(i % 28) + 1}, 2025 ${((i + r) % 12) + 1}:${((i + r * 5) % 60).toString().padStart(2, '0')} PM`
                });
            }
            
            gigData.reportCount = numReporters;
            gigData.reportThreshold = 0; // Show in Reported tab
            gigData.ignoredBy = [];
        }
        
        // Add suspendedBy for suspended gigs (will be added when admin suspends)
        if (status === 'suspended') {
            // Suspended gigs were likely reported first
            const numReporters = Math.floor(Math.random() * 8) + 3; // 3-10 reporters
            gigData.reportedBy = [];
            
            for (let r = 0; r < numReporters; r++) {
                gigData.reportedBy.push({
                    reporterId: `user${String((i + 100 + r * 10) % 200).padStart(3, '0')}`,
                    reporterName: customerNames[(i + r + 7) % customerNames.length],
                    reporterAvatar: `public/users/User-0${((i + r + 3) % 6) + 2}.jpg`,
                    reportDate: `January ${(i % 28) + 1}, 2025 ${((i + r) % 12) + 1}:${((i + r * 5) % 60).toString().padStart(2, '0')} PM`
                });
            }
            
            gigData.reportCount = numReporters;
            gigData.reportThreshold = 0;
            gigData.ignoredBy = [];
            
            gigData.suspendedBy = {
                adminId: `admin${String((i % 5) + 1).padStart(3, '0')}`,
                adminName: adminNames[i % adminNames.length],
                adminAvatar: 'public/users/User-01.jpg',
                suspendDate: `January ${(i % 28) + 1}, 2025 ${(i % 12) + 1}:${(i % 60).toString().padStart(2, '0')} PM`
            };
        }
        
        allGigs.push(gigData);
    }
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
    
    // Load gigs for this tab
    loadGigCards(tabType);
}

function loadGigCards(tabType) {
    const gigCardsList = document.getElementById('gigCardsList');
    if (!gigCardsList) return;
    
    // Filter gigs by tab type
    let filteredGigs;
    
    if (tabType === 'reported') {
        // Show gigs that are reported AND meet threshold
        filteredGigs = allGigs.filter(gig => 
            gig.reportedBy && 
            gig.reportedBy.length > 0 && 
            gig.reportCount >= gig.reportThreshold &&
            gig.status !== 'suspended' // Don't show suspended gigs in reported tab
        );
    } else if (tabType === 'suspended') {
        // Show only suspended gigs
        filteredGigs = allGigs.filter(gig => gig.status === 'suspended');
    } else {
        // Posted tab: show all posted gigs (including reported ones that are still live)
        filteredGigs = allGigs.filter(gig => gig.status === 'posted' && (!gig.reportedBy || gig.reportedBy.length === 0));
    }
    
    // Update tab counts
    updateTabCounts();
    
    // Generate HTML
    gigCardsList.innerHTML = filteredGigs.map(gig => generateGigCardHTML(gig)).join('');
    
    // Update stats
    const gigsStats = document.getElementById('gigsStats');
    if (gigsStats) {
        gigsStats.textContent = `Showing ${filteredGigs.length} gigs`;
    }
    
    // Attach click handlers
    attachGigCardHandlers();
}

function generateGigCardHTML(gig) {
    return `
        <div class="gig-card" data-gig-id="${gig.gigId}" data-poster-id="${gig.posterId}">
            <div class="gig-thumbnail">
                <img src="${gig.thumbnail}" alt="${gig.title}">
            </div>
            <div class="gig-card-content">
                <div class="gig-card-title">${gig.title}</div>
                <div class="gig-card-meta">
                    <div class="gig-card-schedule">
                        <span class="gig-card-date">📅 ${gig.jobDate}</span>
                        <span class="gig-card-time">🕐 ${gig.startTime} - ${gig.endTime}</span>
                    </div>
                    <div class="gig-card-price">₱${gig.price} (${gig.payRate})</div>
                    <div class="gig-card-posted">Posted ${gig.datePosted} • ${gig.applicationCount} applicants</div>
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
    document.getElementById('gigCategory').textContent = gig.category.toUpperCase();
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
    document.getElementById('gigDate').textContent = gig.jobDate;
    document.getElementById('gigTime').textContent = `${gig.startTime} - ${gig.endTime}`;
    document.getElementById('gigRegion').textContent = gig.region;
    document.getElementById('gigCity').textContent = gig.city;
    
    // Extras (category-specific)
    const extrasRow = document.getElementById('gigExtrasRow');
    if (gig.extras && Object.keys(gig.extras).length > 0) {
        const extraKeys = Object.keys(gig.extras);
        document.getElementById('gigExtra1Label').textContent = extraKeys[0]?.toUpperCase() + ':' || 'EXTRA 1:';
        document.getElementById('gigExtra1Value').textContent = gig.extras[extraKeys[0]] || 'N/A';
        
        if (extraKeys[1]) {
            document.getElementById('gigExtra2Label').textContent = extraKeys[1]?.toUpperCase() + ':' || 'EXTRA 2:';
            document.getElementById('gigExtra2Value').textContent = gig.extras[extraKeys[1]] || 'N/A';
        }
        extrasRow.style.display = 'grid';
    } else {
        extrasRow.style.display = 'none';
    }
    
    // Description
    document.getElementById('gigDescription').textContent = gig.description;
    
    // Payment
    document.getElementById('gigPrice').textContent = `₱${gig.price}`;
    document.getElementById('gigPayRate').textContent = gig.payRate;
    
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
    if (gig.reportedBy && gig.reportedBy.length > 0) {
        const firstReporter = gig.reportedBy[0];
        const additionalCount = gig.reportedBy.length - 1;
        const countBadge = additionalCount > 0 ? ` <span class="report-count-badge">+${additionalCount}</span>` : '';
        
        reportedByInfo.innerHTML = `
            <div class="reported-by-profile">
                <img src="${firstReporter.reporterAvatar}" alt="${firstReporter.reporterName}" class="reporter-avatar">
                <div class="reporter-details">
                    <span class="reporter-name">${firstReporter.reporterName}${countBadge}</span>
                    <span class="report-date">${firstReporter.reportDate}</span>
                </div>
            </div>
        `;
        reportedBySection.style.display = 'block';
    } else {
        reportedBySection.style.display = 'none';
    }
    
    // Suspended By section (for suspended gigs)
    const suspendedBySection = document.getElementById('suspendedBySection');
    const suspendedByInfo = document.getElementById('suspendedByInfo');
    if (gig.status === 'suspended' && gig.suspendedBy) {
        suspendedByInfo.innerHTML = `
            <div class="suspended-by-profile">
                <img src="${gig.suspendedBy.adminAvatar}" alt="${gig.suspendedBy.adminName}" class="admin-avatar">
                <div class="admin-details">
                    <span class="admin-name">${gig.suspendedBy.adminName}</span>
                    <span class="suspend-date">${gig.suspendedBy.suspendDate}</span>
                </div>
            </div>
        `;
        suspendedBySection.style.display = 'block';
    } else {
        suspendedBySection.style.display = 'none';
    }
    
    // Update action buttons based on gig status
    const suspendBtn = document.getElementById('suspendGigBtn');
    const relistBtn = document.getElementById('relistGigBtn');
    const closeBtn = document.getElementById('closeGigBtn');
    const ignoreBtn = document.getElementById('ignoreGigBtn');
    const bigSuspendSection = document.getElementById('bigSuspendSection');
    const permDeleteSection = document.getElementById('permDeleteSection');
    
    if (gig.status === 'suspended') {
        // Suspended: Hide SUSPEND/IGNORE, Show RELIST/CLOSE, Hide BIG SUSPEND, Show PERM DELETE section
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (ignoreBtn) ignoreBtn.style.display = 'none';
        if (relistBtn) relistBtn.style.display = 'inline-block';
        if (closeBtn) closeBtn.style.display = 'inline-block';
        if (bigSuspendSection) bigSuspendSection.style.display = 'none';
        if (permDeleteSection) permDeleteSection.style.display = 'block';
    } else if (gig.reportedBy && gig.reportedBy.length > 0) {
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
        message.innerHTML = `<strong>${currentGigData.title}</strong> by ${currentGigData.posterName} will be moved to the "Suspended" tab.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideSuspendConfirmation() {
    const overlay = document.getElementById('suspendConfirmOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function confirmSuspendGig() {
    if (!currentGigData) return;
    
    // Update gig status
    const gig = allGigs.find(g => g.gigId === currentGigData.gigId);
    if (gig) {
        gig.status = 'suspended';
        
        // Add suspended by info (current admin user)
        const now = new Date();
        gig.suspendedBy = {
            adminId: 'admin001',
            adminName: 'Admin Maria Garcia',
            adminAvatar: 'public/users/User-01.jpg',
            suspendDate: now.toLocaleString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            })
        };
    }
    
    // Hide confirmation
    hideSuspendConfirmation();
    
    // Close detail view
    clearGigDetail();
    
    // Reload current tab
    loadGigCards(currentGigTab);
    
    // Show toast
    showToast('Gig suspended successfully', 'success');
    
    console.log(`🚫 Gig ${currentGigData.gigId} suspended`);
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
        message.innerHTML = `<strong>${currentGigData.title}</strong> by ${currentGigData.posterName} will be moved back to the "Posted" tab.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideRelistConfirmation() {
    const overlay = document.getElementById('relistConfirmOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function confirmRelistGig() {
    if (!currentGigData) return;
    
    // Update gig status
    const gig = allGigs.find(g => g.gigId === currentGigData.gigId);
    if (gig) {
        gig.status = 'posted';
        
        // Remove suspended by info
        delete gig.suspendedBy;
    }
    
    // Hide confirmation
    hideRelistConfirmation();
    
    // Close detail view
    clearGigDetail();
    
    // Reload current tab
    loadGigCards(currentGigTab);
    
    // Show toast
    showToast('Gig relisted successfully', 'success');
    
    console.log(`✅ Gig ${currentGigData.gigId} relisted`);
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
        message.innerHTML = `<strong>${currentGigData.title}</strong> will be hidden from "Reported" and requires ${currentGigData.reportCount + 10} total reports to reappear.`;
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

function confirmIgnoreGig() {
    if (!currentGigData) return;
    
    const gig = allGigs.find(g => g.gigId === currentGigData.gigId);
    if (gig) {
        // Add ignore record
        const now = new Date();
        gig.ignoredBy.push({
            adminId: 'admin001',
            adminName: 'Admin Maria Garcia',
            adminAvatar: 'public/users/User-01.jpg',
            ignoreDate: now.toLocaleString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
            }),
            reportCountAtIgnore: gig.reportCount
        });
        
        // Set new threshold: current count + 10
        gig.reportThreshold = gig.reportCount + 10;
    }
    
    // Hide confirmation overlay
    hideIgnoreConfirmation();
    
    // Close detail view
    clearGigDetail();
    
    // Reload Reported tab
    loadGigCards('reported');
    
    // Show toast
    showToast('Reports ignored. Gig will reappear after 10 more unique reports.', 'success');
    
    console.log(`🙈 Gig ${currentGigData.gigId} ignored`);
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
        message.innerHTML = `<strong>⚠️ Warning:</strong> <strong>"${currentGigData.title}"</strong> posted by ${currentGigData.posterName} will be permanently removed from the marketplace and database. This action cannot be undone.`;
        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideDeleteConfirmation() {
    const overlay = document.getElementById('deleteConfirmOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function confirmDeleteGig() {
    if (!currentGigData) return;
    
    // Remove from allGigs array
    const index = allGigs.findIndex(g => g.gigId === currentGigData.gigId);
    if (index !== -1) {
        allGigs.splice(index, 1);
    }
    
    // Hide confirmation overlay
    hideDeleteConfirmation();
    
    // Close detail view
    clearGigDetail();
    
    // Reload Suspended tab
    loadGigCards('suspended');
    
    // Show toast
    showToast('Gig permanently deleted from database', 'success');
    
    console.log(`🗑️ Gig ${currentGigData.gigId} permanently deleted`);
}

function handleContactGig() {
    if (!currentGigData) return;
    
    // Show contact overlay
    const contactOverlay = document.getElementById('contactGigOverlay');
    if (contactOverlay) {
        contactOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function handleCloseGig() {
    clearGigDetail();
}

function initializeContactGigOverlay() {
    // Close button
    document.getElementById('closeContactGigModal')?.addEventListener('click', closeContactGigOverlay);
    
    // Cancel button
    document.getElementById('cancelContactBtn')?.addEventListener('click', closeContactGigOverlay);
    
    // Attach photo button
    const attachBtn = document.getElementById('contactAttachBtn');
    const attachInput = document.getElementById('contactAttachmentInput');
    
    if (attachBtn && attachInput) {
        attachBtn.addEventListener('click', function() {
            attachInput.click();
        });
        
        attachInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const previewContainer = document.getElementById('contactAttachmentPreview');
                    const previewImage = document.getElementById('contactPreviewImage');
                    
                    if (previewImage && previewContainer) {
                        previewImage.src = event.target.result;
                        previewContainer.style.display = 'block';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Remove attachment button
    document.getElementById('removeContactAttachment')?.addEventListener('click', function() {
        const previewContainer = document.getElementById('contactAttachmentPreview');
        const attachInput = document.getElementById('contactAttachmentInput');
        const previewImage = document.getElementById('contactPreviewImage');
        
        if (previewContainer) {
            previewContainer.style.display = 'none';
        }
        if (previewImage) {
            previewImage.src = '';
        }
        if (attachInput) {
            attachInput.value = '';
        }
    });
    
    // Send Message button
    document.getElementById('sendContactMessageBtn')?.addEventListener('click', function() {
        const recipient = document.getElementById('contactRecipientSelect').value;
        const message = document.getElementById('contactMessageInput').value.trim();
        const attachInput = document.getElementById('contactAttachmentInput');
        const hasAttachment = attachInput && attachInput.files.length > 0;
        
        if (!recipient) {
            alert('Please select a recipient');
            return;
        }
        
        if (!message) {
            alert('Please enter a message');
            return;
        }
        
        // Close contact overlay
        closeContactGigOverlay();
        
        // Show success toast
        const attachmentText = hasAttachment ? ' with attachment' : '';
        showToast(`Message sent to ${recipient}${attachmentText}`, 'success');
        
        console.log(`💬 Message sent to: ${recipient}`);
        console.log(`📝 Message: ${message}`);
        if (hasAttachment) {
            console.log(`📎 Attachment: ${attachInput.files[0].name}`);
        }
    });
    
    // Close on background click
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
    document.getElementById('contactRecipientSelect').value = '';
    document.getElementById('contactMessageInput').value = '';
    document.getElementById('contactAttachmentInput').value = '';
    
    const previewContainer = document.getElementById('contactAttachmentPreview');
    const previewImage = document.getElementById('contactPreviewImage');
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    if (previewImage) {
        previewImage.src = '';
    }
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
    document.getElementById('gigOverlayPostedTime').textContent = `Posted ${gig.datePosted}`;
    document.getElementById('gigOverlayCategory').textContent = gig.category.toUpperCase();
    
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
    
    // Update action buttons based on gig status
    const overlaySuspendBtn = document.getElementById('gigOverlaySuspendBtn');
    const overlayIgnoreBtn = document.getElementById('gigOverlayIgnoreBtn');
    const overlayRelistBtn = document.getElementById('gigOverlayRelistBtn');
    const overlayCloseBtn = document.getElementById('gigOverlayCloseBtn');
    
    if (gig.status === 'suspended') {
        // Suspended: Hide SUSPEND/IGNORE, Show RELIST/CLOSE
        if (overlaySuspendBtn) overlaySuspendBtn.style.display = 'none';
        if (overlayIgnoreBtn) overlayIgnoreBtn.style.display = 'none';
        if (overlayRelistBtn) overlayRelistBtn.style.display = 'inline-block';
        if (overlayCloseBtn) overlayCloseBtn.style.display = 'inline-block';
    } else if (gig.reportedBy && gig.reportedBy.length > 0) {
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
    let extrasHTML = '';
    if (gig.extras && Object.keys(gig.extras).length > 0) {
        extrasHTML = Object.entries(gig.extras).map(([key, value]) => `
            <div class="gig-info-item">
                <div class="gig-info-label">${key.toUpperCase()}:</div>
                <div class="gig-info-value">${value}</div>
            </div>
        `).join('');
    }
    
    let hiredWorkerHTML = '';
    if (gig.hiredWorker) {
        hiredWorkerHTML = `
            <div class="hired-worker-profile">
                <img src="${gig.hiredWorker.workerAvatar}" alt="${gig.hiredWorker.workerName}" class="hired-worker-avatar">
                <span class="hired-worker-name">${gig.hiredWorker.workerName}</span>
            </div>
        `;
    } else {
        hiredWorkerHTML = '<div class="no-hired-worker">This Gig has no hired worker.</div>';
    }
    
    // Reported By HTML (for reported and suspended gigs)
    let reportedByHTML = '';
    if (gig.reportedBy && gig.reportedBy.length > 0) {
        const firstReporter = gig.reportedBy[0];
        const additionalCount = gig.reportedBy.length - 1;
        const countBadge = additionalCount > 0 ? ` <span class="report-count-badge">+${additionalCount}</span>` : '';
        
        reportedByHTML = `
            <div class="reported-by-section">
                <div class="reported-by-label">REPORTED BY:</div>
                <div class="reported-by-info">
                    <div class="reported-by-profile">
                        <img src="${firstReporter.reporterAvatar}" alt="${firstReporter.reporterName}" class="reporter-avatar">
                        <div class="reporter-details">
                            <span class="reporter-name">${firstReporter.reporterName}${countBadge}</span>
                            <span class="report-date">${firstReporter.reportDate}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Big Suspend HTML (for reported gigs only)
    let bigSuspendHTML = '';
    if (gig.reportedBy && gig.reportedBy.length > 0 && gig.status !== 'suspended') {
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
        suspendedByHTML = `
            <div class="suspended-by-section">
                <div class="suspended-by-label">SUSPENDED BY:</div>
                <div class="suspended-by-info">
                    <div class="suspended-by-profile">
                        <img src="${gig.suspendedBy.adminAvatar}" alt="${gig.suspendedBy.adminName}" class="admin-avatar">
                        <div class="admin-details">
                            <span class="admin-name">${gig.suspendedBy.adminName}</span>
                            <span class="suspend-date">${gig.suspendedBy.suspendDate}</span>
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
            <div class="gig-title">${gig.title}</div>
            
            ${gig.thumbnail ? `
                <div class="gig-photo-container">
                    <img src="${gig.thumbnail}" alt="Gig Photo" class="gig-photo">
                </div>
            ` : ''}
            
            <div class="gig-info-section">
                <div class="gig-info-row">
                    <div class="gig-info-item">
                        <div class="gig-info-label">DATE:</div>
                        <div class="gig-info-value">${gig.jobDate}</div>
                    </div>
                    <div class="gig-info-item">
                        <div class="gig-info-label">TIME:</div>
                        <div class="gig-info-value">${gig.startTime} - ${gig.endTime}</div>
                    </div>
                </div>
                <div class="gig-info-row">
                    <div class="gig-info-item">
                        <div class="gig-info-label">REGION:</div>
                        <div class="gig-info-value">${gig.region}</div>
                    </div>
                    <div class="gig-info-item">
                        <div class="gig-info-label">CITY:</div>
                        <div class="gig-info-value">${gig.city}</div>
                    </div>
                </div>
                ${extrasHTML ? `<div class="gig-info-row">${extrasHTML}</div>` : ''}
            </div>
            
            <div class="gig-description-section">
                <div class="gig-description-label">DETAILS:</div>
                <div class="gig-description-text">${gig.description}</div>
            </div>
            
            <div class="gig-payment-section">
                <div class="gig-payment-row">
                    <div class="gig-payment-item">
                        <div class="gig-payment-label">PRICE:</div>
                        <div class="gig-payment-value">₱${gig.price}</div>
                    </div>
                    <div class="gig-payment-item">
                        <div class="gig-payment-label">PAY RATE:</div>
                        <div class="gig-payment-value">${gig.payRate}</div>
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

function initializeGigSearch() {
    const searchInput = document.getElementById('gigsSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performGigSearch();
            }
        });
        
        // Real-time search on input
        searchInput.addEventListener('input', performGigSearch);
    }
}

function performGigSearch() {
    const query = document.getElementById('gigsSearchInput')?.value.toLowerCase().trim();
    
    if (!query) {
        // If empty, show all gigs for current tab
        loadGigCards(currentGigTab);
        return;
    }
    
    // Filter gigs by current tab AND search query
    const filteredGigs = allGigs.filter(gig => {
        const matchesTab = gig.status === currentGigTab;
        const matchesQuery = 
            gig.title.toLowerCase().includes(query) ||
            gig.description.toLowerCase().includes(query) ||
            gig.posterName.toLowerCase().includes(query) ||
            gig.category.toLowerCase().includes(query);
        
        return matchesTab && matchesQuery;
    });
    
    // Render filtered results
    const gigCardsList = document.getElementById('gigCardsList');
    if (gigCardsList) {
        if (filteredGigs.length === 0) {
            gigCardsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a0aec0;">No gigs found matching your search.</div>';
        } else {
            gigCardsList.innerHTML = filteredGigs.map(gig => generateGigCardHTML(gig)).join('');
            attachGigCardHandlers();
        }
        
        // Update stats
        const gigsStats = document.getElementById('gigsStats');
        if (gigsStats) {
            gigsStats.textContent = `Showing ${filteredGigs.length} of ${allGigs.filter(g => g.status === currentGigTab).length} gigs`;
        }
    }
}

function updateTabCounts() {
    // Posted: gigs that are posted and not reported
    const postedCount = allGigs.filter(g => g.status === 'posted' && (!g.reportedBy || g.reportedBy.length === 0)).length;
    
    // Reported: gigs with reports that meet threshold and not suspended
    const reportedCount = allGigs.filter(g => 
        g.reportedBy && 
        g.reportedBy.length > 0 && 
        g.reportCount >= g.reportThreshold &&
        g.status !== 'suspended'
    ).length;
    
    // Suspended: gigs that are suspended
    const suspendedCount = allGigs.filter(g => g.status === 'suspended').length;
    
    document.getElementById('postedCount').textContent = postedCount;
    document.getElementById('reportedCount').textContent = reportedCount;
    document.getElementById('suspendedCount').textContent = suspendedCount;
}

// Handle resize to switch between overlay/panel views
window.addEventListener('resize', () => {
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

const STORAGE_KEYS = {
    totalUsers: 'admin_mock_total_users',        // 🔥 Firebase: /admin/analytics/users/total
    verifications: 'admin_mock_verifications',   // 🔥 Firebase: /admin/analytics/verifications/pending
    allTimeRevenue: 'admin_mock_alltime_revenue', // 🔥 Firebase: /admin/analytics/revenue/allTime
    simulationStartTime: 'admin_mock_sim_start', // Simulation start timestamp (real time)
    revenueHistory: 'admin_mock_revenue_history', // Array of {timestamp, amount} for period calculations
    gigsReported: 'admin_mock_gigs_reported',    // 🔥 Firebase: /admin/analytics/gigs/reported (count)
    androidUsers: 'admin_mock_android_users',    // 🔥 Firebase: /admin/analytics/userActivity/android
    iphoneUsers: 'admin_mock_iphone_users',      // 🔥 Firebase: /admin/analytics/userActivity/iphone
    totalGigs: 'admin_mock_total_gigs',          // 🔥 Firebase: /admin/analytics/gigs/total
    totalApplicants: 'admin_mock_total_applicants', // 🔥 Firebase: /admin/analytics/gigs/applicants
    storageUsed: 'admin_mock_storage_used',      // 🔥 Firebase: /admin/analytics/storage/used (GB)
    bandwidthMTD: 'admin_mock_bandwidth_mtd',    // 🔥 Firebase: /admin/analytics/traffic/bandwidth (GB)
    firebaseCostMTD: 'admin_mock_firebase_cost_mtd', // 🔥 Firebase: /admin/analytics/traffic/cost
    lastUpdate: 'admin_mock_last_update',         // 🔥 Firebase: /admin/analytics/lastUpdate
    // User Activity Base Percentages (slowly drifting over time)
    mobilePercent: 'admin_mock_mobile_percent',       // % of active users on mobile (slowly trends up)
    androidPercent: 'admin_mock_android_percent',     // % of mobile users on Android
    repeatUserPercent: 'admin_mock_repeat_percent',   // % of total users that are repeat users
    bounceRate: 'admin_mock_bounce_rate'              // % bounce rate (slowly trends down as app improves)
};

// ===== TIME-BASED SIMULATION HELPERS =====
// Time conversion: 1 real second = 1 simulated hour
// 24 real seconds = 1 simulated day
// 720 real seconds (12 minutes) = 1 simulated month (30 days)
// 8640 real seconds (2.4 hours) = 1 simulated year (12 months)

function getSimulationStartTime() {
    const stored = localStorage.getItem(STORAGE_KEYS.simulationStartTime);
    return stored ? parseInt(stored) : Date.now();
}

function getElapsedRealSeconds() {
    const startTime = getSimulationStartTime();
    const now = Date.now();
    return Math.floor((now - startTime) / 1000); // Convert ms to seconds
}

function getSimulatedDate() {
    const elapsedSeconds = getElapsedRealSeconds();
    const simulatedDays = Math.floor(elapsedSeconds / 24); // 24 real seconds = 1 simulated day
    
    // Start from January 1 + 7 days (initial state)
    const startDate = new Date(2025, 0, 1); // Jan 1, 2025
    const initialDays = 7; // Simulation starts 7 days in
    const totalDays = initialDays + simulatedDays;
    
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + totalDays);
    
    return {
        date: currentDate,
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // 1-12
        day: currentDate.getDate(),
        totalElapsedDays: totalDays,
        elapsedRealSeconds: elapsedSeconds
    };
}

function addRevenueToHistory(amount) {
    try {
        const history = getRevenueHistory();
        const entry = {
            timestamp: Date.now(),
            amount: amount
        };
        
        history.push(entry);
        
        // Keep only last 17,280 entries (2 simulated years = ~4.8 real hours)
        if (history.length > 17280) {
            history.shift(); // Remove oldest entry
        }
        
        localStorage.setItem(STORAGE_KEYS.revenueHistory, JSON.stringify(history));
    } catch (e) {
        console.error('❌ Failed to save revenue history:', e);
    }
}

function getRevenueHistory() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.revenueHistory);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('❌ Failed to load revenue history:', e);
        return [];
    }
}

function getRevenueForPeriod(periodType, periodValue = null) {
    const history = getRevenueHistory();
    const now = Date.now();
    const simData = getSimulatedDate();
    
    let cutoffTimestamp = 0;
    
    switch(periodType) {
        case '1': // Last 1 Day (last 24 real seconds)
            cutoffTimestamp = now - (24 * 1000);
            break;
            
        case '7': // Last 7 Days (last 168 real seconds)
            cutoffTimestamp = now - (168 * 1000);
            break;
            
        case '30': // Last 30 Days (last 720 real seconds)
            cutoffTimestamp = now - (720 * 1000);
            break;
            
        case 'current': // Current Month (from start of current 720-sec bracket)
            const elapsedSeconds = getElapsedRealSeconds();
            const secondsIntoCurrentMonth = elapsedSeconds % 720;
            cutoffTimestamp = now - (secondsIntoCurrentMonth * 1000);
            break;
            
        case 'last': // Last Month (previous 720-sec bracket)
            const elapsed = getElapsedRealSeconds();
            const monthsPassed = Math.floor(elapsed / 720);
            if (monthsPassed === 0) {
                // Still in first month, return 0
                return 0;
            }
            // Get entries from previous month bracket
            const lastMonthStart = now - ((elapsed % 720) * 1000) - (720 * 1000);
            const lastMonthEnd = now - ((elapsed % 720) * 1000);
            return history
                .filter(entry => entry.timestamp >= lastMonthStart && entry.timestamp < lastMonthEnd)
                .reduce((sum, entry) => sum + entry.amount, 0);
            
        case 'quarter': // This Quarter (from start of current 2160-sec bracket)
            const elapsedSec = getElapsedRealSeconds();
            const secondsIntoCurrentQuarter = elapsedSec % 2160;
            cutoffTimestamp = now - (secondsIntoCurrentQuarter * 1000);
            break;
            
        case 'ytd': // Year To Date (from start of current 8640-sec bracket)
            const elapsedYTD = getElapsedRealSeconds();
            const secondsIntoCurrentYear = elapsedYTD % 8640;
            cutoffTimestamp = now - (secondsIntoCurrentYear * 1000);
            break;
            
        case 'all': // All Time
        default:
            cutoffTimestamp = 0; // Include everything
            break;
    }
    
    // Sum all entries after cutoff
    return history
        .filter(entry => entry.timestamp >= cutoffTimestamp)
        .reduce((sum, entry) => sum + entry.amount, 0);
}

// Initialize stat overlay system
function initializeStatOverlays() {
    console.log('📊 Initializing stat overlay system...');
    
    try {
        // Load or initialize mock data with cumulative growth
        initializeMockData();
        console.log('✅ Mock data initialized');
        
        // Update display with current values
        updateStatCardsDisplay();
        console.log('✅ Stat cards display updated');
        
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

// =============================================================================
// 🔥 FIREBASE TODO: Replace this entire function with Firebase real-time listeners
// =============================================================================
// Initialize mock data with cumulative growth
// FIREBASE IMPLEMENTATION:
//   1. Set up Firebase listener: onValue(ref(db, '/admin/analytics'), (snapshot) => {...})
//   2. Update dashboard cards in real-time as data changes
//   3. Remove all localStorage calls
//   4. Remove mock data generation and growth simulation
function initializeMockData() {
    const now = Date.now();
    const lastUpdate = localStorage.getItem(STORAGE_KEYS.lastUpdate);
    
    // Check if NEW structure exists (post-refactor)
    const existingRevenue = localStorage.getItem(STORAGE_KEYS.allTimeRevenue);
    const existingUsers = localStorage.getItem(STORAGE_KEYS.totalUsers);
    const existingSimStart = localStorage.getItem(STORAGE_KEYS.simulationStartTime);
    
    // Check if OLD structure exists (pre-refactor)
    const oldRevenue = localStorage.getItem('admin_mock_revenue');
    
    // If old structure detected but new structure missing, clear everything and start fresh
    if (oldRevenue && !existingSimStart) {
        console.log('🔄 Detected old data structure. Migrating to new time-based system...');
        // Clear all old keys
        localStorage.removeItem('admin_mock_revenue');
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        // Force initialization with new structure
        const initialData = generateInitialMockData();
        saveMockDataToStorage(initialData);
        return;
    }
    
    if (!existingRevenue || !existingUsers || !lastUpdate || !existingSimStart) {
        // First time initialization (MOCK ONLY)
        const initialData = generateInitialMockData();
        saveMockDataToStorage(initialData);
    } else {
        // Apply cumulative growth on refresh (MOCK ONLY)
        // NOTE: Revenue growth now happens per-second, not on refresh
        const currentData = loadMockDataFromStorage();
        const grownData = applyGrowth(currentData);
        saveMockDataToStorage(grownData);
    }
}

// 🔥 FIREBASE TODO: DELETE THIS FUNCTION - Real data will come from Firebase
// Generate initial baseline mock data (MOCK ONLY - DELETE WHEN IMPLEMENTING FIREBASE)
function generateInitialMockData() {
    // Starting values as per requirements
    const totalUsers = Math.floor(Math.random() * 50) + 50; // 50-99
    const verifications = Math.floor(Math.random() * 10) + 5; // 5-14
    
    // All Time Revenue starts at ₱10,000 - ₱15,000
    // Represents 7 simulated days of accumulated revenue
    const baseOptions = [10000, 11000, 12000, 13000, 14000, 15000];
    const allTimeRevenue = baseOptions[Math.floor(Math.random() * baseOptions.length)];
    
    const gigsReported = Math.floor(Math.random() * 10) + 10; // 10-19
    
    // New analytics metrics - CALCULATED FROM TOTAL USERS
    // Mobile: 88%, Android: 78% of mobile, iPhone: 22% of mobile
    const mobileUsers = Math.round(totalUsers * 0.88);
    const androidUsers = Math.round(mobileUsers * 0.78);
    const iphoneUsers = Math.round(mobileUsers * 0.22);
    
    // Total Gigs: 68-75% of total users
    const gigsPercentage = 0.68 + (Math.random() * 0.07); // 68-75%
    const totalGigs = Math.round(totalUsers * gigsPercentage);
    
    // Applications: 5-15 average per gig
    const applicationsMultiplier = 5 + (Math.random() * 10); // 5-15 average per gig
    const totalApplicants = Math.round(totalGigs * applicationsMultiplier);
    
    // Storage: Calculate based on users, gigs, and verifications
    // Profile Photos: 100% of users (MANDATORY) @ 350 KB each
    const profileStorage = (totalUsers * 0.00035);
    // Gig Photos: Avg 1.5 photos per gig @ 500 KB each
    const gigStorage = (totalGigs * 1.5 * 0.0005);
    // ID Verifications: 100% of verified @ 750 KB each
    const idStorage = (verifications * 0.00075);
    // Other Files: ~5% of users @ 1 MB each
    const otherStorage = (totalUsers * 0.05 * 0.001);
    const storageUsed = parseFloat((profileStorage + gigStorage + idStorage + otherStorage).toFixed(2));
    
    // Traffic & Costs: Calculate based on users and activity
    const activeUsers = Math.round(totalUsers * 0.20); // 20% active users
    const bandwidthMTD = parseFloat(((activeUsers * 0.032) + (storageUsed * 0.1)).toFixed(1)); // GB
    
    // Calculate Firebase costs (prorated for 7 days of simulation)
    const daysInSimulation = 7; // Jan 1 - Jan 8
    const daysInMonth = 30;
    const monthlyReads = Math.round(activeUsers * 11250);
    const monthlyWrites = Math.round((activeUsers * 13) + (totalUsers * 0.10 * 8));
    
    // Prorate reads/writes to 7 days for MTD
    const mtdReads = Math.round((monthlyReads / daysInMonth) * daysInSimulation);
    const mtdWrites = Math.round((monthlyWrites / daysInMonth) * daysInSimulation);
    const dbCost = ((mtdReads / 100000) * 0.036) + ((mtdWrites / 100000) * 0.108);
    
    // Prorate storage and auth costs to 7 days for MTD
    const storageCost = storageUsed * 0.026 * (daysInSimulation / daysInMonth);
    const bandwidthCost = bandwidthMTD * 0.12;
    const authCost = activeUsers * 0.0055 * (daysInSimulation / daysInMonth);
    const firebaseCostMTD = parseFloat((dbCost + storageCost + bandwidthCost + authCost).toFixed(2));
    
    // Initialize simulation start time and empty revenue history
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.simulationStartTime, now);
    localStorage.setItem(STORAGE_KEYS.revenueHistory, JSON.stringify([]));
    
    // Initialize User Activity Base Percentages (realistic starting values for Filipino market)
    const mobilePercent = 0.88;     // 88% mobile users (Philippines is mobile-first)
    const androidPercent = 0.78;    // 78% of mobile are Android (Android dominates in PH)
    const repeatUserPercent = 0.50; // 50% repeat users
    const bounceRate = 0.25;        // 25% bounce rate
    
    localStorage.setItem(STORAGE_KEYS.mobilePercent, mobilePercent);
    localStorage.setItem(STORAGE_KEYS.androidPercent, androidPercent);
    localStorage.setItem(STORAGE_KEYS.repeatUserPercent, repeatUserPercent);
    localStorage.setItem(STORAGE_KEYS.bounceRate, bounceRate);
    
    console.log(`🎬 Simulation started! Date: Jan 8, 2025 (7 days in), All Time Revenue: ₱${allTimeRevenue.toLocaleString()}`);
    console.log(`📊 User Activity Percentages: Mobile ${(mobilePercent*100).toFixed(0)}%, Android ${(androidPercent*100).toFixed(0)}%, Repeat ${(repeatUserPercent*100).toFixed(0)}%, Bounce ${(bounceRate*100).toFixed(0)}%`);
    console.log(`💼 Gigs Analytics: ${totalGigs} gigs (${(gigsPercentage*100).toFixed(0)}% of users), ${totalApplicants} applications (${applicationsMultiplier.toFixed(1)} avg per gig)`);
    console.log(`💾 Storage Usage: ${storageUsed.toFixed(2)} GB | Profile: ${((profileStorage/storageUsed)*100).toFixed(0)}%, Gigs: ${((gigStorage/storageUsed)*100).toFixed(0)}%, ID: ${((idStorage/storageUsed)*100).toFixed(0)}%`);
    console.log(`📡 Traffic & Costs MTD (7 days): ${bandwidthMTD.toFixed(1)} GB bandwidth | ${(mtdReads/1000).toFixed(0)}K reads | ${(mtdWrites/1000).toFixed(0)}K writes | $${firebaseCostMTD.toFixed(2)} total`);
    
    return {
        totalUsers,
        verifications,
        allTimeRevenue,
        gigsReported,
        androidUsers,
        iphoneUsers,
        totalGigs,
        totalApplicants,
        storageUsed,
        bandwidthMTD,
        firebaseCostMTD,
        timestamp: now,
        mobilePercent,
        androidPercent,
        repeatUserPercent,
        bounceRate
    };
}

// 🔥 FIREBASE TODO: DELETE THIS FUNCTION - Real analytics will be calculated server-side
// Apply cumulative growth percentages (MOCK ONLY - DELETE WHEN IMPLEMENTING FIREBASE)
function applyGrowth(data) {
    // Total Users: up to 5% increase
    const usersGrowth = 1 + (Math.random() * 0.05);
    data.totalUsers = Math.round(data.totalUsers * usersGrowth);
    
    // Verifications: fluctuate (can grow up to max 100)
    const verificationChange = Math.random() < 0.5 ? -1 : Math.floor(Math.random() * 3) + 1;
    data.verifications = Math.max(5, Math.min(100, data.verifications + verificationChange));
    
    // Revenue: NO LONGER GROWS ON REFRESH - grows continuously per second
    // allTimeRevenue will be updated by the per-second timer, just preserve it here
    // (No changes to data.allTimeRevenue)
    
    // Gigs Reported: ±5% fluctuation (can grow up to max 100)
    const reportedChange = (Math.random() - 0.5) * 0.10; // -5% to +5%
    data.gigsReported = Math.max(10, Math.min(100, Math.round(data.gigsReported * (1 + reportedChange))));
    
    data.timestamp = Date.now();
    
    console.log('📊 Growth applied:', {
        users: `+${((usersGrowth - 1) * 100).toFixed(1)}%`,
        verifications: verificationChange,
        allTimeRevenue: `₱${data.allTimeRevenue.toLocaleString()} (continuous per-second growth)`,
        gigsReported: `${(reportedChange * 100).toFixed(1)}%`
    });
    
    return data;
}

// Helper: Round revenue to valid increments (100, 250, 500)
function roundToValidIncrement(amount) {
    // Users can only add money in increments of 100, 250, or 500
    // So revenue should always be a sum of these increments
    
    // Round to nearest 50 first for better distribution
    const rounded = Math.round(amount / 50) * 50;
    
    // Ensure it's at least 100
    return Math.max(100, rounded);
}

// 🔥 FIREBASE TODO: Replace with Firebase set() or update() calls
// Save mock data to localStorage (MOCK ONLY - REPLACE WITH FIREBASE)
// FIREBASE IMPLEMENTATION: 
//   set(ref(db, '/admin/analytics'), { users: {...}, revenue: {...}, ... })
function saveMockDataToStorage(data) {
    try {
        localStorage.setItem(STORAGE_KEYS.totalUsers, data.totalUsers);
        localStorage.setItem(STORAGE_KEYS.verifications, data.verifications);
        localStorage.setItem(STORAGE_KEYS.allTimeRevenue, data.allTimeRevenue);
        localStorage.setItem(STORAGE_KEYS.gigsReported, data.gigsReported);
        localStorage.setItem(STORAGE_KEYS.androidUsers, data.androidUsers);
        localStorage.setItem(STORAGE_KEYS.iphoneUsers, data.iphoneUsers);
        localStorage.setItem(STORAGE_KEYS.totalGigs, data.totalGigs);
        localStorage.setItem(STORAGE_KEYS.totalApplicants, data.totalApplicants);
        localStorage.setItem(STORAGE_KEYS.storageUsed, data.storageUsed);
        localStorage.setItem(STORAGE_KEYS.bandwidthMTD, data.bandwidthMTD);
        localStorage.setItem(STORAGE_KEYS.firebaseCostMTD, data.firebaseCostMTD);
        localStorage.setItem(STORAGE_KEYS.lastUpdate, data.timestamp);
        // User Activity Percentages
        if (data.mobilePercent !== undefined) localStorage.setItem(STORAGE_KEYS.mobilePercent, data.mobilePercent);
        if (data.androidPercent !== undefined) localStorage.setItem(STORAGE_KEYS.androidPercent, data.androidPercent);
        if (data.repeatUserPercent !== undefined) localStorage.setItem(STORAGE_KEYS.repeatUserPercent, data.repeatUserPercent);
        if (data.bounceRate !== undefined) localStorage.setItem(STORAGE_KEYS.bounceRate, data.bounceRate);
        // Note: simulationStartTime and revenueHistory are saved separately
    } catch (e) {
        console.error('❌ localStorage not available:', e.message);
    }
}

// 🔥 FIREBASE TODO: Replace with Firebase get() or onValue() listener
// Load mock data from localStorage (MOCK ONLY - REPLACE WITH FIREBASE)
// FIREBASE IMPLEMENTATION:
//   const snapshot = await get(ref(db, '/admin/analytics'))
//   const data = snapshot.val()
function loadMockDataFromStorage() {
    try {
        return {
            totalUsers: parseInt(localStorage.getItem(STORAGE_KEYS.totalUsers)) || 85,
            verifications: parseInt(localStorage.getItem(STORAGE_KEYS.verifications)) || 12,
            allTimeRevenue: parseInt(localStorage.getItem(STORAGE_KEYS.allTimeRevenue)) || 10000,
            gigsReported: parseInt(localStorage.getItem(STORAGE_KEYS.gigsReported)) || 18,
            androidUsers: parseInt(localStorage.getItem(STORAGE_KEYS.androidUsers)) || 847,
            iphoneUsers: parseInt(localStorage.getItem(STORAGE_KEYS.iphoneUsers)) || 398,
            totalGigs: parseInt(localStorage.getItem(STORAGE_KEYS.totalGigs)) || 1847,
            totalApplicants: parseInt(localStorage.getItem(STORAGE_KEYS.totalApplicants)) || 5624,
            storageUsed: parseFloat(localStorage.getItem(STORAGE_KEYS.storageUsed)) || 3.8,
            bandwidthMTD: parseFloat(localStorage.getItem(STORAGE_KEYS.bandwidthMTD)) || 12.4,
            firebaseCostMTD: parseFloat(localStorage.getItem(STORAGE_KEYS.firebaseCostMTD)) || 3.20,
            timestamp: parseInt(localStorage.getItem(STORAGE_KEYS.lastUpdate)) || Date.now(),
            mobilePercent: parseFloat(localStorage.getItem(STORAGE_KEYS.mobilePercent)) || 0.88,
            androidPercent: parseFloat(localStorage.getItem(STORAGE_KEYS.androidPercent)) || 0.78,
            repeatUserPercent: parseFloat(localStorage.getItem(STORAGE_KEYS.repeatUserPercent)) || 0.50,
            bounceRate: parseFloat(localStorage.getItem(STORAGE_KEYS.bounceRate)) || 0.25
        };
    } catch (e) {
        console.error('❌ localStorage not available:', e.message);
        return {
            totalUsers: 85,
            verifications: 12,
            allTimeRevenue: 10000,
            gigsReported: 18,
            androidUsers: 847,
            iphoneUsers: 398,
            totalGigs: 1847,
            totalApplicants: 5624,
            storageUsed: 3.8,
            bandwidthMTD: 12.4,
            firebaseCostMTD: 3.20,
            timestamp: Date.now(),
            mobilePercent: 0.88,
            androidPercent: 0.78,
            repeatUserPercent: 0.50,
            bounceRate: 0.25
        };
    }
}

// ===== USER ACTIVITY CALCULATION HELPERS =====

/**
 * Calculate active users (15-25% of total users are "active" at any given time)
 * This simulates realistic concurrent user activity
 */
function calculateActiveUsers(totalUsers) {
    const activePercentage = 0.15 + (Math.random() * 0.10); // 15-25%
    return Math.floor(totalUsers * activePercentage);
}

/**
 * Apply tiny drift to base percentages to simulate realistic trends over time
 * Mobile: slowly trending up (85-92%) - Philippines is mobile-first
 * Android: relatively stable (75-82%) - Android dominates in PH
 * Repeat Users: slowly increasing (40-60%)
 * Bounce Rate: slowly decreasing (20-30%)
 */
function applyPercentageDrift(percentages) {
    // ±0.1-0.5% drift per update (very gradual)
    const drift = (Math.random() - 0.5) * 0.005; // -0.0025 to +0.0025
    
    // Mobile trending up slowly (88% → 92% ceiling)
    percentages.mobilePercent += drift + 0.0001; // slight upward bias
    percentages.mobilePercent = Math.max(0.85, Math.min(0.92, percentages.mobilePercent));
    
    // Android relatively stable (78% ± 3-4%)
    percentages.androidPercent += drift;
    percentages.androidPercent = Math.max(0.75, Math.min(0.82, percentages.androidPercent));
    
    // Repeat Users increasing slowly (good for business!)
    percentages.repeatUserPercent += drift + 0.0002; // slight upward bias
    percentages.repeatUserPercent = Math.max(0.40, Math.min(0.60, percentages.repeatUserPercent));
    
    // Bounce Rate decreasing slowly (app improving!)
    percentages.bounceRate += drift - 0.0002; // slight downward bias  
    percentages.bounceRate = Math.max(0.20, Math.min(0.30, percentages.bounceRate));
    
    return percentages;
}

/**
 * Calculate all User Activity metrics based on totalUsers and base percentages
 * Returns calculated counts and percentages ready for display
 */
function calculateUserActivityMetrics(totalUsers, percentages) {
    // Calculate active users (15-25% of total) - used for overlay data like browsers, sessions
    const activeUsers = calculateActiveUsers(totalUsers);
    
    // ===== OVERVIEW CARD METRICS (based on TOTAL USERS) =====
    // These represent all registered users' device types, not just currently active
    
    // Total Mobile vs Desktop distribution
    const totalMobileCount = Math.floor(totalUsers * percentages.mobilePercent);
    const totalDesktopCount = totalUsers - totalMobileCount;
    
    // Android vs iPhone (of all mobile users)
    const androidCount = Math.floor(totalMobileCount * percentages.androidPercent);
    const iphoneCount = totalMobileCount - androidCount;
    const androidPercent = totalMobileCount > 0 ? Math.round((androidCount / totalMobileCount) * 100) : 0;
    const iphonePercent = totalMobileCount > 0 ? (100 - androidPercent) : 0;
    
    // ===== OVERLAY METRICS (based on ACTIVE USERS for realism) =====
    // Mobile/Desktop for overlay display
    const activeMobileCount = Math.floor(activeUsers * percentages.mobilePercent);
    const activeDesktopCount = activeUsers - activeMobileCount;
    const mobilePercent = Math.round((activeMobileCount / activeUsers) * 100);
    const desktopPercent = 100 - mobilePercent;
    
    // Repeat users (of total users, not active)
    const repeatCount = Math.floor(totalUsers * percentages.repeatUserPercent);
    const repeatPercent = Math.round(percentages.repeatUserPercent * 100);
    
    // Bounce rate (percentage)
    const bounceRate = Math.round(percentages.bounceRate * 100);
    
    return {
        activeUsers,
        // Overview card data (TOTAL users)
        androidCount,        // All Android users
        iphoneCount,         // All iPhone users  
        androidPercent,      // % of mobile that are Android
        iphonePercent,       // % of mobile that are iPhone
        totalMobileCount,    // Total mobile users
        totalDesktopCount,   // Total desktop users
        // Overlay data (ACTIVE users)
        mobileCount: activeMobileCount,      // Currently active mobile
        desktopCount: activeDesktopCount,    // Currently active desktop
        mobilePercent,       // % of active that are mobile
        desktopPercent,      // % of active that are desktop
        repeatCount,
        repeatPercent,
        bounceRate
    };
}

/**
 * Update User Activity overview card displays with new metrics
 * Updates the counts and percentages on the main dashboard
 */
function updateUserActivityOverviewCards(metrics) {
    // Android count and percentage
    const androidValueEl = document.getElementById('androidDeviceCount');
    if (androidValueEl) {
        androidValueEl.textContent = metrics.androidCount.toLocaleString();
        // Update the percentage sibling element
        const androidPercentEl = androidValueEl.nextElementSibling;
        if (androidPercentEl && androidPercentEl.classList.contains('analytics-percent')) {
            androidPercentEl.textContent = `${metrics.androidPercent}%`;
        }
    }
    
    // iPhone count and percentage
    const iphoneValueEl = document.getElementById('iphoneDeviceCount');
    if (iphoneValueEl) {
        iphoneValueEl.textContent = metrics.iphoneCount.toLocaleString();
        // Update the percentage sibling element
        const iphonePercentEl = iphoneValueEl.nextElementSibling;
        if (iphonePercentEl && iphonePercentEl.classList.contains('analytics-percent')) {
            iphonePercentEl.textContent = `${metrics.iphonePercent}%`;
        }
    }
    
    // Average Session Duration (varies slightly 7-10 minutes)
    const avgSessionEl = document.getElementById('avgSessionDuration');
    if (avgSessionEl) {
        // Calculate from session distribution with slight random variation
        const baseMinutes = (0.19 * 2.5) + (0.38 * 10) + (0.25 * 22.5) + (0.18 * 40); // ~13.5 min
        const variation = (Math.random() - 0.5) * 2; // ±1 minute
        const totalMinutes = baseMinutes + variation;
        const minutes = Math.floor(totalMinutes);
        const seconds = Math.floor((totalMinutes - minutes) * 60);
        avgSessionEl.textContent = `${minutes}m ${seconds}s`;
    }
    
    // Peak Hours (alternates between lunch rush 11AM-2PM and after work 4PM-7PM)
    const peakHoursEl = document.getElementById('peakHoursDisplay');
    if (peakHoursEl) {
        // Randomly pick between two peak periods (weighted 60/40 for afternoon peak)
        const peakPeriods = [
            { text: '11AM-2PM', weight: 0.40 },  // Lunch rush
            { text: '4PM-7PM', weight: 0.60 }    // After work/school (more common)
        ];
        
        // Use Math.random() to select weighted
        const rand = Math.random();
        const selectedPeak = rand < 0.40 ? peakPeriods[0].text : peakPeriods[1].text;
        peakHoursEl.textContent = selectedPeak;
    }
}

// Update stat cards display
function updateStatCardsDisplay() {
    const data = loadMockDataFromStorage();
    
    // Update Total Users
    const totalUsersEl = document.getElementById('totalUsersNumber');
    if (totalUsersEl) {
        totalUsersEl.textContent = data.totalUsers.toLocaleString();
        // Initialize or update current value for counting
        if (!totalUsersEl._currentValue) totalUsersEl._currentValue = data.totalUsers;
    }
    
    // Update Verifications
    const verificationsEl = document.getElementById('verificationsNumber');
    if (verificationsEl) {
        verificationsEl.textContent = data.verifications.toLocaleString();
        if (!verificationsEl._currentValue) verificationsEl._currentValue = data.verifications;
    }
    
    // Update Total Revenue
    const revenueEl = document.getElementById('revenueNumber');
    if (revenueEl) {
        revenueEl.textContent = `₱${data.allTimeRevenue.toLocaleString()}`;
        if (!revenueEl._currentValue) revenueEl._currentValue = data.allTimeRevenue;
    }
    
    // Update Gigs Reported
    const gigsReportedEl = document.getElementById('gigsReportedNumber');
    if (gigsReportedEl) {
        gigsReportedEl.textContent = data.gigsReported.toLocaleString();
        if (!gigsReportedEl._currentValue) gigsReportedEl._currentValue = data.gigsReported;
    }
    
    // Update Android Users
    const androidEl = document.getElementById('androidDeviceCount');
    if (androidEl) {
        androidEl.textContent = data.androidUsers.toLocaleString();
        if (!androidEl._currentValue) androidEl._currentValue = data.androidUsers;
    }
    
    // Update iPhone Users
    const iphoneEl = document.getElementById('iphoneDeviceCount');
    if (iphoneEl) {
        iphoneEl.textContent = data.iphoneUsers.toLocaleString();
        if (!iphoneEl._currentValue) iphoneEl._currentValue = data.iphoneUsers;
    }
    
    // Update Total Gigs
    const totalGigsEl = document.getElementById('totalGigsPosted');
    if (totalGigsEl) {
        totalGigsEl.textContent = data.totalGigs.toLocaleString();
        if (!totalGigsEl._currentValue) totalGigsEl._currentValue = data.totalGigs;
    }
    
    // Update Total Applicants
    const totalApplicantsEl = document.getElementById('totalApplicants');
    if (totalApplicantsEl) {
        totalApplicantsEl.textContent = data.totalApplicants.toLocaleString();
        if (!totalApplicantsEl._currentValue) totalApplicantsEl._currentValue = data.totalApplicants;
    }
    
    // Update Avg Applicants per Gig
    const avgPerGigEl = document.getElementById('avgApplicantsPerGig');
    if (avgPerGigEl) {
        const avg = (data.totalApplicants / data.totalGigs).toFixed(1);
        avgPerGigEl.textContent = avg;
    }
    
    // Update User Activity metrics (Android/iPhone overview cards)
    const percentages = {
        mobilePercent: data.mobilePercent,
        androidPercent: data.androidPercent,
        repeatUserPercent: data.repeatUserPercent,
        bounceRate: data.bounceRate
    };
    const activityMetrics = calculateUserActivityMetrics(data.totalUsers, percentages);
    updateUserActivityOverviewCards(activityMetrics);
    
    // Update Storage Used
    const storageEl = document.getElementById('totalStorageUsed');
    if (storageEl) {
        storageEl.textContent = `${data.storageUsed.toFixed(1)} GB`;
    }
    
    // Update Storage Progress Bar
    const storageProgressEl = document.getElementById('storageProgressFill');
    if (storageProgressEl) {
        const percentage = (data.storageUsed / 500) * 100; // Out of 500 GB
        storageProgressEl.style.width = `${percentage}%`;
    }
    
    // Update Bandwidth MTD
    const bandwidthEl = document.getElementById('bandwidthUsageMTD');
    if (bandwidthEl) {
        bandwidthEl.textContent = `${data.bandwidthMTD.toFixed(1)} GB`;
    }
    
    // Update Firebase Cost MTD
    const firebaseCostEl = document.getElementById('firebaseCostMTD');
    if (firebaseCostEl) {
        firebaseCostEl.textContent = `$${data.firebaseCostMTD.toFixed(2)}`;
    }
    
    console.log('🔄 Stat cards updated:', data);
    
    // Start continuous counting animations for all cards
    startMainDashboardCounting();
}

// 🔥 FIREBASE TODO: Remove this function - Real-time updates will come from Firebase listeners
// Start continuous counting for main dashboard stat cards (SIMULATION ONLY)
// FIREBASE IMPLEMENTATION:
//   Set up onValue() listeners that automatically update cards when data changes
//   Remove all setInterval timers and counting animations
function startMainDashboardCounting() {
    const totalUsersEl = document.getElementById('totalUsersNumber');
    const verificationsEl = document.getElementById('verificationsNumber');
    const revenueEl = document.getElementById('revenueNumber');
    const gigsReportedEl = document.getElementById('gigsReportedNumber');
    const suspendedCountEl = document.getElementById('suspendedCount');
    
    // Clear any existing timers
    [totalUsersEl, verificationsEl, revenueEl, gigsReportedEl, suspendedCountEl].forEach(el => {
        if (el && el._dashboardTimer) {
            clearInterval(el._dashboardTimer);
            el._dashboardTimer = null;
        }
    });
    
    // Total Users: increment by random 1-25 every 1 second
    // Also updates User Activity metrics based on new total
    if (totalUsersEl) {
        let secondsCounter = 0;
        totalUsersEl._dashboardTimer = setInterval(() => {
            const randomIncrease = Math.floor(Math.random() * 25) + 1; // 1-25
            totalUsersEl._currentValue += randomIncrease;
            totalUsersEl.textContent = totalUsersEl._currentValue.toLocaleString();
            
            // Update User Activity metrics based on new Total Users
            const currentData = loadMockDataFromStorage();
            
            // Apply tiny drift to base percentages
            const percentages = {
                mobilePercent: currentData.mobilePercent,
                androidPercent: currentData.androidPercent,
                repeatUserPercent: currentData.repeatUserPercent,
                bounceRate: currentData.bounceRate
            };
            const driftedPercentages = applyPercentageDrift(percentages);
            
            // Calculate new metrics
            const metrics = calculateUserActivityMetrics(totalUsersEl._currentValue, driftedPercentages);
            
            // Update overview card displays
            updateUserActivityOverviewCards(metrics);
            
            // Save to localStorage every 5 seconds to prevent data loss on refresh
            secondsCounter++;
            if (secondsCounter >= 5) {
                secondsCounter = 0;
                currentData.totalUsers = totalUsersEl._currentValue;
                currentData.mobilePercent = driftedPercentages.mobilePercent;
                currentData.androidPercent = driftedPercentages.androidPercent;
                currentData.repeatUserPercent = driftedPercentages.repeatUserPercent;
                currentData.bounceRate = driftedPercentages.bounceRate;
                currentData.androidUsers = metrics.androidCount;
                currentData.iphoneUsers = metrics.iphoneCount;
                saveMockDataToStorage(currentData);
                
                console.log(`📊 User Activity %: Mobile ${metrics.mobilePercent}%, Android ${metrics.androidPercent}%, Repeat ${metrics.repeatPercent}%, Bounce ${metrics.bounceRate}%`);
            }
            
            console.log(`👥 Total Users +${randomIncrease} → ${totalUsersEl._currentValue.toLocaleString()} (Active: ${metrics.activeUsers.toLocaleString()})`);
        }, 1000); // Every 1 second
    }
    
    // Gigs Analytics: increment based on total users
    // Total Gigs = 68-75% of total users
    // Applications = 5-15x gigs (Average per Gig: 5-15)
    const totalGigsEl = document.getElementById('totalGigsPosted');
    const totalApplicantsEl = document.getElementById('totalApplicants');
    const avgPerGigEl = document.getElementById('avgApplicantsPerGig');
    
    if (totalGigsEl && totalApplicantsEl && totalUsersEl) {
        let gigsSecondsCounter = 0;
        
        // Combined timer for gigs and applications
        if (totalGigsEl._dashboardTimer) {
            clearInterval(totalGigsEl._dashboardTimer);
        }
        
        totalGigsEl._dashboardTimer = setInterval(() => {
            const currentTotalUsers = totalUsersEl._currentValue || 200;
            
            // Target gigs: 68-75% of total users (pick a stable percentage)
            const gigsPercentage = 0.68 + (Math.random() * 0.07); // 68-75%
            const targetGigs = Math.round(currentTotalUsers * gigsPercentage);
            
            // Gradually move towards target
            const currentGigs = totalGigsEl._currentValue || targetGigs;
            let newGigs;
            
            if (currentGigs < targetGigs) {
                // Increment by 1-5 if below target
                const increment = Math.floor(Math.random() * 5) + 1;
                newGigs = Math.min(targetGigs, currentGigs + increment);
            } else if (currentGigs > targetGigs) {
                // Stay at current level (don't decrease)
                newGigs = currentGigs;
            } else {
                // Occasionally add 1-2 new gigs
                const shouldAdd = Math.random() > 0.7; // 30% chance
                newGigs = shouldAdd ? currentGigs + Math.floor(Math.random() * 2) + 1 : currentGigs;
            }
            
            totalGigsEl._currentValue = newGigs;
            totalGigsEl.textContent = newGigs.toLocaleString();
            
            // Applications: avg per gig should be 5-15
            const avgPerGigTarget = 5 + (Math.random() * 10); // 5-15 average per gig
            const targetApplications = Math.round(newGigs * avgPerGigTarget);
            
            // Gradually move towards target
            const currentApplications = totalApplicantsEl._currentValue || targetApplications;
            let newApplications;
            
            if (currentApplications < targetApplications) {
                // Increment by 5-25 if below target (faster growth for higher averages)
                const increment = Math.floor(Math.random() * 21) + 5;
                newApplications = Math.min(targetApplications, currentApplications + increment);
            } else if (currentApplications > targetApplications) {
                // Stay at current level (never decrease)
                newApplications = currentApplications;
            } else {
                // Occasionally add 5-20 new applications
                const shouldAdd = Math.random() > 0.6; // 40% chance
                newApplications = shouldAdd ? currentApplications + Math.floor(Math.random() * 16) + 5 : currentApplications;
            }
            
            totalApplicantsEl._currentValue = newApplications;
            totalApplicantsEl.textContent = newApplications.toLocaleString();
            
            // Calculate current avg per gig (should fluctuate between 5-15)
            const avgPerGig = (newApplications / newGigs).toFixed(1);
            if (avgPerGigEl) {
                avgPerGigEl.textContent = avgPerGig;
            }
            
            // Save to localStorage every 5 seconds
            gigsSecondsCounter++;
            if (gigsSecondsCounter >= 5) {
                gigsSecondsCounter = 0;
                const currentData = loadMockDataFromStorage();
                currentData.totalGigs = newGigs;
                currentData.totalApplicants = newApplications;
                saveMockDataToStorage(currentData);
            }
            
            console.log(`💼 Gigs: ${newGigs.toLocaleString()} (${(newGigs/currentTotalUsers*100).toFixed(1)}% of users) | Apps: ${newApplications.toLocaleString()} | Avg: ${avgPerGig}`);
        }, 1000); // Every 1 second
    }
    
    // Storage Usage: calculate based on users, gigs, and verifications (updates every 10 seconds)
    const storageEl = document.getElementById('totalStorageUsed');
    const storageProgressEl = document.getElementById('storageProgressFill');
    
    if (storageEl && totalUsersEl && totalGigsEl) {
        let storageSecondsCounter = 0;
        
        if (storageEl._dashboardTimer) {
            clearInterval(storageEl._dashboardTimer);
        }
        
        storageEl._dashboardTimer = setInterval(() => {
            const currentUsers = totalUsersEl._currentValue || 100;
            const currentGigs = totalGigsEl._currentValue || 50;
            const currentVerifications = verificationsEl ? verificationsEl._currentValue || 10 : 10;
            
            // Calculate expected storage based on activity
            // Profile Photos: 100% of users (MANDATORY) @ 350 KB each
            const profileStorage = (currentUsers * 0.00035);
            
            // Gig Photos: Avg 1.5 photos per gig @ 500 KB each (will eventually surpass profile photos)
            const gigStorage = (currentGigs * 1.5 * 0.0005);
            
            // ID Verifications: 100% of verified @ 750 KB each
            const idStorage = (currentVerifications * 0.00075);
            
            // Other Files: ~5% of users @ 1 MB each
            const otherStorage = (currentUsers * 0.05 * 0.001);
            
            // Total calculated storage
            const calculatedStorage = profileStorage + gigStorage + idStorage + otherStorage;
            
            // Initialize or gradually move toward calculated value
            if (!storageEl._currentValue) {
                storageEl._currentValue = calculatedStorage;
            } else {
                // Smoothly adjust toward calculated value
                const difference = calculatedStorage - storageEl._currentValue;
                if (Math.abs(difference) > 0.001) {
                    storageEl._currentValue += difference * 0.3; // 30% adjustment per update
                }
            }
            
            // Update display
            storageEl.textContent = `${storageEl._currentValue.toFixed(1)} GB`;
            
            // Update progress bar (500 GB limit)
            if (storageProgressEl) {
                const percentage = (storageEl._currentValue / 500) * 100;
                storageProgressEl.style.width = `${percentage}%`;
            }
            
            // Save to localStorage every 10 updates (every 10 seconds)
            storageSecondsCounter++;
            if (storageSecondsCounter >= 1) { // Update every cycle (10s)
                storageSecondsCounter = 0;
                const currentData = loadMockDataFromStorage();
                currentData.storageUsed = storageEl._currentValue;
                saveMockDataToStorage(currentData);
            }
            
            const gigPercentage = ((gigStorage / calculatedStorage) * 100).toFixed(0);
            console.log(`💾 Storage: ${storageEl._currentValue.toFixed(2)} GB | Gig Photos: ${gigPercentage}% (${(currentGigs * 1.5).toFixed(0)} files)`);
        }, 10000); // Every 10 seconds (slower growth)
    }
    
    // Traffic & Costs: calculate based on users and activity (updates every 10 seconds)
    const bandwidthEl = document.getElementById('bandwidthUsageMTD');
    const firebaseCostEl = document.getElementById('firebaseCostMTD');
    
    if (bandwidthEl && firebaseCostEl && totalUsersEl) {
        let trafficSecondsCounter = 0;
        
        if (bandwidthEl._dashboardTimer) {
            clearInterval(bandwidthEl._dashboardTimer);
        }
        
        bandwidthEl._dashboardTimer = setInterval(() => {
            const currentUsers = totalUsersEl._currentValue || 100;
            const currentStorage = storageEl ? storageEl._currentValue || 0.5 : 0.5;
            
            // Calculate MTD bandwidth (7 days of simulation)
            const daysInSimulation = 7; // Jan 1 - Jan 8
            const daysInMonth = 30;
            
            // Active users: 20% of total
            const activeUsers = Math.round(currentUsers * 0.20);
            // Average 32 MB per active user + 10% of storage for uploads
            const monthlyBandwidth = (activeUsers * 0.032) + (currentStorage * 0.1);
            const mtdBandwidth = (monthlyBandwidth / daysInMonth) * daysInSimulation; // 7 days worth
            
            // Calculate MTD reads and writes (prorated to 7 days)
            const monthlyReads = Math.round(activeUsers * 11250);
            const monthlyWrites = Math.round((activeUsers * 13) + (currentUsers * 0.10 * 8));
            const mtdReads = Math.round((monthlyReads / daysInMonth) * daysInSimulation);
            const mtdWrites = Math.round((monthlyWrites / daysInMonth) * daysInSimulation);
            
            // Calculate Firebase costs (prorated to 7 days for MTD)
            const dbCost = ((mtdReads / 100000) * 0.036) + ((mtdWrites / 100000) * 0.108);
            const storageCost = currentStorage * 0.026 * (daysInSimulation / daysInMonth);
            const bandwidthCost = mtdBandwidth * 0.12;
            const authCost = activeUsers * 0.0055 * (daysInSimulation / daysInMonth);
            const totalCost = dbCost + storageCost + bandwidthCost + authCost;
            
            // Update displays
            bandwidthEl.textContent = `${mtdBandwidth.toFixed(1)} GB`;
            firebaseCostEl.textContent = `$${totalCost.toFixed(2)}`;
            
            // Save to localStorage every update (10s)
            trafficSecondsCounter++;
            if (trafficSecondsCounter >= 1) {
                trafficSecondsCounter = 0;
                const currentData = loadMockDataFromStorage();
                currentData.bandwidthMTD = mtdBandwidth;
                currentData.firebaseCostMTD = totalCost;
                saveMockDataToStorage(currentData);
            }
            
            console.log(`📡 Traffic MTD: ${mtdBandwidth.toFixed(2)} GB | Firebase: $${totalCost.toFixed(2)} (${activeUsers} active users)`);
        }, 10000); // Every 10 seconds
    }
    
    // Verifications: increment by random 5-20 every 1 second
    if (verificationsEl) {
        let secondsCounter = 0;
        verificationsEl._dashboardTimer = setInterval(() => {
            const randomIncrease = Math.floor(Math.random() * 16) + 5; // 5-20
            verificationsEl._currentValue += randomIncrease;
            verificationsEl.textContent = verificationsEl._currentValue.toLocaleString();
            
            // Save to localStorage every 5 seconds to prevent data loss on refresh
            secondsCounter++;
            if (secondsCounter >= 5) {
                secondsCounter = 0;
                const currentData = loadMockDataFromStorage();
                currentData.verifications = verificationsEl._currentValue;
                saveMockDataToStorage(currentData);
            }
            
            console.log(`✓ Verifications increased by ${randomIncrease} to:`, verificationsEl._currentValue);
        }, 1000); // Every 1 second
    }
    
    // Total Revenue: add random ₱100/₱250/₱500 every 1 second
    // 🔥 FIREBASE TODO: Replace with real-time listener on revenue transactions
    // (This will be controlled by overlay when revenue overlay is open)
    if (revenueEl) {
        let secondsCounter = 0;
        revenueEl._dashboardTimer = setInterval(() => {
            // Only update if revenue overlay is NOT open
            const revenueOverlay = document.getElementById('revenueOverlay');
            const isOverlayOpen = revenueOverlay && revenueOverlay.style.display === 'flex';
            
            if (!isOverlayOpen) {
                const increments = [100, 250, 500];
                const randomIncrement = increments[Math.floor(Math.random() * increments.length)];
                revenueEl._currentValue += randomIncrement;
                revenueEl.textContent = `₱${revenueEl._currentValue.toLocaleString()}`;
                
                // Add to revenue history for period calculations
                addRevenueToHistory(randomIncrement);
                
                // Save to localStorage every 5 seconds to prevent data loss on refresh
                secondsCounter++;
                if (secondsCounter >= 5) {
                    secondsCounter = 0;
                    const currentData = loadMockDataFromStorage();
                    currentData.allTimeRevenue = revenueEl._currentValue;
                    saveMockDataToStorage(currentData);
                }
                
                console.log(`💰 Revenue +₱${randomIncrement} to: ₱${revenueEl._currentValue.toLocaleString()}`);
            }
        }, 1000); // Every 1 second = 1 simulated hour
    }
    
    // Gigs Reported: FLUCTUATE every 10 seconds (max 100)
    if (gigsReportedEl) {
        if (!gigsReportedEl._maxValue) gigsReportedEl._maxValue = 100;
        
        gigsReportedEl._dashboardTimer = setInterval(() => {
            const maxValue = gigsReportedEl._maxValue || 100;
            const currentValue = gigsReportedEl._currentValue || 0;
            
            // Random fluctuation: add 1-10 or subtract 1-10
            const change = Math.floor(Math.random() * 10) + 1; // 1-10
            const shouldIncrease = Math.random() > 0.5;
            
            let newValue;
            if (shouldIncrease) {
                newValue = Math.min(maxValue, currentValue + change);
            } else {
                newValue = Math.max(5, currentValue - change); // Min 5
            }
            
            gigsReportedEl._currentValue = newValue;
            gigsReportedEl.textContent = newValue.toLocaleString();
            
            const direction = shouldIncrease ? '📈' : '📉';
            console.log(`${direction} Gigs Reported ${shouldIncrease ? '+' : '-'}${change}:`, newValue);
        }, 10000); // Every 10 seconds
    }
    
    // Suspended Gigs Tab Count: SLOW FLUCTUATION every 30 seconds (max 50)
    if (suspendedCountEl) {
        // Initialize current value from displayed count
        if (!suspendedCountEl._currentValue) {
            suspendedCountEl._currentValue = parseInt(suspendedCountEl.textContent) || 2;
        }
        if (!suspendedCountEl._maxValue) suspendedCountEl._maxValue = 50;
        
        suspendedCountEl._dashboardTimer = setInterval(() => {
            const maxValue = suspendedCountEl._maxValue || 50;
            const currentValue = suspendedCountEl._currentValue || 0;
            
            // SLOWER fluctuation: add 1-3 or subtract 1-3
            const change = Math.floor(Math.random() * 3) + 1; // 1-3
            const shouldIncrease = Math.random() > 0.5;
            
            let newValue;
            if (shouldIncrease) {
                newValue = Math.min(maxValue, currentValue + change);
            } else {
                newValue = Math.max(0, currentValue - change); // Min 0
            }
            
            suspendedCountEl._currentValue = newValue;
            suspendedCountEl.textContent = newValue.toLocaleString();
            
            const direction = shouldIncrease ? '📈' : '📉';
            console.log(`${direction} Suspended Gigs ${shouldIncrease ? '+' : '-'}${change}:`, newValue);
        }, 30000); // Every 30 seconds (much slower)
    }
    
    console.log('🎬 Main dashboard counting animations started');
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
        if (e.key === 'Escape') {
            const activeOverlay = document.querySelector('.stat-overlay.active');
            if (activeOverlay) {
                closeStatOverlay(activeOverlay.id);
            }
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
        
        // Pause main dashboard counting for this overlay type
        if (type === 'revenue') {
            const revenueCard = document.getElementById('revenueNumber');
            if (revenueCard && revenueCard._dashboardTimer) {
                clearInterval(revenueCard._dashboardTimer);
                revenueCard._dashboardTimer = null;
            }
        } else if (type === 'verifications') {
            const verificationsCard = document.getElementById('verificationsNumber');
            if (verificationsCard && verificationsCard._dashboardTimer) {
                clearInterval(verificationsCard._dashboardTimer);
                verificationsCard._dashboardTimer = null;
            }
        } else if (type === 'totalUsers') {
            const usersCard = document.getElementById('usersNumber');
            if (usersCard && usersCard._dashboardTimer) {
                clearInterval(usersCard._dashboardTimer);
                usersCard._dashboardTimer = null;
            }
        } else if (type === 'userActivity') {
            // Start real-time updates for User Activity overlay
            if (overlay._overlayTimer) {
                clearInterval(overlay._overlayTimer);
            }
            
            overlay._overlayTimer = setInterval(() => {
                const data = loadMockDataFromStorage();
                populateUserActivityData(data);
            }, 1000); // Update every second to sync with overview card
        } else if (type === 'gigsAnalytics') {
            // Start real-time updates for Gigs Analytics overlay
            if (overlay._overlayTimer) {
                clearInterval(overlay._overlayTimer);
            }
            
            overlay._overlayTimer = setInterval(() => {
                const data = loadMockDataFromStorage();
                populateGigsAnalyticsData(data);
            }, 1000); // Update every second to sync with overview card
        } else if (type === 'storageUsage') {
            // Start real-time updates for Storage Usage overlay
            if (overlay._overlayTimer) {
                clearInterval(overlay._overlayTimer);
            }
            
            overlay._overlayTimer = setInterval(() => {
                const data = loadMockDataFromStorage();
                populateStorageUsageData(data);
            }, 3000); // Update every 3 seconds for responsive overlay
        } else if (type === 'trafficCosts') {
            // Start real-time updates for Traffic & Costs overlay
            if (overlay._overlayTimer) {
                clearInterval(overlay._overlayTimer);
            }
            
            overlay._overlayTimer = setInterval(() => {
                const data = loadMockDataFromStorage();
                populateTrafficCostsData(data);
            }, 5000); // Update every 5 seconds (balance between responsiveness and performance)
        }
        
        // Populate overlay data
        populateOverlayData(type);
        
        console.log(`📊 Opened ${type} overlay`);
    }
}

// Close stat overlay
function closeStatOverlay(overlayId) {
    const overlay = document.getElementById(overlayId);
    
    if (overlay) {
        // Stop any counting animations for overlay elements
        const countingElements = overlay.querySelectorAll('.counting');
        countingElements.forEach(element => {
            stopCountingAnimation(element);
        });
        
        // Clear overlay-specific timers
        if (overlay._overlayTimer) {
            clearInterval(overlay._overlayTimer);
            overlay._overlayTimer = null;
        }
        
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scroll
        
        // Restart main dashboard counting after overlay closes
        startMainDashboardCounting();
        
        console.log(`✖️ Closed ${overlayId}`);
    }
}

// Populate overlay with data
function populateOverlayData(type) {
    const data = loadMockDataFromStorage();
    
    switch(type) {
        case 'totalUsers':
            populateTotalUsersData(data);
            break;
        case 'verifications':
            populateVerificationsData(data);
            break;
        case 'revenue':
            populateRevenueData(data);
            break;
        case 'gigsReported':
            populateGigsReportedData(data);
            break;
        case 'userActivity':
            populateUserActivityData(data);
            break;
        case 'gigsAnalytics':
            populateGigsAnalyticsData(data);
            break;
        case 'storageUsage':
            populateStorageUsageData(data);
            break;
        case 'trafficCosts':
            populateTrafficCostsData(data);
            break;
    }
}

// Populate Total Users overlay data
function populateTotalUsersData(data) {
    // Get the current real-time value from main dashboard card
    const mainUsersCard = document.getElementById('usersNumber');
    const mainUsersValue = mainUsersCard && mainUsersCard._currentValue ? Math.round(mainUsersCard._currentValue) : data.totalUsers;
    
    let total = mainUsersValue;
    
    // Apply date range filter (mock simulation)
    const dateRangeSelect = document.getElementById('usersDateRange');
    if (dateRangeSelect) {
        const dateRange = dateRangeSelect.value;
        
        // Simulate filtering by reducing totals
        if (dateRange === '1') {
            total = Math.round(total * 0.05); // 5% for last 1 day
        } else if (dateRange === '7') {
            total = Math.round(total * 0.15); // 15% for last 7 days
        } else if (dateRange === '30') {
            total = Math.round(total * 0.50); // 50% for last 30 days
        }
        // 'all' keeps 100% of total
    }
    
    // Update main displays with counting animation
    const totalDisplay = document.getElementById('usersTotalDisplay');
    const newDisplay = document.getElementById('usersNewDisplay');
    const verifiedDisplay = document.getElementById('usersVerifiedDisplay');
    const growthDisplay = document.getElementById('usersGrowthDisplay');
    
    // Get current values (for smooth transition on filter change)
    const currentTotal = totalDisplay && totalDisplay._unroundedValue ? totalDisplay._unroundedValue : (totalDisplay && totalDisplay._currentValue ? totalDisplay._currentValue : 0);
    const currentNew = newDisplay && newDisplay._unroundedValue ? newDisplay._unroundedValue : (newDisplay && newDisplay._currentValue ? newDisplay._currentValue : 0);
    const currentVerified = verifiedDisplay && verifiedDisplay._unroundedValue ? verifiedDisplay._unroundedValue : (verifiedDisplay && verifiedDisplay._currentValue ? verifiedDisplay._currentValue : 0);
    const currentGrowth = growthDisplay && growthDisplay._unroundedValue ? growthDisplay._unroundedValue : (growthDisplay && growthDisplay._currentValue ? growthDisplay._currentValue : 0);
    
    // Store the exact total value to ensure consistency across all displays
    const exactTotal = Math.round(total);
    
    // Calculate new members (unverified) and verified members
    // ID Verified users = 65% of total, New Members (unverified) = 35% of total
    const verifiedMemberCount = Math.round(exactTotal * 0.65); // 65% are verified
    const newMemberCount = exactTotal - verifiedMemberCount; // Remaining 35% are unverified new members
    
    // Start counting animations (ultra fast: 150ms)
    
    if (totalDisplay) {
        totalDisplay.setAttribute('data-target', exactTotal);
        startCountingAnimation(totalDisplay, currentTotal, exactTotal, '', 150, 0);
    }
    
    if (newDisplay) {
        newDisplay.setAttribute('data-target', newMemberCount);
        startCountingAnimation(newDisplay, currentNew, newMemberCount, '', 150, 0);
    }
    
    if (verifiedDisplay) {
        verifiedDisplay.setAttribute('data-target', verifiedMemberCount);
        startCountingAnimation(verifiedDisplay, currentVerified, verifiedMemberCount, '', 150, 0);
    }
    
    // Calculate growth rate based on simulation timeline
    // 🔥 FIREBASE TODO: Fetch from /analytics/users/growthRate
    // We're 7 days into simulation with exponential growth
    // Daily growth rate: users increase by ~20-100 per second
    // At ~200 users start, growing to potentially 1000+ in 7 days = ~400% weekly growth
    // Daily: ~28% average, Weekly: ~200-400%
    const dailyGrowthRate = 25 + (Math.random() * 8); // 25-33% daily growth
    const growthRate = dailyGrowthRate.toFixed(1);
    if (growthDisplay) {
        growthDisplay.setAttribute('data-target', growthRate);
        startCountingAnimation(growthDisplay, currentGrowth, parseFloat(growthRate), '+', 150, 1, '%');
        growthDisplay.className = 'revenue-amount growth-positive counting';
    }
    
    // Age distribution with realistic weights
    // 🔥 FIREBASE TODO: Fetch from /analytics/users/ageGroups/{18-25, 26-40, 41-59, 60+}
    // 26-40 is overwhelming majority (62%), 60+ is minority (6%)
    const ageWeights = [0.20, 0.62, 0.12, 0.06]; // 18-25: 20%, 26-40: 62%, 41-59: 12%, 60+: 6%
    const ageDistribution = generateWeightedDistribution(ageWeights, exactTotal);
    
    // Get age elements and their current values
    const age18_25El = document.getElementById('age18_25Value');
    const age26_40El = document.getElementById('age26_40Value');
    const age41_59El = document.getElementById('age41_59Value');
    const age60PlusEl = document.getElementById('age60PlusValue');
    
    // Update with counting animations
    if (age18_25El) {
        const current = age18_25El._currentValue || 0;
        startCountingAnimation(age18_25El, current, ageDistribution[0], '', 150, 0);
    }
    if (age26_40El) {
        const current = age26_40El._currentValue || 0;
        startCountingAnimation(age26_40El, current, ageDistribution[1], '', 150, 0);
    }
    if (age41_59El) {
        const current = age41_59El._currentValue || 0;
        startCountingAnimation(age41_59El, current, ageDistribution[2], '', 150, 0);
    }
    if (age60PlusEl) {
        const current = age60PlusEl._currentValue || 0;
        startCountingAnimation(age60PlusEl, current, ageDistribution[3], '', 150, 0);
    }
    
    // Regional distribution with Visayas as majority
    // Visayas: 52%, Luzon: 30%, Mindanao: 18%
    const regionWeights = [0.30, 0.52, 0.18]; // Luzon, Visayas, Mindanao
    const regionDistribution = generateWeightedDistribution(regionWeights, exactTotal);
    
    // Update pie chart with more contrasting colors
    updatePieChart('regionPieChart', [
        { value: regionDistribution[0], color: '#ff6b6b' },  // Red for Luzon
        { value: regionDistribution[1], color: '#4ecdc4' },  // Cyan for Visayas
        { value: regionDistribution[2], color: '#ffd93d' }   // Yellow for Mindanao
    ]);
    
    // Update pie chart center total with counting animation - use exactTotal for consistency
    const regionPieTotal = document.getElementById('regionPieTotal');
    if (regionPieTotal) {
        const currentRegionTotal = regionPieTotal._currentValue || 0;
        startCountingAnimation(regionPieTotal, currentRegionTotal, exactTotal, '', 150, 0);
    }
    
    // Update regional legend values with counting animations
    const luzonLegend = document.getElementById('luzonLegend');
    const visayasLegend = document.getElementById('visayasLegend');
    const mindanaoLegend = document.getElementById('mindanaoLegend');
    
    if (luzonLegend) {
        const currentLuzon = luzonLegend._currentValue || 0;
        startCountingAnimation(luzonLegend, currentLuzon, regionDistribution[0], '', 150, 0);
    }
    if (visayasLegend) {
        const currentVisayas = visayasLegend._currentValue || 0;
        startCountingAnimation(visayasLegend, currentVisayas, regionDistribution[1], '', 150, 0);
    }
    if (mindanaoLegend) {
        const currentMindanao = mindanaoLegend._currentValue || 0;
        startCountingAnimation(mindanaoLegend, currentMindanao, regionDistribution[2], '', 150, 0);
    }
    
    // Account types - Realistic distribution
    // Use the same newMemberCount and verifiedMemberCount calculated above for consistency
    // Pro + Business = verifiedMemberCount (which is 65% of total users)
    const proPercentOfVerified = 0.70 + (Math.random() * 0.10); // 70-80% of verified are Pro
    const proVerifiedCount = Math.round(verifiedMemberCount * proPercentOfVerified);
    const businessVerifiedCount = verifiedMemberCount - proVerifiedCount; // Remaining verified are Business
    
    // Verify totals add up
    const accountTypesTotal = newMemberCount + proVerifiedCount + businessVerifiedCount;
    console.log(`👥 Account Types: ${newMemberCount} (New 35%) + ${verifiedMemberCount} (Verified 65%) = ${accountTypesTotal} (should be ${exactTotal})`)
    
    // Update donut chart with more contrasting colors
    updatePieChart('accountTypePieChart', [
        { value: newMemberCount, color: '#6c5ce7' },  // Purple for New Members
        { value: proVerifiedCount, color: '#00b894' },  // Green for Pro
        { value: businessVerifiedCount, color: '#ff6b6b' }  // Red for Business
    ]);
    
    // Update donut chart center total with counting animation - should equal exactTotal
    const accountPieTotal = document.getElementById('accountTypePieTotal');
    if (accountPieTotal) {
        const currentAccountTotal = accountPieTotal._currentValue || 0;
        startCountingAnimation(accountPieTotal, currentAccountTotal, exactTotal, '', 150, 0);
        
        // Store percentage ratios for dynamic updates
        accountPieTotal._verifiedPercent = 0.65; // 65% are verified
        accountPieTotal._proPercentOfVerified = proPercentOfVerified;
    }
    
    // Update account type legend values with counting animations
    const newMemberLegend = document.getElementById('newMemberLegend');
    const proVerifiedLegend = document.getElementById('proVerifiedLegend');
    const businessVerifiedLegend = document.getElementById('businessVerifiedLegend');
    
    if (newMemberLegend) {
        const currentNewMember = newMemberLegend._currentValue || 0;
        startCountingAnimation(newMemberLegend, currentNewMember, newMemberCount, '', 150, 0);
        
        // Mark this element to be updated by accountPieTotal
        newMemberLegend._syncWithPieChart = true;
    }
    if (proVerifiedLegend) {
        const currentProVerified = proVerifiedLegend._currentValue || 0;
        startCountingAnimation(proVerifiedLegend, currentProVerified, proVerifiedCount, '', 150, 0);
        
        // Mark this element to be updated by accountPieTotal
        proVerifiedLegend._syncWithPieChart = true;
    }
    if (businessVerifiedLegend) {
        const currentBusinessVerified = businessVerifiedLegend._currentValue || 0;
        startCountingAnimation(businessVerifiedLegend, currentBusinessVerified, businessVerifiedCount, '', 150, 0);
        
        // Mark this element to be updated by accountPieTotal
        businessVerifiedLegend._syncWithPieChart = true;
    }
}

// Populate Verifications overlay data
function populateVerificationsData(data) {
    // Get the current value from main dashboard card (real-time value)
    const mainVerificationsCard = document.getElementById('verificationsNumber');
    const mainVerificationsValue = mainVerificationsCard && mainVerificationsCard._currentValue ? mainVerificationsCard._currentValue : data.verifications;
    
    let total = mainVerificationsValue;
    
    // Apply date range filter (mock simulation)
    const dateRangeSelect = document.getElementById('verificationsDateRange');
    if (dateRangeSelect) {
        const dateRange = dateRangeSelect.value;
        
        // Simulate filtering by reducing totals
        if (dateRange === '1') {
            total = Math.round(total * 0.08); // 8% for last 1 day
        } else if (dateRange === '7') {
            total = Math.round(total * 0.20); // 20% for last 7 days
        } else if (dateRange === '30') {
            total = Math.round(total * 0.60); // 60% for last 30 days
        }
        // 'all' keeps 100% of total
        
        // Ensure at least 1 verification
        total = Math.max(1, total);
    }
    
    // Update main displays with counting animation
    const totalDisplay = document.getElementById('verificationsTotalDisplay');
    const proDisplay = document.getElementById('verificationsProDisplay');
    const businessDisplay = document.getElementById('verificationsBusinessDisplay');
    const overdueDisplay = document.getElementById('verificationsOverdueDisplay');
    
    // Get current values (for smooth transition on filter change)
    const currentTotal = totalDisplay && totalDisplay._currentValue ? totalDisplay._currentValue : 0;
    const currentPro = proDisplay && proDisplay._currentValue ? proDisplay._currentValue : 0;
    const currentBusiness = businessDisplay && businessDisplay._currentValue ? businessDisplay._currentValue : 0;
    const currentOverdue = overdueDisplay && overdueDisplay._currentValue ? overdueDisplay._currentValue : 0;
    
    // Calculate verification types (Pro vs Business)
    const proVerifications = Math.floor(total * (0.6 + Math.random() * 0.2)); // 60-80%
    const businessVerifications = total - proVerifications;
    
    // Calculate overdue (over 1 week)
    const over1Week = Math.floor(total * (Math.random() * 0.3)); // 0-30% overdue
    
    // Start counting animations (ultra fast: 150ms)
    if (totalDisplay) {
        totalDisplay.setAttribute('data-target', total);
        startCountingAnimation(totalDisplay, currentTotal, total, '', 150, 0);
    }
    
    if (proDisplay) {
        proDisplay.setAttribute('data-target', proVerifications);
        startCountingAnimation(proDisplay, currentPro, proVerifications, '', 150, 0);
    }
    
    if (businessDisplay) {
        businessDisplay.setAttribute('data-target', businessVerifications);
        startCountingAnimation(businessDisplay, currentBusiness, businessVerifications, '', 150, 0);
    }
    
    if (overdueDisplay) {
        overdueDisplay.setAttribute('data-target', over1Week);
        // Initialize max value if not set
        if (!overdueDisplay._maxValue) overdueDisplay._maxValue = 20;
        startCountingAnimation(overdueDisplay, currentOverdue, over1Week, '', 150, 0);
    }
    
    // Verification age breakdown
    // 🔥 FIREBASE TODO: Fetch from /analytics/verifications/age/{under1Week, 1to2Weeks, over2Weeks}
    const under1Week = total - over1Week;
    const between1_2Weeks = Math.floor(over1Week * 0.6);
    const over2Weeks = over1Week - between1_2Weeks;
    
    // Update age breakdown cards with counting animations
    const under1WeekEl = document.getElementById('verificationUnder1WeekValue');
    const between1_2WeeksEl = document.getElementById('verification1_2WeeksValue');
    const over2WeeksEl = document.getElementById('verificationOver2WeeksValue');
    
    if (under1WeekEl) {
        const current = under1WeekEl._currentValue || 0;
        startCountingAnimation(under1WeekEl, current, under1Week, '', 150, 0);
    }
    if (between1_2WeeksEl) {
        const current = between1_2WeeksEl._currentValue || 0;
        startCountingAnimation(between1_2WeeksEl, current, between1_2Weeks, '', 150, 0);
    }
    if (over2WeeksEl) {
        const current = over2WeeksEl._currentValue || 0;
        startCountingAnimation(over2WeeksEl, current, over2Weeks, '', 150, 0);
    }
    
    // Verification types breakdowns
    // 🔥 FIREBASE TODO: Fetch from /analytics/verifications/submissions filtered by type
    const proVerificationEl = document.getElementById('proVerificationValue');
    const businessVerificationEl = document.getElementById('businessVerificationValue');
    
    if (proVerificationEl) {
        const current = proVerificationEl._currentValue || 0;
        startCountingAnimation(proVerificationEl, current, proVerifications, '', 150, 0);
    }
    if (businessVerificationEl) {
        const current = businessVerificationEl._currentValue || 0;
        startCountingAnimation(businessVerificationEl, current, businessVerifications, '', 150, 0);
    }
}

// Populate Revenue overlay data
function populateRevenueData(data) {
    // 🔥 FIREBASE TODO: Fetch revenue data from /analytics/revenue/[period]
    
    // Get the main dashboard's live All Time revenue
    const mainRevenueCard = document.getElementById('revenueNumber');
    const allTimeRevenue = mainRevenueCard && mainRevenueCard._currentValue ? mainRevenueCard._currentValue : data.allTimeRevenue;
    
    // Apply date range filter using time-based history
    const dateRangeSelect = document.getElementById('revenueDateRange');
    let revenuePHP = allTimeRevenue; // Default to All Time
    let daysInPeriod = 7; // Default (simulation starts at 7 days)
    
    if (dateRangeSelect) {
        const dateRange = dateRangeSelect.value;
        
        // Calculate revenue based on actual history
        if (dateRange === 'all') {
            // All Time = use the live dashboard value
            revenuePHP = allTimeRevenue;
            const simData = getSimulatedDate();
            daysInPeriod = simData.totalElapsedDays;
        } else {
            // Calculate from history for specific periods
            revenuePHP = getRevenueForPeriod(dateRange);
            
            // Set daysInPeriod for transaction calculations
            if (dateRange === '1') {
                daysInPeriod = 1;
            } else if (dateRange === '7') {
                daysInPeriod = 7;
            } else if (dateRange === '30') {
                daysInPeriod = 30;
            } else if (dateRange === 'current') {
                const elapsed = getElapsedRealSeconds();
                const secondsIntoMonth = elapsed % 720;
                daysInPeriod = Math.floor(secondsIntoMonth / 24) || 1; // Convert seconds to days
            } else if (dateRange === 'last') {
                daysInPeriod = 30;
            } else if (dateRange === 'quarter') {
                const elapsed = getElapsedRealSeconds();
                const secondsIntoQuarter = elapsed % 2160;
                daysInPeriod = Math.floor(secondsIntoQuarter / 24) || 1;
            } else if (dateRange === 'ytd') {
                const elapsed = getElapsedRealSeconds();
                const secondsIntoYear = elapsed % 8640;
                daysInPeriod = Math.floor(secondsIntoYear / 24) || 1;
            }
        }
    }
    
    const exchangeRate = 57; // ₱57 = $1 USD (mock rate)
    const revenueUSD = (revenuePHP / exchangeRate).toFixed(2);
    
    // Update main displays with counting animation
    const phpDisplay = document.getElementById('revenuePHPDisplay');
    const usdDisplay = document.getElementById('revenueUSDDisplay');
    const growthDisplay = document.getElementById('revenueGrowthDisplay');
    
    // Get current values (for smooth transition on filter change)
    // Use unrounded value if available for more accurate transitions
    
    // For smooth transition: if overlay was already opened, use current value; otherwise start from 0
    const currentPHP = phpDisplay && phpDisplay._hasBeenAnimated && phpDisplay._unroundedValue ? phpDisplay._unroundedValue : 0;
    const currentUSD = usdDisplay && usdDisplay._hasBeenAnimated && usdDisplay._unroundedValue ? usdDisplay._unroundedValue : 0;
    const currentGrowth = growthDisplay && growthDisplay._hasBeenAnimated && growthDisplay._unroundedValue ? growthDisplay._unroundedValue : 0;
    
    // Store target values and animate (ultra fast: 150ms)
    if (phpDisplay) {
        phpDisplay.setAttribute('data-target', revenuePHP);
        phpDisplay._hasBeenAnimated = true; // Mark as animated for future filter changes
        startCountingAnimation(phpDisplay, currentPHP, revenuePHP, '₱', 150);
    }
    
    if (usdDisplay) {
        const usdValue = parseFloat(revenueUSD);
        usdDisplay.setAttribute('data-target', usdValue);
        usdDisplay._hasBeenAnimated = true; // Mark as animated for future filter changes
        startCountingAnimation(usdDisplay, currentUSD, usdValue, '$', 150, 2);
    }
    
    // Growth rate with animation
    const growthRate = ((Math.random() * 10) + 5).toFixed(1);
    if (growthDisplay) {
        growthDisplay.setAttribute('data-target', growthRate);
        growthDisplay._hasBeenAnimated = true; // Mark as animated for future filter changes
        startCountingAnimation(growthDisplay, currentGrowth, parseFloat(growthRate), '+', 150, 1, '%');
        growthDisplay.className = 'revenue-amount growth-positive counting';
    }
    
    // Revenue sources breakdown
    // 🔥 FIREBASE TODO: Fetch from /analytics/revenue/sources/{gCoinsPurchases, proSubscriptions, businessSubscriptions, fundsAdded}
    // G-Coins Purchases equals the total PHP revenue
    const gCoinsPurchases = revenuePHP;
    
    // Pro, Business, and Funds Added fees are breakdowns of G-Coins Purchases (they sum to the total)
    const proFees = Math.floor(gCoinsPurchases * (0.30 + Math.random() * 0.15)); // 30-45%
    const businessFees = Math.floor(gCoinsPurchases * (0.15 + Math.random() * 0.10)); // 15-25%
    const fundsAdded = gCoinsPurchases - proFees - businessFees; // Remaining amount
    
    // Update revenue source cards with counting animations
    const gCoinsEl = document.getElementById('gCoinsPurchasesValue');
    const proFeesEl = document.getElementById('proFeesValue');
    const businessFeesEl = document.getElementById('businessFeesValue');
    const fundsAddedEl = document.getElementById('fundsAddedValue');
    
    if (gCoinsEl) {
        const current = gCoinsEl._currentValue || 0;
        startCountingAnimation(gCoinsEl, current, gCoinsPurchases, '₱', 150, 0);
    }
    if (proFeesEl) {
        const current = proFeesEl._currentValue || 0;
        startCountingAnimation(proFeesEl, current, proFees, '₱', 150, 0);
    }
    if (businessFeesEl) {
        const current = businessFeesEl._currentValue || 0;
        startCountingAnimation(businessFeesEl, current, businessFees, '₱', 150, 0);
    }
    if (fundsAddedEl) {
        const current = fundsAddedEl._currentValue || 0;
        startCountingAnimation(fundsAddedEl, current, fundsAdded, '₱', 150, 0);
    }
    
    // Transaction statistics
    // 🔥 FIREBASE TODO: Fetch aggregated data from /analytics/revenue/transactions
    // Total Transactions = G-Coins Purchases divided by random purchase amounts (100, 250, or 500)
    const purchaseAmounts = [100, 250, 500];
    const avgPurchaseAmount = purchaseAmounts[Math.floor(Math.random() * purchaseAmounts.length)];
    const totalTransactions = Math.floor(gCoinsPurchases / avgPurchaseAmount);
    
    // Average Transaction: 100-500 for 1 day, scaled by number of days
    const avgTransaction = Math.floor((100 + Math.random() * 400) * daysInPeriod);
    
    // Highest Transaction: 500-1500 for 1 day, scaled by number of days
    const highestTransaction = Math.floor((500 + Math.random() * 1000) * daysInPeriod);
    
    // Update transaction stat cards with counting animations
    const totalTransEl = document.getElementById('totalTransactionsValue');
    const avgTransEl = document.getElementById('avgTransactionValue');
    const highestTransEl = document.getElementById('highestTransactionValue');
    
    if (totalTransEl) {
        const current = totalTransEl._currentValue || 0;
        startCountingAnimation(totalTransEl, current, totalTransactions, '', 150, 0);
    }
    if (avgTransEl) {
        const current = avgTransEl._currentValue || 0;
        startCountingAnimation(avgTransEl, current, avgTransaction, '₱', 150, 0);
    }
    if (highestTransEl) {
        const current = highestTransEl._currentValue || 0;
        startCountingAnimation(highestTransEl, current, highestTransaction, '₱', 150, 0);
    }
}

// Populate Gigs Reported overlay data
function populateGigsReportedData(data) {
    let total = data.gigsReported;
    
    // Apply date range filter (mock simulation)
    const dateRangeSelect = document.getElementById('gigsReportedDateRange');
    if (dateRangeSelect) {
        const dateRange = dateRangeSelect.value;
        
        // Simulate filtering by reducing totals
        if (dateRange === '1') {
            total = Math.round(total * 0.10); // 10% for last 1 day
        } else if (dateRange === '7') {
            total = Math.round(total * 0.25); // 25% for last 7 days
        } else if (dateRange === '30') {
            total = Math.round(total * 0.65); // 65% for last 30 days
        }
        // 'all' keeps 100% of total
        
        // Ensure at least 1 report
        total = Math.max(1, total);
    }
    
    // Update main displays with counting animation
    const totalDisplay = document.getElementById('gigsReportedTotalDisplay');
    const weekDisplay = document.getElementById('gigsReportedWeekDisplay');
    const changeDisplay = document.getElementById('gigsReportedChangeDisplay');
    
    // Get current values (for smooth transition on filter change)
    const currentTotal = totalDisplay && totalDisplay._currentValue ? totalDisplay._currentValue : 0;
    const currentWeek = weekDisplay && weekDisplay._currentValue ? weekDisplay._currentValue : 0;
    const currentChange = changeDisplay && changeDisplay._currentValue ? changeDisplay._currentValue : 0;
    
    // Calculate this week's reports (25% of total)
    const thisWeek = Math.round(total * 0.25);
    
    // Calculate change rate
    const changeRate = ((Math.random() - 0.5) * 10).toFixed(1);
    
    // Start counting animations (ultra fast: 150ms)
    if (totalDisplay) {
        totalDisplay.setAttribute('data-target', total);
        // Initialize max value for fluctuation (max 100)
        if (!totalDisplay._maxValue) totalDisplay._maxValue = 100;
        startCountingAnimation(totalDisplay, currentTotal, total, '', 150, 0);
    }
    
    if (weekDisplay) {
        weekDisplay.setAttribute('data-target', thisWeek);
        startCountingAnimation(weekDisplay, currentWeek, thisWeek, '', 150, 0);
    }
    
    if (changeDisplay) {
        changeDisplay.setAttribute('data-target', changeRate);
        startCountingAnimation(changeDisplay, currentChange, parseFloat(changeRate), changeRate >= 0 ? '+' : '', 150, 1, '%');
        changeDisplay.className = changeRate >= 0 ? 'revenue-amount growth-positive counting' : 'revenue-amount growth-negative counting';
    }
    
    // Report reasons breakdown
    const reasonsDistribution = generateDistribution(5, total);
    
    // Update each reason with value and percentage
    setElementValue('inappropriateContentValue', reasonsDistribution[0].toLocaleString());
    setElementValue('inappropriateContentPercent', `${((reasonsDistribution[0] / total) * 100).toFixed(1)}%`);
    
    setElementValue('scamFraudValue', reasonsDistribution[1].toLocaleString());
    setElementValue('scamFraudPercent', `${((reasonsDistribution[1] / total) * 100).toFixed(1)}%`);
    
    setElementValue('misleadingInfoValue', reasonsDistribution[2].toLocaleString());
    setElementValue('misleadingInfoPercent', `${((reasonsDistribution[2] / total) * 100).toFixed(1)}%`);
    
    setElementValue('duplicatePostingValue', reasonsDistribution[3].toLocaleString());
    setElementValue('duplicatePostingPercent', `${((reasonsDistribution[3] / total) * 100).toFixed(1)}%`);
    
    setElementValue('otherReasonValue', reasonsDistribution[4].toLocaleString());
    setElementValue('otherReasonPercent', `${((reasonsDistribution[4] / total) * 100).toFixed(1)}%`);
    
    // Report status
    const pending = Math.floor(total * (0.5 + Math.random() * 0.2)); // 50-70%
    const ignored = Math.floor(total * (0.1 + Math.random() * 0.1)); // 10-20%
    const suspended = total - pending - ignored;
    
    // Update status values and percentages
    setElementValue('pendingReviewValue', pending.toLocaleString());
    setElementValue('pendingReviewPercent', `${((pending / total) * 100).toFixed(1)}%`);
    
    setElementValue('ignoredReportsValue', ignored.toLocaleString());
    setElementValue('ignoredReportsPercent', `${((ignored / total) * 100).toFixed(1)}%`);
    
    setElementValue('suspendedReportsValue', suspended.toLocaleString());
    setElementValue('suspendedReportsPercent', `${((suspended / total) * 100).toFixed(1)}%`);
}

// Populate User Activity overlay data
function populateUserActivityData(data) {
    // Get current total users and base percentages
    const totalUsers = data.totalUsers || 100;
    const percentages = {
        mobilePercent: data.mobilePercent || 0.88,
        androidPercent: data.androidPercent || 0.78,
        repeatUserPercent: data.repeatUserPercent || 0.50,
        bounceRate: data.bounceRate || 0.25
    };
    
    // Calculate all metrics using the helper function
    // NOTE: Overview cards (Android/iPhone) use TOTAL users
    //       Overlay cards (Mobile/Desktop/Repeat/Bounce) use ACTIVE users (15-25% of total)
    const metrics = calculateUserActivityMetrics(totalUsers, percentages);
    
    // Populate top showcase cards (Mobile, Desktop, Repeat, Bounce)
    setElementValue('userActivityMobileCount', metrics.mobileCount.toLocaleString());
    setElementValue('userActivityMobilePercent', `${metrics.mobilePercent}%`);
    setElementValue('userActivityDesktopCount', metrics.desktopCount.toLocaleString());
    setElementValue('userActivityDesktopPercent', `${metrics.desktopPercent}%`);
    setElementValue('userActivityRepeatPercent', `${metrics.repeatPercent}%`);
    setElementValue('userActivityBounceRate', `${metrics.bounceRate}%`);
    
    // Mobile Platform Breakdown (Android vs iPhone)
    setElementValue('androidBreakdownValue', metrics.androidCount.toLocaleString());
    setElementValue('androidBreakdownPercent', `${metrics.androidPercent}%`);
    
    setElementValue('iphoneBreakdownValue', metrics.iphoneCount.toLocaleString());
    setElementValue('iphoneBreakdownPercent', `${metrics.iphonePercent}%`);
    
    // Browser Distribution (reflects 88% mobile, 78% Android reality)
    // Chrome dominates (Android default + some desktop)
    // Safari lower (only 22% iPhone users)
    const totalActiveUsers = metrics.activeUsers;
    
    // Add slight variation to browser percentages (±0.5%)
    const chromePercent = 74 + (Math.random() - 0.5);
    const safariPercent = 15 + (Math.random() - 0.5);
    const firefoxPercent = 4 + (Math.random() - 0.5);
    const edgePercent = 2 + (Math.random() - 0.5);
    const messengerPercent = 4 + (Math.random() - 0.5);
    const otherBrowserPercent = 1 + (Math.random() - 0.5);
    
    const browsers = {
        chrome: Math.round(totalActiveUsers * (chromePercent / 100)),
        safari: Math.round(totalActiveUsers * (safariPercent / 100)),
        firefox: Math.round(totalActiveUsers * (firefoxPercent / 100)),
        edge: Math.round(totalActiveUsers * (edgePercent / 100)),
        messenger: Math.round(totalActiveUsers * (messengerPercent / 100)),
        otherBrowser: Math.round(totalActiveUsers * (otherBrowserPercent / 100))
    };
    
    setElementValue('chromeValue', browsers.chrome.toLocaleString());
    setElementValue('chromePercent', `${chromePercent.toFixed(1)}%`);
    
    setElementValue('safariValue', browsers.safari.toLocaleString());
    setElementValue('safariPercent', `${safariPercent.toFixed(1)}%`);
    
    setElementValue('firefoxValue', browsers.firefox.toLocaleString());
    setElementValue('firefoxPercent', `${firefoxPercent.toFixed(1)}%`);
    
    setElementValue('edgeValue', browsers.edge.toLocaleString());
    setElementValue('edgePercent', `${edgePercent.toFixed(1)}%`);
    
    setElementValue('messengerValue', browsers.messenger.toLocaleString());
    setElementValue('messengerPercent', `${messengerPercent.toFixed(1)}%`);
    
    setElementValue('otherBrowserValue', browsers.otherBrowser.toLocaleString());
    setElementValue('otherBrowserPercent', `${otherBrowserPercent.toFixed(1)}%`);
    
    // Session Duration Breakdown (with slight variation)
    const session0to5Percent = 19 + (Math.random() - 0.5);
    const session5to15Percent = 38 + (Math.random() - 0.5);
    const session15to30Percent = 25 + (Math.random() - 0.5);
    const session30plusPercent = 18 + (Math.random() - 0.5);
    
    setElementValue('session0to5Value', Math.round(totalActiveUsers * (session0to5Percent / 100)).toLocaleString());
    setElementValue('session0to5Percent', `${session0to5Percent.toFixed(1)}%`);
    
    setElementValue('session5to15Value', Math.round(totalActiveUsers * (session5to15Percent / 100)).toLocaleString());
    setElementValue('session5to15Percent', `${session5to15Percent.toFixed(1)}%`);
    
    setElementValue('session15to30Value', Math.round(totalActiveUsers * (session15to30Percent / 100)).toLocaleString());
    setElementValue('session15to30Percent', `${session15to30Percent.toFixed(1)}%`);
    
    setElementValue('session30plusValue', Math.round(totalActiveUsers * (session30plusPercent / 100)).toLocaleString());
    setElementValue('session30plusPercent', `${session30plusPercent.toFixed(1)}%`);
    
    // Average Session Duration (calculated from current distribution)
    const avgMinutes = ((session0to5Percent/100) * 2.5) + ((session5to15Percent/100) * 10) + 
                       ((session15to30Percent/100) * 22.5) + ((session30plusPercent/100) * 40);
    const minutes = Math.floor(avgMinutes);
    const seconds = Math.floor((avgMinutes - minutes) * 60);
    setElementValue('avgSessionOverlayDisplay', `${minutes}m ${seconds}s`);
    
    // Peak Usage Hours (reflects Filipino work/school schedule)
    // Uses TOTAL USERS (not just active) to show realistic peak traffic
    // Morning (6AM-12PM): Commute + early work - 50-55% of total users
    // Afternoon (12PM-6PM): Lunch break + after work - PEAK 70-78% of total users
    // Evening (6PM-12AM): Dinner + leisure - 55-62% of total users
    // Night (12AM-6AM): Very low - 8-12% of total users
    const morningPeak = 0.50 + (Math.random() * 0.05);  // 50-55%
    const afternoonPeak = 0.70 + (Math.random() * 0.08); // 70-78%
    const eveningPeak = 0.55 + (Math.random() * 0.07);  // 55-62%
    const nightPeak = 0.08 + (Math.random() * 0.04);    // 8-12%
    
    setElementValue('morningUsersCount', `${Math.round(totalUsers * morningPeak)}`);
    setElementValue('afternoonUsersCount', `${Math.round(totalUsers * afternoonPeak)}`);
    setElementValue('eveningUsersCount', `${Math.round(totalUsers * eveningPeak)}`);
    setElementValue('nightUsersCount', `${Math.round(totalUsers * nightPeak)}`);
    
    console.log(`📊 User Activity Overlay populated: ${totalActiveUsers.toLocaleString()} active users (${Math.round((totalActiveUsers/totalUsers)*100)}% of ${totalUsers.toLocaleString()} total)`);
}

// Populate Gigs Analytics overlay data
function populateGigsAnalyticsData(data) {
    // Get values from main dashboard (real-time from elements)
    const totalGigsEl = document.getElementById('totalGigsPosted');
    const totalAppsEl = document.getElementById('totalApplicants');
    
    const totalGigs = totalGigsEl && totalGigsEl._currentValue ? Math.round(totalGigsEl._currentValue) : (data.totalGigs || 1847);
    const totalApps = totalAppsEl && totalAppsEl._currentValue ? Math.round(totalAppsEl._currentValue) : (data.totalApplicants || 5624);
    
    const avgPerGig = (totalApps / totalGigs).toFixed(1);
    
    // Populate top showcase cards
    setElementValue('gigsOverlayTotalGigs', totalGigs);
    setElementValue('gigsOverlayTotalApplicants', totalApps);
    setElementValue('gigsOverlayAvgPerGig', avgPerGig);
    
    // Gigs Posted by Category (percentages with slight variation to simulate demand changes)
    // Base percentages with ±0.5-1% random variation
    const gigsBasePercent = {
        driver: 0.14 + (Math.random() - 0.5) * 0.01,      // 13.5-14.5%
        carpenter: 0.11 + (Math.random() - 0.5) * 0.01,   // 10.5-11.5%
        limfyo: 0.10 + (Math.random() - 0.5) * 0.01,      // 9.5-10.5% (Limpyo - cleaning)
        electrician: 0.08 + (Math.random() - 0.5) * 0.01, // 7.5-8.5%
        plumber: 0.07 + (Math.random() - 0.5) * 0.01,     // 6.5-7.5%
        mechanic: 0.06 + (Math.random() - 0.5) * 0.01,    // 5.5-6.5%
        bantay: 0.06 + (Math.random() - 0.5) * 0.01,      // 5.5-6.5%
        luto: 0.06 + (Math.random() - 0.5) * 0.01,        // 5.5-6.5% (cooking)
        tutor: 0.05 + (Math.random() - 0.5) * 0.01,       // 4.5-5.5%
        nurse: 0.05 + (Math.random() - 0.5) * 0.01,       // 4.5-5.5%
        painter: 0.04 + (Math.random() - 0.5) * 0.01,     // 3.5-4.5%
        clerical: 0.04 + (Math.random() - 0.5) * 0.01,    // 3.5-4.5%
        hatod: 0.03 + (Math.random() - 0.5) * 0.01,       // 2.5-3.5% (delivery/transport)
        hakot: 0.03 + (Math.random() - 0.5) * 0.01,       // 2.5-3.5% (hauling/moving)
        builder: 0.02 + (Math.random() - 0.5) * 0.01      // 1.5-2.5%
    };
    
    const gigsDistribution = {
        driver: Math.round(totalGigs * gigsBasePercent.driver),
        carpenter: Math.round(totalGigs * gigsBasePercent.carpenter),
        limfyo: Math.round(totalGigs * gigsBasePercent.limfyo),
        electrician: Math.round(totalGigs * gigsBasePercent.electrician),
        plumber: Math.round(totalGigs * gigsBasePercent.plumber),
        mechanic: Math.round(totalGigs * gigsBasePercent.mechanic),
        bantay: Math.round(totalGigs * gigsBasePercent.bantay),
        luto: Math.round(totalGigs * gigsBasePercent.luto),
        tutor: Math.round(totalGigs * gigsBasePercent.tutor),
        nurse: Math.round(totalGigs * gigsBasePercent.nurse),
        painter: Math.round(totalGigs * gigsBasePercent.painter),
        clerical: Math.round(totalGigs * gigsBasePercent.clerical),
        hatod: Math.round(totalGigs * gigsBasePercent.hatod),
        hakot: Math.round(totalGigs * gigsBasePercent.hakot),
        builder: Math.round(totalGigs * gigsBasePercent.builder),
        other: 0  // Will be calculated as remainder (10+ other categories, ~6-7%)
    };
    
    // Calculate "Other" as remainder (combines 10+ other categories)
    const gigsSum = Object.values(gigsDistribution).reduce((a, b) => a + b, 0);
    gigsDistribution.other = totalGigs - gigsSum;
    
    // Populate Gigs Posted by Category with counts and percentages
    Object.keys(gigsDistribution).forEach(category => {
        const count = gigsDistribution[category];
        const percent = ((count / totalGigs) * 100).toFixed(0);
        
        setElementValue(`gigs${category.charAt(0).toUpperCase() + category.slice(1)}Value`, count.toLocaleString());
        setElementValue(`gigs${category.charAt(0).toUpperCase() + category.slice(1)}Percent`, `${percent}%`);
    });
    
    // Applications by Category (percentages with slight variation to simulate demand changes)
    // Base percentages with ±0.5-1% random variation
    const appsBasePercent = {
        driver: 0.14 + (Math.random() - 0.5) * 0.01,      // 13.5-14.5%
        carpenter: 0.11 + (Math.random() - 0.5) * 0.01,   // 10.5-11.5%
        electrician: 0.09 + (Math.random() - 0.5) * 0.01, // 8.5-9.5%
        plumber: 0.08 + (Math.random() - 0.5) * 0.01,     // 7.5-8.5%
        mechanic: 0.07 + (Math.random() - 0.5) * 0.01,    // 6.5-7.5%
        bantay: 0.07 + (Math.random() - 0.5) * 0.01,      // 6.5-7.5%
        limfyo: 0.06 + (Math.random() - 0.5) * 0.01,      // 5.5-6.5% (Limpyo - cleaning)
        luto: 0.06 + (Math.random() - 0.5) * 0.01,        // 5.5-6.5% (cooking)
        tutor: 0.05 + (Math.random() - 0.5) * 0.01,       // 4.5-5.5%
        nurse: 0.05 + (Math.random() - 0.5) * 0.01,       // 4.5-5.5%
        painter: 0.04 + (Math.random() - 0.5) * 0.01,     // 3.5-4.5%
        clerical: 0.04 + (Math.random() - 0.5) * 0.01,    // 3.5-4.5%
        hatod: 0.03 + (Math.random() - 0.5) * 0.01,       // 2.5-3.5% (delivery/transport)
        hakot: 0.03 + (Math.random() - 0.5) * 0.01,       // 2.5-3.5% (hauling/moving)
        builder: 0.02 + (Math.random() - 0.5) * 0.01      // 1.5-2.5%
    };
    
    const appsDistribution = {
        driver: Math.round(totalApps * appsBasePercent.driver),
        carpenter: Math.round(totalApps * appsBasePercent.carpenter),
        electrician: Math.round(totalApps * appsBasePercent.electrician),
        plumber: Math.round(totalApps * appsBasePercent.plumber),
        mechanic: Math.round(totalApps * appsBasePercent.mechanic),
        bantay: Math.round(totalApps * appsBasePercent.bantay),
        limfyo: Math.round(totalApps * appsBasePercent.limfyo),
        luto: Math.round(totalApps * appsBasePercent.luto),
        tutor: Math.round(totalApps * appsBasePercent.tutor),
        nurse: Math.round(totalApps * appsBasePercent.nurse),
        painter: Math.round(totalApps * appsBasePercent.painter),
        clerical: Math.round(totalApps * appsBasePercent.clerical),
        hatod: Math.round(totalApps * appsBasePercent.hatod),
        hakot: Math.round(totalApps * appsBasePercent.hakot),
        builder: Math.round(totalApps * appsBasePercent.builder),
        other: 0  // Will be calculated as remainder (10+ other categories, ~6-7%)
    };
    
    // Calculate "Other" as remainder (combines 10+ other categories)
    const appsSum = Object.values(appsDistribution).reduce((a, b) => a + b, 0);
    appsDistribution.other = totalApps - appsSum;
    
    // Populate Applications by Category with counts and percentages
    Object.keys(appsDistribution).forEach(category => {
        const count = appsDistribution[category];
        const percent = ((count / totalApps) * 100).toFixed(0);
        
        setElementValue(`apps${category.charAt(0).toUpperCase() + category.slice(1)}Value`, count.toLocaleString());
        setElementValue(`apps${category.charAt(0).toUpperCase() + category.slice(1)}Percent`, `${percent}%`);
    });
    
    // Log top 3 categories for monitoring
    console.log(`💼 Gigs by Category: Driver ${((gigsDistribution.driver/totalGigs)*100).toFixed(1)}%, Carpenter ${((gigsDistribution.carpenter/totalGigs)*100).toFixed(1)}%, Limpyo ${((gigsDistribution.limfyo/totalGigs)*100).toFixed(1)}%`);
}

// Populate Storage Usage overlay data
function populateStorageUsageData(data) {
    // Calculate storage based on actual users and gigs
    const totalUsersEl = document.getElementById('totalUsersNumber');
    const totalGigsEl = document.getElementById('totalGigsPosted');
    const verificationsEl = document.getElementById('verificationsNumber');
    
    const totalUsers = totalUsersEl && totalUsersEl._currentValue ? totalUsersEl._currentValue : (data.totalUsers || 100);
    const totalGigs = totalGigsEl && totalGigsEl._currentValue ? totalGigsEl._currentValue : (data.totalGigs || 1847);
    const verifiedUsers = verificationsEl && verificationsEl._currentValue ? verificationsEl._currentValue : (data.verifications || 500);
    
    // Calculate realistic storage based on platform activity
    // FILE SIZE AVERAGES:
    // - Profile Photo: 350 KB (compressed, mandatory for all users)
    // - Gig Photo: 500 KB (avg 1.5 photos per gig, will grow over time)
    // - ID Verification: 750 KB (selfie + ID photo for verified users)
    // - Other Files: 1 MB (occasional docs, ~5% of users)
    
    // Profile Photos: 100% of users (MANDATORY)
    const profilePhotoCount = totalUsers;
    const profilePhotoSize = (profilePhotoCount * 0.00035); // 350 KB each in GB
    
    // Gig Photos: Average 1.5 photos per gig (will eventually surpass profile photos)
    const avgPhotosPerGig = 1.5;
    const gigPhotoCount = Math.round(totalGigs * avgPhotosPerGig);
    const gigPhotoSize = (gigPhotoCount * 0.0005); // 500 KB each in GB
    
    // ID Verifications: 100% of verified users upload ID photos
    const idVerificationCount = verifiedUsers;
    const idVerificationSize = (idVerificationCount * 0.00075); // 750 KB each in GB
    
    // Other Files: ~5% of users upload additional documents
    const otherFilesCount = Math.round(totalUsers * 0.05);
    const otherFilesSize = (otherFilesCount * 0.001); // 1 MB each in GB
    
    // Calculate total storage
    const calculatedStorage = profilePhotoSize + gigPhotoSize + idVerificationSize + otherFilesSize;
    
    // Get or set current storage (gradually moves toward calculated value)
    const storageEl = document.getElementById('totalStorageUsed');
    let currentStorage = data.storageUsed || calculatedStorage;
    
    // If storage is far from calculated value, gradually adjust it
    if (Math.abs(currentStorage - calculatedStorage) > 0.1) {
        currentStorage = calculatedStorage;
    }
    
    const storageCost = (currentStorage * 0.026).toFixed(2); // $0.026 per GB per month (Firebase pricing)
    
    // Calculate total media count and size
    const totalMediaCount = profilePhotoCount + gigPhotoCount + idVerificationCount + otherFilesCount;
    const totalMediaSize = profilePhotoSize + gigPhotoSize + idVerificationSize + otherFilesSize;
    
    // Populate top showcase cards
    setElementValue('storageOverlayTotal', `${currentStorage.toFixed(1)} GB`);
    setElementValue('storageOverlayMediaCount', totalMediaCount.toLocaleString());
    setElementValue('storageOverlayMediaSize', `${totalMediaSize.toFixed(1)} GB`);
    setElementValue('storageOverlayCost', `$${storageCost}`);
    
    // Calculate percentages for media distribution
    const profilePercent = ((profilePhotoSize / totalMediaSize) * 100).toFixed(0);
    const gigPercent = ((gigPhotoSize / totalMediaSize) * 100).toFixed(0);
    const idPercent = ((idVerificationSize / totalMediaSize) * 100).toFixed(0);
    const otherPercent = ((otherFilesSize / totalMediaSize) * 100).toFixed(0);
    
    // Media Uploads Breakdown
    const mediaDistribution = {
        profilePhotos: { count: profilePhotoCount, size: profilePhotoSize, percent: profilePercent },
        gigPhotos: { count: gigPhotoCount, size: gigPhotoSize, percent: gigPercent },
        idVerifications: { count: idVerificationCount, size: idVerificationSize, percent: idPercent },
        otherFiles: { count: otherFilesCount, size: otherFilesSize, percent: otherPercent }
    };
    
    Object.keys(mediaDistribution).forEach(type => {
        const item = mediaDistribution[type];
        setElementValue(`${type}Count`, item.count.toLocaleString());
        setElementValue(`${type}Size`, `(${item.size.toFixed(1)} GB)`);
        setElementValue(`${type}Percent`, `${item.percent}%`);
    });
    
    // Storage Growth (estimate based on current growth rate)
    // This Month: ~10% of current storage
    // Average Monthly: ~13% of current storage
    // All Time: Current total
    setElementValue('storageGrowthMonth', `${(currentStorage * 0.10).toFixed(2)} GB`);
    setElementValue('storageGrowthAvg', `${(currentStorage * 0.13).toFixed(2)} GB`);
    setElementValue('storageGrowthAllTime', `${currentStorage.toFixed(1)} GB`);
    
    // Calculate All Time storage cost
    // Assuming 7 days of usage (as per simulation timeline), prorated monthly cost
    // Firebase storage cost: $0.026 per GB per month
    const storageCostPerGB = 0.026; // $ per GB per month
    const daysInSimulation = 7; // Simulation starts Jan 1, current is Jan 8
    const allTimeStorageCost = (currentStorage * storageCostPerGB * daysInSimulation) / 30; // Prorated for 7 days
    setElementValue('storageAllTimeCost', `($${allTimeStorageCost.toFixed(2)})`);
    
    // Projected Full (assuming 500 GB limit)
    const storageLimit = 500; // GB
    const avgMonthlyGrowth = currentStorage * 0.13;
    const monthsToFull = avgMonthlyGrowth > 0 ? Math.max(1, Math.round((storageLimit - currentStorage) / avgMonthlyGrowth)) : 999;
    setElementValue('storageProjectedFull', monthsToFull > 100 ? '∞' : `${monthsToFull} mo`);
    
    console.log(`💾 Storage: ${currentStorage.toFixed(2)} GB | Profile: ${profilePercent}% (${profilePhotoCount}), Gigs: ${gigPercent}% (${gigPhotoCount})`);
}

// Populate Traffic & Costs overlay data
function populateTrafficCostsData(data) {
    // Get current period selection
    const periodSelect = document.getElementById('trafficPeriodSelect');
    const period = periodSelect ? periodSelect.value : 'month';
    
    // Get real-time data from dashboard
    const totalUsersEl = document.getElementById('totalUsersNumber');
    const totalGigsEl = document.getElementById('totalGigsPosted');
    const totalAppsEl = document.getElementById('totalApplicants');
    const storageEl = document.getElementById('totalStorageUsed');
    
    const totalUsers = totalUsersEl && totalUsersEl._currentValue ? totalUsersEl._currentValue : (data.totalUsers || 100);
    const totalGigs = totalGigsEl && totalGigsEl._currentValue ? totalGigsEl._currentValue : (data.totalGigs || 70);
    const totalApps = totalAppsEl && totalAppsEl._currentValue ? totalAppsEl._currentValue : (data.totalApplicants || 200);
    const storageGB = storageEl && storageEl._currentValue ? storageEl._currentValue : (data.storageUsed || 0.5);
    
    // Calculate MONTHLY base traffic based on user activity
    // BANDWIDTH: Image downloads, API responses, page loads
    // - Average user views 20 gigs/month, each with 1.5 photos @ 500 KB = ~15 MB
    // - Profile photo views: ~50 views/month @ 350 KB = ~17.5 MB
    // - Total per active user: ~32 MB/month
    // Active users: 15-25% of total (using 20%)
    const activeUsers = Math.round(totalUsers * 0.20);
    const monthlyBandwidth = (activeUsers * 0.032) + (storageGB * 0.1); // GB (32 MB per active user + 10% of storage for uploads)
    
    // DATABASE READS: Profile views, gig browsing, searches, list loading
    // - Active user browses 100 gigs/month = ~100 reads per gig (list + details) = 10,000 reads/user
    // - Profile views: ~50/month @ 5 reads each = 250 reads/user
    // - Search queries: ~20/month @ 50 reads each = 1,000 reads/user
    // Total: ~11,250 reads per active user per month
    const monthlyReads = Math.round(activeUsers * 11250);
    
    // DATABASE WRITES: New users, gig posts, applications, profile updates
    // - New users: totalUsers growth = ~10% per month (optimistic growth)
    // - Gig posts: each user posts 0.5 gigs/month @ 5 writes = 2.5 writes/user
    // - Applications: each user applies 1.5x/month @ 3 writes = 4.5 writes/user
    // - Profile updates: ~2/month @ 3 writes = 6 writes/user
    // Total: ~13 writes per active user per month + new user signups
    const newUsersPerMonth = Math.round(totalUsers * 0.10);
    const monthlyWrites = Math.round((activeUsers * 13) + (newUsersPerMonth * 8)); // 8 writes per signup
    
    // Adjust based on selected period
    let bandwidth, reads, writes;
    
    // Simulation timeline: Started Jan 1, currently Jan 8 (7 days in)
    const daysInSimulation = 7;
    const daysInMonth = 30;
    
    switch(period) {
        case 'today':
            bandwidth = monthlyBandwidth / daysInMonth; // Daily average
            reads = Math.round(monthlyReads / daysInMonth);
            writes = Math.round(monthlyWrites / daysInMonth);
            break;
        case 'week':
            bandwidth = (monthlyBandwidth / daysInMonth) * 7; // Weekly
            reads = Math.round((monthlyReads / daysInMonth) * 7);
            writes = Math.round((monthlyWrites / daysInMonth) * 7);
            break;
        case 'month':
            // Month To Date: Show accumulated data for current month (7 days so far)
            bandwidth = (monthlyBandwidth / daysInMonth) * daysInSimulation;
            reads = Math.round((monthlyReads / daysInMonth) * daysInSimulation);
            writes = Math.round((monthlyWrites / daysInMonth) * daysInSimulation);
            break;
        case 'year':
            // Project full year based on current monthly rate
            bandwidth = monthlyBandwidth * 12;
            reads = Math.round(monthlyReads * 12);
            writes = Math.round(monthlyWrites * 12);
            break;
        case 'all':
            // All Time: Same as Month To Date since simulation started on Jan 1
            bandwidth = (monthlyBandwidth / daysInMonth) * daysInSimulation;
            reads = Math.round((monthlyReads / daysInMonth) * daysInSimulation);
            writes = Math.round((monthlyWrites / daysInMonth) * daysInSimulation);
            break;
        default:
            bandwidth = (monthlyBandwidth / daysInMonth) * daysInSimulation;
            reads = Math.round((monthlyReads / daysInMonth) * daysInSimulation);
            writes = monthlyWrites;
    }
    
    // Calculate Firebase cost (actual Firebase pricing)
    // Reads: $0.036/100K (Firestore document reads)
    // Writes: $0.108/100K (Firestore document writes)
    // Storage: $0.026/GB/month (prorated by period)
    // Bandwidth (egress): $0.12/GB
    // Authentication: ~$0.0055 per monthly active user (prorated by period)
    const readCost = (reads / 100000) * 0.036;
    const writeCost = (writes / 100000) * 0.108;
    const dbCost = readCost + writeCost;
    
    // Prorate storage and auth costs based on period
    let periodMultiplier;
    switch(period) {
        case 'today':
            periodMultiplier = 1 / daysInMonth; // 1 day
            break;
        case 'week':
            periodMultiplier = 7 / daysInMonth; // 7 days
            break;
        case 'month':
            periodMultiplier = daysInSimulation / daysInMonth; // 7 days (Month To Date)
            break;
        case 'year':
            periodMultiplier = 12; // 12 months
            break;
        case 'all':
            periodMultiplier = daysInSimulation / daysInMonth; // 7 days (All Time = MTD)
            break;
        default:
            periodMultiplier = daysInSimulation / daysInMonth;
    }
    
    const storageCost = storageGB * 0.026 * periodMultiplier; // Prorated monthly cost
    const bandwidthCost = bandwidth * 0.12; // $0.12 per GB (usage-based, no proration needed)
    const authCost = activeUsers * 0.0055 * periodMultiplier; // Prorated monthly cost
    const totalCost = dbCost + storageCost + bandwidthCost + authCost;
    
    // Populate top showcase cards
    setElementValue('trafficOverlayBandwidth', `${bandwidth.toFixed(1)} GB`);
    setElementValue('trafficOverlayReads', reads >= 1000 ? `${(reads/1000).toFixed(0)}K` : reads.toString());
    setElementValue('trafficOverlayWrites', writes >= 1000 ? `${(writes/1000).toFixed(0)}K` : writes.toString());
    setElementValue('trafficOverlayCost', `$${totalCost.toFixed(2)}`);
    
    // Cost Breakdown with percentages
    setElementValue('dbOperationsCostValue', `$${dbCost.toFixed(2)}`);
    setElementValue('dbOperationsCostPercent', `${((dbCost / totalCost) * 100).toFixed(0)}%`);
    
    setElementValue('storageCostValue', `$${storageCost.toFixed(2)}`);
    setElementValue('storageCostPercent', `${((storageCost / totalCost) * 100).toFixed(0)}%`);
    
    setElementValue('bandwidthCostValue', `$${bandwidthCost.toFixed(2)}`);
    setElementValue('bandwidthCostPercent', `${((bandwidthCost / totalCost) * 100).toFixed(0)}%`);
    
    setElementValue('authCostValue', `$${authCost.toFixed(2)}`);
    setElementValue('authCostPercent', `${((authCost / totalCost) * 100).toFixed(0)}%`);
    
    // Traffic Trends (calculated from bandwidth)
    const daysInPeriod = period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? daysInSimulation : period === 'year' ? 365 : daysInSimulation;
    const dailyAvgMB = (bandwidth / daysInPeriod) * 1024; // Convert GB to MB
    const peakDayMB = dailyAvgMB * (1.8 + (Math.random() * 0.4)); // 1.8-2.2x daily avg
    const lowestDayMB = dailyAvgMB * (0.4 + (Math.random() * 0.2)); // 0.4-0.6x daily avg
    const growthRate = 15 + Math.floor(Math.random() * 10); // 15-25% growth
    
    setElementValue('trafficDailyAvg', dailyAvgMB >= 1024 ? `${(dailyAvgMB/1024).toFixed(1)} GB` : `${dailyAvgMB.toFixed(0)} MB`);
    setElementValue('trafficPeakDay', peakDayMB >= 1024 ? `${(peakDayMB/1024).toFixed(1)} GB` : `${peakDayMB.toFixed(0)} MB`);
    setElementValue('trafficLowestDay', lowestDayMB >= 1024 ? `${(lowestDayMB/1024).toFixed(1)} GB` : `${lowestDayMB.toFixed(0)} MB`);
    setElementValue('trafficGrowthRate', `+${growthRate}%`);
    
    // Add period change listener
    if (periodSelect && !periodSelect._listenerAttached) {
        periodSelect.addEventListener('change', () => populateTrafficCostsData(data));
        periodSelect._listenerAttached = true;
    }
    
    console.log(`📊 Traffic [${period}]: ${bandwidth.toFixed(2)} GB BW | ${(reads/1000).toFixed(0)}K reads | ${(writes/1000).toFixed(0)}K writes | $${totalCost.toFixed(2)} cost`);
}

// Helper: Set element value safely
function setElementValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = value;
    }
}

// Helper: Generate distribution that adds up to total
function generateDistribution(count, total) {
    const distribution = [];
    let remaining = total;
    
    for (let i = 0; i < count - 1; i++) {
        const value = Math.floor(Math.random() * (remaining / (count - i)));
        distribution.push(value);
        remaining -= value;
    }
    
    distribution.push(remaining);
    return distribution;
}

// Helper: Generate weighted distribution based on specified weights
function generateWeightedDistribution(weights, total) {
    const distribution = [];
    let remaining = total;
    
    // Normalize weights to sum to 1
    const sumWeights = weights.reduce((a, b) => a + b, 0);
    const normalizedWeights = weights.map(w => w / sumWeights);
    
    // Distribute based on weights, keeping track of exact values
    for (let i = 0; i < weights.length - 1; i++) {
        const value = Math.round(total * normalizedWeights[i]);
        distribution.push(value);
        remaining -= value;
    }
    
    // Last value gets the remainder to ensure exact total
    distribution.push(remaining);
    return distribution;
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

// Real-time counting animation (continuously increases by 0.1% every 2 seconds)
function startCountingAnimation(element, start, end, prefix = '', duration = 1500, decimals = 0, suffix = '') {
    // Clear any existing timer
    if (element._countingTimer) {
        clearInterval(element._countingTimer);
    }
    if (element._continuousTimer) {
        clearInterval(element._continuousTimer);
    }
    
    // Phase 1: Initial count up from start to end
    const range = end - start;
    
    // If range is zero or negative, skip directly to continuous phase
    if (range <= 0) {
        // Set to end value immediately
        const formattedValue = end.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        element.textContent = `${prefix}${formattedValue}${suffix}`;
        
        // Start continuous incrementing
        element._currentValue = end;
        element._unroundedValue = end; // Track unrounded value for accurate increments
        element._saveCounter = 0; // Track for periodic saves
        
        // Skip continuous phase for elements that will be updated by other elements
        if (element.id === 'regionPieTotal' || element.id === 'accountTypePieTotal' || 
            element.id === 'usersNewDisplay' || element.id === 'usersVerifiedDisplay' ||
            element.id === 'newMemberLegend' || element.id === 'proVerifiedLegend' || element.id === 'businessVerifiedLegend' ||
            element.id === 'verificationsProDisplay' || element.id === 'verificationsBusinessDisplay' ||
            element.id === 'verificationsOverdueDisplay' || element.id === 'gigsReportedThisWeek') {
            // These elements are controlled by their parent element, no continuous timer needed
            return;
        }
        
        element._continuousTimer = setInterval(() => {
            // For PHP revenue, add random increments (100/250/500)
            if (prefix === '₱') {
                const increments = [100, 250, 500];
                const randomIncrement = increments[Math.floor(Math.random() * increments.length)];
                element._unroundedValue += randomIncrement;
                
                let displayValue = element._unroundedValue;
                let displayDecimals = 0; // Always show whole numbers for PHP
                
                element._currentValue = displayValue;
                
                // Also update the main revenue card if this is the PHP display in overlay
                // and we're viewing the current month (not a filtered view)
                if (element.id === 'revenuePHPDisplay') {
                    const dateRangeSelect = document.getElementById('revenueDateRange');
                    const isCurrentMonth = !dateRangeSelect || dateRangeSelect.value === 'current';
                    
                    if (isCurrentMonth) {
                        const mainRevenueCard = document.getElementById('revenueNumber');
                        if (mainRevenueCard) {
                            const mainFormatted = displayValue.toLocaleString('en-US', {
                                minimumFractionDigits: displayDecimals,
                                maximumFractionDigits: displayDecimals
                            });
                            mainRevenueCard.textContent = `₱${mainFormatted}`;
                            // Sync the current value so dashboard timer continues correctly
                            mainRevenueCard._currentValue = displayValue;
                        }
                    }
                    
                    // Save to localStorage every 5 seconds
                    element._saveCounter++;
                    if (element._saveCounter >= 5) {
                        element._saveCounter = 0;
                        const currentData = loadMockDataFromStorage();
                        currentData.revenue = Math.round(displayValue);
                        saveMockDataToStorage(currentData);
                    }
                }
                
                const formattedValue = displayValue.toLocaleString('en-US', {
                    minimumFractionDigits: displayDecimals,
                    maximumFractionDigits: displayDecimals
                });
                element.textContent = `${prefix}${formattedValue}${suffix}`;
                
                // Also update USD display based on PHP value
                const usdDisplay = document.getElementById('revenueUSDDisplay');
                if (usdDisplay && element.id === 'revenuePHPDisplay') {
                    const exchangeRate = 57; // ₱57 = $1 USD
                    const usdValue = element._unroundedValue / exchangeRate;
                    usdDisplay._unroundedValue = usdValue;
                    usdDisplay._currentValue = usdValue;
                    
                    const usdFormatted = usdValue.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    usdDisplay.textContent = `$${usdFormatted}`;
                }
                
                console.log(`💰 Revenue increased by ${randomIncrement}: ${prefix}${formattedValue}${suffix}`);
            } else if (prefix === '' && suffix === '' && element.id === 'usersTotalDisplay') {
                // For Total Users in overlay, add random 1-25
                const randomIncrease = Math.floor(Math.random() * 25) + 1;
                element._unroundedValue += randomIncrease;
                element._currentValue = element._unroundedValue;
                
                const formattedValue = element._unroundedValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                element.textContent = formattedValue;
                
                // Also update the main dashboard users card (if overlay is open on "All Time" filter)
                const dateRangeSelect = document.getElementById('usersDateRange');
                const isAllTime = !dateRangeSelect || dateRangeSelect.value === 'all';
                
                if (isAllTime) {
                    const mainUsersCard = document.getElementById('usersNumber');
                    if (mainUsersCard) {
                        mainUsersCard._currentValue = element._unroundedValue;
                        mainUsersCard.textContent = element._unroundedValue.toLocaleString('en-US');
                    }
                }
                
                // Save to localStorage every 5 seconds to prevent data loss on refresh
                if (!element._saveCounter) element._saveCounter = 0;
                element._saveCounter++;
                if (element._saveCounter >= 5) {
                    element._saveCounter = 0;
                    const currentData = loadMockDataFromStorage();
                    currentData.totalUsers = Math.round(element._unroundedValue);
                    saveMockDataToStorage(currentData);
                }
                
                // Also update New Members (35% unverified) and Verified Members (65% verified)
                const newDisplay = document.getElementById('usersNewDisplay');
                const verifiedDisplay = document.getElementById('usersVerifiedDisplay');
                if (newDisplay && verifiedDisplay) {
                    const totalUsers = Math.round(element._unroundedValue);
                    
                    // 65% are verified, 35% are unverified new members
                    const verifiedValue = Math.round(totalUsers * 0.65);
                    const newValue = totalUsers - verifiedValue; // Ensures they add up to total
                    
                    newDisplay._unroundedValue = newValue;
                    newDisplay._currentValue = newValue;
                    newDisplay.textContent = newValue.toLocaleString('en-US');
                    
                    verifiedDisplay._unroundedValue = verifiedValue;
                    verifiedDisplay._currentValue = verifiedValue;
                    verifiedDisplay.textContent = verifiedValue.toLocaleString('en-US');
                }
                
                // Also update Regional Distribution and Account Types totals to match
                const regionPieTotal = document.getElementById('regionPieTotal');
                const accountTypePieTotal = document.getElementById('accountTypePieTotal');
                
                if (regionPieTotal) {
                    regionPieTotal._unroundedValue = element._unroundedValue;
                    regionPieTotal._currentValue = element._unroundedValue;
                    regionPieTotal.textContent = element._unroundedValue.toLocaleString('en-US');
                }
                
                if (accountTypePieTotal) {
                    // Account Types total should equal Total Users
                    const totalUsers = Math.round(element._unroundedValue);
                    
                    accountTypePieTotal._unroundedValue = totalUsers;
                    accountTypePieTotal._currentValue = totalUsers;
                    accountTypePieTotal.textContent = totalUsers.toLocaleString('en-US');
                    
                    // Also update Account Types legend values
                    if (accountTypePieTotal._verifiedPercent && accountTypePieTotal._proPercentOfVerified) {
                        const newMemberLegend = document.getElementById('newMemberLegend');
                        const proVerifiedLegend = document.getElementById('proVerifiedLegend');
                        const businessVerifiedLegend = document.getElementById('businessVerifiedLegend');
                        
                        if (newMemberLegend && newMemberLegend._syncWithPieChart) {
                            // Calculate from total users using stored percentages
                            const verifiedTotal = Math.round(totalUsers * accountTypePieTotal._verifiedPercent); // 65%
                            const newMemberValue = totalUsers - verifiedTotal; // 35%
                            
                            newMemberLegend._unroundedValue = newMemberValue;
                            newMemberLegend._currentValue = newMemberValue;
                            newMemberLegend.textContent = newMemberValue.toLocaleString('en-US');
                            
                            // Update Pro (percentage of verified)
                            if (proVerifiedLegend && proVerifiedLegend._syncWithPieChart) {
                                const proValue = Math.round(verifiedTotal * accountTypePieTotal._proPercentOfVerified);
                                proVerifiedLegend._unroundedValue = proValue;
                                proVerifiedLegend._currentValue = proValue;
                                proVerifiedLegend.textContent = proValue.toLocaleString('en-US');
                                
                                // Update Business (remaining verified)
                                if (businessVerifiedLegend && businessVerifiedLegend._syncWithPieChart) {
                                    const businessValue = verifiedTotal - proValue;
                                    businessVerifiedLegend._unroundedValue = businessValue;
                                    businessVerifiedLegend._currentValue = businessValue;
                                    businessVerifiedLegend.textContent = businessValue.toLocaleString('en-US');
                                }
                            }
                        }
                    }
                }
                
                console.log(`👥 Users increased by ${randomIncrease}: ${formattedValue}`);
            } else if (prefix === '' && suffix === '' && element.id === 'usersNewDisplay') {
                // New Members display - skip (controlled by Total Users)
                return;
            } else if (prefix === '' && suffix === '' && element.id === 'usersVerifiedDisplay') {
                // Verified Members display - skip (controlled by Total Users)
                return;
            } else if (prefix === '' && suffix === '' && element.id === 'verificationsTotalDisplay') {
                // For Verification Submissions in overlay, add random 5-20 per second
                const randomIncrease = Math.floor(Math.random() * 16) + 5; // 5-20
                element._unroundedValue += randomIncrease;
                element._currentValue = element._unroundedValue;
                
                const formattedValue = element._unroundedValue.toLocaleString('en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                element.textContent = formattedValue;
                
                // Distribute the increase between Pro and Business
                // Pro gets 60-75% of the increase (faster growth)
                // Business gets 25-40% of the increase (slower but consistent growth)
                const proPercent = 0.60 + (Math.random() * 0.15); // 60-75%
                const proIncrease = Math.round(randomIncrease * proPercent);
                const businessIncrease = randomIncrease - proIncrease; // Remaining goes to business
                
                const proDisplay = document.getElementById('verificationsProDisplay');
                if (proDisplay) {
                    // Initialize if not set
                    if (!proDisplay._unroundedValue) proDisplay._unroundedValue = parseInt(proDisplay.textContent) || 8;
                    
                    proDisplay._unroundedValue += proIncrease;
                    proDisplay._currentValue = proDisplay._unroundedValue;
                    proDisplay.textContent = proDisplay._unroundedValue.toLocaleString('en-US');
                }
                
                const businessDisplay = document.getElementById('verificationsBusinessDisplay');
                if (businessDisplay) {
                    // Initialize if not set
                    if (!businessDisplay._unroundedValue) businessDisplay._unroundedValue = parseInt(businessDisplay.textContent) || 4;
                    
                    businessDisplay._unroundedValue += businessIncrease;
                    businessDisplay._currentValue = businessDisplay._unroundedValue;
                    businessDisplay.textContent = businessDisplay._unroundedValue.toLocaleString('en-US');
                }
                
                // Also update the main dashboard verification card if not filtering
                const dateRangeSelect = document.getElementById('verificationsDateRange');
                const isAllTime = !dateRangeSelect || dateRangeSelect.value === 'all';
                
                if (isAllTime) {
                    const mainVerificationsCard = document.getElementById('verificationsNumber');
                    if (mainVerificationsCard) {
                        mainVerificationsCard._currentValue = element._unroundedValue;
                        mainVerificationsCard.textContent = element._unroundedValue.toLocaleString('en-US');
                    }
                    
                    // Save to localStorage every 5 seconds
                    if (!element._saveCounter) element._saveCounter = 0;
                    element._saveCounter++;
                    if (element._saveCounter >= 5) {
                        element._saveCounter = 0;
                        const currentData = loadMockDataFromStorage();
                        currentData.verifications = Math.round(element._unroundedValue);
                        saveMockDataToStorage(currentData);
                    }
                }
                
                console.log(`📝 Verifications +${randomIncrease}: Total=${formattedValue} | Pro +${proIncrease} | Business +${businessIncrease}`);
            } else if (prefix === '' && suffix === '' && element.id === 'verificationsProDisplay') {
                // Pro display - skip (controlled by Total Verifications)
                return;
            } else if (prefix === '' && suffix === '' && element.id === 'verificationsBusinessDisplay') {
                // Business display - skip (controlled by Total Verifications)
                return;
            } else if (prefix === '' && suffix === '' && element.id === 'verificationsOverdueDisplay') {
                // Overdue Verifications - FLUCTUATE every 10 seconds (max 20)
                if (!element._fluctuateCounter) element._fluctuateCounter = 0;
                element._fluctuateCounter++;
                
                // Only update every 10 seconds
                if (element._fluctuateCounter >= 10) {
                    element._fluctuateCounter = 0;
                    
                    const maxValue = element._maxValue || 20;
                    const currentValue = element._currentValue || 0;
                    
                    // Random fluctuation: add 1-10 or subtract 1-10
                    const change = Math.floor(Math.random() * 10) + 1; // 1-10
                    const shouldIncrease = Math.random() > 0.5;
                    
                    let newValue;
                    if (shouldIncrease) {
                        newValue = Math.min(maxValue, currentValue + change);
                    } else {
                        newValue = Math.max(0, currentValue - change);
                    }
                    
                    element._unroundedValue = newValue;
                    element._currentValue = newValue;
                    element.textContent = newValue.toLocaleString('en-US');
                    
                    const direction = shouldIncrease ? '📈' : '📉';
                    console.log(`${direction} Overdue Verifications ${shouldIncrease ? '+' : '-'}${change}: ${newValue}`);
                }
                return;
            } else if (prefix === '' && suffix === '' && element.id === 'gigsReportedTotalDisplay') {
                // Gigs Reported Total - FLUCTUATE every 10 seconds (max 100)
                if (!element._fluctuateCounter) element._fluctuateCounter = 0;
                element._fluctuateCounter++;
                
                // Only update every 10 seconds
                if (element._fluctuateCounter >= 10) {
                    element._fluctuateCounter = 0;
                    
                    const maxValue = element._maxValue || 100;
                    const currentValue = element._currentValue || 0;
                    
                    // Random fluctuation: add 1-15 or subtract 1-15
                    const change = Math.floor(Math.random() * 15) + 1; // 1-15
                    const shouldIncrease = Math.random() > 0.5;
                    
                    let newValue;
                    if (shouldIncrease) {
                        newValue = Math.min(maxValue, currentValue + change);
                    } else {
                        newValue = Math.max(5, currentValue - change); // Min 5
                    }
                    
                    element._unroundedValue = newValue;
                    element._currentValue = newValue;
                    element.textContent = newValue.toLocaleString('en-US');
                    
                    // Also update This Week (25% of total)
                    const weekDisplay = document.getElementById('gigsReportedWeekDisplay');
                    if (weekDisplay) {
                        const weekValue = Math.round(newValue * 0.25);
                        weekDisplay._unroundedValue = weekValue;
                        weekDisplay._currentValue = weekValue;
                        weekDisplay.textContent = weekValue.toLocaleString('en-US');
                    }
                    
                    const direction = shouldIncrease ? '📈' : '📉';
                    console.log(`${direction} Gigs Reported ${shouldIncrease ? '+' : '-'}${change}: ${newValue}`);
                }
                return;
            } else if (prefix === '' && suffix === '' && element.id === 'gigsReportedWeekDisplay') {
                // Week display - skip (controlled by Total Reported)
                return;
            } else {
                // For growth percentage and other non-PHP displays
                element._unroundedValue *= 1.001; // Increase by 0.1%
                element._currentValue = element._unroundedValue;
                
                const formattedValue = element._unroundedValue.toLocaleString('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                });
                element.textContent = `${prefix}${formattedValue}${suffix}`;
            }
        }, 1000); // Every 1 second
        
        return;
    }
    
    const incrementPercentage = 0.001; // 0.1%
    const increment = range * incrementPercentage;
    const steps = Math.ceil(range / increment);
    const stepDuration = duration / steps;
    
    let current = start;
    let stepCount = 0;
    
    const initialTimer = setInterval(() => {
        current += increment;
        stepCount++;
        
        // When we reach the target, start continuous incrementing
        if (current >= end || stepCount >= steps) {
            current = end;
            clearInterval(initialTimer);
            
            // Format and display final value
            const formattedValue = current.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            element.textContent = `${prefix}${formattedValue}${suffix}`;
            
            // Phase 2: Start continuous incrementing every 1 second
            element._currentValue = current;
            element._unroundedValue = current; // Track unrounded value for accurate increments
            element._saveCounter = 0; // Track for periodic saves
            
            // Skip continuous phase for elements that will be updated by other elements
            if (element.id === 'regionPieTotal' || element.id === 'accountTypePieTotal' || 
                element.id === 'usersNewDisplay' || element.id === 'usersVerifiedDisplay' ||
                element.id === 'newMemberLegend' || element.id === 'proVerifiedLegend' || element.id === 'businessVerifiedLegend' ||
                element.id === 'verificationsProDisplay' || element.id === 'verificationsBusinessDisplay' ||
                element.id === 'verificationsOverdueDisplay' || element.id === 'gigsReportedThisWeek') {
                // These elements are controlled by their parent element, no continuous timer needed
                return;
            }
            
            element._continuousTimer = setInterval(() => {
                // For PHP revenue, add random increments (100/250/500)
                if (prefix === '₱') {
                    const increments = [100, 250, 500];
                    const randomIncrement = increments[Math.floor(Math.random() * increments.length)];
                    element._unroundedValue += randomIncrement;
                    
                    let displayValue = element._unroundedValue;
                    let displayDecimals = 0; // Always show whole numbers for PHP
                    
                    element._currentValue = displayValue;
                    
                    // Also update the main revenue card if this is the PHP display in overlay
                    // and we're viewing the current month (not a filtered view)
                    if (element.id === 'revenuePHPDisplay') {
                        const dateRangeSelect = document.getElementById('revenueDateRange');
                        const isCurrentMonth = !dateRangeSelect || dateRangeSelect.value === 'current';
                        
                        if (isCurrentMonth) {
                            const mainRevenueCard = document.getElementById('revenueNumber');
                            if (mainRevenueCard) {
                                const mainFormatted = displayValue.toLocaleString('en-US', {
                                    minimumFractionDigits: displayDecimals,
                                    maximumFractionDigits: displayDecimals
                                });
                                mainRevenueCard.textContent = `₱${mainFormatted}`;
                                // Sync the current value so dashboard timer continues correctly
                                mainRevenueCard._currentValue = displayValue;
                            }
                        }
                        
                        // Save to localStorage every 5 seconds
                        element._saveCounter++;
                        if (element._saveCounter >= 5) {
                            element._saveCounter = 0;
                            const currentData = loadMockDataFromStorage();
                            currentData.revenue = Math.round(displayValue);
                            saveMockDataToStorage(currentData);
                        }
                    }
                    
                    const formattedValue = displayValue.toLocaleString('en-US', {
                        minimumFractionDigits: displayDecimals,
                        maximumFractionDigits: displayDecimals
                    });
                    element.textContent = `${prefix}${formattedValue}${suffix}`;
                    
                    // Also update USD display based on PHP value
                    const usdDisplay = document.getElementById('revenueUSDDisplay');
                    if (usdDisplay && element.id === 'revenuePHPDisplay') {
                        const exchangeRate = 57; // ₱57 = $1 USD
                        const usdValue = element._unroundedValue / exchangeRate;
                        usdDisplay._unroundedValue = usdValue;
                        usdDisplay._currentValue = usdValue;
                        
                        const usdFormatted = usdValue.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        usdDisplay.textContent = `$${usdFormatted}`;
                    }
                    
                    console.log(`💰 Revenue increased by ${randomIncrement}: ${prefix}${formattedValue}${suffix}`);
                } else if (prefix === '' && suffix === '' && element.id === 'usersTotalDisplay') {
                    // For Total Users in overlay, add random 1-25
                    const randomIncrease = Math.floor(Math.random() * 25) + 1;
                    element._unroundedValue += randomIncrease;
                    element._currentValue = element._unroundedValue;
                    
                    const formattedValue = element._unroundedValue.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });
                    element.textContent = formattedValue;
                    
                    // Save to localStorage every 5 seconds to prevent data loss on refresh
                    if (!element._saveCounter) element._saveCounter = 0;
                    element._saveCounter++;
                    if (element._saveCounter >= 5) {
                        element._saveCounter = 0;
                        const currentData = loadMockDataFromStorage();
                        currentData.totalUsers = Math.round(element._unroundedValue);
                        saveMockDataToStorage(currentData);
                    }
                    
                    // Also update New Members (35% unverified) and Verified Members (65% verified)
                    const newDisplay = document.getElementById('usersNewDisplay');
                    const verifiedDisplay = document.getElementById('usersVerifiedDisplay');
                    if (newDisplay && verifiedDisplay) {
                        const totalUsers = Math.round(element._unroundedValue);
                        
                        // 65% are verified, 35% are unverified new members
                        const verifiedValue = Math.round(totalUsers * 0.65);
                        const newValue = totalUsers - verifiedValue; // Ensures they add up to total
                        
                        newDisplay._unroundedValue = newValue;
                        newDisplay._currentValue = newValue;
                        newDisplay.textContent = newValue.toLocaleString('en-US');
                        
                        verifiedDisplay._unroundedValue = verifiedValue;
                        verifiedDisplay._currentValue = verifiedValue;
                        verifiedDisplay.textContent = verifiedValue.toLocaleString('en-US');
                    }
                    
                    // Also update Regional Distribution and Account Types totals to match
                    const regionPieTotal = document.getElementById('regionPieTotal');
                    const accountTypePieTotal = document.getElementById('accountTypePieTotal');
                    
                    if (regionPieTotal) {
                        regionPieTotal._unroundedValue = element._unroundedValue;
                        regionPieTotal._currentValue = element._unroundedValue;
                        regionPieTotal.textContent = element._unroundedValue.toLocaleString('en-US');
                    }
                    
                    if (accountTypePieTotal) {
                        // Account Types total should equal Total Users
                        const totalUsers = Math.round(element._unroundedValue);
                        
                        accountTypePieTotal._unroundedValue = totalUsers;
                        accountTypePieTotal._currentValue = totalUsers;
                        accountTypePieTotal.textContent = totalUsers.toLocaleString('en-US');
                        
                        // Also update Account Types legend values
                        if (accountTypePieTotal._verifiedPercent && accountTypePieTotal._proPercentOfVerified) {
                            const newMemberLegend = document.getElementById('newMemberLegend');
                            const proVerifiedLegend = document.getElementById('proVerifiedLegend');
                            const businessVerifiedLegend = document.getElementById('businessVerifiedLegend');
                            
                            if (newMemberLegend && newMemberLegend._syncWithPieChart) {
                                // Calculate from total users using stored percentages
                                const verifiedTotal = Math.round(totalUsers * accountTypePieTotal._verifiedPercent); // 65%
                                const newMemberValue = totalUsers - verifiedTotal; // 35%
                                
                                newMemberLegend._unroundedValue = newMemberValue;
                                newMemberLegend._currentValue = newMemberValue;
                                newMemberLegend.textContent = newMemberValue.toLocaleString('en-US');
                                
                                // Update Pro (percentage of verified)
                                if (proVerifiedLegend && proVerifiedLegend._syncWithPieChart) {
                                    const proValue = Math.round(verifiedTotal * accountTypePieTotal._proPercentOfVerified);
                                    proVerifiedLegend._unroundedValue = proValue;
                                    proVerifiedLegend._currentValue = proValue;
                                    proVerifiedLegend.textContent = proValue.toLocaleString('en-US');
                                    
                                    // Update Business (remaining verified)
                                    if (businessVerifiedLegend && businessVerifiedLegend._syncWithPieChart) {
                                        const businessValue = verifiedTotal - proValue;
                                        businessVerifiedLegend._unroundedValue = businessValue;
                                        businessVerifiedLegend._currentValue = businessValue;
                                        businessVerifiedLegend.textContent = businessValue.toLocaleString('en-US');
                                    }
                                }
                            }
                        }
                    }
                    
                    console.log(`👥 Users increased by ${randomIncrease}: ${formattedValue}`);
                } else if (prefix === '' && suffix === '' && element.id === 'usersNewDisplay') {
                    // New Members display - skip (controlled by Total Users)
                    return;
                } else if (prefix === '' && suffix === '' && element.id === 'usersVerifiedDisplay') {
                    // Verified Members display - skip (controlled by Total Users)
                    return;
                } else if (prefix === '' && suffix === '' && element.id === 'verificationsTotalDisplay') {
                    // For Verification Submissions in overlay, add random 5-20 per second
                    const randomIncrease = Math.floor(Math.random() * 16) + 5; // 5-20
                    element._unroundedValue += randomIncrease;
                    element._currentValue = element._unroundedValue;
                    
                    const formattedValue = element._unroundedValue.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });
                    element.textContent = formattedValue;
                    
                    // Also update Pro Display (60-80% of total)
                    const proDisplay = document.getElementById('verificationsProDisplay');
                    if (proDisplay) {
                        const proPercent = 0.60 + (Math.random() * 0.20);
                        const proValue = Math.round(element._unroundedValue * proPercent);
                        proDisplay._unroundedValue = proValue;
                        proDisplay._currentValue = proValue;
                        proDisplay.textContent = proValue.toLocaleString('en-US');
                    }
                    
                    console.log(`📝 Verifications increased by ${randomIncrease}: ${formattedValue}`);
                } else if (prefix === '' && suffix === '' && (element.id === 'verificationsProDisplay' || element.id === 'verificationsOverdueDisplay')) {
                    // Pro/Overdue displays - skip (controlled by Total Verifications)
                    return;
                } else {
                    // For growth percentage and other non-PHP displays
                    element._unroundedValue *= 1.001; // Increase by 0.1%
                    element._currentValue = element._unroundedValue;
                    
                    const formattedValue = element._unroundedValue.toLocaleString('en-US', {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    });
                    element.textContent = `${prefix}${formattedValue}${suffix}`;
                }
            }, 1000); // Every 1 second
            
            return;
        }
        
        // Format and display
        const formattedValue = current.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        
        element.textContent = `${prefix}${formattedValue}${suffix}`;
    }, stepDuration);
    
    // Store timer reference for cleanup
    element._countingTimer = initialTimer;
}

// Stop counting animation when overlay closes
function stopCountingAnimation(element) {
    if (element._countingTimer) {
        clearInterval(element._countingTimer);
        element._countingTimer = null;
    }
    if (element._continuousTimer) {
        clearInterval(element._continuousTimer);
        element._continuousTimer = null;
    }
    // Keep the current values for smooth transitions when reopening
    // element._currentValue and element._unroundedValue are preserved
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
function initializeDropdownFilters() {
    // Date range filters
    const usersDateRange = document.getElementById('usersDateRange');
    const verificationsDateRange = document.getElementById('verificationsDateRange');
    const revenueDateRange = document.getElementById('revenueDateRange');
    const gigsReportedDateRange = document.getElementById('gigsReportedDateRange');
    
    if (usersDateRange) {
        usersDateRange.addEventListener('change', function() {
            console.log(`📅 Users filter changed to: ${this.value}`);
            populateTotalUsersData(loadMockDataFromStorage());
        });
    }
    
    if (verificationsDateRange) {
        verificationsDateRange.addEventListener('change', function() {
            console.log(`📅 Verifications filter changed to: ${this.value}`);
            populateVerificationsData(loadMockDataFromStorage());
        });
    }
    
    if (revenueDateRange) {
        revenueDateRange.addEventListener('change', function() {
            console.log(`📅 Revenue filter changed to: ${this.value}`);
            populateRevenueData(loadMockDataFromStorage());
        });
    }
    
    if (gigsReportedDateRange) {
        gigsReportedDateRange.addEventListener('change', function() {
            console.log(`📅 Gigs Reported filter changed to: ${this.value}`);
            populateGigsReportedData(loadMockDataFromStorage());
        });
    }
    
    console.log('✅ Dropdown filters initialized with change listeners');
}

// Initialize reset button in settings
function initializeResetButton() {
    const resetBtn = document.getElementById('resetMockDataBtn');
    
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            // Confirm before resetting
            if (confirm('⚠️ Are you sure you want to reset all analytics data?\n\nThis will clear:\n• Total Users count\n• User Activity metrics\n• Verification Submissions\n• Total Revenue\n• Gigs Analytics (Gigs & Applications)\n• Gigs Reported\n\nThe page will refresh with new baseline values.')) {
                // Call the reset function
                window.resetAdminMockData();
                
                // Show success message
                alert('✅ Analytics data has been reset!\n\nThe page will now refresh.');
                
                // Refresh the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        });
        
        console.log('✅ Reset button initialized');
    }
}

// Reset function (accessible from console and button)
window.resetAdminMockData = function() {
    // Clear all mock data from localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
    });
    
    console.log('🔄 Mock data reset! Refresh the page to generate new baseline values.');
    console.log('💡 New baseline:');
    console.log('   • Total Users: 50-99');
    console.log('   • Revenue: ₱10,000 - ₱15,000');
    console.log('   • Gigs: 68-75% of users');
    console.log('   • Applications: 2-3x gigs');
};

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
    logoutBtn.addEventListener('click', function() {
        console.log('🚪 Logging out...');
        // TODO: FIREBASE - Implement Firebase signOut()
        // For now, redirect to landing page
        window.location.href = 'landing.html';
    });
    
    console.log('✅ Admin dropdown initialized');
}

// ===== USER MANAGEMENT SYSTEM =====

let currentUserTab = 'new'; // Track current tab: 'new', 'pending', 'verified', 'suspended'
let currentUserData = null; // Track currently selected user
let allUsers = []; // Store all user data

function initializeUserManagement() {
    console.log('👥 Initializing User Management system');
    
    // Generate mock user data
    generateMockUserData();
    
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
    
    // Initialize image lightbox
    initializeImageLightbox();
    
    // Load initial users (new tab)
    loadUserCards('new');
    
    console.log('✅ User Management initialized');
}

function generateMockUserData() {
    // Sample Filipino names
    const firstNames = ['Maria', 'Jose', 'Juan', 'Ana', 'Pedro', 'Rosa', 'Miguel', 'Carmen', 'Luis', 'Sofia', 'Carlos', 'Isabel', 'Roberto', 'Teresa', 'Diego', 'Elena', 'Manuel', 'Patricia', 'Antonio', 'Luz', 'Fernando', 'Gloria', 'Rafael', 'Angelica', 'Gabriel', 'Cristina', 'Pablo', 'Mariana', 'Ricardo', 'Beatriz', 'Jorge', 'Valentina', 'Andres', 'Victoria', 'Francisco', 'Adriana', 'Javier', 'Monica', 'Eduardo', 'Camila', 'Daniel', 'Andrea', 'Alejandro', 'Sandra', 'Marcos', 'Natalia', 'Raul', 'Claudia', 'Sergio', 'Laura', 'Oscar', 'Veronica', 'Enrique', 'Diana', 'Gustavo'];
    
    const lastNames = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Gonzales', 'Lopez', 'Ramos', 'Flores', 'Rivera', 'Gomez', 'Fernandez', 'Martinez', 'Rodriguez', 'Hernandez', 'Castillo', 'Morales', 'Aquino', 'Jimenez', 'Romero', 'Salazar', 'Villanueva', 'Castro', 'Santiago', 'Perez', 'Diaz', 'Alvarez', 'Rojas', 'Gutierrez', 'Navarro', 'Pascual', 'Del Rosario', 'San Jose', 'Mercado', 'Aguilar', 'Valdez', 'Corpuz'];
    
    const cities = ['Cebu City', 'Mandaue City', 'Lapu-Lapu City', 'Talisay City', 'Toledo City', 'Danao City', 'Naga City', 'Carcar City', 'Bogo City', 'Tagbilaran City', 'Tacloban City', 'Ormoc City', 'Bacolod City', 'Dumaguete City', 'Iloilo City', 'Cagayan de Oro', 'Davao City', 'Manila', 'Quezon City', 'Makati'];
    
    const regions = ['CEBU', 'BOHOL', 'LEYTE', 'NEGROS', 'PANAY', 'SAMAR', 'MASBATE', 'DAVAO', 'MANILA'];
    
    const educationLevels = ['No Highschool', 'Highschool Diploma', 'Associates', 'Bachelors', 'Masters', 'Doctorate'];
    
    const introductions = [
        "Hello! I'm a reliable and hardworking individual with experience in various service jobs. I take great pride in delivering quality work and building lasting relationships with clients.",
        "Hi there! I'm passionate about helping others and providing excellent service. I have strong communication skills and always strive to exceed expectations.",
        "Greetings! I'm a dedicated professional with a positive attitude and strong work ethic. I believe in doing every job with excellence and integrity.",
        "Welcome! I'm an experienced worker who values punctuality and attention to detail. I'm always ready to learn new skills and take on new challenges.",
        "Hey! I'm a friendly and approachable person who loves connecting with people. I have diverse experience and enjoy making a positive impact through my work."
    ];
    
    // Generate Philippine public IP addresses
    function generatePhilippineIP() {
        // Common Philippine ISP ranges
        const ranges = [
            [112, 198], [112, 199], [112, 200], [112, 201], // PLDT
            [180, 190], [180, 191], [180, 192], [180, 193], // Globe
            [120, 28], [120, 29], [120, 30], // Smart
            [203, 177], [203, 178], [203, 179], // Converge
            [49, 144], [49, 145], [49, 146] // Various ISPs
        ];
        const range = ranges[Math.floor(Math.random() * ranges.length)];
        const third = Math.floor(Math.random() * 256);
        const fourth = Math.floor(Math.random() * 256);
        return `${range[0]}.${range[1]}.${third}.${fourth}`;
    }
    
    // Generate users
    const totalUsers = 55;
    
    for (let i = 0; i < totalUsers; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        
        // Status distribution
        let status, verificationStatus;
        if (i < 8) {
            status = 'new';
            verificationStatus = 'NEW MEMBER';
        } else if (i < 11) {
            status = 'pending';
            verificationStatus = 'NEW MEMBER';
        } else if (i < 53) {
            status = 'verified';
            // 70% PRO, 30% BUSINESS
            verificationStatus = Math.random() < 0.7 ? 'PRO VERIFIED' : 'BUSINESS VERIFIED';
        } else {
            status = 'suspended';
            verificationStatus = Math.random() < 0.5 ? 'NEW MEMBER' : 'PRO VERIFIED';
        }
        
        // Reviews and rating (only for verified users with some history)
        let reviewCount = 0;
        let rating = 0;
        if (status === 'verified' || status === 'suspended') {
            reviewCount = Math.floor(Math.random() * 30) + (Math.random() < 0.3 ? 0 : 1);
            if (reviewCount > 0) {
                rating = Math.random() < 0.8 ? 
                    (Math.random() * 1.5 + 3.5) : // 80% good ratings (3.5-5)
                    (Math.random() * 3 + 1); // 20% lower ratings (1-4)
            }
        }
        
        // Age (18-65)
        const age = Math.floor(Math.random() * 47) + 18;
        const birthYear = 2025 - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const birthdate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
        
        // Registration date (within last 3 months for new, older for others)
        const regDaysAgo = status === 'new' ? 
            Math.floor(Math.random() * 7) : 
            Math.floor(Math.random() * 365);
        const registeredDate = new Date();
        registeredDate.setDate(registeredDate.getDate() - regDaysAgo);
        
        // Social media (60% have at least one)
        const hasSocialMedia = Math.random() < 0.6;
        const socialMediaLinks = hasSocialMedia ? {
            facebook: Math.random() < 0.9 ? `https://facebook.com/${firstName.toLowerCase()}${lastName.toLowerCase()}` : null,
            instagram: Math.random() < 0.5 ? `https://instagram.com/${firstName.toLowerCase()}_${lastName.toLowerCase()}` : null,
            linkedin: Math.random() < 0.3 ? `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}` : null
        } : {};
        
        // Gigs and applications (higher for verified users)
        const gigsListed = status === 'verified' ? Math.floor(Math.random() * 15) + 1 : Math.floor(Math.random() * 3);
        const applications = status === 'verified' ? Math.floor(Math.random() * 25) + 5 : Math.floor(Math.random() * 8);
        
        // Region and City
        const region = regions[Math.floor(Math.random() * regions.length)];
        const city = cities[Math.floor(Math.random() * cities.length)];
        
        // Education
        const education = educationLevels[Math.floor(Math.random() * educationLevels.length)];
        
        // Introduction
        const introduction = introductions[Math.floor(Math.random() * introductions.length)];
        
        // Avatar (cycle through available user images)
        const avatarNum = (i % 11) + 1;
        const avatar = avatarNum === 1 ? 'public/users/Peter-J-Ang-User-01.jpg' : `public/users/User-${String(avatarNum).padStart(2, '0')}.jpg`;
        
        // Verification images (for pending users)
        const verificationImages = status === 'pending' ? {
            idImage: `public/images/Selfie-ID.jpg`, // Mock ID image
            selfieImage: `public/images/Selfie-ID.jpg` // Mock selfie image
        } : null;
        
        // Suspended info (for suspended users)
        const suspendedInfo = status === 'suspended' ? {
            suspendedBy: 'Admin: Peter J. Ang',
            suspensionDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } : null;
        
        allUsers.push({
            id: `user-${i + 1}`,
            fullName,
            avatar,
            verificationStatus,
            status,
            reviewCount,
            rating,
            age,
            birthdate,
            registeredDate,
            socialMediaLinks,
            gigsListed,
            applications,
            region,
            city,
            education,
            introduction,
            ipAddress: generatePhilippineIP(),
            verificationImages,
            suspendedInfo
        });
    }
    
    console.log(`📊 Generated ${allUsers.length} mock users`);
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
}

function loadUserCards(tabType) {
    const userCardsList = document.getElementById('userCardsList');
    if (!userCardsList) return;
    
    // Filter users by tab type
    let filteredUsers;
    
    if (tabType === 'new') {
        filteredUsers = allUsers.filter(user => user.status === 'new');
    } else if (tabType === 'pending') {
        filteredUsers = allUsers.filter(user => user.status === 'pending');
    } else if (tabType === 'verified') {
        filteredUsers = allUsers.filter(user => user.status === 'verified');
    } else if (tabType === 'suspended') {
        filteredUsers = allUsers.filter(user => user.status === 'suspended');
    }
    
    // Update tab counts
    updateUserTabCounts();
    
    // Generate HTML
    userCardsList.innerHTML = filteredUsers.map(user => generateUserCardHTML(user)).join('');
    
    // Update stats
    const usersStats = document.getElementById('usersStats');
    if (usersStats) {
        usersStats.textContent = `Showing ${filteredUsers.length} users`;
    }
    
    // Attach click handlers
    attachUserCardHandlers();
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
    
    return `
        <div class="user-card" data-user-id="${user.id}">
            <img src="${user.avatar}" alt="${user.fullName}" class="user-card-avatar">
            <div class="user-card-info">
                <div class="user-card-header">
                    <div class="user-card-name">${user.fullName}</div>
                    <div class="user-card-status ${statusClass}">${user.verificationStatus}</div>
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
                        <span>${user.age} years old</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateUserTabCounts() {
    const newCount = allUsers.filter(u => u.status === 'new').length;
    const pendingCount = allUsers.filter(u => u.status === 'pending').length;
    const verifiedCount = allUsers.filter(u => u.status === 'verified').length;
    const suspendedCount = allUsers.filter(u => u.status === 'suspended').length;
    
    const newCountEl = document.getElementById('newUsersCount');
    const pendingCountEl = document.getElementById('pendingUsersCount');
    const verifiedCountEl = document.getElementById('verifiedUsersCount');
    const suspendedCountEl = document.getElementById('suspendedUsersCount');
    
    if (newCountEl) newCountEl.textContent = newCount;
    if (pendingCountEl) pendingCountEl.textContent = pendingCount;
    if (verifiedCountEl) verifiedCountEl.textContent = verifiedCount;
    if (suspendedCountEl) suspendedCountEl.textContent = suspendedCount;
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
    document.getElementById('userBirthdate').textContent = new Date(user.birthdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('userAge').textContent = `${user.age} years old`;
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
    
    if (user.status === 'suspended') {
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
    } else if (user.status === 'suspended') {
        // Show suspended info and permanent ban section
        if (suspendedInfoSection && user.suspendedInfo) {
            suspendedInfoSection.style.display = 'block';
            document.getElementById('suspendedBy').textContent = user.suspendedInfo.suspendedBy;
            document.getElementById('suspensionDate').textContent = user.suspendedInfo.suspensionDate;
        }
        if (permBanSection) {
            permBanSection.style.display = 'block';
            document.getElementById('userIpAddress').textContent = user.ipAddress;
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
            // TODO: Navigate to profile page
            showToast('View Profile feature coming soon!', 'info');
        });
    }
    
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

function closeUserDetail() {
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
}

function initializeUserSearch() {
    const searchInput = document.getElementById('usersSearchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query === '') {
            // Show all users in current tab
            loadUserCards(currentUserTab);
            return;
        }
        
        // Filter users in current tab
        let filteredUsers = allUsers.filter(user => {
            return user.status === currentUserTab &&
                   (user.fullName.toLowerCase().includes(query) ||
                    user.region.toLowerCase().includes(query) ||
                    user.city.toLowerCase().includes(query));
        });
        
        // Update display
        const userCardsList = document.getElementById('userCardsList');
        if (userCardsList) {
            userCardsList.innerHTML = filteredUsers.map(user => generateUserCardHTML(user)).join('');
            attachUserCardHandlers();
        }
        
        const usersStats = document.getElementById('usersStats');
        if (usersStats) {
            usersStats.textContent = `Showing ${filteredUsers.length} of ${allUsers.filter(u => u.status === currentUserTab).length} users`;
        }
    });
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
    
    // Close overlay
    const closeOverlay = () => {
        overlay.classList.remove('active');
        messageInput.value = '';
        attachmentPreview.style.display = 'none';
        attachmentInput.value = '';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (cancelBtn) cancelBtn.addEventListener('click', closeOverlay);
    
    // Attach image
    if (attachBtn && attachmentInput) {
        attachBtn.addEventListener('click', () => {
            attachmentInput.click();
        });
        
        attachmentInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    attachmentImg.src = e.target.result;
                    attachmentPreview.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Remove attachment
    if (removeAttachment) {
        removeAttachment.addEventListener('click', () => {
            attachmentPreview.style.display = 'none';
            attachmentInput.value = '';
        });
    }
    
    // Send message
    if (sendBtn) {
        sendBtn.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (!message) {
                showToast('Please enter a message', 'error');
                return;
            }
            
            // TODO: Send message via Firebase
            showToast(`Message sent to ${currentUserData.fullName}`, 'success');
            closeOverlay();
        });
    }
}

function showContactUserOverlay() {
    const overlay = document.getElementById('contactUserOverlay');
    const userInfoDisplay = document.getElementById('contactUserInfoDisplay');
    
    if (userInfoDisplay && currentUserData) {
        userInfoDisplay.innerHTML = `
            <img src="${currentUserData.avatar}" alt="${currentUserData.fullName}">
            <div class="contact-user-info-name">${currentUserData.fullName}</div>
        `;
    }
    
    overlay.classList.add('active');
}

function initializeUserConfirmationOverlays() {
    // Suspend User
    const suspendConfirm = document.getElementById('confirmSuspendUserBtn');
    const suspendCancel = document.getElementById('cancelSuspendUserBtn');
    
    if (suspendConfirm) {
        suspendConfirm.addEventListener('click', () => {
            suspendUser(currentUserData);
            document.getElementById('suspendUserConfirmOverlay').classList.remove('active');
        });
    }
    
    if (suspendCancel) {
        suspendCancel.addEventListener('click', () => {
            document.getElementById('suspendUserConfirmOverlay').classList.remove('active');
        });
    }
    
    // Restore User
    const restoreConfirm = document.getElementById('confirmRestoreUserBtn');
    const restoreCancel = document.getElementById('cancelRestoreUserBtn');
    
    if (restoreConfirm) {
        restoreConfirm.addEventListener('click', () => {
            restoreUser(currentUserData);
            document.getElementById('restoreUserConfirmOverlay').classList.remove('active');
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
    
    // Permanent Ban
    const permBanConfirm = document.getElementById('confirmPermBanUserBtn');
    const permBanCancel = document.getElementById('cancelPermBanUserBtn');
    
    if (permBanConfirm) {
        permBanConfirm.addEventListener('click', () => {
            permanentlyBanUser(currentUserData);
            document.getElementById('permBanUserConfirmOverlay').classList.remove('active');
        });
    }
    
    if (permBanCancel) {
        permBanCancel.addEventListener('click', () => {
            document.getElementById('permBanUserConfirmOverlay').classList.remove('active');
        });
    }
}

function showSuspendUserConfirmation() {
    const overlay = document.getElementById('suspendUserConfirmOverlay');
    overlay.classList.add('active');
}

function showRestoreUserConfirmation() {
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
    const overlay = document.getElementById('permBanUserConfirmOverlay');
    overlay.classList.add('active');
}

function suspendUser(user) {
    // Update user status
    user.status = 'suspended';
    user.suspendedInfo = {
        suspendedBy: 'Admin: Peter J. Ang',
        suspensionDate: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    
    // Reload current tab
    loadUserCards(currentUserTab);
    closeUserDetail();
    
    showToast(`${user.fullName} has been suspended`, 'success', 2000);
}

function restoreUser(user) {
    // Restore to previous status (assume PRO VERIFIED for simplicity)
    user.status = 'verified';
    if (user.verificationStatus === 'NEW MEMBER') {
        user.verificationStatus = 'PRO VERIFIED';
    }
    user.suspendedInfo = null;
    
    // Reload current tab
    loadUserCards(currentUserTab);
    closeUserDetail();
    
    showToast(`${user.fullName} has been restored`, 'success', 2000);
}

function approveVerification(user) {
    // Approve verification
    user.status = 'verified';
    user.verificationStatus = 'PRO VERIFIED';
    user.verificationImages = null;
    
    // Reload current tab
    loadUserCards(currentUserTab);
    closeUserDetail();
    
    showToast(`${user.fullName}'s verification has been approved`, 'success', 2000);
}

function revokeVerification(user) {
    // Revoke verification
    user.verificationStatus = 'NEW MEMBER';
    
    // Update display
    if (currentUserData && currentUserData.id === user.id) {
        displayUserDetails(user);
    }
    
    // Reload cards to update badge
    loadUserCards(currentUserTab);
    
    showToast(`${user.fullName}'s verification has been revoked`, 'success', 2000);
}

function permanentlyBanUser(user) {
    // Remove user from array (permanent ban)
    const index = allUsers.findIndex(u => u.id === user.id);
    if (index !== -1) {
        allUsers.splice(index, 1);
    }
    
    // TODO: Add IP to banned list in Firebase
    
    // Reload current tab
    loadUserCards(currentUserTab);
    closeUserDetail();
    
    showToast(`${user.fullName} has been permanently banned (IP: ${user.ipAddress})`, 'success', 3000);
}

function initializeUserDetailOverlay() {
    const overlay = document.getElementById('userDetailOverlay');
    const closeBtn = document.getElementById('userOverlayCloseBtnX');
    const closeFooterBtn = document.getElementById('userOverlayCloseBtn');
    
    // Close overlay
    const closeOverlay = () => {
        overlay.classList.remove('active');
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeOverlay);
    if (closeFooterBtn) closeFooterBtn.addEventListener('click', closeOverlay);
    
    // Mobile action buttons
    const contactBtn = document.getElementById('userOverlayContactBtn');
    const suspendBtn = document.getElementById('userOverlaySuspendBtn');
    const restoreBtn = document.getElementById('userOverlayRestoreBtn');
    
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
}

function showUserDetailOverlay(user) {
    const overlay = document.getElementById('userDetailOverlay');
    const overlayBody = overlay.querySelector('.overlay-body');
    
    // Update header (name, rating, status, and social links)
    document.getElementById('userOverlayName').textContent = user.fullName;
    document.getElementById('userOverlayReviewsCount').textContent = user.reviewCount;
    updateStars('userOverlayStars', user.rating);
    document.getElementById('userOverlayStatusBadge').textContent = user.verificationStatus;
    
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
    
    if (user.status === 'suspended') {
        if (suspendBtn) suspendBtn.style.display = 'none';
        if (restoreBtn) restoreBtn.style.display = 'inline-block';
    } else {
        if (suspendBtn) suspendBtn.style.display = 'inline-block';
        if (restoreBtn) restoreBtn.style.display = 'none';
    }
    
    // Build body content (photo, info boxes, intro)
    let bodyHTML = `
        <!-- User Profile Photo (large, like gig photo) -->
        <div class="user-profile-photo-container">
            <img src="${user.avatar}" alt="${user.fullName}" class="user-profile-photo">
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
                    <div class="user-info-value">${new Date(user.birthdate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">AGE:</div>
                    <div class="user-info-value">${user.age} years old</div>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">EDUCATION:</div>
                    <div class="user-info-value">${user.education}</div>
                </div>
            </div>
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">REGION:</div>
                    <div class="user-info-value">${user.region}</div>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">CITY:</div>
                    <div class="user-info-value">${user.city}</div>
                </div>
            </div>
            <div class="user-info-row">
                <div class="user-info-item">
                    <div class="user-info-label">GIGS LISTED:</div>
                    <div class="user-info-value">${user.gigsListed}</div>
                </div>
                <div class="user-info-item">
                    <div class="user-info-label">APPLICATIONS:</div>
                    <div class="user-info-value">${user.applications}</div>
                </div>
            </div>
        </div>
        
        <div class="user-intro-section">
            <div class="user-intro-label">INTRODUCTION:</div>
            <div class="user-intro-text">${user.introduction}</div>
        </div>
        
        <div class="user-profile-section">
            <button class="view-profile-btn" onclick="showToast('View Profile feature coming soon!', 'info')">
                <span class="profile-btn-icon">👤</span>
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
    } else if (user.status === 'suspended' && user.suspendedInfo) {
        bodyHTML += `
            <div class="user-detail-footer" style="margin-top: 1rem;">
                <div class="suspended-info-section" style="display: block;">
                    <div class="suspended-info-label">SUSPENDED BY:</div>
                    <div class="suspended-info-text">${user.suspendedInfo.suspendedBy}</div>
                    <div class="suspended-info-label" style="margin-top: 1rem;">SUSPENSION DATE:</div>
                    <div class="suspended-info-text">${user.suspendedInfo.suspensionDate}</div>
                </div>
                <div class="perm-ban-section" style="display: block;">
                    <div class="perm-ban-warning">
                        <div class="perm-ban-icon">🚫</div>
                        <div class="perm-ban-text">
                            <strong>Danger Zone:</strong> This action cannot be undone. The user will be permanently banned and their IP address will be blocked from creating new accounts.
                        </div>
                    </div>
                    <div class="perm-ban-ip-display">
                        <div class="perm-ban-ip-label">IP Address:</div>
                        <div class="perm-ban-ip-value">${user.ipAddress}</div>
                    </div>
                    <button class="perm-ban-btn" onclick="showPermBanUserConfirmation()">PERMANENTLY BAN USER</button>
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

// ===== INITIALIZATION COMPLETE =====
console.log('✅ Admin Dashboard JavaScript loaded successfully');
console.log('🎮 Keyboard shortcuts: Alt+1-6 (navigation), Ctrl+K (search)');
console.log('🔧 Console commands:');
console.log('   • resetAdminMockData() - Reset all stat data to baseline values');
