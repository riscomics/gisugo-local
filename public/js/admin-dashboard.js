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
    
    if (window.innerWidth <= 800) {
        // Auto-collapse on tablet and below
        if (sidebar && mainContent) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('sidebar-collapsed');
        }
        // Hide toggle button on small screens
        if (sidebarToggle) {
            sidebarToggle.style.display = 'none';
        }
    } else {
        // Restore saved state on desktop
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (sidebar && mainContent && sidebarToggle) {
            sidebarToggle.style.display = 'block';
            
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
        'moderation': 'Content Moderation',
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
    const messageItems = document.querySelectorAll('.customer-message-item');
    const topicFilter = document.getElementById('topicFilter');
    
    // Handle message selection
    messageItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove selection from all items
            messageItems.forEach(msg => msg.classList.remove('selected'));
            
            // Select clicked item
            this.classList.add('selected');
            
            // Load message details
            loadMessageDetails(this);
        });
    });
    
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
    document.getElementById('detailMessageText').innerHTML = data.content;
    
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
    alert('Reply sent successfully!\n\nThe customer will receive an email notification with your response.');
    
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
                alert('Reply sent successfully!');
                closeModal();
                
                // Update message status
                const statusBadge = document.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.textContent = 'Replied';
                    statusBadge.className = 'status-badge replied';
                }
                
                // Mark as replied but keep in thread
                handleReplySuccess();
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
        const messageState = messageStates[messageId];
        
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
        
        // Move to old inbox
        messageStates[messageId].status = 'old';
        
        // Hide message detail
        document.getElementById('messageDetail').style.display = 'block';
        document.getElementById('messageContent').style.display = 'none';
        
        // Refresh current view
        filterMessagesByInboxType(currentInboxType);
        updateInboxCount();
        
        // Remove selection
        activeMessage.classList.remove('selected');
        
        console.log('📧 Message closed and moved to old inbox:', messageId);
        alert('Message moved to Old inbox.');
    }
}

function markMessageAsReplied(messageId) {
    if (messageStates[messageId]) {
        // Admin reply becomes part of the thread - message stays in current inbox
        messageStates[messageId].isReplied = true;
        messageStates[messageId].lastActivity = 'admin_reply';
        
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
function handleReplySuccess() {
    const activeMessage = document.querySelector('.customer-message-item.selected');
    if (activeMessage) {
        const messageId = activeMessage.getAttribute('data-message-id');
        markMessageAsReplied(messageId);
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
    
    // Close overlay when clicking close button
    if (overlayCloseBtn) {
        overlayCloseBtn.addEventListener('click', hideMessageOverlay);
    }
    
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
        
        // Archive button in overlay
        if (e.target.id === 'overlayArchiveBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Overlay Close button clicked');
            const overlay = document.getElementById('messageDetailOverlay');
            const currentMessageId = overlay?.dataset.messageId;
            if (currentMessageId) {
                closeCurrentMessage(); // Use the existing function
                hideMessageOverlay();
                console.log('📁 Message moved to Old inbox from overlay');
            } else {
                console.error('❌ No message ID found for overlay');
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
    const subject = messageElement.querySelector('.message-subject')?.textContent || 'No Subject';
    const timestamp = messageElement.querySelector('.message-time')?.textContent || '';
    const hasAttachment = messageElement.querySelector('.message-attachment') !== null;
    const fullContent = getFullMessageContent(messageId);
    
    return `
        <div class="message-detail-header">
            <div class="header-main">
                <div class="sender-info">
                    <img src="public/users/User-02.jpg" alt="User Avatar" class="detail-avatar">
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

// ===== INITIALIZATION COMPLETE =====
console.log('✅ Admin Dashboard JavaScript loaded successfully');
console.log('🎮 Keyboard shortcuts: Alt+1-6 (navigation), Ctrl+K (search)');
