"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { readVaultDocs } from "@/lib/vault-local";
import { FileText } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

type PageProps = { params: Promise<{ id: string }> };

type SupabaseAuthUser = { id: string };
type SupabaseAuthResult = { data: { user: SupabaseAuthUser | null }; error: unknown | null };
type SupabaseSessionResult = {
  data: { session: { access_token: string | null } | null };
  error: unknown | null;
};

type SupabaseSingleResult<T> = { data: T | null; error: unknown | null };
type SupabaseListResult<T> = { data: T[] | null; error: unknown | null };
type SupabaseQuery<T> = {
  eq: (column: string, value: string) => SupabaseQuery<T>;
  order: (column: string, options: { ascending: boolean }) => SupabaseQuery<T>;
  limit: (count: number) => Promise<SupabaseListResult<T>>;
  maybeSingle: () => Promise<SupabaseSingleResult<T>>;
};

type SupabaseClientLike = {
  auth: {
    getUser: () => Promise<SupabaseAuthResult>;
    getSession: () => Promise<SupabaseSessionResult>;
  };
  from: <T>(table: string) => {
    select: (columns: string) => SupabaseQuery<T>;
  };
};

type DocRow = {
  id: string;
  title: string;
  kind?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  org_id?: string | null;
  owner_id?: string | null;
  current_version_id?: string | null;
};

