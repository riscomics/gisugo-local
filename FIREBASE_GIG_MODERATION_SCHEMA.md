# Firebase Schema Updates for Gig Moderation

## Overview
This document outlines the required Firebase schema updates to support the Gig Moderation feature in the Admin Dashboard, including reporting and suspension functionality.

## Collection: `jobs`

### New Fields

#### 1. `reportedBy` (Object, Optional)
Stores information about the user who reported the gig. Only present when `status` is `'reported'`.

**Structure:**
```javascript
{
  reportedBy: {
    reporterId: String,      // User ID of the reporter
    reporterName: String,    // Full name of the reporter
    reporterAvatar: String,  // Profile avatar URL
    reportDate: String       // Timestamp of the report (format: "Month DD, YYYY HH:MM AM/PM")
  }
}
```

**Example:**
```javascript
{
  reportedBy: {
    reporterId: 'user007',
    reporterName: 'Carlos Reyes',
    reporterAvatar: 'public/users/User-07.jpg',
    reportDate: 'January 28, 2025 3:45 PM'
  }
}
```

#### 2. `suspendedBy` (Object, Optional)
Stores information about the admin who suspended the gig. Only present when `status` is `'suspended'`.

**Structure:**
```javascript
{
  suspendedBy: {
    adminId: String,         // Admin user ID
    adminName: String,       // Full name of the admin
    adminAvatar: String,     // Admin profile avatar URL
    suspendDate: String      // Timestamp of suspension (format: "Month DD, YYYY HH:MM AM/PM")
  }
}
```

**Example:**
```javascript
{
  suspendedBy: {
    adminId: 'admin001',
    adminName: 'Admin Maria Garcia',
    adminAvatar: 'public/users/User-01.jpg',
    suspendDate: 'January 30, 2025 10:20 AM'
  }
}
```

### Updated `status` Field Values
The `status` field now supports three possible values:
- `'posted'` - Active gig (default)
- `'reported'` - Gig has been reported by a user
- `'suspended'` - Gig has been suspended by admin

## Complete Job Document Example

```javascript
{
  jobId: '1760557532320',
  posterId: 'user003',
  posterName: 'Pedro Garcia',
  posterAvatar: 'public/users/User-05.jpg',
  category: 'hakot',
  title: 'Transport Construction Materials to Site',
  thumbnail: 'public/mock/mock-hakot-post3.jpg',
  
  // Scheduling
  jobDate: 'February 14, 2025',
  startTime: '8AM',
  endTime: '12PM',
  scheduledDate: '2025-02-14',
  
  // Location
  region: 'Cebu',
  city: 'Talisay City',
  extras: {
    'Load at': 'Kasambagan',
    'Unload at': 'Guadalupe'
  },
  
  // Content
  description: 'Need help moving furniture. Heavy items included.',
  
  // Pricing
  priceOffer: '₱1500',
  payRate: 'Per Hour',
  
  // Status & Metadata
  status: 'reported',
  datePosted: '1 day ago',
  createdAt: Timestamp,
  applicationCount: 5,
  
  // Workers
  hiredWorker: null,
  // OR
  // hiredWorker: {
  //   workerId: 'worker001',
  //   workerName: 'Ana Reyes',
  //   workerAvatar: 'public/users/User-04.jpg'
  // },
  
  // Moderation Fields
  reportedBy: {
    reporterId: 'user007',
    reporterName: 'Carlos Reyes',
    reporterAvatar: 'public/users/User-07.jpg',
    reportDate: 'January 28, 2025 3:45 PM'
  },
  
  suspendedBy: {
    adminId: 'admin001',
    adminName: 'Admin Maria Garcia',
    adminAvatar: 'public/users/User-01.jpg',
    suspendDate: 'January 30, 2025 10:20 AM'
  }
}
```

## Backend Operations

### 1. Report a Gig
When a user reports a gig:
```javascript
await db.collection('jobs').doc(jobId).update({
  status: 'reported',
  reportedBy: {
    reporterId: currentUser.uid,
    reporterName: currentUser.displayName,
    reporterAvatar: currentUser.photoURL,
    reportDate: new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
});
```

### 2. Suspend a Gig
When an admin suspends a gig:
```javascript
await db.collection('jobs').doc(jobId).update({
  status: 'suspended',
  suspendedBy: {
    adminId: adminUser.uid,
    adminName: adminUser.displayName,
    adminAvatar: adminUser.photoURL,
    suspendDate: new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
});
```

### 3. Relist a Suspended Gig
When an admin relists a gig:
```javascript
await db.collection('jobs').doc(jobId).update({
  status: 'posted',
  suspendedBy: firebase.firestore.FieldValue.delete()
});
```

## Frontend Display Logic

### Desktop Panel (`populateGigDetailPanel`)
```javascript
// Show/hide sections based on status
if (gig.status === 'reported' && gig.reportedBy) {
  // Display "Reported By" section
}

if (gig.status === 'suspended' && gig.suspendedBy) {
  // Display "Suspended By" section
  // Show RELIST button instead of SUSPEND button
}
```

### Mobile Overlay (`showGigOverlay`)
```javascript
// Show/hide buttons based on status
if (gig.status === 'suspended') {
  suspendBtn.style.display = 'none';
  relistBtn.style.display = 'inline-block';
} else {
  suspendBtn.style.display = 'inline-block';
  relistBtn.style.display = 'none';
}
```

## Query Examples

### Fetch All Reported Gigs
```javascript
const reportedGigs = await db.collection('jobs')
  .where('status', '==', 'reported')
  .orderBy('reportedBy.reportDate', 'desc')
  .get();
```

### Fetch All Suspended Gigs
```javascript
const suspendedGigs = await db.collection('jobs')
  .where('status', '==', 'suspended')
  .orderBy('suspendedBy.suspendDate', 'desc')
  .get();
```

### Fetch Gigs Suspended by Specific Admin
```javascript
const gigsBySuspendedByAdmin = await db.collection('jobs')
  .where('status', '==', 'suspended')
  .where('suspendedBy.adminId', '==', adminId)
  .get();
```

## Security Rules Considerations

Update your Firestore security rules to ensure:
1. Only authenticated users can report gigs
2. Only admin users can suspend/relist gigs
3. Regular users cannot modify `reportedBy` or `suspendedBy` fields directly

```javascript
match /jobs/{jobId} {
  // Allow users to report gigs
  allow update: if request.auth != null 
    && request.resource.data.status == 'reported'
    && request.resource.data.reportedBy.reporterId == request.auth.uid;
    
  // Allow admins to suspend/relist gigs
  allow update: if request.auth != null 
    && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
    && (request.resource.data.status in ['suspended', 'posted']);
}
```

## Migration Notes

For existing gigs in the database:
- No migration required - these fields are optional
- Gigs will automatically populate these fields when reported or suspended
- Existing gigs with status 'posted' will continue to work without these fields

## Testing Checklist

- [ ] Test reporting a gig from user account
- [ ] Test suspending a reported gig from admin account
- [ ] Test suspending a posted gig from admin account
- [ ] Test relisting a suspended gig from admin account
- [ ] Verify "Reported By" section displays correctly
- [ ] Verify "Suspended By" section displays correctly
- [ ] Verify SUSPEND/RELIST button toggle works
- [ ] Test both desktop and mobile views
- [ ] Verify Firebase queries work correctly
- [ ] Test security rules enforcement

