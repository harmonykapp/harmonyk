// SERVER COMPONENT (no "use client")
import { supabaseServer } from "@/lib/supabase-server";
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

type ShareRow = {
  id: string;
  doc_id: string;
  access: "public" | "passcode";
  passcode_hash: string | null;
  created_at: string;
};
type Version = { doc_id: string; number: number; content_url: string };

export default async function ShareViewer(
  { params }: { params: Promise<{ id: string }> } // Next 16: async params
) {
  const { id } = await params;
  const supa = supabaseServer();

  // 1) Load share
  const { data: s, error: e1 } = await supa
    .from("shares")
    .select("id, doc_id, access, passcode_hash, created_at")
    .eq("id", id)
    .single();

  if (e1 || !s) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Shared Document</h1>
        <div style={{ color: "#B00020", marginTop: 12 }}>
          {e1?.message || "Share not found"}
        </div>
      </div>
    );
  }

  // 2) Passcode links: we’ll add a proper server-action form in Week-2
  if (s.access === "passcode") {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 960, margin: "0 auto" }}>
        <h1>Shared Document</h1>
        <div style={{ opacity: 0.7, fontSize: 12 }}>Share ID: <code>{id}</code></div>
        <div style={{ marginTop: 16 }}>
          This link is protected. We’ll enable passcode entry next sprint.
        </div>
      </div>
    );
  }

  // 3) Load latest version
  const { data: vers, error: e2 } = await supa
    .from("versions")
    .select("doc_id, number, content_url")
    .eq("doc_id", s.doc_id)
    .order("number", { ascending: false })
    .limit(1);

  if (e2 || !vers?.length) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Shared Document</h1>
        <div style={{ color: "#B00020", marginTop: 12 }}>
          {e2?.message || "No versions for this document"}
        </div>
      </div>
    );
  }

  const latest: Version = vers[0] as Version;

  // 4) Read content: if it's a relative /generated path, read from disk; else, fetch absolute URL
  let content = "";
  const url = latest.content_url || "";
  try {
    if (url.startsWith("/")) {
      // map '/generated/xxx.md' → '<repo>/public/generated/xxx.md'
      const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      content = await fs.readFile(filePath, "utf8");
    } else if (/^https?:\/\//i.test(url)) {
      const res = await fetch(url, { cache: "no-store" });
      content = await res.text();
    } else {
      throw new Error(`Unrecognized content_url: ${url}`);
    }
  } catch (err: any) {
    content = `Failed to load content: ${err?.message || String(err)}`;
  }

  // 5) Log view (anonymous) on the server
  await supa.from("events").insert({
    doc_id: s.doc_id,
    event_type: "view",
    actor: null,
    meta_json: { from: "share", share_id: s.id, server: true },
  });

  // 6) Render
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1>Shared Document</h1>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Share ID: <code>{id}</code></div>

      <div style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 8, opacity: 0.7, fontSize: 12 }}>
          Latest version: v{latest.number}
        </div>
        <pre
          style={{
            padding: 16,
            border: "1px solid #eee",
            borderRadius: 8,
            background: "#fafafa",
            whiteSpace: "pre-wrap",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          {content}
        </pre>
      </div>
    </div>
  );
}
