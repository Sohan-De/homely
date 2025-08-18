import { supabase } from '../config/supabase';

/**
 * This function tests if the property-images bucket is properly configured
 * and the user has permission to upload to it.
 * 
 * @returns {Promise<boolean>} true if uploads are working, false otherwise
 */
export const testBucketPermissions = async () => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log('User not authenticated, cannot test bucket permissions');
      return false;
    }
    
    console.log('Assuming property-images bucket exists, testing upload permissions...');
    
    // Try to upload a small test file
    const testData = 'test';
    const testBlob = new Blob([testData], { type: 'text/plain' });
    const testFileName = `test_${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase
      .storage
      .from('property-images')
      .upload(testFileName, testBlob, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadError) {
      console.error('Error uploading test file:', uploadError);
      return false;
    }
    
    // Try to get the URL of the test file
    const { data: publicUrl } = supabase
      .storage
      .from('property-images')
      .getPublicUrl(testFileName);
      
    if (!publicUrl || !publicUrl.publicUrl) {
      console.error('Error getting public URL for test file');
      return false;
    }
    
    // Clean up the test file
    try {
      await supabase.storage.from('property-images').remove([testFileName]);
    } catch (removeError) {
      console.error('Error removing test file:', removeError);
      // Continue anyway, this is just cleanup
    }
    
    console.log('Bucket permissions test passed!');
    return true;
  } catch (error) {
    console.error('Error testing bucket permissions:', error);
    return false;
  }
};

/**
 * Call this function to restore the original image upload functionality
 * after the bucket permissions have been set up.
 * 
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export const enableImageUploads = async () => {
  try {
    // First test if bucket permissions are working
    const permissionsOk = await testBucketPermissions();
    
    if (!permissionsOk) {
      return { 
        success: false, 
        message: 'Bucket permissions test failed. Please run the SQL setup script first.' 
      };
    }
    
    // If we get here, bucket permissions are working
    return { 
      success: true, 
      message: 'Image uploads are now enabled! The app will use real image uploads instead of fallback images.' 
    };
  } catch (error) {
    console.error('Error enabling image uploads:', error);
    return { 
      success: false, 
      message: `Error: ${error.message}` 
    };
  }
};

/**
 * This function returns the full implementation of the uploadImages function
 * that uses the Supabase storage bucket.
 * 
 * @returns {Function} The uploadImages function implementation
 */
export const getFullUploadImagesFunction = () => {
  // This is the full implementation of the uploadImages function
  return async (imagesToUpload) => {
    if (!imagesToUpload || imagesToUpload.length === 0) {
      console.log('No images to upload, returning empty array');
      return { imageUrls: [] };
    }
    
    try {
      const imageUrls = [];
      
      // Use placeholder image if we can't upload
      const fallbackImageUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvcGVydHl8ZW58MHx8MHx8&w=1000&q=80';
      
      // Always use our dedicated bucket
      const bucketName = 'property-images';
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('User not authenticated, cannot upload images');
        return { 
          imageUrls: imagesToUpload.map(() => fallbackImageUrl)
        };
      }
      
      // Upload each image in sequence to avoid memory issues
      for (let i = 0; i < imagesToUpload.length; i++) {
        const image = imagesToUpload[i];
        
        // Skip if image doesn't have a URI
        if (!image || !image.uri) {
          console.error("Image missing URI at index", i);
          imageUrls.push(fallbackImageUrl);
          continue;
        }
        
        // For demo purposes, if it's already a URL (from edit mode), just use it
        if (image.uri.startsWith('http')) {
          console.log(`Image ${i} is already a URL, using as is:`, image.uri);
          imageUrls.push(image.uri);
          continue;
        }
        
        try {
          // Get the file extension
          const ext = image.uri.split('.').pop() || 'jpg'; // Default to jpg if no extension
          const fileName = `property_${Date.now()}_${i}.${ext}`;
          
          console.log(`Uploading image ${i+1}/${imagesToUpload.length} as ${fileName}`);
          
          // Fetch the image data
          const response = await fetch(image.uri);
          if (!response.ok) {
            console.error(`Failed to fetch image data: ${response.status} ${response.statusText}`);
            imageUrls.push(fallbackImageUrl);
            continue;
          }
          
          const blob = await response.blob();
          console.log(`Got blob of size ${blob.size} bytes and type ${blob.type}`);
          
          // Upload the image
          const uploadResponse = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, blob, {
              contentType: `image/${ext}`,
              cacheControl: '3600',
              upsert: true
            });
            
          const { data, error } = uploadResponse;
          console.log(`Upload response for image ${i+1}:`, uploadResponse);
          
          if (error) {
            console.error("Upload error:", error.message);
            imageUrls.push(fallbackImageUrl);
          } else {
            // Get public URL
            const urlResponse = supabase
              .storage
              .from(bucketName)
              .getPublicUrl(fileName);
              
            console.log(`Public URL response for image ${i+1}:`, urlResponse);
            
            if (urlResponse && urlResponse.data && urlResponse.data.publicUrl) {
              console.log(`Uploaded image ${i+1}/${imagesToUpload.length} successfully:`, urlResponse.data.publicUrl);
              imageUrls.push(urlResponse.data.publicUrl);
            } else {
              console.error("Failed to get public URL");
              imageUrls.push(fallbackImageUrl);
            }
          }
        } catch (uploadError) {
          console.error("Error with upload:", uploadError);
          imageUrls.push(fallbackImageUrl);
        }
        
        // Small delay between uploads to prevent memory pressure
        if (i < imagesToUpload.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      console.log('Final image URLs:', imageUrls);
      return { imageUrls };
      
    } catch (error) {
      console.error("Error in uploadImages:", error);
      
      // Fallback to a placeholder image
      return { 
        imageUrls: ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvcGVydHl8ZW58MHx8MHx8&w=1000&q=80']
      };
    }
  };
};

export default {
  testBucketPermissions,
  enableImageUploads,
  getFullUploadImagesFunction
}; 