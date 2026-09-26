import { createClient } from '@supabase/supabase-js';

/**
 * The single Supabase client used by the whole app.
 *
 * Values come from `.env.local` (see `.env.example`). Only `EXPO_PUBLIC_` variables
 * reach the app, and they are visible to anyone who has the app, so only the
 * *publishable* (anon) key belongs here — never the secret / service_role key.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env.local, fill in the values, ' +
      'then restart `npx expo start`.'
  );
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    // There is no login yet, so there is no session to save or refresh.
    // When we add authentication, we will add session storage here.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
