-- This is a final version of the bucket permissions setup that assumes the bucket already exists
-- Run these commands in the Supabase SQL Editor

-- 1. Check if the bucket exists, and if not, create it (only works when run by a superuser)
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'property-images') INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    -- Only a superuser can create buckets through SQL
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('property-images', 'property-images', true);
    
    RAISE NOTICE 'Created property-images bucket';
  ELSE
    -- Make sure the bucket is public
    UPDATE storage.buckets 
    SET public = true 
    WHERE id = 'property-images';
    
    RAISE NOTICE 'Updated property-images bucket to be public';
  END IF;
END $$;

-- 2. Set up RLS policies for storage.objects table directly

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users full access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;

-- Allow authenticated users full access to property-images bucket
CREATE POLICY "Allow authenticated users full access"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'property-images')
WITH CHECK (bucket_id = 'property-images');

-- Allow public read access to property-images bucket
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'property-images');

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