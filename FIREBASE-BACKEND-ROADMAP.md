# GISUGO Firebase Backend Implementation Roadmap

> Last Updated: December 21, 2025

---

## ✅ Phase 1: Authentication & User Profiles (COMPLETED)

| Task | Status | Notes |
|------|--------|-------|
| Firebase Project Setup | ✅ Done | Project ID: `gisugo1` |
| Firebase Config (`firebase-config.js`) | ✅ Done | All credentials configured |
| Email/Password Auth | ✅ Done | Sign up, login, password change |
| Google Sign-In | ✅ Done | OAuth configured |
| Facebook Sign-In | ✅ Done | OAuth configured |
| Phone Number Auth (SMS) | ✅ Done | OTP verification |
| New User Onboarding Flow | ✅ Done | Redirect to sign-up if no profile |
| User Profiles in Firestore | ✅ Done | `users` collection |
| Profile Photos in Storage | ✅ Done | `profile-photos/{userId}/` |
| Profile Page (real data) | ✅ Done | Load, edit, save to Firestore |
| Linked Login Methods UI | ✅ Done | View/manage auth providers |
| Change Password Feature | ✅ Done | In Edit Profile modal |

---

## 🚧 Phase 2: Jobs System (IN PROGRESS)

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Design `jobs` collection schema | ✅ Done | HIGH | Schema in firebase-db.js |
| Create Job (Customer) | ✅ Done | HIGH | `createJob()` implemented |
| Get Job by ID | ✅ Done | HIGH | `getJobById()` implemented |
| Get Jobs by Category | ✅ Done | HIGH | `getJobsByCategory()` implemented |
| Get User's Listings | ✅ Done | HIGH | `getUserJobListings()` implemented |
| Update Job Status | ✅ Done | HIGH | `updateJobStatus()` implemented |
| Delete Job (Customer) | ✅ Done | HIGH | `deleteJob()` implemented |
| **Integrate with jobs.js** | ⬜ Pending | HIGH | Apply DataService pattern |
| **Integrate with new-post.js** | ⬜ Pending | HIGH | Use Firebase in prod mode |
| Job Photos in Storage | ⬜ Pending | MEDIUM | `job-photos/{jobId}/` |
| Pagination / Infinite Scroll | ⬜ Pending | LOW | For large job lists |

### Actual `jobs` Collection Schema (Implemented)

```javascript
{
  // Auto-generated document ID becomes jobId
  
  // Poster Information
  posterId: "userId",
  posterName: "Peter J. Ang",
  posterThumbnail: "url or empty",
  
  // Job Details
  title: "Deep Clean My 3-Bedroom House",
  description: "Looking for experienced cleaner...",
  category: "limpyo", // limpyo, kompra, hatod, hakot, etc.
  thumbnail: "job-photo-url",
  
  // Location
  region: "Metro Manila",
  city: "Quezon City",
  
  // Schedule
  scheduledDate: "2025-01-18",
  startTime: "9AM",
  endTime: "1PM",
  
  // Pricing
  priceOffer: "800",
  paymentType: "total", // "hourly", "daily", "total"
  
  // Category-specific extras
  extras: ["Deep Kitchen Cleaning", "Bathroom Disinfection"],
  
  // Status
  status: "active", // "active", "paused", "hired", "completed", "cancelled"
  
  // Metadata (Firestore Timestamps)
  datePosted: Timestamp,
  lastModified: Timestamp,
  
  // Applications tracking
  applicationCount: 0,
  applicationIds: [],
  
  // Dynamic page URL
  jobPageUrl: "dynamic-job.html?category=limpyo&jobNumber=abc123"
}
```

### Available Firebase Functions

| Function | Description |
|----------|-------------|
| `createJob(jobData)` | Create new job posting |
| `getJobById(jobId)` | Get single job by ID |
| `getJobsByCategory(category, filters)` | Browse jobs with optional filters |
| `getUserJobListings(userId, statuses)` | Get user's own listings |
| `updateJobStatus(jobId, status, data)` | Update job status |
| `deleteJob(jobId)` | Delete a job |

---

## 🚧 Phase 3: Applications System

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Design `applications` collection | ⬜ Pending | HIGH | Define schema |
| Apply to Job (Worker) | ⬜ Pending | HIGH | Create application |
| View My Applications (Worker) | ⬜ Pending | HIGH | List applied jobs |
| View Applicants (Customer) | ⬜ Pending | HIGH | See who applied |
| Accept/Reject Applicant | ⬜ Pending | HIGH | Update application status |
| Withdraw Application (Worker) | ⬜ Pending | MEDIUM | Cancel application |

### Proposed `applications` Collection Schema

```javascript
{
  applicationId: "auto-generated",
  jobId: "reference to job",
  workerId: "userId of applicant",
  customerId: "userId of job poster",
  
  // Application Details
  message: "I'm interested and available...",
  proposedPay: 450, // optional counter-offer
  
  // Status
  status: "pending" | "accepted" | "rejected" | "withdrawn",
  
  // Metadata
  appliedAt: Timestamp,
  respondedAt: Timestamp,
  
  // Denormalized data (for faster queries)
  workerName: "Juan Dela Cruz",
  workerPhoto: "url",
  workerRating: 4.5,
  jobTitle: "Need help moving furniture"
}
```

