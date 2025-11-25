# Activity Events Catalog (Week 8)

Monolyth's `activity_log` table is the telemetry backbone for:

- The `/activity` page (raw timeline + filters)

- The `/insights` page (aggregated metrics, time-saved, bottlenecks)

- Playbooks and Connectors metrics

This file is the **SSOT** for:

- Canonical event types

- Expected payload shape

- When each event fires

If you add or change events, update this doc in the same PR.

---

## 1. Table overview (read-only)

> This describes the intended shape. Always check the current Supabase schema before making breaking changes.

Target shape for `public.activity_log`:

- `id` (`uuid`, pk, default `gen_random_uuid()`)

- `created_at` (`timestamptz`, default `now()`)

- `workspace_id` (`uuid`, not null) – workspace / org owner

- `owner_id` (`uuid`, not null) – user who triggered the event

- `document_id` (`uuid`, null) – doc involved (Vault, Builder, Deck, etc.)

- `share_link_id` (`uuid`, null) – share link, if relevant

- `playbook_run_id` (`uuid`, null) – playbook run, if relevant

- `connector_id` (`uuid`, null) – connector (drive/gmail/etc.), if relevant

- `event_type` (`text`, not null) – one of the canonical strings below

- `source` (`text`, null) – high-level origin; examples:

  - `builder`

  - `vault`

  - `workbench`

  - `share`

  - `signatures`

  - `playbooks`

  - `connector`

- `payload` (`jsonb`, null) – structured event details

- `error` (`jsonb`, null) – optional error context (`{ code, message }`)

### Index strategy (Week 8)

Insights & Activity queries should be able to:

- Work with or without workspace scoping (for early dev environments).
- Efficiently filter when `workspace_id` is provided.

- Filter by **owner** and **workspace**

- Filter by **document**

- Filter by **event_type**

- Page / sort by **created_at DESC**

Planned indexes:

- `idx_activity_log_owner_created_at` on `(owner_id, created_at DESC)`

- `idx_activity_log_document_created_at` on `(document_id, created_at DESC)`

- `idx_activity_log_event_created_at` on `(event_type, created_at DESC)`

Actual DDL lives in Supabase migrations (see `supabase/migrations/*activity_log_indexes.sql`).

---

## 2. Canonical event types

These are mirrored in `lib/activity-events.ts`. Don't invent one-off strings in random files.

### 2.1 Builder & Analyze

- `generate`

  - **When:** A user triggers document generation in Builder (or Deck/Accounts Studio).

  - **Source:** `builder`

  - **Payload:**

    ```json
    {
      "document_id": "uuid",
      "template_key": "nda_mutual_v1",
      "mode": "ai_prompt | ai_template",
      "jurisdiction": "us | uk_commonwealth | eu | mena | asia_row"
    }
    ```

- `analyze`

  - **When:** A user runs Analyze on a document (Workbench / Vault).

  - **Source:** `workbench`

  - **Payload:**

    ```json
    {
      "document_id": "uuid",
      "analysis_type": "summary | risk | compare | qa",
      "tokens_used": 1234
    }
    ```

- `save_to_vault`

  - **When:** A generated/imported doc is saved into Vault as a managed item.

  - **Source:** `vault`

  - **Payload:**

    ```json
    {
      "document_id": "uuid",
      "origin": "builder | upload | connector",
      "folder_path": ["Contracts", "Core Operational"],
      "file_name": "NDA - Acme Corp.pdf"
    }
    ```

### 2.2 Share & Signatures

- `share_link_created`

  - **When:** A new share link is created for a document.

  - **Source:** `share`

  - **Payload:**

    ```json
    {
      "share_link_id": "uuid",
      "document_id": "uuid",
      "access_mode": "view | comment | sign",
      "requires_email": true,
      "expires_at": "2025-12-31T23:59:59Z"
    }
    ```

- `share_link_accessed`

  - **When:** A share link is opened by a guest or logged-in user.

  - **Source:** `share`

  - **Payload:**

    ```json
    {
      "share_link_id": "uuid",
      "document_id": "uuid",
      "visitor_label": "Guest #3",
      "email": "optional@email.com",
      "action": "view | download | sign_start"
    }
    ```

- `signature_request_sent`

  - **When:** A signature request is sent to one or more recipients.

  - **Source:** `signatures`

  - **Payload:**

    ```json
    {
      "document_id": "uuid",
      "signers": [
        {"email": "a@example.com", "role": "signer"},
        {"email": "b@example.com", "role": "cc"}
      ]
    }
    ```

- `signature_completed`

  - **When:** All required signatures are completed and the document is marked executed.

  - **Source:** `signatures`

  - **Payload:**

    ```json
    {
      "document_id": "uuid",
      "completed_signers": [
        {"email": "a@example.com"},
        {"email": "b@example.com"}
      ],
      "completed_at": "2025-11-25T10:12:00Z"
    }
    ```

### 2.3 Playbooks

- `playbook_run_started`

  - **When:** A playbook run is enqueued or starts processing.

  - **Source:** `playbooks`

  - **Payload:**

    ```json
    {
      "playbook_run_id": "uuid",
      "playbook_id": "uuid",
      "trigger": "share_link_created | schedule | manual",
      "target_document_id": "uuid"
    }
    ```

- `playbook_run_completed`

  - **When:** A playbook run completes successfully.

  - **Source:** `playbooks`

  - **Payload:**

    ```json
    {
      "playbook_run_id": "uuid",
      "playbook_id": "uuid",
      "actions_executed": 5,
      "time_saved_seconds": 180
    }
    ```

