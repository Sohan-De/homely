import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useNavigation } from 'expo-router';
import { fetchPropertyCategories } from '../services/propertyService';
import { useFocusEffect } from '@react-navigation/native';

const PropertyTab = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const navigation = useNavigation();
  
  // Reset active tab when returning to this screen
  useFocusEffect(
    React.useCallback(() => {
      // Reset active tab when screen is focused
      setActiveTab(null);
      
      return () => {
        // Clean up if needed
      };
    }, [])
  );
  
  const propertyTypes = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'house', name: 'House', icon: 'home-outline' },
    { id: 'apartment', name: 'Apartment', icon: 'business-outline' },
    { id: 'villa', name: 'Villa', icon: 'home' },
    { id: 'condo', name: 'Condo', icon: 'bed-outline' },
  ];
  
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchPropertyCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);
  
  const navigateToPropertyList = (type) => {
    if (!type || type === 'all') {
      router.push({
        pathname: '/screens/property-list',
        params: { propertyType: null, categoryName: 'All Properties' }
      });
    } else {
      router.push({
        pathname: '/screens/property-list',
        params: { propertyType: type, categoryName: propertyTypes.find(t => t.id === type)?.name }
      });
    }
  };
  
  const navigateToCategoryList = (category) => {
    router.push({
      pathname: '/screens/property-list',
      params: { categoryId: category.id, categoryName: category.name }
    });
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Properties',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerRight: () => (
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/search')}
            >
              <Ionicons name="search-outline" size={20} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      
      {/* Property Types Row */}
      <View style={styles.typesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typesScrollContent}
        >
          {propertyTypes.map((type) => (
            <TouchableOpacity 
              key={type.id}
              style={[
                styles.typeButton,
                activeTab === type.id && styles.activeTypeButton
              ]}
              onPress={() => {
                setActiveTab(type.id === activeTab ? null : type.id);
                navigateToPropertyList(type.id);
              }}
            >
              <Ionicons 
                name={type.icon} 
                size={type.id === 'all' ? 20 : 22} 
                color={activeTab === type.id ? "#fff" : "#333"} 
              />
              <Text 
                style={[
                  styles.typeText,
                  activeTab === type.id && styles.activeTypeText
                ]}
              >
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Categories Section */}
      <Text style={styles.sectionTitle}>Browse by Category</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              style={styles.categoryCard}
              onPress={() => navigateToCategoryList(category)}
            >
              <Image 
                source={{ uri: category.image_url || `https://source.unsplash.com/collection/1118894/300x150?${category.name}` }} 
                style={styles.categoryImage}
                resizeMode="cover"
              />
              <View style={styles.categoryOverlay} />
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryCount}>{category.property_count || 0} Properties</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  typesContainer: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  typesScrollContent: {
    paddingHorizontal: 15,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: '#f5f5f5',
  },
  activeTypeButton: {
    backgroundColor: '#000',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  activeTypeText: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesContainer: {
    padding: 15,
  },
  categoryCard: {
    height: 150,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  categoryName: {
    position: 'absolute',
    bottom: 35,
    left: 15,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  categoryCount: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    color: '#fff',
    fontSize: 14,
    fontWeight: '400',
  },
});

export default PropertyTab; 