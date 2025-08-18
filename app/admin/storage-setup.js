import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Linking,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { enableImageUploads, testBucketPermissions } from '../services/enableImageUploads';
import { areRealUploadsEnabled, setRealUploadsEnabled } from '../services/propertyImageService';

export default function StorageSetupScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testMessage, setTestMessage] = useState('');
  const [uploadsEnabled, setUploadsEnabled] = useState(false);
  
  const runBucketTest = async () => {
    try {
      setIsLoading(true);
      setTestMessage('Testing bucket permissions...');
      
      const result = await testBucketPermissions();
      setTestResult(result);
      
      if (result) {
        setTestMessage('Bucket permissions test passed! You can enable image uploads.');
      } else {
        setTestMessage('Bucket permissions test failed. Please run the SQL setup script first.');
      }
    } catch (error) {
      console.error('Error testing bucket permissions:', error);
      setTestResult(false);
      setTestMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const enableUploads = async () => {
    const result = await enableImageUploads();
    if (result.success) {
      // Store the setting in AsyncStorage
      await setRealUploadsEnabled(true);
      setUploadsEnabled(true);
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };
  
  const copySetupInstructions = () => {
    const instructions = `
1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the "SQL Editor" section
4. Create a new query
5. Copy and paste the SQL commands from one of the following files:
   - For newer Supabase versions: app/services/setupBucketPermissions.sql
   - For older Supabase versions: app/services/setupBucketPermissions_simple.sql
   - For final version: app/services/setupBucketPermissions_final.sql
6. Run the query
7. Return to this screen and tap "Test Bucket Permissions" again
`;
    
    Clipboard.setString(instructions);
    Alert.alert(
      'Instructions Copied',
      'Setup instructions have been copied to clipboard',
      [{ text: 'OK' }]
    );
  };
  
  const copyManualBucketInstructions = () => {
    const instructions = `
To manually create the property-images bucket:

1. Log in to your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the "Storage" section
4. Click "Create bucket"
5. Enter "property-images" as the bucket name
6. Check "Public bucket" to make it public
7. Click "Create bucket"
8. Once created, click on the bucket to open it
9. Go to the "Policies" tab
10. Create the following policies:
    - Policy name: "Allow authenticated users full access"
      - For: "All operations"
      - Allowed roles: "authenticated"
      - Using expression: bucket_id = 'property-images'
    - Policy name: "Allow public read access"
      - For: "Select"
      - Allowed roles: "anon"
      - Using expression: bucket_id = 'property-images'
11. Return to this screen and tap "Test Bucket Permissions" again
`;
    
    Clipboard.setString(instructions);
    Alert.alert(
      'Instructions Copied',
      'Manual bucket creation instructions have been copied to clipboard',
      [{ text: 'OK' }]
    );
  };
  
  const openSupabaseDashboard = () => {
    Alert.alert(
      'Open Supabase Dashboard',
      'Would you like to open the Supabase dashboard in your browser?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open', 
          onPress: () => {
            Linking.openURL('https://app.supabase.com/');
          }
        }
      ]
    );
  };
  
  useEffect(() => {
    // Check if real uploads are already enabled
    const checkUploadsEnabled = async () => {
      const enabled = await areRealUploadsEnabled();
      setUploadsEnabled(enabled);
      
      // If not enabled, run the test and enable automatically if it passes
      if (!enabled) {
        try {
          setIsLoading(true);
          setTestMessage('Testing bucket permissions...');
          
          const result = await testBucketPermissions();
          setTestResult(result);
          
          if (result) {
            setTestMessage('Bucket permissions test passed! Enabling image uploads...');
            // Enable uploads automatically
            const enableResult = await enableImageUploads();
            if (enableResult.success) {
              await setRealUploadsEnabled(true);
              setUploadsEnabled(true);
              setTestMessage('Image uploads enabled automatically!');
            } else {
              setTestMessage('Bucket permissions test passed, but could not enable uploads automatically.');
            }
          } else {
            setTestMessage('Bucket permissions test failed. Please run the SQL setup script first.');
          }
        } catch (error) {
          console.error('Error in automatic setup:', error);
          setTestResult(false);
          setTestMessage(`Error: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    checkUploadsEnabled();
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Storage Setup</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Status</Text>
          <Text style={styles.instructionText}>
            {uploadsEnabled 
              ? 'Real image uploads are ENABLED. The app is using the Supabase storage bucket for property images.' 
              : 'Real image uploads are DISABLED. The app is using fallback placeholder images.'}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Bucket Permissions</Text>
          <View style={styles.statusContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : (
              <>
                <Ionicons 
                  name={testResult ? "checkmark-circle" : "close-circle"} 
                  size={60} 
                  color={testResult ? "#4CAF50" : "#F44336"} 
                />
                <Text style={styles.statusMessage}>{testMessage}</Text>
              </>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={runBucketTest}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Bucket Permissions</Text>
          </TouchableOpacity>
          
          {testResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enable Image Uploads</Text>
              <Text style={styles.instructionText}>
                Bucket permissions are configured correctly. You can now enable real image uploads.
              </Text>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.successButton, 
                  (!testResult && !isLoading) && styles.buttonDisabled
                ]} 
                onPress={enableUploads}
                disabled={!testResult || isLoading}
              >
                <Text style={styles.buttonText}>Enable Image Uploads</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {uploadsEnabled && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Disable Image Uploads</Text>
              <Text style={styles.instructionText}>
                You can disable real image uploads and go back to using fallback images.
              </Text>
              
              <TouchableOpacity 
                style={[styles.button, styles.dangerButton]} 
                onPress={async () => {
                  await setRealUploadsEnabled(false);
                  setUploadsEnabled(false);
                  Alert.alert('Success', 'Image uploads have been disabled. The app will use fallback images.');
                }}
              >
                <Text style={styles.buttonText}>Disable Image Uploads</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>
          <Text style={styles.instructionText}>
            If the bucket permissions test failed, you need to run the SQL setup script in your Supabase dashboard.
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={copySetupInstructions}
          >
            <Text style={styles.buttonText}>Copy Setup Instructions</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Bucket Instructions</Text>
          <Text style={styles.instructionText}>
            If the SQL setup script is not working, you can manually create the bucket in your Supabase dashboard.
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={copyManualBucketInstructions}
          >
            <Text style={styles.buttonText}>Copy Manual Bucket Instructions</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Supabase Dashboard</Text>
          <Text style={styles.instructionText}>
            If you need to manually create the bucket, you can open the Supabase dashboard in your browser.
          </Text>
          
          <TouchableOpacity 
            style={styles.button} 
            onPress={openSupabaseDashboard}
          >
            <Text style={styles.buttonText}>Open Supabase Dashboard</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  statusMessage: {
    marginTop: 15,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonTextDisabled: {
    color: '#999999',
  },
  instructionText: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
  },
}); 