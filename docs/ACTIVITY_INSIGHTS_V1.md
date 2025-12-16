# Activity & Insights v1 – Spec (Week 11)

Last updated: 2025-11-27

Owner: Product + Eng (Week 11)

## 1. Goals

Make **Activity** and **Insights** actually useful for a single founder / small team that has:

- Connected at least one external source (Drive / Gmail).

- Generated or uploaded a few docs.

- Asked Maestro a handful of questions.

For v1 we want:

1. **/activity** to be a *single place* to answer "what just happened?" across docs, Maestro, connectors, signatures.
2. **/insights** to show 3–5 simple metrics that prove Harmonyk is doing work for you (and that connectors are alive).

Keep this small and reliable. No fancy charts or dashboards yet.

## 2. Current activity_log model (simplified)

The actual schema lives in the database and earlier docs, but conceptually we have:

- `doc_*` events – anything about documents:

  - e.g. generation, saving to Vault, sharing links, versioning.

- `mono_*` events – questions / actions via Maestro:

  - e.g. "ask about doc", follow-up questions, maybe suggestions.

- `connector_*` events – external sources:

  - `connector_sync_started`

  - `connector_sync_completed`

  - `connector_sync_failed`

  - plus metadata for provider (Drive, Gmail, etc.).

- `signature_*` events – Documenso / signature flows:

  - envelopes created/sent, status changes, completed.

- `share_*` events – sharing links / access:

  - share link created, viewed, etc. (shares may also be grouped under doc_* in some places).

- `system_*` / `playbook_*` events – background glue:

  - playbooks triggered, internal maintenance, etc.

**Important:** The source of truth is the DB. To see the real list of event types in your environment, run:

```sql
SELECT DISTINCT type
FROM activity_log
ORDER BY type;
```

Use that output to keep this doc honest as we add / rename events.

## 3. Activity v1 – filters & query model

The Activity API and UI should support a **small, opinionated set of filters** that map to real user questions.

### 3.1 Core filters

We want these filter dimensions in v1:

1. **Time range**

   - Presets: `Last 24 hours`, `Last 7 days`, `Last 30 days`.

   - Custom: from/to timestamps (used by the API; UI can start with presets).

2. **Event groups (chips)**

   - `Docs` – all `doc_*` and `share_*` events.

   - `Maestro` – all `mono_*` events.

   - `Connectors` – all `connector_*` events.

   - `Signatures` – all `signature_*` events.

   - `System` – optional catch-all for `system_*` and `playbook_*` events (can be hidden by default).

3. **Provider (for connectors)**

   - When the Connectors chip is on, allow filtering by:

     - `Drive`

     - `Gmail`

     - other providers as we add them (based on connector metadata).

4. **Search (simple)**

   - Free-text search over:

     - document title / name (if present in metadata),

     - email/recipient fields for share / connector events,

     - maybe a generic `context` field.

### 3.2 Pagination

- API must support:

  - `limit` (default ~50, max 100).

  - `cursor` or `offset + order` for pagination.

- UI for v1 can just do "Load more" / infinite scroll, using whatever pagination model the API exposes.

### 3.3 Org scoping

- All Activity and Insights queries **must** be scoped to the current org / workspace.

- No cross-org leakage, even in aggregate metrics.

## 4. Insights v1 – metrics

The Insights v1 page should be **thin** and driven by the same underlying Activity data + connector tables.

### 4.1 Time window

- Default: **Last 7 days** (relative to "now").

- Later we can add a "time range" control; v1 can hard-code 7 days and state it clearly in the UI.

### 4.2 Tiles (v1)

We want **3–5 tiles** that show clearly useful counts:

1. **Docs created (7d)**  

   - Count events that indicate a new doc entered the system:

     - e.g. `doc_created`, `doc_generated`, or "first save" events.

   - De-dupe by `doc_id` within the window if needed.

2. **Maestro questions asked (7d)**  

   - Count `mono_*` events representing a user question / query.

3. **Connector syncs (7d)**  

   - Count `connector_sync_completed` events.

   - Surface a breakdown by provider (e.g. "Drive: 3, Gmail: 1") either in the tile tooltip or in the "Recent trends" section.

4. **Signatures completed (7d)**  

   - Count signature events that indicate a fully executed document, e.g. `signature_completed` / `signature_envelope_completed`.

5. **Active docs (7d)** (optional / stretch)

   - Count unique `doc_id` values that appear in any `doc_*`, `share_*`, or `signature_*` event in the last 7 days.

It's OK if we start with 3–4 tiles and add the 5th once the data model is clear.

### 4.3 "Recent trends" section

For v1, keep this very simple:

- A small table like:

  | Day        | Docs created | Maestro questions | Connector syncs | Signatures completed |
  |----------- |------------- |----------------|-----------------|----------------------|
  | 2025-11-21 | 3           | 5              | 2               | 1                    |
  | …          | …           | …              | …               | …                    |

- Time window: last 7 days.

- No charts required for v1 (we can add graphs later).

## 5. Out of scope for v1

The following are explicitly **out of scope for Week 11**:

- Complex time-series charts or sparklines on /insights.

- Per-user breakdowns (e.g. "top users by activity").

- Advanced filtering by arbitrary metadata keys.

- Cross-org / cross-tenant analytics.

- Any machine learning or anomaly detection on activity_log.

We only want:

- A reliable Activity API with filters (time range, event groups, connector provider, simple search).

- A useful /activity page wired to that API.

- A small /insights page with a handful of trustworthy counts over the last 7 days.

## 6. How to keep this doc updated

- When you add a **new event family** (e.g. `task_*`), add a bullet for it in section 2.

- When you add a **new Insights tile**, update section 4.2 with:

  - the name,

  - the event types it counts,

  - and the time window assumptions.

If the reality in the DB ever drifts from this doc, treat that as a bug and fix either:

- the code (to match this spec), or

- this spec (to match a better reality) – but not both at once.