---

## 🚧 Phase 4: Chat & Messaging

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Design `chat_threads` collection | ⬜ Pending | HIGH | Thread metadata |
| Design `chat_messages` subcollection | ⬜ Pending | HIGH | Individual messages |
| Start Conversation | ⬜ Pending | HIGH | Create thread |
| Send Message | ⬜ Pending | HIGH | Real-time with Firestore |
| Receive Messages (Real-time) | ⬜ Pending | HIGH | `onSnapshot` listener |
| Message Read Receipts | ⬜ Pending | MEDIUM | Track read status |
| Chat List (Inbox) | ⬜ Pending | HIGH | List all conversations |
| Unread Count Badge | ⬜ Pending | MEDIUM | Show notification count |

### Proposed Chat Schema

```javascript
// chat_threads collection
{
  threadId: "auto-generated",
  participants: ["userId1", "userId2"],
  jobId: "optional - if chat is about a job",
  
  lastMessage: {
    text: "Okay, see you tomorrow!",
    senderId: "userId1",
    timestamp: Timestamp
  },
  
  unreadCount: {
    "userId1": 0,
    "userId2": 2
  },
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// chat_threads/{threadId}/messages subcollection
{
  messageId: "auto-generated",
  senderId: "userId",
  text: "Hello, is this job still available?",
  timestamp: Timestamp,
  read: false,
  type: "text" | "image" | "system"
}
```

---

## 🚧 Phase 5: Notifications

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Design `notifications` collection | ⬜ Pending | HIGH | Per-user notifications |
| Create Notification (on events) | ⬜ Pending | HIGH | New message, application, etc. |
| Display Notifications | ⬜ Pending | HIGH | In-app notification list |
| Mark as Read | ⬜ Pending | MEDIUM | Clear notification |
| Notification Badge Count | ⬜ Pending | MEDIUM | Unread count in header |
| Push Notifications (FCM) | ⬜ Pending | LOW | Optional - browser push |

### Notification Triggers

- New job application received (Customer)
- Application accepted/rejected (Worker)
- New chat message
- Job status changed
- Review received

---

## 🚧 Phase 6: Reviews System

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Design `reviews` collection | ⬜ Pending | HIGH | Define schema |
| Leave Review (after job) | ⬜ Pending | HIGH | Rate + comment |
| Display Reviews on Profile | ⬜ Pending | HIGH | As Customer / As Worker tabs |
| Calculate Average Rating | ⬜ Pending | HIGH | Update user's rating |
| Review Moderation | ⬜ Pending | LOW | Flag/report reviews |

### Proposed `reviews` Collection Schema

```javascript
{
  reviewId: "auto-generated",
  jobId: "reference to completed job",
  
  reviewerId: "userId who left review",
  revieweeId: "userId who received review",
  
  reviewerRole: "customer" | "worker",
  
  rating: 5, // 1-5 stars
  comment: "Great work, very professional!",
  
  createdAt: Timestamp,
  
  // Denormalized
  reviewerName: "Maria Santos",
  reviewerPhoto: "url"
}
```

---

## 🚧 Phase 7: Security Rules (CRITICAL)

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Firestore Security Rules | ⬜ Pending | CRITICAL | Who can read/write what |
| Storage Security Rules | ⬜ Pending | CRITICAL | File access control |
| Test Security Rules | ⬜ Pending | CRITICAL | Ensure no data leaks |

### Security Principles

1. **Users can only edit their own profile**
2. **Customers can only edit their own jobs**
3. **Workers can only see "open" jobs**
4. **Chat messages only visible to participants**
5. **Reviews can only be left after job completion**
6. **Photos can only be uploaded by authenticated users**

---

## 🚧 Phase 8: Advanced Features (Future)

| Task | Status | Priority | Notes |
|------|--------|----------|-------|
| Verification Documents Upload | ⬜ Pending | MEDIUM | ID, NBI, etc. |
| Admin Dashboard | ⬜ Pending | LOW | Manage users, jobs |
| Analytics & Reporting | ⬜ Pending | LOW | Track platform usage |
| Payment Integration | ⬜ Pending | LOW | GCash, Maya, etc. |
| Email Notifications | ⬜ Pending | LOW | SendGrid/Mailgun |

---

## Quick Reference: Firestore Collections

| Collection | Purpose |
|------------|---------|
| `users` | User profiles |
| `jobs` | Job postings |
| `applications` | Job applications |
| `chat_threads` | Conversation metadata |
| `chat_threads/{id}/messages` | Chat messages (subcollection) |
| `notifications` | User notifications |
| `reviews` | User reviews |

---

## Quick Reference: Storage Buckets

| Path | Purpose |
|------|---------|
| `profile-photos/{userId}/` | User profile photos |
| `job-photos/{jobId}/` | Job posting photos |
| `verification-docs/{userId}/` | ID documents (private) |
| `chat-images/{threadId}/` | Images sent in chat |

---

## Notes

- All timestamps should use `firebase.firestore.FieldValue.serverTimestamp()`
- Use batch writes for operations that update multiple documents
- Denormalize frequently-accessed data to reduce reads
- Implement proper error handling for all Firebase operations
- Test on mobile viewports throughout development


