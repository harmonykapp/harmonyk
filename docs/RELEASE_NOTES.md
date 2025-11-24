# Monolyth – Release Notes

This file tracks notable changes across tagged versions.

---

## v0.7.0 – Playbooks v1 (Week 7)

Tag: `v0.7.0-playbooks-v1`

### Highlights

- **Playbooks engine v1**

  - Deterministic interpreter for `definition_json` with:

    - Triggers

    - Conditions

    - Actions

    - Wait / Retry scaffolding

  - `playbook_runs` and `playbook_steps` tables for telemetry and debugging.

  - `/api/playbooks/run` and `/api/playbooks/undo` endpoints.

- **Playbooks UI**

  - `/playbooks` page:

    - List + detail layout.

    - Status (draft / enabled / disabled).

    - Scope summary and basic runs history.

  - Workbench integration:

    - "Run Playbook (dry-run)" action on document selection.

- **Seed library**

  - Dev seed for three library Playbooks:

    - Inbound NDA → Save→Sign→Share

    - Aging Proposals → Reminder / Share bump

    - Receipt → Vault

- **Events & dev testing**

  - `queuePlaybooksForEvent` helper for:

    - `share_link_created`

    - `signature_completed`

  - Dev-only endpoint:

    - `POST /api/dev/playbooks/test-event`

      - Exercises `queuePlaybooksForEvent` with fake payloads.

- **Insights integration**

  - `/api/insights/playbooks-summary`:

    - Aggregates recent `playbook_runs` and estimates time saved.

  - New card on `/insights`:

    - "Playbooks – Time Saved (v1)" with:

      - Total minutes / hours.

      - Run counts with/without detailed stats.

- **Docs**

  - `docs/PLAYBOOKS_V1.md` – spec and runbook for Playbooks v1.

  - `docs/QA_PLAYBOOKS_V1.md` – QA checklist for Week 7.

### Notes

- Event-driven Playbooks (from real Share/Sign traffic) are **hooked up**, but v1:

  - Does not yet expose a rich editor for building Playbooks.

  - Uses conservative defaults (e.g., 5 minutes per run when detailed stats are missing).

  - Treats undo as read-only context (no destructive reversals yet).

- Week 8+ will focus on:

  - Better Playbook editor UX.

  - Branching and richer conditions.

  - More precise time-saved stats and Insights views.

