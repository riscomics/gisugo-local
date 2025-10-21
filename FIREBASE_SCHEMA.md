# 🔥 FIREBASE SCHEMA - GISUGO JOBS PLATFORM

## **FIRESTORE COLLECTIONS**

### **1. `jobs` Collection**
Primary job postings with comprehensive data structure.

```javascript
// Document ID: auto-generated
{
  // Basic Job Information
  "posterId": "user_uid_string",
  "posterName": "String",
  "posterThumbnail": "path/to/image.jpg",
  "title": "String",
  "description": "String (optional)",
  "category": "limpyo|kompra|hatod|hakot|...", // Job category
  "thumbnail": "path/to/job/image.jpg",
  
  // Scheduling
  "scheduledDate": "2024-01-20", // YYYY-MM-DD format
  "startTime": "9AM",
  "endTime": "1PM",
  
  // Pricing & Applications
  "priceOffer": "₱800",
  "applicationCount": 0,
  "applicationIds": [], // Array of application document IDs
  
  // Status Management
  "status": "active|paused|hired|completed|cancelled",
  "datePosted": timestamp,
  "lastModified": timestamp,
  "modifiedBy": "user_uid_string",
  
  // Hiring Information (only when status = 'hired')
  "hiredWorkerId": "user_uid_string",
  "hiredWorkerName": "String",
  "hiredWorkerThumbnail": "path/to/image.jpg",
  "hiredAt": timestamp,
  
  // Completion Information (only when status = 'completed')
  "completedAt": timestamp,
  "completedBy": "customer|worker",
  "completionConfirmed": boolean,
  
  // Contract Management
  "contractVoidedAt": timestamp, // If contract was voided
  "voidedBy": "customer|worker",
  "resignedAt": timestamp, // If worker resigned
  "resignedBy": "worker",
  
  // Technical
  "jobPageUrl": "category.html" // Dynamic job page
}
```

### **2. `applications` Collection**
Worker applications for job postings.

```javascript
// Document ID: auto-generated
{
  "jobId": "job_document_id",
  "applicantId": "user_uid_string",
  "applicantName": "String",
  "applicantThumbnail": "path/to/image.jpg",
  "appliedAt": timestamp,
  "status": "pending|accepted|rejected",
  "message": "String (optional)", // Application message
  "customerResponse": "String (optional)" // Customer response if any
}
```

### **3. `notifications` Collection**
System notifications for users.

```javascript
// Document ID: auto-generated
{
  "recipientId": "user_uid_string",
  "type": "contract_voided|worker_resigned|job_completed|new_application",
  "jobId": "job_document_id",
  "jobTitle": "String",
  "message": "String",
  "createdAt": timestamp,
  "read": boolean,
  "actionRequired": boolean // If user needs to take action
}
```

### **4. `job_completions` Collection**
Audit trail for completed jobs.

```javascript
// Document ID: auto-generated
{
  "jobId": "job_document_id",
  "completedBy": "user_uid_string",
  "completedAt": timestamp,
  "workerNotified": boolean,
  "customerConfirmed": boolean
}
```

### **5. `job_deletions` Collection**
Audit trail for deleted jobs.

```javascript
// Document ID: auto-generated
{
  "jobId": "job_document_id",
  "deletedBy": "user_uid_string", 
  "deletedAt": timestamp,
  "reason": "user_requested|system_cleanup|violation"
}
```

### **6. `user_termination_records` Collection**
**NEW**: Admin dashboard tracking for job terminations and resignations.

```javascript
// Document ID: auto-generated
{
  "customerId": "user_uid_string", // Who posted the job
  "workerId": "user_uid_string", // Who was hired/resigned
  "jobId": "job_document_id",
  "jobTitle": "String", // For admin readability
  "reason": "String", // User-provided reason (min 2 chars)
  "terminatedAt": timestamp,
  "type": "customer_terminated_worker|worker_resigned", // Action type
  
  // Additional context for admin review
  "customerName": "String", // For admin dashboard display
  "workerName": "String", // For admin dashboard display
  "contractDuration": "Number", // Days between hire and termination
  "wasFirstOffense": boolean // If first time for this user
}
```

### **7. `user_admin_stats` Collection**
**NEW**: User behavior statistics for admin monitoring.

