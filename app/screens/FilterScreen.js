import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation, useRouter } from 'expo-router';
import { fetchPropertyCategories } from '../services/propertyService';

const FilterScreen = ({ visible, onClose, onApply, initialFilters = {} }) => {
  const navigation = useNavigation();
  const router = useRouter();
  
  // Memoize initialFilters to prevent unnecessary re-renders
  const memoizedInitialFilters = useMemo(() => initialFilters, [visible]);
  
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [bedrooms, setBedrooms] = useState(null);
  const [bathrooms, setBathrooms] = useState(null);
  const [propertyType, setPropertyType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Only update state when the modal becomes visible or initialFilters changes
  useEffect(() => {
    if (visible && memoizedInitialFilters) {
      setPriceRange([
        memoizedInitialFilters.minPrice !== undefined ? memoizedInitialFilters.minPrice : 0,
        memoizedInitialFilters.maxPrice !== undefined ? memoizedInitialFilters.maxPrice : 10000
      ]);
      setBedrooms(memoizedInitialFilters.beds || null);
      setBathrooms(memoizedInitialFilters.baths || null);
      setPropertyType(memoizedInitialFilters.propertyType || null);
      setSelectedCategory(memoizedInitialFilters.categoryId || null);
    }
  }, [visible, memoizedInitialFilters]);
  
  // Load categories only once when component mounts
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchPropertyCategories();
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };
    
    loadCategories();
  }, []);
  
  const handleApplyFilters = () => {
    const filters = {
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      beds: bedrooms,
      baths: bathrooms,
      propertyType,
      categoryId: selectedCategory
    };
    
    onApply(filters);
    onClose();
  };
  
  const handleReset = () => {
    setPriceRange([0, 10000]);
    setBedrooms(null);
    setBathrooms(null);
    setPropertyType(null);
    setSelectedCategory(null);
  };
  
  const propertyTypes = [
    { id: 'studio', name: 'Studio' },
    { id: 'apartment', name: 'Apartment' },
    { id: 'condo', name: 'Condo' },
    { id: 'house', name: 'House' },
    { id: 'villa', name: 'Villa' },
    { id: 'cabin', name: 'Cabin' },
    { id: 'loft', name: 'Loft' },
    { id: 'townhouse', name: 'Townhouse' },
    { id: 'penthouse', name: 'Penthouse' },
    { id: 'mansion', name: 'Mansion' }
  ];
  
  const bedroomOptions = [1, 2, 3, 4, '5+'];
  const bathroomOptions = [1, 1.5, 2, 2.5, 3, '3+'];
  
  const SelectionButton = ({ selected, onPress, children }) => (
    <TouchableOpacity
      style={[styles.selectionButton, selected && styles.selectedButton]}
      onPress={onPress}
    >
      <Text style={[styles.selectionButtonText, selected && styles.selectedButtonText]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filter</Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content}>
          {/* Price Range */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <Text style={styles.priceText}>${priceRange[0]}</Text>
              <Text style={styles.priceText}>${priceRange[1]}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10000}
              step={100}
              value={priceRange[1]}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="#ddd"
              thumbTintColor="#000"
              onValueChange={(value) => setPriceRange([priceRange[0], value])}
            />
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10000}
              step={100}
              value={priceRange[0]}
              minimumTrackTintColor="#ddd"
              maximumTrackTintColor="#000"
              thumbTintColor="#000"
              onValueChange={(value) => setPriceRange([value, priceRange[1]])}
            />
          </View>
          
          {/* Bedrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bedrooms</Text>
            <View style={styles.optionsRow}>
              {bedroomOptions.map((option) => (
                <SelectionButton
                  key={option}
                  selected={bedrooms === option}
                  onPress={() => setBedrooms(bedrooms === option ? null : option)}
                >
                  {option}
                </SelectionButton>
              ))}
            </View>
          </View>
          
          {/* Bathrooms */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bathrooms</Text>
            <View style={styles.optionsRow}>
              {bathroomOptions.map((option) => (
                <SelectionButton
                  key={option}
                  selected={bathrooms === option}
                  onPress={() => setBathrooms(bathrooms === option ? null : option)}
                >
                  {option}
                </SelectionButton>
              ))}
            </View>
          </View>
          
          {/* Property Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Type</Text>
            <View style={styles.optionsGrid}>
              {propertyTypes.map((type) => (
                <SelectionButton
                  key={type.id}
                  selected={propertyType === type.id}
                  onPress={() => setPropertyType(propertyType === type.id ? null : type.id)}
                >
                  {type.name}
                </SelectionButton>
              ))}
            </View>
          </View>
          
          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.optionsGrid}>
              {categories.map((category) => (
                <SelectionButton
                  key={category.id}
                  selected={selectedCategory === category.id}
                  onPress={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                >
                  {category.name}
                </SelectionButton>
              ))}
            </View>
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  resetButton: {
    padding: 5,
  },
  resetText: {
    color: '#666',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceText: {
    fontSize: 16,
    color: '#333',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  selectionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 5,
  },
  selectedButton: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  selectionButtonText: {
    fontSize: 14,
    color: '#333',
  },
  selectedButtonText: {
    color: '#fff',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  applyButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterScreen; 