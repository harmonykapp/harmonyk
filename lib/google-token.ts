// lib/google-token.ts
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Returns the Google OAuth access token from the current Supabase session,
 * or null if the user hasn't connected Google in /integrations.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  const supabase = supabaseBrowser();
  const { data } = await supabase.auth.getSession();
  // Supabase exposes provider_token client-side for OAuth providers.
  // @ts-expect-error: not in public typings
  const token: string | undefined = data?.session?.provider_token;
  return token ?? null;
}
