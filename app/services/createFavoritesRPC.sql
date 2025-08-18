-- Create an RPC function to create the property_favorites table
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
GRANT EXECUTE ON FUNCTION create_favorites_table() TO anon; 