```javascript
// Document ID: user_uid_string (one doc per user)
{
  // Termination Statistics (for customers)
  "terminationCount": 0, // How many workers they've fired
  "lastTerminationAt": timestamp,
  "terminationReasons": ["reason1", "reason2"], // Recent reasons array
  
  // Resignation Statistics (for workers)  
  "resignationCount": 0, // How many jobs they've quit
  "lastResignationAt": timestamp,
  "resignationReasons": ["reason1", "reason2"], // Recent reasons array
  
  // Overall Statistics
  "totalJobsCompleted": 0, // Successfully completed jobs
  "averageJobDuration": 0, // Average days to completion
  "reliabilityScore": 100, // Score out of 100 (decreases with terminations/resignations)
  
  // Admin Flags
  "flaggedForReview": boolean, // If admin should review this user
  "flagReason": "high_termination_rate|frequent_resignations|suspicious_behavior",
  "accountStatus": "active|warned|suspended|banned"
}
```

### **8. `chat_threads` Collection**
**NEW**: Chat/messaging threads between users for job-related communication.

```javascript
// Document ID: auto-generated
{
  // Thread Identification
  "threadId": "auto-generated_string",
  "jobId": "job_document_id",
  "jobTitle": "String",
  "applicationId": "application_document_id (optional)", // null if initiated from job contact
  
  // Participants
  "participantIds": ["user_uid_1", "user_uid_2"], // Array of 2 user IDs
  "participant1": {
    "userId": "user_uid_string",
    "userName": "String",
    "userThumbnail": "path/to/image.jpg",
    "role": "customer|worker" // Their role in THIS thread
  },
  "participant2": {
    "userId": "user_uid_string",
    "userName": "String",
    "userThumbnail": "path/to/image.jpg",
    "role": "customer|worker" // Their role in THIS thread
  },
  
  // Thread Metadata
  "threadOrigin": "job|application", // How the thread was started
  "createdAt": timestamp,
  "lastMessageTime": timestamp,
  "lastMessagePreview": "String (last 100 chars)",
  
  // Status
  "isActive": boolean, // false if thread should be archived
  "unreadCount": {
    "user_uid_1": 0,
    "user_uid_2": 0
  }
}
```

### **9. `chat_messages` Collection**
**NEW**: Individual messages within chat threads.

```javascript
// Document ID: auto-generated
{
  // Message Identification
  "messageId": "auto-generated_string",
  "threadId": "chat_thread_document_id",
  
  // Sender Information
  "senderId": "user_uid_string",
  "senderName": "String",
  "senderType": "customer|worker",
  "senderAvatar": "path/to/image.jpg",
  
  // Message Content
  "content": "String",
  "messageType": "text|image|file", // For future expansion
  "attachmentUrl": "String (optional)", // For future file/image sharing
  
  // Timestamps
  "timestamp": timestamp,
  "createdAt": timestamp,
  
  // Read Status
  "read": boolean,
  "readAt": timestamp, // When message was read
  
  // Direction (relative to current viewer)
  "direction": "incoming|outgoing" // Computed client-side based on viewer
}
```

---

## **💬 CHAT/MESSAGING QUERIES**

### **Get User's Chat Threads**
```javascript
// Get all active chat threads for current user
const chatThreadsSnapshot = await db.collection('chat_threads')
  .where('participantIds', 'array-contains', currentUserId)
  .where('isActive', '==', true)
  .orderBy('lastMessageTime', 'desc')
  .get();
```

### **Get or Create Chat Thread**
```javascript
// Check if thread exists between two users for a specific job
const existingThread = await db.collection('chat_threads')
  .where('jobId', '==', jobId)
  .where('participantIds', 'array-contains', currentUserId)
  .get();

// Filter to find exact match with both participants
const matchingThread = existingThread.docs.find(doc => {
  const data = doc.data();
  return data.participantIds.includes(otherUserId);
});

if (matchingThread) {
  // Use existing thread
  return matchingThread.id;
} else {
  // Create new thread
  const threadRef = await db.collection('chat_threads').add({
    threadId: db.collection('chat_threads').doc().id,
    jobId: jobId,
    jobTitle: jobTitle,
    applicationId: applicationId || null,
    participantIds: [currentUserId, otherUserId],
    participant1: {
      userId: currentUserId,
      userName: currentUserName,
      userThumbnail: currentUserThumbnail,
      role: currentUserRole
    },
    participant2: {
      userId: otherUserId,
      userName: otherUserName,
      userThumbnail: otherUserThumbnail,
      role: otherUserRole
    },
    threadOrigin: applicationId ? 'application' : 'job',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
    lastMessagePreview: messageContent.substring(0, 100),
    isActive: true,
    unreadCount: {
      [currentUserId]: 0,
      [otherUserId]: 1
    }
  });
  return threadRef.id;
}
```

