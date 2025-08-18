-- Function to count users in auth.users table
-- This function needs to be executed in the Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.get_user_count()
RETURNS TABLE (count bigint) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT COUNT(*) FROM auth.users;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_user_count() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_count() TO authenticated;

-- Usage example:
-- SELECT * FROM get_user_count(); 