"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Doc = {
  id: string;
  owner_id: string;
  title: string;
  status: "draft" | "shared" | "signed" | "archived";
  created_at: string;
};

type Version = {
  doc_id: string;
  number: number;
  content_url: string;
};

type Row = {
  id: string;
  title: string;
  status: Doc["status"];
  created_at: string;
  version?: Version;
};

export default function VaultPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 1) Load current user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await sb.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        setErr(error?.message || "Not signed in");
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  // 2) Load docs and latest versions for this user
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      const { data: docs, error: docsErr } = await sb
        .from("documents")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (docsErr) {
        setErr(docsErr.message);
        setRows([]);
        setLoading(false);
        return;
      }

      if (!docs || docs.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const docIds = docs.map((d) => d.id);

      const { data: versions, error: vErr } = await sb
        .from("versions")
        .select("doc_id, number, content_url")
        .in("doc_id", docIds)
        .order("number", { ascending: false });

      if (cancelled) return;

      if (vErr) {
        setErr(vErr.message);
        setRows(
          (docs as Doc[]).map((d) => ({
            id: d.id,
            title: d.title,
            status: d.status,
            created_at: d.created_at,
          }))
        );
        setLoading(false);
        return;
      }

      const latestByDoc = new Map<string, Version>();
      (versions || []).forEach((v) => {
        if (!latestByDoc.has(v.doc_id)) latestByDoc.set(v.doc_id, v as Version);
      });

      const merged: Row[] = (docs as Doc[]).map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        created_at: d.created_at,
        version: latestByDoc.get(d.id),
      }));

      setRows(merged);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [sb, userId]);

  // 3) Log event helper
  async function logEvent(
    docId: string,
    userId: string,
    type: "view" | "download",
    meta: Record<string, any> = {}
  ) {
    const { error } = await sb.from("events").insert({
      doc_id: docId,
      event_type: type,
      actor: userId,
      meta_json: meta,
    });
    if (error) console.warn("Failed to log event:", error.message);
  }

  // 4) Actions
  async function onView(row: Row) {
    if (!row.version || !row.version.content_url || !userId) return;
    await logEvent(row.id, userId, "view", { from: "vault" });
    window.open(row.version.content_url, "_blank", "noopener,noreferrer");
  }

  async function onDownload(row: Row) {
    if (!row.version || !row.version.content_url || !userId) return;
    await logEvent(row.id, userId, "download", { from: "vault" });
    const a = document.createElement("a");
    a.href = row.version.content_url;
    a.download = row.title || "document";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Create link with API-first, client-insert fallback
  async function onCreateLink(row: Row) {
    try {
      const res = await fetch("/api/shares/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: row.id }),
      });

      const text = await res.text();
      let j: any = null;
      try {
        j = JSON.parse(text);
      } catch {
        throw new Error(`API ${res.status} returned non-JSON: ${text.slice(0, 200)}`);
      }

      if (!j?.ok || !j?.id) {
        throw new Error(j?.error || "Unknown API error");
      }

      window.open(`/share/${j.id}`, "_blank", "noopener,noreferrer");
    } catch (apiErr: any) {
      console.warn("Share API failed, falling back to client insert:", apiErr?.message || apiErr);

      // Fallback: insert directly via Supabase (OK for Week-1, RLS OFF)
      const { data, error } = await sb
        .from("shares")
        .insert({ doc_id: row.id, created_by: userId, access: "public" })
        .select("id")
        .single();

      if (error || !data?.id) {
        alert("Failed to create link (fallback): " + (error?.message || "unknown error"));
        return;
      }
      window.open(`/share/${data.id}`, "_blank", "noopener,noreferrer");
    }
  }

  // 5) UI
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vault</h1>
        <Link
          href="/(protected)/builder"
          className="px-3 py-2 rounded-xl border hover:bg-gray-50"
        >
          + New Document
        </Link>
      </header>

      {loading && (
        <div className="text-sm text-gray-500">Loading your documents…</div>
      )}

      {!loading && err && (
        <div className="text-sm text-red-600">Error: {err}</div>
      )}

      {!loading && !err && rows && rows.length === 0 && (
        <div className="rounded-xl border p-8 text-center text-gray-600">
          <div className="text-lg font-medium mb-2">Your Vault is empty</div>
          <div className="mb-4">
            Create your first document in the Builder, then it will appear here.
          </div>
          <Link
            href="/(protected)/builder"
            className="inline-block px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            Go to Builder
          </Link>
        </div>
      )}

      {!loading && !err && rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Version</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{r.title}</td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                  <td className="px-4 py-3">
                    {r.version ? `v${r.version.number}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                      onClick={() => onView(r)}
                      disabled={!r.version?.content_url}
                    >
                      View
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                      onClick={() => onDownload(r)}
                      disabled={!r.version?.content_url}
                    >
                      Download
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                      onClick={() => onCreateLink(r)}
                    >
                      Create link
                    </button>
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
