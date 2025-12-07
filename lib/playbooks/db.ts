// Week 17 Day 1: Playbooks DB helpers
// Minimal helpers for playbook execution engine

import type { SupabaseLikeClient } from "../activity-log";
import type {
  Playbook,
  PlaybookRun,
  PlaybookRunStatus,
  PlaybookTrigger,
  PlaybookCondition,
  PlaybookAction,
} from "./types";

/**
 * Get all playbooks for an org (all statuses).
 * Returns playbooks where org_id = orgId, ordered by created_at desc.
 */
export async function getAllPlaybooksForOrg(
  client: SupabaseLikeClient,
  orgId: string,
): Promise<Playbook[]> {
  const { data, error } = await client
    .from("playbooks")
    .select(
      "id, org_id, name, trigger, conditions, actions, status, last_run_at, created_at, updated_at",
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch playbooks: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Map DB columns (snake_case) to camelCase domain types
  return data.map((row: {
    id: string;
    org_id: string;
    name: string;
    trigger: string;
    conditions: unknown;
    actions: unknown;
    status: string;
    created_at: string;
    updated_at: string;
    last_run_at: string | null;
  }) => ({
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    trigger: row.trigger as PlaybookTrigger,
    conditions: (row.conditions as unknown) as PlaybookCondition[],
    actions: (row.actions as unknown) as PlaybookAction[],
    status: row.status as Playbook["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastRunAt: row.last_run_at,
  }));
}

/**
 * Get active playbooks for an org and trigger.
 * Returns only playbooks where:
 * - org_id = orgId
 * - trigger = trigger
 * - status = 'active'
 */
export async function getActivePlaybooksForOrgAndTrigger(
  client: SupabaseLikeClient,
  orgId: string,
  trigger: PlaybookTrigger,
): Promise<Playbook[]> {
  const { data, error } = await client
    .from("playbooks")
    .select(
      "id, org_id, name, trigger, conditions, actions, status, last_run_at, created_at, updated_at",
    )
    .eq("org_id", orgId)
    .eq("trigger", trigger)
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to fetch active playbooks: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  // Map DB columns (snake_case) to camelCase domain types
  return data.map((row: {
    id: string;
    org_id: string;
    name: string;
    trigger: string;
    conditions: unknown;
    actions: unknown;
    status: string;
    created_at: string;
    updated_at: string;
    last_run_at: string | null;
  }) => ({
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    trigger: row.trigger as PlaybookTrigger,
    conditions: (row.conditions as unknown) as PlaybookCondition[],
    actions: (row.actions as unknown) as PlaybookAction[],
    status: row.status as Playbook["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastRunAt: row.last_run_at,
  }));
}

interface InsertPlaybookRunParams {
  client: SupabaseLikeClient;
  orgId: string;
  playbookId: string;
  triggerEvent: unknown;
  status: PlaybookRunStatus;
  error?: string | null;
  metrics?: Record<string, unknown>;
}

/**
 * Insert a new playbook run.
 * If status is "success", "failed", or "skipped", sets completed_at = now().
 */
export async function insertPlaybookRun(
  params: InsertPlaybookRunParams,
): Promise<PlaybookRun> {
  const { client, orgId, playbookId, triggerEvent, status, error, metrics } =
    params;

  const now = new Date().toISOString();
  const completedAt =
    status === "success" || status === "failed" || status === "skipped"
      ? now
      : null;

  const { data, insertError } = await client
    .from("playbook_runs")
    .insert({
      org_id: orgId,
      playbook_id: playbookId,
      trigger_event: triggerEvent,
      status,
      error: error ?? null,
      metrics: metrics ?? {},
      created_at: now,
      completed_at: completedAt,
    })
    .select("id, playbook_id, org_id, trigger_event, status, error, metrics, created_at, completed_at")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert playbook run: ${insertError.message}`);
  }

  if (!data) {
    throw new Error("Failed to insert playbook run: no data returned");
  }

  // Map DB columns (snake_case) to camelCase domain types
  return {
    id: data.id,
    playbookId: data.playbook_id,
    orgId: data.org_id,
    triggerEvent: data.trigger_event,
    status: data.status as PlaybookRunStatus,
    error: data.error,
    metrics: data.metrics as Record<string, unknown>,
    createdAt: data.created_at,
    completedAt: data.completed_at,
  };
}

