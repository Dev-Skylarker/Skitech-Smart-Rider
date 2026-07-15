import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const getEnv = (key: string): string => {
  const val = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[key] : undefined;
  if (val && val !== 'undefined' && val !== 'null' && val.trim() !== '') return val;
  const procVal = typeof process !== 'undefined' && process.env ? process.env[key] : undefined;
  if (procVal && procVal !== 'undefined' && procVal !== 'null' && procVal.trim() !== '') return procVal;
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'placeholder-anon-key';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
