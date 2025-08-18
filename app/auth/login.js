import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StatusBar,
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

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Animation values
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);
  
  // Animated styles
  const formStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            formOpacity.value,
            [0, 1],
            [50, 0],
            Extrapolate.CLAMP
          )
        }
      ],
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
  
  // Navigation back to welcome screen
  const navigateBack = () => {
    router.back();
  };
  
  const handleLogin = async () => {
    // Input validation
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      // Use the signIn method from the auth context
      const { data, error } = await signIn(email, password);

      if (error) {
        console.error('Login error:', error.message);
        setErrorMsg(error.message);
        return;
      }
      
      console.log('Login successful:', data);
      // Navigate to tabs is now handled in AuthContext
      
    } catch (error) {
      console.error('Unexpected error:', error.message);
      setErrorMsg('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleForgotPassword = async () => {
    if (!email) {
      setErrorMsg('Please enter your email address to reset password');
      return;
    }
    
    try {
      setIsLoading(true);
      const { error } = await resetPassword(email);
      
      if (error) {
        setErrorMsg(error.message);
        return;
      }
      
      Alert.alert(
        'Password Reset Email Sent',
        'Check your email for a link to reset your password.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const navigateToRegister = () => {
    router.push('/auth/register');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <BackgroundAnimation />
      
      {/* Back button to return to welcome screen */}
      <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
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
        <View style={styles.mainContainer}>
          {/* Logo & Header */}
          <View style={styles.logoContainer}>
            <Ionicons name="home" size={40} color="#000" />
            <Text style={styles.appName}>HOMELY</Text>
            <Text style={styles.tagline}>Find your dream home</Text>
          </View>
          
          {/* Form */}
          <Animated.View style={[styles.formContainer, formStyle]}>
            <Text style={styles.welcomeText}>Welcome Back</Text>
            <Text style={styles.loginText}>Log in to your account</Text>
            
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={text => {
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
                onChangeText={text => {
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
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <Animated.View style={buttonStyle}>
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Log In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
            
            <View style={styles.separator}>
              <Text style={styles.separatorText}>OR</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={navigateToRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>Create an Account</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
    marginBottom: 5,
  },
  tagline: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 5,
  },
  formContainer: {
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  loginText: {
    fontSize: 16,
    color: '#9E9E9E',
    marginBottom: 30,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 5,
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#000',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#666666',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  separatorText: {
    color: '#9E9E9E',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  registerButton: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
}); 