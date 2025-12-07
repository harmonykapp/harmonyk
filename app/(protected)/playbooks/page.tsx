"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { handleApiError } from "@/lib/handle-api-error";
import { trackEvent } from "@/lib/telemetry";
import { cn } from "@/lib/utils";
import { LayoutDashboard, BookOpen, FileText, Play, Zap } from "lucide-react";

type PlaybookStatus = "active" | "inactive";

type Playbook = {
  id: string;
  name: string;
  trigger: string;
  lastRunLabel: string;
  status: PlaybookStatus;
  conditions: string[];
  actions: string[];
};

const PLAYBOOKS: Playbook[] = [
  {
    id: "investor_snapshot_update",
    name: "Investor snapshot → investor update recommended",
    trigger: "accounts_pack_run",
    lastRunLabel: "Never",
    status: "active",
    conditions: [
      'metrics.pack_type = "investor_accounts_snapshot"',
      "metrics.estimatedRunwayMonths < 6",
      "metrics.totalMonthlyBurn > 0",
    ],
    actions: [
      "Log activity: investor_update_recommended",
      "Enqueue task: Draft investor update summary",
    ],
  },
  {
    id: "contract_signed_renewal",
    name: "Contract signed → renewal reminder",
    trigger: "activity_event",
    lastRunLabel: "Never",
    status: "inactive",
    conditions: [
      'event.type = "contract_signed"',
      "contract.termLengthMonths >= 6",
    ],
    actions: [
      "Schedule task 90 days before expiry",
      "Log activity: renewal_sequence_started",
    ],
  },
  {
    id: "new_deck_outreach",
    name: "New deck in Vault → outreach sequence",
    trigger: "activity_event",
    lastRunLabel: "Never",
    status: "inactive",
    conditions: [
      'event.type = "deck_uploaded"',
      'deck.category in ["fundraising", "sales"]',
    ],
    actions: [
      "Log activity: outreach_sequence_recommended",
      "Enqueue task: Shortlist investors / leads",
    ],
  },
  {
    id: "investor_snapshot_update_low_priority",
    name: "Investor snapshot → update recommended (low priority)",
    trigger: "accounts_pack_run",
    lastRunLabel: "Never",
    status: "inactive",
    conditions: [
      'metrics.pack_type = "investor_accounts_snapshot"',
      "metrics.estimatedRunwayMonths >= 6",
      "metrics.totalMonthlyBurn > 0",
    ],
    actions: [
      "Log activity: investor_update_recommended_low_priority",
      "Enqueue task: Add to next monthly update",
    ],
  },
];

function statusBadgeVariant(status: PlaybookStatus): "outline" | "secondary" {
  return status === "active" ? "secondary" : "outline";
}

