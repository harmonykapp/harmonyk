# v0.10.0 – Connectors v1 (Drive + Gmail)

Status: Local dev  
Scope: Google Drive + Gmail metadata-first connectors, /integrations UI, Activity logging.

---

## Overview

Harmonyk v0.10.0 introduces **Connectors v1**:

- First-class **Google Drive** connector

- First-class **Gmail** connector

- New **/integrations** page for managing connections and manual syncs

- New connector tables in Supabase for accounts, jobs, and imported file metadata

- Activity logging for connector runs to support future Insights

This is a **beta-grade** release designed to be safe, observable, and easy to recover from, not a full account-wide ingestion.

---

## New features

### 1. Google Drive connector

- OAuth 2.0 flow using Google Cloud credentials.

- Metadata-first import of recent files:

  - Google Docs

  - Google Sheets

  - Google Slides

  - PDFs (within size limits)

- Data is stored in:

  - `connector_accounts` – Drive account row

  - `connector_jobs` – each sync run, status, and error

  - `connector_files` – file metadata (id, title, mime, size, modified time, links, etc.)

- Manual **Sync now** button on /integrations.

- Errors are surfaced in both the card and `connector_jobs.last_error`, without crashing the UI.

### 2. Gmail connector

- OAuth 2.0 flow using the same Google Cloud project (Gmail API enabled).

- Metadata-first import of recent threads/messages:

  - Subject

  - From

  - Date

  - Message ID

  - Attachment metadata (file name, size, mime)

- Email bodies are **not** stored.

- Writes to `connector_accounts`, `connector_jobs`, and a normalized metadata store (`connector_files` or equivalent).

- Manual **Sync again** button on /integrations.

### 3. /integrations page

- Drive card:

  - Connect / Reconnect

  - Sync now

  - Status badge (Connected / Error)

  - Last sync time + success message (e.g. `file_count = N`)

  - Last error snippet (for debugging auth/rate-limit issues)

- Gmail card:

  - Connect / Reconnect

  - Sync again

  - Status badge

  - Last sync time + `message_count = N`

  - Last error snippet

- Placeholder section for future connectors (Calendar, etc.).

### 4. Activity logging for connectors

- New activity events (written to `activity_log`):

  - `connector_sync_started`

  - `connector_sync_completed`

  - `connector_sync_failed`

- Context payload includes:

  - `provider` (`google_drive` or `gmail`)

  - `account_id`

  - `run_id`

  - Counts and timing

  - Error code / message for failures

- Events are stored using the same `activity_log` table as doc events to keep Insights unified.

---

## Database changes

Migration: `supabase/migrations/202511270001_connectors_v1.sql`

Adds tables:

- `connector_accounts`

  - `id uuid primary key`

  - `owner_id uuid` (nullable for now)

  - `provider text`

  - `status text` (defaults to `'disconnected'`)

  - `token_json jsonb`

  - Timestamps + indexes

- `connector_jobs`

  - `id uuid primary key`

  - `account_id uuid` → `connector_accounts.id`

  - `kind text`

  - `status text`

  - `attempts int`

  - `last_error text`

  - `meta_json jsonb`

  - Timestamps + indexes

- `connector_files`

  - `id uuid primary key`

  - `account_id uuid`

  - `provider text`

  - `external_id text`

  - `title text`

  - `mime text`

  - `size bigint`

  - `modified_at timestamptz`

  - `url text`

  - `meta_json jsonb`

  - `created_at timestamptz`

No breaking changes to existing doc / activity tables.

---

## Limits & safety

These limits are **hard-coded for v1** to keep the beta safe and predictable:

- **Accounts**

  - Max **1 Google Drive** account per org

  - Max **1 Gmail** account per org

  - Reconnect updates tokens for the existing row; new rows are not created.

- **Per-run scope**

  - Google Drive:

    - Max recent files per run (`MAX_FILES_PER_RUN`)

    - Max file size (`MAX_FILE_SIZE_MB`)

    - Supported mime types: Docs, Sheets, Slides, PDFs

  - Gmail:

    - Small batch of recent threads/messages per run

    - Metadata + attachment metadata only (no bodies)

- **Error handling**

  - All error paths write:

    - A `connector_jobs` row with `status = 'failed'` and `last_error`

    - A `connector_sync_failed` activity_log entry

  - UI shows a readable error snippet in the card without breaking other parts of the app.

---

## Configuration / upgrade notes

1. **Supabase**

   - Apply migration `202511270001_connectors_v1.sql` if not already applied.

2. **Environment**

   - Ensure `.env.local` includes:

     - `NEXT_PUBLIC_SUPABASE_URL`

     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

     - `SUPABASE_SERVICE_ROLE_KEY`

     - `GOOGLE_OAUTH_CLIENT_ID`

     - `GOOGLE_OAUTH_CLIENT_SECRET`

   - Restart `npm run dev` after updating env vars.

3. **Google Cloud**

   - Enable APIs:

     - **Google Drive API**

     - **Gmail API**

   - Configure OAuth consent screen (external) and publish it.

   - Add authorized redirect URIs:

     - `http://localhost:3000/api/connectors/drive/callback`

     - `http://localhost:3000/api/connectors/gmail/callback` (if Gmail enabled)

4. **Security**

   - Service role key is used server-side only for connector writes; do not expose it to the browser.

---

## Known issues / future work

- **Activity UI**

  - Connector events are logged correctly in `activity_log`, but the Activity page still reuses doc-oriented labels and does not yet have rich filtering/display for connectors.

  - This will be addressed in a future Insights / Activity polish pass.

- **Scheduling**

  - Connectors are manual only ("Sync now" / "Sync again").

  - No background schedules or cron jobs yet; these will be added later once usage patterns are clearer.

- **Scope**

  - Gmail import is intentionally narrow (metadata-only, small slice). Full text indexing is out-of-scope for v0.10.0.

  - Only Google Drive + Gmail are supported; Calendar and other tools will be added later.

---

## Release checklist

Before tagging:

```bash
npm run lint
npm run build
npm run test || true
git status
```

If everything looks clean:

```bash
git add .
git commit -m "v0.10.0 – Connectors v1 (Drive + Gmail)"
git tag v0.10.0-connectors-v1
```

Push (when ready):

```bash
git push origin main
git push origin v0.10.0-connectors-v1
```

