// Week 8: ActivityLog query helper
//
// This module centralizes ActivityLog querying logic so that:
// - /activity can use the same filters as CSV export
// - /insights can reuse the same base query when needed
//
// IMPORTANT:
// - This file does NOT create a Supabase client. Callers must inject one.
// - Callers are responsible for enforcing workspace / owner scoping.

import type { ActivityEventType } from "./activity-events";

// NOTE: keep this in sync with docs/ACTIVITY_EVENTS.md and the actual DB schema.
export interface ActivityLogRow {
  id: string;
  created_at: string;
  workspace_id: string;
  owner_id: string;
  document_id: string | null;
  share_link_id: string | null;
  playbook_run_id: string | null;
  connector_id: string | null;
  event_type: ActivityEventType | string;
  source: string | null;
  payload: any | null;
  error: any | null;
}

export interface ActivityQueryFilters {
  /**
   * ISO 8601 start of range (inclusive).
   * Example: "2025-11-01T00:00:00Z"
   */
  from?: string;

  /**
   * ISO 8601 end of range (exclusive or inclusive depending on use).
   * Example: "2025-11-30T23:59:59Z"
   */
  to?: string;

  /**
   * Restrict to a subset of event types.
   */
  eventTypes?: ActivityEventType[];

  /**
   * Filter by a specific document.
   */
  documentId?: string;

  /**
   * Filter by high-level source:
   * - "builder"
   * - "vault"
   * - "workbench"
   * - "share"
   * - "signatures"
   * - "playbooks"
   * - "connector"
   */
  source?: string;

  /**
   * If true, only events that have an error payload.
   * If false, only events without error.
   * If undefined, don't filter on error.
   */
  hasError?: boolean;

  /**
   * Simple search by document/file name, using payload metadata.
   * We assume payload.file_name or payload->>file_name is set for
   * save_to_vault / share related events.
   */
  search?: string;

  /**
   * Max rows to return. Keep this reasonable (eg 50–200) for UI.
   */
  limit?: number;
}

// Minimal shape we expect from a Supabase-like client for this helper.
// We keep it as `any` in practice to avoid coupling to a specific version.
export type SupabaseLikeClient = any;

const DEFAULT_ACTIVITY_LIMIT = 100;

/**
 * Build a Supabase query for ActivityLog with the given filters.
 *
 * Callers still need to execute the query (eg `.then(...)` or `await`).
 */
export function buildActivityLogQuery(
  supabase: SupabaseLikeClient,
  opts: {
    /**
     * Optional workspace scoping. If omitted, the query will not filter
     * on workspace_id and will return all matching events visible to the
     * underlying Supabase client (typically project-wide for dev).
     */
    workspaceId?: string;
    ownerId?: string;
    filters?: ActivityQueryFilters;
  }
) {
  const { workspaceId, ownerId, filters } = opts;

  let query = supabase
    .from("activity_log")
    // NOTE: adjust column list once you know exactly what the UI needs.
    .select("*")
    .order("created_at", { ascending: false });

  if (workspaceId) {
    query = query.eq("workspace_id", workspaceId);
  }

  if (ownerId) {
    query = query.eq("owner_id", ownerId);
  }

  if (!filters) {
    return query.limit(DEFAULT_ACTIVITY_LIMIT);
  }

  const {
    from,
    to,
    eventTypes,
    documentId,
    source,
    hasError,
    search,
    limit,
  } = filters;

  if (from) {
    query = query.gte("created_at", from);
  }

  if (to) {
    query = query.lte("created_at", to);
  }

  if (eventTypes && eventTypes.length > 0) {
    query = query.in("event_type", eventTypes);
  }

  if (documentId) {
    query = query.eq("document_id", documentId);
  }

  if (source) {
    query = query.eq("source", source);
  }

  if (typeof hasError === "boolean") {
    if (hasError) {
      query = query.not("error", "is", null);
    } else {
      query = query.is("error", null);
    }
  }

  if (search && search.trim().length > 0) {
    // Simple file name / title search via payload metadata.
    // This assumes payload->>file_name is populated for relevant events.
    const value = `%${search.trim()}%`;
    query = query.ilike("payload->>file_name", value);
  }

  query = query.limit(limit && limit > 0 ? limit : DEFAULT_ACTIVITY_LIMIT);

  return query;
}

/**
 * Convenience wrapper that executes the query and returns rows+error.
 *
 * This is useful for simple pages or API routes that don't need to
 * customize the select list.
 */
export async function fetchActivityLog(
  supabase: SupabaseLikeClient,
  opts: {
    workspaceId?: string;
    ownerId?: string;
    filters?: ActivityQueryFilters;
  }
): Promise<{ data: ActivityLogRow[] | null; error: any }> {
  const query = buildActivityLogQuery(supabase, opts);
  const { data, error } = await query;
  return { data: (data as ActivityLogRow[] | null) ?? null, error };
}

// ============================================================================
// Legacy logging functions (kept for backward compatibility)
// TODO: Migrate these to use the new ActivityEventType system
// ============================================================================

import { createServerSupabaseClient } from './supabase-server';
import { logServerError, logServerEvent } from './telemetry-server';

export type ActivityType =
  | 'vault_save'
  | 'share_created'
  | 'analyze_completed'
  | 'builder_generate'
  | 'doc_generated'
  | 'doc_saved_to_vault'
  | 'version_saved'
  | 'version_restore'
  | 'send_for_signature'
  | 'envelope_status_changed'
  | 'mono_query'
  | 'selftest'
  // Week 15 — Accounts Packs v1
  | 'accounts_pack_failure';

