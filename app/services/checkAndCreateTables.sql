-- SQL script to check if tables exist and create them if they don't

-- Function to check and create tables
CREATE OR REPLACE FUNCTION check_and_create_tables()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if property_images table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'property_images'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    -- Create property_images table
    CREATE TABLE property_images (
      id SERIAL PRIMARY KEY,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      display_order INTEGER DEFAULT 0,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable row level security
    ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY "Anyone can view property images" 
      ON property_images 
      FOR SELECT 
      USING (true);
      
    RETURN 'Created property_images table';
  END IF;
  
  -- Check if property_favorites table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = 'property_favorites'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    -- Create property_favorites table
    CREATE TABLE property_favorites (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, property_id)
    );
    
    -- Enable row level security
    ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;
    
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
      
    RETURN 'Created property_favorites table';
  END IF;
  
  RETURN 'All tables already exist';
END;
$$;

-- Execute the function
SELECT check_and_create_tables();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_and_create_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_create_tables() TO anon; 