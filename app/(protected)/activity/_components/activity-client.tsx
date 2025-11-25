"use client";

// Week 8: Activity client UI
//
// This component:
// - Reads initial filters from the URL search params
// - Uses /api/activity/query to load events
// - Renders a simple filter bar + table
//
// It is intentionally self-contained so the server page can
// wrap it later with whatever workspace/user context is needed.

import {
  ACTIVITY_EVENT_TYPES,
  getActivityEventLabel,
  type ActivityEventType,
} from "@/lib/activity-events";
import {
  parseActivityFiltersFromSearch,
  toActivityQueryFilters,
  type ActivityFilterState,
} from "@/lib/activity-filters";
import type { ActivityLogRow } from "@/lib/activity-log";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

type Props = {
  workspaceId?: string;
  ownerId?: string;
  pageSize?: number;
};

type ActivityApiResponse =
  | { data: ActivityLogRow[]; error?: undefined }
  | { data?: undefined; error: { message: string; details?: unknown } };

const DEFAULT_PAGE_SIZE = 100;

export default function ActivityClient({ workspaceId, ownerId, pageSize }: Props) {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ActivityFilterState>(() =>
    parseActivityFiltersFromSearch(searchParams)
  );
  const [rawEvents, setRawEvents] = useState<ActivityLogRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveLimit = pageSize && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;

  // Derived list of event types for multi-select UI.
  const selectedEventTypes = filters.eventTypes ?? [];
  const isErrorOnly = filters.hasError === true;

  const visibleEvents = useMemo(() => {
    let list = rawEvents;

    if (selectedEventTypes && selectedEventTypes.length > 0) {
      const allowed = new Set<ActivityEventType>(selectedEventTypes);
      list = list.filter((row) => {
        // Normalize the row's event type to one of our canonical types.
        // If it's not recognized, treat it as "generate" – same fallback
        // behaviour we use when rendering the label.
        const rawType = row.event_type as ActivityEventType;
        const canonicalType: ActivityEventType = ACTIVITY_EVENT_TYPES.includes(rawType)
          ? rawType
          : "generate";

        return allowed.has(canonicalType);
      });
    }

    if (isErrorOnly) {
      list = list.filter((row) => !!row.error);
    }

    return list;
  }, [rawEvents, selectedEventTypes, isErrorOnly]);

  async function fetchActivity(currentFilters: ActivityFilterState) {
    setLoading(true);
    setError(null);

    try {
      const queryFilters = toActivityQueryFilters(currentFilters, {
        limit: effectiveLimit,
      });

      // For now we apply event-type and error-only filtering on the client only.
      // Strip eventTypes and hasError from the DB filters to avoid query errors.
      const {
        eventTypes: _ignoredEventTypes,
        hasError: _ignoredHasError,
        ...dbFilters
      } = queryFilters as any;

      const res = await fetch("/api/activity/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // workspaceId is optional; when omitted, API returns all-visible activity.
          workspaceId,
          ownerId,
          filters: dbFilters,
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as ActivityApiResponse | null;
        const msg =
          (json && "error" in json && json.error?.message) ||
          `Failed to load activity (${res.status})`;
        throw new Error(msg);
      }

      const json = (await res.json()) as { data: ActivityLogRow[] };
      setRawEvents(json.data ?? []);
    } catch (err: any) {
      console.error("[ActivityClient] fetchActivity error", err);
      setError(err?.message ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }

  async function handleExportCsv() {
    try {
      setError(null);
      const queryFilters = toActivityQueryFilters(filters, {
        // For exports we can afford a higher cap than the UI table.
        limit: effectiveLimit * 5,
      });

      // Same as above: DB-level filtering stays simple; event-type and
      // error-only filtering is done client-side for now, so we strip
      // eventTypes and hasError from the filters we send to export API.
      const {
        eventTypes: _ignoredEventTypes,
        hasError: _ignoredHasError,
        ...dbFilters
      } = queryFilters as any;

      const res = await fetch("/api/activity/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspaceId,
          ownerId,
          filters: dbFilters,
        }),
      });

      if (!res.ok) {
        let msg = `Failed to export activity (${res.status})`;
        try {
          const json = (await res.json()) as ActivityApiResponse;
          if (json && "error" in json && json.error?.message) {
            msg = json.error.message;
          }
        } catch {
          // ignore JSON parse errors, use default msg
        }
        throw new Error(msg);
      }

      const csvText = await res.text();
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "activity_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("[ActivityClient] handleExportCsv error", err);
      setError(err?.message ?? "Failed to export activity");
    } finally {
      setLoading(false);
    }
  }

  // Initial load on mount.
  useEffect(() => {
    fetchActivity(filters);
  }, [workspaceId, ownerId]);

  // When filters change, refetch.
  useEffect(() => {
    startTransition(() => {
      fetchActivity(filters);
    });
  }, [filters]);

  const onDatePresetChange = (value: ActivityFilterState["datePreset"]) => {
    setFilters((prev) => ({
      ...prev,
      datePreset: value,
      // When switching off "custom", clear explicit dates
      ...(value !== "custom" ? { from: undefined, to: undefined } : {}),
    }));
  };

  const onSearchChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
    }));
  };

  const onHasErrorChange = (value: boolean) => {
    setFilters((prev) => ({
      ...prev,
      hasError: value ? true : undefined,
    }));
  };

  const onToggleEventType = (eventType: ActivityEventType) => {
    setFilters((prev) => {
      const current = new Set(prev.eventTypes ?? []);
      if (current.has(eventType)) {
        current.delete(eventType);
      } else {
        current.add(eventType);
      }
      return {
        ...prev,
        eventTypes: Array.from(current),
      };
    });
  };

  const isLoading = loading || isPending;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/60 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Date range
            </span>
            <select
              className="min-w-[140px] rounded-md border px-2 py-1 text-sm"
              value={filters.datePreset}
              onChange={(e) =>
                onDatePresetChange(e.target.value as ActivityFilterState["datePreset"])
              }
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {filters.datePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  From
                </span>
                <input
                  type="datetime-local"
                  className="rounded-md border px-2 py-1 text-sm"
                  value={filters.from ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      from: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  To
                </span>
                <input
                  type="datetime-local"
                  className="rounded-md border px-2 py-1 text-sm"
                  value={filters.to ?? ""}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      to: e.target.value || undefined,
                    }))
                  }
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              Search (file name / title)
            </span>
            <input
              type="text"
              className="min-w-[200px] rounded-md border px-2 py-1 text-sm"
              placeholder="Search..."
              value={filters.search ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={filters.hasError === true}
              onChange={(e) => onHasErrorChange(e.target.checked)}
            />
            Only errors
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTIVITY_EVENT_TYPES.map((type) => {
            const selected = selectedEventTypes.includes(type);
            return (
              <button
                key={type}
                type="button"
                onClick={() => onToggleEventType(type)}
                className={[
                  "rounded-full border px-3 py-1 text-xs transition",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background hover:bg-muted",
                ].join(" ")}
              >
                {getActivityEventLabel(type)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-background/60">
        <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
          <span>
            {isLoading
              ? "Loading activity…"
              : `Showing ${visibleEvents.length} event${
                  visibleEvents.length === 1 ? "" : "s"
                }`}
          </span>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-md border border-border bg-background px-3 py-1 text-[11px] font-medium hover:bg-muted"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <div className="px-4 py-2 text-xs text-red-500">
            {error}
          </div>
        )}


        {!error && visibleEvents.length === 0 && !isLoading && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            No activity yet. Generate, save, share, or run a playbook to see events here.
          </div>
        )}

        {visibleEvents.length > 0 && (
          <div className="max-h-[480px] overflow-auto text-xs">
            <table className="min-w-full text-left">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Event</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Document</th>
                  <th className="px-3 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((row) => {
                  const eventType = row.event_type as ActivityEventType;
                  const label = getActivityEventLabel(
                    ACTIVITY_EVENT_TYPES.includes(eventType)
                      ? eventType
                      : ("generate" as ActivityEventType)
                  );

                  const payload = (row.payload ?? {}) as any;
                  const fileName =
                    payload.file_name ??
                    payload.document_title ??
                    payload.document_name ??
                    "";

                  const hasError = !!row.error;

                  return (
                    <tr key={row.id} className="border-t">
                      <td className="px-3 py-1 align-top">
                        {new Date(row.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-1 align-top">
                        <div className="font-medium">{label}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {row.event_type}
                        </div>
                      </td>
                      <td className="px-3 py-1 align-top">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {row.source ?? "unknown"}
                        </span>
                      </td>
                      <td className="px-3 py-1 align-top">
                        {fileName || row.document_id || "—"}
                      </td>
                      <td className="px-3 py-1 align-top">
                        {hasError ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-600">
                            Error
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

