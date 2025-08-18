import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../auth/components/AuthContext';
import { fetchPropertiesByCategory } from '../services/propertyService';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 140;
const CARD_WIDTH = width * 0.8;
const GOOGLE_MAPS_API_KEY = "AIzaSyAm2-Trq368_Eq2-0UrjYdDMYJvI67sL5Y";

// Default to Paris coordinates
const DEFAULT_REGION = {
  latitude: 48.8584,
  longitude: 2.2945,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchPredictions, setPredictions] = useState([]);
  const [region, setRegion] = useState(DEFAULT_REGION);
  
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);
  const markerRefs = useRef({});
  
  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const propertiesData = await fetchPropertiesByCategory(null, 100);
      
      // Add location coordinates and property type for each property
      const propertiesWithCoords = propertiesData.map((property, index) => {
        // For demo purposes, we'll generate some coordinates around Paris
        // In a real app, you would use geocoding based on the property.location
        const latitude = 48.8584 + (Math.random() - 0.5) * 0.05;
        const longitude = 2.2945 + (Math.random() - 0.5) * 0.05;
        
        // Ensure property has a property_type field
        const propertyType = property.property_type || ['apartment', 'house', 'villa', 'condo'][Math.floor(Math.random() * 4)];
        
        return {
          ...property,
          property_type: propertyType,
          coordinate: {
            latitude,
            longitude,
          }
        };
      });
      
      setProperties(propertiesWithCoords);
      setLoading(false);

      // Fit map to show all properties
      if (propertiesWithCoords.length > 0 && mapRef.current) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            propertiesWithCoords.map(prop => prop.coordinate),
            {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            }
          );
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading properties for map:', error);
      setLoading(false);
    }
  };
  
  // Search functionality
  useEffect(() => {
    const fetchPlacePredictions = async () => {
      if (searchQuery.length < 2) {
        setPredictions([]);
        return;
      }
      
      setIsSearching(true);
      
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
            searchQuery
          )}&types=geocode&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        const data = await response.json();
        if (data.predictions) {
          setPredictions(data.predictions);
        }
      } catch (error) {
        console.error("Error fetching place predictions:", error);
      } finally {
        setIsSearching(false);
      }
    };
    
    const timeoutId = setTimeout(fetchPlacePredictions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      if (data.result && data.result.geometry && data.result.geometry.location) {
        const { lat, lng } = data.result.geometry.location;
        return { latitude: lat, longitude: lng };
      }
      return null;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const handleSelectPlace = async (prediction) => {
    const coordinates = await getPlaceDetails(prediction.place_id);
    if (coordinates) {
      // Update region and animate map
      const newRegion = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.02, // Zoom in more when searching for a location
        longitudeDelta: 0.02,
      };
      
      mapRef.current?.animateToRegion(newRegion, 1000);
      setRegion(newRegion);
      
      // Clear search results and query
      setSearchQuery(prediction.description);
      setPredictions([]);
      Keyboard.dismiss();

      // After a short delay to let the map animate, ensure all properties are visible
      setTimeout(() => {
        showAllProperties();
      }, 3000);
    }
  };

  // Function to show all properties on the map
  const showAllProperties = () => {
    if (properties.length > 0 && mapRef.current) {
      // Get current region
      const currentRegion = region;
      
      // Check if we need to zoom out to see more properties
      // Here we look for properties that might be outside the current view
      let needToAdjustView = false;
      const visibleProperties = properties.filter(property => {
        const isInView = 
          property.coordinate.latitude >= currentRegion.latitude - currentRegion.latitudeDelta/2 &&
          property.coordinate.latitude <= currentRegion.latitude + currentRegion.latitudeDelta/2 &&
          property.coordinate.longitude >= currentRegion.longitude - currentRegion.longitudeDelta/2 &&
          property.coordinate.longitude <= currentRegion.longitude + currentRegion.longitudeDelta/2;
        
        if (!isInView) {
          needToAdjustView = true;
        }
        return isInView;
      });

      // If we have less than 30% of properties visible, adjust the view
      if (needToAdjustView && visibleProperties.length < properties.length * 0.3) {
        mapRef.current?.fitToCoordinates(
          properties.map(prop => prop.coordinate),
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          }
        );
      }
    }
  };

  const onMarkerPress = (marker) => {
    setSelectedMarker(marker);
    
    // Animate to the selected marker
    mapRef.current?.animateToRegion({
      latitude: marker.coordinate.latitude,
      longitude: marker.coordinate.longitude,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    }, 350);
    
    // Clear search results
    setPredictions([]);
  };
  
  const navigateToPropertyDetails = (propertyId) => {
    router.push(`/property/${propertyId}`);
  };

  const formatPrice = (price) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    } else {
      return `$${price.toFixed(0)}`;
    }
  };
  
  // Hide property card
  const hidePropertyCard = () => {
    // Clear the selected marker
    setSelectedMarker(null);
  };

  // Function to reset map view to show all properties
  const resetMapView = () => {
    if (properties.length > 0 && mapRef.current) {
      mapRef.current?.fitToCoordinates(
        properties.map(prop => prop.coordinate),
        {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        }
      );
    } else {
      // If no properties, return to default region
      mapRef.current?.animateToRegion(DEFAULT_REGION, 1000);
    }
    setSelectedMarker(null);
  };

  // Generate mock images for the property
  const getPropertyImages = (property) => {
    return [
      property.image_url,
      'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1598928636135-d146006ff4be?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=700&q=80',
    ];
  };

  // Add this useEffect to ensure markers are properly rendered after loading
  useEffect(() => {
    if (!loading && properties.length > 0) {
      // Force a re-render of markers after a short delay
      const timer = setTimeout(() => {
        // Update a property in state to trigger re-render
        setProperties(prev => [...prev]);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, properties.length]);

  // Add a helper function to get the appropriate icon based on property type
  const getPropertyIcon = (property) => {
    if (!property || !property.property_type) {
      return 'home';
    }
    
    const type = property.property_type.toLowerCase();
    switch(type) {
      case 'apartment':
        return 'building';
      case 'house':
        return 'home';
      case 'villa':
        return 'hotel';
      case 'condo':
        return 'city';
      default:
        return 'home';
    }
  };

  // Add a helper function to determine marker color based on property price
  const getMarkerColor = (price) => {
    // Premium properties (top tier)
    if (price > 10000) {
      return '#4361EE'; // Blue
    }
    // Mid-range properties
    else if (price > 5000) {
      return '#F72585'; // Pink
    } 
    // Budget-friendly properties
    else {
      return '#00C49A'; // Teal
    }
  };

  return (
    <SafeAreaProvider style={{flex: 1, width: '100%'}}>
      <View style={styles.mainContainer}>
        <StatusBar barStyle="dark-content" />
        
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.mapView}
          initialRegion={DEFAULT_REGION}
          customMapStyle={mapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onRegionChangeComplete={setRegion}
          apiKey={GOOGLE_MAPS_API_KEY}
          onPress={hidePropertyCard}
          googleMapId="YOUR_MAP_ID"
          zoomControlEnabled={false}
          mapToolbarEnabled={false}
          moveOnMarkerPress={false}
        >
          {properties.map((property) => {
            const iconName = getPropertyIcon(property);
            const markerColor = getMarkerColor(property.price);
            
            return (
              <Marker
                key={property.id}
                ref={ref => markerRefs.current[property.id] = ref}
                coordinate={property.coordinate}
                onPress={() => onMarkerPress(property)}
                title={property.name}
                description={`$${property.price}`}
              >
                <View style={styles.markerContainer}>
                  <View style={[styles.simpleMarker, { backgroundColor: '#000000' }]}>
                    <FontAwesome5 
                      name={iconName} 
                      size={16} 
                      color="#ffffff" 
                    />
                  </View>
                  <View style={[styles.priceBadge]}>
                    <Text style={styles.priceBadgeText}>${formatPrice(property.price)}</Text>
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>
        
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {isSearching ? <ActivityIndicator size="small" color="#666" style={styles.searchIcon} /> : null}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity 
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Reset map view button */}
          <TouchableOpacity 
            style={styles.resetButton}
            onPress={resetMapView}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Search predictions */}
        {searchPredictions.length > 0 && (
          <View style={styles.predictionsContainer}>
            {searchPredictions.map((prediction) => (
              <TouchableOpacity
                key={prediction.place_id}
                style={styles.predictionItem}
                onPress={() => handleSelectPlace(prediction)}
              >
                <Ionicons name="location-outline" size={18} color="#666" />
                <Text style={styles.predictionText} numberOfLines={1}>
                  {prediction.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Property info modal */}
        {selectedMarker && (
          <View style={styles.propertyCardContainer}>
            <View style={styles.propertyCard}>
              <Image 
                source={{ uri: getPropertyImages(selectedMarker)[0] }}
                style={styles.propertyImage}
                resizeMode="cover"
              />
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyName} numberOfLines={1}>{selectedMarker.name}</Text>
                <Text style={styles.propertyPrice}>${selectedMarker.price}</Text>
                
                <View style={styles.propertyLocationRow}>
                  <Ionicons name="location-outline" size={14} color="#666" />
                  <Text style={styles.propertyAddress} numberOfLines={1}>{selectedMarker.location}</Text>
                </View>
                
                <View style={styles.propertyStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="bed-outline" size={14} color="#666" />
                    <Text style={styles.statText}>{selectedMarker.beds}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="water-outline" size={14} color="#666" />
                    <Text style={styles.statText}>{selectedMarker.baths}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="floor-plan" size={14} color="#666" />
                    <Text style={styles.statText}>{selectedMarker.sqft} sqft</Text>
                  </View>
                </View>
              </View>
              
              <TouchableOpacity 
                style={styles.viewDetailButton}
                onPress={() => navigateToPropertyDetails(selectedMarker.id)}
              >
                <Text style={styles.viewDetailText}>VIEW</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={hidePropertyCard}
              >
                <Ionicons name="close" size={16} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapView: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 5,
  },
  resetButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  predictionsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 100 : 80,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    maxHeight: 200,
    zIndex: 5,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  predictionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  propertyCardContainer: {
    position: 'absolute',
    bottom: 25,
    left: 0,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    flexDirection: 'row',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  propertyImage: {
    width: 110,
    height: '100%',
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#888',
  },
  propertyLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  propertyAddress: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  propertyStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  viewDetailButton: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  viewDetailText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  priceBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  priceBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
});

// Custom map style
const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#f5f5f5"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#ffffff"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#dadada"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e5e5e5"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#eeeeee"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e9e9e9"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  }
]; 