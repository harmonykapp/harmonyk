"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Doc = { id: string; title: string; created_at: string };

export default function SignaturesPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [docId, setDocId] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await sb.auth.getUser();
      if (!data?.user) {
        setLoading(false);
        return;
      }
      setUserId(data.user.id);

      const { data: d } = await sb
        .from("documents")
        .select("id, title, created_at")
        .eq("owner_id", data.user.id)
        .order("created_at", { ascending: false });
      setDocs((d || []) as Doc[]);
      setLoading(false);
    })();
  }, [sb]);

  async function onSend() {
    setResult(null);
    if (!userId) {
      alert("Please sign in again.");
      return;
    }
    if (!docId || !email) {
      alert("Pick a document and enter an email");
      return;
    }

    const { error } = await sb.from("events").insert({
      doc_id: docId,
      event_type: "share_created",
      actor: userId,
      meta_json: { envelope: true, provider: "documenso", to: email },
    });

    setResult(error ? "Failed: " + error.message : "Envelope created (stub). Check Insights.");
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Send for Signature</h1>
      {loading && <div>Loading…</div>}
      {!loading && (
        <div className="space-y-4 max-w-xl">
          <label className="block">
            <div className="text-sm mb-1">Document</div>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
            >
              <option value="">Select a document…</option>
              {docs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <div className="text-sm mb-1">Signer email</div>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="person@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <button className="px-4 py-2 rounded-xl border hover:bg-gray-50" onClick={onSend}>
            Send for signature (stub)
          </button>

          {result && <div className="text-sm text-gray-700">{result}</div>}

          <div className="text-xs text-gray-500">
            Week-1 stub only. Week-2: real Documenso envelopes + webhooks.
          </div>
        </div>
      )}
    </div>
  );
}
