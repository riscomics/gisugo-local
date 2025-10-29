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
    
    // Initialize inbox search
    initializeInboxSearch();
    
    // Initialize message overlay system
    initializeMessageOverlay();
    
    // Initialize gig moderation system
    initializeGigModeration();
    
    // Initialize stat overlay system
    initializeStatOverlays();
    
    // Initialize reset button
    initializeResetButton();
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
function initializeAdminChats() {
    console.log('💭 Initializing Admin Chats System');
    
    // Initialize chat thread handlers  
    initializeChatThreads();
    
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
    
    // Populate chat view in right panel
    populateChatView(threadData);
    
    // Show chat content panel
    document.getElementById('chatDetail').style.display = 'none';
    document.getElementById('chatContent').style.display = 'block';
    
    // Highlight selected thread
    document.querySelectorAll('#chats .conversation-thread').forEach(t => t.classList.remove('selected'));
    threadElement.classList.add('selected');
    
    console.log('💭 Chat conversation loaded:', threadId);
}

function populateChatView(data) {
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
            messageStates[messageId] = {
                status: 'new',
                isReplied: false,
                isRead: false
            };
        }
    });
}

function switchInbox(type) {
    currentInboxType = type;
    
    // Update button states
    document.getElementById('newInboxBtn').classList.toggle('active', type === 'new');
    document.getElementById('oldInboxBtn').classList.toggle('active', type === 'old');
    
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
        } else {
            // Show old/replied/closed messages
            message.style.display = messageState.status === 'old' ? 'block' : 'none';
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
    
    if (!gigContent) return;
    
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
    lastUpdate: 'admin_mock_last_update'         // 🔥 Firebase: /admin/analytics/lastUpdate
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
    
    // Initialize simulation start time and empty revenue history
    const now = Date.now();
    localStorage.setItem(STORAGE_KEYS.simulationStartTime, now);
    localStorage.setItem(STORAGE_KEYS.revenueHistory, JSON.stringify([]));
    
    console.log(`🎬 Simulation started! Date: Jan 8, 2025 (7 days in), All Time Revenue: ₱${allTimeRevenue.toLocaleString()}`);
    
    return {
        totalUsers,
        verifications,
        allTimeRevenue,
        gigsReported,
        timestamp: now
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
        localStorage.setItem(STORAGE_KEYS.lastUpdate, data.timestamp);
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
            timestamp: parseInt(localStorage.getItem(STORAGE_KEYS.lastUpdate)) || Date.now()
        };
    } catch (e) {
        console.error('❌ localStorage not available:', e.message);
        return {
            totalUsers: 85,
            verifications: 12,
            allTimeRevenue: 10000,
            gigsReported: 18,
            timestamp: Date.now()
        };
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
    if (totalUsersEl) {
        let secondsCounter = 0;
        totalUsersEl._dashboardTimer = setInterval(() => {
            const randomIncrease = Math.floor(Math.random() * 25) + 1; // 1-25
            totalUsersEl._currentValue += randomIncrease;
            totalUsersEl.textContent = totalUsersEl._currentValue.toLocaleString();
            
            // Save to localStorage every 5 seconds to prevent data loss on refresh
            secondsCounter++;
            if (secondsCounter >= 5) {
                secondsCounter = 0;
                const currentData = loadMockDataFromStorage();
                currentData.totalUsers = totalUsersEl._currentValue;
                saveMockDataToStorage(currentData);
            }
            
            console.log(`👥 Total Users increased by ${randomIncrease} to:`, totalUsersEl._currentValue);
        }, 1000); // Every 1 second
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
}

// Attach overlay close listeners
function attachOverlayCloseListeners() {
    const closeButtons = [
        { id: 'closeTotalUsersOverlay', overlayId: 'totalUsersOverlay' },
        { id: 'closeVerificationsOverlay', overlayId: 'verificationsOverlay' },
        { id: 'closeRevenueOverlay', overlayId: 'revenueOverlay' },
        { id: 'closeGigsReportedOverlay', overlayId: 'gigsReportedOverlay' }
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
        gigsReported: 'gigsReportedOverlay'
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
    
    // Calculate new members (70-80% of total, unverified) and verified members (remaining)
    const newMemberPercent = 0.70 + (Math.random() * 0.10); // 70-80%
    const newMemberCount = Math.round(exactTotal * newMemberPercent);
    const verifiedMemberCount = exactTotal - newMemberCount; // Remaining are verified (Pro + Business)
    
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
    
    // Calculate growth rate (mock)
    const growthRate = ((Math.random() * 5) + 1).toFixed(1);
    if (growthDisplay) {
        growthDisplay.setAttribute('data-target', growthRate);
        startCountingAnimation(growthDisplay, currentGrowth, parseFloat(growthRate), '+', 150, 1, '%');
        growthDisplay.className = 'revenue-amount growth-positive counting';
    }
    
    // Age distribution (percentages that add to 100)
    // 🔥 FIREBASE TODO: Fetch from /analytics/users/ageGroups/{18-25, 26-40, 41-59, 60+}
    const ageDistribution = generateDistribution(4, exactTotal); // Changed from 5 to 4 groups
    
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
    
    // Regional distribution (Luzon, Visayas, Mindanao)
    const regionDistribution = generateDistribution(3, exactTotal);
    
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
    
    // Account types - Realistic distribution (New Members are majority)
    // Use the same newMemberCount and verifiedMemberCount calculated above for consistency
    // Pro + Business should equal verifiedMemberCount (which is displayed in New Members section)
    const proPercentOfVerified = 0.70 + (Math.random() * 0.10); // 70-80% of verified are Pro
    const proVerifiedCount = Math.round(verifiedMemberCount * proPercentOfVerified);
    const businessVerifiedCount = verifiedMemberCount - proVerifiedCount; // Remaining verified are Business
    
    // Verify: newMemberCount + proVerifiedCount + businessVerifiedCount should equal exactTotal
    console.log(`👥 Account Types Check: ${newMemberCount} (New) + ${proVerifiedCount} (Pro) + ${businessVerifiedCount} (Business) = ${newMemberCount + proVerifiedCount + businessVerifiedCount} (should be ${exactTotal})`)
    
    // Update donut chart with more contrasting colors
    updatePieChart('accountTypePieChart', [
        { value: newMemberCount, color: '#6c5ce7' },  // Purple for New Members
        { value: proVerifiedCount, color: '#00b894' },  // Green for Pro
        { value: businessVerifiedCount, color: '#ff6b6b' }  // Red for Business
    ]);
    
    // Update donut chart center total with counting animation - use exactTotal for consistency
    const accountPieTotal = document.getElementById('accountTypePieTotal');
    if (accountPieTotal) {
        const currentAccountTotal = accountPieTotal._currentValue || 0;
        startCountingAnimation(accountPieTotal, currentAccountTotal, exactTotal, '', 150, 0);
        
        // Store percentage ratios for dynamic updates
        accountPieTotal._newMemberPercent = newMemberPercent;
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
    updateBreakdownBar('inappropriateContent', reasonsDistribution[0], total);
    updateBreakdownBar('scamFraud', reasonsDistribution[1], total);
    updateBreakdownBar('misleadingInfo', reasonsDistribution[2], total);
    updateBreakdownBar('duplicatePosting', reasonsDistribution[3], total);
    updateBreakdownBar('otherReason', reasonsDistribution[4], total);
    
    // Report status
    const pending = Math.floor(total * (0.5 + Math.random() * 0.2)); // 50-70%
    const ignored = Math.floor(total * (0.1 + Math.random() * 0.1)); // 10-20%
    const suspended = total - pending - ignored;
    
    updateBreakdownBar('pendingReview', pending, total);
    updateBreakdownBar('ignoredReports', ignored, total);
    updateBreakdownBar('suspendedReports', suspended, total);
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
                
                // Also update New Members (70-80% of total) and Verified Members (remaining)
                const newDisplay = document.getElementById('usersNewDisplay');
                const verifiedDisplay = document.getElementById('usersVerifiedDisplay');
                if (newDisplay) {
                    const newMemberPercent = 0.70 + (Math.random() * 0.10);
                    const newValue = Math.round(element._unroundedValue * newMemberPercent);
                    newDisplay._unroundedValue = newValue;
                    newDisplay._currentValue = newValue;
                    newDisplay.textContent = newValue.toLocaleString('en-US');
                    
                    // Update Verified Members (total - new)
                    if (verifiedDisplay) {
                        const verifiedValue = element._unroundedValue - newValue;
                        verifiedDisplay._unroundedValue = verifiedValue;
                        verifiedDisplay._currentValue = verifiedValue;
                        verifiedDisplay.textContent = verifiedValue.toLocaleString('en-US');
                    }
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
                    accountTypePieTotal._unroundedValue = element._unroundedValue;
                    accountTypePieTotal._currentValue = element._unroundedValue;
                    accountTypePieTotal.textContent = element._unroundedValue.toLocaleString('en-US');
                    
                    // Also update Account Types legend values based on stored percentages
                    if (accountTypePieTotal._newMemberPercent && accountTypePieTotal._proPercentOfVerified) {
                        const currentTotal = accountTypePieTotal._unroundedValue;
                        const newMemberLegend = document.getElementById('newMemberLegend');
                        const proVerifiedLegend = document.getElementById('proVerifiedLegend');
                        const businessVerifiedLegend = document.getElementById('businessVerifiedLegend');
                        
                        if (newMemberLegend && newMemberLegend._syncWithPieChart) {
                            const newMemberValue = Math.round(currentTotal * accountTypePieTotal._newMemberPercent);
                            newMemberLegend._unroundedValue = newMemberValue;
                            newMemberLegend._currentValue = newMemberValue;
                            newMemberLegend.textContent = newMemberValue.toLocaleString('en-US');
                            
                            // Calculate verified total
                            const verifiedTotal = currentTotal - newMemberValue;
                            
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
                    
                    // Also update New Members (70-80% of total) and Verified Members (remaining)
                    const newDisplay = document.getElementById('usersNewDisplay');
                    const verifiedDisplay = document.getElementById('usersVerifiedDisplay');
                    if (newDisplay) {
                        const newMemberPercent = 0.70 + (Math.random() * 0.10);
                        const newValue = Math.round(element._unroundedValue * newMemberPercent);
                        newDisplay._unroundedValue = newValue;
                        newDisplay._currentValue = newValue;
                        newDisplay.textContent = newValue.toLocaleString('en-US');
                        
                        // Update Verified Members (total - new)
                        if (verifiedDisplay) {
                            const verifiedValue = element._unroundedValue - newValue;
                            verifiedDisplay._unroundedValue = verifiedValue;
                            verifiedDisplay._currentValue = verifiedValue;
                            verifiedDisplay.textContent = verifiedValue.toLocaleString('en-US');
                        }
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
                        accountTypePieTotal._unroundedValue = element._unroundedValue;
                        accountTypePieTotal._currentValue = element._unroundedValue;
                        accountTypePieTotal.textContent = element._unroundedValue.toLocaleString('en-US');
                        
                        // Also update Account Types legend values based on stored percentages
                        if (accountTypePieTotal._newMemberPercent && accountTypePieTotal._proPercentOfVerified) {
                            const currentTotal = accountTypePieTotal._unroundedValue;
                            const newMemberLegend = document.getElementById('newMemberLegend');
                            const proVerifiedLegend = document.getElementById('proVerifiedLegend');
                            const businessVerifiedLegend = document.getElementById('businessVerifiedLegend');
                            
                            if (newMemberLegend && newMemberLegend._syncWithPieChart) {
                                const newMemberValue = Math.round(currentTotal * accountTypePieTotal._newMemberPercent);
                                newMemberLegend._unroundedValue = newMemberValue;
                                newMemberLegend._currentValue = newMemberValue;
                                newMemberLegend.textContent = newMemberValue.toLocaleString('en-US');
                                
                                // Calculate verified total
                                const verifiedTotal = currentTotal - newMemberValue;
                                
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
            if (confirm('⚠️ Are you sure you want to reset all analytics data?\n\nThis will clear:\n• Total Users count\n• Verification Submissions\n• Monthly Revenue\n• Gigs Reported\n\nThe page will refresh with new baseline values.')) {
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
    console.log('💡 New revenue will start between ₱10,000 - ₱15,000');
};

// ===== INITIALIZATION COMPLETE =====
console.log('✅ Admin Dashboard JavaScript loaded successfully');
console.log('🎮 Keyboard shortcuts: Alt+1-6 (navigation), Ctrl+K (search)');
console.log('🔧 Console commands:');
console.log('   • resetAdminMockData() - Reset all stat data to baseline values');