- `playbook_run_failed`

  - **When:** A playbook run fails irrecoverably.

  - **Source:** `playbooks`

  - **Payload:**

    ```json
    {
      "playbook_run_id": "uuid",
      "playbook_id": "uuid",
      "failed_step": "action_id_or_label",
      "error": {
        "code": "string",
        "message": "string"
      }
    }
    ```

### 2.4 Mono / AI queries

- `mono_query`

  - **When:** The Mono assistant is invoked with a user query (Workbench / Playbooks / Anywhere).

  - **Source:** `workbench` (or page-specific)

  - **Payload:**

    ```json
    {
      "query": "summarize the latest NDA versions",
      "context": {
        "documents": ["uuid1", "uuid2"]
      },
      "tokens_used": 2345
    }
    ```

### 2.5 Connector events

- `connector_sync_started`

  - **When:** A connector sync run starts (e.g., Google Drive import).

  - **Source:** `connector`

  - **Payload:**

    ```json
    {
      "connector_id": "uuid",
      "connector_type": "google_drive | gmail | other",
      "mode": "initial | incremental"
    }
    ```

- `connector_sync_completed`

  - **When:** A connector sync finishes successfully.

  - **Source:** `connector`

  - **Payload:**

    ```json
    {
      "connector_id": "uuid",
      "connector_type": "google_drive | gmail | other",
      "documents_imported": 42
    }
    ```

- `connector_sync_failed`

  - **When:** A connector sync fails.

  - **Source:** `connector`

  - **Payload:**

    ```json
    {
      "connector_id": "uuid",
      "connector_type": "google_drive | gmail | other",
      "error": {
        "code": "string",
        "message": "string"
      }
    }
    ```

---

## 3. Usage guidelines

- Use only the event types listed above.

- Prefer small, structured payloads over giant blobs.

- Always include `document_id` when an event is document-specific.

- Always include `workspace_id` and `owner_id` at insert time (DB or code).

- For new event types:

  - Add to `lib/activity-events.ts`

  - Document here in `docs/ACTIVITY_EVENTS.md`

---

## 4. Filter model (Week 8)

To keep `/activity`, CSV exports, and Insights aligned, we standardize the
filter model across the stack.

### 4.1 URL search params

The `/activity` page (and related CSV/API endpoints) should use these query keys:

- `datePreset`: `"7d" | "30d" | "all" | "custom"`

- `from`: ISO timestamp, only required when `datePreset === "custom"`

- `to`: ISO timestamp, only required when `datePreset === "custom"`

- `eventTypes`: comma-separated activity event types, e.g. `generate,save_to_vault`

- `documentId`: target document UUID

- `source`: `builder | vault | workbench | share | signatures | playbooks | connector`

- `hasError`: `"true" | "false"` (omit if you don't want to filter on error)

- `search`: simple free-text search (typically file name / document title)

### 4.2 Parsing and serialization helpers

The canonical helpers live in `lib/activity-filters.ts`:

- `parseActivityFiltersFromSearch(searchParams)`  

  - Accepts `URLSearchParams` or a `Record<string, string | string[] | undefined>`.

  - Returns an `ActivityFilterState` object suitable for UI.

- `serializeActivityFiltersToQuery(filters)`  

  - Accepts a (possibly partial) filter state.

  - Returns a `URLSearchParams` instance for building links or updating the URL.

- `toActivityQueryFilters(state, { limit, now })`  

  - Converts UI-level filter state into `ActivityQueryFilters` for DB querying.

  - Applies `datePreset` to compute concrete `from`/`to` timestamps when needed.

All Activity-related pages/routes should use these helpers instead of rolling
their own ad-hoc query param parsing.

---

## 5. Activity API (Week 8)

A generic ActivityLog query endpoint is exposed at:

- `POST /api/activity/query`

Body:

```json
{
  "workspaceId": "uuid",
  "ownerId": "uuid (optional)",
  "filters": { "...ActivityQueryFilters..." }
}
```

This endpoint is intended for use by:

- The `/activity` page (UI filters)

- CSV/exports

- Internal QA/admin tools

---

## 6. Insights summary API (Week 8)

An aggregated summary for `/insights` is exposed at:

- `POST /api/insights/summary`

Body:

```json
{
  "workspaceId": "uuid",
  "ownerId": "uuid (optional)",
  "range": "7d | 30d"
}
```

The API aggregates counts for the last 7/30 days using ActivityLog:

- Docs generated, docs saved to Vault

- Share links created

- Signatures sent/completed

- Playbook runs + time saved

- Mono queries

- A basic "docs in Vault" total (subject to refinement once Vault schema is final)

---

## 7. CSV export endpoints (Week 8)

Two CSV export endpoints are available:

### 7.1 Activity export

- `POST /api/activity/export`

Body:

```json
{
  "workspaceId": "uuid",
  "ownerId": "uuid (optional)",
  "filters": { "...ActivityQueryFilters..." }
}
```

Exports a CSV of raw ActivityLog rows, using the same filters and query logic
as `/api/activity/query`.

### 7.2 Insights export

- `POST /api/insights/export`

Body:

```json
{
  "workspaceId": "uuid",
  "ownerId": "uuid (optional)",
  "range": "7d | 30d"
}
```

Exports a CSV of high-level Insights metrics (docs generated, saved to Vault,
share links, signatures, playbook runs, Mono queries, time saved, docs in Vault).

