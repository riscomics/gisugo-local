// ============================================================================
// 📁 FIREBASE STORAGE MODULE - GISUGO
// ============================================================================
// 
// This module handles all file upload operations:
// - Profile photos
// - Job photos
// - ID verification documents
// - Image compression and optimization
//
// ============================================================================

// ============================================================================
// CONFIGURATION
// ============================================================================

const STORAGE_CONFIG = {
  // Maximum file sizes (in bytes)
  maxProfilePhotoSize: 5 * 1024 * 1024,  // 5MB
  maxJobPhotoSize: 10 * 1024 * 1024,      // 10MB
  maxIdDocumentSize: 10 * 1024 * 1024,    // 10MB
  // Original Support/Contact file before compressImage. Phone JPEGs often
  // exceed 5MB; the uploaded thumb/full variants are much smaller.
  maxSupportOriginalSize: 25 * 1024 * 1024,
  
  // Allowed file types
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  
  // Storage paths
  paths: {
    profilePhotos: 'profile_photos',
    jobPhotos: 'job_photos',
    idDocuments: 'verification_ids',
    supportPhotos: 'support_photos'
  },
  
  // Image compression settings
  compression: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8
  }
};

const SUPPORT_GUEST_SESSION_KEY = 'gisugo_support_guest_session_id';

function generateSupportGuestSessionId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    }
  } catch (error) {
    // Fall through to timestamp-based id.
  }
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function getSupportGuestSessionId() {
  try {
    const existing = localStorage.getItem(SUPPORT_GUEST_SESSION_KEY);
    if (existing) return existing;
    const next = generateSupportGuestSessionId();
    localStorage.setItem(SUPPORT_GUEST_SESSION_KEY, next);
    return next;
  } catch (error) {
    return generateSupportGuestSessionId();
  }
}

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {string} type - Type of file ('profile', 'job', 'id')
 * @returns {Object} - Validation result
 */
