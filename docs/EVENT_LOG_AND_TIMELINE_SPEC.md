## EVENT_LOG_AND_TIMELINE_SPEC.md
_Spec for Harmonyk's internal clock, event log, and time-based reasoning._

Last updated: 2025-12-22

---

## 1. Purpose

Harmonyk must never treat time as "abstract". Tasks, docs, and Maestro actions are inherently temporal:

- Tasks have schedules and slippage.
- Docs move through trails (draft → review → sent → signed → stored).
- Maestro learns from how long things actually take and how decisions play out.

This file defines the **minimum expectations** for timestamps and event logging so Maestro can provide reliable direction.

---

## 2. Core Requirements

1. **Authoritative server-side clock**
   - All system events use server time (`now()`) as ground truth.
   - User / workspace timezone is used only for display and human-friendly rules (today, tomorrow, next week).

2. **Immutable event log**
   - Key actions are written to an append-only `events` (or `activity_log`) table.
   - Events are never edited or deleted; corrections are new events.

3. **Entity state + event history**
   - Tables like `documents` and `tasks` store current state (status, due date, scores).
   - The event log stores **how they got there**, with timestamps.

Together, this supports:

- Reliable task scheduling and rescheduling.
- Trail analytics (where docs get stuck).
- Maestro calibration and "direction" suggestions.

---

## 3. Event Model Sketch

### 3.1 Event table (conceptual)

Suggested base fields:

- `id` – primary key.
- `workspace_id`
- `user_id` (nullable for system / Maestro events).
- `event_type` – string enum, examples:
  - `doc_created`
  - `doc_updated`
  - `doc_sent`
  - `doc_viewed`
  - `doc_signed`
  - `doc_promoted_to_record_of_truth`
  - `task_created`
  - `task_rescheduled`
  - `task_completed`
  - `maestro_suggestion_created`
  - `maestro_suggestion_applied`
  - `maestro_suggestion_rejected`
- `entity_type` – e.g. `document`, `task`, `playbook_run`, `decision`.
- `entity_id`
- `payload` – JSON with event-specific details.
- `created_at` – server timestamp, immutable.

Implementation can extend this, but these fields should exist in some form.

### 3.2 Example payload contents

For `task_rescheduled`:

- Old and new `due_at`.
- Whether it was auto-rescheduled by Maestro vs manually moved.

For `doc_promoted_to_record_of_truth`:

- Final version ID.
- Maestro scores at time of promotion.
- Flags indicating whether it was pushed to DocSafe Drive / Sentinel.

For `maestro_suggestion_created`:

- Suggestion type.
- `maestro_confidence_pct` and `maestro_clarity_pct` at creation.

---

## 4. Time Fields on Core Entities

### 4.1 Documents

Minimum recommended fields:

- `created_at`
- `updated_at`
- `last_sent_at` (nullable)
- `last_signed_at` (nullable)
- `trail_stage` (e.g. `draft`, `in_review`, `sent`, `waiting_signature`, `signed`, `archived`)
- `trail_stage_updated_at`
- `is_record_of_truth` (boolean, default false)
- `record_of_truth_at` (nullable)

These support:

- Workbench filters like "stuck > 14 days in review".
- Maestro signals like "docs waiting too long at a given stage".

### 4.2 Tasks

Minimum recommended fields:

- `created_at`
- `updated_at`
- `due_at` (nullable)
- `completed_at` (nullable)
- `canceled_at` (nullable)
- `origin` (manual, Maestro, playbook)

These support:

- Execution % (planned vs completed).
- Planning accuracy metrics.

---

## 5. Interaction with Maestro Scores

The event log and timestamps are used to:

1. **Compute OS-level KPIs**
   - Execution %, Quality %, Momentum % for a workspace.

2. **Calibrate Maestro confidence**
   - Compare historical `maestro_confidence_pct` values against actual outcomes and user ratings.

3. **Detect friction and risk**
   - Identify docs and trails that take unusually long or bounce between stages.
   - Suggest playbooks or interventions when patterns repeat.

All scoring logic in `MAESTRO_DIRECTION_AND_SCORES.md` assumes this event model exists.

---

## 6. DocSafe Sentinel – Time Anchors (Forward-Looking)

When integrated with DocSafe:

- Only a **small subset** of events should be anchored on-chain, typically:
  - `doc_promoted_to_record_of_truth`
  - `doc_signed` for key classes of agreement.
- Anchored data includes:
  - Hash of doc and key metadata.
  - Relevant timestamps.
  - Non-identifying reference IDs.

Harmonyk retains full internal history; DocSafe Sentinel provides **external, tamper-resistant anchors** for the critical milestones.