### **Send Message in Thread**
```javascript
const batch = db.batch();

// Create message document
const messageRef = db.collection('chat_messages').doc();
batch.set(messageRef, {
  messageId: messageRef.id,
  threadId: threadId,
  senderId: currentUserId,
  senderName: currentUserName,
  senderType: currentUserRole,
  senderAvatar: currentUserThumbnail,
  content: messageContent,
  messageType: 'text',
  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  read: false,
  direction: 'outgoing'
});

// Update thread metadata
const threadRef = db.collection('chat_threads').doc(threadId);
batch.update(threadRef, {
  lastMessageTime: firebase.firestore.FieldValue.serverTimestamp(),
  lastMessagePreview: messageContent.substring(0, 100),
  [`unreadCount.${otherUserId}`]: firebase.firestore.FieldValue.increment(1)
});

await batch.commit();
```

### **Get Messages in Thread**
```javascript
// Real-time listener for messages
const unsubscribe = db.collection('chat_messages')
  .where('threadId', '==', threadId)
  .orderBy('timestamp', 'asc')
  .onSnapshot((snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      direction: doc.data().senderId === currentUserId ? 'outgoing' : 'incoming'
    }));
    displayMessages(messages);
  });
```

### **Mark Messages as Read**
```javascript
const batch = db.batch();

// Get all unread messages in thread from other user
const unreadMessages = await db.collection('chat_messages')
  .where('threadId', '==', threadId)
  .where('senderId', '!=', currentUserId)
  .where('read', '==', false)
  .get();

// Mark all as read
unreadMessages.docs.forEach(doc => {
  batch.update(doc.ref, {
    read: true,
    readAt: firebase.firestore.FieldValue.serverTimestamp()
  });
});

// Reset unread count for current user in thread
const threadRef = db.collection('chat_threads').doc(threadId);
batch.update(threadRef, {
  [`unreadCount.${currentUserId}`]: 0
});

await batch.commit();
```

---

## **FIRESTORE SECURITY RULES**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Jobs Collection
    match /jobs/{jobId} {
      // Read: Job poster or applied users can read
      allow read: if request.auth != null && 
        (resource.data.posterId == request.auth.uid ||
         request.auth.uid in resource.data.applicationIds);
      
      // Create: Authenticated users can create jobs
      allow create: if request.auth != null && 
        resource.data.posterId == request.auth.uid;
      
      // Update: Only job poster can update
      allow update: if request.auth != null && 
        resource.data.posterId == request.auth.uid;
      
      // Delete: Only job poster can delete
      allow delete: if request.auth != null && 
        resource.data.posterId == request.auth.uid;
    }
    
    // Applications Collection
    match /applications/{applicationId} {
      // Read: Job poster or applicant can read
      allow read: if request.auth != null;
      
      // Create: Authenticated users can apply
      allow create: if request.auth != null && 
        resource.data.applicantId == request.auth.uid;
      
      // Update: Only applicant or job poster can update
      allow update: if request.auth != null;
      
      // Delete: Only applicant can delete
      allow delete: if request.auth != null && 
        resource.data.applicantId == request.auth.uid;
    }
    
    // Notifications Collection
    match /notifications/{notificationId} {
      // Only recipient can read/update their notifications
      allow read, update: if request.auth != null && 
        resource.data.recipientId == request.auth.uid;
      
      // System can create notifications
      allow create: if request.auth != null;
    }
    
    // Chat Threads Collection
    match /chat_threads/{threadId} {
      // Only participants can read thread
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
      
      // Only participants can create threads
      allow create: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
      
      // Only participants can update (for unread counts, etc)
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participantIds;
      
      // No deletion allowed (archive instead)
      allow delete: if false;
    }
    
    // Chat Messages Collection
    match /chat_messages/{messageId} {
      // Must be thread participant to read messages
      allow read: if request.auth != null;
      
      // Only sender can create their messages
      allow create: if request.auth != null && 
        resource.data.senderId == request.auth.uid;
      
      // Only recipient can update (mark as read)
      allow update: if request.auth != null;
      
      // No deletion allowed
      allow delete: if false;
    }
  }
}
```

---

## **FIREBASE QUERIES - CRITICAL IMPLEMENTATIONS**

### **📋 Listings Tab Queries**
```javascript
// Get user's active/paused job listings
const listingsSnapshot = await db.collection('jobs')
  .where('posterId', '==', currentUserId)
  .where('status', 'in', ['active', 'paused'])
  .orderBy('datePosted', 'desc')
  .get();