function validateFile(file, type = 'job') {
  const errors = [];
  
  // Check if file exists
  if (!file) {
    return { valid: false, errors: ['No file selected'] };
  }
  
  // Determine max size and allowed types based on file type
  let maxSize, allowedTypes;
  
  switch (type) {
    case 'profile':
      maxSize = STORAGE_CONFIG.maxProfilePhotoSize;
      allowedTypes = STORAGE_CONFIG.allowedImageTypes;
      break;
    case 'id':
      maxSize = STORAGE_CONFIG.maxIdDocumentSize;
      allowedTypes = STORAGE_CONFIG.allowedDocumentTypes;
      break;
    case 'support':
      maxSize = STORAGE_CONFIG.maxSupportOriginalSize;
      allowedTypes = STORAGE_CONFIG.allowedImageTypes;
      break;
    default:
      maxSize = STORAGE_CONFIG.maxJobPhotoSize;
      allowedTypes = STORAGE_CONFIG.allowedImageTypes;
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    errors.push(`File size exceeds ${maxMB}MB limit`);
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ============================================================================
// IMAGE COMPRESSION
// ============================================================================

/**
 * Compress and resize an image
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<Blob>} - Compressed image blob
 */
async function compressImage(file, options = {}) {
  const maxWidth = options.maxWidth || STORAGE_CONFIG.compression.maxWidth;
  const maxHeight = options.maxHeight || STORAGE_CONFIG.compression.maxHeight;
  const quality = options.quality || STORAGE_CONFIG.compression.quality;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      
      img.onload = function() {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log(`📷 Compressed image: ${file.size} → ${blob.size} bytes`);
              resolve(blob);
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload a profile photo
 * @param {string} userId - User ID
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} - Result with download URL
 */
async function uploadProfilePhoto(userId, file) {
  // Validate file
  const validation = validateFile(file, 'profile');
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  const storage = getFirebaseStorage();
  
  if (!storage) {
    // Offline mode - use data URL
    return uploadProfilePhotoOffline(userId, file);
  }
  
  try {
    console.log('📤 Uploading profile photo...');
    
    // Compress image
    const compressedBlob = await compressImage(file);
    
    // Create file reference (nested: profile_photos/{userId}/photo.jpg)
    // Always same filename - replaces old photo automatically
    const filePath = `${STORAGE_CONFIG.paths.profilePhotos}/${userId}/photo.jpg`;
    const fileRef = storage.ref().child(filePath);
    
    // Upload file
    const snapshot = await fileRef.put(compressedBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Get download URL
    const downloadUrl = await snapshot.ref.getDownloadURL();
    
    console.log('✅ Profile photo uploaded:', downloadUrl);
    
    return {
      success: true,
      url: downloadUrl,
      path: filePath
    };
    
  } catch (error) {
    console.error('❌ Profile photo upload error:', error);
    return {
      success: false,
      errors: [error.message]
    };
  }
}

async function uploadProfilePhotoOffline(userId, file) {
  try {
    const compressedBlob = await compressImage(file);
    const dataUrl = await blobToDataUrl(compressedBlob);
    
    console.log('✅ Profile photo stored locally');
    
    return {
      success: true,
      url: dataUrl,
      path: `local_profile_${userId}`,
      isLocal: true
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}

/**
 * Upload a job photo
 * @param {string} jobId - Job ID
 * @param {File} file - Image file to upload
 * @returns {Promise<Object>} - Result with download URL
 */
async function uploadJobPhoto(jobId, file, userId = null) {
  // Validate file
  const validation = validateFile(file, 'job');
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  const storage = getFirebaseStorage();
  
  if (!storage) {
    // Offline mode - use data URL
    return uploadJobPhotoOffline(jobId, file);
  }
  
  try {
    console.log('📤 Uploading job photo...');
    
    // Get userId if not provided
    if (!userId) {
      const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
      userId = (currentUser && currentUser.uid) ? currentUser.uid : 'unknown';
    }
    
    // Compress image
    const compressedBlob = await compressImage(file);
    
    // Create file reference (nested: job_photos/{userId}/{jobId}.jpg)
    const filePath = `${STORAGE_CONFIG.paths.jobPhotos}/${userId}/${jobId}.jpg`;
    const fileRef = storage.ref().child(filePath);
    
    // Upload file
    const snapshot = await fileRef.put(compressedBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        jobId: jobId,
        userId: userId,
        uploadedAt: new Date().toISOString()
      }
    });
    
    // Get download URL
    const downloadUrl = await snapshot.ref.getDownloadURL();
    
    console.log('✅ Job photo uploaded:', downloadUrl);
    
    return {
      success: true,
      url: downloadUrl,
      path: filePath
    };
    
  } catch (error) {
    console.error('❌ Job photo upload error:', error);
    return {
      success: false,
      errors: [error.message]
    };
  }
}

function extractStoragePathFromUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (raw.startsWith('gs://')) {
    const withoutScheme = raw.slice(5);
    const slash = withoutScheme.indexOf('/');
    return slash === -1 ? '' : withoutScheme.slice(slash + 1);
  }
  try {
    const parsed = new URL(raw);
    const fromO = parsed.pathname.match(/\/o\/(.+)$/);
    if (fromO) return decodeURIComponent(fromO[1]);
  } catch (_) { /* fall through */ }
  const match = raw.match(/\/o\/([^?]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

/**
 * Copy an existing gig photo to job_photos/{userId}/{newJobId}.jpg.
 * Used on completed relist so the new gig does not keep pointing at
 * the old gig's filename.
 */
async function copyJobPhotoToNewJob(sourceUrl, newJobId, userId) {
  const destUid = String(userId || '').trim();
  const destJobId = String(newJobId || '').trim();
  const sourcePath = extractStoragePathFromUrl(sourceUrl);
  if (!destUid || !destJobId) {
    return { success: false, errors: ['Missing user or job id'] };
  }
  if (!sourcePath || !sourcePath.startsWith(`${STORAGE_CONFIG.paths.jobPhotos}/`)) {
    return { success: false, errors: ['No Storage job photo to copy'] };
  }
  const destPath = `${STORAGE_CONFIG.paths.jobPhotos}/${destUid}/${destJobId}.jpg`;
  if (sourcePath === destPath) {
    return { success: true, url: sourceUrl, path: destPath };
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    return { success: false, errors: ['Storage unavailable'] };
  }

  try {
    const sourceRef = storage.ref().child(sourcePath);
    let blob = null;
    if (typeof sourceRef.getBytes === 'function') {
      const bytes = await sourceRef.getBytes();
      blob = new Blob([bytes], { type: 'image/jpeg' });
    } else {
      const downloadUrl = await sourceRef.getDownloadURL();
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        return { success: false, errors: ['Could not read original photo'] };
      }
      blob = await response.blob();
    }
    const destRef = storage.ref().child(destPath);
    const snapshot = await destRef.put(blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        jobId: destJobId,
        userId: destUid,
        copiedFrom: sourcePath,
        uploadedAt: new Date().toISOString()
      }
    });
    const url = await snapshot.ref.getDownloadURL();
    return { success: true, url, path: destPath };
  } catch (error) {
    console.error('❌ Job photo copy error:', error);
    return { success: false, errors: [error.message] };
  }
}

async function uploadJobPhotoOffline(jobId, file) {
  try {
    const compressedBlob = await compressImage(file);
    const dataUrl = await blobToDataUrl(compressedBlob);
    
    console.log('✅ Job photo stored locally');
    
    return {
      success: true,
      url: dataUrl,
      path: `local_job_${jobId}`,
      isLocal: true
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}

/**
 * Upload a support/contact attachment photo
 * FIX (2026-08-12): now uploads TWO variants, matching the same thumb/full
 * split already used for chat photos (see createChatThumbnail/
 * createCompressedChatImage in support.js) instead of one oversized
 * 1200px/quality-0.8 image. Thumb is for list-row previews, full is for
 * the ticket detail view -- neither needs to be as large as a job listing
 * photo since it's a single support attachment, not marketplace content.
 * @param {string} referenceId - Support request reference id
 * @param {File} file - Image file to upload
 * @param {string|null} requesterId - Optional requester UID
 * @returns {Promise<Object>} - Result with download URLs for both variants
 */
async function uploadSupportPhoto(referenceId, file, requesterId = null) {
  const validation = validateFile(file, 'support');
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  const storage = getFirebaseStorage();
  if (!storage) {
    return uploadSupportPhotoOffline(referenceId, file);
  }

  try {
    console.log('📤 Uploading support photo...');

    // FIX (2026-08-12): 720px was fine for a small inline preview, but the
    // admin dashboard's attachment viewer opens this in a near-fullscreen
    // lightbox (up to 90vw/90vh) -- on most monitors that's well beyond
    // 720px, so the browser was visibly upscaling/blurring it. Support
    // tickets are rare (nowhere near gig-card browsing volume), so the
    // extra bytes from bumping to 1200px/0.85 are negligible.
    const [thumbBlob, fullBlob] = await Promise.all([
      compressImage(file, { maxWidth: 100, maxHeight: 100, quality: 0.6 }),
      compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
    ]);

    const safeReferenceId = String(referenceId || `support_${Date.now()}`).replace(/[^\w-]/g, '_');
    const safeRequesterId = requesterId ? String(requesterId).replace(/[^\w-]/g, '_') : null;
    const requesterBucket = safeRequesterId
      ? safeRequesterId
      : `guest/${getSupportGuestSessionId()}`;
    const basePath = `${STORAGE_CONFIG.paths.supportPhotos}/${requesterBucket}/${safeReferenceId}`;
    const thumbPath = `${basePath}_thumb.jpg`;
    const fullPath = `${basePath}_full.jpg`;

    const customMetadata = {
      referenceId: String(referenceId || ''),
      requesterId: String(requesterId || ''),
      uploadedAt: new Date().toISOString()
    };

    const [thumbSnapshot, fullSnapshot] = await Promise.all([
      storage.ref().child(thumbPath).put(thumbBlob, { contentType: 'image/jpeg', customMetadata }),
      storage.ref().child(fullPath).put(fullBlob, { contentType: 'image/jpeg', customMetadata })
    ]);

    const [thumbUrl, fullUrl] = await Promise.all([
      thumbSnapshot.ref.getDownloadURL(),
      fullSnapshot.ref.getDownloadURL()
    ]);

    console.log('✅ Support photo uploaded (thumb + full):', fullUrl);
    return {
      success: true,
      url: fullUrl,
      path: fullPath,
      thumbUrl,
      thumbPath
    };
  } catch (error) {
    console.error('❌ Support photo upload error:', error);
    return {
      success: false,
      errors: [error.message]
    };
  }
}

async function uploadSupportPhotoOffline(referenceId, file) {
  try {
    const [thumbBlob, fullBlob] = await Promise.all([
      compressImage(file, { maxWidth: 100, maxHeight: 100, quality: 0.6 }),
      compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 })
    ]);
    const [dataUrl, thumbDataUrl] = await Promise.all([
      blobToDataUrl(fullBlob),
      blobToDataUrl(thumbBlob)
    ]);
    return {
      success: true,
      url: dataUrl,
      path: `local_support_${referenceId || Date.now()}`,
      thumbUrl: thumbDataUrl,
      thumbPath: `local_support_thumb_${referenceId || Date.now()}`,
      isLocal: true
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}

/**
 * Upload ID verification documents
 * @param {string} userId - User ID
 * @param {File} idFile - ID document file
 * @param {File} selfieFile - Selfie with ID file
 * @returns {Promise<Object>} - Result with document URLs
 */
async function uploadVerificationDocuments(userId, idFile, selfieFile) {
  // Validate files
  const idValidation = validateFile(idFile, 'id');
  const selfieValidation = validateFile(selfieFile, 'id');
  
  const allErrors = [...idValidation.errors, ...selfieValidation.errors];
  if (allErrors.length > 0) {
    return { success: false, errors: allErrors };
  }
  
  const storage = getFirebaseStorage();
  
  if (!storage) {
    // Offline mode - use data URLs
    return uploadVerificationDocsOffline(userId, idFile, selfieFile);
  }
  
  try {
    console.log('📤 Uploading verification documents...');
    
    const idBlob = await compressImage(idFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.9 });
    const idPath = `${STORAGE_CONFIG.paths.idDocuments}/${userId}/id.jpg`;
    const idRef = storage.ref().child(idPath);
    const idSnapshot = await idRef.put(idBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId: userId,
        documentType: 'id',
        uploadedAt: new Date().toISOString()
      }
    });
    const idUrl = await idSnapshot.ref.getDownloadURL();
    
    // Upload selfie
    const selfieBlob = await compressImage(selfieFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.9 });
    const selfiePath = `${STORAGE_CONFIG.paths.idDocuments}/${userId}/selfie.jpg`;
    const selfieRef = storage.ref().child(selfiePath);
    const selfieSnapshot = await selfieRef.put(selfieBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId: userId,
        documentType: 'selfie',
        uploadedAt: new Date().toISOString()
      }
    });
    const selfieUrl = await selfieSnapshot.ref.getDownloadURL();
    
    console.log('✅ Verification documents uploaded');
    await deleteStaleVerificationIdFiles(userId, [idPath, selfiePath]);
    
    return {
      success: true,
      idUrl: idUrl,
      selfieUrl: selfieUrl,
      idPath: idPath,
      selfiePath: selfiePath
    };
    
  } catch (error) {
    console.error('❌ Verification docs upload error:', error);
    return {
      success: false,
      errors: [error.message]
    };
  }
}

