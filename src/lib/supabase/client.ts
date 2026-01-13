/**
 * Client Supabase avec configuration
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lrarkyavsybywknmuxil.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper pour vérifier la connexion
export const checkConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('projects').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Helper pour l'authentification
export const auth = {
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  },
  
  signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
    return supabase.auth.signUp({ 
      email, 
      password,
      options: { data: metadata }
    });
  },
  
  signOut: async () => {
    return supabase.auth.signOut();
  },
  
  getUser: async () => {
    return supabase.auth.getUser();
  },
  
  getSession: async () => {
    return supabase.auth.getSession();
  },
  
  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    return supabase.auth.onAuthStateChange(callback);
  },

  resetPassword: async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  }
};

// Helper pour le storage
export const storage = {
  upload: async (bucket: string, path: string, file: File) => {
    return supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  },
  
  download: async (bucket: string, path: string) => {
    return supabase.storage.from(bucket).download(path);
  },
  
  getPublicUrl: (bucket: string, path: string) => {
    return supabase.storage.from(bucket).getPublicUrl(path);
  },
  
  remove: async (bucket: string, paths: string[]) => {
    return supabase.storage.from(bucket).remove(paths);
  },
  
  list: async (bucket: string, path?: string) => {
    return supabase.storage.from(bucket).list(path);
  }
};

export default supabase;
