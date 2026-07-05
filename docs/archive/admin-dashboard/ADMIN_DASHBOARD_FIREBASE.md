# 🔥 ADMIN DASHBOARD - FIREBASE BACKEND REQUIREMENTS

## **NEW FIRESTORE COLLECTIONS FOR ADMIN**

### **1. `admin_users` Collection**
Admin user accounts with role-based permissions.

```javascript
// Document ID: user_uid_string (from Firebase Auth)
{
  "uid": "admin_uid_string",
  "email": "admin@gisugo.com",
  "displayName": "Admin Name",
  "role": "super_admin|moderator|support",
  "permissions": {
    "canModerateGigs": true,
    "canManageUsers": true,
    "canViewAnalytics": true,
    "canAccessFinancials": true,
    "canBanUsers": true
  },
  "createdAt": timestamp,
  "lastLogin": timestamp,
  "loginCount": 0
}
```

---

### **2. `users` Collection** (Extension)
Add admin-related fields to existing user schema.

```javascript
{
  // ... existing user fields ...
  
  // NEW: Admin Dashboard Fields
  "accountStatus": "active|pending|verified|suspended|banned",
  "verificationStatus": "NEW MEMBER|PRO VERIFIED|BUSINESS VERIFIED",
  "verificationSubmittedAt": timestamp,
  "verificationApprovedAt": timestamp,
  "verificationApprovedBy": "admin_uid",
  
  // Verification Documents
  "verificationImages": {
    "idPhoto": "gs://bucket/verifications/user_id/id_photo.jpg",
    "selfieWithId": "gs://bucket/verifications/user_id/selfie.jpg"
  },
  
  // Demographics (for analytics)
  "birthdate": "1995-06-15", // YYYY-MM-DD
  "age": 28, // Calculated field
  "region": "Cebu", // Main island/province
  "city": "Cebu City",
  "education": "Bachelors|Masters|Doctorate|Associates|Highschool Diploma|No Highschool",
  
  // Social Media Links
  "socialMediaLinks": {
    "facebook": "https://facebook.com/username",
    "instagram": "https://instagram.com/username",
    "linkedin": "https://linkedin.com/in/username"
  },
  
  // Account Statistics
  "gigsPosted": 0, // Total gigs posted
  "applicationsSubmitted": 0, // Total applications
  "gigsCompleted": 0, // Successfully completed gigs
  "totalRatings": 0, // Number of ratings received
  "averageRating": 0, // Star rating (0-5)
  
  // Registration Info
  "registeredAt": timestamp,
  "registrationIP": "192.168.1.1", // Public IPv4
  "registrationDevice": "mobile|desktop",
  "registrationOS": "Android|iOS|Windows|Mac",
  
  // Suspension Info (if suspended)
  "suspendedAt": timestamp,
  "suspendedBy": "admin_uid",
  "suspendedReason": "String",
  "suspensionExpiry": timestamp, // null for permanent
  
  // Ban Info (if banned)
  "bannedAt": timestamp,
  "bannedBy": "admin_uid",
  "bannedReason": "String",
  "bannedIP": "192.168.1.1"
}
```

---

### **3. `gig_reports` Collection**
User-submitted reports for problematic gigs.

```javascript
// Document ID: auto-generated
{
  "gigId": "gig_document_id",
  "gigTitle": "String",
  "gigPosterId": "user_uid",
  "gigPosterName": "String",
  
  "reporterId": "user_uid",
  "reporterName": "String",
  "reportedAt": timestamp,
  
  "reason": "Inappropriate content|Scam|Fake job|Violence|Spam|Other",
  "description": "String (optional)",
  
  "status": "pending|reviewing|resolved|dismissed",
  "priority": "low|medium|high|critical",
  
  // Admin Actions
  "reviewedBy": "admin_uid",
  "reviewedAt": timestamp,
  "reviewNotes": "String",
  "actionTaken": "gig_removed|user_warned|user_suspended|dismissed",
  
  // Resolution
  "resolvedAt": timestamp,
  "resolvedBy": "admin_uid",
  "resolution": "String"
}
```

---

### **4. `admin_actions` Collection**
Audit trail for all admin actions.

