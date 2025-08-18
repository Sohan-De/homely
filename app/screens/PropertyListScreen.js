import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../auth/components/AuthContext';
import FilterScreen from '../screens/FilterScreen';
import { fetchPropertiesByCategory, fetchPropertiesByType, fetchUserFavorites, filterProperties, navigateToPropertyDetails, togglePropertyFavorite } from '../services/propertyService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;
const CARD_HEIGHT = 220;

const PropertyListScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('default'); // 'default', 'price-asc', 'price-desc'
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  
  // Memoize params to prevent unnecessary re-renders
  const { categoryId, categoryName, propertyType } = useMemo(() => {
    // Get values from params and ensure they're not "null" strings
    const catId = params.categoryId && params.categoryId !== "null" ? params.categoryId : null;
    const catName = params.categoryName && params.categoryName !== "null" ? params.categoryName : 'All Properties';
    const propType = params.propertyType && params.propertyType !== "null" ? params.propertyType : null;
    
    return { categoryId: catId, categoryName: catName, propertyType: propType };
  }, [params.categoryId, params.categoryName, params.propertyType]);
  
  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      
      // If we have applied filters, use them
      if (Object.keys(appliedFilters).length > 0) {
        // Merge route params with applied filters
        const mergedFilters = {
          ...appliedFilters,
          categoryId: categoryId || appliedFilters.categoryId,
          propertyType: propertyType || appliedFilters.propertyType
        };
        
        data = await filterProperties(mergedFilters);
      } else if (categoryId) {
        data = await fetchPropertiesByCategory(categoryId, 50);
      } else if (propertyType) {
        data = await fetchPropertiesByType(propertyType, 50);
      } else {
        // If no filters, fetch all properties
        data = await fetchPropertiesByCategory(null, 50);
      }
      
      // Apply sorting
      if (sortBy === 'price-asc') {
        data = data.sort((a, b) => a.price - b.price);
      } else if (sortBy === 'price-desc') {
        data = data.sort((a, b) => b.price - a.price);
      }
      
      // Get user favorites if logged in
      let favoriteIds = new Set();
      if (user?.id) {
        try {
          const userFavorites = await fetchUserFavorites(user.id) || [];
          favoriteIds = new Set(userFavorites.map(fav => fav.id));
        } catch (favoriteError) {
          console.error('Error fetching user favorites:', favoriteError);
        }
      }
      
      // Mark properties as favorite if they're in the user's favorites
      setProperties(data.map(property => ({
        ...property,
        favorite: favoriteIds.has(property.id)
      })));
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, propertyType, sortBy, appliedFilters, user?.id]);
  
  // Use a separate effect for initial load and param changes
  useEffect(() => {
    loadProperties();
  }, [categoryId, propertyType, sortBy, appliedFilters]);
  
  const onRefresh = () => {
    setRefreshing(true);
    loadProperties();
  };
  
  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };
  
  const handleViewModeChange = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };
  
  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
    setFilterModalVisible(false);
  };
  
  const handleToggleFavorite = async (propertyId, isFavorite) => {
    if (!user) {
      router.push('/auth');
      return;
    }
    
    try {
      // Update local state immediately for responsive UX
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { ...prop, favorite: !prop.favorite } : prop
      ));
      
      // Update on server
      await togglePropertyFavorite(propertyId, user.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert local state if server update fails
      setProperties(properties.map(prop => 
        prop.id === propertyId ? { ...prop, favorite: prop.favorite } : prop
      ));
    }
  };
  
  const renderGridItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.gridCard}
        onPress={() => navigateToPropertyDetails(item.id)}
        activeOpacity={0.9}
      >
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: item.image_url }} 
            style={styles.propertyImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item.id, item.favorite);
            }}
          >
            <Ionicons 
              name={item.favorite ? "heart" : "heart-outline"} 
              size={22} 
              color={item.favorite ? "#FF5C5C" : "#fff"} 
            />
          </TouchableOpacity>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>${item.price.toLocaleString()}</Text>
          </View>
        </View>
        
        <View style={styles.propertyInfo}>
          <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>
          <View style={styles.propertyStats}>
            <View style={styles.statItem}>
              <Ionicons name="bed-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.beds}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.baths}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.sqft} sqft</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderListItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.listCard}
        onPress={() => navigateToPropertyDetails(item.id)}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.listImage}
          resizeMode="cover"
        />
        <View style={styles.listInfo}>
          <Text style={styles.propertyName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>
          <Text style={styles.priceTextList}>${item.price.toLocaleString()}</Text>
          <View style={styles.propertyStats}>
            <View style={styles.statItem}>
              <Ionicons name="bed-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.beds}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="water-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.baths}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="resize-outline" size={16} color="#666" />
              <Text style={styles.statText}>{item.sqft} sqft</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.favoriteButtonList}
          onPress={(e) => {
            e.stopPropagation();
            handleToggleFavorite(item.id, item.favorite);
          }}
        >
          <Ionicons 
            name={item.favorite ? "heart" : "heart-outline"} 
            size={22} 
            color={item.favorite ? "#FF5C5C" : "#666"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryName || propertyType || 'Properties'}
        </Text>
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Filters Row */}
      <View style={styles.filtersRow}>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'default' && styles.activeSortButton]}
            onPress={() => handleSortChange('default')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'default' && styles.activeSortButtonText]}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'price-asc' && styles.activeSortButton]}
            onPress={() => handleSortChange('price-asc')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'price-asc' && styles.activeSortButtonText]}>Price ↑</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'price-desc' && styles.activeSortButton]}
            onPress={() => handleSortChange('price-desc')}
          >
            <Text style={[styles.sortButtonText, sortBy === 'price-desc' && styles.activeSortButtonText]}>Price ↓</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.viewModeButton}
          onPress={handleViewModeChange}
        >
          <Ionicons 
            name={viewMode === 'grid' ? "list-outline" : "grid-outline"} 
            size={24} 
            color="#000" 
          />
        </TouchableOpacity>
      </View>
      
      {/* Property List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      ) : (
        <FlatList
          data={properties}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000']}
              tintColor="#000"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="home-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No properties found</Text>
            </View>
          }
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setFilterModalVisible(true)}
      >
        <Ionicons name="options-outline" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Filter Modal */}
      <FilterScreen 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={{
          categoryId: categoryId || null,
          propertyType: propertyType || null,
          ...appliedFilters
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortButtons: {
    flexDirection: 'row',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f5f5f5',
  },
  activeSortButton: {
    backgroundColor: '#000',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#666',
  },
  activeSortButtonText: {
    color: '#fff',
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 10,
  },
  gridCard: {
    width: (width - 40) / 2,
    marginHorizontal: 5,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 140,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  priceTag: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
  },
  priceText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  propertyInfo: {
    padding: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  propertyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 4,
  },
  listCard: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  listImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  listInfo: {
    flex: 1,
    padding: 12,
  },
  priceTextList: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  favoriteButtonList: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default PropertyListScreen; 