// Week 7 Day 1: core Playbooks types used by API + UI
// Legacy types are kept for compatibility with early Week 7 endpoints.
// New code should prefer the normalized types defined later in this file.

// Legacy types - deprecated, use normalized types below
export type PlaybookStatusLegacy = 'draft' | 'enabled' | 'disabled';

export type PlaybookRunStatusLegacy = 'started' | 'completed' | 'failed' | 'dry_run';

export type PlaybookStepStatus =
  | 'pending'
  | 'started'
  | 'completed'
  | 'skipped'
  | 'failed';

export type PlaybookTriggerType = 'manual' | 'event';

export type PlaybookEventTrigger =
  | 'share_link_created'
  | 'signature_completed';

export interface PlaybookScope {
  // One of: selection, folder, tag, saved_view, or global.
  mode: 'selection' | 'folder' | 'tag' | 'saved_view' | 'global';
  // Optional identifiers depending on mode.
  folderId?: string;
  tagId?: string;
  savedViewId?: string;
}

export interface PlaybookStep {
  idx: number;
  type: 'trigger' | 'condition' | 'action' | 'wait' | 'retry';
  kind: string; // e.g. "inbound_nda", "age_greater_than_days", "send_signature"
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface PlaybookDefinition {
  trigger: {
    type: PlaybookTriggerType;
    event?: PlaybookEventTrigger;
  };
  steps: PlaybookStep[];
}

// Old Playbook interface - deprecated, use normalized Playbook below
export interface PlaybookLegacy {
  id: string;
  ownerId: string;
  name: string;
  status: PlaybookStatus;
  scope: PlaybookScope;
  definition: PlaybookDefinition;
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookRunStats {
  // Example metrics; extend as Insights evolves.
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  // Rough estimate in seconds of time saved by this run.
  timeSavedSeconds?: number;
}

// Old PlaybookRun interface - deprecated, use normalized PlaybookRun below
export interface PlaybookRunLegacy {
  id: string;
  playbookId: string;
  status: PlaybookRunStatus;
  startedAt: string;
  completedAt: string | null;
  stats: PlaybookRunStats;
}

export interface PlaybookStepRecord {
  id: string;
  runId: string;
  stepIdx: number;
  type: PlaybookStep['type'];
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: PlaybookStepStatus;
  startedAt: string | null;
  completedAt: string | null;
}

// =============================================================================
// Week 17 Day 1: Normalized Playbooks types for GA
// Week 17 Day 1: Playbooks schema and types stabilized for GA
// =============================================================================

export type PlaybookTrigger = "activity_event" | "accounts_pack_run";

export type PlaybookActionType = "log_activity" | "enqueue_task";

export type PlaybookStatus = "active" | "inactive" | "archived";

export type PlaybookRunStatus = "pending" | "success" | "failed" | "skipped";

// Week 17 Day 2: Condition operators
export type PlaybookConditionOp =
  | "equals"
  | "not_equals"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "includes"
  | "not_includes"
  | "exists"
  | "not_exists";

// Week 17 Day 2: Condition DSL
export interface PlaybookCondition {
  field: string; // dot-notation path into event payload (e.g. "activity.type", "metrics.runway_months")
  op: PlaybookConditionOp;
  value?: unknown; // not required for exists / not_exists
}

// Week 17 Day 2: Action DSL
export interface PlaybookAction {
  type: PlaybookActionType;
  params?: Record<string, unknown>;
}

export interface Playbook {
  id: string;
  orgId: string;
  name: string;
  trigger: PlaybookTrigger;
  conditions: PlaybookCondition[];
  actions: PlaybookAction[];
  status: PlaybookStatus;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
}

export interface PlaybookRun {
  id: string;
  playbookId: string;
  orgId: string;
  triggerEvent: unknown;
  status: PlaybookRunStatus;
  error: string | null;
  metrics: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

