"use client";

// Week 11 Day 3: Activity client UI v1 (URL-sync without useSearchParams)
//
// This component:
// - Uses the new GET /api/activity endpoint
// - Supports event group filters (Docs, Maestro, Connectors, Signatures, System)
// - Supports time range presets (24h, 7d, 30d)
// - Supports provider filter when Connectors is selected
// - Implements cursor-based pagination

import type { ActivityLogRow } from "@/lib/activity-log";
import type { ActivityEventGroup } from "@/lib/activity-queries";
import { phCapture } from "@/lib/posthog-client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type Props = {
  workspaceId?: string;
  ownerId?: string;
};

type ActivityApiResponse =
  | { data: ActivityLogRow[]; nextCursor: string | null; error?: undefined }
  | { data?: undefined; nextCursor?: undefined; error: string };

type TimeRangePreset = "24h" | "7d" | "30d";

// UI supports "maestro" as the modern group key, while the API still accepts legacy "mono".
type UiEventGroup = ActivityEventGroup | "maestro";

interface ActivityFilterState {
  timeRange: TimeRangePreset;
  groups: UiEventGroup[];
  provider?: string;
  search?: string;
}

const DEFAULT_LIMIT = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeUiGroupId(id: string): UiEventGroup | null {
  const trimmed = id.trim();
  if (!trimmed) return null;
  // Back-compat: old URLs/saved state may contain "mono"
  if (trimmed === "mono") return "maestro";
  // Allow any existing API group ids through unchanged
  return trimmed as UiEventGroup;
}

function toApiGroupId(group: UiEventGroup): ActivityEventGroup {
  // Server/API still expects "mono" for Maestro group filtering.
  return group === "maestro" ? "mono" : group;
}

function normalizeEventTypeLabel(rawEventType: string): string {
  const canonical = rawEventType
    .trim()
    .toLowerCase()
    .replace(/[.\- ]+/g, "_");

  // Back-compat: old activity event types may still use "mono_*"
  if (canonical === "mono_query" || canonical === "monoquery" || canonical === "mono_query_v1") {
    return "Maestro Query";
  }
  if (canonical.startsWith("mono_") && canonical.includes("query")) {
    return "Maestro Query";
  }

  return rawEventType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l: string) => l.toUpperCase());
}

function readActivitySearchParamsFromLocation(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}

function shallowEqualFilters(a: ActivityFilterState, b: ActivityFilterState): boolean {
  if (a.timeRange !== b.timeRange) return false;
  if ((a.provider ?? "") !== (b.provider ?? "")) return false;
  if ((a.search ?? "") !== (b.search ?? "")) return false;
  if (a.groups.length !== b.groups.length) return false;
  // Order matters for stable URL; we preserve user order. Compare as-is.
  for (let i = 0; i < a.groups.length; i++) {
    if (a.groups[i] !== b.groups[i]) return false;
  }
  return true;
}

function buildSearchParamsFromFilters(filters: ActivityFilterState): URLSearchParams {
  const params = new URLSearchParams();

  // Only persist non-defaults / non-empty values to keep URLs clean.
  if (filters.timeRange && filters.timeRange !== "7d") params.set("timeRange", filters.timeRange);
  if (filters.groups.length > 0) params.set("groups", filters.groups.join(","));
  if (filters.provider) params.set("provider", filters.provider);
  if (filters.search) params.set("search", filters.search);

  return params;
}

// Helper to convert time range preset to ISO timestamps
function getTimeRangeBounds(preset: TimeRangePreset): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from = new Date(now); // Initialize with fallback value

  switch (preset) {
    case "24h":
      from.setHours(from.getHours() - 24);
      break;
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    default:
      // Fallback to 7d if unexpected preset value
      from.setDate(from.getDate() - 7);
      break;
  }

  return { from: from.toISOString(), to };
}

// Parse filters from URL search params
function parseFiltersFromSearch(searchParams: URLSearchParams): ActivityFilterState {
  const timeRange = (searchParams.get("timeRange") as TimeRangePreset) || "7d";
  const groupsParam = searchParams.get("groups");
  const groups: UiEventGroup[] = groupsParam
    ? groupsParam
      .split(",")
      .map((g) => normalizeUiGroupId(g))
      .filter((g): g is UiEventGroup => g != null)
    : [];
  const provider = searchParams.get("provider") || undefined;
  const search = searchParams.get("search") || undefined;

  return { timeRange, groups, provider, search };
}

