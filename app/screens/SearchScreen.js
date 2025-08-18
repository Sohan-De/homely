import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Keyboard,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { searchProperties, navigateToPropertyDetails, filterProperties } from '../services/propertyService';
import FilterScreen from './FilterScreen';

const SearchScreen = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Perform search when query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      const results = await searchProperties(query);
      setSearchResults(results);
      
      // Save to recent searches if we have results
      if (results.length > 0 && !recentSearches.includes(query)) {
        const updatedRecent = [query, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedRecent);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
  };

  const handlePropertyPress = (propertyId) => {
    navigateToPropertyDetails(propertyId);
    onClose();
  };

  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    performSearch(query);
  };
  
  // Handle filter application
  const handleApplyFilters = async (filters) => {
    setLoading(true);
    
    try {
      const results = await filterProperties(filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Error applying filters:', error);
      Alert.alert('Error', 'Could not apply filters. Please try again.');
    } finally {
      setLoading(false);
      setFilterModalVisible(false);
    }
  };

  const renderPropertyItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.propertyItem}
      onPress={() => handlePropertyPress(item.id)}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.propertyImage} 
        resizeMode="cover"
      />
      <View style={styles.propertyInfo}>
        <Text style={styles.propertyName}>{item.name}</Text>
        <Text style={styles.propertyLocation}>{item.location}</Text>
        <Text style={styles.propertyPrice}>${item.price}/month</Text>
        <View style={styles.propertyFeatures}>
          <Text style={styles.featureText}>{item.beds} bed</Text>
          <Text style={styles.featureText}>{item.baths} bath</Text>
          <Text style={styles.featureText}>{item.sqft} sqft</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearchItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.recentSearchItem}
      onPress={() => handleRecentSearchPress(item)}
    >
      <Ionicons name="time-outline" size={18} color="#666" />
      <Text style={styles.recentSearchText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent={false}
      onRequestClose={onClose}
      style={styles.modal}
    >
      <SafeAreaView style={[styles.container, {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}]}>
        <StatusBar barStyle="dark-content" />
        
        {/* Search Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={onClose}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
            paddingHorizontal: 12,
            height: 44,
          }}>
            <Ionicons name="search-outline" size={20} color="#666" />
            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                marginLeft: 4,
                height: '100%',
                color: '#333',
                borderWidth: 0,
              }}
              placeholder="Search properties by name, location"
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              underlineColorAndroid="transparent"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={handleClearSearch}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setFilterModalVisible(true)}>
                <Ionicons name="options-outline" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Loading Indicator */}
        {loading && (
          <ActivityIndicator style={styles.loader} size="large" color="#000" />
        )}
        
        {/* Search Results */}
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderPropertyItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.resultsList}
          />
        ) : (
          // Recent Searches or No Results
          <View style={styles.emptyContainer}>
            {searchQuery.length > 2 && !loading ? (
              <Text style={styles.noResultsText}>No properties found</Text>
            ) : recentSearches.length > 0 ? (
              <>
                <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                <FlatList
                  data={recentSearches}
                  renderItem={renderRecentSearchItem}
                  keyExtractor={(item, index) => `recent-${index}`}
                />
              </>
            ) : (
              <Text style={styles.startSearchText}>
                Start typing to search for properties
              </Text>
            )}
          </View>
        )}
      </SafeAreaView>
      
      {/* Filter Modal */}
      <FilterScreen 
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyFilters}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    zIndex: 1000,
    elevation: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    opacity: 1,
    zIndex: 100,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    textDecorationLine: 'none',
    textDecoration: 'none',
    textDecorationColor: 'transparent',
    padding: 0,
    color: '#333',
  },
  loader: {
    marginTop: 20,
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  propertyItem: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    width: 120,
    height: 120,
  },
  propertyInfo: {
    flex: 1,
    padding: 12,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  propertyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  propertyFeatures: {
    flexDirection: 'row',
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  emptyContainer: {
    flex: 1,
    padding: 16,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  startSearchText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentSearchText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});

export default SearchScreen; 