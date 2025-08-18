-- SQL script to create just the property_images table

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
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;

-- Create policies for property_images
CREATE POLICY "Anyone can view property images" 
  ON property_images 
  FOR SELECT 
  USING (true);

-- Create or replace the function to create the property_images table
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_property_images_table() TO authenticated;
GRANT EXECUTE ON FUNCTION create_property_images_table() TO anon;

-- Create a generic SQL execution function (for admin use)
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

-- Only grant this to authenticated users (restrict further in production)
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated; 