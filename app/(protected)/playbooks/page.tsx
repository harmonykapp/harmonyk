"use client";

// PGW2 UI polish:
// Increase Playbook Activity row height so the "Playbook Runs" list doesn't clip.
const PLAYBOOK_ACTIVITY_ROW_CARD_HEIGHT = "lg:h-[420px]";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WidgetCard, WidgetRow } from "@/components/widgets";
import { useToast } from "@/hooks/use-toast";
import { handleApiError } from "@/lib/handle-api-error";
import { trackEvent } from "@/lib/telemetry";
import { cn } from "@/lib/utils";
import { AlertCircle, BookOpen, CheckCircle2, Clock, FileText, LayoutDashboard, Loader2, Play, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const isDemoEnvironment = process.env.NODE_ENV !== "production";

const DEMO_PLAYBOOK_RUNS = [
  { id: "1", name: "Contract Renewal Reminder", status: "success", lastRun: "2h ago", duration: "1.2s" },
  { id: "2", name: "Investor Update Trigger", status: "success", lastRun: "5h ago", duration: "2.4s" },
  { id: "3", name: "Deck Outreach Sequence", status: "needs_input", lastRun: "1d ago", duration: "0.8s" },
  { id: "4", name: "Financial Snapshot Alert", status: "success", lastRun: "2d ago", duration: "1.5s" },
  { id: "5", name: "Follow-up Task Creator", status: "failed", lastRun: "3d ago", duration: "0.3s" },
  { id: "6", name: "Document Classification", status: "success", lastRun: "4d ago", duration: "3.1s" },
];

const DEMO_MOST_USED = [
  { id: "1", name: "Contract Renewal Reminder", runs: 142 },
  { id: "2", name: "Investor Update Trigger", runs: 98 },
  { id: "3", name: "Financial Snapshot Alert", runs: 76 },
  { id: "4", name: "Deck Outreach Sequence", runs: 54 },
];

const DEMO_SCHEDULED = [
  { id: "1", name: "Monthly Investor Report", scheduledFor: "Tomorrow 9:00 AM" },
  { id: "2", name: "Quarterly Review Alert", scheduledFor: "In 3 days" },
  { id: "3", name: "Contract Expiry Check", scheduledFor: "In 5 days" },
  { id: "4", name: "Renewal Sequence Start", scheduledFor: "In 1 week" },
];

const DEMO_RECENT_OUTPUTS = [
  { id: "1", type: "Task", title: "Review partnership agreement" },
  { id: "2", type: "Log", title: "Investor update recommended" },
  { id: "3", type: "Task", title: "Schedule follow-up call" },
  { id: "4", type: "Log", title: "Renewal sequence started" },
];

const TIME_SAVED_SPARKLINE = [18, 22, 20, 28, 32, 30, 38, 42, 40, 48, 52, 50, 58, 62, 60, 68, 72, 70, 75, 78, 82, 80, 85, 88, 90, 92, 95, 98, 100, 102];

export default function PlaybooksPage() {
  const [selectedId, setSelectedId] = useState<string>(PLAYBOOKS[0]?.id ?? "");
  const [dryRunPending, setDryRunPending] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const [tabsHydrationReady, setTabsHydrationReady] = useState(false);

  const runs = isDemoEnvironment ? DEMO_PLAYBOOK_RUNS : [];
  const mostUsed = isDemoEnvironment ? DEMO_MOST_USED : [];
  const scheduled = isDemoEnvironment ? DEMO_SCHEDULED : [];
  const recentOutputs = isDemoEnvironment ? DEMO_RECENT_OUTPUTS : [];

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
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      <div suppressHydrationWarning>
        {tabsHydrationReady ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

      {activeTab === "overview" && (
        <div className="space-y-6">
          <WidgetRow
            title="Playbook Activity"
            subtitle="Runs, outcomes, and time saved"
            storageKey="row:playbooks:activity"
            className="mt-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className={`md:col-span-6 ${PLAYBOOK_ACTIVITY_ROW_CARD_HEIGHT}`}>
                <WidgetCard title="Playbook Runs" subtitle="Recent activity" className="h-full">
                  <div className="space-y-1">
                    {runs.slice(0, 6).map((run) => (
                      <div key={run.id} className="flex items-center justify-between gap-2 p-2 rounded border border-border/40 text-xs">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{run.name}</div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            run.status === "success"
                              ? "text-[10px] bg-emerald-50 border-emerald-400/40 text-emerald-700 dark:bg-emerald-950/20 shrink-0"
                              : run.status === "failed"
                                ? "text-[10px] bg-rose-50 border-rose-400/40 text-rose-700 dark:bg-rose-950/20 shrink-0"
                                : "text-[10px] bg-amber-50 border-amber-400/40 text-amber-700 dark:bg-amber-950/20 shrink-0"
                          }
                        >
                          {run.status === "success" && <CheckCircle2 className="h-3 w-3 mr-0.5" />}
                          {run.status === "failed" && <AlertCircle className="h-3 w-3 mr-0.5" />}
                          {run.status === "needs_input" && <Loader2 className="h-3 w-3 mr-0.5" />}
                          {run.status === "success" ? "Success" : run.status === "failed" ? "Failed" : "Needs input"}
                        </Badge>
                        <div className="text-muted-foreground shrink-0 w-16">{run.lastRun}</div>
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0 w-12">
                          <Clock className="h-3 w-3" />
                          {run.duration}
                        </div>
                      </div>
                    ))}
                    {runs.length === 0 && (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No playbook runs yet
                      </div>
                    )}
                  </div>
                </WidgetCard>
              </div>

              <div className={`md:col-span-3 ${PLAYBOOK_ACTIVITY_ROW_CARD_HEIGHT}`}>
                <WidgetCard title="Run Outcomes" subtitle="Distribution" className="h-full" bodyClassName="flex flex-col">
                  <div className="flex flex-col items-center justify-start">
                    <div className="shrink-0 mb-2">
                      <div className="grid grid-cols-1 gap-1.5 text-[9px] text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
                            <span>Success</span>
                          </div>
                          <span className="font-medium ml-2">75%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <div className="w-2 h-2 rounded-full bg-rose-400/40" />
                            <span>Failed</span>
                          </div>
                          <span className="font-medium ml-2">15%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <div className="w-2 h-2 rounded-full bg-amber-400/40" />
                            <span>Needs input</span>
                          </div>
                          <span className="font-medium ml-2">10%</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-center flex-1 min-h-0">
                      <div className="relative" style={{ width: "140px", height: "140px" }}>
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="20"
                            className="text-emerald-400/40"
                            strokeDasharray="188 251"
                            strokeDashoffset="0"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="20"
                            className="text-rose-400/40"
                            strokeDasharray="38 251"
                            strokeDashoffset="-188"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="20"
                            className="text-amber-400/40"
                            strokeDasharray="25 251"
                            strokeDashoffset="-226"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </WidgetCard>
              </div>

              <div className={`md:col-span-3 ${PLAYBOOK_ACTIVITY_ROW_CARD_HEIGHT}`}>
                <WidgetCard title="Time Saved" subtitle="Last 30 days" className="h-full">
                  <div className="flex flex-col items-center justify-center gap-2 py-6">
                    <div className="text-4xl font-bold">102</div>
                    <div className="text-sm text-muted-foreground">hours saved</div>
                  </div>
                  <div className="h-24 flex items-end justify-between gap-[2px] mt-4">
                    {TIME_SAVED_SPARKLINE.map((value, i) => {
                      const height = (value / 120) * 96;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-blue-400/40 rounded-t"
                            style={{ height: `${height}px` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </WidgetCard>
              </div>
            </div>
          </WidgetRow>

          <WidgetRow
            title="Usage & Outputs"
            subtitle="Most used, scheduled, and recent outputs"
            storageKey="row:playbooks:usage"
            className="mt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[560px]">
              <div className="md:col-span-4">
                <WidgetCard title="Most Used Playbooks" subtitle="By run count" className="h-full">
                  <div className="space-y-2">
                    {mostUsed.map((item, idx) => (
                      <div key={item.id} className="p-2 rounded border border-border/40">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="text-lg font-semibold text-muted-foreground w-6">{idx + 1}</div>
                            <div className="text-sm font-medium truncate">{item.name}</div>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0">{item.runs} runs</Badge>
                        </div>
                      </div>
                    ))}
                    {mostUsed.length === 0 && (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No playbooks used yet
                      </div>
                    )}
                  </div>
                </WidgetCard>
              </div>

              <div className="md:col-span-4">
                <WidgetCard title="Scheduled Runs" subtitle="Upcoming" className="h-full">
                  <div className="space-y-2">
                    {scheduled.map((item) => (
                      <div key={item.id} className="p-2 rounded border border-border/40">
                        <div className="text-sm font-medium truncate mb-1">{item.name}</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{item.scheduledFor}</span>
                        </div>
                      </div>
                    ))}
                    {scheduled.length === 0 && (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No scheduled runs
                      </div>
                    )}
                  </div>
                </WidgetCard>
              </div>

              <div className="md:col-span-4">
                <WidgetCard title="Recent Outputs" subtitle="Generated items" className="h-full">
                  <div className="space-y-2">
                    {recentOutputs.map((item) => (
                      <div key={item.id} className="p-2 rounded border border-border/40">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                        </div>
                        <div className="text-sm font-medium truncate">{item.title}</div>
                      </div>
                    ))}
                    {recentOutputs.length === 0 && (
                      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                        No outputs yet
                      </div>
                    )}
                  </div>
                </WidgetCard>
              </div>
            </div>
          </WidgetRow>

          {isDemoEnvironment && (
            <p className="text-[10px] text-muted-foreground mt-6">
              Demo data only. In production, this view will show real playbook activity.
            </p>
          )}
        </div>
      )}

      {activeTab === "library" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="min-w-0 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-3">
              <h3 className="text-lg font-semibold">Playbooks</h3>
              <p className="text-sm text-muted-foreground">
                {PLAYBOOKS.length} playbook{PLAYBOOKS.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="p-6 pt-0">
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
            </div>
          </div>

          <div className="min-w-0 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold leading-snug">
                    {selected?.name}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Trigger: <span className="font-mono">{selected?.trigger}</span>
                  </p>
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
            </div>
            <div className="p-6 space-y-6">
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
            </div>
          </div>
        </div>
      )}

      {activeTab === "drafts" && (
        <div className="p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Playbook drafts view coming soon</p>
        </div>
      )}

      {activeTab === "runs" && (
        <div className="p-12 text-center text-muted-foreground">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Playbook runs view coming soon</p>
        </div>
      )}

      {activeTab === "triggers" && (
        <div className="p-12 text-center text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>Playbook triggers view coming soon</p>
        </div>
      )}
    </div>
  );
}

