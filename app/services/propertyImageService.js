import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFullUploadImagesFunction } from './enableImageUploads';

// Storage key for checking if real image uploads are enabled
const REAL_UPLOADS_ENABLED_KEY = 'homely_real_image_uploads_enabled';

/**
 * Fallback implementation that uses placeholder images instead of uploading
 * @param {Array} imagesToUpload - Array of image objects with uri property
 * @returns {Object} Object with imageUrls array
 */
const fallbackUploadImages = async (imagesToUpload) => {
  if (!imagesToUpload || imagesToUpload.length === 0) return { imageUrls: [] };
  
  // Use placeholder images
  const placeholderImages = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvcGVydHl8ZW58MHx8MHx8&w=1000&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80'
  ];
  
  // For each image to upload, pick a placeholder (cycling through the available ones)
  const imageUrls = imagesToUpload.map((_, index) => {
    // For demo purposes, if it's already a URL (from edit mode), just use it
    if (imagesToUpload[index]?.uri?.startsWith('http')) {
      return imagesToUpload[index].uri;
    }
    return placeholderImages[index % placeholderImages.length];
  });
  
  console.log('Using fallback images:', imageUrls);
  
  return { imageUrls };
};

/**
 * Check if real image uploads are enabled
 * @returns {Promise<boolean>} true if real uploads are enabled
 */
export const areRealUploadsEnabled = async () => {
  try {
    const enabled = await AsyncStorage.getItem(REAL_UPLOADS_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking if real uploads are enabled:', error);
    return false;
  }
};

/**
 * Enable or disable real image uploads
 * @param {boolean} enabled - Whether to enable real uploads
 */
export const setRealUploadsEnabled = async (enabled) => {
  try {
    await AsyncStorage.setItem(REAL_UPLOADS_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    console.error('Error setting real uploads enabled:', error);
  }
};

/**
 * Upload images for a property
 * This function will use either the real upload function or the fallback
 * based on whether real uploads are enabled
 * 
 * @param {Array} imagesToUpload - Array of image objects with uri property
 * @returns {Promise<Object>} Object with imageUrls array
 */
export const uploadImages = async (imagesToUpload) => {
  try {
    // Check if real uploads are enabled
    const realUploadsEnabled = await areRealUploadsEnabled();
    
    if (realUploadsEnabled) {
      console.log('Using real image uploads');
      // Get the full implementation of uploadImages
      const realUploadImages = getFullUploadImagesFunction();
      
      try {
        const result = await realUploadImages(imagesToUpload);
        console.log('Real image upload result:', result);
        
        // If we got empty results, fall back to placeholder images
        if (!result || !result.imageUrls || result.imageUrls.length === 0) {
          console.log('Real image upload returned empty results, falling back to placeholders');
          return await fallbackUploadImages(imagesToUpload);
        }
        
        return result;
      } catch (uploadError) {
        console.error('Error in real image upload, falling back to placeholders:', uploadError);
        return await fallbackUploadImages(imagesToUpload);
      }
    } else {
      console.log('Using fallback image uploads');
      // Use the fallback implementation
      return await fallbackUploadImages(imagesToUpload);
    }
  } catch (error) {
    console.error('Error in uploadImages:', error);
    // Fallback to placeholder images in case of error
    return await fallbackUploadImages(imagesToUpload);
  }
};

export default {
  uploadImages,
  areRealUploadsEnabled,
  setRealUploadsEnabled
}; 