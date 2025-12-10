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
  
  // Allowed file types
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  
  // Storage paths
  paths: {
    profilePhotos: 'profile_photos',
    jobPhotos: 'job_photos',
    idDocuments: 'verification_ids'
  },
  
  // Image compression settings
  compression: {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8
  }
};

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
    
    // Create file reference
    const fileName = `${userId}_${Date.now()}.jpg`;
    const filePath = `${STORAGE_CONFIG.paths.profilePhotos}/${fileName}`;
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
async function uploadJobPhoto(jobId, file) {
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
    
    // Compress image
    const compressedBlob = await compressImage(file);
    
    // Create file reference
    const fileName = `${jobId}_${Date.now()}.jpg`;
    const filePath = `${STORAGE_CONFIG.paths.jobPhotos}/${fileName}`;
    const fileRef = storage.ref().child(filePath);
    
    // Upload file
    const snapshot = await fileRef.put(compressedBlob, {
      contentType: 'image/jpeg',
      customMetadata: {
        jobId: jobId,
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
    
    const timestamp = Date.now();
    
    // Upload ID document
    const idBlob = await compressImage(idFile, { maxWidth: 1600, maxHeight: 1600, quality: 0.9 });
    const idPath = `${STORAGE_CONFIG.paths.idDocuments}/${userId}/id_${timestamp}.jpg`;
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
    const selfiePath = `${STORAGE_CONFIG.paths.idDocuments}/${userId}/selfie_${timestamp}.jpg`;
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

window.STORAGE_CONFIG = STORAGE_CONFIG;
window.validateFile = validateFile;
window.compressImage = compressImage;
window.uploadProfilePhoto = uploadProfilePhoto;
window.uploadJobPhoto = uploadJobPhoto;
window.uploadVerificationDocuments = uploadVerificationDocuments;
window.deleteFile = deleteFile;
window.blobToDataUrl = blobToDataUrl;
window.dataUrlToFile = dataUrlToFile;
window.generateThumbnail = generateThumbnail;
window.previewImage = previewImage;
window.uploadWithProgress = uploadWithProgress;

console.log('📦 Firebase storage module loaded');

