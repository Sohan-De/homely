import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  RefreshControl, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useAuth } from '../auth/components/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { fetchUserFavorites, navigateToPropertyDetails, togglePropertyFavorite } from '../services/propertyService';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userFavorites = await fetchUserFavorites(user.id);
      setFavorites(userFavorites.map(item => ({...item, favorite: true})));
    } catch (error) {
      console.error('Error loading favorites:', error);
      Alert.alert('Error', 'Failed to load your favorite properties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleToggleFavorite = async (propertyId) => {
    if (!user?.id) return;

    try {
      await togglePropertyFavorite(propertyId, user.id);
      // Remove the property from the list
      setFavorites(favorites.filter(property => property.id !== propertyId));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.propertyCard}
      onPress={() => navigateToPropertyDetails(item.id)}
      activeOpacity={0.9}
    >
      <Image 
        source={{ uri: item.image_url }} 
        style={styles.propertyImage}
        resizeMode="cover"
      />
      
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={() => handleToggleFavorite(item.id)}
      >
        <Ionicons name="heart" size={22} color="#000" />
      </TouchableOpacity>
      
      <View style={styles.priceTag}>
        <Text style={styles.priceText}>${item.price.toLocaleString()}</Text>
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: 'Favorites',
        }}
      />
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading your favorites...</Text>
        </View>
      ) : (
        <>
          {favorites.length > 0 ? (
            <FlatList
              data={favorites}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#000']}
                  tintColor="#000"
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={80} color="#ddd" />
              <Text style={styles.emptyTitle}>No Favorites Yet</Text>
              <Text style={styles.emptySubtitle}>
                Properties you favorite will appear here
              </Text>
              <TouchableOpacity 
                style={[styles.browseButton, { backgroundColor: '#000' }]}
                onPress={() => router.push('/')}
              >
                <Text style={styles.browseButtonText}>Browse Properties</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  propertyCard: {
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  priceTag: {
    position: 'absolute',
    bottom: 120,
    left: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
  },
  priceText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  propertyInfo: {
    padding: 15,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  propertyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 