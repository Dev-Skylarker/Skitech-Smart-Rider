import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// IMPORTANT: Vite statically replaces import.meta.env.VITE_* at build time
// only when accessed as literal dot-notation. Dynamic bracket access
// (import.meta.env[key]) is NOT replaced and always returns undefined in prod.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
