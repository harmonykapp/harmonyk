# Harmonyk – Playbooks v1

> Week 7 implementation notes, scope, and runbook

Playbooks are **deterministic workflows for document flows**.
v1 focuses on:

- Explicit definitions: **trigger + linear steps**

- Safe execution: **dry-run by default**, no hidden side-effects

- Simple scopes: **selection / saved view / folder**

- Basic telemetry: runs + steps logged for Insights

This doc is the **single source of truth** for Playbooks v1 behaviour.

---

## 1. Concepts

### 1.1 Entities

- **Playbook**

  - A saved workflow definition owned by a user / workspace.

  - Status:

    - `draft` – visible but not auto-triggered.

    - `enabled` – can run and may attach to events.

    - `disabled` – preserved but won't run or fire on events.

- **Playbook Run**

  - One execution (or dry-run) of a Playbook against a scope.

  - Status:

    - `started`

    - `completed`

    - `failed`

    - `dry_run`

- **Playbook Step**

  - One step inside a run (trigger, condition, action, wait).

  - Linear today; branching comes later.

### 1.2 Scope

Scope answers **"what does this Playbook run against?"**

v1 supports:

- `mode: "selection"`

  - Called from Workbench selection or other UIs.

  - Example payload:

    ```json
    {
      "mode": "selection",
      "source": "workbench",
      "selected_unified_ids": ["..."],
      "selected_titles": ["NDA — ACME & Harmonyk"]
    }
    ```

- `mode: "saved_view"`

  - Predefined Saved View (e.g. "Aging proposals > 7 days").

  - v1: stored in `scope_json`, not fully resolved yet.

Folder / tag scopes are planned; for v1 they are tracked in `scope_json`

but not enforced by the executor.

---

## 2. Data Model (v1)

Tables (Supabase):

```sql
playbooks (
  id uuid primary key,
  owner_id uuid not null,
  name text not null,
  status text check (status in ('draft','enabled','disabled')) not null default 'draft',
  scope_json jsonb,
  definition_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

playbook_runs (
  id uuid primary key,
  playbook_id uuid references playbooks(id),
  status text check (status in ('started','completed','failed','dry_run')) not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  stats_json jsonb
);

playbook_steps (
  id uuid primary key,
  run_id uuid references playbook_runs(id),
  step_idx integer not null,
  type text not null,
  input_json jsonb,
  output_json jsonb,
  status text,
  started_at timestamptz default now(),
  completed_at timestamptz
);
```

Indexes:

- `playbooks(owner_id, status)`

- `playbook_runs(playbook_id, started_at DESC)`

---

## 3. API Surface (v1)

### 3.1 Run a Playbook

`POST /api/playbooks/run`

**Body:**

```json
{
  "playbook_id": "uuid",
  "scope": {
    "mode": "selection",
    "source": "workbench",
    "selected_unified_ids": ["..."],
    "selected_titles": ["..."]
  },
  "dryRun": true
}
```

**Behaviour:**

- Validates `playbook_id` and membership.

- Loads `definition_json`.

- Inserts `playbook_runs` row with:

  - `status = 'dry_run'` if `dryRun = true`

  - `status = 'started'` otherwise

- Iterates `definition_json.steps` deterministically:

  - Writes a `playbook_steps` row per step.

  - For `dryRun`, **simulates** actions and records planned outputs.

  - For live runs, **executes** safe actions only (v1 is conservative).

- On success:

  - Updates `playbook_runs.status`:

    - `dry_run` or `completed`.

  - Populates `stats_json` with:

    - Approximate `time_saved_minutes`.

    - Step count and summary.

**Response (v1):**

```json
{
  "ok": true,
  "runId": "uuid",
  "mode": "dry_run"
}
```

### 3.2 Undo scaffold

`POST /api/playbooks/undo`

**Body:**

```json
{
  "run_id": "uuid"
}
```

v1 implementation:

- Loads the run + steps and returns them.

- **Does not perform destructive actions yet.**

- Exists so we can later reverse:

  - Share link creation

  - Signature envelope creation

  - Tagging / moves

