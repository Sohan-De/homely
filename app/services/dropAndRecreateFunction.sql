-- Drop existing functions first
DROP FUNCTION IF EXISTS exec_sql(text);
DROP FUNCTION IF EXISTS execute_sql(text);

-- Recreate exec_sql function
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

-- Create execute_sql as an alias to exec_sql
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN exec_sql(sql_query);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon; 