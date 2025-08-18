import { Stack, Redirect } from 'expo-router';
import { useAuth } from './components/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function AuthLayout() {
  const { session, loading } = useAuth();
  
  // Redirect to tabs if user is already authenticated
  if (session && !loading) {
    return <Redirect href="/(tabs)" />;
  }
  
  // Show loading indicator while checking auth state
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4C4DDC" />
      </View>
    );
  }
  
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
} 