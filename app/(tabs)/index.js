import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useAuth } from '../auth/components/AuthContext';
import FilterScreen from '../screens/FilterScreen';
import { getDatabaseSql, initializeDatabase } from '../services/initDatabase';
import { fetchPropertiesByCategory, fetchPropertiesByType, fetchPropertyCategories, fetchUserFavorites, filterProperties, navigateToPropertyDetails, togglePropertyFavorite } from '../services/propertyService';
import { setupSupabase } from '../services/setupSupabase';

const { width } = Dimensions.get('window');

// Individual shape component for 3D background
const AnimatedShape = ({ index }) => {
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5 + Math.random() * 0.3);

  useEffect(() => {
    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, { 
        duration: 20000 + index * 2000, 
        easing: Easing.linear 
      }), 
      -1
    );

    // Float animation
    translateY.value = withRepeat(
      withSequence(
        withTiming(15, { 
          duration: 2000 + index * 500, 
          easing: Easing.inOut(Easing.quad) 
        }),
        withTiming(-15, { 
          duration: 2000 + index * 500, 
          easing: Easing.inOut(Easing.quad) 
        })
      ), 
      -1, 
      true
    );

    // Scale animation
    scale.value = withRepeat(
      withSequence(
        withDelay(
          index * 400,
          withTiming(1.2, { 
            duration: 3000, 
            easing: Easing.inOut(Easing.quad) 
          })
        ),
        withTiming(0.9, { 
          duration: 3000, 
          easing: Easing.inOut(Easing.quad) 
        })
      ), 
      -1, 
      true
    );
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { translateY: translateY.value },
        { scale: scale.value },
        { perspective: 1000 }
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.shape,
        { 
          width: 100 + index * 20, 
          height: 100 + index * 20,
          borderRadius: index % 2 === 0 ? 999 : 30,
          backgroundColor: index % 2 === 0 ? 'rgba(76, 77, 220, 0.15)' : 'rgba(110, 111, 255, 0.15)',
          top: 100 + index * 50,
          left: 40 + index * 60,
        },
        animatedStyle
      ]}
    />
  );
};

// 3D animated background shapes component
const AnimatedBackground = () => {
  const shapes = Array(5).fill().map((_, i) => i);

  return (
    <View style={styles.backgroundContainer}>
      {shapes.map((index) => (
        <AnimatedShape key={index} index={index} />
      ))}
    </View>
  );
};