### 3.3 Dev-only endpoints

These are **development helpers only**:

- `POST /api/dev/playbooks/seed`

  - Seeds the library with:

    - Inbound NDA → Save→Sign→Share

    - Aging Proposals → Reminder / Share bump

    - Receipt → Vault

  - Uses fixed IDs so it can be re-run safely.

- `POST /api/dev/playbooks/test-event`

  - Sends a fake event into `queuePlaybooksForEvent`.

  - Types:

    - `share_link_created`

    - `signature_completed`

---

## 4. UI Behaviour (v1)

### 4.1 /playbooks

- **Left column**: list of Playbooks (name, status, last run).

- **Right column**: detail view

  - Name, status (draft/enabled/disabled).

  - Scope (read-only).

  - Steps summary (read-only for now).

  - Controls:

    - **Run Playbook**

    - **Dry-run toggle**

    - **Enable / Disable**

  - Last 5 runs:

    - Status

    - Timestamp

    - Time saved (from `stats_json`)

### 4.2 Workbench integration

- Toolbar adds **"Run Playbook (dry-run)"** button.

- Behaviour:

  - Requires a selected row.

  - Requires at least one Playbook (prefer `enabled`, else first).

  - Calls `/api/playbooks/run` with:

    - `mode: "selection"`

    - `source: "workbench"`

    - `selected_unified_ids: [row.id]`

  - Shows toast and points user back to `/playbooks` for run details.

---

## 5. Guardrails (v1)

- **Dry-run default**:

  - Workbench button uses `dryRun: true`.

  - /playbooks UI defaults to dry-run mode.

- **No implicit event runs yet**:

  - `queuePlaybooksForEvent` is wired and tested via dev endpoint.

  - Real event hooks (share/sign) come later once we're comfortable.

- **Undo is information-only**:

  - `/api/playbooks/undo` returns context; does not modify data.

---

## 6. Runbook – debugging a Playbook

1. **Check the Playbook definition**

   - Go to `/playbooks`.

   - Select the Playbook.

   - Confirm:

     - Status is what you expect (`draft` or `enabled`).

     - Scope looks sane for how you're calling it.

2. **Run a dry-run from /playbooks**

   - Click **Run Playbook** with **DRY-RUN** selected.

   - If you see an error toast:

     - Check browser console for network errors on `/api/playbooks/run`.

     - Check server logs for Supabase errors.

3. **Inspect the run**

   - In `/playbooks`, look at **Last 5 runs**.

   - Confirm a new `DRY_RUN` entry appears with:

     - Reasonable `time saved`.

4. **Check the DB directly (if needed)**

   - In Supabase SQL editor:

     ```sql
     select * from playbook_runs
     order by started_at desc
     limit 10;
     ```

   - Then:

     ```sql
     select * from playbook_steps
     where run_id = '<run_id_from_above>'
     order by step_idx;
     ```

   - Check for missing steps or errors in `output_json`.

5. **Workbench integration**

   - Go to `/workbench`, select a row, click **Run Playbook (dry-run)**.

   - If you see no corresponding run in `/playbooks`:

     - Confirm at least one Playbook exists.

     - Confirm at least one Playbook is `enabled`.

     - Check network tab for `/api/playbooks/run` from Workbench.

6. **Event testing (dev only)**

   - In `/playbooks`, scroll to **Dev: Test Playbook Event**.

   - Choose `share_link_created` or `signature_completed`, click **Send test event**.

   - Confirm the message shows how many `enabled` Playbooks were seen.

   - Check server logs from `queuePlaybooksForEvent` for details.

---

## 7. Out of scope (v1)

The following are explicitly **not** in Playbooks v1 and will be handled in later weeks:

- Branching and complex conditions.

- Full Saved View resolution and pagination.

- Rich editor for building Playbooks in the UI.

- Automatic event-driven runs in production (beyond dev testing).

- Real undo that reverses share links and signatures.

v1 is about getting a **solid, debuggable core** in place without surprises.

