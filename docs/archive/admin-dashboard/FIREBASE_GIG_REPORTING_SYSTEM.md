# Firebase Gig Reporting & Moderation System

## Overview
This document outlines the comprehensive gig reporting and moderation system, including multi-user reporting, ignore functionality with threshold tracking, and permanent deletion features.

## Core Concepts

### 1. **Gig Status Clarification**
- **Posted Tab**: Real-time monitoring of ALL active gigs in the marketplace/listings
- **Reported Tab**: Isolated view of gigs that have been reported by users (gigs remain live in marketplace)
- **Suspended Tab**: Gigs that have been suspended by admin (removed from marketplace)

### 2. **Reporting Logic**
- Multiple users can report the same gig
- Each unique user report is tracked separately
- Gigs are NOT duplicated when multiple users report them
- A gig appears ONCE in Reported tab regardless of report count

### 3. **Ignore & Threshold System**
- When admin clicks IGNORE, the gig is hidden from Reported tab
- System sets `reportThreshold = currentReportCount + 10`
- Gig only reappears in Reported tab when `reportCount >= reportThreshold`
- This prevents admins from seeing the same gig repeatedly

## Data Schema

### Complete Job Document with Reporting

```javascript
{
  jobId: '1760557532320',
  posterId: 'user003',
  posterName: 'Pedro Garcia',
  
  // Basic info
  category: 'hakot',
  title: 'Transport Construction Materials to Site',
  thumbnail: 'public/mock/mock-hakot-post3.jpg',
  
  // Scheduling
  jobDate: 'February 14, 2025',
  startTime: '8AM',
  endTime: '12PM',
  
  // Location
  region: 'Cebu',
  city: 'Talisay City',
  extras: { 'Load at': 'Kasambagan', 'Unload at': 'Guadalupe' },
  
  // Content & Pricing
  description: 'Need help moving furniture...',
  priceOffer: '₱1500',
  payRate: 'Per Hour',
  
  // Status: 'posted' (live in marketplace) or 'suspended' (removed)
  status: 'posted',
  
  // Workers
  hiredWorker: {
    workerId: 'worker001',
    workerName: 'Ana Reyes',
    workerAvatar: 'public/users/User-04.jpg'
  },
  
  // ===== REPORTING SYSTEM =====
  
  // Array of all unique reporters
  reportedBy: [
    {
      reporterId: 'user007',
      reporterName: 'Carlos Reyes',
      reporterAvatar: 'public/users/User-07.jpg',
      reportDate: 'January 28, 2025 3:45 PM'
    },
    {
      reporterId: 'user012',
      reporterName: 'Elena Ramos',
      reporterAvatar: 'public/users/User-02.jpg',
      reportDate: 'January 28, 2025 5:20 PM'
    },
    {
      reporterId: 'user018',
      reporterName: 'Miguel Torres',
      reporterAvatar: 'public/users/User-03.jpg',
      reportDate: 'January 29, 2025 9:15 AM'
    }
  ],
  
  // Total unique reports
  reportCount: 3,
  
  // Threshold for showing in Reported tab
  // 0 = show immediately
  // 13 = only show if reportCount >= 13
  reportThreshold: 0,
  
  // Array tracking each time admin ignores
  ignoredBy: [
    {
      adminId: 'admin001',
      adminName: 'Admin Maria Garcia',
      adminAvatar: 'public/users/User-01.jpg',
      ignoreDate: 'January 30, 2025 9:15 AM',
      reportCountAtIgnore: 3  // How many reports when ignored
    }
  ],
  
  // If suspended by admin
  suspendedBy: {
    adminId: 'admin001',
    adminName: 'Admin Maria Garcia',
    adminAvatar: 'public/users/User-01.jpg',
    suspendDate: 'January 30, 2025 10:20 AM'
  }
}
```

## Tab Filtering Logic

### Posted Tab
```javascript
filteredGigs = allGigs.filter(gig => 
  gig.status === 'posted' && 
  (!gig.reportedBy || gig.reportedBy.length === 0)
);
```
**Shows**: Active gigs that haven't been reported

### Reported Tab
```javascript
filteredGigs = allGigs.filter(gig => 
  gig.reportedBy && 
  gig.reportedBy.length > 0 && 
  gig.reportCount >= gig.reportThreshold &&
  gig.status !== 'suspended'
);
```
**Shows**: Reported gigs that meet threshold and aren't suspended

### Suspended Tab
```javascript
filteredGigs = allGigs.filter(gig => 
  gig.status === 'suspended'
);
```
**Shows**: All suspended gigs

## Admin Actions

