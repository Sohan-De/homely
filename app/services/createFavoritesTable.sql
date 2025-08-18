-- SQL to create property_favorites table
CREATE TABLE IF NOT EXISTS property_favorites (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Grant access to authenticated users
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own favorites
CREATE POLICY "Users can view their own favorites" 
  ON property_favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own favorites
CREATE POLICY "Users can insert their own favorites" 
  ON property_favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
  ON property_favorites 
  FOR DELETE 
  USING (auth.uid() = user_id); 