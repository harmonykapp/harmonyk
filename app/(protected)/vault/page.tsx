"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { phCapture } from "@/lib/posthog-client";
import { TEMPLATES } from "@/data/templates";
import { logBuilderEvent } from "@/lib/telemetry/builder";
import type { Document, Version } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileText,
  Search,
  Folder,
  Star,
  Clock,
  Users,
  FileSignature,
  Archive,
  ChevronRight,
  MoreVertical,
  Upload,
  Download,
  Trash2,
  Eye,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { handleApiError } from "@/lib/handle-api-error";
import { isFeatureEnabled } from "@/lib/feature-flags";

// sha256 helper for passcode hashing
async function sha256Hex(text: string) {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}

type VersionSummary = Pick<Version, "document_id" | "number" | "content" | "created_at">;

type Row = {
  id: string;
  title: string;
  kind?: string | null;
  templateId?: string | null;
  created_at: string;
  updated_at: string;
  versionCount: number;
  latestVersion?: VersionSummary;
};

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

type EventMeta = Record<string, string | number | boolean | null>;

const folders = [
  { icon: Star, label: 'Starred', count: 0, color: 'text-yellow-600' },
  { icon: Clock, label: 'Recent', count: 0, color: 'text-blue-600' },
  { icon: Users, label: 'Shared with me', count: 0, color: 'text-green-600' },
  { icon: FileSignature, label: 'Signed Documents', count: 0, color: 'text-purple-600' },
  { icon: Archive, label: 'Archived', count: 0, color: 'text-gray-600' },
];

