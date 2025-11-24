// Week 7 Day 1: core Playbooks types used by API + UI

export type PlaybookStatus = 'draft' | 'enabled' | 'disabled';

export type PlaybookRunStatus = 'started' | 'completed' | 'failed' | 'dry_run';

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

export interface Playbook {
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

export interface PlaybookRun {
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

