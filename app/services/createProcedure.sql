-- Create the missing procedure function
CREATE OR REPLACE FUNCTION create_property_images_table_procedure()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the existing create_property_images_table function
  PERFORM create_property_images_table();
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_property_images_table_procedure() TO authenticated;
GRANT EXECUTE ON FUNCTION create_property_images_table_procedure() TO anon; 