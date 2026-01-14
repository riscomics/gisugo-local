# 📸 PHOTO MANAGEMENT SYSTEM - COMPLETE SPECIFICATION

**Version:** 1.0  
**Date:** 2026-01-14  
**Status:** DRAFT - Awaiting Approval

---

## 🎯 EXECUTIVE SUMMARY

This document defines the complete architecture for photo management in GISUGO, addressing:
- **Memory leaks** (orphaned files in Firebase Storage)
- **Data consistency** (Storage ↔ Firestore synchronization)
- **Error recovery** (what happens when operations fail)
- **User experience** (never leave users without their photos)

---

## 📋 TABLE OF CONTENTS

1. [Design Principles](#design-principles)
2. [Data Architecture](#data-architecture)
3. [Photo Operations](#photo-operations)
4. [Error Handling](#error-handling)
5. [Orphan Tracking System](#orphan-tracking-system)
6. [Storage Rules](#storage-rules)
7. [Testing Requirements](#testing-requirements)
8. [Migration Plan](#migration-plan)

---

## 🏗️ DESIGN PRINCIPLES

### **Principle 1: Pessimistic Ordering**
**"Create new before deleting old"**

```
✅ CORRECT ORDER:
1. Upload new photo
2. Save URL to database
3. Delete old photo

❌ WRONG ORDER:
1. Delete old photo
2. Upload new photo (if this fails, user has NO photo)
```

**Rationale:** If upload fails, user still has their old photo. Better to have orphaned files than missing data.

---

### **Principle 2: No Mixed Data Formats**
**"Storage URLs only, no base64 fallback"**

```
✅ ALL users:
profilePhoto: "https://firebasestorage.googleapis.com/..."

❌ MIXED formats:
User A: "https://firebasestorage.googleapis.com/..."
User B: "data:image/jpeg;base64,..." ← Maintenance nightmare
```

**Rationale:** Consistent data structure = simpler code, fewer bugs.

---

### **Principle 3: Fail Fast, Track Failures**
**"Never hide errors, always log orphans"**

```javascript
if (uploadFails) {
  ❌ DON'T: Fallback to base64 (hides problem)
  ✅ DO: Throw error, let user retry
}

if (deleteFails) {
  ❌ DON'T: Log warning and continue (orphan ignored)
  ✅ DO: Track orphan in database for cleanup
}
```

**Rationale:** Transparency allows monitoring and fixing systematic issues.

---

### **Principle 4: Idempotent Operations**
**"Safe to retry, safe to run twice"**

```javascript
// Example: Delete operation
if (fileExists) {
  delete(file);
} else {
  return { success: true, message: 'Already deleted' };
}
// Running twice = same result
```

**Rationale:** Network failures happen. Users will retry. Code must handle it gracefully.

---

## 📊 DATA ARCHITECTURE

### **Firestore Collections**

#### **`users/{userId}`**
```javascript
{
  userId: string,
  fullName: string,
  email: string,
  phoneNumber: string,
  profilePhoto: string,  // ← ALWAYS Storage URL or empty string
  // ... other fields
}
```

#### **`jobs/{jobId}`**
```javascript
{
  jobId: string,
  posterId: string,
  thumbnail: string,     // ← ALWAYS Storage URL or empty string
  // ... other fields
}
```

#### **`orphaned_files/{orphanId}` (NEW)**
```javascript
{
  orphanId: string,      // Auto-generated
  fileType: 'profile_photo' | 'job_photo',
  storageUrl: string,    // Full URL to orphaned file
  storagePath: string,   // Extracted path (e.g., "job_photos/abc123.jpg")
  
  // Context
  userId: string,        // User who triggered the operation
  jobId: string | null,  // If applicable
  
  // Tracking
  reason: string,        // Why deletion failed
  detectedAt: Timestamp, // When orphan was created
  attemptedCleanupAt: Timestamp | null,
  cleanedUp: boolean,    // Successfully cleaned up?
  
  // Debugging
  errorMessage: string,
  errorCode: string,
  stackTrace: string
}
```

---

### **Firebase Storage Structure**

```
gs://your-bucket/
├── profile_photos/
│   ├── {userId}_{timestamp}.jpg     ← One photo per user (old ones deleted)
│   └── ...
│
├── job_photos/
│   ├── {jobId}_{timestamp}.jpg      ← One photo per job (old ones deleted)
│   └── ...
│
└── verification_ids/
    └── {userId}/
        ├── id_{timestamp}.jpg
        └── selfie_{timestamp}.jpg
```

**Naming Convention:**
- **Profile:** `{userId}_{timestamp}.jpg`
- **Job:** `{jobId}_{timestamp}.jpg`
- **Timestamp:** Unix milliseconds for uniqueness

---

## 🔄 PHOTO OPERATIONS

---

### **OPERATION 1: Sign-Up (New Profile Photo)**

#### **User Flow:**
```
1. User selects photo
2. Photo previewed in UI
3. User completes form
4. User clicks "Sign Up"
5. System processes photo + creates account
```

#### **System Flow:**
```javascript
async function signUp(userData, photoFile) {
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Validate photo
  // ═══════════════════════════════════════════════════════════════
  const validation = validateFile(photoFile, 'profile');
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Create Firebase Auth user (no photo yet)
  // ═══════════════════════════════════════════════════════════════
  const userCredential = await createUserWithEmailAndPassword(
    auth, 
    userData.email, 
    userData.password
  );
  const userId = userCredential.user.uid;
  
  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Upload photo to Storage
    // ═══════════════════════════════════════════════════════════════
    const uploadResult = await uploadProfilePhoto(userId, photoFile);
    
    if (!uploadResult.success) {
      throw new Error('Photo upload failed: ' + uploadResult.errors.join(', '));
    }
    
    const photoUrl = uploadResult.url;
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Create Firestore profile
    // ═══════════════════════════════════════════════════════════════
    await db.collection('users').doc(userId).set({
      userId: userId,
      fullName: userData.fullName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      profilePhoto: photoUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'active'
    });
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Update Firebase Auth profile (non-critical)
    // ═══════════════════════════════════════════════════════════════
    try {
      await userCredential.user.updateProfile({
        displayName: userData.fullName,
        photoURL: photoUrl
      });
    } catch (authError) {
      // Non-critical: Firestore is source of truth
      console.warn('Auth profile update failed (non-critical):', authError);
    }
    
    return { success: true, userId, photoUrl };
    
  } catch (error) {
    // ═══════════════════════════════════════════════════════════════
    // ROLLBACK: Delete Auth user + orphaned photo (if any)
    // ═══════════════════════════════════════════════════════════════
    console.error('Sign-up failed, rolling back:', error);
    
    // Delete Auth user
    try {
      await userCredential.user.delete();
    } catch (deleteError) {
      console.error('Failed to delete Auth user during rollback:', deleteError);
    }
    
    // Check if photo was uploaded (might be orphaned)
    const possiblePhotoPath = `profile_photos/${userId}_`;
    // Track as potential orphan (background cleanup will handle)
    
    throw error; // Re-throw to show user
  }
}
```

#### **Failure Scenarios:**

| **Step** | **Fails** | **Action** | **Result** |
|----------|-----------|------------|------------|
| 1. Validate | Invalid file | Throw error | User sees error, can retry ✅ |
| 2. Create Auth | Email exists | Throw error | User sees error, can retry ✅ |
| 3. Upload photo | Network/permissions | Rollback: Delete Auth user | User retries from scratch ✅ |
| 4. Create Firestore | Write fails | Rollback: Delete Auth user + track orphan | User retries, orphan tracked ⚠️ |
| 5. Update Auth | Auth update fails | Continue (non-critical) | Profile created successfully ✅ |

---

### **OPERATION 2: Profile Edit (Replace Photo)**

#### **User Flow:**
```
1. User clicks "Edit Profile"
2. User clicks "Change Photo"
3. User selects new photo
4. Photo previewed
5. User clicks "Save"
6. System replaces photo
```

#### **System Flow:**
```javascript
async function updateProfilePhoto(userId, newPhotoFile) {
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Get current profile (to know old photo URL)
  // ═══════════════════════════════════════════════════════════════
  const profile = await getUserProfile(userId);
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  const oldPhotoUrl = profile.profilePhoto;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Upload NEW photo FIRST (don't touch old yet)
  // ═══════════════════════════════════════════════════════════════
  const uploadResult = await uploadProfilePhoto(userId, newPhotoFile);
  
  if (!uploadResult.success) {
    throw new Error('Photo upload failed: ' + uploadResult.errors.join(', '));
    // Old photo still intact ✅
  }
  
  const newPhotoUrl = uploadResult.url;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Update Firestore with new URL
  // ═══════════════════════════════════════════════════════════════
  try {
    await db.collection('users').doc(userId).update({
      profilePhoto: newPhotoUrl,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (firestoreError) {
    // ⚠️ CRITICAL: New photo uploaded but Firestore update failed
    // New photo is now orphaned
    console.error('Firestore update failed, new photo orphaned:', firestoreError);
    
    await trackOrphanedFile({
      fileType: 'profile_photo',
      storageUrl: newPhotoUrl,
      userId: userId,
      reason: 'firestore_update_failed',
      errorMessage: firestoreError.message
    });
    
    throw new Error('Failed to save profile. Please try again.');
    // User still has old photo in Firestore ✅
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Update Firebase Auth (non-critical)
  // ═══════════════════════════════════════════════════════════════
  try {
    const currentUser = getCurrentUser();
    await currentUser.updateProfile({ photoURL: newPhotoUrl });
  } catch (authError) {
    console.warn('Auth profile update failed (non-critical):', authError);
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Delete OLD photo (LAST, after everything else succeeds)
  // ═══════════════════════════════════════════════════════════════
  if (oldPhotoUrl && oldPhotoUrl.includes('firebasestorage')) {
    const deleteResult = await deletePhotoFromStorageUrl(oldPhotoUrl);
    
    if (!deleteResult.success) {
      // ⚠️ Old photo now orphaned (new photo already saved)
      console.error('Old photo deletion failed:', deleteResult.message);
      
      await trackOrphanedFile({
        fileType: 'profile_photo',
        storageUrl: oldPhotoUrl,
        userId: userId,
        reason: 'deletion_failed',
        errorMessage: deleteResult.message
      });
      
      // Don't throw error - user operation succeeded
      // Orphan will be cleaned up by admin/background job
    }
  }
  
  return { success: true, photoUrl: newPhotoUrl };
}
```

#### **Failure Scenarios:**

| **Step** | **Fails** | **Action** | **Result** |
|----------|-----------|------------|------------|
| 2. Upload new | Network/permissions | Throw error | Old photo intact ✅ |
| 3. Update Firestore | Write fails | Track new photo as orphan, throw error | Old photo still in DB ✅ |
| 5. Delete old | Permissions/not found | Track old photo as orphan, continue | New photo in DB ✅, old tracked ⚠️ |

---

### **OPERATION 3: Gig Create (New Photo)**

#### **System Flow:**
```javascript
async function createJobWithPhoto(jobData, photoFile) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error('Not authenticated');
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Generate temporary job ID for Storage upload
  // ═══════════════════════════════════════════════════════════════
  const tempJobId = `${jobData.category}_${Date.now()}`;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Upload photo to Storage
  // ═══════════════════════════════════════════════════════════════
  const uploadResult = await uploadJobPhoto(tempJobId, photoFile);
  
  if (!uploadResult.success) {
    throw new Error('Photo upload failed: ' + uploadResult.errors.join(', '));
  }
  
  const photoUrl = uploadResult.url;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Create job in Firestore
  // ═══════════════════════════════════════════════════════════════
  const jobDoc = {
    posterId: currentUser.uid,
    title: jobData.title,
    category: jobData.category,
    thumbnail: photoUrl,  // ← Storage URL
    // ... other fields
  };
  
  try {
    const docRef = await db.collection('jobs').add(jobDoc);
    return { success: true, jobId: docRef.id, photoUrl };
    
  } catch (firestoreError) {
    // ⚠️ Photo uploaded but Firestore write failed
    console.error('Job creation failed, photo orphaned:', firestoreError);
    
    await trackOrphanedFile({
      fileType: 'job_photo',
      storageUrl: photoUrl,
      userId: currentUser.uid,
      reason: 'job_creation_failed',
      errorMessage: firestoreError.message
    });
    
    throw new Error('Failed to create job. Please try again.');
  }
}
```

#### **Failure Scenarios:**

| **Step** | **Fails** | **Action** | **Result** |
|----------|-----------|------------|------------|
| 2. Upload photo | Network/permissions | Throw error | No orphans ✅ |
| 3. Create Firestore | Write fails | Track photo as orphan, throw error | Photo tracked ⚠️ |

---

### **OPERATION 4: Gig Edit (Replace Photo)**

#### **System Flow:**
```javascript
async function updateJobPhoto(jobId, newPhotoFile) {
  const currentUser = getCurrentUser();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Get existing job (to know old photo URL)
  // ═══════════════════════════════════════════════════════════════
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  // Verify ownership
  if (job.posterId !== currentUser.uid) {
    throw new Error('Not authorized');
  }
  
  const oldPhotoUrl = job.thumbnail;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Upload NEW photo FIRST (don't touch old yet)
  // ═══════════════════════════════════════════════════════════════
  const uploadResult = await uploadJobPhoto(jobId, newPhotoFile);
  
  if (!uploadResult.success) {
    throw new Error('Photo upload failed: ' + uploadResult.errors.join(', '));
    // Old photo still intact ✅
  }
  
  const newPhotoUrl = uploadResult.url;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Update Firestore with new URL
  // ═══════════════════════════════════════════════════════════════
  try {
    await db.collection('jobs').doc(jobId).update({
      thumbnail: newPhotoUrl,
      lastModified: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (firestoreError) {
    // ⚠️ New photo uploaded but Firestore update failed
    console.error('Firestore update failed, new photo orphaned:', firestoreError);
    
    await trackOrphanedFile({
      fileType: 'job_photo',
      storageUrl: newPhotoUrl,
      userId: currentUser.uid,
      jobId: jobId,
      reason: 'firestore_update_failed',
      errorMessage: firestoreError.message
    });
    
    throw new Error('Failed to update job. Please try again.');
    // User still has old photo in Firestore ✅
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Delete OLD photo (LAST)
  // ═══════════════════════════════════════════════════════════════
  if (oldPhotoUrl && oldPhotoUrl.includes('firebasestorage')) {
    const deleteResult = await deletePhotoFromStorageUrl(oldPhotoUrl);
    
    if (!deleteResult.success) {
      console.error('Old photo deletion failed:', deleteResult.message);
      
      await trackOrphanedFile({
        fileType: 'job_photo',
        storageUrl: oldPhotoUrl,
        userId: currentUser.uid,
        jobId: jobId,
        reason: 'deletion_failed',
        errorMessage: deleteResult.message
      });
      
      // Don't throw - user operation succeeded
    }
  }
  
  return { success: true, photoUrl: newPhotoUrl };
}
```

---

### **OPERATION 5: Gig Delete**

#### **System Flow:**
```javascript
async function deleteJob(jobId) {
  const currentUser = getCurrentUser();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Get job (to know photo URL and applications)
  // ═══════════════════════════════════════════════════════════════
  const job = await getJobById(jobId);
  if (!job) {
    return { success: false, message: 'Job not found' };
  }
  
  // Verify ownership
  if (job.posterId !== currentUser.uid) {
    return { success: false, message: 'Not authorized' };
  }
  
  const photoUrl = job.thumbnail;
  const applicationIds = job.applicationIds || [];
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Create audit record FIRST (before deletion)
  // ═══════════════════════════════════════════════════════════════
  await db.collection('job_deletions').add({
    jobId: jobId,
    deletedBy: currentUser.uid,
    deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
    reason: 'user_requested',
    jobData: job  // Full snapshot for recovery/audit
  });
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Delete Firestore documents (job + applications)
  // ═══════════════════════════════════════════════════════════════
  const batch = db.batch();
  
  // Delete job
  batch.delete(db.collection('jobs').doc(jobId));
  
  // Delete applications
  for (const appId of applicationIds) {
    batch.delete(db.collection('applications').doc(appId));
  }
  
  await batch.commit();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Delete photo from Storage (LAST, after Firestore)
  // ═══════════════════════════════════════════════════════════════
  if (photoUrl && photoUrl.includes('firebasestorage')) {
    const deleteResult = await deletePhotoFromStorageUrl(photoUrl);
    
    if (!deleteResult.success) {
      // ⚠️ Job deleted from Firestore but photo still in Storage
      console.error('Photo deletion failed:', deleteResult.message);
      
      await trackOrphanedFile({
        fileType: 'job_photo',
        storageUrl: photoUrl,
        userId: currentUser.uid,
        jobId: jobId,
        reason: 'deletion_after_job_delete_failed',
        errorMessage: deleteResult.message
      });
      
      // Don't throw - job is deleted, that's what matters
    }
  }
  
  return { success: true, message: 'Job deleted successfully' };
}
```

**Why Firestore BEFORE Storage:**
- Job is source of truth
- Delete job first → it's gone from user's view
- Photo deletion fails → orphan tracked, cleaned up later
- Better than: Photo deleted → Firestore fails → job exists with no photo

---

### **OPERATION 6: Account Delete** (NEW - Not Yet Implemented)

#### **System Flow:**
```javascript
async function deleteUserAccount(userId) {
  const currentUser = getCurrentUser();
  
  // Verify current user is deleting their own account
  if (currentUser.uid !== userId) {
    throw new Error('Not authorized');
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 1: Get user's profile (to know photo URL)
  // ═══════════════════════════════════════════════════════════════
  const profile = await getUserProfile(userId);
  const profilePhotoUrl = profile?.profilePhoto;
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 2: Get all user's jobs (to delete them + their photos)
  // ═══════════════════════════════════════════════════════════════
  const userJobs = await getUserJobListings(userId, ['active', 'paused', 'completed']);
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 3: Create audit record FIRST
  // ═══════════════════════════════════════════════════════════════
  await db.collection('account_deletions').add({
    userId: userId,
    deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
    reason: 'user_requested',
    profileData: profile,
    jobCount: userJobs.length,
    jobIds: userJobs.map(j => j.id)
  });
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 4: Delete all jobs (cascade delete applications)
  // ═══════════════════════════════════════════════════════════════
  for (const job of userJobs) {
    await deleteJob(job.id);  // Uses existing deleteJob logic
  }
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 5: Delete Firestore profile
  // ═══════════════════════════════════════════════════════════════
  await db.collection('users').doc(userId).delete();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 6: Delete Firebase Auth user
  // ═══════════════════════════════════════════════════════════════
  await currentUser.delete();
  
  // ═══════════════════════════════════════════════════════════════
  // STEP 7: Delete profile photo from Storage (LAST)
  // ═══════════════════════════════════════════════════════════════
  if (profilePhotoUrl && profilePhotoUrl.includes('firebasestorage')) {
    const deleteResult = await deletePhotoFromStorageUrl(profilePhotoUrl);
    
    if (!deleteResult.success) {
      // Track orphan (no user to associate with, use deleted userId)
      await trackOrphanedFile({
        fileType: 'profile_photo',
        storageUrl: profilePhotoUrl,
        userId: userId,  // User is deleted, but track for cleanup
        reason: 'deletion_after_account_delete_failed',
        errorMessage: deleteResult.message
      });
    }
  }
  
  return { success: true, message: 'Account deleted successfully' };
}
```

---

## 🚨 ERROR HANDLING

### **Error Categories**

| **Category** | **Examples** | **User Impact** | **System Action** |
|--------------|--------------|-----------------|-------------------|
| **Validation** | Invalid file type, too large | ❌ Operation blocked | Show error, allow retry |
| **Authentication** | Not logged in, token expired | ❌ Operation blocked | Redirect to login |
| **Authorization** | Editing someone else's gig | ❌ Operation blocked | Show error |
| **Network** | Upload timeout, connection lost | ❌ Operation failed | Show error, allow retry |
| **Storage** | Quota exceeded, permissions | ❌ Operation failed | Show error, allow retry |
| **Firestore** | Write fails, rules block | ❌ Operation failed | Track orphan, allow retry |
| **Cleanup** | Old photo delete fails | ✅ Operation succeeded | Track orphan, continue |

---

### **Error Response Format**

```javascript
// Success
{
  success: true,
  data: { ... },
  message: 'Operation completed'
}

// Failure (user-facing)
{
  success: false,
  error: 'user_friendly_message',
  code: 'ERROR_CODE',
  retryable: true  // User can retry
}

// Failure (system-level)
{
  success: false,
  error: 'technical_message',
  code: 'ERROR_CODE',
  context: { userId, jobId, ... },
  timestamp: '...'
}
```

---

### **User-Facing Error Messages**

```javascript
const ERROR_MESSAGES = {
  // Upload failures
  'storage/unauthorized': 'Photo upload failed. Please check your internet connection and try again.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  'storage/canceled': 'Upload was canceled. Please try again.',
  
  // File validation
  'file/too-large': 'Photo is too large. Maximum size is 5MB.',
  'file/invalid-type': 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
  
  // Database failures
  'firestore/permission-denied': 'You do not have permission to perform this action.',
  'firestore/unavailable': 'Service temporarily unavailable. Please try again.',
  
  // Generic
  'unknown': 'Something went wrong. Please try again.'
};
```

---

## 📊 ORPHAN TRACKING SYSTEM

### **When to Track Orphans**

```javascript
// Track orphan when:
// 1. Upload succeeds + Firestore fails
if (uploadSuccess && !firestoreSuccess) {
  trackOrphan(uploadedUrl, 'firestore_write_failed');
}

// 2. Firestore succeeds + old photo deletion fails
if (firestoreSuccess && !oldDeleteSuccess) {
  trackOrphan(oldPhotoUrl, 'deletion_failed');
}

// 3. Job deleted + photo deletion fails
if (jobDeleted && !photoDeleteSuccess) {
  trackOrphan(photoUrl, 'deletion_after_job_delete_failed');
}
```

---

### **Orphan Tracking Function**

```javascript
async function trackOrphanedFile({
  fileType,      // 'profile_photo' | 'job_photo'
  storageUrl,    // Full URL
  userId,        // User who triggered operation
  jobId = null,  // If applicable
  reason,        // Why it's orphaned
  errorMessage,  // Error details
  errorCode = null
}) {
  const db = getFirestore();
  
  // Extract storage path from URL
  let storagePath = null;
  try {
    const url = new URL(storageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    if (pathMatch) {
      storagePath = decodeURIComponent(pathMatch[1]);
    }
  } catch (e) {
    storagePath = 'unknown';
  }
  
  // Create orphan record
  await db.collection('orphaned_files').add({
    fileType: fileType,
    storageUrl: storageUrl,
    storagePath: storagePath,
    
    // Context
    userId: userId,
    jobId: jobId,
    
    // Tracking
    reason: reason,
    detectedAt: firebase.firestore.FieldValue.serverTimestamp(),
    attemptedCleanupAt: null,
    cleanedUp: false,
    
    // Debugging
    errorMessage: errorMessage || 'Unknown error',
    errorCode: errorCode || 'UNKNOWN',
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  });
  
  console.warn('🗑️ Orphaned file tracked:', {
    type: fileType,
    url: storageUrl.substring(0, 60) + '...',
    reason: reason
  });
}
```

---

### **Admin Dashboard - Orphan Cleanup UI**

**Location:** `Dashboard > System Maintenance > Orphaned Files`

**Features:**
```
┌─────────────────────────────────────────────────────────┐
│ Orphaned Files                          [Cleanup All]   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Total: 23 orphans (5.4 MB)                             │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Profile Photo                            [Delete]  │ │
│ │ User: John Doe (abc123)                            │ │
│ │ Reason: firestore_update_failed                    │ │
│ │ Detected: 2026-01-10 14:30                         │ │
│ │ Size: 234 KB                                       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Job Photo                                [Delete]  │ │
│ │ Job: Deleted (xyz789)                              │ │
│ │ Reason: deletion_after_job_delete_failed           │ │
│ │ Detected: 2026-01-12 09:15                         │ │
│ │ Size: 456 KB                                       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Cleanup Actions:**
1. **Delete Single:** Delete orphan + mark as cleaned in Firestore
2. **Cleanup All:** Batch delete all orphans
3. **Export Report:** CSV of all orphans for analysis

---

### **Background Cleanup Job** (Optional - Cloud Function)

```javascript
// Runs daily at 3 AM
exports.cleanupOrphanedFiles = functions.pubsub
  .schedule('0 3 * * *')
  .timeZone('Asia/Manila')
  .onRun(async (context) => {
    const db = admin.firestore();
    const storage = admin.storage();
    
    // Get orphans older than 7 days
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const orphans = await db.collection('orphaned_files')
      .where('cleanedUp', '==', false)
      .where('detectedAt', '<', sevenDaysAgo)
      .get();
    
    let cleaned = 0;
    let failed = 0;
    
    for (const doc of orphans.docs) {
      const orphan = doc.data();
      
      try {
        // Delete from Storage
        const fileRef = storage.bucket().file(orphan.storagePath);
        await fileRef.delete();
        
        // Mark as cleaned
        await doc.ref.update({
          cleanedUp: true,
          attemptedCleanupAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        cleaned++;
      } catch (error) {
        console.error('Failed to cleanup orphan:', orphan.storageUrl, error);
        failed++;
      }
    }
    
    console.log(`Cleanup complete: ${cleaned} cleaned, ${failed} failed`);
  });
```

---

## 🔒 STORAGE RULES

### **Firebase Storage Security Rules**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // ═══════════════════════════════════════════════════════════════
    // PROFILE PHOTOS
    // ═══════════════════════════════════════════════════════════════
    match /profile_photos/{userId}_{timestamp}.jpg {
      // Allow read by anyone (public profiles)
      allow read: if true;
      
      // Allow write only by the user themselves
      allow write: if request.auth != null 
                   && request.auth.uid == userId;
      
      // Allow delete by the user themselves
      allow delete: if request.auth != null 
                    && request.auth.uid == userId;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // JOB PHOTOS
    // ═══════════════════════════════════════════════════════════════
    match /job_photos/{jobId}_{timestamp}.jpg {
      // Allow read by anyone (public job listings)
      allow read: if true;
      
      // Allow write by authenticated users
      // (Job ownership verified at Firestore level)
      allow write: if request.auth != null;
      
      // Allow delete by authenticated users
      // (Ownership verified before calling delete)
      allow delete: if request.auth != null;
    }
    
    // ═══════════════════════════════════════════════════════════════
    // VERIFICATION IDs (Admin only)
    // ═══════════════════════════════════════════════════════════════
    match /verification_ids/{userId}/{filename} {
      // Allow read only by admin or the user
      allow read: if request.auth != null 
                  && (request.auth.uid == userId 
                      || get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      // Allow write only by the user
      allow write: if request.auth != null 
                   && request.auth.uid == userId;
      
      // Allow delete only by admin
      allow delete: if request.auth != null 
                    && get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### **Testing Storage Rules**

```javascript
// Test script to verify delete permissions
async function testStorageRules() {
  const storage = getFirebaseStorage();
  const auth = getFirebaseAuth();
  
  // Test 1: Upload test file
  const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const uploadResult = await uploadProfilePhoto(auth.currentUser.uid, testFile);
  
  if (!uploadResult.success) {
    console.error('❌ Upload failed:', uploadResult.errors);
    return false;
  }
  
  console.log('✅ Upload succeeded');
  
  // Test 2: Delete test file
  const deleteResult = await deletePhotoFromStorageUrl(uploadResult.url);
  
  if (!deleteResult.success) {
    console.error('❌ Delete failed:', deleteResult.message);
    console.error('⚠️ CRITICAL: Storage rules do not allow deletion!');
    return false;
  }
  
  console.log('✅ Delete succeeded');
  console.log('✅ Storage rules are correctly configured');
  return true;
}

// Run before switching to Storage URLs in production
testStorageRules();
```

---

## 🧪 TESTING REQUIREMENTS

### **Unit Tests**

```javascript
describe('Photo Management', () => {
  
  describe('Sign-up with photo', () => {
    it('should create account + upload photo + save URL', async () => {
      const result = await signUp(userData, photoFile);
      expect(result.success).toBe(true);
      expect(result.photoUrl).toContain('firebasestorage');
    });
    
    it('should rollback on Firestore failure', async () => {
      // Mock Firestore failure
      jest.spyOn(db, 'collection').mockRejectedValue(new Error('Write failed'));
      
      await expect(signUp(userData, photoFile)).rejects.toThrow();
      
      // Verify Auth user was deleted
      const users = await admin.auth().listUsers();
      expect(users.users).toHaveLength(0);
    });
  });
  
  describe('Profile photo update', () => {
    it('should upload new photo BEFORE deleting old', async () => {
      const spy = jest.spyOn(storage, 'upload');
      const deleteSpy = jest.spyOn(storage, 'delete');
      
      await updateProfilePhoto(userId, newPhoto);
      
      // Upload called before delete
      expect(spy).toHaveBeenCalledBefore(deleteSpy);
    });
    
    it('should keep old photo if new upload fails', async () => {
      jest.spyOn(storage, 'upload').mockRejectedValue(new Error('Upload failed'));
      
      const oldUrl = user.profilePhoto;
      await expect(updateProfilePhoto(userId, newPhoto)).rejects.toThrow();
      
      const updatedUser = await getUserProfile(userId);
      expect(updatedUser.profilePhoto).toBe(oldUrl); // Unchanged
    });
    
    it('should track orphan if old delete fails', async () => {
      jest.spyOn(storage, 'delete').mockRejectedValue(new Error('Delete failed'));
      
      await updateProfilePhoto(userId, newPhoto);
      
      const orphans = await db.collection('orphaned_files').get();
      expect(orphans.size).toBe(1);
      expect(orphans.docs[0].data().reason).toBe('deletion_failed');
    });
  });
  
  describe('Gig delete', () => {
    it('should delete Firestore BEFORE Storage', async () => {
      const firestoreSpy = jest.spyOn(db, 'delete');
      const storageSpy = jest.spyOn(storage, 'delete');
      
      await deleteJob(jobId);
      
      expect(firestoreSpy).toHaveBeenCalledBefore(storageSpy);
    });
  });
});
```

---

### **Integration Tests**

```javascript
describe('Photo Management Integration', () => {
  
  it('should handle complete user lifecycle', async () => {
    // 1. Sign up with photo
    const { userId, photoUrl } = await signUp(userData, photoFile);
    expect(photoUrl).toContain('firebasestorage');
    
    // 2. Update profile photo
    const { photoUrl: newUrl } = await updateProfilePhoto(userId, newPhotoFile);
    expect(newUrl).not.toBe(photoUrl);
    
    // 3. Create gig with photo
    const { jobId, photoUrl: gigUrl } = await createJobWithPhoto(jobData, gigPhotoFile);
    expect(gigUrl).toContain('firebasestorage');
    
    // 4. Delete gig
    await deleteJob(jobId);
    
    // Verify photo deleted
    const exists = await checkStorageFileExists(gigUrl);
    expect(exists).toBe(false);
    
    // 5. Delete account
    await deleteUserAccount(userId);
    
    // Verify profile photo deleted
    const profileExists = await checkStorageFileExists(newUrl);
    expect(profileExists).toBe(false);
  });
  
  it('should track and cleanup orphans', async () => {
    // Create orphan (force Firestore failure)
    jest.spyOn(db, 'collection').mockRejectedValueOnce(new Error('Write failed'));
    
    try {
      await createJobWithPhoto(jobData, photoFile);
    } catch (e) {
      // Expected to fail
    }
    
    // Verify orphan tracked
    const orphans = await db.collection('orphaned_files').get();
    expect(orphans.size).toBeGreaterThan(0);
    
    // Run cleanup
    await cleanupOrphanedFile(orphans.docs[0].id);
    
    // Verify orphan cleaned
    const updatedOrphan = await orphans.docs[0].ref.get();
    expect(updatedOrphan.data().cleanedUp).toBe(true);
  });
});
```

---

### **Manual Testing Checklist**

```
□ Sign-up Flow
  □ Upload valid photo → Success
  □ Upload invalid file → Error shown
  □ Upload too large file → Error shown
  □ Network disconnects during upload → Rollback works
  □ Check Storage → Photo exists
  □ Check Firestore → URL saved correctly

□ Profile Edit Flow
  □ Change photo → New photo appears
  □ Check Storage → Only 1 photo (old deleted)
  □ Network fails during upload → Old photo intact
  □ Change photo multiple times → No orphans

□ Gig Create Flow
  □ Create gig with photo → Success
  □ Check Storage → Photo exists
  □ Create gig without photo → Success (uses mock)

□ Gig Edit Flow
  □ Change gig photo → New photo appears
  □ Check Storage → Only 1 photo (old deleted)
  □ Change photo multiple times → No orphans

□ Gig Delete Flow
  □ Delete gig → Gig disappears
  □ Check Storage → Photo deleted
  □ Check Firestore → Job document gone

□ Orphan Tracking
  □ Force photo upload + Firestore failure → Orphan tracked
  □ Check orphaned_files collection → Entry exists
  □ Admin dashboard shows orphan
  □ Cleanup orphan → Storage file deleted

□ Storage Rules
  □ User can delete their own photos
  □ User cannot delete other users' photos
  □ Admin can delete any photo
```

---

## 🚀 MIGRATION PLAN

### **Phase 1: Pre-Migration (Current State)**

**Status:** Using base64 fallback (broken)

**Actions:**
1. ✅ Document all issues (this spec)
2. ✅ Get approval for new architecture
3. ⏳ Test Storage rules (verify delete permissions work)

---

### **Phase 2: Implement New System**

**Estimated Time:** 3-4 hours

**Tasks:**
```
□ Update firebase-storage.js
  □ Implement deletePhotoFromStorageUrl()
  □ Add trackOrphanedFile()
  □ Remove base64 fallback from upload functions

□ Update firebase-db.js
  □ Fix applyForJob() (already done)
  □ Add getUserProfile() export (already done)

□ Update sign-up.js
  □ Rewrite signUp flow (correct order)
  □ Remove base64 fallback
  □ Add rollback on failure

□ Update profile.js
  □ Rewrite updateProfilePhoto (correct order)
  □ Remove base64 fallback
  □ Add orphan tracking

□ Update new-post2.js
  □ Rewrite createJobWithPhoto (correct order)
  □ Rewrite updateJobPhoto (correct order)
  □ Remove base64 fallback
  □ Add orphan tracking

□ Create orphaned_files collection
  □ Set up Firestore security rules
  □ Create indexes

□ Update Storage rules
  □ Deploy new rules
  □ Test delete permissions
```

---

### **Phase 3: Testing**

**Estimated Time:** 2-3 hours

**Tasks:**
```
□ Run Storage rules test
□ Test sign-up flow (new account + photo)
□ Test profile photo update (multiple times)
□ Test gig creation (with photo)
□ Test gig photo edit (multiple times)
□ Test gig deletion (verify photo deleted)
□ Force failures (simulate network issues)
□ Verify orphans tracked correctly
□ Test cleanup (manually delete orphans)
```

---

### **Phase 4: Production Deployment**

**Tasks:**
```
□ Deploy Storage rules to Firebase
□ Deploy new code with version bumps
□ Monitor orphaned_files collection
□ Monitor error logs (Sentry/Console)
□ Test with real user accounts
```

---

### **Phase 5: Admin Dashboard (Future)**

**Tasks:**
```
□ Create "Orphaned Files" page in admin dashboard
□ Show list of orphans with details
□ Add "Delete" button per orphan
□ Add "Cleanup All" bulk action
□ Add export/report functionality
□ (Optional) Implement background cleanup Cloud Function
```

---

## 📝 SUMMARY

### **Key Changes from Current Implementation**

| **Aspect** | **Current (Broken)** | **New (Correct)** |
|------------|----------------------|-------------------|
| **Upload Order** | Delete old → Upload new | Upload new → Delete old |
| **Failure Handling** | Fallback to base64 | Track orphan, throw error |
| **Data Format** | Mixed (URLs + base64) | Storage URLs only |
| **Orphan Tracking** | None | Firestore collection |
| **Error Messages** | Generic | Specific, actionable |
| **Rollback** | None | Automatic on failure |
| **Admin Tools** | None | Orphan cleanup dashboard |

---

### **Expected Outcomes**

✅ **No More Mixed Data Formats** - All photos are Storage URLs  
✅ **No More Data Loss** - Users never lose their photos on upload failure  
✅ **Visible Orphans** - All orphans tracked in Firestore  
✅ **Admin Control** - Dashboard to view and cleanup orphans  
✅ **Proper Error Handling** - Users see clear errors, can retry  
✅ **Production Ready** - Scales to thousands of users  

---

## 🔍 NEXT STEPS

**1. Review this specification**
   - Flag any concerns
   - Ask questions
   - Suggest changes

**2. Approve or modify**
   - Once approved, I implement exactly as specified
   - No more "surprises" or blindspots

**3. Implement in phases**
   - Phase 2: Code changes (3-4 hours)
   - Phase 3: Testing (2-3 hours)
   - Phase 4: Deploy to production

---

## ❓ QUESTIONS FOR YOU

1. **Storage Rules Testing:** Should I implement the `testStorageRules()` function first to verify your current Firebase Storage allows deletions?

2. **Orphan Tracking:** Do you want orphan tracking implemented immediately, or can it wait until after basic operations work?

3. **Admin Dashboard:** Phase 5 (admin dashboard for orphans) - priority now or later?

4. **Background Cleanup:** Cloud Function to auto-cleanup orphans older than 7 days - worth implementing?

5. **Account Delete:** Operation 6 (full account deletion) - implement now or later?

---

**END OF SPECIFICATION**

Review and let me know what needs to change before I start implementing.
