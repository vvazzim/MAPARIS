import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseInstance: SupabaseClient | null = null;

const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;

if (env.SUPABASE_URL && key) {
  try {
    supabaseInstance = createClient(env.SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    console.log('⚡ [Supabase] Connexion active à la base PostgreSQL Supabase');
  } catch (err: any) {
    console.warn('⚠️ [Supabase] Échec initialisation client Supabase:', err.message);
  }
} else {
  console.log('ℹ️ [Supabase] Clés non configurées : bascule en mode stockage local sécurisé');
}

export const supabase = supabaseInstance;
export const isSupabaseEnabled = Boolean(supabaseInstance);
