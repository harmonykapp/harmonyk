import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Creates a Supabase client for server-side use.
 * This is a wrapper around createServerSupabaseClient to match the Next.js pattern.
 * 
 * For authenticated requests, use getRouteAuthContext from @/lib/auth/route-auth.
 * For service-role operations, this uses the service-role key.
 */
export function createClient(): SupabaseClient {
  return createServerSupabaseClient();
}

