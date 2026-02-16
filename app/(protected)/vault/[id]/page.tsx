"use client";

import {
  PinnedOverlay,
  type PdfAnchor,
  type PinnedOverlayPin,
} from "@/components/review/PinnedOverlay";
import { CommentsPanel } from "@/components/review/CommentsPanel";
import { PdfPinLayer } from "@/components/review/PdfPinLayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/EmptyState";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { PinAnchor, PinnedComment } from "@/lib/review/pins";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { readVaultDocs } from "@/lib/vault-local";
import { FileText } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";

// PGW10 Day 1 (inventory only):
// - This route currently does NOT render PDFs in-app.
// - Decks open via /api/decks/[docId]/export in a new tab/window.
// - Other document kinds open as generated HTML in a new tab/window.
// PGW10 pinned comments will attach to PDF artifacts once an in-app PDF viewer exists for /vault/[id].

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
  uploaded_by?: string | null;
  source?: string | null;
  room?: string | null;
  folder?: string | null;
  tags?: string[] | null;
  activity?: ActivityItem[] | null;
};

type VersionRow = {
  document_id: string;
  number: number;
  content: string;
  created_at: string;
};

type ActivityItem = {
  id?: string | null;
  type?: string | null;
  label?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type ThreadComment = {
  id: string;
  text: string;
  createdAt: string;
};

type DraftPinnedThread = PinnedOverlayPin & {
  status: "draft";
  draftText: string;
  replies: ThreadComment[];
};

type OpenPinnedThread = PinnedOverlayPin & {
  status: "open" | "resolved";
  root: ThreadComment;
  replies: ThreadComment[];
  replyDraft?: string;
};

type PinnedThread = DraftPinnedThread | OpenPinnedThread;

const DEMO_OWNER_ID =
  process.env.NEXT_PUBLIC_DEMO_OWNER_ID ?? "00000000-0000-0000-0000-000000000000";

const PIN_STORAGE_PREFIX = "harmonyk:vaultPins:v1";

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function createPinId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `pin_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function createCommentId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `comment_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function storageKey(docId: string) {
  return `${PIN_STORAGE_PREFIX}:${docId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isThreadComment(value: unknown): value is ThreadComment {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.text) &&
    isString(value.createdAt)
  );
}

function isThreadCommentArray(value: unknown): value is ThreadComment[] {
  return Array.isArray(value) && value.every(isThreadComment);
}

function isPdfAnchor(value: unknown): value is PdfAnchor {
  return (
    isRecord(value) &&
    isNumber(value.page) &&
    isNumber(value.x) &&
    isNumber(value.y) &&
    (value.w === undefined || isNumber(value.w)) &&
    (value.h === undefined || isNumber(value.h))
  );
}

function isPinnedOverlayPin(value: unknown): value is PinnedOverlayPin {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isPdfAnchor(value.anchor) &&
    isString(value.createdAt)
  );
}

function isDraftPinnedThread(value: unknown): value is DraftPinnedThread {
  if (!isRecord(value)) return false;
  if (value.status !== "draft") return false;
  if (!isString(value.draftText)) return false;
  if (!isThreadCommentArray(value.replies)) return false;
  return isPinnedOverlayPin(value);
}

function isOpenPinnedThread(value: unknown): value is OpenPinnedThread {
  if (!isRecord(value)) return false;
  if (value.status !== "open" && value.status !== "resolved") return false;
  if (!isThreadComment(value.root)) return false;
  if (!isThreadCommentArray(value.replies)) return false;
  if (value.replyDraft !== undefined && !isString(value.replyDraft)) return false;
  return isPinnedOverlayPin(value);
}

function isPinnedThread(value: unknown): value is PinnedThread {
  return isDraftPinnedThread(value) || isOpenPinnedThread(value);
}

function canUseStorage() {
  try {
    const testKey = `${PIN_STORAGE_PREFIX}:__test__`;
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function safeReadPins(docId: string): PinnedThread[] | null {
  try {
    const raw = localStorage.getItem(storageKey(docId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    if (!parsed.every(isPinnedThread)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function safeWritePins(docId: string, pins: PinnedThread[]) {
  try {
    localStorage.setItem(storageKey(docId), JSON.stringify(pins));
  } catch {
    // Ignore storage failures to keep UI responsive.
  }
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
  const [doc, setDoc] = useState<DocRow | null>(null);
  const [latest, setLatest] = useState<VersionRow | null>(null);
  const [source, setSource] = useState<"supabase" | "local" | "none">("none");
  const [pins, setPins] = useState<PinnedThread[]>([]);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [isAddCommentMode, setIsAddCommentMode] = useState(false);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [threadFilter, setThreadFilter] = useState<"open" | "resolved" | "all">("open");
  const [pdfPinnedComments, setPdfPinnedComments] = useState<PinnedComment[]>([]);
  const [pendingPdfAnchor, setPendingPdfAnchor] = useState<PinAnchor | null>(null);
  const threadRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hydrationDocIdRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinnedCommentsEnabled = isFeatureEnabled("FEATURE_PINNED_COMMENTS");

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
      } catch {
        // keep going to local fallback
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

  const previewContent = useMemo(() => {
    if (!latest?.content) return "";
    let content = latest.content;
    const metadataMatch = content.match(/<!-- MONO_[A-Z_]+:({.*?}) -->\s*\n*/s);
    if (metadataMatch) content = content.replace(metadataMatch[0], "");
    return content.trim();
  }, [latest?.content]);

  const isDeck = doc?.kind === "deck";
  const canReviewPins = Boolean(previewContent) && !isDeck;
  const openCount = useMemo(() => pins.filter((pin) => pin.status !== "resolved").length, [pins]);
  const resolvedCount = useMemo(() => pins.filter((pin) => pin.status === "resolved").length, [pins]);
  const visiblePins = useMemo(() => {
    if (threadFilter === "all") return pins;
    if (threadFilter === "resolved") {
      return pins.filter((pin) => pin.status === "resolved");
    }
    return pins.filter((pin) => pin.status !== "resolved");
  }, [pins, threadFilter]);
  const overlayPins = useMemo(
    () => pins.map((pin) => ({ ...pin, isResolved: pin.status === "resolved" })),
    [pins]
  );

  const addPdfPinnedComment = (text: string) => {
    setPdfPinnedComments((prev) => [
      ...prev,
      {
        id: createPinId(),
        text,
        status: "open",
        createdAt: new Date().toISOString(),
        author: "You",
        anchor: pendingPdfAnchor ?? { page: 1 },
      },
    ]);
    setPendingPdfAnchor(null);
  };

  const handlePdfPinAdd = (anchor: PinAnchor) => {
    setPendingPdfAnchor(anchor);
  };

  useEffect(() => {
    if (!canReviewPins && isAddCommentMode) {
      setIsAddCommentMode(false);
    }
  }, [canReviewPins, isAddCommentMode]);

  useEffect(() => {
    if (!selectedPinId) return;
    const node = threadRefs.current[selectedPinId];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedPinId]);

  useEffect(() => {
    if (!selectedPinId) return;
    const exists = pins.some((pin) => pin.id === selectedPinId);
    if (!exists) {
      setSelectedPinId(pins[pins.length - 1]?.id ?? null);
    }
  }, [pins, selectedPinId]);

  useEffect(() => {
    if (!selectedPinId) return;
    const isVisible = visiblePins.some((pin) => pin.id === selectedPinId);
    if (!isVisible) {
      setSelectedPinId(visiblePins[0]?.id ?? null);
    }
  }, [selectedPinId, visiblePins]);

  useEffect(() => {
    if (!doc?.id) return;
    const available = canUseStorage();
    setStorageAvailable(available);
    if (!available) return;
    if (hydrationDocIdRef.current === doc.id) return;
    hydrationDocIdRef.current = doc.id;
    if (pins.length === 0) {
      const saved = safeReadPins(doc.id);
      if (saved && saved.length > 0) {
        setPins(saved);
      }
    }
  }, [doc?.id, pins.length]);

  useEffect(() => {
    if (!doc?.id || !storageAvailable) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      safeWritePins(doc.id, pins);
    }, 250);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [doc?.id, pins, storageAvailable]);

  const formatTimestamp = (iso: string) => {
    const date = safeDate(iso);
    return date ? date.toLocaleString() : "—";
  };

  const updatePin = (pinId: string, updater: (pin: PinnedThread) => PinnedThread) => {
    setPins((prev) => prev.map((pin) => (pin.id === pinId ? updater(pin) : pin)));
  };

  const setThreadStatus = (pinId: string, status: "open" | "resolved") => {
    updatePin(pinId, (current) =>
      current.status === "draft"
        ? current
        : {
          ...current,
          status,
        }
    );
  };

  const removePin = (pinId: string) => {
    setPins((prev) => prev.filter((pin) => pin.id !== pinId));
    setSelectedPinId((prev) => (prev === pinId ? null : prev));
  };

  const handleSelectPin = (pinId: string) => {
    const selected = pins.find((pin) => pin.id === pinId);
    if (selected?.status === "resolved" && threadFilter === "open") {
      setThreadFilter("all");
    }
    setSelectedPinId(pinId);
  };

  function handleAddPin(anchor: PdfAnchor) {
    if (!canReviewPins) return;
    const pinId = createPinId();
    setPins((prev) => [
      ...prev,
      {
        id: pinId,
        anchor,
        createdAt: new Date().toISOString(),
        status: "draft",
        draftText: "",
        replies: [],
      },
    ]);
    setSelectedPinId(pinId);
  }

  function handleUndoPin() {
    setPins((prev) => {
      const next = prev.slice(0, -1);
      const removed = prev[prev.length - 1];
      if (removed && removed.id === selectedPinId) {
        setSelectedPinId(next[next.length - 1]?.id ?? null);
      }
      return next;
    });
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
        <EmptyState
          title="Document not available"
          description="This document isn’t available in your Vault right now. It may have been moved or removed."
          action={
            <>
              <Link href="/vault">
                <Button>Back to Vault</Button>
              </Link>
              <Link href="/integrations">
                <Button variant="outline">Import Documents</Button>
              </Link>
              <Link href="/builder">
                <Button variant="outline">New Document</Button>
              </Link>
            </>
          }
          className="max-w-md bg-card"
        />
      </div>
    );
  }

  const updated = safeDate(doc.updated_at) ?? safeDate(doc.created_at);
  const created = safeDate(doc.created_at);
  const ownerLabel =
    doc.uploaded_by && doc.uploaded_by.trim().length > 0
      ? doc.uploaded_by
      : doc.owner_id && userId && doc.owner_id === userId
        ? "You"
        : doc.owner_id ?? null;
  const sourceLabel =
    doc.source && doc.source.trim().length > 0
      ? doc.source
      : source === "supabase"
        ? "Cloud"
        : source === "local"
          ? "Local"
          : null;
  const roomLabel = doc.room && doc.room.trim().length > 0 ? doc.room : null;
  const folderLabel = doc.folder && doc.folder.trim().length > 0 ? doc.folder : null;
  const tags = Array.isArray(doc.tags) ? doc.tags.filter((tag) => tag.trim().length > 0) : [];
  const activityItems = Array.isArray(doc.activity) ? doc.activity : [];

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

        <Card className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="font-medium">Review (Pins)</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={isAddCommentMode ? "default" : "outline"}
                disabled={!canReviewPins}
                onClick={() => setIsAddCommentMode((prev) => !prev)}
              >
                {isAddCommentMode ? "Adding comments" : "Add comment"}
              </Button>
              <Button size="sm" variant="outline" disabled={pins.length === 0} onClick={handleUndoPin}>
                Undo
              </Button>
            </div>
          </div>
          {canReviewPins ? (
            <div className="mt-2 text-xs text-muted-foreground">Tip: Shift + drag to highlight a region.</div>
          ) : null}

          <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              {isDeck ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  Deck export opens in a new tab. Pin placement is disabled for decks in Day 2.
                </div>
              ) : !previewContent ? (
                pinnedCommentsEnabled ? (
                  <div className="rounded-md border bg-muted/30 p-3">
                    <PdfPinLayer enableAdd onAddPin={handlePdfPinAdd} />
                    <div className="mt-2 text-xs text-muted-foreground">
                      Click to drop a pin (UI-only). Selection anchoring lands on D3.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No in-app preview is available for this document yet.
                  </div>
                )
              ) : (
                <PinnedOverlay
                  pins={overlayPins}
                  isAddMode={isAddCommentMode}
                  isInteractive={canReviewPins}
                  onAddPin={handleAddPin}
                  selectedId={selectedPinId}
                  onSelect={handleSelectPin}
                  className="rounded-md border bg-muted/30 p-4"
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{previewContent}</div>
                </PinnedOverlay>
              )}
            </div>
            {pinnedCommentsEnabled && !previewContent && !isDeck ? (
              <CommentsPanel items={pdfPinnedComments} onAdd={addPdfPinnedComment} />
            ) : (
              <div className="flex flex-col gap-3 rounded-md border bg-background p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Comments</div>
                <Badge variant="secondary" className="text-xs">
                  {pins.length}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {storageAvailable
                  ? "Saved locally on this device"
                  : "Not saved (private browsing or storage blocked)"}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { value: "open", label: "Open", count: openCount },
                  { value: "resolved", label: "Resolved", count: resolvedCount },
                  { value: "all", label: "All", count: pins.length },
                ].map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={threadFilter === filter.value ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    onClick={() => setThreadFilter(filter.value as "open" | "resolved" | "all")}
                  >
                    <span>{filter.label}</span>
                    <Badge variant="secondary" className="ml-2 text-[10px]">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
              {pins.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  No comments yet. Turn on Add comment and click to pin.
                </div>
              ) : visiblePins.length === 0 ? (
                <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  No comments match this filter.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visiblePins.map((pin, index) => {
                    const isSelected = pin.id === selectedPinId;
                    const isResolved = pin.status === "resolved";
                    const timestamp = formatTimestamp(pin.createdAt);
                    const rootText = pin.status === "draft" ? pin.draftText : pin.root.text;
                    return (
                      <div
                        key={pin.id}
                        ref={(node) => {
                          threadRefs.current[pin.id] = node;
                        }}
                        onClick={() => handleSelectPin(pin.id)}
                        className={[
                          "rounded-md border p-3 transition",
                          isSelected ? "border-primary/40 bg-primary/5" : "border-muted",
                          isResolved && !isSelected ? "opacity-60" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>{`Comment #${index + 1}`}</span>
                            {isResolved ? (
                              <Badge variant="secondary" className="text-[10px]">
                                Resolved
                              </Badge>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{timestamp}</span>
                            {pin.status !== "draft" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setThreadStatus(pin.id, isResolved ? "open" : "resolved");
                                }}
                              >
                                {isResolved ? "Reopen" : "Resolve"}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        {pin.status === "draft" ? (
                          <div className="mt-2 space-y-2">
                            <div className="text-sm font-medium">Draft comment</div>
                            <textarea
                              className="min-h-[72px] w-full rounded-md border bg-background p-2 text-sm"
                              placeholder="Add a comment…"
                              value={pin.draftText}
                              onChange={(event) =>
                                updatePin(pin.id, (current) =>
                                  current.status === "draft"
                                    ? { ...current, draftText: event.target.value }
                                    : current
                                )
                              }
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  updatePin(pin.id, (current) => {
                                    if (current.status !== "draft") return current;
                                    const text = current.draftText.trim();
                                    if (!text) return current;
                                    return {
                                      ...current,
                                      status: "open",
                                      root: {
                                        id: createCommentId(),
                                        text,
                                        createdAt: new Date().toISOString(),
                                      },
                                      replies: current.replies ?? [],
                                      replyDraft: "",
                                    };
                                  })
                                }
                                disabled={pin.draftText.trim().length === 0}
                              >
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => removePin(pin.id)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <div className="text-sm">{rootText}</div>
                            {pin.replies.length > 0 ? (
                              <div className="space-y-2 border-l pl-3 text-sm text-muted-foreground">
                                {pin.replies.map((reply) => (
                                  <div key={reply.id}>
                                    <div className="text-xs">{formatTimestamp(reply.createdAt)}</div>
                                    <div>{reply.text}</div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {isResolved ? (
                              <div className="text-xs text-muted-foreground">
                                This thread is resolved. Reopen to add a reply.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <textarea
                                  className="min-h-[60px] w-full rounded-md border bg-background p-2 text-sm"
                                  placeholder="Write a reply…"
                                  value={pin.replyDraft ?? ""}
                                  onChange={(event) =>
                                    updatePin(pin.id, (current) =>
                                      current.status === "open"
                                        ? { ...current, replyDraft: event.target.value }
                                        : current
                                    )
                                  }
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updatePin(pin.id, (current) => {
                                      if (current.status !== "open") return current;
                                      const text = (current.replyDraft ?? "").trim();
                                      if (!text) return current;
                                      return {
                                        ...current,
                                        replies: [
                                          ...current.replies,
                                          { id: createCommentId(), text, createdAt: new Date().toISOString() },
                                        ],
                                        replyDraft: "",
                                      };
                                    })
                                  }
                                  disabled={(pin.replyDraft ?? "").trim().length === 0}
                                >
                                  Reply
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="font-medium">Details</div>
          <dl className="mt-3 grid gap-3 text-sm">
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Owner / Uploaded by</dt>
              <dd className={`min-w-0 truncate ${ownerLabel ? "text-foreground" : "text-muted-foreground"}`}>
                {ownerLabel ?? "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Source</dt>
              <dd className={`min-w-0 truncate ${sourceLabel ? "text-foreground" : "text-muted-foreground"}`}>
                {sourceLabel ?? "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className={`min-w-0 truncate ${created ? "text-foreground" : "text-muted-foreground"}`}>
                {created ? created.toLocaleString() : "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Updated</dt>
              <dd className={`min-w-0 truncate ${updated ? "text-foreground" : "text-muted-foreground"}`}>
                {updated ? updated.toLocaleString() : "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Room</dt>
              <dd className={`min-w-0 truncate ${roomLabel ? "text-foreground" : "text-muted-foreground"}`}>
                {roomLabel ?? "Not assigned"}
              </dd>
            </div>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Folder</dt>
              <dd className={`min-w-0 truncate ${folderLabel ? "text-foreground" : "text-muted-foreground"}`}>
                {folderLabel ?? "Not assigned"}
              </dd>
            </div>
            <div className="grid grid-cols-[140px_minmax(0,1fr)] items-start gap-3">
              <dt className="text-xs text-muted-foreground">Tags</dt>
              <dd className={`min-w-0 ${tags.length > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="truncate">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  "Not assigned"
                )}
              </dd>
            </div>
          </dl>
        </Card>

        <Card className="p-4">
          <div className="font-medium">Recent activity</div>
          {activityItems.length > 0 ? (
            <div className="mt-3 space-y-3 text-sm">
              {activityItems.slice(0, 8).map((item, index) => {
                const activityLabel =
                  item.label?.trim() ||
                  item.description?.trim() ||
                  item.type?.trim() ||
                  "Activity";
                const activityDate = safeDate(item.created_at);
                return (
                  <div key={item.id ?? `${activityLabel}-${index}`} className="flex min-w-0 items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{activityLabel}</div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">
                        {activityDate ? activityDate.toLocaleString() : "—"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 text-sm text-muted-foreground">
              Activity will appear here as this document is shared, viewed, or updated.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
