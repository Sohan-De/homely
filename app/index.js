import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Bottom sheet for login
const LoginBottomSheet = ({ isVisible, onClose }) => {
  const translateY = useSharedValue(height);
  const opacity = useSharedValue(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (isVisible) {
      console.log('Opening bottom sheet');
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { 
        duration: 500,
        easing: Easing.out(Easing.cubic)
      });
    } else {
      console.log('Closing bottom sheet');
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(height, { 
        duration: 400,
        easing: Easing.in(Easing.cubic)
      });
    }
  }, [isVisible]);

  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const sheetStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const handleLogin = () => {
    onClose();
    // Navigate to the main app
    setTimeout(() => {
      router.push('/(tabs)');
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.bottomSheetContainer]}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View 
        style={[StyleSheet.absoluteFillObject, styles.bottomSheetOverlay, overlayStyle]}
        onTouchEnd={onClose}
      />
      
      <Animated.View 
        style={[styles.bottomSheet, sheetStyle, { paddingBottom: insets.bottom + 20 }]}
      >
        <View style={styles.bottomSheetHandle} />
        
        <View style={styles.loginHeader}>
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>Log in to continue your housing journey</Text>
        </View>
        
        <Animated.View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput 
              placeholder="Email" 
              style={styles.input}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.inputContainer, { marginTop: 16 }]}>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color="#888" style={styles.inputIcon} />
            <TextInput 
              placeholder="Password" 
              style={styles.input}
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>
        </Animated.View>
        
        <TouchableOpacity style={styles.forgotPasswordBtn}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
        
        <View style={styles.orContainer}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.orLine} />
        </View>
        
        <View style={styles.socialButtonsContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color="#EA4335" />
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={20} color="#000" />
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don&apos;t have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const TextInput = ({ style, ...props }) => {
  return (
    <Animated.TextInput
      style={style}
      {...props}
    />
  );
};

// Decorative shapes for modern design
const DecorativeShape = ({ style }) => {
  return <View style={[styles.decorShape, style]} />;
};

export default function WelcomeScreen() {
  const [showLogin, setShowLogin] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Animation values
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(20);
  const shape1Opacity = useSharedValue(0);
  const shape2Opacity = useSharedValue(0);
  const shape3Opacity = useSharedValue(0);
  const imageOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.9);
  const logoOpacity = useSharedValue(0);
  
  // Start animations when component mounts
  useEffect(() => {
    // Shapes animation
    shape1Opacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    shape2Opacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    shape3Opacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    
    // Content animations
    imageOpacity.value = withDelay(500, withTiming(1, { duration: 1000 }));
    imageScale.value = withDelay(500, withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    titleOpacity.value = withDelay(700, withTiming(1, { duration: 800 }));
    subtitleOpacity.value = withDelay(900, withTiming(1, { duration: 800 }));
    buttonOpacity.value = withDelay(1100, withTiming(1, { duration: 800 }));
    buttonTranslateY.value = withDelay(1100, withTiming(0, { duration: 800 }));
    
    // Logo animation
    logoOpacity.value = withDelay(1300, withTiming(1, { duration: 800 }));
  }, []);
  
  // Animated styles
  const titleStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            titleOpacity.value,
            [0, 1],
            [20, 0],
            Extrapolate.CLAMP
          )
        }
      ]
    };
  });
  
  const subtitleStyle = useAnimatedStyle(() => {
    return {
      opacity: subtitleOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            subtitleOpacity.value,
            [0, 1],
            [20, 0],
            Extrapolate.CLAMP
          )
        }
      ]
    };
  });
  
  const buttonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }]
    };
  });
  
  const shape1Style = useAnimatedStyle(() => {
    return { opacity: shape1Opacity.value };
  });
  
  const shape2Style = useAnimatedStyle(() => {
    return { opacity: shape2Opacity.value };
  });
  
  const shape3Style = useAnimatedStyle(() => {
    return { opacity: shape3Opacity.value };
  });
  
  const imageStyle = useAnimatedStyle(() => {
    return {
      opacity: imageOpacity.value,
      transform: [{ scale: imageScale.value }],
    };
  });
  
  const logoStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
    };
  });
  
  // Add debug log to see if the button click is registered
  const handleGetStarted = () => {
    console.log('Get Started clicked, redirecting to login page');
    // Navigate to the login page
    router.push('/auth/login');
  };
  
  // Log when showLogin state changes
  useEffect(() => {
    console.log('showLogin state changed:', showLogin);
  }, [showLogin]);
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Decorative shapes */}
      <Animated.View style={[styles.shape1, shape1Style]} />
      <Animated.View style={[styles.shape2, shape2Style]} />
      <Animated.View style={[styles.shape3, shape3Style]} />
      
      {/* Content */}
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={28} color="#000" />
            <Text style={styles.logoText}>Homely</Text>
          </View>
        </View>
        
        <View style={styles.mainContent}>
          {/* Hero Image */}
          <Animated.View style={[styles.imageContainer, imageStyle]}>
            <Image 
              source={{ uri: 'https://img.freepik.com/free-vector/tiny-people-examining-house-with-magnifier-flat-vector-illustration-cartoon-characters-analyzing-housing-property-before-buying-mortgage-real-estate-property-measurement-concept_74855-10176.jpg' }}
              style={styles.heroImage}
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Text content */}
          <Animated.Text style={[styles.title, titleStyle]}>
            Find Your Perfect Home
          </Animated.Text>
          
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Discover thousands of properties and find your dream place with just a few taps
          </Animated.Text>
          
          {/* Button */}
          <Animated.View style={[styles.buttonContainer, buttonStyle]}>
            <TouchableOpacity 
              style={styles.button}
              onPress={handleGetStarted}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            
            <View style={styles.featuresRow}>
              <View style={styles.featureBadge}>
                              <Ionicons name="search" size={12} color="#000" />
              <Text style={styles.featureBadgeText}>Search</Text>
            </View>
            <View style={styles.featureBadge}>
              <Ionicons name="heart" size={12} color="#000" />
              <Text style={styles.featureBadgeText}>Save</Text>
            </View>
            <View style={styles.featureBadge}>
              <Ionicons name="flag" size={12} color="#000" />
              <Text style={styles.featureBadgeText}>Visit</Text>
              </View>
            </View>
          </Animated.View>
        </View>
        
        {/* Small logo at bottom */}
        <Animated.View style={[styles.footerLogo, logoStyle]}>
          <View style={styles.footerLogoInner}>
            <Ionicons name="home" size={18} color="#000" />
            <Text style={styles.footerLogoText}>Homely</Text>
          </View>
          <Text style={styles.footerTagline}>Find your dream home today</Text>
        </Animated.View>
      </View>
      
      {/* Login Bottom Sheet */}
      <LoginBottomSheet 
        isVisible={showLogin} 
        onClose={() => setShowLogin(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  // Decorative shapes
  shape1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(76, 77, 220, 0.08)',
    top: -50,
    right: -50,
  },
  shape2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(76, 77, 220, 0.05)',
    bottom: 100,
    left: -75,
  },
  shape3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 77, 220, 0.07)',
    top: 200,
    right: -20,
  },
  decorShape: {
    position: 'absolute',
    borderRadius: 8,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#333',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: height * 0.3,
    marginBottom: 30,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    color: '#333',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 16,
    width: '90%',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 77, 220, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  featureBadgeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Footer logo
  footerLogo: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerLogoInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLogoText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 4,
    color: '#000',
  },
  footerTagline: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Bottom sheet styles
  bottomSheetContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  bottomSheetOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 30,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 20,
  },
  loginHeader: {
    marginBottom: 30,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    padding: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  forgotPasswordBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4C4DDC',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#4C4DDC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  orText: {
    color: '#999',
    fontSize: 14,
    marginHorizontal: 10,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 15,
    color: '#666',
  },
  signupLink: {
    fontSize: 15,
    color: '#4C4DDC',
    fontWeight: '600',
  },
}); 