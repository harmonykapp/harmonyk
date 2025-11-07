/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

// sha256 helper for passcode hashing
async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
  const [userReady, setUserReady] = useState(false); // gates action buttons
  const [err, setErr] = useState<string | null>(null);

  // 1) Load current user ASAP
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await sb.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        setUserId(null);
        setUserReady(true);
        setErr(error?.message || null); // don't block UI entirely
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      setUserReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  // 2) Load docs + latest versions for this user
  useEffect(() => {
    if (!userReady) return; // wait until we know user state
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      // If not signed in, show empty state with CTA to builder/signin
      if (!userId) {
        setRows([]);
        setLoading(false);
        return;
      }

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

      if (!docs?.length) {
        setRows([]);
        setLoading(false);
        return;
      }

      const ids = docs.map((d) => d.id);
      const { data: versions, error: vErr } = await sb
        .from("versions")
        .select("doc_id, number, content_url")
        .in("doc_id", ids)
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

      const latest = new Map<string, Version>();
      (versions || []).forEach((v) => {
        if (!latest.has(v.doc_id)) latest.set(v.doc_id, v as Version);
      });

      const merged: Row[] = (docs as Doc[]).map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
        created_at: d.created_at,
        version: latest.get(d.id),
      }));

      setRows(merged);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, userId, userReady]);

  // events
  async function logEvent(
    docId: string,
    type: "view" | "download" | "share_created",
    meta: Record<string, any> = {}
  ) {
    if (!userId) return;
    const { error } = await sb.from("events").insert({
      doc_id: docId,
      event_type: type,
      actor: userId,
      meta_json: meta,
    });
    if (error) console.warn("Failed to log event:", error.message);
  }

  // helper: ensure we really have a user id before inserting NOT NULL uuid
  async function ensureUserId(): Promise<string | null> {
    if (userId) return userId;
    const { data } = await sb.auth.getUser();
    if (data?.user?.id) {
      setUserId(data.user.id);
      return data.user.id;
    }
    return null;
  }

  // actions
  async function onView(r: Row) {
    if (!r.version?.content_url) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "view", { from: "vault" });
    window.open(r.version.content_url, "_blank", "noopener,noreferrer");
  }

  async function onDownload(r: Row) {
    if (!r.version?.content_url) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "download", { from: "vault" });
    const a = document.createElement("a");
    a.href = r.version.content_url;
    a.download = r.title || "document";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function onCreateLink(r: Row) {
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    const { data, error } = await sb
      .from("shares")
      .insert({ doc_id: r.id, created_by: uid, access: "public" })
      .select("id")
      .single();

    if (error || !data?.id) {
      alert("Failed to create link: " + (error?.message || "unknown error"));
      return;
    }
    await logEvent(r.id, "share_created", { share_id: data.id, access: "public", from: "vault" });
    window.open(`/share/${data.id}`, "_blank", "noopener,noreferrer");
  }

  async function onCreatePasscodeLink(r: Row) {
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    const pass = prompt("Set a passcode for this link:");
    if (!pass) return;
    const hash = await sha256Hex(pass);

    const { data, error } = await sb
      .from("shares")
      .insert({ doc_id: r.id, created_by: uid, access: "passcode", passcode_hash: hash })
      .select("id")
      .single();

    if (error || !data?.id) {
      alert("Failed to create passcode link: " + (error?.message || "unknown error"));
      return;
    }
    await logEvent(r.id, "share_created", { share_id: data.id, access: "passcode", from: "vault" });
    window.open(`/share/${data.id}`, "_blank", "noopener,noreferrer");
  }

  // UI
  const actionsDisabled = !userReady || !userId;

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vault</h1>
        <Link href="/(protected)/builder" className="px-3 py-2 rounded-xl border hover:bg-gray-50">
          + New Document
        </Link>
      </header>

      {loading && <div className="text-sm text-gray-500">Loading your documents…</div>}
      {!loading && err && <div className="text-sm text-red-600">Error: {err}</div>}

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
                  <td className="px-4 py-3">{r.version ? `v${r.version.number}` : "—"}</td>
                  <td className="px-4 py-3">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                      onClick={() => onView(r)}
                      disabled={actionsDisabled || !r.version?.content_url}
                    >
                      View
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                      onClick={() => onDownload(r)}
                      disabled={actionsDisabled || !r.version?.content_url}
                    >
                      Download
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                      onClick={() => onCreateLink(r)}
                      disabled={actionsDisabled}
                    >
                      Create link
                    </button>
                    <button
                      className="px-3 py-1 rounded-lg border hover:bg-gray-50"
                      onClick={() => onCreatePasscodeLink(r)}
                      disabled={actionsDisabled}
                    >
                      Create passcode link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {actionsDisabled && (
            <div className="p-3 text-xs text-gray-500">
              Note: actions are disabled until your sign-in is detected. If this persists, open{" "}
              <code>/signin</code>, sign in, then refresh this page.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