```javascript
// Document ID: auto-generated
{
  "adminId": "admin_uid",
  "adminName": "String",
  "actionType": "approve_verification|revoke_verification|suspend_user|restore_user|ban_user|remove_gig|contact_user",
  "targetType": "user|gig|report",
  "targetId": "document_id",
  "targetName": "String", // For readability
  
  "timestamp": timestamp,
  "ipAddress": "String",
  
  "actionData": {
    // Varies by action type
    "reason": "String",
    "notes": "String",
    "previousStatus": "String",
    "newStatus": "String"
  }
}
```

---

### **5. `platform_analytics` Collection**
Real-time platform metrics (replaces mock data).

```javascript
// Document ID: "current" (single document updated in real-time)
{
  "lastUpdated": timestamp,
  
  // User Analytics
  "totalUsers": 1247,
  "activeUsers": 423, // Last 7 days
  "newUsersToday": 18,
  "verifiedUsers": 810,
  "suspendedUsers": 12,
  
  // User Demographics
  "deviceDistribution": {
    "mobile": 1098, // 88%
    "desktop": 149   // 12%
  },
  "mobileBreakdown": {
    "android": 856,  // 78% of mobile
    "ios": 242       // 22% of mobile
  },
  "ageDistribution": {
    "18-25": 187,   // 15%
    "26-40": 773,   // 62%
    "41-59": 212,   // 17%
    "60+": 75       // 6%
  },
  "regionalDistribution": {
    "Cebu": 399,    // 32%
    "Manila": 249,  // 20%
    "Davao": 162,   // 13%
    "Bohol": 137,   // 11%
    "Leyte": 125,   // 10%
    "Other": 175    // 14%
  },
  
  // Gig Analytics
  "totalGigs": 892,
  "activeGigs": 234,
  "completedGigs": 567,
  "cancelledGigs": 91,
  "totalApplications": 2676, // 3x gigs
  
  // Category Distribution
  "gigsByCategory": {
    "limpyo": 125,
    "hatod": 98,
    "luto": 87,
    // ... all categories
  },
  "applicationsByCategory": {
    "limpyo": 385,
    "hatod": 294,
    // ... all categories
  },
  
  // Revenue Analytics
  "totalRevenuePHP": 1247830,
  "totalRevenueUSD": 24956,
  "revenueGrowth": 4.2, // % this month
  
  // Storage Analytics
  "storageUsedGB": 15.67,
  "storageLimit GB": 500,
  "profilePhotos": 1247,
  "gigPhotos": 2834,
  "verificationImages": 810,
  
  // Traffic Analytics (MTD - Month To Date)
  "bandwidthGB_MTD": 127.5,
  "firestoreReads_MTD": 2847632,
  "firestoreWrites_MTD": 189475,
  
  // Cost Breakdown (MTD)
  "costs": {
    "firestore_MTD": 42.50,
    "storage_MTD": 3.75,
    "bandwidth_MTD": 12.85,
    "auth_MTD": 0.00,
    "total_MTD": 59.10
  },
  
  // Reports & Moderation
  "gigsReported": 47,
  "reportsPending": 23,
  "reportsResolved": 24,
  
  // Session Analytics
  "averageSessionDuration": "8m 23s",
  "bounceRate": 32.5,
  "repeatUserRate": 67.5,
  
  // Peak Usage
  "peakHours": {
    "morning": 187,    // 6AM-10AM
    "midday": 423,     // 11AM-2PM (peak)
    "afternoon": 398,  // 3PM-6PM
    "evening": 289,    // 7PM-11PM
    "night": 52        // 12AM-5AM
  }
}
```

**Update Strategy:** Use Cloud Functions to update this document:
- Every user signup → increment `totalUsers`
- Every gig post → increment `totalGigs`
- Every verification → increment `verifiedUsers`
- Every transaction → add to `totalRevenue`
- Run daily Cloud Function to calculate analytics

---

## **FIREBASE CLOUD FUNCTIONS**

