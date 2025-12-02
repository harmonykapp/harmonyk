# Playbooks GA — Monolyth

Automated, explainable workflows that react to activity events and accounts pack runs.
Playbooks are org-scoped, safety-focused automations that:

- Listen to specific triggers (activity events and accounts pack runs).
- Evaluate a small, safe JSON condition DSL against each event.
- Execute a limited set of internal actions (log activity, enqueue internal tasks).
- Record every execution in `playbook_runs` for observability and Insights.
- Expose a dry-run API and UI so founders can see exactly what would happen before turning anything on.

This document describes the data model, triggers, condition DSL, actions, execution flow, dry-run behaviour, and safety guardrails.

---

## Data model

### `playbooks` (org-scoped templates)

Fields the app actually relies on now:

- `id` (uuid) — primary key.
- `org_id` (uuid) — org that owns this playbook.
- `name` (text) — human-readable label (e.g. `"Contract signed → renewal reminder"`).
- `trigger` (text) — which event stream this playbook listens to:
  - `"activity_event"`
  - `"accounts_pack_run"`
- `conditions` (jsonb) — array of condition objects (see DSL below).
- `actions` (jsonb) — array of action objects (see Actions below).
- `status` (text) — `"active"` or `"inactive"` (legacy values are tolerated but GA uses these).
- `last_run_at` (timestamptz, nullable) — last time this playbook successfully ran.
- Timestamps:
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

Old columns like `owner_id` and `definition_json` still exist in the dev DB but are ignored by the app.

### `playbook_runs` (execution log)

Each attempted run of a playbook (success, failure, or skipped) is recorded here:

- `id` (uuid) — primary key.
- `playbook_id` (uuid) — FK to `playbooks.id`.
- `org_id` (uuid) — org for which this run executed.
- `trigger_event` (jsonb) — the normalized event payload against which conditions were evaluated.
- `status` (text) — `"pending"`, `"success"`, `"failed"`, or `"skipped"`.
- `error` (text, nullable) — error message for failed runs (if any).
- `metrics` (jsonb) — compact summary used by Insights (e.g. `playbookName`, `trigger`, `actionsCount`, `deckCategory`, etc.).
- `created_at` (timestamptz) — when the run was enqueued/started.
- `completed_at` (timestamptz, nullable) — when the run finished.

Indexes:

- `(org_id, created_at desc)` — used by Insights and any org-scoped history views.

---

## Triggers

Two trigger types are supported for GA:

### `activity_event`

These come from ActivityLog writes and cover:

- Contracts lifecycle events (e.g. `contract_signed`).
- Deck events (e.g. `deck_saved_to_vault`, `deck_exported`).
- Other builder/share/signature events as we wire them in.

The normalized `event` passed to the engine looks like:

```json
{
  "activity": {
    "type": "contract_signed",
    "doc_id": "<uuid>",
    "category": "contract",
    "metadata": {
      "contract_id": "<uuid>",
      "renewal_date": "2026-01-15"
    }
  }
}
```

### `accounts_pack_run`

These come from successful accounts pack runs (e.g. Investor Snapshot).

Example event:

```json
{
  "metrics": {
    "pack_type": "investor_accounts_snapshot",
    "runway_months": 3,
    "monthly_burn": 50000
  }
}
```

---

## Conditions DSL

Conditions are stored in `playbooks.conditions` as an array of JSON objects:

```json
{
  "field": "metrics.pack_type",
  "op": "equals",
  "value": "investor_accounts_snapshot"
}
```

Supported operators:

- `"equals"` / `"not_equals"`
- `"starts_with"`
- `"contains"`
- `"gt"`, `"gte"`, `"lt"`, `"lte"`

Semantics:

- `field` is a dotted path into the `event` object (e.g. `activity.type`, `metrics.runway_months`).
- `value` is a string, number, or boolean.
- All conditions on a playbook are ANDed — they must all pass for actions to execute.

Examples of GA conditions:

