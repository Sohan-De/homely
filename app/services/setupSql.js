/**
 * This file contains the SQL statements needed to set up your Supabase database.
 * Copy and paste these statements into the Supabase SQL Editor in your dashboard.
 */

import { supabase } from '../config/supabase';

// SQL to create property_categories table
const CREATE_CATEGORIES_TABLE = `
CREATE TABLE IF NOT EXISTS property_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL to create properties table
const CREATE_PROPERTIES_TABLE = `
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  category_id INTEGER REFERENCES property_categories(id),
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  location TEXT NOT NULL,
  beds INTEGER NOT NULL,
  baths INTEGER NOT NULL,
  sqft INTEGER NOT NULL,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL to create property_favorites table
const CREATE_FAVORITES_TABLE = `
CREATE TABLE IF NOT EXISTS property_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);
`;

// Instructions:
/**
 * How to use this file:
 * 
 * 1. Go to your Supabase project dashboard
 * 2. Click on "SQL Editor" in the left sidebar
 * 3. Create a "New query"
 * 4. Copy and paste each SQL statement separately and run them in this order:
 *    - CREATE_CATEGORIES_TABLE
 *    - CREATE_PROPERTIES_TABLE
 *    - CREATE_FAVORITES_TABLE
 * 5. After creating the tables, use the app to seed the data
 */

export const sqlInstructions = `
-- 1. Create categories table
${CREATE_CATEGORIES_TABLE}

-- 2. Create properties table
${CREATE_PROPERTIES_TABLE}

-- 3. Create favorites table
${CREATE_FAVORITES_TABLE}
`; 

// Default export with SQL setup functionality
const setupSql = {
  sqlInstructions,
  CREATE_CATEGORIES_TABLE,
  CREATE_PROPERTIES_TABLE,
  CREATE_FAVORITES_TABLE
};

export default setupSql;

/**
 * Registers the create_property_images_table function with Supabase
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export const registerCreatePropertyImagesFunction = async () => {
  try {
    // SQL to create the function
    const sql = `
-- Function to create the property_images table if it doesn't exist
CREATE OR REPLACE FUNCTION create_property_images_table()
RETURNS void AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'property_images'
  ) THEN
    -- Create the table
    CREATE TABLE public.property_images (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Anyone can view property images" 
      ON public.property_images 
      FOR SELECT 
      USING (true);
    
    CREATE POLICY "Authenticated users can insert property images" 
      ON public.property_images 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
    
    CREATE POLICY "Authenticated users can update property images" 
      ON public.property_images 
      FOR UPDATE 
      TO authenticated 
      USING (true);
    
    CREATE POLICY "Authenticated users can delete property images" 
      ON public.property_images 
      FOR DELETE 
      TO authenticated 
      USING (true);
      
    RAISE NOTICE 'Created property_images table with RLS policies';
  ELSE
    RAISE NOTICE 'property_images table already exists';
  END IF;
END;
$$ LANGUAGE plpgsql;
    `;
    
    // Register the function with Supabase
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error registering create_property_images_table function:', error);
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Successfully registered create_property_images_table function'
    };
  } catch (error) {
    console.error('Error in registerCreatePropertyImagesFunction:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
};

/**
 * Creates the property_images table if it doesn't exist
 * @returns {Promise<{success: boolean, message: string}>} Result of the operation
 */
export const createPropertyImagesTable = async () => {
  try {
    // Call the function to create the table
    const { error } = await supabase.rpc('create_property_images_table');
    
    if (error) {
      console.error('Error creating property_images table:', error);
      
      // If the function doesn't exist, register it first
      if (error.code === 'PGRST116') {
        console.log('Function does not exist, registering it first...');
        const result = await registerCreatePropertyImagesFunction();
        
        if (result.success) {
          // Try again after registering
          const retryResult = await supabase.rpc('create_property_images_table');
          
          if (retryResult.error) {
            return {
              success: false,
              message: `Error after registering function: ${retryResult.error.message}`
            };
          }
          
          return {
            success: true,
            message: 'Successfully created property_images table'
          };
        } else {
          return result;
        }
      }
      
      return {
        success: false,
        message: `Error: ${error.message}`
      };
    }
    
    return {
      success: true,
      message: 'Successfully created property_images table'
    };
  } catch (error) {
    console.error('Error in createPropertyImagesTable:', error);
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}; 