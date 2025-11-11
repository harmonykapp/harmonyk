"use client";

import DriveRecent from "@/components/workbench/DriveRecent";
import { useCallback, useEffect, useState, useTransition } from "react";
import { analyzeRowAction } from "./actions";

type Row = {
  id: string;
  title: string;
  source: "Drive" | "Gmail";
  kind?: string;
  owner?: string;
  modified?: string;
  preview?: string;
};

type Analysis =
  | {
    ok: true;
    triage?: {
      priority?: "low" | "medium" | "high";
      label?: string;
      suggestedAction?: string;
    };
    analysis?: {
      summary?: string;
      entities?: string[];
      dates?: string[];
    };
    raw?: unknown;
  }
  | { ok: false; reason?: string; raw?: unknown };

// Safe UUID helper
function uuid() {
  return globalThis.crypto?.randomUUID?.()
    ?? Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

function normalizeToAnalysis(raw: unknown): Analysis {
  if (raw && typeof raw === "object") {
    const r = raw as any;
    if ("ok" in r) return r as Analysis;
    if (r.error) return { ok: false, reason: String(r.error), raw };
    return { ok: true, triage: r.triage, analysis: r.analysis, raw };
  }
  return { ok: false, reason: "Invalid AI result", raw };
}

export default function WorkbenchPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<Row | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(async () => {
    setLoading(true);
    let driveConnected = false;
    try {
      const s = await fetch("/api/integrations/status", { cache: "no-store" }).then((r) => r.json());
      driveConnected = (s?.googleDrive ?? "unknown") === "connected";
    } catch {
      driveConnected = false;
    }

    const now = new Date();
    const fmt = (d: Date) =>
      new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(d);

    const sample: Row[] = [
      {
        id: uuid(),
        title: "NDA — ACME & Monolyth",
        source: "Drive",
        kind: "application/pdf",
        owner: driveConnected ? "you@demo" : "—",
        modified: fmt(now),
        preview: "Mutual NDA between parties outlining confidentiality and use of information…"
      },
      {
        id: uuid(),
        title: "Signed Proposal — Q4",
        source: "Gmail",
        kind: "message/rfc822",
        owner: "inbox",
        modified: fmt(new Date(now.getTime() - 3600_000)),
        preview: "Subject: Re: Proposal — Looks good, proceed to signature this week…"
      },
      {
        id: uuid(),
        title: "MSA — VendorX (draft v3)",
        source: "Drive",
        kind: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        owner: driveConnected ? "you@demo" : "—",
        modified: fmt(new Date(now.getTime() - 86400_000)),
        preview: "Master Services Agreement draft covering scope, IP, payment terms…"
      }
    ];

    setRows(sample);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) void load();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [load]);

  function onAnalyze(r: Row) {
    setSel(r);
    setResult(null);
    startTransition(async () => {
      const raw = await analyzeRowAction({
        title: r.title,
        source: r.source,
        kind: r.kind,
        owner: r.owner,
        modified: r.modified,
        preview: r.preview
      });
      setResult(normalizeToAnalysis(raw));
    });
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Workbench</h1>
        <div style={{ marginLeft: "auto", opacity: 0.7 }}>
          {loading ? "Loading…" : `${rows.length} items`}
        </div>
      </header>

      {/* Drive - Recent (RO) panel */}
      <section style={{ marginBottom: 20 }}>
        <DriveRecent />
      </section>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "#f9f9f9" }}>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Title</th>
            <th style={{ textAlign: "left", padding: 8 }}>Source</th>
            <th style={{ textAlign: "left", padding: 8 }}>Kind</th>
            <th style={{ textAlign: "left", padding: 8 }}>Owner</th>
            <th style={{ textAlign: "left", padding: 8 }}>Modified</th>
            <th style={{ textAlign: "left", padding: 8 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: 12, color: "#777" }}>
                No items yet
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div
                    style={{
                      fontSize: 12,
                      opacity: 0.75,
                      maxWidth: 560,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                    title={r.preview}
                  >
                    {r.preview ?? "—"}
                  </div>
                </td>
                <td style={{ padding: 8 }}>{r.source}</td>
                <td style={{ padding: 8 }}>{r.kind ?? "—"}</td>
                <td style={{ padding: 8 }}>{r.owner ?? "—"}</td>
                <td style={{ padding: 8 }}>{r.modified ?? "—"}</td>
                <td style={{ padding: 8 }}>
                  <button
                    onClick={() => onAnalyze(r)}
                    disabled={isPending}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: 8,
                      padding: "6px 12px",
                      cursor: "pointer"
                    }}
                  >
                    {isPending && sel?.id === r.id ? "Analyzing…" : "Analyze"}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Analyze drawer */}
      {sel && (
        <section
          style={{
            marginTop: 20,
            padding: 16,
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            background: "#fafafa"
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 600, margin: 0 }}>Analyze</h2>
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              {sel.source} • {sel.kind || "—"}
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={() => {
                  setSel(null);
                  setResult(null);
                }}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>

          {!result && (
            <div style={{ marginTop: 12, opacity: 0.7 }}>
              {isPending ? "Running AI…" : "Waiting for result…"}
            </div>
          )}

          {result && result.ok === false && (
            <div style={{ marginTop: 12, color: "#B00020" }}>
              AI error: {result.reason ?? "unknown"}
            </div>
          )}

          {result && result.ok && (
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  Priority / Label / Suggested action
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Badge>{result.triage?.priority ?? "—"}</Badge>
                  <Badge>{result.triage?.label ?? "—"}</Badge>
                  <Badge>{result.triage?.suggestedAction ?? "—"}</Badge>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Summary</div>
                <div>{result.analysis?.summary ?? "—"}</div>
              </div>

              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Entities</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(result.analysis?.entities ?? []).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                    {(result.analysis?.entities?.length ?? 0) === 0 && <li>—</li>}
                  </ul>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Dates</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {(result.analysis?.dates ?? []).map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                    {(result.analysis?.dates?.length ?? 0) === 0 && <li>—</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        border: "1px solid #ddd",
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        background: "#fff"
      }}
    >
      {children}
    </span>
  );
}
