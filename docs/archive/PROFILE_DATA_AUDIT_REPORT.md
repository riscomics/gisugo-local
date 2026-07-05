# Profile Data Flow Audit Report
## Complete Analysis of User Profile Display System

**Generated:** January 13, 2026  
**Purpose:** Identify all places where user profile data appears and ensure Firebase connectivity

---

## ✅ FULLY CONNECTED TO FIREBASE

### 1. **Gig Creation System** (`firebase-db.js` → `createJob()`)
- **Status:** ✅ FIXED (Jan 13, 2026)
- **Data Source:** Fetches from Firestore `users/{userId}` collection
- **Fields Used:** `posterName`, `posterThumbnail` (from Firestore profile)
- **Fallback:** Firebase Auth data if Firestore profile unavailable
- **Files:** `public/js/firebase-db.js`, `public/js/new-post.js`, `public/js/new-post2.js`

### 2. **Gig Detail Page - Customer Section** (`dynamic-job.js`)
- **Status:** ✅ FIXED (Jan 13, 2026)
- **Data Source:** `jobData.posterName` and `jobData.posterThumbnail` (stored in job document)
- **Profile Link:** Uses `jobData.posterId` for `profile.html?userId=` navigation
- **Files:** `dynamic-job.html`, `public/js/dynamic-job.js`

### 3. **Profile Page** (`profile.js`)
- **Status:** ✅ CONNECTED
- **Data Source:** Fetches from Firestore via `getUserProfile(userId)`
- **URL Parameters:** Reads `userId` from URL query string
- **Authentication:** Checks `isOwnProfile()` to show/hide edit features
- **Files:** `profile.html`, `public/js/profile.js`

### 4. **Sign-Up System** (`sign-up.js`)
- **Status:** ✅ CONNECTED
- **Creates:** Firestore profile in `users/{userId}` collection
- **Updates:** Firebase Auth profile (`displayName`, `photoURL`)
- **Photo Processing:** Auto-resizes to 500px width, compression applied
- **Files:** `sign-up.html`, `public/js/sign-up.js`

---

## ❌ PARTIALLY CONNECTED / ISSUES FOUND

### 5. **Application System** (`firebase-db.js` → `applyForJob()`)
- **Status:** ⚠️ USES AUTH DATA ONLY
- **Current Behavior:** 
  ```javascript
  applicantName: currentUser.displayName || 'Anonymous',
  applicantThumbnail: currentUser.photoURL || ''
  ```
- **Problem:** Same issue as old gig creation - doesn't fetch Firestore profile
- **Impact:** Phone users show incomplete data in applications
- **Fix Needed:** Fetch from Firestore like `createJob()` does
- **Files:** `public/js/firebase-db.js` (lines 652-697)

### 6. **Chat/Messaging - Send Message** (`messages.js`)
- **Status:** ❌ HARDCODED MOCK DATA
- **Current Behavior:**
  ```javascript
  <img src="public/users/Peter-J-Ang-User-01.jpg" alt="You">
  ```
- **Location:** Line 5750 in `public/js/messages.js`
- **Problem:** Hardcoded photo for sent messages
- **Impact:** All users show same avatar when sending messages
- **Fix Needed:** Fetch current user's Firestore profile photo
- **Files:** `public/js/messages.js`