type VersionRow = {
  document_id: string;
  number: number;
  content: string;
  created_at: string;
};

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function VaultDocPage({ params }: PageProps) {
  const { id } = use(params);
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  const sbClient = sb as unknown as SupabaseClientLike;

  const [userId, setUserId] = useState<string | null>(null);
  const [userReady, setUserReady] = useState(false);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [doc, setDoc] = useState<DocRow | null>(null);
  const [latest, setLatest] = useState<VersionRow | null>(null);
  const [source, setSource] = useState<"supabase" | "local" | "none">("none");

  // 1) Load current user (mirrors Vault behavior: fall back to demo user)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await sbClient.auth.getUser();
        if (cancelled) return;
        if (!data?.user?.id) {
          setUserId(DEMO_OWNER_ID);
          setUserReady(true);
          return;
        }
        setUserId(data.user.id);
        setUserReady(true);
      } catch {
        if (cancelled) return;
        setUserId(DEMO_OWNER_ID);
        setUserReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sbClient]);

  // 2) Load doc (Supabase first). If missing, fall back to local Vault index (title only).
  useEffect(() => {
    if (!userReady || !userId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);
      setDoc(null);
      setLatest(null);
      setSource("none");

      const uid = userId;

      // Try Supabase doc + latest version
      try {
        const { data: d, error: dErr } = await sbClient
          .from<DocRow>("document")
          .select("id,title,kind,status,created_at,updated_at,org_id,owner_id,current_version_id")
          .eq("id", id)
          .eq("owner_id", uid)
          .maybeSingle();

        if (!cancelled && !dErr && d) {
          setDoc(d);
          setSource("supabase");

          const { data: v, error: vErr } = await sbClient
            .from<VersionRow>("version")
            .select("document_id,number,content,created_at")
            .eq("document_id", id)
            .order("number", { ascending: false })
            .limit(1);

          if (!cancelled && !vErr && Array.isArray(v) && v.length > 0) {
            setLatest(v[0]);
          }

          setLoading(false);
          return;
        }
      } catch (e) {
        // keep going to local fallback
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load document.");
      }

      // Local fallback (title only; content not available)
      const local = readVaultDocs();
      const found = local.find((x) => x.id === id) ?? null;
      if (found) {
        setDoc({
          id: found.id,
          title: found.title,
          kind: null,
          status: null,
          created_at: null,
          updated_at: found.updatedAt ?? null,
          org_id: null,
          owner_id: null,
          current_version_id: null,
        });
        setSource("local");
        setLoading(false);
        return;
      }

      setSource("none");
      setLoading(false);
      setErr((prev) => prev ?? "Document not found.");
    })();

    return () => {
      cancelled = true;
    };
  }, [id, userId, userReady, sbClient]);

  async function onView() {
    if (!doc || !latest?.content) return;

    // Decks: use export route
    if (doc.kind === "deck") {
      const exportUrl = `/api/decks/${doc.id}/export`;
      window.open(exportUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Other docs: render markdown-ish as HTML (same light approach as Vault list page)
    let content = latest.content;
    const metadataMatch = content.match(/<!-- MONO_[A-Z_]+:({.*?}) -->\s*\n*/s);
    if (metadataMatch) content = content.replace(metadataMatch[0], "");

    let html = content
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^\* (.*$)/gim, "<li>$1</li>")
      .replace(/^- (.*$)/gim, "<li>$1</li>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, "<code>$1</code>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    html = html.replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>");
    html = "<p>" + html + "</p>";

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title || "Document"}</title>
  <style>
    body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif; line-height:1.6; max-width:900px; margin:0 auto; padding:2rem; color:#333; }
    h1 { font-size:2rem; margin-top:2rem; margin-bottom:1rem; border-bottom:2px solid #ddd; padding-bottom:.5rem; }
    h2 { font-size:1.5rem; margin-top:1.5rem; margin-bottom:.75rem; color:#555; }
    h3 { font-size:1.25rem; margin-top:1.25rem; margin-bottom:.5rem; }
    p { margin:1rem 0; }
    ul,ol { margin:1rem 0; padding-left:2rem; }
    code { background:#f5f5f5; padding:.2rem .4rem; border-radius:3px; font-family:"Courier New",monospace; font-size:.9em; }
    pre { background:#f5f5f5; padding:1rem; border-radius:4px; overflow-x:auto; }
  </style>
</head>
<body>
  <h1>${doc.title || "Document"}</h1>
  ${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 250);
  }

  async function onDownload() {
    if (!doc || !latest?.content) return;
    const blob = new Blob([latest.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title || "document"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 250);
  }

  async function onCreatePasscodeLink() {
    if (!doc) return;
    const pass = prompt("Set a passcode for this link:");
    if (!pass) return;
    const passcodeHash = await sha256Hex(pass);

    const { data: sessionData } = await sbClient.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      alert("No session access token found. Please sign in again.");
      return;
    }

    const response = await fetch("/api/shares/create", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        documentId: doc.id,
        versionId: doc.current_version_id ?? null,
        requireEmail: true,
        passcodeHash,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!response.ok || !payload.url) {
      alert(payload.error || "Failed to create passcode link.");
      return;
    }
    window.open(payload.url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="p-6">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </Card>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Card className="p-6">
          <div className="font-medium">Document not found</div>
          <div className="mt-2 text-sm text-muted-foreground">{err ?? "This Vault document isn't available."}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/vault">Back to Vault</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const updated = safeDate(doc.updated_at) ?? safeDate(doc.created_at);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid gap-3">
        <Card className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[280px]">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold">{doc.title}</div>
                <Badge variant="secondary" className="rounded-md">
                  Vault
                </Badge>
                {doc.kind ? <Badge variant="outline">{doc.kind}</Badge> : null}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Doc ID: {doc.id}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Source: {source === "supabase" ? "Cloud" : source === "local" ? "Local" : "—"}</span>
                {updated ? <span>• Updated {updated.toLocaleString()}</span> : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/vault">Back</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/builder?docId=${encodeURIComponent(doc.id)}`}>Open in Builder</Link>
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">Actions</div>
            {latest?.content ? (
              <Badge variant="outline" className="text-xs">
                v{latest.number}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                No content
              </Badge>
            )}
          </div>

          {source === "local" ? (
            <div className="mt-2 text-sm text-muted-foreground">
              This doc is only available in the local Vault index (title only). Sign in / sync to view content.
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" onClick={onView} disabled={!latest?.content}>
              View
            </Button>
            <Button variant="outline" onClick={onDownload} disabled={!latest?.content}>
              Download
            </Button>
            <Button variant="outline" onClick={onCreatePasscodeLink} disabled={source !== "supabase"}>
              Passcode link
            </Button>
          </div>

          {!latest?.content ? (
            <div className="mt-3 flex items-start gap-3 rounded-md border p-3">
              <div className="mt-0.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">No version content available</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  If this should exist, open the Vault list page and confirm the document has a saved version.
                </div>
                <div className="mt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href="/vault">Open Vault list</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
