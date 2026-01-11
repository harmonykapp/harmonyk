"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  ArrowUpRight,
  Eye,
  FileSignature,
  FileText,
  Link2,
  TrendingUp,
  Users
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { WidgetCard } from "@/components/widgets/WidgetCard";
import { cn } from "@/lib/utils";

type InsightDocKind = "contract" | "deck" | "financial" | "whitepaper";

type InsightStatus =
  | "draft"
  | "out_for_signature"
  | "signed"
  | "no_response";

type InsightLastAction = "shared" | "opened" | "signed" | "stuck";

type InsightRow = {
  id: string;
  title: string;
  kind: InsightDocKind;
  counterparty: string;
  status: InsightStatus;
  lastAction: InsightLastAction;
  lastActionAt: string;
  source: "Vault" | "Workbench" | "Share Hub";
};

const isDemoEnvironment = process.env.NODE_ENV !== "production";

const DEMO_INSIGHTS: InsightRow[] = [
  {
    id: "ins-001",
    title: "NDA — ACME & Harmonyk",
    kind: "contract",
    counterparty: "ACME Corp",
    status: "out_for_signature",
    lastAction: "shared",
    lastActionAt: "2 hours ago",
    source: "Workbench",
  },
  {
    id: "ins-002",
    title: "Seed Round Pitch Deck — v3",
    kind: "deck",
    counterparty: "Angel Syndicate",
    status: "no_response",
    lastAction: "opened",
    lastActionAt: "3 days ago",
    source: "Share Hub",
  },
  {
    id: "ins-003",
    title: "MSA — Beta Customer",
    kind: "contract",
    counterparty: "Beta Labs",
    status: "signed",
    lastAction: "signed",
    lastActionAt: "5 days ago",
    source: "Vault",
  },
  {
    id: "ins-004",
    title: "Q4 Board Update Deck",
    kind: "deck",
    counterparty: "Board",
    status: "draft",
    lastAction: "shared",
    lastActionAt: "1 day ago",
    source: "Workbench",
  },
  {
    id: "ins-005",
    title: "Monthly Financial Pack — Nov",
    kind: "financial",
    counterparty: "Investors",
    status: "signed",
    lastAction: "opened",
    lastActionAt: "7 days ago",
    source: "Share Hub",
  },
];

const STATIC_ENGAGEMENT_BARS = [
  45, 62, 54, 70, 58, 48, 65, 72, 68, 55,
  60, 75, 52, 68, 78, 65, 58, 70, 64, 72,
  68, 55, 62, 74, 66, 58, 70, 75, 68, 62
];

function getKindLabel(kind: InsightDocKind): string {
  switch (kind) {
    case "contract":
      return "Contract";
    case "deck":
      return "Deck";
    case "financial":
      return "Financial Pack";
    case "whitepaper":
      return "Whitepaper";
  }
}

function getStatusLabel(status: InsightStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "out_for_signature":
      return "Out for signature";
    case "signed":
      return "Signed";
    case "no_response":
      return "No response";
  }
}

