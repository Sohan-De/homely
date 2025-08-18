import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { supabase } from '../config/supabase';

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

// Custom Success Modal Component
const SuccessModal = ({ visible, title, message, onClose }) => {
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
              style={[styles.modalButton, styles.modalConfirmButton]} 
              onPress={onClose}
            >
              <Text style={styles.modalConfirmText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function CategoryManagementScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_order: '0'
  });
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Animation values
  const headerHeight = useSharedValue(200);
  const formOpacity = useSharedValue(0);
  
  useEffect(() => {
    loadCategories();
  }, []);
  
  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('property_categories')
        .select('*')
        .order('display_order', { ascending: true });
        
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      console.log('Loaded categories:', data?.length || 0);
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleAddNew = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      display_order: '0'
    });
    setIsAdding(true);
    setIsEditing(false);
    
    // Animate form appearance
    headerHeight.value = withTiming(100, { duration: 300 });
    formOpacity.value = withTiming(1, { duration: 400 });
  };
  
  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      display_order: category.display_order?.toString() || '0'
    });
    setIsAdding(false);
    setIsEditing(true);
    
    // Animate form appearance
    headerHeight.value = withTiming(100, { duration: 300 });
    formOpacity.value = withTiming(1, { duration: 400 });
  };
  
  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(false);
    
    // Animate back to list view
    headerHeight.value = withTiming(200, { duration: 300 });
    formOpacity.value = withTiming(0, { duration: 300 });
  };
  
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    try {
      setIsLoading(true);

      // Prepare data
      const categoryData = {
        name: formData.name.trim(),
        // description field removed as it doesn't exist in the database
        display_order: parseInt(formData.display_order) || 0
      };

      let response;
      
      if (isEditing && selectedCategory) {
        // Update existing category
        response = await supabase
          .from('property_categories')
          .update(categoryData)
          .eq('id', selectedCategory.id);
      } else {
        // Insert new category
        response = await supabase
          .from('property_categories')
          .insert([categoryData])
          .select();
      }
      
      if (response.error) throw response.error;
      
      setSuccessMessage(isEditing ? 'Category updated successfully' : 'Category added successfully');
      setSuccessModalVisible(true);
      
      setIsAdding(false);
      setIsEditing(false);
      headerHeight.value = withTiming(200, { duration: 300 });
      formOpacity.value = withTiming(0, { duration: 300 });
      
      // Add an additional delay before final reload
      setTimeout(() => {
        loadCategories();
      }, 500);
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePress = (category) => {
    setCategoryToDelete(category);
    setDeleteConfirmVisible(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      setIsLoading(true);
      setDeleteConfirmVisible(false);
      
      // Check if there are properties using this category
      const { data: propertiesWithCategory, error: checkError } = await supabase
        .from('properties')
        .select('id')
        .eq('category_id', categoryToDelete.id)
        .limit(1);
        
      if (checkError) throw checkError;
      
      if (propertiesWithCategory && propertiesWithCategory.length > 0) {
        Alert.alert(
          'Cannot Delete',
          'This category is being used by one or more properties. Please reassign those properties first.'
        );
        setIsLoading(false);
        return;
      }
      
      // Delete the category
      const { error } = await supabase
        .from('property_categories')
        .delete()
        .eq('id', categoryToDelete.id);
        
      if (error) throw error;
      
      loadCategories();
      setSuccessMessage('Category deleted successfully');
      setSuccessModalVisible(true);
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Error', 'Failed to delete category');
    } finally {
      setIsLoading(false);
      setCategoryToDelete(null);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteConfirmVisible(false);
    setCategoryToDelete(null);
  };
  
  const handleInputChange = (field, value) => {
    setFormData(prevData => ({ ...prevData, [field]: value }));
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadCategories();
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
    };
  });

  // Render category item in the list
  const renderCategoryItem = ({ item }) => (
    <Animated.View 
      entering={FadeInDown.delay(200)} 
      style={styles.categoryItem}
    >
      <View style={styles.categoryContent}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.displayOrder}>Display Order: {item.display_order}</Text>
        </View>
      </View>
      
      <View style={styles.categoryActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePress(item)}>
          <Ionicons name="trash-outline" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </Animated.View>
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
              {isAdding ? 'Add New Category' : isEditing ? 'Edit Category' : 'Category Management'}
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
              ) : categories.length === 0 ? (
                <View style={styles.centerContent}>
                  <Ionicons name="grid-outline" size={64} color="#CCC" />
                  <Text style={styles.emptyText}>No categories found</Text>
                  <TouchableOpacity 
                    style={styles.addNewButton} 
                    onPress={handleAddNew}
                  >
                    <Text style={styles.addNewButtonText}>Add New Category</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={categories}
                  renderItem={renderCategoryItem}
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
            <View style={styles.formContent}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Category Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter category name"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                />
              </View>
              
              {/* Display Order Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Display Order</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter display order number"
                  value={formData.display_order}
                  onChangeText={(value) => handleInputChange('display_order', value)}
                  keyboardType="numeric"
                />
              </View>
              
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
                      {isEditing ? 'Update Category' : 'Add Category'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
          
          {/* Custom Delete Confirmation Modal */}
          <ConfirmationDialog
            visible={deleteConfirmVisible}
            title="Confirm Delete"
            message={categoryToDelete ? `Are you sure you want to delete ${categoryToDelete.name}?` : ""}
            onCancel={handleDeleteCancel}
            onConfirm={handleDeleteConfirm}
          />
          
          {/* Success Modal */}
          <SuccessModal
            visible={successModalVisible}
            title="Success"
            message={successMessage}
            onClose={() => setSuccessModalVisible(false)}
          />
        </LinearGradient>
      </KeyboardAvoidingView>
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
  formContent: {
    padding: 20,
    paddingTop: 30,
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
  categoryItem: {
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
  categoryContent: {
    flex: 1,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  displayOrder: {
    fontSize: 13,
    color: '#888',
    marginTop: 5,
  },
  categoryActions: {
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
    height: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#FFF',
  },
  // Custom Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
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
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F5F5F5',
    marginRight: 10,
  },
  modalConfirmButton: {
    backgroundColor: '#000',
    marginLeft: 10,
  },
  modalCancelText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  successButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
}); 