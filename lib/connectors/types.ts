// Canonical connector types for Monolyth
// Mirrors docs/CONNECTORS_OVERVIEW.md and the 202511250900_connectors_v1.sql migration.
//
// All connector-related code (Drive, Gmail, future providers) should import
// these types instead of hard-coding string literals.

// --- Providers --------------------------------------------------------------

export type ConnectorProvider = "google_drive" | "gmail";

export const CONNECTOR_PROVIDERS: ConnectorProvider[] = [
  "google_drive",
  "gmail",
];

// --- Account status ---------------------------------------------------------

// Matches connector_accounts.status CHECK constraint
export type ConnectorAccountStatus =
  | "connected"
  | "error"
  | "revoked"
  | "disconnected";

export const CONNECTOR_ACCOUNT_STATUSES: ConnectorAccountStatus[] = [
  "connected",
  "error",
  "revoked",
  "disconnected",
];

// --- File sync status -------------------------------------------------------

// Matches connector_files.sync_status CHECK constraint
export type ConnectorFileSyncStatus =
  | "pending"
  | "synced"
  | "skipped"
  | "error";

export const CONNECTOR_FILE_SYNC_STATUSES: ConnectorFileSyncStatus[] = [
  "pending",
  "synced",
  "skipped",
  "error",
];

// --- Job status -------------------------------------------------------------

// Matches connector_jobs.status CHECK constraint
export type ConnectorJobStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export const CONNECTOR_JOB_STATUSES: ConnectorJobStatus[] = [
  "pending",
  "running",
  "success",
  "failed",
  "cancelled",
];

// --- Job types --------------------------------------------------------------

// v1 job types – keep in sync with docs/CONNECTORS_OVERVIEW.md
export type ConnectorJobType =
  | "initial_sync"
  | "incremental_sync"
  | "gmail_import";

export const CONNECTOR_JOB_TYPES: ConnectorJobType[] = [
  "initial_sync",
  "incremental_sync",
  "gmail_import",
];

// --- Activity events --------------------------------------------------------

// Connector-related ActivityLog event names.
// See docs/ACTIVITY_EVENTS_CONNECTORS.md for semantics.
export type ConnectorActivityEventName =
  | "connector_connect_started"
  | "connector_connect_succeeded"
  | "connector_connect_failed"
  | "connector_disconnect_succeeded"
  | "connector_disconnect_failed"
  | "connector_sync_started"
  | "connector_sync_completed"
  | "connector_sync_failed"
  | "connector_job_scheduled"
  | "connector_job_retried";

export const CONNECTOR_ACTIVITY_EVENT_NAMES: ConnectorActivityEventName[] = [
  "connector_connect_started",
  "connector_connect_succeeded",
  "connector_connect_failed",
  "connector_disconnect_succeeded",
  "connector_disconnect_failed",
  "connector_sync_started",
  "connector_sync_completed",
  "connector_sync_failed",
  "connector_job_scheduled",
  "connector_job_retried",
];

// --- Helper shapes ----------------------------------------------------------

export interface ConnectorAccountIdentifier {
  provider: ConnectorProvider;
  connectorAccountId: string;
}

export interface ConnectorJobIdentifier extends ConnectorAccountIdentifier {
  jobId: string;
  jobType: ConnectorJobType;
}

export interface ConnectorSyncResult {
  filesImported: number;
  filesSkipped: number;
}

export interface ConnectorErrorInfo {
  errorCode?: string;
  errorMessage?: string;
}

