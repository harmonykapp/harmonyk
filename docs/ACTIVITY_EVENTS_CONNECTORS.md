# Activity events – Connectors

This document defines the **connector-related ActivityLog events** introduced in Week 9.

> Once Connectors v1 is stable, these should be merged into the main `docs/ACTIVITY_EVENTS.md` reference.

---

## Naming convention

All connector events are prefixed with `connector_` and describe:

- **What** happened (connect, disconnect, sync, job).

- **Which** provider (eg. Google Drive, Gmail).

- **Which** account and job were affected.

---

## Connection lifecycle events

### `connector_connect_started`

Emitted when a user initiates a connector OAuth flow.

- `category`: `connector`

- `action`: `connect_started`

- `context`:

  - `provider: string` – eg. `'google_drive'`, `'gmail'`

  - `connector_account_id?: string` – may be absent on first connect

### `connector_connect_succeeded`

Emitted when OAuth completes and a `connector_accounts` row is created/updated.

- `category`: `connector`

- `action`: `connect_succeeded`

- `context`:

  - `provider: string`

  - `connector_account_id: string`

### `connector_connect_failed`

Emitted when OAuth fails or is cancelled.

- `category`: `connector`

- `action`: `connect_failed`

- `context`:

  - `provider: string`

  - `error_code?: string`

  - `error_message?: string`

### `connector_disconnect_succeeded`

Emitted when a user disconnects a connector account.

- `category`: `connector`

- `action`: `disconnect_succeeded`

- `context`:

  - `provider: string`

  - `connector_account_id: string`

---

## Sync lifecycle events

### `connector_sync_started`

- `category`: `connector`

- `action`: `sync_started`

- `context`:

  - `provider: string`

  - `connector_account_id: string`

  - `job_id: string`

  - `job_type: string` – eg. `'initial_sync'`, `'incremental_sync'`, `'gmail_import'`

### `connector_sync_completed`

- `category`: `connector`

- `action`: `sync_completed`

- `context`:

  - `provider: string`

  - `connector_account_id: string`

  - `job_id: string`

  - `job_type: string`

  - `files_imported: number`

  - `files_skipped: number`

### `connector_sync_failed`

- `category`: `connector`

- `action`: `sync_failed`

- `context`:

  - `provider: string`

  - `connector_account_id: string`

  - `job_id: string`

  - `job_type: string`

  - `error_code?: string`

  - `error_message?: string`

These events should appear on `/activity` under a "Connector" filter/chip, with human-readable descriptions.

