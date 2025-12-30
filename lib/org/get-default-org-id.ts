import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * Returns a stable "default org" for a given user.
 * PGW1 rule: pick the earliest membership if no explicit org switcher exists yet.
 */
export async function getDefaultOrgIdForUser(userId: string) {
  const supa = createServerSupabaseClient();

  const { data, error } = await supa
    .from("member")
    .select("org_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.org_id ?? null;
}

