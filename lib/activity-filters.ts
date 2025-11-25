// Week 8: Activity filters model + parsing helpers
//
// This file defines:
// - A canonical in-memory filter shape for Activity/Insights
// - Helpers to parse URL search params into that model
// - Helpers to serialize filters back to query strings
//
// /activity, CSV export endpoints, and Insights can all share this.

import type { ActivityEventType } from "./activity-events";

export type ActivityDateRangePreset = "7d" | "30d" | "all" | "custom";

export interface ActivityFilterState {
  // high-level preset for UI (last 7 days, last 30 days, all time, custom)
  datePreset: ActivityDateRangePreset;
  // explicit ISO timestamps when datePreset === "custom"
  from?: string;
  to?: string;

  eventTypes: ActivityEventType[];
  documentId?: string;
  source?: string;
  hasError?: boolean;
  search?: string;
}

export interface ParsedActivityFiltersToQuery {
  datePreset?: ActivityDateRangePreset;
  from?: string;
  to?: string;
  eventTypes?: ActivityEventType[];
  documentId?: string;
  source?: string;
  hasError?: boolean;
  search?: string;
}

// This is the shape we pass down into the ActivityLog query helper.
// It aligns with ActivityQueryFilters in lib/activity-log.ts.
export interface ActivityQueryFilters {
  from?: string;
  to?: string;
  eventTypes?: ActivityEventType[];
  documentId?: string;
  source?: string;
  hasError?: boolean;
  search?: string;
  limit?: number;
}

const DATE_PRESET_PARAM = "datePreset";
const FROM_PARAM = "from";
const TO_PARAM = "to";
const EVENT_TYPES_PARAM = "eventTypes";
const DOCUMENT_ID_PARAM = "documentId";
const SOURCE_PARAM = "source";
const HAS_ERROR_PARAM = "hasError";
const SEARCH_PARAM = "search";

function parseBooleanParam(value: string | null | undefined): boolean | undefined {
  if (value == null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function parseDatePreset(value: string | null | undefined): ActivityDateRangePreset {
  if (value === "7d" || value === "30d" || value === "all" || value === "custom") {
    return value;
  }
  // default: last 30 days
  return "30d";
}

function parseEventTypesParam(value: string | null | undefined): ActivityEventType[] {
  if (!value) return [];
  // eventTypes is encoded as comma-separated, e.g. "generate,save_to_vault"
  return value
    .split(",")
    .map((raw) => raw.trim())
    .filter((raw): raw is ActivityEventType => !!raw) as ActivityEventType[];
}

function encodeEventTypesParam(values: ActivityEventType[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(",");
}

export function parseActivityFiltersFromSearch(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): ActivityFilterState {
  const getParam = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  const datePreset = parseDatePreset(getParam(DATE_PRESET_PARAM));
  const from = getParam(FROM_PARAM) ?? undefined;
  const to = getParam(TO_PARAM) ?? undefined;
  const eventTypes = parseEventTypesParam(getParam(EVENT_TYPES_PARAM));
  const documentId = getParam(DOCUMENT_ID_PARAM) ?? undefined;
  const source = getParam(SOURCE_PARAM) ?? undefined;
  const hasError = parseBooleanParam(getParam(HAS_ERROR_PARAM));
  const search = getParam(SEARCH_PARAM) ?? undefined;

  return {
    datePreset,
    from,
    to,
    eventTypes,
    documentId,
    source,
    hasError,
    search,
  };
}

/**
 * Convert filter state into query params for URLs.
 */
export function serializeActivityFiltersToQuery(
  filters: ParsedActivityFiltersToQuery
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.datePreset) {
    params.set(DATE_PRESET_PARAM, filters.datePreset);
  }

  if (filters.from) {
    params.set(FROM_PARAM, filters.from);
  }

  if (filters.to) {
    params.set(TO_PARAM, filters.to);
  }

  const encodedEventTypes = encodeEventTypesParam(filters.eventTypes ?? []);
  if (encodedEventTypes) {
    params.set(EVENT_TYPES_PARAM, encodedEventTypes);
  }

  if (filters.documentId) {
    params.set(DOCUMENT_ID_PARAM, filters.documentId);
  }

  if (filters.source) {
    params.set(SOURCE_PARAM, filters.source);
  }

  if (typeof filters.hasError === "boolean") {
    params.set(HAS_ERROR_PARAM, filters.hasError ? "true" : "false");
  }

  if (filters.search) {
    params.set(SEARCH_PARAM, filters.search);
  }

  return params;
}

/**
 * Convert UI-level filter state into ActivityQueryFilters used by the
 * ActivityLog DB helper.
 *
 * NOTE: datePreset is interpreted here; concrete from/to boundaries are
 * expected to be applied at the caller (server or client) if needed.
 */
export function toActivityQueryFilters(
  state: ActivityFilterState,
  opts?: { limit?: number; now?: Date }
): ActivityQueryFilters {
  const limit = opts?.limit;
  const now = opts?.now ?? new Date();

  let from = state.from;
  let to = state.to;

  if (state.datePreset === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    from = d.toISOString();
    to = now.toISOString();
  } else if (state.datePreset === "30d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 30);
    from = d.toISOString();
    to = now.toISOString();
  } else if (state.datePreset === "all") {
    from = undefined;
    to = undefined;
  }

  return {
    from,
    to,
    eventTypes: state.eventTypes,
    documentId: state.documentId,
    source: state.source,
    hasError: state.hasError,
    search: state.search,
    limit,
  };
}

