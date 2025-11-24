"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Clock,
  Zap,
  Target,
  AlertCircle,
  RefreshCw,
  Download,
} from "lucide-react";

/**
 * Event row shape (extend as needed)
 */
type InsightEvent = {
  id: number;
  event_type: "view" | "download" | "share_created" | "envelope";
  created_at: string;
  doc_id: string | null;
  meta_json: Record<string, unknown>;
};

export default function InsightsPage() {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<InsightEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /**
   * Load events (memoized)
   */
  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    const { data, error } = await sb
      .from("events")
      .select("id, event_type, created_at, doc_id, meta_json")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      setErr(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows(data || []);
    setLoading(false);
  }, [sb]);

  /**
   * Initial load + lightweight polling while testing.
   */
  useEffect(() => {
    let cancelled = false;

    const kickOff = () => {
      if (!cancelled) void load();
    };

    const t0 = setTimeout(kickOff, 0);
    const interval = setInterval(kickOff, 3000);

    return () => {
      cancelled = true;
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, [load]);

  /** Render a short, safe preview of meta_json */
  function safePreview(obj: Record<string, unknown> | null | undefined): string {
    try {
      if (!obj) return "—";
      const s = JSON.stringify(obj);
      return s.length > 120 ? s.slice(0, 117) + "…" : s;
    } catch {
      return "—";
    }
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground mt-1">
            Analytics and intelligence about your document workflow
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/dev/insights/export" download>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </a>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rows.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map((r) => r.doc_id).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.filter((r) => {
                const eventDate = new Date(r.created_at);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return eventDate > dayAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Event Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(rows.map((r) => r.event_type)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique types</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
          <CardDescription>
            Detailed event history from your document workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          )}
          {!loading && err && (
            <div className="text-center py-8 text-destructive">Error: {err}</div>
          )}
          {!loading && !err && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Doc</TableHead>
                  <TableHead>Meta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No events yet
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.event_type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.doc_id ?? "—"}
                      </TableCell>
                      <TableCell className="max-w-[420px] truncate">
                        {safePreview(r.meta_json)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Week 7 Day 6 – Playbooks time-saved card */}
      <section>
        <PlaybooksTimeSavedCard />
      </section>
    </div>
  );
}

type PlaybooksSummary = {
  totalMinutes: number;
  runsCount: number;
  runsWithStats: number;
  runsWithoutStats: number;
};

function PlaybooksTimeSavedCard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PlaybooksSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/insights/playbooks-summary", {
          cache: "no-store",
        });

        const data = (await res.json().catch(() => null)) as
          | {
              ok?: boolean;
              message?: string;
              totalMinutes?: number;
              runsCount?: number;
              runsWithStats?: number;
              runsWithoutStats?: number;
            }
          | null;

        if (!res.ok || !data?.ok) {
          if (!cancelled) {
            setError(
              data?.message ??
                `Failed to load Playbooks insights (status ${res.status})`,
            );
            setLoading(false);
          }
          return;
        }

        if (!cancelled) {
          setSummary({
            totalMinutes: data.totalMinutes ?? 0,
            runsCount: data.runsCount ?? 0,
            runsWithStats: data.runsWithStats ?? 0,
            runsWithoutStats: data.runsWithoutStats ?? 0,
          });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : "Unexpected error loading insights.";
          setError(msg);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalMinutes = summary?.totalMinutes ?? 0;
  const runsCount = summary?.runsCount ?? 0;
  const hours = totalMinutes / 60;

  let headline = "—";
  if (totalMinutes > 0 && hours < 1) {
    headline = `${totalMinutes.toFixed(0)} min`;
  } else if (hours >= 1) {
    headline = `${hours.toFixed(1)} h`;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Playbooks – Time Saved (v1)</CardTitle>
        <CardDescription>
          Approximate time saved by Playbooks runs. v1 uses 5 minutes per run
          when detailed stats are not available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground">Loading Playbooks insights…</p>
        )}
        {error && !loading && (
          <p className="text-sm text-destructive">
            Failed to load Playbooks insights: {error}
          </p>
        )}
        {!loading && !error && (
          <div className="flex flex-col gap-2">
            <div className="text-3xl font-semibold">{headline}</div>
            <div className="text-xs text-muted-foreground">
              {runsCount === 0
                ? "No Playbook runs recorded yet."
                : `${runsCount} runs total · ${
                    summary?.runsWithStats ?? 0
                  } with detailed stats · ${
                    summary?.runsWithoutStats ?? 0
                  } using default estimate.`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
