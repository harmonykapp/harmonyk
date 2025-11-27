# Connectors Overview (v1)

This document describes the initial connector model for Monolyth, focused on:

- **Google Drive** (v1)

- **Optional Gmail** (feature-flagged)

The design is **metadata-first**: we ingest and normalise external metadata into

connector tables and/or Vault, then let Insights, Playbooks, and Mono build on

top of that.

---

## 1. Data Model

Three core tables back all connectors:

### `connector_accounts`

Represents a single external account (e.g. a Google Drive install) owned by an

org or user.

- `id uuid` – primary key

- `owner_id uuid` – owning org/user (app code decides which)

- `provider text` – e.g. `google_drive`, `gmail`

- `status text` – `connected | disconnected | error | pending`

- `token_json jsonb` – OAuth tokens and provider-specific auth state

- `created_at timestamptz`

- `updated_at timestamptz`

### `connector_jobs`

Tracks sync/import executions so we can observe, retry, and debug.

- `id uuid` – primary key

- `account_id uuid` – FK → `connector_accounts.id`

- `kind text` – e.g. `drive_import`, `gmail_import`

- `status text` – `pending | running | completed | failed`

- `started_at timestamptz`

- `finished_at timestamptz`

- `attempts int`

- `last_error text`

- `meta_json jsonb` – free-form job metadata (limits, filters, counters)

- `created_at timestamptz`

### `connector_files`

Normalised metadata for fetched items (files, threads, messages) from external

providers.

- `id uuid` – primary key

- `account_id uuid` – FK → `connector_accounts.id`

- `provider text` – redundant but convenient filter

- `external_id text` – provider id (e.g. Drive file id, Gmail message id)

- `title text`

- `mime text`

- `size bigint`

- `modified_at timestamptz`

- `url text` – web view URL if available

- `meta_json jsonb` – provider raw payload (owners, labels, attachment info)

- `created_at timestamptz`

`(account_id, external_id)` is unique per provider.

---

## 2. Google Drive – v1

Drive is the first-class connector in v1.

### 2.1 Auth Flow

- User connects Drive from `/integrations`.

- We create or update a `connector_accounts` row with:

  - `provider = 'google_drive'`

  - `status` derived from auth result (`connected` / `error`)

  - `token_json` containing the OAuth tokens.

- Activity events:

  - `connector_account_connected { provider, account_id, scopes }`

  - `connector_account_disconnected { provider, account_id }`

### 2.2 Import / Sync Flow

Triggered by:

- Manual "Sync now" on `/integrations` (v1).

- Later: scheduled jobs / cron.

Flow:

1. Create a `connector_jobs` row with `kind = 'drive_import'`.

2. Log `connector_sync_started { provider, account_id, run_id }`.

3. Fetch recent Drive files within v1 limits:

   - `MAX_FILES_PER_RUN`

   - `MAX_FILE_SIZE_MB`

   - `SUPPORTED_MIME_TYPES = Docs/Sheets/Slides/PDFs`

4. Normalise to:

```json

{

  "id": "drive-file-id",

  "name": "Document title",

  "mimeType": "application/vnd.google-apps.document",

  "modifiedTime": "2025-11-27T12:34:56Z",

  "owners": [{ "emailAddress": "owner@example.com" }],

  "webViewLink": "https://drive.google.com/..."

}

```

5. Persist either:

   - **Option A (metadata-first):** rows in `connector_files` only.

   - **Option B (direct to Vault):** create Vault docs with

     `source="google_drive"` and `external_id = driveId` while still recording

     imports in `connector_jobs`.

6. Log completion:

   - `connector_sync_completed { provider, account_id, run_id, file_count, duration_ms }`

7. On error:

   - Update `connector_jobs.status = 'failed'`, set `last_error`.

   - Log `connector_sync_failed { provider, account_id, run_id, error_code, error_msg }`.

---

## 3. Optional Gmail – v1 (Feature-Flagged)

Gmail is behind a feature flag (e.g. `int_gmail`) and **must not** surface in

the UI unless the flag is enabled.

### 3.1 Auth Flow

Very similar to Drive:

- `connector_accounts.provider = 'gmail'`

- Email-specific scopes and tokens stored in `token_json`.

- Connector events mirror Drive:

  - `connector_account_connected`

  - `connector_account_disconnected`

### 3.2 Import / Sync Flow

v1 is intentionally small and metadata-only:

- Pull last **N threads** from a label such as `"Contracts"`.

- Normalise to:

```json

{

  "subject": "Signed NDA – ACME",

  "from": "legal@acme.com",

  "date": "2025-11-27T10:00:00Z",

  "messageId": "<message-id@example.com>",

  "attachments": [

    {

      "filename": "NDA.pdf",

      "mimeType": "application/pdf",

      "size": 123456

    }

  ]

}

```

Storage options:

- **Metadata only:** write a row per message/thread into `connector_files`

  (`provider='gmail'`) with attachment metadata in `meta_json`.

- **Selective import:** allow selected attachments to be ingested into Vault

  with `source='gmail'`.

Activity events mirror Drive:

- `connector_sync_started`

- `connector_sync_completed`

- `connector_sync_failed`

---

## 4. Activity Events & Observability

Connector activity is observable via:

- `connector_accounts` (status per provider)

- `connector_jobs` (per-run status, attempts, last_error)

- `connector_files` (what we've seen from each provider)

- ActivityLog events (see `docs/ACTIVITY_EVENTS.md`).

These are the minimal fields required so Insights and Playbooks can:

- Filter by provider.

- Count successful vs failed runs.

- Compute per-doc / per-account usage over time.
