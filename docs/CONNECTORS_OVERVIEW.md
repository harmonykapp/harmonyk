# Connectors v1 – Overview

> Week 9 goal: make Drive import trustworthy, observable, and safe; add an optional, feature-flagged Gmail path without destabilising the core app.

This document defines the **Connectors v1** architecture for Monolyth:

- Which services we support first.
- The data model in Postgres/Supabase.
- How connector jobs run and are retried.
- Which ActivityLog events we emit so Insights can reason about connectors later.

---

## 1. Supported services (v1)

For Week 9 we treat connectors as:

- **Google Drive** – primary, must be robust.

- **Gmail** – optional, behind a feature flag, minimal metadata-only import.

Future services (eg. OneDrive, Dropbox, Slack) should follow the same patterns:

- Exactly one **connector_account** per user ↔ external account pairing.
- Jobs tracked via **connector_jobs**.
- Imported items normalised and linked into Vault via **connector_files**.

---

## 2. Data model (DB schema)

All connector tables live in the `public` schema.

### 2.1 `connector_accounts`

Represents a single user ↔ provider account (eg. Adam's Google Drive).

**Table:** `public.connector_accounts`

**Columns (v1):**

- `id :: uuid` – PK, default `gen_random_uuid()`.

- `user_id :: uuid` – FK → `auth.users.id` (or our `profiles.id`), **NOT NULL**.

- `provider :: text` – eg. `'google_drive'`, `'gmail'`, **NOT NULL**.

- `provider_account_id :: text` – opaque external ID (eg. Google `sub`), **NOT NULL**.

- `display_name :: text` – something like `adam.weigold@gmail.com`.

- `status :: text` – `'connected' | 'error' | 'revoked' | 'disconnected'` (CHECK constraint).

- `last_sync_at :: timestamptz` – last successful sync completion.

- `last_error_at :: timestamptz` – last failure time (if any).

- `last_error_message :: text` – short human-readable error snippet.

- `created_at :: timestamptz` – default `now()`.

- `updated_at :: timestamptz` – default `now()`.

- `metadata :: jsonb` – provider-specific metadata (scopes, locale, etc.).

> **Note:** Refresh/access tokens should be stored in an encrypted store / KMS or in an encrypted column – we keep the DB structure generic and encryption is handled at the application layer.

**Uniqueness:**

- `UNIQUE (user_id, provider)` – one active account per provider per user in v1.

### 2.2 `connector_jobs`

Represents one sync or import job for a given connector account.

**Table:** `public.connector_jobs`

**Columns (v1):**

- `id :: uuid` – PK, default `gen_random_uuid()`.

- `connector_account_id :: uuid` – FK → `connector_accounts.id`, **NOT NULL**.

- `job_type :: text` – eg. `'initial_sync'`, `'incremental_sync'`, `'gmail_import'`.

- `status :: text` – `'pending' | 'running' | 'success' | 'failed' | 'cancelled'`.

- `scheduled_at :: timestamptz` – when the job was enqueued.

- `started_at :: timestamptz` – when processing actually began.

- `finished_at :: timestamptz` – when processing finished (success or failure).

- `attempts :: integer` – how many tries so far (default `0`).

- `max_attempts :: integer` – ceiling for retries (default `5`).

- `backoff_seconds :: integer` – current backoff duration (exponential policy).

- `last_error_message :: text` – final or most recent error snippet.

- `payload :: jsonb` – small job configuration or cursor (eg. Drive page token, Gmail label).

- `created_at :: timestamptz` – default `now()`.

Indexes:

- `CREATE INDEX ON connector_jobs (connector_account_id);`

- `CREATE INDEX ON connector_jobs (status, scheduled_at);`

### 2.3 `connector_files`

Represents the relationship between an external item and our Vault.

**Table:** `public.connector_files`

**Columns (v1):**

- `id :: uuid` – PK, default `gen_random_uuid()`.

- `connector_account_id :: uuid` – FK → `connector_accounts.id`, **NOT NULL**.

- `provider :: text` – eg. `'google_drive'`, `'gmail'`, **NOT NULL`.

- `provider_file_id :: text` – provider's stable ID for the file/message, **NOT NULL**.

- `vault_document_id :: uuid` – FK → `vault_documents.id` (or equivalent), nullable if not yet imported.

- `path :: text` – logical path or folder hint (eg. `/Contracts/2025/`), best-effort.

- `name :: text` – file name or subject line.

- `mime_type :: text` – MIME type if applicable.

- `size_bytes :: bigint` – approximate size.

- `modified_at :: timestamptz` – provider's last modified time.

- `sync_status :: text` – `'pending' | 'synced' | 'skipped' | 'error'`.

- `last_sync_job_id :: uuid` – FK → `connector_jobs.id`, nullable.

- `created_at :: timestamptz` – default `now()`.

- `updated_at :: timestamptz` – default `now()`.

Indexes:

- `UNIQUE (connector_account_id, provider_file_id)` – prevents duplicates.

- `CREATE INDEX ON connector_files (vault_document_id);`

---

## 3. ActivityLog events (connectors)

Connectors must emit structured ActivityLog events so:

- `/activity` can show connector-related actions.

- `/insights` can derive metrics later (eg. "X files imported from Drive this week").

Connector-related events (namespaced under `connector_*`):

### Connection lifecycle

- `connector_connect_started`

  - `context`: `{ provider, connector_account_id }`

- `connector_connect_succeeded`

  - `context`: `{ provider, connector_account_id }`

- `connector_connect_failed`

  - `context`: `{ provider, connector_account_id, error_code?, error_message? }`

- `connector_disconnect_started`

  - `context`: `{ provider, connector_account_id }`

- `connector_disconnect_succeeded`

  - `context`: `{ provider, connector_account_id }`

- `connector_disconnect_failed`

  - `context`: `{ provider, connector_account_id, error_code?, error_message? }`

### Sync & import lifecycle

- `connector_sync_started`

  - `context`: `{ provider, connector_account_id, job_id, job_type }`

- `connector_sync_completed`

  - `context`: `{ provider, connector_account_id, job_id, job_type, files_imported, files_skipped }`

- `connector_sync_failed`

  - `context`: `{ provider, connector_account_id, job_id, job_type, error_code?, error_message? }`

Optional extended events (for retries / backoff):

- `connector_job_scheduled`

  - `context`: `{ provider, connector_account_id, job_id, job_type, scheduled_at }`

- `connector_job_retried`

  - `context`: `{ provider, connector_account_id, job_id, job_type, attempts, max_attempts }`

> Implementation note: these events should be surfaced in `/activity` using a "Connector" chip/filter and reasonable human-readable descriptions (eg. "Google Drive sync completed – 37 files imported").

---

## 4. Data flow – Google Drive (v1)

High-level flow for Drive:

1. **User connects Drive**

   - User hits "Connect Google Drive" on `/integrations`.

   - We run OAuth and create a `connector_accounts` row with `status = 'connected'`.

   - Emit `connector_connect_*` events as appropriate.

2. **Initial sync job**

   - Create `connector_jobs` row: `job_type = 'initial_sync'`, `status = 'pending'`.

   - Background worker (Edge Function / server action) picks it up, marks `status = 'running'`.

   - Fetch recent Drive files (with sensible limits).

   - For each, upsert into `connector_files` and optionally map to `vault_documents`.

   - On success: `status = 'success'`, set `finished_at`, update `last_sync_at` on account.

   - Emit `connector_sync_started` / `connector_sync_completed` events.

3. **Incremental sync**

   - Same pattern, but with `job_type = 'incremental_sync'` and Drive page tokens stored in `payload`.

4. **Error handling**

   - On transient errors (rate limits, timeouts), update `connector_jobs` with incremented `attempts`, `backoff_seconds`, and reschedule.

   - On permanent errors (invalid_grant, revoked tokens), set `status = 'failed'`, mark `connector_accounts.status = 'error'` and capture `last_error_message`.

   - Emit `connector_sync_failed` + `connector_job_retried` where appropriate.

---

## 5. Gmail (optional, feature-flagged)

Gmail v1 is **metadata-only**:

- We ingest a small batch of recent messages (eg. label = "Contracts").

- We create `connector_files` rows with:

  - `provider = 'gmail'`

  - `name = subject`

  - `path` representing label/folder.

  - `vault_document_id` optionally set if/when we pull attachments into Vault.

- We log all jobs via `connector_jobs` and ActivityLog events using the same schema.

Gmail should be behind a feature flag so we can disable it safely in production while Drive matures.

---

## 6. Next steps (later days in Week 9)

- Wire up the **Drive connector service module** to this data model.

- Implement server routes for connect / disconnect / "sync now".

- Surface connector state, last sync and errors on the Integrations UI.

- Ensure ActivityLog surfaces connector events and filters cleanly.

This file is the source of truth for future connector implementations.

