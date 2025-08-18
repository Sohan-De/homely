import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../auth/components/AuthContext';

export default function TabsLayout() {
  const { session, loading, user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user has admin role
  useEffect(() => {
    if (user) {
      // In a real app, you would check a specific claim or field
      // For demo purposes, we'll just set all authenticated users as admins
      setIsAdmin(true);
    }
  }, [user]);
  
  // Redirect to auth if user is not authenticated
  if (!session && !loading) {
    return <Redirect href="/auth/login" />;
  }
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color }) => (
            <Ionicons name="business-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map" 
        options={{
          title: 'Map',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
          href: isAdmin ? undefined : null, // This will hide the tab if not admin
        }}
      />
    </Tabs>
  );
} 