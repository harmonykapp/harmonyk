// Week 17 Day 2: Playbooks execution engine
// Robust execution entrypoint for Playbooks with condition evaluation and action execution

import type { SupabaseLikeClient } from "../activity-log";
import { logActivity } from "../activity-log";
import {
  getActivePlaybooksForOrgAndTrigger,
  insertPlaybookRun,
} from "./db";
import type {
  Playbook,
  PlaybookTrigger,
  PlaybookCondition,
  PlaybookAction,
  PlaybookRunStatus,
} from "./types";

// =============================================================================
// PlaybookEvent type
// =============================================================================

export interface PlaybookEvent {
  trigger: PlaybookTrigger;
  payload: unknown;
}

// =============================================================================
// Nested value getter
// =============================================================================

/**
 * Safely read nested values from an object using dot-notation paths.
 * Returns undefined if obj is nullish or not an object along the way.
 */
function getValueByPath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined;
  }

  if (typeof obj !== "object") {
    return undefined;
  }

  const segments = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = obj;

  for (const segment of segments) {
    if (cursor === null || cursor === undefined) {
      return undefined;
    }

    if (typeof cursor !== "object") {
      return undefined;
    }

    cursor = cursor[segment];
  }

  return cursor;
}

// =============================================================================
// Condition evaluation
// =============================================================================

/**
 * Evaluate a single condition against an event payload.
 * Returns false for unknown operators (fail closed).
 */
