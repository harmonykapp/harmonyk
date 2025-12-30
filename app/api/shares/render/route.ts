import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { Database } from "@/lib/supabase/database.types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ShareLinkRow = Database["public"]["Tables"]["share_link"]["Row"];
type ShareLinkRowWithPasscode = ShareLinkRow & { passcode_hash?: string | null };

function withNoStore(resp: NextResponse) {
  // Prevent caching at every layer (browser + CDN + Vercel)
  resp.headers.set("Cache-Control", "no-store, max-age=0");
  resp.headers.set("Pragma", "no-cache");
  resp.headers.set("Expires", "0");
  // Rendering can vary by passcode cookie state
  resp.headers.set("Vary", "Cookie");
  return resp;
}

function isLikelyHtml(s: string) {
  const t = s.trim().toLowerCase();
  return (
    t.startsWith("<!doctype") ||
    t.startsWith("<html") ||
    t.startsWith("<div") ||
    t.startsWith("<h1") ||
    t.startsWith("<p")
  );
}

function markdownToHtml(md: string) {
  let html = md
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^\* (.*$)/gim, "<li>$1</li>")
    .replace(/^- (.*$)/gim, "<li>$1</li>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = html.replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>");
  return `<p>${html}</p>`;
}

async function getShareByTokenOrId(
  admin: ReturnType<typeof createServerSupabaseClient>,
  idOrToken: string
) {
  const { data, error } = await admin
    .from("share_link")
    .select("*")
    .or(`token.eq.${idOrToken},id.eq.${idOrToken}`)
    .maybeSingle<ShareLinkRowWithPasscode>();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const idOrToken = url.searchParams.get("id")?.trim() ?? "";
    if (!idOrToken) {
      return withNoStore(NextResponse.json({ error: "Missing id" }, { status: 400 }));
    }

    const admin = createServerSupabaseClient();
    const share = await getShareByTokenOrId(admin, idOrToken);
    if (!share) {
      return withNoStore(NextResponse.json({ error: "Not found" }, { status: 404 }));
    }

    // Revoked check
    if (share.revoked_at) {
      return withNoStore(NextResponse.json({ error: "Revoked" }, { status: 404 }));
    }

    // Expiry check
    if (share.expires_at) {
      const exp = new Date(share.expires_at).getTime();
      if (Number.isFinite(exp) && Date.now() > exp) {
        return withNoStore(NextResponse.json({ error: "Expired" }, { status: 404 }));
      }
    }

    // Max views check (enforce before doing any work)
    if (share.max_views !== null && share.max_views !== undefined) {
      const max = Number(share.max_views);
      const count = Number(share.view_count ?? 0);
      if (Number.isFinite(max) && max >= 0 && count >= max) {
        return withNoStore(NextResponse.json({ error: "Max views reached" }, { status: 404 }));
      }
    }

    // Passcode gate:
    // - NEW: enforced when passcode_hash exists
    // - BACKCOMPAT: if require_email=true but passcode_hash missing, we still gate (older "passcode links")
    const cookieStore = await cookies();
    const unlocked = cookieStore.get(`share_unlocked_${share.id}`)?.value === "1";
    const requiresPasscode = Boolean((share as ShareLinkRowWithPasscode).passcode_hash) || Boolean(share.require_email);
    if (requiresPasscode && !unlocked) {
      return withNoStore(NextResponse.json({ error: "Passcode required" }, { status: 401 }));
    }

    // View count increment (fail-open): if this update fails, we still render.
    // NOTE: This is not perfectly race-free, but good enough for PGW1.
    try {
      const nextCount = Number(share.view_count ?? 0) + 1;
      await admin
        .from("share_link")
        .update({ view_count: nextCount, updated_at: new Date().toISOString() })
        .eq("id", share.id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[shares/render] view_count increment failed (ignored)", err);
    }

    // Load doc title + pick version
    const { data: doc, error: docErr } = await admin
      .from("document")
      .select("id, title, kind, current_version_id")
      .eq("id", share.document_id)
      .maybeSingle();

    if (docErr) return withNoStore(NextResponse.json({ error: docErr.message }, { status: 500 }));
    if (!doc) return withNoStore(NextResponse.json({ error: "Document not found" }, { status: 404 }));

    let versionId = share.version_id ?? doc.current_version_id ?? null;

    if (!versionId) {
      const { data: latest, error: latestErr } = await admin
        .from("version")
        .select("id")
        .eq("document_id", doc.id)
        .order("number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestErr) return withNoStore(NextResponse.json({ error: latestErr.message }, { status: 500 }));
      versionId = latest?.id ?? null;
    }

    if (!versionId) {
      return withNoStore(NextResponse.json({ error: "No version available" }, { status: 404 }));
    }

    const { data: v, error: vErr } = await admin
      .from("version")
      .select("id, content")
      .eq("id", versionId)
      .maybeSingle();

    if (vErr) return withNoStore(NextResponse.json({ error: vErr.message }, { status: 500 }));
    if (!v?.content) return withNoStore(NextResponse.json({ error: "Empty content" }, { status: 404 }));

    const content = String(v.content);
    const html = isLikelyHtml(content) ? content : markdownToHtml(content);

    return withNoStore(
      NextResponse.json({
        title: doc.title ?? "Document",
        html,
        docId: doc.id,
        requiresPasscode,
      }),
    );
  } catch (e: any) {
    return withNoStore(
      NextResponse.json({ error: e?.message ?? "Render failed" }, { status: 500 }),
    );
  }
}
