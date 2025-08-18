import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { supabase } from '../config/supabase';
import { uploadImages as propertyImageUpload } from '../services/propertyImageService';
import { createPropertyImagesTable } from '../services/setupSql';

// Custom Confirmation Dialog Component
const ConfirmationDialog = ({ visible, title, message, onCancel, onConfirm }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalConfirmButton]} 
              onPress={onConfirm}
            >
              <Text style={styles.modalConfirmText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Custom Success Modal Component with memory optimizations
const SuccessModal = ({ visible, title, message, onClose }) => {
  // Use state to track if modal has been shown long enough
  const [canClose, setCanClose] = useState(false);
  
  // Set a timer to allow closing after 1 second
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setCanClose(true);
      }, 1000);
      
      return () => {
        clearTimeout(timer);
        setCanClose(false);
      };
    }
  }, [visible]);
  
  // Handler to close and reset state
  const handleClose = () => {
    if (canClose) {
      onClose();
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>
          <View style={styles.successButtonContainer}>
            <TouchableOpacity 
              style={[
                styles.modalButton, 
                styles.modalConfirmButton,
                !canClose && styles.modalButtonDisabled
              ]} 
              onPress={handleClose}
              disabled={!canClose}
            >
              <Text style={styles.modalConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Form fields configuration
const formFields = [
  { id: 'name', label: 'Property Name', placeholder: 'Enter property name', type: 'text' },
  { id: 'description', label: 'Description', placeholder: 'Enter property description', type: 'textarea' },
  { id: 'location', label: 'Location', placeholder: 'Enter property location', type: 'text' },
  { id: 'price', label: 'Price', placeholder: 'Enter price per month', type: 'number', keyboardType: 'numeric' },
  { id: 'beds', label: 'Bedrooms', placeholder: 'Number of bedrooms', type: 'number', keyboardType: 'numeric' },
  { id: 'baths', label: 'Bathrooms', placeholder: 'Number of bathrooms', type: 'number', keyboardType: 'numeric' },
  { id: 'sqft', label: 'Square Feet', placeholder: 'Property size in sqft', type: 'number', keyboardType: 'numeric' },
  { id: 'property_type', label: 'Property Type', placeholder: 'Type (house, apartment, etc)', type: 'text' },
];

export default function PropertyManagementScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageBucketReady, setStorageBucketReady] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Animation values
  const headerHeight = useSharedValue(200);
  const formOpacity = useSharedValue(0);
  
  // Auto-close success modal after delay
  useEffect(() => {
    let timeout;
    if (successModalVisible) {
      timeout = setTimeout(() => {
        setSuccessModalVisible(false);
      }, 1500);
    }
    return () => clearTimeout(timeout);
  }, [successModalVisible]);
  
  useEffect(() => {
    loadProperties();
    loadCategories();
    ensureStorageBucketExists();
    createPropertyImagesTable();
    
    // Request permission for image picker
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant camera roll permissions to upload images');
      }
    })();
  }, []);
  
  const ensureStorageBucketExists = async () => {
    try {
      // Check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) {
        console.error("Error listing buckets:", bucketsError);
        // Continue anyway with the known bucket name
        console.log("Using predefined property-images bucket");
        setStorageBucketReady(true);
        return;
      }
      
      // Look for the property-images bucket
      let propertyImagesBucket = buckets.find(bucket => bucket.name === 'property-images');
      
      if (propertyImagesBucket) {
        console.log("property-images bucket found");
      } else {
        console.log("property-images bucket not found in list, but will use it anyway");
        // We'll still use the bucket name even if not found in the list
        // This can happen due to RLS policies restricting bucket listing
      }
      
      // Test if we can access the bucket
      try {
        const { data: files, error: filesError } = await supabase
          .storage
          .from('property-images')
          .list();
        
        if (filesError) {
          console.log("Note: Could not list files in property-images bucket. This is normal if RLS is enabled.");
        } else {
          console.log(`Found ${files?.length || 0} files in property-images bucket`);
        }
      } catch (accessError) {
        console.log("Could not access property-images bucket files, but will continue");
      }
      
      // Mark as ready - we'll use the bucket regardless
      setStorageBucketReady(true);
    } catch (error) {
      console.error("Error ensuring bucket exists:", error);
      // Continue anyway, we'll use the known bucket name
      setStorageBucketReady(true);
    }
  };
  
  const loadProperties = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_categories(name)')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
      
      console.log('Loaded properties:', data?.length || 0);
      
      // For each property, check if it has additional images
      if (data && data.length > 0) {
        // Get all additional images in one query for efficiency
        const { data: allAdditionalImages, error: imagesError } = await supabase
          .from('property_images')
          .select('*')
          .in('property_id', data.map(p => p.id))
          .order('display_order', { ascending: true });
          
        if (!imagesError && allAdditionalImages && allAdditionalImages.length > 0) {
          console.log(`Loaded ${allAdditionalImages.length} additional images for all properties`);
          
          // Group images by property_id for easier access
          const imagesByProperty = {};
          allAdditionalImages.forEach(img => {
            if (!imagesByProperty[img.property_id]) {
              imagesByProperty[img.property_id] = [];
            }
            imagesByProperty[img.property_id].push(img);
          });
          
          // Attach additional_images to each property
          data.forEach(property => {
            property.additional_images = imagesByProperty[property.id] || [];
          });
        }
      }
      
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading properties:', error);
      Alert.alert('Error', 'Failed to load properties');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('property_categories')
        .select('*')
        .order('display_order', { ascending: true });
        
      if (error) throw error;
      
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const handleAddNew = () => {
    setSelectedProperty(null);
    setFormData({});
    setSelectedCategory(null);
    setIsFeatured(false);
    setSelectedImages([]);
    setIsAdding(true);
    setIsEditing(false);
    
    // Animate form appearance
    headerHeight.value = withTiming(100, { duration: 300 });
    formOpacity.value = withTiming(1, { duration: 400 });
  };
  
  const handleEdit = (property) => {
    setSelectedProperty(property);
    setFormData({
      name: property.name,
      description: property.description,
      location: property.location,
      price: property.price?.toString(),
      beds: property.beds?.toString(),
      baths: property.baths?.toString(),
      sqft: property.sqft?.toString(),
      property_type: property.property_type,
    });
    
    // Set main image if available
    const images = [];
    if (property.image_url) {
      // Ensure the main image has the proper structure
      images.push({ uri: property.image_url, type: 'image' });
    }
    
    // Load additional images for this property
    const loadAdditionalImages = async () => {
      try {
        const { data: additionalImages, error } = await supabase
          .from('property_images')
          .select('*')
          .eq('property_id', property.id)
          .order('display_order', { ascending: true });
          
        if (error) {
          console.error('Error loading additional images:', error);
        } else if (additionalImages && additionalImages.length > 0) {
          console.log(`Found ${additionalImages.length} additional images for property ${property.id}`);
          
          // Add additional images to the selected images array
          additionalImages.forEach(img => {
            if (img.image_url) {
              // Ensure each additional image has the proper structure
              images.push({ uri: img.image_url, type: 'image' });
            }
          });
        } else {
          console.log(`No additional images found for property ${property.id}`);
        }
        
        // Check if we have any images at all
        if (images.length === 0) {
          // Add a placeholder if no images were found
          images.push({ 
            uri: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvcGVydHl8ZW58MHx8MHx8&w=1000&q=80', 
            type: 'image' 
          });
        }
        
        setSelectedImages(images);
      } catch (error) {
        console.error('Error in loadAdditionalImages:', error);
        // Still set the main image
        setSelectedImages(images);
      }
    };
    
    loadAdditionalImages();
    
    setSelectedCategory(property.category_id);
    setIsFeatured(property.is_featured || false);
    setIsAdding(false);
    setIsEditing(true);
    
    // Animate form appearance
    headerHeight.value = withTiming(100, { duration: 300 });
    formOpacity.value = withTiming(1, { duration: 400 });
  };
  
  const handleCancel = () => {
    // First animate out
    headerHeight.value = withTiming(200, { duration: 300 });
    formOpacity.value = withTiming(0, { duration: 300 });
    
    // Then reset state after animation completes
    setTimeout(() => {
      setIsAdding(false);
      setIsEditing(false);
      setSelectedProperty(null);
      setSelectedImages([]);
      setFormData({});
    }, 350); // Wait for animation to complete plus a small buffer
  };
  
  const pickImages = async () => {
    try {
      // Limit the number of total images to prevent memory issues
      const maxTotalImages = 5;
      if (selectedImages.length >= maxTotalImages) {
        Alert.alert(
          'Maximum Images Reached',
          `You can only add up to ${maxTotalImages} images for best performance.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Calculate how many more images can be added
      const remainingSlots = maxTotalImages - selectedImages.length;
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots, // Limit selection to remaining slots
        aspect: [4, 3],
        quality: 0.6, // Reduce quality to save memory
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Make sure each asset has a uri property and potentially resize large images
        const processedAssets = result.assets.map(asset => {
          // Ensure each asset has the required properties for our app logic
          return {
            ...asset,
            uri: asset.uri || '',
            type: 'image'
          };
        });
        
        // Update selected images in batches if needed
        setSelectedImages(prevImages => {
          // Calculate new total and ensure we don't exceed the max
          const newTotal = [...prevImages, ...processedAssets];
          return newTotal.slice(0, maxTotalImages);
        });
        
        console.log('Selected images:', processedAssets.length);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };
  
  const removeImage = (index) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!formData.name || !formData.location || !formData.price) {
        Alert.alert('Error', 'Please fill in all required fields');
        setIsLoading(false);
        return;
      }
      
      if (selectedImages.length === 0) {
        Alert.alert('Error', 'Please select at least one property image');
        setIsLoading(false);
        return;
      }
      
      // Limit the number of images to prevent memory issues
      const maxImages = 5;
      if (selectedImages.length > maxImages) {
        Alert.alert(
          'Warning', 
          `You've selected ${selectedImages.length} images. For best performance, we recommend using up to ${maxImages} images. The first ${maxImages} will be used.`,
          [{ text: 'OK' }]
        );
      }
      
      // Process only max number of images to prevent memory issues
      const imagesToProcess = selectedImages.slice(0, maxImages);
      let imageUrls = [];
      
      // Try to upload images, but continue even if it fails
      try {
        // Process images in smaller batches to prevent memory issues
        const uploadResult = await propertyImageUpload(imagesToProcess);
        console.log('Image upload result:', uploadResult);
        imageUrls = uploadResult.imageUrls;
      } catch (uploadError) {
        console.error("Error during image upload:", uploadError);
        // Use placeholder image as fallback
        imageUrls = ['https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvcGVydHl8ZW58MHx8MHx8&w=1000&q=80'];
      }
      
      const propertyData = {
        name: formData.name,
        description: formData.description,
        location: formData.location,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds || '0', 10),
        baths: parseInt(formData.baths || '0', 10),
        sqft: parseInt(formData.sqft || '0', 10),
        image_url: imageUrls[0] || (imagesToProcess[0] && imagesToProcess[0].uri) || '', // Use the first image as the main image
        property_type: formData.property_type || 'apartment',
        category_id: selectedCategory,
        is_featured: isFeatured,
        created_at: new Date().toISOString(), // Ensure this field is set
      };
      
      let response;
      let propertyId;
      
      try {
        if (isEditing && selectedProperty) {
          console.log('Updating property:', selectedProperty.id);
          propertyId = selectedProperty.id;
          response = await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', propertyId);
            
          // Delete existing additional images for this property
          if (imageUrls.length > 1) {
          await supabase
            .from('property_images')
            .delete()
            .eq('property_id', propertyId);
          }
        } else {
          console.log('Inserting new property');
          response = await supabase
            .from('properties')
            .insert([propertyData])
            .select(); // Get the inserted record
            
          // Get the ID of the inserted property
          if (response.data && response.data.length > 0) {
            propertyId = response.data[0].id;
          }
        }
        
        const { error, data } = response;
        console.log('Save response:', { data, error });
        
        if (error) throw error;
        
        // Only process additional images if we have a property ID and multiple images
        if (propertyId && imageUrls.length > 1) {
          console.log(`Saving ${imageUrls.length - 1} additional images for property ${propertyId}`);
          
          // Create images array (skip first one as it's already the main image)
          const additionalImages = imageUrls.slice(1).map((url, index) => ({
            property_id: propertyId,
            image_url: url,
            display_order: index + 1, // Start from 1 (0 would be the main image)
          }));
          
          // Save to property_images table
          if (additionalImages.length > 0) {
            try {
              const imagesResponse = await supabase
                .from('property_images')
                .insert(additionalImages);
                
              const { error: imagesError } = imagesResponse;
              console.log('Additional images save response:', imagesResponse);
                
              if (imagesError) {
                console.error('Error saving additional images:', imagesError);
                
                // If the table doesn't exist yet, create it
                if (imagesError.code === '42P01') { // PostgreSQL code for undefined_table
                  console.log('Attempting to create property_images table');
                  const { error: sqlError } = await supabase.rpc('create_property_images_table');
                  if (!sqlError) {
                    // Retry the insert
                    await supabase
                      .from('property_images')
                      .insert(additionalImages);
                  }
                }
              }
            } catch (imagesError) {
              console.error('Error in additional images save:', imagesError);
            }
          }
        }
        
        // First animate out the form
        headerHeight.value = withTiming(200, { duration: 300 });
        formOpacity.value = withTiming(0, { duration: 300 });
        
        // Then reset state after animation completes
        setTimeout(() => {
        setIsAdding(false);
        setIsEditing(false);
          setSelectedProperty(null);
          setSelectedImages([]);
          setFormData({});
        
          // Finally show success message after state is cleaned up
          setSuccessMessage(isEditing ? 'Property updated successfully' : 'Property added successfully');
          setSuccessModalVisible(true);
          
          // Load properties after showing success modal
        setTimeout(() => {
          loadProperties();
          }, 300);
        }, 350); // Wait for animation to complete plus a small buffer
        
      } catch (saveError) {
        console.error('Error saving property:', saveError);
        Alert.alert('Error', 'Failed to save property. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSave:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (property) => {
    setDeleteConfirmVisible(true);
    setPropertyToDelete(property);
  };
  
  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;
    
    try {
      setIsLoading(true);
      
      // First, get all image URLs for this property (main + additional)
      const imageUrls = [];
      
      // Add main image if it exists
      if (propertyToDelete.image_url) {
        imageUrls.push(propertyToDelete.image_url);
      }
      
      // Get additional images from property_images table
      try {
        const { data: additionalImages, error } = await supabase
          .from('property_images')
          .select('image_url')
          .eq('property_id', propertyToDelete.id);
          
        if (!error && additionalImages && additionalImages.length > 0) {
          additionalImages.forEach(img => {
            if (img.image_url) {
              imageUrls.push(img.image_url);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching additional images for deletion:', error);
      }
      
      // Delete from Supabase Storage if URLs are from our bucket
      const bucketName = 'property-images';
      const storagePromises = imageUrls.map(async (url) => {
        try {
          // Check if the URL is from our bucket
          if (url.includes(bucketName)) {
            // Extract file path from URL
            const urlParts = url.split('/');
            const fileName = urlParts[urlParts.length - 1];
            
            if (fileName) {
              console.log(`Deleting image from storage: ${fileName}`);
              try {
                await supabase.storage.from(bucketName).remove([fileName]);
              } catch (removeError) {
                console.error(`Error deleting ${fileName}:`, removeError);
              }
            }
          }
        } catch (error) {
          console.error('Error deleting image from storage:', error);
        }
      });
      
      // Wait for all storage deletions to complete
      await Promise.all(storagePromises);
      
      // Delete from property_images table (will cascade delete due to foreign key)
      await supabase
        .from('property_images')
        .delete()
        .eq('property_id', propertyToDelete.id);
      
      // Delete the property itself
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', propertyToDelete.id);
        
      if (error) {
        throw error;
      }
      
      // Show success message
      setSuccessMessage('Property deleted successfully');
      setSuccessModalVisible(true);
      
      // Reload properties
      loadProperties();
      
    } catch (error) {
      console.error('Error deleting property:', error);
      Alert.alert('Error', 'Failed to delete property');
    } finally {
      setIsLoading(false);
      setDeleteConfirmVisible(false);
      setPropertyToDelete(null);
    }
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    };
  });
  
  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      display: formOpacity.value === 0 ? 'none' : 'flex',
      pointerEvents: formOpacity.value === 0 ? 'none' : 'auto',
      position: formOpacity.value === 0 ? 'absolute' : 'relative',
      zIndex: formOpacity.value === 0 ? -1 : 1,
    };
  });

  // Render property item in the list
  const renderPropertyItem = ({ item }) => (
    <Animated.View 
      entering={FadeInDown.delay(200)} 
      style={styles.propertyItem}
    >
      <View style={styles.propertyContent}>
        <Image 
          source={{ 
            uri: item.image_url || 'https://via.placeholder.com/100?text=No+Image' 
          }} 
          style={styles.propertyImage}
          resizeMode="cover"
          onError={() => {
            console.log('Property image load error for property ID:', item.id);
          }}
        />
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName}>{item.name}</Text>
          <Text style={styles.propertyLocation}>{item.location}</Text>
          <Text style={styles.propertyPrice}>${item.price}/month</Text>
          {item.property_categories?.name && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.property_categories.name}</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.propertyActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // Render image picker component
  const ImagePickerComponent = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Property Images *</Text>
      <View style={styles.imagePickerContainer}>
        {selectedImages.map((image, index) => (
          <View key={index} style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: image.uri }} 
              style={styles.imagePreview} 
              resizeMode="cover"
              onError={(e) => {
                console.log('Image load error:', e.nativeEvent.error);
                // If the image fails to load, we could replace it with a placeholder
                // But we'll keep the original URI for now to avoid modifying the state
              }}
              // Use fallback URL instead of requiring a local image
              defaultSource={{ uri: 'https://via.placeholder.com/100?text=No+Image' }}
            />
            <TouchableOpacity 
              style={styles.removeImageButton} 
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color="black" />
            </TouchableOpacity>
          </View>
        ))}
        
        <TouchableOpacity 
          style={styles.addImageButton} 
          onPress={pickImages}
        >
          <Ionicons name="add-circle" size={32} color="#000" />
          <Text style={styles.addImageText}>Add Images</Text>
        </TouchableOpacity>
      </View>
      
      {uploadProgress > 0 && uploadProgress < 100 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${uploadProgress}%` }]} />
          <Text style={styles.progressText}>{uploadProgress}%</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F0F0F0']}
          style={styles.gradientContainer}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isAdding ? 'Add New Property' : isEditing ? 'Edit Property' : 'Property Management'}
            </Text>
            {!isAdding && !isEditing && (
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddNew}
              >
                <Ionicons name="add" size={24} color="black" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* List View */}
          {!isAdding && !isEditing && (
            <Animated.View style={[styles.listContainer, headerAnimatedStyle]}>
              {isLoading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator size="large" color="#000" />
                </View>
              ) : properties.length === 0 ? (
                <View style={styles.centerContent}>
                  <Ionicons name="home-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyText}>No properties found</Text>
                  <TouchableOpacity 
                    style={styles.addNewButton} 
                    onPress={handleAddNew}
                  >
                    <Text style={styles.addNewButtonText}>Add New Property</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={properties}
                  renderItem={renderPropertyItem}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              )}
            </Animated.View>
          )}
          
          {/* Form View */}
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}
            >
              {formFields.map((field) => (
                <View key={field.id} style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{field.label} {field.id === 'name' || field.id === 'location' || field.id === 'price' ? '*' : ''}</Text>
                  {field.type === 'textarea' ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChangeText={(value) => handleInputChange(field.id, value)}
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder={field.placeholder}
                      value={formData[field.id] || ''}
                      onChangeText={(value) => handleInputChange(field.id, value)}
                      keyboardType={field.keyboardType || 'default'}
                    />
                  )}
                </View>
              ))}
              
              {/* Image Picker Component */}
              <ImagePickerComponent />
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoriesContainer}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        selectedCategory === category.id && styles.categoryChipSelected
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                    >
                      <Text 
                        style={[
                          styles.categoryChipText,
                          selectedCategory === category.id && styles.categoryChipTextSelected
                        ]}
                      >
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.featuredToggle}
                onPress={() => setIsFeatured(!isFeatured)}
              >
                <View style={[
                  styles.toggleButton, 
                  isFeatured && styles.toggleButtonActive
                ]}>
                  {isFeatured && (
                    <View style={styles.toggleDot} />
                  )}
                </View>
                <Text style={styles.toggleLabel}>Mark as featured property</Text>
              </TouchableOpacity>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.cancelButton]} 
                  onPress={handleCancel}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={[styles.buttonText, styles.saveButtonText]}>
                      {isEditing ? 'Update Property' : 'Add Property'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </LinearGradient>
      </KeyboardAvoidingView>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={deleteConfirmVisible}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${propertyToDelete?.name}?`}
        onCancel={() => setDeleteConfirmVisible(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <Pressable 
          style={styles.centeredView} 
          onPress={() => setSuccessModalVisible(false)}
        >
          <View style={styles.successModalView}>
            <Animated.View 
              entering={FadeInUp.duration(400)}
              exiting={FadeOutDown.duration(300)}
            >
              <Text style={styles.successModalText}>{successMessage}</Text>
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </Animated.View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    marginTop: 10,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    marginBottom: 20,
  },
  addNewButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 8,
  },
  addNewButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
  },
  propertyItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  propertyContent: {
    flexDirection: 'row',
    flex: 1,
  },
  propertyImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  propertyInfo: {
    marginLeft: 15,
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  categoryBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
  },
  propertyActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formScrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  // Image picker styles
  imagePickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: '#F9F9F9',
  },
  addImageText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  imagePreviewContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    marginTop: 10,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  categoryChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  categoryChipSelected: {
    backgroundColor: '#000',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#333',
  },
  categoryChipTextSelected: {
    color: '#FFF',
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 2,
    marginRight: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  toggleDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#000',
    marginLeft: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  saveButtonText: {
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
  },
  modalConfirmButton: {
    backgroundColor: '#000',
  },
  modalCancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  successButtonContainer: {
    alignItems: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successModalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successModalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
}); 