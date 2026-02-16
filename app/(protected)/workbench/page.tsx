// Reload Workbench and confirm status badge shows Sent/Completed/etc.

"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { CollapsibleHeaderButton } from "@/components/ui/collapsible-header-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { WidgetCard, WidgetRowSection } from "@/components/widgets";
import { useToast } from "@/hooks/use-toast";
import { analyzeItem } from "@/lib/ai/analyze";
import type { AnalyzeResult } from "@/lib/ai/schemas";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { handleApiError } from "@/lib/handle-api-error";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";
import { trackEvent } from "@/lib/telemetry";
import { cn } from "@/lib/utils";
import { FileSignature, FileText, Filter, Search, Sparkles } from "lucide-react";
import Link from "next/link";
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

type VaultDocCheckClient = {
  from: (table: "document") => {
    select: (columns: string) => {
      eq: (column: "owner_id", value: string) => {
        limit: (count: number) => Promise<{
          data: Array<{ id: string }> | null;
          error: unknown | null;
        }>;
      };
    };
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  declined: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
};

const mockFocusToday = [
  { id: "overdue", label: "Overdue", value: 3 },
  { id: "today", label: "Due today", value: 5 },
  { id: "week", label: "This week", value: 12 },
];

const mockRecentlyActive = [
  { id: "1", title: "NDA — ACME Corp", subtitle: "Edited", valueLabel: "2h ago" },
  { id: "2", title: "MSA — VendorX", subtitle: "Reviewed", valueLabel: "4h ago" },
  { id: "3", title: "SOW — Q4 Project", subtitle: "Signed", valueLabel: "1d ago" },
];

const mockBlockedItems = [
  { id: "1", title: "Partner Agreement", subtitle: "Legal hold", tag: "high", valueLabel: "5d" },
  { id: "2", title: "Vendor Contract", subtitle: "Pending approval", tag: "medium", valueLabel: "3d" },
  { id: "3", title: "Service Agreement", subtitle: "Missing signature", tag: "medium", valueLabel: "2d" },
];

const mockStageBreakdown = [
  { id: "draft", label: "Draft", value: 12 },
  { id: "review", label: "Review", value: 8 },
  { id: "approved", label: "Approved", value: 5 },
  { id: "signed", label: "Signed", value: 3 },
];

const mockReviewQueue = [
  { id: "1", title: "Employment Agreement", subtitle: "Contract", tag: "pending", valueLabel: "2d" },
  { id: "2", title: "NDA Template v2", subtitle: "Template", tag: "review", valueLabel: "1d" },
  { id: "3", title: "SOW Amendment", subtitle: "Contract", tag: "pending", valueLabel: "4h" },
];

const mockSignatureQueue = [
  { id: "1", title: "MSA — ClientCo", subtitle: "Waiting on them", tag: "medium", valueLabel: "3d" },
  { id: "2", title: "NDA — PartnerX", subtitle: "Waiting on me", tag: "high", valueLabel: "1d" },
  { id: "3", title: "SOW — ProjectY", subtitle: "Waiting on them", tag: "low", valueLabel: "5h" },
];

export default function WorkbenchPage() {
  const { toast } = useToast();
  const sb = useMemo(() => getBrowserSupabaseClient(), []);
  // NOTE:
  // `next build` is currently type-checking Supabase with a Database union that
  // does not include "document"/"version" even though they exist at runtime.
  // Use a narrow, local casting type to avoid TS overload failures without using `any`.
  const sbDoc = sb as unknown as VaultDocCheckClient;
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
  const [isMounted, setIsMounted] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [analysisOpen, setAnalysisOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);

  // Signature modal state
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signRow, setSignRow] = useState<Row | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [envelopeStatuses, setEnvelopeStatuses] = useState<Record<string, string | null>>({});
  const [savingToVault, setSavingToVault] = useState<string | null>(null);
  const [hasVaultDocs, setHasVaultDocs] = useState<boolean | null>(null);
  // Workbench table density: keep a single, consistent compact mode to avoid confusing toggles.
  const density: "compact" = "compact";

  // Prevent Radix Select hydration mismatch (SSR-generated IDs vs client IDs).
  // Render Select controls only after mount; show placeholders during SSR.
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

        const { data, error } = await sbDoc
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
        id: "demo:nda-acme-harmonyk",
        title: "NDA — ACME & Harmonyk",
        source: "Drive",
        kind: "application/pdf",
        owner: driveConnected ? "you@demo" : "—",
        modified: fmt(now),
        preview: "Mutual NDA between parties outlining confidentiality and use of information…",
        hasVaultDocument: false,
        signingStatus: null,
      },
      {
        id: "demo:signed-proposal-q4",
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
        id: "demo:msa-vendorx-draft-v3",
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

    // Filter out demo IDs before fetching envelope statuses
    const realItemIds = sample.filter((r) => !r.id.startsWith("demo:")).map((r) => r.id);
    if (realItemIds.length > 0) {
      fetchEnvelopeStatuses(realItemIds)
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
        // Clone response before reading to preserve body for error handling
        const responseClone = response.clone();

        let errorMessage = response.statusText || "Failed to fetch envelope statuses";
        try {
          const errorData = (await response.json()) as { ok?: boolean; error?: string } | null;
          if (errorData && typeof errorData.error === "string") {
            errorMessage = errorData.error;
          }
        } catch {
          // If JSON parse fails, try to get raw text
          try {
            const rawText = await responseClone.text();
            errorMessage = rawText || errorMessage;
          } catch {
            // Use default errorMessage
          }
        }

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
    trackEvent("flow_workbench_view", { ts: Date.now() });
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
      trackEvent("flow_workbench_analyze", {
        unified_item_id: r.id,
        source: r.source,
      });

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
      trackEvent("flow_workbench_analyze", {
        unified_item_id: r.id,
        source: r.source,
        error: true,
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

      let data: unknown = null;
      try {
        data = (await response.json()) as unknown;
      } catch (jsonError) {
        // If JSON parse fails, try to get raw body
        try {
          const rawText = await responseClone.text();
          console.warn("[workbench] Failed to parse JSON response", { rawText: rawText.substring(0, 200) });
          data = { error: "Invalid response format", rawBody: rawText } as unknown;
        } catch {
          data = { error: "Failed to parse response" } as unknown;
        }
      }

      const dataOk = isRecord(data) && data["ok"] === true;
      if (!response.ok || !dataOk) {
        const status = response.status;
        const baseMessage =
          (isRecord(data) && typeof data["error"] === "string" ? data["error"] : undefined) ??
          "Failed to save to Vault";
        const details = isRecord(data) ? data["details"] : undefined;

        let detailsSuffix = "";
        if (isRecord(details)) {
          const parts: string[] = [];
          const code = typeof details["code"] === "string" ? details["code"] : undefined;
          const message = typeof details["message"] === "string" ? details["message"] : undefined;
          if (code) parts.push(`code=${code}`);
          if (message) parts.push(message);
          if (parts.length) {
            detailsSuffix = ` (${parts.join(" - ")})`;
          }
        }

        const errorMessage = `${baseMessage}${detailsSuffix}`;

        // Get raw body for debugging if not already captured
        let rawBody: string | null =
          isRecord(data) && typeof data["rawBody"] === "string" ? data["rawBody"] : null;
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
          details: isRecord(details) ? details : (details ?? null),
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
      trackEvent("flow_workbench_save_to_vault", {
        unified_item_id: row.id,
        title: row.title,
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
              title: "Demo item cannot be signed",
              description: "This Workbench sample item is for analysis only. Use a document from Vault or Builder to test signatures.",
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
      if (signRow) {
        trackEvent("flow_workbench_send_for_signature", {
          unified_item_id: signRow.id,
          recipient_email: recipientEmail,
        });
      }
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
      trackEvent("flow_playbook_run_started", {
        playbook_id: chosen.id,
        mode: "selection",
        source: "workbench",
        unified_item_ids: [selectedRow.id],
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
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-foreground">Run today: review, sign, unblock.</p>
          <Button asChild size="sm">
            <Link href="#insightsStrip">Open Review Queue</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/builder?tab=contracts">New Document</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/share/links">Create Share Link</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/signatures">Request Signature</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="#insightsStrip">Open Review Queue</Link>
          </Button>
        </div>

        {/* Integration Attention Strip */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">Integrations</div>
              <div className="text-xs text-muted-foreground">Drive needs reauth • Gmail disconnected</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Fix Drive
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Fix Gmail
              </Button>
            </div>
          </div>
        </div>

        {/* Insights Strip (collapsible) */}
        <WidgetRowSection id="insightsStrip" title="Insights" subtitle="Quick signals" defaultOpen={false}>
          {/* Widget Grid: 2 rows x 3 columns (no nested scrollbars) */}
          <div className="space-y-4">
            {/* Row 1 */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4 lg:h-[280px]">
                <WidgetCard title="My Focus Today" density="compact" className="h-full" bodyClassName="!pt-0 !pb-2">
                  <div className="space-y-3 -mt-1">
                    <div className="space-y-2">
                      {mockFocusToday.map((segment) => (
                        <div key={segment.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{segment.label}</span>
                          <span className="font-medium">{segment.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="flex h-2 w-full">
                        {mockFocusToday.map((segment, idx) => {
                          const total = mockFocusToday.reduce((acc, s) => acc + s.value, 0);
                          const pct = (segment.value / total) * 100;
                          const opacity = Math.max(0.4, 0.95 - idx * 0.2);
                          return (
                            <div
                              key={segment.id}
                              className="bg-primary"
                              style={{ width: `${pct}%`, opacity }}
                              title={`${segment.label}: ${segment.value}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </WidgetCard>
              </div>

              <div className="lg:col-span-4 lg:h-[280px]">
                <WidgetCard
                  title="Recently Active Docs"
                  density="compact"
                  className="h-full"
                  bodyClassName="!pt-0 !pb-2"
                  rightSlot={
                    <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                      View all →
                    </Link>
                  }
                >
                  <div className="space-y-1.5 -mt-1">
                    {mockRecentlyActive.map((item) => (
                      <div key={item.id} className="rounded-xl px-3 py-2.5 hover:bg-muted transition-colors">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{item.title}</div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{item.valueLabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </WidgetCard>
              </div>

              <div className="lg:col-span-4 lg:h-[280px]">
                <WidgetCard
                  title="Blocked Items"
                  density="compact"
                  className="h-full"
                  bodyClassName="!pt-0 !pb-2"
                  rightSlot={
                    <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                      View all →
                    </Link>
                  }
                >
                  <div className="space-y-1.5 -mt-1">
                    {mockBlockedItems.map((item) => (
                      <div key={item.id} className="rounded-xl px-3 py-2.5 hover:bg-muted transition-colors">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <Badge variant="outline" className={cn(
                                "text-[10px] px-1.5 py-0",
                                item.tag === "high" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
                                item.tag === "medium" && "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                              )}>
                                {item.tag}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{item.valueLabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </WidgetCard>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-4 lg:h-[280px]">
                <WidgetCard title="Stage Breakdown" subtitle="Documents by status" density="compact" className="h-full" bodyClassName="!pt-0 !pb-2">
                  <div className="space-y-3 -mt-1">
                    <div className="space-y-2">
                      {mockStageBreakdown.map((segment) => (
                        <div key={segment.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{segment.label}</span>
                          <span className="font-medium">{segment.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="flex h-2 w-full">
                        {mockStageBreakdown.map((segment, idx) => {
                          const total = mockStageBreakdown.reduce((acc, s) => acc + s.value, 0);
                          const pct = (segment.value / total) * 100;
                          const opacity = Math.max(0.4, 0.95 - idx * 0.2);
                          return (
                            <div
                              key={segment.id}
                              className="bg-primary"
                              style={{ width: `${pct}%`, opacity }}
                              title={`${segment.label}: ${segment.value}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </WidgetCard>
              </div>

              <div className="lg:col-span-4 lg:h-[280px]">
                <WidgetCard
                  title="Review Queue"
                  density="compact"
                  className="h-full"
                  bodyClassName="!pt-0 !pb-2"
                  rightSlot={
                    <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                      View all →
                    </Link>
                  }
                >
                  <div className="space-y-1.5 -mt-1">
                    {mockReviewQueue.map((item) => (
                      <div key={item.id} className="rounded-xl px-3 py-2.5 hover:bg-muted transition-colors">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium truncate">{item.title}</div>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/60 bg-muted">
                                {item.tag}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{item.valueLabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </WidgetCard>
              </div>

              <div className="lg:col-span-4 lg:h-[280px]">
                <WidgetCard
                  title="Signature Queue"
                  density="compact"
                  className="h-full"
                  bodyClassName="!pt-0 !pb-2"
                  rightSlot={
                    <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                      View all →
                    </Link>
                  }
                >
                  <div className="space-y-1.5 -mt-1">
                    {mockSignatureQueue.map((item) => (
                      <div key={item.id} className="rounded-xl px-3 py-2.5 hover:bg-muted transition-colors">
                        <div className="flex items-start justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{item.title}</div>
                            <div className="flex items-center gap-2 mt-0.5 min-w-0">
                              <div className="text-xs text-muted-foreground line-clamp-2">{item.subtitle}</div>
                              <Badge variant="outline" className={cn(
                                "text-[10px] px-1.5 py-0",
                                item.tag === "high" && "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
                                item.tag === "medium" && "border-amber-500/20 bg-amber-500/10 text-amber-800 dark:text-amber-300",
                                item.tag === "low" && "border-green-500/20 bg-green-500/10 text-green-800 dark:text-green-300"
                              )}>
                                {item.tag}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{item.valueLabel}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </WidgetCard>
              </div>
            </div>
          </div>
        </WidgetRowSection>

        {/* Empty state when no active work */}
        {!loading && filteredRows.length === 0 && (
          <EmptyState
            title="No active work yet"
            description="Open your review queue or start a new document to create items here."
            action={
              <>
                <Button asChild variant="outline">
                  <Link href="/workbench#insightsStrip">Open Review Queue</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/builder?tab=contracts">New Document</Link>
                </Button>
              </>
            }
            className="bg-card"
          />
        )}

        {/* Demo NDA empty state */}
        {hasVaultDocs === false && !loading && filteredRows.length > 0 && (
          <EmptyState
            title="Demo NDA (sample only)"
            description="You don't have any documents in your Vault yet. For this beta, you can still test Workbench using a sample NDA. This is a demo document only; real workflows will use your own documents from Vault or Google Drive."
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/builder?tab=contracts">New Document</Link>
              </Button>
            }
            className="items-start text-left border-dashed bg-muted/40"
          />
        )}

        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter this list…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {isMounted ? (
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="drive">Drive</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div
              aria-hidden="true"
              className="h-10 w-[150px] rounded-md border border-input bg-background"
            />
          )}

          {isMounted ? (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="signed">Signed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div
              aria-hidden="true"
              className="h-10 w-[150px] rounded-md border border-input bg-background"
            />
          )}

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRunPlaybookFromSelection}
            disabled={runPlaybookPending || !selectedRow}
          >
            {runPlaybookPending ? "Running…" : "Run Playbook"}
          </Button>
        </div>

        {/* Documents area: single scrollbar (AppShell). Keep content in the same spacing rhythm as the header/filters. */}
        <div className="pb-8">
          <div className={cn("flex gap-4", selectedRow && "items-start")}>
            <div className={cn("flex-1 min-w-0 pr-6", selectedRow && "max-w-[60%]")}>
              <div className="w-full overflow-x-auto">
                <Table className="w-full min-w-[980px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[36%]">Name</TableHead>
                      <TableHead className="w-[9%]">Source</TableHead>
                      <TableHead className="w-[9%]">Kind</TableHead>
                      <TableHead className="w-[9%]">Owner</TableHead>
                      <TableHead className="w-[14%]">Modified</TableHead>
                      <TableHead className="w-[9%]">Signing</TableHead>
                      <TableHead className="w-[14%] text-right">Actions</TableHead>
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
                        <TableCell colSpan={7} className="py-6 text-center text-muted-foreground">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-sm font-medium text-foreground">No items yet</div>
                            <div className="text-xs text-muted-foreground">
                              Start a new document to populate this list.
                            </div>
                            <Button asChild variant="outline" size="sm">
                              <Link href="/builder?tab=contracts">New Document</Link>
                            </Button>
                          </div>
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
                              "cursor-pointer",
                              selectedRow?.id === r.id && "bg-accent",
                              "py-1"
                            )}
                            onClick={() => setSel(r)}
                          >
                            <TableCell className={cn("font-medium align-top", "py-1")}>
                              <div className="flex items-start gap-3 min-w-0">
                                {/* icon */}
                                <FileText className={cn("text-muted-foreground shrink-0", "h-3 w-3")} />
                                <div className="min-w-0">
                                  <div className={cn("font-medium truncate", "text-sm")}>{r.title}</div>
                                  {r.preview && (
                                    <div
                                      className={cn("text-muted-foreground line-clamp-2", "text-[10px] mt-0.5")}
                                      title={r.preview}
                                    >
                                      {r.preview}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={cn("py-1")}>
                              <Badge variant="outline">{r.source}</Badge>
                            </TableCell>
                            {/* Kind column: half the width it used to effectively take, and truncate long MIME types */}
                            <TableCell className={cn("text-muted-foreground", "py-1 text-xs")}>
                              <span className="block truncate">
                                {r.kind ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className={cn("py-1 text-xs")}>
                              <span className="block truncate">{r.owner ?? "—"}</span>
                            </TableCell>
                            <TableCell className={cn("text-muted-foreground", "py-1 text-xs")}>
                              <span className="block truncate">{r.modified ?? "—"}</span>
                            </TableCell>
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
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => onAnalyze(r)}
                                  disabled={analyzing && sel?.id === r.id}
                                >
                                  {analyzing && sel?.id === r.id ? "Analyzing…" : "Analyze"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => onSaveToVault(r)}
                                  disabled={savingToVault === r.id || r.hasVaultDocument}
                                  title={r.hasVaultDocument ? "Already saved to Vault" : undefined}
                                >
                                  {savingToVault === r.id ? "Saving…" : r.hasVaultDocument ? "Saved" : "Save"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
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
            </div>

            {selectedRow ? (
              <div className="w-[40%] border-l bg-card">
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

                    <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
                      <CollapsibleHeaderButton
                        title="Details"
                        open={detailsOpen}
                        controlsId="workbench-details"
                        buttonClassName="mb-2 px-0 py-0 min-h-0"
                        titleClassName="text-sm font-medium"
                      />
                      <CollapsibleContent id="workbench-details">
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
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* AI Analysis Section */}
                    {(result || analyzeError || analyzing) && (
                    <Collapsible open={analysisOpen} onOpenChange={setAnalysisOpen}>
                      <div className="border-t pt-6">
                        <CollapsibleHeaderButton
                          title="AI Analysis"
                          open={analysisOpen}
                          controlsId="workbench-ai-analysis"
                          leadingIcon={<Sparkles className="h-4 w-4 text-mono" />}
                          buttonClassName="mb-3 px-0 py-0 min-h-0"
                          titleClassName="text-sm font-medium"
                        />
                        <CollapsibleContent id="workbench-ai-analysis">
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
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  )}

                  <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
                    <div className="border-t pt-6 space-y-2">
                      <CollapsibleHeaderButton
                        title="Quick Actions"
                        open={actionsOpen}
                        controlsId="workbench-quick-actions"
                        buttonClassName="mb-3 px-0 py-0 min-h-0"
                        titleClassName="text-sm font-medium"
                      />
                      <CollapsibleContent id="workbench-quick-actions">
                        <div className="space-y-2">
                          <Button
                            className="w-full justify-start"
                            variant="outline"
                            onClick={() => onAnalyze(selectedRow)}
                            disabled={analyzing && sel?.id === selectedRow.id}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze with Maestro
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
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                </div>
              </div>
            ) : null}
          </div>
        </div>
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
