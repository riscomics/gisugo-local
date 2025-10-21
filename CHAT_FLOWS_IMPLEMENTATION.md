# 💬 Chat Thread Implementation - Complete Flow Documentation

## Overview
Two distinct contact flows create chat threads in `messages.html`, visible in role-specific tabs based on user context.

---

## 🔄 Flow 1: Worker → Customer (from Gigs Offered)

### Context
- **Current User:** Worker viewing `jobs.html > Worker Section > Gigs Offered`
- **Recipient:** Customer (job poster who sent the gig offer)
- **Trigger:** Worker clicks "Contact Customer" button on gig offer card
- **Thread Origin:** `'job'` (direct job contact, no application involved)

### Data Flow
```
Worker Section > Gigs Offered
    ↓
Click gig offer card → showGigOfferOptionsOverlay()
    ↓
Click "Contact Customer" → showContactCustomerOverlay(jobData)
    ↓
showContactMessageOverlay(posterId, posterName, jobId, null)
    ↓
Worker types message & clicks "Send Message"
    ↓
handleSendContactMessage()
    ↓
Firebase: Check existing thread (jobId + both userIds)
    ↓
Create/Continue thread with:
    - threadOrigin: 'job'
    - applicationId: null
    ↓
Thread appears in:
    - Worker > Chats tab
    - Customer > Interviews tab
```

### Role Assignments
```javascript
// Worker is contacting about a job offer
currentUserRole = 'worker'  // Current user (not job poster)
recipientRole = 'customer'  // Recipient (is job poster)
```

### Thread Structure
```javascript
{
  threadOrigin: 'job',
  jobId: "job_123",
  jobTitle: "House Cleaning",
  applicationId: null,
  participant1: {
    userId: "worker_uid",
    userName: "Miguel Torres",
    role: "worker"
  },
  participant2: {
    userId: "customer_uid",
    userName: "Maria Santos",
    role: "customer"
  },
  participantIds: ["worker_uid", "customer_uid"]
}
```

### Where Thread Appears
| User | View Location | Tab Name |
|------|--------------|----------|
| Worker | `messages.html > Worker Section` | **Chats** |
| Customer | `messages.html > Customer Section` | **Interviews** |

---

## 🔄 Flow 2: Customer → Worker (from Listings Applications)

### Context
- **Current User:** Customer viewing `jobs.html > Customer Section > Listings`
- **Recipient:** Worker (applicant who applied to the job)
- **Trigger:** Customer clicks "Contact" button on applicant card
- **Thread Origin:** `'application'` (contacting via job application)

### Data Flow
```
Customer Section > Listings
    ↓
Click "View Applications" → Load applicant cards
    ↓
Click applicant card → showApplicationActionOverlay()
    ↓
Click "CONTACT" button
    ↓
showContactMessageOverlay(userId, userName, jobId, applicationId)
    ↓
Customer types message & clicks "Send Message"
    ↓
handleSendContactMessage()
    ↓
Firebase: Check existing thread (applicationId + both userIds)
    ↓
Create/Continue thread with:
    - threadOrigin: 'application'
    - applicationId: "app_456"
    ↓
Thread appears in:
    - Customer > Interviews tab
    - Worker > Chats tab
```

### Role Assignments
```javascript
// Customer is contacting applicant
currentUserRole = 'customer'  // Current user (is job poster)
recipientRole = 'worker'      // Recipient (not job poster)
```

### Thread Structure
```javascript
{
  threadOrigin: 'application',
  jobId: "job_123",
  jobTitle: "House Cleaning",
  applicationId: "app_456",
  participant1: {
    userId: "customer_uid",
    userName: "Maria Santos",
    role: "customer"
  },
  participant2: {
    userId: "worker_uid",
    userName: "Miguel Torres",
    role: "worker"
  },
  participantIds: ["customer_uid", "worker_uid"]
}
```

### Where Thread Appears
| User | View Location | Tab Name |
|------|--------------|----------|
| Customer | `messages.html > Customer Section` | **Interviews** |
| Worker | `messages.html > Worker Section` | **Chats** |

---

## 🔑 Key Differences

| Aspect | Worker → Customer | Customer → Worker |
|--------|-------------------|-------------------|
| **threadOrigin** | `'job'` | `'application'` |
| **applicationId** | `null` | Valid application ID |
| **Initiator** | Worker | Customer |
| **Query By** | `jobId` | `applicationId` (preferred) |
| **Context** | Gig Offer received | Job Application submitted |

---

## 🔍 Firebase Query Logic

### Finding Existing Thread

**For Worker → Customer (job offer):**
```javascript
db.collection('chat_threads')
  .where('jobId', '==', jobId)
  .where('participantIds', 'array-contains', currentUser.uid)
  .get()
```

**For Customer → Worker (application):**
```javascript
db.collection('chat_threads')
  .where('applicationId', '==', applicationId)
  .where('participantIds', 'array-contains', currentUser.uid)
  .get()
```

### Why Different Queries?
- **applicationId is more specific** - One customer can contact the same worker multiple times about different jobs
- **jobId alone isn't unique** - Multiple workers might contact customer about same job from different contexts
- Using `applicationId` when available prevents thread collision

---

## 📊 Thread Display Logic (messages.html)

### Query for Chats/Interviews Tab
```javascript
// Get all threads where current user is a participant
db.collection('chat_threads')
  .where('participantIds', 'array-contains', currentUserId)
  .where('isActive', '==', true)
  .orderBy('lastMessageTime', 'desc')
  .get()
```

### Tab Naming by Role
- **Worker view:** "Chats" tab
- **Customer view:** "Interviews" tab
- **Same data, different UI label** (reflects role perspective)

---

## ✅ Implementation Checklist

- [x] Updated `showContactMessageOverlay()` to accept `jobId` parameter
- [x] Updated Worker gig offer contact flow to pass `jobId`
- [x] Updated Customer application contact flow to pass both `jobId` and `applicationId`
- [x] Updated `handleSendContactMessage()` to use `applicationId` for thread queries
- [x] Set `threadOrigin` dynamically: `'application'` vs `'job'`
- [x] Role-aware thread creation (customer vs worker)
- [x] Documented both flows completely
- [x] Firebase implementation ready (commented, awaiting SDK setup)

---

## 🚀 Activation Steps

1. Configure Firebase SDK in project
2. In `public/js/jobs.js` line 6168, uncomment Firebase implementation block
3. Remove mock implementation at line 6290
4. Add Firestore composite indexes:
   ```
   chat_threads: (jobId, participantIds)
   chat_threads: (applicationId, participantIds)
   chat_messages: (threadId, timestamp)
   ```
5. Deploy security rules from `FIREBASE_SCHEMA.md`
6. Test both flows:
   - Worker contacting customer from Gigs Offered
   - Customer contacting worker from Listings applications

---

**Status:** ✅ Ready for Firebase backend integration

