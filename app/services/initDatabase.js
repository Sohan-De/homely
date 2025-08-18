import { Alert, Linking } from 'react-native';
import { supabase } from '../config/supabase';
import { sqlInstructions } from './setupSql';

/**
 * Checks if the database tables exist
 */
export async function checkDatabaseTables() {
  try {
    // Try to query the property_categories table
    const { data, error } = await supabase
      .from('property_categories')
      .select('count')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Table doesn't exist
      return false;
    } else if (error) {
      console.error('Error checking database tables:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error in checkDatabaseTables:', error);
    return false;
  }
}

/**
 * Shows an alert with instructions on how to set up the database
 */
export function showDatabaseInstructions() {
  Alert.alert(
    'Database Setup Required',
    'The database tables don\'t exist yet. Would you like to see instructions on how to set them up?',
    [
      {
        text: 'View Instructions',
        onPress: () => {
          Alert.alert(
            'Database Setup Instructions',
            'Follow these steps:\n\n' +
            '1. Go to your Supabase dashboard at https://supabase.com/dashboard\n' +
            '2. Select your project\n' +
            '3. Click on "SQL Editor" in the left sidebar\n' +
            '4. Create a "New query"\n' +
            '5. Copy and paste the SQL from the app\n' +
            '6. Run the SQL query\n' +
            '7. Return to the app and restart it',
            [
              { text: 'Open Supabase', onPress: () => Linking.openURL('https://supabase.com/dashboard') },
              { text: 'OK' }
            ]
          );
        }
      },
      { text: 'Cancel', style: 'cancel' }
    ]
  );
}

/**
 * Returns the SQL needed to create the database tables
 */
export function getDatabaseSql() {
  return sqlInstructions;
}

/**
 * Initialize the database by showing instructions and guiding the user
 */
export async function initializeDatabase() {
  const tablesExist = await checkDatabaseTables();
  
  if (!tablesExist) {
    showDatabaseInstructions();
    return { 
      success: false, 
      message: 'Database tables do not exist. Please follow the setup instructions.' 
    };
  }
  
  return { 
    success: true, 
    message: 'Database tables exist.' 
  };
}

// Check if property_favorites table exists and create it if not
export async function checkAndCreateFavoritesTable() {
  try {
    // Try to query the table to see if it exists
    const { error } = await supabase
      .from('property_favorites')
      .select('id')
      .limit(1);
    
    // If we get an error about the table not existing, create it
    if (error && error.code === '42P01') {
      console.log('property_favorites table does not exist, creating it now...');
      
      // Create the table
      const { error: createError } = await supabase.rpc('create_favorites_table');
      
      if (createError) {
        console.error('Error creating property_favorites table:', createError);
        return false;
      }
      
      console.log('property_favorites table created successfully');
      return true;
    } else if (error) {
      console.error('Error checking property_favorites table:', error);
      return false;
    }
    
    console.log('property_favorites table already exists');
    return true;
  } catch (error) {
    console.error('Error in checkAndCreateFavoritesTable:', error);
    return false;
  }
}

// Create an RPC function in Supabase SQL Editor:
/*
CREATE OR REPLACE FUNCTION create_favorites_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS property_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, property_id)
  );
  
  ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own favorites" ON property_favorites;
  DROP POLICY IF EXISTS "Users can insert their own favorites" ON property_favorites;
  DROP POLICY IF EXISTS "Users can delete their own favorites" ON property_favorites;
  
  -- Create policies
  CREATE POLICY "Users can view their own favorites" 
    ON property_favorites 
    FOR SELECT 
    USING (auth.uid() = user_id);
  
  CREATE POLICY "Users can insert their own favorites" 
    ON property_favorites 
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  
  CREATE POLICY "Users can delete their own favorites" 
    ON property_favorites 
    FOR DELETE 
    USING (auth.uid() = user_id);
    
  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_favorites_table() TO authenticated;
*/

// Check if property_images table exists and create it if not
export async function checkAndCreatePropertyImagesTable() {
  try {
    // Try to query the table to see if it exists
    const { error } = await supabase
      .from('property_images')
      .select('id')
      .limit(1);
    
    // If we get an error about the table not existing, create it
    if (error && error.code === '42P01') {
      console.log('property_images table does not exist, creating it now...');
      
      // Create the table
      const { error: createError } = await supabase.rpc('create_property_images_table');
      
      if (createError) {
        console.error('Error creating property_images table:', createError);
        return false;
      }
      
      console.log('property_images table created successfully');
      return true;
    } else if (error) {
      console.error('Error checking property_images table:', error);
      return false;
    }
    
    console.log('property_images table already exists');
    return true;
  } catch (error) {
    console.error('Error in checkAndCreatePropertyImagesTable:', error);
    return false;
  }
}

// The default export with the main database functionality
const databaseService = {
  initializeDatabase,
  checkDatabaseTables,
  checkAndCreateFavoritesTable,
  checkAndCreatePropertyImagesTable,
  getDatabaseSql,
  showDatabaseInstructions
};

export default databaseService; 