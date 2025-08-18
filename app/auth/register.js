import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  withSequence,
  interpolate,
  Extrapolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './components/AuthContext';

const { width, height } = Dimensions.get('window');

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
      y: randomValue(-100, height + 100),
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

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Animation values
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);

  // Animated styles
  const formStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        formOpacity.value,
        [0, 1],
        [0, 1],
        Extrapolate.CLAMP
      ),
      transform: [{ translateY: interpolate(
        formOpacity.value,
        [0, 1],
        [50, 0],
        Extrapolate.CLAMP
      ) }],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Start animations when component mounts
  React.useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 800 });
    buttonScale.value = withSpring(1);
  }, []);

  const validateInputs = () => {
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return false;
    }

    if (!email.trim()) {
      setErrorMsg('Please enter your email address');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setErrorMsg('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateInputs()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      // Sign up with Supabase through the auth context
      const { data, error } = await signUp(email, password, name);

      if (error) {
        console.error('Registration error:', error.message);
        setErrorMsg(error.message);
        return;
      }
      
      console.log('Registration successful:', data);
      
      if (data.session) {
        // User is signed in, navigate to main app
        router.replace('/(tabs)');
      } else {
        // Email confirmation required
        Alert.alert(
          'Registration Successful',
          'Please check your email to confirm your account.',
          [
            {
              text: 'OK',
              onPress: () => router.push('/auth/login')
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Unexpected error:', error.message);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <BackgroundAnimation />
      
      {/* Back button to return to welcome screen */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      
      {/* Top logo like welcome page */}
      <View style={styles.header}>
        <View style={styles.topLogoContainer}>
          <Ionicons name="home" size={28} color="#000" />
          <Text style={styles.topLogoText}>Homely</Text>
        </View>
      </View>
      
      <View style={styles.contentWrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainContainer}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>Join Homely to find your perfect home</Text>
            </View>

            {/* Form */}
            <Animated.View style={[styles.formContainer, formStyle]}>
              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
              
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#9E9E9E"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setErrorMsg('');
                  }}
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#9E9E9E"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrorMsg('');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9E9E9E"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrorMsg('');
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9E9E9E"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#9E9E9E"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrorMsg('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color="#9E9E9E"
                  />
                </TouchableOpacity>
              </View>

              <Animated.View style={buttonStyle}>
                <TouchableOpacity 
                  style={[styles.registerButton, isLoading && styles.registerButtonDisabled]} 
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  By signing up, you agree to our {' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and {' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>Already have an account? </Text>
                <TouchableOpacity onPress={navigateToLogin} disabled={isLoading}>
                  <Text style={styles.loginLink}>Log In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  mainContainer: {
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 15,
    marginHorizontal: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    marginBottom: 10,
  },
  topLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topLogoText: {
    color: '#333',
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  formContainer: {
    marginTop: 10,
  },
  errorText: {
    color: '#FF6B6B',
    marginBottom: 15,
    fontSize: 14,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  registerButtonDisabled: {
    backgroundColor: '#666666',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 25,
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: '#000',
    fontWeight: '500',
  },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  loginPromptText: {
    fontSize: 15,
    color: '#9E9E9E',
  },
  loginLink: {
    fontSize: 15,
    color: '#000',
    fontWeight: '600',
  },
}); 