import { AntDesign, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../auth/components/AuthContext';
import { supabase } from '../config/supabase';

const { width, height } = Dimensions.get('window');

const AMENITIES = [
  { id: 1, name: 'Swimming Pool', icon: 'pool' },
  { id: 2, name: 'Gym', icon: 'fitness-center' },
  { id: 3, name: 'Parking', icon: 'local-parking' },
  { id: 4, name: 'Security', icon: 'security' },
  { id: 5, name: 'Pet Friendly', icon: 'pets' },
  { id: 6, name: 'Garden', icon: 'grass' },
  { id: 7, name: 'Elevator', icon: 'elevator' },
  { id: 8, name: 'Air Conditioning', icon: 'ac-unit' },
  { id: 9, name: 'Heating', icon: 'hot-tub' },
  { id: 10, name: 'Laundry', icon: 'local-laundry-service' },
];

const PropertyDetailsScreen = () => {
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [propertyImages, setPropertyImages] = useState([]);
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // Fetch property details
  React.useEffect(() => {
    const fetchPropertyDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) {
          console.error('Error fetching property details:', error);
          return;
        }
        
        setProperty(data);
        
        // Check if property is favorited by user
        if (user) {
          const { data: favoriteData, error: favoriteError } = await supabase
            .from('property_favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('property_id', id)
            .single();
            
          if (!favoriteError && favoriteData) {
            setIsFavorite(true);
          }
        }
        
        // Fetch additional images
        fetchAdditionalImages(id);
        
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPropertyDetails();
  }, [id, user]);
  
  const fetchAdditionalImages = async (propertyId) => {
    try {
      const { data: additionalImages, error } = await supabase
        .from('property_images')
        .select('image_url')
        .eq('property_id', propertyId)
        .order('display_order', { ascending: true });
        
      if (error) {
        console.error('Error fetching additional images:', error);
        return;
      }
      
      if (additionalImages && additionalImages.length > 0) {
        // Extract URLs from the result
        const additionalUrls = additionalImages.map(img => img.image_url);
        setPropertyImages(prev => {
          // Make a new array with main image + additional images
          const mainImage = prev[0]; // Keep the first image as is
          return [mainImage, ...additionalUrls];
        });
      }
    } catch (error) {
      console.error('Error fetching additional images:', error);
    }
  };
  
  const toggleFavorite = async () => {
    if (!user) {
      // Redirect to login if not logged in
      navigation.navigate('auth');
      return;
    }
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('property_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('property_id', id);
          
        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('property_favorites')
          .insert({
            user_id: user.id,
            property_id: id
          });
          
        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const shareProperty = async () => {
    try {
      await Share.share({
        message: `Check out this property: ${property.name} at ${property.location} - $${property.price}`,
        url: property.image_url,
        title: 'Homely Property'
      });
    } catch (error) {
      console.error('Error sharing property:', error);
    }
  };
  
  if (loading || !property) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading property details...</Text>
      </View>
    );
  }
  
  // Initialize property images with the main image
  if (propertyImages.length === 0 && property) {
    setPropertyImages([
      property.image_url
      // Remove default fallback images
    ]);
  }

  const renderImageItem = ({ item, index }) => {
    return (
      <View style={styles.imageSlide}>
        <Image
          source={{ uri: item }}
          style={styles.propertyImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentImageIndex(index);
  };

  // Generate random amenities for the property
  const propertyAmenities = AMENITIES.slice(0, 6 + Math.floor(Math.random() * 4));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <Animated.ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: 100}}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* Property Image Gallery */}
        <View style={styles.imageContainer}>
          <FlatList
            ref={flatListRef}
            data={propertyImages}
            renderItem={renderImageItem}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={propertyImages.length > 1 ? handleScroll : undefined}
            scrollEnabled={propertyImages.length > 1}
            scrollEventThrottle={16}
          />
          
          {/* Image pagination dots - only show if there are multiple images */}
          {propertyImages.length > 1 && (
            <View style={styles.paginationContainer}>
              {propertyImages.map((_, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.paginationDot,
                    { backgroundColor: currentImageIndex === index ? '#fff' : 'rgba(255, 255, 255, 0.5)' }
                  ]}
                  onPress={() => {
                    setCurrentImageIndex(index);
                    flatListRef.current?.scrollToOffset({ 
                      offset: index * width, 
                      animated: true 
                    });
                  }}
                />
              ))}
            </View>
          )}
          
          {/* Overlay gradient for buttons */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            style={styles.headerGradient}
          />
          
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Action buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={shareProperty}
            >
              <Ionicons name="share-outline" size={22} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={toggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "heart" : "heart-outline"} 
                size={22} 
                color={isFavorite ? "#FF5A5F" : "white"} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Property Details */}
        <View style={styles.detailsContainer}>
          {/* Price and title section */}
          <View style={styles.titlePriceContainer}>
            <Text style={styles.propertyName}>{property.name}</Text>
            <Text style={styles.priceValue}>${property.price.toLocaleString()}</Text>
          </View>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <Text style={styles.locationText}>{property.location}</Text>
          </View>
          
          {/* Key Features */}
          <View style={styles.keyFeaturesContainer}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="bed-king-outline" size={28} color="#333" />
              <Text style={styles.featureValue}>{property.beds}</Text>
              <Text style={styles.featureLabel}>Bedrooms</Text>
            </View>
            
            <View style={styles.featureDivider} />
            
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="shower" size={28} color="#333" />
              <Text style={styles.featureValue}>{property.baths}</Text>
              <Text style={styles.featureLabel}>Bathrooms</Text>
            </View>
            
            <View style={styles.featureDivider} />
            
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="floor-plan" size={28} color="#333" />
              <Text style={styles.featureValue}>{property.sqft}</Text>
              <Text style={styles.featureLabel}>Sq Ft</Text>
            </View>
            
            <View style={styles.featureDivider} />
            
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="car-estate" size={28} color="#333" />
              <Text style={styles.featureValue}>{property.garage || 1}</Text>
              <Text style={styles.featureLabel}>Parking</Text>
            </View>
          </View>
          
          {/* Overview */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.descriptionText}>{property.description}</Text>
          </View>
          
          {/* Property Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Property Details</Text>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Property Type</Text>
                <Text style={styles.detailValue}>{property.property_type || 'Apartment'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Year Built</Text>
                <Text style={styles.detailValue}>{property.year_built || '2020'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Heating</Text>
                <Text style={styles.detailValue}>Central</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Cooling</Text>
                <Text style={styles.detailValue}>Central A/C</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Stories</Text>
                <Text style={styles.detailValue}>{property.stories || '1'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={styles.detailValue}>For {property.listing_type || 'Sale'}</Text>
              </View>
            </View>
          </View>
          
          {/* Amenities */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            
            <View style={styles.amenitiesContainer}>
              {propertyAmenities.map((amenity) => (
                <View key={amenity.id} style={styles.amenityItem}>
                  <MaterialIcons name={amenity.icon} size={22} color="#333" />
                  <Text style={styles.amenityText}>{amenity.name}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Location */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapPreviewContainer}>
              <Image 
                source={{ uri: 'https://maps.googleapis.com/maps/api/staticmap?center=' + 
                  encodeURIComponent(property.location) + 
                  '&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C' + 
                  encodeURIComponent(property.location) + 
                  '&key=AIzaSyAm2-Trq368_Eq2-0UrjYdDMYJvI67sL5Y' }}
                style={styles.mapImage}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
                style={styles.mapGradient}
              />
              <View style={styles.mapAddressContainer}>
                <Ionicons name="location" size={20} color="white" />
                <Text style={styles.mapAddressText}>{property.location}</Text>
              </View>
            </View>
          </View>
          
          {/* Contact Agent */}
          <View style={styles.agentContainer}>
            <View style={styles.agentInfo}>
              <Image 
                source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }}
                style={styles.agentImage}
              />
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>John Smith</Text>
                <Text style={styles.agentCompany}>Homely Real Estate</Text>
                <View style={styles.agentRating}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <AntDesign 
                      key={star} 
                      name={star <= 4 ? "star" : "staro"} 
                      size={14} 
                      color="#FFD700" 
                    />
                  ))}
                  <Text style={styles.ratingText}> (42 reviews)</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
      
      {/* Contact Buttons - Fixed at bottom */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Call Agent</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.messageButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#000" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 400,
  },
  imageSlide: {
    width: width,
    height: 400,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  actionButtonsContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'row',
    zIndex: 2,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  detailsContainer: {
    padding: 20,
  },
  titlePriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    fontSize: 15,
    color: '#666',
    marginLeft: 4,
  },
  keyFeaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E0E0E0',
  },
  featureValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 2,
  },
  featureLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  detailItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  amenityText: {
    fontSize: 14,
    marginLeft: 8,
  },
  mapPreviewContainer: {
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  mapAddressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  mapAddressText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  agentContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  agentCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  agentRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  bottomButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  messageButtonText: {
    color: '#000',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PropertyDetailsScreen; 