```

### **👥 Hiring Tab Queries**
```javascript
// Get jobs where user is customer OR worker (hired status)
const hiringSnapshot = await db.collection('jobs')
  .where('status', '==', 'hired')
  .where(firebase.firestore.Filter.or(
    firebase.firestore.Filter.where('posterId', '==', currentUserId),
    firebase.firestore.Filter.where('hiredWorkerId', '==', currentUserId)
  ))
  .orderBy('hiredAt', 'desc')
  .get();
```

### **📚 Previous Jobs Queries**
```javascript
// Get completed/cancelled jobs involving current user
const previousSnapshot = await db.collection('jobs')
  .where('status', 'in', ['completed', 'cancelled'])
  .where(firebase.firestore.Filter.or(
    firebase.firestore.Filter.where('posterId', '==', currentUserId),
    firebase.firestore.Filter.where('hiredWorkerId', '==', currentUserId)
  ))
  .orderBy('completedAt', 'desc')
  .get();
```

### **🛡️ Admin Dashboard Queries**
**NEW**: Admin monitoring and user behavior analysis.

```javascript
// Get users with high termination rates (for admin review)
const problematicCustomers = await db.collection('user_admin_stats')
  .where('terminationCount', '>=', 5)
  .orderBy('terminationCount', 'desc')
  .get();

// Get users with high resignation rates (for admin review) 
const problematicWorkers = await db.collection('user_admin_stats')
  .where('resignationCount', '>=', 5)
  .orderBy('resignationCount', 'desc')
  .get();

// Get recent termination records with reasons
const recentTerminations = await db.collection('user_termination_records')
  .orderBy('terminatedAt', 'desc')
  .limit(100)
  .get();

// Get users flagged for admin review
const flaggedUsers = await db.collection('user_admin_stats')
  .where('flaggedForReview', '==', true)
  .get();

// Get termination reasons analysis (most common reasons)
const terminationsByReason = await db.collection('user_termination_records')
  .where('type', '==', 'customer_terminated_worker')
  .orderBy('terminatedAt', 'desc')
  .limit(500)
  .get();

// Get resignation reasons analysis 
const resignationsByReason = await db.collection('user_termination_records')
  .where('type', '==', 'worker_resigned')
  .orderBy('terminatedAt', 'desc')
  .limit(500)
  .get();
```

---

## **⚡ CRITICAL HIRING TAB OPERATIONS**

### **✅ Complete Job (Customer Action)**
```javascript
const batch = db.batch();

// Update job status
const jobRef = db.collection('jobs').doc(jobId);
batch.update(jobRef, {
  status: 'completed',
  completedAt: firebase.firestore.FieldValue.serverTimestamp(),
  completedBy: 'customer',
  completionConfirmed: true
});

// Create completion record
const completionRef = db.collection('job_completions').doc();
batch.set(completionRef, {
  jobId: jobId,
  completedBy: firebase.auth().currentUser.uid,
  completedAt: firebase.firestore.FieldValue.serverTimestamp(),
  workerNotified: false
});

await batch.commit();
```

### **🔄 Relist Job (Customer Void Contract)**
```javascript
const batch = db.batch();
const currentUserId = firebase.auth().currentUser.uid;

// Reset job to active status
const jobRef = db.collection('jobs').doc(jobId);
batch.update(jobRef, {
  status: 'active',
  hiredWorkerId: firebase.firestore.FieldValue.delete(),
  hiredWorkerName: firebase.firestore.FieldValue.delete(),
  hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
  hiredAt: firebase.firestore.FieldValue.delete(),
  contractVoidedAt: firebase.firestore.FieldValue.serverTimestamp(),
  voidedBy: 'customer',
  terminationReason: reason, // User-provided reason
  applicationCount: 0,
  datePosted: firebase.firestore.FieldValue.serverTimestamp()
});

// Notify voided worker with reason
const notificationRef = db.collection('notifications').doc();
batch.set(notificationRef, {
  recipientId: hiredWorkerId,
  type: 'contract_voided',
  jobId: jobId,
  jobTitle: jobTitle,
  message: `Your contract for "${jobTitle}" has been voided by the customer. Reason: ${reason}`,
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  read: false
});

// Create admin dashboard record for termination tracking
const terminationRef = db.collection('user_termination_records').doc();
batch.set(terminationRef, {
  customerId: currentUserId,
  workerId: hiredWorkerId,
  jobId: jobId,
  jobTitle: jobTitle,
  reason: reason,
  terminatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  type: 'customer_terminated_worker',
  customerName: customerName,
  workerName: workerName,
  contractDuration: Math.ceil((Date.now() - hiredAt.toDate()) / (1000 * 60 * 60 * 24)),
  wasFirstOffense: false // Calculate from user stats
});

