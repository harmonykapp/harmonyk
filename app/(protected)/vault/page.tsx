"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { phCapture } from "@/lib/posthog-client";
import { TEMPLATES } from "@/data/templates";
import { getAppUrl } from "@/lib/env";

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
  template_id?: string | null;
};

type Version = {
  doc_id: string;
  number: number;
  content_url: string | null;
  created_at: string;
};

type Row = {
  id: string;
  title: string;
  templateId?: string | null;
  created_at: string;
  updated_at: string;
  versionCount: number;
  latestVersion?: Version;
};

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

type EventMeta = Record<string, string | number | boolean | null>;

export default function VaultPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userReady, setUserReady] = useState(false); // gates action buttons
  const [err, setErr] = useState<string | null>(null);

  const templateNameMap = useMemo(() => {
    const map = new Map<string, string>();
    TEMPLATES.forEach((template) => map.set(template.id, template.name));
    return map;
  }, []);

  // 1) Load current user ASAP
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await sb.auth.getUser();
      if (cancelled) return;
      if (error || !data.user) {
        setUserId(DEMO_OWNER_ID);
        setUserReady(true);
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
        .order("created_at", { ascending: false })
        .returns<Doc[]>();

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
        .select("doc_id, number, content_url, created_at")
        .in("doc_id", ids)
        .order("number", { ascending: false })
        .returns<Version[]>();

      if (cancelled) return;

      if (vErr) {
        setErr(vErr.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const info = new Map<
        string,
        { latest?: Version; count: number; updatedAt: string }
      >();

      versions?.forEach((v) => {
        const current = info.get(v.doc_id) ?? { latest: undefined, count: 0, updatedAt: "" };
        current.count += 1;
        if (!current.latest || v.number > current.latest.number) {
          current.latest = v;
        }
        if (!current.updatedAt || new Date(v.created_at) > new Date(current.updatedAt)) {
          current.updatedAt = v.created_at;
        }
        info.set(v.doc_id, current);
      });

      const merged: Row[] = (docs ?? []).map((d) => {
        const meta = info.get(d.id) ?? { latest: undefined, count: 0, updatedAt: d.created_at };
        return {
          id: d.id,
          title: d.title,
          templateId: d.template_id ?? null,
          created_at: d.created_at,
          updated_at: meta.updatedAt ?? d.created_at,
          versionCount: meta.count,
          latestVersion: meta.latest,
        };
      });

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
    meta?: EventMeta
  ) {
    if (!userId) return;
    const metaPayload: EventMeta = meta ? { from: "vault", ...meta } : { from: "vault" };
    const { error } = await sb.from("events").insert({
      doc_id: docId,
      event_type: type,
      actor: userId,
      meta_json: metaPayload,
    });
    if (error) console.warn("Failed to log event:", error.message);
  }

  // helper: ensure we really have a user id before inserting NOT NULL uuid
  async function ensureUserId(): Promise<string> {
    if (userId) return userId;
    const { data } = await sb.auth.getUser();
    if (data?.user?.id) {
      setUserId(data.user.id);
      return data.user.id;
    }
    setUserId(DEMO_OWNER_ID);
    return DEMO_OWNER_ID;
  }

  // actions
  async function onView(r: Row) {
    if (!r.latestVersion?.content_url) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "view");
    phCapture("vault_view_doc", { docId: r.id });
    window.open(r.latestVersion.content_url, "_blank", "noopener,noreferrer");
  }

  async function onDownload(r: Row) {
    if (!r.latestVersion?.content_url) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "download");
    phCapture("vault_download_doc", { docId: r.id });
    const a = document.createElement("a");
    a.href = r.latestVersion.content_url;
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
    await logEvent(r.id, "share_created", { share_id: data.id, access: "public" });
    phCapture("vault_share_created", { docId: r.id, shareId: data.id, access: "public" });
    const shareUrl = `${getAppUrl()}/share/${data.id}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
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
    await logEvent(r.id, "share_created", { share_id: data.id, access: "passcode" });
    phCapture("vault_share_created", { docId: r.id, shareId: data.id, access: "passcode" });
    const shareUrl = `${getAppUrl()}/share/${data.id}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  function openDoc(docId: string) {
    phCapture("vault_open_builder", { docId });
    router.push(`/builder?docId=${docId}`);
  }

  // UI
  const actionsDisabled = !userReady || !userId;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Documents</p>
          <h1>Vault</h1>
          <p className="text-secondary">Stored drafts, versions, and sharing actions.</p>
        </div>
        <Link href="/builder" className="btn btn-primary">
          New from Builder
        </Link>
      </div>

      {loading && <div className="text-secondary">Loading your documents…</div>}
      {!loading && err && <div className="text-secondary">Error: {err}</div>}

      {!loading && !err && rows && rows.length === 0 && (
        <div className="card text-secondary" style={{ textAlign: "center" }}>
          <div className="section-title">Your Vault is empty</div>
          <p>Create your first document in the Builder, then it will appear here.</p>
        </div>
      )}

      {!loading && !err && rows && rows.length > 0 && (
        <div className="card">
          <div className="section-title">Documents</div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Template</th>
                  <th>Updated</th>
                  <th>Versions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.templateId ? templateNameMap.get(r.templateId) ?? "—" : "—"}</td>
                    <td>{new Date(r.updated_at).toLocaleString()}</td>
                    <td>{r.versionCount ? `v${r.versionCount}` : "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button className="btn btn-secondary" onClick={() => openDoc(r.id)}>
                          Open in Builder
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => onView(r)}
                          disabled={actionsDisabled || !r.latestVersion?.content_url}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => onDownload(r)}
                          disabled={actionsDisabled || !r.latestVersion?.content_url}
                        >
                          Download
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => onCreateLink(r)}
                          disabled={actionsDisabled}
                        >
                          Share
                        </button>
                        <button
                          className="btn btn-ghost"
                          onClick={() => onCreatePasscodeLink(r)}
                          disabled={actionsDisabled}
                        >
                          Passcode link
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {actionsDisabled && (
            <p className="text-secondary" style={{ marginTop: 12 }}>
              Actions are disabled until your sign-in is detected. If this persists, open{" "}
              <code>/signin</code>, sign in, then refresh this page.
            </p>
          )}
        </div>
      )}

    </div>
  );
}
