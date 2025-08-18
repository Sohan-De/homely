-- Create execute_sql function as an alias to exec_sql

-- First, check if exec_sql exists and create it if it doesn't
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

-- Now create execute_sql as an alias to exec_sql
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