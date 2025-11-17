import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { renderContent } from "@/lib/render";
import { SHARE_PASSCODE_COOKIE_PREFIX, comparePasscodeHashes } from "@/lib/shares";

type ShareRow = {
  id: string;
  doc_id: string | null;
  version_id: string | null;
  title?: string | null;
  passcode_hash?: string | null;
  passcode_required?: boolean | null;
};

type VersionRow = {
  id: string;
  title?: string | null;
  name?: string | null;
  content_url?: string | null;
} & Record<string, unknown>;

function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials for share rendering");
  }
  return createClient(url, key);
}

function inferRequiresPasscode(share: ShareRow) {
  return Boolean(share.passcode_required || share.passcode_hash);
}

async function resolveMarkdown(
  supabase: SupabaseClient,
  share: ShareRow
): Promise<{ markdown: string; title: string; docId: string }> {
  let versionId = share.version_id;
  if (!versionId && share.doc_id) {
    const { data: latest } = await supabase
      .from("versions")
      .select("id")
      .eq("doc_id", share.doc_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const latestId = (latest as { id?: string } | null)?.id;
    versionId = typeof latestId === "string" ? latestId : null;
  }

  if (!versionId) {
    throw new Error("NO_VERSION");
  }

  const { data } = await supabase.from("versions").select("*").eq("id", versionId).single();
  const version = data as VersionRow | null;
  if (!version) {
    throw new Error("VERSION_NOT_FOUND");
  }

  const mdCandidates = ["content_md", "body_md", "markdown", "md"] as const;
  let markdown: string | null = null;

  for (const key of mdCandidates) {
    const candidate = version[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      markdown = candidate;
      break;
    }
  }

  if (!markdown && typeof version.content_url === "string") {
    const url = version.content_url;
    if (url.startsWith("/generated/")) {
      const abs = path.join(process.cwd(), "public", url.replace("/generated/", "generated/"));
      try {
        markdown = await fs.readFile(abs, "utf8");
      } catch {
        throw new Error("CONTENT_FILE_ERROR");
      }
    }
  }

  if (!markdown) {
    throw new Error("NO_MARKDOWN");
  }

  const title = (share.title ?? version.title ?? version.name) || "Shared Document";

  return { markdown, title, docId: share.doc_id ?? "" };
}

async function ensurePasscodeAccess(share: ShareRow) {
  if (!inferRequiresPasscode(share)) {
    return true;
  }

  const cookieStore = await cookies();
  const cookieName = `${SHARE_PASSCODE_COOKIE_PREFIX}${share.id}`;
  const cookieValue = cookieStore.get(cookieName)?.value;
  if (!cookieValue) {
    return false;
  }

  const storedHash = share.passcode_hash;
  if (!storedHash) {
    return true;
  }

  return comparePasscodeHashes(cookieValue, storedHash);
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing share id" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data: share, error } = await supabase
      .from("shares")
      .select("id, doc_id, version_id, title, passcode_hash, passcode_required")
      .eq("id", id)
      .single();

    if (error || !share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const requiresPasscode = inferRequiresPasscode(share);
    const hasAccess = await ensurePasscodeAccess(share);
    if (requiresPasscode && !hasAccess) {
      return NextResponse.json({ requiresPasscode: true }, { status: 401 });
    }

    const { markdown, title, docId } = await resolveMarkdown(supabase, share);
    const { html } = renderContent(markdown, "md");

    return NextResponse.json({
      html,
      title,
      docId,
      requiresPasscode: false,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NO_VERSION") {
        return NextResponse.json({ error: "No version for document" }, { status: 404 });
      }
      if (error.message === "VERSION_NOT_FOUND") {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
      }
      if (error.message === "NO_MARKDOWN") {
        return NextResponse.json({ error: "No content available" }, { status: 404 });
      }
      if (error.message === "CONTENT_FILE_ERROR") {
        return NextResponse.json({ error: "Failed to load content file" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