export default function ActivityClient({ workspaceId, ownerId }: Props) {
  const hasTrackedPageView = useRef(false);
  const prevFiltersRef = useRef<ActivityFilterState | null>(null);
  const hasSyncedFromUrlOnce = useRef(false);
  const suppressNextUrlWrite = useRef(false);

  const [filters, setFilters] = useState<ActivityFilterState>(() => {
    // Must be SSR-safe: window may not exist during pre-render.
    if (typeof window === "undefined") {
      return { timeRange: "7d", groups: [], provider: undefined, search: undefined };
    }
    return parseFiltersFromSearch(readActivitySearchParamsFromLocation());
  });
  const [events, setEvents] = useState<ActivityLogRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize groups join to prevent unnecessary reruns
  const groupsKey = useMemo(() => filters.groups.join(","), [filters.groups]);

  // URL -> state (initial sync + back/forward). Avoid useSearchParams() to prevent CSR bailout warnings.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncFromUrl = () => {
      const next = parseFiltersFromSearch(readActivitySearchParamsFromLocation());
      setFilters((prev) => {
        if (shallowEqualFilters(prev, next)) return prev;
        // We are applying URL-driven state, so avoid writing it straight back.
        suppressNextUrlWrite.current = true;
        return next;
      });
      hasSyncedFromUrlOnce.current = true;
    };

    // First mount sync
    syncFromUrl();

    // Back/forward
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  // state -> URL (replaceState). Keeps deep-links stable; no navigation, no UI changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasSyncedFromUrlOnce.current) return;

    if (suppressNextUrlWrite.current) {
      suppressNextUrlWrite.current = false;
      return;
    }

    try {
      const params = buildSearchParamsFromFilters(filters);
      const qs = params.toString();
      const nextUrl = qs.length > 0 ? `${window.location.pathname}?${qs}` : window.location.pathname;
      const current = window.location.pathname + window.location.search;
      if (nextUrl !== current) {
        window.history.replaceState({}, "", nextUrl);
      }
    } catch {
      // ignore
    }
  }, [filters.timeRange, groupsKey, filters.provider, filters.search]);

  async function fetchActivity(cursor?: string, append = false) {
    setLoading(true);
    setError(null);

    try {
      const { from, to } = getTimeRangeBounds(filters.timeRange);

      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      if (filters.groups.length > 0) {
        const apiGroups = filters.groups.map(toApiGroupId);
        params.set("groups", apiGroups.join(","));
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
    } catch (err: unknown) {
      console.error("[ActivityClient] fetchActivity error", err);
      const msg = err instanceof Error ? err.message : "Failed to load activity";
      setError(msg);
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
        groupsKey !== (prev.groups.join(",") || "") ||
        prev.provider !== filters.provider ||
        prev.search !== filters.search;

      if (changed) {
        phCapture("activity_filters_changed", {
          timeRange: filters.timeRange,
          groups: filters.groups,
          provider: filters.provider,
          search: filters.search,
        });
      }
    }
    prevFiltersRef.current = { ...filters };
  }, [filters.timeRange, groupsKey, filters.provider, filters.search]);

  // Initial load and refetch when filters change
  useEffect(() => {
    startTransition(() => {
      fetchActivity();
    });
  }, [filters.timeRange, groupsKey, filters.provider, filters.search]);

  const handleLoadMore = () => {
    if (nextCursor && !loading) {
      fetchActivity(nextCursor, true);
    }
  };

  const toggleGroup = (group: UiEventGroup) => {
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

  const eventGroups: { id: UiEventGroup; label: string }[] = [
    { id: "docs", label: "Docs" },
    { id: "maestro", label: "Maestro" },
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
                    const rowMaybe = row as unknown as {
                      type?: unknown;
                      event_type?: unknown;
                      context?: unknown;
                      payload?: unknown;
                    };

                    // The API returns 'type' field, not 'event_type' (but we tolerate both).
                    const rawEventType =
                      typeof rowMaybe.type === "string"
                        ? rowMaybe.type
                        : typeof rowMaybe.event_type === "string"
                          ? rowMaybe.event_type
                          : typeof row.event_type === "string"
                            ? row.event_type
                            : "unknown";

                    const context = isRecord(rowMaybe.context)
                      ? rowMaybe.context
                      : isRecord(rowMaybe.payload)
                        ? rowMaybe.payload
                        : {};

                    const fileName =
                      (typeof context.file_name === "string" && context.file_name) ||
                      (typeof context.document_title === "string" && context.document_title) ||
                      (typeof context.document_name === "string" && context.document_name) ||
                      "";

                    const humanizedType = normalizeEventTypeLabel(rawEventType);

                    // Determine relevant links based on event data
                    const hasDocumentId = row.document_id != null;
                    const isSignatureEvent =
                      (row.source ?? "").toLowerCase().includes("signature") ||
                      rawEventType.toLowerCase().includes("signature") ||
                      rawEventType.toLowerCase().includes("envelope");
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
                          <div className="font-medium text-xs max-w-[200px] truncate" title={rawEventType}>
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
