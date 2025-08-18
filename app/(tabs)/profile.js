import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useAuth } from '../auth/components/AuthContext';
import { fetchUserFavorites } from '../services/propertyService';

// Custom Sign-out Modal Component
const SignOutModal = ({ visible, onClose, onSignOut }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="log-out-outline" size={50} color="#000" />
                <Text style={styles.modalTitle}>Sign Out</Text>
              </View>
              <Text style={styles.modalDescription}>
                Are you sure you want to sign out from your account?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]} 
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.signOutModalButton]} 
                  onPress={onSignOut}
                >
                  <Text style={styles.signOutModalText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const SettingItem = ({ icon, title, subtitle, onPress, value, type = 'arrow' }) => {
  return (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color="#000" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingAction}>
        {type === 'switch' ? (
          <Switch 
            value={value} 
            onValueChange={onPress} 
            trackColor={{ false: '#e4e4e4', true: '#cccccc' }}
            thumbColor={value ? '#000' : '#f4f3f4'}
          />
        ) : type === 'arrow' ? (
          <Ionicons name="chevron-forward" size={20} color="#999" />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [signOutModalVisible, setSignOutModalVisible] = useState(false);
  
  // Animation values
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    // Fade in animation
    Animated.timing(opacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Load user data
    const loadUserData = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          // Load favorites count
          const favorites = await fetchUserFavorites(user.id);
          setFavoritesCount(favorites.length);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const handleSignOut = () => {
    setSignOutModalVisible(true);
  };
  
  const handleConfirmSignOut = async () => {
    setSignOutModalVisible(false);
    // Add a small delay to allow the modal to close smoothly
    setTimeout(() => {
      signOut();
    }, 300);
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen (to be implemented)
    Alert.alert('Coming Soon', 'Edit profile functionality will be available soon!');
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Implement dark mode toggle logic here
  };

  const handleToggleNotifications = () => {
    setNotifications(!notifications);
    // Implement notifications toggle logic here
  };

  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        setLoading(true);
        try {
          if (user?.id) {
            // Load favorites count
            const favorites = await fetchUserFavorites(user.id);
            setFavoritesCount(favorites.length);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadUserData();
    }, [user])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'My Profile',
          headerTitleStyle: {
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: '#f8f8f8',
          },
        }}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.profileSection, { opacity }]}>
          <View style={styles.coverImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80' }}
              style={styles.coverImage}
            />
            <BlurView intensity={60} style={styles.blurOverlay} tint="dark" />
          </View>
          
          <View style={styles.profileHeader}>
            <Image 
              source={{ 
                uri: user?.user_metadata?.avatar_url || 
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.user_metadata?.full_name || user?.email || 'User') + '&background=000000&color=fff&size=256'
              }} 
              style={styles.profileImage}
            />
            
            <Text style={styles.userName}>
              {user?.user_metadata?.full_name || 'User'}
            </Text>
            
            <Text style={styles.userEmail}>
              {user?.email}
            </Text>
            
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{favoritesCount}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </View>
          
          <View style={[styles.statItem, styles.statDivider]}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Tours</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <SettingItem 
            icon="person-outline" 
            title="Account Information" 
            subtitle="Update your account details" 
            onPress={handleEditProfile} 
          />
          
          <SettingItem 
            icon="heart-outline" 
            title="My Favorites" 
            subtitle="View all your favorite properties" 
            onPress={() => router.push('/explore')}
          />
          
          <SettingItem 
            icon="notifications-outline" 
            title="Notifications" 
            subtitle="Manage notification preferences" 
            type="switch"
            value={notifications}
            onPress={handleToggleNotifications}
          />
          
          <SettingItem 
            icon="moon-outline" 
            title="Dark Mode" 
            subtitle="Switch to dark theme" 
            type="switch"
            value={darkMode}
            onPress={handleToggleDarkMode}
          />
          
          <SettingItem 
            icon="shield-checkmark-outline" 
            title="Privacy & Security" 
            subtitle="Manage your privacy settings" 
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
          />
          
          <SettingItem 
            icon="help-circle-outline" 
            title="Help & Support" 
            subtitle="FAQ and customer support" 
            onPress={() => Alert.alert('Coming Soon', 'Support center will be available soon!')}
          />
          
          <TouchableOpacity 
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color="#000" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerSection}>
          <Text style={styles.footerText}>Homely</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      <SignOutModal
        visible={signOutModalVisible}
        onClose={() => setSignOutModalVisible(false)}
        onSignOut={handleConfirmSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    position: 'relative',
    marginBottom: 20,
  },
  coverImageContainer: {
    position: 'relative',
    height: 180,
  },
  coverImage: {
    width: '100%',
    height: 180,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: -50,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  editProfileText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  statsSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
  },
  settingsSection: {
    marginHorizontal: 20,
    marginTop: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginLeft: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  settingAction: {
    marginLeft: 10,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  signOutText: {
    color: '#000',
    fontWeight: '500',
    marginLeft: 8,
  },
  footerSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  signOutModalButton: {
    backgroundColor: '#000',
  },
  signOutModalText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 