export function evaluateCondition(
  condition: PlaybookCondition,
  eventPayload: unknown,
): boolean {
  const actual = getValueByPath(eventPayload, condition.field);

  switch (condition.op) {
    case "exists":
      return actual !== null && actual !== undefined;

    case "not_exists":
      return actual === null || actual === undefined;

    case "equals":
      return actual === condition.value;

    case "not_equals":
      return actual !== condition.value;

    case "gt": {
      if (typeof actual !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return actual > condition.value;
    }

    case "gte": {
      if (typeof actual !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return actual >= condition.value;
    }

    case "lt": {
      if (typeof actual !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return actual < condition.value;
    }

    case "lte": {
      if (typeof actual !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return actual <= condition.value;
    }

    case "includes": {
      if (typeof actual === "string" && typeof condition.value === "string") {
        return actual.includes(condition.value);
      }
      if (Array.isArray(actual)) {
        return actual.includes(condition.value);
      }
      return false;
    }

    case "not_includes": {
      if (typeof actual === "string" && typeof condition.value === "string") {
        return !actual.includes(condition.value);
      }
      if (Array.isArray(actual)) {
        return !actual.includes(condition.value);
      }
      return true; // not_includes is true when actual is not string/array
    }

    default:
      // Unknown operator: fail closed
      return false;
  }
}

/**
 * Evaluate all conditions. Returns true if conditions are null/undefined/empty.
 * Otherwise returns true only if every condition evaluates to true.
 */
export function evaluateConditions(
  conditions: PlaybookCondition[] | null | undefined,
  eventPayload: unknown,
): boolean {
  if (!conditions || conditions.length === 0) {
    return true;
  }

  return conditions.every((condition) =>
    evaluateCondition(condition, eventPayload),
  );
}

// =============================================================================
// Action execution
// =============================================================================

interface ExecuteActionParams {
  client: SupabaseLikeClient;
  orgId: string;
  playbook: Playbook;
  action: PlaybookAction;
  event: PlaybookEvent;
}

/**
 * Execute a single playbook action.
 * Never throws; all errors are logged via ActivityLog.
 */
async function executeAction(
  params: ExecuteActionParams,
): Promise<void> {
  const { client, orgId, playbook, action, event } = params;

  try {
    if (action.type === "log_activity") {
      const params = action.params ?? {};
      const logType =
        typeof params.type === "string" && params.type.length > 0
          ? params.type
          : "playbook_action_fired";

      // Extract type from params and merge rest into context
      const { type: _unusedType, ...restParams } = params as { type?: string; [key: string]: unknown };

      await logActivity({
        orgId,
        type: logType as Parameters<typeof logActivity>[0]["type"],
        source: "playbooks",
        context: {
          playbookId: playbook.id,
          playbookName: playbook.name,
          trigger: event.trigger,
          actionType: action.type,
          ...restParams,
        },
      });
    } else if (action.type === "enqueue_task") {
      // GA v1 behaviour: represent tasks as ActivityLog entries; a dedicated tasks queue
      // can be introduced later without changing Playbook definitions.
      await logActivity({
        orgId,
        type: "playbook_task_enqueued",
        source: "playbooks",
        context: {
          playbookId: playbook.id,
          playbookName: playbook.name,
          trigger: event.trigger,
          actionType: action.type,
          params: action.params ?? {},
        },
      });
    } else {
      // Unknown action type: log and continue
      await logActivity({
        orgId,
        type: "playbook_action_ignored",
        source: "playbooks",
        context: {
          playbookId: playbook.id,
          playbookName: playbook.name,
          trigger: event.trigger,
          actionType: action.type,
          reason: "unsupported_action_type",
        },
      });
    }
  } catch (err) {
    // Log action execution failure but don't throw
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logActivity({
      orgId,
      type: "playbook_action_ignored",
      source: "playbooks",
      context: {
        playbookId: playbook.id,
        playbookName: playbook.name,
        trigger: event.trigger,
        actionType: action.type,
        error: errorMessage,
        reason: "action_execution_failed",
      },
    }).catch(() => {
      // Ignore ActivityLog failures to prevent cascading errors
    });
  }
}

// =============================================================================
// Main entrypoint
// =============================================================================

interface RunPlaybooksForEventParams {
  client: SupabaseLikeClient;
  orgId: string;
  event: PlaybookEvent;
}

/**
 * Run all active playbooks for a given org and trigger event.
 * Never throws; all errors are captured and logged.
 */
export async function runPlaybooksForEvent(
  params: RunPlaybooksForEventParams,
): Promise<void> {
  const { client, orgId, event } = params;

  // Load active playbooks
  let playbooks: Playbook[];
  try {
    playbooks = await getActivePlaybooksForOrgAndTrigger(
      client,
      orgId,
      event.trigger,
    );
  } catch (err) {
    // Log load failure and return early
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logActivity({
      orgId,
      type: "playbooks_load_failed",
      source: "playbooks",
      context: {
        trigger: event.trigger,
        error: errorMessage,
      },
    }).catch(() => {
      // Ignore ActivityLog failures
    });
    return;
  }

  // If no playbooks, return early
  if (playbooks.length === 0) {
    return;
  }

  // Helper to extract common metrics including deck-related fields
  function extractCommonMetrics(
    playbook: Playbook,
    event: PlaybookEvent,
  ): Record<string, unknown> {
    const base = {
      actionsCount: playbook.actions.length,
      playbookName: playbook.name,
      trigger: event.trigger,
    };

    // If payload has activity.metadata.deck_category, include it
    const payload = event.payload;
    let deckCategory: string | undefined = undefined;
    if (
      payload &&
      typeof payload === "object" &&
      "activity" in payload
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activity = (payload as any).activity;
      if (
        activity &&
        typeof activity === "object" &&
        "metadata" in activity
      ) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const metadata = (activity as any).metadata;
        if (
          metadata &&
          typeof metadata === "object" &&
          "deck_category" in metadata &&
          typeof (metadata as any).deck_category === "string"
        ) {
          deckCategory = (metadata as any).deck_category;
        }
      }
    }

    if (deckCategory) {
      return {
        ...base,
        deckCategory,
      };
    }

    return base;
  }

  // Process each playbook
  for (const playbook of playbooks) {
    let status: PlaybookRunStatus = "pending";
    let error: string | null = null;

    try {
      // Evaluate conditions
      const conditionsMet = evaluateConditions(
        playbook.conditions,
        event.payload,
      );

      if (!conditionsMet) {
        // Conditions not met: skip
        status = "skipped";
        await insertPlaybookRun({
          client,
          orgId,
          playbookId: playbook.id,
          triggerEvent: event,
          status: "skipped",
          metrics: {
            reason: "conditions_not_met",
            ...extractCommonMetrics(playbook, event),
          },
        });
        continue;
      }

      // Conditions met: execute actions
      for (const action of playbook.actions) {
        await executeAction({
          client,
          orgId,
          playbook,
          action,
          event,
        });
      }

      // All actions executed successfully
      status = "success";
      await insertPlaybookRun({
        client,
        orgId,
        playbookId: playbook.id,
        triggerEvent: event,
        status: "success",
        metrics: extractCommonMetrics(playbook, event),
      });
    } catch (err) {
      // Capture error
      status = "failed";
      error = err instanceof Error ? err.message : String(err);

      // Insert failed run
      try {
        await insertPlaybookRun({
          client,
          orgId,
          playbookId: playbook.id,
          triggerEvent: event,
          status: "failed",
          error,
          metrics: extractCommonMetrics(playbook, event),
        });
      } catch (insertErr) {
        // Log insert failure but don't throw
        const insertErrorMsg =
          insertErr instanceof Error ? insertErr.message : String(insertErr);
        await logActivity({
          orgId,
          type: "playbook_run_failed",
          source: "playbooks",
          context: {
            playbookId: playbook.id,
            playbookName: playbook.name,
            trigger: event.trigger,
            error: insertErrorMsg,
            reason: "playbook_run_insert_failed",
          },
        }).catch(() => {
          // Ignore ActivityLog failures
        });
      }

      // Log playbook run failure
      await logActivity({
        orgId,
        type: "playbook_run_failed",
        source: "playbooks",
        context: {
          playbookId: playbook.id,
          playbookName: playbook.name,
          trigger: event.trigger,
          error,
        },
      }).catch(() => {
        // Ignore ActivityLog failures
      });
    }
  }
}

// =============================================================================
// Dry-run helpers
// =============================================================================

/**
 * Build a sample event for a playbook based on its trigger and conditions.
 * Used for dry-run simulations.
 */
function buildSampleEventForPlaybook(playbook: Playbook): PlaybookEvent {
  if (playbook.trigger === "activity_event") {
    // Check if playbook name or conditions suggest contracts
    const nameLower = playbook.name.toLowerCase();
    const hasContractHint =
      nameLower.includes("contract") ||
      playbook.conditions.some(
        (c) =>
          c.field.includes("days_until_renewal") ||
          c.field.includes("contract") ||
          (c.field === "activity.type" &&
            (c.value === "contract_signed" ||
              (typeof c.value === "string" &&
                c.value.toLowerCase().includes("contract")))),
      );

    // Check if playbook name or conditions suggest decks
    const hasDeckHint =
      nameLower.includes("deck") ||
      playbook.conditions.some(
        (c) =>
          c.field.includes("deck_category") ||
          c.field.includes("deck_") ||
          (c.field === "activity.type" &&
            (typeof c.value === "string" &&
              (c.value.startsWith("deck_") ||
                c.value.toLowerCase().includes("deck")))),
      );

    if (hasContractHint) {
      return {
        trigger: "activity_event",
        payload: {
          activity: {
            type: "contract_signed",
            metadata: {
              status: "active",
              days_until_renewal: 30,
            },
          },
        },
      };
    }

    if (hasDeckHint) {
      return {
        trigger: "activity_event",
        payload: {
          activity: {
            type: "deck_saved_to_vault",
            metadata: {
              deck_category: "fundraising",
            },
          },
        },
      };
    }

    // Generic activity event
    return {
      trigger: "activity_event",
      payload: {
        activity: {
          type: "playbook_sample_event",
          metadata: {},
        },
      },
    };
  }

  if (playbook.trigger === "accounts_pack_run") {
    return {
      trigger: "accounts_pack_run",
      payload: {
        metrics: {
          pack_type: "investor_accounts_snapshot",
          runway_months: 3,
          monthly_burn: 50000,
        },
      },
    };
  }

  // Fallback for unknown triggers
  return {
    trigger: playbook.trigger,
    payload: {},
  };
}

export interface PlaybookDryRunConditionResult {
  field: string;
  op: PlaybookCondition["op"];
  value?: unknown;
  passed: boolean;
}

export interface PlaybookDryRunResult {
  playbookId: string;
  sampleEvent: PlaybookEvent;
  conditions: PlaybookDryRunConditionResult[];
  willRunActions: boolean;
  actions: PlaybookAction[];
}

/**
 * Perform a dry-run simulation of a playbook.
 * This is a pure function that does not write to DB or ActivityLog.
 */
export function dryRunPlaybook(playbook: Playbook): PlaybookDryRunResult {
  const sampleEvent = buildSampleEventForPlaybook(playbook);
  const conditions = (playbook.conditions ?? []).map((condition) => {
    const passed = evaluateCondition(condition, sampleEvent.payload);
    return {
      field: condition.field,
      op: condition.op,
      value: condition.value,
      passed,
    };
  });
  const willRunActions = evaluateConditions(
    playbook.conditions,
    sampleEvent.payload,
  );
  return {
    playbookId: playbook.id,
    sampleEvent,
    conditions,
    willRunActions,
    actions: playbook.actions,
  };
}

