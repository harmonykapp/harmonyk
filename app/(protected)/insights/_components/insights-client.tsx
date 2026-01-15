"use client";

/**
 * LEGACY (Week 8) Insights client.
 * NOTE: The /insights route is currently driven by app/(protected)/insights/page.tsx.
 * If this file is no longer imported anywhere, it should be deleted to avoid confusion.
 */

// Week 8: Insights client UI
//
// This component:
// - Calls /api/insights/summary for the current workspace/user
// - Renders a simple grid of metrics cards (7d/30d)
// - Exposes an "Export CSV" button that hits /api/insights/export
//
// It is meant to be mounted by the server-side /insights page with
// the correct workspaceId/ownerId.

import { useEffect, useState } from "react";

type RangePreset = "7d" | "30d";

type CountResult = {
    "7d": number;
    "30d": number;
};

type TimeSavedResult = {
    "7d": number;
    "30d": number;
};

type InsightsMetrics = {
    docsGenerated: CountResult;
    docsSavedToVault: CountResult;
    shareLinksCreated: CountResult;
    signaturesSent: CountResult;
    signaturesCompleted: CountResult;
    playbookRuns: CountResult;
    monoQueries: CountResult;
    timeSavedSeconds: TimeSavedResult;
    docsInVaultTotal: number;
};

type InsightsSummaryResponse = {
    range: RangePreset;
    from: string;
    to: string;
    metrics: InsightsMetrics;
};

type Props = {
    workspaceId?: string;
    ownerId?: string;
    defaultRange?: RangePreset;
};

export default function InsightsClient({
    workspaceId,
    ownerId,
    defaultRange = "7d",
}: Props) {
    const [range, setRange] = useState<RangePreset>(defaultRange);
    const [summary, setSummary] = useState<InsightsSummaryResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function fetchSummary(nextRange: RangePreset) {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/insights/summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    workspaceId,
                    ownerId,
                    range: nextRange,
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                const msg =
                    (json && json.error && json.error.message) ||
                    `Failed to load insights (${res.status})`;
                throw new Error(msg);
            }

            const json = (await res.json()) as InsightsSummaryResponse;
            setSummary(json);
        } catch (err: any) {
            console.error("[InsightsClient] fetchSummary error", err);
            setError(err?.message ?? "Failed to load insights");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSummary(range);
    }, [workspaceId, ownerId]);

    const handleRangeChange = (next: RangePreset) => {
        setRange(next);
        fetchSummary(next);
    };

    const handleExportCsv = async () => {
        try {
            const res = await fetch("/api/insights/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    workspaceId,
                    ownerId,
                    range,
                }),
            });

            if (!res.ok) {
                const json = await res.json().catch(() => null);
                const msg =
                    (json && json.error && json.error.message) ||
                    `Failed to export insights (${res.status})`;
                throw new Error(msg);
            }

            const csvText = await res.text();
            const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "insights_export.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            console.error("[InsightsClient] handleExportCsv error", err);
            setError(err?.message ?? "Failed to export insights");
        }
    };

    const metrics = summary?.metrics;

    const fromLabel = summary
        ? new Date(summary.from).toLocaleDateString()
        : "";
    const toLabel = summary ? new Date(summary.to).toLocaleDateString() : "";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase text-muted-foreground">
                        Time window
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleRangeChange("7d")}
                            className={[
                                "rounded-md px-3 py-1 text-xs",
                                range === "7d"
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-background text-foreground",
                            ].join(" ")}
                        >
                            Last 7 days
                        </button>
                        <button
                            type="button"
                            onClick={() => handleRangeChange("30d")}
                            className={[
                                "rounded-md px-3 py-1 text-xs",
                                range === "30d"
                                    ? "bg-primary text-primary-foreground"
                                    : "border border-border bg-background text-foreground",
                            ].join(" ")}
                        >
                            Last 30 days
                        </button>
                    </div>
                    {summary && (
                        <span className="text-[11px] text-muted-foreground">
                            {fromLabel} → {toLabel}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportCsv}
                        className="rounded-md border border-border bg-background px-3 py-1 text-xs hover:bg-muted"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            {loading && (
                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-4 text-xs text-muted-foreground">
                    Loading insights…
                </div>
            )}

            {!loading && !metrics && !error && (
                <div className="rounded-md border border-border/60 bg-background/60 px-3 py-4 text-xs text-muted-foreground">
                    No insights yet. Generate, save, share, and sign a few documents to see metrics here.
                </div>
            )}

            {metrics && (
                <div className="grid gap-4 md:grid-cols-3">
                    <InsightsMetricCard
                        title="Docs generated"
                        metrics={metrics.docsGenerated}
                    />
                    <InsightsMetricCard
                        title="Docs saved to Vault"
                        metrics={metrics.docsSavedToVault}
                    />
                    <InsightsMetricCard
                        title="Share links created"
                        metrics={metrics.shareLinksCreated}
                    />
                    <InsightsMetricCard
                        title="Signatures completed"
                        metrics={metrics.signaturesCompleted}
                    />
                    <InsightsMetricCard
                        title="Playbook runs"
                        metrics={metrics.playbookRuns}
                    />
                    <InsightsMetricCard
                        title="Maestro queries"
                        metrics={metrics.monoQueries}
                    />
                    <InsightsTimeSavedCard metrics={metrics.timeSavedSeconds} />
                    <InsightsDocsInVaultCard total={metrics.docsInVaultTotal} />
                </div>
            )}
        </div>
    );
}

type MetricCardProps = {
    title: string;
    metrics: CountResult;
};

function InsightsMetricCard({ title, metrics }: MetricCardProps) {
    const { "7d": last7, "30d": last30 } = metrics;

    return (
        <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-background/60 p-4 text-xs">
            <div className="mb-2 text-[11px] font-medium uppercase text-muted-foreground">
                {title}
            </div>
            <div className="mb-1 text-2xl font-semibold">{last7}</div>
            <div className="text-[11px] text-muted-foreground">
                <span className="font-medium">{last30}</span> in the last 30 days
            </div>
        </div>
    );
}

type TimeSavedCardProps = {
    metrics: TimeSavedResult;
};

function InsightsTimeSavedCard({ metrics }: TimeSavedCardProps) {
    const seconds7 = metrics["7d"];
    const hours7 = seconds7 / 3600;

    return (
        <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-background/60 p-4 text-xs">
            <div className="mb-2 text-[11px] font-medium uppercase text-muted-foreground">
                Time saved (Playbooks)
            </div>
            <div className="mb-1 text-2xl font-semibold">
                {hours7.toFixed(1)} <span className="text-sm font-normal">hours</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
                Based on <span className="font-medium">{metrics["7d"]}</span> seconds logged
                in the last 7 days
            </div>
        </div>
    );
}

type DocsInVaultCardProps = {
    total: number;
};

function InsightsDocsInVaultCard({ total }: DocsInVaultCardProps) {
    return (
        <div className="flex flex-col justify-between rounded-lg border border-border/60 bg-background/60 p-4 text-xs">
            <div className="mb-2 text-[11px] font-medium uppercase text-muted-foreground">
                Docs in Vault
            </div>
            <div className="mb-1 text-2xl font-semibold">{total}</div>
            <div className="text-[11px] text-muted-foreground">
                Total managed documents in this workspace
            </div>
        </div>
    );
}

