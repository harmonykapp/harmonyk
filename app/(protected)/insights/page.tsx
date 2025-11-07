"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Ev = {
  id: number;
  doc_id: string | null;
  event_type: "view" | "download" | "share_created";
  actor: string | null;
  meta_json: any;
  created_at: string;
};

export default function InsightsPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const { data, error } = await sb
      .from("events")
      .select("id, doc_id, event_type, actor, meta_json, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data || []) as Ev[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 3000); // light auto-refresh while testing
    return () => clearInterval(t);
  }, []); // sb is stable

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Insights</h1>

      {loading && <div className="text-sm text-gray-500">Loading events…</div>}
      {err && <div className="text-sm text-red-600">Error: {err}</div>}

      {!loading && !err && rows.length === 0 && (
        <div className="rounded-xl border p-8 text-center text-gray-600">
          <div className="text-lg font-medium mb-2">No events yet</div>
          <div>Try opening a share link, or click View/Download in the Vault.</div>
        </div>
      )}

      {!loading && !err && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Doc</th>
                <th className="text-left px-4 py-3">Actor</th>
                <th className="text-left px-4 py-3">Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="px-4 py-3">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">{e.event_type}</td>
                  <td className="px-4 py-3">{e.doc_id ?? "—"}</td>
                  <td className="px-4 py-3">{e.actor ?? "public"}</td>
                  <td className="px-4 py-3 font-mono whitespace-pre-wrap">
                    {JSON.stringify(e.meta_json || {}, null, 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