- **Contracts (Signed → Renewal reminder)**  
  ```json
  [
    { "field": "activity.type", "op": "equals", "value": "contract_signed" }
  ]
  ```

- **Decks (New deck in Vault → Outreach sequence)**  
  ```json
  [
    { "field": "activity.type", "op": "starts_with", "value": "deck_" }
  ]
  ```

- **Accounts (Investor snapshot → Investor update recommended)**  
  ```json
  [
    { "field": "metrics.pack_type", "op": "equals", "value": "investor_accounts_snapshot" },
    { "field": "metrics.estimatedRunwayMonths", "op": "lt", "value": 6 },
    { "field": "metrics.totalMonthlyBurn", "op": "gt", "value": 0 }
  ]
  ```

---

## Actions

Actions are stored in `playbooks.actions` as JSON describing what to do when conditions pass.

Supported GA action types:

- `"log_activity"`  
  - Writes a new ActivityLog row with a specific `type` and optional `metadata`.
  - Used for:
    - `renewal_reminder_created`
    - `deck_outreach_sequence_started`
    - `investor_update_recommended`

- `"enqueue_task"`  
  - Currently a stub used to record intent for later integrations.
  - Example payloads:
    - `{ "type": "enqueue_task", "params": { "queue": "outreach_sequence", "target": "investor_list" } }`
    - `{ "type": "enqueue_task", "params": { "queue": "investor_updates" } }`

At GA, no external side effects (email, CRM, Slack, etc.) are triggered directly from playbooks.

---

## Execution flow

The core entry point is:

```ts
runPlaybooksForEvent({ orgId, event })
```

High-level steps:

1. Load all `active` playbooks for the org whose `trigger` matches the event stream.
2. For each playbook:
   - Evaluate all conditions against the `event`.
   - If any condition fails, mark the run as `"skipped"` and continue.
   - If all conditions pass:
     - Execute actions in sequence.
     - Write a `playbook_runs` row with `status = "success"` plus metrics.
3. If an action throws:
   - Catch the error, mark the run as `"failed"`, and record `error` text.
   - Do **not** crash the request that emitted the event.

Metrics stored in `playbook_runs.metrics` include:

- `playbookName`
- `trigger`
- `actionsCount`
- Optional context like `deckCategory`

These metrics are designed so `/insights` can show simple KPIs for Contracts, Decks, and Accounts automation.

---

## Dry-run behaviour

The dry-run API:

- `GET /api/playbooks/[id]/dry-run`

Process:

1. Load the playbook by `id` and ensure it belongs to the current org.
2. Build a **sample event** based on:
   - `trigger`
   - Known condition fields (e.g. for Investor Snapshot we fabricate a `metrics` object).
3. Evaluate conditions against the sample event.
4. Return:
   - `sampleEvent`
   - `conditions`: each with pass/fail + optional message.
   - `actions`: which actions *would* run if this were a real event.

Dry-run guarantees:

- No `playbook_runs` rows are written.
- No ActivityLog entries are written.
- No external side effects.

The `/playbooks` UI surfaces this in a modal with:

- Pretty-printed JSON for the sample event.
- A list of conditions with green (Passed) / red (Failed) status.
- A list of actions or a note that no actions would run.

---

## Safety & guardrails

Key guardrails for GA:

- **No freeform code** — playbooks are pure data (JSON) and a small DSL evaluated by our own engine.
- **Limited actions** — only internal logging / queue stubs; no direct access to external systems.
- **Org-scoped RLS** — `playbooks` and `playbook_runs` are visible only to members of the owning org.
- **Fail-safe execution** — engine errors are captured as failed runs and surfaced via metrics; they never crash the caller.
- **Dry-run first** — UI encourages dry-run and shows exactly what would happen before a playbook is activated.

Known limitations at GA:

- Playbooks are system-defined templates; users cannot yet create arbitrary new playbooks.
- Thresholds and conditions are hard-coded inside templates.
- Metrics are intentionally minimal; more detailed analytics can be layered on in future.

