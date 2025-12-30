// lib/google-token.ts
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

/**
 * Returns the Google OAuth access token from the current Supabase session,
 * if available.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  // Safety: this helper must only run in the browser
  if (typeof window === "undefined") return null;

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;

  // Supabase stores the provider token on the session (Google OAuth access token)
  return (data.session as any)?.provider_token ?? null;
}