// Update customer's termination count
const customerStatsRef = db.collection('user_admin_stats').doc(currentUserId);
batch.set(customerStatsRef, {
  terminationCount: firebase.firestore.FieldValue.increment(1),
  lastTerminationAt: firebase.firestore.FieldValue.serverTimestamp(),
  terminationReasons: firebase.firestore.FieldValue.arrayUnion(reason)
}, { merge: true });

await batch.commit();
```

### **🚪 Worker Resignation**
```javascript
const batch = db.batch();
const currentUserId = firebase.auth().currentUser.uid;

// Reset job to active status
const jobRef = db.collection('jobs').doc(jobId);
batch.update(jobRef, {
  status: 'active',
  hiredWorkerId: firebase.firestore.FieldValue.delete(),
  hiredWorkerName: firebase.firestore.FieldValue.delete(),
  hiredWorkerThumbnail: firebase.firestore.FieldValue.delete(),
  hiredAt: firebase.firestore.FieldValue.delete(),
  resignedAt: firebase.firestore.FieldValue.serverTimestamp(),
  resignedBy: 'worker',
  resignationReason: reason, // User-provided reason
  applicationCount: 0,
  datePosted: firebase.firestore.FieldValue.serverTimestamp()
});

// Notify customer with reason
const notificationRef = db.collection('notifications').doc();
batch.set(notificationRef, {
  recipientId: posterId,
  type: 'worker_resigned',
  jobId: jobId,
  jobTitle: jobTitle,
  message: `The worker has resigned from "${jobTitle}". Reason: ${reason}. Your job is now active for new applications.`,
  createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  read: false
});

// Create admin dashboard record for resignation tracking
const resignationRef = db.collection('user_termination_records').doc();
batch.set(resignationRef, {
  customerId: posterId,
  workerId: currentUserId,
  jobId: jobId,
  jobTitle: jobTitle,
  reason: reason,
  terminatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  type: 'worker_resigned',
  customerName: customerName,
  workerName: workerName,
  contractDuration: Math.ceil((Date.now() - hiredAt.toDate()) / (1000 * 60 * 60 * 24)),
  wasFirstOffense: false // Calculate from user stats
});

// Update worker's resignation count
const workerStatsRef = db.collection('user_admin_stats').doc(currentUserId);
batch.set(workerStatsRef, {
  resignationCount: firebase.firestore.FieldValue.increment(1),
  lastResignationAt: firebase.firestore.FieldValue.serverTimestamp(),
  resignationReasons: firebase.firestore.FieldValue.arrayUnion(reason)
}, { merge: true });

await batch.commit();
```

---

## **🔄 REAL-TIME LISTENERS**

### **Tab Count Updates**
```javascript
// Listen for changes to jobs collection for real-time count updates
const unsubscribe = db.collection('jobs')
  .where('posterId', '==', currentUserId)
  .onSnapshot((snapshot) => {
    updateTabCounts();
  });
```

### **Notification Updates**
```javascript
// Listen for new notifications
const unsubscribe = db.collection('notifications')
  .where('recipientId', '==', currentUserId)
  .where('read', '==', false)
  .onSnapshot((snapshot) => {
    updateNotificationBadge(snapshot.size);
  });
```

---

## **🚨 IMPLEMENTATION PRIORITY**

### **Phase 1: Core Data Structure**
1. Set up Firestore collections with security rules
2. Implement user authentication
3. Create job posting functionality

### **Phase 2: Hiring Tab Backend**
1. Complete Job operation with batch writes
2. Relist Job with notification system
3. Worker Resignation with proper data cleanup

### **Phase 3: Real-time Features**
1. Live tab count updates
2. Push notifications for contract changes
3. Real-time application tracking

### **Phase 4: Advanced Features**
1. Job completion verification
2. Rating system integration
3. Payment processing hooks

---

## **📱 MOBILE CONSIDERATIONS**

- Use Firestore offline persistence for mobile apps
- Implement proper error handling for network issues  
- Cache critical data for offline functionality
- Use Cloud Functions for complex business logic

---

**🎯 READY FOR BACKEND IMPLEMENTATION**
All JavaScript functions in `jobs.js` now have complete Firebase implementations commented out - just uncomment and configure Firebase SDK! 