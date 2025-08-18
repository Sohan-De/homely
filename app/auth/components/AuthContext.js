import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../config/supabase';
import { checkAndCreateFavoritesTable, checkAndCreatePropertyImagesTable } from '../../services/initDatabase';
import { setupStorageBucket } from '../../services/setupSupabase';

// Storage keys
const STORAGE_KEY = 'homely_auth_session';

// Create context
export const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

// Create provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Store session in AsyncStorage
  const persistSession = async (sessionData) => {
    try {
      if (sessionData) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error persisting auth session:', error);
    }
  };

  // Initialize database tables and storage
  const initTables = async () => {
    try {
      // Check and create favorites table if needed
      await checkAndCreateFavoritesTable();
      
      // Check and create property images table if needed
      await checkAndCreatePropertyImagesTable();
      
      // Set up storage bucket and policies
      await setupStorageBucket();
      
      // Check storage bucket permissions
      await checkStorageBucketPermissions();
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  };

  // Check and set storage bucket permissions
  const checkStorageBucketPermissions = async () => {
    try {
      if (!user) return;
      
      // Check if the property-images bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        return;
      }
      
      // Look for the property-images bucket
      const propertyImagesBucket = buckets.find(bucket => bucket.name === 'property-images');
      
      if (!propertyImagesBucket) {
        console.log('property-images bucket not found, skipping permission check');
        return;
      }
      
      // Test if we can access the bucket
      const { data: files, error: filesError } = await supabase
        .storage
        .from('property-images')
        .list();
      
      if (filesError) {
        console.log('Note: Could not list files in property-images bucket. This is normal if RLS is enabled.');
      } else {
        console.log(`Found ${files?.length || 0} files in property-images bucket`);
      }
    } catch (error) {
      console.error('Error checking storage bucket permissions:', error);
    }
  };

  // Check for session on mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        // First try to get session from AsyncStorage
        const storedSessionStr = await AsyncStorage.getItem(STORAGE_KEY);
        
        if (storedSessionStr) {
          const storedSession = JSON.parse(storedSessionStr);
          // Check if session is still valid through Supabase
          const { data: { session: currentSession }, error } = await supabase.auth.getSession();
          
          if (currentSession) {
            // Session is still valid
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            
            // Initialize database tables
            await initTables();
            
            setLoading(false);
            return;
          }
          // If we get here, the stored session is no longer valid
          await AsyncStorage.removeItem(STORAGE_KEY);
        }

        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (session) {
          await persistSession(session);
          
          // Initialize database tables
          await initTables();
        }

        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Initialize database tables when user signs in
          await initTables();
        }
        
        setLoading(false);
        
        // Update stored session
        await persistSession(session);
      }
    );

    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Sign in method
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      // Persist session on successful sign in
      if (data.session) {
        await persistSession(data.session);
      }
      
      // Navigate to main app on successful sign in
      router.replace('/(tabs)');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign up method
  const signUp = async (email, password, fullName) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        throw error;
      }
      
      // Persist session on successful sign up
      if (data.session) {
        await persistSession(data.session);
      }
      
      // Navigate to the main app on successful sign up
      router.replace('/(tabs)');
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out method
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Remove stored session on sign out
      await persistSession(null);
      
      // Navigate to welcome screen instead of auth/login
      router.replace('/');
    } catch (error) {
      Alert.alert('Sign Out Error', error.message);
    }
  };

  // Reset password method
  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'homely://reset-password',
      });

      if (error) {
        throw error;
      }
      
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Create value to be provided by the context
  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  // Return provider
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Default export for the AuthProvider component
export default AuthProvider; 