### 7. **Application Cards Display** (`jobs.js`)
- **Status:** ✅ SHOWS STORED DATA (but relies on #5 being fixed)
- **Data Source:** `application.applicantProfile.displayName` and `photoURL`
- **Note:** Displays whatever was stored during application creation
- **Dependency:** Requires #5 (applyForJob) to store correct Firestore data
- **Files:** `public/js/jobs.js` (lines 5925-5968)

---

## 🧪 MOCK DATA ONLY (Not Production Critical)

### 8. **Admin Dashboard** (`admin-dashboard.js`)
- **Status:** 🧪 MOCK DATA
- **Current Behavior:** Uses mock `allUsers` array with sample profiles
- **Impact:** Admin panel not connected yet (expected)
- **Priority:** LOW - Admin features come later
- **Files:** `admin-dashboard.html`, `public/js/admin-dashboard.js`

### 9. **Static Job HTML Files** (legacy)
- **Status:** 🗑️ LEGACY FILES
- **Files with "Alpha Admin":**
  - `public/jobs/hatod/*.html`
  - `public/jobs/hakot/*.html`
  - `public/jobs/kompra/*.html`
  - `public/jobs/limpyo/*.html`
- **Impact:** None - these are being replaced by `dynamic-job.html`
- **Action:** Can be deleted once all gigs migrated to dynamic system

---

## 🔥 CRITICAL FIXES NEEDED BEFORE TESTING

### Priority 1: Fix Application System
**File:** `public/js/firebase-db.js`  
**Function:** `applyForJob(jobId, applicationData)`  
**Line:** 652-697

**Current Code:**
```javascript
const application = {
  jobId: jobId,
  applicantId: currentUser.uid,
  applicantName: currentUser.displayName || 'Anonymous',
  applicantThumbnail: currentUser.photoURL || '',
  // ...
};
```

**Required Fix:**
```javascript
// Fetch applicant's Firestore profile (like createJob does)
let applicantName = currentUser.displayName || 'Anonymous';
let applicantThumbnail = currentUser.photoURL || '';

try {
  const userProfile = await getUserProfile(currentUser.uid);
  if (userProfile) {
    applicantName = userProfile.fullName || applicantName;
    applicantThumbnail = userProfile.profilePhoto || applicantThumbnail;
  }
} catch (error) {
  console.warn('⚠️ Could not load applicant profile, using Auth data:', error);
}

const application = {
  jobId: jobId,
  applicantId: currentUser.uid,
  applicantName: applicantName,
  applicantThumbnail: applicantThumbnail,
  // ...
};
```

---

### Priority 2: Fix Chat Message Avatar
**File:** `public/js/messages.js`  
**Line:** 5750

**Current Code:**
```javascript
<img src="public/users/Peter-J-Ang-User-01.jpg" alt="You" onerror="this.src='public/images/logo.png'">
```

**Required Fix:**
```javascript
// At top of messages.js, load current user profile
let currentUserProfile = null;

async function initializeMessaging() {
  const currentUserId = getCurrentUserId();
  if (currentUserId && typeof getUserProfile === 'function') {
    currentUserProfile = await getUserProfile(currentUserId);
  }
  // ... rest of init
}

// In send message function:
const userPhoto = currentUserProfile?.profilePhoto || 'public/images/logo.png';
<img src="${userPhoto}" alt="You" onerror="this.src='public/images/logo.png'">
```

---

## 📋 TESTING CHECKLIST

After fixes are applied and accounts recreated:

### Test 1: Gig Posting
- [ ] Create gig with phone account
- [ ] Create gig with Google account
- [ ] Verify gig detail page shows correct poster name
- [ ] Verify gig detail page shows correct poster photo
- [ ] Verify profile link works

### Test 2: Job Applications
- [ ] Apply to gig with phone account
- [ ] Apply to gig with Google account
- [ ] Open "View Applications" overlay
- [ ] Verify applicant names are correct
- [ ] Verify applicant photos are correct
- [ ] Click profile button - verify correct profile loads

### Test 3: Chat/Messaging
- [ ] Send message in any chat thread
- [ ] Verify sender avatar shows user's profile photo
- [ ] Verify sender name shows user's full name

### Test 4: Profile Viewing
- [ ] View own profile from any page
- [ ] View another user's profile from gig detail
- [ ] View another user's profile from application
- [ ] Verify all profile data loads correctly

---

## 🎯 RECOMMENDED ACTION PLAN

### Phase 1: Fix Code (BEFORE Account Recreation)
1. ✅ Fix `applyForJob()` to fetch Firestore profile
2. ✅ Fix chat message avatar to use current user profile
3. ✅ Test locally with existing data to verify no errors

### Phase 2: Complete Cleanup
4. Delete all gigs manually (Firebase Console)
5. Delete all accounts (Firebase Auth + Firestore)
6. Delete orphaned Storage files (if any)

### Phase 3: Fresh Testing
7. Create 3 new accounts (phone, Google, email)
8. Post 3 new gigs from different accounts
9. Test all flows in Testing Checklist above
10. Verify no hardcoded data, no mock fallbacks

---

## 💡 ARCHITECTURE NOTES

### Data Denormalization Strategy
- **Gigs:** Store `posterName` + `posterThumbnail` directly in job document
- **Applications:** Store `applicantName` + `applicantThumbnail` directly in application document
- **Rationale:** Faster reads, fewer joins, acceptable duplication for performance

### Why Firestore Over Auth?
- **Firebase Auth:** Limited fields (`displayName`, `photoURL`, `email`, `phoneNumber`)
- **Firestore:** Full profile with all custom fields (`fullName`, `profilePhoto`, `userSummary`, etc.)
- **Phone Users:** Auth has NO `displayName` or `photoURL` by default - must be manually set
- **Solution:** Always prioritize Firestore, fallback to Auth only if Firestore unavailable

### Profile Update Implications
- **Risk:** If user changes their name/photo, old gigs/applications show old data
- **Mitigation:** For MVP, accept this trade-off (performance > real-time consistency)
- **Future:** Implement Cloud Functions to update denormalized data on profile changes

---

## 🔒 SECURITY CONSIDERATIONS

### Profile Photo URLs
- **Storage:** Firebase Storage with public-read rules for `profiles/{userId}/*`
- **Gig Photos:** Firebase Storage with public-read rules for `gigs/{jobId}/*`
- **ID Verification:** Firebase Storage with ADMIN-ONLY rules for `verification_ids/{userId}/*`

### Profile Access
- **Own Profile:** Full read/write access
- **Other Profiles:** Read-only access to public fields
- **Private Fields:** Hidden from public view (email, phone, DOB, etc.)

---

## ✅ SUMMARY

**Currently Connected:**
- Gig creation ✅
- Gig detail display ✅
- Profile page ✅
- Sign-up system ✅

**Needs Fixing:**
- Application system ⚠️
- Chat messaging ❌

**After Fixes:**
- 100% Firebase-connected profile system
- No mock data in user-facing flows
- Clean, production-ready architecture

**Recommendation:** Fix both issues NOW, then proceed with complete cleanup and fresh testing.