async function deleteStaleVerificationIdFiles(userId, keepPaths) {
  const storage = getFirebaseStorage();
  const uid = String(userId || '').trim();
  if (!storage || !uid) return;
  const keep = new Set((keepPaths || []).map((item) => String(item || '').replace(/^\/+/, '')));
  try {
    const listed = await storage.ref().child(`${STORAGE_CONFIG.paths.idDocuments}/${uid}`).listAll();
    await Promise.all((listed.items || []).map(async (item) => {
      if (keep.has(item.fullPath)) return;
      try {
        await item.delete();
      } catch (error) {
        if (error.code !== 'storage/object-not-found') {
          console.warn('⚠️ Could not delete leftover ID file:', item.fullPath, error);
        }
      }
    }));
  } catch (error) {
    console.warn('⚠️ Could not list verification_ids for leftover cleanup:', error);
  }
}

async function uploadVerificationDocsOffline(userId, idFile, selfieFile) {
  try {
    const idBlob = await compressImage(idFile);
    const idUrl = await blobToDataUrl(idBlob);
    
    const selfieBlob = await compressImage(selfieFile);
    const selfieUrl = await blobToDataUrl(selfieBlob);
    
    console.log('✅ Verification documents stored locally');
    
    return {
      success: true,
      idUrl: idUrl,
      selfieUrl: selfieUrl,
      isLocal: true
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}

// ============================================================================
// DELETE FUNCTIONS
// ============================================================================

/**
 * Delete a file from storage
 * @param {string} filePath - Path to file in storage
 * @returns {Promise<Object>} - Result object
 */
async function deleteFile(filePath) {
  const storage = getFirebaseStorage();
  
  if (!storage) {
    return { success: true, message: 'Local file reference removed' };
  }
  
  try {
    const fileRef = storage.ref().child(filePath);
    await fileRef.delete();
    
    console.log('✅ File deleted:', filePath);
    return { success: true };
    
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return { success: true, message: 'File already deleted' };
    }
    
    console.error('❌ Error deleting file:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Drop a just-uploaded support photo pair if the ticket write failed.
 * Compose already did this; user/admin reply did not (2026-08-14).
 */
async function cleanupSupportPhotoUpload(uploadResult) {
  if (!uploadResult) return;
  const paths = [uploadResult.path, uploadResult.thumbPath].filter(Boolean);
  for (const path of paths) {
    try {
      await deleteFile(path);
    } catch (_) { /* ignore */ }
  }
}

/**
 * Delete a photo from Storage by URL (helper for photo replacement)
 * @param {string} photoUrl - Full Storage URL to delete
 * @returns {Promise<Object>} - Result object
 */
async function deletePhotoFromStorageUrl(photoUrl) {
  if (!photoUrl) {
    return { success: true, message: 'No photo URL provided' };
  }
  
  // Check if it's a Firebase Storage URL
  const isStorageUrl = photoUrl.includes('firebasestorage.googleapis.com') || 
                      photoUrl.includes('storage.googleapis.com');
  
  if (!isStorageUrl) {
    console.log('ℹ️ Photo is base64/local, no Storage cleanup needed');
    return { success: true, message: 'Not a Storage URL' };
  }
  
  const storage = getFirebaseStorage();
  
  if (!storage) {
    return { success: true, message: 'Storage not available (offline mode)' };
  }
  
  try {
    // Extract storage path from URL
    const url = new URL(photoUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      console.warn('⚠️ Could not extract storage path from URL:', photoUrl);
      return { success: false, message: 'Invalid Storage URL format' };
    }
    
    const storagePath = decodeURIComponent(pathMatch[1]);
    console.log('🗑️ Deleting old photo from Storage:', storagePath);
    
    // Delete the file
    const fileRef = storage.ref().child(storagePath);
    await fileRef.delete();
    
    console.log('✅ Old photo deleted from Storage');
    return { success: true, path: storagePath };
    
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      console.warn('⚠️ Photo already deleted from Storage');
      return { success: true, message: 'Already deleted' };
    }
    
    console.error('❌ Error deleting photo from Storage:', error);
    return { success: false, message: error.message };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert blob to data URL
 * @param {Blob} blob - Blob to convert
 * @returns {Promise<string>} - Data URL
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to convert blob'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Get file from data URL (for offline stored files)
 * @param {string} dataUrl - Data URL
 * @param {string} filename - Filename to use
 * @returns {File} - File object
 */
function dataUrlToFile(dataUrl, filename) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * Generate a thumbnail from an image
 * @param {File|Blob} imageFile - Image to thumbnail
 * @param {number} size - Thumbnail size (square)
 * @returns {Promise<Blob>} - Thumbnail blob
 */
async function generateThumbnail(imageFile, size = 150) {
  return compressImage(imageFile, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7
  });
}

/**
 * Preview an image file before upload
 * @param {File} file - Image file
 * @param {HTMLImageElement} imgElement - Image element to show preview
 */
function previewImage(file, imgElement) {
  if (!file || !imgElement) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    imgElement.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Upload file with progress tracking
 * @param {string} path - Storage path
 * @param {File|Blob} file - File to upload
 * @param {Function} onProgress - Progress callback (percentage)
 * @returns {Promise<Object>} - Result with download URL
 */
async function uploadWithProgress(path, file, onProgress) {
  const storage = getFirebaseStorage();
  
  if (!storage) {
    onProgress(100);
    const dataUrl = await blobToDataUrl(file);
    return { success: true, url: dataUrl, isLocal: true };
  }
  
  return new Promise((resolve, reject) => {
    const fileRef = storage.ref().child(path);
    const uploadTask = fileRef.put(file);
    
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(Math.round(progress));
      },
      (error) => {
        console.error('❌ Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
        resolve({
          success: true,
          url: downloadUrl,
          path: path
        });
      }
    );
  });
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

function getSupportPhotoOriginalMaxBytes() {
  return STORAGE_CONFIG.maxSupportOriginalSize;
}

function isSupportPhotoOriginalTooLarge(file) {
  return !!(file && file.size > getSupportPhotoOriginalMaxBytes());
}

window.STORAGE_CONFIG = STORAGE_CONFIG;
window.validateFile = validateFile;
window.getSupportPhotoOriginalMaxBytes = getSupportPhotoOriginalMaxBytes;
window.isSupportPhotoOriginalTooLarge = isSupportPhotoOriginalTooLarge;
window.compressImage = compressImage;
window.uploadProfilePhoto = uploadProfilePhoto;
window.uploadJobPhoto = uploadJobPhoto;
window.copyJobPhotoToNewJob = copyJobPhotoToNewJob;
window.uploadSupportPhoto = uploadSupportPhoto;
window.uploadVerificationDocuments = uploadVerificationDocuments;
window.deleteStaleVerificationIdFiles = deleteStaleVerificationIdFiles;
window.deleteFile = deleteFile;
window.cleanupSupportPhotoUpload = cleanupSupportPhotoUpload;
window.deletePhotoFromStorageUrl = deletePhotoFromStorageUrl;
window.blobToDataUrl = blobToDataUrl;
window.dataUrlToFile = dataUrlToFile;
window.generateThumbnail = generateThumbnail;
window.previewImage = previewImage;
window.uploadWithProgress = uploadWithProgress;

console.log('📦 Firebase storage module loaded');

