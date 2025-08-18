import { router } from 'expo-router';
import { supabase } from '../config/supabase';

// Fetch all property categories
export async function fetchPropertyCategories() {
  try {
    // First, get the categories
    const { data: categories, error: categoriesError } = await supabase
      .from('property_categories')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (categoriesError) {
      console.error('Error fetching property categories:', categoriesError);
      throw categoriesError;
    }

    if (!categories || categories.length === 0) {
      return [];
    }
    
    // Then get property counts and sample images for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        // Get count of properties in this category
        const { count, error: countError } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);
        
        if (countError) {
          console.error(`Error counting properties for category ${category.id}:`, countError);
          return { ...category, property_count: 0 };
        }
        
        // Get one sample property with an image from this category
        const { data: sampleProperty, error: sampleError } = await supabase
          .from('properties')
          .select('image_url')
          .eq('category_id', category.id)
          .limit(1)
          .single();
        
        // Use the sample property's image if available
        const image_url = sampleProperty?.image_url || category.image_url;
        
        return { 
          ...category, 
          property_count: count || 0,
          image_url
        };
      })
    );
    
    return categoriesWithCounts || [];
  } catch (error) {
    console.error('Error in fetchPropertyCategories:', error);
    return [];
  }
}

// Fetch properties by type
export async function fetchPropertiesByType(propertyType, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('property_type', propertyType)
      .limit(limit);
    
    if (error) {
      console.error(`Error fetching ${propertyType} properties:`, error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error in fetchPropertiesByType for ${propertyType}:`, error);
    return [];
  }
}

// Fetch properties by category
export async function fetchPropertiesByCategory(categoryId, limit = 10) {
  try {
    let query = supabase.from('properties').select('*');
    
    // Only apply category filter if categoryId is provided and not null
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
      
    if (error) {
      console.error('Error fetching properties by category:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchPropertiesByCategory:', error);
    return [];
  }
}

// Fetch featured properties
export async function fetchFeaturedProperties(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('is_featured', true)
      .limit(limit);
    
    if (error) {
      console.error('Error fetching featured properties:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchFeaturedProperties:', error);
    return [];
  }
}

// Toggle property favorite status
export async function togglePropertyFavorite(propertyId, userId) {
  try {
    // Check if property is already favorited
    const { data: existingFavorite, error: checkError } = await supabase
      .from('property_favorites')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking favorite status:', checkError);
      throw checkError;
    }
    
    if (existingFavorite) {
      // Remove from favorites
      const { error: deleteError } = await supabase
        .from('property_favorites')
        .delete()
        .eq('property_id', propertyId)
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('Error removing favorite:', deleteError);
        throw deleteError;
      }
      
      return { isFavorite: false };
    } else {
      // Add to favorites
      const { error: insertError } = await supabase
        .from('property_favorites')
        .insert({ property_id: propertyId, user_id: userId });
      
      if (insertError) {
        console.error('Error adding favorite:', insertError);
        throw insertError;
      }
      
      return { isFavorite: true };
    }
  } catch (error) {
    console.error('Error in togglePropertyFavorite:', error);
    throw error;
  }
}

// Navigate to property details
export function navigateToPropertyDetails(propertyId) {
  router.push(`/property/${propertyId}`);
}

// Fetch user's favorite properties
export async function fetchUserFavorites(userId) {
  try {
    // First, get the property IDs from favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('property_favorites')
      .select('property_id')
      .eq('user_id', userId);
    
    if (favoritesError) {
      console.error('Error fetching user favorites:', favoritesError);
      throw favoritesError;
    }
    
    if (!favorites || favorites.length === 0) {
      return [];
    }

    // Extract property IDs
    const propertyIds = favorites.map(fav => fav.property_id);
    
    // Then fetch the actual property data
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*')
      .in('id', propertyIds);
    
    if (propertiesError) {
      console.error('Error fetching favorite properties:', propertiesError);
      throw propertiesError;
    }
    
    return properties || [];
  } catch (error) {
    console.error('Error in fetchUserFavorites:', error);
    return [];
  }
}

// Search properties by query
export async function searchProperties(query, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
      .limit(limit);
    
    if (error) {
      console.error('Error searching properties:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in searchProperties:', error);
    return [];
  }
}

// Filter properties by criteria
export async function filterProperties(filters = {}) {
  try {
    let query = supabase
      .from('properties')
      .select('*');
    
    // Apply filters only if they are defined and not null
    if (filters.minPrice && filters.minPrice !== null) {
      query = query.gte('price', filters.minPrice);
    }
    
    if (filters.maxPrice && filters.maxPrice !== null) {
      query = query.lte('price', filters.maxPrice);
    }
    
    if (filters.beds && filters.beds !== null) {
      query = query.eq('beds', filters.beds);
    }
    
    if (filters.baths && filters.baths !== null) {
      query = query.eq('baths', filters.baths);
    }
    
    if (filters.propertyType && filters.propertyType !== null && filters.propertyType !== '') {
      query = query.eq('property_type', filters.propertyType);
    }
    
    if (filters.categoryId && filters.categoryId !== null && filters.categoryId !== '') {
      query = query.eq('category_id', filters.categoryId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error filtering properties:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in filterProperties:', error);
    return [];
  }
}

// Default export with all property-related services
const propertyService = {
  fetchPropertyCategories,
  fetchPropertiesByType,
  fetchPropertiesByCategory,
  fetchFeaturedProperties,
  togglePropertyFavorite,
  navigateToPropertyDetails,
  fetchUserFavorites,
  searchProperties,
  filterProperties
};

export default propertyService; 