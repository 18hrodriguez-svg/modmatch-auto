import { createClient } from "@supabase/supabase-js";

const fallbackSupabaseUrl = "https://sbvsnesncumyszcvwnmy.supabase.co";
const fallbackSupabasePublishableKey =
  "sb_publishable_T2e6sgGmPWtWWNVjD4l7Jw_PmGjVjlN";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || fallbackSupabaseUrl;

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  fallbackSupabasePublishableKey;

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
