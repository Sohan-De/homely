import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://ynmtahasqvkiclktcbox.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlubXRhaGFzcXZraWNsa3RjYm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MDIwNjYsImV4cCI6MjA2NjI3ODA2Nn0.bWbMKdS5HGzMlKBomL82nFduEUuMwwCPhlJbr6dwvAk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export the supabase client as the default export
export default supabase; 