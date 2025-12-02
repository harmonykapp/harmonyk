# Week 17 — Playbooks GA

## Objectives

- Ship a stable, explainable Playbooks GA for Contracts, Decks, and Accounts.

- Ensure playbooks are org-scoped, safe by default, and wired to ActivityLog and Insights.

- Provide a `/playbooks` UI where founders can see, toggle, and dry-run automations without writing code.

- Normalize the legacy `playbooks` schema in Supabase to match the new model without disrupting existing data.

---

## What was delivered

- **Data model normalization**

  - Brought the existing `public.playbooks` table in Supabase into alignment with the new model:

    - Introduced `org_id`, `trigger`, `conditions` (jsonb), `actions` (jsonb), `last_run_at`.

    - Relaxed legacy columns (`owner_id`, `definition_json`) and removed the old status check constraint.

    - Ensured `status` is a plain text field with a simple default (`"inactive"`).

  - Confirmed `public.playbook_runs` has the fields needed for GA:

    - `org_id`, `playbook_id`, `trigger_event`, `status`, `error`, `metrics`, `created_at`, `completed_at`.

    - Added indexes on `(org_id, created_at desc)` for Insights.

- **Playbooks execution engine**

  - Implemented `runPlaybooksForEvent({ orgId, event })` with:

    - Trigger-based selection of active playbooks for the org.

    - Safe evaluation of a small JSON-based condition DSL.

    - Status tracking per run: `"success"`, `"failed"`, `"skipped"`.

    - Compact metrics written to `playbook_runs.metrics` for Insights.

  - Hardened error handling so failures are recorded as failed runs without crashing the caller.

- **GA playbook templates**

  - **Contracts:** `Contract signed → renewal reminder`

    - Trigger: `activity_event` with `activity.type = "contract_signed"`.

    - Actions: log `renewal_reminder_created` and enqueue a stub internal task.

  - **Decks:** `New deck in Vault → outreach sequence`

    - Trigger: `activity_event` with `activity.type` starting with `"deck_"` (e.g. `deck_saved_to_vault`, `deck_exported`).

    - Actions: log `deck_outreach_sequence_started` and enqueue a stub outreach task.

  - **Accounts:** `Investor snapshot → investor update recommended`

    - Trigger: `accounts_pack_run` with `metrics.pack_type = "investor_accounts_snapshot"`.

    - Conditions on runway and burn (e.g. `estimatedRunwayMonths < 6`, `totalMonthlyBurn > 0`).

    - Actions: log `investor_update_recommended` and enqueue a stub investor update task.

  - Seeded GA templates for the dev org so `/playbooks` is populated even without real events firing yet.

- **Playbooks API surface**

  - `GET /api/playbooks`

    - Returns all playbooks for the current org with normalized types.

    - Seeds GA templates on-demand for the org (idempotent) before listing.

  - `PATCH /api/playbooks/[id]/status`

    - Toggles `status` between `"active"` and `"inactive"` with org scoping.

  - `GET /api/playbooks/[id]/dry-run`

    - Generates a sample event based on trigger and conditions.

    - Evaluates conditions and returns per-condition pass/fail.

    - Returns the list of actions that would run, without writing to ActivityLog or `playbook_runs`.

- **/playbooks UI**

  - New route: `/playbooks` under the protected layout.

  - Left-hand list:

    - Shows all playbooks for the org with name, trigger, status pill, and last run timestamp.

  - Detail panel:

    - Shows name and trigger.

    - Read-only view of conditions and actions, formatted for humans.

    - Status toggle (Active/Inactive) wired to the status API.

  - Dry-run modal:

    - Displays the sample event (pretty-printed JSON).

    - Lists each condition with green (Passed) / red (Failed) indicators.

    - Shows which actions would run, or a note if none would.

- **Supabase schema fixes for playbooks**

  - Cleaned up several legacy constraints and NOT NULL requirements that conflicted with the new model.

  - Left the rest of the database untouched; only the `playbooks` slice was normalized.

---

## How it works end-to-end

1. **Event emission**

   - Contracts, Decks, and Accounts flows emit events:

     - Activity events (e.g. `contract_signed`, `deck_saved_to_vault`, `deck_exported`).

     - Accounts pack runs (e.g. Investor Snapshot success events with metrics).

2. **Engine execution**

   - `runPlaybooksForEvent({ orgId, event })` is called from the relevant flow.

   - The engine:

     - Fetches active playbooks for the org and matching trigger.

     - Evaluates the condition DSL against the supplied event.

     - For matching playbooks:

       - Executes `log_activity` and `enqueue_task` actions.

       - Writes a `playbook_runs` record with status, error (if any), and metrics.

3. **Observability**

   - `playbook_runs.metrics` stores:

     - `playbookName`, `trigger`, `actionsCount`.

     - Optional context such as `deckCategory` for deck-related playbooks.

   - `/insights` can surface:

     - How many times each GA playbook ran.

     - How many runs failed or were skipped.

     - Basic breakdowns by Contracts / Decks / Accounts.

4. **Configuration and dry-run**

   - Founders visit `/playbooks` to:

     - See which automations are available.

     - Toggle them Active/Inactive per org.

     - Run dry-run simulations and inspect sample events and condition results before enabling.

---

## QA & verification

Core checks performed / expected for Week 17:

- `/playbooks` loads for an authenticated org without errors (API 200, no internal error banners).

- GA templates for Contracts, Decks, and Accounts appear in the list for the dev org.

- Status toggle:

  - Toggling each playbook between Active and Inactive updates the pill and persists on refresh.

  - No console errors or API failures during toggling.

- Dry-run:

  - Dry-run modal opens for each playbook.

  - Sample event structure matches the trigger (activity vs accounts pack).

  - Conditions show Passed/Failed based on the fabricated metrics/event.

  - "Actions that would run" list is accurate and dry-run does not create ActivityLog or `playbook_runs` rows.

- Regression checks:

  - Saving/exporting a deck still works and logs expected Activity events.

  - Running an Investor Snapshot pack still succeeds and writes the usual metrics.

---

## Known limitations and assumptions

- Playbooks are **system-defined templates only** in GA:

  - No user-created playbooks.

  - No editing of condition structures or actions from the UI.

- The conditions DSL is intentionally small:

  - Only AND logic across conditions.

  - No nested groups or OR conditions.

- Actions are limited to internal ActivityLog writes and queue stubs:

  - No direct integrations with email, CRM, Slack, etc. yet.

- `playbook_runs.metrics` is minimal and focused on what `/insights` currently needs.

- Supabase migration history for the original playbooks migration is effectively "dirty":

  - The DB schema has been normalized by hand for dev.

  - Future schema work should use new migrations or direct SQL changes rather than re-running the old migration version.

---

## Next steps and hand-off

- **Week 18 — GA Cut, Polish & Launch Readiness**

  - Surface key playbook KPIs in `/insights` alongside Contracts/Decks/Accounts.

  - Ensure playbooks status and dry-run fit cleanly into the Workbench/Builder/Vault flows.

  - Final UI polish and copy updates on `/playbooks`.

- **Weeks 19–20 and beyond**

  - Consider exposing limited editing capabilities (e.g. thresholds) for GA templates.

  - Expand metrics captured in `playbook_runs` for richer Insights dashboards.

  - Evaluate safe paths to user-authored playbooks and eventually external actions (email, CRM, Slack) with strict guardrails.

  - Tie playbooks into future RAG/Insights work to surface "automations worth investigating" (e.g. frequently failing playbooks or ones with high impact).

