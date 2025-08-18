import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useAuth } from '../auth/components/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');

// Function to generate random value between min and max
const randomValue = (min, max) => Math.random() * (max - min) + min;

const BackgroundShape = ({ delay, size, color, initialPosition }) => {
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // X-axis animation
    translateX.value = withRepeat(
      withSequence(
        withDelay(
          delay,
          withTiming(initialPosition.x + randomValue(-50, 50), {
            duration: 10000 + randomValue(0, 5000),
            easing: Easing.inOut(Easing.ease),
          })
        ),
        withTiming(initialPosition.x, {
          duration: 10000 + randomValue(0, 5000),
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    // Y-axis animation
    translateY.value = withRepeat(
      withSequence(
        withDelay(
          delay + 500,
          withTiming(initialPosition.y + randomValue(-50, 50), {
            duration: 10000 + randomValue(0, 5000),
            easing: Easing.inOut(Easing.ease),
          })
        ),
        withTiming(initialPosition.y, {
          duration: 10000 + randomValue(0, 5000),
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 20000 + randomValue(0, 10000),
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Scale animation
    scale.value = withRepeat(
      withSequence(
        withDelay(
          delay + 1000,
          withTiming(randomValue(0.8, 1.2), {
            duration: 5000 + randomValue(0, 2000),
            easing: Easing.inOut(Easing.ease),
          })
        ),
        withTiming(1, {
          duration: 5000 + randomValue(0, 2000),
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
        { scale: scale.value }
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.1,
        },
        animatedStyle,
      ]}
    />
  );
};

const BackgroundAnimation = () => {
  const shapes = Array(8).fill().map((_, index) => ({
    id: index,
    delay: index * 500,
    size: randomValue(100, 250),
    color: index % 2 === 0 ? '#000000' : '#333333',
    initialPosition: {
      x: randomValue(-50, width),
      y: randomValue(-100, width + 100),
    },
  }));

  return (
    <View style={styles.backgroundContainer}>
      {shapes.map((shape) => (
        <BackgroundShape
          key={shape.id}
          delay={shape.delay}
          size={shape.size}
          color={shape.color}
          initialPosition={shape.initialPosition}
        />
      ))}
    </View>
  );
};

export default function AdminScreen() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalUsers: 0,
    featuredProperties: 0,
    totalCategories: 0,
    favorites: 0
  });

  // Animation values
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(50);
  const statsScale = useSharedValue(0.8);

  // Check if user is admin
  useEffect(() => {
    checkAdminStatus();
    loadDashboardData();

    // Start animations
    contentOpacity.value = withTiming(1, { duration: 800 });
    contentTranslateY.value = withTiming(0, { duration: 800 });
    statsScale.value = withDelay(300, withSpring(1));
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      // In a real app, you would check if user has admin role
      // For now, we'll assume the current logged in user is an admin
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch statistics for properties, featured items, categories
      const [
        propertiesData,
        featuredData,
        categoriesData,
        favoritesData
      ] = await Promise.all([
        supabase.from('properties').select('*', { count: 'exact', head: true }),
        supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('property_categories').select('*', { count: 'exact', head: true }),
        supabase.from('property_favorites').select('*', { count: 'exact', head: true })
      ]);

      // Fetch user count using the RPC function
      const { data: userData, error: userError } = await supabase.rpc('get_user_count');
      
      if (userError) {
        console.error('Error fetching user count:', userError);
      }

      setStats({
        totalProperties: propertiesData.count || 0,
        totalUsers: userData?.[0]?.count || 3, // Default to 3 if function fails
        featuredProperties: featuredData.count || 0,
        totalCategories: categoriesData.count || 0,
        favorites: favoritesData.count || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Animated styles
  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [{ translateY: contentTranslateY.value }],
    };
  });

  const statsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: statsScale.value }],
    };
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>You don&apos;t have permission to access this page.</Text>
      </View>
    );
  }

  // Render stats card
  const StatCard = ({ icon, title, value }) => (
    <Animated.View style={[styles.statCard, statsAnimatedStyle]}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#000" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Animated.View>
  );

  // Render action button
  const ActionButton = ({ icon, title, onPress }) => {
    const scale = useSharedValue(1);
    
    const handlePressIn = () => {
      scale.value = withTiming(0.95, { duration: 150 });
    };
    
    const handlePressOut = () => {
      scale.value = withTiming(1, { duration: 150 });
    };
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });
    
      // Generate a gradient based on the icon - white theme
  const getGradientColors = () => {
    switch (icon) {
      case 'business':
        return ['#FFFFFF', '#E0E0E0']; // Pure white to light gray
      case 'grid':
        return ['#F8F8F8', '#E8E8E8']; // Off-white to light gray
      case 'people':
        return ['#F5F5F5', '#DDDDDD']; // White smoke to lighter gray
      case 'bar-chart':
        return ['#FAFAFA', '#EEEEEE']; // Snow white to very light gray
      default:
        return ['#FFFFFF', '#F0F0F0']; // Default white to gray
    }
  };

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={[styles.actionButtonWrapper, animatedStyle]}>
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionButton}
          >
            <View style={styles.actionIconContainer}>
                             <Ionicons name={icon} size={24} color="black" />
              </View>
             <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{title}</Text>
               <Text style={styles.actionSubtitle}>Tap to manage</Text>
             </View>
             <View style={styles.actionArrow}>
               <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.7)" />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <BackgroundAnimation />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDashboardData}>
          <Ionicons name="refresh" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View style={[styles.contentContainer, contentStyle]}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.user_metadata?.full_name || 'Admin'}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.statsContainer}>
            <StatCard 
              icon="business" 
              title="Properties" 
              value={stats.totalProperties} 
            />
            <StatCard 
              icon="people" 
              title="Users" 
              value={stats.totalUsers} 
            />
          </View>
          
          <View style={styles.statsContainer}>
            <StatCard 
              icon="star" 
              title="Featured" 
              value={stats.featuredProperties} 
            />
            <StatCard 
              icon="grid" 
              title="Categories" 
              value={stats.totalCategories} 
            />
          </View>

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActionsWrapper}>
            <ActionButton 
              icon="business" 
              title="Add/Edit Property" 
              onPress={() => router.push('/admin/property-management')}
            />
            <ActionButton 
              icon="grid" 
              title="Add/Edit Categories" 
              onPress={() => router.push('/admin/category-management')}
            />
          </View>
          
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const { width: screenWidth, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 15,
    margin: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',  // Just under 50% to allow for spacing
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#000',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  statContent: {
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  quickActionsWrapper: {
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  actionButtonWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
         backgroundColor: 'rgba(0, 0, 0, 0.08)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
   },
   actionTextContainer: {
     flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: 'black',
      marginBottom: 2,
   },
   actionSubtitle: {
     fontSize: 12,
     color: 'rgba(0, 0, 0, 0.6)',
  },
  actionArrow: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#000',
    textAlign: 'center',
    padding: 20,
  }
}); 