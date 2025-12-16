"use client";

// Week 11 Day 3: Activity client UI v1
//
// This component:
// - Uses the new GET /api/activity endpoint
// - Supports event group filters (Docs, Mono, Connectors, Signatures, System)
// - Supports time range presets (24h, 7d, 30d)
// - Supports provider filter when Connectors is selected
// - Implements cursor-based pagination

import type { ActivityEventGroup } from "@/lib/activity-queries";
import type { ActivityLogRow } from "@/lib/activity-log";
import { phCapture } from "@/lib/posthog-client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, useRef } from "react";
import Link from "next/link";

type Props = {
  workspaceId?: string;
  ownerId?: string;
};

type ActivityApiResponse =
  | { data: ActivityLogRow[]; nextCursor: string | null; error?: undefined }
  | { data?: undefined; nextCursor?: undefined; error: string };

type TimeRangePreset = "24h" | "7d" | "30d";

interface ActivityFilterState {
  timeRange: TimeRangePreset;
  groups: ActivityEventGroup[];
  provider?: string;
  search?: string;
}

const DEFAULT_LIMIT = 50;

// Helper to convert time range preset to ISO timestamps
function getTimeRangeBounds(preset: TimeRangePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;

  switch (preset) {
    case "24h":
      from = new Date(now);
      from.setHours(from.getHours() - 24);
      break;
    case "7d":
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from = new Date(now);
      from.setDate(from.getDate() - 30);
      break;
  }

  return { from: from.toISOString(), to };
}

// Parse filters from URL search params
function parseFiltersFromSearch(searchParams: URLSearchParams): ActivityFilterState {
  const timeRange = (searchParams.get("timeRange") as TimeRangePreset) || "7d";
  const groupsParam = searchParams.get("groups");
  const groups: ActivityEventGroup[] = groupsParam
    ? (groupsParam.split(",").filter(Boolean) as ActivityEventGroup[])
    : [];
  const provider = searchParams.get("provider") || undefined;
  const search = searchParams.get("search") || undefined;

  return { timeRange, groups, provider, search };
}

