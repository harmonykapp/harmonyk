// Week 8: Workspace helper for server components
//
// This helper resolves the current user's workspace/org from cookies
// and returns it for use in server components.

import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

export type Workspace = {
  id: string;
  name: string;
};

/**
 * Gets the current user's workspace (org) from their session.
 * Returns null if no workspace is found.
 */
export async function getCurrentWorkspace(): Promise<Workspace | null> {
  const supabase = createServerSupabaseClient();
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\./)?.[1] || "default";
  const authCookieName = `sb-${projectRef}-auth-token`;

  const authCookie = cookieStore.get(authCookieName);
  let userId: string | null = null;

  if (authCookie?.value) {
    try {
      const session = JSON.parse(authCookie.value);
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Fall back to demo user if no session
  if (!userId) {
    userId = DEMO_OWNER_ID;
  }

  // Get user's first org membership
  const { data: memberships, error: membershipsError } = await supabase
    .from("member")
    .select("org_id")
    .eq("user_id", userId)
    .limit(1);

  if (membershipsError || !memberships || memberships.length === 0) {
    return null;
  }

  const orgId = memberships[0].org_id;

  // Get org details
  const { data: org, error: orgError } = await supabase
    .from("org")
    .select("id, name")
    .eq("id", orgId)
    .single();

  if (orgError || !org) {
    return null;
  }

  return {
    id: org.id,
    name: org.name || "Workspace",
  };
}

