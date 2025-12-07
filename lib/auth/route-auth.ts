import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ??
  "00000000-0000-0000-0000-000000000000";

export interface RouteAuthContext {
  isAuthenticated: boolean;
  userId: string | null;
  orgId: string | null;
  ownerId: string | null;
  supabase: SupabaseClient;
}

/**
 * Extracts the Supabase access token from request cookies.
 * Supabase stores auth in cookies with pattern: sb-<project-ref>-auth-token
 */
async function extractAccessTokenFromCookies(req: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const projectRef = supabaseUrl?.match(/https?:\/\/([^.]+)\./)?.[1] || "default";
  const authCookieName = `sb-${projectRef}-auth-token`;

  const authCookie = cookieStore.get(authCookieName);
  if (!authCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(authCookie.value);
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

/**
 * Get authenticated user + org context for API routes.
 *
 * @param req - Next.js Request object
 * @returns RouteAuthContext with isAuthenticated, userId, orgId, ownerId, and supabase client
 */
export async function getRouteAuthContext(
  req: Request,
): Promise<RouteAuthContext> {
  // Auth client used only to validate access tokens.
  const supabase = createClient(supabaseUrl!, anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Service-role client for org + membership lookups.
  const supabaseAdmin = createServerSupabaseClient();

  let userId: string | null = null;
  let orgId: string | null = null;
  let ownerId: string | null = null;

  // 1) Try explicit user header first (set by client after sb.auth.getUser()).
  const clientUserId = req.headers.get("x-user-id");
  if (
    clientUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      clientUserId,
    )
  ) {
    userId = clientUserId;
  }

  // 2) Fallback to Supabase auth cookies.
  if (!userId) {
    const accessToken = await extractAccessTokenFromCookies(req);

    if (accessToken) {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(accessToken);

        if (user && !error) {
          userId = user.id;
        } else if (error) {
          console.warn("[route-auth] getUser() failed with access token", {
            error: error.message,
          });
        }
      } catch (error) {
        console.warn(
          "[route-auth] Error calling getUser() with access token",
          {
            error:
              error instanceof Error ? error.message : String(error),
          },
        );
      }
    } else {
      const cookieHeader = req.headers.get("cookie");
      console.warn("[route-auth] No access token found", {
        hasCookieHeader: !!cookieHeader,
        cookieHeaderLength: cookieHeader?.length ?? 0,
      });
    }
  }

  // 3) If we have a real user, resolve or create their org.
  if (userId) {
    const { data: memberships } = await supabaseAdmin
      .from("member")
      .select("org_id")
      .eq("user_id", userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      orgId = memberships[0].org_id;
    } else {
      const { data: defaultOrg, error: orgError } = await supabaseAdmin
        .from("org")
        .insert({
          name: "My Workspace",
          plan: "free",
        })
        .select("id")
        .single();

      if (!orgError && defaultOrg) {
        orgId = defaultOrg.id;
        await supabaseAdmin.from("member").insert({
          org_id: orgId,
          user_id: userId,
          role: "owner",
        });
      }
    }

    ownerId = userId;
  }

  // 4) Dev-only fallback: if we *still* don't have a user/org, synthesize one.
  if ((!userId || !orgId) && process.env.NODE_ENV !== "production") {
    const { data: orgs, error } = await supabaseAdmin
      .from("org")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1);

    if (!error && orgs && orgs.length > 0) {
      const fallbackOrgId = orgs[0].id as string;
      const fallbackUserId = DEMO_OWNER_ID;

      // This is only used for local/dev GA verification when auth cookies
      // are missing or broken. Hosted GA relies on real Supabase auth.
      // eslint-disable-next-line no-console
      console.warn(
        "[route-auth] Dev fallback: using first org for unauthenticated request",
        { orgId: fallbackOrgId },
      );

      return {
        isAuthenticated: true,
        userId: fallbackUserId,
        orgId: fallbackOrgId,
        ownerId: fallbackUserId,
        supabase: supabaseAdmin,
      };
    }
  }

  return {
    isAuthenticated: userId !== null,
    userId,
    orgId,
    ownerId,
    supabase: supabaseAdmin,
  };
}
