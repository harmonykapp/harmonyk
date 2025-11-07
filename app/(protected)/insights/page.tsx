"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

/**
 * Event row shape (extend as needed)
 */
type InsightEvent = {
  id: number;
  event_type: "view" | "download" | "share_created" | "envelope";
  created_at: string;
  doc_id: string | null;
  meta_json: Record<string, unknown>;
};

export default function InsightsPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<InsightEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /**
   * Load events (memoized)
   */
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data, error } = await sb
      .from("events")
      .select("id, event_type, created_at, doc_id, meta_json")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setErr(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(data || []);
    setLoading(false);
  }, [sb]);

  /**
   * Initial load + lightweight polling while testing.
   * We schedule the first call via setTimeout to avoid
   * "setState in effect" linter warnings.
   */
  useEffect(() => {
    let cancelled = false;

    const kickOff = () => {
      if (!cancelled) void load();
    };

    const t0 = setTimeout(kickOff, 0);
    const interval = setInterval(kickOff, 3000);

    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [load]);

async function exportCsv() {
  try {
    const res = await fetch("/api/insights/export");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "insights.csv";
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert("Failed to export CSV");
  }
}


  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Insights</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => void load()}
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
          >
            Refresh
          </button>
          <button
            onClick={exportCsv}
            style={{ border: "1px solid #ccc", borderRadius: 8, padding: "8px 12px", cursor: "pointer" }}
          >
            Export CSV
          </button>
        </div>
      </header>

      {loading && <div style={{ marginTop: 12, opacity: 0.7 }}>Loading…</div>}
      {err && (
        <div style={{ marginTop: 12, color: "#B00020" }}>
          Error: {err}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>When</th>
            <th style={{ textAlign: "left", padding: 8 }}>Type</th>
            <th style={{ textAlign: "left", padding: 8 }}>Doc</th>
            <th style={{ textAlign: "left", padding: 8 }}>Meta</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 12, color: "#777" }}>No events yet</td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{new Date(r.created_at).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{r.event_type}</td>
                <td style={{ padding: 8, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                  {r.doc_id ?? "—"}
                </td>
                <td style={{ padding: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 420 }}>
                  {safePreview(r.meta_json)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/** Render a short, safe preview of meta_json */
function safePreview(obj: Record<string, unknown> | null | undefined): string {
  try {
    if (!obj) return "—";
    const s = JSON.stringify(obj);
    return s.length > 120 ? s.slice(0, 117) + "…" : s;
  } catch {
    return "—";
  }
}