export interface LogActivityParams {
  orgId: string;
  userId?: string | null;
  type: ActivityType;
  documentId?: string | null;
  versionId?: string | null;
  unifiedItemId?: string | null;
  shareLinkId?: string | null;
  envelopeId?: string | null;
  context?: Record<string, unknown>;
  source?: string | null;
  triggerRoute?: string | null;
  durationMs?: number | null;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const supabase = createServerSupabaseClient();
  const {
    orgId,
    userId,
    type,
    documentId,
    versionId,
    unifiedItemId,
    shareLinkId,
    envelopeId,
    context,
    source,
    triggerRoute,
    durationMs,
  } = params;

  let unifiedItemIdToInsert: string | null = null;
  if (unifiedItemId) {
    try {
      const { data: unifiedItem, error: lookupError } = await supabase
        .from('unified_item')
        .select('id')
        .eq('id', unifiedItemId)
        .maybeSingle();
      if (lookupError || !unifiedItem) {
        unifiedItemIdToInsert = null;
      } else {
        unifiedItemIdToInsert = unifiedItemId;
      }
    } catch {
      unifiedItemIdToInsert = null;
    }
  }

  const enrichedContext: Record<string, unknown> = {
    ...(context ?? {}),
    ...(triggerRoute ? { trigger_route: triggerRoute } : {}),
    ...(durationMs !== null && durationMs !== undefined ? { duration_ms: durationMs } : {}),
    ...(source ? { source } : {}),
  };

  const { error, data } = await supabase.from('activity_log').insert({
    org_id: orgId,
    user_id: userId ?? null,
    type,
    document_id: documentId ?? null,
    version_id: versionId ?? null,
    unified_item_id: unifiedItemIdToInsert,
    share_link_id: shareLinkId ?? null,
    envelope_id: envelopeId ?? null,
    context: Object.keys(enrichedContext).length > 0 ? enrichedContext : null,
  }).select('id').single();

  if (error) {
    const errorMessage = `logActivity failed: ${error.message}`;
    console.error('[logActivity]', errorMessage, { orgId, userId, type, error });
    logServerError({
      event: "activity_log_write",
      userId,
      orgId,
      docId: unifiedItemIdToInsert ?? documentId ?? null,
      source: source ?? null,
      route: triggerRoute ?? null,
      properties: { action: type },
      error,
    });
    throw new Error(errorMessage);
  }

  if (!data) {
    const errorMessage = 'logActivity: insert succeeded but no data returned';
    console.error('[logActivity]', errorMessage);
    logServerError({
      event: "activity_log_write",
      userId,
      orgId,
      docId: unifiedItemIdToInsert ?? documentId ?? null,
      source: source ?? null,
      route: triggerRoute ?? null,
      properties: { action: type },
      error: new Error(errorMessage),
    });
    throw new Error(errorMessage);
  }

  logServerEvent({
    event: "activity_log_write",
    userId,
    orgId,
    docId: unifiedItemIdToInsert ?? documentId ?? null,
    source: source ?? null,
    route: triggerRoute ?? null,
    properties: { action: type },
  });
}

export async function logAnalyzeCompleted(params: {
  orgId: string;
  userId?: string | null;
  unifiedItemId?: string | null;
  documentId?: string | null;
  metadata?: Record<string, unknown>;
  source?: string | null;
  triggerRoute?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  await logActivity({
    orgId: params.orgId,
    userId: params.userId,
    type: 'analyze_completed',
    unifiedItemId: params.unifiedItemId,
    documentId: params.documentId,
    context: params.metadata,
    source: params.source,
    triggerRoute: params.triggerRoute,
    durationMs: params.durationMs,
  });
}

export async function logDocGenerated(params: {
  orgId: string;
  userId?: string | null;
  unifiedItemId?: string | null;
  documentId?: string | null;
  metadata?: Record<string, unknown>;
  source?: string | null;
  triggerRoute?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  await logActivity({
    orgId: params.orgId,
    userId: params.userId,
    type: 'doc_generated',
    unifiedItemId: params.unifiedItemId,
    documentId: params.documentId,
    context: params.metadata,
    source: params.source,
    triggerRoute: params.triggerRoute,
    durationMs: params.durationMs,
  });
}

export async function logDocSavedToVault(params: {
  orgId: string;
  userId?: string | null;
  unifiedItemId?: string | null;
  documentId?: string | null;
  metadata?: Record<string, unknown>;
  source?: string | null;
  triggerRoute?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  await logActivity({
    orgId: params.orgId,
    userId: params.userId,
    type: 'doc_saved_to_vault',
    unifiedItemId: params.unifiedItemId,
    documentId: params.documentId,
    context: params.metadata,
    source: params.source,
    triggerRoute: params.triggerRoute,
    durationMs: params.durationMs,
  });
}

export async function logMonoQuery(params: {
  orgId: string;
  userId?: string | null;
  ownerId?: string | null;
  message: string;
  context: Record<string, unknown>;
  source?: string | null;
  triggerRoute?: string | null;
  durationMs?: number | null;
}): Promise<void> {
  await logActivity({
    orgId: params.orgId,
    userId: params.userId,
    type: 'mono_query',
    context: {
      message: params.message,
      ...params.context,
    },
    source: params.source,
    triggerRoute: params.triggerRoute,
    durationMs: params.durationMs,
  });
}