// Feature card component
const FeatureCard = ({ icon, title, description }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 150 });
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <Animated.View style={[styles.featureCard, animatedStyle]}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={24} color="#4C4DDC" />
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Property card component for horizontal lists
const PropertyCard = ({ property, onToggleFavorite }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 150 });
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  const handleFavoritePress = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(property.id, !property.favorite);
    }
  };
  
  const handlePress = () => {
    navigateToPropertyDetails(property.id);
  };

  return (
    <TouchableOpacity 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.9}
      style={styles.propertyCardContainer}
    >
      <Animated.View style={[styles.propertyCard, animatedStyle]}>
        <Image 
          source={{ uri: property.image_url }} 
          style={styles.propertyImage} 
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.favoriteButton} onPress={handleFavoritePress}>
          <Ionicons 
            name={property.favorite ? "heart" : "heart-outline"} 
            size={20} 
            color={property.favorite ? "#FF5C5C" : "#333"} 
          />
          </TouchableOpacity>
        <View style={styles.locationTag}>
          <Ionicons name="location-outline" size={14} color="#fff" />
          <Text style={styles.locationText}>{property.location.split(',')[0]}</Text>
        </View>
        <View style={styles.propertyDetails}>
          <Text style={styles.propertyName}>{property.name}</Text>
          <Text style={styles.propertyPrice}>${property.price}<Text style={styles.priceUnit}>/month</Text></Text>
          <View style={styles.propertyStats}>
            {property.beds && (
              <View style={styles.propertyStat}>
                <MaterialCommunityIcons name="bed-outline" size={16} color="#888" />
                <Text style={styles.propertyStatText}>{property.beds}</Text>
              </View>
            )}
            {property.baths && (
              <View style={styles.propertyStat}>
                <MaterialCommunityIcons name="shower" size={16} color="#888" />
                <Text style={styles.propertyStatText}>{property.baths}</Text>
              </View>
            )}
            {property.sqft && (
              <View style={styles.propertyStat}>
                <MaterialCommunityIcons name="floor-plan" size={16} color="#888" />
                <Text style={styles.propertyStatText}>{property.sqft} sqft</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Category tab button
const CategoryTab = ({ name, active, onPress }) => {
  return (
    <TouchableOpacity 
      style={[styles.categoryTab, active && styles.activeTab]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.categoryTabText, active && styles.activeTabText]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [categoriesData, setCategoriesData] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [studioApartments, setStudioApartments] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  
  // Time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning!";
    if (hour < 18) return "Good Afternoon!";
    return "Good Evening!";
  };
  
  // Initialize the database on first load
  useEffect(() => {
    const initDb = async () => {
      try {
        // Try to initialize Supabase database structures
        setLoading(true);
        
        // Check if database tables exist and show instructions if needed
        const dbStatus = await initializeDatabase();
        
        if (dbStatus.success) {
          // If tables exist, try to seed data if needed
          const result = await setupSupabase();
          
          if (result.success) {
            setDbInitialized(true);
          } else {
            console.log('Database message:', result.message);
            // We'll still try to load data in case the tables exist
            setDbInitialized(true);
          }
        } else {
          // If tables don't exist, we'll show a message about the SQL
          console.log('Database SQL needed:', getDatabaseSql());
          // We'll set dbInitialized to true to try loading anyway
          // (will fail but at least show the UI)
          setDbInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing database:', error);
        Alert.alert(
          'Database Error',
          'Could not connect to the database. Some features may not work properly.'
        );
        // We'll still try to load data
        setDbInitialized(true);
      }
    };
    
    initDb();
  }, []);
  
  // Load data from Supabase when database is initialized
  useEffect(() => {
    if (!dbInitialized) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load categories - display all available categories dynamically
        const categories = await fetchPropertyCategories();
        if (categories.length > 0) {
          // Display all categories without any limit - will show 5 if there are 5, 8 if there are 8, etc.
          setCategoriesData(categories);
          // Set the first category as active by default
          setActiveCategory(categories[0].name);
          setActiveCategoryId(categories[0].id);
        }
        
        // First, get user favorites if logged in
        let userFavorites = [];
        if (user?.id) {
          userFavorites = await fetchUserFavorites(user.id) || [];
        }
        
        // Create a list of favorite property IDs for quick lookup
        const favoriteIds = new Set(userFavorites.map(fav => fav.id));
        
        // Load all properties
        const allPropsData = await fetchPropertiesByCategory(null, 100);
        setAllProperties(allPropsData.map(property => ({
          ...property,
          favorite: favoriteIds.has(property.id) // Check if in user's favorites
        })));
        
        // Load studios
        const studiosData = await fetchPropertiesByType('studio');
        setStudioApartments(studiosData.map(property => ({
          ...property,
          favorite: favoriteIds.has(property.id) // Check if in user's favorites
        })));
        
      } catch (error) {
        console.error('Error loading data:', error);
        Alert.alert(
          'Data Loading Error',
          'Could not load property data. Please try again later.'
        );
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [dbInitialized, user?.id]);
  
  // Filter properties when category changes
  useEffect(() => {
    if (!activeCategoryId || !allProperties.length) return;
    
    const filterPropertiesByCategory = () => {
      const filtered = allProperties.filter(property => property.category_id === activeCategoryId);
      setFilteredProperties(filtered);
    };
    
    filterPropertiesByCategory();
  }, [activeCategoryId, allProperties]);
  
  // Handle category change
  const handleCategoryChange = (category) => {
    setActiveCategory(category.name);
    setActiveCategoryId(category.id);
  };
  
  // Handle filter application
  const handleApplyFilters = async (filters) => {
    setAppliedFilters(filters);
    setLoading(true);
    
    try {
      const filteredData = await filterProperties(filters);
      
      // If a category is selected in the filter, update the active category
      if (filters.categoryId) {
        const category = categoriesData.find(c => c.id === filters.categoryId);
        if (category) {
          setActiveCategory(category.name);
          setActiveCategoryId(category.id);
        }
      }
      
      // Get user favorites to check which properties are favorited
      let favoriteIds = new Set();
      if (user?.id) {
        const userFavorites = await fetchUserFavorites(user.id) || [];
        favoriteIds = new Set(userFavorites.map(fav => fav.id));
      }
      
      // Update filtered properties
      setFilteredProperties(filteredData.map(property => ({
        ...property,
        favorite: favoriteIds.has(property.id)
      })));
    } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert('Error', 'Could not apply filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle toggling property favorites
  const handleToggleFavorite = async (propertyId, isFavorite) => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to save favorites.');
      return;
    }
    
    try {
      // Update local state immediately for responsive UX
      const updatePropertyInList = (list) => {
        return list.map(prop => 
          prop.id === propertyId ? { ...prop, favorite: isFavorite } : prop
        );
      };
      
      setStudioApartments(updatePropertyInList(studioApartments));
      setFilteredProperties(updatePropertyInList(filteredProperties));
      setAllProperties(updatePropertyInList(allProperties));
      
      // Try to update on server
      await togglePropertyFavorite(propertyId, user.id);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert the local state if server update fails
      const revertPropertyInList = (list) => {
        return list.map(prop => 
          prop.id === propertyId ? { ...prop, favorite: !isFavorite } : prop
        );
      };
      
      setStudioApartments(revertPropertyInList(studioApartments));
      setFilteredProperties(revertPropertyInList(filteredProperties));
      setAllProperties(revertPropertyInList(allProperties));
      
      Alert.alert('Error', 'Could not update favorite status. Please try again later.');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading properties...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.user_metadata?.full_name || 'Home Seeker'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <TouchableOpacity 
          activeOpacity={0.9} 
          style={styles.searchContainer}
          onPress={() => router.push('/search')}
        >
          <Ionicons name="search-outline" size={20} color="#888" />
          <Text style={styles.searchPlaceholder}>Search properties...</Text>
        </TouchableOpacity>
        
        {/* Category Tabs - dynamically showing all available categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContainer}
        >
          {/* Render all categories (no hard limit) */}
          {categoriesData.map((category) => (
            <CategoryTab 
              key={category.id} 
              name={category.name} 
              active={activeCategory === category.name}
              onPress={() => handleCategoryChange(category)}
            />
          ))}
        </ScrollView>
        
        {/* Filtered Properties by Category */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{activeCategory || 'Properties'}</Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/screens/property-list',
                params: { categoryId: activeCategoryId, categoryName: activeCategory }
              })}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {filteredProperties.length > 0 ? (
            <FlatList
              data={filteredProperties}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <PropertyCard 
                  property={item} 
                  onToggleFavorite={handleToggleFavorite}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No properties found in this category</Text>
            </View>
          )}
        </View>
        
        {/* Studio Apartment Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Studio Apartment</Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/screens/property-list',
                params: { propertyType: 'studio', categoryName: 'Studio Apartment' }
              })}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {studioApartments.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          >
            {studioApartments.map((item) => (
                <PropertyCard 
                  key={item.id} 
                  property={item} 
                  onToggleFavorite={handleToggleFavorite}
                />
            ))}
          </ScrollView>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No studio apartments found</Text>
            </View>
          )}
        </View>
        
        {/* All Properties Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Properties</Text>
            <TouchableOpacity 
              onPress={() => router.push({
                pathname: '/screens/property-list',
                params: { categoryName: 'All Properties' }
              })}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {allProperties.length > 0 ? (
            <View style={styles.verticalListContainer}>
              {allProperties.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.verticalPropertyCard}
                  onPress={() => navigateToPropertyDetails(item.id)}
                  activeOpacity={0.9}
                >
                  <Image 
                    source={{ uri: item.image_url }} 
                    style={styles.verticalPropertyImage} 
                    resizeMode="cover"
                  />
                  <View style={styles.verticalPropertyContent}>
                    <Text style={styles.verticalPropertyName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.locationRow}>
                      <Ionicons name="location-outline" size={13} color="#666" />
                      <Text style={styles.verticalPropertyLocation} numberOfLines={1}>{item.location}</Text>
                    </View>
                    <Text style={styles.verticalPropertyPrice}>${item.price}<Text style={styles.priceUnit}>/month</Text></Text>
                    <View style={styles.verticalPropertyStats}>
                      <View style={styles.verticalPropertyStat}>
                        <Ionicons name="bed-outline" size={13} color="#666" />
                        <Text style={styles.verticalPropertyStatText}>{item.beds}</Text>
                      </View>
                      <View style={styles.verticalPropertyStat}>
                        <Ionicons name="water-outline" size={13} color="#666" />
                        <Text style={styles.verticalPropertyStatText}>{item.baths}</Text>
                      </View>
                      <View style={styles.verticalPropertyStat}>
                        <MaterialCommunityIcons name="floor-plan" size={13} color="#666" />
                        <Text style={styles.verticalPropertyStatText}>{item.sqft} sqft</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.verticalFavoriteButton} 
                    onPress={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(item.id, !item.favorite);
                    }}
                  >
                    <Ionicons 
                      name={item.favorite ? "heart" : "heart-outline"} 
                      size={20} 
                      color={item.favorite ? "#FF5C5C" : "#ccc"} 
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No properties found</Text>
            </View>
          )}
        </View>
        
        {/* Bottom space */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Filter Modal */}
      <FilterScreen 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 14,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#888',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  shape: {
    position: 'absolute',
  },
  categoryTabsContainer: {
    paddingHorizontal: 20,
    paddingRight: 5,
    marginTop: 20,
    marginBottom: 10,
  },
  categoryTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTab: {
    backgroundColor: '#000',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  horizontalList: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  propertyCardContainer: {
    width: width * 0.7,
    marginRight: 15,
    marginBottom: 5,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  propertyImage: {
    width: '100%',
    height: 160,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  locationText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  propertyDetails: {
    padding: 16,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  propertyPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#888',
  },
  propertyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  propertyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  propertyStatText: {
    fontSize: 14,
    color: '#888',
    marginLeft: 6,
  },
  emptyStateContainer: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
  },
  bottomPadding: {
    height: 50,
  },
  verticalListContainer: {
    paddingHorizontal: 15,
  },
  verticalPropertyCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  verticalPropertyImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 12,
  },
  verticalPropertyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  verticalPropertyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  verticalPropertyLocation: {
    color: '#666',
    fontSize: 13,
    marginLeft: 4,
  },
  verticalPropertyPrice: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  verticalPropertyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verticalPropertyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  verticalPropertyStatText: {
    fontSize: 13,
    color: '#888',
    marginLeft: 4,
  },
  verticalFavoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    zIndex: 1,
  },
}); 