export default function VaultPage() {
  const vaultExperimental = isFeatureEnabled("FEATURE_VAULT_EXPERIMENTAL_ACTIONS");
  const { toast } = useToast();
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userReady, setUserReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const templateNameMap = useMemo(() => {
    const map = new Map<string, string>();
    TEMPLATES.forEach((template) => map.set(template.id, template.name));
    return map;
  }, []);

  // 1) Load current user ASAP
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await sb.auth.getUser();
        if (cancelled) return;
        if (error || !data.user) {
          setUserId(DEMO_OWNER_ID);
          setUserReady(true);
          return;
        }
        setUserId(data.user.id);
        setUserReady(true);
      } catch (err) {
        if (cancelled) return;
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
        if (status === 401 || status === 403) {
          handleApiError({
            status,
            errorMessage,
            toast,
            context: "vault",
          });
        } else {
          // Silently fall back to demo user for non-auth errors
          console.warn("[vault] Error loading user, using demo user", err);
        }
        setUserId(DEMO_OWNER_ID);
        setUserReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, toast]);

  // 2) Load docs + latest versions for this user
  // Save-to-Vault inserts into this document table with matching owner/org/status, so newly saved docs for the current user/org appear here.
  useEffect(() => {
    if (!userReady) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);

      if (!userId) {
        setRows([]);
        setLoading(false);
        return;
      }

      const { data: docs, error: docsErr } = await sb
        .from("document")
        .select("id, org_id, owner_id, title, kind, status, created_at, updated_at, current_version_id")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .returns<Document[]>();

      if (cancelled) return;

      if (docsErr) {
        const errorMessage = docsErr.message;
        const status = errorMessage.includes("401") || docsErr.code === "PGRST301" || docsErr.code === "42501" ? 401 : 500;
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        setErr(errorMessage);
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
        .from("version")
        .select("document_id, number, content, created_at")
        .in("document_id", ids)
        .order("number", { ascending: false })
        .returns<Pick<Version, "document_id" | "number" | "content" | "created_at">[]>();

      if (cancelled) return;

      if (vErr) {
        const errorMessage = vErr.message;
        const status = errorMessage.includes("401") || vErr.code === "PGRST301" || vErr.code === "42501" ? 401 : 500;
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        setErr(errorMessage);
        setRows([]);
        setLoading(false);
        return;
      }

      const info = new Map<
        string,
        { latest?: VersionSummary; count: number; updatedAt: string }
      >();

      versions?.forEach((v) => {
        const current = info.get(v.document_id) ?? { latest: undefined, count: 0, updatedAt: "" };
        current.count += 1;
        if (!current.latest || v.number > current.latest.number) {
          current.latest = v;
        }
        if (!current.updatedAt || new Date(v.created_at) > new Date(current.updatedAt)) {
          current.updatedAt = v.created_at;
        }
        info.set(v.document_id, current);
      });

      const merged: Row[] = (docs ?? []).map((d) => {
        const meta = info.get(d.id) ?? { latest: undefined, count: 0, updatedAt: d.created_at };
        return {
          id: d.id,
          title: d.title,
          kind: d.kind ?? null,
          templateId: null,
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
  }, [sb, userId, userReady, toast]);

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
    if (!r.latestVersion?.content) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "view");
    phCapture("vault_view_doc", { docId: r.id });

    // For decks, use the export route which renders HTML properly
    if (r.kind === "deck") {
      const exportUrl = `/api/decks/${r.id}/export`;
      window.open(exportUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // For other documents, render markdown as HTML
    // Strip metadata comments if present
    let content = r.latestVersion.content;
    const metadataMatch = content.match(/<!-- MONO_[A-Z_]+:({.*?}) -->\s*\n*/s);
    if (metadataMatch) {
      content = content.replace(metadataMatch[0], "");
    }

    // Simple markdown to HTML conversion (basic rendering)
    // Convert headers, lists, code blocks, etc.
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

    // Wrap lists
    html = html.replace(/(<li>.*?<\/li>)/g, "<ul>$1</ul>");
    html = "<p>" + html + "</p>";

    // Create full HTML document
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${r.title || "Document"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
    }
    h1 { font-size: 2rem; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 2px solid #ddd; padding-bottom: 0.5rem; }
    h2 { font-size: 1.5rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #555; }
    h3 { font-size: 1.25rem; margin-top: 1.25rem; margin-bottom: 0.5rem; }
    p { margin: 1rem 0; }
    ul, ol { margin: 1rem 0; padding-left: 2rem; }
    code { background: #f5f5f5; padding: 0.2rem 0.4rem; border-radius: 3px; font-family: "Courier New", monospace; font-size: 0.9em; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${r.title || "Document"}</h1>
  ${html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function onDownload(r: Row) {
    if (!r.latestVersion?.content) return;
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    await logEvent(r.id, "download");
    phCapture("vault_download_doc", { docId: r.id });

    // For decks, use the export route
    if (r.kind === "deck") {
      const exportUrl = `/api/decks/${r.id}/export`;
      window.open(exportUrl, "_blank", "noopener,noreferrer");
      toast({
        title: "Export opened",
        description: "Use your browser's print function (Ctrl+P / Cmd+P) to save as PDF.",
      });
      return;
    }

    // For other documents, download as markdown
    const blob = new Blob([r.latestVersion.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.title || "document"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  async function onCreateLink(r: Row) {
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }

    const { data: doc } = await sb
      .from("document")
      .select("current_version_id")
      .eq("id", r.id)
      .single();

    try {
      const response = await fetch("/api/shares/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: r.id,
          versionId: doc?.current_version_id ?? null,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        let payload: { id?: string; url?: string; error?: string } = {};
        let errorMessage = "Failed to create share link";
        
        try {
          const text = await response.text();
          if (text) {
            try {
              payload = JSON.parse(text) as { id?: string; url?: string; error?: string };
              errorMessage = payload?.error || errorMessage;
            } catch {
              // If JSON parse fails, use the text as error message
              errorMessage = text || errorMessage;
            }
          }
        } catch {
          // If response.text() fails, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        return;
      }

      const payload = (await response.json()) as {
        id?: string;
        url?: string;
        error?: string;
      };

      if (!payload.url) {
        toast({
          title: "Something went wrong",
          description: "We couldn't complete that action. Please try again.",
          variant: "destructive",
        });
        console.error("[vault] Share link created but no URL returned", payload);
        return;
      }

      phCapture("vault_share_created", { docId: r.id, shareId: payload.id, access: "public" });
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown error";
      const isAuthError = errorMessage.includes("Authentication required") || 
                         errorMessage.includes("401") || 
                         errorMessage.includes("403");
      
      const status = isAuthError ? 401 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "vault",
      });
    }
  }

  async function onCreatePasscodeLink(r: Row) {
    const uid = await ensureUserId();
    if (!uid) {
      alert("Please sign in again.");
      return;
    }
    const pass = prompt("Set a passcode for this link:");
    if (!pass) return;

    const { data: doc } = await sb
      .from("document")
      .select("current_version_id")
      .eq("id", r.id)
      .single();

    try {
      const response = await fetch("/api/shares/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: r.id,
          versionId: doc?.current_version_id ?? null,
          requireEmail: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        let payload: { id?: string; url?: string; error?: string } = {};
        try {
          payload = await response.json();
        } catch {
          // Ignore JSON parse errors
        }
        
        const errorMessage = payload?.error || "Failed to create passcode link";
        
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "vault",
        });
        return;
      }

      const payload = (await response.json()) as {
        id?: string;
        url?: string;
        error?: string;
      };

      if (!payload.url) {
        toast({
          title: "Something went wrong",
          description: "We couldn't complete that action. Please try again.",
          variant: "destructive",
        });
        console.error("[vault] Passcode link created but no URL returned", payload);
        return;
      }

      phCapture("vault_share_created", { docId: r.id, shareId: payload.id, access: "passcode" });
      window.open(payload.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "unknown error";
      const isAuthError = errorMessage.includes("Authentication required") || 
                         errorMessage.includes("401") || 
                         errorMessage.includes("403");
      
      const status = isAuthError ? 401 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "vault",
      });
    }
  }

  function openDoc(docId: string) {
    phCapture("vault_open_builder", { docId });
    router.push(`/builder?docId=${docId}`);
  }

  const actionsDisabled = !userReady || !userId;

  // Filter rows based on search
  const filteredRows = rows?.filter((row) => {
    if (!searchQuery) return true;
    return row.title.toLowerCase().includes(searchQuery.toLowerCase());
  }) ?? [];

  const selectedDocument = selectedDoc ? filteredRows.find((doc) => doc.id === selectedDoc) : null;

  // Guard against render-time crashes
  if (rows === null && !loading && !err) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">All Documents</h1>
              <p className="text-muted-foreground mt-1">Loading your documents…</p>
            </div>
            <Link href="/builder">
              <Button>New from Builder</Button>
            </Link>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading your documents…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <div className="w-64 border-r bg-sidebar overflow-auto">
        <div className="p-4 border-b">
          <Link href="/builder">
            <Button className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              New Document
            </Button>
          </Link>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-1">
            {folders.map((folder) => {
              const Icon = folder.icon;
              return (
                <button
                  key={folder.label}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-active/50 transition-colors text-sm"
                >
                  <Icon className={`h-4 w-4 ${folder.color}`} />
                  <span className="flex-1 text-left">{folder.label}</span>
                  <span className="text-xs text-muted-foreground">{folder.count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">All Documents</h1>
              <p className="text-muted-foreground mt-1">
                {loading ? "Loading…" : `${filteredRows.length} documents`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/activity">
                <Button variant="outline" size="sm">View activity</Button>
              </Link>
              <Link href="/builder">
                <Button>New from Builder</Button>
              </Link>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Loading your documents…</p>
          </div>
        )}

        {!loading && err && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-destructive">Error: {err}</p>
          </div>
        )}

        {!loading && !err && filteredRows.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="p-8 text-center max-w-md">
              <div className="space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your Vault is empty</h3>
                  <p className="text-muted-foreground">
                    Create your first document in the Builder, then it will appear here.
                  </p>
                </div>
                <Link href="/builder">
                  <Button>Create Document</Button>
                </Link>
              </div>
            </Card>
        </div>
      )}

        {!loading && !err && filteredRows.length > 0 && (
          <div className="flex-1 flex overflow-hidden">
            <div className={cn('flex-1 overflow-auto p-6', selectedDoc && 'max-w-[60%]')}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRows.map((doc) => (
                  <Card
                    key={doc.id}
                    className={cn(
                      'p-4 cursor-pointer transition-all hover:shadow-md',
                      selectedDoc === doc.id && 'ring-2 ring-primary'
                    )}
                    onClick={() => setSelectedDoc(doc.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {doc.kind === "deck" && (
                              <Badge variant="secondary" className="text-xs">
                                {(() => {
                                  const deckType = doc.latestVersion?.content
                                    ? (() => {
                                        const metadataMatch = doc.latestVersion.content.match(/<!-- MONO_DECK_METADATA:({.*?}) -->/);
                                        if (metadataMatch) {
                                          try {
                                            const metadata = JSON.parse(metadataMatch[1]) as { deck_type?: string };
                                            if (metadata.deck_type === "fundraising") return "Fundraising";
                                            if (metadata.deck_type === "investor_update") return "Investor Update";
                                          } catch {
                                            // Ignore
                                          }
                                        }
                                        return "Deck";
                                      })()
                                    : "Deck";
                                  return `Deck: ${deckType}`;
                                })()}
                              </Badge>
                            )}
                            {doc.templateId && (
                              <span className="text-xs text-muted-foreground">
                                {templateNameMap.get(doc.templateId) ?? "—"}
                              </span>
                            )}
                            {!doc.kind && !doc.templateId && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        </div>
                        {vaultExperimental && (
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                        <span>{doc.versionCount ? `v${doc.versionCount}` : "—"}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {selectedDocument && (
              <div className="w-[40%] border-l bg-card overflow-auto">
                <div className="p-6 space-y-6">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-1 flex-1">
                        <h2 className="text-xl font-semibold">{selectedDocument.title}</h2>
                        <div className="flex items-center gap-2">
                          {selectedDocument.kind === "deck" && (
                            <Badge variant="secondary" className="text-xs">
                              {(() => {
                                const deckType = selectedDocument.latestVersion?.content
                                  ? (() => {
                                      const metadataMatch = selectedDocument.latestVersion.content.match(/<!-- MONO_DECK_METADATA:({.*?}) -->/);
                                      if (metadataMatch) {
                                        try {
                                          const metadata = JSON.parse(metadataMatch[1]) as { deck_type?: string };
                                          if (metadata.deck_type === "fundraising") return "Fundraising";
                                          if (metadata.deck_type === "investor_update") return "Investor Update";
                                        } catch {
                                          // Ignore
                                        }
                                      }
                                      return "Deck";
                                    })()
                                  : "Deck";
                                return `Deck: ${deckType}`;
                              })()}
                            </Badge>
                          )}
                          {selectedDocument.templateId && (
                            <span className="text-sm text-muted-foreground">
                              {templateNameMap.get(selectedDocument.templateId) ?? "—"}
                            </span>
                          )}
                          {!selectedDocument.kind && !selectedDocument.templateId && (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedDoc(null)}
                      >
                        ×
                      </Button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium">Last Modified</span>
                        <p className="text-muted-foreground mt-1">
                          {new Date(selectedDocument.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Versions</span>
                        <p className="text-muted-foreground mt-1">
                          {selectedDocument.versionCount} versions available
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-medium mb-3">Version History</h3>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                            v{selectedDocument.versionCount}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Latest</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(selectedDocument.updated_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Current version
                            </p>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="border-t pt-6 space-y-2">
                    <h3 className="font-medium mb-3">Actions</h3>
                    {vaultExperimental && (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={() => openDoc(selectedDocument.id)}
                      >
                        Open in Builder
                      </Button>
                    )}
                    {selectedDocument.kind === "deck" && (
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        onClick={async () => {
                          try {
                            const exportUrl = `/api/decks/${selectedDocument.id}/export`;
                            toast({
                              title: "Exporting deck",
                              description: "Generating export...",
                            });

                            // Get current user ID to pass to API for auth
                            let currentUserId: string | null = userId;
                            if (!currentUserId) {
                              try {
                                const { data: { user } } = await sb.auth.getUser();
                                if (user) {
                                  currentUserId = user.id;
                                }
                              } catch {
                                // Ignore errors, will fall back to cookie-based auth
                              }
                            }

                            // Fetch with credentials to ensure cookies are sent
                            const response = await fetch(exportUrl, {
                              method: "GET",
                              credentials: "include",
                              headers: {
                                Accept: "text/html",
                                ...(currentUserId && { "x-user-id": currentUserId }),
                              },
                            });

                            if (!response.ok) {
                              const errorText = await response.text().catch(() => "Unknown error");
                              throw new Error(errorText || `HTTP ${response.status}`);
                            }

                            const htmlBlob = await response.blob();
                            const blobUrl = URL.createObjectURL(htmlBlob);
                            const newWindow = window.open(blobUrl, "_blank", "noopener,noreferrer");

                            // Clean up blob URL after a delay (even if window.open returns null)
                            setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

                            if (!newWindow) {
                              // window.open can return null even when it succeeds in some browsers
                              // Log a warning but don't fail - the blob URL is accessible
                              console.warn("[export-deck] window.open() returned null, but export may have succeeded");
                              toast({
                                title: "Export generated",
                                description: "Deck export ready. If a new tab didn't open, please check your popup blocker settings.",
                              });
                            } else {
                              toast({
                                title: "Export opened",
                                description: "Deck export opened in a new tab.",
                              });
                            }

                            // Log telemetry (fire-and-forget)
                            try {
                              logBuilderEvent("deck_exported", {
                                doc_id: selectedDocument.id,
                                source: "vault",
                                // deck_type will be parsed from metadata if needed, or can be added later
                              });
                            } catch {
                              // Ignore telemetry errors
                            }
                          } catch (error) {
                            console.error("[export-deck] Error", error);
                            toast({
                              title: "Export failed",
                              description: error instanceof Error ? error.message : "Failed to export deck",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={actionsDisabled}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export Deck
                      </Button>
                    )}
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onView(selectedDocument)}
                      disabled={actionsDisabled || !selectedDocument.latestVersion?.content}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onDownload(selectedDocument)}
                      disabled={actionsDisabled || !selectedDocument.latestVersion?.content}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onCreateLink(selectedDocument)}
                      disabled={actionsDisabled}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                          Share
                    </Button>
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => onCreatePasscodeLink(selectedDocument)}
                      disabled={actionsDisabled}
                    >
                          Passcode link
                    </Button>
                  </div>
                </div>
                      </div>
            )}
          </div>
        )}

          {actionsDisabled && (
          <div className="border-t p-4">
            <p className="text-sm text-muted-foreground">
              Actions are disabled until your sign-in is detected. If this persists, open{" "}
              <Link href="/signin" className="underline">/signin</Link>, sign in, then refresh this page.
            </p>
          </div>
          )}
        </div>
    </div>
  );
}