### 1. IGNORE (Reported Gigs)
**Purpose**: Hide gig from Reported tab without suspending it

**Operation**:
```javascript
// When admin clicks IGNORE
const gig = await db.collection('jobs').doc(jobId).get();

await db.collection('jobs').doc(jobId).update({
  ignoredBy: firebase.firestore.FieldValue.arrayUnion({
    adminId: adminUser.uid,
    adminName: adminUser.displayName,
    adminAvatar: adminUser.photoURL,
    ignoreDate: new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }),
    reportCountAtIgnore: gig.data().reportCount
  }),
  reportThreshold: gig.data().reportCount + 10
});
```

**Result**:
- Gig remains `status: 'posted'` (still live in marketplace)
- Hidden from Reported tab until 10 more unique users report it
- If `reportCount` reaches `reportThreshold`, gig reappears in Reported tab

### 2. SUSPEND (Reported/Posted Gigs)
**Purpose**: Remove gig from marketplace

**Operation**:
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
  // Keep reportedBy data for records
});
```

**Result**:
- Gig moved to Suspended tab
- Gig removed from marketplace (not visible to users)
- Report history preserved

### 3. RELIST (Suspended Gigs)
**Purpose**: Return gig to marketplace

**Operation**:
```javascript
await db.collection('jobs').doc(jobId).update({
  status: 'posted',
  suspendedBy: firebase.firestore.FieldValue.delete()
  // Keep reportedBy and ignoredBy for history
});
```

**Result**:
- Gig returns to Posted tab
- Gig visible in marketplace again
- Reporting history preserved

### 4. DELETE (Suspended Gigs)
**Purpose**: Permanently remove gig from database

**Operation**:
```javascript
// PERMANENT DELETE - CANNOT BE UNDONE
await db.collection('jobs').doc(jobId).delete();
```

**Result**:
- Gig completely removed from database
- All data permanently lost
- Cannot be recovered

## UI Display Features

### Reported By Section
**Desktop & Mobile Display**:
```html
REPORTED BY:
[Avatar] Carlos Reyes +(2)
         January 28, 2025 3:45 PM
```

**Format**:
- Show first reporter (earliest report)
- Display `+(count)` badge if more reporters exist
- Badge shows `additionalCount = reportedBy.length - 1`
- No interaction on badge (display only)

**Example**:
- 1 reporter: "Carlos Reyes"
- 3 reporters: "Carlos Reyes +(2)"
- 10 reporters: "Carlos Reyes +(9)"

### Button States by Tab

#### Posted Tab (Non-Reported Gigs)
- ✅ SUSPEND
- ✅ CONTACT
- ✅ CLOSE
- ❌ IGNORE (hidden)
- ❌ RELIST (hidden)
- ❌ DELETE (hidden)
- ❌ PERM DELETE section (hidden)

#### Reported Tab
- ✅ SUSPEND
- ✅ IGNORE (NEW)
- ✅ CONTACT
- ❌ CLOSE (hidden - replaced by IGNORE)
- ❌ RELIST (hidden)
- ❌ DELETE (hidden)
- ❌ PERM DELETE section (hidden)

#### Suspended Tab
- ❌ SUSPEND (hidden)
- ❌ IGNORE (hidden)
- ✅ RELIST
- ✅ DELETE (NEW - triggers perm delete)
- ✅ CONTACT
- ✅ CLOSE
- ✅ PERM DELETE section (shown at bottom)

### Permanent Delete Section (Suspended Only)
```
╔═══════════════════════════════════════╗
║  ⚠️  Danger Zone:                     ║
║      This action cannot be undone.    ║
║      The gig will be permanently      ║
║      removed from the marketplace     ║
║      and database.                    ║
║                                       ║
║  [PERMANENTLY DELETE GIG]             ║
╚═══════════════════════════════════════╝
```

## Backend Operations

### Adding a Report
```javascript
// When a user reports a gig
const gigRef = db.collection('jobs').doc(jobId);
const gig = await gigRef.get();

// Check if user already reported
const existingReport = gig.data().reportedBy?.find(
  r => r.reporterId === userId
);

if (existingReport) {
  throw new Error('You have already reported this gig');
}

await gigRef.update({
  reportedBy: firebase.firestore.FieldValue.arrayUnion({
    reporterId: userId,
    reporterName: user.displayName,
    reporterAvatar: user.photoURL,
    reportDate: new Date().toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }),
  reportCount: firebase.firestore.FieldValue.increment(1)
});
```

### Query for Reported Gigs (Admin View)
```javascript
const reportedGigs = await db.collection('jobs')
  .where('reportCount', '>=', 1)
  .where('status', '!=', 'suspended')
  .get();

