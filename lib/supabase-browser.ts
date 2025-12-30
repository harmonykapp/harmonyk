import type { Database } from "@/lib/supabase/database.types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _browserClient: SupabaseClient<Database> | null = null;

/**
 * Browser-only Supabase client (singleton).
 * - Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY (REMOTE)
 * - detectSessionInUrl=true is required for magic-link + OAuth callback pages
 */
export function createBrowserSupabaseClient() {
  if (_browserClient) return _browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment",
    );
  }

  _browserClient = createClient<Database>(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return _browserClient;
}

// Back-compat alias (repo already imports this name in multiple places)
export function getBrowserSupabaseClient() {
  return createBrowserSupabaseClient();
}
