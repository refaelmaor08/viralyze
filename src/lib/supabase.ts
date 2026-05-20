import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

// TODO: Replace placeholder values in .env.local with real Supabase credentials.
// 1. Create a free project at https://supabase.com
// 2. Go to Project Settings → API
// 3. Copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL
// 4. Copy "anon public" key → NEXT_PUBLIC_SUPABASE_ANON_KEY
// 5. Enable Google / Apple OAuth in Authentication → Providers
// 6. Add redirect URL: https://your-domain.com/auth/callback
export const supabaseReady = !!(
  url && !url.startsWith('your_') &&
  key && !key.startsWith('your_')
);

export const supabase: SupabaseClient | null = supabaseReady
  ? createClient(url, key, {
      auth: {
        // Persist session across browser tabs and refreshes
        persistSession: true,
        detectSessionInUrl: true,
        // TODO: Switch to 'pkce' for Apple Sign In on iOS
        flowType: 'pkce',
      },
    })
  : null;