export default function PlaybooksPage() {
  const [selectedId, setSelectedId] = useState<string>(PLAYBOOKS[0]?.id ?? "");
  const [dryRunPending, setDryRunPending] = useState(false);
  const { toast } = useToast();
  // Tabs use Radix IDs that can differ between server and client.
  // We gate their initial render to avoid hydration mismatch noise.
  const [tabsHydrationReady, setTabsHydrationReady] = useState(false);

  useEffect(() => {
    setTabsHydrationReady(true);
  }, []);

  const selected = useMemo(
    () => PLAYBOOKS.find((p) => p.id === selectedId) ?? PLAYBOOKS[0],
    [selectedId]
  );

  async function handleDryRunSelectedPlaybook() {
    if (!selected) {
      toast({
        title: "No playbook selected",
        description: "Select a playbook from the list first, then dry-run it.",
        variant: "destructive",
      });
      return;
    }

    setDryRunPending(true);
    try {
      const res = await fetch("/api/playbooks/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playbook_id: selected.id,
          scope: {
            mode: "demo",
            source: "playbooks_page",
          },
          dryRun: true,
        }),
      });

      type ResponseData = {
        ok?: boolean;
        message?: string;
        mode?: string;
        runId?: string;
      };

      let data: ResponseData | null = null;
      let rawText: string | null = null;

      try {
        data = (await res.json()) as ResponseData;
      } catch {
        try {
          rawText = await res.text();
        } catch {
          rawText = null;
        }
      }

      if (!res.ok || !data?.ok) {
        const baseMessage =
          data?.message ??
          (rawText
            ? `Playbook run failed (status ${res.status}): ${rawText.slice(
                0,
                200,
              )}`
            : `Playbook run failed (status ${res.status})`);

        // GA behaviour: Playbooks-page dry-run is a demo-only stub.
        // If backend returns 400, show a friendly message instead of a scary error.
        if (res.status === 400) {
          toast({
            title: "Dry-run not wired for this view",
            description:
              "This button is a demo-only stub in this build. Use Workbench → Run Playbook (dry-run) to exercise Playbooks against real documents.",
            variant: "default",
          });
          return;
        }

        handleApiError({
          status: res.status,
          errorMessage: baseMessage,
          toast,
          context: "playbooks_page",
        });
        return;
      }

      toast({
        title: "Playbook dry-run started",
        description: "Check the Runs tab or Insights to review the outcome.",
      });

      trackEvent("flow_playbook_run_started", {
        playbook_id: selected.id,
        source: "playbooks_page",
        mode: data.mode ?? "dry-run",
        runId: data.runId ?? null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error during playbook run";

      handleApiError({
        status: 500,
        errorMessage,
        toast,
        context: "playbooks_page",
      });
    } finally {
      setDryRunPending(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      {/* Heading + optional tabs scaffold for consistency */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Playbooks</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          One-click automated workflows for repeatable tasks.
        </p>
      </div>
      <div suppressHydrationWarning>
        {tabsHydrationReady ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList>
              <TabsTrigger value="overview" className="gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="library" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Library
              </TabsTrigger>
              <TabsTrigger value="drafts" className="gap-2">
                <FileText className="h-4 w-4" />
                Drafts
              </TabsTrigger>
              <TabsTrigger value="runs" className="gap-2">
                <Play className="h-4 w-4" />
                Runs
              </TabsTrigger>
              <TabsTrigger value="triggers" className="gap-2">
                <Zap className="h-4 w-4" />
                Triggers
              </TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Left column – list of playbooks */}
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <CardTitle>Playbooks</CardTitle>
            <CardDescription>
              {PLAYBOOKS.length} playbook{PLAYBOOKS.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col divide-y border-t">
              {PLAYBOOKS.map((playbook) => {
                const isSelected = playbook.id === selected?.id;

                return (
                  <button
                    key={playbook.id}
                    type="button"
                    onClick={() => setSelectedId(playbook.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition",
                      "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "bg-muted"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {playbook.name}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="font-mono">{playbook.trigger}</span>
                        <span>·</span>
                        <span>{playbook.lastRunLabel}</span>
                      </div>
                    </div>
                    <Badge
                      variant={statusBadgeVariant(playbook.status)}
                      className={cn(
                        "text-xs capitalize whitespace-nowrap",
                        playbook.status === "inactive" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {playbook.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right column – details for selected playbook */}
        <Card className="min-w-0">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-base sm:text-lg font-semibold leading-snug">
                  {selected?.name}
                </CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">
                  Trigger: <span className="font-mono">{selected?.trigger}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge
                    variant={statusBadgeVariant(selected?.status ?? "inactive")}
                    className={cn(
                      "text-xs capitalize",
                      selected?.status === "inactive" &&
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {selected?.status ?? "inactive"}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Last run: {selected?.lastRunLabel}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Conditions <span className="normal-case">(read-only)</span>
              </p>
              <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-xs font-mono">
                {selected?.conditions.map((condition, idx) => (
                  <div
                    key={idx}
                    className="rounded-sm bg-background/80 px-2 py-1 text-[11px] sm:text-xs"
                  >
                    {condition}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Actions <span className="normal-case">(read-only)</span>
              </p>
              <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-xs font-mono">
                {selected?.actions.map((action, idx) => (
                  <div
                    key={idx}
                    className="rounded-sm bg-background/80 px-2 py-1 text-[11px] sm:text-xs"
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <Button
                size="sm"
                onClick={handleDryRunSelectedPlaybook}
                disabled={dryRunPending || !selected}
              >
                {dryRunPending ? "Running…" : "Dry-run this playbook"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

