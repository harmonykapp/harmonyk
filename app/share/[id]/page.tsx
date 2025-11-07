import { supabaseServer } from "@/lib/supabase-server";

type Params = { params: Promise<{ id: string }> };

export default async function ShareViewer({ params }: Params) {
  const { id } = await params;
  const sb = supabaseServer();

  // Try to load the share row
  const { data: s } = await sb
    .from("shares")
    .select("id, doc_id, access, passcode_hash, created_at")
    .eq("id", id)
    .single();

  // Try to load the latest version (optional)
  let latest: { number: number } | null = null;
  if (s?.doc_id) {
    const { data: v } = await sb
      .from("versions")
      .select("number")
      .eq("doc_id", s.doc_id)
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();
    latest = v ?? null;
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1>Shared Document</h1>
      <div style={{ opacity: 0.7, fontSize: 12 }}>Share ID: <code>{id}</code></div>

      {!s && <div style={{ marginTop: 16, color: "#B00020" }}>Not found</div>}

      {s && (
        <div style={{ marginTop: 16 }}>
          <div>Latest version: <strong>{latest ? `v${latest.number}` : "—"}</strong></div>
          <div style={{ marginTop: 12, opacity: 0.8 }}>
            (Public viewer stub — Week-2 will render the actual content with analytics.)
          </div>
        </div>
      )}
    </div>
  );
}
