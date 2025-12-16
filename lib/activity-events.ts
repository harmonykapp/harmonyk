// Canonical ActivityLog event types for Harmonyk.
// Week 8: used by Activity + Insights.
//
// IMPORTANT:
// - Only use these strings when writing to activity_log.event_type.
// - If you add a new event type, update this file AND docs/ACTIVITY_EVENTS.md.

export const ACTIVITY_EVENT_TYPES = [
  // Builder & Analyze
  "generate",
  "analyze",
  "save_to_vault",

  // Share & Signatures
  "share_link_created",
  "share_link_accessed",
  "signature_request_sent",
  "signature_completed",

  // Playbooks
  "playbook_run_started",
  "playbook_run_completed",
  "playbook_run_failed",

  // Maestro / AI
  "mono_query",

  // Connectors
  "connector_sync_started",
  "connector_sync_completed",
  "connector_sync_failed",

  // Accounts Packs
  "accounts_pack_success",
  "accounts_pack_failure",
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

// Optional: human-readable labels for UI chips / filters.
export const ACTIVITY_EVENT_LABELS: Record<ActivityEventType, string> = {
  // Builder & Analyze
  generate: "Docs generated",
  analyze: "Docs analyzed",
  save_to_vault: "Saved to Vault",

  // Share & Signatures
  share_link_created: "Share links created",
  share_link_accessed: "Share links opened",
  signature_request_sent: "Signature requests sent",
  signature_completed: "Signatures completed",

  // Playbooks
  playbook_run_started: "Playbook runs started",
  playbook_run_completed: "Playbook runs completed",
  playbook_run_failed: "Playbook runs failed",

  // Maestro / AI
  mono_query: "Maestro queries",

  // Connectors
  connector_sync_started: "Connector syncs started",
  connector_sync_completed: "Connector syncs completed",
  connector_sync_failed: "Connector syncs failed",

  // Accounts Packs
  accounts_pack_success: "Accounts pack run succeeded",
  accounts_pack_failure: "Accounts pack run failed",
};

/**
 * Quick guard to validate unknown strings before inserting into activity_log.
 */
export function isActivityEventType(value: string): value is ActivityEventType {
  return (ACTIVITY_EVENT_TYPES as readonly string[]).includes(value);
}

/**
 * Helper to safely get a label; falls back to the raw event type.
 */
export function getActivityEventLabel(eventType: ActivityEventType): string {
  return ACTIVITY_EVENT_LABELS[eventType] ?? eventType;
}

