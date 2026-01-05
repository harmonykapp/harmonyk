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
  FileSignature,
  FileText,
  Link2,
  TrendingUp
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type InsightDocKind = "contract" | "deck" | "financial";

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
  lastActionAt: string; // ISO
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
    lastActionAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    source: "Workbench",
  },
  {
    id: "ins-002",
    title: "Seed Round Pitch Deck — v3",
    kind: "deck",
    counterparty: "Angel Syndicate",
    status: "no_response",
    lastAction: "opened",
    lastActionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    source: "Share Hub",
  },
  {
    id: "ins-003",
    title: "MSA — Beta Customer",
    kind: "contract",
    counterparty: "Beta Labs",
    status: "signed",
    lastAction: "signed",
    lastActionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    source: "Vault",
  },
  {
    id: "ins-004",
    title: "Q4 Board Update Deck",
    kind: "deck",
    counterparty: "Board",
    status: "draft",
    lastAction: "shared",
    lastActionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    source: "Workbench",
  },
  {
    id: "ins-005",
    title: "Monthly Financial Pack — Nov",
    kind: "financial",
    counterparty: "Investors",
    status: "signed",
    lastAction: "opened",
    lastActionAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    source: "Share Hub",
  },
];

function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return formatDate(date);
}

function getKindLabel(kind: InsightDocKind): string {
  switch (kind) {
    case "contract":
      return "Contract";
    case "deck":
      return "Deck";
    case "financial":
      return "Financial Pack";
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

  const now = Date.now();
  const days30Ms = 30 * 24 * 60 * 60 * 1000;

  const createdLast30 = activities.length;
  const sharedLast30 = activities.filter(
    (row) =>
      (row.lastAction === "shared" || row.lastAction === "opened") &&
      now - new Date(row.lastActionAt).getTime() <= days30Ms,
  ).length;
  const signedLast30 = activities.filter(
    (row) =>
      row.status === "signed" &&
      now - new Date(row.lastActionAt).getTime() <= days30Ms,
  ).length;
  const stuckDeals = activities.filter((row) => row.status === "no_response").length;

  const filteredRows =
    kindFilter === "all"
      ? activities
      : activities.filter((row) => row.kind === kindFilter);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
      {/* Summary cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Docs touched (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {createdLast30}
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Contracts, decks, and financial packs with recent activity.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Docs shared / opened</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {sharedLast30}
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Documents that left your workspace and saw external eyes.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Signed docs (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {signedLast30}
              <FileSignature className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Fully signed contracts and packs.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stuck deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stuckDeals}
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Links opened but with no recent response or signature.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + quick links */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit">
          <button
            type="button"
            onClick={() => setKindFilter("all")}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${kindFilter === "all" ? "bg-background text-foreground shadow-sm" : ""
              }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setKindFilter("contract")}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${kindFilter === "contract" ? "bg-background text-foreground shadow-sm" : ""
              }`}
          >
            Contracts
          </button>
          <button
            type="button"
            onClick={() => setKindFilter("deck")}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${kindFilter === "deck" ? "bg-background text-foreground shadow-sm" : ""
              }`}
          >
            Decks
          </button>
          <button
            type="button"
            onClick={() => setKindFilter("financial")}
            className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${kindFilter === "financial" ? "bg-background text-foreground shadow-sm" : ""
              }`}
          >
            Financials
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/workbench">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Open Workbench
            </Button>
          </Link>
          <Link href="/share">
            <Button variant="outline" size="sm">
              <Link2 className="h-4 w-4 mr-1" />
              Open Share Hub
            </Button>
          </Link>
          <Link href="/signatures">
            <Button size="sm">
              <FileSignature className="h-4 w-4 mr-1" />
              View signatures
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent activity table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent document activity</CardTitle>
          <CardDescription>
            A simple, read-only feed of key documents, where they came from, and what happened last.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No activity to show</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto text-sm">
                As we wire more telemetry into Insights, this feed will show live activity across
                your contracts, decks, and financials.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Counterparty</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last activity</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate">{row.title}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {getKindLabel(row.kind)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
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
                        className="text-xs"
                      >
                        {getStatusLabel(row.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.lastAction === "signed" ? "Signed" : "Last touched"}{" "}
                      <span className="whitespace-nowrap">
                        · {formatTimeAgo(row.lastActionAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.source}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Open in Workbench"
                        aria-label="Open in Workbench"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isDemoEnvironment && (
        <p className="text-[11px] text-muted-foreground">
          Demo data only. In production, this view will be backed by your real events and document
          telemetry.
        </p>
      )}
    </div>
  );
}