### **1. Update Analytics on User Events**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Trigger: New user created
exports.onUserCreated = functions.auth.user().onCreate(async (user) => {
  const analyticsRef = admin.firestore().collection('platform_analytics').doc('current');
  
  await analyticsRef.update({
    totalUsers: admin.firestore.FieldValue.increment(1),
    newUsersToday: admin.firestore.FieldValue.increment(1),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
});

// Trigger: Verification approved
exports.onVerificationApproved = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Check if verification status changed from pending to verified
    if (before.accountStatus === 'pending' && after.accountStatus === 'verified') {
      const analyticsRef = admin.firestore().collection('platform_analytics').doc('current');
      
      await analyticsRef.update({
        verifiedUsers: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Trigger: Gig posted
exports.onGigCreated = functions.firestore
  .document('jobs/{jobId}')
  .onCreate(async (snap, context) => {
    const analyticsRef = admin.firestore().collection('platform_analytics').doc('current');
    const gigData = snap.data();
    
    await analyticsRef.update({
      totalGigs: admin.firestore.FieldValue.increment(1),
      [`gigsByCategory.${gigData.category}`]: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  });

// Trigger: Application submitted
exports.onApplicationCreated = functions.firestore
  .document('applications/{applicationId}')
  .onCreate(async (snap, context) => {
    const analyticsRef = admin.firestore().collection('platform_analytics').doc('current');
    const appData = snap.data();
    
    // Get job category
    const jobSnap = await admin.firestore().collection('jobs').doc(appData.jobId).get();
    const jobCategory = jobSnap.data()?.category;
    
    await analyticsRef.update({
      totalApplications: admin.firestore.FieldValue.increment(1),
      [`applicationsByCategory.${jobCategory}`]: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  });
```

---

### **2. Calculate Daily Analytics**

```javascript
// Run every day at midnight
exports.calculateDailyAnalytics = functions.pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    const db = admin.firestore();
    const analyticsRef = db.collection('platform_analytics').doc('current');
    
    // Calculate active users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsersSnap = await db.collection('users')
      .where('lastActive', '>=', sevenDaysAgo)
      .get();
    
    const activeUsers = activeUsersSnap.size;
    
    // Reset daily counters
    await analyticsRef.update({
      activeUsers: activeUsers,
      newUsersToday: 0, // Reset for new day
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Daily analytics calculated: ${activeUsers} active users`);
  });
```

---

### **3. Calculate Storage Costs**

```javascript
// Run every hour
exports.calculateStorageCosts = functions.pubsub.schedule('0 * * * *')
  .onRun(async (context) => {
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles();
    
    let totalBytes = 0;
    let profilePhotoCount = 0;
    let gigPhotoCount = 0;
    let verificationImageCount = 0;
    
    files.forEach(file => {
      totalBytes += parseInt(file.metadata.size);
      
      if (file.name.includes('/profile_photos/')) profilePhotoCount++;
      if (file.name.includes('/gig_photos/')) gigPhotoCount++;
      if (file.name.includes('/verifications/')) verificationImageCount++;
    });
    
    const storageGB = totalBytes / (1024 ** 3);
    
    // Firebase Storage pricing: $0.026/GB/month
    const storageCostPerMonth = storageGB * 0.026;
    
    const analyticsRef = admin.firestore().collection('platform_analytics').doc('current');
    await analyticsRef.update({
      storageUsedGB: storageGB,
      profilePhotos: profilePhotoCount,
      gigPhotos: gigPhotoCount,
      verificationImages: verificationImageCount,
      'costs.storage_MTD': storageCostPerMonth,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Storage costs calculated: ${storageGB.toFixed(2)}GB = $${storageCostPerMonth.toFixed(2)}/month`);
  });
```

---

## **ADMIN DASHBOARD QUERIES**

### **Real-time Analytics (replaces setInterval)**

```javascript
// Replace all setInterval timers with Firestore real-time listener
function initializeAdminAnalytics() {
  const analyticsRef = db.collection('platform_analytics').doc('current');
  
  // Single real-time listener for all analytics
  const unsubscribe = analyticsRef.onSnapshot((doc) => {
    if (!doc.exists) return;
    
    const data = doc.data();
    
    // Update all dashboard cards
    updateTotalUsersCard(data);
    updateVerificationsCard(data);
    updateRevenueCard(data);
    updateGigsCard(data);
    updateStorageCard(data);
    updateTrafficCard(data);
    
    // Update overlays if open
    updateActiveOverlays(data);
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    unsubscribe();
  });
}

function updateTotalUsersCard(data) {
  document.getElementById('totalUsersNumber').textContent = 
    data.totalUsers.toLocaleString();
  
  // Update growth rate (calculate from historical data)
  const growthRate = ((data.newUsersToday / data.totalUsers) * 100).toFixed(1);
  // ... update UI
}
```

---

### **User Management Queries**

```javascript
// Get users by status (for tabs)
async function loadUsersForTab(status) {
  const snapshot = await db.collection('users')
    .where('accountStatus', '==', status)
    .orderBy('registeredAt', 'desc')
    .limit(50) // Paginate
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Approve verification
async function approveUserVerification(userId) {
  const batch = db.batch();
  
  // Update user
  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    accountStatus: 'verified',
    verificationStatus: 'PRO VERIFIED',
    verificationApprovedAt: firebase.firestore.FieldValue.serverTimestamp(),
    verificationApprovedBy: currentAdminId,
    verificationImages: firebase.firestore.FieldValue.delete() // Remove after approval
  });
  
  // Log admin action
  const actionRef = db.collection('admin_actions').doc();
  batch.set(actionRef, {
    adminId: currentAdminId,
    adminName: currentAdminName,
    actionType: 'approve_verification',
    targetType: 'user',
    targetId: userId,
    targetName: userName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    actionData: {
      previousStatus: 'pending',
      newStatus: 'verified'
    }
  });
  
  // Update analytics
  const analyticsRef = db.collection('platform_analytics').doc('current');
  batch.update(analyticsRef, {
    verifiedUsers: firebase.firestore.FieldValue.increment(1)
  });
  
  await batch.commit();
}

// Suspend user
async function suspendUser(userId, reason) {
  const batch = db.batch();
  
  // Update user
  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    accountStatus: 'suspended',
    suspendedAt: firebase.firestore.FieldValue.serverTimestamp(),
    suspendedBy: currentAdminId,
    suspendedReason: reason
  });
  
  // Log admin action
  const actionRef = db.collection('admin_actions').doc();
  batch.set(actionRef, {
    adminId: currentAdminId,
    adminName: currentAdminName,
    actionType: 'suspend_user',
    targetType: 'user',
    targetId: userId,
    targetName: userName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    actionData: { reason: reason }
  });
  
  // Update analytics
  const analyticsRef = db.collection('platform_analytics').doc('current');
  batch.update(analyticsRef, {
    suspendedUsers: firebase.firestore.FieldValue.increment(1)
  });
  
  await batch.commit();
}

// Permanent ban
async function permanentlyBanUser(userId, ipAddress, reason) {
  const batch = db.batch();
  
  // Update user
  const userRef = db.collection('users').doc(userId);
  batch.update(userRef, {
    accountStatus: 'banned',
    bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
    bannedBy: currentAdminId,
    bannedReason: reason,
    bannedIP: ipAddress
  });
  
  // Add IP to banned list
  const bannedIPRef = db.collection('banned_ips').doc(ipAddress);
  batch.set(bannedIPRef, {
    ip: ipAddress,
    userId: userId,
    userName: userName,
    bannedAt: firebase.firestore.FieldValue.serverTimestamp(),
    bannedBy: currentAdminId,
    reason: reason
  });
  
  // Log admin action
  const actionRef = db.collection('admin_actions').doc();
  batch.set(actionRef, {
    adminId: currentAdminId,
    adminName: currentAdminName,
    actionType: 'ban_user',
    targetType: 'user',
    targetId: userId,
    targetName: userName,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    actionData: { 
      reason: reason,
      ipAddress: ipAddress
    }
  });
  
  await batch.commit();
}
```

---

### **Gig Moderation Queries**

```javascript
// Get reported gigs
async function loadReportedGigs(status) {
  const snapshot = await db.collection('gig_reports')
    .where('status', '==', status)
    .orderBy('reportedAt', 'desc')
    .limit(50)
    .get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Approve/Reject gig report
async function resolveGigReport(reportId, action, notes) {
  const batch = db.batch();
  
  // Update report
  const reportRef = db.collection('gig_reports').doc(reportId);
  batch.update(reportRef, {
    status: 'resolved',
    actionTaken: action,
    resolvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    resolvedBy: currentAdminId,
    resolution: notes
  });
  
  // If removing gig, update gig status
  if (action === 'gig_removed') {
    const gigRef = db.collection('jobs').doc(gigId);
    batch.update(gigRef, {
      status: 'removed',
      removedAt: firebase.firestore.FieldValue.serverTimestamp(),
      removedBy: currentAdminId,
      removalReason: notes
    });
  }
  
  // Log admin action
  const actionRef = db.collection('admin_actions').doc();
  batch.set(actionRef, {
    adminId: currentAdminId,
    adminName: currentAdminName,
    actionType: 'resolve_report',
    targetType: 'gig_report',
    targetId: reportId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    actionData: {
      action: action,
      notes: notes
    }
  });
  
  await batch.commit();
}
```

---

## **FIREBASE SECURITY RULES (ADMIN)**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
    
    function hasPermission(permission) {
      return get(/databases/$(database)/documents/admin_users/$(request.auth.uid)).data.permissions[permission] == true;
    }
    
    // Admin Users Collection
    match /admin_users/{adminId} {
      allow read: if request.auth != null && isAdmin();
      allow write: if false; // Only via Firebase Console
    }
    
    // Platform Analytics Collection
    match /platform_analytics/{docId} {
      allow read: if request.auth != null && isAdmin() && hasPermission('canViewAnalytics');
      allow write: if false; // Only via Cloud Functions
    }
    
    // Gig Reports Collection
    match /gig_reports/{reportId} {
      // Users can create reports
      allow create: if request.auth != null;
      
      // Only admins can read/update reports
      allow read, update: if request.auth != null && isAdmin() && hasPermission('canModerateGigs');
      allow delete: if false;
    }
    
    // Admin Actions Collection (audit trail)
    match /admin_actions/{actionId} {
      allow read: if request.auth != null && isAdmin();
      allow create: if request.auth != null && isAdmin();
      allow update, delete: if false; // Immutable audit trail
    }
    
    // Users Collection (admin modifications)
    match /users/{userId} {
      // ... existing rules ...
      
      // Allow admins to update verification status, suspension, etc
      allow update: if request.auth != null && isAdmin() && hasPermission('canManageUsers');
    }
  }
}
```

---

## **FIREBASE STORAGE STRUCTURE**

```
gs://gisugo-app.appspot.com/
├── profile_photos/
│   └── {userId}/
│       └── profile.jpg
├── gig_photos/
│   └── {gigId}/
│       ├── photo1.jpg
│       ├── photo2.jpg
│       └── photo3.jpg
├── verifications/
│   └── {userId}/
│       ├── id_photo.jpg
│       └── selfie_with_id.jpg
└── admin/
    └── exports/
        └── {timestamp}/
            ├── users.csv
            ├── gigs.csv
            └── analytics.json
```

---

## **IMPLEMENTATION CHECKLIST**

### **Phase 1: Core Admin Infrastructure**
- [ ] Create `admin_users` collection and add initial admin accounts
- [ ] Set up Firebase Security Rules for admin access
- [ ] Implement admin authentication flow in `admin-dashboard.html`
- [ ] Add `admin_actions` audit trail collection

### **Phase 2: User Management Backend**
- [ ] Extend `users` collection with new fields (verification, demographics, social, IP)
- [ ] Implement approve/revoke verification functions
- [ ] Implement suspend/restore/ban user functions
- [ ] Add Firebase Storage for verification images

### **Phase 3: Analytics Backend**
- [ ] Create `platform_analytics` collection with initial document
- [ ] Deploy Cloud Functions for real-time analytics updates
- [ ] Replace all `setInterval` timers with Firestore listeners
- [ ] Implement daily analytics calculation function

### **Phase 4: Gig Moderation Backend**
- [ ] Create `gig_reports` collection
- [ ] Implement report submission from user-facing pages
- [ ] Implement report resolution functions
- [ ] Add admin notification system for new reports

### **Phase 5: Advanced Features**
- [ ] Implement data export functionality (CSV/JSON)
- [ ] Add admin messaging system (contact users from dashboard)
- [ ] Implement IP-based ban enforcement on signup
- [ ] Add admin activity logs and audit reports

---

**🎯 RESULT:** Complete elimination of mock data, real-time updates, and production-ready admin dashboard!

