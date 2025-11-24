// Manual test: send a document for signature, then simulate a webhook (or wait for a real one).
// Reload Workbench and confirm status badge shows Sent/Completed/etc.

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DriveRecent from "@/components/workbench/DriveRecent";
import { useToast } from "@/hooks/use-toast";
import { analyzeItem } from "@/lib/ai/analyze";
import type { AnalyzeResult } from "@/lib/ai/schemas";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { handleApiError } from "@/lib/handle-api-error";
import { phCapture } from "@/lib/posthog-client";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { cn } from "@/lib/utils";
import {
  FileSignature,
  FileText,
  Filter,
  Search,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Row = {
  id: string;
  title: string;
  source: "Drive" | "Gmail";
  kind?: string;
  owner?: string;
  modified?: string;
  preview?: string;
  hasVaultDocument?: boolean;
  signingStatus?: string | null;
};

type IntegrationStatusResponse = {
  googleDrive?: "connected" | "needs_reauth" | "error" | "unknown";
};

type PlaybookSummary = {
  id: string;
  name: string;
  status: string;
};

// Safe UUID helper
function uuid() {
  return globalThis.crypto?.randomUUID?.()
    ?? Math.random().toString(36).slice(2) + "-" + Date.now().toString(36);
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

export default function WorkbenchPage() {
  const { toast } = useToast();
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  const connectorsExtraEnabled = isFeatureEnabled("FEATURE_CONNECTORS_EXTRA");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [sel, setSel] = useState<Row | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const analyzingRef = useRef(false);
  const [playbooks, setPlaybooks] = useState<PlaybookSummary[]>([]);
  const [runPlaybookPending, setRunPlaybookPending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Signature modal state
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signRow, setSignRow] = useState<Row | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [envelopeStatuses, setEnvelopeStatuses] = useState<Record<string, string | null>>({});
  const [savingToVault, setSavingToVault] = useState<string | null>(null);
  const [hasVaultDocs, setHasVaultDocs] = useState<boolean | null>(null);

  // Check if user has any documents in Vault
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await sb.auth.getUser();
        if (cancelled || !user) {
          setHasVaultDocs(false);
          return;
        }

        const { data, error } = await sb
          .from("document")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (cancelled) return;

        if (error) {
          console.warn("[workbench] Error checking Vault docs", error);
          setHasVaultDocs(false);
          return;
        }

        setHasVaultDocs((data?.length ?? 0) > 0);
      } catch (err) {
        if (cancelled) return;
        console.warn("[workbench] Error checking Vault docs", err);
        setHasVaultDocs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  // Load Playbooks summary for "Run Playbook on selection"
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/playbooks/all", {
          cache: "no-store",
        });

        if (!res.ok) {
          console.warn(
            "[workbench] Failed to load playbooks summary",
            res.status,
          );
          if (!cancelled) {
            setPlaybooks([]);
          }
          return;
        }

        const data = (await res.json()) as
          | {
            ok?: boolean;
            items?: { id: string; name: string; status: string }[];
          }
          | null;

        if (!data?.ok || !data.items) {
          if (!cancelled) setPlaybooks([]);
          return;
        }

        if (!cancelled) {
          setPlaybooks(data.items);
        }
      } catch (err) {
        console.warn("[workbench] Error loading playbooks summary", err);
        if (!cancelled) setPlaybooks([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    let driveConnected = false;
    try {
      const response = await fetch("/api/integrations/status", {
        cache: "no-store",
      });
      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text().catch(() => "");
        const errorMessage = errorText || response.statusText || "Failed to load integration status";
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "workbench",
        });
        driveConnected = false;
      } else {
        const status: IntegrationStatusResponse = await response.json();
        driveConnected = (status.googleDrive ?? "unknown") === "connected";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      handleApiError({
        status: 500,
        errorMessage,
        toast,
        context: "workbench",
      });
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
        preview: "Mutual NDA between parties outlining confidentiality and use of information…",
        hasVaultDocument: false,
        signingStatus: null,
      },
      {
        id: uuid(),
        title: "Signed Proposal — Q4",
        source: "Gmail",
        kind: "message/rfc822",
        owner: "inbox",
        modified: fmt(new Date(now.getTime() - 3600_000)),
        preview: "Subject: Re: Proposal — Looks good, proceed to signature this week…",
        hasVaultDocument: false,
        signingStatus: null,
      },
      {
        id: uuid(),
        title: "MSA — VendorX (draft v3)",
        source: "Drive",
        kind: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        owner: driveConnected ? "you@demo" : "—",
        modified: fmt(new Date(now.getTime() - 86400_000)),
        preview: "Master Services Agreement draft covering scope, IP, payment terms…",
        hasVaultDocument: false,
        signingStatus: null,
      }
    ];

    setRows(sample);
    setLoading(false);

    if (sample.length > 0) {
      fetchEnvelopeStatuses(sample.map((r) => r.id))
        .then((statuses) => {
          setRows((prevRows) => {
            if (!prevRows) return prevRows;
            return prevRows.map((row) => ({
              ...row,
              signingStatus: statuses[row.id] ?? null,
            }));
          });
        })
        .catch((err) => {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
          handleApiError({
            status,
            errorMessage,
            toast,
            context: "workbench",
          });
        });
    }
  }, []);

  async function fetchEnvelopeStatuses(
    unifiedItemIds: string[]
  ): Promise<Record<string, string | null>> {
    try {
      const response = await fetch("/api/envelopes/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ unifiedItemIds }),
      });

      if (!response.ok) {
        const status = response.status;
        const errorText = await response.text().catch(() => "");
        const errorMessage = errorText || response.statusText || "Failed to fetch envelope statuses";
        handleApiError({
          status,
          errorMessage,
          toast,
          context: "workbench",
        });
        return {};
      }

      const data = (await response.json()) as {
        ok: boolean;
        statuses?: Record<string, { status: string | null }>;
        error?: string;
      };

      if (data.ok && data.statuses) {
        const statusMap: Record<string, string | null> = {};
        for (const [unifiedItemId, statusObj] of Object.entries(data.statuses)) {
          statusMap[unifiedItemId] = statusObj.status;
        }
        return statusMap;
      }
      return {};
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "workbench",
      });
      return {};
    }
  }

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) void load();
    }, 0);
    try {
      phCapture("workbench_view", { ts: Date.now() });
    } catch {
      // Ignore PostHog errors
    }
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [load]);

  async function onAnalyze(r: Row) {
    if (analyzingRef.current) {
      return;
    }

    setSel(r);
    setResult(null);
    setAnalyzeError(null);
    setAnalyzing(true);
    analyzingRef.current = true;

    try {
      const payload = {
        itemId: r.id,
        title: r.title,
        snippet: r.preview ?? "No snippet available; summarize based on available metadata only.",
        metadata: {
          source: r.source,
          kind: r.kind,
        },
      };
      const res = await analyzeItem(payload);
      setResult(res);
      toast({
        title: "Analyze complete",
        description: "Document analysis finished successfully.",
      });
    } catch (err) {
      const errorMessage = (err as Error).message ?? "Analyze failed";
      setAnalyzeError(errorMessage);

      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "workbench",
      });
    } finally {
      setAnalyzing(false);
      analyzingRef.current = false;
    }
  }

  function onOpenSignModal(r: Row) {
    setSignRow(r);
    setRecipientName("");
    setRecipientEmail("");
    setSignModalOpen(true);
  }

  function onCloseSignModal() {
    setSignModalOpen(false);
    setSignRow(null);
    setRecipientName("");
    setRecipientEmail("");
  }

  // Save-to-Vault: calls canonical backend API. On success, Vault document appears on /vault. On failure, toast shows Supabase error and console has full details.
  async function onSaveToVault(row: Row) {
    if (savingToVault === row.id) {
      return;
    }

    setSavingToVault(row.id);

    // Get current user ID to pass to API for auth
    let currentUserId: string | null = null;
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        currentUserId = user.id;
      }
    } catch {
      // Ignore errors, will fall back to cookie-based auth
    }

    try {
      const response = await fetch("/api/documents/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUserId && { "x-user-id": currentUserId }),
        },
        body: JSON.stringify({
          unifiedItemId: row.id,
          title: row.title, // Pass title in case unified_item doesn't exist
        }),
      });

      // Clone response before reading to preserve body for error handling
      const responseClone = response.clone();

      let data: any = null;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If JSON parse fails, try to get raw body
        try {
          const rawText = await responseClone.text();
          console.warn("[workbench] Failed to parse JSON response", { rawText: rawText.substring(0, 200) });
          data = { error: "Invalid response format", rawBody: rawText };
        } catch {
          data = { error: "Failed to parse response" };
        }
      }

      if (!response.ok || !data?.ok) {
        const status = response.status;
        const baseMessage = data?.error ?? "Failed to save to Vault";
        const details = data?.details;

        let detailsSuffix = "";
        if (details) {
          const parts: string[] = [];
          if (details.code) parts.push(`code=${details.code}`);
          if (details.message) parts.push(details.message);
          if (parts.length) {
            detailsSuffix = ` (${parts.join(" - ")})`;
          }
        }

        const errorMessage = `${baseMessage}${detailsSuffix}`;

        // Get raw body for debugging if not already captured
        let rawBody: string | null = data?.rawBody ?? null;
        if (!rawBody) {
          try {
            rawBody = await responseClone.text();
          } catch {
            // ignore
          }
        }

        const errorDetails = {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: details ?? null,
          data: data ?? null,
          rawBody: rawBody ?? null,
          rowId: row.id,
        };

        console.error("[workbench] Save to Vault error", JSON.stringify(errorDetails, null, 2));

        handleApiError({
          status,
          errorMessage,
          toast,
          context: "workbench",
        });
        return;
      }

      setRows((prevRows) =>
        prevRows.map((r) =>
          r.id === row.id
            ? { ...r, hasVaultDocument: true }
            : r
        )
      );

      toast({
        title: "Saved to Vault",
        description: "Document has been saved successfully.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorDetails = {
        message: errorMessage,
        name: error instanceof Error ? error.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined,
      };
      console.error("[workbench] Save to Vault unexpected error", errorDetails);

      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "workbench",
      });
    } finally {
      setSavingToVault(null);
    }
  }

  async function onSendForSignature() {
    if (!signRow || !recipientEmail || !recipientName) {
      toast({
        title: "Missing information",
        description: "Please fill in recipient name and email",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch("/api/sign/documenso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unifiedItemId: signRow.id,
          recipient: {
            email: recipientEmail,
            name: recipientName,
          },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        let data: { ok?: boolean; error?: string; envelopeId?: string } = {};
        try {
          data = await response.json();
        } catch {
          // Ignore JSON parse errors
        }

        const errorMessage = data.error ?? "Failed to send for signature";

        const isExpectedError =
          errorMessage.includes("No file available for signature") ||
          errorMessage.includes("Save this document to Vault") ||
          errorMessage.includes("Unified item not found") ||
          errorMessage.includes("Document not found");

        if (isExpectedError) {
          console.warn("[workbench] Send for signature: item not saved to Vault", {
            unifiedItemId: signRow.id,
            error: errorMessage,
          });

          if (errorMessage.includes("No file available for signature") || errorMessage.includes("Save this document to Vault")) {
            toast({
              title: "Document not ready",
              description: "No file available to send. Save this document to Vault first, then try again.",
              variant: "destructive",
            });
          } else if (errorMessage.includes("Unified item not found") || errorMessage.includes("Document not found")) {
            toast({
              title: "Document not found",
              description: "This item may not be saved to Vault yet.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Document not ready",
              description: "This document must be saved to Vault before sending for signature.",
              variant: "destructive",
            });
          }
        } else {
          handleApiError({
            status,
            errorMessage,
            toast,
            context: "workbench",
          });
        }
        return;
      }

      const data = (await response.json()) as { ok: boolean; error?: string; envelopeId?: string };

      if (!data.ok) {
        const errorMessage = data.error ?? "Failed to send for signature";
        handleApiError({
          status: 500,
          errorMessage,
          toast,
          context: "workbench",
        });
        return;
      }

      toast({
        title: "Sent for signature",
        description: "Document has been sent via Documenso.",
      });
      onCloseSignModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[workbench] Send for signature exception", err);

      const status = errorMessage.includes("401") ? 401 : errorMessage.includes("403") ? 403 : 500;
      handleApiError({
        status,
        errorMessage,
        toast,
        context: "workbench",
      });
    } finally {
      setSending(false);
    }
  }

  // Filter rows based on search and filters
  const filteredRows = rows.filter((row) => {
    const matchesSearch = searchQuery === "" ||
      row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.preview?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === "all" || row.source.toLowerCase() === sourceFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "signed" && row.signingStatus === "completed") ||
      (statusFilter === "pending" && row.signingStatus && row.signingStatus !== "completed");
    return matchesSearch && matchesSource && matchesStatus;
  });

  const selectedRow = sel ? filteredRows.find((r) => r.id === sel.id) || sel : null;

  const onRunPlaybookFromSelection = useCallback(async () => {
    if (!selectedRow) {
      toast({
        title: "No document selected",
        description: "Select a row in Workbench first, then run a Playbook.",
        variant: "destructive",
      });
      return;
    }

    if (!playbooks.length) {
      toast({
        title: "No Playbooks available",
        description: "Create and enable at least one Playbook in the Playbooks tab first.",
        variant: "destructive",
      });
      return;
    }

    const enabled = playbooks.filter((p) => p.status === "enabled");
    const chosen = enabled[0] ?? playbooks[0];

    setRunPlaybookPending(true);

    try {
      const res = await fetch("/api/playbooks/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playbook_id: chosen.id,
          scope: {
            mode: "selection",
            source: "workbench",
            selected_unified_ids: [selectedRow.id],
            selected_titles: [selectedRow.title],
          },
          dryRun: true,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
          ok?: boolean;
          message?: string;
          runId?: string;
          mode?: string;
        }
        | null;

      if (!res.ok || !data?.ok) {
        const errorMessage =
          data?.message ?? `Playbook run failed (status ${res.status})`;
        toast({
          title: "Playbook run failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Playbook dry-run started",
        description:
          "Open the Playbooks tab to review runs and time saved.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Playbook run failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setRunPlaybookPending(false);
    }
  }, [selectedRow, playbooks, toast]);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-6 space-y-4">
          <div className="mb-4 rounded-lg border bg-background p-4">
            <h1 className="text-lg font-semibold">Workbench</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Workbench is where you send documents for analysis. Start with a doc from Vault
              or a sample, run an analysis, then refine results in Builder.
            </p>
          </div>

          {/* Drive Recent */}
          <div className="mb-4">
            <DriveRecent />
          </div>

          {/* Demo NDA empty state */}
          {hasVaultDocs === false && !loading && (
            <div className="mb-4 rounded-lg border border-dashed bg-muted/40 p-4 text-sm">
              <h2 className="font-medium">Demo NDA (sample only)</h2>
              <p className="mt-1 text-muted-foreground">
                You don&apos;t have any documents in your Vault yet. For this Beta, you can
                still test Workbench using a sample NDA.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                This is a demo document only. Real workflows will use your own documents
                from Vault or Google Drive.
              </p>
            </div>
          )}

          <div className="flex gap-3 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="drive">Drive</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onRunPlaybookFromSelection}
              disabled={runPlaybookPending || !selectedRow}
              className="ml-1"
            >
              {runPlaybookPending ? "Running…" : "Run Playbook (dry-run)"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={cn('flex-1 overflow-auto', selectedRow && 'max-w-[60%]')}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Modified</TableHead>
                <TableHead>Signing</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No items yet
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => {
                  const status = r.signingStatus ?? envelopeStatuses[r.id] ?? null;
                  const statusLabel = status ? status.toUpperCase() : null;
                  const canSendForSignature = !!r.hasVaultDocument;

                  return (
                    <TableRow
                      key={r.id}
                      className={cn(
                        'cursor-pointer',
                        selectedRow?.id === r.id && 'bg-accent'
                      )}
                      onClick={() => setSel(r)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{r.title}</div>
                            {r.preview && (
                              <div className="text-xs text-muted-foreground truncate max-w-[400px]" title={r.preview}>
                                {r.preview}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.source}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.kind ?? "—"}</TableCell>
                      <TableCell>{r.owner ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.modified ?? "—"}</TableCell>
                      <TableCell>
                        {statusLabel ? (() => {
                          const rawStatus = status ?? undefined;
                          const statusKey = rawStatus?.toLowerCase();
                          const badgeClass =
                            statusKey && statusKey in statusColors
                              ? statusColors[statusKey]
                              : '';
                          return (
                            <Badge className={badgeClass} variant="secondary">
                              {statusLabel}
                            </Badge>
                          );
                        })() : (
                          <span className="text-xs text-muted-foreground">Not sent</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAnalyze(r)}
                            disabled={analyzing && sel?.id === r.id}
                          >
                            {analyzing && sel?.id === r.id ? "Analyzing…" : "Analyze"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSaveToVault(r)}
                            disabled={savingToVault === r.id || r.hasVaultDocument}
                            title={r.hasVaultDocument ? "Already saved to Vault" : undefined}
                          >
                            {savingToVault === r.id ? "Saving…" : r.hasVaultDocument ? "Saved" : "Save to Vault"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenSignModal(r)}
                            disabled={!canSendForSignature || sending}
                            title={!canSendForSignature ? "Save this document to Vault before sending for signature." : undefined}
                          >
                            <FileSignature className="h-3 w-3 mr-1" />
                            Sign
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {selectedRow && (
          <div className="w-[40%] border-l bg-card overflow-auto">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1 flex-1">
                    <h2 className="text-xl font-semibold">{selectedRow.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedRow.source} • {selectedRow.kind || "—"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSel(null);
                      setResult(null);
                    }}
                  >
                    ×
                  </Button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Source</span>
                    <p className="text-muted-foreground mt-1">
                      {selectedRow.source}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium">Owner</span>
                    <p className="text-muted-foreground mt-1">
                      {selectedRow.owner ?? "—"}
                    </p>
                  </div>

                  <div>
                    <span className="font-medium">Last Modified</span>
                    <p className="text-muted-foreground mt-1">
                      {selectedRow.modified ?? "—"}
                    </p>
                  </div>

                  {selectedRow.preview && (
                    <div>
                      <span className="font-medium">Preview</span>
                      <p className="text-muted-foreground mt-1">
                        {selectedRow.preview}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis Section */}
              {(result || analyzeError || analyzing) && (
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-mono" />
                    <h3 className="font-medium">AI Analysis</h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    {analyzing && (
                      <p className="text-muted-foreground">Running AI…</p>
                    )}
                    {analyzeError && (
                      <div className="text-destructive">
                        AI error: {analyzeError}
                      </div>
                    )}
                    {result && (
                      <div className="space-y-4">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Summary</div>
                          <div>{result.summary ?? "—"}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Entities</div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {(result.entities ?? []).map((e, i) => (
                                <li key={i}>
                                  <strong>{e.label}:</strong> {e.value}
                                </li>
                              ))}
                              {(result.entities?.length ?? 0) === 0 && <li>—</li>}
                            </ul>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Dates</div>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {(result.dates ?? []).map((d, i) => (
                                <li key={i}>{d}</li>
                              ))}
                              {(result.dates?.length ?? 0) === 0 && <li>—</li>}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">Next Action</div>
                          <div>{result.nextAction ?? "—"}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-6 space-y-2">
                <h3 className="font-medium mb-3">Quick Actions</h3>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => onAnalyze(selectedRow)}
                  disabled={analyzing && sel?.id === selectedRow.id}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze with Mono
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => onSaveToVault(selectedRow)}
                  disabled={savingToVault === selectedRow.id || selectedRow.hasVaultDocument}
                >
                  {selectedRow.hasVaultDocument ? "✓ Saved to Vault" : "Save to Vault"}
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => onOpenSignModal(selectedRow)}
                  disabled={!selectedRow.hasVaultDocument || sending}
                >
                  <FileSignature className="h-4 w-4 mr-2" />
                  Send for Signature
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Send for signature modal */}
      <Dialog open={signModalOpen} onOpenChange={setSignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send for signature</DialogTitle>
            <DialogDescription>
              Document: {signRow?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Recipient Name
              </label>
              <Input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="John Doe"
                disabled={sending}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Recipient Email
              </label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                disabled={sending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseSignModal} disabled={sending}>
              Cancel
            </Button>
            <Button
              onClick={onSendForSignature}
              disabled={sending || !recipientName || !recipientEmail}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