export default function InsightsPage() {
  const baseActivities = isDemoEnvironment ? DEMO_INSIGHTS : [];
  const [kindFilter, setKindFilter] = useState<"all" | InsightDocKind>("all");

  const activities = baseActivities;

  const createdLast30 = activities.length;
  const sharedLast30 = activities.filter(
    (row) => row.lastAction === "shared" || row.lastAction === "opened"
  ).length;
  const signedLast30 = activities.filter((row) => row.status === "signed").length;
  const stuckDeals = activities.filter((row) => row.status === "no_response").length;

  const filteredRows =
    kindFilter === "all"
      ? activities
      : activities.filter((row) => row.kind === kindFilter);

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Row 1: Four S KPI cards (150px height) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Open Shares" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{createdLast30}</div>
              <div className="text-xs text-muted-foreground mt-1">Active share links</div>
            </div>
          </WidgetCard>
        </div>
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Views (30d)" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{sharedLast30 * 12}</div>
              <div className="text-xs text-muted-foreground mt-1">Total views</div>
            </div>
          </WidgetCard>
        </div>
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Unique Viewers" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{sharedLast30 * 3}</div>
              <div className="text-xs text-muted-foreground mt-1">Individual viewers</div>
            </div>
          </WidgetCard>
        </div>
        <div className="md:col-span-3" style={{ height: "150px" }}>
          <WidgetCard title="Pending Signatures" className="h-full">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-2xl font-semibold tracking-tight">{activities.filter(a => a.status === "out_for_signature").length}</div>
              <div className="text-xs text-muted-foreground mt-1">Awaiting signature</div>
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* Row 2: L + M + M widgets (280px height) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-[70px]">
        <div className="md:col-span-6" style={{ height: "280px" }}>
          <WidgetCard title="Engagement Trend" subtitle="Last 30 days" className="h-[280px]">
            <div className="h-full flex items-end justify-between gap-1 pb-4">
              {STATIC_ENGAGEMENT_BARS.map((value, i) => {
                const height = (value / 100) * 180;
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

        <div className="md:col-span-3" style={{ height: "280px" }}>
          <WidgetCard title="Doc Type Mix" subtitle="Distribution" className="h-[280px]">
            <div className="h-full flex items-center justify-center">
              <div className="relative" style={{ width: "160px", height: "160px" }}>
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-blue-400/40"
                    strokeDasharray="75 251"
                    strokeDashoffset="0"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-emerald-400/40"
                    strokeDasharray="63 251"
                    strokeDashoffset="-75"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-amber-400/40"
                    strokeDasharray="50 251"
                    strokeDashoffset="-138"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-slate-400/30"
                    strokeDasharray="63 251"
                    strokeDashoffset="-188"
                  />
                </svg>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-400/40" />
                <span>Decks</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
                <span>Contracts</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-400/40" />
                <span>Accounts</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400/30" />
                <span>Whitepapers</span>
              </div>
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-3" style={{ height: "280px" }}>
          <WidgetCard title="Conversion" subtitle="Funnel stages" className="h-[280px]">
            <div className="h-full flex flex-col justify-center gap-3 py-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Viewed</span>
                  <span className="font-medium">{sharedLast30 * 12}</span>
                </div>
                <div className="h-2 bg-blue-400/40 rounded-full" style={{ width: "100%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Follow-up</span>
                  <span className="font-medium">{Math.floor(sharedLast30 * 8)}</span>
                </div>
                <div className="h-2 bg-emerald-400/40 rounded-full" style={{ width: "67%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Review</span>
                  <span className="font-medium">{Math.floor(sharedLast30 * 5)}</span>
                </div>
                <div className="h-2 bg-amber-400/40 rounded-full" style={{ width: "42%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Signed</span>
                  <span className="font-medium">{signedLast30}</span>
                </div>
                <div className="h-2 bg-slate-400/30 rounded-full" style={{ width: "25%" }} />
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* Row 3: M + M + M widgets (all 280px height) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-[70px]">
        <div className="md:col-span-4">
          <WidgetCard title="Top Share Links" subtitle="Most viewed" footer={<button className="text-xs hover:underline">View all →</button>} className="h-[280px]">
            <div className="space-y-2">
              {activities.slice(0, 4).map((item, idx) => (
                <div key={item.id} className="flex items-start justify-between gap-2 p-2 rounded border border-border/40">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.counterparty}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Eye className="h-3 w-3" />
                    {(idx + 1) * 12}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No shares yet
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-4">
          <WidgetCard title="At-Risk Shares" subtitle="Needs attention" footer={<button className="text-xs hover:underline">View all →</button>} className="h-[280px]">
            <div className="space-y-2">
              {activities
                .filter(a => a.status === "no_response" || a.status === "out_for_signature")
                .slice(0, 4)
                .map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-2 p-2 rounded border border-amber-400/40 bg-amber-50/50 dark:bg-amber-950/10">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.lastActionAt}</div>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  </div>
                ))}
              {activities.filter(a => a.status === "no_response" || a.status === "out_for_signature").length === 0 && (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  All clear
                </div>
              )}
            </div>
          </WidgetCard>
        </div>

        <div className="md:col-span-4">
          <WidgetCard title="Time to Outcome" subtitle="Median days by stage" className="h-[280px]">
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Share → First View</span>
                  <span className="font-medium">2.3d</span>
                </div>
                <div className="h-6 bg-blue-400/40 rounded" style={{ width: "25%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">View → Follow-up</span>
                  <span className="font-medium">4.7d</span>
                </div>
                <div className="h-6 bg-emerald-400/40 rounded" style={{ width: "47%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Follow-up → Review</span>
                  <span className="font-medium">6.2d</span>
                </div>
                <div className="h-6 bg-amber-400/40 rounded" style={{ width: "62%" }} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Review → Signed</span>
                  <span className="font-medium">8.9d</span>
                </div>
                <div className="h-6 bg-slate-400/30 rounded" style={{ width: "89%" }} />
              </div>
            </div>
          </WidgetCard>
        </div>
      </div>

      {/* Recent Document Activity Section - separated with explicit margin */}
      <section className="mt-[70px]">
        {/* Filters + quick links */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit">
            <button
              type="button"
              onClick={() => setKindFilter("all")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all",
                kindFilter === "all" && "bg-background text-foreground shadow-sm"
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("contract")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all",
                kindFilter === "contract" && "bg-background text-foreground shadow-sm"
              )}
            >
              Contracts
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("deck")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all",
                kindFilter === "deck" && "bg-background text-foreground shadow-sm"
              )}
            >
              Decks
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("financial")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all",
                kindFilter === "financial" && "bg-background text-foreground shadow-sm"
              )}
            >
              Financials
            </button>
            <button
              type="button"
              onClick={() => setKindFilter("whitepaper")}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1 text-xs font-medium ring-offset-background transition-all",
                kindFilter === "whitepaper" && "bg-background text-foreground shadow-sm"
              )}
            >
              Whitepapers
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/workbench">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-1" />
                Workbench
              </Button>
            </Link>
            <Link href="/share">
              <Button variant="outline" size="sm">
                <Link2 className="h-4 w-4 mr-1" />
                Share Hub
              </Button>
            </Link>
            <Link href="/signatures">
              <Button variant="outline" size="sm">
                <FileSignature className="h-4 w-4 mr-1" />
                Signatures
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent activity table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Document Activity</CardTitle>
            <CardDescription className="text-xs">
              Key documents and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredRows.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold mb-1">No activity to show</h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Activity will appear here as you work with documents
                </p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Document</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Counterparty</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Last activity</TableHead>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs text-right">Open</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium max-w-xs text-xs">
                          <div className="truncate">{row.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {getKindLabel(row.kind)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.counterparty}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              row.status === "signed"
                                ? "secondary"
                                : row.status === "no_response"
                                  ? "outline"
                                  : "outline"
                            }
                            className="text-[10px]"
                          >
                            {getStatusLabel(row.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="whitespace-nowrap">
                            {row.lastActionAt}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {row.source}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Open in Workbench"
                            aria-label="Open in Workbench"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {isDemoEnvironment && (
        <p className="text-[10px] text-muted-foreground">
          Demo data only. In production, this view will be backed by real events and document telemetry.
        </p>
      )}
    </div>
  );
}
