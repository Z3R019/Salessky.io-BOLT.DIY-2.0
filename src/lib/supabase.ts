import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Fehlende Supabase Umgebungsvariablen');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: (url, options) => {
      const timeout = 60000; // 60 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      return fetch(url, {
        ...options,
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));
    }
  }
});

export const safeQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3
): Promise<{ data: T | null; error: any }> => {
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      const result = await queryFn();
      if (!result.error) {
        return result;
      }
      
      if (result.error.code === 'PGRST301' || result.error.message?.includes('timeout')) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        continue;
      }
      
      return result;
    } catch (err) {
      console.error('Supabase query error:', err);
      attempts++;
      
      if (attempts >= retries) {
        return { data: null, error: err };
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
  }
  
  return { data: null, error: new Error('Maximum retry attempts reached') };
};

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
