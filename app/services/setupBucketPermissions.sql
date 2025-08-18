-- This file contains SQL commands to set up proper permissions for the property-images bucket
-- Run these commands in the Supabase SQL Editor

-- 1. Make sure the property-images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Set up RLS policies for the bucket using the correct API

-- First, check if we have the newer storage.policies table
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'storage' 
    AND table_name = 'policies'
  ) THEN
    -- Newer Supabase versions - use storage.policies table
    
    -- Remove any existing policies for this bucket
    DELETE FROM storage.policies 
    WHERE bucket_id = 'property-images';
    
    -- Allow authenticated users to upload files
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (
      'Allow authenticated users full access', 
      'property-images', 
      '{"roleId":"authenticated","permission":"full_access"}'::jsonb
    );
    
    -- Allow public read access
    INSERT INTO storage.policies (name, bucket_id, definition)
    VALUES (
      'Allow public read access', 
      'property-images', 
      '{"roleId":"anon","permission":"read"}'::jsonb
    );
  ELSE
    -- Older Supabase versions - use direct policy creation
    
    -- Allow authenticated users full access
    CREATE POLICY "Allow authenticated users full access"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (bucket_id = 'property-images')
    WITH CHECK (bucket_id = 'property-images');
    
    -- Allow public read access
    CREATE POLICY "Allow public read access"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'property-images');
  END IF;
END $$;

-- 3. Set up RLS policies for the property_images table

-- First, enable RLS
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view property images" ON public.property_images;
DROP POLICY IF EXISTS "Authenticated users can insert property images" ON public.property_images;
DROP POLICY IF EXISTS "Authenticated users can update property images" ON public.property_images;
DROP POLICY IF EXISTS "Authenticated users can delete property images" ON public.property_images;

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

-- 4. Verify the policies have been created
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
SELECT * FROM pg_policies WHERE tablename = 'property_images'; 