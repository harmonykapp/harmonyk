import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  try {
    const { shareId } = await req.json();
    if (!shareId) return NextResponse.json({ error: "Missing shareId" }, { status: 400 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // 1) Load share
    const { data: share, error: sErr } = await supabase
      .from("shares")
      .select("id, doc_id, version_id, passcode_required")
      .eq("id", shareId)
      .single();
    if (sErr || !share) return NextResponse.json({ error: "Share not found" }, { status: 404 });

    // 2) Passcode check
    if (share.passcode_required) {
      const ok = cookies().get(`share_${shareId}`)?.value === "ok";
      if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3) Resolve version
    let versionId: string | null = share.version_id as string | null;
    if (!versionId && share.doc_id) {
      const { data: latest } = await supabase
        .from("versions")
        .select("id")
        .eq("doc_id", share.doc_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      versionId = latest?.id ?? null;
    }
    if (!versionId) return NextResponse.json({ error: "No version for document" }, { status: 404 });

    // 4) Fetch version (tolerant select)
    const { data: version, error: vErr } = await supabase
      .from("versions")
      .select("*")
      .eq("id", versionId)
      .single();
    if (vErr || !version) return NextResponse.json({ error: "Version not found" }, { status: 404 });

    // 5) Prefer inline md; fallback to content_url under /public/generated
    const mdCandidates = ["content_md", "body_md", "markdown", "md"] as const;
    let markdown: string | null = null;
    for (const key of mdCandidates) {
      const val = (version as any)[key];
      if (typeof val === "string" && val.length > 0) { markdown = val; break; }
    }

    if (!markdown && typeof (version as any).content_url === "string") {
      const url = (version as any).content_url as string;
      if (url.startsWith("/generated/")) {
        const abs = path.join(process.cwd(), "public", url.replace("/generated/", "generated/"));
        try { markdown = await fs.readFile(abs, "utf8"); }
        catch { return NextResponse.json({ error: "Failed to read content_url" }, { status: 500 }); }
      }
    }

    if (!markdown) return NextResponse.json({ error: "No markdown content found" }, { status: 404 });

    const title = (version as any).title ?? (version as any).name ?? "Shared Document";
    return NextResponse.json({ title, markdown });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