export default function ActivityClient({ workspaceId, ownerId }: Props) {
  const searchParams = useSearchParams();
  const hasTrackedPageView = useRef(false);
  const prevFiltersRef = useRef<ActivityFilterState | null>(null);

  const [filters, setFilters] = useState<ActivityFilterState>(() =>
    parseFiltersFromSearch(searchParams)
  );
  const [events, setEvents] = useState<ActivityLogRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchActivity(cursor?: string, append = false) {
    setLoading(true);
    setError(null);

    try {
      const { from, to } = getTimeRangeBounds(filters.timeRange);

      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      if (filters.groups.length > 0) {
        params.set("groups", filters.groups.join(","));
      }
      if (filters.provider) {
        params.set("provider", filters.provider);
      }
      if (filters.search) {
        params.set("search", filters.search);
      }
      params.set("limit", String(DEFAULT_LIMIT));
      if (cursor) {
        params.set("cursor", cursor);
      }

      const res = await fetch(`/api/activity?${params.toString()}`);

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as ActivityApiResponse | null;
        const msg = json?.error || `Failed to load activity (${res.status})`;
        throw new Error(msg);
      }

      const json = (await res.json()) as ActivityApiResponse;
      if (json.error) {
        throw new Error(json.error);
      }

      if (append) {
        setEvents((prev) => [...prev, ...(json.data ?? [])]);
      } else {
        setEvents(json.data ?? []);
      }
      setNextCursor(json.nextCursor ?? null);
    } catch (err: any) {
      console.error("[ActivityClient] fetchActivity error", err);
      setError(err?.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  // Track page view on mount
  useEffect(() => {
    if (!hasTrackedPageView.current) {
      phCapture("activity_page_view", {
        workspaceId,
        ownerId,
      });
      hasTrackedPageView.current = true;
      prevFiltersRef.current = { ...filters };
    }
  }, []);

  // Track filter changes
  useEffect(() => {
    if (prevFiltersRef.current && hasTrackedPageView.current) {
      const prev = prevFiltersRef.current;
      const changed =
        prev.timeRange !== filters.timeRange ||
        prev.groups.join(",") !== filters.groups.join(",") ||
        prev.provider !== filters.provider;

      if (changed) {
        phCapture("activity_filters_changed", {
          timeRange: filters.timeRange,
          groups: filters.groups,
          provider: filters.provider,
        });
      }
    }
    prevFiltersRef.current = { ...filters };
  }, [filters.timeRange, filters.groups.join(","), filters.provider]);

  // Initial load and refetch when filters change
  useEffect(() => {
    startTransition(() => {
      fetchActivity();
    });
  }, [filters.timeRange, filters.groups.join(","), filters.provider, filters.search]);

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      fetchActivity(nextCursor, true);
    }
  };

  const toggleGroup = (group: ActivityEventGroup) => {
    setFilters((prev) => {
      const newGroups = prev.groups.includes(group)
        ? prev.groups.filter((g) => g !== group)
        : [...prev.groups, group];
      return {
        ...prev,
        groups: newGroups,
        // Clear provider when Connectors is deselected
        provider: newGroups.includes("connectors") ? prev.provider : undefined,
      };
    });
  };

  const setProvider = (provider: string | undefined) => {
    setFilters((prev) => ({ ...prev, provider }));
  };

  const setSearch = (search: string) => {
    const trimmed = search.trim();
    setFilters((prev) => ({ ...prev, search: trimmed || undefined }));
    
    // Track search submission
    if (trimmed.length > 0) {
      phCapture("activity_search_submitted", {
        search: trimmed,
        hasGroups: filters.groups.length > 0,
        groups: filters.groups,
      });
    }
  };

  const setTimeRange = (timeRange: TimeRangePreset) => {
    setFilters((prev) => ({ ...prev, timeRange }));
  };

  const isLoading = loading || isPending;

  const eventGroups: { id: ActivityEventGroup; label: string }[] = [
    { id: "docs", label: "Docs" },
    { id: "mono", label: "Mono" },
    { id: "connectors", label: "Connectors" },
    { id: "signatures", label: "Signatures" },
    { id: "system", label: "System" },
  ];

  const providers = [
    { id: "google_drive", label: "Drive" },
    { id: "gmail", label: "Gmail" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/60 p-4">
        {/* Time Range */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Time range
          </span>
          <div className="flex flex-wrap gap-2">
            {(["24h", "7d", "30d"] as TimeRangePreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTimeRange(preset)}
                className={[
                  "rounded-md border px-3 py-1 text-xs transition whitespace-nowrap",
                  filters.timeRange === preset
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                {preset === "24h" ? "Last 24 hours" : preset === "7d" ? "Last 7 days" : "Last 30 days"}
              </button>
            ))}
          </div>
        </div>

        {/* Event Groups */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Event groups
          </span>
          <div className="flex flex-wrap gap-2">
            {eventGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={[
                  "rounded-full border px-3 py-1 text-xs transition whitespace-nowrap",
                  filters.groups.includes(group.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        {/* Provider Filter (only when Connectors is selected) */}
        {filters.groups.includes("connectors") && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Provider
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProvider(undefined)}
                className={[
                  "rounded-md border px-3 py-1 text-xs transition",
                  !filters.provider
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                All
              </button>
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => setProvider(provider.id)}
                  className={[
                    "rounded-md border px-3 py-1 text-xs transition",
                    filters.provider === provider.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:bg-muted",
                  ].join(" ")}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase text-muted-foreground">
            Search
          </span>
          <input
            type="text"
            className="min-w-[200px] rounded-md border px-2 py-1 text-sm"
            placeholder="Search events..."
            value={filters.search ?? ""}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Activity Table */}
      <div className="rounded-lg border border-border/60 bg-background/60">
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
          <span>
            {isLoading
              ? "Loading activity…"
              : `Showing ${events.length} event${events.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {error && (
          <div className="px-4 py-3 border-b border-red-200 bg-red-50/50">
            <p className="text-xs font-medium text-red-600">Error loading activity</p>
            <p className="mt-1 text-xs text-red-500">{error}</p>
          </div>
        )}

        {!error && events.length === 0 && !isLoading && (
          <div className="px-4 py-8 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <p className="text-sm text-muted-foreground mb-2">
                Activity shows a log of what you and Harmonyk are doing with your docs.
              </p>
              {filters.groups.length > 0 || filters.search ? (
                <p className="text-xs text-muted-foreground">
                  No events match your current filters. Try adjusting your search or event groups.
                </p>
              ) : (
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Generate a contract or deck to see activity appear here.</p>
                  <p>Save a document to Vault.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <>
            <div className="max-h-[480px] overflow-x-auto text-xs">
              <table className="min-w-full text-left">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">When</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">Event</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">Source</th>
                    <th className="px-3 py-2 font-medium whitespace-nowrap">Context</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((row) => {
                    // The API returns 'type' field, not 'event_type'
                    const eventType = ((row as any).type || row.event_type || "unknown") as string;
                    const context = ((row as any).context ?? row.payload ?? {}) as any;
                    const fileName =
                      context.file_name ??
                      context.document_title ??
                      context.document_name ??
                      "";
                    
                    // Humanize event type for display
                    const humanizedType = eventType
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase());

                    // Determine relevant links based on event data
                    const hasDocumentId = row.document_id != null;
                    const isSignatureEvent = 
                      (row.source ?? "").toLowerCase().includes("signature") ||
                      eventType.toLowerCase().includes("signature") ||
                      eventType.toLowerCase().includes("envelope");
                    const docId = row.document_id;

                    return (
                      <tr key={row.id} className="border-t hover:bg-muted/50 transition-colors">
                        <td className="px-3 py-2 align-top whitespace-nowrap">
                          <div className="text-[11px] text-muted-foreground">
                            {new Date(row.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(row.created_at).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="font-medium text-xs max-w-[200px] truncate" title={eventType}>
                            {humanizedType}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground max-w-[120px] truncate" title={row.source ?? "unknown"}>
                            {row.source ?? "unknown"}
                          </span>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <div className="max-w-[200px] truncate text-xs space-y-1">
                            {hasDocumentId || fileName ? (
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="truncate" title={fileName || docId || undefined}>
                                  {fileName || docId || "—"}
                                </span>
                                {hasDocumentId && (
                                  <Link
                                    href="/vault"
                                    className="text-primary hover:underline text-[10px] whitespace-nowrap"
                                    title="View document in Vault"
                                  >
                                    View Doc
                                  </Link>
                                )}
                                {isSignatureEvent && (
                                  <Link
                                    href="/signatures"
                                    className="text-primary hover:underline text-[10px] whitespace-nowrap"
                                    title="View signature details"
                                  >
                                    Signatures
                                  </Link>
                                )}
                              </div>
                            ) : (
                              "—"
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {nextCursor && (
              <div className="border-t px-4 py-3">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="w-full rounded-md border border-border bg-background px-4 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
