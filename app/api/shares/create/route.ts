import { logActivity } from "@/lib/activity-log";
import { getAppUrl } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/supabase/database.types";
import type { ShareLink } from "@/lib/types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

interface ShareCreateBody {
  documentId: string;
  versionId?: string | null;
  label?: string | null;
  expiresAt?: string | null;
  maxViews?: number | null;
  requireEmail?: boolean;
  passcodeHash?: string | null; // sha256 hex (client computed)
}

export const runtime = "nodejs";

function bearerToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    // Auth: MUST derive user from session (no demo fallback).
    const cookieStore = await cookies();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: "Server misconfigured: missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY" },
        { status: 500 },
      );
    }

    // IMPORTANT:
    // - This SSR client MUST use the anon key (user session comes from cookies).
    // - Never use the service role key in a cookie/session client.
    const supabase = createServerClient<Database>(
      supabaseUrl,
      anonKey,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookieList: Array<{ name: string; value: string; options?: any }>) => {
            for (const cookie of cookieList) {
              cookieStore.set(cookie.name, cookie.value, cookie.options);
            }
          },
        },
      },
    );

    // Support BOTH:
    // - cookie-based auth (normal web app flow)
    // - Authorization: Bearer <access_token> (your Vault client currently sends this)
    const accessToken = bearerToken(req);
    const { data: authData, error: authErr } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : await supabase.auth.getUser();
    const authUser = authData?.user ?? null;
    if (authErr || !authUser) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Ensure public.app_user exists for this auth user (keeps FK happy)
    // Use the service-role client for this upsert so it can't be blocked by RLS
    // and so FK constraints are satisfied before we attempt share_link insert.
    const admin = createServerSupabaseClient();
    const { error: upsertErr } = await admin
      .from("app_user")
      .upsert(
        {
          id: authUser.id,
          auth_user_id: authUser.id,
          email: authUser.email ?? null,
        },
        { onConflict: "id" },
      );
    if (upsertErr) {
      return NextResponse.json(
        {
          error:
            "Failed to ensure app_user exists (required for share_link FK).",
          details: {
            message: upsertErr.message,
            code: (upsertErr as any).code,
            hint: (upsertErr as any).hint,
            details: (upsertErr as any).details,
          },
        },
        { status: 500 },
      );
    }

    const body = (await req.json()) as ShareCreateBody;

    if (!body.documentId) {
      return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    // Use a user-scoped DB client for preflight checks.
    // If the caller sent a bearer token, we run preflight in that user context.
    const userDb = accessToken
      ? createServerClient<Database>(
          supabaseUrl,
          anonKey,
          {
            cookies: {
              getAll: () => cookieStore.getAll(),
              setAll: (cookieList: Array<{ name: string; value: string; options?: any }>) => {
                for (const cookie of cookieList) {
                  cookieStore.set(cookie.name, cookie.value, cookie.options);
                }
              },
            },
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
          } as any,
        )
      : supabase;

    // Preflight: ensure the document exists & is visible to the current user, and get its org_id.
    // NOTE:
    // `next build` is currently type-checking Supabase with a Database union that
    // does not include "document"/"version" even though they exist at runtime.
    // Use an untyped handle here to avoid TS overload failures during build.
    const userDbAny: any = userDb;

    const { data: docRow, error: docErr } = await userDbAny
      .from("document")
      .select("id, org_id")
      .eq("id", body.documentId)
      .maybeSingle();

    if (docErr) {
      // eslint-disable-next-line no-console
      console.error("[shares/create] Document preflight query failed", docErr);
    }

    if (!docRow) {
      return NextResponse.json(
        {
          error:
            'Invalid documentId for share_link. No row found in public.document for that id. ' +
            'This usually means the caller is passing an id from a different table (e.g. a legacy public.documents table).',
        },
        { status: 400 },
      );
    }

    const orgId = docRow.org_id;
    if (!orgId) {
      return NextResponse.json(
        { error: "Document has no org_id" },
        { status: 400 },
      );
    }

    // If versionId was provided, validate it exists and belongs to the document (user-visible).
    if (body.versionId) {
      const { data: vRow, error: vErr } = await userDbAny
        .from("version")
        .select("id, document_id")
        .eq("id", body.versionId)
        .maybeSingle();

      if (vErr) {
        // eslint-disable-next-line no-console
        console.error("[shares/create] Version preflight query failed", vErr);
        return NextResponse.json(
          { error: "Failed to validate versionId", details: { message: vErr.message, code: (vErr as any).code } },
          { status: 500 },
        );
      }

      if (!vRow) {
        return NextResponse.json(
          { error: "Invalid versionId for share_link. No row found in public.version for that id." },
          { status: 400 },
        );
      }

      if (vRow.document_id !== body.documentId) {
        return NextResponse.json(
          { error: "Invalid versionId: version does not belong to the provided documentId." },
          { status: 400 },
        );
      }
    }

    const appUrl = getAppUrl();
    const token = randomUUID().replace(/-/g, "");

    const createdBy = authUser.id;

    // Passcode enforcement is driven by passcode_hash (not require_email).
    // We keep require_email for backward compat + existing UI wiring.
    const passcodeHash = body.passcodeHash?.trim() ? body.passcodeHash.trim() : null;
    const requireEmail = Boolean(passcodeHash) || (body.requireEmail ?? false);

    // CRITICAL FIX:
    // Insert share_link using service-role admin client to avoid RLS blocking inserts
    // for users that can see documents (owner-based RLS) but may not satisfy org-membership policies.
    // Safety: we already validated the document (and version) are visible to the user above.
    const { data: share, error: shareError } = await admin
      .from("share_link")
      .insert({
        org_id: orgId,
        document_id: body.documentId,
        version_id: body.versionId ?? null,
        token,
        label: body.label ?? null,
        expires_at: body.expiresAt ? new Date(body.expiresAt).toISOString() : null,
        max_views: body.maxViews ?? null,
        require_email: requireEmail,
        passcode_hash: passcodeHash,
        created_by: createdBy,
      })
      .select("id, token")
      .single()
      .returns<Pick<ShareLink, "id" | "token">>();

    if (shareError || !share) {
      // eslint-disable-next-line no-console
      console.error("[shares/create] Failed to insert share_link", shareError);
      return NextResponse.json(
        {
          error: "Failed to create share link",
          details: shareError
            ? {
                message: shareError.message,
                code: (shareError as any).code,
                hint: (shareError as any).hint,
                details: (shareError as any).details,
              }
            : null,
        },
        { status: 500 },
      );
    }

    const url = `${appUrl}/share/${share.token}`;

    // Fail-open: share creation must succeed even if activity logging fails.
    try {
      await logActivity({
        orgId,
        userId: createdBy,
        type: "share_created",
        documentId: body.documentId,
        versionId: body.versionId ?? null,
        shareLinkId: share.id,
        context: { url },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[shares/create] logActivity failed (ignored)", err);
    }

    return NextResponse.json({ id: share.id, url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create share";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
