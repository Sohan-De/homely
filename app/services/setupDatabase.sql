-- Complete database setup script for Homely app

-- Create property_categories table
CREATE TABLE IF NOT EXISTS property_categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create properties table
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

-- Create property_favorites table
CREATE TABLE IF NOT EXISTS property_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for property_categories
DROP POLICY IF EXISTS "Anyone can view property categories" ON property_categories;

-- Create policies for property_categories
CREATE POLICY "Anyone can view property categories" 
  ON property_categories 
  FOR SELECT 
  USING (true);

-- Drop existing policies for properties
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;

-- Create policies for properties
CREATE POLICY "Anyone can view properties" 
  ON properties 
  FOR SELECT 
  USING (true);

-- Drop existing policies for property_favorites
DROP POLICY IF EXISTS "Users can view their own favorites" ON property_favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON property_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON property_favorites;

-- Create policies for property_favorites
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

-- Drop existing policies for property_images
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;

-- Create policies for property_images
CREATE POLICY "Anyone can view property images" 
  ON property_images 
  FOR SELECT 
  USING (true);

-- Create RPC functions

-- Function to create property_favorites table
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

-- Function to create property_images table
CREATE OR REPLACE FUNCTION create_property_images_table()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
  
  -- Create policies
  CREATE POLICY "Anyone can view property images" 
    ON property_images 
    FOR SELECT 
    USING (true);
    
  RETURN TRUE;
END;
$$;

-- Function to execute SQL (for admin use)
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
  RETURN 'SQL executed successfully';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Function to get user count
CREATE OR REPLACE FUNCTION get_user_count()
RETURNS TABLE (count bigint) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT COUNT(*) FROM auth.users;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_favorites_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_favorites_table() TO anon;
GRANT EXECUTE ON FUNCTION create_property_images_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_property_images_table() TO anon;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION get_user_count() TO authenticated; 