// Filter client-side for threshold
const visibleReportedGigs = reportedGigs.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(gig => gig.reportCount >= gig.reportThreshold);
```

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /jobs/{jobId} {
      // Users can report gigs
      allow update: if request.auth != null
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reportedBy', 'reportCount'])
        && request.resource.data.reportedBy.size() == resource.data.reportedBy.size() + 1
        && request.resource.data.reportCount == resource.data.reportCount + 1;
      
      // Only admins can ignore, suspend, relist
      allow update: if isAdmin()
        && request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['ignoredBy', 'reportThreshold', 'status', 'suspendedBy']);
      
      // Only admins can delete gigs
      allow delete: if isAdmin();
    }
  }
}
```

## Testing Scenarios

### Scenario 1: Multiple Reports
1. User A reports Gig X → `reportCount: 1`, `reportThreshold: 0`
2. Gig X appears in Reported tab
3. User B reports Gig X → `reportCount: 2`, still shows once
4. User C reports Gig X → `reportCount: 3`, still shows once
5. Display: "User A +(2)" in Reported By section

### Scenario 2: Ignore & Reappear
1. Gig X has `reportCount: 5`
2. Admin clicks IGNORE → `reportThreshold: 15`
3. Gig X disappears from Reported tab (remains live in marketplace)
4. 5 more users report → `reportCount: 10` (still < 15, not shown)
5. 5 more users report → `reportCount: 15` (meets threshold)
6. Gig X reappears in Reported tab
7. Display: "First Reporter +(14)" in Reported By section

### Scenario 3: Suspend Reported Gig
1. Gig X in Reported tab with 8 reports
2. Admin clicks SUSPEND
3. Gig X moved to Suspended tab
4. In Suspended tab, shows:
   - SUSPENDED BY: Admin Maria Garcia
   - REPORTED BY: First Reporter +(7)
   - PERMANENTLY DELETE section
5. Gig removed from marketplace
6. Admin can RELIST or DELETE

### Scenario 4: Permanent Delete
1. Gig X in Suspended tab
2. Admin scrolls to Permanent Delete section
3. Admin clicks "PERMANENTLY DELETE GIG"
4. Confirmation: "⚠️ PERMANENTLY DELETE THIS GIG? ... This action CANNOT be undone..."
5. Admin confirms
6. Gig completely removed from database
7. Action logged (recommended to log before deleting)

## Migration Guide

### For Existing Gigs

```javascript
// Add new fields to existing gigs
const batch = db.batch();
const gigsSnapshot = await db.collection('jobs').get();

gigsSnapshot.forEach(doc => {
  const data = doc.data();
  
  // Convert old single reportedBy to array
  const updates = {
    reportedBy: data.reportedBy ? [data.reportedBy] : [],
    reportCount: data.reportedBy ? 1 : 0,
    reportThreshold: 0,
    ignoredBy: []
  };
  
  batch.update(doc.ref, updates);
});

await batch.commit();
```

## Analytics & Monitoring

### Recommended Metrics to Track
- Total reports per gig
- Average reports before suspension
- Ignore effectiveness (how often gigs get re-reported)
- Time between ignore and reappearance
- False positive rate (reports that get ignored repeatedly)
- Admin response time to reports

### Query Examples

```javascript
// Gigs with most reports
const mostReported = await db.collection('jobs')
  .orderBy('reportCount', 'desc')
  .limit(10)
  .get();

// Gigs ignored multiple times
const frequentlyIgnored = await db.collection('jobs')
  .where('ignoredBy', 'array-length', '>', 2)
  .get();

// Recent suspensions
const recentSuspensions = await db.collection('jobs')
  .where('status', '==', 'suspended')
  .orderBy('suspendedBy.suspendDate', 'desc')
  .limit(20)
  .get();
```

## Best Practices

1. **Always log deletions** before executing permanent delete
2. **Archive suspended gigs** to a separate collection before deletion
3. **Review ignore patterns** to adjust threshold (currently +10)
4. **Monitor report velocity** to detect brigading
5. **Implement rate limiting** on user reports
6. **Add reason field** to reports for better moderation context
7. **Email notifications** to admins when threshold is exceeded

## Future Enhancements

- [ ] Auto-suspend at reportCount threshold (e.g., 20 reports)
- [ ] Different thresholds per gig category
- [ ] Reporter reputation system
- [ ] Bulk operations (suspend/ignore multiple)
- [ ] Report reasons/categories
- [ ] Appeal system for suspended gigs
- [ ] Admin audit log
- [ ] Email notifications to gig posters
- [ ] Analytics dashboard

