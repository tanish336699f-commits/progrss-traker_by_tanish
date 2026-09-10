import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let supabase: SupabaseClient;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch {
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

export { supabase };
